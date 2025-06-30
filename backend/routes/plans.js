
const express = require('express');
const database = require('../config/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all plans
router.get('/', (req, res) => {
  database.getDb().all(
    'SELECT * FROM plans WHERE is_active = 1 ORDER BY price ASC',
    (err, plans) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo planes' });
      }
      res.json(plans);
    }
  );
});

// Create new plan (admin only)
router.post('/', adminMiddleware, (req, res) => {
  const { name, description, price, max_listeners, max_radios, features } = req.body;

  database.getDb().run(
    `INSERT INTO plans (name, description, price, max_listeners, max_radios, features) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, price, max_listeners, max_radios, JSON.stringify(features)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creando plan' });
      }
      res.status(201).json({ id: this.lastID, message: 'Plan creado exitosamente' });
    }
  );
});

module.exports = router;
