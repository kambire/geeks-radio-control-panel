const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7001;

// Base de datos simulada para radios y usuarios
let radiosDB = [
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

let usersDB = [
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

let nextUserId = 3;
let nextRadioId = 2;

// Función para obtener el siguiente puerto disponible
const getNextAvailablePort = () => {
  const basePorts = [8000, 8002, 8004, 8006, 8008, 8010, 8012, 8014, 8016, 8018];
  const usedPorts = radiosDB.map(radio => radio.port);
  
  for (const port of basePorts) {
    if (!usedPorts.includes(port)) {
      return port;
    }
  }
  
  // Si todos los puertos básicos están ocupados, generar el siguiente par
  const maxPort = Math.max(...usedPorts.filter(p => p >= 8000));
  return maxPort + 2;
};

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
    port: PORT,
    total_radios: radiosDB.length,
    total_users: usersDB.length
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
      token: 'temp-token-admin-' + Date.now()
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
app.get('/api/users', authMiddleware, (req, res) => {
  console.log('GET /api/users - Fetching users from memory');
  console.log('Current users in DB:', usersDB);
  res.json(usersDB);
});

app.post('/api/users', authMiddleware, (req, res) => {
  console.log('POST /api/users - Creating user:', req.body);
  const { username, email, password, role, full_name, phone, company } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: username, email, password' });
  }
  
  // Verificar si el usuario ya existe
  const existingUser = usersDB.find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Usuario o email ya existe' });
  }
  
  const newUser = {
    id: nextUserId++,
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
  
  usersDB.push(newUser);
  console.log('User created successfully:', newUser);
  console.log('Updated users DB:', usersDB);
  
  res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: newUser
  });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id);
  console.log(`PUT /api/users/${userId} - Updating user:`, req.body);
  
  const userIndex = usersDB.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  const { username, email, role, full_name, phone, company } = req.body;
  
  // Actualizar usuario
  usersDB[userIndex] = {
    ...usersDB[userIndex],
    username: username || usersDB[userIndex].username,
    email: email || usersDB[userIndex].email,
    role: role || usersDB[userIndex].role,
    full_name: full_name || usersDB[userIndex].full_name,
    phone: phone || usersDB[userIndex].phone,
    company: company || usersDB[userIndex].company
  };
  
  console.log('User updated successfully:', usersDB[userIndex]);
  res.json({
    message: 'Usuario actualizado exitosamente',
    user: usersDB[userIndex]
  });
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id);
  console.log(`DELETE /api/users/${userId} - Deleting user`);
  
  const userIndex = usersDB.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  usersDB.splice(userIndex, 1);
  console.log('User deleted successfully');
  
  res.json({
    message: 'Usuario eliminado exitosamente',
    userId: userId
  });
});

// ===== RUTAS DE RADIOS =====
app.get('/api/radios', authMiddleware, (req, res) => {
  console.log('GET /api/radios - Fetching radios from memory');
  console.log('Current radios in DB:', radiosDB);
  res.json(radiosDB);
});

app.post('/api/radios', authMiddleware, (req, res) => {
  console.log('POST /api/radios - Creating radio:', req.body);
  const { name, user_id, plan_id, server_type, bitrate, max_listeners, mount_point, port } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nombre de la radio es requerido' });
  }
  
  // Asignar puerto automáticamente si no se especifica
  const assignedPort = port || getNextAvailablePort();
  
  // Buscar información del usuario
  const user = usersDB.find(u => u.id === parseInt(user_id));
  const username = user ? user.username : 'Sin asignar';
  const email = user ? user.email : '';
  
  const newRadio = {
    id: nextRadioId++,
    name,
    user_id: parseInt(user_id) || req.user.id,
    username,
    email,
    plan_id: parseInt(plan_id) || 1,
    plan_name: 'Plan Básico', // Por defecto
    server_type: server_type || 'shoutcast',
    port: assignedPort,
    bitrate: parseInt(bitrate) || 128,
    max_listeners: parseInt(max_listeners) || 100,
    mount_point: mount_point || '/stream',
    status: 'inactive',
    current_listeners: 0,
    created_at: new Date().toISOString()
  };
  
  radiosDB.push(newRadio);
  console.log('Radio created successfully:', newRadio);
  console.log('Updated radios DB:', radiosDB);
  
  res.status(201).json({
    message: 'Radio creada exitosamente',
    radio: newRadio
  });
});

