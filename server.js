const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/fhaundit")
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ MongoDB connection error:", err));

// Admin credentials (Hardcoded for now, move to a database for production)
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

// API Routes for managing lost items (Admin only)
const Item = mongoose.model("Item", new mongoose.Schema({
    name: String,
    description: String,
    dateFound: String,
    location: String,
    status: { type: String, default: "Available" }
}));

app.get("/api/items", async (req, res) => {
    const items = await Item.find();
    res.json(items);
});

app.post("/api/items", verifyAdmin, async (req, res) => {
    const { name, description, dateFound, location } = req.body;
    if (!name || !description || !dateFound || !location) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const newItem = new Item({ name, description, dateFound, location });
        await newItem.save();
        res.status(201).json({ message: "Item added successfully", newItem });
    } catch (error) {
        res.status(500).json({ error: "Failed to add item" });
    }
});

app.put("/api/items/:id", verifyAdmin, async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(req.params.id, { status: "Claimed" }, { new: true });
        if (!updatedItem) return res.status(404).json({ error: "Item not found" });
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: "Failed to update item" });
    }
});

app.delete("/api/items/:id", verifyAdmin, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete item" });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
