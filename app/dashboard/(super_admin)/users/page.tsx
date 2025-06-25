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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api-service";
import {
	Users,
	Plus,
	Edit,
	MoreHorizontal,
	Building,
	Shield,
	Search,
	Mail,
	Phone,
	Loader2,
	Eye,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

interface User {
	id: string;
	name: string;
	email: string;
	phone: string;
	role: "OFFICE_MANAGER" | "POLICE_MANAGER" | "OPERATOR";
	operatorType?: "OFFICE" | "POLICE";
	companyId?: string;
	companyName?: string;
	company?: {
		id: string;
		name: string;
		type: string;
		status: string;
	};
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
	createdAt: string;
	lastLogin?: string;
	permissions: string[];
}

interface Company {
	id: string;
	name: string;
	type: string;
	status: "ACTIVE" | "INACTIVE";
}

interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

const rolePermissions = {
	OFFICE_MANAGER: [
		"manage_branches",
		"manage_operators",
		"create_alarms",
		"view_reports",
		"manage_settings",
	],
	POLICE_MANAGER: [
		"manage_reports",
		"manage_officers",
		"view_analytics",
		"handle_alarms",
		"create_cases",
	],
};

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo>({
		page: 1,
		limit: 10,
		total: 0,
		pages: 0,
		hasNext: false,
		hasPrev: false,
	});
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterRole, setFilterRole] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [activeTab, setActiveTab] = useState("all");
	const { toast } = useToast();

	const [newUser, setNewUser] = useState({
		name: "",
		email: "",
		phone: "",
		role: "" as "OFFICE_MANAGER" | "POLICE_MANAGER" | "",
		companyId: "",
		password: "",
		confirmPassword: "",
		// permissions: [] as string[],
	});

	const [passwordData, setPasswordData] = useState({
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		fetchUsers();
		fetchCompanies();
	}, [pagination.page, pagination.limit, searchTerm, filterRole, filterStatus]);

	const fetchUsers = async (page = pagination.page) => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: page.toString(),
				limit: pagination.limit.toString(),
			});

			if (searchTerm) params.append("search", searchTerm);
			if (filterRole !== "all") params.append("role", filterRole);
			if (filterStatus !== "all") params.append("status", filterStatus);

			const response = await apiService.get(`/users?${params.toString()}`);
			console.log("Fetched users:", response);

			// Process users to include company name from company object
			const processedUsers = (response as any).users.map((user: any) => ({
				...user,
				companyName: user.company?.name || user.companyName,
			}));

			setUsers(processedUsers);
			setPagination((response as any).pagination);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch users",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchCompanies = async () => {
		try {
			const response = await apiService.get("/companies");
			console.log({
				companies: (response as any).companies,
			});
			setCompanies((response as any).companies);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch companies",
				variant: "destructive",
			});
		}
	};

	const handleCreateUser = async () => {
		// Enhanced validation for required fields
		if (
			!newUser.name ||
			!newUser.email ||
			!newUser.phone ||
			!newUser.role ||
			!newUser.companyId ||
			!newUser.password
		) {
			toast({
				title: "Validation Error",
				description:
					"Please fill in all required fields: Name, Email, Phone, Role, Company, and Password",
				variant: "destructive",
			});
			return;
		}

		if (newUser.password !== newUser.confirmPassword) {
			toast({
				title: "Error",
				description: "Passwords do not match",
				variant: "destructive",
			});
			return;
		}

		try {
			setCreating(true);
			const userData = {
				name: newUser.name,
				email: newUser.email,
				phone: newUser.phone,
				role: newUser.role.toUpperCase(),
				companyId: newUser.companyId,
				password: newUser.password,
				permissions: rolePermissions[newUser.role],
			};

			await apiService.post("/users", userData);

			toast({
				title: "Success",
				description: "User created successfully",
			});

			setNewUser({
				name: "",
				email: "",
				phone: "",
				role: "",
				companyId: "",
				password: "",
				confirmPassword: "",
				// permissions: [],
			});
			setIsCreateDialogOpen(false);
			fetchUsers(1); // Reset to first page after creating
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.message || "Failed to create user",
				variant: "destructive",
			});
		} finally {
			setCreating(false);
		}
	};

	const handleUpdateUser = async () => {
		if (!selectedUser) return;

		try {
			setUpdating(true);
			await apiService.put(`/users/${selectedUser.id}`, {
				name: selectedUser.name,
				email: selectedUser.email,
				phone: selectedUser.phone,
				status: selectedUser.status,
				companyId: selectedUser.companyId,
			});

			toast({
				title: "Success",
				description: "User updated successfully",
			});

			setIsEditDialogOpen(false);
			setSelectedUser(null);
			fetchUsers();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.message || "Failed to update user",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const handlePasswordChange = async () => {
		if (!selectedUser || !passwordData.newPassword) return;
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast({
				title: "Error",
				description: "Passwords do not match",
				variant: "destructive",
			});
			return;
		}

		try {
			await apiService.put(`/users/${selectedUser.id}/password`, {
				newPassword: passwordData.newPassword,
			});

			toast({
				title: "Success",
				description: "Password updated successfully",
			});

			setPasswordData({ newPassword: "", confirmPassword: "" });
			setIsPasswordDialogOpen(false);
			setSelectedUser(null);
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to update password",
				variant: "destructive",
			});
		}
	};

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= pagination.pages) {
			setPagination((prev) => ({ ...prev, page: newPage }));
			fetchUsers(newPage);
		}
	};

	const handleLimitChange = (newLimit: string) => {
		const limit = Number.parseInt(newLimit);
		setPagination((prev) => ({ ...prev, limit, page: 1 }));
		fetchUsers(1);
	};

	// Debounced search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (pagination.page !== 1) {
				setPagination((prev) => ({ ...prev, page: 1 }));
			}
			fetchUsers(1);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	const filteredUsers = users.filter((user) => {
		if (activeTab === "all") return true;
		if (activeTab === "OFFICE_MANAGER") return user.role === "OFFICE_MANAGER";
		if (activeTab === "POLICE_MANAGER") return user.role === "POLICE_MANAGER";
		if (activeTab === "POLICE_OPERATORS")
			return user.role === "OPERATOR" && user.operatorType === "POLICE";
		if (activeTab === "OFFICE_OPERATORS")
			return user.role === "OPERATOR" && user.operatorType === "OFFICE";
		return true;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-green-100 text-green-800";
			case "INACTIVE":
				return "bg-gray-100 text-gray-800";
			case "SUSPENDED":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getRoleColor = (role: string) => {
		switch (role) {
			case "OFFICE_MANAGER":
				return "bg-blue-100 text-blue-800";
			case "POLICE_MANAGER":
				return "bg-green-100 text-green-800";
			case "OPERATOR":
				return "bg-purple-100 text-purple-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const renderUserCard = (user: User) => (
		<Card key={user.id}>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<div
							className={`p-2 rounded-lg ${
								user.role === "OFFICE_MANAGER"
									? "bg-blue-100"
									: user.role === "POLICE_MANAGER"
									? "bg-green-100"
									: "bg-purple-100"
							}`}>
							{user.role === "OFFICE_MANAGER" ? (
								<Building className="h-5 w-5 text-blue-600" />
							) : user.role === "POLICE_MANAGER" ? (
								<Shield className="h-5 w-5 text-green-600" />
							) : (
								<Users className="h-5 w-5 text-purple-600" />
							)}
						</div>
						<div>
							<h4 className="font-medium">{user.name}</h4>
							<div className="flex items-center space-x-4 text-sm text-gray-500">
								<span className="flex items-center">
									<Mail className="h-3 w-3 mr-1" />
									{user.email}
								</span>
								{user.phone && (
									<span className="flex items-center">
										<Phone className="h-3 w-3 mr-1" />
										{user.phone}
									</span>
								)}
							</div>
							<div className="flex items-center space-x-2 mt-2">
								<Badge className={getRoleColor(user.role)}>
									{user.role === "OFFICE_MANAGER"
										? "Office Manager"
										: user.role === "POLICE_MANAGER"
										? "Police Manager"
										: user.operatorType === "OFFICE"
										? "Office Operator"
										: "Police Operator"}
								</Badge>
								<Badge className={getStatusColor(user.status)}>
									{user.status}
								</Badge>
								{user.companyName && (
									<Badge variant="outline">{user.companyName}</Badge>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<div className="text-right text-xs text-gray-500">
							<p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
							{user.lastLogin && (
								<p>Last login: {formatDateTime(user.lastLogin)}</p>
							)}
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => {
										setSelectedUser(user);
										setIsViewDialogOpen(true);
									}}>
									<Eye className="h-4 w-4 mr-2" />
									View
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setSelectedUser(user);
										setIsEditDialogOpen(true);
									}}>
									<Edit className="h-4 w-4 mr-2" />
									Edit
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	const PaginationControls = () => (
		<div className="flex items-center justify-between px-2">
			<div className="flex items-center space-x-2">
				<p className="text-sm text-muted-foreground">
					Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
					{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
					{pagination.total} results
				</p>
				<Select
					value={pagination.limit.toString()}
					onValueChange={handleLimitChange}>
					<SelectTrigger className="w-20">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="5">5</SelectItem>
						<SelectItem value="10">10</SelectItem>
						<SelectItem value="20">20</SelectItem>
						<SelectItem value="50">50</SelectItem>
					</SelectContent>
				</Select>
				<span className="text-sm text-muted-foreground">per page</span>
			</div>

			<div className="flex items-center space-x-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(1)}
					disabled={!pagination.hasPrev}>
					<ChevronsLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.page - 1)}
					disabled={!pagination.hasPrev}>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<div className="flex items-center space-x-1">
					{Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
						const pageNum = Math.max(1, pagination.page - 2) + i;
						if (pageNum > pagination.pages) return null;

						return (
							<Button
								key={pageNum}
								variant={pageNum === pagination.page ? "default" : "outline"}
								size="sm"
								onClick={() => handlePageChange(pageNum)}
								className="w-8 h-8 p-0">
								{pageNum}
							</Button>
						);
					})}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.page + 1)}
					disabled={!pagination.hasNext}>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.pages)}
					disabled={!pagination.hasNext}>
					<ChevronsRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);

	if (loading && users.length === 0) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96 mt-2" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid gap-4 md:grid-cols-5">
					{[...Array(5)].map((_, i) => (
						<Card key={i}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-4" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-3 w-20 mt-1" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">User Management</h1>
					<p className="text-muted-foreground">
						Manage Office Managers, Police Managers, and Operators
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Create User
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Create New User</DialogTitle>
							<DialogDescription>
								Add a new Office Manager or Police Manager to the system
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name *</Label>
									<Input
										id="name"
										value={newUser.name}
										onChange={(e) =>
											setNewUser({ ...newUser, name: e.target.value })
										}
										placeholder="Enter full name"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email *</Label>
									<Input
										id="email"
										type="email"
										value={newUser.email}
										onChange={(e) =>
											setNewUser({ ...newUser, email: e.target.value })
										}
										placeholder="user@company.com"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number *</Label>
									<Input
										id="phone"
										value={newUser.phone}
										onChange={(e) =>
											setNewUser({ ...newUser, phone: e.target.value })
										}
										placeholder="+251911123456"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="role">Role *</Label>
									<Select
										value={newUser.role}
										onValueChange={(
											value: "OFFICE_MANAGER" | "POLICE_MANAGER"
										) => setNewUser({ ...newUser, role: value })}
										required>
										<SelectTrigger>
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="OFFICE_MANAGER">
												Office Manager
											</SelectItem>
											<SelectItem value="POLICE_MANAGER">
												Police Manager
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="company">Company *</Label>
								<Select
									value={newUser.companyId}
									onValueChange={(value) =>
										setNewUser({ ...newUser, companyId: value })
									}
									required>
									<SelectTrigger>
										<SelectValue placeholder="Select company" />
									</SelectTrigger>
									<SelectContent>
										{companies
											.filter((c: any) => c.status === "ACTIVE")
											.map((company) => (
												<SelectItem key={company.id} value={company.id}>
													{company.name} ({company.type})
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="password">Password *</Label>
									<Input
										id="password"
										type="password"
										value={newUser.password}
										onChange={(e) =>
											setNewUser({ ...newUser, password: e.target.value })
										}
										placeholder="Enter password"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm Password *</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={newUser.confirmPassword}
										onChange={(e) =>
											setNewUser({
												...newUser,
												confirmPassword: e.target.value,
											})
										}
										placeholder="Confirm password"
										required
									/>
								</div>
							</div>

							{newUser.role && (
								<div className="space-y-2">
									<Label>Default Permissions</Label>
									<div className="flex flex-wrap gap-2">
										{rolePermissions[newUser.role].map((permission) => (
											<Badge
												key={permission}
												variant="outline"
												className="text-xs">
												{permission.replace("_", " ")}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
								disabled={creating}>
								Cancel
							</Button>
							<Button
								onClick={handleCreateUser}
								disabled={
									!newUser.name ||
									!newUser.email ||
									!newUser.phone ||
									!newUser.role ||
									!newUser.companyId ||
									!newUser.password ||
									newUser.password !== newUser.confirmPassword ||
									creating
								}>
								{creating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create User"
								)}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-4 md:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{pagination.total}</div>
						<p className="text-xs text-muted-foreground">
							{users.filter((u) => u.status === "ACTIVE").length} active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Office Managers
						</CardTitle>
						<Building className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{users.filter((u) => u.role === "OFFICE_MANAGER").length}
						</div>
						<p className="text-xs text-muted-foreground">Managing companies</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Police Managers
						</CardTitle>
						<Shield className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{users.filter((u) => u.role === "POLICE_MANAGER").length}
						</div>
						<p className="text-xs text-muted-foreground">Handling security</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Police Operators
						</CardTitle>
						<Shield className="h-4 w-4 text-purple-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-600">
							{
								users.filter(
									(u) => u.role === "OPERATOR" && u.operatorType === "POLICE"
								).length
							}
						</div>
						<p className="text-xs text-muted-foreground">Police operations</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Office Operators
						</CardTitle>
						<Building className="h-4 w-4 text-orange-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">
							{
								users.filter(
									(u) => u.role === "OPERATOR" && u.operatorType === "OFFICE"
								).length
							}
						</div>
						<p className="text-xs text-muted-foreground">Office operations</p>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
			<div className="flex justify-between items-center space-x-4">
				<div className="flex space-x-2">
					<div className="relative">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search users..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8 w-64"
						/>
					</div>
					<Select value={filterRole} onValueChange={setFilterRole}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Filter by role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Roles</SelectItem>
							<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
							<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
							<SelectItem value="OPERATOR">Operators</SelectItem>
						</SelectContent>
					</Select>
					<Select value={filterStatus} onValueChange={setFilterStatus}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="ACTIVE">Active</SelectItem>
							<SelectItem value="INACTIVE">Inactive</SelectItem>
							<SelectItem value="SUSPENDED">Suspended</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* User List */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4">
				<TabsList>
					<TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
					<TabsTrigger value="OFFICE_MANAGER">
						Office Managers (
						{users.filter((u) => u.role === "OFFICE_MANAGER").length})
					</TabsTrigger>
					<TabsTrigger value="POLICE_MANAGER">
						Police Managers (
						{users.filter((u) => u.role === "POLICE_MANAGER").length})
					</TabsTrigger>
					<TabsTrigger value="POLICE_OPERATORS">
						Police Operators (
						{
							users.filter(
								(u) => u.role === "OPERATOR" && u.operatorType === "POLICE"
							).length
						}
						)
					</TabsTrigger>
					<TabsTrigger value="OFFICE_OPERATORS">
						Office Operators (
						{
							users.filter(
								(u) => u.role === "OPERATOR" && u.operatorType === "OFFICE"
							).length
						}
						)
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					<div className="grid gap-4">
						{loading && (
							<div className="text-center py-4">
								<Loader2 className="h-6 w-6 animate-spin mx-auto" />
							</div>
						)}
						{filteredUsers.map((user) => renderUserCard(user))}
					</div>
					<PaginationControls />
				</TabsContent>

				<TabsContent value="OFFICE_MANAGER" className="space-y-4">
					<div className="grid gap-4">
						{loading && (
							<div className="text-center py-4">
								<Loader2 className="h-6 w-6 animate-spin mx-auto" />
							</div>
						)}
						{filteredUsers.map((user) => renderUserCard(user))}
					</div>
					<PaginationControls />
				</TabsContent>

				<TabsContent value="POLICE_MANAGER" className="space-y-4">
					<div className="grid gap-4">
						{loading && (
							<div className="text-center py-4">
								<Loader2 className="h-6 w-6 animate-spin mx-auto" />
							</div>
						)}
						{filteredUsers.map((user) => renderUserCard(user))}
					</div>
					<PaginationControls />
				</TabsContent>

				<TabsContent value="POLICE_OPERATORS" className="space-y-4">
					<div className="grid gap-4">
						{loading && (
							<div className="text-center py-4">
								<Loader2 className="h-6 w-6 animate-spin mx-auto" />
							</div>
						)}
						{filteredUsers.map((user) => renderUserCard(user))}
					</div>
					<PaginationControls />
				</TabsContent>

				<TabsContent value="OFFICE_OPERATORS" className="space-y-4">
					<div className="grid gap-4">
						{loading && (
							<div className="text-center py-4">
								<Loader2 className="h-6 w-6 animate-spin mx-auto" />
							</div>
						)}
						{filteredUsers.map((user) => renderUserCard(user))}
					</div>
					<PaginationControls />
				</TabsContent>
			</Tabs>

			{/* View User Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>User Details</DialogTitle>
						<DialogDescription>
							View user information and details
						</DialogDescription>
					</DialogHeader>
					{selectedUser && (
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Full Name</Label>
									<div className="p-2 border-2 rounded-sm">
										{selectedUser.name}
									</div>
								</div>
								<div className="space-y-2">
									<Label>Email</Label>
									<div className="p-2 border-2 rounded-sm">
										{selectedUser.email}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Phone Number</Label>
									<div className="p-2 border-2 rounded-sm">
										{selectedUser.phone || "N/A"}
									</div>
								</div>
								<div className="space-y-2">
									<Label>Role</Label>
									<div className="p-2 border-2 rounded-sm">
										{selectedUser.role === "OFFICE_MANAGER"
											? "Office Manager"
											: selectedUser.role === "POLICE_MANAGER"
											? "Police Manager"
											: selectedUser.operatorType === "OFFICE"
											? "Office Operator"
											: "Police Operator"}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Status</Label>
									<div className="p-2 border-2 rounded-sm">
										<Badge className={getStatusColor(selectedUser.status)}>
											{selectedUser.status}
										</Badge>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Company</Label>
									<div className="p-2 border-2 rounded-sm">
										{selectedUser.companyName || "N/A"}
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Created At</Label>
								<div className="p-2 border-2 rounded-sm">
									{formatDateTime(selectedUser.createdAt)}
								</div>
							</div>

							{selectedUser.lastLogin && (
								<div className="space-y-2">
									<Label>Last Login</Label>
									<div className="p-2 border-2 rounded-sm">
										{formatDateTime(selectedUser.lastLogin)}
									</div>
								</div>
							)}
						</div>
					)}
					<div className="flex justify-end">
						<Button
							variant="outline"
							onClick={() => setIsViewDialogOpen(false)}>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit User Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit User</DialogTitle>
						<DialogDescription>
							Update user information and settings
						</DialogDescription>
					</DialogHeader>
					{selectedUser && (
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editName">Full Name</Label>
									<Input
										id="editName"
										value={selectedUser.name}
										onChange={(e) =>
											setSelectedUser({ ...selectedUser, name: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editEmail">Email</Label>
									<Input
										id="editEmail"
										type="email"
										value={selectedUser.email}
										onChange={(e) =>
											setSelectedUser({
												...selectedUser,
												email: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editPhone">Phone Number</Label>
									<Input
										id="editPhone"
										value={selectedUser.phone}
										onChange={(e) =>
											setSelectedUser({
												...selectedUser,
												phone: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editStatus">Status</Label>
									<Select
										value={selectedUser.status}
										onValueChange={(
											value: "ACTIVE" | "INACTIVE" | "SUSPENDED"
										) => setSelectedUser({ ...selectedUser, status: value })}>
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

							{(selectedUser.role === "OFFICE_MANAGER" ||
								selectedUser.operatorType === "OFFICE") && (
								<div className="space-y-2">
									<Label htmlFor="editCompany">Company</Label>
									<Select
										value={selectedUser.companyId || ""}
										onValueChange={(value) =>
											setSelectedUser({
												...selectedUser,
												companyId: value,
												companyName: companies.find((c) => c.id === value)
													?.name,
											})
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select company" />
										</SelectTrigger>
										<SelectContent>
											{companies
												.filter((c) => c.status === "ACTIVE")
												.map((company) => (
													<SelectItem key={company.id} value={company.id}>
														{company.name} ({company.type})
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>
					)}
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
							disabled={updating}>
							Cancel
						</Button>
						<Button onClick={handleUpdateUser} disabled={updating}>
							{updating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								"Update User"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Password Change Dialog */}
			<Dialog
				open={isPasswordDialogOpen}
				onOpenChange={setIsPasswordDialogOpen}>
				<DialogContent className="sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle>Change Password</DialogTitle>
						<DialogDescription>
							Set a new password for {selectedUser?.name}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="newPassword">New Password</Label>
							<Input
								id="newPassword"
								type="password"
								value={passwordData.newPassword}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										newPassword: e.target.value,
									})
								}
								placeholder="Enter new password"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmNewPassword">Confirm New Password</Label>
							<Input
								id="confirmNewPassword"
								type="password"
								value={passwordData.confirmPassword}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										confirmPassword: e.target.value,
									})
								}
								placeholder="Confirm new password"
							/>
						</div>
					</div>
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsPasswordDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handlePasswordChange}
							disabled={
								!passwordData.newPassword ||
								passwordData.newPassword !== passwordData.confirmPassword
							}>
							Change Password
						</Button>
					</div>
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
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// 	DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import { apiService } from "@/lib/api-service";
// import {
// 	Users,
// 	Plus,
// 	Edit,
// 	MoreHorizontal,
// 	Building,
// 	Shield,
// 	Search,
// 	UserCheck,
// 	UserX,
// 	Key,
// 	Mail,
// 	Phone,
// 	Loader2,
// } from "lucide-react";

// interface User {
// 	id: string;
// 	name: string;
// 	email: string;
// 	phone: string;
// 	role: "OFFICE_MANAGER" | "POLICE_MANAGER";
// 	companyId?: string;
// 	companyName?: string;
// 	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
// 	createdAt: string;
// 	lastLogin?: string;
// 	permissions: string[];
// }

// interface Company {
// 	id: string;
// 	name: string;
// 	type: string;
// 	status: "ACTIVE" | "INACTIVE";
// }

// const rolePermissions = {
// 	OFFICE_MANAGER: [
// 		"manage_branches",
// 		"manage_operators",
// 		"create_alarms",
// 		"view_reports",
// 		"manage_settings",
// 	],
// 	POLICE_MANAGER: [
// 		"manage_reports",
// 		"manage_officers",
// 		"view_analytics",
// 		"handle_alarms",
// 		"create_cases",
// 	],
// };

// export default function UsersPage() {
// 	const [users, setUsers] = useState<User[]>([]);
// 	const [companies, setCompanies] = useState<Company[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [creating, setCreating] = useState(false);
// 	const [updating, setUpdating] = useState(false);
// 	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
// 	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
// 	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
// 	const [selectedUser, setSelectedUser] = useState<User | null>(null);
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [filterRole, setFilterRole] = useState("all");
// 	const [filterStatus, setFilterStatus] = useState("all");
// 	const { toast } = useToast();

// 	const [newUser, setNewUser] = useState({
// 		name: "",
// 		email: "",
// 		phone: "",
// 		role: "" as "OFFICE_MANAGER" | "POLICE_MANAGER" | "",
// 		companyId: "",
// 		password: "",
// 		confirmPassword: "",
// 		permissions: [] as string[],
// 	});

// 	const [passwordData, setPasswordData] = useState({
// 		newPassword: "",
// 		confirmPassword: "",
// 	});

// 	useEffect(() => {
// 		fetchUsers();
// 		fetchCompanies();
// 	}, []);

// 	const fetchUsers = async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/users");
// 			console.log("Fetched users:", response);
// 			setUsers((response as any).users as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch users",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const fetchCompanies = async () => {
// 		try {
// 			const response = await apiService.get("/companies");
// 			console.log({
// 				companies: (response as any).companies,
// 			});
// 			setCompanies((response as any).companies);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch companies",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const handleCreateUser = async () => {
// 		if (!newUser.name || !newUser.email || !newUser.role || !newUser.password)
// 			return;
// 		if (newUser.password !== newUser.confirmPassword) {
// 			toast({
// 				title: "Error",
// 				description: "Passwords do not match",
// 				variant: "destructive",
// 			});
// 			return;
// 		}

// 		try {
// 			setCreating(true);
// 			const userData = {
// 				name: newUser.name,
// 				email: newUser.email,
// 				phone: newUser.phone,
// 				role: newUser.role.toUpperCase(),
// 				companyId: newUser.companyId || undefined,
// 				password: newUser.password,
// 				permissions: rolePermissions[newUser.role],
// 			};

// 			await apiService.post("/users", userData);

// 			toast({
// 				title: "Success",
// 				description: "User created successfully",
// 			});

// 			setNewUser({
// 				name: "",
// 				email: "",
// 				phone: "",
// 				role: "",
// 				companyId: "",
// 				password: "",
// 				confirmPassword: "",
// 				permissions: [],
// 			});
// 			setIsCreateDialogOpen(false);
// 			fetchUsers();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description: error.response?.data?.message || "Failed to create user",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setCreating(false);
// 		}
// 	};

// 	const handleUpdateUser = async () => {
// 		if (!selectedUser) return;

// 		try {
// 			setUpdating(true);
// 			await apiService.put(`/users/${selectedUser.id}`, {
// 				name: selectedUser.name,
// 				email: selectedUser.email,
// 				phone: selectedUser.phone,
// 				status: selectedUser.status,
// 				companyId: selectedUser.companyId,
// 			});

// 			toast({
// 				title: "Success",
// 				description: "User updated successfully",
// 			});

// 			setIsEditDialogOpen(false);
// 			setSelectedUser(null);
// 			fetchUsers();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description: error.response?.data?.message || "Failed to update user",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setUpdating(false);
// 		}
// 	};

// 	const handlePasswordChange = async () => {
// 		if (!selectedUser || !passwordData.newPassword) return;
// 		if (passwordData.newPassword !== passwordData.confirmPassword) {
// 			toast({
// 				title: "Error",
// 				description: "Passwords do not match",
// 				variant: "destructive",
// 			});
// 			return;
// 		}

// 		try {
// 			await apiService.put(`/users/${selectedUser.id}/password`, {
// 				newPassword: passwordData.newPassword,
// 			});

// 			toast({
// 				title: "Success",
// 				description: "Password updated successfully",
// 			});

// 			setPasswordData({ newPassword: "", confirmPassword: "" });
// 			setIsPasswordDialogOpen(false);
// 			setSelectedUser(null);
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description:
// 					error.response?.data?.message || "Failed to update password",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const toggleUserStatus = async (userId: string) => {
// 		try {
// 			const user = users.find((u) => u.id === userId);
// 			if (!user) return;

// 			const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
// 			await apiService.put(`/users/${userId}`, { status: newStatus });

// 			toast({
// 				title: "Success",
// 				description: `User ${
// 					newStatus === "ACTIVE" ? "activated" : "deactivated"
// 				} successfully`,
// 			});

// 			fetchUsers();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description:
// 					error.response?.data?.message || "Failed to update user status",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const suspendUser = async (userId: string) => {
// 		try {
// 			await apiService.put(`/users/${userId}`, { status: "suspended" });

// 			toast({
// 				title: "Success",
// 				description: "User suspended successfully",
// 			});

// 			fetchUsers();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description: error.response?.data?.message || "Failed to suspend user",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const filteredUsers = users.filter((user) => {
// 		const matchesSearch =
// 			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 			user.email.toLowerCase().includes(searchTerm.toLowerCase());
// 		const matchesRole = filterRole === "all" || user.role === filterRole;
// 		const matchesStatus =
// 			filterStatus === "all" || user.status === filterStatus;
// 		return matchesSearch && matchesRole && matchesStatus;
// 	});

// 	const getStatusColor = (status: string) => {
// 		switch (status) {
// 			case "ACTIVE":
// 				return "bg-green-100 text-green-800";
// 			case "INACTIVE":
// 				return "bg-gray-100 text-gray-800";
// 			case "SUSPENDED":
// 				return "bg-red-100 text-red-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	const getRoleColor = (role: string) => {
// 		switch (role) {
// 			case "OFFICE_MANAGER":
// 				return "bg-blue-100 text-blue-800";
// 			case "POLICE_MANAGER":
// 				return "bg-green-100 text-green-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	const formatDateTime = (dateString: string) => {
// 		return new Date(dateString).toLocaleString();
// 	};

// 	if (loading) {
// 		return (
// 			<div className="space-y-6">
// 				<div className="flex justify-between items-center">
// 					<div>
// 						<Skeleton className="h-8 w-64" />
// 						<Skeleton className="h-4 w-96 mt-2" />
// 					</div>
// 					<Skeleton className="h-10 w-32" />
// 				</div>
// 				<div className="grid gap-4 md:grid-cols-4">
// 					{[...Array(4)].map((_, i) => (
// 						<Card key={i}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<Skeleton className="h-4 w-24" />
// 								<Skeleton className="h-4 w-4" />
// 							</CardHeader>
// 							<CardContent>
// 								<Skeleton className="h-8 w-16" />
// 								<Skeleton className="h-3 w-20 mt-1" />
// 							</CardContent>
// 						</Card>
// 					))}
// 				</div>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6">
// 			<div className="flex justify-between items-center">
// 				<div>
// 					<h1 className="text-3xl font-bold tracking-tight">User Management</h1>
// 					<p className="text-muted-foreground">
// 						Manage Office Managers and Police Managers
// 					</p>
// 				</div>
// 				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
// 					<DialogTrigger asChild>
// 						<Button>
// 							<Plus className="h-4 w-4 mr-2" />
// 							Create User
// 						</Button>
// 					</DialogTrigger>
// 					<DialogContent className="sm:max-w-[500px]">
// 						<DialogHeader>
// 							<DialogTitle>Create New User</DialogTitle>
// 							<DialogDescription>
// 								Add a new Office Manager or Police Manager to the system
// 							</DialogDescription>
// 						</DialogHeader>
// 						<div className="space-y-4 py-4">
// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="name">Full Name *</Label>
// 									<Input
// 										id="name"
// 										value={newUser.name}
// 										onChange={(e) =>
// 											setNewUser({ ...newUser, name: e.target.value })
// 										}
// 										placeholder="Enter full name"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="email">Email *</Label>
// 									<Input
// 										id="email"
// 										type="email"
// 										value={newUser.email}
// 										onChange={(e) =>
// 											setNewUser({ ...newUser, email: e.target.value })
// 										}
// 										placeholder="user@company.com"
// 									/>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="phone">Phone Number</Label>
// 									<Input
// 										id="phone"
// 										value={newUser.phone}
// 										onChange={(e) =>
// 											setNewUser({ ...newUser, phone: e.target.value })
// 										}
// 										placeholder="+251911123456"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="role">Role *</Label>
// 									<Select
// 										value={newUser.role}
// 										onValueChange={(
// 											value: "OFFICE_MANAGER" | "POLICE_MANAGER"
// 										) => setNewUser({ ...newUser, role: value })}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select role" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="OFFICE_MANAGER">
// 												Office Manager
// 											</SelectItem>
// 											<SelectItem value="POLICE_MANAGER">
// 												Police Manager
// 											</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							{/* {newUser.role === "OFFICE_MANAGER" && (

// 							)} */}

// 							{/* {JSON.stringify(companies)} */}

// 							<div className="space-y-2">
// 								<Label htmlFor="company">Company</Label>
// 								<Select
// 									value={newUser.companyId}
// 									onValueChange={(value) =>
// 										setNewUser({ ...newUser, companyId: value })
// 									}>
// 									<SelectTrigger>
// 										<SelectValue placeholder="Select company" />
// 									</SelectTrigger>
// 									<SelectContent>
// 										{companies
// 											.filter((c: any) => c.status === "ACTIVE")
// 											.map((company) => (
// 												<SelectItem key={company.id} value={company.id}>
// 													{company.name} ({company.type})
// 												</SelectItem>
// 											))}
// 									</SelectContent>
// 								</Select>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="password">Password *</Label>
// 									<Input
// 										id="password"
// 										type="password"
// 										value={newUser.password}
// 										onChange={(e) =>
// 											setNewUser({ ...newUser, password: e.target.value })
// 										}
// 										placeholder="Enter password"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="confirmPassword">Confirm Password *</Label>
// 									<Input
// 										id="confirmPassword"
// 										type="password"
// 										value={newUser.confirmPassword}
// 										onChange={(e) =>
// 											setNewUser({
// 												...newUser,
// 												confirmPassword: e.target.value,
// 											})
// 										}
// 										placeholder="Confirm password"
// 									/>
// 								</div>
// 							</div>

// 							{newUser.role && (
// 								<div className="space-y-2">
// 									<Label>Default Permissions</Label>
// 									<div className="flex flex-wrap gap-2">
// 										{rolePermissions[newUser.role].map((permission) => (
// 											<Badge
// 												key={permission}
// 												variant="outline"
// 												className="text-xs">
// 												{permission.replace("_", " ")}
// 											</Badge>
// 										))}
// 									</div>
// 								</div>
// 							)}
// 						</div>
// 						<div className="flex justify-end space-x-2">
// 							<Button
// 								variant="outline"
// 								onClick={() => setIsCreateDialogOpen(false)}
// 								disabled={creating}>
// 								Cancel
// 							</Button>
// 							<Button
// 								onClick={handleCreateUser}
// 								disabled={
// 									!newUser.name ||
// 									!newUser.email ||
// 									!newUser.role ||
// 									!newUser.password ||
// 									newUser.password !== newUser.confirmPassword ||
// 									creating
// 								}>
// 								{creating ? (
// 									<>
// 										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 										Creating...
// 									</>
// 								) : (
// 									"Create User"
// 								)}
// 							</Button>
// 						</div>
// 					</DialogContent>
// 				</Dialog>
// 			</div>

// 			{/* Overview Cards */}
// 			<div className="grid gap-4 md:grid-cols-4">
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
// 						<Users className="h-4 w-4 text-muted-foreground" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold">{users.length}</div>
// 						<p className="text-xs text-muted-foreground">
// 							{users.filter((u) => u.status === "ACTIVE").length} active
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Office Managers
// 						</CardTitle>
// 						<Building className="h-4 w-4 text-blue-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-blue-600">
// 							{users.filter((u) => u.role === "OFFICE_MANAGER").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Managing companies</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Police Managers
// 						</CardTitle>
// 						<Shield className="h-4 w-4 text-green-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-green-600">
// 							{users.filter((u) => u.role === "POLICE_MANAGER").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Handling security</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Active Sessions
// 						</CardTitle>
// 						<UserCheck className="h-4 w-4 text-green-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-green-600">
// 							{users.filter((u) => u.status === "ACTIVE" && u.lastLogin).length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Currently online</p>
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Search and Filters */}
// 			<div className="flex justify-between items-center space-x-4">
// 				<div className="flex space-x-2">
// 					<div className="relative">
// 						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
// 						<Input
// 							placeholder="Search users..."
// 							value={searchTerm}
// 							onChange={(e) => setSearchTerm(e.target.value)}
// 							className="pl-8 w-64"
// 						/>
// 					</div>
// 					<Select value={filterRole} onValueChange={setFilterRole}>
// 						<SelectTrigger className="w-40">
// 							<SelectValue placeholder="Filter by role" />
// 						</SelectTrigger>
// 						<SelectContent>
// 							<SelectItem value="all">All Roles</SelectItem>
// 							<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
// 							<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
// 						</SelectContent>
// 					</Select>
// 					<Select value={filterStatus} onValueChange={setFilterStatus}>
// 						<SelectTrigger className="w-40">
// 							<SelectValue placeholder="Filter by status" />
// 						</SelectTrigger>
// 						<SelectContent>
// 							<SelectItem value="all">All Status</SelectItem>
// 							<SelectItem value="ACTIVE">Active</SelectItem>
// 							<SelectItem value="INACTIVE">Inactive</SelectItem>
// 							<SelectItem value="SUSPENDED">Suspended</SelectItem>
// 						</SelectContent>
// 					</Select>
// 				</div>
// 			</div>

// 			{/* User List */}
// 			<Tabs defaultValue="all" className="space-y-4">
// 				<TabsList>
// 					<TabsTrigger value="all">
// 						All Users ({filteredUsers.length})
// 					</TabsTrigger>
// 					<TabsTrigger value="OFFICE_MANAGER">
// 						Office Managers (
// 						{filteredUsers.filter((u) => u.role === "OFFICE_MANAGER").length})
// 					</TabsTrigger>
// 					<TabsTrigger value="POLICE_MANAGER">
// 						Police Managers (
// 						{filteredUsers.filter((u) => u.role === "POLICE_MANAGER").length})
// 					</TabsTrigger>
// 				</TabsList>

// 				<TabsContent value="all" className="space-y-4">
// 					<div className="grid gap-4">
// 						{filteredUsers.map((user) => (
// 							<Card key={user.id}>
// 								{/* {JSON.stringify(user)} */}
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											<div
// 												className={`p-2 rounded-lg ${
// 													user.role === "OFFICE_MANAGER"
// 														? "bg-blue-100"
// 														: "bg-green-100"
// 												}`}>
// 												{user.role === "OFFICE_MANAGER" ? (
// 													<Building
// 														className={`h-5 w-5 ${
// 															user.role === "OFFICE_MANAGER"
// 																? "text-blue-600"
// 																: "text-green-600"
// 														}`}
// 													/>
// 												) : (
// 													<Shield className="h-5 w-5 text-green-600" />
// 												)}
// 											</div>
// 											<div>
// 												<h4 className="font-medium">{user.name}</h4>
// 												<div className="flex items-center space-x-4 text-sm text-gray-500">
// 													<span className="flex items-center">
// 														<Mail className="h-3 w-3 mr-1" />
// 														{user.email}
// 													</span>
// 													{user.phone && (
// 														<span className="flex items-center">
// 															<Phone className="h-3 w-3 mr-1" />
// 															{user.phone}
// 														</span>
// 													)}
// 												</div>
// 												<div className="flex items-center space-x-2 mt-2">
// 													<Badge className={getRoleColor(user.role)}>
// 														{user.role === "OFFICE_MANAGER"
// 															? "Office Manager"
// 															: "Police Manager"}
// 													</Badge>
// 													<Badge className={getStatusColor(user.status)}>
// 														{user.status}
// 													</Badge>
// 													{user.companyName && (
// 														<Badge variant="outline">{user.companyName}</Badge>
// 													)}
// 												</div>
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<div className="text-right text-xs text-gray-500">
// 												<p>
// 													Created:{" "}
// 													{new Date(user.createdAt).toLocaleDateString()}
// 												</p>
// 												{user.lastLogin && (
// 													<p>Last login: {formatDateTime(user.lastLogin)}</p>
// 												)}
// 											</div>
// 											<DropdownMenu>
// 												<DropdownMenuTrigger asChild>
// 													<Button variant="outline" size="sm">
// 														<MoreHorizontal className="h-4 w-4" />
// 													</Button>
// 												</DropdownMenuTrigger>
// 												<DropdownMenuContent align="end">
// 													<DropdownMenuItem
// 														onClick={() => {
// 															setSelectedUser(user);
// 															setIsEditDialogOpen(true);
// 														}}>
// 														<Edit className="h-4 w-4 mr-2" />
// 														Edit User
// 													</DropdownMenuItem>
// 													<DropdownMenuItem
// 														onClick={() => {
// 															setSelectedUser(user);
// 															setIsPasswordDialogOpen(true);
// 														}}>
// 														<Key className="h-4 w-4 mr-2" />
// 														Change Password
// 													</DropdownMenuItem>
// 													<DropdownMenuItem
// 														onClick={() => toggleUserStatus(user.id)}>
// 														{user.status === "ACTIVE" ? (
// 															<>
// 																<UserX className="h-4 w-4 mr-2" />
// 																Deactivate
// 															</>
// 														) : (
// 															<>
// 																<UserCheck className="h-4 w-4 mr-2" />
// 																Activate
// 															</>
// 														)}
// 													</DropdownMenuItem>
// 													{user.status === "ACTIVE" && (
// 														<DropdownMenuItem
// 															onClick={() => suspendUser(user.id)}
// 															className="text-red-600">
// 															<UserX className="h-4 w-4 mr-2" />
// 															Suspend User
// 														</DropdownMenuItem>
// 													)}
// 												</DropdownMenuContent>
// 											</DropdownMenu>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="OFFICE_MANAGER" className="space-y-4">
// 					<div className="grid gap-4">
// 						{filteredUsers
// 							.filter((u) => u.role === "OFFICE_MANAGER")
// 							.map((user) => (
// 								<Card key={user.id}>
// 									<CardContent className="p-6">
// 										<div className="flex items-center justify-between">
// 											<div className="flex items-center space-x-4">
// 												<div className="p-2 bg-blue-100 rounded-lg">
// 													<Building className="h-5 w-5 text-blue-600" />
// 												</div>
// 												<div>
// 													<h4 className="font-medium">{user.name}</h4>
// 													<div className="flex items-center space-x-4 text-sm text-gray-500">
// 														<span className="flex items-center">
// 															<Mail className="h-3 w-3 mr-1" />
// 															{user.email}
// 														</span>
// 														{user.phone && (
// 															<span className="flex items-center">
// 																<Phone className="h-3 w-3 mr-1" />
// 																{user.phone}
// 															</span>
// 														)}
// 													</div>
// 													<div className="flex items-center space-x-2 mt-2">
// 														<Badge className={getStatusColor(user.status)}>
// 															{user.status}
// 														</Badge>
// 														{user.companyName && (
// 															<Badge variant="outline">
// 																{user.companyName}
// 															</Badge>
// 														)}
// 													</div>
// 												</div>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<div className="text-right text-xs text-gray-500">
// 													<p>
// 														Created:{" "}
// 														{new Date(user.createdAt).toLocaleDateString()}
// 													</p>
// 													{user.lastLogin && (
// 														<p>Last login: {formatDateTime(user.lastLogin)}</p>
// 													)}
// 												</div>
// 												<DropdownMenu>
// 													<DropdownMenuTrigger asChild>
// 														<Button variant="outline" size="sm">
// 															<MoreHorizontal className="h-4 w-4" />
// 														</Button>
// 													</DropdownMenuTrigger>
// 													<DropdownMenuContent align="end">
// 														<DropdownMenuItem
// 															onClick={() => {
// 																setSelectedUser(user);
// 																setIsEditDialogOpen(true);
// 															}}>
// 															<Edit className="h-4 w-4 mr-2" />
// 															Edit User
// 														</DropdownMenuItem>
// 														<DropdownMenuItem
// 															onClick={() => {
// 																setSelectedUser(user);
// 																setIsPasswordDialogOpen(true);
// 															}}>
// 															<Key className="h-4 w-4 mr-2" />
// 															Change Password
// 														</DropdownMenuItem>
// 														<DropdownMenuItem
// 															onClick={() => toggleUserStatus(user.id)}>
// 															{user.status === "ACTIVE" ? (
// 																<>
// 																	<UserX className="h-4 w-4 mr-2" />
// 																	Deactivate
// 																</>
// 															) : (
// 																<>
// 																	<UserCheck className="h-4 w-4 mr-2" />
// 																	Activate
// 																</>
// 															)}
// 														</DropdownMenuItem>
// 													</DropdownMenuContent>
// 												</DropdownMenu>
// 											</div>
// 										</div>
// 									</CardContent>
// 								</Card>
// 							))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="POLICE_MANAGER" className="space-y-4">
// 					<div className="grid gap-4">
// 						{filteredUsers
// 							.filter((u) => u.role === "POLICE_MANAGER")
// 							.map((user) => (
// 								<Card key={user.id}>
// 									<CardContent className="p-6">
// 										<div className="flex items-center justify-between">
// 											<div className="flex items-center space-x-4">
// 												<div className="p-2 bg-green-100 rounded-lg">
// 													<Shield className="h-5 w-5 text-green-600" />
// 												</div>
// 												<div>
// 													<h4 className="font-medium">{user.name}</h4>
// 													<div className="flex items-center space-x-4 text-sm text-gray-500">
// 														<span className="flex items-center">
// 															<Mail className="h-3 w-3 mr-1" />
// 															{user.email}
// 														</span>
// 														{user.phone && (
// 															<span className="flex items-center">
// 																<Phone className="h-3 w-3 mr-1" />
// 																{user.phone}
// 															</span>
// 														)}
// 													</div>
// 													<div className="flex items-center space-x-2 mt-2">
// 														<Badge className={getStatusColor(user.status)}>
// 															{user.status}
// 														</Badge>
// 													</div>
// 												</div>
// 											</div>
// 											<div className="flex items-center space-x-2">
// 												<div className="text-right text-xs text-gray-500">
// 													<p>
// 														Created:{" "}
// 														{new Date(user.createdAt).toLocaleDateString()}
// 													</p>
// 													{user.lastLogin && (
// 														<p>Last login: {formatDateTime(user.lastLogin)}</p>
// 													)}
// 												</div>
// 												<DropdownMenu>
// 													<DropdownMenuTrigger asChild>
// 														<Button variant="outline" size="sm">
// 															<MoreHorizontal className="h-4 w-4" />
// 														</Button>
// 													</DropdownMenuTrigger>
// 													<DropdownMenuContent align="end">
// 														<DropdownMenuItem
// 															onClick={() => {
// 																setSelectedUser(user);
// 																setIsEditDialogOpen(true);
// 															}}>
// 															<Edit className="h-4 w-4 mr-2" />
// 															Edit User
// 														</DropdownMenuItem>
// 														<DropdownMenuItem
// 															onClick={() => {
// 																setSelectedUser(user);
// 																setIsPasswordDialogOpen(true);
// 															}}>
// 															<Key className="h-4 w-4 mr-2" />
// 															Change Password
// 														</DropdownMenuItem>
// 														<DropdownMenuItem
// 															onClick={() => toggleUserStatus(user.id)}>
// 															{user.status === "ACTIVE" ? (
// 																<>
// 																	<UserX className="h-4 w-4 mr-2" />
// 																	Deactivate
// 																</>
// 															) : (
// 																<>
// 																	<UserCheck className="h-4 w-4 mr-2" />
// 																	Activate
// 																</>
// 															)}
// 														</DropdownMenuItem>
// 													</DropdownMenuContent>
// 												</DropdownMenu>
// 											</div>
// 										</div>
// 									</CardContent>
// 								</Card>
// 							))}
// 					</div>
// 				</TabsContent>
// 			</Tabs>

// 			{/* Edit User Dialog */}
// 			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
// 				<DialogContent className="sm:max-w-[500px]">
// 					<DialogHeader>
// 						<DialogTitle>Edit User</DialogTitle>
// 						<DialogDescription>
// 							Update user information and settings
// 						</DialogDescription>
// 					</DialogHeader>
// 					{selectedUser && (
// 						<div className="space-y-4 py-4">
// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="editName">Full Name</Label>
// 									<Input
// 										id="editName"
// 										value={selectedUser.name}
// 										onChange={(e) =>
// 											setSelectedUser({ ...selectedUser, name: e.target.value })
// 										}
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editEmail">Email</Label>
// 									<Input
// 										id="editEmail"
// 										type="email"
// 										value={selectedUser.email}
// 										onChange={(e) =>
// 											setSelectedUser({
// 												...selectedUser,
// 												email: e.target.value,
// 											})
// 										}
// 									/>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="editPhone">Phone Number</Label>
// 									<Input
// 										id="editPhone"
// 										value={selectedUser.phone}
// 										onChange={(e) =>
// 											setSelectedUser({
// 												...selectedUser,
// 												phone: e.target.value,
// 											})
// 										}
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editStatus">Status</Label>
// 									<Select
// 										value={selectedUser.status}
// 										onValueChange={(
// 											value: "ACTIVE" | "INACTIVE" | "SUSPENDED"
// 										) => setSelectedUser({ ...selectedUser, status: value })}>
// 										<SelectTrigger>
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="ACTIVE">Active</SelectItem>
// 											<SelectItem value="INACTIVE">Inactive</SelectItem>
// 											<SelectItem value="SUSPENDED">Suspended</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							{selectedUser.role === "OFFICE_MANAGER" && (
// 								<div className="space-y-2">
// 									<Label htmlFor="editCompany">Company</Label>
// 									<Select
// 										value={selectedUser.companyId || ""}
// 										onValueChange={(value) =>
// 											setSelectedUser({
// 												...selectedUser,
// 												companyId: value,
// 												companyName: companies.find((c) => c.id === value)
// 													?.name,
// 											})
// 										}>
// 										<SelectTrigger>
// 											<SelectValue placeholder="Select company" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{companies
// 												.filter((c) => c.status === "ACTIVE")
// 												.map((company) => (
// 													<SelectItem key={company.id} value={company.id}>
// 														{company.name} ({company.type})
// 													</SelectItem>
// 												))}
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							)}

