import fs from "fs"
import path from "path"
import { StoryBible, StoryBibleSchema } from "@/types"

const DATA_DIR = path.join(process.cwd(), "data")

export class StoryBibleService {
    private static getPath(bookId: string): string {
        return path.join(DATA_DIR, `story-bible-${bookId}.json`)
    }

    static getForBook(bookId: string): StoryBible {
        const filePath = this.getPath(bookId)
        if (!fs.existsSync(filePath)) {
            return {
                promiseRegistry: [],
                continuityRegistry: []
            }
        }
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            return StoryBibleSchema.parse(data)
        } catch (e) {
            console.error(`Error loading story bible for ${bookId}:`, e)
            return {
                promiseRegistry: [],
                continuityRegistry: []
            }
        }
    }

    static saveForBook(bookId: string, bible: StoryBible): void {
        const filePath = this.getPath(bookId)
        fs.writeFileSync(filePath, JSON.stringify(bible, null, 2))
    }

    static addPromise(bookId: string, promise: any): void {
        const bible = this.getForBook(bookId)
        bible.promiseRegistry.push(promise)
        this.saveForBook(bookId, bible)
    }

    static addContinuityWarning(bookId: string, warning: any): void {
        const bible = this.getForBook(bookId)
        bible.continuityRegistry.push(warning)
        this.saveForBook(bookId, bible)
    }
}
