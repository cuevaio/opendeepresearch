import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";

export const generateSearchQueries = schemaTask({
	id: "generate-search-queries",
	schema: z.object({
		query: z.string(),
		n: z.number().min(1).max(5),
	}),
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 15_000,
		maxTimeoutInMs: 60_000,
		randomize: false,
	},
	async run({ query, n }) {
		const {
			object: { queries },
		} = await generateObject({
			model: openai("gpt-4.1"),
			prompt: `Generate ${n} search queries for the following query: ${query}. Current date: ${new Date().toISOString()}`,
			schema: z.object({
				queries: z.array(z.string()).min(1).max(5),
			}),
			experimental_telemetry: {
				isEnabled: true,
				functionId: "generate-search-queries",
			},
		});
		return queries;
	},
});
