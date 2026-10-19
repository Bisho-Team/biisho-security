import React from "react";
import { MapPin, Building, Globe, Home, Landmark } from "lucide-react";

interface LocationResult {
	id: string;
	name: string;
	address: string;
	fullAddress: string;
	latitude: string;
	longitude: string;
	type: string;
	category: string;
	country: string;
	region?: string;
	confidence: number;
	icon: React.ReactNode;
}

interface NominatimResult {
	place_id: string;
	display_name: string;
	name?: string;
	lat: string;
	lon: string;
	type: string;
	class: string;
	importance?: number;
	address?: {
		house_number?: string;
		road?: string;
		suburb?: string;
		city?: string;
		town?: string;
		village?: string;
		state?: string;
		country?: string;
		postcode?: string;
	};
	extratags?: Record<string, string>;
}

export class LocationSearchService {
	private readonly baseUrl = "https://nominatim.openstreetmap.org";
	private readonly userAgent = "AlarmSystem/1.0";
	private cache = new Map<string, LocationResult[]>();
	private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

	private getIcon(type: string, category: string): React.ReactNode {
		const iconClass = "h-4 w-4 text-gray-600";

		switch (category.toLowerCase()) {
			case "city":
			case "town":
			case "village":
				return React.createElement(Building, { className: iconClass });
			case "address":
			case "house":
				return React.createElement(Home, { className: iconClass });
			case "landmark":
			case "tourism":
				return React.createElement(Landmark, { className: iconClass });
			case "administrative":
				return React.createElement(Globe, { className: iconClass });
			default:
				return React.createElement(MapPin, { className: iconClass });
		}
	}

	private categorizeLocation(result: NominatimResult): string {
		const { type, class: locationClass } = result;

		if (locationClass === "place") {
			if (["city", "town", "village"].includes(type)) return "city";
			if (["suburb", "neighbourhood", "quarter"].includes(type))
				return "district";
			if (["state", "region"].includes(type)) return "administrative";
		}

		if (locationClass === "highway" || locationClass === "building")
			return "address";
		if (locationClass === "tourism" || locationClass === "historic")
			return "landmark";
		if (locationClass === "amenity") return "facility";

		return "location";
	}

	private formatAddress(result: NominatimResult): {
		address: string;
		region?: string;
	} {
		const addr = result.address;
		if (!addr) {
			return { address: result.display_name };
		}

		const parts: string[] | any = [];

		// Add street address
		if (addr.house_number && addr.road) {
			parts.push(`${addr.house_number} ${addr.road}`);
		} else if (addr.road) {
			parts.push(addr.road);
		}

		// Add locality
		if (addr.suburb) parts.push(addr.suburb);
		if (addr.city || addr.town || addr.village) {
			parts.push(addr.city || addr.town || addr.village);
		}

		// Add region/state
		const region = addr.state;
		if (region) parts.push(region);

		// Add country
		if (addr.country) parts.push(addr.country);

		return {
			address: parts.join(", ") || result.display_name,
			region: region,
		};
	}

	private calculateConfidence(result: NominatimResult, query: string): number {
		let confidence = result.importance || 0.5;

		// Boost confidence for exact name matches
		const name = result.name || result.display_name.split(",")[0];
		if (name.toLowerCase().includes(query.toLowerCase())) {
			confidence += 0.3;
		}

		// Boost confidence for major place types
		if (result.class === "place" && ["city", "town"].includes(result.type)) {
			confidence += 0.2;
		}

		return Math.min(confidence, 1);
	}

	async searchLocations(query: string): Promise<LocationResult[]> {
		const cacheKey = query.toLowerCase().trim();

		// Check cache first
		if (this.cache.has(cacheKey)) {
			const cached = this.cache.get(cacheKey)!;
			return cached;
		}

		try {
			// Enhanced search parameters for better global coverage
			const params = new URLSearchParams({
				"format": "json",
				"q": query,
				"limit": "15",
				"addressdetails": "1",
				"extratags": "1",
				"namedetails": "1",
				"accept-language": "en",
				"dedupe": "1",
			});

			const response = await fetch(
				`${this.baseUrl}/search?${params.toString()}`,
				{
					headers: {
						"User-Agent": this.userAgent,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: NominatimResult[] = await response.json();

			const results: LocationResult[] = data.map((result) => {
				const category = this.categorizeLocation(result);
				const { address, region } = this.formatAddress(result);
				const confidence = this.calculateConfidence(result, query);
				const name = result.name || result.display_name.split(",")[0];

				return {
					id: result.place_id,
					name: name,
					address: address,
					fullAddress: result.display_name,
					latitude: result.lat,
					longitude: result.lon,
					type: result.type,
					category: category,
					country: result.address?.country || "Unknown",
					region: region,
					confidence: confidence,
					icon: this.getIcon(result.type, category),
				};
			});

			// Sort by confidence and relevance
			const sortedResults = results.sort((a, b) => {
				// First, sort by exact name matches
				const aExactMatch = a.name.toLowerCase().includes(query.toLowerCase());
				const bExactMatch = b.name.toLowerCase().includes(query.toLowerCase());

				if (aExactMatch && !bExactMatch) return -1;
				if (!aExactMatch && bExactMatch) return 1;

				// Then by confidence
				return b.confidence - a.confidence;
			});

			// Cache the results
			this.cache.set(cacheKey, sortedResults);

			// Clear cache after timeout
			setTimeout(() => {
				this.cache.delete(cacheKey);
			}, this.cacheTimeout);

			return sortedResults;
		} catch (error) {
			console.error("Location search error:", error);
			throw new Error("Failed to search locations");
		}
	}

	async reverseGeocode(
		latitude: number,
		longitude: number
	): Promise<LocationResult | null> {
		try {
			const params = new URLSearchParams({
				"format": "json",
				"lat": latitude.toString(),
				"lon": longitude.toString(),
				"addressdetails": "1",
				"accept-language": "en",
			});

			const response = await fetch(
				`${this.baseUrl}/reverse?${params.toString()}`,
				{
					headers: {
						"User-Agent": this.userAgent,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: NominatimResult = await response.json();

			if (!result) return null;

			const category = this.categorizeLocation(result);
			const { address, region } = this.formatAddress(result);
			const name = result.name || result.display_name.split(",")[0];

			return {
				id: result.place_id,
				name: name,
				address: address,
				fullAddress: result.display_name,
				latitude: result.lat,
				longitude: result.lon,
				type: result.type,
				category: category,
				country: result.address?.country || "Unknown",
				region: region,
				confidence: result.importance || 0.8,
				icon: this.getIcon(result.type, category),
			};
		} catch (error) {
			console.error("Reverse geocoding error:", error);
			return null;
		}
	}

	// Method to search for specific types of locations
	async searchByType(
		query: string,
		type: "city" | "address" | "landmark"
	): Promise<LocationResult[]> {
		const typeMapping = {
			city: "place",
			address: "highway,building",
			landmark: "tourism,historic,amenity",
		};

		const params = new URLSearchParams({
			"format": "json",
			"q": query,
			"limit": "10",
			"addressdetails": "1",
			"accept-language": "en",
			"class": typeMapping[type],
		});

		try {
			const response = await fetch(
				`${this.baseUrl}/search?${params.toString()}`,
				{
					headers: {
						"User-Agent": this.userAgent,
					},
				}
			);

			const data: NominatimResult[] = await response.json();
			return this.searchLocations(query); // Reuse the main search logic
		} catch (error) {
			console.error(`Search by type error for ${type}:`, error);
			return [];
		}
	}
}
