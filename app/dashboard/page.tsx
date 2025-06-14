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
	Zap,
	Target,
	BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
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
	status: "Available" | "On Duty" | "Off Duty" | "Dispatched" | "Break";
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
		branch: "Main Branch",
		priority: "High",
		status: "Active",
		timestamp: "2025-01-15T10:30:00Z",
		description: "Unauthorized movement detected in restricted area",
		assignedOfficer: "Officer Tinebeb",
	},
	{
		id: "ALM-002",
		type: "Door Breach",
		location: "Server Room",
		branch: "Tech Center",
		priority: "Critical",
		status: "Dispatched",
		timestamp: "2025-01-15T09:45:00Z",
		description: "Forced entry attempt detected",
		assignedOfficer: "Officer Bekele",
	},
	{
		id: "ALM-003",
		type: "Fire Alarm",
		location: "2nd Floor",
		branch: "Main Office",
		priority: "Critical",
		status: "Resolved",
		timestamp: "2025-01-15T08:15:00Z",
		description: "Smoke detected in office area",
		assignedOfficer: "Officer Dawit",
	},
	{
		id: "ALM-004",
		type: "Glass Break",
		location: "Window A-12",
		branch: "Retail Store",
		priority: "Medium",
		status: "Acknowledged",
		timestamp: "2025-01-15T07:20:00Z",
		description: "Glass breakage sensor triggered",
	},
	{
		id: "ALM-005",
		type: "Panic Button",
		location: "Cashier Station 3",
		branch: "Bank Branch",
		priority: "Critical",
		status: "Active",
		timestamp: "2025-01-15T06:55:00Z",
		description: "Emergency panic button activated",
		assignedOfficer: "Officer Bekele",
	},
];

