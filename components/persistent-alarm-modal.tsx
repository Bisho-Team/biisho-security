"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	AlertTriangle,
	MapPin,
	Clock,
	User,
	Building,
	CheckCircle,
	Loader2,
	X,
	Minimize2,
	Map,
	Phone,
	Target,
	Eye,
	Copy,
	ExternalLink,
	Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alarm {
	id: string;
	type: string;
	branchId: string;
	branch: {
		id: string;
		name: string;
		locationType?: string;
		city?: string;
		subCity?: string;
		woreda?: string;
		country?: string;
		managerName?: string;
		phoneNumber?: string;
		contactNumber1?: string;
		company?: {
			id: string;
			name: string;
			logo: string;
		};
	};
	location: string;
	latitude: string;
	longitude: string;
	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	additionalNotes?: string;
	createdBy: {
		id: string;
		name: string;
	};
	createdAt: string;
	isRealTime?: boolean;
}

interface PersistentAlarmModalProps {
	alarms: Alarm[];
	onAcknowledge: (alarmId: string) => Promise<void>;
	onViewDetails: (alarmId: string) => void;
	onStatusChange?: (
		alarmId: string,
		status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED"
	) => Promise<void>;
	isAcknowledging: boolean;
}

// Enhanced Google Maps Component
interface GoogleMapProps {
	latitude: number;
	longitude: number;
	title: string;
}

