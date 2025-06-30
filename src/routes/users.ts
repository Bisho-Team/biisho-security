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
	phone:z.string().optional(),
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
router.get("/", authenticate, authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"), async (req, res) => {
	try {
	  const { page = 1, limit = 10, role, status, search, operatorType } = req.query
  
	  const where: any = {}
  
	  // Role filtering
	  if (role && role !== "all") {
		where.role = role
	  }
  
	  // Status filtering
	  if (status && status !== "all") {
		where.status = status
	  }
  
	  // Operator type filtering for OPERATOR role
	  if (operatorType && operatorType !== "all") {
		where.operatorType = operatorType
	  }
  
	  // Search functionality
	  if (typeof search === "string" && search.trim() !== "") {
		where.OR = [
		  { name: { contains: search, mode: "insensitive" } },
		  { email: { contains: search, mode: "insensitive" } },
		  { phone: { contains: search, mode: "insensitive" } },
		]
	  }
  
	  // Get total count for pagination
	  const total = await prisma.user.count({ where })
  
	  // Calculate pagination values
	  const pageNum = Math.max(1, Number(page))
	  const limitNum = Math.max(1, Math.min(100, Number(limit))) // Max 100 per page
	  const skip = (pageNum - 1) * limitNum
	  const totalPages = Math.ceil(total / limitNum)
  
	  // Fetch users with pagination
	  const users = await prisma.user.findMany({
		where,
		include: {
		  company: {
			select: {
			  id: true,
			  name: true,
			  type: true,
			  status: true,
			},
		  },
		  managedBy: {
			select: { id: true, name: true, email: true },
		  },
		  _count: {
			select: {
			  managedUsers: true,
			},
		  },
		},
		skip,
		take: limitNum,
		orderBy: { createdAt: "desc" },
	  })
  
	  // Remove passwords from response
	  const usersWithoutPasswords = users.map(({ password, ...user }) => user)
  
	  res.json({
		users: usersWithoutPasswords,
		pagination: {
		  page: pageNum,
		  limit: limitNum,
		  total,
		  pages: totalPages,
		  hasNext: pageNum < totalPages,
		  hasPrev: pageNum > 1,
		},
		filters: {
		  role: role || "all",
		  status: status || "all",
		  search: search || "",
		  operatorType: operatorType || "all",
		},
	  })
	} catch (error) {
	  console.error("Error fetching users:", error)
	  res.status(500).json({
		error: "Failed to fetch users",
		message: error instanceof Error ? error.message : String(error),
	  })
	}
  })
// router.get(
// 	"/",
// 	authenticate,
// 	authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			const { page = 1, limit = 10, role, status, search } = req.query;

// 			const where: any = {};

// 			if (role) where.role = role;
// 			if (status) where.status = status;
// 			if (search) {
// 				where.OR = [
// 					{ name: { contains: search as string, mode: "insensitive" } },
// 					{ email: { contains: search as string, mode: "insensitive" } },
// 				];
// 			}

// 			const users = await prisma.user.findMany({
// 				where,
// 				include: {
// 					company: true,
// 					managedBy: {
// 						select: { id: true, name: true, email: true },
// 					},
// 					_count: {
// 						select: {
// 							managedUsers: true,
// 							// assignedBranches: true,
// 						},
// 					},
// 				},
// 				skip: (Number(page) - 1) * Number(limit),
// 				take: Number(limit),
// 				orderBy: { createdAt: "desc" },
// 			});

// 			const total = await prisma.user.count({ where });

// 			const usersWithoutPasswords = users.map(({ password, ...user }) => user);

// 			res.json({
// 				users: usersWithoutPasswords,
// 				pagination: {
// 					page: Number(page),
// 					limit: Number(limit),
// 					total,
// 					pages: Math.ceil(total / Number(limit)),
// 				},
// 			});
// 		} catch (error) {
// 			res.status(500).json({ error: "Failed to fetch users" });
// 		}
// 	}
// );

router.get(
	"/filtered",
	authenticate,
	async (req: AuthRequest, res) => {
		try {
			const { page = 1, limit = 15, role, status, search, operatorType } = req.query;

			const where: any = {};

			// Handle multi-role filtering: e.g., role=POLICE_MANAGER,OPERATOR
			// if (role) {
			// 	const roles = (role as string).split(",");
			// 	where.role = { in: roles };
			// }
			if (role) {
				const roles = Array.isArray(role) ? role : (role as string).split(",");
			
				if (roles.includes("OPERATOR")) {
					where.OR = [
						{ role:role, operatorType:operatorType },
					];
				} else if (roles.includes("POLICE_MANAGER")) {
					where.role = "POLICE_MANAGER";
				}
			}
			
			// if (role) {
			// 	const roles = (role as string).split(",");
			// 	where.role = { in: roles };

			// 	console.log({
			// 		roles
			// 	})
			
			// 	// Only filter by operatorType if OPERATOR is included
			// 	if (roles.includes("OPERATOR") && operatorType) {
			// 		where.operatorType = operatorType;
			// 	}

			// 	if (roles.includes("POLICE_MANAGER")) {
			// 		where.role = "POLICE_MANAGER";
			// 	}
			// }

			if (status) {
				where.status = status;
			}

			if (operatorType) {
				where.operatorType = operatorType;
			}

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
						},
					},
				},
				// skip: (Number(page) - 1) * Number(limit),
				// take: Number(limit),
				orderBy: { createdAt: "desc" },
			});

			const total = await prisma.user.count({ where });

			const usersWithoutPasswords = users.map(({ password, ...u }) => u);

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
			console.error("Error fetching filtered users:", error);
			res.status(500).json({ error: "Failed to fetch users" });
		}
	}
);

