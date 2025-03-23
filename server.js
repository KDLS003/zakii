const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const path = require("path"); // <-- Import path
const app = express();
const PORT = 3000;

// Allow bigger request bodies, e.g. up to 10MB
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 1) Serve your static files in the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Create a MySQL connection pool – update these credentials as needed.
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "items",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Admin credentials (hardcoded for now)
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

// Admin login route
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Middleware to protect admin routes
function verifyAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Unauthorized access" });

  const decodedToken = Buffer.from(token, "base64").toString("utf-8");
  const [username, password] = decodedToken.split(":");
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden access" });
  }
}

// GET all items
app.get("/api/items", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM items");
    res.json(rows);
  } catch (error) {
    console.error("GET /api/items error:", error);  // Add this
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// POST a new item (admin only)
app.post("/api/items", verifyAdmin, async (req, res) => {
    const { name, description, dateFound, location, image } = req.body;
  
    if (!name || !description || !dateFound || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }
  
    try {
      const [result] = await pool.query(
        "INSERT INTO items (name, description, dateFound, location, status, image) VALUES (?, ?, ?, ?, 'Available', ?)",
        [name, description, dateFound, location, image]
      );
      res.status(201).json({ message: "Item added successfully", id: result.insertId });
    } catch (error) {
      console.error("❌ Error in POST /api/items:", error); // <--- Add this
      res.status(500).json({ error: "Failed to add item" });
    }
  });
  

// PUT to update an item’s status to 'Claimed' (admin only)
app.put("/api/items/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("UPDATE items SET status = 'Claimed' WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Item not found" });
    const [rows] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE an item (admin only)
app.delete("/api/items/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM items WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// 2) Optional: If someone hits "/", serve your index.html from 'public'
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
