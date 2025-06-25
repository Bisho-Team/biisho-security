"use client";

import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils"; // Utility for combining classNames
import { Toast } from "@/components/ui/toast";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<div className="fixed top-4 right-4 z-50 space-y-2">
			{toasts.map((toast) => (
				<Toast key={toast.id} {...toast} />
			))}
		</div>
	);
}
