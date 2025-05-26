"use server";

import { deepResearch } from "@/trigger/deep-research.task";
import { z } from "zod";

type TriggerDeepResearchActionState = {
	prompt: string;
	emails: string;
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
		const { emails, prompt } = z
			.object({
				emails: z.string().email().array(),
				prompt: z.string().min(10),
			})
			.parse({
				emails: ((formData.get("emails") as string) || "")
					.split(",")
					.map((email) => email.trim()),
				prompt: formData.get("prompt"),
			});

		const run = await deepResearch.trigger({
			prompt,
			emails,
		});

		if (run) {
			return {
				ok: true,
				data: {
					runId: run.id,
					publicAccessToken: run.publicAccessToken,
				},
				prompt,
				emails: emails.join(", "),
			};
		}
		throw new Error("No public access token");
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
			prompt: (formData.get("prompt") as string) ?? undefined,
			emails: (formData.get("emails") as string) ?? undefined,
		};
	}
}
