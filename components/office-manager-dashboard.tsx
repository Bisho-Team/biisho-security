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
import {
	Shield,
	AlertTriangle,
	CheckCircle,
	Clock,
	Users,
	FileText,
	Plus,
	Eye,
	MessageSquare,
} from "lucide-react";
import { PoliceDashboardEnhancements } from "@/components/police-dashboard-enhancements";

const mockAlarmReports = [
	{
		id: "1",
		type: "Motion Detection",
		location: "Main Entrance - Downtown Office",
		status: "pending",
		time: "5 minutes ago",
		severity: "high",
		dispatchedBy: "Downtown Office Manager",
		description: "Unauthorized motion detected at main entrance after hours",
	},
	{
		id: "2",
		type: "Door Breach",
		location: "Server Room - North Branch",
		status: "acknowledged",
		time: "20 minutes ago",
		severity: "critical",
		dispatchedBy: "North Branch Manager",
		description: "Server room door opened without authorization",
	},
	{
		id: "3",
		type: "Window Sensor",
		location: "Office 201 - Downtown Office",
		status: "resolved",
		time: "2 hours ago",
		severity: "medium",
		dispatchedBy: "Downtown Office Manager",
		description: "Window sensor triggered - false alarm due to maintenance",
	},
];

const mockPoliceOperators = [
	{
		id: "1",
		name: "Officer Johnson",
		badge: "P001",
		status: "on-duty",
		shift: "Day",
		assignedReports: 3,
	},
	{
		id: "2",
		name: "Officer Smith",
		badge: "P002",
		status: "on-duty",
		shift: "Night",
		assignedReports: 1,
	},
	{
		id: "3",
		name: "Officer Davis",
		badge: "P003",
		status: "off-duty",
		shift: "Day",
		assignedReports: 0,
	},
];

