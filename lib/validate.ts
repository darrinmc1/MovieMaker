import { ActSchema } from "@/types/act";

export function validateActJson(data: unknown) {
    const parsed = ActSchema.safeParse(data);
    if (!parsed.success) {
        return { ok: false as const, errors: parsed.error.flatten() };
    }
    return { ok: true as const, act: parsed.data };
}
