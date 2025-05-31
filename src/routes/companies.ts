import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, type AuthRequest } from "../lib/auth";
import { upload } from "../lib/multer";
// import multer from "multer";
// const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const prisma = new PrismaClient();

const createCompanySchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
});

const updateCompanySchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

// Get all companies (Super Admin only)
router.get(
	"/",
	authenticate,
	authorize("SUPER_ADMIN"),
	async (req: AuthRequest, res) => {
		try {
			const companies = await prisma.company.findMany({
				include: {
					users: true,
					_count: {
						select: {
							users: true,
							branches: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			});

			const formatted = companies.map((company) => ({
				id: company.id,
				name: company.name,
				logo: company.logo ?? "", // ✅ Logo
				type: company.type ?? "N/A",
				industry: company.industry ?? "N/A",
				address: company.address ?? "N/A",
				city: company.city ?? "N/A",
				country: company.country ?? "Ethiopia",
				phone: company.phone ?? "N/A",
				email: company.email ?? "N/A",
				website: undefined, // You can add this to schema later
				description: company.description ?? "",
				status: company.status.toLowerCase() as
					| "active"
					| "inactive"
					| "pending",
				createdAt: company.createdAt.toISOString(),
				officeManagersCount: company.users.filter(
					(u) => u.role === "OFFICE_MANAGER"
				).length,
				branchesCount: company._count.branches,
				totalOperators: company.users.filter((u) => u.role === "OPERATOR")
					.length,
				lastActivity: undefined, // Placeholder for now
			}));

			res.json(formatted);
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch companies" });
		}
	}
);

router.get(
	"/:id",
	authenticate,
	authorize("SUPER_ADMIN"),
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			const company = await prisma.company.findUnique({
				where: { id },
				include: {
					users: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
							status: true,
							createdAt: true,
						},
					},
					branches: {
						select: {
							id: true,
							name: true,
							city: true,
							status: true,
							createdAt: true,
						},
					},
				},
			});

			if (!company) {
				return res.status(404).json({ error: "Company not found" });
			}

			res.json(company);
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch company" });
		}
	}
);

// Create company
router.post(
	"/",
	authenticate,
	authorize("SUPER_ADMIN"),
	upload.single("logo"), // <- This line enables handling file upload
	async (req: AuthRequest, res) => {
		try {
			console.log("req.body:", req.body); // form text fields
			console.log("req.file:", req.file); // file info

			const {
				name,
				type,
				industry,
				address,
				city,
				country,
				phone,
				email,
				website,
				description,
			} = req.body;

			// Now req.body will contain all fields from formData
			// You may also need to parse numeric fields manually

			const data = {
				name,
				type,
				industry,
				address,
				city,
				country,
				phone,
				email,
				website,
				description,
				// You can handle logo upload storage from req.file here
			};

			const company = await prisma.company.create({ data });

			res.status(201).json({
				message: "Company created successfully",
				company,
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Failed to create company" });
		}
	}
);
// router.post(
// 	"/",
// 	authenticate,
// 	authorize("SUPER_ADMIN"),
// 	upload.single("logo"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			console.log("req.body:", req.body); // text fields
// 			console.log("req.file:", req.file); // file field
// 			const data = createCompanySchema.parse(req.body);

// 			const company = await prisma.company.create({
// 				data,
// 			});

// 			res.status(201).json({
// 				message: "Company created successfully",
// 				company,
// 			});
// 		} catch (error) {
// 			if (error instanceof z.ZodError) {
// 				return res
// 					.status(400)
// 					.json({ error: "Validation failed", details: error.errors });
// 			}
// 			res.status(500).json({ error: "Failed to create company" });
// 		}
// 	}
// );

// Update company
router.put(
	"/:id",
	authenticate,
	authorize("SUPER_ADMIN"),
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;
			const data = updateCompanySchema.parse(req.body);

			const company = await prisma.company.update({
				where: { id },
				data,
			});

			res.json({
				message: "Company updated successfully",
				company,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ error: "Validation failed", details: error.errors });
			}
			res.status(500).json({ error: "Failed to update company" });
		}
	}
);

// Delete company
router.delete(
	"/:id",
	authenticate,
	authorize("SUPER_ADMIN"),
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			await prisma.company.delete({
				where: { id },
			});

			res.json({ message: "Company deleted successfully" });
		} catch (error) {
			res.status(500).json({ error: "Failed to delete company" });
		}
	}
);

export default router;
