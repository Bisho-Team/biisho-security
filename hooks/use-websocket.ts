"use client";

import { useEffect, useRef, useState } from "react";
import { WebSocketClient } from "@/lib/websocket-service";
import { useToast } from "@/hooks/use-toast";

interface UseWebSocketOptions {
	onAlarmCreated?: (alarm: any) => void;
	onAlarmUpdated?: (alarm: any) => void;
	onSystemNotification?: (notification: any) => void;
	onConnectionStatusUpdate?: (data: any) => void; // New callback
	onConnectionEstablished?: (info: any) => void; // Added property
	onError?: (error: any) => void; // Added property
	onClose?: (event: any) => void; // Added property
	autoConnect?: boolean;
}

export function useWebSocket(
	token: string | null,
	options: UseWebSocketOptions = {}
) {
	const [isConnected, setIsConnected] = useState(false);
	const [userInfo, setUserInfo] = useState<any>(null);
	const [connectionStatus, setConnectionStatus] = useState<any>(null);
	const wsClient = useRef<WebSocketClient | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		if (!token || !options.autoConnect) return;

		wsClient.current = new WebSocketClient(token, {
			onConnectionEstablished: (info) => {
				setIsConnected(true);
				setUserInfo(info);
				console.log("🎉 WebSocket connection established for:", info);
				options.onConnectionEstablished?.(info);
			},

			onConnectionStatusUpdate: (data) => {
				console.log("📊 Connection status update received:", data);
				setConnectionStatus(data);
				options.onConnectionStatusUpdate?.(data);
			},

			onAlarmCreated: (alarm) => {
				console.log("🚨 New alarm received via WebSocket:", alarm);
				options.onAlarmCreated?.(alarm);

				// Show toast notification for new alarms
				toast({
					title: "🚨 NEW CRITICAL ALARM",
					description: `${alarm.severity} alarm at ${
						alarm.branchName || alarm.location
					}`,
					variant: alarm.severity === "CRITICAL" ? "destructive" : "default",
				});
			},

			onAlarmUpdated: (alarm) => {
				console.log("🔄 Alarm update received via WebSocket:", alarm);
				options.onAlarmUpdated?.(alarm);

				// Show toast for important status changes
				if (alarm.status === "RESOLVED") {
					toast({
						title: "✅ Alarm Resolved",
						description: `Alarm at ${
							alarm.branchName || alarm.location
						} has been resolved`,
					});
				}
			},

			onSystemNotification: (notification) => {
				console.log("📢 System notification:", notification);
				options.onSystemNotification?.(notification);

				toast({
					title: notification.message,
					variant:
						notification.severity === "error" ? "destructive" : "default",
				});
			},

			onError: (error) => {
				console.error("❌ WebSocket error:", error);
				setIsConnected(false);
				options.onError?.(error);
			},

			onClose: (event) => {
				console.log("🔌 WebSocket closed:", event);
				setIsConnected(false);
				setUserInfo(null);
				options.onClose?.(event);
			},
		});

		wsClient.current.connect();

		// Store client globally for force reconnect
		(window as any).wsClient = wsClient.current;

		return () => {
			wsClient.current?.disconnect();
			(window as any).wsClient = null;
		};
	}, [token, options.autoConnect]);

	const connect = () => {
		if (token && wsClient.current) {
			wsClient.current.connect();
		}
	};

	const disconnect = () => {
		wsClient.current?.disconnect();
		setIsConnected(false);
		setUserInfo(null);
	};

	const forceReconnect = () => {
		if (wsClient.current) {
			wsClient.current.forceReconnect();
		}
	};

	const getConnectionStatus = () => {
		return (
			wsClient.current?.getConnectionStatus() || {
				connected: false,
				connecting: false,
				reconnectAttempts: 0,
				maxReconnectAttempts: 0,
			}
		);
	};

	return {
		isConnected,
		userInfo,
		connectionStatus,
		connect,
		disconnect,
		forceReconnect,
		getConnectionStatus,
	};
}
// "use client";
// import { useEffect, useRef, useState } from "react";
// import { WebSocketClient } from "@/lib/websocket-service";
// import { useToast } from "@/hooks/use-toast";

// interface UseWebSocketOptions {
// 	onAlarmCreated?: (alarm: any) => void;
// 	onAlarmUpdated?: (alarm: any) => void;
// 	onSystemNotification?: (notification: any) => void;

// 	onConnectionStatusUpdate?: (data: any) => void; // New callback
// 	onConnectionEstablished?: (info: any) => void; // Added property
// 	onError?: (error: any) => void; // Added property
// 	onClose?: (event: any) => void; // Added property
// 	onOfficeAlarmNotification?: (alarm: any) => void; // Added property
// 	autoConnect?: boolean;
// }

// export function useWebSocket(
// 	token: string | null,
// 	options: UseWebSocketOptions = {}
// ) {
// 	const [isConnected, setIsConnected] = useState(false);
// 	const [userInfo, setUserInfo] = useState<any>(null);
// 	const [officeNotifications, setOfficeNotifications] = useState<any[]>([]); // NEW
// 	const [connectionStatus, setConnectionStatus] = useState<any>(null);
// 	const wsClient = useRef<WebSocketClient | null>(null);
// 	const { toast } = useToast();