app.patch('/api/radios/:id/status', authMiddleware, (req, res) => {
  const radioId = parseInt(req.params.id);
  const { status } = req.body;
  console.log(`PATCH /api/radios/${radioId}/status - Updating status to:`, status);
  
  const radioIndex = radiosDB.findIndex(r => r.id === radioId);
  if (radioIndex === -1) {
    return res.status(404).json({ error: 'Radio no encontrada' });
  }
  
  radiosDB[radioIndex].status = status;
  console.log('Radio status updated:', radiosDB[radioIndex]);
  
  res.json({
    message: 'Estado de radio actualizado exitosamente',
    radio: radiosDB[radioIndex]
  });
});

app.put('/api/radios/:id', authMiddleware, (req, res) => {
  const radioId = parseInt(req.params.id);
  console.log(`PUT /api/radios/${radioId} - Updating radio:`, req.body);
  
  const radioIndex = radiosDB.findIndex(r => r.id === radioId);
  if (radioIndex === -1) {
    return res.status(404).json({ error: 'Radio no encontrada' });
  }
  
  const { name, user_id, plan_id, server_type, bitrate, max_listeners, mount_point, port } = req.body;
  
  // Si se cambia el puerto, verificar que esté disponible
  if (port && port !== radiosDB[radioIndex].port) {
    const portInUse = radiosDB.some(r => r.port === parseInt(port) && r.id !== radioId);
    if (portInUse) {
      return res.status(400).json({ error: 'Puerto ya está en uso' });
    }
  }
  
  // Actualizar radio
  radiosDB[radioIndex] = {
    ...radiosDB[radioIndex],
    name: name || radiosDB[radioIndex].name,
    user_id: parseInt(user_id) || radiosDB[radioIndex].user_id,
    plan_id: parseInt(plan_id) || radiosDB[radioIndex].plan_id,
    server_type: server_type || radiosDB[radioIndex].server_type,
    bitrate: parseInt(bitrate) || radiosDB[radioIndex].bitrate,
    max_listeners: parseInt(max_listeners) || radiosDB[radioIndex].max_listeners,
    mount_point: mount_point || radiosDB[radioIndex].mount_point,
    port: parseInt(port) || radiosDB[radioIndex].port
  };
  
  console.log('Radio updated successfully:', radiosDB[radioIndex]);
  res.json({
    message: 'Radio actualizada exitosamente',
    radio: radiosDB[radioIndex]
  });
});

app.delete('/api/radios/:id', authMiddleware, (req, res) => {
  const radioId = parseInt(req.params.id);
  console.log(`DELETE /api/radios/${radioId} - Deleting radio`);
  
  const radioIndex = radiosDB.findIndex(r => r.id === radioId);
  if (radioIndex === -1) {
    return res.status(404).json({ error: 'Radio no encontrada' });
  }
  
  radiosDB.splice(radioIndex, 1);
  console.log('Radio deleted successfully');
  
  res.json({
    message: 'Radio eliminada exitosamente',
    radioId: radioId
  });
});

// Ruta para obtener puertos disponibles
app.get('/api/radios/available-ports', authMiddleware, (req, res) => {
  const basePorts = [8000, 8002, 8004, 8006, 8008, 8010, 8012, 8014, 8016, 8018];
  const usedPorts = radiosDB.map(radio => radio.port);
  const availablePorts = basePorts.filter(port => !usedPorts.includes(port));
  
  res.json({
    available_ports: availablePorts,
    next_auto_port: getNextAvailablePort(),
    used_ports: usedPorts
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
