"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiClient } from "@/lib/api";
import { audioService } from "@/lib/audio-service";
// import { PersistentAlarmModal } from "@/components/persistent-alarm-modal";
import {
	AlertTriangle,
	CheckCircle,
	Shield,
	Eye,
	MapPin,
	Calendar,
	Loader2,
	Search,
	Zap,
	Activity,
	Target,
	Radio,
	Wifi,
	AlertCircle,
	Navigation,
	WifiOff,
	RefreshCw,
	Users,
	Volume2,
	VolumeX,
	TestTube,
	StopCircle,
	Play,
	Pause,
	Monitor,
	Building,
	User,
	Clock,
	Map,
	Mail,
} from "lucide-react";

import { Phone, Info, BarChart3, X, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalAlarms } from "@/components/global-alarm-provider";

interface Alarm {
	id: string;
	type: string;
	branchId: string;
	branch: {
		id: string;
		name: string;
		company?: {
			id: string;
			name: string;
			logo?: string;
		};
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
	isRealTime?: boolean;
}

export default function EnhancedAlarmReportsPage() {
	const [updating, setUpdating] = useState(false);
	const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
	const [resolutionDescription, setResolutionDescription] = useState("");
	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

	const [currentUser, setCurrentUser] = useState<any | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [severityFilter, setSeverityFilter] = useState<string>("all");
	const [activeTab, setActiveTab] = useState<
		"all" | "active" | "acknowledged" | "resolved"
	>("active");

	const { toast } = useToast();

	// Get authentication token
	const token =
		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

	const {
		alarms,
		isConnected,
		audioEnabled,
		modalEnabled,
		setAudioEnabled,
		setModalEnabled,
		acknowledgeAlarm,
		updateAlarmStatus: changeAlarmStatus,
		refreshAlarms: fetchAlarms,
		getAlarmStats,
	} = useGlobalAlarms();

	// Update audio service whenever alarms change
	useEffect(() => {
		if (audioEnabled) {
			audioService.updateActiveAlarms(alarms);
		}
	}, [alarms, audioEnabled]);

	useEffect(() => {
		const loadCurrentUser = async () => {
			try {
				const storedUser = localStorage.getItem("currentUser");
				if (storedUser) {
					setCurrentUser(JSON.parse(storedUser));
				} else {
					const user = await apiClient.getCurrentUser();
					setCurrentUser(user);
				}
			} catch (error) {
				console.error("Failed to load current user:", error);
			}
		};

		loadCurrentUser();
	}, []);

	// Request notification permission on component mount
	useEffect(() => {
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission().then((permission) => {
				console.log(`Notification permission: ${permission}`);
			});
		}
	}, []);

	// Initialize audio service settings
	useEffect(() => {
		audioService.setEnabled(audioEnabled);
	}, [audioEnabled]);

	// Initial alarm fetch
	useEffect(() => {
		fetchAlarms();
	}, []);

	// Add this useEffect to highlight alarms when navigated from other pages
	useEffect(() => {
		const highlightAlarmId = sessionStorage.getItem("highlightAlarmId");
		if (highlightAlarmId) {
			// Find and highlight the alarm
			const alarm = alarms.find((a) => a.id === highlightAlarmId);
			if (alarm) {
				setSelectedAlarm(alarm);
				setIsDetailsDialogOpen(true);
				sessionStorage.removeItem("highlightAlarmId");
			}
		}
	}, [alarms]);

