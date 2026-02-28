import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testGemini() {
    console.log("Testing Gemini API...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ No GEMINI_API_KEY found in .env.local");
        return;
    }
    console.log("Key found (starts with):", key.substring(0, 5) + "...");

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
        
        console.log("Generating content...");
        const result = await model.generateContent("Hello, are you working? Reply with 'Yes, I am alive'.");
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ Gemini Response:", text);
    } catch (error: any) {
        console.error("❌ Gemini Error:", error.message);
    }
}

testGemini();
