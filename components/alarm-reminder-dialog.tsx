"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	AlertTriangle,
	Bell,
	Clock,
	MapPin,
	Calendar,
	Volume2,
	VolumeX,
} from "lucide-react";
import { persistentNotificationService } from "@/lib/persistent-notification-service";
import { audioService } from "@/lib/audio-service";
import { cn } from "@/lib/utils";

interface AlarmReminderDialogProps {
	onViewDetails: (alarmId: string) => void;
	onAcknowledge: (alarmId: string) => void;
}

export function AlarmReminderDialog({
	onViewDetails,
	onAcknowledge,
}: AlarmReminderDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeAlarm, setActiveAlarm] = useState<any>(null);
	const [soundPlaying, setSoundPlaying] = useState(false);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [userInteracted, setUserInteracted] = useState(false);

	useEffect(() => {
		// Initialize audio on first user interaction
		const handleUserInteraction = () => {
			setUserInteracted(true);
			audioService.initialize();

			// Remove event listeners
			window.removeEventListener("click", handleUserInteraction);
			window.removeEventListener("touchstart", handleUserInteraction);
			window.removeEventListener("keydown", handleUserInteraction);
		};

		window.addEventListener("click", handleUserInteraction);
		window.addEventListener("touchstart", handleUserInteraction);
		window.addEventListener("keydown", handleUserInteraction);

		// Check for active alarms on mount and every 10 seconds
		checkForActiveAlarms();
		const interval = setInterval(checkForActiveAlarms, 10000);

		return () => {
			clearInterval(interval);
			window.removeEventListener("click", handleUserInteraction);
			window.removeEventListener("touchstart", handleUserInteraction);
			window.removeEventListener("keydown", handleUserInteraction);
		};
	}, []);

	const checkForActiveAlarms = () => {
		const mostRecentAlarm =
			persistentNotificationService.getMostRecentActiveAlarm();

		if (mostRecentAlarm) {
			setActiveAlarm(mostRecentAlarm);
			setIsOpen(true);
		} else {
			setActiveAlarm(null);
			setIsOpen(false);
		}
	};

	const handleAcknowledge = async () => {
		if (!activeAlarm) return;

		const success = await onAcknowledge(activeAlarm.id);
		if (success as any) {
			setIsOpen(false);
			setSoundPlaying(false);
		}
	};

	const handleViewDetails = () => {
		if (!activeAlarm) return;

		onViewDetails(activeAlarm.id);
		setIsOpen(false);
	};

	const handleToggleSound = async () => {
		if (!activeAlarm) return;

		if (soundPlaying) {
			persistentNotificationService.stopAllSounds();
			setSoundPlaying(false);
		} else {
			const success =
				await persistentNotificationService.playAlarmSoundManually(
					activeAlarm.id
				);
			setSoundPlaying(success);
		}
	};

	const handleToggleAudio = () => {
		const newState = !audioEnabled;
		setAudioEnabled(newState);
		persistentNotificationService.setAudioEnabled(newState);

		if (!newState) {
			setSoundPlaying(false);
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "critical":
				return "bg-red-100 text-red-800 border-red-300";
			case "high":
				return "bg-orange-100 text-orange-800 border-orange-300";
			case "medium":
				return "bg-yellow-100 text-yellow-800 border-yellow-300";
			case "low":
				return "bg-green-100 text-green-800 border-green-300";
			default:
				return "bg-gray-100 text-gray-800 border-gray-300";
		}
	};

	const getTimeAgo = (dateString: string) => {
		const now = new Date();
		const date = new Date(dateString);
		const diffInMinutes = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60)
		);

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		return `${Math.floor(diffInMinutes / 60)}h ago`;
	};

	if (!activeAlarm) return null;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent
				className={cn(
					"max-w-2xl border-4",
					activeAlarm.severity === "critical"
						? "border-red-500"
						: activeAlarm.severity === "high"
						? "border-orange-500"
						: "border-yellow-500"
				)}>
				<DialogHeader>
					<DialogTitle className="flex items-center text-xl">
						<AlertTriangle
							className={cn(
								"h-6 w-6 mr-2",
								activeAlarm.severity === "critical"
									? "text-red-600 animate-pulse"
									: activeAlarm.severity === "high"
									? "text-orange-600"
									: "text-yellow-600"
							)}
						/>
						{activeAlarm.severity === "critical"
							? "CRITICAL ALARM REQUIRES ATTENTION"
							: activeAlarm.severity === "high"
							? "HIGH PRIORITY ALARM"
							: "SECURITY ALARM"}
					</DialogTitle>
					<DialogDescription className="text-base">
						This alarm requires your immediate acknowledgment
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="relative">
								<Bell
									className={cn(
										"h-10 w-10",
										activeAlarm.severity === "critical"
											? "text-red-600 animate-bounce"
											: activeAlarm.severity === "high"
											? "text-orange-600 animate-pulse"
											: "text-yellow-600"
									)}
								/>
								{activeAlarm.severity === "critical" && (
									<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
								)}
							</div>
							<div>
								<h3 className="text-xl font-bold">{activeAlarm.type}</h3>
								<p className="text-gray-700 flex items-center">
									<MapPin className="h-4 w-4 mr-1" />
									{activeAlarm.branchName} - {activeAlarm.location}
								</p>
								<p className="text-gray-500 text-sm flex items-center mt-1">
									<Calendar className="h-3 w-3 mr-1" />
									{getTimeAgo(activeAlarm.createdAt)}
								</p>
							</div>
						</div>
						<Badge
							className={cn(
								"text-sm px-3 py-1 font-medium border",
								getSeverityColor(activeAlarm.severity),
								activeAlarm.severity === "critical" && "animate-pulse"
							)}>
							{activeAlarm.severity.toUpperCase()}
						</Badge>
					</div>

					<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
						<h4 className="font-medium mb-1">Description</h4>
						<p>{activeAlarm.description}</p>
					</div>

					<div className="flex justify-between items-center">
						<div className="flex space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleToggleSound}
								className="flex items-center"
								disabled={!userInteracted}>
								{soundPlaying ? (
									<>
										<VolumeX className="h-4 w-4 mr-2 text-red-500" />
										Stop Sound
									</>
								) : (
									<>
										<Volume2 className="h-4 w-4 mr-2" />
										Play Sound
									</>
								)}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={handleToggleAudio}
								className="flex items-center">
								{audioEnabled ? (
									<>
										<Volume2 className="h-4 w-4 mr-2 text-green-500" />
										Audio On
									</>
								) : (
									<>
										<VolumeX className="h-4 w-4 mr-2 text-red-500" />
										Audio Off
									</>
								)}
							</Button>
						</div>
						<p className="text-gray-500 text-sm italic">
							<Clock className="h-3 w-3 inline mr-1" />
							This reminder will remain until alarm is acknowledged
						</p>
					</div>
				</div>

				<DialogFooter className="flex justify-end space-x-2 sm:space-x-2">
					<Button variant="outline" onClick={() => setIsOpen(false)}>
						Dismiss
					</Button>
					<Button
						onClick={handleViewDetails}
						variant="outline"
						className="border-blue-300 text-blue-700 hover:bg-blue-50">
						View Details
					</Button>
					<Button
						onClick={handleAcknowledge}
						className={cn(
							activeAlarm.severity === "critical"
								? "bg-red-600 hover:bg-red-700"
								: activeAlarm.severity === "high"
								? "bg-orange-600 hover:bg-orange-700"
								: "bg-yellow-600 hover:bg-yellow-700",
							"text-white"
						)}>
						Acknowledge Alarm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// "use client";

