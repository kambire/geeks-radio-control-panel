
const express = require('express');
const database = require('../config/database');

const router = express.Router();

// Get stream statistics
router.get('/stats', (req, res) => {
  database.getDb().all(
    `SELECT 
       COUNT(*) as total_radios,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active_radios,
       SUM(current_listeners) as total_listeners,
       AVG(current_listeners) as avg_listeners
     FROM radios`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo estadísticas' });
      }
      
      const result = stats[0] || {};
      res.json({
        total_radios: result.total_radios || 0,
        active_radios: result.active_radios || 0,
        total_listeners: result.total_listeners || 0,
        avg_listeners: Math.round(result.avg_listeners || 0),
        bandwidth_usage: '2.5 GB', // Placeholder
        uptime: '99.9%' // Placeholder
      });
    }
  );
});

module.exports = router;
