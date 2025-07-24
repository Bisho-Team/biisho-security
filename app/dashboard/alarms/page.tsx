"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
	DialogFooter,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertTriangle,
	Plus,
	Clock,
	CheckCircle,
	Send,
	Eye,
	Search,
	Edit,
	MoreHorizontal,
	MapPin,
	Calendar,
	Shield,
	Loader2,
	Bell,
	FileText,
	Navigation,
	Radio,
	Building,
	User,
	Mail,
} from "lucide-react";
import Link from "next/link";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useWebSocket } from "@/hooks/use-websocket";
const NEXT_PUBLIC_API_URL = "https://frt.et";

interface Alarm {
	id: string;
	alarmCode: string;
	type: string;
	location: string;
	longitude?: string;
	latitude?: string;
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	additionalNotes?: string;
	status: "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED";
	createdAt: string;
	updatedAt: string;
	companyId: string;
	branchId: string;
	createdById: string;
	branch: {
		name: string;
		locationType?: string;
		gpsAddress?: string;
		city?: string;
		subCity?: string;
		woreda?: string;
		country?: string;
		managerName?: string;
		phoneNumber?: string;
		contactNumber1?: string;
		company?: {
			name: string;
			logo: string;
		};
	};
	createdBy: {
		id: string;
		name: string;
		email?: string;
		phone?: string;
	};
	reports: Array<{
		id: string;
		status: string;
		acknowledgedAt?: string;
		completedAt?: string;
		resolutionDescription?: string;
		notes?: string;
		assignedTo?: {
			id: string;
			name: string;
			email?: string;
			phone?: string;
			company?: {
				name: string;
			};
		};
		acknowledgedBy?: {
			id: string;
			name: string;
			phone?: string;
		};
		resolvedBy?: {
			id: string;
			name: string;
			phone?: string;
		};
	}>;
	coordinates?: {
		lat: number;
		lng: number;
	};
}

