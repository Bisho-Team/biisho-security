"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

import { SidebarInset } from "@/components/ui/sidebar";
// import { NotificationProvider } from "@/contexts/notification-context";
import { ThemeProvider } from "@/components/theme-provider";
import { audioService } from "@/lib/audio-service";
import { GlobalAlarmProvider } from "@/components/global-alarm-provider";
import { GlobalAlarmStatusBar } from "@/components/global-alarm-status-bar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, loading, logout } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			router.push("/");
		}
	}, [user, loading, router]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<GlobalAlarmProvider>
			<main className="flex-1">{children}</main>
			<GlobalAlarmStatusBar />
		</GlobalAlarmProvider>
	);
}
