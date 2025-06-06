"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	AlertTriangle,
	Building,
	Users,
	Shield,
	CheckCircle,
	Clock,
	TrendingUp,
	Activity,
	MapPin,
	Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
	totalEntities?: number;
	totalOperators?: number;
	systemUptime?: string;
	activeAlarms?: number;
	totalBranches?: number;
	myOperators?: number;
	dispatched?: number;
	pendingReports?: number;
	officersOnDuty?: number;
	resolvedToday?: number;
	avgResponseTime?: string;
	assignedTasks?: number;
	completedToday?: number;
}

interface RecentAlarm {
	id: string;
	type: string;
	location: string;
	branch: string;
	priority: "Low" | "Medium" | "High" | "Critical";
	status: "Active" | "Acknowledged" | "Resolved" | "Dispatched";
	timestamp: string;
	description: string;
	assignedOfficer?: string;
}

interface PoliceOfficer {
	id: string;
	name: string;
	badge: string;
	status: "On Duty" | "Off Duty" | "Dispatched" | "Break";
	location: string;
	lastUpdate: string;
	activeCase?: string;
}

// Mock data for recent alarms
const mockRecentAlarms: RecentAlarm[] = [
	{
		id: "ALM-001",
		type: "Motion Detection",
		location: "Main Entrance",
		branch: "Downtown Branch",
		priority: "High",
		status: "Active",
		timestamp: "2024-01-15T10:30:00Z",
		description: "Unauthorized movement detected in restricted area",
		assignedOfficer: "Officer Johnson",
	},
	{
		id: "ALM-002",
		type: "Door Breach",
		location: "Server Room",
		branch: "Tech Center",
		priority: "Critical",
		status: "Dispatched",
		timestamp: "2024-01-15T09:45:00Z",
		description: "Forced entry attempt detected",
		assignedOfficer: "Officer Smith",
	},
	{
		id: "ALM-003",
		type: "Fire Alarm",
		location: "2nd Floor",
		branch: "Main Office",
		priority: "Critical",
		status: "Resolved",
		timestamp: "2024-01-15T08:15:00Z",
		description: "Smoke detected in office area",
		assignedOfficer: "Officer Davis",
	},
	{
		id: "ALM-004",
		type: "Glass Break",
		location: "Window A-12",
		branch: "Retail Store",
		priority: "Medium",
		status: "Acknowledged",
		timestamp: "2024-01-15T07:20:00Z",
		description: "Glass breakage sensor triggered",
	},
	{
		id: "ALM-005",
		type: "Panic Button",
		location: "Cashier Station 3",
		branch: "Bank Branch",
		priority: "Critical",
		status: "Active",
		timestamp: "2024-01-15T06:55:00Z",
		description: "Emergency panic button activated",
		assignedOfficer: "Officer Wilson",
	},
];

// Mock data for police officers
const mockPoliceOfficers: PoliceOfficer[] = [
	{
		id: "OFF-001",
		name: "Officer Johnson",
		badge: "B-1234",
		status: "Dispatched",
		location: "Downtown Branch",
		lastUpdate: "2024-01-15T10:32:00Z",
		activeCase: "ALM-001",
	},
	{
		id: "OFF-002",
		name: "Officer Smith",
		badge: "B-1235",
		status: "On Duty",
		location: "Central Station",
		lastUpdate: "2024-01-15T10:30:00Z",
	},
	{
		id: "OFF-003",
		name: "Officer Davis",
		badge: "B-1236",
		status: "Break",
		location: "Station 2",
		lastUpdate: "2024-01-15T10:15:00Z",
	},
	{
		id: "OFF-004",
		name: "Officer Wilson",
		badge: "B-1237",
		status: "Dispatched",
		location: "Bank Branch",
		lastUpdate: "2024-01-15T06:57:00Z",
		activeCase: "ALM-005",
	},
	{
		id: "OFF-005",
		name: "Officer Brown",
		badge: "B-1238",
		status: "Off Duty",
		location: "N/A",
		lastUpdate: "2024-01-14T22:00:00Z",
	},
];

