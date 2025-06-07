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
const createBranchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    locationType: zod_1.z.string().min(1),
    gpsAddress: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1),
    subCity: zod_1.z.string().optional(),
    woreda: zod_1.z.string().optional(),
    country: zod_1.z.string().default("Ethiopia"),
    managerName: zod_1.z.string().min(1),
    phoneNumber: zod_1.z.string().min(1),
    contactNumber1: zod_1.z.string().optional(),
    contactNumber2: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
const updateBranchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    locationType: zod_1.z.string().min(1).optional(),
    gpsAddress: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1).optional(),
    subCity: zod_1.z.string().optional(),
    woreda: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    managerName: zod_1.z.string().min(1).optional(),
    phoneNumber: zod_1.z.string().min(1).optional(),
    contactNumber1: zod_1.z.string().optional(),
    contactNumber2: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
});
// Get branches
router.get("/", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const where = {};
        console.log("User role:", (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        // Filter based on user role
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "OFFICE_MANAGER") {
            where.createdById = req.user.id;
        }
        else if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === "OPERATOR") {
            // Get branches assigned to this operator
            const assignments = yield prisma.branchOperator.findMany({
                where: { userId: req.user.id },
                select: { branchId: true },
            });
            where.id = { in: assignments.map((a) => a.branchId) };
        }
        else if (((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) !== "SUPER_ADMIN" &&
            ((_e = req.user) === null || _e === void 0 ? void 0 : _e.role) !== "POLICE_MANAGER") {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        // Add company filter for non-super-admin users
        if (((_f = req.user) === null || _f === void 0 ? void 0 : _f.role) !== "SUPER_ADMIN" && ((_g = req.user) === null || _g === void 0 ? void 0 : _g.companyId)) {
            where.companyId = req.user.companyId;
        }
        const branches = yield prisma.branch.findMany({
            where,
            include: {
                company: {
                    select: { id: true, name: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: {
                        operators: true,
                        alarms: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        console.log("Branches fetched:", branches);
        res.json(branches);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch branches" });
    }
}));
// Get branch by ID
router.get("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const branch = yield prisma.branch.findUnique({
            where: { id },
            include: {
                company: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                operators: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, status: true },
                        },
                    },
                },
                alarms: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
        if (!branch) {
            return res.status(404).json({ error: "Branch not found" });
        }
        // Check permissions
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "SUPER_ADMIN" &&
            ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "POLICE_MANAGER") {
            if (branch.createdById !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id) &&
                ((_d = req.user) === null || _d === void 0 ? void 0 : _d.companyId) !== branch.companyId) {
                return res.status(403).json({ error: "Access denied" });
            }
        }
        res.json(branch);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch branch" });
    }
}));
// Create branch
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("OFFICE_MANAGER", "SUPER_ADMIN"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = createBranchSchema.parse(req.body);
        const branch = yield prisma.branch.create({
            data: Object.assign(Object.assign({}, data), { companyId: req.user.companyId, createdById: req.user.id }),
            include: {
                company: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        res.status(201).json({
            message: "Branch created successfully",
            branch,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create branch" });
    }
}));
// Update branch
router.put("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const data = updateBranchSchema.parse(req.body);
        // Check if branch exists and permissions
        const existingBranch = yield prisma.branch.findUnique({
            where: { id },
        });
        if (!existingBranch) {
            return res.status(404).json({ error: "Branch not found" });
        }
        // Check permissions
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "SUPER_ADMIN") {
            if (existingBranch.createdById !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                return res
                    .status(403)
                    .json({ error: "You can only update branches you created" });
            }
        }
        const branch = yield prisma.branch.update({
            where: { id },
            data,
            include: {
                company: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        res.json({
            message: "Branch updated successfully",
            branch,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update branch" });
    }
}));
// Delete branch
router.delete("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        // Check if branch exists and permissions
        const existingBranch = yield prisma.branch.findUnique({
            where: { id },
        });
        if (!existingBranch) {
            return res.status(404).json({ error: "Branch not found" });
        }
        // Check permissions
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "SUPER_ADMIN") {
            if (existingBranch.createdById !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                return res
                    .status(403)
                    .json({ error: "You can only delete branches you created" });
            }
        }
        yield prisma.branch.delete({
            where: { id },
        });
        res.json({ message: "Branch deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete branch" });
    }
}));
exports.default = router;
