import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import Replicate from "replicate";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "No image prompt provided" }, { status: 400 });
        }

        const falKey = process.env.FAL_KEY;
        const replicateKey = process.env.REPLICATE_API_TOKEN;
        const geminiKey = process.env.GEMINI_API_KEY;

        // 1. Try Fal.ai (Flux.1 Pro/Schnell)
        if (falKey) {
            try {
                // Configure fal instance since Next.js server limits auto-detection
                fal.config({ credentials: () => falKey });

                const result = await fal.subscribe("fal-ai/flux/schnell", {
                    input: {
                        prompt: prompt,
                        image_size: "landscape_16_9"
                    },
                    logs: true,
                });

                if (result.data && result.data.images && result.data.images.length > 0) {
                    return NextResponse.json({ imageUrl: result.data.images[0].url });
                }
            } catch (err) {
                console.warn("Fal.ai generation failed, trying next provider:", err);
            }
        }

        // 2. Try Replicate (Flux.1 Schnell)
        if (replicateKey) {
            try {
                const replicate = new Replicate({
                    auth: replicateKey,
                });

                // black-forest-labs/flux-schnell
                const output = await replicate.run(
                    "black-forest-labs/flux-schnell",
                    {
                        input: {
                            prompt: prompt,
                            aspect_ratio: "16:9",
                            output_format: "jpg"
                        }
                    }
                ) as string[];

                if (output && output.length > 0) {
                    // Need to check if it's a File Output object or URL strings
                    // Usually returning the URL directly
                    return NextResponse.json({ imageUrl: typeof output[0] === 'string' ? output[0] : (output[0] as any).url() || output[0] });
                }
            } catch (err) {
                console.warn("Replicate generation failed, trying next provider:", err);
            }
        }

        // 3. Fallback to Google Imagen 3 (via Gemini Pro Account)
        if (geminiKey) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${geminiKey}`;

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instances: [{ prompt: prompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "16:9" // Cinematic aspect ratio
                    }
                })
            });

            const data = await response.json();

            if (response.ok && data.predictions && data.predictions.length > 0) {
                const base64Image = data.predictions[0].bytesBase64Encoded;
                if (base64Image) {
                    // Return a data URI that the frontend can render in an <img> tag directly
                    return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${base64Image}` });
                }
            }
        }

        return NextResponse.json({ error: "No image API keys available or all providers failed." }, { status: 500 });

    } catch (error: any) {
        console.error("Image generation failed:", error);
        return NextResponse.json({
            error: "Failed to generate image",
            details: error.message
        }, { status: 500 });
    }
}
