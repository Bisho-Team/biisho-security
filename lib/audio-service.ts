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
	private minimumGapBetweenSounds = 1000;
	private audioElements: HTMLAudioElement[] = [];
	private sirenLoadAttempts = 0;
	private maxSirenLoadAttempts = 3;
	private forceAudioEnabled = false;
	private audioInitialized = false;

	constructor() {
		if (typeof window !== "undefined") {
			this.initializeImmediately();
			this.setupForceAudioPlayback();
		}
	}

	private async initializeImmediately() {
		try {
			// Force immediate initialization without waiting for user interaction
			this.forceAudioEnabled = true;
			await this.forceInitializeAudio();
			console.log(
				"🚨 CRITICAL AUDIO SYSTEM: Force initialized for emergency alerts"
			);
		} catch (error) {
			console.error("Initial audio setup failed, will retry:", error);
			// Retry initialization multiple times
			this.retryInitialization();
		}
	}

	private setupForceAudioPlayback() {
		// Multiple strategies to bypass browser restrictions

		// Strategy 1: Initialize on any document event
		const events = [
			"click",
			"keydown",
			"touchstart",
			"mousedown",
			"mousemove",
			"scroll",
			"resize",
		];
		events.forEach((event) => {
			document.addEventListener(event, this.forceEnableAudio.bind(this), {
				once: true,
				passive: true,
			});
		});

		// Strategy 2: Initialize on page visibility change
		document.addEventListener(
			"visibilitychange",
			this.forceEnableAudio.bind(this),
			{ once: true }
		);

		// Strategy 3: Initialize on focus events
		window.addEventListener("focus", this.forceEnableAudio.bind(this), {
			once: true,
		});

		// Strategy 4: Periodic retry initialization
		const retryInterval = setInterval(() => {
			if (!this.audioInitialized) {
				this.forceEnableAudio();
			} else {
				clearInterval(retryInterval);
			}
		}, 1000);

		// Strategy 5: Force initialization after short delay
		setTimeout(() => {
			this.forceEnableAudio();
		}, 100);
	}

	async forceEnableAudio() {
		if (this.audioInitialized) return;

		try {
			await this.forceInitializeAudio();
			this.audioInitialized = true;
			console.log("🚨 EMERGENCY AUDIO: Successfully force-enabled");
		} catch (error) {
			console.warn("Force audio enable attempt failed:", error);
		}
	}

	private retryInitialization() {
		let attempts = 0;
		const maxAttempts = 10;

		const retry = async () => {
			attempts++;
			try {
				await this.forceInitializeAudio();
				console.log(`🚨 CRITICAL AUDIO: Initialized on attempt ${attempts}`);
				return;
			} catch (error) {
				if (attempts < maxAttempts) {
					setTimeout(retry, 1000 * attempts); // Exponential backoff
				} else {
					console.error(
						"🚨 CRITICAL: All audio initialization attempts failed"
					);
				}
			}
		};

		setTimeout(retry, 500);
	}

	private async forceInitializeAudio() {
		try {
			// Force create AudioContext regardless of user interaction
			this.audioContext = new (window.AudioContext ||
				(window as any).webkitAudioContext)();

			// Force resume if suspended (bypass browser restrictions)
			if (this.audioContext.state === "suspended") {
				try {
					await this.audioContext.resume();
				} catch (error) {
					// Try alternative resume methods
					try {
						// Create a silent buffer to force resume
						const buffer = this.audioContext.createBuffer(1, 1, 22050);
						const source = this.audioContext.createBufferSource();
						source.buffer = buffer;
						source.connect(this.audioContext.destination);
						source.start(0);
					} catch (resumeError) {
						console.warn("Alternative resume method failed:", resumeError);
					}
				}
			}

			// Initialize multiple HTML5 audio elements for redundancy
			this.initializeMultipleAudioElements();

			// Load siren audio immediately
			await this.loadSirenAudioAggressively();

			console.log("🚨 FORCE AUDIO INITIALIZATION COMPLETE");
		} catch (error) {
			console.error("Force audio initialization failed:", error);
			throw error;
		}
	}

	private initializeMultipleAudioElements() {
		// Create multiple audio elements for maximum compatibility
		for (let i = 0; i < 3; i++) {
			try {
				const audio = new Audio();

				// Configure for immediate playback
				audio.preload = "auto";
				audio.volume = this.volume;
				audio.loop = false;

				// Bypass CORS restrictions
				audio.crossOrigin = "anonymous";

				// Set up for immediate loading
				audio.src = `/sounds/siren.mp3?v=${Date.now()}&instance=${i}`;

				// Force load
				audio.load();

				this.audioElements.push(audio);
				console.log(`🔊 Audio element ${i + 1} initialized`);
			} catch (error) {
				console.warn(`Failed to create audio element ${i + 1}:`, error);
			}
		}
	}

	private async loadSirenAudioAggressively() {
		if (
			this.isLoadingSiren ||
			this.sirenAudioBuffer ||
			this.sirenLoadAttempts >= this.maxSirenLoadAttempts
		) {
			return;
		}

		try {
			this.isLoadingSiren = true;
			this.sirenLoadAttempts++;
			console.log(
				`🚨 AGGRESSIVE SIREN LOADING (attempt ${this.sirenLoadAttempts})...`
			);

			// Method 1: Direct fetch with aggressive headers
			const response = await fetch("/sounds/siren.mp3", {
				method: "GET",
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					"Pragma": "no-cache",
					"Expires": "0",
					"Content-Type": "audio/mpeg",
				},
				cache: "no-cache",
			});

			if (response.ok) {
				const arrayBuffer = await response.arrayBuffer();

				if (this.audioContext && arrayBuffer.byteLength > 0) {
					try {
						this.sirenAudioBuffer = await this.audioContext.decodeAudioData(
							arrayBuffer
						);
						console.log("✅ SIREN LOADED via Web Audio API");
						return;
					} catch (decodeError) {
						console.warn("Web Audio decode failed:", decodeError);
					}
				}
			}
		} catch (error) {
			console.warn(
				`Siren loading attempt ${this.sirenLoadAttempts} failed:`,
				error
			);
		}

		// Method 2: Ensure HTML5 audio elements are loaded
		this.audioElements.forEach((audio, index) => {
			if (audio.readyState < 2) {
				audio.load();
				console.log(`🔄 Reloading audio element ${index + 1}`);
			}
		});

		this.isLoadingSiren = false;

		// Retry if not at max attempts
		if (this.sirenLoadAttempts < this.maxSirenLoadAttempts) {
			setTimeout(() => this.loadSirenAudioAggressively(), 2000);
		}
	}

	private stopAllCurrentAudio() {
		console.log("🔇 Stopping all current audio instances...");

		// Stop Web Audio API sources
		this.currentAudioSources.forEach((source) => {
			try {
				source.stop();
				source.disconnect();
			} catch (error) {
				// Source might already be stopped
			}
		});
		this.currentAudioSources = [];

		// Stop synthesized sources
		this.currentSynthSources.forEach((oscillator) => {
			try {
				oscillator.stop();
				oscillator.disconnect();
			} catch (error) {
				// Oscillator might already be stopped
			}
		});
		this.currentSynthSources = [];

		// Stop all HTML5 audio elements
		this.audioElements.forEach((audio) => {
			try {
				if (!audio.paused) {
					audio.pause();
					audio.currentTime = 0;
				}
			} catch (error) {
				console.warn("Failed to stop audio element:", error);
			}
		});

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

	async playProfessionalSirenFile() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return false;

		try {
			// Force audio context resume if needed
			if (this.audioContext && this.audioContext.state === "suspended") {
				try {
					await this.audioContext.resume();
				} catch (resumeError) {
					console.warn("Failed to resume audio context:", resumeError);
				}
			}

			// Try Web Audio API first
			if (
				this.sirenAudioBuffer &&
				this.audioContext &&
				this.audioContext.state === "running"
			) {
				return await this.playWebAudioSiren();
			}

			// Try HTML5 Audio elements
			for (let i = 0; i < this.audioElements.length; i++) {
				const audio = this.audioElements[i];
				if (audio.readyState >= 2) {
					try {
						return await this.playHTML5Siren(audio, i);
					} catch (error) {
						console.warn(`HTML5 audio element ${i + 1} failed:`, error);
						continue;
					}
				}
			}

			// If no audio loaded, try to load and play immediately
			if (
				!this.isLoadingSiren &&
				this.sirenLoadAttempts < this.maxSirenLoadAttempts
			) {
				await this.loadSirenAudioAggressively();

				// Try again after loading
				if (this.sirenAudioBuffer && this.audioContext) {
					return await this.playWebAudioSiren();
				}
			}

			console.warn("⚠️ All siren playback methods failed, using fallback");
			return false;
		} catch (error) {
			console.error("Failed to play professional siren file:", error);
			this.isCurrentlyPlayingAudio = false;
			return false;
		}
	}

	private async playWebAudioSiren(): Promise<boolean> {
		if (!this.audioContext || !this.sirenAudioBuffer) return false;

		try {
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

			// Professional audio processing
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
				console.log("🔇 Web Audio siren playback completed");
			};

			source.start(this.audioContext.currentTime);
			source.stop(this.audioContext.currentTime + duration);

			console.log("🚨 PROFESSIONAL SIREN FILE PLAYING (Web Audio API)");
			return true;
		} catch (error) {
			console.error("Web Audio siren playback failed:", error);
			this.isCurrentlyPlayingAudio = false;
			return false;
		}
	}

	private async playHTML5Siren(
		audio: HTMLAudioElement,
		index: number
	): Promise<boolean> {
		try {
			// Stop any currently playing audio first
			this.stopAllCurrentAudio();

			// Reset and configure audio element
			audio.currentTime = 0;
			audio.volume = this.volume;

			// Force play without user interaction
			const playPromise = audio.play();

			this.isCurrentlyPlayingAudio = true;
			this.lastAudioStartTime = Date.now();

			// Handle modern browsers that return a promise
			if (playPromise && typeof playPromise.then === "function") {
				try {
					await playPromise;
				} catch (playError) {
					// Try to force play anyway
					console.warn(
						`Play promise rejected for element ${
							index + 1
						}, trying force play:`,
						playError
					);

					// Alternative play methods
					try {
						audio.muted = false;
						audio.volume = this.volume;
						await audio.play();
					} catch (forceError) {
						throw forceError;
					}
				}
			}

			// Set up cleanup when audio ends
			const onEnded = () => {
				this.isCurrentlyPlayingAudio = false;
				audio.removeEventListener("ended", onEnded);
				console.log(`🔇 HTML5 siren playback completed (element ${index + 1})`);
			};

			audio.addEventListener("ended", onEnded, { once: true });

			console.log(
				`🚨 PROFESSIONAL SIREN FILE PLAYING (HTML5 Audio Element ${index + 1})`
			);
			return true;
		} catch (error) {
			console.error(
				`HTML5 siren playback failed (element ${index + 1}):`,
				error
			);
			this.isCurrentlyPlayingAudio = false;
			return false;
		}
	}

	async playEnhancedEmergencySiren() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			// Force audio context if needed
			if (!this.audioContext) {
				await this.forceInitializeAudio();
			}

			if (this.audioContext && this.audioContext.state === "suspended") {
				await this.audioContext.resume();
			}

			if (!this.audioContext || this.audioContext.state !== "running") {
				console.warn(
					"AudioContext not available, cannot play synthesized siren"
				);
				return;
			}

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

			console.log("🚨 ENHANCED EMERGENCY SIREN PLAYING (FORCE MODE)");
		} catch (error) {
			console.error("Failed to play enhanced emergency siren:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playProfessionalPoliceSiren() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			// Force audio context if needed
			if (!this.audioContext) {
				await this.forceInitializeAudio();
			}

			if (this.audioContext && this.audioContext.state === "suspended") {
				await this.audioContext.resume();
			}

			if (!this.audioContext || this.audioContext.state !== "running") {
				console.warn("AudioContext not available, cannot play police siren");
				return;
			}

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

			console.log("🚔 PROFESSIONAL POLICE SIREN PLAYING (FORCE MODE)");
		} catch (error) {
			console.error("Failed to play professional police siren:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playProfessionalFireAlarm() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			// Force audio context if needed
			if (!this.audioContext) {
				await this.forceInitializeAudio();
			}

			if (this.audioContext && this.audioContext.state === "suspended") {
				await this.audioContext.resume();
			}

			if (!this.audioContext || this.audioContext.state !== "running") {
				console.warn("AudioContext not available, cannot play fire alarm");
				return;
			}

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

			console.log("🔥 PROFESSIONAL FIRE ALARM PLAYING (FORCE MODE)");
		} catch (error) {
			console.error("Failed to play professional fire alarm:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playProfessionalNotificationChime() {
		if (!this.isEnabled || !this.shouldPlayAudio()) return;

		try {
			// Force audio context if needed
			if (!this.audioContext) {
				await this.forceInitializeAudio();
			}

			if (this.audioContext && this.audioContext.state === "suspended") {
				await this.audioContext.resume();
			}

			if (!this.audioContext || this.audioContext.state !== "running") {
				console.warn(
					"AudioContext not available, cannot play notification chime"
				);
				return;
			}

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

			console.log("🎵 PROFESSIONAL NOTIFICATION CHIME PLAYING (FORCE MODE)");
		} catch (error) {
			console.error("Failed to play professional notification chime:", error);
			this.isCurrentlyPlayingAudio = false;
		}
	}

	async playAlarmSound(severity: string) {
		// Force audio initialization if not done
		if (!this.audioInitialized) {
			await this.forceEnableAudio();
		}

		// Check if we should play audio to prevent overlapping
		if (!this.shouldPlayAudio()) {
			console.log(
				`⏸️ Skipping ${severity} alarm sound - audio already playing or too soon`
			);
			return;
		}

		console.log(`🚨 FORCE PLAYING ${severity} ALARM SOUND`);

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
		console.log("🔊 Starting FORCE persistent alarm alert loop");

		// Play immediately
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
		console.log("🔇 Stopped FORCE persistent alarm alerts");
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

		// Force audio initialization if needed
		if (!this.audioInitialized) {
			await this.forceEnableAudio();
		}

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
		console.log(`🔊 FORCE audio alerts ${enabled ? "enabled" : "disabled"}`);
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(1, volume));

		// Update all audio elements
		this.audioElements.forEach((audio) => {
			audio.volume = this.volume;
		});

		console.log(
			`🔊 FORCE audio volume set to ${Math.round(this.volume * 100)}%`
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
		console.log("🛑 FORCE stopped all audio alerts (COMPLETE CLEANUP)");
	}

	async testAllSounds() {
		console.log("🧪 FORCE testing all alarm sounds...");

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
			console.log("🎵 All FORCE sound tests completed!");
		}, 18000);
	}

	getSirenStatus(): {
		loaded: boolean;
		loading: boolean;
		available: boolean;
		method: string;
		elements: number;
	} {
		let method = "none";
		if (this.sirenAudioBuffer) method = "web-audio";
		else if (this.audioElements.some((audio) => audio.readyState >= 2))
			method = "html5-audio";

		return {
			loaded:
				!!this.sirenAudioBuffer ||
				this.audioElements.some((audio) => audio.readyState >= 2),
			loading: this.isLoadingSiren,
			available:
				!!this.sirenAudioBuffer ||
				this.audioElements.some((audio) => audio.readyState >= 2) ||
				!this.isLoadingSiren,
			method,
			elements: this.audioElements.length,
		};
	}

	getAudioStatus(): {
		isPlaying: boolean;
		activeSourcesCount: number;
		activeSynthSourcesCount: number;
		lastPlayTime: number;
		timeSinceLastPlay: number;
		audioContextState: string;
		sirenLoadAttempts: number;
		audioInitialized: boolean;
		forceEnabled: boolean;
		audioElementsReady: number;
	} {
		return {
			isPlaying: this.isCurrentlyPlayingAudio,
			activeSourcesCount: this.currentAudioSources.length,
			activeSynthSourcesCount: this.currentSynthSources.length,
			lastPlayTime: this.lastAudioStartTime,
			timeSinceLastPlay: Date.now() - this.lastAudioStartTime,
			audioContextState: this.audioContext?.state || "not-initialized",
			sirenLoadAttempts: this.sirenLoadAttempts,
			audioInitialized: this.audioInitialized,
			forceEnabled: this.forceAudioEnabled,
			audioElementsReady: this.audioElements.filter(
				(audio) => audio.readyState >= 2
			).length,
		};
	}

	// Force enable audio (bypasses all restrictions)
	// async forceEnableAudio() {
	// 	try {
	// 		this.forceAudioEnabled = true;
	// 		await this.forceInitializeAudio();
	// 		this.audioInitialized = true;
	// 		console.log("🚨 CRITICAL AUDIO: Force enabled successfully");
	// 	} catch (error) {
	// 		console.error("Force enable audio failed:", error);
	// 	}
	// }
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
// 	private currentAudioSources: AudioBufferSourceNode[] = [];
// 	private currentSynthSources: OscillatorNode[] = [];
// 	private isCurrentlyPlayingAudio = false;
// 	private lastAudioStartTime = 0;
// 	private minimumGapBetweenSounds = 1000; // 1 second minimum gap
// 	private userInteracted = false;
// 	private audioElement: HTMLAudioElement | null = null;
// 	private sirenLoadAttempts = 0;
// 	private maxSirenLoadAttempts = 3;

// 	constructor() {
// 		// Initialize on first user interaction
// 		if (typeof window !== "undefined") {
// 			this.setupUserInteractionListeners();
// 		}
// 	}

// 	private setupUserInteractionListeners() {
// 		const enableAudio = () => {
// 			this.userInteracted = true;
// 			this.initializeAudio();
// 			console.log("🔊 User interaction detected - audio enabled");
// 		};

// 		// Listen for various user interactions
// 		document.addEventListener("click", enableAudio, { once: true });
// 		document.addEventListener("keydown", enableAudio, { once: true });
// 		document.addEventListener("touchstart", enableAudio, { once: true });
// 		document.addEventListener("mousedown", enableAudio, { once: true });
// 	}

// 	private async initializeAudio() {
// 		try {
// 			// Initialize AudioContext
// 			this.audioContext = new (window.AudioContext ||
// 				(window as any).webkitAudioContext)();

// 			// Resume if suspended
// 			if (this.audioContext.state === "suspended") {
// 				await this.audioContext.resume();
// 			}

// 			console.log("🔊 Enhanced Professional Audio Service initialized");

// 			// Load the siren audio using multiple methods
// 			await this.loadSirenAudioSafely();
// 		} catch (error) {
// 			console.error("Failed to initialize audio:", error);
// 			// Fallback to HTML5 audio if Web Audio API fails
// 			this.initializeHTMLAudio();
// 		}
// 	}

// 	private initializeHTMLAudio() {
// 		try {
// 			this.audioElement = new Audio();
// 			this.audioElement.preload = "none"; // Prevent automatic download
// 			this.audioElement.crossOrigin = "anonymous";
// 			console.log("🔊 HTML5 Audio fallback initialized");
// 		} catch (error) {
// 			console.error("Failed to initialize HTML5 audio:", error);
// 		}
// 	}

// 	private async ensureAudioContext() {
// 		if (!this.userInteracted) {
// 			console.warn("⚠️ Audio requires user interaction first");
// 			return false;
// 		}

// 		if (!this.audioContext) {
// 			await this.initializeAudio();
// 		}

// 		if (this.audioContext?.state === "suspended") {
// 			try {
// 				await this.audioContext.resume();
// 			} catch (error) {
// 				console.error("Failed to resume audio context:", error);
// 				return false;
// 			}
// 		}

// 		return true;
// 	}

// 	private stopAllCurrentAudio() {
// 		console.log("🔇 Stopping all current audio instances...");

// 		// Stop all audio buffer sources (siren file)
// 		this.currentAudioSources.forEach((source) => {
// 			try {
// 				source.stop();
// 				source.disconnect();
// 			} catch (error) {
// 				// Source might already be stopped
// 			}
// 		});
// 		this.currentAudioSources = [];

// 		// Stop all synthesized sources (oscillators)
// 		this.currentSynthSources.forEach((oscillator) => {
// 			try {
// 				oscillator.stop();
// 				oscillator.disconnect();
// 			} catch (error) {
// 				// Oscillator might already be stopped
// 			}
// 		});
// 		this.currentSynthSources = [];

// 		// Stop HTML5 audio if playing
// 		if (this.audioElement && !this.audioElement.paused) {
// 			this.audioElement.pause();
// 			this.audioElement.currentTime = 0;
// 		}

// 		this.isCurrentlyPlayingAudio = false;
// 	}

// 	private shouldPlayAudio(): boolean {
// 		const now = Date.now();
// 		const timeSinceLastAudio = now - this.lastAudioStartTime;

// 		if (this.isCurrentlyPlayingAudio) {
// 			console.log("⏸️ Audio already playing, skipping...");
// 			return false;
// 		}

// 		if (timeSinceLastAudio < this.minimumGapBetweenSounds) {
// 			console.log(
// 				`⏸️ Too soon since last audio (${timeSinceLastAudio}ms), skipping...`
// 			);
// 			return false;
// 		}

// 		return true;
// 	}

// 	private async loadSirenAudioSafely() {
// 		if (
// 			this.isLoadingSiren ||
// 			this.sirenAudioBuffer ||
// 			this.sirenLoadAttempts >= this.maxSirenLoadAttempts
// 		) {
// 			return;
// 		}

// 		try {
// 			this.isLoadingSiren = true;
// 			this.sirenLoadAttempts++;
// 			console.log(
// 				`🔊 Loading professional siren audio file (attempt ${this.sirenLoadAttempts})...`
// 			);

// 			// Method 1: Try fetch with proper headers to prevent download managers
// 			const response = await fetch("/sounds/sounds/siren.mp3", {
// 				method: "GET",
// 				headers: {
// 					"Cache-Control": "no-cache",
// 					"Content-Type": "audio/mpeg",
// 					"X-Requested-With": "XMLHttpRequest", // Helps prevent download managers
// 				},
// 				credentials: "same-origin",
// 			});

// 			if (!response.ok) {
// 				throw new Error(`Failed to load siren.mp3: ${response.status}`);
// 			}

// 			// Check if response is actually audio
// 			const contentType = response.headers.get("content-type");
// 			if (!contentType || !contentType.includes("audio")) {
// 				throw new Error("Response is not audio content");
// 			}

// 			const arrayBuffer = await response.arrayBuffer();

// 			if (!this.audioContext) {
// 				await this.ensureAudioContext();
// 			}

// 			if (this.audioContext && arrayBuffer.byteLength > 0) {
// 				this.sirenAudioBuffer = await this.audioContext.decodeAudioData(
// 					arrayBuffer
// 				);
// 				console.log(
// 					"✅ Professional siren audio loaded successfully via Web Audio API"
// 				);
// 				return;
// 			}
// 		} catch (error) {
// 			console.warn(
// 				`⚠️ Web Audio API load failed (attempt ${this.sirenLoadAttempts}):`,
// 				error
// 			);
// 		}

// 		// Method 2: Try HTML5 Audio as fallback (with download prevention)
// 		try {
// 			if (!this.audioElement) {
// 				this.initializeHTMLAudio();
// 			}

// 			if (this.audioElement) {
// 				// Create a promise to handle loading
// 				const loadPromise = new Promise<void>((resolve, reject) => {
// 					const timeout = setTimeout(() => {
// 						reject(new Error("Audio load timeout"));
// 					}, 10000); // 10 second timeout

// 					const onCanPlay = () => {
// 						clearTimeout(timeout);
// 						this.audioElement!.removeEventListener("canplaythrough", onCanPlay);
// 						this.audioElement!.removeEventListener("error", onError);
// 						console.log(
// 							"✅ Professional siren audio loaded successfully via HTML5 Audio"
// 						);
// 						resolve();
// 					};

// 					const onError = (e: any) => {
// 						clearTimeout(timeout);
// 						this.audioElement!.removeEventListener("canplaythrough", onCanPlay);
// 						this.audioElement!.removeEventListener("error", onError);
// 						reject(
// 							new Error(
// 								`HTML5 Audio load error: ${e.message || "Unknown error"}`
// 							)
// 						);
// 					};

// 					this.audioElement!.addEventListener("canplaythrough", onCanPlay, {
// 						once: true,
// 					});
// 					this.audioElement!.addEventListener("error", onError, { once: true });
// 				});

// 				// Set source with cache busting and proper headers
// 				this.audioElement.src = `/sounds/siren.mp3?t=${Date.now()}&xhr=1`;
// 				this.audioElement.load();

// 				await loadPromise;
// 				return;
// 			}
// 		} catch (error) {
// 			console.warn(
// 				`⚠️ HTML5 Audio load failed (attempt ${this.sirenLoadAttempts}):`,
// 				error
// 			);
// 		}

// 		this.isLoadingSiren = false;

// 		// If all attempts failed, log warning but don't throw
// 		if (this.sirenLoadAttempts >= this.maxSirenLoadAttempts) {
// 			console.warn(
// 				"⚠️ All siren loading attempts failed, will use synthesized sounds only"
// 			);
// 		}
// 	}

// 	async playProfessionalSirenFile() {
// 		if (!this.isEnabled || !this.shouldPlayAudio() || !this.userInteracted)
// 			return false;

// 		try {
// 			// Try Web Audio API first
// 			if (this.sirenAudioBuffer && this.audioContext) {
// 				return await this.playWebAudioSiren();
// 			}

// 			// Try HTML5 Audio fallback
// 			if (this.audioElement && this.audioElement.readyState >= 2) {
// 				return await this.playHTML5Siren();
// 			}

// 			// If no audio loaded, try to load it now
// 			if (
// 				!this.isLoadingSiren &&
// 				this.sirenLoadAttempts < this.maxSirenLoadAttempts
// 			) {
// 				await this.loadSirenAudioSafely();

// 				// Try again after loading
// 				if (this.sirenAudioBuffer && this.audioContext) {
// 					return await this.playWebAudioSiren();
// 				}

// 				if (this.audioElement && this.audioElement.readyState >= 2) {
// 					return await this.playHTML5Siren();
// 				}
// 			}

// 			console.warn("⚠️ Siren audio not available, using fallback");
// 			return false;
// 		} catch (error) {
// 			console.error("Failed to play professional siren file:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 			return false;
// 		}
// 	}

// 	private async playWebAudioSiren(): Promise<boolean> {
// 		if (!this.audioContext || !this.sirenAudioBuffer) return false;

// 		try {
// 			await this.ensureAudioContext();

// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			const source = this.audioContext.createBufferSource();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();

// 			// Connect nodes
// 			source.connect(filter);
// 			filter.connect(gainNode);
// 			gainNode.connect(this.audioContext.destination);

// 			// Configure the audio
// 			source.buffer = this.sirenAudioBuffer;
// 			source.loop = false;

// 			// Add some professional audio processing
// 			filter.type = "highpass";
// 			filter.frequency.setValueAtTime(100, this.audioContext.currentTime);
// 			filter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

// 			// Volume control with smooth envelope
// 			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
// 			gainNode.gain.linearRampToValueAtTime(
// 				this.volume,
// 				this.audioContext.currentTime + 0.1
// 			);

// 			// Fade out at the end
// 			const duration = this.sirenAudioBuffer.duration;
// 			gainNode.gain.setValueAtTime(
// 				this.volume,
// 				this.audioContext.currentTime + duration - 0.5
// 			);
// 			gainNode.gain.linearRampToValueAtTime(
// 				0,
// 				this.audioContext.currentTime + duration
// 			);

// 			// Track this audio source
// 			this.currentAudioSources.push(source);
// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

// 			// Set up cleanup when audio ends
// 			source.onended = () => {
// 				this.isCurrentlyPlayingAudio = false;
// 				this.currentAudioSources = this.currentAudioSources.filter(
// 					(s) => s !== source
// 				);
// 				console.log("🔇 Web Audio siren playback completed");
// 			};

// 			source.start(this.audioContext.currentTime);
// 			source.stop(this.audioContext.currentTime + duration);

// 			console.log("🚨 PROFESSIONAL SIREN FILE PLAYING (Web Audio API)");
// 			return true;
// 		} catch (error) {
// 			console.error("Web Audio siren playback failed:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 			return false;
// 		}
// 	}

// 	private async playHTML5Siren(): Promise<boolean> {
// 		if (!this.audioElement) return false;

// 		try {
// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			// Reset audio element
// 			this.audioElement.currentTime = 0;
// 			this.audioElement.volume = this.volume;

// 			// Set up event handlers
// 			const playPromise = new Promise<boolean>((resolve, reject) => {
// 				const timeout = setTimeout(() => {
// 					reject(new Error("HTML5 audio play timeout"));
// 				}, 5000);

// 				const onEnded = () => {
// 					clearTimeout(timeout);
// 					this.audioElement!.removeEventListener("ended", onEnded);
// 					this.audioElement!.removeEventListener("error", onError);
// 					this.isCurrentlyPlayingAudio = false;
// 					console.log("🔇 HTML5 siren playback completed");
// 					resolve(true);
// 				};

// 				const onError = (e: any) => {
// 					clearTimeout(timeout);
// 					this.audioElement!.removeEventListener("ended", onEnded);
// 					this.audioElement!.removeEventListener("error", onError);
// 					this.isCurrentlyPlayingAudio = false;
// 					reject(
// 						new Error(`HTML5 audio play error: ${e.message || "Unknown error"}`)
// 					);
// 				};

// 				this.audioElement!.addEventListener("ended", onEnded, { once: true });
// 				this.audioElement!.addEventListener("error", onError, { once: true });
// 			});

// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

// 			// Play the audio
// 			const playResult = this.audioElement.play();

// 			// Handle play promise if it exists (modern browsers)
// 			if (playResult && typeof playResult.then === "function") {
// 				await playResult;
// 			}

// 			console.log("🚨 PROFESSIONAL SIREN FILE PLAYING (HTML5 Audio)");

// 			// Wait for playback to complete
// 			await playPromise;
// 			return true;
// 		} catch (error) {
// 			console.error("HTML5 siren playback failed:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 			return false;
// 		}
// 	}

// 	async playEnhancedEmergencySiren() {
// 		if (!this.isEnabled || !this.shouldPlayAudio() || !this.userInteracted)
// 			return;

// 		const canPlay = await this.ensureAudioContext();
// 		if (!canPlay || !this.audioContext) return;

// 		try {
// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			const duration = 4000; // 4 seconds
// 			const oscillator1 = this.audioContext.createOscillator();
// 			const oscillator2 = this.audioContext.createOscillator();
// 			const oscillator3 = this.audioContext.createOscillator();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();
// 			const distortion = this.audioContext.createWaveShaper();

// 			// Track these oscillators
// 			this.currentSynthSources.push(oscillator1, oscillator2, oscillator3);
// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

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
// 			const cycleTime = 1.2;

// 			// Set waveform types for richer sound
// 			oscillator1.type = "sawtooth";
// 			oscillator2.type = "sine";
// 			oscillator3.type = "triangle";

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

// 			// Professional volume envelope
// 			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
// 			gainNode.gain.linearRampToValueAtTime(
// 				this.volume * 0.8,
// 				this.audioContext.currentTime + 0.2
// 			);
// 			gainNode.gain.setValueAtTime(
// 				this.volume * 0.8,
// 				this.audioContext.currentTime + duration / 1000 - 0.3
// 			);
// 			gainNode.gain.linearRampToValueAtTime(
// 				0,
// 				this.audioContext.currentTime + duration / 1000
// 			);

// 			// Set up cleanup when audio ends
// 			const endTime = this.audioContext.currentTime + duration / 1000;
// 			oscillator1.onended = () => {
// 				this.isCurrentlyPlayingAudio = false;
// 				this.currentSynthSources = this.currentSynthSources.filter(
// 					(o) => o !== oscillator1 && o !== oscillator2 && o !== oscillator3
// 				);
// 				console.log("🔇 Enhanced emergency siren completed");
// 			};

// 			// Start all oscillators
// 			oscillator1.start(this.audioContext.currentTime);
// 			oscillator2.start(this.audioContext.currentTime);
// 			oscillator3.start(this.audioContext.currentTime);

// 			// Stop all oscillators
// 			oscillator1.stop(endTime);
// 			oscillator2.stop(endTime);
// 			oscillator3.stop(endTime);

// 			console.log("🚨 ENHANCED EMERGENCY SIREN PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play enhanced emergency siren:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playProfessionalPoliceSiren() {
// 		if (!this.isEnabled || !this.shouldPlayAudio() || !this.userInteracted)
// 			return;

// 		const canPlay = await this.ensureAudioContext();
// 		if (!canPlay || !this.audioContext) return;

// 		try {
// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			const duration = 3500;
// 			const oscillator1 = this.audioContext.createOscillator();
// 			const oscillator2 = this.audioContext.createOscillator();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();

// 			// Track these oscillators
// 			this.currentSynthSources.push(oscillator1, oscillator2);
// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

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

// 			// Set up cleanup when audio ends
// 			oscillator1.onended = () => {
// 				this.isCurrentlyPlayingAudio = false;
// 				this.currentSynthSources = this.currentSynthSources.filter(
// 					(o) => o !== oscillator1 && o !== oscillator2
// 				);
// 				console.log("🔇 Police siren completed");
// 			};

// 			oscillator1.start(this.audioContext.currentTime);
// 			oscillator2.start(this.audioContext.currentTime);
// 			oscillator1.stop(this.audioContext.currentTime + duration / 1000);
// 			oscillator2.stop(this.audioContext.currentTime + duration / 1000);

// 			console.log("🚔 PROFESSIONAL POLICE SIREN PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play professional police siren:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playProfessionalFireAlarm() {
// 		if (!this.isEnabled || !this.shouldPlayAudio() || !this.userInteracted)
// 			return;

// 		const canPlay = await this.ensureAudioContext();
// 		if (!canPlay || !this.audioContext) return;

// 		try {
// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

// 			// Standard fire alarm pattern: 3 beeps, pause, repeat
// 			const beepDuration = 0.5;
// 			const pauseDuration = 0.5;
// 			const longPause = 1.5;
// 			const totalCycles = 2;
// 			const totalDuration =
// 				totalCycles * (3 * (beepDuration + pauseDuration) + longPause);

// 			const oscillators: OscillatorNode[] = [];

// 			for (let cycle = 0; cycle < totalCycles; cycle++) {
// 				for (let beep = 0; beep < 3; beep++) {
// 					const startTime =
// 						this.audioContext.currentTime +
// 						cycle * (3 * (beepDuration + pauseDuration) + longPause) +
// 						beep * (beepDuration + pauseDuration);

// 					const oscillator = this.audioContext.createOscillator();
// 					const gainNode = this.audioContext.createGain();
// 					const filter = this.audioContext.createBiquadFilter();

// 					oscillators.push(oscillator);
// 					this.currentSynthSources.push(oscillator);

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

// 			// Set up cleanup when all beeps are done
// 			setTimeout(() => {
// 				this.isCurrentlyPlayingAudio = false;
// 				oscillators.forEach((osc) => {
// 					this.currentSynthSources = this.currentSynthSources.filter(
// 						(o) => o !== osc
// 					);
// 				});
// 				console.log("🔇 Fire alarm completed");
// 			}, totalDuration * 1000);

// 			console.log("🔥 PROFESSIONAL FIRE ALARM PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play professional fire alarm:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playProfessionalNotificationChime() {
// 		if (!this.isEnabled || !this.shouldPlayAudio() || !this.userInteracted)
// 			return;

// 		const canPlay = await this.ensureAudioContext();
// 		if (!canPlay || !this.audioContext) return;

// 		try {
// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

// 			// Two-tone chime
// 			const frequencies = [523.25, 659.25];
// 			const noteDuration = 0.8;
// 			const totalDuration = frequencies.length * noteDuration;

// 			const oscillators: OscillatorNode[] = [];

// 			for (let i = 0; i < frequencies.length; i++) {
// 				const startTime = this.audioContext.currentTime + i * noteDuration;

// 				const oscillator = this.audioContext.createOscillator();
// 				const gainNode = this.audioContext.createGain();
// 				const filter = this.audioContext.createBiquadFilter();

// 				oscillators.push(oscillator);
// 				this.currentSynthSources.push(oscillator);

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

// 			// Set up cleanup when chime is done
// 			setTimeout(() => {
// 				this.isCurrentlyPlayingAudio = false;
// 				oscillators.forEach((osc) => {
// 					this.currentSynthSources = this.currentSynthSources.filter(
// 						(o) => o !== osc
// 					);
// 				});
// 				console.log("🔇 Notification chime completed");
// 			}, totalDuration * 1000);

// 			console.log("🎵 PROFESSIONAL NOTIFICATION CHIME PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play professional notification chime:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playAlarmSound(severity: string) {
// 		// Ensure user has interacted first
// 		if (!this.userInteracted) {
// 			console.warn("⚠️ Audio requires user interaction first");
// 			return;
// 		}

// 		// Check if we should play audio to prevent overlapping
// 		if (!this.shouldPlayAudio()) {
// 			console.log(
// 				`⏸️ Skipping ${severity} alarm sound - audio already playing or too soon`
// 			);
// 			return;
// 		}

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

// 	addActiveAlarm(alarmId: string, severity: string) {
// 		console.log(`🚨 Adding active alarm: ${alarmId} (${severity})`);
// 		this.activeAlarmIds.add(alarmId);
// 		this.startPersistentAlert();
// 	}

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

// 	private startPersistentAlert() {
// 		if (!this.isEnabled || this.isPlaying || !this.userInteracted) return;

// 		this.isPlaying = true;
// 		console.log(
// 			"🔊 Starting enhanced professional persistent alarm alert loop (NO OVERLAP)"
// 		);

// 		// Play immediately (if not already playing)
// 		this.playCurrentAlertSound();

// 		// Set up interval for continuous alerts with proper spacing
// 		this.currentAudioLoop.intervalId = setInterval(() => {
// 			if (
// 				this.activeAlarmIds.size > 0 &&
// 				this.isEnabled &&
// 				this.userInteracted
// 			) {
// 				this.playCurrentAlertSound();
// 			} else {
// 				this.stopPersistentAlert();
// 			}
// 		}, this.getAlertInterval());
// 	}

// 	private stopPersistentAlert() {
// 		if (this.currentAudioLoop.intervalId) {
// 			clearInterval(this.currentAudioLoop.intervalId);
// 			this.currentAudioLoop.intervalId = null;
// 		}

// 		if (this.currentAudioLoop.stopCallback) {
// 			this.currentAudioLoop.stopCallback();
// 			this.currentAudioLoop.stopCallback = null;
// 		}

// 		// Stop all currently playing audio
// 		this.stopAllCurrentAudio();

// 		this.isPlaying = false;
// 		console.log("🔇 Stopped enhanced professional persistent alarm alerts");
// 	}

// 	private getAlertInterval(): number {
// 		// Longer intervals to ensure no overlap
// 		const severities = Array.from(this.activeAlarmIds).map(() => "CRITICAL"); // Simplified for now

// 		if (severities.includes("CRITICAL")) return 10000; // Every 10 seconds for critical
// 		if (severities.includes("HIGH")) return 12000; // Every 12 seconds for high
// 		if (severities.includes("MEDIUM")) return 15000; // Every 15 seconds for medium
// 		return 20000; // Every 20 seconds for low
// 	}

// 	private async playCurrentAlertSound() {
// 		if (
// 			!this.isEnabled ||
// 			this.activeAlarmIds.size === 0 ||
// 			!this.shouldPlayAudio() ||
// 			!this.userInteracted
// 		)
// 			return;

// 		// Try to play professional siren file first, fallback to enhanced synthesized
// 		const sirenPlayed = await this.playProfessionalSirenFile();
// 		if (!sirenPlayed) {
// 			await this.playEnhancedEmergencySiren();
// 		}
// 	}

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
// 		return this.isCurrentlyPlayingAudio;
// 	}

// 	hasUserInteracted(): boolean {
// 		return this.userInteracted;
// 	}

// 	forceStopAllAlerts() {
// 		this.stopPersistentAlert();
// 		this.activeAlarmIds.clear();
// 		this.stopAllCurrentAudio();
// 		console.log(
// 			"🛑 Force stopped all enhanced professional audio alerts (COMPLETE CLEANUP)"
// 		);
// 	}

// 	async testAllSounds() {
// 		if (!this.userInteracted) {
// 			console.warn("⚠️ Cannot test sounds - user interaction required first");
// 			return;
// 		}

// 		console.log(
// 			"🧪 Testing all enhanced professional alarm sounds (NO OVERLAP)..."
// 		);

// 		// Test notification chime (LOW)
// 		await this.playProfessionalNotificationChime();

// 		setTimeout(async () => {
// 			// Test fire alarm (MEDIUM)
// 			await this.playProfessionalFireAlarm();
// 		}, 3000);

// 		setTimeout(async () => {
// 			// Test police siren (HIGH)
// 			await this.playProfessionalPoliceSiren();
// 		}, 8000);

// 		setTimeout(async () => {
// 			// Test siren file (CRITICAL)
// 			const sirenPlayed = await this.playProfessionalSirenFile();
// 			if (!sirenPlayed) {
// 				await this.playEnhancedEmergencySiren();
// 			}
// 		}, 13000);

// 		setTimeout(async () => {
// 			console.log("🎵 All sound tests completed (NO OVERLAP)!");
// 		}, 18000);
// 	}

// 	getSirenStatus(): {
// 		loaded: boolean;
// 		loading: boolean;
// 		available: boolean;
// 		method: string;
// 	} {
// 		let method = "none";
// 		if (this.sirenAudioBuffer) method = "web-audio";
// 		else if (this.audioElement && this.audioElement.readyState >= 2)
// 			method = "html5-audio";

// 		return {
// 			loaded:
// 				!!this.sirenAudioBuffer ||
// 				(!!this.audioElement && this.audioElement.readyState >= 2),
// 			loading: this.isLoadingSiren,
// 			available:
// 				!!this.sirenAudioBuffer ||
// 				(!!this.audioElement && this.audioElement.readyState >= 2) ||
// 				!this.isLoadingSiren,
// 			method,
// 		};
// 	}

// 	getAudioStatus(): {
// 		isPlaying: boolean;
// 		activeSourcesCount: number;
// 		activeSynthSourcesCount: number;
// 		lastPlayTime: number;
// 		timeSinceLastPlay: number;
// 		userInteracted: boolean;
// 		audioContextState: string;
// 		sirenLoadAttempts: number;
// 	} {
// 		return {
// 			isPlaying: this.isCurrentlyPlayingAudio,
// 			activeSourcesCount: this.currentAudioSources.length,
// 			activeSynthSourcesCount: this.currentSynthSources.length,
// 			lastPlayTime: this.lastAudioStartTime,
// 			timeSinceLastPlay: Date.now() - this.lastAudioStartTime,
// 			userInteracted: this.userInteracted,
// 			audioContextState: this.audioContext?.state || "not-initialized",
// 			sirenLoadAttempts: this.sirenLoadAttempts,
// 		};
// 	}

// 	// Force user interaction (call this on any user action)
// 	enableUserInteraction() {
// 		if (!this.userInteracted) {
// 			this.userInteracted = true;
// 			this.initializeAudio();
// 			console.log("🔊 User interaction manually enabled");
// 		}
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
// 	private sirenAudioBuffer: AudioBuffer | null = null;
// 	private isLoadingSiren = false;
// 	private currentAudioSources: AudioBufferSourceNode[] = [];
// 	private currentSynthSources: OscillatorNode[] = [];
// 	private isCurrentlyPlayingAudio = false;
// 	private lastAudioStartTime = 0;
// 	private minimumGapBetweenSounds = 1000; // 1 second minimum gap

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
// 			console.log("Audio Service initialized");

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

// 	private stopAllCurrentAudio() {
// 		console.log("Stopping all current audio instances...");

// 		// Stop all audio buffer sources (siren file)
// 		this.currentAudioSources.forEach((source) => {
// 			try {
// 				source.stop();
// 				source.disconnect();
// 			} catch (error) {
// 				// Source might already be stopped
// 			}
// 		});
// 		this.currentAudioSources = [];

// 		// Stop all synthesized sources (oscillators)
// 		this.currentSynthSources.forEach((oscillator) => {
// 			try {
// 				oscillator.stop();
// 				oscillator.disconnect();
// 			} catch (error) {
// 				// Oscillator might already be stopped
// 			}
// 		});
// 		this.currentSynthSources = [];

// 		this.isCurrentlyPlayingAudio = false;
// 	}

// 	private shouldPlayAudio(): boolean {
// 		const now = Date.now();
// 		const timeSinceLastAudio = now - this.lastAudioStartTime;

// 		if (this.isCurrentlyPlayingAudio) {
// 			console.log("⏸️ Audio already playing, skipping...");
// 			return false;
// 		}

// 		if (timeSinceLastAudio < this.minimumGapBetweenSounds) {
// 			console.log(
// 				`⏸️ Too soon since last audio (${timeSinceLastAudio}ms), skipping...`
// 			);
// 			return false;
// 		}

// 		return true;
// 	}

// 	private async loadSirenAudio() {
// 		if (this.isLoadingSiren || this.sirenAudioBuffer) return;

// 		try {
// 			this.isLoadingSiren = true;
// 			console.log("🔊 Loading siren audio file...");

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
// 				console.log("✅ siren audio loaded successfully");
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

// 	async playProfessionalSirenFile() {
// 		if (!this.isEnabled || !this.shouldPlayAudio()) return false;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return false;

// 			// Ensure siren is loaded
// 			if (!this.sirenAudioBuffer && !this.isLoadingSiren) {
// 				await this.loadSirenAudio();
// 			}

// 			if (this.sirenAudioBuffer && this.audioContext) {
// 				// Stop any currently playing audio first
// 				this.stopAllCurrentAudio();

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
// 				filter.frequency.setValueAtTime(100, this.audioContext.currentTime);
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

// 				// Track this audio source
// 				this.currentAudioSources.push(source);
// 				this.isCurrentlyPlayingAudio = true;
// 				this.lastAudioStartTime = Date.now();

// 				// Set up cleanup when audio ends
// 				source.onended = () => {
// 					this.isCurrentlyPlayingAudio = false;
// 					this.currentAudioSources = this.currentAudioSources.filter(
// 						(s) => s !== source
// 					);
// 					console.log("🔇 Siren file playback completed");
// 				};

// 				source.start(this.audioContext.currentTime);
// 				source.stop(this.audioContext.currentTime + duration);

// 				console.log("🚨 PROFESSIONAL SIREN FILE PLAYING (NO OVERLAP)");
// 				return true;
// 			} else {
// 				console.warn("⚠️ Siren audio not available, using fallback");
// 				return false;
// 			}
// 		} catch (error) {
// 			console.error("Failed to play professional siren file:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 			return false;
// 		}
// 	}

// 	async playEnhancedEmergencySiren() {
// 		if (!this.isEnabled || !this.shouldPlayAudio()) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			const duration = 4000; // 4 seconds
// 			const oscillator1 = this.audioContext.createOscillator();
// 			const oscillator2 = this.audioContext.createOscillator();
// 			const oscillator3 = this.audioContext.createOscillator();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();
// 			const distortion = this.audioContext.createWaveShaper();

// 			// Track these oscillators
// 			this.currentSynthSources.push(oscillator1, oscillator2, oscillator3);
// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

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
// 			const cycleTime = 1.2;

// 			// Set waveform types for richer sound
// 			oscillator1.type = "sawtooth";
// 			oscillator2.type = "sine";
// 			oscillator3.type = "triangle";

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

// 			// Professional volume envelope
// 			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
// 			gainNode.gain.linearRampToValueAtTime(
// 				this.volume * 0.8,
// 				this.audioContext.currentTime + 0.2
// 			);
// 			gainNode.gain.setValueAtTime(
// 				this.volume * 0.8,
// 				this.audioContext.currentTime + duration / 1000 - 0.3
// 			);
// 			gainNode.gain.linearRampToValueAtTime(
// 				0,
// 				this.audioContext.currentTime + duration / 1000
// 			);

// 			// Set up cleanup when audio ends
// 			const endTime = this.audioContext.currentTime + duration / 1000;
// 			oscillator1.onended = () => {
// 				this.isCurrentlyPlayingAudio = false;
// 				this.currentSynthSources = this.currentSynthSources.filter(
// 					(o) => o !== oscillator1 && o !== oscillator2 && o !== oscillator3
// 				);
// 				console.log("🔇 Enhanced emergency siren completed");
// 			};

// 			// Start all oscillators
// 			oscillator1.start(this.audioContext.currentTime);
// 			oscillator2.start(this.audioContext.currentTime);
// 			oscillator3.start(this.audioContext.currentTime);

// 			// Stop all oscillators
// 			oscillator1.stop(endTime);
// 			oscillator2.stop(endTime);
// 			oscillator3.stop(endTime);

// 			console.log("🚨 ENHANCED EMERGENCY SIREN PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play enhanced emergency siren:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playProfessionalPoliceSiren() {
// 		if (!this.isEnabled || !this.shouldPlayAudio()) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			const duration = 3500;
// 			const oscillator1 = this.audioContext.createOscillator();
// 			const oscillator2 = this.audioContext.createOscillator();
// 			const gainNode = this.audioContext.createGain();
// 			const filter = this.audioContext.createBiquadFilter();

// 			// Track these oscillators
// 			this.currentSynthSources.push(oscillator1, oscillator2);
// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

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

// 			// Set up cleanup when audio ends
// 			oscillator1.onended = () => {
// 				this.isCurrentlyPlayingAudio = false;
// 				this.currentSynthSources = this.currentSynthSources.filter(
// 					(o) => o !== oscillator1 && o !== oscillator2
// 				);
// 				console.log("🔇 Police siren completed");
// 			};

// 			oscillator1.start(this.audioContext.currentTime);
// 			oscillator2.start(this.audioContext.currentTime);
// 			oscillator1.stop(this.audioContext.currentTime + duration / 1000);
// 			oscillator2.stop(this.audioContext.currentTime + duration / 1000);

// 			console.log("🚔 PROFESSIONAL POLICE SIREN PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play professional police siren:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playProfessionalFireAlarm() {
// 		if (!this.isEnabled || !this.shouldPlayAudio()) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

// 			// Standard fire alarm pattern: 3 beeps, pause, repeat
// 			const beepDuration = 0.5;
// 			const pauseDuration = 0.5;
// 			const longPause = 1.5;
// 			const totalCycles = 2;
// 			const totalDuration =
// 				totalCycles * (3 * (beepDuration + pauseDuration) + longPause);

// 			const oscillators: OscillatorNode[] = [];

// 			for (let cycle = 0; cycle < totalCycles; cycle++) {
// 				for (let beep = 0; beep < 3; beep++) {
// 					const startTime =
// 						this.audioContext.currentTime +
// 						cycle * (3 * (beepDuration + pauseDuration) + longPause) +
// 						beep * (beepDuration + pauseDuration);

// 					const oscillator = this.audioContext.createOscillator();
// 					const gainNode = this.audioContext.createGain();
// 					const filter = this.audioContext.createBiquadFilter();

// 					oscillators.push(oscillator);
// 					this.currentSynthSources.push(oscillator);

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

// 			// Set up cleanup when all beeps are done
// 			setTimeout(() => {
// 				this.isCurrentlyPlayingAudio = false;
// 				oscillators.forEach((osc) => {
// 					this.currentSynthSources = this.currentSynthSources.filter(
// 						(o) => o !== osc
// 					);
// 				});
// 				console.log("🔇 Fire alarm completed");
// 			}, totalDuration * 1000);

// 			console.log("🔥 PROFESSIONAL FIRE ALARM PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play professional fire alarm:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playProfessionalNotificationChime() {
// 		if (!this.isEnabled || !this.shouldPlayAudio()) return;

// 		try {
// 			await this.ensureAudioContext();
// 			if (!this.audioContext) return;

// 			// Stop any currently playing audio first
// 			this.stopAllCurrentAudio();

// 			this.isCurrentlyPlayingAudio = true;
// 			this.lastAudioStartTime = Date.now();

// 			// Two-tone chime
// 			const frequencies = [523.25, 659.25];
// 			const noteDuration = 0.8;
// 			const totalDuration = frequencies.length * noteDuration;

// 			const oscillators: OscillatorNode[] = [];

// 			for (let i = 0; i < frequencies.length; i++) {
// 				const startTime = this.audioContext.currentTime + i * noteDuration;

// 				const oscillator = this.audioContext.createOscillator();
// 				const gainNode = this.audioContext.createGain();
// 				const filter = this.audioContext.createBiquadFilter();

// 				oscillators.push(oscillator);
// 				this.currentSynthSources.push(oscillator);

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

// 			// Set up cleanup when chime is done
// 			setTimeout(() => {
// 				this.isCurrentlyPlayingAudio = false;
// 				oscillators.forEach((osc) => {
// 					this.currentSynthSources = this.currentSynthSources.filter(
// 						(o) => o !== osc
// 					);
// 				});
// 				console.log("🔇 Notification chime completed");
// 			}, totalDuration * 1000);

// 			console.log("🎵 PROFESSIONAL NOTIFICATION CHIME PLAYING (NO OVERLAP)");
// 		} catch (error) {
// 			console.error("Failed to play professional notification chime:", error);
// 			this.isCurrentlyPlayingAudio = false;
// 		}
// 	}

// 	async playAlarmSound(severity: string) {
// 		// Check if we should play audio to prevent overlapping
// 		if (!this.shouldPlayAudio()) {
// 			console.log(
// 				`⏸️ Skipping ${severity} alarm sound - audio already playing or too soon`
// 			);
// 			return;
// 		}

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

// 	addActiveAlarm(alarmId: string, severity: string) {
// 		console.log(`🚨 Adding active alarm: ${alarmId} (${severity})`);
// 		this.activeAlarmIds.add(alarmId);
// 		this.startPersistentAlert();
// 	}

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

// 	private startPersistentAlert() {
// 		if (!this.isEnabled || this.isPlaying) return;

// 		this.isPlaying = true;
// 		console.log(
// 			"🔊 Starting enhanced professional persistent alarm alert loop (NO OVERLAP)"
// 		);

// 		// Play immediately (if not already playing)
// 		this.playCurrentAlertSound();

// 		// Set up interval for continuous alerts with proper spacing
// 		this.currentAudioLoop.intervalId = setInterval(() => {
// 			if (this.activeAlarmIds.size > 0 && this.isEnabled) {
// 				this.playCurrentAlertSound();
// 			} else {
// 				this.stopPersistentAlert();
// 			}
// 		}, this.getAlertInterval());
// 	}

// 	private stopPersistentAlert() {
// 		if (this.currentAudioLoop.intervalId) {
// 			clearInterval(this.currentAudioLoop.intervalId);
// 			this.currentAudioLoop.intervalId = null;
// 		}

// 		if (this.currentAudioLoop.stopCallback) {
// 			this.currentAudioLoop.stopCallback();
// 			this.currentAudioLoop.stopCallback = null;
// 		}

// 		// Stop all currently playing audio
// 		this.stopAllCurrentAudio();

// 		this.isPlaying = false;
// 		console.log("🔇 Stopped enhanced professional persistent alarm alerts");
// 	}

// 	private getAlertInterval(): number {
// 		// Longer intervals to ensure no overlap
// 		const severities = Array.from(this.activeAlarmIds).map(() => "CRITICAL"); // Simplified for now

// 		if (severities.includes("CRITICAL")) return 10000; // Every 10 seconds for critical
// 		if (severities.includes("HIGH")) return 12000; // Every 12 seconds for high
// 		if (severities.includes("MEDIUM")) return 15000; // Every 15 seconds for medium
// 		return 20000; // Every 20 seconds for low
// 	}

// 	private async playCurrentAlertSound() {
// 		if (
// 			!this.isEnabled ||
// 			this.activeAlarmIds.size === 0 ||
// 			!this.shouldPlayAudio()
// 		)
// 			return;

// 		// Try to play professional siren file first, fallback to enhanced synthesized
// 		const sirenPlayed = await this.playProfessionalSirenFile();
// 		if (!sirenPlayed) {
// 			await this.playEnhancedEmergencySiren();
// 		}
// 	}

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
// 		return this.isCurrentlyPlayingAudio;
// 	}

// 	forceStopAllAlerts() {
// 		this.stopPersistentAlert();
// 		this.activeAlarmIds.clear();
// 		this.stopAllCurrentAudio();
// 		console.log("🛑 Force stopped all audio alerts (COMPLETE CLEANUP)");
// 	}

// 	async testAllSounds() {
// 		console.log("🧪 Testing all alarm sounds (NO OVERLAP)...");

// 		// Test notification chime (LOW)
// 		await this.playProfessionalNotificationChime();

// 		setTimeout(async () => {
// 			// Test fire alarm (MEDIUM)
// 			await this.playProfessionalFireAlarm();
// 		}, 3000);

// 		setTimeout(async () => {
// 			// Test police siren (HIGH)
// 			await this.playProfessionalPoliceSiren();
// 		}, 8000);

// 		setTimeout(async () => {
// 			// Test siren file (CRITICAL)
// 			const sirenPlayed = await this.playProfessionalSirenFile();
// 			if (!sirenPlayed) {
// 				await this.playEnhancedEmergencySiren();
// 			}
// 		}, 13000);

// 		setTimeout(async () => {
// 			console.log("🎵 All sound tests completed (NO OVERLAP)!");
// 		}, 18000);
// 	}

// 	getSirenStatus(): { loaded: boolean; loading: boolean; available: boolean } {
// 		return {
// 			loaded: !!this.sirenAudioBuffer,
// 			loading: this.isLoadingSiren,
// 			available: !!this.sirenAudioBuffer || !this.isLoadingSiren,
// 		};
// 	}

// 	getAudioStatus(): {
// 		isPlaying: boolean;
// 		activeSourcesCount: number;
// 		activeSynthSourcesCount: number;
// 		lastPlayTime: number;
// 		timeSinceLastPlay: number;
// 	} {
// 		return {
// 			isPlaying: this.isCurrentlyPlayingAudio,
// 			activeSourcesCount: this.currentAudioSources.length,
// 			activeSynthSourcesCount: this.currentSynthSources.length,
// 			lastPlayTime: this.lastAudioStartTime,
// 			timeSinceLastPlay: Date.now() - this.lastAudioStartTime,
// 		};
// 	}
// }

// export const audioService = new AudioService();
