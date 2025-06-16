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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
	Users,
	Plus,
	Edit,
	Eye,
	UserCheck,
	Building,
	Mail,
	Phone,
	Search,
	Filter,
	UserX,
	Loader2,
	AlertTriangle,
	Clock,
	UserCog,
	Trash2,
	User,
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

interface Operator {
	id: string;
	name: string;
	email: string;
	phone: string;
	password?: string;
	status: "ACTIVE" | "INACTIVE";
	createdBy: string;
	managedById?: string;
	operatorType?: string;
	companyId: string;
	role: "OPERATOR";
	createdAt: string;
	assignedBranches?: string[];
	lastActive?: string;
}

interface Branch {
	id: string;
	name: string;
	location: string;
	managerId: string;
	companyId: string;
}

interface OperatorDetails extends Operator {
	branches?: {
		id: string;
		name: string;
		location: string;
	}[];
	alarms?: {
		id: string;
		type: string;
		status: string;
		timestamp: string;
	}[];
	activityLog?: {
		id: string;
		action: string;
		timestamp: string;
		details: string;
	}[];
}

export default function EnhancedOperatorsPage() {
	const [user, setUser] = useState<UserType | null>(null);
	const [operators, setOperators] = useState<Operator[]>([]);
	const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
		null
	);
	const [selectedOperatorDetails, setSelectedOperatorDetails] =
		useState<OperatorDetails | null>(null);
	const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
	const { toast } = useToast();

	const [newOperator, setNewOperator] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		operatorType: "OFFICE",
		assignedBranches: [] as string[],
	});

	const [editOperator, setEditOperator] = useState({
		name: "",
		email: "",
		phone: "",
		operatorType: "",
		assignedBranches: [] as string[],
	});

	useEffect(() => {
		const userData = localStorage.getItem("currentUser");
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser({ ...parsedUser, companyId: parsedUser.companyId || "comp1" });
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
		fetchOperators();
	}, []);

	const fetchBranches = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/branches");
			console.log("Fetched Branches:", response);
			setBranches(response as any);
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

	const fetchOperators = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/users/my-operators");
			console.log("Fetched Operators:", response);

			// Add mock data for assigned branches if not present
			const operatorsWithBranches = (response as any).map((operator: any) => ({
				...operator,
				assignedBranches:
					operator.assignedBranches ||
					Array(Math.floor(Math.random() * 3) + 1)
						.fill(0)
						.map(
							() =>
								branches[Math.floor(Math.random() * branches.length)]?.id ||
								"branch-1"
						),
				lastActive:
					operator.lastActive ||
					new Date(Date.now() - Math.random() * 10000000000).toISOString(),
			}));

			setOperators(operatorsWithBranches);
			setFilteredOperators(operatorsWithBranches);
		} catch (error) {
			console.error("Failed to fetch operators:", error);
			toast({
				title: "Error",
				description: "Failed to fetch operators",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchOperatorDetails = async (operatorId: string) => {
		try {
			// In a real app, you would fetch detailed operator info from the API
			// For now, we'll simulate this with the existing operator data
			const operator = operators.find((op) => op.id === operatorId);

			if (!operator) {
				throw new Error("Operator not found");
			}

			// Create mock detailed data
			const operatorDetails: OperatorDetails = {
				...operator,
				branches:
					operator.assignedBranches?.map((branchId) => {
						const branch = branches.find((b) => b.id === branchId);
						return {
							id: branchId,
							name: branch?.name || `Branch ${branchId.slice(-2)}`,
							location: branch?.location || "Unknown Location",
						};
					}) || [],
				alarms: Array(Math.floor(Math.random() * 5))
					.fill(0)
					.map((_, i) => ({
						id: `alarm-${i}`,
						type: [
							"Active Burglary Alert",
							"Active Burglary Alert",
							"Active Burglary Alert",
							"Active Burglary Alert",
						][Math.floor(Math.random() * 4)],
						status: ["ACTIVE", "RESOLVED", "ACKNOWLEDGED"][
							Math.floor(Math.random() * 3)
						],
						timestamp: new Date(
							Date.now() - Math.random() * 10000000000
						).toISOString(),
					})),
				activityLog: Array(Math.floor(Math.random() * 10) + 3)
					.fill(0)
					.map((_, i) => ({
						id: `log-${i}`,
						action: [
							"Login",
							"Alarm Response",
							"Status Update",
							"Branch Visit",
							"Report Submission",
						][Math.floor(Math.random() * 5)],
						timestamp: new Date(
							Date.now() - Math.random() * 10000000000
						).toISOString(),
						details: [
							"Completed successfully",
							"Verified alarm status",
							"Updated branch security protocols",
							"Submitted incident report",
						][Math.floor(Math.random() * 4)],
					})),
			};

			setSelectedOperatorDetails(operatorDetails);
		} catch (error) {
			console.error("Failed to fetch operator details:", error);
			toast({
				title: "Error",
				description: "Failed to load operator details",
				variant: "destructive",
			});
		}
	};

	useEffect(() => {
		let filtered = operators;

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter(
				(operator) =>
					operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					operator.email.toLowerCase().includes(searchTerm.toLowerCase())
				// operator.phone.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Filter by status
		if (statusFilter !== "all") {
			filtered = filtered.filter(
				(operator) => operator.status === statusFilter.toUpperCase()
			);
		}

		setFilteredOperators(filtered);
	}, [operators, searchTerm, statusFilter]);

	const validateOperatorForm = (data: {
		name: string;
		email: string;
		phone: string;
		password?: string;
	}) => {
		const requiredFields = ["name", "email", "phone"];
		const missingFields = requiredFields.filter(
			(field) => !data[field as keyof typeof data]
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

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			toast({
				title: "Invalid email",
				description: "Please enter a valid email address",
				variant: "destructive",
			});
			return false;
		}

		// Validate phone number format
		const phoneRegex = /^\+?[0-9]{10,15}$/;
		if (!phoneRegex.test(data.phone)) {
			toast({
				title: "Invalid phone number",
				description: "Please enter a valid phone number",
				variant: "destructive",
			});
			return false;
		}

		// Validate password if it's a new operator
		if (data.password !== undefined && data.password.length < 8) {
			toast({
				title: "Invalid password",
				description: "Password must be at least 8 characters long",
				variant: "destructive",
			});
			return false;
		}

		return true;
	};

	const handleCreateOperator = async () => {
		if (!user || !validateOperatorForm(newOperator)) return;

		setIsSubmitting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const operator: Operator = {
				id: `op-${Date.now()}`,
				name: newOperator.name,
				email: newOperator.email,
				phone: newOperator.phone,
				password: newOperator.phone,
				status: "ACTIVE",
				role: "OPERATOR",
				managedById: user.id,
				operatorType: newOperator.operatorType,
				createdBy: user.id,
				companyId: user.companyId as string,
				createdAt: new Date().toISOString(),
				assignedBranches: newOperator.assignedBranches,
				lastActive: new Date().toISOString(),
			};

			// In a real app, you would call the API here
			await apiService.post("/users", operator);

			setOperators([operator, ...operators]);
			setNewOperator({
				name: "",
				email: "",
				phone: "",
				password: "",
				operatorType: "OFFICE",
				assignedBranches: [],
			});
			setIsCreateDialogOpen(false);

			toast({
				title: "Success",
				description: "Operator created successfully",
			});
		} catch (error) {
			console.error("Failed to create operator:", error);
			toast({
				title: "Error",
				description: "Failed to create operator",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditOperator = async () => {
		if (
			!selectedOperator ||
			!validateOperatorForm({ ...editOperator, password: undefined })
		)
			return;

		setIsSubmitting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const updatedOperator: Operator = {
				...selectedOperator,
				name: editOperator.name,
				email: editOperator.email,
				phone: editOperator.phone,
				operatorType: editOperator.operatorType,
				assignedBranches: editOperator.assignedBranches,
			};

			// In a real app, you would call the API here
			// await apiService.put(`/users/${selectedOperator.id}`, updatedOperator)

			setOperators(
				operators.map((op) =>
					op.id === selectedOperator.id ? updatedOperator : op
				)
			);
			setIsEditDialogOpen(false);
			setSelectedOperator(null);

			toast({
				title: "Success",
				description: "Operator updated successfully",
			});
		} catch (error) {
			console.error("Failed to update operator:", error);
			toast({
				title: "Error",
				description: "Failed to update operator",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleOperatorStatus = async (operatorId: string) => {
		try {
			const operator = operators.find((op) => op.id === operatorId);
			if (!operator) return;

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, you would call the API here
			// await apiService.put(`/users/${operatorId}/status`, { status: operator.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })

			const updatedOperators = operators.map((op) =>
				op.id === operatorId
					? { ...op, status: op.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
					: op
			);

			setOperators(updatedOperators as any);

			toast({
				title: "Success",
				description: `Operator ${
					operator.status === "ACTIVE" ? "deactivated" : "activated"
				} successfully`,
			});
		} catch (error) {
			console.error("Failed to toggle operator status:", error);
			toast({
				title: "Error",
				description: "Failed to update operator status",
				variant: "destructive",
			});
		}
	};

	const handleDeleteOperator = async (operatorId: string) => {
		setIsDeleting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, you would call the API here
			// await apiService.delete(`/users/${operatorId}`)

			setOperators(operators.filter((op) => op.id !== operatorId));
			setDeleteConfirmEmail("");

			toast({
				title: "Success",
				description: "Operator deleted successfully",
			});
		} catch (error) {
			console.error("Failed to delete operator:", error);
			toast({
				title: "Error",
				description: "Failed to delete operator",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const openEditDialog = (operator: Operator) => {
		setSelectedOperator(operator);
		setEditOperator({
			name: operator.name,
			email: operator.email,
			phone: operator.phone,
			operatorType: operator.operatorType || "OFFICE",
			assignedBranches: operator.assignedBranches || [],
		});
		setIsEditDialogOpen(true);
	};

	const openViewDialog = (operator: Operator) => {
		setSelectedOperator(operator);
		fetchOperatorDetails(operator.id);
		setIsViewDialogOpen(true);
	};

	const getBranchName = (branchId: string) => {
		return branches.find((b) => b.id === branchId)?.name || "Unknown Branch";
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

	const formatDateTime = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			return dateString;
		}
	};

	const getTimeAgo = (dateString: string) => {
		try {
			const date = new Date(dateString);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffSec = Math.round(diffMs / 1000);
			const diffMin = Math.round(diffSec / 60);
			const diffHour = Math.round(diffMin / 60);
			const diffDay = Math.round(diffHour / 24);

			if (diffSec < 60) return `${diffSec} seconds ago`;
			if (diffMin < 60) return `${diffMin} minutes ago`;
			if (diffHour < 24) return `${diffHour} hours ago`;
			if (diffDay < 30) return `${diffDay} days ago`;

			return formatDate(dateString);
		} catch (error) {
			return "Unknown time";
		}
	};

	const userBranches = branches.filter(
		(branch) =>
			branch.managerId === user?.id && branch.companyId === user?.companyId
	);

	const activeOperators = filteredOperators.filter(
		(op) => op.status === "ACTIVE"
	);
	const inactiveOperators = filteredOperators.filter(
		(op) => op.status === "INACTIVE"
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
						Operator Management
					</h1>
					<p className="text-muted-foreground mt-2">
						Manage security operators under your supervision
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
							<Plus className="h-4 w-4 mr-2" />
							Create Operator
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Operator</DialogTitle>
							<DialogDescription>
								Add a new security operator to your team
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name *</Label>
									<Input
										id="name"
										value={newOperator.name}
										onChange={(e) =>
											setNewOperator({ ...newOperator, name: e.target.value })
										}
										placeholder="Enter operator's full name"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="operatorType">Operator Type</Label>
									<Select
										value={newOperator.operatorType}
										onValueChange={(value) =>
											setNewOperator({ ...newOperator, operatorType: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue placeholder="Select operator type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="OFFICE">Office Operator</SelectItem>

											<SelectItem value="POLICE">Police Operator</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									type="email"
									value={newOperator.email}
									onChange={(e) =>
										setNewOperator({ ...newOperator, email: e.target.value })
									}
									placeholder="operator@company.com"
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number *</Label>
									<Input
										id="phone"
										value={newOperator.phone}
										onChange={(e) =>
											setNewOperator({ ...newOperator, phone: e.target.value })
										}
										placeholder="+251911123456"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">Password *</Label>
									<Input
										id="password"
										value={newOperator.password}
										onChange={(e) =>
											setNewOperator({
												...newOperator,
												password: e.target.value,
											})
										}
										placeholder="Minimum 8 characters"
										type="password"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
							</div>

							{/* <div className="space-y-2">
								<Label>Assign Branches</Label>
								<div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
									{userBranches.length > 0 ? (
										userBranches.map((branch) => (
											<div
												key={branch.id}
												className="flex items-center space-x-2">
												<input
													type="checkbox"
													id={`branch-${branch.id}`}
													checked={newOperator.assignedBranches.includes(
														branch.id
													)}
													onChange={(e) => {
														if (e.target.checked) {
															setNewOperator({
																...newOperator,
																assignedBranches: [
																	...newOperator.assignedBranches,
																	branch.id,
																],
															});
														} else {
															setNewOperator({
																...newOperator,
																assignedBranches:
																	newOperator.assignedBranches.filter(
																		(id) => id !== branch.id
																	),
															});
														}
													}}
													className="rounded border-gray-300"
												/>
												<Label
													htmlFor={`branch-${branch.id}`}
													className="text-sm">
													{branch.name} - {branch.location}
												</Label>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground">
											No branches available for assignment
										</p>
									)}
								</div>
							</div> */}
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
								disabled={isSubmitting}>
								Cancel
							</Button>
							<Button
								onClick={handleCreateOperator}
								disabled={isSubmitting}
								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create Operator"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div
				className="grid gap-4 md:grid-cols-3 animate-slide-up"
				style={{ animationDelay: "0.1s" }}>
				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Operators
						</CardTitle>
						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
							<Users className="h-4 w-4 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-blue-600">
									{operators.length}
								</div>
								<p className="text-xs text-muted-foreground">
									{operators.filter((op) => op.status === "ACTIVE").length}{" "}
									active
								</p>
							</>
						)}
					</CardContent>
				</Card>
				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Operators
						</CardTitle>
						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
							<UserCheck className="h-4 w-4 text-green-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-green-600">
									{operators.filter((op) => op.status === "ACTIVE").length}
								</div>
								<p className="text-xs text-muted-foreground">
									Currently on duty
								</p>
							</>
						)}
					</CardContent>
				</Card>
				{/* <Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Assigned Branches
						</CardTitle>
						<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
							<Building className="h-4 w-4 text-purple-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-purple-600">
									{userBranches.length}
								</div>
								<p className="text-xs text-muted-foreground">
									Under your management
								</p>
							</>
						)}
					</CardContent>
				</Card> */}
			</div>

			{/* Search and Filter */}
			<div
				className="flex flex-col sm:flex-row gap-4 animate-slide-up"
				style={{ animationDelay: "0.2s" }}>
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search operators by name, email, or phone..."
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
						</SelectContent>
					</Select>
				</div>
			</div>

			<Tabs
				defaultValue="active"
				className="space-y-4 animate-slide-up"
				style={{ animationDelay: "0.3s" }}>
				<TabsList className="glass">
					<TabsTrigger value="active" className="relative">
						Active Operators
						<Badge className="ml-2 bg-green-500 text-white">
							{activeOperators.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="inactive" className="relative">
						Inactive Operators
						<Badge className="ml-2 bg-red-500 text-white">
							{inactiveOperators.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="all" className="relative">
						All Operators
						<Badge className="ml-2 bg-blue-500 text-white">
							{filteredOperators.length}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="active" className="space-y-4">
					{loading ? (
						<div className="space-y-4">
							{[...Array(3)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<Skeleton className="h-10 w-10 rounded-full" />
												<div>
													<Skeleton className="h-5 w-32 mb-2" />
													<Skeleton className="h-4 w-48" />
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Skeleton className="h-8 w-8 rounded" />
												<Skeleton className="h-8 w-8 rounded" />
												<Skeleton className="h-8 w-24 rounded" />
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : activeOperators.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									No active operators found
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "Create a new operator or activate existing ones"}
								</p>
								<Button
									onClick={() => setIsCreateDialogOpen(true)}
									className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
									<Plus className="h-4 w-4 mr-2" />
									Create Operator
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{activeOperators.map((operator, index) => (
								<Card
									key={operator.id}
									className="hover:shadow-lg transition-all duration-300 animate-slide-up border-l-4 border-l-green-500"
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
													<UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
												</div>
												<div>
													<h4 className="font-medium">{operator.name}</h4>
													<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
														<span className="flex items-center">
															<Mail className="h-3 w-3 mr-1" />
															{operator.email}
														</span>
														<span className="flex items-center">
															<Phone className="h-3 w-3 mr-1" />
															{operator.phone}
														</span>
													</div>
													<div className="flex flex-wrap items-center gap-2 mt-2">
														<Badge
															variant="default"
															className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
															Active
														</Badge>
														{operator.operatorType && (
															<Badge
																variant="outline"
																className="border-blue-200 text-blue-800 dark:border-blue-900/20 dark:text-blue-400">
																{operator.operatorType === "OFFICE"
																	? "Office"
																	: operator.operatorType === "FIELD"
																	? "Field"
																	: "Police"}{" "}
																Operator
															</Badge>
														)}
														<span className="text-xs text-muted-foreground">
															Last active:{" "}
															{operator.lastActive
																? getTimeAgo(operator.lastActive)
																: "Unknown"}
														</span>
													</div>
												</div>
											</div>
											<div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
												{/* <div className="text-right hidden sm:block">
													<p className="text-sm font-medium">
														Assigned Branches
													</p>
													<div className="flex flex-wrap gap-1 mt-1 justify-end">
														{operator.assignedBranches &&
														operator.assignedBranches.length > 0 ? (
															operator.assignedBranches
																.slice(0, 2)
																.map((branchId, index) => (
																	<Badge
																		key={index}
																		variant="outline"
																		className="text-xs">
																		{getBranchName(branchId)}
																	</Badge>
																))
														) : (
															<span className="text-xs text-muted-foreground">
																No branches assigned
															</span>
														)}
														{operator.assignedBranches &&
															operator.assignedBranches.length > 2 && (
																<Badge variant="outline" className="text-xs">
																	+{operator.assignedBranches.length - 2} more
																</Badge>
															)}
													</div>
												</div> */}
												<div className="flex space-x-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openViewDialog(operator)}
														className="hover:bg-primary/10">
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => openEditDialog(operator)}
														className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => toggleOperatorStatus(operator.id)}
														className="hover:bg-red-50 dark:hover:bg-red-950/20">
														<UserX className="h-4 w-4" />
													</Button>
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
					{loading ? (
						<div className="space-y-4">
							{[...Array(2)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<Skeleton className="h-10 w-10 rounded-full" />
												<div>
													<Skeleton className="h-5 w-32 mb-2" />
													<Skeleton className="h-4 w-48" />
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Skeleton className="h-8 w-24 rounded" />
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : inactiveOperators.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<UserX className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									No inactive operators found
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "All operators are currently active"}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{inactiveOperators.map((operator, index) => (
								<Card
									key={operator.id}
									className="hover:shadow-lg transition-all duration-300 animate-slide-up border-l-4 border-l-red-500 opacity-75"
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
													<UserX className="h-5 w-5 text-gray-600 dark:text-gray-400" />
												</div>
												<div>
													<h4 className="font-medium">{operator.name}</h4>
													<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
														<span className="flex items-center">
															<Mail className="h-3 w-3 mr-1" />
															{operator.email}
														</span>
														<span className="flex items-center">
															<Phone className="h-3 w-3 mr-1" />
															{operator.phone}
														</span>
													</div>
													<div className="flex items-center space-x-2 mt-2">
														<Badge variant="secondary">Inactive</Badge>
														<span className="text-xs text-muted-foreground">
															Created: {formatDate(operator.createdAt)}
														</span>
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => openViewDialog(operator)}
													className="hover:bg-primary/10">
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => toggleOperatorStatus(operator.id)}
													className="hover:bg-green-50 dark:hover:bg-green-950/20">
													Activate
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="all" className="space-y-4">
					{loading ? (
						<div className="space-y-4">
							{[...Array(4)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<Skeleton className="h-10 w-10 rounded-full" />
												<div>
													<Skeleton className="h-5 w-32 mb-2" />
													<Skeleton className="h-4 w-48" />
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Skeleton className="h-8 w-8 rounded" />
												<Skeleton className="h-8 w-8 rounded" />
												<Skeleton className="h-8 w-24 rounded" />
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : filteredOperators.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Users className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">No operators found</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "Get started by creating your first operator"}
								</p>
								<Button
									onClick={() => setIsCreateDialogOpen(true)}
									className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
									<Plus className="h-4 w-4 mr-2" />
									Create Operator
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{filteredOperators.map((operator, index) => (
								<Card
									key={operator.id}
									className={`hover:shadow-lg transition-all duration-300 animate-slide-up ${
										operator.status === "ACTIVE"
											? "border-l-4 border-l-green-500"
											: "border-l-4 border-l-red-500 opacity-75"
									}`}
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div
													className={`p-2 rounded-lg ${
														operator.status === "ACTIVE"
															? "bg-green-100 dark:bg-green-900/20"
															: "bg-gray-100 dark:bg-gray-800"
													}`}>
													{operator.status === "ACTIVE" ? (
														<UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
													) : (
														<UserX className="h-5 w-5 text-gray-600 dark:text-gray-400" />
													)}
												</div>
												<div>
													<h4 className="font-medium">{operator.name}</h4>
													<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
														<span className="flex items-center">
															<Mail className="h-3 w-3 mr-1" />
															{operator.email}
														</span>
														<span className="flex items-center">
															<Phone className="h-3 w-3 mr-1" />
															{operator.phone}
														</span>
													</div>
													<div className="flex flex-wrap items-center gap-2 mt-2">
														<Badge
															variant={
																operator.status === "ACTIVE"
																	? "default"
																	: "secondary"
															}
															className={
																operator.status === "ACTIVE"
																	? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
																	: ""
															}>
															{operator.status}
														</Badge>
														{operator.operatorType &&
															operator.status === "ACTIVE" && (
																<Badge
																	variant="outline"
																	className="border-blue-200 text-blue-800 dark:border-blue-900/20 dark:text-blue-400">
																	{operator.operatorType === "OFFICE"
																		? "Office"
																		: operator.operatorType === "FIELD"
																		? "Field"
																		: "Police"}{" "}
																	Operator
																</Badge>
															)}
														<span className="text-xs text-muted-foreground">
															{operator.status === "ACTIVE" &&
															operator.lastActive
																? `Last active: ${getTimeAgo(
																		operator.lastActive
																  )}`
																: `Created: ${formatDate(operator.createdAt)}`}
														</span>
													</div>
												</div>
											</div>
											<div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
												{/* {operator.status === "ACTIVE" && (
													<div className="text-right hidden sm:block">
														<p className="text-sm font-medium">
															Assigned Branches
														</p>
														<div className="flex flex-wrap gap-1 mt-1 justify-end">
															{operator.assignedBranches &&
															operator.assignedBranches.length > 0 ? (
																operator.assignedBranches
																	.slice(0, 2)
																	.map((branchId) => (
																		<Badge
																			key={branchId}
																			variant="outline"
																			className="text-xs">
																			{getBranchName(branchId)}
																		</Badge>
																	))
															) : (
																<span className="text-xs text-muted-foreground">
																	No branches assigned
																</span>
															)}
															{operator.assignedBranches &&
																operator.assignedBranches.length > 2 && (
																	<Badge variant="outline" className="text-xs">
																		+{operator.assignedBranches.length - 2} more
																	</Badge>
																)}
														</div>
													</div>
												)} */}
												<div className="flex space-x-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openViewDialog(operator)}
														className="hover:bg-primary/10">
														<Eye className="h-4 w-4" />
													</Button>
													{operator.status === "ACTIVE" && (
														<>
															<Button
																variant="outline"
																size="sm"
																onClick={() => openEditDialog(operator)}
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
																			Delete Operator
																		</AlertDialogTitle>
																		<AlertDialogDescription>
																			<p className="mb-4">
																				Are you sure you want to delete "
																				{operator.name}"? This action cannot be
																				undone.
																			</p>
																			<div className="space-y-2">
																				<Label htmlFor="confirmDelete">
																					Type{" "}
																					<span className="font-semibold">
																						{operator.email}
																					</span>{" "}
																					to confirm
																				</Label>
																				<Input
																					id="confirmDelete"
																					value={deleteConfirmEmail}
																					onChange={(e) =>
																						setDeleteConfirmEmail(
																							e.target.value
																						)
																					}
																					placeholder={operator.email}
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
																				handleDeleteOperator(operator.id)
																			}
																			disabled={
																				deleteConfirmEmail !== operator.email ||
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
													<Button
														variant="outline"
														size="sm"
														onClick={() => toggleOperatorStatus(operator.id)}
														className={
															operator.status === "ACTIVE"
																? "hover:bg-red-50 dark:hover:bg-red-950/20"
																: "hover:bg-green-50 dark:hover:bg-green-950/20"
														}>
														{operator.status === "ACTIVE"
															? "Deactivate"
															: "Activate"}
													</Button>
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

			{/* View Operator Details Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-xl">
							<User className="h-5 w-5 text-primary" />
							Operator Details
						</DialogTitle>
						<DialogDescription>
							Comprehensive information about the operator and their activities
						</DialogDescription>
					</DialogHeader>

					{selectedOperatorDetails ? (
						<div className="space-y-6 py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div
										className={`p-3 rounded-full ${
											selectedOperatorDetails.status === "ACTIVE"
												? "bg-green-100 dark:bg-green-900/20"
												: "bg-gray-100 dark:bg-gray-800"
										}`}>
										{selectedOperatorDetails.status === "ACTIVE" ? (
											<UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
										) : (
											<UserX className="h-6 w-6 text-gray-600 dark:text-gray-400" />
										)}
									</div>
									<div>
										<h2 className="text-2xl font-bold">
											{selectedOperatorDetails.name}
										</h2>
										<p className="text-muted-foreground">
											{selectedOperatorDetails.email}
										</p>
									</div>
								</div>
								<Badge
									className={
										selectedOperatorDetails.status === "ACTIVE"
											? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
											: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
									}>
									{selectedOperatorDetails.status}
								</Badge>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-1 gap-6">
								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<UserCog className="h-4 w-4 text-primary" />
											Operator Information
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="text-sm text-muted-foreground">
													Phone
												</Label>
												<p>{selectedOperatorDetails.phone}</p>
											</div>
											<div>
												<Label className="text-sm text-muted-foreground">
													Role
												</Label>
												<p>{selectedOperatorDetails.role}</p>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="text-sm text-muted-foreground">
													Operator Type
												</Label>
												<p>
													{selectedOperatorDetails.operatorType ||
														"Not specified"}
												</p>
											</div>
											<div>
												<Label className="text-sm text-muted-foreground">
													Created
												</Label>
												<p>{formatDate(selectedOperatorDetails.createdAt)}</p>
											</div>
										</div>

										{selectedOperatorDetails.lastActive && (
											<div>
												<Label className="text-sm text-muted-foreground">
													Last Active
												</Label>
												<p>
													{formatDateTime(selectedOperatorDetails.lastActive)}
												</p>
											</div>
										)}
									</CardContent>
								</Card>

								{/* <Card>
									<CardHeader className="flex flex-row items-center justify-between">
										<CardTitle className="text-lg flex items-center gap-2">
											<Building className="h-4 w-4 text-primary" />
											Assigned Branches
										</CardTitle>
										<Button variant="outline" size="sm">
											Manage
										</Button>
									</CardHeader>
									<CardContent>
										{selectedOperatorDetails.branches &&
										selectedOperatorDetails.branches.length > 0 ? (
											<div className="space-y-3">
												{selectedOperatorDetails.branches.map(
													(branch, index) => (
														<div
															key={index}
															className="flex items-center justify-between p-2 rounded-md bg-muted/50">
															<div>
																<p className="text-sm font-medium">
																	{branch.name}
																</p>
																<p className="text-xs text-muted-foreground">
																	{branch.location}
																</p>
															</div>
															<Button variant="ghost" size="sm">
																<Eye className="h-3.5 w-3.5 mr-1" />
																View
															</Button>
														</div>
													)
												)}
											</div>
										) : (
											<div className="text-center py-6 text-muted-foreground">
												<Building className="h-10 w-10 mx-auto mb-2 opacity-20" />
												<p>No branches assigned to this operator</p>
											</div>
										)}
									</CardContent>
								</Card> */}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between">
										<CardTitle className="text-lg flex items-center gap-2">
											<AlertTriangle className="h-4 w-4 text-primary" />
											Recent Alarms
										</CardTitle>
										<Button variant="outline" size="sm">
											View All
										</Button>
									</CardHeader>
									<CardContent>
										{selectedOperatorDetails.alarms &&
										selectedOperatorDetails.alarms.length > 0 ? (
											<div className="space-y-3">
												{selectedOperatorDetails.alarms.map((alarm, index) => (
													<div
														key={index}
														className="flex items-center justify-between p-2 rounded-md bg-muted/50">
														<div>
															<p className="text-sm font-medium">
																{alarm.type}
															</p>
															<p className="text-xs text-muted-foreground">
																{formatDateTime(alarm.timestamp)}
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
											</div>
										) : (
											<div className="text-center py-6 text-muted-foreground">
												<AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-20" />
												<p>No recent alarms for this operator</p>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between">
										<CardTitle className="text-lg flex items-center gap-2">
											<Clock className="h-4 w-4 text-primary" />
											Activity Log
										</CardTitle>
										<Button variant="outline" size="sm">
											View All
										</Button>
									</CardHeader>
									<CardContent>
										{selectedOperatorDetails.activityLog &&
										selectedOperatorDetails.activityLog.length > 0 ? (
											<div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
												{selectedOperatorDetails.activityLog.map(
													(log, index) => (
														<div
															key={index}
															className="flex items-center justify-between p-2 rounded-md bg-muted/50">
															<div>
																<p className="text-sm font-medium">
																	{log.action}
																</p>
																<p className="text-xs text-muted-foreground">
																	{formatDateTime(log.timestamp)}
																</p>
																<p className="text-xs">{log.details}</p>
															</div>
														</div>
													)
												)}
											</div>
										) : (
											<div className="text-center py-6 text-muted-foreground">
												<Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
												<p>No activity logs available</p>
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							<div className="flex justify-between border-t pt-4">
								<div className="text-sm text-muted-foreground">
									<p>
										Created: {formatDate(selectedOperatorDetails.createdAt)}
									</p>
									{selectedOperatorDetails.lastActive && (
										<p>
											Last Active:{" "}
											{formatDateTime(selectedOperatorDetails.lastActive)}
										</p>
									)}
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() => {
											setIsViewDialogOpen(false);
											openEditDialog(selectedOperatorDetails);
										}}>
										<Edit className="h-4 w-4 mr-2" />
										Edit Operator
									</Button>
									<Button
										variant="default"
										className={
											selectedOperatorDetails.status === "ACTIVE"
												? "bg-red-600 hover:bg-red-700"
												: "bg-green-600 hover:bg-green-700"
										}
										onClick={() => {
											toggleOperatorStatus(selectedOperatorDetails.id);
											setIsViewDialogOpen(false);
										}}>
										{selectedOperatorDetails.status === "ACTIVE"
											? "Deactivate"
											: "Activate"}{" "}
										Operator
									</Button>
								</div>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Edit Operator Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Operator</DialogTitle>
						<DialogDescription>
							Update operator information and assignments
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Full Name *</Label>
								<Input
									id="edit-name"
									value={editOperator.name}
									onChange={(e) =>
										setEditOperator({ ...editOperator, name: e.target.value })
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-operatorType">Operator Type</Label>
								<Select
									value={editOperator.operatorType}
									onValueChange={(value) =>
										setEditOperator({ ...editOperator, operatorType: value })
									}>
									<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
										<SelectValue placeholder="Select operator type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="OFFICE">Office Operator</SelectItem>
										<SelectItem value="FIELD">Field Operator</SelectItem>
										<SelectItem value="POLICE">Police Operator</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-email">Email *</Label>
							<Input
								id="edit-email"
								type="email"
								value={editOperator.email}
								onChange={(e) =>
									setEditOperator({ ...editOperator, email: e.target.value })
								}
								className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-phone">Phone Number *</Label>
							<Input
								id="edit-phone"
								value={editOperator.phone}
								onChange={(e) =>
									setEditOperator({ ...editOperator, phone: e.target.value })
								}
								className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Assigned Branches</Label>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 text-xs"
									onClick={() =>
										setEditOperator({ ...editOperator, assignedBranches: [] })
									}>
									Clear All
								</Button>
							</div>
							<div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
								{userBranches.length > 0 ? (
									userBranches.map((branch) => (
										<div
											key={branch.id}
											className="flex items-center space-x-2">
											<input
												type="checkbox"
												id={`edit-branch-${branch.id}`}
												checked={editOperator.assignedBranches.includes(
													branch.id
												)}
												onChange={(e) => {
													if (e.target.checked) {
														setEditOperator({
															...editOperator,
															assignedBranches: [
																...editOperator.assignedBranches,
																branch.id,
															],
														});
													} else {
														setEditOperator({
															...editOperator,
															assignedBranches:
																editOperator.assignedBranches.filter(
																	(id) => id !== branch.id
																),
														});
													}
												}}
												className="rounded border-gray-300"
											/>
											<Label
												htmlFor={`edit-branch-${branch.id}`}
												className="text-sm">
												{branch.name} - {branch.location}
											</Label>
										</div>
									))
								) : (
									<p className="text-sm text-muted-foreground">
										No branches available for assignment
									</p>
								)}
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
							onClick={handleEditOperator}
							disabled={isSubmitting}
							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								"Update Operator"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
