"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Home,
	AlertTriangle,
	Building,
	Users,
	Settings,
	Shield,
	FileText,
	BarChart3,
	Plus,
	UserPlus,
	ChevronDown,
	LogOut,
	UserIcon,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface User {
	role: string;
	name: string;
	id: string;
	managedBy?: any;
	operatorType?: string;
}

interface AppSidebarProps {
	user: User;
	onLogout: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
	const pathname = usePathname();

	const getMenuItems = () => {
		const baseItems = [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: Home,
			},
		];

		switch (user.role) {
			case "SUPER_ADMIN":
				return [
					...baseItems,
					{
						title: "User Management",
						url: "/dashboard/users",
						icon: Users,
					},
					{
						title: "Company Management",
						url: "/dashboard/companies",
						icon: Building,
					},
					{
						title: "System Analytics",
						url: "/dashboard/analytics",
						icon: BarChart3,
					},
				];

			case "OFFICE_MANAGER":
				return [
					// ...baseItems,
					{
						title: "Alarms",
						url: "/dashboard/alarms",
						icon: AlertTriangle,
					},
					{
						title: "Branches",
						url: "/dashboard/branches",
						icon: Building,
					},
					{
						title: "Operators",
						url: "/dashboard/operators",
						icon: Users,
					},
					{
						title: "Reports",
						url: "/dashboard/analytics",
						icon: FileText,
					},
					{
						title: "Profile",
						url: "/dashboard/profile",
						icon: UserIcon,
					},
				];

			case "POLICE_MANAGER":
				return [
					// ...baseItems,
					{
						title: "Alarm Reports",
						url: "/dashboard/alarm-reports",
						icon: AlertTriangle,
					},
					{
						title: "Operators",
						url: "/dashboard/police-operators",
						icon: Shield,
					},
					{
						title: "Profile",
						url: "/dashboard/account-profile",
						icon: UserIcon,
					},
				];

			case "OPERATOR":
				if (user.operatorType === "OFFICE") {
					return [
						...baseItems,
						{
							title: "Alarms",
							url: "/dashboard/alarms",
							icon: AlertTriangle,
						},
						{
							title: "Tasks",
							url: "/dashboard/tasks",
							icon: FileText,
						},
						{
							title: "Profile",
							url: "/dashboard/profile",
							icon: UserIcon,
						},
					];
				} else if (user.operatorType === "POLICE") {
					return [
						{
							title: "Alarms",
							url: "/dashboard/alarm-reports",
							icon: AlertTriangle,
						},
						{
							title: "Profile",
							url: "/dashboard/account-profile",
							icon: UserIcon,
						},
					];
				} else {
					return [
						...baseItems,
						{
							title: "Reports",
							url: "/dashboard/reports",
							icon: AlertTriangle,
						},
						{
							title: "Cases",
							url: "/dashboard/cases",
							icon: FileText,
						},
						{
							title: "Evidence",
							url: "/dashboard/evidence",
							icon: Shield,
						},
						{
							title: "Profile",
							url: "/dashboard/profile",
							icon: UserIcon,
						},
					];
				}

			default:
				return baseItems;
		}
	};

	const getQuickActions = () => {
		switch (user.role) {
			case "OFFICE_MANAGER":
				return [
					{
						title: "New Alarm",
						url: "/dashboard/configure-alarm",
						icon: AlertTriangle,
						color:
							"bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
					},
					{
						title: "Add Branch",
						url: "/dashboard/add-branch",
						icon: Plus,
						color:
							"bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
					},
				];
			case "SUPER_ADMIN":
				return [
					{
						title: "Add User",
						url: "/dashboard/users",
						icon: UserPlus,
						color:
							"bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
					},
				];
			// case "POLICE_MANAGER":
			// 	return [
			// 		{
			// 			title: "New Case",
			// 			url: "/dashboard/new-case",
			// 			icon: Plus,
			// 			color:
			// 				"bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
			// 		},
			// 	];
			default:
				return [];
		}
	};

	const getRoleDisplay = (role: string) => {
		switch (role) {
			case "SUPER_ADMIN":
				return "Super Administrator";
			case "OFFICE_MANAGER":
				return "Office Manager";
			case "POLICE_MANAGER":
				return "Police Manager";
			case "OPERATOR":
				return "Security Operator";
			default:
				return role;
		}
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "SUPER_ADMIN":
				return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0";
			case "OFFICE_MANAGER":
				return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
			case "POLICE_MANAGER":
				return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
			case "OPERATOR":
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
			default:
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
		}
	};

	const menuItems = getMenuItems();
	const quickActions = getQuickActions();

	return (
		<Sidebar className="sidebar-enhanced">
			<SidebarHeader className="border-b-[1px]">
				<div className="flex items-center space-x-3 p-8 animate-fade-in">
					<img src="/logo-shield.png" alt="" />
				</div>
			</SidebarHeader>

			<SidebarContent className="px-3">
				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
						Navigation
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							{menuItems.map((item, index) => (
								<SidebarMenuItem
									key={item.title}
									className="animate-slide-up"
									style={{ animationDelay: `${index * 0.1}s` }}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.url}
										className={cn(
											"sidebar-menu-item h-11 px-3 font-medium",
											pathname === item.url && "active"
										)}>
										<Link href={item.url}>
											<item.icon className="h-5 w-5" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{quickActions.length > 0 && (
					<SidebarGroup className="mt-6">
						<SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
							Quick Actions
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<div className="space-y-2">
								{quickActions.map((action, index) => (
									<Link key={action.title} href={action.url}>
										<Button
											size="sm"
											className={cn(
												"w-full justify-start h-10 font-medium shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105",
												action.color
											)}
											style={{
												animationDelay: `${(index + menuItems.length) * 0.1}s`,
											}}>
											<action.icon className="h-4 w-4 mr-2" />
											{action.title}
										</Button>
									</Link>
								))}
							</div>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			<SidebarFooter className="p-4 border-t border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton className="h-12 px-3 hover:bg-sidebar-accent/50 transition-colors">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm">
										{user.name.charAt(0).toUpperCase()}
									</div>
									<div className="flex-1 text-left">
										<p className="text-sm font-medium truncate">{user.name}</p>
										<Badge
											className={cn(
												"text-xs font-medium",
												getRoleBadgeColor(user.role)
											)}>
											{getRoleDisplay(user.role)}
										</Badge>
									</div>
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side="top"
								className="w-[--radix-popper-anchor-width] glass">
								<DropdownMenuItem className="cursor-pointer">
									<UserIcon className="h-4 w-4 mr-2" />
									Profile Settings
								</DropdownMenuItem>
								<DropdownMenuItem className="cursor-pointer">
									<Settings className="h-4 w-4 mr-2" />
									Preferences
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={onLogout}
									className="cursor-pointer text-destructive focus:text-destructive">
									<LogOut className="h-4 w-4 mr-2" />
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

// "use client";

// import {
// 	Sidebar,
// 	SidebarContent,
// 	SidebarFooter,
// 	SidebarGroup,
// 	SidebarGroupContent,
// 	SidebarGroupLabel,
// 	SidebarHeader,
// 	SidebarMenu,
// 	SidebarMenuButton,
// 	SidebarMenuItem,
// 	SidebarRail,
// } from "@/components/ui/sidebar";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// 	DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
// 	Home,
// 	AlertTriangle,
// 	Building,
// 	Users,
// 	Settings,
// 	Shield,
// 	FileText,
// 	BarChart3,
// 	Plus,
// 	UserPlus,
// 	ChevronDown,
// 	LogOut,
// 	UserIcon,
// } from "lucide-react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useAuth } from "@/contexts/auth-context";

// interface User {
// 	role: string;
// 	name: string;
// 	id: string;
// 	managedBy?: any;
// 	operatorType?: string;
// }

// interface AppSidebarProps {
// 	user: User;
// }

// export function AppSidebar({ user }: AppSidebarProps) {
// 	const pathname = usePathname();
// 	const { logout } = useAuth();

// 	const getMenuItems = () => {
// 		const baseItems = [
// 			{
// 				title: "Dashboard",
// 				url: "/dashboard",
// 				icon: Home,
// 			},
// 		];

// 		switch (user.role) {
// 			case "SUPER_ADMIN":
// 				return [
// 					...baseItems,
// 					{
// 						title: "User Management",
// 						url: "/dashboard/users",
// 						icon: Users,
// 					},
// 					{
// 						title: "Company Management",
// 						url: "/dashboard/companies",
// 						icon: Building,
// 					},
// 					{
// 						title: "System Analytics",
// 						url: "/dashboard/analytics",
// 						icon: BarChart3,
// 					},
// 					// {
// 					// 	title: "Settings",
// 					// 	url: "/dashboard/settings",
// 					// 	icon: Settings,
// 					// },
// 				];

// 			case "OFFICE_MANAGER":
// 				return [
// 					...baseItems,
// 					{
// 						title: "Alarms",
// 						url: "/dashboard/alarms",
// 						icon: AlertTriangle,
// 					},
// 					{
// 						title: "Branches",
// 						url: "/dashboard/branches",
// 						icon: Building,
// 					},
// 					{
// 						title: "Operators",
// 						url: "/dashboard/operators",
// 						icon: Users,
// 					},
// 					{
// 						title: "Reports",
// 						url: "/dashboard/reports",
// 						icon: FileText,
// 					},
// 					// {
// 					// 	title: "Settings",
// 					// 	url: "/dashboard/settings",
// 					// 	icon: Settings,
// 					// },
// 				];

// 			case "POLICE_MANAGER":
// 				return [
// 					...baseItems,
// 					{
// 						title: "Alarm Reports",
// 						url: "/dashboard/alarm-reports",
// 						icon: AlertTriangle,
// 					},
// 					{
// 						title: "Officers",
// 						url: "/dashboard/officers",
// 						icon: Shield,
// 					},
// 					{
// 						title: "Analytics",
// 						url: "/dashboard/analytics",
// 						icon: BarChart3,
// 					},
// 					// {
// 					// 	title: "Cases",
// 					// 	url: "/dashboard/cases",
// 					// 	icon: FileText,
// 					// },
// 					// {
// 					// 	title: "Settings",
// 					// 	url: "/dashboard/settings",
// 					// 	icon: Settings,
// 					// },
// 				];

// 			case "OPERATOR":
// 				if (user.operatorType === "OFFICE") {
// 					return [
// 						...baseItems,
// 						{
// 							title: "Alarms",
// 							url: "/dashboard/alarms",
// 							icon: AlertTriangle,
// 						},
// 						{
// 							title: "Tasks",
// 							url: "/dashboard/tasks",
// 							icon: FileText,
// 						},
// 						{
// 							title: "Profile",
// 							url: "/dashboard/profile",
// 							icon: UserIcon,
// 						},
// 					];
// 				} else {
// 					return [
// 						...baseItems,
// 						{
// 							title: "Reports",
// 							url: "/dashboard/reports",
// 							icon: AlertTriangle,
// 						},
// 						{
// 							title: "Cases",
// 							url: "/dashboard/cases",
// 							icon: FileText,
// 						},
// 						{
// 							title: "Evidence",
// 							url: "/dashboard/evidence",
// 							icon: Shield,
// 						},
// 						{
// 							title: "Profile",
// 							url: "/dashboard/profile",
// 							icon: UserIcon,
// 						},
// 					];
// 				}

// 			default:
// 				return baseItems;
// 		}
// 	};

// 	const getQuickActions = () => {
// 		switch (user.role) {
// 			case "OFFICE_MANAGER":
// 				return [
// 					{
// 						title: "New Alarm",
// 						url: "/dashboard/configure-alarm",
// 						icon: AlertTriangle,
// 						color: "bg-red-600 hover:bg-red-700",
// 					},
// 					{
// 						title: "Add Branch",
// 						url: "/dashboard/add-branch",
// 						icon: Plus,
// 						color: "bg-blue-600 hover:bg-blue-700",
// 					},
// 				];
// 			case "SUPER_ADMIN":
// 				return [
// 					{
// 						title: "Add User",
// 						url: "/dashboard/add-user",
// 						icon: UserPlus,
// 						color: "bg-blue-600 hover:bg-blue-700",
// 					},
// 				];
// 			case "POLICE_MANAGER":
// 				return [
// 					{
// 						title: "New Case",
// 						url: "/dashboard/new-case",
// 						icon: Plus,
// 						color: "bg-green-600 hover:bg-green-700",
// 					},
// 				];
// 			default:
// 				return [];
// 		}
// 	};

// 	const getRoleDisplay = (role: string) => {
// 		switch (role) {
// 			case "SUPER_ADMIN":
// 				return "Super Administrator";
// 			case "OFFICE_MANAGER":
// 				return "Office Manager";
// 			case "POLICE_MANAGER":
// 				return "Police Manager";
// 			case "OPERATOR":
// 				return "Security Operator";
// 			default:
// 				return role;
// 		}
// 	};

// 	const getRoleBadgeColor = (role: string) => {
// 		switch (role) {
// 			case "SUPER_ADMIN":
// 				return "bg-red-100 text-red-800";
// 			case "OFFICE_MANAGER":
// 				return "bg-blue-100 text-blue-800";
// 			case "POLICE_MANAGER":
// 				return "bg-green-100 text-green-800";
// 			case "OPERATOR":
// 				return "bg-gray-100 text-gray-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	const menuItems = getMenuItems();
// 	const quickActions = getQuickActions();

// 	return (
// 		<Sidebar>
// 			<SidebarHeader>
// 				<div className="flex items-center space-x-2 px-2 py-2">
// 					<Shield className="h-8 w-8 text-blue-600" />
// 					<div>
// 						<img src="/logo-shield.png" alt="" />
// 						{/* <h2 className="text-lg font-semibold">Koppa</h2>
// 						<p className="text-xs text-muted-foreground">Security System</p> */}
// 					</div>
// 				</div>
// 			</SidebarHeader>

// 			<SidebarContent>
// 				<SidebarGroup>
// 					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
// 					<SidebarGroupContent>
// 						<SidebarMenu>
// 							{menuItems.map((item) => (
// 								<SidebarMenuItem key={item.title}>
// 									<SidebarMenuButton asChild isActive={pathname === item.url}>
// 										<Link href={item.url}>
// 											<item.icon className="h-4 w-4" />
// 											<span>{item.title}</span>
// 										</Link>
// 									</SidebarMenuButton>
// 								</SidebarMenuItem>
// 							))}
// 						</SidebarMenu>
// 					</SidebarGroupContent>
// 				</SidebarGroup>

// 				{quickActions.length > 0 && (
// 					<SidebarGroup>
// 						<SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
// 						<SidebarGroupContent>
// 							<div className="space-y-2 px-2">
// 								{quickActions.map((action) => (
// 									<Link key={action.title} href={action.url}>
// 										<Button
// 											size="sm"
// 											className={`w-full justify-start ${action.color}`}>
// 											<action.icon className="h-4 w-4 mr-2" />
// 											{action.title}
// 										</Button>
// 									</Link>
// 								))}
// 							</div>
// 						</SidebarGroupContent>
// 					</SidebarGroup>
// 				)}
// 			</SidebarContent>

// 			<SidebarFooter>
// 				<SidebarMenu>
// 					<SidebarMenuItem>
// 						<DropdownMenu>
// 							<DropdownMenuTrigger asChild>
// 								<SidebarMenuButton>
// 									<UserIcon className="h-4 w-4" />
// 									<div className="flex-1 text-left">
// 										<p className="text-sm font-medium">{user.name}</p>
// 										<Badge
// 											className={`text-xs ${getRoleBadgeColor(user.role)}`}>
// 											{getRoleDisplay(user.role)}
// 										</Badge>
// 									</div>
// 									<ChevronDown className="h-4 w-4" />
// 								</SidebarMenuButton>
// 							</DropdownMenuTrigger>
// 							<DropdownMenuContent
// 								side="top"
// 								className="w-[--radix-popper-anchor-width]">
// 								<DropdownMenuItem>
// 									<UserIcon className="h-4 w-4 mr-2" />
// 									Profile Settings
// 								</DropdownMenuItem>
// 								<DropdownMenuItem>
// 									<Settings className="h-4 w-4 mr-2" />
// 									Preferences
// 								</DropdownMenuItem>
// 								<DropdownMenuItem onClick={logout}>
// 									<LogOut className="h-4 w-4 mr-2" />
// 									Sign Out
// 								</DropdownMenuItem>
// 							</DropdownMenuContent>
// 						</DropdownMenu>
// 					</SidebarMenuItem>
// 				</SidebarMenu>
// 			</SidebarFooter>
// 			<SidebarRail />
// 		</Sidebar>
// 	);
// }
