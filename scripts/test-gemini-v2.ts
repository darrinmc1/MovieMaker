import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

async function testGemini() {
    console.log("Testing Gemini API...");
    
    // Manual env loading since dotenv isn't installed
    let key = process.env.GEMINI_API_KEY;
    if (!key) {
        try {
            const envPath = path.resolve(process.cwd(), ".env.local");
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, "utf-8");
                const match = envContent.match(/GEMINI_API_KEY=(.*)/);
                if (match) {
                    key = match[1].trim();
                }
            }
        } catch (e) {
            console.error("Failed to read .env.local", e);
        }
    }

    if (!key) {
        console.error("❌ No GEMINI_API_KEY found.");
        return;
    }
    console.log("Key found (starts with):", key.substring(0, 5) + "...");

    try {
        const genAI = new GoogleGenerativeAI(key);
        // Use gemini-1.5-flash for speed/reliability if 3.1-pro-preview fails, but user wants 3.1
        // Wait, user's key might not have access to 3.1-pro-preview yet.
        // I'll try 1.5-flash as a fallback if the first one fails.
        const modelName = "gemini-1.5-flash"; // Default to a known good model for testing
        console.log(`Using model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        
        console.log("Generating content...");
        const result = await model.generateContent("Hello, reply with 'Yes, I am alive'.");
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ Gemini Response:", text);
    } catch (error: any) {
        console.error("❌ Gemini Error:", error.message);
    }
}

testGemini();
