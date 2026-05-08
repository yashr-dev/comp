// Local Metrics Calculation Engine
// All math is done here so the AI doesn't hallucinate numbers

// ─── INSTAGRAM METRICS ──────────────────────────────────────

export function calculateInstagramMetrics(profile, posts) {
  if (!profile || !posts) return null;
  
  // Extract profile data (handle nested structures from Apify)
  const igUser = profile.data?.data?.user || profile.data?.user || profile.data || profile;
  
  const followerCount = igUser.follower_count || igUser.followers || igUser.edge_followed_by?.count || 0;
  const followingCount = igUser.following_count || igUser.following || igUser.edge_follow?.count || 0;
  const bio = igUser.biography || igUser.bio || '';
  const isBusinessAccount = igUser.is_business_account || igUser.is_business || igUser.is_professional_account || false;
  const category = igUser.category_name || igUser.business_category_name || igUser.category || '';
  const handle = igUser.username || '';
  
  // Extract posts array (Apify IG posts return as normalized items in data.items)
  let postsList = [];
  const items = posts.data?.items || posts.items || posts.data || posts;
  if (Array.isArray(items)) {
    postsList = items;
  } else if (typeof items === 'object' && items !== null) {
    // If it's an object with numerical keys {"0": {}, "1": {}}
    postsList = Object.values(items).filter(item => typeof item === 'object' && item !== null);
  }
  
  if (postsList.length === 0) {
    return {
      handle,
      followers: followerCount,
      following: followingCount,
      bio,
      isBusinessAccount,
      category,
      postsAnalyzed: 0,
      avgLikes: 0,
      avgComments: 0,
      engagementRate: 0,
      likeToCommentRatio: 0,
      formatMix: { image: 0, video: 0, carousel: 0 },
      postingFrequency: 0,
      topPosts: [],
    };
  }
  
  // Calculate per-post metrics
  let totalLikes = 0;
  let totalComments = 0;
  let formatCounts = { image: 0, video: 0, carousel: 0 };
  
  const enrichedPosts = postsList.map(post => {
    const likes = post.like_count || post.likes || post.edge_media_preview_like?.count || 0;
    const comments = post.comment_count || post.comments || post.edge_media_to_comment?.count || 0;
    const type = post.__typename || post.type || post.media_type || post.product_type || '';
    const captionObj = post.caption || post.edge_media_to_caption?.edges?.[0]?.node || {};
    const caption = typeof captionObj === 'string' ? captionObj : captionObj.text || '';
    const timestamp = post.taken_at_timestamp || post.taken_at || post.timestamp || 0;
    const url = post.url || (post.code ? `https://instagram.com/p/${post.code}/` : null);
    
    totalLikes += likes;
    totalComments += comments;
    
    // Classify format
    let format = 'Image';
    if (type === 'GraphSidecar' || type === 'carousel' || post.media_type === 8) {
      format = 'Carousel';
      formatCounts.carousel++;
    } else if (type === 'GraphVideo' || type === 'video' || type === 'clips' || type === 'igtv' || post.media_type === 2 || post.is_video) {
      format = 'Video/Reel';
      formatCounts.video++;
    } else {
      formatCounts.image++;
    }
    
    // Per-post engagement rate
    const er = followerCount > 0 ? ((likes + comments) / followerCount) * 100 : 0;
    
    return { likes, comments, format, caption, timestamp, url, engagementRate: er };
  });
  
  const postCount = postsList.length;
  const avgLikes = totalLikes / postCount;
  const avgComments = totalComments / postCount;
  const engagementRate = followerCount > 0 ? ((avgLikes + avgComments) / followerCount) * 100 : 0;
  const likeToCommentRatio = avgComments > 0 ? Math.round(avgLikes / avgComments) : 0;
  
  // Format mix percentages
  const formatMix = {
    image: Math.round((formatCounts.image / postCount) * 100),
    video: Math.round((formatCounts.video / postCount) * 100),
    carousel: Math.round((formatCounts.carousel / postCount) * 100),
  };
  
  // Posting frequency (posts per week) using median gap to ignore pinned post outliers
  const timestamps = enrichedPosts.map(p => p.timestamp).filter(t => t > 0).sort((a, b) => a - b);
  let postingFrequency = 0;
  if (timestamps.length >= 2) {
    const gaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push(timestamps[i] - timestamps[i - 1]);
    }
    gaps.sort((a, b) => a - b);
    const medianGapSeconds = gaps[Math.floor(gaps.length / 2)];
    const medianGapDays = medianGapSeconds / (60 * 60 * 24);
    
    // If median gap is less than an hour (which happens if multiple posts are made at once), fallback
    if (medianGapDays > 0.04) {
      postingFrequency = Math.round((7 / medianGapDays) * 10) / 10;
    } else {
      // Fallback to simple average if median gap is tiny (edge case)
      const oldest = timestamps[0];
      const newest = timestamps[timestamps.length - 1];
      const daySpan = (newest - oldest) / (60 * 60 * 24);
      postingFrequency = daySpan > 0 ? Math.round((postCount / daySpan) * 7 * 10) / 10 : postCount;
    }
  }
  
  // Sort posts by ER
  const sortedPosts = [...enrichedPosts].sort((a, b) => b.engagementRate - a.engagementRate);
  
  // Top 3 posts by engagement rate
  const topPosts = sortedPosts.slice(0, 3).map(p => ({
    caption: p.caption.substring(0, 200),
    likes: p.likes,
    comments: p.comments,
    engagementRate: Math.round(p.engagementRate * 100) / 100,
    format: p.format,
    url: p.url,
  }));
  
  // Worst 3 posts by engagement rate
  const worstPosts = sortedPosts.slice().reverse().slice(0, 3).map(p => ({
    caption: p.caption.substring(0, 200),
    likes: p.likes,
    comments: p.comments,
    engagementRate: Math.round(p.engagementRate * 100) / 100,
    format: p.format,
    url: p.url,
  }));
  
  return {
    handle,
    followers: followerCount,
    following: followingCount,
    bio,
    isBusinessAccount,
    category,
    postsAnalyzed: postCount,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments * 10) / 10,
    engagementRate: Math.round(engagementRate * 100) / 100,
    likeToCommentRatio,
    formatMix,
    postingFrequency,
    topPosts,
    worstPosts,
    allPosts: enrichedPosts,
  };
}

