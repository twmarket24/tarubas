import { GoogleGenAI, Type } from "@google/genai";

// Use the specific model requested by the legacy code
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

// System instruction to guide the model
const SYSTEM_INSTRUCTION = "You are an expert OCR and object recognition system for food and household product inventory. Your task is to extract a product name and an expiry date from images. The expiry date must be returned in YYYY-MM-DD format. If a specific date is unclear, prioritize year-month (YYYY-MM-01). If no date is found, use the current date plus one year. Respond ONLY with a single JSON object.";

export interface GeminiAnalysisResult {
    productName: string;
    expiryDate: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImages = async (
    imagesBase64: string[],
    prompt: string
): Promise<GeminiAnalysisResult> => {
    
    // Prepare contents: prompt text + inline images
    const parts: any[] = [{ text: prompt }];
    
    imagesBase64.forEach(base64 => {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64
            }
        });
    });

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: {
                role: 'user',
                parts: parts
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { 
                            type: Type.STRING,
                            description: "The name of the product found."
                        },
                        expiryDate: { 
                            type: Type.STRING,
                            description: "The expiry date in YYYY-MM-DD format."
                        }
                    },
                    required: ["productName", "expiryDate"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as GeminiAnalysisResult;
        }
        
        throw new Error("Empty response from AI");

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to analyze images. Please try again.");
    }
};