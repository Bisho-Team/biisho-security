import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, type AuthRequest } from "../lib/auth";

const router = express.Router();
const prisma = new PrismaClient();

// GET current user's profile
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT update current user's profile
router.put("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      dateOfBirth,
      address,
      emergencyContact,
      emergencyPhone,
    }: {
      name: string;
      dateOfBirth?: string;
      address?: string;
      emergencyContact?: string;
      emergencyPhone?: string;
    } = req.body;

    console.log({
      body:req.body
    })

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 18 || age > 100) {
        return res.status(400).json({ error: "Invalid date of birth" });
      }
    }

    if (
      emergencyPhone &&
      !/^\+251[0-9]{9}$/.test(emergencyPhone.replace(/[\s-]/g, ""))
    ) {
      return res.status(400).json({
        error: "Emergency phone must be in Ethiopian format (+251XXXXXXXXX)",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        emergencyPhone: emergencyPhone?.trim() || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});


// Change password
router.post("/change-password", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword }: { currentPassword: string; newPassword: string } = req.body;
  
    console.log({
      currentPassword,
      newPassword,
      user:req.user!.id

    })
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.password) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    console.log(`Password changed for user ${user.email} at ${new Date().toISOString()}`);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Get profile activity/statistics
router.get("/activity", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            createdAlarms: true,
            createdReports: true,
            managedUsers: true,
          },
        },
      },
    });

    const recentAlarms = await prisma.alarm.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        type: true,
        severity: true,
        status: true,
        createdAt: true,
        branch: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentReports = await prisma.alarmReport.findMany({
      where: { assignedToId: userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        alarm: {
          select: {
            type: true,
            severity: true,
            branch: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.json({
      statistics: stats?._count || { createdAlarms: 0, createdReports: 0, managedUsers: 0 },
      recentAlarms,
      recentReports,
    });
  } catch (error) {
    console.error("Error fetching profile activity:", error);
    res.status(500).json({ error: "Failed to fetch profile activity" });
  }
});


export default router;
