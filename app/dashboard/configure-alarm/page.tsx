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
	AlertTriangle,
	Send,
	MapPin,
	Shield,
	Clock,
	CheckCircle,
	Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

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
		description: "",
		additionalNotes: "",
	});

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

				// Fetch police managers (mock for now - would need API endpoint)
				// const mockPoliceManagers = [
				// 	{
				// 		id: "1",
				// 		name: "Captain Sarah Johnson",
				// 		station: "Central Police Station",
				// 		status: "available",
				// 	},
				// 	{
				// 		id: "2",
				// 		name: "Lieutenant Mike Wilson",
				// 		station: "North Police Station",
				// 		status: "available",
				// 	},
				// 	{
				// 		id: "3",
				// 		name: "Captain David Brown",
				// 		station: "South Police Station",
				// 		status: "busy",
				// 	},
				// 	{
				// 		id: "4",
				// 		name: "Lieutenant Emma Davis",
				// 		station: "East Police Station",
				// 		status: "available",
				// 	},
				// ];
				// setPoliceManagers(mockPoliceManagers);
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await apiClient.createAlarm(formData);
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
		formData.severity &&
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

								<div className="space-y-2">
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
								</div>

								<div className="space-y-2">
									<Label htmlFor="location">Specific Location</Label>
									<Input
										id="location"
										placeholder="e.g., Main Entrance, Server Room, Floor 2"
										value={formData.location}
										onChange={(e) =>
											handleInputChange("location", e.target.value)
										}
									/>
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
// import {
// 	AlertTriangle,
// 	Send,
// 	MapPin,
// 	Shield,
// 	Clock,
// 	CheckCircle,
// } from "lucide-react";

// interface User {
// 	role: string;
// 	name: string;
// 	id: string;
// 	managedBy?: string;
// 	type?: string;
// 	companyId?: string;
// }

// interface Branch {
// 	id: string;
// 	name: string;
// 	location: string;
// 	managerId: string;
// 	companyId: string;
// 	status: string;
// }

// interface PoliceManager {
// 	id: string;
// 	name: string;
// 	station: string;
// 	status: string;
// }

// const mockBranches: Branch[] = [
// 	{
// 		id: "1",
// 		name: "Main Office",
// 		location: "Downtown",
// 		managerId: "2",
// 		companyId: "comp1",
// 		status: "active",
// 	},
// 	{
// 		id: "2",
// 		name: "North Branch",
// 		location: "North District",
// 		managerId: "2",
// 		companyId: "comp1",
// 		status: "active",
// 	},
// 	{
// 		id: "3",
// 		name: "South Branch",
// 		location: "South District",
// 		managerId: "2",
// 		companyId: "comp1",
// 		status: "active",
// 	},
// 	{
// 		id: "4",
// 		name: "East Branch",
// 		location: "East District",
// 		managerId: "3",
// 		companyId: "comp2",
// 		status: "active",
// 	}, // Different company
// ];

// const mockPoliceManagers: PoliceManager[] = [
// 	{
// 		id: "1",
// 		name: "Captain Sarah Johnson",
// 		station: "Central Police Station",
// 		status: "available",
// 	},
// 	{
// 		id: "2",
// 		name: "Lieutenant Mike Wilson",
// 		station: "North Police Station",
// 		status: "available",
// 	},
// 	{
// 		id: "3",
// 		name: "Captain David Brown",
// 		station: "South Police Station",
// 		status: "busy",
// 	},
// 	{
// 		id: "4",
// 		name: "Lieutenant Emma Davis",
// 		station: "East Police Station",
// 		status: "available",
// 	},
// ];

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
// 	{ value: "low", label: "Low", color: "bg-green-100 text-green-800" },
// 	{ value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
// 	{ value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
// 	{ value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
// ];

// export default function ConfigureAlarmPage() {
// 	const [user, setUser] = useState<User | null>(null);
// 	const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
// 	const [formData, setFormData] = useState({
// 		alarmType: "",
// 		branch: "",
// 		responder: "",
// 		severity: "",
// 		location: "",
// 		description: "",
// 		additionalNotes: "",
// 	});

// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const [submitted, setSubmitted] = useState(false);

// 	useEffect(() => {
// 		const userData = localStorage.getItem("currentUser");
// 		if (userData) {
// 			const parsedUser = JSON.parse(userData);
// 			// Mock company assignment
// 			const userWithCompany = { ...parsedUser, companyId: "comp1" };
// 			setUser(userWithCompany);

// 			// Filter branches based on user role and company
// 			let filteredBranches: Branch[] = [];

// 			if (userWithCompany.role === "office_manager") {
// 				// Office Manager can see all branches they created in their company
// 				filteredBranches = mockBranches.filter(
// 					(branch) =>
// 						branch.managerId === userWithCompany.id &&
// 						branch.companyId === userWithCompany.companyId
// 				);
// 			} else if (userWithCompany.role === "operator") {
// 				// Operator can only see branches assigned to them by their Office Manager
// 				// For demo, we'll assume operator is assigned to branches 1 and 2
// 				const operatorAssignedBranches = ["1", "2"]; // This would come from operator's assigned branches
// 				filteredBranches = mockBranches.filter(
// 					(branch) =>
// 						operatorAssignedBranches.includes(branch.id) &&
// 						branch.companyId === userWithCompany.companyId
// 				);
// 			}

// 			setAvailableBranches(filteredBranches);
// 		}
// 	}, []);

