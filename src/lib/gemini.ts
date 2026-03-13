import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateWithRetry(params: any, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.models.generateContent(params);
      return result;
    } catch (error: any) {
      const isQuotaExceeded = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaExceeded && i < retries - 1) {
        console.warn(`Quota exceeded, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
}

export const FALLBACK_RESOURCES = [
  { title: "Khan Academy - Personalized Learning", url: "https://www.khanacademy.org", type: "web" as const, description: "Expert-created content and resources for every course and level." },
  { title: "CrashCourse - Educational Videos", url: "https://www.youtube.com/user/crashcourse", type: "youtube" as const, description: "Tons of awesome courses in one awesome channel!" },
  { title: "Coursera - Online Courses", url: "https://www.coursera.org", type: "web" as const, description: "Learn without limits with world-class training and education." },
  { title: "TED-Ed - Lessons Worth Sharing", url: "https://ed.ted.com", type: "youtube" as const, description: "Carefully curated educational videos, many of which are collaborations between educators and animators." }
];
