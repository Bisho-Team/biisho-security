"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
	MapPin,
	Users,
	Building,
	Loader2,
	Send,
	Shield,
	Radio,
	Phone,
	AlertCircle,
	Eye,
	Wifi,
	WifiOff,
	RefreshCw,
	Clock,
	Search,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PoliceStatusCard } from "@/components/police-status-card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

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

	// Add state for connection status tracking
	const [connectionStatusData, setConnectionStatusData] = useState<any>(null);

	// WebSocket connection with reconnection capability
	const { isConnected, connect, disconnect } = useWebSocket(token, {
		autoConnect: true,
		onConnectionStatusUpdate: (data) => {
			console.log("📊 Received connection status update:", data);
			setConnectionStatusData(data);

			// Update the police status card
			if ((window as any).updatePoliceStatus) {
				(window as any).updatePoliceStatus(data);
			}
		},
		onConnectionEstablished: (userInfo) => {
			console.log("🎉 Connection established:", userInfo);
			toast({
				title: "Connected",
				description: "Real-time connection established",
			});
		},
		onError: (error) => {
			console.error("❌ WebSocket error:", error);
			toast({
				title: "Connection Error",
				description: "WebSocket connection failed",
				variant: "destructive",
			});
		},
		onClose: (event) => {
			console.log("🔌 WebSocket closed:", event);
			if (event.code !== 1000) {
				toast({
					title: "Connection Lost",
					description: "Attempting to reconnect...",
					variant: "destructive",
				});
			}
		},
	});

	// State management
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [policeManagers, setPoliceManagers] = useState<PoliceManager[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [locationLoading, setLocationLoading] = useState(false);
	const [reconnecting, setReconnecting] = useState(false);

	// NEW: State for branch search functionality
	const [branchSearchOpen, setBranchSearchOpen] = useState(false);
	const [branchSearchValue, setBranchSearchValue] = useState("");

	// Simplified form data - removed unnecessary fields
	const [formData, setFormData] = useState<AlarmFormData>({
		type: "BURGLARY", // Fixed value
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

			console.log({
				policeResponse,
			});
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

	// Enhanced auto-reconnection function with better error handling
	const attemptReconnection = async () => {
		if (isConnected) return true;

		setReconnecting(true);
		try {
			console.log("🔄 Attempting WebSocket reconnection...");

			// Force reconnect if WebSocket client supports it
			if ((window as any).wsClient && (window as any).wsClient.forceReconnect) {
				(window as any).wsClient.forceReconnect();
			} else {
				disconnect();
				await new Promise((resolve) => setTimeout(resolve, 1000));
				connect();
			}

			// Wait longer for connection to establish
			await new Promise((resolve) => setTimeout(resolve, 3000));

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
			toast({
				title: "Reconnection Error",
				description:
					"Failed to reconnect. Please refresh the page if issues persist.",
				variant: "destructive",
			});
			return false;
		} finally {
			setReconnecting(false);
		}
	};

	// Add periodic connection health check
	useEffect(() => {
		const healthCheckInterval = setInterval(() => {
			if (!isConnected && !reconnecting) {
				console.log("🔍 Connection health check: Attempting reconnection...");
				attemptReconnection();
			}
		}, 30000); // Check every 30 seconds

		return () => clearInterval(healthCheckInterval);
	}, [isConnected, reconnecting]);

	// Get current location
	const getCurrentLocation = useCallback(() => {
		if (!navigator.geolocation) {
			toast({
				title: "Error",
				description: "Geolocation is not supported by this browser",
				variant: "destructive",
			});
			return;
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
				setLocationLoading(false);
				toast({
					title: "Location Updated",
					description: "GPS coordinates have been captured",
				});
			},
			(error) => {
				console.error("Geolocation error:", error);
				setLocationLoading(false);
				toast({
					title: "Location Error",
					description: "Unable to get current location",
					variant: "destructive",
				});
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 60000,
			}
		);
	}, [toast]);

	// Handle form field changes
	const handleInputChange = (field: keyof AlarmFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	// NEW: Handle branch selection with search
	const handleBranchSelect = (branchId: string) => {
		handleInputChange("branchId", branchId);
		setBranchSearchOpen(false);
		setBranchSearchValue("");
	};

	// NEW: Get selected branch display text
	const getSelectedBranchText = () => {
		const selectedBranch = branches.find((b) => b.id === formData.branchId);
		return selectedBranch
			? `${selectedBranch.name} - ${selectedBranch.city}`
			: "Choose the branch location";
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
				title: "🚨 BURGLARY ALARM DISPATCHED!",
				description: "Critical alarm sent to police personnel immediately",
				duration: 5000,
			});

			// Reset form
			setFormData({
				type: "BURGLARY",
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
			<div className="max-w-7xl mx-auto p-6 space-y-6">
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
					<div className="flex justify-center">
						{/* <div className="p-6 bg-red-600/20 rounded-2xl border border-red-500/30">
							<AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
						</div> */}
					</div>
					<div>
						{/* <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
							BURGLARY ALARM
						</h1>
						<p className="text-slate-400 text-xl mt-2">
							Critical Emergency Dispatch System
						</p> */}
						{currentUser && (
							<p className="text-slate-500 text-sm">
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
									<div className="text-center">
										<h3 className="text-2xl font-bold text-white">
											BURGLARY ALARM
										</h3>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Location Selection - ENHANCED WITH SEARCH */}
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
										Select Branch *
									</Label>
									<Popover
										open={branchSearchOpen}
										onOpenChange={setBranchSearchOpen}>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={branchSearchOpen}
												className="w-full justify-between bg-slate-800 border-slate-600 text-white mt-2 h-12 hover:bg-slate-700">
												<div className="flex items-center space-x-2">
													<Building className="h-4 w-4" />
													<span
														className={cn(
															formData.branchId
																? "text-white"
																: "text-slate-400"
														)}>
														{getSelectedBranchText()}
													</span>
												</div>
												<div className="flex items-center space-x-2">
													<Search className="h-4 w-4 text-slate-400" />
													{branchSearchOpen ? (
														<X className="h-4 w-4 text-slate-400" />
													) : (
														<span className="text-slate-400">▼</span>
													)}
												</div>
											</Button>
										</PopoverTrigger>
										<PopoverContent
											className="w-full p-0 bg-slate-800 border-slate-600"
											align="start">
											<Command className="bg-slate-800">
												<CommandInput
													placeholder="Search branches..."
													value={branchSearchValue}
													onValueChange={setBranchSearchValue}
													className="bg-slate-800 border-none text-white placeholder:text-slate-400"
												/>
												<CommandList className="max-h-[300px] overflow-y-auto">
													<CommandEmpty className="text-slate-400 text-center py-6">
														No branches found.
													</CommandEmpty>
													<CommandGroup>
														{branches
															.filter(
																(branch) =>
																	branch.name
																		.toLowerCase()
																		.includes(
																			branchSearchValue.toLowerCase()
																		) ||
																	branch.city
																		.toLowerCase()
																		.includes(
																			branchSearchValue.toLowerCase()
																		) ||
																	(branch.subCity &&
																		branch.subCity
																			.toLowerCase()
																			.includes(
																				branchSearchValue.toLowerCase()
																			))
															)
															.map((branch) => (
																<CommandItem
																	key={branch.id}
																	value={`${branch.name} ${branch.city} ${
																		branch.subCity || ""
																	}`}
																	onSelect={() => handleBranchSelect(branch.id)}
																	className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-slate-700 text-white">
																	<Building className="h-4 w-4 text-blue-400" />
																	<div className="flex-1">
																		<div className="font-medium">
																			{branch.name}
																		</div>
																		<div className="text-sm text-slate-400">
																			{branch.city}
																			{branch.subCity && `, ${branch.subCity}`}
																		</div>
																	</div>
																	{formData.branchId === branch.id && (
																		<div className="h-2 w-2 bg-blue-400 rounded-full" />
																	)}
																</CommandItem>
															))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									{errors.branchId && (
										<p className="text-red-400 text-sm mt-1">
											{errors.branchId}
										</p>
									)}
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
										Describe the burglary incident
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
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Alarm Type Preview */}
								<div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-500/30">
									{/* <div className="text-3xl mb-2">🏠</div> */}
									<h3 className="text-white font-bold">BURGLARY ALARM</h3>
									{/* <Badge className="bg-red-600 text-white mt-2">CRITICAL</Badge> */}
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

						{/* Police Personnel Status - NEW SECTION */}
						<PoliceStatusCard
							onConnectionStatusUpdate={(data) => {
								setConnectionStatusData(data);
								console.log("👮 Police status updated:", data);
							}}
						/>
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
// 	Shield,
// 	Radio,
// 	Crosshair,
// 	Phone,
// 	AlertCircle,
// 	Eye,
// 	Wifi,
// 	WifiOff,
// 	RefreshCw,
// 	Clock,
// 	Zap,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { PoliceStatusCard } from "@/components/police-status-card";

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
// 	severity: "CRITICAL";
// 	description: string;
// 	assignedToId: string;
// }

// export default function CreateAlarmPage() {
// 	const router = useRouter();
// 	const { toast } = useToast();
// 	const token =
// 		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

// 	// Add state for connection status tracking
// 	const [connectionStatusData, setConnectionStatusData] = useState<any>(null);

// 	// WebSocket connection with reconnection capability
// 	const { isConnected, connect, disconnect } = useWebSocket(token, {
// 		autoConnect: true,
// 		onConnectionStatusUpdate: (data) => {
// 			console.log("📊 Received connection status update:", data);
// 			setConnectionStatusData(data);

// 			// Update the police status card
// 			if ((window as any).updatePoliceStatus) {
// 				(window as any).updatePoliceStatus(data);
// 			}
// 		},
// 		onConnectionEstablished: (userInfo) => {
// 			console.log("🎉 Connection established:", userInfo);
// 			toast({
// 				title: "Connected",
// 				description: "Real-time connection established",
// 			});
// 		},
// 		onError: (error) => {
// 			console.error("❌ WebSocket error:", error);
// 			toast({
// 				title: "Connection Error",
// 				description: "WebSocket connection failed",
// 				variant: "destructive",
// 			});
// 		},
// 		onClose: (event) => {
// 			console.log("🔌 WebSocket closed:", event);
// 			if (event.code !== 1000) {
// 				toast({
// 					title: "Connection Lost",
// 					description: "Attempting to reconnect...",
// 					variant: "destructive",
// 				});
// 			}
// 		},
// 	});

// 	// State management
// 	const [currentUser, setCurrentUser] = useState<User | null>(null);
// 	const [branches, setBranches] = useState<Branch[]>([]);
// 	const [policeManagers, setPoliceManagers] = useState<PoliceManager[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [submitting, setSubmitting] = useState(false);
// 	const [locationLoading, setLocationLoading] = useState(false);
// 	const [reconnecting, setReconnecting] = useState(false);

// 	// Simplified form data - removed unnecessary fields
// 	const [formData, setFormData] = useState<AlarmFormData>({
// 		type: "BURGLARY", // Fixed value
// 		branchId: "",
// 		companyId: "",
// 		location: "",
// 		longitude: "",
// 		latitude: "",
// 		severity: "CRITICAL", // Fixed value
// 		description: "",
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
// 			const storedUser =
// 				typeof window !== "undefined"
// 					? localStorage.getItem("currentUser")
// 					: null;
// 			let user: User;
// 			if (storedUser) {
// 				user = JSON.parse(storedUser);
// 				setCurrentUser(user);
// 			} else {
// 				user = await apiClient.getCurrentUser();
// 				setCurrentUser(user);
// 			}

// 			// Load branches
// 			const branchesResponse = await apiClient.getBranches();
// 			setBranches(branchesResponse || []);

// 			// Load police managers
// 			const policeResponse = await apiClient.getPoliceManagerandOperator();

// 			console.log({
// 				policeResponse,
// 			});
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

// 	// Enhanced auto-reconnection function with better error handling
// 	const attemptReconnection = async () => {
// 		if (isConnected) return true;

// 		setReconnecting(true);
// 		try {
// 			console.log("🔄 Attempting WebSocket reconnection...");

// 			// Force reconnect if WebSocket client supports it
// 			if ((window as any).wsClient && (window as any).wsClient.forceReconnect) {
// 				(window as any).wsClient.forceReconnect();
// 			} else {
// 				disconnect();
// 				await new Promise((resolve) => setTimeout(resolve, 1000));
// 				connect();
// 			}

// 			// Wait longer for connection to establish
// 			await new Promise((resolve) => setTimeout(resolve, 3000));

// 			if (isConnected) {
// 				toast({
// 					title: "Connection Restored",
// 					description: "Real-time dispatch connection established",
// 				});
// 				return true;
// 			} else {
// 				toast({
// 					title: "Connection Failed",
// 					description:
// 						"Unable to establish real-time connection. Alarm will still be created.",
// 					variant: "destructive",
// 				});
// 				return false;
// 			}
// 		} catch (error) {
// 			console.error("Reconnection failed:", error);
// 			toast({
// 				title: "Reconnection Error",
// 				description:
// 					"Failed to reconnect. Please refresh the page if issues persist.",
// 				variant: "destructive",
// 			});
// 			return false;
// 		} finally {
// 			setReconnecting(false);
// 		}
// 	};

// 	// Add periodic connection health check
// 	useEffect(() => {
// 		const healthCheckInterval = setInterval(() => {
// 			if (!isConnected && !reconnecting) {
// 				console.log("🔍 Connection health check: Attempting reconnection...");
// 				attemptReconnection();
// 			}
// 		}, 30000); // Check every 30 seconds

// 		return () => clearInterval(healthCheckInterval);
// 	}, [isConnected, reconnecting]);

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

// 	// Validate form
// 	const validateForm = (): boolean => {
// 		const newErrors: Partial<AlarmFormData> = {};

// 		if (!formData.branchId) newErrors.branchId = "Branch selection is required";
// 		if (!formData.description.trim())
// 			newErrors.description = "Description is required";
// 		if (!formData.assignedToId)
// 			newErrors.assignedToId = "Police assignment is required";

// 		setErrors(newErrors);
// 		return Object.keys(newErrors).length === 0;
// 	};

// 	// Submit form with auto-reconnection
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

// 			// Attempt reconnection if not connected
// 			if (!isConnected) {
// 				toast({
// 					title: "Reconnecting...",
// 					description: "Establishing real-time connection before dispatch",
// 				});
// 				await attemptReconnection();
// 			}

// 			const response = await apiClient.createAlarm(formData);

// 			toast({
// 				title: "🚨 BURGLARY ALARM DISPATCHED!",
// 				description: "Critical alarm sent to police personnel immediately",
// 				duration: 5000,
// 			});

// 			// Reset form
// 			setFormData({
// 				type: "BURGLARY",
// 				branchId: "",
// 				companyId: currentUser?.companyId || "",
// 				location: "",
// 				longitude: "",
// 				latitude: "",
// 				severity: "CRITICAL",
// 				description: "",
// 				assignedToId: "",
// 			});

// 			// Redirect after success
// 			setTimeout(() => {
// 				router.push("/dashboard/alarms");
// 			}, 2000);
// 		} catch (error: any) {
// 			console.error("Failed to create alarm:", error);
// 			toast({
// 				title: "Dispatch Failed",
// 				description: error.message || "Failed to create alarm",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setSubmitting(false);
// 		}
// 	};

// 	// Get selected branch details
// 	const selectedBranch = branches.find((b) => b.id === formData.branchId);
// 	const selectedPolice = policeManagers.find(
// 		(p) => p.id === formData.assignedToId
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
// 			<div className="max-w-7xl mx-auto p-6 space-y-6">
// 				{/* Enhanced Connection Status */}
// 				<div className="flex justify-center">
// 					<Badge
// 						className={cn(
// 							"px-4 py-2 text-sm font-medium transition-all duration-300",
// 							isConnected
// 								? "bg-green-600/20 text-green-400 border-green-500/30 animate-pulse"
// 								: "bg-red-600/20 text-red-400 border-red-500/30",
// 							reconnecting && "animate-spin"
// 						)}
// 						variant="outline">
// 						{reconnecting ? (
// 							<>
// 								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
// 								Reconnecting...
// 							</>
// 						) : isConnected ? (
// 							<>
// 								<Wifi className="h-4 w-4 mr-2" />
// 								🟢 REAL-TIME DISPATCH READY
// 							</>
// 						) : (
// 							<>
// 								<WifiOff className="h-4 w-4 mr-2" />
// 								🔴 OFFLINE - Will attempt reconnection
// 							</>
// 						)}
// 					</Badge>
// 				</div>

// 				{/* Simplified Header */}
// 				<div className="text-center space-y-4">
// 					<div className="flex justify-center">
// 						{/* <div className="p-6 bg-red-600/20 rounded-2xl border border-red-500/30">
// 							<AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
// 						</div> */}
// 					</div>
// 					<div>
// 						{/* <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
// 							BURGLARY ALARM
// 						</h1>
// 						<p className="text-slate-400 text-xl mt-2">
// 							Critical Emergency Dispatch System
// 						</p> */}
// 						{currentUser && (
// 							<p className="text-slate-500 text-sm">
// 								Operator: {currentUser.name} ({currentUser.role}
// 								{currentUser.operatorType && ` - ${currentUser.operatorType}`})
// 							</p>
// 						)}
// 					</div>
// 				</div>

// 				<form
// 					onSubmit={handleSubmit}
// 					className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// 					{/* Main Form - Simplified */}
// 					<div className="lg:col-span-2 space-y-6">
// 						{/* Fixed Alarm Type Display */}
// 						<Card className="bg-red-900/10 border-red-500/30">
// 							<CardContent className="p-6">
// 								<div className="flex items-center justify-center space-x-4">
// 									<div className="text-center">
// 										<h3 className="text-2xl font-bold text-white">
// 											BURGLARY ALARM
// 										</h3>
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Location Selection */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<MapPin className="h-5 w-5 text-blue-400" />
// 									<span>Location Details</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div>
// 									<Label htmlFor="branch" className="text-slate-300 text-lg">
// 										Select Branch *
// 									</Label>
// 									<Select
// 										value={formData.branchId}
// 										onValueChange={(value) =>
// 											handleInputChange("branchId", value)
// 										}>
// 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2 h-12">
// 											<SelectValue placeholder="Choose the branch location" />
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
// 							</CardContent>
// 						</Card>

// 						{/* Incident Description */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<AlertCircle className="h-5 w-5 text-orange-400" />
// 									<span>Incident Description</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div>
// 									<Label
// 										htmlFor="description"
// 										className="text-slate-300 text-lg">
// 										Describe the burglary incident
// 									</Label>
// 									<Textarea
// 										id="description"
// 										value={formData.description}
// 										onChange={(e) =>
// 											handleInputChange("description", e.target.value)
// 										}
// 										placeholder="Provide detailed description of the burglary incident, what was observed, any suspects, etc..."
// 										className="bg-slate-800 border-slate-600 text-white mt-2 min-h-[120px]"
// 										rows={5}
// 									/>
// 									{errors.description && (
// 										<p className="text-red-400 text-sm mt-1">
// 											{errors.description}
// 										</p>
// 									)}
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Police Assignment */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Shield className="h-5 w-5 text-green-400" />
// 									<span>Police Assignment</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div>
// 									<Label
// 										htmlFor="assignedTo"
// 										className="text-slate-300 text-lg">
// 										Assign to Police Personnel *
// 									</Label>
// 									<Select
// 										value={formData.assignedToId}
// 										onValueChange={(value) =>
// 											handleInputChange("assignedToId", value)
// 										}>
// 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2 h-12">
// 											<SelectValue placeholder="Select police officer or manager" />
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

// 					{/* Enhanced Preview & Actions Sidebar */}
// 					<div className="space-y-6">
// 						{/* Live Alarm Preview */}
// 						<Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Eye className="h-5 w-5 text-purple-400" />
// 									<span>Preview</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								{/* Alarm Type Preview */}
// 								<div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-500/30">
// 									{/* <div className="text-3xl mb-2">🏠</div> */}
// 									<h3 className="text-white font-bold">BURGLARY ALARM</h3>
// 									{/* <Badge className="bg-red-600 text-white mt-2">CRITICAL</Badge> */}
// 								</div>

// 								{/* Location Preview */}
// 								{selectedBranch && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<div className="flex items-center space-x-2 mb-2">
// 											<Building className="h-4 w-4 text-blue-400" />
// 											<span className="font-medium text-white">
// 												{selectedBranch.name}
// 											</span>
// 										</div>
// 										<p className="text-sm text-slate-400">
// 											{selectedBranch.city}
// 											{selectedBranch.subCity && `, ${selectedBranch.subCity}`}
// 										</p>
// 										<div className="flex items-center space-x-2 mt-2">
// 											<Phone className="h-3 w-3 text-slate-500" />
// 											<span className="text-xs text-slate-500">
// 												{selectedBranch.phoneNumber}
// 											</span>
// 										</div>
// 									</div>
// 								)}

// 								{/* Assigned Officer Preview */}
// 								{selectedPolice && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<div className="flex items-center space-x-2 mb-1">
// 											<Shield className="h-4 w-4 text-green-400" />
// 											<span className="font-medium text-white">
// 												Assigned Officer
// 											</span>
// 										</div>
// 										<p className="text-sm text-slate-300">
// 											{selectedPolice.name}
// 										</p>
// 										<p className="text-xs text-slate-500">
// 											{selectedPolice.role}
// 											{selectedPolice.operatorType &&
// 												` (${selectedPolice.operatorType})`}
// 										</p>
// 									</div>
// 								)}

// 								{/* Description Preview */}
// 								{formData.description && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<p className="text-sm text-slate-400 mb-1">Incident:</p>
// 										<p className="text-white text-sm">
// 											{formData.description.substring(0, 100)}...
// 										</p>
// 									</div>
// 								)}

// 								{/* GPS Coordinates */}
// 								{(formData.latitude || formData.longitude) && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<div className="flex items-center space-x-2 mb-1">
// 											<MapPin className="h-4 w-4 text-purple-400" />
// 											<span className="text-sm text-slate-400">
// 												GPS Location
// 											</span>
// 										</div>
// 										<p className="text-xs text-slate-300 font-mono">
// 											{formData.latitude && `Lat: ${formData.latitude}`}
// 											{formData.latitude && formData.longitude && " | "}
// 											{formData.longitude && `Lng: ${formData.longitude}`}
// 										</p>
// 									</div>
// 								)}

// 								<Separator className="bg-slate-700" />

// 								{/* Dispatch Status */}
// 								<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// 									<Clock className="h-4 w-4" />
// 									<span>Ready for immediate dispatch</span>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Dispatch Button */}
// 						<Card className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-red-500/40">
// 							<CardContent className="p-6 space-y-4">
// 								<Button
// 									type="submit"
// 									disabled={submitting || reconnecting}
// 									className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-xl transition-all duration-300 transform hover:scale-105">
// 									{submitting ? (
// 										<>
// 											<Loader2 className="h-6 w-6 mr-3 animate-spin" />
// 											DISPATCHING...
// 										</>
// 									) : (
// 										<>
// 											<Send className="h-6 w-6 mr-3" />
// 											DISPATCH ALARM
// 										</>
// 									)}
// 								</Button>

// 								<div className="text-center space-y-2">
// 									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// 										<Radio className="h-4 w-4" />
// 										<span>Instant police notification</span>
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

// 						{/* Police Personnel Status - NEW SECTION */}
// 						<PoliceStatusCard
// 							onConnectionStatusUpdate={(data) => {
// 								setConnectionStatusData(data);
// 								console.log("👮 Police status updated:", data);
// 							}}
// 						/>
// 					</div>
// 				</form>
// 			</div>
// 		</div>
// 	);
// }

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
// 	Shield,
// 	Radio,
// 	Crosshair,
// 	Phone,
// 	AlertCircle,
// 	Eye,
// 	Wifi,
// 	WifiOff,
// 	RefreshCw,
// 	Clock,
// 	Zap,
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
// 	severity: "CRITICAL";
// 	description?: string;
// 	assignedToId: string;
// }

// export default function CreateAlarmPage() {
// 	const router = useRouter();
// 	const { toast } = useToast();
// 	const token =
// 		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

// 	// WebSocket connection with reconnection capability
// 	const { isConnected, connect, disconnect } = useWebSocket(token, {
// 		autoConnect: true,
// 	});

// 	// State management
// 	const [currentUser, setCurrentUser] = useState<User | null>(null);
// 	const [branches, setBranches] = useState<Branch[]>([]);
// 	const [policeManagers, setPoliceManagers] = useState<PoliceManager[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [submitting, setSubmitting] = useState(false);
// 	const [locationLoading, setLocationLoading] = useState(false);
// 	const [reconnecting, setReconnecting] = useState(false);

// 	// Simplified form data - removed unnecessary fields
// 	const [formData, setFormData] = useState<AlarmFormData>({
// 		type: "ACTIVE BURGLARY ALERT", // Fixed value
// 		branchId: "",
// 		companyId: "",
// 		severity: "CRITICAL", // Fixed value
// 		description: "",
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
// 			const storedUser =
// 				typeof window !== "undefined"
// 					? localStorage.getItem("currentUser")
// 					: null;
// 			let user: User;
// 			if (storedUser) {
// 				user = JSON.parse(storedUser);
// 				setCurrentUser(user);
// 			} else {
// 				user = await apiClient.getCurrentUser();
// 				setCurrentUser(user);
// 			}

// 			// Load branches
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

// 	// Auto-reconnection function
// 	const attemptReconnection = async () => {
// 		if (isConnected) return true;

// 		setReconnecting(true);
// 		try {
// 			// Attempt to reconnect
// 			connect();

// 			// Wait a moment to see if connection establishes
// 			await new Promise((resolve) => setTimeout(resolve, 2000));

// 			if (isConnected) {
// 				toast({
// 					title: "Connection Restored",
// 					description: "Real-time dispatch connection established",
// 				});
// 				return true;
// 			} else {
// 				toast({
// 					title: "Connection Failed",
// 					description:
// 						"Unable to establish real-time connection. Alarm will still be created.",
// 					variant: "destructive",
// 				});
// 				return false;
// 			}
// 		} catch (error) {
// 			console.error("Reconnection failed:", error);
// 			return false;
// 		} finally {
// 			setReconnecting(false);
// 		}
// 	};

// 	// Get current location
// 	// const getCurrentLocation = useCallback(async () => {
// 	// 	if (!navigator.geolocation) {
// 	// 		toast({
// 	// 			title: "Error",
// 	// 			description: "Geolocation is not supported by this browser",
// 	// 			variant: "destructive",
// 	// 		});
// 	// 		return;
// 	// 	}

// 	// 	try {
// 	// 		// Check permission status
// 	// 		const permission = await navigator.permissions?.query({
// 	// 			name: "geolocation" as PermissionName,
// 	// 		});

// 	// 		if (permission?.state === "denied") {
// 	// 			toast({
// 	// 				title: "Permission Denied",
// 	// 				description:
// 	// 					"Location access was denied. Please enable it in browser settings.",
// 	// 				variant: "destructive",
// 	// 			});
// 	// 			return;
// 	// 		}
// 	// 	} catch (err) {
// 	// 		console.warn("Permission API not available", err);
// 	// 	}

// 	// 	setLocationLoading(true);

// 	// 	navigator.geolocation.getCurrentPosition(
// 	// 		(position) => {
// 	// 			const { latitude, longitude } = position.coords;
// 	// 			setFormData((prev) => ({
// 	// 				...prev,
// 	// 				latitude: latitude.toString(),
// 	// 				longitude: longitude.toString(),
// 	// 				location:
// 	// 					prev.location || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
// 	// 			}));
// 	// 			toast({
// 	// 				title: "Location Updated",
// 	// 				description: "GPS coordinates have been captured",
// 	// 			});
// 	// 			setLocationLoading(false);
// 	// 		},
// 	// 		(error) => {
// 	// 			console.error("Geolocation error:", error);
// 	// 			toast({
// 	// 				title: "Location Error",
// 	// 				description: error.message || "Unable to get current location",
// 	// 				variant: "destructive",
// 	// 			});
// 	// 			setLocationLoading(false);
// 	// 		},
// 	// 		{
// 	// 			enableHighAccuracy: true,
// 	// 			timeout: 10000,
// 	// 			maximumAge: 60000,
// 	// 		}
// 	// 	);
// 	// }, [toast]);

// 	// const getCurrentLocation = useCallback(() => {
// 	// 	if (!navigator.geolocation) {
// 	// 		toast({
// 	// 			title: "Error",
// 	// 			description: "Geolocation is not supported by this browser",
// 	// 			variant: "destructive",
// 	// 		});
// 	// 		return;
// 	// 	}

// 	// 	setLocationLoading(true);
// 	// 	navigator.geolocation.getCurrentPosition(
// 	// 		(position) => {
// 	// 			const { latitude, longitude } = position.coords;
// 	// 			setFormData((prev) => ({
// 	// 				...prev,
// 	// 				latitude: latitude.toString(),
// 	// 				longitude: longitude.toString(),
// 	// 				location:
// 	// 					prev.location || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
// 	// 			}));
// 	// 			setLocationLoading(false);
// 	// 			toast({
// 	// 				title: "Location Updated",
// 	// 				description: "GPS coordinates have been captured",
// 	// 			});
// 	// 		},
// 	// 		(error) => {
// 	// 			console.error("Geolocation error:", error);
// 	// 			setLocationLoading(false);
// 	// 			toast({
// 	// 				title: "Location Error",
// 	// 				description: "Unable to get current location",
// 	// 				variant: "destructive",
// 	// 			});
// 	// 		},
// 	// 		{
// 	// 			enableHighAccuracy: true,
// 	// 			timeout: 10000,
// 	// 			maximumAge: 60000,
// 	// 		}
// 	// 	);
// 	// }, [toast]);

// 	// Handle form field changes
// 	const handleInputChange = (field: keyof AlarmFormData, value: string) => {
// 		setFormData((prev) => ({ ...prev, [field]: value }));
// 		// Clear error when user starts typing
// 		if (errors[field]) {
// 			setErrors((prev) => ({ ...prev, [field]: undefined }));
// 		}
// 	};

// 	// Validate form
// 	const validateForm = (): boolean => {
// 		const newErrors: Partial<AlarmFormData> = {};

// 		if (!formData.branchId) newErrors.branchId = "Branch selection is required";
// 		// if (!formData.description.trim())
// 		// 	newErrors.description = "Description is required";
// 		if (!formData.assignedToId)
// 			newErrors.assignedToId = "Police assignment is required";

// 		setErrors(newErrors);
// 		return Object.keys(newErrors).length === 0;
// 	};

// 	// Submit form with auto-reconnection
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

// 			// Attempt reconnection if not connected
// 			if (!isConnected) {
// 				toast({
// 					title: "Reconnecting...",
// 					description: "Establishing real-time connection before dispatch",
// 				});
// 				await attemptReconnection();
// 			}

// 			const response = await apiClient.createAlarm(formData);

// 			toast({
// 				title: "🚨 ACTIVE BURGLARY ALARM DISPATCHED!",
// 				description: "Critical alarm sent to police personnel immediately",
// 				duration: 5000,
// 			});

// 			// Reset form
// 			setFormData({
// 				type: "ACTIVE BURGLARY",
// 				branchId: "",
// 				companyId: currentUser?.companyId || "",
// 				severity: "CRITICAL",
// 				description: "",
// 				assignedToId: "",
// 			});

// 			// Redirect after success
// 			setTimeout(() => {
// 				router.push("/dashboard/alarms");
// 			}, 2000);
// 		} catch (error: any) {
// 			console.error("Failed to create alarm:", error);
// 			toast({
// 				title: "Dispatch Failed",
// 				description: error.message || "Failed to create alarm",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setSubmitting(false);
// 		}
// 	};

// 	// Get selected branch details
// 	const selectedBranch = branches.find((b) => b.id === formData.branchId);
// 	const selectedPolice = policeManagers.find(
// 		(p) => p.id === formData.assignedToId
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
// 			<div className="max-w-5xl mx-auto p-6 space-y-6">
// 				{/* Enhanced Connection Status */}
// 				<div className="flex justify-center">
// 					<Badge
// 						className={cn(
// 							"px-4 py-2 text-sm font-medium transition-all duration-300",
// 							isConnected
// 								? "bg-green-600/20 text-green-400 border-green-500/30 animate-pulse"
// 								: "bg-red-600/20 text-red-400 border-red-500/30",
// 							reconnecting && "animate-spin"
// 						)}
// 						variant="outline">
// 						{reconnecting ? (
// 							<>
// 								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
// 								Reconnecting...
// 							</>
// 						) : isConnected ? (
// 							<>
// 								<Wifi className="h-4 w-4 mr-2" />
// 								🟢 REAL-TIME DISPATCH READY
// 							</>
// 						) : (
// 							<>
// 								<WifiOff className="h-4 w-4 mr-2" />
// 								🔴 OFFLINE - Will attempt reconnection
// 							</>
// 						)}
// 					</Badge>
// 				</div>

// 				{/* Simplified Header */}
// 				<div className="text-center space-y-4">
// 					{/* <div className="flex justify-center">
// 						<div className="p-6 bg-red-600/20 rounded-2xl border border-red-500/30">
// 							<AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
// 						</div>
// 					</div> */}
// 					<div>
// 						<h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
// 							Real-Time Response Link
// 						</h1>
// 						{/* <p className="text-slate-400 text-xl mt-2">
// 							Critical Emergency Dispatch System
// 						</p> */}
// 						{currentUser && (
// 							<p className="text-slate-500 text-sm mt-2">
// 								Operator: {currentUser.name} ({currentUser.role}
// 								{currentUser.operatorType && ` - ${currentUser.operatorType}`})
// 							</p>
// 						)}
// 					</div>
// 				</div>

// 				<form
// 					onSubmit={handleSubmit}
// 					className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// 					{/* Main Form - Simplified */}
// 					<div className="lg:col-span-2 space-y-6">
// 						{/* Fixed Alarm Type Display */}
// 						<Card className="bg-red-900/10 border-red-500/30">
// 							<CardContent className="p-6">
// 								<div className="flex items-center justify-center space-x-4">
// 									<div className="p-4 bg-red-600/20 rounded-xl">
// 										<span className="text-4xl">🏠</span>
// 									</div>
// 									<div className="text-center">
// 										<h3 className="text-2xl font-bold text-white">
// 											ACTIVE BURGLARY ALARM
// 										</h3>
// 										{/* <Badge className="bg-red-600 text-white text-lg px-4 py-1 mt-2">
// 											CRITICAL PRIORITY
// 										</Badge> */}
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Location Selection */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<MapPin className="h-5 w-5 text-blue-400" />
// 									<span>Location Details</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div>
// 									<Label htmlFor="branch" className="text-slate-300 text-lg">
// 										Select Location *
// 									</Label>
// 									<Select
// 										value={formData.branchId}
// 										onValueChange={(value) =>
// 											handleInputChange("branchId", value)
// 										}>
// 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2 h-12">
// 											<SelectValue placeholder="Choose the branch location" />
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
// 							</CardContent>
// 						</Card>

// 						{/* Incident Description */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<AlertCircle className="h-5 w-5 text-orange-400" />
// 									<span>Incident Description</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div>
// 									<Label
// 										htmlFor="description"
// 										className="text-slate-300 text-lg">
// 										Describe the burglary incident
// 									</Label>
// 									<Textarea
// 										id="description"
// 										value={formData.description}
// 										onChange={(e) =>
// 											handleInputChange("description", e.target.value)
// 										}
// 										placeholder="Provide detailed description of the burglary incident, what was observed, any suspects, etc..."
// 										className="bg-slate-800 border-slate-600 text-white mt-2 min-h-[120px]"
// 										rows={5}
// 									/>
// 									{errors.description && (
// 										<p className="text-red-400 text-sm mt-1">
// 											{errors.description}
// 										</p>
// 									)}
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Police Assignment */}
// 						<Card className="bg-slate-900/50 border-slate-700">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Shield className="h-5 w-5 text-green-400" />
// 									<span>Police Assignment</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div>
// 									<Label
// 										htmlFor="assignedTo"
// 										className="text-slate-300 text-lg">
// 										Assign to Police Personnel *
// 									</Label>
// 									<Select
// 										value={formData.assignedToId}
// 										onValueChange={(value) =>
// 											handleInputChange("assignedToId", value)
// 										}>
// 										<SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-2 h-12">
// 											<SelectValue placeholder="Select police officer or manager" />
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

// 					{/* Enhanced Preview & Actions Sidebar */}
// 					<div className="space-y-6">
// 						{/* Live Alarm Preview */}
// 						<Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2">
// 									<Eye className="h-5 w-5 text-purple-400" />
// 									<span>Preview</span>
// 									{/* <Badge className="bg-cyan-600 text-white animate-pulse">
// 										LIVE
// 									</Badge> */}
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								{/* Alarm Type Preview */}
// 								<div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-500/30">
// 									<div className="text-3xl mb-2">🏠</div>
// 									<h3 className="text-white font-bold">BURGLARY ALARM</h3>
// 									<Badge className="bg-red-600 text-white mt-2">CRITICAL</Badge>
// 								</div>

// 								{/* Location Preview */}
// 								{selectedBranch && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<div className="flex items-center space-x-2 mb-2">
// 											<Building className="h-4 w-4 text-blue-400" />
// 											<span className="font-medium text-white">
// 												{selectedBranch.name}
// 											</span>
// 										</div>
// 										<p className="text-sm text-slate-400">
// 											{selectedBranch.city}
// 											{selectedBranch.subCity && `, ${selectedBranch.subCity}`}
// 										</p>
// 										<div className="flex items-center space-x-2 mt-2">
// 											<Phone className="h-3 w-3 text-slate-500" />
// 											<span className="text-xs text-slate-500">
// 												{selectedBranch.phoneNumber}
// 											</span>
// 										</div>
// 									</div>
// 								)}

// 								{/* Assigned Officer Preview */}
// 								{selectedPolice && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<div className="flex items-center space-x-2 mb-1">
// 											<Shield className="h-4 w-4 text-green-400" />
// 											<span className="font-medium text-white">
// 												Assigned Officer
// 											</span>
// 										</div>
// 										<p className="text-sm text-slate-300">
// 											{selectedPolice.name}
// 										</p>
// 										<p className="text-xs text-slate-500">
// 											{selectedPolice.role}
// 											{selectedPolice.operatorType &&
// 												` (${selectedPolice.operatorType})`}
// 										</p>
// 									</div>
// 								)}

// 								{/* Description Preview */}
// 								{formData.description && (
// 									<div className="p-3 bg-slate-800 rounded-lg">
// 										<p className="text-sm text-slate-400 mb-1">Incident:</p>
// 										<p className="text-white text-sm">
// 											{formData.description.substring(0, 100)}...
// 										</p>
// 									</div>
// 								)}

// 								<Separator className="bg-slate-700" />

// 								{/* Dispatch Status */}
// 								<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// 									<Clock className="h-4 w-4" />
// 									<span>Ready for immediate dispatch</span>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						{/* Dispatch Button */}
// 						<Card className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-red-500/40">
// 							<CardContent className="p-6 space-y-4">
// 								<Button
// 									type="submit"
// 									disabled={submitting || reconnecting}
// 									className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-xl transition-all duration-300 transform hover:scale-105">
// 									{submitting ? (
// 										<>
// 											<Loader2 className="h-6 w-6 mr-3 animate-spin" />
// 											DISPATCHING...
// 										</>
// 									) : (
// 										<>
// 											<Send className="h-6 w-6 mr-3" />
// 											DISPATCH ALARM
// 										</>
// 									)}
// 								</Button>

// 								<div className="text-center space-y-2">
// 									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// 										<Radio className="h-4 w-4" />
// 										<span>Instant police notification</span>
// 									</div>
// 									<div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
// 										<Zap className="h-4 w-4" />
// 										<span>Critical priority dispatch</span>
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

// 						{/* Quick Guidelines */}
// 						<Card className="bg-blue-900/20 border-blue-500/30">
// 							<CardHeader>
// 								<CardTitle className="flex items-center space-x-2 text-blue-400">
// 									<AlertCircle className="h-5 w-5" />
// 									<span>Quick Guidelines</span>
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent className="space-y-2 text-sm text-blue-200">
// 								<p>• Provide accurate location details</p>
// 								<p>• Describe what you observed clearly</p>
// 								<p>• GPS coordinates improve response time</p>
// 								<p>• Alarm dispatches immediately</p>
// 							</CardContent>
// 						</Card>
// 					</div>
// 				</form>
// 			</div>
// 		</div>
// 	);
// }
