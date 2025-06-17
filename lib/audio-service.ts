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
	private sirenAudioBuffer: AudioBuffer | null = null;
	private isLoadingSiren = false;
	private currentAudioSources: AudioBufferSourceNode[] = [];
	private currentSynthSources: OscillatorNode[] = [];
	private isCurrentlyPlayingAudio = false;
	private lastAudioStartTime = 0;
	private minimumGapBetweenSounds = 1000; // 1 second minimum gap

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
			console.log("🔊 Enhanced Professional Audio Service initialized");

			// Load the siren audio file
			await this.loadSirenAudio();
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

	private stopAllCurrentAudio() {
		console.log("🔇 Stopping all current audio instances...");

		// Stop all audio buffer sources (siren file)
		this.currentAudioSources.forEach((source) => {
			try {
				source.stop();
				source.disconnect();
			} catch (error) {
				// Source might already be stopped
			}
		});
		this.currentAudioSources = [];

		// Stop all synthesized sources (oscillators)
		this.currentSynthSources.forEach((oscillator) => {
			try {
				oscillator.stop();
				oscillator.disconnect();
			} catch (error) {
				// Oscillator might already be stopped
			}
		});
		this.currentSynthSources = [];

		this.isCurrentlyPlayingAudio = false;
	}

	private shouldPlayAudio(): boolean {
		const now = Date.now();
		const timeSinceLastAudio = now - this.lastAudioStartTime;

		if (this.isCurrentlyPlayingAudio) {
			console.log("⏸️ Audio already playing, skipping...");
			return false;
		}

		if (timeSinceLastAudio < this.minimumGapBetweenSounds) {
			console.log(
				`⏸️ Too soon since last audio (${timeSinceLastAudio}ms), skipping...`
			);
			return false;
		}

		return true;
	}

	private async loadSirenAudio() {
		if (this.isLoadingSiren || this.sirenAudioBuffer) return;

		try {
			this.isLoadingSiren = true;
			console.log("🔊 Loading professional siren audio file...");

			// Try to fetch the siren.mp3 file
			const response = await fetch("/sounds/siren.mp3");
			if (!response.ok) {
				throw new Error(`Failed to load siren.mp3: ${response.status}`);
			}

			const arrayBuffer = await response.arrayBuffer();

			if (!this.audioContext) {
				await this.ensureAudioContext();
			}

			if (this.audioContext) {
				this.sirenAudioBuffer = await this.audioContext.decodeAudioData(
					arrayBuffer
				);
				console.log("✅ Professional siren audio loaded successfully");
			}
		} catch (error) {
			console.warn(
				"⚠️ Could not load siren.mp3, falling back to synthesized sounds:",
				error
			);
			this.sirenAudioBuffer = null;
		} finally {
			this.isLoadingSiren = false;
		}
	}

	async playProfessionalSirenFile() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return false;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return false;

			// Ensure siren is loaded
			if (!this.sirenAudioBuffer && !this.isLoadingSiren) {
				await this.loadSirenAudio();
			}

			if (this.sirenAudioBuffer && this.audioContext) {
				// Stop any currently playing audio first
				this.stopAllCurrentAudio();

				const source = this.audioContext.createBufferSource();
				const gainNode = this.audioContext.createGain();
				const filter = this.audioContext.createBiquadFilter();

				// Connect nodes
				source.connect(filter);
				filter.connect(gainNode);
				gainNode.connect(this.audioContext.destination);

				// Configure the audio
				source.buffer = this.sirenAudioBuffer;
				source.loop = false;

				// Add some professional audio processing
				filter.type = "highpass";
				filter.frequency.setValueAtTime(100, this.audioContext.currentTime);
				filter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

				// Volume control with smooth envelope
				gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
				gainNode.gain.linearRampToValueAtTime(
					this.volume,
					this.audioContext.currentTime + 0.1
				);

				// Fade out at the end
				const duration = this.sirenAudioBuffer.duration;
				gainNode.gain.setValueAtTime(
					this.volume,
					this.audioContext.currentTime + duration - 0.5
				);
				gainNode.gain.linearRampToValueAtTime(
					0,
					this.audioContext.currentTime + duration
				);

				// Track this audio source
				this.currentAudioSources.push(source);
				this.isCurrentlyPlayingAudio = true;
				this.lastAudioStartTime = Date.now();

				// Set up cleanup when audio ends
				source.onended = () => {
					this.isCurrentlyPlayingAudio = false;
					this.currentAudioSources = this.currentAudioSources.filter(
						(s) => s !== source
					);
					console.log("🔇 Siren file playback completed");
				};

				source.start(this.audioContext.currentTime);
				source.stop(this.audioContext.currentTime + duration);

				console.log("🚨 PROFESSIONAL SIREN FILE PLAYING (NO OVERLAP)");
				return true;
			} else {
				console.warn("⚠️ Siren audio not available, using fallback");
				return false;
			}
		} catch (error) {
			console.error("Failed to play professional siren file:", error);
			this.isCurrentlyPlayingAudio = false;
			return false;
		}
	}

	async playEnhancedEmergencySiren() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return;

			// Stop any currently playing audio first
			this.stopAllCurrentAudio();

			const duration = 4000; // 4 seconds
			const oscillator1 = this.audioContext.createOscillator();
			const oscillator2 = this.audioContext.createOscillator();
			const oscillator3 = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();
			const filter = this.audioContext.createBiquadFilter();
			const distortion = this.audioContext.createWaveShaper();

			// Track these oscillators
			this.currentSynthSources.push(oscillator1, oscillator2, oscillator3);
			this.isCurrentlyPlayingAudio = true;
			this.lastAudioStartTime = Date.now();

			// Connect audio nodes for richer sound
			oscillator1.connect(filter);
			oscillator2.connect(filter);
			oscillator3.connect(filter);
			filter.connect(distortion);
			distortion.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			// Configure filter for professional sound
			filter.type = "bandpass";
			filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
			filter.Q.setValueAtTime(2, this.audioContext.currentTime);

			// Add subtle distortion for more realistic siren sound
			const samples = 44100;
			const curve = new Float32Array(samples);
			const deg = Math.PI / 180;
			for (let i = 0; i < samples; i++) {
				const x = (i * 2) / samples - 1;
				curve[i] = ((3 + 20) * x * 20 * deg) / (Math.PI + 20 * Math.abs(x));
			}
			distortion.curve = curve;
			distortion.oversample = "4x";

			// Professional emergency frequencies with harmonics
			const baseFreq = 660;
			const topFreq = 770;
			const cycleTime = 1.2;

			// Set waveform types for richer sound
			oscillator1.type = "sawtooth";
			oscillator2.type = "sine";
			oscillator3.type = "triangle";

			// Create complex siren pattern with harmonics
			for (let i = 0; i < duration / 1000 / cycleTime; i++) {
				const time = this.audioContext.currentTime + i * cycleTime;

				// Main oscillator
				oscillator1.frequency.setValueAtTime(baseFreq, time);
				oscillator1.frequency.linearRampToValueAtTime(
					topFreq,
					time + cycleTime / 2
				);
				oscillator1.frequency.linearRampToValueAtTime(
					baseFreq,
					time + cycleTime
				);

				// Harmonic (octave)
				oscillator2.frequency.setValueAtTime(baseFreq * 1.5, time);
				oscillator2.frequency.linearRampToValueAtTime(
					topFreq * 1.5,
					time + cycleTime / 2
				);
				oscillator2.frequency.linearRampToValueAtTime(
					baseFreq * 1.5,
					time + cycleTime
				);

				// Sub-harmonic
				oscillator3.frequency.setValueAtTime(baseFreq * 0.5, time);
				oscillator3.frequency.linearRampToValueAtTime(
					topFreq * 0.5,
					time + cycleTime / 2
				);
				oscillator3.frequency.linearRampToValueAtTime(
					baseFreq * 0.5,
					time + cycleTime
				);
			}

			// Professional volume envelope
			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				this.volume * 0.8,
				this.audioContext.currentTime + 0.2
			);
			gainNode.gain.setValueAtTime(
				this.volume * 0.8,
				this.audioContext.currentTime + duration / 1000 - 0.3
			);
			gainNode.gain.linearRampToValueAtTime(
				0,
				this.audioContext.currentTime + duration / 1000
			);

			// Set up cleanup when audio ends
			const endTime = this.audioContext.currentTime + duration / 1000;
			oscillator1.onended = () => {
				this.isCurrentlyPlayingAudio = false;
				this.currentSynthSources = this.currentSynthSources.filter(
					(o) => o !== oscillator1 && o !== oscillator2 && o !== oscillator3
				);
				console.log("🔇 Enhanced emergency siren completed");
			};

			// Start all oscillators
			oscillator1.start(this.audioContext.currentTime);
			oscillator2.start(this.audioContext.currentTime);
			oscillator3.start(this.audioContext.currentTime);

			// Stop all oscillators
			oscillator1.stop(endTime);
			oscillator2.stop(endTime);
			oscillator3.stop(endTime);

			console.log("🚨 ENHANCED EMERGENCY SIREN PLAYING (NO OVERLAP)");
		} catch (error) {
			console.error("Failed to play enhanced emergency siren:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playProfessionalPoliceSiren() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return;

			// Stop any currently playing audio first
			this.stopAllCurrentAudio();

			const duration = 3500;
			const oscillator1 = this.audioContext.createOscillator();
			const oscillator2 = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();
			const filter = this.audioContext.createBiquadFilter();

			// Track these oscillators
			this.currentSynthSources.push(oscillator1, oscillator2);
			this.isCurrentlyPlayingAudio = true;
			this.lastAudioStartTime = Date.now();

			// Connect nodes
			oscillator1.connect(filter);
			oscillator2.connect(filter);
			filter.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			// Configure filter
			filter.type = "bandpass";
			filter.frequency.setValueAtTime(900, this.audioContext.currentTime);
			filter.Q.setValueAtTime(1.5, this.audioContext.currentTime);

			// Dual-tone police siren
			oscillator1.type = "sawtooth";
			oscillator2.type = "square";

			// Create authentic police wail pattern
			const wailCycles = 3;
			const cycleTime = duration / 1000 / wailCycles;

			for (let i = 0; i < wailCycles; i++) {
				const startTime = this.audioContext.currentTime + i * cycleTime;

				// Main siren
				oscillator1.frequency.setValueAtTime(650, startTime);
				oscillator1.frequency.linearRampToValueAtTime(
					1200,
					startTime + cycleTime / 2
				);
				oscillator1.frequency.linearRampToValueAtTime(
					650,
					startTime + cycleTime
				);

				// Harmonic layer
				oscillator2.frequency.setValueAtTime(650 * 1.2, startTime);
				oscillator2.frequency.linearRampToValueAtTime(
					1200 * 1.2,
					startTime + cycleTime / 2
				);
				oscillator2.frequency.linearRampToValueAtTime(
					650 * 1.2,
					startTime + cycleTime
				);
			}

			// Volume envelope
			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				this.volume * 0.7,
				this.audioContext.currentTime + 0.1
			);
			gainNode.gain.setValueAtTime(
				this.volume * 0.7,
				this.audioContext.currentTime + duration / 1000 - 0.2
			);
			gainNode.gain.linearRampToValueAtTime(
				0,
				this.audioContext.currentTime + duration / 1000
			);

			// Set up cleanup when audio ends
			oscillator1.onended = () => {
				this.isCurrentlyPlayingAudio = false;
				this.currentSynthSources = this.currentSynthSources.filter(
					(o) => o !== oscillator1 && o !== oscillator2
				);
				console.log("🔇 Police siren completed");
			};

			oscillator1.start(this.audioContext.currentTime);
			oscillator2.start(this.audioContext.currentTime);
			oscillator1.stop(this.audioContext.currentTime + duration / 1000);
			oscillator2.stop(this.audioContext.currentTime + duration / 1000);

			console.log("🚔 PROFESSIONAL POLICE SIREN PLAYING (NO OVERLAP)");
		} catch (error) {
			console.error("Failed to play professional police siren:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playProfessionalFireAlarm() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return;

			// Stop any currently playing audio first
			this.stopAllCurrentAudio();

			this.isCurrentlyPlayingAudio = true;
			this.lastAudioStartTime = Date.now();

			// Standard fire alarm pattern: 3 beeps, pause, repeat
			const beepDuration = 0.5;
			const pauseDuration = 0.5;
			const longPause = 1.5;
			const totalCycles = 2;
			const totalDuration =
				totalCycles * (3 * (beepDuration + pauseDuration) + longPause);

			const oscillators: OscillatorNode[] = [];

			for (let cycle = 0; cycle < totalCycles; cycle++) {
				for (let beep = 0; beep < 3; beep++) {
					const startTime =
						this.audioContext.currentTime +
						cycle * (3 * (beepDuration + pauseDuration) + longPause) +
						beep * (beepDuration + pauseDuration);

					const oscillator = this.audioContext.createOscillator();
					const gainNode = this.audioContext.createGain();
					const filter = this.audioContext.createBiquadFilter();

					oscillators.push(oscillator);
					this.currentSynthSources.push(oscillator);

					oscillator.connect(filter);
					filter.connect(gainNode);
					gainNode.connect(this.audioContext.destination);

					// Standard fire alarm frequency (520 Hz)
					oscillator.frequency.setValueAtTime(520, startTime);
					oscillator.type = "square";

					// Filter for professional sound
					filter.type = "lowpass";
					filter.frequency.setValueAtTime(1500, startTime);

					// Sharp attack and decay
					gainNode.gain.setValueAtTime(0, startTime);
					gainNode.gain.linearRampToValueAtTime(
						this.volume * 0.8,
						startTime + 0.02
					);
					gainNode.gain.setValueAtTime(
						this.volume * 0.8,
						startTime + beepDuration - 0.02
					);
					gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

					oscillator.start(startTime);
					oscillator.stop(startTime + beepDuration);
				}
			}

			// Set up cleanup when all beeps are done
			setTimeout(() => {
				this.isCurrentlyPlayingAudio = false;
				oscillators.forEach((osc) => {
					this.currentSynthSources = this.currentSynthSources.filter(
						(o) => o !== osc
					);
				});
				console.log("🔇 Fire alarm completed");
			}, totalDuration * 1000);

			console.log("🔥 PROFESSIONAL FIRE ALARM PLAYING (NO OVERLAP)");
		} catch (error) {
			console.error("Failed to play professional fire alarm:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playProfessionalNotificationChime() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			await this.ensureAudioContext();
			if (!this.audioContext) return;

			// Stop any currently playing audio first
			this.stopAllCurrentAudio();

			this.isCurrentlyPlayingAudio = true;
			this.lastAudioStartTime = Date.now();

			// Two-tone chime
			const frequencies = [523.25, 659.25];
			const noteDuration = 0.8;
			const totalDuration = frequencies.length * noteDuration;

			const oscillators: OscillatorNode[] = [];

			for (let i = 0; i < frequencies.length; i++) {
				const startTime = this.audioContext.currentTime + i * noteDuration;

				const oscillator = this.audioContext.createOscillator();
				const gainNode = this.audioContext.createGain();
				const filter = this.audioContext.createBiquadFilter();

				oscillators.push(oscillator);
				this.currentSynthSources.push(oscillator);

				oscillator.connect(filter);
				filter.connect(gainNode);
				gainNode.connect(this.audioContext.destination);

				oscillator.frequency.setValueAtTime(frequencies[i], startTime);
				oscillator.type = "sine";

				// Soft filter
				filter.type = "lowpass";
				filter.frequency.setValueAtTime(2000, startTime);

				// Smooth envelope
				gainNode.gain.setValueAtTime(0, startTime);
				gainNode.gain.linearRampToValueAtTime(
					this.volume * 0.4,
					startTime + 0.1
				);
				gainNode.gain.setValueAtTime(
					this.volume * 0.4,
					startTime + noteDuration - 0.2
				);
				gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

				oscillator.start(startTime);
				oscillator.stop(startTime + noteDuration);
			}

			// Set up cleanup when chime is done
			setTimeout(() => {
				this.isCurrentlyPlayingAudio = false;
				oscillators.forEach((osc) => {
					this.currentSynthSources = this.currentSynthSources.filter(
						(o) => o !== osc
					);
				});
				console.log("🔇 Notification chime completed");
			}, totalDuration * 1000);

			console.log("🎵 PROFESSIONAL NOTIFICATION CHIME PLAYING (NO OVERLAP)");
		} catch (error) {
			console.error("Failed to play professional notification chime:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playAlarmSound(severity: string) {
		// Check if we should play audio to prevent overlapping
		if (!this.shouldPlayAudio()) {
			console.log(
				`⏸️ Skipping ${severity} alarm sound - audio already playing or too soon`
			);
			return;
		}

		switch (severity) {
			case "CRITICAL":
				// Try to play siren file first, fallback to synthesized
				const sirenPlayed = await this.playProfessionalSirenFile();
				if (!sirenPlayed) {
					await this.playEnhancedEmergencySiren();
				}
				break;
			case "HIGH":
				await this.playProfessionalPoliceSiren();
				break;
			case "MEDIUM":
				await this.playProfessionalFireAlarm();
				break;
			case "LOW":
				await this.playProfessionalNotificationChime();
				break;
			default:
				// Try siren file for unknown severity, fallback to enhanced siren
				const defaultSirenPlayed = await this.playProfessionalSirenFile();
				if (!defaultSirenPlayed) {
					await this.playEnhancedEmergencySiren();
				}
		}
	}

	addActiveAlarm(alarmId: string, severity: string) {
		console.log(`🚨 Adding active alarm: ${alarmId} (${severity})`);
		this.activeAlarmIds.add(alarmId);
		this.startPersistentAlert();
	}

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

	private startPersistentAlert() {
		if (!this.isEnabled || this.isPlaying) return;

		this.isPlaying = true;
		console.log(
			"🔊 Starting enhanced professional persistent alarm alert loop (NO OVERLAP)"
		);

		// Play immediately (if not already playing)
		this.playCurrentAlertSound();

		// Set up interval for continuous alerts with proper spacing
		this.currentAudioLoop.intervalId = setInterval(() => {
			if (this.activeAlarmIds.size > 0 && this.isEnabled) {
				this.playCurrentAlertSound();
			} else {
				this.stopPersistentAlert();
			}
		}, this.getAlertInterval());
	}

	private stopPersistentAlert() {
		if (this.currentAudioLoop.intervalId) {
			clearInterval(this.currentAudioLoop.intervalId);
			this.currentAudioLoop.intervalId = null;
		}

		if (this.currentAudioLoop.stopCallback) {
			this.currentAudioLoop.stopCallback();
			this.currentAudioLoop.stopCallback = null;
		}

		// Stop all currently playing audio
		this.stopAllCurrentAudio();

		this.isPlaying = false;
		console.log("🔇 Stopped enhanced professional persistent alarm alerts");
	}

	private getAlertInterval(): number {
		// Longer intervals to ensure no overlap
		const severities = Array.from(this.activeAlarmIds).map(() => "CRITICAL"); // Simplified for now

		if (severities.includes("CRITICAL")) return 10000; // Every 10 seconds for critical
		if (severities.includes("HIGH")) return 12000; // Every 12 seconds for high
		if (severities.includes("MEDIUM")) return 15000; // Every 15 seconds for medium
		return 20000; // Every 20 seconds for low
	}

	private async playCurrentAlertSound() {
		if (
			!this.isEnabled ||
			this.activeAlarmIds.size === 0 ||
			!this.shouldPlayAudio()
		)
			return;

		// Try to play professional siren file first, fallback to enhanced synthesized
		const sirenPlayed = await this.playProfessionalSirenFile();
		if (!sirenPlayed) {
			await this.playEnhancedEmergencySiren();
		}
	}

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

	setEnabled(enabled: boolean) {
		this.isEnabled = enabled;
		if (!enabled) {
			this.stopPersistentAlert();
			this.activeAlarmIds.clear();
		}
		console.log(
			`🔊 Enhanced professional audio alerts ${
				enabled ? "enabled" : "disabled"
			}`
		);
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(1, volume));
		console.log(
			`🔊 Enhanced professional audio volume set to ${Math.round(
				this.volume * 100
			)}%`
		);
	}

	isAudioEnabled(): boolean {
		return this.isEnabled;
	}

	getActiveAlarmCount(): number {
		return this.activeAlarmIds.size;
	}

	isCurrentlyPlaying(): boolean {
		return this.isCurrentlyPlayingAudio;
	}

	forceStopAllAlerts() {
		this.stopPersistentAlert();
		this.activeAlarmIds.clear();
		this.stopAllCurrentAudio();
		console.log(
			"🛑 Force stopped all enhanced professional audio alerts (COMPLETE CLEANUP)"
		);
	}

	async testAllSounds() {
		console.log(
			"🧪 Testing all enhanced professional alarm sounds (NO OVERLAP)..."
		);

		// Test notification chime (LOW)
		await this.playProfessionalNotificationChime();

		setTimeout(async () => {
			// Test fire alarm (MEDIUM)
			await this.playProfessionalFireAlarm();
		}, 3000);

		setTimeout(async () => {
			// Test police siren (HIGH)
			await this.playProfessionalPoliceSiren();
		}, 8000);

		setTimeout(async () => {
			// Test siren file (CRITICAL)
			const sirenPlayed = await this.playProfessionalSirenFile();
			if (!sirenPlayed) {
				await this.playEnhancedEmergencySiren();
			}
		}, 13000);

		setTimeout(async () => {
			console.log("🎵 All sound tests completed (NO OVERLAP)!");
		}, 18000);
	}

	getSirenStatus(): { loaded: boolean; loading: boolean; available: boolean } {
		return {
			loaded: !!this.sirenAudioBuffer,
			loading: this.isLoadingSiren,
			available: !!this.sirenAudioBuffer || !this.isLoadingSiren,
		};
	}

	getAudioStatus(): {
		isPlaying: boolean;
		activeSourcesCount: number;
		activeSynthSourcesCount: number;
		lastPlayTime: number;
		timeSinceLastPlay: number;
	} {
		return {
			isPlaying: this.isCurrentlyPlayingAudio,
			activeSourcesCount: this.currentAudioSources.length,
			activeSynthSourcesCount: this.currentSynthSources.length,
			lastPlayTime: this.lastAudioStartTime,
			timeSinceLastPlay: Date.now() - this.lastAudioStartTime,
		};
	}
}

export const audioService = new AudioService();

// "use client";

// class AudioService {
// 	private audioContext: AudioContext | null = null;
// 	private isEnabled = true;
// 	private volume = 0.8;
// 	private activeAlarmIds = new Set<string>();
// 	private currentAudioLoop: {
// 		intervalId: NodeJS.Timeout | null;
// 		stopCallback: (() => void) | null;
// 	} = { intervalId: null, stopCallback: null };
// 	private isPlaying = false;
// 	private sirenAudioBuffer: AudioBuffer | null = null;
// 	private isLoadingSiren = false;

// 	constructor() {
// 		// Initialize audio context on first user interaction
// 		if (typeof window !== "undefined") {
// 			document.addEventListener("click", this.initializeAudio.bind(this), {
// 				once: true,
// 			});
// 			document.addEventListener("keydown", this.initializeAudio.bind(this), {
// 				once: true,
// 			});
// 		}
// 	}

// 	private async initializeAudio() {
// 		try {
// 			this.audioContext = new (window.AudioContext ||
// 				(window as any).webkitAudioContext)();
// 			console.log("🔊 Enhanced Professional Audio Service initialized");

// 			// Load the siren audio file
// 			await this.loadSirenAudio();
// 		} catch (error) {
// 			console.error("Failed to initialize audio:", error);
// 		}
// 	}

// 	private async ensureAudioContext() {
// 		if (!this.audioContext) {
// 			await this.initializeAudio();
// 		}

// 		if (this.audioContext?.state === "suspended") {
// 			await this.audioContext.resume();
// 		}
// 	}

// 	// Load the siren.mp3 file into an AudioBuffer
// 	private async loadSirenAudio() {
// 		if (this.isLoadingSiren || this.sirenAudioBuffer) return;

// 		try {
// 			this.isLoadingSiren = true;
// 			console.log("🔊 Loading professional siren audio file...");

// 			// Try to fetch the siren.mp3 file
// 			const response = await fetch("/sounds/siren.mp3");
// 			if (!response.ok) {
// 				throw new Error(`Failed to load siren.mp3: ${response.status}`);
// 			}

// 			const arrayBuffer = await response.arrayBuffer();

// 			if (!this.audioContext) {
// 				await this.ensureAudioContext();
// 			}

// 			if (this.audioContext) {
// 				this.sirenAudioBuffer = await this.audioContext.decodeAudioData(
// 					arrayBuffer
// 				);
// 				console.log("✅ Professional siren audio loaded successfully");
// 			}
// 		} catch (error) {
// 			console.warn(
// 				"⚠️ Could not load siren.mp3, falling back to synthesized sounds:",
// 				error
// 			);
// 			this.sirenAudioBuffer = null;
// 		} finally {
// 			this.isLoadingSiren = false;
// 		}
// 	}

// 	// Play the professional siren.mp3 file
// 	async playProfessionalSirenFile() {
// 		if (!this.isEnabled) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			// Ensure siren is loaded
// 			if (!this.sirenAudioBuffer && !this.isLoadingSiren) {
// 				await this.loadSirenAudio();
// 			}

// 			if (this.sirenAudioBuffer && this.audioContext) {
// 				const source = this.audioContext.createBufferSource();
// 				const gainNode = this.audioContext.createGain();
// 				const filter = this.audioContext.createBiquadFilter();

// 				// Connect nodes
// 				source.connect(filter);
// 				filter.connect(gainNode);
// 				gainNode.connect(this.audioContext.destination);

// 				// Configure the audio
// 				source.buffer = this.sirenAudioBuffer;
// 				source.loop = false;

// 				// Add some professional audio processing
// 				filter.type = "highpass";
// 				filter.frequency.setValueAtTime(100, this.audioContext.currentTime); // Remove low-end rumble
// 				filter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

// 				// Volume control with smooth envelope
// 				gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
// 				gainNode.gain.linearRampToValueAtTime(
// 					this.volume,
// 					this.audioContext.currentTime + 0.1
// 				);

// 				// Fade out at the end
// 				const duration = this.sirenAudioBuffer.duration;
// 				gainNode.gain.setValueAtTime(
// 					this.volume,
// 					this.audioContext.currentTime + duration - 0.5
// 				);
// 				gainNode.gain.linearRampToValueAtTime(
// 					0,
// 					this.audioContext.currentTime + duration
// 				);

// 				source.start(this.audioContext.currentTime);
// 				source.stop(this.audioContext.currentTime + duration);

// 				console.log("🚨 PROFESSIONAL SIREN FILE PLAYING");
// 				return true;
// 			} else {
// 				console.warn("⚠️ Siren audio not available, using fallback");
// 				return false;
// 			}
// 		} catch (error) {
// 			console.error("Failed to play professional siren file:", error);
// 			return false;
// 		}
// 	}

// 	// // Enhanced Emergency Siren - Fallback if file not available
// 	async playEnhancedEmergencySiren() {
// 		if (!this.isEnabled) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			const duration = 4000; // 4 seconds
// 			const oscillator1 = this.audioContext.createOscillator();
// 			const oscillator2 = this.audioContext.createOscillator();
// 			const oscillator3 = this.audioContext.createOscillator();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();
// 			const distortion = this.audioContext.createWaveShaper();

// 			// Connect audio nodes for richer sound
// 			oscillator1.connect(filter);
// 			oscillator2.connect(filter);
// 			oscillator3.connect(filter);
// 			filter.connect(distortion);
// 			distortion.connect(gainNode);
// 			gainNode.connect(this.audioContext.destination);

// 			// Configure filter for professional sound
// 			filter.type = "bandpass";
// 			filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
// 			filter.Q.setValueAtTime(2, this.audioContext.currentTime);

// 			// Add subtle distortion for more realistic siren sound
// 			const samples = 44100;
// 			const curve = new Float32Array(samples);
// 			const deg = Math.PI / 180;
// 			for (let i = 0; i < samples; i++) {
// 				const x = (i * 2) / samples - 1;
// 				curve[i] = ((3 + 20) * x * 20 * deg) / (Math.PI + 20 * Math.abs(x));
// 			}
// 			distortion.curve = curve;
// 			distortion.oversample = "4x";

// 			// Professional emergency frequencies with harmonics
// 			const baseFreq = 660;
// 			const topFreq = 770;
// 			const cycleTime = 1.2; // Slightly slower for more dramatic effect

// 			// Set waveform types for richer sound
// 			oscillator1.type = "sawtooth"; // Main siren
// 			oscillator2.type = "sine"; // Harmonic
// 			oscillator3.type = "triangle"; // Sub-harmonic

// 			// Create complex siren pattern with harmonics
// 			for (let i = 0; i < duration / 1000 / cycleTime; i++) {
// 				const time = this.audioContext.currentTime + i * cycleTime;

// 				// Main oscillator
// 				oscillator1.frequency.setValueAtTime(baseFreq, time);
// 				oscillator1.frequency.linearRampToValueAtTime(
// 					topFreq,
// 					time + cycleTime / 2
// 				);
// 				oscillator1.frequency.linearRampToValueAtTime(
// 					baseFreq,
// 					time + cycleTime
// 				);

// 				// Harmonic (octave)
// 				oscillator2.frequency.setValueAtTime(baseFreq * 1.5, time);
// 				oscillator2.frequency.linearRampToValueAtTime(
// 					topFreq * 1.5,
// 					time + cycleTime / 2
// 				);
// 				oscillator2.frequency.linearRampToValueAtTime(
// 					baseFreq * 1.5,
// 					time + cycleTime
// 				);

// 				// Sub-harmonic
// 				oscillator3.frequency.setValueAtTime(baseFreq * 0.5, time);
// 				oscillator3.frequency.linearRampToValueAtTime(
// 					topFreq * 0.5,
// 					time + cycleTime / 2
// 				);
// 				oscillator3.frequency.linearRampToValueAtTime(
// 					baseFreq * 0.5,
// 					time + cycleTime
// 				);
// 			}

// 			// Professional volume envelope with dynamic range
// 			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
// 			gainNode.gain.linearRampToValueAtTime(
// 				this.volume * 0.8,
// 				this.audioContext.currentTime + 0.2
// 			);

// 			// Add some volume modulation for more realistic effect
// 			for (let i = 0; i < duration / 1000; i += 0.5) {
// 				const time = this.audioContext.currentTime + i;
// 				gainNode.gain.setValueAtTime(this.volume * 0.8, time);
// 				gainNode.gain.linearRampToValueAtTime(this.volume * 0.6, time + 0.25);
// 				gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, time + 0.5);
// 			}

// 			gainNode.gain.setValueAtTime(
// 				this.volume * 0.8,
// 				this.audioContext.currentTime + duration / 1000 - 0.3
// 			);
// 			gainNode.gain.linearRampToValueAtTime(
// 				0,
// 				this.audioContext.currentTime + duration / 1000
// 			);

// 			// Start all oscillators
// 			oscillator1.start(this.audioContext.currentTime);
// 			oscillator2.start(this.audioContext.currentTime);
// 			oscillator3.start(this.audioContext.currentTime);

// 			// Stop all oscillators
// 			oscillator1.stop(this.audioContext.currentTime + duration / 1000);
// 			oscillator2.stop(this.audioContext.currentTime + duration / 1000);
// 			oscillator3.stop(this.audioContext.currentTime + duration / 1000);

// 			console.log("🚨 ENHANCED EMERGENCY SIREN PLAYING (FALLBACK)");
// 		} catch (error) {
// 			console.error("Failed to play enhanced emergency siren:", error);
// 		}
// 	}

// 	// Professional Police Siren - US Style (Improved)
// 	async playProfessionalPoliceSiren() {
// 		if (!this.isEnabled) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			const duration = 3500; // 3.5 seconds
// 			const oscillator1 = this.audioContext.createOscillator();
// 			const oscillator2 = this.audioContext.createOscillator();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();

// 			// Connect nodes
// 			oscillator1.connect(filter);
// 			oscillator2.connect(filter);
// 			filter.connect(gainNode);
// 			gainNode.connect(this.audioContext.destination);

// 			// Configure filter
// 			filter.type = "bandpass";
// 			filter.frequency.setValueAtTime(900, this.audioContext.currentTime);
// 			filter.Q.setValueAtTime(1.5, this.audioContext.currentTime);

// 			// Dual-tone police siren
// 			oscillator1.type = "sawtooth";
// 			oscillator2.type = "square";

// 			// Create authentic police wail pattern
// 			const wailCycles = 3;
// 			const cycleTime = duration / 1000 / wailCycles;

// 			for (let i = 0; i < wailCycles; i++) {
// 				const startTime = this.audioContext.currentTime + i * cycleTime;

// 				// Main siren
// 				oscillator1.frequency.setValueAtTime(650, startTime);
// 				oscillator1.frequency.linearRampToValueAtTime(
// 					1200,
// 					startTime + cycleTime / 2
// 				);
// 				oscillator1.frequency.linearRampToValueAtTime(
// 					650,
// 					startTime + cycleTime
// 				);

// 				// Harmonic layer
// 				oscillator2.frequency.setValueAtTime(650 * 1.2, startTime);
// 				oscillator2.frequency.linearRampToValueAtTime(
// 					1200 * 1.2,
// 					startTime + cycleTime / 2
// 				);
// 				oscillator2.frequency.linearRampToValueAtTime(
// 					650 * 1.2,
// 					startTime + cycleTime
// 				);
// 			}

// 			// Volume envelope
// 			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
// 			gainNode.gain.linearRampToValueAtTime(
// 				this.volume * 0.7,
// 				this.audioContext.currentTime + 0.1
// 			);
// 			gainNode.gain.setValueAtTime(
// 				this.volume * 0.7,
// 				this.audioContext.currentTime + duration / 1000 - 0.2
// 			);
// 			gainNode.gain.linearRampToValueAtTime(
// 				0,
// 				this.audioContext.currentTime + duration / 1000
// 			);

// 			oscillator1.start(this.audioContext.currentTime);
// 			oscillator2.start(this.audioContext.currentTime);
// 			oscillator1.stop(this.audioContext.currentTime + duration / 1000);
// 			oscillator2.stop(this.audioContext.currentTime + duration / 1000);

// 			console.log("🚔 PROFESSIONAL POLICE SIREN PLAYING");
// 		} catch (error) {
// 			console.error("Failed to play professional police siren:", error);
// 		}
// 	}

// 	// Professional Fire Alarm - Standard Building Alarm
// 	async playProfessionalFireAlarm() {
// 		if (!this.isEnabled) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			// Standard fire alarm pattern: 3 beeps, pause, repeat
// 			const beepDuration = 0.5;
// 			const pauseDuration = 0.5;
// 			const longPause = 1.5;
// 			const totalCycles = 2;

// 			for (let cycle = 0; cycle < totalCycles; cycle++) {
// 				for (let beep = 0; beep < 3; beep++) {
// 					const startTime =
// 						this.audioContext.currentTime +
// 						cycle * (3 * (beepDuration + pauseDuration) + longPause) +
// 						beep * (beepDuration + pauseDuration);

// 					const oscillator = this.audioContext.createOscillator();
// 					const gainNode = this.audioContext.createGain();
// 					const filter = this.audioContext.createBiquadFilter();

// 					oscillator.connect(filter);
// 					filter.connect(gainNode);
// 					gainNode.connect(this.audioContext.destination);

// 					// Standard fire alarm frequency (520 Hz)
// 					oscillator.frequency.setValueAtTime(520, startTime);
// 					oscillator.type = "square";

// 					// Filter for professional sound
// 					filter.type = "lowpass";
// 					filter.frequency.setValueAtTime(1500, startTime);

// 					// Sharp attack and decay
// 					gainNode.gain.setValueAtTime(0, startTime);
// 					gainNode.gain.linearRampToValueAtTime(
// 						this.volume * 0.8,
// 						startTime + 0.02
// 					);
// 					gainNode.gain.setValueAtTime(
// 						this.volume * 0.8,
// 						startTime + beepDuration - 0.02
// 					);
// 					gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

// 					oscillator.start(startTime);
// 					oscillator.stop(startTime + beepDuration);
// 				}
// 			}

// 			console.log("🔥 PROFESSIONAL FIRE ALARM PLAYING");
// 		} catch (error) {
// 			console.error("Failed to play professional fire alarm:", error);
// 		}
// 	}

// 	// Professional Notification Chime
// 	async playProfessionalNotificationChime() {
// 		if (!this.isEnabled) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			// Two-tone chime (like hospital or airport announcements)
// 			const frequencies = [523.25, 659.25]; // C5 and E5 notes
// 			const noteDuration = 0.8;

// 			for (let i = 0; i < frequencies.length; i++) {
// 				const startTime = this.audioContext.currentTime + i * noteDuration;

// 				const oscillator = this.audioContext.createOscillator();
// 				const gainNode = this.audioContext.createGain();
// 				const filter = this.audioContext.createBiquadFilter();

// 				oscillator.connect(filter);
// 				filter.connect(gainNode);
// 				gainNode.connect(this.audioContext.destination);

// 				oscillator.frequency.setValueAtTime(frequencies[i], startTime);
// 				oscillator.type = "sine";

// 				// Soft filter
// 				filter.type = "lowpass";
// 				filter.frequency.setValueAtTime(2000, startTime);

// 				// Smooth envelope
// 				gainNode.gain.setValueAtTime(0, startTime);
// 				gainNode.gain.linearRampToValueAtTime(
// 					this.volume * 0.4,
// 					startTime + 0.1
// 				);
// 				gainNode.gain.setValueAtTime(
// 					this.volume * 0.4,
// 					startTime + noteDuration - 0.2
// 				);
// 				gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

// 				oscillator.start(startTime);
// 				oscillator.stop(startTime + noteDuration);
// 			}

// 			console.log("🎵 PROFESSIONAL NOTIFICATION CHIME PLAYING");
// 		} catch (error) {
// 			console.error("Failed to play professional notification chime:", error);
// 		}
// 	}

// 	// Play appropriate professional sound based on alarm severity
// 	async playAlarmSound(severity: string) {
// 		switch (severity) {
// 			case "CRITICAL":
// 				// Try to play siren file first, fallback to synthesized
// 				const sirenPlayed = await this.playProfessionalSirenFile();
// 				if (!sirenPlayed) {
// 					await this.playEnhancedEmergencySiren();
// 				}
// 				break;
// 			case "HIGH":
// 				await this.playProfessionalPoliceSiren();
// 				break;
// 			case "MEDIUM":
// 				await this.playProfessionalFireAlarm();
// 				break;
// 			case "LOW":
// 				await this.playProfessionalNotificationChime();
// 				break;
// 			default:
// 				// Try siren file for unknown severity, fallback to enhanced siren
// 				const defaultSirenPlayed = await this.playProfessionalSirenFile();
// 				if (!defaultSirenPlayed) {
// 					await this.playEnhancedEmergencySiren();
// 				}
// 		}
// 	}

// 	// Add alarm to active tracking
// 	addActiveAlarm(alarmId: string, severity: string) {
// 		console.log(`🚨 Adding active alarm: ${alarmId} (${severity})`);
// 		this.activeAlarmIds.add(alarmId);
// 		this.startPersistentAlert();
// 	}

// 	// Remove alarm from active tracking
// 	removeActiveAlarm(alarmId: string) {
// 		console.log(`✅ Removing acknowledged alarm: ${alarmId}`);
// 		this.activeAlarmIds.delete(alarmId);

// 		if (this.activeAlarmIds.size === 0) {
// 			console.log("🔇 All alarms acknowledged - stopping audio alerts");
// 			this.stopPersistentAlert();
// 		} else {
// 			console.log(
// 				`🔊 ${this.activeAlarmIds.size} alarms still active - continuing alerts`
// 			);
// 		}
// 	}

// 	// Start persistent alert loop with professional sounds
// 	private startPersistentAlert() {
// 		if (!this.isEnabled || this.isPlaying) return;

// 		this.isPlaying = true;
// 		console.log(
// 			"🔊 Starting enhanced professional persistent alarm alert loop"
// 		);

// 		// Play immediately
// 		this.playCurrentAlertSound();

// 		// Set up interval for continuous alerts
// 		this.currentAudioLoop.intervalId = setInterval(() => {
// 			if (this.activeAlarmIds.size > 0 && this.isEnabled) {
// 				this.playCurrentAlertSound();
// 			} else {
// 				this.stopPersistentAlert();
// 			}
// 		}, this.getAlertInterval());
// 	}

// 	// Stop persistent alert loop
// 	private stopPersistentAlert() {
// 		if (this.currentAudioLoop.intervalId) {
// 			clearInterval(this.currentAudioLoop.intervalId);
// 			this.currentAudioLoop.intervalId = null;
// 		}

// 		if (this.currentAudioLoop.stopCallback) {
// 			this.currentAudioLoop.stopCallback();
// 			this.currentAudioLoop.stopCallback = null;
// 		}

// 		this.isPlaying = false;
// 		console.log("🔇 Stopped enhanced professional persistent alarm alerts");
// 	}

// 	// Get alert interval based on severity (professional timing)
// 	private getAlertInterval(): number {
// 		const severities = Array.from(this.activeAlarmIds).map(() => "CRITICAL"); // Simplified for now

// 		if (severities.includes("CRITICAL")) return 8000; // Every 8 seconds for critical
// 		return 20000; // Every 20 seconds for low
// 	}

// 	// Play current alert sound based on active alarms
// 	private async playCurrentAlertSound() {
// 		if (!this.isEnabled || this.activeAlarmIds.size === 0) return;

// 		// Try to play professional siren file first, fallback to enhanced synthesized
// 		const sirenPlayed = await this.playProfessionalSirenFile();
// 		if (!sirenPlayed) {
// 			await this.playEnhancedEmergencySiren();
// 		}
// 	}

// 	// Update active alarms and manage persistent alerts
// 	updateActiveAlarms(
// 		alarms: Array<{ id: string; severity: string; status: string }>
// 	) {
// 		const currentActiveIds = new Set(
// 			alarms
// 				.filter((alarm) => alarm.status === "ACTIVE")
// 				.map((alarm) => alarm.id)
// 		);

// 		// Find newly acknowledged alarms
// 		const acknowledgedAlarms = Array.from(this.activeAlarmIds).filter(
// 			(id) => !currentActiveIds.has(id)
// 		);

// 		// Remove acknowledged alarms
// 		acknowledgedAlarms.forEach((id) => this.removeActiveAlarm(id));

// 		// Add new active alarms
// 		alarms
// 			.filter(
// 				(alarm) =>
// 					alarm.status === "ACTIVE" && !this.activeAlarmIds.has(alarm.id)
// 			)
// 			.forEach((alarm) => this.addActiveAlarm(alarm.id, alarm.severity));
// 	}

// 	// Control methods
// 	setEnabled(enabled: boolean) {
// 		this.isEnabled = enabled;
// 		if (!enabled) {
// 			this.stopPersistentAlert();
// 			this.activeAlarmIds.clear();
// 		}
// 		console.log(
// 			`🔊 Enhanced professional audio alerts ${
// 				enabled ? "enabled" : "disabled"
// 			}`
// 		);
// 	}

// 	setVolume(volume: number) {
// 		this.volume = Math.max(0, Math.min(1, volume));
// 		console.log(
// 			`🔊 Enhanced professional audio volume set to ${Math.round(
// 				this.volume * 100
// 			)}%`
// 		);
// 	}

// 	isAudioEnabled(): boolean {
// 		return this.isEnabled;
// 	}

// 	getActiveAlarmCount(): number {
// 		return this.activeAlarmIds.size;
// 	}

// 	isCurrentlyPlaying(): boolean {
// 		return this.isPlaying;
// 	}

// 	// Force stop all alerts (emergency stop)
// 	forceStopAllAlerts() {
// 		this.stopPersistentAlert();
// 		this.activeAlarmIds.clear();
// 		console.log("🛑 Force stopped all enhanced professional audio alerts");
// 	}

// 	// Get siren loading status
// 	getSirenStatus(): { loaded: boolean; loading: boolean; available: boolean } {
// 		return {
// 			loaded: !!this.sirenAudioBuffer,
// 			loading: this.isLoadingSiren,
// 			available: !!this.sirenAudioBuffer || !this.isLoadingSiren,
// 		};
// 	}
// }

// export const audioService = new AudioService();

// "use client";

// class AudioService {
// 	private audioContext: AudioContext | null = null;
// 	private isEnabled = true;
// 	private volume = 0.8;
// 	private activeAlarmIds = new Set<string>();
// 	private currentAudioLoop: {
// 		intervalId: NodeJS.Timeout | null;
// 		stopCallback: (() => void) | null;
// 	} = { intervalId: null, stopCallback: null };
// 	private isPlaying = false;

// 	constructor() {
// 		// Initialize audio context on first user interaction
// 		if (typeof window !== "undefined") {
// 			document.addEventListener("click", this.initializeAudio.bind(this), {
// 				once: true,
// 			});
// 			document.addEventListener("keydown", this.initializeAudio.bind(this), {
// 				once: true,
// 			});
// 		}
// 	}

// 	private async initializeAudio() {
// 		try {
// 			this.audioContext = new (window.AudioContext ||
// 				(window as any).webkitAudioContext)();
// 			console.log("🔊 Professional Audio Service initialized");
// 		} catch (error) {
// 			console.error("Failed to initialize audio:", error);
// 		}
// 	}

// 	private async ensureAudioContext() {
// 		if (!this.audioContext) {
// 			await this.initializeAudio();
// 		}

// 		if (this.audioContext?.state === "suspended") {
// 			await this.audioContext.resume();
// 		}
// 	}

// 	// Professional Emergency Siren - European Style
// 	async playProfessionalEmergencySiren() {
// 		if (!this.isEnabled) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			const duration = 4000; // 4 seconds
// 			const oscillator1 = this.audioContext.createOscillator();
// 			const oscillator2 = this.audioContext.createOscillator();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();

// 			// Connect audio nodes
// 			oscillator1.connect(filter);
// 			oscillator2.connect(filter);
// 			filter.connect(gainNode);
// 			gainNode.connect(this.audioContext.destination);

// 			// Configure filter for professional sound
// 			filter.type = "lowpass";
// 			filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
// 			filter.Q.setValueAtTime(1, this.audioContext.currentTime);

// 			// Professional emergency frequencies (European standard)
// 			const lowFreq = 660; // Hz
// 			const highFreq = 770; // Hz
// 			const cycleTime = 1.0; // 1 second cycles

// 			// Set waveform types for professional sound
// 			oscillator1.type = "sine";
// 			oscillator2.type = "sine";

// 			// Create alternating siren pattern
// 			for (let i = 0; i < duration / 1000 / cycleTime; i++) {
// 				const time = this.audioContext.currentTime + i * cycleTime;

// 				if (i % 2 === 0) {
// 					// Rising tone
// 					oscillator1.frequency.setValueAtTime(lowFreq, time);
// 					oscillator1.frequency.linearRampToValueAtTime(
// 						highFreq,
// 						time + cycleTime / 2
// 					);
// 					oscillator1.frequency.linearRampToValueAtTime(
// 						lowFreq,
// 						time + cycleTime
// 					);

// 					oscillator2.frequency.setValueAtTime(lowFreq + 5, time); // Slight detuning for richness
// 					oscillator2.frequency.linearRampToValueAtTime(
// 						highFreq + 5,
// 						time + cycleTime / 2
// 					);
// 					oscillator2.frequency.linearRampToValueAtTime(
// 						lowFreq + 5,
// 						time + cycleTime
// 					);
// 				}
// 			}

// 			// Professional volume envelope
// 			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
// 			gainNode.gain.linearRampToValueAtTime(
// 				this.volume * 0.7,
// 				this.audioContext.currentTime + 0.1
// 			);
// 			gainNode.gain.setValueAtTime(
// 				this.volume * 0.7,
// 				this.audioContext.currentTime + duration / 1000 - 0.2
// 			);
// 			gainNode.gain.linearRampToValueAtTime(
// 				0,
// 				this.audioContext.currentTime + duration / 1000
// 			);

// 			// Start and stop
// 			oscillator1.start(this.audioContext.currentTime);
// 			oscillator2.start(this.audioContext.currentTime);
// 			oscillator1.stop(this.audioContext.currentTime + duration / 1000);
// 			oscillator2.stop(this.audioContext.currentTime + duration / 1000);

// 			console.log("🚨 PROFESSIONAL EMERGENCY SIREN PLAYING");
// 		} catch (error) {
// 			console.error("Failed to play professional emergency siren:", error);
// 		}
// 	}

// 	// Play appropriate professional sound based on alarm severity
// 	async playAlarmSound(severity: string) {
// 		switch (severity) {
// 			case "CRITICAL":
// 				await this.playProfessionalEmergencySiren();
// 				break;
// 		}
// 	}

// 	// Add alarm to active tracking
// 	addActiveAlarm(alarmId: string, severity: string) {
// 		console.log(`🚨 Adding active alarm: ${alarmId} (${severity})`);
// 		this.activeAlarmIds.add(alarmId);
// 		this.startPersistentAlert();
// 	}

// 	// Remove alarm from active tracking
// 	removeActiveAlarm(alarmId: string) {
// 		console.log(`✅ Removing acknowledged alarm: ${alarmId}`);
// 		this.activeAlarmIds.delete(alarmId);

// 		if (this.activeAlarmIds.size === 0) {
// 			console.log("🔇 All alarms acknowledged - stopping audio alerts");
// 			this.stopPersistentAlert();
// 		} else {
// 			console.log(
// 				`🔊 ${this.activeAlarmIds.size} alarms still active - continuing alerts`
// 			);
// 		}
// 	}

// 	// Get highest severity from active alarms
// 	private getHighestActiveSeverity(
// 		alarms: Array<{ id: string; severity: string; status: string }>
// 	): string {
// 		const activeAlarms = alarms.filter(
// 			(alarm) => this.activeAlarmIds.has(alarm.id) && alarm.status === "ACTIVE"
// 		);

// 		if (activeAlarms.length === 0) return "LOW";

// 		const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
// 		const highestSeverity = activeAlarms.reduce((highest, alarm) => {
// 			return (severityOrder[alarm.severity as keyof typeof severityOrder] ||
// 				0) > (severityOrder[highest as keyof typeof severityOrder] || 0)
// 				? alarm.severity
// 				: highest;
// 		}, "LOW");

// 		return highestSeverity;
// 	}

// 	// Start persistent alert loop with professional sounds
// 	private startPersistentAlert() {
// 		if (!this.isEnabled || this.isPlaying) return;

// 		this.isPlaying = true;
// 		console.log("🔊 Starting professional persistent alarm alert loop");

// 		// Play immediately
// 		this.playCurrentAlertSound();

// 		// Set up interval for continuous alerts
// 		this.currentAudioLoop.intervalId = setInterval(() => {
// 			if (this.activeAlarmIds.size > 0 && this.isEnabled) {
// 				this.playCurrentAlertSound();
// 			} else {
// 				this.stopPersistentAlert();
// 			}
// 		}, this.getAlertInterval());
// 	}

// 	// Stop persistent alert loop
// 	private stopPersistentAlert() {
// 		if (this.currentAudioLoop.intervalId) {
// 			clearInterval(this.currentAudioLoop.intervalId);
// 			this.currentAudioLoop.intervalId = null;
// 		}

// 		if (this.currentAudioLoop.stopCallback) {
// 			this.currentAudioLoop.stopCallback();
// 			this.currentAudioLoop.stopCallback = null;
// 		}

// 		this.isPlaying = false;
// 		console.log("🔇 Stopped professional persistent alarm alerts");
// 	}

// 	// Get alert interval based on severity (professional timing)
// 	private getAlertInterval(): number {
// 		const severities = Array.from(this.activeAlarmIds).map(() => "CRITICAL"); // Simplified for now

// 		if (severities.includes("CRITICAL")) return 6000; // Every 6 seconds for critical (less annoying but still urgent)
// 		if (severities.includes("HIGH")) return 8000; // Every 8 seconds for high
// 		if (severities.includes("MEDIUM")) return 12000; // Every 12 seconds for medium
// 		return 15000; // Every 15 seconds for low
// 	}

// 	// Play current alert sound based on active alarms
// 	private async playCurrentAlertSound() {
// 		if (!this.isEnabled || this.activeAlarmIds.size === 0) return;

// 		// For now, play emergency siren for any active alarms (can be enhanced to check actual severities)
// 		await this.playProfessionalEmergencySiren();
// 	}

// 	// Update active alarms and manage persistent alerts
// 	updateActiveAlarms(
// 		alarms: Array<{ id: string; severity: string; status: string }>
// 	) {
// 		const currentActiveIds = new Set(
// 			alarms
// 				.filter((alarm) => alarm.status === "ACTIVE")
// 				.map((alarm) => alarm.id)
// 		);

// 		// Find newly acknowledged alarms
// 		const acknowledgedAlarms = Array.from(this.activeAlarmIds).filter(
// 			(id) => !currentActiveIds.has(id)
// 		);

// 		// Remove acknowledged alarms
// 		acknowledgedAlarms.forEach((id) => this.removeActiveAlarm(id));

// 		// Add new active alarms
// 		alarms
// 			.filter(
// 				(alarm) =>
// 					alarm.status === "ACTIVE" && !this.activeAlarmIds.has(alarm.id)
// 			)
// 			.forEach((alarm) => this.addActiveAlarm(alarm.id, alarm.severity));
// 	}

// 	// Control methods
// 	setEnabled(enabled: boolean) {
// 		this.isEnabled = enabled;
// 		if (!enabled) {
// 			this.stopPersistentAlert();
// 			this.activeAlarmIds.clear();
// 		}
// 		console.log(
// 			`🔊 Professional audio alerts ${enabled ? "enabled" : "disabled"}`
// 		);
// 	}

// 	setVolume(volume: number) {
// 		this.volume = Math.max(0, Math.min(1, volume));
// 		console.log(
// 			`🔊 Professional audio volume set to ${Math.round(this.volume * 100)}%`
// 		);
// 	}

// 	isAudioEnabled(): boolean {
// 		return this.isEnabled;
// 	}

// 	getActiveAlarmCount(): number {
// 		return this.activeAlarmIds.size;
// 	}

// 	isCurrentlyPlaying(): boolean {
// 		return this.isPlaying;
// 	}

// 	// Force stop all alerts (emergency stop)
// 	forceStopAllAlerts() {
// 		this.stopPersistentAlert();
// 		this.activeAlarmIds.clear();
// 		console.log("🛑 Force stopped all professional audio alerts");
// 	}
// }

// export const audioService = new AudioService();
