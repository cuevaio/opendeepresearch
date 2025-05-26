import z from "zod";

export const SearchResultSchema = z.object({
	title: z.string().nullable(),
	url: z.string(),
	content: z.string(),
	faviconUrl: z.string().nullable(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const LearningSchema = z.object({
	learning: z.string(),
	followUpQuestions: z.array(z.string()),
});
export type Learning = z.infer<typeof LearningSchema>;

export const ResearchSchema = z.object({
	query: z.string().optional(),
	queries: z.array(z.string()),
	searchResults: z.array(SearchResultSchema),
	learnings: z.array(LearningSchema),
	completedQueries: z.array(z.string()),
});
export type Research = z.infer<typeof ResearchSchema>;

export type RunStatus =
	| {
			type: "searching-web";
			query: string;
	  }
	| {
			type: "search-results";
			title: string | null;
			url: string;
			faviconUrl: string | null;
	  }
	| {
			type: "learning";
			learning: string;
	  }
	| {
			type: "research-completed";
	  }
	| {
			type: "starting-report-generation";
	  }
	| {
			type: "report-generated";
	  }
	| {
			type: "sending-report";
	  }
	| {
			type: "report-sent";
	  };
