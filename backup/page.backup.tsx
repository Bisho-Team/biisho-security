// "use client";

// import { useState, useEffect, useCallback, useMemo } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import { useWebSocket } from "@/hooks/use-websocket";
// import { apiClient } from "@/lib/api";
// import { audioService } from "@/lib/audio-service";
// import { PersistentAlarmModal } from "@/components/persistent-alarm-modal";
// import {
//     AlertTriangle,
//     CheckCircle,
//     Shield,
//     Eye,
//     MapPin,
//     Calendar,
//     Loader2,
//     Search,
//     Zap,
//     Activity,
//     Target,
//     Radio,
//     Wifi,
//     AlertCircle,
//     Navigation,
//     WifiOff,
//     RefreshCw,
//     Users,
//     Volume2,
//     VolumeX,
//     TestTube,
//     StopCircle,
//     Play,
//     Pause,
//     Monitor,
//     Building,
//     User,
//     Clock,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useGlobalAlarms } from "@/components/global-alarm-provider";

// interface Alarm {
//     id: string;
//     type: string;
//     branchId: string;
//     branch: {
//         id: string;
//         name: string;
//         company?: {
//             id: string;
//             name: string;
//             logo?: string;
//         };
//     };
//     location: string;
//     latitude: string;
//     longitude: string;
//     coordinates?: {
//         latitude: number;
//         longitude: number;
//     };
//     status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
//     severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//     description: string;
//     additionalNotes?: string;
//     createdBy: {
//         id: string;
//         name: string;
//     };
//     createdAt: string;
//     acknowledgedAt?: string;
//     completedAt?: string;
//     resolutionDescription?: string;
//     responseTime?: string;
//     priority?: number;
//     isRealTime?: boolean;
// }

// export default function EnhancedAlarmReportsPage() {
//     // State management
//     const [alarms, setAlarms] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [updating, setUpdating] = useState(false);
//     const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
//     const [resolutionDescription, setResolutionDescription] = useState("");
//     const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
//     const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
//     const [audioEnabled, setAudioEnabled] = useState(true);
//     const [modalEnabled, setModalEnabled] = useState(true);
//     const [currentUser, setCurrentUser] = useState<any | null>(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [statusFilter, setStatusFilter] = useState<string>("all");
//     const [severityFilter, setSeverityFilter] = useState<string>("all");
//     const [activeTab, setActiveTab] = useState<
//         "all" | "active" | "acknowledged" | "resolved"
//     >("active");

//     const { toast } = useToast();

//     // Get authentication token
//     const token =
//         typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

//         const {
//             alarms,
//             isConnected,
//             audioEnabled,
//             modalEnabled,
//             setAudioEnabled,
//             setModalEnabled,
//             acknowledgeAlarm,
//             updateAlarmStatus: changeAlarmStatus,
//             refreshAlarms: fetchAlarms,
//             getAlarmStats,
//         } = useGlobalAlarms();

//     // Update audio service whenever alarms change
//     useEffect(() => {
//         if (audioEnabled) {
//             audioService.updateActiveAlarms(alarms);
//         }
//     }, [alarms, audioEnabled]);

//     // WebSocket connection with real-time alarm handling
//     const { isConnected, userInfo } = useWebSocket(token, {
//         autoConnect: true,
//         onAlarmCreated: useCallback(
//             async (newAlarm: any) => {
//                 console.log("🚨 New real-time alarm received:", newAlarm);

//                 // Fetch complete branch data including company information
//                 let branchData = {
//                     id: newAlarm.branchId,
//                     name: newAlarm.branchName || "Unknown Branch",
//                     company: undefined,
//                 };

//                 try {
//                     // Try to get complete branch data with company info
//                     const branchResponse = await apiClient.getBranches();
//                     const fullBranch = branchResponse?.find(
//                         (b: any) => b.id === newAlarm.branchId
//                     );
//                     if (fullBranch && fullBranch.company) {
//                         branchData = {
//                             id: fullBranch.id,
//                             name: fullBranch.name,
//                             company: {
//                                 id: fullBranch.company.id,
//                                 name: fullBranch.company.name,
//                                 logo: fullBranch.company.logo,
//                             },
//                         } as any;
//                         console.log(
//                             "✅ Company data loaded for alarm:",
//                             branchData.company
//                         );
//                     } else {
//                         console.warn(
//                             "⚠️ No company data found for branch:",
//                             newAlarm.branchId
//                         );
//                     }
//                 } catch (error) {
//                     console.error("❌ Could not fetch complete branch data:", error);
//                 }

//                 // Transform the alarm data to match our interface
//                 const transformedAlarm: any = {
//                     id: newAlarm.id,
//                     type: newAlarm.type,
//                     branchId: newAlarm.branchId,
//                     branch: branchData,
//                     location: newAlarm.location || "",
//                     latitude: newAlarm.latitude || "",
//                     longitude: newAlarm.longitude || "",
//                     coordinates: {
//                         latitude: newAlarm.latitude
//                             ? Number(newAlarm.latitude)
//                             : 9.0192 + (Math.random() - 0.5) * 0.1,
//                         longitude: newAlarm.longitude
//                             ? Number(newAlarm.longitude)
//                             : 38.7525 + (Math.random() - 0.5) * 0.1,
//                     },
//                     status: newAlarm.status || "ACTIVE",
//                     severity: newAlarm.severity,
//                     description: newAlarm.description,
//                     additionalNotes: newAlarm.additionalNotes,
//                     createdBy: {
//                         id: newAlarm.createdBy?.id || "",
//                         name: newAlarm.createdBy || "Unknown User",
//                     },
//                     createdAt: newAlarm.createdAt,
//                     priority: newAlarm.priority || getSeverityPriority(newAlarm.severity),
//                     isRealTime: true,
//                 };

//                 // Add to the beginning of alarms list and force re-render
//                 setAlarms((prev) => {
//                     const exists = prev.some((alarm) => alarm.id === transformedAlarm.id);
//                     if (exists) {
//                         // Update existing alarm with complete data
//                         const updated = prev.map((alarm) =>
//                             alarm.id === transformedAlarm.id ? transformedAlarm : alarm
//                         );
//                         console.log("🔄 Updated existing alarm with company data");
//                         return updated;
//                     }
//                     console.log("➕ Added new alarm with company data");
//                     return [transformedAlarm, ...prev];
//                 });

//                 // Small delay to ensure state is updated, then try to fetch company data again if missing
//                 if (!branchData.company) {
//                     setTimeout(async () => {
//                         try {
//                             console.log("🔄 Retrying company data fetch...");
//                             const retryBranchResponse = await apiClient.getBranches();
//                             const retryFullBranch = retryBranchResponse?.find(
//                                 (b: any) => b.id === newAlarm.branchId
//                             );

//                             if (retryFullBranch && retryFullBranch.company) {
//                                 setAlarms((prev) =>
//                                     prev.map((alarm) =>
//                                         alarm.id === transformedAlarm.id
//                                             ? {
//                                                     ...alarm,
//                                                     branch: {
//                                                         ...alarm.branch,
//                                                         company: {
//                                                             id: retryFullBranch.company.id,
//                                                             name: retryFullBranch.company.name,
//                                                             logo: retryFullBranch.company.logo,
//                                                         },
//                                                     },
//                                               }
//                                             : alarm
//                                     )
//                                 );
//                                 console.log("✅ Company data loaded on retry");
//                             }
//                         } catch (retryError) {
//                             console.error("❌ Retry failed:", retryError);
//                         }
//                     }, 1000);
//                 }

//                 // Rest of the existing code for audio alerts, notifications, etc.
//                 if (audioEnabled && transformedAlarm.status === "ACTIVE") {
//                     audioService.addActiveAlarm(
//                         transformedAlarm.id,
//                         transformedAlarm.severity
//                     );
//                 }

//                 toast({
//                     title: `🚨 ${newAlarm.severity} ALARM RECEIVED`,
//                     description: `${newAlarm.type} at ${
//                         newAlarm.branchName || newAlarm.location
//                     }`,
//                     variant: newAlarm.severity === "CRITICAL" ? "destructive" : "default",
//                     duration: newAlarm.severity === "CRITICAL" ? 15000 : 10000,
//                 });

//                 if ("Notification" in window && Notification.permission === "granted") {
//                     new Notification(`🚨 ${newAlarm.severity} EMERGENCY ALARM`, {
//                         body: `${newAlarm.type} at ${
//                             newAlarm.branchName || newAlarm.location
//                         }`,
//                         icon: "/favicon.ico",
//                         tag: `alarm-${newAlarm.id}`,
//                         requireInteraction: newAlarm.severity === "CRITICAL",
//                     });
//                 }
//             },
//             [audioEnabled, toast]
//         ),

//         onAlarmUpdated: useCallback(
//             (updatedAlarm: any) => {
//                 console.log("🔄 Alarm update received:", updatedAlarm);

//                 setAlarms((prev) =>
//                     prev.map((alarm) => {
//                         if (alarm.id === updatedAlarm.id) {
//                             const updated = {
//                                 ...alarm,
//                                 status: updatedAlarm.status,
//                                 acknowledgedAt: updatedAlarm.acknowledgedAt,
//                                 completedAt: updatedAlarm.completedAt,
//                                 resolutionDescription: updatedAlarm.resolutionDescription,
//                                 isRealTime: true,
//                             };

//                             // Remove from audio alerts if acknowledged or resolved
//                             if (updated.status !== "ACTIVE") {
//                                 audioService.removeActiveAlarm(updated.id);
//                             }

//                             return updated;
//                         }
//                         return alarm;
//                     })
//                 );

//                 // Show update notification
//                 if (updatedAlarm.status === "RESOLVED") {
//                     toast({
//                         title: "✅ Alarm Resolved",
//                         description: `Alarm at ${
//                             updatedAlarm.branchName || updatedAlarm.location
//                         } has been resolved`,
//                     });
//                 } else if (updatedAlarm.status === "ACKNOWLEDGED") {
//                     toast({
//                         title: "👁️ Alarm Acknowledged",
//                         description: `Alarm at ${
//                             updatedAlarm.branchName || updatedAlarm.location
//                         } has been acknowledged`,
//                     });
//                 }
//             },
//             [toast]
//         ),

//         onSystemNotification: useCallback(
//             (notification: any) => {
//                 toast({
//                     title: "📢 System Notification",
//                     description: notification.message,
//                     variant:
//                         notification.severity === "error" ? "destructive" : "default",
//                 });
//             },
//             [toast]
//         ),
//     });

//     // Load current user info
//     useEffect(() => {
//         const loadCurrentUser = async () => {
//             try {
//                 const storedUser = localStorage.getItem("currentUser");
//                 if (storedUser) {
//                     setCurrentUser(JSON.parse(storedUser));
//                 } else {
//                     const user = await apiClient.getCurrentUser();
//                     setCurrentUser(user);
//                 }
//             } catch (error) {
//                 console.error("Failed to load current user:", error);
//             }
//         };

//         loadCurrentUser();
//     }, []);

//     // Request notification permission on component mount
//     useEffect(() => {
//         if ("Notification" in window && Notification.permission === "default") {
//             Notification.requestPermission().then((permission) => {
//                 console.log(`Notification permission: ${permission}`);
//             });
//         }
//     }, []);

//     // Initialize audio service settings
//     useEffect(() => {
//         audioService.setEnabled(audioEnabled);
//     }, [audioEnabled]);

//     // Initial alarm fetch
//     useEffect(() => {
//         fetchAlarms();
//     }, []);

//     const fetchAlarms = async () => {
//         try {
//             setLoading(true);
//             const response = await apiClient.getAlarms();
//             console.log("Fetched alarms from API:", response);

//             const alarmsWithCoords =
//                 (response as any).alarms?.map((alarm: any) => ({
//                     ...alarm,
//                     coordinates: {
//                         latitude: alarm?.latitude
//                             ? Number(alarm?.latitude)
//                             : 9.0192 + (Math.random() - 0.5) * 0.1,
//                         longitude: alarm?.longitude
//                             ? Number(alarm?.longitude)
//                             : 38.7525 + (Math.random() - 0.5) * 0.1,
//                     },
//                     isRealTime: false,
//                 })) || [];

//             setAlarms(alarmsWithCoords);
//         } catch (error) {
//             console.error("Failed to fetch alarms:", error);
//             toast({
//                 title: "Error",
//                 description: "Failed to fetch alarms",
//                 variant: "destructive",
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     const acknowledgeAlarm = async (alarmId: string) => {
//         try {
//             setUpdating(true);
//             await apiClient.updateAlarm(alarmId, {
//                 status: "ACKNOWLEDGED",
//                 acknowledgedAt: new Date().toISOString(),
//             });

//             toast({
//                 title: "Success",
//                 description: "Alarm acknowledged successfully",
//             });

//             // Update local state immediately
//             setAlarms((prev) =>
//                 prev.map((alarm) =>
//                     alarm.id === alarmId
//                         ? {
//                                 ...alarm,
//                                 status: "ACKNOWLEDGED" as const,
//                                 acknowledgedAt: new Date().toISOString(),
//                           }
//                         : alarm
//                 )
//             );

//             // Remove from audio alerts
//             audioService.removeActiveAlarm(alarmId);
//         } catch (error: any) {
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to acknowledge alarm",
//                 variant: "destructive",
//             });
//         } finally {
//             setUpdating(false);
//         }
//     };

//     const resolveAlarm = async () => {
//         if (!selectedAlarm) return;

//         try {
//             setUpdating(true);
//             await apiClient.updateAlarm(selectedAlarm.id, {
//                 status: "RESOLVED",
//                 completedAt: new Date().toISOString(),
//                 resolutionDescription,
//             });

//             toast({
//                 title: "Success",
//                 description: "Alarm resolved successfully",
//             });

//             // Update local state
//             setAlarms((prev) =>
//                 prev.map((alarm) =>
//                     alarm.id === selectedAlarm.id
//                         ? {
//                                 ...alarm,
//                                 status: "RESOLVED" as const,
//                                 completedAt: new Date().toISOString(),
//                                 resolutionDescription,
//                           }
//                         : alarm
//                 )
//             );

//             // Remove from audio alerts
//             audioService.removeActiveAlarm(selectedAlarm.id);

//             setIsResolutionDialogOpen(false);
//             setResolutionDescription("");
//             setSelectedAlarm(null);
//         } catch (error: any) {
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to resolve alarm",
//                 variant: "destructive",
//             });
//         } finally {
//             setUpdating(false);
//         }
//     };

//     const changeAlarmStatus = async (
//         alarmId: string,
//         newStatus: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED"
//     ) => {
//         try {
//             setUpdating(true);
//             const updateData: any = {
//                 status: newStatus,
//             };

//             if (newStatus === "ACKNOWLEDGED") {
//                 updateData.acknowledgedAt = new Date().toISOString();
//             } else if (newStatus === "RESOLVED") {
//                 updateData.completedAt = new Date().toISOString();
//                 updateData.resolutionDescription =
//                     resolutionDescription || "Status changed from modal";
//             }

//             await apiClient.updateAlarm(alarmId, updateData);

//             toast({
//                 title: "Status Updated",
//                 description: `Alarm status changed to ${newStatus}`,
//             });

//             // Update local state
//             setAlarms((prev) =>
//                 prev.map((alarm) =>
//                     alarm.id === alarmId ? { ...alarm, ...updateData } : alarm
//                 )
//             );

//             // Remove from audio alerts if not active
//             if (newStatus !== "ACTIVE") {
//                 audioService.removeActiveAlarm(alarmId);
//             }

//             setIsDetailsDialogOpen(false);
//         } catch (error: any) {
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to update alarm status",
//                 variant: "destructive",
//             });
//         } finally {
//             setUpdating(false);
//         }
//     };

//     const viewAlarmDetails = (alarmId: string) => {
//         const alarm = alarms.find((a) => a.id === alarmId);
//         if (alarm) {
//             setSelectedAlarm(alarm);
//             setIsDetailsDialogOpen(true);
//         }
//     };

//     // Helper functions
//     const getSeverityPriority = (severity: string): number => {
//         switch (severity) {
//             case "CRITICAL":
//                 return 1;
//             case "HIGH":
//                 return 2;
//             case "MEDIUM":
//                 return 3;
//             case "LOW":
//                 return 4;
//             default:
//                 return 5;
//         }
//     };

//     const getSeverityColor = (severity: string) => {
//         switch (severity) {
//             case "CRITICAL":
//                 return "bg-red-600 text-white";
//             case "HIGH":
//                 return "bg-orange-600 text-white";
//             case "MEDIUM":
//                 return "bg-yellow-600 text-white";
//             case "LOW":
//                 return "bg-blue-600 text-white";
//             default:
//                 return "bg-gray-600 text-white";
//         }
//     };

//     const getStatusColor = (status: string) => {
//         switch (status) {
//             case "ACTIVE":
//                 return "bg-red-100 text-red-800 border-red-200";
//             case "ACKNOWLEDGED":
//                 return "bg-yellow-100 text-yellow-800 border-yellow-200";
//             case "RESOLVED":
//                 return "bg-green-100 text-green-800 border-green-200";
//             default:
//                 return "bg-gray-100 text-gray-800 border-gray-200";
//         }
//     };

//     // Filter alarms based on search, filters, and active tab
//     const filteredAlarms = useMemo(() => {
//         return alarms
//             .filter((alarm) => {
//                 const matchesSearch =
//                     searchTerm === "" ||
//                     alarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                     alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                     alarm.type.toLowerCase().includes(searchTerm.toLowerCase());

//                 const matchesStatus =
//                     statusFilter === "all" || alarm.status === statusFilter;
//                 const matchesSeverity =
//                     severityFilter === "all" || alarm.severity === severityFilter;

//                 // Tab filtering
//                 const matchesTab =
//                     activeTab === "all" ||
//                     (activeTab === "active" && alarm.status === "ACTIVE") ||
//                     (activeTab === "acknowledged" && alarm.status === "ACKNOWLEDGED") ||
//                     (activeTab === "resolved" && alarm.status === "RESOLVED");

//                 return matchesSearch && matchesStatus && matchesSeverity && matchesTab;
//             })
//             .sort((a, b) => {
//                 if (a.priority !== b.priority) {
//                     return (a.priority || 5) - (b.priority || 5);
//                 }
//                 return (
//                     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//                 );
//             });
//     }, [alarms, searchTerm, statusFilter, severityFilter, activeTab]);

//     // Statistics
//     const alarmStats = useMemo(() => {
//         const total = alarms.length;
//         const active = alarms.filter((a) => a.status === "ACTIVE").length;
//         const acknowledged = alarms.filter(
//             (a) => a.status === "ACKNOWLEDGED"
//         ).length;
//         const resolved = alarms.filter((a) => a.status === "RESOLVED").length;
//         const critical = alarms.filter((a) => a.severity === "CRITICAL").length;
//         const realTime = alarms.filter((a) => a.isRealTime).length;

//         return { total, active, acknowledged, resolved, critical, realTime };
//     }, [alarms]);

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
//                 <div className="space-y-6">
//                     <Skeleton className="h-32 w-full bg-slate-800" />
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                         {[...Array(4)].map((_, i) => (
//                             <Skeleton key={i} className="h-24 bg-slate-800" />
//                         ))}
//                     </div>
//                     <Skeleton className="h-96 w-full bg-slate-800" />
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
//             <div className="space-y-6 p-6">
//                 {/* Persistent Alarm Modal */}
//                 {modalEnabled && (
//                     <PersistentAlarmModal
//                         alarms={alarms}
//                         onAcknowledge={acknowledgeAlarm}
//                         onViewDetails={viewAlarmDetails}
//                         onStatusChange={changeAlarmStatus}
//                         isAcknowledging={updating}
//                     />
//                 )}

//                 {/* Header Section */}
//                 <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
//                     <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
//                     <div className="relative flex items-center justify-between">
//                         <div className="flex items-center space-x-4">
//                             <div className="relative">
//                                 <div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
//                                     <Shield className="h-8 w-8 text-red-400" />
//                                 </div>
//                                 {alarmStats.active > 0 && (
//                                     <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
//                                 )}
//                             </div>
//                             <div>
//                                 <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
//                                     Real-Time Response Link
//                                 </h1>
//                                 {/* <p className="text-slate-400 font-mono text-lg mt-2">
//                                     Real-time ALARM monitoring & incident response system
//                                 </p> */}
//                                 {currentUser && (
//                                     <p className="text-slate-500 font-mono text-sm mt-1">
//                                         Logged in as: {currentUser.name} ({currentUser.role}
//                                         {currentUser.operatorType &&
//                                             ` - ${currentUser.operatorType}`}
//                                         )
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                         <div className="flex items-center space-x-4">
//                             {/* WebSocket Connection Status */}
//                             <div
//                                 className={cn(
//                                     "flex items-center space-x-2 px-4 py-2 rounded-lg border",
//                                     isConnected
//                                         ? "bg-green-600/20 border-green-500/30"
//                                         : "bg-red-600/20 border-red-500/30"
//                                 )}>
//                                 {isConnected ? (
//                                     <>
//                                         <Wifi className="h-4 w-4 text-green-400" />
//                                         <span className="text-green-400 font-mono text-sm">
//                                             REAL-TIME CONNECTED
//                                         </span>
//                                     </>
//                                 ) : (
//                                     <>
//                                         <WifiOff className="h-4 w-4 text-red-400" />
//                                         <span className="text-red-400 font-mono text-sm">
//                                             DISCONNECTED
//                                         </span>
//                                     </>
//                                 )}
//                             </div>

//                             {/* Alert Controls */}
//                             <div className="flex items-center space-x-2">
//                                 {/* Audio Toggle */}
//                                 {/* <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => {
//                                         setAudioEnabled(!audioEnabled);
//                                         audioService.setEnabled(!audioEnabled);
//                                     }}
//                                     className={cn(
//                                         "border-slate-600",
//                                         audioEnabled
//                                             ? "bg-blue-600/20 text-blue-400"
//                                             : "bg-slate-600/20 text-slate-400"
//                                     )}
//                                     title="Toggle audio alerts">
//                                     {audioEnabled ? (
//                                         <Volume2 className="h-4 w-4" />
//                                     ) : (
//                                         <VolumeX className="h-4 w-4" />
//                                     )}
//                                 </Button> */}

//                                 {/* Modal Toggle */}
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => setModalEnabled(!modalEnabled)}
//                                     className={cn(
//                                         "border-slate-600",
//                                         modalEnabled
//                                             ? "bg-purple-600/20 text-purple-400"
//                                             : "bg-slate-600/20 text-slate-400"
//                                     )}
//                                     title="Toggle persistent modal alerts">
//                                     <Monitor className="h-4 w-4" />
//                                 </Button>

//                                 {/* Emergency Stop Button */}
//                                 {/* <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => audioService.forceStopAllAlerts()}
//                                     className="border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600/40"
//                                     title="Emergency stop all audio alerts">
//                                     <StopCircle className="h-4 w-4" />
//                                 </Button> */}

//                                 {/* Test Audio Button */}
//                                 {/* <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => audioService.testAllSounds()}
//                                     className="border-slate-600 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
//                                     title="Test all alarm sounds">
//                                     <TestTube className="h-4 w-4" />
//                                 </Button> */}
//                             </div>

//                             {/* Refresh Button */}
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={fetchAlarms}
//                                 disabled={loading}
//                                 className="border-slate-600 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40">
//                                 <RefreshCw
//                                     className={cn("h-4 w-4", loading && "animate-spin")}
//                                 />
//                             </Button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Alert System Status */}
//                 <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
//                     {/* Persistent Audio Alert Status */}
//                     {audioEnabled && audioService.getActiveAlarmCount() > 0 && (
//                         <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 animate-pulse">
//                             <div className="flex items-center justify-between">
//                                 <div className="flex items-center space-x-3">
//                                     {/* <div className="flex items-center space-x-2">
//                                         {audioService.isCurrentlyPlaying() ? (
//                                             <Play className="h-5 w-5 text-red-400 animate-pulse" />
//                                         ) : (
//                                             <Pause className="h-5 w-5 text-red-400" />
//                                         )}
//                                         <Volume2 className="h-5 w-5 text-red-400" />
//                                     </div> */}
//                                     <div>
//                                         <span className="text-red-400 font-bold">
//                                             🚨 ALERTS ACTIVE
//                                         </span>
//                                         <p className="text-red-300 text-sm">
//                                             {audioService.getActiveAlarmCount()} active alarm
//                                             {audioService.getActiveAlarmCount() !== 1 ? "s" : ""}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* Persistent Modal Status */}
//                     {/* {modalEnabled && alarmStats.active > 0 && (
//                         <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4">
//                             <div className="flex items-center space-x-3">
//                                 <Monitor className="h-5 w-5 text-purple-400" />
//                                 <div>
//                                     <span className="text-purple-400 font-bold">
//                                         📱 MODAL ALERTS ACTIVE
//                                     </span>
//                                     <p className="text-purple-300 text-sm">
//                                         {alarmStats.active} alarm
//                                         {alarmStats.active !== 1 ? "s" : ""} showing persistent
//                                         modal
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     )} */}

