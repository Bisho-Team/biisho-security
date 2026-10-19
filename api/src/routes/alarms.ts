
import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, type AuthRequest } from "../lib/auth";
import { broadcastAlarmToPolice,
	broadcastAlarmUpdate, } from "../lib/websocket-server";
import { formatISO, subDays, startOfDay } from "date-fns"
import PDFDocument from "pdfkit"


const router = express.Router();
const prisma = new PrismaClient();

const createAlarmSchema = z.object({
	type: z.string().min(1),
	branchId: z.string().min(1),
	companyId: z.string().optional(), 
	severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
	description: z.string().optional(),
	additionalNotes: z.string().optional(),
	assignedToId: z.string().min(1), // Police Manager ID
});

// Get alarms by company_id if user is OFFICE_MANAGER or OPERATOR
router.get("/", authenticate, async (req: AuthRequest, res) => {
	try {
		const user = req?.user!;
		const where: any = {};
		console.log({
			user: req?.user
		})
		if ((user.role === "OFFICE_MANAGER") || (user?.role === "OPERATOR" && user?.operatorType === "OFFICE")) {
			if (!user.companyId) {
				return res.status(400).json({ error: "User is not assigned to a company" });
			}
			where.branch = {
				companyId: user.companyId,
			};
		}
		const alarms = await prisma.alarm.findMany({
			where,
			orderBy: {
				createdAt: 'desc',
			},
			include: {
			  branch: {
				select: {
				  name: true,
				  locationType: true,
				  gpsAddress: true,
				  city: true,
				  subCity: true,
				  woreda: true,
				  country: true,
				  managerName: true,
				  phoneNumber: true,
				  contactNumber1: true,
				  company: {
					select: {
					  name: true,
					  logo: true,
					},
				  },
				},
			  },
			  createdBy: {
				select: { id: true, name: true, email: true, phone:true },
			  },
			  reports: {
				select: {
				  id: true,
				  status: true,
				  acknowledgedAt: true,
				  completedAt: true,
				  resolutionDescription: true,
				  notes: true,
				  assignedTo: {
					select: {
					  id: true,
					  name: true,
					  phone:true,
					  company: {
						select: {
						  name: true,
						},
					  },
					},
				  },
				acknowledgedBy: {
					select: { id: true, name: true, email:true, phone:true },
				},
				resolvedBy: {
					select: { id: true, name: true, email:true, phone:true },
				},
				},
			  },
			},
		});

		// Format datetime fields as ISO 8601 strings
		const formattedAlarms = alarms.map(alarm => ({
			...alarm,
			reports: alarm.reports.map(report => ({
				...report,
				alarmCode: alarm.alarmCode,
				acknowledgedAt: report.acknowledgedAt ? formatISO(report.acknowledgedAt) : null,
				completedAt: report.completedAt ? formatISO(report.completedAt) : null,
			})),
		}));

		const statusOrder = {
			ACTIVE: 0,
			ACKNOWLEDGED: 1,
			RESOLVED: 2,
		};
		  
		// Sort alarms manually by status first, then by createdAt desc
		const sortedAlarms = formattedAlarms.sort((a, b) => {
		const statusCompare = statusOrder[a.status] - statusOrder[b.status];
		if (statusCompare !== 0) return statusCompare;
		
		// If same status, sort by createdAt desc
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
		  
		res.json({ alarms: sortedAlarms });

		// res.json({ alarms: formattedAlarms });

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
						locationType: true,
						gpsAddress: true,
						city: true,
						subCity: true,
						woreda: true,
						country: true,
						managerName: true,
						phoneNumber: true,
						contactNumber1: true,
						company: {
							select: {
								name: true,
								logo: true,
							},
						},
					},
				},
				createdBy: {
					select: { id: true, name: true, email: true, phone:true },
				},
				reports: {
					select: { 
						id: true,
						status: true,
						acknowledgedAt: true,
						completedAt: true,
						resolutionDescription: true,
						notes: true,
						assignedTo: {
							select: {
								id: true,
								name: true,
								phone:true,
								company: {
									select: {
										name: true,
									},
								},
							},
						},
						acknowledgedBy: {
							select: { id: true, name: true, email:true, phone:true },
						},
						resolvedBy: {
							select: { id: true, name: true, email:true, phone:true },
						},
					},
				},
			},
		});

		if (!alarm) {
			return res.status(404).json({ error: "Alarm not found" });
		}

		// Format report timestamps
		const formattedAlarm = {
			...alarm,
			reports: alarm.reports.map((report) => ({
				...report,
				alarmCode: alarm.alarmCode,
				acknowledgedAt: report.acknowledgedAt ? formatISO(report.acknowledgedAt) : null,
				completedAt: report.completedAt ? formatISO(report.completedAt) : null,
			})),
		};

		res.json({ alarm: formattedAlarm });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch alarm" });
	}
});

