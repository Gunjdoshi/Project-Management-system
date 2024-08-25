import express from "express";
import mysql from "mysql";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const jwtSecret = 'trial-key'; 
const encryptionKey = crypto.randomBytes(32); 
const ivLength = 16; 

// MySQL connection
const db = mysql.createConnection({
  host: "",
  user: "",
  password: "", //password for your MySQL server
  database: "" //the schema name where your tables are stored
});

db.connect((err) => {
  if (err) {
    console.log("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database!");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  const checkQuery = "SELECT * FROM users WHERE username = ?";
  db.query(checkQuery, [username], async (err, result) => {
    if (err) {
      console.error("Error checking for existing user:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "User already exists. Please login or choose a different username." });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the hashed password in the database
    const insertQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(insertQuery, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ message: "Server error" });
      }
      res.status(200).json({ message: "User registered successfully" });
    });
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], async (err, result) => {
    if (err) {
      console.error("Error logging in:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length > 0) {
      const user = result[0];

      // Compare the provided password with the hashed password stored in the database
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });
        return res.status(200).json({ message: "Login successful", token });
      } else {
        return res.status(401).json({ message: "Invalid username or password" });
      }
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  });
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Get Projects for a particular user
app.get('/projects', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = 'SELECT * FROM projects WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching projects:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
});

// Create Project
app.post('/projects', authenticateToken, (req, res) => {
  const { title, description, status } = req.body;
  const userId = req.user.id;

  const query = 'INSERT INTO projects (title, description, status, user_id) VALUES (?, ?, ?, ?)';
  db.query(query, [title, description, status, userId], (err, result) => {
    if (err) {
      console.error('Error creating project:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.status(201).json({ message: 'Project created successfully' });
  });
});

// Update Project
app.put('/projects/:id', authenticateToken, (req, res) => {
  const { title, description, status } = req.body;
  const projectId = req.params.id;
  const userId = req.user.id;

  const query = 'UPDATE projects SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?';
  db.query(query, [title, description, status, projectId, userId], (err, result) => {
    if (err) {
      console.error('Error updating project:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.status(200).json({ message: 'Project updated successfully' });
  });
});

// Delete Project
app.delete('/projects/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  const query = 'DELETE FROM projects WHERE id = ? AND user_id = ?';
  db.query(query, [projectId, userId], (err, result) => {
    if (err) {
      console.error('Error deleting project:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.status(200).json({ message: 'Project deleted successfully' });
  });
});

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