// Get operators managed by current user
router.get("/my-operators", authenticate, authorize("OFFICE_MANAGER", "POLICE_MANAGER"), async (req:AuthRequest, res) => {
try {
	const operators = await prisma.user.findMany({
	where: {
		managedById: req.user!.id,
		role: "OPERATOR",
	},
	include: {
		company: {
		select: { id: true, name: true, status: true },
		},
		managedBy: {
		select: { id: true, name: true, email: true, role: true },
		},
		_count: {
		select: {
			managedUsers: true,
			createdAlarms: true,
			createdReports: true,
		},
		},
	},
	orderBy: { createdAt: "desc" },
	})

	const operatorsWithoutPasswords = operators.map(({ password, ...operator }) => operator)

	res.json(operatorsWithoutPasswords)
} catch (error) {
	console.error("Error fetching operators:", error)
	res.status(500).json({ error: "Failed to fetch operators" })
}
})

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
		console.log({
			req: req.body,
			manager:req.user
		})

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

		// ✅ Check if email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			return res.status(400).json({ error: "Email is already in use" });
		}

		const hashedPassword = await hashPassword(data.password);

		const userData: any = {
			email: data.email,
			name: data.name,
			phone:data.phone || "",
			password: hashedPassword,
			role: data.role,
			companyId: data.companyId || req.user?.companyId,
		};

		let userId= req.user!.id

		console.log("User data before creating:", {
			userData,
			userId
		});

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
		if (error) {
			return res
				.status(400)
				.json({ error: "Validation failed", details: error });
		}
		console.error("Error creating user:", error);
		res.status(500).json({ error: "Failed to create user" });
	}
});

router.put("/:id", authenticate, authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"), async (req: AuthRequest, res) => {
try {
	const { id } = req.params;
	const { name, email, operatorType, status } = req.body;
	const companyId = req.body.companyId || req.user?.companyId;

	const normalizedEmail = email?.trim().toLowerCase();

	console.log("🔧 Incoming update request", {
	requestUser: req.user,
	body: req.body,
	targetUserId: id,
	resolvedCompanyId: companyId,
	});

	// Check if user exists
	const existingUser = await prisma.user.findUnique({
	where: { id },
	});

	console.log({
	existingUser
	})
	if (!existingUser) {
	return res.status(404).json({ error: "User not found" });
	}

	// Access Control
	if (req.user!.role !== "SUPER_ADMIN") {
	const notOwner = existingUser.managedById !== req.user!.id;
	const notSameCompany = existingUser.companyId !== req.user!.companyId;
	if (notOwner && notSameCompany) {
		return res.status(403).json({ error: "Access denied" });
	}
	}

	// Check email uniqueness
	if (normalizedEmail && normalizedEmail !== existingUser.email?.toLowerCase()) {
	const emailExists = await prisma.user.findUnique({
		where: { email: normalizedEmail },
	});

	if (emailExists) {
		return res.status(400).json({ error: "Email already exists" });
	}
	}

	// Start transaction
	const [updatedUser] = await prisma.$transaction([
	prisma.user.update({
		where: { id },
		data: {
		name,
		email: normalizedEmail,
		operatorType: existingUser.role === "OPERATOR" ? operatorType : undefined,
		companyId: req.user!.role === "SUPER_ADMIN" ? companyId : undefined,
		status: status,
		},
		include: {
		company: { select: { id: true, name: true, status: true } },
		managedBy: { select: { id: true, name: true, email: true, role: true } },
		_count: {
			select: {
			managedUsers: true,
			createdAlarms: true,
			createdReports: true,
			},
		},
		},
	}),

	...(existingUser.role === "OPERATOR"
		? [
			prisma.companyOperator.deleteMany({ where: { operatorId: id } }),
			...(companyId
			? [
				prisma.companyOperator.create({
					data: { operatorId: id, companyId },
				}),
				]
			: []),
		]
		: []),
	]);

	const { password, ...userWithoutPassword } = updatedUser;
	res.json(userWithoutPassword);

} catch (error) {
	console.error("🔥 Error updating user:", error);
	res.status(500).json({ error: "Failed to update user" });
}
});

