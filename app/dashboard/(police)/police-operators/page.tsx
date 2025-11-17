"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
	Users,
	Plus,
	Edit,
	Eye,
	UserCheck,
	Building,
	Mail,
	Search,
	UserX,
	Loader2,
	AlertTriangle,
	UserCog,
	Trash2,
	ShieldIcon,
	Activity,
	User,
	EyeOff,
	CheckCircle,
	Timer,
	BarChart3,
	TargetIcon,
	Clock,
	FileDown,
	Download,
} from "lucide-react";
import { apiService } from "@/lib/api-operator-service";
import { Switch } from "@/components/ui/switch";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	PieChart,
	Pie,
	Cell,
} from "recharts";

// Types based on Prisma schema
interface UserType {
	id: string;
	email: string;
	phone: string;
	name: string;
	role: "SUPER_ADMIN" | "OFFICE_MANAGER" | "POLICE_MANAGER" | "OPERATOR";
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
	operatorType?: "POLICE";
	companyId?: string;
	managedById?: string;
	createdAt: string;
	updatedAt: string;
	company?: {
		id: string;
		name: string;
	};
	managedBy?: {
		id: string;
		name: string;
	};
	_count?: {
		managedUsers: number;
		createdAlarms: number;
		createdReports: number;
	};
}

interface Company {
	id: string;
	name: string;
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

interface CreateOperatorData {
	name: string;
	email: string;
	password: string;
	operatorType: "POLICE";
	phone: string;
	// companyId: string;
	// managedById?: string;
}

interface UpdateOperatorData {
	name: string;
	email: string;
	operatorType: "POLICE";
	phone: string;
	// companyId: string;
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

interface Operator {
	id: string;
	name: string;
	email: string;
	phone: string;
	password?: string;
	status: "ACTIVE" | "INACTIVE";
	createdBy: string;
	managedById?: string;
	operatorType?: string;
	companyId: string;
	role: "OPERATOR";
	createdAt: string;
	lastActive?: string;
}

interface ActivityLogEntry {
	id: string;
	action: string;
	actionType:
		| "LOGIN"
		| "ALARM_CREATED"
		| "ALARM_ACKNOWLEDGED"
		| "ALARM_RESOLVED"
		| "STATUS_UPDATE"
		| "REPORT_SUBMITTED";
	timestamp: string;
	details: string;
	alarmId?: string;
	branchId?: string;
	metadata?: Record<string, any>;
}

interface OperatorMetrics {
	totalAlarms: number;
	alarmsCreated: number;
	alarmsAcknowledged: number;
	alarmsResolved: number;
	avgResponseTime: number;
	avgResolutionTime: number;
	totalLogins: number;
	activeHours: number;
	performanceScore: number;
	lastLogin: string;
	branchesAssigned: number;
	reportsSubmitted: number;
}

interface OperatorDetails extends Operator {
	branches?: {
		id: string;
		name: string;
		location: string;
		city: string;
	}[];
	alarms?: {
		id: string;
		type: string;
		status: string;
		severity: string;
		timestamp: string;
		branchName: string;
	}[];
	activityLog?: ActivityLogEntry[];
	metrics?: OperatorMetrics;
}

export default function OperatorsManagementPage() {
	const router = useRouter();
	const [operators, setOperators] = useState<UserType[]>([]);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [managers, setManagers] = useState<UserType[]>([]);
	const [filteredOperators, setFilteredOperators] = useState<UserType[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [companyFilter, setCompanyFilter] = useState<string>("all");
	const [activityLogFilter, setActivityLogFilter] = useState<string>("all");
	// Dialog states
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState<UserType | null>(
		null
	);
	const [isExporting, setIsExporting] = useState<"csv" | "pdf" | null>(null);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	// Form data
	const [createForm, setCreateForm] = useState<CreateOperatorData>({
		name: "",
		email: "",
		password: "",
		phone: "",
		operatorType: "POLICE",
	});

	const [editForm, setEditForm] = useState<UpdateOperatorData>({
		name: "",
		email: "",
		phone: "",
		operatorType: "POLICE",
		status: "ACTIVE",
	});

	// Extra states for reset password
	const [resetPassword, setResetPassword] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [selectedOperatorDetails, setSelectedOperatorDetails] =
		useState<OperatorDetails | null>(null);
	const { toast } = useToast();
	const [dateRangeFilter, setDateRangeFilter] = useState<string>("30");
	const [exportFilters, setExportFilters] = useState<any>({
		dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0],
		dateTo: new Date().toISOString().split("T")[0],
		activityType: "all",
		includeMetrics: true,
		includeActivityLog: true,
		includeAlarmHistory: true,
	});

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		filterOperators();
	}, [operators, searchTerm, statusFilter, typeFilter, companyFilter]);

