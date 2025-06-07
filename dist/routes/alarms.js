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
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const createAlarmSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    branchId: zod_1.z.string().min(1),
    location: zod_1.z.string().optional(),
    severity: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    description: zod_1.z.string().min(1),
    additionalNotes: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().min(1), // Police Manager ID
});
const updateAlarmSchema = zod_1.z.object({
    status: zod_1.z
        .enum(["ACTIVE", "ACKNOWLEDGED", "DISPATCHED", "RESOLVED"])
        .optional(),
    additionalNotes: zod_1.z.string().optional(),
});
// Get alarms
router.get("/", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { status, severity, branchId } = req.query;
        const where = {};
        // Filter based on user role
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "OFFICE_MANAGER" || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "OPERATOR") {
            // Get branches accessible to this user
            let accessibleBranchIds = [];
            if (req.user.role === "OFFICE_MANAGER") {
                const branches = yield prisma.branch.findMany({
                    where: { createdById: req.user.id },
                    select: { id: true },
                });
                accessibleBranchIds = branches.map((b) => b.id);
            }
            else if (req.user.role === "OPERATOR") {
                const assignments = yield prisma.branchOperator.findMany({
                    where: { userId: req.user.id },
                    select: { branchId: true },
                });
                accessibleBranchIds = assignments.map((a) => a.branchId);
            }
            where.branchId = { in: accessibleBranchIds };
        }
        // Add filters
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        if (branchId)
            where.branchId = branchId;
        const alarms = yield prisma.alarm.findMany({
            where,
            include: {
                branch: {
                    select: { id: true, name: true, city: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                reports: {
                    include: {
                        assignedTo: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(alarms);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch alarms" });
    }
}));
// Get alarm by ID
router.get("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const alarm = yield prisma.alarm.findUnique({
            where: { id },
            include: {
                branch: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                reports: {
                    include: {
                        assignedTo: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
        });
        if (!alarm) {
            return res.status(404).json({ error: "Alarm not found" });
        }
        res.json(alarm);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch alarm" });
    }
}));
// Create alarm
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("OFFICE_MANAGER", "OPERATOR"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
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
            const assignment = yield prisma.branchOperator.findFirst({
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
        const alarm = yield prisma.alarm.create({
            data: {
                type: data.type,
                branchId: data.branchId,
                location: data.location,
                severity: data.severity,
                description: data.description,
                additionalNotes: data.additionalNotes,
                createdById: req.user.id,
            },
            include: {
                branch: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        // Create alarm report for police manager
        yield prisma.alarmReport.create({
            data: {
                alarmId: alarm.id,
                assignedToId: data.assignedToId,
            },
        });
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
        res.status(500).json({ error: "Failed to create alarm" });
    }
}));
// Update alarm
router.put("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Updating alarm with ID:", req.params.id);
        const { id } = req.params;
        const data = updateAlarmSchema.parse(req.body);
        console.log("Parsed data:", data);
        const alarm = yield prisma.alarm.update({
            where: { id },
            data,
            include: {
                branch: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        res.json({
            message: "Alarm updated successfully",
            alarm,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update alarm" });
    }
}));
exports.default = router;