// ─── FACEBOOK METRICS ────────────────────────────────────────

export function calculateFacebookMetrics(profile, posts) {
  if (!profile || !posts) return null;
  
  const profileData = profile.data?.data || profile.data || profile;
  const pageName = profileData.name || profileData.page_name || '';
  const followers = profileData.followerCount || profileData.followers || profileData.follower_count || profileData.likes || 0;
  
  let postsList = [];
  const postsArray = posts.data?.posts || posts.data || posts.posts || posts || [];
  if (Array.isArray(postsArray)) {
    postsList = postsArray;
  } else if (typeof postsArray === 'object' && postsArray !== null && !postsArray.error) {
    postsList = Object.values(postsArray).filter(item => typeof item === 'object');
  }
  
  if (postsList.length === 0) {
    return {
      pageName,
      followers,
      postsAnalyzed: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      engagementRate: 0,
      formatMix: 'N/A',
      topPosts: [],
      hasPostData: false
    };
  }
  
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let formatCounts = { reel: 0, video: 0, static: 0 };
  
  const enrichedPosts = postsList.map(post => {
    const likes = post.likes || post.like_count || post.reactions || 0;
    const comments = post.comments || post.comment_count || 0;
    const shares = post.shares || post.share_count || 0;
    const caption = post.text || post.message || post.caption || '';
    
    totalLikes += likes;
    totalComments += comments;
    totalShares += shares;
    
    let format = 'Static';
    if (post.isReel || post.is_reel) {
      format = 'Reel';
      formatCounts.reel++;
    } else if (post.isVideo || post.is_video || post.type === 'video') {
      format = 'Video';
      formatCounts.video++;
    } else {
      formatCounts.static++;
    }
    
    const er = followers > 0 ? ((likes + comments) / followers) * 100 : 0;
    
    return { likes, comments, shares, format, caption, engagementRate: er };
  });
  
  const postCount = postsList.length;
  const avgLikes = totalLikes / postCount;
  const avgComments = totalComments / postCount;
  const avgShares = totalShares / postCount;
  const engagementRate = followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0;
  
  const formatMix = `${Math.round((formatCounts.reel / postCount) * 100)}% Reel, ${Math.round((formatCounts.video / postCount) * 100)}% Video, ${Math.round((formatCounts.static / postCount) * 100)}% Static`;
  
  const topPosts = [...enrichedPosts]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 3)
    .map(p => ({
      caption: p.caption.substring(0, 200),
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      engagementRate: Math.round(p.engagementRate * 100) / 100,
      format: p.format,
    }));
  
  return {
    pageName,
    followers,
    postsAnalyzed: postCount,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments * 10) / 10,
    avgShares: Math.round(avgShares * 10) / 10,
    engagementRate: Math.round(engagementRate * 100) / 100,
    formatMix,
    topPosts,
    hasPostData: true,
  };
}

