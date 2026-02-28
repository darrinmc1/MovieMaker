import { z } from "zod";
import { ReaderPromiseSchema, ContinuityWarningSchema } from "./act";

export const StoryBibleSchema = z
    .object({
        promiseRegistry: z.array(ReaderPromiseSchema).default([]),
        continuityRegistry: z.array(ContinuityWarningSchema).default([]),
    })
    .passthrough();

export type StoryBible = z.infer<typeof StoryBibleSchema>;
