"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
	Building,
	Plus,
	Edit,
	Eye,
	Trash2,
	MapPin,
	Phone,
	User,
	Search,
	Filter,
	Users,
	AlertTriangle,
	CheckCircle,
	Clock,
	Loader2,
	Info,
} from "lucide-react";
import { apiService } from "@/lib/api-service";

interface UserType {
	role: string;
	name: string;
	id: string;
	managedBy?: string;
	type?: string;
	companyId?: string;
}

interface Branch {
	id: string;
	name: string;
	locationType: string;
	gpsAddress?: string;
	city: string;
	subCity?: string;
	woreda?: string;
	country: string;
	managerName: string;
	phoneNumber: string;
	contactNumber1?: string;
	contactNumber2?: string;
	description?: string;
	status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
	createdAt: string;
	updatedAt: string;
	company?: {
		id: string;
		name: string;
	};
	createdBy?: {
		id: string;
		name: string;
		email: string;
	};
	_count?: {
		operators: number;
		alarms: number;
	};
}

interface BranchDetails extends Branch {
	alarms?: {
		id: string;
		type: string;
		status: string;
		createdAt: string;
	}[];
	operators?: {
		id: string;
		name: string;
		email: string;
		status: string;
	}[];
}

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
];

export default function EnhancedBranchesPage() {
	const [user, setUser] = useState<UserType | null>(null);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
	const [selectedBranchDetails, setSelectedBranchDetails] =
		useState<BranchDetails | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteConfirmName, setDeleteConfirmName] = useState("");
	const { toast } = useToast();

	const [formData, setFormData] = useState({
		name: "",
		locationType: "",
		gpsAddress: "",
		city: "",
		subCity: "",
		woreda: "",
		country: "Ethiopia",
		managerName: "",
		phoneNumber: "",
		contactNumber1: "",
		contactNumber2: "",
		description: "",
		status: "ACTIVE" as const,
	});

	useEffect(() => {
		const userData = localStorage.getItem("currentUser");
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser({ ...parsedUser, companyId: "comp1" });
			} catch (error) {
				console.error("Failed to parse user data:", error);
				toast({
					title: "Error",
					description: "Failed to load user data",
					variant: "destructive",
				});
			}
		}

		fetchBranches();
	}, []);

	const fetchBranches = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/branches");
			console.log("Fetched Branches:", response);

			// Add mock data for counts if not present
			const branchesWithCounts = (response as any).map((branch: any) => ({
				...branch,
				_count: branch._count || {
					operators: Math.floor(Math.random() * 10),
					alarms: Math.floor(Math.random() * 5),
				},
			}));

			setBranches(branchesWithCounts);
			setFilteredBranches(branchesWithCounts);
		} catch (error) {
			console.error("Failed to fetch branches:", error);
			toast({
				title: "Error",
				description: "Failed to fetch branches",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchBranchDetails = async (branchId: string) => {
		try {
			// In a real app, you would fetch detailed branch info from the API
			// For now, we'll simulate this with the existing branch data
			const branch = branches.find((b) => b.id === branchId);

			if (!branch) {
				throw new Error("Branch not found");
			}

			// Create mock detailed data
			const branchDetails: BranchDetails = {
				...branch,
				alarms: Array(branch._count?.alarms || 0)
					.fill(0)
					.map((_, i) => ({
						id: `alarm-${i}`,
						type: [
							"Motion Detection",
							"Door Breach",
							"Window Break",
							"Fire Alarm",
						][Math.floor(Math.random() * 4)],
						status: ["ACTIVE", "RESOLVED", "ACKNOWLEDGED"][
							Math.floor(Math.random() * 3)
						],
						createdAt: new Date(
							Date.now() - Math.random() * 10000000000
						).toISOString(),
					})),
				operators: Array(branch._count?.operators || 0)
					.fill(0)
					.map((_, i) => ({
						id: `op-${i}`,
						name: [
							"John Doe",
							"Jane Smith",
							"Michael Johnson",
							"Sarah Williams",
							"David Brown",
						][Math.floor(Math.random() * 5)],
						email: `operator${i}@example.com`,
						status: Math.random() > 0.2 ? "ACTIVE" : "INACTIVE",
					})),
			};

			setSelectedBranchDetails(branchDetails);
		} catch (error) {
			console.error("Failed to fetch branch details:", error);
			toast({
				title: "Error",
				description: "Failed to load branch details",
				variant: "destructive",
			});
		}
	};

	useEffect(() => {
		let filtered = branches;

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter(
				(branch) =>
					branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
					branch.managerName.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Filter by status
		if (statusFilter !== "all") {
			filtered = filtered.filter(
				(branch) => branch.status === statusFilter.toUpperCase()
			);
		}

		setFilteredBranches(filtered);
	}, [branches, searchTerm, statusFilter]);

	const resetForm = () => {
		setFormData({
			name: "",
			locationType: "",
			gpsAddress: "",
			city: "",
			subCity: "",
			woreda: "",
			country: "Ethiopia",
			managerName: "",
			phoneNumber: "",
			contactNumber1: "",
			contactNumber2: "",
			description: "",
			status: "ACTIVE",
		});
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const validateForm = () => {
		const requiredFields = [
			"name",
			"locationType",
			"city",
			"managerName",
			"phoneNumber",
		];
		const missingFields = requiredFields.filter(
			(field) => !formData[field as keyof typeof formData]
		);

		if (missingFields.length > 0) {
			toast({
				title: "Missing required fields",
				description: `Please fill in all required fields: ${missingFields.join(
					", "
				)}`,
				variant: "destructive",
			});
			return false;
		}

		// Validate phone number format
		const phoneRegex = /^\+?[0-9]{10,15}$/;
		if (!phoneRegex.test(formData.phoneNumber)) {
			toast({
				title: "Invalid phone number",
				description: "Please enter a valid phone number",
				variant: "destructive",
			});
			return false;
		}

		return true;
	};

	const handleCreateBranch = async () => {
		if (!validateForm()) return;

		setIsSubmitting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const newBranch: Branch = {
				id: `branch-${Date.now()}`,
				...formData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				company: { id: "comp1", name: "Koppa Security Solutions" },
				createdBy: {
					id: user?.id || "2",
					name: user?.name || "Office Manager",
					email: "office@koppa.com",
				},
				_count: { operators: 0, alarms: 0 },
			};

			// In a real app, you would call the API here
			// await apiService.post("/branches", formData)

			setBranches([newBranch, ...branches]);
			setIsCreateDialogOpen(false);
			resetForm();

			toast({
				title: "Success",
				description: "Branch created successfully",
			});
		} catch (error) {
			console.error("Failed to create branch:", error);
			toast({
				title: "Error",
				description: "Failed to create branch",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditBranch = async () => {
		if (!selectedBranch || !validateForm()) return;

		setIsSubmitting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const updatedBranch: Branch = {
				...selectedBranch,
				...formData,
				updatedAt: new Date().toISOString(),
			};

			// In a real app, you would call the API here
			// await apiService.put(`/branches/${selectedBranch.id}`, formData)

			setBranches(
				branches.map((branch) =>
					branch.id === selectedBranch.id ? updatedBranch : branch
				)
			);
			setIsEditDialogOpen(false);
			setSelectedBranch(null);
			resetForm();

			toast({
				title: "Success",
				description: "Branch updated successfully",
			});
		} catch (error) {
			console.error("Failed to update branch:", error);
			toast({
				title: "Error",
				description: "Failed to update branch",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteBranch = async (branchId: string) => {
		setIsDeleting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, you would call the API here
			// await apiService.delete(`/branches/${branchId}`)

			setBranches(branches.filter((branch) => branch.id !== branchId));
			setDeleteConfirmName("");

			toast({
				title: "Success",
				description: "Branch deleted successfully",
			});
		} catch (error) {
			console.error("Failed to delete branch:", error);
			toast({
				title: "Error",
				description: "Failed to delete branch",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const openEditDialog = (branch: Branch) => {
		setSelectedBranch(branch);
		setFormData({
			name: branch.name,
			locationType: branch.locationType,
			gpsAddress: branch.gpsAddress || "",
			city: branch.city,
			subCity: branch.subCity || "",
			woreda: branch.woreda || "",
			country: branch.country,
			managerName: branch.managerName,
			phoneNumber: branch.phoneNumber,
			contactNumber1: branch.contactNumber1 || "",
			contactNumber2: branch.contactNumber2 || "",
			description: branch.description || "",
			status: branch.status,
		} as any);
		setIsEditDialogOpen(true);
	};

	const openViewDialog = (branch: Branch) => {
		setSelectedBranch(branch);
		fetchBranchDetails(branch.id);
		setIsViewDialogOpen(true);
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "INACTIVE":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "MAINTENANCE":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
			case "INACTIVE":
				return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
			case "MAINTENANCE":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
		}
	};

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch (error) {
			return dateString;
		}
	};

	const canManageBranches =
		user?.role === "super_admin" || user?.role === "office_manager";
	const activeBranches = filteredBranches.filter((b) => b.status === "ACTIVE");
	const inactiveBranches = filteredBranches.filter(
		(b) => b.status === "INACTIVE"
	);
	const maintenanceBranches = filteredBranches.filter(
		(b) => b.status === "MAINTENANCE"
	);

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
					<p className="text-muted-foreground">Loading user data...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex justify-between items-center animate-slide-up">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
						Branch Management
					</h1>
					<p className="text-muted-foreground mt-2">
						{user.role === "office_manager"
							? "Manage your security branches and locations"
							: "View and manage all security branches"}
					</p>
				</div>
				{canManageBranches && (
					<Dialog
						open={isCreateDialogOpen}
						onOpenChange={setIsCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button
								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
								onClick={resetForm}>
								<Plus className="h-4 w-4 mr-2" />
								Add Branch
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Create New Branch</DialogTitle>
								<DialogDescription>
									Add a new branch location to your security network
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-6 lg:grid-cols-2 py-4">
								{/* Left Column */}
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="name">Branch Name *</Label>
										<Input
											id="name"
											placeholder="e.g., Downtown Office"
											value={formData.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="locationType">Location Type *</Label>
										<Select
											value={formData.locationType}
											onValueChange={(value) =>
												handleInputChange("locationType", value)
											}>
											<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
										<Label htmlFor="gpsAddress">GPS Address</Label>
										<Input
											id="gpsAddress"
											placeholder="Street address or GPS coordinates"
											value={formData.gpsAddress}
											onChange={(e) =>
												handleInputChange("gpsAddress", e.target.value)
											}
											className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										/>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="country">Country *</Label>
											<Select
												value={formData.country}
												onValueChange={(value) =>
													handleInputChange("country", value)
												}>
												<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
													<SelectValue />
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
												<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
												<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
												<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
								</div>

								{/* Right Column */}
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="managerName">Manager Name *</Label>
										<Input
											id="managerName"
											placeholder="Branch manager's full name"
											value={formData.managerName}
											onChange={(e) =>
												handleInputChange("managerName", e.target.value)
											}
											className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
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
											className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="contactNumber1">Contact Number 1</Label>
										<Input
											id="contactNumber1"
											placeholder="+251 911 123 457"
											value={formData.contactNumber1}
											onChange={(e) =>
												handleInputChange("contactNumber1", e.target.value)
											}
											className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
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
											className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="status">Status</Label>
										<Select
											value={formData.status}
											onValueChange={(value) =>
												handleInputChange("status", value)
											}>
											<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ACTIVE">Active</SelectItem>
												<SelectItem value="INACTIVE">Inactive</SelectItem>
												<SelectItem value="MAINTENANCE">Maintenance</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="description">Description</Label>
										<Textarea
											id="description"
											placeholder="Brief description of the branch..."
											value={formData.description}
											onChange={(e) =>
												handleInputChange("description", e.target.value)
											}
											rows={3}
											className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										/>
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsCreateDialogOpen(false)}
									disabled={isSubmitting}>
									Cancel
								</Button>
								<Button
									onClick={handleCreateBranch}
									disabled={isSubmitting}
									className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
									{isSubmitting ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Creating...
										</>
									) : (
										"Create Branch"
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{/* Overview Cards */}
			<div
				className="grid gap-4 md:grid-cols-4 animate-slide-up"
				style={{ animationDelay: "0.1s" }}>
				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Branches
						</CardTitle>
						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
							<Building className="h-4 w-4 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-blue-600">
									{branches.length}
								</div>
								<p className="text-xs text-muted-foreground">
									Across all locations
								</p>
							</>
						)}
					</CardContent>
				</Card>
				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Branches
						</CardTitle>
						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
							<CheckCircle className="h-4 w-4 text-green-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-green-600">
									{activeBranches.length}
								</div>
								<p className="text-xs text-muted-foreground">Operational</p>
							</>
						)}
					</CardContent>
				</Card>
				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Operators
						</CardTitle>
						<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
							<Users className="h-4 w-4 text-purple-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-purple-600">
									{branches.reduce(
										(sum, branch) => sum + (branch._count?.operators || 0),
										0
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									Assigned to branches
								</p>
							</>
						)}
					</CardContent>
				</Card>
				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
						<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
							<AlertTriangle className="h-4 w-4 text-red-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-red-600">
									{branches.reduce(
										(sum, branch) => sum + (branch._count?.alarms || 0),
										0
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									Require attention
								</p>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Search and Filter */}
			<div
				className="flex flex-col sm:flex-row gap-4 animate-slide-up"
				style={{ animationDelay: "0.2s" }}>
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search branches by name, city, or manager..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Filter className="h-4 w-4 text-muted-foreground" />
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="maintenance">Maintenance</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Branches Tabs */}
			<Tabs
				defaultValue="all"
				className="space-y-4 animate-slide-up"
				style={{ animationDelay: "0.3s" }}>
				<TabsList className="glass">
					<TabsTrigger value="all" className="relative">
						All Branches
						<Badge className="ml-2 bg-blue-500 text-white">
							{filteredBranches.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="active" className="relative">
						Active
						<Badge className="ml-2 bg-green-500 text-white">
							{activeBranches.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="maintenance" className="relative">
						Maintenance
						<Badge className="ml-2 bg-yellow-500 text-white">
							{maintenanceBranches.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="inactive" className="relative">
						Inactive
						<Badge className="ml-2 bg-red-500 text-white">
							{inactiveBranches.length}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					{loading ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{[...Array(6)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<Skeleton className="h-6 w-32" />
												<Skeleton className="h-6 w-16" />
											</div>
											<div className="space-y-2">
												<Skeleton className="h-4 w-full" />
												<Skeleton className="h-4 w-3/4" />
												<Skeleton className="h-4 w-1/2" />
											</div>
											<div className="flex justify-between">
												<Skeleton className="h-8 w-20" />
												<div className="flex space-x-2">
													<Skeleton className="h-8 w-8" />
													<Skeleton className="h-8 w-8" />
													<Skeleton className="h-8 w-8" />
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : filteredBranches.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Building className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">No branches found</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm || statusFilter !== "all"
										? "Try adjusting your search or filter criteria"
										: "Get started by creating your first branch"}
								</p>
								{canManageBranches && !searchTerm && statusFilter === "all" && (
									<Button
										onClick={() => setIsCreateDialogOpen(true)}
										className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
										<Plus className="h-4 w-4 mr-2" />
										Add Branch
									</Button>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{filteredBranches.map((branch, index) => (
								<Card
									key={branch.id}
									className="hover:shadow-lg transition-all duration-300 animate-slide-up"
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<h3 className="font-semibold text-lg">{branch.name}</h3>
												<div className="flex items-center space-x-2">
													{getStatusIcon(branch.status)}
													<Badge className={getStatusColor(branch.status)}>
														{branch.status.toLowerCase()}
													</Badge>
												</div>
											</div>

											<div className="space-y-2 text-sm text-muted-foreground">
												<div className="flex items-center space-x-2">
													<Building className="h-4 w-4" />
													<span>{branch.locationType}</span>
												</div>
												<div className="flex items-center space-x-2">
													<MapPin className="h-4 w-4" />
													<span>
														{[branch.city, branch.subCity, branch.country]
															.filter(Boolean)
															.join(", ")}
													</span>
												</div>
												<div className="flex items-center space-x-2">
													<User className="h-4 w-4" />
													<span>{branch.managerName}</span>
												</div>
												<div className="flex items-center space-x-2">
													<Phone className="h-4 w-4" />
													<span>{branch.phoneNumber}</span>
												</div>
											</div>

											<div className="flex items-center justify-between pt-2 border-t">
												<div className="flex space-x-4 text-xs text-muted-foreground">
													<span className="flex items-center">
														<Users className="h-3 w-3 mr-1" />
														{branch._count?.operators || 0} operators
													</span>
													<span className="flex items-center">
														<AlertTriangle className="h-3 w-3 mr-1" />
														{branch._count?.alarms || 0} alarms
													</span>
												</div>
												<div className="flex space-x-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openViewDialog(branch)}
														className="hover:bg-primary/10">
														<Eye className="h-4 w-4" />
													</Button>
													{canManageBranches && (
														<>
															<Button
																variant="outline"
																size="sm"
																onClick={() => openEditDialog(branch)}
																className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
																<Edit className="h-4 w-4" />
															</Button>
															<AlertDialog>
																<AlertDialogTrigger asChild>
																	<Button
																		variant="outline"
																		size="sm"
																		className="hover:bg-red-50 dark:hover:bg-red-950/20">
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</AlertDialogTrigger>
																<AlertDialogContent>
																	<AlertDialogHeader>
																		<AlertDialogTitle>
																			Delete Branch
																		</AlertDialogTitle>
																		<AlertDialogDescription>
																			<p className="mb-4">
																				Are you sure you want to delete "
																				{branch.name}"? This action cannot be
																				undone.
																			</p>
																			<div className="space-y-2">
																				<Label htmlFor="confirmDelete">
																					Type{" "}
																					<span className="font-semibold">
																						{branch.name}
																					</span>{" "}
																					to confirm
																				</Label>
																				<Input
																					id="confirmDelete"
																					value={deleteConfirmName}
																					onChange={(e) =>
																						setDeleteConfirmName(e.target.value)
																					}
																					placeholder={branch.name}
																					className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
																				/>
																			</div>
																		</AlertDialogDescription>
																	</AlertDialogHeader>
																	<AlertDialogFooter>
																		<AlertDialogCancel>
																			Cancel
																		</AlertDialogCancel>
																		<AlertDialogAction
																			onClick={() =>
																				handleDeleteBranch(branch.id)
																			}
																			disabled={
																				deleteConfirmName !== branch.name ||
																				isDeleting
																			}
																			className="bg-red-600 hover:bg-red-700">
																			{isDeleting ? (
																				<>
																					<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																					Deleting...
																				</>
																			) : (
																				"Delete"
																			)}
																		</AlertDialogAction>
																	</AlertDialogFooter>
																</AlertDialogContent>
															</AlertDialog>
														</>
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="active" className="space-y-4">
					{activeBranches.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									No active branches found
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "Create a branch and set its status to active"}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{activeBranches.map((branch, index) => (
								<Card
									key={branch.id}
									className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 animate-slide-up"
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<h3 className="font-semibold text-lg">{branch.name}</h3>
												<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
													Active
												</Badge>
											</div>

											<div className="space-y-2 text-sm text-muted-foreground">
												<div className="flex items-center space-x-2">
													<Building className="h-4 w-4" />
													<span>{branch.locationType}</span>
												</div>
												<div className="flex items-center space-x-2">
													<MapPin className="h-4 w-4" />
													<span>
														{[branch.city, branch.subCity, branch.country]
															.filter(Boolean)
															.join(", ")}
													</span>
												</div>
												<div className="flex items-center space-x-2">
													<User className="h-4 w-4" />
													<span>{branch.managerName}</span>
												</div>
											</div>

											<div className="flex items-center justify-between pt-2 border-t">
												<div className="flex space-x-4 text-xs text-muted-foreground">
													<span className="flex items-center">
														<Users className="h-3 w-3 mr-1" />
														{branch._count?.operators || 0} operators
													</span>
													<span className="flex items-center">
														<AlertTriangle className="h-3 w-3 mr-1" />
														{branch._count?.alarms || 0} alarms
													</span>
												</div>
												<div className="flex space-x-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openViewDialog(branch)}
														className="hover:bg-primary/10">
														<Eye className="h-4 w-4" />
													</Button>
													{canManageBranches && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => openEditDialog(branch)}
															className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
															<Edit className="h-4 w-4" />
														</Button>
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="maintenance" className="space-y-4">
					{maintenanceBranches.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Clock className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									No branches in maintenance
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "All branches are currently active or inactive"}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{maintenanceBranches.map((branch, index) => (
								<Card
									key={branch.id}
									className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 animate-slide-up"
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<h3 className="font-semibold text-lg">{branch.name}</h3>
												<Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
													Maintenance
												</Badge>
											</div>

											<div className="space-y-2 text-sm text-muted-foreground">
												<div className="flex items-center space-x-2">
													<Building className="h-4 w-4" />
													<span>{branch.locationType}</span>
												</div>
												<div className="flex items-center space-x-2">
													<MapPin className="h-4 w-4" />
													<span>
														{[branch.city, branch.subCity, branch.country]
															.filter(Boolean)
															.join(", ")}
													</span>
												</div>
												<div className="flex items-center space-x-2">
													<User className="h-4 w-4" />
													<span>{branch.managerName}</span>
												</div>
											</div>

											<div className="flex items-center justify-between pt-2 border-t">
												<div className="flex space-x-4 text-xs text-muted-foreground">
													<span className="flex items-center">
														<Users className="h-3 w-3 mr-1" />
														{branch._count?.operators || 0} operators
													</span>
													<span className="flex items-center">
														<AlertTriangle className="h-3 w-3 mr-1" />
														{branch._count?.alarms || 0} alarms
													</span>
												</div>
												<div className="flex space-x-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openViewDialog(branch)}
														className="hover:bg-primary/10">
														<Eye className="h-4 w-4" />
													</Button>
													{canManageBranches && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => openEditDialog(branch)}
															className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
															<Edit className="h-4 w-4" />
														</Button>
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="inactive" className="space-y-4">
					{inactiveBranches.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									No inactive branches found
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "All branches are currently active or in maintenance"}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{inactiveBranches.map((branch, index) => (
								<Card
									key={branch.id}
									className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 opacity-75 animate-slide-up"
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<h3 className="font-semibold text-lg">{branch.name}</h3>
												<Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
													Inactive
												</Badge>
											</div>

											<div className="space-y-2 text-sm text-muted-foreground">
												<div className="flex items-center space-x-2">
													<Building className="h-4 w-4" />
													<span>{branch.locationType}</span>
												</div>
												<div className="flex items-center space-x-2">
													<MapPin className="h-4 w-4" />
													<span>
														{[branch.city, branch.subCity, branch.country]
															.filter(Boolean)
															.join(", ")}
													</span>
												</div>
												<div className="flex items-center space-x-2">
													<User className="h-4 w-4" />
													<span>{branch.managerName}</span>
												</div>
											</div>

											<div className="flex items-center justify-between pt-2 border-t">
												<div className="flex space-x-4 text-xs text-muted-foreground">
													<span className="flex items-center">
														<Users className="h-3 w-3 mr-1" />
														{branch._count?.operators || 0} operators
													</span>
													<span className="flex items-center">
														<AlertTriangle className="h-3 w-3 mr-1" />
														{branch._count?.alarms || 0} alarms
													</span>
												</div>
												<div className="flex space-x-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openViewDialog(branch)}
														className="hover:bg-primary/10">
														<Eye className="h-4 w-4" />
													</Button>
													{canManageBranches && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => openEditDialog(branch)}
															className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
															<Edit className="h-4 w-4" />
														</Button>
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* View Branch Details Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-xl">
							<Building className="h-5 w-5 text-primary" />
							Branch Details
						</DialogTitle>
						<DialogDescription>
							Comprehensive information about the branch and its operations
						</DialogDescription>
					</DialogHeader>

					{selectedBranchDetails ? (
						<div className="space-y-6 py-4">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold">
										{selectedBranchDetails.name}
									</h2>
									<p className="text-muted-foreground">
										{selectedBranchDetails.locationType}
									</p>
								</div>
								<Badge className={getStatusColor(selectedBranchDetails.status)}>
									{selectedBranchDetails.status.toLowerCase()}
								</Badge>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<MapPin className="h-4 w-4 text-primary" />
											Location Information
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="text-sm text-muted-foreground">
													Country
												</Label>
												<p>{selectedBranchDetails.country}</p>
											</div>
											<div>
												<Label className="text-sm text-muted-foreground">
													City
												</Label>
												<p>{selectedBranchDetails.city}</p>
											</div>
										</div>

										{(selectedBranchDetails.subCity ||
											selectedBranchDetails.woreda) && (
											<div className="grid grid-cols-2 gap-4">
												{selectedBranchDetails.subCity && (
													<div>
														<Label className="text-sm text-muted-foreground">
															Sub-City
														</Label>
														<p>{selectedBranchDetails.subCity}</p>
													</div>
												)}
												{selectedBranchDetails.woreda && (
													<div>
														<Label className="text-sm text-muted-foreground">
															Woreda
														</Label>
														<p>{selectedBranchDetails.woreda}</p>
													</div>
												)}
											</div>
										)}

										{selectedBranchDetails.gpsAddress && (
											<div>
												<Label className="text-sm text-muted-foreground">
													GPS Address
												</Label>
												<p>{selectedBranchDetails.gpsAddress}</p>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<User className="h-4 w-4 text-primary" />
											Contact Information
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<Label className="text-sm text-muted-foreground">
												Manager Name
											</Label>
											<p>{selectedBranchDetails.managerName}</p>
										</div>

										<div>
											<Label className="text-sm text-muted-foreground">
												Primary Phone
											</Label>
											<p>{selectedBranchDetails.phoneNumber}</p>
										</div>

										{selectedBranchDetails.contactNumber1 && (
											<div>
												<Label className="text-sm text-muted-foreground">
													Contact Number 1
												</Label>
												<p>{selectedBranchDetails.contactNumber1}</p>
											</div>
										)}

										{selectedBranchDetails.contactNumber2 && (
											<div>
												<Label className="text-sm text-muted-foreground">
													Contact Number 2
												</Label>
												<p>{selectedBranchDetails.contactNumber2}</p>
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							{selectedBranchDetails.description && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<Info className="h-4 w-4 text-primary" />
											Description
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p>{selectedBranchDetails.description}</p>
									</CardContent>
								</Card>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between">
										<CardTitle className="text-lg flex items-center gap-2">
											<Users className="h-4 w-4 text-primary" />
											Operators ({selectedBranchDetails.operators?.length || 0})
										</CardTitle>
										<Button variant="outline" size="sm">
											View All
										</Button>
									</CardHeader>
									<CardContent>
										{selectedBranchDetails.operators &&
										selectedBranchDetails.operators.length > 0 ? (
											<div className="space-y-3">
												{selectedBranchDetails.operators
													.slice(0, 3)
													.map((operator, index) => (
														<div
															key={index}
															className="flex items-center justify-between p-2 rounded-md bg-muted/50">
															<div className="flex items-center gap-2">
																<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
																	<User className="h-4 w-4 text-primary" />
																</div>
																<div>
																	<p className="text-sm font-medium">
																		{operator.name}
																	</p>
																	<p className="text-xs text-muted-foreground">
																		{operator.email}
																	</p>
																</div>
															</div>
															<Badge
																className={
																	operator.status === "ACTIVE"
																		? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
																		: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
																}>
																{operator.status}
															</Badge>
														</div>
													))}

												{selectedBranchDetails.operators.length > 3 && (
													<div className="text-center pt-2">
														<Button
															variant="ghost"
															size="sm"
															className="text-xs">
															Show {selectedBranchDetails.operators.length - 3}{" "}
															more operators
														</Button>
													</div>
												)}
											</div>
										) : (
											<div className="text-center py-6 text-muted-foreground">
												<Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
												<p>No operators assigned to this branch</p>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between">
										<CardTitle className="text-lg flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-primary" />
											Recent Alarms ({selectedBranchDetails.alarms?.length || 0}
											)
										</CardTitle>
										<Button variant="outline" size="sm">
											View All
										</Button>
									</CardHeader>
									<CardContent>
										{selectedBranchDetails.alarms &&
										selectedBranchDetails.alarms.length > 0 ? (
											<div className="space-y-3">
												{selectedBranchDetails.alarms
													.slice(0, 3)
													.map((alarm, index) => (
														<div
															key={index}
															className="flex items-center justify-between p-2 rounded-md bg-muted/50">
															<div>
																<p className="text-sm font-medium">
																	{alarm.type}
																</p>
																<p className="text-xs text-muted-foreground">
																	{formatDate(alarm.createdAt)}
																</p>
															</div>
															<Badge
																className={
																	alarm.status === "ACTIVE"
																		? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
																		: alarm.status === "ACKNOWLEDGED"
																		? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
																		: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
																}>
																{alarm.status}
															</Badge>
														</div>
													))}

												{selectedBranchDetails.alarms.length > 3 && (
													<div className="text-center pt-2">
														<Button
															variant="ghost"
															size="sm"
															className="text-xs">
															Show {selectedBranchDetails.alarms.length - 3}{" "}
															more alarms
														</Button>
													</div>
												)}
											</div>
										) : (
											<div className="text-center py-6 text-muted-foreground">
												<AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-20" />
												<p>No recent alarms for this branch</p>
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							<div className="flex justify-between border-t pt-4">
								<div className="text-sm text-muted-foreground">
									<p>Created: {formatDate(selectedBranchDetails.createdAt)}</p>
									<p>
										Last Updated: {formatDate(selectedBranchDetails.updatedAt)}
									</p>
								</div>

								{canManageBranches && (
									<div className="flex gap-2">
										<Button
											variant="outline"
											onClick={() => {
												setIsViewDialogOpen(false);
												openEditDialog(selectedBranchDetails);
											}}>
											<Edit className="h-4 w-4 mr-2" />
											Edit Branch
										</Button>
										<Button
											variant="default"
											className={
												selectedBranchDetails.status === "ACTIVE"
													? "bg-red-600 hover:bg-red-700"
													: "bg-green-600 hover:bg-green-700"
											}>
											{selectedBranchDetails.status === "ACTIVE"
												? "Deactivate"
												: "Activate"}{" "}
											Branch
										</Button>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Branch</DialogTitle>
						<DialogDescription>
							Update branch information and settings
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-6 lg:grid-cols-2 py-4">
						{/* Left Column */}
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Branch Name *</Label>
								<Input
									id="edit-name"
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-locationType">Location Type *</Label>
								<Select
									value={formData.locationType}
									onValueChange={(value) =>
										handleInputChange("locationType", value)
									}>
									<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
										<SelectValue />
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
								<Label htmlFor="edit-gpsAddress">GPS Address</Label>
								<Input
									id="edit-gpsAddress"
									value={formData.gpsAddress}
									onChange={(e) =>
										handleInputChange("gpsAddress", e.target.value)
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="edit-country">Country *</Label>
									<Select
										value={formData.country}
										onValueChange={(value) =>
											handleInputChange("country", value)
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
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
									<Label htmlFor="edit-city">City *</Label>
									<Select
										value={formData.city}
										onValueChange={(value) => handleInputChange("city", value)}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
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
									<Label htmlFor="edit-subCity">Sub-City</Label>
									<Select
										value={formData.subCity}
										onValueChange={(value) =>
											handleInputChange("subCity", value)
										}
										disabled={formData.city !== "Addis Ababa"}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
									<Label htmlFor="edit-woreda">Woreda</Label>
									<Select
										value={formData.woreda}
										onValueChange={(value) =>
											handleInputChange("woreda", value)
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
						</div>

						{/* Right Column */}
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="edit-managerName">Manager Name *</Label>
								<Input
									id="edit-managerName"
									value={formData.managerName}
									onChange={(e) =>
										handleInputChange("managerName", e.target.value)
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-phoneNumber">Phone Number *</Label>
								<Input
									id="edit-phoneNumber"
									value={formData.phoneNumber}
									onChange={(e) =>
										handleInputChange("phoneNumber", e.target.value)
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-contactNumber1">Contact Number 1</Label>
								<Input
									id="edit-contactNumber1"
									value={formData.contactNumber1}
									onChange={(e) =>
										handleInputChange("contactNumber1", e.target.value)
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-contactNumber2">Contact Number 2</Label>
								<Input
									id="edit-contactNumber2"
									value={formData.contactNumber2}
									onChange={(e) =>
										handleInputChange("contactNumber2", e.target.value)
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-status">Status</Label>
								<Select
									value={formData.status}
									onValueChange={(value) => handleInputChange("status", value)}>
									<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ACTIVE">Active</SelectItem>
										<SelectItem value="INACTIVE">Inactive</SelectItem>
										<SelectItem value="MAINTENANCE">Maintenance</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-description">Description</Label>
								<Textarea
									id="edit-description"
									value={formData.description}
									onChange={(e) =>
										handleInputChange("description", e.target.value)
									}
									rows={3}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
							disabled={isSubmitting}>
							Cancel
						</Button>
						<Button
							onClick={handleEditBranch}
							disabled={isSubmitting}
							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								"Update Branch"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogDescription,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogTrigger,
// } from "@/components/ui/dialog";
// import {
// 	AlertDialog,
// 	AlertDialogAction,
// 	AlertDialogCancel,
// 	AlertDialogContent,
// 	AlertDialogDescription,
// 	AlertDialogFooter,
// 	AlertDialogHeader,
// 	AlertDialogTitle,
// 	AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { Skeleton } from "@/components/ui/skeleton";
// import { toast } from "@/components/ui/use-toast";
// import {
// 	Building,
// 	Plus,
// 	Edit,
// 	Eye,
// 	Trash2,
// 	MapPin,
// 	Phone,
// 	User,
// 	Search,
// 	Filter,
// 	Users,
// 	AlertTriangle,
// 	CheckCircle,
// 	Clock,
// } from "lucide-react";
// import { apiService } from "@/lib/api-service";

// interface UserType {
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
// 	locationType: string;
// 	gpsAddress?: string;
// 	city: string;
// 	subCity?: string;
// 	woreda?: string;
// 	country: string;
// 	managerName: string;
// 	phoneNumber: string;
// 	contactNumber1?: string;
// 	contactNumber2?: string;
// 	description?: string;
// 	status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
// 	createdAt: string;
// 	updatedAt: string;
// 	company?: {
// 		id: string;
// 		name: string;
// 	};
// 	createdBy?: {
// 		id: string;
// 		name: string;
// 		email: string;
// 	};
// 	_count?: {
// 		operators: number;
// 		alarms: number;
// 	};
// }

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

// export default function BranchesPage() {
// 	const [user, setUser] = useState<UserType | null>(null);
// 	// const [branches, setBranches] = useState<Branch[] | any>;
// 	const [branches, setBranches] = useState<Branch[]>([]);
// 	// const [mockBranches, setMockBranches] = useState<Branch[]>([]);
// 	const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [statusFilter, setStatusFilter] = useState<string>("all");
// 	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
// 	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
// 	const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
// 	const [isSubmitting, setIsSubmitting] = useState(false);

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
// 		status: "ACTIVE" as const,
// 	});

// 	useEffect(() => {
// 		const userData = localStorage.getItem("currentUser");
// 		if (userData) {
// 			const parsedUser = JSON.parse(userData);
// 			setUser({ ...parsedUser, companyId: "comp1" });
// 		}

// 		// Simulate API call
// 		setTimeout(() => {
// 			// setBranches(mockBranches);
// 			fetchBranches();
// 			// setFilteredBranches(mockBranches);
// 			setLoading(false);
// 		}, 1000);
// 	}, []);

// 	const fetchBranches = async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/branches");
// 			console.log("Fetched Branches:", response);
// 			setBranches(response as any);
// 			setFilteredBranches(response as any);
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

// 	useEffect(() => {
// 		let filtered = branches;

// 		// Filter by search term
// 		if (searchTerm) {
// 			filtered = filtered.filter(
// 				(branch) =>
// 					branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 					branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 					branch.managerName.toLowerCase().includes(searchTerm.toLowerCase())
// 			);
// 		}

// 		// Filter by status
// 		if (statusFilter !== "all") {
// 			filtered = filtered.filter(
// 				(branch) => branch.status === statusFilter.toUpperCase()
// 			);
// 		}

// 		setFilteredBranches(filtered);
// 	}, [branches, searchTerm, statusFilter]);

// 	const resetForm = () => {
// 		setFormData({
// 			name: "",
// 			locationType: "",
// 			gpsAddress: "",
// 			city: "",
// 			subCity: "",
// 			woreda: "",
// 			country: "Ethiopia",
// 			managerName: "",
// 			phoneNumber: "",
// 			contactNumber1: "",
// 			contactNumber2: "",
// 			description: "",
// 			status: "ACTIVE",
// 		});
// 	};

// 	const handleInputChange = (field: string, value: string) => {
// 		setFormData((prev) => ({ ...prev, [field]: value }));
// 	};

// 	const handleCreateBranch = async () => {
// 		setIsSubmitting(true);

// 		try {
// 			// Simulate API call
// 			await new Promise((resolve) => setTimeout(resolve, 1500));

// 			const newBranch: Branch = {
// 				id: Date.now().toString(),
// 				...formData,
// 				createdAt: new Date().toISOString(),
// 				updatedAt: new Date().toISOString(),
// 				company: { id: "comp1", name: "Koppa Security Solutions" },
// 				createdBy: {
// 					id: user?.id || "2",
// 					name: user?.name || "Office Manager",
// 					email: "office@koppa.com",
// 				},
// 				_count: { operators: 0, alarms: 0 },
// 			};

// 			setBranches([newBranch, ...branches]);
// 			setIsCreateDialogOpen(false);
// 			resetForm();

// 			toast({
// 				title: "Success",
// 				description: "Branch created successfully",
// 			});
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to create branch",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	};

// 	const handleEditBranch = async () => {
// 		if (!selectedBranch) return;

// 		setIsSubmitting(true);

// 		try {
// 			// Simulate API call
// 			await new Promise((resolve) => setTimeout(resolve, 1500));

// 			const updatedBranch: Branch = {
// 				...selectedBranch,
// 				...formData,
// 				updatedAt: new Date().toISOString(),
// 			};

// 			setBranches(
// 				branches.map((branch) =>
// 					branch.id === selectedBranch.id ? updatedBranch : branch
// 				)
// 			);
// 			setIsEditDialogOpen(false);
// 			setSelectedBranch(null);
// 			resetForm();

// 			toast({
// 				title: "Success",
// 				description: "Branch updated successfully",
// 			});
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to update branch",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	};

// 	const handleDeleteBranch = async (branchId: string) => {
// 		try {
// 			// Simulate API call
// 			await new Promise((resolve) => setTimeout(resolve, 1000));

// 			setBranches(branches.filter((branch) => branch.id !== branchId));

// 			toast({
// 				title: "Success",
// 				description: "Branch deleted successfully",
// 			});
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to delete branch",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const openEditDialog = (branch: Branch) => {
// 		setSelectedBranch(branch);
// 		setFormData({
// 			name: branch.name,
// 			locationType: branch.locationType,
// 			gpsAddress: branch.gpsAddress || "",
// 			city: branch.city,
// 			subCity: branch.subCity || "",
// 			woreda: branch.woreda || "",
// 			country: branch.country,
// 			managerName: branch.managerName,
// 			phoneNumber: branch.phoneNumber,
// 			contactNumber1: branch.contactNumber1 || "",
// 			contactNumber2: branch.contactNumber2 || "",
// 			description: branch.description || "",
// 			status: branch.status,
// 		} as any);
// 		setIsEditDialogOpen(true);
// 	};

// 	const getStatusIcon = (status: string) => {
// 		switch (status) {
// 			case "ACTIVE":
// 				return <CheckCircle className="h-4 w-4 text-green-500" />;
// 			case "INACTIVE":
// 				return <AlertTriangle className="h-4 w-4 text-red-500" />;
// 			case "MAINTENANCE":
// 				return <Clock className="h-4 w-4 text-yellow-500" />;
// 			default:
// 				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
// 		}
// 	};

// 	const getStatusColor = (status: string) => {
// 		switch (status) {
// 			case "ACTIVE":
// 				return "bg-green-100 text-green-800";
// 			case "INACTIVE":
// 				return "bg-red-100 text-red-800";
// 			case "MAINTENANCE":
// 				return "bg-yellow-100 text-yellow-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	const canManageBranches =
// 		user?.role === "super_admin" || user?.role === "office_manager";
// 	const activeBranches = filteredBranches.filter((b) => b.status === "ACTIVE");
// 	const inactiveBranches = filteredBranches.filter(
// 		(b) => b.status === "INACTIVE"
// 	);
// 	const maintenanceBranches = filteredBranches.filter(
// 		(b) => b.status === "MAINTENANCE"
// 	);

// 	if (!user) {
// 		return (
// 			<div className="flex items-center justify-center min-h-[400px]">
// 				Loading...
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6">
// 			<div className="flex justify-between items-center">
// 				<div>
// 					<h1 className="text-3xl font-bold tracking-tight">
// 						Branch Management
// 					</h1>
// 					<p className="text-muted-foreground">
// 						{user.role === "office_manager"
// 							? "Manage your security branches and locations"
// 							: "View and manage all security branches"}
// 					</p>
// 				</div>
// 				{canManageBranches && (
// 					<Dialog
// 						open={isCreateDialogOpen}
// 						onOpenChange={setIsCreateDialogOpen}>
// 						<DialogTrigger asChild>
// 							<Button onClick={resetForm}>
// 								<Plus className="h-4 w-4 mr-2" />
// 								Add Branch
// 							</Button>
// 						</DialogTrigger>
// 						<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
// 							<DialogHeader>
// 								<DialogTitle>Create New Branch</DialogTitle>
// 								<DialogDescription>
// 									Add a new branch location to your security network
// 								</DialogDescription>
// 							</DialogHeader>
// 							<div className="grid gap-6 lg:grid-cols-2 py-4">
// 								{/* Left Column */}
// 								<div className="space-y-4">
// 									<div className="space-y-2">
// 										<Label htmlFor="name">Branch Name *</Label>
// 										<Input
// 											id="name"
// 											placeholder="e.g., Downtown Office"
// 											value={formData.name}
// 											onChange={(e) =>
// 												handleInputChange("name", e.target.value)
// 											}
// 										/>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="locationType">Location Type *</Label>
// 										<Select
// 											value={formData.locationType}
// 											onValueChange={(value) =>
// 												handleInputChange("locationType", value)
// 											}>
// 											<SelectTrigger>
// 												<SelectValue placeholder="Select location type" />
// 											</SelectTrigger>
// 											<SelectContent>
// 												{locationTypes.map((type) => (
// 													<SelectItem key={type} value={type}>
// 														{type}
// 													</SelectItem>
// 												))}
// 											</SelectContent>
// 										</Select>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="gpsAddress">GPS Address</Label>
// 										<Input
// 											id="gpsAddress"
// 											placeholder="Street address or GPS coordinates"
// 											value={formData.gpsAddress}
// 											onChange={(e) =>
// 												handleInputChange("gpsAddress", e.target.value)
// 											}
// 										/>
// 									</div>

// 									<div className="grid grid-cols-2 gap-4">
// 										<div className="space-y-2">
// 											<Label htmlFor="country">Country *</Label>
// 											<Select
// 												value={formData.country}
// 												onValueChange={(value) =>
// 													handleInputChange("country", value)
// 												}>
// 												<SelectTrigger>
// 													<SelectValue />
// 												</SelectTrigger>
// 												<SelectContent>
// 													{countries.map((country) => (
// 														<SelectItem key={country} value={country}>
// 															{country}
// 														</SelectItem>
// 													))}
// 												</SelectContent>
// 											</Select>
// 										</div>

// 										<div className="space-y-2">
// 											<Label htmlFor="city">City *</Label>
// 											<Select
// 												value={formData.city}
// 												onValueChange={(value) =>
// 													handleInputChange("city", value)
// 												}>
// 												<SelectTrigger>
// 													<SelectValue placeholder="Select city" />
// 												</SelectTrigger>
// 												<SelectContent>
// 													{(formData.country === "Ethiopia"
// 														? ethiopianCities
// 														: ["Other"]
// 													).map((city) => (
// 														<SelectItem key={city} value={city}>
// 															{city}
// 														</SelectItem>
// 													))}
// 												</SelectContent>
// 											</Select>
// 										</div>
// 									</div>

// 									<div className="grid grid-cols-2 gap-4">
// 										<div className="space-y-2">
// 											<Label htmlFor="subCity">Sub-City</Label>
// 											<Select
// 												value={formData.subCity}
// 												onValueChange={(value) =>
// 													handleInputChange("subCity", value)
// 												}
// 												disabled={formData.city !== "Addis Ababa"}>
// 												<SelectTrigger>
// 													<SelectValue placeholder="Select sub-city" />
// 												</SelectTrigger>
// 												<SelectContent>
// 													{(formData.city === "Addis Ababa"
// 														? addisAbabaSubCities
// 														: []
// 													).map((subCity) => (
// 														<SelectItem key={subCity} value={subCity}>
// 															{subCity}
// 														</SelectItem>
// 													))}
// 												</SelectContent>
// 											</Select>
// 										</div>

// 										<div className="space-y-2">
// 											<Label htmlFor="woreda">Woreda</Label>
// 											<Select
// 												value={formData.woreda}
// 												onValueChange={(value) =>
// 													handleInputChange("woreda", value)
// 												}>
// 												<SelectTrigger>
// 													<SelectValue placeholder="Select woreda" />
// 												</SelectTrigger>
// 												<SelectContent>
// 													{sampleWoredas.map((woreda) => (
// 														<SelectItem key={woreda} value={woreda}>
// 															{woreda}
// 														</SelectItem>
// 													))}
// 												</SelectContent>
// 											</Select>
// 										</div>
// 									</div>
// 								</div>

// 								{/* Right Column */}
// 								<div className="space-y-4">
// 									<div className="space-y-2">
// 										<Label htmlFor="managerName">Manager Name *</Label>
// 										<Input
// 											id="managerName"
// 											placeholder="Branch manager's full name"
// 											value={formData.managerName}
// 											onChange={(e) =>
// 												handleInputChange("managerName", e.target.value)
// 											}
// 										/>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="phoneNumber">Phone Number *</Label>
// 										<Input
// 											id="phoneNumber"
// 											placeholder="+251 911 123 456"
// 											value={formData.phoneNumber}
// 											onChange={(e) =>
// 												handleInputChange("phoneNumber", e.target.value)
// 											}
// 										/>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="contactNumber1">Contact Number 1</Label>
// 										<Input
// 											id="contactNumber1"
// 											placeholder="+251 911 123 457"
// 											value={formData.contactNumber1}
// 											onChange={(e) =>
// 												handleInputChange("contactNumber1", e.target.value)
// 											}
// 										/>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="contactNumber2">Contact Number 2</Label>
// 										<Input
// 											id="contactNumber2"
// 											placeholder="+251 911 123 458"
// 											value={formData.contactNumber2}
// 											onChange={(e) =>
// 												handleInputChange("contactNumber2", e.target.value)
// 											}
// 										/>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="status">Status</Label>
// 										<Select
// 											value={formData.status}
// 											onValueChange={(value) =>
// 												handleInputChange("status", value)
// 											}>
// 											<SelectTrigger>
// 												<SelectValue />
// 											</SelectTrigger>
// 											<SelectContent>
// 												<SelectItem value="ACTIVE">Active</SelectItem>
// 												<SelectItem value="INACTIVE">Inactive</SelectItem>
// 												<SelectItem value="MAINTENANCE">Maintenance</SelectItem>
// 											</SelectContent>
// 										</Select>
// 									</div>

// 									<div className="space-y-2">
// 										<Label htmlFor="description">Description</Label>
// 										<Textarea
// 											id="description"
// 											placeholder="Brief description of the branch..."
// 											value={formData.description}
// 											onChange={(e) =>
// 												handleInputChange("description", e.target.value)
// 											}
// 											rows={3}
// 										/>
// 									</div>
// 								</div>
// 							</div>
// 							<div className="flex justify-end space-x-2">
// 								<Button
// 									variant="outline"
// 									onClick={() => setIsCreateDialogOpen(false)}>
// 									Cancel
// 								</Button>
// 								<Button
// 									onClick={handleCreateBranch}
// 									disabled={
// 										!formData.name ||
// 										!formData.city ||
// 										!formData.managerName ||
// 										!formData.phoneNumber ||
// 										isSubmitting
// 									}>
// 									{isSubmitting ? "Creating..." : "Create Branch"}
// 								</Button>
// 							</div>
// 						</DialogContent>
// 					</Dialog>
// 				)}
// 			</div>

// 			{/* Overview Cards */}
// 			<div className="grid gap-4 md:grid-cols-4">
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Branches
// 						</CardTitle>
// 						<Building className="h-4 w-4 text-muted-foreground" />
// 					</CardHeader>
// 					<CardContent>
// 						{loading ? (
// 							<Skeleton className="h-8 w-16" />
// 						) : (
// 							<>
// 								<div className="text-2xl font-bold">{branches.length}</div>
// 								<p className="text-xs text-muted-foreground">
// 									Across all locations
// 								</p>
// 							</>
// 						)}
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Active Branches
// 						</CardTitle>
// 						<CheckCircle className="h-4 w-4 text-green-500" />
// 					</CardHeader>
// 					<CardContent>
// 						{loading ? (
// 							<Skeleton className="h-8 w-16" />
// 						) : (
// 							<>
// 								<div className="text-2xl font-bold text-green-600">
// 									{activeBranches.length}
// 								</div>
// 								<p className="text-xs text-muted-foreground">Operational</p>
// 							</>
// 						)}
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Operators
// 						</CardTitle>
// 						<Users className="h-4 w-4 text-muted-foreground" />
// 					</CardHeader>
// 					<CardContent>
// 						{loading ? (
// 							<Skeleton className="h-8 w-16" />
// 						) : (
// 							<>
// 								<div className="text-2xl font-bold">
// 									{branches.reduce(
// 										(sum, branch) => sum + (branch._count?.operators || 0),
// 										0
// 									)}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Assigned to branches
// 								</p>
// 							</>
// 						)}
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
// 						<AlertTriangle className="h-4 w-4 text-red-500" />
// 					</CardHeader>
// 					<CardContent>
// 						{loading ? (
// 							<Skeleton className="h-8 w-16" />
// 						) : (
// 							<>
// 								<div className="text-2xl font-bold text-red-600">
// 									{branches.reduce(
// 										(sum, branch) => sum + (branch._count?.alarms || 0),
// 										0
// 									)}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Require attention
// 								</p>
// 							</>
// 						)}
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Search and Filter */}
// 			<div className="flex flex-col sm:flex-row gap-4">
// 				<div className="relative flex-1">
// 					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
// 					<Input
// 						placeholder="Search branches by name, city, or manager..."
// 						value={searchTerm}
// 						onChange={(e) => setSearchTerm(e.target.value)}
// 						className="pl-10"
// 					/>
// 				</div>
// 				<div className="flex items-center space-x-2">
// 					<Filter className="h-4 w-4 text-gray-400" />
// 					<Select value={statusFilter} onValueChange={setStatusFilter}>
// 						<SelectTrigger className="w-40">
// 							<SelectValue placeholder="Filter by status" />
// 						</SelectTrigger>
// 						<SelectContent>
// 							<SelectItem value="all">All Status</SelectItem>
// 							<SelectItem value="active">Active</SelectItem>
// 							<SelectItem value="inactive">Inactive</SelectItem>
// 							<SelectItem value="maintenance">Maintenance</SelectItem>
// 						</SelectContent>
// 					</Select>
// 				</div>
// 			</div>

// 			{/* Branches Tabs */}
// 			<Tabs defaultValue="all" className="space-y-4">
// 				<TabsList>
// 					<TabsTrigger value="all">
// 						All Branches ({filteredBranches.length})
// 					</TabsTrigger>
// 					<TabsTrigger value="active">
// 						Active ({activeBranches.length})
// 					</TabsTrigger>
// 					<TabsTrigger value="maintenance">
// 						Maintenance ({maintenanceBranches.length})
// 					</TabsTrigger>
// 					<TabsTrigger value="inactive">
// 						Inactive ({inactiveBranches.length})
// 					</TabsTrigger>
// 				</TabsList>

// 				<TabsContent value="all" className="space-y-4">
// 					{loading ? (
// 						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
// 							{[...Array(6)].map((_, i) => (
// 								<Card key={i}>
// 									<CardContent className="p-6">
// 										<div className="space-y-4">
// 											<div className="flex items-center justify-between">
// 												<Skeleton className="h-6 w-32" />
// 												<Skeleton className="h-6 w-16" />
// 											</div>
// 											<div className="space-y-2">
// 												<Skeleton className="h-4 w-full" />
// 												<Skeleton className="h-4 w-3/4" />
// 												<Skeleton className="h-4 w-1/2" />
// 											</div>
// 											<div className="flex justify-between">
// 												<Skeleton className="h-8 w-20" />
// 												<div className="flex space-x-2">
// 													<Skeleton className="h-8 w-8" />
// 													<Skeleton className="h-8 w-8" />
// 													<Skeleton className="h-8 w-8" />
// 												</div>
// 											</div>
// 										</div>
// 									</CardContent>
// 								</Card>
// 							))}
// 						</div>
// 					) : filteredBranches.length === 0 ? (
// 						<Card>
// 							<CardContent className="flex flex-col items-center justify-center py-12">
// 								<Building className="h-12 w-12 text-gray-400 mb-4" />
// 								<h3 className="text-lg font-medium text-gray-900 mb-2">
// 									No branches found
// 								</h3>
// 								<p className="text-gray-500 text-center mb-4">
// 									{searchTerm || statusFilter !== "all"
// 										? "Try adjusting your search or filter criteria"
// 										: "Get started by creating your first branch"}
// 								</p>
// 								{canManageBranches && !searchTerm && statusFilter === "all" && (
// 									<Button onClick={() => setIsCreateDialogOpen(true)}>
// 										<Plus className="h-4 w-4 mr-2" />
// 										Add Branch
// 									</Button>
// 								)}
// 							</CardContent>
// 						</Card>
// 					) : (
// 						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
// 							{filteredBranches.map((branch) => (
// 								<Card
// 									key={branch.id}
// 									className="hover:shadow-md transition-shadow">
// 									<CardContent className="p-6">
// 										<div className="space-y-4">
// 											<div className="flex items-center justify-between">
// 												<h3 className="font-semibold text-lg">{branch.name}</h3>
// 												<div className="flex items-center space-x-2">
// 													{getStatusIcon(branch.status)}
// 													<Badge className={getStatusColor(branch.status)}>
// 														{branch.status.toLowerCase()}
// 													</Badge>
// 												</div>
// 											</div>

// 											<div className="space-y-2 text-sm text-gray-600">
// 												<div className="flex items-center space-x-2">
// 													<Building className="h-4 w-4" />
// 													<span>{branch.locationType}</span>
// 												</div>
// 												<div className="flex items-center space-x-2">
// 													<MapPin className="h-4 w-4" />
// 													<span>
// 														{[branch.city, branch.subCity, branch.country]
// 															.filter(Boolean)
// 															.join(", ")}
// 													</span>
// 												</div>
// 												<div className="flex items-center space-x-2">
// 													<User className="h-4 w-4" />
// 													<span>{branch.managerName}</span>
// 												</div>
// 												<div className="flex items-center space-x-2">
// 													<Phone className="h-4 w-4" />
// 													<span>{branch.phoneNumber}</span>
// 												</div>
// 											</div>

// 											<div className="flex items-center justify-between pt-2 border-t">
// 												<div className="flex space-x-4 text-xs text-gray-500">
// 													<span>{branch._count?.operators || 0} operators</span>
// 													<span>{branch._count?.alarms || 0} alarms</span>
// 												</div>
// 												<div className="flex space-x-1">
// 													<Button variant="outline" size="sm">
// 														<Eye className="h-4 w-4" />
// 													</Button>
// 													{canManageBranches && (
// 														<>
// 															<Button
// 																variant="outline"
// 																size="sm"
// 																onClick={() => openEditDialog(branch)}>
// 																<Edit className="h-4 w-4" />
// 															</Button>
// 															<AlertDialog>
// 																<AlertDialogTrigger asChild>
// 																	<Button variant="outline" size="sm">
// 																		<Trash2 className="h-4 w-4" />
// 																	</Button>
// 																</AlertDialogTrigger>
// 																<AlertDialogContent>
// 																	<AlertDialogHeader>
// 																		<AlertDialogTitle>
// 																			Delete Branch
// 																		</AlertDialogTitle>
// 																		<AlertDialogDescription>
// 																			Are you sure you want to delete "
// 																			{branch.name}"? This action cannot be
// 																			undone.
// 																		</AlertDialogDescription>
// 																	</AlertDialogHeader>
// 																	<AlertDialogFooter>
// 																		<AlertDialogCancel>
// 																			Cancel
// 																		</AlertDialogCancel>
// 																		<AlertDialogAction
// 																			onClick={() =>
// 																				handleDeleteBranch(branch.id)
// 																			}
// 																			className="bg-red-600 hover:bg-red-700">
// 																			Delete
// 																		</AlertDialogAction>
// 																	</AlertDialogFooter>
// 																</AlertDialogContent>
// 															</AlertDialog>
// 														</>
// 													)}
// 												</div>
// 											</div>
// 										</div>
// 									</CardContent>
// 								</Card>
// 							))}
// 						</div>
// 					)}
// 				</TabsContent>

// 				<TabsContent value="active" className="space-y-4">
// 					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
// 						{activeBranches.map((branch) => (
// 							<Card
// 								key={branch.id}
// 								className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
// 								<CardContent className="p-6">
// 									<div className="space-y-4">
// 										<div className="flex items-center justify-between">
// 											<h3 className="font-semibold text-lg">{branch.name}</h3>
// 											<Badge className="bg-green-100 text-green-800">
// 												Active
// 											</Badge>
// 										</div>

// 										<div className="space-y-2 text-sm text-gray-600">
// 											<div className="flex items-center space-x-2">
// 												<Building className="h-4 w-4" />
// 												<span>{branch.locationType}</span>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<MapPin className="h-4 w-4" />
// 												<span>
// 													{[branch.city, branch.subCity, branch.country]
// 														.filter(Boolean)
// 														.join(", ")}
// 												</span>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<User className="h-4 w-4" />
// 												<span>{branch.managerName}</span>
// 											</div>
// 										</div>

// 										<div className="flex items-center justify-between pt-2 border-t">
// 											<div className="flex space-x-4 text-xs text-gray-500">
// 												<span>{branch._count?.operators || 0} operators</span>
// 												<span>{branch._count?.alarms || 0} alarms</span>
// 											</div>
// 											<div className="flex space-x-1">
// 												<Button variant="outline" size="sm">
// 													<Eye className="h-4 w-4" />
// 												</Button>
// 												{canManageBranches && (
// 													<Button
// 														variant="outline"
// 														size="sm"
// 														onClick={() => openEditDialog(branch)}>
// 														<Edit className="h-4 w-4" />
// 													</Button>
// 												)}
// 											</div>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="maintenance" className="space-y-4">
// 					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
// 						{maintenanceBranches.map((branch) => (
// 							<Card
// 								key={branch.id}
// 								className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
// 								<CardContent className="p-6">
// 									<div className="space-y-4">
// 										<div className="flex items-center justify-between">
// 											<h3 className="font-semibold text-lg">{branch.name}</h3>
// 											<Badge className="bg-yellow-100 text-yellow-800">
// 												Maintenance
// 											</Badge>
// 										</div>

// 										<div className="space-y-2 text-sm text-gray-600">
// 											<div className="flex items-center space-x-2">
// 												<Building className="h-4 w-4" />
// 												<span>{branch.locationType}</span>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<MapPin className="h-4 w-4" />
// 												<span>
// 													{[branch.city, branch.subCity, branch.country]
// 														.filter(Boolean)
// 														.join(", ")}
// 												</span>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<User className="h-4 w-4" />
// 												<span>{branch.managerName}</span>
// 											</div>
// 										</div>

// 										<div className="flex items-center justify-between pt-2 border-t">
// 											<div className="flex space-x-4 text-xs text-gray-500">
// 												<span>{branch._count?.operators || 0} operators</span>
// 												<span>{branch._count?.alarms || 0} alarms</span>
// 											</div>
// 											<div className="flex space-x-1">
// 												<Button variant="outline" size="sm">
// 													<Eye className="h-4 w-4" />
// 												</Button>
// 												{canManageBranches && (
// 													<Button
// 														variant="outline"
// 														size="sm"
// 														onClick={() => openEditDialog(branch)}>
// 														<Edit className="h-4 w-4" />
// 													</Button>
// 												)}
// 											</div>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="inactive" className="space-y-4">
// 					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
// 						{inactiveBranches.map((branch) => (
// 							<Card
// 								key={branch.id}
// 								className="hover:shadow-md transition-shadow border-l-4 border-l-red-500 opacity-75">
// 								<CardContent className="p-6">
// 									<div className="space-y-4">
// 										<div className="flex items-center justify-between">
// 											<h3 className="font-semibold text-lg">{branch.name}</h3>
// 											<Badge className="bg-red-100 text-red-800">
// 												Inactive
// 											</Badge>
// 										</div>

// 										<div className="space-y-2 text-sm text-gray-600">
// 											<div className="flex items-center space-x-2">
// 												<Building className="h-4 w-4" />
// 												<span>{branch.locationType}</span>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<MapPin className="h-4 w-4" />
// 												<span>
// 													{[branch.city, branch.subCity, branch.country]
// 														.filter(Boolean)
// 														.join(", ")}
// 												</span>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<User className="h-4 w-4" />
// 												<span>{branch.managerName}</span>
// 											</div>
// 										</div>

// 										<div className="flex items-center justify-between pt-2 border-t">
// 											<div className="flex space-x-4 text-xs text-gray-500">
// 												<span>{branch._count?.operators || 0} operators</span>
// 												<span>{branch._count?.alarms || 0} alarms</span>
// 											</div>
// 											<div className="flex space-x-1">
// 												<Button variant="outline" size="sm">
// 													<Eye className="h-4 w-4" />
// 												</Button>
// 												{canManageBranches && (
// 													<Button
// 														variant="outline"
// 														size="sm"
// 														onClick={() => openEditDialog(branch)}>
// 														<Edit className="h-4 w-4" />
// 													</Button>
// 												)}
// 											</div>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>
// 			</Tabs>

// 			{/* Edit Dialog */}
// 			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
// 				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
// 					<DialogHeader>
// 						<DialogTitle>Edit Branch</DialogTitle>
// 						<DialogDescription>
// 							Update branch information and settings
// 						</DialogDescription>
// 					</DialogHeader>
// 					<div className="grid gap-6 lg:grid-cols-2 py-4">
// 						{/* Left Column */}
// 						<div className="space-y-4">
// 							<div className="space-y-2">
// 								<Label htmlFor="edit-name">Branch Name *</Label>
// 								<Input
// 									id="edit-name"
// 									value={formData.name}
// 									onChange={(e) => handleInputChange("name", e.target.value)}
// 								/>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="edit-locationType">Location Type *</Label>
// 								<Select
// 									value={formData.locationType}
// 									onValueChange={(value) =>
// 										handleInputChange("locationType", value)
// 									}>
// 									<SelectTrigger>
// 										<SelectValue />
// 									</SelectTrigger>
// 									<SelectContent>
// 										{locationTypes.map((type) => (
// 											<SelectItem key={type} value={type}>
// 												{type}
// 											</SelectItem>
// 										))}
// 									</SelectContent>
// 								</Select>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="edit-gpsAddress">GPS Address</Label>
// 								<Input
// 									id="edit-gpsAddress"
// 									value={formData.gpsAddress}
// 									onChange={(e) =>
// 										handleInputChange("gpsAddress", e.target.value)
// 									}
// 								/>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="edit-country">Country *</Label>
// 									<Select
// 										value={formData.country}
// 										onValueChange={(value) =>
// 											handleInputChange("country", value)
// 										}>
// 										<SelectTrigger>
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{countries.map((country) => (
// 												<SelectItem key={country} value={country}>
// 													{country}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="edit-city">City *</Label>
// 									<Select
// 										value={formData.city}
// 										onValueChange={(value) => handleInputChange("city", value)}>
// 										<SelectTrigger>
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{(formData.country === "Ethiopia"
// 												? ethiopianCities
// 												: ["Other"]
// 											).map((city) => (
// 												<SelectItem key={city} value={city}>
// 													{city}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="edit-subCity">Sub-City</Label>
// 									<Select
// 										value={formData.subCity}
// 										onValueChange={(value) =>
// 											handleInputChange("subCity", value)
// 										}
// 										disabled={formData.city !== "Addis Ababa"}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select sub-city" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{(formData.city === "Addis Ababa"
// 												? addisAbabaSubCities
// 												: []
// 											).map((subCity) => (
// 												<SelectItem key={subCity} value={subCity}>
// 													{subCity}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor="edit-woreda">Woreda</Label>
// 									<Select
// 										value={formData.woreda}
// 										onValueChange={(value) =>
// 											handleInputChange("woreda", value)
// 										}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select woreda" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{sampleWoredas.map((woreda) => (
// 												<SelectItem key={woreda} value={woreda}>
// 													{woreda}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>
// 						</div>

// 						{/* Right Column */}
// 						<div className="space-y-4">
// 							<div className="space-y-2">
// 								<Label htmlFor="edit-managerName">Manager Name *</Label>
// 								<Input
// 									id="edit-managerName"
// 									value={formData.managerName}
// 									onChange={(e) =>
// 										handleInputChange("managerName", e.target.value)
// 									}
// 								/>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="edit-phoneNumber">Phone Number *</Label>
// 								<Input
// 									id="edit-phoneNumber"
// 									value={formData.phoneNumber}
// 									onChange={(e) =>
// 										handleInputChange("phoneNumber", e.target.value)
// 									}
// 								/>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="edit-contactNumber1">Contact Number 1</Label>
// 								<Input
// 									id="edit-contactNumber1"
// 									value={formData.contactNumber1}
// 									onChange={(e) =>
// 										handleInputChange("contactNumber1", e.target.value)
// 									}
// 								/>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="edit-contactNumber2">Contact Number 2</Label>
// 								<Input
// 									id="edit-contactNumber2"
// 									value={formData.contactNumber2}
// 									onChange={(e) =>
// 										handleInputChange("contactNumber2", e.target.value)
// 									}
// 								/>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="edit-status">Status</Label>
// 								<Select
// 									value={formData.status}
// 									onValueChange={(value) => handleInputChange("status", value)}>
// 									<SelectTrigger>
// 										<SelectValue />
// 									</SelectTrigger>
// 									<SelectContent>
// 										<SelectItem value="ACTIVE">Active</SelectItem>
// 										<SelectItem value="INACTIVE">Inactive</SelectItem>
// 										<SelectItem value="MAINTENANCE">Maintenance</SelectItem>
// 									</SelectContent>
// 								</Select>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="edit-description">Description</Label>
// 								<Textarea
// 									id="edit-description"
// 									value={formData.description}
// 									onChange={(e) =>
// 										handleInputChange("description", e.target.value)
// 									}
// 									rows={3}
// 								/>
// 							</div>
// 						</div>
// 					</div>
// 					<div className="flex justify-end space-x-2">
// 						<Button
// 							variant="outline"
// 							onClick={() => setIsEditDialogOpen(false)}>
// 							Cancel
// 						</Button>
// 						<Button
// 							onClick={handleEditBranch}
// 							disabled={
// 								!formData.name ||
// 								!formData.city ||
// 								!formData.managerName ||
// 								!formData.phoneNumber ||
// 								isSubmitting
// 							}>
// 							{isSubmitting ? "Updating..." : "Update Branch"}
// 						</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>
// 		</div>
// 	);
// }
