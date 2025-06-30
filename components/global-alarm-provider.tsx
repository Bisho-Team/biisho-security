"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiClient } from "@/lib/api";
import { audioService } from "@/lib/audio-service";
import { PersistentAlarmModal } from "@/components/persistent-alarm-modal";

interface Alarm {
	id: string;
	alarmCode?: string; // Optional for real-time alarms
	type: string;
	branchId: string;
	branch: {
		id: string;
		name: string;
		company?: {
			// id: string;
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
		email: string; // Added email for createdBy
	};
	createdAt: string;
	acknowledgedAt?: string;
	completedAt?: string;
	resolutionDescription?: string;
	responseTime?: string;
	priority?: number;
	isRealTime?: boolean;
}

interface GlobalAlarmContextType {
	alarms: Alarm[];
	activeAlarms: Alarm[];
	isConnected: boolean;
	audioEnabled: boolean;
	modalEnabled: boolean;
	setAudioEnabled: (enabled: boolean) => void;
	setModalEnabled: (enabled: boolean) => void;
	acknowledgeAlarm: (alarmId: string) => Promise<void>;
	updateAlarmStatus: (
		alarmId: string,
		status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED",
		resolutionDescription?: string
	) => Promise<void>;
	refreshAlarms: () => Promise<void>;
	getAlarmStats: () => {
		total: number;
		active: number;
		acknowledged: number;
		resolved: number;
		critical: number;
		realTime: number;
	};
}

const GlobalAlarmContext = createContext<GlobalAlarmContextType | undefined>(
	undefined
);

export function useGlobalAlarms() {
	const context = useContext(GlobalAlarmContext);
	if (context === undefined) {
		throw new Error(
			"useGlobalAlarms must be used within a GlobalAlarmProvider"
		);
	}
	return context;
}

interface GlobalAlarmProviderProps {
	children: ReactNode;
}

export function GlobalAlarmProvider({ children }: GlobalAlarmProviderProps) {
	// State management
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [modalEnabled, setModalEnabled] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);
	const [updating, setUpdating] = useState(false);

	const { toast } = useToast();
	const pathname = usePathname();

	// Get authentication token
	const token =
		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

	// Check if current page should show alarms (dashboard pages only)
	const isDashboardPage = pathname?.startsWith("/dashboard");
	const shouldShowAlarms = isDashboardPage && modalEnabled;

	// Helper function to get severity priority
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

