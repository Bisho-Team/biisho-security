"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Wifi, WifiOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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

	// Get token from localStorage or your auth system
	const token =
		typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

	return (
		<header className="header-enhanced flex h-16 shrink-0 items-center gap-2 px-6 sticky top-0 z-50">
			<SidebarTrigger className="-ml-1 h-8 w-8" />

			<div className="flex-1" />

			<div className="flex items-center gap-3">
				{/* Action Buttons */}
				<div className="flex items-center gap-1">
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
