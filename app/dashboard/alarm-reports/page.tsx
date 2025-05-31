"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { apiClient } from "@/lib/api";
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
} from "lucide-react";
import { apiService } from "@/lib/api-service";

interface Alarm {
	id: string;
	type: string;
	branchId: string;
	branch: {
		id: string;
		name: string;
	};
	location: string;
	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	additionalNotes?: string;
	createdBy: any;
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
	const { toast } = useToast();

	useEffect(() => {
		fetchAlarms();
	}, []);

	const fetchAlarms = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/alarms");
			console.log("Fetched alarms:", response);
			setAlarms(response as any);
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
				status: "acknowledged".toUpperCase(),
				acknowledgedAt: new Date().toISOString(),
			});

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
				status: "resolved".toUpperCase(),
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
				return "bg-red-100 text-red-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "medium":
				return "bg-yellow-100 text-yellow-800";
			case "low":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active":
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

		if (diffInMinutes < 60) {
			return `${diffInMinutes} minutes ago`;
		} else if (diffInMinutes < 1440) {
			return `${Math.floor(diffInMinutes / 60)} hours ago`;
		} else {
			return `${Math.floor(diffInMinutes / 1440)} days ago`;
		}
	};

	const activeAlarms = alarms.filter((alarm) => alarm.status === "ACTIVE");
	const acknowledgedAlarms = alarms.filter(
		(alarm) => alarm.status === "ACKNOWLEDGED"
	);
	const completedAlarms = alarms.filter((alarm) => alarm.status === "RESOLVED");

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
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Alarm Reports</h1>
				<p className="text-muted-foreground">
					Monitor and manage security alarms from office managers and operators
				</p>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{activeAlarms.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Require immediate attention
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
						<Clock className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{acknowledgedAlarms.length}
						</div>
						<p className="text-xs text-muted-foreground">In progress</p>
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
						<div className="text-2xl font-bold text-green-600">
							{completedAlarms.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Successfully resolved
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Alarms</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{alarms.length}</div>
						<p className="text-xs text-muted-foreground">All time</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="active" className="space-y-4">
				<TabsList>
					<TabsTrigger value="active">
						Active Alarms ({activeAlarms.length})
					</TabsTrigger>
					<TabsTrigger value="acknowledged">
						Acknowledged ({acknowledgedAlarms.length})
					</TabsTrigger>
					<TabsTrigger value="completed">
						Completed ({completedAlarms.length})
					</TabsTrigger>
					<TabsTrigger value="all">All Alarms</TabsTrigger>
				</TabsList>

				<TabsContent value="active" className="space-y-4">
					<div className="grid gap-4">
						{activeAlarms.map((alarm) => (
							<Card key={alarm.id} className="border-l-4 border-l-red-500">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												{getStatusIcon(alarm.status)}
												<div>
													<h4 className="font-medium">{alarm.type}</h4>
													<p className="text-sm text-gray-500 flex items-center">
														<MapPin className="h-3 w-3 mr-1" />
														{(alarm as any)?.branch.name} - {alarm.location}
													</p>
													<p className="text-xs text-gray-400 flex items-center mt-1">
														<Calendar className="h-3 w-3 mr-1" />
														{getTimeAgo(alarm.createdAt)} • Created by{" "}
														{alarm?.createdBy?.name || "Unknown"}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Badge className={getSeverityColor(alarm.severity)}>
													{alarm.severity}
												</Badge>
												<Badge
													variant="outline"
													className="text-red-600 border-red-200">
													Active
												</Badge>
											</div>
										</div>

										<div className="bg-gray-50 p-3 rounded-lg">
											<p className="text-sm">{alarm.description}</p>
											{alarm.additionalNotes && (
												<p className="text-xs text-gray-600 mt-2">
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
												className="bg-yellow-600 hover:bg-yellow-700">
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
																	{(alarm as any).branch.name} -{" "}
																	{alarm.location}
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
																	{alarm.createdBy?.name || "Unknown"}
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
					</div>
				</TabsContent>

				<TabsContent value="acknowledged" className="space-y-4">
					<div className="grid gap-4">
						{acknowledgedAlarms.map((alarm) => (
							<Card key={alarm.id} className="border-l-4 border-l-yellow-500">
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

										<div className="bg-gray-50 p-3 rounded-lg">
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
							<Card key={alarm.id} className="border-l-4 border-l-green-500">
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

										<div className="bg-gray-50 p-3 rounded-lg">
											<p className="text-sm">{alarm.description}</p>
										</div>

										{alarm.resolutionDescription && (
											<div className="bg-green-50 p-3 rounded-lg">
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
						{alarms.map((alarm) => (
							<Card
								key={alarm.id}
								className={`border-l-4 ${
									alarm.status === "ACTIVE"
										? "border-l-red-500"
										: alarm.status === "ACKNOWLEDGED"
										? "border-l-yellow-500"
										: "border-l-green-500"
								}`}>
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
														{alarm.createdBy?.name || "Unknown"} •{" "}
														{formatDateTime(alarm.createdAt)}
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
															: alarm.status === "ACKNOWLEDGED"
															? "text-yellow-600 border-yellow-200"
															: "text-green-600 border-green-200"
													}>
													{alarm.status}
												</Badge>
											</div>
										</div>

										<div className="bg-gray-50 p-3 rounded-lg">
											<p className="text-sm">{alarm.description}</p>
										</div>

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
