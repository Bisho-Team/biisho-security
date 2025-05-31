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
	UserCheck,
	UserX,
	Key,
	Mail,
	Phone,
	Loader2,
} from "lucide-react";

interface User {
	id: string;
	name: string;
	email: string;
	phone: string;
	role: "office_manager" | "police_manager";
	companyId?: string;
	companyName?: string;
	status: "active" | "inactive" | "suspended";
	createdAt: string;
	lastLogin?: string;
	permissions: string[];
}

interface Company {
	id: string;
	name: string;
	type: string;
	status: "active" | "inactive";
}

const rolePermissions = {
	office_manager: [
		"manage_branches",
		"manage_operators",
		"create_alarms",
		"view_reports",
		"manage_settings",
	],
	police_manager: [
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
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterRole, setFilterRole] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const { toast } = useToast();

	const [newUser, setNewUser] = useState({
		name: "",
		email: "",
		phone: "",
		role: "" as "office_manager" | "police_manager" | "",
		companyId: "",
		password: "",
		confirmPassword: "",
		permissions: [] as string[],
	});

	const [passwordData, setPasswordData] = useState({
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		fetchUsers();
		fetchCompanies();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/users");
			console.log("Fetched users:", response);
			setUsers((response as any).users as any);
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
			setCompanies(response as any);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch companies",
				variant: "destructive",
			});
		}
	};

	const handleCreateUser = async () => {
		if (!newUser.name || !newUser.email || !newUser.role || !newUser.password)
			return;
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
				companyId: newUser.companyId || undefined,
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
				permissions: [],
			});
			setIsCreateDialogOpen(false);
			fetchUsers();
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

	const toggleUserStatus = async (userId: string) => {
		try {
			const user = users.find((u) => u.id === userId);
			if (!user) return;

			const newStatus = user.status === "active" ? "inactive" : "active";
			await apiService.put(`/users/${userId}`, { status: newStatus });

			toast({
				title: "Success",
				description: `User ${
					newStatus === "active" ? "activated" : "deactivated"
				} successfully`,
			});

			fetchUsers();
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to update user status",
				variant: "destructive",
			});
		}
	};

	const suspendUser = async (userId: string) => {
		try {
			await apiService.put(`/users/${userId}`, { status: "suspended" });

			toast({
				title: "Success",
				description: "User suspended successfully",
			});

			fetchUsers();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.message || "Failed to suspend user",
				variant: "destructive",
			});
		}
	};

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesRole = filterRole === "all" || user.role === filterRole;
		const matchesStatus =
			filterStatus === "all" || user.status === filterStatus;
		return matchesSearch && matchesRole && matchesStatus;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800";
			case "inactive":
				return "bg-gray-100 text-gray-800";
			case "suspended":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getRoleColor = (role: string) => {
		switch (role) {
			case "office_manager":
				return "bg-blue-100 text-blue-800";
			case "police_manager":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96 mt-2" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid gap-4 md:grid-cols-4">
					{[...Array(4)].map((_, i) => (
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
						Manage Office Managers and Police Managers
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
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number</Label>
									<Input
										id="phone"
										value={newUser.phone}
										onChange={(e) =>
											setNewUser({ ...newUser, phone: e.target.value })
										}
										placeholder="+251911123456"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="role">Role *</Label>
									<Select
										value={newUser.role}
										onValueChange={(
											value: "office_manager" | "police_manager"
										) => setNewUser({ ...newUser, role: value })}>
										<SelectTrigger>
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="office_manager">
												Office Manager
											</SelectItem>
											<SelectItem value="police_manager">
												Police Manager
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{newUser.role === "office_manager" && (
								<div className="space-y-2">
									<Label htmlFor="company">Company</Label>
									<Select
										value={newUser.companyId}
										onValueChange={(value) =>
											setNewUser({ ...newUser, companyId: value })
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select company" />
										</SelectTrigger>
										<SelectContent>
											{companies
												.filter((c) => c.status === "active")
												.map((company) => (
													<SelectItem key={company.id} value={company.id}>
														{company.name} ({company.type})
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							)}

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
									!newUser.role ||
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
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{users.length}</div>
						<p className="text-xs text-muted-foreground">
							{users.filter((u) => u.status === "active").length} active
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
							{users.filter((u) => u.role === "office_manager").length}
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
							{users.filter((u) => u.role === "police_manager").length}
						</div>
						<p className="text-xs text-muted-foreground">Handling security</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Sessions
						</CardTitle>
						<UserCheck className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{users.filter((u) => u.status === "active" && u.lastLogin).length}
						</div>
						<p className="text-xs text-muted-foreground">Currently online</p>
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
							<SelectItem value="office_manager">Office Manager</SelectItem>
							<SelectItem value="police_manager">Police Manager</SelectItem>
						</SelectContent>
					</Select>
					<Select value={filterStatus} onValueChange={setFilterStatus}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="suspended">Suspended</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* User List */}
			<Tabs defaultValue="all" className="space-y-4">
				<TabsList>
					<TabsTrigger value="all">
						All Users ({filteredUsers.length})
					</TabsTrigger>
					<TabsTrigger value="office_managers">
						Office Managers (
						{filteredUsers.filter((u) => u.role === "office_manager").length})
					</TabsTrigger>
					<TabsTrigger value="police_managers">
						Police Managers (
						{filteredUsers.filter((u) => u.role === "police_manager").length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					<div className="grid gap-4">
						{filteredUsers.map((user) => (
							<Card key={user.id}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div
												className={`p-2 rounded-lg ${
													user.role === "office_manager"
														? "bg-blue-100"
														: "bg-green-100"
												}`}>
												{user.role === "office_manager" ? (
													<Building
														className={`h-5 w-5 ${
															user.role === "office_manager"
																? "text-blue-600"
																: "text-green-600"
														}`}
													/>
												) : (
													<Shield className="h-5 w-5 text-green-600" />
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
														{user.role === "office_manager"
															? "Office Manager"
															: "Police Manager"}
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
												<p>
													Created:{" "}
													{new Date(user.createdAt).toLocaleDateString()}
												</p>
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
															setIsEditDialogOpen(true);
														}}>
														<Edit className="h-4 w-4 mr-2" />
														Edit User
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => {
															setSelectedUser(user);
															setIsPasswordDialogOpen(true);
														}}>
														<Key className="h-4 w-4 mr-2" />
														Change Password
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => toggleUserStatus(user.id)}>
														{user.status === "active" ? (
															<>
																<UserX className="h-4 w-4 mr-2" />
																Deactivate
															</>
														) : (
															<>
																<UserCheck className="h-4 w-4 mr-2" />
																Activate
															</>
														)}
													</DropdownMenuItem>
													{user.status === "active" && (
														<DropdownMenuItem
															onClick={() => suspendUser(user.id)}
															className="text-red-600">
															<UserX className="h-4 w-4 mr-2" />
															Suspend User
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="office_managers" className="space-y-4">
					<div className="grid gap-4">
						{filteredUsers
							.filter((u) => u.role === "office_manager")
							.map((user) => (
								<Card key={user.id}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-blue-100 rounded-lg">
													<Building className="h-5 w-5 text-blue-600" />
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
														<Badge className={getStatusColor(user.status)}>
															{user.status}
														</Badge>
														{user.companyName && (
															<Badge variant="outline">
																{user.companyName}
															</Badge>
														)}
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<div className="text-right text-xs text-gray-500">
													<p>
														Created:{" "}
														{new Date(user.createdAt).toLocaleDateString()}
													</p>
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
																setIsEditDialogOpen(true);
															}}>
															<Edit className="h-4 w-4 mr-2" />
															Edit User
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																setSelectedUser(user);
																setIsPasswordDialogOpen(true);
															}}>
															<Key className="h-4 w-4 mr-2" />
															Change Password
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => toggleUserStatus(user.id)}>
															{user.status === "active" ? (
																<>
																	<UserX className="h-4 w-4 mr-2" />
																	Deactivate
																</>
															) : (
																<>
																	<UserCheck className="h-4 w-4 mr-2" />
																	Activate
																</>
															)}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
					</div>
				</TabsContent>

				<TabsContent value="police_managers" className="space-y-4">
					<div className="grid gap-4">
						{filteredUsers
							.filter((u) => u.role === "police_manager")
							.map((user) => (
								<Card key={user.id}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-green-100 rounded-lg">
													<Shield className="h-5 w-5 text-green-600" />
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
														<Badge className={getStatusColor(user.status)}>
															{user.status}
														</Badge>
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<div className="text-right text-xs text-gray-500">
													<p>
														Created:{" "}
														{new Date(user.createdAt).toLocaleDateString()}
													</p>
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
																setIsEditDialogOpen(true);
															}}>
															<Edit className="h-4 w-4 mr-2" />
															Edit User
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																setSelectedUser(user);
																setIsPasswordDialogOpen(true);
															}}>
															<Key className="h-4 w-4 mr-2" />
															Change Password
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => toggleUserStatus(user.id)}>
															{user.status === "active" ? (
																<>
																	<UserX className="h-4 w-4 mr-2" />
																	Deactivate
																</>
															) : (
																<>
																	<UserCheck className="h-4 w-4 mr-2" />
																	Activate
																</>
															)}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
					</div>
				</TabsContent>
			</Tabs>

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
											value: "active" | "inactive" | "suspended"
										) => setSelectedUser({ ...selectedUser, status: value })}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
											<SelectItem value="suspended">Suspended</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{selectedUser.role === "office_manager" && (
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
												.filter((c) => c.status === "active")
												.map((company) => (
													<SelectItem key={company.id} value={company.id}>
														{company.name} ({company.type})
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							)}

							<div className="space-y-2">
								<Label>Permissions</Label>
								<div className="flex flex-wrap gap-2">
									{selectedUser.permissions.map((permission) => (
										<Badge
											key={permission}
											variant="outline"
											className="text-xs">
											{permission.replace("_", " ")}
										</Badge>
									))}
								</div>
							</div>
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
