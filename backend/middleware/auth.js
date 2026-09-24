import jwt from "jsonwebtoken";

// Protects REST routes: expects "Authorization: Bearer <token>"
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or malformed token." });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, username }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
