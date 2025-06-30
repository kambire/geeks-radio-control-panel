
const express = require('express');
const database = require('../config/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all radios (admin only)
router.get('/', adminMiddleware, (req, res) => {
  database.getDb().all(
    `SELECT r.*, u.username, u.email, p.name as plan_name 
     FROM radios r 
     LEFT JOIN users u ON r.user_id = u.id 
     LEFT JOIN plans p ON r.plan_id = p.id 
     ORDER BY r.created_at DESC`,
    (err, radios) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo radios' });
      }
      res.json(radios);
    }
  );
});

// Get user's radios
router.get('/my-radios', (req, res) => {
  database.getDb().all(
    `SELECT r.*, p.name as plan_name 
     FROM radios r 
     LEFT JOIN plans p ON r.plan_id = p.id 
     WHERE r.user_id = ? 
     ORDER BY r.created_at DESC`,
    [req.user.id],
    (err, radios) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo radios' });
      }
      res.json(radios);
    }
  );
});

// Create new radio
router.post('/', (req, res) => {
  const { name, plan_id, server_type, bitrate, max_listeners, mount_point } = req.body;
  const user_id = req.user.role === 'admin' ? req.body.user_id : req.user.id;

  database.getDb().run(
    `INSERT INTO radios (name, user_id, plan_id, server_type, bitrate, max_listeners, mount_point, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 'inactive')`,
    [name, user_id, plan_id, server_type || 'icecast', bitrate || 128, max_listeners || 100, mount_point],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creando radio' });
      }
      res.status(201).json({ id: this.lastID, message: 'Radio creada exitosamente' });
    }
  );
});

// Update radio status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const radioId = req.params.id;

  database.getDb().run(
    'UPDATE radios SET status = ? WHERE id = ?',
    [status, radioId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error actualizando estado' });
      }
      res.json({ message: 'Estado actualizado' });
    }
  );
});

module.exports = router;
