class AudioService {
	private audioContext: AudioContext | null = null;
	private sirenAudio: HTMLAudioElement | null = null;
	private notificationAudio: HTMLAudioElement | null = null;
	private isInitialized = false;

	async initialize() {
		if (this.isInitialized) return;

		try {
			// Initialize audio context
			this.audioContext = new (window.AudioContext ||
				(window as any).webkitAudioContext)();

			// Create audio elements
			this.sirenAudio = new Audio("/sounds/siren.mp3");
			this.notificationAudio = new Audio("/sounds/notification.mp3");

			// Configure audio properties
			this.sirenAudio.loop = false;
			this.sirenAudio.volume = 0.7;
			this.notificationAudio.loop = false;
			this.notificationAudio.volume = 0.5;

			// Preload audio files
			await Promise.all([
				this.preloadAudio(this.sirenAudio),
				this.preloadAudio(this.notificationAudio),
			]);

			this.isInitialized = true;
			console.log("Audio service initialized");
		} catch (error) {
			console.error("Failed to initialize audio service:", error);
		}
	}

	private preloadAudio(audio: HTMLAudioElement): Promise<void> {
		return new Promise((resolve, reject) => {
			audio.addEventListener("canplaythrough", () => resolve(), { once: true });
			audio.addEventListener("error", reject, { once: true });
			audio.load();
		});
	}

	async playAlarmSiren() {
		await this.ensureInitialized();

		if (this.sirenAudio) {
			try {
				this.sirenAudio.currentTime = 0;
				await this.sirenAudio.play();
				console.log("Alarm siren played");
			} catch (error) {
				console.error("Failed to play alarm siren:", error);
			}
		}
	}

	async playNotificationSound() {
		await this.ensureInitialized();

		if (this.notificationAudio) {
			try {
				this.notificationAudio.currentTime = 0;
				await this.notificationAudio.play();
				console.log("Notification sound played");
			} catch (error) {
				console.error("Failed to play notification sound:", error);
			}
		}
	}

	stopAllSounds() {
		if (this.sirenAudio) {
			this.sirenAudio.pause();
			this.sirenAudio.currentTime = 0;
		}
		if (this.notificationAudio) {
			this.notificationAudio.pause();
			this.notificationAudio.currentTime = 0;
		}
	}

	setVolume(type: "siren" | "notification", volume: number) {
		const audio = type === "siren" ? this.sirenAudio : this.notificationAudio;
		if (audio) {
			audio.volume = Math.max(0, Math.min(1, volume));
		}
	}

	private async ensureInitialized() {
		if (!this.isInitialized) {
			await this.initialize();
		}

		// Resume audio context if suspended (required by some browsers)
		if (this.audioContext?.state === "suspended") {
			await this.audioContext.resume();
		}
	}
}

export const audioService = new AudioService();
