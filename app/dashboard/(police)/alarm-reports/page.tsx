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
	// State management
	// const [alarms, setAlarms] = useState<any[]>([]);
	// const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
	const [resolutionDescription, setResolutionDescription] = useState("");
	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	// const [audioEnabled, setAudioEnabled] = useState(true);
	// const [modalEnabled, setModalEnabled] = useState(true);
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

	// WebSocket connection with real-time alarm handling
	// const { isConnected, userInfo } = useWebSocket(token, {
	// 	autoConnect: true,
	// 	onAlarmCreated: useCallback(
	// 		async (newAlarm: any) => {
	// 			console.log("🚨 New real-time alarm received:", newAlarm);

	// 			// Fetch complete branch data including company information
	// 			let branchData = {
	// 				id: newAlarm.branchId,
	// 				name: newAlarm.branchName || "Unknown Branch",
	// 				company: undefined,
	// 			};

	// 			try {
	// 				// Try to get complete branch data with company info
	// 				const branchResponse = await apiClient.getBranches();
	// 				const fullBranch = branchResponse?.find(
	// 					(b: any) => b.id === newAlarm.branchId
	// 				);
	// 				if (fullBranch && fullBranch.company) {
	// 					branchData = {
	// 						id: fullBranch.id,
	// 						name: fullBranch.name,
	// 						company: {
	// 							id: fullBranch.company.id,
	// 							name: fullBranch.company.name,
	// 							logo: fullBranch.company.logo,
	// 						},
	// 					} as any;
	// 					console.log(
	// 						"✅ Company data loaded for alarm:",
	// 						branchData.company
	// 					);
	// 				} else {
	// 					console.warn(
	// 						"⚠️ No company data found for branch:",
	// 						newAlarm.branchId
	// 					);
	// 				}
	// 			} catch (error) {
	// 				console.error("❌ Could not fetch complete branch data:", error);
	// 			}

	// 			// Transform the alarm data to match our interface
	// 			const transformedAlarm: any = {
	// 				id: newAlarm.id,
	// 				type: newAlarm.type,
	// 				branchId: newAlarm.branchId,
	// 				branch: branchData,
	// 				location: newAlarm.location || "",
	// 				latitude: newAlarm.latitude || "",
	// 				longitude: newAlarm.longitude || "",
	// 				coordinates: {
	// 					latitude: newAlarm.latitude
	// 						? Number(newAlarm.latitude)
	// 						: 9.0192 + (Math.random() - 0.5) * 0.1,
	// 					longitude: newAlarm.longitude
	// 						? Number(newAlarm.longitude)
	// 						: 38.7525 + (Math.random() - 0.5) * 0.1,
	// 				},
	// 				status: newAlarm.status || "ACTIVE",
	// 				severity: newAlarm.severity,
	// 				description: newAlarm.description,
	// 				additionalNotes: newAlarm.additionalNotes,
	// 				createdBy: {
	// 					id: newAlarm.createdBy?.id || "",
	// 					name: newAlarm.createdBy || "Unknown User",
	// 				},
	// 				createdAt: newAlarm.createdAt,
	// 				priority: newAlarm.priority || getSeverityPriority(newAlarm.severity),
	// 				isRealTime: true,
	// 			};

	// 			// Add to the beginning of alarms list and force re-render
	// 			setAlarms((prev) => {
	// 				const exists = prev.some((alarm) => alarm.id === transformedAlarm.id);
	// 				if (exists) {
	// 					// Update existing alarm with complete data
	// 					const updated = prev.map((alarm) =>
	// 						alarm.id === transformedAlarm.id ? transformedAlarm : alarm
	// 					);
	// 					console.log("🔄 Updated existing alarm with company data");
	// 					return updated;
	// 				}
	// 				console.log("➕ Added new alarm with company data");
	// 				return [transformedAlarm, ...prev];
	// 			});

	// 			// Small delay to ensure state is updated, then try to fetch company data again if missing
	// 			if (!branchData.company) {
	// 				setTimeout(async () => {
	// 					try {
	// 						console.log("🔄 Retrying company data fetch...");
	// 						const retryBranchResponse = await apiClient.getBranches();
	// 						const retryFullBranch = retryBranchResponse?.find(
	// 							(b: any) => b.id === newAlarm.branchId
	// 						);

	// 						if (retryFullBranch && retryFullBranch.company) {
	// 							setAlarms((prev) =>
	// 								prev.map((alarm) =>
	// 									alarm.id === transformedAlarm.id
	// 										? {
	// 												...alarm,
	// 												branch: {
	// 													...alarm.branch,
	// 													company: {
	// 														id: retryFullBranch.company.id,
	// 														name: retryFullBranch.company.name,
	// 														logo: retryFullBranch.company.logo,
	// 													},
	// 												},
	// 										  }
	// 										: alarm
	// 								)
	// 							);
	// 							console.log("✅ Company data loaded on retry");
	// 						}
	// 					} catch (retryError) {
	// 						console.error("❌ Retry failed:", retryError);
	// 					}
	// 				}, 1000);
	// 			}

	// 			// Rest of the existing code for audio alerts, notifications, etc.
	// 			if (audioEnabled && transformedAlarm.status === "ACTIVE") {
	// 				audioService.addActiveAlarm(
	// 					transformedAlarm.id,
	// 					transformedAlarm.severity
	// 				);
	// 			}

	// 			toast({
	// 				title: `🚨 ${newAlarm.severity} ALARM RECEIVED`,
	// 				description: `${newAlarm.type} at ${
	// 					newAlarm.branchName || newAlarm.location
	// 				}`,
	// 				variant: newAlarm.severity === "CRITICAL" ? "destructive" : "default",
	// 				duration: newAlarm.severity === "CRITICAL" ? 15000 : 10000,
	// 			});

	// 			if ("Notification" in window && Notification.permission === "granted") {
	// 				new Notification(`🚨 ${newAlarm.severity} EMERGENCY ALARM`, {
	// 					body: `${newAlarm.type} at ${
	// 						newAlarm.branchName || newAlarm.location
	// 					}`,
	// 					icon: "/favicon.ico",
	// 					tag: `alarm-${newAlarm.id}`,
	// 					requireInteraction: newAlarm.severity === "CRITICAL",
	// 				});
	// 			}
	// 		},
	// 		[audioEnabled, toast]
	// 	),

	// 	onAlarmUpdated: useCallback(
	// 		(updatedAlarm: any) => {
	// 			console.log("🔄 Alarm update received:", updatedAlarm);

	// 			setAlarms((prev) =>
	// 				prev.map((alarm) => {
	// 					if (alarm.id === updatedAlarm.id) {
	// 						const updated = {
	// 							...alarm,
	// 							status: updatedAlarm.status,
	// 							acknowledgedAt: updatedAlarm.acknowledgedAt,
	// 							completedAt: updatedAlarm.completedAt,
	// 							resolutionDescription: updatedAlarm.resolutionDescription,
	// 							isRealTime: true,
	// 						};

	// 						// Remove from audio alerts if acknowledged or resolved
	// 						if (updated.status !== "ACTIVE") {
	// 							audioService.removeActiveAlarm(updated.id);
	// 						}

	// 						return updated;
	// 					}
	// 					return alarm;
	// 				})
	// 			);

	// 			// Show update notification
	// 			if (updatedAlarm.status === "RESOLVED") {
	// 				toast({
	// 					title: "✅ Alarm Resolved",
	// 					description: `Alarm at ${
	// 						updatedAlarm.branchName || updatedAlarm.location
	// 					} has been resolved`,
	// 				});
	// 			} else if (updatedAlarm.status === "ACKNOWLEDGED") {
	// 				toast({
	// 					title: "👁️ Alarm Acknowledged",
	// 					description: `Alarm at ${
	// 						updatedAlarm.branchName || updatedAlarm.location
	// 					} has been acknowledged`,
	// 				});
	// 			}
	// 		},
	// 		[toast]
	// 	),

	// 	onSystemNotification: useCallback(
	// 		(notification: any) => {
	// 			toast({
	// 				title: "📢 System Notification",
	// 				description: notification.message,
	// 				variant:
	// 					notification.severity === "error" ? "destructive" : "default",
	// 			});
	// 		},
	// 		[toast]
	// 	),
	// });

	// Load current user info

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

	// const fetchAlarms = async () => {
	// 	try {
	// 		setLoading(true);
	// 		const response = await apiClient.getAlarms();
	// 		console.log("Fetched alarms from API:", response);

	// 		const alarmsWithCoords =
	// 			(response as any).alarms?.map((alarm: any) => ({
	// 				...alarm,
	// 				coordinates: {
	// 					latitude: alarm?.latitude
	// 						? Number(alarm?.latitude)
	// 						: 9.0192 + (Math.random() - 0.5) * 0.1,
	// 					longitude: alarm?.longitude
	// 						? Number(alarm?.longitude)
	// 						: 38.7525 + (Math.random() - 0.5) * 0.1,
	// 				},
	// 				isRealTime: false,
	// 			})) || [];

	// 		setAlarms(alarmsWithCoords);
	// 	} catch (error) {
	// 		console.error("Failed to fetch alarms:", error);
	// 		toast({
	// 			title: "Error",
	// 			description: "Failed to fetch alarms",
	// 			variant: "destructive",
	// 		});
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

	// const acknowledgeAlarm = async (alarmId: string) => {
	// 	try {
	// 		setUpdating(true);
	// 		await apiClient.updateAlarm(alarmId, {
	// 			status: "ACKNOWLEDGED",
	// 			acknowledgedAt: new Date().toISOString(),
	// 		});

	// 		toast({
	// 			title: "Success",
	// 			description: "Alarm acknowledged successfully",
	// 		});

	// 		// Update local state immediately
	// 		setAlarms((prev) =>
	// 			prev.map((alarm) =>
	// 				alarm.id === alarmId
	// 					? {
	// 							...alarm,
	// 							status: "ACKNOWLEDGED" as const,
	// 							acknowledgedAt: new Date().toISOString(),
	// 					  }
	// 					: alarm
	// 			)
	// 		);

	// 		// Remove from audio alerts
	// 		audioService.removeActiveAlarm(alarmId);
	// 	} catch (error: any) {
	// 		toast({
	// 			title: "Error",
	// 			description: error.message || "Failed to acknowledge alarm",
	// 			variant: "destructive",
	// 		});
	// 	} finally {
	// 		setUpdating(false);
	// 	}
	// };

	// const resolveAlarm = async () => {
	// 	if (!selectedAlarm) return;

	// 	try {
	// 		setUpdating(true);
	// 		await apiClient.updateAlarm(selectedAlarm.id, {
	// 			status: "RESOLVED",
	// 			completedAt: new Date().toISOString(),
	// 			resolutionDescription,
	// 		});

	// 		toast({
	// 			title: "Success",
	// 			description: "Alarm resolved successfully",
	// 		});

	// 		// Update local state
	// 		setAlarms((prev) =>
	// 			prev.map((alarm) =>
	// 				alarm.id === selectedAlarm.id
	// 					? {
	// 							...alarm,
	// 							status: "RESOLVED" as const,
	// 							completedAt: new Date().toISOString(),
	// 							resolutionDescription,
	// 					  }
	// 					: alarm
	// 			)
	// 		);

	// 		// Remove from audio alerts
	// 		audioService.removeActiveAlarm(selectedAlarm.id);

	// 		setIsResolutionDialogOpen(false);
	// 		setResolutionDescription("");
	// 		setSelectedAlarm(null);
	// 	} catch (error: any) {
	// 		toast({
	// 			title: "Error",
	// 			description: error.message || "Failed to resolve alarm",
	// 			variant: "destructive",
	// 		});
	// 	} finally {
	// 		setUpdating(false);
	// 	}
	// };

	// const changeAlarmStatus = async (
	// 	alarmId: string,
	// 	newStatus: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED"
	// ) => {
	// 	try {
	// 		setUpdating(true);
	// 		const updateData: any = {
	// 			status: newStatus,
	// 		};

	// 		if (newStatus === "ACKNOWLEDGED") {
	// 			updateData.acknowledgedAt = new Date().toISOString();
	// 		} else if (newStatus === "RESOLVED") {
	// 			updateData.completedAt = new Date().toISOString();
	// 			updateData.resolutionDescription =
	// 				resolutionDescription || "Status changed from modal";
	// 		}

	// 		await apiClient.updateAlarm(alarmId, updateData);

	// 		toast({
	// 			title: "Status Updated",
	// 			description: `Alarm status changed to ${newStatus}`,
	// 		});

	// 		// Update local state
	// 		setAlarms((prev) =>
	// 			prev.map((alarm) =>
	// 				alarm.id === alarmId ? { ...alarm, ...updateData } : alarm
	// 			)
	// 		);

	// 		// Remove from audio alerts if not active
	// 		if (newStatus !== "ACTIVE") {
	// 			audioService.removeActiveAlarm(alarmId);
	// 		}

	// 		setIsDetailsDialogOpen(false);
	// 	} catch (error: any) {
	// 		toast({
	// 			title: "Error",
	// 			description: error.message || "Failed to update alarm status",
	// 			variant: "destructive",
	// 		});
	// 	} finally {
	// 		setUpdating(false);
	// 	}
	// };

	const viewAlarmDetails = (alarmId: string) => {
		const alarm = alarms.find((a) => a.id === alarmId);
		if (alarm) {
			setSelectedAlarm(alarm);
			setIsDetailsDialogOpen(true);
		}
	};

	// Helper functions
	const getSeverityPriority = (severity: string): number => {
		switch (severity) {
			case "CRITICAL":
				return 1;
			case "HIGH":
				return 2;
			case "MEDIUM":
				return 3;
			case "LOW":
				return 4;
			default:
				return 5;
		}
	};

	const getSeverityColor = (severity: string) => {
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

	// Statistics
	// const alarmStats = useMemo(() => {
	// 	const total = alarms.length;
	// 	const active = alarms.filter((a) => a.status === "ACTIVE").length;
	// 	const acknowledged = alarms.filter(
	// 		(a) => a.status === "ACKNOWLEDGED"
	// 	).length;
	// 	const resolved = alarms.filter((a) => a.status === "RESOLVED").length;
	// 	const critical = alarms.filter((a) => a.severity === "CRITICAL").length;
	// 	const realTime = alarms.filter((a) => a.isRealTime).length;

	// 	return { total, active, acknowledged, resolved, critical, realTime };
	// }, [alarms]);

	// if (loading) {
	// 	return (
	// 		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
	// 			<div className="space-y-6">
	// 				<Skeleton className="h-32 w-full bg-slate-800" />
	// 				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
	// 					{[...Array(4)].map((_, i) => (
	// 						<Skeleton key={i} className="h-24 bg-slate-800" />
	// 					))}
	// 				</div>
	// 				<Skeleton className="h-96 w-full bg-slate-800" />
	// 			</div>
	// 		</div>
	// 	);
	// }

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
				{/* Persistent Alarm Modal */}
				{/* {modalEnabled && (
					<PersistentAlarmModal
						alarms={alarms}
						onAcknowledge={acknowledgeAlarm}
						onViewDetails={viewAlarmDetails}
						onStatusChange={changeAlarmStatus}
						isAcknowledging={updating}
					/>
				)} */}

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
											REAL-TIME CONNECTED
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
								{/* <Button
									variant="outline"
									size="sm"
									onClick={() => {
										setAudioEnabled(!audioEnabled);
										audioService.setEnabled(!audioEnabled);
									}}
									className={cn(
										"border-slate-600",
										audioEnabled
											? "bg-blue-600/20 text-blue-400"
											: "bg-slate-600/20 text-slate-400"
									)}
									title="Toggle audio alerts">
									{audioEnabled ? (
										<Volume2 className="h-4 w-4" />
									) : (
										<VolumeX className="h-4 w-4" />
									)}
								</Button> */}

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

								{/* Emergency Stop Button */}
								{/* <Button
									variant="outline"
									size="sm"
									onClick={() => audioService.forceStopAllAlerts()}
									className="border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600/40"
									title="Emergency stop all audio alerts">
									<StopCircle className="h-4 w-4" />
								</Button> */}

								{/* Test Audio Button */}
								{/* <Button
									variant="outline"
									size="sm"
									onClick={() => audioService.testAllSounds()}
									className="border-slate-600 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
									title="Test all alarm sounds">
									<TestTube className="h-4 w-4" />
								</Button> */}
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
									{/* <div className="flex items-center space-x-2">
										{audioService.isCurrentlyPlaying() ? (
											<Play className="h-5 w-5 text-red-400 animate-pulse" />
										) : (
											<Pause className="h-5 w-5 text-red-400" />
										)}
										<Volume2 className="h-5 w-5 text-red-400" />
									</div> */}
									<div>
										<span className="text-red-400 font-bold">
											🚨 ALERTS ACTIVE
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

					{/* Persistent Modal Status */}
					{/* {modalEnabled && alarmStats.active > 0 && (
						<div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4">
							<div className="flex items-center space-x-3">
								<Monitor className="h-5 w-5 text-purple-400" />
								<div>
									<span className="text-purple-400 font-bold">
										📱 MODAL ALERTS ACTIVE
									</span>
									<p className="text-purple-300 text-sm">
										{alarmStats.active} alarm
										{alarmStats.active !== 1 ? "s" : ""} showing persistent
										modal
									</p>
								</div>
							</div>
						</div>
					)} */}

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
				</div>

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

					{/* <Card className="bg-purple-900/20 border-purple-500/30">
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Zap className="h-5 w-5 text-purple-400" />
								<div>
									<p className="text-sm text-purple-300">Critical</p>
									<p className="text-2xl font-bold text-purple-400">
										{alarmStats.critical}
									</p>
								</div>
							</div>
						</CardContent>
					</Card> */}

					{/* <Card className="bg-cyan-900/20 border-cyan-500/30">
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Radio className="h-5 w-5 text-cyan-400" />
								<div>
									<p className="text-sm text-cyan-300">Real-time</p>
									<p className="text-2xl font-bold text-cyan-400">
										{alarmStats.realTime}
									</p>
								</div>
							</div>
						</CardContent>
					</Card> */}
				</div>

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
							<Select value={severityFilter} onValueChange={setSeverityFilter}>
								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
									<SelectValue placeholder="Filter by severity" />
								</SelectTrigger>
								<SelectContent className="bg-slate-800 border-slate-600">
									<SelectItem value="all">All Severity</SelectItem>
									<SelectItem value="CRITICAL">Critical</SelectItem>
									<SelectItem value="HIGH">High</SelectItem>
									<SelectItem value="MEDIUM">Medium</SelectItem>
									<SelectItem value="LOW">Low</SelectItem>
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
														<div className="flex items-center space-x-2">
															{alarm.isRealTime && (
																<Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse">
																	<Radio className="h-3 w-3 mr-1" />
																	LIVE
																</Badge>
															)}
															{alarm.status === "ACTIVE" && audioEnabled && (
																<Badge className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
																	<Volume2 className="h-3 w-3 mr-1" />
																	AUDIO
																</Badge>
															)}
														</div>
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
												<p className="text-slate-300 leading-relaxed">
													{alarm.description}
												</p>
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
							// <Card
							// 	key={alarm.id}
							// 	className={cn(
							// 		"bg-slate-900/50 border-slate-700 transition-all duration-300",
							// 		alarm.isRealTime &&
							// 			"ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20",
							// 		alarm.severity === "CRITICAL" &&
							// 			"border-red-500/50 bg-red-900/10",
							// 		alarm.status === "ACTIVE" &&
							// 			(audioEnabled || modalEnabled) &&
							// 			"ring-1 ring-red-400/30"
							// 	)}>
							// 	<CardContent className="p-6">
							// 		<div className="flex items-start justify-between">
							// 			<div className="flex-1 space-y-3">
							// 				<div className="flex items-center space-x-3">
							// 					{/* <Badge className={getSeverityColor(alarm.severity)}>
							// 						{alarm.severity}
							// 					</Badge> */}
							// 					<img
							// 						src={`http://8436insight.et:3003${(
							// 							alarm as any
							// 						)?.branch?.company?.logo.replace(
							// 							"/var/www/html/koppa-security-api",
							// 							""
							// 						)}`}
							// 						alt={`${alarm.branch.company?.name} logo`}
							// 						className="h-14 w-14 object-cover rounded-xl shadow-lg border border-slate-600"
							// 					/>

							// 					<h2>{alarm.branch.company?.name}</h2>
							// 					<h2>{alarm.branch?.name}</h2>

							// 					<Badge
							// 						variant="outline"
							// 						className={getStatusColor(alarm.status)}>
							// 						{alarm.status}
							// 					</Badge>
							// 					{/* {alarm.isRealTime && (
							// 						<Badge className="bg-cyan-600 text-white animate-pulse">
							// 							<Radio className="h-3 w-3 mr-1" />
							// 							LIVE
							// 						</Badge>
							// 					)}
							// 					{alarm.status === "ACTIVE" && audioEnabled && (
							// 						<Badge className="bg-red-600 text-white animate-pulse">
							// 							<Volume2 className="h-3 w-3 mr-1" />
							// 							AUDIO
							// 						</Badge>
							// 					)} */}
							// 					{/* {alarm.status === "ACTIVE" && modalEnabled && (
							// 						<Badge className="bg-purple-600 text-white animate-pulse">
							// 							<Monitor className="h-3 w-3 mr-1" />
							// 							MODAL
							// 						</Badge>
							// 					)} */}
							// 					<Badge className="bg-gray-800 text-white">
							// 						<span className="text-sm text-slate-400 font-mono">
							// 							#{alarm.id.slice(-8)}
							// 						</span>
							// 					</Badge>
							// 				</div>

							// 				<div>
							// 					<h3 className="text-lg font-semibold text-white mb-1">
							// 						{alarm.type}
							// 					</h3>
							// 					<p className="text-slate-300">{alarm.description}</p>
							// 				</div>

							// 				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							// 					<div className="flex items-center space-x-2">
							// 						<MapPin className="h-4 w-4 text-slate-400" />
							// 						<span className="text-slate-300">
							// 							{alarm.branch.name}
							// 						</span>
							// 					</div>
							// 					<div className="flex items-center space-x-2">
							// 						<Users className="h-4 w-4 text-slate-400" />
							// 						<span className="text-slate-300">
							// 							{alarm.createdBy.name}
							// 						</span>
							// 					</div>
							// 					<div className="flex items-center space-x-2">
							// 						<Calendar className="h-4 w-4 text-slate-400" />
							// 						<span className="text-slate-300">
							// 							{new Date(alarm.createdAt).toLocaleString()}
							// 						</span>
							// 					</div>
							// 				</div>

							// 				{alarm.location && (
							// 					<div className="flex items-center space-x-2 text-sm">
							// 						<Navigation className="h-4 w-4 text-slate-400" />
							// 						<span className="text-slate-300">
							// 							{alarm.location}
							// 						</span>
							// 					</div>
							// 				)}
							// 			</div>

							// 			<div className="flex flex-col space-y-2 ml-4">
							// 				<Button
							// 					variant="outline"
							// 					size="sm"
							// 					onClick={() => viewAlarmDetails(alarm.id)}
							// 					className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
							// 					<Eye className="h-4 w-4 mr-2" />
							// 					Details
							// 				</Button>

							// 				{alarm.status === "ACTIVE" && (
							// 					<Button
							// 						variant="outline"
							// 						size="sm"
							// 						onClick={() => acknowledgeAlarm(alarm.id)}
							// 						disabled={updating}
							// 						className="border-yellow-600 bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40">
							// 						{updating ? (
							// 							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							// 						) : (
							// 							<CheckCircle className="h-4 w-4 mr-2" />
							// 						)}
							// 						Acknowledge
							// 					</Button>
							// 				)}

							// 				{alarm.status === "ACKNOWLEDGED" && (
							// 					<Button
							// 						variant="outline"
							// 						size="sm"
							// 						onClick={() => {
							// 							setSelectedAlarm(alarm);
							// 							setIsResolutionDialogOpen(true);
							// 						}}
							// 						className="border-green-600 bg-green-600/20 text-green-300 hover:bg-green-600/40">
							// 						<Target className="h-4 w-4 mr-2" />
							// 						Resolve
							// 					</Button>
							// 				)}
							// 			</div>
							// 		</div>
							// 	</CardContent>
							// </Card>
						))
					)}
				</div>

				{/* Alarm Details Dialog */}
				{/* Enhanced Alarm Details Dialog */}
				<Dialog
					open={isDetailsDialogOpen}
					onOpenChange={setIsDetailsDialogOpen}>
					<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold flex items-center space-x-3">
								<AlertTriangle className="h-6 w-6 text-red-400" />
								<span>Alarm Details - {selectedAlarm?.type}</span>
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
												<Badge
													className={getSeverityColor(selectedAlarm.severity)}>
													{selectedAlarm.severity}
												</Badge>
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

											{/* Timeline */}
											<div>
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
											</div>
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

										{selectedAlarm.status === "RESOLVED" && (
											<Button
												onClick={() =>
													changeAlarmStatus(selectedAlarm.id, "ACTIVE")
												}
												disabled={updating}
												className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white">
												{updating ? (
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												) : (
													<AlertTriangle className="h-4 w-4 mr-2" />
												)}
												Reopen
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
