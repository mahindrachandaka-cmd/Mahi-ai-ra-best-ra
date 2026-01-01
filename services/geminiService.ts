
import { GoogleGenAI, Type } from "@google/genai";
import { FileContent } from "../types";

const APP_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      language: { type: Type.STRING },
      content: { type: Type.STRING },
      path: { type: Type.STRING },
    },
    required: ["name", "language", "content", "path"]
  }
};

export const generateAppCode = async (prompt: string, onUpdate?: (msg: string) => void): Promise<FileContent[]> => {
  onUpdate?.("Initializing Gemini Synthesis Engine...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        role: "user", 
        parts: [{ text: `Generate a professional, fully functional web application based on this prompt: "${prompt}".
        
        You MUST return the output as a JSON array of objects. 
        Each object MUST have these properties:
        - "name": filename
        - "language": language identifier
        - "content": the full source code string
        - "path": the relative path

        Requirement: A modern, responsive app with index.html, styles.css, and script.js at minimum.` }]
      }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: APP_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Synthesis Engine.");
    return JSON.parse(text) as FileContent[];
  } catch (error: any) {
    console.error("Gemini Synthesis Error:", error);
    throw new Error(error.message || "Failed to synthesize project code.");
  }
};

export const updateAppCode = async (
  currentFiles: FileContent[], 
  request: string, 
  onUpdate?: (msg: string) => void
): Promise<FileContent[]> => {
  onUpdate?.("Analyzing existing architecture...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const contextStr = currentFiles.map(f => `FILE: ${f.path}\nCONTENT:\n${f.content}`).join('\n\n---\n\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Use Pro for complex reasoning/refactoring
      contents: [{ 
        role: "user", 
        parts: [{ text: `You are an expert AI Developer. Modify the following project based on the user request: "${request}".
        
        EXISTING PROJECT CONTEXT:
        ${contextStr}

        DIRECTIONS:
        1. Modify only what is necessary or add new files to satisfy the request.
        2. Ensure all files still work together perfectly.
        3. Return the COMPLETE set of all files for the project (even unchanged ones) in the JSON format.

        Return a JSON array of file objects with name, language, content, and path.` }]
      }],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: APP_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("Synthesis Engine returned no data.");
    return JSON.parse(text) as FileContent[];
  } catch (error: any) {
    console.error("Gemini Update Error:", error);
    throw new Error(error.message || "Failed to refactor project code.");
  }
};