function GoogleMap({ latitude, longitude, title }: GoogleMapProps) {
	return (
		<div className="w-full h-48 rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
			<iframe
				src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&q=${latitude},${longitude}&zoom=16&maptype=roadmap`}
				width="100%"
				height="100%"
				style={{ border: 0 }}
				allowFullScreen
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
				title={title}
			/>
		</div>
	);
}

export function PersistentAlarmModal({
	alarms,
	onAcknowledge,
	onViewDetails,
	onStatusChange,
	isAcknowledging,
}: PersistentAlarmModalProps) {
	// Core state - keep minimal and stable
	const [currentAlarmIndex, setCurrentAlarmIndex] = useState(0);
	const [isMinimized, setIsMinimized] = useState(false);
	const [dismissedAlarms, setDismissedAlarms] = useState<Set<string>>(
		new Set()
	);
	const [lastInteraction, setLastInteraction] = useState(Date.now());

	// Refs for timers
	const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);
	const dismissTimer = useRef<NodeJS.Timeout | null>(null);

	// Stable computation of active alarms
	const activeAlarms = useMemo(() => {
		return alarms.filter(
			(alarm: any) =>
				alarm.status === "ACTIVE" && !dismissedAlarms.has(alarm.id)
		);
	}, [alarms, dismissedAlarms]);

	const currentAlarm = useMemo(() => {
		return activeAlarms[currentAlarmIndex] || null;
	}, [activeAlarms, currentAlarmIndex]);

	const hasActiveAlarms = activeAlarms.length > 0;

	// Auto-rotation timer
	useEffect(() => {
		if (autoRotateTimer.current) {
			clearInterval(autoRotateTimer.current);
			autoRotateTimer.current = null;
		}

		if (activeAlarms.length > 1 && !isMinimized) {
			autoRotateTimer.current = setInterval(() => {
				if (Date.now() - lastInteraction > 30000) {
					setCurrentAlarmIndex((prev) => (prev + 1) % activeAlarms.length);
				}
			}, 10000);
		}

		return () => {
			if (autoRotateTimer.current) {
				clearInterval(autoRotateTimer.current);
				autoRotateTimer.current = null;
			}
		};
	}, [activeAlarms.length, isMinimized, lastInteraction]);

	// Reset index if out of bounds
	useEffect(() => {
		if (currentAlarmIndex >= activeAlarms.length && activeAlarms.length > 0) {
			setCurrentAlarmIndex(0);
		}
	}, [activeAlarms.length, currentAlarmIndex]);

	// Clean up dismissed alarms
	useEffect(() => {
		const activeAlarmIds = new Set(
			alarms
				.filter((alarm: any) => alarm.status === "ACTIVE")
				.map((alarm: any) => alarm.id)
		);
		setDismissedAlarms((prev) => {
			const filtered = new Set(
				[...prev].filter((id) => activeAlarmIds.has(id))
			);
			return filtered.size !== prev.size ? filtered : prev;
		});
	}, [alarms]);

	// Re-show dismissed alarms after 1 minutes
	useEffect(() => {
		if (dismissTimer.current) {
			clearTimeout(dismissTimer.current);
			dismissTimer.current = null;
		}

		if (dismissedAlarms.size > 0) {
			dismissTimer.current = setTimeout(() => {
				setDismissedAlarms(new Set());
			}, 60000);
		}

		return () => {
			if (dismissTimer.current) {
				clearTimeout(dismissTimer.current);
				dismissTimer.current = null;
			}
		};
	}, [dismissedAlarms.size]);

	// Stable event handlers
	const handleDismiss = useCallback(() => {
		if (currentAlarm) {
			setDismissedAlarms((prev) => new Set([...prev, currentAlarm.id]));
			setLastInteraction(Date.now());

			if (activeAlarms.length > 1) {
				const nextIndex =
					currentAlarmIndex >= activeAlarms.length - 1
						? 0
						: currentAlarmIndex + 1;
				setCurrentAlarmIndex(nextIndex);
			}
		}
	}, [currentAlarm, activeAlarms.length, currentAlarmIndex]);

	const handleAcknowledge = useCallback(async () => {
		if (currentAlarm) {
			setLastInteraction(Date.now());
			await onAcknowledge(currentAlarm.id);
		}
	}, [currentAlarm, onAcknowledge]);

	const handleViewDetails = useCallback(() => {
		if (currentAlarm) {
			setLastInteraction(Date.now());
			onViewDetails(currentAlarm.id);
		}
	}, [currentAlarm, onViewDetails]);

	const handleNextAlarm = useCallback(() => {
		if (activeAlarms.length > 1) {
			setCurrentAlarmIndex((prev) => (prev + 1) % activeAlarms.length);
			setLastInteraction(Date.now());
		}
	}, [activeAlarms.length]);

	const handlePrevAlarm = useCallback(() => {
		if (activeAlarms.length > 1) {
			setCurrentAlarmIndex(
				(prev) => (prev - 1 + activeAlarms.length) % activeAlarms.length
			);
			setLastInteraction(Date.now());
		}
	}, [activeAlarms.length]);

	const handleMinimize = useCallback(() => {
		setIsMinimized(true);
		setLastInteraction(Date.now());
	}, []);

	const handleRestore = useCallback(() => {
		setIsMinimized(false);
		setLastInteraction(Date.now());
	}, []);

	// Utility functions
	const getSeverityColor = useCallback((severity: string) => {
		switch (severity) {
			case "CRITICAL":
				return "bg-red-600 text-white";
			case "HIGH":
				return "bg-orange-600 text-white";
			case "MEDIUM":
				return "bg-yellow-600 text-white";
			case "LOW":
				return "bg-blue-600 text-white";
			default:
				return "bg-gray-600 text-white";
		}
	}, []);

	const getSeverityBorderColor = useCallback((severity: string) => {
		switch (severity) {
			case "CRITICAL":
				return "border-red-500";
			case "HIGH":
				return "border-orange-500";
			case "MEDIUM":
				return "border-yellow-500";
			case "LOW":
				return "border-blue-500";
			default:
				return "border-gray-500";
		}
	}, []);

	const copyToClipboard = useCallback((text: string) => {
		navigator.clipboard.writeText(text);
	}, []);

	const openInMaps = useCallback(() => {
		if (currentAlarm?.latitude && currentAlarm?.longitude) {
			window.open(
				`https://www.google.com/maps?q=${currentAlarm.latitude},${currentAlarm.longitude}`,
				"_blank"
			);
		}
	}, [currentAlarm]);

	// Don't render anything if no active alarms
	if (!hasActiveAlarms || !currentAlarm) {
		return null;
	}

	return (
		<>
			{/* Minimized State */}
			{isMinimized && (
				<div className="fixed bottom-4 right-4 z-[9999]">
					<Card
						className={cn(
							"bg-slate-900 border-2 cursor-pointer transition-all duration-300 hover:scale-105 shadow-2xl",
							getSeverityBorderColor(currentAlarm.severity)
						)}
						onClick={handleRestore}>
						<CardContent className="p-4">
							<div className="flex items-center space-x-3">
								<AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
								<div>
									<p className="text-white font-medium">
										{activeAlarms.length} Active Alarm
										{activeAlarms.length !== 1 ? "s" : ""}
									</p>
									<p className="text-slate-400 text-sm">
										{currentAlarm.severity} Priority
									</p>
								</div>
								<Badge className={getSeverityColor(currentAlarm.severity)}>
									{currentAlarm.severity}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Full Modal - Custom Implementation (No Dialog) */}
			{!isMinimized && (
				<div className="fixed inset-0 z-[9998] flex items-center justify-center">
					{/* Backdrop */}
					<div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

					{/* Modal Content */}
					<div
						className={cn(
							"relative bg-slate-900 border-2 text-white max-h-[95vh] w-1/2 overflow-y-auto rounded-xl shadow-2xl m-4 z-[9999]",
							getSeverityBorderColor(currentAlarm.severity)
						)}>
						{/* Enhanced Header */}
						<div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 p-4 z-10">
							<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
								{/* Emergency Alert & Company */}
								<div className="flex items-center space-x-3">
									<AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
									<div className="flex-1 min-w-0">
										{currentAlarm.branch?.company?.logo && (
											<div className="flex items-start flex-col space-x-2 mt-1">
												<img
													src={`http://8436insight.et:3003${currentAlarm.branch.company.logo.replace(
														"/var/www/html/koppa-security-api",
														""
													)}`}
													alt={`${currentAlarm.branch.company.name} logo`}
													className="h-16 w-16 object-cover rounded"
													onError={(e) => {
														e.currentTarget.style.display = "none";
													}}
												/>
												<div className="flex flex-col">
													<span className="text font-bold">
														{currentAlarm.branch.company.name}
													</span>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Branch & Location Info */}
								<div className="space-y-1">
									<div className="flex items-center space-x-2">
										<Building className="h-3 w-3 text-blue-400" />
										<span className="text-sm text-slate-300 truncate">
											{currentAlarm.branch.name}
										</span>
									</div>
									{currentAlarm.branch.locationType && (
										<Badge
											variant="outline"
											className="text-xs bg-blue-900/30 border-blue-500 text-blue-300">
											{currentAlarm.branch.locationType}
										</Badge>
									)}
									{currentAlarm.branch.city && (
										<div className="flex items-center space-x-2">
											<MapPin className="h-3 w-3 text-green-400" />
											<span className="text-xs text-slate-400">
												{currentAlarm.branch.city}
												{currentAlarm.branch.subCity &&
													`, ${currentAlarm.branch.subCity}`}
											</span>
										</div>
									)}
								</div>

								{/* Contact Information */}
								{(currentAlarm.branch.managerName ||
									currentAlarm.branch.phoneNumber) && (
									<Card className="bg-slate-800 border-slate-700">
										<CardContent className="p-3">
											<div className="flex items-center space-x-2 mb-2">
												<Phone className="h-3 w-3 text-green-400" />
												<span className="text-white text-xs font-medium">
													Location Contact
												</span>
											</div>
											<div className="space-y-1">
												{currentAlarm.branch.managerName && (
													<div className="flex items-center space-x-2">
														<User className="h-3 w-3 text-slate-400" />
														<span className="text-white text-xs">
															{currentAlarm.branch.managerName}
														</span>
													</div>
												)}
												{currentAlarm.branch.phoneNumber && (
													<div className="flex items-center space-x-2">
														<Phone className="h-3 w-3 text-slate-400" />
														<span className="text-white text-xs font-mono">
															{currentAlarm.branch.phoneNumber}
														</span>
													</div>
												)}
												{currentAlarm.branch.contactNumber1 && (
													<div className="flex items-center space-x-2">
														<Phone className="h-3 w-3 text-slate-400" />
														<span className="text-white text-xs font-mono">
															{currentAlarm.branch.contactNumber1}
														</span>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								)}

								{/* Controls & Status */}
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Badge className="bg-red-600 text-white" variant="outline">
											{currentAlarm.status}
										</Badge>
									</div>
									<div className="flex items-center space-x-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={handleMinimize}
											className="text-slate-400 hover:text-white hover:bg-slate-800">
											<Minimize2 className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleDismiss}
											className="text-slate-400 hover:text-white hover:bg-slate-800">
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>

							{/* Multiple Alarms Navigation */}
							{activeAlarms.length > 1 && (
								<div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 mt-3">
									<Button
										variant="outline"
										size="sm"
										onClick={handlePrevAlarm}
										className="border-slate-600 text-xs">
										← Prev
									</Button>
									<div className="text-center">
										<p className="text-white text-sm font-medium">
											Alarm {currentAlarmIndex + 1} of {activeAlarms.length}
										</p>
										<p className="text-slate-400 text-xs">
											Auto-rotating every 10s
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={handleNextAlarm}
										className="border-slate-600 text-xs">
										Next →
									</Button>
								</div>
							)}
						</div>

						{/* Enhanced Content */}
						<div className="p-4 space-y-4">
							{/* Alarm Type & Priority Banner */}
							<div
								className={cn(
									"p-3 rounded-lg border-2 text-center",
									getSeverityBorderColor(currentAlarm.severity),
									currentAlarm.severity === "CRITICAL" && "bg-red-900/20",
									currentAlarm.severity === "HIGH" && "bg-orange-900/20",
									currentAlarm.severity === "MEDIUM" && "bg-yellow-900/20",
									currentAlarm.severity === "LOW" && "bg-blue-900/20"
								)}>
								<Badge
									className={cn(
										getSeverityColor(currentAlarm.severity),
										"text-base px-3 py-1"
									)}>
									{currentAlarm.type}
								</Badge>
								<div className="flex items-center justify-center space-x-4 mt-2 text-sm">
									<span className="text-slate-300">
										{Math.floor(
											(Date.now() -
												new Date(currentAlarm.createdAt).getTime()) /
												(1000 * 60)
										)}{" "}
										min ago
									</span>
									<span className="text-slate-400">•</span>
									<span className="text-slate-300">
										ID: #{currentAlarm.id.slice(-8)}
									</span>
								</div>
							</div>

							{/* Main Content Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
								{/* Left Column - Map & Location */}
								<div className="lg:col-span-3 space-y-4">
									{/* Google Map */}
									{currentAlarm.latitude && currentAlarm.longitude && (
										<Card className="bg-slate-800 border-slate-700">
											<CardContent className="p-3">
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center space-x-2">
														<Map className="h-4 w-4 text-purple-400" />
														<span className="text-white font-medium text-sm">
															Incident Location
														</span>
													</div>
													<div className="flex space-x-1">
														<Button
															variant="outline"
															size="sm"
															className="border-blue-600 text-blue-300 hover:bg-blue-900/30 text-xs px-2 py-1"
															onClick={() =>
																copyToClipboard(
																	`${currentAlarm.latitude}, ${currentAlarm.longitude}`
																)
															}>
															<Copy className="h-3 w-3" />
														</Button>
														<Button
															variant="outline"
															size="sm"
															className="border-purple-600 text-purple-300 hover:bg-purple-900/30 text-xs px-2 py-1"
															onClick={openInMaps}>
															<ExternalLink className="h-3 w-3" />
														</Button>
													</div>
												</div>
												<GoogleMap
													latitude={Number.parseFloat(currentAlarm.latitude)}
													longitude={Number.parseFloat(currentAlarm.longitude)}
													title={`${currentAlarm.type} - ${currentAlarm.branch.name}`}
												/>
											</CardContent>
										</Card>
									)}

									{/* Incident Description */}
									<Card className="bg-slate-800 border-slate-700">
										<CardContent className="p-3">
											<div className="flex items-center space-x-2 mb-2">
												<Info className="h-4 w-4 text-blue-400" />
												<span className="text-white font-medium text-sm">
													Incident Details
												</span>
											</div>
											<p className="text-slate-300 text-sm mb-2">
												{currentAlarm.description}
											</p>
											{currentAlarm.additionalNotes && (
												<>
													<Separator className="my-2 bg-slate-600" />
													<p className="text-slate-400 text-xs font-medium mb-1">
														Additional Notes:
													</p>
													<p className="text-slate-300 text-sm">
														{currentAlarm.additionalNotes}
													</p>
												</>
											)}
										</CardContent>
									</Card>
								</div>
							</div>

							<div className="grid grid-cols-3 space-x-4">
								{/* Right Column - Details */}

								{/* Time & Creator */}
								<Card className="bg-slate-800 col-span-1  border-slate-700">
									<CardContent className="p-3 space-y-3">
										<div>
											<div className="flex items-center space-x-2 mb-1">
												<Clock className="h-3 w-3 text-green-400" />
												<span className="text-slate-300 text-xs font-medium">
													Incident Time
												</span>
											</div>
											<p className="text-white text-sm">
												{new Date(currentAlarm.createdAt).toLocaleDateString(
													"en-US",
													{
														month: "short",
														day: "numeric",
														hour: "2-digit",
														minute: "2-digit",
														hour12: true,
													}
												)}
											</p>
										</div>
										<div>
											<div className="flex items-center space-x-2 mb-1">
												<User className="h-3 w-3 text-yellow-400" />
												<span className="text-slate-300 text-xs font-medium">
													Created By
												</span>
											</div>
											<p className="text-white text-sm">
												{currentAlarm.createdBy.name}
											</p>
										</div>
									</CardContent>
								</Card>

								{/* GPS Coordinates */}
								<Card className="bg-slate-800 col-span-1 border-slate-700">
									<CardContent className="p-3">
										<div className="flex items-center space-x-2 mb-2">
											<MapPin className="h-3 w-3 text-purple-400" />
											<span className="text-white text-xs font-medium">
												GPS Coordinates
											</span>
										</div>
										<div className="space-y-1 text-xs">
											<div className="flex justify-between">
												<span className="text-slate-400">Lat:</span>
												<span className="text-white font-mono">
													{currentAlarm.latitude || "N/A"}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-slate-400">Lng:</span>
												<span className="text-white font-mono">
													{currentAlarm.longitude || "N/A"}
												</span>
											</div>
										</div>
										{currentAlarm.location && (
											<div className="mt-2 pt-2 border-t border-slate-600">
												<span className="text-slate-400 text-xs">Area:</span>
												<p className="text-white text-xs mt-1">
													{currentAlarm.location}
												</p>
											</div>
										)}
									</CardContent>
								</Card>

								{/* Quick Stats */}
								<Card className="bg-slate-800 border-slate-700">
									<CardContent className="p-3">
										<div className="grid grid-cols-2 gap-2">
											<div className="bg-slate-900/50 p-2 rounded text-center">
												<div className="text-lg font-bold text-blue-400">
													{Math.floor(
														(Date.now() -
															new Date(currentAlarm.createdAt).getTime()) /
															(1000 * 60)
													)}
												</div>
												<div className="text-xs text-slate-400">Min Ago</div>
											</div>
											<div className="bg-slate-900/50 p-2 rounded text-center">
												<div className="text-lg font-bold text-purple-400">
													{currentAlarm.severity === "CRITICAL"
														? "🔴"
														: currentAlarm.severity === "HIGH"
														? "🟠"
														: currentAlarm.severity === "MEDIUM"
														? "🟡"
														: "🟢"}
												</div>
												<div className="text-xs text-slate-400">Priority</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Enhanced Action Buttons */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<Button
									onClick={handleAcknowledge}
									disabled={isAcknowledging}
									className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3">
									{isAcknowledging ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Acknowledging...
										</>
									) : (
										<>
											<CheckCircle className="h-4 w-4 mr-2" />
											ACKNOWLEDGE
										</>
									)}
								</Button>

								{/* {onStatusChange && (
									<Button
										onClick={() => onStatusChange(currentAlarm.id, "RESOLVED")}
										disabled={isAcknowledging}
										className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
										<Target className="h-4 w-4 mr-2" />
										RESOLVE
									</Button>
								)} */}

								{/* <Button
									variant="outline"
									onClick={handleViewDetails}
									className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
									<Eye className="h-4 w-4 mr-2" />
									FULL DETAILS
								</Button> */}
							</div>

							{/* Persistence Warning */}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

// "use client";

// import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import {
// 	AlertTriangle,
// 	MapPin,
// 	Clock,
// 	User,
// 	Building,
// 	Navigation,
// 	CheckCircle,
// 	Loader2,
// 	X,
// 	Minimize2,
// 	Map,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface Alarm {
// 	id: string;
// 	type: string;
// 	branchId: string;
// 	branch: {
// 		id: string;
// 		name: string;
// 		company?: {
// 			id: string;
// 			name: string;
// 			logo: string;
// 		};
// 	};
// 	location: string;
// 	latitude: string;
// 	longitude: string;
// 	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	additionalNotes?: string;
// 	createdBy: {
// 		id: string;
// 		name: string;
// 	};
// 	createdAt: string;
// 	isRealTime?: boolean;
// }

// interface PersistentAlarmModalProps {
// 	alarms: Alarm[];
// 	onAcknowledge: (alarmId: string) => Promise<void>;
// 	onViewDetails: (alarmId: string) => void;
// 	onStatusChange?: (
// 		alarmId: string,
// 		status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED"
// 	) => Promise<void>;
// 	isAcknowledging: boolean;
// }

// // Enhanced Google Maps Component
// interface GoogleMapProps {
// 	latitude: number;
// 	longitude: number;
// 	title: string;
// }

// function GoogleMap({ latitude, longitude, title }: GoogleMapProps) {
// 	return (
// 		<div className="w-full h-80 rounded-lg overflow-hidden bg-slate-700">
// 			<iframe
// 				src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&q=${latitude},${longitude}&zoom=16&maptype=roadmap`}
// 				width="100%"
// 				height="100%"
// 				style={{ border: 0 }}
// 				allowFullScreen
// 				loading="lazy"
// 				referrerPolicy="no-referrer-when-downgrade"
// 				title={title}
// 			/>
// 		</div>
// 	);
// }

// export function PersistentAlarmModal({
// 	alarms,
// 	onAcknowledge,
// 	onViewDetails,
// 	onStatusChange,
// 	isAcknowledging,
// }: PersistentAlarmModalProps) {
// 	// Core state - keep minimal and stable
// 	const [currentAlarmIndex, setCurrentAlarmIndex] = useState(0);
// 	const [isMinimized, setIsMinimized] = useState(false);
// 	const [dismissedAlarms, setDismissedAlarms] = useState<Set<string>>(
// 		new Set()
// 	);
// 	const [lastInteraction, setLastInteraction] = useState(Date.now());

// 	// Refs for timers
// 	const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);
// 	const dismissTimer = useRef<NodeJS.Timeout | null>(null);

// 	// Stable computation of active alarms
// 	const activeAlarms = useMemo(() => {
// 		return alarms.filter(
// 			(alarm: any) =>
// 				alarm.status === "ACTIVE" && !dismissedAlarms.has(alarm.id)
// 		);
// 	}, [alarms, dismissedAlarms]);

// 	const currentAlarm = useMemo(() => {
// 		return activeAlarms[currentAlarmIndex] || null;
// 	}, [activeAlarms, currentAlarmIndex]);

// 	const hasActiveAlarms = activeAlarms.length > 0;

// 	// Auto-rotation timer
// 	useEffect(() => {
// 		if (autoRotateTimer.current) {
// 			clearInterval(autoRotateTimer.current);
// 			autoRotateTimer.current = null;
// 		}

// 		if (activeAlarms.length > 1 && !isMinimized) {
// 			autoRotateTimer.current = setInterval(() => {
// 				if (Date.now() - lastInteraction > 30000) {
// 					setCurrentAlarmIndex((prev) => (prev + 1) % activeAlarms.length);
// 				}
// 			}, 10000);
// 		}

// 		return () => {
// 			if (autoRotateTimer.current) {
// 				clearInterval(autoRotateTimer.current);
// 				autoRotateTimer.current = null;
// 			}
// 		};
// 	}, [activeAlarms.length, isMinimized, lastInteraction]);

// 	// Reset index if out of bounds
// 	useEffect(() => {
// 		if (currentAlarmIndex >= activeAlarms.length && activeAlarms.length > 0) {
// 			setCurrentAlarmIndex(0);
// 		}
// 	}, [activeAlarms.length, currentAlarmIndex]);

// 	// Clean up dismissed alarms
// 	useEffect(() => {
// 		const activeAlarmIds = new Set(
// 			alarms
// 				.filter((alarm: any) => alarm.status === "ACTIVE")
// 				.map((alarm: any) => alarm.id)
// 		);
// 		setDismissedAlarms((prev) => {
// 			const filtered = new Set(
// 				[...prev].filter((id) => activeAlarmIds.has(id))
// 			);
// 			return filtered.size !== prev.size ? filtered : prev;
// 		});
// 	}, [alarms]);

// 	// Re-show dismissed alarms after 1 minutes
// 	useEffect(() => {
// 		if (dismissTimer.current) {
// 			clearTimeout(dismissTimer.current);
// 			dismissTimer.current = null;
// 		}

// 		if (dismissedAlarms.size > 0) {
// 			dismissTimer.current = setTimeout(() => {
// 				setDismissedAlarms(new Set());
// 			}, 60000);
// 		}

// 		return () => {
// 			if (dismissTimer.current) {
// 				clearTimeout(dismissTimer.current);
// 				dismissTimer.current = null;
// 			}
// 		};
// 	}, [dismissedAlarms.size]);

// 	// Stable event handlers
// 	const handleDismiss = useCallback(() => {
// 		if (currentAlarm) {
// 			setDismissedAlarms((prev) => new Set([...prev, currentAlarm.id]));
// 			setLastInteraction(Date.now());

// 			if (activeAlarms.length > 1) {
// 				const nextIndex =
// 					currentAlarmIndex >= activeAlarms.length - 1
// 						? 0
// 						: currentAlarmIndex + 1;
// 				setCurrentAlarmIndex(nextIndex);
// 			}
// 		}
// 	}, [currentAlarm, activeAlarms.length, currentAlarmIndex]);

// 	const handleAcknowledge = useCallback(async () => {
// 		if (currentAlarm) {
// 			setLastInteraction(Date.now());
// 			await onAcknowledge(currentAlarm.id);
// 		}
// 	}, [currentAlarm, onAcknowledge]);

// 	const handleViewDetails = useCallback(() => {
// 		if (currentAlarm) {
// 			setLastInteraction(Date.now());
// 			onViewDetails(currentAlarm.id);
// 		}
// 	}, [currentAlarm, onViewDetails]);

// 	const handleNextAlarm = useCallback(() => {
// 		if (activeAlarms.length > 1) {
// 			setCurrentAlarmIndex((prev) => (prev + 1) % activeAlarms.length);
// 			setLastInteraction(Date.now());
// 		}
// 	}, [activeAlarms.length]);

// 	const handlePrevAlarm = useCallback(() => {
// 		if (activeAlarms.length > 1) {
// 			setCurrentAlarmIndex(
// 				(prev) => (prev - 1 + activeAlarms.length) % activeAlarms.length
// 			);
// 			setLastInteraction(Date.now());
// 		}
// 	}, [activeAlarms.length]);

// 	const handleMinimize = useCallback(() => {
// 		setIsMinimized(true);
// 		setLastInteraction(Date.now());
// 	}, []);

// 	const handleRestore = useCallback(() => {
// 		setIsMinimized(false);
// 		setLastInteraction(Date.now());
// 	}, []);

// 	// Utility functions
// 	const getSeverityColor = useCallback((severity: string) => {
// 		switch (severity) {
// 			case "CRITICAL":
// 				return "bg-red-600 text-white";
// 			case "HIGH":
// 				return "bg-orange-600 text-white";
// 			case "MEDIUM":
// 				return "bg-yellow-600 text-white";
// 			case "LOW":
// 				return "bg-blue-600 text-white";
// 			default:
// 				return "bg-gray-600 text-white";
// 		}
// 	}, []);

// 	const getSeverityBorderColor = useCallback((severity: string) => {
// 		switch (severity) {
// 			case "CRITICAL":
// 				return "border-red-500";
// 			case "HIGH":
// 				return "border-orange-500";
// 			case "MEDIUM":
// 				return "border-yellow-500";
// 			case "LOW":
// 				return "border-blue-500";
// 			default:
// 				return "border-gray-500";
// 		}
// 	}, []);

// 	// Don't render anything if no active alarms
// 	if (!hasActiveAlarms || !currentAlarm) {
// 		return null;
// 	}

// 	return (
// 		<>
// 			{/* Minimized State */}
// 			{isMinimized && (
// 				<div className="fixed bottom-4 right-4 z-[9999]">
// 					<Card
// 						className={cn(
// 							"bg-slate-900 border-2 cursor-pointer transition-all duration-300 hover:scale-105 shadow-2xl",
// 							getSeverityBorderColor(currentAlarm.severity)
// 						)}
// 						onClick={handleRestore}>
// 						<CardContent className="p-4">
// 							<div className="flex items-center space-x-3">
// 								<AlertTriangle className="h-6 w-6 text-red-400" />
// 								<div>
// 									<p className="text-white font-medium">
// 										{activeAlarms.length} Active Alarm
// 										{activeAlarms.length !== 1 ? "s" : ""}
// 									</p>
// 									<p className="text-slate-400 text-sm">
// 										{currentAlarm.severity} Priority
// 									</p>
// 								</div>
// 								<Badge className={getSeverityColor(currentAlarm.severity)}>
// 									{currentAlarm.severity}
// 								</Badge>
// 							</div>
// 						</CardContent>
// 					</Card>
// 				</div>
// 			)}

// 			{/* Full Modal - Custom Implementation (No Dialog) */}
// 			{!isMinimized && (
// 				<div className="fixed inset-0 z-[9998] flex items-center justify-center">
// 					{/* Backdrop */}
// 					<div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

// 					{/* Modal Content */}
// 					<div
// 						className={cn(
// 							"relative bg-slate-900 border-2 text-white max-w-6xl max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl m-4 z-[9999]",
// 							getSeverityBorderColor(currentAlarm.severity)
// 						)}>
// 						{/* Header */}
// 						<div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
// 							<div className="flex items-center justify-between">
// 								<div className="flex items-center space-x-3">
// 									<AlertTriangle className="h-6 w-6 text-red-400" />
// 									<span className="text-xl font-bold">
// 										🚨 EMERGENCY ALARM ALERT
// 									</span>
// 									{currentAlarm.isRealTime && (
// 										<Badge className="bg-cyan-600 text-white animate-pulse">
// 											LIVE
// 										</Badge>
// 									)}
// 								</div>
// 								<div className="flex items-center space-x-2">
// 									<Button
// 										variant="ghost"
// 										size="sm"
// 										onClick={handleMinimize}
// 										className="text-slate-400 hover:text-white hover:bg-slate-800">
// 										<Minimize2 className="h-4 w-4" />
// 									</Button>
// 									<Button
// 										variant="ghost"
// 										size="sm"
// 										onClick={handleDismiss}
// 										className="text-slate-400 hover:text-white hover:bg-slate-800">
// 										<X className="h-4 w-4" />
// 									</Button>
// 								</div>
// 							</div>
// 						</div>

// 						{/* Enhanced Content */}
// 						<div className="p-6 space-y-6">
// 							{/* Multiple Alarms Navigation */}
// 							{activeAlarms.length > 1 && (
// 								<div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
// 									<Button
// 										variant="outline"
// 										size="sm"
// 										onClick={handlePrevAlarm}
// 										className="border-slate-600">
// 										← Previous
// 									</Button>
// 									<div className="text-center">
// 										<p className="text-white font-medium">
// 											Alarm {currentAlarmIndex + 1} of {activeAlarms.length}
// 										</p>
// 										<p className="text-slate-400 text-sm">
// 											Auto-rotating every 10 seconds
// 										</p>
// 									</div>
// 									<Button
// 										variant="outline"
// 										size="sm"
// 										onClick={handleNextAlarm}
// 										className="border-slate-600">
// 										Next →
// 									</Button>
// 								</div>
// 							)}

// 							{/* Company and Branch Header */}
// 							<div className="bg-slate-800 rounded-lg p-4">
// 								<div className="flex items-center space-x-4">
// 									{currentAlarm?.branch?.company?.logo && (
// 										<div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
// 											<img
// 												src={`http://8436insight.et:3003${currentAlarm?.branch?.company?.logo.replace(
// 													"/var/www/html/koppa-security-api",
// 													""
// 												)}`}
// 												alt={`${currentAlarm.branch.company?.name} logo`}
// 												className="h-14 w-14 object-cover rounded-xl shadow-lg border border-slate-600"
// 											/>
// 										</div>
// 									)}
// 									<div className="flex-1">
// 										<h3 className="text-xl font-bold text-white">
// 											{currentAlarm?.branch?.company?.name ||
// 												currentAlarm.branch.name ||
// 												"Emergency Location"}
// 										</h3>
// 										<div className="flex items-center space-x-2 mt-1">
// 											<Building className="h-4 w-4 text-blue-400" />
// 											<span className="text-slate-300">
// 												{currentAlarm.branch.name}
// 											</span>
// 										</div>
// 									</div>
// 								</div>
// 							</div>

// 							{/* Alarm Priority Banner */}
// 							<div
// 								className={cn(
// 									"p-4 rounded-lg border-2 text-center",
// 									getSeverityBorderColor(currentAlarm.severity),
// 									currentAlarm.severity === "CRITICAL" && "bg-red-900/20",
// 									currentAlarm.severity === "HIGH" && "bg-orange-900/20",
// 									currentAlarm.severity === "MEDIUM" && "bg-yellow-900/20",
// 									currentAlarm.severity === "LOW" && "bg-blue-900/20"
// 								)}>
// 								<Badge
// 									className={cn(
// 										getSeverityColor(currentAlarm.severity),
// 										"text-lg px-4 py-2"
// 									)}>
// 									{/* {currentAlarm.severity} PRIORITY */}
// 									{currentAlarm.type}
// 								</Badge>
// 								{/* <p className="text-white font-bold text-xl mt-2">
// 									{currentAlarm.type}
// 								</p> */}
// 								<div className="flex items-center justify-center space-x-2 mt-2">
// 									<span className="text-red-400 text-sm">
// 										{currentAlarm.status}
// 									</span>
// 								</div>
// 							</div>

// 							{/* Main Content - Full Width Map Layout */}
// 							<div className="space-y-6">
// 								{/* Full Width Google Map */}
// 								{currentAlarm.latitude && currentAlarm.longitude && (
// 									<Card className="bg-slate-800 border-slate-700">
// 										<CardContent className="p-4">
// 											<div className="flex items-center space-x-2 mb-3">
// 												<Map className="h-4 w-4 text-purple-400" />
// 												<span className="text-white font-medium">
// 													Location Map
// 												</span>
// 											</div>
// 											<GoogleMap
// 												latitude={Number.parseFloat(currentAlarm.latitude)}
// 												longitude={Number.parseFloat(currentAlarm.longitude)}
// 												title={`${currentAlarm.type} - ${currentAlarm.branch.name}`}
// 											/>
// 										</CardContent>
// 										{currentAlarm.severity === "CRITICAL" && (
// 											<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 										)}
// 									</Card>
// 								)}

// 								{/* Alarm Details Grid */}
// 								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// 									{/* Time and Creator Info */}
// 									<Card className="bg-slate-800 border-slate-700">
// 										<CardContent className="p-4 space-y-3">
// 											<div className="flex items-center space-x-2">
// 												<Clock className="h-4 w-4 text-green-400" />
// 												<span className="text-slate-300 font-medium">
// 													Incident Time
// 												</span>
// 											</div>
// 											<p className="text-white">
// 												{new Date(currentAlarm.createdAt).toLocaleDateString(
// 													"en-US",
// 													{
// 														year: "numeric",
// 														month: "short",
// 														day: "numeric",
// 														hour: "2-digit",
// 														minute: "2-digit",
// 														hour12: true,
// 													}
// 												)}
// 											</p>
// 											<div className="flex items-center space-x-2">
// 												<User className="h-4 w-4 text-slate-400" />
// 												<span className="text-slate-300 text-sm">
// 													{currentAlarm.createdBy.name}
// 												</span>
// 											</div>
// 										</CardContent>
// 										{currentAlarm.severity === "CRITICAL" && (
// 											<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 										)}
// 									</Card>

// 									{/* Location Details */}
// 									{currentAlarm.location && (
// 										<Card className="bg-slate-800 border-slate-700">
// 											<CardContent className="p-4">
// 												<div className="flex items-center space-x-2 mb-2">
// 													<Navigation className="h-4 w-4 text-purple-400" />
// 													<span className="text-white font-medium">
// 														Sub City
// 													</span>
// 												</div>
// 												<p className="text-slate-300">
// 													{currentAlarm.location}
// 												</p>
// 											</CardContent>
// 											{currentAlarm.severity === "CRITICAL" && (
// 												<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 											)}
// 										</Card>
// 									)}

// 									{/* GPS Coordinates */}
// 									{(currentAlarm.latitude || currentAlarm.longitude) && (
// 										<Card className="bg-slate-800 border-slate-700">
// 											<CardContent className="p-4">
// 												<div className="flex items-center space-x-2 mb-2">
// 													<MapPin className="h-4 w-4 text-purple-400" />
// 													<span className="text-white font-medium">
// 														GPS Coordinates
// 													</span>
// 												</div>
// 												<p className="text-slate-300 font-mono">
// 													Lat: {currentAlarm.latitude || "N/A"}
// 												</p>
// 												<p className="text-slate-300 font-mono">
// 													Lng: {currentAlarm.longitude || "N/A"}
// 												</p>
// 											</CardContent>
// 											{currentAlarm.severity === "CRITICAL" && (
// 												<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 											)}
// 										</Card>
// 									)}
// 								</div>

// 								{/* Description - Full Width */}
// 								<Card className="bg-slate-800 border-slate-700">
// 									<CardContent className="p-4">
// 										<h4 className="text-white font-medium mb-2">
// 											Incident Description
// 										</h4>
// 										<p className="text-slate-300">{currentAlarm.description}</p>
// 										{currentAlarm.additionalNotes && (
// 											<>
// 												<Separator className="my-3 bg-slate-600" />
// 												<h4 className="text-white font-medium mb-2">
// 													Additional Notes
// 												</h4>
// 												<p className="text-slate-300">
// 													{currentAlarm.additionalNotes}
// 												</p>
// 											</>
// 										)}
// 									</CardContent>
// 									{currentAlarm.severity === "CRITICAL" && (
// 										<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 									)}
// 								</Card>
// 							</div>

// 							{/* Enhanced Action Buttons */}
// 							<div className="flex flex-col sm:flex-row gap-3">
// 								<Button
// 									onClick={handleAcknowledge}
// 									disabled={isAcknowledging}
// 									className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg">
// 									{isAcknowledging ? (
// 										<>
// 											<Loader2 className="h-5 w-5 mr-2 animate-spin" />
// 											Acknowledging...
// 										</>
// 									) : (
// 										<>
// 											<CheckCircle className="h-5 w-5 mr-2" />
// 											ACKNOWLEDGE ALARM
// 										</>
// 									)}
// 								</Button>

// 								{/* {onStatusChange && (
// 									<Button
// 										onClick={() => onStatusChange(currentAlarm.id, "RESOLVED")}
// 										disabled={isAcknowledging}
// 										className="bg-blue-600 hover:bg-blue-700 text-white">
// 										<Target className="h-4 w-4 mr-2" />
// 										Mark Resolved
// 									</Button>
// 								)}

// 								<Button
// 									variant="outline"
// 									onClick={handleViewDetails}
// 									className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
// 									<Eye className="h-4 w-4 mr-2" />
// 									View Full Details
// 								</Button> */}
// 							</div>

// 							{/* Persistence Warning */}
// 							<div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
// 								<div className="flex items-center space-x-2">
// 									<AlertTriangle className="h-4 w-4 text-yellow-400" />
// 									<span className="text-yellow-400 font-medium">
// 										Persistent Alert
// 									</span>
// 								</div>
// 								<p className="text-yellow-200 text-sm mt-1">
// 									This modal will continue to appear until the alarm is
// 									acknowledged. Audio alerts are also active for
// 									{currentAlarm.severity === "CRITICAL"
// 										? " CRITICAL"
// 										: ` ${currentAlarm.severity}`}{" "}
// 									priority alarms.
// 								</p>
// 								{activeAlarms.length > 1 && (
// 									<p className="text-yellow-200 text-sm mt-1">
// 										{activeAlarms.length - 1} other alarm
// 										{activeAlarms.length > 2 ? "s" : ""} also require attention.
// 									</p>
// 								)}
// 							</div>

// 							{/* Dismiss Timer */}
// 							<div className="text-center text-slate-400 text-sm">
// 								<p>Modal dismissed temporarily will reappear in 2 minutes</p>
// 								<p>Alarm ID: #{currentAlarm.id.slice(-8)}</p>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
// 			)}
// 		</>
// 	);
// }

//------------------------------------------------------------
// "use client";

// import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import {
// 	AlertTriangle,
// 	MapPin,
// 	Clock,
// 	User,
// 	Building,
// 	Navigation,
// 	CheckCircle,
// 	Loader2,
// 	X,
// 	Minimize2,
// 	Volume2,
// 	Eye,
// 	Map,
// 	Target,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface Alarm {
// 	id: string;
// 	type: string;
// 	branchId: string;
// 	branch: {
// 		id: string;
// 		name: string;
// 		company?: {
// 			id: string;
// 			name: string;
// 			logo: string;
// 		};
// 	};
// 	location: string;
// 	latitude: string;
// 	longitude: string;
// 	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	additionalNotes?: string;
// 	createdBy: {
// 		id: string;
// 		name: string;
// 	};
// 	createdAt: string;
// 	isRealTime?: boolean;
// }

// interface PersistentAlarmModalProps {
// 	alarms: Alarm[];
// 	onAcknowledge: (alarmId: string) => Promise<void>;
// 	onViewDetails: (alarmId: string) => void;
// 	onStatusChange?: (
// 		alarmId: string,
// 		status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED"
// 	) => Promise<void>;
// 	isAcknowledging: boolean;
// }

// // Enhanced Google Maps Component
// interface GoogleMapProps {
// 	latitude: number;
// 	longitude: number;
// 	title: string;
// }

// function GoogleMap({ latitude, longitude, title }: GoogleMapProps) {
// 	return (
// 		<div className="w-full h-80 rounded-lg overflow-hidden bg-slate-700">
// 			<iframe
// 				src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&q=${latitude},${longitude}&zoom=16&maptype=roadmap`}
// 				width="100%"
// 				height="100%"
// 				style={{ border: 0 }}
// 				allowFullScreen
// 				loading="lazy"
// 				referrerPolicy="no-referrer-when-downgrade"
// 				title={title}
// 			/>
// 		</div>
// 	);
// }

// export function PersistentAlarmModal({
// 	alarms,
// 	onAcknowledge,
// 	onViewDetails,
// 	onStatusChange,
// 	isAcknowledging,
// }: PersistentAlarmModalProps) {
// 	// Core state - keep minimal and stable
// 	const [currentAlarmIndex, setCurrentAlarmIndex] = useState(0);
// 	const [isMinimized, setIsMinimized] = useState(false);
// 	const [dismissedAlarms, setDismissedAlarms] = useState<Set<string>>(
// 		new Set()
// 	);
// 	const [lastInteraction, setLastInteraction] = useState(Date.now());

// 	// Refs for timers
// 	const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);
// 	const dismissTimer = useRef<NodeJS.Timeout | null>(null);

// 	// Stable computation of active alarms
// 	const activeAlarms = useMemo(() => {
// 		return alarms.filter(
// 			(alarm: any) =>
// 				alarm.status === "ACTIVE" && !dismissedAlarms.has(alarm.id)
// 		);
// 	}, [alarms, dismissedAlarms]);

// 	const currentAlarm = useMemo(() => {
// 		return activeAlarms[currentAlarmIndex] || null;
// 	}, [activeAlarms, currentAlarmIndex]);

// 	const hasActiveAlarms = activeAlarms.length > 0;

// 	// Auto-rotation timer
// 	useEffect(() => {
// 		if (autoRotateTimer.current) {
// 			clearInterval(autoRotateTimer.current);
// 			autoRotateTimer.current = null;
// 		}

// 		if (activeAlarms.length > 1 && !isMinimized) {
// 			autoRotateTimer.current = setInterval(() => {
// 				if (Date.now() - lastInteraction > 30000) {
// 					setCurrentAlarmIndex((prev) => (prev + 1) % activeAlarms.length);
// 				}
// 			}, 10000);
// 		}

// 		return () => {
// 			if (autoRotateTimer.current) {
// 				clearInterval(autoRotateTimer.current);
// 				autoRotateTimer.current = null;
// 			}
// 		};
// 	}, [activeAlarms.length, isMinimized, lastInteraction]);

// 	// Reset index if out of bounds
// 	useEffect(() => {
// 		if (currentAlarmIndex >= activeAlarms.length && activeAlarms.length > 0) {
// 			setCurrentAlarmIndex(0);
// 		}
// 	}, [activeAlarms.length, currentAlarmIndex]);

// 	// Clean up dismissed alarms
// 	useEffect(() => {
// 		const activeAlarmIds = new Set(
// 			alarms
// 				.filter((alarm: any) => alarm.status === "ACTIVE")
// 				.map((alarm: any) => alarm.id)
// 		);
// 		setDismissedAlarms((prev) => {
// 			const filtered = new Set(
// 				[...prev].filter((id) => activeAlarmIds.has(id))
// 			);
// 			return filtered.size !== prev.size ? filtered : prev;
// 		});
// 	}, [alarms]);

// 	// Re-show dismissed alarms after 1 minutes
// 	useEffect(() => {
// 		if (dismissTimer.current) {
// 			clearTimeout(dismissTimer.current);
// 			dismissTimer.current = null;
// 		}

// 		if (dismissedAlarms.size > 0) {
// 			dismissTimer.current = setTimeout(() => {
// 				setDismissedAlarms(new Set());
// 			}, 60000);
// 		}

// 		return () => {
// 			if (dismissTimer.current) {
// 				clearTimeout(dismissTimer.current);
// 				dismissTimer.current = null;
// 			}
// 		};
// 	}, [dismissedAlarms.size]);

// 	// Stable event handlers
// 	const handleDismiss = useCallback(() => {
// 		if (currentAlarm) {
// 			setDismissedAlarms((prev) => new Set([...prev, currentAlarm.id]));
// 			setLastInteraction(Date.now());

// 			if (activeAlarms.length > 1) {
// 				const nextIndex =
// 					currentAlarmIndex >= activeAlarms.length - 1
// 						? 0
// 						: currentAlarmIndex + 1;
// 				setCurrentAlarmIndex(nextIndex);
// 			}
// 		}
// 	}, [currentAlarm, activeAlarms.length, currentAlarmIndex]);

// 	const handleAcknowledge = useCallback(async () => {
// 		if (currentAlarm) {
// 			setLastInteraction(Date.now());
// 			await onAcknowledge(currentAlarm.id);
// 		}
// 	}, [currentAlarm, onAcknowledge]);

// 	const handleViewDetails = useCallback(() => {
// 		if (currentAlarm) {
// 			setLastInteraction(Date.now());
// 			onViewDetails(currentAlarm.id);
// 		}
// 	}, [currentAlarm, onViewDetails]);

// 	const handleNextAlarm = useCallback(() => {
// 		if (activeAlarms.length > 1) {
// 			setCurrentAlarmIndex((prev) => (prev + 1) % activeAlarms.length);
// 			setLastInteraction(Date.now());
// 		}
// 	}, [activeAlarms.length]);

// 	const handlePrevAlarm = useCallback(() => {
// 		if (activeAlarms.length > 1) {
// 			setCurrentAlarmIndex(
// 				(prev) => (prev - 1 + activeAlarms.length) % activeAlarms.length
// 			);
// 			setLastInteraction(Date.now());
// 		}
// 	}, [activeAlarms.length]);

// 	const handleMinimize = useCallback(() => {
// 		setIsMinimized(true);
// 		setLastInteraction(Date.now());
// 	}, []);

// 	const handleRestore = useCallback(() => {
// 		setIsMinimized(false);
// 		setLastInteraction(Date.now());
// 	}, []);

// 	// Utility functions
// 	const getSeverityColor = useCallback((severity: string) => {
// 		switch (severity) {
// 			case "CRITICAL":
// 				return "bg-red-600 text-white";
// 			case "HIGH":
// 				return "bg-orange-600 text-white";
// 			case "MEDIUM":
// 				return "bg-yellow-600 text-white";
// 			case "LOW":
// 				return "bg-blue-600 text-white";
// 			default:
// 				return "bg-gray-600 text-white";
// 		}
// 	}, []);

// 	const getSeverityBorderColor = useCallback((severity: string) => {
// 		switch (severity) {
// 			case "CRITICAL":
// 				return "border-red-500";
// 			case "HIGH":
// 				return "border-orange-500";
// 			case "MEDIUM":
// 				return "border-yellow-500";
// 			case "LOW":
// 				return "border-blue-500";
// 			default:
// 				return "border-gray-500";
// 		}
// 	}, []);

// 	// Don't render anything if no active alarms
// 	if (!hasActiveAlarms || !currentAlarm) {
// 		return null;
// 	}

// 	return (
// 		<>
// 			{/* Minimized State */}
// 			{isMinimized && (
// 				<div className="fixed bottom-4 right-4 z-[9999]">
// 					<Card
// 						className={cn(
// 							"bg-slate-900 border-2 cursor-pointer transition-all duration-300 hover:scale-105 shadow-2xl",
// 							getSeverityBorderColor(currentAlarm.severity)
// 						)}
// 						onClick={handleRestore}>
// 						<CardContent className="p-4">
// 							<div className="flex items-center space-x-3">
// 								<AlertTriangle className="h-6 w-6 text-red-400" />
// 								<div>
// 									<p className="text-white font-medium">
// 										{activeAlarms.length} Active Alarm
// 										{activeAlarms.length !== 1 ? "s" : ""}
// 									</p>
// 									<p className="text-slate-400 text-sm">
// 										{currentAlarm.severity} Priority
// 									</p>
// 								</div>
// 								<Badge className={getSeverityColor(currentAlarm.severity)}>
// 									{currentAlarm.severity}
// 								</Badge>
// 							</div>
// 						</CardContent>
// 					</Card>
// 				</div>
// 			)}

// 			{/* Full Modal - Custom Implementation (No Dialog) */}
// 			{!isMinimized && (
// 				<div className="fixed inset-0 z-[9998] flex items-center justify-center">
// 					{/* Backdrop */}
// 					<div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

// 					{/* Modal Content */}
// 					<div
// 						className={cn(
// 							"relative bg-slate-900 border-2 text-white max-w-6xl max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl m-4 z-[9999]",
// 							getSeverityBorderColor(currentAlarm.severity)
// 						)}>
// 						{/* Header */}
// 						<div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
// 							<div className="flex items-center justify-between">
// 								<div className="flex items-center space-x-3">
// 									<AlertTriangle className="h-6 w-6 text-red-400" />
// 									<span className="text-xl font-bold">
// 										🚨 EMERGENCY ALARM ALERT
// 									</span>
// 									{currentAlarm.isRealTime && (
// 										<Badge className="bg-cyan-600 text-white animate-pulse">
// 											LIVE
// 										</Badge>
// 									)}
// 								</div>
// 								<div className="flex items-center space-x-2">
// 									<Button
// 										variant="ghost"
// 										size="sm"
// 										onClick={handleMinimize}
// 										className="text-slate-400 hover:text-white hover:bg-slate-800">
// 										<Minimize2 className="h-4 w-4" />
// 									</Button>
// 									<Button
// 										variant="ghost"
// 										size="sm"
// 										onClick={handleDismiss}
// 										className="text-slate-400 hover:text-white hover:bg-slate-800">
// 										<X className="h-4 w-4" />
// 									</Button>
// 								</div>
// 							</div>
// 						</div>

// 						{/* Enhanced Content */}
// 						<div className="p-6 space-y-6">
// 							{/* Multiple Alarms Navigation */}
// 							{activeAlarms.length > 1 && (
// 								<div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
// 									<Button
// 										variant="outline"
// 										size="sm"
// 										onClick={handlePrevAlarm}
// 										className="border-slate-600">
// 										← Previous
// 									</Button>
// 									<div className="text-center">
// 										<p className="text-white font-medium">
// 											Alarm {currentAlarmIndex + 1} of {activeAlarms.length}
// 										</p>
// 										<p className="text-slate-400 text-sm">
// 											Auto-rotating every 10 seconds
// 										</p>
// 									</div>
// 									<Button
// 										variant="outline"
// 										size="sm"
// 										onClick={handleNextAlarm}
// 										className="border-slate-600">
// 										Next →
// 									</Button>
// 								</div>
// 							)}

// 							{/* Company and Branch Header */}
// 							<div className="bg-slate-800 rounded-lg p-4">
// 								<div className="flex items-center space-x-4">
// 									{currentAlarm?.branch?.company?.logo && (
// 										<div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
// 											<img
// 												src={`http://8436insight.et:3003${currentAlarm?.branch?.company?.logo.replace(
// 													"/var/www/html/koppa-security-api",
// 													""
// 												)}`}
// 												alt={`${currentAlarm.branch.company?.name} logo`}
// 												className="h-14 w-14 object-cover rounded-xl shadow-lg border border-slate-600"
// 											/>
// 										</div>
// 									)}
// 									<div className="flex-1">
// 										<h3 className="text-xl font-bold text-white">
// 											{currentAlarm?.branch?.company?.name ||
// 												currentAlarm.branch.name ||
// 												"Emergency Location"}
// 										</h3>
// 										<div className="flex items-center space-x-2 mt-1">
// 											<Building className="h-4 w-4 text-blue-400" />
// 											<span className="text-slate-300">
// 												{currentAlarm.branch.name}
// 											</span>
// 										</div>
// 									</div>
// 								</div>
// 							</div>

// 							{/* Alarm Priority Banner */}
// 							<div
// 								className={cn(
// 									"p-4 rounded-lg border-2 text-center",
// 									getSeverityBorderColor(currentAlarm.severity),
// 									currentAlarm.severity === "CRITICAL" && "bg-red-900/20",
// 									currentAlarm.severity === "HIGH" && "bg-orange-900/20",
// 									currentAlarm.severity === "MEDIUM" && "bg-yellow-900/20",
// 									currentAlarm.severity === "LOW" && "bg-blue-900/20"
// 								)}>
// 								<Badge
// 									className={cn(
// 										getSeverityColor(currentAlarm.severity),
// 										"text-lg px-4 py-2"
// 									)}>
// 									{/* {currentAlarm.severity} PRIORITY */}
// 									{currentAlarm.type}
// 								</Badge>
// 								{/* <p className="text-white font-bold text-xl mt-2">
// 									{currentAlarm.type}
// 								</p> */}
// 								<div className="flex items-center justify-center space-x-2 mt-2">
// 									<span className="text-red-400 text-sm">
// 										{currentAlarm.status}
// 									</span>
// 								</div>
// 							</div>

// 							{/* Main Content Grid */}
// 							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// 								{/* Left Column - Alarm Details */}
// 								<div className="space-y-4">
// 									{/* Time and Creator Info */}
// 									<Card className="bg-slate-800 border-slate-700">
// 										<CardContent className="p-4 space-y-3">
// 											<div className="flex items-center space-x-2">
// 												<Clock className="h-4 w-4 text-green-400" />
// 												<span className="text-slate-300 font-medium">
// 													Incident Time
// 												</span>
// 											</div>
// 											<p className="text-white">
// 												{new Date(currentAlarm.createdAt).toLocaleDateString(
// 													"en-US",
// 													{
// 														year: "numeric",
// 														month: "short",
// 														day: "numeric",
// 														hour: "2-digit",
// 														minute: "2-digit",
// 														hour12: true,
// 													}
// 												)}
// 											</p>
// 											<div className="flex items-center space-x-2">
// 												<User className="h-4 w-4 text-slate-400" />
// 												<span className="text-slate-300 text-sm">
// 													{currentAlarm.createdBy.name}
// 												</span>
// 											</div>
// 										</CardContent>
// 										{currentAlarm.severity === "CRITICAL" && (
// 											<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 										)}
// 									</Card>

// 									{/* Description */}
// 									<Card className="bg-slate-800 border-slate-700">
// 										<CardContent className="p-4">
// 											<h4 className="text-white font-medium mb-2">
// 												Incident Description
// 											</h4>
// 											<p className="text-slate-300">
// 												{currentAlarm.description}
// 											</p>
// 											{currentAlarm.additionalNotes && (
// 												<>
// 													<Separator className="my-3 bg-slate-600" />
// 													<h4 className="text-white font-medium mb-2">
// 														Additional Notes
// 													</h4>
// 													<p className="text-slate-300">
// 														{currentAlarm.additionalNotes}
// 													</p>
// 												</>
// 											)}
// 										</CardContent>
// 										{currentAlarm.severity === "CRITICAL" && (
// 											<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 										)}
// 									</Card>

// 									{/* Location Details */}
// 									{currentAlarm.location && (
// 										<Card className="bg-slate-800 border-slate-700">
// 											<CardContent className="p-4">
// 												<div className="flex items-center space-x-2 mb-2">
// 													<Navigation className="h-4 w-4 text-purple-400" />
// 													<span className="text-white font-medium">
// 														Sub City
// 													</span>
// 												</div>
// 												<p className="text-slate-300">
// 													{currentAlarm.location}
// 												</p>
// 											</CardContent>
// 											{currentAlarm.severity === "CRITICAL" && (
// 												<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 											)}
// 										</Card>
// 									)}
// 								</div>

// 								{/* Right Column - Map and Coordinates */}
// 								<div className="space-y-4">
// 									{/* Large Google Map */}
// 									{currentAlarm.latitude && currentAlarm.longitude && (
// 										<Card className="bg-slate-800 border-slate-700">
// 											<CardContent className="p-4">
// 												<div className="flex items-center space-x-2 mb-3">
// 													<Map className="h-4 w-4 text-purple-400" />
// 													<span className="text-white font-medium">
// 														Location Map
// 													</span>
// 												</div>
// 												<GoogleMap
// 													latitude={Number.parseFloat(currentAlarm.latitude)}
// 													longitude={Number.parseFloat(currentAlarm.longitude)}
// 													title={`${currentAlarm.type} - ${currentAlarm.branch.name}`}
// 												/>
// 											</CardContent>
// 											{currentAlarm.severity === "CRITICAL" && (
// 												<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 											)}
// 										</Card>
// 									)}

// 									{/* GPS Coordinates */}
// 									{(currentAlarm.latitude || currentAlarm.longitude) && (
// 										<Card className="bg-slate-800 border-slate-700">
// 											<CardContent className="p-4">
// 												<div className="flex items-center space-x-2 mb-2">
// 													<MapPin className="h-4 w-4 text-purple-400" />
// 													<span className="text-white font-medium">
// 														GPS Coordinates
// 													</span>
// 												</div>
// 												<p className="text-slate-300 font-mono">
// 													Lat: {currentAlarm.latitude || "N/A"}
// 												</p>
// 												<p className="text-slate-300 font-mono">
// 													Lng: {currentAlarm.longitude || "N/A"}
// 												</p>
// 											</CardContent>
// 											{currentAlarm.severity === "CRITICAL" && (
// 												<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
// 											)}
// 										</Card>
// 									)}
// 								</div>
// 							</div>

// 							{/* Enhanced Action Buttons */}
// 							<div className="flex flex-col sm:flex-row gap-3">
// 								<Button
// 									onClick={handleAcknowledge}
// 									disabled={isAcknowledging}
// 									className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg">
// 									{isAcknowledging ? (
// 										<>
// 											<Loader2 className="h-5 w-5 mr-2 animate-spin" />
// 											Acknowledging...
// 										</>
// 									) : (
// 										<>
// 											<CheckCircle className="h-5 w-5 mr-2" />
// 											ACKNOWLEDGE ALARM
// 										</>
// 									)}
// 								</Button>

// 								{/* {onStatusChange && (
// 									<Button
// 										onClick={() => onStatusChange(currentAlarm.id, "RESOLVED")}
// 										disabled={isAcknowledging}
// 										className="bg-blue-600 hover:bg-blue-700 text-white">
// 										<Target className="h-4 w-4 mr-2" />
// 										Mark Resolved
// 									</Button>
// 								)}

// 								<Button
// 									variant="outline"
// 									onClick={handleViewDetails}
// 									className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
// 									<Eye className="h-4 w-4 mr-2" />
// 									View Full Details
// 								</Button> */}
// 							</div>

// 							{/* Persistence Warning */}
// 							<div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
// 								<div className="flex items-center space-x-2">
// 									<AlertTriangle className="h-4 w-4 text-yellow-400" />
// 									<span className="text-yellow-400 font-medium">
// 										Persistent Alert
// 									</span>
// 								</div>
// 								<p className="text-yellow-200 text-sm mt-1">
// 									This modal will continue to appear until the alarm is
// 									acknowledged. Audio alerts are also active for
// 									{currentAlarm.severity === "CRITICAL"
// 										? " CRITICAL"
// 										: ` ${currentAlarm.severity}`}{" "}
// 									priority alarms.
// 								</p>
// 								{activeAlarms.length > 1 && (
// 									<p className="text-yellow-200 text-sm mt-1">
// 										{activeAlarms.length - 1} other alarm
// 										{activeAlarms.length > 2 ? "s" : ""} also require attention.
// 									</p>
// 								)}
// 							</div>

// 							{/* Dismiss Timer */}
// 							<div className="text-center text-slate-400 text-sm">
// 								<p>Modal dismissed temporarily will reappear in 2 minutes</p>
// 								<p>Alarm ID: #{currentAlarm.id.slice(-8)}</p>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
// 			)}
// 		</>
// 	);
// }
