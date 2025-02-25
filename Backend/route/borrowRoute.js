import express from 'express';
import pool from '../config/db.js';
import authenticateJWT from '../controller/userController.js';
const router = express.Router();
// Borrow Book
import jwt from "jsonwebtoken";

// Borrow Book
router.post("/borrow", async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Decode user ID from token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.id; // Ensure 'id' exists in your token payload
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ error: "Book ID is required" });
    }

    // Begin transaction
    await pool.query("BEGIN");

    // Check if book is available
    const bookData = await pool.query("SELECT quantity FROM books WHERE id = $1", [book_id]);

    if (bookData.rowCount === 0 || bookData.rows[0].quantity <= 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Book not available" });
    }

    // Reduce book quantity by 1
    await pool.query("UPDATE books SET quantity = quantity - 1 WHERE id = $1", [book_id]);

    // Insert into borrowed_books
    await pool.query(
      "INSERT INTO borrowed_books (user_id, book_id, borrowed_at) VALUES ($1, $2, NOW())",
      [user_id, book_id]
    );

    // Commit transaction
    await pool.query("COMMIT");

    res.json({ message: "Book borrowed successfully" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error borrowing book:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Get all borrowed books with borrower username, book title, and email
router.get('/allborrowdata', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.username AS borrower_username,
                u.email AS borrower_email,
                b.name AS book_title,
                b.author AS book_author,
                b.isbn AS book_isbn
                
            FROM 
                borrowed_books bb
            JOIN 
                users u ON bb.user_id = u.id
            JOIN 
                books b ON bb.book_id = b.id;
        `;

        const result = await pool.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No borrowed books found.' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching borrowed books:', err.message); // More detailed error logging
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
  
// Delete a borrowed book

router.delete('/:id', async (req, res) => {
  try {
    console.log('Request Params:', req.params); // Debugging log
    let { id } = req.params;  // Capture ID from URL

    if (!id) {
      return res.status(400).json({ error: 'Missing ID parameter' });
    }

    id = parseInt(id);  // Ensure ID is converted to an integer
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await pool.query(
      'DELETE FROM borrowed_books WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Borrowed book not found' });
    }

    res.json({ message: 'Borrowed book deleted successfully' });
  } catch (err) {
    console.error('Error deleting borrowed book:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


  router.get("/borrowed-books", authenticateJWT, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT books.*, borrowed_books.borrowed_at 
         FROM books 
         JOIN borrowed_books ON books.id = borrowed_books.book_id 
         WHERE borrowed_books.user_id = $1`,
        [req.user.id]
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  export default router;