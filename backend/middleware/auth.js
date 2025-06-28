
const jwt = require('jsonwebtoken');
const database = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'geeksradio-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar que el usuario existe y está activo
    database.getDb().get(
      'SELECT id, username, email, role, full_name, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId],
      (err, user) => {
        if (err || !user) {
          return res.status(401).json({ error: 'Token inválido o usuario inactivo' });
        }

        req.user = user;
        next();
      }
    );
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar rol de administrador
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  next();
};

// Middleware para verificar que el usuario puede acceder al recurso
const resourceMiddleware = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  // Los admins pueden acceder a todo
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Los clientes solo pueden acceder a sus propios recursos
  if (resourceUserId && parseInt(resourceUserId) !== req.user.id) {
    return res.status(403).json({ error: 'Acceso denegado a este recurso' });
  }
  
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  resourceMiddleware,
  JWT_SECRET
};
