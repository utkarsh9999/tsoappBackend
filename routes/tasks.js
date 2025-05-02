const express = require('express');
const router = express.Router();
const passport = require('passport');
const Task = require('../models/Task');
require('../middleware/auth');
const auth = passport.authenticate('jwt', { session: false });

router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const task = await Task.create({
      name,
      description,
      user: req.user._id,
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

router.put('/:taskId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    console.log(req.body);
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, user: req.user._id },
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

module.exports = router;
