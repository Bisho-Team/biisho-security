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

// 6|koppa-backend  |     id: 'op-1750073914934',
// 6|koppa-backend  |     name: 'Abenezer Kebede',
// 6|koppa-backend  |     email: 'abenikeb79@gmail22.com',
// 6|koppa-backend  |     phone: '09667772272',
// 6|koppa-backend  |     status: 'ACTIVE',
// 6|koppa-backend  |     role: 'OPERATOR',
// 6|koppa-backend  |     managedById: 'cmbc08g7d0004eyprjcy9377g',
// 6|koppa-backend  |     operatorType: 'OFFICE',
// 6|koppa-backend  |     createdBy: 'cmbc08g7d0004eyprjcy9377g',
// 6|koppa-backend  |     companyId: 'cmbc08fbl0000eyprqm39rfsl',
// 6|koppa-backend  |     createdAt: '2025-06-16T11:38:34.934Z',
// 6|koppa-backend  |     assignedBranches: [],
// 6|koppa-backend  |     lastActive: '2025-06-16T11:38:34.934Z'

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
	authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"),
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

// // Get users by manager (Office/Police Managers)
// router.get(
// 	"/my-operators",
// 	authenticate,
// 	authorize("OFFICE_MANAGER", "POLICE_MANAGER"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			const operators = await prisma.user.findMany({
// 				where: {
// 					managedById: req.user!.id,
// 					role: "OPERATOR",
// 				},
// 				// include: {
// 				// 	assignedBranches: {
// 				// 		include: {
// 				// 			branch: true,
// 				// 		},
// 				// 	},
// 				// },
// 				orderBy: { createdAt: "desc" },
// 			});

// 			const operatorsWithoutPasswords = operators.map(
// 				({ password, ...operator }) => operator
// 			);

// 			res.json(operatorsWithoutPasswords);
// 		} catch (error) {
// 			res.status(500).json({ error: "Failed to fetch operators" });
// 		}
// 	}
// );

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
// router.put("/:id", authenticate, async (req: AuthRequest, res) => {
// 	try {
// 		const { id } = req.params;
// 		const data = updateUserSchema.parse(req.body);

// 		// Check if user exists and permissions
// 		const existingUser = await prisma.user.findUnique({
// 			where: { id },
// 		});

// 		if (!existingUser) {
// 			return res.status(404).json({ error: "User not found" });
// 		}

// 		// Authorization checks
// 		if (req.user?.role !== "SUPER_ADMIN") {
// 			if (existingUser.managedById !== req.user?.id) {
// 				return res
// 					.status(403)
// 					.json({ error: "You can only update users you manage" });
// 			}
// 		}

// 		const user = await prisma.user.update({
// 			where: { id },
// 			data: {
// 				name: data.name,
// 				status: data.status,
// 			},
// 			include: {
// 				company: true,
// 				managedBy: {
// 					select: { id: true, name: true, email: true },
// 				},
// 			},
// 		});

// 		// Update company assignment for operator
// 		if (existingUser.role === "OPERATOR") {
// 			// Remove existing company assignment
// 			await prisma.companyOperator.deleteMany({
// 				where: { operatorId: id },
// 			});

// 			// Assign new company (if provided)
// 			if (data.companyId) {
// 				await prisma.companyOperator.create({
// 					data: {
// 						operatorId: id,
// 						companyId: data.companyId,
// 					},
// 				});
// 			}
// 		}

// 		// // Update branch assignments for operators
// 		// if (data.assignedBranches && existingUser.role === "OPERATOR") {
// 		// 	await prisma.branchOperator.deleteMany({
// 		// 		where: { userId: id },
// 		// 	});

// 		// 	if (data.assignedBranches.length > 0) {
// 		// 		await prisma.branchOperator.createMany({
// 		// 			data: data.assignedBranches.map((branchId) => ({
// 		// 				userId: id,
// 		// 				branchId,
// 		// 			})),
// 		// 		});
// 		// 	}
// 		// }

// 		const { password: _, ...userWithoutPassword } = user;

// 		res.json({
// 			message: "User updated successfully",
// 			user: userWithoutPassword,
// 		});
// 	} catch (error) {
// 		if (error instanceof z.ZodError) {
// 			return res
// 				.status(400)
// 				.json({ error: "Validation failed", details: error.errors });
// 		}
// 		res.status(500).json({ error: "Failed to update user" });
// 	}
// });
// Update user
// router.put("/:id", authenticate, authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"), async (req:AuthRequest, res) => {
// 	try {
// 	  const { id } = req.params
// 	  const { name, email, operatorType, status } = req.body;
// 		const companyId = req.body.companyId || req.user?.companyId;

// 		console.log({
// 		name,
// 		email,
// 		operatorType,
// 		companyId,
// 		status,
// 		});
// 	  // Check if user exists
// 	  const existingUser = await prisma.user.findUnique({
// 		where: { id },
// 	  })
  
// 	  if (!existingUser) {
// 		return res.status(404).json({ error: "User not found" })
// 	  }

	  
  
// 	  // Role-based access control
// 	  if (req.user!.role !== "SUPER_ADMIN") {
// 		if (existingUser.managedById !== req.user!.id && existingUser.companyId !== req.user!.companyId) {
// 		  return res.status(403).json({ error: "Access denied" })
// 		}
// 	  }
  
// 	  // Check if email is already taken by another user
// 	  if (email && email !== existingUser.email) {
// 		const emailExists = await prisma.user.findUnique({
// 		  where: { email },
// 		})
  
// 		if (emailExists) {
// 		  return res.status(400).json({ error: "Email already exists" })
// 		}
// 	  }
  
// 	  const updatedUser = await prisma.user.update({
// 		where: { id },
// 		data: {
// 		  name,
// 		  email,
// 		  operatorType: existingUser.role === "OPERATOR" ? operatorType : existingUser.operatorType,
// 		  companyId: req.user!.role === "SUPER_ADMIN" ? companyId : existingUser.companyId,
// 		  status: req.user!.role === "SUPER_ADMIN" ? status : existingUser.status,
// 		},
// 		include: {
// 		  company: {
// 			select: { id: true, name: true, status: true },
// 		  },
// 		  managedBy: {
// 			select: { id: true, name: true, email: true, role: true },
// 		  },
// 		  _count: {
// 			select: {
// 			  managedUsers: true,
// 			  createdAlarms: true,
// 			  createdReports: true,
// 			},
// 		  },
// 		},
// 	  })

// 	  		// Update company assignment for operator
// 		if (existingUser.role === "OPERATOR") {
// 			// Remove existing company assignment
// 			await prisma.companyOperator.deleteMany({
// 				where: { operatorId: id },
// 			});

// 			// Assign new company (if provided)
// 			if (companyId) {
// 				await prisma.companyOperator.create({
// 					data: {
// 						operatorId: id,
// 						companyId: companyId,
// 					},
// 				});
// 			}
// 		}
  
// 	  const { password, ...userWithoutPassword } = updatedUser
// 	  res.json(userWithoutPassword)
// 	} catch (error) {
// 	  console.error("Error updating user:", error)
// 	  res.status(500).json({ error: "Failed to update user" })
// 	}
//   })

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
  

// Delete user
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
// router.delete(
// 	"/:id",
// 	authenticate,
// 	authorize("SUPER_ADMIN"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			const { id } = req.params;

// 			await prisma.user.delete({
// 				where: { id },
// 			});

// 			res.json({ message: "User deleted successfully" });
// 		} catch (error) {
// 			res.status(500).json({ error: "Failed to delete user" });
// 		}
// 	}
// );

export default router;
