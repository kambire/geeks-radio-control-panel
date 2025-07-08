
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7001;

// Middlewares básicos
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticación básico
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  // Simulamos un usuario admin para las pruebas
  req.user = { id: 1, role: 'admin', username: 'admin' };
  next();
};

// Ruta de salud básica
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.1.0',
    port: PORT
  });
});

// Ruta básica de auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  if (username === 'admin' && password === 'geeksradio2024') {
    const response = {
      success: true,
      user: { 
        id: 1, 
        username: 'admin', 
        role: 'admin',
        email: 'admin@geeksradio.com',
        full_name: 'Administrador'
      },
      token: 'temp-token-' + Date.now()
    };
    console.log('Login successful:', response);
    res.json(response);
  } else {
    console.log('Login failed - invalid credentials');
    res.status(401).json({ 
      success: false, 
      message: 'Credenciales inválidas',
      error: 'Usuario o contraseña incorrectos'
    });
  }
});

// ===== RUTAS DE USUARIOS =====
// Obtener todos los usuarios
app.get('/api/users', authMiddleware, (req, res) => {
  console.log('GET /api/users - Fetching users');
  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@geeksradio.com',
      role: 'admin',
      full_name: 'Administrador',
      phone: '+1234567890',
      company: 'Geeks Radio',
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'cliente1',
      email: 'cliente1@ejemplo.com',
      role: 'client',
      full_name: 'Cliente Demo',
      phone: '+0987654321',
      company: 'Radio Demo FM',
      is_active: true,
      last_login: null,
      created_at: new Date().toISOString()
    }
  ];
  res.json(users);
});

// Crear usuario
app.post('/api/users', authMiddleware, (req, res) => {
  console.log('POST /api/users - Creating user:', req.body);
  const { username, email, password, role, full_name, phone, company } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: username, email, password' });
  }
  
  const newUser = {
    id: Date.now(), // ID temporal
    username,
    email,
    role: role || 'client',
    full_name: full_name || '',
    phone: phone || '',
    company: company || '',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString()
  };
  
  console.log('User created successfully:', newUser);
  res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: newUser
  });
});

// Actualizar usuario
app.put('/api/users/:id', authMiddleware, (req, res) => {
  const userId = req.params.id;
  console.log(`PUT /api/users/${userId} - Updating user:`, req.body);
  
  res.json({
    message: 'Usuario actualizado exitosamente',
    userId: parseInt(userId)
  });
});

// Eliminar usuario
app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const userId = req.params.id;
  console.log(`DELETE /api/users/${userId} - Deleting user`);
  
  res.json({
    message: 'Usuario eliminado exitosamente',
    userId: parseInt(userId)
  });
});

// ===== RUTAS DE RADIOS =====
// Obtener todas las radios
app.get('/api/radios', authMiddleware, (req, res) => {
  console.log('GET /api/radios - Fetching radios');
  const radios = [
    {
      id: 1,
      name: 'Radio Demo FM',
      user_id: 2,
      username: 'cliente1',
      email: 'cliente1@ejemplo.com',
      plan_id: 1,
      plan_name: 'Plan Básico',
      server_type: 'shoutcast',
      port: 8000,
      status: 'active',
      current_listeners: 15,
      max_listeners: 100,
      bitrate: 128,
      mount_point: '/demo',
      created_at: new Date().toISOString()
    }
  ];
  res.json(radios);
});

// Crear radio
app.post('/api/radios', authMiddleware, (req, res) => {
  console.log('POST /api/radios - Creating radio:', req.body);
  const { name, user_id, plan_id, server_type, bitrate, max_listeners, mount_point } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nombre de la radio es requerido' });
  }
  
  const newRadio = {
    id: Date.now(), // ID temporal
    name,
    user_id: user_id || req.user.id,
    plan_id: plan_id || 1,
    server_type: server_type || 'shoutcast',
    bitrate: bitrate || 128,
    max_listeners: max_listeners || 100,
    mount_point: mount_point || '/stream',
    status: 'inactive',
    current_listeners: 0,
    created_at: new Date().toISOString()
  };
  
  console.log('Radio created successfully:', newRadio);
  res.status(201).json({
    message: 'Radio creada exitosamente',
    radio: newRadio
  });
});