// import { useState, useEffect } from "react";
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogDescription,
// 	DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
// 	AlertTriangle,
// 	Bell,
// 	Clock,
// 	MapPin,
// 	Calendar,
// 	Volume2,
// } from "lucide-react";
// import { persistentNotificationService } from "@/lib/persistent-notification-service";
// import { cn } from "@/lib/utils";

// interface AlarmReminderDialogProps {
// 	onViewDetails: (alarmId: string) => void;
// 	onAcknowledge: (alarmId: string) => void;
// }

// export function AlarmReminderDialog({
// 	onViewDetails,
// 	onAcknowledge,
// }: AlarmReminderDialogProps) {
// 	const [isOpen, setIsOpen] = useState(false);
// 	const [activeAlarm, setActiveAlarm] = useState<any>(null);
// 	const [soundPlaying, setSoundPlaying] = useState(false);

// 	useEffect(() => {
// 		// Check for active alarms on mount and every 10 seconds
// 		checkForActiveAlarms();
// 		const interval = setInterval(checkForActiveAlarms, 10000);

// 		return () => clearInterval(interval);
// 	}, []);

// 	const checkForActiveAlarms = () => {
// 		const mostRecentAlarm =
// 			persistentNotificationService.getMostRecentActiveAlarm();

// 		if (mostRecentAlarm) {
// 			setActiveAlarm(mostRecentAlarm);
// 			setIsOpen(true);
// 		} else {
// 			setActiveAlarm(null);
// 			setIsOpen(false);
// 		}
// 	};

