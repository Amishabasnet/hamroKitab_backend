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




export default router;
