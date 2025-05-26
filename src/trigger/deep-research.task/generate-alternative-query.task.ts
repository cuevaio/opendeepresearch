import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";

export const generateAlternativeQuery = schemaTask({
	id: "generate-alternative-query",
	schema: z.object({
		originalQuery: z.string(),
	}),
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 15_000,
		maxTimeoutInMs: 60_000,
		randomize: false,
	},
	async run({ originalQuery }) {
		const { object } = await generateObject({
			model: openai("gpt-4.1"),
			prompt: `Generate an alternative search query based on the original query we could not find relevant information for.
			The alternative query should be more specific or use different terms to find relevant information.

			Original query: ${originalQuery}
			
			Generate a new search query that might yield better results.`,
			schema: z.object({
				alternative_query: z.string(),
			}),
		});

		return object;
	},
});
