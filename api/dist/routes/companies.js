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
const multer_1 = require("../lib/multer");
// import multer from "multer";
// const upload = multer({ storage: multer.memoryStorage() });
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const createCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
const updateCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});
// Get all companies (Super Admin only)
// Get all companies
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log({
            req: req.user
        });
        const { page = 1, limit = 50, status, search } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        // Role-based filtering
        if (req.user.role === "OFFICE_MANAGER" || req.user.role === "POLICE_MANAGER") {
            where.id = req.user.companyId;
        }
        const companies = yield prisma.company.findMany({
            where,
            include: {
                _count: {
                    select: {
                        users: true,
                        branches: true,
                        CompanyOperator: true
                    },
                },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        });
        const total = yield prisma.company.count({ where });
        res.json({
            companies,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ error: "Failed to fetch companies" });
    }
}));
// Get single company by ID
router.get("/:id", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Role-based access control
        if ((req.user.role === "OFFICE_MANAGER" || req.user.role === "POLICE_MANAGER") && req.user.companyId !== id) {
            return res.status(403).json({ error: "Access denied" });
        }
        const company = yield prisma.company.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, name: true, email: true, role: true, status: true },
                },
                branches: {
                    select: { id: true, name: true, city: true, status: true },
                },
                _count: {
                    select: {
                        users: true,
                        branches: true,
                    },
                },
            },
        });
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }
        res.json(company);
    }
    catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).json({ error: "Failed to fetch company" });
    }
}));
// router.get(
// 	"/",
// 	authenticate,
// 	authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			const companies = await prisma.company.findMany({
// 				include: {
// 					users: true,
// 					_count: {
// 						select: {
// 							users: true,
// 							branches: true,
// 						},
// 					},
// 				},
// 				orderBy: { createdAt: "desc" },
// 			});
// 			const formatted = companies.map((company) => ({
// 				id: company.id,
// 				name: company.name,
// 				logo: company.logo ?? "", // ✅ Logo
// 				type: company.type ?? "N/A",
// 				industry: company.industry ?? "N/A",
// 				address: company.address ?? "N/A",
// 				city: company.city ?? "N/A",
// 				country: company.country ?? "Ethiopia",
// 				phone: company.phone ?? "N/A",
// 				email: company.email ?? "N/A",
// 				website: undefined, // You can add this to schema later
// 				description: company.description ?? "",
// 				status: company.status.toLowerCase() as
// 					| "active"
// 					| "inactive"
// 					| "pending",
// 				createdAt: company.createdAt.toISOString(),
// 				officeManagersCount: company.users.filter(
// 					(u) => u.role === "OFFICE_MANAGER"
// 				).length,
// 				branchesCount: company._count.branches,
// 				totalOperators: company.users.filter((u) => u.role === "OPERATOR")
// 					.length,
// 				lastActivity: undefined, // Placeholder for now
// 			}));
// 			res.json(formatted);
// 		} catch (error) {
// 			res.status(500).json({ error: "Failed to fetch companies" });
// 		}
// 	}
// );
// router.get(
// 	"/:id",
// 	authenticate,
// 	authorize("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			const { id } = req.params;
// 			const company = await prisma.company.findUnique({
// 				where: { id },
// 				include: {
// 					users: {
// 						select: {
// 							id: true,
// 							name: true,
// 							email: true,
// 							role: true,
// 							status: true,
// 							createdAt: true,
// 						},
// 					},
// 					branches: {
// 						select: {
// 							id: true,
// 							name: true,
// 							city: true,
// 							status: true,
// 							createdAt: true,
// 						},
// 					},
// 				},
// 			});
// 			if (!company) {
// 				return res.status(404).json({ error: "Company not found" });
// 			}
// 			res.json(company);
// 		} catch (error) {
// 			res.status(500).json({ error: "Failed to fetch company" });
// 		}
// 	}
// );
// Create company
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"), multer_1.upload.single("logo"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("req.body:", req.body);
        console.log("req.file:", req.file);
        const formData = req.body;
        const { name, type, industry, address, city, country, phone, email, description, } = formData;
        const data = {
            name,
            type,
            industry,
            address,
            city,
            country,
            phone,
            email,
            description,
            logo: req.file ? req.file.path : null,
            status: "ACTIVE"
        };
        let company;
        try {
            company = yield prisma.company.create({ data });
        }
        catch (err) {
            console.error("Database error:", err);
            throw new Error("Failed to create company in database");
        }
        res.status(201).json({
            message: "Company created successfully",
            company,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create company" });
    }
}));
// // Create company
// router.post(
// 	"/",
// 	authenticate,
// 	authorize("SUPER_ADMIN"),
// 	upload.single("logo"), // <- This line enables handling file upload
// 	async (req: AuthRequest, res) => {
// 		try {
// 			console.log("req.body:", req.body); // form text fields
// 			console.log("req.file:", req.file); // file info
// 			const {
// 				name,
// 				type,
// 				industry,
// 				address,
// 				city,
// 				country,
// 				phone,
// 				email,
// 				website,
// 				description,
// 			} = req.body;
// 			// Now req.body will contain all fields from formData
// 			// You may also need to parse numeric fields manually
// 			const data = {
// 				name,
// 				type,
// 				industry,
// 				address,
// 				city,
// 				country,
// 				phone,
// 				email,
// 				website,
// 				description,
// 				// You can handle logo upload storage from req.file here
// 			};
// 			const company = await prisma.company.create({ data });
// 			res.status(201).json({
// 				message: "Company created successfully",
// 				company,
// 			});
// 		} catch (error) {
// 			console.error(error);
// 			res.status(500).json({ error: "Failed to create company" });
// 		}
// 	}
// );
// router.post(
// 	"/",
// 	authenticate,
// 	authorize("SUPER_ADMIN"),
// 	upload.single("logo"),
// 	async (req: AuthRequest, res) => {
// 		try {
// 			console.log("req.body:", req.body); // text fields
// 			console.log("req.file:", req.file); // file field
// 			const data = createCompanySchema.parse(req.body);
// 			const company = await prisma.company.create({
// 				data,
// 			});
// 			res.status(201).json({
// 				message: "Company created successfully",
// 				company,
// 			});
// 		} catch (error) {
// 			if (error instanceof z.ZodError) {
// 				return res
// 					.status(400)
// 					.json({ error: "Validation failed", details: error.errors });
// 			}
// 			res.status(500).json({ error: "Failed to create company" });
// 		}
// 	}
// );
// Update company
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN", "OFFICE_MANAGER", "POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = updateCompanySchema.parse(req.body);
        const company = yield prisma.company.update({
            where: { id },
            data,
        });
        res.json({
            message: "Company updated successfully",
            company,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update company" });
    }
}));
// Delete company
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.company.delete({
            where: { id },
        });
        res.json({ message: "Company deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete company" });
    }
}));
exports.default = router;
