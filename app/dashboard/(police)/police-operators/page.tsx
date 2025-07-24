"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
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
	Search,
	UserX,
	Loader2,
	AlertTriangle,
	UserCog,
	Trash2,
	ShieldIcon,
	Activity,
	User,
} from "lucide-react";
import { apiService } from "@/lib/api-operator-service";

// Types based on Prisma schema
interface UserType {
	id: string;
	email: string;
	phone: string;
	name: string;
	role: "SUPER_ADMIN" | "OFFICE_MANAGER" | "POLICE_MANAGER" | "OPERATOR";
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
	operatorType?: "POLICE";
	companyId?: string;
	managedById?: string;
	createdAt: string;
	updatedAt: string;
	company?: {
		id: string;
		name: string;
	};
	managedBy?: {
		id: string;
		name: string;
	};
	_count?: {
		managedUsers: number;
		createdAlarms: number;
		createdReports: number;
	};
}

interface Company {
	id: string;
	name: string;
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

interface CreateOperatorData {
	name: string;
	email: string;
	password: string;
	operatorType: "POLICE";
	phone: string;
	// companyId: string;
	// managedById?: string;
}

interface UpdateOperatorData {
	name: string;
	email: string;
	operatorType: "POLICE";
	phone: string;
	// companyId: string;
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export default function OperatorsManagementPage() {
	const router = useRouter();
	const [operators, setOperators] = useState<UserType[]>([]);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [managers, setManagers] = useState<UserType[]>([]);
	const [filteredOperators, setFilteredOperators] = useState<UserType[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [companyFilter, setCompanyFilter] = useState<string>("all");

	// Dialog states
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState<UserType | null>(
		null
	);

	// Form data
	const [createForm, setCreateForm] = useState<CreateOperatorData>({
		name: "",
		email: "",
		password: "",
		phone: "",
		operatorType: "POLICE",
	});

	const [editForm, setEditForm] = useState<UpdateOperatorData>({
		name: "",
		email: "",
		phone: "",
		operatorType: "POLICE",
		status: "ACTIVE",
	});

	const { toast } = useToast();

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		filterOperators();
	}, [operators, searchTerm, statusFilter, typeFilter, companyFilter]);

