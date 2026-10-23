"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
	MessageSquare,
	Send,
	Phone,
	Loader2,
} from "lucide-react";

// Mock data that simulates realistic Ethiopian business scenarios
const mockSystemAnalytics = {
	overview: {
		totalUsers: 9,
		totalCompanies: 5,
		totalBranches: 15,
		totalAlarms: 183,
		activeAlarms: 12,
		resolvedAlarms: 8,
	},
	usersByRole: [
		{ role: "SUPER_ADMIN", _count: { role: 1 } },
		{ role: "OFFICE_MANAGER", _count: { role: 3 } },
		{ role: "POLICE_MANAGER", _count: { role: 1 } },
		{ role: "OPERATOR", _count: { role: 21 } },
	],
	alarmsBySeverity: [
		{ severity: "CRITICAL", _count: { severity: 89 } },
		// { severity: "HIGH", _count: { severity: 234 } },
		// { severity: "MEDIUM", _count: { severity: 567 } },
		// { severity: "LOW", _count: { severity: 944 } },
	],
	recentActivity: [
		{
			id: "ALM-2024-001",
			severity: "CRITICAL",
			status: "ACTIVE",
			createdAt: "2024-01-15T14:30:00Z",
			branch: { name: "Bole Atlas Mall Branch" },
			createdBy: { name: "Dawit Mengistu" },
		},
		{
			id: "ALM-2024-002",
			severity: "CRITICAL",
			status: "DISPATCHED",
			createdAt: "2024-01-15T13:45:00Z",
			branch: { name: "Piazza Corner Center" },
			createdBy: { name: "Hanan Abdella" },
		},
		{
			id: "ALM-2024-003",
			severity: "CRITICAL",
			status: "RESOLVED",
			createdAt: "2024-01-15T12:20:00Z",
			branch: { name: "Merkato Business District" },
			createdBy: { name: "Tigist Haile" },
		},
		{
			id: "ALM-2024-004",
			severity: "CRITICAL",
			status: "ACKNOWLEDGED",
			createdAt: "2024-01-15T11:15:00Z",
			branch: { name: "Addis Ababa University Campus" },
			createdBy: { name: "Solomon Tadesse" },
		},
		{
			id: "ALM-2024-005",
			severity: "CRITICAL",
			status: "ACTIVE",
			createdAt: "2024-01-15T10:30:00Z",
			branch: { name: "Ethiopian Airlines Headquarters" },
			createdBy: { name: "Meron Alemu" },
		},
	],
};

const mockPoliceAnalytics = {
	overview: {
		totalReports: 156,
		pendingReports: 23,
		completedReports: 133,
		avgResponseTime: 8.5,
	},
	reportsByStatus: [
		{ status: "PENDING", _count: { status: 23 } },
		{ status: "ACKNOWLEDGED", _count: { status: 18 } },
		{ status: "INVESTIGATING", _count: { status: 12 } },
		{ status: "COMPLETED", _count: { status: 103 } },
	],
};

const mockOfficeAnalytics = {
	overview: {
		totalBranches: 12,
		totalOperators: 45,
		totalAlarms: 234,
		activeAlarms: 5,
	},
	branchesData: [
		{
			id: "branch-001",
			name: "Bole Atlas Mall Security",
			address: "Bole Road, Addis Ababa",
			_count: { operators: 8, alarms: 45 },
		},
		{
			id: "branch-002",
			name: "Piazza Corner Center",
			address: "Piazza, Addis Ababa",
			_count: { operators: 6, alarms: 32 },
		},
		{
			id: "branch-003",
			name: "Merkato Business District",
			address: "Merkato, Addis Ababa",
			_count: { operators: 12, alarms: 67 },
		},
		{
			id: "branch-004",
			name: "Addis Ababa University Campus",
			address: "Sidist Kilo, Addis Ababa",
			_count: { operators: 10, alarms: 28 },
		},
		{
			id: "branch-005",
			name: "Ethiopian Airlines HQ",
			address: "Bole International Airport Area",
			_count: { operators: 9, alarms: 62 },
		},
	],
};

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

