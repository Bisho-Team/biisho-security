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
	TrendingUp,
	TrendingDown,
	Users,
	Building,
	Shield,
	AlertTriangle,
	Clock,
	CheckCircle,
	Download,
	Activity,
	Target,
	Zap,
} from "lucide-react";

interface AnalyticsData {
	totalUsers: number;
	activeUsers: number;
	totalCompanies: number;
	totalBranches: number;
	totalAlarms: number;
	resolvedAlarms: number;
	averageResponseTime: string;
	systemUptime: string;
}

interface ChartData {
	name: string;
	value: number;
	change: number;
}

interface CompanyPerformance {
	name: string;
	alarms: number;
	resolved: number;
	responseTime: string;
	efficiency: number;
}

interface SystemMetric {
	metric: string;
	value: string;
	status: string;
	trend: string;
}

export default function AnalyticsPage() {
	const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
	const [alarmTrends, setAlarmTrends] = useState<ChartData[]>([]);
	const [userActivity, setUserActivity] = useState<ChartData[]>([]);
	const [companyPerformance, setCompanyPerformance] = useState<
		CompanyPerformance[]
	>([]);
	const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState("30d");
	const [selectedMetric, setSelectedMetric] = useState("alarms");
	const { toast } = useToast();

	useEffect(() => {
		fetchAnalytics();
	}, [timeRange]);

	const fetchAnalytics = async () => {
		try {
			setLoading(true);
			const [
				analyticsResponse,
				trendsResponse,
				activityResponse,
				performanceResponse,
				metricsResponse,
			] = await Promise.all([
				apiService.get(`/analytics/overview?timeRange=${timeRange}`),
				apiService.get(`/analytics/alarm-trends?timeRange=${timeRange}`),
				apiService.get(`/analytics/user-activity?timeRange=${timeRange}`),
				apiService.get(`/analytics/company-performance?timeRange=${timeRange}`),
				apiService.get(`/analytics/system-metrics`),
			]);

			setAnalytics(analyticsResponse.data);
			setAlarmTrends(trendsResponse.data);
			setUserActivity(activityResponse.data);
			setCompanyPerformance(performanceResponse.data);
			setSystemMetrics(metricsResponse.data);
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

	const exportReport = async () => {
		try {
			const response = await apiService.get(
				`/analytics/export?timeRange=${timeRange}`,
				{
					responseType: "blob",
				}
			);

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `analytics-report-${timeRange}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.remove();

			toast({
				title: "Success",
				description: "Analytics report exported successfully",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to export analytics report",
				variant: "destructive",
			});
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "excellent":
				return "bg-green-100 text-green-800";
			case "good":
				return "bg-blue-100 text-blue-800";
			case "normal":
				return "bg-yellow-100 text-yellow-800";
			case "warning":
				return "bg-orange-100 text-orange-800";
			case "critical":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case "up":
				return <TrendingUp className="h-3 w-3 text-green-500" />;
			case "down":
				return <TrendingDown className="h-3 w-3 text-red-500" />;
			default:
				return <Activity className="h-3 w-3 text-gray-500" />;
		}
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96 mt-2" />
					</div>
					<div className="flex space-x-2">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-10 w-32" />
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

	if (!analytics) return null;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						System Analytics
					</h1>
					<p className="text-muted-foreground">
						Comprehensive insights and performance metrics
					</p>
				</div>
				<div className="flex space-x-2">
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
							<SelectItem value="1y">Last year</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" onClick={exportReport}>
						<Download className="h-4 w-4 mr-2" />
						Export Report
					</Button>
				</div>
			</div>

			{/* Key Metrics Overview */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalUsers}</div>
						<p className="text-xs text-muted-foreground flex items-center">
							<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
							+12% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Companies
						</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalCompanies}</div>
						<p className="text-xs text-muted-foreground flex items-center">
							<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
							+3 new this month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Alarms</CardTitle>
						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalAlarms}</div>
						<p className="text-xs text-muted-foreground flex items-center">
							<TrendingDown className="h-3 w-3 mr-1 text-green-500" />
							-5% from last month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">System Uptime</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{analytics.systemUptime}
						</div>
						<p className="text-xs text-muted-foreground">Last 30 days</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="alarms">Alarm Analytics</TabsTrigger>
					<TabsTrigger value="users">User Analytics</TabsTrigger>
					<TabsTrigger value="performance">Performance</TabsTrigger>
					<TabsTrigger value="system">System Health</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Alarm Resolution Rate</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm">Total Alarms</span>
										<span className="font-medium">{analytics.totalAlarms}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Resolved</span>
										<span className="font-medium text-green-600">
											{analytics.resolvedAlarms}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Resolution Rate</span>
										<span className="font-medium text-green-600">
											{(
												(analytics.resolvedAlarms / analytics.totalAlarms) *
												100
											).toFixed(1)}
											%
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-green-600 h-2 rounded-full"
											style={{
												width: `${
													(analytics.resolvedAlarms / analytics.totalAlarms) *
													100
												}%`,
											}}></div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Response Time Metrics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm">Average Response Time</span>
										<span className="font-medium">
											{analytics.averageResponseTime}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Critical Alarms</span>
										<span className="font-medium">2.1 min</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">High Priority</span>
										<span className="font-medium">3.8 min</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Medium Priority</span>
										<span className="font-medium">6.2 min</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Company Performance Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{companyPerformance.map((company, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center space-x-4">
											<div className="p-2 bg-blue-100 rounded-lg">
												<Building className="h-4 w-4 text-blue-600" />
											</div>
											<div>
												<h4 className="font-medium">{company.name}</h4>
												<p className="text-sm text-gray-500">
													{company.alarms} total alarms
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-6 text-sm">
											<div className="text-center">
												<p className="font-medium text-green-600">
													{company.resolved}
												</p>
												<p className="text-xs text-gray-500">Resolved</p>
											</div>
											<div className="text-center">
												<p className="font-medium">{company.responseTime}</p>
												<p className="text-xs text-gray-500">Avg Response</p>
											</div>
											<div className="text-center">
												<p className="font-medium text-blue-600">
													{company.efficiency}%
												</p>
												<p className="text-xs text-gray-500">Efficiency</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="alarms" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Alarms
								</CardTitle>
								<AlertTriangle className="h-4 w-4 text-red-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{analytics.totalAlarms - analytics.resolvedAlarms}
								</div>
								<p className="text-xs text-muted-foreground">
									Require attention
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Acknowledged
								</CardTitle>
								<Clock className="h-4 w-4 text-yellow-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-yellow-600">15</div>
								<p className="text-xs text-muted-foreground">In progress</p>
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
								<div className="text-2xl font-bold text-green-600">47</div>
								<p className="text-xs text-muted-foreground">
									Successfully handled
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Alarm Trends (Last 6 Months)</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{alarmTrends.map((item, index) => (
									<div
										key={index}
										className="flex items-center justify-between">
										<span className="text-sm font-medium">{item.name}</span>
										<div className="flex items-center space-x-4">
											<span className="text-sm">{item.value} alarms</span>
											<div
												className={`flex items-center space-x-1 ${
													item.change >= 0 ? "text-red-500" : "text-green-500"
												}`}>
												{item.change >= 0 ? (
													<TrendingUp className="h-3 w-3" />
												) : (
													<TrendingDown className="h-3 w-3" />
												)}
												<span className="text-xs">
													{Math.abs(item.change)}%
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Alarm Types Distribution</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-sm">Motion Detection</span>
										<div className="flex items-center space-x-2">
											<div className="w-20 bg-gray-200 rounded-full h-2">
												<div
													className="bg-blue-600 h-2 rounded-full"
													style={{ width: "45%" }}></div>
											</div>
											<span className="text-xs">45%</span>
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">Door Breach</span>
										<div className="flex items-center space-x-2">
											<div className="w-20 bg-gray-200 rounded-full h-2">
												<div
													className="bg-red-600 h-2 rounded-full"
													style={{ width: "25%" }}></div>
											</div>
											<span className="text-xs">25%</span>
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">Window Sensor</span>
										<div className="flex items-center space-x-2">
											<div className="w-20 bg-gray-200 rounded-full h-2">
												<div
													className="bg-yellow-600 h-2 rounded-full"
													style={{ width: "20%" }}></div>
											</div>
											<span className="text-xs">20%</span>
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">Other</span>
										<div className="flex items-center space-x-2">
											<div className="w-20 bg-gray-200 rounded-full h-2">
												<div
													className="bg-green-600 h-2 rounded-full"
													style={{ width: "10%" }}></div>
											</div>
											<span className="text-xs">10%</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Severity Distribution</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-sm">Critical</span>
										<div className="flex items-center space-x-2">
											<Badge className="bg-red-100 text-red-800">15%</Badge>
											<span className="text-xs">187 alarms</span>
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">High</span>
										<div className="flex items-center space-x-2">
											<Badge className="bg-orange-100 text-orange-800">
												35%
											</Badge>
											<span className="text-xs">436 alarms</span>
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">Medium</span>
										<div className="flex items-center space-x-2">
											<Badge className="bg-yellow-100 text-yellow-800">
												40%
											</Badge>
											<span className="text-xs">498 alarms</span>
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm">Low</span>
										<div className="flex items-center space-x-2">
											<Badge className="bg-green-100 text-green-800">10%</Badge>
											<span className="text-xs">126 alarms</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="users" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Office Managers
								</CardTitle>
								<Building className="h-4 w-4 text-blue-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-blue-600">
									{userActivity.find((u) => u.name === "Office Managers")
										?.value || 0}
								</div>
								<p className="text-xs text-muted-foreground">+8 this month</p>
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
									{userActivity.find((u) => u.name === "Police Managers")
										?.value || 0}
								</div>
								<p className="text-xs text-muted-foreground">+5 this month</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Operators</CardTitle>
								<Users className="h-4 w-4 text-purple-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-purple-600">
									{userActivity.find((u) => u.name === "Operators")?.value || 0}
								</div>
								<p className="text-xs text-muted-foreground">+12 this month</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Sessions
								</CardTitle>
								<Activity className="h-4 w-4 text-green-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{analytics.activeUsers}
								</div>
								<p className="text-xs text-muted-foreground">
									Currently online
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>User Activity Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{userActivity.map((item, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center space-x-4">
											<div className="p-2 bg-blue-100 rounded-lg">
												<Users className="h-4 w-4 text-blue-600" />
											</div>
											<div>
												<h4 className="font-medium">{item.name}</h4>
												<p className="text-sm text-gray-500">
													{item.value} active users
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<div
												className={`flex items-center space-x-1 ${
													item.change >= 0 ? "text-green-500" : "text-red-500"
												}`}>
												{item.change >= 0 ? (
													<TrendingUp className="h-3 w-3" />
												) : (
													<TrendingDown className="h-3 w-3" />
												)}
												<span className="text-xs">
													+{item.change} this month
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="performance" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Avg Response Time
								</CardTitle>
								<Clock className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{analytics.averageResponseTime}
								</div>
								<p className="text-xs text-muted-foreground flex items-center">
									<TrendingDown className="h-3 w-3 mr-1 text-green-500" />
									-30s from last month
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Resolution Rate
								</CardTitle>
								<Target className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{(
										(analytics.resolvedAlarms / analytics.totalAlarms) *
										100
									).toFixed(1)}
									%
								</div>
								<p className="text-xs text-muted-foreground flex items-center">
									<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
									+2.1% from last month
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Efficiency Score
								</CardTitle>
								<Zap className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-blue-600">94.7%</div>
								<p className="text-xs text-muted-foreground flex items-center">
									<TrendingUp className="h-3 w-3 mr-1 text-green-500" />
									+1.3% from last month
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Top Performing Companies</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{companyPerformance.slice(0, 3).map((company, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center space-x-4">
											<div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
												<span className="text-sm font-bold text-blue-600">
													{index + 1}
												</span>
											</div>
											<div>
												<h4 className="font-medium">{company.name}</h4>
												<p className="text-sm text-gray-500">
													{company.efficiency}% efficiency
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="font-medium">{company.responseTime}</p>
											<p className="text-xs text-gray-500">Avg response time</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="system" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{systemMetrics.map((metric, index) => (
							<Card key={index}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										{metric.metric}
									</CardTitle>
									{getTrendIcon(metric.trend)}
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{metric.value}</div>
									<Badge className={getStatusColor(metric.status)}>
										{metric.status}
									</Badge>
								</CardContent>
							</Card>
						))}
					</div>

					<Card>
						<CardHeader>
							<CardTitle>System Health Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm">Overall System Health</span>
									<Badge className="bg-green-100 text-green-800">
										Excellent
									</Badge>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-3">
									<div
										className="bg-green-600 h-3 rounded-full"
										style={{ width: "96%" }}></div>
								</div>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-gray-500">Last Incident</p>
										<p className="font-medium">15 days ago</p>
									</div>
									<div>
										<p className="text-gray-500">Next Maintenance</p>
										<p className="font-medium">In 5 days</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
