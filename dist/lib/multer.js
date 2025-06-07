"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.uploadProfileImage = void 0;
// Use process.cwd() for root-based path
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadPath = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadPath)) {
    fs_1.default.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.fieldname}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
exports.uploadProfileImage = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        if (mimeType && extName) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
exports.upload = (0, multer_1.default)({ storage });
