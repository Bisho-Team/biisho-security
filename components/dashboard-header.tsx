"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Wifi, WifiOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AlarmIndicator } from "./alarm-indicator";
import { ConnectionStatus } from "./connection-status";

interface User {
	role: string;
	name: string;
	id: string;
	managedBy?: any;
	operatorType?: string;
}

interface DashboardHeaderProps {
	user: User;
	onLogout: () => void;
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
	const [isOnline, setIsOnline] = useState(true);
	const [notifications, setNotifications] = useState(3);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const getRoleDisplay = (role: string) => {
		switch (role) {
			case "SUPER_ADMIN":
				return "Super Administrator";
			case "OFFICE_MANAGER":
				return "Office Manager";
			case "POLICE_MANAGER":
				return "Police Manager";
			case "OPERATOR":
				return "Security Operator";
			default:
				return role;
		}
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "SUPER_ADMIN":
				return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0";
			case "OFFICE_MANAGER":
				return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
			case "POLICE_MANAGER":
				return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
			case "OPERATOR":
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
			default:
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
		}
	};

	return (
		<header className="header-enhanced flex h-16 shrink-0 items-center gap-2 px-6 sticky top-0 z-50">
			<SidebarTrigger className="-ml-1 h-8 w-8" />

			<div className="flex-1" />

			<div className="flex items-center gap-3">
				{/* Connection Status */}
				{/* <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
					{isOnline ? (
						<Wifi className="h-4 w-4 text-green-500" />
					) : (
						<WifiOff className="h-4 w-4 text-red-500" />
					)}
					<span className="text-xs font-medium">
						{isOnline ? "Online" : "Offline"}
					</span>
				</div> */}

				{/* Action Buttons */}
				<div className="flex items-center gap-1">
					{/* <Button variant="ghost" size="icon" className="h-9 w-9 relative">
						<Search className="h-4 w-4" />
					</Button> */}
					<ConnectionStatus />
					<AlarmIndicator />

					{/* <Button variant="ghost" size="icon" className="h-9 w-9 relative"> */}
					{/* <Bell className="h-4 w-4" /> */}
					{/* {notifications > 0 && (
							<Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-background">
								{notifications}
							</Badge>
						)} */}
					{/* </Button> */}

					<ThemeToggle />
				</div>

				{/* User Info */}
				<div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm">
							{user.name.charAt(0).toUpperCase()}
						</div>
						<div className="text-right">
							<p className="text-sm font-medium">{user.name}</p>
							<Badge
								className={cn(
									"text-xs font-medium",
									getRoleBadgeColor(user.role)
								)}>
								{getRoleDisplay(user.role)}
							</Badge>
						</div>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={onLogout}
						className="h-8 px-3 font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors">
						Logout
					</Button>
				</div>
			</div>
		</header>
	);
}

// "use client";

// import { SidebarTrigger } from "@/components/ui/sidebar";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Bell, Search, Settings } from "lucide-react";
// import { useAuth } from "@/contexts/auth-context";
// import { AlarmIndicator } from "@/components/alarm-indicator";
// import { ConnectionStatus } from "@/components/connection-status";

// interface User {
// 	role: string;
// 	name: string;
// 	id: string;
// 	managedBy?: any;
// 	operatorType?: string;
// }

// interface DashboardHeader {
// 	user: User;
// }

// export default function DashboardHeader({ user }: DashboardHeader) {
// 	const { logout } = useAuth();

// 	const getRoleDisplay = (role: string) => {
// 		switch (role) {
// 			case "SUPER_ADMIN":
// 				return "Super Administrator";
// 			case "OFFICE_MANAGER":
// 				return "Office Manager";
// 			case "POLICE_MANAGER":
// 				return "Police Manager";
// 			case "OPERATOR":
// 				return "Security Operator";
// 			default:
// 				return role;
// 		}
// 	};

// 	const getRoleBadgeColor = (role: string) => {
// 		switch (role) {
// 			case "SUPER_ADMIN":
// 				return "bg-red-100 text-red-800";
// 			case "OFFICE_MANAGER":
// 				return "bg-blue-100 text-blue-800";
// 			case "POLICE_MANAGER":
// 				return "bg-green-100 text-green-800";
// 			case "OPERATOR":
// 				return "bg-gray-100 text-gray-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	return (
// 		<header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
// 			<SidebarTrigger className="-ml-1" />
// 			<div className="flex-1" />
// 			<div className="flex items-center gap-2">
// 				<ConnectionStatus />
// 				<AlarmIndicator />
// 				{/* <Button variant="ghost" size="icon">
// 					<Search className="h-4 w-4" />
// 				</Button>
// 				<Button variant="ghost" size="icon">
// 					<Bell className="h-4 w-4" />
// 				</Button>
// 				<Button variant="ghost" size="icon">
// 					<Settings className="h-4 w-4" />
// 				</Button> */}
// 				<div className="flex items-center gap-2 ml-4 pl-4 border-l">
// 					<div className="text-right">
// 						<p className="text-sm font-medium">{user.name}</p>
// 						<Badge className={getRoleBadgeColor(user.role)}>
// 							{getRoleDisplay(user.role)}
// 						</Badge>
// 					</div>
// 					<Button variant="outline" size="sm" onClick={logout}>
// 						Logout
// 					</Button>
// 				</div>
// 			</div>
// 		</header>
// 	);
// }
