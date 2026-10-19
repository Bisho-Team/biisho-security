"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, CheckCircle, AlertTriangle, Phone } from "lucide-react";
import { SmsPreviewModal } from "./sms-preview-modal";

interface PhoneNumberInputProps {
	value: string;
	onChange: (value: string) => void;
	formData: {
		type: string;
		location: string;
		description: string;
	};
	smsError?: string;
	smsSuccess?: boolean;
}

export function PhoneNumberInput({
	value,
	onChange,
	formData,
	smsError,
	smsSuccess,
}: PhoneNumberInputProps) {
	const [isValid, setIsValid] = useState(false);
	const [formattedNumber, setFormattedNumber] = useState("");

	useEffect(() => {
		// Basic phone number validation
		const cleanNumber = value.replace(/\D/g, "");
		const isValidNumber = cleanNumber.length >= 10 && cleanNumber.length <= 15;
		setIsValid(isValidNumber);

		// Format the number for display
		if (cleanNumber.length > 0) {
			if (cleanNumber.length <= 10) {
				setFormattedNumber(
					cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
				);
			} else {
				setFormattedNumber(`+${cleanNumber}`);
			}
		} else {
			setFormattedNumber("");
		}
	}, [value]);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label htmlFor="smsPhoneNumber" className="flex items-center space-x-2">
					<Phone className="h-4 w-4" />
					<span>Send Report to Phone Number</span>
					<Badge variant="secondary" className="text-xs">
						Optional
					</Badge>
				</Label>
				{value.trim() && formData.type && (
					<SmsPreviewModal formData={formData} phoneNumber={value} />
				)}
			</div>

			<div className="relative">
				<Input
					id="smsPhoneNumber"
					type="tel"
					placeholder="e.g., +1234567890 or 913228892"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={`pr-10 ${
						value && !isValid
							? "border-red-300 focus:border-red-500"
							: value && isValid
							? "border-green-300 focus:border-green-500"
							: ""
					}`}
				/>
				<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
					{value && isValid ? (
						<CheckCircle className="h-4 w-4 text-green-500" />
					) : value && !isValid ? (
						<AlertTriangle className="h-4 w-4 text-red-500" />
					) : (
						<MessageSquare className="h-4 w-4 text-muted-foreground" />
					)}
				</div>
			</div>

			{formattedNumber && (
				<p className="text-xs text-muted-foreground">
					Formatted: {formattedNumber}
				</p>
			)}

			<p className="text-xs text-muted-foreground">
				📱 Optional: Enter a phone number to receive the alarm report via SMS
			</p>

			{smsError && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription className="text-sm">{smsError}</AlertDescription>
				</Alert>
			)}

			{smsSuccess && (
				<Alert className="border-green-200 bg-green-50">
					<CheckCircle className="h-4 w-4 text-green-600" />
					<AlertDescription className="text-sm text-green-700">
						📨 SMS report sent successfully!
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
