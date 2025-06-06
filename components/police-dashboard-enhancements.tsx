"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, Shield, Clock, MapPin } from "lucide-react";
import { useNotifications } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";

export function PoliceDashboardEnhancements() {
	const { activeAlarms, hasNewAlarms } = useNotifications();
	const [isAlarmPulsing, setIsAlarmPulsing] = useState(false);

	// Trigger pulsing animation when new alarms arrive
	useEffect(() => {
		if (hasNewAlarms && activeAlarms.length > 0) {
			setIsAlarmPulsing(true);
			const timer = setTimeout(() => setIsAlarmPulsing(false), 5000);
			return () => clearTimeout(timer);
		}
	}, [hasNewAlarms, activeAlarms.length]);

	const criticalAlarms = activeAlarms.filter(
		(alarm) => alarm.severity === "critical"
	);
	const highAlarms = activeAlarms.filter((alarm) => alarm.severity === "high");

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "critical":
				return "bg-red-100 text-red-800 border-red-200";
			case "high":
				return "bg-orange-100 text-orange-800 border-orange-200";
			case "medium":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "low":
				return "bg-green-100 text-green-800 border-green-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
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

	if (activeAlarms.length === 0) {
		return (
			<Card className="border-green-200 bg-green-50">
				<CardContent className="p-6">
					<div className="flex items-center justify-center space-x-4">
						<Shield className="h-8 w-8 text-green-600" />
						<div className="text-center">
							<h3 className="text-lg font-semibold text-green-800">
								All Clear
							</h3>
							<p className="text-sm text-green-600">
								No active alarms at this time
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{/* Large Alarm Bell Indicator */}
			<Card
				className={cn(
					"border-red-500 bg-red-50",
					isAlarmPulsing && "animate-pulse",
					criticalAlarms.length > 0 && "ring-4 ring-red-200"
				)}>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="relative">
								<Bell
									className={cn(
										"h-12 w-12 text-red-500",
										(criticalAlarms.length > 0 || highAlarms.length > 0) &&
											"animate-bounce"
									)}
								/>
								{hasNewAlarms && (
									<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
								)}
							</div>
							<div>
								<h2 className="text-2xl font-bold text-red-800">
									🚨 ACTIVE ALARMS ({activeAlarms.length})
								</h2>
								<p className="text-red-600">
									{criticalAlarms.length > 0 &&
										`${criticalAlarms.length} Critical • `}
									{highAlarms.length > 0 &&
										`${highAlarms.length} High Priority • `}
									Immediate attention required
								</p>
							</div>
						</div>
						<Button
							size="lg"
							className="bg-red-600 hover:bg-red-700 text-white"
							onClick={() => {
								window.location.href =
									"/dashboard/police-manager/alarm-reports";
							}}>
							<AlertTriangle className="h-5 w-5 mr-2" />
							View All Alarms
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Critical Alarms List */}
			{criticalAlarms.length > 0 && (
				<Card className="border-red-500">
					<CardHeader className="bg-red-50">
						<CardTitle className="text-red-800 flex items-center">
							<AlertTriangle className="h-5 w-5 mr-2 animate-pulse" />
							CRITICAL ALARMS - IMMEDIATE RESPONSE REQUIRED
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{criticalAlarms.slice(0, 3).map((alarm) => (
							<div
								key={alarm.id}
								className="p-4 border-b border-red-200 hover:bg-red-50 cursor-pointer"
								onClick={() => {
									window.location.href =
										"/dashboard/police-manager/alarm-reports";
								}}>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
										<div>
											<h4 className="font-semibold text-red-800">
												{alarm.type}
											</h4>
											<p className="text-sm text-red-600 flex items-center">
												<MapPin className="h-3 w-3 mr-1" />
												{alarm.branchName} - {alarm.location}
											</p>
											<p className="text-xs text-red-500 flex items-center mt-1">
												<Clock className="h-3 w-3 mr-1" />
												{getTimeAgo(alarm.createdAt)}
											</p>
										</div>
									</div>
									<Badge className={getSeverityColor(alarm.severity)}>
										CRITICAL
									</Badge>
								</div>
								<p className="text-sm text-gray-700 mt-2 ml-8">
									{alarm.description}
								</p>
							</div>
						))}
						{criticalAlarms.length > 3 && (
							<div className="p-4 text-center bg-red-50">
								<Button
									variant="outline"
									className="border-red-300 text-red-700 hover:bg-red-100"
									onClick={() => {
										window.location.href =
											"/dashboard/police-manager/alarm-reports";
									}}>
									View {criticalAlarms.length - 3} More Critical Alarms
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* High Priority Alarms */}
			{highAlarms.length > 0 && (
				<Card className="border-orange-500">
					<CardHeader className="bg-orange-50">
						<CardTitle className="text-orange-800 flex items-center">
							<AlertTriangle className="h-5 w-5 mr-2" />
							HIGH PRIORITY ALARMS
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{highAlarms.slice(0, 2).map((alarm) => (
							<div
								key={alarm.id}
								className="p-4 border-b border-orange-200 hover:bg-orange-50 cursor-pointer"
								onClick={() => {
									window.location.href =
										"/dashboard/police-manager/alarm-reports";
								}}>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<AlertTriangle className="h-4 w-4 text-orange-500" />
										<div>
											<h4 className="font-medium text-orange-800">
												{alarm.type}
											</h4>
											<p className="text-sm text-orange-600 flex items-center">
												<MapPin className="h-3 w-3 mr-1" />
												{alarm.branchName} - {alarm.location}
											</p>
											<p className="text-xs text-orange-500 flex items-center mt-1">
												<Clock className="h-3 w-3 mr-1" />
												{getTimeAgo(alarm.createdAt)}
											</p>
										</div>
									</div>
									<Badge className={getSeverityColor(alarm.severity)}>
										HIGH
									</Badge>
								</div>
							</div>
						))}
						{highAlarms.length > 2 && (
							<div className="p-4 text-center bg-orange-50">
								<Button
									variant="outline"
									className="border-orange-300 text-orange-700 hover:bg-orange-100"
									onClick={() => {
										window.location.href =
											"/dashboard/police-manager/alarm-reports";
									}}>
									View {highAlarms.length - 2} More High Priority Alarms
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
