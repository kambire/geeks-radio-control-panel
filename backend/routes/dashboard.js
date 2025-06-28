
const express = require('express');
const database = require('../config/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Dashboard para administradores
router.get('/admin', adminMiddleware, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM users WHERE role = "client"',
    'SELECT COUNT(*) as total FROM users WHERE role = "admin"', 
    'SELECT COUNT(*) as total FROM radios',
    'SELECT COUNT(*) as total FROM radios WHERE status = "active"',
    'SELECT SUM(current_listeners) as total FROM radios',
    'SELECT COUNT(*) as total FROM plans WHERE is_active = 1'
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      database.getDb().get(query, (err, result) => {
        if (err) reject(err);
        else resolve(result.total || 0);
      });
    })
  )).then(results => {
    res.json({
      total_clients: results[0],
      total_admins: results[1],
      total_radios: results[2],
      active_radios: results[3],
      total_listeners: results[4],
      total_plans: results[5]
    });
  }).catch(err => {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  });
});

// Dashboard para clientes
router.get('/client', (req, res) => {
  database.getDb().all(
    `SELECT 
       r.*,
       p.name as plan_name,
       p.max_listeners as plan_max_listeners
     FROM radios r
     LEFT JOIN plans p ON r.plan_id = p.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [req.user.id],
    (err, radios) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo radios' });
      }

      const stats = {
        total_radios: radios.length,
        active_radios: radios.filter(r => r.status === 'active').length,
        total_listeners: radios.reduce((sum, r) => sum + (r.current_listeners || 0), 0),
        max_listeners: radios.reduce((max, r) => Math.max(max, r.peak_listeners || 0), 0)
      };

      res.json({
        stats,
        radios: radios.slice(0, 5) // Últimas 5 radios
      });
    }
  );
});

module.exports = router;
