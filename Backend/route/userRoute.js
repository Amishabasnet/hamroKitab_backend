import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();
// User Registration
router.post("/", async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      const result = await pool.query(
        "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *",
        [username, hashedPassword, email]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // User Login
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  
      if (!result || result.rows.length === 0) {
        console.log("User not found");
        return res.status(400).json({ error: "Invalid username or password" });
      }
  
      const user = result.rows[0];
      console.log("User found:", user);
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        console.log("Invalid password");
        return res.status(400).json({ error: "Invalid username or password" });
      }
  
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "12h" });
  
      res.status(200).json({ token });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

// **Get All Users**
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// **Delete User by ID**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

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

// User Profile
router.get("/profile", authenticateToken, async (req, res) => {
  const userId = req.user.id; // Extract user ID from the token

  try {
      // Query user profile
      const userResult = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [userId]);
      if (userResult.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
      }
      
      // Query borrowed books by the user
      const borrowedBooksResult = await pool.query(`
          SELECT books.id, books.name, books.author, books.isbn, borrowed_books.borrowed_at 
          FROM borrowed_books 
          JOIN books ON borrowed_books.book_id = books.id 
          WHERE borrowed_books.user_id = $1
      `, [userId]);

      res.status(200).json({
          userProfile: userResult.rows[0],
          borrowedBooks: borrowedBooksResult.rows
      });
  } catch (err) {
      console.error("Error fetching user profile and borrowed books:", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Profile
router.put("/updateProfile", authenticateToken, async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user.id;

  try {
      const result = await pool.query(
          "UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email",
          [username, email, userId]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ userProfile: result.rows[0] });
  } catch (err) {
      console.error("Error updating user profile:", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
});



export default router;