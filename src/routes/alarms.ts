// import express from "express";
// import { z } from "zod";
// import { PrismaClient } from "@prisma/client";
// import { authenticate, authorize, type AuthRequest } from "../lib/auth";

// const router = express.Router();
// const prisma = new PrismaClient();

// const createAlarmSchema = z.object({
// 	type: z.string().min(1),
// 	branchId: z.string().min(1),
// 	location: z.string().optional(),
// 	severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
// 	description: z.string().min(1),
// 	additionalNotes: z.string().optional(),
// 	assignedToId: z.string().min(1), // Police Manager ID
// });

// const updateAlarmSchema = z.object({
// 	status: z
// 		.enum(["ACTIVE", "ACKNOWLEDGED", "DISPATCHED", "RESOLVED"])
// 		.optional(),
// 	additionalNotes: z.string().optional(),
// });

// // Get alarms
// router.get("/", authenticate, async (req: AuthRequest, res) => {
// 	try {
// 		const { status, severity, branchId } = req.query;
// 		const where: any = {};

// 		// Filter based on user role
// 		if (req.user?.role === "OFFICE_MANAGER" || req.user?.role === "OPERATOR") {
// 			// Get branches accessible to this user
// 			let accessibleBranchIds: string[] = [];

// 			if (req.user.role === "OFFICE_MANAGER") {
// 				const branches = await prisma.branch.findMany({
// 					where: { createdById: req.user.id },
// 					select: { id: true },
// 				});
// 				accessibleBranchIds = branches.map((b) => b.id);
// 			} else if (req.user.role === "OPERATOR") {
// 				const assignments = await prisma.branchOperator.findMany({
// 					where: { userId: req.user.id },
// 					select: { branchId: true },
// 				});
// 				accessibleBranchIds = assignments.map((a) => a.branchId);
// 			}

// 			where.branchId = { in: accessibleBranchIds };
// 		}

// 		// Add filters
// 		if (status) where.status = status;
// 		if (severity) where.severity = severity;
// 		if (branchId) where.branchId = branchId;

// 		const alarms = await prisma.alarm.findMany({
// 			where,
// 			include: {
// 				branch: {
// 					select: { id: true, name: true, city: true },
// 				},
// 				createdBy: {
// 					select: { id: true, name: true, email: true },
// 				},
// 				reports: {
// 					include: {
// 						assignedTo: {
// 							select: { id: true, name: true, email: true },
// 						},
// 					},
// 				},
// 			},
// 			orderBy: { createdAt: "desc" },
// 		});

// 		res.json(alarms);
// 	} catch (error) {
// 		res.status(500).json({ error: "Failed to fetch alarms" });
// 	}
// });

// // Get alarm by ID
// router.get("/:id", authenticate, async (req: AuthRequest, res) => {
// 	try {
// 		const { id } = req.params;

// 		const alarm = await prisma.alarm.findUnique({
// 			where: { id },
// 			include: {
// 				branch: true,
// 				createdBy: {
// 					select: { id: true, name: true, email: true },
// 				},
// 				reports: {
// 					include: {
// 						assignedTo: {
// 							select: { id: true, name: true, email: true },
// 						},
// 					},
// 				},
// 			},
// 		});

// 		if (!alarm) {
// 			return res.status(404).json({ error: "Alarm not found" });
// 		}

// 		res.json(alarm);
// 	} catch (error) {
// 		res.status(500).json({ error: "Failed to fetch alarm" });
// 	}
// });

// // Create alarm
// router.post(
// 	"/",
// 	authenticate,
// 	authorize("OFFICE_MANAGER", "OPERATOR"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			const data = createAlarmSchema.parse(req.body);

// 			// Verify branch access
// 			const branch = await prisma.branch.findUnique({
// 				where: { id: data.branchId },
// 			});

// 			if (!branch) {
// 				return res.status(404).json({ error: "Branch not found" });
// 			}

// 			// Check if user has access to this branch
// 			if (req.user?.role === "OFFICE_MANAGER") {
// 				if (branch.createdById !== req.user.id) {
// 					return res
// 						.status(403)
// 						.json({ error: "Access denied to this branch" });
// 				}
// 			} else if (req.user?.role === "OPERATOR") {
// 				const assignment = await prisma.branchOperator.findFirst({
// 					where: {
// 						userId: req.user.id,
// 						branchId: data.branchId,
// 					},
// 				});
// 				if (!assignment) {
// 					return res
// 						.status(403)
// 						.json({ error: "Access denied to this branch" });
// 				}
// 			}

// 			// Create alarm
// 			const alarm = await prisma.alarm.create({
// 				data: {
// 					type: data.type,
// 					branchId: data.branchId,
// 					location: data.location,
// 					severity: data.severity,
// 					description: data.description,
// 					additionalNotes: data.additionalNotes,
// 					createdById: req.user!.id,
// 				},
// 				include: {
// 					branch: true,
// 					createdBy: {
// 						select: { id: true, name: true, email: true },
// 					},
// 				},
// 			});