// Update user status
router.patch(
	"/:id/status",
	authenticate,
	authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"),
	async (req:AuthRequest, res) => {
	try {
		const { id } = req.params
		const { status } = req.body

		if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
		return res.status(400).json({ error: "Invalid status" })
		}

		const existingUser = await prisma.user.findUnique({
		where: { id },
		})

		if (!existingUser) {
		return res.status(404).json({ error: "User not found" })
		}

		// Role-based access control
		if (req.user!.role !== "SUPER_ADMIN") {
		if (existingUser.managedById !== req.user!.id && existingUser.companyId !== req.user!.companyId) {
			return res.status(403).json({ error: "Access denied" })
		}
		}

		const updatedUser = await prisma.user.update({
		where: { id },
		data: { status },
		include: {
			company: {
			select: { id: true, name: true, status: true },
			},
			managedBy: {
			select: { id: true, name: true, email: true, role: true },
			},
		},
		})

		const { password, ...userWithoutPassword } = updatedUser
		res.json(userWithoutPassword)
	} catch (error) {
		console.error("Error updating user status:", error)
		res.status(500).json({ error: "Failed to update user status" })
	}
	},
)
	
// Delete user
router.delete("/:id", authenticate, authorize("SUPER_ADMIN"), async (req, res) => {
try {
	const { id } = req.params

	const existingUser = await prisma.user.findUnique({
	where: { id },
	include: {
		_count: {
		select: {
			managedUsers: true,
			createdAlarms: true,
			createdReports: true,
		},
		},
	},
	})

	if (!existingUser) {
	return res.status(404).json({ error: "User not found" })
	}

	// Check if user has dependencies
	if (existingUser._count.managedUsers > 0) {
	return res.status(400).json({
		error: "Cannot delete user with managed operators. Please reassign them first.",
	})
	}

	// Delete company-operator relationships first
	await prisma.companyOperator.deleteMany({
	where: { operatorId: id },
	})

	// Delete the user
	await prisma.user.delete({
	where: { id },
	})

	res.json({ message: "User deleted successfully" })
} catch (error) {
	console.error("Error deleting user:", error)
	res.status(500).json({ error: "Failed to delete user" })
}
})

// Assign operator to company
router.post("/assign-company", authenticate, authorize("SUPER_ADMIN", "OFFICE_MANAGER"), async (req:AuthRequest, res) => {
try {
	const { operatorId, companyId } = req.body

	if (!operatorId || !companyId) {
	return res.status(400).json({ error: "Operator ID and Company ID are required" })
	}

	// Check if operator exists and is actually an operator
	const operator = await prisma.user.findUnique({
	where: { id: operatorId },
	})

	if (!operator || operator.role !== "OPERATOR") {
	return res.status(404).json({ error: "Operator not found" })
	}

	// Check if company exists
	const company = await prisma.company.findUnique({
	where: { id: companyId },
	})

	if (!company) {
	return res.status(404).json({ error: "Company not found" })
	}

	// Role-based access control
	if (req.user!.role === "OFFICE_MANAGER" && req.user!.companyId !== companyId) {
	return res.status(403).json({ error: "Access denied" })
	}

	// Check if assignment already exists
	const existingAssignment = await prisma.companyOperator.findUnique({
	where: {
		companyId_operatorId: {
		companyId,
		operatorId,
		},
	},
	})

	if (existingAssignment) {
	return res.status(400).json({ error: "Operator already assigned to this company" })
	}

	// Create the assignment
	const assignment = await prisma.companyOperator.create({
	data: {
		companyId,
		operatorId,
	},
	include: {
		company: {
		select: { id: true, name: true },
		},
		operator: {
		select: { id: true, name: true, email: true },
		},
	},
	})

	// Also update the operator's companyId
	await prisma.user.update({
	where: { id: operatorId },
	data: { companyId },
	})

	res.status(201).json(assignment)
} catch (error) {
	console.error("Error assigning operator to company:", error)
	res.status(500).json({ error: "Failed to assign operator to company" })
}
})

// Remove operator from company
router.delete(
"/assign-company/:operatorId/:companyId",
authenticate,
authorize("SUPER_ADMIN", "OFFICE_MANAGER"),
async (req:AuthRequest, res) => {
	try {
	const { operatorId, companyId } = req.params

	// Role-based access control
	if (req.user!.role === "OFFICE_MANAGER" && req.user!.companyId !== companyId) {
		return res.status(403).json({ error: "Access denied" })
	}

	// Check if assignment exists
	const assignment = await prisma.companyOperator.findUnique({
		where: {
		companyId_operatorId: {
			companyId,
			operatorId,
		},
		},
	})

	if (!assignment) {
		return res.status(404).json({ error: "Assignment not found" })
	}

	// Delete the assignment
	await prisma.companyOperator.delete({
		where: {
		companyId_operatorId: {
			companyId,
			operatorId,
		},
		},
	})

	// Remove companyId from operator if this was their primary company
	const operator = await prisma.user.findUnique({
		where: { id: operatorId },
	})

	if (operator && operator.companyId === companyId) {
		await prisma.user.update({
		where: { id: operatorId },
		data: { companyId: null },
		})
	}

	res.json({ message: "Operator removed from company successfully" })
	} catch (error) {
	console.error("Error removing operator from company:", error)
	res.status(500).json({ error: "Failed to remove operator from company" })
	}
},
)

export default router;
