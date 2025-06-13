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
	Users,
	Plus,
	Edit,
	Eye,
	UserCheck,
	Building,
	Mail,
	Phone,
} from "lucide-react";
import { apiService } from "@/lib/api-service";
import { apiClient } from "@/lib/api";

interface User {
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
	password: string;
	status: "ACTIVE" | "INACTIVE";
	createdBy: string;
	managedById?: string;
	operatorType?: string;
	companyId: string;
	role: "OPERATOR";
	createdAt: string;
}

interface Branch {
	id: string;
	name: string;
	location: string;
	managerId: string;
	companyId: string;
}

export default function OperatorsPage() {
	const [user, setUser] = useState<User | null>(null);
	const [operators, setOperators] = useState<Operator[]>([]);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [newOperator, setNewOperator] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
	});

	useEffect(() => {
		const userData = localStorage.getItem("currentUser");
		if (userData) {
			const parsedUser = JSON.parse(userData);
			setUser({ ...parsedUser }); // Mock company assignment
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
			// toast({
			// 	title: "Error",
			// 	description: "Failed to fetch alarms",
			// 	variant: "destructive",
			// });
		} finally {
			setLoading(false);
		}
	};

	const fetchOperators = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/users/my-operators");
			console.log("Fetched Operators:", response);
			setOperators(response as any);
		} catch (error) {
			// toast({
			// 	title: "Error",
		}
	};

	const handleCreateOperator = async () => {
		if (!user) return;

		const operator: Operator = {
			id: Date.now().toString(),
			name: newOperator.name,
			email: newOperator.email,
			phone: newOperator.phone,
			status: "ACTIVE",
			role: "OPERATOR",
			password: newOperator.password,
			managedById: user.id,
			operatorType: user.role === "OFFICE_MANAGER" ? "OFFICE" : "POLICE",
			createdBy: user.id,
			companyId: user.companyId as string,
			createdAt: new Date().toISOString().split("T")[0],
		};

		await apiService.post("/users", operator);
		console.log("Created Operator:", operator);

		setOperators([...operators, operator]);
		setNewOperator({ name: "", email: "", phone: "", password: "" });
		setIsCreateDialogOpen(false);
	};

	const toggleOperatorStatus = (operatorId: string) => {
		setOperators(
			operators.map((op) =>
				op.id === operatorId
					? { ...op, status: op.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
					: op
			)
		);
	};

	const getBranchName = (branchId: string) => {
		return branches.find((b) => b.id === branchId)?.name || "Unknown Branch";
	};

	const userBranches = branches.filter(
		(branch) =>
			branch.managerId === user?.id && branch.companyId === user?.companyId
	);

	if (!user) return <div>Loading...</div>;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Operator Management
					</h1>
					<p className="text-muted-foreground">
						Manage security operators under your supervision
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Create Operator
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Create New Operator</DialogTitle>
							<DialogDescription>
								Add a new security operator to your team
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									value={newOperator.name}
									onChange={(e) =>
										setNewOperator({ ...newOperator, name: e.target.value })
									}
									placeholder="Enter operator's full name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={newOperator.email}
									onChange={(e) =>
										setNewOperator({ ...newOperator, email: e.target.value })
									}
									placeholder="operator@company.com"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									value={newOperator.phone}
									onChange={(e) =>
										setNewOperator({ ...newOperator, phone: e.target.value })
									}
									placeholder="+251911123456"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									value={newOperator.password}
									onChange={(e) =>
										setNewOperator({ ...newOperator, password: e.target.value })
									}
									placeholder="12345678"
									type="password"
								/>
							</div>
							{/* <div className="space-y-2">
								<Label>Assign Branches</Label>
								<div className="space-y-2">
									{userBranches.map((branch) => (
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
									))}
								</div>
							</div> */}
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleCreateOperator}
								disabled={
									!newOperator.name || !newOperator.email || !newOperator.phone
								}>
								Create Operator
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Operators
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{operators.length}</div>
						<p className="text-xs text-muted-foreground">
							{operators.filter((op) => op.status === "ACTIVE").length} active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Operators
						</CardTitle>
						<UserCheck className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{operators.filter((op) => op.status === "ACTIVE").length}
						</div>
						<p className="text-xs text-muted-foreground">Currently on duty</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Assigned Branches
						</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userBranches.length}</div>
						<p className="text-xs text-muted-foreground">
							Under your management
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="active" className="space-y-4">
				<TabsList>
					<TabsTrigger value="active">Active Operators</TabsTrigger>
					<TabsTrigger value="inactive">Inactive Operators</TabsTrigger>
					<TabsTrigger value="all">All Operators</TabsTrigger>
				</TabsList>

				<TabsContent value="active" className="space-y-4">
					<div className="grid gap-4">
						{operators
							.filter((op) => op.status === "ACTIVE")
							.map((operator) => (
								<Card key={operator.id}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-green-100 rounded-lg">
													<UserCheck className="h-5 w-5 text-green-600" />
												</div>
												<div>
													<h4 className="font-medium">{operator.name}</h4>
													<div className="flex items-center space-x-4 text-sm text-gray-500">
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
														<Badge variant="default">Active</Badge>
														<span className="text-xs text-gray-500">
															Created: {operator.createdAt}
														</span>
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												{/* <div className="text-right">
													<p className="text-sm font-medium">
														Assigned Branches
													</p>
													<div className="flex flex-wrap gap-1 mt-1">
														{operator.assignedBranches.map((branchId) => (
															<Badge
																key={branchId}
																variant="outline"
																className="text-xs">
																{getBranchName(branchId)}
															</Badge>
														))}
													</div>
												</div> */}
												<Button variant="outline" size="sm">
													<Eye className="h-4 w-4" />
												</Button>
												<Button variant="outline" size="sm">
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => toggleOperatorStatus(operator.id)}>
													Deactivate
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
					</div>
				</TabsContent>

				<TabsContent value="inactive" className="space-y-4">
					<div className="grid gap-4">
						{operators
							.filter((op) => op.status === "INACTIVE")
							.map((operator) => (
								<Card key={operator.id} className="opacity-75">
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-gray-100 rounded-lg">
													<UserCheck className="h-5 w-5 text-gray-600" />
												</div>
												<div>
													<h4 className="font-medium">{operator.name}</h4>
													<div className="flex items-center space-x-4 text-sm text-gray-500">
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
														<span className="text-xs text-gray-500">
															Created: {operator.createdAt}
														</span>
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => toggleOperatorStatus(operator.id)}>
													Activate
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
					</div>
				</TabsContent>

				<TabsContent value="all" className="space-y-4">
					<div className="grid gap-4">
						{operators.map((operator) => (
							<Card
								key={operator.id}
								className={operator.status === "INACTIVE" ? "opacity-75" : ""}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div
												className={`p-2 rounded-lg ${
													operator.status === "ACTIVE"
														? "bg-green-100"
														: "bg-gray-100"
												}`}>
												<UserCheck
													className={`h-5 w-5 ${
														operator.status === "ACTIVE"
															? "text-green-600"
															: "text-gray-600"
													}`}
												/>
											</div>
											<div>
												<h4 className="font-medium">{operator.name}</h4>
												<div className="flex items-center space-x-4 text-sm text-gray-500">
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
													<Badge
														variant={
															operator.status === "ACTIVE"
																? "default"
																: "secondary"
														}>
														{operator.status}
													</Badge>
													<span className="text-xs text-gray-500">
														Created: {operator.createdAt}
													</span>
												</div>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											{/* <div className="text-right">
												<p className="text-sm font-medium">Assigned Branches</p>
												<div className="flex flex-wrap gap-1 mt-1">
													{operator.assignedBranches.map((branchId) => (
														<Badge
															key={branchId}
															variant="outline"
															className="text-xs">
															{getBranchName(branchId)}
														</Badge>
													))}
												</div>
											</div> */}
											<Button variant="outline" size="sm">
												<Eye className="h-4 w-4" />
											</Button>
											<Button variant="outline" size="sm">
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => toggleOperatorStatus(operator.id)}>
												{operator.status === "ACTIVE"
													? "Deactivate"
													: "Activate"}
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
