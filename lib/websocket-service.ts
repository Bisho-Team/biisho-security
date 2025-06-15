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
}

interface WebSocketClientOptions {
	onAlarmCreated?: (alarm: any) => void;
	onAlarmUpdated?: (alarm: any) => void;
	onSystemNotification?: (notification: any) => void;
	onConnectionEstablished?: (userInfo: any) => void;
	onError?: (error: Event) => void;
	onClose?: (event: CloseEvent) => void;
}

export class WebSocketClient {
	private ws: WebSocket | null = null;
	private token: string;
	private options: WebSocketClientOptions;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private isConnecting = false;

	constructor(token: string, options: WebSocketClientOptions = {}) {
		this.token = token;
		this.options = options;
	}

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

		console.log("🔌 Connecting to WebSocket server...");
		this.ws = new WebSocket(wsUrl);

		this.ws.onopen = () => {
			console.log("✅ WebSocket connected successfully");
			this.isConnecting = false;
			this.reconnectAttempts = 0;
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
			this.options.onClose?.(event);

			// Attempt to reconnect if not a normal closure
			if (
				event.code !== 1000 &&
				this.reconnectAttempts < this.maxReconnectAttempts
			) {
				this.scheduleReconnect();
			}
		};

		this.ws.onerror = (error) => {
			console.error("❌ WebSocket error:", error);
			this.isConnecting = false;
			this.options.onError?.(error);
		};
	}

	private handleMessage(data: WebSocketMessage) {
		console.log("📨 Received WebSocket message:", data.type);

		switch (data.type) {
			case "connection_established":
				console.log("🎉 Connection established:", data.userInfo);
				this.options.onConnectionEstablished?.(data.userInfo);
				break;

			case "alarm_created":
				console.log("🚨 New alarm received:", data.alarm);
				this.options.onAlarmCreated?.(data.alarm);
				break;

			case "alarm_updated":
				console.log("🔄 Alarm update received:", data.alarm);
				this.options.onAlarmUpdated?.(data.alarm);
				break;

			case "system_notification":
				console.log("📢 System notification:", data.notification);
				this.options.onSystemNotification?.(data.notification);
				break;

			default:
				console.log("❓ Unknown message type:", data.type);
		}
	}

	private scheduleReconnect() {
		this.reconnectAttempts++;
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

		console.log(
			`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
		);

		setTimeout(() => {
			if (this.reconnectAttempts <= this.maxReconnectAttempts) {
				this.connect();
			}
		}, delay);
	}

	disconnect() {
		if (this.ws) {
			this.ws.close(1000, "Client disconnect");
			this.ws = null;
		}
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}

// interface AlarmNotification {
// 	id: string;
// 	type: string;
// 	branchId: string;
// 	branchName: string;
// 	location: string;
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	createdBy: string;
// 	createdAt: string;
// 	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
// }

// interface WebSocketMessage {
// 	type:
// 		| "alarm_created"
// 		| "alarm_updated"
// 		| "alarm_deleted"
// 		| "connection_established"
// 		| "error";
// 	data?: any;
// 	alarm?: AlarmNotification;
// 	message?: string;
// }

// type EventCallback = (data: any) => void;

// class WebSocketService {
// 	private ws: WebSocket | null = null;
// 	private reconnectAttempts = 0;
// 	private maxReconnectAttempts = 5;
// 	private reconnectInterval = 3000;
// 	private eventListeners: Map<string, EventCallback[]> = new Map();
// 	private isConnecting = false;

// 	connect() {
// 		if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
// 			return;
// 		}

// 		this.isConnecting = true;
// 		const token = localStorage.getItem("authToken");
// 		const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";

// 		try {
// 			this.ws = new WebSocket(`${wsUrl}?token=${token}`);

// 			this.ws.onopen = () => {
// 				console.log("WebSocket connected");
// 				this.isConnecting = false;
// 				this.reconnectAttempts = 0;
// 				this.emit("connection_established", { connected: true });
// 			};

// 			this.ws.onmessage = (event) => {
// 				try {
// 					const message: WebSocketMessage = JSON.parse(event.data);
// 					this.handleMessage(message);
// 				} catch (error) {
// 					console.error("Failed to parse WebSocket message:", error);
// 				}
// 			};

// 			this.ws.onclose = () => {
// 				console.log("WebSocket disconnected");
// 				this.isConnecting = false;
// 				this.ws = null;
// 				this.emit("connection_lost", { connected: false });
// 				this.attemptReconnect();
// 			};

// 			this.ws.onerror = (error) => {
// 				console.error("WebSocket error:", error);
// 				this.isConnecting = false;
// 				this.emit("connection_error", { error });
// 			};
// 		} catch (error) {
// 			console.error("Failed to create WebSocket connection:", error);
// 			this.isConnecting = false;
// 		}
// 	}

// 	private handleMessage(message: WebSocketMessage) {
// 		console.log("WebSocket message received:", message);

// 		switch (message.type) {
// 			case "alarm_created":
// 				this.emit("alarm_created", message.alarm);
// 				break;
// 			case "alarm_updated":
// 				this.emit("alarm_updated", message.alarm);
// 				break;
// 			case "alarm_deleted":
// 				this.emit("alarm_deleted", message.data);
// 				break;
// 			case "error":
// 				this.emit("error", message.data);
// 				break;
// 			default:
// 				console.log("Unknown message type:", message.type);
// 		}
// 	}

// 	private attemptReconnect() {
// 		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
// 			console.log("Max reconnection attempts reached");
// 			return;
// 		}

// 		this.reconnectAttempts++;
// 		console.log(
// 			`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
// 		);

// 		setTimeout(() => {
// 			this.connect();
// 		}, this.reconnectInterval * this.reconnectAttempts);
// 	}

// 	disconnect() {
// 		if (this.ws) {
// 			this.ws.close();
// 			this.ws = null;
// 		}
// 		this.eventListeners.clear();
// 	}

// 	on(event: string, callback: EventCallback) {
// 		if (!this.eventListeners.has(event)) {
// 			this.eventListeners.set(event, []);
// 		}
// 		this.eventListeners.get(event)!.push(callback);
// 	}

// 	off(event: string, callback: EventCallback) {
// 		const listeners = this.eventListeners.get(event);
// 		if (listeners) {
// 			const index = listeners.indexOf(callback);
// 			if (index > -1) {
// 				listeners.splice(index, 1);
// 			}
// 		}
// 	}

// 	private emit(event: string, data: any) {
// 		const listeners = this.eventListeners.get(event);
// 		if (listeners) {
// 			listeners.forEach((callback) => callback(data));
// 		}
// 	}

// 	send(message: any) {
// 		if (this.ws?.readyState === WebSocket.OPEN) {
// 			this.ws.send(JSON.stringify(message));
// 		} else {
// 			console.warn("WebSocket is not connected");
// 		}
// 	}

// 	isConnected(): boolean {
// 		return this.ws?.readyState === WebSocket.OPEN;
// 	}
// }

// export const webSocketService = new WebSocketService();
