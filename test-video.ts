import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const run = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        // Google Veo is their video model, checking if accessible
        const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-0.1-generate-001:predict?key=${apiKey}`

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt: "A cinematic shot of a futuristic city" }],
                parameters: { sampleCount: 1 }
            })
        })
        const data = await res.json()
        console.log("Status:", res.status)
        if (data.error) console.log("Error:", data.error.message)
        else console.log("Success:", data)
    } catch (e) {
        console.error(e)
    }
}
run()
