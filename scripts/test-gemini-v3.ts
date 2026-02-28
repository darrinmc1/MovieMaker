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
        // List models
        /*
        // Google Generative AI Node SDK doesn't expose listModels directly on the main class easily in v0.1.
        // It's usually via google-ai-studio or REST.
        // But the error message said "Call ListModels".
        // Let's try a known standard model: gemini-pro
        */
        
        const modelName = "gemini-3.1-pro-preview"; 
        console.log(`Using model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        
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
