"use client";

interface WebSocketMessage {
	type: string;
	alarm?: any;
	notification?: any;
	message?: string;
	userInfo?: {
		id: string;
		role: string;
		operatorType?: string;
	};
	data?: any; // For connection status updates
}

interface WebSocketClientOptions {
	onAlarmCreated?: (alarm: any) => void;
	onAlarmUpdated?: (alarm: any) => void;
	onOfficeAlarmNotification?: (alarm: any) => void; // NEW
	onOfficeAlarmUpdated?: (alarm: any) => void; // NEW
	onSystemNotification?: (notification: any) => void;
	onConnectionEstablished?: (userInfo: any) => void;
	onConnectionStatusUpdate?: (data: any) => void; // New callback
	onError?: (error: Event) => void;
	onClose?: (event: CloseEvent) => void;
}

export class WebSocketClient {
	private ws: WebSocket | null = null;
	private token: string;
	private options: WebSocketClientOptions;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10; // Increased from 5
	private reconnectDelay = 1000;
	private isConnecting = false;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private heartbeatTimer: NodeJS.Timeout | null = null;
	private connectionCheckTimer: NodeJS.Timeout | null = null;

	constructor(token: string, options: WebSocketClientOptions = {}) {
		this.token = token;
		this.options = options;

		// Start connection health monitoring
		this.startConnectionHealthCheck();
	}

	// Enhanced connection method with better reconnection
	connect() {
		if (
			this.isConnecting ||
			(this.ws && this.ws.readyState === WebSocket.OPEN)
		) {
			return;
		}

		this.isConnecting = true;
		const wsUrl = `${
			process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3004"
		}?token=${this.token}`;

		console.log(
			`🔌 Connecting to WebSocket server... (Attempt ${
				this.reconnectAttempts + 1
			})`
		);
		this.ws = new WebSocket(wsUrl);

		this.ws.onopen = () => {
			console.log("✅ WebSocket connected successfully");
			this.isConnecting = false;
			this.reconnectAttempts = 0;
			this.startHeartbeat();
		};

		this.ws.onmessage = (event) => {
			try {
				const data: WebSocketMessage = JSON.parse(event.data);
				this.handleMessage(data);
			} catch (error) {
				console.error("❌ Error parsing WebSocket message:", error);
			}
		};

		this.ws.onclose = (event) => {
			console.log("🔌 WebSocket connection closed:", event.code, event.reason);
			this.isConnecting = false;
			this.stopHeartbeat();
			this.options.onClose?.(event);

			// Enhanced reconnection logic
			if (
				event.code !== 1000 &&
				this.reconnectAttempts < this.maxReconnectAttempts
			) {
				this.scheduleReconnect();
			} else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
				console.error(
					"❌ Max reconnection attempts reached. Please refresh the page."
				);
				this.options.onError?.(new Event("Max reconnection attempts reached"));
			}
		};

