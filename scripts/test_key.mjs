import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAIv-I6h1WZZ2dlWo0y6CBfL0WA4n7BgWI");
const model = genAI.getGenerativeModel({ model: "gemini-3.1-Pro" });

async function run() {
    try {
        const result = await model.generateContent("Hello, are you there?");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("FAILED:", e.message);
    }
}
run();
