"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Users,
	Building,
	Shield,
	Plus,
	Edit,
	Eye,
	UserCheck,
	Settings,
} from "lucide-react";

const mockEntities = [
	{
		id: "1",
		name: "Downtown Office",
		type: "office_manager",
		email: "downtown@koppa.com",
		status: "active",
		operatorsCount: 5,
	},
	{
		id: "2",
		name: "Central Police Station",
		type: "police_manager",
		email: "central@koppa.com",
		status: "active",
		operatorsCount: 8,
	},
	{
		id: "3",
		name: "North Branch Office",
		type: "office_manager",
		email: "north@koppa.com",
		status: "inactive",
		operatorsCount: 3,
	},
];

const mockOperators = [
	{
		id: "1",
		name: "John Smith",
		email: "john@koppa.com",
		managedBy: "Downtown Office",
		type: "office",
		status: "active",
	},
	{
		id: "2",
		name: "Sarah Johnson",
		email: "sarah@koppa.com",
		managedBy: "Central Police Station",
		type: "police",
		status: "active",
	},
	{
		id: "3",
		name: "Mike Wilson",
		email: "mike@koppa.com",
		managedBy: "Downtown Office",
		type: "office",
		status: "inactive",
	},
];

export default function SuperAdminDashboard() {
	const [entities, setEntities] = useState(mockEntities);
	const [operators, setOperators] = useState(mockOperators);
	const [showCreateEntity, setShowCreateEntity] = useState(false);
	const [showCreateOperator, setShowCreateOperator] = useState(false);

	return (
		<div className="space-y-6">
			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Entities
						</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{entities.length}</div>
						<p className="text-xs text-muted-foreground">
							{entities.filter((e) => e.status === "active").length} active
						</p>
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
						<div className="text-2xl font-bold">{operators.length}</div>
						<p className="text-xs text-muted-foreground">
							{operators.filter((o) => o.status === "active").length} active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Office Managers
						</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{entities.filter((e) => e.type === "office_manager").length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Police Managers
						</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{entities.filter((e) => e.type === "police_manager").length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Management Tabs */}
			<Tabs defaultValue="entities" className="space-y-4">
				<TabsList>
					<TabsTrigger value="entities">Entity Management</TabsTrigger>
					<TabsTrigger value="operators">Operator Management</TabsTrigger>
					<TabsTrigger value="system">System Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="entities" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium">Entities</h3>
						<Button onClick={() => setShowCreateEntity(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Create Entity
						</Button>
					</div>

					<div className="grid gap-4">
						{entities.map((entity) => (
							<Card key={entity.id}>
								<CardContent className="flex items-center justify-between p-6">
									<div className="flex items-center space-x-4">
										<div className="p-2 bg-blue-100 rounded-lg">
											{entity.type === "office_manager" ? (
												<Building className="h-5 w-5 text-blue-600" />
											) : (
												<Shield className="h-5 w-5 text-green-600" />
											)}
										</div>
										<div>
											<h4 className="font-medium">{entity.name}</h4>
											<p className="text-sm text-gray-500">{entity.email}</p>
											<div className="flex items-center space-x-2 mt-1">
												<Badge
													variant={
														entity.type === "office_manager"
															? "default"
															: "secondary"
													}>
													{entity.type === "office_manager"
														? "Office Manager"
														: "Police Manager"}
												</Badge>
												<Badge
													variant={
														entity.status === "active" ? "default" : "secondary"
													}>
													{entity.status}
												</Badge>
											</div>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<span className="text-sm text-gray-500">
											{entity.operatorsCount} operators
										</span>
										<Button variant="outline" size="sm">
											<Eye className="h-4 w-4" />
										</Button>
										<Button variant="outline" size="sm">
											<Edit className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="operators" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium">Operators</h3>
						<Button onClick={() => setShowCreateOperator(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Create Operator
						</Button>
					</div>

					<div className="grid gap-4">
						{operators.map((operator) => (
							<Card key={operator.id}>
								<CardContent className="flex items-center justify-between p-6">
									<div className="flex items-center space-x-4">
										<div className="p-2 bg-gray-100 rounded-lg">
											<UserCheck className="h-5 w-5 text-gray-600" />
										</div>
										<div>
											<h4 className="font-medium">{operator.name}</h4>
											<p className="text-sm text-gray-500">{operator.email}</p>
											<div className="flex items-center space-x-2 mt-1">
												<Badge variant="outline">
													Managed by: {operator.managedBy}
												</Badge>
												<Badge
													variant={
														operator.status === "active"
															? "default"
															: "secondary"
													}>
													{operator.status}
												</Badge>
											</div>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Button variant="outline" size="sm">
											<Eye className="h-4 w-4" />
										</Button>
										<Button variant="outline" size="sm">
											<Edit className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="system" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Settings className="h-5 w-5" />
								<span>System Configuration</span>
							</CardTitle>
							<CardDescription>
								Manage global system settings and security policies
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>Session Timeout (minutes)</Label>
									<Input type="number" defaultValue="30" />
								</div>
								<div>
									<Label>Max Login Attempts</Label>
									<Input type="number" defaultValue="3" />
								</div>
							</div>
							<Button>Save Configuration</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
