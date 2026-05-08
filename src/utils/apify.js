// Apify API Integration Layer
// Replaces SociaVault — uses Apify Actors via REST API v2 for social media data scraping.
// Actors used:
//   Instagram: apify/instagram-scraper (profile + posts in one run)
//   Facebook:  apify/facebook-posts-scraper (posts with reactions) + apify/facebook-pages-scraper (profile)
//   LinkedIn:  curious_coder/linkedin-scraper (company profile + posts)

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN;
const APIFY_BASE = '/api/apify/v2';

// ─── CORE API HELPERS ────────────────────────────────────────

/**
 * Run an Apify actor synchronously and return the dataset items.
 * Uses the run-sync-get-dataset-items endpoint (max 300s timeout on Apify side).
 * Falls back to async polling if needed.
 */
async function runActorSync(actorId, input, timeoutSecs = 240) {
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${timeoutSecs}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (res.status === 408) {
    // Sync timed out — extract run ID from headers and poll
    const runId = res.headers.get('x-apify-run-id');
    if (runId) {
      return pollRunAndGetDataset(runId);
    }
    throw new Error('Apify actor timed out and no run ID was returned for polling.');
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Apify actor error (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * Run an Apify actor asynchronously and poll for completion.
 * Used when we expect the run to take longer than 300s.
 */
async function runActorAsync(actorId, input) {
  const startUrl = `${APIFY_BASE}/acts/${actorId}/runs?token=${APIFY_TOKEN}`;

  const startRes = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!startRes.ok) {
    const errorText = await startRes.text();
    throw new Error(`Apify actor start error (${startRes.status}): ${errorText}`);
  }

  const runData = await startRes.json();
  const runId = runData.data?.id;
  if (!runId) throw new Error('No run ID returned from Apify');

  return pollRunAndGetDataset(runId);
}

/**
 * Poll a run until it completes, then fetch the dataset items.
 */
async function pollRunAndGetDataset(runId, maxWaitMs = 300000) {
  const pollUrl = `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await sleep(5000);

    const pollRes = await fetch(pollUrl);
    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const status = pollData.data?.status;

    if (status === 'SUCCEEDED') {
      const datasetId = pollData.data?.defaultDatasetId;
      if (!datasetId) throw new Error('Run succeeded but no dataset ID found');

      const dsUrl = `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true`;
      const dsRes = await fetch(dsUrl);
      if (!dsRes.ok) throw new Error(`Failed to fetch dataset: ${dsRes.status}`);
      return dsRes.json();
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${status}: ${pollData.data?.statusMessage || 'Unknown error'}`);
    }
  }

  throw new Error('Apify run timed out after 5 minutes of polling');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractHandle(input) {
  if (!input) return '';
  let handle = input.replace(/^@/, '');
  try {
    if (handle.includes('instagram.com/')) {
      const url = new URL(handle.startsWith('http') ? handle : `https://${handle}`);
      handle = url.pathname.split('/').filter(Boolean)[0];
    }
  } catch(e) {}
  return handle || input;
}

// ─── INSTAGRAM ──────────────────────────────────────────────
// Uses apify/instagram-scraper — fetches profile + posts in a single run.
// Input: directUrls with the profile URL.
// Output: Array of items. First item is typically the profile, followed by posts.
// Or: We use "search" type with "user" searchType.

export async function fetchInstagramProfile(handle) {
  const cleanHandle = extractHandle(handle);
  const profileUrl = `https://www.instagram.com/${cleanHandle}/`;

  const items = await runActorSync('apify~instagram-profile-scraper', {
    usernames: [cleanHandle],
  });

  // The scraper returns an array of profile objects
  if (!items || items.length === 0) {
    throw new Error(`No Instagram profile data returned for @${cleanHandle}`);
  }

  // Return normalized profile data
  const profile = items[0];
  return {
    data: {
      user: {
        username: profile.username || cleanHandle,
        full_name: profile.fullName || profile.full_name || '',
        biography: profile.biography || profile.bio || '',
        follower_count: profile.followersCount || profile.followers_count || profile.followedBy || 0,
        following_count: profile.followsCount || profile.following_count || profile.follows || 0,
        is_business_account: profile.isBusinessAccount || profile.is_business || profile.isProfessional || false,
        is_professional_account: profile.isProfessional || profile.is_professional || false,
        category_name: profile.businessCategory || profile.category || profile.categoryName || '',
        edge_followed_by: { count: profile.followersCount || profile.followers_count || profile.followedBy || 0 },
        edge_follow: { count: profile.followsCount || profile.following_count || profile.follows || 0 },
      }
    }
  };
}

