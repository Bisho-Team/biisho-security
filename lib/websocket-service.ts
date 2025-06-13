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

interface WebSocketMessage {
	type:
		| "alarm_created"
		| "alarm_updated"
		| "alarm_deleted"
		| "connection_established"
		| "error";
	data?: any;
	alarm?: AlarmNotification;
	message?: string;
}

type EventCallback = (data: any) => void;

class WebSocketService {
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectInterval = 3000;
	private eventListeners: Map<string, EventCallback[]> = new Map();
	private isConnecting = false;

	connect() {
		if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
			return;
		}

		this.isConnecting = true;
		const token = localStorage.getItem("authToken");
		const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";

		try {
			this.ws = new WebSocket(`${wsUrl}?token=${token}`);

			this.ws.onopen = () => {
				console.log("WebSocket connected");
				this.isConnecting = false;
				this.reconnectAttempts = 0;
				this.emit("connection_established", { connected: true });
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					this.handleMessage(message);
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error);
				}
			};

			this.ws.onclose = () => {
				console.log("WebSocket disconnected");
				this.isConnecting = false;
				this.ws = null;
				this.emit("connection_lost", { connected: false });
				this.attemptReconnect();
			};

			this.ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				this.isConnecting = false;
				this.emit("connection_error", { error });
			};
		} catch (error) {
			console.error("Failed to create WebSocket connection:", error);
			this.isConnecting = false;
		}
	}

	private handleMessage(message: WebSocketMessage) {
		console.log("WebSocket message received:", message);

		switch (message.type) {
			case "alarm_created":
				this.emit("alarm_created", message.alarm);
				break;
			case "alarm_updated":
				this.emit("alarm_updated", message.alarm);
				break;
			case "alarm_deleted":
				this.emit("alarm_deleted", message.data);
				break;
			case "error":
				this.emit("error", message.data);
				break;
			default:
				console.log("Unknown message type:", message.type);
		}
	}

	private attemptReconnect() {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.log("Max reconnection attempts reached");
			return;
		}

		this.reconnectAttempts++;
		console.log(
			`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
		);

		setTimeout(() => {
			this.connect();
		}, this.reconnectInterval * this.reconnectAttempts);
	}

	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.eventListeners.clear();
	}

	on(event: string, callback: EventCallback) {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(callback);
	}

	off(event: string, callback: EventCallback) {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(callback);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	private emit(event: string, data: any) {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((callback) => callback(data));
		}
	}

	send(message: any) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			console.warn("WebSocket is not connected");
		}
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}

export const webSocketService = new WebSocketService();
