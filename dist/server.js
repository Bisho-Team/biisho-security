"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const companies_1 = __importDefault(require("./routes/companies"));
const branches_1 = __importDefault(require("./routes/branches"));
const alarms_1 = __importDefault(require("./routes/alarms"));
const reports_1 = __importDefault(require("./routes/reports"));
const analytics_1 = __importDefault(require("./routes/analytics"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3003;
// Middleware
// app.use(helmet());
// app.use(
// 	cors({
// 		origin: process.env.FRONTEND_URL || "http://167.235.24.44:3002",
// 		credentials: true,
// 	})
// );
app.use((0, cors_1.default)({
    origin: "*",
    credentials: false,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// API Routes
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/companies", companies_1.default);
app.use("/api/branches", branches_1.default);
app.use("/api/alarms", alarms_1.default);
app.use("/api/reports", reports_1.default);
app.use("/api/analytics", analytics_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    if (err.name === "ValidationError") {
        return res.status(400).json({
            error: "Validation Error",
            details: err.errors,
        });
    }
    if (err.code === "P2002") {
        return res.status(409).json({
            error: "Conflict",
            message: "A record with this data already exists",
        });
    }
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
    });
});
// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// Graceful shutdown
// process.on("SIGINT", async () => {
// 	console.log("Shutting down gracefully...");
// 	await prisma.$disconnect();
// 	process.exit(0);
// });
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