// Actualizar estado de radio
app.patch('/api/radios/:id/status', authMiddleware, (req, res) => {
  const radioId = req.params.id;
  const { status } = req.body;
  console.log(`PATCH /api/radios/${radioId}/status - Updating status to:`, status);
  
  res.json({
    message: 'Estado de radio actualizado exitosamente',
    radioId: parseInt(radioId),
    status
  });
});

// Actualizar radio
app.put('/api/radios/:id', authMiddleware, (req, res) => {
  const radioId = req.params.id;
  console.log(`PUT /api/radios/${radioId} - Updating radio:`, req.body);
  
  res.json({
    message: 'Radio actualizada exitosamente',
    radioId: parseInt(radioId)
  });
});

// Eliminar radio
app.delete('/api/radios/:id', authMiddleware, (req, res) => {
  const radioId = req.params.id;
  console.log(`DELETE /api/radios/${radioId} - Deleting radio`);
  
  res.json({
    message: 'Radio eliminada exitosamente',
    radioId: parseInt(radioId)
  });
});

// ===== RUTAS EXISTENTES =====
app.get('/api/clients', authMiddleware, (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Cliente Demo',
      email: 'demo@ejemplo.com',
      radios_count: 1,
      status: 'active'
    }
  ]);
});

app.post('/api/clients', authMiddleware, (req, res) => {
  console.log('POST /api/clients - Creating client:', req.body);
  res.status(201).json({
    message: 'Cliente creado exitosamente',
    clientId: Date.now()
  });
});

app.get('/api/plans', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Plan Básico',
      max_listeners: 100,
      price: 29.99,
      features: ['Streaming 24/7', 'AutoDJ', 'Estadísticas']
    },
    {
      id: 2,
      name: 'Plan Profesional',
      max_listeners: 300,
      price: 59.99,
      features: ['Streaming 24/7', 'AutoDJ', 'Estadísticas', 'Apps Móviles']
    }
  ]);
});

app.get('/api/stream/stats', authMiddleware, (req, res) => {
  res.json({
    total_listeners: 45,
    total_radios: 3,
    bandwidth_usage: '2.5 GB',
    uptime: '99.9%'
  });
});

// Dashboard routes
app.get('/api/dashboard/admin', authMiddleware, (req, res) => {
  res.json({
    total_clients: 5,
    total_admins: 2,
    total_radios: 8,
    active_radios: 6,
    total_listeners: 150,
    total_plans: 3
  });
});

app.get('/api/dashboard/client', authMiddleware, (req, res) => {
  res.json({
    stats: {
      total_radios: 2,
      active_radios: 1,
      total_listeners: 25,
      max_listeners: 50
    },
    radios: [
      {
        id: 1,
        name: 'Mi Radio FM',
        status: 'active',
        current_listeners: 25,
        plan_name: 'Plan Básico'
      }
    ]
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: 'Contacta al administrador'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  console.log('Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Geeks Radio API corriendo en puerto ${PORT}`);
  console.log(`📡 Panel disponible en http://localhost/`);
  console.log(`🎵 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Rutas disponibles:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/users`);
  console.log(`   POST /api/users`);
  console.log(`   PUT  /api/users/:id`);
  console.log(`   DELETE /api/users/:id`);
  console.log(`   GET  /api/radios`);
  console.log(`   POST /api/radios`);
  console.log(`   PUT  /api/radios/:id`);
  console.log(`   PATCH /api/radios/:id/status`);
  console.log(`   DELETE /api/radios/:id`);
});
