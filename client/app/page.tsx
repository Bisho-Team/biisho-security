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
				<div className="text-center justify-center items-center space-y-2 animate-fade-in">
					<div className="relative mx-auto h-52 w-52">
						<img src="/logo-shield.png" className="h-52 w-52" alt="" />
					</div>
					<div className="space-y-2">
						<h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
							Real-Time Response Link
						</h1>
						{/* <p className="text-slate-300 text-lg font-medium">
							Advanced Security Management System
						</p>
						<div className="flex items-center justify-center gap-2 text-sm text-slate-400">
							<Sparkles className="h-4 w-4" />
							<span>Secure • Reliable • Available</span>
							<Sparkles className="h-4 w-4" />
						</div> */}
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
