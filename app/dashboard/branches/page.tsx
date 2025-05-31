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
import { toast } from "@/components/ui/use-toast";
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

// Mock data for demo - in real app this would come from API
// const mockBranches: Branch[] = [
// 	{
// 		id: "1",
// 		name: "Main Office",
// 		locationType: "Office Building",
// 		gpsAddress: "123 Main Street",
// 		city: "Addis Ababa",
// 		subCity: "Bole",
// 		woreda: "Woreda 03",
// 		country: "Ethiopia",
// 		managerName: "John Doe",
// 		phoneNumber: "+251911123456",
// 		contactNumber1: "+251911123457",
// 		description: "Main headquarters office",
// 		status: "ACTIVE",
// 		createdAt: "2024-01-15T10:00:00Z",
// 		updatedAt: "2024-01-15T10:00:00Z",
// 		company: { id: "comp1", name: "Koppa Security Solutions" },
// 		createdBy: { id: "2", name: "Office Manager", email: "office@koppa.com" },
// 		_count: { operators: 5, alarms: 3 },
// 	},
// 	{
// 		id: "2",
// 		name: "North Branch",
// 		locationType: "Retail Store",
// 		city: "Addis Ababa",
// 		subCity: "Yeka",
// 		woreda: "Woreda 05",
// 		country: "Ethiopia",
// 		managerName: "Jane Smith",
// 		phoneNumber: "+251911123458",
// 		description: "North district branch",
// 		status: "ACTIVE",
// 		createdAt: "2024-01-20T14:30:00Z",
// 		updatedAt: "2024-01-20T14:30:00Z",
// 		company: { id: "comp1", name: "Koppa Security Solutions" },
// 		createdBy: { id: "2", name: "Office Manager", email: "office@koppa.com" },
// 		_count: { operators: 3, alarms: 1 },
// 	},
// 	{
// 		id: "3",
// 		name: "South Branch",
// 		locationType: "Warehouse",
// 		city: "Addis Ababa",
// 		subCity: "Nifas Silk-Lafto",
// 		woreda: "Woreda 02",
// 		country: "Ethiopia",
// 		managerName: "Bob Wilson",
// 		phoneNumber: "+251911123459",
// 		description: "Storage and distribution center",
// 		status: "MAINTENANCE",
// 		createdAt: "2024-01-25T09:15:00Z",
// 		updatedAt: "2024-01-25T09:15:00Z",
// 		company: { id: "comp1", name: "Koppa Security Solutions" },
// 		createdBy: { id: "2", name: "Office Manager", email: "office@koppa.com" },
// 		_count: { operators: 2, alarms: 0 },
// 	},
// ];

