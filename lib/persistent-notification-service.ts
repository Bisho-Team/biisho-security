interface PersistentAlarm {
	id: string;
	type: string;
	branchName: string;
	location: string;
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	createdAt: string;
	acknowledged: boolean;
}

import { audioService } from "./audio-service";

class PersistentNotificationService {
	private registration: ServiceWorkerRegistration | null = null;
	private persistentAlarms: Map<string, PersistentAlarm> = new Map();
	// private notificationQueue: PersistentAlarm[] = new Map();
	private isInitialized = false;
	private checkInterval: NodeJS.Timeout | null = null;
	private audioEnabled = true;

	async initialize() {
		if (this.isInitialized) return true;

		try {
			console.log("Initializing persistent notification service...");

			// Initialize audio service
			await audioService.initialize();

			// Load persistent alarms from storage
			await this.loadPersistentAlarms();

			console.log(
				`Loaded ${this.persistentAlarms.size} persistent alarms from storage`
			);
			console.log(`navigator ${JSON.stringify(navigator)}`);

			// Try to register service worker if supported
			try {
				// Register service worker
				this.registration = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});
				console.log("Service Worker registered:", this.registration);
			} catch (error) {
				console.warn("Failed to register service worker:", error);
			}
			// if ("serviceWorker" in navigator) {
			// } else {
			// 	console.warn("Service Worker not supported");
			// }

			// Request notification permission
			// if ("Notification" in window) {
			const permission = await this.requestPermission();
			if (permission !== "granted") {
				console.warn("Notification permission not granted");
			}
			// }

			// Set up message listener for service worker
			if (navigator.serviceWorker) {
				navigator.serviceWorker.addEventListener(
					"message",
					this.handleServiceWorkerMessage.bind(this)
				);
			}

			// Start periodic check for unacknowledged alarms
			this.startPeriodicCheck();

			this.isInitialized = true;
			console.log("Persistent notification service initialized");

			// Re-trigger any existing unacknowledged alarms
			await this.retriggerExistingAlarms();

