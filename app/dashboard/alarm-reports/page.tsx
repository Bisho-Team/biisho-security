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
import { AlarmReminderDialog } from "@/components/alarm-reminder-dialog";
import { audioService } from "@/lib/audio-service";
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
	Bell,
	Activity,
	Target,
	Radio,
	Wifi,
	Server,
	Lock,
	Unlock,
	AlertCircle,
	Navigation,
	Crosshair,
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
	latitude: string;
	longitude: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
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
	responseTime?: string;
	priority?: number;
}

export default function EnhancedAlarmReportsPage() {
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
	const [resolutionDescription, setResolutionDescription] = useState("");
	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		fetchAlarms();
	}, []);

	const fetchAlarms = async () => {
		try {
			setLoading(true);
			const response: any = await apiService.get("/alarms");
			console.log("Fetched alarms:", response);

			const alarmsWithCoords = (response as any).alarms.map((alarm: Alarm) => ({
				...alarm,
				coordinates: {
					latitude: alarm?.latitude
						? Number(alarm?.latitude)
						: 9.0192 + (Math.random() - 0.5) * 0.1,
					longitude: alarm?.longitude
						? Number(alarm?.longitude)
						: 38.7525 + (Math.random() - 0.5) * 0.1,
				},
			}));
			setAlarms(alarmsWithCoords);
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
				status: "ACKNOWLEDGED",
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

	const viewAlarmDetails: any = (alarmId: string) => {
		const alarm = alarms.find((a) => a.id === alarmId);
		if (alarm) {
			setSelectedAlarm(alarm);
			setIsDetailsDialogOpen(true);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			<div className="space-y-6 p-6">
				<PersistentAlarmBanner />

				{/* Alarm Reminder Dialog */}
				<AlarmReminderDialog
					onViewDetails={viewAlarmDetails}
					onAcknowledge={acknowledgeAlarm}
				/>

				{/* Header Section */}
				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
					<div className="relative flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="relative">
								<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
									<Shield className="h-8 w-8 text-red-400" />
								</div>
								<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
							</div>
							<div>
								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
									POLICE COMMAND CENTER
								</h1>
								<p className="text-slate-400 font-mono text-lg mt-2">
									Real-time ALARM monitoring & incident response system
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 rounded-lg border border-green-500/30">
								<Wifi className="h-4 w-4 text-green-400" />
								<span className="text-green-400 font-mono text-sm">
									SYSTEM ONLINE
								</span>
							</div>
							<div className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
								<Server className="h-4 w-4 text-blue-400" />
								<span className="text-blue-400 font-mono text-sm">
									ALL SENSORS ACTIVE
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Enhanced Alarm Indicators */}
				<EnhancedAlarmIndicators
					alarms={alarms as any}
					onAcknowledge={acknowledgeAlarm as any}
					onViewDetails={viewAlarmDetails}
				/>
			</div>
		</div>
	);
}
