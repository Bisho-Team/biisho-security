import express from "express"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import { authenticate, authorize, type AuthRequest } from "../lib/auth"
import { formatISO, subDays, startOfDay } from "date-fns"
import PDFDocument from "pdfkit"


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

// Get comprehensive alarm statistics
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
try {
  const user = req.user!
  const { dateFrom, dateTo, status, severity, branchId, companyId } = req.query

  // Build where clause based on user role and filters
  const where: any = {}

  if (user.role === "OFFICE_MANAGER" || (user.role === "OPERATOR" && user.operatorType === "OFFICE")) {
  if (!user.companyId) {
    return res.status(400).json({ error: "User is not assigned to a company" })
  }
  where.branch = { companyId: user.companyId }
  }

  // Apply filters
  if (dateFrom && dateTo) {
  where.createdAt = {
    gte: new Date(dateFrom as string),
    lte: new Date(dateTo as string),
  }
  }

  if (status && status !== "all") {
  where.status = status
  }

  if (severity && severity !== "all") {
  where.severity = severity
  }

  if (branchId && branchId !== "all") {
  where.branchId = branchId
  }

  // Get basic counts
  const [total, active, acknowledged, resolved] = await Promise.all([
  prisma.alarm.count({ where }),
  prisma.alarm.count({ where: { ...where, status: "ACTIVE" } }),
  prisma.alarm.count({ where: { ...where, status: "ACKNOWLEDGED" } }),
  prisma.alarm.count({ where: { ...where, status: "RESOLVED" } }),
  ])

  // Get severity counts
  const [critical, high, medium, low] = await Promise.all([
  prisma.alarm.count({ where: { ...where, severity: "CRITICAL" } }),
  prisma.alarm.count({ where: { ...where, severity: "HIGH" } }),
  prisma.alarm.count({ where: { ...where, severity: "MEDIUM" } }),
  prisma.alarm.count({ where: { ...where, severity: "LOW" } }),
  ])

  // Calculate response times
  const alarmsWithReports = await prisma.alarm.findMany({
  where,
  include: {
    reports: {
    select: {
      acknowledgedAt: true,
      completedAt: true,
    },
    },
  },
  })

  let totalResponseTime = 0
  let totalResolutionTime = 0
  let responseCount = 0
  let resolutionCount = 0

  alarmsWithReports.forEach((alarm) => {
  const report = alarm.reports[0]
  if (report?.acknowledgedAt) {
    const responseTime = new Date(report.acknowledgedAt).getTime() - new Date(alarm.createdAt).getTime()
    totalResponseTime += responseTime / (1000 * 60) // Convert to minutes
    responseCount++
  }
  if (report?.completedAt) {
    const resolutionTime = new Date(report.completedAt).getTime() - new Date(alarm.createdAt).getTime()
    totalResolutionTime += resolutionTime / (1000 * 60) // Convert to minutes
    resolutionCount++
  }
  })

  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0
  const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0

  // Get daily trends for the last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30)
  const dailyTrends = await prisma.alarm.groupBy({
  by: ["createdAt"],
  where: {
    ...where,
    createdAt: {
    gte: thirtyDaysAgo,
    },
  },
  _count: {
    id: true,
  },
  })

  // Get top alarm types
  const alarmTypes = await prisma.alarm.groupBy({
  by: ["type"],
  where,
  _count: {
    id: true,
  },
  orderBy: {
    _count: {
    id: "desc",
    },
  },
  take: 10,
  })

  res.json({
  stats: {
    total,
    active,
    acknowledged,
    resolved,
    critical,
    high,
    medium,
    low,
    avgResponseTime: Math.round(avgResponseTime),
    avgResolutionTime: Math.round(avgResolutionTime),
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  },
  trends: {
    daily: dailyTrends,
    alarmTypes: alarmTypes.map((type) => ({
    type: type.type,
    count: type._count.id,
    })),
  },
  })
} catch (error) {
  console.error("Error fetching alarm stats:", error)
  res.status(500).json({ error: "Failed to fetch alarm statistics" })
}
})

