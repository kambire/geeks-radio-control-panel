
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7001;

// Middlewares básicos
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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

// Ruta básica de auth (temporal)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  // Login temporal hasta que se configure la BD
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

// Rutas básicas para el panel
app.get('/api/radios', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Radio Demo FM',
      status: 'active',
      listeners: 15,
      max_listeners: 100,
      bitrate: 128,
      mount_point: '/demo'
    }
  ]);
});

app.get('/api/clients', (req, res) => {
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

app.get('/api/plans', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Plan Básico',
      max_listeners: 100,
      price: 29.99,
      features: ['Streaming 24/7', 'AutoDJ', 'Estadísticas']
    }
  ]);
});

app.get('/api/stream/stats', (req, res) => {
  res.json({
    total_listeners: 45,
    total_radios: 3,
    bandwidth_usage: '2.5 GB',
    uptime: '99.9%'
  });
});

// Dashboard routes
app.get('/api/dashboard/admin', (req, res) => {
  res.json({
    total_clients: 5,
    total_admins: 2,
    total_radios: 8,
    active_radios: 6,
    total_listeners: 150,
    total_plans: 3
  });
});

app.get('/api/dashboard/client', (req, res) => {
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
    path: req.originalUrl
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Geeks Radio API corriendo en puerto ${PORT}`);
  console.log(`📡 Panel disponible en http://localhost/`);
  console.log(`🎵 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
});