			return true;
		} catch (error) {
			console.error(
				"Failed to initialize persistent notification service:",
				error
			);
			return false;
		}
	}

	async requestPermission(): Promise<NotificationPermission> {
		if (!("Notification" in window)) {
			return "denied";
		}

		if (Notification.permission === "granted") {
			return "granted";
		}

		if (Notification.permission === "denied") {
			return "denied";
		}

		try {
			const permission = await Notification.requestPermission();
			return permission;
		} catch (error) {
			console.error("Error requesting notification permission:", error);
			return "denied";
		}
	}

	async showPersistentAlarm(alarm: PersistentAlarm) {
		if (!this.isInitialized) {
			console.warn("Service not initialized, initializing now...");
			await this.initialize();
		}

		// Store alarm as persistent
		this.persistentAlarms.set(alarm.id, { ...alarm, acknowledged: false });
		await this.savePersistentAlarms();

		// Show notification if permission granted
		if (Notification.permission === "granted") {
			this.showNotification(alarm);
		}

		// Play sound based on severity
		if (this.audioEnabled) {
			if (alarm.severity === "CRITICAL" || alarm.severity === "HIGH") {
				audioService.playAlarmSiren(alarm.id);
			} else {
				audioService.playNotificationSound();
			}
		}
	}

	private showNotification(alarm: PersistentAlarm) {
		try {
			// Try to show notification via service worker first
			if (this.registration?.active) {
				const notificationData = {
					alarm,
					title: `🚨 ${alarm.severity.toUpperCase()} SECURITY ALARM`,
					body: `${alarm.type} at ${alarm.branchName} - ${alarm.location}\n${alarm.description}`,
					icon: "/icons/alarm-icon.png",
					badge: "/icons/alarm-badge.png",
					tag: `persistent-alarm-${alarm.id}`,
				};

				this.registration.active.postMessage({
					type: "SHOW_PERSISTENT_NOTIFICATION",
					data: notificationData,
				});
			} else {
				// Fallback to regular notification
				const notification = new Notification(
					`🚨 ${alarm.severity.toUpperCase()} ALARM`,
					{
						body: `${alarm.type} at ${alarm.branchName} - ${alarm.location}`,
						icon: "/icons/alarm-icon.png",
						badge: "/icons/alarm-badge.png",
						tag: `immediate-alarm-${alarm.id}`,
						requireInteraction: true,
						silent: false,
					}
				);

				notification.onclick = () => {
					window.focus();
					notification.close();
					window.location.href = "/dashboard/police-manager/alarm-reports";
				};
			}
		} catch (error) {
			console.error("Failed to show notification:", error);
		}
	}

	async acknowledgeAlarm(alarmId: string) {
		const alarm = this.persistentAlarms.get(alarmId);
		if (!alarm) return false;

		try {
			// Update alarm status
			alarm.acknowledged = true;
			this.persistentAlarms.set(alarmId, alarm);
			await this.savePersistentAlarms();

			// Stop audio for this alarm
			audioService.stopSiren(alarmId);

			// Close notifications for this alarm
			this.closeNotifications(alarmId);

			console.log(`Alarm ${alarmId} acknowledged`);
			return true;
		} catch (error) {
			console.error(`Failed to acknowledge alarm ${alarmId}:`, error);
			return false;
		}
	}

	private closeNotifications(alarmId: string) {
		try {
			// Close service worker notifications
			if (this.registration) {
				this.registration
					.getNotifications({ tag: `persistent-alarm-${alarmId}` })
					.then((notifications) => {
						notifications.forEach((notification) => notification.close());
					})
					.catch((error) => {
						console.error(
							"Failed to close service worker notifications:",
							error
						);
					});
			}

			// Close regular notifications
			if ("Notification" in window && "getNotifications" in Notification) {
				(Notification as any)
					.getNotifications({ tag: `immediate-alarm-${alarmId}` })
					.then((notifications: Notification[]) => {
						notifications.forEach((notification) => notification.close());
					})
					.catch((error: Error) => {
						console.error("Failed to close notifications:", error);
					});
			}
		} catch (error) {
			console.error("Error closing notifications:", error);
		}
	}

	getPersistentAlarms(): PersistentAlarm[] {
		return Array.from(this.persistentAlarms.values()).filter(
			(alarm) => !alarm.acknowledged
		);
	}

	getUnacknowledgedCount(): number {
		return this.getPersistentAlarms().length;
	}

	getMostRecentActiveAlarm(): PersistentAlarm | null {
		const activeAlarms = this.getPersistentAlarms();
		console.log(
			`Found ${activeAlarms.length} active alarms for most recent check`
		);

		if (activeAlarms.length === 0) return null;

		// Sort by creation date (newest first)
		return activeAlarms.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)[0];
	}

	private async retriggerExistingAlarms() {
		const unacknowledgedAlarms = this.getPersistentAlarms();
		console.log(`Retriggering ${unacknowledgedAlarms.length} existing alarms`);

		// Only play sound for the most recent critical/high alarm
		let playedCriticalSound = false;

		for (const alarm of unacknowledgedAlarms) {
			// Show notification for all alarms
			if (Notification.permission === "granted") {
				this.showNotification(alarm);
			}

			// Play sound only for the most recent critical/high alarm
			if (
				!playedCriticalSound &&
				(alarm.severity === "CRITICAL" || alarm.severity === "HIGH")
			) {
				if (this.audioEnabled) {
					audioService.playAlarmSiren(alarm.id);
				}
				playedCriticalSound = true;
			}
		}
	}

	private startPeriodicCheck() {
		// Clear any existing interval
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}

		// Check every 30 seconds for unacknowledged alarms
		this.checkInterval = setInterval(() => {
			const unacknowledgedAlarms = this.getPersistentAlarms();

			if (unacknowledgedAlarms.length > 0) {
				// Ensure at least one critical/high alarm has sound playing
				const criticalAlarms = unacknowledgedAlarms.filter(
					(alarm) => alarm.severity === "CRITICAL" || alarm.severity === "HIGH"
				);

				if (criticalAlarms.length > 0 && this.audioEnabled) {
					// Check if we need to restart any sirens
					const mostRecentCritical = criticalAlarms[0];
					audioService.playAlarmSiren(mostRecentCritical.id);
				}
			}
		}, 30000);
	}

	private async savePersistentAlarms() {
		try {
			const alarmsArray = Array.from(this.persistentAlarms.entries());
			localStorage.setItem("persistentAlarms", JSON.stringify(alarmsArray));
		} catch (error) {
			console.error("Failed to save persistent alarms:", error);
		}
	}

	private async loadPersistentAlarms() {
		try {
			const stored = localStorage.getItem("persistentAlarms");
			if (stored) {
				const alarmsArray = JSON.parse(stored);
				this.persistentAlarms = new Map(alarmsArray);
				console.log(
					`Loaded ${this.persistentAlarms.size} persistent alarms from storage`
				);
			}
		} catch (error) {
			console.error("Failed to load persistent alarms:", error);
		}
	}

	private handleServiceWorkerMessage(event: MessageEvent) {
		const { type, data } = event.data;

		switch (type) {
			case "ALARM_ACKNOWLEDGED":
				this.acknowledgeAlarm(data.alarmId);
				break;
			case "NOTIFICATION_CLICKED":
				window.focus();
				window.location.href = "/dashboard/police-manager/alarm-reports";
				break;
		}
	}

	// Clean up old acknowledged alarms
	cleanupOldAlarms() {
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

		for (const [id, alarm] of this.persistentAlarms.entries()) {
			if (
				alarm.acknowledged &&
				new Date(alarm.createdAt).getTime() < oneDayAgo
			) {
				this.persistentAlarms.delete(id);
			}
		}

		this.savePersistentAlarms();
	}

	// Stop all sounds
	stopAllSounds() {
		audioService.stopAllSounds();
	}

	// Enable/disable audio
	setAudioEnabled(enabled: boolean) {
		this.audioEnabled = enabled;

		if (!enabled) {
			audioService.stopAllSounds();
		} else {
			// Restart sounds for unacknowledged critical alarms
			const criticalAlarms = this.getPersistentAlarms().filter(
				(alarm) => alarm.severity === "CRITICAL" || alarm.severity === "HIGH"
			);

			if (criticalAlarms.length > 0) {
				audioService.playAlarmSiren(criticalAlarms[0].id);
			}
		}
	}

	// Play alarm sound manually
	async playAlarmSoundManually(alarmId: string): Promise<boolean> {
		const alarm = this.persistentAlarms.get(alarmId);
		if (!alarm) return false;

		return audioService.playAlarmSiren(alarmId);
	}

	// Reinitialize after login
	async reinitializeAfterLogin() {
		console.log("Reinitializing notification service after login");
		this.isInitialized = false;
		await this.initialize();
	}
}

