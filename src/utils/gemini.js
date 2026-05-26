// Gemini API Integration
// Handles communication with Gemini 3.1 Pro Preview for strategic analysis

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

import { SYSTEM_KNOWLEDGE_BASE } from './knowledgeBase';

export async function runGeminiAnalysis(userPrompt, onProgress) {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set — check your .env file');
  }
  onProgress?.('Sending data to Gemini 3.1 Flash for strategic analysis...');
  
  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_KNOWLEDGE_BASE }]
    },
    contents: [{
      parts: [{ text: userPrompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 65536,
    },
  };
  
  let retries = 3;
  let delayMs = 15000; // Start with 15s delay

  while (retries >= 0) {
    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // If it's a rate limit (429) or server error (500, 503) and we have retries left
        if ((response.status === 429 || response.status >= 500) && retries > 0) {
          // Try to extract exact retry time from error message if provided
          let waitTime = delayMs;
          const match = errorText.match(/retry in ([\d.]+)s/i);
          if (match && match[1]) {
            waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 2000; // Exact + 2s buffer
          }
          
          onProgress?.(`⚠️ Gemini rate limit reached. Retrying in ${Math.round(waitTime / 1000)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          retries--;
          delayMs *= 2; // Exponential backoff
          continue; // Retry
        }
        
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      onProgress?.('✓ AI analysis complete');
      
      // Extract text from response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        throw new Error('No text in Gemini response');
      }
      
      return text;
    } catch (error) {
      // Re-throw if no retries left or if it's not a fetch/network error that we caught above
      if (retries === 0 || error.message.includes('No text in Gemini')) {
        onProgress?.(`✗ Gemini error: ${error.message}`);
        throw error;
      }
      
      onProgress?.(`⚠️ Network error. Retrying in ${Math.round(delayMs / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      retries--;
      delayMs *= 2;
    }
  }
}
