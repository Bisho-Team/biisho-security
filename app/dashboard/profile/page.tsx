"use client";

import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	User,
	Lock,
	Save,
	Eye,
	EyeOff,
	CheckCircle,
	AlertCircle,
	Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface UserProfile {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	// Additional profile fields that can be updated
	dateOfBirth?: string;
	address?: string;
	emergencyContact?: string;
	emergencyPhone?: string;
}

interface ProfileUpdateData {
	name: string;
	dateOfBirth?: string;
	address?: string;
	emergencyContact?: string;
	emergencyPhone?: string;
}

interface PasswordChangeData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export default function ProfilePage() {
	const { user } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	const [profileData, setProfileData] = useState<ProfileUpdateData>({
		name: "",
		dateOfBirth: "",
		address: "",
		emergencyContact: "",
		emergencyPhone: "",
	});

	const [passwordData, setPasswordData] = useState<PasswordChangeData>({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// Fetch user profile on component mount
	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_URL}/profile`, {
				headers: {
					Authorization: `Bearer ${getAuthToken()}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch profile");
			}

			const data = await response.json();
			setProfile(data);
			setProfileData({
				name: data.name || "",
				dateOfBirth: data.dateOfBirth || "",
				address: data.address || "",
				emergencyContact: data.emergencyContact || "",
				emergencyPhone: data.emergencyPhone || "",
			});
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSaveProfile = async () => {
		setSaving(true);
		setErrorMessage("");
		setSuccessMessage("");

		try {
			const response = await fetch(`${API_URL}/profile`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${getAuthToken()}`,
				},
				body: JSON.stringify(profileData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update profile");
			}

			const updatedProfile = await response.json();
			setProfile(updatedProfile);
			setSuccessMessage("Profile updated successfully!");
			setTimeout(() => setSuccessMessage(""), 3000);
		} catch (error) {
			console.error("Error updating profile:", error);
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Failed to update profile. Please try again."
			);
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

		if (passwordData.newPassword.length < 8) {
			setErrorMessage("New password must be at least 8 characters long.");
			setTimeout(() => setErrorMessage(""), 3000);
			return;
		}

		setSaving(true);
		setErrorMessage("");
		setSuccessMessage("");

		try {
			const response = await fetch(
				`${API_URL}/profile/change-password`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${getAuthToken()}`,
					},
					body: JSON.stringify({
						currentPassword: passwordData.currentPassword,
						newPassword: passwordData.newPassword,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to change password");
			}

			setSuccessMessage("Password changed successfully!");
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			setTimeout(() => setSuccessMessage(""), 3000);
		} catch (error) {
			console.error("Error changing password:", error);
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Failed to change password. Please try again."
			);
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

	// Helper function to get auth token
	const getAuthToken = () => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("authToken") || "";
		}
		return "";
	};

	if (loading) {
		return (
			// <DashboardLayout user={mockUser} onLogout={mockLogout}>
			<div className="space-y-8">
				<div className="flex items-center gap-4">
					<div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
						<User className="h-8 w-8 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold tracking-tight">
							Profile Settings
						</h1>
						<p className="text-muted-foreground text-lg mt-1">
							Loading your profile information...
						</p>
					</div>
				</div>
				<div className="grid gap-8 lg:grid-cols-4">
					<Card className="lg:col-span-1">
						<CardContent className="p-6">
							<div className="animate-pulse space-y-4">
								<div className="h-24 w-24 bg-gray-200 rounded-full mx-auto"></div>
								<div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
								<div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
							</div>
						</CardContent>
					</Card>
					<div className="lg:col-span-3">
						<Card>
							<CardContent className="p-6">
								<div className="animate-pulse space-y-4">
									<div className="h-8 bg-gray-200 rounded w-1/4"></div>
									<div className="space-y-3">
										<div className="h-4 bg-gray-200 rounded"></div>
										<div className="h-4 bg-gray-200 rounded w-5/6"></div>
										<div className="h-4 bg-gray-200 rounded w-4/6"></div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			// </DashboardLayout>
		);
	}