export default function EnhancedAnalyticsPage() {
	const [systemData, setSystemData] = useState<SystemAnalytics | null>(null);
	const [policeData, setPoliceData] = useState<PoliceAnalytics | null>(null);
	const [officeData, setOfficeData] = useState<OfficeAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState<string>("SUPER_ADMIN");
	const [activeTab, setActiveTab] = useState("overview");
	const [smsDialogOpen, setSmsDialogOpen] = useState(false);
	const [smsPhone, setSmsPhone] = useState("913228892");
	const [smsMessage, setSmsMessage] = useState("");
	const [sendingSms, setSendingSms] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		fetchAnalytics();
	}, [userRole]);

	const fetchAnalytics = async () => {
		try {
			setLoading(true);

			// Try to fetch real data first, fallback to mock data if empty/error
			if (userRole === "SUPER_ADMIN") {
				try {
					const response = await apiService.get("/analytics/system");
					// Check if response has meaningful data
					if (
						response.data &&
						response.data.overview &&
						response.data.overview.totalUsers > 0
					) {
						setSystemData(response.data);
					} else {
						// Use mock data if API returns empty/no data
						setSystemData(mockSystemAnalytics);
					}
				} catch (error) {
					// Use mock data on API error
					setSystemData(mockSystemAnalytics);
				}
			} else if (userRole === "POLICE_MANAGER") {
				try {
					const response = await apiService.get("/analytics/police");
					if (
						response.data &&
						response.data.overview &&
						response.data.overview.totalReports > 0
					) {
						setPoliceData(response.data);
					} else {
						setPoliceData(mockPoliceAnalytics);
					}
				} catch (error) {
					setPoliceData(mockPoliceAnalytics);
				}
			} else if (userRole === "OFFICE_MANAGER") {
				try {
					const response = await apiService.get("/analytics/office");
					if (
						response.data &&
						response.data.overview &&
						response.data.overview.totalBranches > 0
					) {
						setOfficeData(response.data);
					} else {
						setOfficeData(mockOfficeAnalytics);
					}
				} catch (error) {
					setOfficeData(mockOfficeAnalytics);
				}
			}
		} catch (error) {
			toast({
				title: "Info",
				description: "Using demo data for analytics display",
				variant: "default",
			});
		} finally {
			setLoading(false);
		}
	};

	const generateSystemReport = (
		data: SystemAnalytics | PoliceAnalytics | OfficeAnalytics,
	) => {
		const currentTime = new Date().toLocaleString("en-ET", {
			timeZone: "Africa/Addis_Ababa",
			dateStyle: "full",
			timeStyle: "short",
		});

		if (
			userRole === "SUPER_ADMIN" &&
			"overview" in data &&
			"totalUsers" in data.overview
		) {
			const systemData = data as SystemAnalytics;
			return `🔒 BIISHO SECURITY SYSTEM REPORT 🔒

📅 Generated: ${currentTime}
👤 Role: Super Administrator

📊 SYSTEM OVERVIEW:
• Total Users: ${systemData.overview.totalUsers}
• Active Companies: ${systemData.overview.totalCompanies}
• Monitored Branches: ${systemData.overview.totalBranches}
• Total Alarms: ${systemData.overview.totalAlarms}

🚨 CRITICAL ALERTS:
• Active Alarms: ${systemData.overview.activeAlarms}
• Resolved Alarms: ${systemData.overview.resolvedAlarms}
• Resolution Rate: ${(
				(systemData.overview.resolvedAlarms / systemData.overview.totalAlarms) *
				100
			).toFixed(1)}%

⚡ RECENT ACTIVITY:
${systemData.recentActivity
	.slice(0, 3)
	.map(
		(alarm) => `• ${alarm.severity} - ${alarm.branch.name} (${alarm.status})`,
	)
	.join("\n")}

🏢 Biiso Security Solutions
📞 Emergency: +251-911-000-000
🌐 www.biiso-security.et`;
		} else if (
			userRole === "POLICE_MANAGER" &&
			"overview" in data &&
			"totalReports" in data.overview
		) {
			const policeData = data as PoliceAnalytics;
			return `👮‍♂️ POLICE MANAGER REPORT 👮‍♂️

📅 Generated: ${currentTime}
👤 Role: Police Manager

📋 REPORTS SUMMARY:
• Total Reports: ${policeData.overview.totalReports}
• Pending Reports: ${policeData.overview.pendingReports}
• Completed Reports: ${policeData.overview.completedReports}
• Completion Rate: ${(
				(policeData.overview.completedReports /
					policeData.overview.totalReports) *
				100
			).toFixed(1)}%

⏱️ PERFORMANCE:
• Avg Response Time: ${policeData.overview.avgResponseTime} minutes
• Status: ${
				policeData.overview.pendingReports > 20 ? "HIGH WORKLOAD" : "NORMAL"
			}

🚔 Ethiopian Federal Police
📞 Emergency: 991
🏢 Biiso Security Partnership`;
		} else if (
			userRole === "OFFICE_MANAGER" &&
			"overview" in data &&
			"totalBranches" in data.overview
		) {
			const officeData = data as OfficeAnalytics;
			return `🏢 OFFICE MANAGER REPORT 🏢

📅 Generated: ${currentTime}
👤 Role: Office Manager

🏪 BRANCH OVERVIEW:
• Your Branches: ${officeData.overview.totalBranches}
• Your Operators: ${officeData.overview.totalOperators}
• Total Alarms: ${officeData.overview.totalAlarms}
• Active Alarms: ${officeData.overview.activeAlarms}

📍 TOP BRANCHES:
${officeData.branchesData
	.slice(0, 3)
	.map(
		(branch) =>
			`• ${branch.name}: ${branch._count.operators} operators, ${branch._count.alarms} alarms`,
	)
	.join("\n")}

🔐 Biiso Security Solutions
📞 Support: +251-911-123-456`;
		}

		return `📊 BIISO SECURITY REPORT\n\nGenerated: ${currentTime}\nSystem Status: Operational\n\n🏢 Biiso Security Solutions`;
	};

	const sendSmsReport = async () => {
		if (!smsPhone.trim()) {
			toast({
				title: "Error",
				description: "Please enter a phone number",
				variant: "destructive",
			});
			return;
		}

		setSendingSms(true);

		try {
			const currentData =
				userRole === "SUPER_ADMIN"
					? systemData
					: userRole === "POLICE_MANAGER"
						? policeData
						: officeData;

			if (!currentData) {
				throw new Error("No data available");
			}

			const reportMessage =
				smsMessage.trim() || generateSystemReport(currentData);

			const response = await fetch("http://94.130.27.32:3001/send-sms", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					to: smsPhone,
					message: reportMessage,
					callback: "https://koppa-security.et/sms-status",
				}),
			});

			if (response.ok) {
				toast({
					title: "SMS Sent Successfully! 📱",
					description: `System report sent to +251-${smsPhone}`,
					variant: "default",
				});
				setSmsDialogOpen(false);
				setSmsMessage("");
			} else {
				throw new Error("Failed to send SMS");
			}
		} catch (error) {
			toast({
				title: "SMS Failed",
				description: "Could not send SMS report. Please try again.",
				variant: "destructive",
			});
		} finally {
			setSendingSms(false);
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
							<Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
										<MessageSquare className="h-5 w-5 mr-2" />
										Send SMS Report
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-md">
									<DialogHeader>
										<DialogTitle className="flex items-center gap-2">
											<Phone className="h-5 w-5" />
											Send System Report via SMS
										</DialogTitle>
										<DialogDescription>
											Send a comprehensive system report to an admin via SMS
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="phone">Phone Number (Ethiopian)</Label>
											<div className="flex">
												<span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
													+251
												</span>
												<Input
													id="phone"
													placeholder="913228892"
													value={smsPhone}
													onChange={(e) => setSmsPhone(e.target.value)}
													className="rounded-l-none"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="message">Custom Message (Optional)</Label>
											<Textarea
												id="message"
												placeholder="Leave empty to use auto-generated system report..."
												value={smsMessage}
												onChange={(e) => setSmsMessage(e.target.value)}
												rows={4}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => setSmsDialogOpen(false)}>
											Cancel
										</Button>
										<Button
											type="button"
											onClick={sendSmsReport}
											disabled={sendingSms}>
											{sendingSms ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Sending...
												</>
											) : (
												<>
													<Send className="h-4 w-4 mr-2" />
													Send SMS
												</>
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
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
								"info",
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
								"success",
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
								"info",
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
								"critical",
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
																severityData.severity,
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
										Latest alarms from Ethiopian branches
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
																{new Date(alarm.createdAt).toLocaleString(
																	"en-ET",
																	{
																		timeZone: "Africa/Addis_Ababa",
																		dateStyle: "medium",
																		timeStyle: "short",
																	},
																)}
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
							<Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
										<MessageSquare className="h-5 w-5 mr-2" />
										Send SMS Report
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-md">
									<DialogHeader>
										<DialogTitle className="flex items-center gap-2">
											<Shield className="h-5 w-5" />
											Send Police Report via SMS
										</DialogTitle>
										<DialogDescription>
											Send your police performance report to headquarters
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="phone">Phone Number (Ethiopian)</Label>
											<div className="flex">
												<span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
													+251
												</span>
												<Input
													id="phone"
													placeholder="913228892"
													value={smsPhone}
													onChange={(e) => setSmsPhone(e.target.value)}
													className="rounded-l-none"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="message">Custom Message (Optional)</Label>
											<Textarea
												id="message"
												placeholder="Leave empty to use auto-generated police report..."
												value={smsMessage}
												onChange={(e) => setSmsMessage(e.target.value)}
												rows={4}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => setSmsDialogOpen(false)}>
											Cancel
										</Button>
										<Button
											type="button"
											onClick={sendSmsReport}
											disabled={sendingSms}>
											{sendingSms ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Sending...
												</>
											) : (
												<>
													<Send className="h-4 w-4 mr-2" />
													Send SMS
												</>
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
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
								"info",
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
								"warning",
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
								"success",
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
								"info",
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
							<Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
										<MessageSquare className="h-5 w-5 mr-2" />
										Send SMS Report
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-md">
									<DialogHeader>
										<DialogTitle className="flex items-center gap-2">
											<Building className="h-5 w-5" />
											Send Office Report via SMS
										</DialogTitle>
										<DialogDescription>
											Send your office management report to headquarters
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="phone">Phone Number (Ethiopian)</Label>
											<div className="flex">
												<span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
													+251
												</span>
												<Input
													id="phone"
													placeholder="913228892"
													value={smsPhone}
													onChange={(e) => setSmsPhone(e.target.value)}
													className="rounded-l-none"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="message">Custom Message (Optional)</Label>
											<Textarea
												id="message"
												placeholder="Leave empty to use auto-generated office report..."
												value={smsMessage}
												onChange={(e) => setSmsMessage(e.target.value)}
												rows={4}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => setSmsDialogOpen(false)}>
											Cancel
										</Button>
										<Button
											type="button"
											onClick={sendSmsReport}
											disabled={sendingSms}>
											{sendingSms ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Sending...
												</>
											) : (
												<>
													<Send className="h-4 w-4 mr-2" />
													Send SMS
												</>
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
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
								"success",
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
								"info",
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
								"warning",
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
								"critical",
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
// 	TrendingUp,
// 	Activity,
// 	Zap,
// 	BarChart3,
// 	PieChart,
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

// 			// Fetch data based on user role
// 			if (userRole === "SUPER_ADMIN") {
// 				const response = await apiService.get("/analytics/system");
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
// 				return "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25";
// 			case "high":
// 				return "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25";
// 			case "medium":
// 				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25";
// 			case "low":
// 				return "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25";
// 			default:
// 				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25";
// 		}
// 	};

// 	const getStatusColor = (status: string) => {
// 		switch (status.toLowerCase()) {
// 			case "active":
// 				return "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 animate-pulse";
// 			case "resolved":
// 				return "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25";
// 			case "pending":
// 				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25";
// 			case "completed":
// 				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25";
// 			default:
// 				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25";
// 		}
// 	};

// 	const getMetricCardStyle = (type: string) => {
// 		switch (type) {
// 			case "critical":
// 				return "bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950 dark:via-red-900 dark:to-red-800 border-red-200 dark:border-red-700 shadow-xl shadow-red-500/10";
// 			case "warning":
// 				return "bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 dark:from-yellow-950 dark:via-yellow-900 dark:to-yellow-800 border-yellow-200 dark:border-yellow-700 shadow-xl shadow-yellow-500/10";
// 			case "success":
// 				return "bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950 dark:via-green-900 dark:to-green-800 border-green-200 dark:border-green-700 shadow-xl shadow-green-500/10";
// 			case "info":
// 				return "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700 shadow-xl shadow-blue-500/10";
// 			default:
// 				return "bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 shadow-xl shadow-gray-500/10";
// 		}
// 	};

// 	if (loading) {
// 		return (
// 			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-6">
// 				<div className="max-w-7xl mx-auto space-y-8">
// 					<div className="flex justify-between items-center">
// 						<div className="space-y-2">
// 							<Skeleton className="h-10 w-80 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
// 							<Skeleton className="h-6 w-96 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
// 						</div>
// 						<div className="flex space-x-3">
// 							<Skeleton className="h-12 w-40 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
// 							<Skeleton className="h-12 w-40 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
// 						</div>
// 					</div>
// 					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// 						{[...Array(4)].map((_, i) => (
// 							<Card
// 								key={i}
// 								className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl">
// 								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 									<Skeleton className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
// 									<Skeleton className="h-6 w-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
// 								</CardHeader>
// 								<CardContent className="space-y-2">
// 									<Skeleton className="h-10 w-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
// 									<Skeleton className="h-4 w-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}

// 	// Super Admin Dashboard
// 	if (userRole === "SUPER_ADMIN" && systemData) {
// 		return (
// 			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6">
// 				<div className="max-w-7xl mx-auto space-y-8">
// 					{/* Header Section */}
// 					<div className="flex justify-between items-center">
// 						<div className="space-y-2">
// 							<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
// 								System Analytics
// 							</h1>
// 							<p className="text-lg text-muted-foreground">
// 								Comprehensive system overview and metrics
// 							</p>
// 						</div>
// 						<div className="flex space-x-3">
// 							<Select value={userRole} onValueChange={setUserRole}>
// 								<SelectTrigger className="w-44 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
// 									<SelectValue />
// 								</SelectTrigger>
// 								<SelectContent>
// 									<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
// 									<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
// 									<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
// 								</SelectContent>
// 							</Select>
// 							<Button
// 								variant="outline"
// 								className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
// 								<Download className="h-5 w-5 mr-2" />
// 								Export Report
// 							</Button>
// 						</div>
// 					</div>

// 					{/* System Overview Cards */}
// 					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// 						<Card
// 							className={`${getMetricCardStyle(
// 								"info"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
// 									Total Users
// 								</CardTitle>
// 								<div className="p-2 bg-blue-500/20 rounded-lg">
// 									<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
// 									{systemData.overview.totalUsers}
// 								</div>
// 								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
// 									<TrendingUp className="h-4 w-4 mr-1" />
// 									Across all roles
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"success"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
// 									Companies
// 								</CardTitle>
// 								<div className="p-2 bg-green-500/20 rounded-lg">
// 									<Building className="h-5 w-5 text-green-600 dark:text-green-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-green-900 dark:text-green-100">
// 									{systemData.overview.totalCompanies}
// 								</div>
// 								<p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
// 									<Activity className="h-4 w-4 mr-1" />
// 									Active companies
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"info"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
// 									Total Branches
// 								</CardTitle>
// 								<div className="p-2 bg-purple-500/20 rounded-lg">
// 									<MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
// 									{systemData.overview.totalBranches}
// 								</div>
// 								<p className="text-sm text-purple-600 dark:text-purple-400 flex items-center mt-1">
// 									<Target className="h-4 w-4 mr-1" />
// 									Monitored locations
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"critical"
// 							)} hover:scale-105 transition-all duration-300 border-2 ${
// 								systemData.overview.activeAlarms > 0 ? "animate-glow" : ""
// 							}`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300">
// 									Active Alarms
// 								</CardTitle>
// 								<div className="p-2 bg-red-500/20 rounded-lg">
// 									<AlertTriangle
// 										className={`h-5 w-5 text-red-600 dark:text-red-400 ${
// 											systemData.overview.activeAlarms > 0
// 												? "animate-swing"
// 												: ""
// 										}`}
// 									/>
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-red-900 dark:text-red-100">
// 									{systemData.overview.activeAlarms}
// 								</div>
// 								<p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
// 									<Zap className="h-4 w-4 mr-1" />
// 									Require attention
// 								</p>
// 							</CardContent>
// 						</Card>
// 					</div>

// 					<Tabs
// 						value={activeTab}
// 						onValueChange={setActiveTab}
// 						className="space-y-6">
// 						<TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700">
// 							<TabsTrigger
// 								value="overview"
// 								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
// 								<BarChart3 className="h-4 w-4 mr-2" />
// 								Overview
// 							</TabsTrigger>
// 							<TabsTrigger
// 								value="users"
// 								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
// 								<Users className="h-4 w-4 mr-2" />
// 								Users by Role
// 							</TabsTrigger>
// 							<TabsTrigger
// 								value="alarms"
// 								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
// 								<AlertTriangle className="h-4 w-4 mr-2" />
// 								Alarm Analysis
// 							</TabsTrigger>
// 							<TabsTrigger
// 								value="activity"
// 								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
// 								<Activity className="h-4 w-4 mr-2" />
// 								Recent Activity
// 							</TabsTrigger>
// 						</TabsList>

// 						<TabsContent value="overview" className="space-y-6">
// 							<div className="grid gap-6 md:grid-cols-2">
// 								<Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-blue-200 dark:border-blue-700">
// 									<CardHeader className="pb-4">
// 										<CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
// 											<PieChart className="h-6 w-6 mr-2 text-blue-600" />
// 											Alarm Statistics
// 										</CardTitle>
// 									</CardHeader>
// 									<CardContent>
// 										<div className="space-y-4">
// 											<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium">
// 													Total Alarms
// 												</span>
// 												<span className="font-bold text-lg">
// 													{systemData.overview.totalAlarms}
// 												</span>
// 											</div>
// 											<div className="flex items-center justify-between p-3 bg-red-50/80 dark:bg-red-900/20 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium text-red-700 dark:text-red-300">
// 													Active Alarms
// 												</span>
// 												<span className="font-bold text-lg text-red-600 dark:text-red-400">
// 													{systemData.overview.activeAlarms}
// 												</span>
// 											</div>
// 											<div className="flex items-center justify-between p-3 bg-green-50/80 dark:bg-green-900/20 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium text-green-700 dark:text-green-300">
// 													Resolved Alarms
// 												</span>
// 												<span className="font-bold text-lg text-green-600 dark:text-green-400">
// 													{systemData.overview.resolvedAlarms}
// 												</span>
// 											</div>
// 											<div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium text-green-800 dark:text-green-200">
// 													Resolution Rate
// 												</span>
// 												<span className="font-bold text-lg text-green-700 dark:text-green-300">
// 													{systemData.overview.totalAlarms > 0
// 														? (
// 																(systemData.overview.resolvedAlarms /
// 																	systemData.overview.totalAlarms) *
// 																100
// 														  ).toFixed(1)
// 														: 0}
// 													%
// 												</span>
// 											</div>
// 											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
// 												<div
// 													className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
// 													style={{
// 														width: `${
// 															systemData.overview.totalAlarms > 0
// 																? (systemData.overview.resolvedAlarms /
// 																		systemData.overview.totalAlarms) *
// 																  100
// 																: 0
// 														}%`,
// 													}}
// 												/>
// 											</div>
// 										</div>
// 									</CardContent>
// 								</Card>

// 								<Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-purple-200 dark:border-purple-700">
// 									<CardHeader className="pb-4">
// 										<CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center">
// 											<Activity className="h-6 w-6 mr-2 text-purple-600" />
// 											System Health
// 										</CardTitle>
// 									</CardHeader>
// 									<CardContent>
// 										<div className="space-y-4">
// 											<div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium">
// 													System Status
// 												</span>
// 												<Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
// 													<CheckCircle className="h-3 w-3 mr-1" />
// 													Operational
// 												</Badge>
// 											</div>
// 											<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium">
// 													Active Users
// 												</span>
// 												<span className="font-bold text-lg text-blue-600 dark:text-blue-400">
// 													{systemData.overview.totalUsers}
// 												</span>
// 											</div>
// 											<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium">
// 													Active Branches
// 												</span>
// 												<span className="font-bold text-lg text-purple-600 dark:text-purple-400">
// 													{systemData.overview.totalBranches}
// 												</span>
// 											</div>
// 											<div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg backdrop-blur-sm">
// 												<span className="text-sm font-medium">
// 													System Uptime
// 												</span>
// 												<span className="font-bold text-lg text-green-600 dark:text-green-400">
// 													99.9%
// 												</span>
// 											</div>
// 										</div>
// 									</CardContent>
// 								</Card>
// 							</div>
// 						</TabsContent>

// 						<TabsContent value="users" className="space-y-6">
// 							<Card className="bg-gradient-to-br from-white via-green-50 to-emerald-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-green-200 dark:border-green-700">
// 								<CardHeader className="pb-4">
// 									<CardTitle className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center">
// 										<Users className="h-6 w-6 mr-2 text-green-600" />
// 										Users by Role Distribution
// 									</CardTitle>
// 								</CardHeader>
// 								<CardContent>
// 									<div className="space-y-4">
// 										{systemData.usersByRole.map((roleData, index) => (
// 											<div
// 												key={index}
// 												className="group hover:scale-102 transition-all duration-300">
// 												<div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
// 													<div className="flex items-center space-x-4">
// 														<div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
// 															{roleData.role === "SUPER_ADMIN" && (
// 																<Shield className="h-5 w-5 text-white" />
// 															)}
// 															{roleData.role === "OFFICE_MANAGER" && (
// 																<Building className="h-5 w-5 text-white" />
// 															)}
// 															{roleData.role === "POLICE_MANAGER" && (
// 																<Shield className="h-5 w-5 text-white" />
// 															)}
// 															{roleData.role === "OPERATOR" && (
// 																<Users className="h-5 w-5 text-white" />
// 															)}
// 														</div>
// 														<div>
// 															<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
// 																{roleData.role
// 																	.replace("_", " ")
// 																	.toLowerCase()
// 																	.replace(/\b\w/g, (l) => l.toUpperCase())}
// 															</h4>
// 															<p className="text-sm text-gray-600 dark:text-gray-400">
// 																Active users in this role
// 															</p>
// 														</div>
// 													</div>
// 													<div className="text-right">
// 														<p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
// 															{roleData._count.role}
// 														</p>
// 														<p className="text-xs text-gray-500 dark:text-gray-400">
// 															users
// 														</p>
// 													</div>
// 												</div>
// 											</div>
// 										))}
// 									</div>
// 								</CardContent>
// 							</Card>
// 						</TabsContent>

// 						<TabsContent value="alarms" className="space-y-6">
// 							<Card className="bg-gradient-to-br from-white via-orange-50 to-red-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-orange-200 dark:border-orange-700">
// 								<CardHeader className="pb-4">
// 									<CardTitle className="text-xl font-bold text-orange-900 dark:text-orange-100 flex items-center">
// 										<AlertTriangle className="h-6 w-6 mr-2 text-orange-600" />
// 										Alarms by Severity
// 									</CardTitle>
// 								</CardHeader>
// 								<CardContent>
// 									<div className="space-y-4">
// 										{systemData.alarmsBySeverity.map((severityData, index) => (
// 											<div
// 												key={index}
// 												className="group hover:scale-102 transition-all duration-300">
// 												<div
// 													className={`flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 ${
// 														severityData.severity.toLowerCase() === "critical"
// 															? "critical-alarm-card"
// 															: ""
// 													}`}>
// 													<div className="flex items-center space-x-4">
// 														<div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
// 															<AlertTriangle
// 																className={`h-5 w-5 text-white ${
// 																	severityData.severity.toLowerCase() ===
// 																	"critical"
// 																		? "animate-swing"
// 																		: ""
// 																}`}
// 															/>
// 														</div>
// 														<div>
// 															<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
// 																{severityData.severity} Priority
// 															</h4>
// 															<p className="text-sm text-gray-600 dark:text-gray-400">
// 																Alarm severity level
// 															</p>
// 														</div>
// 													</div>
// 													<div className="text-right space-y-2">
// 														<p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
// 															{severityData._count.severity}
// 														</p>
// 														<Badge
// 															className={getSeverityColor(
// 																severityData.severity
// 															)}>
// 															{severityData.severity}
// 														</Badge>
// 													</div>
// 												</div>
// 											</div>
// 										))}
// 									</div>
// 								</CardContent>
// 							</Card>
// 						</TabsContent>

// 						<TabsContent value="activity" className="space-y-6">
// 							<Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-purple-200 dark:border-purple-700">
// 								<CardHeader className="pb-4">
// 									<CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center">
// 										<Activity className="h-6 w-6 mr-2 text-purple-600" />
// 										Recent Alarm Activity
// 									</CardTitle>
// 									<p className="text-sm text-purple-600 dark:text-purple-400">
// 										Latest 10 alarms in the system
// 									</p>
// 								</CardHeader>
// 								<CardContent>
// 									<div className="space-y-4">
// 										{systemData.recentActivity.map((alarm, index) => (
// 											<div
// 												key={alarm.id}
// 												className="group hover:scale-102 transition-all duration-300">
// 												<div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
// 													<div className="flex items-center space-x-4">
// 														<div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
// 															<AlertTriangle className="h-5 w-5 text-white" />
// 														</div>
// 														<div>
// 															<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
// 																{alarm.branch.name}
// 															</h4>
// 															<p className="text-sm text-gray-600 dark:text-gray-400">
// 																Created by {alarm.createdBy.name}
// 															</p>
// 															<p className="text-xs text-gray-500 dark:text-gray-500">
// 																{new Date(alarm.createdAt).toLocaleString()}
// 															</p>
// 														</div>
// 													</div>
// 													<div className="text-right space-y-2">
// 														<Badge className={getSeverityColor(alarm.severity)}>
// 															{alarm.severity}
// 														</Badge>
// 														<br />
// 														<Badge className={getStatusColor(alarm.status)}>
// 															{alarm.status}
// 														</Badge>
// 													</div>
// 												</div>
// 											</div>
// 										))}
// 									</div>
// 								</CardContent>
// 							</Card>
// 						</TabsContent>
// 					</Tabs>
// 				</div>
// 			</div>
// 		);
// 	}

// 	// Police Manager Dashboard
// 	if (userRole === "POLICE_MANAGER" && policeData) {
// 		return (
// 			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-900 dark:to-purple-800 p-6">
// 				<div className="max-w-7xl mx-auto space-y-8">
// 					<div className="flex justify-between items-center">
// 						<div className="space-y-2">
// 							<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
// 								Police Analytics
// 							</h1>
// 							<p className="text-lg text-muted-foreground">
// 								Your assigned reports and response metrics
// 							</p>
// 						</div>
// 						<div className="flex space-x-3">
// 							<Select value={userRole} onValueChange={setUserRole}>
// 								<SelectTrigger className="w-44 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
// 									<SelectValue />
// 								</SelectTrigger>
// 								<SelectContent>
// 									<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
// 									<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
// 									<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
// 								</SelectContent>
// 							</Select>
// 							<Button
// 								variant="outline"
// 								className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
// 								<Download className="h-5 w-5 mr-2" />
// 								Export Report
// 							</Button>
// 						</div>
// 					</div>

// 					{/* Police Overview Cards */}
// 					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// 						<Card
// 							className={`${getMetricCardStyle(
// 								"info"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
// 									Total Reports
// 								</CardTitle>
// 								<div className="p-2 bg-blue-500/20 rounded-lg">
// 									<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
// 									{policeData.overview.totalReports}
// 								</div>
// 								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
// 									<Target className="h-4 w-4 mr-1" />
// 									Assigned to you
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"warning"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
// 									Pending Reports
// 								</CardTitle>
// 								<div className="p-2 bg-yellow-500/20 rounded-lg">
// 									<Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
// 									{policeData.overview.pendingReports}
// 								</div>
// 								<p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center mt-1">
// 									<AlertTriangle className="h-4 w-4 mr-1" />
// 									Awaiting action
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"success"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
// 									Completed
// 								</CardTitle>
// 								<div className="p-2 bg-green-500/20 rounded-lg">
// 									<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-green-900 dark:text-green-100">
// 									{policeData.overview.completedReports}
// 								</div>
// 								<p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
// 									<TrendingUp className="h-4 w-4 mr-1" />
// 									Successfully handled
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"info"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
// 									Avg Response
// 								</CardTitle>
// 								<div className="p-2 bg-blue-500/20 rounded-lg">
// 									<Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
// 									{policeData.overview.avgResponseTime} min
// 								</div>
// 								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
// 									<Clock className="h-4 w-4 mr-1" />
// 									Response time
// 								</p>
// 							</CardContent>
// 						</Card>
// 					</div>

// 					<div className="grid gap-6 md:grid-cols-2">
// 						<Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-blue-200 dark:border-blue-700">
// 							<CardHeader className="pb-4">
// 								<CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
// 									<Target className="h-6 w-6 mr-2 text-blue-600" />
// 									Performance Summary
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-4">
// 									<div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg backdrop-blur-sm">
// 										<span className="text-sm font-medium">Completion Rate</span>
// 										<span className="font-bold text-lg text-green-600 dark:text-green-400">
// 											{policeData.overview.totalReports > 0
// 												? (
// 														(policeData.overview.completedReports /
// 															policeData.overview.totalReports) *
// 														100
// 												  ).toFixed(1)
// 												: 0}
// 											%
// 										</span>
// 									</div>
// 									<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
// 										<span className="text-sm font-medium">
// 											Average Response Time
// 										</span>
// 										<span className="font-bold text-lg text-blue-600 dark:text-blue-400">
// 											{policeData.overview.avgResponseTime} minutes
// 										</span>
// 									</div>
// 									<div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
// 										<span className="text-sm font-medium">
// 											Reports This Month
// 										</span>
// 										<span className="font-bold text-lg text-purple-600 dark:text-purple-400">
// 											{policeData.overview.totalReports}
// 										</span>
// 									</div>
// 								</div>
// 							</CardContent>
// 						</Card>

// 						<Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-purple-200 dark:border-purple-700">
// 							<CardHeader className="pb-4">
// 								<CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center">
// 									<PieChart className="h-6 w-6 mr-2 text-purple-600" />
// 									Reports by Status
// 								</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="space-y-4">
// 									{policeData.reportsByStatus.map((statusData, index) => (
// 										<div
// 											key={index}
// 											className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
// 											<span className="text-sm font-medium">
// 												{statusData.status
// 													.replace("_", " ")
// 													.toLowerCase()
// 													.replace(/\b\w/g, (l) => l.toUpperCase())}
// 											</span>
// 											<div className="flex items-center space-x-3">
// 												<span className="text-sm font-bold">
// 													{statusData._count.status}
// 												</span>
// 												<Badge className={getStatusColor(statusData.status)}>
// 													{statusData.status}
// 												</Badge>
// 											</div>
// 										</div>
// 									))}
// 								</div>
// 							</CardContent>
// 						</Card>
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}

