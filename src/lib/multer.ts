// Use process.cwd() for root-based path
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadPath)) {
	fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		const uniqueName = `${Date.now()}-${file.fieldname}${path.extname(
			file.originalname
		)}`;
		cb(null, uniqueName);
	},
});

export const uploadProfileImage = multer({
	storage,
	fileFilter: (req, file, cb) => {
		const allowedTypes = /jpeg|jpg|png|webp/;
		const mimeType = allowedTypes.test(file.mimetype);
		const extName = allowedTypes.test(
			path.extname(file.originalname).toLowerCase()
		);

		if (mimeType && extName) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"));
		}
	},
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export const upload = multer({ storage });