// 							{/* <div className="space-y-2">
// 								<Label>Permissions</Label>
// 								<div className="flex flex-wrap gap-2">
// 									{selectedUser.permissions.map((permission) => (
// 										<Badge
// 											key={permission}
// 											variant="outline"
// 											className="text-xs">
// 											{permission.replace("_", " ")}
// 										</Badge>
// 									))}
// 								</div>
// 							</div> */}
// 						</div>
// 					)}
// 					<div className="flex justify-end space-x-2">
// 						<Button
// 							variant="outline"
// 							onClick={() => setIsEditDialogOpen(false)}
// 							disabled={updating}>
// 							Cancel
// 						</Button>
// 						<Button onClick={handleUpdateUser} disabled={updating}>
// 							{updating ? (
// 								<>
// 									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 									Updating...
// 								</>
// 							) : (
// 								"Update User"
// 							)}
// 						</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>

// 			{/* Password Change Dialog */}
// 			<Dialog
// 				open={isPasswordDialogOpen}
// 				onOpenChange={setIsPasswordDialogOpen}>
// 				<DialogContent className="sm:max-w-[400px]">
// 					<DialogHeader>
// 						<DialogTitle>Change Password</DialogTitle>
// 						<DialogDescription>
// 							Set a new password for {selectedUser?.name}
// 						</DialogDescription>
// 					</DialogHeader>
// 					<div className="space-y-4 py-4">
// 						<div className="space-y-2">
// 							<Label htmlFor="newPassword">New Password</Label>
// 							<Input
// 								id="newPassword"
// 								type="password"
// 								value={passwordData.newPassword}
// 								onChange={(e) =>
// 									setPasswordData({
// 										...passwordData,
// 										newPassword: e.target.value,
// 									})
// 								}
// 								placeholder="Enter new password"
// 							/>
// 						</div>
// 						<div className="space-y-2">
// 							<Label htmlFor="confirmNewPassword">Confirm New Password</Label>
// 							<Input
// 								id="confirmNewPassword"
// 								type="password"
// 								value={passwordData.confirmPassword}
// 								onChange={(e) =>
// 									setPasswordData({
// 										...passwordData,
// 										confirmPassword: e.target.value,
// 									})
// 								}
// 								placeholder="Confirm new password"
// 							/>
// 						</div>
// 					</div>
// 					<div className="flex justify-end space-x-2">
// 						<Button
// 							variant="outline"
// 							onClick={() => setIsPasswordDialogOpen(false)}>
// 							Cancel
// 						</Button>
// 						<Button
// 							onClick={handlePasswordChange}
// 							disabled={
// 								!passwordData.newPassword ||
// 								passwordData.newPassword !== passwordData.confirmPassword
// 							}>
// 							Change Password
// 						</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>
// 		</div>
// 	);
// }
