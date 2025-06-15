"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import {
	AlertTriangle,
	MapPin,
	Users,
	Building,
	Loader2,
	Send,
	Shield,
	Radio,
	Crosshair,
	Phone,
	AlertCircle,
	Eye,
	Wifi,
	WifiOff,
	RefreshCw,
	Clock,
	Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Branch {
	id: string;
	name: string;
	locationType: string;
	city: string;
	subCity?: string;
	woreda?: string;
	managerName: string;
	phoneNumber: string;
	contactNumber1?: string;
	contactNumber2?: string;
	company: {
		id: string;
		name: string;
	};
}

interface PoliceManager {
	id: string;
	name: string;
	email: string;
	role: string;
	operatorType?: string;
}

interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	operatorType?: string;
	companyId?: string;
}

interface AlarmFormData {
	type: string;
	branchId: string;
	companyId?: string;
	location: string;
	longitude: string;
	latitude: string;
	severity: "CRITICAL";
	description: string;
	assignedToId: string;
}

export default function CreateAlarmPage() {
	const router = useRouter();
	const { toast } = useToast();
	const token =
		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

	// WebSocket connection with reconnection capability
	const { isConnected, connect, disconnect } = useWebSocket(token, {
		autoConnect: true,
	});

	// State management
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [policeManagers, setPoliceManagers] = useState<PoliceManager[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [locationLoading, setLocationLoading] = useState(false);
	const [reconnecting, setReconnecting] = useState(false);

	// Simplified form data - removed unnecessary fields
	const [formData, setFormData] = useState<AlarmFormData>({
		type: "ACTIVE BURGLARY ALERT", // Fixed value
		branchId: "",
		companyId: "",
		location: "",
		longitude: "",
		latitude: "",
		severity: "CRITICAL", // Fixed value
		description: "",
		assignedToId: "",
	});

	// Form validation
	const [errors, setErrors] = useState<Partial<AlarmFormData>>({});

	// Load initial data
	useEffect(() => {
		loadInitialData();
	}, []);

	const loadInitialData = async () => {
		try {
			setLoading(true);

			// Load current user
			const storedUser =
				typeof window !== "undefined"
					? localStorage.getItem("currentUser")
					: null;
			let user: User;
			if (storedUser) {
				user = JSON.parse(storedUser);
				setCurrentUser(user);
			} else {
				user = await apiClient.getCurrentUser();
				setCurrentUser(user);
			}

			// Load branches
			const branchesResponse = await apiClient.getBranches();
			setBranches(branchesResponse || []);

			// Load police managers
			const policeResponse = await apiClient.getPoliceManagerandOperator();
			setPoliceManagers(policeResponse.users || []);

			// Set company ID if user has one
			if (user.companyId) {
				setFormData((prev) => ({ ...prev, companyId: user.companyId }));
			}
		} catch (error) {
			console.error("Failed to load initial data:", error);
			toast({
				title: "Error",
				description: "Failed to load required data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Auto-reconnection function
	const attemptReconnection = async () => {
		if (isConnected) return true;

		setReconnecting(true);
		try {
			// Attempt to reconnect
			connect();

			// Wait a moment to see if connection establishes
			await new Promise((resolve) => setTimeout(resolve, 2000));

			if (isConnected) {
				toast({
					title: "Connection Restored",
					description: "Real-time dispatch connection established",
				});
				return true;
			} else {
				toast({
					title: "Connection Failed",
					description:
						"Unable to establish real-time connection. Alarm will still be created.",
					variant: "destructive",
				});
				return false;
			}
		} catch (error) {
			console.error("Reconnection failed:", error);
			return false;
		} finally {
			setReconnecting(false);
		}
	};

	// Get current location
	const getCurrentLocation = useCallback(async () => {
		if (!navigator.geolocation) {
			toast({
				title: "Error",
				description: "Geolocation is not supported by this browser",
				variant: "destructive",
			});
			return;
		}

		try {
			// Check permission status
			const permission = await navigator.permissions?.query({
				name: "geolocation" as PermissionName,
			});

			if (permission?.state === "denied") {
				toast({
					title: "Permission Denied",
					description:
						"Location access was denied. Please enable it in browser settings.",
					variant: "destructive",
				});
				return;
			}
		} catch (err) {
			console.warn("Permission API not available", err);
		}

		setLocationLoading(true);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				setFormData((prev) => ({
					...prev,
					latitude: latitude.toString(),
					longitude: longitude.toString(),
					location:
						prev.location || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
				}));
				toast({
					title: "Location Updated",
					description: "GPS coordinates have been captured",
				});
				setLocationLoading(false);
			},
			(error) => {
				console.error("Geolocation error:", error);
				toast({
					title: "Location Error",
					description: error.message || "Unable to get current location",
					variant: "destructive",
				});
				setLocationLoading(false);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 60000,
			}
		);
	}, [toast]);

	// const getCurrentLocation = useCallback(() => {
	// 	if (!navigator.geolocation) {
	// 		toast({
	// 			title: "Error",
	// 			description: "Geolocation is not supported by this browser",
	// 			variant: "destructive",
	// 		});
	// 		return;
	// 	}

	// 	setLocationLoading(true);
	// 	navigator.geolocation.getCurrentPosition(
	// 		(position) => {
	// 			const { latitude, longitude } = position.coords;
	// 			setFormData((prev) => ({
	// 				...prev,
	// 				latitude: latitude.toString(),
	// 				longitude: longitude.toString(),
	// 				location:
	// 					prev.location || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
	// 			}));
	// 			setLocationLoading(false);
	// 			toast({
	// 				title: "Location Updated",
	// 				description: "GPS coordinates have been captured",
	// 			});
	// 		},
	// 		(error) => {
	// 			console.error("Geolocation error:", error);
	// 			setLocationLoading(false);
	// 			toast({
	// 				title: "Location Error",
	// 				description: "Unable to get current location",
	// 				variant: "destructive",
	// 			});
	// 		},
	// 		{
	// 			enableHighAccuracy: true,
	// 			timeout: 10000,
	// 			maximumAge: 60000,
	// 		}
	// 	);
	// }, [toast]);

	// Handle form field changes
	const handleInputChange = (field: keyof AlarmFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	// Validate form
	const validateForm = (): boolean => {
		const newErrors: Partial<AlarmFormData> = {};

		if (!formData.branchId) newErrors.branchId = "Branch selection is required";
		if (!formData.description.trim())
			newErrors.description = "Description is required";
		if (!formData.assignedToId)
			newErrors.assignedToId = "Police assignment is required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Submit form with auto-reconnection
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			toast({
				title: "Validation Error",
				description: "Please fill in all required fields",
				variant: "destructive",
			});
			return;
		}

		try {
			setSubmitting(true);

			// Attempt reconnection if not connected
			if (!isConnected) {
				toast({
					title: "Reconnecting...",
					description: "Establishing real-time connection before dispatch",
				});
				await attemptReconnection();
			}

			const response = await apiClient.createAlarm(formData);

			toast({
				title: "🚨 ACTIVE BURGLARY ALARM DISPATCHED!",
				description: "Critical alarm sent to police personnel immediately",
				duration: 5000,
			});

			// Reset form
			setFormData({
				type: "ACTIVE BURGLARY",
				branchId: "",
				companyId: currentUser?.companyId || "",
				location: "",
				longitude: "",
				latitude: "",
				severity: "CRITICAL",
				description: "",
				assignedToId: "",
			});

			// Redirect after success
			setTimeout(() => {
				router.push("/dashboard/alarms");
			}, 2000);
		} catch (error: any) {
			console.error("Failed to create alarm:", error);
			toast({
				title: "Dispatch Failed",
				description: error.message || "Failed to create alarm",
				variant: "destructive",
			});
		} finally {
			setSubmitting(false);
		}
	};

	// Get selected branch details
	const selectedBranch = branches.find((b) => b.id === formData.branchId);
	const selectedPolice = policeManagers.find(
		(p) => p.id === formData.assignedToId
	);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
				<div className="max-w-4xl mx-auto space-y-6">
					<div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
						<div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			<div className="max-w-5xl mx-auto p-6 space-y-6">
				{/* Enhanced Connection Status */}
				<div className="flex justify-center">
					<Badge
						className={cn(
							"px-4 py-2 text-sm font-medium transition-all duration-300",
							isConnected
								? "bg-green-600/20 text-green-400 border-green-500/30 animate-pulse"
								: "bg-red-600/20 text-red-400 border-red-500/30",
							reconnecting && "animate-spin"
						)}
						variant="outline">
						{reconnecting ? (
							<>
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								Reconnecting...
							</>
						) : isConnected ? (
							<>
								<Wifi className="h-4 w-4 mr-2" />
								🟢 REAL-TIME DISPATCH READY
							</>
						) : (
							<>
								<WifiOff className="h-4 w-4 mr-2" />
								🔴 OFFLINE - Will attempt reconnection
							</>
						)}
					</Badge>
				</div>

				{/* Simplified Header */}
				<div className="text-center space-y-4">
					{/* <div className="flex justify-center">
						<div className="p-6 bg-red-600/20 rounded-2xl border border-red-500/30">
							<AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
						</div>
					</div> */}
					<div>
						<h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
							Real-Time Response Link
						</h1>
						{/* <p className="text-slate-400 text-xl mt-2">
							Critical Emergency Dispatch System
						</p> */}
						{currentUser && (
							<p className="text-slate-500 text-sm mt-2">
								Operator: {currentUser.name} ({currentUser.role}
								{currentUser.operatorType && ` - ${currentUser.operatorType}`})
							</p>
						)}
					</div>
				</div>

				<form
					onSubmit={handleSubmit}
					className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Form - Simplified */}
					<div className="lg:col-span-2 space-y-6">
						{/* Fixed Alarm Type Display */}
						<Card className="bg-red-900/10 border-red-500/30">
							<CardContent className="p-6">
								<div className="flex items-center justify-center space-x-4">
									<div className="p-4 bg-red-600/20 rounded-xl">
										<span className="text-4xl">🏠</span>
									</div>
									<div className="text-center">
										<h3 className="text-2xl font-bold text-white">
											ACTIVE BURGLARY ALARM
										</h3>
										{/* <Badge className="bg-red-600 text-white text-lg px-4 py-1 mt-2">
											CRITICAL PRIORITY
										</Badge> */}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Location Selection */}
						<Card className="bg-slate-900/50 border-slate-700">
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<MapPin className="h-5 w-5 text-blue-400" />
									<span>Location Details</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label htmlFor="branch" className="text-slate-300 text-lg">
										Select Location *
									</Label>
									<Select
										value={formData.branchId}
										onValueChange={(value) =>
											handleInputChange("branchId", value)
										}>
										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2 h-12">
											<SelectValue placeholder="Choose the branch location" />
										</SelectTrigger>
										<SelectContent className="bg-slate-800 border-slate-600">
											{branches.map((branch) => (
												<SelectItem key={branch.id} value={branch.id}>
													<div className="flex items-center space-x-2">
														<Building className="h-4 w-4" />
														<span>
															{branch.name} - {branch.city}
														</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.branchId && (
										<p className="text-red-400 text-sm mt-1">
											{errors.branchId}
										</p>
									)}
								</div>

								<div>
									<Label htmlFor="location" className="text-slate-300">
										Sub City (Optional)
									</Label>
									<Input
										id="location"
										value={formData.location}
										onChange={(e) =>
											handleInputChange("location", e.target.value)
										}
										placeholder="e.g., Main entrance, 2nd floor, parking area..."
										className="bg-slate-800 border-slate-600 text-white mt-2 h-12"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<Label htmlFor="latitude" className="text-slate-300">
											Latitude
										</Label>
										<Input
											id="latitude"
											value={formData.latitude}
											onChange={(e) =>
												handleInputChange("latitude", e.target.value)
											}
											placeholder="9.0192"
											className="bg-slate-800 border-slate-600 text-white mt-2"
										/>
									</div>
									<div>
										<Label htmlFor="longitude" className="text-slate-300">
											Longitude
										</Label>
										<Input
											id="longitude"
											value={formData.longitude}
											onChange={(e) =>
												handleInputChange("longitude", e.target.value)
											}
											placeholder="38.7525"
											className="bg-slate-800 border-slate-600 text-white mt-2"
										/>
									</div>
									<div className="flex items-end">
										<Button
											type="button"
											variant="outline"
											onClick={getCurrentLocation}
											disabled={locationLoading}
											className="w-full border-slate-600 bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 h-10">
											{locationLoading ? (
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Crosshair className="h-4 w-4 mr-2" />
											)}
											Get GPS
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Incident Description */}
						<Card className="bg-slate-900/50 border-slate-700">
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<AlertCircle className="h-5 w-5 text-orange-400" />
									<span>Incident Description</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div>
									<Label
										htmlFor="description"
										className="text-slate-300 text-lg">
										Describe the burglary incident *
									</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											handleInputChange("description", e.target.value)
										}
										placeholder="Provide detailed description of the burglary incident, what was observed, any suspects, etc..."
										className="bg-slate-800 border-slate-600 text-white mt-2 min-h-[120px]"
										rows={5}
									/>
									{errors.description && (
										<p className="text-red-400 text-sm mt-1">
											{errors.description}
										</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Police Assignment */}
						<Card className="bg-slate-900/50 border-slate-700">
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Shield className="h-5 w-5 text-green-400" />
									<span>Police Assignment</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div>
									<Label
										htmlFor="assignedTo"
										className="text-slate-300 text-lg">
										Assign to Police Personnel *
									</Label>
									<Select
										value={formData.assignedToId}
										onValueChange={(value) =>
											handleInputChange("assignedToId", value)
										}>
										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2 h-12">
											<SelectValue placeholder="Select police officer or manager" />
										</SelectTrigger>
										<SelectContent className="bg-slate-800 border-slate-600">
											{policeManagers.map((manager) => (
												<SelectItem key={manager.id} value={manager.id}>
													<div className="flex items-center space-x-2">
														<Users className="h-4 w-4" />
														<span>
															{manager.name} - {manager.role}
															{manager.operatorType &&
																` (${manager.operatorType})`}
														</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.assignedToId && (
										<p className="text-red-400 text-sm mt-1">
											{errors.assignedToId}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Enhanced Preview & Actions Sidebar */}
					<div className="space-y-6">
						{/* Live Alarm Preview */}
						<Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Eye className="h-5 w-5 text-purple-400" />
									<span>Preview</span>
									{/* <Badge className="bg-cyan-600 text-white animate-pulse">
										LIVE
									</Badge> */}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Alarm Type Preview */}
								<div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-500/30">
									<div className="text-3xl mb-2">🏠</div>
									<h3 className="text-white font-bold">BURGLARY ALARM</h3>
									<Badge className="bg-red-600 text-white mt-2">CRITICAL</Badge>
								</div>

								{/* Location Preview */}
								{selectedBranch && (
									<div className="p-3 bg-slate-800 rounded-lg">
										<div className="flex items-center space-x-2 mb-2">
											<Building className="h-4 w-4 text-blue-400" />
											<span className="font-medium text-white">
												{selectedBranch.name}
											</span>
										</div>
										<p className="text-sm text-slate-400">
											{selectedBranch.city}
											{selectedBranch.subCity && `, ${selectedBranch.subCity}`}
										</p>
										<div className="flex items-center space-x-2 mt-2">
											<Phone className="h-3 w-3 text-slate-500" />
											<span className="text-xs text-slate-500">
												{selectedBranch.phoneNumber}
											</span>
										</div>
									</div>
								)}

								{/* Assigned Officer Preview */}
								{selectedPolice && (
									<div className="p-3 bg-slate-800 rounded-lg">
										<div className="flex items-center space-x-2 mb-1">
											<Shield className="h-4 w-4 text-green-400" />
											<span className="font-medium text-white">
												Assigned Officer
											</span>
										</div>
										<p className="text-sm text-slate-300">
											{selectedPolice.name}
										</p>
										<p className="text-xs text-slate-500">
											{selectedPolice.role}
											{selectedPolice.operatorType &&
												` (${selectedPolice.operatorType})`}
										</p>
									</div>
								)}

								{/* Description Preview */}
								{formData.description && (
									<div className="p-3 bg-slate-800 rounded-lg">
										<p className="text-sm text-slate-400 mb-1">Incident:</p>
										<p className="text-white text-sm">
											{formData.description.substring(0, 100)}...
										</p>
									</div>
								)}

								{/* GPS Coordinates */}
								{(formData.latitude || formData.longitude) && (
									<div className="p-3 bg-slate-800 rounded-lg">
										<div className="flex items-center space-x-2 mb-1">
											<MapPin className="h-4 w-4 text-purple-400" />
											<span className="text-sm text-slate-400">
												GPS Location
											</span>
										</div>
										<p className="text-xs text-slate-300 font-mono">
											{formData.latitude && `Lat: ${formData.latitude}`}
											{formData.latitude && formData.longitude && " | "}
											{formData.longitude && `Lng: ${formData.longitude}`}
										</p>
									</div>
								)}

								<Separator className="bg-slate-700" />

								{/* Dispatch Status */}
								<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
									<Clock className="h-4 w-4" />
									<span>Ready for immediate dispatch</span>
								</div>
							</CardContent>
						</Card>

						{/* Dispatch Button */}
						<Card className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-red-500/40">
							<CardContent className="p-6 space-y-4">
								<Button
									type="submit"
									disabled={submitting || reconnecting}
									className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-xl transition-all duration-300 transform hover:scale-105">
									{submitting ? (
										<>
											<Loader2 className="h-6 w-6 mr-3 animate-spin" />
											DISPATCHING...
										</>
									) : (
										<>
											<Send className="h-6 w-6 mr-3" />
											DISPATCH ALARM
										</>
									)}
								</Button>

								<div className="text-center space-y-2">
									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
										<Radio className="h-4 w-4" />
										<span>Instant police notification</span>
									</div>
									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
										<Zap className="h-4 w-4" />
										<span>Critical priority dispatch</span>
									</div>
								</div>

								<Button
									type="button"
									variant="outline"
									onClick={() => router.back()}
									className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
									Cancel
								</Button>
							</CardContent>
						</Card>

						{/* Quick Guidelines */}
						<Card className="bg-blue-900/20 border-blue-500/30">
							<CardHeader>
								<CardTitle className="flex items-center space-x-2 text-blue-400">
									<AlertCircle className="h-5 w-5" />
									<span>Quick Guidelines</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm text-blue-200">
								<p>• Provide accurate location details</p>
								<p>• Describe what you observed clearly</p>
								<p>• GPS coordinates improve response time</p>
								<p>• Alarm dispatches immediately</p>
							</CardContent>
						</Card>
					</div>
				</form>
			</div>
		</div>
	);
}

// "use client";

// import type React from "react";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import { apiClient } from "@/lib/api";
// import { useWebSocket } from "@/hooks/use-websocket";
// import {
// 	AlertTriangle,
// 	MapPin,
// 	Users,
// 	Building,
// 	Loader2,
// 	Send,
// 	Target,
// 	Clock,
// 	Shield,
// 	Radio,
// 	Crosshair,
// 	Phone,
// 	CheckCircle,
// 	AlertCircle,
// 	Zap,
// 	Eye,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface Branch {
// 	id: string;
// 	name: string;
// 	locationType: string;
// 	city: string;
// 	subCity?: string;
// 	woreda?: string;
// 	managerName: string;
// 	phoneNumber: string;
// 	contactNumber1?: string;
// 	contactNumber2?: string;
// 	company: {
// 		id: string;
// 		name: string;
// 	};
// }

// interface PoliceManager {
// 	id: string;
// 	name: string;
// 	email: string;
// 	role: string;
// 	operatorType?: string;
// }

// interface User {
// 	id: string;
// 	name: string;
// 	email: string;
// 	role: string;
// 	operatorType?: string;
// 	companyId?: string;
// }

// interface AlarmFormData {
// 	type: string;
// 	branchId: string;
// 	companyId?: string;
// 	location: string;
// 	longitude: string;
// 	latitude: string;
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	additionalNotes: string;
// 	assignedToId: string;
// }

// const ALARM_TYPES = [
// 	{
// 		value: "BREAK_IN",
// 		label: "Burglary",
// 		icon: "🏠",
// 		severity: "CRITICAL",
// 	},
// ];

// const SEVERITY_LEVELS = [
// 	{
// 		value: "CRITICAL",
// 		label: "Critical Priority",
// 		color: "bg-red-600",
// 		description: "Immediate response required",
// 	},
// ];

// export default function CreateAlarmPage() {
// 	const router = useRouter();
// 	const { toast } = useToast();
// 	const token = localStorage.getItem("authToken");
// 	const { isConnected } = useWebSocket(token, {
// 		autoConnect: true,
// 	});

// 	// State management
// 	const [currentUser, setCurrentUser] = useState<User | null>(null);
// 	const [branches, setBranches] = useState<Branch[]>([]);
// 	const [policeManagers, setPoliceManagers] = useState<PoliceManager[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [submitting, setSubmitting] = useState(false);
// 	const [locationLoading, setLocationLoading] = useState(false);

// 	// Form data
// 	const [formData, setFormData] = useState<AlarmFormData>({
// 		type: "",
// 		branchId: "",
// 		companyId: "",
// 		location: "",
// 		longitude: "",
// 		latitude: "",
// 		severity: "CRITICAL",
// 		description: "",
// 		additionalNotes: "",
// 		assignedToId: "",
// 	});

// 	// Form validation
// 	const [errors, setErrors] = useState<Partial<AlarmFormData>>({});

// 	// Load initial data
// 	useEffect(() => {
// 		loadInitialData();
// 	}, []);

// 	const loadInitialData = async () => {
// 		try {
// 			setLoading(true);

// 			// Load current user
// 			const storedUser = localStorage.getItem("currentUser");
// 			let user: User;
// 			if (storedUser) {
// 				user = JSON.parse(storedUser);
// 				setCurrentUser(user);
// 			} else {
// 				user = await apiClient.getCurrentUser();
// 				setCurrentUser(user);
// 			}

// 			// Load branches based on user role
// 			const branchesResponse = await apiClient.getBranches();
// 			setBranches(branchesResponse || []);

// 			// Load police managers
// 			const policeResponse = await apiClient.getPoliceManagerandOperator();
// 			setPoliceManagers(policeResponse.users || []);

// 			// Set company ID if user has one
// 			if (user.companyId) {
// 				setFormData((prev) => ({ ...prev, companyId: user.companyId }));
// 			}
// 		} catch (error) {
// 			console.error("Failed to load initial data:", error);
// 			toast({
// 				title: "Error",
// 				description: "Failed to load required data",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	// Get current location
// 	const getCurrentLocation = useCallback(() => {
// 		if (!navigator.geolocation) {
// 			toast({
// 				title: "Error",
// 				description: "Geolocation is not supported by this browser",
// 				variant: "destructive",
// 			});
// 			return;
// 		}

// 		setLocationLoading(true);
// 		navigator.geolocation.getCurrentPosition(
// 			(position) => {
// 				const { latitude, longitude } = position.coords;
// 				setFormData((prev) => ({
// 					...prev,
// 					latitude: latitude.toString(),
// 					longitude: longitude.toString(),
// 					location:
// 						prev.location || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
// 				}));
// 				setLocationLoading(false);
// 				toast({
// 					title: "Location Updated",
// 					description: "GPS coordinates have been captured",
// 				});
// 			},
// 			(error) => {
// 				console.error("Geolocation error:", error);
// 				setLocationLoading(false);
// 				toast({
// 					title: "Location Error",
// 					description: "Unable to get current location",
// 					variant: "destructive",
// 				});
// 			},
// 			{
// 				enableHighAccuracy: true,
// 				timeout: 10000,
// 				maximumAge: 60000,
// 			}
// 		);
// 	}, [toast]);

// 	// Handle form field changes
// 	const handleInputChange = (field: keyof AlarmFormData, value: string) => {
// 		setFormData((prev) => ({ ...prev, [field]: value }));
// 		// Clear error when user starts typing
// 		if (errors[field]) {
// 			setErrors((prev) => ({ ...prev, [field]: undefined }));
// 		}
// 	};

// 	// Handle alarm type selection
// 	const handleAlarmTypeChange = (type: string) => {
// 		const alarmType = ALARM_TYPES.find((t) => t.value === type);
// 		setFormData((prev) => ({
// 			...prev,
// 			type,
// 			severity: (alarmType?.severity as AlarmFormData["severity"]) || "MEDIUM",
// 		}));
// 		if (errors.type) {
// 			setErrors((prev) => ({ ...prev, type: undefined }));
// 		}
// 	};

// 	// Validate form
// 	const validateForm = (): boolean => {
// 		const newErrors: Partial<AlarmFormData> = {};

// 		if (!formData.type) newErrors.type = "Alarm type is required";
// 		if (!formData.branchId) newErrors.branchId = "Branch selection is required";
// 		if (!formData.description.trim())
// 			newErrors.description = "Description is required";
// 		if (!formData.assignedToId)
// 			newErrors.assignedToId = "Police assignment is required";

// 		setErrors(newErrors);
// 		return Object.keys(newErrors).length === 0;
// 	};

// 	// Submit form
// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();

// 		if (!validateForm()) {
// 			toast({
// 				title: "Validation Error",
// 				description: "Please fill in all required fields",
// 				variant: "destructive",
// 			});
// 			return;
// 		}

// 		try {
// 			setSubmitting(true);

// 			const response = await apiClient.createAlarm(formData);

// 			toast({
// 				title: "🚨 Alarm Created Successfully!",
// 				description: "Alarm has been dispatched to police personnel",
// 				duration: 5000,
// 			});

// 			// Reset form
// 			setFormData({
// 				type: "",
// 				branchId: "",
// 				companyId: currentUser?.companyId || "",
// 				location: "",
// 				longitude: "",
// 				latitude: "",
// 				severity: "CRITICAL",
// 				description: "",
// 				additionalNotes: "",
// 				assignedToId: "",
// 			});

// 			// Redirect to alarms list or dashboard
// 			setTimeout(() => {
// 				router.push("/dashboard/alarms");
// 			}, 2000);
// 		} catch (error: any) {
// 			console.error("Failed to create alarm:", error);
// 			toast({
// 				title: "Error",
// 				description: error.message || "Failed to create alarm",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setSubmitting(false);
// 		}
// 	};

// 	// Get selected branch details
// 	const selectedBranch = branches.find((b) => b.id === formData.branchId);
// 	const selectedAlarmType = ALARM_TYPES.find((t) => t.value === formData.type);
// 	const selectedSeverity = SEVERITY_LEVELS.find(
// 		(s) => s.value === formData.severity
// 	);

// 	if (loading) {
// 		return (
// 			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
// 				<div className="max-w-4xl mx-auto space-y-6">
// 					<div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
// 					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// 						<div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
// 						<div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
// 			<div className="max-w-6xl mx-auto p-6 space-y-6">
// 				{/* Connection Status */}
// 				<div className={isConnected ? "text-green-400" : "text-red-400"}>
// 					{isConnected ? "✅ Real-time dispatch ready" : "❌ Offline"}
// 				</div>

// 				{/* Header */}
// 				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
// 					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
// 					<div className="relative flex items-center justify-between">
// 						<div className="flex items-center space-x-4">
// 							<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
// 								<AlertTriangle className="h-8 w-8 text-red-400" />
// 							</div>
// 							<div>
// 								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
// 									CREATE EMERGENCY ALARM
// 								</h1>
// 								<p className="text-slate-400 font-mono text-lg mt-2">
// 									Dispatch immediate alert to police personnel
// 								</p>
// 								{currentUser && (
// 									<p className="text-slate-500 font-mono text-sm mt-1">
// 										Creating as: {currentUser.name} ({currentUser.role}
// 										{currentUser.operatorType &&
// 											` - ${currentUser.operatorType}`}
// 										)
// 									</p>
// 								)}
// 							</div>
// 						</div>
// 						<div className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 rounded-lg border border-red-500/30">
// 							<Radio className="h-4 w-4 text-red-400 animate-pulse" />
// 							<span className="text-red-400 font-mono text-sm">
// 								LIVE DISPATCH READY
// 							</span>
// 						</div>
// 					</div>
// 				</div>

// 				<form
// 					onSubmit={handleSubmit}
// 					className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// 					{/* Main Form */}
// 					<div className="lg:col-span-2 space-y-6">
// 						{/* Alarm Type Selection */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Zap className="h-5 w-5 text-yellow-400" />
// 									<span>Alarm Type</span>
// 									<Badge variant="destructive">Required</Badge>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
// 									{ALARM_TYPES.map((type) => (
// 										<button
// 											key={type.value}
// 											type="button"
// 											onClick={() => handleAlarmTypeChange(type.value)}
// 											className={cn(
// 												"p-4 rounded-lg border-2 transition-all duration-200 text-left",
// 												formData.type === type.value
// 													? "border-red-500 bg-red-500/20 text-white"
// 													: "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
// 											)}>
// 											<div className="flex items-center space-x-3">
// 												<span className="text-2xl">{type.icon}</span>
// 												<div>
// 													<p className="font-medium">{type.label}</p>
// 													<p className="text-sm opacity-70">
// 														Default: {type.severity}
// 													</p>
// 												</div>
// 											</div>
// 										</button>
// 									))}
// 								</div>
// 								{errors.type && (
// 									<p className="text-red-400 text-sm">{errors.type}</p>
// 								)}
// 							</CardContent>
// 						</Card>

// 						{/* Location & Branch */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<MapPin className="h-5 w-5 text-blue-400" />
// 									<span>Location Details</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div>
// 									<Label htmlFor="branch" className="text-slate-300">
// 										Branch / Location{" "}
// 										<Badge variant="destructive" className="ml-2">
// 											Required
// 										</Badge>
// 									</Label>
// 									<Select
// 										value={formData.branchId}
// 										onValueChange={(value) =>
// 											handleInputChange("branchId", value)
// 										}>
// 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2">
// 											<SelectValue placeholder="Select branch or location" />
// 										</SelectTrigger>
// 										<SelectContent className="bg-slate-800 border-slate-600">
// 											{branches.map((branch) => (
// 												<SelectItem key={branch.id} value={branch.id}>
// 													<div className="flex items-center space-x-2">
// 														<Building className="h-4 w-4" />
// 														<span>
// 															{branch.name} - {branch.city}
// 														</span>
// 													</div>
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 									{errors.branchId && (
// 										<p className="text-red-400 text-sm mt-1">
// 											{errors.branchId}
// 										</p>
// 									)}
// 								</div>

// 								<div>
// 									<Label htmlFor="location" className="text-slate-300">
// 										Specific Location / Address
// 									</Label>
// 									<Input
// 										id="location"
// 										value={formData.location}
// 										onChange={(e) =>
// 											handleInputChange("location", e.target.value)
// 										}
// 										placeholder="e.g., Main entrance, 2nd floor office, parking lot..."
// 										className="bg-slate-800 border-slate-600 text-white mt-2"
// 									/>
// 								</div>

// 								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// 									<div>
// 										<Label htmlFor="latitude" className="text-slate-300">
// 											Latitude
// 										</Label>
// 										<Input
// 											id="latitude"
// 											value={formData.latitude}
// 											onChange={(e) =>
// 												handleInputChange("latitude", e.target.value)
// 											}
// 											placeholder="9.0192"
// 											className="bg-slate-800 border-slate-600 text-white mt-2"
// 										/>
// 									</div>
// 									<div>
// 										<Label htmlFor="longitude" className="text-slate-300">
// 											Longitude
// 										</Label>
// 										<Input
// 											id="longitude"
// 											value={formData.longitude}
// 											onChange={(e) =>
// 												handleInputChange("longitude", e.target.value)
// 											}
// 											placeholder="38.7525"
// 											className="bg-slate-800 border-slate-600 text-white mt-2"
// 										/>
// 									</div>
// 									<div className="flex items-end">
// 										<Button
// 											type="button"
// 											variant="outline"
// 											onClick={getCurrentLocation}
// 											disabled={locationLoading}
// 											className="w-full border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
// 											{locationLoading ? (
// 												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 											) : (
// 												<Crosshair className="h-4 w-4 mr-2" />
// 											)}
// 											Get GPS
// 										</Button>
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Severity & Description */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Target className="h-5 w-5 text-orange-400" />
// 									<span>Alarm Details</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div>
// 									<Label className="text-slate-300">Priority Level</Label>
// 									<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
// 										{SEVERITY_LEVELS.map((level) => (
// 											<button
// 												key={level.value}
// 												type="button"
// 												onClick={() =>
// 													handleInputChange("severity", level.value)
// 												}
// 												className={cn(
// 													"p-3 rounded-lg border-2 transition-all duration-200 text-center",
// 													formData.severity === level.value
// 														? `border-white ${level.color} text-white`
// 														: "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500"
// 												)}>
// 												<p className="font-medium text-sm">{level.label}</p>
// 											</button>
// 										))}
// 									</div>
// 									{selectedSeverity && (
// 										<p className="text-slate-400 text-sm mt-2">
// 											{selectedSeverity.description}
// 										</p>
// 									)}
// 								</div>

// 								<div>
// 									<Label htmlFor="description" className="text-slate-300">
// 										Incident Description{" "}
// 										<Badge variant="destructive" className="ml-2">
// 											Required
// 										</Badge>
// 									</Label>
// 									<Textarea
// 										id="description"
// 										value={formData.description}
// 										onChange={(e) =>
// 											handleInputChange("description", e.target.value)
// 										}
// 										placeholder="Provide detailed description of the emergency situation..."
// 										className="bg-slate-800 border-slate-600 text-white mt-2"
// 										rows={4}
// 									/>
// 									{errors.description && (
// 										<p className="text-red-400 text-sm mt-1">
// 											{errors.description}
// 										</p>
// 									)}
// 								</div>

// 								<div>
// 									<Label htmlFor="additionalNotes" className="text-slate-300">
// 										Additional Notes
// 									</Label>
// 									<Textarea
// 										id="additionalNotes"
// 										value={formData.additionalNotes}
// 										onChange={(e) =>
// 											handleInputChange("additionalNotes", e.target.value)
// 										}
// 										placeholder="Any additional information, witness details, or special instructions..."
// 										className="bg-slate-800 border-slate-600 text-white mt-2"
// 										rows={3}
// 									/>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Police Assignment */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Shield className="h-5 w-5 text-green-400" />
// 									<span>Police Assignment</span>
// 									<Badge variant="destructive">Required</Badge>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div>
// 									<Label htmlFor="assignedTo" className="text-slate-300">
// 										Assign to Police Personnel
// 									</Label>
// 									<Select
// 										value={formData.assignedToId}
// 										onValueChange={(value) =>
// 											handleInputChange("assignedToId", value)
// 										}>
// 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2">
// 											<SelectValue placeholder="Select police manager or operator" />
// 										</SelectTrigger>
// 										<SelectContent className="bg-slate-800 border-slate-600">
// 											{policeManagers.map((manager) => (
// 												<SelectItem key={manager.id} value={manager.id}>
// 													<div className="flex items-center space-x-2">
// 														<Users className="h-4 w-4" />
// 														<span>
// 															{manager.name} - {manager.role}
// 															{manager.operatorType &&
// 																` (${manager.operatorType})`}
// 														</span>
// 													</div>
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 									{errors.assignedToId && (
// 										<p className="text-red-400 text-sm mt-1">
// 											{errors.assignedToId}
// 										</p>
// 									)}
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</div>

// 					{/* Sidebar - Preview & Actions */}
// 					<div className="space-y-6">
// 						{/* Alarm Preview */}
// 						<Card className="bg-slate-900/50 border-slate-700 sticky top-6">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Eye className="h-5 w-5 text-purple-400" />
// 									<span>Alarm Preview</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								{selectedAlarmType && (
// 									<div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
// 										<span className="text-2xl">{selectedAlarmType.icon}</span>
// 										<div>
// 											<p className="font-medium text-white">
// 												{selectedAlarmType.label}
// 											</p>
// 											<p className="text-sm text-slate-400">Emergency Type</p>
// 										</div>
// 									</div>
// 								)}

// 								{selectedSeverity && (
// 									<div className="flex items-center space-x-3">
// 										<Badge className={selectedSeverity.color}>
// 											{selectedSeverity.label}
// 										</Badge>
// 										<span className="text-sm text-slate-400">
// 											Priority Level
// 										</span>
// 									</div>
// 								)}

// 								{selectedBranch && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<div className="flex items-center space-x-2 mb-2">
// 											<Building className="h-4 w-4 text-blue-400" />
// 											<span className="font-medium text-white">
// 												{selectedBranch.name}
// 											</span>
// 										</div>
// 										<p className="text-sm text-slate-400">
// 											{selectedBranch.city}, {selectedBranch.subCity}
// 										</p>
// 										<div className="flex items-center space-x-2 mt-2">
// 											<Phone className="h-3 w-3 text-slate-500" />
// 											<span className="text-xs text-slate-500">
// 												{selectedBranch.phoneNumber}
// 											</span>
// 										</div>
// 									</div>
// 								)}

// 								{formData.description && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<p className="text-sm text-slate-400 mb-1">Description:</p>
// 										<p className="text-white text-sm">{formData.description}</p>
// 									</div>
// 								)}

// 								<Separator className="bg-slate-700" />

// 								<div className="flex items-center space-x-2 text-sm text-slate-400">
// 									<Clock className="h-4 w-4" />
// 									<span>Will be dispatched immediately</span>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Action Buttons */}
// 						<Card className="bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/30">
// 							<CardContent className="p-6 space-y-4">
// 								<Button
// 									type="submit"
// 									disabled={submitting}
// 									className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg">
// 									{submitting ? (
// 										<>
// 											<Loader2 className="h-5 w-5 mr-2 animate-spin" />
// 											Dispatching Alarm...
// 										</>
// 									) : (
// 										<>
// 											<Send className="h-5 w-5 mr-2" />
// 											DISPATCH EMERGENCY ALARM
// 										</>
// 									)}
// 								</Button>

// 								<div className="text-center space-y-2">
// 									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// 										<Radio className="h-4 w-4" />
// 										<span>Real-time dispatch to police</span>
// 									</div>
// 									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// 										<CheckCircle className="h-4 w-4" />
// 										<span>Immediate notification system</span>
// 									</div>
// 								</div>

// 								<Button
// 									type="button"
// 									variant="outline"
// 									onClick={() => router.back()}
// 									className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
// 									Cancel
// 								</Button>
// 							</CardContent>
// 						</Card>

// 						{/* Help Information */}
// 						<Card className="bg-blue-900/20 border-blue-500/30">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2 text-blue-400">
// 									<AlertCircle className="h-5 w-5" />
// 									<span>Emergency Guidelines</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-3 text-sm text-blue-200">
// 								<p>• Provide accurate and detailed information</p>
// 								<p>• Use CRITICAL priority for life-threatening situations</p>
// 								<p>• Include specific location details when possible</p>
// 								<p>• GPS coordinates help with faster response</p>
// 								<p>• Alarm will be dispatched immediately upon submission</p>
// 							</CardContent>
// 						</Card>
// 					</div>
// 				</form>
// 			</div>
// 		</div>
// 	);
// }

// // "use client";

// // import type React from "react";

// // import { useState, useEffect, useCallback } from "react";
// // import { useRouter } from "next/navigation";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Textarea } from "@/components/ui/textarea";
// // import {
// // 	Select,
// // 	SelectContent,
// // 	SelectItem,
// // 	SelectTrigger,
// // 	SelectValue,
// // } from "@/components/ui/select";
// // import { Badge } from "@/components/ui/badge";
// // import { Separator } from "@/components/ui/separator";
// // import { useToast } from "@/hooks/use-toast";
// // import { apiClient } from "@/lib/api";
// // import { useWebSocket } from "@/hooks/use-websocket";
// // import {
// // 	AlertTriangle,
// // 	MapPin,
// // 	Users,
// // 	Building,
// // 	Loader2,
// // 	Send,
// // 	Target,
// // 	Clock,
// // 	Shield,
// // 	Radio,
// // 	Crosshair,
// // 	Phone,
// // 	CheckCircle,
// // 	AlertCircle,
// // 	Zap,
// // 	Eye,
// // } from "lucide-react";
// // import { cn } from "@/lib/utils";
// // import { apiService } from "@/lib/api-service";

// // interface Branch {
// // 	id: string;
// // 	name: string;
// // 	locationType: string;
// // 	city: string;
// // 	subCity?: string;
// // 	woreda?: string;
// // 	managerName: string;
// // 	phoneNumber: string;
// // 	contactNumber1?: string;
// // 	contactNumber2?: string;
// // 	company: {
// // 		id: string;
// // 		name: string;
// // 	};
// // }

// // interface PoliceManager {
// // 	id: string;
// // 	name: string;
// // 	email: string;
// // 	role: string;
// // 	operatorType?: string;
// // }

// // interface User {
// // 	id: string;
// // 	name: string;
// // 	email: string;
// // 	role: string;
// // 	operatorType?: string;
// // 	companyId?: string;
// // }

// // interface AlarmFormData {
// // 	type: string;
// // 	branchId: string;
// // 	companyId?: string;
// // 	location: string;
// // 	longitude: string;
// // 	latitude: string;
// // 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// // 	description: string;
// // 	additionalNotes: string;
// // 	assignedToId: string;
// // }

// // const ALARM_TYPES = [
// // 	{
// // 		value: "BREAK_IN",
// // 		label: "Break-in / Burglary",
// // 		icon: "🏠",
// // 		severity: "HIGH",
// // 	},

// // 	{
// // 		value: "ROBBERY",
// // 		label: "Armed Robbery",
// // 		icon: "💰",
// // 		severity: "CRITICAL",
// // 	},
// // 	// {
// // 	// 	value: "ASSAULT",
// // 	// 	label: "Assault / Violence",
// // 	// 	icon: "⚔️",
// // 	// 	severity: "HIGH",
// // 	// },
// // 	// {
// // 	// 	value: "VANDALISM",
// // 	// 	label: "Vandalism / Property Damage",
// // 	// 	icon: "🔨",
// // 	// 	severity: "MEDIUM",
// // 	// },
// // 	// {
// // 	// 	value: "SUSPICIOUS",
// // 	// 	label: "Suspicious Activity",
// // 	// 	icon: "👁️",
// // 	// 	severity: "MEDIUM",
// // 	// },
// // 	// {
// // 	// 	value: "THEFT",
// // 	// 	label: "Theft / Shoplifting",
// // 	// 	icon: "🛍️",
// // 	// 	severity: "MEDIUM",
// // 	// },
// // 	// {
// // 	// 	value: "PANIC",
// // 	// 	label: "Panic Button Activated",
// // 	// 	icon: "🚨",
// // 	// 	severity: "CRITICAL",
// // 	// },
// // 	// {
// // 	// 	value: "TECHNICAL",
// // 	// 	label: "Technical / System Issue",
// // 	// 	icon: "⚙️",
// // 	// 	severity: "LOW",
// // 	// },
// // 	{ value: "OTHER", label: "Other Emergency", icon: "❗", severity: "MEDIUM" },
// // ];

// // const SEVERITY_LEVELS = [
// // 	// {
// // 	// 	value: "LOW",
// // 	// 	label: "Low Priority",
// // 	// 	color: "bg-blue-600",
// // 	// 	description: "Non-urgent, routine response",
// // 	// },
// // 	// {
// // 	// 	value: "MEDIUM",
// // 	// 	label: "Medium Priority",
// // 	// 	color: "bg-yellow-600",
// // 	// 	description: "Standard response required",
// // 	// },
// // 	// {
// // 	// 	value: "HIGH",
// // 	// 	label: "High Priority",
// // 	// 	color: "bg-orange-600",
// // 	// 	description: "Urgent response needed",
// // 	// },
// // 	{
// // 		value: "CRITICAL",
// // 		label: "Critical Priority",
// // 		color: "bg-red-600",
// // 		description: "Immediate response required",
// // 	},
// // ];

// // export default function CreateAlarmPage() {
// // 	const router = useRouter();
// // 	const { toast } = useToast();
// // 	const token = localStorage.getItem("authToken");
// // 	const { isConnected } = useWebSocket(token, {
// // 		autoConnect: true,
// // 	});

// // 	// State management
// // 	const [currentUser, setCurrentUser] = useState<User | null>(null);
// // 	const [branches, setBranches] = useState<Branch[]>([]);
// // 	const [policeManagers, setPoliceManagers] = useState<PoliceManager[]>([]);
// // 	const [loading, setLoading] = useState(true);
// // 	const [submitting, setSubmitting] = useState(false);
// // 	const [locationLoading, setLocationLoading] = useState(false);

// // 	// Form data
// // 	const [formData, setFormData] = useState<AlarmFormData>({
// // 		type: "",
// // 		branchId: "",
// // 		companyId: "",
// // 		location: "",
// // 		longitude: "",
// // 		latitude: "",
// // 		severity: "MEDIUM",
// // 		description: "",
// // 		additionalNotes: "",
// // 		assignedToId: "",
// // 	});

// // 	// Form validation
// // 	const [errors, setErrors] = useState<Partial<AlarmFormData>>({});

// // 	// Load initial data
// // 	useEffect(() => {
// // 		loadInitialData();
// // 	}, []);

// // 	const loadInitialData = async () => {
// // 		try {
// // 			setLoading(true);

// // 			// Load current user
// // 			const storedUser = localStorage.getItem("currentUser");
// // 			let user: User;
// // 			if (storedUser) {
// // 				user = JSON.parse(storedUser);
// // 				setCurrentUser(user);
// // 			} else {
// // 				user = await apiClient.getCurrentUser();
// // 				setCurrentUser(user);
// // 			}

// // 			// Load branches based on user role
// // 			const branchesResponse = await apiClient.getBranches();
// // 			setBranches(branchesResponse || []);

// // 			// Load police managers
// // 			const response = await apiService.get("/users/police-managers");
// // 			setPoliceManagers(response as any);
// // 			// const policeResponse = await apiClient.get(
// // 			// 	"/users?role=POLICE_MANAGER,OPERATOR&operatorType=POLICE"
// // 			// );
// // 			// setPoliceManagers(policeResponse.users || []);

// // 			// Set company ID if user has one
// // 			if (user.companyId) {
// // 				setFormData((prev) => ({ ...prev, companyId: user.companyId }));
// // 			}
// // 		} catch (error) {
// // 			console.error("Failed to load initial data:", error);
// // 			toast({
// // 				title: "Error",
// // 				description: "Failed to load required data",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setLoading(false);
// // 		}
// // 	};

// // 	// Get current location
// // 	const getCurrentLocation = useCallback(() => {
// // 		if (!navigator.geolocation) {
// // 			toast({
// // 				title: "Error",
// // 				description: "Geolocation is not supported by this browser",
// // 				variant: "destructive",
// // 			});
// // 			return;
// // 		}

// // 		setLocationLoading(true);
// // 		navigator.geolocation.getCurrentPosition(
// // 			(position) => {
// // 				const { latitude, longitude } = position.coords;
// // 				setFormData((prev) => ({
// // 					...prev,
// // 					latitude: latitude.toString(),
// // 					longitude: longitude.toString(),
// // 					location:
// // 						prev.location || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
// // 				}));
// // 				setLocationLoading(false);
// // 				toast({
// // 					title: "Location Updated",
// // 					description: "GPS coordinates have been captured",
// // 				});
// // 			},
// // 			(error) => {
// // 				console.error("Geolocation error:", error);
// // 				setLocationLoading(false);
// // 				toast({
// // 					title: "Location Error",
// // 					description: "Unable to get current location",
// // 					variant: "destructive",
// // 				});
// // 			},
// // 			{
// // 				enableHighAccuracy: true,
// // 				timeout: 10000,
// // 				maximumAge: 60000,
// // 			}
// // 		);
// // 	}, [toast]);

// // 	// Handle form field changes
// // 	const handleInputChange = (field: keyof AlarmFormData, value: string) => {
// // 		setFormData((prev) => ({ ...prev, [field]: value }));
// // 		// Clear error when user starts typing
// // 		if (errors[field]) {
// // 			setErrors((prev) => ({ ...prev, [field]: undefined }));
// // 		}
// // 	};

// // 	// Handle alarm type selection
// // 	const handleAlarmTypeChange = (type: string) => {
// // 		const alarmType = ALARM_TYPES.find((t) => t.value === type);
// // 		setFormData((prev) => ({
// // 			...prev,
// // 			type,
// // 			severity: (alarmType?.severity as AlarmFormData["severity"]) || "MEDIUM",
// // 		}));
// // 		if (errors.type) {
// // 			setErrors((prev) => ({ ...prev, type: undefined }));
// // 		}
// // 	};

// // 	// Validate form
// // 	const validateForm = (): boolean => {
// // 		const newErrors: Partial<AlarmFormData> = {};

// // 		if (!formData.type) newErrors.type = "Alarm type is required";
// // 		if (!formData.branchId) newErrors.branchId = "Branch selection is required";
// // 		if (!formData.description.trim())
// // 			newErrors.description = "Description is required";
// // 		if (!formData.assignedToId)
// // 			newErrors.assignedToId = "Police assignment is required";

// // 		setErrors(newErrors);
// // 		return Object.keys(newErrors).length === 0;
// // 	};

// // 	// Submit form
// // 	const handleSubmit = async (e: React.FormEvent) => {
// // 		e.preventDefault();

// // 		if (!validateForm()) {
// // 			toast({
// // 				title: "Validation Error",
// // 				description: "Please fill in all required fields",
// // 				variant: "destructive",
// // 			});
// // 			return;
// // 		}

// // 		try {
// // 			setSubmitting(true);

// // 			const response = await apiClient.createAlarm(formData);

// // 			toast({
// // 				title: "🚨 Alarm Created Successfully!",
// // 				description: "Alarm has been dispatched to police personnel",
// // 				duration: 5000,
// // 			});

// // 			// Reset form
// // 			setFormData({
// // 				type: "",
// // 				branchId: "",
// // 				companyId: currentUser?.companyId || "",
// // 				location: "",
// // 				longitude: "",
// // 				latitude: "",
// // 				severity: "MEDIUM",
// // 				description: "",
// // 				additionalNotes: "",
// // 				assignedToId: "",
// // 			});

// // 			// Redirect to alarms list or dashboard
// // 			setTimeout(() => {
// // 				router.push("/alarms");
// // 			}, 2000);
// // 		} catch (error: any) {
// // 			console.error("Failed to create alarm:", error);
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to create alarm",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setSubmitting(false);
// // 		}
// // 	};

// // 	// Get selected branch details
// // 	const selectedBranch = branches.find((b) => b.id === formData.branchId);
// // 	const selectedAlarmType = ALARM_TYPES.find((t) => t.value === formData.type);
// // 	const selectedSeverity = SEVERITY_LEVELS.find(
// // 		(s) => s.value === formData.severity
// // 	);

// // 	if (loading) {
// // 		return (
// // 			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
// // 				<div className="max-w-4xl mx-auto space-y-6">
// // 					<div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
// // 					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// // 						<div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
// // 						<div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
// // 					</div>
// // 				</div>
// // 			</div>
// // 		);
// // 	}

// // 	return (
// // 		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
// // 			<div className="max-w-6xl mx-auto p-6 space-y-6">
// // 				{/* Connection Status */}
// // 				<div className={isConnected ? "text-green-400" : "text-red-400"}>
// // 					{isConnected ? "✅ Real-time dispatch ready" : "❌ Offline"}
// // 				</div>

// // 				{/* Header */}
// // 				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
// // 					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
// // 					<div className="relative flex items-center justify-between">
// // 						<div className="flex items-center space-x-4">
// // 							<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
// // 								<AlertTriangle className="h-8 w-8 text-red-400" />
// // 							</div>
// // 							<div>
// // 								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
// // 									CREATE EMERGENCY ALARM
// // 								</h1>
// // 								<p className="text-slate-400 font-mono text-lg mt-2">
// // 									Dispatch immediate alert to police personnel
// // 								</p>
// // 								{currentUser && (
// // 									<p className="text-slate-500 font-mono text-sm mt-1">
// // 										Creating as: {currentUser.name} ({currentUser.role}
// // 										{currentUser.operatorType &&
// // 											` - ${currentUser.operatorType}`}
// // 										)
// // 									</p>
// // 								)}
// // 							</div>
// // 						</div>
// // 						<div className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 rounded-lg border border-red-500/30">
// // 							<Radio className="h-4 w-4 text-red-400 animate-pulse" />
// // 							<span className="text-red-400 font-mono text-sm">
// // 								LIVE DISPATCH READY
// // 							</span>
// // 						</div>
// // 					</div>
// // 				</div>

// // 				<form
// // 					onSubmit={handleSubmit}
// // 					className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// // 					{/* Main Form */}
// // 					<div className="lg:col-span-2 space-y-6">
// // 						{/* Alarm Type Selection */}
// // 						<Card className="bg-slate-900/50 border-slate-700">
// // 							<CardHeader>
// // 								<CardTitle className="flex items-center space-x-2">
// // 									<Zap className="h-5 w-5 text-yellow-400" />
// // 									<span>Alarm Type</span>
// // 									<Badge variant="destructive">Required</Badge>
// // 								</CardTitle>
// // 							</CardHeader>
// // 							<CardContent className="space-y-4">
// // 								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
// // 									{ALARM_TYPES.map((type) => (
// // 										<button
// // 											key={type.value}
// // 											type="button"
// // 											onClick={() => handleAlarmTypeChange(type.value)}
// // 											className={cn(
// // 												"p-4 rounded-lg border-2 transition-all duration-200 text-left",
// // 												formData.type === type.value
// // 													? "border-red-500 bg-red-500/20 text-white"
// // 													: "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
// // 											)}>
// // 											<div className="flex items-center space-x-3">
// // 												<span className="text-2xl">{type.icon}</span>
// // 												<div>
// // 													<p className="font-medium">{type.label}</p>
// // 													<p className="text-sm opacity-70">
// // 														Default: {type.severity}
// // 													</p>
// // 												</div>
// // 											</div>
// // 										</button>
// // 									))}
// // 								</div>
// // 								{errors.type && (
// // 									<p className="text-red-400 text-sm">{errors.type}</p>
// // 								)}
// // 							</CardContent>
// // 						</Card>

// // 						{/* Location & Branch */}
// // 						<Card className="bg-slate-900/50 border-slate-700">
// // 							<CardHeader>
// // 								<CardTitle className="flex items-center space-x-2">
// // 									<MapPin className="h-5 w-5 text-blue-400" />
// // 									<span>Location Details</span>
// // 								</CardTitle>
// // 							</CardHeader>
// // 							<CardContent className="space-y-4">
// // 								<div>
// // 									<Label htmlFor="branch" className="text-slate-300">
// // 										Branch / Location{" "}
// // 										<Badge variant="destructive" className="ml-2">
// // 											Required
// // 										</Badge>
// // 									</Label>
// // 									<Select
// // 										value={formData.branchId}
// // 										onValueChange={(value) =>
// // 											handleInputChange("branchId", value)
// // 										}>
// // 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2">
// // 											<SelectValue placeholder="Select branch or location" />
// // 										</SelectTrigger>
// // 										<SelectContent className="bg-slate-800 border-slate-600">
// // 											{branches.map((branch) => (
// // 												<SelectItem key={branch.id} value={branch.id}>
// // 													<div className="flex items-center space-x-2">
// // 														<Building className="h-4 w-4" />
// // 														<span>
// // 															{branch.name} - {branch.city}
// // 														</span>
// // 													</div>
// // 												</SelectItem>
// // 											))}
// // 										</SelectContent>
// // 									</Select>
// // 									{errors.branchId && (
// // 										<p className="text-red-400 text-sm mt-1">
// // 											{errors.branchId}
// // 										</p>
// // 									)}
// // 								</div>

// // 								<div>
// // 									<Label htmlFor="location" className="text-slate-300">
// // 										Specific Location / Address
// // 									</Label>
// // 									<Input
// // 										id="location"
// // 										value={formData.location}
// // 										onChange={(e) =>
// // 											handleInputChange("location", e.target.value)
// // 										}
// // 										placeholder="e.g., Main entrance, 2nd floor office, parking lot..."
// // 										className="bg-slate-800 border-slate-600 text-white mt-2"
// // 									/>
// // 								</div>

// // 								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// // 									<div>
// // 										<Label htmlFor="latitude" className="text-slate-300">
// // 											Latitude
// // 										</Label>
// // 										<Input
// // 											id="latitude"
// // 											value={formData.latitude}
// // 											onChange={(e) =>
// // 												handleInputChange("latitude", e.target.value)
// // 											}
// // 											placeholder="9.0192"
// // 											className="bg-slate-800 border-slate-600 text-white mt-2"
// // 										/>
// // 									</div>
// // 									<div>
// // 										<Label htmlFor="longitude" className="text-slate-300">
// // 											Longitude
// // 										</Label>
// // 										<Input
// // 											id="longitude"
// // 											value={formData.longitude}
// // 											onChange={(e) =>
// // 												handleInputChange("longitude", e.target.value)
// // 											}
// // 											placeholder="38.7525"
// // 											className="bg-slate-800 border-slate-600 text-white mt-2"
// // 										/>
// // 									</div>
// // 									<div className="flex items-end">
// // 										<Button
// // 											type="button"
// // 											variant="outline"
// // 											onClick={getCurrentLocation}
// // 											disabled={locationLoading}
// // 											className="w-full border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
// // 											{locationLoading ? (
// // 												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 											) : (
// // 												<Crosshair className="h-4 w-4 mr-2" />
// // 											)}
// // 											Get GPS
// // 										</Button>
// // 									</div>
// // 								</div>
// // 							</CardContent>
// // 						</Card>

// // 						{/* Severity & Description */}
// // 						<Card className="bg-slate-900/50 border-slate-700">
// // 							<CardHeader>
// // 								<CardTitle className="flex items-center space-x-2">
// // 									<Target className="h-5 w-5 text-orange-400" />
// // 									<span>Alarm Details</span>
// // 								</CardTitle>
// // 							</CardHeader>
// // 							<CardContent className="space-y-4">
// // 								<div>
// // 									<Label className="text-slate-300">Priority Level</Label>
// // 									<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
// // 										{SEVERITY_LEVELS.map((level) => (
// // 											<button
// // 												key={level.value}
// // 												type="button"
// // 												onClick={() =>
// // 													handleInputChange("severity", level.value)
// // 												}
// // 												className={cn(
// // 													"p-3 rounded-lg border-2 transition-all duration-200 text-center",
// // 													formData.severity === level.value
// // 														? `border-white ${level.color} text-white`
// // 														: "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500"
// // 												)}>
// // 												<p className="font-medium text-sm">{level.label}</p>
// // 											</button>
// // 										))}
// // 									</div>
// // 									{selectedSeverity && (
// // 										<p className="text-slate-400 text-sm mt-2">
// // 											{selectedSeverity.description}
// // 										</p>
// // 									)}
// // 								</div>

// // 								<div>
// // 									<Label htmlFor="description" className="text-slate-300">
// // 										Incident Description{" "}
// // 										<Badge variant="destructive" className="ml-2">
// // 											Required
// // 										</Badge>
// // 									</Label>
// // 									<Textarea
// // 										id="description"
// // 										value={formData.description}
// // 										onChange={(e) =>
// // 											handleInputChange("description", e.target.value)
// // 										}
// // 										placeholder="Provide detailed description of the emergency situation..."
// // 										className="bg-slate-800 border-slate-600 text-white mt-2"
// // 										rows={4}
// // 									/>
// // 									{errors.description && (
// // 										<p className="text-red-400 text-sm mt-1">
// // 											{errors.description}
// // 										</p>
// // 									)}
// // 								</div>

// // 								<div>
// // 									<Label htmlFor="additionalNotes" className="text-slate-300">
// // 										Additional Notes
// // 									</Label>
// // 									<Textarea
// // 										id="additionalNotes"
// // 										value={formData.additionalNotes}
// // 										onChange={(e) =>
// // 											handleInputChange("additionalNotes", e.target.value)
// // 										}
// // 										placeholder="Any additional information, witness details, or special instructions..."
// // 										className="bg-slate-800 border-slate-600 text-white mt-2"
// // 										rows={3}
// // 									/>
// // 								</div>
// // 							</CardContent>
// // 						</Card>

// // 						{/* Police Assignment */}
// // 						<Card className="bg-slate-900/50 border-slate-700">
// // 							<CardHeader>
// // 								<CardTitle className="flex items-center space-x-2">
// // 									<Shield className="h-5 w-5 text-green-400" />
// // 									<span>Police Assignment</span>
// // 									<Badge variant="destructive">Required</Badge>
// // 								</CardTitle>
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div>
// // 									<Label htmlFor="assignedTo" className="text-slate-300">
// // 										Assign to Police Personnel
// // 									</Label>
// // 									<Select
// // 										value={formData.assignedToId}
// // 										onValueChange={(value) =>
// // 											handleInputChange("assignedToId", value)
// // 										}>
// // 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2">
// // 											<SelectValue placeholder="Select police manager or operator" />
// // 										</SelectTrigger>
// // 										<SelectContent className="bg-slate-800 border-slate-600">
// // 											{policeManagers.map((manager) => (
// // 												<SelectItem key={manager.id} value={manager.id}>
// // 													<div className="flex items-center space-x-2">
// // 														<Users className="h-4 w-4" />
// // 														<span>
// // 															{manager.name} - {manager.role}
// // 															{manager.operatorType &&
// // 																` (${manager.operatorType})`}
// // 														</span>
// // 													</div>
// // 												</SelectItem>
// // 											))}
// // 										</SelectContent>
// // 									</Select>
// // 									{errors.assignedToId && (
// // 										<p className="text-red-400 text-sm mt-1">
// // 											{errors.assignedToId}
// // 										</p>
// // 									)}
// // 								</div>
// // 							</CardContent>
// // 						</Card>
// // 					</div>

// // 					{/* Sidebar - Preview & Actions */}
// // 					<div className="space-y-6">
// // 						{/* Alarm Preview */}
// // 						<Card className="bg-slate-900/50 border-slate-700 sticky top-6">
// // 							<CardHeader>
// // 								<CardTitle className="flex items-center space-x-2">
// // 									<Eye className="h-5 w-5 text-purple-400" />
// // 									<span>Alarm Preview</span>
// // 								</CardTitle>
// // 							</CardHeader>
// // 							<CardContent className="space-y-4">
// // 								{selectedAlarmType && (
// // 									<div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
// // 										<span className="text-2xl">{selectedAlarmType.icon}</span>
// // 										<div>
// // 											<p className="font-medium text-white">
// // 												{selectedAlarmType.label}
// // 											</p>
// // 											<p className="text-sm text-slate-400">Emergency Type</p>
// // 										</div>
// // 									</div>
// // 								)}

// // 								{selectedSeverity && (
// // 									<div className="flex items-center space-x-3">
// // 										<Badge className={selectedSeverity.color}>
// // 											{selectedSeverity.label}
// // 										</Badge>
// // 										<span className="text-sm text-slate-400">
// // 											Priority Level
// // 										</span>
// // 									</div>
// // 								)}

// // 								{selectedBranch && (
// // 									<div className="p-3 bg-slate-800 rounded-lg">
// // 										<div className="flex items-center space-x-2 mb-2">
// // 											<Building className="h-4 w-4 text-blue-400" />
// // 											<span className="font-medium text-white">
// // 												{selectedBranch.name}
// // 											</span>
// // 										</div>
// // 										<p className="text-sm text-slate-400">
// // 											{selectedBranch.city}, {selectedBranch.subCity}
// // 										</p>
// // 										<div className="flex items-center space-x-2 mt-2">
// // 											<Phone className="h-3 w-3 text-slate-500" />
// // 											<span className="text-xs text-slate-500">
// // 												{selectedBranch.phoneNumber}
// // 											</span>
// // 										</div>
// // 									</div>
// // 								)}

// // 								{formData.description && (
// // 									<div className="p-3 bg-slate-800 rounded-lg">
// // 										<p className="text-sm text-slate-400 mb-1">Description:</p>
// // 										<p className="text-white text-sm">{formData.description}</p>
// // 									</div>
// // 								)}

// // 								<Separator className="bg-slate-700" />

// // 								<div className="flex items-center space-x-2 text-sm text-slate-400">
// // 									<Clock className="h-4 w-4" />
// // 									<span>Will be dispatched immediately</span>
// // 								</div>
// // 							</CardContent>
// // 						</Card>

// // 						{/* Action Buttons */}
// // 						<Card className="bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/30">
// // 							<CardContent className="p-6 space-y-4">
// // 								<Button
// // 									type="submit"
// // 									disabled={submitting}
// // 									className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg">
// // 									{submitting ? (
// // 										<>
// // 											<Loader2 className="h-5 w-5 mr-2 animate-spin" />
// // 											Dispatching Alarm...
// // 										</>
// // 									) : (
// // 										<>
// // 											<Send className="h-5 w-5 mr-2" />
// // 											DISPATCH EMERGENCY ALARM
// // 										</>
// // 									)}
// // 								</Button>

// // 								<div className="text-center space-y-2">
// // 									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// // 										<Radio className="h-4 w-4" />
// // 										<span>Real-time dispatch to police</span>
// // 									</div>
// // 									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// // 										<CheckCircle className="h-4 w-4" />
// // 										<span>Immediate notification system</span>
// // 									</div>
// // 								</div>

// // 								<Button
// // 									type="button"
// // 									variant="outline"
// // 									onClick={() => router.back()}
// // 									className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
// // 									Cancel
// // 								</Button>
// // 							</CardContent>
// // 						</Card>

// // 						{/* Help Information */}
// // 						<Card className="bg-blue-900/20 border-blue-500/30">
// // 							<CardHeader>
// // 								<CardTitle className="flex items-center space-x-2 text-blue-400">
// // 									<AlertCircle className="h-5 w-5" />
// // 									<span>Emergency Guidelines</span>
// // 								</CardTitle>
// // 							</CardHeader>
// // 							<CardContent className="space-y-3 text-sm text-blue-200">
// // 								<p>• Provide accurate and detailed information</p>
// // 								<p>• Use CRITICAL priority for life-threatening situations</p>
// // 								<p>• Include specific location details when possible</p>
// // 								<p>• GPS coordinates help with faster response</p>
// // 								<p>• Alarm will be dispatched immediately upon submission</p>
// // 							</CardContent>
// // 						</Card>
// // 					</div>
// // 				</form>
// // 			</div>
// // 		</div>
// // 	);
// // }

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
// // import { webSocketService } from "@/lib/websocket-service";
// import { useWebSocket } from "@/hooks/use-websocket";
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
// 	const token = localStorage.getItem("authToken");
// 	const { isConnected } = useWebSocket(token, {
// 		autoConnect: true,
// 	});

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

// 	// SMS Report states
// 	const [smsPhoneNumber, setSmsPhoneNumber] = useState("");
// 	const [smsError, setSmsError] = useState("");
// 	const [smsSuccess, setSmsSuccess] = useState(false);

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

// 	// Isolated SMS sending function that runs in background
// 	const sendSmsReportInBackground = async (
// 		alarmData: any,
// 		phoneNumber: string
// 	) => {
// 		if (!phoneNumber.trim()) return;

// 		// Reset SMS states
// 		setSmsError("");
// 		setSmsSuccess(false);

// 		try {
// 			const smsMessage = `🚨 ALARM REPORT 🚨
// Type: ${alarmData.type}
// Location: ${alarmData.location}
// Description: ${alarmData.description}
// Time: ${new Date().toLocaleString()}
// Priority: CRITICAL
// Status: DISPATCHED

// This is an automated security alert.`;

// 			// Send SMS in background - don't await this
// 			fetch("http://94.130.27.32:3001/send-sms", {
// 				method: "POST",
// 				headers: {
// 					"Content-Type": "application/json",
// 				},
// 				body: JSON.stringify({
// 					to: phoneNumber.replace(/\D/g, ""), // Remove non-digits
// 					message: smsMessage,
// 					callback: `${window.location.origin}/api/sms-status`,
// 				}),
// 			})
// 				.then(async (response) => {
// 					if (!response.ok) {
// 						throw new Error(`SMS API error: ${response.status}`);
// 					}
// 					const result = await response.json();
// 					setSmsSuccess(true);

// 					toast({
// 						title: "SMS Report Sent",
// 						description: `Alarm report sent to ${phoneNumber}`,
// 					});
// 				})
// 				.catch((error) => {
// 					console.error("SMS sending error:", error);
// 					setSmsError(error.message || "Failed to send SMS report");

// 					toast({
// 						title: "SMS Error",
// 						description:
// 							"Failed to send SMS report, but alarm was created successfully",
// 						variant: "destructive",
// 					});
// 				});
// 		} catch (error: any) {
// 			console.error("SMS preparation error:", error);
// 			setSmsError("Failed to prepare SMS message");
// 		}
// 	};

// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		setError("");
// 		setIsSubmitting(true);

// 		try {
// 			const alarmPayload = {
// 				...formData,
// 				severity: "CRITICAL",
// 				coordinates:
// 					formData.latitude && formData.longitude
// 						? { latitude: formData.latitude, longitude: formData.longitude }
// 						: undefined,
// 			};

// 			// Submit the alarm form first
// 			const response = await apiClient.createAlarm(alarmPayload);

// 			console.log("Alarm created:", response);

// 			// Send WebSocket notification
// 			// if (webSocketService.isConnected()) {
// 			// 	webSocketService.send({
// 			// 		type: "alarm_created",
// 			// 		alarm: response.alarm,
// 			// 	});
// 			// }

// 			// Mark form as submitted
// 			setSubmitted(true);

// 			// Send SMS in background AFTER successful alarm creation
// 			if (smsPhoneNumber.trim()) {
// 				sendSmsReportInBackground(alarmPayload, smsPhoneNumber);
// 			}

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

// 							{/* SMS Status Display */}
// 							{smsPhoneNumber && (
// 								<div className="mt-4 space-y-2">
// 									{smsSuccess && (
// 										<div className="p-3 bg-green-50 rounded-lg border border-green-200">
// 											<p className="text-xs text-green-700 flex items-center justify-center">
// 												<CheckCircle className="h-3 w-3 mr-1" />
// 												📨 SMS report sent to {smsPhoneNumber}
// 											</p>
// 										</div>
// 									)}

// 									{smsError && (
// 										<div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
// 											<p className="text-xs text-yellow-700 flex items-center justify-center">
// 												<AlertTriangle className="h-3 w-3 mr-1" />
// 												⚠️ Alarm created but SMS failed to send
// 											</p>
// 										</div>
// 									)}

// 									{!smsSuccess && !smsError && (
// 										<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
// 											<p className="text-xs text-blue-700 flex items-center justify-center">
// 												<Loader2 className="h-3 w-3 mr-1 animate-spin" />
// 												📱 Sending SMS report to {smsPhoneNumber}...
// 											</p>
// 										</div>
// 									)}
// 								</div>
// 							)}

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
// 			<div className={isConnected ? "text-green-400" : "text-red-400"}>
// 				{isConnected ? "✅ Real-time dispatch ready" : "❌ Offline"}
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
// 														placeholder="Search for any location (e.g., Bole subcity, Yeka, Addis Ababa...)"
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
// 																			variant="outline"
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
// 					{/* <Button type="button" variant="outline" disabled={isSubmitting}>
// 						Save as Draft
// 					</Button> */}
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

//--------------------------------------
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
