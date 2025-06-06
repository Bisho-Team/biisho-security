"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api-service";
import { persistentNotificationService } from "@/lib/persistent-notification-service";
import { EnhancedAlarmIndicators } from "@/components/enhanced-alarm-indicators";
import { PersistentAlarmBanner } from "@/components/persistent-alarm-banner";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Shield,
	Eye,
	MessageSquare,
	MapPin,
	Calendar,
	Loader2,
	Search,
	Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alarm {
	id: string;
	type: string;
	branchId: string;
	branch: {
		id: string;
		name: string;
	};
	location: string;
	status: "ACTIVE" | "acknowledged" | "completed";
	severity: "low" | "medium" | "high" | "critical";
	description: string;
	additionalNotes?: string;
	createdBy: {
		id: string;
		name: string;
	};
	createdAt: string;
	acknowledgedAt?: string;
	completedAt?: string;
	resolutionDescription?: string;
}

export default function AlarmReportsPage() {
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
	const [resolutionDescription, setResolutionDescription] = useState("");
	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [severityFilter, setSeverityFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const { toast } = useToast();

	useEffect(() => {
		fetchAlarms();

		// Initialize persistent notification service
		persistentNotificationService.initialize();
	}, []);

	const fetchAlarms = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/alarms");
			setAlarms((response as any).alarms);
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

	const acknowledgeAlarm = async (alarmId: string) => {
		try {
			setUpdating(true);
			await apiService.put(`/alarms/${alarmId}`, {
				status: "acknowledged",
				acknowledgedAt: new Date().toISOString(),
			});

			// Acknowledge in persistent notification service
			await persistentNotificationService.acknowledgeAlarm(alarmId);

			toast({
				title: "Success",
				description: "Alarm acknowledged successfully",
			});

			fetchAlarms();
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to acknowledge alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const completeAlarm = async (alarmId: string, resolution: string) => {
		try {
			setUpdating(true);
			await apiService.put(`/alarms/${alarmId}`, {
				status: "completed",
				completedAt: new Date().toISOString(),
				resolutionDescription: resolution,
			});

			toast({
				title: "Success",
				description: "Alarm completed successfully",
			});

			setIsResolutionDialogOpen(false);
			setResolutionDescription("");
			setSelectedAlarm(null);
			fetchAlarms();
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to complete alarm",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "critical":
				return "bg-red-100 text-red-800 border-red-300";
			case "high":
				return "bg-orange-100 text-orange-800 border-orange-300";
			case "medium":
				return "bg-yellow-100 text-yellow-800 border-yellow-300";
			case "low":
				return "bg-green-100 text-green-800 border-green-300";
			default:
				return "bg-gray-100 text-gray-800 border-gray-300";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "acknowledged":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
		}
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const getTimeAgo = (dateString: string) => {
		const now = new Date();
		const date = new Date(dateString);
		const diffInMinutes = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60)
		);

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		return `${Math.floor(diffInMinutes / 60)}h ago`;
	};

	// Filter alarms based on search and filters
	const filteredAlarms = alarms.filter((alarm) => {
		const matchesSearch =
			searchTerm === "" ||
			alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alarm.description.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesSeverity =
			severityFilter === "all" || alarm.severity === severityFilter;
		const matchesStatus =
			statusFilter === "all" || alarm.status === statusFilter;

		return matchesSearch && matchesSeverity && matchesStatus;
	});

	const activeAlarms = filteredAlarms.filter(
		(alarm) => alarm.status === "ACTIVE"
	);
	const acknowledgedAlarms = filteredAlarms.filter(
		(alarm) => alarm.status === "acknowledged"
	);
	const completedAlarms = filteredAlarms.filter(
		(alarm) => alarm.status === "completed"
	);
	const criticalAlarms = activeAlarms.filter(
		(alarm) => alarm.severity === "critical"
	);

	if (loading) {
		return (
			<div className="space-y-6">
				<div>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96 mt-2" />
				</div>
				<div className="grid gap-4 md:grid-cols-4">
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

	return (
		<div className="space-y-6">
			<PersistentAlarmBanner />

			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					🚨 Alarm Command Center
				</h1>
				<p className="text-muted-foreground">
					Real-time security alarm monitoring and response management
				</p>
			</div>

			{/* Enhanced Alarm Indicators */}
			<EnhancedAlarmIndicators
				alarms={alarms.map((alarm) => ({
					id: alarm.id,
					type: alarm.type,
					branchName: alarm.branch.name,
					location: alarm.location,
					status: alarm.status,
					severity: alarm.severity,
					description: alarm.description,
					createdAt: alarm.createdAt,
				}))}
				onAcknowledge={acknowledgeAlarm}
				onViewDetails={(alarmId) => {
					const alarm = alarms.find((a) => a.id === alarmId);
					if (alarm) setSelectedAlarm(alarm);
				}}
			/>

			{/* Search and Filter Controls */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
								<Input
									placeholder="Search alarms by type, location, branch, or description..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Select value={severityFilter} onValueChange={setSeverityFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Severity" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Severities</SelectItem>
									<SelectItem value="critical">Critical</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="low">Low</SelectItem>
								</SelectContent>
							</Select>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="ACTIVE">Active</SelectItem>
									<SelectItem value="acknowledged">Acknowledged</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Tabs defaultValue="ACTIVE" className="space-y-4">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="ACTIVE" className="relative">
						Active Alarms ({activeAlarms.length})
						{activeAlarms.length > 0 && (
							<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
						)}
					</TabsTrigger>
					<TabsTrigger value="acknowledged">
						Acknowledged ({acknowledgedAlarms.length})
					</TabsTrigger>
					<TabsTrigger value="completed">
						Completed ({completedAlarms.length})
					</TabsTrigger>
					<TabsTrigger value="all">
						All Alarms ({filteredAlarms.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="ACTIVE" className="space-y-4">
					{criticalAlarms.length > 0 && (
						<Card className="border-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100">
							<CardHeader className="bg-red-100 border-b border-red-200">
								<CardTitle className="text-red-800 flex items-center text-xl">
									<Zap className="h-6 w-6 mr-3 animate-pulse" />
									CRITICAL ALARMS - EMERGENCY RESPONSE REQUIRED
									<Badge className="ml-3 bg-red-600 text-white animate-pulse">
										{criticalAlarms.length} ACTIVE
									</Badge>
								</CardTitle>
							</CardHeader>
						</Card>
					)}

					<div className="grid gap-4">
						{activeAlarms.map((alarm) => (
							<Card
								key={alarm.id}
								className={cn(
									"border-l-4 transition-all duration-300 hover:shadow-lg",
									alarm.severity === "critical"
										? "border-l-red-500 bg-red-50"
										: alarm.severity === "high"
										? "border-l-orange-500 bg-orange-50"
										: alarm.severity === "medium"
										? "border-l-yellow-500 bg-yellow-50"
										: "border-l-green-500 bg-green-50"
								)}>
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="relative">
													{getStatusIcon(alarm.status)}
													{alarm.severity === "critical" && (
														<div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
													)}
												</div>
												<div>
													<h4 className="font-semibold text-lg">
														{alarm.type}
													</h4>
													<p className="text-gray-600 flex items-center font-medium">
														<MapPin className="h-4 w-4 mr-1" />
														{alarm.branch.name} - {alarm.location}
													</p>
													<p className="text-gray-500 text-sm flex items-center mt-1">
														<Calendar className="h-3 w-3 mr-1" />
														{getTimeAgo(alarm.createdAt)} • Created by{" "}
														{alarm.createdBy.name}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Badge
													className={cn(
														"text-sm px-3 py-1 font-medium border",
														getSeverityColor(alarm.severity),
														alarm.severity === "critical" && "animate-pulse"
													)}>
													{alarm.severity.toUpperCase()}
												</Badge>
												<Badge
													variant="outline"
													className="text-red-600 border-red-200 bg-red-50">
													ACTIVE
												</Badge>
											</div>
										</div>

										<div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
											<p className="text-gray-800">{alarm.description}</p>
											{alarm.additionalNotes && (
												<p className="text-gray-600 text-sm mt-2">
													<strong>Additional Notes:</strong>{" "}
													{alarm.additionalNotes}
												</p>
											)}
										</div>

										<div className="flex items-center space-x-2">
											<Button
												size="sm"
												onClick={() => acknowledgeAlarm(alarm.id)}
												disabled={updating}
												className={cn(
													"bg-yellow-600 hover:bg-yellow-700 text-white font-medium",
													alarm.severity === "critical" && "animate-pulse"
												)}>
												{updating ? (
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												) : (
													<Clock className="h-4 w-4 mr-2" />
												)}
												Acknowledge
											</Button>
											<Dialog>
												<DialogTrigger asChild>
													<Button variant="outline" size="sm">
														<Eye className="h-4 w-4 mr-2" />
														View Details
													</Button>
												</DialogTrigger>
												<DialogContent className="max-w-2xl">
													<DialogHeader>
														<DialogTitle>
															Alarm Details - {alarm.type}
														</DialogTitle>
														<DialogDescription>
															Complete information about this security alarm
														</DialogDescription>
													</DialogHeader>
													<div className="space-y-4">
														<div className="grid grid-cols-2 gap-4">
															<div>
																<Label className="text-sm font-medium">
																	Alarm ID
																</Label>
																<p className="text-sm">{alarm.id}</p>
															</div>
															<div>
																<Label className="text-sm font-medium">
																	Type
																</Label>
																<p className="text-sm">{alarm.type}</p>
															</div>
															<div>
																<Label className="text-sm font-medium">
																	Location
																</Label>
																<p className="text-sm">
																	{alarm.branch.name} - {alarm.location}
																</p>
															</div>
															<div>
																<Label className="text-sm font-medium">
																	Severity
																</Label>
																<Badge
																	className={getSeverityColor(alarm.severity)}>
																	{alarm.severity}
																</Badge>
															</div>
															<div>
																<Label className="text-sm font-medium">
																	Created By
																</Label>
																<p className="text-sm">
																	{alarm.createdBy.name}
																</p>
															</div>
															<div>
																<Label className="text-sm font-medium">
																	Created At
																</Label>
																<p className="text-sm">
																	{formatDateTime(alarm.createdAt)}
																</p>
															</div>
														</div>
														<div>
															<Label className="text-sm font-medium">
																Description
															</Label>
															<p className="text-sm mt-1 p-3 bg-gray-50 rounded">
																{alarm.description}
															</p>
														</div>
														{alarm.additionalNotes && (
															<div>
																<Label className="text-sm font-medium">
																	Additional Notes
																</Label>
																<p className="text-sm mt-1 p-3 bg-gray-50 rounded">
																	{alarm.additionalNotes}
																</p>
															</div>
														)}
													</div>
												</DialogContent>
											</Dialog>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
						{activeAlarms.length === 0 && (
							<Card className="border-2 border-green-200 bg-green-50">
								<CardContent className="p-8 text-center">
									<Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
									<h3 className="text-xl font-semibold text-green-800 mb-2">
										No Active Alarms
									</h3>
									<p className="text-green-600">
										All security systems are operating normally
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				<TabsContent value="acknowledged" className="space-y-4">
					<div className="grid gap-4">
						{acknowledgedAlarms.map((alarm) => (
							<Card
								key={alarm.id}
								className="border-l-4 border-l-yellow-500 bg-yellow-50">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												{getStatusIcon(alarm.status)}
												<div>
													<h4 className="font-medium">{alarm.type}</h4>
													<p className="text-sm text-gray-500 flex items-center">
														<MapPin className="h-3 w-3 mr-1" />
														{alarm.branch.name} - {alarm.location}
													</p>
													<p className="text-xs text-gray-400 flex items-center mt-1">
														<Calendar className="h-3 w-3 mr-1" />
														Acknowledged{" "}
														{alarm.acknowledgedAt
															? getTimeAgo(alarm.acknowledgedAt)
															: ""}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Badge className={getSeverityColor(alarm.severity)}>
													{alarm.severity}
												</Badge>
												<Badge
													variant="outline"
													className="text-yellow-600 border-yellow-200">
													Acknowledged
												</Badge>
											</div>
										</div>

										<div className="bg-white p-3 rounded-lg border">
											<p className="text-sm">{alarm.description}</p>
										</div>

										<div className="flex items-center space-x-2">
											<Button
												size="sm"
												onClick={() => {
													setSelectedAlarm(alarm);
													setIsResolutionDialogOpen(true);
												}}
												disabled={updating}
												className="bg-green-600 hover:bg-green-700">
												<CheckCircle className="h-4 w-4 mr-2" />
												Mark Completed
											</Button>
											<Button variant="outline" size="sm">
												<Eye className="h-4 w-4 mr-2" />
												View Details
											</Button>
											<Button variant="outline" size="sm">
												<MessageSquare className="h-4 w-4 mr-2" />
												Add Note
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="completed" className="space-y-4">
					<div className="grid gap-4">
						{completedAlarms.map((alarm) => (
							<Card
								key={alarm.id}
								className="border-l-4 border-l-green-500 bg-green-50">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												{getStatusIcon(alarm.status)}
												<div>
													<h4 className="font-medium">{alarm.type}</h4>
													<p className="text-sm text-gray-500 flex items-center">
														<MapPin className="h-3 w-3 mr-1" />
														{alarm.branch.name} - {alarm.location}
													</p>
													<p className="text-xs text-gray-400 flex items-center mt-1">
														<Calendar className="h-3 w-3 mr-1" />
														Completed{" "}
														{alarm.completedAt
															? getTimeAgo(alarm.completedAt)
															: ""}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Badge className={getSeverityColor(alarm.severity)}>
													{alarm.severity}
												</Badge>
												<Badge
													variant="outline"
													className="text-green-600 border-green-200">
													Completed
												</Badge>
											</div>
										</div>

										<div className="bg-white p-3 rounded-lg border">
											<p className="text-sm">{alarm.description}</p>
										</div>

										{alarm.resolutionDescription && (
											<div className="bg-green-50 p-3 rounded-lg border border-green-200">
												<Label className="text-sm font-medium text-green-800">
													Resolution
												</Label>
												<p className="text-sm text-green-700 mt-1">
													{alarm.resolutionDescription}
												</p>
											</div>
										)}

										<div className="flex items-center space-x-2">
											<Button variant="outline" size="sm">
												<Eye className="h-4 w-4 mr-2" />
												View Details
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="all" className="space-y-4">
					<div className="grid gap-4">
						{filteredAlarms.map((alarm) => (
							<Card
								key={alarm.id}
								className={cn(
									"border-l-4 transition-all duration-300 hover:shadow-lg",
									alarm.status === "ACTIVE" && alarm.severity === "critical"
										? "border-l-red-500 bg-red-50"
										: alarm.status === "ACTIVE" && alarm.severity === "high"
										? "border-l-orange-500 bg-orange-50"
										: alarm.status === "ACTIVE"
										? "border-l-yellow-500 bg-yellow-50"
										: alarm.status === "acknowledged"
										? "border-l-yellow-500 bg-yellow-50"
										: "border-l-green-500 bg-green-50"
								)}>
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												{getStatusIcon(alarm.status)}
												<div>
													<h4 className="font-medium">{alarm.type}</h4>
													<p className="text-sm text-gray-500 flex items-center">
														<MapPin className="h-3 w-3 mr-1" />
														{alarm.branch.name} - {alarm.location}
													</p>
													<p className="text-xs text-gray-400 flex items-center mt-1">
														<Calendar className="h-3 w-3 mr-1" />
														{getTimeAgo(alarm.createdAt)} •{" "}
														{alarm.createdBy.name}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Badge className={getSeverityColor(alarm.severity)}>
													{alarm.severity}
												</Badge>
												<Badge
													variant="outline"
													className={
														alarm.status === "ACTIVE"
															? "text-red-600 border-red-200"
															: alarm.status === "acknowledged"
															? "text-yellow-600 border-yellow-200"
															: "text-green-600 border-green-200"
													}>
													{alarm.status}
												</Badge>
											</div>
										</div>

										<div className="bg-white p-3 rounded-lg border">
											<p className="text-sm">{alarm.description}</p>
										</div>

										<div className="flex items-center space-x-2">
											{alarm.status === "ACTIVE" && (
												<Button
													size="sm"
													onClick={() => acknowledgeAlarm(alarm.id)}
													disabled={updating}
													className="bg-yellow-600 hover:bg-yellow-700 text-white">
													<Clock className="h-4 w-4 mr-2" />
													Acknowledge
												</Button>
											)}
											<Button variant="outline" size="sm">
												<Eye className="h-4 w-4 mr-2" />
												View Details
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* Resolution Dialog */}
			<Dialog
				open={isResolutionDialogOpen}
				onOpenChange={setIsResolutionDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Complete Alarm Resolution</DialogTitle>
						<DialogDescription>
							Provide a detailed description of how this alarm was resolved.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="resolution">Resolution Description *</Label>
							<Textarea
								id="resolution"
								placeholder="Describe how the alarm was resolved, actions taken, and final outcome..."
								value={resolutionDescription}
								onChange={(e) => setResolutionDescription(e.target.value)}
								rows={4}
							/>
						</div>
					</div>
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsResolutionDialogOpen(false)}
							disabled={updating}>
							Cancel
						</Button>
						<Button
							onClick={() =>
								selectedAlarm &&
								completeAlarm(selectedAlarm.id, resolutionDescription)
							}
							disabled={!resolutionDescription.trim() || updating}
							className="bg-green-600 hover:bg-green-700">
							{updating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Completing...
								</>
							) : (
								"Complete Alarm"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
