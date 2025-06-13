"use client";

import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { getPopularLocations } from "@/lib/ethiopia-locations";

interface LocationQuickSelectProps {
	onLocationSelect: (location: any) => void;
}

export function LocationQuickSelect({
	onLocationSelect,
}: LocationQuickSelectProps) {
	const popularLocations = getPopularLocations();

	return (
		<div className="space-y-2">
			<p className="text-xs font-medium text-muted-foreground">
				Quick Select Popular Cities:
			</p>
			<div className="flex flex-wrap gap-1">
				{popularLocations.slice(0, 6).map((location) => (
					<Button
						key={location.id}
						type="button"
						variant="outline"
						size="sm"
						className="text-xs h-7"
						onClick={() => onLocationSelect(location)}>
						<MapPin className="h-3 w-3 mr-1" />
						{location.name}
					</Button>
				))}
			</div>
		</div>
	);
}
