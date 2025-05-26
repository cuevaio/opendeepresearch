"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { triggerDeepResearchAction } from "@/actions";

export default function Home() {
	const [state, formAction, isPending] = React.useActionState(
		triggerDeepResearchAction,
		undefined,
	);
	const router = useRouter();

	React.useEffect(() => {
		if (!isPending) {
			if (state) {
				if (state.ok) {
					router.push(`/r/${state.data.runId}`);
					localStorage.setItem(
						`publicAccessToken:${state.data.runId}`,
						state.data.publicAccessToken,
					);
				} else {
					console.error(state.error);
				}
			}
		}
	}, [state, isPending, router]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] p-4 font-mono">
			<main className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="mb-2 font-bold text-2xl text-[#00ff00] [text-shadow:_2px_2px_0_rgb(0_0_0_/_40%)]">
						OPEN DEEP RESEARCH
					</h1>
					<div className="mx-auto mb-4 h-1 w-24 bg-[#00ff00]" />
					<p className="text-[#00ff00]/80 text-sm">
						[ENTER YOUR RESEARCH QUERY]
					</p>
				</div>

				<form className="mt-8 space-y-6" action={formAction}>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="prompt"
								className="mb-2 block text-[#00ff00] text-sm"
							>
								[PROMPT]
							</label>
							<textarea
								id="prompt"
								name="prompt"
								rows={4}
								className="w-full border-2 border-[#00ff00] bg-black p-2 text-[#00ff00] placeholder-[#00ff00]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff00]"
								placeholder=">_"
								defaultValue={state?.prompt}
								required
							/>
						</div>

						<div>
							<label
								htmlFor="email"
								className="mb-2 block text-[#00ff00] text-sm"
							>
								[EMAIL]
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								defaultValue={state?.email}
								required
								className="w-full border-2 border-[#00ff00] bg-black p-2 text-[#00ff00] placeholder-[#00ff00]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff00]"
								placeholder=">_"
							/>
						</div>
					</div>

					<button
						type="submit"
						className="w-full border-2 border-[#00ff00] bg-black p-2 text-[#00ff00] transition-all hover:bg-[#00ff00] hover:text-black active:translate-y-0.5"
					>
						[SUBMIT]
					</button>
				</form>

				<div className="mt-8 text-center text-[#00ff00]/60 text-xs">
					<p>© 2024 OPEN DEEP RESEARCH</p>
					<p className="mt-1">[SYSTEM READY]</p>
				</div>
			</main>
		</div>
	);
}
