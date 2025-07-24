const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

interface ReportFilters {
	dateFrom?: string;
	dateTo?: string;
	status?: string;
	severity?: string;
	branchId?: string;
	companyId?: string;
	period?: string;
	groupBy?: string;
}

interface AlarmStats {
	total: number;
	active: number;
	acknowledged: number;
	resolved: number;
	critical: number;
	high: number;
	medium: number;
	low: number;
	avgResponseTime: number;
	avgResolutionTime: number;
	resolutionRate: number;
}

interface PerformanceMetrics {
	performance: Array<{
		branchId: string;
		branchName: string;
		companyName: string;
		totalAlarms: number;
		resolvedAlarms: number;
		resolutionRate: number;
	}>;
}

interface TrendData {
	trends: Array<{
		date: string;
		total: number;
		active: number;
		acknowledged: number;
		resolved: number;
		critical: number;
		high: number;
		medium: number;
		low: number;
	}>;
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

		return response;
	}

	async logout() {
		try {
			await this.post("/auth/logout");
		} catch (error) {
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

	// ==================== ALARM METHODS ====================

	// Get all alarms with optional filters
	async getAlarms(filters?: ReportFilters) {
		return this.get<{ alarms: any[] }>("/alarms", filters);
	}

	// Get single alarm by ID
	async getAlarmById(id: string) {
		return this.get<{ alarm: any }>(`/alarms/${id}`);
	}

	// Update alarm status
	async updateAlarm(id: string, data: any) {
		return this.put<{ alarm: any }>(`/alarms/${id}`, data);
	}

	// Get current user info
	async getCurrentUser() {
		return this.get<any>("/auth/me");
	}
	// ==================== REPORTS METHODS ====================
	// Get comprehensive alarm statistics
	async getAlarmStats(
		filters?: ReportFilters
	): Promise<ApiResponse<{ stats: AlarmStats; trends: any }>> {
		return this.get<{ stats: AlarmStats; trends: any }>(
			"/reports/stats",
			filters
		);
	}

	// Get performance metrics by company/branch
	async getPerformanceMetrics(
		filters?: ReportFilters
	): Promise<ApiResponse<PerformanceMetrics>> {
		return this.get<PerformanceMetrics>("/reports/performance", filters);
	}

	// Get alarm trends over time
	async getAlarmTrends(
		filters?: ReportFilters
	): Promise<ApiResponse<TrendData>> {
		return this.get<TrendData>("/reports/trends", filters);
	}

	// Export alarms to CSV
	async exportAlarmsCSV(filters?: ReportFilters): Promise<void> {
		const params = new URLSearchParams();
		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					params.append(key, value.toString());
				}
			});
		}

		const filename = `alarm-reports-${
			new Date().toISOString().split("T")[0]
		}.csv`;
		await this.downloadFile(
			`/reports/export/csv?${params.toString()}`,
			filename
		);
	}

	// Export alarms to PDF
	async exportAlarmsPDF(
		filters?: ReportFilters,
		reportData?: any
	): Promise<void> {
		try {
			const token = localStorage.getItem("authToken");

			const response = await fetch(`${API_BASE_URL}/reports/export/pdf`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify({
					filters,
					reportData,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`PDF export failed: ${response.status} ${response.statusText}`
				);
			}

			// Get the PDF blob directly
			const blob = await response.blob();

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute(
				"download",
				`alarm-reports-${new Date().toISOString().split("T")[0]}.pdf`
			);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("PDF export failed:", error);
			throw error;
		}
	}

	// Get dashboard summary data
	async getDashboardSummary(filters?: ReportFilters) {
		return this.get<{
			stats: AlarmStats;
			recentAlarms: any[];
			topAlarmTypes: Array<{ type: string; count: number }>;
			companyPerformance: Array<{
				company: string;
				total: number;
				resolved: number;
				resolutionRate: string;
			}>;
		}>("/reports/dashboard", filters);
	}

	// Get alarm distribution data for charts
	async getAlarmDistribution(filters?: ReportFilters) {
		return this.get<{
			statusDistribution: Array<{ name: string; value: number; color: string }>;
			severityDistribution: Array<{
				name: string;
				value: number;
				color: string;
			}>;
			dailyTrends: Array<{
				date: string;
				total: number;
				active: number;
				resolved: number;
			}>;
		}>("/reports/distribution", filters);
	}

	// Get response time analytics
	async getResponseTimeAnalytics(filters?: ReportFilters) {
		return this.get<{
			averageResponseTime: number;
			averageResolutionTime: number;
			responseTimeByDay: Array<{
				date: string;
				responseTime: number;
				resolutionTime: number;
			}>;
			responseTimeByCompany: Array<{
				company: string;
				avgResponseTime: number;
				avgResolutionTime: number;
			}>;
		}>("/reports/response-times", filters);
	}

	// Get alarm heatmap data (for geographic visualization)
	async getAlarmHeatmapData(filters?: ReportFilters) {
		return this.get<{
			locations: Array<{
				latitude: number;
				longitude: number;
				count: number;
				severity: string;
				city: string;
				company: string;
			}>;
		}>("/reports/heatmap", filters);
	}

	// Get detailed alarm report with all related data
	async getDetailedAlarmReport(filters?: ReportFilters) {
		return this.get<{
			summary: AlarmStats;
			alarms: any[];
			trends: TrendData;
			performance: PerformanceMetrics;
			distribution: any;
			responseTimeAnalytics: any;
		}>("/reports/detailed", filters);
	}

	operatorApiService = {
		// Get all operators
		async getOperators(filters?: any) {
			return apiService.get("/users/my-operators", filters);
		},

		// Get operator details
		async getOperatorDetails(operatorId: string) {
			return apiService.get(`/users/operators/${operatorId}`);
		},

		// Get operator metrics
		async getOperatorMetrics(operatorId: string) {
			return apiService.get(`/users/operators/${operatorId}/metrics`);
		},

		// Get operator activity log
		async getOperatorActivity(
			operatorId: string,
			filters?: {
				dateFrom?: string;
				dateTo?: string;
				activityType?: string;
				limit?: number;
			}
		) {
			return apiService.get(`/users/operators/${operatorId}/activity`, filters);
		},

		// Export operator report to CSV
		async exportOperatorCSV(operatorId: string, filters?: any) {
			const params = new URLSearchParams(filters).toString();
			const filename = `operator-report-${operatorId}-${
				new Date().toISOString().split("T")[0]
			}.csv`;
			return apiService.downloadFile(
				`/users/operators/${operatorId}/export/csv?${params}`,
				filename
			);
		},

		// Export operator report to PDF
		async exportOperatorPDF(operatorId: string, filters?: any) {
			try {
				const token = localStorage.getItem("authToken");

				const response = await fetch(
					`/api/users/operators/${operatorId}/export/pdf`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(token && { Authorization: `Bearer ${token}` }),
						},
						body: JSON.stringify({ filters }),
					}
				);

				if (!response.ok) {
					throw new Error(
						`PDF export failed: ${response.status} ${response.statusText}`
					);
				}

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `operator-report-${operatorId}-${
					new Date().toISOString().split("T")[0]
				}.pdf`;
				document.body.appendChild(link);
				link.click();
				link.remove();
				window.URL.revokeObjectURL(url);
			} catch (error) {
				console.error("PDF export failed:", error);
				throw error;
			}
		},

		// Create operator
		async createOperator(operatorData: any) {
			return apiService.post("/users/operators", operatorData);
		},

		// Update operator
		async updateOperator(operatorId: string, operatorData: any) {
			return apiService.put(`/users/operators/${operatorId}`, operatorData);
		},

		// Delete operator
		async deleteOperator(operatorId: string) {
			return apiService.delete(`/users/operators/${operatorId}`);
		},

		// Update operator status
		async updateOperatorStatus(operatorId: string, status: string) {
			return apiService.patch(`/users/operators/${operatorId}/status`, {
				status,
			});
		},
	};
}

export const apiService = new ApiService();

// Export for backward compatibility
// export const apiClient = apiService;
