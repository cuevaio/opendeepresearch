"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { triggerDeepResearchAction } from "@/actions";

const RecentResearches = () => {
	const [recentResearches, setRecentResearches] = React.useState<
		Array<{
			runId: string;
			email: string;
			prompt: string;
			date: string;
		}>
	>([]);

	React.useEffect(() => {
		const researches = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith("run:")) {
				const runId = key.split(":")[1];
				const data = JSON.parse(localStorage.getItem(key) || "{}");
				researches.push({
					runId,
					...data,
				});
			}
		}
		setRecentResearches(
			researches.sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			),
		);
	}, []);

	if (recentResearches.length === 0) return null;

	return (
		<div className="mt-8 space-y-4">
			<h2 className="font-bold text-[#00ff00] text-lg">[RECENT RESEARCHES]</h2>
			<div className="space-y-2">
				{recentResearches.map((research) => (
					<a
						key={research.runId}
						href={`/r/${research.runId}`}
						className="block border-2 border-[#00ff00]/30 p-4 transition-colors hover:border-[#00ff00]"
					>
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<p className="line-clamp-2 text-[#00ff00]">{research.prompt}</p>
								<p className="text-[#00ff00]/60 text-sm">{research.email}</p>
							</div>
							<span className="text-[#00ff00]/40 text-xs">
								{new Date(research.date).toLocaleDateString()}
							</span>
						</div>
					</a>
				))}
			</div>
		</div>
	);
};

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
					router.push(`/r/${state.data.runId.split("_")[1]}`);
					localStorage.setItem(
						`run:${state.data.runId.split("_")[1]}`,
						JSON.stringify({
							emails: state.emails,
							prompt: state.prompt,
							publicAccessToken: state.data.publicAccessToken,
							date: new Date().toISOString(),
						}),
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
								htmlFor="emails"
								className="mb-2 block text-[#00ff00] text-sm"
							>
								[RECIPIENTS EMAILS (SEPARATED BY COMMAS)]
							</label>
							<input
								id="emails"
								name="emails"
								type="text"
								autoComplete="email"
								defaultValue={state?.emails}
								required
								className="w-full border-2 border-[#00ff00] bg-black p-2 text-[#00ff00] placeholder-[#00ff00]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff00]"
								placeholder=">_"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={isPending}
						className="w-full border-2 border-[#00ff00] bg-black p-2 text-[#00ff00] transition-all hover:bg-[#00ff00] hover:text-black active:translate-y-0.5"
					>
						{isPending ? "[SUBMITTING...]" : "[SUBMIT]"}
					</button>
				</form>

				<RecentResearches />

				<div className="mt-8 text-center text-[#00ff00]/60 text-xs">
					<div className="flex items-center justify-center space-x-2">
						<p className="">[SYSTEM READY]</p>
						<a
							href="https://cueva.io"
							target="_blank"
							rel="noreferrer"
							className="hover:underline"
						>
							© 2025 Anthony Cueva
						</a>
						<span className="mx-2">|</span>
						<a
							href="https://github.com/cuevaio/opendeepresearch"
							target="_blank"
							rel="noreferrer"
							className="hover:underline"
						>
							GitHub
						</a>
					</div>
				</div>
			</main>
		</div>
	);
}