	if (!profile) {
		return (
			// <DashboardLayout user={mockUser} onLogout={mockLogout}>
			<div className="space-y-8">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Failed to load profile information. Please try refreshing the page.
					</AlertDescription>
				</Alert>
			</div>
			// </DashboardLayout>
		);
	}

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
							Manage your personal information and security
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
								<AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
									{profile.name
										.split(" ")
										.map((n) => n.charAt(0))
										.join("")
										.toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</div>
						<CardTitle className="text-xl">{profile.name}</CardTitle>
						<CardDescription className="text-base">
							{profile.email}
						</CardDescription>
						<Badge
							className={cn(
								"mt-2 font-medium",
								getRoleBadgeColor(profile.role)
							)}>
							{getRoleDisplay(profile.role)}
						</Badge>
					</CardHeader>
					<CardContent>
						<div className="space-y-3 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Status:</span>
								<Badge
									variant={
										profile.status === "ACTIVE" ? "default" : "secondary"
									}>
									{profile.status}
								</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Member since:</span>
								<span>{new Date(profile.createdAt).toLocaleDateString()}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Last updated:</span>
								<span>{new Date(profile.updatedAt).toLocaleDateString()}</span>
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
						<TabsList className="grid w-full grid-cols-2 h-12">
							<TabsTrigger value="personal" className="flex items-center gap-2">
								<User className="h-4 w-4" />
								Personal Information
							</TabsTrigger>
							<TabsTrigger value="security" className="flex items-center gap-2">
								<Lock className="h-4 w-4" />
								Change Password
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
											<Label htmlFor="name">Full Name</Label>
											<Input
												id="name"
												value={profileData.name}
												onChange={(e) =>
													setProfileData({
														...profileData,
														name: e.target.value,
													})
												}
												className="h-11"
												placeholder="Enter your full name"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">Email Address</Label>
											<Input
												id="email"
												type="email"
												value={profile.email}
												disabled
												className="h-11 bg-muted/50 cursor-not-allowed"
												title="Email cannot be changed"
											/>
											<p className="text-xs text-muted-foreground">
												Email address cannot be modified
											</p>
										</div>
										{/* <div className="space-y-2">
											<Label htmlFor="dateOfBirth">Date of Birth</Label>
											<Input
												id="dateOfBirth"
												type="date"
												value={profileData.dateOfBirth}
												onChange={(e) =>
													setProfileData({
														...profileData,
														dateOfBirth: e.target.value,
													})
												}
												className="h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="emergencyPhone">Emergency Phone</Label>
											<Input
												id="emergencyPhone"
												type="tel"
												value={profileData.emergencyPhone}
												onChange={(e) =>
													setProfileData({
														...profileData,
														emergencyPhone: e.target.value,
													})
												}
												className="h-11"
												placeholder="+251911234567"
											/>
										</div> */}
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="address">Address</Label>
											<Textarea
												id="address"
												value={profileData.address}
												onChange={(e) =>
													setProfileData({
														...profileData,
														address: e.target.value,
													})
												}
												className="min-h-[80px]"
												placeholder="Enter your full address"
											/>
										</div>
										{/* <div className="space-y-2 md:col-span-2">
											<Label htmlFor="emergencyContact">
												Emergency Contact Name
											</Label>
											<Input
												id="emergencyContact"
												value={profileData.emergencyContact}
												onChange={(e) =>
													setProfileData({
														...profileData,
														emergencyContact: e.target.value,
													})
												}
												className="h-11"
												placeholder="Emergency contact person name"
											/>
										</div> */}
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

						{/* Security Tab */}
						<TabsContent value="security" className="space-y-6">
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
											<Label htmlFor="currentPassword">Current Password</Label>
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
													placeholder="Enter your current password"
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
													placeholder="Enter your new password"
												/>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="absolute right-0 top-0 h-11 px-3"
													onClick={() => setShowNewPassword(!showNewPassword)}>
													{showNewPassword ? (
														<EyeOff className="h-4 w-4" />
													) : (
														<Eye className="h-4 w-4" />
													)}
												</Button>
											</div>
											<p className="text-xs text-muted-foreground">
												Password must be at least 8 characters long
											</p>
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
													placeholder="Confirm your new password"
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
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
		// </DashboardLayout>
	);
}
