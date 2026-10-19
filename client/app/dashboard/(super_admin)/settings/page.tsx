"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
	Settings,
	Shield,
	Bell,
	Save,
	RefreshCw,
	CheckCircle,
	Loader2,
} from "lucide-react";

interface SystemSettings {
	general: {
		systemName: string;
		systemDescription: string;
		timezone: string;
		language: string;
		dateFormat: string;
		currency: string;
	};
	security: {
		sessionTimeout: number;
		maxLoginAttempts: number;
		passwordMinLength: number;
		requireTwoFactor: boolean;
		allowPasswordReset: boolean;
		ipWhitelist: string;
	};
	notifications: {
		emailNotifications: boolean;
		smsNotifications: boolean;
		pushNotifications: boolean;
		criticalAlertsOnly: boolean;
		notificationFrequency: string;
	};
	database: {
		backupFrequency: string;
		retentionPeriod: number;
		autoCleanup: boolean;
		compressionEnabled: boolean;
	};
	email: {
		smtpServer: string;
		smtpPort: number;
		smtpUsername: string;
		smtpPassword: string;
		fromEmail: string;
		fromName: string;
	};
	api: {
		rateLimit: number;
		apiTimeout: number;
		enableLogging: boolean;
		enableCaching: boolean;
	};
}