// Google Maps component for alarm location
const AlarmLocationMap = ({
	coordinates,
	latitude,
	longitude,
	location,
}: {
	coordinates?: { lat: number; lng: number };
	latitude?: string;
	longitude?: string;
	location: string;
}) => {
	const mapCoords =
		coordinates ||
		(latitude && longitude
			? {
					lat: Number.parseFloat(latitude),
					lng: Number.parseFloat(longitude),
			  }
			: null);

	useEffect(() => {
		if (!mapCoords) return;

		const initMap = () => {
			const map = new (window as any).google.maps.Map(
				document.getElementById("alarm-location-map") as HTMLElement,
				{
					zoom: 16,
					center: mapCoords,
					mapTypeId: (window as any).google.maps.MapTypeId.SATELLITE,
				}
			);
			new (window as any).google.maps.Marker({
				position: mapCoords,
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
		};

		if (typeof (window as any).google === "undefined") {
			const script = document.createElement("script");
			script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&callback=initMap`;
			script.async = true;
			script.defer = true;
			(window as any).initMap = initMap;
			document.head.appendChild(script);
		} else {
			initMap();
		}
	}, [mapCoords, location]);

	if (!mapCoords) {
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
				id="alarm-location-map"
				className="h-64 w-full rounded-lg border-2 border-red-500/30 shadow-lg"
			/>
			<div className="absolute top-2 left-2 bg-black/80 text-white px-3 py-1 rounded-md text-sm font-mono">
				<Navigation className="h-3 w-3 inline mr-1" />
				{mapCoords.lat.toFixed(6)}, {mapCoords.lng.toFixed(6)}
			</div>
		</div>
	);
};

export default function EnhancedAlarmsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [mockAlarms, setMockAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [alarmHistory, setAlarmHistory] = useState<Alarm[]>([]);
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterSeverity, setFilterSeverity] = useState("all");
	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [updating, setUpdating] = useState(false);
	const { toast } = useToast();
	const { user } = useAuth();
	const [connectionStatusData, setConnectionStatusData] = useState<any>(null);

	const fetchAlarms = useCallback(async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/alarms");
			console.log("Fetched alarms__:", (response as any).alarms);

			const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
				...alarm,
				time: alarm.createdAt,
				coordinates:
					alarm.coordinates ||
					(alarm.latitude && alarm.longitude
						? {
								lat: Number.parseFloat(alarm.latitude),
								lng: Number.parseFloat(alarm.longitude),
						  }
						: undefined),
			}));

			setMockAlarms(alarmsWithCoords);
			setAlarmHistory(alarmsWithCoords);
			// setLastRefresh(new Date());
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch alarms",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [toast]);

	// const fetchAlarmsHistory = useCallback(async () => {
	// 	try {
	// 		const response = await apiService.get("/alarms");
	// 		console.log("Fetched alarm history:", response);

	// 		const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
	// 			...alarm,
	// 			time: alarm.createdAt,
	// 			coordinates:
	// 				alarm.coordinates ||
	// 				(alarm.latitude && alarm.longitude
	// 					? {
	// 							lat: Number.parseFloat(alarm.latitude),
	// 							lng: Number.parseFloat(alarm.longitude),
	// 					  }
	// 					: undefined),
	// 		}));

	// 		setAlarmHistory(alarmsWithCoords);
	// 	} catch (error) {
	// 		toast({
	// 			title: "Error",
	// 			description: "Failed to fetch alarm history",
	// 			variant: "destructive",
	// 		});
	// 	}
	// }, [toast]);

	const token =
		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

	// WebSocket connection with enhanced debugging
	const { isConnected, connect, disconnect } = useWebSocket(token, {
		autoConnect: true,
		onAlarmCreated: (alarm) => {
			console.log("🚨 NEW ALARM CREATED via WebSocket:", alarm);

			// Refresh alarms data when new alarm is created
			fetchAlarms();
			// fetchAlarmsHistory();

			toast({
				title: "🚨 New Alarm Created",
				description: `${alarm.type} at ${alarm.location}`,
				variant: "destructive",
			});
		},
		onAlarmUpdated: async (alarm) => {
			console.log("🔄 ALARM UPDATED via WebSocket:", alarm);
			console.log("🔄 Full alarm object:", JSON.stringify(alarm, null, 2));

			// Refresh alarms data when alarm is updated
			fetchAlarms();

			toast({
				title: "🔄 Alarm Updated",
				description: `${alarm.type} status changed to ${alarm.status}`,
			});
		},
		onConnectionStatusUpdate: (data) => {
			console.log("📊 CONNECTION STATUS UPDATE:", data);
			setConnectionStatusData(data);

			// Update the police status card
			if ((window as any).updatePoliceStatus) {
				(window as any).updatePoliceStatus(data);
			}
		},
		onConnectionEstablished: (userInfo) => {
			console.log("🎉 CONNECTION ESTABLISHED:", userInfo);

			toast({
				title: "Connected",
				description: "Real-time connection established",
			});
		},
		onError: (error) => {
			console.error("❌ WEBSOCKET ERROR:", error);

			toast({
				title: "Connection Error",
				description: "WebSocket connection failed",
				variant: "destructive",
			});
		},
		onClose: (event) => {
			console.log("🔌 WEBSOCKET CLOSED:", event);

			if (event.code !== 1000) {
				toast({
					title: "Connection Lost",
					description: "Attempting to reconnect...",
					variant: "destructive",
				});
			}
		},
	});

	useEffect(() => {
		fetchAlarms();
	}, [fetchAlarms]);

	// Add debug logging for connection status
	// useEffect(() => {
	// 	console.log("🔍 WebSocket Connection Status:", isConnected);
	// 	console.log("🔍 Auth Token:", token ? "Present" : "Missing");
	// 	console.log("🔍 Debug Info:", wsDebugInfo);
	// }, [isConnected, token, wsDebugInfo]);

	// const fetchAlarms = async () => {
	// 	try {
	// 		setLoading(true);
	// 		const response = await apiService.get("/alarms");
	// 		console.log("Fetched alarms:", response);

	// 		const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
	// 			...alarm,
	// 			time: alarm.createdAt,
	// 			coordinates:
	// 				alarm.coordinates ||
	// 				(alarm.latitude && alarm.longitude
	// 					? {
	// 							lat: Number.parseFloat(alarm.latitude),
	// 							lng: Number.parseFloat(alarm.longitude),
	// 					  }
	// 					: undefined),
	// 		}));

	// 		setMockAlarms(alarmsWithCoords);
	// 	} catch (error) {
	// 		toast({
	// 			title: "Error",
	// 			description: "Failed to fetch alarms",
	// 			variant: "destructive",
	// 		});
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

	// const fetchAlarmsHistory = async () => {
	// 	try {
	// 		const response = await apiService.get("/alarms");
	// 		console.log("Fetched alarm history:", response);

	// 		// Add mock coordinates for demo purposes
	// 		const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
	// 			...alarm,
	// 			time: alarm.createdAt,
	// 			coordinates:
	// 				alarm.coordinates ||
	// 				(alarm.latitude && alarm.longitude
	// 					? {
	// 							lat: Number.parseFloat(alarm.latitude),
	// 							lng: Number.parseFloat(alarm.longitude),
	// 					  }
	// 					: undefined),
	// 		}));

	// 		setAlarmHistory(alarmsWithCoords);
	// 	} catch (error) {
	// 		toast({
	// 			title: "Error",
	// 			description: "Failed to fetch alarm history",
	// 			variant: "destructive",
	// 		});
	// 	}
	// };

	// WebSocket integration with automatic data refresh

	// const fetchAlarms = useCallback(async () => {
	// 	try {
	// 		setLoading(true);
	// 		const response = await apiService.get("/alarms");
	// 		console.log("Fetched alarms:", response);

	// 		const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
	// 			...alarm,
	// 			time: alarm.createdAt,
	// 			coordinates:
	// 				alarm.coordinates ||
	// 				(alarm.latitude && alarm.longitude
	// 					? {
	// 							lat: Number.parseFloat(alarm.latitude),
	// 							lng: Number.parseFloat(alarm.longitude),
	// 					  }
	// 					: undefined),
	// 		}));

	// 		setMockAlarms(alarmsWithCoords);
	// 		// setLastRefresh(new Date());
	// 	} catch (error) {
	// 		toast({
	// 			title: "Error",
	// 			description: "Failed to fetch alarms",
	// 			variant: "destructive",
	// 		});
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// }, [toast]);

	// const fetchAlarmsHistory = useCallback(async () => {
	// 	try {
	// 		const response = await apiService.get("/alarms");
	// 		console.log("Fetched alarm history:", response);

	// 		const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
	// 			...alarm,
	// 			time: alarm.createdAt,
	// 			coordinates:
	// 				alarm.coordinates ||
	// 				(alarm.latitude && alarm.longitude
	// 					? {
	// 							lat: Number.parseFloat(alarm.latitude),
	// 							lng: Number.parseFloat(alarm.longitude),
	// 					  }
	// 					: undefined),
	// 		}));

	// 		setAlarmHistory(alarmsWithCoords);
	// 	} catch (error) {
	// 		toast({
	// 			title: "Error",
	// 			description: "Failed to fetch alarm history",
	// 			variant: "destructive",
	// 		});
	// 	}
	// }, [toast]);

	// const token =
	// 	typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

	const handleUpdateAlarm = async () => {
		if (!selectedAlarm) return;

		try {
			setUpdating(true);
			await apiService.put(`/alarms/${selectedAlarm.id}`, {
				status: selectedAlarm.status,
				severity: selectedAlarm.severity,
				dispatchedTo: selectedAlarm.reports[0].assignedTo?.id,
				description: selectedAlarm.description,
			});

			toast({
				title: "Success",
				description: "Alarm updated successfully",
			});

			setIsEditDialogOpen(false);
			setSelectedAlarm(null);
			fetchAlarms();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.message || "Failed to update alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity?.toUpperCase()) {
			case "CRITICAL":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md";
			case "HIGH":
				return "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-md";
			case "MEDIUM":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-md";
			case "LOW":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-md";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "ACKNOWLEDGED":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "RESOLVED":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md";
			case "ACKNOWLEDGED":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-md";
			case "RESOLVED":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-md";
		}
	};

	const formatTimeAgo = (timestamp: string) => {
		if (!timestamp) return "Unknown";

		const now = new Date();
		const time = new Date(timestamp);

		// Check if the date is valid
		if (isNaN(time.getTime())) return "Invalid date";

		const diffInMinutes = Math.floor(
			(now.getTime() - time.getTime()) / (1000 * 60)
		);

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	const formatDateTime = (timestamp: string) => {
		if (!timestamp) return "Unknown";
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) return "Invalid date";

		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const activeAlarms = mockAlarms.filter(
		(alarm) => alarm.status !== "RESOLVED"
	);

	const resolvedAlarms = alarmHistory.filter(
		(alarm) => alarm.status === "RESOLVED"
	);

	const filteredActiveAlarms = activeAlarms.filter((alarm) => {
		const matchesSearch =
			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			filterStatus === "all" || alarm.status === filterStatus;
		const matchesSeverity =
			filterSeverity === "all" || alarm.severity === filterSeverity;
		return matchesSearch && matchesStatus && matchesSeverity;
	});

	const filteredResolvedAlarms = resolvedAlarms.filter((alarm) => {
		const matchesSearch =
			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center space-y-4 animate-fade-in">
					<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
					<p className="text-muted-foreground">Loading alarms...</p>
				</div>
			</div>
		);
	}

	// const formatDateTime = (dateString: string) => {
	// 	const date = new Date(dateString);
	// 	return date.toLocaleDateString("en-US", {
	// 		year: "numeric",
	// 		month: "short",
	// 		day: "numeric",
	// 		hour: "numeric",
	// 		minute: "2-digit",
	// 		hour12: true,
	// 	});
	// };

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex justify-between items-center animate-slide-up">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
						Alarm Management
					</h1>
					<p className="text-muted-foreground mt-2">
						Monitor and manage security alarms across all locations
					</p>
				</div>
				{user?.role !== "SUPER_ADMIN" && (
					<Link href="/dashboard/configure-alarm">
						<Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200">
							<Plus className="h-4 w-4 mr-2" />
							Configure New Alarm
						</Button>
					</Link>
				)}
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card
					className="animate-slide-up glass hover:shadow-lg transition-all duration-300"
					style={{ animationDelay: "0.1s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
						<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
							<AlertTriangle className="h-4 w-4 text-red-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{mockAlarms.filter((a) => a.status === "ACTIVE").length}
						</div>
						<div className="flex justify-between items-center">
							<p className="text-xs text-muted-foreground">
								Require immediate attention
							</p>
							{mockAlarms.filter((a) => a.status === "ACTIVE").length > 0 && (
								<span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
							)}
						</div>
					</CardContent>
				</Card>

				<Card
					className="animate-slide-up glass hover:shadow-lg transition-all duration-300"
					style={{ animationDelay: "0.3s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
						<div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
							<Clock className="h-4 w-4 text-yellow-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{mockAlarms.filter((a) => a.status === "ACKNOWLEDGED").length}
						</div>
						<div className="flex justify-between items-center">
							<p className="text-xs text-muted-foreground">Being handled</p>
							{mockAlarms.filter((a) => a.status === "ACKNOWLEDGED").length >
								0 && (
								<span className="h-2 w-2 rounded-full bg-yellow-500"></span>
							)}
						</div>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass hover:shadow-lg transition-all duration-300"
					style={{ animationDelay: "0.4s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Resolved Today
						</CardTitle>
						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
							<CheckCircle className="h-4 w-4 text-green-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{mockAlarms.filter((a) => a.status === "RESOLVED").length}
						</div>
						<div className="flex justify-between items-center">
							<p className="text-xs text-muted-foreground">
								Successfully handled
							</p>
							{mockAlarms.filter((a) => a.status === "RESOLVED").length > 0 && (
								<span className="h-2 w-2 rounded-full bg-green-500"></span>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Alarm Management Tabs */}
			<Tabs
				defaultValue="active"
				className="space-y-4 animate-slide-up"
				style={{ animationDelay: "0.5s" }}>
				<div className="flex justify-between items-center">
					<TabsList className="glass">
						<TabsTrigger value="active" className="relative">
							Active Alarms
							{activeAlarms.length > 0 && (
								<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
									{activeAlarms.length}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value="history" className="relative">
							Alarm History
							{resolvedAlarms.length > 0 && (
								<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
									{resolvedAlarms.length}
								</span>
							)}
						</TabsTrigger>
					</TabsList>
					<div className="flex space-x-2">
						<div className="relative">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search alarms..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 w-64 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
							/>
						</div>
						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="ACTIVE">Active</SelectItem>
								<SelectItem value="RESOLVED">Resolved</SelectItem>
								<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<TabsContent value="active" className="space-y-4">
					{filteredActiveAlarms.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="p-4 rounded-full bg-muted/30 mb-4">
								<Bell className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-medium">No active alarms</h3>
							<p className="text-muted-foreground mt-1">
								All security systems are operating normally
							</p>
						</div>
					) : (
						<div className="grid gap-4">
							{filteredActiveAlarms.map((alarm, index) => (
								<Card
									key={alarm.id}
									className={cn(
										"animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20",
										alarm.status === "ACTIVE" &&
											alarm.severity === "CRITICAL" &&
											"border-l-4 border-l-red-500"
									)}
									style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												{alarm.branch?.company?.logo ? (
													<Image
														src={`${NEXT_PUBLIC_API_URL}${alarm.branch?.company?.logo.replace(
															"/var/www/html/koppa-security-api",
															""
														)}`}
														width={20}
														height={20}
														alt={`${alarm.branch?.company?.name} logo`}
														className="h-14 w-14 object-cover rounded-xl shadow-lg border border-border"
													/>
												) : (
													<div
														className={cn(
															"p-3 rounded-lg",
															alarm.status === "ACTIVE"
																? "bg-red-100 dark:bg-red-900/20"
																: alarm.status === "ACKNOWLEDGED"
																? "bg-blue-100 dark:bg-blue-900/20"
																: "bg-yellow-100 dark:bg-yellow-900/20"
														)}>
														{getStatusIcon(alarm.status)}
													</div>
												)}

												<div className="space-y-1">
													<h4 className="font-semibold text-lg">
														{alarm.type}
													</h4>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Building className="h-3 w-3" />
														<span>{alarm.branch?.company?.name}</span>
													</div>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<MapPin className="h-3 w-3" />
														<span>{alarm.branch.name}</span>
													</div>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<Clock className="h-3 w-3" />
														<span>{formatTimeAgo(alarm.createdAt)}</span>
													</div>
													{alarm.reports?.[0]?.assignedTo && (
														<div className="flex items-center gap-2 text-sm">
															<Shield className="h-3 w-3 text-blue-500" />
															<span className="text-blue-600 dark:text-blue-400">
																{alarm.reports[0].assignedTo.name}
															</span>
														</div>
													)}
												</div>
											</div>
											<div className="flex items-center space-x-3">
												<div className="text-left space-y-2">
													<div className="">
														<Badge
															className={cn(
																"text-xs font-medium shadow-sm",
																getStatusColor(alarm.status)
															)}>
															{alarm.status}
														</Badge>
													</div>

													{alarm?.updatedAt && (
														<p className="text-xs text-muted-foreground">
															{formatDateTime(alarm.updatedAt)}
														</p>
													)}
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															className="h-8 w-8 p-0">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="glass">
														<DropdownMenuItem
															className="cursor-pointer"
															onClick={() => {
																setSelectedAlarm(alarm);
																setIsViewDialogOpen(true);
															}}>
															<Eye className="h-4 w-4 mr-2" />
															View Details
														</DropdownMenuItem>
														<DropdownMenuItem
															className="cursor-pointer"
															onClick={() => {
																setSelectedAlarm(alarm);
																setIsEditDialogOpen(true);
															}}>
															<Edit className="h-4 w-4 mr-2" />
															Edit Alarm
														</DropdownMenuItem>
														<DropdownMenuItem className="cursor-pointer">
															<Send className="h-4 w-4 mr-2" />
															Dispatch
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					{filteredResolvedAlarms.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="p-4 rounded-full bg-muted/30 mb-4">
								<FileText className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-medium">No alarm history</h3>
							<p className="text-muted-foreground mt-1">
								No resolved alarms found in the system
							</p>
						</div>
					) : (
						<div className="grid gap-4">
							{filteredResolvedAlarms.map((alarm, index) => (
								<Card
									key={alarm.id}
									className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20 border-l-4 border-l-green-500"
									style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
													<CheckCircle className="h-4 w-4 text-green-500" />
												</div>
												<div className="space-y-1">
													<h4 className="font-semibold text-lg">
														{alarm.type}
													</h4>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Building className="h-3 w-3" />
														<span>{alarm.branch?.company?.name}</span>
													</div>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<MapPin className="h-3 w-3" />
														<span>
															{alarm.location} • {alarm.branch.name}
														</span>
													</div>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<Clock className="h-3 w-3" />
														<span>{formatTimeAgo(alarm.createdAt)}</span>
													</div>
													{alarm.reports?.[0]?.assignedTo && (
														<div className="flex items-center gap-2 text-sm">
															<Shield className="h-3 w-3 text-blue-500" />
															<span className="text-blue-600 dark:text-blue-400">
																{alarm.reports[0].assignedTo.name}
															</span>
														</div>
													)}
												</div>
											</div>
											<div className="flex items-center space-x-3">
												<div className="text-right space-y-2">
													<div className="flex gap-2">
														<Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md text-xs font-medium">
															RESOLVED
														</Badge>
													</div>
													{alarm.updatedAt && (
														<p className="text-xs text-green-600 font-medium">
															{formatDateTime(alarm.updatedAt)}{" "}
														</p>
													)}
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsViewDialogOpen(true);
													}}
													className="hover:bg-green-50 dark:hover:bg-green-900/20">
													<Eye className="h-4 w-4 mr-2" />
													View Report
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Alarm Details Dialog */}

			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3 text-2xl font-mono">
							<div className="p-2 bg-red-600/20 rounded-lg border border-red-500/30">
								<AlertTriangle className="h-6 w-6 text-red-400" />
							</div>
							{selectedAlarm?.type}
						</DialogTitle>
						<DialogDescription className="text-slate-400 font-mono">
							Comprehensive security incident report
						</DialogDescription>
					</DialogHeader>

					{selectedAlarm && (
						<div className="space-y-6 py-4">
							{/* ALARM Overview */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<Card className="bg-slate-800/50 border-slate-700">
									<CardHeader>
										<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
											<FileText className="h-5 w-5 mr-2 text-blue-400" />
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
													{selectedAlarm?.alarmCode}
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
													STATUS
												</Label>
												<Badge
													className={
														selectedAlarm.status === "ACTIVE"
															? "bg-red-600/30 text-red-200 border border-red-500/50"
															: selectedAlarm.status === "ACKNOWLEDGED"
															? "bg-yellow-600/30 text-yellow-200 border border-yellow-500/50"
															: selectedAlarm.status === "RESOLVED"
															? "bg-green-600/30 text-green-200 border border-green-500/50"
															: "bg-green-600/30 text-green-200 border border-green-500/50"
													}>
													{selectedAlarm.status === "ACTIVE"
														? "ACTIVE ALARM"
														: selectedAlarm.status === "ACKNOWLEDGED"
														? "ACKNOWLEDGED"
														: selectedAlarm.status === "RESOLVED"
														? "RESOLVED"
														: "RESOLVED"}
												</Badge>
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

										{/* Enhanced Alarm Created */}
										<div className="flex items-start space-x-4 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
											<div className="p-2 bg-red-600/30 rounded-full">
												<AlertTriangle className="h-4 w-4 text-red-400" />
											</div>
											<div className="flex-1">
												<p className="text-red-200 font-mono font-medium">
													ALARM CREATED
												</p>
												<p className="text-red-300 text-sm font-mono">
													{formatDateTime(selectedAlarm.createdAt)}
												</p>
												{selectedAlarm.createdBy && (
													<div className="space-y-1 mt-2">
														<div className="flex items-center">
															<User className="h-3 w-3 text-blue-400 mr-1" />
															<span className="text-blue-300 text-xs font-mono">
																Operator: {selectedAlarm.createdBy.name}
															</span>
														</div>
														<div className="flex items-center">
															<Mail className="h-3 w-3 text-blue-400 mr-1" />
															<span className="text-blue-300 text-xs font-mono">
																Email: {selectedAlarm.createdBy.email}
															</span>
														</div>
														<div className="flex items-center">
															<Mail className="h-3 w-3 text-blue-400 mr-1" />
															<span className="text-blue-300 text-xs font-mono">
																Phone: {selectedAlarm.createdBy.phone || "N/A"}
															</span>
														</div>
													</div>
												)}
											</div>
										</div>

										{/* Enhanced Alarm Assigned */}
										{selectedAlarm.reports?.[0]?.assignedTo && (
											<div className="flex items-start space-x-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
												<div className="p-2 bg-blue-600/30 rounded-full">
													<Send className="h-4 w-4 text-blue-400" />
												</div>
												<div className="flex-1">
													<p className="text-blue-200 font-mono font-medium">
														ASSIGNED TO{" "}
														{selectedAlarm.reports[0].assignedTo.company?.name?.toUpperCase() ||
															"POLICE"}
													</p>
													<p className="text-blue-300 text-sm font-mono">
														{formatDateTime(selectedAlarm.createdAt)}
													</p>
													<div className="space-y-1 mt-2">
														<div className="flex items-center">
															<Building className="h-3 w-3 text-yellow-400 mr-1" />
															<span className="text-yellow-300 text-xs font-mono">
																Company:{" "}
																{selectedAlarm.reports[0].assignedTo.company
																	?.name || "N/A"}
															</span>
														</div>
														<div className="flex items-center">
															<User className="h-3 w-3 text-yellow-400 mr-1" />
															<span className="text-yellow-300 text-xs font-mono">
																Contact Person:{" "}
																{selectedAlarm.reports[0].assignedTo.name}
															</span>
														</div>
														<div className="flex items-center">
															<User className="h-3 w-3 text-yellow-400 mr-1" />
															<span className="text-yellow-300 text-xs font-mono">
																Contact Phone:{" "}
																{selectedAlarm.reports[0].assignedTo.phone}
															</span>
														</div>
													</div>
												</div>
											</div>
										)}

										{/* Enhanced Alarm Acknowledged */}
										{selectedAlarm.reports?.[0]?.acknowledgedAt && (
											<div className="flex items-start space-x-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
												<div className="p-2 bg-yellow-600/30 rounded-full">
													<Clock className="h-4 w-4 text-yellow-400" />
												</div>
												<div className="flex-1">
													<p className="text-yellow-200 font-mono font-medium">
														ALARM ACKNOWLEDGED
													</p>
													<p className="text-yellow-300 text-sm font-mono">
														{formatDateTime(
															selectedAlarm.reports[0].acknowledgedAt
														)}
													</p>
													{selectedAlarm.reports[0].acknowledgedBy && (
														<div className="space-y-1 mt-2">
															<div className="flex items-center">
																<User className="h-3 w-3 text-green-400 mr-1" />
																<span className="text-green-300 text-xs font-mono">
																	Acknowledged by:{" "}
																	{selectedAlarm.reports[0].acknowledgedBy.name}
																</span>
															</div>
															<div className="flex items-center">
																<User className="h-3 w-3 text-green-400 mr-1" />
																<span className="text-green-300 text-xs font-mono">
																	Phone:{" "}
																	{selectedAlarm.reports[0].acknowledgedBy
																		.phone || "N/A"}
																</span>
															</div>
															{selectedAlarm.reports[0].assignedTo?.company
																?.name && (
																<div className="flex items-center">
																	<Building className="h-3 w-3 text-green-400 mr-1" />
																	<span className="text-green-300 text-xs font-mono">
																		Company:{" "}
																		{
																			selectedAlarm.reports[0].assignedTo
																				.company.name
																		}
																	</span>
																</div>
															)}
														</div>
													)}
												</div>
											</div>
										)}

										{/* Enhanced Alarm Resolved */}
										{selectedAlarm.reports?.[0]?.completedAt && (
											<div className="flex items-start space-x-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
												<div className="p-2 bg-green-600/30 rounded-full">
													<CheckCircle className="h-4 w-4 text-green-400" />
												</div>
												<div className="flex-1">
													<p className="text-green-200 font-mono font-medium">
														ALARM RESOLVED
													</p>
													<p className="text-green-300 text-sm font-mono">
														{formatDateTime(
															selectedAlarm.reports[0].completedAt
														)}
													</p>
													{selectedAlarm.reports[0].resolvedBy && (
														<div className="space-y-1 mt-2">
															<div className="flex items-center">
																<User className="h-3 w-3 text-purple-400 mr-1" />
																<span className="text-purple-300 text-xs font-mono">
																	Resolved by:{" "}
																	{selectedAlarm.reports[0].resolvedBy.name}
																</span>
															</div>
															<div className="flex items-center">
																<User className="h-3 w-3 text-purple-400 mr-1" />
																<span className="text-purple-300 text-xs font-mono">
																	Phone:{" "}
																	{selectedAlarm.reports[0].resolvedBy.phone ||
																		"N/A"}
																</span>
															</div>
															{selectedAlarm.reports[0].assignedTo?.company
																?.name && (
																<div className="flex items-center">
																	<Building className="h-3 w-3 text-purple-400 mr-1" />
																	<span className="text-purple-300 text-xs font-mono">
																		Company:{" "}
																		{
																			selectedAlarm.reports[0].assignedTo
																				.company.name
																		}
																	</span>
																</div>
															)}
														</div>
													)}
													{selectedAlarm.reports[0].resolutionDescription && (
														<div className="mt-2 p-2 bg-green-900/30 rounded border border-green-500/20">
															<p className="text-green-200 text-xs font-mono">
																<strong>Resolution Details:</strong>{" "}
																{selectedAlarm.reports[0].resolutionDescription}
															</p>
														</div>
													)}
												</div>
											</div>
										)}
									</CardContent>
								</Card>

								<Card className="bg-slate-800/50 border-slate-700">
									<CardHeader>
										<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
											<MapPin className="h-5 w-5 mr-2 text-red-400" />
											LOCATION
										</CardTitle>
									</CardHeader>
									<CardContent className="grid grid-cols-2 gap-3">
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Location Name
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<Radio className="h-4 w-4 mr-2 text-blue-400" />
												{selectedAlarm.branch.name}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Location Type
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<MapPin className="h-4 w-4 mr-2 text-red-400" />
												{selectedAlarm.branch.locationType || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Address
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<MapPin className="h-4 w-4 mr-2 text-red-400" />
												{selectedAlarm.branch.gpsAddress || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												City
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<MapPin className="h-4 w-4 mr-2 text-red-400" />
												{selectedAlarm.branch.city || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Sub City
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<MapPin className="h-4 w-4 mr-2 text-red-400" />
												{selectedAlarm.branch.subCity || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Woreda
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<MapPin className="h-4 w-4 mr-2 text-red-400" />
												{selectedAlarm.branch.woreda || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Manager Name
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<Shield className="h-4 w-4 mr-2 text-green-400" />
												{selectedAlarm.branch.managerName || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Phone Number
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<Bell className="h-4 w-4 mr-2 text-green-400" />
												{selectedAlarm.branch.phoneNumber || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Contact Number
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<Bell className="h-4 w-4 mr-2 text-green-400" />
												{selectedAlarm.branch.contactNumber1 || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												Company Name
											</Label>
											<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
												<Shield className="h-4 w-4 mr-2 text-green-400" />
												{selectedAlarm.branch.company?.name || "N/A"}
											</p>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Tactical Map */}
							<Card className="bg-slate-800/50 border-slate-700">
								{" "}
								<CardHeader>
									{" "}
									<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
										{" "}
										<Navigation className="h-5 w-5 mr-2 text-blue-400" /> MAP{" "}
									</CardTitle>{" "}
								</CardHeader>{" "}
								<CardContent>
									{" "}
									<AlarmLocationMap
										coordinates={selectedAlarm.coordinates}
										latitude={selectedAlarm.latitude}
										longitude={selectedAlarm.longitude}
										location={selectedAlarm.location}
									/>{" "}
								</CardContent>{" "}
							</Card>

							{/* Enhanced Incident Description */}
							<Card className="bg-slate-800/50 border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
										<FileText className="h-5 w-5 mr-2 text-yellow-400" />
										INCIDENT REPORT
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{/* Incident Description */}
										<div>
											<Label className="text-sm font-medium text-slate-400 font-mono">
												INCIDENT DESCRIPTION
											</Label>
											<div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
												<p className="text-white font-mono leading-relaxed">
													{selectedAlarm.description ||
														"No description provided"}
												</p>
											</div>
										</div>

										{/* Additional Notes */}
										{selectedAlarm.additionalNotes && (
											<div>
												<Label className="text-sm font-medium text-slate-400 font-mono">
													ADDITIONAL NOTES
												</Label>
												<div className="mt-2 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
													<p className="text-white font-mono leading-relaxed">
														{selectedAlarm.additionalNotes}
													</p>
												</div>
											</div>
										)}

										{/* Resolution Report */}
										{selectedAlarm.reports?.[0]?.resolutionDescription && (
											<div>
												<Label className="text-sm font-medium text-green-400 font-mono">
													RESOLUTION REPORT
												</Label>
												<div className="mt-2 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
													<p className="text-green-200 font-mono leading-relaxed">
														{selectedAlarm.reports[0].resolutionDescription}
													</p>
												</div>
											</div>
										)}

										{/* Fallback Resolution for older format */}
										{selectedAlarm.status === "RESOLVED" &&
											!selectedAlarm.reports?.[0]?.resolutionDescription && (
												<div>
													<Label className="text-sm font-medium text-green-400 font-mono">
														RESOLUTION REPORT
													</Label>
													<div className="mt-2 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
														<p className="text-green-200 font-mono leading-relaxed">
															Alarm successfully resolved. No further action
															required.
														</p>
													</div>
												</div>
											)}
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					<DialogFooter className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
						<Button
							variant="outline"
							onClick={() => setIsViewDialogOpen(false)}
							className="border-slate-600 text-slate-200 hover:bg-slate-800 font-mono">
							CLOSE REPORT
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Alarm Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[600px] glass">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5 text-primary" />
							Edit Alarm
						</DialogTitle>
						<DialogDescription>
							Update alarm information and status
						</DialogDescription>
					</DialogHeader>
					{selectedAlarm && (
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editStatus">Status</Label>
									<Select
										value={selectedAlarm.status}
										onValueChange={(
											value: "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED"
										) => setSelectedAlarm({ ...selectedAlarm, status: value })}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ACTIVE">Active</SelectItem>

											<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
											<SelectItem value="RESOLVED">Resolved</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="editDispatchedTo">Dispatched To</Label>
								<Input
									id="editDispatchedTo"
									value={selectedAlarm.reports[0].assignedTo?.id || ""}
									onChange={(e) =>
										setSelectedAlarm({
											...selectedAlarm,
											dispatchedTo: e.target.value,
										} as any)
									}
									placeholder="Officer name or unit"
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="editDescription">Description/Notes</Label>
								<Textarea
									id="editDescription"
									value={selectedAlarm.description || ""}
									onChange={(e) =>
										setSelectedAlarm({
											...selectedAlarm,
											description: e.target.value,
										})
									}
									placeholder="Additional notes or description..."
									rows={3}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>
					)}
					<DialogFooter className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
							disabled={updating}>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateAlarm}
							disabled={updating}
							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
							{updating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								"Update Alarm"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
