"use client";

import { useEffect, useState } from "react";
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
	Crosshair,
	Navigation,
	Radio,
	Timer,
	BarChart4,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Alarm {
	id: string;
	type: string;
	location: string;
	branch: {
		id: string;
		name: string;
	};
	status: "ACTIVE" | "DISPATCHED" | "RESOLVED" | "ACKNOWLEDGED";
	time: string;
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	dispatchedTo: string;
	reports: {
		assignedTo: {
			id: string;
			name: string;
		};
	}[];
	resolvedTime?: string;
	description?: string;
	createdAt?: string;
	updatedAt?: string;
	responseTime?: string;
	priority?: number;
	coordinates?: {
		lat: number;
		lng: number;
	};
}

// Google Maps component for alarm location
const AlarmLocationMap = ({
	coordinates,
	location,
}: {
	coordinates?: { lat: number; lng: number };
	location: string;
}) => {
	useEffect(() => {
		if (!coordinates) return;

		// Initialize Google Map
		const initMap = () => {
			const map = new (window as any).google.maps.Map(
				document.getElementById("alarm-location-map") as HTMLElement,
				{
					zoom: 16,
					center: coordinates,
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
				position: coordinates,
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

			// Add danger zone circle
			new (window as any).google.maps.Circle({
				strokeColor: "#ef4444",
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: "#ef4444",
				fillOpacity: 0.15,
				map: map,
				center: coordinates,
				radius: 100, // 100 meter radius
			});
		};

		// Load Google Maps API if not already loaded
		if (typeof (window as any).google === "undefined") {
			const script = document.createElement("script");
			script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`;
			script.async = true;
			script.defer = true;
			(window as any).initMap = initMap;
			document.head.appendChild(script);
		} else {
			initMap();
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
				id="alarm-location-map"
				className="h-64 w-full rounded-lg border-2 border-red-500/30 shadow-lg"
			/>
			<div className="absolute top-2 left-2 bg-black/80 text-white px-3 py-1 rounded-md text-sm font-mono">
				<Navigation className="h-3 w-3 inline mr-1" />
				{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
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
	const [showMap, setShowMap] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		fetchAlarms();
		fetchAlarmsHistory();
	}, []);

	const fetchAlarms = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/alarms");
			console.log("Fetched alarms:", response);

			// Add mock coordinates for demo purposes
			const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
				...alarm,
				coordinates: {
					lat: 9.0192 + (Math.random() - 0.5) * 0.1, // Random coordinates near Addis Ababa
					lng: 38.7525 + (Math.random() - 0.5) * 0.1,
				},
			}));

			setMockAlarms(alarmsWithCoords);
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

	const fetchAlarmsHistory = async () => {
		try {
			const response = await apiService.get("/alarms");
			console.log("Fetched alarm history:", response);

			// Add mock coordinates for demo purposes
			const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
				...alarm,
				coordinates: {
					lat: 9.0192 + (Math.random() - 0.5) * 0.1, // Random coordinates near Addis Ababa
					lng: 38.7525 + (Math.random() - 0.5) * 0.1,
				},
			}));

			setAlarmHistory(alarmsWithCoords);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch alarm history",
				variant: "destructive",
			});
		}
	};

	const handleUpdateAlarm = async () => {
		if (!selectedAlarm) return;

		try {
			setUpdating(true);
			await apiService.put(`/alarms/${selectedAlarm.id}`, {
				status: selectedAlarm.status,
				severity: selectedAlarm.severity,
				dispatchedTo: selectedAlarm.dispatchedTo,
				description: selectedAlarm.description,
			});

			toast({
				title: "Success",
				description: "Alarm updated successfully",
			});

			setIsEditDialogOpen(false);
			setSelectedAlarm(null);
			fetchAlarms();
			fetchAlarmsHistory();
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
			case "DISPATCHED":
				return <Send className="h-4 w-4 text-blue-500" />;
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
			case "DISPATCHED":
				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md";
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

		// Check if the date is valid
		if (isNaN(date.getTime())) return "Invalid date";

		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
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

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex justify-between items-center animate-slide-up">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
						Alarm Management
					</h1>
					<p className="text-muted-foreground mt-2">
						Monitor and manage security alarms across all branches
					</p>
				</div>
				<Link href="/dashboard/configure-alarm">
					<Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200">
						<Plus className="h-4 w-4 mr-2" />
						Configure New Alarm
					</Button>
				</Link>
			</div>

			{/* Enhanced Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
					style={{ animationDelay: "0.2s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Dispatched</CardTitle>
						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
							<Send className="h-4 w-4 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{mockAlarms.filter((a) => a.status === "DISPATCHED").length}
						</div>
						<div className="flex justify-between items-center">
							<p className="text-xs text-muted-foreground">
								Security team dispatched
							</p>
							{mockAlarms.filter((a) => a.status === "DISPATCHED").length >
								0 && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
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

			{/* Enhanced Alarm Management Tabs */}
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
								<SelectItem value="DISPATCHED">Dispatched</SelectItem>
								<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
							</SelectContent>
						</Select>
						<Select value={filterSeverity} onValueChange={setFilterSeverity}>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Severity" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Severity</SelectItem>
								<SelectItem value="CRITICAL">Critical</SelectItem>
								<SelectItem value="HIGH">High</SelectItem>
								<SelectItem value="MEDIUM">Medium</SelectItem>
								<SelectItem value="LOW">Low</SelectItem>
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
												<div
													className={cn(
														"p-3 rounded-lg",
														alarm.status === "ACTIVE"
															? "bg-red-100 dark:bg-red-900/20"
															: alarm.status === "DISPATCHED"
															? "bg-blue-100 dark:bg-blue-900/20"
															: "bg-yellow-100 dark:bg-yellow-900/20"
													)}>
													{getStatusIcon(alarm.status)}
												</div>
												<div className="space-y-1">
													<h4 className="font-semibold text-lg">
														{alarm.type}
													</h4>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<MapPin className="h-3 w-3" />
														<span>
															{alarm.location} • {alarm.branch.name}
														</span>
													</div>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<Clock className="h-3 w-3" />
														<span>{formatTimeAgo(alarm.time)}</span>
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
														<Badge
															className={cn(
																"text-xs font-medium shadow-sm",
																getSeverityColor(alarm.severity)
															)}>
															{alarm.severity}
														</Badge>
														<Badge
															className={cn(
																"text-xs font-medium shadow-sm",
																getStatusColor(alarm.status)
															)}>
															{alarm.status}
														</Badge>
													</div>
													{alarm.responseTime && (
														<p className="text-xs text-muted-foreground">
															Response: {alarm.responseTime}
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
														<MapPin className="h-3 w-3" />
														<span>
															{alarm.location} • {alarm.branch.name}
														</span>
													</div>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<Calendar className="h-3 w-3" />
														<span>{formatDateTime(alarm.time)}</span>
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-3">
												<div className="text-right space-y-2">
													<div className="flex gap-2">
														<Badge
															className={cn(
																"text-xs font-medium shadow-sm",
																getSeverityColor(alarm.severity)
															)}>
															{alarm.severity}
														</Badge>
														<Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md text-xs font-medium">
															RESOLVED
														</Badge>
													</div>
													{alarm.resolvedTime && (
														<p className="text-xs text-green-600 font-medium">
															Resolved in: {alarm.resolvedTime}
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

			{/* Enhanced Alarm Details Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
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
														selectedAlarm.severity === "CRITICAL"
															? "bg-red-600/30 text-red-200 border border-red-500/50"
															: selectedAlarm.severity === "HIGH"
															? "bg-orange-600/30 text-orange-200 border border-orange-500/50"
															: selectedAlarm.severity === "MEDIUM"
															? "bg-yellow-600/30 text-yellow-200 border border-yellow-500/50"
															: "bg-green-600/30 text-green-200 border border-green-500/50"
													)}>
													{selectedAlarm.severity}
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
															: selectedAlarm.status === "DISPATCHED"
															? "bg-blue-600/30 text-blue-200 border border-blue-500/50"
															: "bg-green-600/30 text-green-200 border border-green-500/50"
													}>
													{selectedAlarm.status === "ACTIVE"
														? "ACTIVE ALARM"
														: selectedAlarm.status === "ACKNOWLEDGED"
														? "UNDER INVESTIGATION"
														: selectedAlarm.status === "DISPATCHED"
														? "TEAM DISPATCHED"
														: "RESOLVED"}
												</Badge>
											</div>
											<div>
												<Label className="text-sm font-medium text-slate-400 font-mono">
													TIMESTAMP
												</Label>
												<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
													{formatDateTime(selectedAlarm.time)}
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium text-slate-400 font-mono">
													PRIORITY
												</Label>
												<p className="text-sm text-white font-mono bg-slate-900/50 p-2 rounded border">
													{selectedAlarm.severity === "CRITICAL"
														? "P0 - IMMEDIATE"
														: selectedAlarm.severity === "HIGH"
														? "P1 - URGENT"
														: selectedAlarm.severity === "MEDIUM"
														? "P2 - HIGH"
														: "P3 - NORMAL"}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="bg-slate-800/50 border-slate-700">
									<CardHeader>
										<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
											<MapPin className="h-5 w-5 mr-2 text-red-400" />
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
													GPS COORDINATES
												</Label>
												<p className="text-white font-mono bg-slate-900/50 p-2 rounded border flex items-center">
													<Crosshair className="h-4 w-4 mr-2 text-green-400" />
													{selectedAlarm.coordinates.lat.toFixed(6)},{" "}
													{selectedAlarm.coordinates.lng.toFixed(6)}
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

							{/* Tactical Map */}
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
											coordinates={selectedAlarm.coordinates}
											location={selectedAlarm.location}
										/>
									</CardContent>
								</Card>
							)}

							{/* Incident Description */}
							<Card className="bg-slate-800/50 border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
										<FileText className="h-5 w-5 mr-2 text-yellow-400" />
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
													{selectedAlarm.description ||
														"No description provided for this alarm."}
												</p>
											</div>
										</div>

										{selectedAlarm.status === "RESOLVED" && (
											<div>
												<Label className="text-sm font-medium text-green-400 font-mono">
													RESOLUTION REPORT
												</Label>
												<div className="mt-2 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
													<p className="text-green-200 font-mono leading-relaxed">
														{selectedAlarm.resolvedTime
															? `Alarm successfully resolved in ${selectedAlarm.resolvedTime}. Security team confirmed false alarm.`
															: "Alarm successfully resolved. No further action required."}
													</p>
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Response Metrics */}
							<Card className="bg-slate-800/50 border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
										<BarChart4 className="h-5 w-5 mr-2 text-purple-400" />
										RESPONSE METRICS
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
											<div className="flex items-center">
												<div className="p-2 bg-blue-900/30 rounded-full mr-3">
													<Timer className="h-5 w-5 text-blue-400" />
												</div>
												<div>
													<p className="text-slate-400 text-xs font-mono">
														RESPONSE TIME
													</p>
													<p className="text-blue-300 font-mono text-lg font-bold">
														{selectedAlarm.responseTime || "N/A"}
													</p>
												</div>
											</div>
										</div>

										<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
											<div className="flex items-center">
												<div className="p-2 bg-yellow-900/30 rounded-full mr-3">
													<Shield className="h-5 w-5 text-yellow-400" />
												</div>
												<div>
													<p className="text-slate-400 text-xs font-mono">
														ASSIGNED OFFICER
													</p>
													<p className="text-yellow-300 font-mono text-lg font-bold">
														{selectedAlarm.reports?.[0]?.assignedTo?.name ||
															"Unassigned"}
													</p>
												</div>
											</div>
										</div>

										<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
											<div className="flex items-center">
												<div className="p-2 bg-red-900/30 rounded-full mr-3">
													<Zap className="h-5 w-5 text-red-400" />
												</div>
												<div>
													<p className="text-slate-400 text-xs font-mono">
														RISK SCORE
													</p>
													<p className="text-red-300 font-mono text-lg font-bold">
														{selectedAlarm.severity === "CRITICAL"
															? "95%"
															: selectedAlarm.severity === "HIGH"
															? "75%"
															: selectedAlarm.severity === "MEDIUM"
															? "50%"
															: "25%"}
													</p>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Timeline */}
							<Card className="bg-slate-800/50 border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg font-mono text-slate-200 flex items-center">
										<Clock className="h-5 w-5 mr-2 text-blue-400" />
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
													{formatDateTime(selectedAlarm.time)}
												</p>
											</div>
										</div>

										{selectedAlarm.status === "DISPATCHED" && (
											<div className="flex items-center space-x-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
												<div className="p-2 bg-blue-600/30 rounded-full">
													<Send className="h-4 w-4 text-blue-400" />
												</div>
												<div>
													<p className="text-blue-200 font-mono font-medium">
														SECURITY TEAM DISPATCHED
													</p>
													<p className="text-blue-300 text-sm font-mono">
														{formatDateTime(
															selectedAlarm.updatedAt || selectedAlarm.time
														)}
													</p>
												</div>
											</div>
										)}

										{selectedAlarm.status === "ACKNOWLEDGED" && (
											<div className="flex items-center space-x-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
												<div className="p-2 bg-yellow-600/30 rounded-full">
													<Clock className="h-4 w-4 text-yellow-400" />
												</div>
												<div>
													<p className="text-yellow-200 font-mono font-medium">
														INVESTIGATION INITIATED
													</p>
													<p className="text-yellow-300 text-sm font-mono">
														{formatDateTime(
															selectedAlarm.updatedAt || selectedAlarm.time
														)}
													</p>
												</div>
											</div>
										)}

										{selectedAlarm.status === "RESOLVED" && (
											<div className="flex items-center space-x-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
												<div className="p-2 bg-green-600/30 rounded-full">
													<CheckCircle className="h-4 w-4 text-green-400" />
												</div>
												<div>
													<p className="text-green-200 font-mono font-medium">
														ALARM NEUTRALIZED
													</p>
													<p className="text-green-300 text-sm font-mono">
														{formatDateTime(
															selectedAlarm.updatedAt || selectedAlarm.time
														)}
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
						{selectedAlarm?.status === "ACTIVE" && (
							<Button
								onClick={() => {
									setIsViewDialogOpen(false);
									setSelectedAlarm({
										...selectedAlarm,
										status: "ACKNOWLEDGED",
									});
									setIsEditDialogOpen(true);
								}}
								className="bg-yellow-600 hover:bg-yellow-700 font-mono">
								<Clock className="h-4 w-4 mr-2" />
								ACKNOWLEDGE ALARM
							</Button>
						)}
						{selectedAlarm?.status === "ACKNOWLEDGED" && (
							<Button
								onClick={() => {
									setIsViewDialogOpen(false);
									setSelectedAlarm({
										...selectedAlarm,
										status: "RESOLVED",
									});
									setIsEditDialogOpen(true);
								}}
								className="bg-green-600 hover:bg-green-700 font-mono">
								<CheckCircle className="h-4 w-4 mr-2" />
								MARK RESOLVED
							</Button>
						)}
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
											value:
												| "ACTIVE"
												| "DISPATCHED"
												| "RESOLVED"
												| "ACKNOWLEDGED"
										) => setSelectedAlarm({ ...selectedAlarm, status: value })}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ACTIVE">Active</SelectItem>
											<SelectItem value="DISPATCHED">Dispatched</SelectItem>
											<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
											<SelectItem value="RESOLVED">Resolved</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editSeverity">Severity</Label>
									<Select
										value={selectedAlarm.severity}
										onValueChange={(
											value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
										) =>
											setSelectedAlarm({ ...selectedAlarm, severity: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="LOW">Low</SelectItem>
											<SelectItem value="MEDIUM">Medium</SelectItem>
											<SelectItem value="HIGH">High</SelectItem>
											<SelectItem value="CRITICAL">Critical</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="editDispatchedTo">Dispatched To</Label>
								<Input
									id="editDispatchedTo"
									value={selectedAlarm.dispatchedTo || ""}
									onChange={(e) =>
										setSelectedAlarm({
											...selectedAlarm,
											dispatchedTo: e.target.value,
										})
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

// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogDescription,
// 	DialogHeader,
// 	DialogTitle,
// } from "@/components/ui/dialog";
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// 	DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
// 	AlertTriangle,
// 	Plus,
// 	Clock,
// 	CheckCircle,
// 	Send,
// 	Eye,
// 	Search,
// 	Edit,
// 	MoreHorizontal,
// 	MapPin,
// 	Calendar,
// 	User,
// 	Shield,
// 	Activity,
// 	Loader2,
// } from "lucide-react";
// import Link from "next/link";
// import { apiService } from "@/lib/api-service";
// import { useToast } from "@/hooks/use-toast";
// import { cn } from "@/lib/utils";

// interface Alarm {
// 	id: string;
// 	type: string;
// 	location: string;
// 	branch: {
// 		id: string;
// 		name: string;
// 	};
// 	status: "ACTIVE" | "DISPATCHED" | "RESOLVED" | "ACKNOWLEDGED";
// 	time: string;
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	dispatchedTo: string;
// 	reports: {
// 		assignedTo: {
// 			id: string;
// 			name: string;
// 		};
// 	}[];
// 	resolvedTime?: string;
// 	description?: string;
// 	createdAt?: string;
// 	updatedAt?: string;
// 	responseTime?: string;
// 	priority?: number;
// }

// export default function AlarmsPage() {
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [mockAlarms, setMockAlarms] = useState<Alarm[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [alarmHistory, setAlarmHistory] = useState<Alarm[]>([]);
// 	const [filterStatus, setFilterStatus] = useState("all");
// 	const [filterSeverity, setFilterSeverity] = useState("all");
// 	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
// 	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
// 	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
// 	const [updating, setUpdating] = useState(false);
// 	const { toast } = useToast();

// 	useEffect(() => {
// 		fetchAlarms();
// 		fetchAlarmsHistory();
// 	}, []);

// 	const fetchAlarms = async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/alarms");
// 			console.log("Fetched alarms:", response);
// 			setMockAlarms((response as any).alarms as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch alarms",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const fetchAlarmsHistory = async () => {
// 		try {
// 			const response = await apiService.get("/alarms");
// 			console.log("Fetched alarm history:", response);
// 			setAlarmHistory((response as any).alarms as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch alarm history",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const handleUpdateAlarm = async () => {
// 		if (!selectedAlarm) return;

// 		try {
// 			setUpdating(true);
// 			await apiService.put(`/alarms/${selectedAlarm.id}`, {
// 				status: selectedAlarm.status,
// 				severity: selectedAlarm.severity,
// 				dispatchedTo: selectedAlarm.dispatchedTo,
// 				description: selectedAlarm.description,
// 			});

// 			toast({
// 				title: "Success",
// 				description: "Alarm updated successfully",
// 			});

// 			setIsEditDialogOpen(false);
// 			setSelectedAlarm(null);
// 			fetchAlarms();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description: error.response?.data?.message || "Failed to update alarm",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setUpdating(false);
// 		}
// 	};

// 	const getSeverityColor = (severity: string) => {
// 		switch (severity?.toUpperCase()) {
// 			case "CRITICAL":
// 				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0";
// 			case "HIGH":
// 				return "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0";
// 			case "MEDIUM":
// 				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0";
// 			case "LOW":
// 				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
// 			default:
// 				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
// 		}
// 	};

// 	const getStatusIcon = (status: string) => {
// 		switch (status) {
// 			case "ACTIVE":
// 				return <AlertTriangle className="h-4 w-4 text-red-500" />;
// 			case "DISPATCHED":
// 				return <Send className="h-4 w-4 text-blue-500" />;
// 			case "ACKNOWLEDGED":
// 				return <Clock className="h-4 w-4 text-yellow-500" />;
// 			case "RESOLVED":
// 				return <CheckCircle className="h-4 w-4 text-green-500" />;
// 			default:
// 				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
// 		}
// 	};

// 	const getStatusColor = (status: string) => {
// 		switch (status) {
// 			case "ACTIVE":
// 				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0";
// 			case "DISPATCHED":
// 				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0";
// 			case "ACKNOWLEDGED":
// 				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0";
// 			case "RESOLVED":
// 				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
// 			default:
// 				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
// 		}
// 	};

// 	const formatTimeAgo = (timestamp: string) => {
// 		const now = new Date();
// 		const time = new Date(timestamp);
// 		const diffInMinutes = Math.floor(
// 			(now.getTime() - time.getTime()) / (1000 * 60)
// 		);

// 		if (diffInMinutes < 1) return "Just now";
// 		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
// 		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
// 		return `${Math.floor(diffInMinutes / 1440)}d ago`;
// 	};

// 	const filteredAlarms = mockAlarms.filter((alarm) => {
// 		const matchesSearch =
// 			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase());
// 		const matchesStatus =
// 			filterStatus === "all" || alarm.status === filterStatus;
// 		const matchesSeverity =
// 			filterSeverity === "all" || alarm.severity === filterSeverity;
// 		return matchesSearch && matchesStatus && matchesSeverity;
// 	});

// 	const filteredHistory = alarmHistory.filter((alarm) => {
// 		const matchesSearch =
// 			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase());
// 		return matchesSearch;
// 	});

// 	if (loading) {
// 		return (
// 			<div className="flex items-center justify-center min-h-[400px]">
// 				<div className="text-center space-y-4 animate-fade-in">
// 					<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
// 					<p className="text-muted-foreground">Loading alarms...</p>
// 				</div>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6 animate-fade-in">
// 			<div className="flex justify-between items-center animate-slide-up">
// 				<div>
// 					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
// 						Alarm Management
// 					</h1>
// 					<p className="text-muted-foreground mt-2">
// 						Monitor and manage security alarms across all branches
// 					</p>
// 				</div>
// 				<Link href="/dashboard/configure-alarm">
// 					<Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200">
// 						<Plus className="h-4 w-4 mr-2" />
// 						Configure New Alarm
// 					</Button>
// 				</Link>
// 			</div>

// 			{/* Enhanced Overview Cards */}
// 			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.1s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
// 						<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
// 							<AlertTriangle className="h-4 w-4 text-red-500" />
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-red-600">
// 							{mockAlarms.filter((a) => a.status === "ACTIVE").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">
// 							Require immediate attention
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.2s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Dispatched</CardTitle>
// 						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
// 							<Send className="h-4 w-4 text-blue-500" />
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-blue-600">
// 							{mockAlarms.filter((a) => a.status === "DISPATCHED").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Sent to police</p>
// 					</CardContent>
// 				</Card>
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.3s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
// 						<div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
// 							<Clock className="h-4 w-4 text-yellow-500" />
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-yellow-600">
// 							{mockAlarms.filter((a) => a.status === "ACKNOWLEDGED").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Being handled</p>
// 					</CardContent>
// 				</Card>
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.4s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Resolved Today
// 						</CardTitle>
// 						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
// 							<CheckCircle className="h-4 w-4 text-green-500" />
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-green-600">
// 							{mockAlarms.filter((a) => a.status === "RESOLVED").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">
// 							Successfully handled
// 						</p>
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Enhanced Alarm Management Tabs */}
// 			<Tabs
// 				defaultValue="active"
// 				className="space-y-4 animate-slide-up"
// 				style={{ animationDelay: "0.5s" }}>
// 				<div className="flex justify-between items-center">
// 					<TabsList className="glass">
// 						<TabsTrigger value="active">Active Alarms</TabsTrigger>
// 						<TabsTrigger value="history">Alarm History</TabsTrigger>
// 					</TabsList>
// 					<div className="flex space-x-2">
// 						<div className="relative">
// 							<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
// 							<Input
// 								placeholder="Search alarms..."
// 								value={searchTerm}
// 								onChange={(e) => setSearchTerm(e.target.value)}
// 								className="pl-9 w-64 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 							/>
// 						</div>
// 						<Select value={filterStatus} onValueChange={setFilterStatus}>
// 							<SelectTrigger className="w-32">
// 								<SelectValue placeholder="Status" />
// 							</SelectTrigger>
// 							<SelectContent>
// 								<SelectItem value="all">All Status</SelectItem>
// 								<SelectItem value="ACTIVE">Active</SelectItem>
// 								<SelectItem value="DISPATCHED">Dispatched</SelectItem>
// 								<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
// 								<SelectItem value="RESOLVED">Resolved</SelectItem>
// 							</SelectContent>
// 						</Select>
// 						<Select value={filterSeverity} onValueChange={setFilterSeverity}>
// 							<SelectTrigger className="w-32">
// 								<SelectValue placeholder="Severity" />
// 							</SelectTrigger>
// 							<SelectContent>
// 								<SelectItem value="all">All Severity</SelectItem>
// 								<SelectItem value="CRITICAL">Critical</SelectItem>
// 								<SelectItem value="HIGH">High</SelectItem>
// 								<SelectItem value="MEDIUM">Medium</SelectItem>
// 								<SelectItem value="LOW">Low</SelectItem>
// 							</SelectContent>
// 						</Select>
// 					</div>
// 				</div>

// 				<TabsContent value="active" className="space-y-4">
// 					<div className="grid gap-4">
// 						{filteredAlarms.map((alarm, index) => (
// 							<Card
// 								key={alarm.id}
// 								className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
// 								style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											<div className="p-3 rounded-lg bg-muted/50">
// 												{getStatusIcon(alarm.status)}
// 											</div>
// 											<div className="space-y-1">
// 												<h4 className="font-semibold text-lg">{alarm.type}</h4>
// 												<div className="flex items-center gap-2 text-sm text-muted-foreground">
// 													<MapPin className="h-3 w-3" />
// 													<span>
// 														{alarm.location} • {alarm.branch.name}
// 													</span>
// 												</div>
// 												<div className="flex items-center gap-2 text-xs text-muted-foreground">
// 													<Clock className="h-3 w-3" />
// 													<span>{formatTimeAgo(alarm.time)}</span>
// 												</div>
// 												{alarm.reports?.[0]?.assignedTo && (
// 													<div className="flex items-center gap-2 text-sm">
// 														<Shield className="h-3 w-3 text-blue-500" />
// 														<span className="text-blue-600 dark:text-blue-400">
// 															{alarm.reports[0].assignedTo.name}
// 														</span>
// 													</div>
// 												)}
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-3">
// 											<div className="text-right space-y-2">
// 												<div className="flex gap-2">
// 													<Badge
// 														className={cn(
// 															"text-xs font-medium shadow-sm",
// 															getSeverityColor(alarm.severity)
// 														)}>
// 														{alarm.severity}
// 													</Badge>
// 													<Badge
// 														className={cn(
// 															"text-xs font-medium shadow-sm",
// 															getStatusColor(alarm.status)
// 														)}>
// 														{alarm.status}
// 													</Badge>
// 												</div>
// 												{alarm.responseTime && (
// 													<p className="text-xs text-muted-foreground">
// 														Response: {alarm.responseTime}
// 													</p>
// 												)}
// 											</div>
// 											<DropdownMenu>
// 												<DropdownMenuTrigger asChild>
// 													<Button
// 														variant="outline"
// 														size="sm"
// 														className="h-8 w-8 p-0">
// 														<MoreHorizontal className="h-4 w-4" />
// 													</Button>
// 												</DropdownMenuTrigger>
// 												<DropdownMenuContent align="end" className="glass">
// 													<DropdownMenuItem
// 														className="cursor-pointer"
// 														onClick={() => {
// 															setSelectedAlarm(alarm);
// 															setIsViewDialogOpen(true);
// 														}}>
// 														<Eye className="h-4 w-4 mr-2" />
// 														View Details
// 													</DropdownMenuItem>
// 													<DropdownMenuItem
// 														className="cursor-pointer"
// 														onClick={() => {
// 															setSelectedAlarm(alarm);
// 															setIsEditDialogOpen(true);
// 														}}>
// 														<Edit className="h-4 w-4 mr-2" />
// 														Edit Alarm
// 													</DropdownMenuItem>
// 													<DropdownMenuItem className="cursor-pointer">
// 														<Send className="h-4 w-4 mr-2" />
// 														Dispatch
// 													</DropdownMenuItem>
// 												</DropdownMenuContent>
// 											</DropdownMenu>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="history" className="space-y-4">
// 					<div className="grid gap-4">
// 						{filteredHistory.map((alarm, index) => (
// 							<Card
// 								key={alarm.id}
// 								className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
// 								style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											<div className="p-3 rounded-lg bg-muted/50">
// 												{getStatusIcon(alarm.status)}
// 											</div>
// 											<div className="space-y-1">
// 												<h4 className="font-semibold text-lg">{alarm.type}</h4>
// 												<div className="flex items-center gap-2 text-sm text-muted-foreground">
// 													<MapPin className="h-3 w-3" />
// 													<span>
// 														{alarm.location} • {alarm.branch.name}
// 													</span>
// 												</div>
// 												<div className="flex items-center gap-2 text-xs text-muted-foreground">
// 													<Calendar className="h-3 w-3" />
// 													<span>{alarm.time}</span>
// 												</div>
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-3">
// 											<div className="text-right space-y-2">
// 												<div className="flex gap-2">
// 													<Badge
// 														className={cn(
// 															"text-xs font-medium shadow-sm",
// 															getSeverityColor(alarm.severity)
// 														)}>
// 														{alarm.severity}
// 													</Badge>
// 													<Badge
// 														className={cn(
// 															"text-xs font-medium shadow-sm",
// 															getStatusColor(alarm.status)
// 														)}>
// 														{alarm.status}
// 													</Badge>
// 												</div>
// 												{alarm.resolvedTime && (
// 													<p className="text-xs text-green-600 font-medium">
// 														Resolved in: {alarm.resolvedTime}
// 													</p>
// 												)}
// 											</div>
// 											<Button
// 												variant="outline"
// 												size="sm"
// 												onClick={() => {
// 													setSelectedAlarm(alarm);
// 													setIsViewDialogOpen(true);
// 												}}>
// 												<Eye className="h-4 w-4 mr-2" />
// 												View Report
// 											</Button>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>
// 			</Tabs>

// 			{/* View Alarm Details Dialog */}
// 			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
// 				<DialogContent className="sm:max-w-[600px] glass">
// 					<DialogHeader>
// 						<DialogTitle className="flex items-center gap-2">
// 							<AlertTriangle className="h-5 w-5 text-primary" />
// 							Alarm Details
// 						</DialogTitle>
// 						<DialogDescription>
// 							Detailed information about the security alarm
// 						</DialogDescription>
// 					</DialogHeader>
// 					{selectedAlarm && (
// 						<div className="space-y-6 py-4">
// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Alarm Type
// 									</Label>
// 									<p className="text-lg font-semibold">{selectedAlarm.type}</p>
// 								</div>
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Status
// 									</Label>
// 									<Badge
// 										className={cn(
// 											"text-sm",
// 											getStatusColor(selectedAlarm.status)
// 										)}>
// 										{selectedAlarm.status}
// 									</Badge>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Location
// 									</Label>
// 									<p className="flex items-center gap-2">
// 										<MapPin className="h-4 w-4 text-muted-foreground" />
// 										{selectedAlarm.location}
// 									</p>
// 								</div>
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Branch
// 									</Label>
// 									<p className="flex items-center gap-2">
// 										<Activity className="h-4 w-4 text-muted-foreground" />
// 										{selectedAlarm.branch.name}
// 									</p>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Severity
// 									</Label>
// 									<Badge
// 										className={cn(
// 											"text-sm",
// 											getSeverityColor(selectedAlarm.severity)
// 										)}>
// 										{selectedAlarm.severity}
// 									</Badge>
// 								</div>
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Time Reported
// 									</Label>
// 									<p className="flex items-center gap-2">
// 										<Clock className="h-4 w-4 text-muted-foreground" />
// 										{formatTimeAgo(selectedAlarm.time)}
// 									</p>
// 								</div>
// 							</div>

// 							{selectedAlarm.reports?.[0]?.assignedTo && (
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Assigned Officer
// 									</Label>
// 									<p className="flex items-center gap-2">
// 										<User className="h-4 w-4 text-muted-foreground" />
// 										{selectedAlarm.reports[0].assignedTo.name}
// 									</p>
// 								</div>
// 							)}

// 							{selectedAlarm.description && (
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Description
// 									</Label>
// 									<div className="p-3 bg-muted/50 rounded-lg border">
// 										<p className="text-sm">{selectedAlarm.description}</p>
// 									</div>
// 								</div>
// 							)}

// 							{selectedAlarm.resolvedTime && (
// 								<div className="space-y-2">
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Resolution Time
// 									</Label>
// 									<p className="text-green-600 font-medium">
// 										{selectedAlarm.resolvedTime}
// 									</p>
// 								</div>
// 							)}
// 						</div>
// 					)}
// 					<div className="flex justify-end">
// 						<Button
// 							variant="outline"
// 							onClick={() => setIsViewDialogOpen(false)}>
// 							Close
// 						</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>

// 			{/* Edit Alarm Dialog */}
// 			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
// 				<DialogContent className="sm:max-w-[600px] glass">
// 					<DialogHeader>
// 						<DialogTitle className="flex items-center gap-2">
// 							<Edit className="h-5 w-5 text-primary" />
// 							Edit Alarm
// 						</DialogTitle>
// 						<DialogDescription>
// 							Update alarm information and status
// 						</DialogDescription>
// 					</DialogHeader>
// 					{selectedAlarm && (
// 						<div className="space-y-4 py-4">
// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="editStatus">Status</Label>
// 									<Select
// 										value={selectedAlarm.status}
// 										onValueChange={(
// 											value:
// 												| "ACTIVE"
// 												| "DISPATCHED"
// 												| "RESOLVED"
// 												| "ACKNOWLEDGED"
// 										) => setSelectedAlarm({ ...selectedAlarm, status: value })}>
// 										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="ACTIVE">Active</SelectItem>
// 											<SelectItem value="DISPATCHED">Dispatched</SelectItem>
// 											<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
// 											<SelectItem value="RESOLVED">Resolved</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editSeverity">Severity</Label>
// 									<Select
// 										value={selectedAlarm.severity}
// 										onValueChange={(
// 											value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
// 										) =>
// 											setSelectedAlarm({ ...selectedAlarm, severity: value })
// 										}>
// 										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="LOW">Low</SelectItem>
// 											<SelectItem value="MEDIUM">Medium</SelectItem>
// 											<SelectItem value="HIGH">High</SelectItem>
// 											<SelectItem value="CRITICAL">Critical</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="editDispatchedTo">Dispatched To</Label>
// 								<Input
// 									id="editDispatchedTo"
// 									value={selectedAlarm.dispatchedTo || ""}
// 									onChange={(e) =>
// 										setSelectedAlarm({
// 											...selectedAlarm,
// 											dispatchedTo: e.target.value,
// 										})
// 									}
// 									placeholder="Officer name or unit"
// 									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 								/>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="editDescription">Description/Notes</Label>
// 								<Textarea
// 									id="editDescription"
// 									value={selectedAlarm.description || ""}
// 									onChange={(e) =>
// 										setSelectedAlarm({
// 											...selectedAlarm,
// 											description: e.target.value,
// 										})
// 									}
// 									placeholder="Additional notes or description..."
// 									rows={3}
// 									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 								/>
// 							</div>
// 						</div>
// 					)}
// 					<div className="flex justify-end space-x-2">
// 						<Button
// 							variant="outline"
// 							onClick={() => setIsEditDialogOpen(false)}
// 							disabled={updating}>
// 							Cancel
// 						</Button>
// 						<Button
// 							onClick={handleUpdateAlarm}
// 							disabled={updating}
// 							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
// 							{updating ? (
// 								<>
// 									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 									Updating...
// 								</>
// 							) : (
// 								"Update Alarm"
// 							)}
// 						</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>
// 		</div>
// 	);
// }