export default function SettingsPage() {
	const [settings, setSettings] = useState<SystemSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		fetchSettings();
	}, []);

	const fetchSettings = async () => {
		try {
			setLoading(true);
			const response = await apiClient.get("/settings");
			setSettings(response.data);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch system settings",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!settings) return;

		try {
			setSaving(true);
			await apiClient.put("/settings", settings);
			setLastSaved(new Date());
			toast({
				title: "Success",
				description: "Settings saved successfully",
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.message || "Failed to save settings",
				variant: "destructive",
			});
		} finally {
			setSaving(false);
		}
	};

	const handleReset = async () => {
		try {
			const response = await apiClient.get("/settings/defaults");
			setSettings(response.data);
			toast({
				title: "Success",
				description: "Settings reset to defaults",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to reset settings",
				variant: "destructive",
			});
		}
	};

	const testEmailConfiguration = async () => {
		try {
			await apiClient.post("/settings/test-email");
			toast({
				title: "Success",
				description: "Test email sent successfully",
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to send test email",
				variant: "destructive",
			});
		}
	};

	const exportDatabase = async () => {
		try {
			const response = await apiClient.get("/database/export", {
				responseType: "blob",
			});

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute(
				"download",
				`database-export-${new Date().toISOString().split("T")[0]}.sql`
			);
			document.body.appendChild(link);
			link.click();
			link.remove();

			toast({
				title: "Success",
				description: "Database exported successfully",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to export database",
				variant: "destructive",
			});
		}
	};

	const createBackup = async () => {
		try {
			await apiClient.post("/database/backup");
			toast({
				title: "Success",
				description: "Manual backup created successfully",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to create backup",
				variant: "destructive",
			});
		}
	};

	const updateGeneralSettings = (key: string, value: string) => {
		if (!settings) return;
		setSettings({
			...settings,
			general: { ...settings.general, [key]: value },
		});
	};

	const updateSecuritySettings = (key: string, value: any) => {
		if (!settings) return;
		setSettings({
			...settings,
			security: { ...settings.security, [key]: value },
		});
	};

	const updateNotificationSettings = (key: string, value: any) => {
		if (!settings) return;
		setSettings({
			...settings,
			notifications: { ...settings.notifications, [key]: value },
		});
	};

	const updateDatabaseSettings = (key: string, value: any) => {
		if (!settings) return;
		setSettings({
			...settings,
			database: { ...settings.database, [key]: value },
		});
	};

	const updateEmailSettings = (key: string, value: any) => {
		if (!settings) return;
		setSettings({
			...settings,
			email: { ...settings.email, [key]: value },
		});
	};

	const updateApiSettings = (key: string, value: any) => {
		if (!settings) return;
		setSettings({
			...settings,
			api: { ...settings.api, [key]: value },
		});
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96 mt-2" />
					</div>
					<div className="flex space-x-2">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-10 w-32" />
					</div>
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!settings) return null;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
					<p className="text-muted-foreground">
						Configure system-wide settings and preferences
					</p>
				</div>
				<div className="flex space-x-2">
					<Button variant="outline" onClick={handleReset}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Reset to Defaults
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</div>

			{lastSaved && (
				<div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
					<CheckCircle className="h-4 w-4" />
					<span>
						Settings saved successfully at {lastSaved.toLocaleTimeString()}
					</span>
				</div>
			)}

			<Tabs defaultValue="general" className="space-y-4">
				<TabsList className="grid w-full grid-cols-6">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="security">Security</TabsTrigger>
					<TabsTrigger value="notifications">Notifications</TabsTrigger>
					<TabsTrigger value="database">Database</TabsTrigger>
					<TabsTrigger value="email">Email</TabsTrigger>
					<TabsTrigger value="api">API</TabsTrigger>
				</TabsList>

				<TabsContent value="general" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Settings className="h-5 w-5" />
								<span>General Settings</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="systemName">System Name</Label>
									<Input
										id="systemName"
										value={settings.general.systemName}
										onChange={(e) =>
											updateGeneralSettings("systemName", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="timezone">Timezone</Label>
									<Select
										value={settings.general.timezone}
										onValueChange={(value) =>
											updateGeneralSettings("timezone", value)
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Africa/Addis_Ababa">
												Africa/Addis Ababa (EAT)
											</SelectItem>
											<SelectItem value="UTC">UTC</SelectItem>
											<SelectItem value="America/New_York">
												America/New York (EST)
											</SelectItem>
											<SelectItem value="Europe/London">
												Europe/London (GMT)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="systemDescription">System Description</Label>
								<Textarea
									id="systemDescription"
									value={settings.general.systemDescription}
									onChange={(e) =>
										updateGeneralSettings("systemDescription", e.target.value)
									}
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="language">Language</Label>
									<Select
										value={settings.general.language}
										onValueChange={(value) =>
											updateGeneralSettings("language", value)
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="en">English</SelectItem>
											<SelectItem value="am">Amharic</SelectItem>
											<SelectItem value="or">Oromo</SelectItem>
											<SelectItem value="ti">Tigrinya</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="dateFormat">Date Format</Label>
									<Select
										value={settings.general.dateFormat}
										onValueChange={(value) =>
											updateGeneralSettings("dateFormat", value)
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
											<SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
											<SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="currency">Currency</Label>
									<Select
										value={settings.general.currency}
										onValueChange={(value) =>
											updateGeneralSettings("currency", value)
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
											<SelectItem value="USD">US Dollar (USD)</SelectItem>
											<SelectItem value="EUR">Euro (EUR)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="security" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Shield className="h-5 w-5" />
								<span>Security Settings</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="sessionTimeout">
										Session Timeout (minutes)
									</Label>
									<Input
										id="sessionTimeout"
										type="number"
										value={settings.security.sessionTimeout}
										onChange={(e) =>
											updateSecuritySettings(
												"sessionTimeout",
												Number.parseInt(e.target.value)
											)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
									<Input
										id="maxLoginAttempts"
										type="number"
										value={settings.security.maxLoginAttempts}
										onChange={(e) =>
											updateSecuritySettings(
												"maxLoginAttempts",
												Number.parseInt(e.target.value)
											)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="passwordMinLength">Min Password Length</Label>
									<Input
										id="passwordMinLength"
										type="number"
										value={settings.security.passwordMinLength}
										onChange={(e) =>
											updateSecuritySettings(
												"passwordMinLength",
												Number.parseInt(e.target.value)
											)
										}
									/>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Require Two-Factor Authentication</Label>
										<p className="text-sm text-muted-foreground">
											Enforce 2FA for all users
										</p>
									</div>
									<Switch
										checked={settings.security.requireTwoFactor}
										onCheckedChange={(checked) =>
											updateSecuritySettings("requireTwoFactor", checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Allow Password Reset</Label>
										<p className="text-sm text-muted-foreground">
											Enable self-service password reset
										</p>
									</div>
									<Switch
										checked={settings.security.allowPasswordReset}
										onCheckedChange={(checked) =>
											updateSecuritySettings("allowPasswordReset", checked)
										}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="ipWhitelist">IP Whitelist</Label>
								<Textarea
									id="ipWhitelist"
									value={settings.security.ipWhitelist}
									onChange={(e) =>
										updateSecuritySettings("ipWhitelist", e.target.value)
									}
									placeholder="Enter IP addresses or ranges, one per line"
									rows={3}
								/>
								<p className="text-sm text-muted-foreground">
									Leave empty to allow all IPs
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="notifications" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Bell className="h-5 w-5" />
								<span>Notification Settings</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Email Notifications</Label>
										<p className="text-sm text-muted-foreground">
											Send notifications via email
										</p>
									</div>
									<Switch
										checked={settings.notifications.emailNotifications}
										onCheckedChange={(checked) =>
											updateNotificationSettings("emailNotifications", checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>SMS Notifications</Label>
										<p className="text-sm text-muted-foreground">
											Send notifications via SMS
										</p>
									</div>
									<Switch
										checked={settings.notifications.smsNotifications}
										onCheckedChange={(checked) =>
											updateNotificationSettings("smsNotifications", checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Push Notifications</Label>
										<p className="text-sm text-muted-foreground">
											Send browser push notifications
										</p>
									</div>
									<Switch
										checked={settings.notifications.pushNotifications}
										onCheckedChange={(checked) =>
											updateNotificationSettings("pushNotifications", checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Critical Alerts Only</Label>
										<p className="text-sm text-muted-foreground">
											Only send critical security alerts
										</p>
									</div>
									<Switch
										checked={settings.notifications.criticalAlertsOnly}
										onCheckedChange={(checked) =>
											updateNotificationSettings("criticalAlertsOnly", checked)
										}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="notificationFrequency">
									Notification Frequency
								</Label>
								<Select
									value={settings.notifications.notificationFrequency}
									onValueChange={(value) =>
										updateNotificationSettings("notificationFrequency", value)
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="immediate">Immediate</SelectItem>
										<SelectItem value="hourly">Hourly Digest</SelectItem>
										<SelectItem value="daily">Daily Digest</SelectItem>
										<SelectItem value="weekly">Weekly Digest</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="database" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Settings className="h-5 w-5" />
								<span>Database Settings</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="backupFrequency">Backup Frequency</Label>
									<Select
										value={settings.database.backupFrequency}
										onValueChange={(value) =>
											updateDatabaseSettings("backupFrequency", value)
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="hourly">Hourly</SelectItem>
											<SelectItem value="daily">Daily</SelectItem>
											<SelectItem value="weekly">Weekly</SelectItem>
											<SelectItem value="monthly">Monthly</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="retentionPeriod">
										Retention Period (days)
									</Label>
									<Input
										id="retentionPeriod"
										type="number"
										value={settings.database.retentionPeriod}
										onChange={(e) =>
											updateDatabaseSettings(
												"retentionPeriod",
												Number.parseInt(e.target.value)
											)
										}
									/>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Auto Cleanup</Label>
										<p className="text-sm text-muted-foreground">
											Automatically delete old records
										</p>
									</div>
									<Switch
										checked={settings.database.autoCleanup}
										onCheckedChange={(checked) =>
											updateDatabaseSettings("autoCleanup", checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Compression Enabled</Label>
										<p className="text-sm text-muted-foreground">
											Compress database backups
										</p>
									</div>
									<Switch
										checked={settings.database.compressionEnabled}
										onCheckedChange={(checked) =>
											updateDatabaseSettings("compressionEnabled", checked)
										}
									/>
								</div>
							</div>

							<div className="flex space-x-2 pt-4">
								<Button variant="outline" onClick={exportDatabase}>
									<Settings className="h-4 w-4 mr-2" />
									Export Database
								</Button>
								<Button variant="outline" onClick={createBackup}>
									<RefreshCw className="h-4 w-4 mr-2" />
									Manual Backup
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="email" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Settings className="h-5 w-5" />
								<span>Email Configuration</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="smtpServer">SMTP Server</Label>
									<Input
										id="smtpServer"
										value={settings.email.smtpServer}
										onChange={(e) =>
											updateEmailSettings("smtpServer", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="smtpPort">SMTP Port</Label>
									<Input
										id="smtpPort"
										type="number"
										value={settings.email.smtpPort}
										onChange={(e) =>
											updateEmailSettings(
												"smtpPort",
												Number.parseInt(e.target.value)
											)
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="smtpUsername">SMTP Username</Label>
									<Input
										id="smtpUsername"
										value={settings.email.smtpUsername}
										onChange={(e) =>
											updateEmailSettings("smtpUsername", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="smtpPassword">SMTP Password</Label>
									<Input
										id="smtpPassword"
										type="password"
										value={settings.email.smtpPassword}
										onChange={(e) =>
											updateEmailSettings("smtpPassword", e.target.value)
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="fromEmail">From Email</Label>
									<Input
										id="fromEmail"
										type="email"
										value={settings.email.fromEmail}
										onChange={(e) =>
											updateEmailSettings("fromEmail", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="fromName">From Name</Label>
									<Input
										id="fromName"
										value={settings.email.fromName}
										onChange={(e) =>
											updateEmailSettings("fromName", e.target.value)
										}
									/>
								</div>
							</div>

							<div className="flex space-x-2 pt-4">
								<Button variant="outline" onClick={testEmailConfiguration}>
									<Settings className="h-4 w-4 mr-2" />
									Test Email Configuration
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="api" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Settings className="h-5 w-5" />
								<span>API Configuration</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
									<Input
										id="rateLimit"
										type="number"
										value={settings.api.rateLimit}
										onChange={(e) =>
											updateApiSettings(
												"rateLimit",
												Number.parseInt(e.target.value)
											)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="apiTimeout">API Timeout (seconds)</Label>
									<Input
										id="apiTimeout"
										type="number"
										value={settings.api.apiTimeout}
										onChange={(e) =>
											updateApiSettings(
												"apiTimeout",
												Number.parseInt(e.target.value)
											)
										}
									/>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Enable API Logging</Label>
										<p className="text-sm text-muted-foreground">
											Log all API requests and responses
										</p>
									</div>
									<Switch
										checked={settings.api.enableLogging}
										onCheckedChange={(checked) =>
											updateApiSettings("enableLogging", checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Enable Caching</Label>
										<p className="text-sm text-muted-foreground">
											Cache API responses for better performance
										</p>
									</div>
									<Switch
										checked={settings.api.enableCaching}
										onCheckedChange={(checked) =>
											updateApiSettings("enableCaching", checked)
										}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
