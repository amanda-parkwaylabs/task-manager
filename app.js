const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Task = require('./models/taskModel');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/taskdb')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Add a Task
app.post('/tasks', async (req, res) => {
  console.log(req.body); // Log the incoming request body
  try {
    const task = new Task(req.body);
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
  
  // View All Tasks
  app.get('/tasks', async (req, res) => {
    try {
      const tasks = await Task.find();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update Task Status
  app.patch('/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedTask = await Task.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Delete a Task
  app.delete('/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedTask = await Task.findByIdAndDelete(id);
      if (!deletedTask) return res.status(404).json({ message: 'Task not found' });
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  