//                     {/* Ready Status */}
//                     {audioEnabled && modalEnabled && alarmStats.active === 0 && (
//                         <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 md:col-span-2">
//                             <div className="flex items-center space-x-2">
//                                 {/* <Volume2 className="h-5 w-5 text-green-400" />
//                                 <Monitor className="h-5 w-5 text-green-400" /> */}
//                                 <span className="text-green-400 font-medium">
//                                     ALERT SYSTEMS READY
//                                 </span>
//                                 <span className="text-green-300 text-sm">
//                                     - Alerts will activate for all new active alarms
//                                 </span>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* Statistics Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                     <Card className="bg-slate-900/50 border-slate-700">
//                         <CardContent className="p-4">
//                             <div className="flex items-center space-x-2">
//                                 <Activity className="h-5 w-5 text-blue-400" />
//                                 <div>
//                                     <p className="text-sm text-slate-400">Total Alarms</p>
//                                     <p className="text-2xl font-bold text-white">
//                                         {alarmStats.total}
//                                     </p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     <Card className="bg-red-900/20 border-red-500/30">
//                         <CardContent className="p-4">
//                             <div className="flex items-center space-x-2">
//                                 <AlertTriangle className="h-5 w-5 text-red-400" />
//                                 <div>
//                                     <p className="text-sm text-red-300">Active</p>
//                                     <p className="text-2xl font-bold text-red-400">
//                                         {alarmStats.active}
//                                     </p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     <Card className="bg-yellow-900/20 border-yellow-500/30">
//                         <CardContent className="p-4">
//                             <div className="flex items-center space-x-2">
//                                 <Eye className="h-5 w-5 text-yellow-400" />
//                                 <div>
//                                     <p className="text-sm text-yellow-300">Acknowledged</p>
//                                     <p className="text-2xl font-bold text-yellow-400">
//                                         {alarmStats.acknowledged}
//                                     </p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     <Card className="bg-green-900/20 border-green-500/30">
//                         <CardContent className="p-4">
//                             <div className="flex items-center space-x-2">
//                                 <CheckCircle className="h-5 w-5 text-green-400" />
//                                 <div>
//                                     <p className="text-sm text-green-300">Resolved</p>
//                                     <p className="text-2xl font-bold text-green-400">
//                                         {alarmStats.resolved}
//                                     </p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* <Card className="bg-purple-900/20 border-purple-500/30">
//                         <CardContent className="p-4">
//                             <div className="flex items-center space-x-2">
//                                 <Zap className="h-5 w-5 text-purple-400" />
//                                 <div>
//                                     <p className="text-sm text-purple-300">Critical</p>
//                                     <p className="text-2xl font-bold text-purple-400">
//                                         {alarmStats.critical}
//                                     </p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card> */}

//                     {/* <Card className="bg-cyan-900/20 border-cyan-500/30">
//                         <CardContent className="p-4">
//                             <div className="flex items-center space-x-2">
//                                 <Radio className="h-5 w-5 text-cyan-400" />
//                                 <div>
//                                     <p className="text-sm text-cyan-300">Real-time</p>
//                                     <p className="text-2xl font-bold text-cyan-400">
//                                         {alarmStats.realTime}
//                                     </p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card> */}
//                 </div>

//                 {/* Filters */}
//                 <Card className="bg-slate-900/50 border-slate-700">
//                     <CardContent className="p-4">
//                         <div className="flex flex-col md:flex-row gap-4">
//                             <div className="flex-1">
//                                 <div className="relative">
//                                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
//                                     <Input
//                                         placeholder="Search alarms..."
//                                         value={searchTerm}
//                                         onChange={(e) => setSearchTerm(e.target.value)}
//                                         className="pl-10 bg-slate-800 border-slate-600 text-white"
//                                     />
//                                 </div>
//                             </div>
//                             <Select value={statusFilter} onValueChange={setStatusFilter}>
//                                 <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
//                                     <SelectValue placeholder="Filter by status" />
//                                 </SelectTrigger>
//                                 <SelectContent className="bg-slate-800 border-slate-600">
//                                     <SelectItem value="all">All Status</SelectItem>
//                                     <SelectItem value="ACTIVE">Active</SelectItem>
//                                     <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
//                                     <SelectItem value="RESOLVED">Resolved</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                             <Select value={severityFilter} onValueChange={setSeverityFilter}>
//                                 <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
//                                     <SelectValue placeholder="Filter by severity" />
//                                 </SelectTrigger>
//                                 <SelectContent className="bg-slate-800 border-slate-600">
//                                     <SelectItem value="all">All Severity</SelectItem>
//                                     <SelectItem value="CRITICAL">Critical</SelectItem>
//                                     <SelectItem value="HIGH">High</SelectItem>
//                                     <SelectItem value="MEDIUM">Medium</SelectItem>
//                                     <SelectItem value="LOW">Low</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Status Tabs */}
//                 <Card className="bg-slate-900/50 border-slate-700">
//                     <CardContent className="p-4">
//                         <div className="flex flex-wrap gap-2">
//                             <Button
//                                 variant={activeTab === "active" ? "default" : "outline"}
//                                 onClick={() => setActiveTab("active")}
//                                 className={cn(
//                                     "transition-all duration-200",
//                                     activeTab === "active"
//                                         ? "bg-red-600 hover:bg-red-700 text-white"
//                                         : "border-slate-600 text-slate-300 hover:bg-slate-800"
//                                 )}>
//                                 <AlertTriangle className="h-4 w-4 mr-2" />
//                                 Active Alarms ({alarmStats.active})
//                             </Button>
//                             <Button
//                                 variant={activeTab === "acknowledged" ? "default" : "outline"}
//                                 onClick={() => setActiveTab("acknowledged")}
//                                 className={cn(
//                                     "transition-all duration-200",
//                                     activeTab === "acknowledged"
//                                         ? "bg-yellow-600 hover:bg-yellow-700 text-white"
//                                         : "border-slate-600 text-slate-300 hover:bg-slate-800"
//                                 )}>
//                                 <Eye className="h-4 w-4 mr-2" />
//                                 Acknowledged ({alarmStats.acknowledged})
//                             </Button>
//                             <Button
//                                 variant={activeTab === "resolved" ? "default" : "outline"}
//                                 onClick={() => setActiveTab("resolved")}
//                                 className={cn(
//                                     "transition-all duration-200",
//                                     activeTab === "resolved"
//                                         ? "bg-green-600 hover:bg-green-700 text-white"
//                                         : "border-slate-600 text-slate-300 hover:bg-slate-800"
//                                 )}>
//                                 <CheckCircle className="h-4 w-4 mr-2" />
//                                 Resolved ({alarmStats.resolved})
//                             </Button>
//                             <Button
//                                 variant={activeTab === "all" ? "default" : "outline"}
//                                 onClick={() => setActiveTab("all")}
//                                 className={cn(
//                                     "transition-all duration-200",
//                                     activeTab === "all"
//                                         ? "bg-blue-600 hover:bg-blue-700 text-white"
//                                         : "border-slate-600 text-slate-300 hover:bg-slate-800"
//                                 )}>
//                                 <Activity className="h-4 w-4 mr-2" />
//                                 All Alarms ({alarmStats.total})
//                             </Button>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Alarms List */}
//                 <div className="space-y-4">
//                     {filteredAlarms.length === 0 ? (
//                         <Card className="bg-slate-900/50 border-slate-700">
//                             <CardContent className="p-8 text-center">
//                                 <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
//                                 <p className="text-slate-400 text-lg">
//                                     No {activeTab === "all" ? "" : activeTab.toLowerCase()} alarms
//                                     found
//                                 </p>
//                                 <p className="text-slate-500 text-sm mt-2">
//                                     {searchTerm ||
//                                     statusFilter !== "all" ||
//                                     severityFilter !== "all"
//                                         ? "Try adjusting your filters"
//                                         : activeTab === "active"
//                                         ? "All clear! No active alarms at this time."
//                                         : `No ${activeTab} alarms to display.`}
//                                 </p>
//                             </CardContent>
//                         </Card>
//                     ) : (
//                         filteredAlarms.map((alarm) => (
//                             <Card
//                                 key={alarm.id}
//                                 className={cn(
//                                     "bg-slate-900/50 border-slate-700 transition-all duration-300",
//                                     alarm.isRealTime &&
//                                         "ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20",
//                                     alarm.severity === "CRITICAL" &&
//                                         "border-red-500/50 bg-red-900/10",
//                                     alarm.status === "ACTIVE" &&
//                                         (audioEnabled || modalEnabled) &&
//                                         "ring-1 ring-red-400/30"
//                                 )}>
//                                 <CardContent className="p-6">
//                                     <div className="flex items-start justify-between">
//                                         <div className="flex-1 space-y-3">
//                                             <div className="flex items-center space-x-3">
//                                                 {/* <Badge className={getSeverityColor(alarm.severity)}>
//                                                     {alarm.severity}
//                                                 </Badge> */}
//                                                 <Badge
//                                                     variant="outline"
//                                                     className={getStatusColor(alarm.status)}>
//                                                     {alarm.status}
//                                                 </Badge>
//                                                 {/* {alarm.isRealTime && (
//                                                     <Badge className="bg-cyan-600 text-white animate-pulse">
//                                                         <Radio className="h-3 w-3 mr-1" />
//                                                         LIVE
//                                                     </Badge>
//                                                 )}
//                                                 {alarm.status === "ACTIVE" && audioEnabled && (
//                                                     <Badge className="bg-red-600 text-white animate-pulse">
//                                                         <Volume2 className="h-3 w-3 mr-1" />
//                                                         AUDIO
//                                                     </Badge>
//                                                 )} */}
//                                                 {/* {alarm.status === "ACTIVE" && modalEnabled && (
//                                                     <Badge className="bg-purple-600 text-white animate-pulse">
//                                                         <Monitor className="h-3 w-3 mr-1" />
//                                                         MODAL
//                                                     </Badge>
//                                                 )} */}
//                                                 <Badge className="bg-gray-800 text-white">
//                                                     <span className="text-sm text-slate-400 font-mono">
//                                                         #{alarm.id.slice(-8)}
//                                                     </span>
//                                                 </Badge>
//                                             </div>

//                                             <div>
//                                                 <h3 className="text-lg font-semibold text-white mb-1">
//                                                     {alarm.type}
//                                                 </h3>
//                                                 <p className="text-slate-300">{alarm.description}</p>
//                                             </div>

//                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                                                 <div className="flex items-center space-x-2">
//                                                     <MapPin className="h-4 w-4 text-slate-400" />
//                                                     <span className="text-slate-300">
//                                                         {alarm.branch.name}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-2">
//                                                     <Users className="h-4 w-4 text-slate-400" />
//                                                     <span className="text-slate-300">
//                                                         {alarm.createdBy.name}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-2">
//                                                     <Calendar className="h-4 w-4 text-slate-400" />
//                                                     <span className="text-slate-300">
//                                                         {new Date(alarm.createdAt).toLocaleString()}
//                                                     </span>
//                                                 </div>
//                                             </div>

//                                             {alarm.location && (
//                                                 <div className="flex items-center space-x-2 text-sm">
//                                                     <Navigation className="h-4 w-4 text-slate-400" />
//                                                     <span className="text-slate-300">
//                                                         {alarm.location}
//                                                     </span>
//                                                 </div>
//                                             )}
//                                         </div>

//                                         <div className="flex flex-col space-y-2 ml-4">
//                                             <Button
//                                                 variant="outline"
//                                                 size="sm"
//                                                 onClick={() => viewAlarmDetails(alarm.id)}
//                                                 className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
//                                                 <Eye className="h-4 w-4 mr-2" />
//                                                 Details
//                                             </Button>

//                                             {alarm.status === "ACTIVE" && (
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => acknowledgeAlarm(alarm.id)}
//                                                     disabled={updating}
//                                                     className="border-yellow-600 bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40">
//                                                     {updating ? (
//                                                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                                     ) : (
//                                                         <CheckCircle className="h-4 w-4 mr-2" />
//                                                     )}
//                                                     Acknowledge
//                                                 </Button>
//                                             )}

