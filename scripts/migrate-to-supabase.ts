import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
    console.log('🚀 Starting migration...')

    // 1. Migrate Characters
    console.log('📦 Migrating Characters...')
    const charactersPath = path.join(process.cwd(), 'data/characters.json')
    const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'))

    for (const char of characters) {
        const { error } = await supabase.from('characters').upsert({
            id: char.id,
            name: char.name,
            core_want: char.core_want,
            core_flaw: char.core_flaw,
            current_state: char.current_state
        })
        if (error) console.error(`   ❌ Failed to insert ${char.name}:`, error.message)
        else console.log(`   ✅ Inserted ${char.name}`)
    }

    // 2. Migrate Acts and Versions
    console.log('📦 Migrating Acts...')
    const actsPath = path.join(process.cwd(), 'data/acts.json')
    const acts = JSON.parse(fs.readFileSync(actsPath, 'utf-8'))

    for (const act of acts) {
        // Insert Act
        const { error: actError } = await supabase.from('acts').upsert({
            id: act.id,
            chapter_id: act.chapterId,
            heading: act.heading
        })

        if (actError) {
            console.error(`   ❌ Failed to insert act ${act.id}:`, actError.message)
            continue
        } else {
            console.log(`   ✅ Inserted Act ${act.id}`)
        }

        // Insert Versions
        for (const version of act.versions) {
            const { error: verError } = await supabase.from('act_versions').upsert({
                act_id: act.id,
                version_id: version.versionId,
                text: version.text,
                created_at: version.createdAt,
                is_current: version.versionId === act.versions[act.versions.length - 1].versionId
            }, { onConflict: 'version_id' }) // Assuming version_id is unique enough or we rely on constraints

            if (verError) console.error(`      ❌ Failed version ${version.versionId}:`, verError.message)
        }
    }

    console.log('🎉 Migration Complete!')
}

migrate()
