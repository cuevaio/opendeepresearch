import { logger, metadata, schemaTask } from "@trigger.dev/sdk/v3";
import z from "zod";

import { generateLearnings } from "./generate-learnings.task";
import { generateReport } from "./generate-report";
import { generateSearchQueries } from "./generate-search-queries.task";
import { searchAndProcess } from "./search-and-process.task";
import { sendReport } from "./send-report.task";

import type { Research, RunStatus } from "./types";

function updateStatus(status: RunStatus) {
	metadata.append("status", {
		...status,
		date: new Date().toISOString(),
	});
}

export const deepResearch = schemaTask({
	id: "deep-research",
	schema: z.object({
		prompt: z.string(),
		emails: z.array(z.string().email()).optional().default(["hi@cueva.io"]),
		depth: z.number().optional().default(2),
		breadth: z.number().optional().default(3),
	}),
	async run({ prompt, depth, breadth, emails }) {
		const accumulatedResearch: Research = {
			query: undefined,
			queries: [],
			searchResults: [],
			learnings: [],
			completedQueries: [],
		};

		const doDeepResearch = async (prompt: string, depth = 3, breadth = 2) => {
			if (!accumulatedResearch.query) {
				accumulatedResearch.query = prompt;
			}

			if (depth === 0) {
				return accumulatedResearch;
			}

			const queriesResult = await generateSearchQueries.triggerAndWait({
				query: prompt,
				n: breadth,
			});

			if (!queriesResult.ok) {
				throw new Error("Failed to generate search queries");
			}
			const queries = queriesResult.output;
			accumulatedResearch.queries = queries;

			for (const query of queries) {
				logger.info("Searching the web", { query });
				updateStatus({
					type: "searching-web",
					query,
				});
				const searchResults = await searchAndProcess.triggerAndWait({
					query,
					accumulatedSources: accumulatedResearch.searchResults,
				});

				if (!searchResults.ok) {
					throw new Error("Failed to search the web");
				}

				if (!searchResults.output) {
					logger.info("No search results found", { query });
					continue;
				}

				updateStatus({
					type: "search-results",
					title: searchResults.output.title,
					url: searchResults.output.url,
					faviconUrl: searchResults.output.faviconUrl,
				});

				accumulatedResearch.searchResults.push(searchResults.output);
				logger.info("Processing search result", {
					url: searchResults.output.url,
				});
				const learningsResult = await generateLearnings.triggerAndWait({
					query,
					searchResult: searchResults.output,
					breadth,
				});
				if (!learningsResult.ok) {
					throw new Error("Failed to generate learnings");
				}

				updateStatus({
					type: "learning",
					learning: learningsResult.output.learning,
				});
				accumulatedResearch.learnings.push(learningsResult.output);
				accumulatedResearch.completedQueries.push(query);

				const newQuery = `Overall research goal: ${prompt}
        Previous search queries: ${accumulatedResearch.completedQueries.join(", ")}

        Follow-up questions: ${learningsResult.output.followUpQuestions.join(", ")}
        `;
				await doDeepResearch(newQuery, depth - 1, Math.ceil(breadth / 2));
			}
			return accumulatedResearch;
		};

		const research = await doDeepResearch(prompt, depth, breadth);

		updateStatus({
			type: "research-completed",
		});

		logger.info("Research completed!");

		updateStatus({
			type: "starting-report-generation",
		});

		logger.info("Generating report");
		const reportResult = await generateReport.triggerAndWait({ research });
		logger.info("Report generated");

		updateStatus({
			type: "report-generated",
		});

		if (!reportResult.ok) {
			throw new Error("Failed to generate report");
		}

		const report = reportResult.output;

		logger.info("Sending report", { emails });
		updateStatus({
			type: "sending-report",
		});
		await sendReport.triggerAndWait({
			query: prompt,
			report,
			emails,
		});
		logger.info("Report sent", { emails });
		updateStatus({
			type: "report-sent",
		});
	},
});
