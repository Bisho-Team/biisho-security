"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AlertTriangle,
	Building,
	Users,
	Shield,
	CheckCircle,
	Clock,
	TrendingUp,
	Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { Loader2 } from "lucide-react";

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

export default function DashboardOverview() {
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
							dispatched: 7, // Mock data
						});
						break;

					case "POLICE_MANAGER":
						const policeAnalytics = await apiClient.getPoliceAnalytics();
						setStats({
							pendingReports: policeAnalytics.overview.pendingReports,
							officersOnDuty: 8, // Mock data
							resolvedToday: policeAnalytics.overview.completedReports,
							avgResponseTime: policeAnalytics.overview.avgResponseTime + "m",
						});
						break;

					case "OPERATOR":
						setStats({
							assignedTasks: 3, // Mock data
							completedToday: 5, // Mock data
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
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-muted-foreground">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	const renderOverviewCards = () => {
		switch (user.role) {
			case "SUPER_ADMIN":
				return (
					<>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Users
								</CardTitle>
								<Building className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.totalEntities || 0}
								</div>
								<p className="text-xs text-muted-foreground">System users</p>
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
								<div className="text-2xl font-bold">
									{stats.totalOperators || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Active operators
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									System Uptime
								</CardTitle>
								<Activity className="h-4 w-4 text-green-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stats.systemUptime}</div>
								<p className="text-xs text-muted-foreground">Last 30 days</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Alarms
								</CardTitle>
								<AlertTriangle className="h-4 w-4 text-red-500" />
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Alarms
								</CardTitle>
								<AlertTriangle className="h-4 w-4 text-red-500" />
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									My Branches
								</CardTitle>
								<Building className="h-4 w-4 text-muted-foreground" />
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									My Operators
								</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Dispatched Today
								</CardTitle>
								<TrendingUp className="h-4 w-4 text-blue-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Pending Reports
								</CardTitle>
								<AlertTriangle className="h-4 w-4 text-red-500" />
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Officers On Duty
								</CardTitle>
								<Shield className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.officersOnDuty || 0}
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
									{stats.resolvedToday || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									Successfully handled
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Avg Response Time
								</CardTitle>
								<Clock className="h-4 w-4 text-blue-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Assigned Tasks
								</CardTitle>
								<AlertTriangle className="h-4 w-4 text-red-500" />
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
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Completed Today
								</CardTitle>
								<CheckCircle className="h-4 w-4 text-green-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
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
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Dashboard Overview
				</h1>
				<p className="text-muted-foreground">
					Welcome back, {user.name}. Here's what's happening with your security
					system today.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{renderOverviewCards()}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent className="pl-2">
						<div className="space-y-4">
							{recentActivity.length > 0 ? (
								recentActivity.slice(0, 5).map((activity, index) => (
									<div key={index} className="flex items-center">
										<div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
										<div className="flex-1">
											<p className="text-sm font-medium">
												{activity.description || activity.type}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(activity.createdAt).toLocaleString()}
											</p>
										</div>
									</div>
								))
							) : (
								<div className="text-center py-8">
									<p className="text-sm text-muted-foreground">
										No recent activity
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>System Status</CardTitle>
						<CardDescription>Current operational status</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm">Alarm System</span>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
									<span className="text-sm text-green-600">Online</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Communication</span>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
									<span className="text-sm text-green-600">Connected</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Database</span>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
									<span className="text-sm text-green-600">Operational</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Backup Systems</span>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
									<span className="text-sm text-yellow-600">Standby</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
