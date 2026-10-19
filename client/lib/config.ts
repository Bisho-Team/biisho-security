// Base URL of the backend API, including the /api prefix (e.g. http://localhost:3001/api)
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Backend host without the /api prefix, used for static files served from /uploads
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

// Uploaded files are stored as absolute server paths
// (e.g. /var/www/html/koppa-security-api/uploads/x.png or /app/uploads/x.png)
export const getUploadUrl = (filePath?: string | null) => {
	if (!filePath) return "";
	const uploadsIndex = filePath.indexOf("/uploads/");
	return `${API_ORIGIN}${uploadsIndex >= 0 ? filePath.slice(uploadsIndex) : filePath}`;
};
