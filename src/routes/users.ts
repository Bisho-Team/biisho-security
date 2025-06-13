import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
	authenticate,
	authorize,
	type AuthRequest,
	hashPassword,
} from "../lib/auth";

const router = express.Router();
const prisma = new PrismaClient();

const createUserSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1),
	password: z.string().min(6),
	role: z.enum(["OFFICE_MANAGER", "POLICE_MANAGER", "OPERATOR"]).optional(),
	companyId: z.string().optional(),
	operatorType: z.enum(["OFFICE", "POLICE"]).optional(),
	assignedBranches: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
	name: z.string().min(1).optional(),
	companyId: z.string().optional(),
	status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
	assignedBranches: z.array(z.string()).optional(),
});

// Get all users (Super Admin only)
router.get(
	"/",
	authenticate,
	authorize("SUPER_ADMIN"),
	async (req: AuthRequest, res) => {
		try {
			const { page = 1, limit = 10, role, status, search } = req.query;

			const where: any = {};

			if (role) where.role = role;
			if (status) where.status = status;
			if (search) {
				where.OR = [
					{ name: { contains: search as string, mode: "insensitive" } },
					{ email: { contains: search as string, mode: "insensitive" } },
				];
			}

			const users = await prisma.user.findMany({
				where,
				include: {
					company: true,
					managedBy: {
						select: { id: true, name: true, email: true },
					},
					_count: {
						select: {
							managedUsers: true,
							// assignedBranches: true,
						},
					},
				},
				skip: (Number(page) - 1) * Number(limit),
				take: Number(limit),
				orderBy: { createdAt: "desc" },
			});

			const total = await prisma.user.count({ where });

			const usersWithoutPasswords = users.map(({ password, ...user }) => user);

			res.json({
				users: usersWithoutPasswords,
				pagination: {
					page: Number(page),
					limit: Number(limit),
					total,
					pages: Math.ceil(total / Number(limit)),
				},
			});
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch users" });
		}
	}
);

// Get users by manager (Office/Police Managers)
router.get(
	"/my-operators",
	authenticate,
	authorize("OFFICE_MANAGER", "POLICE_MANAGER"),
	async (req: AuthRequest, res) => {
		try {
			const operators = await prisma.user.findMany({
				where: {
					managedById: req.user!.id,
					role: "OPERATOR",
				},
				// include: {
				// 	assignedBranches: {
				// 		include: {
				// 			branch: true,
				// 		},
				// 	},
				// },
				orderBy: { createdAt: "desc" },
			});

			const operatorsWithoutPasswords = operators.map(
				({ password, ...operator }) => operator
			);

			res.json(operatorsWithoutPasswords);
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch operators" });
		}
	}
);

// Get users by manager (Office/Police Managers)
router.get(
	"/police-managers",
	authenticate,
	authorize("OFFICE_MANAGER", "POLICE_MANAGER"),
	async (req: AuthRequest, res) => {
		try {
			const operators = await prisma.user.findMany({
				where: {
					role: "POLICE_MANAGER",
				},
				// include: {
				// 	assignedBranches: {
				// 		include: {
				// 			branch: true,
				// 		},
				// 	},
				// },
				orderBy: { createdAt: "desc" },
			});

			const operatorsWithoutPasswords = operators.map(
				({ password, ...operator }) => operator
			);

			res.json(operatorsWithoutPasswords);
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch operators" });
		}
	}
);

// Create user
router.post("/", authenticate, async (req: AuthRequest, res) => {
	try {
		const data = createUserSchema.parse(req.body);

		console.log("Creating user with data:", data);

		// Authorization checks
		if (req.user?.role === "SUPER_ADMIN") {
			// Super admin can create anyone
		} else if (
			req.user?.role === "OFFICE_MANAGER" ||
			req.user?.role === "POLICE_MANAGER"
		) {
			// Managers can only create operators
			if (data.role !== "OPERATOR") {
				return res.status(403).json({ error: "You can only create operators" });
			}
		} else {
			return res.status(403).json({ error: "Insufficient permissions" });
		}

		const hashedPassword = await hashPassword(data.password);

		const userData: any = {
			email: data.email,
			name: data.name,
			password: hashedPassword,
			role: data.role,
			companyId: data.companyId || req.user?.companyId,
		};

		console.log("User data before creating:", userData);

		// Set manager for operators
		if (data.role === "OPERATOR") {
			userData.managedById = req.user!.id;
			userData.operatorType = data.operatorType;
		}

		const user = await prisma.user.create({
			data: userData,
			include: {
				company: true,
				managedBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		// Assign branches to operator
		if (data.role === "OPERATOR" && data.companyId) {
			// await prisma.branchOperator.createMany({
			// 	data: data.assignedBranches.map((branchId) => ({
			// 		userId: user.id,
			// 		branchId,
			// 	})),
			// });
			await prisma.companyOperator.create({
				data: {
					operatorId: user.id,
					companyId: data.companyId,
				},
			});
		}

		const { password: _, ...userWithoutPassword } = user;

		res.status(201).json({
			message: "User created successfully",
			user: userWithoutPassword,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ error: "Validation failed", details: error.errors });
		}
		console.error("Error creating user:", error);
		res.status(500).json({ error: "Failed to create user" });
	}
});

// Update user
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
	try {
		const { id } = req.params;
		const data = updateUserSchema.parse(req.body);

		// Check if user exists and permissions
		const existingUser = await prisma.user.findUnique({
			where: { id },
		});

		if (!existingUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// Authorization checks
		if (req.user?.role !== "SUPER_ADMIN") {
			if (existingUser.managedById !== req.user?.id) {
				return res
					.status(403)
					.json({ error: "You can only update users you manage" });
			}
		}

		const user = await prisma.user.update({
			where: { id },
			data: {
				name: data.name,
				status: data.status,
			},
			include: {
				company: true,
				managedBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		// Update company assignment for operator
		if (existingUser.role === "OPERATOR") {
			// Remove existing company assignment
			await prisma.companyOperator.deleteMany({
				where: { operatorId: id },
			});

			// Assign new company (if provided)
			if (data.companyId) {
				await prisma.companyOperator.create({
					data: {
						operatorId: id,
						companyId: data.companyId,
					},
				});
			}
		}

		// // Update branch assignments for operators
		// if (data.assignedBranches && existingUser.role === "OPERATOR") {
		// 	await prisma.branchOperator.deleteMany({
		// 		where: { userId: id },
		// 	});

		// 	if (data.assignedBranches.length > 0) {
		// 		await prisma.branchOperator.createMany({
		// 			data: data.assignedBranches.map((branchId) => ({
		// 				userId: id,
		// 				branchId,
		// 			})),
		// 		});
		// 	}
		// }

		const { password: _, ...userWithoutPassword } = user;

		res.json({
			message: "User updated successfully",
			user: userWithoutPassword,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ error: "Validation failed", details: error.errors });
		}
		res.status(500).json({ error: "Failed to update user" });
	}
});

// Delete user
router.delete(
	"/:id",
	authenticate,
	authorize("SUPER_ADMIN"),
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			await prisma.user.delete({
				where: { id },
			});

			res.json({ message: "User deleted successfully" });
		} catch (error) {
			res.status(500).json({ error: "Failed to delete user" });
		}
	}
);

export default router;