	const resolveAlarm = async () => {
		if (!selectedAlarm) return;

		try {
			setUpdating(true);
			await apiClient.updateAlarm(selectedAlarm.id, {
				status: "RESOLVED",
				completedAt: new Date().toISOString(),
				resolutionDescription,
			});

			toast({
				title: "Success",
				description: "Alarm resolved successfully",
			});

			await fetchAlarms();

			setIsResolutionDialogOpen(false);
			setResolutionDescription("");
			setSelectedAlarm(null);
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message || "Failed to resolve alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

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

	const viewAlarmDetails = (alarmId: string) => {
		const alarm = alarms.find((a) => a.id === alarmId);
		if (alarm) {
			setSelectedAlarm(alarm);
			setIsDetailsDialogOpen(true);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-red-100 text-red-800 border-red-200";
			case "ACKNOWLEDGED":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "RESOLVED":
				return "bg-green-100 text-green-800 border-green-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	// Filter alarms based on search, filters, and active tab
	const filteredAlarms = useMemo(() => {
		return alarms
			.filter((alarm) => {
				const matchesSearch =
					searchTerm === "" ||
					alarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
					alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					alarm.type.toLowerCase().includes(searchTerm.toLowerCase());

				const matchesStatus =
					statusFilter === "all" || alarm.status === statusFilter;
				const matchesSeverity =
					severityFilter === "all" || alarm.severity === severityFilter;

				// Tab filtering
				const matchesTab =
					activeTab === "all" ||
					(activeTab === "active" && alarm.status === "ACTIVE") ||
					(activeTab === "acknowledged" && alarm.status === "ACKNOWLEDGED") ||
					(activeTab === "resolved" && alarm.status === "RESOLVED");

				return matchesSearch && matchesStatus && matchesSeverity && matchesTab;
			})
			.sort((a, b) => {
				if (a.priority !== b.priority) {
					return (a.priority || 5) - (b.priority || 5);
				}
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			});
	}, [alarms, searchTerm, statusFilter, severityFilter, activeTab]);
	// Statistics
	const alarmStats = getAlarmStats();

	const copyToClipboard = (text: any) => {
		navigator.clipboard.writeText(text);
	};

	const openInMaps = () => {
		const coords = selectedAlarm.coordinates || selectedAlarm;
		if (coords?.latitude && coords?.longitude) {
			window.open(
				`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`,
				"_blank"
			);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			<div className="space-y-6 p-6">
				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card className="bg-slate-900/50 border-slate-700">
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Activity className="h-5 w-5 text-blue-400" />
								<div>
									<p className="text-sm text-slate-400">Total Alarms</p>
									<p className="text-2xl font-bold text-white">
										{alarmStats.total}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-red-900/20 border-red-500/30">
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5 text-red-400" />
								<div>
									<p className="text-sm text-red-300">Active</p>
									<p className="text-2xl font-bold text-red-400">
										{alarmStats.active}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-yellow-900/20 border-yellow-500/30">
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Eye className="h-5 w-5 text-yellow-400" />
								<div>
									<p className="text-sm text-yellow-300">Acknowledged</p>
									<p className="text-2xl font-bold text-yellow-400">
										{alarmStats.acknowledged}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-green-900/20 border-green-500/30">
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-green-400" />
								<div>
									<p className="text-sm text-green-300">Resolved</p>
									<p className="text-2xl font-bold text-green-400">
										{alarmStats.resolved}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
				{/* Header Section */}
				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
					<div className="relative flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="relative">
								<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
									<Shield className="h-8 w-8 text-red-400" />
								</div>
								{alarmStats.active > 0 && (
									<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
								)}
							</div>
							<div>
								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
									Real-Time Response Link
								</h1>
								{/* <p className="text-slate-400 font-mono text-lg mt-2">
									Real-time ALARM monitoring & incident response system
								</p> */}
								{currentUser && (
									<p className="text-slate-500 font-mono text-sm mt-1">
										Logged in as: {currentUser.name} ({currentUser.role}
										{currentUser.operatorType &&
											` - ${currentUser.operatorType}`}
										)
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center space-x-4">
							{/* WebSocket Connection Status */}
							<div
								className={cn(
									"flex items-center space-x-2 px-4 py-2 rounded-lg border",
									isConnected
										? "bg-green-600/20 border-green-500/30"
										: "bg-red-600/20 border-red-500/30"
								)}>
								{isConnected ? (
									<>
										<Wifi className="h-4 w-4 text-green-400" />
										<span className="text-green-400 font-mono text-sm">
											CONNECTED
										</span>
									</>
								) : (
									<>
										<WifiOff className="h-4 w-4 text-red-400" />
										<span className="text-red-400 font-mono text-sm">
											DISCONNECTED
										</span>
									</>
								)}
							</div>

							{/* Alert Controls */}
							<div className="flex items-center space-x-2">
								{/* Audio Toggle */}

								{/* Modal Toggle */}
								<Button
									variant="outline"
									size="sm"
									onClick={() => setModalEnabled(!modalEnabled)}
									className={cn(
										"border-slate-600",
										modalEnabled
											? "bg-purple-600/20 text-purple-400"
											: "bg-slate-600/20 text-slate-400"
									)}
									title="Toggle persistent modal alerts">
									<Monitor className="h-4 w-4" />
								</Button>
							</div>

							{/* Refresh Button */}
							<Button
								variant="outline"
								size="sm"
								onClick={fetchAlarms}
								// disabled={loading}
								className="border-slate-600 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40">
								<RefreshCw className={cn("h-4 w-4")} />
							</Button>
						</div>
					</div>
				</div>

				{/* Alert System Status */}
				<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
					{/* Persistent Audio Alert Status */}
					{audioEnabled && audioService.getActiveAlarmCount() > 0 && (
						<div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 animate-pulse">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div>
										<span className="text-red-400 font-bold">
											ALERTS ACTIVE
										</span>
										<p className="text-red-300 text-sm">
											{audioService.getActiveAlarmCount()} active alarm
											{audioService.getActiveAlarmCount() !== 1 ? "s" : ""}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Ready Status */}
				{audioEnabled && modalEnabled && alarmStats.active === 0 && (
					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 md:col-span-2">
						<div className="flex items-center space-x-2">
							{/* <Volume2 className="h-5 w-5 text-green-400" />
								<Monitor className="h-5 w-5 text-green-400" /> */}
							<span className="text-green-400 font-medium">
								ALERT SYSTEMS READY
							</span>
							<span className="text-green-300 text-sm">
								- Alerts will activate for all new active alarms
							</span>
						</div>
					</div>
				)}

				{/* Filters */}
				<Card className="bg-slate-900/50 border-slate-700">
					<CardContent className="p-4">
						<div className="flex flex-col md:flex-row gap-4">
							<div className="flex-1">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
									<Input
										placeholder="Search alarms..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 bg-slate-800 border-slate-600 text-white"
									/>
								</div>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent className="bg-slate-800 border-slate-600">
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="ACTIVE">Active</SelectItem>
									<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
									<SelectItem value="RESOLVED">Resolved</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Status Tabs */}
				<Card className="bg-slate-900/50 border-slate-700">
					<CardContent className="p-4">
						<div className="flex flex-wrap gap-2">
							<Button
								variant={activeTab === "active" ? "default" : "outline"}
								onClick={() => setActiveTab("active")}
								className={cn(
									"transition-all duration-200",
									activeTab === "active"
										? "bg-red-600 hover:bg-red-700 text-white"
										: "border-slate-600 text-slate-300 hover:bg-slate-800"
								)}>
								<AlertTriangle className="h-4 w-4 mr-2" />
								Active Alarms ({alarmStats.active})
							</Button>
							<Button
								variant={activeTab === "acknowledged" ? "default" : "outline"}
								onClick={() => setActiveTab("acknowledged")}
								className={cn(
									"transition-all duration-200",
									activeTab === "acknowledged"
										? "bg-yellow-600 hover:bg-yellow-700 text-white"
										: "border-slate-600 text-slate-300 hover:bg-slate-800"
								)}>
								<Eye className="h-4 w-4 mr-2" />
								Acknowledged ({alarmStats.acknowledged})
							</Button>
							<Button
								variant={activeTab === "resolved" ? "default" : "outline"}
								onClick={() => setActiveTab("resolved")}
								className={cn(
									"transition-all duration-200",
									activeTab === "resolved"
										? "bg-green-600 hover:bg-green-700 text-white"
										: "border-slate-600 text-slate-300 hover:bg-slate-800"
								)}>
								<CheckCircle className="h-4 w-4 mr-2" />
								Resolved ({alarmStats.resolved})
							</Button>
							<Button
								variant={activeTab === "all" ? "default" : "outline"}
								onClick={() => setActiveTab("all")}
								className={cn(
									"transition-all duration-200",
									activeTab === "all"
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "border-slate-600 text-slate-300 hover:bg-slate-800"
								)}>
								<Activity className="h-4 w-4 mr-2" />
								All Alarms ({alarmStats.total})
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Alarms List */}
				<div className="space-y-4">
					{filteredAlarms.length === 0 ? (
						<Card className="bg-slate-900/50 border-slate-700">
							<CardContent className="p-8 text-center">
								<AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
								<p className="text-slate-400 text-lg">
									No {activeTab === "all" ? "" : activeTab.toLowerCase()} alarms
									found
								</p>
								<p className="text-slate-500 text-sm mt-2">
									{searchTerm ||
									statusFilter !== "all" ||
									severityFilter !== "all"
										? "Try adjusting your filters"
										: activeTab === "active"
										? "All clear! No active alarms at this time."
										: `No ${activeTab} alarms to display.`}
								</p>
							</CardContent>
						</Card>
					) : (
						filteredAlarms.map((alarm) => (
							<Card
								key={alarm.id}
								className={cn(
									"group relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/50 hover:scale-[1.02]",
									alarm.isRealTime &&
										"ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-400/20 animate-pulse",
									alarm.severity === "CRITICAL" &&
										"border-red-500/60 bg-gradient-to-br from-red-950/30 to-red-900/20 shadow-red-500/20",
									alarm.status === "ACTIVE" &&
										(audioEnabled || modalEnabled) &&
										"ring-1 ring-red-400/40"
								)}>
								{/* Severity Indicator Strip */}
								<div
									className={cn(
										"absolute top-0 left-0 right-0 h-1",
										alarm.severity === "CRITICAL" &&
											"bg-gradient-to-r from-red-500 to-red-600",
										alarm.severity === "HIGH" &&
											"bg-gradient-to-r from-orange-500 to-orange-600",
										alarm.severity === "MEDIUM" &&
											"bg-gradient-to-r from-yellow-500 to-yellow-600",
										alarm.severity === "LOW" &&
											"bg-gradient-to-r from-blue-500 to-blue-600"
									)}
								/>

								{/* Background Pattern */}
								<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30" />

								<CardContent className="relative p-6">
									<div className="flex items-start justify-between">
										<div className="flex-1 space-y-4">
											{/* Header Section with Company Logo and Info */}
											<div className="flex items-center space-x-4">
												{/* Company Logo */}
												<div className="relative">
													{(alarm as any)?.branch?.company?.logo && (
														<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-1 shadow-lg">
															<img
																src={`http://8436insight.et:3003${(
																	alarm as any
																)?.branch?.company?.logo.replace(
																	"/var/www/html/koppa-security-api",
																	""
																)}`}
																alt={`${alarm.branch.company?.name} logo`}
																className="w-full h-full object-cover rounded-xl"
																onError={(e) => {
																	e.currentTarget.style.display = "none";
																}}
															/>
														</div>
													)}

													{/* Severity Badge on Logo */}
													<div
														className={cn(
															"absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg",
															alarm.severity === "CRITICAL" && "bg-red-500",
															alarm.severity === "HIGH" && "bg-orange-500",
															alarm.severity === "MEDIUM" && "bg-yellow-500",
															alarm.severity === "LOW" && "bg-blue-500"
														)}>
														{alarm.severity === "CRITICAL" && "!"}
														{alarm.severity === "HIGH" && "H"}
														{alarm.severity === "MEDIUM" && "M"}
														{alarm.severity === "LOW" && "L"}
													</div>
												</div>

												{/* Company and Branch Info */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center space-x-3 mb-2">
														<h2 className="text-xl font-bold text-white truncate">
															{alarm.branch.company?.name || "Unknown Company"}
														</h2>
													</div>

													<div className="flex items-center space-x-3">
														<div className="flex items-center space-x-2">
															<Building className="h-4 w-4 text-slate-400" />
															<span className="text-slate-300 font-medium">
																{alarm.branch?.name}
															</span>
														</div>

														<Badge
															variant="outline"
															className={cn(
																"font-medium",
																alarm.status === "ACTIVE" &&
																	"bg-red-100/10 text-red-300 border-red-400/30",
																alarm.status === "ACKNOWLEDGED" &&
																	"bg-yellow-100/10 text-yellow-300 border-yellow-400/30",
																alarm.status === "RESOLVED" &&
																	"bg-green-100/10 text-green-300 border-green-400/30"
															)}>
															{alarm.status}
														</Badge>

														<Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 font-mono text-xs">
															#{alarm.id.slice(-8)}
														</Badge>
													</div>
												</div>
											</div>

											{/* Alarm Type and Description */}
											<div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
												<div className="flex items-center space-x-2 mb-2">
													<AlertTriangle
														className={cn(
															"h-5 w-5",
															alarm.severity === "CRITICAL" && "text-red-400",
															alarm.severity === "HIGH" && "text-orange-400",
															alarm.severity === "MEDIUM" && "text-yellow-400",
															alarm.severity === "LOW" && "text-blue-400"
														)}
													/>
													<h3 className="text-lg font-bold text-white">
														{alarm.type}
													</h3>
												</div>
												{/* <p className="text-slate-300 leading-relaxed">
													{alarm.description}
												</p> */}
											</div>

											{/* Details Grid */}
											<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
												<div className="flex items-center space-x-3 bg-slate-800/20 rounded-lg p-3 border border-slate-700/20">
													<div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
														<MapPin className="h-4 w-4 text-purple-400" />
													</div>
													<div>
														<p className="text-xs text-slate-500 uppercase tracking-wide">
															Location
														</p>
														<p className="text-slate-300 font-medium">
															{alarm.branch.name}
														</p>
													</div>
												</div>

												<div className="flex items-center space-x-3 bg-slate-800/20 rounded-lg p-3 border border-slate-700/20">
													<div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
														<Users className="h-4 w-4 text-blue-400" />
													</div>
													<div>
														<p className="text-xs text-slate-500 uppercase tracking-wide">
															Created By
														</p>
														<p className="text-slate-300 font-medium">
															{alarm.createdBy.name}
														</p>
													</div>
												</div>

												<div className="flex items-center space-x-3 bg-slate-800/20 rounded-lg p-3 border border-slate-700/20">
													<div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
														<Calendar className="h-4 w-4 text-green-400" />
													</div>
													<div>
														<p className="text-xs text-slate-500 uppercase tracking-wide">
															Created
														</p>
														<p className="text-slate-300 font-medium">
															{new Date(alarm.createdAt).toLocaleDateString(
																"en-US",
																{
																	month: "short",
																	day: "numeric",
																	year: "numeric",
																}
															)}{" "}
															{new Date(alarm.createdAt).toLocaleTimeString(
																"en-US",
																{
																	hour: "numeric",
																	minute: "2-digit",
																	hour12: true,
																}
															)}
														</p>
													</div>
												</div>
											</div>

											{/* Specific Location if available */}
											{alarm.location && (
												<div className="flex items-center space-x-3 bg-slate-800/20 rounded-lg p-3 border border-slate-700/20">
													<div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
														<Navigation className="h-4 w-4 text-orange-400" />
													</div>
													<div>
														<p className="text-xs text-slate-500 uppercase tracking-wide">
															Sub City
														</p>
														<p className="text-slate-300 font-medium">
															{alarm.location}
														</p>
													</div>
												</div>
											)}
										</div>

										{/* Action Buttons */}
										<div className="flex flex-col space-y-3 ml-6">
											<Button
												variant="outline"
												size="sm"
												onClick={() => viewAlarmDetails(alarm.id)}
												className="group/btn border-slate-600/50 bg-slate-700/30 text-slate-300 hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 backdrop-blur-sm">
												<Eye className="h-4 w-4 mr-2 group-hover/btn:text-blue-400 transition-colors" />
												Details
											</Button>

											{alarm.status === "ACTIVE" && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => acknowledgeAlarm(alarm.id)}
													disabled={updating}
													className="group/btn border-yellow-500/50 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-400 transition-all duration-300 backdrop-blur-sm">
													{updating ? (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													) : (
														<CheckCircle className="h-4 w-4 mr-2 group-hover/btn:text-yellow-200 transition-colors" />
													)}
													Acknowledge
												</Button>
											)}

											{alarm.status === "ACKNOWLEDGED" && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsResolutionDialogOpen(true);
													}}
													className="group/btn border-green-500/50 bg-green-500/10 text-green-300 hover:bg-green-500/20 hover:border-green-400 transition-all duration-300 backdrop-blur-sm">
													<Target className="h-4 w-4 mr-2 group-hover/btn:text-green-200 transition-colors" />
													Resolve
												</Button>
											)}
										</div>
									</div>
								</CardContent>

								{/* Hover Effect Overlay */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
							</Card>
						))
					)}
				</div>

				<Dialog
					open={isDetailsDialogOpen}
					onOpenChange={setIsDetailsDialogOpen}>
					<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold flex items-center space-x-3">
								<AlertTriangle className="h-6 w-6 text-red-400" />
								<span>{selectedAlarm?.type}</span>
								{selectedAlarm?.isRealTime && (
									<Badge className="bg-cyan-600 text-white animate-pulse">
										{selectedAlarm?.status}
									</Badge>
								)}
							</DialogTitle>
							<DialogDescription className="text-slate-400">
								Complete incident and location information
							</DialogDescription>
						</DialogHeader>

						{selectedAlarm && (
							<div className="space-y-4">
								{/* Enhanced Compact Header with Branch Summary */}
								<div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600">
									<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
										{/* Company & Branch */}
										<div className="lg:col-span-2 flex items-center space-x-3">
											{selectedAlarm.branch?.company?.logo && (
												<div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
													<img
														src={
															selectedAlarm.branch.company.logo.startsWith(
																"http"
															)
																? selectedAlarm.branch.company.logo
																: `http://8436insight.et:3003${selectedAlarm.branch.company.logo.replace(
																		"/var/www/html/koppa-security-api",
																		""
																  )}`
														}
														alt={`${selectedAlarm.branch.company.name} logo`}
														className="h-10 w-10 object-cover rounded-lg"
														onError={(e) => {
															e.currentTarget.style.display = "none";
														}}
													/>
												</div>
											)}
											<div className="flex-1 min-w-0">
												<h3 className="text-lg font-bold text-white truncate">
													{selectedAlarm.branch?.company?.name ||
														"Unknown Company"}
												</h3>
												<div className="flex items-center space-x-2">
													<Building className="h-3 w-3 text-blue-400" />
													<span className="text-sm text-slate-300 truncate">
														{selectedAlarm.branch?.name}
													</span>
													<Badge
														variant="outline"
														className="text-xs bg-blue-900/30 border-blue-500 text-blue-300">
														{selectedAlarm.branch?.locationType}
													</Badge>
												</div>
											</div>
										</div>

										{/* Location & Contact */}
										<div className="space-y-1">
											<div className="flex items-center space-x-2">
												<MapPin className="h-3 w-3 text-green-400" />
												<span className="text-sm text-slate-300">
													{selectedAlarm.branch?.city}
													{selectedAlarm.branch?.subCity &&
														`, ${selectedAlarm.branch.subCity}`}
												</span>
											</div>
											<div className="flex items-center space-x-2">
												<User className="h-3 w-3 text-yellow-400" />
												<span className="text-sm text-slate-300">
													{selectedAlarm.branch?.managerName}
												</span>
											</div>
											<div className="flex items-center space-x-2">
												<Phone className="h-3 w-3 text-green-400" />
												<span className="text-sm text-slate-300 font-mono">
													{selectedAlarm.branch?.phoneNumber}
												</span>
											</div>
										</div>

										{/* Status & Actions */}
										<div className="flex flex-col items-end space-y-2">
											<div className="flex items-center space-x-2">
												{/* <Badge
													className={getSeverityColor(selectedAlarm.severity)}>
													{selectedAlarm.severity}
												</Badge> */}
												<Badge className={getStatusColor(selectedAlarm.status)}>
													{selectedAlarm.status}
												</Badge>
											</div>
											<span className="text-xs text-slate-400">
												ID: {selectedAlarm.id}
											</span>
										</div>
									</div>
								</div>

								{/* Full Width Google Map */}
								{(selectedAlarm.coordinates || selectedAlarm.latitude) && (
									<div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
										<div className="flex items-center justify-between mb-3">
											<h4 className="text-lg font-semibold text-white flex items-center">
												<Map className="h-5 w-5 text-red-400 mr-2" />
												Incident Location
											</h4>
											<div className="flex space-x-2">
												<Button
													variant="outline"
													size="sm"
													className="border-blue-600 text-blue-300 hover:bg-blue-900/30"
													onClick={() =>
														copyToClipboard(
															`${
																selectedAlarm.coordinates?.latitude ||
																selectedAlarm.latitude
															}, ${
																selectedAlarm.coordinates?.longitude ||
																selectedAlarm.longitude
															}`
														)
													}>
													<Copy className="h-3 w-3 mr-1" />
													Copy
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="border-purple-600 text-purple-300 hover:bg-purple-900/30"
													onClick={openInMaps}>
													<ExternalLink className="h-3 w-3 mr-1" />
													Maps
												</Button>
											</div>
										</div>
										<div className="w-full h-64 rounded-lg overflow-hidden border border-slate-600">
											<iframe
												src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&q=${
													selectedAlarm.coordinates?.latitude ||
													selectedAlarm.latitude
												},${
													selectedAlarm.coordinates?.longitude ||
													selectedAlarm.longitude
												}&zoom=16&maptype=roadmap`}
												width="100%"
												height="100%"
												style={{ border: 0 }}
												allowFullScreen
												loading="lazy"
												referrerPolicy="no-referrer-when-downgrade"
											/>
										</div>
									</div>
								)}

								{/* Combined Incident Details Card */}
								<div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
									<h4 className="text-lg font-semibold text-white mb-4 flex items-center">
										<Info className="h-5 w-5 text-blue-400 mr-2" />
										Incident Details
									</h4>

									<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
										{/* Left: Incident Information */}
										<div className="lg:col-span-2 space-y-4">
											<div>
												<Label className="text-slate-400 text-sm font-medium">
													Description
												</Label>
												<p className="text-white mt-1 bg-slate-900/50 p-3 rounded-lg border border-slate-600 text-sm">
													{selectedAlarm.description}
												</p>
											</div>

											{selectedAlarm.additionalNotes && (
												<div>
													<Label className="text-slate-400 text-sm font-medium">
														Additional Notes
													</Label>
													<p className="text-white mt-1 bg-slate-900/50 p-3 rounded-lg border border-slate-600 text-sm">
														{selectedAlarm.additionalNotes}
													</p>
												</div>
											)}

											{selectedAlarm.resolutionDescription && (
												<div>
													<Label className="text-slate-400 text-sm font-medium">
														Resolution
													</Label>
													<p className="text-white mt-1 bg-green-900/20 p-3 rounded-lg border border-green-700 text-sm">
														{selectedAlarm.resolutionDescription}
													</p>
												</div>
											)}

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
																	{formatDateTime(selectedAlarm.createdAt)}
																</span>
															</div>
															{selectedAlarm.createdBy && (
																<div className="space-y-1">
																	<div className="flex items-center space-x-2">
																		<User className="h-3 w-3 text-slate-400" />
																		<span className="text-slate-300 text-xs">
																			{selectedAlarm.createdBy.name}
																		</span>
																	</div>
																	<div className="flex items-center space-x-2">
																		<Mail className="h-3 w-3 text-slate-400" />
																		<span className="text-slate-300 text-xs font-mono">
																			{selectedAlarm.createdBy.email}
																		</span>
																	</div>
																</div>
															)}
														</div>
													</div>

													{/* Enhanced Acknowledged Section */}
													{selectedAlarm.reports &&
														selectedAlarm.reports.length > 0 &&
														selectedAlarm.reports[0].acknowledgedAt && (
															<div className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
																<div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
																<div className="flex-1">
																	<div className="flex items-center justify-between mb-1">
																		<span className="text-white text-sm font-medium">
																			Acknowledged
																		</span>
																		<span className="text-slate-400 text-xs">
																			{formatDateTime(
																				selectedAlarm.reports[0].acknowledgedAt
																			)}
																		</span>
																	</div>
																	<div className="space-y-1">
																		{selectedAlarm.reports[0]
																			.acknowledgedBy && (
																			<div className="flex items-center space-x-2">
																				<User className="h-3 w-3 text-slate-400" />
																				<span className="text-slate-300 text-xs">
																					By:{" "}
																					{
																						selectedAlarm.reports[0]
																							.acknowledgedBy.name
																					}
																				</span>
																			</div>
																		)}
																		{selectedAlarm.reports[0].assignedTo
																			?.company?.name && (
																			<div className="flex items-center space-x-2">
																				<Building className="h-3 w-3 text-slate-400" />
																				<span className="text-slate-300 text-xs">
																					Assigned to:{" "}
																					{
																						selectedAlarm.reports[0].assignedTo
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
													{selectedAlarm.reports &&
														selectedAlarm.reports.length > 0 &&
														selectedAlarm.reports[0].completedAt && (
															<div className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
																<div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
																<div className="flex-1">
																	<div className="flex items-center justify-between mb-1">
																		<span className="text-white text-sm font-medium">
																			Resolved
																		</span>
																		<span className="text-slate-400 text-xs">
																			{formatDateTime(
																				selectedAlarm.reports[0].completedAt
																			)}
																		</span>
																	</div>
																	<div className="space-y-1">
																		{selectedAlarm.reports[0].resolvedBy && (
																			<div className="flex items-center space-x-2">
																				<User className="h-3 w-3 text-slate-400" />
																				<span className="text-slate-300 text-xs">
																					By:{" "}
																					{
																						selectedAlarm.reports[0].resolvedBy
																							.name
																					}
																				</span>
																			</div>
																		)}
																		{selectedAlarm.reports[0].assignedTo
																			?.company?.name && (
																			<div className="flex items-center space-x-2">
																				<Building className="h-3 w-3 text-slate-400" />
																				<span className="text-slate-300 text-xs">
																					Company:{" "}
																					{
																						selectedAlarm.reports[0].assignedTo
																							.company.name
																					}
																				</span>
																			</div>
																		)}
																	</div>
																</div>
															</div>
														)}

													{/* Fallback for resolved status without completedAt */}
													{selectedAlarm.status === "RESOLVED" &&
														(!selectedAlarm.reports ||
															!selectedAlarm.reports[0]?.completedAt) && (
															<div className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
																<div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
																<div className="flex-1">
																	<div className="flex items-center justify-between">
																		<span className="text-white text-sm font-medium">
																			Resolved
																		</span>
																		<span className="text-slate-400 text-xs">
																			{formatDateTime(
																				selectedAlarm.updatedAt ||
																					selectedAlarm.createdAt
																			)}
																		</span>
																	</div>
																</div>
															</div>
														)}
												</div>
											</div>

											{/* Resolution Description - add this after the timeline */}
											{selectedAlarm.reports &&
												selectedAlarm.reports.length > 0 &&
												selectedAlarm.reports[0].resolutionDescription && (
													<div>
														<Label className="text-slate-400 text-sm font-medium">
															Resolution Description
														</Label>
														<p className="text-white mt-1 bg-green-900/20 p-3 rounded-lg border border-green-700 text-sm">
															{selectedAlarm.reports[0].resolutionDescription}
														</p>
													</div>
												)}

											{/* Assignment Information - add this as a new section */}
											{selectedAlarm.reports &&
												selectedAlarm.reports.length > 0 &&
												selectedAlarm.reports[0].assignedTo && (
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
																		{selectedAlarm.reports[0].assignedTo.company
																			?.name ||
																			selectedAlarm.reports[0].assignedTo.name}
																	</span>
																</div>
																<div className="flex items-center justify-between">
																	<span className="text-slate-400 text-sm">
																		Contact Person:
																	</span>
																	<span className="text-white text-sm">
																		{selectedAlarm.reports[0].assignedTo.name}
																	</span>
																</div>
																<div className="flex items-center justify-between">
																	<span className="text-slate-400 text-sm">
																		Status:
																	</span>
																	<Badge
																		variant="outline"
																		className={`text-xs ${
																			selectedAlarm.reports[0].status ===
																			"PENDING"
																				? "bg-yellow-900/30 border-yellow-500 text-yellow-300"
																				: selectedAlarm.reports[0].status ===
																				  "COMPLETED"
																				? "bg-green-900/30 border-green-500 text-green-300"
																				: "bg-slate-900/30 border-slate-500 text-slate-300"
																		}`}>
																		{selectedAlarm.reports[0].status}
																	</Badge>
																</div>
																{selectedAlarm.reports[0].notes && (
																	<div className="pt-2 border-t border-slate-600">
																		<span className="text-slate-400 text-sm">
																			Notes:
																		</span>
																		<p className="text-white text-sm mt-1">
																			{selectedAlarm.reports[0].notes}
																		</p>
																	</div>
																)}
															</div>
														</div>
													</div>
												)}

											{/* <div>
												<Label className="text-slate-400 text-sm font-medium mb-2 block">
													Timeline
												</Label>
												<div className="space-y-2">
													<div className="flex items-center space-x-3 p-2 bg-slate-900/50 rounded-lg">
														<div className="w-2 h-2 bg-red-400 rounded-full"></div>
														<div className="flex-1 flex items-center justify-between">
															<span className="text-white text-sm font-medium">
																Created
															</span>
															<span className="text-slate-400 text-xs">
																{new Date(
																	selectedAlarm.createdAt
																).toLocaleString()}
															</span>
														</div>
													</div>

													{selectedAlarm.acknowledgedAt && (
														<div className="flex items-center space-x-3 p-2 bg-slate-900/50 rounded-lg">
															<div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
															<div className="flex-1 flex items-center justify-between">
																<span className="text-white text-sm font-medium">
																	Acknowledged
																</span>
																<span className="text-slate-400 text-xs">
																	{new Date(
																		selectedAlarm.acknowledgedAt
																	).toLocaleString()}
																</span>
															</div>
														</div>
													)}

													{selectedAlarm.status === "RESOLVED" && (
														<div className="flex items-center space-x-3 p-2 bg-slate-900/50 rounded-lg">
															<div className="w-2 h-2 bg-green-400 rounded-full"></div>
															<div className="flex-1 flex items-center justify-between">
																<span className="text-white text-sm font-medium">
																	Resolved
																</span>
																<span className="text-slate-400 text-xs">
																	{new Date(
																		selectedAlarm.updatedAt ||
																			selectedAlarm.createdAt
																	).toLocaleString()}
																</span>
															</div>
														</div>
													)}
												</div>
											</div> */}
										</div>

										{/* Right: GPS & Quick Stats */}
										<div className="space-y-4">
											{/* GPS Coordinates */}
											<div>
												<Label className="text-slate-400 text-sm font-medium mb-2 block flex items-center">
													<MapPin className="h-4 w-4 text-green-400 mr-1" />
													GPS Coordinates
												</Label>
												<div className="bg-slate-900/50 p-3 rounded-lg border border-slate-600">
													<div className="space-y-1 text-sm">
														<div className="flex justify-between">
															<span className="text-slate-400">Lat:</span>
															<span className="text-white font-mono">
																{selectedAlarm.coordinates?.latitude?.toFixed(
																	6
																) ||
																	selectedAlarm.latitude ||
																	"N/A"}
															</span>
														</div>
														<div className="flex justify-between">
															<span className="text-slate-400">Lng:</span>
															<span className="text-white font-mono">
																{selectedAlarm.coordinates?.longitude?.toFixed(
																	6
																) ||
																	selectedAlarm.longitude ||
																	"N/A"}
															</span>
														</div>
													</div>
													{selectedAlarm.location && (
														<p className="text-slate-400 text-xs mt-2 pt-2 border-t border-slate-600">
															{selectedAlarm.location}
														</p>
													)}
												</div>
											</div>

											{/* Quick Stats */}
											<div>
												<Label className="text-slate-400 text-sm font-medium mb-2 block flex items-center">
													<Clock className="h-4 w-4 text-purple-400 mr-1" />
													Quick Stats
												</Label>
												<div className="grid grid-cols-2 gap-2">
													<div className="bg-slate-900/50 p-3 rounded-lg text-center">
														<div className="text-lg font-bold text-blue-400">
															{Math.floor(
																(Date.now() -
																	new Date(selectedAlarm.createdAt).getTime()) /
																	(1000 * 60)
															)}
														</div>
														<div className="text-xs text-slate-400">
															Min Ago
														</div>
													</div>
													<div className="bg-slate-900/50 p-3 rounded-lg text-center">
														<div className="text-lg font-bold text-purple-400">
															{selectedAlarm.severity === "CRITICAL"
																? "🔴"
																: selectedAlarm.severity === "HIGH"
																? "🟠"
																: selectedAlarm.severity === "MEDIUM"
																? "🟡"
																: "🟢"}
														</div>
														<div className="text-xs text-slate-400">
															Priority
														</div>
													</div>
												</div>
											</div>

											{/* Created By */}
											<div>
												<Label className="text-slate-400 text-sm font-medium mb-2 block">
													Created By
												</Label>
												<div className="bg-slate-900/50 p-3 rounded-lg border border-slate-600">
													<div className="flex items-center space-x-2">
														<User className="h-4 w-4 text-slate-400" />
														<span className="text-white text-sm">
															{selectedAlarm.createdBy?.name || "Unknown"}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
									<div className="flex flex-wrap gap-3">
										{selectedAlarm.status === "ACTIVE" && (
											<>
												<Button
													onClick={() =>
														changeAlarmStatus(selectedAlarm.id, "ACKNOWLEDGED")
													}
													disabled={updating}
													className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white">
													{updating ? (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													) : (
														<Eye className="h-4 w-4 mr-2" />
													)}
													Acknowledge
												</Button>
												<Button
													onClick={() =>
														changeAlarmStatus(selectedAlarm.id, "RESOLVED")
													}
													disabled={updating}
													className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
													{updating ? (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													) : (
														<CheckCircle className="h-4 w-4 mr-2" />
													)}
													Resolve
												</Button>
											</>
										)}

										{selectedAlarm.status === "ACKNOWLEDGED" && (
											<Button
												onClick={() => {
													setSelectedAlarm(selectedAlarm);
													setIsResolutionDialogOpen(true);
													setIsDetailsDialogOpen(false);
												}}
												className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
												<Target className="h-4 w-4 mr-2" />
												Resolve with Details
											</Button>
										)}

										<Button
											variant="outline"
											onClick={() => setIsDetailsDialogOpen(false)}
											className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
											<X className="h-4 w-4 mr-2" />
											Close
										</Button>
									</div>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Resolution Dialog */}
				<Dialog
					open={isResolutionDialogOpen}
					onOpenChange={setIsResolutionDialogOpen}>
					<DialogContent className="bg-slate-900 border-slate-700 text-white">
						<DialogHeader>
							<DialogTitle>Resolve Alarm</DialogTitle>
							<DialogDescription className="text-slate-400">
								Provide details about how this alarm was resolved
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div>
								<Label htmlFor="resolution" className="text-slate-300">
									Resolution Description
								</Label>
								<Textarea
									id="resolution"
									placeholder="Describe how the alarm was resolved..."
									value={resolutionDescription}
									onChange={(e) => setResolutionDescription(e.target.value)}
									className="bg-slate-800 border-slate-600 text-white mt-2"
									rows={4}
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => setIsResolutionDialogOpen(false)}
									className="border-slate-600 text-slate-300">
									Cancel
								</Button>
								<Button
									onClick={resolveAlarm}
									disabled={updating || !resolutionDescription.trim()}
									className="bg-green-600 hover:bg-green-700 text-white">
									{updating ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<CheckCircle className="h-4 w-4 mr-2" />
									)}
									Resolve Alarm
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
