"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Radio, Clock, AlertTriangle } from "lucide-react";

interface AlarmSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	alarmData: {
		id: string;
		type: string;
		severity: string;
		branchName: string;
		assignedTo: string;
		createdAt: string;
	};
}

export function AlarmSuccessModal({
	isOpen,
	onClose,
	alarmData,
}: AlarmSuccessModalProps) {
	const [countdown, setCountdown] = useState(10);

	useEffect(() => {
		if (isOpen && countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		} else if (countdown === 0) {
			onClose();
		}
	}, [isOpen, countdown, onClose]);

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "CRITICAL":
				return "bg-red-600 text-white";
			case "HIGH":
				return "bg-orange-600 text-white";
			case "MEDIUM":
				return "bg-yellow-600 text-white";
			case "LOW":
				return "bg-blue-600 text-white";
			default:
				return "bg-gray-600 text-white";
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2 text-green-400">
						<CheckCircle className="h-6 w-6" />
						<span>Alarm Dispatched Successfully!</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
						<div className="flex items-center justify-center space-x-2 mb-2">
							<Radio className="h-5 w-5 text-green-400 animate-pulse" />
							<span className="text-green-400 font-medium">
								LIVE DISPATCH ACTIVE
							</span>
						</div>
						<p className="text-sm text-green-200">
							Your emergency alarm has been sent to police personnel in
							real-time
						</p>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-slate-400">Alarm ID:</span>
							<span className="font-mono text-white">
								#{alarmData.id.slice(-8)}
							</span>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-slate-400">Type:</span>
							<span className="text-white">{alarmData.type}</span>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-slate-400">Priority:</span>
							<Badge className={getSeverityColor(alarmData.severity)}>
								{alarmData.severity}
							</Badge>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-slate-400">Location:</span>
							<span className="text-white">{alarmData.branchName}</span>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-slate-400">Assigned to:</span>
							<span className="text-white">{alarmData.assignedTo}</span>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-slate-400">Dispatched:</span>
							<span className="text-white">
								{new Date(alarmData.createdAt).toLocaleTimeString()}
							</span>
						</div>
					</div>

					<div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
						<div className="flex items-center space-x-2 mb-2">
							<AlertTriangle className="h-4 w-4 text-blue-400" />
							<span className="text-blue-400 font-medium">Next Steps</span>
						</div>
						<ul className="text-sm text-blue-200 space-y-1">
							<li>• Police personnel have been notified</li>
							<li>• Response team will be dispatched</li>
							<li>• You will receive status updates</li>
						</ul>
					</div>

					<div className="flex items-center justify-between">
						<Button
							variant="outline"
							onClick={onClose}
							className="border-slate-600 text-slate-300 hover:bg-slate-800">
							Close
						</Button>
						<div className="flex items-center space-x-2 text-sm text-slate-400">
							<Clock className="h-4 w-4" />
							<span>Auto-close in {countdown}s</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