// 	const handleAcknowledge = async () => {
// 		if (!activeAlarm) return;

// 		const success = await onAcknowledge(activeAlarm.id);
// 		if (success as any) {
// 			setIsOpen(false);
// 		}
// 	};

// 	const handleViewDetails = () => {
// 		if (!activeAlarm) return;

// 		onViewDetails(activeAlarm.id);
// 		setIsOpen(false);
// 	};

// 	const handlePlaySound = async () => {
// 		if (!activeAlarm) return;

// 		const success = await persistentNotificationService.playAlarmSoundManually(
// 			activeAlarm.id
// 		);
// 		if (success) {
// 			setSoundPlaying(true);
// 		}
// 	};

// 	const handleStopSound = () => {
// 		if (!activeAlarm) return;

// 		persistentNotificationService.stopSiren(activeAlarm.id);
// 		setSoundPlaying(false);
// 	};

// 	const getSeverityColor = (severity: string) => {
// 		switch (severity) {
// 			case "critical":
// 				return "bg-red-100 text-red-800 border-red-300";
// 			case "high":
// 				return "bg-orange-100 text-orange-800 border-orange-300";
// 			case "medium":
// 				return "bg-yellow-100 text-yellow-800 border-yellow-300";
// 			case "low":
// 				return "bg-green-100 text-green-800 border-green-300";
// 			default:
// 				return "bg-gray-100 text-gray-800 border-gray-300";
// 		}
// 	};

// 	const getTimeAgo = (dateString: string) => {
// 		const now = new Date();
// 		const date = new Date(dateString);
// 		const diffInMinutes = Math.floor(
// 			(now.getTime() - date.getTime()) / (1000 * 60)
// 		);

// 		if (diffInMinutes < 1) return "Just now";
// 		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
// 		return `${Math.floor(diffInMinutes / 60)}h ago`;
// 	};

// 	if (!activeAlarm) return null;

// 	return (
// 		<Dialog open={isOpen} onOpenChange={setIsOpen}>
// 			<DialogContent
// 				className={cn(
// 					"max-w-2xl border-4",
// 					activeAlarm.severity === "critical"
// 						? "border-red-500"
// 						: activeAlarm.severity === "high"
// 						? "border-orange-500"
// 						: "border-yellow-500"
// 				)}>
// 				<DialogHeader>
// 					<DialogTitle className="flex items-center text-xl">
// 						<AlertTriangle
// 							className={cn(
// 								"h-6 w-6 mr-2",
// 								activeAlarm.severity === "critical"
// 									? "text-red-600 animate-pulse"
// 									: activeAlarm.severity === "high"
// 									? "text-orange-600"
// 									: "text-yellow-600"
// 							)}
// 						/>
// 						{activeAlarm.severity === "critical"
// 							? "CRITICAL ALARM REQUIRES ATTENTION"
// 							: activeAlarm.severity === "high"
// 							? "HIGH PRIORITY ALARM"
// 							: "SECURITY ALARM"}
// 					</DialogTitle>
// 					<DialogDescription className="text-base">
// 						This alarm requires your immediate acknowledgment
// 					</DialogDescription>
// 				</DialogHeader>

