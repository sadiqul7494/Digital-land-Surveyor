import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("surveyor.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_main INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    date TEXT NOT NULL,
    work_type TEXT,
    image_data TEXT,
    status TEXT DEFAULT 'scheduled',
    delay_days INTEGER DEFAULT 0,
    original_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Ensure all columns exist (for existing databases)
const tableInfo = db.prepare("PRAGMA table_info(bookings)").all() as any[];
const columns = tableInfo.map(col => col.name);

if (!columns.includes('work_type')) {
  db.exec("ALTER TABLE bookings ADD COLUMN work_type TEXT");
}
if (!columns.includes('image_data')) {
  db.exec("ALTER TABLE bookings ADD COLUMN image_data TEXT");
}
if (!columns.includes('status')) {
  db.exec("ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'scheduled'");
}
if (!columns.includes('delay_days')) {
  db.exec("ALTER TABLE bookings ADD COLUMN delay_days INTEGER DEFAULT 0");
}
if (!columns.includes('original_date')) {
  db.exec("ALTER TABLE bookings ADD COLUMN original_date TEXT");
}

// Seed main admin if not exists
const mainAdmin = db.prepare("SELECT * FROM admins WHERE username = ?").get("01725345422");
if (!mainAdmin) {
  db.prepare("INSERT INTO admins (username, password, is_main) VALUES (?, ?, ?)").run("01725345422", "Sa749478", 1);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get("/api/bookings", (req, res) => {
    try {
      const bookings = db.prepare("SELECT * FROM bookings ORDER BY date ASC").all();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", (req, res) => {
    const { 
      name, 
      location = '', 
      date, 
      work_type = '', 
      image_data = null 
    } = req.body;
    
    console.log(`Adding booking for: ${name} on ${date}`);
    if (!name || !date) {
      console.log("Missing name or date");
      return res.status(400).json({ error: "Name and date are required" });
    }
    try {
      const info = db.prepare("INSERT INTO bookings (name, location, date, work_type, image_data) VALUES (?, ?, ?, ?, ?)").run(
        name, 
        location || '', 
        date, 
        work_type || '', 
        image_data || null
      );
      console.log(`Booking added successfully with ID: ${info.lastInsertRowid}`);
      res.json({ id: info.lastInsertRowid, name, location, date, work_type });
    } catch (error: any) {
      console.error("Failed to add booking error:", error);
      res.status(500).json({ error: "Failed to add booking", details: error.message });
    }
  });

  app.put("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    const { 
      name, 
      location = '', 
      date, 
      work_type = '', 
      image_data = null, 
      status = 'scheduled', 
      delay_days = 0, 
      original_date = null 
    } = req.body;
    
    try {
      db.prepare(`
        UPDATE bookings 
        SET name = ?, location = ?, date = ?, work_type = ?, image_data = ?, status = ?, delay_days = ?, original_date = ?
        WHERE id = ?
      `).run(
        name, 
        location || '', 
        date, 
        work_type || '', 
        image_data || null, 
        status || 'scheduled', 
        delay_days || 0, 
        original_date || null, 
        id
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update booking error:", error);
      res.status(500).json({ error: "Failed to update booking", details: error.message });
    }
  });

  app.delete("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  // Admin Management
  app.get("/api/admins", (req, res) => {
    try {
      const admins = db.prepare("SELECT id, username, is_main FROM admins").all();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  app.post("/api/admins", (req, res) => {
    const { username, password } = req.body;
    try {
      db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)").run(username, password);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add admin" });
    }
  });

  app.delete("/api/admins/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM admins WHERE id = ? AND is_main = 0").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete admin" });
    }
  });

  // Login
  app.post("/api/login", (req, res) => {
    const { id, password } = req.body;
    console.log(`Login attempt for: ${id}`);
    try {
      const admin = db.prepare("SELECT * FROM admins WHERE username = ? AND password = ?").get(id, password);
      if (admin) {
        console.log(`Login successful for: ${id}`);
        res.json({ success: true, is_main: admin.is_main === 1 });
      } else {
        console.log(`Login failed for: ${id}`);
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
