const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiResponse<T> {
	data?: T;
	message?: string;
	error?: string;
	details?: any;
}
import { persistentNotificationService } from "./persistent-notification-service";

class ApiClient {
	private getAuthHeaders() {
		const token = localStorage.getItem("authToken");
		return {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
		};
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${API_BASE_URL}${endpoint}`;

		const config: RequestInit = {
			headers: this.getAuthHeaders(),
			...options,
		};

		try {
			const response = await fetch(url, config);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || `HTTP error! status: ${response.status}`);
			}

			return data;
		} catch (error) {
			console.error("API request failed:", error);
			throw error;
		}
	}

	// Authentication
	async login(email: string, password: string) {
		const response = await this.request<{ token: string; user: any }>(
			"/auth/login",
			{
				method: "POST",
				body: JSON.stringify({ email, password }),
			}
		);

		if (response.token) {
			localStorage.setItem("authToken", response.token);
			localStorage.setItem("currentUser", JSON.stringify(response.user));
		}

		// Reinitialize notification service after login
		await persistentNotificationService.reinitializeAfterLogin();

		return response;
	}

	async logout() {
		// Stop all sirens before logout
		persistentNotificationService.stopAllSirens();
		localStorage.removeItem("authToken");
		localStorage.removeItem("currentUser");
	}

	async getCurrentUser() {
		return this.request<any>("/auth/me");
	}

	// Users
	async getUsers(params?: {
		page?: number;
		limit?: number;
		role?: string;
		status?: string;
		search?: string;
	}) {
		const queryParams = new URLSearchParams();
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) queryParams.append(key, value.toString());
			});
		}
		return this.request<{ users: any[]; pagination: any }>(
			`/users?${queryParams}`
		);
	}

	async getMyOperators() {
		return this.request<any[]>("/users/my-operators");
	}

	async getPoliceManagerandOperator() {
		return this.request<any>(
			"/users/filtered?role=POLICE_MANAGER&page=1&limit=20"
		);
	}

	// async getPoliceManagerandOperator() {
	// 	return this.request<any>(
	// 		"/users/filtered?role=POLICE_MANAGER,OPERATOR&operatorType=POLICE&page=1&limit=20"
	// 	);
	// }

	async createUser(userData: any) {
		return this.request<{ user: any }>("/users", {
			method: "POST",
			body: JSON.stringify(userData),
		});
	}

	async updateUser(id: string, userData: any) {
		return this.request<{ user: any }>(`/users/${id}`, {
			method: "PUT",
			body: JSON.stringify(userData),
		});
	}

	async deleteUser(id: string) {
		return this.request<{ message: string }>(`/users/${id}`, {
			method: "DELETE",
		});
	}

	// Companies
	async getCompanies() {
		return this.request<any[]>("/companies");
	}

	async getCompany(id: string) {
		return this.request<any>(`/companies/${id}`);
	}

	async createCompany(companyData: any) {
		return this.request<{ company: any }>("/companies", {
			method: "POST",
			body: JSON.stringify(companyData),
		});
	}

	async updateCompany(id: string, companyData: any) {
		return this.request<{ company: any }>(`/companies/${id}`, {
			method: "PUT",
			body: JSON.stringify(companyData),
		});
	}

	async deleteCompany(id: string) {
		return this.request<{ message: string }>(`/companies/${id}`, {
			method: "DELETE",
		});
	}

	// Branches
	async getBranches() {
		return this.request<any[]>("/branches");
	}

	async getBranch(id: string) {
		return this.request<any>(`/branches/${id}`);
	}

	async createBranch(branchData: any) {
		return this.request<{ branch: any }>("/branches", {
			method: "POST",
			body: JSON.stringify(branchData),
		});
	}

	async updateBranch(id: string, branchData: any) {
		return this.request<{ branch: any }>(`/branches/${id}`, {
			method: "PUT",
			body: JSON.stringify(branchData),
		});
	}

	async deleteBranch(id: string) {
		return this.request<{ message: string }>(`/branches/${id}`, {
			method: "DELETE",
		});
	}

	// Alarms
	async getAlarms(params?: {
		status?: string;
		severity?: string;
		branchId?: string;
	}) {
		const queryParams = new URLSearchParams();
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) queryParams.append(key, value);
			});
		}
		return this.request<any[]>(`/alarms?${queryParams}`);
	}

	async getAlarm(id: string) {
		return this.request<any>(`/alarms/${id}`);
	}

	async createAlarm(alarmData: any) {
		return this.request<{ alarm: any }>("/alarms", {
			method: "POST",
			body: JSON.stringify(alarmData),
		});
	}

	async updateAlarm(id: string, alarmData: any) {
		return this.request<{ alarm: any }>(`/alarms/${id}`, {
			method: "PUT",
			body: JSON.stringify(alarmData),
		});
	}

	// Reports
	async getReports(params?: { status?: string }) {
		const queryParams = new URLSearchParams();
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) queryParams.append(key, value);
			});
		}
		return this.request<any[]>(`/reports?${queryParams}`);
	}

	async updateReport(id: string, reportData: any) {
		return this.request<{ report: any }>(`/reports/${id}`, {
			method: "PUT",
			body: JSON.stringify(reportData),
		});
	}

	// Analytics
	async getSystemAnalytics() {
		return this.request<any>("/analytics/system");
	}

	async getPoliceAnalytics() {
		return this.request<any>("/analytics/police");
	}

	async getOfficeAnalytics() {
		return this.request<any>("/analytics/office");
	}
}

export const apiClient = new ApiClient();
