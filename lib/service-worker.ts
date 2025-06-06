// Service Worker for persistent notifications
/// <reference lib="webworker" />
const CACHE_NAME_ = "koppa-security-v1";
const SW_VERSION = "1.0.0";
const sw = self as unknown as ServiceWorkerGlobalScope;

// Install event
sw.addEventListener("install", (event: any) => {
	console.log("Service Worker installing...");
	event.waitUntil(
		caches.open(CACHE_NAME_).then((cache) => {
			return cache.addAll([
				"/sounds/siren.mp3",
				"/sounds/notification.mp3",
				"/icons/alarm-icon.png",
				"/icons/alarm-badge.png",
			]);
		})
	);
	sw.skipWaiting(); // ✅ no TS error
});

// Activate event
sw.addEventListener("activate", (event: any) => {
	console.log("Service Worker activating...");
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	sw.clients.claim(); // ✅ no TS error
});

// Push event for background notifications
self.addEventListener("push", (event: any) => {
	console.log("Push notification received:", event);

	if (!event.data) return;

	const data = event.data.json();
	const { alarm, title, body, icon, badge, tag } = data;

	const options = {
		body: body || `${alarm.type} at ${alarm.branchName} - ${alarm.location}`,
		icon: icon || "/icons/alarm-icon.png",
		badge: badge || "/icons/alarm-badge.png",
		tag: tag || `alarm-${alarm.id}`,
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
		sw.registration.showNotification(title || "🚨 SECURITY ALARM", options)
	);

	// Play alarm sound even when app is closed
	if (alarm.severity === "critical" || alarm.severity === "high") {
		playAlarmSound();
	}
});

// Notification click event
self.addEventListener("notificationclick", (event: any) => {
	console.log("Notification clicked:", event);

	event.notification.close();

	if (event.action === "acknowledge") {
		// Handle acknowledge action
		event.waitUntil(
			fetch("/api/alarms/" + event.notification.data.id, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${getStoredToken()}`,
				},
				body: JSON.stringify({
					status: "acknowledged",
					acknowledgedAt: new Date().toISOString(),
				}),
			})
		);
	} else {
		// Open the app and navigate to alarm reports
		event.waitUntil(
			sw.clients.matchAll({ type: "window" }).then((clients) => {
				// Check if app is already open
				for (const client of clients) {
					if (client.url.includes("/dashboard/police-manager/alarm-reports")) {
						return client.focus();
					}
				}
				// Open new window
				return sw.clients.openWindow("/dashboard/police-manager/alarm-reports");
			})
		);
	}
});

// Background sync for offline reliability
self.addEventListener("sync", (event: any) => {
	if (event.tag === "alarm-sync") {
		event.waitUntil(syncAlarms());
	}
});

function playAlarmSound() {
	// Use Web Audio API for background sound
	if ("audioWorklet" in AudioContext.prototype) {
		const audioContext = new AudioContext();
		fetch("/sounds/siren.mp3")
			.then((response) => response.arrayBuffer())
			.then((data) => audioContext.decodeAudioData(data))
			.then((buffer) => {
				const source = audioContext.createBufferSource();
				source.buffer = buffer;
				source.connect(audioContext.destination);
				source.start();
			})
			.catch(console.error);
	}
}

function getStoredToken() {
	// This would need to be stored in IndexedDB for service worker access
	return localStorage.getItem("authToken");
}

// async function syncAlarms() {
// 	try {
// 		const response = await fetch("/api/alarms?status=ACTIVE");
// 		const alarms = await response.json();

// 		// Store in IndexedDB for offline access
// 		const db = await openDB();
// 		const transaction = db.transaction(["alarms"], "readwrite");
// 		const store = transaction.objectStore("alarms");

// 		for (const alarm of alarms) {
// 			await store.put(alarm);
// 		}
// 	} catch (error) {
// 		console.error("Failed to sync alarms:", error);
// 	}
// }

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("KoppaSecurityDB", 1);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result as IDBDatabase);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains("alarms")) {
				db.createObjectStore("alarms", { keyPath: "id" });
			}
		};
	});
}

// function openDB() {
// 	return new Promise((resolve, reject) => {
// 		const request = indexedDB.open("KoppaSecurityDB", 1);

// 		request.onerror = () => reject(request.error);
// 		request.onsuccess = () => resolve(request.result);

// 		request.onupgradeneeded = (event) => {
// 			const db = event?.target?.result;
// 			if (!db.objectStoreNames.contains("alarms")) {
// 				db.createObjectStore("alarms", { keyPath: "id" });
// 			}
// 		};
// 	});
// }
