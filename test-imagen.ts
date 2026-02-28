import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const run = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`

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
        else console.log("Success! base64 length:", data.predictions[0].bytesBase64Encoded.length)
    } catch (e) {
        console.error(e)
    }
}
run()
