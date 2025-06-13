"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api-service";
import { persistentNotificationService } from "@/lib/persistent-notification-service";
import { EnhancedAlarmIndicators } from "@/components/enhanced-alarm-indicators";
import { PersistentAlarmBanner } from "@/components/persistent-alarm-banner";
import { AlarmReminderDialog } from "@/components/alarm-reminder-dialog";
import { audioService } from "@/lib/audio-service";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Shield,
	Eye,
	MessageSquare,
	MapPin,
	Calendar,
	Loader2,
	Search,
	Zap,
	Bell,
	Activity,
	Target,
	Radio,
	Wifi,
	Server,
	Lock,
	Unlock,
	AlertCircle,
	Navigation,
	Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alarm {
	id: string;
	type: string;
	branchId: string;
	branch: {
		id: string;
		name: string;
	};
	location: string;
	latitude: string;
	longitude: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	additionalNotes?: string;
	createdBy: {
		id: string;
		name: string;
	};
	createdAt: string;
	acknowledgedAt?: string;
	completedAt?: string;
	resolutionDescription?: string;
	responseTime?: string;
	priority?: number;
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

export default function EnhancedAlarmReportsPage() {
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
	const [resolutionDescription, setResolutionDescription] = useState("");
	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [severityFilter, setSeverityFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [userInteracted, setUserInteracted] = useState(false);

	const [audioEnabled, setAudioEnabled] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		// Handle user interaction to enable audio
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

		fetchAlarms();
		persistentNotificationService.initialize();
		// Preload audio files to avoid loading issues
		preloadAudioFiles();

		return () => {
			window.removeEventListener("click", handleUserInteraction);
			window.removeEventListener("touchstart", handleUserInteraction);
			window.removeEventListener("keydown", handleUserInteraction);
		};
	}, []);

	const preloadAudioFiles = () => {
		const sirenAudio = new Audio();
		sirenAudio.src = "/sounds/siren.mp3";
		sirenAudio.preload = "auto";

		const notificationAudio = new Audio();
		notificationAudio.src = "/sounds/notification.mp3";
		notificationAudio.preload = "auto";

		// Just trigger load, don't play
		sirenAudio.load();
		notificationAudio.load();

		console.log("Audio files preloaded");
	};

	const fetchAlarms = async () => {
		try {
			setLoading(true);
			const response: any = await apiService.get("/alarms");
			console.log("Fetched alarms:", response);

			const alarmsWithCoords = (response as any).alarms.map((alarm: Alarm) => ({
				...alarm,
				coordinates: {
					latitude: alarm?.latitude
						? Number(alarm?.latitude)
						: 9.0192 + (Math.random() - 0.5) * 0.1,
					longitude: alarm?.longitude
						? Number(alarm?.longitude)
						: 38.7525 + (Math.random() - 0.5) * 0.1,
				},
			}));
			setAlarms(alarmsWithCoords);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch alarms",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const acknowledgeAlarm = async (alarmId: string) => {
		try {
			setUpdating(true);
			await apiService.put(`/alarms/${alarmId}`, {
				status: "ACKNOWLEDGED",
				acknowledgedAt: new Date().toISOString(),
			});

			await persistentNotificationService.acknowledgeAlarm(alarmId);

			toast({
				title: "Success",
				description: "Alarm acknowledged successfully",
			});

			fetchAlarms();
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to acknowledge alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const completeAlarm = async (alarmId: string, resolution: string) => {
		try {
			setUpdating(true);
			await apiService.put(`/alarms/${alarmId}`, {
				status: "RESOLVED",
				completedAt: new Date().toISOString(),
				resolutionDescription: resolution,
			});

			toast({
				title: "Success",
				description: "Alarm completed successfully",
			});

			setIsResolutionDialogOpen(false);
			setResolutionDescription("");
			setSelectedAlarm(null);
			fetchAlarms();
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to complete alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const viewAlarmDetails = (alarmId: string) => {
		const alarm = alarms.find((a) => a.id === alarmId);
		if (alarm) {
			setSelectedAlarm(alarm);
			setIsDetailsDialogOpen(true);
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "CRITICAL":
				return "bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-lg shadow-red-500/25";
			case "HIGH":
				return "bg-gradient-to-r from-orange-600 to-orange-700 text-white border-0 shadow-lg shadow-orange-500/25";
			case "MEDIUM":
				return "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-0 shadow-lg shadow-yellow-500/25";
			case "LOW":
				return "bg-gradient-to-r from-green-600 to-green-700 text-white border-0 shadow-lg shadow-green-500/25";
			default:
				return "bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0";
		}
	};

	const getStatusIcon = (status: string, severity?: string) => {
		const iconClass = severity === "CRITICAL" ? "animate-pulse" : "";
		switch (status) {
			case "ACTIVE":
				return (
					<AlertTriangle className={cn("h-5 w-5 text-red-500", iconClass)} />
				);
			case "ACKNOWLEDGED":
				return <Clock className="h-5 w-5 text-yellow-500" />;
			case "RESOLVED":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			default:
				return <AlertTriangle className="h-5 w-5 text-gray-500" />;
		}
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
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

	const filteredAlarms = alarms.filter((alarm) => {
		const matchesSearch =
			searchTerm === "" ||
			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.description.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesSeverity =
			severityFilter === "all" || alarm.severity === severityFilter;
		const matchesStatus =
			statusFilter === "all" || alarm.status === statusFilter;

		return matchesSearch && matchesSeverity && matchesStatus;
	});

	const toggleAudio = () => {
		const newState = !audioEnabled;
		setAudioEnabled(newState);
		persistentNotificationService.setAudioEnabled(newState);

		toast({
			title: newState ? "Audio Enabled" : "Audio Disabled",
			description: newState
				? "Alarm sounds will now play"
				: "Alarm sounds are now muted",
		});
	};

	const activeAlarms = filteredAlarms.filter(
		(alarm) => alarm.status === "ACTIVE"
	);
	const acknowledgedAlarms = filteredAlarms.filter(
		(alarm) => alarm.status === "ACKNOWLEDGED"
	);
	const completedAlarms = filteredAlarms.filter(
		(alarm) => alarm.status === "RESOLVED"
	);
	const criticalAlarms = activeAlarms.filter(
		(alarm) => alarm.severity === "CRITICAL"
	);

	if (loading) {
		return (
			<div className="space-y-6 animate-fade-in bg-slate-950 min-h-screen p-6">
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center space-y-4">
						<div className="relative">
							<Loader2 className="h-12 w-12 animate-spin mx-auto text-red-500" />
							<div className="absolute inset-0 h-12 w-12 border-2 border-red-500/20 rounded-full animate-ping mx-auto" />
						</div>
						<p className="text-slate-300 font-mono">
							INITIALIZING POLICE COMMAND CENTER...
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			<div className="space-y-6 p-6">
				<PersistentAlarmBanner />

				{/* Alarm Reminder Dialog */}
				<AlarmReminderDialog
					onViewDetails={viewAlarmDetails}
					onAcknowledge={acknowledgeAlarm}
				/>

				{/* Header Section */}
				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
					<div className="relative flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="relative">
								<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
									<Shield className="h-8 w-8 text-red-400" />
								</div>
								<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
							</div>
							<div>
								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
									POLICE COMMAND CENTER
								</h1>
								<p className="text-slate-400 font-mono text-lg mt-2">
									Real-time ALARM monitoring & incident response system
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 rounded-lg border border-green-500/30">
								<Wifi className="h-4 w-4 text-green-400" />
								<span className="text-green-400 font-mono text-sm">
									SYSTEM ONLINE
								</span>
							</div>
							<div className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
								<Server className="h-4 w-4 text-blue-400" />
								<span className="text-blue-400 font-mono text-sm">
									ALL SENSORS ACTIVE
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Enhanced Alarm Indicators */}
				<EnhancedAlarmIndicators
					alarms={alarms as any}
					onAcknowledge={acknowledgeAlarm as any}
					onViewDetails={viewAlarmDetails}
				/>

				{/* Enhanced Statistics Cards */}
				<div className="grid gap-6 md:grid-cols-4">
					<Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-500/30 shadow-xl shadow-red-500/10 animate-slide-up">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-red-200">
								ACTIVE ALARMS
							</CardTitle>
							<div className="relative p-3 bg-red-600/30 rounded-lg border border-red-500/40">
								<Bell className="h-6 w-6 text-red-400 animate-swing" />
								{activeAlarms.length > 0 && (
									<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
								)}
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-red-400 font-mono">
								{activeAlarms.length}
							</div>
							<p className="text-xs text-red-300 font-mono mt-1">
								{criticalAlarms.length} CRITICAL ALERTS
							</p>
							{activeAlarms.length > 0 && (
								<div className="mt-2 h-1 bg-red-900/50 rounded-full overflow-hidden">
									<div
										className="h-full bg-red-500 animate-pulse"
										style={{ width: "100%" }}
									/>
								</div>
							)}
						</CardContent>
					</Card>

					<Card
						className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-500/30 shadow-xl shadow-yellow-500/10 animate-slide-up"
						style={{ animationDelay: "0.1s" }}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-yellow-200">
								ACKNOWLEDGED
							</CardTitle>
							<div className="p-3 bg-yellow-600/30 rounded-lg border border-yellow-500/40">
								<Target className="h-6 w-6 text-yellow-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-yellow-400 font-mono">
								{acknowledgedAlarms.length}
							</div>
							<p className="text-xs text-yellow-300 font-mono mt-1">
								RESPONSE IN PROGRESS
							</p>
						</CardContent>
					</Card>

					<Card
						className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30 shadow-xl shadow-green-500/10 animate-slide-up"
						style={{ animationDelay: "0.2s" }}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-green-200">
								RESOLVED TODAY
							</CardTitle>
							<div className="p-3 bg-green-600/30 rounded-lg border border-green-500/40">
								<Lock className="h-6 w-6 text-green-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-green-400 font-mono">
								{completedAlarms.length}
							</div>
							<p className="text-xs text-green-300 font-mono mt-1">
								ALARMS NEUTRALIZED
							</p>
						</CardContent>
					</Card>

					<Card
						className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500/30 shadow-xl shadow-blue-500/10 animate-slide-up"
						style={{ animationDelay: "0.3s" }}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-blue-200">
								SYSTEM STATUS
							</CardTitle>
							<div className="p-3 bg-blue-600/30 rounded-lg border border-blue-500/40">
								<Activity className="h-6 w-6 text-blue-400" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-blue-400 font-mono">
								99.9%
							</div>
							<p className="text-xs text-blue-300 font-mono mt-1">
								OPERATIONAL UPTIME
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Enhanced Search and Filter Controls */}
				<Card
					className="bg-slate-900/60 border-slate-700/50 shadow-xl backdrop-blur-sm animate-slide-up"
					style={{ animationDelay: "0.4s" }}>
					<CardContent className="p-6">
						<div className="flex flex-col md:flex-row gap-4">
							<div className="flex-1">
								<div className="relative">
									<Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
									<Input
										placeholder="Search threats by type, location, branch, or description..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-12 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-red-500/50 focus:ring-red-500/20 font-mono"
									/>
								</div>
							</div>
							<div className="flex gap-3">
								<Select
									value={severityFilter}
									onValueChange={setSeverityFilter}>
									<SelectTrigger className="w-40 bg-slate-800/50 border-slate-600/50 text-white font-mono">
										<SelectValue placeholder="Threat Level" />
									</SelectTrigger>
									<SelectContent className="bg-slate-800 border-slate-600">
										<SelectItem value="all">All Levels</SelectItem>
										<SelectItem value="critical">CRITICAL</SelectItem>
										<SelectItem value="high">HIGH</SelectItem>
										<SelectItem value="medium">MEDIUM</SelectItem>
										<SelectItem value="low">LOW</SelectItem>
									</SelectContent>
								</Select>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-40 bg-slate-800/50 border-slate-600/50 text-white font-mono">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent className="bg-slate-800 border-slate-600">
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value="ACTIVE">ACTIVE</SelectItem>
										<SelectItem value="acknowledged">INVESTIGATING</SelectItem>
										<SelectItem value="completed">RESOLVED</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Enhanced Tabs */}
				<Tabs
					defaultValue="ACTIVE"
					className="space-y-6 animate-slide-up"
					style={{ animationDelay: "0.5s" }}>
					<TabsList className="grid w-full grid-cols-4 bg-slate-900/60 border border-slate-700/50 p-1">
						<TabsTrigger
							value="ACTIVE"
							className="relative data-[state=active]:bg-red-600/30 data-[state=active]:text-red-200 font-mono">
							ACTIVE ALARMS ({activeAlarms.length})
							{activeAlarms.length > 0 && (
								<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
							)}
						</TabsTrigger>
						<TabsTrigger
							value="acknowledged"
							className="data-[state=active]:bg-yellow-600/30 data-[state=active]:text-yellow-200 font-mono">
							ACKNOWLEDGED ({acknowledgedAlarms.length})
						</TabsTrigger>
						<TabsTrigger
							value="completed"
							className="data-[state=active]:bg-green-600/30 data-[state=active]:text-green-200 font-mono">
							RESOLVED ({completedAlarms.length})
						</TabsTrigger>
						<TabsTrigger
							value="all"
							className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-200 font-mono">
							ALL INCIDENTS ({filteredAlarms.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="ACTIVE" className="space-y-4">
						{/* {criticalAlarms.length > 0 && (
							<Card className="border-4 border-red-500 bg-gradient-to-r from-red-900/60 to-red-800/40 shadow-2xl shadow-red-500/20 animate-critical-pulse">
								<CardHeader className="bg-red-900/60 border-b border-red-500/50">
									<CardTitle className="text-red-200 flex items-center text-xl font-mono">
										<AlertCircle className="h-8 w-8 mr-4 animate-pulse text-red-400" />
										⚠️ CRITICAL SECURITY BREACH DETECTED ⚠️
										<Badge className="ml-4 bg-red-600 text-white animate-pulse font-mono">
											{criticalAlarms.length} ACTIVE CRITICAL THREATS
										</Badge>
									</CardTitle>
								</CardHeader>
							</Card>
						)} */}

						<div className="grid gap-4">
							{activeAlarms.map((alarm, index) => (
								<Card
									key={alarm.id}
									className={cn(
										"border-l-4 transition-all duration-300 hover:shadow-2xl bg-slate-900/60 backdrop-blur-sm animate-slide-up",
										alarm.severity === "CRITICAL"
											? "border-l-red-500 bg-gradient-to-r from-red-900/40 to-slate-900/60 shadow-red-500/20"
											: alarm.severity === "HIGH"
											? "border-l-orange-500 bg-gradient-to-r from-orange-900/40 to-slate-900/60 shadow-orange-500/20"
											: alarm.severity === "MEDIUM"
											? "border-l-yellow-500 bg-gradient-to-r from-yellow-900/40 to-slate-900/60 shadow-yellow-500/20"
											: "border-l-green-500 bg-gradient-to-r from-green-900/40 to-slate-900/60 shadow-green-500/20"
									)}
									style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div className="relative p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
														{getStatusIcon(alarm.status, alarm.severity)}
														{alarm.severity === "CRITICAL" && (
															<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
														)}
													</div>
													<div>
														<h4 className="font-semibold text-xl text-white font-mono">
															{alarm.type}
														</h4>
														<p className="text-slate-300 flex items-center font-mono">
															<MapPin className="h-4 w-4 mr-2 text-red-400" />
															{alarm.branch.name} - {alarm.location}
														</p>
														<p className="text-slate-400 text-sm flex items-center mt-1 font-mono">
															<Calendar className="h-3 w-3 mr-2" />
															{getTimeAgo(alarm.createdAt)} • Reported by{" "}
															{alarm.createdBy.name}
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-3">
													<Badge
														className={cn(
															"text-sm px-4 py-2 font-mono font-bold",
															getSeverityColor(alarm.severity)
														)}>
														{alarm.severity.toUpperCase()}
													</Badge>
													<Badge className="bg-red-600/30 text-red-200 border border-red-500/50 font-mono">
														ACTIVE THREAT
													</Badge>
												</div>
											</div>

											<div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/50">
												<p className="text-slate-200 font-mono">
													{alarm.description}
												</p>
												{alarm.additionalNotes && (
													<p className="text-slate-400 text-sm mt-2 font-mono">
														<strong>Additional Intel:</strong>{" "}
														{alarm.additionalNotes}
													</p>
												)}
											</div>

											<div className="flex items-center space-x-3">
												<Button
													size="sm"
													onClick={() => acknowledgeAlarm(alarm.id)}
													disabled={updating}
													className={cn(
														"bg-yellow-600 hover:bg-yellow-700 text-white font-mono font-bold shadow-lg",
														alarm.severity === "CRITICAL" && "animate-pulse"
													)}>
													{updating ? (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													) : (
														<Clock className="h-4 w-4 mr-2" />
													)}
													ACKNOWLEDGE ALARM
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsDetailDialogOpen(true);
													}}
													className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
													<Eye className="h-4 w-4 mr-2" />
													TACTICAL DETAILS
												</Button>
												{/* <Button
													variant="outline"
													size="sm"
													className="border-blue-600/50 text-blue-300 hover:bg-blue-900/30 font-mono">
													<Crosshair className="h-4 w-4 mr-2" />
													DISPATCH UNIT
												</Button> */}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
							{activeAlarms.length === 0 && (
								<Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-900/40 to-slate-900/60 shadow-xl">
									<CardContent className="p-12 text-center">
										<Shield className="h-20 w-20 text-green-400 mx-auto mb-6" />
										<h3 className="text-2xl font-semibold text-green-300 mb-3 font-mono">
											ALL SYSTEMS SECURE
										</h3>
										<p className="text-green-400 font-mono">
											No active security ALARMs detected
										</p>
									</CardContent>
								</Card>
							)}
						</div>
					</TabsContent>

					{/* Similar enhanced styling for other tabs... */}
					<TabsContent value="acknowledged" className="space-y-4">
						<div className="grid gap-4">
							{acknowledgedAlarms.map((alarm, index) => (
								<Card
									key={alarm.id}
									className="border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-900/40 to-slate-900/60 shadow-xl animate-slide-up"
									style={{ animationDelay: `${index * 0.1}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
														{getStatusIcon(alarm.status)}
													</div>
													<div>
														<h4 className="font-medium text-white font-mono">
															{alarm.type}
														</h4>
														<p className="text-sm text-slate-300 flex items-center font-mono">
															<MapPin className="h-3 w-3 mr-1" />
															{alarm.branch.name} - {alarm.location}
														</p>
														<p className="text-xs text-slate-400 flex items-center mt-1 font-mono">
															<Calendar className="h-3 w-3 mr-1" />
															Under investigation for{" "}
															{alarm.acknowledgedAt
																? getTimeAgo(alarm.acknowledgedAt)
																: ""}
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<Badge className={getSeverityColor(alarm.severity)}>
														{alarm.severity}
													</Badge>
													<Badge className="bg-yellow-600/30 text-yellow-200 border border-yellow-500/50 font-mono">
														INVESTIGATING
													</Badge>
												</div>
											</div>

											<div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600/50">
												<p className="text-sm text-slate-200 font-mono">
													{alarm.description}
												</p>
											</div>

											<div className="flex items-center space-x-2">
												<Button
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsResolutionDialogOpen(true);
													}}
													disabled={updating}
													className="bg-green-600 hover:bg-green-700 font-mono">
													<CheckCircle className="h-4 w-4 mr-2" />
													MARK RESOLVED
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsDetailDialogOpen(true);
													}}
													className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
													<Eye className="h-4 w-4 mr-2" />
													VIEW DETAILS
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent value="completed" className="space-y-4">
						<div className="grid gap-4">
							{completedAlarms.map((alarm, index) => (
								<Card
									key={alarm.id}
									className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-900/40 to-slate-900/60 shadow-xl animate-slide-up"
									style={{ animationDelay: `${index * 0.1}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
														{getStatusIcon(alarm.status)}
													</div>
													<div>
														<h4 className="font-medium text-white font-mono">
															{alarm.type}
														</h4>
														<p className="text-sm text-slate-300 flex items-center font-mono">
															<MapPin className="h-3 w-3 mr-1" />
															{alarm.branch.name} - {alarm.location}
														</p>
														<p className="text-xs text-slate-400 flex items-center mt-1 font-mono">
															<Calendar className="h-3 w-3 mr-1" />
															Resolved{" "}
															{alarm.completedAt
																? getTimeAgo(alarm.completedAt)
																: ""}
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<Badge className={getSeverityColor(alarm.severity)}>
														{alarm.severity}
													</Badge>
													<Badge className="bg-green-600/30 text-green-200 border border-green-500/50 font-mono">
														RESOLVED
													</Badge>
												</div>
											</div>

											<div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600/50">
												<p className="text-sm text-slate-200 font-mono">
													{alarm.description}
												</p>
											</div>

											{alarm.resolutionDescription && (
												<div className="bg-green-900/30 p-3 rounded-lg border border-green-500/30">
													<Label className="text-sm font-medium text-green-300 font-mono">
														RESOLUTION REPORT
													</Label>
													<p className="text-sm text-green-200 mt-1 font-mono">
														{alarm.resolutionDescription}
													</p>
												</div>
											)}

											<div className="flex items-center space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsDetailDialogOpen(true);
													}}
													className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
													<Eye className="h-4 w-4 mr-2" />
													VIEW REPORT
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent value="all" className="space-y-4">
						<div className="grid gap-4">
							{filteredAlarms.map((alarm, index) => (
								<Card
									key={alarm.id}
									className={cn(
										"border-l-4 transition-all duration-300 hover:shadow-xl bg-slate-900/60 animate-slide-up",
										alarm.status === "ACTIVE" && alarm.severity === "CRITICAL"
											? "border-l-red-500 bg-gradient-to-r from-red-900/40 to-slate-900/60"
											: alarm.status === "ACTIVE"
											? "border-l-orange-500 bg-gradient-to-r from-orange-900/40 to-slate-900/60"
											: alarm.status === "ACKNOWLEDGED"
											? "border-l-yellow-500 bg-gradient-to-r from-yellow-900/40 to-slate-900/60"
											: "border-l-green-500 bg-gradient-to-r from-green-900/40 to-slate-900/60"
									)}
									style={{ animationDelay: `${index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
														{getStatusIcon(alarm.status, alarm.severity)}
													</div>
													<div>
														<h4 className="font-medium text-white font-mono">
															{alarm.type}
														</h4>
														<p className="text-sm text-slate-300 flex items-center font-mono">
															<MapPin className="h-3 w-3 mr-1" />
															{alarm.branch.name} - {alarm.location}
														</p>
														<p className="text-xs text-slate-400 flex items-center mt-1 font-mono">
															<Calendar className="h-3 w-3 mr-1" />
															{getTimeAgo(alarm.createdAt)} •{" "}
															{alarm.createdBy.name}
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<Badge className={getSeverityColor(alarm.severity)}>
														{alarm.severity}
													</Badge>
													<Badge
														className={
															alarm.status === "ACTIVE"
																? "bg-red-600/30 text-red-200 border border-red-500/50"
																: alarm.status === "ACKNOWLEDGED"
																? "bg-yellow-600/30 text-yellow-200 border border-yellow-500/50"
																: "bg-green-600/30 text-green-200 border border-green-500/50"
														}>
														{alarm.status === "ACTIVE"
															? "ACTIVE"
															: alarm.status === "ACKNOWLEDGED"
															? "INVESTIGATING"
															: "RESOLVED"}
													</Badge>
												</div>
											</div>

											<div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600/50">
												<p className="text-sm text-slate-200 font-mono">
													{alarm.description}
												</p>
											</div>

											<div className="flex items-center space-x-2">
												{alarm.status === "ACTIVE" && (
													<Button
														size="sm"
														onClick={() => acknowledgeAlarm(alarm.id)}
														disabled={updating}
														className="bg-yellow-600 hover:bg-yellow-700 text-white font-mono">
														<Clock className="h-4 w-4 mr-2" />
														ACKNOWLEDGE
													</Button>
												)}
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsDetailDialogOpen(true);
													}}
													className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
													<Eye className="h-4 w-4 mr-2" />
													VIEW DETAILS
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>
				</Tabs>

				{/* Enhanced Alarm Details Dialog */}
				<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
					<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-3 text-2xl font-mono">
								<div className="p-2 bg-red-600/20 rounded-lg border border-red-500/30">
									<AlertTriangle className="h-6 w-6 text-red-400" />
								</div>
								ALARM ANALYSIS - {selectedAlarm?.type}
							</DialogTitle>
							<DialogDescription className="text-slate-400 font-mono">
								Comprehensive security incident report and tactical information
							</DialogDescription>
						</DialogHeader>
						{selectedAlarm && (
							<div className="space-y-6 py-4">
								{/* ALARM Overview */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
														{selectedAlarm.id}
													</p>
												</div>
												<div>
													<Label className="text-sm font-medium text-slate-400 font-mono">
														ALARM TYPE
													</Label>
													<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
														{selectedAlarm.type}
													</p>
												</div>
												<div>
													<Label className="text-sm font-medium text-slate-400 font-mono">
														SEVERITY LEVEL
													</Label>
													<Badge
														className={cn(
															"text-sm font-mono",
															getSeverityColor(selectedAlarm.severity)
														)}>
														{selectedAlarm.severity.toUpperCase()}
													</Badge>
												</div>
												<div>
													<Label className="text-sm font-medium text-slate-400 font-mono">
														STATUS
													</Label>
													<Badge
														className={
															selectedAlarm.status === "ACTIVE"
																? "bg-red-600/30 text-red-200 border border-red-500/50"
																: selectedAlarm.status === "ACKNOWLEDGED"
																? "bg-yellow-600/30 text-yellow-200 border border-yellow-500/50"
																: "bg-green-600/30 text-green-200 border border-green-500/50"
														}>
														{selectedAlarm.status === "ACTIVE"
															? "ACTIVE ALARM"
															: selectedAlarm.status === "ACKNOWLEDGED"
															? "UNDER INVESTIGATION"
															: "RESOLVED"}
													</Badge>
												</div>
												<div>
													<Label className="text-sm font-medium text-slate-400 font-mono">
														REPORTING AGENT
													</Label>
													<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
														{selectedAlarm.createdBy.name}
													</p>
												</div>
												<div>
													<Label className="text-sm font-medium text-slate-400 font-mono">
														TIMESTAMP
													</Label>
													<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
														{formatDateTime(selectedAlarm.createdAt)}
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
													BRANCH
												</Label>
												<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
													<Radio className="h-4 w-4 mr-2 text-blue-400" />
													{selectedAlarm.branch.name}
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium text-slate-400 font-mono">
													SPECIFIC LOCATION
												</Label>
												<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
													<MapPin className="h-4 w-4 mr-2 text-red-400" />
													{selectedAlarm.location}
												</p>
											</div>
											{selectedAlarm.coordinates && (
												<div>
													<Label className="text-sm font-medium text-slate-400 font-mono">
														GPS COORDINATES{" "}
													</Label>
													<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
														<Crosshair className="h-4 w-4 mr-2 text-green-400" />
														{selectedAlarm.coordinates.latitude},{" "}
														{selectedAlarm.coordinates.longitude}
													</p>
												</div>
											)}
										</CardContent>
									</Card>
								</div>

								{/* Tactical Map */}
								<Card className="bg-slate-800/50 border-slate-700">
									<CardHeader>
										<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
											<Navigation className="h-5 w-5 mr-2 text-blue-400" />
											TACTICAL MAP OVERLAY
										</CardTitle>
									</CardHeader>
									<CardContent>
										<AlarmLocationMap
											coordinates={selectedAlarm.coordinates}
											location={selectedAlarm.location}
										/>
									</CardContent>
								</Card>

								{/* Incident Description */}
								<Card className="bg-slate-800/50 border-slate-700">
									<CardHeader>
										<CardTitle className="text-lg font-mono text-slate-200">
											INCIDENT REPORT
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div>
												<Label className="text-sm font-medium text-slate-400 font-mono">
													PRIMARY DESCRIPTION
												</Label>
												<div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
													<p className="text-slate-200 font-mono leading-relaxed">
														{selectedAlarm.description}
													</p>
												</div>
											</div>
											{selectedAlarm.additionalNotes && (
												<div>
													<Label className="text-sm font-medium text-slate-400 font-mono">
														ADDITIONAL INTELLIGENCE
													</Label>
													<div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
														<p className="text-slate-200 font-mono leading-relaxed">
															{selectedAlarm.additionalNotes}
														</p>
													</div>
												</div>
											)}
											{selectedAlarm.resolutionDescription && (
												<div>
													<Label className="text-sm font-medium text-green-400 font-mono">
														RESOLUTION REPORT
													</Label>
													<div className="mt-2 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
														<p className="text-green-200 font-mono leading-relaxed">
															{selectedAlarm.resolutionDescription}
														</p>
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>

								{/* Timeline */}
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
														{formatDateTime(selectedAlarm.createdAt)}
													</p>
												</div>
											</div>
											{selectedAlarm.acknowledgedAt && (
												<div className="flex items-center space-x-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
													<div className="p-2 bg-yellow-600/30 rounded-full">
														<Clock className="h-4 w-4 text-yellow-400" />
													</div>
													<div>
														<p className="text-yellow-200 font-mono font-medium">
															INVESTIGATION INITIATED
														</p>
														<p className="text-yellow-300 text-sm font-mono">
															{formatDateTime(selectedAlarm.acknowledgedAt)}
														</p>
													</div>
												</div>
											)}
											{selectedAlarm.completedAt && (
												<div className="flex items-center space-x-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
													<div className="p-2 bg-green-600/30 rounded-full">
														<CheckCircle className="h-4 w-4 text-green-400" />
													</div>
													<div>
														<p className="text-green-200 font-mono font-medium">
															ALARM NEUTRALIZED
														</p>
														<p className="text-green-300 text-sm font-mono">
															{formatDateTime(selectedAlarm.completedAt)}
														</p>
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</div>
						)}
						<div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
							<Button
								variant="outline"
								onClick={() => setIsDetailDialogOpen(false)}
								className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
								CLOSE REPORT
							</Button>
							{selectedAlarm?.status === "ACTIVE" && (
								<Button
									onClick={() => {
										setIsDetailDialogOpen(false);
										acknowledgeAlarm(selectedAlarm.id);
									}}
									className="bg-yellow-600 hover:bg-yellow-700 font-mono">
									<Clock className="h-4 w-4 mr-2" />
									ACKNOWLEDGE ALARM
								</Button>
							)}
							{selectedAlarm?.status === "ACKNOWLEDGED" && (
								<Button
									onClick={() => {
										setIsDetailDialogOpen(false);
										setIsResolutionDialogOpen(true);
									}}
									className="bg-green-600 hover:bg-green-700 font-mono">
									<CheckCircle className="h-4 w-4 mr-2" />
									MARK RESOLVED
								</Button>
							)}
						</div>
					</DialogContent>
				</Dialog>

				{/* Resolution Dialog */}
				<Dialog
					open={isResolutionDialogOpen}
					onOpenChange={setIsResolutionDialogOpen}>
					<DialogContent className="bg-slate-900 border-slate-700 text-white">
						<DialogHeader>
							<DialogTitle className="font-mono text-xl">
								COMPLETE ALARM RESOLUTION
							</DialogTitle>
							<DialogDescription className="text-slate-400 font-mono">
								Provide detailed resolution report for incident closure
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label
									htmlFor="resolution"
									className="text-slate-300 font-mono">
									RESOLUTION REPORT *
								</Label>
								<Textarea
									id="resolution"
									placeholder="Describe ALARM neutralization procedures, actions taken, and final outcome..."
									value={resolutionDescription}
									onChange={(e) => setResolutionDescription(e.target.value)}
									rows={6}
									className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 font-mono"
								/>
							</div>
						</div>
						<div className="flex justify-end space-x-3">
							<Button
								variant="outline"
								onClick={() => setIsResolutionDialogOpen(false)}
								disabled={updating}
								className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
								CANCEL
							</Button>
							<Button
								onClick={() =>
									selectedAlarm &&
									completeAlarm(selectedAlarm.id, resolutionDescription)
								}
								disabled={!resolutionDescription.trim() || updating}
								className="bg-green-600 hover:bg-green-700 font-mono">
								{updating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										PROCESSING...
									</>
								) : (
									<>
										<CheckCircle className="h-4 w-4 mr-2" />
										COMPLETE RESOLUTION
									</>
								)}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
