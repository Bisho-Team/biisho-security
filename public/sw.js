// Enhanced Service Worker with proper lifecycle management
const CACHE_NAME = "koppa-security-v2";
const urlsToCache = [
	"/sounds/siren.mp3",
	"/sounds/notification.mp3",
	"/icons/alarm-icon.png",
	"/icons/alarm-badge.png",
];

console.log("Service Worker script loaded");

// Install event
self.addEventListener("install", (event) => {
	console.log("Service Worker installing...");

	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log("Caching alarm assets");
				return cache.addAll(urlsToCache);
			})
			.then(() => {
				console.log("Service Worker installed successfully");
				// Skip waiting to activate immediately
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error("Service Worker installation failed:", error);
			})
	);
});

// Activate event
self.addEventListener("activate", (event) => {
	console.log("Service Worker activating...");

	event.waitUntil(
		Promise.all([
			// Clean up old caches
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							console.log("Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			}),
			// Claim all clients immediately
			self.clients.claim(),
		]).then(() => {
			console.log("Service Worker activated and ready");
		})
	);
});

// Message event for communication with main app
self.addEventListener("message", (event) => {
	console.log("Service Worker received message:", event.data);

	const { type, data } = event.data;

	if (type === "SKIP_WAITING") {
		self.skipWaiting();
		return;
	}

	if (type === "SHOW_PERSISTENT_NOTIFICATION") {
		console.log("Showing persistent notification for alarm:", data.alarm.id);

		const options = {
			body: data.body,
			icon: data.icon,
			badge: data.badge,
			tag: data.tag,
			data: data.alarm,
			requireInteraction: true,
			persistent: true,
			silent: false,
			vibrate: [200, 100, 200, 100, 200],
			actions: [
				{
					action: "acknowledge",
					title: "Acknowledge",
					icon: "/icons/acknowledge.png",
				},
				{
					action: "view",
					title: "View Details",
					icon: "/icons/view.png",
				},
			],
		};

		event.waitUntil(
			self.registration
				.showNotification(data.title, options)
				.then(() => {
					console.log("Persistent notification shown successfully");
				})
				.catch((error) => {
					console.error("Failed to show persistent notification:", error);
				})
		);
	}
});

// Push event for background notifications
self.addEventListener("push", (event) => {
	console.log("Push notification received:", event);

	if (!event.data) {
		console.log("No data in push event");
		return;
	}

	try {
		const data = event.data.json();
		const { alarm, title, body } = data;

		const options = {
			body: body || `${alarm.type} at ${alarm.branchName} - ${alarm.location}`,
			icon: "/icons/alarm-icon.png",
			badge: "/icons/alarm-badge.png",
			tag: `push-alarm-${alarm.id}`,
			data: alarm,
			requireInteraction: true,
			persistent: true,
			silent: false,
			vibrate: [200, 100, 200, 100, 200],
			actions: [
				{
					action: "acknowledge",
					title: "Acknowledge",
					icon: "/icons/acknowledge.png",
				},
				{
					action: "view",
					title: "View Details",
					icon: "/icons/view.png",
				},
			],
		};

		event.waitUntil(
			self.registration
				.showNotification(title || "🚨 SECURITY ALARM", options)
				.then(() => {
					console.log("Push notification shown");
					// Play alarm sound in background
					return playBackgroundAlarm(alarm);
				})
		);
	} catch (error) {
		console.error("Error processing push notification:", error);
	}
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
	console.log("Notification clicked:", event.action, event.notification.data);

	event.notification.close();

	if (event.action === "acknowledge") {
		// Send message to main app to acknowledge alarm
		event.waitUntil(
			self.clients.matchAll().then((clients) => {
				if (clients.length > 0) {
					clients.forEach((client) => {
						client.postMessage({
							type: "ALARM_ACKNOWLEDGED",
							data: { alarmId: event.notification.data.id },
						});
					});
				} else {
					console.log("No clients available to send acknowledgment message");
				}
			})
		);
	} else {
		// Open the app and navigate to alarm reports
		event.waitUntil(
			self.clients
				.matchAll({ type: "window", includeUncontrolled: true })
				.then((clients) => {
					// Check if app is already open
					for (const client of clients) {
						if (
							client.url.includes("/dashboard/police-manager/alarm-reports")
						) {
							return client.focus();
						}
					}

					// Check if any client is open
					for (const client of clients) {
						if (client.url.includes("/dashboard")) {
							client.navigate("/dashboard/police-manager/alarm-reports");
							return client.focus();
						}
					}

					// Open new window
					return self.clients.openWindow(
						"/dashboard/police-manager/alarm-reports"
					);
				})
		);
	}
});

// Background sync for offline reliability
self.addEventListener("sync", (event) => {
	console.log("Background sync triggered:", event.tag);

	if (event.tag === "alarm-sync") {
		event.waitUntil(syncAlarms());
	}
});

// Fetch event for caching
self.addEventListener("fetch", (event) => {
	// Only handle requests for our cached resources
	if (urlsToCache.some((url) => event.request.url.includes(url))) {
		event.respondWith(
			caches.match(event.request).then((response) => {
				// Return cached version or fetch from network
				return response || fetch(event.request);
			})
		);
	}
});

// Helper function to play alarm sound in background
async function playBackgroundAlarm(alarm) {
	try {
		if (alarm.severity === "critical" || alarm.severity === "high") {
			// Use Web Audio API for background sound
			const audioContext = new AudioContext();
			const response = await fetch("/sounds/siren.mp3");
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			const source = audioContext.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(audioContext.destination);
			source.start();

			console.log("Background alarm sound played");
		}
	} catch (error) {
		console.error("Failed to play background alarm sound:", error);
	}
}

// Helper function to sync alarms
async function syncAlarms() {
	try {
		console.log("Syncing alarms in background");

		// This would typically fetch from your API
		// For now, we'll just log that sync was attempted
		const response = await fetch("/api/alarms?status=active");

		if (response.ok) {
			const alarms = await response.json();
			console.log(`Synced ${alarms.length} active alarms`);

			// Store in cache for offline access
			const cache = await caches.open(CACHE_NAME);
			await cache.put(
				"/api/alarms?status=active",
				new Response(JSON.stringify(alarms))
			);
		}
	} catch (error) {
		console.error("Failed to sync alarms:", error);
	}
}

console.log("Service Worker script fully loaded and ready");
