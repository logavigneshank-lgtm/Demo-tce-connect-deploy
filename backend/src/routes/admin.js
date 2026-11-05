const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Club = require('../models/Club');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');

// Admin middleware - checks if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get analytics dashboard data
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const activeClubs = await Club.countDocuments();

    // Today's events
    const todaysEvents = await Event.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('organizer', 'name email').sort({ time: 1 });

    // Past events
    const pastEvents = await Event.find({
      date: { $lt: today }
    }).populate('organizer', 'name email').sort({ date: -1 }).limit(10);

    // Upcoming events
    const upcomingEvents = await Event.find({
      date: { $gte: tomorrow }
    }).populate('organizer', 'name email').sort({ date: 1 }).limit(10);

    // Get organizers with their clubs
    const organizers = await User.find({ role: 'organizer' })
      .select('name email department')
      .sort({ name: 1 });

    res.json({
      stats: {
        totalUsers,
        totalEvents,
        activeClubs,
        todaysEventsCount: todaysEvents.length
      },
      todaysEvents,
      pastEvents,
      upcomingEvents,
      organizers
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all events
router.get('/events', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ date: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all clubs
router.get('/clubs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const clubs = await Club.find().sort({ createdAt: -1 });
    res.json(clubs);
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event
router.delete('/events/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Winner management (admin only). Winners are stored inside their related Event document.
router.get('/winners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ 'winners.0': { $exists: true } }).select('title winners');
    const winners = events.flatMap(event => event.winners.map(winner => ({
      ...winner.toObject(),
      id: winner._id.toString(),
      eventId: event._id.toString(),
      eventTitle: event.title
    })));
    res.json(winners);
  } catch (error) {
    console.error('Get winners error:', error);
    res.status(500).json({ error: 'Unable to load winners' });
  }
});

// Add a winner to an existing event.
router.post('/winners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId, studentName, department, eventName, position, achievementDate, photoUrl } = req.body;
    if (!eventId || !studentName || !department || !eventName || !achievementDate ||
        !['1st Place', '2nd Place', '3rd Place'].includes(position)) {
      return res.status(400).json({ error: 'Please provide all required winner details and a valid position.' });
    }
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Selected event was not found.' });
    event.winners.push({ studentName, department, eventName, position, achievementDate, photoUrl: photoUrl || '' });
    await event.save();
    const winner = event.winners[event.winners.length - 1];
    res.status(201).json({
      message: 'Winner published successfully',
      winner: { ...winner.toObject(), id: winner._id.toString(), eventId: event._id.toString() }
    });
  } catch (error) {
    console.error('Add winner error:', error);
    res.status(500).json({ error: 'Unable to save winner' });
  }
});

// Delete a winner from its event.
router.delete('/winners/:eventId/:winnerId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const winner = event.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ error: 'Winner not found' });
    winner.deleteOne();
    await event.save();
    res.json({ message: 'Winner deleted successfully' });
  } catch (error) {
    console.error('Delete winner error:', error);
    res.status(500).json({ error: 'Unable to delete winner' });
  }
});


module.exports = router;
