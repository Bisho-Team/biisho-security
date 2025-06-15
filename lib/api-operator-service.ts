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

// // Mock data fallback for development
// const mockOperators = [
// 	{
// 		id: "op_1",
// 		name: "Dawit Mengistu",
// 		email: "dawit.mengistu@koppa.com",
// 		role: "OPERATOR",
// 		status: "ACTIVE",
// 		operatorType: "OFFICE",
// 		companyId: "comp_1",
// 		managedById: "mgr_1",
// 		createdAt: "2024-01-15T08:30:00Z",
// 		updatedAt: "2024-01-15T08:30:00Z",
// 		company: { id: "comp_1", name: "Koppa Security Solutions" },
// 		managedBy: { id: "mgr_1", name: "Hanan Abdella" },
// 		_count: { managedUsers: 0, createdAlarms: 23, createdReports: 5 },
// 	},
// 	{
// 		id: "op_2",
// 		name: "Tigist Haile",
// 		email: "tigist.haile@koppa.com",
// 		role: "OPERATOR",
// 		status: "ACTIVE",
// 		operatorType: "POLICE",
// 		companyId: "comp_1",
// 		managedById: "mgr_2",
// 		createdAt: "2024-02-10T10:15:00Z",
// 		updatedAt: "2024-02-10T10:15:00Z",
// 		company: { id: "comp_1", name: "Koppa Security Solutions" },
// 		managedBy: { id: "mgr_2", name: "Solomon Tadesse" },
// 		_count: { managedUsers: 0, createdAlarms: 18, createdReports: 12 },
// 	},
// 	{
// 		id: "op_3",
// 		name: "Bereket Girma",
// 		email: "bereket.girma@addissec.com",
// 		role: "OPERATOR",
// 		status: "INACTIVE",
// 		operatorType: "OFFICE",
// 		companyId: "comp_2",
// 		managedById: "mgr_3",
// 		createdAt: "2024-03-05T14:20:00Z",
// 		updatedAt: "2024-03-05T14:20:00Z",
// 		company: { id: "comp_2", name: "Addis Security Services" },
// 		managedBy: { id: "mgr_3", name: "Meron Alemu" },
// 		_count: { managedUsers: 0, createdAlarms: 7, createdReports: 2 },
// 	},
// 	{
// 		id: "op_4",
// 		name: "Hiwot Gebre",
// 		email: "hiwot.gebre@ethiosec.com",
// 		role: "OPERATOR",
// 		status: "ACTIVE",
// 		operatorType: "POLICE",
// 		companyId: "comp_3",
// 		managedById: "mgr_4",
// 		createdAt: "2024-04-12T09:45:00Z",
// 		updatedAt: "2024-04-12T09:45:00Z",
// 		company: { id: "comp_3", name: "Ethiopian Security Corp" },
// 		managedBy: { id: "mgr_4", name: "Yonas Bekele" },
// 		_count: { managedUsers: 0, createdAlarms: 31, createdReports: 8 },
// 	},
// 	{
// 		id: "op_5",
// 		name: "Alemayehu Teshome",
// 		email: "alemayehu.teshome@koppa.com",
// 		role: "OPERATOR",
// 		status: "SUSPENDED",
// 		operatorType: "OFFICE",
// 		companyId: "comp_1",
// 		managedById: "mgr_1",
// 		createdAt: "2024-05-08T11:30:00Z",
// 		updatedAt: "2024-05-08T11:30:00Z",
// 		company: { id: "comp_1", name: "Koppa Security Solutions" },
// 		managedBy: { id: "mgr_1", name: "Hanan Abdella" },
// 		_count: { managedUsers: 0, createdAlarms: 4, createdReports: 1 },
// 	},
// ];

// const mockCompanies = [
// 	{ id: "comp_1", name: "Koppa Security Solutions", status: "ACTIVE" },
// 	{ id: "comp_2", name: "Addis Security Services", status: "ACTIVE" },
// 	{ id: "comp_3", name: "Ethiopian Security Corp", status: "ACTIVE" },
// 	{ id: "comp_4", name: "Bole Security Group", status: "INACTIVE" },
// ];

// const mockManagers = [
// 	{
// 		id: "mgr_1",
// 		name: "Hanan Abdella",
// 		email: "hanan@koppa.com",
// 		role: "OFFICE_MANAGER",
// 		status: "ACTIVE",
// 		createdAt: "",
// 		updatedAt: "",
// 	},
// 	{
// 		id: "mgr_2",
// 		name: "Solomon Tadesse",
// 		email: "solomon@koppa.com",
// 		role: "POLICE_MANAGER",
// 		status: "ACTIVE",
// 		createdAt: "",
// 		updatedAt: "",
// 	},
// 	{
// 		id: "mgr_3",
// 		name: "Meron Alemu",
// 		email: "meron@addissec.com",
// 		role: "OFFICE_MANAGER",
// 		status: "ACTIVE",
// 		createdAt: "",
// 		updatedAt: "",
// 	},
// 	{
// 		id: "mgr_4",
// 		name: "Yonas Bekele",
// 		email: "yonas@ethiosec.com",
// 		role: "POLICE_MANAGER",
// 		status: "ACTIVE",
// 		createdAt: "",
// 		updatedAt: "",
// 	},
// ];

// // Development mode fallback
// if (process.env.NODE_ENV === "development") {
// 	// Override API calls with mock data for development
// 	const originalApiService = { ...apiService };

// 	apiService.operators.getAll = async (filters = {}) => {
// 		await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

// 		let filtered = mockOperators;

// 		if (filters.search) {
// 			filtered = filtered.filter(
// 				(op) =>
// 					op.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
// 					op.email.toLowerCase().includes(filters.search!.toLowerCase())
// 			);
// 		}

// 		if (filters.status) {
// 			filtered = filtered.filter(
// 				(op) => op.status === filters.status!.toUpperCase()
// 			);
// 		}

// 		if (filters.operatorType) {
// 			filtered = filtered.filter(
// 				(op) => op.operatorType === filters.operatorType!.toUpperCase()
// 			);
// 		}

// 		if (filters.companyId) {
// 			filtered = filtered.filter((op) => op.companyId === filters.companyId);
// 		}

// 		return {
// 			users: filtered,
// 			pagination: {
// 				page: filters.page || 1,
// 				limit: filters.limit || 10,
// 				total: filtered.length,
// 				pages: Math.ceil(filtered.length / (filters.limit || 10)),
// 			},
// 		};
// 	};

// 	apiService.companies.getAll = async () => {
// 		await new Promise((resolve) => setTimeout(resolve, 500));
// 		return mockCompanies;
// 	};

// 	apiService.managers.getAll = async () => {
// 		await new Promise((resolve) => setTimeout(resolve, 500));
// 		return { users: mockManagers };
// 	};
// }
