"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Area,
	AreaChart,
} from "recharts";
import {
	AlertTriangle,
	CheckCircle,
	Eye,
	Activity,
	Target,
	Building,
	TrendingUp,
	BarChart3,
	PieChartIcon,
	Download,
	Filter,
	RefreshCw,
	FileText,
	Timer,
	FileDown,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api-service";

interface Alarm {
	id: string;
	type: string;
	alarmCode: string;
	branchId: string;
	branch: {
		id: string;
		name: string;
		city: string;
		subCity: string;
		locationType: string;
		company?: {
			id: string;
			name: string;
			logo?: string;
		};
	};
	location: string;
	latitude: string;
	longitude: string;
	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	additionalNotes?: string;
	createdBy: {
		id: string;
		name: string;
		email: string;
	};
	createdAt: string;
	reports: Array<{
		id: string;
		status: string;
		acknowledgedAt?: string;
		completedAt?: string;
		resolutionDescription?: string;
		notes?: string;
		assignedTo?: {
			id: string;
			name: string;
			company?: {
				name: string;
			};
		};
		acknowledgedBy?: {
			id: string;
			name: string;
			email: string;
		};
		resolvedBy?: {
			id: string;
			name: string;
			email: string;
		};
	}>;
}

interface ReportFilters {
	dateRange: string;
	status: string;
	severity: string;
	branchId: string;
	companyId: string;
	startDate: string;
	endDate: string;
}

interface AlarmStats {
	total: number;
	active: number;
	acknowledged: number;
	resolved: number;
	critical: number;
	high: number;
	medium: number;
	low: number;
	avgResponseTime: number;
	avgResolutionTime: number;
	resolutionRate: number;
}

export default function ReportsPage() {
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [stats, setStats] = useState<AlarmStats | null>(null);
	const [performanceData, setPerformanceData] = useState<any[]>([]);
	const [filters, setFilters] = useState<ReportFilters>({
		dateRange: "30",
		status: "all",
		severity: "all",
		branchId: "all",
		companyId: "all",
		startDate: "",
		endDate: "",
	});

	const { toast } = useToast();

	// Load initial data
	useEffect(() => {
		loadReportData();
	}, []);

	// Reload data when filters change
	useEffect(() => {
		if (!loading) {
			loadReportData();
		}
	}, [filters]);

	const loadReportData = async () => {
		try {
			setLoading(true);

			// Build filter parameters
			const filterParams = buildFilterParams();

			// Load all required data in parallel
			const [alarmsResponse, userResponse, statsResponse, performanceResponse] =
				await Promise.all([
					apiService.getAlarms(filterParams),
					apiService.getCurrentUser(),
					apiService.getAlarmStats(filterParams),
					apiService.getPerformanceMetrics(filterParams),
				]);

			console.log({
				alarmsResponse,
			});

			setAlarms((alarmsResponse as any).alarms);
			setCurrentUser(userResponse);
			setStats((statsResponse as any).stats);
			setPerformanceData((performanceResponse as any).performance);
		} catch (error) {
			console.error("Failed to load report data:", error);
			toast({
				title: "Error",
				description: "Failed to load reports data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const buildFilterParams = () => {
		const params: any = {};

		// Date range filter
		if (filters.dateRange !== "all") {
			const days = Number.parseInt(filters.dateRange);
			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);

			params.dateFrom = startDate.toISOString();
			params.dateTo = endDate.toISOString();
		}

		// Custom date range
		if (filters.startDate && filters.endDate) {
			params.dateFrom = new Date(filters.startDate).toISOString();
			params.dateTo = new Date(filters.endDate).toISOString();
		}

		// Status and severity filters
		if (filters.status !== "all") params.status = filters.status;
		if (filters.severity !== "all") params.severity = filters.severity;
		if (filters.branchId !== "all") params.branchId = filters.branchId;
		if (filters.companyId !== "all") params.companyId = filters.companyId;

		return params;
	};

	// Filter alarms based on current filters (for client-side filtering)
	const filteredAlarms = useMemo(() => {
		const filtered = [...alarms];

		// Additional client-side filtering if needed
		return filtered.sort((a, b) => {
			if (a.status !== b.status) {
				const statusOrder = { ACTIVE: 0, ACKNOWLEDGED: 1, RESOLVED: 2 };
				return statusOrder[a.status] - statusOrder[b.status];
			}
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [alarms]);

	// Chart data
	const statusChartData = useMemo(() => {
		if (!stats) return [];
		return [
			{ name: "Active", value: stats.active, color: "#ef4444" },
			{ name: "Acknowledged", value: stats.acknowledged, color: "#f59e0b" },
			{ name: "Resolved", value: stats.resolved, color: "#10b981" },
		];
	}, [stats]);

	const severityChartData = useMemo(() => {
		if (!stats) return [];
		return [
			{ name: "Critical", value: stats.critical, color: "#dc2626" },
			{ name: "High", value: stats.high, color: "#ea580c" },
			{ name: "Medium", value: stats.medium, color: "#ca8a04" },
			{ name: "Low", value: stats.low, color: "#2563eb" },
		];
	}, [stats]);

	// Daily trend data (last 30 days)
	const dailyTrendData = useMemo(() => {
		const last30Days = Array.from({ length: 30 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (29 - i));
			return date.toISOString().split("T")[0];
		});

		return last30Days.map((date) => {
			const dayAlarms = filteredAlarms.filter(
				(alarm) => alarm.createdAt.split("T")[0] === date
			);
			return {
				date: new Date(date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
				total: dayAlarms.length,
				active: dayAlarms.filter((a) => a.status === "ACTIVE").length,
				resolved: dayAlarms.filter((a) => a.status === "RESOLVED").length,
			};
		});
	}, [filteredAlarms]);

	// Top alarm types
	const alarmTypeData = useMemo(() => {
		const typeCount = filteredAlarms.reduce((acc, alarm) => {
			acc[alarm.type] = (acc[alarm.type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		return Object.entries(typeCount)
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);
	}, [filteredAlarms]);

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const exportToCSV = async () => {
		try {
			setExporting("csv");
			const filterParams = buildFilterParams();
			await apiService.exportAlarmsCSV(filterParams);

			toast({
				title: "Success",
				description: "CSV report exported successfully",
			});
		} catch (error) {
			console.error("CSV export failed:", error);
			toast({
				title: "Error",
				description: "Failed to export CSV report",
				variant: "destructive",
			});
		} finally {
			setExporting(null);
		}
	};

	const exportToPDF = async () => {
		try {
			setExporting("pdf");
			const filterParams = buildFilterParams();

			// Prepare comprehensive report data for PDF
			const reportData = {
				stats,
				alarms: filteredAlarms.slice(0, 50), // Limit for PDF size
				charts: {
					statusDistribution: statusChartData,
					severityDistribution: severityChartData,
					dailyTrends: dailyTrendData,
					topAlarmTypes: alarmTypeData,
				},
				performance: performanceData,
				generatedAt: new Date().toISOString(),
				generatedBy: currentUser?.name || "Unknown",
				filters: {
					dateRange: filters.dateRange,
					status: filters.status,
					severity: filters.severity,
					customDateRange:
						filters.startDate && filters.endDate
							? `${filters.startDate} to ${filters.endDate}`
							: null,
				},
			};

			await apiService.exportAlarmsPDF(filterParams, reportData);

			toast({
				title: "Success",
				description: "PDF report exported successfully",
			});
		} catch (error) {
			console.error("PDF export failed:", error);
			toast({
				title: "Error",
				description: "Failed to export PDF report",
				variant: "destructive",
			});
		} finally {
			setExporting(null);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
				<div className="space-y-6">
					<Skeleton className="h-32 w-full bg-slate-800" />
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-24 bg-slate-800" />
						))}
					</div>
					<Skeleton className="h-96 w-full bg-slate-800" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			<div className="space-y-6 p-6">
				{/* Header */}
				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900/20 via-slate-900/40 to-purple-900/20 border border-blue-500/20 p-8">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
					<div className="relative flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="p-4 bg-blue-600/20 rounded-xl border border-blue-500/30">
								<BarChart3 className="h-8 w-8 text-blue-400" />
							</div>
							<div>
								<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
									Alarm Reports & Analytics
								</h1>
								<p className="text-slate-400 font-mono text-lg mt-2">
									Comprehensive incident reporting and performance analytics
								</p>
								{currentUser && (
									<p className="text-slate-500 font-mono text-sm mt-1">
										Generated for: {currentUser.name} ({currentUser.role})
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<Button
								onClick={exportToCSV}
								disabled={exporting === "csv"}
								className="bg-green-600 hover:bg-green-700 text-white">
								{exporting === "csv" ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Download className="h-4 w-4 mr-2" />
								)}
								Export CSV
							</Button>
							<Button
								onClick={exportToPDF}
								disabled={exporting === "pdf"}
								className="bg-red-600 hover:bg-red-700 text-white">
								{exporting === "pdf" ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<FileDown className="h-4 w-4 mr-2" />
								)}
								Export PDF
							</Button>
							<Button
								onClick={loadReportData}
								disabled={loading}
								variant="outline"
								className="border-slate-600 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40">
								{loading ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<RefreshCw className="h-4 w-4 mr-2" />
								)}
								Refresh
							</Button>
						</div>
					</div>
				</div>

				{/* Filters */}
				<Card className="bg-slate-900/50 border-slate-700">
					<CardHeader>
						<CardTitle className="flex items-center text-white">
							<Filter className="h-5 w-5 mr-2 text-blue-400" />
							Report Filters
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div>
								<Label className="text-slate-300">Date Range</Label>
								<Select
									value={filters.dateRange}
									onValueChange={(value) =>
										setFilters({ ...filters, dateRange: value })
									}>
									<SelectTrigger className="bg-slate-800 border-slate-600 text-white">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-slate-800 border-slate-600">
										<SelectItem value="7">Last 7 days</SelectItem>
										<SelectItem value="30">Last 30 days</SelectItem>
										<SelectItem value="90">Last 90 days</SelectItem>
										<SelectItem value="365">Last year</SelectItem>
										<SelectItem value="all">All time</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="text-slate-300">Status</Label>
								<Select
									value={filters.status}
									onValueChange={(value) =>
										setFilters({ ...filters, status: value })
									}>
									<SelectTrigger className="bg-slate-800 border-slate-600 text-white">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-slate-800 border-slate-600">
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value="ACTIVE">Active</SelectItem>
										<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
										<SelectItem value="RESOLVED">Resolved</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="text-slate-300">Severity</Label>
								<Select
									value={filters.severity}
									onValueChange={(value) =>
										setFilters({ ...filters, severity: value })
									}>
									<SelectTrigger className="bg-slate-800 border-slate-600 text-white">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-slate-800 border-slate-600">
										<SelectItem value="all">All Severity</SelectItem>
										<SelectItem value="CRITICAL">Critical</SelectItem>
										<SelectItem value="HIGH">High</SelectItem>
										<SelectItem value="MEDIUM">Medium</SelectItem>
										<SelectItem value="LOW">Low</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="text-slate-300">Custom Date Range</Label>
								<div className="flex space-x-2">
									<Input
										type="date"
										value={filters.startDate}
										onChange={(e) =>
											setFilters({ ...filters, startDate: e.target.value })
										}
										className="bg-slate-800 border-slate-600 text-white text-xs"
									/>
									<Input
										type="date"
										value={filters.endDate}
										onChange={(e) =>
											setFilters({ ...filters, endDate: e.target.value })
										}
										className="bg-slate-800 border-slate-600 text-white text-xs"
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Key Metrics */}
				{stats && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card className="bg-slate-900/50 border-slate-700">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-slate-400">Total Alarms</p>
										<p className="text-2xl font-bold text-white">
											{stats.total}
										</p>
									</div>
									<Activity className="h-8 w-8 text-blue-400" />
								</div>
							</CardContent>
						</Card>

						<Card className="bg-red-900/20 border-red-500/30">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-red-300">Active Alarms</p>
										<p className="text-2xl font-bold text-red-400">
											{stats.active}
										</p>
									</div>
									<AlertTriangle className="h-8 w-8 text-red-400" />
								</div>
							</CardContent>
						</Card>

						<Card className="bg-green-900/20 border-green-500/30">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-green-300">Resolution Rate</p>
										<p className="text-2xl font-bold text-green-400">
											{stats.resolutionRate}%
										</p>
									</div>
									<CheckCircle className="h-8 w-8 text-green-400" />
								</div>
							</CardContent>
						</Card>

						<Card className="bg-purple-900/20 border-purple-500/30">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-purple-300">Avg Response</p>
										<p className="text-2xl font-bold text-purple-400">
											{Math.round(stats.avgResponseTime)}m
										</p>
									</div>
									<Timer className="h-8 w-8 text-purple-400" />
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Charts Row 1 */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Status Distribution */}
					<Card className="bg-slate-900/50 border-slate-700">
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<PieChartIcon className="h-5 w-5 mr-2 text-blue-400" />
								Status Distribution
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={statusChartData}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={5}
											dataKey="value">
											{statusChartData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: "#1e293b",
												border: "1px solid #475569",
												borderRadius: "8px",
												color: "#fff",
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="flex justify-center space-x-4 mt-4">
								{statusChartData.map((item, index) => (
									<div key={index} className="flex items-center space-x-2">
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: item.color }}
										/>
										<span className="text-sm text-slate-300">
											{item.name}: {item.value}
										</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Severity Distribution */}
					<Card className="bg-slate-900/50 border-slate-700">
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<BarChart3 className="h-5 w-5 mr-2 text-orange-400" />
								Severity Distribution
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={severityChartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
										<XAxis
											dataKey="name"
											stroke="#9ca3af"
											fontSize={12}
											tickLine={false}
											axisLine={false}
										/>
										<YAxis
											stroke="#9ca3af"
											fontSize={12}
											tickLine={false}
											axisLine={false}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: "#1e293b",
												border: "1px solid #475569",
												borderRadius: "8px",
												color: "#fff",
											}}
										/>
										<Bar dataKey="value" radius={[4, 4, 0, 0]}>
											{severityChartData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Daily Trend Chart */}
				<Card className="bg-slate-900/50 border-slate-700">
					<CardHeader>
						<CardTitle className="flex items-center text-white">
							<TrendingUp className="h-5 w-5 mr-2 text-green-400" />
							Daily Alarm Trends (Last 30 Days)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={dailyTrendData}>
									<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
									<XAxis
										dataKey="date"
										stroke="#9ca3af"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										stroke="#9ca3af"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "#1e293b",
											border: "1px solid #475569",
											borderRadius: "8px",
											color: "#fff",
										}}
									/>
									<Area
										type="monotone"
										dataKey="total"
										stackId="1"
										stroke="#3b82f6"
										fill="#3b82f6"
										fillOpacity={0.3}
									/>
									<Area
										type="monotone"
										dataKey="resolved"
										stackId="2"
										stroke="#10b981"
										fill="#10b981"
										fillOpacity={0.3}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Data Tables Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Top Alarm Types */}
					<Card className="bg-slate-900/50 border-slate-700">
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<Target className="h-5 w-5 mr-2 text-yellow-400" />
								Top Alarm Types
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{alarmTypeData.map((item, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
												<span className="text-yellow-400 font-bold text-sm">
													{index + 1}
												</span>
											</div>
											<span className="text-white font-medium">
												{item.type}
											</span>
										</div>
										<Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
											{item.count}
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Company Performance */}
					<Card className="bg-slate-900/50 border-slate-700">
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<Building className="h-5 w-5 mr-2 text-cyan-400" />
								Company Performance
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{performanceData.slice(0, 10).map((item, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
										<div className="flex-1 min-w-0">
											<p className="text-white font-medium truncate">
												{item.companyName}
											</p>
											<p className="text-slate-400 text-sm">
												{item.resolvedAlarms}/{item.totalAlarms} resolved
											</p>
										</div>
										<div className="text-right">
											<Badge
												className={cn(
													"text-xs",
													item.resolutionRate >= 80
														? "bg-green-500/20 text-green-300 border-green-500/30"
														: item.resolutionRate >= 60
														? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
														: "bg-red-500/20 text-red-300 border-red-500/30"
												)}>
												{item.resolutionRate}%
											</Badge>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Recent Alarms Table */}
				<Card className="bg-slate-900/50 border-slate-700">
					<CardHeader>
						<CardTitle className="flex items-center text-white">
							<FileText className="h-5 w-5 mr-2 text-blue-400" />
							Recent Alarms ({filteredAlarms.length} total)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-slate-700">
										<th className="text-left p-3 text-slate-300">Code</th>
										<th className="text-left p-3 text-slate-300">Type</th>
										<th className="text-left p-3 text-slate-300">Company</th>
										<th className="text-left p-3 text-slate-300">Status</th>
										<th className="text-left p-3 text-slate-300">Severity</th>
										<th className="text-left p-3 text-slate-300">Created</th>
										<th className="text-left p-3 text-slate-300">Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredAlarms.slice(0, 20).map((alarm) => (
										<tr
											key={alarm.id}
											className="border-b border-slate-800 hover:bg-slate-800/30">
											<td className="p-3">
												<span className="font-mono text-blue-400">
													{alarm.alarmCode}
												</span>
											</td>
											<td className="p-3 text-white">{alarm.type}</td>
											<td className="p-3 text-slate-300">
												{alarm.branch.company?.name || "Unknown"}
											</td>
											<td className="p-3">
												<Badge
													className={cn(
														"text-xs",
														alarm.status === "ACTIVE" &&
															"bg-red-100/10 text-red-300 border-red-400/40",
														alarm.status === "ACKNOWLEDGED" &&
															"bg-yellow-100/10 text-yellow-300 border-yellow-400/40",
														alarm.status === "RESOLVED" &&
															"bg-green-100/10 text-green-300 border-green-400/40"
													)}>
													{alarm.status}
												</Badge>
											</td>
											<td className="p-3">
												<Badge
													className={cn(
														"text-xs",
														alarm.severity === "CRITICAL" &&
															"bg-red-500/20 text-red-300 border-red-500/40",
														alarm.severity === "HIGH" &&
															"bg-orange-500/20 text-orange-300 border-orange-500/40",
														alarm.severity === "MEDIUM" &&
															"bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
														alarm.severity === "LOW" &&
															"bg-blue-500/20 text-blue-300 border-blue-500/40"
													)}>
													{alarm.severity}
												</Badge>
											</td>
											<td className="p-3 text-slate-400">
												{formatDateTime(alarm.createdAt)}
											</td>
											<td className="p-3">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAlarm(alarm);
														setIsDetailsDialogOpen(true);
													}}
													className="border-slate-600 bg-slate-700/30 text-slate-300 hover:bg-slate-600/50">
													<Eye className="h-3 w-3 mr-1" />
													View
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{/* Alarm Details Dialog */}
				<Dialog
					open={isDetailsDialogOpen}
					onOpenChange={setIsDetailsDialogOpen}>
					<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-xl font-bold flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5 text-red-400" />
								<span>Alarm Details - {selectedAlarm?.alarmCode}</span>
							</DialogTitle>
							<DialogDescription className="text-slate-400">
								Complete alarm information and timeline
							</DialogDescription>
						</DialogHeader>

						{selectedAlarm && (
							<div className="space-y-4">
								{/* Basic Info */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-slate-400">Type</Label>
										<p className="text-white font-medium">
											{selectedAlarm.type}
										</p>
									</div>
									<div className="space-y-2">
										<Label className="text-slate-400">Status</Label>
										<Badge
											className={cn(
												selectedAlarm.status === "ACTIVE" &&
													"bg-red-100/10 text-red-300 border-red-400/40",
												selectedAlarm.status === "ACKNOWLEDGED" &&
													"bg-yellow-100/10 text-yellow-300 border-yellow-400/40",
												selectedAlarm.status === "RESOLVED" &&
													"bg-green-100/10 text-green-300 border-green-400/40"
											)}>
											{selectedAlarm.status}
										</Badge>
									</div>
									<div className="space-y-2">
										<Label className="text-slate-400">Severity</Label>
										<Badge
											className={cn(
												selectedAlarm.severity === "CRITICAL" &&
													"bg-red-500/20 text-red-300 border-red-500/40",
												selectedAlarm.severity === "HIGH" &&
													"bg-orange-500/20 text-orange-300 border-orange-500/40",
												selectedAlarm.severity === "MEDIUM" &&
													"bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
												selectedAlarm.severity === "LOW" &&
													"bg-blue-500/20 text-blue-300 border-blue-500/40"
											)}>
											{selectedAlarm.severity}
										</Badge>
									</div>
									<div className="space-y-2">
										<Label className="text-slate-400">Created By</Label>
										<p className="text-white">{selectedAlarm.createdBy.name}</p>
									</div>
								</div>

								{/* Description */}
								<div className="space-y-2">
									<Label className="text-slate-400">Description</Label>
									<p className="text-white bg-slate-800/50 p-3 rounded-lg">
										{selectedAlarm.description}
									</p>
								</div>

								{/* Location Info */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-slate-400">Company</Label>
										<p className="text-white">
											{selectedAlarm.branch.company?.name || "Unknown"}
										</p>
									</div>
									<div className="space-y-2">
										<Label className="text-slate-400">Branch</Label>
										<p className="text-white">{selectedAlarm.branch.name}</p>
									</div>
									<div className="space-y-2">
										<Label className="text-slate-400">Location</Label>
										<p className="text-white">{selectedAlarm.location}</p>
									</div>
									<div className="space-y-2">
										<Label className="text-slate-400">City</Label>
										<p className="text-white">{selectedAlarm.branch.city}</p>
									</div>
								</div>

								{/* Timeline */}
								{selectedAlarm.reports.length > 0 && (
									<div className="space-y-2">
										<Label className="text-slate-400">Timeline</Label>
										<div className="space-y-2">
											<div className="flex items-center space-x-3 p-2 bg-slate-800/50 rounded-lg">
												<div className="w-2 h-2 bg-red-400 rounded-full"></div>
												<div className="flex-1">
													<span className="text-white text-sm font-medium">
														Created
													</span>
													<span className="text-slate-400 text-xs ml-2">
														{formatDateTime(selectedAlarm.createdAt)}
													</span>
												</div>
											</div>

											{selectedAlarm.reports[0]?.acknowledgedAt && (
												<div className="flex items-center space-x-3 p-2 bg-slate-800/50 rounded-lg">
													<div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
													<div className="flex-1">
														<span className="text-white text-sm font-medium">
															Acknowledged
														</span>
														<span className="text-slate-400 text-xs ml-2">
															{formatDateTime(
																selectedAlarm.reports[0].acknowledgedAt
															)}
														</span>
													</div>
												</div>
											)}

											{selectedAlarm.reports[0]?.completedAt && (
												<div className="flex items-center space-x-3 p-2 bg-slate-800/50 rounded-lg">
													<div className="w-2 h-2 bg-green-400 rounded-full"></div>
													<div className="flex-1">
														<span className="text-white text-sm font-medium">
															Resolved
														</span>
														<span className="text-slate-400 text-xs ml-2">
															{formatDateTime(
																selectedAlarm.reports[0].completedAt
															)}
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Resolution Description */}
								{selectedAlarm.reports[0]?.resolutionDescription && (
									<div className="space-y-2">
										<Label className="text-slate-400">Resolution</Label>
										<p className="text-white bg-green-900/20 p-3 rounded-lg border border-green-700">
											{selectedAlarm.reports[0].resolutionDescription}
										</p>
									</div>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