export const persistentNotificationService =
	new PersistentNotificationService();

// interface PersistentAlarm {
// 	id: string;
// 	type: string;
// 	branchName: string;
// 	location: string;
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	createdAt: string;
// 	acknowledged: boolean;
// }

// class PersistentNotificationService {
// 	private registration: ServiceWorkerRegistration | null = null;
// 	private persistentAlarms: Map<string, PersistentAlarm> = new Map();
// 	private notificationQueue: PersistentAlarm[] = [];
// 	private isInitialized = false;
// 	private activeSirens: Map<string, HTMLAudioElement> = new Map();
// 	private sirenIntervals: Map<string, NodeJS.Timeout> = new Map();
// 	private audioContext: AudioContext | null = null;

// 	async initialize() {
// 		if (!("serviceWorker" in navigator)) {
// 			console.warn("Service Worker not supported");
// 			return false;
// 		}

// 		try {
// 			// Initialize audio context first
// 			this.initializeAudioContext();

// 			// Check for existing service worker registrations
// 			const registrations = await navigator.serviceWorker.getRegistrations();

// 			// Only unregister if we have multiple registrations to avoid unnecessary reregistration
// 			if (registrations.length > 1) {
// 				for (let i = 0; i < registrations.length - 1; i++) {
// 					await registrations[i].unregister();
// 					console.log("Unregistered existing service worker");
// 				}
// 			}

