
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los usuarios (solo admins)
router.get('/', adminMiddleware, (req, res) => {
  database.getDb().all(
    `SELECT id, username, email, role, full_name, phone, company, address, 
     is_active, last_login, created_at FROM users ORDER BY created_at DESC`,
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo usuarios' });
      }
      res.json(users);
    }
  );
});

// Obtener usuario por ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  
  // Los clientes solo pueden ver su propio perfil
  if (req.user.role !== 'admin' && parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  database.getDb().get(
    `SELECT id, username, email, role, full_name, phone, company, address, 
     avatar_url, is_active, last_login, created_at FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo usuario' });
      }
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    }
  );
});

// Crear usuario
router.post('/', adminMiddleware, [
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

    const { username, email, password, role, full_name, phone, company, address } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    database.getDb().run(
      `INSERT INTO users (username, email, password, role, full_name, phone, company, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role, full_name, phone, company, address],
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
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar usuario
router.put('/:id', [
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
], async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Los clientes solo pueden actualizar su propio perfil
    if (req.user.role !== 'admin' && parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name, phone, company, address, is_active } = req.body;
    let updateFields = [];
    let values = [];

    if (username) {
      updateFields.push('username = ?');
      values.push(username);
    }
    if (email) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (password) {
      updateFields.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }
    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      values.push(full_name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(phone);
    }
    if (company !== undefined) {
      updateFields.push('company = ?');
      values.push(company);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      values.push(address);
    }
    if (is_active !== undefined && req.user.role === 'admin') {
      updateFields.push('is_active = ?');
      values.push(is_active);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    database.getDb().run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Usuario o email ya existe' });
          }
          return res.status(500).json({ error: 'Error actualizando usuario' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario actualizado exitosamente' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario
router.delete('/:id', adminMiddleware, (req, res) => {
  const userId = req.params.id;

  database.getDb().run(
    'DELETE FROM users WHERE id = ?',
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error eliminando usuario' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario eliminado exitosamente' });
    }
  );
});

module.exports = router;
