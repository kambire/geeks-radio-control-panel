
const express = require('express');
const database = require('../config/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all clients (admin only)
router.get('/', adminMiddleware, (req, res) => {
  database.getDb().all(
    `SELECT u.*, COUNT(r.id) as radios_count 
     FROM users u 
     LEFT JOIN radios r ON u.id = r.user_id 
     WHERE u.role = 'client' 
     GROUP BY u.id 
     ORDER BY u.created_at DESC`,
    (err, clients) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo clientes' });
      }
      res.json(clients);
    }
  );
});

// Create new client
router.post('/', adminMiddleware, async (req, res) => {
  const { username, email, password, full_name, phone, company } = req.body;
  const bcrypt = require('bcrypt');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    database.getDb().run(
      `INSERT INTO users (username, email, password, role, full_name, phone, company) 
       VALUES (?, ?, ?, 'client', ?, ?, ?)`,
      [username, email, hashedPassword, full_name, phone, company],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Usuario o email ya existe' });
          }
          return res.status(500).json({ error: 'Error creando cliente' });
        }
        res.status(201).json({ id: this.lastID, message: 'Cliente creado exitosamente' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
