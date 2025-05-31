import express from "express"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import { authenticate, authorize, type AuthRequest } from "../lib/auth"

const router = express.Router()
const prisma = new PrismaClient()

const updateReportSchema = z.object({
  status: z.enum(["PENDING", "ACKNOWLEDGED", "INVESTIGATING", "COMPLETED"]),
  notes: z.string().optional(),
  resolutionDescription: z.string().optional(),
})

// Get alarm reports (Police Manager only)
router.get("/", authenticate, authorize("POLICE_MANAGER"), async (req: AuthRequest, res) => {
  try {
    const { status } = req.query
    const where: any = {
      assignedToId: req.user!.id,
    }

    if (status) where.status = status

    const reports = await prisma.alarmReport.findMany({
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
    })

    res.json(reports)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" })
  }
})

// Update report status
router.put("/:id", authenticate, authorize("POLICE_MANAGER"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const data = updateReportSchema.parse(req.body)

    // Check if report exists and belongs to this police manager
    const existingReport = await prisma.alarmReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return res.status(404).json({ error: "Report not found" })
    }

    if (existingReport.assignedToId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    const updateData: any = {
      status: data.status,
      notes: data.notes,
    }

    // Set timestamps based on status
    if (data.status === "ACKNOWLEDGED" && !existingReport.acknowledgedAt) {
      updateData.acknowledgedAt = new Date()
    }

    if (data.status === "COMPLETED") {
      updateData.completedAt = new Date()
      updateData.resolutionDescription = data.resolutionDescription
    }

    const report = await prisma.alarmReport.update({
      where: { id },
      data: updateData,
      include: {
        alarm: {
          include: {
            branch: true,
          },
        },
      },
    })

    res.json({
      message: "Report updated successfully",
      report,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors })
    }
    res.status(500).json({ error: "Failed to update report" })
  }
})

export default router
