import express from 'express';
import pool from '../config/db.js';
const router = express.Router();
// server.js or routes/contact.js


// POST: Add new contact
router.post('/', async (req, res) => {
    const { email } = req.body;
    try {
      const result = await pool.query('INSERT INTO contacts (email) VALUES ($1) RETURNING *', [email]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating contact:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// GET: Get all contacts
router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM contacts');
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// DELETE: Delete contact by id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (err) {
      console.error('Error deleting contact:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


export default router;