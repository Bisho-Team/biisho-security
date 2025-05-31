import express from "express"
import { PrismaClient } from "@prisma/client"
import { authenticate, authorize, type AuthRequest } from "../lib/auth"

const router = express.Router()
const prisma = new PrismaClient()

// Get system analytics (Super Admin only)
router.get("/system", authenticate, authorize("SUPER_ADMIN"), async (req: AuthRequest, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalBranches,
      totalAlarms,
      activeAlarms,
      resolvedAlarms,
      usersByRole,
      alarmsBySeverity,
      recentActivity,
    ] = await Promise.all([
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
    ])

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
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch system analytics" })
  }
})

// Get police manager analytics
router.get("/police", authenticate, authorize("POLICE_MANAGER"), async (req: AuthRequest, res) => {
  try {
    const [totalReports, pendingReports, completedReports, avgResponseTime, reportsByStatus] = await Promise.all([
      prisma.alarmReport.count({
        where: { assignedToId: req.user!.id },
      }),
      prisma.alarmReport.count({
        where: { assignedToId: req.user!.id, status: "PENDING" },
      }),
      prisma.alarmReport.count({
        where: { assignedToId: req.user!.id, status: "COMPLETED" },
      }),
      // Calculate average response time (mock for now)
      Promise.resolve(4.2),
      prisma.alarmReport.groupBy({
        by: ["status"],
        where: { assignedToId: req.user!.id },
        _count: { status: true },
      }),
    ])

    res.json({
      overview: {
        totalReports,
        pendingReports,
        completedReports,
        avgResponseTime,
      },
      reportsByStatus,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch police analytics" })
  }
})

// Get office manager analytics
router.get("/office", authenticate, authorize("OFFICE_MANAGER"), async (req: AuthRequest, res) => {
  try {
    const [totalBranches, totalOperators, totalAlarms, activeAlarms, branchesData] = await Promise.all([
      prisma.branch.count({
        where: { createdById: req.user!.id },
      }),
      prisma.user.count({
        where: { managedById: req.user!.id, role: "OPERATOR" },
      }),
      prisma.alarm.count({
        where: {
          branch: { createdById: req.user!.id },
        },
      }),
      prisma.alarm.count({
        where: {
          branch: { createdById: req.user!.id },
          status: "ACTIVE",
        },
      }),
      prisma.branch.findMany({
        where: { createdById: req.user!.id },
        include: {
          _count: {
            select: {
              operators: true,
              alarms: true,
            },
          },
        },
      }),
    ])

    res.json({
      overview: {
        totalBranches,
        totalOperators,
        totalAlarms,
        activeAlarms,
      },
      branchesData,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch office analytics" })
  }
})

export default router
