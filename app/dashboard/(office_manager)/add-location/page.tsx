"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Building,
	MapPin,
	User,
	Phone,
	CheckCircle,
	Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";

const locationTypes = [
	"Office Building",
	"Retail Store",
	"Warehouse",
	"Manufacturing Plant",
	"Government Building",
	"Educational Institution",
	"Healthcare Facility",
	"Residential Complex",
	"Mixed Use",
	"Other",
];

const countries = [
	"Ethiopia",
	"Kenya",
	"Uganda",
	"Tanzania",
	"Rwanda",
	"Burundi",
	"South Sudan",
	"Somalia",
	"Djibouti",
	"Eritrea",
];

const ethiopianCities = [
	"Addis Ababa",
	"Dire Dawa",
	"Mekelle",
	"Gondar",
	"Awassa",
	"Bahir Dar",
	"Dessie",
	"Jimma",
	"Jijiga",
	"Shashamane",
	"Nekemte",
	"Bishoftu",
	"Asella",
	"Harar",
	"Dilla",
];

const addisAbabaSubCities = [
	"Addis Ketema",
	"Akaky Kaliti",
	"Arada",
	"Bole",
	"Gullele",
	"Kirkos",
	"Kolfe Keranio",
	"Lideta",
	"Nifas Silk-Lafto",
	"Yeka",
];

const sampleWoredas = [
	"Woreda 01",
	"Woreda 02",
	"Woreda 03",
	"Woreda 04",
	"Woreda 05",
	"Woreda 06",
	"Woreda 07",
	"Woreda 08",
	"Woreda 09",
	"Woreda 10",
	"Not Specified",
];

