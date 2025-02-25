import express from "express";
import pool from '../config/db.js';
const router = express.Router(); // Create a new router

// Get all items
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
  }
});

// Create item
router.post('/', async (req, res) => {
  const { name} = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Update item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {name} = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json('Item deleted');
  } catch (err) {
    console.error(err.message);
  }
});

export default router;