// 			// Register or get existing service worker
// 			if (registrations.length === 0) {
// 				this.registration = await navigator.serviceWorker.register("/sw.js", {
// 					scope: "/",
// 					updateViaCache: "none", // Always check for updates
// 				});
// 				console.log("New Service Worker registered:", this.registration);
// 			} else {
// 				this.registration = registrations[0];
// 				console.log("Using existing Service Worker:", this.registration);
// 			}

// 			// Wait for service worker to be ready
// 			await this.waitForServiceWorkerReady();

// 			// Request notification permission
// 			const permission = await this.requestPermission();
// 			if (permission !== "granted") {
// 				console.warn("Notification permission not granted");
// 				return false;
// 			}

// 			// Set up message listener for service worker
// 			navigator.serviceWorker.addEventListener(
// 				"message",
// 				this.handleServiceWorkerMessage.bind(this)
// 			);

// 			// Load persistent alarms from storage
// 			await this.loadPersistentAlarms();

// 			// Re-trigger any existing unacknowledged alarms
// 			await this.retriggerExistingAlarms();

// 			this.isInitialized = true;
// 			console.log("Persistent notification service fully initialized");

// 			return true;
// 		} catch (error) {
// 			console.error("Failed to initialize persistent notifications:", error);
// 			return false;
// 		}
// 	}

// 	private initializeAudioContext() {
// 		try {
// 			// Create audio context
// 			this.audioContext = new (window.AudioContext ||
// 				(window as any).webkitAudioContext)();
// 			console.log("Audio context initialized");
// 		} catch (error) {
// 			console.error("Failed to initialize audio context:", error);
// 		}
// 	}

// 	private async waitForServiceWorkerReady(): Promise<void> {
// 		if (!this.registration) return;

// 		return new Promise((resolve) => {
// 			if (this.registration!.active) {
// 				console.log("Service worker already active");
// 				resolve();
// 				return;
// 			}

// 			const checkState = () => {
// 				if (this.registration!.installing) {
// 					console.log("Service worker installing...");
// 					this.registration!.installing.addEventListener(
// 						"statechange",
// 						(event) => {
// 							const sw = event.target as ServiceWorker;
// 							console.log(`Service worker state changed to: ${sw.state}`);
// 							if (sw.state === "activated") {
// 								console.log("Service worker activated");
// 								resolve();
// 							}
// 						}
// 					);
// 				}

// 				if (this.registration!.waiting) {
// 					console.log("Service worker waiting, activating...");
// 					this.registration!.waiting.postMessage({ type: "SKIP_WAITING" });
// 				}

// 				if (this.registration!.active) {
// 					console.log("Service worker active");
// 					resolve();
// 				}
// 			};

// 			checkState();

// 			// Also listen for updates
// 			this.registration!.addEventListener("updatefound", checkState);

// 			// Fallback timeout
// 			setTimeout(() => {
// 				console.log("Service worker ready timeout, proceeding anyway");
// 				resolve();
// 			}, 3000);
// 		});
// 	}

// 	async requestPermission(): Promise<NotificationPermission> {
// 		if (!("Notification" in window)) {
// 			return "denied";
// 		}

// 		if (Notification.permission === "granted") {
// 			return "granted";
// 		}

// 		if (Notification.permission === "denied") {
// 			return "denied";
// 		}

// 		const permission = await Notification.requestPermission();
// 		return permission;
// 	}

// 	async showPersistentAlarm(alarm: PersistentAlarm) {
// 		if (!this.isInitialized) {
// 			console.warn("Service not initialized, queuing alarm");
// 			this.notificationQueue.push(alarm);
// 			return;
// 		}

// 		// Store alarm as persistent
// 		this.persistentAlarms.set(alarm.id, { ...alarm, acknowledged: false });
// 		await this.savePersistentAlarms();

// 		// Show notification via service worker
// 		await this.showServiceWorkerNotification(alarm);

// 		// Show immediate notification if app is active
// 		if (document.visibilityState === "visible") {
// 			this.showImmediateNotification(alarm);
// 		}

