"use client";

import React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Building, Globe, Home, Landmark } from "lucide-react";
import { LocationSearchService } from "@/lib/location-search-service";

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

export function useLocationSearch() {
	const [results, setResults] = useState<LocationResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const searchService = useRef(new LocationSearchService());
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const cache = useRef<
		Map<string, { results: LocationResult[]; timestamp: number }>
	>(new Map());
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	// Clean up expired cache entries
	useEffect(() => {
		const cleanupInterval = setInterval(() => {
			const now = Date.now();
			for (const [key, entry] of cache.current.entries()) {
				if (now - entry.timestamp > CACHE_DURATION) {
					cache.current.delete(key);
				}
			}
		}, 60000); // Check every minute

		return () => clearInterval(cleanupInterval);
	}, []);

	const getIcon = useCallback((type: string, category: string) => {
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
		// switch (category.toLowerCase()) {
		// 	case "city":
		// 	case "town":
		// 	case "village":
		// 		return <Building className={iconClass} />;
		// 	case "address":
		// 	case "house":
		// 		return <Home className={iconClass} />;
		// 	case "landmark":
		// 	case "tourism":
		// 		return <Landmark className={iconClass} />;
		// 	case "administrative":
		// 		return <Globe className={iconClass} />;
		// 	default:
		// 		return <MapPin className={iconClass} />;
		// }
	}, []);

	const categorizeLocation = useCallback((result: any): string => {
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
	}, []);

	const formatAddress = useCallback(
		(result: any): { address: string; region?: string } => {
			const addr = result.address;
			if (!addr) {
				return { address: result.display_name };
			}

			const parts: string[] = [];

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
		},
		[]
	);

	const calculateConfidence = useCallback(
		(result: any, query: string): number => {
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
		},
		[]
	);

	const search = useCallback(async (query: string) => {
		if (!query.trim() || query.length < 2) {
			setResults([]);
			return;
		}

		const cacheKey = query.toLowerCase().trim();

		// Check cache first
		if (cache.current.has(cacheKey)) {
			const cachedData = cache.current.get(cacheKey)!;
			if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
				setResults(cachedData.results);
				return;
			}
		}

		setIsSearching(true);
		setError(null);

		try {
			const searchResults = await searchService.current.searchLocations(query);
			setResults(searchResults);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Search failed");
			setResults([]);
		} finally {
			setIsSearching(false);
		}
	}, []);

	const debouncedSearch = useCallback(
		(query: string, delay = 300) => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			searchTimeoutRef.current = setTimeout(() => {
				search(query);
			}, delay);
		},
		[search]
	);

	const reverseGeocode = useCallback(
		async (latitude: number, longitude: number) => {
			setIsSearching(true);
			setError(null);

			try {
				const result = await searchService.current.reverseGeocode(
					latitude,
					longitude
				);
				return result;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Reverse geocoding failed"
				);
				return null;
			} finally {
				setIsSearching(false);
			}
		},
		[]
	);

	const clearResults = useCallback(() => {
		setResults([]);
		setError(null);
	}, []);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	return {
		results,
		isSearching,
		error,
		search,
		debouncedSearch,
		reverseGeocode,
		clearResults,
	};
}
