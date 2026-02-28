import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const run = async () => {
    try {
        const { data, error } = await supabase.storage.createBucket('character-assets', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
            fileSizeLimit: 5242880 // 5MB
        })

        if (error) {
            if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
                console.log("Bucket 'character-assets' already exists.")
            } else {
                console.error("Error creating bucket:", error)
            }
        } else {
            console.log("Successfully created public 'character-assets' bucket:", data)
        }
    } catch (e) {
        console.error("Exception:", e)
    }
}
run()