export default function EnhancedDashboardOverview() {
	const { user } = useAuth();
	const [stats, setStats] = useState<DashboardStats>({});
	const [loading, setLoading] = useState(true);
	const [recentActivity, setRecentActivity] = useState<any[]>([]);

	useEffect(() => {
		const fetchDashboardData = async () => {
			if (!user) return;

			try {
				setLoading(true);

				switch (user.role) {
					case "SUPER_ADMIN":
						const systemAnalytics = await apiClient.getSystemAnalytics();
						setStats({
							totalEntities: systemAnalytics.overview.totalUsers,
							totalOperators: systemAnalytics.overview.totalUsers,
							systemUptime: "99.9%",
							activeAlarms: systemAnalytics.overview.activeAlarms,
						});
						setRecentActivity(systemAnalytics.recentActivity || []);
						break;

					case "OFFICE_MANAGER":
						const officeAnalytics = await apiClient.getOfficeAnalytics();
						const alarms = await apiClient.getAlarms({ status: "ACTIVE" });
						setStats({
							activeAlarms: alarms.length,
							totalBranches: officeAnalytics.overview.totalBranches,
							myOperators: officeAnalytics.overview.totalOperators,
							dispatched: 7,
						});
						break;

					case "POLICE_MANAGER":
						const policeAnalytics = await apiClient.getPoliceAnalytics();
						setStats({
							pendingReports: policeAnalytics.overview.pendingReports,
							officersOnDuty: 8,
							resolvedToday: policeAnalytics.overview.completedReports,
							avgResponseTime: policeAnalytics.overview.avgResponseTime + "m",
						});
						break;

					case "OPERATOR":
						setStats({
							assignedTasks: 3,
							completedToday: 5,
						});
						break;
				}
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [user]);

	if (!user) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center space-y-4 animate-fade-in">
					<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
					<p className="text-muted-foreground">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "Critical":
				return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400";
			case "High":
				return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400";
			case "Medium":
				return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400";
			case "Low":
				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Active":
				return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400";
			case "Dispatched":
				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
			case "Acknowledged":
				return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400";
			case "Resolved":
				return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
		}
	};

	const getOfficerStatusColor = (status: string) => {
		switch (status) {
			case "On Duty":
				return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400";
			case "Dispatched":
				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
			case "Break":
				return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400";
			case "Off Duty":
				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
		}
	};

	const formatTimeAgo = (timestamp: string) => {
		const now = new Date();
		const time = new Date(timestamp);
		const diffInMinutes = Math.floor(
			(now.getTime() - time.getTime()) / (1000 * 60)
		);

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	const renderOverviewCards = () => {
		switch (user.role) {
			case "SUPER_ADMIN":
				return (
					<>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Users
								</CardTitle>
								<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
									<Building className="h-4 w-4 text-blue-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.totalEntities || 0}
								</div>
								<p className="text-xs text-muted-foreground">System users</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Operators
								</CardTitle>
								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
									<Users className="h-4 w-4 text-green-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.totalOperators || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Active operators
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.2s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									System Uptime
								</CardTitle>
								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
									<Activity className="h-4 w-4 text-green-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{stats.systemUptime}
								</div>
								<p className="text-xs text-muted-foreground">Last 30 days</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.3s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Alarms
								</CardTitle>
								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
									<AlertTriangle className="h-4 w-4 text-red-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{stats.activeAlarms || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Across all branches
								</p>
							</CardContent>
						</Card>
					</>
				);
			case "OFFICE_MANAGER":
				return (
					<>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Alarms
								</CardTitle>
								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
									<AlertTriangle className="h-4 w-4 text-red-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{stats.activeAlarms || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Require immediate attention
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									My Branches
								</CardTitle>
								<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
									<Building className="h-4 w-4 text-blue-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.totalBranches || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Under management
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.2s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									My Operators
								</CardTitle>
								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
									<Users className="h-4 w-4 text-green-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.myOperators || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Active operators
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.3s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Dispatched Today
								</CardTitle>
								<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
									<TrendingUp className="h-4 w-4 text-purple-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-purple-600">
									{stats.dispatched || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									To police managers
								</p>
							</CardContent>
						</Card>
					</>
				);
			case "POLICE_MANAGER":
				return (
					<>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Pending Reports
								</CardTitle>
								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
									<AlertTriangle className="h-4 w-4 text-red-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{stats.pendingReports || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Require response
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Officers On Duty
								</CardTitle>
								<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
									<Shield className="h-4 w-4 text-blue-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-blue-600">
									{stats.officersOnDuty || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Available for dispatch
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.2s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Resolved Today
								</CardTitle>
								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
									<CheckCircle className="h-4 w-4 text-green-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{stats.resolvedToday || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Successfully handled
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.3s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Avg Response Time
								</CardTitle>
								<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
									<Clock className="h-4 w-4 text-purple-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-purple-600">
									{stats.avgResponseTime || "0m"}
								</div>
								<p className="text-xs text-muted-foreground">This month</p>
							</CardContent>
						</Card>
					</>
				);
			default:
				return (
					<>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Assigned Tasks
								</CardTitle>
								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
									<AlertTriangle className="h-4 w-4 text-red-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.assignedTasks || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Active assignments
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Completed Today
								</CardTitle>
								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
									<CheckCircle className="h-4 w-4 text-green-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{stats.completedToday || 0}
								</div>
								<p className="text-xs text-muted-foreground">Tasks resolved</p>
							</CardContent>
						</Card>
					</>
				);
		}
	};

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="animate-slide-up">
				<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
					Dashboard Overview
				</h1>
				<p className="text-muted-foreground mt-2">
					Welcome back, {user.name}. Here's what's happening with your security
					system today.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{renderOverviewCards()}
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
				{/* Recent Alarms Section */}
				<Card
					className="col-span-4 animate-slide-up glass"
					style={{ animationDelay: "0.4s" }}>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-red-500" />
							Recent Alarms
						</CardTitle>
						<CardDescription>
							Latest security alerts and incidents
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{mockRecentAlarms.slice(0, 5).map((alarm, index) => (
								<div
									key={alarm.id}
									className="flex items-start justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-all duration-200 border border-border/50"
									style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
									<div className="space-y-2 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<Badge
												className={cn(
													"text-xs font-medium",
													getPriorityColor(alarm.priority)
												)}>
												{alarm.priority}
											</Badge>
											<Badge
												className={cn(
													"text-xs font-medium",
													getStatusColor(alarm.status)
												)}>
												{alarm.status}
											</Badge>
											<span className="text-sm font-medium">{alarm.type}</span>
										</div>
										<div className="space-y-1">
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="h-3 w-3" />
												<span>
													{alarm.location} - {alarm.branch}
												</span>
											</div>
											<p className="text-sm text-muted-foreground">
												{alarm.description}
											</p>
											{alarm.assignedOfficer && (
												<div className="flex items-center gap-2 text-sm">
													<Shield className="h-3 w-3 text-blue-500" />
													<span className="text-blue-600 dark:text-blue-400">
														{alarm.assignedOfficer}
													</span>
												</div>
											)}
										</div>
									</div>
									<div className="flex flex-col items-end gap-2">
										<span className="text-xs text-muted-foreground">
											{formatTimeAgo(alarm.timestamp)}
										</span>
										<Button variant="outline" size="sm" className="h-8 w-8 p-0">
											<Eye className="h-3 w-3" />
										</Button>
									</div>
								</div>
							))}
						</div>
						<div className="mt-4 pt-4 border-t border-border">
							<Button variant="outline" className="w-full">
								View All Alarms
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Police Officer Status Section */}
				<Card
					className="col-span-3 animate-slide-up glass"
					style={{ animationDelay: "0.5s" }}>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5 text-blue-500" />
							Police Officer Status
						</CardTitle>
						<CardDescription>
							Current officer availability and deployment
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{mockPoliceOfficers.slice(0, 4).map((officer, index) => (
								<div
									key={officer.id}
									className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
									style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
											{officer.name.split(" ")[1]?.charAt(0) ||
												officer.name.charAt(0)}
										</div>
										<div>
											<p className="text-sm font-medium">{officer.name}</p>
											<p className="text-xs text-muted-foreground">
												{officer.badge}
											</p>
											{officer.activeCase && (
												<p className="text-xs text-blue-600 dark:text-blue-400">
													Case: {officer.activeCase}
												</p>
											)}
										</div>
									</div>
									<div className="text-right space-y-1">
										<Badge
											className={cn(
												"text-xs",
												getOfficerStatusColor(officer.status)
											)}>
											{officer.status}
										</Badge>
										<p className="text-xs text-muted-foreground">
											{formatTimeAgo(officer.lastUpdate)}
										</p>
									</div>
								</div>
							))}
						</div>
						<div className="mt-4 pt-4 border-t border-border">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="text-center">
									<p className="font-semibold text-green-600">
										{
											mockPoliceOfficers.filter((o) => o.status === "On Duty")
												.length
										}
									</p>
									<p className="text-xs text-muted-foreground">On Duty</p>
								</div>
								<div className="text-center">
									<p className="font-semibold text-blue-600">
										{
											mockPoliceOfficers.filter(
												(o) => o.status === "Dispatched"
											).length
										}
									</p>
									<p className="text-xs text-muted-foreground">Dispatched</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// "use client";

// import { useEffect, useState } from "react";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
// import {
// 	AlertTriangle,
// 	Building,
// 	Users,
// 	Shield,
// 	CheckCircle,
// 	Clock,
// 	TrendingUp,
// 	Activity,
// } from "lucide-react";
// import { useAuth } from "@/contexts/auth-context";
// import { apiClient } from "@/lib/api";
// import { Loader2 } from "lucide-react";

// interface DashboardStats {
// 	totalEntities?: number;
// 	totalOperators?: number;
// 	systemUptime?: string;
// 	activeAlarms?: number;
// 	totalBranches?: number;
// 	myOperators?: number;
// 	dispatched?: number;
// 	pendingReports?: number;
// 	officersOnDuty?: number;
// 	resolvedToday?: number;
// 	avgResponseTime?: string;
// 	assignedTasks?: number;
// 	completedToday?: number;
// }

// export default function DashboardOverview() {
// 	const { user } = useAuth();
// 	const [stats, setStats] = useState<DashboardStats>({});
// 	const [loading, setLoading] = useState(true);
// 	const [recentActivity, setRecentActivity] = useState<any[]>([]);

// 	useEffect(() => {
// 		const fetchDashboardData = async () => {
// 			if (!user) return;

// 			try {
// 				setLoading(true);

// 				switch (user.role) {
// 					case "SUPER_ADMIN":
// 						const systemAnalytics = await apiClient.getSystemAnalytics();
// 						setStats({
// 							totalEntities: systemAnalytics.overview.totalUsers,
// 							totalOperators: systemAnalytics.overview.totalUsers,
// 							systemUptime: "99.9%",
// 							activeAlarms: systemAnalytics.overview.activeAlarms,
// 						});
// 						setRecentActivity(systemAnalytics.recentActivity || []);
// 						break;

// 					case "OFFICE_MANAGER":
// 						const officeAnalytics = await apiClient.getOfficeAnalytics();
// 						const alarms = await apiClient.getAlarms({ status: "ACTIVE" });
// 						setStats({
// 							activeAlarms: alarms.length,
// 							totalBranches: officeAnalytics.overview.totalBranches,
// 							myOperators: officeAnalytics.overview.totalOperators,
// 							dispatched: 7, // Mock data
// 						});
// 						break;

// 					case "POLICE_MANAGER":
// 						const policeAnalytics = await apiClient.getPoliceAnalytics();
// 						setStats({
// 							pendingReports: policeAnalytics.overview.pendingReports,
// 							officersOnDuty: 8, // Mock data
// 							resolvedToday: policeAnalytics.overview.completedReports,
// 							avgResponseTime: policeAnalytics.overview.avgResponseTime + "m",
// 						});
// 						break;

// 					case "OPERATOR":
// 						setStats({
// 							assignedTasks: 3, // Mock data
// 							completedToday: 5, // Mock data
// 						});
// 						break;
// 				}
// 			} catch (error) {
// 				console.error("Failed to fetch dashboard data:", error);
// 			} finally {
// 				setLoading(false);
// 			}
// 		};

// 		fetchDashboardData();
// 	}, [user]);

// 	if (!user) return null;

// 	if (loading) {
// 		return (
// 			<div className="flex items-center justify-center min-h-[400px]">
// 				<div className="text-center space-y-4">
// 					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
// 					<p className="text-muted-foreground">Loading dashboard...</p>
// 				</div>
// 			</div>
// 		);
// 	}

// 	const renderOverviewCards = () => {
// 		switch (user.role) {
// 			case "SUPER_ADMIN":
// 				return (
// 					<>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Total Users
// 								</CardTitle>
// 								<Building className="h-4 w-4 text-muted-foreground" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.totalEntities || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">System users</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Total Operators
// 								</CardTitle>
// 								<Users className="h-4 w-4 text-muted-foreground" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.totalOperators || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Active operators
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									System Uptime
// 								</CardTitle>
// 								<Activity className="h-4 w-4 text-green-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">{stats.systemUptime}</div>
// 								<p className="text-xs text-muted-foreground">Last 30 days</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Active Alarms
// 								</CardTitle>
// 								<AlertTriangle className="h-4 w-4 text-red-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-red-600">
// 									{stats.activeAlarms || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Across all branches
// 								</p>
// 							</CardContent>
// 						</Card>
// 					</>
// 				);
// 			case "OFFICE_MANAGER":
// 				return (
// 					<>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Active Alarms
// 								</CardTitle>
// 								<AlertTriangle className="h-4 w-4 text-red-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-red-600">
// 									{stats.activeAlarms || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Require immediate attention
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									My Branches
// 								</CardTitle>
// 								<Building className="h-4 w-4 text-muted-foreground" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.totalBranches || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Under management
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									My Operators
// 								</CardTitle>
// 								<Users className="h-4 w-4 text-muted-foreground" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.myOperators || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Active operators
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Dispatched Today
// 								</CardTitle>
// 								<TrendingUp className="h-4 w-4 text-blue-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.dispatched || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									To police managers
// 								</p>
// 							</CardContent>
// 						</Card>
// 					</>
// 				);
// 			case "POLICE_MANAGER":
// 				return (
// 					<>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Pending Reports
// 								</CardTitle>
// 								<AlertTriangle className="h-4 w-4 text-red-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-red-600">
// 									{stats.pendingReports || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Require response
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Officers On Duty
// 								</CardTitle>
// 								<Shield className="h-4 w-4 text-muted-foreground" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.officersOnDuty || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Available for dispatch
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Resolved Today
// 								</CardTitle>
// 								<CheckCircle className="h-4 w-4 text-green-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-green-600">
// 									{stats.resolvedToday || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Successfully handled
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Avg Response Time
// 								</CardTitle>
// 								<Clock className="h-4 w-4 text-blue-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.avgResponseTime || "0m"}
// 								</div>
// 								<p className="text-xs text-muted-foreground">This month</p>
// 							</CardContent>
// 						</Card>
// 					</>
// 				);
// 			default:
// 				return (
// 					<>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Assigned Tasks
// 								</CardTitle>
// 								<AlertTriangle className="h-4 w-4 text-red-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.assignedTasks || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Active assignments
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Completed Today
// 								</CardTitle>
// 								<CheckCircle className="h-4 w-4 text-green-500" />
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.completedToday || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">Tasks resolved</p>
// 							</CardContent>
// 						</Card>
// 					</>
// 				);
// 		}
// 	};

// 	return (
// 		<div className="space-y-6">
// 			<div>
// 				<h1 className="text-3xl font-bold tracking-tight">
// 					Dashboard Overview
// 				</h1>
// 				<p className="text-muted-foreground">
// 					Welcome back, {user.name}. Here's what's happening with your security
// 					system today.
// 				</p>
// 			</div>

// 			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// 				{renderOverviewCards()}
// 			</div>

// 			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
// 				<Card className="col-span-4">
// 					<CardHeader>
// 						<CardTitle>Recent Activity</CardTitle>
// 					</CardHeader>
// 					<CardContent className="pl-2">
// 						<div className="space-y-4">
// 							{recentActivity.length > 0 ? (
// 								recentActivity.slice(0, 5).map((activity, index) => (
// 									<div key={index} className="flex items-center">
// 										<div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
// 										<div className="flex-1">
// 											<p className="text-sm font-medium">
// 												{activity.description || activity.type}
// 											</p>
// 											<p className="text-xs text-muted-foreground">
// 												{new Date(activity.createdAt).toLocaleString()}
// 											</p>
// 										</div>
// 									</div>
// 								))
// 							) : (
// 								<div className="text-center py-8">
// 									<p className="text-sm text-muted-foreground">
// 										No recent activity
// 									</p>
// 								</div>
// 							)}
// 						</div>
// 					</CardContent>
// 				</Card>
// 				<Card className="col-span-3">
// 					<CardHeader>
// 						<CardTitle>System Status</CardTitle>
// 						<CardDescription>Current operational status</CardDescription>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="space-y-4">
// 							<div className="flex items-center justify-between">
// 								<span className="text-sm">Alarm System</span>
// 								<div className="flex items-center">
// 									<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
// 									<span className="text-sm text-green-600">Online</span>
// 								</div>
// 							</div>
// 							<div className="flex items-center justify-between">
// 								<span className="text-sm">Communication</span>
// 								<div className="flex items-center">
// 									<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
// 									<span className="text-sm text-green-600">Connected</span>
// 								</div>
// 							</div>
// 							<div className="flex items-center justify-between">
// 								<span className="text-sm">Database</span>
// 								<div className="flex items-center">
// 									<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
// 									<span className="text-sm text-green-600">Operational</span>
// 								</div>
// 							</div>
// 							<div className="flex items-center justify-between">
// 								<span className="text-sm">Backup Systems</span>
// 								<div className="flex items-center">
// 									<div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
// 									<span className="text-sm text-yellow-600">Standby</span>
// 								</div>
// 							</div>
// 						</div>
// 					</CardContent>
// 				</Card>
// 			</div>
// 		</div>
// 	);
// }
