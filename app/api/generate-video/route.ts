import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export async function POST(req: Request) {
    try {
        const { imageUrl, prompt } = await req.json();

        if (!imageUrl || !prompt) {
            return NextResponse.json({ error: "Missing imageUrl or prompt" }, { status: 400 });
        }

        const falKey = process.env.FAL_KEY;

        if (!falKey) {
            return NextResponse.json({ error: "FAL_KEY is missing from environment variables." }, { status: 500 });
        }

        // Configure fal instance since Next.js server limits auto-detection
        fal.config({ credentials: () => falKey });

        // Using Stable Video Diffusion via Fal, or Kling (depending on preference, SVD is faster/cheaper)
        // Let's use Runway Gen3 Alpha, Luma, or Haiper via Fal if available.
        // For Image-to-Video, fal-ai/luma-dream-machine/image-to-video is great. Let's start with fal-ai/minimax/video-01-live
        // Wait, fal-ai/luma-dream-machine is a stable robust choice for img2vid

        // Actually, let's use Kling V1-5 which fal hosts: fal-ai/kling-video/v1/standard/image-to-video
        const result = await fal.subscribe("fal-ai/kling-video/v1/standard/image-to-video", {
            input: {
                prompt: prompt,
                image_url: imageUrl,
                duration: "5",
                aspect_ratio: "16:9"
            },
            logs: true,
        });

        if (result.data && result.data.video && result.data.video.url) {
            return NextResponse.json({ videoUrl: result.data.video.url });
        }

        return NextResponse.json({ error: "No video data in response from Fal.ai" }, { status: 500 });

    } catch (error: any) {
        console.error("Video generation failed:", error);
        return NextResponse.json({
            error: "Failed to generate video",
            details: error.message
        }, { status: 500 });
    }
}
