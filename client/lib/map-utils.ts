// Helper functions for map operations

/**
 * Initializes a map with a marker at the specified coordinates
 * This is a placeholder for actual map implementation
 */
export function initializeMap(
	elementId: string,
	lat: number | null = null,
	lng: number | null = null
) {
	// This would be replaced with actual map library implementation
	// such as Leaflet, Google Maps, or Mapbox
	console.log(`Map initialized in ${elementId} with coordinates:`, {
		lat,
		lng,
	});

	// Return mock map controller
	return {
		setCenter: (lat: number, lng: number) => {
			console.log("Map center set to:", { lat, lng });
		},
		addMarker: (lat: number, lng: number) => {
			console.log("Marker added at:", { lat, lng });
			return {
				setPosition: (lat: number, lng: number) => {
					console.log("Marker position updated:", { lat, lng });
				},
				remove: () => {
					console.log("Marker removed");
				},
			};
		},
	};
}

/**
 * Geocodes an address to coordinates
 */
export async function geocodeAddress(address: string) {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
				address
			)}`
		);
		const data = await response.json();

		if (data && data.length > 0) {
			return {
				latitude: Number.parseFloat(data[0].lat),
				longitude: Number.parseFloat(data[0].lon),
				displayName: data[0].display_name,
			};
		}
		return null;
	} catch (error) {
		console.error("Geocoding error:", error);
		return null;
	}
}

/**
 * Reverse geocodes coordinates to an address
 */
export async function reverseGeocode(lat: number, lng: number) {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
		);
		const data = await response.json();

		if (data) {
			return {
				address: data.display_name,
				shortAddress: data.address
					? `${data.address.road || ""} ${
							data.address.house_number || ""
					  }`.trim() || data.display_name.split(",")[0]
					: data.display_name.split(",")[0],
			};
		}
		return null;
	} catch (error) {
		console.error("Reverse geocoding error:", error);
		return null;
	}
}
