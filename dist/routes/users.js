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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(["OFFICE_MANAGER", "POLICE_MANAGER", "OPERATOR"]).optional(),
    companyId: zod_1.z.string().optional(),
    operatorType: zod_1.z.enum(["OFFICE", "POLICE"]).optional(),
    assignedBranches: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    companyId: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    assignedBranches: zod_1.z.array(zod_1.z.string()).optional(),
});
// Get all users (Super Admin only)
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, role, status, search } = req.query;
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        const users = yield prisma.user.findMany({
            where,
            include: {
                company: true,
                managedBy: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: {
                        managedUsers: true,
                        // assignedBranches: true,
                    },
                },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        });
        const total = yield prisma.user.count({ where });
        const usersWithoutPasswords = users.map((_a) => {
            var { password } = _a, user = __rest(_a, ["password"]);
            return user;
        });
        res.json({
            users: usersWithoutPasswords,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
}));
// Get users by manager (Office/Police Managers)
router.get("/my-operators", auth_1.authenticate, (0, auth_1.authorize)("OFFICE_MANAGER", "POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const operators = yield prisma.user.findMany({
            where: {
                managedById: req.user.id,
                role: "OPERATOR",
            },
            // include: {
            // 	assignedBranches: {
            // 		include: {
            // 			branch: true,
            // 		},
            // 	},
            // },
            orderBy: { createdAt: "desc" },
        });
        const operatorsWithoutPasswords = operators.map((_a) => {
            var { password } = _a, operator = __rest(_a, ["password"]);
            return operator;
        });
        res.json(operatorsWithoutPasswords);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch operators" });
    }
}));
// Get users by manager (Office/Police Managers)
router.get("/police-managers", auth_1.authenticate, (0, auth_1.authorize)("OFFICE_MANAGER", "POLICE_MANAGER"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const operators = yield prisma.user.findMany({
            where: {
                role: "POLICE_MANAGER",
            },
            // include: {
            // 	assignedBranches: {
            // 		include: {
            // 			branch: true,
            // 		},
            // 	},
            // },
            orderBy: { createdAt: "desc" },
        });
        const operatorsWithoutPasswords = operators.map((_a) => {
            var { password } = _a, operator = __rest(_a, ["password"]);
            return operator;
        });
        res.json(operatorsWithoutPasswords);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch operators" });
    }
}));
// Create user
router.post("/", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const data = createUserSchema.parse(req.body);
        console.log("Creating user with data:", data);
        // Authorization checks
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "SUPER_ADMIN") {
            // Super admin can create anyone
        }
        else if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "OFFICE_MANAGER" ||
            ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === "POLICE_MANAGER") {
            // Managers can only create operators
            if (data.role !== "OPERATOR") {
                return res.status(403).json({ error: "You can only create operators" });
            }
        }
        else {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        const hashedPassword = yield (0, auth_1.hashPassword)(data.password);
        const userData = {
            email: data.email,
            name: data.name,
            password: hashedPassword,
            role: data.role,
            companyId: data.companyId || ((_d = req.user) === null || _d === void 0 ? void 0 : _d.companyId),
        };
        console.log("User data before creating:", userData);
        // Set manager for operators
        if (data.role === "OPERATOR") {
            userData.managedById = req.user.id;
            userData.operatorType = data.operatorType;
        }
        const user = yield prisma.user.create({
            data: userData,
            include: {
                company: true,
                managedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        // Assign branches to operator
        if (data.role === "OPERATOR" && data.companyId) {
            // await prisma.branchOperator.createMany({
            // 	data: data.assignedBranches.map((branchId) => ({
            // 		userId: user.id,
            // 		branchId,
            // 	})),
            // });
            yield prisma.companyOperator.create({
                data: {
                    operatorId: user.id,
                    companyId: data.companyId,
                },
            });
        }
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.status(201).json({
            message: "User created successfully",
            user: userWithoutPassword,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
}));
// Update user
router.put("/:id", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        // Check if user exists and permissions
        const existingUser = yield prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        // Authorization checks
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "SUPER_ADMIN") {
            if (existingUser.managedById !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                return res
                    .status(403)
                    .json({ error: "You can only update users you manage" });
            }
        }
        const user = yield prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                status: data.status,
            },
            include: {
                company: true,
                managedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        // Update company assignment for operator
        if (existingUser.role === "OPERATOR") {
            // Remove existing company assignment
            yield prisma.companyOperator.deleteMany({
                where: { operatorId: id },
            });
            // Assign new company (if provided)
            if (data.companyId) {
                yield prisma.companyOperator.create({
                    data: {
                        operatorId: id,
                        companyId: data.companyId,
                    },
                });
            }
        }
        // // Update branch assignments for operators
        // if (data.assignedBranches && existingUser.role === "OPERATOR") {
        // 	await prisma.branchOperator.deleteMany({
        // 		where: { userId: id },
        // 	});
        // 	if (data.assignedBranches.length > 0) {
        // 		await prisma.branchOperator.createMany({
        // 			data: data.assignedBranches.map((branchId) => ({
        // 				userId: id,
        // 				branchId,
        // 			})),
        // 		});
        // 	}
        // }
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({
            message: "User updated successfully",
            user: userWithoutPassword,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update user" });
    }
}));
// Delete user
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("SUPER_ADMIN"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.user.delete({
            where: { id },
        });
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
}));
exports.default = router;
