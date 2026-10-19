"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const websocket_server_1 = require("../lib/websocket-server");
const date_fns_1 = require("date-fns");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const createAlarmSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    branchId: zod_1.z.string().min(1),
    companyId: zod_1.z.string().optional(),
    severity: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    description: zod_1.z.string().optional(),
    additionalNotes: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().min(1), // Police Manager ID
});
// Get alarms by company_id if user is OFFICE_MANAGER or OPERATOR
router.get("/", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req === null || req === void 0 ? void 0 : req.user;
        const where = {};
        console.log({
            user: req === null || req === void 0 ? void 0 : req.user
        });
        if ((user.role === "OFFICE_MANAGER") || ((user === null || user === void 0 ? void 0 : user.role) === "OPERATOR" && (user === null || user === void 0 ? void 0 : user.operatorType) === "OFFICE")) {
            if (!user.companyId) {
                return res.status(400).json({ error: "User is not assigned to a company" });
            }
            where.branch = {
                companyId: user.companyId,
            };
        }
        const alarms = yield prisma.alarm.findMany({
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
                    select: { id: true, name: true, email: true, phone: true },
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
                                phone: true,
                                company: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        acknowledgedBy: {
                            select: { id: true, name: true, email: true, phone: true },
                        },
                        resolvedBy: {
                            select: { id: true, name: true, email: true, phone: true },
                        },
                    },
                },
            },
        });
        // Format datetime fields as ISO 8601 strings
        const formattedAlarms = alarms.map(alarm => (Object.assign(Object.assign({}, alarm), { reports: alarm.reports.map(report => (Object.assign(Object.assign({}, report), { alarmCode: alarm.alarmCode, acknowledgedAt: report.acknowledgedAt ? (0, date_fns_1.formatISO)(report.acknowledgedAt) : null, completedAt: report.completedAt ? (0, date_fns_1.formatISO)(report.completedAt) : null }))) })));
        const statusOrder = {
            ACTIVE: 0,
            ACKNOWLEDGED: 1,
            RESOLVED: 2,
        };
        // Sort alarms manually by status first, then by createdAt desc
        const sortedAlarms = formattedAlarms.sort((a, b) => {
            const statusCompare = statusOrder[a.status] - statusOrder[b.status];
            if (statusCompare !== 0)
                return statusCompare;
            // If same status, sort by createdAt desc
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        res.json({ alarms: sortedAlarms });
        // res.json({ alarms: formattedAlarms });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch alarms" });
    }
}));
// Get alarm by ID
router.get("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const alarm = yield prisma.alarm.findUnique({
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
                    select: { id: true, name: true, email: true, phone: true },
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
                                phone: true,
                                company: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        acknowledgedBy: {
                            select: { id: true, name: true, email: true, phone: true },
                        },
                        resolvedBy: {
                            select: { id: true, name: true, email: true, phone: true },
                        },
                    },
                },
            },
        });
        if (!alarm) {
            return res.status(404).json({ error: "Alarm not found" });
        }
        // Format report timestamps
        const formattedAlarm = Object.assign(Object.assign({}, alarm), { reports: alarm.reports.map((report) => (Object.assign(Object.assign({}, report), { alarmCode: alarm.alarmCode, acknowledgedAt: report.acknowledgedAt ? (0, date_fns_1.formatISO)(report.acknowledgedAt) : null, completedAt: report.completedAt ? (0, date_fns_1.formatISO)(report.completedAt) : null }))) });
        res.json({ alarm: formattedAlarm });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch alarm" });
    }
}));
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("OFFICE_MANAGER", "OPERATOR"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        console.log("Creating alarm with data:", req.body);
        const data = createAlarmSchema.parse(req.body);
        // Verify branch access
        const branch = yield prisma.branch.findUnique({
            where: { id: data.branchId },
        });
        if (!branch) {
            return res.status(404).json({ error: "Branch not found" });
        }
        // Check if user has access to this branch
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "OFFICE_MANAGER") {
            if (branch.createdById !== req.user.id) {
                return res
                    .status(403)
                    .json({ error: "Access denied to this branch" });
            }
        }
        else if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "OPERATOR") {
            const assignment = yield prisma.companyOperator.findFirst({
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
        console.log("Branch access verified for user:", (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
        const generateUniqueAlarmCode = () => {
            let code;
            let exists;
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
        const alarm = yield prisma.alarm.create({
            data: {
                alarmCode,
                type: data.type,
                branchId: data.branchId,
                companyId: req.user.companyId,
                location: branch.gpsAddress || "",
                latitude: branch.latitude || "",
                longitude: branch.longitude || "",
                status: "ACTIVE",
                severity: data.severity,
                description: (data === null || data === void 0 ? void 0 : data.description) || "No Description",
                additionalNotes: data.additionalNotes,
                createdById: req.user.id,
            },
            include: {
                branch: true,
                createdBy: {
                    select: { id: true, name: true, email: true, phone: true },
                },
            },
        });
        console.log("Alarm created:", alarm);
        // Create alarm report for police manager
        yield prisma.alarmReport.create({
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
        (0, websocket_server_1.broadcastAlarmToPolice)({
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
            createdByPhone: `${(_d = alarm.createdBy) === null || _d === void 0 ? void 0 : _d.phone}` || "",
            createdAt: alarm.createdAt,
            status: alarm.status,
        });
        // Broadcast to police managers via WebSocket
        // broadcastAlarmToPolice(alarmData)
        res.status(201).json({
            message: "Alarm created and dispatched successfully",
            alarm,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        console.error("Error creating alarm:", error);
        res.status(500).json({ error: "Failed to create alarm" });
    }
}));
router.put("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { type, branchId, location, severity, description, status, resolutionDescription } = req.body;
        const user = req.user;
        console.log({ type, branchId, location, severity, description, status });
        // Find alarm
        const alarm = yield prisma.alarm.findUnique({
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
        const updatedAlarm = yield prisma.alarm.update({
            where: { id },
            data: {
                type,
                branchId: branchId !== null && branchId !== void 0 ? branchId : alarm.branchId,
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
        const latestReport = yield prisma.alarmReport.findFirst({
            where: { alarmId: id },
            orderBy: { createdAt: "desc" },
        });
        console.log({
            latestReport
        });
        // Update AlarmReport status info if available
        if (latestReport) {
            const reportUpdateData = {};
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
                yield prisma.alarmReport.update({
                    where: { id: latestReport.id },
                    data: reportUpdateData,
                });
            }
        }
        // Broadcast update
        (0, websocket_server_1.broadcastAlarmUpdate)({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update alarm" });
    }
}));
// Delete an alarm
router.delete("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const alarm = yield prisma.alarm.findUnique({
            where: { id: id },
        });
        if (!alarm) {
            return res.status(404).json({ error: "Alarm not found" });
        }
        yield prisma.alarm.delete({
            where: { id },
        });
        res.json({ message: "Alarm deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete alarm" });
    }
}));
exports.default = router;