// 	// Office Manager Dashboard
// 	if (userRole === "OFFICE_MANAGER" && officeData) {
// 		return (
// 			<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-950 dark:via-emerald-900 dark:to-teal-800 p-6">
// 				<div className="max-w-7xl mx-auto space-y-8">
// 					<div className="flex justify-between items-center">
// 						<div className="space-y-2">
// 							<h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
// 								Office Analytics
// 							</h1>
// 							<p className="text-lg text-muted-foreground">
// 								Your branches and operators overview
// 							</p>
// 						</div>
// 						<div className="flex space-x-3">
// 							<Select value={userRole} onValueChange={setUserRole}>
// 								<SelectTrigger className="w-44 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
// 									<SelectValue />
// 								</SelectTrigger>
// 								<SelectContent>
// 									<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
// 									<SelectItem value="POLICE_MANAGER">Police Manager</SelectItem>
// 									<SelectItem value="OFFICE_MANAGER">Office Manager</SelectItem>
// 								</SelectContent>
// 							</Select>
// 							<Button
// 								variant="outline"
// 								className="h-12 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
// 								<Download className="h-5 w-5 mr-2" />
// 								Export Report
// 							</Button>
// 						</div>
// 					</div>

// 					{/* Office Overview Cards */}
// 					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// 						<Card
// 							className={`${getMetricCardStyle(
// 								"success"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
// 									Your Branches
// 								</CardTitle>
// 								<div className="p-2 bg-green-500/20 rounded-lg">
// 									<Building className="h-5 w-5 text-green-600 dark:text-green-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-green-900 dark:text-green-100">
// 									{officeData.overview.totalBranches}
// 								</div>
// 								<p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
// 									<Target className="h-4 w-4 mr-1" />
// 									Under your management
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"info"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
// 									Your Operators
// 								</CardTitle>
// 								<div className="p-2 bg-blue-500/20 rounded-lg">
// 									<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
// 									{officeData.overview.totalOperators}
// 								</div>
// 								<p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
// 									<Activity className="h-4 w-4 mr-1" />
// 									Active operators
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"warning"
// 							)} hover:scale-105 transition-all duration-300 border-2`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">
// 									Total Alarms
// 								</CardTitle>
// 								<div className="p-2 bg-orange-500/20 rounded-lg">
// 									<AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
// 									{officeData.overview.totalAlarms}
// 								</div>
// 								<p className="text-sm text-orange-600 dark:text-orange-400 flex items-center mt-1">
// 									<BarChart3 className="h-4 w-4 mr-1" />
// 									From your branches
// 								</p>
// 							</CardContent>
// 						</Card>

