import { Act } from "@/types";

export function migrateActToLatest(act: any): any {
    // Ensure versions have versionId + createdAt if missing
    if (Array.isArray(act.versions)) {
        act.versions = act.versions.map((v: any, i: number) => ({
            versionId: v.versionId ?? `v${i + 1}`,
            createdAt: v.createdAt ?? new Date().toISOString(),
            createdBy: v.createdBy ?? "user",
            changeNote: v.changeNote ?? "",
            ...v,
        }));
    }

    // Ensure top-level act metadata
    act.id = act.id ?? `act-${Date.now()}`;
    act.bookId = act.bookId ?? "book1";
    act.chapterId = act.chapterId ?? "ch1";
    act.heading = act.heading ?? "Untitled Act";

    // Optional containers
    act.reviews = act.reviews ?? [];
    act.charactersInAct = act.charactersInAct ?? [];
    act.promises = act.promises ?? [];
    act.continuity = act.continuity ?? { warnings: [] };
    act.summary = act.summary ?? { text: "", isUserEdited: false };

    // outlineSync + intent + metrics remain optional (user-driven)
    return act;
}
