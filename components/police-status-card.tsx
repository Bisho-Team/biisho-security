"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
	Users,
	Shield,
	Wifi,
	WifiOff,
	RefreshCw,
	Clock,
	Activity,
	UserCheck,
	UserX,
	Radio,
	AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicePersonnel {
	id: string;
	name: string;
	email: string;
	role: string;
	operatorType?: string;
	isOnline: boolean;
	lastSeen?: string;
	connectedAt?: string;
}

interface ConnectionStatusData {
	connectedPolice: Array<{
		userId: string;
		role: string;
		operatorType?: string;
		connectedAt: string;
		lastSeen: string;
	}>;
	stats: {
		total: number;
		policeManagers: number;
		policeOperators: number;
		officeOperators: number;
		others: number;
	};
	timestamp: string;
}

interface PoliceStatusCardProps {
	onConnectionStatusUpdate?: (data: ConnectionStatusData) => void;
}

export function PoliceStatusCard({
	onConnectionStatusUpdate,
}: PoliceStatusCardProps) {
	const [policePersonnel, setPolicePersonnel] = useState<PolicePersonnel[]>([]);
	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatusData | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
	const { toast } = useToast();

	// Load initial police personnel data
	const loadPolicePersonnel = async () => {
		try {
			setLoading(true);
			const response = await apiClient.getPoliceManagerandOperatorStatus();
			console.log({
				policeResonse: response,
			});
			const personnel = response.users || [];

			// Initialize with offline status
			const personnelWithStatus = personnel.map((person: any) => ({
				...person,
				isOnline: false,
				lastSeen: null,
				connectedAt: null,
			}));

			setPolicePersonnel(personnelWithStatus);
			console.log("👮 Loaded police personnel:", personnelWithStatus.length);
		} catch (error) {
			console.error("Failed to load police personnel:", error);
			toast({
				title: "Error",
				description: "Failed to load police personnel data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Update online status based on WebSocket connection data
	const updateOnlineStatus = (statusData: ConnectionStatusData) => {
		setConnectionStatus(statusData);
		setLastUpdate(new Date());

		// Create a set of connected user IDs for quick lookup
		const connectedUserIds = new Set(
			statusData.connectedPolice.map((cp) => cp.userId)
		);

		// Update personnel online status
		setPolicePersonnel((prev) =>
			prev.map((person) => {
				const connectionInfo = statusData.connectedPolice.find(
					(cp) => cp.userId === person.id
				);
				return {
					...person,
					isOnline: connectedUserIds.has(person.id),
					lastSeen: connectionInfo?.lastSeen || person.lastSeen,
					connectedAt: connectionInfo?.connectedAt || person.connectedAt,
				};
			})
		);

		// Notify parent component
		onConnectionStatusUpdate?.(statusData);

		console.log("📊 Updated police personnel online status:", {
			total: statusData.stats.total,
			policeOnline: statusData.connectedPolice.length,
		});
	};

	// Manual refresh function
	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await loadPolicePersonnel();
			toast({
				title: "Refreshed",
				description: "Police personnel data updated",
			});
		} catch (error) {
			toast({
				title: "Refresh Failed",
				description: "Could not refresh personnel data",
				variant: "destructive",
			});
		} finally {
			setRefreshing(false);
		}
	};

	// Load initial data
	useEffect(() => {
		loadPolicePersonnel();
	}, []);

	// Expose the update function for parent component to call
	useEffect(() => {
		// This effect allows parent component to update status via props
		if (onConnectionStatusUpdate) {
			// Store the update function globally so parent can call it
			(window as any).updatePoliceStatus = updateOnlineStatus;
		}
	}, [onConnectionStatusUpdate]);

	// Calculate statistics
	const stats = {
		total: policePersonnel.length,
		online: policePersonnel.filter((p) => p.isOnline).length,
		offline: policePersonnel.filter((p) => !p.isOnline).length,
		managers: policePersonnel.filter((p) => p.role === "POLICE_MANAGER").length,
		operators: policePersonnel.filter(
			(p) => p.role === "OPERATOR" && p.operatorType === "POLICE"
		).length,
		managersOnline: policePersonnel.filter(
			(p) => p.role === "POLICE_MANAGER" && p.isOnline
		).length,
		operatorsOnline: policePersonnel.filter(
			(p) => p.role === "OPERATOR" && p.operatorType === "POLICE" && p.isOnline
		).length,
	};

	if (loading) {
		return (
			<Card className="bg-slate-900/50 border-slate-700">
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Users className="h-5 w-5 text-blue-400" />
						<span>Police Status</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="h-16 bg-slate-800 rounded-lg animate-pulse"
							/>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="bg-slate-900/50 border-slate-700">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center space-x-2">
						<Users className="h-5 w-5 text-blue-400" />
						<span>Police Status</span>
						<Badge
							variant="outline"
							className="border-slate-600 text-slate-300">
							{stats.online}/{stats.total}
						</Badge>
					</CardTitle>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Statistics Overview */}
				<div className="grid grid-cols-2 gap-3">
					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
						<div className="flex items-center space-x-2">
							<UserCheck className="h-4 w-4 text-green-400" />
							<div>
								<p className="text-xs text-green-300">Online</p>
								<p className="text-lg font-bold text-green-400">
									{stats.online}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
						<div className="flex items-center space-x-2">
							<UserX className="h-4 w-4 text-red-400" />
							<div>
								<p className="text-xs text-red-300">Offline</p>
								<p className="text-lg font-bold text-red-400">
									{stats.offline}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Role-based Statistics */}
				<div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Shield className="h-4 w-4 text-purple-400" />
							<span className="text-sm text-slate-300">Police Managers</span>
						</div>
						<Badge
							className={cn(
								"text-xs",
								stats.managersOnline > 0
									? "bg-green-600 text-white"
									: "bg-slate-600 text-slate-300"
							)}>
							{stats.managersOnline}/{stats.managers}
						</Badge>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Radio className="h-4 w-4 text-blue-400" />
							<span className="text-sm text-slate-300">Police Operators</span>
						</div>
						<Badge
							className={cn(
								"text-xs",
								stats.operatorsOnline > 0
									? "bg-green-600 text-white"
									: "bg-slate-600 text-slate-300"
							)}>
							{stats.operatorsOnline}/{stats.operators}
						</Badge>
					</div>
				</div>

				<Separator className="bg-slate-700" />

				{/* Personnel List */}
				<div className="space-y-2 max-h-64 overflow-y-auto">
					<h4 className="text-sm font-medium text-slate-400 mb-2">
						Personnel List
					</h4>

					{policePersonnel.length === 0 ? (
						<div className="text-center py-4">
							<AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
							<p className="text-slate-400 text-sm">
								No police personnel found
							</p>
						</div>
					) : (
						policePersonnel.map((person) => (
							<div
								key={person.id}
								className={cn(
									"flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
									person.isOnline
										? "bg-green-900/10 border-green-500/20 hover:bg-green-900/20"
										: "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
								)}>
								<div className="flex items-center space-x-3">
									<div className="relative">
										<div
											className={cn(
												"w-8 h-8 rounded-full flex items-center justify-center",
												person.role === "POLICE_MANAGER"
													? "bg-purple-600/20"
													: "bg-blue-600/20"
											)}>
											{person.role === "POLICE_MANAGER" ? (
												<Shield className="h-4 w-4 text-purple-400" />
											) : (
												<Radio className="h-4 w-4 text-blue-400" />
											)}
										</div>
										{/* Online indicator */}
										<div
											className={cn(
												"absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900",
												person.isOnline ? "bg-green-500" : "bg-slate-500"
											)}
										/>
									</div>

									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-white truncate">
											{person.name}
										</p>
										<div className="flex items-center space-x-2">
											<p className="text-xs text-slate-400">
												{person.role === "POLICE_MANAGER"
													? "Manager"
													: "Operator"}
												{person.operatorType && ` (${person.operatorType})`}
											</p>
										</div>
									</div>
								</div>

								<div className="flex items-center space-x-2">
									{person.isOnline ? (
										<div className="flex items-center space-x-1">
											<Wifi className="h-3 w-3 text-green-400" />
											<Badge className="bg-green-600 text-white text-xs">
												Online
											</Badge>
										</div>
									) : (
										<div className="flex items-center space-x-1">
											<WifiOff className="h-3 w-3 text-slate-400" />
											<Badge
												variant="outline"
												className="border-slate-600 text-slate-400 text-xs">
												Offline
											</Badge>
										</div>
									)}
								</div>
							</div>
						))
					)}
				</div>

				{/* Last Update Info */}
				{lastUpdate && (
					<div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-700">
						<Clock className="h-3 w-3" />
						<span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
					</div>
				)}

				{/* Connection Status Info */}
				{connectionStatus && (
					<div className="bg-slate-800/20 rounded-lg p-2">
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-400">Police Status:</span>
							<div className="flex items-center space-x-1">
								<Activity className="h-3 w-3 text-green-400" />
								<span className="text-green-400">Connected</span>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