	const fetchData = async () => {
		try {
			setLoading(true);

			// Use real API calls instead of mock data
			const [operatorsRes, companiesRes, managersRes] = await Promise.all([
				apiService.operators.getAll(),
				apiService.companies.getAll({ status: "ACTIVE" }),
				apiService.managers.getAll(),
			]);

			console.log({
				operatorsRes,
				companiesRes,
			});

			setOperators(operatorsRes.users || operatorsRes);
			setCompanies(companiesRes.companies || companiesRes);
			setManagers(managersRes.users || managersRes);
		} catch (error) {
			console.error("Failed to fetch data:", error);
			toast({
				title: "Error",
				description: "Failed to load operators data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const filterOperators = () => {
		let filtered = operators;
		console.log({
			filtered,
		});

		// Search filter
		if (searchTerm) {
			filtered = filtered.filter(
				(op) =>
					op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					op.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
					op.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Status filter
		if (statusFilter !== "all") {
			filtered = filtered.filter(
				(op) => op.status === statusFilter.toUpperCase()
			);
		}

		// Type filter
		if (typeFilter !== "all") {
			filtered = filtered.filter(
				(op) => op.operatorType === typeFilter.toUpperCase()
			);
		}

		// Company filter
		if (companyFilter !== "all") {
			filtered = filtered.filter((op) => op.companyId === companyFilter);
		}

		setFilteredOperators(filtered);
	};

	const handleCreateOperator = async () => {
		if (!validateForm(createForm)) return;

		setIsSubmitting(true);
		try {
			console.log("Creating operator with data:", createForm);
			const response = await apiService.operators.create(createForm as any);
			console.log({ response });
			setOperators([(response as any).user, ...operators]);
			setCreateForm({
				name: "",
				email: "",
				password: "",
				phone: "",
				operatorType: "POLICE",
				// companyId: "",
				// managedById: "",
			});
			setIsCreateDialogOpen(false);
			toast({
				title: "Success",
				description: "Operator created successfully",
			});

			// Redirect to alarms list or dashboard
			setTimeout(() => {
				router.push("/dashboard/police-operators");
			}, 2000);
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to create operator",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateOperator = async () => {
		if (!selectedOperator || !validateForm(editForm, false)) return;

		setIsSubmitting(true);
		try {
			const response = await apiService.operators.update(
				selectedOperator.id,
				editForm as any
			);
			setOperators(
				operators.map((op) => (op.id === selectedOperator.id ? response : op))
			);
			setIsEditDialogOpen(false);
			toast({
				title: "Success",
				description: "Operator updated successfully",
			});
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to update operator",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteOperator = async (operatorId: string) => {
		try {
			await apiService.operators.delete(operatorId);
			setOperators(operators.filter((op) => op.id !== operatorId));
			toast({
				title: "Success",
				description: "Operator deleted successfully",
			});
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to delete operator",
				variant: "destructive",
			});
		}
	};

	const handleStatusToggle = async (
		operatorId: string,
		newStatus: "ACTIVE" | "INACTIVE"
	) => {
		try {
			const response = await apiService.operators.updateStatus(
				operatorId,
				newStatus
			);
			setOperators(
				operators.map((op) =>
					op.id === operatorId ? { ...op, status: newStatus } : op
				)
			);
			toast({
				title: "Success",
				description: `Operator ${newStatus.toLowerCase()} successfully`,
			});
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to update operator status",
				variant: "destructive",
			});
		}
	};

	const validateForm = (data: any, isCreate = true) => {
		if (!data.name || !data.email || !data.operatorType || !data.phone) {
			toast({
				title: "Validation Error",
				description: "Please fill in all required fields",
				variant: "destructive",
			});
			return false;
		}

		if (isCreate && !data.password) {
			toast({
				title: "Validation Error",
				description: "Password is required",
				variant: "destructive",
			});
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			toast({
				title: "Validation Error",
				description: "Please enter a valid email address",
				variant: "destructive",
			});
			return false;
		}

		return true;
	};

	const openEditDialog = (operator: UserType) => {
		setSelectedOperator(operator);
		setEditForm({
			name: operator.name,
			email: operator.email,
			phone: operator.phone || "",

			operatorType: operator.operatorType || "POLICE",
			// companyId: operator.companyId || "",
			status: operator.status,
		});
		setIsEditDialogOpen(true);
	};

	const openViewDialog = (operator: UserType) => {
		setSelectedOperator(operator);
		setIsViewDialogOpen(true);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
			case "INACTIVE":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
			case "SUSPENDED":
				return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "OFFICE":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
			case "POLICE":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex justify-between items-center">
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid gap-4 md:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-16 mb-2" />
								<Skeleton className="h-3 w-20" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const activeOperators = filteredOperators.filter(
		(op) => op.status === "ACTIVE"
	);
	const inactiveOperators = filteredOperators.filter(
		(op) => op.status === "INACTIVE"
	);
	const suspendedOperators = filteredOperators.filter(
		(op) => op.status === "SUSPENDED"
	);
	// const officeOperators = filteredOperators.filter(
	// 	(op) => op.operatorType === "POLICE"
	// );
	const policeOperators = filteredOperators.filter(
		(op) => op.operatorType === "POLICE"
	);

	return (
		<div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 min-h-screen">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
						Police Operators Management
					</h1>
					<p className="text-muted-foreground">
						Manage security operators across all companies
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
							<Plus className="h-4 w-4 mr-2" />
							Create Operator
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Operator</DialogTitle>
							<DialogDescription>
								Add a new security operator to the system
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name *</Label>
									<Input
										id="name"
										value={createForm.name}
										onChange={(e) =>
											setCreateForm({ ...createForm, name: e.target.value })
										}
										placeholder="Enter full name"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email Address *</Label>
									<Input
										id="email"
										type="email"
										value={createForm.email}
										onChange={(e) =>
											setCreateForm({ ...createForm, email: e.target.value })
										}
										placeholder="operator@company.com"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number *</Label>
									<Input
										id="phone"
										value={createForm.phone}
										onChange={(e) =>
											setCreateForm({ ...createForm, phone: e.target.value })
										}
										placeholder="+251911123456"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">Password *</Label>
									<Input
										id="password"
										type="password"
										value={createForm.password}
										onChange={(e) =>
											setCreateForm({ ...createForm, password: e.target.value })
										}
										placeholder="Minimum 8 characters"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="operatorType">Operator Type *</Label>
									<Select
										value={createForm.operatorType}
										onValueChange={(value: "POLICE") =>
											setCreateForm({ ...createForm, operatorType: value })
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{/* <SelectItem value="OFFICE">Office Operator</SelectItem> */}
											<SelectItem value="POLICE">Police Operator</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* <div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="company">Company *</Label>
									<Select
										value={createForm.companyId}
										onValueChange={(value) =>
											setCreateForm({ ...createForm, companyId: value })
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select company" />
										</SelectTrigger>
										<SelectContent>
											{companies
												.filter((c) => c.status === "ACTIVE")
												.map((company) => (
													<SelectItem key={company.id} value={company.id}>
														{company.name}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="manager">Manager (Optional)</Label>
									<Select
										value={createForm.managedById}
										onValueChange={(value) =>
											setCreateForm({ ...createForm, managedById: value })
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select manager" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No Manager</SelectItem>
											{managers
												.filter((m) => m.status === "ACTIVE")
												.map((manager) => (
													<SelectItem key={manager.id} value={manager.id}>
														{manager.name} ({manager.role.replace("_", " ")})
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</div> */}
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleCreateOperator} disabled={isSubmitting}>
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

			{/* Stats Cards */}
			{/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
							Total Operators
						</CardTitle>
						<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
							{operators.length}
						</div>
						<p className="text-xs text-blue-600 dark:text-blue-400">
							{activeOperators.length} active, {inactiveOperators.length}{" "}
							inactive
						</p>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
							Active Operators
						</CardTitle>
						<UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-900 dark:text-green-100">
							{activeOperators.length}
						</div>
						<p className="text-xs text-green-600 dark:text-green-400">
							Currently operational
						</p>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
							Office Operators
						</CardTitle>
						<Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
							{officeOperators.length}
						</div>
						<p className="text-xs text-purple-600 dark:text-purple-400">
							Office-based security
						</p>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
							Police Operators
						</CardTitle>
						<ShieldIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
							{policeOperators.length}
						</div>
						<p className="text-xs text-indigo-600 dark:text-indigo-400">
							Police coordination
						</p>
					</CardContent>
				</Card>
			</div> */}

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search operators by name, email, or company..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
					/>
				</div>
				<div className="flex gap-2">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-32 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="suspended">Suspended</SelectItem>
						</SelectContent>
					</Select>

					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger className="w-32 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="office">Office</SelectItem>
							<SelectItem value="police">Police</SelectItem>
						</SelectContent>
					</Select>

					<Select value={companyFilter} onValueChange={setCompanyFilter}>
						<SelectTrigger className="w-48 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Companies</SelectItem>
							{companies.map((company) => (
								<SelectItem key={company.id} value={company.id}>
									{company.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Operators List */}
			<Tabs defaultValue="all" className="space-y-4">
				<TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
					<TabsTrigger value="all">
						All Operators ({filteredOperators.length})
					</TabsTrigger>
					<TabsTrigger value="active">
						Active ({activeOperators.length})
					</TabsTrigger>
					<TabsTrigger value="inactive">
						Inactive ({inactiveOperators.length})
					</TabsTrigger>
					<TabsTrigger value="suspended">
						Suspended ({suspendedOperators.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					{filteredOperators.length === 0 ? (
						<Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Users className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">No operators found</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "Create your first operator to get started"}
								</p>
								<Button onClick={() => setIsCreateDialogOpen(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Create Operator
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{filteredOperators.map((operator) => (
								<Card
									key={operator.id}
									className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div
													className={`p-3 rounded-lg ${
														operator.status === "ACTIVE"
															? "bg-green-100 dark:bg-green-900/20"
															: operator.status === "SUSPENDED"
															? "bg-red-100 dark:bg-red-900/20"
															: "bg-gray-100 dark:bg-gray-800"
													}`}>
													{operator.operatorType === "POLICE" ? (
														<ShieldIcon
															className={`h-5 w-5 ${
																operator.status === "ACTIVE"
																	? "text-green-600 dark:text-green-400"
																	: operator.status === "SUSPENDED"
																	? "text-red-600 dark:text-red-400"
																	: "text-gray-600 dark:text-gray-400"
															}`}
														/>
													) : (
														<Building
															className={`h-5 w-5 ${
																operator.status === "ACTIVE"
																	? "text-green-600 dark:text-green-400"
																	: operator.status === "SUSPENDED"
																	? "text-red-600 dark:text-red-400"
																	: "text-gray-600 dark:text-gray-400"
															}`}
														/>
													)}
												</div>
												<div>
													<h4 className="font-semibold text-lg">
														{operator.name}
													</h4>
													<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
														<span className="flex items-center">
															<Mail className="h-3 w-3 mr-1" />
															{operator.email}
														</span>
														<span className="flex items-center">
															<Building className="h-3 w-3 mr-1" />
															{operator.company?.name}
														</span>
													</div>
													<div className="flex flex-wrap items-center gap-2 mt-2">
														<Badge className={getStatusColor(operator.status)}>
															{operator.status}
														</Badge>
														<Badge
															className={getTypeColor(
																operator.operatorType || ""
															)}>
															{operator.operatorType} Operator
														</Badge>
														{operator.managedBy && (
															<Badge variant="outline" className="text-xs">
																Managed by {operator.managedBy.name}
															</Badge>
														)}
													</div>
												</div>
											</div>

											<div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
												<div className="text-right hidden sm:block">
													<div className="flex space-x-4 text-sm"></div>
												</div>

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
														onClick={() =>
															handleStatusToggle(
																operator.id,
																operator.status === "ACTIVE"
																	? "INACTIVE"
																	: "ACTIVE"
															)
														}
														className={
															operator.status === "ACTIVE"
																? "hover:bg-red-50 dark:hover:bg-red-950/20"
																: "hover:bg-green-50 dark:hover:bg-green-950/20"
														}>
														{operator.status === "ACTIVE" ? (
															<UserX className="h-4 w-4" />
														) : (
															<UserCheck className="h-4 w-4" />
														)}
													</Button>
													{/* <AlertDialog>
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
																	Are you sure you want to delete "
																	{operator.name}"? This action cannot be
																	undone.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() =>
																		handleDeleteOperator(operator.id)
																	}
																	className="bg-red-600 hover:bg-red-700">
																	Delete
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog> */}
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
					<div className="space-y-4">
						{activeOperators.map((operator) => (
							<Card
								key={operator.id}
								className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
												{operator.operatorType === "POLICE" ? (
													<ShieldIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
												) : (
													<Building className="h-5 w-5 text-green-600 dark:text-green-400" />
												)}
											</div>
											<div>
												<h4 className="font-semibold text-lg">
													{operator.name}
												</h4>
												<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
													<span className="flex items-center">
														<Mail className="h-3 w-3 mr-1" />
														{operator.email}
													</span>
													<span className="flex items-center">
														<Building className="h-3 w-3 mr-1" />
														{operator.company?.name}
													</span>
												</div>
												<div className="flex flex-wrap items-center gap-2 mt-2">
													<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
														ACTIVE
													</Badge>
													<Badge
														className={getTypeColor(
															operator.operatorType || ""
														)}>
														{operator.operatorType} Operator
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex space-x-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openViewDialog(operator)}>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => openEditDialog(operator)}>
												<Edit className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="inactive" className="space-y-4">
					<div className="space-y-4">
						{inactiveOperators.map((operator) => (
							<Card
								key={operator.id}
								className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-400 opacity-75">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
												{operator.operatorType === "POLICE" ? (
													<ShieldIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
												) : (
													<Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
												)}
											</div>
											<div>
												<h4 className="font-semibold text-lg">
													{operator.name}
												</h4>
												<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
													<span className="flex items-center">
														<Mail className="h-3 w-3 mr-1" />
														{operator.email}
													</span>
													<span className="flex items-center">
														<Building className="h-3 w-3 mr-1" />
														{operator.company?.name}
													</span>
												</div>
												<div className="flex flex-wrap items-center gap-2 mt-2">
													<Badge variant="secondary">INACTIVE</Badge>
													<Badge
														className={getTypeColor(
															operator.operatorType || ""
														)}>
														{operator.operatorType} Operator
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex space-x-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openViewDialog(operator)}>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleStatusToggle(operator.id, "ACTIVE")
												}
												className="hover:bg-green-50 dark:hover:bg-green-950/20">
												Activate
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="suspended" className="space-y-4">
					<div className="space-y-4">
						{suspendedOperators.map((operator) => (
							<Card
								key={operator.id}
								className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
												<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
											</div>
											<div>
												<h4 className="font-semibold text-lg">
													{operator.name}
												</h4>
												<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
													<span className="flex items-center">
														<Mail className="h-3 w-3 mr-1" />
														{operator.email}
													</span>
													<span className="flex items-center">
														<Building className="h-3 w-3 mr-1" />
														{operator.company?.name}
													</span>
												</div>
												<div className="flex flex-wrap items-center gap-2 mt-2">
													<Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
														SUSPENDED
													</Badge>
													<Badge
														className={getTypeColor(
															operator.operatorType || ""
														)}>
														{operator.operatorType} Operator
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex space-x-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openViewDialog(operator)}>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleStatusToggle(operator.id, "ACTIVE")
												}
												className="hover:bg-green-50 dark:hover:bg-green-950/20">
												Reactivate
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* View Operator Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Operator Details
						</DialogTitle>
						<DialogDescription>
							Comprehensive information about the operator
						</DialogDescription>
					</DialogHeader>

					{selectedOperator && (
						<div className="space-y-6 py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div
										className={`p-4 rounded-full ${
											selectedOperator.status === "ACTIVE"
												? "bg-green-100 dark:bg-green-900/20"
												: selectedOperator.status === "SUSPENDED"
												? "bg-red-100 dark:bg-red-900/20"
												: "bg-gray-100 dark:bg-gray-800"
										}`}>
										{selectedOperator.operatorType === "POLICE" ? (
											<ShieldIcon
												className={`h-8 w-8 ${
													selectedOperator.status === "ACTIVE"
														? "text-green-600 dark:text-green-400"
														: selectedOperator.status === "SUSPENDED"
														? "text-red-600 dark:text-red-400"
														: "text-gray-600 dark:text-gray-400"
												}`}
											/>
										) : (
											<Building
												className={`h-8 w-8 ${
													selectedOperator.status === "ACTIVE"
														? "text-green-600 dark:text-green-400"
														: selectedOperator.status === "SUSPENDED"
														? "text-red-600 dark:text-red-400"
														: "text-gray-600 dark:text-gray-400"
												}`}
											/>
										)}
									</div>
									<div>
										<h2 className="text-2xl font-bold">
											{selectedOperator.name}
										</h2>
										<p className="text-muted-foreground">
											{selectedOperator.email}
										</p>
									</div>
								</div>
								<Badge className={getStatusColor(selectedOperator.status)}>
									{selectedOperator.status}
								</Badge>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<UserCog className="h-4 w-4" />
											Basic Information
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="text-sm text-muted-foreground">
													Role
												</Label>
												<p className="font-medium">{selectedOperator.role}</p>
											</div>
											<div>
												<Label className="text-sm text-muted-foreground">
													Type
												</Label>
												<p className="font-medium">
													{selectedOperator.operatorType} Operator
												</p>
											</div>
										</div>
										<div>
											<Label className="text-sm text-muted-foreground">
												Company
											</Label>
											<p className="font-medium">
												{selectedOperator.company?.name}
											</p>
										</div>
										{selectedOperator.managedBy && (
											<div>
												<Label className="text-sm text-muted-foreground">
													Manager
												</Label>
												<p className="font-medium">
													{selectedOperator.managedBy.name}
												</p>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<Activity className="h-4 w-4" />
											Activity Statistics
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<Label className="text-sm text-muted-foreground">
												Member Since
											</Label>
											<p className="font-medium">
												{formatDate(selectedOperator.createdAt)}
											</p>
										</div>
										<div>
											<Label className="text-sm text-muted-foreground">
												Last Updated
											</Label>
											<p className="font-medium">
												{formatDate(selectedOperator.updatedAt)}
											</p>
										</div>
									</CardContent>
								</Card>
							</div>

							<div className="flex justify-between border-t pt-4">
								<div className="text-sm text-muted-foreground">
									<p>Created: {formatDate(selectedOperator.createdAt)}</p>
									<p>Last Updated: {formatDate(selectedOperator.updatedAt)}</p>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() => {
											setIsViewDialogOpen(false);
											openEditDialog(selectedOperator);
										}}>
										<Edit className="h-4 w-4 mr-2" />
										Edit Operator
									</Button>
									<Button
										variant={
											selectedOperator.status === "ACTIVE"
												? "destructive"
												: "default"
										}
										onClick={() => {
											handleStatusToggle(
												selectedOperator.id,
												selectedOperator.status === "ACTIVE"
													? "INACTIVE"
													: "ACTIVE"
											);
											setIsViewDialogOpen(false);
										}}>
										{selectedOperator.status === "ACTIVE"
											? "Deactivate"
											: "Activate"}{" "}
										Operator
									</Button>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Edit Operator Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Operator</DialogTitle>
						<DialogDescription>
							Update operator information and settings
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Full Name *</Label>
								<Input
									id="edit-name"
									value={editForm.name}
									onChange={(e) =>
										setEditForm({ ...editForm, name: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-email">Email Address *</Label>
								<Input
									id="edit-email"
									type="email"
									value={editForm.email}
									onChange={(e) =>
										setEditForm({ ...editForm, email: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-operatorType">Operator Type *</Label>
								<Select
									value={editForm.operatorType}
									onValueChange={(value: "POLICE") =>
										setEditForm({ ...editForm, operatorType: value })
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{/* <SelectItem value="OFFICE">Office Operator</SelectItem> */}
										<SelectItem value="POLICE">Police Operator</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-status">Status *</Label>
								<Select
									value={editForm.status}
									onValueChange={(value: "ACTIVE" | "INACTIVE" | "SUSPENDED") =>
										setEditForm({ ...editForm, status: value })
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ACTIVE">Active</SelectItem>
										<SelectItem value="INACTIVE">Inactive</SelectItem>
										<SelectItem value="SUSPENDED">Suspended</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							{/* <Label htmlFor="edit-company">Company *</Label> */}
							<div className="space-y-2">
								<Label htmlFor="edit-phone">Phone Number *</Label>
								<Input
									id="edit-phone"
									value={editForm.phone}
									onChange={(e) =>
										setEditForm({ ...editForm, phone: e.target.value })
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							{/* <Select
								value={editForm.companyId}
								onValueChange={(value) =>
									setEditForm({ ...editForm, companyId: value })
								}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{companies
										.filter((c) => c.status === "ACTIVE")
										.map((company) => (
											<SelectItem key={company.id} value={company.id}>
												{company.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select> */}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleUpdateOperator} disabled={isSubmitting}>
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
