import fs from "fs";
import path from "path";
import { BookOutline, BookOutlineSchema, OutlineRef, ActOutline } from "@/types";

export class OutlineService {
    private static OUTLINE_DIR = path.join(process.cwd(), "data", "outlines");

    static getOutline(outlineId: string): BookOutline | null {
        // For now we assume outlineId corresponds to filename like book1.outline.json
        // In a real system we'd have a mapping.
        const filename = outlineId.includes("book1") ? "book1.outline.json" : `${outlineId}.json`;
        const filePath = path.join(this.OUTLINE_DIR, filename);

        if (!fs.existsSync(filePath)) return null;

        try {
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            const result = BookOutlineSchema.safeParse(data);
            if (!result.success) {
                console.error(`Invalid outline data in ${filePath}:`, result.error);
                return null;
            }
            return result.data;
        } catch (e) {
            console.error(`Error reading outline file ${filePath}:`, e);
            return null;
        }
    }

    static resolveActOutline(ref: OutlineRef): ActOutline | null {
        const bookOutline = this.getOutline(ref.outlineId);
        if (!bookOutline) return null;

        const chapter = bookOutline.chapters.find((c) => c.chapterId === ref.chapterId);
        if (!chapter) return null;

        const act = chapter.acts.find((a) => a.actId === ref.actId);
        return act || null;
    }
}
