"use client";

import { useState } from "react";
// import { DashboardLayout } from "@/components/dashboard-layout";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
	User,
	Shield,
	Settings,
	Bell,
	Lock,
	Camera,
	Save,
	Eye,
	EyeOff,
	CheckCircle,
	AlertCircle,
	Building,
	Users,
	Activity,
	Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

// Mock user data
const mockUser = {
	role: "OFFICE_MANAGER",
	name: "Office Manager",
	id: "1",
	operatorType: "OFFICE",
};

const mockLogout = () => {
	console.log("Logout clicked");
};

interface ProfileData {
	personalInfo: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		address: string;
		dateOfBirth: string;
		emergencyContact: string;
		emergencyPhone: string;
	};
	workInfo: {
		employeeId: string;
		department: string;
		position: string;
		startDate: string;
		supervisor: string;
		workLocation: string;
		shift: string;
	};
	preferences: {
		emailNotifications: boolean;
		smsNotifications: boolean;
		pushNotifications: boolean;
		darkMode: boolean;
		language: string;
		timezone: string;
	};
	security: {
		twoFactorEnabled: boolean;
		lastPasswordChange: string;
		loginSessions: number;
		securityQuestions: boolean;
	};
}

export default function ProfilePage() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	const [profileData, setProfileData] = useState<ProfileData>({
		personalInfo: {
			firstName: "Office",
			lastName: "manager",
			email: "office.manager@koppa.com",
			phone: "+251 9-123-4567",
			address: "Bole Atlas",
			dateOfBirth: "1985-06-15",
			emergencyContact: "Office Manager",
			emergencyPhone: "+251 9-123-4567",
		},
		workInfo: {
			employeeId: "EMP-001",
			department: "Security Operations",
			position: "Office Manager",
			startDate: "2020-01-15",
			supervisor: "User Gutema",
			workLocation: "Main Office",
			shift: "Day Shift (8:00 AM - 6:00 PM)",
		},
		preferences: {
			emailNotifications: true,
			smsNotifications: true,
			pushNotifications: false,
			darkMode: true,
			language: "English",
			timezone: "UTC-5 (Eastern Time)",
		},
		security: {
			twoFactorEnabled: true,
			lastPasswordChange: "2024-01-15",
			loginSessions: 3,
			securityQuestions: true,
		},
	});

	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const handleSaveProfile = async () => {
		setSaving(true);
		setErrorMessage("");
		setSuccessMessage("");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));
			setSuccessMessage("Profile updated successfully!");
			setTimeout(() => setSuccessMessage(""), 3000);
		} catch (error) {
			setErrorMessage("Failed to update profile. Please try again.");
			setTimeout(() => setErrorMessage(""), 3000);
		} finally {
			setSaving(false);
		}
	};

	const handleChangePassword = async () => {
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setErrorMessage("New passwords do not match.");
			setTimeout(() => setErrorMessage(""), 3000);
			return;
		}

		setSaving(true);
		setErrorMessage("");
		setSuccessMessage("");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));
			setSuccessMessage("Password changed successfully!");
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			setTimeout(() => setSuccessMessage(""), 3000);
		} catch (error) {
			setErrorMessage("Failed to change password. Please try again.");
			setTimeout(() => setErrorMessage(""), 3000);
		} finally {
			setSaving(false);
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

	const getStatsForRole = () => {
		switch (user?.role) {
			case "SUPER_ADMIN":
				return [
					{
						label: "Total Users",
						value: "156",
						icon: Users,
						color: "text-blue-600",
					},
					{
						label: "Active Systems",
						value: "24",
						icon: Activity,
						color: "text-green-600",
					},
					{
						label: "Uptime",
						value: "99.9%",
						icon: CheckCircle,
						color: "text-emerald-600",
					},
					{
						label: "Last Login",
						value: "2 hours ago",
						icon: Clock,
						color: "text-purple-600",
					},
				];
			case "OFFICE_MANAGER":
				return [
					{
						label: "Managed Branches",
						value: "8",
						icon: Building,
						color: "text-blue-600",
					},
					{
						label: "Active Operators",
						value: "24",
						icon: Users,
						color: "text-green-600",
					},
					{
						label: "Alarms Today",
						value: "12",
						icon: AlertCircle,
						color: "text-red-600",
					},
					{
						label: "Response Rate",
						value: "98%",
						icon: CheckCircle,
						color: "text-emerald-600",
					},
				];
			case "POLICE_MANAGER":
				return [
					{
						label: "Officers on Duty",
						value: "18",
						icon: Shield,
						color: "text-blue-600",
					},
					{
						label: "Cases Resolved",
						value: "45",
						icon: CheckCircle,
						color: "text-green-600",
					},
					{
						label: "Pending Reports",
						value: "3",
						icon: AlertCircle,
						color: "text-orange-600",
					},
					{
						label: "Avg Response",
						value: "4.2m",
						icon: Clock,
						color: "text-purple-600",
					},
				];
			default:
				return [
					{
						label: "Tasks Assigned",
						value: "8",
						icon: Activity,
						color: "text-blue-600",
					},
					{
						label: "Completed",
						value: "6",
						icon: CheckCircle,
						color: "text-green-600",
					},
					{
						label: "Pending",
						value: "2",
						icon: Clock,
						color: "text-orange-600",
					},
					{
						label: "Success Rate",
						value: "95%",
						icon: Shield,
						color: "text-purple-600",
					},
				];
		}
	};

	const stats = getStatsForRole();

	return (
		// <DashboardLayout user={mockUser} onLogout={mockLogout}>
		<div className="space-y-8 animate-fade-in">
			{/* Header */}
			<div className="animate-slide-up">
				<div className="flex items-center gap-4 mb-4">
					<div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
						<User className="h-8 w-8 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
							Profile Settings
						</h1>
						<p className="text-muted-foreground text-lg mt-1">
							Manage your account information and preferences
						</p>
					</div>
				</div>
			</div>

			{/* Success/Error Messages */}
			{successMessage && (
				<Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20 animate-slide-up">
					<CheckCircle className="h-4 w-4 text-green-600" />
					<AlertDescription className="text-green-800 dark:text-green-200">
						{successMessage}
					</AlertDescription>
				</Alert>
			)}

			{errorMessage && (
				<Alert variant="destructive" className="animate-shake">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			<div className="grid gap-8 lg:grid-cols-4">
				{/* Profile Overview */}
				<Card className="lg:col-span-1 glass border-blue-500/20 animate-slide-up">
					<CardHeader className="text-center pb-6">
						<div className="relative mx-auto mb-4">
							<Avatar className="h-24 w-24 border-4 border-white shadow-xl">
								<AvatarImage
									src="/placeholder-avatar.jpg"
									alt={profileData.personalInfo.firstName}
								/>
								<AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
									{profileData.personalInfo.firstName.charAt(0)}
									{profileData.personalInfo.lastName.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<Button
								size="sm"
								className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg">
								<Camera className="h-4 w-4" />
							</Button>
						</div>
						<CardTitle className="text-xl">
							{profileData.personalInfo.firstName}{" "}
							{profileData.personalInfo.lastName}
						</CardTitle>
						<CardDescription className="text-base">
							{profileData.personalInfo.email}
						</CardDescription>
						<Badge
							className={cn(
								"mt-2 font-medium",
								getRoleBadgeColor(user?.role || "")
							)}>
							{getRoleDisplay(user?.role || "")}
						</Badge>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								{stats.map((stat, index) => (
									<div
										key={stat.label}
										className="text-center p-3 rounded-xl bg-muted/50">
										<stat.icon
											className={cn("h-5 w-5 mx-auto mb-1", stat.color)}
										/>
										<p className="text-xs font-medium text-muted-foreground">
											{stat.label}
										</p>
										<p className="text-sm font-bold">{stat.value}</p>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Main Content */}
				<div className="lg:col-span-3 space-y-6">
					<Tabs
						defaultValue="personal"
						className="animate-slide-up"
						style={{ animationDelay: "0.1s" }}>
						<TabsList className="grid w-full grid-cols-4 h-12">
							<TabsTrigger value="personal" className="flex items-center gap-2">
								<User className="h-4 w-4" />
								Personal
							</TabsTrigger>
							<TabsTrigger value="work" className="flex items-center gap-2">
								<Building className="h-4 w-4" />
								Work Info
							</TabsTrigger>
							<TabsTrigger
								value="preferences"
								className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Preferences
							</TabsTrigger>
							<TabsTrigger value="security" className="flex items-center gap-2">
								<Lock className="h-4 w-4" />
								Security
							</TabsTrigger>
						</TabsList>

						{/* Personal Information Tab */}
						<TabsContent value="personal" className="space-y-6">
							<Card className="glass border-green-500/20">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<User className="h-5 w-5" />
										Personal Information
									</CardTitle>
									<CardDescription>
										Update your personal details and contact information
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="firstName">First Name</Label>
											<Input
												id="firstName"
												value={profileData.personalInfo.firstName}
												onChange={(e) =>
													setProfileData({
														...profileData,
														personalInfo: {
															...profileData.personalInfo,
															firstName: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="lastName">Last Name</Label>
											<Input
												id="lastName"
												value={profileData.personalInfo.lastName}
												onChange={(e) =>
													setProfileData({
														...profileData,
														personalInfo: {
															...profileData.personalInfo,
															lastName: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">Email Address</Label>
											<Input
												id="email"
												type="email"
												value={profileData.personalInfo.email}
												onChange={(e) =>
													setProfileData({
														...profileData,
														personalInfo: {
															...profileData.personalInfo,
															email: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="phone">Phone Number</Label>
											<Input
												id="phone"
												value={profileData.personalInfo.phone}
												onChange={(e) =>
													setProfileData({
														...profileData,
														personalInfo: {
															...profileData.personalInfo,
															phone: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="address">Address</Label>
											<Textarea
												id="address"
												value={profileData.personalInfo.address}
												onChange={(e) =>
													setProfileData({
														...profileData,
														personalInfo: {
															...profileData.personalInfo,
															address: e.target.value,
														},
													})
												}
												className="min-h-[80px]"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="dateOfBirth">Date of Birth</Label>
											<Input
												id="dateOfBirth"
												type="date"
												value={profileData.personalInfo.dateOfBirth}
												onChange={(e) =>
													setProfileData({
														...profileData,
														personalInfo: {
															...profileData.personalInfo,
															dateOfBirth: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="emergencyContact">
												Emergency Contact
											</Label>
											<Input
												id="emergencyContact"
												value={profileData.personalInfo.emergencyContact}
												onChange={(e) =>
													setProfileData({
														...profileData,
														personalInfo: {
															...profileData.personalInfo,
															emergencyContact: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
									</div>
									<Button
										onClick={handleSaveProfile}
										disabled={saving}
										className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-11 px-8">
										{saving ? (
											<>
												<Activity className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Work Information Tab */}
						<TabsContent value="work" className="space-y-6">
							<Card className="glass border-blue-500/20">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Building className="h-5 w-5" />
										Work Information
									</CardTitle>
									<CardDescription>
										Your employment details and work-related information
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="employeeId">Employee ID</Label>
											<Input
												id="employeeId"
												value={profileData.workInfo.employeeId}
												disabled
												className="h-11 bg-muted/50"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="department">Department</Label>
											<Input
												id="department"
												value={profileData.workInfo.department}
												disabled
												className="h-11 bg-muted/50"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="position">Position</Label>
											<Input
												id="position"
												value={profileData.workInfo.position}
												disabled
												className="h-11 bg-muted/50"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="startDate">Start Date</Label>
											<Input
												id="startDate"
												value={profileData.workInfo.startDate}
												disabled
												className="h-11 bg-muted/50"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="supervisor">Supervisor</Label>
											<Input
												id="supervisor"
												value={profileData.workInfo.supervisor}
												disabled
												className="h-11 bg-muted/50"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="workLocation">Work Location</Label>
											<Input
												id="workLocation"
												value={profileData.workInfo.workLocation}
												onChange={(e) =>
													setProfileData({
														...profileData,
														workInfo: {
															...profileData.workInfo,
															workLocation: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="shift">Work Shift</Label>
											<Input
												id="shift"
												value={profileData.workInfo.shift}
												onChange={(e) =>
													setProfileData({
														...profileData,
														workInfo: {
															...profileData.workInfo,
															shift: e.target.value,
														},
													})
												}
												className="h-11"
											/>
										</div>
									</div>
									<Button
										onClick={handleSaveProfile}
										disabled={saving}
										className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-11 px-8">
										{saving ? (
											<>
												<Activity className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Preferences Tab */}
						<TabsContent value="preferences" className="space-y-6">
							<Card className="glass border-purple-500/20">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Settings className="h-5 w-5" />
										Preferences
									</CardTitle>
									<CardDescription>
										Customize your application settings and notifications
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-8">
									<div className="space-y-6">
										<div>
											<h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
												<Bell className="h-5 w-5" />
												Notifications
											</h4>
											<div className="space-y-4">
												<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
													<div>
														<Label
															htmlFor="emailNotifications"
															className="text-base font-medium">
															Email Notifications
														</Label>
														<p className="text-sm text-muted-foreground">
															Receive alerts and updates via email
														</p>
													</div>
													<Switch
														id="emailNotifications"
														checked={profileData.preferences.emailNotifications}
														onCheckedChange={(checked) =>
															setProfileData({
																...profileData,
																preferences: {
																	...profileData.preferences,
																	emailNotifications: checked,
																},
															})
														}
													/>
												</div>
												<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
													<div>
														<Label
															htmlFor="smsNotifications"
															className="text-base font-medium">
															SMS Notifications
														</Label>
														<p className="text-sm text-muted-foreground">
															Receive critical alerts via SMS
														</p>
													</div>
													<Switch
														id="smsNotifications"
														checked={profileData.preferences.smsNotifications}
														onCheckedChange={(checked) =>
															setProfileData({
																...profileData,
																preferences: {
																	...profileData.preferences,
																	smsNotifications: checked,
																},
															})
														}
													/>
												</div>
												<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
													<div>
														<Label
															htmlFor="pushNotifications"
															className="text-base font-medium">
															Push Notifications
														</Label>
														<p className="text-sm text-muted-foreground">
															Browser push notifications
														</p>
													</div>
													<Switch
														id="pushNotifications"
														checked={profileData.preferences.pushNotifications}
														onCheckedChange={(checked) =>
															setProfileData({
																...profileData,
																preferences: {
																	...profileData.preferences,
																	pushNotifications: checked,
																},
															})
														}
													/>
												</div>
											</div>
										</div>

										<div>
											<h4 className="text-lg font-semibold mb-4">
												Display Settings
											</h4>
											<div className="space-y-4">
												<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
													<div>
														<Label
															htmlFor="darkMode"
															className="text-base font-medium">
															Dark Mode
														</Label>
														<p className="text-sm text-muted-foreground">
															Use dark theme for the interface
														</p>
													</div>
													<Switch
														id="darkMode"
														checked={profileData.preferences.darkMode}
														onCheckedChange={(checked) =>
															setProfileData({
																...profileData,
																preferences: {
																	...profileData.preferences,
																	darkMode: checked,
																},
															})
														}
													/>
												</div>
											</div>
										</div>
									</div>
									<Button
										onClick={handleSaveProfile}
										disabled={saving}
										className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 px-8">
										{saving ? (
											<>
												<Activity className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Preferences
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Security Tab */}
						<TabsContent value="security" className="space-y-6">
							<div className="grid gap-6">
								{/* Password Change */}
								<Card className="glass border-red-500/20">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Lock className="h-5 w-5" />
											Change Password
										</CardTitle>
										<CardDescription>
											Update your account password for enhanced security
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="currentPassword">
													Current Password
												</Label>
												<div className="relative">
													<Input
														id="currentPassword"
														type={showCurrentPassword ? "text" : "password"}
														value={passwordData.currentPassword}
														onChange={(e) =>
															setPasswordData({
																...passwordData,
																currentPassword: e.target.value,
															})
														}
														className="h-11 pr-12"
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="absolute right-0 top-0 h-11 px-3"
														onClick={() =>
															setShowCurrentPassword(!showCurrentPassword)
														}>
														{showCurrentPassword ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</Button>
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="newPassword">New Password</Label>
												<div className="relative">
													<Input
														id="newPassword"
														type={showNewPassword ? "text" : "password"}
														value={passwordData.newPassword}
														onChange={(e) =>
															setPasswordData({
																...passwordData,
																newPassword: e.target.value,
															})
														}
														className="h-11 pr-12"
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="absolute right-0 top-0 h-11 px-3"
														onClick={() =>
															setShowNewPassword(!showNewPassword)
														}>
														{showNewPassword ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</Button>
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="confirmPassword">
													Confirm New Password
												</Label>
												<div className="relative">
													<Input
														id="confirmPassword"
														type={showConfirmPassword ? "text" : "password"}
														value={passwordData.confirmPassword}
														onChange={(e) =>
															setPasswordData({
																...passwordData,
																confirmPassword: e.target.value,
															})
														}
														className="h-11 pr-12"
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="absolute right-0 top-0 h-11 px-3"
														onClick={() =>
															setShowConfirmPassword(!showConfirmPassword)
														}>
														{showConfirmPassword ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</Button>
												</div>
											</div>
										</div>
										<Button
											onClick={handleChangePassword}
											disabled={
												saving ||
												!passwordData.currentPassword ||
												!passwordData.newPassword ||
												!passwordData.confirmPassword
											}
											className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white h-11 px-8">
											{saving ? (
												<>
													<Activity className="h-4 w-4 mr-2 animate-spin" />
													Changing...
												</>
											) : (
												<>
													<Lock className="h-4 w-4 mr-2" />
													Change Password
												</>
											)}
										</Button>
									</CardContent>
								</Card>

								{/* Security Settings */}
								<Card className="glass border-orange-500/20">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Shield className="h-5 w-5" />
											Security Settings
										</CardTitle>
										<CardDescription>
											Manage your account security features
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
												<div>
													<Label className="text-base font-medium">
														Two-Factor Authentication
													</Label>
													<p className="text-sm text-muted-foreground">
														Add an extra layer of security to your account
													</p>
												</div>
												<Badge
													className={
														profileData.security.twoFactorEnabled
															? "bg-green-500"
															: "bg-gray-500"
													}>
													{profileData.security.twoFactorEnabled
														? "Enabled"
														: "Disabled"}
												</Badge>
											</div>
											<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
												<div>
													<Label className="text-base font-medium">
														Security Questions
													</Label>
													<p className="text-sm text-muted-foreground">
														Set up security questions for account recovery
													</p>
												</div>
												<Badge
													className={
														profileData.security.securityQuestions
															? "bg-green-500"
															: "bg-gray-500"
													}>
													{profileData.security.securityQuestions
														? "Set"
														: "Not Set"}
												</Badge>
											</div>
											<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
												<div>
													<Label className="text-base font-medium">
														Active Sessions
													</Label>
													<p className="text-sm text-muted-foreground">
														Number of active login sessions
													</p>
												</div>
												<Badge variant="outline">
													{profileData.security.loginSessions} Sessions
												</Badge>
											</div>
											<div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
												<div>
													<Label className="text-base font-medium">
														Last Password Change
													</Label>
													<p className="text-sm text-muted-foreground">
														When you last updated your password
													</p>
												</div>
												<Badge variant="outline">
													{profileData.security.lastPasswordChange}
												</Badge>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
		// </DashboardLayout>
	);
}
