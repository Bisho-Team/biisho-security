import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
	hashPassword,
	comparePassword,
	generateToken,
	authenticate,
	type AuthRequest,
} from "../lib/auth";

const router = express.Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

const registerSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1),
	password: z.string().min(6),
	role: z.enum(["OFFICE_MANAGER", "POLICE_MANAGER"]),
	companyId: z.string().optional(),
	comapany:z.string().optional(),
});

// Login
router.post("/login", async (req, res) => {
	try {
		const { email, password } = loginSchema.parse(req.body);

		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				company: true,
				managedBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		if (!user || !(await comparePassword(password, user.password))) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		if (user.status !== "ACTIVE") {
			return res.status(401).json({ error: "Account is not active" });
		}

		const token = generateToken({
			id: user.id,
			email: user.email,
			role: user.role,
			roleType: user.operatorType ? user.operatorType : "",
			companyName:(user)?.company?.name,
			companyLogo:(user)?.company?.logo,
		});
		const { password: _, ...userWithoutPassword } = user;

		res.json({
			token,
			user: userWithoutPassword,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ error: "Validation failed", details: error.errors });
		}
		res.status(500).json({ error: "Login failed" });
	}
});

// Register (for super admin to create managers)
router.post("/register", authenticate, async (req: AuthRequest, res) => {
	try {
		// Only super admin can register new managers
		if (req.user?.role !== "SUPER_ADMIN") {
			return res
				.status(403)
				.json({ error: "Only super admin can create new managers" });
		}

		const { email, name, password, role, companyId } = registerSchema.parse(
			req.body
		);

		const hashedPassword = await hashPassword(password);

		const user = await prisma.user.create({
			data: {
				email,
				name,
				password: hashedPassword,
				role: role as any,
				companyId,
			},
			include: {
				company: true,
			},
		});

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
		res.status(500).json({ error: "Registration failed" });
	}
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user!.id },
			include: {
				company: true,
				managedBy: {
					select: { id: true, name: true, email: true },
				},
				// assignedBranches: {
				// 	include: {
				// 		branch: true,
				// 	},
				// },
			},
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const { password: _, ...userWithoutPassword } = user;

		res.json(userWithoutPassword);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch user data" });
	}
});

export default router;
