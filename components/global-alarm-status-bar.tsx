"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGlobalAlarms } from "@/components/global-alarm-provider";
import {
	AlertTriangle,
	Volume2,
	VolumeX,
	Monitor,
	MonitorOff,
	Wifi,
	WifiOff,
	Eye,
	CheckCircle,
	Minimize2,
	Maximize2,
	StopCircle,
	TestTube,
	RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { audioService } from "@/lib/audio-service";

export function GlobalAlarmStatusBar() {
	const {
		activeAlarms,
		isConnected,
		audioEnabled,
		modalEnabled,
		setAudioEnabled,
		setModalEnabled,
		acknowledgeAlarm,
		refreshAlarms,
		getAlarmStats,
	} = useGlobalAlarms();

	const [isMinimized, setIsMinimized] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const stats = getAlarmStats();
	const hasActiveAlarms = activeAlarms.length > 0;

	// Don't show if no active alarms and minimized
	if (!hasActiveAlarms && isMinimized) {
		return null;
	}

	const handleQuickAcknowledge = async () => {
		if (activeAlarms.length > 0) {
			setIsUpdating(true);
			try {
				// Acknowledge the first (highest priority) active alarm
				await acknowledgeAlarm(activeAlarms[0].id);
			} finally {
				setIsUpdating(false);
			}
		}
	};

	if (isMinimized) {
		return (
			<div className="fixed top-4 right-4 z-[9997]">
				<Card className="bg-slate-900 border-slate-700 shadow-2xl">
					<CardContent className="p-3">
						<div className="flex items-center space-x-3">
							{hasActiveAlarms && (
								<div className="flex items-center space-x-2">
									<AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
									<Badge className="bg-red-600 text-white">
										{activeAlarms.length}
									</Badge>
								</div>
							)}

							<div className="flex items-center space-x-1">
								{isConnected ? (
									<Wifi className="h-3 w-3 text-green-400" />
								) : (
									<WifiOff className="h-3 w-3 text-red-400" />
								)}

								{audioEnabled ? (
									<Volume2 className="h-3 w-3 text-blue-400" />
								) : (
									<VolumeX className="h-3 w-3 text-slate-400" />
								)}

								{modalEnabled ? (
									<Monitor className="h-3 w-3 text-purple-400" />
								) : (
									<MonitorOff className="h-3 w-3 text-slate-400" />
								)}
							</div>

							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsMinimized(false)}
								className="h-6 w-6 p-0 text-slate-400 hover:text-white">
								<Maximize2 className="h-3 w-3" />
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 z-[9997]">
			<Card className="bg-slate-900 border-slate-700 shadow-2xl max-w-md">
				<CardContent className="p-4">
					<div className="space-y-3">
						{/* Header */}
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5 text-red-400" />
								<span className="text-white font-medium">Alarm Status</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsMinimized(true)}
								className="h-6 w-6 p-0 text-slate-400 hover:text-white">
								<Minimize2 className="h-3 w-3" />
							</Button>
						</div>

						{/* Connection Status */}
						<div className="flex items-center justify-between">
							<span className="text-slate-400 text-sm">Connection:</span>
							<div className="flex items-center space-x-2">
								{isConnected ? (
									<>
										<Wifi className="h-4 w-4 text-green-400" />
										<span className="text-green-400 text-sm">Connected</span>
									</>
								) : (
									<>
										<WifiOff className="h-4 w-4 text-red-400" />
										<span className="text-red-400 text-sm">Disconnected</span>
									</>
								)}
							</div>
						</div>

						{/* Alarm Stats */}
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div className="flex justify-between">
								<span className="text-slate-400">Active:</span>
								<Badge
									className={cn(
										"text-xs",
										stats.active > 0 ? "bg-red-600" : "bg-slate-600"
									)}>
									{stats.active}
								</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-400">Total:</span>
								<Badge variant="outline" className="text-xs border-slate-600">
									{stats.total}
								</Badge>
							</div>
						</div>

						{/* Alert Controls */}
						{/* <div className="flex items-center justify-between">
							<span className="text-slate-400 text-sm">Alerts:</span>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setAudioEnabled(!audioEnabled);
										audioService.setEnabled(!audioEnabled);
									}}
									className={cn(
										"h-7 w-7 p-0 border-slate-600",
										audioEnabled
											? "bg-blue-600/20 text-blue-400"
											: "bg-slate-600/20 text-slate-400"
									)}
									title="Toggle audio alerts">
									{audioEnabled ? (
										<Volume2 className="h-3 w-3" />
									) : (
										<VolumeX className="h-3 w-3" />
									)}
								</Button>

								<Button
									variant="outline"
									size="sm"
									onClick={() => setModalEnabled(!modalEnabled)}
									className={cn(
										"h-7 w-7 p-0 border-slate-600",
										modalEnabled
											? "bg-purple-600/20 text-purple-400"
											: "bg-slate-600/20 text-slate-400"
									)}
									title="Toggle modal alerts">
									{modalEnabled ? (
										<Monitor className="h-3 w-3" />
									) : (
										<MonitorOff className="h-3 w-3" />
									)}
								</Button>

								<Button
									variant="outline"
									size="sm"
									onClick={() => audioService.forceStopAllAlerts()}
									className="h-7 w-7 p-0 border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600/40"
									title="Emergency stop all alerts">
									<StopCircle className="h-3 w-3" />
								</Button>
							</div>
						</div> */}

						{/* Quick Actions */}
						{hasActiveAlarms && (
							<div className="flex items-center space-x-2">
								<Button
									onClick={handleQuickAcknowledge}
									disabled={isUpdating}
									size="sm"
									className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white">
									{isUpdating ? (
										<RefreshCw className="h-3 w-3 mr-1 animate-spin" />
									) : (
										<CheckCircle className="h-3 w-3 mr-1" />
									)}
									Quick Ack
								</Button>

								<Button
									onClick={() =>
										(window.location.href = "/dashboard/alarm-reports")
									}
									size="sm"
									variant="outline"
									className="border-slate-600 text-slate-300 hover:bg-slate-800">
									<Eye className="h-3 w-3 mr-1" />
									View All
								</Button>
							</div>
						)}

						{/* Test Controls */}
						{/* <div className="flex items-center justify-between pt-2 border-t border-slate-700"> */}
						{/* <Button
								variant="outline"
								size="sm"
								onClick={() => audioService.testAllSounds()}
								className="border-slate-600 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
								title="Test alarm sounds">
								<TestTube className="h-3 w-3 mr-1" />
								Test
							</Button> */}

						{/* <Button
								variant="outline"
								size="sm"
								onClick={refreshAlarms}
								className="border-slate-600 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40"
								title="Refresh alarms">
								<RefreshCw className="h-3 w-3 mr-1" />
								Refresh
							</Button> */}
						{/* </div> */}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
