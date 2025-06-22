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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	Bell,
	HelpCircle,
	Moon,
	Sun,
	Zap,
	Activity,
	MapPin,
	Calendar,
	Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AppSidebarProps {
	user: {
		role: string;
		name: string;
		id: string;
		managedBy?: any;
		operatorType?: string;
		avatar?: string;
		email?: string;
		lastActive?: string;
		company?: {
			logo: string;
			name: string;
		};
	};
	onLogout: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
	const pathname = usePathname();
	const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode as per CSS

	const getMenuItems = () => {
		const baseItems = [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: Home,
				description: "Overview & Analytics",
			},
		];

		switch (user.role) {
			case "SUPER_ADMIN":
				return [
					...baseItems,
					{
						title: "Companies",
						url: "/dashboard/companies",
						icon: Building,
						description: "Manage organizations",
					},
					{
						title: "Uses",
						url: "/dashboard/users",
						icon: Users,
						description: "Manage system users",
						badge: "Admin",
					},

					{
						title: "Alarms",
						url: "/dashboard/alarms",
						icon: AlertTriangle,
						description: "Security alerts",
						badge: "Live",
					},
					{
						title: "Analytics",
						url: "/dashboard/analytics",
						icon: BarChart3,
						description: "System insights",
					},
				];

			case "OFFICE_MANAGER":
				return [
					{
						title: "Alarms",
						url: "/dashboard/alarms",
						icon: AlertTriangle,
						description: "Security alerts",
						badge: "Live",
					},
					{
						title: "Locations",
						url: "/dashboard/locations",
						icon: Building,
						description: "Manage locations",
					},
					{
						title: "Operators",
						url: "/dashboard/operators",
						icon: Users,
						description: "Team management",
					},
					// {
					// 	title: "Reports",
					// 	url: "/dashboard/analytics",
					// 	icon: FileText,
					// 	description: "Analytics & reports",
					// },
					{
						title: "Profile",
						url: "/dashboard/profile",
						icon: UserIcon,
						description: "Account settings",
					},
				];

			case "POLICE_MANAGER":
				return [
					{
						title: "Alarm Reports",
						url: "/dashboard/alarm-reports",
						icon: AlertTriangle,
						description: "Emergency responses",
						badge: "Priority",
					},
					{
						title: "Operators",
						url: "/dashboard/police-operators",
						icon: Shield,
						description: "Police personnel",
					},
					{
						title: "Profile",
						url: "/dashboard/account-profile",
						icon: UserIcon,
						description: "Account settings",
					},
				];

			case "OPERATOR":
				if (user.operatorType === "OFFICE") {
					return [
						{
							title: "Alarms",
							url: "/dashboard/alarms",
							icon: AlertTriangle,
							description: "Active alerts",
							badge: "Live",
						},
						// {
						// 	title: "Tasks",
						// 	url: "/dashboard/tasks",
						// 	icon: FileText,
						// 	description: "Assigned tasks",
						// },

						{
							title: "Profile",
							url: "/dashboard/profile",
							icon: UserIcon,
							description: "Account settings",
						},
					];
				} else if (user.operatorType === "POLICE") {
					return [
						{
							title: "Alarms",
							url: "/dashboard/alarm-reports",
							icon: AlertTriangle,
							description: "Emergency calls",
							badge: "Priority",
						},
						{
							title: "Profile",
							url: "/dashboard/account-profile",
							icon: UserIcon,
							description: "Account settings",
						},
					];
				} else {
					return [
						...baseItems,
						{
							title: "Reports",
							url: "/dashboard/reports",
							icon: AlertTriangle,
							description: "Incident reports",
						},
						{
							title: "Profile",
							url: "/dashboard/profile",
							icon: UserIcon,
							description: "Account settings",
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
						description: "Create security alert",
					},
					{
						title: "Add Location",
						url: "/dashboard/add-location",
						icon: Plus,
						color:
							"bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
						description: "Register new site",
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
						description: "Create user account",
					},
					// {
					// 	title: "System Health",
					// 	url: "/dashboard/system",
					// 	icon: Activity,
					// 	color:
					// 		"bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
					// 	description: "Monitor system",
					// },
				];
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
				return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg";
			case "OFFICE_MANAGER":
				return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg";
			case "POLICE_MANAGER":
				return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg";
			case "OPERATOR":
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg";
			default:
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg";
		}
	};

	const getRoleIcon = (role: string) => {
		switch (role) {
			case "SUPER_ADMIN":
				return "";
			case "OFFICE_MANAGER":
				return "";
			case "POLICE_MANAGER":
				return "";
			case "OPERATOR":
				return "";
			default:
				return "";
		}
	};

	const menuItems = getMenuItems();
	const quickActions = getQuickActions();

	return (
		<Sidebar className="sidebar-enhanced">
			{/* Enhanced Header with Real Logo */}

			<SidebarHeader className="header-enhanced border-b border-sidebar-border">
				<div className="flex items-center justify-center py-5 mx-auto">
					<div className="flex items-center flex-col justify-center space-y-2 animate-fade-in">
						<div className="relative">
							<img
								src={
									user?.company?.logo
										? `http://8436insight.et:3003${user.company.logo.replace(
												"/var/www/html/koppa-security-api",
												""
										  )}`
										: "/logo-shield.png"
								}
								// 	`http://8436insight.et:3003${selectedAlarm.branch.company.logo.replace(
								// 		"/var/www/html/koppa-security-api",
								// 		""
								//   )}`

								alt={user?.company?.name || "Real-Time Response Link Logo"}
								className="w-20 h-20 object-contain"
							/>
							<div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-sidebar-background animate-pulse" />
						</div>
						<div>
							<h1 className="text-lg font-bold text-sidebar-foreground text-center">
								{user?.company?.name || "Real-Time Response Link"}
							</h1>
						</div>
					</div>
				</div>
			</SidebarHeader>

			{/* <SidebarHeader className="header-enhanced border-b border-sidebar-border">
				<div className="flex items-center justify-between py-5">
					<div className="flex items-center flex-col justify-center space-y-2 space-x-3 animate-fade-in">
						<div className="relative">
							<img
								src="/logo-shield.png"
								alt="Real-Time Response Link Logo"
								className="w-16 h-16 object-contain"
							/>
							<div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-sidebar-background animate-pulse" />
						</div>
						<div>
							<h1 className="text-lg font-bold text-sidebar-foreground">
								Real-Time Response Link
							</h1>
						</div>
					</div>
				</div>
			</SidebarHeader> */}

			<SidebarContent className="px-4 py-2">
				{/* Navigation Menu */}
				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2 flex items-center">
						<Home className="h-3 w-3 mr-2" />
						Navigation
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="">
							{menuItems.map((item, index) => (
								<SidebarMenuItem
									key={item.title}
									className="animate-slide-up"
									style={{ animationDelay: `${index * 0.05}s` }}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.url}
										className={cn(
											"sidebar-menu-item h-12 px-3 font-medium transition-all duration-300",
											pathname === item.url && "active"
										)}>
										<Link href={item.url} className="flex items-center w-full">
											<div
												className={cn(
													"w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300",
													pathname === item.url
														? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
														: "bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20"
												)}>
												<item.icon className="h-4 w-4" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<span className="font-medium text-sidebar-foreground">
														{item.title}
													</span>
												</div>
											</div>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Quick Actions */}
				{quickActions.length > 0 && (
					<SidebarGroup className="mt-6">
						<SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2 flex items-center">
							<Zap className="h-3 w-3 mr-2" />
							Quick Actions
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<div className="space-y-4">
								{quickActions.map((action, index) => (
									<Link key={action.title} href={action.url}>
										<Button
											size="sm"
											className={cn(
												"w-full justify-start h-11 mb-2 font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] rounded-xl",
												action.color
											)}
											style={{
												animationDelay: `${(index + menuItems.length) * 0.05}s`,
											}}>
											<div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center mr-3">
												<action.icon className="h-4 w-4" />
											</div>
											<div className="flex-1 text-left">
												<div className="font-medium">{action.title}</div>
											</div>
										</Button>
									</Link>
								))}
								<br />
							</div>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			{/* Enhanced Footer */}
			<SidebarFooter className="p-4 border-t border-sidebar-border glass">
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton className="h-14 px-3 hover:bg-sidebar-accent/50 transition-all duration-300 rounded-xl group">
									<div className="flex items-center space-x-3 w-full">
										<div className="relative">
											<Avatar className="h-10 w-10 ring-2 ring-sidebar-primary/20 transition-all duration-300 group-hover:ring-sidebar-primary/40">
												<AvatarImage
													src={user.avatar || "/placeholder.svg"}
													alt={user.name}
												/>
												<AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground font-semibold">
													{user.name.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-sidebar-background flex items-center justify-center">
												<div className="w-2 h-2 bg-white rounded-full" />
											</div>
										</div>
										<div className="flex-1 text-left min-w-0">
											<div className="flex items-center space-x-2">
												<p className="text-sm font-medium truncate text-sidebar-foreground">
													{user.name}
												</p>
												<span className="text-lg">
													{getRoleIcon(user.role)}
												</span>
											</div>
											<Badge
												className={cn(
													"text-xs font-medium mt-1",
													getRoleBadgeColor(user.role)
												)}>
												{getRoleDisplay(user.role)}
											</Badge>
											{user.email && (
												<p className="text-xs text-muted-foreground truncate mt-1">
													{user.email}
												</p>
											)}
										</div>
										<ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:rotate-180" />
									</div>
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side="top"
								className="w-64 glass border border-sidebar-border/50 shadow-2xl">
								<div className="p-3 border-b border-sidebar-border/50">
									<div className="flex items-center space-x-3">
										<Avatar className="h-8 w-8">
											<AvatarImage
												src={user.avatar || "/placeholder.svg"}
												alt={user.name}
											/>
											<AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground text-sm">
												{user.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate text-sidebar-foreground">
												{user.name}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{user.email || "No email"}
											</p>
										</div>
									</div>
								</div>

								<DropdownMenuItem className="cursor-pointer hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground">
									<UserIcon className="h-4 w-4 mr-3 text-blue-500" />
									<div>
										<p className="font-medium">Profile Settings</p>
										<p className="text-xs text-muted-foreground">
											Manage your account
										</p>
									</div>
								</DropdownMenuItem>

								<DropdownMenuItem className="cursor-pointer hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground">
									<Bell className="h-4 w-4 mr-3 text-orange-500" />
									<div>
										<p className="font-medium">Notifications</p>
										<p className="text-xs text-muted-foreground">
											Alert preferences
										</p>
									</div>
								</DropdownMenuItem>

								<DropdownMenuItem className="cursor-pointer hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground">
									<Settings className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
									<div>
										<p className="font-medium">Preferences</p>
										<p className="text-xs text-muted-foreground">
											App settings
										</p>
									</div>
								</DropdownMenuItem>

								<DropdownMenuItem
									className="cursor-pointer hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground"
									onClick={() => setIsDarkMode(!isDarkMode)}>
									{isDarkMode ? (
										<Sun className="h-4 w-4 mr-3 text-yellow-500" />
									) : (
										<Moon className="h-4 w-4 mr-3 text-purple-500" />
									)}
									<div>
										<p className="font-medium">
											{isDarkMode ? "Light Mode" : "Dark Mode"}
										</p>
										<p className="text-xs text-muted-foreground">
											Toggle theme
										</p>
									</div>
								</DropdownMenuItem>

								<DropdownMenuItem className="cursor-pointer hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground">
									<HelpCircle className="h-4 w-4 mr-3 text-green-500" />
									<div>
										<p className="font-medium">Help & Support</p>
										<p className="text-xs text-muted-foreground">
											Get assistance
										</p>
									</div>
								</DropdownMenuItem>

								<DropdownMenuSeparator className="bg-sidebar-border/50" />

								<DropdownMenuItem
									onClick={onLogout}
									className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-colors">
									<LogOut className="h-4 w-4 mr-3" />
									<div>
										<p className="font-medium">Sign Out</p>
										<p className="text-xs opacity-70">End your session</p>
									</div>
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