// Get performance metrics by company/branch
router.get("/performance", authenticate, async (req: AuthRequest, res) => {
try {
  const user = req.user!
  const { dateFrom, dateTo } = req.query

  const where: any = {}

  if (user.role === "OFFICE_MANAGER" || (user.role === "OPERATOR" && user.operatorType === "OFFICE")) {
  if (!user.companyId) {
    return res.status(400).json({ error: "User is not assigned to a company" })
  }
  where.branch = { companyId: user.companyId }
  }

  if (dateFrom && dateTo) {
  where.createdAt = {
    gte: new Date(dateFrom as string),
    lte: new Date(dateTo as string),
  }
  }

  // Get company performance data
  const companyPerformance = await prisma.alarm.groupBy({
  by: ["branchId"],
  where,
  _count: {
    id: true,
  },
  // _avg: {
  //   // This would need to be calculated differently in a real scenario
  // },
  })

  // Get detailed company info
  const companiesWithStats = await Promise.all(
  companyPerformance.map(async (perf) => {
    const branch = await prisma.branch.findUnique({
    where: { id: perf.branchId },
    include: {
      company: {
      select: { name: true, logo: true },
      },
    },
    })

    const resolvedCount = await prisma.alarm.count({
    where: {
      ...where,
      branchId: perf.branchId,
      status: "RESOLVED",
    },
    })

    return {
    branchId: perf.branchId,
    branchName: branch?.name || "Unknown",
    companyName: branch?.company?.name || "Unknown",
    totalAlarms: perf._count.id,
    resolvedAlarms: resolvedCount,
    resolutionRate: perf._count.id > 0 ? Math.round((resolvedCount / perf._count.id) * 100) : 0,
    }
  }),
  )

  res.json({
  performance: companiesWithStats.sort((a, b) => b.totalAlarms - a.totalAlarms),
  })
} catch (error) {
  console.error("Error fetching performance metrics:", error)
  res.status(500).json({ error: "Failed to fetch performance metrics" })
}
})

// Export alarms to CSV
router.get("/export/csv", authenticate, async (req: AuthRequest, res) => {
try {
  const user = req.user!
  const { dateFrom, dateTo, status, severity } = req.query

  const where: any = {}

  if (user.role === "OFFICE_MANAGER" || (user.role === "OPERATOR" && user.operatorType === "OFFICE")) {
  if (!user.companyId) {
    return res.status(400).json({ error: "User is not assigned to a company" })
  }
  where.branch = { companyId: user.companyId }
  }

  // Apply filters
  if (dateFrom && dateTo) {
  where.createdAt = {
    gte: new Date(dateFrom as string),
    lte: new Date(dateTo as string),
  }
  }

  if (status && status !== "all") {
  where.status = status
  }

  if (severity && severity !== "all") {
  where.severity = severity
  }

  const alarms = await prisma.alarm.findMany({
  where,
  include: {
    branch: {
    select: {
      name: true,
      city: true,
      company: {
      select: { name: true },
      },
    },
    },
    createdBy: {
    select: { name: true, email: true },
    },
    reports: {
    select: {
      acknowledgedAt: true,
      completedAt: true,
      resolutionDescription: true,
      assignedTo: {
      select: { name: true },
      },
    },
    },
  },
  orderBy: { createdAt: "desc" },
  })

  // Generate CSV headers
  const headers = [
  "Alarm Code",
  "Type",
  "Company",
  "Branch",
  "City",
  "Status",
  "Severity",
  "Description",
  "Created At",
  "Created By",
  "Acknowledged At",
  "Completed At",
  "Response Time (min)",
  "Resolution Time (min)",
  "Resolution Description",
  "Assigned To",
  ]

  // Generate CSV rows
  const rows = alarms.map((alarm) => {
  const report = alarm.reports[0]
  const createdAt = new Date(alarm.createdAt)
  const acknowledgedAt = report?.acknowledgedAt ? new Date(report.acknowledgedAt) : null
  const completedAt = report?.completedAt ? new Date(report.completedAt) : null

  const responseTime = acknowledgedAt
    ? Math.round((acknowledgedAt.getTime() - createdAt.getTime()) / (1000 * 60))
    : ""

  const resolutionTime = completedAt ? Math.round((completedAt.getTime() - createdAt.getTime()) / (1000 * 60)) : ""

  return [
    alarm.alarmCode || "",
    alarm.type || "",
    alarm.branch?.company?.name || "",
    alarm.branch?.name || "",
    alarm.branch?.city || "",
    alarm.status || "",
    alarm.severity || "",
    `"${(alarm.description || "").replace(/"/g, '""')}"`,
    formatISO(createdAt),
    alarm.createdBy?.name || "",
    acknowledgedAt ? formatISO(acknowledgedAt) : "",
    completedAt ? formatISO(completedAt) : "",
    responseTime,
    resolutionTime,
    `"${(report?.resolutionDescription || "").replace(/"/g, '""')}"`,
    report?.assignedTo?.name || "",
  ]
  })

  // Combine headers and rows
  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

  // Set response headers for file download
  res.setHeader("Content-Type", "text/csv")
  res.setHeader(
  "Content-Disposition",
  `attachment; filename="alarm-reports-${new Date().toISOString().split("T")[0]}.csv"`,
  )

  res.send(csvContent)
} catch (error) {
  console.error("Error exporting alarms to CSV:", error)
  res.status(500).json({ error: "Failed to export alarms" })
}
})

