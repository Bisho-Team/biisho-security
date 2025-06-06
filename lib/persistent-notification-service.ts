interface PersistentAlarm {
	id: string;
	type: string;
	branchName: string;
	location: string;
	severity: "low" | "medium" | "high" | "critical";
	description: string;
	createdAt: string;
	acknowledged: boolean;
}

class PersistentNotificationService {
	private registration: ServiceWorkerRegistration | null = null;
	private persistentAlarms: Map<string, PersistentAlarm> = new Map();
	private notificationQueue: PersistentAlarm[] = [];
	private isInitialized = false;
	private activeSirens: Map<string, HTMLAudioElement> = new Map();
	private sirenIntervals: Map<string, NodeJS.Timeout> = new Map();

	async initialize() {
		if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
			console.warn("Service Worker or Push Manager not supported");
			return false;
		}

		try {
			// Unregister any existing service workers first
			const registrations = await navigator.serviceWorker.getRegistrations();
			for (const registration of registrations) {
				await registration.unregister();
				console.log("Unregistered existing service worker");
			}

			// Wait a bit for cleanup
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Register new service worker
			this.registration = await navigator.serviceWorker.register("/sw.js", {
				scope: "/",
				updateViaCache: "none", // Always check for updates
			});

			console.log("Service Worker registered:", this.registration);

			// Wait for service worker to be ready
			await this.waitForServiceWorkerReady();

			// Request notification permission
			const permission = await this.requestPermission();
			if (permission !== "granted") {
				console.warn("Notification permission not granted");
				return false;
			}

			// Set up message listener for service worker
			navigator.serviceWorker.addEventListener(
				"message",
				this.handleServiceWorkerMessage.bind(this)
			);

			// Load persistent alarms from storage
			await this.loadPersistentAlarms();

			// Re-trigger any existing unacknowledged alarms
			await this.retriggerExistingAlarms();

			this.isInitialized = true;
			console.log("Persistent notification service fully initialized");

			return true;
		} catch (error) {
			console.error("Failed to initialize persistent notifications:", error);
			return false;
		}
	}

	private async waitForServiceWorkerReady(): Promise<void> {
		if (!this.registration) return;

		return new Promise((resolve) => {
			if (this.registration!.active) {
				console.log("Service worker already active");
				resolve();
				return;
			}

			const checkState = () => {
				if (this.registration!.installing) {
					console.log("Service worker installing...");
					this.registration!.installing.addEventListener("statechange", () => {
						if (this.registration!.installing?.state === "installed") {
							console.log("Service worker installed");
							if (this.registration!.waiting) {
								// Skip waiting and activate immediately
								this.registration!.waiting.postMessage({
									type: "SKIP_WAITING",
								});
							}
						}
					});
				}

				if (this.registration!.waiting) {
					console.log("Service worker waiting, activating...");
					this.registration!.waiting.postMessage({ type: "SKIP_WAITING" });
					this.registration!.waiting.addEventListener("statechange", () => {
						if (this.registration!.waiting?.state === "activated") {
							console.log("Service worker activated");
							resolve();
						}
					});
				}

				if (this.registration!.active) {
					console.log("Service worker active");
					resolve();
				}
			};

			checkState();

			// Also listen for updates
			this.registration!.addEventListener("updatefound", checkState);

			// Fallback timeout
			setTimeout(() => {
				console.log("Service worker ready timeout, proceeding anyway");
				resolve();
			}, 5000);
		});
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

		const permission = await Notification.requestPermission();
		return permission;
	}

	async showPersistentAlarm(alarm: PersistentAlarm) {
		if (!this.isInitialized) {
			console.warn("Service not initialized, queuing alarm");
			this.notificationQueue.push(alarm);
			return;
		}

		// Store alarm as persistent
		this.persistentAlarms.set(alarm.id, { ...alarm, acknowledged: false });
		await this.savePersistentAlarms();

		// Show notification via service worker
		await this.showServiceWorkerNotification(alarm);

		// Show immediate notification if app is active
		if (document.visibilityState === "visible") {
			this.showImmediateNotification(alarm);
		}

		// Start continuous siren for critical/high alarms
		this.startContinuousSiren(alarm);
	}

	private async showServiceWorkerNotification(alarm: PersistentAlarm) {
		if (!this.registration?.active) {
			console.warn(
				"Service worker not active, cannot show persistent notification"
			);
			return;
		}

		const notificationData = {
			alarm,
			title: `🚨 ${alarm.severity.toUpperCase()} SECURITY ALARM`,
			body: `${alarm.type} at ${alarm.branchName} - ${alarm.location}\n${alarm.description}`,
			icon: "/icons/alarm-icon.png",
			badge: "/icons/alarm-badge.png",
			tag: `persistent-alarm-${alarm.id}`,
		};

		try {
			// Send to service worker for persistent notification
			this.registration.active.postMessage({
				type: "SHOW_PERSISTENT_NOTIFICATION",
				data: notificationData,
			});
			console.log("Sent notification to service worker");
		} catch (error) {
			console.error("Failed to send notification to service worker:", error);
		}
	}

	private showImmediateNotification(alarm: PersistentAlarm) {
		if (Notification.permission === "granted") {
			const notification = new Notification(
				`🚨 ${alarm.severity.toUpperCase()} ALARM`,
				{
					body: `${alarm.type} at ${alarm.branchName} - ${alarm.location}`,
					icon: "/icons/alarm-icon.png",
					badge: "/icons/alarm-badge.png",
					tag: `immediate-alarm-${alarm.id}`,
					requireInteraction: true,
					silent: false,
					// vibrate: [200, 100, 200, 100, 200],
				}
			);

			notification.onclick = () => {
				window.focus();
				notification.close();
				window.location.href = "/dashboard/police-manager/alarm-reports";
			};

			// Keep notification visible until acknowledged
			setTimeout(() => {
				if (!this.persistentAlarms.get(alarm.id)?.acknowledged) {
					notification.close();
					this.showImmediateNotification(alarm); // Re-show if not acknowledged
				}
			}, 30000); // Re-show every 30 seconds
		}
	}

	private startContinuousSiren(alarm: PersistentAlarm) {
		// Stop any existing siren for this alarm
		this.stopSiren(alarm.id);

		if (alarm.severity === "critical" || alarm.severity === "high") {
			this.playContinuousSiren(alarm.id);
		} else {
			this.playNotificationSound();
		}
	}

	private async playContinuousSiren(alarmId: string) {
		try {
			const audio = new Audio("/sounds/siren.mp3");
			audio.volume = 0.8;
			audio.loop = false; // We'll handle looping manually for better control

			// Store the audio element
			this.activeSirens.set(alarmId, audio);

			const playLoop = async () => {
				try {
					audio.currentTime = 0;
					await audio.play();
					console.log(`Siren playing for alarm ${alarmId}`);
				} catch (error) {
					console.error("Failed to play siren:", error);
				}
			};

			// Play immediately
			await playLoop();

			// Set up continuous loop
			const interval = setInterval(async () => {
				// Check if alarm is still unacknowledged
				const alarm = this.persistentAlarms.get(alarmId);
				if (!alarm || alarm.acknowledged) {
					this.stopSiren(alarmId);
					return;
				}

				await playLoop();
			}, 3000); // Play every 3 seconds

			this.sirenIntervals.set(alarmId, interval);

			// Also handle audio ended event for immediate replay
			audio.addEventListener("ended", async () => {
				const alarm = this.persistentAlarms.get(alarmId);
				if (alarm && !alarm.acknowledged) {
					setTimeout(async () => {
						await playLoop();
					}, 500); // Small gap between plays
				}
			});

			console.log(`Started continuous siren for alarm ${alarmId}`);
		} catch (error) {
			console.error("Failed to start continuous siren:", error);
		}
	}

	private async playNotificationSound() {
		try {
			const audio = new Audio("/sounds/notification.mp3");
			audio.volume = 0.5;
			await audio.play();
		} catch (error) {
			console.error("Failed to play notification sound:", error);
		}
	}

	private stopSiren(alarmId: string) {
		// Stop and remove audio
		const audio = this.activeSirens.get(alarmId);
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
			this.activeSirens.delete(alarmId);
		}

		// Clear interval
		const interval = this.sirenIntervals.get(alarmId);
		if (interval) {
			clearInterval(interval);
			this.sirenIntervals.delete(alarmId);
		}

		console.log(`Stopped siren for alarm ${alarmId}`);
	}

	async acknowledgeAlarm(alarmId: string) {
		const alarm = this.persistentAlarms.get(alarmId);
		if (alarm) {
			alarm.acknowledged = true;
			this.persistentAlarms.set(alarmId, alarm);
			await this.savePersistentAlarms();

			// Stop siren for this alarm
			this.stopSiren(alarmId);

			// Close persistent notifications for this alarm
			if (this.registration) {
				try {
					const notifications = await this.registration.getNotifications({
						tag: `persistent-alarm-${alarmId}`,
					});
					notifications.forEach((notification) => notification.close());
				} catch (error) {
					console.error("Failed to close service worker notifications:", error);
				}
			}

			// Also close immediate notifications
			try {
				if ("getNotifications" in navigator.serviceWorker) {
					const notifications = await (
						navigator as any
					).serviceWorker.getNotifications({
						tag: `immediate-alarm-${alarmId}`,
					});
					notifications.forEach((notification: any) => notification.close());
				}
			} catch (error) {
				console.error("Failed to close immediate notifications:", error);
			}

			console.log(`Acknowledged alarm ${alarmId}`);
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

	private async retriggerExistingAlarms() {
		const unacknowledgedAlarms = this.getPersistentAlarms();
		console.log(`Retriggering ${unacknowledgedAlarms.length} existing alarms`);

		for (const alarm of unacknowledgedAlarms) {
			// Show notifications for existing alarms
			await this.showServiceWorkerNotification(alarm);

			if (document.visibilityState === "visible") {
				this.showImmediateNotification(alarm);
			}

			// Start sirens for critical/high alarms
			this.startContinuousSiren(alarm);
		}

		// Process any queued alarms
		while (this.notificationQueue.length > 0) {
			const queuedAlarm = this.notificationQueue.shift();
			if (queuedAlarm) {
				await this.showPersistentAlarm(queuedAlarm);
			}
		}
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

	// Clean up old acknowledged alarms (call periodically)
	cleanupOldAlarms() {
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

		for (const [id, alarm] of this.persistentAlarms.entries()) {
			if (
				alarm.acknowledged &&
				new Date(alarm.createdAt).getTime() < oneDayAgo
			) {
				this.persistentAlarms.delete(id);
				this.stopSiren(id); // Ensure siren is stopped
			}
		}

		this.savePersistentAlarms();
	}

	// Stop all sirens (useful for logout)
	stopAllSirens() {
		for (const [alarmId] of this.activeSirens) {
			this.stopSiren(alarmId);
		}
		console.log("Stopped all sirens");
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
