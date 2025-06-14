const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

		return response;
	}

	async logout() {
		localStorage.removeItem("authToken");
		localStorage.removeItem("currentUser");
	}

	async getCurrentUser() {
		return this.request<any>("/auth/me");
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
}

export const apiClient = new ApiClient();