// Get alarm trends over time
router.get("/trends", authenticate, async (req: AuthRequest, res) => {
try {
  const user = req.user!
  const { period = "30", groupBy = "day" } = req.query

  const where: any = {}

  if (user.role === "OFFICE_MANAGER" || (user.role === "OPERATOR" && user.operatorType === "OFFICE")) {
  if (!user.companyId) {
    return res.status(400).json({ error: "User is not assigned to a company" })
  }
  where.branch = { companyId: user.companyId }
  }

  // Set date range based on period
  const periodDays = Number.parseInt(period as string)
  const startDate = subDays(new Date(), periodDays)
  where.createdAt = { gte: startDate }

  const alarms = await prisma.alarm.findMany({
  where,
  select: {
    id: true,
    status: true,
    severity: true,
    type: true,
    createdAt: true,
  },
  orderBy: { createdAt: "asc" },
  })

  // Group alarms by date
  const groupedData = alarms.reduce(
  (acc, alarm) => {
    const date = startOfDay(new Date(alarm.createdAt)).toISOString().split("T")[0]

    if (!acc[date]) {
    acc[date] = {
      date,
      total: 0,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }
    }

    acc[date].total++
    acc[date][alarm.status.toLowerCase()]++
    acc[date][alarm.severity.toLowerCase()]++

    return acc
  },
  {} as Record<string, any>,
  )

  // Fill in missing dates with zero values
  const trends = []
  for (let i = 0; i < periodDays; i++) {
  const date = subDays(new Date(), periodDays - 1 - i)
  const dateKey = startOfDay(date).toISOString().split("T")[0]

  trends.push(
    groupedData[dateKey] || {
    date: dateKey,
    total: 0,
    active: 0,
    acknowledged: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    },
  )
  }

  res.json({ trends })
} catch (error) {
  console.error("Error fetching alarm trends:", error)
  res.status(500).json({ error: "Failed to fetch alarm trends" })
}
})