// 			// Create alarm report for police manager
// 			await prisma.alarmReport.create({
// 				data: {
// 					alarmId: alarm.id,
// 					assignedToId: data.assignedToId,
// 				},
// 			});

// 			res.status(201).json({
// 				message: "Alarm created and dispatched successfully",
// 				alarm,
// 			});
// 		} catch (error) {
// 			if (error instanceof z.ZodError) {
// 				return res
// 					.status(400)
// 					.json({ error: "Validation failed", details: error.errors });
// 			}
// 			res.status(500).json({ error: "Failed to create alarm" });
// 		}
// 	}
// );

// // Update alarm
// router.put("/:id", authenticate, async (req: AuthRequest, res) => {
// 	try {
// 		console.log("Updating alarm with ID:", req.params.id);
// 		const { id } = req.params;
// 		const data = updateAlarmSchema.parse(req.body);
// 		console.log("Parsed data:", data);

// 		const alarm = await prisma.alarm.update({
// 			where: { id },
// 			data,
// 			include: {
// 				branch: true,
// 				createdBy: {
// 					select: { id: true, name: true, email: true },
// 				},
// 			},
// 		});

// 		res.json({
// 			message: "Alarm updated successfully",
// 			alarm,
// 		});
// 	} catch (error) {
// 		if (error instanceof z.ZodError) {
// 			return res
// 				.status(400)
// 				.json({ error: "Validation failed", details: error.errors });
// 		}
// 		res.status(500).json({ error: "Failed to update alarm" });
// 	}
// });

// export default router;

// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticateToken } from "../middleware/auth";

import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, type AuthRequest } from "../lib/auth";

const router = express.Router();
const prisma = new PrismaClient();

const {
	broadcastAlarmToPolice,
	broadcastAlarmUpdate,
} = require("./../lib/websocket-server");

const createAlarmSchema = z.object({
	type: z.string().min(1),
	branchId: z.string().min(1),
	location: z.string().optional(),
	severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
	description: z.string().min(1),
	additionalNotes: z.string().optional(),
	assignedToId: z.string().min(1), // Police Manager ID
});

