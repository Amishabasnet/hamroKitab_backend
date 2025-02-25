import express from "express";
import jwt from "jsonwebtoken";
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(403).json({ error: "Access denied, no token provided." });

  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Set the decoded user information
      next();
  } catch (err) {
      res.status(400).json({ error: "Invalid token." });
  }
};
// Route to return a book
router.post("/return-book", authenticateToken, async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user.id; // Extract user ID from the token

    try {
        // Start a transaction
        await pool.query("BEGIN");

        // Remove the book from borrowed_books (returning the book)
        const result = await pool.query(`
            DELETE FROM borrowed_books WHERE user_id = $1 AND book_id = $2 RETURNING book_id
        `, [userId, bookId]);

        if (result.rowCount === 0) {
            await pool.query("ROLLBACK");
            return res.status(404).json({ error: "Book not found or already returned." });
        }

        // Increase the book quantity by 1 in the books table
        await pool.query(`
            UPDATE books SET quantity = quantity + 1 WHERE id = $1
        `, [bookId]);

        // Commit the transaction
        await pool.query("COMMIT");

        res.status(200).json({ message: "Book returned successfully, quantity updated!" });

    } catch (err) {
        await pool.query("ROLLBACK"); // Rollback on error
        console.error("Error returning book:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


export default router;