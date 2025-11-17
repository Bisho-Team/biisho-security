"use client";

import { useMemo } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	Area,
	ComposedChart,
	Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";

interface ChartProps {
	data: any[];
	title: string;
	className?: string;
}

export function StatusDistributionChart({
	data,
	title,
	className,
}: ChartProps) {
	const COLORS: any = {
		ACTIVE: "#ef4444",
		ACKNOWLEDGED: "#f59e0b",
		RESOLVED: "#10b981",
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center text-white">
					<Activity className="h-5 w-5 mr-2 text-blue-400" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={data}
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={5}
								dataKey="value">
								{data.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[entry.name] || entry.color}
									/>
								))}
							</Pie>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1e293b",
									border: "1px solid #475569",
									borderRadius: "8px",
									color: "#fff",
								}}
							/>
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export function SeverityDistributionChart({
	data,
	title,
	className,
}: ChartProps) {
	const COLORS: any = {
		CRITICAL: "#dc2626",
		HIGH: "#ea580c",
		MEDIUM: "#ca8a04",
		LOW: "#2563eb",
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center text-white">
					<TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data}>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
							<XAxis
								dataKey="name"
								stroke="#9ca3af"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#9ca3af"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1e293b",
									border: "1px solid #475569",
									borderRadius: "8px",
									color: "#fff",
								}}
							/>
							<Bar dataKey="value" radius={[4, 4, 0, 0]}>
								{data.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[entry.name] || entry.color}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export function TrendChart({ data, title, className }: ChartProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center text-white">
					<TrendingUp className="h-5 w-5 mr-2 text-green-400" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-80">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={data}>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
							<XAxis
								dataKey="date"
								stroke="#9ca3af"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#9ca3af"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1e293b",
									border: "1px solid #475569",
									borderRadius: "8px",
									color: "#fff",
								}}
							/>
							<Legend />
							<Area
								type="monotone"
								dataKey="total"
								fill="#3b82f6"
								fillOpacity={0.3}
								stroke="#3b82f6"
								strokeWidth={2}
							/>
							<Line
								type="monotone"
								dataKey="resolved"
								stroke="#10b981"
								strokeWidth={2}
								dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
							/>
							<Line
								type="monotone"
								dataKey="active"
								stroke="#ef4444"
								strokeWidth={2}
								dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export function ResponseTimeChart({ data, title, className }: ChartProps) {
	const avgResponseTime = useMemo(() => {
		if (!data.length) return 0;
		const total = data.reduce((sum, item) => sum + (item.responseTime || 0), 0);
		return Math.round(total / data.length);
	}, [data]);

	const trend = useMemo(() => {
		if (data.length < 2) return 0;
		const recent =
			data.slice(-7).reduce((sum, item) => sum + (item.responseTime || 0), 0) /
			7;
		const previous =
			data
				.slice(-14, -7)
				.reduce((sum, item) => sum + (item.responseTime || 0), 0) / 7;
		return recent - previous;
	}, [data]);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-white">
					<div className="flex items-center">
						<Clock className="h-5 w-5 mr-2 text-purple-400" />
						{title}
					</div>
					<div className="flex items-center space-x-2">
						<Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
							Avg: {avgResponseTime}m
						</Badge>
						{trend !== 0 && (
							<Badge
								className={`${
									trend > 0
										? "bg-red-500/20 text-red-300 border-red-500/30"
										: "bg-green-500/20 text-green-300 border-green-500/30"
								}`}>
								{trend > 0 ? (
									<TrendingUp className="h-3 w-3 mr-1" />
								) : (
									<TrendingDown className="h-3 w-3 mr-1" />
								)}
								{Math.abs(Math.round(trend))}m
							</Badge>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data}>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
							<XAxis
								dataKey="date"
								stroke="#9ca3af"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#9ca3af"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								label={{ value: "Minutes", angle: -90, position: "insideLeft" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1e293b",
									border: "1px solid #475569",
									borderRadius: "8px",
									color: "#fff",
								}}
								formatter={(value) => [`${value} minutes`, "Response Time"]}
							/>
							<Line
								type="monotone"
								dataKey="responseTime"
								stroke="#8b5cf6"
								strokeWidth={3}
								dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 5 }}
								activeDot={{ r: 7, stroke: "#8b5cf6", strokeWidth: 2 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
