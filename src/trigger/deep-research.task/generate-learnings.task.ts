import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";
import { LearningSchema, SearchResultSchema } from "./types";

export const generateLearnings = schemaTask({
	id: "generate-learnings",
	schema: z.object({
		query: z.string(),
		searchResult: SearchResultSchema,
		breadth: z.number(),
	}),
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 500,
		maxTimeoutInMs: 30_000,
		randomize: false,
	},
	async run({ query, searchResult, breadth }) {
		const { object } = await generateObject({
			model: openai("gpt-4.1"),
			prompt: `The user is researching "${query}". The following search result were deemed relevant.
    Generate a learning and ${breadth} follow-up questions from the following search result:

    <search_result>
    ${JSON.stringify(searchResult)}
    </search_result>
      `,
			schema: LearningSchema,
			experimental_telemetry: {
				isEnabled: true,
				functionId: "generate-learnings",
			},
		});
		return object;
	},
});