// ─── LINKEDIN METRICS ────────────────────────────────────────

export function calculateLinkedInMetrics(companyData) {
  if (!companyData) return null;
  
  const data = companyData.data?.data || companyData.data || companyData;
  const companyName = data.name || data.company_name || '';
  const followers = data.followerCount || data.follower_count || data.followers || 0;
  const employeeCount = data.employeeCount || data.employee_count || data.staff_count || 0;
  const industry = data.industry || '';
  const specialties = data.specialties || data.specialities || [];
  
  // Extract posts if available
  let postsList = [];
  const postsArray = data.posts || data.recent_posts || data.updates || [];
  if (Array.isArray(postsArray)) {
    postsList = postsArray;
  } else if (typeof postsArray === 'object' && postsArray !== null) {
    postsList = Object.values(postsArray).filter(item => typeof item === 'object');
  }
  
  const recentPosts = postsList.slice(0, 10).map(post => ({
    date: post.date || post.posted_at || post.timestamp || '',
    text: (post.text || post.commentary || post.content || '').substring(0, 200),
    url: post.url || post.post_url || post.link || post.permalink || null
  }));
  
  return {
    companyName,
    followers,
    employeeCount,
    industry,
    specialties: Array.isArray(specialties) ? specialties.join(', ') : specialties,
    recentPosts,
    postsAnalyzed: recentPosts.length,
  };
}

// ─── CROSS-BRAND CONTEXT ─────────────────────────────────────

export function calculateDynamicContext(allBrandMetrics) {
  if (!allBrandMetrics || allBrandMetrics.length === 0) return '';
  
  // Find highest ER brand (Instagram)
  const igBrands = allBrandMetrics.filter(b => b.instagram?.engagementRate > 0);
  const highestER = igBrands.length > 0 
    ? igBrands.reduce((a, b) => a.instagram.engagementRate > b.instagram.engagementRate ? a : b) 
    : null;
  
  // Find most frequent poster
  const posters = allBrandMetrics.filter(b => b.instagram?.postingFrequency > 0);
  const mostFrequent = posters.length > 0
    ? posters.reduce((a, b) => a.instagram.postingFrequency > b.instagram.postingFrequency ? a : b)
    : null;
  
  // Find highest L:C ratio
  const lcBrands = igBrands.filter(b => b.instagram?.likeToCommentRatio > 0);
  const highestLC = lcBrands.length > 0
    ? lcBrands.reduce((a, b) => a.instagram.likeToCommentRatio > b.instagram.likeToCommentRatio ? a : b)
    : null;
  
  // Average ER
  const avgER = igBrands.length > 0
    ? igBrands.reduce((sum, b) => sum + b.instagram.engagementRate, 0) / igBrands.length
    : 0;
  
  // Most common format
  const formatTotals = { image: 0, video: 0, carousel: 0 };
  igBrands.forEach(b => {
    formatTotals.image += b.instagram?.formatMix?.image || 0;
    formatTotals.video += b.instagram?.formatMix?.video || 0;
    formatTotals.carousel += b.instagram?.formatMix?.carousel || 0;
  });
  
  let dominantFormat = 'Image';
  if (Object.keys(formatTotals).length > 0 && igBrands.length > 0) {
    dominantFormat = Object.entries(formatTotals).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
  
  let context = `## PRE-CALCULATED CONTEXT (verified, do not recalculate)\n`;
  
  if (highestER) {
    context += `- The brand with the highest Instagram ER is: ${highestER.name} at ${highestER.instagram.engagementRate}%\n`;
  }
  if (mostFrequent) {
    context += `- The brand with the most posts/week is: ${mostFrequent.name} at ${mostFrequent.instagram.postingFrequency}/week\n`;
  }
  if (highestLC) {
    context += `- The brand with the highest L:C ratio is: ${highestLC.name} at ${highestLC.instagram.likeToCommentRatio}:1\n`;
  }
  if (igBrands.length > 0) {
    context += `- The most common format across competitors is: ${dominantFormat} at ${Math.round(formatTotals[dominantFormat] / igBrands.length)}% average\n`;
    context += `- Average ER across the competitive set is: ${Math.round(avgER * 100) / 100}%\n`;
  }
  
  // Client vs average
  const client = allBrandMetrics[0]; // First brand is always the client
  if (client?.instagram?.engagementRate > 0 && avgER > 0) {
    const diff = client.instagram.engagementRate - avgER;
    context += `- Client is ${diff > 0 ? 'above' : 'below'} the competitive average by ${Math.abs(Math.round(diff * 100) / 100)}%\n`;
  }
  
  return context;
}