// Mock data for police officers
const mockPoliceOfficers: PoliceOfficer[] = [
	{
		id: "AA-OFF-001",
		name: "AA Police Manager",
		badge: "AA-5566",
		status: "Available",
		location: "Main Branch",
		lastUpdate: "2025-05-15T10:32:00Z",
		activeCase: "ALM-001",
	},
	{
		id: "AA-OFF-002",
		name: "Hibert Bank Manager",
		badge: "AA-7765",
		status: "Available",
		location: "Main Branch",
		lastUpdate: "2025-05-15T10:32:00Z",
		activeCase: "ALM-002",
	},
	{
		id: "AA-OFF-003",
		name: "Koppa Security Manager",
		badge: "AA-7421",
		status: "Off Duty",
		location: "Main Branch",
		lastUpdate: "2025-05-15T10:32:00Z",
		activeCase: "ALM-0023",
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
					<div className="relative">
						<div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
						<Zap className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
					</div>
					<div className="space-y-2">
						<p className="text-lg font-semibold">Loading Dashboard</p>
						<p className="text-muted-foreground">
							Fetching your security data...
						</p>
					</div>
				</div>
			</div>
		);
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "Critical":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/25";
			case "High":
				return "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg shadow-orange-500/25";
			case "Medium":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg shadow-yellow-500/25";
			case "Low":
				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/25";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Active":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0 animate-pulse";
			case "Dispatched":
				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0";
			case "Acknowledged":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0";
			case "Resolved":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
		}
	};

	const getOfficerStatusColor = (status: string) => {
		switch (status) {
			case "On Duty":
			case "Available":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
			case "Dispatched":
				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0";
			case "Break":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0";
			case "Off Duty":
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
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
						<Card className="animate-slide-up glass border-red-500/20 hover:border-red-500/40 transition-all duration-300 group">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Alarms
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform">
									<AlertTriangle className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-red-600 mb-1">
									{stats.activeAlarms || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Target className="h-3 w-3" />
									Across all branches
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Users
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform">
									<Building className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-1">
									{stats.totalEntities || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Users className="h-3 w-3" />
									System users
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-green-500/20 hover:border-green-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.2s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Operators
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform">
									<Users className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-1">
									{stats.totalOperators || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Activity className="h-3 w-3" />
									Active operators
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.3s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									System Uptime
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
									<Activity className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-emerald-600 mb-1">
									{stats.systemUptime}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<CheckCircle className="h-3 w-3" />
									Last 30 days
								</p>
							</CardContent>
						</Card>
					</>
				);
			case "OFFICE_MANAGER":
				return (
					<>
						<Card className="animate-slide-up glass border-red-500/20 hover:border-red-500/40 transition-all duration-300 group">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Alarms
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform">
									<AlertTriangle className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-red-600 mb-1">
									{stats.activeAlarms || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Zap className="h-3 w-3" />
									Require immediate attention
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									My Branches
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform">
									<Building className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-1">
									{stats.totalBranches || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Target className="h-3 w-3" />
									Under management
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-green-500/20 hover:border-green-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.2s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									My Operators
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform">
									<Users className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-1">
									{stats.myOperators || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Activity className="h-3 w-3" />
									Active operators
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.3s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Dispatched Today
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
									<TrendingUp className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-purple-600 mb-1">
									{stats.dispatched || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Shield className="h-3 w-3" />
									To police managers
								</p>
							</CardContent>
						</Card>
					</>
				);
			case "POLICE_MANAGER":
				return (
					<>
						<Card className="animate-slide-up glass border-red-500/20 hover:border-red-500/40 transition-all duration-300 group">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Pending Reports
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform">
									<AlertTriangle className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-red-600 mb-1">
									{stats.pendingReports || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Clock className="h-3 w-3" />
									Require response
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Officers On Duty
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform">
									<Shield className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-600 mb-1">
									{stats.officersOnDuty || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Target className="h-3 w-3" />
									Available for dispatch
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-green-500/20 hover:border-green-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.2s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Resolved Today
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform">
									<CheckCircle className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-600 mb-1">
									{stats.resolvedToday || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Activity className="h-3 w-3" />
									Successfully handled
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.3s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Avg Response Time
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
									<Clock className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-purple-600 mb-1">
									{stats.avgResponseTime || "0m"}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<BarChart3 className="h-3 w-3" />
									This month
								</p>
							</CardContent>
						</Card>
					</>
				);
			default:
				return (
					<>
						<Card className="animate-slide-up glass border-red-500/20 hover:border-red-500/40 transition-all duration-300 group">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Assigned Tasks
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform">
									<AlertTriangle className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-1">
									{stats.assignedTasks || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Target className="h-3 w-3" />
									Active assignments
								</p>
							</CardContent>
						</Card>
						<Card
							className="animate-slide-up glass border-green-500/20 hover:border-green-500/40 transition-all duration-300 group"
							style={{ animationDelay: "0.1s" }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Completed Today
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform">
									<CheckCircle className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-600 mb-1">
									{stats.completedToday || 0}
								</div>
								<p className="text-xs text-muted-foreground flex items-center gap-1">
									<Activity className="h-3 w-3" />
									Tasks resolved
								</p>
							</CardContent>
						</Card>
					</>
				);
		}
	};

	return (
		<div className="space-y-8 animate-fade-in">
			{/* Enhanced Header */}
			<div className="animate-slide-up">
				<div className="flex items-center gap-4 mb-4">
					<div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
						<BarChart3 className="h-8 w-8 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
							Dashboard Overview
						</h1>
						<p className="text-muted-foreground text-lg mt-1">
							Welcome back,{" "}
							<span className="font-semibold text-foreground">{user.name}</span>
							. Here's your security system status.
						</p>
					</div>
				</div>
			</div>

			{/* Enhanced Stats Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{renderOverviewCards()}
			</div>

			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
				{/* Enhanced Recent Alarms Section */}
				<Card
					className="col-span-4 animate-slide-up glass border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
					style={{ animationDelay: "0.4s" }}>
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
									<AlertTriangle className="h-6 w-6 text-white" />
								</div>
								<div>
									<CardTitle className="text-xl">
										Recent Security Alerts
									</CardTitle>
									<CardDescription className="text-base">
										Latest incidents requiring attention
									</CardDescription>
								</div>
							</div>
							<Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-3 py-1">
								{mockRecentAlarms.filter((a) => a.status === "Active").length}{" "}
								Active
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{mockRecentAlarms.slice(0, 5).map((alarm, index) => (
								<div
									key={alarm.id}
									className="flex items-start justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/50 hover:from-muted/50 hover:to-muted/70 transition-all duration-300 border border-border/50 hover:border-border group"
									style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
									<div className="space-y-3 flex-1">
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
											<span className="text-sm font-semibold">
												{alarm.type}
											</span>
										</div>
										<div className="space-y-2">
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="h-4 w-4" />
												<span className="font-medium">
													{alarm.location} - {alarm.branch}
												</span>
											</div>
											<p className="text-sm text-muted-foreground leading-relaxed">
												{alarm.description}
											</p>
											{alarm.assignedOfficer && (
												<div className="flex items-center gap-2 text-sm">
													<Shield className="h-4 w-4 text-blue-500" />
													<span className="text-blue-600 dark:text-blue-400 font-medium">
														{alarm.assignedOfficer}
													</span>
												</div>
											)}
										</div>
									</div>
									<div className="flex flex-col items-end gap-3">
										<span className="text-xs text-muted-foreground font-medium">
											{formatTimeAgo(alarm.timestamp)}
										</span>
										<Button
											variant="outline"
											size="sm"
											className="h-9 w-9 p-0 group-hover:scale-110 transition-transform">
											<Eye className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
						<div className="mt-6 pt-4 border-t border-border">
							<Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-11">
								View All Security Alerts
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Enhanced Police Officer Status Section */}
				<Card
					className="col-span-3 animate-slide-up glass border-blue-500/20 hover:border-blue-500/40 transition-all duration-300"
					style={{ animationDelay: "0.5s" }}>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
								<Shield className="h-6 w-6 text-white" />
							</div>
							<div>
								<CardTitle className="text-xl">Officer Status</CardTitle>
								<CardDescription className="text-base">
									Current deployment and availability
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{mockPoliceOfficers.slice(0, 4).map((officer, index) => (
								<div
									key={officer.id}
									className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/50 hover:from-muted/50 hover:to-muted/70 transition-all duration-300 border border-border/50 hover:border-border group"
									style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
									<div className="flex items-center gap-4">
										<div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
											{officer.name.split(" ")[1]?.charAt(0) ||
												officer.name.charAt(0)}
										</div>
										<div>
											<p className="text-sm font-semibold">{officer.name}</p>
											<p className="text-xs text-muted-foreground font-medium">
												{officer.badge}
											</p>
											{officer.activeCase && (
												<p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
													Case: {officer.activeCase}
												</p>
											)}
										</div>
									</div>
									<div className="text-right space-y-2">
										<Badge
											className={cn(
												"text-xs font-medium",
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
						<div className="mt-6 pt-4 border-t border-border">
							<div className="grid grid-cols-2 gap-6 text-sm">
								<div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
									<p className="text-2xl font-bold text-green-600 mb-1">
										{
											mockPoliceOfficers.filter(
												(o) =>
													o.status === "On Duty" || o.status === "Available"
											).length
										}
									</p>
									<p className="text-xs text-muted-foreground font-medium">
										Available
									</p>
								</div>
								<div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
									<p className="text-2xl font-bold text-blue-600 mb-1">
										{
											mockPoliceOfficers.filter(
												(o) => o.status === "Dispatched"
											).length
										}
									</p>
									<p className="text-xs text-muted-foreground font-medium">
										Dispatched
									</p>
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
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
// 	AlertTriangle,
// 	Building,
// 	Users,
// 	Shield,
// 	CheckCircle,
// 	Clock,
// 	TrendingUp,
// 	Activity,
// 	MapPin,
// 	Eye,
// } from "lucide-react";
// import { useAuth } from "@/contexts/auth-context";
// import { apiClient } from "@/lib/api";
// import { Loader2 } from "lucide-react";
// import { cn } from "@/lib/utils";

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

// interface RecentAlarm {
// 	id: string;
// 	type: string;
// 	location: string;
// 	branch: string;
// 	priority: "Low" | "Medium" | "High" | "Critical";
// 	status: "Active" | "Acknowledged" | "Resolved" | "Dispatched";
// 	timestamp: string;
// 	description: string;
// 	assignedOfficer?: string;
// }

// interface PoliceOfficer {
// 	id: string;
// 	name: string;
// 	badge: string;
// 	status: "Available" | "On Duty" | "Off Duty" | "Dispatched" | "Break";
// 	location: string;
// 	lastUpdate: string;
// 	activeCase?: string;
// }

// // Mock data for recent alarms
// const mockRecentAlarms: RecentAlarm[] = [
// 	{
// 		id: "ALM-001",
// 		type: "Motion Detection",
// 		location: "Main Entrance",
// 		branch: "Main Branch",
// 		priority: "High",
// 		status: "Active",
// 		timestamp: "2025-01-15T10:30:00Z",
// 		description: "Unauthorized movement detected in restricted area",
// 		assignedOfficer: "Officer Tinebeb",
// 	},
// 	{
// 		id: "ALM-002",
// 		type: "Door Breach",
// 		location: "Server Room",
// 		branch: "Tech Center",
// 		priority: "Critical",
// 		status: "Dispatched",
// 		timestamp: "2025-01-15T09:45:00Z",
// 		description: "Forced entry attempt detected",
// 		assignedOfficer: "Officer Bekele",
// 	},
// 	{
// 		id: "ALM-003",
// 		type: "Fire Alarm",
// 		location: "2nd Floor",
// 		branch: "Main Office",
// 		priority: "Critical",
// 		status: "Resolved",
// 		timestamp: "2025-01-15T08:15:00Z",
// 		description: "Smoke detected in office area",
// 		assignedOfficer: "Officer Dawit",
// 	},
// 	{
// 		id: "ALM-004",
// 		type: "Glass Break",
// 		location: "Window A-12",
// 		branch: "Retail Store",
// 		priority: "Medium",
// 		status: "Acknowledged",
// 		timestamp: "2025-01-15T07:20:00Z",
// 		description: "Glass breakage sensor triggered",
// 	},
// 	{
// 		id: "ALM-005",
// 		type: "Panic Button",
// 		location: "Cashier Station 3",
// 		branch: "Bank Branch",
// 		priority: "Critical",
// 		status: "Active",
// 		timestamp: "2025-01-15T06:55:00Z",
// 		description: "Emergency panic button activated",
// 		assignedOfficer: "Officer Bekele",
// 	},
// ];

// // Mock data for police officers
// const mockPoliceOfficers: PoliceOfficer[] = [
// 	{
// 		id: "AA-OFF-001",
// 		name: "AA Police Manager",
// 		badge: "AA-1234",
// 		status: "Available",
// 		location: "Main Branch",
// 		lastUpdate: "2025-05-15T10:32:00Z",
// 		activeCase: "ALM-001",
// 	},
// 	// {
// 	// 	id: "OFF-002",
// 	// 	name: "Officer Smith",
// 	// 	badge: "B-1235",
// 	// 	status: "On Duty",
// 	// 	location: "Central Station",
// 	// 	lastUpdate: "2024-01-15T10:30:00Z",
// 	// },
// ];

// export default function EnhancedDashboardOverview() {
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
// 							dispatched: 7,
// 						});
// 						break;

// 					case "POLICE_MANAGER":
// 						const policeAnalytics = await apiClient.getPoliceAnalytics();
// 						setStats({
// 							pendingReports: policeAnalytics.overview.pendingReports,
// 							officersOnDuty: 8,
// 							resolvedToday: policeAnalytics.overview.completedReports,
// 							avgResponseTime: policeAnalytics.overview.avgResponseTime + "m",
// 						});
// 						break;

// 					case "OPERATOR":
// 						setStats({
// 							assignedTasks: 3,
// 							completedToday: 5,
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
// 				<div className="text-center space-y-4 animate-fade-in">
// 					<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
// 					<p className="text-muted-foreground">Loading dashboard...</p>
// 				</div>
// 			</div>
// 		);
// 	}

// 	const getPriorityColor = (priority: string) => {
// 		switch (priority) {
// 			case "Critical":
// 				return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400";
// 			case "High":
// 				return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400";
// 			case "Medium":
// 				return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400";
// 			case "Low":
// 				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
// 			default:
// 				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
// 		}
// 	};

// 	const getStatusColor = (status: string) => {
// 		switch (status) {
// 			case "Active":
// 				return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400";
// 			case "Dispatched":
// 				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
// 			case "Acknowledged":
// 				return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400";
// 			case "Resolved":
// 				return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400";
// 			default:
// 				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
// 		}
// 	};

// 	const getOfficerStatusColor = (status: string) => {
// 		switch (status) {
// 			case "On Duty":
// 				return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400";
// 			case "Available":
// 				return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400";
// 			case "Dispatched":
// 				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
// 			case "Break":
// 				return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400";
// 			case "Off Duty":
// 				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
// 			default:
// 				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400";
// 		}
// 	};

// 	const formatTimeAgo = (timestamp: string) => {
// 		const now = new Date();
// 		const time = new Date(timestamp);
// 		const diffInMinutes = Math.floor(
// 			(now.getTime() - time.getTime()) / (1000 * 60)
// 		);

// 		if (diffInMinutes < 1) return "Just now";
// 		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
// 		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
// 		return `${Math.floor(diffInMinutes / 1440)}d ago`;
// 	};

// 	const renderOverviewCards = () => {
// 		switch (user.role) {
// 			case "SUPER_ADMIN":
// 				return (
// 					<>
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.3s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Active Alarms
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
// 									<AlertTriangle className="h-4 w-4 text-red-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Total Users
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
// 									<Building className="h-4 w-4 text-blue-500" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold">
// 									{stats.totalEntities || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">System users</p>
// 							</CardContent>
// 						</Card>
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.1s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Total Operators
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
// 									<Users className="h-4 w-4 text-green-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.2s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									System Uptime
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
// 									<Activity className="h-4 w-4 text-green-500" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-green-600">
// 									{stats.systemUptime}
// 								</div>
// 								<p className="text-xs text-muted-foreground">Last 30 days</p>
// 							</CardContent>
// 						</Card>
// 					</>
// 				);
// 			case "OFFICE_MANAGER":
// 				return (
// 					<>
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Active Alarms
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
// 									<AlertTriangle className="h-4 w-4 text-red-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.1s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									My Branches
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
// 									<Building className="h-4 w-4 text-blue-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.2s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									My Operators
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
// 									<Users className="h-4 w-4 text-green-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.3s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Dispatched Today
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
// 									<TrendingUp className="h-4 w-4 text-purple-500" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-purple-600">
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Pending Reports
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
// 									<AlertTriangle className="h-4 w-4 text-red-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.1s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Officers On Duty
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
// 									<Shield className="h-4 w-4 text-blue-500" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-blue-600">
// 									{stats.officersOnDuty || 0}
// 								</div>
// 								<p className="text-xs text-muted-foreground">
// 									Available for dispatch
// 								</p>
// 							</CardContent>
// 						</Card>
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.2s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Resolved Today
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
// 									<CheckCircle className="h-4 w-4 text-green-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.3s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Avg Response Time
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
// 									<Clock className="h-4 w-4 text-purple-500" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-purple-600">
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Assigned Tasks
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
// 									<AlertTriangle className="h-4 w-4 text-red-500" />
// 								</div>
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
// 						<Card
// 							className="animate-slide-up glass"
// 							style={{ animationDelay: "0.1s" }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<CardTitle className="text-sm font-medium">
// 									Completed Today
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
// 									<CheckCircle className="h-4 w-4 text-green-500" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-2xl font-bold text-green-600">
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
// 		<div className="space-y-6 animate-fade-in">
// 			<div className="animate-slide-up">
// 				<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
// 					Dashboard Overview
// 				</h1>
// 				<p className="text-muted-foreground mt-2">
// 					Welcome back, {user.name}. Here's what's happening with your security
// 					system today.
// 				</p>
// 			</div>

// 			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// 				{renderOverviewCards()}
// 			</div>

// 			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
// 				{/* Recent Alarms Section */}
// 				<Card
// 					className="col-span-4 animate-slide-up glass"
// 					style={{ animationDelay: "0.4s" }}>
// 					<CardHeader>
// 						<CardTitle className="flex items-center gap-2">
// 							<AlertTriangle className="h-5 w-5 text-red-500" />
// 							Recent Alarms
// 						</CardTitle>
// 						<CardDescription>
// 							Latest security alerts and incidents
// 						</CardDescription>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="space-y-4">
// 							{mockRecentAlarms.slice(0, 5).map((alarm, index) => (
// 								<div
// 									key={alarm.id}
// 									className="flex items-start justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-all duration-200 border border-border/50"
// 									style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
// 									<div className="space-y-2 flex-1">
// 										<div className="flex items-center gap-2 flex-wrap">
// 											<Badge
// 												className={cn(
// 													"text-xs font-medium",
// 													getPriorityColor(alarm.priority)
// 												)}>
// 												{alarm.priority}
// 											</Badge>
// 											<Badge
// 												className={cn(
// 													"text-xs font-medium",
// 													getStatusColor(alarm.status)
// 												)}>
// 												{alarm.status}
// 											</Badge>
// 											<span className="text-sm font-medium">{alarm.type}</span>
// 										</div>
// 										<div className="space-y-1">
// 											<div className="flex items-center gap-2 text-sm text-muted-foreground">
// 												<MapPin className="h-3 w-3" />
// 												<span>
// 													{alarm.location} - {alarm.branch}
// 												</span>
// 											</div>
// 											<p className="text-sm text-muted-foreground">
// 												{alarm.description}
// 											</p>
// 											{alarm.assignedOfficer && (
// 												<div className="flex items-center gap-2 text-sm">
// 													<Shield className="h-3 w-3 text-blue-500" />
// 													<span className="text-blue-600 dark:text-blue-400">
// 														{alarm.assignedOfficer}
// 													</span>
// 												</div>
// 											)}
// 										</div>
// 									</div>
// 									<div className="flex flex-col items-end gap-2">
// 										<span className="text-xs text-muted-foreground">
// 											{formatTimeAgo(alarm.timestamp)}
// 										</span>
// 										<Button variant="outline" size="sm" className="h-8 w-8 p-0">
// 											<Eye className="h-3 w-3" />
// 										</Button>
// 									</div>
// 								</div>
// 							))}
// 						</div>
// 						<div className="mt-4 pt-4 border-t border-border">
// 							<Button variant="outline" className="w-full">
// 								View All Alarms
// 							</Button>
// 						</div>
// 					</CardContent>
// 				</Card>

// 				{/* Police Officer Status Section */}
// 				<Card
// 					className="col-span-3 animate-slide-up glass"
// 					style={{ animationDelay: "0.5s" }}>
// 					<CardHeader>
// 						<CardTitle className="flex items-center gap-2">
// 							<Shield className="h-5 w-5 text-blue-500" />
// 							Police Officer Status
// 						</CardTitle>
// 						<CardDescription>
// 							Current officer availability and deployment
// 						</CardDescription>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="space-y-4">
// 							{mockPoliceOfficers.slice(0, 4).map((officer, index) => (
// 								<div
// 									key={officer.id}
// 									className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
// 									style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
// 									<div className="flex items-center gap-3">
// 										<div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
// 											{officer.name.split(" ")[1]?.charAt(0) ||
// 												officer.name.charAt(0)}
// 										</div>
// 										<div>
// 											<p className="text-sm font-medium">{officer.name}</p>
// 											<p className="text-xs text-muted-foreground">
// 												{officer.badge}
// 											</p>
// 											{officer.activeCase && (
// 												<p className="text-xs text-blue-600 dark:text-blue-400">
// 													Case: {officer.activeCase}
// 												</p>
// 											)}
// 										</div>
// 									</div>
// 									<div className="text-right space-y-1">
// 										<Badge
// 											className={cn(
// 												"text-xs",
// 												getOfficerStatusColor(officer.status)
// 											)}>
// 											{officer.status}
// 										</Badge>
// 										<p className="text-xs text-muted-foreground">
// 											{formatTimeAgo(officer.lastUpdate)}
// 										</p>
// 									</div>
// 								</div>
// 							))}
// 						</div>
// 						<div className="mt-4 pt-4 border-t border-border">
// 							<div className="grid grid-cols-2 gap-4 text-sm">
// 								<div className="text-center">
// 									<p className="font-semibold text-green-600">
// 										{
// 											mockPoliceOfficers.filter((o) => o.status === "On Duty")
// 												.length
// 										}
// 									</p>
// 									<p className="text-xs text-muted-foreground">On Duty</p>
// 								</div>
// 								<div className="text-center">
// 									<p className="font-semibold text-blue-600">
// 										{
// 											mockPoliceOfficers.filter(
// 												(o) => o.status === "Dispatched"
// 											).length
// 										}
// 									</p>
// 									<p className="text-xs text-muted-foreground">Dispatched</p>
// 								</div>
// 							</div>
// 						</div>
// 					</CardContent>
// 				</Card>
// 			</div>
// 		</div>
// 	);
// }
