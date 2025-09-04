"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService as apiOperatorService } from "@/lib/api-operator-service";
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
	UserCheck,
	Loader2,
	Eye,
	Edit,
	UserX,
	Mail,
	Phone,
	User,
	UserCog,
	Search,
	Filter,
	Activity,
	AlertTriangle,
	CheckCircle,
	Clock,
	TrendingUp,
	Download,
	FileDown,
	BarChart3,
	Target,
	Timer,
	EyeOff,
} from "lucide-react";
import { apiService } from "@/lib/api-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
} from "recharts";
import { Switch } from "@/components/ui/switch";

interface UserType {
	role: string;
	name: string;
	id: string;
	managedBy?: string;
	type?: string;
	companyId?: string;
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

interface ExportFilters {
	dateFrom: string;
	dateTo: string;
	activityType: string;
	includeMetrics: boolean;
	includeActivityLog: boolean;
	includeAlarmHistory: boolean;
}

export default function EnhancedOperatorsPage() {
	const [user, setUser] = useState<UserType | null>(null);
	const [operators, setOperators] = useState<Operator[]>([]);
	const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isExporting, setIsExporting] = useState<"csv" | "pdf" | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
		null
	);
	const [selectedOperatorDetails, setSelectedOperatorDetails] =
		useState<OperatorDetails | null>(null);
	const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
	const [activityLogFilter, setActivityLogFilter] = useState<string>("all");
	const [dateRangeFilter, setDateRangeFilter] = useState<string>("30");
	// Extra states for reset password
	const [resetPassword, setResetPassword] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const { toast } = useToast();

	const [newOperator, setNewOperator] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		operatorType: "OFFICE",
		status: "ACTIVE",
	});

	const [editOperator, setEditOperator] = useState({
		name: "",
		email: "",
		phone: "",
		operatorType: "",
		status: "ACTIVE",
	});

	const [exportFilters, setExportFilters] = useState<ExportFilters>({
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
		const userData = localStorage.getItem("currentUser");
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser({ ...parsedUser, companyId: parsedUser.companyId || "comp1" });
			} catch (error) {
				console.error("Failed to parse user data:", error);
				toast({
					title: "Error",
					description: "Failed to load user data",
					variant: "destructive",
				});
			}
		}

		fetchOperators();
	}, []);

	const fetchOperators = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/users/my-operators");
			console.log("Fetched Operators:", response);

			const operatorsWithData = (response as any).map((operator: any) => ({
				...operator,
				lastActive:
					operator.lastActive ||
					new Date(Date.now() - Math.random() * 10000000000).toISOString(),
			}));

			setOperators(operatorsWithData);
			setFilteredOperators(operatorsWithData);
		} catch (error) {
			console.error("Failed to fetch operators:", error);
			toast({
				title: "Error",
				description: "Failed to fetch operators",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchOperatorDetails = async (operatorId: string) => {
		try {
			const [detailsResponse, metricsResponse, activityResponse] =
				await Promise.all([
					apiService.get(`/users/operators/${operatorId}`),
					apiService.get(`/users/operators/${operatorId}/metrics`),
					apiService.get(`/users/operators/${operatorId}/activity`, {
						dateFrom: new Date(
							Date.now() - 30 * 24 * 60 * 60 * 1000
						).toISOString(),
						dateTo: new Date().toISOString(),
						limit: 50,
					}),
				]);

			console.log({
				activityResponse,
			});

			const operatorDetails: OperatorDetails = {
				...detailsResponse,
				metrics: metricsResponse,
				activityLog: (activityResponse as any).activities,
			} as any;

			setSelectedOperatorDetails(operatorDetails);
		} catch (error) {
			console.error("Failed to fetch operator details:", error);
			toast({
				title: "Error",
				description: "Failed to load operator details",
				variant: "destructive",
			});
		}
	};

	// Filter operators based on search and status
	useEffect(() => {
		let filtered = operators;

		if (searchTerm) {
			filtered = filtered.filter(
				(operator) =>
					operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					operator.email.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		if (statusFilter !== "all") {
			filtered = filtered.filter(
				(operator) => operator.status === statusFilter.toUpperCase()
			);
		}

		setFilteredOperators(filtered);
	}, [operators, searchTerm, statusFilter]);

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

	const handleCreateOperator = async () => {
		if (!user || !validateOperatorForm(newOperator)) return;

		setIsSubmitting(true);

		try {
			const operatorData = {
				name: newOperator.name,
				email: newOperator.email,
				phone: newOperator.phone,
				password: newOperator.password,
				role: "OPERATOR",
				operatorType: newOperator.operatorType,
				companyId: user.companyId,
			};

			console.log("Creating operator with data:", operatorData);

			// Call the actual API
			const response = await apiService.post("/users", operatorData);

			// Success - add the new operator to the list
			const newOperatorData: Operator = {
				id: (response as any).user?.id || `op-${Date.now()}`,
				name: newOperator.name,
				email: newOperator.email,
				phone: newOperator.phone,
				status: "ACTIVE",
				role: "OPERATOR",
				managedById: user.id,
				operatorType: newOperator.operatorType,
				createdBy: user.id,
				companyId: user.companyId as string,
				createdAt: new Date().toISOString(),

				lastActive: new Date().toISOString(),
			};

			setOperators([newOperatorData, ...operators]);
			setNewOperator({
				name: "",
				email: "",
				phone: "",
				password: "",
				operatorType: "OFFICE",
				status: "ACTIVE",
			});
			setIsCreateDialogOpen(false);

			toast({
				title: "Success",
				description: "Operator created successfully",
			});
		} catch (error: any) {
			console.error("Failed to create operator:", error);

			// Handle different types of API errors
			if (error.response?.data) {
				const errorData = error.response.data;

				// Handle validation errors (400 status)
				if (error.response.status === 400 && errorData.details) {
					const validationErrors = errorData.details
						.map((err: any) => {
							const field = err.path?.join(".") || "field";
							return `${field}: ${err.message}`;
						})
						.join(", ");

					toast({
						title: "Validation Error",
						description: `Please check the following fields: ${validationErrors}`,
						variant: "destructive",
					});
				}
				// Handle authorization errors (403 status)
				else if (error.response.status === 403) {
					if (errorData.error === "You can only create operators") {
						toast({
							title: "Permission Denied",
							description:
								"As a manager, you can only create operator accounts, not other managers or admins.",
							variant: "destructive",
						});
					} else if (errorData.error === "Insufficient permissions") {
						toast({
							title: "Access Denied",
							description:
								"You don't have permission to create new users. Please contact your administrator.",
							variant: "destructive",
						});
					} else {
						toast({
							title: "Permission Error",
							description:
								errorData.error ||
								"You don't have permission to perform this action.",
							variant: "destructive",
						});
					}
				}
				// Handle duplicate email errors (409 status)
				else if (error.response.status === 409) {
					toast({
						title: "Email Already Exists",
						description:
							"An operator with this email address already exists. Please use a different email.",
						variant: "destructive",
					});
				}
				// Handle server errors (500 status)
				else if (error.response.status === 500) {
					toast({
						title: "Server Error",
						description:
							"Something went wrong on our end. Please try again in a few moments.",
						variant: "destructive",
					});
				}
				// Handle other API errors
				else {
					toast({
						title: "Error",
						description:
							errorData.error ||
							errorData.message ||
							"Failed to create operator. Please try again.",
						variant: "destructive",
					});
				}
			}
			// Handle network errors or other non-API errors
			else if (error.code === "NETWORK_ERROR" || !error.response) {
				toast({
					title: "Connection Error",
					description:
						"Unable to connect to the server. Please check your internet connection and try again.",
					variant: "destructive",
				});
			}
			// Handle unknown errors
			else {
				toast({
					title: "Unexpected Error",
					description:
						"An unexpected error occurred. Please try again or contact support if the problem persists.",
					variant: "destructive",
				});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const validateOperatorForm: any = (data: {
		name: string;
		email: string;
		phone: string;
		password?: string;
	}) => {
		// Check for empty required fields
		if (!data.name.trim()) {
			toast({
				title: "Name Required",
				description: "Please enter the operator's full name.",
				variant: "destructive",
			});
			return false;
		}

		if (!data.email.trim()) {
			toast({
				title: "Email Required",
				description: "Please enter a valid email address.",
				variant: "destructive",
			});
			return false;
		}

		if (!data.phone.trim()) {
			toast({
				title: "Phone Required",
				description: "Please enter a phone number.",
				variant: "destructive",
			});
			return false;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			toast({
				title: "Invalid Email Format",
				description:
					"Please enter a valid email address (e.g., operator@company.com).",
				variant: "destructive",
			});
			return false;
		}

		// Validate phone number format
		const phoneRegex = /^\+?[0-9\s\-$$$$]{10,15}$/;
		if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
			toast({
				title: "Invalid Phone Number",
				description:
					"Please enter a valid phone number (10-15 digits, with optional country code).",
				variant: "destructive",
			});
			return false;
		}

		// Validate password if it's a new operator
		if (data.password !== undefined) {
			if (!data.password.trim()) {
				toast({
					title: "Password Required",
					description: "Please enter a password for the new operator.",
					variant: "destructive",
				});
				return false;
			}

			if (data.password.length < 8) {
				toast({
					title: "Password Too Short",
					description:
						"Password must be at least 8 characters long for security.",
					variant: "destructive",
				});
				return false;
			}
		}

		// Validate operator type
		if (!newOperator.operatorType) {
			toast({
				title: "Operator Type Required",
				description:
					"Please select whether this is an Office or Police operator.",
				variant: "destructive",
			});
			return false;
		}

		return true;
	};

	const handleEditOperator = async () => {
		if (
			!selectedOperator ||
			!validateOperatorForm({ ...editOperator, password: undefined })
		)
			return;

		setIsSubmitting(true);

		try {
			const updatedOperator: Operator = {
				...selectedOperator,
				name: editOperator.name,
				email: editOperator.email,
				status: editOperator.status as any,
				phone: editOperator.phone,
				operatorType: editOperator.operatorType,
				...(resetPassword && newPassword ? { password: newPassword } : {}),
			};

			const response = await apiOperatorService.operators.updateOffice(
				selectedOperator.id,
				updatedOperator as any
			);

			setOperators(
				operators.map((op) =>
					op.id === selectedOperator.id ? updatedOperator : op
				)
			);
			setIsEditDialogOpen(false);
			setSelectedOperator(null);

			toast({
				title: "Success",
				description: "Operator updated successfully",
			});
		} catch (error) {
			console.error("Failed to update operator:", error);
			toast({
				title: "Error",
				description: "Failed to update operator",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleOperatorStatus = async (operatorId: string) => {
		try {
			const operator = operators.find((op) => op.id === operatorId);
			if (!operator) return;

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, you would call the API here
			// await apiService.put(`/users/${operatorId}/status`, { status: operator.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })

			const updatedOperators = operators.map((op) =>
				op.id === operatorId
					? { ...op, status: op.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
					: op
			);

			setOperators(updatedOperators as any);

			toast({
				title: "Success",
				description: `Operator ${
					operator.status === "ACTIVE" ? "deactivated" : "activated"
				} successfully`,
			});
		} catch (error) {
			console.error("Failed to toggle operator status:", error);
			toast({
				title: "Error",
				description: "Failed to update operator status",
				variant: "destructive",
			});
		}
	};

	const handleStatusToggle = async (operatorId: string, newStatus: string) => {
		try {
			const operator = operators.find((op) => op.id === operatorId);
			if (!operator) return;

			const updatedOperators = operators.map((op) =>
				op.id === operatorId
					? { ...op, status: op.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
					: op
			);

			const response = await apiOperatorService.operators.updateStatus(
				operatorId,
				newStatus as any
			);

			setOperators(updatedOperators as any);

			toast({
				title: "Success",
				description: `Operator ${
					operator.status === "ACTIVE" ? "deactivated" : "activated"
				} successfully`,
			});
		} catch (error) {
			console.error("Failed to toggle operator status:", error);
			toast({
				title: "Error",
				description: "Failed to update operator status",
				variant: "destructive",
			});
		}
	};

	const handleDeleteOperator = async (operatorId: string) => {
		setIsDeleting(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, you would call the API here
			// await apiService.delete(`/users/${operatorId}`)

			setOperators(operators.filter((op) => op.id !== operatorId));
			setDeleteConfirmEmail("");

			toast({
				title: "Success",
				description: "Operator deleted successfully",
			});
		} catch (error) {
			console.error("Failed to delete operator:", error);
			toast({
				title: "Error",
				description: "Failed to delete operator",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
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
				await apiService.downloadFile(
					`/operators/${selectedOperator.id}/export/csv?${new URLSearchParams(
						exportFilters as any
					).toString()}`,
					`operator-report-${selectedOperator.name.replace(/\s+/g, "-")}-${
						new Date().toISOString().split("T")[0]
					}.csv`
				);
			} else {
				const response = await fetch(
					`https://frt.et/api/users/operators/${selectedOperator.id}/export/pdf`,
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

	const openViewDialog = (operator: Operator) => {
		setSelectedOperator(operator);
		fetchOperatorDetails(operator.id);
		setIsViewDialogOpen(true);
	};

	const openEditDialog = (operator: Operator) => {
		setSelectedOperator(operator);
		setEditOperator({
			name: operator.name,
			email: operator.email,
			phone: operator.phone,
			operatorType: operator.operatorType || "OFFICE",
			status: operator.status || "ACTIVE",
		});
		setIsEditDialogOpen(true);
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

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch (error) {
			return dateString;
		}
	};

	const getTimeAgo = (dateString: string) => {
		try {
			const date = new Date(dateString);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffSec = Math.round(diffMs / 1000);
			const diffMin = Math.round(diffSec / 60);
			const diffHour = Math.round(diffMin / 60);
			const diffDay = Math.round(diffHour / 24);

			if (diffSec < 60) return `${diffSec} seconds ago`;
			if (diffMin < 60) return `${diffMin} minutes ago`;
			if (diffHour < 24) return `${diffHour} hours ago`;
			if (diffDay < 30) return `${diffDay} days ago`;

			return formatDate(dateString);
		} catch (error) {
			return "Unknown time";
		}
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

	const activeOperators = filteredOperators.filter(
		(op) => op.status === "ACTIVE"
	);
	const inactiveOperators = filteredOperators.filter(
		(op) => op.status === "INACTIVE"
	);

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
					<p className="text-muted-foreground">Loading user data...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="flex justify-between items-center animate-slide-up">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
						Operator Management
					</h1>
					<p className="text-muted-foreground mt-2">
						Manage security operators and track their performance
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
							<Plus className="h-4 w-4 mr-2" />
							Create Operator
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Operator</DialogTitle>
							<DialogDescription>
								Add a new security operator to your team
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name *</Label>
									<Input
										id="name"
										value={newOperator.name}
										onChange={(e) =>
											setNewOperator({ ...newOperator, name: e.target.value })
										}
										placeholder="Enter operator's full name"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="operatorType">Operator Type *</Label>
									<Select
										required
										value={newOperator.operatorType}
										onValueChange={(value) =>
											setNewOperator({ ...newOperator, operatorType: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue placeholder="Select operator type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="OFFICE">Office Operator</SelectItem>
											{/* <SelectItem value="POLICE">Police Operator</SelectItem> */}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									type="email"
									value={newOperator.email}
									onChange={(e) =>
										setNewOperator({ ...newOperator, email: e.target.value })
									}
									placeholder="operator@company.com"
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									required
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number *</Label>
									<Input
										id="phone"
										value={newOperator.phone}
										onChange={(e) =>
											setNewOperator({ ...newOperator, phone: e.target.value })
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
										value={newOperator.password}
										onChange={(e) =>
											setNewOperator({
												...newOperator,
												password: e.target.value,
											})
										}
										placeholder="Minimum 8 characters"
										type="password"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
								disabled={isSubmitting}>
								Cancel
							</Button>
							<Button
								onClick={handleCreateOperator}
								disabled={isSubmitting}
								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
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

			{/* Enhanced Metrics Cards */}
			<div
				className="grid gap-4 md:grid-cols-4 animate-slide-up"
				style={{ animationDelay: "0.1s" }}>
				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Operators
						</CardTitle>
						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
							<Users className="h-4 w-4 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-blue-600">
									{operators.length}
								</div>
								<p className="text-xs text-muted-foreground">
									{activeOperators.length} active
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Operators
						</CardTitle>
						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
							<UserCheck className="h-4 w-4 text-green-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-green-600">
									{activeOperators.length}
								</div>
								<p className="text-xs text-muted-foreground">
									Currently on duty
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Avg Performance
						</CardTitle>
						<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
							<TrendingUp className="h-4 w-4 text-purple-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-purple-600">85%</div>
								<p className="text-xs text-muted-foreground">
									Performance score
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-all duration-300">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Response Time</CardTitle>
						<div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
							<Timer className="h-4 w-4 text-orange-500" />
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="text-2xl font-bold text-orange-600">12m</div>
								<p className="text-xs text-muted-foreground">
									Average response
								</p>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Search and Filter */}
			<div
				className="flex flex-col sm:flex-row gap-4 animate-slide-up"
				style={{ animationDelay: "0.2s" }}>
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search operators by name, email, or phone..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Filter className="h-4 w-4 text-muted-foreground" />
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Operators Tabs - Same structure as original but with enhanced view dialog */}
			<Tabs
				defaultValue="active"
				className="space-y-4 animate-slide-up"
				style={{ animationDelay: "0.3s" }}>
				<TabsList className="glass">
					<TabsTrigger value="active" className="relative">
						Active Operators
						<Badge className="ml-2 bg-green-500 text-white">
							{activeOperators.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="inactive" className="relative">
						Inactive Operators
						<Badge className="ml-2 bg-red-500 text-white">
							{inactiveOperators.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="all" className="relative">
						All Operators
						<Badge className="ml-2 bg-blue-500 text-white">
							{filteredOperators.length}
						</Badge>
					</TabsTrigger>
				</TabsList>

				{/* Tab Contents - Same as original structure */}
				<TabsContent value="active" className="space-y-4">
					{/* Operator cards implementation - same as original */}
					{loading ? (
						<div className="space-y-4">
							{[...Array(3)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardContent className="p-6">
										<Skeleton className="h-20 w-full" />
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="space-y-4">
							{activeOperators.map((operator, index) => (
								<Card
									key={operator.id}
									className="hover:shadow-lg transition-all duration-300 animate-slide-up border-l-4 border-l-green-500"
									style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
									<CardContent className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
													<UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
												</div>
												<div>
													<h4 className="font-medium">{operator.name}</h4>
													<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
														<span className="flex items-center">
															<Mail className="h-3 w-3 mr-1" />
															{operator.email}
														</span>
														<span className="flex items-center">
															<Phone className="h-3 w-3 mr-1" />
															{operator.phone}
														</span>
													</div>
													<div className="flex flex-wrap items-center gap-2 mt-2">
														<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
															Active
														</Badge>
														{operator.operatorType && (
															<Badge className="border-blue-200 text-blue-800 dark:border-blue-900/20 dark:text-blue-400">
																{operator.operatorType} Operator
															</Badge>
														)}
														<span className="text-xs text-muted-foreground">
															Last active:{" "}
															{operator.lastActive
																? getTimeAgo(operator.lastActive)
																: "Unknown"}
														</span>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
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
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* Other tab contents - similar structure */}
			</Tabs>

			{/* Enhanced View Operator Details Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between text-xl">
							<div className="flex items-center gap-2">
								<User className="h-5 w-5 text-primary" />
								Operator Details & Activity Log
							</div>
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
						</DialogTitle>
						<DialogDescription>
							Comprehensive information about the operator, performance metrics,
							and activity history
						</DialogDescription>
					</DialogHeader>

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
											<Target className="h-4 w-4 text-green-500" />
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

									<div className="flex justify-between border-t pt-4">
										<div className="text-sm text-muted-foreground">
											<p>
												Created: {formatDate(selectedOperatorDetails.createdAt)}
											</p>
											{selectedOperatorDetails.lastActive && (
												<p>
													Last Active:{" "}
													{formatDateTime(selectedOperatorDetails.lastActive)}
												</p>
											)}
										</div>

										<div className="flex gap-2">
											<Button
												variant="outline"
												onClick={() => {
													setIsViewDialogOpen(false);
													openEditDialog(selectedOperatorDetails);
												}}>
												<Edit className="h-4 w-4 mr-2" />
												Edit Operator
											</Button>
											<Button
												variant="default"
												className={
													selectedOperatorDetails.status === "ACTIVE"
														? "bg-red-600 hover:bg-red-700"
														: "bg-green-600 hover:bg-green-700"
												}
												onClick={() => {
													toggleOperatorStatus(selectedOperatorDetails.id);
													setIsViewDialogOpen(false);
												}}>
												{selectedOperatorDetails.status === "ACTIVE"
													? "Deactivate"
													: "Activate"}{" "}
												Operator
											</Button>
										</div>
									</div>
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
							{/* <Button
								onClick={() => exportOperatorReport("csv")}
								disabled={isExporting === "csv"}
								className="bg-green-600 hover:bg-green-700">
								{isExporting === "csv" ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Exporting...
									</>
								) : (
									<>
										<Download className="h-4 w-4 mr-2" />
										Export CSV
									</>
								)}
							</Button> */}
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

			{/* Edit Operator Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Operator</DialogTitle>
						<DialogDescription>
							Update operator information and assignments
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Full Name *</Label>
								<Input
									id="edit-name"
									value={editOperator.name}
									onChange={(e) =>
										setEditOperator({ ...editOperator, name: e.target.value })
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-operatorType">Operator Type</Label>
								<Select
									value={editOperator.operatorType}
									onValueChange={(value) =>
										setEditOperator({ ...editOperator, operatorType: value })
									}>
									<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
										<SelectValue placeholder="Select operator type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="OFFICE">Office Operator</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-email">Email *</Label>
							<Input
								id="edit-email"
								type="email"
								value={editOperator.email}
								onChange={(e) =>
									setEditOperator({ ...editOperator, email: e.target.value })
								}
								className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-status">Status *</Label>
							<Select
								value={editOperator.status}
								onValueChange={(value: "ACTIVE" | "INACTIVE" | "SUSPENDED") =>
									setEditOperator({ ...editOperator, status: value })
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

						<div className="space-y-2">
							<Label htmlFor="edit-phone">Phone Number *</Label>
							<Input
								id="edit-phone"
								value={editOperator.phone}
								onChange={(e) =>
									setEditOperator({ ...editOperator, phone: e.target.value })
								}
								className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
							/>
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
							onClick={() => setIsEditDialogOpen(false)}
							disabled={isSubmitting}>
							Cancel
						</Button>
						<Button
							onClick={handleEditOperator}
							disabled={isSubmitting}
							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
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
		</div>
	);
}
