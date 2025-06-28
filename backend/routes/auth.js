
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Usuario requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    database.getDb().get(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
      [username, username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Error de base de datos' });
        }

        if (!user || !await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar último login
        database.getDb().run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        // Generar token
        const token = jwt.sign(
          { userId: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            avatar_url: user.avatar_url
          }
        });
      }
    );
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registro (solo para admins crear nuevos usuarios)
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Usuario debe tener al menos 3 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('role').isIn(['admin', 'client']).withMessage('Rol inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, full_name, phone, company } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    database.getDb().run(
      `INSERT INTO users (username, email, password, role, full_name, phone, company) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role, full_name, phone, company],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Usuario o email ya existe' });
          }
          return res.status(500).json({ error: 'Error creando usuario' });
        }

        res.status(201).json({
          message: 'Usuario creado exitosamente',
          userId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
