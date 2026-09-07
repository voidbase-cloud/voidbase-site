import { defineHandler } from "void";

// Unmatched /api/* paths must 404 rather than fall through to the site's index.html. voidbase's own endpoints and
// every more specific route are matched first, so this only sees what nothing else claimed.
const notFound = defineHandler((c) => c.json({ status: 404, message: "API route not found", data: {} }, 404));

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
