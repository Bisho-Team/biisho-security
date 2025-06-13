class AudioService {
	private audioContext: AudioContext | null = null;
	private sirenAudio: HTMLAudioElement | null = null;
	private notificationAudio: HTMLAudioElement | null = null;
	private isInitialized = false;
	private activeSirens: Map<string, HTMLAudioElement> = new Map();
	private userInteracted = false;

	constructor() {
		// Listen for user interaction to enable audio
		if (typeof window !== "undefined") {
			const enableAudio = () => {
				this.userInteracted = true;
				this.resumeAudioContext();

				// Remove listeners after first interaction
				window.removeEventListener("click", enableAudio);
				window.removeEventListener("touchstart", enableAudio);
				window.removeEventListener("keydown", enableAudio);
			};

			window.addEventListener("click", enableAudio);
			window.addEventListener("touchstart", enableAudio);
			window.addEventListener("keydown", enableAudio);
		}
	}

	async initialize() {
		if (this.isInitialized) return true;

		try {
			console.log("Initializing audio service...");

			// Create audio elements
			this.sirenAudio = new Audio();
			this.notificationAudio = new Audio();

			// Set sources
			this.sirenAudio.src = "/sounds/siren.mp3";
			this.notificationAudio.src = "/sounds/notification.mp3";

			// Configure audio properties
			this.sirenAudio.loop = true;
			this.sirenAudio.volume = 0.7;
			this.notificationAudio.loop = false;
			this.notificationAudio.volume = 0.5;

			// Initialize AudioContext (but don't start it yet)
			try {
				this.audioContext = new (window.AudioContext ||
					(window as any).webkitAudioContext)();
				console.log("Audio context created:", this.audioContext.state);
			} catch (err) {
				console.warn("Could not create AudioContext:", err);
			}

			this.isInitialized = true;
			console.log("Audio service initialized");
			return true;
		} catch (error) {
			console.error("Failed to initialize audio service:", error);
			return false;
		}
	}

	resumeAudioContext() {
		if (this.audioContext && this.audioContext.state === "suspended") {
			this.audioContext
				.resume()
				.then(() => {
					console.log("AudioContext resumed successfully");
				})
				.catch((err) => {
					console.error("Failed to resume AudioContext:", err);
				});
		}
	}

	async playAlarmSiren(alarmId: string): Promise<boolean> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		try {
			// Stop any existing siren for this alarm
			this.stopSiren(alarmId);

			// Create a new audio element for this specific alarm
			const audio = new Audio();
			audio.src = "/sounds/siren.mp3";
			audio.loop = true;
			audio.volume = 0.7;

			// Store the audio element
			this.activeSirens.set(alarmId, audio);

			// Try to play the audio
			if (this.userInteracted) {
				try {
					await audio.play();
					console.log(`Alarm siren playing for alarm ${alarmId}`);
					return true;
				} catch (error) {
					console.error("Failed to play alarm siren:", error);

					// If autoplay was blocked, we'll need to try again after user interaction
					const playOnInteraction = () => {
						audio
							.play()
							.catch((e) => console.error("Failed to play on interaction:", e));
						document.removeEventListener("click", playOnInteraction);
					};
					document.addEventListener("click", playOnInteraction, { once: true });

					return false;
				}
			} else {
				console.log("Waiting for user interaction to play alarm");

				// Set up event listener for user interaction
				const playOnInteraction = () => {
					audio
						.play()
						.catch((e) => console.error("Failed to play on interaction:", e));
					document.removeEventListener("click", playOnInteraction);
				};
				document.addEventListener("click", playOnInteraction, { once: true });

				return false;
			}
		} catch (error) {
			console.error("Failed to set up alarm siren:", error);
			return false;
		}
	}

	async playNotificationSound(): Promise<boolean> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		if (!this.notificationAudio) return false;

		try {
			this.notificationAudio.currentTime = 0;

			if (this.userInteracted) {
				await this.notificationAudio.play();
				console.log("Notification sound played");
				return true;
			} else {
				console.log("Waiting for user interaction to play notification");

				// Set up event listener for user interaction
				const playOnInteraction = () => {
					this.notificationAudio
						?.play()
						.catch((e) =>
							console.error("Failed to play notification on interaction:", e)
						);
					document.removeEventListener("click", playOnInteraction);
				};
				document.addEventListener("click", playOnInteraction, { once: true });

				return false;
			}
		} catch (error) {
			console.error("Failed to play notification sound:", error);
			return false;
		}
	}

	stopSiren(alarmId: string) {
		const audio = this.activeSirens.get(alarmId);
		if (audio) {
			try {
				audio.pause();
				audio.currentTime = 0;
				audio.src = ""; // Clear source to free memory
				this.activeSirens.delete(alarmId);
				console.log(`Stopped siren for alarm ${alarmId}`);
			} catch (error) {
				console.error(`Failed to stop siren for alarm ${alarmId}:`, error);
			}
		}
	}

	stopAllSounds() {
		// Stop all active sirens
		for (const [alarmId, audio] of this.activeSirens.entries()) {
			try {
				audio.pause();
				audio.currentTime = 0;
			} catch (error) {
				console.error(`Failed to stop siren for alarm ${alarmId}:`, error);
			}
		}
		this.activeSirens.clear();

		// Stop notification sound
		if (this.notificationAudio) {
			try {
				this.notificationAudio.pause();
				this.notificationAudio.currentTime = 0;
			} catch (error) {
				console.error("Failed to stop notification sound:", error);
			}
		}

		console.log("All sounds stopped");
	}

	setVolume(type: "siren" | "notification", volume: number) {
		volume = Math.max(0, Math.min(1, volume));

		if (type === "siren") {
			// Set volume for all active sirens
			for (const audio of this.activeSirens.values()) {
				audio.volume = volume;
			}

			// Set default volume for future sirens
			if (this.sirenAudio) {
				this.sirenAudio.volume = volume;
			}
		} else if (type === "notification" && this.notificationAudio) {
			this.notificationAudio.volume = volume;
		}
	}

	// Check if user has interacted with the page
	hasUserInteracted(): boolean {
		return this.userInteracted;
	}
}

