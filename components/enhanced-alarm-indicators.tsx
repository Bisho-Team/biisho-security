"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Bell,
	AlertTriangle,
	Clock,
	CheckCircle,
	Volume2,
	VolumeX,
} from "lucide-react";
import { persistentNotificationService } from "@/lib/persistent-notification-service";
import { cn } from "@/lib/utils";

interface EnhancedAlarmIndicatorsProps {
	alarms: any[];
	onAcknowledge: (alarmId: string) => Promise<boolean>;
	onViewDetails: (alarmId: string) => void;
}

export function EnhancedAlarmIndicators({
	alarms,
	onAcknowledge,
	onViewDetails,
}: EnhancedAlarmIndicatorsProps) {
	const [activeAlarms, setActiveAlarms] = useState<any[]>([]);
	const [criticalCount, setCriticalCount] = useState(0);
	const [highCount, setHighCount] = useState(0);
	const [mediumCount, setMediumCount] = useState(0);
	const [lowCount, setLowCount] = useState(0);
	const [soundEnabled, setSoundEnabled] = useState(true);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		// Filter active alarms and count by severity
		const active = alarms.filter((alarm) => alarm.status === "active");
		setActiveAlarms(active);

		const critical = active.filter(
			(alarm) => alarm.severity === "critical"
		).length;
		const high = active.filter((alarm) => alarm.severity === "high").length;
		const medium = active.filter((alarm) => alarm.severity === "medium").length;
		const low = active.filter((alarm) => alarm.severity === "low").length;

		// Animate if critical or high count increases
		if (critical > criticalCount || high > highCount) {
			setIsAnimating(true);
			setTimeout(() => setIsAnimating(false), 2000);
		}

		setCriticalCount(critical);
		setHighCount(high);
		setMediumCount(medium);
		setLowCount(low);
	}, [alarms, criticalCount, highCount]);

	const toggleSound = () => {
		if (soundEnabled) {
			persistentNotificationService.stopAllSirens();
		} else {
			// Restart sirens for critical and high alarms
			const criticalAndHighAlarms = activeAlarms.filter(
				(alarm) => alarm.severity === "critical" || alarm.severity === "high"
			);
			criticalAndHighAlarms.forEach((alarm) => {
				persistentNotificationService.playAlarmSoundManually(alarm.id);
			});
		}
		setSoundEnabled(!soundEnabled);
	};

	// If no active alarms, don't show the component
	if (activeAlarms.length === 0) return null;

	return (
		<div className={cn("space-y-4", isAnimating ? "animate-shake" : "")}>
			{(criticalCount > 0 || highCount > 0) && (
				<Card
					className={cn(
						"border-4 transition-all duration-300",
						criticalCount > 0
							? "border-red-500 bg-gradient-to-r from-red-50 to-red-100"
							: "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100"
					)}>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-4">
								<div className="relative">
									<Bell
										className={cn(
											"h-12 w-12",
											criticalCount > 0
												? "text-red-600 animate-bounce"
												: highCount > 0
												? "text-orange-600 animate-pulse"
												: "text-yellow-600"
										)}
									/>
									{criticalCount > 0 && (
										<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
									)}
								</div>
								<div>
									<h3 className="text-xl font-bold">
										{criticalCount > 0
											? "CRITICAL SECURITY ALERTS"
											: highCount > 0
											? "HIGH PRIORITY ALERTS"
											: "ACTIVE ALERTS"}
									</h3>
									<p className="text-gray-700">
										{activeAlarms.length} active alarm
										{activeAlarms.length !== 1 ? "s" : ""} require
										{activeAlarms.length === 1 ? "s" : ""} your attention
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="icon"
									onClick={toggleSound}
									className={cn(
										"rounded-full",
										soundEnabled
											? "bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
									)}>
									{soundEnabled ? (
										<Volume2 className="h-4 w-4" />
									) : (
										<VolumeX className="h-4 w-4" />
									)}
									<span className="sr-only">
										{soundEnabled ? "Mute" : "Unmute"}
									</span>
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-4 gap-4 mt-4">
							{criticalCount > 0 && (
								<div className="bg-red-200 p-3 rounded-lg border border-red-300 flex items-center justify-between">
									<div className="flex items-center">
										<AlertTriangle className="h-5 w-5 text-red-700 mr-2 animate-pulse" />
										<span className="font-medium text-red-800">Critical</span>
									</div>
									<Badge className="bg-red-600">{criticalCount}</Badge>
								</div>
							)}

							{highCount > 0 && (
								<div className="bg-orange-200 p-3 rounded-lg border border-orange-300 flex items-center justify-between">
									<div className="flex items-center">
										<AlertTriangle className="h-5 w-5 text-orange-700 mr-2" />
										<span className="font-medium text-orange-800">High</span>
									</div>
									<Badge className="bg-orange-600">{highCount}</Badge>
								</div>
							)}

							{mediumCount > 0 && (
								<div className="bg-yellow-200 p-3 rounded-lg border border-yellow-300 flex items-center justify-between">
									<div className="flex items-center">
										<Clock className="h-5 w-5 text-yellow-700 mr-2" />
										<span className="font-medium text-yellow-800">Medium</span>
									</div>
									<Badge className="bg-yellow-600">{mediumCount}</Badge>
								</div>
							)}

							{lowCount > 0 && (
								<div className="bg-green-200 p-3 rounded-lg border border-green-300 flex items-center justify-between">
									<div className="flex items-center">
										<CheckCircle className="h-5 w-5 text-green-700 mr-2" />
										<span className="font-medium text-green-800">Low</span>
									</div>
									<Badge className="bg-green-600">{lowCount}</Badge>
								</div>
							)}
						</div>

						<div className="flex justify-end mt-4 space-x-2">
							<Button
								onClick={() => {
									// Find the most critical active alarm
									const mostCritical = activeAlarms.sort((a: any, b: any) => {
										const severityOrder: any = {
											CRITICAL: 0,
											HIGH: 1,
											MEDIUM: 2,
											LOW: 3,
										};
										return (
											severityOrder[a.severity] - severityOrder[b.severity]
										);
									})[0];

									if (mostCritical) {
										onViewDetails(mostCritical.id);
									}
								}}
								variant="outline"
								className="border-blue-300 text-blue-700 hover:bg-blue-50">
								View Details
							</Button>
							<Button
								onClick={() => {
									// Find the most critical active alarm
									const mostCritical = activeAlarms.sort((a, b) => {
										const severityOrder: any = {
											critical: 0,
											high: 1,
											medium: 2,
											low: 3,
										};
										return (
											severityOrder[a.severity] - severityOrder[b.severity]
										);
									})[0];

									if (mostCritical) {
										onAcknowledge(mostCritical.id);
									}
								}}
								className={cn(
									criticalCount > 0
										? "bg-red-600 hover:bg-red-700"
										: highCount > 0
										? "bg-orange-600 hover:bg-orange-700"
										: "bg-yellow-600 hover:bg-yellow-700",
									"text-white"
								)}>
								Acknowledge Most Critical
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
// 	AlertTriangle,
// 	Bell,
// 	Shield,
// 	Clock,
// 	MapPin,
// 	Zap,
// 	Siren,
// } from "lucide-react";
// import { useNotifications } from "@/contexts/notification-context";
// import { cn } from "@/lib/utils";

// interface EnhancedAlarmIndicatorsProps {
// 	alarms: any[];
// 	onAcknowledge?: (alarmId: string) => void;
// 	onViewDetails?: (alarmId: string) => void;
// }

// export function EnhancedAlarmIndicators({
// 	alarms,
// 	onAcknowledge,
// 	onViewDetails,
// }: EnhancedAlarmIndicatorsProps) {
// 	const { hasNewAlarms } = useNotifications();
// 	const [isGlowing, setIsGlowing] = useState(false);

// 	const criticalAlarms = alarms.filter(
// 		(alarm) => alarm.severity === "critical" && alarm.status === "ACTIVE"
// 	);
// 	const highAlarms = alarms.filter(
// 		(alarm) => alarm.severity === "high" && alarm.status === "ACTIVE"
// 	);
// 	const activeAlarms = alarms.filter((alarm) => alarm.status === "ACTIVE");

// 	// Trigger glow effect for new alarms
// 	useEffect(() => {
// 		if (hasNewAlarms && activeAlarms.length > 0) {
// 			setIsGlowing(true);
// 			const timer = setTimeout(() => setIsGlowing(false), 10000);
// 			return () => clearTimeout(timer);
// 		}
// 	}, [hasNewAlarms, activeAlarms.length]);

// 	const getSeverityColor = (severity: string) => {
// 		switch (severity) {
// 			case "critical":
// 				return "from-red-500 to-red-700";
// 			case "high":
// 				return "from-orange-500 to-orange-700";
// 			case "medium":
// 				return "from-yellow-500 to-yellow-700";
// 			case "low":
// 				return "from-green-500 to-green-700";
// 			default:
// 				return "from-gray-500 to-gray-700";
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

// 	if (activeAlarms.length === 0) {
// 		return (
// 			<Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
// 				<CardContent className="p-8">
// 					<div className="flex items-center justify-center space-x-6">
// 						<div className="relative">
// 							<Shield className="h-16 w-16 text-green-600" />
// 							<div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
// 								<span className="text-white text-xs font-bold">✓</span>
// 							</div>
// 						</div>
// 						<div className="text-center">
// 							<h2 className="text-2xl font-bold text-green-800 mb-2">
// 								System Secure
// 							</h2>
// 							<p className="text-green-600 text-lg">
// 								No active security alarms
// 							</p>
// 							<p className="text-green-500 text-sm mt-1">
// 								All systems operational
// 							</p>
// 						</div>
// 					</div>
// 				</CardContent>
// 			</Card>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6">
// 			{/* Critical Alert Banner */}
// 			{criticalAlarms.length > 0 && (
// 				<Card
// 					className={cn(
// 						"border-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100 relative overflow-hidden",
// 						isGlowing && "animate-pulse shadow-2xl shadow-red-500/50"
// 					)}>
// 					{/* Animated background effect */}
// 					<div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-pulse" />

// 					<CardContent className="p-8 relative z-10">
// 						<div className="flex items-center justify-between">
// 							<div className="flex items-center space-x-6">
// 								<div className="relative">
// 									<div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
// 									<div className="relative bg-red-600 p-4 rounded-full">
// 										<Siren className="h-12 w-12 text-white animate-bounce" />
// 									</div>
// 								</div>
// 								<div>
// 									<div className="flex items-center space-x-3 mb-2">
// 										<h1 className="text-4xl font-black text-red-800">
// 											🚨 CRITICAL ALERT
// 										</h1>
// 										<Badge className="bg-red-600 text-white text-lg px-4 py-2 animate-pulse">
// 											{criticalAlarms.length} ACTIVE
// 										</Badge>
// 									</div>
// 									<p className="text-red-700 text-xl font-semibold">
// 										IMMEDIATE RESPONSE REQUIRED
// 									</p>
// 									<p className="text-red-600 text-lg">
// 										High-priority security breach detected
// 									</p>
// 								</div>
// 							</div>
// 							<Button
// 								size="lg"
// 								className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
// 								onClick={() =>
// 									(window.location.href =
// 										"/dashboard/police-manager/alarm-reports")
// 								}>
// 								<AlertTriangle className="h-6 w-6 mr-3" />
// 								RESPOND NOW
// 							</Button>
// 						</div>
// 					</CardContent>
// 				</Card>
// 			)}

// 			{/* Enhanced Stat Cards with Embedded Alarms */}
// 			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// 				{/* Active Alarms Card */}
// 				<Card
// 					className={cn(
// 						"relative overflow-hidden transition-all duration-300",
// 						activeAlarms.length > 0
// 							? "border-2 border-red-500 bg-gradient-to-br from-red-50 to-red-100"
// 							: "border-gray-200"
// 					)}>
// 					{activeAlarms.length > 0 && (
// 						<div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" />
// 					)}
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
// 						<div className="relative">
// 							<AlertTriangle
// 								className={cn(
// 									"h-5 w-5",
// 									activeAlarms.length > 0
// 										? "text-red-500 animate-pulse"
// 										: "text-gray-400"
// 								)}
// 							/>
// 							{activeAlarms.length > 0 && (
// 								<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
// 							)}
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-3xl font-bold text-red-600 mb-2">
// 							{activeAlarms.length}
// 						</div>
// 						{activeAlarms.length > 0 ? (
// 							<div className="space-y-2">
// 								<p className="text-xs text-red-600 font-medium">
// 									REQUIRES ATTENTION
// 								</p>
// 								<div className="flex flex-wrap gap-1">
// 									{criticalAlarms.length > 0 && (
// 										<Badge className="bg-red-600 text-white text-xs animate-pulse">
// 											{criticalAlarms.length} Critical
// 										</Badge>
// 									)}
// 									{highAlarms.length > 0 && (
// 										<Badge className="bg-orange-600 text-white text-xs">
// 											{highAlarms.length} High
// 										</Badge>
// 									)}
// 								</div>
// 							</div>
// 						) : (
// 							<p className="text-xs text-muted-foreground">All clear</p>
// 						)}
// 					</CardContent>
// 				</Card>

// 				{/* Critical Alarms Card */}
// 				<Card
// 					className={cn(
// 						"relative overflow-hidden transition-all duration-300",
// 						criticalAlarms.length > 0
// 							? "border-2 border-red-600 bg-gradient-to-br from-red-100 to-red-200"
// 							: "border-gray-200"
// 					)}>
// 					{criticalAlarms.length > 0 && (
// 						<>
// 							<div className="absolute top-0 right-0 w-full h-1 bg-red-600 animate-pulse" />
// 							<div className="absolute inset-0 bg-red-500/5 animate-pulse" />
// 						</>
// 					)}
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Critical Alarms
// 						</CardTitle>
// 						<Zap
// 							className={cn(
// 								"h-5 w-5",
// 								criticalAlarms.length > 0
// 									? "text-red-600 animate-bounce"
// 									: "text-gray-400"
// 							)}
// 						/>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-3xl font-bold text-red-700 mb-2">
// 							{criticalAlarms.length}
// 						</div>
// 						{criticalAlarms.length > 0 ? (
// 							<div className="space-y-2">
// 								<p className="text-xs text-red-700 font-bold">
// 									EMERGENCY RESPONSE
// 								</p>
// 								<Button
// 									size="sm"
// 									className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
// 									onClick={() =>
// 										(window.location.href =
// 											"/dashboard/police-manager/alarm-reports?filter=critical")
// 									}>
// 									View Critical
// 								</Button>
// 							</div>
// 						) : (
// 							<p className="text-xs text-muted-foreground">
// 								No critical alerts
// 							</p>
// 						)}
// 					</CardContent>
// 				</Card>

// 				{/* Response Time Card */}
// 				<Card className="border-gray-200">
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Avg Response Time
// 						</CardTitle>
// 						<Clock className="h-5 w-5 text-blue-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-3xl font-bold text-blue-600 mb-2">2.3m</div>
// 						<p className="text-xs text-muted-foreground">For critical alarms</p>
// 					</CardContent>
// 				</Card>

// 				{/* System Status Card */}
// 				<Card className="border-gray-200">
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">System Status</CardTitle>
// 						<Shield className="h-5 w-5 text-green-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-3xl font-bold text-green-600 mb-2">98.9%</div>
// 						<p className="text-xs text-muted-foreground">Uptime this month</p>
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Large Animated Alarm Bell */}
// 			{activeAlarms.length > 0 && (
// 				<Card
// 					className={cn(
// 						"border-4 border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 relative overflow-hidden",
// 						isGlowing && "shadow-2xl shadow-orange-500/30"
// 					)}>
// 					<div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 animate-pulse" />

// 					<CardContent className="p-8 relative z-10">
// 						<div className="flex items-center justify-between">
// 							<div className="flex items-center space-x-8">
// 								<div className="relative">
// 									<div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-30" />
// 									<div className="absolute inset-2 bg-orange-400 rounded-full animate-ping opacity-50 animation-delay-75" />
// 									<div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-full shadow-lg">
// 										<Bell className="h-16 w-16 text-white animate-swing" />
// 									</div>
// 									{hasNewAlarms && (
// 										<div className="absolute -top-2 -right-2 h-8 w-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
// 											<span className="text-white text-sm font-bold">!</span>
// 										</div>
// 									)}
// 								</div>
// 								<div>
// 									<h2 className="text-3xl font-bold text-orange-800 mb-2">
// 										🔔 ALARM SYSTEM ACTIVE
// 									</h2>
// 									<p className="text-orange-700 text-xl font-semibold mb-1">
// 										{activeAlarms.length} alarm
// 										{activeAlarms.length !== 1 ? "s" : ""} requiring attention
// 									</p>
// 									<div className="flex items-center space-x-4">
// 										{criticalAlarms.length > 0 && (
// 											<Badge className="bg-red-600 text-white px-3 py-1 animate-pulse">
// 												{criticalAlarms.length} Critical
// 											</Badge>
// 										)}
// 										{highAlarms.length > 0 && (
// 											<Badge className="bg-orange-600 text-white px-3 py-1">
// 												{highAlarms.length} High Priority
// 											</Badge>
// 										)}
// 									</div>
// 								</div>
// 							</div>
// 							<div className="flex flex-col space-y-3">
// 								<Button
// 									size="lg"
// 									className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
// 									onClick={() =>
// 										(window.location.href =
// 											"/dashboard/police-manager/alarm-reports")
// 									}>
// 									<AlertTriangle className="h-5 w-5 mr-2" />
// 									View All Alarms
// 								</Button>
// 								{criticalAlarms.length > 0 && (
// 									<Button
// 										size="lg"
// 										className="bg-red-600 hover:bg-red-700 text-white text-lg px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse"
// 										onClick={() =>
// 											(window.location.href =
// 												"/dashboard/police-manager/alarm-reports?filter=critical")
// 										}>
// 										<Zap className="h-5 w-5 mr-2" />
// 										Critical Only
// 									</Button>
// 								)}
// 							</div>
// 						</div>
// 					</CardContent>
// 				</Card>
// 			)}

// 			{/* Recent Critical Alarms Preview */}
// 			{criticalAlarms.length > 0 && (
// 				<Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-red-100">
// 					<CardHeader className="bg-red-100 border-b border-red-200">
// 						<CardTitle className="text-red-800 flex items-center text-xl">
// 							<Zap className="h-6 w-6 mr-3 animate-pulse" />
// 							CRITICAL ALARMS - IMMEDIATE ACTION REQUIRED
// 						</CardTitle>
// 					</CardHeader>
// 					<CardContent className="p-0">
// 						{criticalAlarms.slice(0, 3).map((alarm, index) => (
// 							<div
// 								key={alarm.id}
// 								className={cn(
// 									"p-6 border-b border-red-200 hover:bg-red-50 cursor-pointer transition-all",
// 									index === 0 && "bg-red-50"
// 								)}
// 								onClick={() => onViewDetails?.(alarm.id)}>
// 								<div className="flex items-center justify-between">
// 									<div className="flex items-center space-x-4">
// 										<div className="relative">
// 											<AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />
// 											<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
// 										</div>
// 										<div>
// 											<h4 className="font-bold text-red-800 text-lg">
// 												{alarm.type}
// 											</h4>
// 											<p className="text-red-700 flex items-center font-medium">
// 												<MapPin className="h-4 w-4 mr-1" />
// 												{alarm.branchName} - {alarm.location}
// 											</p>
// 											<p className="text-red-600 text-sm flex items-center mt-1">
// 												<Clock className="h-3 w-3 mr-1" />
// 												{getTimeAgo(alarm.createdAt)} • Created by{" "}
// 												{alarm.createdBy}
// 											</p>
// 										</div>
// 									</div>
// 									<div className="flex items-center space-x-3">
// 										<Badge className="bg-red-600 text-white text-lg px-4 py-2 animate-pulse">
// 											CRITICAL
// 										</Badge>
// 										<Button
// 											size="sm"
// 											className="bg-yellow-600 hover:bg-yellow-700 text-white"
// 											onClick={(e) => {
// 												e.stopPropagation();
// 												onAcknowledge?.(alarm.id);
// 											}}>
// 											Acknowledge
// 										</Button>
// 									</div>
// 								</div>
// 								<div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
// 									<p className="text-red-800 font-medium">
// 										{alarm.description}
// 									</p>
// 								</div>
// 							</div>
// 						))}
// 						{criticalAlarms.length > 3 && (
// 							<div className="p-6 text-center bg-red-50">
// 								<Button
// 									className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3"
// 									onClick={() =>
// 										(window.location.href =
// 											"/dashboard/police-manager/alarm-reports?filter=critical")
// 									}>
// 									View All {criticalAlarms.length} Critical Alarms
// 								</Button>
// 							</div>
// 						)}
// 					</CardContent>
// 				</Card>
// 			)}
// 		</div>
// 	);
// }
