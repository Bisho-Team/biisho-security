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
	Globe,
	Building2,
	Shield,
	Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import Image from "next/image";

interface Company {
	id: string;
	name: string;
	type: string;
	logo: string;
	industry: string;
	address: string;
	city: string;
	country: string;
	phone: string;
	email: string;
	website?: string;
	description: string;
	status: "active" | "inactive" | "pending";
	createdAt: string;
	officeManagersCount: number;
	branchesCount: number;
	totalOperators: number;
	lastActivity?: string;
}

const companyTypes = [
	"Banking",
	"Insurance",
	"Healthcare",
	"Education",
	"Government",
	"Manufacturing",
	"Retail",
	"Technology",
	"Real Estate",
	"Transportation",
	"Other",
];

export default function CompaniesPage() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const { toast } = useToast();
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const NEXT_PUBLIC_API_URL = "http://167.235.24.44:3003";

	const [newCompany, setNewCompany] = useState({
		name: "",
		type: "",
		industry: "",
		address: "",
		city: "",
		country: "Ethiopia",
		phone: "",
		email: "",
		website: "",
		description: "",
		logo: null as File | null,
	});

	useEffect(() => {
		fetchCompanies();
	}, []);

	const fetchCompanies = async () => {
		try {
			setLoading(true);
			const response = await apiService.get("/companies");
			console.log("Fetched companies:", response);
			setCompanies((response as any).companies as any);
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
		if (!newCompany.name || !newCompany.type || !newCompany.email) return;

		try {
			setCreating(true);
			const formData = new FormData();
			formData.append("name", newCompany.name);
			formData.append("type", newCompany.type);
			formData.append("industry", newCompany.industry);
			formData.append("address", newCompany.address);
			formData.append("city", newCompany.city);
			formData.append("country", newCompany.country);
			formData.append("phone", newCompany.phone);
			formData.append("email", newCompany.email);
			formData.append("website", newCompany.website);
			formData.append("description", newCompany.description);
			if (newCompany.logo) {
				formData.append("logo", newCompany.logo);
			}

			const token = localStorage.getItem("authToken");

			// await apiService.post("/companies", formData);
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
				type: "",
				industry: "",
				address: "",
				city: "",
				country: "Ethiopia",
				phone: "",
				email: "",
				website: "",
				description: "",
				logo: null,
			});
			setIsCreateDialogOpen(false);
			fetchCompanies();
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
				website: selectedCompany.website,
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

			const newStatus = company.status === "active" ? "inactive" : "active";
			await apiService.put(`/companies/${companyId}`, { status: newStatus });

			toast({
				title: "Success",
				description: `Company ${
					newStatus === "active" ? "activated" : "deactivated"
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
			case "active":
				return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
			case "inactive":
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
			case "pending":
				return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0";
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
			default:
				return "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0";
		}
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	if (loading) {
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
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="type">Company Type *</Label>
									<Select
										value={newCompany.type}
										onValueChange={(value) =>
											setNewCompany({ ...newCompany, type: value })
										}>
										<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											{companyTypes.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="industry">Industry</Label>
									<Input
										id="industry"
										value={newCompany.industry}
										onChange={(e) =>
											setNewCompany({ ...newCompany, industry: e.target.value })
										}
										placeholder="e.g., Financial Services"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
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
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number</Label>
									<Input
										id="phone"
										value={newCompany.phone}
										onChange={(e) =>
											setNewCompany({ ...newCompany, phone: e.target.value })
										}
										placeholder="+251115517438"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="website">Website</Label>
									<Input
										id="website"
										value={newCompany.website}
										onChange={(e) =>
											setNewCompany({ ...newCompany, website: e.target.value })
										}
										placeholder="www.company.com"
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="address">Address</Label>
								<Input
									id="address"
									value={newCompany.address}
									onChange={(e) =>
										setNewCompany({ ...newCompany, address: e.target.value })
									}
									placeholder="Street address"
									className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
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
								<Label htmlFor="logo">Company Logo</Label>
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
								/>
							</div>
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
									!newCompany.type ||
									!newCompany.email ||
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
						<div className="text-2xl font-bold">{companies.length}</div>
						<p className="text-xs text-muted-foreground">
							{companies.filter((c) => c.status === "active").length} active
						</p>
					</CardContent>
				</Card>
				<Card
					className="animate-slide-up glass"
					style={{ animationDelay: "0.2s" }}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Office Managers
						</CardTitle>
						<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
							<Users className="h-4 w-4 text-green-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{companies.reduce(
								(sum, company) => sum + company.officeManagersCount,
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
								(sum, company) => sum + company.branchesCount,
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
							Total Operators
						</CardTitle>
						<div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
							<Shield className="h-4 w-4 text-orange-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">
							{companies.reduce(
								(sum, company) => sum + company.totalOperators,
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
							{companyTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
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
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Enhanced Company List */}
			<div className="grid gap-6">
				{filteredCompanies.map((company, index) => (
					<Card
						key={company.id}
						className="animate-slide-up glass hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
						style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
						<CardContent className="p-6">
							<div className="flex items-start justify-between">
								<div className="flex items-start space-x-4">
									{/* <div className="relative">
										<div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
											<Building className="h-8 w-8 text-white" />
										</div>
										<div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
									</div> */}

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
										<div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
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
											{company.website && (
												<span className="flex items-center text-muted-foreground hover:text-primary transition-colors">
													<Globe className="h-4 w-4 mr-2" />
													{company.website}
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
													{company.officeManagersCount}
												</p>
												<p className="text-xs text-muted-foreground">
													Managers
												</p>
											</div>
											<div className="text-center">
												<div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 mb-1">
													<Building2 className="h-4 w-4 text-green-500 mx-auto" />
												</div>
												<p className="font-bold text-green-600">
													{company.branchesCount}
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
													{company.totalOperators}
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
										{company.lastActivity && (
											<div className="text-xs text-muted-foreground flex items-center justify-end">
												<Activity className="h-3 w-3 mr-1" />
												Last activity: {formatDateTime(company.lastActivity)}
											</div>
										)}
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
												View Details
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={() => {
													setSelectedCompany(company);
													setIsEditDialogOpen(true);
												}}>
												<Edit className="h-4 w-4 mr-2" />
												Edit Company
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={() => toggleCompanyStatus(company.id)}>
												{company.status === "active"
													? "Deactivate"
													: "Activate"}
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
									{/* <Building className="h-8 w-8 text-white" /> */}
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
											{selectedCompany.website && (
												<div className="flex items-center gap-2">
													<Globe className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm">
														{selectedCompany.website}
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
													{selectedCompany.officeManagersCount}
												</p>
												<p className="text-xs text-muted-foreground">
													Managers
												</p>
											</div>
											<div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
												<Building2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
												<p className="text-lg font-bold text-green-600">
													{selectedCompany.branchesCount}
												</p>
												<p className="text-xs text-muted-foreground">
													Branches
												</p>
											</div>
											<div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
												<Shield className="h-5 w-5 text-purple-500 mx-auto mb-1" />
												<p className="text-lg font-bold text-purple-600">
													{selectedCompany.totalOperators}
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
											{selectedCompany.lastActivity && (
												<div className="flex items-center gap-2">
													<Activity className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm">
														Last Activity:{" "}
														{formatDateTime(selectedCompany.lastActivity)}
													</span>
												</div>
											)}
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
											{companyTypes.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
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
									<Label htmlFor="editWebsite">Website</Label>
									<Input
										id="editWebsite"
										value={selectedCompany.website || ""}
										onChange={(e) =>
											setSelectedCompany({
												...selectedCompany,
												website: e.target.value,
											})
										}
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
									/>
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
								<Label htmlFor="editStatus">Status</Label>
								<Select
									value={selectedCompany.status}
									onValueChange={(value: "active" | "inactive" | "pending") =>
										setSelectedCompany({ ...selectedCompany, status: value })
									}>
									<SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Active</SelectItem>
										<SelectItem value="inactive">Inactive</SelectItem>
										<SelectItem value="pending">Pending</SelectItem>
									</SelectContent>
								</Select>
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
// 	TrendingUp,
// 	Loader2,
// } from "lucide-react";

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
// 		logo: null as File | null, // ✅ New field
// 	});

// 	useEffect(() => {
// 		fetchCompanies();
// 	}, []);

// 	const fetchCompanies = async () => {
// 		try {
// 			setLoading(true);
// 			const response = await apiService.get("/companies");
// 			console.log("Fetched companies:", response);
// 			setCompanies(response as any);
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

// 			for (let pair of formData.entries()) {
// 				console.log(`${pair[0]}:`, pair[1]);
// 			}

// 			await apiService.post("/companies", formData);

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
// 				return "bg-green-100 text-green-800";
// 			case "inactive":
// 				return "bg-gray-100 text-gray-800";
// 			case "pending":
// 				return "bg-yellow-100 text-yellow-800";
// 			default:
// 				return "bg-gray-100 text-gray-800";
// 		}
// 	};

// 	const getTypeColor = (type: string) => {
// 		switch (type) {
// 			case "Banking":
// 				return "bg-blue-100 text-blue-800";
// 			case "Insurance":
// 				return "bg-purple-100 text-purple-800";
// 			case "Healthcare":
// 				return "bg-red-100 text-red-800";
// 			case "Education":
// 				return "bg-green-100 text-green-800";
// 			case "Government":
// 				return "bg-gray-100 text-gray-800";
// 			default:
// 				return "bg-orange-100 text-orange-800";
// 		}
// 	};

// 	const formatDateTime = (dateString: string) => {
// 		return new Date(dateString).toLocaleString();
// 	};

// 	if (loading) {
// 		return (
// 			<div className="space-y-6">
// 				<div className="flex justify-between items-center">
// 					<div>
// 						<Skeleton className="h-8 w-64" />
// 						<Skeleton className="h-4 w-96 mt-2" />
// 					</div>
// 					<Skeleton className="h-10 w-32" />
// 				</div>
// 				<div className="grid gap-4 md:grid-cols-4">
// 					{[...Array(4)].map((_, i) => (
// 						<Card key={i}>
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
// 		<div className="space-y-6">
// 			<div className="flex justify-between items-center">
// 				<div>
// 					<h1 className="text-3xl font-bold tracking-tight">
// 						Company Management
// 					</h1>
// 					<p className="text-muted-foreground">
// 						Manage companies and their security operations
// 					</p>
// 				</div>
// 				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
// 					<DialogTrigger asChild>
// 						<Button>
// 							<Plus className="h-4 w-4 mr-2" />
// 							Create Company
// 						</Button>
// 					</DialogTrigger>
// 					<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
// 						<DialogHeader>
// 							<DialogTitle>Create New Company</DialogTitle>
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
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="type">Company Type *</Label>
// 									<Select
// 										value={newCompany.type}
// 										onValueChange={(value) =>
// 											setNewCompany({ ...newCompany, type: value })
// 										}>
// 										<SelectTrigger>
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
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="country">Country</Label>
// 									<Select
// 										value={newCompany.country}
// 										onValueChange={(value) =>
// 											setNewCompany({ ...newCompany, country: value })
// 										}>
// 										<SelectTrigger>
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
// 								/>
// 							</div>
// 							<Input
// 								id="logo"
// 								type="file"
// 								accept="image/*"
// 								onChange={(e) =>
// 									setNewCompany({
// 										...newCompany,
// 										logo: e.target.files?.[0] ?? null,
// 									})
// 								}
// 							/>
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
// 								}>
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

// 			{/* Overview Cards */}
// 			<div className="grid gap-4 md:grid-cols-4">
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Companies
// 						</CardTitle>
// 						<Building className="h-4 w-4 text-muted-foreground" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold">{companies.length}</div>
// 						<p className="text-xs text-muted-foreground">
// 							{companies.filter((c) => c.status === "active").length} active
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Office Managers
// 						</CardTitle>
// 						<Users className="h-4 w-4 text-blue-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-blue-600">
// 							{companies.reduce(
// 								(sum, company) => sum + company.officeManagersCount,
// 								0
// 							)}
// 						</div>
// 						<p className="text-xs text-muted-foreground">
// 							Across all companies
// 						</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Branches
// 						</CardTitle>
// 						<Building className="h-4 w-4 text-green-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-green-600">
// 							{companies.reduce(
// 								(sum, company) => sum + company.branchesCount,
// 								0
// 							)}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Security locations</p>
// 					</CardContent>
// 				</Card>
// 				<Card>
// 					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Total Operators
// 						</CardTitle>
// 						<TrendingUp className="h-4 w-4 text-purple-500" />
// 					</CardHeader>
// 					<CardContent>
// 						<div className="text-2xl font-bold text-purple-600">
// 							{companies.reduce(
// 								(sum, company) => sum + company.totalOperators,
// 								0
// 							)}
// 						</div>
// 						<p className="text-xs text-muted-foreground">Security personnel</p>
// 					</CardContent>
// 				</Card>
// 			</div>

// 			{/* Search and Filters */}
// 			<div className="flex justify-between items-center space-x-4">
// 				<div className="flex space-x-2">
// 					<div className="relative">
// 						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
// 						<Input
// 							placeholder="Search companies..."
// 							value={searchTerm}
// 							onChange={(e) => setSearchTerm(e.target.value)}
// 							className="pl-8 w-64"
// 						/>
// 					</div>
// 					<Select value={filterType} onValueChange={setFilterType}>
// 						<SelectTrigger className="w-40">
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
// 						<SelectTrigger className="w-40">
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

// 			{/* Company List */}
// 			<div className="grid gap-6">
// 				{filteredCompanies.map((company) => (
// 					<Card key={company.id}>
// 						<CardContent className="p-6">
// 							<div className="flex items-start justify-between">
// 								<div className="flex items-start space-x-4">
// 									<div className="p-3 bg-blue-100 rounded-lg">
// 										<Building className="h-6 w-6 text-blue-600" />
// 									</div>
// 									<div className="space-y-2">
// 										<div>
// 											<h3 className="text-lg font-semibold">{company.name}</h3>
// 											<p className="text-sm text-gray-600">
// 												{company.industry}
// 											</p>
// 										</div>
// 										<div className="flex items-center space-x-1 text-sm text-gray-500">
// 											<MapPin className="h-3 w-3" />
// 											<span>
// 												{company.address}, {company.city}, {company.country}
// 											</span>
// 										</div>
// 										<div className="flex items-center space-x-4 text-sm">
// 											<span className="flex items-center text-gray-500">
// 												<Mail className="h-3 w-3 mr-1" />
// 												{company.email}
// 											</span>
// 											{company.phone && (
// 												<span className="flex items-center text-gray-500">
// 													<Phone className="h-3 w-3 mr-1" />
// 													{company.phone}
// 												</span>
// 											)}
// 										</div>
// 										<div className="flex items-center space-x-2">
// 											<Badge className={getTypeColor(company.type)}>
// 												{company.type}
// 											</Badge>
// 											<Badge className={getStatusColor(company.status)}>
// 												{company.status}
// 											</Badge>
// 										</div>
// 									</div>
// 								</div>
// 								<div className="flex items-start space-x-4">
// 									<div className="text-right space-y-2">
// 										<div className="grid grid-cols-3 gap-4 text-sm">
// 											<div className="text-center">
// 												<p className="font-semibold text-blue-600">
// 													{company.officeManagersCount}
// 												</p>
// 												<p className="text-xs text-gray-500">Managers</p>
// 											</div>
// 											<div className="text-center">
// 												<p className="font-semibold text-green-600">
// 													{company.branchesCount}
// 												</p>
// 												<p className="text-xs text-gray-500">Branches</p>
// 											</div>
// 											<div className="text-center">
// 												<p className="font-semibold text-purple-600">
// 													{company.totalOperators}
// 												</p>
// 												<p className="text-xs text-gray-500">Operators</p>
// 											</div>
// 										</div>
// 										<div className="text-xs text-gray-400 flex items-center">
// 											<Calendar className="h-3 w-3 mr-1" />
// 											Created {new Date(company.createdAt).toLocaleDateString()}
// 										</div>
// 										{company.lastActivity && (
// 											<div className="text-xs text-gray-400">
// 												Last activity: {formatDateTime(company.lastActivity)}
// 											</div>
// 										)}
// 									</div>
// 									<DropdownMenu>
// 										<DropdownMenuTrigger asChild>
// 											<Button variant="outline" size="sm">
// 												<MoreHorizontal className="h-4 w-4" />
// 											</Button>
// 										</DropdownMenuTrigger>
// 										<DropdownMenuContent align="end">
// 											<DropdownMenuItem>
// 												<Eye className="h-4 w-4 mr-2" />
// 												View Details
// 											</DropdownMenuItem>
// 											<DropdownMenuItem
// 												onClick={() => {
// 													setSelectedCompany(company);
// 													setIsEditDialogOpen(true);
// 												}}>
// 												<Edit className="h-4 w-4 mr-2" />
// 												Edit Company
// 											</DropdownMenuItem>
// 											<DropdownMenuItem
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
// 								<div className="mt-4 p-3 bg-gray-50 rounded-lg">
// 									<p className="text-sm text-gray-700">{company.description}</p>
// 								</div>
// 							)}
// 						</CardContent>
// 					</Card>
// 				))}
// 			</div>

// 			{/* Edit Company Dialog */}
// 			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
// 				<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
// 					<DialogHeader>
// 						<DialogTitle>Edit Company</DialogTitle>
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
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editType">Company Type</Label>
// 									<Select
// 										value={selectedCompany.type}
// 										onValueChange={(value) =>
// 											setSelectedCompany({ ...selectedCompany, type: value })
// 										}>
// 										<SelectTrigger>
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
// 									/>
// 								</div>
// 								<div className="space-y-2">
// 									<Label htmlFor="editCountry">Country</Label>
// 									<Select
// 										value={selectedCompany.country}
// 										onValueChange={(value) =>
// 											setSelectedCompany({ ...selectedCompany, country: value })
// 										}>
// 										<SelectTrigger>
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
// 									<SelectTrigger>
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
// 						<Button onClick={handleUpdateCompany} disabled={updating}>
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
