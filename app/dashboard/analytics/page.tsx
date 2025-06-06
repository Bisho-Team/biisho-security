"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api-service";
import {
	Users,
	Building,
	Shield,
	AlertTriangle,
	Clock,
	CheckCircle,
	Download,
	Target,
	FileText,
	MapPin,
	TrendingUp,
	Activity,
	Zap,
	BarChart3,
	PieChart,
} from "lucide-react";

// Backend data interfaces matching your API responses
interface SystemAnalytics {
	overview: {
		totalUsers: number;
		totalCompanies: number;
		totalBranches: number;
		totalAlarms: number;
		activeAlarms: number;
		resolvedAlarms: number;
	};
	usersByRole: Array<{
		role: string;
		_count: { role: number };
	}>;
	alarmsBySeverity: Array<{
		severity: string;
		_count: { severity: number };
	}>;
	recentActivity: Array<{
		id: string;
		severity: string;
		status: string;
		createdAt: string;
		branch: { name: string };
		createdBy: { name: string };
	}>;
}

interface PoliceAnalytics {
	overview: {
		totalReports: number;
		pendingReports: number;
		completedReports: number;
		avgResponseTime: number;
	};
	reportsByStatus: Array<{
		status: string;
		_count: { status: number };
	}>;
}

interface OfficeAnalytics {
	overview: {
		totalBranches: number;
		totalOperators: number;
		totalAlarms: number;
		activeAlarms: number;
	};
	branchesData: Array<{
		id: string;
		name: string;
		address: string;
		_count: {
			operators: number;
			alarms: number;
		};
	}>;
}

