"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Shield,
	Bell,
	Zap,
	Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alarm {
	id: string;
	type: string;
	branchName: string;
	location: string;
	status: "ACTIVE" | "acknowledged" | "completed";
	severity: "low" | "medium" | "high" | "critical";
	description: string;
	createdAt: string;
}

interface EnhancedAlarmIndicatorsProps {
	alarms: Alarm[];
	onAcknowledge: (alarmId: string) => void;
	onViewDetails: (alarmId: string) => void;
}

export function EnhancedAlarmIndicators({
	alarms,
	onAcknowledge,
	onViewDetails,
}: EnhancedAlarmIndicatorsProps) {
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const activeAlarms = alarms.filter((alarm) => alarm.status === "ACTIVE");
	const acknowledgedAlarms = alarms.filter(
		(alarm) => alarm.status === "acknowledged"
	);
	const completedAlarms = alarms.filter(
		(alarm) => alarm.status === "completed"
	);
	const criticalAlarms = activeAlarms.filter(
		(alarm) => alarm.severity === "critical"
	);
	const highAlarms = activeAlarms.filter((alarm) => alarm.severity === "high");

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

	return (
		<div className="space-y-6">
			{/* Critical Alarm Banner */}
			{criticalAlarms.length > 0 && (
				<div className="relative overflow-hidden">
					<Card className="border-4 border-red-500 bg-gradient-to-r from-red-100 via-red-50 to-red-100 shadow-2xl">
						<div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-pulse" />
						<CardContent className="p-6 relative z-10">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div className="relative">
										<Bell className="h-12 w-12 text-red-600 animate-bounce" />
										<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
										<Volume2 className="absolute -bottom-1 -right-1 h-4 w-4 text-red-600 animate-pulse" />
									</div>
									<div>
										<h2 className="text-2xl font-bold text-red-800 animate-pulse">
											🚨 CRITICAL SECURITY ALERT
										</h2>
										<p className="text-red-700 font-medium">
											{criticalAlarms.length} critical alarm
											{criticalAlarms.length > 1 ? "s" : ""} requiring immediate
											response
										</p>
										<p className="text-red-600 text-sm">
											Latest: {criticalAlarms[0]?.type} at{" "}
											{criticalAlarms[0]?.branchName} •{" "}
											{getTimeAgo(criticalAlarms[0]?.createdAt)}
										</p>
									</div>
								</div>
								<div className="flex flex-col space-y-2">
									<Button
										onClick={() => onAcknowledge(criticalAlarms[0]?.id)}
										className="bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse"
										size="lg">
										<Clock className="h-5 w-5 mr-2" />
										ACKNOWLEDGE NOW
									</Button>
									<Button
										onClick={() => onViewDetails(criticalAlarms[0]?.id)}
										variant="outline"
										className="border-red-300 text-red-700 hover:bg-red-50">
										View Details
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Enhanced Overview Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				{/* Active Alarms Card */}
				<Card
					className={cn(
						"transition-all duration-300 hover:shadow-lg",
						activeAlarms.length > 0
							? "border-red-300 bg-red-50"
							: "border-green-300 bg-green-50"
					)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
						<div className="relative">
							<AlertTriangle
								className={cn(
									"h-4 w-4",
									activeAlarms.length > 0
										? "text-red-500 animate-pulse"
										: "text-green-500"
								)}
							/>
							{activeAlarms.length > 0 && (
								<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div
							className={cn(
								"text-2xl font-bold",
								activeAlarms.length > 0 ? "text-red-600" : "text-green-600"
							)}>
							{activeAlarms.length}
						</div>
						<p className="text-xs text-muted-foreground">
							{activeAlarms.length > 0
								? "Require immediate attention"
								: "All systems secure"}
						</p>
						{criticalAlarms.length > 0 && (
							<Badge className="mt-2 bg-red-600 text-white animate-pulse">
								{criticalAlarms.length} CRITICAL
							</Badge>
						)}
						{highAlarms.length > 0 && (
							<Badge className="mt-2 ml-1 bg-orange-600 text-white">
								{highAlarms.length} HIGH
							</Badge>
						)}
					</CardContent>
				</Card>

				{/* Acknowledged Alarms Card */}
				<Card
					className={cn(
						"transition-all duration-300 hover:shadow-lg",
						acknowledgedAlarms.length > 0
							? "border-yellow-300 bg-yellow-50"
							: ""
					)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
						<Clock
							className={cn(
								"h-4 w-4",
								acknowledgedAlarms.length > 0
									? "text-yellow-500 animate-spin"
									: "text-gray-400"
							)}
						/>
					</CardHeader>
					<CardContent>
						<div
							className={cn(
								"text-2xl font-bold",
								acknowledgedAlarms.length > 0
									? "text-yellow-600"
									: "text-gray-600"
							)}>
							{acknowledgedAlarms.length}
						</div>
						<p className="text-xs text-muted-foreground">In progress</p>
						{acknowledgedAlarms.length > 0 && (
							<div className="mt-2 w-full bg-yellow-200 rounded-full h-2">
								<div
									className="bg-yellow-600 h-2 rounded-full animate-pulse"
									style={{ width: "60%" }}
								/>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Completed Today Card */}
				<Card className="transition-all duration-300 hover:shadow-lg">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Completed Today
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{completedAlarms.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Successfully resolved
						</p>
						{completedAlarms.length > 0 && (
							<div className="mt-2 flex items-center text-xs text-green-600">
								<CheckCircle className="h-3 w-3 mr-1" />
								Latest: {getTimeAgo(completedAlarms[0]?.createdAt)}
							</div>
						)}
					</CardContent>
				</Card>

				{/* System Status Card */}
				<Card
					className={cn(
						"transition-all duration-300 hover:shadow-lg",
						activeAlarms.length === 0
							? "border-green-300 bg-green-50"
							: "border-gray-300"
					)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">System Status</CardTitle>
						<Shield
							className={cn(
								"h-4 w-4",
								activeAlarms.length === 0 ? "text-green-500" : "text-gray-400"
							)}
						/>
					</CardHeader>
					<CardContent>
						<div
							className={cn(
								"text-lg font-bold",
								activeAlarms.length === 0 ? "text-green-600" : "text-gray-600"
							)}>
							{activeAlarms.length === 0 ? "SECURE" : "ALERT"}
						</div>
						<p className="text-xs text-muted-foreground">
							{activeAlarms.length === 0
								? "All systems operational"
								: `${activeAlarms.length} active alerts`}
						</p>
						<div className="mt-2 text-xs text-gray-500">
							Last updated: {currentTime.toLocaleTimeString()}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Action Panel for Active Alarms */}
			{activeAlarms.length > 0 && (
				<Card className="border-orange-300 bg-orange-50">
					<CardHeader>
						<CardTitle className="text-orange-800 flex items-center">
							<Zap className="h-5 w-5 mr-2 animate-pulse" />
							Quick Actions - Active Alarms
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
							{activeAlarms.slice(0, 6).map((alarm) => (
								<div
									key={alarm.id}
									className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900 truncate">
											{alarm.type}
										</p>
										<p className="text-xs text-gray-500 truncate">
											{alarm.branchName}
										</p>
										<Badge
											className={cn(
												"text-xs mt-1",
												alarm.severity === "critical"
													? "bg-red-100 text-red-800"
													: alarm.severity === "high"
													? "bg-orange-100 text-orange-800"
													: alarm.severity === "medium"
													? "bg-yellow-100 text-yellow-800"
													: "bg-green-100 text-green-800"
											)}>
											{alarm.severity}
										</Badge>
									</div>
									<Button
										size="sm"
										onClick={() => onAcknowledge(alarm.id)}
										className="ml-2 bg-yellow-600 hover:bg-yellow-700 text-white">
										ACK
									</Button>
								</div>
							))}
						</div>
						{activeAlarms.length > 6 && (
							<p className="text-center text-sm text-gray-500 mt-3">
								+{activeAlarms.length - 6} more active alarms
							</p>
						)}
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
