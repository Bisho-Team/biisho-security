"use client";

class AudioService {
	private audioContext: AudioContext | null = null;
	private isEnabled = true;
	private volume = 0.8;
	private activeAlarmIds = new Set<string>();
	private currentAudioLoop: {
		intervalId: NodeJS.Timeout | null;
		stopCallback: (() => void) | null;
	} = { intervalId: null, stopCallback: null };
	private isPlaying = false;

	constructor() {
		// Initialize audio context on first user interaction
		if (typeof window !== "undefined") {
			document.addEventListener("click", this.initializeAudio.bind(this), {
				once: true,
			});
			document.addEventListener("keydown", this.initializeAudio.bind(this), {
				once: true,
			});
		}
	}

	private async initializeAudio() {
		try {
			this.audioContext = new (window.AudioContext ||
				(window as any).webkitAudioContext)();
			console.log("🔊 Audio service initialized");
		} catch (error) {
			console.error("Failed to initialize audio:", error);
		}
	}

	private async ensureAudioContext() {
		if (!this.audioContext) {
			await this.initializeAudio();
		}

		if (this.audioContext?.state === "suspended") {
			await this.audioContext.resume();
		}
	}

	// Critical alarm siren - continuous urgent sound
	async playCriticalAlarmSiren() {
		if (!this.isEnabled) return;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return;

			// Create siren pattern: alternating high-low frequencies
			const duration = 3000; // 3 seconds
			const oscillator1 = this.audioContext.createOscillator();
			const oscillator2 = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();
			const merger = this.audioContext.createChannelMerger(2);

			// Connect audio nodes
			oscillator1.connect(merger, 0, 0);
			oscillator2.connect(merger, 0, 1);
			merger.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			// Siren frequencies
			const highFreq = 1000;
			const lowFreq = 500;
			const cycleTime = 0.5; // Half second cycles

			// Set initial frequencies
			oscillator1.frequency.setValueAtTime(
				highFreq,
				this.audioContext.currentTime
			);
			oscillator2.frequency.setValueAtTime(
				lowFreq,
				this.audioContext.currentTime
			);

			// Create siren pattern
			for (let i = 0; i < duration / 1000 / cycleTime; i++) {
				const time = this.audioContext.currentTime + i * cycleTime;

				if (i % 2 === 0) {
					oscillator1.frequency.linearRampToValueAtTime(
						lowFreq,
						time + cycleTime / 2
					);
					oscillator1.frequency.linearRampToValueAtTime(
						highFreq,
						time + cycleTime
					);
					oscillator2.frequency.linearRampToValueAtTime(
						highFreq,
						time + cycleTime / 2
					);
					oscillator2.frequency.linearRampToValueAtTime(
						lowFreq,
						time + cycleTime
					);
				}
			}

			// Volume envelope
			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				this.volume,
				this.audioContext.currentTime + 0.1
			);
			gainNode.gain.setValueAtTime(
				this.volume,
				this.audioContext.currentTime + duration / 1000 - 0.1
			);
			gainNode.gain.linearRampToValueAtTime(
				0,
				this.audioContext.currentTime + duration / 1000
			);

			// Start and stop
			oscillator1.start(this.audioContext.currentTime);
			oscillator2.start(this.audioContext.currentTime);
			oscillator1.stop(this.audioContext.currentTime + duration / 1000);
			oscillator2.stop(this.audioContext.currentTime + duration / 1000);

