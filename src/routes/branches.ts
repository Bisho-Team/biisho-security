import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, type AuthRequest } from "../lib/auth";

const router = express.Router();
const prisma = new PrismaClient();

const createBranchSchema = z.object({
	name: z.string().min(1),
	locationType: z.string().min(1),
	gpsAddress: z.string().optional(),
	city: z.string().min(1),
	subCity: z.string().optional(),
	woreda: z.string().optional(),
	country: z.string().default("Ethiopia"),
	managerName: z.string().min(1),
	phoneNumber: z.string().min(1),
	contactNumber1: z.string().optional(),
	contactNumber2: z.string().optional(),
	description: z.string().optional(),
});

const updateBranchSchema = z.object({
	name: z.string().min(1).optional(),
	locationType: z.string().min(1).optional(),
	gpsAddress: z.string().optional(),
	city: z.string().min(1).optional(),
	subCity: z.string().optional(),
	woreda: z.string().optional(),
	country: z.string().optional(),
	managerName: z.string().min(1).optional(),
	phoneNumber: z.string().min(1).optional(),
	contactNumber1: z.string().optional(),
	contactNumber2: z.string().optional(),
	description: z.string().optional(),
	status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
});

// Get branches
router.get("/", authenticate, async (req: AuthRequest, res) => {
	try {
		const where: any = {};

		console.log("User role:", req.user?.role);

		// Filter based on user role
		if (req.user?.role === "OFFICE_MANAGER") {
			where.createdById = req.user.id;
		} else if (req.user?.role === "OPERATOR") {
			// Get branches assigned to this operator
			const assignments = await prisma.branchOperator.findMany({
				where: { userId: req.user.id },
				select: { branchId: true },
			});
			where.id = { in: assignments.map((a) => a.branchId) };
		} else if (
			req.user?.role !== "SUPER_ADMIN" &&
			req.user?.role !== "POLICE_MANAGER"
		) {
			return res.status(403).json({ error: "Insufficient permissions" });
		}

		// Add company filter for non-super-admin users
		if (req.user?.role !== "SUPER_ADMIN" && req.user?.companyId) {
			where.companyId = req.user.companyId;
		}

		const branches = await prisma.branch.findMany({
			where,
			include: {
				company: {
					select: { id: true, name: true },
				},
				createdBy: {
					select: { id: true, name: true, email: true },
				},
				_count: {
					select: {
						operators: true,
						alarms: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		console.log("Branches fetched:", branches);

		res.json(branches);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch branches" });
	}
});

// Get branch by ID
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
	try {
		const { id } = req.params;

		const branch = await prisma.branch.findUnique({
			where: { id },
			include: {
				company: true,
				createdBy: {
					select: { id: true, name: true, email: true },
				},
				operators: {
					include: {
						user: {
							select: { id: true, name: true, email: true, status: true },
						},
					},
				},
				alarms: {
					orderBy: { createdAt: "desc" },
					take: 10,
				},
			},
		});

		if (!branch) {
			return res.status(404).json({ error: "Branch not found" });
		}

		// Check permissions
		if (
			req.user?.role !== "SUPER_ADMIN" &&
			req.user?.role !== "POLICE_MANAGER"
		) {
			if (
				branch.createdById !== req.user?.id &&
				req.user?.companyId !== branch.companyId
			) {
				return res.status(403).json({ error: "Access denied" });
			}
		}

		res.json(branch);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch branch" });
	}
});

// Create branch
router.post(
	"/",
	authenticate,
	authorize("OFFICE_MANAGER", "SUPER_ADMIN"),
	async (req: AuthRequest, res) => {
		try {
			const data = createBranchSchema.parse(req.body);

			const branch = await prisma.branch.create({
				data: {
					...data,
					companyId: req.user!.companyId!,
					createdById: req.user!.id,
				},
				include: {
					company: true,
					createdBy: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			res.status(201).json({
				message: "Branch created successfully",
				branch,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ error: "Validation failed", details: error.errors });
			}
			res.status(500).json({ error: "Failed to create branch" });
		}
	}
);

// Update branch
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
	try {
		const { id } = req.params;
		const data = updateBranchSchema.parse(req.body);

		// Check if branch exists and permissions
		const existingBranch = await prisma.branch.findUnique({
			where: { id },
		});

		if (!existingBranch) {
			return res.status(404).json({ error: "Branch not found" });
		}

		// Check permissions
		if (req.user?.role !== "SUPER_ADMIN") {
			if (existingBranch.createdById !== req.user?.id) {
				return res
					.status(403)
					.json({ error: "You can only update branches you created" });
			}
		}

		const branch = await prisma.branch.update({
			where: { id },
			data,
			include: {
				company: true,
				createdBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		res.json({
			message: "Branch updated successfully",
			branch,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ error: "Validation failed", details: error.errors });
		}
		res.status(500).json({ error: "Failed to update branch" });
	}
});

// Delete branch
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
	try {
		const { id } = req.params;

		// Check if branch exists and permissions
		const existingBranch = await prisma.branch.findUnique({
			where: { id },
		});

		if (!existingBranch) {
			return res.status(404).json({ error: "Branch not found" });
		}

		// Check permissions
		if (req.user?.role !== "SUPER_ADMIN") {
			if (existingBranch.createdById !== req.user?.id) {
				return res
					.status(403)
					.json({ error: "You can only delete branches you created" });
			}
		}

		await prisma.branch.delete({
			where: { id },
		});

		res.json({ message: "Branch deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: "Failed to delete branch" });
	}
});

export default router;
