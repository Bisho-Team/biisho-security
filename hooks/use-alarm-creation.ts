"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface AlarmFormData {
	type: string;
	branchId: string;
	companyId?: string;
	location: string;
	longitude: string;
	latitude: string;
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	description: string;
	additionalNotes: string;
	assignedToId: string;
}

export function useAlarmCreation() {
	const router = useRouter();
	const { toast } = useToast();
	const [submitting, setSubmitting] = useState(false);

	const createAlarm = useCallback(
		async (formData: AlarmFormData) => {
			try {
				setSubmitting(true);

				const response = await apiClient.createAlarm(formData);

				// Show success notification
				toast({
					title: "🚨 ALARM DISPATCHED!",
					description: "Emergency alarm sent to police personnel",
					duration: 5000,
				});

				// Play success sound
				try {
					const audioContext = new (window.AudioContext ||
						(window as any).webkitAudioContext)();
					const oscillator = audioContext.createOscillator();
					const gainNode = audioContext.createGain();

					oscillator.connect(gainNode);
					gainNode.connect(audioContext.destination);

					// Success tone sequence
					oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
					oscillator.frequency.setValueAtTime(
						800,
						audioContext.currentTime + 0.1
					);
					oscillator.frequency.setValueAtTime(
						1000,
						audioContext.currentTime + 0.2
					);
					oscillator.type = "sine";

					gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(
						0.01,
						audioContext.currentTime + 0.5
					);

					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.5);
				} catch (error) {
					console.error("Failed to play success sound:", error);
				}

				return response;
			} catch (error: any) {
				console.error("Failed to create alarm:", error);
				toast({
					title: "❌ Dispatch Failed",
					description: error.message || "Failed to create alarm",
					variant: "destructive",
				});
				throw error;
			} finally {
				setSubmitting(false);
			}
		},
		[toast]
	);

	return {
		createAlarm,
		submitting,
	};
}