			console.log("🚨 CRITICAL ALARM SIREN PLAYING");
		} catch (error) {
			console.error("Failed to play critical alarm siren:", error);
		}
	}

	// High priority alarm - urgent beeping
	async playHighPriorityAlarm() {
		if (!this.isEnabled) return;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return;

			// Rapid beeping pattern
			const beepCount = 5;
			const beepDuration = 0.2;
			const beepInterval = 0.3;

			for (let i = 0; i < beepCount; i++) {
				const startTime = this.audioContext.currentTime + i * beepInterval;
				const oscillator = this.audioContext.createOscillator();
				const gainNode = this.audioContext.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(this.audioContext.destination);

				oscillator.frequency.setValueAtTime(800, startTime);
				oscillator.type = "square";

				gainNode.gain.setValueAtTime(0, startTime);
				gainNode.gain.linearRampToValueAtTime(
					this.volume * 0.7,
					startTime + 0.01
				);
				gainNode.gain.setValueAtTime(
					this.volume * 0.7,
					startTime + beepDuration - 0.01
				);
				gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

				oscillator.start(startTime);
				oscillator.stop(startTime + beepDuration);
			}

			console.log("⚠️ HIGH PRIORITY ALARM PLAYING");
		} catch (error) {
			console.error("Failed to play high priority alarm:", error);
		}
	}

	// Medium priority notification - standard alert
	async playMediumPriorityAlert() {
		if (!this.isEnabled) return;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return;

			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
			oscillator.frequency.linearRampToValueAtTime(
				800,
				this.audioContext.currentTime + 0.1
			);
			oscillator.frequency.setValueAtTime(
				800,
				this.audioContext.currentTime + 0.5
			);
			oscillator.type = "sine";

			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				this.volume * 0.5,
				this.audioContext.currentTime + 0.05
			);
			gainNode.gain.setValueAtTime(
				this.volume * 0.5,
				this.audioContext.currentTime + 0.45
			);
			gainNode.gain.linearRampToValueAtTime(
				0,
				this.audioContext.currentTime + 0.5
			);

			oscillator.start(this.audioContext.currentTime);
			oscillator.stop(this.audioContext.currentTime + 0.5);

			console.log("🔔 MEDIUM PRIORITY ALERT PLAYING");
		} catch (error) {
			console.error("Failed to play medium priority alert:", error);
		}
	}

	// Play appropriate sound based on alarm severity
	async playAlarmSound(severity: string) {
		switch (severity) {
			case "CRITICAL":
				await this.playCriticalAlarmSiren();
				break;
			case "HIGH":
				await this.playHighPriorityAlarm();
				break;
			case "MEDIUM":
				await this.playMediumPriorityAlert();
				break;
			case "LOW":
				// No sound for low priority
				break;
			default:
				await this.playMediumPriorityAlert();
		}
	}

	// Add alarm to active tracking
	addActiveAlarm(alarmId: string, severity: string) {
		console.log(`🚨 Adding active alarm: ${alarmId} (${severity})`);
		this.activeAlarmIds.add(alarmId);
		this.startPersistentAlert();
	}

	// Remove alarm from active tracking
	removeActiveAlarm(alarmId: string) {
		console.log(`✅ Removing acknowledged alarm: ${alarmId}`);
		this.activeAlarmIds.delete(alarmId);

		if (this.activeAlarmIds.size === 0) {
			console.log("🔇 All alarms acknowledged - stopping audio alerts");
			this.stopPersistentAlert();
		} else {
			console.log(
				`🔊 ${this.activeAlarmIds.size} alarms still active - continuing alerts`
			);
		}
	}

	// Get highest severity from active alarms
	private getHighestActiveSeverity(
		alarms: Array<{ id: string; severity: string; status: string }>
	): string {
		const activeAlarms = alarms.filter(
			(alarm) => this.activeAlarmIds.has(alarm.id) && alarm.status === "ACTIVE"
		);

		if (activeAlarms.length === 0) return "LOW";

		const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
		const highestSeverity = activeAlarms.reduce((highest, alarm) => {
			return (severityOrder[alarm.severity as keyof typeof severityOrder] ||
				0) > (severityOrder[highest as keyof typeof severityOrder] || 0)
				? alarm.severity
				: highest;
		}, "LOW");

		return highestSeverity;
	}

	// Start persistent alert loop
	private startPersistentAlert() {
		if (!this.isEnabled || this.isPlaying) return;

		this.isPlaying = true;
		console.log("🔊 Starting persistent alarm alert loop");

		// Play immediately
		this.playCurrentAlertSound();

		// Set up interval for continuous alerts
		this.currentAudioLoop.intervalId = setInterval(() => {
			if (this.activeAlarmIds.size > 0 && this.isEnabled) {
				this.playCurrentAlertSound();
			} else {
				this.stopPersistentAlert();
			}
		}, this.getAlertInterval());
	}

	// Stop persistent alert loop
	private stopPersistentAlert() {
		if (this.currentAudioLoop.intervalId) {
			clearInterval(this.currentAudioLoop.intervalId);
			this.currentAudioLoop.intervalId = null;
		}

		if (this.currentAudioLoop.stopCallback) {
			this.currentAudioLoop.stopCallback();
			this.currentAudioLoop.stopCallback = null;
		}

		this.isPlaying = false;
		console.log("🔇 Stopped persistent alarm alerts");
	}

	// Get alert interval based on severity
	private getAlertInterval(): number {
		const severities = Array.from(this.activeAlarmIds).map(() => "CRITICAL"); // Simplified for now

		if (severities.includes("CRITICAL")) return 2000; // Every 2 seconds for critical
		if (severities.includes("HIGH")) return 4000; // Every 4 seconds for high
		if (severities.includes("MEDIUM")) return 6000; // Every 6 seconds for medium
		return 8000; // Every 8 seconds for low
	}

	// Play current alert sound based on active alarms
	private async playCurrentAlertSound() {
		if (!this.isEnabled || this.activeAlarmIds.size === 0) return;

		// For now, play critical sound if any active alarms (can be enhanced to check actual severities)
		await this.playCriticalAlarmSiren();
	}

	// Update active alarms and manage persistent alerts
	updateActiveAlarms(
		alarms: Array<{ id: string; severity: string; status: string }>
	) {
		const currentActiveIds = new Set(
			alarms
				.filter((alarm) => alarm.status === "ACTIVE")
				.map((alarm) => alarm.id)
		);

		// Find newly acknowledged alarms
		const acknowledgedAlarms = Array.from(this.activeAlarmIds).filter(
			(id) => !currentActiveIds.has(id)
		);

		// Remove acknowledged alarms
		acknowledgedAlarms.forEach((id) => this.removeActiveAlarm(id));

		// Add new active alarms
		alarms
			.filter(
				(alarm) =>
					alarm.status === "ACTIVE" && !this.activeAlarmIds.has(alarm.id)
			)
			.forEach((alarm) => this.addActiveAlarm(alarm.id, alarm.severity));
	}

	// Control methods
	setEnabled(enabled: boolean) {
		this.isEnabled = enabled;
		if (!enabled) {
			this.stopPersistentAlert();
			this.activeAlarmIds.clear();
		}
		console.log(`🔊 Audio alerts ${enabled ? "enabled" : "disabled"}`);
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(1, volume));
		console.log(`🔊 Audio volume set to ${Math.round(this.volume * 100)}%`);
	}

	isAudioEnabled(): boolean {
		return this.isEnabled;
	}

	getActiveAlarmCount(): number {
		return this.activeAlarmIds.size;
	}

	isCurrentlyPlaying(): boolean {
		return this.isPlaying;
	}

	// Force stop all alerts (emergency stop)
	forceStopAllAlerts() {
		this.stopPersistentAlert();
		this.activeAlarmIds.clear();
		console.log("🛑 Force stopped all audio alerts");
	}

	// Test all sounds
	async testAllSounds() {
		console.log("🧪 Testing all alarm sounds...");

		await this.playMediumPriorityAlert();

		setTimeout(async () => {
			await this.playHighPriorityAlarm();
		}, 1000);

		setTimeout(async () => {
			await this.playCriticalAlarmSiren();
		}, 3000);
	}
}

