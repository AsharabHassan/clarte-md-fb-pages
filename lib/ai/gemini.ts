import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// 'gemini-2.5-flash-image' (display "Nano Banana") — GA replacement for the
// older 'gemini-2.5-flash-image-preview', which Google removed from v1beta
// during sub-project #2's writing. Verified live via `ai.models.list()` on
// 2026-05-17. If/when Nano Banana 2 (`gemini-3.1-flash-image-preview`) goes
// GA, swap to that.
export const MODEL_GENERATE_IMAGE = 'gemini-2.5-flash-image';
export const MODEL_ANALYSIS = 'gemini-2.5-pro';
