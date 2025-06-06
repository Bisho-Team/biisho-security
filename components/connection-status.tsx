"use client";

import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/notification-context";

export function ConnectionStatus() {
	const { isConnected } = useNotifications();

	return (
		<Badge
			variant={isConnected ? "default" : "destructive"}
			className="flex items-center space-x-1">
			{isConnected ? (
				<>
					<Wifi className="h-3 w-3 text-green-500" />
					<span>Connected</span>
				</>
			) : (
				<>
					<WifiOff className="h-3 w-3 text-red-500" />
					<span>Disconnected</span>
				</>
			)}
		</Badge>
	);
}
