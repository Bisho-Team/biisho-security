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
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get system analytics (Super Admin only)
router.get("/system", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalUsers, totalCompanies, totalBranches, totalAlarms, activeAlarms, resolvedAlarms, usersByRole, alarmsBySeverity, recentActivity,] = yield Promise.all([
            prisma.user.count(),
            prisma.company.count(),
            prisma.branch.count(),
            prisma.alarm.count(),
            prisma.alarm.count({ where: { status: "ACTIVE" } }),
            prisma.alarm.count({ where: { status: "RESOLVED" } }),
            prisma.user.groupBy({
                by: ["role"],
                _count: { role: true },
            }),
            prisma.alarm.groupBy({
                by: ["severity"],
                _count: { severity: true },
            }),
            prisma.alarm.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                    branch: { select: { name: true } },
                    createdBy: { select: { name: true } },
                },
            }),
        ]);
        res.json({
            overview: {
                totalUsers,
                totalCompanies,
                totalBranches,
                totalAlarms,
                activeAlarms,
                resolvedAlarms,
            },
            usersByRole,
            alarmsBySeverity,
            recentActivity,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch system analytics" });
    }
}));
// Get police manager analytics
router.get("/police", auth_1.authenticate, (0, auth_1.authorize)("POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalReports, pendingReports, completedReports, avgResponseTime, reportsByStatus,] = yield Promise.all([
            prisma.alarmReport.count({
                where: { assignedToId: req.user.id },
            }),
            prisma.alarmReport.count({
                where: { assignedToId: req.user.id, status: "PENDING" },
            }),
            prisma.alarmReport.count({
                where: { assignedToId: req.user.id, status: "COMPLETED" },
            }),
            // Calculate average response time (mock for now)
            Promise.resolve(4.2),
            prisma.alarmReport.groupBy({
                by: ["status"],
                where: { assignedToId: req.user.id },
                _count: { status: true },
            }),
        ]);
        res.json({
            overview: {
                totalReports,
                pendingReports,
                completedReports,
                avgResponseTime,
            },
            reportsByStatus,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch police analytics" });
    }
}));
// Get office manager analytics
router.get("/office", auth_1.authenticate, (0, auth_1.authorize)("OFFICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalBranches, totalOperators, totalAlarms, activeAlarms, branchesData,] = yield Promise.all([
            prisma.branch.count({
                where: { createdById: req.user.id },
            }),
            prisma.user.count({
                where: { managedById: req.user.id, role: "OPERATOR" },
            }),
            prisma.alarm.count({
                where: {
                    branch: { createdById: req.user.id },
                },
            }),
            prisma.alarm.count({
                where: {
                    branch: { createdById: req.user.id },
                    status: "ACTIVE",
                },
            }),
            prisma.branch.findMany({
                where: { createdById: req.user.id },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            _count: {
                                select: {
                                    CompanyOperator: true, // ✅ Count of operators assigned to this branch's company
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            alarms: true,
                        },
                    },
                },
            })
            // prisma.branch.findMany({
            // 	where: { createdById: req.user!.id },
            // 	include: {
            // 		_count: {
            // 			select: {
            // 				operators: true,
            // 				alarms: true,
            // 			},
            // 		},
            // 	},
            // }),
        ]);
        res.json({
            overview: {
                totalBranches,
                totalOperators,
                totalAlarms,
                activeAlarms,
            },
            branchesData,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch office analytics" });
    }
}));
exports.default = router;
