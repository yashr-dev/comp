// Gemini API Integration
// Handles communication with Gemini 3.1 Pro Preview for strategic analysis

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-pro-preview';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

import { SYSTEM_KNOWLEDGE_BASE } from './knowledgeBase';

export async function runGeminiAnalysis(userPrompt, onProgress) {
  onProgress?.('Sending data to Gemini 3.1 Pro Preview for strategic analysis...');
  
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
  
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
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
    onProgress?.(`✗ Gemini error: ${error.message}`);
    throw error;
  }
}