export const audioService = new AudioService();

// class AudioService {
// 	private audioContext: AudioContext | null = null;
// 	private sirenAudio: HTMLAudioElement | null = null;
// 	private notificationAudio: HTMLAudioElement | null = null;
// 	private isInitialized = false;
// 	private activeSirens: Map<string, HTMLAudioElement> = new Map();
// 	private userInteracted = false;

// 	constructor() {
// 		// Listen for user interaction to enable audio
// 		if (typeof window !== "undefined") {
// 			const enableAudio = () => {
// 				this.userInteracted = true;
// 				this.resumeAudioContext();

// 				// Remove listeners after first interaction
// 				window.removeEventListener("click", enableAudio);
// 				window.removeEventListener("touchstart", enableAudio);
// 				window.removeEventListener("keydown", enableAudio);
// 			};

// 			window.addEventListener("click", enableAudio);
// 			window.addEventListener("touchstart", enableAudio);
// 			window.addEventListener("keydown", enableAudio);
// 		}
// 	}

// 	async initialize() {
// 		if (this.isInitialized) return true;

// 		try {
// 			console.log("Initializing audio service...");

// 			// Create audio elements
// 			this.sirenAudio = new Audio();
// 			this.notificationAudio = new Audio();

// 			// Set sources
// 			this.sirenAudio.src = "/sounds/siren.mp3";
// 			this.notificationAudio.src = "/sounds/notification.mp3";

// 			// Configure audio properties
// 			this.sirenAudio.loop = true;
// 			this.sirenAudio.volume = 0.7;
// 			this.notificationAudio.loop = false;
// 			this.notificationAudio.volume = 0.5;

// 			// Initialize AudioContext (but don't start it yet)
// 			try {
// 				this.audioContext = new (window.AudioContext ||
// 					(window as any).webkitAudioContext)();
// 				console.log("Audio context created:", this.audioContext.state);
// 			} catch (err) {
// 				console.warn("Could not create AudioContext:", err);
// 			}

// 			this.isInitialized = true;
// 			console.log("Audio service initialized");
// 			return true;
// 		} catch (error) {
// 			console.error("Failed to initialize audio service:", error);
// 			return false;
// 		}
// 	}

// 	resumeAudioContext() {
// 		if (this.audioContext && this.audioContext.state === "suspended") {
// 			this.audioContext
// 				.resume()
// 				.then(() => {
// 					console.log("AudioContext resumed successfully");
// 				})
// 				.catch((err) => {
// 					console.error("Failed to resume AudioContext:", err);
// 				});
// 		}
// 	}

