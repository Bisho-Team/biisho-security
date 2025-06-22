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
		const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${this.token}`;

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
