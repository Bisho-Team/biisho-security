"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	MapPin,
	Loader2,
	Send,
	AlertTriangle,
	Shield,
	Clock,
	CheckCircle,
	Navigation,
	Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { webSocketService } from "@/lib/websocket-service";
import { useLocationSearch } from "@/hooks/use-location-search";
import { PhoneNumberInput } from "@/components/phone-number-input";

const alarmTypes = [
	"Motion Detection",
	"Door Breach",
	"Window Sensor",
	"Fire Alarm",
	"Panic Button",
	"Glass Break",
	"Perimeter Breach",
	"System Malfunction",
];

const severityLevels = [
	{ value: "LOW", label: "Low", color: "bg-green-100 text-green-800" },
	{ value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
	{ value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
	{ value: "CRITICAL", label: "Critical", color: "bg-red-100 text-red-800" },
];

interface Alarm {
	id: string;
	type: string;
	location: string;
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	additionalNotes: string;
	status: "ACTIVE" | "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED";
	createdAt: string;
	updatedAt: string;
	companyId: string;
	branchId: string;
	createdById: string;
}

export default function ConfigureAlarmPage() {
	const { user } = useAuth();
	const router = useRouter();
	const [availableBranches, setAvailableBranches] = useState<any[]>([]);
	const [policeManagers, setPoliceManagers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [formData, setFormData] = useState({
		type: "",
		branchId: "",
		assignedToId: "",
		severity: "",
		location: "",
		latitude: "",
		longitude: "",
		description: "",
		additionalNotes: "",
	});

	// Location search states
	const [searchQuery, setSearchQuery] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

	// Use the location search hook
	const {
		results: searchResults,
		isSearching,
		debouncedSearch,
		reverseGeocode,
		clearResults,
	} = useLocationSearch();

	// Refs for managing search
	const searchInputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");

	// SMS Report states
	const [smsPhoneNumber, setSmsPhoneNumber] = useState("");
	const [smsError, setSmsError] = useState("");
	const [smsSuccess, setSmsSuccess] = useState(false);

	const { toast } = useToast();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const branches = await apiClient.getBranches();
				setAvailableBranches(branches);
				fetchPoliceManagers();
			} catch (error) {
				console.error("Failed to fetch data:", error);
				setError("Failed to load form data. Please refresh the page.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const fetchPoliceManagers = async () => {
		try {
			const response = await apiService.get("/users/police-managers");
			setPoliceManagers(response as any);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch police managers",
				variant: "destructive",
			});
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSearchInputChange = (value: string) => {
		setSearchQuery(value);

		if (!value.trim()) {
			clearResults();
			setShowSuggestions(false);
			setSelectedLocation(null);
			setFormData((prev) => ({
				...prev,
				location: "",
				latitude: "",
				longitude: "",
			}));
			return;
		}

		// Trigger debounced search
		debouncedSearch(value);

		// Show suggestions if we have a query
		if (value.trim().length >= 2) {
			setShowSuggestions(true);
		}
	};

	// Effect to update suggestions visibility when results change
	useEffect(() => {
		if (searchResults.length > 0 && searchQuery.trim().length >= 2) {
			setShowSuggestions(true);
		}
	}, [searchResults, searchQuery]);

	const selectLocation = (location: any) => {
		setSelectedLocation(location);
		setSearchQuery(location.name);
		setFormData((prev) => ({
			...prev,
			location: location.name,
			latitude: location.latitude,
			longitude: location.longitude,
		}));
		setShowSuggestions(false);

		toast({
			title: "Location Selected",
			description: `Selected: ${location.name}, ${location.address}`,
		});
	};

	const getCurrentLocation = async () => {
		if (!navigator.geolocation) {
			toast({
				title: "Geolocation Not Supported",
				description: "Your browser does not support geolocation.",
				variant: "destructive",
			});
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;

				try {
					const location = await reverseGeocode(latitude, longitude);

					if (location) {
						setSelectedLocation(location);
						setSearchQuery(location.name);
						setFormData((prev) => ({
							...prev,
							location: location.name,
							latitude: location.latitude,
							longitude: location.longitude,
						}));

						toast({
							title: "Location Detected",
							description: `Current location: ${location.name}`,
						});
					} else {
						// Fallback to coordinates
						setFormData((prev) => ({
							...prev,
							location: "Current Location",
							latitude: latitude.toString(),
							longitude: longitude.toString(),
						}));
						setSearchQuery("Current Location");
					}
				} catch (error) {
					console.error("Reverse geocoding error:", error);
					setFormData((prev) => ({
						...prev,
						location: "Current Location",
						latitude: latitude.toString(),
						longitude: longitude.toString(),
					}));
					setSearchQuery("Current Location");
				}
			},
			(error) => {
				console.error("Geolocation error:", error);
				toast({
					title: "Location Error",
					description:
						"Unable to get your current location. Please search manually.",
					variant: "destructive",
				});
			},
			{
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 300000,
			}
		);
	};

	// Handle click outside to close suggestions
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(event.target as Node) &&
				!searchInputRef.current?.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Isolated SMS sending function that runs in background
	const sendSmsReportInBackground = async (
		alarmData: any,
		phoneNumber: string
	) => {
		if (!phoneNumber.trim()) return;

		// Reset SMS states
		setSmsError("");
		setSmsSuccess(false);

		try {
			const smsMessage = `🚨 ALARM REPORT 🚨
Type: ${alarmData.type}
Location: ${alarmData.location}
Description: ${alarmData.description}
Time: ${new Date().toLocaleString()}
Priority: CRITICAL
Status: DISPATCHED

This is an automated security alert.`;

			// Send SMS in background - don't await this
			fetch("http://94.130.27.32:3001/send-sms", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					to: phoneNumber.replace(/\D/g, ""), // Remove non-digits
					message: smsMessage,
					callback: `${window.location.origin}/api/sms-status`,
				}),
			})
				.then(async (response) => {
					if (!response.ok) {
						throw new Error(`SMS API error: ${response.status}`);
					}
					const result = await response.json();
					setSmsSuccess(true);

					toast({
						title: "SMS Report Sent",
						description: `Alarm report sent to ${phoneNumber}`,
					});
				})
				.catch((error) => {
					console.error("SMS sending error:", error);
					setSmsError(error.message || "Failed to send SMS report");

					toast({
						title: "SMS Error",
						description:
							"Failed to send SMS report, but alarm was created successfully",
						variant: "destructive",
					});
				});
		} catch (error: any) {
			console.error("SMS preparation error:", error);
			setSmsError("Failed to prepare SMS message");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			const alarmPayload = {
				...formData,
				severity: "CRITICAL",
				coordinates:
					formData.latitude && formData.longitude
						? { latitude: formData.latitude, longitude: formData.longitude }
						: undefined,
			};

			// Submit the alarm form first
			const response = await apiClient.createAlarm(alarmPayload);

			console.log("Alarm created:", response);

			// Send WebSocket notification
			if (webSocketService.isConnected()) {
				webSocketService.send({
					type: "alarm_created",
					alarm: response.alarm,
				});
			}

			// Mark form as submitted
			setSubmitted(true);

			// Send SMS in background AFTER successful alarm creation
			if (smsPhoneNumber.trim()) {
				sendSmsReportInBackground(alarmPayload, smsPhoneNumber);
			}

			// Redirect after 3 seconds
			setTimeout(() => {
				router.push("/dashboard/alarms");
			}, 3000);
		} catch (error: any) {
			setError(error.message || "Failed to create alarm. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid =
		formData.type &&
		formData.branchId &&
		formData.assignedToId &&
		formData.description;

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-muted-foreground">Loading form data...</p>
				</div>
			</div>
		);
	}

	if (submitted) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="text-center space-y-4">
							<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
							<h3 className="text-lg font-semibold">
								Alarm Dispatched Successfully!
							</h3>
							<p className="text-sm text-muted-foreground">
								The alarm has been sent to the selected police manager and is
								now being processed.
							</p>

							{/* SMS Status Display */}
							{smsPhoneNumber && (
								<div className="mt-4 space-y-2">
									{smsSuccess && (
										<div className="p-3 bg-green-50 rounded-lg border border-green-200">
											<p className="text-xs text-green-700 flex items-center justify-center">
												<CheckCircle className="h-3 w-3 mr-1" />
												📨 SMS report sent to {smsPhoneNumber}
											</p>
										</div>
									)}

									{smsError && (
										<div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
											<p className="text-xs text-yellow-700 flex items-center justify-center">
												<AlertTriangle className="h-3 w-3 mr-1" />
												⚠️ Alarm created but SMS failed to send
											</p>
										</div>
									)}

									{!smsSuccess && !smsError && (
										<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
											<p className="text-xs text-blue-700 flex items-center justify-center">
												<Loader2 className="h-3 w-3 mr-1 animate-spin" />
												📱 Sending SMS report to {smsPhoneNumber}...
											</p>
										</div>
									)}
								</div>
							)}

							<p className="text-xs text-muted-foreground">
								Redirecting to alarms page...
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
				<h1 className="text-3xl font-bold tracking-tight">
					Configure New Alarm
				</h1>
				<p className="text-muted-foreground">
					Create and dispatch a new security alarm to the appropriate police
					manager.
				</p>
				{user?.role === "OPERATOR" && (
					<div className="mt-2 p-3 bg-blue-50 rounded-lg">
						<p className="text-sm text-blue-700">
							<strong>Note:</strong> You can only select branches assigned to
							you by your Office Manager.
						</p>
					</div>
				)}
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
									<AlertTriangle className="h-5 w-5" />
									<span>Alarm Details</span>
								</CardTitle>
								<CardDescription>
									Configure the basic alarm information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="type">Alarm Type *</Label>
									<Select
										value={formData.type}
										onValueChange={(value) => handleInputChange("type", value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select alarm type" />
										</SelectTrigger>
										<SelectContent>
											{alarmTypes.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="location">Location *</Label>
									<div className="space-y-2">
										<div className="relative">
											<div className="flex gap-2">
												<div className="relative flex-1">
													<Input
														ref={searchInputRef}
														id="location"
														placeholder="Search for any location (e.g., Bole subcity, Yeka, Addis Ababa...)"
														value={searchQuery}
														onChange={(e) =>
															handleSearchInputChange(e.target.value)
														}
														onFocus={() => {
															if (searchResults.length > 0) {
																setShowSuggestions(true);
															}
														}}
														className="pr-10"
														autoComplete="off"
													/>
													{isSearching && (
														<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
															<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
														</div>
													)}
												</div>
												<Button
													type="button"
													variant="outline"
													size="icon"
													onClick={getCurrentLocation}
													disabled={isSearching}
													title="Use current location">
													<Navigation className="h-4 w-4" />
												</Button>
											</div>

											{/* Enhanced Autocomplete Suggestions */}
											{showSuggestions && searchResults.length > 0 && (
												<div
													ref={suggestionsRef}
													className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
													<div className="p-2 border-b bg-gray-50">
														<p className="text-xs text-gray-600 font-medium">
															Found {searchResults.length} location
															{searchResults.length !== 1 ? "s" : ""}
														</p>
													</div>
													{searchResults.map((result) => (
														<div
															key={result.id}
															className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
															onClick={() => selectLocation(result)}>
															<div className="flex items-start space-x-3">
																<div className="flex-shrink-0 mt-0.5">
																	{result.icon}
																</div>
																<div className="flex-1 min-w-0">
																	<div className="flex items-center space-x-2">
																		<p className="text-sm font-medium text-gray-900 truncate">
																			{result.name}
																		</p>
																		<Badge
																			variant="outline"
																			className="text-xs">
																			{result.category}
																		</Badge>
																	</div>
																	<p className="text-xs text-gray-500 truncate mt-1">
																		{result.address}
																	</p>
																	<div className="flex items-center space-x-2 mt-1">
																		<span className="text-xs text-gray-400">
																			{result.country}
																		</span>
																		{result.region && (
																			<>
																				<span className="text-xs text-gray-300">
																					•
																				</span>
																				<span className="text-xs text-gray-400">
																					{result.region}
																				</span>
																			</>
																		)}
																	</div>
																</div>
																<div className="flex-shrink-0">
																	<div
																		className="w-2 h-2 rounded-full bg-green-400"
																		style={{ opacity: result.confidence }}
																		title={`Confidence: ${Math.round(
																			result.confidence * 100
																		)}%`}
																	/>
																</div>
															</div>
														</div>
													))}
												</div>
											)}

											{/* No results message */}
											{searchQuery &&
												!isSearching &&
												searchResults.length === 0 &&
												searchQuery.length >= 2 && (
													<div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
														<div className="text-center text-gray-500">
															<Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
															<p className="text-sm">
																No locations found for "{searchQuery}"
															</p>
															<p className="text-xs mt-1">
																Try searching for cities, addresses, or
																landmarks
															</p>
														</div>
													</div>
												)}
										</div>

										{/* Selected location display */}
										{selectedLocation && (
											<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
												<div className="flex items-center space-x-2">
													<MapPin className="h-4 w-4 text-blue-600" />
													<div className="flex-1">
														<p className="text-sm font-medium text-blue-900">
															{selectedLocation.name}
														</p>
														<p className="text-xs text-blue-700">
															{selectedLocation.address}
														</p>
														<p className="text-xs text-blue-600 mt-1">
															Coordinates: {selectedLocation.latitude},{" "}
															{selectedLocation.longitude}
														</p>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Alarm Description *</CardTitle>
								<CardDescription>
									Provide detailed information about the security incident
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="description">Report Details *</Label>
									<Textarea
										id="description"
										placeholder="Describe the security incident in detail..."
										value={formData.description}
										onChange={(e) =>
											handleInputChange("description", e.target.value)
										}
										rows={4}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="additionalNotes">Additional Notes</Label>
									<Textarea
										id="additionalNotes"
										placeholder="Any additional information or context..."
										value={formData.additionalNotes}
										onChange={(e) =>
											handleInputChange("additionalNotes", e.target.value)
										}
										rows={3}
									/>
								</div>

								<PhoneNumberInput
									value={smsPhoneNumber}
									onChange={setSmsPhoneNumber}
									formData={formData}
									smsError={smsError}
									smsSuccess={smsSuccess}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Branch Selection and Police Manager Assignment remain the same */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<MapPin className="h-5 w-5" />
									<span>Branch Selection</span>
								</CardTitle>
								<CardDescription>
									{user?.role === "OPERATOR"
										? "Select from your assigned branches"
										: "Select the branch where the alarm occurred"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<Label htmlFor="branchId">Branch *</Label>
									<Select
										value={formData.branchId}
										onValueChange={(value) =>
											handleInputChange("branchId", value)
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select branch" />
										</SelectTrigger>
										<SelectContent>
											{availableBranches.map((branch) => (
												<SelectItem
													key={branch.id}
													value={branch.id}
													disabled={branch.status !== "ACTIVE"}>
													<div className="flex items-center justify-between w-full">
														<span>{branch.name}</span>
														<div className="flex items-center space-x-2 ml-2">
															<span className="text-xs text-muted-foreground">
																{branch.city}
															</span>
															<Badge
																variant={
																	branch.status === "ACTIVE"
																		? "default"
																		: "secondary"
																}
																className="text-xs">
																{branch.status}
															</Badge>
														</div>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{availableBranches.length === 0 && (
									<div className="mt-4 p-3 bg-yellow-50 rounded-lg">
										<p className="text-sm text-yellow-700">
											No branches available. Please contact your Office Manager
											to assign branches to your account.
										</p>
									</div>
								)}

								{formData.branchId && (
									<div className="mt-4 p-3 bg-blue-50 rounded-lg">
										<div className="flex items-center space-x-2">
											<MapPin className="h-4 w-4 text-blue-600" />
											<span className="text-sm font-medium text-blue-900">
												{
													availableBranches.find(
														(b) => b.id === formData.branchId
													)?.name
												}
											</span>
										</div>
										<p className="text-xs text-blue-700 mt-1">
											Location:{" "}
											{
												availableBranches.find(
													(b) => b.id === formData.branchId
												)?.city
											}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Shield className="h-5 w-5" />
									<span>Police Manager Assignment</span>
								</CardTitle>
								<CardDescription>
									Select the police manager to handle this alarm
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<Label htmlFor="assignedToId">
										Responder (Police Manager) *
									</Label>
									<Select
										value={formData.assignedToId}
										onValueChange={(value) =>
											handleInputChange("assignedToId", value)
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select police manager" />
										</SelectTrigger>
										<SelectContent>
											{policeManagers.map((manager) => (
												<SelectItem
													key={manager.id}
													value={manager.id}
													disabled={manager.status === "busy"}>
													<div className="flex items-center justify-between w-full">
														<div>
															<span className="font-medium">
																{manager.name}
															</span>
															<p className="text-xs text-muted-foreground">
																{manager.station}
															</p>
														</div>
														<Badge
															variant={
																manager.status === "available"
																	? "default"
																	: "secondary"
															}
															className="ml-2 text-xs">
															{manager.status}
														</Badge>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{formData.assignedToId && (
									<div className="mt-4 p-3 bg-green-50 rounded-lg">
										<div className="flex items-center space-x-2">
											<Shield className="h-4 w-4 text-green-600" />
											<span className="text-sm font-medium text-green-900">
												{
													policeManagers.find(
														(m) => m.id === formData.assignedToId
													)?.name
												}
											</span>
										</div>
										<p className="text-xs text-green-700 mt-1">
											Station:{" "}
											{
												policeManagers.find(
													(m) => m.id === formData.assignedToId
												)?.station
											}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Clock className="h-5 w-5" />
									<span>Dispatch Information</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Dispatch Time:
										</span>
										<span>{new Date().toLocaleString()}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Priority:</span>
										<span>
											<Badge className="bg-red-100 text-red-800">
												Critical
											</Badge>
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Estimated Response:
										</span>
										<span>2-5 minutes</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				<div className="flex justify-end space-x-4 pt-6 border-t">
					{/* <Button type="button" variant="outline" disabled={isSubmitting}>
						Save as Draft
					</Button> */}
					<Button
						type="submit"
						disabled={!isFormValid || isSubmitting}
						className="bg-red-600 hover:bg-red-700">
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Dispatching...
							</>
						) : (
							<>
								<Send className="h-4 w-4 mr-2" />
								Send Alarm
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
// import { useState, useEffect, useRef } from "react";
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
// import { Textarea } from "@/components/ui/textarea";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
// 	MapPin,
// 	Loader2,
// 	Send,
// 	AlertTriangle,
// 	Shield,
// 	Clock,
// 	CheckCircle,
// 	Navigation,
// 	Globe,
// } from "lucide-react";
// import { useAuth } from "@/contexts/auth-context";
// import { apiClient } from "@/lib/api";
// import { apiService } from "@/lib/api-service";
// import { useToast } from "@/hooks/use-toast";
// import { webSocketService } from "@/lib/websocket-service";
// import { useLocationSearch } from "@/hooks/use-location-search";
// import { PhoneNumberInput } from "@/components/phone-number-input";

// const alarmTypes = [
// 	"Motion Detection",
// 	"Door Breach",
// 	"Window Sensor",
// 	"Fire Alarm",
// 	"Panic Button",
// 	"Glass Break",
// 	"Perimeter Breach",
// 	"System Malfunction",
// ];

// const severityLevels = [
// 	{ value: "LOW", label: "Low", color: "bg-green-100 text-green-800" },
// 	{ value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
// 	{ value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
// 	{ value: "CRITICAL", label: "Critical", color: "bg-red-100 text-red-800" },
// ];

// interface Alarm {
// 	id: string;
// 	type: string;
// 	location: string;
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	additionalNotes: string;
// 	status: "ACTIVE" | "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED";
// 	createdAt: string;
// 	updatedAt: string;
// 	companyId: string;
// 	branchId: string;
// 	createdById: string;
// }

// export default function ConfigureAlarmPage() {
// 	const { user } = useAuth();
// 	const router = useRouter();
// 	const [availableBranches, setAvailableBranches] = useState<any[]>([]);
// 	const [policeManagers, setPoliceManagers] = useState<any[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [formData, setFormData] = useState({
// 		type: "",
// 		branchId: "",
// 		assignedToId: "",
// 		severity: "",
// 		location: "",
// 		latitude: "",
// 		longitude: "",
// 		description: "",
// 		additionalNotes: "",
// 	});

// 	// Location search states
// 	const [searchQuery, setSearchQuery] = useState("");
// 	const [showSuggestions, setShowSuggestions] = useState(false);
// 	const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

// 	// SMS Report states
// 	const [smsPhoneNumber, setSmsPhoneNumber] = useState("");
// 	const [sendingSms, setSendingSms] = useState(false);
// 	const [smsError, setSmsError] = useState("");
// 	const [smsSuccess, setSmsSuccess] = useState(false);

// 	// Use the location search hook
// 	const {
// 		results: searchResults,
// 		isSearching,
// 		debouncedSearch,
// 		reverseGeocode,
// 		clearResults,
// 	} = useLocationSearch();

// 	// Refs for managing search
// 	const searchInputRef = useRef<HTMLInputElement>(null);
// 	const suggestionsRef = useRef<HTMLDivElement>(null);

// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const [submitted, setSubmitted] = useState(false);
// 	const [error, setError] = useState("");
// 	const { toast } = useToast();

// 	useEffect(() => {
// 		const fetchData = async () => {
// 			try {
// 				setLoading(true);
// 				const branches = await apiClient.getBranches();
// 				setAvailableBranches(branches);
// 				fetchPoliceManagers();
// 			} catch (error) {
// 				console.error("Failed to fetch data:", error);
// 				setError("Failed to load form data. Please refresh the page.");
// 			} finally {
// 				setLoading(false);
// 			}
// 		};

// 		fetchData();
// 	}, []);

// 	const fetchPoliceManagers = async () => {
// 		try {
// 			const response = await apiService.get("/users/police-managers");
// 			setPoliceManagers(response as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch police managers",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const handleInputChange = (field: string, value: string) => {
// 		setFormData((prev) => ({ ...prev, [field]: value }));
// 	};

// 	const handleSearchInputChange = (value: string) => {
// 		console.log("Search input changed:", value);
// 		setSearchQuery(value);

// 		if (!value.trim()) {
// 			clearResults();
// 			setShowSuggestions(false);
// 			setSelectedLocation(null);
// 			setFormData((prev) => ({
// 				...prev,
// 				location: "",
// 				latitude: "",
// 				longitude: "",
// 			}));
// 			return;
// 		}

// 		// Trigger debounced search
// 		debouncedSearch(value);

// 		// Show suggestions if we have a query
// 		if (value.trim().length >= 2) {
// 			setShowSuggestions(true);
// 		}
// 	};

// 	// Effect to update suggestions visibility when results change
// 	useEffect(() => {
// 		if (searchResults.length > 0 && searchQuery.trim().length >= 2) {
// 			setShowSuggestions(true);
// 		}
// 	}, [searchResults, searchQuery]);

// 	const selectLocation = (location: any) => {
// 		setSelectedLocation(location);
// 		setSearchQuery(location.name);
// 		setFormData((prev) => ({
// 			...prev,
// 			location: location.name,
// 			latitude: location.latitude,
// 			longitude: location.longitude,
// 		}));
// 		setShowSuggestions(false);

// 		toast({
// 			title: "Location Selected",
// 			description: `Selected: ${location.name}, ${location.address}`,
// 		});
// 	};

// 	const getCurrentLocation = async () => {
// 		if (!navigator.geolocation) {
// 			toast({
// 				title: "Geolocation Not Supported",
// 				description: "Your browser does not support geolocation.",
// 				variant: "destructive",
// 			});
// 			return;
// 		}

// 		navigator.geolocation.getCurrentPosition(
// 			async (position) => {
// 				const { latitude, longitude } = position.coords;

// 				try {
// 					const location = await reverseGeocode(latitude, longitude);

// 					if (location) {
// 						setSelectedLocation(location);
// 						setSearchQuery(location.name);
// 						setFormData((prev) => ({
// 							...prev,
// 							location: location.name,
// 							latitude: location.latitude,
// 							longitude: location.longitude,
// 						}));

// 						toast({
// 							title: "Location Detected",
// 							description: `Current location: ${location.name}`,
// 						});
// 					} else {
// 						// Fallback to coordinates
// 						setFormData((prev) => ({
// 							...prev,
// 							location: "Current Location",
// 							latitude: latitude.toString(),
// 							longitude: longitude.toString(),
// 						}));
// 						setSearchQuery("Current Location");
// 					}
// 				} catch (error) {
// 					console.error("Reverse geocoding error:", error);
// 					setFormData((prev) => ({
// 						...prev,
// 						location: "Current Location",
// 						latitude: latitude.toString(),
// 						longitude: longitude.toString(),
// 					}));
// 					setSearchQuery("Current Location");
// 				}
// 			},
// 			(error) => {
// 				console.error("Geolocation error:", error);
// 				toast({
// 					title: "Location Error",
// 					description:
// 						"Unable to get your current location. Please search manually.",
// 					variant: "destructive",
// 				});
// 			},
// 			{
// 				enableHighAccuracy: true,
// 				timeout: 15000,
// 				maximumAge: 300000,
// 			}
// 		);
// 	};

// 	// Handle click outside to close suggestions
// 	useEffect(() => {
// 		const handleClickOutside = (event: MouseEvent) => {
// 			if (
// 				suggestionsRef.current &&
// 				!suggestionsRef.current.contains(event.target as Node) &&
// 				!searchInputRef.current?.contains(event.target as Node)
// 			) {
// 				setShowSuggestions(false);
// 			}
// 		};

// 		document.addEventListener("mousedown", handleClickOutside);
// 		return () => {
// 			document.removeEventListener("mousedown", handleClickOutside);
// 		};
// 	}, []);

// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		setError("");
// 		setIsSubmitting(true);

// 		try {
// 			const response = await apiClient.createAlarm({
// 				...formData,
// 				severity: "CRITICAL",
// 				coordinates:
// 					formData.latitude && formData.longitude
// 						? { latitude: formData.latitude, longitude: formData.longitude }
// 						: undefined,
// 			});

// 			console.log("Alarm created:", response);
// 			if (webSocketService.isConnected()) {
// 				webSocketService.send({
// 					type: "alarm_created",
// 					alarm: response.alarm,
// 				});
// 			}
// 			setSubmitted(true);

// 			setTimeout(() => {
// 				router.push("/dashboard/alarms");
// 			}, 3000);
// 		} catch (error: any) {
// 			setError(error.message || "Failed to create alarm. Please try again.");
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	};

// 	const isFormValid =
// 		formData.type &&
// 		formData.branchId &&
// 		formData.assignedToId &&
// 		formData.description;

// 	if (loading) {
// 		return (
// 			<div className="flex items-center justify-center min-h-[400px]">
// 				<div className="text-center space-y-4">
// 					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
// 					<p className="text-muted-foreground">Loading form data...</p>
// 				</div>
// 			</div>
// 		);
// 	}

// 	if (submitted) {
// 		return (
// 			<div className="flex items-center justify-center min-h-[400px]">
// 				<Card className="w-full max-w-md">
// 					<CardContent className="pt-6">
// 						<div className="text-center space-y-4">
// 							<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
// 							<h3 className="text-lg font-semibold">
// 								Alarm Dispatched Successfully!
// 							</h3>
// 							<p className="text-sm text-muted-foreground">
// 								The alarm has been sent to the selected police manager and is
// 								now being processed.
// 							</p>
// 							<p className="text-xs text-muted-foreground">
// 								Redirecting to alarms page...
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
// 				<h1 className="text-3xl font-bold tracking-tight">
// 					Configure New Alarm
// 				</h1>
// 				<p className="text-muted-foreground">
// 					Create and dispatch a new security alarm to the appropriate police
// 					manager.
// 				</p>
// 				{user?.role === "OPERATOR" && (
// 					<div className="mt-2 p-3 bg-blue-50 rounded-lg">
// 						<p className="text-sm text-blue-700">
// 							<strong>Note:</strong> You can only select branches assigned to
// 							you by your Office Manager.
// 						</p>
// 					</div>
// 				)}
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
// 									<AlertTriangle className="h-5 w-5" />
// 									<span>Alarm Details</span>
// 								</CardTitle>
// 								<CardDescription>
// 									Configure the basic alarm information
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="type">Alarm Type *</Label>
// 									<Select
// 										value={formData.type}
// 										onValueChange={(value) => handleInputChange("type", value)}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select alarm type" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{alarmTypes.map((type) => (
// 												<SelectItem key={type} value={type}>
// 													{type}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="location">Location *</Label>
// 									<div className="space-y-2">
// 										<div className="relative">
// 											<div className="flex gap-2">
// 												<div className="relative flex-1">
// 													<Input
// 														ref={searchInputRef}
// 														id="location"
// 														placeholder="Search for any location (e.g., Bole, Legehar, Hayat, etc.)"
// 														value={searchQuery}
// 														onChange={(e) =>
// 															handleSearchInputChange(e.target.value)
// 														}
// 														onFocus={() => {
// 															if (searchResults.length > 0) {
// 																setShowSuggestions(true);
// 															}
// 														}}
// 														className="pr-10"
// 														autoComplete="off"
// 													/>
// 													{isSearching && (
// 														<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
// 															<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
// 														</div>
// 													)}
// 												</div>
// 												<Button
// 													type="button"
// 													variant="outline"
// 													size="icon"
// 													onClick={getCurrentLocation}
// 													disabled={isSearching}
// 													title="Use current location">
// 													<Navigation className="h-4 w-4" />
// 												</Button>
// 											</div>

// 											{/* Enhanced Autocomplete Suggestions */}
// 											{showSuggestions && searchResults.length > 0 && (
// 												<div
// 													ref={suggestionsRef}
// 													className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
// 													<div className="p-2 border-b bg-gray-50">
// 														<p className="text-xs text-gray-600 font-medium">
// 															Found {searchResults.length} location
// 															{searchResults.length !== 1 ? "s" : ""}
// 														</p>
// 													</div>
// 													{searchResults.map((result) => (
// 														<div
// 															key={result.id}
// 															className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
// 															onClick={() => selectLocation(result)}>
// 															<div className="flex items-start space-x-3">
// 																<div className="flex-shrink-0 mt-0.5">
// 																	{result.icon}
// 																</div>
// 																<div className="flex-1 min-w-0">
// 																	<div className="flex items-center space-x-2">
// 																		<p className="text-sm font-medium text-gray-900 truncate">
// 																			{result.name}
// 																		</p>
// 																		<Badge
// 																			variant="default"
// 																			className="text-xs">
// 																			{result.category}
// 																		</Badge>
// 																	</div>
// 																	<p className="text-xs text-gray-500 truncate mt-1">
// 																		{result.address}
// 																	</p>
// 																	<div className="flex items-center space-x-2 mt-1">
// 																		<span className="text-xs text-gray-400">
// 																			{result.country}
// 																		</span>
// 																		{result.region && (
// 																			<>
// 																				<span className="text-xs text-gray-300">
// 																					•
// 																				</span>
// 																				<span className="text-xs text-gray-400">
// 																					{result.region}
// 																				</span>
// 																			</>
// 																		)}
// 																	</div>
// 																</div>
// 																<div className="flex-shrink-0">
// 																	<div
// 																		className="w-2 h-2 rounded-full bg-green-400"
// 																		style={{ opacity: result.confidence }}
// 																		title={`Confidence: ${Math.round(
// 																			result.confidence * 100
// 																		)}%`}
// 																	/>
// 																</div>
// 															</div>
// 														</div>
// 													))}
// 												</div>
// 											)}

// 											{/* No results message */}
// 											{searchQuery &&
// 												!isSearching &&
// 												searchResults.length === 0 &&
// 												searchQuery.length >= 2 && (
// 													<div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
// 														<div className="text-center text-gray-500">
// 															<Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
// 															<p className="text-sm">
// 																No locations found for "{searchQuery}"
// 															</p>
// 															<p className="text-xs mt-1">
// 																Try searching for cities, addresses, or
// 																landmarks
// 															</p>
// 														</div>
// 													</div>
// 												)}
// 										</div>

// 										{/* Selected location display */}
// 										{selectedLocation && (
// 											<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
// 												<div className="flex items-center space-x-2">
// 													<MapPin className="h-4 w-4 text-blue-600" />
// 													<div className="flex-1">
// 														<p className="text-sm font-medium text-blue-900">
// 															{selectedLocation.name}
// 														</p>
// 														<p className="text-xs text-blue-700">
// 															{selectedLocation.address}
// 														</p>
// 														<p className="text-xs text-blue-600 mt-1">
// 															Coordinates: {selectedLocation.latitude},{" "}
// 															{selectedLocation.longitude}
// 														</p>
// 													</div>
// 												</div>
// 											</div>
// 										)}
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						<Card>
// 							<CardHeader>
// 								<CardTitle>Alarm Description *</CardTitle>
// 								<CardDescription>
// 									Provide detailed information about the security incident
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="description">Report Details *</Label>
// 									<Textarea
// 										id="description"
// 										placeholder="Describe the security incident in detail..."
// 										value={formData.description}
// 										onChange={(e) =>
// 											handleInputChange("description", e.target.value)
// 										}
// 										rows={4}
// 										required
// 									/>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="additionalNotes">Additional Notes</Label>
// 									<Textarea
// 										id="additionalNotes"
// 										placeholder="Any additional information or context..."
// 										value={formData.additionalNotes}
// 										onChange={(e) =>
// 											handleInputChange("additionalNotes", e.target.value)
// 										}
// 										rows={3}
// 									/>
// 								</div>

// 								<PhoneNumberInput
// 									value={smsPhoneNumber}
// 									onChange={setSmsPhoneNumber}
// 									formData={formData}
// 									smsError={smsError}
// 									smsSuccess={smsSuccess}
// 								/>
// 							</CardContent>
// 						</Card>
// 					</div>

// 					{/* Right Column - Branch Selection and Police Manager Assignment remain the same */}
// 					<div className="space-y-6">
// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<MapPin className="h-5 w-5" />
// 									<span>Branch Selection</span>
// 								</CardTitle>
// 								<CardDescription>
// 									{user?.role === "OPERATOR"
// 										? "Select from your assigned branches"
// 										: "Select the branch where the alarm occurred"}
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-2">
// 									<Label htmlFor="branchId">Branch *</Label>
// 									<Select
// 										value={formData.branchId}
// 										onValueChange={(value) =>
// 											handleInputChange("branchId", value)
// 										}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select branch" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{availableBranches.map((branch) => (
// 												<SelectItem
// 													key={branch.id}
// 													value={branch.id}
// 													disabled={branch.status !== "ACTIVE"}>
// 													<div className="flex items-center justify-between w-full">
// 														<span>{branch.name}</span>
// 														<div className="flex items-center space-x-2 ml-2">
// 															<span className="text-xs text-muted-foreground">
// 																{branch.city}
// 															</span>
// 															<Badge
// 																variant={
// 																	branch.status === "ACTIVE"
// 																		? "default"
// 																		: "secondary"
// 																}
// 																className="text-xs">
// 																{branch.status}
// 															</Badge>
// 														</div>
// 													</div>
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								{availableBranches.length === 0 && (
// 									<div className="mt-4 p-3 bg-yellow-50 rounded-lg">
// 										<p className="text-sm text-yellow-700">
// 											No branches available. Please contact your Office Manager
// 											to assign branches to your account.
// 										</p>
// 									</div>
// 								)}

// 								{formData.branchId && (
// 									<div className="mt-4 p-3 bg-blue-50 rounded-lg">
// 										<div className="flex items-center space-x-2">
// 											<MapPin className="h-4 w-4 text-blue-600" />
// 											<span className="text-sm font-medium text-blue-900">
// 												{
// 													availableBranches.find(
// 														(b) => b.id === formData.branchId
// 													)?.name
// 												}
// 											</span>
// 										</div>
// 										<p className="text-xs text-blue-700 mt-1">
// 											Location:{" "}
// 											{
// 												availableBranches.find(
// 													(b) => b.id === formData.branchId
// 												)?.city
// 											}
// 										</p>
// 									</div>
// 								)}
// 							</CardContent>
// 						</Card>

// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Shield className="h-5 w-5" />
// 									<span>Police Manager Assignment</span>
// 								</CardTitle>
// 								<CardDescription>
// 									Select the police manager to handle this alarm
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-2">
// 									<Label htmlFor="assignedToId">
// 										Responder (Police Manager) *
// 									</Label>
// 									<Select
// 										value={formData.assignedToId}
// 										onValueChange={(value) =>
// 											handleInputChange("assignedToId", value)
// 										}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select police manager" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{policeManagers.map((manager) => (
// 												<SelectItem
// 													key={manager.id}
// 													value={manager.id}
// 													disabled={manager.status === "busy"}>
// 													<div className="flex items-center justify-between w-full">
// 														<div>
// 															<span className="font-medium">
// 																{manager.name}
// 															</span>
// 															<p className="text-xs text-muted-foreground">
// 																{manager.station}
// 															</p>
// 														</div>
// 														<Badge
// 															variant={
// 																manager.status === "available"
// 																	? "default"
// 																	: "secondary"
// 															}
// 															className="ml-2 text-xs">
// 															{manager.status}
// 														</Badge>
// 													</div>
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								{formData.assignedToId && (
// 									<div className="mt-4 p-3 bg-green-50 rounded-lg">
// 										<div className="flex items-center space-x-2">
// 											<Shield className="h-4 w-4 text-green-600" />
// 											<span className="text-sm font-medium text-green-900">
// 												{
// 													policeManagers.find(
// 														(m) => m.id === formData.assignedToId
// 													)?.name
// 												}
// 											</span>
// 										</div>
// 										<p className="text-xs text-green-700 mt-1">
// 											Station:{" "}
// 											{
// 												policeManagers.find(
// 													(m) => m.id === formData.assignedToId
// 												)?.station
// 											}
// 										</p>
// 									</div>
// 								)}
// 							</CardContent>
// 						</Card>

// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Clock className="h-5 w-5" />
// 									<span>Dispatch Information</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-3 text-sm">
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">
// 											Dispatch Time:
// 										</span>
// 										<span>{new Date().toLocaleString()}</span>
// 									</div>
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">Priority:</span>
// 										<span>
// 											<Badge className="bg-red-100 text-red-800">
// 												Critical
// 											</Badge>
// 										</span>
// 									</div>
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">
// 											Estimated Response:
// 										</span>
// 										<span>2-5 minutes</span>
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</div>
// 				</div>

// 				<div className="flex justify-end space-x-4 pt-6 border-t">
// 					<Button
// 						type="submit"
// 						disabled={!isFormValid || isSubmitting}
// 						className="bg-red-600 hover:bg-red-700">
// 						{isSubmitting ? (
// 							<>
// 								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 								Dispatching...
// 							</>
// 						) : (
// 							<>
// 								<Send className="h-4 w-4 mr-2" />
// 								Send Alarm
// 							</>
// 						)}
// 					</Button>
// 				</div>
// 			</form>
// 		</div>
// 	);
// }