router.post(
	"/",
	authenticate,
	authorize("OFFICE_MANAGER", "OPERATOR"),
	async (req: AuthRequest, res) => {
		try {
			console.log("Creating alarm with data:", req.body);


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
				const assignment = await prisma.companyOperator.findFirst({
					where: {
						operatorId: req.user.id,
						companyId: data.companyId,			
					},
				});
				if (!assignment) {
					return res
						.status(403)
						.json({ error: "Access denied to this branch" });
				}
			}

			console.log("Branch access verified for user:", req?.user?.id);

			const generateUniqueAlarmCode = () => {
				let code: string;
				let exists: any;

				code = `ALM-${Math.floor(100000 + Math.random() * 900000)}`;
			
				// do {
				// 	code = `ALM-${Math.floor(100000 + Math.random() * 900000)}`;
				// 	exists = await prisma.alarm.findUnique({
				// 		where: { alarmCode: code },
				// 	});
				// } while (exists);
			
				return code;
			};
			
			const alarmCode = generateUniqueAlarmCode();

			// Create alarm
			const alarm = await prisma.alarm.create({
				data: {
					alarmCode,
					type: data.type,
					branchId: data.branchId,
					companyId: req.user!.companyId!,
					location: branch.gpsAddress || "",
					latitude:branch.latitude || "",
					longitude:branch.longitude || "",
                    status:"ACTIVE",
					severity: data.severity,
					description: data?.description || "No Description",
					additionalNotes: data.additionalNotes,
					createdById: req.user!.id,
				},
				include: {
					branch: true,
					createdBy: {
						select: { id: true, name: true, email: true, phone:true },
					},
				},
			});

			console.log("Alarm created:", alarm);

			// Create alarm report for police manager
			await prisma.alarmReport.create({
				data: {
					alarmId: alarm.id,
					assignedToId: data.assignedToId,
					companyName: branch.companyName,
					companyLogo: branch.logo || null,
					branchName: branch.name || null,
					branchlocationType: branch.locationType || null,
					branchgpsAddress: branch.gpsAddress || null,
					branchcity: branch.city || null,
					branchsubCity: branch.subCity || null,
					branchworeda: branch.woreda || null,
					branchcountry: branch.country || null,
					branchmanagerName: branch.managerName || null,
					branchphoneNumber: branch.phoneNumber || null,
					branchcontactNumber1: branch.contactNumber1 || null,
				},
			});



			//Broadcast to police managers via WebSocket
			broadcastAlarmToPolice({
				id: alarm.id,
				type: alarm.type,
				alarmCode: alarm.alarmCode,
				branchId: alarm.branchId,
				branchName: alarm.branch.name,

				companyLogo: branch.logo,
				companyName: branch.companyName,

				branchlocationType: branch.locationType || null,
				branchgpsAddress: branch.gpsAddress || null,
				branchcity: branch.city || null,
				branchsubCity: branch.subCity || null,
				branchworeda: branch.woreda || null,
				branchcountry: branch.country || null,
				branchmanagerName: branch.managerName || null,
				branchphoneNumber: branch.phoneNumber || null,
				branchcontactNumber1: branch.contactNumber1 || null,

				
				location: alarm.location,
				longitude: alarm.longitude,
				latitude: alarm.latitude,
				severity: alarm.severity,
				description: alarm.description,
				createdBy: `${alarm.createdBy.name}`,
				createdByEmail: `${alarm.createdBy.email}`,
				createdByPhone: `${alarm.createdBy?.phone}` || "",
				createdAt: alarm.createdAt,
				status: alarm.status,
			});

			// Broadcast to police managers via WebSocket
			// broadcastAlarmToPolice(alarmData)

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
			console.error("Error creating alarm:", error);
			res.status(500).json({ error: "Failed to create alarm" });
		}
	}
);

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
	const { id } = req.params;
	try {
		const { type, branchId, location, severity, description, status, resolutionDescription } = req.body;
		const user = req.user!;

		console.log({ type, branchId, location, severity, description, status })

		// Find alarm
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

		// Update Alarm base info
		const updatedAlarm = await prisma.alarm.update({
			where: { id },
			data: {
				type,
				branchId: branchId ?? alarm.branchId,
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
							select: { name: true },
						},
					},
				},
				createdBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		// Find latest AlarmReport
		const latestReport = await prisma.alarmReport.findFirst({
			where: { alarmId: id },
			orderBy: { createdAt: "desc" },
		});

		console.log({
			latestReport
		})

		// Update AlarmReport status info if available
		if (latestReport) {
			const reportUpdateData: any = {};

			if (status === "ACKNOWLEDGED" && !latestReport.acknowledgedById) {
				reportUpdateData.acknowledgedById = user.id;
				reportUpdateData.acknowledgedAt = new Date();
			}

			if (status === "RESOLVED" && !latestReport.resolvedById) {
				reportUpdateData.resolvedById = user.id;
				reportUpdateData.resolutionDescription = resolutionDescription || "No resolution description provided";
				reportUpdateData.completedAt = new Date();
			}

			if (Object.keys(reportUpdateData).length > 0) {
				await prisma.alarmReport.update({
					where: { id: latestReport.id },
					data: reportUpdateData,
				});
			}
		}

		// Broadcast update
		broadcastAlarmUpdate({
			id: updatedAlarm.id,
			type: updatedAlarm.type,
			branchId: updatedAlarm.branchId,
			branchName: updatedAlarm.branch.name,
			location: updatedAlarm.location,
			severity: updatedAlarm.severity,
			description: updatedAlarm.description,
			createdBy: updatedAlarm.createdBy.name,
			createdAt: updatedAlarm.createdAt,
			status: updatedAlarm.status,
		});

		 // Broadcast update to police
		//  broadcastAlarmUpdate(alarmUpdateData)

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
