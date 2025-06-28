
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');

const router = express.Router();

// Obtener perfil del usuario actual
router.get('/', (req, res) => {
  database.getDb().get(
    `SELECT id, username, email, role, full_name, phone, company, address, 
     avatar_url, last_login, created_at FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo perfil' });
      }
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    }
  );
});

// Actualizar perfil del usuario actual
router.put('/', [
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('current_password').optional().isLength({ min: 6 }).withMessage('Contraseña actual requerida'),
  body('new_password').optional().isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, full_name, phone, company, address, current_password, new_password } = req.body;

    // Si se quiere cambiar la contraseña, verificar la actual
    if (new_password && current_password) {
      database.getDb().get(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id],
        async (err, user) => {
          if (err || !user) {
            return res.status(500).json({ error: 'Error verificando contraseña' });
          }

          if (!await bcrypt.compare(current_password, user.password)) {
            return res.status(400).json({ error: 'Contraseña actual incorrecta' });
          }

          // Actualizar con nueva contraseña
          await updateProfile(req.user.id, { email, full_name, phone, company, address, new_password }, res);
        }
      );
    } else {
      // Actualizar sin cambiar contraseña
      await updateProfile(req.user.id, { email, full_name, phone, company, address }, res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function updateProfile(userId, data, res) {
  try {
    let updateFields = [];
    let values = [];

    if (data.email) {
      updateFields.push('email = ?');
      values.push(data.email);
    }
    if (data.full_name !== undefined) {
      updateFields.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.company !== undefined) {
      updateFields.push('company = ?');
      values.push(data.company);
    }
    if (data.address !== undefined) {
      updateFields.push('address = ?');
      values.push(data.address);
    }
    if (data.new_password) {
      updateFields.push('password = ?');
      values.push(await bcrypt.hash(data.new_password, 10));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    database.getDb().run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email ya existe' });
          }
          return res.status(500).json({ error: 'Error actualizando perfil' });
        }

        res.json({ message: 'Perfil actualizado exitosamente' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener estadísticas del usuario (sus radios)
router.get('/stats', (req, res) => {
  database.getDb().all(
    `SELECT 
       COUNT(*) as total_radios,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_radios,
       SUM(current_listeners) as total_listeners,
       MAX(peak_listeners) as max_listeners,
       SUM(total_hours) as total_hours
     FROM radios WHERE user_id = ?`,
    [req.user.id],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo estadísticas' });
      }
      res.json(stats[0] || {});
    }
  );
});

module.exports = router;