// Get alarms
router.get("/", authenticate, async (req, res) => {
	try {
		const alarms = await prisma.alarm.findMany({
			include: {
				branch: {
					select: {
						name: true,
						company: {
							select: {
								name: true,
							},
						},
					},
				},
				createdBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});
		res.json({ alarms });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch alarms" });
	}
});

// Get alarm by ID
router.get("/:id", authenticate, async (req, res) => {
	const { id } = req.params;
	try {
		const alarm = await prisma.alarm.findUnique({
			where: { id },
			include: {
				branch: {
					select: {
						name: true,
						company: {
							select: {
								name: true,
							},
						},
					},
				},
				createdBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});
		if (!alarm) {
			return res.status(404).json({ error: "Alarm not found" });
		}
		res.json({ alarm });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch alarm" });
	}
});

// Create alarm
// router.post("/", authenticate, async (req, res) => {
// 	try {
// 		const { type, branchId, location, severity, description, status } =
// 			req.body;

// 		if (!type || !branchId || !location || !severity || !description) {
// 			return res.status(400).json({ error: "Missing required fields" });
// 		}

// 		const alarmData = {
// 			type,
// 			branchId: Number.parseInt(branchId),
// 			location,
// 			severity,
// 			description,
// 			status,
// 			createdById: req.user!.id,
// 		};

// 		const alarm = await prisma.alarm.create({
// 			data: alarmData,
// 			include: {
// 				branch: {
// 					select: {
// 						name: true,
// 						company: {
// 							select: {
// 								name: true,
// 							},
// 						},
// 					},
// 				},
// 				createdBy: {
// 					select: {
// 						firstName: true,
// 						lastName: true,
// 					},
// 				},
// 			},
// 		});

// 		// Broadcast to police managers via WebSocket
// 		broadcastAlarmToPolice({
// 			id: alarm.id,
// 			type: alarm.type,
// 			branchId: alarm.branchId,
// 			branchName: alarm.branch.name,
// 			location: alarm.location,
// 			severity: alarm.severity,
// 			description: alarm.description,
// 			createdBy: `${alarm.createdBy.firstName} ${alarm.createdBy.lastName}`,
// 			createdAt: alarm.createdAt,
// 			status: alarm.status,
// 		});

// 		res.status(201).json({ alarm });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ error: "Failed to create alarm" });
// 	}
// });

router.post(
	"/",
	authenticate,
	authorize("OFFICE_MANAGER", "OPERATOR"),
	async (req: AuthRequest, res) => {
		try {
			// const { type, branchId, location, severity, description, status } =
			// 	req.body;

			// if (!type || !branchId || !location || !severity || !description) {
			// 	return res.status(400).json({ error: "Missing required fields" });
			// }

			// const alarmData = {
			// 	type,
			// 	branchId: branchId,
			// 	location,
			// 	severity,
			// 	description,
			// 	status,
			// 	createdById: req.user!.id,
			// };

			// const alarm = await prisma.alarm.create({
			// 	data: alarmData,
			// 	include: {
			// 		branch: {
			// 			select: {
			// 				name: true,
			// 				company: {
			// 					select: {
			// 						name: true,
			// 					},
			// 				},
			// 			},
			// 		},
			// 		createdBy: {
			// 			select: { id: true, name: true, email: true },
			// 		},
			// 	},
			// });

			// // Broadcast to police managers via WebSocket
			// broadcastAlarmToPolice({
			// 	id: alarm.id,
			// 	type: alarm.type,
			// 	branchId: alarm.branchId,
			// 	branchName: alarm.branch.name,
			// 	location: alarm.location,
			// 	severity: alarm.severity,
			// 	description: alarm.description,
			// 	createdBy: `${alarm.createdBy.name}`,
			// 	createdAt: alarm.createdAt,
			// 	status: alarm.status,
			// });

			// res.status(201).json({ alarm });

			const data = createAlarmSchema.parse(req.body);

			// Verify branch access
			const branch = await prisma.branch.findUnique({
				where: { id: data.branchId },
			});

			if (!branch) {
				return res.status(404).json({ error: "Branch not found" });
			}

			// Check if user has access to this branch
			if (req.user?.role === "OFFICE_MANAGER") {
				if (branch.createdById !== req.user.id) {
					return res
						.status(403)
						.json({ error: "Access denied to this branch" });
				}
			} else if (req.user?.role === "OPERATOR") {
				const assignment = await prisma.branchOperator.findFirst({
					where: {
						userId: req.user.id,
						branchId: data.branchId,
					},
				});
				if (!assignment) {
					return res
						.status(403)
						.json({ error: "Access denied to this branch" });
				}
			}

			// Create alarm
			const alarm = await prisma.alarm.create({
				data: {
					type: data.type,
					branchId: data.branchId,
					location: data.location,
					severity: data.severity,
					description: data.description,
					additionalNotes: data.additionalNotes,
					createdById: req.user!.id,
				},
				include: {
					branch: true,
					createdBy: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			// Create alarm report for police manager
			await prisma.alarmReport.create({
				data: {
					alarmId: alarm.id,
					assignedToId: data.assignedToId,
				},
			});

			// Broadcast to police managers via WebSocket
			broadcastAlarmToPolice({
				id: alarm.id,
				type: alarm.type,
				branchId: alarm.branchId,
				branchName: alarm.branch.name,
				location: alarm.location,
				severity: alarm.severity,
				description: alarm.description,
				createdBy: `${alarm.createdBy.name}`,
				createdAt: alarm.createdAt,
				status: alarm.status,
			});

			res.status(201).json({
				message: "Alarm created and dispatched successfully",
				alarm,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ error: "Validation failed", details: error.errors });
			}
			res.status(500).json({ error: "Failed to create alarm" });
		}
	}
);

// Update an alarm
router.put("/:id", authenticate, async (req, res) => {
	const { id } = req.params;
	try {
		const { type, branchId, location, severity, description, status } =
			req.body;

		const alarm = await prisma.alarm.findUnique({
			where: { id },
			include: {
				branch: {
					select: {
						name: true,
						company: {
							select: {
								name: true,
							},
						},
					},
				},
				createdBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		if (!alarm) {
			return res.status(404).json({ error: "Alarm not found" });
		}

		const updatedAlarm = await prisma.alarm.update({
			where: { id: id },
			data: {
				type,
				branchId: branchId ? branchId : alarm.branchId,
				location,
				severity,
				description,
				status,
			},
			include: {
				branch: {
					select: {
						name: true,
						company: {
							select: {
								name: true,
							},
						},
					},
				},
				createdBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		// Broadcast update to police managers
		broadcastAlarmUpdate({
			id: updatedAlarm.id,
			type: updatedAlarm.type,
			branchId: updatedAlarm.branchId,
			branchName: updatedAlarm.branch.name,
			location: updatedAlarm.location,
			severity: updatedAlarm.severity,
			description: updatedAlarm.description,
			createdBy: `${updatedAlarm.createdBy.name} `,
			createdAt: updatedAlarm.createdAt,
			status: updatedAlarm.status,
		});

		res.json({ alarm: updatedAlarm });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to update alarm" });
	}
});

// Delete an alarm
router.delete("/:id", authenticate, async (req, res) => {
	const { id } = req.params;
	try {
		const alarm = await prisma.alarm.findUnique({
			where: { id: id },
		});

		if (!alarm) {
			return res.status(404).json({ error: "Alarm not found" });
		}

		await prisma.alarm.delete({
			where: { id },
		});

		res.json({ message: "Alarm deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to delete alarm" });
	}
});

export default router;