export async function fetchInstagramPosts(handle) {
  const cleanHandle = extractHandle(handle);

  const items = await runActorSync('apify~instagram-scraper', {
    directUrls: [`https://www.instagram.com/${cleanHandle}/`],
    resultsType: 'posts',
    resultsLimit: 50,
    searchType: 'user',
    searchLimit: 1,
  });

  if (!items || items.length === 0) {
    return { data: { items: [] } };
  }

  // Normalize posts to match the format metrics.js expects
  const normalizedPosts = items.map(post => ({
    like_count: post.likesCount || post.likes || post.likeCount || 0,
    comment_count: post.commentsCount || post.comments || post.commentCount || 0,
    caption: post.caption || post.text || post.description || '',
    taken_at_timestamp: post.timestamp ? Math.floor(new Date(post.timestamp).getTime() / 1000) : (post.takenAtTimestamp || 0),
    url: post.url || post.postUrl || post.displayUrl || null,
    code: post.shortCode || post.shortcode || post.code || '',
    media_type: post.type === 'Video' ? 2 : (post.type === 'Sidecar' ? 8 : 1),
    __typename: post.type === 'Video' ? 'GraphVideo' : (post.type === 'Sidecar' ? 'GraphSidecar' : 'GraphImage'),
    product_type: post.productType || post.type?.toLowerCase() || '',
    is_video: post.type === 'Video' || post.isVideo || false,
  }));

  return { data: { items: normalizedPosts } };
}

// ─── FACEBOOK ───────────────────────────────────────────────
// Uses apify/facebook-pages-scraper for profile data
// Uses apify/facebook-posts-scraper for post-level engagement data

export async function fetchFacebookProfile(url) {
  try {
    const items = await runActorSync('apify~facebook-pages-scraper', {
      startUrls: [{ url }],
    });

    if (!items || items.length === 0) {
      throw new Error('No Facebook page data returned');
    }

    const page = items[0];
    return {
      data: {
        data: {
          name: page.title || page.name || page.pageName || '',
          followerCount: page.likes || page.followers || page.followerCount || 0,
          followers: page.likes || page.followers || page.followerCount || 0,
          page_name: page.title || page.name || '',
          categories: page.categories || [],
          address: page.address || {},
          website: page.website || '',
          email: page.email || '',
        }
      }
    };
  } catch (error) {
    console.warn('Facebook profile scraper error, returning minimal data:', error.message);
    return {
      data: {
        data: {
          name: url.split('/').filter(Boolean).pop() || 'Unknown',
          followerCount: 0,
          followers: 0,
        }
      }
    };
  }
}

export async function fetchFacebookPosts(url) {
  try {
    const items = await runActorSync('apify~facebook-posts-scraper', {
      startUrls: [{ url }],
      resultsLimit: 50,
    });

    if (!items || items.length === 0) {
      return { data: { posts: [] } };
    }

    // Normalize posts to match the format metrics.js expects
    const normalizedPosts = items.map(post => ({
      likes: post.likes || post.likesCount || post.reactions || 0,
      like_count: post.likes || post.likesCount || post.reactions || 0,
      comments: post.comments || post.commentsCount || 0,
      comment_count: post.comments || post.commentsCount || 0,
      shares: post.shares || post.sharesCount || 0,
      share_count: post.shares || post.sharesCount || 0,
      text: post.text || post.message || post.postText || '',
      message: post.text || post.message || post.postText || '',
      caption: post.text || post.message || post.postText || '',
      isReel: post.isReel || false,
      is_reel: post.isReel || false,
      isVideo: post.isVideo || post.type === 'video' || false,
      is_video: post.isVideo || post.type === 'video' || false,
      type: post.type || 'post',
      url: post.url || post.postUrl || null,
      timestamp: post.time || post.timestamp || post.date || '',
    }));

    return { data: { posts: normalizedPosts } };
  } catch (error) {
    console.warn('Facebook posts endpoint error, falling back to empty:', error.message);
    return { data: { posts: [] } };
  }
}

