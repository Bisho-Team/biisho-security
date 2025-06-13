"use client";

import type React from "react";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { webSocketService } from "@/lib/websocket-service";
import { audioService } from "@/lib/audio-service";
import { persistentNotificationService } from "@/lib/persistent-notification-service";
import { useToast } from "@/hooks/use-toast";

interface AlarmNotification {
	id: string;
	type: string;
	branchId: string;
	branchName: string;
	location: string;
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	createdBy: string;
	createdAt: string;
	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
}

interface NotificationContextType {
	activeAlarms: AlarmNotification[];
	isConnected: boolean;
	hasNewAlarms: boolean;
	markAlarmsAsViewed: () => void;
	requestNotificationPermission: () => Promise<boolean>;
	notificationPermission: NotificationPermission;
	persistentAlarmCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined
);

export function NotificationProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [activeAlarms, setActiveAlarms] = useState<AlarmNotification[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [hasNewAlarms, setHasNewAlarms] = useState(false);
	const [notificationPermission, setNotificationPermission] =
		useState<NotificationPermission>("default");
	const [persistentAlarmCount, setPersistentAlarmCount] = useState(0);
	const { toast } = useToast();

	// Initialize notification permission state
	useEffect(() => {
		if ("Notification" in window) {
			setNotificationPermission(Notification.permission);
		}
	}, []);

	// Request notification permission
	const requestNotificationPermission =
		useCallback(async (): Promise<boolean> => {
			if (!("Notification" in window)) {
				console.warn("This browser does not support notifications");
				return false;
			}

			if (Notification.permission === "granted") {
				return true;
			}

			if (Notification.permission === "denied") {
				return false;
			}

			const permission = await Notification.requestPermission();
			setNotificationPermission(permission);
			return permission === "granted";
		}, []);

	// Handle new alarm with persistent notifications
	const handleNewAlarm = useCallback(
		async (alarm: AlarmNotification) => {
			console.log("New alarm received:", alarm);

			// Add to active alarms
			setActiveAlarms((prev) => {
				const exists = prev.find((a) => a.id === alarm.id);
				if (exists) return prev;
				return [alarm, ...prev];
			});

			// Mark as having new alarms
			setHasNewAlarms(true);

			// Show persistent notification
			await persistentNotificationService.showPersistentAlarm({
				id: alarm.id,
				type: alarm.type,
				branchName: alarm.branchName,
				location: alarm.location,
				severity: alarm.severity,
				description: alarm.description,
				createdAt: alarm.createdAt,
				acknowledged: false,
			});

			// Update persistent alarm count
			setPersistentAlarmCount(
				persistentNotificationService.getUnacknowledgedCount()
			);

			// Play alarm sound for critical and high severity alarms
			if (alarm.severity === "CRITICAL" || alarm.severity === "HIGH") {
				try {
					await audioService.playAlarmSiren();
				} catch (error) {
					console.error("Failed to play alarm sound:", error);
				}
			} else {
				try {
					await audioService.playNotificationSound();
				} catch (error) {
					console.error("Failed to play notification sound:", error);
				}
			}

			// Show toast notification
			toast({
				title: `🚨 ${alarm.severity.toUpperCase()} ALARM`,
				description: `${alarm.type} at ${alarm.branchName} - ${alarm.location}`,
				variant:
					alarm.severity === "CRITICAL" || alarm.severity === "HIGH"
						? "destructive"
						: "default",
				duration: alarm.severity === "CRITICAL" ? 0 : 8000, // Critical alarms don't auto-dismiss
			});
		},
		[toast]
	);

	// Handle alarm updates
	const handleAlarmUpdate = useCallback((alarm: AlarmNotification) => {
		setActiveAlarms((prev) => {
			const updated = prev.map((a) => (a.id === alarm.id ? alarm : a));
			return updated.filter((a) => a.status === "ACTIVE");
		});

		// If alarm is acknowledged, remove from persistent notifications
		if (alarm.status === "ACKNOWLEDGED" || alarm.status === "RESOLVED") {
			persistentNotificationService.acknowledgeAlarm(alarm.id);
			setPersistentAlarmCount(
				persistentNotificationService.getUnacknowledgedCount()
			);
		}
	}, []);

	// Handle alarm deletion
	const handleAlarmDelete = useCallback((alarmId: string) => {
		setActiveAlarms((prev) => prev.filter((a) => a.id !== alarmId));
		persistentNotificationService.acknowledgeAlarm(alarmId);
		setPersistentAlarmCount(
			persistentNotificationService.getUnacknowledgedCount()
		);
	}, []);

	// Mark alarms as viewed
	const markAlarmsAsViewed = useCallback(() => {
		setHasNewAlarms(false);
	}, []);

	// Initialize services
	useEffect(() => {
		const initializeServices = async () => {
			// Initialize audio service
			await audioService.initialize();

			// Initialize persistent notification service
			await persistentNotificationService.initialize();
			setPersistentAlarmCount(
				persistentNotificationService.getUnacknowledgedCount()
			);

			// Connect WebSocket
			webSocketService.connect();

			// Set up event listeners
			webSocketService.on("connection_established", () => {
				setIsConnected(true);
				console.log("WebSocket connected");
			});

			webSocketService.on("connection_lost", () => {
				setIsConnected(false);
				console.log("WebSocket disconnected");
			});

			webSocketService.on("alarm_created", handleNewAlarm);
			webSocketService.on("alarm_updated", handleAlarmUpdate);
			webSocketService.on("alarm_deleted", handleAlarmDelete);
		};

		initializeServices();

		// Cleanup on unmount
		return () => {
			webSocketService.disconnect();
			audioService.stopAllSounds();
		};
	}, [handleNewAlarm, handleAlarmUpdate, handleAlarmDelete]);

	// Request notification permission on mount
	useEffect(() => {
		requestNotificationPermission();
	}, [requestNotificationPermission]);

	// Periodic cleanup of old alarms
	useEffect(() => {
		const cleanup = setInterval(() => {
			persistentNotificationService.cleanupOldAlarms();
			setPersistentAlarmCount(
				persistentNotificationService.getUnacknowledgedCount()
			);
		}, 60000); // Every minute

		return () => clearInterval(cleanup);
	}, []);

	const value: NotificationContextType = {
		activeAlarms,
		isConnected,
		hasNewAlarms,
		markAlarmsAsViewed,
		requestNotificationPermission,
		notificationPermission,
		persistentAlarmCount,
	};

	return (
		<NotificationContext.Provider value={value}>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (context === undefined) {
		throw new Error(
			"useNotifications must be used within a NotificationProvider"
		);
	}
	return context;
}

// "use client";

// import type React from "react";
// import {
// 	createContext,
// 	useContext,
// 	useEffect,
// 	useState,
// 	useCallback,
// } from "react";
// import { webSocketService } from "@/lib/websocket-service";
// import { audioService } from "@/lib/audio-service";
// import { useToast } from "@/hooks/use-toast";

// interface AlarmNotification {
// 	id: string;
// 	type: string;
// 	branchId: string;
// 	branchName: string;
// 	location: string;
// 	severity: "low" | "medium" | "high" | "critical";
// 	description: string;
// 	createdBy: string;
// 	createdAt: string;
// 	status: "active" | "acknowledged" | "completed";
// }

// interface NotificationContextType {
// 	activeAlarms: AlarmNotification[];
// 	isConnected: boolean;
// 	hasNewAlarms: boolean;
// 	markAlarmsAsViewed: () => void;
// 	requestNotificationPermission: () => Promise<boolean>;
// 	notificationPermission: NotificationPermission;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(
// 	undefined
// );

// export function NotificationProvider({
// 	children,
// }: {
// 	children: React.ReactNode;
// }) {
// 	const [activeAlarms, setActiveAlarms] = useState<AlarmNotification[]>([]);
// 	const [isConnected, setIsConnected] = useState(false);
// 	const [hasNewAlarms, setHasNewAlarms] = useState(false);
// 	const [notificationPermission, setNotificationPermission] =
// 		useState<NotificationPermission>("default");
// 	const { toast } = useToast();

// 	// Initialize notification permission state
// 	useEffect(() => {
// 		if ("Notification" in window) {
// 			console.log(
// 				"This browser supports notifications",
// 				Notification.permission
// 			);
// 			setNotificationPermission(Notification.permission);
// 		}
// 	}, []);

// 	// Request notification permission
// 	const requestNotificationPermission =
// 		useCallback(async (): Promise<boolean> => {
// 			if (!("Notification" in window)) {
// 				console.warn("This browser does not support notifications");
// 				return false;
// 			}

// 			if (Notification.permission === "granted") {
// 				console.log("This browser support notifications");
// 				return true;
// 			}

// 			if (Notification.permission === "denied") {
// 				return false;
// 			}

// 			const permission = await Notification.requestPermission();
// 			setNotificationPermission(permission);
// 			return permission === "granted";
// 		}, []);

// 	// Show browser notification
// 	const showBrowserNotification = useCallback((alarm: AlarmNotification) => {
// 		if (Notification.permission === "granted") {
// 			const notification = new Notification(
// 				`🚨 ${alarm.severity.toUpperCase()} ALARM`,
// 				{
// 					body: `${alarm.type} at ${alarm.branchName} - ${alarm.location}\n${alarm.description}`,
// 					icon: "/icons/alarm-icon.png",
// 					badge: "/icons/alarm-badge.png",
// 					tag: `alarm-${alarm.id}`,
// 					requireInteraction: true,
// 					silent: false,
// 				}
// 			);

// 			notification.onclick = () => {
// 				window.focus();
// 				notification.close();
// 				// Navigate to alarm reports page
// 				window.location.href = "/dashboard/police-manager/alarm-reports";
// 			};

// 			// Auto-close after 10 seconds
// 			setTimeout(() => {
// 				notification.close();
// 			}, 10000);
// 		}
// 	}, []);

// 	// Handle new alarm
// 	const handleNewAlarm = useCallback(
// 		async (alarm: AlarmNotification) => {
// 			console.log("New alarm received:", alarm);

// 			// Add to active alarms
// 			setActiveAlarms((prev) => {
// 				const exists = prev.find((a) => a.id === alarm.id);
// 				if (exists) return prev;
// 				return [alarm, ...prev];
// 			});

// 			// Mark as having new alarms
// 			setHasNewAlarms(true);

// 			// Play alarm sound for critical and high severity alarms
// 			if (alarm.severity === "critical" || alarm.severity === "high") {
// 				try {
// 					await audioService.playAlarmSiren();
// 				} catch (error) {
// 					console.error("Failed to play alarm sound:", error);
// 				}
// 			} else {
// 				try {
// 					await audioService.playNotificationSound();
// 				} catch (error) {
// 					console.error("Failed to play notification sound:", error);
// 				}
// 			}

// 			// Show browser notification
// 			showBrowserNotification(alarm);

// 			// Show toast notification
// 			toast({
// 				title: `🚨 ${alarm.severity.toUpperCase()} ALARM`,
// 				description: `${alarm.type} at ${alarm.branchName} - ${alarm.location}`,
// 				variant:
// 					alarm.severity === "critical" || alarm.severity === "high"
// 						? "destructive"
// 						: "default",
// 				duration: 8000,
// 			});
// 		},
// 		[showBrowserNotification, toast]
// 	);

// 	// Handle alarm updates
// 	const handleAlarmUpdate = useCallback((alarm: AlarmNotification) => {
// 		setActiveAlarms((prev) =>
// 			prev
// 				.map((a) => (a.id === alarm.id ? alarm : a))
// 				.filter((a) => a.status === "active")
// 		);
// 	}, []);

// 	// Handle alarm deletion
// 	const handleAlarmDelete = useCallback((alarmId: string) => {
// 		setActiveAlarms((prev) => prev.filter((a) => a.id !== alarmId));
// 	}, []);

// 	// Mark alarms as viewed
// 	const markAlarmsAsViewed = useCallback(() => {
// 		setHasNewAlarms(false);
// 	}, []);

// 	// Initialize WebSocket and audio services
// 	useEffect(() => {
// 		const initializeServices = async () => {
// 			// Initialize audio service
// 			await audioService.initialize();

// 			// Connect WebSocket
// 			webSocketService.connect();

// 			// Set up event listeners
// 			webSocketService.on("connection_established", () => {
// 				setIsConnected(true);
// 				console.log("WebSocket connected");
// 			});

// 			webSocketService.on("connection_lost", () => {
// 				setIsConnected(false);
// 				console.log("WebSocket disconnected");
// 			});

// 			webSocketService.on("alarm_created", handleNewAlarm);
// 			webSocketService.on("alarm_updated", handleAlarmUpdate);
// 			webSocketService.on("alarm_deleted", handleAlarmDelete);
// 		};

// 		initializeServices();

// 		// Cleanup on unmount
// 		return () => {
// 			webSocketService.disconnect();
// 			audioService.stopAllSounds();
// 		};
// 	}, [handleNewAlarm, handleAlarmUpdate, handleAlarmDelete]);

// 	// Request notification permission on mount
// 	useEffect(() => {
// 		requestNotificationPermission();
// 	}, [requestNotificationPermission]);

// 	const value: NotificationContextType = {
// 		activeAlarms,
// 		isConnected,
// 		hasNewAlarms,
// 		markAlarmsAsViewed,
// 		requestNotificationPermission,
// 		notificationPermission,
// 	};

// 	return (
// 		<NotificationContext.Provider value={value}>
// 			{children}
// 		</NotificationContext.Provider>
// 	);
// }

// export function useNotifications() {
// 	const context = useContext(NotificationContext);
// 	if (context === undefined) {
// 		throw new Error(
// 			"useNotifications must be used within a NotificationProvider"
// 		);
// 	}
// 	return context;
// }