	// WebSocket connection with real-time alarm handling
	const { isConnected, userInfo } = useWebSocket(token, {
		autoConnect: isDashboardPage,
		onAlarmCreated: useCallback(
			async (newAlarm: any) => {
				console.log("🚨 [GLOBAL] New real-time alarm received:", newAlarm);

				let branchData = {
					id: newAlarm.branchId,
					name: newAlarm.branchName || "Unknown Branch",
					locationType: newAlarm.branchlocationType || "N/A",
					gpsAddress: newAlarm.branchgpsAddress || "N/A",
					city: newAlarm.branchcity || "N/A",
					subCity: newAlarm.branchsubCity || "N/A",
					woreda: newAlarm.branchworeda || "N/A",
					country: newAlarm.branchcountry || "N/A",
					managerName: newAlarm.branchmanagerName || "N/A",
					phoneNumber: newAlarm.branchphoneNumber || "N/A",
					contactNumber1: newAlarm.branchcontactNumber1 || "N/A",

					company: {
						name: newAlarm.companyName || "Unknown Company",
						logo: newAlarm.companyLogo || null,
					},
				};

				// try {
				// 	// Try to get complete branch data with company info
				// 	const branchResponse = await apiClient.getBranches();
				// 	const fullBranch = branchResponse?.find(
				// 		(b: any) => b.id === newAlarm.branchId
				// 	);
				// 	if (fullBranch && fullBranch.company) {
				// 		branchData = {
				// 			id: fullBranch.id,
				// 			name: fullBranch.name,
				// 			company: {
				// 				id: fullBranch.company.id,
				// 				name: fullBranch.company.name,
				// 				logo: fullBranch.company.logo,
				// 			},
				// 		};
				// 		console.log(
				// 			"✅ [GLOBAL] Company data loaded for alarm:",
				// 			branchData.company
				// 		);
				// 	} else {
				// 		console.warn(
				// 			"⚠️ [GLOBAL] No company data found for branch:",
				// 			newAlarm.branchId
				// 		);
				// 	}
				// } catch (error) {
				// 	console.error(
				// 		"❌ [GLOBAL] Could not fetch complete branch data:",
				// 		error
				// 	);
				// }

				// Transform the alarm data to match our interface

				const transformedAlarm: Alarm = {
					id: newAlarm.id,
					alarmCode: newAlarm.alarmCode || newAlarm.id,
					type: newAlarm.type,
					branchId: newAlarm.branchId,
					branch: branchData,
					location: newAlarm.location || "",
					latitude: newAlarm.latitude || "",
					longitude: newAlarm.longitude || "",
					coordinates: {
						latitude: newAlarm.latitude
							? Number(newAlarm.latitude)
							: 9.0192 + (Math.random() - 0.5) * 0.1,
						longitude: newAlarm.longitude
							? Number(newAlarm.longitude)
							: 38.7525 + (Math.random() - 0.5) * 0.1,
					},
					status: newAlarm.status || "ACTIVE",
					severity: newAlarm.severity,
					description: newAlarm.description,
					additionalNotes: newAlarm.additionalNotes,
					createdBy: {
						id: newAlarm.createdBy?.id || "",
						name: newAlarm.createdBy || "Unknown User",
						email: newAlarm.createdByEmail || "N/A",
					},
					createdAt: newAlarm.createdAt,
					priority: newAlarm.priority || getSeverityPriority(newAlarm.severity),
					isRealTime: true,
				};

				// Add to the beginning of alarms list and force re-render
				setAlarms((prev) => {
					const exists = prev.some((alarm) => alarm.id === transformedAlarm.id);
					if (exists) {
						// Update existing alarm with complete data
						const updated = prev.map((alarm) =>
							alarm.id === transformedAlarm.id ? transformedAlarm : alarm
						);
						console.log("🔄 [GLOBAL] Updated existing alarm with company data");
						return updated;
					}
					console.log("➕ [GLOBAL] Added new alarm with company data");
					return [transformedAlarm, ...prev];
				});

				// Small delay to ensure state is updated, then try to fetch company data again if missing
				if (!branchData.company) {
					setTimeout(async () => {
						try {
							console.log("🔄 [GLOBAL] Retrying company data fetch...");
							const retryBranchResponse = await apiClient.getBranches();
							const retryFullBranch = retryBranchResponse?.find(
								(b: any) => b.id === newAlarm.branchId
							);

							if (retryFullBranch && retryFullBranch.company) {
								setAlarms((prev) =>
									prev.map((alarm) =>
										alarm.id === transformedAlarm.id
											? {
													...alarm,
													branch: {
														...alarm.branch,
														company: {
															id: retryFullBranch.company.id,
															name: retryFullBranch.company.name,
															logo: retryFullBranch.company.logo,
														},
													},
											  }
											: alarm
									)
								);
								console.log("✅ [GLOBAL] Company data loaded on retry");
							}
						} catch (retryError) {
							console.error("❌ [GLOBAL] Retry failed:", retryError);
						}
					}, 1000);
				}

				// Audio alerts
				if (audioEnabled && transformedAlarm.status === "ACTIVE") {
					audioService.addActiveAlarm(
						transformedAlarm.id,
						transformedAlarm.severity
					);
				}

				// Show toast notification
				toast({
					title: `🚨 ${newAlarm.severity} ALARM RECEIVED`,
					description: `${newAlarm.type} at ${
						newAlarm.branchName || newAlarm.location
					}`,
					variant: newAlarm.severity === "CRITICAL" ? "destructive" : "default",
					duration: newAlarm.severity === "CRITICAL" ? 15000 : 10000,
				});

				// Browser notification
				if ("Notification" in window && Notification.permission === "granted") {
					new Notification(`🚨 ${newAlarm.severity} EMERGENCY ALARM`, {
						body: `${newAlarm.type} at ${
							newAlarm.branchName || newAlarm.location
						}`,
						icon: "/favicon.ico",
						tag: `alarm-${newAlarm.id}`,
						requireInteraction: newAlarm.severity === "CRITICAL",
					});
				}

				// Page title notification for critical alarms
				if (newAlarm.severity === "CRITICAL") {
					const originalTitle = document.title;
					let blinkCount = 0;
					const blinkInterval = setInterval(() => {
						document.title =
							blinkCount % 2 === 0 ? "🚨 CRITICAL ALARM!" : originalTitle;
						blinkCount++;
						if (blinkCount >= 10) {
							clearInterval(blinkInterval);
							document.title = originalTitle;
						}
					}, 1000);
				}
			},
			[audioEnabled, toast]
		),

		onAlarmUpdated: useCallback(
			(updatedAlarm: any) => {
				console.log("🔄 [GLOBAL] Alarm update received:", updatedAlarm);

				setAlarms((prev) =>
					prev.map((alarm) => {
						if (alarm.id === updatedAlarm.id) {
							const updated = {
								...alarm,
								status: updatedAlarm.status,
								acknowledgedAt: updatedAlarm.acknowledgedAt,
								completedAt: updatedAlarm.completedAt,
								resolutionDescription: updatedAlarm.resolutionDescription,
								isRealTime: true,
							};

							// Remove from audio alerts if acknowledged or resolved
							if (updated.status !== "ACTIVE") {
								audioService.removeActiveAlarm(updated.id);
							}

							return updated;
						}
						return alarm;
					})
				);

				// Show update notification
				if (updatedAlarm.status === "RESOLVED") {
					toast({
						title: "✅ Alarm Resolved",
						description: `Alarm at ${
							updatedAlarm.branchName || updatedAlarm.location
						} has been resolved`,
					});
				} else if (updatedAlarm.status === "ACKNOWLEDGED") {
					toast({
						title: "👁️ Alarm Acknowledged",
						description: `Alarm at ${
							updatedAlarm.branchName || updatedAlarm.location
						} has been acknowledged`,
					});
				}
			},
			[toast]
		),

		onSystemNotification: useCallback(
			(notification: any) => {
				toast({
					title: "📢 System Notification",
					description: notification.message,
					variant:
						notification.severity === "error" ? "destructive" : "default",
				});
			},
			[toast]
		),
	});

