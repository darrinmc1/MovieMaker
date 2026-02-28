import { Act, Character, ContinuityWarning } from "@/types"

export function checkContinuity(act: Act, characters: Character[]): ContinuityWarning[] {
    const warnings: ContinuityWarning[] = []
    const version = act.versions[act.versions.length - 1]
    if (!version) return []

    const text = version.text

    characters.forEach(c => {
        if (text.includes(c.name) && !c.current_state) {
            warnings.push({
                warningId: `${act.id}-${c.id}`,
                scope: 'act',
                category: 'character',
                severity: 'high',
                message: `Character ${c.name} appears without defined current state.`,
                evidence: `Mentioned in ${act.id}`,
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }
    })

    return warnings
}