	// Filter activity log based on filters
	const filteredActivityLog = useMemo(() => {
		if (!selectedOperatorDetails?.activityLog) return [];

		let filtered = selectedOperatorDetails.activityLog;

		// Filter by activity type
		if (activityLogFilter !== "all") {
			filtered = filtered.filter(
				(activity) => activity.actionType === activityLogFilter
			);
		}

		// Filter by date range
		const daysBack = Number.parseInt(dateRangeFilter);
		if (daysBack > 0) {
			const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
			filtered = filtered.filter(
				(activity) => new Date(activity.timestamp) >= cutoffDate
			);
		}

		return filtered.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);
	}, [
		selectedOperatorDetails?.activityLog,
		activityLogFilter,
		dateRangeFilter,
	]);

	// Activity chart data
	const activityChartData = useMemo(() => {
		if (!filteredActivityLog.length) return [];

		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (6 - i));
			return date.toISOString().split("T")[0];
		});

		return last7Days.map((date) => {
			const dayActivities = filteredActivityLog.filter(
				(activity) => activity.timestamp.split("T")[0] === date
			);
			return {
				date: new Date(date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
				activities: dayActivities.length,
				logins: dayActivities.filter((a) => a.actionType === "LOGIN").length,
				alarms: dayActivities.filter((a) => a.actionType.includes("ALARM"))
					.length,
			};
		});
	}, [filteredActivityLog]);

	// Performance metrics chart data
	const performanceChartData = useMemo(() => {
		if (!selectedOperatorDetails?.metrics) return [];

		return [
			{
				name: "Alarms Created",
				value: selectedOperatorDetails.metrics.alarmsCreated,
				color: "#3b82f6",
			},
			{
				name: "Acknowledged",
				value: selectedOperatorDetails.metrics.alarmsAcknowledged,
				color: "#f59e0b",
			},
			{
				name: "Resolved",
				value: selectedOperatorDetails.metrics.alarmsResolved,
				color: "#10b981",
			},
		];
	}, [selectedOperatorDetails?.metrics]);

	const fetchData = async () => {
		try {
			setLoading(true);

			// Use real API calls instead of mock data
			const [operatorsRes, companiesRes, managersRes] = await Promise.all([
				apiService.operators.getAll(),
				apiService.companies.getAll({ status: "ACTIVE" }),
				apiService.managers.getAll(),
			]);

			console.log({
				operatorsRes,
				companiesRes,
			});

			setOperators(operatorsRes.users || operatorsRes);
			setCompanies(companiesRes.companies || companiesRes);
			setManagers(managersRes.users || managersRes);
		} catch (error) {
			console.error("Failed to fetch data:", error);
			toast({
				title: "Error",
				description: "Failed to load operators data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const filterOperators = () => {
		let filtered = operators;
		console.log({
			filtered,
		});

		// Search filter
		if (searchTerm) {
			filtered = filtered.filter(
				(op) =>
					op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					op.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
					op.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Status filter
		if (statusFilter !== "all") {
			filtered = filtered.filter(
				(op) => op.status === statusFilter.toUpperCase()
			);
		}

		// Type filter
		if (typeFilter !== "all") {
			filtered = filtered.filter(
				(op) => op.operatorType === typeFilter.toUpperCase()
			);
		}

		// Company filter
		if (companyFilter !== "all") {
			filtered = filtered.filter((op) => op.companyId === companyFilter);
		}

		setFilteredOperators(filtered);
	};

	const handleCreateOperator = async () => {
		if (!validateForm(createForm)) return;

		setIsSubmitting(true);
		try {
			console.log("Creating operator with data:", createForm);
			const response = await apiService.operators.create(createForm as any);
			console.log({ response });
			setOperators([(response as any).user, ...operators]);
			setCreateForm({
				name: "",
				email: "",
				password: "",
				phone: "",
				operatorType: "POLICE",
				// companyId: "",
				// managedById: "",
			});
			setIsCreateDialogOpen(false);
			toast({
				title: "Success",
				description: "Operator created successfully",
			});

			// Redirect to alarms list or dashboard
			setTimeout(() => {
				router.push("/dashboard/police-operators");
			}, 2000);
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to create operator",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateOperator = async () => {
		if (!selectedOperator || !validateForm(editForm, false)) return;

		setIsSubmitting(true);

		const payload: any = {
			...editForm,
			...(resetPassword && newPassword ? { password: newPassword } : {}),
		};

		try {
			const response = await apiService.operators.update(
				selectedOperator.id,
				payload as any
			);
			setOperators(
				operators.map((op) => (op.id === selectedOperator.id ? response : op))
			);
			setIsEditDialogOpen(false);
			toast({
				title: "Success",
				description: "Operator updated successfully",
			});
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to update operator",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteOperator = async (operatorId: string) => {
		try {
			await apiService.operators.delete(operatorId);
			setOperators(operators.filter((op) => op.id !== operatorId));
			toast({
				title: "Success",
				description: "Operator deleted successfully",
			});
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to delete operator",
				variant: "destructive",
			});
		}
	};

	const handleStatusToggle = async (
		operatorId: string,
		newStatus: "ACTIVE" | "INACTIVE"
	) => {
		try {
			const response = await apiService.operators.updateStatus(
				operatorId,
				newStatus
			);
			setOperators(
				operators.map((op) =>
					op.id === operatorId ? { ...op, status: newStatus } : op
				)
			);
			toast({
				title: "Success",
				description: `Operator ${newStatus.toLowerCase()} successfully`,
			});
		} catch (error: unknown | any) {
			toast({
				title: "Error",
				description: error.message || "Failed to update operator status",
				variant: "destructive",
			});
		}
	};

	const validateForm = (data: any, isCreate = true) => {
		if (!data.name || !data.email || !data.operatorType || !data.phone) {
			toast({
				title: "Validation Error",
				description: "Please fill in all required fields",
				variant: "destructive",
			});
			return false;
		}

		if (isCreate && !data.password) {
			toast({
				title: "Validation Error",
				description: "Password is required",
				variant: "destructive",
			});
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			toast({
				title: "Validation Error",
				description: "Please enter a valid email address",
				variant: "destructive",
			});
			return false;
		}

		return true;
	};

	const openEditDialog = (operator: UserType) => {
		setSelectedOperator(operator);

		setEditForm({
			name: operator.name,
			email: operator.email,
			phone: operator.phone || "",
			operatorType: operator.operatorType || "POLICE",
			// companyId: operator.companyId || "",
			status: operator.status,
		});
		setIsEditDialogOpen(true);
	};

	function getAuthToken(): string {
		if (typeof window !== "undefined") {
			return localStorage.getItem("authToken") || "";
		}
		return "";
	}

	const fetchOperatorDetails = async (operatorId: string) => {
		try {
			const token = getAuthToken();

			// Prepare query params for activity
			const dateFrom = new Date(
				Date.now() - 30 * 24 * 60 * 60 * 1000
			).toISOString();
			const dateTo = new Date().toISOString();
			const activityUrl = `/api/users/operators/${operatorId}/activity?dateFrom=${encodeURIComponent(
				dateFrom
			)}&dateTo=${encodeURIComponent(dateTo)}&limit=50`;

			// Run requests in parallel
			const [detailsRes, metricsRes, activityRes] = await Promise.all([
				fetch(`/api/users/operators/${operatorId}`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`/api/users/operators/${operatorId}/metrics`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(activityUrl, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);

			// Parse JSON
			const [detailsData, metricsData, activityData] = await Promise.all([
				detailsRes.json(),
				metricsRes.json(),
				activityRes.json(),
			]);

			// Normalize response
			const operatorDetails: OperatorDetails = {
				...detailsData,
				metrics: metricsData,
				activityLog: activityData.activities ?? [],
			};

			setSelectedOperatorDetails(operatorDetails);
		} catch (error: any) {
			console.error("❌ Failed to fetch operator details:", error);

			toast({
				title: "Error",
				description: error?.message || "Failed to load operator details",
				variant: "destructive",
			});
		}
	};

	const exportOperatorReport = async (format: "csv" | "pdf") => {
		if (!selectedOperator) return;

		try {
			setIsExporting(format);

			const exportData = {
				operatorId: selectedOperator.id,
				filters: exportFilters,
				format,
			};

			if (format === "csv") {
				// await apiService.downloadFile(
				// 	`/operators/${selectedOperator.id}/export/csv?${new URLSearchParams(
				// 		exportFilters as any
				// 	).toString()}`,
				// 	`operator-report-${selectedOperator.name.replace(/\s+/g, "-")}-${
				// 		new Date().toISOString().split("T")[0]
				// 	}.csv`
				// );
			} else {
				const response = await fetch(
					`/api/users/operators/${selectedOperator.id}/export/pdf`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${localStorage.getItem("authToken")}`,
						},
						body: JSON.stringify(exportData),
					}
				);

				if (!response.ok) throw new Error("Export failed");

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `operator-report-${selectedOperator.name.replace(
					/\s+/g,
					"-"
				)}-${new Date().toISOString().split("T")[0]}.pdf`;
				document.body.appendChild(link);
				link.click();
				link.remove();
				window.URL.revokeObjectURL(url);
			}

			toast({
				title: "Success",
				description: `${format.toUpperCase()} report exported successfully`,
			});

			setIsExportDialogOpen(false);
		} catch (error) {
			console.error(`${format.toUpperCase()} export failed:`, error);
			toast({
				title: "Error",
				description: `Failed to export ${format.toUpperCase()} report`,
				variant: "destructive",
			});
		} finally {
			setIsExporting(null);
		}
	};

	const openViewDialog = (operator: UserType) => {
		setSelectedOperator(operator);
		setIsViewDialogOpen(true);
		fetchOperatorDetails(operator.id as any);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
			case "INACTIVE":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
			case "SUSPENDED":
				return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "OFFICE":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
			case "POLICE":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex justify-between items-center">
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid gap-4 md:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-16 mb-2" />
								<Skeleton className="h-3 w-20" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const activeOperators = filteredOperators.filter(
		(op) => op.status === "ACTIVE"
	);
	const inactiveOperators = filteredOperators.filter(
		(op) => op.status === "INACTIVE"
	);
	const suspendedOperators = filteredOperators.filter(
		(op) => op.status === "SUSPENDED"
	);
	// const officeOperators = filteredOperators.filter(
	// 	(op) => op.operatorType === "POLICE"
	// );
	const policeOperators = filteredOperators.filter(
		(op) => op.operatorType === "POLICE"
	);

	const getPerformanceRating = (score: number) => {
		if (score >= 90)
			return {
				label: "Excellent",
				color: "text-green-600",
				bgColor: "bg-green-100",
			};
		if (score >= 80)
			return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
		if (score >= 70)
			return {
				label: "Average",
				color: "text-yellow-600",
				bgColor: "bg-yellow-100",
			};
		if (score >= 60)
			return {
				label: "Below Average",
				color: "text-orange-600",
				bgColor: "bg-orange-100",
			};
		return { label: "Poor", color: "text-red-600", bgColor: "bg-red-100" };
	};

	const getActivityIcon = (actionType: string) => {
		switch (actionType) {
			case "LOGIN":
				return <User className="h-4 w-4 text-blue-500" />;
			case "ALARM_CREATED":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "ALARM_ACKNOWLEDGED":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "ALARM_RESOLVED":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "STATUS_UPDATE":
				return <Activity className="h-4 w-4 text-purple-500" />;
			case "REPORT_SUBMITTED":
				return <FileDown className="h-4 w-4 text-indigo-500" />;
			default:
				return <Activity className="h-4 w-4 text-gray-500" />;
		}
	};

	const formatDateTime = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			return dateString;
		}
	};

	return (
		<div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 min-h-screen">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
						Police Operators Management
					</h1>
					<p className="text-muted-foreground">
						Manage security operators across all companies
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
							<Plus className="h-4 w-4 mr-2" />
							Create Operator
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Operator</DialogTitle>
							<DialogDescription>
								Add a new security operator to the system
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name *</Label>
									<Input
										id="name"
										value={createForm.name}
										onChange={(e) =>
											setCreateForm({ ...createForm, name: e.target.value })
										}
										placeholder="Enter full name"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email Address *</Label>
									<Input
										id="email"
										type="email"
										value={createForm.email}
										onChange={(e) =>
											setCreateForm({ ...createForm, email: e.target.value })
										}
										placeholder="operator@company.com"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number *</Label>
									<Input
										id="phone"
										value={createForm.phone}
										onChange={(e) =>
											setCreateForm({ ...createForm, phone: e.target.value })
										}
										placeholder="+251911123456"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">Password *</Label>
									<Input
										id="password"
										type="password"
										value={createForm.password}
										onChange={(e) =>
											setCreateForm({ ...createForm, password: e.target.value })
										}
										placeholder="Minimum 8 characters"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="operatorType">Operator Type *</Label>
									<Select
										value={createForm.operatorType}
										onValueChange={(value: "POLICE") =>
											setCreateForm({ ...createForm, operatorType: value })
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{/* <SelectItem value="OFFICE">Office Operator</SelectItem> */}
											<SelectItem value="POLICE">Police Operator</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* <div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="company">Company *</Label>
									<Select
										value={createForm.companyId}
										onValueChange={(value) =>
											setCreateForm({ ...createForm, companyId: value })
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select company" />
										</SelectTrigger>
										<SelectContent>
											{companies
												.filter((c) => c.status === "ACTIVE")
												.map((company) => (
													<SelectItem key={company.id} value={company.id}>
														{company.name}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="manager">Manager (Optional)</Label>
									<Select
										value={createForm.managedById}
										onValueChange={(value) =>
											setCreateForm({ ...createForm, managedById: value })
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select manager" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No Manager</SelectItem>
											{managers
												.filter((m) => m.status === "ACTIVE")
												.map((manager) => (
													<SelectItem key={manager.id} value={manager.id}>
														{manager.name} ({manager.role.replace("_", " ")})
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</div> */}
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleCreateOperator} disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create Operator"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search operators by name, email, or company..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
					/>
				</div>
				<div className="flex gap-2">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-32 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="suspended">Suspended</SelectItem>
						</SelectContent>
					</Select>

					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger className="w-32 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="office">Office</SelectItem>
							<SelectItem value="police">Police</SelectItem>
						</SelectContent>
					</Select>

					<Select value={companyFilter} onValueChange={setCompanyFilter}>
						<SelectTrigger className="w-48 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Companies</SelectItem>
							{companies.map((company) => (
								<SelectItem key={company.id} value={company.id}>
									{company.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Operators List */}
			<Tabs defaultValue="all" className="space-y-4">
				<TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
					<TabsTrigger value="all">
						All Operators ({filteredOperators.length})
					</TabsTrigger>
					<TabsTrigger value="active">
						Active ({activeOperators.length})
					</TabsTrigger>
					<TabsTrigger value="inactive">
						Inactive ({inactiveOperators.length})
					</TabsTrigger>
					<TabsTrigger value="suspended">
						Suspended ({suspendedOperators.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					{filteredOperators.length === 0 ? (
						<Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Users className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">No operators found</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm
										? "Try adjusting your search criteria"
										: "Create your first operator to get started"}
								</p>
								<Button onClick={() => setIsCreateDialogOpen(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Create Operator
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{filteredOperators.map((operator) => (
								<Card
									key={operator.id}
									className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div
													className={`p-3 rounded-lg ${
														operator.status === "ACTIVE"
															? "bg-green-100 dark:bg-green-900/20"
															: operator.status === "SUSPENDED"
															? "bg-red-100 dark:bg-red-900/20"
															: "bg-gray-100 dark:bg-gray-800"
													}`}>
													{operator.operatorType === "POLICE" ? (
														<ShieldIcon
															className={`h-5 w-5 ${
																operator.status === "ACTIVE"
																	? "text-green-600 dark:text-green-400"
																	: operator.status === "SUSPENDED"
																	? "text-red-600 dark:text-red-400"
																	: "text-gray-600 dark:text-gray-400"
															}`}
														/>
													) : (
														<Building
															className={`h-5 w-5 ${
																operator.status === "ACTIVE"
																	? "text-green-600 dark:text-green-400"
																	: operator.status === "SUSPENDED"
																	? "text-red-600 dark:text-red-400"
																	: "text-gray-600 dark:text-gray-400"
															}`}
														/>
													)}
												</div>
												<div>
													<h4 className="font-semibold text-lg">
														{operator.name}
													</h4>
													<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
														<span className="flex items-center">
															<Mail className="h-3 w-3 mr-1" />
															{operator.email}
														</span>
														<span className="flex items-center">
															<Building className="h-3 w-3 mr-1" />
															{operator.company?.name}
														</span>
													</div>
													<div className="flex flex-wrap items-center gap-2 mt-2">
														<Badge className={getStatusColor(operator.status)}>
															{operator.status}
														</Badge>
														<Badge
															className={getTypeColor(
																operator.operatorType || ""
															)}>
															{operator.operatorType} Operator
														</Badge>
														{operator.managedBy && (
															<Badge variant="outline" className="text-xs">
																Managed by {operator.managedBy.name}
															</Badge>
														)}
													</div>
												</div>
											</div>

											<div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
												<div className="text-right hidden sm:block">
													<div className="flex space-x-4 text-sm"></div>
												</div>

												<div className="flex space-x-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openViewDialog(operator)}
														className="hover:bg-primary/10">
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => openEditDialog(operator)}
														className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															handleStatusToggle(
																operator.id,
																operator.status === "ACTIVE"
																	? "INACTIVE"
																	: "ACTIVE"
															)
														}
														className={
															operator.status === "ACTIVE"
																? "hover:bg-red-50 dark:hover:bg-red-950/20"
																: "hover:bg-green-50 dark:hover:bg-green-950/20"
														}>
														{operator.status === "ACTIVE" ? (
															<UserX className="h-4 w-4" />
														) : (
															<UserCheck className="h-4 w-4" />
														)}
													</Button>
													{/* <AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant="outline"
																size="sm"
																className="hover:bg-red-50 dark:hover:bg-red-950/20">
																<Trash2 className="h-4 w-4" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Delete Operator
																</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure you want to delete "
																	{operator.name}"? This action cannot be
																	undone.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() =>
																		handleDeleteOperator(operator.id)
																	}
																	className="bg-red-600 hover:bg-red-700">
																	Delete
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog> */}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="active" className="space-y-4">
					<div className="space-y-4">
						{activeOperators.map((operator) => (
							<Card
								key={operator.id}
								className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
												{operator.operatorType === "POLICE" ? (
													<ShieldIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
												) : (
													<Building className="h-5 w-5 text-green-600 dark:text-green-400" />
												)}
											</div>
											<div>
												<h4 className="font-semibold text-lg">
													{operator.name}
												</h4>
												<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
													<span className="flex items-center">
														<Mail className="h-3 w-3 mr-1" />
														{operator.email}
													</span>
													<span className="flex items-center">
														<Building className="h-3 w-3 mr-1" />
														{operator.company?.name}
													</span>
												</div>
												<div className="flex flex-wrap items-center gap-2 mt-2">
													<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
														ACTIVE
													</Badge>
													<Badge
														className={getTypeColor(
															operator.operatorType || ""
														)}>
														{operator.operatorType} Operator
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex space-x-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openViewDialog(operator)}>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => openEditDialog(operator)}>
												<Edit className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="inactive" className="space-y-4">
					<div className="space-y-4">
						{inactiveOperators.map((operator) => (
							<Card
								key={operator.id}
								className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-400 opacity-75">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
												{operator.operatorType === "POLICE" ? (
													<ShieldIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
												) : (
													<Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
												)}
											</div>
											<div>
												<h4 className="font-semibold text-lg">
													{operator.name}
												</h4>
												<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
													<span className="flex items-center">
														<Mail className="h-3 w-3 mr-1" />
														{operator.email}
													</span>
													<span className="flex items-center">
														<Building className="h-3 w-3 mr-1" />
														{operator.company?.name}
													</span>
												</div>
												<div className="flex flex-wrap items-center gap-2 mt-2">
													<Badge variant="secondary">INACTIVE</Badge>
													<Badge
														className={getTypeColor(
															operator.operatorType || ""
														)}>
														{operator.operatorType} Operator
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex space-x-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openViewDialog(operator)}>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleStatusToggle(operator.id, "ACTIVE")
												}
												className="hover:bg-green-50 dark:hover:bg-green-950/20">
												Activate
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="suspended" className="space-y-4">
					<div className="space-y-4">
						{suspendedOperators.map((operator) => (
							<Card
								key={operator.id}
								className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
												<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
											</div>
											<div>
												<h4 className="font-semibold text-lg">
													{operator.name}
												</h4>
												<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
													<span className="flex items-center">
														<Mail className="h-3 w-3 mr-1" />
														{operator.email}
													</span>
													<span className="flex items-center">
														<Building className="h-3 w-3 mr-1" />
														{operator.company?.name}
													</span>
												</div>
												<div className="flex flex-wrap items-center gap-2 mt-2">
													<Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
														SUSPENDED
													</Badge>
													<Badge
														className={getTypeColor(
															operator.operatorType || ""
														)}>
														{operator.operatorType} Operator
													</Badge>
												</div>
											</div>
										</div>
										<div className="flex space-x-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openViewDialog(operator)}>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleStatusToggle(operator.id, "ACTIVE")
												}
												className="hover:bg-green-50 dark:hover:bg-green-950/20">
												Reactivate
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* View Operator Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Operator Details
						</DialogTitle>
						<DialogDescription>
							Comprehensive information about the operator
						</DialogDescription>
					</DialogHeader>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSelectedOperator(selectedOperator);
								setIsExportDialogOpen(true);
							}}
							className="hover:bg-green-50">
							<Download className="h-4 w-4 mr-2" />
							Export Report
						</Button>
					</div>

					{selectedOperatorDetails ? (
						<div className="space-y-6 py-4">
							{/* Operator Header */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div
										className={`p-3 rounded-full ${
											selectedOperatorDetails.status === "ACTIVE"
												? "bg-green-100 dark:bg-green-900/20"
												: "bg-gray-100 dark:bg-gray-800"
										}`}>
										{selectedOperatorDetails.status === "ACTIVE" ? (
											<UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
										) : (
											<UserX className="h-6 w-6 text-gray-600 dark:text-gray-400" />
										)}
									</div>
									<div>
										<h2 className="text-2xl font-bold">
											{selectedOperatorDetails.name}
										</h2>
										<p className="text-muted-foreground">
											{selectedOperatorDetails.email}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Badge
										className={
											selectedOperatorDetails.status === "ACTIVE"
												? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
												: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
										}>
										{selectedOperatorDetails.status}
									</Badge>
									{selectedOperatorDetails.metrics && (
										<Badge
											className={`${
												getPerformanceRating(
													selectedOperatorDetails.metrics.performanceScore
												).bgColor
											} ${
												getPerformanceRating(
													selectedOperatorDetails.metrics.performanceScore
												).color
											}`}>
											{
												getPerformanceRating(
													selectedOperatorDetails.metrics.performanceScore
												).label
											}
										</Badge>
									)}
								</div>
							</div>

							{/* Performance Metrics */}
							{selectedOperatorDetails.metrics && (
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium flex items-center gap-2">
												<AlertTriangle className="h-4 w-4 text-red-500" />
												Total Alarms
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold text-red-600">
												{selectedOperatorDetails.metrics.totalAlarms}
											</div>
											<p className="text-xs text-muted-foreground">
												{selectedOperatorDetails.metrics.alarmsCreated} created
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium flex items-center gap-2">
												<CheckCircle className="h-4 w-4 text-green-500" />
												Resolved
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold text-green-600">
												{selectedOperatorDetails.metrics.alarmsResolved}
											</div>
											<p className="text-xs text-muted-foreground">
												{selectedOperatorDetails.metrics.totalAlarms > 0
													? Math.round(
															(selectedOperatorDetails.metrics.alarmsResolved /
																selectedOperatorDetails.metrics.totalAlarms) *
																100
													  )
													: 0}
												% resolution rate
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium flex items-center gap-2">
												<Timer className="h-4 w-4 text-blue-500" />
												Response Time
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold text-blue-600">
												{Math.round(
													selectedOperatorDetails.metrics.avgResponseTime
												)}
												m
											</div>
											<p className="text-xs text-muted-foreground">
												Average response
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium flex items-center gap-2">
												<Activity className="h-4 w-4 text-purple-500" />
												Active Hours
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold text-purple-600">
												{Math.round(
													selectedOperatorDetails.metrics.activeHours
												)}
												h
											</div>
											<p className="text-xs text-muted-foreground">
												This month
											</p>
										</CardContent>
									</Card>
								</div>
							)}

							{/* Charts Section */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Activity Chart */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<BarChart3 className="h-4 w-4 text-blue-500" />
											Daily Activity (Last 7 Days)
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="h-64">
											<ResponsiveContainer width="100%" height="100%">
												<BarChart data={activityChartData}>
													<CartesianGrid
														strokeDasharray="3 3"
														stroke="#374151"
													/>
													<XAxis
														dataKey="date"
														stroke="#9ca3af"
														fontSize={12}
													/>
													<YAxis stroke="#9ca3af" fontSize={12} />
													<Tooltip
														contentStyle={{
															backgroundColor: "#1e293b",
															border: "1px solid #475569",
															borderRadius: "8px",
															color: "#fff",
														}}
													/>
													<Bar
														dataKey="activities"
														fill="#3b82f6"
														radius={[4, 4, 0, 0]}
													/>
												</BarChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>

								{/* Performance Distribution */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<TargetIcon className="h-4 w-4 text-green-500" />
											Alarm Actions Distribution
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="h-64">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={performanceChartData}
														cx="50%"
														cy="50%"
														innerRadius={60}
														outerRadius={100}
														paddingAngle={5}
														dataKey="value">
														{performanceChartData.map((entry, index) => (
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
											{performanceChartData.map((item, index) => (
												<div
													key={index}
													className="flex items-center space-x-2">
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
							</div>

							{/* Activity Log Section */}
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<Activity className="h-4 w-4 text-purple-500" />
											Activity Log
										</CardTitle>
										<div className="flex items-center gap-2">
											<Select
												value={activityLogFilter}
												onValueChange={setActivityLogFilter}>
												<SelectTrigger className="w-40">
													<SelectValue placeholder="Filter by type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">All Activities</SelectItem>
													<SelectItem value="LOGIN">Logins</SelectItem>
													<SelectItem value="ALARM_CREATED">
														Alarms Created
													</SelectItem>
													<SelectItem value="ALARM_ACKNOWLEDGED">
														Acknowledged
													</SelectItem>
													<SelectItem value="ALARM_RESOLVED">
														Resolved
													</SelectItem>
													<SelectItem value="REPORT_SUBMITTED">
														Reports
													</SelectItem>
												</SelectContent>
											</Select>
											<Select
												value={dateRangeFilter}
												onValueChange={setDateRangeFilter}>
												<SelectTrigger className="w-32">
													<SelectValue placeholder="Date range" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="7">Last 7 days</SelectItem>
													<SelectItem value="30">Last 30 days</SelectItem>
													<SelectItem value="90">Last 90 days</SelectItem>
													<SelectItem value="0">All time</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4 max-h-96 overflow-y-auto">
										{filteredActivityLog.length === 0 ? (
											<div className="text-center py-8">
												<Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
												<p className="text-muted-foreground">
													No activity found for the selected filters
												</p>
											</div>
										) : (
											filteredActivityLog.map((activity) => (
												<div
													key={activity.id}
													className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
													<div className="mt-1">
														{getActivityIcon(activity.actionType)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between">
															<p className="font-medium text-sm">
																{activity.action}
															</p>
															<span className="text-xs text-muted-foreground">
																{formatDateTime(activity.timestamp)}
															</span>
														</div>
														<p className="text-sm text-muted-foreground mt-1">
															{activity.details}
														</p>
														{activity.metadata && (
															<div className="flex flex-wrap gap-1 mt-2">
																{Object.entries(activity.metadata).map(
																	([key, value]) => (
																		<Badge
																			key={key}
																			variant="outline"
																			className="text-xs">
																			{key}: {String(value)}
																		</Badge>
																	)
																)}
															</div>
														)}
													</div>
												</div>
											))
										)}
									</div>
								</CardContent>
							</Card>

							{/* Basic Info Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										<UserCog className="h-4 w-4 text-primary" />
										Operator Information
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-sm text-muted-foreground">
												Phone
											</Label>
											<p>{selectedOperatorDetails.phone}</p>
										</div>
										<div>
											<Label className="text-sm text-muted-foreground">
												Role
											</Label>
											<p>{selectedOperatorDetails.role}</p>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-sm text-muted-foreground">
												Operator Type
											</Label>
											<p>
												{selectedOperatorDetails.operatorType ||
													"Not specified"}
											</p>
										</div>
										<div>
											<Label className="text-sm text-muted-foreground">
												Created
											</Label>
											<p>{formatDate(selectedOperatorDetails.createdAt)}</p>
										</div>
									</div>

									{selectedOperatorDetails.lastActive && (
										<div>
											<Label className="text-sm text-muted-foreground">
												Last Active
											</Label>
											<p>
												{formatDateTime(selectedOperatorDetails.lastActive)}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Edit Operator Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Operator</DialogTitle>
						<DialogDescription>
							Update operator information and settings
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Full Name *</Label>
								<Input
									id="edit-name"
									value={editForm.name}
									onChange={(e) =>
										setEditForm({ ...editForm, name: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-email">Email Address *</Label>
								<Input
									id="edit-email"
									type="email"
									value={editForm.email}
									onChange={(e) =>
										setEditForm({ ...editForm, email: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-operatorType">Operator Type *</Label>
								<Select
									value={editForm.operatorType}
									onValueChange={(value: "POLICE") =>
										setEditForm({ ...editForm, operatorType: value })
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{/* <SelectItem value="OFFICE">Office Operator</SelectItem> */}
										<SelectItem value="POLICE">Police Operator</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-status">Status *</Label>
								<Select
									value={editForm.status}
									onValueChange={(value: "ACTIVE" | "INACTIVE" | "SUSPENDED") =>
										setEditForm({ ...editForm, status: value })
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ACTIVE">Active</SelectItem>
										<SelectItem value="INACTIVE">Inactive</SelectItem>
										<SelectItem value="SUSPENDED">Suspended</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							{/* <Label htmlFor="edit-company">Company *</Label> */}
							<div className="space-y-2">
								<Label htmlFor="edit-phone">Phone Number *</Label>
								<Input
									id="edit-phone"
									value={editForm.phone}
									onChange={(e) =>
										setEditForm({ ...editForm, phone: e.target.value })
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							{/* <Select
								value={editForm.companyId}
								onValueChange={(value) =>
									setEditForm({ ...editForm, companyId: value })
								}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{companies
										.filter((c) => c.status === "ACTIVE")
										.map((company) => (
											<SelectItem key={company.id} value={company.id}>
												{company.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select> */}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="reset-password">
									Do you want to reset password?
								</Label>
								<Switch
									id="reset-password"
									checked={resetPassword}
									onCheckedChange={(checked) => setResetPassword(checked)}
								/>
							</div>
						</div>

						{/* Conditional Password Input */}
						{resetPassword && (
							<div className="space-y-2 mt-2">
								<Label htmlFor="new-password">New Password *</Label>
								<div className="relative">
									<Input
										id="new-password"
										type={showPassword ? "text" : "password"}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Enter new password"
										className="pr-10" // leave space for the button
									/>
									<button
										type="button"
										onClick={() => setShowPassword((prev) => !prev)}
										className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200">
										{showPassword ? (
											<EyeOff className="h-5 w-5" />
										) : (
											<Eye className="h-5 w-5" />
										)}
									</button>
								</div>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleUpdateOperator} disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								"Update Operator"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Export Dialog */}
			<Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Export Operator Report</DialogTitle>
						<DialogDescription>
							Configure export settings for {selectedOperator?.name}'s activity
							report
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="dateFrom">From Date</Label>
								<Input
									id="dateFrom"
									type="date"
									value={exportFilters.dateFrom}
									onChange={(e) =>
										setExportFilters({
											...exportFilters,
											dateFrom: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="dateTo">To Date</Label>
								<Input
									id="dateTo"
									type="date"
									value={exportFilters.dateTo}
									onChange={(e) =>
										setExportFilters({
											...exportFilters,
											dateTo: e.target.value,
										})
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="activityType">Activity Type</Label>
							<Select
								value={exportFilters.activityType}
								onValueChange={(value) =>
									setExportFilters({ ...exportFilters, activityType: value })
								}>
								<SelectTrigger>
									<SelectValue placeholder="Select activity type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Activities</SelectItem>
									<SelectItem value="LOGIN">Logins Only</SelectItem>
									<SelectItem value="ALARM_CREATED">Alarms Created</SelectItem>
									<SelectItem value="ALARM_ACKNOWLEDGED">
										Alarms Acknowledged
									</SelectItem>
									<SelectItem value="ALARM_RESOLVED">
										Alarms Resolved
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-3">
							<Label>Include in Report</Label>
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="includeMetrics"
										checked={exportFilters.includeMetrics}
										onChange={(e) =>
											setExportFilters({
												...exportFilters,
												includeMetrics: e.target.checked,
											})
										}
										className="rounded"
									/>
									<Label htmlFor="includeMetrics" className="text-sm">
										Performance Metrics
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="includeActivityLog"
										checked={exportFilters.includeActivityLog}
										onChange={(e) =>
											setExportFilters({
												...exportFilters,
												includeActivityLog: e.target.checked,
											})
										}
										className="rounded"
									/>
									<Label htmlFor="includeActivityLog" className="text-sm">
										Activity Log
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="includeAlarmHistory"
										checked={exportFilters.includeAlarmHistory}
										onChange={(e) =>
											setExportFilters({
												...exportFilters,
												includeAlarmHistory: e.target.checked,
											})
										}
										className="rounded"
									/>
									<Label htmlFor="includeAlarmHistory" className="text-sm">
										Alarm History
									</Label>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsExportDialogOpen(false)}>
							Cancel
						</Button>
						<div className="flex gap-2">
							<Button
								onClick={() => exportOperatorReport("pdf")}
								disabled={isExporting === "pdf"}
								className="bg-red-600 hover:bg-red-700">
								{isExporting === "pdf" ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Exporting...
									</>
								) : (
									<>
										<FileDown className="h-4 w-4 mr-2" />
										Export PDF
									</>
								)}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