// 		// Start continuous siren for critical/high alarms
// 		this.startContinuousSiren(alarm);
// 	}

// 	private async showServiceWorkerNotification(alarm: PersistentAlarm) {
// 		if (!this.registration?.active) {
// 			console.warn(
// 				"Service worker not active, cannot show persistent notification"
// 			);
// 			return;
// 		}

// 		const notificationData = {
// 			alarm,
// 			title: `🚨 ${alarm.severity.toUpperCase()} SECURITY ALARM`,
// 			body: `${alarm.type} at ${alarm.branchName} - ${alarm.location}\n${alarm.description}`,
// 			icon: "/icons/alarm-icon.png",
// 			badge: "/icons/alarm-badge.png",
// 			tag: `persistent-alarm-${alarm.id}`,
// 		};

// 		try {
// 			// Send to service worker for persistent notification
// 			this.registration.active.postMessage({
// 				type: "SHOW_PERSISTENT_NOTIFICATION",
// 				data: notificationData,
// 			});
// 			console.log("Sent notification to service worker");
// 		} catch (error) {
// 			console.error("Failed to send notification to service worker:", error);
// 		}
// 	}

// 	private showImmediateNotification(alarm: PersistentAlarm) {
// 		if (Notification.permission === "granted") {
// 			const notification = new Notification(
// 				`🚨 ${alarm.severity.toUpperCase()} ALARM`,
// 				{
// 					body: `${alarm.type} at ${alarm.branchName} - ${alarm.location}`,
// 					icon: "/icons/alarm-icon.png",
// 					badge: "/icons/alarm-badge.png",
// 					tag: `immediate-alarm-${alarm.id}`,
// 					requireInteraction: true,
// 					silent: false,
// 					vibrate: [200, 100, 200, 100, 200],
// 				} as any
// 			);

// 			notification.onclick = () => {
// 				window.focus();
// 				notification.close();
// 				window.location.href = "/dashboard/police-manager/alarm-reports";
// 			};

// 			// Keep notification visible until acknowledged
// 			setTimeout(() => {
// 				if (!this.persistentAlarms.get(alarm.id)?.acknowledged) {
// 					notification.close();
// 					this.showImmediateNotification(alarm); // Re-show if not acknowledged
// 				}
// 			}, 30000); // Re-show every 30 seconds
// 		}
// 	}

// 	private startContinuousSiren(alarm: PersistentAlarm) {
// 		// Stop any existing siren for this alarm
// 		this.stopSiren(alarm.id);

// 		if (alarm.severity === "CRITICAL" || alarm.severity === "HIGH") {
// 			this.playContinuousSiren(alarm.id);
// 		} else {
// 			this.playNotificationSound();
// 		}
// 	}

// 	private async playContinuousSiren(alarmId: string) {
// 		try {
// 			// Create a new audio element each time to avoid conflicts
// 			const audio = new Audio();

// 			// Set source after creating the element
// 			audio.src = "/sounds/siren.mp3";
// 			audio.volume = 0.8;
// 			audio.loop = true; // Use native looping

// 			// Preload the audio
// 			audio.load();

// 			// Wait for the audio to be loaded
// 			await new Promise((resolve, reject) => {
// 				audio.addEventListener("canplaythrough", resolve, { once: true });
// 				audio.addEventListener(
// 					"error",
// 					(e) => {
// 						console.error("Audio load error:", e);
// 						reject(new Error("Failed to load audio"));
// 					},
// 					{ once: true }
// 				);

// 				// Set a timeout in case loading takes too long
// 				setTimeout(() => resolve(null), 3000);
// 			});

// 			// Store the audio element
// 			this.activeSirens.set(alarmId, audio);

// 			// Play the audio
// 			try {
// 				await audio.play();
// 				console.log(`Siren playing for alarm ${alarmId}`);
// 			} catch (error) {
// 				console.error("Failed to play siren:", error);

// 				// If autoplay is blocked, we'll need user interaction
// 				// We'll handle this in the UI with a "Play Sound" button
// 			}

