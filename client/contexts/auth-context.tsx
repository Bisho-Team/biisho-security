"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
	id: string;
	email: string;
	name: string;
	role: string;
	status: string;
	companyId?: string;
	operatorType?: string;
	managedBy?: {
		id: string;
		name: string;
		email: string;
	};
	company?: {
		id: string;
		name: string;
	};
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<any>;
	logout: () => void;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const login = async (email: string, password: string) => {
		try {
			const { user } = await apiClient.login(email, password);
			console.log({ user });
			setUser(user);

			if (user.role === "OFFICE_MANAGER") {
				router.push("/dashboard/alarms");
			} else if (user.role === "POLICE_MANAGER") {
				router.push("/dashboard/alarm-reports");
			} else if (user.role === "OPERATOR" && user.operatorType === "POLICE") {
				router.push("/dashboard/alarm-reports");
			} else if (user.role === "OPERATOR" && user.operatorType === "OFFICE") {
				router.push("/dashboard/alarms");
			} else {
				router.push("/dashboard");
			}
		} catch (error) {
			throw error;
		}
	};

	const logout = () => {
		apiClient.logout();
		setUser(null);
	};

	const refreshUser = async () => {
		try {
			const userData = await apiClient.getCurrentUser();
			setUser(userData);
		} catch (error) {
			console.error("Failed to refresh user:", error);
			logout();
		}
	};

	useEffect(() => {
		const initAuth = async () => {
			const token = localStorage.getItem("authToken");
			const storedUser = localStorage.getItem("currentUser");

			if (token && storedUser) {
				try {
					// Verify token is still valid by fetching current user
					await refreshUser();
				} catch (error) {
					console.error("Token validation failed:", error);
					logout();
				}
			}

			setLoading(false);
		};

		initAuth();
	}, []);

	return (
		<AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
