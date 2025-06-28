
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'geeksradio.db');

class Database {
  constructor() {
    this.db = null;
  }

  init() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error conectando a la base de datos:', err);
      } else {
        console.log('✅ Base de datos SQLite conectada');
        this.createTables();
      }
    });
  }

  createTables() {
    // Tabla de usuarios (administradores y clientes)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'client') DEFAULT 'client',
        full_name VARCHAR(100),
        phone VARCHAR(20),
        company VARCHAR(100),
        address TEXT,
        avatar_url VARCHAR(255),
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de planes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        max_listeners INTEGER DEFAULT 100,
        bitrate_limit INTEGER DEFAULT 128,
        storage_gb INTEGER DEFAULT 5,
        transfer_gb INTEGER DEFAULT 100,
        autodj_enabled BOOLEAN DEFAULT 1,
        price_monthly DECIMAL(10,2) DEFAULT 0,
        features TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de radios
    this.db.run(`
      CREATE TABLE IF NOT EXISTS radios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        user_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        server_type ENUM('icecast', 'shoutcast') DEFAULT 'icecast',
        port INTEGER NOT NULL,
        max_listeners INTEGER DEFAULT 100,
        bitrate INTEGER DEFAULT 128,
        format VARCHAR(10) DEFAULT 'mp3',
        mount_point VARCHAR(50),
        source_password VARCHAR(100),
        admin_password VARCHAR(100),
        autodj_enabled BOOLEAN DEFAULT 0,
        status ENUM('active', 'suspended', 'maintenance') DEFAULT 'active',
        current_listeners INTEGER DEFAULT 0,
        peak_listeners INTEGER DEFAULT 0,
        total_hours DECIMAL(10,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (plan_id) REFERENCES plans (id)
      )
    `);

    // Tabla de estadísticas de streams
    this.db.run(`
      CREATE TABLE IF NOT EXISTS stream_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        radio_id INTEGER NOT NULL,
        listeners INTEGER DEFAULT 0,
        bitrate INTEGER DEFAULT 0,
        song_title VARCHAR(255),
        song_artist VARCHAR(255),
        genre VARCHAR(100),
        server_start_time DATETIME,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (radio_id) REFERENCES radios (id)
      )
    `);

    // Tabla de logs de actividad
    this.db.run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id INTEGER,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Crear usuario administrador por defecto
    this.createDefaultAdmin();
    this.createDefaultPlans();
  }

  createDefaultAdmin() {
    const hashedPassword = bcrypt.hashSync('geeksradio2024', 10);
    
    this.db.run(`
      INSERT OR IGNORE INTO users (username, email, password, role, full_name, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@geeksradio.com', hashedPassword, 'admin', 'Administrador Principal', 1], (err) => {
      if (err) {
        console.error('Error creando usuario admin:', err);
      } else {
        console.log('✅ Usuario administrador creado');
      }
    });
  }

  createDefaultPlans() {
    const plans = [
      ['Básico', 'Plan básico para radios pequeñas', 50, 128, 2, 50, 1, 29.99, 'Icecast, AutoDJ, Soporte básico'],
      ['Profesional', 'Plan profesional con más recursos', 200, 256, 10, 200, 1, 59.99, 'Icecast, SHOUTcast, AutoDJ, Estadísticas, Soporte prioritario'],
      ['Premium', 'Plan premium con recursos ilimitados', 500, 320, 50, 500, 1, 99.99, 'Todos los servidores, AutoDJ avanzado, Estadísticas completas, Soporte 24/7'],
      ['Enterprise', 'Plan empresarial personalizable', 1000, 320, 100, 1000, 1, 199.99, 'Solución personalizada, Múltiples servidores, API completa, Soporte dedicado']
    ];

    plans.forEach(plan => {
      this.db.run(`
        INSERT OR IGNORE INTO plans (name, description, max_listeners, bitrate_limit, storage_gb, transfer_gb, autodj_enabled, price_monthly, features) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, plan);
    });

    console.log('✅ Planes por defecto creados');
  }

  getDb() {
    return this.db;
  }
}

const database = new Database();
module.exports = database;
