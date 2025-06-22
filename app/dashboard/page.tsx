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
	Acknowledged?: number;
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
	status: "Active" | "Acknowledged" | "Resolved" | "Acknowledged";
	timestamp: string;
	description: string;
	assignedOfficer?: string;
}

interface PoliceOfficer {
	id: string;
	name: string;
	badge: string;
	status: "Available" | "On Duty" | "Off Duty" | "Acknowledged" | "Break";
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
		priority: "Critical",
		status: "Active",
		timestamp: "2025-01-15T10:30:00Z",
		description: "Burglary Alert",
		assignedOfficer: "Officer Tinebeb",
	},
	{
		id: "ALM-002",
		type: "Door Breach",
		location: "Server Room",
		branch: "Tech Center",
		priority: "Critical",
		status: "Acknowledged",
		timestamp: "2025-01-15T09:45:00Z",
		description: "Burglary Alert",
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
		description: "Burglary Alert",
		assignedOfficer: "Officer Dawit",
	},
	{
		id: "ALM-004",
		type: "Glass Break",
		location: "Window A-12",
		branch: "Retail Store",
		priority: "Critical",
		status: "Acknowledged",
		timestamp: "2025-01-15T07:20:00Z",
		description: "Burglary Alert",
	},
	{
		id: "ALM-005",
		type: "Panic Button",
		location: "Cashier Station 3",
		branch: "Bank Branch",
		priority: "Critical",
		status: "Active",
		timestamp: "2025-01-15T06:55:00Z",
		description: "Burglary Alert",
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
							Acknowledged: 7,
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
			case "Acknowledged":
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
									Acknowledged Today
								</CardTitle>
								<div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
									<TrendingUp className="h-5 w-5 text-white" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-purple-600 mb-1">
									{stats.Acknowledged || 0}
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
						</p>
					</div>
				</div>
			</div>

			{/* Enhanced Stats Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
												(o) => o.status === "Acknowledged"
											).length
										}
									</p>
									<p className="text-xs text-muted-foreground font-medium">
										Acknowledged
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