// 			// Set up a check to ensure the audio keeps playing
// 			const interval = setInterval(() => {
// 				const alarm = this.persistentAlarms.get(alarmId);
// 				if (!alarm || alarm.acknowledged) {
// 					this.stopSiren(alarmId);
// 					return;
// 				}

// 				// If audio has stopped for some reason, restart it
// 				if (audio.paused && !alarm.acknowledged) {
// 					audio
// 						.play()
// 						.catch((err) => console.error("Failed to restart siren:", err));
// 				}
// 			}, 2000);

// 			this.sirenIntervals.set(alarmId, interval);
// 		} catch (error) {
// 			console.error("Failed to start continuous siren:", error);
// 		}
// 	}

// 	private async playNotificationSound() {
// 		try {
// 			const audio = new Audio();
// 			audio.src = "/sounds/notification.mp3";
// 			audio.volume = 0.5;

// 			// Preload the audio
// 			audio.load();

// 			// Wait for the audio to be loaded
// 			await new Promise((resolve, reject) => {
// 				audio.addEventListener("canplaythrough", resolve, { once: true });
// 				audio.addEventListener(
// 					"error",
// 					(e) => {
// 						console.error("Audio load error:", e);
// 						reject(new Error("Failed to load audio"));
// 					},
// 					{ once: true }
// 				);

// 				// Set a timeout in case loading takes too long
// 				setTimeout(() => resolve(null), 3000);
// 			});

// 			await audio.play();
// 		} catch (error) {
// 			console.error("Failed to play notification sound:", error);
// 		}
// 	}

// 	stopSiren(alarmId: string) {
// 		// Stop and remove audio
// 		const audio = this.activeSirens.get(alarmId);
// 		if (audio) {
// 			// Properly clean up the audio element
// 			audio.pause();
// 			audio.src = "";
// 			audio.load(); // This clears the audio buffer
// 			this.activeSirens.delete(alarmId);
// 		}

// 		// Clear interval
// 		const interval = this.sirenIntervals.get(alarmId);
// 		if (interval) {
// 			clearInterval(interval);
// 			this.sirenIntervals.delete(alarmId);
// 		}

// 		console.log(`Stopped siren for alarm ${alarmId}`);
// 	}

// 	async acknowledgeAlarm(alarmId: string) {
// 		const alarm = this.persistentAlarms.get(alarmId);
// 		if (alarm) {
// 			alarm.acknowledged = true;
// 			this.persistentAlarms.set(alarmId, alarm);
// 			await this.savePersistentAlarms();

// 			// Stop siren for this alarm
// 			this.stopSiren(alarmId);

// 			// Close persistent notifications for this alarm
// 			if (this.registration) {
// 				try {
// 					const notifications = await this.registration.getNotifications({
// 						tag: `persistent-alarm-${alarmId}`,
// 					});
// 					notifications.forEach((notification) => notification.close());
// 				} catch (error) {
// 					console.error("Failed to close service worker notifications:", error);
// 				}
// 			}

// 			// Also close immediate notifications
// 			try {
// 				if ("getNotifications" in navigator.serviceWorker) {
// 					const notifications = await (
// 						navigator as any
// 					).serviceWorker.getNotifications({
// 						tag: `immediate-alarm-${alarmId}`,
// 					});
// 					notifications.forEach((notification: any) => notification.close());
// 				}
// 			} catch (error) {
// 				console.error("Failed to close immediate notifications:", error);
// 			}

// 			console.log(`Acknowledged alarm ${alarmId}`);
// 			return true;
// 		}
// 		return false;
// 	}

// 	getPersistentAlarms(): PersistentAlarm[] {
// 		return Array.from(this.persistentAlarms.values()).filter(
// 			(alarm) => !alarm.acknowledged
// 		);
// 	}

// 	getUnacknowledgedCount(): number {
// 		return this.getPersistentAlarms().length;
// 	}

// 	getMostRecentActiveAlarm(): PersistentAlarm | null {
// 		const activeAlarms = this.getPersistentAlarms();
// 		if (activeAlarms.length === 0) return null;

