import express from "express";
import mysql from "mysql";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
// new line
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const jwtSecret = 'enter your secret password ';//can be anything 
// new lines
const encryptionKey = crypto.randomBytes(32); // Use a 32-byte key for AES-256
const ivLength = 16; // For AES, the IV is always 16

// MySQL connection
const db = mysql.createConnection({
  host: "Enter the host", //ex:Localhost
  user: "Enter your user",
  password: "Enter your password", //password for you sql server
  database: "Enter you main schema" //the schema name where your tables are stored
});

// to check the status or if there is nay error
db.connect((err) => {
  if (err) {
    console.log("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database!");
});



// Registration function to insert the new values created. 
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const query = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error("Error registering user:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.status(200).json({ message: "User registered successfully" });
  });
});

// Login to cross verify from the database to check if the username and password match
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error("Error logging in:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length > 0) {
      const user = result[0];
      
      const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });
      res.status(200).json({ message: "Login successful", token });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  });
});

// Middleware for authentication to make sure only registered user can access and see projects they created
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

// Get Projects for a particular user, using the authentication software they created
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

// Create Project a new project and tracks it to the particular user
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

// Updates the project and can be done only by the user who created it as only the have access and uses authentication.
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

// Deletes the project and can be done only by the user who created it as only the have access and uses authentication.
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
