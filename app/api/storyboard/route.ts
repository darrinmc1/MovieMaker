import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided for storyboard extraction" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        scenes: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    id: { type: SchemaType.STRING, description: "Unique scene ID (e.g. scene-1)" },
                                    setting: { type: SchemaType.STRING, description: "Brief description of the time and place" },
                                    action: { type: SchemaType.STRING, description: "What is physically happening" },
                                    imagePrompt: { type: SchemaType.STRING, description: "A detailed, visual midjourney-style image prompt for DALL-E 3. Include lighting, mood, character appearance, and camera angle." },
                                    narration: { type: SchemaType.STRING, description: "A line of narration or dialogue for this scene" }
                                },
                                required: ["id", "setting", "action", "imagePrompt", "narration"]
                            }
                        }
                    },
                    required: ["scenes"]
                }
            }
        });

        const prompt = `
You are a highly visual movie director and storyboard artist. I will provide a piece of text from a story.
Read the text and break it down into 3-6 distinct sequential visual beats (scenes).
For each scene, provide a highly descriptive 'imagePrompt' that could be fed into an AI image generator like DALL-E 3 to get a cinematic, photorealistic keyframe.

Text to storyboard:
"""
${text}
"""
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Storyboard extraction failed:", error);
        return NextResponse.json({
            error: "Failed to extract storyboard scenes",
            details: error.message
        }, { status: 500 });
    }
}
