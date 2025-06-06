"use client";

import { useEffect, useState } from "react";
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
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertTriangle,
	Plus,
	Clock,
	CheckCircle,
	Send,
	Eye,
	Search,
	Edit,
	MoreHorizontal,
	MapPin,
	Calendar,
	User,
	Shield,
	Activity,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Alarm {
	id: string;
	type: string;
	location: string;
	branch: {
		id: string;
		name: string;
	};
	status: "ACTIVE" | "DISPATCHED" | "RESOLVED" | "ACKNOWLEDGED";
	time: string;
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	dispatchedTo: string;
	reports: {
		assignedTo: {
			id: string;
			name: string;
		};
	}[];
	resolvedTime?: string;
	description?: string;
	createdAt?: string;
	updatedAt?: string;
	responseTime?: string;
	priority?: number;
}

export default function AlarmsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [mockAlarms, setMockAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [alarmHistory, setAlarmHistory] = useState<Alarm[]>([]);
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterSeverity, setFilterSeverity] = useState("all");
	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [updating, setUpdating] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		fetchAlarms();
		fetchAlarmsHistory();
	}, []);

	const fetchAlarms = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/alarms");
			console.log("Fetched alarms:", response);
			setMockAlarms((response as any).alarms as any);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch alarms",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchAlarmsHistory = async () => {
		try {
			const response = await apiService.get("/alarms");
			console.log("Fetched alarm history:", response);
			setAlarmHistory((response as any).alarms as any);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch alarm history",
				variant: "destructive",
			});
		}
	};

	const handleUpdateAlarm = async () => {
		if (!selectedAlarm) return;

		try {
			setUpdating(true);
			await apiService.put(`/alarms/${selectedAlarm.id}`, {
				status: selectedAlarm.status,
				severity: selectedAlarm.severity,
				dispatchedTo: selectedAlarm.dispatchedTo,
				description: selectedAlarm.description,
			});

			toast({
				title: "Success",
				description: "Alarm updated successfully",
			});

			setIsEditDialogOpen(false);
			setSelectedAlarm(null);
			fetchAlarms();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.message || "Failed to update alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity?.toUpperCase()) {
			case "CRITICAL":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0";
			case "HIGH":
				return "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0";
			case "MEDIUM":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0";
			case "LOW":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
			default:
				return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "DISPATCHED":
				return <Send className="h-4 w-4 text-blue-500" />;
			case "ACKNOWLEDGED":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "RESOLVED":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0";
			case "DISPATCHED":
				return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0";
			case "ACKNOWLEDGED":
				return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0";
			case "RESOLVED":
				return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
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

	const filteredAlarms = mockAlarms.filter((alarm) => {
		const matchesSearch =
			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			filterStatus === "all" || alarm.status === filterStatus;
		const matchesSeverity =
			filterSeverity === "all" || alarm.severity === filterSeverity;
		return matchesSearch && matchesStatus && matchesSeverity;
	});

	const filteredHistory = alarmHistory.filter((alarm) => {
		const matchesSearch =
			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center space-y-4 animate-fade-in">
					<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
					<p className="text-muted-foreground">Loading alarms...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex justify-between items-center animate-slide-up">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
						Alarm Management
					</h1>
					<p className="text-muted-foreground mt-2">
						Monitor and manage security alarms across all branches
					</p>
				</div>
				<Link href="/dashboard/configure-alarm">
					<Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200">
						<Plus className="h-4 w-4 mr-2" />
						Configure New Alarm
					</Button>
				</Link>
			</div>

			{/* Enhanced Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.1s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
						<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
							<AlertTriangle className="h-4 w-4 text-red-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{mockAlarms.filter((a) => a.status === "ACTIVE").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Require immediate attention
						</p>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.2s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Dispatched</CardTitle>
						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
							<Send className="h-4 w-4 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{mockAlarms.filter((a) => a.status === "DISPATCHED").length}
						</div>
						<p className="text-xs text-muted-foreground">Sent to police</p>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.3s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
						<div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
							<Clock className="h-4 w-4 text-yellow-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{mockAlarms.filter((a) => a.status === "ACKNOWLEDGED").length}
						</div>
						<p className="text-xs text-muted-foreground">Being handled</p>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.4s" }}>
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
							{mockAlarms.filter((a) => a.status === "RESOLVED").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Successfully handled
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Enhanced Alarm Management Tabs */}
			<Tabs
				defaultValue="active"
				className="space-y-4 animate-slide-up"
				style={{ animationDelay: "0.5s" }}>
				<div className="flex justify-between items-center">
					<TabsList className="glass">
						<TabsTrigger value="active">Active Alarms</TabsTrigger>
						<TabsTrigger value="history">Alarm History</TabsTrigger>
					</TabsList>
					<div className="flex space-x-2">
						<div className="relative">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search alarms..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 w-64 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
							/>
						</div>
						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="ACTIVE">Active</SelectItem>
								<SelectItem value="DISPATCHED">Dispatched</SelectItem>
								<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
								<SelectItem value="RESOLVED">Resolved</SelectItem>
							</SelectContent>
						</Select>
						<Select value={filterSeverity} onValueChange={setFilterSeverity}>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Severity" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Severity</SelectItem>
								<SelectItem value="CRITICAL">Critical</SelectItem>
								<SelectItem value="HIGH">High</SelectItem>
								<SelectItem value="MEDIUM">Medium</SelectItem>
								<SelectItem value="LOW">Low</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<TabsContent value="active" className="space-y-4">
					<div className="grid gap-4">
						{filteredAlarms.map((alarm, index) => (
							<Card
								key={alarm.id}
								className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
								style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 rounded-lg bg-muted/50">
												{getStatusIcon(alarm.status)}
											</div>
											<div className="space-y-1">
												<h4 className="font-semibold text-lg">{alarm.type}</h4>
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<MapPin className="h-3 w-3" />
													<span>
														{alarm.location} • {alarm.branch.name}
													</span>
												</div>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Clock className="h-3 w-3" />
													<span>{formatTimeAgo(alarm.time)}</span>
												</div>
												{alarm.reports?.[0]?.assignedTo && (
													<div className="flex items-center gap-2 text-sm">
														<Shield className="h-3 w-3 text-blue-500" />
														<span className="text-blue-600 dark:text-blue-400">
															{alarm.reports[0].assignedTo.name}
														</span>
													</div>
												)}
											</div>
										</div>
										<div className="flex items-center space-x-3">
											<div className="text-right space-y-2">
												<div className="flex gap-2">
													<Badge
														className={cn(
															"text-xs font-medium shadow-sm",
															getSeverityColor(alarm.severity)
														)}>
														{alarm.severity}
													</Badge>
													<Badge
														className={cn(
															"text-xs font-medium shadow-sm",
															getStatusColor(alarm.status)
														)}>
														{alarm.status}
													</Badge>
												</div>
												{alarm.responseTime && (
													<p className="text-xs text-muted-foreground">
														Response: {alarm.responseTime}
													</p>
												)}
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														size="sm"
														className="h-8 w-8 p-0">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="glass">
													<DropdownMenuItem
														className="cursor-pointer"
														onClick={() => {
															setSelectedAlarm(alarm);
															setIsViewDialogOpen(true);
														}}>
														<Eye className="h-4 w-4 mr-2" />
														View Details
													</DropdownMenuItem>
													<DropdownMenuItem
														className="cursor-pointer"
														onClick={() => {
															setSelectedAlarm(alarm);
															setIsEditDialogOpen(true);
														}}>
														<Edit className="h-4 w-4 mr-2" />
														Edit Alarm
													</DropdownMenuItem>
													<DropdownMenuItem className="cursor-pointer">
														<Send className="h-4 w-4 mr-2" />
														Dispatch
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					<div className="grid gap-4">
						{filteredHistory.map((alarm, index) => (
							<Card
								key={alarm.id}
								className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
								style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="p-3 rounded-lg bg-muted/50">
												{getStatusIcon(alarm.status)}
											</div>
											<div className="space-y-1">
												<h4 className="font-semibold text-lg">{alarm.type}</h4>
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<MapPin className="h-3 w-3" />
													<span>
														{alarm.location} • {alarm.branch.name}
													</span>
												</div>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Calendar className="h-3 w-3" />
													<span>{alarm.time}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center space-x-3">
											<div className="text-right space-y-2">
												<div className="flex gap-2">
													<Badge
														className={cn(
															"text-xs font-medium shadow-sm",
															getSeverityColor(alarm.severity)
														)}>
														{alarm.severity}
													</Badge>
													<Badge
														className={cn(
															"text-xs font-medium shadow-sm",
															getStatusColor(alarm.status)
														)}>
														{alarm.status}
													</Badge>
												</div>
												{alarm.resolvedTime && (
													<p className="text-xs text-green-600 font-medium">
														Resolved in: {alarm.resolvedTime}
													</p>
												)}
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setSelectedAlarm(alarm);
													setIsViewDialogOpen(true);
												}}>
												<Eye className="h-4 w-4 mr-2" />
												View Report
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* View Alarm Details Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="sm:max-w-[600px] glass">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-primary" />
							Alarm Details
						</DialogTitle>
						<DialogDescription>
							Detailed information about the security alarm
						</DialogDescription>
					</DialogHeader>
					{selectedAlarm && (
						<div className="space-y-6 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Alarm Type
									</Label>
									<p className="text-lg font-semibold">{selectedAlarm.type}</p>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Status
									</Label>
									<Badge
										className={cn(
											"text-sm",
											getStatusColor(selectedAlarm.status)
										)}>
										{selectedAlarm.status}
									</Badge>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Location
									</Label>
									<p className="flex items-center gap-2">
										<MapPin className="h-4 w-4 text-muted-foreground" />
										{selectedAlarm.location}
									</p>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Branch
									</Label>
									<p className="flex items-center gap-2">
										<Activity className="h-4 w-4 text-muted-foreground" />
										{selectedAlarm.branch.name}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Severity
									</Label>
									<Badge
										className={cn(
											"text-sm",
											getSeverityColor(selectedAlarm.severity)
										)}>
										{selectedAlarm.severity}
									</Badge>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Time Reported
									</Label>
									<p className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										{formatTimeAgo(selectedAlarm.time)}
									</p>
								</div>
							</div>

							{selectedAlarm.reports?.[0]?.assignedTo && (
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Assigned Officer
									</Label>
									<p className="flex items-center gap-2">
										<User className="h-4 w-4 text-muted-foreground" />
										{selectedAlarm.reports[0].assignedTo.name}
									</p>
								</div>
							)}

							{selectedAlarm.description && (
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Description
									</Label>
									<div className="p-3 bg-muted/50 rounded-lg border">
										<p className="text-sm">{selectedAlarm.description}</p>
									</div>
								</div>
							)}

							{selectedAlarm.resolvedTime && (
								<div className="space-y-2">
									<Label className="text-sm font-medium text-muted-foreground">
										Resolution Time
									</Label>
									<p className="text-green-600 font-medium">
										{selectedAlarm.resolvedTime}
									</p>
								</div>
							)}
						</div>
					)}
					<div className="flex justify-end">
						<Button
							variant="outline"
							onClick={() => setIsViewDialogOpen(false)}>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Alarm Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[600px] glass">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5 text-primary" />
							Edit Alarm
						</DialogTitle>
						<DialogDescription>
							Update alarm information and status
						</DialogDescription>
					</DialogHeader>
					{selectedAlarm && (
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editStatus">Status</Label>
									<Select
										value={selectedAlarm.status}
										onValueChange={(
											value:
												| "ACTIVE"
												| "DISPATCHED"
												| "RESOLVED"
												| "ACKNOWLEDGED"
										) => setSelectedAlarm({ ...selectedAlarm, status: value })}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ACTIVE">Active</SelectItem>
											<SelectItem value="DISPATCHED">Dispatched</SelectItem>
											<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
											<SelectItem value="RESOLVED">Resolved</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editSeverity">Severity</Label>
									<Select
										value={selectedAlarm.severity}
										onValueChange={(
											value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
										) =>
											setSelectedAlarm({ ...selectedAlarm, severity: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="LOW">Low</SelectItem>
											<SelectItem value="MEDIUM">Medium</SelectItem>
											<SelectItem value="HIGH">High</SelectItem>
											<SelectItem value="CRITICAL">Critical</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="editDispatchedTo">Dispatched To</Label>
								<Input
									id="editDispatchedTo"
									value={selectedAlarm.dispatchedTo || ""}
									onChange={(e) =>
										setSelectedAlarm({
											...selectedAlarm,
											dispatchedTo: e.target.value,
										})
									}
									placeholder="Officer name or unit"
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="editDescription">Description/Notes</Label>
								<Textarea
									id="editDescription"
									value={selectedAlarm.description || ""}
									onChange={(e) =>
										setSelectedAlarm({
											...selectedAlarm,
											description: e.target.value,
										})
									}
									placeholder="Additional notes or description..."
									rows={3}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>
					)}
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
							disabled={updating}>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateAlarm}
							disabled={updating}
							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
							{updating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								"Update Alarm"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
// 	AlertTriangle,
// 	Plus,
// 	Clock,
// 	CheckCircle,
// 	Send,
// 	Eye,
// 	Filter,
// 	Search,
// } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import Link from "next/link";
// import { apiService } from "@/lib/api-service";
// import { useToast } from "@/hooks/use-toast";

// // const mockAlarms = [
// // 	{
// // 		id: "1",
// // 		type: "Motion Detection",
// // 		location: "Main Entrance",
// // 		branch: "Downtown Office",
// // 		status: "active",
// // 		time: "2 minutes ago",
// // 		severity: "high",
// // 		dispatchedTo: "Captain Johnson",
// // 	},
// // 	{
// // 		id: "2",
// // 		type: "Door Breach",
// // 		location: "Server Room",
// // 		branch: "North Branch",
// // 		status: "dispatched",
// // 		time: "15 minutes ago",
// // 		severity: "critical",
// // 		dispatchedTo: "Lieutenant Wilson",
// // 	},
// // 	{
// // 		id: "3",
// // 		type: "Window Sensor",
// // 		location: "Office 201",
// // 		branch: "Downtown Office",
// // 		status: "resolved",
// // 		time: "1 hour ago",
// // 		severity: "medium",
// // 		dispatchedTo: "Captain Johnson",
// // 	},
// // 	{
// // 		id: "4",
// // 		type: "Fire Alarm",
// // 		location: "Kitchen Area",
// // 		branch: "South Branch",
// // 		status: "acknowledged",
// // 		time: "2 hours ago",
// // 		severity: "critical",
// // 		dispatchedTo: "Captain Brown",
// // 	},
// // ];

// // const alarmHistory = [
// // 	{
// // 		id: "5",
// // 		type: "Motion Detection",
// // 		location: "Parking Lot",
// // 		branch: "East Branch",
// // 		status: "resolved",
// // 		time: "Yesterday 14:30",
// // 		severity: "low",
// // 		dispatchedTo: "Lieutenant Davis",
// // 		resolvedTime: "15 minutes",
// // 	},
// // 	{
// // 		id: "6",
// // 		type: "Panic Button",
// // 		location: "Reception",
// // 		branch: "Downtown Office",
// // 		status: "resolved",
// // 		time: "Yesterday 09:15",
// // 		severity: "high",
// // 		dispatchedTo: "Captain Johnson",
// // 		resolvedTime: "8 minutes",
// // 	},
// // ];

// interface Alarm {
// 	id: string;
// 	type: string;
// 	location: string;
// 	branch: {
// 		id: string;
// 		name: string;
// 	};
// 	status: "ACTIVE" | "DISPATCHED" | "RESOLVED" | "ACKNOWLEDGED";
// 	time: string;
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	dispatchedTo: string;
// 	reports: {
// 		assignedTo: {
// 			id: string;
// 			name: string;
// 		};
// 	}[];
// 	resolvedTime?: string; // optional, only present in alarm history
// }

// export default function AlarmsPage() {
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [mockAlarms, setMockAlarms] = useState([] as Alarm[]);
// 	const [loading, setLoading] = useState(true);
// 	const [alarmHistory, setAlarmHistory] = useState([] as Alarm[]);
// 	const [filterStatus, setFilterStatus] = useState("all");
// 	const { toast } = useToast();

// 	useEffect(() => {
// 		fetchAlarms();
// 		fetchAlarmsHistory();
// 	}, []);

// 	const fetchAlarms = async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/alarms");
// 			console.log("Fetched alarms:", response);
// 			setMockAlarms((response as any).alarms as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch alarms",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const fetchAlarmsHistory = async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/alarms");
// 			console.log("Fetched alarms:", response);
// 			setAlarmHistory((response as any).alarms as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch alarms",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const getSeverityColor = (severity: string) => {
// 		switch (severity) {
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

// 	const getStatusIcon = (status: string) => {
// 		switch (status) {
// 			case "ACTIVE":
// 				return <AlertTriangle className="h-4 w-4 text-red-500" />;
// 			case "DISPATCHED":
// 				return <Send className="h-4 w-4 text-blue-500" />;
// 			case "ACKNOWLEDGED":
// 				return <Clock className="h-4 w-4 text-yellow-500" />;
// 			case "RESOLVED":
// 				return <CheckCircle className="h-4 w-4 text-green-500" />;
// 			default:
// 				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
// 		}
// 	};

// 	const getStatusColor = (status: string) => {
// 		switch (status) {
// 			case "ACTIVE":
// 				return "bg-red-100 text-red-800";
// 			case "DISPATCHED":
// 				return "bg-blue-100 text-blue-800";
// 			case "ACKNOWLEDGED":
// 				return "bg-yellow-100 text-yellow-800";
// 			case "RESOLVED":
// 				return "bg-green-100 text-green-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	return (
// 		<div className="space-y-6">
// 			<div className="flex justify-between items-center">
// 				<div>
// 					<h1 className="text-3xl font-bold tracking-tight">
// 						Alarm Management
// 					</h1>
// 					<p className="text-muted-foreground">
// 						Monitor and manage security alarms across all branches
// 					</p>
// 				</div>
// 				<Link href="/dashboard/configure-alarm">
// 					<Button className="bg-red-600 hover:bg-red-700">
// 						<Plus className="h-4 w-4 mr-2" />
// 						Configure New Alarm
// 					</Button>
// 				</Link>
// 			</div>

// 			{/* Overview Cards */}
// 			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
// 						<AlertTriangle className="h-4 w-4 text-red-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-red-600">
// 							{mockAlarms.filter((a) => a.status === "ACTIVE").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">
// 							Require immediate attention
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Dispatched</CardTitle>
// 						<Send className="h-4 w-4 text-blue-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-blue-600">
// 							{mockAlarms.filter((a) => a.status === "DISPATCHED").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Sent to police</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
// 						<Clock className="h-4 w-4 text-yellow-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-yellow-600">
// 							{mockAlarms.filter((a) => a.status === "ACKNOWLEDGED").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Being handled</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Resolved Today
// 						</CardTitle>
// 						<CheckCircle className="h-4 w-4 text-green-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-green-600">
// 							{mockAlarms.filter((a) => a.status === "RESOLVED").length}
// 						</div>
// 						<p className="text-xs text-muted-foreground">
// 							Successfully handled
// 						</p>
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Alarm Management Tabs */}
// 			<Tabs defaultValue="active" className="space-y-4">
// 				<div className="flex justify-between items-center">
// 					<TabsList>
// 						<TabsTrigger value="active">Active Alarms</TabsTrigger>
// 						<TabsTrigger value="history">Alarm History</TabsTrigger>
// 					</TabsList>
// 					<div className="flex space-x-2">
// 						<div className="relative">
// 							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
// 							<Input
// 								placeholder="Search alarms..."
// 								value={searchTerm}
// 								onChange={(e) => setSearchTerm(e.target.value)}
// 								className="pl-8 w-64"
// 							/>
// 						</div>
// 						<Button variant="outline">
// 							<Filter className="h-4 w-4 mr-2" />
// 							Filter
// 						</Button>
// 					</div>
// 				</div>

// 				<TabsContent value="active" className="space-y-4">
// 					<div className="grid gap-4">
// 						{mockAlarms.map((alarm) => (
// 							<Card key={alarm.id}>
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											{getStatusIcon(alarm.status)}
// 											<div>
// 												<h4 className="font-medium">{alarm.type}</h4>
// 												<p className="text-sm text-gray-500">
// 													{alarm.location} • {alarm.branch.name}
// 												</p>
// 												<p className="text-xs text-gray-400">{alarm.time}</p>
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<Badge className={getSeverityColor(alarm.severity)}>
// 												{alarm.severity}
// 											</Badge>
// 											<Badge className={getStatusColor(alarm.status)}>
// 												{alarm.status}
// 											</Badge>
// 											<div className="text-right text-xs text-gray-500">
// 												<p>Dispatched to:</p>
// 												{/* <p className="font-medium">
// 													{alarm.reports[0].assignedTo.name}
// 												</p> */}
// 											</div>
// 											<Button variant="outline" size="sm">
// 												<Eye className="h-4 w-4 mr-2" />
// 												View Details
// 											</Button>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>

// 				<TabsContent value="history" className="space-y-4">
// 					<div className="grid gap-4">
// 						{alarmHistory.map((alarm) => (
// 							<Card key={alarm.id}>
// 								<CardContent className="p-6">
// 									<div className="flex items-center justify-between">
// 										<div className="flex items-center space-x-4">
// 											{getStatusIcon(alarm.status)}
// 											<div>
// 												<h4 className="font-medium">{alarm.type}</h4>
// 												<p className="text-sm text-gray-500">
// 													{alarm.location} • {alarm.branch.name}
// 												</p>
// 												<p className="text-xs text-gray-400">{alarm.time}</p>
// 											</div>
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<Badge className={getSeverityColor(alarm.severity)}>
// 												{alarm.severity}
// 											</Badge>
// 											<Badge className={getStatusColor(alarm.status)}>
// 												{alarm.status}
// 											</Badge>
// 											<div className="text-right text-xs text-gray-500">
// 												<p>Resolved in:</p>
// 												<p className="font-medium text-green-600">
// 													{alarm.resolvedTime}
// 												</p>
// 											</div>
// 											<Button variant="outline" size="sm">
// 												<Eye className="h-4 w-4 mr-2" />
// 												View Report
// 											</Button>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						))}
// 					</div>
// 				</TabsContent>
// 			</Tabs>
// 		</div>
// 	);
// }