export default function PoliceManagerDashboard() {
	const [reports, setReports] = useState(mockAlarmReports);
	const [operators, setOperators] = useState(mockPoliceOperators);
	const [selectedReport, setSelectedReport] = useState<string | null>(null);

	const acknowledgeReport = (reportId: string) => {
		setReports(
			reports.map((report) =>
				report.id === reportId ? { ...report, status: "acknowledged" } : report
			)
		);
	};

	const resolveReport = (reportId: string) => {
		setReports(
			reports.map((report) =>
				report.id === reportId ? { ...report, status: "resolved" } : report
			)
		);
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "critical":
				return "bg-red-100 text-red-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "medium":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "acknowledged":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "resolved":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
		}
	};

	return (
		<div className="space-y-6">
			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Reports
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{reports.filter((r) => r.status === "pending").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Require immediate response
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
						<Clock className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{reports.filter((r) => r.status === "acknowledged").length}
						</div>
						<p className="text-xs text-muted-foreground">In progress</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Officers On Duty
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{operators.filter((o) => o.status === "on-duty").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Available for dispatch
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Resolved Today
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{reports.filter((r) => r.status === "resolved").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Successfully handled
						</p>
					</CardContent>
				</Card>
			</div>

			<PoliceDashboardEnhancements />

			{/* Management Tabs */}
			<Tabs defaultValue="reports" className="space-y-4">
				<TabsList>
					<TabsTrigger value="reports">Alarm Reports</TabsTrigger>
					<TabsTrigger value="officers">Officer Management</TabsTrigger>
					<TabsTrigger value="analytics">Response Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="reports" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium">Alarm Reports</h3>
						<div className="flex space-x-2">
							<Button variant="outline">
								<FileText className="h-4 w-4 mr-2" />
								Export Reports
							</Button>
						</div>
					</div>

					<div className="grid gap-4">
						{reports.map((report) => (
							<Card
								key={report.id}
								className={
									selectedReport === report.id ? "ring-2 ring-blue-500" : ""
								}>
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												{getStatusIcon(report.status)}
												<div>
													<h4 className="font-medium">{report.type}</h4>
													<p className="text-sm text-gray-500">
														{report.location}
													</p>
													<p className="text-xs text-gray-400">
														Dispatched by: {report.dispatchedBy} • {report.time}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Badge className={getSeverityColor(report.severity)}>
													{report.severity}
												</Badge>
												<Badge variant="outline">{report.status}</Badge>
											</div>
										</div>

										<div className="bg-gray-50 p-3 rounded-lg">
											<p className="text-sm">{report.description}</p>
										</div>

										<div className="flex items-center space-x-2">
											{report.status === "pending" && (
												<Button
													size="sm"
													onClick={() => acknowledgeReport(report.id)}
													className="bg-yellow-600 hover:bg-yellow-700">
													Acknowledge
												</Button>
											)}
											{report.status === "acknowledged" && (
												<Button
													size="sm"
													onClick={() => resolveReport(report.id)}
													className="bg-green-600 hover:bg-green-700">
													Mark Resolved
												</Button>
											)}
											<Button variant="outline" size="sm">
												<Eye className="h-4 w-4 mr-2" />
												View Details
											</Button>
											<Button variant="outline" size="sm">
												<MessageSquare className="h-4 w-4 mr-2" />
												Add Note
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="officers" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium">Officer Management</h3>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Add Officer
						</Button>
					</div>

					<div className="grid gap-4">
						{operators.map((officer) => (
							<Card key={officer.id}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-2 bg-blue-100 rounded-lg">
												<Shield className="h-5 w-5 text-blue-600" />
											</div>
											<div>
												<h4 className="font-medium">{officer.name}</h4>
												<p className="text-sm text-gray-500">
													Badge: {officer.badge}
												</p>
												<div className="flex items-center space-x-2 mt-1">
													<Badge variant="outline">{officer.shift} Shift</Badge>
													<Badge
														variant={
															officer.status === "on-duty"
																? "default"
																: "secondary"
														}>
														{officer.status}
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex items-center space-x-4">
											<div className="text-right">
												<p className="text-sm font-medium">
													{officer.assignedReports}
												</p>
												<p className="text-xs text-gray-500">
													Assigned Reports
												</p>
											</div>
											<Button variant="outline" size="sm">
												Assign Report
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Response Time Analytics</CardTitle>
								<CardDescription>
									Average response times by severity
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<span className="text-sm">Critical Alarms</span>
										<span className="font-medium">2.3 minutes</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">High Priority</span>
										<span className="font-medium">5.7 minutes</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">Medium Priority</span>
										<span className="font-medium">12.1 minutes</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Resolution Statistics</CardTitle>
								<CardDescription>This month's performance</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<span className="text-sm">Total Reports</span>
										<span className="font-medium">47</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">Resolved</span>
										<span className="font-medium text-green-600">42 (89%)</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">False Alarms</span>
										<span className="font-medium text-yellow-600">8 (17%)</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// "use client";

// import { useState } from "react";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import {
// 	AlertTriangle,
// 	Building,
// 	Users,
// 	Plus,
// 	Send,
// 	Settings,
// 	MapPin,
// 	Clock,
// 	CheckCircle,
// 	XCircle,
// } from "lucide-react";

// const mockAlarms = [
// 	{
// 		id: "1",
// 		type: "Motion Detection",
// 		location: "Main Entrance",
// 		status: "active",
// 		time: "2 minutes ago",
// 		severity: "high",
// 	},
// 	{
// 		id: "2",
// 		type: "Door Breach",
// 		location: "Server Room",
// 		status: "acknowledged",
// 		time: "15 minutes ago",
// 		severity: "critical",
// 	},
// 	{
// 		id: "3",
// 		type: "Window Sensor",
// 		location: "Office 201",
// 		status: "resolved",
// 		time: "1 hour ago",
// 		severity: "medium",
// 	},
// ];

// const mockBranches = [
// 	{
// 		id: "1",
// 		name: "Main Office",
// 		address: "123 Business St",
// 		operators: 3,
// 		alarms: 5,
// 		status: "active",
// 	},
// 	{
// 		id: "2",
// 		name: "North Branch",
// 		address: "456 North Ave",
// 		operators: 2,
// 		alarms: 2,
// 		status: "active",
// 	},
// 	{
// 		id: "3",
// 		name: "South Branch",
// 		address: "789 South Rd",
// 		operators: 1,
// 		alarms: 0,
// 		status: "maintenance",
// 	},
// ];

// const mockOperators = [
// 	{
// 		id: "1",
// 		name: "Alice Cooper",
// 		email: "alice@koppa.com",
// 		branch: "Main Office",
// 		status: "active",
// 		shift: "Day",
// 	},
// 	{
// 		id: "2",
// 		name: "Bob Wilson",
// 		email: "bob@koppa.com",
// 		branch: "North Branch",
// 		status: "active",
// 		shift: "Night",
// 	},
// 	{
// 		id: "3",
// 		name: "Carol Davis",
// 		email: "carol@koppa.com",
// 		branch: "Main Office",
// 		status: "off-duty",
// 		shift: "Day",
// 	},
// ];

// export default function OfficeManagerDashboard() {
// 	const [alarms, setAlarms] = useState(mockAlarms);
// 	const [branches, setBranches] = useState(mockBranches);
// 	const [operators, setOperators] = useState(mockOperators);
// 	const [dispatchMessage, setDispatchMessage] = useState("");

// 	const dispatchToPolice = (alarmId: string) => {
// 		setAlarms(
// 			alarms.map((alarm) =>
// 				alarm.id === alarmId ? { ...alarm, status: "dispatched" } : alarm
// 			)
// 		);
// 		alert("Alarm dispatched to Police Manager successfully!");
// 	};

// 	const getSeverityColor = (severity: string) => {
// 		switch (severity) {
// 			case "critical":
// 				return "bg-red-100 text-red-800";
// 			case "high":
// 				return "bg-orange-100 text-orange-800";
// 			case "medium":
// 				return "bg-yellow-100 text-yellow-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	const getStatusIcon = (status: string) => {
// 		switch (status) {
// 			case "active":
// 				return <AlertTriangle className="h-4 w-4 text-red-500" />;
// 			case "acknowledged":
// 				return <Clock className="h-4 w-4 text-yellow-500" />;
// 			case "resolved":
// 				return <CheckCircle className="h-4 w-4 text-green-500" />;
// 			case "dispatched":
// 				return <Send className="h-4 w-4 text-blue-500" />;
// 			default:
// 				return <XCircle className="h-4 w-4 text-gray-500" />;
// 		}
// 	};

// 	return (
// 		<div className="space-y-6">
// 			{/* Overview Cards */}
// 			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
// 						<AlertTriangle className="h-4 w-4 text-red-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-red-600">
// 							{alarms.filter((a) => a.status === "active").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">
// 							Require immediate attention
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Branches
// 						</CardTitle>
// 						<Building className="h-4 w-4 text-muted-foreground" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold">{branches.length}</div>
// 						<p className="text-xs text-muted-foreground">
// 							{branches.filter((b) => b.status === "active").length} operational
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">My Operators</CardTitle>
// 						<Users className="h-4 w-4 text-muted-foreground" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold">{operators.length}</div>
// 						<p className="text-xs text-muted-foreground">
// 							{operators.filter((o) => o.status === "active").length} on duty
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">System Status</CardTitle>
// 						<CheckCircle className="h-4 w-4 text-green-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-green-600">Online</div>
// 						<p className="text-xs text-muted-foreground">
// 							All systems operational
// 						</p>
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Management Tabs */}
// 			<Tabs defaultValue="alarms" className="space-y-4">
// 				<TabsList>
// 					<TabsTrigger value="alarms">Alarm Management</TabsTrigger>
// 					<TabsTrigger value="branches">Branch Management</TabsTrigger>
// 					<TabsTrigger value="operators">Operator Management</TabsTrigger>
// 					<TabsTrigger value="settings">System Configuration</TabsTrigger>
// 				</TabsList>

// 				<TabsContent value="alarms" className="space-y-4">
// 					<div className="flex justify-between items-center">
// 						<h3 className="text-lg font-medium">Alarm System</h3>
// 						<Button>
// 							<Plus className="h-4 w-4 mr-2" />
// 							Configure New Alarm
// 						</Button>
// 					</div>

// 					<div className="grid gap-4">
// 						{alarms.map((alarm) => (
// 							<Card key={alarm.id}>
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											{getStatusIcon(alarm.status)}
// 											<div>
// 												<h4 className="font-medium">{alarm.type}</h4>
// 												<p className="text-sm text-gray-500 flex items-center">
// 													<MapPin className="h-3 w-3 mr-1" />
// 													{alarm.location} • {alarm.time}
// 												</p>
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<Badge className={getSeverityColor(alarm.severity)}>
// 												{alarm.severity}
// 											</Badge>
// 											<Badge variant="outline">{alarm.status}</Badge>
// 											{alarm.status === "active" && (
// 												<Button
// 													size="sm"
// 													onClick={() => dispatchToPolice(alarm.id)}
// 													className="bg-red-600 hover:bg-red-700">
// 													<Send className="h-4 w-4 mr-2" />
// 													Dispatch to Police
// 												</Button>
// 											)}
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="branches" className="space-y-4">
// 					<div className="flex justify-between items-center">
// 						<h3 className="text-lg font-medium">Branch Management</h3>
// 						<Button>
// 							<Plus className="h-4 w-4 mr-2" />
// 							Add Branch
// 						</Button>
// 					</div>

// 					<div className="grid gap-4">
// 						{branches.map((branch) => (
// 							<Card key={branch.id}>
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											<div className="p-2 bg-blue-100 rounded-lg">
// 												<Building className="h-5 w-5 text-blue-600" />
// 											</div>
// 											<div>
// 												<h4 className="font-medium">{branch.name}</h4>
// 												<p className="text-sm text-gray-500">
// 													{branch.address}
// 												</p>
// 												<div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
// 													<span>{branch.operators} operators</span>
// 													<span>{branch.alarms} active alarms</span>
// 												</div>
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<Badge
// 												variant={
// 													branch.status === "active" ? "default" : "secondary"
// 												}>
// 												{branch.status}
// 											</Badge>
// 											<Button variant="outline" size="sm">
// 												Manage
// 											</Button>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="operators" className="space-y-4">
// 					<div className="flex justify-between items-center">
// 						<h3 className="text-lg font-medium">Operator Management</h3>
// 						<Button>
// 							<Plus className="h-4 w-4 mr-2" />
// 							Add Operator
// 						</Button>
// 					</div>

// 					<div className="grid gap-4">
// 						{operators.map((operator) => (
// 							<Card key={operator.id}>
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											<div className="p-2 bg-green-100 rounded-lg">
// 												<Users className="h-5 w-5 text-green-600" />
// 											</div>
// 											<div>
// 												<h4 className="font-medium">{operator.name}</h4>
// 												<p className="text-sm text-gray-500">
// 													{operator.email}
// 												</p>
// 												<div className="flex items-center space-x-2 mt-1">
// 													<Badge variant="outline">{operator.branch}</Badge>
// 													<Badge variant="outline">
// 														{operator.shift} Shift
// 													</Badge>
// 												</div>
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<Badge
// 												variant={
// 													operator.status === "active" ? "default" : "secondary"
// 												}>
// 												{operator.status}
// 											</Badge>
// 											<Select defaultValue={operator.branch}>
// 												<SelectTrigger className="w-32">
// 													<SelectValue />
// 												</SelectTrigger>
// 												<SelectContent>
// 													{branches.map((branch) => (
// 														<SelectItem key={branch.id} value={branch.name}>
// 															{branch.name}
// 														</SelectItem>
// 													))}
// 												</SelectContent>
// 											</Select>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="settings" className="space-y-4">
// 					<Card>
// 						<CardHeader>
// 							<CardTitle className="flex items-center space-x-2">
// 								<Settings className="h-5 w-5" />
// 								<span>Alarm System Configuration</span>
// 							</CardTitle>
// 							<CardDescription>
// 								Configure alarm types, sensitivity, and notification settings
// 							</CardDescription>
// 						</CardHeader>
// 						<CardContent className="space-y-4">
// 							<div className="grid grid-cols-2 gap-4">
// 								<div>
// 									<Label>Motion Sensor Sensitivity</Label>
// 									<Select defaultValue="medium">
// 										<SelectTrigger>
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="low">Low</SelectItem>
// 											<SelectItem value="medium">Medium</SelectItem>
// 											<SelectItem value="high">High</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 								<div>
// 									<Label>Auto-Dispatch Threshold</Label>
// 									<Select defaultValue="high">
// 										<SelectTrigger>
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="medium">Medium Priority</SelectItem>
// 											<SelectItem value="high">High Priority</SelectItem>
// 											<SelectItem value="critical">Critical Only</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>
// 							<div>
// 								<Label>Notification Message Template</Label>
// 								<Textarea
// 									placeholder="Enter default dispatch message template..."
// 									value={dispatchMessage}
// 									onChange={(e) => setDispatchMessage(e.target.value)}
// 								/>
// 							</div>
// 							<Button>Save Configuration</Button>
// 						</CardContent>
// 					</Card>
// 				</TabsContent>
// 			</Tabs>
// 		</div>
// 	);
// }
