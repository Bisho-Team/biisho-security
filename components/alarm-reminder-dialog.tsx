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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertTriangle,
	Bell,
	Clock,
	MapPin,
	Calendar,
	Volume2,
	VolumeX,
	Radio,
	Navigation,
	Crosshair,
	Shield,
	Activity,
	FileText,
	User,
	BarChart,
	Eye,
} from "lucide-react";
import { persistentNotificationService } from "@/lib/persistent-notification-service";
import { audioService } from "@/lib/audio-service";
import { cn } from "@/lib/utils";

interface AlarmReminderDialogProps {
	onViewDetails: (alarmId: string) => void;
	onAcknowledge: (alarmId: string) => void;
}

// Google Maps component for alarm location
const AlarmLocationMap = ({
	coordinates,
	location,
}: {
	coordinates?: { latitude: number; longitude: number };
	location: string;
}) => {
	useEffect(() => {
		if (!coordinates) return;

		// Define initMap globally
		(window as any).initMap = function () {
			const map = new (window as any).google.maps.Map(
				document.getElementById("alarm-map") as HTMLElement,
				{
					zoom: 16,
					center: { lat: coordinates.latitude, lng: coordinates.longitude },
					mapTypeId: (window as any).google.maps.MapTypeId.SATELLITE,
					styles: [
						{
							featureType: "all",
							elementType: "labels.text.fill",
							stylers: [{ color: "#ffffff" }],
						},
						{
							featureType: "all",
							elementType: "labels.text.stroke",
							stylers: [{ color: "#000000" }, { lightness: 13 }],
						},
					],
				}
			);

			// Add marker with custom icon
			new (window as any).google.maps.Marker({
				position: {
					lat: Number(coordinates.latitude),
					lng: Number(coordinates.longitude),
				},
				map: map,
				title: location,
				icon: {
					url:
						"data:image/svg+xml;charset=UTF-8," +
						encodeURIComponent(`
			  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="16" cy="16" r="15" fill="#ef4444" stroke="#ffffff" strokeWidth="2"/>
				<path d="M16 8L18.5 13H23L19.5 16.5L21 22L16 19L11 22L12.5 16.5L9 13H13.5L16 8Z" fill="white"/>
			  </svg>
			`),
					scaledSize: new (window as any).google.maps.Size(32, 32),
				},
				animation: (window as any).google.maps.Animation.BOUNCE,
			});

			// Add circle
			new (window as any).google.maps.Circle({
				strokeColor: "#ef4444",
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: "#ef4444",
				fillOpacity: 0.15,
				map: map,
				center: {
					lat: Number(coordinates.latitude),
					lng: Number(coordinates.longitude),
				},
				radius: 100,
			});
		};

		// Load script if not already loaded
		if (typeof (window as any).google === "undefined") {
			const script = document.createElement("script");
			script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&callback=initMap`;
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		} else {
			(window as any).initMap();
		}
	}, [coordinates, location]);

	if (!coordinates) {
		return (
			<div className="h-64 bg-slate-900 rounded-lg flex items-center justify-center border border-red-500/20">
				<div className="text-center text-slate-400">
					<MapPin className="h-8 w-8 mx-auto mb-2" />
					<p>Location coordinates not available</p>
					<p className="text-sm">{location}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative">
			<div
				id="alarm-map"
				className="h-64 w-full rounded-lg border-2 border-red-500/30 shadow-lg"
			/>
			<div className="absolute top-2 left-2 bg-black/80 text-white px-3 py-1 rounded-md text-sm font-mono">
				<Navigation className="h-3 w-3 inline mr-1" />
				{coordinates.latitude}, {coordinates.longitude}
			</div>
		</div>
	);
};

// Alarm metrics component
const AlarmMetrics = ({ alarm }: { alarm: any }) => {
	// Mock data for demonstration
	const responseTime = "2.3 minutes";
	const similarIncidents = 5;
	const riskScore = 87;

	return (
		<div className="grid grid-cols-3 gap-4">
			<div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center">
				<div className="p-2 bg-blue-600/20 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
					<Clock className="h-5 w-5 text-blue-400" />
				</div>
				<p className="text-blue-300 font-mono text-lg font-bold">
					{responseTime}
				</p>
				<p className="text-slate-400 text-xs font-mono">AVG RESPONSE TIME</p>
			</div>
			<div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center">
				<div className="p-2 bg-purple-600/20 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
					<Activity className="h-5 w-5 text-purple-400" />
				</div>
				<p className="text-purple-300 font-mono text-lg font-bold">
					{similarIncidents}
				</p>
				<p className="text-slate-400 text-xs font-mono">SIMILAR INCIDENTS</p>
			</div>
			<div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center">
				<div className="p-2 bg-red-600/20 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
					<BarChart className="h-5 w-5 text-red-400" />
				</div>
				<p className="text-red-300 font-mono text-lg font-bold">{riskScore}%</p>
				<p className="text-slate-400 text-xs font-mono">RISK SCORE</p>
			</div>
		</div>
	);
};

export function AlarmReminderDialog({
	onViewDetails,
	onAcknowledge,
}: AlarmReminderDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeAlarm, setActiveAlarm] = useState<any>(null);
	const [soundPlaying, setSoundPlaying] = useState(false);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [userInteracted, setUserInteracted] = useState(false);
	const [activeTab, setActiveTab] = useState("overview");
	const [showMap, setShowMap] = useState(false);

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
		const mostRecentAlarm: any =
			persistentNotificationService.getMostRecentActiveAlarm();

		if (mostRecentAlarm) {
			// Add mock coordinates for demo purposes
			const alarmWithCoords = {
				...mostRecentAlarm,
				coordinates: {
					latitude: mostRecentAlarm?.latitude
						? Number(mostRecentAlarm?.latitude)
						: 9.0192 + (Math.random() - 0.5) * 0.1,
					longitude: mostRecentAlarm?.longitude
						? Number(mostRecentAlarm?.longitude)
						: 38.7525 + (Math.random() - 0.5) * 0.1,
				},
			};
			setActiveAlarm(alarmWithCoords);
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
				return "bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-lg shadow-red-500/25";
			case "high":
				return "bg-gradient-to-r from-orange-600 to-orange-700 text-white border-0 shadow-lg shadow-orange-500/25";
			case "medium":
				return "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-0 shadow-lg shadow-yellow-500/25";
			case "low":
				return "bg-gradient-to-r from-green-600 to-green-700 text-white border-0 shadow-lg shadow-green-500/25";
			default:
				return "bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0";
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

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	if (!activeAlarm) return null;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent
				className={cn(
					"max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white",
					activeAlarm.severity === "critical"
						? "border-4 border-red-500 shadow-2xl shadow-red-500/20"
						: activeAlarm.severity === "high"
						? "border-4 border-orange-500 shadow-2xl shadow-orange-500/20"
						: "border-4 border-yellow-500 shadow-2xl shadow-yellow-500/20"
				)}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 text-2xl font-mono">
						<div
							className={cn(
								"p-2 rounded-lg border",
								activeAlarm.severity === "critical"
									? "bg-red-600/20 border-red-500/30"
									: activeAlarm.severity === "high"
									? "bg-orange-600/20 border-orange-500/30"
									: "bg-yellow-600/20 border-yellow-500/30"
							)}>
							<AlertTriangle
								className={cn(
									"h-6 w-6",
									activeAlarm.severity === "critical"
										? "text-red-400 animate-pulse"
										: activeAlarm.severity === "high"
										? "text-orange-400"
										: "text-yellow-400"
								)}
							/>
						</div>
						{activeAlarm.severity === "critical"
							? "CRITICAL SECURITY BREACH DETECTED"
							: activeAlarm.severity === "high"
							? "HIGH PRIORITY SECURITY ALERT"
							: "SECURITY INCIDENT NOTIFICATION"}
					</DialogTitle>
					<DialogDescription className="text-slate-400 font-mono">
						This security incident requires immediate acknowledgment and
						response
					</DialogDescription>
				</DialogHeader>

				<Tabs
					defaultValue="overview"
					className="mt-4"
					onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-3 bg-slate-800/60 border border-slate-700/50 p-1">
						<TabsTrigger
							value="overview"
							className="data-[state=active]:bg-red-600/30 data-[state=active]:text-red-200 font-mono">
							INCIDENT OVERVIEW
						</TabsTrigger>
						<TabsTrigger
							value="details"
							className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-200 font-mono">
							TACTICAL DETAILS
						</TabsTrigger>
						<TabsTrigger
							value="response"
							className="data-[state=active]:bg-green-600/30 data-[state=active]:text-green-200 font-mono">
							RESPONSE OPTIONS
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-4 mt-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-4">
								<div className="relative">
									<div
										className={cn(
											"p-4 rounded-xl border",
											activeAlarm.severity === "critical"
												? "bg-red-600/20 border-red-500/30"
												: activeAlarm.severity === "high"
												? "bg-orange-600/20 border-orange-500/30"
												: "bg-yellow-600/20 border-yellow-500/30"
										)}>
										<Bell
											className={cn(
												"h-8 w-8",
												activeAlarm.severity === "critical"
													? "text-red-400 animate-swing"
													: activeAlarm.severity === "high"
													? "text-orange-400 animate-pulse"
													: "text-yellow-400"
											)}
										/>
									</div>
									{activeAlarm.severity === "critical" && (
										<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
									)}
								</div>
								<div>
									<h3 className="text-xl font-bold text-white font-mono">
										{activeAlarm.type}
									</h3>
									<p className="text-slate-300 flex items-center font-mono">
										<MapPin className="h-4 w-4 mr-2 text-red-400" />
										{activeAlarm.branchName} - {activeAlarm.location}
									</p>
									<p className="text-slate-400 text-sm flex items-center mt-1 font-mono">
										<Calendar className="h-3 w-3 mr-2" />
										{getTimeAgo(activeAlarm.createdAt)}
									</p>
								</div>
							</div>
							<Badge
								className={cn(
									"text-sm px-4 py-2 font-mono font-bold",
									getSeverityColor(activeAlarm.severity)
								)}>
								{activeAlarm.severity.toUpperCase()}
							</Badge>
						</div>

						<Card className="bg-slate-800/50 border-slate-700">
							<CardHeader>
								<CardTitle className="text-lg font-mono text-slate-200">
									INCIDENT DESCRIPTION
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="p-4 bg-slate-900/50 rounded-lg border border-slate-600">
									<p className="text-slate-200 font-mono leading-relaxed">
										{activeAlarm.description}
									</p>
								</div>
							</CardContent>
						</Card>

						<AlarmMetrics alarm={activeAlarm} />

						<div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
							<div className="flex space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleToggleSound}
									className="flex items-center border-slate-600 text-slate-200 hover:bg-slate-800 font-mono"
									disabled={!userInteracted}>
									{soundPlaying ? (
										<>
											<VolumeX className="h-4 w-4 mr-2 text-red-500" />
											MUTE ALERT
										</>
									) : (
										<>
											<Volume2 className="h-4 w-4 mr-2" />
											PLAY ALERT
										</>
									)}
								</Button>

								<Button
									variant="outline"
									size="sm"
									onClick={handleToggleAudio}
									className="flex items-center border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
									{audioEnabled ? (
										<>
											<Volume2 className="h-4 w-4 mr-2 text-green-500" />
											AUDIO ENABLED
										</>
									) : (
										<>
											<VolumeX className="h-4 w-4 mr-2 text-red-500" />
											AUDIO DISABLED
										</>
									)}
								</Button>
							</div>
							<p className="text-slate-400 text-sm font-mono">
								<Clock className="h-3 w-3 inline mr-1" />
								ALERT ACTIVE UNTIL ACKNOWLEDGED
							</p>
						</div>
					</TabsContent>

					<TabsContent value="details" className="space-y-4 mt-4">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<Card className="bg-slate-800/50 border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg font-mono text-slate-200">
										ALARM CLASSIFICATION
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												INCIDENT ID
											</Label>
											<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
												{activeAlarm.id}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												ALARM TYPE
											</Label>
											<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
												{activeAlarm.type}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												SEVERITY LEVEL
											</Label>
											<Badge
												className={cn(
													"text-sm font-mono",
													getSeverityColor(activeAlarm.severity)
												)}>
												{activeAlarm.severity.toUpperCase()}
											</Badge>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												STATUS
											</Label>
											<Badge className="bg-red-600/30 text-red-200 border border-red-500/50 font-mono">
												ACTIVE THREAT
											</Badge>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												TIMESTAMP
											</Label>
											<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
												{formatDateTime(activeAlarm.createdAt)}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												PRIORITY
											</Label>
											<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
												{activeAlarm.severity === "critical"
													? "P0 - IMMEDIATE"
													: activeAlarm.severity === "high"
													? "P1 - URGENT"
													: "P2 - HIGH"}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-slate-800/50 border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg font-mono text-slate-200">
										LOCATION INTELLIGENCE
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label className="text-sm font-medium text-slate-400 font-mono">
											FACILITY
										</Label>
										<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
											<Radio className="h-4 w-4 mr-2 text-blue-400" />
											{activeAlarm.branchName}
										</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-slate-400 font-mono">
											SPECIFIC LOCATION
										</Label>
										<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
											<MapPin className="h-4 w-4 mr-2 text-red-400" />
											{activeAlarm.location}
										</p>
									</div>
									{activeAlarm.coordinates && (
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												GPS COORDINATES
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<Crosshair className="h-4 w-4 mr-2 text-green-400" />
												{activeAlarm.coordinates.latitude.toFixed(6)},
												{activeAlarm.coordinates.longitude.toFixed(6)}
											</p>
										</div>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowMap(!showMap)}
										className="w-full border-blue-600/50 text-blue-300 hover:bg-blue-900/30 font-mono">
										<Navigation className="h-4 w-4 mr-2" />
										{showMap ? "HIDE TACTICAL MAP" : "SHOW TACTICAL MAP"}
									</Button>
								</CardContent>
							</Card>
						</div>

						{showMap && (
							<Card className="bg-slate-800/50 border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
										<Navigation className="h-5 w-5 mr-2 text-blue-400" />
										TACTICAL MAP OVERLAY
									</CardTitle>
								</CardHeader>
								<CardContent>
									<AlarmLocationMap
										coordinates={activeAlarm.coordinates}
										location={activeAlarm.location}
									/>
								</CardContent>
							</Card>
						)}

						<Card className="bg-slate-800/50 border-slate-700">
							<CardHeader>
								<CardTitle className="text-lg font-mono text-slate-200">
									INCIDENT TIMELINE
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center space-x-4 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
										<div className="p-2 bg-red-600/30 rounded-full">
											<AlertTriangle className="h-4 w-4 text-red-400" />
										</div>
										<div>
											<p className="text-red-200 font-mono font-medium">
												ALARM DETECTED
											</p>
											<p className="text-red-300 text-sm font-mono">
												{formatDateTime(activeAlarm.createdAt)}
											</p>
										</div>
									</div>
									<div className="flex items-center space-x-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
										<div className="p-2 bg-slate-700/50 rounded-full">
											<Bell className="h-4 w-4 text-slate-400" />
										</div>
										<div>
											<p className="text-slate-200 font-mono font-medium">
												NOTIFICATION SENT
											</p>
											<p className="text-slate-300 text-sm font-mono">
												{formatDateTime(activeAlarm.createdAt)}
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="response" className="space-y-4 mt-4">
						<Card className="bg-slate-800/50 border-slate-700">
							<CardHeader>
								<CardTitle className="text-lg font-mono text-slate-200">
									RECOMMENDED ACTIONS
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30 flex items-center justify-between">
										<div className="flex items-center">
											<div className="p-2 bg-yellow-600/30 rounded-full mr-3">
												<Clock className="h-4 w-4 text-yellow-400" />
											</div>
											<p className="text-yellow-200 font-mono">
												ACKNOWLEDGE ALARM
											</p>
										</div>
										<Button
											size="sm"
											onClick={handleAcknowledge}
											className="bg-yellow-600 hover:bg-yellow-700 font-mono">
											<Clock className="h-4 w-4 mr-2" />
											ACKNOWLEDGE
										</Button>
									</div>

									{/* <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30 flex items-center justify-between">
										<div className="flex items-center">
											<div className="p-2 bg-blue-600/30 rounded-full mr-3">
												<Eye className="h-4 w-4 text-blue-400" />
											</div>
											<p className="text-blue-200 font-mono">
												VIEW DETAILED REPORT
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											onClick={handleViewDetails}
											className="border-blue-600/50 text-blue-300 hover:bg-blue-900/30 font-mono">
											<Eye className="h-4 w-4 mr-2" />
											VIEW DETAILS
										</Button>
									</div> */}

									{/* <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30 flex items-center justify-between">
										<div className="flex items-center">
											<div className="p-2 bg-green-600/30 rounded-full mr-3">
												<Shield className="h-4 w-4 text-green-400" />
											</div>
											<p className="text-green-200 font-mono">
												DISPATCH SECURITY TEAM
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="border-green-600/50 text-green-300 hover:bg-green-900/30 font-mono">
											<Shield className="h-4 w-4 mr-2" />
											DISPATCH TEAM
										</Button>
									</div> */}

									<div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30 flex items-center justify-between">
										<div className="flex items-center">
											<div className="p-2 bg-purple-600/30 rounded-full mr-3">
												<FileText className="h-4 w-4 text-purple-400" />
											</div>
											<p className="text-purple-200 font-mono">
												GENERATE INCIDENT REPORT
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="border-purple-600/50 text-purple-300 hover:bg-purple-900/30 font-mono">
											<FileText className="h-4 w-4 mr-2" />
											GENERATE REPORT
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700">
							<CardHeader>
								<CardTitle className="text-lg font-mono text-slate-200">
									ESCALATION CONTACTS
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600 flex items-center justify-between">
										<div className="flex items-center">
											<div className="p-2 bg-slate-800 rounded-full mr-3">
												<User className="h-4 w-4 text-blue-400" />
											</div>
											<div>
												<p className="text-slate-200 font-mono">
													Security Manager
												</p>
												<p className="text-slate-400 text-sm font-mono">
													+251 911-234-567
												</p>
											</div>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
											CONTACT
										</Button>
									</div>

									<div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600 flex items-center justify-between">
										<div className="flex items-center">
											<div className="p-2 bg-slate-800 rounded-full mr-3">
												<User className="h-4 w-4 text-red-400" />
											</div>
											<div>
												<p className="text-slate-200 font-mono">
													Emergency Response
												</p>
												<p className="text-slate-400 text-sm font-mono">
													+251 911-911-911
												</p>
											</div>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
											CONTACT
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<DialogFooter className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
					<Button
						variant="outline"
						onClick={() => setIsOpen(false)}
						className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
						DISMISS
					</Button>
					{/* <Button
						onClick={handleViewDetails}
						variant="outline"
						className="border-blue-600/50 text-blue-300 hover:bg-blue-900/30 font-mono">
						<Eye className="h-4 w-4 mr-2" />
						VIEW DETAILS
					</Button> */}
					<Button
						onClick={handleAcknowledge}
						className={cn(
							activeAlarm.severity === "critical"
								? "bg-red-600 hover:bg-red-700"
								: activeAlarm.severity === "high"
								? "bg-orange-600 hover:bg-orange-700"
								: "bg-yellow-600 hover:bg-yellow-700",
							"text-white font-mono"
						)}>
						<Clock className="h-4 w-4 mr-2" />
						ACKNOWLEDGE ALARM
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
// 	VolumeX,
// } from "lucide-react";
// import { persistentNotificationService } from "@/lib/persistent-notification-service";
// import { audioService } from "@/lib/audio-service";
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
// 	const [audioEnabled, setAudioEnabled] = useState(true);
// 	const [userInteracted, setUserInteracted] = useState(false);

// 	useEffect(() => {
// 		// Initialize audio on first user interaction
// 		const handleUserInteraction = () => {
// 			setUserInteracted(true);
// 			audioService.initialize();

// 			// Remove event listeners
// 			window.removeEventListener("click", handleUserInteraction);
// 			window.removeEventListener("touchstart", handleUserInteraction);
// 			window.removeEventListener("keydown", handleUserInteraction);
// 		};

// 		window.addEventListener("click", handleUserInteraction);
// 		window.addEventListener("touchstart", handleUserInteraction);
// 		window.addEventListener("keydown", handleUserInteraction);

// 		// Check for active alarms on mount and every 10 seconds
// 		checkForActiveAlarms();
// 		const interval = setInterval(checkForActiveAlarms, 10000);

// 		return () => {
// 			clearInterval(interval);
// 			window.removeEventListener("click", handleUserInteraction);
// 			window.removeEventListener("touchstart", handleUserInteraction);
// 			window.removeEventListener("keydown", handleUserInteraction);
// 		};
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
// 			setSoundPlaying(false);
// 		}
// 	};

// 	const handleViewDetails = () => {
// 		if (!activeAlarm) return;

// 		onViewDetails(activeAlarm.id);
// 		setIsOpen(false);
// 	};

// 	const handleToggleSound = async () => {
// 		if (!activeAlarm) return;

// 		if (soundPlaying) {
// 			persistentNotificationService.stopAllSounds();
// 			setSoundPlaying(false);
// 		} else {
// 			const success =
// 				await persistentNotificationService.playAlarmSoundManually(
// 					activeAlarm.id
// 				);
// 			setSoundPlaying(success);
// 		}
// 	};

// 	const handleToggleAudio = () => {
// 		const newState = !audioEnabled;
// 		setAudioEnabled(newState);
// 		persistentNotificationService.setAudioEnabled(newState);

// 		if (!newState) {
// 			setSoundPlaying(false);
// 		}
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
// 						<div className="flex space-x-2">
// 							<Button
// 								variant="outline"
// 								size="sm"
// 								onClick={handleToggleSound}
// 								className="flex items-center"
// 								disabled={!userInteracted}>
// 								{soundPlaying ? (
// 									<>
// 										<VolumeX className="h-4 w-4 mr-2 text-red-500" />
// 										Stop Sound
// 									</>
// 								) : (
// 									<>
// 										<Volume2 className="h-4 w-4 mr-2" />
// 										Play Sound
// 									</>
// 								)}
// 							</Button>

// 							<Button
// 								variant="outline"
// 								size="sm"
// 								onClick={handleToggleAudio}
// 								className="flex items-center">
// 								{audioEnabled ? (
// 									<>
// 										<Volume2 className="h-4 w-4 mr-2 text-green-500" />
// 										Audio On
// 									</>
// 								) : (
// 									<>
// 										<VolumeX className="h-4 w-4 mr-2 text-red-500" />
// 										Audio Off
// 									</>
// 								)}
// 							</Button>
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