	// Initialize alarms on mount
	useEffect(() => {
		if (isDashboardPage && !isInitialized) {
			refreshAlarms();
			setIsInitialized(true);
		}
	}, [isDashboardPage, isInitialized]);

	// Update audio service whenever alarms change
	useEffect(() => {
		if (audioEnabled) {
			audioService.updateActiveAlarms(alarms);
		}
	}, [alarms, audioEnabled]);

	// Initialize audio service settings
	useEffect(() => {
		audioService.setEnabled(audioEnabled);
	}, [audioEnabled]);

	// Request notification permission on component mount
	useEffect(() => {
		if (
			isDashboardPage &&
			"Notification" in window &&
			Notification.permission === "default"
		) {
			Notification.requestPermission().then((permission) => {
				console.log(`[GLOBAL] Notification permission: ${permission}`);
			});
		}
	}, [isDashboardPage]);

	// Refresh alarms function
	const refreshAlarms = async () => {
		try {
			console.log("🔄 [GLOBAL] Refreshing alarms...");
			const response = await apiClient.getAlarms();

			console.log({
				response,
			});

			const alarmsWithCoords =
				(response as any).alarms?.map((alarm: any) => ({
					...alarm,
					coordinates: {
						latitude: alarm?.latitude
							? Number(alarm?.latitude)
							: 9.0192 + (Math.random() - 0.5) * 0.1,
						longitude: alarm?.longitude
							? Number(alarm?.longitude)
							: 38.7525 + (Math.random() - 0.5) * 0.1,
					},
					isRealTime: false,
				})) || [];

			setAlarms(alarmsWithCoords);
			console.log(`✅ [GLOBAL] Loaded ${alarmsWithCoords.length} alarms`);
		} catch (error) {
			console.error("❌ [GLOBAL] Failed to fetch alarms:", error);
			toast({
				title: "Error",
				description: "Failed to fetch alarms",
				variant: "destructive",
			});
		}
	};

