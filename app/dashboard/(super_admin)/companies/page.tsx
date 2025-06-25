"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api-service";
import {
	Building,
	Plus,
	Edit,
	Eye,
	MoreHorizontal,
	Users,
	Search,
	MapPin,
	Phone,
	Mail,
	Calendar,
	Loader2,
	Building2,
	Shield,
	Activity,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

interface Company {
	id: string;
	name: string;
	description: string;
	logo: string | null;
	type: string;
	industry: string;
	address: string;
	city: string;
	country: string;
	phone: string;
	email: string;
	status: "ACTIVE" | "INACTIVE";
	createdAt: string;
	updatedAt: string;
	_count: {
		users: number;
		branches: number;
		CompanyOperator: number;
	};
}

interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

const industryTypes = [
	"Technology",
	"Financial",
	"Healthcare",
	"Education",
	"Government",
	"Manufacturing",
	"Retail",
	"Real Estate",
	"Transportation",
	"Other",
];

// Map industries to company types
const industryToTypeMap: Record<string, string> = {
	"Technology": "Technology",
	"Financial": "Banking",
	"Healthcare": "Healthcare",
	"Education": "Education",
	"Government": "Government",
	"Manufacturing": "Manufacturing",
	"Retail": "Retail",
	"Real Estate": "Real Estate",
	"Transportation": "Transportation",
	"Other": "Other",
};

export default function CompaniesPage() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo>({
		page: 1,
		limit: 10,
		total: 0,
		pages: 0,
	});
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const { toast } = useToast();

	const NEXT_PUBLIC_API_URL = "http://167.235.24.44:3003";

	const [newCompany, setNewCompany] = useState({
		name: "",
		industry: "",
		address: "",
		city: "",
		country: "Ethiopia",
		phone: "",
		email: "",
		description: "",
		logo: null as File | null,
	});

	useEffect(() => {
		fetchCompanies();
	}, [pagination.page, pagination.limit, searchTerm, filterType, filterStatus]);

	const fetchCompanies = async (page = pagination.page) => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: page.toString(),
				limit: pagination.limit.toString(),
			});

			if (searchTerm) params.append("search", searchTerm);
			if (filterType !== "all") params.append("type", filterType);
			if (filterStatus !== "all") params.append("status", filterStatus);

			const response = await apiService.get(`/companies?${params.toString()}`);
			console.log("Fetched companies:", response);

			setCompanies((response as any).companies);
			if ((response as any).pagination) {
				setPagination((response as any).pagination);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch companies",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCreateCompany = async () => {
		// Enhanced validation for required fields
		if (
			!newCompany.name ||
			!newCompany.phone ||
			!newCompany.email ||
			!newCompany.address ||
			!newCompany.logo
		) {
			toast({
				title: "Validation Error",
				description:
					"Please fill in all required fields: Company Name, Phone Number, Address, and Company Logo",
				variant: "destructive",
			});
			return;
		}

		if (!newCompany.industry) {
			toast({
				title: "Validation Error",
				description: "Please select an industry",
				variant: "destructive",
			});
			return;
		}

		try {
			setCreating(true);
			const formData = new FormData();
			formData.append("name", newCompany.name);
			formData.append(
				"type",
				industryToTypeMap[newCompany.industry] || newCompany.industry
			);
			formData.append("industry", newCompany.industry);
			formData.append("address", newCompany.address);
			formData.append("city", newCompany.city);
			formData.append("country", newCompany.country);
			formData.append("phone", newCompany.phone);
			formData.append("email", newCompany.email);
			formData.append("description", newCompany.description);
			if (newCompany.logo) {
				formData.append("logo", newCompany.logo);
			}

			const token = localStorage.getItem("authToken");

			await axios.post("http://8436insight.et:3003/api/companies", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
					...(token && { Authorization: `Bearer ${token}` }),
				},
			});

			toast({
				title: "Success",
				description: "Company created successfully",
			});

			setNewCompany({
				name: "",
				industry: "",
				address: "",
				city: "",
				country: "Ethiopia",
				phone: "",
				email: "",
				description: "",
				logo: null,
			});
			setIsCreateDialogOpen(false);
			fetchCompanies(1); // Reset to first page after creating
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to create company",
				variant: "destructive",
			});
		} finally {
			setCreating(false);
		}
	};

	const handleUpdateCompany = async () => {
		if (!selectedCompany) return;

		try {
			setUpdating(true);
			await apiService.put(`/companies/${selectedCompany.id}`, {
				name: selectedCompany.name,
				type: selectedCompany.type,
				industry: selectedCompany.industry,
				address: selectedCompany.address,
				city: selectedCompany.city,
				country: selectedCompany.country,
				phone: selectedCompany.phone,
				email: selectedCompany.email,
				description: selectedCompany.description,
				status: selectedCompany.status,
			});

			toast({
				title: "Success",
				description: "Company updated successfully",
			});

			setIsEditDialogOpen(false);
			setSelectedCompany(null);
			fetchCompanies();
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to update company",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const toggleCompanyStatus = async (companyId: string) => {
		try {
			const company = companies.find((c) => c.id === companyId);
			if (!company) return;

			const newStatus = company.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
			await apiService.put(`/companies/${companyId}`, { status: newStatus });

			toast({
				title: "Success",
				description: `Company ${
					newStatus === "ACTIVE" ? "activated" : "deactivated"
				} successfully`,
			});

			fetchCompanies();
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error.response?.data?.message || "Failed to update company status",
				variant: "destructive",
			});
		}
	};

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= pagination.pages) {
			setPagination((prev) => ({ ...prev, page: newPage }));
			fetchCompanies(newPage);
		}
	};

	const handleLimitChange = (newLimit: string) => {
		const limit = Number.parseInt(newLimit);
		setPagination((prev) => ({ ...prev, limit, page: 1 }));
		fetchCompanies(1);
	};

	// Debounced search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (pagination.page !== 1) {
				setPagination((prev) => ({ ...prev, page: 1 }));
			}
			fetchCompanies(1);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	const filteredCompanies = companies.filter((company) => {
		const matchesSearch =
			company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			company.email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = filterType === "all" || company.type === filterType;
		const matchesStatus =
			filterStatus === "all" || company.status === filterStatus;
		return matchesSearch && matchesType && matchesStatus;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
			case "INACTIVE":
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
			default:
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "Banking":
				return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
			case "Insurance":
				return "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0";
			case "Healthcare":
				return "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0";
			case "Education":
				return "bg-gradient-to-r from-green-500 to-teal-500 text-white border-0";
			case "Government":
				return "bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0";
			case "Technology":
				return "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0";
			default:
				return "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0";
		}
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const PaginationControls = () => (
		<div className="flex items-center justify-between px-2">
			<div className="flex items-center space-x-2">
				<p className="text-sm text-muted-foreground">
					Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
					{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
					{pagination.total} results
				</p>
				<Select
					value={pagination.limit.toString()}
					onValueChange={handleLimitChange}>
					<SelectTrigger className="w-20">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="5">5</SelectItem>
						<SelectItem value="10">10</SelectItem>
						<SelectItem value="20">20</SelectItem>
						<SelectItem value="50">50</SelectItem>
					</SelectContent>
				</Select>
				<span className="text-sm text-muted-foreground">per page</span>
			</div>

			<div className="flex items-center space-x-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(1)}
					disabled={pagination.page === 1}>
					<ChevronsLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.page - 1)}
					disabled={pagination.page === 1}>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<div className="flex items-center space-x-1">
					{Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
						const pageNum = Math.max(1, pagination.page - 2) + i;
						if (pageNum > pagination.pages) return null;

						return (
							<Button
								key={pageNum}
								variant={pageNum === pagination.page ? "default" : "outline"}
								size="sm"
								onClick={() => handlePageChange(pageNum)}
								className="w-8 h-8 p-0">
								{pageNum}
							</Button>
						);
					})}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.page + 1)}
					disabled={pagination.page === pagination.pages}>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(pagination.pages)}
					disabled={pagination.page === pagination.pages}>
					<ChevronsRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);

	if (loading && companies.length === 0) {
		return (
			<div className="space-y-6 animate-fade-in">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96 mt-2" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid gap-4 md:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<Card
							key={i}
							className="animate-slide-up"
							style={{ animationDelay: `${i * 0.1}s` }}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-4" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-3 w-20 mt-1" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex justify-between items-center animate-slide-up">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
						Company Management
					</h1>
					<p className="text-muted-foreground mt-2">
						Manage companies and their security operations
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
							<Plus className="h-4 w-4 mr-2" />
							Create Company
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto glass">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Building className="h-5 w-5 text-primary" />
								Create New Company
							</DialogTitle>
							<DialogDescription>
								Add a new company to the security management system
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Company Name *</Label>
									<Input
										id="name"
										value={newCompany.name}
										onChange={(e) =>
											setNewCompany({ ...newCompany, name: e.target.value })
										}
										placeholder="Enter company name"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="industry">Industry *</Label>
									<Select
										value={newCompany.industry}
										onValueChange={(value) =>
											setNewCompany({ ...newCompany, industry: value })
										}
										required>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue placeholder="Select industry" />
										</SelectTrigger>
										<SelectContent>
											{industryTypes.map((industry) => (
												<SelectItem key={industry} value={industry}>
													{industry}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email *</Label>
									<Input
										id="email"
										type="email"
										value={newCompany.email}
										onChange={(e) =>
											setNewCompany({ ...newCompany, email: e.target.value })
										}
										placeholder="company@example.com"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number *</Label>
									<Input
										id="phone"
										value={newCompany.phone}
										onChange={(e) =>
											setNewCompany({ ...newCompany, phone: e.target.value })
										}
										placeholder="+251115517438"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="address">Address *</Label>
								<Input
									id="address"
									value={newCompany.address}
									onChange={(e) =>
										setNewCompany({ ...newCompany, address: e.target.value })
									}
									placeholder="Street address"
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="city">City</Label>
									<Input
										id="city"
										value={newCompany.city}
										onChange={(e) =>
											setNewCompany({ ...newCompany, city: e.target.value })
										}
										placeholder="Addis Ababa"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="country">Country</Label>
									<Select
										value={newCompany.country}
										onValueChange={(value) =>
											setNewCompany({ ...newCompany, country: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Ethiopia">Ethiopia</SelectItem>
											<SelectItem value="Kenya">Kenya</SelectItem>
											<SelectItem value="Uganda">Uganda</SelectItem>
											<SelectItem value="Tanzania">Tanzania</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={newCompany.description}
									onChange={(e) =>
										setNewCompany({
											...newCompany,
											description: e.target.value,
										})
									}
									placeholder="Brief description of the company..."
									rows={3}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="logo">Company Logo *</Label>
								<Input
									id="logo"
									type="file"
									accept="image/*"
									onChange={(e) =>
										setNewCompany({
											...newCompany,
											logo: e.target.files?.[0] ?? null,
										})
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									required
								/>
							</div>

							{newCompany.industry && (
								<div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
									<p className="text-sm text-blue-700 dark:text-blue-300">
										<strong>Company Type:</strong>{" "}
										{industryToTypeMap[newCompany.industry] ||
											newCompany.industry}
									</p>
									<p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
										This will be automatically set based on your selected
										industry.
									</p>
								</div>
							)}
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
								disabled={creating}>
								Cancel
							</Button>
							<Button
								onClick={handleCreateCompany}
								disabled={
									!newCompany.name ||
									!newCompany.phone ||
									!newCompany.address ||
									!newCompany.logo ||
									!newCompany.industry ||
									creating
								}
								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
								{creating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create Company"
								)}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Enhanced Overview Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.1s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Companies
						</CardTitle>
						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
							<Building className="h-4 w-4 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{pagination.total}</div>
						<p className="text-xs text-muted-foreground">
							{companies.filter((c) => c.status === "ACTIVE").length} active
						</p>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.2s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
							<Users className="h-4 w-4 text-green-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{companies.reduce(
								(sum, company) => sum + company._count.users,
								0
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							Across all companies
						</p>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.3s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Branches
						</CardTitle>
						<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
							<Building2 className="h-4 w-4 text-purple-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-600">
							{companies.reduce(
								(sum, company) => sum + company._count.branches,
								0
							)}
						</div>
						<p className="text-xs text-muted-foreground">Security locations</p>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.4s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Company Operators
						</CardTitle>
						<div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
							<Shield className="h-4 w-4 text-orange-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">
							{companies.reduce(
								(sum, company) => sum + company._count.CompanyOperator,
								0
							)}
						</div>
						<p className="text-xs text-muted-foreground">Security personnel</p>
					</CardContent>
				</Card>
			</div>

			{/* Enhanced Search and Filters */}
			<div
				className="flex justify-between items-center space-x-4 animate-slide-up"
				style={{ animationDelay: "0.5s" }}>
				<div className="flex space-x-2">
					<div className="relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search companies..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-9 w-64 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
						/>
					</div>
					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
							<SelectValue placeholder="Filter by type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{industryTypes.map((type) => (
								<SelectItem key={type} value={industryToTypeMap[type] || type}>
									{industryToTypeMap[type] || type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={filterStatus} onValueChange={setFilterStatus}>
						<SelectTrigger className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="ACTIVE">Active</SelectItem>
							<SelectItem value="INACTIVE">Inactive</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Enhanced Company List */}
			<div className="grid gap-6">
				{loading && (
					<div className="text-center py-4">
						<Loader2 className="h-6 w-6 animate-spin mx-auto" />
					</div>
				)}
				{companies.map((company, index) => (
					<Card
						key={company.id}
						className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
						style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
						<CardContent className="p-6">
							<div className="flex items-start justify-between">
								<div className="flex items-start space-x-4">
									<div className="relative">
										{company.logo ? (
											<img
												src={`${NEXT_PUBLIC_API_URL}${company.logo.replace(
													"/var/www/html/koppa-security-api",
													""
												)}`}
												alt={`${company.name} logo`}
												className="h-14 w-14 object-cover rounded-xl shadow-lg border border-border"
											/>
										) : (
											<div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
												<Building className="h-8 w-8 text-white" />
											</div>
										)}
										<div
											className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
												company.status === "ACTIVE"
													? "bg-green-500"
													: "bg-gray-400"
											}`}
										/>
									</div>
									<div className="space-y-3">
										<div>
											<h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
												{company.name}
											</h3>
											<p className="text-sm text-muted-foreground font-medium">
												{company.industry}
											</p>
										</div>
										<div className="flex items-center space-x-1 text-sm text-muted-foreground">
											<MapPin className="h-4 w-4" />
											<span>
												{company.address}, {company.city}, {company.country}
											</span>
										</div>
										<div className="flex items-center space-x-6 text-sm">
											<span className="flex items-center text-muted-foreground hover:text-primary transition-colors">
												<Mail className="h-4 w-4 mr-2" />
												{company.email}
											</span>
											{company.phone && (
												<span className="flex items-center text-muted-foreground hover:text-primary transition-colors">
													<Phone className="h-4 w-4 mr-2" />
													{company.phone}
												</span>
											)}
										</div>
										<div className="flex items-center space-x-2">
											<Badge
												className={cn(
													"text-xs font-medium shadow-sm",
													getTypeColor(company.type)
												)}>
												{company.type}
											</Badge>
											<Badge
												className={cn(
													"text-xs font-medium shadow-sm",
													getStatusColor(company.status)
												)}>
												{company.status}
											</Badge>
										</div>
									</div>
								</div>
								<div className="flex items-start space-x-4">
									<div className="text-right space-y-3">
										<div className="grid grid-cols-3 gap-6 text-sm">
											<div className="text-center">
												<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 mb-1">
													<Users className="h-4 w-4 text-blue-500 mx-auto" />
												</div>
												<p className="font-bold text-blue-600">
													{company._count.users}
												</p>
												<p className="text-xs text-muted-foreground">Users</p>
											</div>
											<div className="text-center">
												<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 mb-1">
													<Building2 className="h-4 w-4 text-green-500 mx-auto" />
												</div>
												<p className="font-bold text-green-600">
													{company._count.branches}
												</p>
												<p className="text-xs text-muted-foreground">
													Branches
												</p>
											</div>
											<div className="text-center">
												<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 mb-1">
													<Shield className="h-4 w-4 text-purple-500 mx-auto" />
												</div>
												<p className="font-bold text-purple-600">
													{company._count.CompanyOperator}
												</p>
												<p className="text-xs text-muted-foreground">
													Operators
												</p>
											</div>
										</div>
										<div className="text-xs text-muted-foreground flex items-center justify-end">
											<Calendar className="h-3 w-3 mr-1" />
											Created {new Date(company.createdAt).toLocaleDateString()}
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												className="h-8 w-8 p-0">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="glass">
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={() => {
													setSelectedCompany(company);
													setIsViewDialogOpen(true);
												}}>
												<Eye className="h-4 w-4 mr-2" />
												View
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={() => {
													setSelectedCompany(company);
													setIsEditDialogOpen(true);
												}}>
												<Edit className="h-4 w-4 mr-2" />
												Edit
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
							{company.description && (
								<div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
									<p className="text-sm text-muted-foreground leading-relaxed">
										{company.description}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Pagination Controls */}
			<PaginationControls />

			{/* View Company Details Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto glass">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Building className="h-5 w-5 text-primary" />
							Company Details
						</DialogTitle>
						<DialogDescription>
							Comprehensive information about the company
						</DialogDescription>
					</DialogHeader>
					{selectedCompany && (
						<div className="space-y-6 py-4">
							<div className="flex items-start gap-4">
								<div className="p-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
									{selectedCompany.logo ? (
										<img
											src={`${NEXT_PUBLIC_API_URL}${selectedCompany.logo.replace(
												"/var/www/html/koppa-security-api",
												""
											)}`}
											alt={`${selectedCompany.name} logo`}
											className="h-20 w-20 object-cover rounded-xl shadow-lg border border-border"
										/>
									) : (
										<div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
											<Building className="h-8 w-8 text-white" />
										</div>
									)}
								</div>

								<div className="flex-1">
									<h3 className="text-2xl font-bold">{selectedCompany.name}</h3>
									<p className="text-muted-foreground">
										{selectedCompany.industry}
									</p>
									<div className="flex gap-2 mt-2">
										<Badge
											className={cn(
												"text-xs font-medium shadow-sm",
												getTypeColor(selectedCompany.type)
											)}>
											{selectedCompany.type}
										</Badge>
										<Badge
											className={cn(
												"text-xs font-medium shadow-sm",
												getStatusColor(selectedCompany.status)
											)}>
											{selectedCompany.status}
										</Badge>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Contact Information
										</Label>
										<div className="mt-2 space-y-2">
											<div className="flex items-center gap-2">
												<Mail className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">{selectedCompany.email}</span>
											</div>
											{selectedCompany.phone && (
												<div className="flex items-center gap-2">
													<Phone className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm">
														{selectedCompany.phone}
													</span>
												</div>
											)}
										</div>
									</div>

									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Location
										</Label>
										<div className="mt-2">
											<div className="flex items-start gap-2">
												<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
												<div className="text-sm">
													<p>{selectedCompany.address}</p>
													<p>
														{selectedCompany.city}, {selectedCompany.country}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Statistics
										</Label>
										<div className="mt-2 grid grid-cols-3 gap-4">
											<div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
												<Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
												<p className="text-lg font-bold text-blue-600">
													{selectedCompany._count.users}
												</p>
												<p className="text-xs text-muted-foreground">Users</p>
											</div>
											<div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
												<Building2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
												<p className="text-lg font-bold text-green-600">
													{selectedCompany._count.branches}
												</p>
												<p className="text-xs text-muted-foreground">
													Branches
												</p>
											</div>
											<div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
												<Shield className="h-5 w-5 text-purple-500 mx-auto mb-1" />
												<p className="text-lg font-bold text-purple-600">
													{selectedCompany._count.CompanyOperator}
												</p>
												<p className="text-xs text-muted-foreground">
													Operators
												</p>
											</div>
										</div>
									</div>

									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Timeline
										</Label>
										<div className="mt-2 space-y-2">
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">
													Created:{" "}
													{new Date(
														selectedCompany.createdAt
													).toLocaleDateString()}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Activity className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">
													Updated:{" "}
													{new Date(
														selectedCompany.updatedAt
													).toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{selectedCompany.description && (
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Description
									</Label>
									<div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border/50">
										<p className="text-sm leading-relaxed">
											{selectedCompany.description}
										</p>
									</div>
								</div>
							)}
						</div>
					)}
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsViewDialogOpen(false)}>
							Close
						</Button>
						<Button
							onClick={() => {
								setIsViewDialogOpen(false);
								setIsEditDialogOpen(true);
							}}
							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
							<Edit className="h-4 w-4 mr-2" />
							Edit Company
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Company Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto glass">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5 text-primary" />
							Edit Company
						</DialogTitle>
						<DialogDescription>
							Update company information and settings
						</DialogDescription>
					</DialogHeader>
					{selectedCompany && (
						<div className="space-y-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editName">Company Name</Label>
									<Input
										id="editName"
										value={selectedCompany.name}
										onChange={(e) =>
											setSelectedCompany({
												...selectedCompany,
												name: e.target.value,
											})
										}
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editType">Company Type</Label>
									<Select
										value={selectedCompany.type}
										onValueChange={(value) =>
											setSelectedCompany({ ...selectedCompany, type: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{industryTypes.map((type) => (
												<SelectItem
													key={type}
													value={industryToTypeMap[type] || type}>
													{industryToTypeMap[type] || type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editIndustry">Industry</Label>
									<Input
										id="editIndustry"
										value={selectedCompany.industry}
										onChange={(e) =>
											setSelectedCompany({
												...selectedCompany,
												industry: e.target.value,
											})
										}
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editEmail">Email</Label>
									<Input
										id="editEmail"
										type="email"
										value={selectedCompany.email}
										onChange={(e) =>
											setSelectedCompany({
												...selectedCompany,
												email: e.target.value,
											})
										}
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editPhone">Phone Number</Label>
									<Input
										id="editPhone"
										value={selectedCompany.phone}
										onChange={(e) =>
											setSelectedCompany({
												...selectedCompany,
												phone: e.target.value,
											})
										}
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editStatus">Status</Label>
									<Select
										value={selectedCompany.status}
										onValueChange={(value: "ACTIVE" | "INACTIVE") =>
											setSelectedCompany({ ...selectedCompany, status: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ACTIVE">Active</SelectItem>
											<SelectItem value="INACTIVE">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="editAddress">Address</Label>
								<Input
									id="editAddress"
									value={selectedCompany.address}
									onChange={(e) =>
										setSelectedCompany({
											...selectedCompany,
											address: e.target.value,
										})
									}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="editCity">City</Label>
									<Input
										id="editCity"
										value={selectedCompany.city}
										onChange={(e) =>
											setSelectedCompany({
												...selectedCompany,
												city: e.target.value,
											})
										}
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="editCountry">Country</Label>
									<Select
										value={selectedCompany.country}
										onValueChange={(value) =>
											setSelectedCompany({ ...selectedCompany, country: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Ethiopia">Ethiopia</SelectItem>
											<SelectItem value="Kenya">Kenya</SelectItem>
											<SelectItem value="Uganda">Uganda</SelectItem>
											<SelectItem value="Tanzania">Tanzania</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="editDescription">Description</Label>
								<Textarea
									id="editDescription"
									value={selectedCompany.description}
									onChange={(e) =>
										setSelectedCompany({
											...selectedCompany,
											description: e.target.value,
										})
									}
									rows={3}
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
								/>
							</div>
						</div>
					)}
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
							disabled={updating}>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateCompany}
							disabled={updating}
							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
							{updating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								"Update Company"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Textarea } from "@/components/ui/textarea";
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogDescription,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogTrigger,
// } from "@/components/ui/dialog";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// 	DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import { apiService } from "@/lib/api-service";
// import {
// 	Building,
// 	Plus,
// 	Edit,
// 	Eye,
// 	MoreHorizontal,
// 	Users,
// 	Search,
// 	MapPin,
// 	Phone,
// 	Mail,
// 	Calendar,
// 	Loader2,
// 	Globe,
// 	Building2,
// 	Shield,
// 	Activity,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import axios from "axios";
// import Image from "next/image";

// interface Company {
// 	id: string;
// 	name: string;
// 	type: string;
// 	logo: string;
// 	industry: string;
// 	address: string;
// 	city: string;
// 	country: string;
// 	phone: string;
// 	email: string;
// 	website?: string;
// 	description: string;
// 	status: "active" | "inactive" | "pending";
// 	createdAt: string;
// 	officeManagersCount: number;
// 	branchesCount: number;
// 	totalOperators: number;
// 	lastActivity?: string;
// }

// const companyTypes = [
// 	"Banking",
// 	"Insurance",
// 	"Healthcare",
// 	"Education",
// 	"Government",
// 	"Manufacturing",
// 	"Retail",
// 	"Technology",
// 	"Real Estate",
// 	"Transportation",
// 	"Other",
// ];

// export default function CompaniesPage() {
// 	const [companies, setCompanies] = useState<Company[]>([]);
// 	const [loading, setLoading] = useState(true);
// 	const [creating, setCreating] = useState(false);
// 	const [updating, setUpdating] = useState(false);
// 	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
// 	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
// 	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [filterType, setFilterType] = useState("all");
// 	const [filterStatus, setFilterStatus] = useState("all");
// 	const { toast } = useToast();
// 	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
// 	const NEXT_PUBLIC_API_URL = "http://167.235.24.44:3003";

// 	const [newCompany, setNewCompany] = useState({
// 		name: "",
// 		type: "",
// 		industry: "",
// 		address: "",
// 		city: "",
// 		country: "Ethiopia",
// 		phone: "",
// 		email: "",
// 		website: "",
// 		description: "",
// 		logo: null as File | null,
// 	});

// 	useEffect(() => {
// 		fetchCompanies();
// 	}, []);

// 	const fetchCompanies = async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/companies");
// 			console.log("Fetched companies:", response);
// 			setCompanies((response as any).companies as any);
// 		} catch (error) {
// 			toast({
// 				title: "Error",
// 				description: "Failed to fetch companies",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const handleCreateCompany = async () => {
// 		if (!newCompany.name || !newCompany.type || !newCompany.email) return;

// 		try {
// 			setCreating(true);
// 			const formData = new FormData();
// 			formData.append("name", newCompany.name);
// 			formData.append("type", newCompany.type);
// 			formData.append("industry", newCompany.industry);
// 			formData.append("address", newCompany.address);
// 			formData.append("city", newCompany.city);
// 			formData.append("country", newCompany.country);
// 			formData.append("phone", newCompany.phone);
// 			formData.append("email", newCompany.email);
// 			formData.append("website", newCompany.website);
// 			formData.append("description", newCompany.description);
// 			if (newCompany.logo) {
// 				formData.append("logo", newCompany.logo);
// 			}

// 			const token = localStorage.getItem("authToken");

// 			// await apiService.post("/companies", formData);
// 			await axios.post("http://8436insight.et:3003/api/companies", formData, {
// 				headers: {
// 					"Content-Type": "multipart/form-data",
// 					...(token && { Authorization: `Bearer ${token}` }),
// 				},
// 			});

// 			toast({
// 				title: "Success",
// 				description: "Company created successfully",
// 			});

// 			setNewCompany({
// 				name: "",
// 				type: "",
// 				industry: "",
// 				address: "",
// 				city: "",
// 				country: "Ethiopia",
// 				phone: "",
// 				email: "",
// 				website: "",
// 				description: "",
// 				logo: null,
// 			});
// 			setIsCreateDialogOpen(false);
// 			fetchCompanies();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description:
// 					error.response?.data?.message || "Failed to create company",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setCreating(false);
// 		}
// 	};

// 	const handleUpdateCompany = async () => {
// 		if (!selectedCompany) return;

// 		try {
// 			setUpdating(true);
// 			await apiService.put(`/companies/${selectedCompany.id}`, {
// 				name: selectedCompany.name,
// 				type: selectedCompany.type,
// 				industry: selectedCompany.industry,
// 				address: selectedCompany.address,
// 				city: selectedCompany.city,
// 				country: selectedCompany.country,
// 				phone: selectedCompany.phone,
// 				email: selectedCompany.email,
// 				website: selectedCompany.website,
// 				description: selectedCompany.description,
// 				status: selectedCompany.status,
// 			});

// 			toast({
// 				title: "Success",
// 				description: "Company updated successfully",
// 			});

// 			setIsEditDialogOpen(false);
// 			setSelectedCompany(null);
// 			fetchCompanies();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description:
// 					error.response?.data?.message || "Failed to update company",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setUpdating(false);
// 		}
// 	};

// 	const toggleCompanyStatus = async (companyId: string) => {
// 		try {
// 			const company = companies.find((c) => c.id === companyId);
// 			if (!company) return;

// 			const newStatus = company.status === "active" ? "inactive" : "active";
// 			await apiService.put(`/companies/${companyId}`, { status: newStatus });

// 			toast({
// 				title: "Success",
// 				description: `Company ${
// 					newStatus === "active" ? "activated" : "deactivated"
// 				} successfully`,
// 			});

// 			fetchCompanies();
// 		} catch (error: any) {
// 			toast({
// 				title: "Error",
// 				description:
// 					error.response?.data?.message || "Failed to update company status",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const filteredCompanies = companies.filter((company) => {
// 		const matchesSearch =
// 			company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 			company.email.toLowerCase().includes(searchTerm.toLowerCase());
// 		const matchesType = filterType === "all" || company.type === filterType;
// 		const matchesStatus =
// 			filterStatus === "all" || company.status === filterStatus;
// 		return matchesSearch && matchesType && matchesStatus;
// 	});

// 	const getStatusColor = (status: string) => {
// 		switch (status) {
// 			case "active":
// 				return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
// 			case "inactive":
// 				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
// 			case "pending":
// 				return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0";
// 			default:
// 				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
// 		}
// 	};

// 	const getTypeColor = (type: string) => {
// 		switch (type) {
// 			case "Banking":
// 				return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
// 			case "Insurance":
// 				return "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0";
// 			case "Healthcare":
// 				return "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0";
// 			case "Education":
// 				return "bg-gradient-to-r from-green-500 to-teal-500 text-white border-0";
// 			case "Government":
// 				return "bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0";
// 			default:
// 				return "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0";
// 		}
// 	};

// 	const formatDateTime = (dateString: string) => {
// 		return new Date(dateString).toLocaleString();
// 	};

// 	if (loading) {
// 		return (
// 			<div className="space-y-6 animate-fade-in">
// 				<div className="flex justify-between items-center">
// 					<div>
// 						<Skeleton className="h-8 w-64" />
// 						<Skeleton className="h-4 w-96 mt-2" />
// 					</div>
// 					<Skeleton className="h-10 w-32" />
// 				</div>
// 				<div className="grid gap-4 md:grid-cols-4">
// 					{[...Array(4)].map((_, i) => (
// 						<Card
// 							key={i}
// 							className="animate-slide-up"
// 							style={{ animationDelay: `${i * 0.1}s` }}>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 								<Skeleton className="h-4 w-24" />
// 								<Skeleton className="h-4 w-4" />
// 							</CardHeader>
// 							<CardContent>
// 								<Skeleton className="h-8 w-16" />
// 								<Skeleton className="h-3 w-20 mt-1" />
// 							</CardContent>
// 						</Card>
// 					))}
// 				</div>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6 animate-fade-in">
// 			<div className="flex justify-between items-center animate-slide-up">
// 				<div>
// 					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
// 						Company Management
// 					</h1>
// 					<p className="text-muted-foreground mt-2">
// 						Manage companies and their security operations
// 					</p>
// 				</div>
// 				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
// 					<DialogTrigger asChild>
// 						<Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
// 							<Plus className="h-4 w-4 mr-2" />
// 							Create Company
// 						</Button>
// 					</DialogTrigger>
// 					<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto glass">
// 						<DialogHeader>
// 							<DialogTitle className="flex items-center gap-2">
// 								<Building className="h-5 w-5 text-primary" />
// 								Create New Company
// 							</DialogTitle>
// 							<DialogDescription>
// 								Add a new company to the security management system
// 							</DialogDescription>
// 						</DialogHeader>
// 						<div className="space-y-4 py-4">
// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="name">Company Name *</Label>
// 									<Input
// 										id="name"
// 										value={newCompany.name}
// 										onChange={(e) =>
// 											setNewCompany({ ...newCompany, name: e.target.value })
// 										}
// 										placeholder="Enter company name"
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="type">Company Type *</Label>
// 									<Select
// 										value={newCompany.type}
// 										onValueChange={(value) =>
// 											setNewCompany({ ...newCompany, type: value })
// 										}>
// 										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 											<SelectValue placeholder="Select type" />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{companyTypes.map((type) => (
// 												<SelectItem key={type} value={type}>
// 													{type}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="industry">Industry</Label>
// 									<Input
// 										id="industry"
// 										value={newCompany.industry}
// 										onChange={(e) =>
// 											setNewCompany({ ...newCompany, industry: e.target.value })
// 										}
// 										placeholder="e.g., Financial Services"
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="email">Email *</Label>
// 									<Input
// 										id="email"
// 										type="email"
// 										value={newCompany.email}
// 										onChange={(e) =>
// 											setNewCompany({ ...newCompany, email: e.target.value })
// 										}
// 										placeholder="company@example.com"
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="phone">Phone Number</Label>
// 									<Input
// 										id="phone"
// 										value={newCompany.phone}
// 										onChange={(e) =>
// 											setNewCompany({ ...newCompany, phone: e.target.value })
// 										}
// 										placeholder="+251115517438"
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="website">Website</Label>
// 									<Input
// 										id="website"
// 										value={newCompany.website}
// 										onChange={(e) =>
// 											setNewCompany({ ...newCompany, website: e.target.value })
// 										}
// 										placeholder="www.company.com"
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="address">Address</Label>
// 								<Input
// 									id="address"
// 									value={newCompany.address}
// 									onChange={(e) =>
// 										setNewCompany({ ...newCompany, address: e.target.value })
// 									}
// 									placeholder="Street address"
// 									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 								/>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="city">City</Label>
// 									<Input
// 										id="city"
// 										value={newCompany.city}
// 										onChange={(e) =>
// 											setNewCompany({ ...newCompany, city: e.target.value })
// 										}
// 										placeholder="Addis Ababa"
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="country">Country</Label>
// 									<Select
// 										value={newCompany.country}
// 										onValueChange={(value) =>
// 											setNewCompany({ ...newCompany, country: value })
// 										}>
// 										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="Ethiopia">Ethiopia</SelectItem>
// 											<SelectItem value="Kenya">Kenya</SelectItem>
// 											<SelectItem value="Uganda">Uganda</SelectItem>
// 											<SelectItem value="Tanzania">Tanzania</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="description">Description</Label>
// 								<Textarea
// 									id="description"
// 									value={newCompany.description}
// 									onChange={(e) =>
// 										setNewCompany({
// 											...newCompany,
// 											description: e.target.value,
// 										})
// 									}
// 									placeholder="Brief description of the company..."
// 									rows={3}
// 									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 								/>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="logo">Company Logo</Label>
// 								<Input
// 									id="logo"
// 									type="file"
// 									accept="image/*"
// 									onChange={(e) =>
// 										setNewCompany({
// 											...newCompany,
// 											logo: e.target.files?.[0] ?? null,
// 										})
// 									}
// 									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 								/>
// 							</div>
// 						</div>
// 						<div className="flex justify-end space-x-2">
// 							<Button
// 								variant="outline"
// 								onClick={() => setIsCreateDialogOpen(false)}
// 								disabled={creating}>
// 								Cancel
// 							</Button>
// 							<Button
// 								onClick={handleCreateCompany}
// 								disabled={
// 									!newCompany.name ||
// 									!newCompany.type ||
// 									!newCompany.email ||
// 									creating
// 								}
// 								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
// 								{creating ? (
// 									<>
// 										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 										Creating...
// 									</>
// 								) : (
// 									"Create Company"
// 								)}
// 							</Button>
// 						</div>
// 					</DialogContent>
// 				</Dialog>
// 			</div>

// 			{/* Enhanced Overview Cards */}
// 			<div className="grid gap-4 md:grid-cols-4">
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.1s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Companies
// 						</CardTitle>
// 						<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
// 							<Building className="h-4 w-4 text-blue-500" />
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold">{companies.length}</div>
// 						<p className="text-xs text-muted-foreground">
// 							{companies.filter((c) => c.status === "active").length} active
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.2s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Office Managers
// 						</CardTitle>
// 						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
// 							<Users className="h-4 w-4 text-green-500" />
// 						</div>
// 					</CardHeader>
// 					{/* <CardContent>
// 						<div className="text-2xl font-bold text-green-600">
// 							{companies.reduce(
// 								(sum, company) => sum + company.officeManagersCount,
// 								0
// 							)}
// 						</div>
// 						<p className="text-xs text-muted-foreground">
// 							Across all companies
// 						</p>
// 					</CardContent> */}
// 				</Card>
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.3s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Branches
// 						</CardTitle>
// 						<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
// 							<Building2 className="h-4 w-4 text-purple-500" />
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-purple-600">
// 							{companies.reduce(
// 								(sum, company) => sum + company.branchesCount,
// 								0
// 							)}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Security locations</p>
// 					</CardContent>
// 				</Card>
// 				<Card
// 					className="animate-slide-up glass"
// 					style={{ animationDelay: "0.4s" }}>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Operators
// 						</CardTitle>
// 						<div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
// 							<Shield className="h-4 w-4 text-orange-500" />
// 						</div>
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-orange-600">
// 							{companies.reduce(
// 								(sum, company) => sum + company.totalOperators,
// 								0
// 							)}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Security personnel</p>
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Enhanced Search and Filters */}
// 			<div
// 				className="flex justify-between items-center space-x-4 animate-slide-up"
// 				style={{ animationDelay: "0.5s" }}>
// 				<div className="flex space-x-2">
// 					<div className="relative">
// 						<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
// 						<Input
// 							placeholder="Search companies..."
// 							value={searchTerm}
// 							onChange={(e) => setSearchTerm(e.target.value)}
// 							className="pl-9 w-64 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 						/>
// 					</div>
// 					<Select value={filterType} onValueChange={setFilterType}>
// 						<SelectTrigger className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 							<SelectValue placeholder="Filter by type" />
// 						</SelectTrigger>
// 						<SelectContent>
// 							<SelectItem value="all">All Types</SelectItem>
// 							{companyTypes.map((type) => (
// 								<SelectItem key={type} value={type}>
// 									{type}
// 								</SelectItem>
// 							))}
// 						</SelectContent>
// 					</Select>
// 					<Select value={filterStatus} onValueChange={setFilterStatus}>
// 						<SelectTrigger className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 							<SelectValue placeholder="Filter by status" />
// 						</SelectTrigger>
// 						<SelectContent>
// 							<SelectItem value="all">All Status</SelectItem>
// 							<SelectItem value="active">Active</SelectItem>
// 							<SelectItem value="inactive">Inactive</SelectItem>
// 							<SelectItem value="pending">Pending</SelectItem>
// 						</SelectContent>
// 					</Select>
// 				</div>
// 			</div>

// 			{/* Enhanced Company List */}
// 			<div className="grid gap-6">
// 				{filteredCompanies.map((company, index) => (
// 					<Card
// 						key={company.id}
// 						className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
// 						style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
// 						<CardContent className="p-6">
// 							<div className="flex items-start justify-between">
// 								<div className="flex items-start space-x-4">
// 									{/* <div className="relative">
// 										<div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
// 											<Building className="h-8 w-8 text-white" />
// 										</div>
// 										<div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
// 									</div> */}

// 									<div className="relative">
// 										{company.logo ? (
// 											<img
// 												src={`${NEXT_PUBLIC_API_URL}${company.logo.replace(
// 													"/var/www/html/koppa-security-api",
// 													""
// 												)}`}
// 												alt={`${company.name} logo`}
// 												className="h-14 w-14 object-cover rounded-xl shadow-lg border border-border"
// 											/>
// 										) : (
// 											<div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
// 												<Building className="h-8 w-8 text-white" />
// 											</div>
// 										)}
// 										<div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
// 									</div>
// 									<div className="space-y-3">
// 										<div>
// 											<h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
// 												{company.name}
// 											</h3>
// 											<p className="text-sm text-muted-foreground font-medium">
// 												{company.industry}
// 											</p>
// 										</div>
// 										<div className="flex items-center space-x-1 text-sm text-muted-foreground">
// 											<MapPin className="h-4 w-4" />
// 											<span>
// 												{company.address}, {company.city}, {company.country}
// 											</span>
// 										</div>
// 										<div className="flex items-center space-x-6 text-sm">
// 											<span className="flex items-center text-muted-foreground hover:text-primary transition-colors">
// 												<Mail className="h-4 w-4 mr-2" />
// 												{company.email}
// 											</span>
// 											{company.phone && (
// 												<span className="flex items-center text-muted-foreground hover:text-primary transition-colors">
// 													<Phone className="h-4 w-4 mr-2" />
// 													{company.phone}
// 												</span>
// 											)}
// 											{company.website && (
// 												<span className="flex items-center text-muted-foreground hover:text-primary transition-colors">
// 													<Globe className="h-4 w-4 mr-2" />
// 													{company.website}
// 												</span>
// 											)}
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<Badge
// 												className={cn(
// 													"text-xs font-medium shadow-sm",
// 													getTypeColor(company.type)
// 												)}>
// 												{company.type}
// 											</Badge>
// 											<Badge
// 												className={cn(
// 													"text-xs font-medium shadow-sm",
// 													getStatusColor(company.status)
// 												)}>
// 												{company.status}
// 											</Badge>
// 										</div>
// 									</div>
// 								</div>
// 								<div className="flex items-start space-x-4">
// 									<div className="text-right space-y-3">
// 										<div className="grid grid-cols-3 gap-6 text-sm">
// 											<div className="text-center">
// 												<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 mb-1">
// 													<Users className="h-4 w-4 text-blue-500 mx-auto" />
// 												</div>
// 												<p className="font-bold text-blue-600">
// 													{company.officeManagersCount}
// 												</p>
// 												<p className="text-xs text-muted-foreground">
// 													Managers
// 												</p>
// 											</div>
// 											<div className="text-center">
// 												<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 mb-1">
// 													<Building2 className="h-4 w-4 text-green-500 mx-auto" />
// 												</div>
// 												<p className="font-bold text-green-600">
// 													{company.branchesCount}
// 												</p>
// 												<p className="text-xs text-muted-foreground">
// 													Branches
// 												</p>
// 											</div>
// 											<div className="text-center">
// 												<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 mb-1">
// 													<Shield className="h-4 w-4 text-purple-500 mx-auto" />
// 												</div>
// 												<p className="font-bold text-purple-600">
// 													{company.totalOperators}
// 												</p>
// 												<p className="text-xs text-muted-foreground">
// 													Operators
// 												</p>
// 											</div>
// 										</div>
// 										<div className="text-xs text-muted-foreground flex items-center justify-end">
// 											<Calendar className="h-3 w-3 mr-1" />
// 											Created {new Date(company.createdAt).toLocaleDateString()}
// 										</div>
// 										{company.lastActivity && (
// 											<div className="text-xs text-muted-foreground flex items-center justify-end">
// 												<Activity className="h-3 w-3 mr-1" />
// 												Last activity: {formatDateTime(company.lastActivity)}
// 											</div>
// 										)}
// 									</div>
// 									<DropdownMenu>
// 										<DropdownMenuTrigger asChild>
// 											<Button
// 												variant="outline"
// 												size="sm"
// 												className="h-8 w-8 p-0">
// 												<MoreHorizontal className="h-4 w-4" />
// 											</Button>
// 										</DropdownMenuTrigger>
// 										<DropdownMenuContent align="end" className="glass">
// 											<DropdownMenuItem
// 												className="cursor-pointer"
// 												onClick={() => {
// 													setSelectedCompany(company);
// 													setIsViewDialogOpen(true);
// 												}}>
// 												<Eye className="h-4 w-4 mr-2" />
// 												View Details
// 											</DropdownMenuItem>
// 											<DropdownMenuItem
// 												className="cursor-pointer"
// 												onClick={() => {
// 													setSelectedCompany(company);
// 													setIsEditDialogOpen(true);
// 												}}>
// 												<Edit className="h-4 w-4 mr-2" />
// 												Edit Company
// 											</DropdownMenuItem>
// 											<DropdownMenuItem
// 												className="cursor-pointer"
// 												onClick={() => toggleCompanyStatus(company.id)}>
// 												{company.status === "active"
// 													? "Deactivate"
// 													: "Activate"}
// 											</DropdownMenuItem>
// 										</DropdownMenuContent>
// 									</DropdownMenu>
// 								</div>
// 							</div>
// 							{company.description && (
// 								<div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
// 									<p className="text-sm text-muted-foreground leading-relaxed">
// 										{company.description}
// 									</p>
// 								</div>
// 							)}
// 						</CardContent>
// 					</Card>
// 				))}
// 			</div>

// 			{/* View Company Details Dialog */}
// 			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
// 				<DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto glass">
// 					<DialogHeader>
// 						<DialogTitle className="flex items-center gap-2">
// 							<Building className="h-5 w-5 text-primary" />
// 							Company Details
// 						</DialogTitle>
// 						<DialogDescription>
// 							Comprehensive information about the company
// 						</DialogDescription>
// 					</DialogHeader>
// 					{selectedCompany && (
// 						<div className="space-y-6 py-4">
// 							<div className="flex items-start gap-4">
// 								<div className="p-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
// 									{/* <Building className="h-8 w-8 text-white" /> */}
// 									{selectedCompany.logo ? (
// 										<img
// 											src={`${NEXT_PUBLIC_API_URL}${selectedCompany.logo.replace(
// 												"/var/www/html/koppa-security-api",
// 												""
// 											)}`}
// 											alt={`${selectedCompany.name} logo`}
// 											className="h-20 w-20 object-cover rounded-xl shadow-lg border border-border"
// 										/>
// 									) : (
// 										<div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
// 											<Building className="h-8 w-8 text-white" />
// 										</div>
// 									)}
// 								</div>

// 								<div className="flex-1">
// 									<h3 className="text-2xl font-bold">{selectedCompany.name}</h3>
// 									<p className="text-muted-foreground">
// 										{selectedCompany.industry}
// 									</p>
// 									<div className="flex gap-2 mt-2">
// 										<Badge
// 											className={cn(
// 												"text-xs font-medium shadow-sm",
// 												getTypeColor(selectedCompany.type)
// 											)}>
// 											{selectedCompany.type}
// 										</Badge>
// 										<Badge
// 											className={cn(
// 												"text-xs font-medium shadow-sm",
// 												getStatusColor(selectedCompany.status)
// 											)}>
// 											{selectedCompany.status}
// 										</Badge>
// 									</div>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-6">
// 								<div className="space-y-4">
// 									<div>
// 										<Label className="text-sm font-medium text-muted-foreground">
// 											Contact Information
// 										</Label>
// 										<div className="mt-2 space-y-2">
// 											<div className="flex items-center gap-2">
// 												<Mail className="h-4 w-4 text-muted-foreground" />
// 												<span className="text-sm">{selectedCompany.email}</span>
// 											</div>
// 											{selectedCompany.phone && (
// 												<div className="flex items-center gap-2">
// 													<Phone className="h-4 w-4 text-muted-foreground" />
// 													<span className="text-sm">
// 														{selectedCompany.phone}
// 													</span>
// 												</div>
// 											)}
// 											{selectedCompany.website && (
// 												<div className="flex items-center gap-2">
// 													<Globe className="h-4 w-4 text-muted-foreground" />
// 													<span className="text-sm">
// 														{selectedCompany.website}
// 													</span>
// 												</div>
// 											)}
// 										</div>
// 									</div>

// 									<div>
// 										<Label className="text-sm font-medium text-muted-foreground">
// 											Location
// 										</Label>
// 										<div className="mt-2">
// 											<div className="flex items-start gap-2">
// 												<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
// 												<div className="text-sm">
// 													<p>{selectedCompany.address}</p>
// 													<p>
// 														{selectedCompany.city}, {selectedCompany.country}
// 													</p>
// 												</div>
// 											</div>
// 										</div>
// 									</div>
// 								</div>

// 								<div className="space-y-4">
// 									<div>
// 										<Label className="text-sm font-medium text-muted-foreground">
// 											Statistics
// 										</Label>
// 										<div className="mt-2 grid grid-cols-3 gap-4">
// 											<div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
// 												<Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
// 												<p className="text-lg font-bold text-blue-600">
// 													{selectedCompany.officeManagersCount}
// 												</p>
// 												<p className="text-xs text-muted-foreground">
// 													Managers
// 												</p>
// 											</div>
// 											<div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
// 												<Building2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
// 												<p className="text-lg font-bold text-green-600">
// 													{selectedCompany.branchesCount}
// 												</p>
// 												<p className="text-xs text-muted-foreground">
// 													Branches
// 												</p>
// 											</div>
// 											<div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
// 												<Shield className="h-5 w-5 text-purple-500 mx-auto mb-1" />
// 												<p className="text-lg font-bold text-purple-600">
// 													{selectedCompany.totalOperators}
// 												</p>
// 												<p className="text-xs text-muted-foreground">
// 													Operators
// 												</p>
// 											</div>
// 										</div>
// 									</div>

// 									<div>
// 										<Label className="text-sm font-medium text-muted-foreground">
// 											Timeline
// 										</Label>
// 										<div className="mt-2 space-y-2">
// 											<div className="flex items-center gap-2">
// 												<Calendar className="h-4 w-4 text-muted-foreground" />
// 												<span className="text-sm">
// 													Created:{" "}
// 													{new Date(
// 														selectedCompany.createdAt
// 													).toLocaleDateString()}
// 												</span>
// 											</div>
// 											{selectedCompany.lastActivity && (
// 												<div className="flex items-center gap-2">
// 													<Activity className="h-4 w-4 text-muted-foreground" />
// 													<span className="text-sm">
// 														Last Activity:{" "}
// 														{formatDateTime(selectedCompany.lastActivity)}
// 													</span>
// 												</div>
// 											)}
// 										</div>
// 									</div>
// 								</div>
// 							</div>

// 							{selectedCompany.description && (
// 								<div>
// 									<Label className="text-sm font-medium text-muted-foreground">
// 										Description
// 									</Label>
// 									<div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border/50">
// 										<p className="text-sm leading-relaxed">
// 											{selectedCompany.description}
// 										</p>
// 									</div>
// 								</div>
// 							)}
// 						</div>
// 					)}
// 					<div className="flex justify-end space-x-2">
// 						<Button
// 							variant="outline"
// 							onClick={() => setIsViewDialogOpen(false)}>
// 							Close
// 						</Button>
// 						<Button
// 							onClick={() => {
// 								setIsViewDialogOpen(false);
// 								setIsEditDialogOpen(true);
// 							}}
// 							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
// 							<Edit className="h-4 w-4 mr-2" />
// 							Edit Company
// 						</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>

// 			{/* Edit Company Dialog */}
// 			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
// 				<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto glass">
// 					<DialogHeader>
// 						<DialogTitle className="flex items-center gap-2">
// 							<Edit className="h-5 w-5 text-primary" />
// 							Edit Company
// 						</DialogTitle>
// 						<DialogDescription>
// 							Update company information and settings
// 						</DialogDescription>
// 					</DialogHeader>
// 					{selectedCompany && (
// 						<div className="space-y-4 py-4">
// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="editName">Company Name</Label>
// 									<Input
// 										id="editName"
// 										value={selectedCompany.name}
// 										onChange={(e) =>
// 											setSelectedCompany({
// 												...selectedCompany,
// 												name: e.target.value,
// 											})
// 										}
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editType">Company Type</Label>
// 									<Select
// 										value={selectedCompany.type}
// 										onValueChange={(value) =>
// 											setSelectedCompany({ ...selectedCompany, type: value })
// 										}>
// 										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											{companyTypes.map((type) => (
// 												<SelectItem key={type} value={type}>
// 													{type}
// 												</SelectItem>
// 											))}
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="editIndustry">Industry</Label>
// 									<Input
// 										id="editIndustry"
// 										value={selectedCompany.industry}
// 										onChange={(e) =>
// 											setSelectedCompany({
// 												...selectedCompany,
// 												industry: e.target.value,
// 											})
// 										}
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editEmail">Email</Label>
// 									<Input
// 										id="editEmail"
// 										type="email"
// 										value={selectedCompany.email}
// 										onChange={(e) =>
// 											setSelectedCompany({
// 												...selectedCompany,
// 												email: e.target.value,
// 											})
// 										}
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="editPhone">Phone Number</Label>
// 									<Input
// 										id="editPhone"
// 										value={selectedCompany.phone}
// 										onChange={(e) =>
// 											setSelectedCompany({
// 												...selectedCompany,
// 												phone: e.target.value,
// 											})
// 										}
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editWebsite">Website</Label>
// 									<Input
// 										id="editWebsite"
// 										value={selectedCompany.website || ""}
// 										onChange={(e) =>
// 											setSelectedCompany({
// 												...selectedCompany,
// 												website: e.target.value,
// 											})
// 										}
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="editAddress">Address</Label>
// 								<Input
// 									id="editAddress"
// 									value={selectedCompany.address}
// 									onChange={(e) =>
// 										setSelectedCompany({
// 											...selectedCompany,
// 											address: e.target.value,
// 										})
// 									}
// 									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 								/>
// 							</div>

// 							<div className="grid grid-cols-2 gap-4">
// 								<div className="space-y-2">
// 									<Label htmlFor="editCity">City</Label>
// 									<Input
// 										id="editCity"
// 										value={selectedCompany.city}
// 										onChange={(e) =>
// 											setSelectedCompany({
// 												...selectedCompany,
// 												city: e.target.value,
// 											})
// 										}
// 										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editCountry">Country</Label>
// 									<Select
// 										value={selectedCompany.country}
// 										onValueChange={(value) =>
// 											setSelectedCompany({ ...selectedCompany, country: value })
// 										}>
// 										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 											<SelectValue />
// 										</SelectTrigger>
// 										<SelectContent>
// 											<SelectItem value="Ethiopia">Ethiopia</SelectItem>
// 											<SelectItem value="Kenya">Kenya</SelectItem>
// 											<SelectItem value="Uganda">Uganda</SelectItem>
// 											<SelectItem value="Tanzania">Tanzania</SelectItem>
// 										</SelectContent>
// 									</Select>
// 								</div>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="editStatus">Status</Label>
// 								<Select
// 									value={selectedCompany.status}
// 									onValueChange={(value: "active" | "inactive" | "pending") =>
// 										setSelectedCompany({ ...selectedCompany, status: value })
// 									}>
// 									<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
// 										<SelectValue />
// 									</SelectTrigger>
// 									<SelectContent>
// 										<SelectItem value="active">Active</SelectItem>
// 										<SelectItem value="inactive">Inactive</SelectItem>
// 										<SelectItem value="pending">Pending</SelectItem>
// 									</SelectContent>
// 								</Select>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor="editDescription">Description</Label>
// 								<Textarea
// 									id="editDescription"
// 									value={selectedCompany.description}
// 									onChange={(e) =>
// 										setSelectedCompany({
// 											...selectedCompany,
// 											description: e.target.value,
// 										})
// 									}
// 									rows={3}
// 									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
// 								/>
// 							</div>
// 						</div>
// 					)}
// 					<div className="flex justify-end space-x-2">
// 						<Button
// 							variant="outline"
// 							onClick={() => setIsEditDialogOpen(false)}
// 							disabled={updating}>
// 							Cancel
// 						</Button>
// 						<Button
// 							onClick={handleUpdateCompany}
// 							disabled={updating}
// 							className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
// 							{updating ? (
// 								<>
// 									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
// 									Updating...
// 								</>
// 							) : (
// 								"Update Company"
// 							)}
// 						</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>
// 		</div>
// 	);
// }
