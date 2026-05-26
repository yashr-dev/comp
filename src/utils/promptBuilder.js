import { calculateDynamicContext } from './metrics';

function fmtIG(ig, name) {
  if (!ig) return `Instagram: Data not available for ${name}\n`;
  let s = `Instagram:\n- Handle: @${ig.handle}\n- Followers: ${ig.followers.toLocaleString()}\n- Following: ${ig.following.toLocaleString()}\n- Posts Analyzed: ${ig.postsAnalyzed}\n- Bio: "${ig.bio}"\n- Is Business Account: ${ig.isBusinessAccount ? 'Yes' : 'No'}\n- Category: ${ig.category || 'N/A'}\n- Avg Likes/Post: ${ig.avgLikes.toLocaleString()}\n- Avg Comments/Post: ${ig.avgComments}\n- Engagement Rate: ${ig.engagementRate}%\n- Like-to-Comment Ratio: ${ig.likeToCommentRatio}:1\n- Format Mix: ${ig.formatMix.image}% Image, ${ig.formatMix.video}% Video/Reel, ${ig.formatMix.carousel}% Carousel\n- Posting Frequency: ${ig.postingFrequency} posts/week\n`;
  if (ig.topPosts.length > 0) {
    s += `- Top 3 Posts (by engagement rate):\n`;
    ig.topPosts.forEach((p, i) => {
      s += `  ${i+1}. Caption: "${p.caption}" | Likes: ${p.likes.toLocaleString()} | Comments: ${p.comments} | ER: ${p.engagementRate}% | Format: ${p.format}\n`;
    });
  }
  return s;
}

function fmtFB(fb, name) {
  if (!fb) return `Facebook: Data not available for ${name}\n`;
  let s = `Facebook:\n- Page Name: ${fb.pageName}\n- Followers/Likes: ${fb.followers.toLocaleString()}\n- Posts Analyzed: ${fb.postsAnalyzed}\n- Avg Likes/Post: ${fb.avgLikes.toLocaleString()}\n- Avg Comments/Post: ${fb.avgComments}\n- Avg Shares/Post: ${fb.avgShares}\n- Engagement Rate: ${fb.engagementRate}%\n- Format Mix: ${fb.formatMix}\n`;
  if (fb.topPosts.length > 0) {
    s += `- Top 3 Posts:\n`;
    fb.topPosts.forEach((p, i) => {
      s += `  ${i+1}. Caption: "${p.caption}" | Likes: ${p.likes.toLocaleString()} | Comments: ${p.comments} | Shares: ${p.shares} | Format: ${p.format}\n`;
    });
  }
  return s;
}

function fmtLI(li, name) {
  if (!li) return `LinkedIn: Data not available for ${name}\n`;
  let s = `LinkedIn:\n- Company Name: ${li.companyName}\n`;
  s += li.followers > 0 ? `- Followers: ${li.followers.toLocaleString()}\n` : `- Followers: Not available via API (cookie-free scraping)\n`;
  s += li.employeeCount > 0 ? `- Employee Count: ${li.employeeCount.toLocaleString()}\n` : '';
  if (li.industry) s += `- Industry: ${li.industry}\n`;
  if (li.specialties) s += `- Specialties: ${li.specialties}\n`;
  s += `- Posts Analyzed: ${li.postsAnalyzed}\n`;
  if (li.hasPostData) {
    s += `- Avg Likes/Post: ${li.avgLikes}\n- Avg Comments/Post: ${li.avgComments}\n- Avg Shares/Post: ${li.avgShares}\n`;
  }
  if (li.topPosts && li.topPosts.length > 0) {
    s += `- Top 3 Posts (by engagement):\n`;
    li.topPosts.forEach((p, i) => {
      s += `  ${i+1}. Text: "${p.text}" | Likes: ${p.likes} | Comments: ${p.comments} | Shares: ${p.shares}\n`;
    });
  } else if (li.recentPosts && li.recentPosts.length > 0) {
    s += `- Recent Posts (${li.postsAnalyzed} posts):\n`;
    li.recentPosts.forEach((p, i) => {
      s += `  ${i+1}. Date: ${p.date} | Likes: ${p.likes || 0} | Comments: ${p.comments || 0} | Text: "${p.text}"\n`;
    });
  }
  return s;
}

function fmtBrand(brand, label) {
  return `### ${label}: ${brand.name}\n\n${fmtIG(brand.instagram, brand.name)}\n${fmtFB(brand.facebook, brand.name)}\n${fmtLI(brand.linkedin, brand.name)}`;
}

const ANALYSIS_REQUEST = `## ANALYSIS REQUIRED

You are an expert digital marketing strategist at DigiChefs. 
You must generate a competitive audit presentation formatted STRICTLY as a JSON object. Do NOT use markdown blocks.

The JSON MUST match this exact schema:
{
  "brandPositioning": [
    {
      "brand": "Competitor Name",
      "communicationLine": "A 1-sentence core communication line (e.g. 'Exquisite Designs for Every Occasion')",
      "tonality": "3-4 comma-separated words (e.g. 'Warm, Trust-Centric, Heritage-Driven')",
      "positioning": "1-2 sentences on how they position themselves in the market",
      "communicationThemes": "Comma-separated list of their core overarching themes"
    }
  ],
  "platformStrategy": {
    "instagram": [
      {
        "brand": "Competitor Name",
        "formats": "Estimated breakdown of formats (e.g. '~83% Static and Carousel, ~17% Reels')",
        "themes": "What specific themes they talk about on this platform"
      }
    ],
    "facebook": [
      {
        "brand": "Competitor Name",
        "formats": "Estimated breakdown of formats",
        "themes": "What specific themes they talk about on this platform"
      }
    ],
    "linkedin": [
      {
        "brand": "Competitor Name",
        "formats": "Estimated breakdown of formats (e.g. '100% Posts')",
        "themes": "What specific themes they talk about on this platform"
      }
    ]
  }
}

IMPORTANT: Analyze ALL brands provided, including the client brand and all competitors. Base all insights on the scraped data. Be incredibly precise and pitch-ready.`;

export function buildAnalysisPrompt(clientBrand, competitors, industry) {
  const allBrands = [clientBrand, ...competitors];
  const ctx = calculateDynamicContext(allBrands);
  let prompt = `## COMPETITIVE SOCIAL MEDIA AUDIT\n\n### Industry: ${industry}\n\n${ctx}\n\n---\n\n`;
  prompt += fmtBrand(clientBrand, 'CLIENT BRAND') + '\n\n---\n\n';
  competitors.forEach((c, i) => { prompt += fmtBrand(c, `COMPETITOR ${i+1}`) + '\n\n---\n\n'; });
  prompt += ANALYSIS_REQUEST;
  return prompt;
}
