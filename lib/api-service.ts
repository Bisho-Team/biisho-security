const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
import { persistentNotificationService } from "./persistent-notification-service";

interface ApiResponse<T = any> {
	data: T;
	message?: string;
	error?: string;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface RequestConfig extends RequestInit {
	params?: Record<string, any>;
	responseType?: "json" | "blob";
}

class ApiService {
	private getAuthHeaders(): HeadersInit {
		const token = localStorage.getItem("authToken");
		return {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
		};
	}

	private buildUrl(endpoint: string, params?: Record<string, any>): string {
		const url = new URL(`${API_BASE_URL}${endpoint}`);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, value.toString());
				}
			});
		}

		return url.toString();
	}

	private async request<T = any>(
		endpoint: string,
		config: RequestConfig = {}
	): Promise<ApiResponse<T>> {
		const { params, responseType = "json", ...requestConfig } = config;
		const url = this.buildUrl(endpoint, params);

		const requestOptions: RequestInit = {
			headers: this.getAuthHeaders(),
			...requestConfig,
		};

		try {
			const response = await fetch(url, requestOptions);

			if (responseType === "blob") {
				const blob = await response.blob();
				return { data: blob as T };
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || data.message || `HTTP error! status: ${response.status}`
				);
			}

			return data;
		} catch (error) {
			console.error("API request failed:", error);
			throw error;
		}
	}

	// Generic HTTP methods
	async get<T = any>(
		endpoint: string,
		params?: Record<string, any>
	): Promise<ApiResponse<T>> {
		console.log(`GET request to ${endpoint} with params`, params);
		return this.request<T>(endpoint, { method: "GET", params });
	}

	async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		console.log(`POST request to ${endpoint} with data`, data);

		const isFormData = data instanceof FormData;

		return this.request<T>(endpoint, {
			method: "POST",
			headers: {
				...this.getAuthHeaders(),
				// ❗ Do NOT manually set Content-Type for FormData!
				...(isFormData ? {} : { "Content-Type": "application/json" }),
			},
			body: isFormData ? data : JSON.stringify(data),
		});
	}

	async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "PATCH",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: "DELETE" });
	}

	// Authentication methods
	async login(email: string, password: string) {
		const response = await this.post<{ token: string; user: any }>(
			"/auth/login",
			{
				email,
				password,
			}
		);

		if (response.data.token) {
			localStorage.setItem("authToken", response.data.token);
			localStorage.setItem("currentUser", JSON.stringify(response.data.user));
		}

		// Reinitialize notification service after login
		await persistentNotificationService.reinitializeAfterLogin();

		return response;
	}

	async logout() {
		try {
			await this.post("/auth/logout");
		} catch (error) {
			// Continue with logout even if API call fails
			console.warn("Logout API call failed:", error);
		} finally {
			localStorage.removeItem("authToken");
			localStorage.removeItem("currentUser");
		}
	}

	async refreshToken() {
		const response = await this.post<{ token: string }>("/auth/refresh");

		if (response.data.token) {
			localStorage.setItem("authToken", response.data.token);
		}

		return response;
	}

	// File upload method
	async uploadFile<T = any>(
		endpoint: string,
		file: File,
		additionalData?: Record<string, any>
	): Promise<ApiResponse<T>> {
		const formData = new FormData();
		formData.append("file", file);

		if (additionalData) {
			Object.entries(additionalData).forEach(([key, value]) => {
				formData.append(key, value.toString());
			});
		}

		const token = localStorage.getItem("authToken");
		const headers: HeadersInit = {
			...(token && { Authorization: `Bearer ${token}` }),
		};

		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: "POST",
			headers,
			body: formData,
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.error || data.message || `HTTP error! status: ${response.status}`
			);
		}

		return data;
	}

	// Download file method
	async downloadFile(endpoint: string, filename?: string): Promise<void> {
		const response = await this.request<Blob>(endpoint, {
			method: "GET",
			responseType: "blob",
		});

		const url = window.URL.createObjectURL(response.data);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", filename || "download");
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(url);
	}
}

export const apiService = new ApiService();

// Export for backward compatibility
// export const apiClient = apiService;
