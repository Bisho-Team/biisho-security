"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Shield,
	Lock,
	Users,
	Building,
	Loader2,
	Eye,
	EyeOff,
	Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { login, user } = useAuth();
	const router = useRouter();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await login(email, password);
			// router.push("/dashboard");
		} catch (error: any) {
			setError(error.message || "Login failed. Please check your credentials.");
		} finally {
			setLoading(false);
		}
	};

	const quickLogin = async (email: string, password = "password123") => {
		setEmail(email);
		setPassword(password);
		setError("");
		setLoading(true);

		try {
			await login(email, password);
		} catch (error: any) {
			setError(error.message || "Login failed. Please check your credentials.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -inset-10 opacity-50">
					<div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
					<div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
					<div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
				</div>
			</div>

			{/* Grid Pattern Overlay */}
			<div className='absolute inset-0 bg-[url(&apos;data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%239C92AC" fillOpacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&apos;)] opacity-40'></div>

			<div className="w-full max-w-md space-y-8 relative z-10">
				{/* Logo and Header */}
				<div className="text-center space-y-2 animate-fade-in">
					<div className="relative mx-auto w-72 h-48">
						{/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl rotate-6 animate-pulse"></div> */}
						{/* <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-4 shadow-2xl">
							<Shield className="h-12 w-12 text-white mx-auto" />
						</div> */}
						<img src="/logo-shield.png" className="h-48 w-72 " alt="" />
						<div className="absolute top-5 right-4 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-ping"></div>
					</div>
					<div className="space-y-2">
						{/* <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
							Koppa Security
						</h1> */}
						<p className="text-slate-300 text-lg font-medium">
							Advanced Security Management System
						</p>
						<div className="flex items-center justify-center gap-2 text-sm text-slate-400">
							<Sparkles className="h-4 w-4" />
							<span>Secure • Reliable • Professional</span>
							<Sparkles className="h-4 w-4" />
						</div>
					</div>
				</div>

				{/* Login Form */}
				<Card className="glass border-white/20 shadow-2xl backdrop-blur-xl animate-slide-up">
					<CardHeader className="text-center pb-6">
						<CardTitle className="flex items-center justify-center space-x-2 text-2xl">
							<Lock className="h-6 w-6 text-blue-400" />
							<span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
								System Access
							</span>
						</CardTitle>
						<CardDescription className="text-slate-300 text-base">
							Enter your credentials to access the security dashboard
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{error && (
							<Alert
								variant="destructive"
								className="border-red-500/50 bg-red-950/50 animate-shake">
								<AlertDescription className="text-red-200">
									{error}
								</AlertDescription>
							</Alert>
						)}

						<form onSubmit={handleLogin} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="email" className="text-slate-200 font-medium">
									Email Address
								</Label>
								<Input
									id="email"
									type="email"
									placeholder="Enter your email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading}
									className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12"
								/>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="password"
									className="text-slate-200 font-medium">
									Password
								</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="Enter your password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										disabled={loading}
										className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 pr-12"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-0 h-12 px-3 text-slate-400 hover:text-white"
										onClick={() => setShowPassword(!showPassword)}>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
							<Button
								type="submit"
								className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
								disabled={loading}>
								{loading ? (
									<>
										<Loader2 className="h-5 w-5 mr-2 animate-spin" />
										Authenticating...
									</>
								) : (
									<>
										<Lock className="h-5 w-5 mr-2" />
										Sign In Securely
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Quick Access Demo */}
				<Card
					className="glass border-white/20 shadow-2xl backdrop-blur-xl animate-slide-up"
					style={{ animationDelay: "0.2s" }}>
					<CardHeader className="pb-4">
						<CardTitle className="text-center text-lg text-white">
							Demo Access
						</CardTitle>
						<CardDescription className="text-center text-slate-300">
							Quick login for different user roles
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							variant="outline"
							size="lg"
							className="w-full justify-start h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 group"
							onClick={() => quickLogin("superadmin@koppa.com")}
							disabled={loading}>
							<div className="flex items-center justify-between w-full">
								<div className="flex items-center">
									<div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 mr-3 group-hover:scale-110 transition-transform">
										<Users className="h-4 w-4 text-white" />
									</div>
									<div className="text-left">
										<div className="font-semibold">Super Administrator</div>
										<div className="text-xs text-slate-400">
											Full system access
										</div>
									</div>
								</div>
								<div className="text-xs text-slate-400">
									superadmin@koppa.com
								</div>
							</div>
						</Button>
						<Button
							variant="outline"
							size="lg"
							className="w-full justify-start h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 group"
							onClick={() => quickLogin("office@koppa.com")}
							disabled={loading}>
							<div className="flex items-center justify-between w-full">
								<div className="flex items-center">
									<div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 mr-3 group-hover:scale-110 transition-transform">
										<Building className="h-4 w-4 text-white" />
									</div>
									<div className="text-left">
										<div className="font-semibold">Office Manager</div>
										<div className="text-xs text-slate-400">
											Branch & alarm management
										</div>
									</div>
								</div>
								<div className="text-xs text-slate-400">office@koppa.com</div>
							</div>
						</Button>
						<Button
							variant="outline"
							size="lg"
							className="w-full justify-start h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 group"
							onClick={() => quickLogin("police@koppa.com")}
							disabled={loading}>
							<div className="flex items-center justify-between w-full">
								<div className="flex items-center">
									<div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mr-3 group-hover:scale-110 transition-transform">
										<Shield className="h-4 w-4 text-white" />
									</div>
									<div className="text-left">
										<div className="font-semibold">Police Manager</div>
										<div className="text-xs text-slate-400">
											Law enforcement operations
										</div>
									</div>
								</div>
								<div className="text-xs text-slate-400">police@koppa.com</div>
							</div>
						</Button>
					</CardContent>
				</Card>

				{/* Footer */}
				<div
					className="text-center text-slate-400 text-sm animate-fade-in"
					style={{ animationDelay: "0.4s" }}>
					<p>© 2025 Koppa Security Systems. All rights reserved.</p>
					<p className="mt-1">Powered by advanced security technology</p>
				</div>
			</div>
		</div>
	);
}

// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Shield, Lock, Users, Building, Loader2 } from "lucide-react";
// import { useAuth } from "@/contexts/auth-context";

// export default function LoginPage() {
// 	const [email, setEmail] = useState("");
// 	const [password, setPassword] = useState("");
// 	const [error, setError] = useState("");
// 	const [loading, setLoading] = useState(false);
// 	const { login, user } = useAuth();
// 	const router = useRouter();

// 	const handleLogin = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		setError("");
// 		setLoading(true);

// 		try {
// 			const response = await login(email, password);
// 			// router.push("/dashboard");
// 		} catch (error: any) {
// 			setError(error.message || "Login failed. Please check your credentials.");
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const quickLogin = async (
// 		email: string,
// 		password: string = "password123"
// 	) => {
// 		setEmail(email);
// 		setPassword(password);
// 		setError("");
// 		setLoading(true);

// 		try {
// 			await login(email, password);
// 		} catch (error: any) {
// 			setError(error.message || "Login failed. Please check your credentials.");
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	return (
// 		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
// 			<div className="w-full max-w-md space-y-6">
// 				<div className="text-center space-y-2">
// 					<img src="/logo-shield.png" alt="" />
// 				</div>

// 				<Card>
// 					<CardHeader>
// 						<CardTitle className="flex items-center space-x-2">
// 							<Lock className="h-5 w-5" />
// 							<span>System Login</span>
// 						</CardTitle>
// 						<CardDescription>
// 							Access your security management dashboard
// 						</CardDescription>
// 					</CardHeader>
// 					<CardContent className="space-y-4">
// 						{error && (
// 							<Alert variant="destructive">
// 								<AlertDescription>{error}</AlertDescription>
// 							</Alert>
// 						)}

// 						<form onSubmit={handleLogin} className="space-y-4">
// 							<div className="space-y-2">
// 								<Label htmlFor="email">Email</Label>
// 								<Input
// 									id="email"
// 									type="email"
// 									placeholder="Enter your email"
// 									value={email}
// 									onChange={(e) => setEmail(e.target.value)}
// 									required
// 									disabled={loading}
// 								/>
// 							</div>
// 							<div className="space-y-2">
// 								<Label htmlFor="password">Password</Label>
// 								<Input
// 									id="password"
// 									type="password"
// 									placeholder="Enter your password"
// 									value={password}
// 									onChange={(e) => setPassword(e.target.value)}
// 									required
// 									disabled={loading}
// 								/>
// 							</div>
// 							<Button type="submit" className="w-full" disabled={loading}>
// 								{loading ? (
// 									<>
// 										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 										Signing In...
// 									</>
// 								) : (
// 									"Sign In"
// 								)}
// 							</Button>
// 						</form>
// 					</CardContent>
// 				</Card>

// 				<Card>
// 					{/* <CardHeader>
// 						<CardTitle className="text-sm">Demo Access</CardTitle>
// 						<CardDescription className="text-xs">
// 							Quick login for different roles
// 						</CardDescription>
// 					</CardHeader> */}
// 					<CardContent className="space-y-2">
// 						<Button
// 							variant="outline"
// 							size="sm"
// 							className="w-full justify-start"
// 							onClick={() => quickLogin("superadmin@koppa.com")}
// 							disabled={loading}>
// 							<Users className="h-4 w-4 mr-2" />
// 							Super Admin
// 						</Button>
// 						<Button
// 							variant="outline"
// 							size="sm"
// 							className="w-full justify-start"
// 							onClick={() => quickLogin("office@koppa.com")}
// 							disabled={loading}>
// 							<Building className="h-4 w-4 mr-2" />
// 							Office Manager
// 						</Button>
// 						<Button
// 							variant="outline"
// 							size="sm"
// 							className="w-full justify-start"
// 							onClick={() => quickLogin("police@koppa.com")}
// 							disabled={loading}>
// 							<Shield className="h-4 w-4 mr-2" />
// 							Police Manager
// 						</Button>
// 						{/* <Button
// 							variant="outline"
// 							size="sm"
// 							className="w-full justify-start"
// 							onClick={() => quickLogin("operator1@koppa.com")}
// 							disabled={loading}>
// 							<Lock className="h-4 w-4 mr-2" />
// 							Office Operator
// 						</Button> */}
// 					</CardContent>
// 				</Card>
// 			</div>
// 		</div>
// 	);
// }
