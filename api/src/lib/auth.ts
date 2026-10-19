import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { Request, Response, NextFunction } from "express"
import { PrismaClient, type Role } from "@prisma/client"

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: Role
    companyId?: string
    operatorType?:string
    companyName?:string
    comapnyLogo?:string
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (payload: any): string => {
  return (jwt as any).sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!)
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const decoded = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        status: true,
        operatorType: true,
        company: {
          select:{
            name:true,
            logo:true
          }
        }, // selects all fields of the related company
        managedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

          //  id: 'cmbc08fbl0000eyprqm39rfsl',
      //  name: 'Koppa Security Solutions',
      //  description: 'Leading security company in Ethiopia',
      //  logo: '/var/www/html/koppa-security-api/uploads/koppa.png',
      //  type: 'Security',
      //  industry: 'Security',
      //  address: 'Legehar',
      //  city: 'Addis Ababa',
      //  country: 'Ethiopia',
      //  phone: '0913224492',
      //  email: 'legehar@gmail.com',
      //  status: 'ACTIVE',
      //  createdAt: 2025-05-31T09:03:23.025Z,
      //  updatedAt: 2025-05-31T09:03:23.025Z
    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.id },
    //   include: {
		// 		company: true,
		// 		managedBy: {
		// 			select: { id: true, name: true, email: true },
		// 		},
		// 	},
    // })

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "Invalid token or user inactive." })
    }

    (req as any).user = user
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token." })
  }
}

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions." })
    }

    next()
  }
}