// 				<div className="space-y-4">
// 					<div className="flex items-center justify-between">
// 						<div className="flex items-center space-x-4">
// 							<div className="relative">
// 								<Bell
// 									className={cn(
// 										"h-10 w-10",
// 										activeAlarm.severity === "critical"
// 											? "text-red-600 animate-bounce"
// 											: activeAlarm.severity === "high"
// 											? "text-orange-600 animate-pulse"
// 											: "text-yellow-600"
// 									)}
// 								/>
// 								{activeAlarm.severity === "critical" && (
// 									<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
// 								)}
// 							</div>
// 							<div>
// 								<h3 className="text-xl font-bold">{activeAlarm.type}</h3>
// 								<p className="text-gray-700 flex items-center">
// 									<MapPin className="h-4 w-4 mr-1" />
// 									{activeAlarm.branchName} - {activeAlarm.location}
// 								</p>
// 								<p className="text-gray-500 text-sm flex items-center mt-1">
// 									<Calendar className="h-3 w-3 mr-1" />
// 									{getTimeAgo(activeAlarm.createdAt)}
// 								</p>
// 							</div>
// 						</div>
// 						<Badge
// 							className={cn(
// 								"text-sm px-3 py-1 font-medium border",
// 								getSeverityColor(activeAlarm.severity),
// 								activeAlarm.severity === "critical" && "animate-pulse"
// 							)}>
// 							{activeAlarm.severity.toUpperCase()}
// 						</Badge>
// 					</div>

// 					<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
// 						<h4 className="font-medium mb-1">Description</h4>
// 						<p>{activeAlarm.description}</p>
// 					</div>

// 					<div className="flex justify-between items-center">
// 						<div>
// 							{soundPlaying ? (
// 								<Button
// 									variant="outline"
// 									size="sm"
// 									onClick={handleStopSound}
// 									className="flex items-center">
// 									<Volume2 className="h-4 w-4 mr-2 animate-pulse" />
// 									Stop Sound
// 								</Button>
// 							) : (
// 								<Button
// 									variant="outline"
// 									size="sm"
// 									onClick={handlePlaySound}
// 									className="flex items-center">
// 									<Volume2 className="h-4 w-4 mr-2" />
// 									Play Sound
// 								</Button>
// 							)}
// 						</div>
// 						<p className="text-gray-500 text-sm italic">
// 							<Clock className="h-3 w-3 inline mr-1" />
// 							This reminder will remain until alarm is acknowledged
// 						</p>
// 					</div>
// 				</div>

// 				<DialogFooter className="flex justify-end space-x-2 sm:space-x-2">
// 					<Button variant="outline" onClick={() => setIsOpen(false)}>
// 						Dismiss
// 					</Button>
// 					<Button
// 						onClick={handleViewDetails}
// 						variant="outline"
// 						className="border-blue-300 text-blue-700 hover:bg-blue-50">
// 						View Details
// 					</Button>
// 					<Button
// 						onClick={handleAcknowledge}
// 						className={cn(
// 							activeAlarm.severity === "critical"
// 								? "bg-red-600 hover:bg-red-700"
// 								: activeAlarm.severity === "high"
// 								? "bg-orange-600 hover:bg-orange-700"
// 								: "bg-yellow-600 hover:bg-yellow-700",
// 							"text-white"
// 						)}>
// 						Acknowledge Alarm
// 					</Button>
// 				</DialogFooter>
// 			</DialogContent>
// 		</Dialog>
// 	);
// }