export const audioService = new AudioService();

// class AudioService {
// 	private audioContext: AudioContext | null = null;
// 	private sirenAudio: HTMLAudioElement | null = null;
// 	private notificationAudio: HTMLAudioElement | null = null;
// 	private isInitialized = false;

// 	async initialize() {
// 		if (this.isInitialized) return;

// 		try {
// 			// Initialize audio context
// 			this.audioContext = new (window.AudioContext ||
// 				(window as any).webkitAudioContext)();

// 			// Create audio elements
// 			this.sirenAudio = new Audio("/sounds/siren.mp3");
// 			this.notificationAudio = new Audio("/sounds/notification.mp3");

// 			// Configure audio properties
// 			this.sirenAudio.loop = false;
// 			this.sirenAudio.volume = 0.7;
// 			this.notificationAudio.loop = false;
// 			this.notificationAudio.volume = 0.5;

// 			// Preload audio files
// 			await Promise.all([
// 				this.preloadAudio(this.sirenAudio),
// 				this.preloadAudio(this.notificationAudio),
// 			]);

// 			this.isInitialized = true;
// 			console.log("Audio service initialized");
// 		} catch (error) {
// 			console.error("Failed to initialize audio service:", error);
// 		}
// 	}

// 	private preloadAudio(audio: HTMLAudioElement): Promise<void> {
// 		return new Promise((resolve, reject) => {
// 			audio.addEventListener("canplaythrough", () => resolve(), { once: true });
// 			audio.addEventListener("error", reject, { once: true });
// 			audio.load();
// 		});
// 	}

// 	async playAlarmSiren() {
// 		await this.ensureInitialized();

// 		if (this.sirenAudio) {
// 			try {
// 				this.sirenAudio.currentTime = 0;
// 				await this.sirenAudio.play();
// 				console.log("Alarm siren played");
// 			} catch (error) {
// 				console.error("Failed to play alarm siren:", error);
// 			}
// 		}
// 	}

// 	async playNotificationSound() {
// 		await this.ensureInitialized();

// 		if (this.notificationAudio) {
// 			try {
// 				this.notificationAudio.currentTime = 0;
// 				await this.notificationAudio.play();
// 				console.log("Notification sound played");
// 			} catch (error) {
// 				console.error("Failed to play notification sound:", error);
// 			}
// 		}
// 	}

// 	stopAllSounds() {
// 		if (this.sirenAudio) {
// 			this.sirenAudio.pause();
// 			this.sirenAudio.currentTime = 0;
// 		}
// 		if (this.notificationAudio) {
// 			this.notificationAudio.pause();
// 			this.notificationAudio.currentTime = 0;
// 		}
// 	}

// 	setVolume(type: "siren" | "notification", volume: number) {
// 		const audio = type === "siren" ? this.sirenAudio : this.notificationAudio;
// 		if (audio) {
// 			audio.volume = Math.max(0, Math.min(1, volume));
// 		}
// 	}

// 	private async ensureInitialized() {
// 		if (!this.isInitialized) {
// 			await this.initialize();
// 		}

// 		// Resume audio context if suspended (required by some browsers)
// 		if (this.audioContext?.state === "suspended") {
// 			await this.audioContext.resume();
// 		}
// 	}
// }

// export const audioService = new AudioService();
