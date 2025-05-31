"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface User {
	role: string;
	name: string;
	id: string;
	managedBy?: any;
	operatorType?: string;
}

interface DashboardHeaderProps {
	user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
	const { logout } = useAuth();

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
				return "bg-red-100 text-red-800";
			case "OFFICE_MANAGER":
				return "bg-blue-100 text-blue-800";
			case "POLICE_MANAGER":
				return "bg-green-100 text-green-800";
			case "OPERATOR":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
			<SidebarTrigger className="-ml-1" />
			<div className="flex-1" />
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon">
					<Search className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon">
					<Bell className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon">
					<Settings className="h-4 w-4" />
				</Button>
				<div className="flex items-center gap-2 ml-4 pl-4 border-l">
					<div className="text-right">
						<p className="text-sm font-medium">{user.name}</p>
						<Badge className={getRoleBadgeColor(user.role)}>
							{getRoleDisplay(user.role)}
						</Badge>
					</div>
					<Button variant="outline" size="sm" onClick={logout}>
						Logout
					</Button>
				</div>
			</div>
		</header>
	);
}