//                                             {alarm.status === "ACKNOWLEDGED" && (
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => {
//                                                         setSelectedAlarm(alarm);
//                                                         setIsResolutionDialogOpen(true);
//                                                     }}
//                                                     className="border-green-600 bg-green-600/20 text-green-300 hover:bg-green-600/40">
//                                                     <Target className="h-4 w-4 mr-2" />
//                                                     Resolve
//                                                 </Button>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         ))
//                     )}
//                 </div>

//                 {/* Alarm Details Dialog */}
//                 {/* Enhanced Alarm Details Dialog */}
//                 <Dialog
//                     open={isDetailsDialogOpen}
//                     onOpenChange={setIsDetailsDialogOpen}>
//                     <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
//                         <DialogHeader>
//                             <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
//                                 <AlertTriangle className="h-6 w-6 text-red-400" />
//                                 <span>Alarm Details - {selectedAlarm?.type}</span>
//                                 {selectedAlarm?.isRealTime && (
//                                     <Badge className="bg-cyan-600 text-white animate-pulse">
//                                         {selectedAlarm?.status}
//                                     </Badge>
//                                 )}
//                             </DialogTitle>
//                             <DialogDescription className="text-slate-400">
//                                 Complete information about this alarm incident
//                             </DialogDescription>
//                         </DialogHeader>

//                         {selectedAlarm && (
//                             <div className="space-y-6">
//                                 {/* Company and Branch Header */}
//                                 <div className="bg-slate-800 rounded-lg p-4">
//                                     <div className="flex items-center space-x-4">
//                                         {selectedAlarm.branch.company?.logo && (
//                                             <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
//                                                 <img
//                                                     src={
//                                                         selectedAlarm.branch.company.logo.startsWith("http")
//                                                             ? selectedAlarm.branch.company.logo
//                                                             : `http://8436insight.et:3003${(
//                                                                     selectedAlarm as any
//                                                               )?.branch?.company?.logo.replace(
//                                                                     "/var/www/html/koppa-security-api",
//                                                                     ""
//                                                               )}`
//                                                     }
//                                                     alt={`${selectedAlarm.branch.company.name} logo`}
//                                                     className="h-14 w-14 object-cover rounded-xl shadow-lg border border-slate-600"
//                                                     // onError={(e) => {
//                                                     // 	console.error(
//                                                     // 		"Failed to load company logo:",
//                                                     // 		currentAlarm.branch.company.logo
//                                                     // 	);
//                                                     // 	e.currentTarget.style.display = "none";
//                                                     // }}
//                                                 />
//                                             </div>
//                                         )}
//                                         <div className="flex-1">
//                                             <h3 className="text-xl font-bold text-white">
//                                                 {selectedAlarm.branch.company?.name ||
//                                                     "Unknown Company"}
//                                             </h3>
//                                             <div className="flex items-center space-x-2 mt-1">
//                                                 <Building className="h-4 w-4 text-blue-400" />
//                                                 <span className="text-slate-300">
//                                                     {selectedAlarm.branch.name}
//                                                 </span>
//                                             </div>
//                                         </div>
//                                         <div className="text-right">
//                                             {/* <Badge
//                                                 className={getSeverityColor(selectedAlarm.severity)}>
//                                                 {selectedAlarm.severity}
//                                             </Badge> */}
//                                             <Badge
//                                                 variant="outline"
//                                                 className={getStatusColor(selectedAlarm.status)}
//                                                 style={{ marginLeft: "8px" }}>
//                                                 {selectedAlarm.status}
//                                             </Badge>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Main Content Grid */}
//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     {/* Left Column - Details */}
//                                     <div className="space-y-4">
//                                         <div>
//                                             <Label className="text-slate-300 text-lg font-medium">
//                                                 Incident Description
//                                             </Label>
//                                             <div className="bg-slate-800 rounded-lg p-4 mt-2">
//                                                 <p className="text-white">
//                                                     {selectedAlarm.description}
//                                                 </p>
//                                             </div>
//                                         </div>

//                                         {selectedAlarm.additionalNotes && (
//                                             <div>
//                                                 <Label className="text-slate-300 text-lg font-medium">
//                                                     Additional Notes
//                                                 </Label>
//                                                 <div className="bg-slate-800 rounded-lg p-4 mt-2">
//                                                     <p className="text-white">
//                                                         {selectedAlarm.additionalNotes}
//                                                     </p>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         <div className="grid grid-cols-2 gap-4">
//                                             <div>
//                                                 <Label className="text-slate-300">Created By</Label>
//                                                 <div className="bg-slate-800 rounded-lg p-3 mt-2">
//                                                     <div className="flex items-center space-x-2">
//                                                         <User className="h-4 w-4 text-slate-400" />
//                                                         <span className="text-white">
//                                                             {selectedAlarm.createdBy.name}
//                                                         </span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                             <div>
//                                                 <Label className="text-slate-300">Created At</Label>
//                                                 <div className="bg-slate-800 rounded-lg p-3 mt-2">
//                                                     <div className="flex items-center space-x-2">
//                                                         <Clock className="h-4 w-4 text-slate-400" />
//                                                         <span className="text-white">
//                                                             {new Date(
//                                                                 selectedAlarm.createdAt
//                                                             ).toLocaleString()}
//                                                         </span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>

//                                         {selectedAlarm.acknowledgedAt && (
//                                             <div>
//                                                 <Label className="text-slate-300">
//                                                     Acknowledged At
//                                                 </Label>
//                                                 <div className="bg-slate-800 rounded-lg p-3 mt-2">
//                                                     <span className="text-white">
//                                                         {new Date(
//                                                             selectedAlarm.acknowledgedAt
//                                                         ).toLocaleString()}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {selectedAlarm.resolutionDescription && (
//                                             <div>
//                                                 <Label className="text-slate-300">Resolution</Label>
//                                                 <div className="bg-slate-800 rounded-lg p-4 mt-2">
//                                                     <p className="text-white">
//                                                         {selectedAlarm.resolutionDescription}
//                                                     </p>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>

//                                     {/* Right Column - Map and Location */}
//                                     <div className="space-y-4">
//                                         {/* Large Google Map */}
//                                         {selectedAlarm.coordinates && (
//                                             <div>
//                                                 <Label className="text-slate-300 text-lg font-medium">
//                                                     Location Map
//                                                 </Label>
//                                                 <div className="bg-slate-800 rounded-lg p-4 mt-2">
//                                                     <div className="w-full h-80 rounded-lg overflow-hidden">
//                                                         <iframe
//                                                             src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&q=${selectedAlarm.coordinates.latitude},${selectedAlarm.coordinates.longitude}&zoom=16&maptype=roadmap`}
//                                                             width="100%"
//                                                             height="100%"
//                                                             style={{ border: 0 }}
//                                                             allowFullScreen
//                                                             loading="lazy"
//                                                             referrerPolicy="no-referrer-when-downgrade"
//                                                         />
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {/* GPS Coordinates */}
//                                         <div>
//                                             <Label className="text-slate-300">GPS Coordinates</Label>
//                                             <div className="bg-slate-800 rounded-lg p-4 mt-2">
//                                                 <div className="flex items-center space-x-2 mb-2">
//                                                     <MapPin className="h-4 w-4 text-purple-400" />
//                                                     <span className="text-white font-medium">
//                                                         Precise Location
//                                                     </span>
//                                                 </div>
//                                                 <p className="text-slate-300 font-mono">
//                                                     Lat:{" "}
//                                                     {selectedAlarm.coordinates?.latitude.toFixed(6) ||
//                                                         selectedAlarm.latitude ||
//                                                         "N/A"}
//                                                 </p>
//                                                 <p className="text-slate-300 font-mono">
//                                                     Lng:{" "}
//                                                     {selectedAlarm.coordinates?.longitude.toFixed(6) ||
//                                                         selectedAlarm.longitude ||
//                                                         "N/A"}
//                                                 </p>
//                                                 {selectedAlarm.location && (
//                                                     <p className="text-slate-400 text-sm mt-2">
//                                                         {selectedAlarm.location}
//                                                     </p>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Action Buttons */}
//                                 <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
//                                     {selectedAlarm.status === "ACTIVE" && (
//                                         <>
//                                             <Button
//                                                 onClick={() =>
//                                                     changeAlarmStatus(selectedAlarm.id, "ACKNOWLEDGED")
//                                                 }
//                                                 disabled={updating}
//                                                 className="bg-yellow-600 hover:bg-yellow-700 text-white">
//                                                 {updating ? (
//                                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                                 ) : (
//                                                     <Eye className="h-4 w-4 mr-2" />
//                                                 )}
//                                                 Acknowledge
//                                             </Button>
//                                             <Button
//                                                 onClick={() =>
//                                                     changeAlarmStatus(selectedAlarm.id, "RESOLVED")
//                                                 }
//                                                 disabled={updating}
//                                                 className="bg-green-600 hover:bg-green-700 text-white">
//                                                 {updating ? (
//                                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                                 ) : (
//                                                     <CheckCircle className="h-4 w-4 mr-2" />
//                                                 )}
//                                                 Mark Resolved
//                                             </Button>
//                                         </>
//                                     )}

//                                     {selectedAlarm.status === "ACKNOWLEDGED" && (
//                                         <>
//                                             {/* <Button
//                                                 onClick={() =>
//                                                     changeAlarmStatus(selectedAlarm.id, "ACTIVE")
//                                                 }
//                                                 disabled={updating}
//                                                 className="bg-red-600 hover:bg-red-700 text-white">
//                                                 {updating ? (
//                                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                                 ) : (
//                                                     <AlertTriangle className="h-4 w-4 mr-2" />
//                                                 )}
//                                                 Reactivate
//                                             </Button> */}
//                                             <Button
//                                                 onClick={() => {
//                                                     setSelectedAlarm(selectedAlarm);
//                                                     setIsResolutionDialogOpen(true);
//                                                     setIsDetailsDialogOpen(false);
//                                                 }}
//                                                 className="bg-green-600 hover:bg-green-700 text-white">
//                                                 <Target className="h-4 w-4 mr-2" />
//                                                 Resolve with Notes
//                                             </Button>
//                                         </>
//                                     )}

//                                     {selectedAlarm.status === "RESOLVED" && (
//                                         <Button
//                                             onClick={() =>
//                                                 changeAlarmStatus(selectedAlarm.id, "ACTIVE")
//                                             }
//                                             disabled={updating}
//                                             className="bg-red-600 hover:bg-red-700 text-white">
//                                             {updating ? (
//                                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                             ) : (
//                                                 <AlertTriangle className="h-4 w-4 mr-2" />
//                                             )}
//                                             Reopen Alarm
//                                         </Button>
//                                     )}

//                                     <Button
//                                         variant="outline"
//                                         onClick={() => setIsDetailsDialogOpen(false)}
//                                         className="border-slate-600 text-slate-300 hover:bg-slate-800">
//                                         Close
//                                     </Button>
//                                 </div>
//                             </div>
//                         )}
//                     </DialogContent>
//                 </Dialog>

//                 {/* Resolution Dialog */}
//                 <Dialog
//                     open={isResolutionDialogOpen}
//                     onOpenChange={setIsResolutionDialogOpen}>
//                     <DialogContent className="bg-slate-900 border-slate-700 text-white">
//                         <DialogHeader>
//                             <DialogTitle>Resolve Alarm</DialogTitle>
//                             <DialogDescription className="text-slate-400">
//                                 Provide details about how this alarm was resolved
//                             </DialogDescription>
//                         </DialogHeader>

//                         <div className="space-y-4">
//                             <div>
//                                 <Label htmlFor="resolution" className="text-slate-300">
//                                     Resolution Description
//                                 </Label>
//                                 <Textarea
//                                     id="resolution"
//                                     placeholder="Describe how the alarm was resolved..."
//                                     value={resolutionDescription}
//                                     onChange={(e) => setResolutionDescription(e.target.value)}
//                                     className="bg-slate-800 border-slate-600 text-white mt-2"
//                                     rows={4}
//                                 />
//                             </div>

//                             <div className="flex justify-end space-x-2">
//                                 <Button
//                                     variant="outline"
//                                     onClick={() => setIsResolutionDialogOpen(false)}
//                                     className="border-slate-600 text-slate-300">
//                                     Cancel
//                                 </Button>
//                                 <Button
//                                     onClick={resolveAlarm}
//                                     disabled={updating || !resolutionDescription.trim()}
//                                     className="bg-green-600 hover:bg-green-700 text-white">
//                                     {updating ? (
//                                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                     ) : (
//                                         <CheckCircle className="h-4 w-4 mr-2" />
//                                     )}
//                                     Resolve Alarm
//                                 </Button>
//                             </div>
//                         </div>
//                     </DialogContent>
//                 </Dialog>
//             </div>
//         </div>
//     );
// }

// // "use client";

// // import { useState, useEffect, useCallback, useMemo } from "react";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { Input } from "@/components/ui/input";
// // import {
// // 	Select,
// // 	SelectContent,
// // 	SelectItem,
// // 	SelectTrigger,
// // 	SelectValue,
// // } from "@/components/ui/select";
// // import {
// // 	Dialog,
// // 	DialogContent,
// // 	DialogDescription,
// // 	DialogHeader,
// // 	DialogTitle,
// // } from "@/components/ui/dialog";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Label } from "@/components/ui/label";
// // import { Skeleton } from "@/components/ui/skeleton";
// // import { useToast } from "@/hooks/use-toast";
// // import { useWebSocket } from "@/hooks/use-websocket";
// // import { apiClient } from "@/lib/api";
// // import { audioService } from "@/lib/audio-service";
// // import { PersistentAlarmModal } from "@/components/persistent-alarm-modal";
// // import {
// // 	AlertTriangle,
// // 	CheckCircle,
// // 	Shield,
// // 	Eye,
// // 	MapPin,
// // 	Calendar,
// // 	Loader2,
// // 	Search,
// // 	Zap,
// // 	Activity,
// // 	Target,
// // 	Radio,
// // 	Wifi,
// // 	AlertCircle,
// // 	Navigation,
// // 	WifiOff,
// // 	RefreshCw,
// // 	Users,
// // 	Volume2,
// // 	VolumeX,
// // 	TestTube,
// // 	StopCircle,
// // 	Play,
// // 	Pause,
// // 	Monitor,
// // 	Building,
// // 	User,
// // 	Clock,
// // } from "lucide-react";
// // import { cn } from "@/lib/utils";

// // interface Alarm {
// // 	id: string;
// // 	type: string;
// // 	branchId: string;
// // 	branch: {
// // 		id: string;
// // 		name: string;
// // 		company?: {
// // 			id: string;
// // 			name: string;
// // 			logo?: string;
// // 		};
// // 	};
// // 	location: string;
// // 	latitude: string;
// // 	longitude: string;
// // 	coordinates?: {
// // 		latitude: number;
// // 		longitude: number;
// // 	};
// // 	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
// // 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// // 	description: string;
// // 	additionalNotes?: string;
// // 	createdBy: {
// // 		id: string;
// // 		name: string;
// // 	};
// // 	createdAt: string;
// // 	acknowledgedAt?: string;
// // 	completedAt?: string;
// // 	resolutionDescription?: string;
// // 	responseTime?: string;
// // 	priority?: number;
// // 	isRealTime?: boolean;
// // }

// // export default function EnhancedAlarmReportsPage() {
// // 	// State management
// // 	const [alarms, setAlarms] = useState<any[]>([]);
// // 	const [loading, setLoading] = useState(true);
// // 	const [updating, setUpdating] = useState(false);
// // 	const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
// // 	const [resolutionDescription, setResolutionDescription] = useState("");
// // 	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
// // 	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
// // 	const [audioEnabled, setAudioEnabled] = useState(true);
// // 	const [modalEnabled, setModalEnabled] = useState(true);
// // 	const [currentUser, setCurrentUser] = useState<any | null>(null);
// // 	const [searchTerm, setSearchTerm] = useState("");
// // 	const [statusFilter, setStatusFilter] = useState<string>("all");
// // 	const [severityFilter, setSeverityFilter] = useState<string>("all");

// // 	const { toast } = useToast();

// // 	// Get authentication token
// // 	const token =
// // 		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

// // 	// Update audio service whenever alarms change
// // 	useEffect(() => {
// // 		if (audioEnabled) {
// // 			audioService.updateActiveAlarms(alarms);
// // 		}
// // 	}, [alarms, audioEnabled]);

// // 	// WebSocket connection with real-time alarm handling
// // 	const { isConnected, userInfo } = useWebSocket(token, {
// // 		autoConnect: true,
// // 		onAlarmCreated: useCallback(
// // 			async (newAlarm: any) => {
// // 				console.log("🚨 New real-time alarm received:", newAlarm);

// // 				// Transform the alarm data to match our interface
// // 				const transformedAlarm: any = {
// // 					id: newAlarm.id,
// // 					type: newAlarm.type,
// // 					branchId: newAlarm.branchId,
// // 					branch: {
// // 						id: newAlarm.branchId,
// // 						name: newAlarm.branchName || "Unknown Branch",
// // 					},
// // 					location: newAlarm.location || "",
// // 					latitude: newAlarm.latitude || "",
// // 					longitude: newAlarm.longitude || "",
// // 					coordinates: {
// // 						latitude: newAlarm.latitude
// // 							? Number(newAlarm.latitude)
// // 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// // 						longitude: newAlarm.longitude
// // 							? Number(newAlarm.longitude)
// // 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// // 					},
// // 					status: newAlarm.status || "ACTIVE",
// // 					severity: newAlarm.severity,
// // 					description: newAlarm.description,
// // 					additionalNotes: newAlarm.additionalNotes,
// // 					createdBy: {
// // 						id: newAlarm.createdBy?.id || "",
// // 						name: newAlarm.createdBy || "Unknown User",
// // 					},
// // 					createdAt: newAlarm.createdAt,
// // 					priority: newAlarm.priority || getSeverityPriority(newAlarm.severity),
// // 					isRealTime: true,
// // 				};

// // 				// Add to the beginning of alarms list
// // 				setAlarms((prev) => {
// // 					const exists = prev.some((alarm) => alarm.id === transformedAlarm.id);
// // 					if (exists) {
// // 						return prev.map((alarm) =>
// // 							alarm.id === transformedAlarm.id ? transformedAlarm : alarm
// // 						);
// // 					}
// // 					return [transformedAlarm, ...prev];
// // 				});

// // 				// 🚨 CRITICAL: Add to persistent audio alerts
// // 				if (audioEnabled && transformedAlarm.status === "ACTIVE") {
// // 					audioService.addActiveAlarm(
// // 						transformedAlarm.id,
// // 						transformedAlarm.severity
// // 					);
// // 				}

// // 				// Show visual notification
// // 				toast({
// // 					title: `🚨 ${newAlarm.severity} ALARM RECEIVED`,
// // 					description: `${newAlarm.type} at ${
// // 						newAlarm.branchName || newAlarm.location
// // 					}`,
// // 					variant: newAlarm.severity === "CRITICAL" ? "destructive" : "default",
// // 					duration: newAlarm.severity === "CRITICAL" ? 15000 : 10000,
// // 				});

// // 				// Browser notification
// // 				if ("Notification" in window && Notification.permission === "granted") {
// // 					new Notification(`🚨 ${newAlarm.severity} EMERGENCY ALARM`, {
// // 						body: `${newAlarm.type} at ${
// // 							newAlarm.branchName || newAlarm.location
// // 						}`,
// // 						icon: "/favicon.ico",
// // 						tag: `alarm-${newAlarm.id}`,
// // 						requireInteraction: newAlarm.severity === "CRITICAL",
// // 					});
// // 				}
// // 			},
// // 			[audioEnabled, toast]
// // 		),

// // 		onAlarmUpdated: useCallback(
// // 			(updatedAlarm: any) => {
// // 				console.log("🔄 Alarm update received:", updatedAlarm);

// // 				setAlarms((prev) =>
// // 					prev.map((alarm) => {
// // 						if (alarm.id === updatedAlarm.id) {
// // 							const updated = {
// // 								...alarm,
// // 								status: updatedAlarm.status,
// // 								acknowledgedAt: updatedAlarm.acknowledgedAt,
// // 								completedAt: updatedAlarm.completedAt,
// // 								resolutionDescription: updatedAlarm.resolutionDescription,
// // 								isRealTime: true,
// // 							};

// // 							// Remove from audio alerts if acknowledged or resolved
// // 							if (updated.status !== "ACTIVE") {
// // 								audioService.removeActiveAlarm(updated.id);
// // 							}

// // 							return updated;
// // 						}
// // 						return alarm;
// // 					})
// // 				);

// // 				// Show update notification
// // 				if (updatedAlarm.status === "RESOLVED") {
// // 					toast({
// // 						title: "✅ Alarm Resolved",
// // 						description: `Alarm at ${
// // 							updatedAlarm.branchName || updatedAlarm.location
// // 						} has been resolved`,
// // 					});
// // 				} else if (updatedAlarm.status === "ACKNOWLEDGED") {
// // 					toast({
// // 						title: "👁️ Alarm Acknowledged",
// // 						description: `Alarm at ${
// // 							updatedAlarm.branchName || updatedAlarm.location
// // 						} has been acknowledged`,
// // 					});
// // 				}
// // 			},
// // 			[toast]
// // 		),

// // 		onSystemNotification: useCallback(
// // 			(notification: any) => {
// // 				toast({
// // 					title: "📢 System Notification",
// // 					description: notification.message,
// // 					variant:
// // 						notification.severity === "error" ? "destructive" : "default",
// // 				});
// // 			},
// // 			[toast]
// // 		),
// // 	});

// // 	// Load current user info
// // 	useEffect(() => {
// // 		const loadCurrentUser = async () => {
// // 			try {
// // 				const storedUser = localStorage.getItem("currentUser");
// // 				if (storedUser) {
// // 					setCurrentUser(JSON.parse(storedUser));
// // 				} else {
// // 					const user = await apiClient.getCurrentUser();
// // 					setCurrentUser(user);
// // 				}
// // 			} catch (error) {
// // 				console.error("Failed to load current user:", error);
// // 			}
// // 		};

// // 		loadCurrentUser();
// // 	}, []);

// // 	// Request notification permission on component mount
// // 	useEffect(() => {
// // 		if ("Notification" in window && Notification.permission === "default") {
// // 			Notification.requestPermission().then((permission) => {
// // 				console.log(`Notification permission: ${permission}`);
// // 			});
// // 		}
// // 	}, []);

// // 	// Initialize audio service settings
// // 	useEffect(() => {
// // 		audioService.setEnabled(audioEnabled);
// // 	}, [audioEnabled]);

// // 	// Initial alarm fetch
// // 	useEffect(() => {
// // 		fetchAlarms();
// // 	}, []);

// // 	const fetchAlarms = async () => {
// // 		try {
// // 			setLoading(true);
// // 			const response = await apiClient.getAlarms();
// // 			console.log("Fetched alarms from API:", response);

// // 			const alarmsWithCoords =
// // 				(response as any).alarms?.map((alarm: any) => ({
// // 					...alarm,
// // 					coordinates: {
// // 						latitude: alarm?.latitude
// // 							? Number(alarm?.latitude)
// // 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// // 						longitude: alarm?.longitude
// // 							? Number(alarm?.longitude)
// // 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// // 					},
// // 					isRealTime: false,
// // 				})) || [];

// // 			setAlarms(alarmsWithCoords);
// // 		} catch (error) {
// // 			console.error("Failed to fetch alarms:", error);
// // 			toast({
// // 				title: "Error",
// // 				description: "Failed to fetch alarms",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setLoading(false);
// // 		}
// // 	};

// // 	const acknowledgeAlarm = async (alarmId: string) => {
// // 		try {
// // 			setUpdating(true);
// // 			await apiClient.updateAlarm(alarmId, {
// // 				status: "ACKNOWLEDGED",
// // 				acknowledgedAt: new Date().toISOString(),
// // 			});

// // 			toast({
// // 				title: "Success",
// // 				description: "Alarm acknowledged successfully",
// // 			});

// // 			// Update local state immediately
// // 			setAlarms((prev) =>
// // 				prev.map((alarm) =>
// // 					alarm.id === alarmId
// // 						? {
// // 								...alarm,
// // 								status: "ACKNOWLEDGED" as const,
// // 								acknowledgedAt: new Date().toISOString(),
// // 						  }
// // 						: alarm
// // 				)
// // 			);

// // 			// Remove from audio alerts
// // 			audioService.removeActiveAlarm(alarmId);
// // 		} catch (error: any) {
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to acknowledge alarm",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setUpdating(false);
// // 		}
// // 	};

// // 	const resolveAlarm = async () => {
// // 		if (!selectedAlarm) return;

// // 		try {
// // 			setUpdating(true);
// // 			await apiClient.updateAlarm(selectedAlarm.id, {
// // 				status: "RESOLVED",
// // 				completedAt: new Date().toISOString(),
// // 				resolutionDescription,
// // 			});

// // 			toast({
// // 				title: "Success",
// // 				description: "Alarm resolved successfully",
// // 			});

// // 			// Update local state
// // 			setAlarms((prev) =>
// // 				prev.map((alarm) =>
// // 					alarm.id === selectedAlarm.id
// // 						? {
// // 								...alarm,
// // 								status: "RESOLVED" as const,
// // 								completedAt: new Date().toISOString(),
// // 								resolutionDescription,
// // 						  }
// // 						: alarm
// // 				)
// // 			);

// // 			// Remove from audio alerts
// // 			audioService.removeActiveAlarm(selectedAlarm.id);

// // 			setIsResolutionDialogOpen(false);
// // 			setResolutionDescription("");
// // 			setSelectedAlarm(null);
// // 		} catch (error: any) {
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to resolve alarm",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setUpdating(false);
// // 		}
// // 	};

// // 	const changeAlarmStatus = async (
// // 		alarmId: string,
// // 		newStatus: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED"
// // 	) => {
// // 		try {
// // 			setUpdating(true);
// // 			const updateData: any = {
// // 				status: newStatus,
// // 			};

// // 			if (newStatus === "ACKNOWLEDGED") {
// // 				updateData.acknowledgedAt = new Date().toISOString();
// // 			} else if (newStatus === "RESOLVED") {
// // 				updateData.completedAt = new Date().toISOString();
// // 				updateData.resolutionDescription =
// // 					resolutionDescription || "Status changed from modal";
// // 			}

// // 			await apiClient.updateAlarm(alarmId, updateData);

// // 			toast({
// // 				title: "Status Updated",
// // 				description: `Alarm status changed to ${newStatus}`,
// // 			});

// // 			// Update local state
// // 			setAlarms((prev) =>
// // 				prev.map((alarm) =>
// // 					alarm.id === alarmId ? { ...alarm, ...updateData } : alarm
// // 				)
// // 			);

// // 			// Remove from audio alerts if not active
// // 			if (newStatus !== "ACTIVE") {
// // 				audioService.removeActiveAlarm(alarmId);
// // 			}

// // 			setIsDetailsDialogOpen(false);
// // 		} catch (error: any) {
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to update alarm status",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setUpdating(false);
// // 		}
// // 	};

// // 	const viewAlarmDetails = (alarmId: string) => {
// // 		const alarm = alarms.find((a) => a.id === alarmId);
// // 		if (alarm) {
// // 			setSelectedAlarm(alarm);
// // 			setIsDetailsDialogOpen(true);
// // 		}
// // 	};

// // 	// Helper functions
// // 	const getSeverityPriority = (severity: string): number => {
// // 		switch (severity) {
// // 			case "CRITICAL":
// // 				return 1;
// // 			case "HIGH":
// // 				return 2;
// // 			case "MEDIUM":
// // 				return 3;
// // 			case "LOW":
// // 				return 4;
// // 			default:
// // 				return 5;
// // 		}
// // 	};

// // 	const getSeverityColor = (severity: string) => {
// // 		switch (severity) {
// // 			case "CRITICAL":
// // 				return "bg-red-600 text-white";
// // 			case "HIGH":
// // 				return "bg-orange-600 text-white";
// // 			case "MEDIUM":
// // 				return "bg-yellow-600 text-white";
// // 			case "LOW":
// // 				return "bg-blue-600 text-white";
// // 			default:
// // 				return "bg-gray-600 text-white";
// // 		}
// // 	};

// // 	const getStatusColor = (status: string) => {
// // 		switch (status) {
// // 			case "ACTIVE":
// // 				return "bg-red-100 text-red-800 border-red-200";
// // 			case "ACKNOWLEDGED":
// // 				return "bg-yellow-100 text-yellow-800 border-yellow-200";
// // 			case "RESOLVED":
// // 				return "bg-green-100 text-green-800 border-green-200";
// // 			default:
// // 				return "bg-gray-100 text-gray-800 border-gray-200";
// // 		}
// // 	};

// // 	// Filter alarms based on search and filters
// // 	const filteredAlarms = useMemo(() => {
// // 		return alarms
// // 			.filter((alarm) => {
// // 				const matchesSearch =
// // 					searchTerm === "" ||
// // 					alarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // 					alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // 					alarm.type.toLowerCase().includes(searchTerm.toLowerCase());

// // 				const matchesStatus =
// // 					statusFilter === "all" || alarm.status === statusFilter;
// // 				const matchesSeverity =
// // 					severityFilter === "all" || alarm.severity === severityFilter;

// // 				return matchesSearch && matchesStatus && matchesSeverity;
// // 			})
// // 			.sort((a, b) => {
// // 				if (a.priority !== b.priority) {
// // 					return (a.priority || 5) - (b.priority || 5);
// // 				}
// // 				return (
// // 					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// // 				);
// // 			});
// // 	}, [alarms, searchTerm, statusFilter, severityFilter]);

// // 	// Statistics
// // 	const alarmStats = useMemo(() => {
// // 		const total = alarms.length;
// // 		const active = alarms.filter((a) => a.status === "ACTIVE").length;
// // 		const acknowledged = alarms.filter(
// // 			(a) => a.status === "ACKNOWLEDGED"
// // 		).length;
// // 		const resolved = alarms.filter((a) => a.status === "RESOLVED").length;
// // 		const critical = alarms.filter((a) => a.severity === "CRITICAL").length;
// // 		const realTime = alarms.filter((a) => a.isRealTime).length;

// // 		return { total, active, acknowledged, resolved, critical, realTime };
// // 	}, [alarms]);

// // 	if (loading) {
// // 		return (
// // 			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
// // 				<div className="space-y-6">
// // 					<Skeleton className="h-32 w-full bg-slate-800" />
// // 					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
// // 						{[...Array(4)].map((_, i) => (
// // 							<Skeleton key={i} className="h-24 bg-slate-800" />
// // 						))}
// // 					</div>
// // 					<Skeleton className="h-96 w-full bg-slate-800" />
// // 				</div>
// // 			</div>
// // 		);
// // 	}

// // 	return (
// // 		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
// // 			<div className="space-y-6 p-6">
// // 				{/* Persistent Alarm Modal */}
// // 				{modalEnabled && (
// // 					<PersistentAlarmModal
// // 						alarms={alarms}
// // 						onAcknowledge={acknowledgeAlarm}
// // 						onViewDetails={viewAlarmDetails}
// // 						onStatusChange={changeAlarmStatus}
// // 						isAcknowledging={updating}
// // 					/>
// // 				)}

// // 				{/* Header Section */}
// // 				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
// // 					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
// // 					<div className="relative flex items-center justify-between">
// // 						<div className="flex items-center space-x-4">
// // 							<div className="relative">
// // 								<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
// // 									<Shield className="h-8 w-8 text-red-400" />
// // 								</div>
// // 								{alarmStats.active > 0 && (
// // 									<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
// // 								)}
// // 							</div>
// // 							<div>
// // 								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
// // 									POLICE COMMAND CENTER
// // 								</h1>
// // 								<p className="text-slate-400 font-mono text-lg mt-2">
// // 									Real-time ALARM monitoring & incident response system
// // 								</p>
// // 								{currentUser && (
// // 									<p className="text-slate-500 font-mono text-sm mt-1">
// // 										Logged in as: {currentUser.name} ({currentUser.role}
// // 										{currentUser.operatorType &&
// // 											` - ${currentUser.operatorType}`}
// // 										)
// // 									</p>
// // 								)}
// // 							</div>
// // 						</div>
// // 						<div className="flex items-center space-x-4">
// // 							{/* WebSocket Connection Status */}
// // 							<div
// // 								className={cn(
// // 									"flex items-center space-x-2 px-4 py-2 rounded-lg border",
// // 									isConnected
// // 										? "bg-green-600/20 border-green-500/30"
// // 										: "bg-red-600/20 border-red-500/30"
// // 								)}>
// // 								{isConnected ? (
// // 									<>
// // 										<Wifi className="h-4 w-4 text-green-400" />
// // 										<span className="text-green-400 font-mono text-sm">
// // 											REAL-TIME CONNECTED
// // 										</span>
// // 									</>
// // 								) : (
// // 									<>
// // 										<WifiOff className="h-4 w-4 text-red-400" />
// // 										<span className="text-red-400 font-mono text-sm">
// // 											DISCONNECTED
// // 										</span>
// // 									</>
// // 								)}
// // 							</div>

// // 							{/* Alert Controls */}
// // 							<div className="flex items-center space-x-2">
// // 								{/* Audio Toggle */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => {
// // 										setAudioEnabled(!audioEnabled);
// // 										audioService.setEnabled(!audioEnabled);
// // 									}}
// // 									className={cn(
// // 										"border-slate-600",
// // 										audioEnabled
// // 											? "bg-blue-600/20 text-blue-400"
// // 											: "bg-slate-600/20 text-slate-400"
// // 									)}
// // 									title="Toggle audio alerts">
// // 									{audioEnabled ? (
// // 										<Volume2 className="h-4 w-4" />
// // 									) : (
// // 										<VolumeX className="h-4 w-4" />
// // 									)}
// // 								</Button>

// // 								{/* Modal Toggle */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => setModalEnabled(!modalEnabled)}
// // 									className={cn(
// // 										"border-slate-600",
// // 										modalEnabled
// // 											? "bg-purple-600/20 text-purple-400"
// // 											: "bg-slate-600/20 text-slate-400"
// // 									)}
// // 									title="Toggle persistent modal alerts">
// // 									<Monitor className="h-4 w-4" />
// // 								</Button>

// // 								{/* Emergency Stop Button */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => audioService.forceStopAllAlerts()}
// // 									className="border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600/40"
// // 									title="Emergency stop all audio alerts">
// // 									<StopCircle className="h-4 w-4" />
// // 								</Button>

// // 								{/* Test Audio Button */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => audioService.testAllSounds()}
// // 									className="border-slate-600 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
// // 									title="Test all alarm sounds">
// // 									<TestTube className="h-4 w-4" />
// // 								</Button>
// // 							</div>

// // 							{/* Refresh Button */}
// // 							<Button
// // 								variant="outline"
// // 								size="sm"
// // 								onClick={fetchAlarms}
// // 								disabled={loading}
// // 								className="border-slate-600 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40">
// // 								<RefreshCw
// // 									className={cn("h-4 w-4", loading && "animate-spin")}
// // 								/>
// // 							</Button>
// // 						</div>
// // 					</div>
// // 				</div>

// // 				{/* Alert System Status */}
// // 				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// // 					{/* Persistent Audio Alert Status */}
// // 					{audioEnabled && audioService.getActiveAlarmCount() > 0 && (
// // 						<div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 animate-pulse">
// // 							<div className="flex items-center justify-between">
// // 								<div className="flex items-center space-x-3">
// // 									<div className="flex items-center space-x-2">
// // 										{audioService.isCurrentlyPlaying() ? (
// // 											<Play className="h-5 w-5 text-red-400 animate-pulse" />
// // 										) : (
// // 											<Pause className="h-5 w-5 text-red-400" />
// // 										)}
// // 										<Volume2 className="h-5 w-5 text-red-400" />
// // 									</div>
// // 									<div>
// // 										<span className="text-red-400 font-bold">
// // 											🚨 AUDIO ALERTS ACTIVE
// // 										</span>
// // 										<p className="text-red-300 text-sm">
// // 											{audioService.getActiveAlarmCount()} active alarm
// // 											{audioService.getActiveAlarmCount() !== 1 ? "s" : ""}
// // 										</p>
// // 									</div>
// // 								</div>
// // 							</div>
// // 						</div>
// // 					)}

// // 					{/* Persistent Modal Status */}
// // 					{modalEnabled && alarmStats.active > 0 && (
// // 						<div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4">
// // 							<div className="flex items-center space-x-3">
// // 								<Monitor className="h-5 w-5 text-purple-400" />
// // 								<div>
// // 									<span className="text-purple-400 font-bold">
// // 										📱 MODAL ALERTS ACTIVE
// // 									</span>
// // 									<p className="text-purple-300 text-sm">
// // 										{alarmStats.active} alarm
// // 										{alarmStats.active !== 1 ? "s" : ""} showing persistent
// // 										modal
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</div>
// // 					)}

// // 					{/* Ready Status */}
// // 					{audioEnabled && modalEnabled && alarmStats.active === 0 && (
// // 						<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 md:col-span-2">
// // 							<div className="flex items-center space-x-2">
// // 								<Volume2 className="h-5 w-5 text-green-400" />
// // 								<Monitor className="h-5 w-5 text-green-400" />
// // 								<span className="text-green-400 font-medium">
// // 									🔊 ALERT SYSTEMS READY
// // 								</span>
// // 								<span className="text-green-300 text-sm">
// // 									- Audio + Modal alerts will activate for all new active alarms
// // 								</span>
// // 							</div>
// // 						</div>
// // 					)}
// // 				</div>

// // 				{/* Statistics Cards */}
// // 				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
// // 					<Card className="bg-slate-900/50 border-slate-700">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Activity className="h-5 w-5 text-blue-400" />
// // 								<div>
// // 									<p className="text-sm text-slate-400">Total Alarms</p>
// // 									<p className="text-2xl font-bold text-white">
// // 										{alarmStats.total}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-red-900/20 border-red-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<AlertTriangle className="h-5 w-5 text-red-400" />
// // 								<div>
// // 									<p className="text-sm text-red-300">Active</p>
// // 									<p className="text-2xl font-bold text-red-400">
// // 										{alarmStats.active}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-yellow-900/20 border-yellow-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Eye className="h-5 w-5 text-yellow-400" />
// // 								<div>
// // 									<p className="text-sm text-yellow-300">Acknowledged</p>
// // 									<p className="text-2xl font-bold text-yellow-400">
// // 										{alarmStats.acknowledged}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-green-900/20 border-green-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<CheckCircle className="h-5 w-5 text-green-400" />
// // 								<div>
// // 									<p className="text-sm text-green-300">Resolved</p>
// // 									<p className="text-2xl font-bold text-green-400">
// // 										{alarmStats.resolved}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-purple-900/20 border-purple-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Zap className="h-5 w-5 text-purple-400" />
// // 								<div>
// // 									<p className="text-sm text-purple-300">Critical</p>
// // 									<p className="text-2xl font-bold text-purple-400">
// // 										{alarmStats.critical}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-cyan-900/20 border-cyan-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Radio className="h-5 w-5 text-cyan-400" />
// // 								<div>
// // 									<p className="text-sm text-cyan-300">Real-time</p>
// // 									<p className="text-2xl font-bold text-cyan-400">
// // 										{alarmStats.realTime}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>
// // 				</div>

// // 				{/* Filters */}
// // 				<Card className="bg-slate-900/50 border-slate-700">
// // 					<CardContent className="p-4">
// // 						<div className="flex flex-col md:flex-row gap-4">
// // 							<div className="flex-1">
// // 								<div className="relative">
// // 									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
// // 									<Input
// // 										placeholder="Search alarms..."
// // 										value={searchTerm}
// // 										onChange={(e) => setSearchTerm(e.target.value)}
// // 										className="pl-10 bg-slate-800 border-slate-600 text-white"
// // 									/>
// // 								</div>
// // 							</div>
// // 							<Select value={statusFilter} onValueChange={setStatusFilter}>
// // 								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
// // 									<SelectValue placeholder="Filter by status" />
// // 								</SelectTrigger>
// // 								<SelectContent className="bg-slate-800 border-slate-600">
// // 									<SelectItem value="all">All Status</SelectItem>
// // 									<SelectItem value="ACTIVE">Active</SelectItem>
// // 									<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
// // 									<SelectItem value="RESOLVED">Resolved</SelectItem>
// // 								</SelectContent>
// // 							</Select>
// // 							<Select value={severityFilter} onValueChange={setSeverityFilter}>
// // 								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
// // 									<SelectValue placeholder="Filter by severity" />
// // 								</SelectTrigger>
// // 								<SelectContent className="bg-slate-800 border-slate-600">
// // 									<SelectItem value="all">All Severity</SelectItem>
// // 									<SelectItem value="CRITICAL">Critical</SelectItem>
// // 									<SelectItem value="HIGH">High</SelectItem>
// // 									<SelectItem value="MEDIUM">Medium</SelectItem>
// // 									<SelectItem value="LOW">Low</SelectItem>
// // 								</SelectContent>
// // 							</Select>
// // 						</div>
// // 					</CardContent>
// // 				</Card>

// // 				{/* Alarms List */}
// // 				<div className="space-y-4">
// // 					{filteredAlarms.length === 0 ? (
// // 						<Card className="bg-slate-900/50 border-slate-700">
// // 							<CardContent className="p-8 text-center">
// // 								<AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
// // 								<p className="text-slate-400 text-lg">No alarms found</p>
// // 								<p className="text-slate-500 text-sm mt-2">
// // 									{searchTerm ||
// // 									statusFilter !== "all" ||
// // 									severityFilter !== "all"
// // 										? "Try adjusting your filters"
// // 										: "All clear! No active alarms at this time."}
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 					) : (
// // 						filteredAlarms.map((alarm) => (
// // 							<Card
// // 								key={alarm.id}
// // 								className={cn(
// // 									"bg-slate-900/50 border-slate-700 transition-all duration-300",
// // 									alarm.isRealTime &&
// // 										"ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20",
// // 									alarm.severity === "CRITICAL" &&
// // 										"border-red-500/50 bg-red-900/10",
// // 									alarm.status === "ACTIVE" &&
// // 										(audioEnabled || modalEnabled) &&
// // 										"ring-1 ring-red-400/30"
// // 								)}>
// // 								<CardContent className="p-6">
// // 									<div className="flex items-start justify-between">
// // 										<div className="flex-1 space-y-3">
// // 											<div className="flex items-center space-x-3">
// // 												{/* <Badge className={getSeverityColor(alarm.severity)}>
// // 													{alarm.severity}
// // 												</Badge> */}
// // 												<Badge
// // 													variant="outline"
// // 													className={getStatusColor(alarm.status)}>
// // 													{alarm.status}
// // 												</Badge>
// // 												{alarm.isRealTime && (
// // 													<Badge className="bg-cyan-600 text-white animate-pulse">
// // 														<Radio className="h-3 w-3 mr-1" />
// // 														LIVE
// // 													</Badge>
// // 												)}
// // 												{alarm.status === "ACTIVE" && audioEnabled && (
// // 													<Badge className="bg-red-600 text-white animate-pulse">
// // 														<Volume2 className="h-3 w-3 mr-1" />
// // 														AUDIO
// // 													</Badge>
// // 												)}
// // 												{alarm.status === "ACTIVE" && modalEnabled && (
// // 													<Badge className="bg-purple-600 text-white animate-pulse">
// // 														<Monitor className="h-3 w-3 mr-1" />
// // 														MODAL
// // 													</Badge>
// // 												)}
// // 												<span className="text-sm text-slate-400 font-mono">
// // 													#{alarm.id.slice(-8)}
// // 												</span>
// // 											</div>

// // 											<div>
// // 												<h3 className="text-lg font-semibold text-white mb-1">
// // 													{alarm.type}
// // 												</h3>
// // 												<p className="text-slate-300">{alarm.description}</p>
// // 											</div>

// // 											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
// // 												<div className="flex items-center space-x-2">
// // 													<MapPin className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.branch.name}
// // 													</span>
// // 												</div>
// // 												<div className="flex items-center space-x-2">
// // 													<Users className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.createdBy.name}
// // 													</span>
// // 												</div>
// // 												<div className="flex items-center space-x-2">
// // 													<Calendar className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{new Date(alarm.createdAt).toLocaleString()}
// // 													</span>
// // 												</div>
// // 											</div>

// // 											{alarm.location && (
// // 												<div className="flex items-center space-x-2 text-sm">
// // 													<Navigation className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.location}
// // 													</span>
// // 												</div>
// // 											)}
// // 										</div>

// // 										<div className="flex flex-col space-y-2 ml-4">
// // 											<Button
// // 												variant="outline"
// // 												size="sm"
// // 												onClick={() => viewAlarmDetails(alarm.id)}
// // 												className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
// // 												<Eye className="h-4 w-4 mr-2" />
// // 												Details
// // 											</Button>

// // 											{alarm.status === "ACTIVE" && (
// // 												<Button
// // 													variant="outline"
// // 													size="sm"
// // 													onClick={() => acknowledgeAlarm(alarm.id)}
// // 													disabled={updating}
// // 													className="border-yellow-600 bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40">
// // 													{updating ? (
// // 														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 													) : (
// // 														<CheckCircle className="h-4 w-4 mr-2" />
// // 													)}
// // 													Acknowledge
// // 												</Button>
// // 											)}

// // 											{alarm.status === "ACKNOWLEDGED" && (
// // 												<Button
// // 													variant="outline"
// // 													size="sm"
// // 													onClick={() => {
// // 														setSelectedAlarm(alarm);
// // 														setIsResolutionDialogOpen(true);
// // 													}}
// // 													className="border-green-600 bg-green-600/20 text-green-300 hover:bg-green-600/40">
// // 													<Target className="h-4 w-4 mr-2" />
// // 													Resolve
// // 												</Button>
// // 											)}
// // 										</div>
// // 									</div>
// // 								</CardContent>
// // 							</Card>
// // 						))
// // 					)}
// // 				</div>

// // 				{/* Alarm Details Dialog */}
// // 				{/* Enhanced Alarm Details Dialog */}
// // 				<Dialog
// // 					open={isDetailsDialogOpen}
// // 					onOpenChange={setIsDetailsDialogOpen}>
// // 					<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
// // 						<DialogHeader>
// // 							<DialogTitle className="text-2xl font-bold flex items-center space-x-3">
// // 								<AlertTriangle className="h-6 w-6 text-red-400" />
// // 								<span>Alarm Details - {selectedAlarm?.type}</span>
// // 								{selectedAlarm?.isRealTime && (
// // 									<Badge className="bg-cyan-600 text-white animate-pulse">
// // 										LIVE
// // 									</Badge>
// // 								)}
// // 							</DialogTitle>
// // 							<DialogDescription className="text-slate-400">
// // 								Complete information about this alarm incident
// // 							</DialogDescription>
// // 						</DialogHeader>

// // 						{selectedAlarm && (
// // 							<div className="space-y-6">
// // 								{/* Company and Branch Header */}
// // 								<div className="bg-slate-800 rounded-lg p-4">
// // 									<div className="flex items-center space-x-4">
// // 										{selectedAlarm.branch.company?.logo && (
// // 											<div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
// // 												<img
// // 													src={`http://8436insight.et:3003${selectedAlarm.branch.company.logo.replace(
// // 														"/var/www/html/koppa-security-api",
// // 														""
// // 													)}`}
// // 													alt={`${selectedAlarm.branch.company.name} logo`}
// // 													className="h-14 w-14 object-cover rounded-xl shadow-lg border border-border"
// // 												/>
// // 											</div>
// // 										)}
// // 										<div className="flex-1">
// // 											<h3 className="text-xl font-bold text-white">
// // 												{selectedAlarm.branch.company?.name ||
// // 													"Unknown Company"}
// // 											</h3>
// // 											<div className="flex items-center space-x-2 mt-1">
// // 												<Building className="h-4 w-4 text-blue-400" />
// // 												<span className="text-slate-300">
// // 													{selectedAlarm.branch.name}
// // 												</span>
// // 											</div>
// // 										</div>
// // 										<div className="text-right">
// // 											{/* <Badge
// // 												className={getSeverityColor(selectedAlarm.severity)}>
// // 												{selectedAlarm.severity}
// // 											</Badge> */}
// // 											<Badge
// // 												variant="outline"
// // 												className={getStatusColor(selectedAlarm.status)}
// // 												style={{ marginLeft: "8px" }}>
// // 												{selectedAlarm.status}
// // 											</Badge>
// // 										</div>
// // 									</div>
// // 								</div>

// // 								{/* Main Content Grid */}
// // 								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// // 									{/* Left Column - Details */}
// // 									<div className="space-y-4">
// // 										<div>
// // 											<Label className="text-slate-300 text-lg font-medium">
// // 												Incident Description
// // 											</Label>
// // 											<div className="bg-slate-800 rounded-lg p-4 mt-2">
// // 												<p className="text-white">
// // 													{selectedAlarm.description}
// // 												</p>
// // 											</div>
// // 										</div>

// // 										{selectedAlarm.additionalNotes && (
// // 											<div>
// // 												<Label className="text-slate-300 text-lg font-medium">
// // 													Additional Notes
// // 												</Label>
// // 												<div className="bg-slate-800 rounded-lg p-4 mt-2">
// // 													<p className="text-white">
// // 														{selectedAlarm.additionalNotes}
// // 													</p>
// // 												</div>
// // 											</div>
// // 										)}

// // 										<div className="grid grid-cols-2 gap-4">
// // 											<div>
// // 												<Label className="text-slate-300">Created By</Label>
// // 												<div className="bg-slate-800 rounded-lg p-3 mt-2">
// // 													<div className="flex items-center space-x-2">
// // 														<User className="h-4 w-4 text-slate-400" />
// // 														<span className="text-white">
// // 															{selectedAlarm.createdBy.name}
// // 														</span>
// // 													</div>
// // 												</div>
// // 											</div>
// // 											<div>
// // 												<Label className="text-slate-300">Created At</Label>
// // 												<div className="bg-slate-800 rounded-lg p-3 mt-2">
// // 													<div className="flex items-center space-x-2">
// // 														<Clock className="h-4 w-4 text-slate-400" />
// // 														<span className="text-white">
// // 															{new Date(
// // 																selectedAlarm.createdAt
// // 															).toLocaleString()}
// // 														</span>
// // 													</div>
// // 												</div>
// // 											</div>
// // 										</div>

// // 										{selectedAlarm.acknowledgedAt && (
// // 											<div>
// // 												<Label className="text-slate-300">
// // 													Acknowledged At
// // 												</Label>
// // 												<div className="bg-slate-800 rounded-lg p-3 mt-2">
// // 													<span className="text-white">
// // 														{new Date(
// // 															selectedAlarm.acknowledgedAt
// // 														).toLocaleString()}
// // 													</span>
// // 												</div>
// // 											</div>
// // 										)}

// // 										{selectedAlarm.resolutionDescription && (
// // 											<div>
// // 												<Label className="text-slate-300">Resolution</Label>
// // 												<div className="bg-slate-800 rounded-lg p-4 mt-2">
// // 													<p className="text-white">
// // 														{selectedAlarm.resolutionDescription}
// // 													</p>
// // 												</div>
// // 											</div>
// // 										)}
// // 									</div>

// // 									{/* Right Column - Map and Location */}
// // 									<div className="space-y-4">
// // 										{/* Large Google Map */}
// // 										{selectedAlarm.coordinates && (
// // 											<div>
// // 												<Label className="text-slate-300 text-lg font-medium">
// // 													Location Map
// // 												</Label>
// // 												<div className="bg-slate-800 rounded-lg p-4 mt-2">
// // 													<div className="w-full h-80 rounded-lg overflow-hidden">
// // 														<iframe
// // 															src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAKwdu6D9M3XuS_LKY25uI2R0FrZZgsX5c&q=${selectedAlarm.coordinates.latitude},${selectedAlarm.coordinates.longitude}&zoom=16&maptype=roadmap`}
// // 															width="100%"
// // 															height="100%"
// // 															style={{ border: 0 }}
// // 															allowFullScreen
// // 															loading="lazy"
// // 															referrerPolicy="no-referrer-when-downgrade"
// // 														/>
// // 													</div>
// // 												</div>
// // 											</div>
// // 										)}

// // 										{/* GPS Coordinates */}
// // 										<div>
// // 											<Label className="text-slate-300">GPS Coordinates</Label>
// // 											<div className="bg-slate-800 rounded-lg p-4 mt-2">
// // 												<div className="flex items-center space-x-2 mb-2">
// // 													<MapPin className="h-4 w-4 text-purple-400" />
// // 													<span className="text-white font-medium">
// // 														Precise Location
// // 													</span>
// // 												</div>
// // 												<p className="text-slate-300 font-mono">
// // 													Lat:{" "}
// // 													{selectedAlarm.coordinates?.latitude.toFixed(6) ||
// // 														selectedAlarm.latitude ||
// // 														"N/A"}
// // 												</p>
// // 												<p className="text-slate-300 font-mono">
// // 													Lng:{" "}
// // 													{selectedAlarm.coordinates?.longitude.toFixed(6) ||
// // 														selectedAlarm.longitude ||
// // 														"N/A"}
// // 												</p>
// // 												{selectedAlarm.location && (
// // 													<p className="text-slate-400 text-sm mt-2">
// // 														{selectedAlarm.location}
// // 													</p>
// // 												)}
// // 											</div>
// // 										</div>
// // 									</div>
// // 								</div>

// // 								{/* Action Buttons */}
// // 								<div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
// // 									{selectedAlarm.status === "ACTIVE" && (
// // 										<>
// // 											<Button
// // 												onClick={() =>
// // 													changeAlarmStatus(selectedAlarm.id, "ACKNOWLEDGED")
// // 												}
// // 												disabled={updating}
// // 												className="bg-yellow-600 hover:bg-yellow-700 text-white">
// // 												{updating ? (
// // 													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 												) : (
// // 													<Eye className="h-4 w-4 mr-2" />
// // 												)}
// // 												Acknowledge
// // 											</Button>
// // 											<Button
// // 												onClick={() =>
// // 													changeAlarmStatus(selectedAlarm.id, "RESOLVED")
// // 												}
// // 												disabled={updating}
// // 												className="bg-green-600 hover:bg-green-700 text-white">
// // 												{updating ? (
// // 													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 												) : (
// // 													<CheckCircle className="h-4 w-4 mr-2" />
// // 												)}
// // 												Mark Resolved
// // 											</Button>
// // 										</>
// // 									)}

// // 									{selectedAlarm.status === "ACKNOWLEDGED" && (
// // 										<>
// // 											<Button
// // 												onClick={() =>
// // 													changeAlarmStatus(selectedAlarm.id, "ACTIVE")
// // 												}
// // 												disabled={updating}
// // 												className="bg-red-600 hover:bg-red-700 text-white">
// // 												{updating ? (
// // 													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 												) : (
// // 													<AlertTriangle className="h-4 w-4 mr-2" />
// // 												)}
// // 												Reactivate
// // 											</Button>
// // 											<Button
// // 												onClick={() => {
// // 													setSelectedAlarm(selectedAlarm);
// // 													setIsResolutionDialogOpen(true);
// // 													setIsDetailsDialogOpen(false);
// // 												}}
// // 												className="bg-green-600 hover:bg-green-700 text-white">
// // 												<Target className="h-4 w-4 mr-2" />
// // 												Resolve with Notes
// // 											</Button>
// // 										</>
// // 									)}

// // 									{selectedAlarm.status === "RESOLVED" && (
// // 										<Button
// // 											onClick={() =>
// // 												changeAlarmStatus(selectedAlarm.id, "ACTIVE")
// // 											}
// // 											disabled={updating}
// // 											className="bg-red-600 hover:bg-red-700 text-white">
// // 											{updating ? (
// // 												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 											) : (
// // 												<AlertTriangle className="h-4 w-4 mr-2" />
// // 											)}
// // 											Reopen Alarm
// // 										</Button>
// // 									)}

// // 									<Button
// // 										variant="outline"
// // 										onClick={() => setIsDetailsDialogOpen(false)}
// // 										className="border-slate-600 text-slate-300 hover:bg-slate-800">
// // 										Close
// // 									</Button>
// // 								</div>
// // 							</div>
// // 						)}
// // 					</DialogContent>
// // 				</Dialog>

// // 				{/* Resolution Dialog */}
// // 				<Dialog
// // 					open={isResolutionDialogOpen}
// // 					onOpenChange={setIsResolutionDialogOpen}>
// // 					<DialogContent className="bg-slate-900 border-slate-700 text-white">
// // 						<DialogHeader>
// // 							<DialogTitle>Resolve Alarm</DialogTitle>
// // 							<DialogDescription className="text-slate-400">
// // 								Provide details about how this alarm was resolved
// // 							</DialogDescription>
// // 						</DialogHeader>

// // 						<div className="space-y-4">
// // 							<div>
// // 								<Label htmlFor="resolution" className="text-slate-300">
// // 									Resolution Description
// // 								</Label>
// // 								<Textarea
// // 									id="resolution"
// // 									placeholder="Describe how the alarm was resolved..."
// // 									value={resolutionDescription}
// // 									onChange={(e) => setResolutionDescription(e.target.value)}
// // 									className="bg-slate-800 border-slate-600 text-white mt-2"
// // 									rows={4}
// // 								/>
// // 							</div>

// // 							<div className="flex justify-end space-x-2">
// // 								<Button
// // 									variant="outline"
// // 									onClick={() => setIsResolutionDialogOpen(false)}
// // 									className="border-slate-600 text-slate-300">
// // 									Cancel
// // 								</Button>
// // 								<Button
// // 									onClick={resolveAlarm}
// // 									disabled={updating || !resolutionDescription.trim()}
// // 									className="bg-green-600 hover:bg-green-700 text-white">
// // 									{updating ? (
// // 										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 									) : (
// // 										<CheckCircle className="h-4 w-4 mr-2" />
// // 									)}
// // 									Resolve Alarm
// // 								</Button>
// // 							</div>
// // 						</div>
// // 					</DialogContent>
// // 				</Dialog>
// // 			</div>
// // 		</div>
// // 	);
// // }

// // "use client";

// // import { useState, useEffect, useCallback, useMemo } from "react";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { Input } from "@/components/ui/input";
// // import {
// // 	Select,
// // 	SelectContent,
// // 	SelectItem,
// // 	SelectTrigger,
// // 	SelectValue,
// // } from "@/components/ui/select";
// // import {
// // 	Dialog,
// // 	DialogContent,
// // 	DialogDescription,
// // 	DialogHeader,
// // 	DialogTitle,
// // } from "@/components/ui/dialog";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Label } from "@/components/ui/label";
// // import { Skeleton } from "@/components/ui/skeleton";
// // import { useToast } from "@/hooks/use-toast";
// // import { useWebSocket } from "@/hooks/use-websocket";
// // import { apiClient } from "@/lib/api";
// // import { audioService } from "@/lib/audio-service";
// // import { PersistentAlarmModal } from "@/components/persistent-alarm-modal";
// // import {
// // 	AlertTriangle,
// // 	CheckCircle,
// // 	Shield,
// // 	Eye,
// // 	MapPin,
// // 	Calendar,
// // 	Loader2,
// // 	Search,
// // 	Zap,
// // 	Activity,
// // 	Target,
// // 	Radio,
// // 	Wifi,
// // 	AlertCircle,
// // 	Navigation,
// // 	WifiOff,
// // 	RefreshCw,
// // 	Users,
// // 	Volume2,
// // 	VolumeX,
// // 	TestTube,
// // 	StopCircle,
// // 	Play,
// // 	Pause,
// // 	Monitor,
// // } from "lucide-react";
// // import { cn } from "@/lib/utils";

// // interface Alarm {
// // 	id: string;
// // 	type: string;
// // 	branchId: string;
// // 	branch: {
// // 		id: string;
// // 		name: string;
// // 	};
// // 	location: string;
// // 	latitude: string;
// // 	longitude: string;
// // 	coordinates?: {
// // 		latitude: number;
// // 		longitude: number;
// // 	};
// // 	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
// // 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// // 	description: string;
// // 	additionalNotes?: string;
// // 	createdBy: {
// // 		id: string;
// // 		name: string;
// // 	};
// // 	createdAt: string;
// // 	acknowledgedAt?: string;
// // 	completedAt?: string;
// // 	resolutionDescription?: string;
// // 	responseTime?: string;
// // 	priority?: number;
// // 	isRealTime?: boolean;
// // }

// // interface User {
// // 	id: string;
// // 	name: string;
// // 	email: string;
// // 	role: string;
// // 	operatorType?: string;
// // }

// // export default function EnhancedAlarmReportsPage() {
// // 	// State management
// // 	const [alarms, setAlarms] = useState<Alarm[]>([]);
// // 	const [loading, setLoading] = useState(true);
// // 	const [updating, setUpdating] = useState(false);
// // 	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
// // 	const [resolutionDescription, setResolutionDescription] = useState("");
// // 	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
// // 	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
// // 	const [audioEnabled, setAudioEnabled] = useState(true);
// // 	const [modalEnabled, setModalEnabled] = useState(true);
// // 	const [currentUser, setCurrentUser] = useState<User | null>(null);
// // 	const [searchTerm, setSearchTerm] = useState("");
// // 	const [statusFilter, setStatusFilter] = useState<string>("all");
// // 	const [severityFilter, setSeverityFilter] = useState<string>("all");

// // 	const { toast } = useToast();

// // 	// Get authentication token
// // 	const token =
// // 		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

// // 	// Update audio service whenever alarms change
// // 	useEffect(() => {
// // 		if (audioEnabled) {
// // 			audioService.updateActiveAlarms(alarms);
// // 		}
// // 	}, [alarms, audioEnabled]);

// // 	// WebSocket connection with real-time alarm handling
// // 	const { isConnected, userInfo } = useWebSocket(token, {
// // 		autoConnect: true,
// // 		onAlarmCreated: useCallback(
// // 			async (newAlarm: any) => {
// // 				console.log("🚨 New real-time alarm received:", newAlarm);

// // 				// Transform the alarm data to match our interface
// // 				const transformedAlarm: Alarm = {
// // 					id: newAlarm.id,
// // 					type: newAlarm.type,
// // 					branchId: newAlarm.branchId,
// // 					branch: {
// // 						id: newAlarm.branchId,
// // 						name: newAlarm.branchName || "Unknown Branch",
// // 					},
// // 					location: newAlarm.location || "",
// // 					latitude: newAlarm.latitude || "",
// // 					longitude: newAlarm.longitude || "",
// // 					coordinates: {
// // 						latitude: newAlarm.latitude
// // 							? Number(newAlarm.latitude)
// // 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// // 						longitude: newAlarm.longitude
// // 							? Number(newAlarm.longitude)
// // 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// // 					},
// // 					status: newAlarm.status || "ACTIVE",
// // 					severity: newAlarm.severity,
// // 					description: newAlarm.description,
// // 					additionalNotes: newAlarm.additionalNotes,
// // 					createdBy: {
// // 						id: newAlarm.createdBy?.id || "",
// // 						name: newAlarm.createdBy || "Unknown User",
// // 					},
// // 					createdAt: newAlarm.createdAt,
// // 					priority: newAlarm.priority || getSeverityPriority(newAlarm.severity),
// // 					isRealTime: true,
// // 				};

// // 				// Add to the beginning of alarms list
// // 				setAlarms((prev) => {
// // 					const exists = prev.some((alarm) => alarm.id === transformedAlarm.id);
// // 					if (exists) {
// // 						return prev.map((alarm) =>
// // 							alarm.id === transformedAlarm.id ? transformedAlarm : alarm
// // 						);
// // 					}
// // 					return [transformedAlarm, ...prev];
// // 				});

// // 				// 🚨 CRITICAL: Add to persistent audio alerts
// // 				if (audioEnabled && transformedAlarm.status === "ACTIVE") {
// // 					audioService.addActiveAlarm(
// // 						transformedAlarm.id,
// // 						transformedAlarm.severity
// // 					);
// // 				}

// // 				// Show visual notification
// // 				toast({
// // 					title: `🚨 ${newAlarm.severity} ALARM RECEIVED`,
// // 					description: `${newAlarm.type} at ${
// // 						newAlarm.branchName || newAlarm.location
// // 					}`,
// // 					variant: newAlarm.severity === "CRITICAL" ? "destructive" : "default",
// // 					duration: newAlarm.severity === "CRITICAL" ? 15000 : 10000,
// // 				});

// // 				// Browser notification
// // 				if ("Notification" in window && Notification.permission === "granted") {
// // 					new Notification(`🚨 ${newAlarm.severity} EMERGENCY ALARM`, {
// // 						body: `${newAlarm.type} at ${
// // 							newAlarm.branchName || newAlarm.location
// // 						}`,
// // 						icon: "/favicon.ico",
// // 						tag: `alarm-${newAlarm.id}`,
// // 						requireInteraction: newAlarm.severity === "CRITICAL",
// // 					});
// // 				}
// // 			},
// // 			[audioEnabled, toast]
// // 		),

// // 		onAlarmUpdated: useCallback(
// // 			(updatedAlarm: any) => {
// // 				console.log("🔄 Alarm update received:", updatedAlarm);

// // 				setAlarms((prev) =>
// // 					prev.map((alarm) => {
// // 						if (alarm.id === updatedAlarm.id) {
// // 							const updated = {
// // 								...alarm,
// // 								status: updatedAlarm.status,
// // 								acknowledgedAt: updatedAlarm.acknowledgedAt,
// // 								completedAt: updatedAlarm.completedAt,
// // 								resolutionDescription: updatedAlarm.resolutionDescription,
// // 								isRealTime: true,
// // 							};

// // 							// Remove from audio alerts if acknowledged or resolved
// // 							if (updated.status !== "ACTIVE") {
// // 								audioService.removeActiveAlarm(updated.id);
// // 							}

// // 							return updated;
// // 						}
// // 						return alarm;
// // 					})
// // 				);

// // 				// Show update notification
// // 				if (updatedAlarm.status === "RESOLVED") {
// // 					toast({
// // 						title: "✅ Alarm Resolved",
// // 						description: `Alarm at ${
// // 							updatedAlarm.branchName || updatedAlarm.location
// // 						} has been resolved`,
// // 					});
// // 				} else if (updatedAlarm.status === "ACKNOWLEDGED") {
// // 					toast({
// // 						title: "👁️ Alarm Acknowledged",
// // 						description: `Alarm at ${
// // 							updatedAlarm.branchName || updatedAlarm.location
// // 						} has been acknowledged`,
// // 					});
// // 				}
// // 			},
// // 			[toast]
// // 		),

// // 		onSystemNotification: useCallback(
// // 			(notification: any) => {
// // 				toast({
// // 					title: "📢 System Notification",
// // 					description: notification.message,
// // 					variant:
// // 						notification.severity === "error" ? "destructive" : "default",
// // 				});
// // 			},
// // 			[toast]
// // 		),
// // 	});

// // 	// Load current user info
// // 	useEffect(() => {
// // 		const loadCurrentUser = async () => {
// // 			try {
// // 				const storedUser = localStorage.getItem("currentUser");
// // 				if (storedUser) {
// // 					setCurrentUser(JSON.parse(storedUser));
// // 				} else {
// // 					const user = await apiClient.getCurrentUser();
// // 					setCurrentUser(user);
// // 				}
// // 			} catch (error) {
// // 				console.error("Failed to load current user:", error);
// // 			}
// // 		};

// // 		loadCurrentUser();
// // 	}, []);

// // 	// Request notification permission on component mount
// // 	useEffect(() => {
// // 		if ("Notification" in window && Notification.permission === "default") {
// // 			Notification.requestPermission().then((permission) => {
// // 				console.log(`Notification permission: ${permission}`);
// // 			});
// // 		}
// // 	}, []);

// // 	// Initialize audio service settings
// // 	useEffect(() => {
// // 		audioService.setEnabled(audioEnabled);
// // 	}, [audioEnabled]);

// // 	// Initial alarm fetch
// // 	useEffect(() => {
// // 		fetchAlarms();
// // 	}, []);

// // 	const fetchAlarms = async () => {
// // 		try {
// // 			setLoading(true);
// // 			const response: any = await apiClient.getAlarms();
// // 			console.log("Fetched alarms from API:", response);

// // 			const alarmsWithCoords =
// // 				response.alarms?.map((alarm: Alarm) => ({
// // 					...alarm,
// // 					coordinates: {
// // 						latitude: alarm?.latitude
// // 							? Number(alarm?.latitude)
// // 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// // 						longitude: alarm?.longitude
// // 							? Number(alarm?.longitude)
// // 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// // 					},
// // 					isRealTime: false,
// // 				})) || [];

// // 			setAlarms(alarmsWithCoords);
// // 		} catch (error) {
// // 			console.error("Failed to fetch alarms:", error);
// // 			toast({
// // 				title: "Error",
// // 				description: "Failed to fetch alarms",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setLoading(false);
// // 		}
// // 	};

// // 	const acknowledgeAlarm = async (alarmId: string) => {
// // 		try {
// // 			setUpdating(true);
// // 			await apiClient.updateAlarm(alarmId, {
// // 				status: "ACKNOWLEDGED",
// // 				acknowledgedAt: new Date().toISOString(),
// // 			});

// // 			toast({
// // 				title: "Success",
// // 				description: "Alarm acknowledged successfully",
// // 			});

// // 			// Update local state immediately
// // 			setAlarms((prev) =>
// // 				prev.map((alarm) =>
// // 					alarm.id === alarmId
// // 						? {
// // 								...alarm,
// // 								status: "ACKNOWLEDGED" as const,
// // 								acknowledgedAt: new Date().toISOString(),
// // 						  }
// // 						: alarm
// // 				)
// // 			);

// // 			// Remove from audio alerts
// // 			audioService.removeActiveAlarm(alarmId);
// // 		} catch (error: any) {
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to acknowledge alarm",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setUpdating(false);
// // 		}
// // 	};

// // 	const resolveAlarm = async () => {
// // 		if (!selectedAlarm) return;

// // 		try {
// // 			setUpdating(true);
// // 			await apiClient.updateAlarm(selectedAlarm.id, {
// // 				status: "RESOLVED",
// // 				completedAt: new Date().toISOString(),
// // 				resolutionDescription,
// // 			});

// // 			toast({
// // 				title: "Success",
// // 				description: "Alarm resolved successfully",
// // 			});

// // 			// Update local state
// // 			setAlarms((prev) =>
// // 				prev.map((alarm) =>
// // 					alarm.id === selectedAlarm.id
// // 						? {
// // 								...alarm,
// // 								status: "RESOLVED" as const,
// // 								completedAt: new Date().toISOString(),
// // 								resolutionDescription,
// // 						  }
// // 						: alarm
// // 				)
// // 			);

// // 			// Remove from audio alerts
// // 			audioService.removeActiveAlarm(selectedAlarm.id);

// // 			setIsResolutionDialogOpen(false);
// // 			setResolutionDescription("");
// // 			setSelectedAlarm(null);
// // 		} catch (error: any) {
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to resolve alarm",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setUpdating(false);
// // 		}
// // 	};

// // 	const viewAlarmDetails = (alarmId: string) => {
// // 		const alarm = alarms.find((a) => a.id === alarmId);
// // 		if (alarm) {
// // 			setSelectedAlarm(alarm);
// // 			setIsDetailsDialogOpen(true);
// // 		}
// // 	};

// // 	// Helper functions
// // 	const getSeverityPriority = (severity: string): number => {
// // 		switch (severity) {
// // 			case "CRITICAL":
// // 				return 1;
// // 			case "HIGH":
// // 				return 2;
// // 			case "MEDIUM":
// // 				return 3;
// // 			case "LOW":
// // 				return 4;
// // 			default:
// // 				return 5;
// // 		}
// // 	};

// // 	const getSeverityColor = (severity: string) => {
// // 		switch (severity) {
// // 			case "CRITICAL":
// // 				return "bg-red-600 text-white";
// // 			case "HIGH":
// // 				return "bg-orange-600 text-white";
// // 			case "MEDIUM":
// // 				return "bg-yellow-600 text-white";
// // 			case "LOW":
// // 				return "bg-blue-600 text-white";
// // 			default:
// // 				return "bg-gray-600 text-white";
// // 		}
// // 	};

// // 	const getStatusColor = (status: string) => {
// // 		switch (status) {
// // 			case "ACTIVE":
// // 				return "bg-red-100 text-red-800 border-red-200";
// // 			case "ACKNOWLEDGED":
// // 				return "bg-yellow-100 text-yellow-800 border-yellow-200";
// // 			case "RESOLVED":
// // 				return "bg-green-100 text-green-800 border-green-200";
// // 			default:
// // 				return "bg-gray-100 text-gray-800 border-gray-200";
// // 		}
// // 	};

// // 	// Filter alarms based on search and filters
// // 	const filteredAlarms = useMemo(() => {
// // 		return alarms
// // 			.filter((alarm) => {
// // 				const matchesSearch =
// // 					searchTerm === "" ||
// // 					alarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // 					alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // 					alarm.type.toLowerCase().includes(searchTerm.toLowerCase());

// // 				const matchesStatus =
// // 					statusFilter === "all" || alarm.status === statusFilter;
// // 				const matchesSeverity =
// // 					severityFilter === "all" || alarm.severity === severityFilter;

// // 				return matchesSearch && matchesStatus && matchesSeverity;
// // 			})
// // 			.sort((a, b) => {
// // 				if (a.priority !== b.priority) {
// // 					return (a.priority || 5) - (b.priority || 5);
// // 				}
// // 				return (
// // 					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// // 				);
// // 			});
// // 	}, [alarms, searchTerm, statusFilter, severityFilter]);

// // 	// Statistics
// // 	const alarmStats = useMemo(() => {
// // 		const total = alarms.length;
// // 		const active = alarms.filter((a) => a.status === "ACTIVE").length;
// // 		const acknowledged = alarms.filter(
// // 			(a) => a.status === "ACKNOWLEDGED"
// // 		).length;
// // 		const resolved = alarms.filter((a) => a.status === "RESOLVED").length;
// // 		const critical = alarms.filter((a) => a.severity === "CRITICAL").length;
// // 		const realTime = alarms.filter((a) => a.isRealTime).length;

// // 		return { total, active, acknowledged, resolved, critical, realTime };
// // 	}, [alarms]);

// // 	if (loading) {
// // 		return (
// // 			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
// // 				<div className="space-y-6">
// // 					<Skeleton className="h-32 w-full bg-slate-800" />
// // 					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
// // 						{[...Array(4)].map((_, i) => (
// // 							<Skeleton key={i} className="h-24 bg-slate-800" />
// // 						))}
// // 					</div>
// // 					<Skeleton className="h-96 w-full bg-slate-800" />
// // 				</div>
// // 			</div>
// // 		);
// // 	}

// // 	return (
// // 		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
// // 			<div className="space-y-6 p-6">
// // 				{/* Persistent Alarm Modal */}
// // 				{modalEnabled && (
// // 					<PersistentAlarmModal
// // 						alarms={alarms}
// // 						onAcknowledge={acknowledgeAlarm}
// // 						onViewDetails={viewAlarmDetails}
// // 						isAcknowledging={updating}
// // 					/>
// // 				)}

// // 				{/* Header Section */}
// // 				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
// // 					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
// // 					<div className="relative flex items-center justify-between">
// // 						<div className="flex items-center space-x-4">
// // 							<div className="relative">
// // 								<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
// // 									<Shield className="h-8 w-8 text-red-400" />
// // 								</div>
// // 								{alarmStats.active > 0 && (
// // 									<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
// // 								)}
// // 							</div>
// // 							<div>
// // 								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
// // 									POLICE COMMAND CENTER
// // 								</h1>
// // 								<p className="text-slate-400 font-mono text-lg mt-2">
// // 									Real-time ALARM monitoring & incident response system
// // 								</p>
// // 								{currentUser && (
// // 									<p className="text-slate-500 font-mono text-sm mt-1">
// // 										Logged in as: {currentUser.name} ({currentUser.role}
// // 										{currentUser.operatorType &&
// // 											` - ${currentUser.operatorType}`}
// // 										)
// // 									</p>
// // 								)}
// // 							</div>
// // 						</div>
// // 						<div className="flex items-center space-x-4">
// // 							{/* WebSocket Connection Status */}
// // 							<div
// // 								className={cn(
// // 									"flex items-center space-x-2 px-4 py-2 rounded-lg border",
// // 									isConnected
// // 										? "bg-green-600/20 border-green-500/30"
// // 										: "bg-red-600/20 border-red-500/30"
// // 								)}>
// // 								{isConnected ? (
// // 									<>
// // 										<Wifi className="h-4 w-4 text-green-400" />
// // 										<span className="text-green-400 font-mono text-sm">
// // 											REAL-TIME CONNECTED
// // 										</span>
// // 									</>
// // 								) : (
// // 									<>
// // 										<WifiOff className="h-4 w-4 text-red-400" />
// // 										<span className="text-red-400 font-mono text-sm">
// // 											DISCONNECTED
// // 										</span>
// // 									</>
// // 								)}
// // 							</div>

// // 							{/* Alert Controls */}
// // 							<div className="flex items-center space-x-2">
// // 								{/* Audio Toggle */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => {
// // 										setAudioEnabled(!audioEnabled);
// // 										audioService.setEnabled(!audioEnabled);
// // 									}}
// // 									className={cn(
// // 										"border-slate-600",
// // 										audioEnabled
// // 											? "bg-blue-600/20 text-blue-400"
// // 											: "bg-slate-600/20 text-slate-400"
// // 									)}
// // 									title="Toggle audio alerts">
// // 									{audioEnabled ? (
// // 										<Volume2 className="h-4 w-4" />
// // 									) : (
// // 										<VolumeX className="h-4 w-4" />
// // 									)}
// // 								</Button>

// // 								{/* Modal Toggle */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => setModalEnabled(!modalEnabled)}
// // 									className={cn(
// // 										"border-slate-600",
// // 										modalEnabled
// // 											? "bg-purple-600/20 text-purple-400"
// // 											: "bg-slate-600/20 text-slate-400"
// // 									)}
// // 									title="Toggle persistent modal alerts">
// // 									<Monitor className="h-4 w-4" />
// // 								</Button>

// // 								{/* Emergency Stop Button */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => audioService.forceStopAllAlerts()}
// // 									className="border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600/40"
// // 									title="Emergency stop all audio alerts">
// // 									<StopCircle className="h-4 w-4" />
// // 								</Button>

// // 								{/* Test Audio Button */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => audioService.testAllSounds()}
// // 									className="border-slate-600 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
// // 									title="Test all alarm sounds">
// // 									<TestTube className="h-4 w-4" />
// // 								</Button>
// // 							</div>

// // 							{/* Refresh Button */}
// // 							<Button
// // 								variant="outline"
// // 								size="sm"
// // 								onClick={fetchAlarms}
// // 								disabled={loading}
// // 								className="border-slate-600 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40">
// // 								<RefreshCw
// // 									className={cn("h-4 w-4", loading && "animate-spin")}
// // 								/>
// // 							</Button>
// // 						</div>
// // 					</div>
// // 				</div>

// // 				{/* Alert System Status */}
// // 				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// // 					{/* Persistent Audio Alert Status */}
// // 					{audioEnabled && audioService.getActiveAlarmCount() > 0 && (
// // 						<div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 animate-pulse">
// // 							<div className="flex items-center justify-between">
// // 								<div className="flex items-center space-x-3">
// // 									<div className="flex items-center space-x-2">
// // 										{audioService.isCurrentlyPlaying() ? (
// // 											<Play className="h-5 w-5 text-red-400 animate-pulse" />
// // 										) : (
// // 											<Pause className="h-5 w-5 text-red-400" />
// // 										)}
// // 										<Volume2 className="h-5 w-5 text-red-400" />
// // 									</div>
// // 									<div>
// // 										<span className="text-red-400 font-bold">
// // 											🚨 AUDIO ALERTS ACTIVE
// // 										</span>
// // 										<p className="text-red-300 text-sm">
// // 											{audioService.getActiveAlarmCount()} active alarm
// // 											{audioService.getActiveAlarmCount() !== 1 ? "s" : ""}
// // 										</p>
// // 									</div>
// // 								</div>
// // 							</div>
// // 						</div>
// // 					)}

// // 					{/* Persistent Modal Status */}
// // 					{modalEnabled && alarmStats.active > 0 && (
// // 						<div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4">
// // 							<div className="flex items-center space-x-3">
// // 								<Monitor className="h-5 w-5 text-purple-400" />
// // 								<div>
// // 									<span className="text-purple-400 font-bold">
// // 										📱 MODAL ALERTS ACTIVE
// // 									</span>
// // 									<p className="text-purple-300 text-sm">
// // 										{alarmStats.active} alarm
// // 										{alarmStats.active !== 1 ? "s" : ""} showing persistent
// // 										modal
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</div>
// // 					)}

// // 					{/* Ready Status */}
// // 					{audioEnabled && modalEnabled && alarmStats.active === 0 && (
// // 						<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 md:col-span-2">
// // 							<div className="flex items-center space-x-2">
// // 								<Volume2 className="h-5 w-5 text-green-400" />
// // 								<Monitor className="h-5 w-5 text-green-400" />
// // 								<span className="text-green-400 font-medium">
// // 									🔊 ALERT SYSTEMS READY
// // 								</span>
// // 								<span className="text-green-300 text-sm">
// // 									- Audio + Modal alerts will activate for all new active alarms
// // 								</span>
// // 							</div>
// // 						</div>
// // 					)}
// // 				</div>

// // 				{/* Statistics Cards */}
// // 				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
// // 					<Card className="bg-slate-900/50 border-slate-700">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Activity className="h-5 w-5 text-blue-400" />
// // 								<div>
// // 									<p className="text-sm text-slate-400">Total Alarms</p>
// // 									<p className="text-2xl font-bold text-white">
// // 										{alarmStats.total}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-red-900/20 border-red-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<AlertTriangle className="h-5 w-5 text-red-400" />
// // 								<div>
// // 									<p className="text-sm text-red-300">Active</p>
// // 									<p className="text-2xl font-bold text-red-400">
// // 										{alarmStats.active}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-yellow-900/20 border-yellow-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Eye className="h-5 w-5 text-yellow-400" />
// // 								<div>
// // 									<p className="text-sm text-yellow-300">Acknowledged</p>
// // 									<p className="text-2xl font-bold text-yellow-400">
// // 										{alarmStats.acknowledged}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-green-900/20 border-green-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<CheckCircle className="h-5 w-5 text-green-400" />
// // 								<div>
// // 									<p className="text-sm text-green-300">Resolved</p>
// // 									<p className="text-2xl font-bold text-green-400">
// // 										{alarmStats.resolved}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-purple-900/20 border-purple-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Zap className="h-5 w-5 text-purple-400" />
// // 								<div>
// // 									<p className="text-sm text-purple-300">Critical</p>
// // 									<p className="text-2xl font-bold text-purple-400">
// // 										{alarmStats.critical}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-cyan-900/20 border-cyan-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Radio className="h-5 w-5 text-cyan-400" />
// // 								<div>
// // 									<p className="text-sm text-cyan-300">Real-time</p>
// // 									<p className="text-2xl font-bold text-cyan-400">
// // 										{alarmStats.realTime}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>
// // 				</div>

// // 				{/* Filters */}
// // 				<Card className="bg-slate-900/50 border-slate-700">
// // 					<CardContent className="p-4">
// // 						<div className="flex flex-col md:flex-row gap-4">
// // 							<div className="flex-1">
// // 								<div className="relative">
// // 									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
// // 									<Input
// // 										placeholder="Search alarms..."
// // 										value={searchTerm}
// // 										onChange={(e) => setSearchTerm(e.target.value)}
// // 										className="pl-10 bg-slate-800 border-slate-600 text-white"
// // 									/>
// // 								</div>
// // 							</div>
// // 							<Select value={statusFilter} onValueChange={setStatusFilter}>
// // 								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
// // 									<SelectValue placeholder="Filter by status" />
// // 								</SelectTrigger>
// // 								<SelectContent className="bg-slate-800 border-slate-600">
// // 									<SelectItem value="all">All Status</SelectItem>
// // 									<SelectItem value="ACTIVE">Active</SelectItem>
// // 									<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
// // 									<SelectItem value="RESOLVED">Resolved</SelectItem>
// // 								</SelectContent>
// // 							</Select>
// // 							<Select value={severityFilter} onValueChange={setSeverityFilter}>
// // 								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
// // 									<SelectValue placeholder="Filter by severity" />
// // 								</SelectTrigger>
// // 								<SelectContent className="bg-slate-800 border-slate-600">
// // 									<SelectItem value="all">All Severity</SelectItem>
// // 									<SelectItem value="CRITICAL">Critical</SelectItem>
// // 									<SelectItem value="HIGH">High</SelectItem>
// // 									<SelectItem value="MEDIUM">Medium</SelectItem>
// // 									<SelectItem value="LOW">Low</SelectItem>
// // 								</SelectContent>
// // 							</Select>
// // 						</div>
// // 					</CardContent>
// // 				</Card>

// // 				{/* Alarms List */}
// // 				<div className="space-y-4">
// // 					{filteredAlarms.length === 0 ? (
// // 						<Card className="bg-slate-900/50 border-slate-700">
// // 							<CardContent className="p-8 text-center">
// // 								<AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
// // 								<p className="text-slate-400 text-lg">No alarms found</p>
// // 								<p className="text-slate-500 text-sm mt-2">
// // 									{searchTerm ||
// // 									statusFilter !== "all" ||
// // 									severityFilter !== "all"
// // 										? "Try adjusting your filters"
// // 										: "All clear! No active alarms at this time."}
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 					) : (
// // 						filteredAlarms.map((alarm) => (
// // 							<Card
// // 								key={alarm.id}
// // 								className={cn(
// // 									"bg-slate-900/50 border-slate-700 transition-all duration-300",
// // 									alarm.isRealTime &&
// // 										"ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20",
// // 									alarm.severity === "CRITICAL" &&
// // 										"border-red-500/50 bg-red-900/10",
// // 									alarm.status === "ACTIVE" &&
// // 										(audioEnabled || modalEnabled) &&
// // 										"ring-1 ring-red-400/30"
// // 								)}>
// // 								<CardContent className="p-6">
// // 									<div className="flex items-start justify-between">
// // 										<div className="flex-1 space-y-3">
// // 											<div className="flex items-center space-x-3">
// // 												<Badge className={getSeverityColor(alarm.severity)}>
// // 													{alarm.severity}
// // 												</Badge>
// // 												<Badge
// // 													variant="outline"
// // 													className={getStatusColor(alarm.status)}>
// // 													{alarm.status}
// // 												</Badge>
// // 												{alarm.isRealTime && (
// // 													<Badge className="bg-cyan-600 text-white animate-pulse">
// // 														<Radio className="h-3 w-3 mr-1" />
// // 														LIVE
// // 													</Badge>
// // 												)}
// // 												{alarm.status === "ACTIVE" && audioEnabled && (
// // 													<Badge className="bg-red-600 text-white animate-pulse">
// // 														<Volume2 className="h-3 w-3 mr-1" />
// // 														AUDIO
// // 													</Badge>
// // 												)}
// // 												{alarm.status === "ACTIVE" && modalEnabled && (
// // 													<Badge className="bg-purple-600 text-white animate-pulse">
// // 														<Monitor className="h-3 w-3 mr-1" />
// // 														MODAL
// // 													</Badge>
// // 												)}
// // 												<span className="text-sm text-slate-400 font-mono">
// // 													#{alarm.id.slice(-8)}
// // 												</span>
// // 											</div>

// // 											<div>
// // 												<h3 className="text-lg font-semibold text-white mb-1">
// // 													{alarm.type}
// // 												</h3>
// // 												<p className="text-slate-300">{alarm.description}</p>
// // 											</div>

// // 											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
// // 												<div className="flex items-center space-x-2">
// // 													<MapPin className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.branch.name}
// // 													</span>
// // 												</div>
// // 												<div className="flex items-center space-x-2">
// // 													<Users className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.createdBy.name}
// // 													</span>
// // 												</div>
// // 												<div className="flex items-center space-x-2">
// // 													<Calendar className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{new Date(alarm.createdAt).toLocaleString()}
// // 													</span>
// // 												</div>
// // 											</div>

// // 											{alarm.location && (
// // 												<div className="flex items-center space-x-2 text-sm">
// // 													<Navigation className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.location}
// // 													</span>
// // 												</div>
// // 											)}
// // 										</div>

// // 										<div className="flex flex-col space-y-2 ml-4">
// // 											<Button
// // 												variant="outline"
// // 												size="sm"
// // 												onClick={() => viewAlarmDetails(alarm.id)}
// // 												className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
// // 												<Eye className="h-4 w-4 mr-2" />
// // 												Details
// // 											</Button>

// // 											{alarm.status === "ACTIVE" && (
// // 												<Button
// // 													variant="outline"
// // 													size="sm"
// // 													onClick={() => acknowledgeAlarm(alarm.id)}
// // 													disabled={updating}
// // 													className="border-yellow-600 bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40">
// // 													{updating ? (
// // 														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 													) : (
// // 														<CheckCircle className="h-4 w-4 mr-2" />
// // 													)}
// // 													Acknowledge
// // 												</Button>
// // 											)}

// // 											{alarm.status === "ACKNOWLEDGED" && (
// // 												<Button
// // 													variant="outline"
// // 													size="sm"
// // 													onClick={() => {
// // 														setSelectedAlarm(alarm);
// // 														setIsResolutionDialogOpen(true);
// // 													}}
// // 													className="border-green-600 bg-green-600/20 text-green-300 hover:bg-green-600/40">
// // 													<Target className="h-4 w-4 mr-2" />
// // 													Resolve
// // 												</Button>
// // 											)}
// // 										</div>
// // 									</div>
// // 								</CardContent>
// // 							</Card>
// // 						))
// // 					)}
// // 				</div>

// // 				{/* Alarm Details Dialog */}
// // 				<Dialog
// // 					open={isDetailsDialogOpen}
// // 					onOpenChange={setIsDetailsDialogOpen}>
// // 					<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
// // 						<DialogHeader>
// // 							<DialogTitle className="text-xl font-bold">
// // 								Alarm Details - {selectedAlarm?.type}
// // 							</DialogTitle>
// // 							<DialogDescription className="text-slate-400">
// // 								Complete information about this alarm incident
// // 							</DialogDescription>
// // 						</DialogHeader>

// // 						{selectedAlarm && (
// // 							<div className="space-y-4">
// // 								<div className="grid grid-cols-2 gap-4">
// // 									<div>
// // 										<Label className="text-slate-300">Severity</Label>
// // 										<Badge className={getSeverityColor(selectedAlarm.severity)}>
// // 											{selectedAlarm.severity}
// // 										</Badge>
// // 									</div>
// // 									<div>
// // 										<Label className="text-slate-300">Status</Label>
// // 										<Badge
// // 											variant="outline"
// // 											className={getStatusColor(selectedAlarm.status)}>
// // 											{selectedAlarm.status}
// // 										</Badge>
// // 									</div>
// // 								</div>

// // 								<div>
// // 									<Label className="text-slate-300">Description</Label>
// // 									<p className="text-white mt-1">{selectedAlarm.description}</p>
// // 								</div>

// // 								{selectedAlarm.additionalNotes && (
// // 									<div>
// // 										<Label className="text-slate-300">Additional Notes</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.additionalNotes}
// // 										</p>
// // 									</div>
// // 								)}

// // 								<div className="grid grid-cols-2 gap-4">
// // 									<div>
// // 										<Label className="text-slate-300">Branch</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.branch.name}
// // 										</p>
// // 									</div>
// // 									<div>
// // 										<Label className="text-slate-300">Created By</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.createdBy.name}
// // 										</p>
// // 									</div>
// // 								</div>

// // 								<div className="grid grid-cols-2 gap-4">
// // 									<div>
// // 										<Label className="text-slate-300">Created At</Label>
// // 										<p className="text-white mt-1">
// // 											{new Date(selectedAlarm.createdAt).toLocaleString()}
// // 										</p>
// // 									</div>
// // 									{selectedAlarm.acknowledgedAt && (
// // 										<div>
// // 											<Label className="text-slate-300">Acknowledged At</Label>
// // 											<p className="text-white mt-1">
// // 												{new Date(
// // 													selectedAlarm.acknowledgedAt
// // 												).toLocaleString()}
// // 											</p>
// // 										</div>
// // 									)}
// // 								</div>

// // 								{selectedAlarm.coordinates && (
// // 									<div>
// // 										<Label className="text-slate-300">Coordinates</Label>
// // 										<p className="text-white mt-1">
// // 											Lat: {selectedAlarm.coordinates.latitude.toFixed(6)}, Lng:{" "}
// // 											{selectedAlarm.coordinates.longitude.toFixed(6)}
// // 										</p>
// // 									</div>
// // 								)}

// // 								{selectedAlarm.resolutionDescription && (
// // 									<div>
// // 										<Label className="text-slate-300">Resolution</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.resolutionDescription}
// // 										</p>
// // 									</div>
// // 								)}
// // 							</div>
// // 						)}
// // 					</DialogContent>
// // 				</Dialog>

// // 				{/* Resolution Dialog */}
// // 				<Dialog
// // 					open={isResolutionDialogOpen}
// // 					onOpenChange={setIsResolutionDialogOpen}>
// // 					<DialogContent className="bg-slate-900 border-slate-700 text-white">
// // 						<DialogHeader>
// // 							<DialogTitle>Resolve Alarm</DialogTitle>
// // 							<DialogDescription className="text-slate-400">
// // 								Provide details about how this alarm was resolved
// // 							</DialogDescription>
// // 						</DialogHeader>

// // 						<div className="space-y-4">
// // 							<div>
// // 								<Label htmlFor="resolution" className="text-slate-300">
// // 									Resolution Description
// // 								</Label>
// // 								<Textarea
// // 									id="resolution"
// // 									placeholder="Describe how the alarm was resolved..."
// // 									value={resolutionDescription}
// // 									onChange={(e) => setResolutionDescription(e.target.value)}
// // 									className="bg-slate-800 border-slate-600 text-white mt-2"
// // 									rows={4}
// // 								/>
// // 							</div>

// // 							<div className="flex justify-end space-x-2">
// // 								<Button
// // 									variant="outline"
// // 									onClick={() => setIsResolutionDialogOpen(false)}
// // 									className="border-slate-600 text-slate-300">
// // 									Cancel
// // 								</Button>
// // 								<Button
// // 									onClick={resolveAlarm}
// // 									disabled={updating || !resolutionDescription.trim()}
// // 									className="bg-green-600 hover:bg-green-700 text-white">
// // 									{updating ? (
// // 										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 									) : (
// // 										<CheckCircle className="h-4 w-4 mr-2" />
// // 									)}
// // 									Resolve Alarm
// // 								</Button>
// // 							</div>
// // 						</div>
// // 					</DialogContent>
// // 				</Dialog>
// // 			</div>
// // 		</div>
// // 	);
// // }

// // "use client";

// // import { useState, useEffect, useCallback, useMemo } from "react";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { Input } from "@/components/ui/input";
// // import {
// // 	Select,
// // 	SelectContent,
// // 	SelectItem,
// // 	SelectTrigger,
// // 	SelectValue,
// // } from "@/components/ui/select";
// // import {
// // 	Dialog,
// // 	DialogContent,
// // 	DialogDescription,
// // 	DialogHeader,
// // 	DialogTitle,
// // } from "@/components/ui/dialog";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Label } from "@/components/ui/label";
// // import { Skeleton } from "@/components/ui/skeleton";
// // import { useToast } from "@/hooks/use-toast";
// // import { useWebSocket } from "@/hooks/use-websocket";
// // import { apiClient } from "@/lib/api";
// // import { audioService } from "@/lib/audio-service";
// // import {
// // 	AlertTriangle,
// // 	CheckCircle,
// // 	Shield,
// // 	Eye,
// // 	MapPin,
// // 	Calendar,
// // 	Loader2,
// // 	Search,
// // 	Zap,
// // 	Activity,
// // 	Target,
// // 	Radio,
// // 	Wifi,
// // 	AlertCircle,
// // 	Navigation,
// // 	WifiOff,
// // 	RefreshCw,
// // 	Users,
// // 	Volume2,
// // 	VolumeX,
// // 	TestTube,
// // 	StopCircle,
// // 	Play,
// // 	Pause,
// // } from "lucide-react";
// // import { cn } from "@/lib/utils";

// // interface Alarm {
// // 	id: string;
// // 	type: string;
// // 	branchId: string;
// // 	branch: {
// // 		id: string;
// // 		name: string;
// // 	};
// // 	location: string;
// // 	latitude: string;
// // 	longitude: string;
// // 	coordinates?: {
// // 		latitude: number;
// // 		longitude: number;
// // 	};
// // 	status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
// // 	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
// // 	description: string;
// // 	additionalNotes?: string;
// // 	createdBy: {
// // 		id: string;
// // 		name: string;
// // 	};
// // 	createdAt: string;
// // 	acknowledgedAt?: string;
// // 	completedAt?: string;
// // 	resolutionDescription?: string;
// // 	responseTime?: string;
// // 	priority?: number;
// // 	isRealTime?: boolean;
// // }

// // interface User {
// // 	id: string;
// // 	name: string;
// // 	email: string;
// // 	role: string;
// // 	operatorType?: string;
// // }

// // export default function EnhancedAlarmReportsPage() {
// // 	// State management
// // 	const [alarms, setAlarms] = useState<Alarm[]>([]);
// // 	const [loading, setLoading] = useState(true);
// // 	const [updating, setUpdating] = useState(false);
// // 	const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
// // 	const [resolutionDescription, setResolutionDescription] = useState("");
// // 	const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
// // 	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
// // 	const [audioEnabled, setAudioEnabled] = useState(true);
// // 	const [currentUser, setCurrentUser] = useState<User | null>(null);
// // 	const [searchTerm, setSearchTerm] = useState("");
// // 	const [statusFilter, setStatusFilter] = useState<string>("all");
// // 	const [severityFilter, setSeverityFilter] = useState<string>("all");

// // 	const { toast } = useToast();

// // 	// Get authentication token
// // 	const token =
// // 		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

// // 	// Update audio service whenever alarms change
// // 	useEffect(() => {
// // 		if (audioEnabled) {
// // 			audioService.updateActiveAlarms(alarms);
// // 		}
// // 	}, [alarms, audioEnabled]);

// // 	// WebSocket connection with real-time alarm handling
// // 	const { isConnected, userInfo } = useWebSocket(token, {
// // 		autoConnect: true,
// // 		onAlarmCreated: useCallback(
// // 			async (newAlarm: any) => {
// // 				console.log("🚨 New real-time alarm received:", newAlarm);

// // 				// Transform the alarm data to match our interface
// // 				const transformedAlarm: Alarm = {
// // 					id: newAlarm.id,
// // 					type: newAlarm.type,
// // 					branchId: newAlarm.branchId,
// // 					branch: {
// // 						id: newAlarm.branchId,
// // 						name: newAlarm.branchName || "Unknown Branch",
// // 					},
// // 					location: newAlarm.location || "",
// // 					latitude: newAlarm.latitude || "",
// // 					longitude: newAlarm.longitude || "",
// // 					coordinates: {
// // 						latitude: newAlarm.latitude
// // 							? Number(newAlarm.latitude)
// // 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// // 						longitude: newAlarm.longitude
// // 							? Number(newAlarm.longitude)
// // 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// // 					},
// // 					status: newAlarm.status || "ACTIVE",
// // 					severity: newAlarm.severity,
// // 					description: newAlarm.description,
// // 					additionalNotes: newAlarm.additionalNotes,
// // 					createdBy: {
// // 						id: newAlarm.createdBy?.id || "",
// // 						name: newAlarm.createdBy || "Unknown User",
// // 					},
// // 					createdAt: newAlarm.createdAt,
// // 					priority: newAlarm.priority || getSeverityPriority(newAlarm.severity),
// // 					isRealTime: true,
// // 				};

// // 				// Add to the beginning of alarms list
// // 				setAlarms((prev) => {
// // 					const exists = prev.some((alarm) => alarm.id === transformedAlarm.id);
// // 					if (exists) {
// // 						return prev.map((alarm) =>
// // 							alarm.id === transformedAlarm.id ? transformedAlarm : alarm
// // 						);
// // 					}
// // 					return [transformedAlarm, ...prev];
// // 				});

// // 				// 🚨 CRITICAL: Add to persistent audio alerts
// // 				if (audioEnabled && transformedAlarm.status === "ACTIVE") {
// // 					audioService.addActiveAlarm(
// // 						transformedAlarm.id,
// // 						transformedAlarm.severity
// // 					);
// // 				}

// // 				// Show visual notification
// // 				toast({
// // 					title: `🚨 ${newAlarm.severity} ALARM RECEIVED`,
// // 					description: `${newAlarm.type} at ${
// // 						newAlarm.branchName || newAlarm.location
// // 					}`,
// // 					variant: newAlarm.severity === "CRITICAL" ? "destructive" : "default",
// // 					duration: newAlarm.severity === "CRITICAL" ? 15000 : 10000,
// // 				});

// // 				// Browser notification
// // 				if ("Notification" in window && Notification.permission === "granted") {
// // 					new Notification(`🚨 ${newAlarm.severity} EMERGENCY ALARM`, {
// // 						body: `${newAlarm.type} at ${
// // 							newAlarm.branchName || newAlarm.location
// // 						}`,
// // 						icon: "/favicon.ico",
// // 						tag: `alarm-${newAlarm.id}`,
// // 						requireInteraction: newAlarm.severity === "CRITICAL",
// // 					});
// // 				}
// // 			},
// // 			[audioEnabled, toast]
// // 		),

// // 		onAlarmUpdated: useCallback(
// // 			(updatedAlarm: any) => {
// // 				console.log("🔄 Alarm update received:", updatedAlarm);

// // 				setAlarms((prev) =>
// // 					prev.map((alarm) => {
// // 						if (alarm.id === updatedAlarm.id) {
// // 							const updated = {
// // 								...alarm,
// // 								status: updatedAlarm.status,
// // 								acknowledgedAt: updatedAlarm.acknowledgedAt,
// // 								completedAt: updatedAlarm.completedAt,
// // 								resolutionDescription: updatedAlarm.resolutionDescription,
// // 								isRealTime: true,
// // 							};

// // 							// Remove from audio alerts if acknowledged or resolved
// // 							if (updated.status !== "ACTIVE") {
// // 								audioService.removeActiveAlarm(updated.id);
// // 							}

// // 							return updated;
// // 						}
// // 						return alarm;
// // 					})
// // 				);

// // 				// Show update notification
// // 				if (updatedAlarm.status === "RESOLVED") {
// // 					toast({
// // 						title: "✅ Alarm Resolved",
// // 						description: `Alarm at ${
// // 							updatedAlarm.branchName || updatedAlarm.location
// // 						} has been resolved`,
// // 					});
// // 				} else if (updatedAlarm.status === "ACKNOWLEDGED") {
// // 					toast({
// // 						title: "👁️ Alarm Acknowledged",
// // 						description: `Alarm at ${
// // 							updatedAlarm.branchName || updatedAlarm.location
// // 						} has been acknowledged`,
// // 					});
// // 				}
// // 			},
// // 			[toast]
// // 		),

// // 		onSystemNotification: useCallback(
// // 			(notification: any) => {
// // 				toast({
// // 					title: "📢 System Notification",
// // 					description: notification.message,
// // 					variant:
// // 						notification.severity === "error" ? "destructive" : "default",
// // 				});
// // 			},
// // 			[toast]
// // 		),
// // 	});

// // 	// Load current user info
// // 	useEffect(() => {
// // 		const loadCurrentUser = async () => {
// // 			try {
// // 				const storedUser = localStorage.getItem("currentUser");
// // 				if (storedUser) {
// // 					setCurrentUser(JSON.parse(storedUser));
// // 				} else {
// // 					const user = await apiClient.getCurrentUser();
// // 					setCurrentUser(user);
// // 				}
// // 			} catch (error) {
// // 				console.error("Failed to load current user:", error);
// // 			}
// // 		};

// // 		loadCurrentUser();
// // 	}, []);

// // 	// Request notification permission on component mount
// // 	useEffect(() => {
// // 		if ("Notification" in window && Notification.permission === "default") {
// // 			Notification.requestPermission().then((permission) => {
// // 				console.log(`Notification permission: ${permission}`);
// // 			});
// // 		}
// // 	}, []);

// // 	// Initialize audio service settings
// // 	useEffect(() => {
// // 		audioService.setEnabled(audioEnabled);
// // 	}, [audioEnabled]);

// // 	// Initial alarm fetch
// // 	useEffect(() => {
// // 		fetchAlarms();
// // 	}, []);

// // 	const fetchAlarms = async () => {
// // 		try {
// // 			setLoading(true);
// // 			const response = await apiClient.getAlarms();
// // 			console.log("Fetched alarms from API:", response);

// // 			const alarmsWithCoords =
// // 				(response as any).alarms?.map((alarm: Alarm) => ({
// // 					...alarm,
// // 					coordinates: {
// // 						latitude: alarm?.latitude
// // 							? Number(alarm?.latitude)
// // 							: 9.0192 + (Math.random() - 0.5) * 0.1,
// // 						longitude: alarm?.longitude
// // 							? Number(alarm?.longitude)
// // 							: 38.7525 + (Math.random() - 0.5) * 0.1,
// // 					},
// // 					isRealTime: false,
// // 				})) || [];

// // 			setAlarms(alarmsWithCoords);
// // 		} catch (error) {
// // 			console.error("Failed to fetch alarms:", error);
// // 			toast({
// // 				title: "Error",
// // 				description: "Failed to fetch alarms",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setLoading(false);
// // 		}
// // 	};

// // 	const acknowledgeAlarm = async (alarmId: string) => {
// // 		try {
// // 			setUpdating(true);
// // 			await apiClient.updateAlarm(alarmId, {
// // 				status: "ACKNOWLEDGED",
// // 				acknowledgedAt: new Date().toISOString(),
// // 			});

// // 			toast({
// // 				title: "Success",
// // 				description: "Alarm acknowledged successfully",
// // 			});

// // 			// Update local state immediately
// // 			setAlarms((prev) =>
// // 				prev.map((alarm) =>
// // 					alarm.id === alarmId
// // 						? {
// // 								...alarm,
// // 								status: "ACKNOWLEDGED" as const,
// // 								acknowledgedAt: new Date().toISOString(),
// // 						  }
// // 						: alarm
// // 				)
// // 			);

// // 			// Remove from audio alerts
// // 			audioService.removeActiveAlarm(alarmId);
// // 		} catch (error: any) {
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to acknowledge alarm",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setUpdating(false);
// // 		}
// // 	};

// // 	const resolveAlarm = async () => {
// // 		if (!selectedAlarm) return;

// // 		try {
// // 			setUpdating(true);
// // 			await apiClient.updateAlarm(selectedAlarm.id, {
// // 				status: "RESOLVED",
// // 				completedAt: new Date().toISOString(),
// // 				resolutionDescription,
// // 			});

// // 			toast({
// // 				title: "Success",
// // 				description: "Alarm resolved successfully",
// // 			});

// // 			// Update local state
// // 			setAlarms((prev) =>
// // 				prev.map((alarm) =>
// // 					alarm.id === selectedAlarm.id
// // 						? {
// // 								...alarm,
// // 								status: "RESOLVED" as const,
// // 								completedAt: new Date().toISOString(),
// // 								resolutionDescription,
// // 						  }
// // 						: alarm
// // 				)
// // 			);

// // 			// Remove from audio alerts
// // 			audioService.removeActiveAlarm(selectedAlarm.id);

// // 			setIsResolutionDialogOpen(false);
// // 			setResolutionDescription("");
// // 			setSelectedAlarm(null);
// // 		} catch (error: any) {
// // 			toast({
// // 				title: "Error",
// // 				description: error.message || "Failed to resolve alarm",
// // 				variant: "destructive",
// // 			});
// // 		} finally {
// // 			setUpdating(false);
// // 		}
// // 	};

// // 	const viewAlarmDetails = (alarmId: string) => {
// // 		const alarm = alarms.find((a) => a.id === alarmId);
// // 		if (alarm) {
// // 			setSelectedAlarm(alarm);
// // 			setIsDetailsDialogOpen(true);
// // 		}
// // 	};

// // 	// Helper functions
// // 	const getSeverityPriority = (severity: string): number => {
// // 		switch (severity) {
// // 			case "CRITICAL":
// // 				return 1;
// // 			case "HIGH":
// // 				return 2;
// // 			case "MEDIUM":
// // 				return 3;
// // 			case "LOW":
// // 				return 4;
// // 			default:
// // 				return 5;
// // 		}
// // 	};

// // 	const getSeverityColor = (severity: string) => {
// // 		switch (severity) {
// // 			case "CRITICAL":
// // 				return "bg-red-600 text-white";
// // 			case "HIGH":
// // 				return "bg-orange-600 text-white";
// // 			case "MEDIUM":
// // 				return "bg-yellow-600 text-white";
// // 			case "LOW":
// // 				return "bg-blue-600 text-white";
// // 			default:
// // 				return "bg-gray-600 text-white";
// // 		}
// // 	};

// // 	const getStatusColor = (status: string) => {
// // 		switch (status) {
// // 			case "ACTIVE":
// // 				return "bg-red-100 text-red-800 border-red-200";
// // 			case "ACKNOWLEDGED":
// // 				return "bg-yellow-100 text-yellow-800 border-yellow-200";
// // 			case "RESOLVED":
// // 				return "bg-green-100 text-green-800 border-green-200";
// // 			default:
// // 				return "bg-gray-100 text-gray-800 border-gray-200";
// // 		}
// // 	};

// // 	// Filter alarms based on search and filters
// // 	const filteredAlarms = useMemo(() => {
// // 		return alarms
// // 			.filter((alarm) => {
// // 				const matchesSearch =
// // 					searchTerm === "" ||
// // 					alarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // 					alarm.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // 					alarm.type.toLowerCase().includes(searchTerm.toLowerCase());

// // 				const matchesStatus =
// // 					statusFilter === "all" || alarm.status === statusFilter;
// // 				const matchesSeverity =
// // 					severityFilter === "all" || alarm.severity === severityFilter;

// // 				return matchesSearch && matchesStatus && matchesSeverity;
// // 			})
// // 			.sort((a, b) => {
// // 				if (a.priority !== b.priority) {
// // 					return (a.priority || 5) - (b.priority || 5);
// // 				}
// // 				return (
// // 					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// // 				);
// // 			});
// // 	}, [alarms, searchTerm, statusFilter, severityFilter]);

// // 	// Statistics
// // 	const alarmStats = useMemo(() => {
// // 		const total = alarms.length;
// // 		const active = alarms.filter((a) => a.status === "ACTIVE").length;
// // 		const acknowledged = alarms.filter(
// // 			(a) => a.status === "ACKNOWLEDGED"
// // 		).length;
// // 		const resolved = alarms.filter((a) => a.status === "RESOLVED").length;
// // 		const critical = alarms.filter((a) => a.severity === "CRITICAL").length;
// // 		const realTime = alarms.filter((a) => a.isRealTime).length;

// // 		return { total, active, acknowledged, resolved, critical, realTime };
// // 	}, [alarms]);

// // 	if (loading) {
// // 		return (
// // 			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
// // 				<div className="space-y-6">
// // 					<Skeleton className="h-32 w-full bg-slate-800" />
// // 					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
// // 						{[...Array(4)].map((_, i) => (
// // 							<Skeleton key={i} className="h-24 bg-slate-800" />
// // 						))}
// // 					</div>
// // 					<Skeleton className="h-96 w-full bg-slate-800" />
// // 				</div>
// // 			</div>
// // 		);
// // 	}

// // 	return (
// // 		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
// // 			<div className="space-y-6 p-6">
// // 				{/* Header Section */}
// // 				<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/20 via-slate-900/40 to-red-900/20 border border-red-500/20 p-8">
// // 					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] opacity-20" />
// // 					<div className="relative flex items-center justify-between">
// // 						<div className="flex items-center space-x-4">
// // 							<div className="relative">
// // 								<div className="p-4 bg-red-600/20 rounded-xl border border-red-500/30">
// // 									<Shield className="h-8 w-8 text-red-400" />
// // 								</div>
// // 								{alarmStats.active > 0 && (
// // 									<div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
// // 								)}
// // 							</div>
// // 							<div>
// // 								<h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-red-400 bg-clip-text text-transparent">
// // 									POLICE COMMAND CENTER
// // 								</h1>
// // 								<p className="text-slate-400 font-mono text-lg mt-2">
// // 									Real-time ALARM monitoring & incident response system
// // 								</p>
// // 								{currentUser && (
// // 									<p className="text-slate-500 font-mono text-sm mt-1">
// // 										Logged in as: {currentUser.name} ({currentUser.role}
// // 										{currentUser.operatorType &&
// // 											` - ${currentUser.operatorType}`}
// // 										)
// // 									</p>
// // 								)}
// // 							</div>
// // 						</div>
// // 						<div className="flex items-center space-x-4">
// // 							{/* WebSocket Connection Status */}
// // 							<div
// // 								className={cn(
// // 									"flex items-center space-x-2 px-4 py-2 rounded-lg border",
// // 									isConnected
// // 										? "bg-green-600/20 border-green-500/30"
// // 										: "bg-red-600/20 border-red-500/30"
// // 								)}>
// // 								{isConnected ? (
// // 									<>
// // 										<Wifi className="h-4 w-4 text-green-400" />
// // 										<span className="text-green-400 font-mono text-sm">
// // 											REAL-TIME CONNECTED
// // 										</span>
// // 									</>
// // 								) : (
// // 									<>
// // 										<WifiOff className="h-4 w-4 text-red-400" />
// // 										<span className="text-red-400 font-mono text-sm">
// // 											DISCONNECTED
// // 										</span>
// // 									</>
// // 								)}
// // 							</div>

// // 							{/* Audio Controls */}
// // 							<div className="flex items-center space-x-2">
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => {
// // 										setAudioEnabled(!audioEnabled);
// // 										audioService.setEnabled(!audioEnabled);
// // 									}}
// // 									className={cn(
// // 										"border-slate-600",
// // 										audioEnabled
// // 											? "bg-blue-600/20 text-blue-400"
// // 											: "bg-slate-600/20 text-slate-400"
// // 									)}>
// // 									{audioEnabled ? (
// // 										<Volume2 className="h-4 w-4" />
// // 									) : (
// // 										<VolumeX className="h-4 w-4" />
// // 									)}
// // 								</Button>

// // 								{/* Emergency Stop Button */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => audioService.forceStopAllAlerts()}
// // 									className="border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600/40"
// // 									title="Emergency stop all audio alerts">
// // 									<StopCircle className="h-4 w-4" />
// // 								</Button>

// // 								{/* Test Audio Button */}
// // 								<Button
// // 									variant="outline"
// // 									size="sm"
// // 									onClick={() => audioService.testAllSounds()}
// // 									className="border-slate-600 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
// // 									title="Test all alarm sounds">
// // 									<TestTube className="h-4 w-4" />
// // 								</Button>
// // 							</div>

// // 							{/* Refresh Button */}
// // 							<Button
// // 								variant="outline"
// // 								size="sm"
// // 								onClick={fetchAlarms}
// // 								disabled={loading}
// // 								className="border-slate-600 bg-slate-600/20 text-slate-400 hover:bg-slate-600/40">
// // 								<RefreshCw
// // 									className={cn("h-4 w-4", loading && "animate-spin")}
// // 								/>
// // 							</Button>
// // 						</div>
// // 					</div>
// // 				</div>

// // 				{/* Persistent Audio Alert Status */}
// // 				{audioEnabled && audioService.getActiveAlarmCount() > 0 && (
// // 					<div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 animate-pulse">
// // 						<div className="flex items-center justify-between">
// // 							<div className="flex items-center space-x-3">
// // 								<div className="flex items-center space-x-2">
// // 									{audioService.isCurrentlyPlaying() ? (
// // 										<Play className="h-5 w-5 text-red-400 animate-pulse" />
// // 									) : (
// // 										<Pause className="h-5 w-5 text-red-400" />
// // 									)}
// // 									<Volume2 className="h-5 w-5 text-red-400" />
// // 								</div>
// // 								<div>
// // 									<span className="text-red-400 font-bold text-lg">
// // 										🚨 PERSISTENT AUDIO ALERTS ACTIVE
// // 									</span>
// // 									<p className="text-red-300 text-sm">
// // 										{audioService.getActiveAlarmCount()} active alarm
// // 										{audioService.getActiveAlarmCount() !== 1 ? "s" : ""} -
// // 										Audio will continue until ALL alarms are acknowledged
// // 									</p>
// // 								</div>
// // 							</div>
// // 							<Button
// // 								variant="outline"
// // 								size="sm"
// // 								onClick={() => audioService.forceStopAllAlerts()}
// // 								className="border-red-500 bg-red-600/20 text-red-400 hover:bg-red-600/40">
// // 								<StopCircle className="h-4 w-4 mr-2" />
// // 								EMERGENCY STOP
// // 							</Button>
// // 						</div>
// // 					</div>
// // 				)}

// // 				{/* Audio Status Indicator */}
// // 				{audioEnabled && audioService.getActiveAlarmCount() === 0 && (
// // 					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
// // 						<div className="flex items-center space-x-2">
// // 							<Volume2 className="h-5 w-5 text-green-400" />
// // 							<span className="text-green-400 font-medium">
// // 								🔊 AUDIO ALERTS READY
// // 							</span>
// // 							<span className="text-green-300 text-sm">
// // 								- Persistent alerts will play for all active alarms until
// // 								acknowledged
// // 							</span>
// // 						</div>
// // 					</div>
// // 				)}

// // 				{/* Statistics Cards */}
// // 				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
// // 					<Card className="bg-slate-900/50 border-slate-700">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Activity className="h-5 w-5 text-blue-400" />
// // 								<div>
// // 									<p className="text-sm text-slate-400">Total Alarms</p>
// // 									<p className="text-2xl font-bold text-white">
// // 										{alarmStats.total}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-red-900/20 border-red-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<AlertTriangle className="h-5 w-5 text-red-400" />
// // 								<div>
// // 									<p className="text-sm text-red-300">Active</p>
// // 									<p className="text-2xl font-bold text-red-400">
// // 										{alarmStats.active}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-yellow-900/20 border-yellow-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Eye className="h-5 w-5 text-yellow-400" />
// // 								<div>
// // 									<p className="text-sm text-yellow-300">Acknowledged</p>
// // 									<p className="text-2xl font-bold text-yellow-400">
// // 										{alarmStats.acknowledged}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-green-900/20 border-green-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<CheckCircle className="h-5 w-5 text-green-400" />
// // 								<div>
// // 									<p className="text-sm text-green-300">Resolved</p>
// // 									<p className="text-2xl font-bold text-green-400">
// // 										{alarmStats.resolved}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-purple-900/20 border-purple-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Zap className="h-5 w-5 text-purple-400" />
// // 								<div>
// // 									<p className="text-sm text-purple-300">Critical</p>
// // 									<p className="text-2xl font-bold text-purple-400">
// // 										{alarmStats.critical}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>

// // 					<Card className="bg-cyan-900/20 border-cyan-500/30">
// // 						<CardContent className="p-4">
// // 							<div className="flex items-center space-x-2">
// // 								<Radio className="h-5 w-5 text-cyan-400" />
// // 								<div>
// // 									<p className="text-sm text-cyan-300">Real-time</p>
// // 									<p className="text-2xl font-bold text-cyan-400">
// // 										{alarmStats.realTime}
// // 									</p>
// // 								</div>
// // 							</div>
// // 						</CardContent>
// // 					</Card>
// // 				</div>

// // 				{/* Filters */}
// // 				<Card className="bg-slate-900/50 border-slate-700">
// // 					<CardContent className="p-4">
// // 						<div className="flex flex-col md:flex-row gap-4">
// // 							<div className="flex-1">
// // 								<div className="relative">
// // 									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
// // 									<Input
// // 										placeholder="Search alarms..."
// // 										value={searchTerm}
// // 										onChange={(e) => setSearchTerm(e.target.value)}
// // 										className="pl-10 bg-slate-800 border-slate-600 text-white"
// // 									/>
// // 								</div>
// // 							</div>
// // 							<Select value={statusFilter} onValueChange={setStatusFilter}>
// // 								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
// // 									<SelectValue placeholder="Filter by status" />
// // 								</SelectTrigger>
// // 								<SelectContent className="bg-slate-800 border-slate-600">
// // 									<SelectItem value="all">All Status</SelectItem>
// // 									<SelectItem value="ACTIVE">Active</SelectItem>
// // 									<SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
// // 									<SelectItem value="RESOLVED">Resolved</SelectItem>
// // 								</SelectContent>
// // 							</Select>
// // 							<Select value={severityFilter} onValueChange={setSeverityFilter}>
// // 								<SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600 text-white">
// // 									<SelectValue placeholder="Filter by severity" />
// // 								</SelectTrigger>
// // 								<SelectContent className="bg-slate-800 border-slate-600">
// // 									<SelectItem value="all">All Severity</SelectItem>
// // 									<SelectItem value="CRITICAL">Critical</SelectItem>
// // 									<SelectItem value="HIGH">High</SelectItem>
// // 									<SelectItem value="MEDIUM">Medium</SelectItem>
// // 									<SelectItem value="LOW">Low</SelectItem>
// // 								</SelectContent>
// // 							</Select>
// // 						</div>
// // 					</CardContent>
// // 				</Card>

// // 				{/* Alarms List */}
// // 				<div className="space-y-4">
// // 					{filteredAlarms.length === 0 ? (
// // 						<Card className="bg-slate-900/50 border-slate-700">
// // 							<CardContent className="p-8 text-center">
// // 								<AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
// // 								<p className="text-slate-400 text-lg">No alarms found</p>
// // 								<p className="text-slate-500 text-sm mt-2">
// // 									{searchTerm ||
// // 									statusFilter !== "all" ||
// // 									severityFilter !== "all"
// // 										? "Try adjusting your filters"
// // 										: "All clear! No active alarms at this time."}
// // 								</p>
// // 							</CardContent>
// // 						</Card>
// // 					) : (
// // 						filteredAlarms.map((alarm) => (
// // 							<Card
// // 								key={alarm.id}
// // 								className={cn(
// // 									"bg-slate-900/50 border-slate-700 transition-all duration-300",
// // 									alarm.isRealTime &&
// // 										"ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20",
// // 									alarm.severity === "CRITICAL" &&
// // 										"border-red-500/50 bg-red-900/10",
// // 									alarm.status === "ACTIVE" &&
// // 										audioEnabled &&
// // 										"ring-1 ring-red-400/30" // Visual indicator for active alarms with audio
// // 								)}>
// // 								<CardContent className="p-6">
// // 									<div className="flex items-start justify-between">
// // 										<div className="flex-1 space-y-3">
// // 											<div className="flex items-center space-x-3">
// // 												<Badge className={getSeverityColor(alarm.severity)}>
// // 													{alarm.severity}
// // 												</Badge>
// // 												<Badge
// // 													variant="outline"
// // 													className={getStatusColor(alarm.status)}>
// // 													{alarm.status}
// // 												</Badge>
// // 												{alarm.isRealTime && (
// // 													<Badge className="bg-cyan-600 text-white animate-pulse">
// // 														<Radio className="h-3 w-3 mr-1" />
// // 														LIVE
// // 													</Badge>
// // 												)}
// // 												{alarm.status === "ACTIVE" && audioEnabled && (
// // 													<Badge className="bg-red-600 text-white animate-pulse">
// // 														<Volume2 className="h-3 w-3 mr-1" />
// // 														AUDIO ALERT
// // 													</Badge>
// // 												)}
// // 												<span className="text-sm text-slate-400 font-mono">
// // 													#{alarm.id.slice(-8)}
// // 												</span>
// // 											</div>

// // 											<div>
// // 												<h3 className="text-lg font-semibold text-white mb-1">
// // 													{alarm.type}
// // 												</h3>
// // 												<p className="text-slate-300">{alarm.description}</p>
// // 											</div>

// // 											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
// // 												<div className="flex items-center space-x-2">
// // 													<MapPin className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.branch.name}
// // 													</span>
// // 												</div>
// // 												<div className="flex items-center space-x-2">
// // 													<Users className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.createdBy.name}
// // 													</span>
// // 												</div>
// // 												<div className="flex items-center space-x-2">
// // 													<Calendar className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{new Date(alarm.createdAt).toLocaleString()}
// // 													</span>
// // 												</div>
// // 											</div>

// // 											{alarm.location && (
// // 												<div className="flex items-center space-x-2 text-sm">
// // 													<Navigation className="h-4 w-4 text-slate-400" />
// // 													<span className="text-slate-300">
// // 														{alarm.location}
// // 													</span>
// // 												</div>
// // 											)}
// // 										</div>

// // 										<div className="flex flex-col space-y-2 ml-4">
// // 											<Button
// // 												variant="outline"
// // 												size="sm"
// // 												onClick={() => viewAlarmDetails(alarm.id)}
// // 												className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-600/40">
// // 												<Eye className="h-4 w-4 mr-2" />
// // 												Details
// // 											</Button>

// // 											{alarm.status === "ACTIVE" && (
// // 												<Button
// // 													variant="outline"
// // 													size="sm"
// // 													onClick={() => acknowledgeAlarm(alarm.id)}
// // 													disabled={updating}
// // 													className="border-yellow-600 bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40">
// // 													{updating ? (
// // 														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 													) : (
// // 														<CheckCircle className="h-4 w-4 mr-2" />
// // 													)}
// // 													Acknowledge
// // 												</Button>
// // 											)}

// // 											{alarm.status === "ACKNOWLEDGED" && (
// // 												<Button
// // 													variant="outline"
// // 													size="sm"
// // 													onClick={() => {
// // 														setSelectedAlarm(alarm);
// // 														setIsResolutionDialogOpen(true);
// // 													}}
// // 													className="border-green-600 bg-green-600/20 text-green-300 hover:bg-green-600/40">
// // 													<Target className="h-4 w-4 mr-2" />
// // 													Resolve
// // 												</Button>
// // 											)}
// // 										</div>
// // 									</div>
// // 								</CardContent>
// // 							</Card>
// // 						))
// // 					)}
// // 				</div>

// // 				{/* Alarm Details Dialog */}
// // 				<Dialog
// // 					open={isDetailsDialogOpen}
// // 					onOpenChange={setIsDetailsDialogOpen}>
// // 					<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
// // 						<DialogHeader>
// // 							<DialogTitle className="text-xl font-bold">
// // 								Alarm Details - {selectedAlarm?.type}
// // 							</DialogTitle>
// // 							<DialogDescription className="text-slate-400">
// // 								Complete information about this alarm incident
// // 							</DialogDescription>
// // 						</DialogHeader>

// // 						{selectedAlarm && (
// // 							<div className="space-y-4">
// // 								<div className="grid grid-cols-2 gap-4">
// // 									<div>
// // 										<Label className="text-slate-300">Severity</Label>
// // 										<Badge className={getSeverityColor(selectedAlarm.severity)}>
// // 											{selectedAlarm.severity}
// // 										</Badge>
// // 									</div>
// // 									<div>
// // 										<Label className="text-slate-300">Status</Label>
// // 										<Badge
// // 											variant="outline"
// // 											className={getStatusColor(selectedAlarm.status)}>
// // 											{selectedAlarm.status}
// // 										</Badge>
// // 									</div>
// // 								</div>

// // 								<div>
// // 									<Label className="text-slate-300">Description</Label>
// // 									<p className="text-white mt-1">{selectedAlarm.description}</p>
// // 								</div>

// // 								{selectedAlarm.additionalNotes && (
// // 									<div>
// // 										<Label className="text-slate-300">Additional Notes</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.additionalNotes}
// // 										</p>
// // 									</div>
// // 								)}

// // 								<div className="grid grid-cols-2 gap-4">
// // 									<div>
// // 										<Label className="text-slate-300">Branch</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.branch.name}
// // 										</p>
// // 									</div>
// // 									<div>
// // 										<Label className="text-slate-300">Created By</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.createdBy.name}
// // 										</p>
// // 									</div>
// // 								</div>

// // 								<div className="grid grid-cols-2 gap-4">
// // 									<div>
// // 										<Label className="text-slate-300">Created At</Label>
// // 										<p className="text-white mt-1">
// // 											{new Date(selectedAlarm.createdAt).toLocaleString()}
// // 										</p>
// // 									</div>
// // 									{selectedAlarm.acknowledgedAt && (
// // 										<div>
// // 											<Label className="text-slate-300">Acknowledged At</Label>
// // 											<p className="text-white mt-1">
// // 												{new Date(
// // 													selectedAlarm.acknowledgedAt
// // 												).toLocaleString()}
// // 											</p>
// // 										</div>
// // 									)}
// // 								</div>

// // 								{selectedAlarm.coordinates && (
// // 									<div>
// // 										<Label className="text-slate-300">Coordinates</Label>
// // 										<p className="text-white mt-1">
// // 											Lat: {selectedAlarm.coordinates.latitude.toFixed(6)}, Lng:{" "}
// // 											{selectedAlarm.coordinates.longitude.toFixed(6)}
// // 										</p>
// // 									</div>
// // 								)}

// // 								{selectedAlarm.resolutionDescription && (
// // 									<div>
// // 										<Label className="text-slate-300">Resolution</Label>
// // 										<p className="text-white mt-1">
// // 											{selectedAlarm.resolutionDescription}
// // 										</p>
// // 									</div>
// // 								)}
// // 							</div>
// // 						)}
// // 					</DialogContent>
// // 				</Dialog>

// // 				{/* Resolution Dialog */}
// // 				<Dialog
// // 					open={isResolutionDialogOpen}
// // 					onOpenChange={setIsResolutionDialogOpen}>
// // 					<DialogContent className="bg-slate-900 border-slate-700 text-white">
// // 						<DialogHeader>
// // 							<DialogTitle>Resolve Alarm</DialogTitle>
// // 							<DialogDescription className="text-slate-400">
// // 								Provide details about how this alarm was resolved
// // 							</DialogDescription>
// // 						</DialogHeader>

// // 						<div className="space-y-4">
// // 							<div>
// // 								<Label htmlFor="resolution" className="text-slate-300">
// // 									Resolution Description
// // 								</Label>
// // 								<Textarea
// // 									id="resolution"
// // 									placeholder="Describe how the alarm was resolved..."
// // 									value={resolutionDescription}
// // 									onChange={(e) => setResolutionDescription(e.target.value)}
// // 									className="bg-slate-800 border-slate-600 text-white mt-2"
// // 									rows={4}
// // 								/>
// // 							</div>

// // 							<div className="flex justify-end space-x-2">
// // 								<Button
// // 									variant="outline"
// // 									onClick={() => setIsResolutionDialogOpen(false)}
// // 									className="border-slate-600 text-slate-300">
// // 									Cancel
// // 								</Button>
// // 								<Button
// // 									onClick={resolveAlarm}
// // 									disabled={updating || !resolutionDescription.trim()}
// // 									className="bg-green-600 hover:bg-green-700 text-white">
// // 									{updating ? (
// // 										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// // 									) : (
// // 										<CheckCircle className="h-4 w-4 mr-2" />
// // 									)}
// // 									Resolve Alarm
// // 								</Button>
// // 							</div>
// // 						</div>
// // 					</DialogContent>
// // 				</Dialog>
// // 			</div>
// // 		</div>
// // 	);
// // }