// 	const handleInputChange = (field: string, value: string) => {
// 		setFormData((prev) => ({ ...prev, [field]: value }));
// 	};

// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		setIsSubmitting(true);

// 		// Create alarm object
// 		const alarm = {
// 			id: Date.now().toString(),
// 			type: formData.alarmType,
// 			branchId: formData.branch,
// 			responderId: formData.responder,
// 			severity: formData.severity,
// 			location: formData.location,
// 			description: formData.description,
// 			additionalNotes: formData.additionalNotes,
// 			status: "active",
// 			createdBy: user?.id,
// 			createdAt: new Date().toISOString(),
// 		};

// 		// Store alarm in localStorage for demo
// 		const existingAlarms = JSON.parse(localStorage.getItem("alarms") || "[]");
// 		localStorage.setItem("alarms", JSON.stringify([...existingAlarms, alarm]));

// 		// Simulate API call
// 		await new Promise((resolve) => setTimeout(resolve, 2000));

// 		setIsSubmitting(false);
// 		setSubmitted(true);

// 		// Reset form after 3 seconds
// 		setTimeout(() => {
// 			setSubmitted(false);
// 			setFormData({
// 				alarmType: "",
// 				branch: "",
// 				responder: "",
// 				severity: "",
// 				location: "",
// 				description: "",
// 				additionalNotes: "",
// 			});
// 		}, 3000);
// 	};

// 	const isFormValid =
// 		formData.alarmType &&
// 		formData.branch &&
// 		formData.responder &&
// 		formData.severity &&
// 		formData.description;

// 	if (!user) {
// 		return (
// 			<div className="flex items-center justify-center min-h-[400px]">
// 				Loading...
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
// 							<Badge className="bg-green-100 text-green-800">
// 								Alarm ID: ALM-{Date.now().toString().slice(-6)}
// 							</Badge>
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
// 				{user.role === "operator" && (
// 					<div className="mt-2 p-3 bg-blue-50 rounded-lg">
// 						<p className="text-sm text-blue-700">
// 							<strong>Note:</strong> You can only select branches assigned to
// 							you by your Office Manager.
// 						</p>
// 					</div>
// 				)}
// 			</div>

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
// 									<Label htmlFor="alarmType">Alarm Type *</Label>
// 									<Select
// 										value={formData.alarmType}
// 										onValueChange={(value) =>
// 											handleInputChange("alarmType", value)
// 										}>
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
// 								</div>

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
// 									{user.role === "operator"
// 										? "Select from your assigned branches"
// 										: "Select the branch where the alarm occurred"}
// 								</CardDescription>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-2">
// 									<Label htmlFor="branch">Branch *</Label>
// 									<Select
// 										value={formData.branch}
// 										onValueChange={(value) =>
// 											handleInputChange("branch", value)
// 										}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select branch" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{availableBranches.map((branch) => (
// 												<SelectItem
// 													key={branch.id}
// 													value={branch.id}
// 													disabled={branch.status !== "active"}>
// 													<div className="flex items-center justify-between w-full">
// 														<span>{branch.name}</span>
// 														<div className="flex items-center space-x-2 ml-2">
// 															<span className="text-xs text-muted-foreground">
// 																{branch.location}
// 															</span>
// 															<Badge
// 																variant={
// 																	branch.status === "active"
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

// 								{formData.branch && (
// 									<div className="mt-4 p-3 bg-blue-50 rounded-lg">
// 										<div className="flex items-center space-x-2">
// 											<MapPin className="h-4 w-4 text-blue-600" />
// 											<span className="text-sm font-medium text-blue-900">
// 												{
// 													availableBranches.find(
// 														(b) => b.id === formData.branch
// 													)?.name
// 												}
// 											</span>
// 										</div>
// 										<p className="text-xs text-blue-700 mt-1">
// 											Location:{" "}
// 											{
// 												availableBranches.find((b) => b.id === formData.branch)
// 													?.location
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
// 									<Label htmlFor="responder">
// 										Responder (Police Manager) *
// 									</Label>
// 									<Select
// 										value={formData.responder}
// 										onValueChange={(value) =>
// 											handleInputChange("responder", value)
// 										}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select police manager" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{mockPoliceManagers.map((manager) => (
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

// 								{formData.responder && (
// 									<div className="mt-4 p-3 bg-green-50 rounded-lg">
// 										<div className="flex items-center space-x-2">
// 											<Shield className="h-4 w-4 text-green-600" />
// 											<span className="text-sm font-medium text-green-900">
// 												{
// 													mockPoliceManagers.find(
// 														(m) => m.id === formData.responder
// 													)?.name
// 												}
// 											</span>
// 										</div>
// 										<p className="text-xs text-green-700 mt-1">
// 											Station:{" "}
// 											{
// 												mockPoliceManagers.find(
// 													(m) => m.id === formData.responder
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
// 											{formData.severity === "critical"
// 												? "2-5 minutes"
// 												: formData.severity === "high"
// 												? "5-10 minutes"
// 												: formData.severity === "medium"
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
// 					<Button type="button" variant="outline">
// 						Save as Draft
// 					</Button>
// 					<Button
// 						type="submit"
// 						disabled={!isFormValid || isSubmitting}
// 						className="bg-red-600 hover:bg-red-700">
// 						{isSubmitting ? (
// 							<>
// 								<Clock className="h-4 w-4 mr-2 animate-spin" />
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
