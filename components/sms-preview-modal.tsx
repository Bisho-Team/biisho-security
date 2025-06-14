"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageSquare, Clock, AlertTriangle } from "lucide-react";

interface SmsPreviewModalProps {
	formData: {
		type: string;
		location: string;
		description: string;
	};
	phoneNumber: string;
}

export function SmsPreviewModal({
	formData,
	phoneNumber,
}: SmsPreviewModalProps) {
	const [open, setOpen] = useState(false);

	const generateSmsMessage = () => {
		return `🚨 ALARM REPORT 🚨
Type: ${formData.type || "Not specified"}
Location: ${formData.location || "Not specified"}
Description: ${formData.description || "Not specified"}
Time: ${new Date().toLocaleString()}
Priority: CRITICAL
Status: DISPATCHED

This is an automated security alert.`;
	};

	if (!phoneNumber.trim() || !formData.type) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm" className="text-xs">
					<Eye className="h-3 w-3 mr-1" />
					Preview SMS
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2">
						<MessageSquare className="h-5 w-5" />
						<span>SMS Report Preview</span>
					</DialogTitle>
					<DialogDescription>
						Preview of the SMS that will be sent to {phoneNumber}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<Badge variant="outline" className="text-xs">
								SMS Message
							</Badge>
							<span className="text-xs text-muted-foreground">
								{generateSmsMessage().length} characters
							</span>
						</div>
						<div className="bg-white rounded-md p-3 border">
							<pre className="text-sm whitespace-pre-wrap font-mono text-gray-800">
								{generateSmsMessage()}
							</pre>
						</div>
					</div>

					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center space-x-1">
							<Clock className="h-3 w-3" />
							<span>Sent after alarm creation</span>
						</div>
						<div className="flex items-center space-x-1">
							<AlertTriangle className="h-3 w-3" />
							<span>High Priority</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
