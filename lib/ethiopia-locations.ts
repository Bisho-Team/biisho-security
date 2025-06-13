// Common Ethiopian locations for quick suggestions
export const popularEthiopianLocations = [
	{
		name: "Addis Ababa",
		region: "Addis Ababa",
		type: "capital",
		coordinates: { lat: 9.032, lng: 38.7469 },
	},
	{
		name: "Bahir Dar",
		region: "Amhara",
		type: "city",
		coordinates: { lat: 11.5942, lng: 37.3914 },
	},
	{
		name: "Dire Dawa",
		region: "Dire Dawa",
		type: "city",
		coordinates: { lat: 9.5931, lng: 41.8661 },
	},
	{
		name: "Mekelle",
		region: "Tigray",
		type: "city",
		coordinates: { lat: 13.4967, lng: 39.4753 },
	},
	{
		name: "Hawassa",
		region: "SNNPR",
		type: "city",
		coordinates: { lat: 7.0621, lng: 38.4776 },
	},
	{
		name: "Gondar",
		region: "Amhara",
		type: "city",
		coordinates: { lat: 12.609, lng: 37.4647 },
	},
	{
		name: "Jimma",
		region: "Oromia",
		type: "city",
		coordinates: { lat: 7.6731, lng: 36.8344 },
	},
	{
		name: "Adama (Nazret)",
		region: "Oromia",
		type: "city",
		coordinates: { lat: 8.54, lng: 39.2675 },
	},
	{
		name: "Dessie",
		region: "Amhara",
		type: "city",
		coordinates: { lat: 11.13, lng: 39.6333 },
	},
	{
		name: "Harar",
		region: "Harari",
		type: "city",
		coordinates: { lat: 9.31, lng: 42.118 },
	},
];

export const ethiopianRegions = [
	"Addis Ababa",
	"Afar",
	"Amhara",
	"Benishangul-Gumuz",
	"Dire Dawa",
	"Gambela",
	"Harari",
	"Oromia",
	"Sidama",
	"SNNPR",
	"Somali",
	"Tigray",
];

// Helper function to get popular locations for quick access
export function getPopularLocations() {
	return popularEthiopianLocations.map((location) => ({
		id: `popular-${location.name.toLowerCase().replace(/\s+/g, "-")}`,
		name: location.name,
		address: `${location.name}, ${location.region} Region, Ethiopia`,
		fullAddress: `${location.name}, ${location.region} Region, Ethiopia`,
		latitude: location.coordinates.lat.toString(),
		longitude: location.coordinates.lng.toString(),
		type: location.type,
		class: "place",
		importance: 1,
	}));
}