// ─── LINKEDIN ───────────────────────────────────────────────
// Uses curious_coder/linkedin-scraper for company data (no login required)

export async function fetchLinkedInCompany(url) {
  try {
    const items = await runActorAsync('curious_coder~linkedin-scraper', {
      urls: [url],
      deepScrape: false,
    });

    if (!items || items.length === 0) {
      throw new Error('No LinkedIn company data returned');
    }

    const company = items[0];

    // Extract posts if available
    const posts = (company.posts || company.updates || company.recentUpdates || []).map(post => ({
      text: post.text || post.commentary || post.content || '',
      date: post.postedAt || post.date || post.timestamp || '',
      url: post.url || post.postUrl || post.permalink || null,
      likes: post.likes || post.numLikes || 0,
      comments: post.comments || post.numComments || 0,
    }));

    return {
      data: {
        data: {
          name: company.name || company.companyName || '',
          followerCount: company.followersCount || company.followerCount || company.followers || 0,
          follower_count: company.followersCount || company.followerCount || company.followers || 0,
          employeeCount: company.employeesCount || company.employeeCount || company.staffCount || 0,
          employee_count: company.employeesCount || company.employeeCount || company.staffCount || 0,
          industry: company.industry || company.industries?.[0] || '',
          specialties: company.specialties || company.specialities || [],
          description: company.description || '',
          website: company.website || '',
          posts: posts,
        }
      }
    };
  } catch (error) {
    console.warn('LinkedIn scraper error:', error.message);
    throw error;
  }
}

// ─── CREDIT/COST ESTIMATION ─────────────────────────────────
// Apify uses Compute Units ($0.30/CU on free tier)
// Rough estimates per actor run:
//   IG Profile: ~0.01 CU, IG Posts: ~0.05 CU
//   FB Profile: ~0.01 CU, FB Posts: ~0.05 CU
//   LinkedIn:   ~0.03 CU

export function calculateCredits(brands, platforms) {
  // Now showing estimated Apify compute cost instead of SociaVault credits
  let runs = 0;
  const brandCount = brands.length;

  if (platforms.instagram) runs += brandCount * 2; // profile + posts
  if (platforms.facebook) runs += brandCount * 2;  // profile + posts
  if (platforms.linkedin) runs += brandCount * 1;  // company (posts included)

  return runs;
}

// ─── FULL BRAND FETCH ───────────────────────────────────────

export async function fetchBrandData(brand, platforms, onProgress) {
  const data = { name: brand.name };

  if (platforms.instagram && brand.instagram) {
    try {
      onProgress?.(`Fetching @${brand.instagram} Instagram profile via Apify...`);
      data.instagramProfile = await fetchInstagramProfile(brand.instagram);
      onProgress?.(`Fetching @${brand.instagram} Instagram posts via Apify...`);
      data.instagramPosts = await fetchInstagramPosts(brand.instagram);
      onProgress?.(`✓ Instagram data for ${brand.name} complete`);
    } catch (err) {
      onProgress?.(`✗ Instagram error for ${brand.name}: ${err.message}`);
      data.instagramError = err.message;
    }
  }

  if (platforms.facebook && brand.facebook) {
    try {
      onProgress?.(`Fetching ${brand.name} Facebook profile via Apify...`);
      data.facebookProfile = await fetchFacebookProfile(brand.facebook);
      onProgress?.(`Fetching ${brand.name} Facebook posts via Apify...`);
      data.facebookPosts = await fetchFacebookPosts(brand.facebook);
      onProgress?.(`✓ Facebook data for ${brand.name} complete`);
    } catch (err) {
      onProgress?.(`✗ Facebook error for ${brand.name}: ${err.message}`);
      data.facebookError = err.message;
    }
  }

  if (platforms.linkedin && brand.linkedin) {
    try {
      onProgress?.(`Fetching ${brand.name} LinkedIn company via Apify...`);
      data.linkedinCompany = await fetchLinkedInCompany(brand.linkedin);
      onProgress?.(`✓ LinkedIn data for ${brand.name} complete`);
    } catch (err) {
      onProgress?.(`✗ LinkedIn error for ${brand.name}: ${err.message}`);
      data.linkedinError = err.message;
    }
  }

  return data;
}