// 	useEffect(() => {
// 		if (!token || !options.autoConnect) return;

// 		wsClient.current = new WebSocketClient(token, {
// 			onConnectionEstablished: (info) => {
// 				setIsConnected(true);
// 				setUserInfo(info);
// 				console.log("🎉 WebSocket connection established for:", info);
// 				options.onConnectionEstablished?.(info);
// 			},

// 			onConnectionStatusUpdate: (data) => {
// 				console.log("📊 Connection status update received:", data);
// 				setConnectionStatus(data);
// 				options.onConnectionStatusUpdate?.(data);
// 			},

// 			onAlarmCreated: (alarm) => {
// 				console.log("🚨 New alarm received via WebSocket:", alarm);
// 				options.onAlarmCreated?.(alarm);

// 				// Show toast notification for new alarms
// 				toast({
// 					title: "🚨 NEW CRITICAL ALARM",
// 					description: `${alarm.severity} alarm at ${
// 						alarm.branchName || alarm.location
// 					}`,
// 					variant: alarm.severity === "CRITICAL" ? "destructive" : "default",
// 				});
// 			},

// 			onAlarmUpdated: (alarm) => {
// 				console.log("🔄 Alarm update received via WebSocket:", alarm);
// 				options.onAlarmUpdated?.(alarm);

// 				// Show toast for important status changes
// 				if (alarm.status === "RESOLVED") {
// 					toast({
// 						title: "✅ Alarm Resolved",
// 						description: `Alarm at ${
// 							alarm.branchName || alarm.location
// 						} has been resolved`,
// 					});
// 				}
// 			},

// 			// NEW: Handle office alarm notifications
// 			onOfficeAlarmNotification: (alarm) => {
// 				console.log("🏢 Office alarm notification received:", alarm);

// 				// Add to notifications list
// 				setOfficeNotifications((prev) => [
// 					{
// 						id: `${alarm.id}-${Date.now()}`,
// 						alarm,
// 						timestamp: new Date().toISOString(),
// 						read: false,
// 					},
// 					...prev.slice(0, 9), // Keep only last 10 notifications
// 				]);

// 				options.onOfficeAlarmNotification?.(alarm);

// 				// Show toast notification
// 				toast({
// 					title: "🔄 Alarm Updated by Police",
// 					description: `${
// 						alarm.updatedBy?.name || "Police Personnel"
// 					} updated alarm at ${alarm.branch?.name || alarm.location}`,
// 					variant: "default",
// 				});
// 			},

// 			onSystemNotification: (notification) => {
// 				console.log("📢 System notification:", notification);
// 				options.onSystemNotification?.(notification);

// 				toast({
// 					title: notification.message,
// 					variant:
// 						notification.severity === "error" ? "destructive" : "default",
// 				});
// 			},

// 			onError: (error) => {
// 				console.error("❌ WebSocket error:", error);
// 				setIsConnected(false);
// 				options.onError?.(error);
// 			},

// 			onClose: (event) => {
// 				console.log("🔌 WebSocket closed:", event);
// 				setIsConnected(false);
// 				setUserInfo(null);
// 				options.onClose?.(event);
// 			},
// 		});

// 		wsClient.current.connect();

// 		// Store client globally for force reconnect
// 		(window as any).wsClient = wsClient.current;

// 		return () => {
// 			wsClient.current?.disconnect();
// 			(window as any).wsClient = null;
// 		};
// 	}, [token, options.autoConnect]);

// 	const connect = () => {
// 		if (token && wsClient.current) {
// 			wsClient.current.connect();
// 		}
// 	};

// 	const disconnect = () => {
// 		wsClient.current?.disconnect();
// 		setIsConnected(false);
// 		setUserInfo(null);
// 	};

// 	const forceReconnect = () => {
// 		if (wsClient.current) {
// 			wsClient.current.forceReconnect();
// 		}
// 	};

// 	const getConnectionStatus = () => {
// 		return (
// 			wsClient.current?.getConnectionStatus() || {
// 				connected: false,
// 				connecting: false,
// 				reconnectAttempts: 0,
// 				maxReconnectAttempts: 0,
// 			}
// 		);
// 	};

// 	// NEW: Functions to manage office notifications
// 	const markNotificationAsRead = (notificationId: string) => {
// 		setOfficeNotifications((prev) =>
// 			prev.map((notification) =>
// 				notification.id === notificationId
// 					? { ...notification, read: true }
// 					: notification
// 			)
// 		);
// 	};

// 	const clearAllNotifications = () => {
// 		setOfficeNotifications([]);
// 	};

// 	const getUnreadNotificationsCount = () => {
// 		return officeNotifications.filter((n) => !n.read).length;
// 	};

// 	return {
// 		isConnected,
// 		userInfo,
// 		connectionStatus,
// 		officeNotifications, // NEW
// 		connect,
// 		disconnect,
// 		forceReconnect,
// 		getConnectionStatus,
// 		markNotificationAsRead, // NEW
// 		clearAllNotifications, // NEW
// 		getUnreadNotificationsCount, // NEW
// 	};
// }