// 		// Sort by creation date (newest first)
// 		return activeAlarms.sort(
// 			(a, b) =>
// 				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// 		)[0];
// 	}

// 	private async retriggerExistingAlarms() {
// 		const unacknowledgedAlarms = this.getPersistentAlarms();
// 		console.log(`Retriggering ${unacknowledgedAlarms.length} existing alarms`);

// 		for (const alarm of unacknowledgedAlarms) {
// 			// Show notifications for existing alarms
// 			await this.showServiceWorkerNotification(alarm);

// 			if (document.visibilityState === "visible") {
// 				this.showImmediateNotification(alarm);
// 			}

// 			// Start sirens for critical/high alarms
// 			this.startContinuousSiren(alarm);
// 		}

// 		// Process any queued alarms
// 		while (this.notificationQueue.length > 0) {
// 			const queuedAlarm = this.notificationQueue.shift();
// 			if (queuedAlarm) {
// 				await this.showPersistentAlarm(queuedAlarm);
// 			}
// 		}
// 	}

// 	private async savePersistentAlarms() {
// 		try {
// 			const alarmsArray = Array.from(this.persistentAlarms.entries());
// 			localStorage.setItem("persistentAlarms", JSON.stringify(alarmsArray));
// 		} catch (error) {
// 			console.error("Failed to save persistent alarms:", error);
// 		}
// 	}

// 	private async loadPersistentAlarms() {
// 		try {
// 			const stored = localStorage.getItem("persistentAlarms");
// 			if (stored) {
// 				const alarmsArray = JSON.parse(stored);
// 				this.persistentAlarms = new Map(alarmsArray);
// 				console.log(
// 					`Loaded ${this.persistentAlarms.size} persistent alarms from storage`
// 				);
// 			}
// 		} catch (error) {
// 			console.error("Failed to load persistent alarms:", error);
// 		}
// 	}

// 	private handleServiceWorkerMessage(event: MessageEvent) {
// 		const { type, data } = event.data;

// 		switch (type) {
// 			case "ALARM_ACKNOWLEDGED":
// 				this.acknowledgeAlarm(data.alarmId);
// 				break;
// 			case "NOTIFICATION_CLICKED":
// 				window.focus();
// 				window.location.href = "/dashboard/police-manager/alarm-reports";
// 				break;
// 		}
// 	}

// 	// Clean up old acknowledged alarms (call periodically)
// 	cleanupOldAlarms() {
// 		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

// 		for (const [id, alarm] of this.persistentAlarms.entries()) {
// 			if (
// 				alarm.acknowledged &&
// 				new Date(alarm.createdAt).getTime() < oneDayAgo
// 			) {
// 				this.persistentAlarms.delete(id);
// 				this.stopSiren(id); // Ensure siren is stopped
// 			}
// 		}

// 		this.savePersistentAlarms();
// 	}

// 	// Stop all sirens (useful for logout)
// 	stopAllSirens() {
// 		for (const [alarmId] of this.activeSirens) {
// 			this.stopSiren(alarmId);
// 		}
// 		console.log("Stopped all sirens");
// 	}

// 	// Reinitialize after login
// 	async reinitializeAfterLogin() {
// 		console.log("Reinitializing notification service after login");
// 		this.isInitialized = false;
// 		await this.initialize();
// 	}

// 	// Play a sound manually (for user interaction)
// 	async playAlarmSoundManually(alarmId: string) {
// 		const alarm = this.persistentAlarms.get(alarmId);
// 		if (!alarm) return false;

// 		try {
// 			// Create a new audio element
// 			const audio = new Audio("/sounds/siren.mp3");
// 			audio.volume = 0.8;
// 			audio.loop = true;

// 			// Replace any existing audio
// 			this.stopSiren(alarmId);
// 			this.activeSirens.set(alarmId, audio);

// 			// Play the audio
// 			await audio.play();
// 			console.log(`Manually started siren for alarm ${alarmId}`);
// 			return true;
// 		} catch (error) {
// 			console.error("Failed to play alarm sound manually:", error);
// 			return false;
// 		}
// 	}
// }

// export const persistentNotificationService =
// 	new PersistentNotificationService();
