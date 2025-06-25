"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

import { SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, loading, logout } = useAuth();
	const router = useRouter();

	const handleLogout = async () => {
		try {
			await logout();
			router.push("/");
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

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
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem
			disableTransitionOnChange>
			{/* <NotificationProvider> */}
			<Toaster />
			<SidebarProvider>
				{/* <AppSidebar /> */}
				<AppSidebar user={user as any} onLogout={handleLogout} />

				<SidebarInset>
					<DashboardHeader user={user} onLogout={handleLogout} />
					<main className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</main>
				</SidebarInset>
			</SidebarProvider>
			{/* </NotificationProvider> */}
		</ThemeProvider>
	);
}