// Export alarms to PDF with comprehensive data
router.post("/export/pdf", authenticate, async (req: AuthRequest, res) => {
  let doc: any | null = null

  try {
    const user = req.user!
    const { filters, reportData } = req.body

    // Create a new PDF document with landscape orientation for better table layout
    doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
      bufferPages: true, // Enable page buffering
    })

    // Set response headers
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="alarm-reports-${new Date().toISOString().split("T")[0]}.pdf"`,
    )

    // Pipe the PDF to the response
    doc.pipe(res)

    // Helper function to format dates
    const formatDate = (dateString: string) => {
      if (!dateString) return ""
      try {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      } catch {
        return "Invalid Date"
      }
    }

    // Helper function to calculate response/resolution times
    const calculateTime = (startDate: string, endDate: string) => {
      if (!startDate || !endDate) return ""
      try {
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime()
        return Math.round((end - start) / (1000 * 60)) // minutes
      } catch {
        return ""
      }
    }

    // Add header with title
    doc.fontSize(24).font("Helvetica-Bold").text("ALARM REPORTS & ANALYTICS", { align: "center" })
    doc.moveDown(0.5)

    // Add generation info
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Generated on: ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        { align: "right" },
      )
      .text(`Generated by: ${reportData?.generatedBy || "System"}`, { align: "right" })
      .text(`User Role: ${user.role}`, { align: "right" })
      .moveDown()

    // Add filters information
    if (reportData?.filters) {
      doc.fontSize(12).font("Helvetica-Bold").text("REPORT FILTERS", { underline: true })
      doc.fontSize(9).font("Helvetica")

      const filterText = []
      if (reportData.filters.dateRange && reportData.filters.dateRange !== "all") {
        filterText.push(`Date Range: Last ${reportData.filters.dateRange} days`)
      }
      if (reportData.filters.customDateRange) {
        filterText.push(`Custom Date Range: ${reportData.filters.customDateRange}`)
      }
      if (reportData.filters.status && reportData.filters.status !== "all") {
        filterText.push(`Status Filter: ${reportData.filters.status}`)
      }
      if (reportData.filters.severity && reportData.filters.severity !== "all") {
        filterText.push(`Severity Filter: ${reportData.filters.severity}`)
      }

      if (filterText.length === 0) {
        filterText.push("No filters applied - showing all data")
      }

      filterText.forEach((filter) => doc!.text(filter))
      doc.moveDown()
    }

    // Add statistics summary
    if (reportData?.stats) {
      doc.fontSize(12).font("Helvetica-Bold").text("SUMMARY STATISTICS", { underline: true })
      doc.fontSize(9).font("Helvetica")

      const stats = reportData.stats
      const statsData = [
        [`Total Alarms: ${stats.total || 0}`, `Active Alarms: ${stats.active || 0}`],
        [`Acknowledged: ${stats.acknowledged || 0}`, `Resolved: ${stats.resolved || 0}`],
        [
          `Resolution Rate: ${stats.resolutionRate || 0}%`,
          `Avg Response: ${Math.round(stats.avgResponseTime || 0)}min`,
        ],
        [`Critical: ${stats.critical || 0}`, `High: ${stats.high || 0}`],
        [`Medium: ${stats.medium || 0}`, `Low: ${stats.low || 0}`],
      ]

      statsData.forEach(([left, right]) => {
        doc!.text(left, 50, doc!.y, { width: 200, continued: true })
        doc!.text(right, 300, doc!.y)
        doc!.moveDown(0.3)
      })
      doc.moveDown()
    }

    // Add comprehensive alarms table
    if (reportData?.alarms && Array.isArray(reportData.alarms) && reportData.alarms.length > 0) {
      doc.addPage()
      doc.fontSize(14).font("Helvetica-Bold").text("DETAILED ALARM RECORDS", { align: "center" })
      doc.moveDown()

      // Define table structure with all essential columns
      const tableHeaders = [
        "Code",
        "Type",
        "Company",
        "Branch",
        "City",
        "Status",
        "Severity",
        "Created At",
        "Created By",
        "Ack. At",
        "Completed At",
        "Resp.(min)",
        "Resol.(min)",
        "Assigned To",
      ]

      // Column widths (total should be around 800 for landscape A4)
      const colWidths = [45, 60, 70, 65, 50, 45, 45, 65, 60, 65, 65, 35, 35, 60]
      const tableLeft = 30
      const rowHeight = 25

      // Function to draw table headers
      const drawTableHeaders = (y: number) => {
        doc!.fontSize(8).font("Helvetica-Bold")

        // Draw header background
        doc!
          .rect(
            tableLeft,
            y - 2,
            colWidths.reduce((a, b) => a + b, 0),
            rowHeight - 5,
          )
          .fillAndStroke("#f0f0f0", "#000000")

        let currentX = tableLeft
        tableHeaders.forEach((header, i) => {
          doc!.fillColor("#000000").text(header, currentX + 2, y + 2, {
            width: colWidths[i] - 4,
            align: "center",
            ellipsis: true,
          })
          currentX += colWidths[i]
        })

        return y + rowHeight
      }

      // Function to draw table row
      const drawTableRow = (alarm: any, y: number, isEven = false) => {
        doc!.fontSize(7).font("Helvetica")

        // Alternate row colors
        if (isEven) {
          doc!
            .rect(
              tableLeft,
              y - 2,
              colWidths.reduce((a, b) => a + b, 0),
              rowHeight - 5,
            )
            .fillAndStroke("#f9f9f9", "#cccccc")
        } else {
          doc!
            .rect(
              tableLeft,
              y - 2,
              colWidths.reduce((a, b) => a + b, 0),
              rowHeight - 5,
            )
            .stroke("#cccccc")
        }

        // Calculate response and resolution times
        const report = alarm.reports?.[0]
        const responseTime = report?.acknowledgedAt ? calculateTime(alarm.createdAt, report.acknowledgedAt) : ""
        const resolutionTime = report?.completedAt ? calculateTime(alarm.createdAt, report.completedAt) : ""

        // Prepare row data with safe fallbacks
        const rowData = [
          alarm.alarmCode || alarm.id?.slice(0, 8) || "N/A",
          alarm.type || "N/A",
          alarm.branch?.company?.name || "Unknown",
          alarm.branch?.name || "N/A",
          alarm.branch?.city || "N/A",
          alarm.status || "N/A",
          alarm.severity || "N/A",
          formatDate(alarm.createdAt),
          alarm.createdBy?.name || "N/A",
          report?.acknowledgedAt ? formatDate(report.acknowledgedAt) : "",
          report?.completedAt ? formatDate(report.completedAt) : "",
          responseTime.toString(),
          resolutionTime.toString(),
          report?.assignedTo?.name || "",
        ]

        // Draw row data
        let currentX = tableLeft
        doc!.fillColor("#000000")
        rowData.forEach((data, i) => {
          doc!.text(String(data), currentX + 2, y + 2, {
            width: colWidths[i] - 4,
            align: i >= 11 && i <= 12 ? "center" : "left", // Center align time columns
            ellipsis: true,
          })
          currentX += colWidths[i]
        })

        return y + rowHeight
      }

      // Draw table
      let currentY = doc.y
      currentY = drawTableHeaders(currentY)

      // Process alarms in batches to handle page breaks
      const alarmsToShow = reportData.alarms.slice(0, 50) // Reduced limit for better performance

      alarmsToShow.forEach((alarm: any, index: number) => {
        // Check if we need a new page
        if (currentY > 500) {
          doc!.addPage()
          currentY = 50
          currentY = drawTableHeaders(currentY)
        }

        currentY = drawTableRow(alarm, currentY, index % 2 === 0)
      })

      // Add note if data was truncated
      if (reportData.alarms.length > 50) {
        doc.moveDown()
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .text(
            `Note: Showing first 50 of ${reportData.alarms.length} total alarms. For complete data, use CSV export.`,
            { align: "center" },
          )
      }
    }

    // Add additional insights page
    if (reportData?.charts) {
      doc.addPage()
      doc.fontSize(14).font("Helvetica-Bold").text("ANALYTICS & INSIGHTS", { align: "center" })
      doc.moveDown()

      // Top Alarm Types
      if (reportData.charts.topAlarmTypes && Array.isArray(reportData.charts.topAlarmTypes)) {
        doc.fontSize(12).font("Helvetica-Bold").text("TOP ALARM TYPES", { underline: true })
        doc.fontSize(9).font("Helvetica")

        reportData.charts.topAlarmTypes.slice(0, 10).forEach((item: any, index: number) => {
          const percentage = reportData.stats?.total ? Math.round((item.count / reportData.stats.total) * 100) : 0
          doc!.text(`${index + 1}. ${item.type}: ${item.count} occurrences (${percentage}%)`)
        })
        doc.moveDown()
      }

      // Severity Analysis
      if (reportData.charts.severityDistribution && Array.isArray(reportData.charts.severityDistribution)) {
        doc.fontSize(12).font("Helvetica-Bold").text("SEVERITY ANALYSIS", { underline: true })
        doc.fontSize(9).font("Helvetica")

        reportData.charts.severityDistribution.forEach((item: any) => {
          const percentage = reportData.stats?.total ? Math.round((item.value / reportData.stats.total) * 100) : 0
          doc!.text(`${item.name}: ${item.value} alarms (${percentage}%)`)
        })
        doc.moveDown()
      }

      // Company Performance
      if (reportData.performance && Array.isArray(reportData.performance)) {
        doc.fontSize(12).font("Helvetica-Bold").text("COMPANY PERFORMANCE RANKING", { underline: true })
        doc.fontSize(9).font("Helvetica")

        reportData.performance.slice(0, 15).forEach((item: any, index: number) => {
          doc!.text(
            `${index + 1}. ${item.companyName}: ${item.resolutionRate}% resolution rate (${item.resolvedAlarms}/${item.totalAlarms} resolved)`,
          )
        })
        doc.moveDown()
      }

      // Response Time Analysis
      if (reportData.stats) {
        doc.fontSize(12).font("Helvetica-Bold").text("RESPONSE TIME ANALYSIS", { underline: true })
        doc.fontSize(9).font("Helvetica")

        doc.text(`Average Response Time: ${Math.round(reportData.stats.avgResponseTime || 0)} minutes`)
        doc.text(`Average Resolution Time: ${Math.round(reportData.stats.avgResolutionTime || 0)} minutes`)

        // Performance benchmarks
        const responseTime = Math.round(reportData.stats.avgResponseTime || 0)
        let responseRating = "Excellent"
        if (responseTime > 30) responseRating = "Needs Improvement"
        else if (responseTime > 15) responseRating = "Good"
        else if (responseTime > 5) responseRating = "Very Good"

        doc.text(`Response Time Rating: ${responseRating}`)
        doc.moveDown()
      }
    }

    // Finalize the PDF first
    doc.end()

    // Handle the completion
    doc.on("end", () => {
      console.log("PDF generation completed successfully")
    })

    doc.on("error", (error:any) => {
      console.error("PDF generation error:", error)
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF report" })
      }
    })
  } catch (error) {
    console.error("Error generating PDF report:", error)

    // Clean up the document if it exists
    if (doc) {
      try {
        doc.end()
      } catch (cleanupError) {
        console.error("Error cleaning up PDF document:", cleanupError)
      }
    }

    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF report" })
    }
  }
})


export default router