	// Acknowledge alarm function
	const acknowledgeAlarm = async (alarmId: string) => {
		try {
			setUpdating(true);
			await apiClient.updateAlarm(alarmId, {
				status: "ACKNOWLEDGED",
				acknowledgedAt: new Date().toISOString(),
			});

			toast({
				title: "Success",
				description: "Alarm acknowledged successfully",
			});

			// Update local state immediately
			setAlarms((prev) =>
				prev.map((alarm) =>
					alarm.id === alarmId
						? {
								...alarm,
								status: "ACKNOWLEDGED" as const,
								acknowledgedAt: new Date().toISOString(),
						  }
						: alarm
				)
			);

			// Remove from audio alerts
			audioService.removeActiveAlarm(alarmId);
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message || "Failed to acknowledge alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	// Update alarm status function
	const updateAlarmStatus = async (
		alarmId: string,
		newStatus: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED",
		resolutionDescription?: string
	) => {
		try {
			setUpdating(true);
			const updateData: any = {
				status: newStatus,
			};

			if (newStatus === "ACKNOWLEDGED") {
				updateData.acknowledgedAt = new Date().toISOString();
			} else if (newStatus === "RESOLVED") {
				updateData.completedAt = new Date().toISOString();
				updateData.resolutionDescription =
					resolutionDescription || "Status changed from modal";
			}

			await apiClient.updateAlarm(alarmId, updateData);

			toast({
				title: "Status Updated",
				description: `Alarm status changed to ${newStatus}`,
			});

			// Update local state
			setAlarms((prev) =>
				prev.map((alarm) =>
					alarm.id === alarmId ? { ...alarm, ...updateData } : alarm
				)
			);

			// Remove from audio alerts if not active
			if (newStatus !== "ACTIVE") {
				audioService.removeActiveAlarm(alarmId);
			}
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message || "Failed to update alarm status",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	// View alarm details function (navigate to alarm reports)
	const viewAlarmDetails = (alarmId: string) => {
		// Store the alarm ID in session storage so the alarm reports page can highlight it
		sessionStorage.setItem("highlightAlarmId", alarmId);
		// Navigate to alarm reports page
		window.location.href = "/dashboard/alarm-reports";
	};

	// Computed values
	const activeAlarms = alarms.filter((alarm) => alarm.status === "ACTIVE");

	const getAlarmStats = () => {
		const total = alarms.length;
		const active = alarms.filter((a) => a.status === "ACTIVE").length;
		const acknowledged = alarms.filter(
			(a) => a.status === "ACKNOWLEDGED"
		).length;
		const resolved = alarms.filter((a) => a.status === "RESOLVED").length;
		const critical = alarms.filter((a) => a.severity === "CRITICAL").length;
		const realTime = alarms.filter((a) => a.isRealTime).length;

		return { total, active, acknowledged, resolved, critical, realTime };
	};

	// Context value
	const contextValue: GlobalAlarmContextType = {
		alarms,
		activeAlarms,
		isConnected,
		audioEnabled,
		modalEnabled,
		setAudioEnabled,
		setModalEnabled,
		acknowledgeAlarm,
		updateAlarmStatus,
		refreshAlarms,
		getAlarmStats,
	};

	return (
		<GlobalAlarmContext.Provider value={contextValue}>
			{children}

			{/* Global Persistent Alarm Modal - Only show on dashboard pages */}
			{shouldShowAlarms && (
				<PersistentAlarmModal
					alarms={activeAlarms as any}
					onAcknowledge={acknowledgeAlarm}
					onViewDetails={viewAlarmDetails}
					onStatusChange={updateAlarmStatus}
					isAcknowledging={updating}
				/>
			)}
		</GlobalAlarmContext.Provider>
	);
}
// "use client";

// import {
// 	createContext,
// 	useContext,
// 	useState,
// 	useEffect,
// 	useCallback,
// 	type ReactNode,
// } from "react";
// import { usePathname } from "next/navigation";
// import { useToast } from "@/hooks/use-toast";
// import { useWebSocket } from "@/hooks/use-websocket";
// import { apiClient } from "@/lib/api";
// import { audioService } from "@/lib/audio-service";
// import { PersistentAlarmModal } from "@/components/persistent-alarm-modal";

// interface Alarm {
// 	id: string;
// 	type: string;
// 	branchId: string;
// 	branch: {
// 		id: string;
// 		name: string;
// 		company?: {
// 			name: string;
// 			logo?: string;
// 		};
// 	};
// 	location: string;
// 	latitude: string;
// 	longitude: string;
// 	coordinates?: {
// 		latitude: number;
// 		longitude: number;
// 	};
// 	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	additionalNotes?: string;
// 	createdBy: {
// 		id: string;
// 		name: string;
// 	};
// 	createdAt: string;
// 	acknowledgedAt?: string;
// 	completedAt?: string;
// 	resolutionDescription?: string;
// 	responseTime?: string;
// 	priority?: number;
// 	isRealTime?: boolean;
// }

// interface GlobalAlarmContextType {
// 	alarms: Alarm[];
// 	activeAlarms: Alarm[];
// 	isConnected: boolean;
// 	audioEnabled: boolean;
// 	modalEnabled: boolean;
// 	setAudioEnabled: (enabled: boolean) => void;
// 	setModalEnabled: (enabled: boolean) => void;
// 	acknowledgeAlarm: (alarmId: string) => Promise<void>;
// 	updateAlarmStatus: (
// 		alarmId: string,
// 		status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED",
// 		resolutionDescription?: string
// 	) => Promise<void>;
// 	refreshAlarms: () => Promise<void>;
// 	getAlarmStats: () => {
// 		total: number;
// 		active: number;
// 		acknowledged: number;
// 		resolved: number;
// 		critical: number;
// 		realTime: number;
// 	};
// }

// const GlobalAlarmContext = createContext<GlobalAlarmContextType | undefined>(
// 	undefined
// );

// export function useGlobalAlarms() {
// 	const context = useContext(GlobalAlarmContext);
// 	if (context === undefined) {
// 		throw new Error(
// 			"useGlobalAlarms must be used within a GlobalAlarmProvider"
// 		);
// 	}
// 	return context;
// }

// interface GlobalAlarmProviderProps {
// 	children: ReactNode;
// }

// export function GlobalAlarmProvider({ children }: GlobalAlarmProviderProps) {
// 	// State management
// 	const [alarms, setAlarms] = useState<Alarm[]>([]);
// 	const [audioEnabled, setAudioEnabled] = useState(true);
// 	const [modalEnabled, setModalEnabled] = useState(true);
// 	const [isInitialized, setIsInitialized] = useState(false);
// 	const [updating, setUpdating] = useState(false);

// 	const { toast } = useToast();
// 	const pathname = usePathname();

// 	// Get authentication token
// 	const token =
// 		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

// 	// Check if current page should show alarms (dashboard pages only)
// 	const isDashboardPage = pathname?.startsWith("/dashboard");
// 	const shouldShowAlarms = isDashboardPage && modalEnabled;

// 	// Helper function to get severity priority
// 	const getSeverityPriority = (severity: string): number => {
// 		switch (severity) {
// 			case "CRITICAL":
// 				return 1;
// 			case "HIGH":
// 				return 2;
// 			case "MEDIUM":
// 				return 3;
// 			case "LOW":
// 				return 4;
// 			default:
// 				return 5;
// 		}
// 	};

// 	// WebSocket connection with real-time alarm handling
// 	const { isConnected, userInfo } = useWebSocket(token, {
// 		autoConnect: isDashboardPage,
// 		onAlarmCreated: useCallback(
// 			async (newAlarm: any) => {
// 				console.log("🚨 [GLOBAL] New real-time alarm received:", newAlarm);

// 				// Fetch complete branch data including company information
// 				let branchData = {
// 					id: newAlarm.branchId,
// 					name: newAlarm.branchName || "Unknown Branch",
// 					company: undefined,
// 				};

// 				try {
// 					// Try to get complete branch data with company info
// 					const branchResponse = await apiClient.getBranches();
// 					const fullBranch = branchResponse?.find(
// 						(b: any) => b.id === newAlarm.branchId
// 					);
// 					if (fullBranch && fullBranch.company) {
// 						branchData = {
// 							id: fullBranch.id,
// 							name: fullBranch.name,
// 							company: {
// 								id: fullBranch.company.id,
// 								name: fullBranch.company.name,
// 								logo: fullBranch.company.logo,
// 							},
// 						};
// 						console.log(
// 							"✅ [GLOBAL] Company data loaded for alarm:",
// 							branchData.company
// 						);
// 					} else {
// 						console.warn(
// 							"⚠️ [GLOBAL] No company data found for branch:",
// 							newAlarm.branchId
// 						);
// 					}
// 				} catch (error) {
// 					console.error(
// 						"❌ [GLOBAL] Could not fetch complete branch data:",
// 						error
// 					);
// 				}

// 				// Transform the alarm data to match our interface
// 				const transformedAlarm: Alarm = {
// 					id: newAlarm.id,
// 					type: newAlarm.type,
// 					branchId: newAlarm.branchId,
// 					branch: branchData,
// 					location: newAlarm.location || "",
// 					latitude: newAlarm.latitude || "",
// 					longitude: newAlarm.longitude || "",
// 					coordinates: {
// 						latitude: newAlarm.latitude
// 							? Number(newAlarm.latitude)
// 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// 						longitude: newAlarm.longitude
// 							? Number(newAlarm.longitude)
// 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// 					},
// 					status: newAlarm.status || "ACTIVE",
// 					severity: newAlarm.severity,
// 					description: newAlarm.description,
// 					additionalNotes: newAlarm.additionalNotes,
// 					createdBy: {
// 						id: newAlarm.createdBy?.id || "",
// 						name: newAlarm.createdBy || "Unknown User",
// 					},
// 					createdAt: newAlarm.createdAt,
// 					priority: newAlarm.priority || getSeverityPriority(newAlarm.severity),
// 					isRealTime: true,
// 				};

// 				// Add to the beginning of alarms list and force re-render
// 				setAlarms((prev) => {
// 					const exists = prev.some((alarm) => alarm.id === transformedAlarm.id);
// 					if (exists) {
// 						// Update existing alarm with complete data
// 						const updated = prev.map((alarm) =>
// 							alarm.id === transformedAlarm.id ? transformedAlarm : alarm
// 						);
// 						console.log("🔄 [GLOBAL] Updated existing alarm with company data");
// 						return updated;
// 					}
// 					console.log("➕ [GLOBAL] Added new alarm with company data");
// 					return [transformedAlarm, ...prev];
// 				});

// 				// Small delay to ensure state is updated, then try to fetch company data again if missing
// 				if (!branchData.company) {
// 					setTimeout(async () => {
// 						try {
// 							console.log("🔄 [GLOBAL] Retrying company data fetch...");
// 							const retryBranchResponse = await apiClient.getBranches();
// 							const retryFullBranch = retryBranchResponse?.find(
// 								(b: any) => b.id === newAlarm.branchId
// 							);

// 							if (retryFullBranch && retryFullBranch.company) {
// 								setAlarms((prev) =>
// 									prev.map((alarm) =>
// 										alarm.id === transformedAlarm.id
// 											? {
// 													...alarm,
// 													branch: {
// 														...alarm.branch,
// 														company: {
// 															id: retryFullBranch.company.id,
// 															name: retryFullBranch.company.name,
// 															logo: retryFullBranch.company.logo,
// 														},
// 													},
// 											  }
// 											: alarm
// 									)
// 								);
// 								console.log("✅ [GLOBAL] Company data loaded on retry");
// 							}
// 						} catch (retryError) {
// 							console.error("❌ [GLOBAL] Retry failed:", retryError);
// 						}
// 					}, 1000);
// 				}

// 				// Audio alerts
// 				if (audioEnabled && transformedAlarm.status === "ACTIVE") {
// 					audioService.addActiveAlarm(
// 						transformedAlarm.id,
// 						transformedAlarm.severity
// 					);
// 				}

// 				// Show toast notification
// 				toast({
// 					title: `🚨 ${newAlarm.severity} ALARM RECEIVED`,
// 					description: `${newAlarm.type} at ${
// 						newAlarm.branchName || newAlarm.location
// 					}`,
// 					variant: newAlarm.severity === "CRITICAL" ? "destructive" : "default",
// 					duration: newAlarm.severity === "CRITICAL" ? 15000 : 10000,
// 				});

// 				// Browser notification
// 				if ("Notification" in window && Notification.permission === "granted") {
// 					new Notification(`🚨 ${newAlarm.severity} EMERGENCY ALARM`, {
// 						body: `${newAlarm.type} at ${
// 							newAlarm.branchName || newAlarm.location
// 						}`,
// 						icon: "/favicon.ico",
// 						tag: `alarm-${newAlarm.id}`,
// 						requireInteraction: newAlarm.severity === "CRITICAL",
// 					});
// 				}

// 				// Page title notification for critical alarms
// 				if (newAlarm.severity === "CRITICAL") {
// 					const originalTitle = document.title;
// 					let blinkCount = 0;
// 					const blinkInterval = setInterval(() => {
// 						document.title =
// 							blinkCount % 2 === 0 ? "🚨 CRITICAL ALARM!" : originalTitle;
// 						blinkCount++;
// 						if (blinkCount >= 10) {
// 							clearInterval(blinkInterval);
// 							document.title = originalTitle;
// 						}
// 					}, 1000);
// 				}
// 			},
// 			[audioEnabled, toast]
// 		),

// 		onAlarmUpdated: useCallback(
// 			(updatedAlarm: any) => {
// 				console.log("🔄 [GLOBAL] Alarm update received:", updatedAlarm);

// 				setAlarms((prev) =>
// 					prev.map((alarm) => {
// 						if (alarm.id === updatedAlarm.id) {
// 							const updated = {
// 								...alarm,
// 								status: updatedAlarm.status,
// 								acknowledgedAt: updatedAlarm.acknowledgedAt,
// 								completedAt: updatedAlarm.completedAt,
// 								resolutionDescription: updatedAlarm.resolutionDescription,
// 								isRealTime: true,
// 							};

// 							// Remove from audio alerts if acknowledged or resolved
// 							if (updated.status !== "ACTIVE") {
// 								audioService.removeActiveAlarm(updated.id);
// 							}

// 							return updated;
// 						}
// 						return alarm;
// 					})
// 				);

// 				// Show update notification
// 				if (updatedAlarm.status === "RESOLVED") {
// 					toast({
// 						title: "✅ Alarm Resolved",
// 						description: `Alarm at ${
// 							updatedAlarm.branchName || updatedAlarm.location
// 						} has been resolved`,
// 					});
// 				} else if (updatedAlarm.status === "ACKNOWLEDGED") {
// 					toast({
// 						title: "👁️ Alarm Acknowledged",
// 						description: `Alarm at ${
// 							updatedAlarm.branchName || updatedAlarm.location
// 						} has been acknowledged`,
// 					});
// 				}
// 			},
// 			[toast]
// 		),

// 		onSystemNotification: useCallback(
// 			(notification: any) => {
// 				toast({
// 					title: "📢 System Notification",
// 					description: notification.message,
// 					variant:
// 						notification.severity === "error" ? "destructive" : "default",
// 				});
// 			},
// 			[toast]
// 		),
// 	});

// 	// Initialize alarms on mount
// 	useEffect(() => {
// 		if (isDashboardPage && !isInitialized) {
// 			refreshAlarms();
// 			setIsInitialized(true);
// 		}
// 	}, [isDashboardPage, isInitialized]);

// 	// Update audio service whenever alarms change
// 	useEffect(() => {
// 		if (audioEnabled) {
// 			audioService.updateActiveAlarms(alarms);
// 		}
// 	}, [alarms, audioEnabled]);

// 	// Initialize audio service settings
// 	useEffect(() => {
// 		audioService.setEnabled(audioEnabled);
// 	}, [audioEnabled]);

// 	// Request notification permission on component mount
// 	useEffect(() => {
// 		if (
// 			isDashboardPage &&
// 			"Notification" in window &&
// 			Notification.permission === "default"
// 		) {
// 			Notification.requestPermission().then((permission) => {
// 				console.log(`[GLOBAL] Notification permission: ${permission}`);
// 			});
// 		}
// 	}, [isDashboardPage]);

// 	// Refresh alarms function
// 	const refreshAlarms = async () => {
// 		try {
// 			console.log("🔄 [GLOBAL] Refreshing alarms...");
// 			const response = await apiClient.getAlarms();

// 			const alarmsWithCoords =
// 				(response as any).alarms?.map((alarm: any) => ({
// 					...alarm,
// 					coordinates: {
// 						latitude: alarm?.latitude
// 							? Number(alarm?.latitude)
// 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// 						longitude: alarm?.longitude
// 							? Number(alarm?.longitude)
// 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// 					},
// 					isRealTime: false,
// 				})) || [];

// 			setAlarms(alarmsWithCoords);
// 			console.log(`✅ [GLOBAL] Loaded ${alarmsWithCoords.length} alarms`);
// 		} catch (error) {
// 			console.error("❌ [GLOBAL] Failed to fetch alarms:", error);
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch alarms",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	// Acknowledge alarm function
// 	const acknowledgeAlarm = async (alarmId: string) => {
// 		try {
// 			setUpdating(true);
// 			await apiClient.updateAlarm(alarmId, {
// 				status: "ACKNOWLEDGED",
// 				acknowledgedAt: new Date().toISOString(),
// 			});

// 			toast({
// 				title: "Success",
// 				description: "Alarm acknowledged successfully",
// 			});

// 			// Update local state immediately
// 			setAlarms((prev) =>
// 				prev.map((alarm) =>
// 					alarm.id === alarmId
// 						? {
// 								...alarm,
// 								status: "ACKNOWLEDGED" as const,
// 								acknowledgedAt: new Date().toISOString(),
// 						  }
// 						: alarm
// 				)
// 			);

// 			// Remove from audio alerts
// 			audioService.removeActiveAlarm(alarmId);
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description: error.message || "Failed to acknowledge alarm",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setUpdating(false);
// 		}
// 	};

// 	// Update alarm status function
// 	const updateAlarmStatus = async (
// 		alarmId: string,
// 		newStatus: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED",
// 		resolutionDescription?: string
// 	) => {
// 		try {
// 			setUpdating(true);
// 			const updateData: any = {
// 				status: newStatus,
// 			};

// 			if (newStatus === "ACKNOWLEDGED") {
// 				updateData.acknowledgedAt = new Date().toISOString();
// 			} else if (newStatus === "RESOLVED") {
// 				updateData.completedAt = new Date().toISOString();
// 				updateData.resolutionDescription =
// 					resolutionDescription || "Status changed from modal";
// 			}

// 			await apiClient.updateAlarm(alarmId, updateData);

// 			toast({
// 				title: "Status Updated",
// 				description: `Alarm status changed to ${newStatus}`,
// 			});

// 			// Update local state
// 			setAlarms((prev) =>
// 				prev.map((alarm) =>
// 					alarm.id === alarmId ? { ...alarm, ...updateData } : alarm
// 				)
// 			);

// 			// Remove from audio alerts if not active
// 			if (newStatus !== "ACTIVE") {
// 				audioService.removeActiveAlarm(alarmId);
// 			}
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description: error.message || "Failed to update alarm status",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setUpdating(false);
// 		}
// 	};

// 	// View alarm details function (navigate to alarm reports)
// 	const viewAlarmDetails = (alarmId: string) => {
// 		// Store the alarm ID in session storage so the alarm reports page can highlight it
// 		sessionStorage.setItem("highlightAlarmId", alarmId);
// 		// Navigate to alarm reports page
// 		window.location.href = "/dashboard/alarm-reports";
// 	};

// 	// Computed values
// 	const activeAlarms = alarms.filter((alarm) => alarm.status === "ACTIVE");

// 	const getAlarmStats = () => {
// 		const total = alarms.length;
// 		const active = alarms.filter((a) => a.status === "ACTIVE").length;
// 		const acknowledged = alarms.filter(
// 			(a) => a.status === "ACKNOWLEDGED"
// 		).length;
// 		const resolved = alarms.filter((a) => a.status === "RESOLVED").length;
// 		const critical = alarms.filter((a) => a.severity === "CRITICAL").length;
// 		const realTime = alarms.filter((a) => a.isRealTime).length;

// 		return { total, active, acknowledged, resolved, critical, realTime };
// 	};

// 	// Context value
// 	const contextValue: GlobalAlarmContextType = {
// 		alarms,
// 		activeAlarms,
// 		isConnected,
// 		audioEnabled,
// 		modalEnabled,
// 		setAudioEnabled,
// 		setModalEnabled,
// 		acknowledgeAlarm,
// 		updateAlarmStatus,
// 		refreshAlarms,
// 		getAlarmStats,
// 	};

// 	return (
// 		<GlobalAlarmContext.Provider value={contextValue}>
// 			{children}

// 			{/* Global Persistent Alarm Modal - Only show on dashboard pages */}
// 			{shouldShowAlarms && (
// 				<PersistentAlarmModal
// 					alarms={activeAlarms as any}
// 					onAcknowledge={acknowledgeAlarm}
// 					onViewDetails={viewAlarmDetails}
// 					onStatusChange={updateAlarmStatus}
// 					isAcknowledging={updating}
// 				/>
// 			)}
// 		</GlobalAlarmContext.Provider>
// 	);
// }