export default function AnalyticsPage() {
	const [systemData, setSystemData] = useState<SystemAnalytics | null>(null);
	const [policeData, setPoliceData] = useState<PoliceAnalytics | null>(null);
	const [officeData, setOfficeData] = useState<OfficeAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState<string>("SUPER_ADMIN"); // This should come from auth context
	const [activeTab, setActiveTab] = useState("overview");
	const { toast } = useToast();

	useEffect(() => {
		fetchAnalytics();
	}, [userRole]);

	const fetchAnalytics = async () => {
		try {
			setLoading(true);

			// Fetch data based on user role
			if (userRole === "SUPER_ADMIN") {
				const response = await apiService.get("/analytics/system");
				setSystemData(response.data);
			} else if (userRole === "POLICE_MANAGER") {
				const response = await apiService.get("/analytics/police");
				setPoliceData(response.data);
			} else if (userRole === "OFFICE_MANAGER") {
				const response = await apiService.get("/analytics/office");
				setOfficeData(response.data);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch analytics data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity.toLowerCase()) {
			case "critical":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25";
			case "high":
				return "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25";
			case "medium":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25";
			case "low":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "active":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 animate-pulse";
			case "resolved":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25";
			case "pending":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25";
			case "completed":
				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25";
		}
	};

	const getMetricCardStyle = (type: string) => {
		switch (type) {
			case "critical":
				return "bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950 dark:via-red-900 dark:to-red-800 border-red-200 dark:border-red-700 shadow-xl shadow-red-500/10";
			case "warning":
				return "bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 dark:from-yellow-950 dark:via-yellow-900 dark:to-yellow-800 border-yellow-200 dark:border-yellow-700 shadow-xl shadow-yellow-500/10";
			case "success":
				return "bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950 dark:via-green-900 dark:to-green-800 border-green-200 dark:border-green-700 shadow-xl shadow-green-500/10";
			case "info":
				return "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700 shadow-xl shadow-blue-500/10";
			default:
				return "bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 shadow-xl shadow-gray-500/10";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-6">
				<div className="max-w-7xl mx-auto space-y-8">
					<div className="flex justify-between items-center">
						<div className="space-y-2">
							<Skeleton className="h-10 w-80 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
							<Skeleton className="h-6 w-96 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
						</div>
						<div className="flex space-x-3">
							<Skeleton className="h-12 w-40 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
							<Skeleton className="h-12 w-40 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
						</div>
					</div>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{[...Array(4)].map((_, i) => (
							<Card
								key={i}
								className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
									<Skeleton className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
									<Skeleton className="h-6 w-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
								</CardHeader>
								<CardContent className="space-y-2">
									<Skeleton className="h-10 w-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
									<Skeleton className="h-4 w-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Super Admin Dashboard
	if (userRole === "SUPER_ADMIN" && systemData) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6">
				<div className="max-w-7xl mx-auto space-y-8">
					{/* Header Section */}
					<div className="flex justify-between items-center">
						<div className="space-y-2">
							<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
								System Analytics
							</h1>
							<p className="text-lg text-muted-foreground">
								Comprehensive system overview and metrics
							</p>
						</div>
						<div className="flex space-x-3">
							<Select value={userRole} onValueChange={setUserRole}>
								<SelectTrigger className="w-44 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
									<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
									<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
								<Download className="h-5 w-5 mr-2" />
								Export Report
							</Button>
						</div>
					</div>

					{/* System Overview Cards */}
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card
							className={`${getMetricCardStyle(
								"info"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
									Total Users
								</CardTitle>
								<div className="p-2 bg-blue-500/20 rounded-lg">
									<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
									{systemData.overview.totalUsers}
								</div>
								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
									<TrendingUp className="h-4 w-4 mr-1" />
									Across all roles
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"success"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
									Companies
								</CardTitle>
								<div className="p-2 bg-green-500/20 rounded-lg">
									<Building className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-900 dark:text-green-100">
									{systemData.overview.totalCompanies}
								</div>
								<p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
									<Activity className="h-4 w-4 mr-1" />
									Active companies
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"info"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
									Total Branches
								</CardTitle>
								<div className="p-2 bg-purple-500/20 rounded-lg">
									<MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
									{systemData.overview.totalBranches}
								</div>
								<p className="text-sm text-purple-600 dark:text-purple-400 flex items-center mt-1">
									<Target className="h-4 w-4 mr-1" />
									Monitored locations
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"critical"
							)} hover:scale-105 transition-all duration-300 border-2 ${
								systemData.overview.activeAlarms > 0 ? "animate-glow" : ""
							}`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300">
									Active Alarms
								</CardTitle>
								<div className="p-2 bg-red-500/20 rounded-lg">
									<AlertTriangle
										className={`h-5 w-5 text-red-600 dark:text-red-400 ${
											systemData.overview.activeAlarms > 0
												? "animate-swing"
												: ""
										}`}
									/>
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-red-900 dark:text-red-100">
									{systemData.overview.activeAlarms}
								</div>
								<p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
									<Zap className="h-4 w-4 mr-1" />
									Require attention
								</p>
							</CardContent>
						</Card>
					</div>

					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="space-y-6">
						<TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700">
							<TabsTrigger
								value="overview"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
								<BarChart3 className="h-4 w-4 mr-2" />
								Overview
							</TabsTrigger>
							<TabsTrigger
								value="users"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
								<Users className="h-4 w-4 mr-2" />
								Users by Role
							</TabsTrigger>
							<TabsTrigger
								value="alarms"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
								<AlertTriangle className="h-4 w-4 mr-2" />
								Alarm Analysis
							</TabsTrigger>
							<TabsTrigger
								value="activity"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
								<Activity className="h-4 w-4 mr-2" />
								Recent Activity
							</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-6">
							<div className="grid gap-6 md:grid-cols-2">
								<Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-blue-200 dark:border-blue-700">
									<CardHeader className="pb-4">
										<CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
											<PieChart className="h-6 w-6 mr-2 text-blue-600" />
											Alarm Statistics
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium">
													Total Alarms
												</span>
												<span className="font-bold text-lg">
													{systemData.overview.totalAlarms}
												</span>
											</div>
											<div className="flex items-center justify-between p-3 bg-red-50/80 dark:bg-red-900/20 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium text-red-700 dark:text-red-300">
													Active Alarms
												</span>
												<span className="font-bold text-lg text-red-600 dark:text-red-400">
													{systemData.overview.activeAlarms}
												</span>
											</div>
											<div className="flex items-center justify-between p-3 bg-green-50/80 dark:bg-green-900/20 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium text-green-700 dark:text-green-300">
													Resolved Alarms
												</span>
												<span className="font-bold text-lg text-green-600 dark:text-green-400">
													{systemData.overview.resolvedAlarms}
												</span>
											</div>
											<div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium text-green-800 dark:text-green-200">
													Resolution Rate
												</span>
												<span className="font-bold text-lg text-green-700 dark:text-green-300">
													{systemData.overview.totalAlarms > 0
														? (
																(systemData.overview.resolvedAlarms /
																	systemData.overview.totalAlarms) *
																100
														  ).toFixed(1)
														: 0}
													%
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
												<div
													className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
													style={{
														width: `${
															systemData.overview.totalAlarms > 0
																? (systemData.overview.resolvedAlarms /
																		systemData.overview.totalAlarms) *
																  100
																: 0
														}%`,
													}}
												/>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-purple-200 dark:border-purple-700">
									<CardHeader className="pb-4">
										<CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center">
											<Activity className="h-6 w-6 mr-2 text-purple-600" />
											System Health
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium">
													System Status
												</span>
												<Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
													<CheckCircle className="h-3 w-3 mr-1" />
													Operational
												</Badge>
											</div>
											<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium">
													Active Users
												</span>
												<span className="font-bold text-lg text-blue-600 dark:text-blue-400">
													{systemData.overview.totalUsers}
												</span>
											</div>
											<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium">
													Active Branches
												</span>
												<span className="font-bold text-lg text-purple-600 dark:text-purple-400">
													{systemData.overview.totalBranches}
												</span>
											</div>
											<div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg backdrop-blur-sm">
												<span className="text-sm font-medium">
													System Uptime
												</span>
												<span className="font-bold text-lg text-green-600 dark:text-green-400">
													99.9%
												</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="users" className="space-y-6">
							<Card className="bg-gradient-to-br from-white via-green-50 to-emerald-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-green-200 dark:border-green-700">
								<CardHeader className="pb-4">
									<CardTitle className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center">
										<Users className="h-6 w-6 mr-2 text-green-600" />
										Users by Role Distribution
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{systemData.usersByRole.map((roleData, index) => (
											<div
												key={index}
												className="group hover:scale-102 transition-all duration-300">
												<div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
													<div className="flex items-center space-x-4">
														<div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
															{roleData.role === "SUPER_ADMIN" && (
																<Shield className="h-5 w-5 text-white" />
															)}
															{roleData.role === "OFFICE_MANAGER" && (
																<Building className="h-5 w-5 text-white" />
															)}
															{roleData.role === "POLICE_MANAGER" && (
																<Shield className="h-5 w-5 text-white" />
															)}
															{roleData.role === "OPERATOR" && (
																<Users className="h-5 w-5 text-white" />
															)}
														</div>
														<div>
															<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
																{roleData.role
																	.replace("_", " ")
																	.toLowerCase()
																	.replace(/\b\w/g, (l) => l.toUpperCase())}
															</h4>
															<p className="text-sm text-gray-600 dark:text-gray-400">
																Active users in this role
															</p>
														</div>
													</div>
													<div className="text-right">
														<p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
															{roleData._count.role}
														</p>
														<p className="text-xs text-gray-500 dark:text-gray-400">
															users
														</p>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="alarms" className="space-y-6">
							<Card className="bg-gradient-to-br from-white via-orange-50 to-red-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-orange-200 dark:border-orange-700">
								<CardHeader className="pb-4">
									<CardTitle className="text-xl font-bold text-orange-900 dark:text-orange-100 flex items-center">
										<AlertTriangle className="h-6 w-6 mr-2 text-orange-600" />
										Alarms by Severity
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{systemData.alarmsBySeverity.map((severityData, index) => (
											<div
												key={index}
												className="group hover:scale-102 transition-all duration-300">
												<div
													className={`flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 ${
														severityData.severity.toLowerCase() === "critical"
															? "critical-alarm-card"
															: ""
													}`}>
													<div className="flex items-center space-x-4">
														<div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
															<AlertTriangle
																className={`h-5 w-5 text-white ${
																	severityData.severity.toLowerCase() ===
																	"critical"
																		? "animate-swing"
																		: ""
																}`}
															/>
														</div>
														<div>
															<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
																{severityData.severity} Priority
															</h4>
															<p className="text-sm text-gray-600 dark:text-gray-400">
																Alarm severity level
															</p>
														</div>
													</div>
													<div className="text-right space-y-2">
														<p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
															{severityData._count.severity}
														</p>
														<Badge
															className={getSeverityColor(
																severityData.severity
															)}>
															{severityData.severity}
														</Badge>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="activity" className="space-y-6">
							<Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-purple-200 dark:border-purple-700">
								<CardHeader className="pb-4">
									<CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center">
										<Activity className="h-6 w-6 mr-2 text-purple-600" />
										Recent Alarm Activity
									</CardTitle>
									<p className="text-sm text-purple-600 dark:text-purple-400">
										Latest 10 alarms in the system
									</p>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{systemData.recentActivity.map((alarm, index) => (
											<div
												key={alarm.id}
												className="group hover:scale-102 transition-all duration-300">
												<div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
													<div className="flex items-center space-x-4">
														<div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
															<AlertTriangle className="h-5 w-5 text-white" />
														</div>
														<div>
															<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
																{alarm.branch.name}
															</h4>
															<p className="text-sm text-gray-600 dark:text-gray-400">
																Created by {alarm.createdBy.name}
															</p>
															<p className="text-xs text-gray-500 dark:text-gray-500">
																{new Date(alarm.createdAt).toLocaleString()}
															</p>
														</div>
													</div>
													<div className="text-right space-y-2">
														<Badge className={getSeverityColor(alarm.severity)}>
															{alarm.severity}
														</Badge>
														<br />
														<Badge className={getStatusColor(alarm.status)}>
															{alarm.status}
														</Badge>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		);
	}

	// Police Manager Dashboard
	if (userRole === "POLICE_MANAGER" && policeData) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-900 dark:to-purple-800 p-6">
				<div className="max-w-7xl mx-auto space-y-8">
					<div className="flex justify-between items-center">
						<div className="space-y-2">
							<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
								Police Analytics
							</h1>
							<p className="text-lg text-muted-foreground">
								Your assigned reports and response metrics
							</p>
						</div>
						<div className="flex space-x-3">
							<Select value={userRole} onValueChange={setUserRole}>
								<SelectTrigger className="w-44 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
									<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
									<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
								<Download className="h-5 w-5 mr-2" />
								Export Report
							</Button>
						</div>
					</div>

					{/* Police Overview Cards */}
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card
							className={`${getMetricCardStyle(
								"info"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
									Total Reports
								</CardTitle>
								<div className="p-2 bg-blue-500/20 rounded-lg">
									<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
									{policeData.overview.totalReports}
								</div>
								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
									<Target className="h-4 w-4 mr-1" />
									Assigned to you
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"warning"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
									Pending Reports
								</CardTitle>
								<div className="p-2 bg-yellow-500/20 rounded-lg">
									<Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
									{policeData.overview.pendingReports}
								</div>
								<p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center mt-1">
									<AlertTriangle className="h-4 w-4 mr-1" />
									Awaiting action
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"success"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
									Completed
								</CardTitle>
								<div className="p-2 bg-green-500/20 rounded-lg">
									<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-900 dark:text-green-100">
									{policeData.overview.completedReports}
								</div>
								<p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
									<TrendingUp className="h-4 w-4 mr-1" />
									Successfully handled
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"info"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
									Avg Response
								</CardTitle>
								<div className="p-2 bg-blue-500/20 rounded-lg">
									<Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
									{policeData.overview.avgResponseTime} min
								</div>
								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
									<Clock className="h-4 w-4 mr-1" />
									Response time
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-blue-200 dark:border-blue-700">
							<CardHeader className="pb-4">
								<CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
									<Target className="h-6 w-6 mr-2 text-blue-600" />
									Performance Summary
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg backdrop-blur-sm">
										<span className="text-sm font-medium">Completion Rate</span>
										<span className="font-bold text-lg text-green-600 dark:text-green-400">
											{policeData.overview.totalReports > 0
												? (
														(policeData.overview.completedReports /
															policeData.overview.totalReports) *
														100
												  ).toFixed(1)
												: 0}
											%
										</span>
									</div>
									<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
										<span className="text-sm font-medium">
											Average Response Time
										</span>
										<span className="font-bold text-lg text-blue-600 dark:text-blue-400">
											{policeData.overview.avgResponseTime} minutes
										</span>
									</div>
									<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
										<span className="text-sm font-medium">
											Reports This Month
										</span>
										<span className="font-bold text-lg text-purple-600 dark:text-purple-400">
											{policeData.overview.totalReports}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-purple-200 dark:border-purple-700">
							<CardHeader className="pb-4">
								<CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center">
									<PieChart className="h-6 w-6 mr-2 text-purple-600" />
									Reports by Status
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{policeData.reportsByStatus.map((statusData, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
											<span className="text-sm font-medium">
												{statusData.status
													.replace("_", " ")
													.toLowerCase()
													.replace(/\b\w/g, (l) => l.toUpperCase())}
											</span>
											<div className="flex items-center space-x-3">
												<span className="text-sm font-bold">
													{statusData._count.status}
												</span>
												<Badge className={getStatusColor(statusData.status)}>
													{statusData.status}
												</Badge>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	// Office Manager Dashboard
	if (userRole === "OFFICE_MANAGER" && officeData) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-950 dark:via-emerald-900 dark:to-teal-800 p-6">
				<div className="max-w-7xl mx-auto space-y-8">
					<div className="flex justify-between items-center">
						<div className="space-y-2">
							<h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
								Office Analytics
							</h1>
							<p className="text-lg text-muted-foreground">
								Your branches and operators overview
							</p>
						</div>
						<div className="flex space-x-3">
							<Select value={userRole} onValueChange={setUserRole}>
								<SelectTrigger className="w-44 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
									<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
									<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
								<Download className="h-5 w-5 mr-2" />
								Export Report
							</Button>
						</div>
					</div>

					{/* Office Overview Cards */}
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card
							className={`${getMetricCardStyle(
								"success"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
									Your Branches
								</CardTitle>
								<div className="p-2 bg-green-500/20 rounded-lg">
									<Building className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-900 dark:text-green-100">
									{officeData.overview.totalBranches}
								</div>
								<p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
									<Target className="h-4 w-4 mr-1" />
									Under your management
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"info"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
									Your Operators
								</CardTitle>
								<div className="p-2 bg-blue-500/20 rounded-lg">
									<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
									{officeData.overview.totalOperators}
								</div>
								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
									<Activity className="h-4 w-4 mr-1" />
									Active operators
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"warning"
							)} hover:scale-105 transition-all duration-300 border-2`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">
									Total Alarms
								</CardTitle>
								<div className="p-2 bg-orange-500/20 rounded-lg">
									<AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
									{officeData.overview.totalAlarms}
								</div>
								<p className="text-sm text-orange-600 dark:text-orange-400 flex items-center mt-1">
									<BarChart3 className="h-4 w-4 mr-1" />
									From your branches
								</p>
							</CardContent>
						</Card>

						<Card
							className={`${getMetricCardStyle(
								"critical"
							)} hover:scale-105 transition-all duration-300 border-2 ${
								officeData.overview.activeAlarms > 0 ? "animate-glow" : ""
							}`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300">
									Active Alarms
								</CardTitle>
								<div className="p-2 bg-red-500/20 rounded-lg">
									<AlertTriangle
										className={`h-5 w-5 text-red-600 dark:text-red-400 ${
											officeData.overview.activeAlarms > 0
												? "animate-swing"
												: ""
										}`}
									/>
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-red-900 dark:text-red-100">
									{officeData.overview.activeAlarms}
								</div>
								<p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
									<Zap className="h-4 w-4 mr-1" />
									Require attention
								</p>
							</CardContent>
						</Card>
					</div>

					<Card className="bg-gradient-to-br from-white via-green-50 to-emerald-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-green-200 dark:border-green-700">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center">
								<Building className="h-6 w-6 mr-2 text-green-600" />
								Your Branches Overview
							</CardTitle>
							<p className="text-sm text-green-600 dark:text-green-400">
								Detailed view of all branches under your management
							</p>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{officeData.branchesData.map((branch, index) => (
									<div
										key={branch.id}
										className="group hover:scale-102 transition-all duration-300">
										<div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
											<div className="flex items-center space-x-4">
												<div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
													<MapPin className="h-5 w-5 text-white" />
												</div>
												<div>
													<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
														{branch.name}
													</h4>
													<p className="text-sm text-gray-600 dark:text-gray-400">
														{branch.address}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-6 text-sm">
												<div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
													<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
														{branch._count.operators}
													</p>
													<p className="text-xs text-blue-500 dark:text-blue-400">
														Operators
													</p>
												</div>
												<div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
													<p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
														{branch._count.alarms}
													</p>
													<p className="text-xs text-orange-500 dark:text-orange-400">
														Total Alarms
													</p>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl">
					<p className="text-lg text-muted-foreground">
						No data available for the selected role.
					</p>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						Please select a different role or check your permissions.
					</p>
				</div>
			</div>
		</div>
	);
}

// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import { apiService } from "@/lib/api-service";
// import {
// 	Users,
// 	Building,
// 	Shield,
// 	AlertTriangle,
// 	Clock,
// 	CheckCircle,
// 	Download,
// 	Target,
// 	FileText,
// 	MapPin,
// } from "lucide-react";

// // Backend data interfaces matching your API responses
// interface SystemAnalytics {
// 	overview: {
// 		totalUsers: number;
// 		totalCompanies: number;
// 		totalBranches: number;
// 		totalAlarms: number;
// 		activeAlarms: number;
// 		resolvedAlarms: number;
// 	};
// 	usersByRole: Array<{
// 		role: string;
// 		_count: { role: number };
// 	}>;
// 	alarmsBySeverity: Array<{
// 		severity: string;
// 		_count: { severity: number };
// 	}>;
// 	recentActivity: Array<{
// 		id: string;
// 		severity: string;
// 		status: string;
// 		createdAt: string;
// 		branch: { name: string };
// 		createdBy: { name: string };
// 	}>;
// }

// interface PoliceAnalytics {
// 	overview: {
// 		totalReports: number;
// 		pendingReports: number;
// 		completedReports: number;
// 		avgResponseTime: number;
// 	};
// 	reportsByStatus: Array<{
// 		status: string;
// 		_count: { status: number };
// 	}>;
// }

// interface OfficeAnalytics {
// 	overview: {
// 		totalBranches: number;
// 		totalOperators: number;
// 		totalAlarms: number;
// 		activeAlarms: number;
// 	};
// 	branchesData: Array<{
// 		id: string;
// 		name: string;
// 		address: string;
// 		_count: {
// 			operators: number;
// 			alarms: number;
// 		};
// 	}>;
// }

// export default function AnalyticsPage() {
// 	const [systemData, setSystemData] = useState<SystemAnalytics | null>(null);
// 	const [policeData, setPoliceData] = useState<PoliceAnalytics | null>(null);
// 	const [officeData, setOfficeData] = useState<OfficeAnalytics | null>(null);
// 	const [loading, setLoading] = useState(true);
// 	const [userRole, setUserRole] = useState<string>("SUPER_ADMIN"); // This should come from auth context
// 	const [activeTab, setActiveTab] = useState("overview");
// 	const { toast } = useToast();

// 	useEffect(() => {
// 		fetchAnalytics();
// 	}, [userRole]);

// 	const fetchAnalytics = async () => {
// 		try {
// 			setLoading(true);

// 			console.log("Fetching analytics data for role:", userRole);

// 			// Fetch data based on user role
// 			if (userRole === "SUPER_ADMIN") {
// 				const response = await apiService.get("/analytics/system");
// 				console.log("System analytics data:", response.data);
// 				setSystemData(response.data);
// 			} else if (userRole === "POLICE_MANAGER") {
// 				const response = await apiService.get("/analytics/police");
// 				setPoliceData(response.data);
// 			} else if (userRole === "OFFICE_MANAGER") {
// 				const response = await apiService.get("/analytics/office");
// 				setOfficeData(response.data);
// 			}
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch analytics data",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const getSeverityColor = (severity: string) => {
// 		switch (severity.toLowerCase()) {
// 			case "critical":
// 				return "bg-red-100 text-red-800";
// 			case "high":
// 				return "bg-orange-100 text-orange-800";
// 			case "medium":
// 				return "bg-yellow-100 text-yellow-800";
// 			case "low":
// 				return "bg-green-100 text-green-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	const getStatusColor = (status: string) => {
// 		switch (status.toLowerCase()) {
// 			case "active":
// 				return "bg-red-100 text-red-800";
// 			case "resolved":
// 				return "bg-green-100 text-green-800";
// 			case "pending":
// 				return "bg-yellow-100 text-yellow-800";
// 			case "completed":
// 				return "bg-blue-100 text-blue-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	if (loading) {
// 		return (
// 			<div className="space-y-6">
// 				<div className="flex justify-between items-center">
// 					<div>
// 						<Skeleton className="h-8 w-64" />
// 						<Skeleton className="h-4 w-96 mt-2" />
// 					</div>
// 					<div className="flex space-x-2">
// 						<Skeleton className="h-10 w-32" />
// 						<Skeleton className="h-10 w-32" />
// 					</div>
// 				</div>
// 				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

// 	// Super Admin Dashboard
// 	if (userRole === "SUPER_ADMIN" && systemData) {
// 		return (
// 			<div className="space-y-6">
// 				<div className="flex justify-between items-center">
// 					<div>
// 						<h1 className="text-3xl font-bold tracking-tight">
// 							System Analytics
// 						</h1>
// 						<p className="text-muted-foreground">
// 							Comprehensive system overview and metrics
// 						</p>
// 					</div>
// 					<div className="flex space-x-2">
// 						<Select value={userRole} onValueChange={setUserRole}>
// 							<SelectTrigger className="w-40">
// 								<SelectValue />
// 							</SelectTrigger>
// 							<SelectContent>
// 								<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
// 								<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
// 								<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
// 							</SelectContent>
// 						</Select>
// 						<Button variant="outline">
// 							<Download className="h-4 w-4 mr-2" />
// 							Export Report
// 						</Button>
// 					</div>
// 				</div>

// 				{/* System Overview Cards */}
// 				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">Total Users</CardTitle>
// 							<Users className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold">
// 								{systemData.overview.totalUsers}
// 							</div>
// 							<p className="text-xs text-muted-foreground">Across all roles</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">Companies</CardTitle>
// 							<Building className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold">
// 								{systemData.overview.totalCompanies}
// 							</div>
// 							<p className="text-xs text-muted-foreground">Active companies</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Total Branches
// 							</CardTitle>
// 							<MapPin className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold">
// 								{systemData.overview.totalBranches}
// 							</div>
// 							<p className="text-xs text-muted-foreground">
// 								Monitored locations
// 							</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Active Alarms
// 							</CardTitle>
// 							<AlertTriangle className="h-4 w-4 text-red-500" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold text-red-600">
// 								{systemData.overview.activeAlarms}
// 							</div>
// 							<p className="text-xs text-muted-foreground">Require attention</p>
// 						</CardContent>
// 					</Card>
// 				</div>

// 				<Tabs
// 					value={activeTab}
// 					onValueChange={setActiveTab}
// 					className="space-y-4">
// 					<TabsList>
// 						<TabsTrigger value="overview">Overview</TabsTrigger>
// 						<TabsTrigger value="users">Users by Role</TabsTrigger>
// 						<TabsTrigger value="alarms">Alarm Analysis</TabsTrigger>
// 						<TabsTrigger value="activity">Recent Activity</TabsTrigger>
// 					</TabsList>

// 					<TabsContent value="overview" className="space-y-4">
// 						<div className="grid gap-4 md:grid-cols-2">
// 							<Card>
// 								<CardHeader>
// 									<CardTitle>Alarm Statistics</CardTitle>
// 								</CardHeader>
// 								<CardContent>
// 									<div className="space-y-4">
// 										<div className="flex items-center justify-between">
// 											<span className="text-sm">Total Alarms</span>
// 											<span className="font-medium">
// 												{systemData.overview.totalAlarms}
// 											</span>
// 										</div>
// 										<div className="flex items-center justify-between">
// 											<span className="text-sm">Active Alarms</span>
// 											<span className="font-medium text-red-600">
// 												{systemData.overview.activeAlarms}
// 											</span>
// 										</div>
// 										<div className="flex items-center justify-between">
// 											<span className="text-sm">Resolved Alarms</span>
// 											<span className="font-medium text-green-600">
// 												{systemData.overview.resolvedAlarms}
// 											</span>
// 										</div>
// 										<div className="flex items-center justify-between">
// 											<span className="text-sm">Resolution Rate</span>
// 											<span className="font-medium text-green-600">
// 												{systemData.overview.totalAlarms > 0
// 													? (
// 															(systemData.overview.resolvedAlarms /
// 																systemData.overview.totalAlarms) *
// 															100
// 													  ).toFixed(1)
// 													: 0}
// 												%
// 											</span>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>

// 							<Card>
// 								<CardHeader>
// 									<CardTitle>System Health</CardTitle>
// 								</CardHeader>
// 								<CardContent>
// 									<div className="space-y-4">
// 										<div className="flex items-center justify-between">
// 											<span className="text-sm">System Status</span>
// 											<Badge className="bg-green-100 text-green-800">
// 												Operational
// 											</Badge>
// 										</div>
// 										<div className="flex items-center justify-between">
// 											<span className="text-sm">Active Users</span>
// 											<span className="font-medium">
// 												{systemData.overview.totalUsers}
// 											</span>
// 										</div>
// 										<div className="flex items-center justify-between">
// 											<span className="text-sm">Active Branches</span>
// 											<span className="font-medium">
// 												{systemData.overview.totalBranches}
// 											</span>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						</div>
// 					</TabsContent>

// 					<TabsContent value="users" className="space-y-4">
// 						<Card>
// 							<CardHeader>
// 								<CardTitle>Users by Role Distribution</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-4">
// 									{systemData.usersByRole.map((roleData, index) => (
// 										<div
// 											key={index}
// 											className="flex items-center justify-between p-4 border rounded-lg">
// 											<div className="flex items-center space-x-4">
// 												<div className="p-2 bg-blue-100 rounded-lg">
// 													{roleData.role === "SUPER_ADMIN" && (
// 														<Shield className="h-4 w-4 text-blue-600" />
// 													)}
// 													{roleData.role === "OFFICE_MANAGER" && (
// 														<Building className="h-4 w-4 text-blue-600" />
// 													)}
// 													{roleData.role === "POLICE_MANAGER" && (
// 														<Shield className="h-4 w-4 text-blue-600" />
// 													)}
// 													{roleData.role === "OPERATOR" && (
// 														<Users className="h-4 w-4 text-blue-600" />
// 													)}
// 												</div>
// 												<div>
// 													<h4 className="font-medium">
// 														{roleData.role
// 															.replace("_", " ")
// 															.toLowerCase()
// 															.replace(/\b\w/g, (l) => l.toUpperCase())}
// 													</h4>
// 													<p className="text-sm text-gray-500">
// 														Active users in this role
// 													</p>
// 												</div>
// 											</div>
// 											<div className="text-right">
// 												<p className="text-2xl font-bold">
// 													{roleData._count.role}
// 												</p>
// 												<p className="text-xs text-gray-500">users</p>
// 											</div>
// 										</div>
// 									))}
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</TabsContent>

// 					<TabsContent value="alarms" className="space-y-4">
// 						<Card>
// 							<CardHeader>
// 								<CardTitle>Alarms by Severity</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-4">
// 									{systemData.alarmsBySeverity.map((severityData, index) => (
// 										<div
// 											key={index}
// 											className="flex items-center justify-between p-4 border rounded-lg">
// 											<div className="flex items-center space-x-4">
// 												<div className="p-2 bg-red-100 rounded-lg">
// 													<AlertTriangle className="h-4 w-4 text-red-600" />
// 												</div>
// 												<div>
// 													<h4 className="font-medium">
// 														{severityData.severity} Priority
// 													</h4>
// 													<p className="text-sm text-gray-500">
// 														Alarm severity level
// 													</p>
// 												</div>
// 											</div>
// 											<div className="text-right">
// 												<p className="text-2xl font-bold">
// 													{severityData._count.severity}
// 												</p>
// 												<Badge
// 													className={getSeverityColor(severityData.severity)}>
// 													{severityData.severity}
// 												</Badge>
// 											</div>
// 										</div>
// 									))}
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</TabsContent>

// 					<TabsContent value="activity" className="space-y-4">
// 						<Card>
// 							<CardHeader>
// 								<CardTitle>Recent Alarm Activity</CardTitle>
// 								<p className="text-sm text-muted-foreground">
// 									Latest 10 alarms in the system
// 								</p>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-4">
// 									{systemData.recentActivity.map((alarm, index) => (
// 										<div
// 											key={alarm.id}
// 											className="flex items-center justify-between p-4 border rounded-lg">
// 											<div className="flex items-center space-x-4">
// 												<div className="p-2 bg-orange-100 rounded-lg">
// 													<AlertTriangle className="h-4 w-4 text-orange-600" />
// 												</div>
// 												<div>
// 													<h4 className="font-medium">{alarm.branch.name}</h4>
// 													<p className="text-sm text-gray-500">
// 														Created by {alarm.createdBy.name}
// 													</p>
// 													<p className="text-xs text-gray-400">
// 														{new Date(alarm.createdAt).toLocaleString()}
// 													</p>
// 												</div>
// 											</div>
// 											<div className="text-right space-y-1">
// 												<Badge className={getSeverityColor(alarm.severity)}>
// 													{alarm.severity}
// 												</Badge>
// 												<br />
// 												<Badge className={getStatusColor(alarm.status)}>
// 													{alarm.status}
// 												</Badge>
// 											</div>
// 										</div>
// 									))}
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</TabsContent>
// 				</Tabs>
// 			</div>
// 		);
// 	}

// 	// Police Manager Dashboard
// 	if (userRole === "POLICE_MANAGER" && policeData) {
// 		return (
// 			<div className="space-y-6">
// 				<div className="flex justify-between items-center">
// 					<div>
// 						<h1 className="text-3xl font-bold tracking-tight">
// 							Police Analytics
// 						</h1>
// 						<p className="text-muted-foreground">
// 							Your assigned reports and response metrics
// 						</p>
// 					</div>
// 					<div className="flex space-x-2">
// 						<Select value={userRole} onValueChange={setUserRole}>
// 							<SelectTrigger className="w-40">
// 								<SelectValue />
// 							</SelectTrigger>
// 							<SelectContent>
// 								<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
// 								<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
// 								<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
// 							</SelectContent>
// 						</Select>
// 						<Button variant="outline">
// 							<Download className="h-4 w-4 mr-2" />
// 							Export Report
// 						</Button>
// 					</div>
// 				</div>

// 				{/* Police Overview Cards */}
// 				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Total Reports
// 							</CardTitle>
// 							<FileText className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold">
// 								{policeData.overview.totalReports}
// 							</div>
// 							<p className="text-xs text-muted-foreground">Assigned to you</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Pending Reports
// 							</CardTitle>
// 							<Clock className="h-4 w-4 text-yellow-500" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold text-yellow-600">
// 								{policeData.overview.pendingReports}
// 							</div>
// 							<p className="text-xs text-muted-foreground">Awaiting action</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">Completed</CardTitle>
// 							<CheckCircle className="h-4 w-4 text-green-500" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold text-green-600">
// 								{policeData.overview.completedReports}
// 							</div>
// 							<p className="text-xs text-muted-foreground">
// 								Successfully handled
// 							</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Avg Response
// 							</CardTitle>
// 							<Target className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold text-blue-600">
// 								{policeData.overview.avgResponseTime} min
// 							</div>
// 							<p className="text-xs text-muted-foreground">Response time</p>
// 						</CardContent>
// 					</Card>
// 				</div>

// 				<div className="grid gap-4 md:grid-cols-2">
// 					<Card>
// 						<CardHeader>
// 							<CardTitle>Performance Summary</CardTitle>
// 						</CardHeader>
// 						<CardContent>
// 							<div className="space-y-4">
// 								<div className="flex items-center justify-between">
// 									<span className="text-sm">Completion Rate</span>
// 									<span className="font-medium text-green-600">
// 										{policeData.overview.totalReports > 0
// 											? (
// 													(policeData.overview.completedReports /
// 														policeData.overview.totalReports) *
// 													100
// 											  ).toFixed(1)
// 											: 0}
// 										%
// 									</span>
// 								</div>
// 								<div className="flex items-center justify-between">
// 									<span className="text-sm">Average Response Time</span>
// 									<span className="font-medium">
// 										{policeData.overview.avgResponseTime} minutes
// 									</span>
// 								</div>
// 								<div className="flex items-center justify-between">
// 									<span className="text-sm">Reports This Month</span>
// 									<span className="font-medium">
// 										{policeData.overview.totalReports}
// 									</span>
// 								</div>
// 							</div>
// 						</CardContent>
// 					</Card>

// 					<Card>
// 						<CardHeader>
// 							<CardTitle>Reports by Status</CardTitle>
// 						</CardHeader>
// 						<CardContent>
// 							<div className="space-y-4">
// 								{policeData.reportsByStatus.map((statusData, index) => (
// 									<div
// 										key={index}
// 										className="flex items-center justify-between">
// 										<span className="text-sm font-medium">
// 											{statusData.status
// 												.replace("_", " ")
// 												.toLowerCase()
// 												.replace(/\b\w/g, (l) => l.toUpperCase())}
// 										</span>
// 										<div className="flex items-center space-x-2">
// 											<span className="text-sm">
// 												{statusData._count.status}
// 											</span>
// 											<Badge className={getStatusColor(statusData.status)}>
// 												{statusData.status}
// 											</Badge>
// 										</div>
// 									</div>
// 								))}
// 							</div>
// 						</CardContent>
// 					</Card>
// 				</div>
// 			</div>
// 		);
// 	}

// 	// Office Manager Dashboard
// 	if (userRole === "OFFICE_MANAGER" && officeData) {
// 		return (
// 			<div className="space-y-6">
// 				<div className="flex justify-between items-center">
// 					<div>
// 						<h1 className="text-3xl font-bold tracking-tight">
// 							Office Analytics
// 						</h1>
// 						<p className="text-muted-foreground">
// 							Your branches and operators overview
// 						</p>
// 					</div>
// 					<div className="flex space-x-2">
// 						<Select value={userRole} onValueChange={setUserRole}>
// 							<SelectTrigger className="w-40">
// 								<SelectValue />
// 							</SelectTrigger>
// 							<SelectContent>
// 								<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
// 								<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
// 								<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
// 							</SelectContent>
// 						</Select>
// 						<Button variant="outline">
// 							<Download className="h-4 w-4 mr-2" />
// 							Export Report
// 						</Button>
// 					</div>
// 				</div>

// 				{/* Office Overview Cards */}
// 				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Your Branches
// 							</CardTitle>
// 							<Building className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold">
// 								{officeData.overview.totalBranches}
// 							</div>
// 							<p className="text-xs text-muted-foreground">
// 								Under your management
// 							</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Your Operators
// 							</CardTitle>
// 							<Users className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold">
// 								{officeData.overview.totalOperators}
// 							</div>
// 							<p className="text-xs text-muted-foreground">Active operators</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Total Alarms
// 							</CardTitle>
// 							<AlertTriangle className="h-4 w-4 text-muted-foreground" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold">
// 								{officeData.overview.totalAlarms}
// 							</div>
// 							<p className="text-xs text-muted-foreground">
// 								From your branches
// 							</p>
// 						</CardContent>
// 					</Card>
// 					<Card>
// 						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 							<CardTitle className="text-sm font-medium">
// 								Active Alarms
// 							</CardTitle>
// 							<AlertTriangle className="h-4 w-4 text-red-500" />
// 						</CardHeader>
// 						<CardContent>
// 							<div className="text-2xl font-bold text-red-600">
// 								{officeData.overview.activeAlarms}
// 							</div>
// 							<p className="text-xs text-muted-foreground">Require attention</p>
// 						</CardContent>
// 					</Card>
// 				</div>

// 				<Card>
// 					<CardHeader>
// 						<CardTitle>Your Branches Overview</CardTitle>
// 						<p className="text-sm text-muted-foreground">
// 							Detailed view of all branches under your management
// 						</p>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="space-y-4">
// 							{officeData.branchesData.map((branch, index) => (
// 								<div
// 									key={branch.id}
// 									className="flex items-center justify-between p-4 border rounded-lg">
// 									<div className="flex items-center space-x-4">
// 										<div className="p-2 bg-blue-100 rounded-lg">
// 											<MapPin className="h-4 w-4 text-blue-600" />
// 										</div>
// 										<div>
// 											<h4 className="font-medium">{branch.name}</h4>
// 											<p className="text-sm text-gray-500">{branch.address}</p>
// 										</div>
// 									</div>
// 									<div className="flex items-center space-x-6 text-sm">
// 										<div className="text-center">
// 											<p className="font-medium text-blue-600">
// 												{branch._count.operators}
// 											</p>
// 											<p className="text-xs text-gray-500">Operators</p>
// 										</div>
// 										<div className="text-center">
// 											<p className="font-medium text-orange-600">
// 												{branch._count.alarms}
// 											</p>
// 											<p className="text-xs text-gray-500">Total Alarms</p>
// 										</div>
// 									</div>
// 								</div>
// 							))}
// 						</div>
// 					</CardContent>
// 				</Card>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="flex items-center justify-center h-64">
// 			<p className="text-muted-foreground">
// 				No data available for the selected role.
// 			</p>
// 		</div>
// 	);
// }

// // "use client";

// // import { useState, useEffect } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import {
// // 	Select,
// // 	SelectContent,
// // 	SelectItem,
// // 	SelectTrigger,
// // 	SelectValue,
// // } from "@/components/ui/select";
// // import { Skeleton } from "@/components/ui/skeleton";
// // import { useToast } from "@/hooks/use-toast";
// // import { apiService } from "@/lib/api-service";
// // import {
// // 	TrendingUp,
// // 	TrendingDown,
// // 	Users,
// // 	Building,
// // 	Shield,
// // 	AlertTriangle,
// // 	Clock,
// // 	CheckCircle,
// // 	Download,
// // 	Activity,
// // 	Target,
// // 	Zap,
// // } from "lucide-react";

// // interface AnalyticsData {
// // 	totalUsers: number;
// // 	activeUsers: number;
// // 	totalCompanies: number;
// // 	totalBranches: number;
// // 	totalAlarms: number;
// // 	resolvedAlarms: number;
// // 	averageResponseTime: string;
// // 	systemUptime: string;
// // }

// // interface ChartData {
// // 	name: string;
// // 	value: number;
// // 	change: number;
// // }

// // interface CompanyPerformance {
// // 	name: string;
// // 	alarms: number;
// // 	resolved: number;
// // 	responseTime: string;
// // 	efficiency: number;
// // }

// // interface SystemMetric {
// // 	metric: string;
// // 	value: string;
// // 	status: string;
// // 	trend: string;
// // }

// // export default function AnalyticsPage() {
// // 	const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
// // 	const [alarmTrends, setAlarmTrends] = useState<ChartData[]>([]);
// // 	const [userActivity, setUserActivity] = useState<ChartData[]>([]);
// // 	const [companyPerformance, setCompanyPerformance] = useState<
// // 		CompanyPerformance[]
// // 	>([]);
// // 	const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
// // 	const [loading, setLoading] = useState(true);
// // 	const [timeRange, setTimeRange] = useState("30d");
// // 	const [selectedMetric, setSelectedMetric] = useState("alarms");
// // 	const { toast } = useToast();

// // 	useEffect(() => {
// // 		fetchAnalytics();
// // 	}, [timeRange]);

// // 	const fetchAnalytics = async () => {
// // 		try {
// // 			setLoading(true);
// // 			const [
// // 				analyticsResponse,
// // 				trendsResponse,
// // 				activityResponse,
// // 				performanceResponse,
// // 				metricsResponse,
// // 			] = await Promise.all([
// // 				apiService.get(`/analytics/overview?timeRange=${timeRange}`),
// // 				apiService.get(`/analytics/alarm-trends?timeRange=${timeRange}`),
// // 				apiService.get(`/analytics/user-activity?timeRange=${timeRange}`),
// // 				apiService.get(`/analytics/company-performance?timeRange=${timeRange}`),
// // 				apiService.get(`/analytics/system-metrics`),
// // 			]);

// // 			setAnalytics(analyticsResponse.data);
// // 			setAlarmTrends(trendsResponse.data);
// // 			setUserActivity(activityResponse.data);
// // 			setCompanyPerformance(performanceResponse.data);
// // 			setSystemMetrics(metricsResponse.data);
// // 		} catch (error) {
// // 			toast({
// // 				title: "Error",
// // 				description: "Failed to fetch analytics data",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setLoading(false);
// // 		}
// // 	};

// // 	const exportReport = async () => {
// // 		try {
// // 			const response = await apiService.get(
// // 				`/analytics/export?timeRange=${timeRange}`,
// // 				{
// // 					responseType: "blob",
// // 				}
// // 			);

// // 			const url = window.URL.createObjectURL(new Blob([response.data]));
// // 			const link = document.createElement("a");
// // 			link.href = url;
// // 			link.setAttribute("download", `analytics-report-${timeRange}.pdf`);
// // 			document.body.appendChild(link);
// // 			link.click();
// // 			link.remove();

// // 			toast({
// // 				title: "Success",
// // 				description: "Analytics report exported successfully",
// // 			});
// // 		} catch (error) {
// // 			toast({
// // 				title: "Error",
// // 				description: "Failed to export analytics report",
// // 				variant: "destructive",
// // 			});
// // 		}
// // 	};

// // 	const getStatusColor = (status: string) => {
// // 		switch (status) {
// // 			case "excellent":
// // 				return "bg-green-100 text-green-800";
// // 			case "good":
// // 				return "bg-blue-100 text-blue-800";
// // 			case "normal":
// // 				return "bg-yellow-100 text-yellow-800";
// // 			case "warning":
// // 				return "bg-orange-100 text-orange-800";
// // 			case "critical":
// // 				return "bg-red-100 text-red-800";
// // 			default:
// // 				return "bg-gray-100 text-gray-800";
// // 		}
// // 	};

// // 	const getTrendIcon = (trend: string) => {
// // 		switch (trend) {
// // 			case "up":
// // 				return <TrendingUp className="h-3 w-3 text-green-500" />;
// // 			case "down":
// // 				return <TrendingDown className="h-3 w-3 text-red-500" />;
// // 			default:
// // 				return <Activity className="h-3 w-3 text-gray-500" />;
// // 		}
// // 	};

// // 	if (loading) {
// // 		return (
// // 			<div className="space-y-6">
// // 				<div className="flex justify-between items-center">
// // 					<div>
// // 						<Skeleton className="h-8 w-64" />
// // 						<Skeleton className="h-4 w-96 mt-2" />
// // 					</div>
// // 					<div className="flex space-x-2">
// // 						<Skeleton className="h-10 w-32" />
// // 						<Skeleton className="h-10 w-32" />
// // 					</div>
// // 				</div>
// // 				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// // 					{[...Array(4)].map((_, i) => (
// // 						<Card key={i}>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<Skeleton className="h-4 w-24" />
// // 								<Skeleton className="h-4 w-4" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<Skeleton className="h-8 w-16" />
// // 								<Skeleton className="h-3 w-20 mt-1" />
// // 							</CardContent>
// // 						</Card>
// // 					))}
// // 				</div>
// // 			</div>
// // 		);
// // 	}

// // 	if (!analytics) return null;

// // 	return (
// // 		<div className="space-y-6">
// // 			<div className="flex justify-between items-center">
// // 				<div>
// // 					<h1 className="text-3xl font-bold tracking-tight">
// // 						System Analytics
// // 					</h1>
// // 					<p className="text-muted-foreground">
// // 						Comprehensive insights and performance metrics
// // 					</p>
// // 				</div>
// // 				<div className="flex space-x-2">
// // 					<Select value={timeRange} onValueChange={setTimeRange}>
// // 						<SelectTrigger className="w-32">
// // 							<SelectValue />
// // 						</SelectTrigger>
// // 						<SelectContent>
// // 							<SelectItem value="7d">Last 7 days</SelectItem>
// // 							<SelectItem value="30d">Last 30 days</SelectItem>
// // 							<SelectItem value="90d">Last 90 days</SelectItem>
// // 							<SelectItem value="1y">Last year</SelectItem>
// // 						</SelectContent>
// // 					</Select>
// // 					<Button variant="outline" onClick={exportReport}>
// // 						<Download className="h-4 w-4 mr-2" />
// // 						Export Report
// // 					</Button>
// // 				</div>
// // 			</div>

// // 			{/* Key Metrics Overview */}
// // 			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
// // 				<Card>
// // 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
// // 						<Users className="h-4 w-4 text-muted-foreground" />
// // 					</CardHeader>
// // 					<CardContent>
// // 						<div className="text-2xl font-bold">{analytics.totalUsers}</div>
// // 						<p className="text-xs text-muted-foreground flex items-center">
// // 							<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
// // 							+12% from last month
// // 						</p>
// // 					</CardContent>
// // 				</Card>
// // 				<Card>
// // 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 						<CardTitle className="text-sm font-medium">
// // 							Active Companies
// // 						</CardTitle>
// // 						<Building className="h-4 w-4 text-muted-foreground" />
// // 					</CardHeader>
// // 					<CardContent>
// // 						<div className="text-2xl font-bold">{analytics.totalCompanies}</div>
// // 						<p className="text-xs text-muted-foreground flex items-center">
// // 							<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
// // 							+3 new this month
// // 						</p>
// // 					</CardContent>
// // 				</Card>
// // 				<Card>
// // 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 						<CardTitle className="text-sm font-medium">Total Alarms</CardTitle>
// // 						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
// // 					</CardHeader>
// // 					<CardContent>
// // 						<div className="text-2xl font-bold">{analytics.totalAlarms}</div>
// // 						<p className="text-xs text-muted-foreground flex items-center">
// // 							<TrendingDown className="h-3 w-3 mr-1 text-green-500" />
// // 							-5% from last month
// // 						</p>
// // 					</CardContent>
// // 				</Card>
// // 				<Card>
// // 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 						<CardTitle className="text-sm font-medium">System Uptime</CardTitle>
// // 						<Activity className="h-4 w-4 text-muted-foreground" />
// // 					</CardHeader>
// // 					<CardContent>
// // 						<div className="text-2xl font-bold text-green-600">
// // 							{analytics.systemUptime}
// // 						</div>
// // 						<p className="text-xs text-muted-foreground">Last 30 days</p>
// // 					</CardContent>
// // 				</Card>
// // 			</div>

// // 			<Tabs defaultValue="overview" className="space-y-4">
// // 				<TabsList>
// // 					<TabsTrigger value="overview">Overview</TabsTrigger>
// // 					<TabsTrigger value="alarms">Alarm Analytics</TabsTrigger>
// // 					<TabsTrigger value="users">User Analytics</TabsTrigger>
// // 					<TabsTrigger value="performance">Performance</TabsTrigger>
// // 					<TabsTrigger value="system">System Health</TabsTrigger>
// // 				</TabsList>

// // 				<TabsContent value="overview" className="space-y-4">
// // 					<div className="grid gap-4 md:grid-cols-2">
// // 						<Card>
// // 							<CardHeader>
// // 								<CardTitle>Alarm Resolution Rate</CardTitle>
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="space-y-4">
// // 									<div className="flex items-center justify-between">
// // 										<span className="text-sm">Total Alarms</span>
// // 										<span className="font-medium">{analytics.totalAlarms}</span>
// // 									</div>
// // 									<div className="flex items-center justify-between">
// // 										<span className="text-sm">Resolved</span>
// // 										<span className="font-medium text-green-600">
// // 											{analytics.resolvedAlarms}
// // 										</span>
// // 									</div>
// // 									<div className="flex items-center justify-between">
// // 										<span className="text-sm">Resolution Rate</span>
// // 										<span className="font-medium text-green-600">
// // 											{(
// // 												(analytics.resolvedAlarms / analytics.totalAlarms) *
// // 												100
// // 											).toFixed(1)}
// // 											%
// // 										</span>
// // 									</div>
// // 									<div className="w-full bg-gray-200 rounded-full h-2">
// // 										<div
// // 											className="bg-green-600 h-2 rounded-full"
// // 											style={{
// // 												width: `${
// // 													(analytics.resolvedAlarms / analytics.totalAlarms) *
// // 													100
// // 												}%`,
// // 											}}></div>
// // 									</div>
// // 								</div>
// // 							</CardContent>
// // 						</Card>

// // 						<Card>
// // 							<CardHeader>
// // 								<CardTitle>Response Time Metrics</CardTitle>
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="space-y-4">
// // 									<div className="flex items-center justify-between">
// // 										<span className="text-sm">Average Response Time</span>
// // 										<span className="font-medium">
// // 											{analytics.averageResponseTime}
// // 										</span>
// // 									</div>
// // 									<div className="flex items-center justify-between">
// // 										<span className="text-sm">Critical Alarms</span>
// // 										<span className="font-medium">2.1 min</span>
// // 									</div>
// // 									<div className="flex items-center justify-between">
// // 										<span className="text-sm">High Priority</span>
// // 										<span className="font-medium">3.8 min</span>
// // 									</div>
// // 									<div className="flex items-center justify-between">
// // 										<span className="text-sm">Medium Priority</span>
// // 										<span className="font-medium">6.2 min</span>
// // 									</div>
// // 								</div>
// // 							</CardContent>
// // 						</Card>
// // 					</div>

// // 					<Card>
// // 						<CardHeader>
// // 							<CardTitle>Company Performance Overview</CardTitle>
// // 						</CardHeader>
// // 						<CardContent>
// // 							<div className="space-y-4">
// // 								{companyPerformance.map((company, index) => (
// // 									<div
// // 										key={index}
// // 										className="flex items-center justify-between p-4 border rounded-lg">
// // 										<div className="flex items-center space-x-4">
// // 											<div className="p-2 bg-blue-100 rounded-lg">
// // 												<Building className="h-4 w-4 text-blue-600" />
// // 											</div>
// // 											<div>
// // 												<h4 className="font-medium">{company.name}</h4>
// // 												<p className="text-sm text-gray-500">
// // 													{company.alarms} total alarms
// // 												</p>
// // 											</div>
// // 										</div>
// // 										<div className="flex items-center space-x-6 text-sm">
// // 											<div className="text-center">
// // 												<p className="font-medium text-green-600">
// // 													{company.resolved}
// // 												</p>
// // 												<p className="text-xs text-gray-500">Resolved</p>
// // 											</div>
// // 											<div className="text-center">
// // 												<p className="font-medium">{company.responseTime}</p>
// // 												<p className="text-xs text-gray-500">Avg Response</p>
// // 											</div>
// // 											<div className="text-center">
// // 												<p className="font-medium text-blue-600">
// // 													{company.efficiency}%
// // 												</p>
// // 												<p className="text-xs text-gray-500">Efficiency</p>
// // 											</div>
// // 										</div>
// // 									</div>
// // 								))}
// // 							</div>
// // 						</CardContent>
// // 					</Card>
// // 				</TabsContent>

// // 				<TabsContent value="alarms" className="space-y-4">
// // 					<div className="grid gap-4 md:grid-cols-3">
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Active Alarms
// // 								</CardTitle>
// // 								<AlertTriangle className="h-4 w-4 text-red-500" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-red-600">
// // 									{analytics.totalAlarms - analytics.resolvedAlarms}
// // 								</div>
// // 								<p className="text-xs text-muted-foreground">
// // 									Require attention
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Acknowledged
// // 								</CardTitle>
// // 								<Clock className="h-4 w-4 text-yellow-500" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-yellow-600">15</div>
// // 								<p className="text-xs text-muted-foreground">In progress</p>
// // 							</CardContent>
// // 						</Card>
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Resolved Today
// // 								</CardTitle>
// // 								<CheckCircle className="h-4 w-4 text-green-500" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-green-600">47</div>
// // 								<p className="text-xs text-muted-foreground">
// // 									Successfully handled
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 					</div>

// // 					<Card>
// // 						<CardHeader>
// // 							<CardTitle>Alarm Trends (Last 6 Months)</CardTitle>
// // 						</CardHeader>
// // 						<CardContent>
// // 							<div className="space-y-4">
// // 								{alarmTrends.map((item, index) => (
// // 									<div
// // 										key={index}
// // 										className="flex items-center justify-between">
// // 										<span className="text-sm font-medium">{item.name}</span>
// // 										<div className="flex items-center space-x-4">
// // 											<span className="text-sm">{item.value} alarms</span>
// // 											<div
// // 												className={`flex items-center space-x-1 ${
// // 													item.change >= 0 ? "text-red-500" : "text-green-500"
// // 												}`}>
// // 												{item.change >= 0 ? (
// // 													<TrendingUp className="h-3 w-3" />
// // 												) : (
// // 													<TrendingDown className="h-3 w-3" />
// // 												)}
// // 												<span className="text-xs">
// // 													{Math.abs(item.change)}%
// // 												</span>
// // 											</div>
// // 										</div>
// // 									</div>
// // 								))}
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<div className="grid gap-4 md:grid-cols-2">
// // 						<Card>
// // 							<CardHeader>
// // 								<CardTitle>Alarm Types Distribution</CardTitle>
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="space-y-3">
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">Motion Detection</span>
// // 										<div className="flex items-center space-x-2">
// // 											<div className="w-20 bg-gray-200 rounded-full h-2">
// // 												<div
// // 													className="bg-blue-600 h-2 rounded-full"
// // 													style={{ width: "45%" }}></div>
// // 											</div>
// // 											<span className="text-xs">45%</span>
// // 										</div>
// // 									</div>
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">Door Breach</span>
// // 										<div className="flex items-center space-x-2">
// // 											<div className="w-20 bg-gray-200 rounded-full h-2">
// // 												<div
// // 													className="bg-red-600 h-2 rounded-full"
// // 													style={{ width: "25%" }}></div>
// // 											</div>
// // 											<span className="text-xs">25%</span>
// // 										</div>
// // 									</div>
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">Window Sensor</span>
// // 										<div className="flex items-center space-x-2">
// // 											<div className="w-20 bg-gray-200 rounded-full h-2">
// // 												<div
// // 													className="bg-yellow-600 h-2 rounded-full"
// // 													style={{ width: "20%" }}></div>
// // 											</div>
// // 											<span className="text-xs">20%</span>
// // 										</div>
// // 									</div>
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">Other</span>
// // 										<div className="flex items-center space-x-2">
// // 											<div className="w-20 bg-gray-200 rounded-full h-2">
// // 												<div
// // 													className="bg-green-600 h-2 rounded-full"
// // 													style={{ width: "10%" }}></div>
// // 											</div>
// // 											<span className="text-xs">10%</span>
// // 										</div>
// // 									</div>
// // 								</div>
// // 							</CardContent>
// // 						</Card>

// // 						<Card>
// // 							<CardHeader>
// // 								<CardTitle>Severity Distribution</CardTitle>
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="space-y-3">
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">Critical</span>
// // 										<div className="flex items-center space-x-2">
// // 											<Badge className="bg-red-100 text-red-800">15%</Badge>
// // 											<span className="text-xs">187 alarms</span>
// // 										</div>
// // 									</div>
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">High</span>
// // 										<div className="flex items-center space-x-2">
// // 											<Badge className="bg-orange-100 text-orange-800">
// // 												35%
// // 											</Badge>
// // 											<span className="text-xs">436 alarms</span>
// // 										</div>
// // 									</div>
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">Medium</span>
// // 										<div className="flex items-center space-x-2">
// // 											<Badge className="bg-yellow-100 text-yellow-800">
// // 												40%
// // 											</Badge>
// // 											<span className="text-xs">498 alarms</span>
// // 										</div>
// // 									</div>
// // 									<div className="flex justify-between items-center">
// // 										<span className="text-sm">Low</span>
// // 										<div className="flex items-center space-x-2">
// // 											<Badge className="bg-green-100 text-green-800">10%</Badge>
// // 											<span className="text-xs">126 alarms</span>
// // 										</div>
// // 									</div>
// // 								</div>
// // 							</CardContent>
// // 						</Card>
// // 					</div>
// // 				</TabsContent>

// // 				<TabsContent value="users" className="space-y-4">
// // 					<div className="grid gap-4 md:grid-cols-4">
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Office Managers
// // 								</CardTitle>
// // 								<Building className="h-4 w-4 text-blue-500" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-blue-600">
// // 									{userActivity.find((u) => u.name === "Office Managers")
// // 										?.value || 0}
// // 								</div>
// // 								<p className="text-xs text-muted-foreground">+8 this month</p>
// // 							</CardContent>
// // 						</Card>
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Police Managers
// // 								</CardTitle>
// // 								<Shield className="h-4 w-4 text-green-500" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-green-600">
// // 									{userActivity.find((u) => u.name === "Police Managers")
// // 										?.value || 0}
// // 								</div>
// // 								<p className="text-xs text-muted-foreground">+5 this month</p>
// // 							</CardContent>
// // 						</Card>
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">Operators</CardTitle>
// // 								<Users className="h-4 w-4 text-purple-500" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-purple-600">
// // 									{userActivity.find((u) => u.name === "Operators")?.value || 0}
// // 								</div>
// // 								<p className="text-xs text-muted-foreground">+12 this month</p>
// // 							</CardContent>
// // 						</Card>
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Active Sessions
// // 								</CardTitle>
// // 								<Activity className="h-4 w-4 text-green-500" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-green-600">
// // 									{analytics.activeUsers}
// // 								</div>
// // 								<p className="text-xs text-muted-foreground">
// // 									Currently online
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 					</div>

// // 					<Card>
// // 						<CardHeader>
// // 							<CardTitle>User Activity Overview</CardTitle>
// // 						</CardHeader>
// // 						<CardContent>
// // 							<div className="space-y-4">
// // 								{userActivity.map((item, index) => (
// // 									<div
// // 										key={index}
// // 										className="flex items-center justify-between p-4 border rounded-lg">
// // 										<div className="flex items-center space-x-4">
// // 											<div className="p-2 bg-blue-100 rounded-lg">
// // 												<Users className="h-4 w-4 text-blue-600" />
// // 											</div>
// // 											<div>
// // 												<h4 className="font-medium">{item.name}</h4>
// // 												<p className="text-sm text-gray-500">
// // 													{item.value} active users
// // 												</p>
// // 											</div>
// // 										</div>
// // 										<div className="flex items-center space-x-2">
// // 											<div
// // 												className={`flex items-center space-x-1 ${
// // 													item.change >= 0 ? "text-green-500" : "text-red-500"
// // 												}`}>
// // 												{item.change >= 0 ? (
// // 													<TrendingUp className="h-3 w-3" />
// // 												) : (
// // 													<TrendingDown className="h-3 w-3" />
// // 												)}
// // 												<span className="text-xs">
// // 													+{item.change} this month
// // 												</span>
// // 											</div>
// // 										</div>
// // 									</div>
// // 								))}
// // 							</div>
// // 						</CardContent>
// // 					</Card>
// // 				</TabsContent>

// // 				<TabsContent value="performance" className="space-y-4">
// // 					<div className="grid gap-4 md:grid-cols-3">
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Avg Response Time
// // 								</CardTitle>
// // 								<Clock className="h-4 w-4 text-muted-foreground" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold">
// // 									{analytics.averageResponseTime}
// // 								</div>
// // 								<p className="text-xs text-muted-foreground flex items-center">
// // 									<TrendingDown className="h-3 w-3 mr-1 text-green-500" />
// // 									-30s from last month
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Resolution Rate
// // 								</CardTitle>
// // 								<Target className="h-4 w-4 text-muted-foreground" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-green-600">
// // 									{(
// // 										(analytics.resolvedAlarms / analytics.totalAlarms) *
// // 										100
// // 									).toFixed(1)}
// // 									%
// // 								</div>
// // 								<p className="text-xs text-muted-foreground flex items-center">
// // 									<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
// // 									+2.1% from last month
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 						<Card>
// // 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 								<CardTitle className="text-sm font-medium">
// // 									Efficiency Score
// // 								</CardTitle>
// // 								<Zap className="h-4 w-4 text-muted-foreground" />
// // 							</CardHeader>
// // 							<CardContent>
// // 								<div className="text-2xl font-bold text-blue-600">94.7%</div>
// // 								<p className="text-xs text-muted-foreground flex items-center">
// // 									<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
// // 									+1.3% from last month
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 					</div>

// // 					<Card>
// // 						<CardHeader>
// // 							<CardTitle>Top Performing Companies</CardTitle>
// // 						</CardHeader>
// // 						<CardContent>
// // 							<div className="space-y-4">
// // 								{companyPerformance.slice(0, 3).map((company, index) => (
// // 									<div
// // 										key={index}
// // 										className="flex items-center justify-between p-4 border rounded-lg">
// // 										<div className="flex items-center space-x-4">
// // 											<div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
// // 												<span className="text-sm font-bold text-blue-600">
// // 													{index + 1}
// // 												</span>
// // 											</div>
// // 											<div>
// // 												<h4 className="font-medium">{company.name}</h4>
// // 												<p className="text-sm text-gray-500">
// // 													{company.efficiency}% efficiency
// // 												</p>
// // 											</div>
// // 										</div>
// // 										<div className="text-right">
// // 											<p className="font-medium">{company.responseTime}</p>
// // 											<p className="text-xs text-gray-500">Avg response time</p>
// // 										</div>
// // 									</div>
// // 								))}
// // 							</div>
// // 						</CardContent>
// // 					</Card>
// // 				</TabsContent>

// // 				<TabsContent value="system" className="space-y-4">
// // 					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
// // 						{systemMetrics.map((metric, index) => (
// // 							<Card key={index}>
// // 								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// // 									<CardTitle className="text-sm font-medium">
// // 										{metric.metric}
// // 									</CardTitle>
// // 									{getTrendIcon(metric.trend)}
// // 								</CardHeader>
// // 								<CardContent>
// // 									<div className="text-2xl font-bold">{metric.value}</div>
// // 									<Badge className={getStatusColor(metric.status)}>
// // 										{metric.status}
// // 									</Badge>
// // 								</CardContent>
// // 							</Card>
// // 						))}
// // 					</div>

// // 					<Card>
// // 						<CardHeader>
// // 							<CardTitle>System Health Overview</CardTitle>
// // 						</CardHeader>
// // 						<CardContent>
// // 							<div className="space-y-4">
// // 								<div className="flex items-center justify-between">
// // 									<span className="text-sm">Overall System Health</span>
// // 									<Badge className="bg-green-100 text-green-800">
// // 										Excellent
// // 									</Badge>
// // 								</div>
// // 								<div className="w-full bg-gray-200 rounded-full h-3">
// // 									<div
// // 										className="bg-green-600 h-3 rounded-full"
// // 										style={{ width: "96%" }}></div>
// // 								</div>
// // 								<div className="grid grid-cols-2 gap-4 text-sm">
// // 									<div>
// // 										<p className="text-gray-500">Last Incident</p>
// // 										<p className="font-medium">15 days ago</p>
// // 									</div>
// // 									<div>
// // 										<p className="text-gray-500">Next Maintenance</p>
// // 										<p className="font-medium">In 5 days</p>
// // 									</div>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>
// // 				</TabsContent>
// // 			</Tabs>
// // 		</div>
// // 	);
// // }
