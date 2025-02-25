import express from 'express';
import pool from '../config/db.js';
import authenticateJWT from '../controller/userController.js';
const router = express.Router();

// Create Book
router.post('/', async (req, res) => {
  try {
    const { name, isbn, author, quantity, description, category_id } = req.body;

    // Insert book into the database
    await pool.query(
      'INSERT INTO books (name, isbn, author, quantity, description, category_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, isbn,author, quantity, description, category_id]
    );

    res.json({ message: 'Book added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving book' });
  }
});

// Get All Books
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Single Book
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Book
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isbn, author, quantity, description, category_id } = req.body;

    const result = await pool.query(
      `UPDATE books 
       SET name = $1, isbn = $2, author = $3, "quantity" = $4, description = $5, category_id = $6 
       WHERE id = $7 RETURNING *`,
      [name, isbn, author, quantity, description, category_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete Book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Return Book
// router.post("/return", async (req, res) => {
//   const { user_id, book_id } = req.body;

//   await pool.query("UPDATE books SET quantity = quantity + 1 WHERE id = $1", [book_id]);
//   await pool.query("DELETE FROM borrowed_books WHERE user_id = $1 AND book_id = $2", [user_id, book_id]);

//   res.json({ message: "Book returned successfully" });
// });

router.post("/return", async (req, res) => {
  const { user_id, book_id } = req.body;

  // Validate required inputs
  if (!user_id || !book_id) {
    return res.status(400).json({ error: "Missing user_id or book_id" });
  }

  try {
    // Start transaction
    await pool.query("BEGIN");

    // Fetch current quantity and total quantity from books table
    const bookData = await pool.query(
      "SELECT quantity, total_quantity FROM books WHERE id = $1",
      [book_id]
    );

    if (bookData.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Book not found" });
    }

    const { quantity, total_quantity } = bookData.rows[0];

    // Check if the user actually borrowed the book
    const borrowedBook = await pool.query(
      "SELECT * FROM borrowed_books WHERE user_id = $1 AND book_id = $2",
      [user_id, book_id]
    );

    if (borrowedBook.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "No borrowed record found for this user" });
    }

    // Update book quantity only if it does not exceed the total quantity
    if (quantity < total_quantity) {
      await pool.query(
        "UPDATE books SET quantity = quantity + 1 WHERE id = $1",
        [book_id]
      );
    }

    // Remove the borrowed record
    await pool.query(
      "DELETE FROM borrowed_books WHERE user_id = $1 AND book_id = $2",
      [user_id, book_id]
    );

    // After returning the book, you should not insert it back into the borrowed_books table
    // So remove this part of the code that is trying to insert again

    // Commit transaction
    await pool.query("COMMIT");

    res.json({ message: "Book returned successfully" });
  } catch (error) {
    // Rollback on error
    console.error("Error returning book:", error.stack);
    await pool.query("ROLLBACK");
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// In your bookRoute.js or similar backend file

// Get Borrowed Books for Profile Page
router.get("/profile/borrowed-books", authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT books.* FROM books JOIN borrowed_books ON books.id = borrowed_books.book_id WHERE borrowed_books.user_id = $1",
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all borrowed books
router.get('/allborrowdata', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM borrowed_books');
      res.status(200).json(result.rows);
  } catch (err) {
      console.error('Error fetching borrowed books:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});





export default router;
