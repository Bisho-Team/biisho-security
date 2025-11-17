"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { audioService } from "@/lib/audio-service";
import {
	Volume2,
	VolumeX,
	TestTube,
	StopCircle,
	Activity,
	AlertTriangle,
	CheckCircle,
	Loader2,
	RefreshCw,
	Speaker,
	Zap,
	Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ForceAudioStatus() {
	const [audioStatus, setAudioStatus] = useState<any>(null);
	const [sirenStatus, setSirenStatus] = useState<any>(null);
	const [testing, setTesting] = useState(false);
	const [isEnabled, setIsEnabled] = useState(true);

	useEffect(() => {
		const updateStatus = () => {
			setAudioStatus(audioService.getAudioStatus());
			setSirenStatus(audioService.getSirenStatus());
			setIsEnabled(audioService.isAudioEnabled());
		};

		updateStatus();
		const interval = setInterval(updateStatus, 1000);

		return () => clearInterval(interval);
	}, []);

	const handleToggleAudio = () => {
		const newState = !isEnabled;
		audioService.setEnabled(newState);
		setIsEnabled(newState);
	};

	const handleTestSounds = async () => {
		setTesting(true);
		try {
			await audioService.testAllSounds();
		} finally {
			setTesting(false);
		}
	};

	const handleForceStop = () => {
		audioService.forceStopAllAlerts();
	};

	const handleForceEnable = async () => {
		await audioService.forceEnableAudio();
	};

	if (!audioStatus || !sirenStatus) {
		return (
			<Card className="bg-slate-900/50 border-slate-700">
				<CardContent className="p-4">
					<div className="flex items-center space-x-2">
						<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
						<span className="text-slate-400">Loading audio status...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="bg-slate-900/50 border-slate-700">
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<Shield className="h-5 w-5 text-red-400" />
					<span>CRITICAL AUDIO SYSTEM</span>
					<Badge
						className={cn(
							"text-xs animate-pulse",
							isEnabled && audioStatus.forceEnabled
								? "bg-red-600 text-white"
								: "bg-slate-600 text-slate-300"
						)}>
						{isEnabled && audioStatus.forceEnabled
							? "FORCE ACTIVE"
							: "DISABLED"}
					</Badge>
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Force Mode Status */}
				<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
					<div className="flex items-center space-x-2 mb-2">
						<Zap className="h-4 w-4 text-red-400" />
						<span className="text-red-400 text-sm font-medium">
							Emergency Force Mode
						</span>
					</div>
					<div className="grid grid-cols-2 gap-2 text-xs">
						<div className="flex justify-between">
							<span className="text-slate-400">Force Enabled:</span>
							<Badge
								className={
									audioStatus.forceEnabled
										? "bg-green-600 text-white"
										: "bg-slate-600 text-slate-300"
								}>
								{audioStatus.forceEnabled ? "YES" : "NO"}
							</Badge>
						</div>
						<div className="flex justify-between">
							<span className="text-slate-400">Initialized:</span>
							<Badge
								className={
									audioStatus.audioInitialized
										? "bg-green-600 text-white"
										: "bg-slate-600 text-slate-300"
								}>
								{audioStatus.audioInitialized ? "YES" : "NO"}
							</Badge>
						</div>
					</div>
				</div>

				{/* Audio System Status */}
				<div className="grid grid-cols-2 gap-3">
					<div className="bg-slate-800/30 rounded-lg p-3">
						<div className="flex items-center space-x-2 mb-1">
							<Activity className="h-3 w-3 text-blue-400" />
							<span className="text-xs text-slate-400">Audio Context</span>
						</div>
						<Badge
							className={cn(
								"text-xs",
								audioStatus.audioContextState === "running"
									? "bg-green-600 text-white"
									: "bg-slate-600 text-slate-300"
							)}>
							{audioStatus.audioContextState}
						</Badge>
					</div>

					<div className="bg-slate-800/30 rounded-lg p-3">
						<div className="flex items-center space-x-2 mb-1">
							<Speaker className="h-3 w-3 text-purple-400" />
							<span className="text-xs text-slate-400">Siren Audio</span>
						</div>
						<Badge
							className={cn(
								"text-xs",
								sirenStatus.loaded
									? "bg-green-600 text-white"
									: sirenStatus.loading
									? "bg-yellow-600 text-white"
									: "bg-slate-600 text-slate-300"
							)}>
							{sirenStatus.loading
								? "Loading"
								: sirenStatus.loaded
								? sirenStatus.method
								: "Fallback"}
						</Badge>
					</div>
				</div>

				{/* Audio Elements Status */}
				<div className="bg-slate-800/20 rounded-lg p-3">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-slate-300">Audio Elements</span>
						<Badge className="bg-blue-600 text-white text-xs">
							{audioStatus.audioElementsReady}/{sirenStatus.elements}
						</Badge>
					</div>
					<div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
						<div>Total Elements: {sirenStatus.elements}</div>
						<div>Ready Elements: {audioStatus.audioElementsReady}</div>
						<div>Active Sources: {audioStatus.activeSourcesCount}</div>
						<div>Synth Sources: {audioStatus.activeSynthSourcesCount}</div>
					</div>
				</div>

				{/* Playback Status */}
				<div className="bg-slate-800/20 rounded-lg p-3">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-slate-300">Playback Status</span>
						<div className="flex items-center space-x-2">
							{audioStatus.isPlaying ? (
								<div className="flex items-center space-x-1">
									<Volume2 className="h-3 w-3 text-green-400 animate-pulse" />
									<span className="text-xs text-green-400">Playing</span>
								</div>
							) : (
								<div className="flex items-center space-x-1">
									<VolumeX className="h-3 w-3 text-slate-400" />
									<span className="text-xs text-slate-400">Idle</span>
								</div>
							)}
						</div>
					</div>
					<div className="text-xs text-slate-500">
						Active Alarms: {audioService.getActiveAlarmCount()}
					</div>
				</div>

				<Separator className="bg-slate-700" />

				{/* Force Controls */}
				<div className="space-y-3">
					{!audioStatus.forceEnabled && (
						<Button
							onClick={handleForceEnable}
							className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
							<Zap className="h-4 w-4 mr-2" />
							FORCE ENABLE AUDIO
						</Button>
					)}

					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleToggleAudio}
							className={cn(
								"flex-1 border-slate-600",
								isEnabled
									? "bg-green-600/20 text-green-400 border-green-500/30"
									: "bg-slate-600/20 text-slate-400"
							)}>
							{isEnabled ? (
								<>
									<Volume2 className="h-4 w-4 mr-2" />
									Audio Enabled
								</>
							) : (
								<>
									<VolumeX className="h-4 w-4 mr-2" />
									Audio Disabled
								</>
							)}
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={handleForceStop}
							className="border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600/40"
							title="Emergency stop all audio">
							<StopCircle className="h-4 w-4" />
						</Button>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={handleTestSounds}
						disabled={testing || !isEnabled}
						className="w-full border-slate-600 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40">
						{testing ? (
							<>
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								Testing Sounds...
							</>
						) : (
							<>
								<TestTube className="h-4 w-4 mr-2" />
								Test All Sounds
							</>
						)}
					</Button>
				</div>

				{/* Status Indicators */}
				{sirenStatus.loading && (
					<div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
						<div className="flex items-center space-x-2">
							<Loader2 className="h-3 w-3 animate-spin text-blue-400" />
							<span className="text-blue-400 text-xs">
								Loading siren audio file...
							</span>
						</div>
					</div>
				)}

				{!sirenStatus.loaded &&
					!sirenStatus.loading &&
					audioStatus.sirenLoadAttempts > 0 && (
						<div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2">
							<div className="flex items-center space-x-2">
								<AlertTriangle className="h-3 w-3 text-yellow-400" />
								<span className="text-yellow-400 text-xs">
									Siren file unavailable - using synthesized sounds (Attempt{" "}
									{audioStatus.sirenLoadAttempts}/3)
								</span>
							</div>
						</div>
					)}

				{sirenStatus.loaded && (
					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-2">
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-3 w-3 text-green-400" />
							<span className="text-green-400 text-xs">
								Professional siren loaded via {sirenStatus.method} (
								{sirenStatus.elements} elements)
							</span>
						</div>
					</div>
				)}

				{audioStatus.forceEnabled && (
					<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2">
						<div className="flex items-center space-x-2">
							<Shield className="h-3 w-3 text-red-400" />
							<span className="text-red-400 text-xs font-medium">
								🚨 CRITICAL MODE: Audio will play immediately without user
								interaction
							</span>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
