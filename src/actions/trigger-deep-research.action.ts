"use server";

import { deepResearch } from "@/trigger/deep-research.task";
import { z } from "zod";

type TriggerDeepResearchActionState = {
	prompt: string;
	email: string;
} & (
	| {
			ok: false;
			error: string;
	  }
	| {
			ok: true;
			data: {
				runId: string;
				publicAccessToken: string;
			};
	  }
);

export async function triggerDeepResearchAction(
	previousState: TriggerDeepResearchActionState | undefined,
	formData: FormData,
): Promise<TriggerDeepResearchActionState> {
	try {
		const { email, prompt } = z
			.object({
				email: z.string().email(),
				prompt: z.string().min(10),
			})
			.parse({ email: formData.get("email"), prompt: formData.get("prompt") });

		const run = await deepResearch.trigger({
			prompt,
			email,
		});

		if (run) {
			return {
				ok: true,
				data: {
					runId: run.id,
					publicAccessToken: run.publicAccessToken,
				},
				prompt,
				email,
			};
		}
		throw new Error("No public access token");
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
			prompt: (formData.get("prompt") as string) ?? undefined,
			email: (formData.get("email") as string) ?? undefined,
		};
	}
}
