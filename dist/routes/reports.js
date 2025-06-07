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
const updateReportSchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "ACKNOWLEDGED", "INVESTIGATING", "COMPLETED"]),
    notes: zod_1.z.string().optional(),
    resolutionDescription: zod_1.z.string().optional(),
});
// Get alarm reports (Police Manager only)
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.query;
        const where = {
            assignedToId: req.user.id,
        };
        if (status)
            where.status = status;
        const reports = yield prisma.alarmReport.findMany({
            where,
            include: {
                alarm: {
                    include: {
                        branch: {
                            select: { id: true, name: true, city: true },
                        },
                        createdBy: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch reports" });
    }
}));
// Update report status
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = updateReportSchema.parse(req.body);
        // Check if report exists and belongs to this police manager
        const existingReport = yield prisma.alarmReport.findUnique({
            where: { id },
        });
        if (!existingReport) {
            return res.status(404).json({ error: "Report not found" });
        }
        if (existingReport.assignedToId !== req.user.id) {
            return res.status(403).json({ error: "Access denied" });
        }
        const updateData = {
            status: data.status,
            notes: data.notes,
        };
        // Set timestamps based on status
        if (data.status === "ACKNOWLEDGED" && !existingReport.acknowledgedAt) {
            updateData.acknowledgedAt = new Date();
        }
        if (data.status === "COMPLETED") {
            updateData.completedAt = new Date();
            updateData.resolutionDescription = data.resolutionDescription;
        }
        const report = yield prisma.alarmReport.update({
            where: { id },
            data: updateData,
            include: {
                alarm: {
                    include: {
                        branch: true,
                    },
                },
            },
        });
        res.json({
            message: "Report updated successfully",
            report,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update report" });
    }
}));
exports.default = router;
