"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
	Search,
	Loader2,
	Send,
	AlertTriangle,
	Shield,
	Clock,
	CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { webSocketService } from "@/lib/websocket-service";

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

	const [mapVisible, setMapVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [searching, setSearching] = useState(false);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");
	const { toast } = useToast();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				// Fetch branches
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
			setLoading(true);
			const response = await apiService.get("/users/police-managers");
			console.log("Fetched alarms:", response);
			setPoliceManagers(response as any);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch alarms",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleLocationSearch = async () => {
		if (!searchQuery.trim()) return;

		setSearching(true);
		try {
			// Using Nominatim OpenStreetMap API for geocoding
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					searchQuery
				)}`
			);
			const data = await response.json();

			setSearchResults(
				data.map((item: any) => ({
					name: item.display_name.split(",")[0],
					address: item.display_name,
					latitude: item.lat,
					longitude: item.lon,
				}))
			);
		} catch (error) {
			console.error("Error searching for location:", error);
		} finally {
			setSearching(false);
		}
	};

	const selectLocation = (location: any) => {
		setFormData((prev) => ({
			...prev,
			location: location.name,
			latitude: location.latitude,
			longitude: location.longitude,
		}));
		setSearchResults([]);
		setSearchQuery("");

		// If we had a map instance, we would update the marker here
		// For now, we'll just display the coordinates
	};

	const getCurrentLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;

					// Reverse geocoding to get address from coordinates
					fetch(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
					)
						.then((response) => response.json())
						.then((data) => {
							setFormData((prev) => ({
								...prev,
								location: data.display_name.split(",")[0] || "Current Location",
								latitude: latitude.toString(),
								longitude: longitude.toString(),
							}));
						})
						.catch((error) => {
							console.error("Error getting address:", error);
							setFormData((prev) => ({
								...prev,
								location: "Current Location",
								latitude: latitude.toString(),
								longitude: longitude.toString(),
							}));
						});
				},
				(error) => {
					console.error("Error getting current location:", error);
					toast({
						title: "Location Error",
						description:
							"Unable to get your current location. Please try again or enter manually.",
						variant: "destructive",
					});
				}
			);
		} else {
			toast({
				title: "Geolocation Not Supported",
				description: "Your browser does not support geolocation.",
				variant: "destructive",
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			const response = await apiClient.createAlarm({
				...formData,
				severity: "CRITICAL",

				// Include coordinates in the API call
				latitude: formData.latitude ? formData.latitude : undefined,
				longitude: formData.longitude ? formData.longitude : undefined,
			});
			// Emit WebSocket event for real-time notification
			console.log("Alarm created:", response);
			console.log("WebSocket connected:", webSocketService.isConnected());
			if (webSocketService.isConnected()) {
				webSocketService.send({
					type: "alarm_created",
					alarm: response.alarm,
				});
			}
			setSubmitted(true);

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

								{/* <div className="space-y-2">
									<Label htmlFor="severity">Severity Level *</Label>
									<Select
										value={formData.severity}
										onValueChange={(value) =>
											handleInputChange("severity", value)
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select severity level" />
										</SelectTrigger>
										<SelectContent>
											{severityLevels.map((level) => (
												<SelectItem key={level.value} value={level.value}>
													<div className="flex items-center space-x-2">
														<Badge className={level.color}>{level.label}</Badge>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div> */}

								<div className="space-y-2">
									<Label htmlFor="location">Specific Location</Label>
									<div className="space-y-2">
										<div className="flex gap-2">
											<Input
												id="location"
												placeholder="e.g., Main Entrance, Server Room, Floor 2"
												value={formData.location}
												onChange={(e) =>
													handleInputChange("location", e.target.value)
												}
												className="flex-1"
											/>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() => setMapVisible(!mapVisible)}>
												<MapPin className="h-4 w-4" />
											</Button>
										</div>

										{mapVisible && (
											<Card className="mt-2 p-3">
												<CardContent className="p-0 space-y-3">
													<div className="flex gap-2">
														<Input
															placeholder="Search for a location..."
															value={searchQuery}
															onChange={(e) => setSearchQuery(e.target.value)}
															className="flex-1"
														/>
														<Button
															type="button"
															variant="secondary"
															size="sm"
															onClick={handleLocationSearch}
															disabled={searching || !searchQuery.trim()}>
															{searching ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<Search className="h-4 w-4" />
															)}
														</Button>
													</div>

													{searchResults.length > 0 && (
														<div className="max-h-40 overflow-y-auto border rounded-md">
															{searchResults.map((result, index) => (
																<div
																	key={index}
																	className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
																	onClick={() => selectLocation(result)}>
																	<p className="text-sm font-medium">
																		{result.name}
																	</p>
																	<p className="text-xs text-muted-foreground">
																		{result.address}
																	</p>
																</div>
															))}
														</div>
													)}

													<div className="bg-slate-100 h-40 rounded-md flex items-center justify-center relative">
														<div
															id="location-map"
															className="w-full h-full rounded-md"></div>
														{!formData.latitude && (
															<div className="absolute inset-0 flex items-center justify-center flex-col">
																<MapPin className="h-5 w-5 text-muted-foreground" />
																<p className="text-xs text-muted-foreground mt-1">
																	Search for a location or click to select
																</p>
															</div>
														)}
													</div>

													{formData.latitude && formData.longitude && (
														<div className="text-xs text-muted-foreground">
															<p>Latitude: {formData.latitude}</p>
															<p>Longitude: {formData.longitude}</p>
														</div>
													)}

													<div className="flex justify-end">
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => getCurrentLocation()}>
															Use Current Location
														</Button>
													</div>
												</CardContent>
											</Card>
										)}

										{formData.latitude && formData.longitude && !mapVisible && (
											<div className="text-xs text-muted-foreground flex items-center gap-1">
												<MapPin className="h-3 w-3" />
												<span>
													Location coordinates saved: {formData.latitude},{" "}
													{formData.longitude}
												</span>
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
							</CardContent>
						</Card>
					</div>

					{/* Right Column */}
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
											{formData.severity && (
												<Badge
													className={
														severityLevels.find(
															(s) => s.value === formData.severity
														)?.color
													}>
													{
														severityLevels.find(
															(s) => s.value === formData.severity
														)?.label
													}
												</Badge>
											)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Estimated Response:
										</span>
										<span>
											{formData.severity === "CRITICAL"
												? "2-5 minutes"
												: formData.severity === "HIGH"
												? "5-10 minutes"
												: formData.severity === "MEDIUM"
												? "10-15 minutes"
												: "15-30 minutes"}
										</span>
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
// import { useState, useEffect } from "react";
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
// 	AlertTriangle,
// 	Send,
// 	MapPin,
// 	Shield,
// 	Clock,
// 	CheckCircle,
// 	Loader2,
// } from "lucide-react";
// import { useAuth } from "@/contexts/auth-context";
// import { apiClient } from "@/lib/api";
// import { apiService } from "@/lib/api-service";
// import { useToast } from "@/hooks/use-toast";
// import { webSocketService } from "@/lib/websocket-service";

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
// 	type: String;
// 	location: String;
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
// 		description: "",
// 		additionalNotes: "",
// 	});

// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const [submitted, setSubmitted] = useState(false);
// 	const [error, setError] = useState("");
// 	const { toast } = useToast();

// 	useEffect(() => {
// 		const fetchData = async () => {
// 			try {
// 				setLoading(true);

// 				// Fetch branches
// 				const branches = await apiClient.getBranches();
// 				setAvailableBranches(branches);
// 				fetchPoliceManagers();

// 				// Fetch police managers (mock for now - would need API endpoint)
// 				// const mockPoliceManagers = [
// 				// 	{
// 				// 		id: "1",
// 				// 		name: "Captain Sarah Johnson",
// 				// 		station: "Central Police Station",
// 				// 		status: "available",
// 				// 	},
// 				// 	{
// 				// 		id: "2",
// 				// 		name: "Lieutenant Mike Wilson",
// 				// 		station: "North Police Station",
// 				// 		status: "available",
// 				// 	},
// 				// 	{
// 				// 		id: "3",
// 				// 		name: "Captain David Brown",
// 				// 		station: "South Police Station",
// 				// 		status: "busy",
// 				// 	},
// 				// 	{
// 				// 		id: "4",
// 				// 		name: "Lieutenant Emma Davis",
// 				// 		station: "East Police Station",
// 				// 		status: "available",
// 				// 	},
// 				// ];
// 				// setPoliceManagers(mockPoliceManagers);
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
// 			setLoading(true);
// 			const response = await apiService.get("/users/police-managers");
// 			console.log("Fetched alarms:", response);
// 			setPoliceManagers(response as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch alarms",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const handleInputChange = (field: string, value: string) => {
// 		setFormData((prev) => ({ ...prev, [field]: value }));
// 	};

// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		setError("");
// 		setIsSubmitting(true);

// 		try {
// 			const response = await apiClient.createAlarm({
// 				...formData,
// 				severity: "CRITICAL",
// 			});
// 			// Emit WebSocket event for real-time notification
// 			console.log("Alarm created:", response);
// 			console.log("WebSocket connected:", webSocketService.isConnected());
// 			if (webSocketService.isConnected()) {
// 				webSocketService.send({
// 					type: "alarm_created",
// 					alarm: response.alarm,
// 				});
// 			}
// 			setSubmitted(true);

// 			// Redirect after 3 seconds
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
// 		formData.severity &&
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

// 								{/* <div className="space-y-2">
// 									<Label htmlFor="severity">Severity Level *</Label>
// 									<Select
// 										value={formData.severity}
// 										onValueChange={(value) =>
// 											handleInputChange("severity", value)
// 										}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select severity level" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{severityLevels.map((level) => (
// 												<SelectItem key={level.value} value={level.value}>
// 													<div className="flex items-center space-x-2">
// 														<Badge className={level.color}>{level.label}</Badge>
// 													</div>
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div> */}

// 								<div className="space-y-2">
// 									<Label htmlFor="location">Specific Location</Label>
// 									<Input
// 										id="location"
// 										placeholder="e.g., Main Entrance, Server Room, Floor 2"
// 										value={formData.location}
// 										onChange={(e) =>
// 											handleInputChange("location", e.target.value)
// 										}
// 									/>
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
// 							</CardContent>
// 						</Card>
// 					</div>

// 					{/* Right Column */}
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
// 											{formData.severity && (
// 												<Badge
// 													className={
// 														severityLevels.find(
// 															(s) => s.value === formData.severity
// 														)?.color
// 													}>
// 													{
// 														severityLevels.find(
// 															(s) => s.value === formData.severity
// 														)?.label
// 													}
// 												</Badge>
// 											)}
// 										</span>
// 									</div>
// 									<div className="flex justify-between">
// 										<span className="text-muted-foreground">
// 											Estimated Response:
// 										</span>
// 										<span>
// 											{formData.severity === "CRITICAL"
// 												? "2-5 minutes"
// 												: formData.severity === "HIGH"
// 												? "5-10 minutes"
// 												: formData.severity === "MEDIUM"
// 												? "10-15 minutes"
// 												: "15-30 minutes"}
// 										</span>
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

// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import * as z from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { toast } from "sonner";

// import { apiService } from "@/lib/api-service";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import {
// 	Form,
// 	FormControl,
// 	FormField,
// 	FormItem,
// 	FormLabel,
// 	FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import { webSocketService } from "@/lib/websocket-service";

// const alarmFormSchema = z.object({
// 	name: z.string().min(2, {
// 		message: "Alarm name must be at least 2 characters.",
// 	}),
// 	severity: z.enum(["critical", "major", "minor", "warning", "info"]),
// 	threshold: z.number().optional(),
// 	metric: z.string().optional(),
// });

// const ConfigureAlarmPage = () => {
// 	const [submitting, setSubmitting] = useState(false);
// 	const router = useRouter();

// 	const form = useForm<z.infer<typeof alarmFormSchema>>({
// 		resolver: zodResolver(alarmFormSchema),
// 		defaultValues: {
// 			name: "",
// 			severity: "minor",
// 			threshold: undefined,
// 			metric: undefined,
// 		},
// 	});

// 	const createAlarm = async (alarmData: any) => {
// 		try {
// 			setSubmitting(true);
// 			const response = await apiService.post("/alarms", alarmData);

// 			// Emit WebSocket event for real-time notification
// 			if (webSocketService.isConnected()) {
// 				webSocketService.send({
// 					type: "alarm_created",
// 					alarm: response.data.alarm,
// 				});
// 			}

// 			toast({
// 				title: "Success",
// 				description: "Alarm created and dispatched successfully",
// 			} as any);

// 			router.push("/dashboard");
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description: error.response?.data?.message || "Failed to create alarm",
// 				variant: "destructive",
// 			} as any);
// 		} finally {
// 			setSubmitting(false);
// 		}
// 	};

// 	const onSubmit = async (values: z.infer<typeof alarmFormSchema>) => {
// 		await createAlarm(values);
// 	};

// 	return (
// 		<div className="container max-w-2xl">
// 			<div className="flex justify-between items-center">
// 				<h1 className="text-2xl font-bold">Configure Alarm</h1>
// 			</div>
// 			<Form {...form}>
// 				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
// 					<FormField
// 						control={form.control}
// 						name="name"
// 						render={({ field }) => (
// 							<FormItem>
// 								<FormLabel>Alarm Name</FormLabel>
// 								<FormControl>
// 									<Input placeholder="Enter alarm name" {...field} />
// 								</FormControl>
// 								<FormMessage />
// 							</FormItem>
// 						)}
// 					/>
// 					<FormField
// 						control={form.control}
// 						name="severity"
// 						render={({ field }) => (
// 							<FormItem>
// 								<FormLabel>Severity</FormLabel>
// 								<Select
// 									onValueChange={field.onChange}
// 									defaultValue={field.value}>
// 									<FormControl>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select a severity" />
// 										</SelectTrigger>
// 									</FormControl>
// 									<SelectContent>
// 										<SelectItem value="critical">Critical</SelectItem>
// 										<SelectItem value="major">Major</SelectItem>
// 										<SelectItem value="minor">Minor</SelectItem>
// 										<SelectItem value="warning">Warning</SelectItem>
// 										<SelectItem value="info">Info</SelectItem>
// 									</SelectContent>
// 								</Select>
// 								<FormMessage />
// 							</FormItem>
// 						)}
// 					/>
// 					<FormField
// 						control={form.control}
// 						name="threshold"
// 						render={({ field }) => (
// 							<FormItem>
// 								<FormLabel>Threshold</FormLabel>
// 								<FormControl>
// 									<Input
// 										type="number"
// 										placeholder="Enter threshold value"
// 										{...field}
// 									/>
// 								</FormControl>
// 								<FormMessage />
// 							</FormItem>
// 						)}
// 					/>
// 					<FormField
// 						control={form.control}
// 						name="metric"
// 						render={({ field }) => (
// 							<FormItem>
// 								<FormLabel>Metric</FormLabel>
// 								<FormControl>
// 									<Input
// 										type="text"
// 										placeholder="Enter metric name"
// 										{...field}
// 									/>
// 								</FormControl>
// 								<FormMessage />
// 							</FormItem>
// 						)}
// 					/>
// 					<Button
// 						type="submit"
// 						disabled={submitting}
// 						className={cn({
// 							"opacity-50 cursor-not-allowed": submitting,
// 						})}>
// 						{submitting ? "Creating..." : "Create Alarm"}
// 					</Button>
// 				</form>
// 			</Form>
// 		</div>
// 	);
// };

// export default ConfigureAlarmPage;
