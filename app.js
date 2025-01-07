const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Task = require("./models/taskModel");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/userModel");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/taskdb")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, "jwt_secret", {
    expiresIn: "1h",
  });
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

// Add Middleware for JWT Verification
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "jwt_secret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Register Route
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const newUser = new User({ username, email, password, role });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a Task
app.post("/tasks", authenticate, async (req, res) => {
  try {
    const task = new Task({ ...req.body, createdBy: req.user.id });
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// View All Tasks
app.get("/tasks", authenticate, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { createdBy: req.user.id };
    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Task Status
app.patch(
  "/tasks/:id",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTask = await Task.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedTask)
        return res.status(404).json({ message: "Task not found" });
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete a Task
app.delete(
  "/tasks/:id",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deletedTask = await Task.findByIdAndDelete(id);
      if (!deletedTask)
        return res.status(404).json({ message: "Task not found" });
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Add a Task
// app.post('/tasks', async (req, res) => {
//   console.log(req.body); // Log the incoming request body
//   try {
//     const task = new Task(req.body);
//     const savedTask = await task.save();
//     res.status(201).json(savedTask);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// View All Tasks
// app.get('/tasks', async (req, res) => {
//   try {
//     const tasks = await Task.find();
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// Update Task Status
// app.patch('/tasks/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
//     const updatedTask = await Task.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true }
//     );
//     if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
//     res.json(updatedTask);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// Delete a Task
// app.delete('/tasks/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedTask = await Task.findByIdAndDelete(id);
//     if (!deletedTask) return res.status(404).json({ message: 'Task not found' });
//     res.json({ message: 'Task deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });
