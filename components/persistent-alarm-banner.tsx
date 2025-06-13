"use client";

import { useState, useEffect } from "react";
import { Bell, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { persistentNotificationService } from "@/lib/persistent-notification-service";
import { cn } from "@/lib/utils";

export function PersistentAlarmBanner() {
	const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		// Check for unacknowledged alarms
		const checkAlarms = () => {
			const count = persistentNotificationService.getUnacknowledgedCount();
			setUnacknowledgedCount(count);
			setIsVisible(count > 0);

			// Animate if count increases
			if (count > unacknowledgedCount && unacknowledgedCount > 0) {
				setIsAnimating(true);
				setTimeout(() => setIsAnimating(false), 2000);
			}
		};

		// Initial check
		checkAlarms();

		// Set up interval to check periodically
		const interval = setInterval(checkAlarms, 5000);

		return () => clearInterval(interval);
	}, [unacknowledgedCount]);

	if (!isVisible) return null;

	return (
		<div
			className={cn(
				"fixed top-0 left-0 right-0 z-50 p-2 bg-red-600 text-white transition-all duration-300",
				isAnimating ? "animate-pulse" : ""
			)}>
			<div className="container mx-auto flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<AlertTriangle className="h-5 w-5 animate-pulse" />
					<span className="font-medium">
						{unacknowledgedCount} unacknowledged alarm
						{unacknowledgedCount !== 1 ? "s" : ""} require
						{unacknowledgedCount === 1 ? "s" : ""} your attention
					</span>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						size="sm"
						variant="outline"
						className="bg-white text-red-600 hover:bg-red-50 border-white"
						onClick={() =>
							(window.location.href = "/dashboard/police-manager/alarm-reports")
						}>
						<Bell className="h-4 w-4 mr-1" />
						View Alarms
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="text-white hover:bg-red-700"
						onClick={() => setIsVisible(false)}>
						<X className="h-4 w-4" />
						<span className="sr-only">Dismiss</span>
					</Button>
				</div>
			</div>
		</div>
	);
}

// "use client";

// import { useState, useEffect } from "react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { X, Bell, Volume2, VolumeX } from "lucide-react";
// import { persistentNotificationService } from "@/lib/persistent-notification-service";
// import { cn } from "@/lib/utils";

// export function PersistentAlarmBanner() {
// 	const [persistentAlarms, setPersistentAlarms] = useState<any[]>([]);
// 	const [isVisible, setIsVisible] = useState(true);
// 	const [isSirenMuted, setIsSirenMuted] = useState(false);

// 	useEffect(() => {
// 		const updateAlarms = () => {
// 			const alarms = persistentNotificationService.getPersistentAlarms();
// 			setPersistentAlarms(alarms);
// 			setIsVisible(alarms.length > 0);
// 		};

// 		// Initial load
// 		updateAlarms();

// 		// Update every 5 seconds
// 		const interval = setInterval(updateAlarms, 5000);

// 		return () => clearInterval(interval);
// 	}, []);

// 	const handleAcknowledgeAll = async () => {
// 		for (const alarm of persistentAlarms) {
// 			await persistentNotificationService.acknowledgeAlarm(alarm.id);
// 		}
// 		setPersistentAlarms([]);
// 		setIsVisible(false);
// 	};

// 	const handleMuteSiren = () => {
// 		if (isSirenMuted) {
// 			// Unmute - restart sirens for critical alarms
// 			persistentAlarms
// 				.filter(
// 					(alarm) => alarm.severity === "critical" || alarm.severity === "high"
// 				)
// 				.forEach((alarm) => {
// 					// This would restart the siren - you might need to expose this method
// 					console.log("Restarting siren for alarm:", alarm.id);
// 				});
// 		} else {
// 			// Mute all sirens
// 			persistentNotificationService.stopAllSirens();
// 		}
// 		setIsSirenMuted(!isSirenMuted);
// 	};

// 	if (!isVisible || persistentAlarms.length === 0) {
// 		return null;
// 	}

// 	const criticalCount = persistentAlarms.filter(
// 		(alarm) => alarm.severity === "critical"
// 	).length;
// 	const highCount = persistentAlarms.filter(
// 		(alarm) => alarm.severity === "high"
// 	).length;

// 	return (
// 		<Alert
// 			className={cn(
// 				"border-2 shadow-lg transition-all duration-300",
// 				criticalCount > 0
// 					? "border-red-500 bg-gradient-to-r from-red-100 to-red-50"
// 					: "border-orange-500 bg-gradient-to-r from-orange-100 to-orange-50"
// 			)}>
// 			<div className="flex items-center justify-between w-full">
// 				<div className="flex items-center space-x-4">
// 					<div className="relative">
// 						<Bell
// 							className={cn(
// 								"h-6 w-6",
// 								criticalCount > 0
// 									? "text-red-600 animate-bounce"
// 									: "text-orange-600 animate-pulse"
// 							)}
// 						/>
// 						{criticalCount > 0 && (
// 							<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
// 						)}
// 					</div>

// 					<div className="flex-1">
// 						<AlertDescription className="font-medium text-gray-900">
// 							<span
// 								className={cn(
// 									"font-bold",
// 									criticalCount > 0 ? "text-red-800" : "text-orange-800"
// 								)}>
// 								{persistentAlarms.length} Unacknowledged Alarm
// 								{persistentAlarms.length > 1 ? "s" : ""}
// 							</span>
// 							{criticalCount > 0 && (
// 								<span className="ml-2 text-red-700">
// 									• {criticalCount} CRITICAL requiring immediate response
// 								</span>
// 							)}
// 						</AlertDescription>

// 						<div className="flex items-center space-x-2 mt-2">
// 							{criticalCount > 0 && (
// 								<Badge className="bg-red-600 text-white animate-pulse">
// 									{criticalCount} CRITICAL
// 								</Badge>
// 							)}
// 							{highCount > 0 && (
// 								<Badge className="bg-orange-600 text-white">
// 									{highCount} HIGH
// 								</Badge>
// 							)}
// 							<span className="text-sm text-gray-600">
// 								Latest: {persistentAlarms[0]?.type} at{" "}
// 								{persistentAlarms[0]?.branchName}
// 							</span>
// 						</div>
// 					</div>
// 				</div>

// 				<div className="flex items-center space-x-2">
// 					<Button
// 						variant="outline"
// 						size="sm"
// 						onClick={handleMuteSiren}
// 						className={cn(
// 							"border-gray-300",
// 							isSirenMuted ? "bg-gray-100 text-gray-600" : "bg-white"
// 						)}>
// 						{isSirenMuted ? (
// 							<>
// 								<VolumeX className="h-4 w-4 mr-1" />
// 								Unmute
// 							</>
// 						) : (
// 							<>
// 								<Volume2 className="h-4 w-4 mr-1" />
// 								Mute
// 							</>
// 						)}
// 					</Button>

// 					<Button
// 						onClick={handleAcknowledgeAll}
// 						className={cn(
// 							"font-medium",
// 							criticalCount > 0
// 								? "bg-red-600 hover:bg-red-700 text-white"
// 								: "bg-orange-600 hover:bg-orange-700 text-white"
// 						)}
// 						size="sm">
// 						Acknowledge All ({persistentAlarms.length})
// 					</Button>

// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={() => setIsVisible(false)}
// 						className="text-gray-500 hover:text-gray-700">
// 						<X className="h-4 w-4" />
// 					</Button>
// 				</div>
// 			</div>
// 		</Alert>
// 	);
// }
// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { X, Bell, AlertTriangle, Clock } from "lucide-react";
// import { persistentNotificationService } from "@/lib/persistent-notification-service";
// import { cn } from "@/lib/utils";

// export function PersistentAlarmBanner() {
// 	const [persistentAlarms, setPersistentAlarms] = useState<any[]>([]);
// 	const [isVisible, setIsVisible] = useState(false);

// 	useEffect(() => {
// 		const updatePersistentAlarms = () => {
// 			const alarms = persistentNotificationService.getPersistentAlarms();
// 			setPersistentAlarms(alarms);
// 			setIsVisible(alarms.length > 0);
// 		};

// 		// Initial load
// 		updatePersistentAlarms();

// 		// Set up periodic check
// 		const interval = setInterval(updatePersistentAlarms, 5000);

// 		return () => clearInterval(interval);
// 	}, []);

// 	const handleAcknowledgeAll = async () => {
// 		for (const alarm of persistentAlarms) {
// 			await persistentNotificationService.acknowledgeAlarm(alarm.id);
// 		}
// 		setPersistentAlarms([]);
// 		setIsVisible(false);
// 	};

// 	const handleDismissBanner = () => {
// 		setIsVisible(false);
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

// 	if (!isVisible || persistentAlarms.length === 0) {
// 		return null;
// 	}

// 	const criticalCount = persistentAlarms.filter(
// 		(alarm) => alarm.severity === "critical"
// 	).length;
// 	const highCount = persistentAlarms.filter(
// 		(alarm) => alarm.severity === "high"
// 	).length;

// 	return (
// 		<div className="fixed top-0 left-0 right-0 z-50 p-4">
// 			<Card
// 				className={cn(
// 					"border-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100 shadow-2xl",
// 					"animate-pulse"
// 				)}>
// 				<CardContent className="p-6">
// 					<div className="flex items-center justify-between">
// 						<div className="flex items-center space-x-4">
// 							<div className="relative">
// 								<Bell className="h-8 w-8 text-red-600 animate-bounce" />
// 								<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
// 							</div>
// 							<div>
// 								<h3 className="text-xl font-bold text-red-800 flex items-center">
// 									<AlertTriangle className="h-5 w-5 mr-2" />
// 									PERSISTENT ALARMS REQUIRE ACKNOWLEDGMENT
// 								</h3>
// 								<p className="text-red-700 font-medium">
// 									{persistentAlarms.length} unacknowledged alarm
// 									{persistentAlarms.length !== 1 ? "s" : ""}
// 									{criticalCount > 0 && ` • ${criticalCount} Critical`}
// 									{highCount > 0 && ` • ${highCount} High Priority`}
// 								</p>
// 								<div className="flex items-center space-x-2 mt-2">
// 									{persistentAlarms.slice(0, 3).map((alarm) => (
// 										<Badge
// 											key={alarm.id}
// 											className={cn(
// 												"text-xs",
// 												alarm.severity === "critical"
// 													? "bg-red-600 text-white animate-pulse"
// 													: alarm.severity === "high"
// 													? "bg-orange-600 text-white"
// 													: "bg-yellow-600 text-white"
// 											)}>
// 											{alarm.type} • {getTimeAgo(alarm.createdAt)}
// 										</Badge>
// 									))}
// 									{persistentAlarms.length > 3 && (
// 										<Badge className="bg-gray-600 text-white text-xs">
// 											+{persistentAlarms.length - 3} more
// 										</Badge>
// 									)}
// 								</div>
// 							</div>
// 						</div>
// 						<div className="flex items-center space-x-3">
// 							<Button
// 								size="lg"
// 								className="bg-red-600 hover:bg-red-700 text-white font-bold"
// 								onClick={() =>
// 									(window.location.href =
// 										"/dashboard/police-manager/alarm-reports")
// 								}>
// 								<AlertTriangle className="h-5 w-5 mr-2" />
// 								View Alarms
// 							</Button>
// 							<Button
// 								size="lg"
// 								className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
// 								onClick={handleAcknowledgeAll}>
// 								<Clock className="h-5 w-5 mr-2" />
// 								Acknowledge All
// 							</Button>
// 							<Button
// 								variant="outline"
// 								size="sm"
// 								onClick={handleDismissBanner}
// 								className="border-red-300 text-red-700 hover:bg-red-50">
// 								<X className="h-4 w-4" />
// 							</Button>
// 						</div>
// 					</div>
// 				</CardContent>
// 			</Card>
// 		</div>
// 	);
// }
