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
	Building2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Personnel {
	id: string;
	name: string;
	email: string;
	role: string;
	operatorType?: string;
	isOnline: boolean;
	lastSeen?: string;
	connectedAt?: string;
	company?: {
		id: string;
		name: string;
		type: string;
		status: string;
	};
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

interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

interface TotalStats {
	total: number;
	online: number;
	offline: number;
}

interface PersonnelStatusCardProps {
	onConnectionStatusUpdate?: (data: ConnectionStatusData) => void;
}

export function PersonnelStatusCard({
	onConnectionStatusUpdate,
}: PersonnelStatusCardProps) {
	const [policePersonnel, setPolicePersonnel] = useState<Personnel[]>([]);
	const [officePersonnel, setOfficePersonnel] = useState<Personnel[]>([]);
	const [policeTotalStats, setPoliceTotalStats] = useState<TotalStats>({
		total: 0,
		online: 0,
		offline: 0,
	});
	const [officeTotalStats, setOfficeTotalStats] = useState<TotalStats>({
		total: 0,
		online: 0,
		offline: 0,
	});
	const [activeTab, setActiveTab] = useState<"police" | "office">("police");
	const [policePagination, setPolicePagination] = useState<PaginationInfo>({
		page: 1,
		limit: 10,
		total: 0,
		pages: 0,
	});
	const [officePagination, setOfficePagination] = useState<PaginationInfo>({
		page: 1,
		limit: 10,
		total: 0,
		pages: 0,
	});
	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatusData | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
	const { toast } = useToast();

	const loadPersonnelData = async (tab: "police" | "office", page = 1) => {
		try {
			setLoading(true);
			if (tab === "police") {
				const response = await apiClient.getPoliceManagerandOperatorStatus(
					page,
					policePagination.limit
				);
				const personnelWithStatus = (response.users || []).map(
					(person: any) => {
						const connectionInfo = connectionStatus?.connectedPolice.find(
							(cp) => cp.userId === person.id
						);
						const isOnline = connectionStatus
							? connectionStatus.connectedPolice.some(
									(cp) => cp.userId === person.id
							  )
							: false;

						return {
							...person,
							isOnline,
							lastSeen: connectionInfo?.lastSeen || null,
							connectedAt: connectionInfo?.connectedAt || null,
						};
					}
				);

				setPolicePersonnel(personnelWithStatus);
				if (response.pagination) {
					setPolicePagination(response.pagination);
				}
				if (response.totalStats) {
					const policeOnlineCount = connectionStatus
						? connectionStatus.connectedPolice.filter(
								(cp) =>
									cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
						  ).length
						: response.totalStats.online;

					setPoliceTotalStats({
						total: response.totalStats.total,
						online: policeOnlineCount,
						offline: response.totalStats.total - policeOnlineCount,
					});
				}
			} else if (tab === "office") {
				const response = await apiClient.getOfficeOperatorStatus(
					page,
					officePagination.limit
				);
				console.log("response:", response);
				const personnelWithStatus = (response.users || []).map(
					(person: any) => {
						console.log("person:", person);
						console.log("connectionStatus:", connectionStatus);
						const connectionInfo = connectionStatus?.connectedPolice.find(
							(cp) => cp.userId === person.id && cp.operatorType === "OFFICE"
						);
						const isOnline = connectionStatus
							? connectionStatus.connectedPolice.some(
									(cp) =>
										cp.userId === person.id && cp.operatorType === "OFFICE"
							  )
							: false;

						return {
							...person,
							isOnline,
							lastSeen: connectionInfo?.lastSeen || null,
							connectedAt: connectionInfo?.connectedAt || null,
						};
					}
				);

				setOfficePersonnel(personnelWithStatus);
				if (response.pagination) {
					setOfficePagination(response.pagination);
				}
				if (response.totalStats) {
					const officeOnlineCount = connectionStatus
						? connectionStatus.connectedPolice.filter(
								(cp) => cp.operatorType === "OFFICE"
						  ).length
						: response.totalStats.online;

					setOfficeTotalStats({
						total: response.totalStats.total,
						online: officeOnlineCount,
						offline: response.totalStats.total - officeOnlineCount,
					});
				}
			}

			console.log(
				`Loaded ${tab} personnel page ${page}:`,
				tab === "police" ? policePersonnel.length : officePersonnel.length
			);
		} catch (error) {
			console.error(`Failed to load ${tab} personnel:`, error);
			toast({
				title: "Error",
				description: `Failed to load ${tab} personnel data`,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const updateOnlineStatus = (statusData: ConnectionStatusData) => {
		setConnectionStatus(statusData);
		setLastUpdate(new Date());

		const connectedPoliceUserIds = new Set(
			statusData.connectedPolice
				.filter(
					(cp) => cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
				)
				.map((cp) => cp.userId)
		);

		const connectedOfficeUserIds = new Set(
			statusData.connectedPolice
				.filter(
					(cp) => cp.operatorType === "OFFICE" || cp.role === "OFFICE_MANAGER"
				)
				.map((cp) => cp.userId)
		);

		const policeOnlineCount = connectedPoliceUserIds.size;
		const officeOnlineCount = connectedOfficeUserIds.size;

		setPoliceTotalStats((prev) => ({
			...prev,
			online: policeOnlineCount,
			offline: prev.total - policeOnlineCount,
		}));

		setOfficeTotalStats((prev) => ({
			...prev,
			online: officeOnlineCount,
			offline: prev.total - officeOnlineCount,
		}));

		if (policePersonnel.length > 0) {
			setPolicePersonnel((prev) =>
				prev.map((person) => {
					const connectionInfo = statusData.connectedPolice.find(
						(cp) =>
							cp.userId === person.id &&
							(cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER")
					);
					return {
						...person,
						isOnline: connectedPoliceUserIds.has(person.id),
						lastSeen: connectionInfo?.lastSeen || person.lastSeen,
						connectedAt: connectionInfo?.connectedAt || person.connectedAt,
					};
				})
			);
		}

		if (officePersonnel.length > 0) {
			setOfficePersonnel((prev) =>
				prev.map((person) => {
					const connectionInfo = statusData.connectedPolice.find(
						(cp) =>
							cp.userId === person.id &&
							(cp.operatorType === "OFFICE" || cp.role === "OFFICE_MANAGER")
					);
					return {
						...person,
						isOnline: connectedOfficeUserIds.has(person.id),
						lastSeen: connectionInfo?.lastSeen || person.lastSeen,
						connectedAt: connectionInfo?.connectedAt || person.connectedAt,
					};
				})
			);
		}

		onConnectionStatusUpdate?.(statusData);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await loadPersonnelData(
				activeTab,
				activeTab === "police" ? policePagination.page : officePagination.page
			);
			toast({
				title: "Refreshed",
				description: "Personnel data updated",
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

	const handleTabChange = async (tab: "police" | "office") => {
		setActiveTab(tab);
		if (
			(tab === "police" && policePersonnel.length === 0) ||
			(tab === "office" && officePersonnel.length === 0)
		) {
			await loadPersonnelData(tab, 1);
		}
	};

	const handlePageChange = async (direction: "prev" | "next") => {
		const currentPagination =
			activeTab === "police" ? policePagination : officePagination;
		const newPage =
			direction === "next"
				? currentPagination.page + 1
				: currentPagination.page - 1;

		if (newPage >= 1 && newPage <= currentPagination.pages) {
			if (activeTab === "police") {
				setPolicePagination((prev) => ({ ...prev, page: newPage }));
			} else {
				setOfficePagination((prev) => ({ ...prev, page: newPage }));
			}

			await loadPersonnelData(activeTab, newPage);
		}
	};

	useEffect(() => {
		loadPersonnelData("police", 1);
	}, []);

	useEffect(() => {
		if (onConnectionStatusUpdate) {
			(window as any).updatePoliceStatus = updateOnlineStatus;
		}
	}, [onConnectionStatusUpdate]);

	const currentPersonnel =
		activeTab === "police" ? policePersonnel : officePersonnel;
	const currentPagination =
		activeTab === "police" ? policePagination : officePagination;
	const currentTotalStats =
		activeTab === "police" ? policeTotalStats : officeTotalStats;

	const stats = {
		total: currentTotalStats.total,
		online: currentTotalStats.online,
		offline: currentTotalStats.offline,
		totalRecords: currentPagination.total,
	};

	if (loading) {
		return (
			<Card className="bg-slate-900/50 border-slate-700">
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Users className="h-5 w-5 text-blue-400" />
						<span>Personnel Status</span>
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
						<span>Personnel Status</span>
						<Badge
							variant="outline"
							className="border-slate-600 text-slate-300">
							{stats.online}/{stats.total}
						</Badge>
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleRefresh}
						disabled={refreshing}
						className="text-slate-400 hover:text-white">
						<RefreshCw
							className={cn("h-4 w-4", refreshing && "animate-spin")}
						/>
					</Button>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex space-x-1 bg-slate-800/30 p-1 rounded-lg">
					<button
						onClick={() => handleTabChange("police")}
						className={cn(
							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
							activeTab === "police"
								? "bg-blue-600 text-white shadow-sm"
								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
						)}>
						<Shield className="h-4 w-4" />
						<span>Police Personnel</span>
					</button>
					<button
						onClick={() => handleTabChange("office")}
						className={cn(
							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
							activeTab === "office"
								? "bg-orange-600 text-white shadow-sm"
								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
						)}>
						<Building2 className="h-4 w-4" />
						<span>Office Operators</span>
					</button>
				</div>

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

				<Separator className="bg-slate-700" />

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium text-slate-400">
							{activeTab === "police" ? "Police Personnel" : "Office Operators"}
						</h4>
						<div className="text-xs text-slate-500">
							Total: {stats.totalRecords} records
						</div>
					</div>

					<div className="max-h-64 overflow-y-auto space-y-2">
						{currentPersonnel.length === 0 ? (
							<div className="text-center py-4">
								<AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
								<p className="text-slate-400 text-sm">No personnel found</p>
							</div>
						) : (
							currentPersonnel.map((person) => (
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
														: person.operatorType === "POLICE"
														? "bg-blue-600/20"
														: "bg-orange-600/20"
												)}>
												{person.role === "POLICE_MANAGER" ? (
													<Shield className="h-4 w-4 text-purple-400" />
												) : person.operatorType === "POLICE" ? (
													<Radio className="h-4 w-4 text-blue-400" />
												) : (
													<Building2 className="h-4 w-4 text-orange-400" />
												)}
											</div>
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
														? "Police Manager"
														: person.operatorType === "POLICE"
														? "Police Operator"
														: "Office Operator"}
												</p>
												{person.operatorType === "OFFICE" && person.company && (
													<span className="text-xs text-slate-500">
														• {person.company.name}
													</span>
												)}
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

					{currentPagination.pages > 1 && (
						<div className="flex items-center justify-between pt-2 border-t border-slate-700">
							<div className="text-xs text-slate-500">
								Page {currentPagination.page} of {currentPagination.pages}
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handlePageChange("prev")}
									disabled={currentPagination.page <= 1}
									className="text-slate-400 hover:text-white disabled:opacity-50">
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handlePageChange("next")}
									disabled={currentPagination.page >= currentPagination.pages}
									className="text-slate-400 hover:text-white disabled:opacity-50">
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</div>

				{lastUpdate && (
					<div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-700">
						<Clock className="h-3 w-3" />
						<span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
					</div>
				)}

				{connectionStatus && (
					<div className="bg-slate-800/20 rounded-lg p-2">
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-400">System Status:</span>
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

// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import { apiClient } from "@/lib/api";
// import {
// 	Users,
// 	Shield,
// 	Wifi,
// 	WifiOff,
// 	RefreshCw,
// 	Clock,
// 	Activity,
// 	UserCheck,
// 	UserX,
// 	Radio,
// 	AlertCircle,
// 	Building2,
// 	ChevronLeft,
// 	ChevronRight,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface Personnel {
// 	id: string;
// 	name: string;
// 	email: string;
// 	role: string;
// 	operatorType?: string;
// 	isOnline: boolean;
// 	lastSeen?: string;
// 	connectedAt?: string;
// 	company?: {
// 		id: string;
// 		name: string;
// 		type: string;
// 		status: string;
// 	};
// }

// interface ConnectionStatusData {
// 	connectedPolice: Array<{
// 		userId: string;
// 		role: string;
// 		operatorType?: string;
// 		connectedAt: string;
// 		lastSeen: string;
// 	}>;
// 	stats: {
// 		total: number;
// 		policeManagers: number;
// 		policeOperators: number;
// 		officeOperators: number;
// 		others: number;
// 	};
// 	timestamp: string;
// }

// interface PaginationInfo {
// 	page: number;
// 	limit: number;
// 	total: number;
// 	pages: number;
// }

// interface TotalStats {
// 	total: number;
// 	online: number;
// 	offline: number;
// }

// interface PersonnelStatusCardProps {
// 	onConnectionStatusUpdate?: (data: ConnectionStatusData) => void;
// }

// export function PersonnelStatusCard({
// 	onConnectionStatusUpdate,
// }: PersonnelStatusCardProps) {
// 	const [policePersonnel, setPolicePersonnel] = useState<Personnel[]>([]);
// 	const [officePersonnel, setOfficePersonnel] = useState<Personnel[]>([]);
// 	const [policeTotalStats, setPoliceTotalStats] = useState<TotalStats>({
// 		total: 0,
// 		online: 0,
// 		offline: 0,
// 	});
// 	const [officeTotalStats, setOfficeTotalStats] = useState<TotalStats>({
// 		total: 0,
// 		online: 0,
// 		offline: 0,
// 	});
// 	const [activeTab, setActiveTab] = useState<"police" | "office">("police");
// 	const [policePagination, setPolicePagination] = useState<PaginationInfo>({
// 		page: 1,
// 		limit: 10,
// 		total: 0,
// 		pages: 0,
// 	});
// 	const [officePagination, setOfficePagination] = useState<PaginationInfo>({
// 		page: 1,
// 		limit: 10,
// 		total: 0,
// 		pages: 0,
// 	});
// 	const [connectionStatus, setConnectionStatus] =
// 		useState<ConnectionStatusData | null>(null);
// 	const [loading, setLoading] = useState(true);
// 	const [refreshing, setRefreshing] = useState(false);
// 	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
// 	const { toast } = useToast();

// 	const loadPersonnelData = async (tab: "police" | "office", page = 1) => {
// 		try {
// 			setLoading(true);

// 			if (tab === "police") {
// 				const response = await apiClient.getPoliceManagerandOperatorStatus(
// 					page,
// 					policePagination.limit
// 				);
// 				const personnelWithStatus = (response.users || []).map(
// 					(person: any) => {
// 						const connectionInfo = connectionStatus?.connectedPolice.find(
// 							(cp) => cp.userId === person.id
// 						);
// 						const isOnline = connectionStatus
// 							? connectionStatus.connectedPolice.some(
// 									(cp) => cp.userId === person.id
// 							  )
// 							: false;

// 						return {
// 							...person,
// 							isOnline,
// 							lastSeen: connectionInfo?.lastSeen || null,
// 							connectedAt: connectionInfo?.connectedAt || null,
// 						};
// 					}
// 				);

// 				setPolicePersonnel(personnelWithStatus);
// 				if (response.pagination) {
// 					setPolicePagination(response.pagination);
// 				}
// 				if (response.totalStats) {
// 					const policeOnlineCount = connectionStatus
// 						? connectionStatus.connectedPolice.filter(
// 								(cp) =>
// 									cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
// 						  ).length
// 						: response.totalStats.online;

// 					setPoliceTotalStats({
// 						total: response.totalStats.total,
// 						online: policeOnlineCount,
// 						offline: response.totalStats.total - policeOnlineCount,
// 					});
// 				}
// 			} else {
// 				const response = await apiClient.getOfficeOperatorStatus(
// 					page,
// 					officePagination.limit
// 				);
// 				const personnelWithStatus = (response.users || []).map(
// 					(person: any) => {
// 						const connectionInfo = connectionStatus?.connectedPolice.find(
// 							(cp) => cp.userId === person.id
// 						);
// 						const isOnline = connectionStatus
// 							? connectionStatus.connectedPolice.some(
// 									(cp) => cp.userId === person.id
// 							  )
// 							: false;

// 						return {
// 							...person,
// 							isOnline,
// 							lastSeen: connectionInfo?.lastSeen || null,
// 							connectedAt: connectionInfo?.connectedAt || null,
// 						};
// 					}
// 				);

// 				setOfficePersonnel(personnelWithStatus);
// 				if (response.pagination) {
// 					setOfficePagination(response.pagination);
// 				}
// 				if (response.totalStats) {
// 					const officeOnlineCount = connectionStatus
// 						? connectionStatus.connectedPolice.filter(
// 								(cp) => cp.operatorType === "OFFICE"
// 						  ).length
// 						: response.totalStats.online;

// 					setOfficeTotalStats({
// 						total: response.totalStats.total,
// 						online: officeOnlineCount,
// 						offline: response.totalStats.total - officeOnlineCount,
// 					});
// 				}
// 			}

// 			console.log(
// 				`Loaded ${tab} personnel page ${page}:`,
// 				tab === "police" ? policePersonnel.length : officePersonnel.length
// 			);
// 		} catch (error) {
// 			console.error(`Failed to load ${tab} personnel:`, error);
// 			toast({
// 				title: "Error",
// 				description: `Failed to load ${tab} personnel data`,
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const updateOnlineStatus = (statusData: ConnectionStatusData) => {
// 		setConnectionStatus(statusData);
// 		setLastUpdate(new Date());

// 		const connectedUserIds = new Set(
// 			statusData.connectedPolice.map((cp) => cp.userId)
// 		);

// 		const policeOnlineCount = statusData.connectedPolice.filter(
// 			(cp) => cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
// 		).length;
// 		const officeOnlineCount = statusData.connectedPolice.filter(
// 			(cp) => cp.operatorType === "OFFICE"
// 		).length;

// 		setPoliceTotalStats((prev) => ({
// 			...prev,
// 			online: policeOnlineCount,
// 			offline: prev.total - policeOnlineCount,
// 		}));

// 		setOfficeTotalStats((prev) => ({
// 			...prev,
// 			online: officeOnlineCount,
// 			offline: prev.total - officeOnlineCount,
// 		}));

// 		if (activeTab === "police" && policePersonnel.length > 0) {
// 			setPolicePersonnel((prev) =>
// 				prev.map((person) => {
// 					const connectionInfo = statusData.connectedPolice.find(
// 						(cp) => cp.userId === person.id
// 					);
// 					return {
// 						...person,
// 						isOnline: connectedUserIds.has(person.id),
// 						lastSeen: connectionInfo?.lastSeen || person.lastSeen,
// 						connectedAt: connectionInfo?.connectedAt || person.connectedAt,
// 					};
// 				})
// 			);
// 		}

// 		if (activeTab === "office" && officePersonnel.length > 0) {
// 			setOfficePersonnel((prev) =>
// 				prev.map((person) => {
// 					const connectionInfo = statusData.connectedPolice.find(
// 						(cp) => cp.userId === person.id
// 					);
// 					return {
// 						...person,
// 						isOnline: connectedUserIds.has(person.id),
// 						lastSeen: connectionInfo?.lastSeen || person.lastSeen,
// 						connectedAt: connectionInfo?.connectedAt || person.connectedAt,
// 					};
// 				})
// 			);
// 		}

// 		onConnectionStatusUpdate?.(statusData);
// 	};

// 	const handleRefresh = async () => {
// 		setRefreshing(true);
// 		try {
// 			await loadPersonnelData(
// 				activeTab,
// 				activeTab === "police" ? policePagination.page : officePagination.page
// 			);
// 			toast({
// 				title: "Refreshed",
// 				description: "Personnel data updated",
// 			});
// 		} catch (error) {
// 			toast({
// 				title: "Refresh Failed",
// 				description: "Could not refresh personnel data",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setRefreshing(false);
// 		}
// 	};

// 	const handleTabChange = async (tab: "police" | "office") => {
// 		setActiveTab(tab);
// 		if (
// 			(tab === "police" && policePersonnel.length === 0) ||
// 			(tab === "office" && officePersonnel.length === 0)
// 		) {
// 			await loadPersonnelData(tab, 1);
// 		}
// 	};

// 	const handlePageChange = async (direction: "prev" | "next") => {
// 		const currentPagination =
// 			activeTab === "police" ? policePagination : officePagination;
// 		const newPage =
// 			direction === "next"
// 				? currentPagination.page + 1
// 				: currentPagination.page - 1;

// 		if (newPage >= 1 && newPage <= currentPagination.pages) {
// 			if (activeTab === "police") {
// 				setPolicePagination((prev) => ({ ...prev, page: newPage }));
// 			} else {
// 				setOfficePagination((prev) => ({ ...prev, page: newPage }));
// 			}

// 			await loadPersonnelData(activeTab, newPage);
// 		}
// 	};

// 	useEffect(() => {
// 		loadPersonnelData("police", 1);
// 	}, []);

// 	useEffect(() => {
// 		if (onConnectionStatusUpdate) {
// 			(window as any).updatePoliceStatus = updateOnlineStatus;
// 		}
// 	}, [onConnectionStatusUpdate]);

// 	const currentPersonnel =
// 		activeTab === "police" ? policePersonnel : officePersonnel;
// 	const currentPagination =
// 		activeTab === "police" ? policePagination : officePagination;
// 	const currentTotalStats =
// 		activeTab === "police" ? policeTotalStats : officeTotalStats;

// 	const stats = {
// 		total: currentTotalStats.total,
// 		online: currentTotalStats.online,
// 		offline: currentTotalStats.offline,
// 		totalRecords: currentPagination.total,
// 	};

// 	if (loading) {
// 		return (
// 			<Card className="bg-slate-900/50 border-slate-700">
// 				<CardHeader>
// 					<CardTitle className="flex items-center space-x-2">
// 						<Users className="h-5 w-5 text-blue-400" />
// 						<span>Personnel Status</span>
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent className="space-y-4">
// 					<div className="space-y-3">
// 						{[...Array(3)].map((_, i) => (
// 							<div
// 								key={i}
// 								className="h-16 bg-slate-800 rounded-lg animate-pulse"
// 							/>
// 						))}
// 					</div>
// 				</CardContent>
// 			</Card>
// 		);
// 	}

// 	return (
// 		<Card className="bg-slate-900/50 border-slate-700">
// 			<CardHeader>
// 				<div className="flex items-center justify-between">
// 					<CardTitle className="flex items-center space-x-2">
// 						<Users className="h-5 w-5 text-blue-400" />
// 						<span>Personnel Status</span>
// 						<Badge
// 							variant="outline"
// 							className="border-slate-600 text-slate-300">
// 							{stats.online}/{stats.total}
// 						</Badge>
// 					</CardTitle>
// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={handleRefresh}
// 						disabled={refreshing}
// 						className="text-slate-400 hover:text-white">
// 						<RefreshCw
// 							className={cn("h-4 w-4", refreshing && "animate-spin")}
// 						/>
// 					</Button>
// 				</div>
// 			</CardHeader>

// 			<CardContent className="space-y-4">
// 				<div className="flex space-x-1 bg-slate-800/30 p-1 rounded-lg">
// 					<button
// 						onClick={() => handleTabChange("police")}
// 						className={cn(
// 							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
// 							activeTab === "police"
// 								? "bg-blue-600 text-white shadow-sm"
// 								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
// 						)}>
// 						<Shield className="h-4 w-4" />
// 						<span>Police Personnel</span>
// 					</button>
// 					<button
// 						onClick={() => handleTabChange("office")}
// 						className={cn(
// 							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
// 							activeTab === "office"
// 								? "bg-orange-600 text-white shadow-sm"
// 								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
// 						)}>
// 						<Building2 className="h-4 w-4" />
// 						<span>Office Operators</span>
// 					</button>
// 				</div>

// 				<div className="grid grid-cols-2 gap-3">
// 					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
// 						<div className="flex items-center space-x-2">
// 							<UserCheck className="h-4 w-4 text-green-400" />
// 							<div>
// 								<p className="text-xs text-green-300">Online</p>
// 								<p className="text-lg font-bold text-green-400">
// 									{stats.online}
// 								</p>
// 							</div>
// 						</div>
// 					</div>

// 					<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
// 						<div className="flex items-center space-x-2">
// 							<UserX className="h-4 w-4 text-red-400" />
// 							<div>
// 								<p className="text-xs text-red-300">Offline</p>
// 								<p className="text-lg font-bold text-red-400">
// 									{stats.offline}
// 								</p>
// 							</div>
// 						</div>
// 					</div>
// 				</div>

// 				<Separator className="bg-slate-700" />

// 				<div className="space-y-2">
// 					<div className="flex items-center justify-between">
// 						<h4 className="text-sm font-medium text-slate-400">
// 							{activeTab === "police" ? "Police Personnel" : "Office Operators"}
// 						</h4>
// 						<div className="text-xs text-slate-500">
// 							Total: {stats.totalRecords} records
// 						</div>
// 					</div>

// 					<div className="max-h-64 overflow-y-auto space-y-2">
// 						{currentPersonnel.length === 0 ? (
// 							<div className="text-center py-4">
// 								<AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
// 								<p className="text-slate-400 text-sm">No personnel found</p>
// 							</div>
// 						) : (
// 							currentPersonnel.map((person) => (
// 								<div
// 									key={person.id}
// 									className={cn(
// 										"flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
// 										person.isOnline
// 											? "bg-green-900/10 border-green-500/20 hover:bg-green-900/20"
// 											: "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
// 									)}>
// 									<div className="flex items-center space-x-3">
// 										<div className="relative">
// 											<div
// 												className={cn(
// 													"w-8 h-8 rounded-full flex items-center justify-center",
// 													person.role === "POLICE_MANAGER"
// 														? "bg-purple-600/20"
// 														: person.operatorType === "POLICE"
// 														? "bg-blue-600/20"
// 														: "bg-orange-600/20"
// 												)}>
// 												{person.role === "POLICE_MANAGER" ? (
// 													<Shield className="h-4 w-4 text-purple-400" />
// 												) : person.operatorType === "POLICE" ? (
// 													<Radio className="h-4 w-4 text-blue-400" />
// 												) : (
// 													<Building2 className="h-4 w-4 text-orange-400" />
// 												)}
// 											</div>
// 											<div
// 												className={cn(
// 													"absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900",
// 													person.isOnline ? "bg-green-500" : "bg-slate-500"
// 												)}
// 											/>
// 										</div>

// 										<div className="min-w-0 flex-1">
// 											<p className="text-sm font-medium text-white truncate">
// 												{person.name}
// 											</p>
// 											<div className="flex items-center space-x-2">
// 												<p className="text-xs text-slate-400">
// 													{person.role === "POLICE_MANAGER"
// 														? "Police Manager"
// 														: person.operatorType === "POLICE"
// 														? "Police Operator"
// 														: "Office Operator"}
// 												</p>
// 												{person.operatorType === "OFFICE" && person.company && (
// 													<span className="text-xs text-slate-500">
// 														• {person.company.name}
// 													</span>
// 												)}
// 											</div>
// 										</div>
// 									</div>

// 									<div className="flex items-center space-x-2">
// 										{person.isOnline ? (
// 											<div className="flex items-center space-x-1">
// 												<Wifi className="h-3 w-3 text-green-400" />
// 												<Badge className="bg-green-600 text-white text-xs">
// 													Online
// 												</Badge>
// 											</div>
// 										) : (
// 											<div className="flex items-center space-x-1">
// 												<WifiOff className="h-3 w-3 text-slate-400" />
// 												<Badge
// 													variant="outline"
// 													className="border-slate-600 text-slate-400 text-xs">
// 													Offline
// 												</Badge>
// 											</div>
// 										)}
// 									</div>
// 								</div>
// 							))
// 						)}
// 					</div>

// 					{currentPagination.pages > 1 && (
// 						<div className="flex items-center justify-between pt-2 border-t border-slate-700">
// 							<div className="text-xs text-slate-500">
// 								Page {currentPagination.page} of {currentPagination.pages}
// 							</div>
// 							<div className="flex items-center space-x-2">
// 								<Button
// 									variant="ghost"
// 									size="sm"
// 									onClick={() => handlePageChange("prev")}
// 									disabled={currentPagination.page <= 1}
// 									className="text-slate-400 hover:text-white disabled:opacity-50">
// 									<ChevronLeft className="h-4 w-4" />
// 								</Button>
// 								<Button
// 									variant="ghost"
// 									size="sm"
// 									onClick={() => handlePageChange("next")}
// 									disabled={currentPagination.page >= currentPagination.pages}
// 									className="text-slate-400 hover:text-white disabled:opacity-50">
// 									<ChevronRight className="h-4 w-4" />
// 								</Button>
// 							</div>
// 						</div>
// 					)}
// 				</div>

// 				{lastUpdate && (
// 					<div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-700">
// 						<Clock className="h-3 w-3" />
// 						<span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
// 					</div>
// 				)}

// 				{connectionStatus && (
// 					<div className="bg-slate-800/20 rounded-lg p-2">
// 						<div className="flex items-center justify-between text-xs">
// 							<span className="text-slate-400">System Status:</span>
// 							<div className="flex items-center space-x-1">
// 								<Activity className="h-3 w-3 text-green-400" />
// 								<span className="text-green-400">Connected</span>
// 							</div>
// 						</div>
// 					</div>
// 				)}
// 			</CardContent>
// 		</Card>
// 	);
// }
// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import { apiClient } from "@/lib/api";
// import {
// 	Users,
// 	Shield,
// 	Wifi,
// 	WifiOff,
// 	RefreshCw,
// 	Clock,
// 	Activity,
// 	UserCheck,
// 	UserX,
// 	Radio,
// 	AlertCircle,
// 	Building2,
// 	ChevronLeft,
// 	ChevronRight,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface Personnel {
// 	id: string;
// 	name: string;
// 	email: string;
// 	role: string;
// 	operatorType?: string;
// 	isOnline: boolean;
// 	lastSeen?: string;
// 	connectedAt?: string;
// 	company?: {
// 		id: string;
// 		name: string;
// 		type: string;
// 		status: string;
// 	};
// }

// interface ConnectionStatusData {
// 	connectedPolice: Array<{
// 		userId: string;
// 		role: string;
// 		operatorType?: string;
// 		connectedAt: string;
// 		lastSeen: string;
// 	}>;
// 	connectedUsers?: Array<{
// 		userId: string;
// 		role: string;
// 		operatorType?: string;
// 		connectedAt: string;
// 		lastSeen: string;
// 	}>;
// 	stats: {
// 		total: number;
// 		policeManagers: number;
// 		policeOperators: number;
// 		officeOperators: number;
// 		others: number;
// 	};
// 	timestamp: string;
// }

// interface PaginationInfo {
// 	page: number;
// 	limit: number;
// 	total: number;
// 	pages: number;
// }

// interface TotalStats {
// 	total: number;
// 	online: number;
// 	offline: number;
// }

// interface PersonnelStatusCardProps {
// 	onConnectionStatusUpdate?: (data: ConnectionStatusData) => void;
// }

// export function PersonnelStatusCard({
// 	onConnectionStatusUpdate,
// }: PersonnelStatusCardProps) {
// 	const [policePersonnel, setPolicePersonnel] = useState<Personnel[]>([]);
// 	const [officePersonnel, setOfficePersonnel] = useState<Personnel[]>([]);
// 	const [policeTotalStats, setPoliceTotalStats] = useState<TotalStats>({
// 		total: 0,
// 		online: 0,
// 		offline: 0,
// 	});
// 	const [officeTotalStats, setOfficeTotalStats] = useState<TotalStats>({
// 		total: 0,
// 		online: 0,
// 		offline: 0,
// 	});
// 	const [activeTab, setActiveTab] = useState<"police" | "office">("police");
// 	const [policePagination, setPolicePagination] = useState<PaginationInfo>({
// 		page: 1,
// 		limit: 10,
// 		total: 0,
// 		pages: 0,
// 	});
// 	const [officePagination, setOfficePagination] = useState<PaginationInfo>({
// 		page: 1,
// 		limit: 10,
// 		total: 0,
// 		pages: 0,
// 	});
// 	const [connectionStatus, setConnectionStatus] =
// 		useState<ConnectionStatusData | null>(null);
// 	const [webSocketReady, setWebSocketReady] = useState(false);
// 	const [loading, setLoading] = useState(true);
// 	const [refreshing, setRefreshing] = useState(false);
// 	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
// 	const { toast } = useToast();

// 	const loadPersonnelData = async (tab: "police" | "office", page = 1) => {
// 		try {
// 			setLoading(true);

// 			if (tab === "police") {
// 				const allPersonnelResponse =
// 					await apiClient.getPoliceManagerandOperatorStatus(1, 1000); // Fetch large number to get all
// 				const allPersonnel = allPersonnelResponse.users || [];

// 				const connectedArray =
// 					connectionStatus?.connectedUsers ||
// 					connectionStatus?.connectedPolice ||
// 					[];

// 				const personnelWithStatus = allPersonnel.map((person: any) => {
// 					const connectionInfo = connectedArray.find(
// 						(cp) => cp.userId === person.id
// 					);
// 					const isOnline = connectedArray.some((cp) => cp.userId === person.id);

// 					return {
// 						...person,
// 						isOnline,
// 						lastSeen: connectionInfo?.lastSeen || null,
// 						connectedAt: connectionInfo?.connectedAt || null,
// 					};
// 				});

// 				const globalSortedPersonnel = personnelWithStatus.sort((a, b) => {
// 					if (a.isOnline && !b.isOnline) return -1;
// 					if (!a.isOnline && b.isOnline) return 1;
// 					return a.name.localeCompare(b.name);
// 				});

// 				const startIndex = (page - 1) * policePagination.limit;
// 				const endIndex = startIndex + policePagination.limit;
// 				const paginatedPersonnel = globalSortedPersonnel.slice(
// 					startIndex,
// 					endIndex
// 				);

// 				setPolicePersonnel(paginatedPersonnel);

// 				setPolicePagination({
// 					page,
// 					limit: policePagination.limit,
// 					total: globalSortedPersonnel.length,
// 					pages: Math.ceil(
// 						globalSortedPersonnel.length / policePagination.limit
// 					),
// 				});

// 				if (allPersonnelResponse.totalStats) {
// 					const policeOnlineCount = connectedArray.filter(
// 						(cp) => cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
// 					).length;

// 					setPoliceTotalStats({
// 						total: allPersonnelResponse.totalStats.total,
// 						online: connectionStatus
// 							? policeOnlineCount
// 							: allPersonnelResponse.totalStats.online,
// 						offline:
// 							allPersonnelResponse.totalStats.total -
// 							(connectionStatus
// 								? policeOnlineCount
// 								: allPersonnelResponse.totalStats.online),
// 					});
// 				}

// 				console.log(
// 					`Loaded police personnel page ${page}:`,
// 					paginatedPersonnel.length,
// 					"of",
// 					globalSortedPersonnel.length,
// 					"total"
// 				);
// 			} else {
// 				const allPersonnelResponse = await apiClient.getOfficeOperatorStatus(
// 					1,
// 					1000
// 				); // Fetch large number to get all
// 				const allPersonnel = allPersonnelResponse.users || [];

// 				const connectedArray =
// 					connectionStatus?.connectedUsers ||
// 					connectionStatus?.connectedPolice ||
// 					[];

// 				const personnelWithStatus = allPersonnel.map((person: any) => {
// 					const connectionInfo = connectedArray.find(
// 						(cp) => cp.userId === person.id
// 					);

// 					const hasOfficeOperatorsInWebSocket = connectedArray.some(
// 						(cp) => cp.operatorType === "OFFICE"
// 					);
// 					let isOnline = false;

// 					if (hasOfficeOperatorsInWebSocket) {
// 						// Use WebSocket data if office operators are being tracked
// 						isOnline = connectedArray.some((cp) => cp.userId === person.id);
// 					} else {
// 						console.log(`Office operator ${person.name}:`, {
// 							updatedAt: person.updatedAt,
// 							lastActiveAt: person.lastActiveAt,
// 							lastSeen: person.lastSeen,
// 							createdAt: person.createdAt,
// 							currentTime: new Date().toISOString(),
// 						});

// 						// Try multiple fields for determining recent activity
// 						const now = Date.now();
// 						const eightHoursAgo = now - 8 * 60 * 60 * 1000; // 8 hours for work shift
// 						const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // 24 hours as backup

// 						// Check multiple possible timestamp fields
// 						const timestamps = [
// 							person.lastActiveAt,
// 							person.lastSeen,
// 							person.updatedAt,
// 						].filter(Boolean);

// 						if (timestamps.length > 0) {
// 							const mostRecentActivity = Math.max(
// 								...timestamps.map((ts) => new Date(ts).getTime())
// 							);
// 							// Consider online if active within 8 hours (work shift)
// 							isOnline = mostRecentActivity > eightHoursAgo;

// 							console.log(`Office operator ${person.name} status:`, {
// 								mostRecentActivity: new Date(mostRecentActivity).toISOString(),
// 								eightHoursAgo: new Date(eightHoursAgo).toISOString(),
// 								isOnline,
// 							});
// 						} else {
// 							// If no timestamps available, assume offline
// 							isOnline = false;
// 							console.log(
// 								`Office operator ${person.name}: No timestamp data available, marking offline`
// 							);
// 						}
// 					}

// 					return {
// 						...person,
// 						isOnline,
// 						lastSeen:
// 							connectionInfo?.lastSeen ||
// 							person.lastActiveAt ||
// 							person.updatedAt,
// 						connectedAt: connectionInfo?.connectedAt || null,
// 					};
// 				});

// 				const globalSortedPersonnel = personnelWithStatus.sort((a, b) => {
// 					if (a.isOnline && !b.isOnline) return -1;
// 					if (!a.isOnline && b.isOnline) return 1;
// 					return a.name.localeCompare(b.name);
// 				});

// 				const startIndex = (page - 1) * officePagination.limit;
// 				const endIndex = startIndex + officePagination.limit;
// 				const paginatedPersonnel = globalSortedPersonnel.slice(
// 					startIndex,
// 					endIndex
// 				);

// 				setOfficePersonnel(paginatedPersonnel);

// 				setOfficePagination({
// 					page,
// 					limit: officePagination.limit,
// 					total: globalSortedPersonnel.length,
// 					pages: Math.ceil(
// 						globalSortedPersonnel.length / officePagination.limit
// 					),
// 				});

// 				if (allPersonnelResponse.totalStats) {
// 					const hasOfficeOperatorsInWebSocket = connectedArray.some(
// 						(cp) => cp.operatorType === "OFFICE"
// 					);

// 					let officeOnlineCount = 0;
// 					if (hasOfficeOperatorsInWebSocket) {
// 						officeOnlineCount = connectedArray.filter(
// 							(cp) => cp.operatorType === "OFFICE"
// 						).length;
// 					} else {
// 						officeOnlineCount = personnelWithStatus.filter(
// 							(person) => person.isOnline
// 						).length;
// 					}

// 					setOfficeTotalStats({
// 						total: allPersonnelResponse.totalStats.total,
// 						online: officeOnlineCount,
// 						offline: allPersonnelResponse.totalStats.total - officeOnlineCount,
// 					});
// 				}

// 				console.log(
// 					`Loaded office personnel page ${page}:`,
// 					paginatedPersonnel.length,
// 					"of",
// 					globalSortedPersonnel.length,
// 					"total"
// 				);
// 			}
// 		} catch (error) {
// 			console.error(`Failed to load ${tab} personnel:`, error);
// 			toast({
// 				title: "Error",
// 				description: `Failed to load ${tab} personnel data`,
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const updateOnlineStatus = (statusData: ConnectionStatusData) => {
// 		setConnectionStatus(statusData);
// 		if (!webSocketReady) {
// 			setWebSocketReady(true);
// 		}
// 		setLastUpdate(new Date());

// 		const connectedArray =
// 			statusData.connectedUsers || statusData.connectedPolice || [];

// 		const policeOnlineCount = connectedArray.filter(
// 			(cp) => cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
// 		).length;

// 		const hasOfficeOperatorsInWebSocket = connectedArray.some(
// 			(cp) => cp.operatorType === "OFFICE"
// 		);
// 		const officeOnlineCount = hasOfficeOperatorsInWebSocket
// 			? connectedArray.filter((cp) => cp.operatorType === "OFFICE").length
// 			: officeTotalStats.online;

// 		setPoliceTotalStats((prev) => ({
// 			...prev,
// 			online: policeOnlineCount,
// 			offline: prev.total - policeOnlineCount,
// 		}));

// 		setOfficeTotalStats((prev) => ({
// 			...prev,
// 			online: officeOnlineCount,
// 			offline: prev.total - officeOnlineCount,
// 		}));

// 		const currentPagination =
// 			activeTab === "police" ? policePagination : officePagination;
// 		loadPersonnelData(activeTab, currentPagination.page);

// 		onConnectionStatusUpdate?.(statusData);
// 	};

// 	const handleRefresh = async () => {
// 		setRefreshing(true);
// 		try {
// 			await loadPersonnelData(
// 				activeTab,
// 				activeTab === "police" ? policePagination.page : officePagination.page
// 			);
// 			toast({
// 				title: "Refreshed",
// 				description: "Personnel data updated",
// 			});
// 		} catch (error) {
// 			toast({
// 				title: "Refresh Failed",
// 				description: "Could not refresh personnel data",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setRefreshing(false);
// 		}
// 	};

// 	const handleTabChange = async (tab: "police" | "office") => {
// 		setActiveTab(tab);
// 		if (
// 			(tab === "police" && policePersonnel.length === 0) ||
// 			(tab === "office" && officePersonnel.length === 0)
// 		) {
// 			await loadPersonnelData(tab, 1);
// 		}
// 	};

// 	const handlePageChange = async (direction: "prev" | "next") => {
// 		const currentPagination =
// 			activeTab === "police" ? policePagination : officePagination;
// 		const newPage =
// 			direction === "next"
// 				? currentPagination.page + 1
// 				: currentPagination.page - 1;

// 		if (newPage >= 1 && newPage <= currentPagination.pages) {
// 			if (activeTab === "police") {
// 				setPolicePagination((prev) => ({ ...prev, page: newPage }));
// 			} else {
// 				setOfficePagination((prev) => ({ ...prev, page: newPage }));
// 			}

// 			await loadPersonnelData(activeTab, newPage);
// 		}
// 	};

// 	useEffect(() => {
// 		loadPersonnelData("police", 1);
// 	}, []);

// 	useEffect(() => {
// 		if (webSocketReady && activeTab === "police") {
// 			loadPersonnelData("police", policePagination.page);
// 		}
// 	}, [webSocketReady]);

// 	useEffect(() => {
// 		if (onConnectionStatusUpdate) {
// 			(window as any).updatePoliceStatus = updateOnlineStatus;
// 		}
// 	}, [onConnectionStatusUpdate]);

// 	const currentPersonnel =
// 		activeTab === "police" ? policePersonnel : officePersonnel;
// 	const currentPagination =
// 		activeTab === "police" ? policePagination : officePagination;
// 	const currentTotalStats =
// 		activeTab === "police" ? policeTotalStats : officeTotalStats;

// 	const stats = {
// 		total: currentTotalStats.total,
// 		online: currentTotalStats.online,
// 		offline: currentTotalStats.offline,
// 		totalRecords: currentPagination.total,
// 	};

// 	if (loading) {
// 		return (
// 			<Card className="bg-slate-900/50 border-slate-700">
// 				<CardHeader>
// 					<CardTitle className="flex items-center space-x-2">
// 						<Users className="h-5 w-5 text-blue-400" />
// 						<span>Personnel Status</span>
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent className="space-y-4">
// 					<div className="space-y-3">
// 						{[...Array(3)].map((_, i) => (
// 							<div
// 								key={i}
// 								className="h-16 bg-slate-800 rounded-lg animate-pulse"
// 							/>
// 						))}
// 					</div>
// 				</CardContent>
// 			</Card>
// 		);
// 	}

// 	return (
// 		<Card className="bg-slate-900/50 border-slate-700">
// 			<CardHeader>
// 				<div className="flex items-center justify-between">
// 					<CardTitle className="flex items-center space-x-2">
// 						<Users className="h-5 w-5 text-blue-400" />
// 						<span>Personnel Status</span>
// 						<Badge
// 							variant="outline"
// 							className="border-slate-600 text-slate-300">
// 							{stats.online}/{stats.total}
// 						</Badge>
// 					</CardTitle>
// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={handleRefresh}
// 						disabled={refreshing}
// 						className="text-slate-400 hover:text-white">
// 						<RefreshCw
// 							className={cn("h-4 w-4", refreshing && "animate-spin")}
// 						/>
// 					</Button>
// 				</div>
// 			</CardHeader>

// 			<CardContent className="space-y-4">
// 				<div className="flex space-x-1 bg-slate-800/30 p-1 rounded-lg">
// 					<button
// 						onClick={() => handleTabChange("police")}
// 						className={cn(
// 							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
// 							activeTab === "police"
// 								? "bg-blue-600 text-white shadow-sm"
// 								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
// 						)}>
// 						<Shield className="h-4 w-4" />
// 						<span>Police Personnel</span>
// 					</button>
// 					<button
// 						onClick={() => handleTabChange("office")}
// 						className={cn(
// 							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
// 							activeTab === "office"
// 								? "bg-orange-600 text-white shadow-sm"
// 								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
// 						)}>
// 						<Building2 className="h-4 w-4" />
// 						<span>Office Operators</span>
// 					</button>
// 				</div>

// 				<div className="grid grid-cols-2 gap-3">
// 					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
// 						<div className="flex items-center space-x-2">
// 							<UserCheck className="h-4 w-4 text-green-400" />
// 							<div>
// 								<p className="text-xs text-green-300">Online</p>
// 								<p className="text-lg font-bold text-green-400">
// 									{stats.online}
// 								</p>
// 							</div>
// 						</div>
// 					</div>

// 					<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
// 						<div className="flex items-center space-x-2">
// 							<UserX className="h-4 w-4 text-red-400" />
// 							<div>
// 								<p className="text-xs text-red-300">Offline</p>
// 								<p className="text-lg font-bold text-red-400">
// 									{stats.offline}
// 								</p>
// 							</div>
// 						</div>
// 					</div>
// 				</div>

// 				<Separator className="bg-slate-700" />

// 				<div className="space-y-2">
// 					<div className="flex items-center justify-between">
// 						<h4 className="text-sm font-medium text-slate-400">
// 							{activeTab === "police" ? "Police Personnel" : "Office Operators"}
// 						</h4>
// 						<div className="text-xs text-slate-500">
// 							Total: {stats.totalRecords} records
// 						</div>
// 					</div>

// 					<div className="max-h-64 overflow-y-auto space-y-2">
// 						{currentPersonnel.length === 0 ? (
// 							<div className="text-center py-4">
// 								<AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
// 								<p className="text-slate-400 text-sm">No personnel found</p>
// 							</div>
// 						) : (
// 							currentPersonnel.map((person) => (
// 								<div
// 									key={person.id}
// 									className={cn(
// 										"flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
// 										person.isOnline
// 											? "bg-green-900/10 border-green-500/20 hover:bg-green-900/20"
// 											: "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
// 									)}>
// 									<div className="flex items-center space-x-3">
// 										<div className="relative">
// 											<div
// 												className={cn(
// 													"w-8 h-8 rounded-full flex items-center justify-center",
// 													person.role === "POLICE_MANAGER"
// 														? "bg-purple-600/20"
// 														: person.operatorType === "POLICE"
// 														? "bg-blue-600/20"
// 														: "bg-orange-600/20"
// 												)}>
// 												{person.role === "POLICE_MANAGER" ? (
// 													<Shield className="h-4 w-4 text-purple-400" />
// 												) : person.operatorType === "POLICE" ? (
// 													<Radio className="h-4 w-4 text-blue-400" />
// 												) : (
// 													<Building2 className="h-4 w-4 text-orange-400" />
// 												)}
// 											</div>
// 											<div
// 												className={cn(
// 													"absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900",
// 													person.isOnline ? "bg-green-500" : "bg-slate-500"
// 												)}
// 											/>
// 										</div>

// 										<div className="min-w-0 flex-1">
// 											<p className="text-sm font-medium text-white truncate">
// 												{person.name}
// 											</p>
// 											<div className="flex items-center space-x-2">
// 												<p className="text-xs text-slate-400">
// 													{person.role === "POLICE_MANAGER"
// 														? "Police Manager"
// 														: person.operatorType === "POLICE"
// 														? "Police Operator"
// 														: "Office Operator"}
// 												</p>
// 												{person.operatorType === "OFFICE" && person.company && (
// 													<span className="text-xs text-slate-500">
// 														• {person.company.name}
// 													</span>
// 												)}
// 											</div>
// 										</div>
// 									</div>

// 									<div className="flex items-center space-x-2">
// 										{person.isOnline ? (
// 											<div className="flex items-center space-x-1">
// 												<Wifi className="h-3 w-3 text-green-400" />
// 												<Badge className="bg-green-600 text-white text-xs">
// 													Online
// 												</Badge>
// 											</div>
// 										) : (
// 											<div className="flex items-center space-x-1">
// 												<WifiOff className="h-3 w-3 text-slate-400" />
// 												<Badge
// 													variant="outline"
// 													className="border-slate-600 text-slate-400 text-xs">
// 													Offline
// 												</Badge>
// 											</div>
// 										)}
// 									</div>
// 								</div>
// 							))
// 						)}
// 					</div>

// 					{currentPagination.pages > 1 && (
// 						<div className="flex items-center justify-between pt-2 border-t border-slate-700">
// 							<div className="text-xs text-slate-500">
// 								Page {currentPagination.page} of {currentPagination.pages}
// 							</div>
// 							<div className="flex items-center space-x-2">
// 								<Button
// 									variant="ghost"
// 									size="sm"
// 									onClick={() => handlePageChange("prev")}
// 									disabled={currentPagination.page <= 1}
// 									className="text-slate-400 hover:text-white disabled:opacity-50">
// 									<ChevronLeft className="h-4 w-4" />
// 								</Button>
// 								<Button
// 									variant="ghost"
// 									size="sm"
// 									onClick={() => handlePageChange("next")}
// 									disabled={currentPagination.page >= currentPagination.pages}
// 									className="text-slate-400 hover:text-white disabled:opacity-50">
// 									<ChevronRight className="h-4 w-4" />
// 								</Button>
// 							</div>
// 						</div>
// 					)}
// 				</div>

// 				{lastUpdate && (
// 					<div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-700">
// 						<Clock className="h-3 w-3" />
// 						<span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
// 					</div>
// 				)}

// 				{connectionStatus && (
// 					<div className="bg-slate-800/20 rounded-lg p-2">
// 						<div className="flex items-center justify-between text-xs">
// 							<span className="text-slate-400">System Status:</span>
// 							<div className="flex items-center space-x-1">
// 								<Activity className="h-3 w-3 text-green-400" />
// 								<span className="text-green-400">Connected</span>
// 							</div>
// 						</div>
// 						{activeTab === "office" &&
// 							!connectionStatus.connectedUsers?.some(
// 								(cp) => cp.operatorType === "OFFICE"
// 							) && (
// 								<div className="text-xs text-amber-400 mt-1">
// 									Office status based on recent activity (8hr window)
// 								</div>
// 							)}
// 					</div>
// 				)}
// 			</CardContent>
// 		</Card>
// 	);
// }

//-----------------OLD
// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import { apiClient } from "@/lib/api";
// import {
// 	Users,
// 	Shield,
// 	Wifi,
// 	WifiOff,
// 	RefreshCw,
// 	Clock,
// 	Activity,
// 	UserCheck,
// 	UserX,
// 	Radio,
// 	AlertCircle,
// 	Building2,
// 	ChevronLeft,
// 	ChevronRight,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface Personnel {
// 	id: string;
// 	name: string;
// 	email: string;
// 	role: string;
// 	operatorType?: string;
// 	isOnline: boolean;
// 	lastSeen?: string;
// 	connectedAt?: string;
// 	company?: {
// 		id: string;
// 		name: string;
// 		type: string;
// 		status: string;
// 	};
// }

// interface ConnectionStatusData {
// 	connectedPolice: Array<{
// 		userId: string;
// 		role: string;
// 		operatorType?: string;
// 		connectedAt: string;
// 		lastSeen: string;
// 	}>;
// 	stats: {
// 		total: number;
// 		policeManagers: number;
// 		policeOperators: number;
// 		officeOperators: number;
// 		others: number;
// 	};
// 	timestamp: string;
// }

// interface PaginationInfo {
// 	page: number;
// 	limit: number;
// 	total: number;
// 	pages: number;
// }

// interface TotalStats {
// 	total: number;
// 	online: number;
// 	offline: number;
// }

// interface PersonnelStatusCardProps {
// 	onConnectionStatusUpdate?: (data: ConnectionStatusData) => void;
// }

// export function PersonnelStatusCard({
// 	onConnectionStatusUpdate,
// }: PersonnelStatusCardProps) {
// 	const [policePersonnel, setPolicePersonnel] = useState<Personnel[]>([]);
// 	const [officePersonnel, setOfficePersonnel] = useState<Personnel[]>([]);
// 	const [policeTotalStats, setPoliceTotalStats] = useState<TotalStats>({
// 		total: 0,
// 		online: 0,
// 		offline: 0,
// 	});
// 	const [officeTotalStats, setOfficeTotalStats] = useState<TotalStats>({
// 		total: 0,
// 		online: 0,
// 		offline: 0,
// 	});
// 	const [activeTab, setActiveTab] = useState<"police" | "office">("police");
// 	const [policePagination, setPolicePagination] = useState<PaginationInfo>({
// 		page: 1,
// 		limit: 10,
// 		total: 0,
// 		pages: 0,
// 	});
// 	const [officePagination, setOfficePagination] = useState<PaginationInfo>({
// 		page: 1,
// 		limit: 10,
// 		total: 0,
// 		pages: 0,
// 	});
// 	const [connectionStatus, setConnectionStatus] =
// 		useState<ConnectionStatusData | null>(null);
// 	const [loading, setLoading] = useState(true);
// 	const [refreshing, setRefreshing] = useState(false);
// 	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
// 	const { toast } = useToast();

// 	const loadPersonnelData = async (tab: "police" | "office", page = 1) => {
// 		try {
// 			setLoading(true);

// 			if (tab === "police") {
// 				const response = await apiClient.getPoliceManagerandOperatorStatus(
// 					page,
// 					policePagination.limit
// 				);
// 				const personnelWithStatus = (response.users || []).map(
// 					(person: any) => {
// 						const connectionInfo = connectionStatus?.connectedPolice.find(
// 							(cp) => cp.userId === person.id
// 						);
// 						const isOnline = connectionStatus
// 							? connectionStatus.connectedPolice.some(
// 									(cp) => cp.userId === person.id
// 							  )
// 							: false;

// 						return {
// 							...person,
// 							isOnline,
// 							lastSeen: connectionInfo?.lastSeen || null,
// 							connectedAt: connectionInfo?.connectedAt || null,
// 						};
// 					}
// 				);

// 				setPolicePersonnel(personnelWithStatus);
// 				if (response.pagination) {
// 					setPolicePagination(response.pagination);
// 				}
// 				console.log("Police totalStats:", response.totalStats);
// 				if (response.totalStats) {
// 					const policeOnlineCount = connectionStatus
// 						? connectionStatus.connectedPolice.filter(
// 								(cp) =>
// 									cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
// 						  ).length
// 						: response.totalStats.online;

// 					setPoliceTotalStats({
// 						total: response.totalStats.total,
// 						online: policeOnlineCount,
// 						offline: response.totalStats.total - policeOnlineCount,
// 					});
// 				}
// 			} else {
// 				const response = await apiClient.getOfficeOperatorStatus(
// 					page,
// 					officePagination.limit
// 				);
// 				const personnelWithStatus = (response.users || []).map(
// 					(person: any) => {
// 						const connectionInfo = connectionStatus?.connectedPolice.find(
// 							(cp) => cp.userId === person.id
// 						);
// 						const isOnline = connectionStatus
// 							? connectionStatus.connectedPolice.some(
// 									(cp) => cp.userId === person.id
// 							  )
// 							: false;

// 						return {
// 							...person,
// 							isOnline,
// 							lastSeen: connectionInfo?.lastSeen || null,
// 							connectedAt: connectionInfo?.connectedAt || null,
// 						};
// 					}
// 				);

// 				console.log("Office Personnel with Status:", personnelWithStatus);

// 				setOfficePersonnel(personnelWithStatus);
// 				if (response.pagination) {
// 					setOfficePagination(response.pagination);
// 				}
// 				console.log("Office totalStats:", response.totalStats);
// 				if (response.totalStats) {
// 					const officeOnlineCount = connectionStatus
// 						? connectionStatus.connectedPolice.filter(
// 								(cp) => cp.operatorType === "OFFICE"
// 						  ).length
// 						: response.totalStats.online;

// 					setOfficeTotalStats({
// 						total: response.totalStats.total,
// 						online: officeOnlineCount,
// 						offline: response.totalStats.total - officeOnlineCount,
// 					});
// 				}
// 			}

// 			console.log(
// 				`Loaded ${tab} personnel page ${page}:`,
// 				tab === "police" ? policePersonnel.length : officePersonnel.length
// 			);
// 		} catch (error) {
// 			console.error(`Failed to load ${tab} personnel:`, error);
// 			toast({
// 				title: "Error",
// 				description: `Failed to load ${tab} personnel data`,
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const updateOnlineStatus = (statusData: ConnectionStatusData) => {
// 		setConnectionStatus(statusData);
// 		setLastUpdate(new Date());

// 		const connectedUserIds = new Set(
// 			statusData.connectedPolice.map((cp) => cp.userId)
// 		);

// 		console.log("Updating online status with data:", statusData);
// 		console.log("Connected User IDs:", statusData.connectedPolice);
// 		const policeOnlineCount = statusData.connectedPolice.filter(
// 			(cp) => cp.operatorType === "POLICE" || cp.role === "POLICE_MANAGER"
// 		).length;
// 		const officeOnlineCount = statusData.connectedPolice.filter(
// 			(cp) => cp.operatorType === "OFFICE" || cp.role === "OFFICE_MANAGER"
// 		).length;

// 		setPoliceTotalStats((prev) => ({
// 			...prev,
// 			online: policeOnlineCount,
// 			offline: prev.total - policeOnlineCount,
// 		}));

// 		setOfficeTotalStats((prev) => ({
// 			...prev,
// 			online: officeOnlineCount,
// 			offline: prev.total - officeOnlineCount,
// 		}));

// 		if (activeTab === "police" && policePersonnel.length > 0) {
// 			setPolicePersonnel((prev) =>
// 				prev.map((person) => {
// 					const connectionInfo = statusData.connectedPolice.find(
// 						(cp) => cp.userId === person.id
// 					);
// 					return {
// 						...person,
// 						isOnline: connectedUserIds.has(person.id),
// 						lastSeen: connectionInfo?.lastSeen || person.lastSeen,
// 						connectedAt: connectionInfo?.connectedAt || person.connectedAt,
// 					};
// 				})
// 			);
// 		}

// 		if (activeTab === "office" && officePersonnel.length > 0) {
// 			setOfficePersonnel((prev) =>
// 				prev.map((person) => {
// 					const connectionInfo = statusData.connectedPolice.find(
// 						(cp) => cp.userId === person.id
// 					);
// 					return {
// 						...person,
// 						isOnline: connectedUserIds.has(person.id),
// 						lastSeen: connectionInfo?.lastSeen || person.lastSeen,
// 						connectedAt: connectionInfo?.connectedAt || person.connectedAt,
// 					};
// 				})
// 			);
// 		}

// 		onConnectionStatusUpdate?.(statusData);
// 	};

// 	const handleRefresh = async () => {
// 		setRefreshing(true);
// 		try {
// 			await loadPersonnelData(
// 				activeTab,
// 				activeTab === "police" ? policePagination.page : officePagination.page
// 			);
// 			toast({
// 				title: "Refreshed",
// 				description: "Personnel data updated",
// 			});
// 		} catch (error) {
// 			toast({
// 				title: "Refresh Failed",
// 				description: "Could not refresh personnel data",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setRefreshing(false);
// 		}
// 	};

// 	const handleTabChange = async (tab: "police" | "office") => {
// 		setActiveTab(tab);
// 		if (
// 			(tab === "police" && policePersonnel.length === 0) ||
// 			(tab === "office" && officePersonnel.length === 0)
// 		) {
// 			await loadPersonnelData(tab, 1);
// 		}
// 	};

// 	const handlePageChange = async (direction: "prev" | "next") => {
// 		const currentPagination =
// 			activeTab === "police" ? policePagination : officePagination;
// 		const newPage =
// 			direction === "next"
// 				? currentPagination.page + 1
// 				: currentPagination.page - 1;

// 		if (newPage >= 1 && newPage <= currentPagination.pages) {
// 			if (activeTab === "police") {
// 				setPolicePagination((prev) => ({ ...prev, page: newPage }));
// 			} else {
// 				setOfficePagination((prev) => ({ ...prev, page: newPage }));
// 			}

// 			await loadPersonnelData(activeTab, newPage);
// 		}
// 	};

// 	useEffect(() => {
// 		loadPersonnelData("police", 1);
// 	}, []);

// 	useEffect(() => {
// 		if (onConnectionStatusUpdate) {
// 			(window as any).updatePoliceStatus = updateOnlineStatus;
// 		}
// 	}, [onConnectionStatusUpdate]);

// 	const currentPersonnel =
// 		activeTab === "police" ? policePersonnel : officePersonnel;
// 	const currentPagination =
// 		activeTab === "police" ? policePagination : officePagination;
// 	const currentTotalStats =
// 		activeTab === "police" ? policeTotalStats : officeTotalStats;

// 	const stats = {
// 		total: currentTotalStats.total,
// 		online: currentTotalStats.online,
// 		offline: currentTotalStats.offline,
// 		totalRecords: currentPagination.total,
// 	};

// 	if (loading) {
// 		return (
// 			<Card className="bg-slate-900/50 border-slate-700">
// 				<CardHeader>
// 					<CardTitle className="flex items-center space-x-2">
// 						<Users className="h-5 w-5 text-blue-400" />
// 						<span>Personnel Status</span>
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent className="space-y-4">
// 					<div className="space-y-3">
// 						{[...Array(3)].map((_, i) => (
// 							<div
// 								key={i}
// 								className="h-16 bg-slate-800 rounded-lg animate-pulse"
// 							/>
// 						))}
// 					</div>
// 				</CardContent>
// 			</Card>
// 		);
// 	}

// 	return (
// 		<Card className="bg-slate-900/50 border-slate-700">
// 			<CardHeader>
// 				<div className="flex items-center justify-between">
// 					<CardTitle className="flex items-center space-x-2">
// 						<Users className="h-5 w-5 text-blue-400" />
// 						<span>Personnel Status</span>
// 						<Badge
// 							variant="outline"
// 							className="border-slate-600 text-slate-300">
// 							{stats.online}/{stats.total}
// 						</Badge>
// 					</CardTitle>
// 					<Button
// 						variant="ghost"
// 						size="sm"
// 						onClick={handleRefresh}
// 						disabled={refreshing}
// 						className="text-slate-400 hover:text-white">
// 						<RefreshCw
// 							className={cn("h-4 w-4", refreshing && "animate-spin")}
// 						/>
// 					</Button>
// 				</div>
// 			</CardHeader>

// 			<CardContent className="space-y-4">
// 				<div className="flex space-x-1 bg-slate-800/30 p-1 rounded-lg">
// 					<button
// 						onClick={() => handleTabChange("police")}
// 						className={cn(
// 							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
// 							activeTab === "police"
// 								? "bg-blue-600 text-white shadow-sm"
// 								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
// 						)}>
// 						<Shield className="h-4 w-4" />
// 						<span>Police Personnel</span>
// 					</button>
// 					<button
// 						onClick={() => handleTabChange("office")}
// 						className={cn(
// 							"flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
// 							activeTab === "office"
// 								? "bg-orange-600 text-white shadow-sm"
// 								: "text-slate-400 hover:text-white hover:bg-slate-700/50"
// 						)}>
// 						<Building2 className="h-4 w-4" />
// 						<span>Office Operators</span>
// 					</button>
// 				</div>

// 				<div className="grid grid-cols-2 gap-3">
// 					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
// 						<div className="flex items-center space-x-2">
// 							<UserCheck className="h-4 w-4 text-green-400" />
// 							<div>
// 								<p className="text-xs text-green-300">Online</p>
// 								<p className="text-lg font-bold text-green-400">
// 									{stats.online}
// 								</p>
// 							</div>
// 						</div>
// 					</div>

// 					<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
// 						<div className="flex items-center space-x-2">
// 							<UserX className="h-4 w-4 text-red-400" />
// 							<div>
// 								<p className="text-xs text-red-300">Offline</p>
// 								<p className="text-lg font-bold text-red-400">
// 									{stats.offline}
// 								</p>
// 							</div>
// 						</div>
// 					</div>
// 				</div>

// 				<Separator className="bg-slate-700" />

// 				<div className="space-y-2">
// 					<div className="flex items-center justify-between">
// 						<h4 className="text-sm font-medium text-slate-400">
// 							{activeTab === "police" ? "Police Personnel" : "Office Operators"}
// 						</h4>
// 						<div className="text-xs text-slate-500">
// 							Total: {stats.totalRecords} records
// 						</div>
// 					</div>

// 					<div className="max-h-64 overflow-y-auto space-y-2">
// 						{currentPersonnel.length === 0 ? (
// 							<div className="text-center py-4">
// 								<AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
// 								<p className="text-slate-400 text-sm">No personnel found</p>
// 							</div>
// 						) : (
// 							currentPersonnel.map((person) => (
// 								<div
// 									key={person.id}
// 									className={cn(
// 										"flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
// 										person.isOnline
// 											? "bg-green-900/10 border-green-500/20 hover:bg-green-900/20"
// 											: "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
// 									)}>
// 									<div className="flex items-center space-x-3">
// 										<div className="relative">
// 											<div
// 												className={cn(
// 													"w-8 h-8 rounded-full flex items-center justify-center",
// 													person.role === "POLICE_MANAGER"
// 														? "bg-purple-600/20"
// 														: person.operatorType === "POLICE"
// 														? "bg-blue-600/20"
// 														: "bg-orange-600/20"
// 												)}>
// 												{person.role === "POLICE_MANAGER" ? (
// 													<Shield className="h-4 w-4 text-purple-400" />
// 												) : person.operatorType === "POLICE" ? (
// 													<Radio className="h-4 w-4 text-blue-400" />
// 												) : (
// 													<Building2 className="h-4 w-4 text-orange-400" />
// 												)}
// 											</div>
// 											<div
// 												className={cn(
// 													"absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900",
// 													person.isOnline ? "bg-green-500" : "bg-slate-500"
// 												)}
// 											/>
// 										</div>

// 										<div className="min-w-0 flex-1">
// 											<p className="text-sm font-medium text-white truncate">
// 												{person.name}
// 											</p>
// 											<div className="flex items-center space-x-2">
// 												<p className="text-xs text-slate-400">
// 													{person.role === "POLICE_MANAGER"
// 														? "Police Manager"
// 														: person.operatorType === "POLICE"
// 														? "Police Operator"
// 														: "Office Operator"}
// 												</p>
// 												{person.operatorType === "OFFICE" && person.company && (
// 													<span className="text-xs text-slate-500">
// 														• {person.company.name}
// 													</span>
// 												)}
// 											</div>
// 										</div>
// 									</div>

// 									<div className="flex items-center space-x-2">
// 										{person.isOnline ? (
// 											<div className="flex items-center space-x-1">
// 												<Wifi className="h-3 w-3 text-green-400" />
// 												<Badge className="bg-green-600 text-white text-xs">
// 													Online
// 												</Badge>
// 											</div>
// 										) : (
// 											<div className="flex items-center space-x-1">
// 												<WifiOff className="h-3 w-3 text-slate-400" />
// 												<Badge
// 													variant="outline"
// 													className="border-slate-600 text-slate-400 text-xs">
// 													Offline
// 												</Badge>
// 											</div>
// 										)}
// 									</div>
// 								</div>
// 							))
// 						)}
// 					</div>

// 					{currentPagination.pages > 1 && (
// 						<div className="flex items-center justify-between pt-2 border-t border-slate-700">
// 							<div className="text-xs text-slate-500">
// 								Page {currentPagination.page} of {currentPagination.pages}
// 							</div>
// 							<div className="flex items-center space-x-2">
// 								<Button
// 									variant="ghost"
// 									size="sm"
// 									onClick={() => handlePageChange("prev")}
// 									disabled={currentPagination.page <= 1}
// 									className="text-slate-400 hover:text-white disabled:opacity-50">
// 									<ChevronLeft className="h-4 w-4" />
// 								</Button>
// 								<Button
// 									variant="ghost"
// 									size="sm"
// 									onClick={() => handlePageChange("next")}
// 									disabled={currentPagination.page >= currentPagination.pages}
// 									className="text-slate-400 hover:text-white disabled:opacity-50">
// 									<ChevronRight className="h-4 w-4" />
// 								</Button>
// 							</div>
// 						</div>
// 					)}
// 				</div>

// 				{lastUpdate && (
// 					<div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-700">
// 						<Clock className="h-3 w-3" />
// 						<span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
// 					</div>
// 				)}

// 				{connectionStatus && (
// 					<div className="bg-slate-800/20 rounded-lg p-2">
// 						<div className="flex items-center justify-between text-xs">
// 							<span className="text-slate-400">System Status:</span>
// 							<div className="flex items-center space-x-1">
// 								<Activity className="h-3 w-3 text-green-400" />
// 								<span className="text-green-400">Connected</span>
// 							</div>
// 						</div>
// 					</div>
// 				)}
// 			</CardContent>
// 		</Card>
// 	);
// }