export default function BranchesPage() {
	const [user, setUser] = useState<UserType | null>(null);
	// const [branches, setBranches] = useState<Branch[] | any>;
	const [branches, setBranches] = useState<Branch[]>([]);
	// const [mockBranches, setMockBranches] = useState<Branch[]>([]);
	const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
			const parsedUser = JSON.parse(userData);
			setUser({ ...parsedUser, companyId: "comp1" });
		}

		// Simulate API call
		setTimeout(() => {
			// setBranches(mockBranches);
			fetchBranches();
			// setFilteredBranches(mockBranches);
			setLoading(false);
		}, 1000);
	}, []);

	const fetchBranches = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/branches");
			console.log("Fetched Branches:", response);
			setBranches(response as any);
			setFilteredBranches(response as any);
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

	const handleCreateBranch = async () => {
		setIsSubmitting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const newBranch: Branch = {
				id: Date.now().toString(),
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

			setBranches([newBranch, ...branches]);
			setIsCreateDialogOpen(false);
			resetForm();

			toast({
				title: "Success",
				description: "Branch created successfully",
			});
		} catch (error) {
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
		if (!selectedBranch) return;

		setIsSubmitting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const updatedBranch: Branch = {
				...selectedBranch,
				...formData,
				updatedAt: new Date().toISOString(),
			};

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
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setBranches(branches.filter((branch) => branch.id !== branchId));

			toast({
				title: "Success",
				description: "Branch deleted successfully",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to delete branch",
				variant: "destructive",
			});
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
				return "bg-green-100 text-green-800";
			case "INACTIVE":
				return "bg-red-100 text-red-800";
			case "MAINTENANCE":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
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
				Loading...
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Branch Management
					</h1>
					<p className="text-muted-foreground">
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
							<Button onClick={resetForm}>
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
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="locationType">Location Type *</Label>
										<Select
											value={formData.locationType}
											onValueChange={(value) =>
												handleInputChange("locationType", value)
											}>
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
										<Label htmlFor="gpsAddress">GPS Address</Label>
										<Input
											id="gpsAddress"
											placeholder="Street address or GPS coordinates"
											value={formData.gpsAddress}
											onChange={(e) =>
												handleInputChange("gpsAddress", e.target.value)
											}
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
												<SelectTrigger>
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

									<div className="space-y-2">
										<Label htmlFor="status">Status</Label>
										<Select
											value={formData.status}
											onValueChange={(value) =>
												handleInputChange("status", value)
											}>
											<SelectTrigger>
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
										/>
									</div>
								</div>
							</div>
							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => setIsCreateDialogOpen(false)}>
									Cancel
								</Button>
								<Button
									onClick={handleCreateBranch}
									disabled={
										!formData.name ||
										!formData.city ||
										!formData.managerName ||
										!formData.phoneNumber ||
										isSubmitting
									}>
									{isSubmitting ? "Creating..." : "Create Branch"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{/* Overview Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Branches
						</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold">{branches.length}</div>
								<p className="text-xs text-muted-foreground">
									Across all locations
								</p>
							</>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Branches
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-500" />
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
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Operators
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold">
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
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-500" />
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
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<Input
						placeholder="Search branches by name, city, or manager..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Filter className="h-4 w-4 text-gray-400" />
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-40">
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
			<Tabs defaultValue="all" className="space-y-4">
				<TabsList>
					<TabsTrigger value="all">
						All Branches ({filteredBranches.length})
					</TabsTrigger>
					<TabsTrigger value="active">
						Active ({activeBranches.length})
					</TabsTrigger>
					<TabsTrigger value="maintenance">
						Maintenance ({maintenanceBranches.length})
					</TabsTrigger>
					<TabsTrigger value="inactive">
						Inactive ({inactiveBranches.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					{loading ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{[...Array(6)].map((_, i) => (
								<Card key={i}>
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
								<Building className="h-12 w-12 text-gray-400 mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									No branches found
								</h3>
								<p className="text-gray-500 text-center mb-4">
									{searchTerm || statusFilter !== "all"
										? "Try adjusting your search or filter criteria"
										: "Get started by creating your first branch"}
								</p>
								{canManageBranches && !searchTerm && statusFilter === "all" && (
									<Button onClick={() => setIsCreateDialogOpen(true)}>
										<Plus className="h-4 w-4 mr-2" />
										Add Branch
									</Button>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{filteredBranches.map((branch) => (
								<Card
									key={branch.id}
									className="hover:shadow-md transition-shadow">
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

											<div className="space-y-2 text-sm text-gray-600">
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
												<div className="flex space-x-4 text-xs text-gray-500">
													<span>{branch._count?.operators || 0} operators</span>
													<span>{branch._count?.alarms || 0} alarms</span>
												</div>
												<div className="flex space-x-1">
													<Button variant="outline" size="sm">
														<Eye className="h-4 w-4" />
													</Button>
													{canManageBranches && (
														<>
															<Button
																variant="outline"
																size="sm"
																onClick={() => openEditDialog(branch)}>
																<Edit className="h-4 w-4" />
															</Button>
															<AlertDialog>
																<AlertDialogTrigger asChild>
																	<Button variant="outline" size="sm">
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</AlertDialogTrigger>
																<AlertDialogContent>
																	<AlertDialogHeader>
																		<AlertDialogTitle>
																			Delete Branch
																		</AlertDialogTitle>
																		<AlertDialogDescription>
																			Are you sure you want to delete "
																			{branch.name}"? This action cannot be
																			undone.
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
																			className="bg-red-600 hover:bg-red-700">
																			Delete
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
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{activeBranches.map((branch) => (
							<Card
								key={branch.id}
								className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold text-lg">{branch.name}</h3>
											<Badge className="bg-green-100 text-green-800">
												Active
											</Badge>
										</div>

										<div className="space-y-2 text-sm text-gray-600">
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
											<div className="flex space-x-4 text-xs text-gray-500">
												<span>{branch._count?.operators || 0} operators</span>
												<span>{branch._count?.alarms || 0} alarms</span>
											</div>
											<div className="flex space-x-1">
												<Button variant="outline" size="sm">
													<Eye className="h-4 w-4" />
												</Button>
												{canManageBranches && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => openEditDialog(branch)}>
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
				</TabsContent>

				<TabsContent value="maintenance" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{maintenanceBranches.map((branch) => (
							<Card
								key={branch.id}
								className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold text-lg">{branch.name}</h3>
											<Badge className="bg-yellow-100 text-yellow-800">
												Maintenance
											</Badge>
										</div>

										<div className="space-y-2 text-sm text-gray-600">
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
											<div className="flex space-x-4 text-xs text-gray-500">
												<span>{branch._count?.operators || 0} operators</span>
												<span>{branch._count?.alarms || 0} alarms</span>
											</div>
											<div className="flex space-x-1">
												<Button variant="outline" size="sm">
													<Eye className="h-4 w-4" />
												</Button>
												{canManageBranches && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => openEditDialog(branch)}>
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
				</TabsContent>

				<TabsContent value="inactive" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{inactiveBranches.map((branch) => (
							<Card
								key={branch.id}
								className="hover:shadow-md transition-shadow border-l-4 border-l-red-500 opacity-75">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold text-lg">{branch.name}</h3>
											<Badge className="bg-red-100 text-red-800">
												Inactive
											</Badge>
										</div>

										<div className="space-y-2 text-sm text-gray-600">
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
											<div className="flex space-x-4 text-xs text-gray-500">
												<span>{branch._count?.operators || 0} operators</span>
												<span>{branch._count?.alarms || 0} alarms</span>
											</div>
											<div className="flex space-x-1">
												<Button variant="outline" size="sm">
													<Eye className="h-4 w-4" />
												</Button>
												{canManageBranches && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => openEditDialog(branch)}>
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
				</TabsContent>
			</Tabs>

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
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-locationType">Location Type *</Label>
								<Select
									value={formData.locationType}
									onValueChange={(value) =>
										handleInputChange("locationType", value)
									}>
									<SelectTrigger>
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
										<SelectTrigger>
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
										<SelectTrigger>
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
									<Label htmlFor="edit-woreda">Woreda</Label>
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
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-status">Status</Label>
								<Select
									value={formData.status}
									onValueChange={(value) => handleInputChange("status", value)}>
									<SelectTrigger>
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
								/>
							</div>
						</div>
					</div>
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleEditBranch}
							disabled={
								!formData.name ||
								!formData.city ||
								!formData.managerName ||
								!formData.phoneNumber ||
								isSubmitting
							}>
							{isSubmitting ? "Updating..." : "Update Branch"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