		this.ws.onerror = (error) => {
			console.error("❌ WebSocket error:", error);
			this.isConnecting = false;
			this.options.onError?.(error);
		};
	}

	// Enhanced reconnection with exponential backoff
	private scheduleReconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		this.reconnectAttempts++;
		const delay = Math.min(
			this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
			30000
		); // Max 30 seconds

		console.log(
			`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
		);

		this.reconnectTimer = setTimeout(() => {
			if (this.reconnectAttempts <= this.maxReconnectAttempts) {
				this.connect();
			}
		}, delay);
	}

	// Connection health monitoring
	private startConnectionHealthCheck() {
		this.connectionCheckTimer = setInterval(() => {
			if (
				this.ws &&
				this.ws.readyState === WebSocket.CLOSED &&
				this.reconnectAttempts < this.maxReconnectAttempts
			) {
				console.log("🔍 Connection health check: Reconnecting...");
				this.connect();
			}
		}, 10000); // Check every 10 seconds
	}

	// Heartbeat to keep connection alive
	private startHeartbeat() {
		this.heartbeatTimer = setInterval(() => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.ws.send(JSON.stringify({ type: "ping" }));
			}
		}, 30000); // Send ping every 30 seconds
	}

	private stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	private handleMessage(data: WebSocketMessage) {
		console.log("📨 Received WebSocket message:", data.type);

		switch (data.type) {
			case "connection_established":
				console.log("🎉 Connection established:", data.userInfo);
				this.options.onConnectionEstablished?.(data.userInfo);
				break;

			case "connection_status_update":
				console.log("📊 Connection status update:", data.data);
				this.options.onConnectionStatusUpdate?.(data.data);
				break;

			case "alarm_created":
				console.log("🚨 New alarm received:", data.alarm);
				this.options.onAlarmCreated?.(data.alarm);
				break;

			case "alarm_updated":
				console.log("🔄 Alarm update received:", data.alarm);
				this.options.onAlarmUpdated?.(data.alarm);
				break;

			case "office_alarm_notification":
				console.log("🏢 Office alarm notification received:", data.alarm);
				this.options.onOfficeAlarmNotification?.(data.alarm);
				break;

			case "office_alarm_updated":
				console.log("🏢 Office alarm update received:", data.alarm);
				this.options.onOfficeAlarmUpdated?.(data.alarm);
				break;

			case "system_notification":
				console.log("📢 System notification:", data.notification);
				this.options.onSystemNotification?.(data.notification);
				break;

			case "pong":
				// Heartbeat response
				break;

			default:
				console.log("❓ Unknown message type:", data.type);
		}
	}

	disconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.connectionCheckTimer) {
			clearInterval(this.connectionCheckTimer);
			this.connectionCheckTimer = null;
		}

		this.stopHeartbeat();

		if (this.ws) {
			this.ws.close(1000, "Client disconnect");
			this.ws = null;
		}
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	// Force reconnection
	forceReconnect() {
		console.log("🔄 Force reconnecting...");
		this.reconnectAttempts = 0;
		this.disconnect();
		setTimeout(() => this.connect(), 1000);
	}

	// Get connection status
	getConnectionStatus() {
		return {
			connected: this.isConnected(),
			connecting: this.isConnecting,
			reconnectAttempts: this.reconnectAttempts,
			maxReconnectAttempts: this.maxReconnectAttempts,
		};
	}
}

// "use client";

// interface WebSocketMessage {
// 	type: string;
// 	alarm?: any;
// 	notification?: any;
// 	message?: string;
// 	userInfo?: {
// 		id: string;
// 		role: string;
// 		operatorType?: string;
// 	};
// }

// interface WebSocketClientOptions {
// 	onAlarmCreated?: (alarm: any) => void;
// 	onAlarmUpdated?: (alarm: any) => void;
// 	onSystemNotification?: (notification: any) => void;
// 	onConnectionEstablished?: (userInfo: any) => void;
// 	onError?: (error: Event) => void;
// 	onClose?: (event: CloseEvent) => void;
// }

// export class WebSocketClient {
// 	private ws: WebSocket | null = null;
// 	private token: string;
// 	private options: WebSocketClientOptions;
// 	private reconnectAttempts = 0;
// 	private maxReconnectAttempts = 5;
// 	private reconnectDelay = 1000;
// 	private isConnecting = false;

// 	constructor(token: string, options: WebSocketClientOptions = {}) {
// 		this.token = token;
// 		this.options = options;
// 	}

// 	connect() {
// 		if (
// 			this.isConnecting ||
// 			(this.ws && this.ws.readyState === WebSocket.OPEN)
// 		) {
// 			return;
// 		}

// 		this.isConnecting = true;
// 		const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${this.token}`;

// 		console.log("🔌 Connecting to WebSocket server...");
// 		this.ws = new WebSocket(wsUrl);

// 		this.ws.onopen = () => {
// 			console.log("✅ WebSocket connected successfully");
// 			this.isConnecting = false;
// 			this.reconnectAttempts = 0;
// 		};

// 		this.ws.onmessage = (event) => {
// 			try {
// 				const data: WebSocketMessage = JSON.parse(event.data);
// 				this.handleMessage(data);
// 			} catch (error) {
// 				console.error("❌ Error parsing WebSocket message:", error);
// 			}
// 		};

// 		this.ws.onclose = (event) => {
// 			console.log("🔌 WebSocket connection closed:", event.code, event.reason);
// 			this.isConnecting = false;
// 			this.options.onClose?.(event);

// 			// Attempt to reconnect if not a normal closure
// 			if (
// 				event.code !== 1000 &&
// 				this.reconnectAttempts < this.maxReconnectAttempts
// 			) {
// 				this.scheduleReconnect();
// 			}
// 		};

// 		this.ws.onerror = (error) => {
// 			console.error("❌ WebSocket error:", error);
// 			this.isConnecting = false;
// 			this.options.onError?.(error);
// 		};
// 	}

// 	private handleMessage(data: WebSocketMessage) {
// 		console.log("📨 Received WebSocket message:", data.type);

// 		switch (data.type) {
// 			case "connection_established":
// 				console.log("🎉 Connection established:", data.userInfo);
// 				this.options.onConnectionEstablished?.(data.userInfo);
// 				break;

// 			case "alarm_created":
// 				console.log("🚨 New alarm received:", data.alarm);
// 				this.options.onAlarmCreated?.(data.alarm);
// 				break;

// 			case "alarm_updated":
// 				console.log("🔄 Alarm update received:", data.alarm);
// 				this.options.onAlarmUpdated?.(data.alarm);
// 				break;

// 			case "system_notification":
// 				console.log("📢 System notification:", data.notification);
// 				this.options.onSystemNotification?.(data.notification);
// 				break;

// 			default:
// 				console.log("❓ Unknown message type:", data.type);
// 		}
// 	}

// 	private scheduleReconnect() {
// 		this.reconnectAttempts++;
// 		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

// 		console.log(
// 			`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
// 		);

// 		setTimeout(() => {
// 			if (this.reconnectAttempts <= this.maxReconnectAttempts) {
// 				this.connect();
// 			}
// 		}, delay);
// 	}

// 	disconnect() {
// 		if (this.ws) {
// 			this.ws.close(1000, "Client disconnect");
// 			this.ws = null;
// 		}
// 	}

// 	isConnected(): boolean {
// 		return this.ws?.readyState === WebSocket.OPEN;
// 	}
// }
