"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/contexts/notification-context";

export function NotificationPermissionBanner() {
	const { notificationPermission, requestNotificationPermission } =
		useNotifications();
	const [isDismissed, setIsDismissed] = useState(false);

	useEffect(() => {
		const dismissed = localStorage.getItem("notification-banner-dismissed");
		console.log("Notification banner dismissed state:", dismissed);
		// Check if the banner was previously dismissed
		setIsDismissed(dismissed === "true");
	}, []);

	const handleDismiss = () => {
		setIsDismissed(true);
		localStorage.setItem("notification-banner-dismissed", "true");
	};

	const handleEnable = async () => {
		const granted = await requestNotificationPermission();
		if (granted) {
			setIsDismissed(true);
			localStorage.setItem("notification-banner-dismissed", "true");
		}
	};

	if (
		notificationPermission === "granted" ||
		notificationPermission === "denied" ||
		isDismissed
	) {
		return null;
	}

	return (
		<Card className="border-blue-200 bg-blue-50 mb-4">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Bell className="h-5 w-5 text-blue-600" />
						<div>
							<h3 className="font-medium text-blue-800">
								Enable Alarm Notifications --
							</h3>
							<p className="text-sm text-blue-600">
								Get instant browser notifications when new alarms are created,
								even when this tab is not active.
							</p>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Button
							size="sm"
							onClick={handleEnable}
							className="bg-blue-600 hover:bg-blue-700">
							Enable Notifications
						</Button>
						<Button size="sm" variant="ghost" onClick={handleDismiss}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