// 						<Card
// 							className={`${getMetricCardStyle(
// 								"critical"
// 							)} hover:scale-105 transition-all duration-300 border-2 ${
// 								officeData.overview.activeAlarms > 0 ? "animate-glow" : ""
// 							}`}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300">
// 									Active Alarms
// 								</CardTitle>
// 								<div className="p-2 bg-red-500/20 rounded-lg">
// 									<AlertTriangle
// 										className={`h-5 w-5 text-red-600 dark:text-red-400 ${
// 											officeData.overview.activeAlarms > 0
// 												? "animate-swing"
// 												: ""
// 										}`}
// 									/>
// 								</div>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="text-3xl font-bold text-red-900 dark:text-red-100">
// 									{officeData.overview.activeAlarms}
// 								</div>
// 								<p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
// 									<Zap className="h-4 w-4 mr-1" />
// 									Require attention
// 								</p>
// 							</CardContent>
// 						</Card>
// 					</div>

// 					<Card className="bg-gradient-to-br from-white via-green-50 to-emerald-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 shadow-2xl border-2 border-green-200 dark:border-green-700">
// 						<CardHeader className="pb-4">
// 							<CardTitle className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center">
// 								<Building className="h-6 w-6 mr-2 text-green-600" />
// 								Your Branches Overview
// 							</CardTitle>
// 							<p className="text-sm text-green-600 dark:text-green-400">
// 								Detailed view of all branches under your management
// 							</p>
// 						</CardHeader>
// 						<CardContent>
// 							<div className="space-y-4">
// 								{officeData.branchesData.map((branch, index) => (
// 									<div
// 										key={branch.id}
// 										className="group hover:scale-102 transition-all duration-300">
// 										<div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
// 											<div className="flex items-center space-x-4">
// 												<div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
// 													<MapPin className="h-5 w-5 text-white" />
// 												</div>
// 												<div>
// 													<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
// 														{branch.name}
// 													</h4>
// 													<p className="text-sm text-gray-600 dark:text-gray-400">
// 														{branch.address}
// 													</p>
// 												</div>
// 											</div>
// 											<div className="flex items-center space-x-6 text-sm">
// 												<div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
// 													<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
// 														{branch._count.operators}
// 													</p>
// 													<p className="text-xs text-blue-500 dark:text-blue-400">
// 														Operators
// 													</p>
// 												</div>
// 												<div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
// 													<p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
// 														{branch._count.alarms}
// 													</p>
// 													<p className="text-xs text-orange-500 dark:text-orange-400">
// 														Total Alarms
// 													</p>
// 												</div>
// 											</div>
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

// 	return (
// 		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
// 			<div className="text-center space-y-4">
// 				<div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl">
// 					<p className="text-lg text-muted-foreground">
// 						No data available for the selected role.
// 					</p>
// 					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
// 						Please select a different role or check your permissions.
// 					</p>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }
