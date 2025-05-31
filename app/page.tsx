"use client";

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
import { Shield, Lock, Users, Building, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const router = useRouter();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await login(email, password);
			router.push("/dashboard");
		} catch (error: any) {
			setError(error.message || "Login failed. Please check your credentials.");
		} finally {
			setLoading(false);
		}
	};

	const quickLogin = async (
		email: string,
		password: string = "password123"
	) => {
		setEmail(email);
		setPassword(password);
		setError("");
		setLoading(true);

		try {
			await login(email, password);
			router.push("/dashboard");
		} catch (error: any) {
			setError(error.message || "Login failed. Please check your credentials.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center space-y-2">
					<div className="flex items-center justify-center space-x-2">
						<Shield className="h-8 w-8 text-blue-600" />
						<h1 className="text-3xl font-bold text-gray-900">Koppa</h1>
					</div>
					<p className="text-gray-600">Smart Security System</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Lock className="h-5 w-5" />
							<span>System Login</span>
						</CardTitle>
						<CardDescription>
							Access your security management dashboard
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={handleLogin} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={loading}
								/>
							</div>
							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Signing In...
									</>
								) : (
									"Sign In"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Demo Access</CardTitle>
						<CardDescription className="text-xs">
							Quick login for different roles
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
							onClick={() => quickLogin("superadmin@koppa.com")}
							disabled={loading}>
							<Users className="h-4 w-4 mr-2" />
							Super Admin
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
							onClick={() => quickLogin("office@koppa.com")}
							disabled={loading}>
							<Building className="h-4 w-4 mr-2" />
							Office Manager
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
							onClick={() => quickLogin("police@koppa.com")}
							disabled={loading}>
							<Shield className="h-4 w-4 mr-2" />
							Police Manager
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
							onClick={() => quickLogin("operator1@koppa.com")}
							disabled={loading}>
							<Lock className="h-4 w-4 mr-2" />
							Office Operator
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
