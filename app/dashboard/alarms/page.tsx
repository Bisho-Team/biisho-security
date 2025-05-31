"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertTriangle,
	Plus,
	Clock,
	CheckCircle,
	Send,
	Eye,
	Filter,
	Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

// const mockAlarms = [
// 	{
// 		id: "1",
// 		type: "Motion Detection",
// 		location: "Main Entrance",
// 		branch: "Downtown Office",
// 		status: "active",
// 		time: "2 minutes ago",
// 		severity: "high",
// 		dispatchedTo: "Captain Johnson",
// 	},
// 	{
// 		id: "2",
// 		type: "Door Breach",
// 		location: "Server Room",
// 		branch: "North Branch",
// 		status: "dispatched",
// 		time: "15 minutes ago",
// 		severity: "critical",
// 		dispatchedTo: "Lieutenant Wilson",
// 	},
// 	{
// 		id: "3",
// 		type: "Window Sensor",
// 		location: "Office 201",
// 		branch: "Downtown Office",
// 		status: "resolved",
// 		time: "1 hour ago",
// 		severity: "medium",
// 		dispatchedTo: "Captain Johnson",
// 	},
// 	{
// 		id: "4",
// 		type: "Fire Alarm",
// 		location: "Kitchen Area",
// 		branch: "South Branch",
// 		status: "acknowledged",
// 		time: "2 hours ago",
// 		severity: "critical",
// 		dispatchedTo: "Captain Brown",
// 	},
// ];

// const alarmHistory = [
// 	{
// 		id: "5",
// 		type: "Motion Detection",
// 		location: "Parking Lot",
// 		branch: "East Branch",
// 		status: "resolved",
// 		time: "Yesterday 14:30",
// 		severity: "low",
// 		dispatchedTo: "Lieutenant Davis",
// 		resolvedTime: "15 minutes",
// 	},
// 	{
// 		id: "6",
// 		type: "Panic Button",
// 		location: "Reception",
// 		branch: "Downtown Office",
// 		status: "resolved",
// 		time: "Yesterday 09:15",
// 		severity: "high",
// 		dispatchedTo: "Captain Johnson",
// 		resolvedTime: "8 minutes",
// 	},
// ];

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
	resolvedTime?: string; // optional, only present in alarm history
}

export default function AlarmsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [mockAlarms, setMockAlarms] = useState([] as Alarm[]);
	const [loading, setLoading] = useState(true);
	const [alarmHistory, setAlarmHistory] = useState([] as Alarm[]);
	const [filterStatus, setFilterStatus] = useState("all");
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
			setMockAlarms(response as any);
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
			setLoading(true);
			const response = await apiService.get("/alarms");
			console.log("Fetched alarms:", response);
			setAlarmHistory(response as any);
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
				return "bg-red-100 text-red-800";
			case "DISPATCHED":
				return "bg-blue-100 text-blue-800";
			case "ACKNOWLEDGED":
				return "bg-yellow-100 text-yellow-800";
			case "RESOLVED":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Alarm Management
					</h1>
					<p className="text-muted-foreground">
						Monitor and manage security alarms across all branches
					</p>
				</div>
				<Link href="/dashboard/configure-alarm">
					<Button className="bg-red-600 hover:bg-red-700">
						<Plus className="h-4 w-4 mr-2" />
						Configure New Alarm
					</Button>
				</Link>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-500" />
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
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Dispatched</CardTitle>
						<Send className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{mockAlarms.filter((a) => a.status === "DISPATCHED").length}
						</div>
						<p className="text-xs text-muted-foreground">Sent to police</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
						<Clock className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{mockAlarms.filter((a) => a.status === "ACKNOWLEDGED").length}
						</div>
						<p className="text-xs text-muted-foreground">Being handled</p>
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
							{mockAlarms.filter((a) => a.status === "RESOLVED").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Successfully handled
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Alarm Management Tabs */}
			<Tabs defaultValue="active" className="space-y-4">
				<div className="flex justify-between items-center">
					<TabsList>
						<TabsTrigger value="active">Active Alarms</TabsTrigger>
						<TabsTrigger value="history">Alarm History</TabsTrigger>
					</TabsList>
					<div className="flex space-x-2">
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search alarms..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8 w-64"
							/>
						</div>
						<Button variant="outline">
							<Filter className="h-4 w-4 mr-2" />
							Filter
						</Button>
					</div>
				</div>

				<TabsContent value="active" className="space-y-4">
					<div className="grid gap-4">
						{mockAlarms.map((alarm) => (
							<Card key={alarm.id}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											{getStatusIcon(alarm.status)}
											<div>
												<h4 className="font-medium">{alarm.type}</h4>
												<p className="text-sm text-gray-500">
													{alarm.location} • {alarm.branch.name}
												</p>
												<p className="text-xs text-gray-400">{alarm.time}</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Badge className={getSeverityColor(alarm.severity)}>
												{alarm.severity}
											</Badge>
											<Badge className={getStatusColor(alarm.status)}>
												{alarm.status}
											</Badge>
											<div className="text-right text-xs text-gray-500">
												<p>Dispatched to:</p>
												<p className="font-medium">
													{alarm.reports[0].assignedTo.name}
												</p>
											</div>
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

				<TabsContent value="history" className="space-y-4">
					<div className="grid gap-4">
						{alarmHistory.map((alarm) => (
							<Card key={alarm.id}>
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											{getStatusIcon(alarm.status)}
											<div>
												<h4 className="font-medium">{alarm.type}</h4>
												<p className="text-sm text-gray-500">
													{alarm.location} • {alarm.branch.name}
												</p>
												<p className="text-xs text-gray-400">{alarm.time}</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Badge className={getSeverityColor(alarm.severity)}>
												{alarm.severity}
											</Badge>
											<Badge className={getStatusColor(alarm.status)}>
												{alarm.status}
											</Badge>
											<div className="text-right text-xs text-gray-500">
												<p>Resolved in:</p>
												<p className="font-medium text-green-600">
													{alarm.resolvedTime}
												</p>
											</div>
											<Button variant="outline" size="sm">
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
		</div>
	);
}
