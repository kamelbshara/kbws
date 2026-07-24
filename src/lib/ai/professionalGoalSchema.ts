import { z } from "zod";

export const ProfessionalGoalSuggestionsSchema = z.object({
  goals: z.array(z.string()).min(3).describe("At least 3 distinct SMART (Specific, Measurable, Achievable, Relevant, Time-bound) professional growth goals"),
});

export type ProfessionalGoalSuggestions = z.infer<typeof ProfessionalGoalSuggestionsSchema>;
