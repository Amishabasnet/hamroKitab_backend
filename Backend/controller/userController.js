import jwt from "jsonwebtoken";

// JWT Secret
const JWT_SECRET = "yourjwtsecret";

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};
// Export the middleware
export default  authenticateJWT;