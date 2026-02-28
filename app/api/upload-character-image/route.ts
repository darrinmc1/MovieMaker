import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const characterId = formData.get("characterId") as string;

        if (!file || !characterId) {
            return NextResponse.json({ error: "Missing file or characterId" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Ensure the bucket exists (this is safe to call even if it exists)
        // Note: For simplicity, we assume the bucket exists or we create it via dashboard.
        // Actually, let's try to upload and if it fails due to bucket not existing, we return an error.

        const ext = file.name.split('.').pop();
        const fileName = `${characterId}-${Date.now()}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error: uploadError } = await supabase.storage
            .from('character-assets')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('character-assets')
            .getPublicUrl(fileName);

        // 3. Update character row
        const { error: updateError } = await supabase
            .from('characters')
            .update({ image_url: publicUrl })
            .eq('id', characterId);

        if (updateError) {
            console.error("DB update error:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, imageUrl: publicUrl });
    } catch (error: any) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: "Upload failed", details: error.message }, { status: 500 });
    }
}
