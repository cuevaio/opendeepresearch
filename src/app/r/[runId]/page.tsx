"use client";

import React from "react";

import { useParams } from "next/navigation";

import type { RunStatus } from "@/trigger/deep-research.task/types";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

const getStatusColor = (type: RunStatus["type"]) => {
	switch (type) {
		case "searching-web":
			return "text-[#00ff00]"; // Bright green
		case "search-results":
			return "text-[#00ffff]"; // Cyan
		case "learning":
			return "text-[#ff00ff]"; // Magenta
		case "research-completed":
			return "text-[#ffff00]"; // Yellow
		case "starting-report-generation":
		case "report-generated":
		case "sending-report":
		case "report-sent":
			return "text-[#ff8800]"; // Orange
		default:
			return "text-[#00ff00]";
	}
};

const StatusItem = ({
	status,
	email,
}: {
	status: RunStatus & { date: string };
	isLatest: boolean;
	email: string;
}) => {
	const colorClass = getStatusColor(status.type);

	switch (status.type) {
		case "searching-web":
			return (
				<div className={`flex items-center justify-between ${colorClass}`}>
					<div className="flex items-center space-x-2">
						<span>[SEARCHING]</span>
						<span className="opacity-60">{status.query}</span>
					</div>
				</div>
			);
		case "search-results":
			return (
				<div className={`flex items-center justify-between ${colorClass}`}>
					<a
						href={status.url}
						target="_blank"
						rel="noreferrer"
						className="flex items-center space-x-2 hover:underline"
					>
						{status.faviconUrl && (
							<img src={status.faviconUrl} alt="" className="h-4 w-4" />
						)}
						<span className="opacity-60">{status.title || status.url}</span>
					</a>
					<span className="text-xs opacity-60">
						{new Date(status.date).toLocaleTimeString()}
					</span>
				</div>
			);
		case "learning":
			return (
				<div className={`flex flex-col space-y-1 ${colorClass}`}>
					<div className="flex items-center justify-between">
						<span className="opacity-60">[LEARNING]</span>
						<span className="text-xs opacity-60">
							{new Date(status.date).toLocaleTimeString()}
						</span>
					</div>
					<span>{status.learning}</span>
				</div>
			);
		case "research-completed":
			return (
				<div className={`flex items-center justify-between ${colorClass}`}>
					<span>[RESEARCH COMPLETED]</span>
					<span className="text-xs opacity-60">
						{new Date(status.date).toLocaleTimeString()}
					</span>
				</div>
			);
		case "starting-report-generation":
			return (
				<div className={`flex items-center justify-between ${colorClass}`}>
					<span>[GENERATING REPORT]</span>
					<span className="text-xs opacity-60">
						{new Date(status.date).toLocaleTimeString()}
					</span>
				</div>
			);
		case "report-generated":
			return (
				<div className={`flex items-center justify-between ${colorClass}`}>
					<span>[REPORT GENERATED]</span>
					<span className="text-xs opacity-60">
						{new Date(status.date).toLocaleTimeString()}
					</span>
				</div>
			);
		case "sending-report":
			return (
				<div className={`flex items-center justify-between ${colorClass}`}>
					<span>[SENDING REPORT]</span>
					<span className="text-xs opacity-60">
						{new Date(status.date).toLocaleTimeString()}
					</span>
				</div>
			);
		case "report-sent":
			return (
				<div className={`flex items-center justify-between ${colorClass}`}>
					<span>[REPORT SENT TO {email}]</span>
					<span className="text-xs opacity-60">
						{new Date(status.date).toLocaleTimeString()}
					</span>
				</div>
			);
		default:
			return null;
	}
};

const StatusList = ({
	statuses,
	email,
}: { statuses: RunStatus[]; email: string }) => {
	return (
		<div className="space-y-4">
			<h2 className="mb-4 font-bold text-[#00ff00] text-lg">
				[RESEARCH PROGRESS]
			</h2>
			<div className="space-y-2">
				{statuses.map((status, index) => (
					<div
						key={`${status.type}-${index}-${Date.now()}`}
						className={`border-l-2 py-2 pl-4 ${
							index === statuses.length - 1
								? "animate-pulse border-[#00ff00]"
								: "border-[#00ff00]/30"
						}`}
					>
						<StatusItem
							status={status as RunStatus & { date: string }}
							isLatest={index === statuses.length - 1}
							email={email}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default function Page() {
	const { runId } = useParams<{ runId: string }>();

	const [publicAccessToken, setPublicAccessToken] = React.useState<
		string | null
	>(null);

	React.useEffect(() => {
		const run = localStorage.getItem(`run:${runId}`);
		if (run) {
			const { publicAccessToken } = JSON.parse(run);
			setPublicAccessToken(publicAccessToken);
		}
	}, [runId]);

	const { run, error, stop } = useRealtimeRun(`run_${runId}`, {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		accessToken: publicAccessToken!,
		onComplete: (run, error) => {
			console.log("Run completed", run);
		},
		enabled: !!publicAccessToken,
	});

	const status: RunStatus = (run?.metadata?.status as RunStatus) || [];

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] p-4 font-mono">
			<main className="w-full max-w-2xl space-y-8">
				<div className="text-center">
					<h1 className="mb-2 font-bold text-2xl text-[#00ff00] [text-shadow:_2px_2px_0_rgb(0_0_0_/_40%)]">
						OPEN DEEP RESEARCH
					</h1>
					<div className="mx-auto mb-4 h-1 w-24 bg-[#00ff00]" />
				</div>

				{Array.isArray(status) && status.length > 0 ? (
					<StatusList statuses={status} email={run?.payload?.email as string} />
				) : (
					<div className="text-center text-[#00ff00]">
						[WAITING FOR RESEARCH TO START]
					</div>
				)}

				{!["CANCELED", "COMPLETED", "FAILED", "CRASHED"].includes(
					run?.status ?? "",
				) && (
					<button
						disabled={run?.status === "CANCELED"}
						onClick={() => stop()}
						type="button"
						className="rounded-md bg-red-500 px-4 py-2 text-white"
					>
						Stop
					</button>
				)}
			</main>
		</div>
	);
}
