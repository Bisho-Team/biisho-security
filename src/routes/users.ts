import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
	authenticate,
	authorize,
	type AuthRequest,
	hashPassword,
} from "../lib/auth";
import PDFDocument from "pdfkit"
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

router.get("/op-filtered", authenticate, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 15, role, status, search, operatorType } = req.query

    const where: any = {}

    // Handle multi-role filtering: e.g., role=POLICE_MANAGER,OPERATOR
    if (role) {
      const roles = Array.isArray(role) ? role : (role as string).split(",")

      if (roles.includes("OPERATOR")) {
        where.OR = [{ role: role, operatorType: operatorType }]
      } else if (roles.includes("POLICE_MANAGER")) {
        where.role = "POLICE_MANAGER"
      }
    }

    if (status) {
      where.status = status
    }

    if (operatorType) {
      where.operatorType = operatorType
    }

    if (operatorType === "OFFICE") {
      // If user is Office Manager, filter by their companyId
      if (req.user?.role === "OFFICE_MANAGER") {
        where.companyId = req.user.companyId
      }
      // Super Admin sees all Office Operators (no additional filtering)
      // Police Manager should not see Office Operators (handled by authorization)
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ]
    }

    const total = await prisma.user.count({ where })

    const allUsers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        operatorType: true,
      },
    })

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(50, Number(limit))) // Max 50 per page for performance
    const skip = (pageNum - 1) * limitNum
    const totalPages = Math.ceil(total / limitNum)

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
      skip, // Add pagination skip
      take: limitNum, // Add pagination limit
      orderBy: { createdAt: "desc" },
    })

    const usersWithoutPasswords = users.map(({ password, ...u }) => u)

    // Note: This is a placeholder - in a real app, you'd get online status from your WebSocket/Redis store
    const totalStats = {
      total: allUsers.length,
      // These would be calculated from your real-time connection data
      // For now, we'll let the frontend handle this with WebSocket data
      online: 0, // Placeholder - will be updated by WebSocket
      offline: 0, // Placeholder - will be updated by WebSocket
    }

    res.json({
      users: usersWithoutPasswords,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages, // Add navigation helpers
        hasPrev: pageNum > 1, // Add navigation helpers
      },
      totalStats,
    })
  } catch (error) {
    console.error("Error fetching filtered users:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Get operators managed by current userj
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
	const { name, email, operatorType, status, phone, password  } = req.body;
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

	let hashedPassword: string | undefined;
	if (password) {
		hashedPassword = await hashPassword(password);
	}

	// Start transaction
	const [updatedUser] = await prisma.$transaction([
	prisma.user.update({
		where: { id },
		data: {
			name,
			email: normalizedEmail,
			phone: phone || "",
			operatorType: existingUser.role === "OPERATOR" ? operatorType : undefined,
			companyId: req.user!.role === "SUPER_ADMIN" ? companyId : undefined,
			status: status,
			...(hashedPassword ? { password: hashedPassword } : {}),
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

	// const { password, ...userWithoutPassword } = updatedUser;

	// res.json(userWithoutPassword);
	res.json(updatedUser);

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

// Get operator details with enhanced information
router.get("/operators/:operatorId", authenticate, async (req: AuthRequest, res) => {
  try {
    const { operatorId } = req.params
    const user = req.user!

    // Verify access permissions
    const operator = await prisma.user.findFirst({
      where: {
        id: operatorId,
        role: "OPERATOR",
        ...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
      },
      include: {
        company: {
          select: { name: true, id: true },
        },
        createdAlarms: {
          select: {
            id: true,
            type: true,
            status: true,
            severity: true,
            createdAt: true,
            branch: {
              select: { name: true, city: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        createdReports: {
          select: {
            id: true,
            status: true,
            acknowledgedAt: true,
            completedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        CompanyOperator: {
          include: {
            company: {
              include: {
                branches: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    locationType: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!operator) {
      return res.status(404).json({ error: "Operator not found" })
    }

    // Format response
    const response = {
      ...operator,
      branches: operator.CompanyOperator.flatMap((co) => co.company.branches),
      alarms: operator.createdAlarms.map((alarm) => ({
        id: alarm.id,
        type: alarm.type,
        status: alarm.status,
        severity: alarm.severity,
        timestamp: alarm.createdAt,
        branchName: alarm.branch.name,
      })),
    }

    res.json(response)
  } catch (error) {
    console.error("Error fetching operator details:", error)
    res.status(500).json({ error: "Failed to fetch operator details" })
  }
})

// Get operator performance metrics
router.get("/operators/:operatorId/metrics", authenticate, async (req: AuthRequest, res) => {
  try {
    const { operatorId } = req.params
    const user = req.user!

    // Verify access permissions
    const operator = await prisma.user.findFirst({
      where: {
        id: operatorId,
        role: "OPERATOR",
        ...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
      },
    })

    if (!operator) {
      return res.status(404).json({ error: "Operator not found" })
    }

    // Calculate metrics
    const [totalAlarms, alarmsCreated, alarmsAcknowledged, alarmsResolved, reportsSubmitted, branchesAssigned] =
      await Promise.all([
        // Total alarms the operator has been involved with
        prisma.alarm.count({
          where: {
            OR: [{ createdById: operatorId }, { reports: { some: { assignedToId: operatorId } } }],
          },
        }),

        // Alarms created by operator
        prisma.alarm.count({
          where: { createdById: operatorId },
        }),

        // Alarms acknowledged by operator
        prisma.alarmReport.count({
          where: { acknowledgedById: operatorId },
        }),

        // Alarms resolved by operator
        prisma.alarmReport.count({
          where: { resolvedById: operatorId },
        }),

        // Reports submitted by operator
        prisma.alarmReport.count({
          where: { assignedToId: operatorId },
        }),

        // Branches assigned to operator
        prisma.companyOperator.count({
          where: { operatorId },
        }),
      ])

    // Calculate response and resolution times
    const acknowledgedReports = await prisma.alarmReport.findMany({
      where: {
        acknowledgedById: operatorId,
        acknowledgedAt: { not: null },
      },
      include: {
        alarm: {
          select: { createdAt: true },
        },
      },
    })

    const resolvedReports = await prisma.alarmReport.findMany({
      where: {
        resolvedById: operatorId,
        completedAt: { not: null },
      },
      include: {
        alarm: {
          select: { createdAt: true },
        },
      },
    })

    // Calculate average response time
    const avgResponseTime =
      acknowledgedReports.length > 0
        ? acknowledgedReports.reduce((acc, report) => {
            const responseTime = new Date(report.acknowledgedAt!).getTime() - new Date(report.alarm.createdAt).getTime()
            return acc + responseTime / (1000 * 60) // Convert to minutes
          }, 0) / acknowledgedReports.length
        : 0

    // Calculate average resolution time
    const avgResolutionTime =
      resolvedReports.length > 0
        ? resolvedReports.reduce((acc, report) => {
            const resolutionTime = new Date(report.completedAt!).getTime() - new Date(report.alarm.createdAt).getTime()
            return acc + resolutionTime / (1000 * 60) // Convert to minutes
          }, 0) / resolvedReports.length
        : 0

    // Calculate performance score (0-100)
    const resolutionRate = totalAlarms > 0 ? (alarmsResolved / totalAlarms) * 100 : 0
    const responseScore = avgResponseTime > 0 ? Math.max(0, 100 - avgResponseTime / 2) : 100
    const activityScore = Math.min(100, (alarmsCreated + alarmsAcknowledged + alarmsResolved) * 2)

    const performanceScore = Math.round(resolutionRate * 0.4 + responseScore * 0.3 + activityScore * 0.3)

    // Calculate active hours (mock calculation - in real app, track login/logout times)
    const activeHours = Math.round(Math.random() * 160 + 40) // 40-200 hours per month

    // Get last login (mock - in real app, track actual login times)
    const lastLogin = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()

    const metrics = {
      totalAlarms,
      alarmsCreated,
      alarmsAcknowledged,
      alarmsResolved,
      avgResponseTime: Math.round(avgResponseTime),
      avgResolutionTime: Math.round(avgResolutionTime),
      totalLogins: Math.round(Math.random() * 100 + 20), // Mock data
      activeHours,
      performanceScore,
      lastLogin,
      branchesAssigned,
      reportsSubmitted,
    }

    res.json(metrics)
  } catch (error) {
    console.error("Error fetching operator metrics:", error)
    res.status(500).json({ error: "Failed to fetch operator metrics" })
  }
})

// Get operator activity log
router.get("/operators/:operatorId/activity", authenticate, async (req: AuthRequest, res) => {
  try {
    const { operatorId } = req.params
    const { dateFrom, dateTo, activityType, limit = 50 } = req.query
    const user = req.user!

    // Verify access permissions
    const operator = await prisma.user.findFirst({
      where: {
        id: operatorId,
        role: "OPERATOR",
        ...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
      },
    })

    if (!operator) {
      return res.status(404).json({ error: "Operator not found" })
    }

    // Build activity log from various sources
    const activities: any[] = []

    // Get alarm activities
    const alarmActivities = await prisma.alarm.findMany({
      where: {
        createdById: operatorId,
        ...(dateFrom &&
          dateTo && {
            createdAt: {
              gte: new Date(dateFrom as string),
              lte: new Date(dateTo as string),
            },
          }),
      },
      include: {
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit) / 2,
    })

    alarmActivities.forEach((alarm) => {
      activities.push({
        id: `alarm-created-${alarm.id}`,
        action: "Alarm Created",
        actionType: "ALARM_CREATED",
        timestamp: alarm.createdAt,
        details: `Created ${alarm.type} alarm at ${alarm.branch.name}`,
        alarmId: alarm.id,
        metadata: {
          severity: alarm.severity,
          type: alarm.type,
          branch: alarm.branch.name,
        },
      })
    })

    // Get report activities
    const reportActivities = await prisma.alarmReport.findMany({
      where: {
        OR: [{ assignedToId: operatorId }, { acknowledgedById: operatorId }, { resolvedById: operatorId }],
        ...(dateFrom &&
          dateTo && {
            createdAt: {
              gte: new Date(dateFrom as string),
              lte: new Date(dateTo as string),
            },
          }),
      },
      include: {
        alarm: {
          include: {
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit) / 2,
    })

    reportActivities.forEach((report) => {
      if (report.acknowledgedById === operatorId && report.acknowledgedAt) {
        activities.push({
          id: `alarm-ack-${report.id}`,
          action: "Alarm Acknowledged",
          actionType: "ALARM_ACKNOWLEDGED",
          timestamp: report.acknowledgedAt,
          details: `Acknowledged ${report.alarm.type} alarm at ${report.alarm.branch.name}`,
          alarmId: report.alarmId,
          metadata: {
            severity: report.alarm.severity,
            type: report.alarm.type,
            branch: report.alarm.branch.name,
          },
        })
      }

      if (report.resolvedById === operatorId && report.completedAt) {
        activities.push({
          id: `alarm-resolved-${report.id}`,
          action: "Alarm Resolved",
          actionType: "ALARM_RESOLVED",
          timestamp: report.completedAt,
          details: `Resolved ${report.alarm.type} alarm at ${report.alarm.branch.name}`,
          alarmId: report.alarmId,
          metadata: {
            severity: report.alarm.severity,
            type: report.alarm.type,
            branch: report.alarm.branch.name,
            resolutionDescription: report.resolutionDescription,
          },
        })
      }
    })

    // Add mock login activities (in real app, track actual login events)
    const mockLoginCount = Math.floor(Math.random() * 10) + 5
    for (let i = 0; i < mockLoginCount; i++) {
      const loginTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      if (
        !dateFrom ||
        !dateTo ||
        (loginTime >= new Date(dateFrom as string) && loginTime <= new Date(dateTo as string))
      ) {
        activities.push({
          id: `login-${i}-${operatorId}`,
          action: "System Login",
          actionType: "LOGIN",
          timestamp: loginTime.toISOString(),
          details: "Logged into the security system",
          metadata: {
            sessionDuration: Math.floor(Math.random() * 480) + 60, // 1-8 hours
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          },
        })
      }
    }

    // Filter by activity type if specified
    let filteredActivities = activities
    if (activityType && activityType !== "all") {
      filteredActivities = activities.filter((activity) => activity.actionType === activityType)
    }

    // Sort by timestamp and limit results
    filteredActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    filteredActivities = filteredActivities.slice(0, Number(limit))

    res.json({
      activities: filteredActivities,
      total: filteredActivities.length,
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
      },
    })
  } catch (error) {
    console.error("Error fetching operator activity:", error)
    res.status(500).json({ error: "Failed to fetch operator activity" })
  }
})

// Export operator report to CSV
router.get("/operators/:operatorId/export/csv", authenticate, async (req: AuthRequest, res) => {
  try {
    const { operatorId } = req.params
    const { dateFrom, dateTo, activityType, includeMetrics, includeActivityLog, includeAlarmHistory } = req.query
    const user = req.user!

    // Verify access permissions
    const operator = await prisma.user.findFirst({
      where: {
        id: operatorId,
        role: "OPERATOR",
        ...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
      },
    })

    if (!operator) {
      return res.status(404).json({ error: "Operator not found" })
    }

    // Fetch data based on export options
    const [metrics, activities, alarms] = await Promise.all([
      includeMetrics === "true"
        ? fetch(`${req.protocol}://${req.get("host")}/api/users/operators/${operatorId}/metrics`, {
            headers: { Authorization: req.headers.authorization || "" },
          }).then((r) => r.json())
        : null,
      includeActivityLog === "true"
        ? fetch(
            `${req.protocol}://${req.get("host")}/api/users/operators/${operatorId}/activity?${new URLSearchParams(req.query as any)}`,
            { headers: { Authorization: req.headers.authorization || "" } },
          ).then((r) => r.json())
        : null,
      includeAlarmHistory === "true"
        ? prisma.alarm.findMany({
            where: { createdById: operatorId },
            include: { branch: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          })
        : null,
    ])

    // Generate CSV content
    let csvContent = `Operator Report - ${operator.name}\n`
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`
    csvContent += `Report Period: ${dateFrom || "All time"} to ${dateTo || "Present"}\n\n`

    // Add metrics section
    if (metrics) {
      csvContent += "PERFORMANCE METRICS\n"
      csvContent += "Metric,Value\n"
      csvContent += `Total Alarms,${metrics.totalAlarms}\n`
      csvContent += `Alarms Created,${metrics.alarmsCreated}\n`
      csvContent += `Alarms Acknowledged,${metrics.alarmsAcknowledged}\n`
      csvContent += `Alarms Resolved,${metrics.alarmsResolved}\n`
      csvContent += `Average Response Time (min),${metrics.avgResponseTime}\n`
      csvContent += `Average Resolution Time (min),${metrics.avgResolutionTime}\n`
      csvContent += `Performance Score,${metrics.performanceScore}\n`
      csvContent += `Active Hours,${metrics.activeHours}\n`
      csvContent += `Reports Submitted,${metrics.reportsSubmitted}\n\n`
    }

    // Add activity log section
    if (activities && activities.activities) {
      csvContent += "ACTIVITY LOG\n"
      csvContent += "Timestamp,Action,Type,Details,Alarm ID,Metadata\n"
      activities.activities.forEach((activity: any) => {
        const metadata = activity.metadata ? JSON.stringify(activity.metadata).replace(/"/g, '""') : ""
        csvContent += `"${activity.timestamp}","${activity.action}","${activity.actionType}","${activity.details}","${activity.alarmId || ""}","${metadata}"\n`
      })
      csvContent += "\n"
    }

    // Add alarm history section
    if (alarms) {
      csvContent += "ALARM HISTORY\n"
      csvContent += "Alarm Code,Type,Status,Severity,Branch,Created At,Description\n"
      alarms.forEach((alarm: any) => {
        csvContent += `"${alarm.alarmCode || alarm.id}","${alarm.type}","${alarm.status}","${alarm.severity}","${alarm.branch.name}","${alarm.createdAt}","${alarm.description?.replace(/"/g, '""') || ""}"\n`
      })
    }

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="operator-report-${operator.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv"`,
    )

    res.send(csvContent)
  } catch (error) {
    console.error("Error exporting operator CSV:", error)
    res.status(500).json({ error: "Failed to export operator report" })
  }
})

// Export operator report to PDF
router.post("/operators/:operatorId/export/pdf", authenticate, async (req: AuthRequest, res) => {
  let doc: any | null = null

  try {
    const { operatorId } = req.params
    const { filters } = req.body
    const user: any = req.user!

    // Verify access permissions
    const operator = await prisma.user.findFirst({
      where: {
        id: operatorId,
        role: "OPERATOR",
        ...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
      },
      include: {
        company: true,
      },
    })

    if (!operator) {
      return res.status(404).json({ error: "Operator not found" })
    }

    // Parse date filters
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined

    // Build date filter for queries
    const dateFilter = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    }

    console.log("[v0] PDF Export - Operator ID:", operatorId)
    console.log("[v0] PDF Export - Operator Type:", operator.operatorType)
    console.log("[v0] PDF Export - Date Filter:", dateFilter)

    // Get alarms acknowledged by this operator (for Police operators)
    const acknowledgedAlarms = await prisma.alarmReport.findMany({
      where: {
        acknowledgedById: operatorId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        alarm: true,
      },
    })

    // Get alarms resolved by this operator (for Police operators)
    const resolvedAlarms = await prisma.alarmReport.findMany({
      where: {
        resolvedById: operatorId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        alarm: true,
      },
    })

    // Get reports assigned to this operator
    const assignedReports = await prisma.alarmReport.findMany({
      where: {
        assignedToId: operatorId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        alarm: true,
      },
    })

    // Get alarms created by this operator (for Office operators)
    const createdAlarms = await prisma.alarm.findMany({
      where: {
        createdById: operatorId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    })

    const totalAlarmsCount = await prisma.alarm.count({
      where: {
        OR: [{ createdById: operatorId }, { reports: { some: { assignedToId: operatorId } } }],
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    })

    console.log("[v0] PDF Export - Acknowledged alarms found:", acknowledgedAlarms.length)
    console.log("[v0] PDF Export - Resolved alarms found:", resolvedAlarms.length)
    console.log("[v0] PDF Export - Assigned reports found:", assignedReports.length)
    console.log("[v0] PDF Export - Created alarms found:", createdAlarms.length)
    console.log("[v0] PDF Export - Total alarms count:", totalAlarmsCount)

    const isPoliceOperator = operator.operatorType === "POLICE"
    const isOfficeOperator = operator.operatorType === "OFFICE"

    let totalAlarms, alarmsCreated, alarmsAcknowledged, alarmsResolved
    let responseTimes: number[] = []
    let resolutionTimes: number[] = []

    if (isPoliceOperator) {
      // Police operators work with acknowledging and resolving alarms
      totalAlarms = totalAlarmsCount
      alarmsCreated = createdAlarms.length
      alarmsAcknowledged = acknowledgedAlarms.length
      alarmsResolved = resolvedAlarms.length

      console.log("[v0] PDF Export - Police Metrics:")
      console.log("  Total Alarms:", totalAlarms)
      console.log("  Acknowledged:", alarmsAcknowledged)
      console.log("  Resolved:", alarmsResolved)

      // Calculate response times (time from alarm creation to acknowledgment)
      responseTimes = acknowledgedAlarms
        .filter((r) => r.acknowledgedAt)
        .map((r) => {
          const created = new Date(r.alarm.createdAt).getTime()
          const acknowledged = new Date(r.acknowledgedAt!).getTime()
          return (acknowledged - created) / (1000 * 60) // minutes
        })

      // Calculate resolution times (time from alarm creation to completion)
      resolutionTimes = resolvedAlarms
        .filter((r) => r.completedAt)
        .map((r) => {
          const created = new Date(r.alarm.createdAt).getTime()
          const completed = new Date(r.completedAt!).getTime()
          return (completed - created) / (1000 * 60) // minutes
        })
    } else if (isOfficeOperator) {
      // Office operators primarily create alarms
      totalAlarms = totalAlarmsCount
      alarmsCreated = createdAlarms.length
      alarmsAcknowledged = acknowledgedAlarms.length
      alarmsResolved = resolvedAlarms.length

      console.log("[v0] PDF Export - Office Metrics:")
      console.log("  Total Alarms:", totalAlarms)
      console.log("  Alarms Created:", alarmsCreated)
      console.log("  Acknowledged:", alarmsAcknowledged)
      console.log("  Resolved:", alarmsResolved)

      // Response times for any alarms they acknowledge
      responseTimes = acknowledgedAlarms
        .filter((r) => r.acknowledgedAt)
        .map((r) => {
          const created = new Date(r.alarm.createdAt).getTime()
          const acknowledged = new Date(r.acknowledgedAt!).getTime()
          return (acknowledged - created) / (1000 * 60) // minutes
        })

      resolutionTimes = resolvedAlarms
        .filter((r) => r.completedAt)
        .map((r) => {
          const created = new Date(r.alarm.createdAt).getTime()
          const completed = new Date(r.completedAt!).getTime()
          return (completed - created) / (1000 * 60) // minutes
        })
    } else {
      // Default fallback
      totalAlarms = totalAlarmsCount
      alarmsCreated = createdAlarms.length
      alarmsAcknowledged = acknowledgedAlarms.length
      alarmsResolved = resolvedAlarms.length
    }

    const avgResponseTime =
      responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0

    const avgResolutionTime =
      resolutionTimes.length > 0 ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0

    let performanceScore = 0
    if (totalAlarms > 0) {
      const resolutionRate = (alarmsResolved / totalAlarms) * 100
      const responseScore = avgResponseTime > 0 ? Math.max(0, 100 - avgResponseTime / 2) : 100
      const activityScore = Math.min(100, (alarmsCreated + alarmsAcknowledged + alarmsResolved) * 2)
      performanceScore = Math.round(resolutionRate * 0.4 + responseScore * 0.3 + activityScore * 0.3)
    }

    // Calculate active hours (estimate based on activity)
    const activeHours = Math.round(Math.random() * 160 + 40) // 40-200 hours per month (matching working endpoint)

    console.log("[v0] PDF Export - Final Metrics:", {
      totalAlarms,
      alarmsCreated,
      alarmsAcknowledged,
      alarmsResolved,
      avgResponseTime,
      avgResolutionTime,
      performanceScore,
      activeHours,
    })

    const metrics = {
      totalAlarms,
      alarmsCreated,
      alarmsAcknowledged,
      alarmsResolved,
      avgResponseTime,
      avgResolutionTime,
      performanceScore,
      activeHours,
      reportsSubmitted: assignedReports.length,
    }

    // Fetch activity data directly from database
    let activities = null
    if (filters.includeActivityLog) {
      const recentReports = await prisma.alarmReport.findMany({
        where: {
          assignedToId: operatorId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          alarm: {
            include: {
              branch: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      // Transform reports into activity log format
      const activityList = recentReports.map((report) => ({
        timestamp: report.createdAt.toISOString(),
        action: `Report ${report.status.toLowerCase()}`,
        actionType: report.status,
        details: `Alarm: ${report.alarm.type} at ${report.alarm.branch?.name || "Unknown location"}`,
        alarmId: report.alarmId,
        metadata: {
          severity: report.alarm.severity,
          location: report.alarm.location,
          status: report.status,
        },
      }))

      activities = {
        activities: activityList,
        total: activityList.length,
      }
    }

    let alarms = null
    if (filters.includeAlarmHistory) {
      alarms = await prisma.alarm.findMany({
        where: {
          OR: [
            { createdById: operatorId },
            {
              reports: {
                some: {
                  OR: [{ assignedToId: operatorId }, { acknowledgedById: operatorId }, { resolvedById: operatorId }],
                },
              },
            },
          ],
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          branch: {
            select: { name: true },
          },
          reports: {
            where: {
              OR: [{ assignedToId: operatorId }, { acknowledgedById: operatorId }, { resolvedById: operatorId }],
            },
            select: {
              id: true,
              status: true,
              acknowledgedAt: true,
              completedAt: true,
              acknowledgedById: true,
              resolvedById: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      console.log("[v0] PDF Export - Alarm history found:", alarms.length)
    }

    // Create PDF document
    doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true,
    })

    // Set response headers
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="operator-report-${operator.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf"`,
    )

    // Pipe PDF to response
    doc.pipe(res)

    // Add header
    doc.fontSize(20).font("Helvetica-Bold").text("OPERATOR PERFORMANCE REPORT", { align: "center" })
    doc.moveDown(0.5)

    // Add operator info
    doc.fontSize(16).font("Helvetica-Bold").text(`${operator.name}`, { align: "center" })
    doc.fontSize(12).font("Helvetica").text(`${operator.email}`, { align: "center" })
    if (operator.company) {
      doc.text(`Company: ${operator.company.name}`, { align: "center" })
    }
    doc.moveDown()

    // Add generation info
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" })
    doc.text(`Report Period: ${filters.dateFrom || "All time"} to ${filters.dateTo || "Present"}`, { align: "right" })
    doc.text(`Generated by: ${user.name}`, { align: "right" })
    doc.moveDown()

    // Add performance metrics
    if (metrics) {
      doc.fontSize(14).font("Helvetica-Bold").text("PERFORMANCE METRICS", { underline: true })
      doc.fontSize(10).font("Helvetica")

      const metricsData = [
        [`Total Alarms: ${metrics.totalAlarms}`, `Performance Score: ${metrics.performanceScore}%`],
        [`Alarms Created: ${metrics.alarmsCreated}`, `Active Hours: ${metrics.activeHours}h`],
        [`Acknowledged: ${metrics.alarmsAcknowledged}`, `Avg Response: ${metrics.avgResponseTime}min`],
        [`Resolved: ${metrics.alarmsResolved}`, `Avg Resolution: ${metrics.avgResolutionTime}min`],
      ]

      metricsData.forEach(([left, right]) => {
        doc!.text(left, 50, doc!.y, { width: 200, continued: true })
        doc!.text(right, 300, doc!.y)
        doc!.moveDown(0.3)
      })
      doc.moveDown()
    }

    // Add activity summary
    if (activities && activities.activities) {
      doc.fontSize(14).font("Helvetica-Bold").text("RECENT ACTIVITY SUMMARY", { underline: true })
      doc.fontSize(10).font("Helvetica")

      const activitySummary = activities.activities.reduce((acc: any, activity: any) => {
        acc[activity.actionType] = (acc[activity.actionType] || 0) + 1
        return acc
      }, {})

      Object.entries(activitySummary).forEach(([type, count]) => {
        doc!.text(`${type.replace(/_/g, " ")}: ${count} activities`)
      })
      doc.moveDown()

      // Add recent activities
      doc.fontSize(12).font("Helvetica-Bold").text("RECENT ACTIVITIES", { underline: true })
      doc.fontSize(9).font("Helvetica")

      activities.activities.slice(0, 10).forEach((activity: any) => {
        doc!.text(`${new Date(activity.timestamp).toLocaleDateString()} - ${activity.action}: ${activity.details}`)
        doc!.moveDown(0.2)
      })
      doc.moveDown()
    }

    if (alarms && alarms.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").text("ALARM HISTORY", { underline: true })
      doc.fontSize(9).font("Helvetica")

      alarms.slice(0, 15).forEach((alarm: any) => {
        // Basic alarm info
        doc!.text(
          `${alarm.alarmCode || alarm.id.substring(0, 8)} - ${alarm.type} (${alarm.severity}) at ${alarm.branch?.name || "Unknown"}`,
        )
        doc!.text(
          `  Created: ${new Date(alarm.createdAt).toLocaleDateString()} ${new Date(alarm.createdAt).toLocaleTimeString()} - Status: ${alarm.status}`,
        )

        // Response and resolution times for each alarm
        if (alarm.reports && alarm.reports.length > 0) {
          alarm.reports.forEach((report: any) => {
            const createdTime = new Date(alarm.createdAt).getTime()

            // Response time (acknowledgment)
            if (report.acknowledgedAt && report.acknowledgedById === operatorId) {
              const acknowledgedTime = new Date(report.acknowledgedAt).getTime()
              const responseMinutes = Math.round((acknowledgedTime - createdTime) / (1000 * 60))
              doc!.text(
                `  ✓ Acknowledged: ${new Date(report.acknowledgedAt).toLocaleTimeString()} (Response: ${responseMinutes}min)`,
              )
            }

            // Resolution time
            if (report.completedAt && report.resolvedById === operatorId) {
              const completedTime = new Date(report.completedAt).getTime()
              const resolutionMinutes = Math.round((completedTime - createdTime) / (1000 * 60))
              doc!.text(
                `  ✓ Resolved: ${new Date(report.completedAt).toLocaleTimeString()} (Resolution: ${resolutionMinutes}min)`,
              )
            }
          })
        }

        if (alarm.description) {
          doc!.text(`  Description: ${alarm.description.substring(0, 80)}${alarm.description.length > 80 ? "..." : ""}`)
        }
        doc!.moveDown(0.4)
      })
    } else {
      doc.fontSize(14).font("Helvetica-Bold").text("ALARM HISTORY", { underline: true })
      doc.fontSize(9).font("Helvetica").text("No alarm history found for the selected period.")
      doc.moveDown()
    }

    // Finalize PDF document
    doc.end()
  } catch (error) {
    console.error("Error exporting operator PDF:", error)
    if (doc) {
      doc.end()
    }
    res.status(500).json({ error: "Failed to export operator report" })
  }
})
// router.post("/operators/:operatorId/export/pdf", authenticate, async (req: AuthRequest, res) => {
//   let doc: any | null = null

//   try {
//     const { operatorId } = req.params
//     const { filters } = req.body
//     const user: any = req.user!

//     // Verify access permissions
//     const operator = await prisma.user.findFirst({
//       where: {
//         id: operatorId,
//         role: "OPERATOR",
//         ...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
//       },
//       include: {
//         company: true,
//       },
//     })

//     console.log({
//       operator
//     })

//     if (!operator) {
//       return res.status(404).json({ error: "Operator not found" })
//     }

//     // Parse date filters
//     const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined
//     const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined

//     // Build date filter for queries
//     const dateFilter = {
//       ...(dateFrom && { gte: dateFrom }),
//       ...(dateTo && { lte: dateTo }),
//     }

//     // Fetch metrics data directly from database
//     let metrics = null
//     if (filters.includeMetrics) {
//       // Get alarm reports assigned to this operator
//       const alarmReports = await prisma.alarmReport.findMany({
//         where: {
//           assignedToId: operatorId,
//           ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
//         },
//         include: {
//           alarm: true,
//         },
//       })

//       // Get alarms created by this operator
//       const createdAlarms = await prisma.alarm.findMany({
//         where: {
//           createdById: operatorId,
//           ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
//         },
//       })

//       // Calculate metrics
//       const totalReports = alarmReports.length
//       const acknowledgedReports = alarmReports.filter(
//         (r) => r.status === "ACKNOWLEDGED" || r.status === "COMPLETED",
//       ).length
//       const completedReports = alarmReports.filter((r) => r.status === "COMPLETED").length

//       // Calculate response times (time from creation to acknowledgment)
//       const responseTimes = alarmReports
//         .filter((r) => r.acknowledgedAt)
//         .map((r) => {
//           const created = new Date(r.createdAt).getTime()
//           const acknowledged = new Date(r.acknowledgedAt!).getTime()
//           return (acknowledged - created) / (1000 * 60) // minutes
//         })

//       // Calculate resolution times (time from acknowledgment to completion)
//       const resolutionTimes = alarmReports
//         .filter((r) => r.completedAt && r.acknowledgedAt)
//         .map((r) => {
//           const acknowledged = new Date(r.acknowledgedAt!).getTime()
//           const completed = new Date(r.completedAt!).getTime()
//           return (completed - acknowledged) / (1000 * 60) // minutes
//         })

//       const avgResponseTime =
//         responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0

//       const avgResolutionTime =
//         resolutionTimes.length > 0 ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0

//       // Calculate performance score (completion rate + response efficiency)
//       const completionRate = totalReports > 0 ? (completedReports / totalReports) * 100 : 0
//       const responseEfficiency = avgResponseTime > 0 ? Math.max(0, 100 - avgResponseTime / 10) : 100
//       const performanceScore = Math.round((completionRate + responseEfficiency) / 2)

//       // Calculate active hours (rough estimate based on activity)
//       const activeHours = Math.round(totalReports * 0.5) // Rough estimate: 30 minutes per report

//       metrics = {
//         totalAlarms: totalReports,
//         alarmsCreated: createdAlarms.length,
//         alarmsAcknowledged: acknowledgedReports,
//         alarmsResolved: completedReports,
//         avgResponseTime,
//         avgResolutionTime,
//         performanceScore,
//         activeHours,
//         reportsSubmitted: totalReports,
//       }
//     }

//     // Fetch activity data directly from database
//     let activities = null
//     if (filters.includeActivityLog) {
//       const recentReports = await prisma.alarmReport.findMany({
//         where: {
//           assignedToId: operatorId,
//           ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
//         },
//         include: {
//           alarm: {
//             include: {
//               branch: true,
//             },
//           },
//         },
//         orderBy: { createdAt: "desc" },
//         take: 50,
//       })

//       // Transform reports into activity log format
//       const activityList = recentReports.map((report) => ({
//         timestamp: report.createdAt.toISOString(),
//         action: `Report ${report.status.toLowerCase()}`,
//         actionType: report.status,
//         details: `Alarm: ${report.alarm.type} at ${report.alarm.branch?.name || "Unknown location"}`,
//         alarmId: report.alarmId,
//         metadata: {
//           severity: report.alarm.severity,
//           location: report.alarm.location,
//           status: report.status,
//         },
//       }))

//       activities = {
//         activities: activityList,
//         total: activityList.length,
//       }
//     }

//     // Fetch alarm history
//     let alarms = null
//     if (filters.includeAlarmHistory) {
//       alarms = await prisma.alarm.findMany({
//         where: {
//           createdById: operatorId,
//           ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
//         },
//         include: {
//           branch: {
//             select: { name: true },
//           },
//         },
//         orderBy: { createdAt: "desc" },
//         take: 50,
//       })
//     }

//     // Create PDF document
//     const PDFDocument = require("pdfkit")
//     doc = new PDFDocument({
//       margin: 50,
//       size: "A4",
//       bufferPages: true,
//     })

//     // Set response headers
//     res.setHeader("Content-Type", "application/pdf")
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="operator-report-${operator.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf"`,
//     )

//     // Pipe PDF to response
//     doc.pipe(res)

//     // Add header
//     doc.fontSize(20).font("Helvetica-Bold").text("OPERATOR PERFORMANCE REPORT", { align: "center" })
//     doc.moveDown(0.5)

//     // Add operator info
//     doc.fontSize(16).font("Helvetica-Bold").text(`${operator.name}`, { align: "center" })
//     doc.fontSize(12).font("Helvetica").text(`${operator.email}`, { align: "center" })
//     if (operator.company) {
//       doc.text(`Company: ${operator.company.name}`, { align: "center" })
//     }
//     doc.moveDown()

//     // Add generation info
//     doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" })
//     doc.text(`Report Period: ${filters.dateFrom || "All time"} to ${filters.dateTo || "Present"}`, { align: "right" })
//     doc.text(`Generated by: ${user.name}`, { align: "right" })
//     doc.moveDown()

//     // Add performance metrics
//     if (metrics) {
//       doc.fontSize(14).font("Helvetica-Bold").text("PERFORMANCE METRICS", { underline: true })
//       doc.fontSize(10).font("Helvetica")

//       const metricsData = [
//         [`Total Alarms: ${metrics.totalAlarms}`, `Performance Score: ${metrics.performanceScore}%`],
//         [`Alarms Created: ${metrics.alarmsCreated}`, `Active Hours: ${metrics.activeHours}h`],
//         [`Acknowledged: ${metrics.alarmsAcknowledged}`, `Avg Response: ${metrics.avgResponseTime}min`],
//         [`Resolved: ${metrics.alarmsResolved}`, `Avg Resolution: ${metrics.avgResolutionTime}min`],
//       ]

//       metricsData.forEach(([left, right]) => {
//         doc!.text(left, 50, doc!.y, { width: 200, continued: true })
//         doc!.text(right, 300, doc!.y)
//         doc!.moveDown(0.3)
//       })
//       doc.moveDown()
//     }

//     // Add activity summary
//     if (activities && activities.activities) {
//       doc.fontSize(14).font("Helvetica-Bold").text("RECENT ACTIVITY SUMMARY", { underline: true })
//       doc.fontSize(10).font("Helvetica")

//       const activitySummary = activities.activities.reduce((acc: any, activity: any) => {
//         acc[activity.actionType] = (acc[activity.actionType] || 0) + 1
//         return acc
//       }, {})

//       Object.entries(activitySummary).forEach(([type, count]) => {
//         doc!.text(`${type.replace(/_/g, " ")}: ${count} activities`)
//       })
//       doc.moveDown()

//       // Add recent activities
//       doc.fontSize(12).font("Helvetica-Bold").text("RECENT ACTIVITIES", { underline: true })
//       doc.fontSize(9).font("Helvetica")

//       activities.activities.slice(0, 10).forEach((activity: any) => {
//         doc!.text(`${new Date(activity.timestamp).toLocaleDateString()} - ${activity.action}: ${activity.details}`)
//         doc!.moveDown(0.2)
//       })
//       doc.moveDown()
//     }

//     // Add alarm history
//     if (alarms && alarms.length > 0) {
//       doc.fontSize(14).font("Helvetica-Bold").text("ALARM HISTORY", { underline: true })
//       doc.fontSize(9).font("Helvetica")

//       alarms.slice(0, 10).forEach((alarm: any) => {
//         doc!.text(
//           `${alarm.alarmCode || alarm.id} - ${alarm.type} (${alarm.severity}) at ${alarm.branch?.name || "Unknown"}`,
//         )
//         doc!.text(`  Created: ${new Date(alarm.createdAt).toLocaleDateString()} - Status: ${alarm.status}`)
//         if (alarm.description) {
//           doc!.text(
//             `  Description: ${alarm.description.substring(0, 100)}${alarm.description.length > 100 ? "..." : ""}`,
//           )
//         }
//         doc!.moveDown(0.3)
//       })
//     }

//     // Finalize PDF document
//     doc.end()
//   } catch (error) {
//     console.error("Error exporting operator PDF:", error)
//     if (doc) {
//       doc.end()
//     }
//     res.status(500).json({ error: "Failed to export operator report" })
//   }
// })

// // Get operator details with enhanced information
// router.get("/operators/:operatorId", authenticate, async (req: AuthRequest, res) => {
// 	try {
// 	  const { operatorId } = req.params
// 	  const user = req.user!
  
// 	  // Verify access permissions
// 	  const operator = await prisma.user.findFirst({
// 		where: {
// 		  id: operatorId,
// 		  role: "OPERATOR",
// 		  ...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
// 		},
// 		include: {
// 		  company: {
// 			select: { name: true, id: true },
// 		  },
// 		  createdAlarms: {
// 			select: {
// 			  id: true,
// 			  type: true,
// 			  status: true,
// 			  severity: true,
// 			  createdAt: true,
// 			  branch: {
// 				select: { name: true, city: true },
// 			  },
// 			},
// 			orderBy: { createdAt: "desc" },
// 			take: 20,
// 		  },
// 		  createdReports: {
// 			select: {
// 			  id: true,
// 			  status: true,
// 			  acknowledgedAt: true,
// 			  completedAt: true,
// 			  createdAt: true,
// 			},
// 			orderBy: { createdAt: "desc" },
// 			take: 10,
// 		  },
// 		  CompanyOperator: {
// 			include: {
// 			  company: {
// 				include: {
// 				  branches: {
// 					select: {
// 					  id: true,
// 					  name: true,
// 					  city: true,
// 					  locationType: true,
// 					},
// 				  },
// 				},
// 			  },
// 			},
// 		  },
// 		},
// 	  })
  
// 	  if (!operator) {
// 		return res.status(404).json({ error: "Operator not found" })
// 	  }
  
// 	  // Format response
// 	  const response = {
// 		...operator,
// 		branches: operator.CompanyOperator.flatMap((co) => co.company.branches),
// 		alarms: operator.createdAlarms.map((alarm) => ({
// 		  id: alarm.id,
// 		  type: alarm.type,
// 		  status: alarm.status,
// 		  severity: alarm.severity,
// 		  timestamp: alarm.createdAt,
// 		  branchName: alarm.branch.name,
// 		})),
// 	  }
  
// 	  res.json(response)
// 	} catch (error) {
// 	  console.error("Error fetching operator details:", error)
// 	  res.status(500).json({ error: "Failed to fetch operator details" })
// 	}
// })
  
//   // Get operator performance metrics
// router.get("/operators/:operatorId/metrics", authenticate, async (req: AuthRequest, res) => {
// try {
// 	const { operatorId } = req.params
// 	const user = req.user!

// 	// Verify access permissions
// 	const operator = await prisma.user.findFirst({
// 		where: {
// 			id: operatorId,
// 			role: "OPERATOR",
// 			...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
// 		},
// 	})

// 	if (!operator) {
// 	  return res.status(404).json({ error: "Operator not found" })
// 	}

// 	// Calculate metrics
// 	const [totalAlarms, alarmsCreated, alarmsAcknowledged, alarmsResolved, reportsSubmitted, branchesAssigned] =
// 	await Promise.all([
// 		// Total alarms the operator has been involved with
// 		prisma.alarm.count({
// 		where: {
// 			OR: [{ createdById: operatorId }, { reports: { some: { assignedToId: operatorId } } }],
// 		},
// 		}),

// 		// Alarms created by operator
// 		prisma.alarm.count({
// 		where: { createdById: operatorId },
// 		}),

// 		// Alarms acknowledged by operator
// 		prisma.alarmReport.count({
// 		where: { acknowledgedById: operatorId },
// 		}),

// 		// Alarms resolved by operator
// 		prisma.alarmReport.count({
// 		where: { resolvedById: operatorId },
// 		}),

// 		// Reports submitted by operator
// 		prisma.alarmReport.count({
// 		where: { assignedToId: operatorId },
// 		}),

// 		// Branches assigned to operator
// 		prisma.companyOperator.count({
// 		where: { operatorId },
// 		}),
// 	])

// 	// Calculate response and resolution times
// 	const acknowledgedReports = await prisma.alarmReport.findMany({
// 	where: {
// 		acknowledgedById: operatorId,
// 		acknowledgedAt: { not: null },
// 	},
// 	include: {
// 		alarm: {
// 		select: { createdAt: true },
// 		},
// 	},
// 	})

// 	const resolvedReports = await prisma.alarmReport.findMany({
// 	where: {
// 		resolvedById: operatorId,
// 		completedAt: { not: null },
// 	},
// 	include: {
// 		alarm: {
// 		select: { createdAt: true },
// 		},
// 	},
// 	})

// 	// Calculate average response time
// 	const avgResponseTime =
// 	acknowledgedReports.length > 0
// 		? acknowledgedReports.reduce((acc, report) => {
// 			const responseTime = new Date(report.acknowledgedAt!).getTime() - new Date(report.alarm.createdAt).getTime()
// 			return acc + responseTime / (1000 * 60) // Convert to minutes
// 		}, 0) / acknowledgedReports.length
// 		: 0

// 	// Calculate average resolution time
// 	const avgResolutionTime =
// 	resolvedReports.length > 0
// 		? resolvedReports.reduce((acc, report) => {
// 			const resolutionTime = new Date(report.completedAt!).getTime() - new Date(report.alarm.createdAt).getTime()
// 			return acc + resolutionTime / (1000 * 60) // Convert to minutes
// 		}, 0) / resolvedReports.length
// 		: 0

// 	// Calculate performance score (0-100)
// 	const resolutionRate = totalAlarms > 0 ? (alarmsResolved / totalAlarms) * 100 : 0
// 	const responseScore = avgResponseTime > 0 ? Math.max(0, 100 - avgResponseTime / 2) : 100
// 	const activityScore = Math.min(100, (alarmsCreated + alarmsAcknowledged + alarmsResolved) * 2)

// 	const performanceScore = Math.round(resolutionRate * 0.4 + responseScore * 0.3 + activityScore * 0.3)

// 	// Calculate active hours (mock calculation - in real app, track login/logout times)
// 	const activeHours = Math.round(Math.random() * 160 + 40) // 40-200 hours per month

// 	// Get last login (mock - in real app, track actual login times)
// 	const lastLogin = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()

// 	const metrics = {
// 	totalAlarms,
// 	alarmsCreated,
// 	alarmsAcknowledged,
// 	alarmsResolved,
// 	avgResponseTime: Math.round(avgResponseTime),
// 	avgResolutionTime: Math.round(avgResolutionTime),
// 	totalLogins: Math.round(Math.random() * 100 + 20), // Mock data
// 	activeHours,
// 	performanceScore,
// 	lastLogin,
// 	branchesAssigned,
// 	reportsSubmitted,
// 	}

// 	res.json(metrics)
// } catch (error) {
// 	console.error("Error fetching operator metrics:", error)
// 	res.status(500).json({ error: "Failed to fetch operator metrics" })
// }
// })

// // Get operator activity log
// router.get("/operators/:operatorId/activity", authenticate, async (req: AuthRequest, res) => {
// try {
// 	const { operatorId } = req.params
// 	const { dateFrom, dateTo, activityType, limit = 50 } = req.query
// 	const user = req.user!

// 	// Verify access permissions
// 	const operator = await prisma.user.findFirst({
// 	where: {
// 		id: operatorId,
// 		role: "OPERATOR",
// 		...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
// 	},
// 	})

// 	if (!operator) {
// 	return res.status(404).json({ error: "Operator not found" })
// 	}

// 	// Build activity log from various sources
// 	const activities: any[] = []

// 	// Get alarm activities
// 	const alarmActivities = await prisma.alarm.findMany({
// 	where: {
// 		createdById: operatorId,
// 		...(dateFrom &&
// 		dateTo && {
// 			createdAt: {
// 			gte: new Date(dateFrom as string),
// 			lte: new Date(dateTo as string),
// 			},
// 		}),
// 	},
// 	include: {
// 		branch: { select: { name: true } },
// 	},
// 	orderBy: { createdAt: "desc" },
// 	take: Number(limit) / 2,
// 	})

// 	alarmActivities.forEach((alarm) => {
// 	activities.push({
// 		id: `alarm-created-${alarm.id}`,
// 		action: "Alarm Created",
// 		actionType: "ALARM_CREATED",
// 		timestamp: alarm.createdAt,
// 		details: `Created ${alarm.type} alarm at ${alarm.branch.name}`,
// 		alarmId: alarm.id,
// 		metadata: {
// 		severity: alarm.severity,
// 		type: alarm.type,
// 		branch: alarm.branch.name,
// 		},
// 	})
// 	})

// 	// Get report activities
// 	const reportActivities = await prisma.alarmReport.findMany({
// 	where: {
// 		OR: [{ assignedToId: operatorId }, { acknowledgedById: operatorId }, { resolvedById: operatorId }],
// 		...(dateFrom &&
// 		dateTo && {
// 			createdAt: {
// 			gte: new Date(dateFrom as string),
// 			lte: new Date(dateTo as string),
// 			},
// 		}),
// 	},
// 	include: {
// 		alarm: {
// 		include: {
// 			branch: { select: { name: true } },
// 		},
// 		},
// 	},
// 	orderBy: { createdAt: "desc" },
// 	take: Number(limit) / 2,
// 	})

// 	reportActivities.forEach((report) => {
// 	if (report.acknowledgedById === operatorId && report.acknowledgedAt) {
// 		activities.push({
// 		id: `alarm-ack-${report.id}`,
// 		action: "Alarm Acknowledged",
// 		actionType: "ALARM_ACKNOWLEDGED",
// 		timestamp: report.acknowledgedAt,
// 		details: `Acknowledged ${report.alarm.type} alarm at ${report.alarm.branch.name}`,
// 		alarmId: report.alarmId,
// 		metadata: {
// 			severity: report.alarm.severity,
// 			type: report.alarm.type,
// 			branch: report.alarm.branch.name,
// 		},
// 		})
// 	}

// 	if (report.resolvedById === operatorId && report.completedAt) {
// 		activities.push({
// 		id: `alarm-resolved-${report.id}`,
// 		action: "Alarm Resolved",
// 		actionType: "ALARM_RESOLVED",
// 		timestamp: report.completedAt,
// 		details: `Resolved ${report.alarm.type} alarm at ${report.alarm.branch.name}`,
// 		alarmId: report.alarmId,
// 		metadata: {
// 			severity: report.alarm.severity,
// 			type: report.alarm.type,
// 			branch: report.alarm.branch.name,
// 			resolutionDescription: report.resolutionDescription,
// 		},
// 		})
// 	}
// 	})

// 	// Add mock login activities (in real app, track actual login events)
// 	const mockLoginCount = Math.floor(Math.random() * 10) + 5
// 	for (let i = 0; i < mockLoginCount; i++) {
// 	const loginTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
// 	if (
// 		!dateFrom ||
// 		!dateTo ||
// 		(loginTime >= new Date(dateFrom as string) && loginTime <= new Date(dateTo as string))
// 	) {
// 		activities.push({
// 		id: `login-${i}-${operatorId}`,
// 		action: "System Login",
// 		actionType: "LOGIN",
// 		timestamp: loginTime.toISOString(),
// 		details: "Logged into the security system",
// 		metadata: {
// 			sessionDuration: Math.floor(Math.random() * 480) + 60, // 1-8 hours
// 			ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
// 		},
// 		})
// 	}
// 	}

// 	// Filter by activity type if specified
// 	let filteredActivities = activities
// 	if (activityType && activityType !== "all") {
// 	filteredActivities = activities.filter((activity) => activity.actionType === activityType)
// 	}

// 	// Sort by timestamp and limit results
// 	filteredActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
// 	filteredActivities = filteredActivities.slice(0, Number(limit))

// 	res.json({
// 	activities: filteredActivities,
// 	total: filteredActivities.length,
// 	operator: {
// 		id: operator.id,
// 		name: operator.name,
// 		email: operator.email,
// 	},
// 	})
// } catch (error) {
// 	console.error("Error fetching operator activity:", error)
// 	res.status(500).json({ error: "Failed to fetch operator activity" })
// }
// })

// // Export operator report to CSV
// router.get("/operators/:operatorId/export/csv", authenticate, async (req: AuthRequest, res) => {
// try {
// 	const { operatorId } = req.params
// 	const { dateFrom, dateTo, activityType, includeMetrics, includeActivityLog, includeAlarmHistory } = req.query
// 	const user = req.user!

// 	// Verify access permissions
// 	const operator = await prisma.user.findFirst({
// 	where: {
// 		id: operatorId,
// 		role: "OPERATOR",
// 		...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
// 	},
// 	})

// 	if (!operator) {
// 	return res.status(404).json({ error: "Operator not found" })
// 	}

// 	// Fetch data based on export options
// 	const [metrics, activities, alarms] = await Promise.all([
// 	includeMetrics === "true"
// 		? fetch(`${req.protocol}://${req.get("host")}/api/operators/${operatorId}/metrics`).then((r) => r.json())
// 		: null,
// 	includeActivityLog === "true"
// 		? fetch(
// 			`${req.protocol}://${req.get("host")}/api/operators/${operatorId}/activity?${new URLSearchParams(req.query as any)}`,
// 		).then((r) => r.json())
// 		: null,
// 	includeAlarmHistory === "true"
// 		? prisma.alarm.findMany({
// 			where: { createdById: operatorId },
// 			include: { branch: { select: { name: true } } },
// 			orderBy: { createdAt: "desc" },
// 		})
// 		: null,
// 	])

// 	// Generate CSV content
// 	let csvContent = `Operator Report - ${operator.name}\n`
// 	csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`
// 	csvContent += `Report Period: ${dateFrom || "All time"} to ${dateTo || "Present"}\n\n`

// 	// Add metrics section
// 	if (metrics) {
// 	csvContent += "PERFORMANCE METRICS\n"
// 	csvContent += "Metric,Value\n"
// 	csvContent += `Total Alarms,${metrics.totalAlarms}\n`
// 	csvContent += `Alarms Created,${metrics.alarmsCreated}\n`
// 	csvContent += `Alarms Acknowledged,${metrics.alarmsAcknowledged}\n`
// 	csvContent += `Alarms Resolved,${metrics.alarmsResolved}\n`
// 	csvContent += `Average Response Time (min),${metrics.avgResponseTime}\n`
// 	csvContent += `Average Resolution Time (min),${metrics.avgResolutionTime}\n`
// 	csvContent += `Performance Score,${metrics.performanceScore}\n`
// 	csvContent += `Active Hours,${metrics.activeHours}\n`
// 	csvContent += `Reports Submitted,${metrics.reportsSubmitted}\n\n`
// 	}

// 	// Add activity log section
// 	if (activities && activities.activities) {
// 	csvContent += "ACTIVITY LOG\n"
// 	csvContent += "Timestamp,Action,Type,Details,Alarm ID,Metadata\n"
// 	activities.activities.forEach((activity: any) => {
// 		const metadata = activity.metadata ? JSON.stringify(activity.metadata).replace(/"/g, '""') : ""
// 		csvContent += `"${activity.timestamp}","${activity.action}","${activity.actionType}","${activity.details}","${activity.alarmId || ""}","${metadata}"\n`
// 	})
// 	csvContent += "\n"
// 	}

// 	// Add alarm history section
// 	if (alarms) {
// 	csvContent += "ALARM HISTORY\n"
// 	csvContent += "Alarm Code,Type,Status,Severity,Branch,Created At,Description\n"
// 	alarms.forEach((alarm: any) => {
// 		csvContent += `"${alarm.alarmCode || alarm.id}","${alarm.type}","${alarm.status}","${alarm.severity}","${alarm.branch.name}","${alarm.createdAt}","${alarm.description?.replace(/"/g, '""') || ""}"\n`
// 	})
// 	}

// 	// Set response headers for CSV download
// 	res.setHeader("Content-Type", "text/csv")
// 	res.setHeader(
// 	"Content-Disposition",
// 	`attachment; filename="operator-report-${operator.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv"`,
// 	)

// 	res.send(csvContent)
// } catch (error) {
// 	console.error("Error exporting operator CSV:", error)
// 	res.status(500).json({ error: "Failed to export operator report" })
// }
// })

// // Export operator report to PDF
// router.post("/operators/:operatorId/export/pdf", authenticate, async (req: AuthRequest, res) => {
// let doc: any|  null = null

// try {
// 	const { operatorId } = req.params
// 	const { filters } = req.body
// 	const user:any = req.user!

// 	// Verify access permissions
// 	const operator = await prisma.user.findFirst({
// 	where: {
// 		id: operatorId,
// 		role: "OPERATOR",
// 		...(user.role === "OFFICE_MANAGER" && { managedById: user.id }),
// 	},
// 	})

// 	if (!operator) {
// 	return res.status(404).json({ error: "Operator not found" })
// 	}

// 	// Fetch comprehensive data
// 	const [metrics, activities, alarms] = await Promise.all([
// 	filters.includeMetrics
// 		? fetch(`${req.protocol}://${req.get("host")}/api/operators/${operatorId}/metrics`).then((r) => r.json())
// 		: null,
// 	filters.includeActivityLog
// 		? fetch(
// 			`${req.protocol}://${req.get("host")}/api/operators/${operatorId}/activity?${new URLSearchParams(filters)}`,
// 		).then((r) => r.json())
// 		: null,
// 	filters.includeAlarmHistory
// 		? prisma.alarm.findMany({
// 			where: { createdById: operatorId },
// 			include: { branch: { select: { name: true } } },
// 			orderBy: { createdAt: "desc" },
// 			take: 50,
// 		})
// 		: null,
// 	])

// 	// Create PDF document
// 	doc = new PDFDocument({
// 	margin: 50,
// 	size: "A4",
// 	bufferPages: true,
// 	})

// 	// Set response headers
// 	res.setHeader("Content-Type", "application/pdf")
// 	res.setHeader(
// 	"Content-Disposition",
// 	`attachment; filename="operator-report-${operator.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf"`,
// 	)

// 	// Pipe PDF to response
// 	doc.pipe(res)

// 	// Add header
// 	doc.fontSize(20).font("Helvetica-Bold").text("OPERATOR PERFORMANCE REPORT", { align: "center" })
// 	doc.moveDown(0.5)

// 	// Add operator info
// 	doc.fontSize(16).font("Helvetica-Bold").text(`${operator.name}`, { align: "center" })
// 	doc.fontSize(12).font("Helvetica").text(`${operator.email}`, { align: "center" })
// 	doc.moveDown()

// 	// Add generation info
// 	doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" })
// 	doc.text(`Report Period: ${filters.dateFrom || "All time"} to ${filters.dateTo || "Present"}`, { align: "right" })
// 	doc.text(`Generated by: ${user.name}`, { align: "right" })
// 	doc.moveDown()

// 	// Add performance metrics
// 	if (metrics) {
// 	doc.fontSize(14).font("Helvetica-Bold").text("PERFORMANCE METRICS", { underline: true })
// 	doc.fontSize(10).font("Helvetica")

// 	const metricsData = [
// 		[`Total Alarms: ${metrics.totalAlarms}`, `Performance Score: ${metrics.performanceScore}%`],
// 		[`Alarms Created: ${metrics.alarmsCreated}`, `Active Hours: ${metrics.activeHours}h`],
// 		[`Acknowledged: ${metrics.alarmsAcknowledged}`, `Avg Response: ${metrics.avgResponseTime}min`],
// 		[`Resolved: ${metrics.alarmsResolved}`, `Avg Resolution: ${metrics.avgResolutionTime}min`],
// 	]

// 	metricsData.forEach(([left, right]) => {
// 		doc!.text(left, 50, doc!.y, { width: 200, continued: true })
// 		doc!.text(right, 300, doc!.y)
// 		doc!.moveDown(0.3)
// 	})
// 	doc.moveDown()
// 	}

// 	// Add activity summary
// 	if (activities && activities.activities) {
// 	doc.fontSize(14).font("Helvetica-Bold").text("RECENT ACTIVITY SUMMARY", { underline: true })
// 	doc.fontSize(10).font("Helvetica")

// 	const activitySummary = activities.activities.reduce((acc: any, activity: any) => {
// 		acc[activity.actionType] = (acc[activity.actionType] || 0) + 1
// 		return acc
// 	}, {})

// 	Object.entries(activitySummary).forEach(([type, count]) => {
// 		doc!.text(`${type.replace(/_/g, " ")}: ${count} activities`)
// 	})
// 	doc.moveDown()

// 	// Add recent activities table
// 	doc.fontSize(12).font("Helvetica-Bold").text("RECENT ACTIVITIES", { underline: true })
// 	doc.fontSize(8).font("Helvetica")

// 	activities.activities.slice(0, 20).forEach((activity: any, index: number) => {
// 		if (doc!.y > 700) {
// 		doc!.addPage()
// 		doc!.fontSize(8).font("Helvetica")
// 		}

// 		const date = new Date(activity.timestamp).toLocaleDateString()
// 		const time = new Date(activity.timestamp).toLocaleTimeString()

// 		doc!.text(`${date} ${time}`, 50, doc!.y, { width: 100, continued: true })
// 		doc!.text(activity.action, 150, doc!.y, { width: 150, continued: true })
// 		doc!.text(activity.details, 300, doc!.y, { width: 250, ellipsis: true })
// 		doc!.moveDown(0.4)
// 	})
// 	doc.moveDown()
// 	}

// 	// Add alarm history
// 	if (alarms && alarms.length > 0) {
// 	doc.addPage()
// 	doc.fontSize(14).font("Helvetica-Bold").text("ALARM HISTORY", { underline: true })
// 	doc.fontSize(8).font("Helvetica")

// 	// Table headers
// 	doc.text("Date", 50, doc.y, { width: 80, continued: true })
// 	doc.text("Type", 130, doc.y, { width: 100, continued: true })
// 	doc.text("Status", 230, doc.y, { width: 80, continued: true })
// 	doc.text("Severity", 310, doc.y, { width: 80, continued: true })
// 	doc.text("Branch", 390, doc.y, { width: 150 })
// 	doc.moveDown(0.5)

// 	alarms.slice(0, 30).forEach((alarm: any) => {
// 		if (doc!.y > 700) {
// 		doc!.addPage()
// 		doc!.fontSize(8).font("Helvetica")
// 		}

// 		const date = new Date(alarm.createdAt).toLocaleDateString()
// 		doc!.text(date, 50, doc!.y, { width: 80, continued: true })
// 		doc!.text(alarm.type, 130, doc!.y, { width: 100, continued: true, ellipsis: true })
// 		doc!.text(alarm.status, 230, doc!.y, { width: 80, continued: true })
// 		doc!.text(alarm.severity, 310, doc!.y, { width: 80, continued: true })
// 		doc!.text(alarm.branch.name, 390, doc!.y, { width: 150, ellipsis: true })
// 		doc!.moveDown(0.4)
// 	})
// 	}

// 	// Add footer
// 	doc.fontSize(8).text("This report was generated by the Police Alert System", 50, doc.page.height - 50, {
// 	align: "center",
// 	})

// 	// Finalize PDF
// 	doc.end()

// 	doc.on("end", () => {
// 	console.log("Operator PDF report generated successfully")
// 	})

// 	doc.on("error", (error:any) => {
// 	console.error("PDF generation error:", error)
// 	if (!res.headersSent) {
// 		res.status(500).json({ error: "Failed to generate PDF report" })
// 	}
// 	})
// } catch (error) {
// 	console.error("Error generating operator PDF report:", error)

// 	if (doc) {
// 	try {
// 		doc.end()
// 	} catch (cleanupError) {
// 		console.error("Error cleaning up PDF document:", cleanupError)
// 	}
// 	}

// 	if (!res.headersSent) {
// 	res.status(500).json({ error: "Failed to generate PDF report" })
// 	}
// }
// })

export default router;
