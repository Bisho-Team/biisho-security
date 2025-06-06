"use client";

import { useEffect, useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";

export function AlarmIndicator() {
	const { activeAlarms, hasNewAlarms, markAlarmsAsViewed } = useNotifications();
	const [isOpen, setIsOpen] = useState(false);

	// Auto-open popover when new alarms arrive
	useEffect(() => {
		console.log("Active alarms:", activeAlarms);
		console.log("Has new alarms:", hasNewAlarms);
		if (hasNewAlarms && activeAlarms.length > 0) {
			setIsOpen(true);
		}
	}, [hasNewAlarms, activeAlarms.length]);

	const criticalAlarms = activeAlarms.filter(
		(alarm) => alarm.severity === "critical"
	);
	const highAlarms = activeAlarms.filter((alarm) => alarm.severity === "high");
	const totalActiveAlarms = activeAlarms.length;

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "critical":
				return "bg-red-100 text-red-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "medium":
				return "bg-yellow-100 text-yellow-800";
			case "low":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
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
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	if (totalActiveAlarms === 0) {
		return (
			<Button variant="ghost" size="sm" className="relative">
				<Bell className="h-5 w-5" />
			</Button>
		);
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="relative"
					onClick={() => {
						setIsOpen(!isOpen);
						if (!isOpen) {
							markAlarmsAsViewed();
						}
					}}>
					<div className="relative">
						<Bell
							className={cn(
								"h-6 w-6",
								criticalAlarms.length > 0 || highAlarms.length > 0
									? "text-red-500 animate-pulse"
									: "text-orange-500"
							)}
						/>
						{hasNewAlarms && (
							<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
						)}
					</div>
					{totalActiveAlarms > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
							{totalActiveAlarms > 99 ? "99+" : totalActiveAlarms}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-96 p-0" align="end">
				<div className="p-4 border-b">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-lg flex items-center">
							<AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
							Active Alarms ({totalActiveAlarms})
						</h3>
						{hasNewAlarms && (
							<Badge variant="destructive" className="animate-pulse">
								New
							</Badge>
						)}
					</div>
					{criticalAlarms.length > 0 && (
						<p className="text-sm text-red-600 mt-1">
							{criticalAlarms.length} critical alarm
							{criticalAlarms.length !== 1 ? "s" : ""} require immediate
							attention
						</p>
					)}
				</div>
				<div className="max-h-96 overflow-y-auto">
					{activeAlarms.slice(0, 10).map((alarm) => (
						<div
							key={alarm.id}
							className={cn(
								"p-4 border-b hover:bg-gray-50 cursor-pointer",
								alarm.severity === "critical" &&
									"bg-red-50 border-l-4 border-l-red-500",
								alarm.severity === "high" &&
									"bg-orange-50 border-l-4 border-l-orange-500"
							)}
							onClick={() => {
								window.location.href =
									"/dashboard/police-manager/alarm-reports";
							}}>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<h4 className="font-medium text-sm">{alarm.type}</h4>
										<Badge
											className={getSeverityColor(alarm.severity)}
											variant="secondary">
											{alarm.severity}
										</Badge>
									</div>
									<p className="text-xs text-gray-600 mt-1">
										{alarm.branchName} - {alarm.location}
									</p>
									<p className="text-xs text-gray-500 mt-1 line-clamp-2">
										{alarm.description}
									</p>
									<p className="text-xs text-gray-400 mt-2">
										{getTimeAgo(alarm.createdAt)}
									</p>
								</div>
								{(alarm.severity === "critical" ||
									alarm.severity === "high") && (
									<AlertTriangle className="h-4 w-4 text-red-500 animate-pulse flex-shrink-0 ml-2" />
								)}
							</div>
						</div>
					))}
					{activeAlarms.length > 10 && (
						<div className="p-4 text-center">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									window.location.href =
										"/dashboard/police-manager/alarm-reports";
								}}>
								View All {totalActiveAlarms} Alarms
							</Button>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
