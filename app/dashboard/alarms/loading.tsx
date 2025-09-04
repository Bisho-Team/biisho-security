export default function Loading() {
	return null;
}

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogDescription,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogFooter,
// } from "@/components/ui/dialog";
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// 	DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
// 	AlertTriangle,
// 	Plus,
// 	Clock,
// 	CheckCircle,
// 	Send,
// 	Eye,
// 	Search,
// 	Edit,
// 	MoreHorizontal,
// 	MapPin,
// 	Calendar,
// 	Shield,
// 	Loader2,
// 	Bell,
// 	FileText,
// 	Navigation,
// 	Radio,
// 	Building,
// 	User,
// 	Mail,
// } from "lucide-react";
// import Link from "next/link";
// import { apiService } from "@/lib/api-service";
// import { useToast } from "@/hooks/use-toast";
// import { cn } from "@/lib/utils";
// import Image from "next/image";
// import { useAuth } from "@/contexts/auth-context";
// import { useWebSocket } from "@/hooks/use-websocket";
// import { PersonnelStatusCard } from "@/components/op-personnel-status-card";

// interface Alarm {
// 	id: string;
// 	alarmCode: string;
// 	type: string;
// 	location: string;
// 	longitude?: string;
// 	latitude?: string;
// 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// 	description: string;
// 	additionalNotes?: string;
// 	status: "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED";
// 	createdAt: string;
// 	updatedAt: string;
// 	companyId: string;
// 	branchId: string;
// 	createdById: string;
// 	branch: {
// 		name: string;
// 		locationType?: string;
// 		gpsAddress?: string;
// 		city?: string;
// 		subCity?: string;
// 		woreda?: string;
// 		country?: string;
// 		managerName?: string;
// 		phoneNumber?: string;
// 		contactNumber1?: string;
// 		company?: {
// 			name: string;
// 			logo: string;
// 		};
// 	};
// 	createdBy: {
// 		id: string;
// 		name: string;
// 		email?: string;
// 		phone?: string;
// 	};
// 	reports: Array<{
// 		id: string;
// 		status: string;
// 		acknowledgedAt?: string;
// 		completedAt?: string;
// 		resolutionDescription?: string;
// 		notes?: string;
// 		assignedTo?: {
// 			id: string;
// 			name: string;
// 			email?: string;
// 			phone?: string;
// 			company?: {
// 				name: string;
// 			};
// 		};
// 		acknowledgedBy?: {
// 			id: string;
// 			name: string;
// 			phone?: string;
// 		};
// 		resolvedBy?: {
// 			id: string;
// 			name: string;
// 			phone?: string;
// 		};
// 	}>;
// 	coordinates?: {
// 		lat: number;
// 		lng: number;
// 	};
// }

// export default function EnhancedAlarmsPage() {
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [mockAlarms, setMockAlarms] = useState<Alarm[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [alarmHistory, setAlarmHistory] = useState<Alarm[]>([]);
// 	const [filterStatus, setFilterStatus] = useState("all");
// 	const [filterSeverity, setFilterSeverity] = useState("all");
// 	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
// 	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
// 	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
// 	const [updating, setUpdating] = useState(false);
// 	const { toast } = useToast();
// 	const { user } = useAuth();
// 	const [connectionStatusData, setConnectionStatusData] = useState<any>(null);

// 	const fetchAlarms = useCallback(async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/alarms");
// 			console.log("Fetched alarms__:", (response as any).alarms);

// 			const alarmsWithCoords = (response as any).alarms.map((alarm: any) => ({
// 				...alarm,
// 				time: alarm.createdAt,
// 				coordinates:
// 					alarm.coordinates ||
// 					(alarm.latitude && alarm.longitude
// 						? {
// 								lat: Number.parseFloat(alarm.latitude),
// 								lng: Number.parseFloat(alarm.longitude),
// 						  }
// 						: undefined),
// 			}));

// 			setMockAlarms(alarmsWithCoords);
// 			setAlarmHistory(alarmsWithCoords);
// 			// setLastRefresh(new Date());
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch alarms",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, [toast]);

// 	const token =
// 		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

// 	// WebSocket connection with enhanced debugging
// 	const { isConnected, connect, disconnect } = useWebSocket(token, {
// 		autoConnect: true,
// 		onAlarmCreated: (alarm) => {
// 			console.log("NEW ALARM CREATED via WebSocket:", alarm);

// 			fetchAlarms();

// 			toast({
// 				title: "🚨 New Alarm Created",
// 				description: `${alarm.type} at ${alarm.location}`,
// 				variant: "destructive",
// 			});
// 		},
// 		onAlarmUpdated: async (alarm) => {
// 			// Refresh alarms data when alarm is updated
// 			fetchAlarms();

// 			toast({
// 				title: "🔄 Alarm Updated",
// 				description: `${alarm.type} status changed to ${alarm.status}`,
// 			});
// 		},
// 		onConnectionStatusUpdate: (data) => {
// 			console.log("📊 CONNECTION STATUS UPDATE:", data);
// 			setConnectionStatusData(data);

// 			// Update the police status card
// 			if ((window as any).updatePoliceStatus) {
// 				(window as any).updatePoliceStatus(data);
// 			}
// 		},
// 		onConnectionEstablished: (userInfo) => {
// 			console.log("🎉 CONNECTION ESTABLISHED:", userInfo);

// 			toast({
// 				title: "Connected",
// 				description: "Real-time connection established",
// 			});
// 		},
// 		onError: (error) => {
// 			console.error("❌ WEBSOCKET ERROR:", error);

// 			toast({
// 				title: "Connection Error",
// 				description: "WebSocket connection failed",
// 				variant: "destructive",
// 			});
// 		},
// 		onClose: (event) => {
// 			console.log("🔌 WEBSOCKET CLOSED:", event);

// 			if (event.code !== 1000) {
// 				toast({
// 					title: "Connection Lost",
// 					description: "Attempting to reconnect...",
// 					variant: "destructive",
// 				});
// 			}
// 		},
// 	});

// 	useEffect(() => {
// 		fetchAlarms();
// 	}, [fetchAlarms]);

// 	return (
// 		<div className="space-y-6 animate-fade-in">
// 			<div className="flex flex-row gap-3">
// 				{(user?.role === "SUPER_ADMIN" || user?.role === "OFFICE_MANAGER") && (
// 					<div className="w-1/4">
// 						<PersonnelStatusCard
// 							onConnectionStatusUpdate={(data: any) => {
// 								setConnectionStatusData(data);
// 							}}
// 						/>
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// }