// 	async playAlarmSiren(alarmId: string): Promise<boolean> {
// 		if (!this.isInitialized) {
// 			await this.initialize();
// 		}

// 		try {
// 			// Stop any existing siren for this alarm
// 			this.stopSiren(alarmId);

// 			// Create a new audio element for this specific alarm
// 			const audio = new Audio();
// 			audio.src = "/sounds/siren.mp3";
// 			audio.loop = true;
// 			audio.volume = 0.7;

// 			// Store the audio element
// 			this.activeSirens.set(alarmId, audio);

// 			// Try to play the audio
// 			if (this.userInteracted) {
// 				try {
// 					await audio.play();
// 					console.log(`Alarm siren playing for alarm ${alarmId}`);
// 					return true;
// 				} catch (error) {
// 					console.error("Failed to play alarm siren:", error);

// 					// If autoplay was blocked, we'll need to try again after user interaction
// 					const playOnInteraction = () => {
// 						audio
// 							.play()
// 							.catch((e) => console.error("Failed to play on interaction:", e));
// 						document.removeEventListener("click", playOnInteraction);
// 					};
// 					document.addEventListener("click", playOnInteraction, { once: true });

// 					return false;
// 				}
// 			} else {
// 				console.log("Waiting for user interaction to play alarm");

// 				// Set up event listener for user interaction
// 				const playOnInteraction = () => {
// 					audio
// 						.play()
// 						.catch((e) => console.error("Failed to play on interaction:", e));
// 					document.removeEventListener("click", playOnInteraction);
// 				};
// 				document.addEventListener("click", playOnInteraction, { once: true });

// 				return false;
// 			}
// 		} catch (error) {
// 			console.error("Failed to set up alarm siren:", error);
// 			return false;
// 		}
// 	}

// 	async playNotificationSound(): Promise<boolean> {
// 		if (!this.isInitialized) {
// 			await this.initialize();
// 		}

// 		if (!this.notificationAudio) return false;

// 		try {
// 			this.notificationAudio.currentTime = 0;

// 			if (this.userInteracted) {
// 				await this.notificationAudio.play();
// 				console.log("Notification sound played");
// 				return true;
// 			} else {
// 				console.log("Waiting for user interaction to play notification");

// 				// Set up event listener for user interaction
// 				const playOnInteraction = () => {
// 					this.notificationAudio
// 						?.play()
// 						.catch((e) =>
// 							console.error("Failed to play notification on interaction:", e)
// 						);
// 					document.removeEventListener("click", playOnInteraction);
// 				};
// 				document.addEventListener("click", playOnInteraction, { once: true });

// 				return false;
// 			}
// 		} catch (error) {
// 			console.error("Failed to play notification sound:", error);
// 			return false;
// 		}
// 	}

// 	stopSiren(alarmId: string) {
// 		const audio = this.activeSirens.get(alarmId);
// 		if (audio) {
// 			try {
// 				audio.pause();
// 				audio.currentTime = 0;
// 				audio.src = ""; // Clear source to free memory
// 				this.activeSirens.delete(alarmId);
// 				console.log(`Stopped siren for alarm ${alarmId}`);
// 			} catch (error) {
// 				console.error(`Failed to stop siren for alarm ${alarmId}:`, error);
// 			}
// 		}
// 	}

// 	stopAllSounds() {
// 		// Stop all active sirens
// 		for (const [alarmId, audio] of this.activeSirens.entries()) {
// 			try {
// 				audio.pause();
// 				audio.currentTime = 0;
// 			} catch (error) {
// 				console.error(`Failed to stop siren for alarm ${alarmId}:`, error);
// 			}
// 		}
// 		this.activeSirens.clear();

// 		// Stop notification sound
// 		if (this.notificationAudio) {
// 			try {
// 				this.notificationAudio.pause();
// 				this.notificationAudio.currentTime = 0;
// 			} catch (error) {
// 				console.error("Failed to stop notification sound:", error);
// 			}
// 		}

// 		console.log("All sounds stopped");
// 	}

// 	setVolume(type: "siren" | "notification", volume: number) {
// 		volume = Math.max(0, Math.min(1, volume));

// 		if (type === "siren") {
// 			// Set volume for all active sirens
// 			for (const audio of this.activeSirens.values()) {
// 				audio.volume = volume;
// 			}

// 			// Set default volume for future sirens
// 			if (this.sirenAudio) {
// 				this.sirenAudio.volume = volume;
// 			}
// 		} else if (type === "notification" && this.notificationAudio) {
// 			this.notificationAudio.volume = volume;
// 		}
// 	}

// 	// Check if user has interacted with the page
// 	hasUserInteracted(): boolean {
// 		return this.userInteracted;
// 	}
// }

// export const audioService = new AudioService();
