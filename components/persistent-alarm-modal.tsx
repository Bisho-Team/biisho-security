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
	Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";

interface Alarm {
	id: string;
	alarmCode: string; // Unique code for the alarm
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
	reports: {
		id: string;
		acknowledgedAt?: string;
		acknowledgedBy?: {
			id: string;
			name: string;
			email: string;
			phone?: string;
		};
		completedAt?: string;
		resolvedBy?: {
			id: string;
			name: string;
			email: string;
			phone?: string;
		};
		status: "PENDING" | "COMPLETED" | "RESOLVED";
		assignedTo?: {
			id: string;
			name: string;
			email: string;
			company?: {
				id: string;
				name: string;
			};
		};
	}[];
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
		email: string;
		phone?: string;
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
				return "bg-green-600 text-white";
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
				return "border-green-500";
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

	// Date formatting function for better readability
	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

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
						{/* Header */}
						<div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 p-4 z-10">
							<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
								{/* Emergency Alert & Company */}
								<div className="flex items-center space-x-3">
									<AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
									<div className="flex-1 min-w-0">
										{currentAlarm.branch?.company?.logo ? (
											<div className="flex items-start flex-col space-x-2 mt-1">
												<img
													src={`https://frt.et${currentAlarm.branch.company.logo.replace(
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
										) : (
											<div className="flex items-start flex-col space-x-2 mt-1">
												<div className="flex flex-col">
													<span className="text font-bold">
														{currentAlarm?.branch?.company?.name}
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
											Location: {currentAlarm.branch.name}
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
												City: {currentAlarm.branch.city}
											</span>
										</div>
									)}
									{currentAlarm.branch.city && (
										<div className="flex items-center space-x-2">
											<MapPin className="h-3 w-3 text-green-400" />
											<span className="text-xs text-slate-400">
												Sub City:
												{currentAlarm.branch.subCity &&
													`${currentAlarm.branch.subCity}`}
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
															Manager: {currentAlarm.branch.managerName}
														</span>
													</div>
												)}
												{currentAlarm.branch.phoneNumber && (
													<div className="flex items-center space-x-2">
														<Phone className="h-3 w-3 text-slate-400" />
														<span className="text-white text-xs font-mono">
															Contact: {currentAlarm.branch.phoneNumber}
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
									{/* <div className="flex items-center space-x-2">
										<Badge className="bg-red-600 text-white" variant="outline">
											{currentAlarm.status}
										</Badge>
									</div> */}
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

						{/* Content */}
						<div className="p-4 space-y-4">
							{/* Alarm Type & Priority Banner */}
							<div
								className={cn(
									"p-3 rounded-lg border-2 text-center",
									getSeverityBorderColor(currentAlarm.severity),
									currentAlarm.severity === "CRITICAL" && "bg-red-900/20",
									currentAlarm.severity === "HIGH" && "bg-orange-900/20",
									currentAlarm.severity === "MEDIUM" && "bg-yellow-900/20",
									currentAlarm.severity === "LOW" && "bg-green-900/20"
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
										ID: #{currentAlarm?.alarmCode}
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
								</div>
							</div>

							<div className="grid grid-cols-2 space-x-4">
								{/* Right Column - Details */}

								{/* Time & Creator */}
								<Card className="bg-slate-800 col-span-1  border-slate-700">
									<CardContent className="p-3 space-y-3">
										<div>
											<Label className="text-slate-400 text-sm font-medium mb-2 block">
												Timeline
											</Label>
											<div className="space-y-3">
												{/* Enhanced Created Section */}
												<div className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
													<div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
													<div className="flex-1">
														<div className="flex items-center justify-between mb-1">
															<span className="text-white text-sm font-medium">
																Created
															</span>
															<span className="text-slate-400 text-xs">
																{formatDateTime(currentAlarm.createdAt)}
															</span>
														</div>
														{currentAlarm.createdBy && (
															<div className="space-y-1">
																<div className="flex items-center space-x-2">
																	<User className="h-3 w-3 text-slate-400" />
																	<span className="text-slate-300 text-xs">
																		Operator: {currentAlarm.createdBy.name}
																	</span>
																</div>
																<div className="flex items-center space-x-2">
																	<Mail className="h-3 w-3 text-slate-400" />
																	<span className="text-slate-300 text-xs">
																		Email:{" "}
																		{currentAlarm.createdBy.email ||
																			"Not provided"}
																	</span>
																</div>
																<div className="flex items-center space-x-2">
																	<Mail className="h-3 w-3 text-slate-400" />
																	<span className="text-slate-300 text-xs">
																		Phone:{" "}
																		{currentAlarm.createdBy.phone ||
																			"Not provided"}
																	</span>
																</div>
															</div>
														)}
														{/* {currentAlarm.reports[0].assignedTo?.company
															?.name && (
															<div className="flex items-center space-x-2">
																<Building className="h-3 w-3 text-slate-400" />
																<span className="text-slate-300 text-xs">
																	Assigned to:{" "}
																	{
																		currentAlarm.reports[0].assignedTo.company
																			.name
																	}
																</span>
															</div>
														)} */}
													</div>
												</div>

												{/* Enhanced Acknowledged Section */}
												{currentAlarm.reports &&
													currentAlarm.reports.length > 0 &&
													currentAlarm.reports[0].acknowledgedAt && (
														<div className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
															<div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
															<div className="flex-1">
																<div className="flex items-center justify-between mb-1">
																	<span className="text-white text-sm font-medium">
																		Acknowledged
																	</span>
																	<span className="text-slate-400 text-xs">
																		{formatDateTime(
																			currentAlarm.reports[0].acknowledgedAt
																		)}
																	</span>
																</div>
																<div className="space-y-1">
																	{currentAlarm.reports[0].acknowledgedBy && (
																		<div className="flex items-center space-x-2">
																			<User className="h-3 w-3 text-slate-400" />
																			<span className="text-slate-300 text-xs">
																				By:{" "}
																				{
																					currentAlarm.reports[0].acknowledgedBy
																						.name
																				}
																			</span>
																		</div>
																	)}
																	{currentAlarm.reports[0].assignedTo?.company
																		?.name && (
																		<div className="flex items-center space-x-2">
																			<Building className="h-3 w-3 text-slate-400" />
																			<span className="text-slate-300 text-xs">
																				Assigned to:{" "}
																				{
																					currentAlarm.reports[0].assignedTo
																						.company.name
																				}
																			</span>
																		</div>
																	)}
																</div>
															</div>
														</div>
													)}

												{/* Enhanced Completed/Resolved Section */}
												{currentAlarm.reports &&
													currentAlarm.reports.length > 0 &&
													currentAlarm.reports[0].completedAt && (
														<div className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
															<div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
															<div className="flex-1">
																<div className="flex items-center justify-between mb-1">
																	<span className="text-white text-sm font-medium">
																		Resolved
																	</span>
																	<span className="text-slate-400 text-xs">
																		{formatDateTime(
																			currentAlarm.reports[0].completedAt
																		)}
																	</span>
																</div>
																<div className="space-y-1">
																	{currentAlarm.reports[0].resolvedBy && (
																		<div className="flex items-center space-x-2">
																			<User className="h-3 w-3 text-slate-400" />
																			<span className="text-slate-300 text-xs">
																				By:{" "}
																				{
																					currentAlarm.reports[0].resolvedBy
																						.name
																				}
																			</span>
																		</div>
																	)}
																	{currentAlarm.reports[0].assignedTo?.company
																		?.name && (
																		<div className="flex items-center space-x-2">
																			<Building className="h-3 w-3 text-slate-400" />
																			<span className="text-slate-300 text-xs">
																				Company:{" "}
																				{
																					currentAlarm.reports[0].assignedTo
																						.company.name
																				}
																			</span>
																		</div>
																	)}
																</div>
															</div>
														</div>
													)}
											</div>
										</div>

										{/* Assignment Information - add this as a new section */}
										{currentAlarm.reports &&
											currentAlarm.reports.length > 0 &&
											currentAlarm.reports[0].assignedTo && (
												<div>
													<Label className="text-slate-400 text-sm font-medium mb-2 block">
														Assignment Details
													</Label>
													<div className="bg-slate-900/50 p-3 rounded-lg border border-slate-600">
														<div className="space-y-2">
															<div className="flex items-center justify-between">
																<span className="text-slate-400 text-sm">
																	Assigned To:
																</span>
																<span className="text-white text-sm font-medium">
																	{currentAlarm.reports[0].assignedTo.company
																		?.name ||
																		currentAlarm.reports[0].assignedTo.name}
																</span>
															</div>
															<div className="flex items-center justify-between">
																<span className="text-slate-400 text-sm">
																	Contact Person:
																</span>
																<span className="text-white text-sm">
																	{currentAlarm.reports[0].assignedTo.name}
																</span>
															</div>
															{/* <div className="flex items-center justify-between">
																<span className="text-slate-400 text-sm">
																	Status:
																</span>
																<Badge
																	variant="outline"
																	className={`text-xs ${
																		currentAlarm.reports[0].status === "PENDING"
																			? "bg-yellow-900/30 border-yellow-500 text-yellow-300"
																			: currentAlarm.reports[0].status ===
																			  "COMPLETED"
																			? "bg-green-900/30 border-green-500 text-green-300"
																			: "bg-slate-900/30 border-slate-500 text-slate-300"
																	}`}>
																	{currentAlarm.reports[0].status}
																</Badge>
															</div> */}
														</div>
													</div>
												</div>
											)}
										{/* <div>
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
										</div> */}
									</CardContent>
								</Card>

								{/* Quick Stats */}
								<Card className="bg-slate-800 border-slate-700">
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