export default function AddBranchPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		locationType: "",
		gpsAddress: "",

		latitude: "",
		longitude: "",
		location: "",
		city: "",
		subCity: "",
		woreda: "",
		country: "Ethiopia",
		managerName: "",
		phoneNumber: "",
		contactNumber1: "",
		contactNumber2: "",
		description: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [isGettingLocation, setIsGettingLocation] = useState(false);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const getCurrentLocation = () => {
		if (!navigator.geolocation) {
			setError("Geolocation is not supported by this browser.");
			return;
		}

		setIsGettingLocation(true);
		setError("");

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				setFormData((prev) => ({
					...prev,
					latitude: latitude.toString(),
					longitude: longitude.toString(),
				}));
				setIsGettingLocation(false);
			},
			(error) => {
				let errorMessage = "Unable to retrieve your location.";
				switch (error.code) {
					case error.PERMISSION_DENIED:
						errorMessage = "Location access denied by user.";
						break;
					case error.POSITION_UNAVAILABLE:
						errorMessage = "Location information is unavailable.";
						break;
					case error.TIMEOUT:
						errorMessage = "Location request timed out.";
						break;
				}
				setError(errorMessage);
				setIsGettingLocation(false);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			}
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await apiClient.createBranch(formData);
			setSubmitted(true);

			// Redirect after 2 seconds
			setTimeout(() => {
				router.push("/dashboard/locations");
			}, 2000);
		} catch (error: any) {
			setError(error.message || "Failed to create branch. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid =
		formData.name &&
		formData.locationType &&
		formData.latitude &&
		formData.longitude &&
		formData.city &&
		formData.country &&
		formData.managerName &&
		formData.phoneNumber;

	if (submitted) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="text-center space-y-4">
							<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
							<h3 className="text-lg font-semibold">
								Location Added Successfully!
							</h3>
							<p className="text-sm text-muted-foreground">
								The new location "{formData.name}" has been created and is now
								available in the system.
							</p>
							<p className="text-xs text-muted-foreground">
								Redirecting to locations page...
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Add New Location</h1>
				<p className="text-muted-foreground">
					Create a new location with complete address and contact information.
				</p>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="grid gap-6 lg:grid-cols-2">
					{/* Left Column */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Building className="h-5 w-5" />
									<span>Location Information</span>
								</CardTitle>
								<CardDescription>
									Basic information about the new location
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Location Name *</Label>
									<Input
										id="name"
										placeholder="e.g., Downtown Office, North Location"
										value={formData.name}
										onChange={(e) => handleInputChange("name", e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="locationType">Location Type *</Label>
									<Select
										value={formData.locationType}
										onValueChange={(value) =>
											handleInputChange("locationType", value)
										}
										required>
										<SelectTrigger>
											<SelectValue placeholder="Select location type" />
										</SelectTrigger>
										<SelectContent>
											{locationTypes.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										placeholder="Brief description of the branch and its purpose..."
										value={formData.description}
										onChange={(e) =>
											handleInputChange("description", e.target.value)
										}
										rows={3}
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<MapPin className="h-5 w-5" />
									<span>Location Details</span>
								</CardTitle>
								<CardDescription>
									Complete address information for the branch
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<Label>Coordinates *</Label>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={getCurrentLocation}
											disabled={isGettingLocation}>
											{isGettingLocation ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Getting Location...
												</>
											) : (
												<>
													<MapPin className="h-4 w-4 mr-2" />
													Get Current Location
												</>
											)}
										</Button>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="latitude">Latitude *</Label>
											<Input
												id="latitude"
												type="number"
												step="any"
												placeholder="e.g., 9.0320"
												value={formData.latitude}
												onChange={(e) =>
													handleInputChange("latitude", e.target.value)
												}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="longitude">Longitude *</Label>
											<Input
												id="longitude"
												type="number"
												step="any"
												placeholder="e.g., 38.7469"
												value={formData.longitude}
												onChange={(e) =>
													handleInputChange("longitude", e.target.value)
												}
												required
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="gpsAddress">Specific Address</Label>
										<Textarea
											id="gpsAddress"
											placeholder="Brief description of the branch and its purpose..."
											value={formData.gpsAddress}
											onChange={(e) =>
												handleInputChange("gpsAddress", e.target.value)
											}
											rows={3}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="country">Country *</Label>
										<Select
											value={formData.country}
											onValueChange={(value) =>
												handleInputChange("country", value)
											}>
											<SelectTrigger>
												<SelectValue placeholder="Select country" />
											</SelectTrigger>
											<SelectContent>
												{countries.map((country) => (
													<SelectItem key={country} value={country}>
														{country}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="city">City *</Label>
										<Select
											value={formData.city}
											onValueChange={(value) =>
												handleInputChange("city", value)
											}>
											<SelectTrigger>
												<SelectValue placeholder="Select city" />
											</SelectTrigger>
											<SelectContent>
												{(formData.country === "Ethiopia"
													? ethiopianCities
													: ["Other"]
												).map((city) => (
													<SelectItem key={city} value={city}>
														{city}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="subCity">Sub-City</Label>
										<Select
											value={formData.subCity}
											onValueChange={(value) =>
												handleInputChange("subCity", value)
											}
											disabled={formData.city !== "Addis Ababa"}>
											<SelectTrigger>
												<SelectValue placeholder="Select sub-city" />
											</SelectTrigger>
											<SelectContent>
												{(formData.city === "Addis Ababa"
													? addisAbabaSubCities
													: []
												).map((subCity) => (
													<SelectItem key={subCity} value={subCity}>
														{subCity}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="woreda">Woreda</Label>
										<Select
											value={formData.woreda}
											onValueChange={(value) =>
												handleInputChange("woreda", value)
											}>
											<SelectTrigger>
												<SelectValue placeholder="Select woreda" />
											</SelectTrigger>
											<SelectContent>
												{sampleWoredas.map((woreda) => (
													<SelectItem key={woreda} value={woreda}>
														{woreda}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<User className="h-5 w-5" />
									<span>Manager Information</span>
								</CardTitle>
								<CardDescription>
									Contact details for the branch manager
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="managerName">Manager Name *</Label>
									<Input
										id="managerName"
										placeholder="Full name of the branch manager"
										value={formData.managerName}
										onChange={(e) =>
											handleInputChange("managerName", e.target.value)
										}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="phoneNumber">Phone Number *</Label>
									<Input
										id="phoneNumber"
										placeholder="+251 911 123 456"
										value={formData.phoneNumber}
										onChange={(e) =>
											handleInputChange("phoneNumber", e.target.value)
										}
										required
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Phone className="h-5 w-5" />
									<span>Additional Contacts</span>
								</CardTitle>
								<CardDescription>
									Alternative contact numbers for the branch
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="contactNumber1">Contact Number 1</Label>
									<Input
										id="contactNumber1"
										placeholder="+251 911 123 457"
										value={formData.contactNumber1}
										onChange={(e) =>
											handleInputChange("contactNumber1", e.target.value)
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="contactNumber2">Contact Number 2</Label>
									<Input
										id="contactNumber2"
										placeholder="+251 911 123 458"
										value={formData.contactNumber2}
										onChange={(e) =>
											handleInputChange("contactNumber2", e.target.value)
										}
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Location Summary</CardTitle>
								<CardDescription>
									Review the information before creating the location
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Location Name:
										</span>
										<span className="font-medium">
											{formData.name || "Not specified"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Type:</span>
										<span>{formData.locationType || "Not specified"}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Location:</span>
										<span>
											{[formData.city, formData.subCity, formData.country]
												.filter(Boolean)
												.join(", ") || "Not specified"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Coordinates:</span>
										<span>
											{formData.latitude && formData.longitude
												? `${Number.parseFloat(formData.latitude).toFixed(
														4
												  )}, ${Number.parseFloat(formData.longitude).toFixed(
														4
												  )}`
												: "Not specified"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Manager:</span>
										<span>{formData.managerName || "Not specified"}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Phone:</span>
										<span>{formData.phoneNumber || "Not specified"}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				<div className="flex justify-end space-x-4 pt-6 border-t">
					<Button type="button" variant="outline" disabled={isSubmitting}>
						Save as Draft
					</Button>
					<Button type="submit" disabled={!isFormValid || isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Creating Location...
							</>
						) : (
							<>
								<Building className="h-4 w-4 mr-2" />
								Create Location
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}

// "use client";

// import type React from "react";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
// 	Building,
// 	MapPin,
// 	User,
// 	Phone,
// 	CheckCircle,
// 	Save,
// 	Loader2,
// } from "lucide-react";
// import { apiClient } from "@/lib/api";

// const locationTypes = [
// 	"Office Building",
// 	"Retail Store",
// 	"Warehouse",
// 	"Manufacturing Plant",
// 	"Government Building",
// 	"Educational Institution",
// 	"Healthcare Facility",
// 	"Residential Complex",
// 	"Mixed Use",
// 	"Other",
// ];

// const countries = [
// 	"Ethiopia",
// 	"Kenya",
// 	"Uganda",
// 	"Tanzania",
// 	"Rwanda",
// 	"Burundi",
// 	"South Sudan",
// 	"Somalia",
// 	"Djibouti",
// 	"Eritrea",
// ];

// const ethiopianCities = [
// 	"Addis Ababa",
// 	"Dire Dawa",
// 	"Mekelle",
// 	"Gondar",
// 	"Awassa",
// 	"Bahir Dar",
// 	"Dessie",
// 	"Jimma",
// 	"Jijiga",
// 	"Shashamane",
// 	"Nekemte",
// 	"Bishoftu",
// 	"Asella",
// 	"Harar",
// 	"Dilla",
// ];

// const addisAbabaSubCities = [
// 	"Addis Ketema",
// 	"Akaky Kaliti",
// 	"Arada",
// 	"Bole",
// 	"Gullele",
// 	"Kirkos",
// 	"Kolfe Keranio",
// 	"Lideta",
// 	"Nifas Silk-Lafto",
// 	"Yeka",
// ];

// const sampleWoredas = [
// 	"Woreda 01",
// 	"Woreda 02",
// 	"Woreda 03",
// 	"Woreda 04",
// 	"Woreda 05",
// 	"Woreda 06",
// 	"Woreda 07",
// 	"Woreda 08",
// 	"Woreda 09",
// 	"Woreda 10",
// ];

// export default function AddBranchPage() {
// 	const router = useRouter();
// 	const [formData, setFormData] = useState({
// 		name: "",
// 		locationType: "",
// 		gpsAddress: "",
// 		city: "",
// 		subCity: "",
// 		woreda: "",
// 		country: "Ethiopia",
// 		managerName: "",
// 		phoneNumber: "",
// 		contactNumber1: "",
// 		contactNumber2: "",
// 		description: "",
// 	});

// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const [error, setError] = useState("");
// 	const [submitted, setSubmitted] = useState(false);

// 	const handleInputChange = (field: string, value: string) => {
// 		setFormData((prev) => ({ ...prev, [field]: value }));
// 	};

// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		setError("");
// 		setIsSubmitting(true);

// 		try {
// 			await apiClient.createBranch(formData);
// 			setSubmitted(true);

// 			// Redirect after 2 seconds
// 			setTimeout(() => {
// 				router.push("/dashboard/branches");
// 			}, 2000);
// 		} catch (error: any) {
// 			setError(error.message || "Failed to create branch. Please try again.");
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	};

// 	const isFormValid =
// 		formData.name &&
// 		formData.locationType &&
// 		formData.city &&
// 		formData.country &&
// 		formData.managerName &&
// 		formData.phoneNumber;

// 	if (submitted) {
// 		return (
// 			<div className="flex items-center justify-center min-h-[400px]">
// 				<Card className="w-full max-w-md">
// 					<CardContent className="pt-6">
// 						<div className="text-center space-y-4">
// 							<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
// 							<h3 className="text-lg font-semibold">
// 								Branch Added Successfully!
// 							</h3>
// 							<p className="text-sm text-muted-foreground">
// 								The new branch "{formData.name}" has been created and is now
// 								available in the system.
// 							</p>
// 							<p className="text-xs text-muted-foreground">
// 								Redirecting to branches page...
// 							</p>
// 						</div>
// 					</CardContent>
// 				</Card>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6">
// 			<div>
// 				<h1 className="text-3xl font-bold tracking-tight">Add New Branch</h1>
// 				<p className="text-muted-foreground">
// 					Create a new branch location with complete address and contact
// 					information.
// 				</p>
// 			</div>

// 			{error && (
// 				<Alert variant="destructive">
// 					<AlertDescription>{error}</AlertDescription>
// 				</Alert>
// 			)}

// 			<form onSubmit={handleSubmit} className="space-y-6">
// 				<div className="grid gap-6 lg:grid-cols-2">
// 					{/* Left Column */}
// 					<div className="space-y-6">
// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Building className="h-5 w-5" />
// 									<span>Branch Information</span>
// 								</CardTitle>
// 								<CardDescription>
// 									Basic information about the new branch
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="name">Branch Name *</Label>
// 									<Input
// 										id="name"
// 										placeholder="e.g., Downtown Office, North Branch"
// 										value={formData.name}
// 										onChange={(e) => handleInputChange("name", e.target.value)}
// 										required
// 									/>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="locationType">Location Type *</Label>
// 									<Select
// 										value={formData.locationType}
// 										onValueChange={(value) =>
// 											handleInputChange("locationType", value)
// 										}
// 										required>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select location type" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{locationTypes.map((type) => (
// 												<SelectItem key={type} value={type}>
// 													{type}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="description">Description</Label>
// 									<Textarea
// 										id="description"
// 										placeholder="Brief description of the branch and its purpose..."
// 										value={formData.description}
// 										onChange={(e) =>
// 											handleInputChange("description", e.target.value)
// 										}
// 										rows={3}
// 									/>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<MapPin className="h-5 w-5" />
// 									<span>Location Details</span>
// 								</CardTitle>
// 								<CardDescription>
// 									Complete address information for the branch
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="gpsAddress">
// 										GPS Address / Street Address
// 									</Label>
// 									<Input
// 										id="gpsAddress"
// 										placeholder="e.g., 123 Main Street, or GPS coordinates"
// 										value={formData.gpsAddress}
// 										onChange={(e) =>
// 											handleInputChange("gpsAddress", e.target.value)
// 										}
// 									/>
// 								</div>

// 								<div className="grid grid-cols-2 gap-4">
// 									<div className="space-y-2">
// 										<Label htmlFor="country">Country *</Label>
// 										<Select
// 											value={formData.country}
// 											onValueChange={(value) =>
// 												handleInputChange("country", value)
// 											}>
// 											<SelectTrigger>
// 												<SelectValue placeholder="Select country" />
// 											</SelectTrigger>
// 											<SelectContent>
// 												{countries.map((country) => (
// 													<SelectItem key={country} value={country}>
// 														{country}
// 													</SelectItem>
// 												))}
// 											</SelectContent>
// 										</Select>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="city">City *</Label>
// 										<Select
// 											value={formData.city}
// 											onValueChange={(value) =>
// 												handleInputChange("city", value)
// 											}>
// 											<SelectTrigger>
// 												<SelectValue placeholder="Select city" />
// 											</SelectTrigger>
// 											<SelectContent>
// 												{(formData.country === "Ethiopia"
// 													? ethiopianCities
// 													: ["Other"]
// 												).map((city) => (
// 													<SelectItem key={city} value={city}>
// 														{city}
// 													</SelectItem>
// 												))}
// 											</SelectContent>
// 										</Select>
// 									</div>
// 								</div>

// 								<div className="grid grid-cols-2 gap-4">
// 									<div className="space-y-2">
// 										<Label htmlFor="subCity">Sub-City</Label>
// 										<Select
// 											value={formData.subCity}
// 											onValueChange={(value) =>
// 												handleInputChange("subCity", value)
// 											}
// 											disabled={formData.city !== "Addis Ababa"}>
// 											<SelectTrigger>
// 												<SelectValue placeholder="Select sub-city" />
// 											</SelectTrigger>
// 											<SelectContent>
// 												{(formData.city === "Addis Ababa"
// 													? addisAbabaSubCities
// 													: []
// 												).map((subCity) => (
// 													<SelectItem key={subCity} value={subCity}>
// 														{subCity}
// 													</SelectItem>
// 												))}
// 											</SelectContent>
// 										</Select>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="woreda">Woreda</Label>
// 										<Select
// 											value={formData.woreda}
// 											onValueChange={(value) =>
// 												handleInputChange("woreda", value)
// 											}>
// 											<SelectTrigger>
// 												<SelectValue placeholder="Select woreda" />
// 											</SelectTrigger>
// 											<SelectContent>
// 												{sampleWoredas.map((woreda) => (
// 													<SelectItem key={woreda} value={woreda}>
// 														{woreda}
// 													</SelectItem>
// 												))}
// 											</SelectContent>
// 										</Select>
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</div>

// 					{/* Right Column */}
// 					<div className="space-y-6">
// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<User className="h-5 w-5" />
// 									<span>Manager Information</span>
// 								</CardTitle>
// 								<CardDescription>
// 									Contact details for the branch manager
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="managerName">Manager Name *</Label>
// 									<Input
// 										id="managerName"
// 										placeholder="Full name of the branch manager"
// 										value={formData.managerName}
// 										onChange={(e) =>
// 											handleInputChange("managerName", e.target.value)
// 										}
// 										required
// 									/>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="phoneNumber">Phone Number *</Label>
// 									<Input
// 										id="phoneNumber"
// 										placeholder="+251 911 123 456"
// 										value={formData.phoneNumber}
// 										onChange={(e) =>
// 											handleInputChange("phoneNumber", e.target.value)
// 										}
// 										required
// 									/>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Phone className="h-5 w-5" />
// 									<span>Additional Contacts</span>
// 								</CardTitle>
// 								<CardDescription>
// 									Alternative contact numbers for the branch
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="contactNumber1">Contact Number 1</Label>
// 									<Input
// 										id="contactNumber1"
// 										placeholder="+251 911 123 457"
// 										value={formData.contactNumber1}
// 										onChange={(e) =>
// 											handleInputChange("contactNumber1", e.target.value)
// 										}
// 									/>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="contactNumber2">Contact Number 2</Label>
// 									<Input
// 										id="contactNumber2"
// 										placeholder="+251 911 123 458"
// 										value={formData.contactNumber2}
// 										onChange={(e) =>
// 											handleInputChange("contactNumber2", e.target.value)
// 										}
// 									/>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						<Card>
// 							<CardHeader>
// 								<CardTitle>Branch Summary</CardTitle>
// 								<CardDescription>
// 									Review the information before creating the branch
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-3 text-sm">
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">Branch Name:</span>
// 										<span className="font-medium">
// 											{formData.name || "Not specified"}
// 										</span>
// 									</div>
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">Type:</span>
// 										<span>{formData.locationType || "Not specified"}</span>
// 									</div>
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">Location:</span>
// 										<span>
// 											{[formData.city, formData.subCity, formData.country]
// 												.filter(Boolean)
// 												.join(", ") || "Not specified"}
// 										</span>
// 									</div>
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">Manager:</span>
// 										<span>{formData.managerName || "Not specified"}</span>
// 									</div>
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">Phone:</span>
// 										<span>{formData.phoneNumber || "Not specified"}</span>
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</div>
// 				</div>

// 				<div className="flex justify-end space-x-4 pt-6 border-t">
// 					<Button type="button" variant="outline" disabled={isSubmitting}>
// 						Save as Draft
// 					</Button>
// 					<Button type="submit" disabled={!isFormValid || isSubmitting}>
// 						{isSubmitting ? (
// 							<>
// 								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 								Creating Branch...
// 							</>
// 						) : (
// 							<>
// 								<Building className="h-4 w-4 mr-2" />
// 								Create Branch
// 							</>
// 						)}
// 					</Button>
// 				</div>
// 			</form>
// 		</div>
// 	);
// }
