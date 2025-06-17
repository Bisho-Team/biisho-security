export const apiService = {
	get: async (endpoint: string, params?: Record<string, any>) => {
		const url = new URL(endpoint, process.env.NEXT_PUBLIC_API_URL);

		if (params) {
			Object.keys(params).forEach((key) => {
				if (params[key] !== undefined && params[key] !== null) {
					url.searchParams.append(key, params[key].toString());
				}
			});
		}

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${getAuthToken()}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	},

	post: async (endpoint: string, data: any) => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${getAuthToken()}`,
				},
				body: JSON.stringify(data),
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	},

	put: async (endpoint: string, data: any) => {
		const token = localStorage.getItem("authToken");
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${getAuthToken()}`,
				},
				body: JSON.stringify(data),
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	},

	patch: async (endpoint: string, data: any) => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${getAuthToken()}`,
				},
				body: JSON.stringify(data),
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	},

	delete: async (endpoint: string) => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${getAuthToken()}`,
				},
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	},

	// Operators-specific API methods
	operators: {
		// Get all police operators with filtering
		getAll: async (
			filters: {
				page?: number;
				limit?: number;
				search?: string;
				status?: string;
				operatorType?: string;
				companyId?: string;
			} = {}
		) => {
			return apiService.get("/api/users/filtered", {
				role: "OPERATOR",
				operatorType: "POLICE",
				...filters,
			});
		},

		// Get operators managed by current user
		getMyOperators: async () => {
			return apiService.get("/api/users/my-operators");
		},

		// Create new operator
		create: async (data: {
			name: string;
			email: string;
			password: string;
			// operatorType: "OFFICE" | "POLICE";
			operatorType: "POLICE";
			companyId: string;
			managedById?: string;
		}) => {
			return apiService.post("/users", {
				...data,
				role: "OPERATOR",
			});
		},

		// Get single operator by ID
		getById: async (id: string) => {
			return apiService.get(`/api/users/${id}`);
		},

		// Update operator
		update: async (
			id: string,
			data: {
				name: string;
				email: string;
				operatorType: "POLICE";
				companyId: string;
				status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
			}
		) => {
			return apiService.put(`/users/${id}`, data);
		},

		// Update operator status
		updateStatus: async (
			id: string,
			status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
		) => {
			return apiService.patch(`/api/users/${id}/status`, { status });
		},

		// Delete operator
		delete: async (id: string) => {
			return apiService.delete(`/users/${id}`);
		},

		// Assign operator to company
		assignToCompany: async (operatorId: string, companyId: string) => {
			return apiService.post("/users/assign-company", {
				operatorId,
				companyId,
			});
		},

		// Remove operator from company
		removeFromCompany: async (operatorId: string, companyId: string) => {
			return apiService.delete(
				`/users/assign-company/${operatorId}/${companyId}`
			);
		},
	},

	// Companies API methods
	companies: {
		getAll: async (filters: { status?: string; companyId?: string } = {}) => {
			return apiService.get("/api/companies", filters);
		},
	},

	// Managers API methods
	managers: {
		getAll: async () => {
			return apiService.get("/api/users/filtered", {
				// role: "OFFICE_MANAGER,POLICE_MANAGER",
				role: "POLICE_MANAGER",
				status: "ACTIVE",
			});
		},
	},
};

// Helper function to get auth token (implement based on your auth system)
function getAuthToken(): string {
	// This should return the actual JWT token from your auth system
	// For example, from localStorage, cookies, or auth context
	if (typeof window !== "undefined") {
		return localStorage.getItem("authToken") || "";
	}
	return "";
}
