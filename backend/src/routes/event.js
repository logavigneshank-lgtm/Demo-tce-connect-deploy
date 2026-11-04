const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authMiddleware, isEventOwner } = require('../middleware/auth');
const { validateEvent, validateEventId } = require('../middleware/validation');

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('organizer participants');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new event (protected)
router.post('/', authMiddleware, validateEvent, async (req, res) => {
  try {
    const { title, description, date, time, venue, department, type, club, maxParticipants } = req.body;
    const organizer = req.user.userId;
    const event = new Event({ 
      title, 
      description, 
      date,
      time: time || 'TBA',
      venue: venue || 'TBA',
      department: department || 'General',
      type: type || 'technical',
      club: club || '',
      maxParticipants: maxParticipants || 100,
      organizer 
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Get all published winners
router.get('/winners', async (req, res) => {
  try {
    const events = await Event.find({ 'winners.0': { $exists: true } });
    const winners = events.flatMap(event =>
      event.winners.map(winner => ({
        ...winner.toObject(),
        eventId: event._id
      }))
    );
    res.json(winners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Add winner (protected - event organizer only)
router.post('/:id/winners', authMiddleware, validateEventId, isEventOwner, async (req, res) => {
  try {
    const {
      studentName,
      department,
      eventName,
      position,
      achievementDate,
      photoUrl
    } = req.body;

    if (!studentName || !department || !eventName ||
        !['1st Place', '2nd Place', '3rd Place'].includes(position)) {
      return res.status(400).json({ error: 'Invalid winner details' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.winners.push({
      studentName,
      department,
      eventName,
      position,
      achievementDate,
      photoUrl
    });

    await event.save();

    res.status(201).json({
      message: 'Winner added successfully',
      winners: event.winners
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single event by ID (public)
router.get('/:id', validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer participants');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update event (protected - organizer only)
router.put('/:id', authMiddleware, validateEventId, validateEvent, isEventOwner, async (req, res) => {
  try {
    const { title, description, date, time, venue, department, type, club, maxParticipants } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, time, venue, department, type, club, maxParticipants },
      { new: true, runValidators: true }
    ).populate('organizer participants');
    
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete event (protected - organizer only)
router.delete('/:id', authMiddleware, validateEventId, isEventOwner, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register for event (protected)
router.post('/:id/register', authMiddleware, validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Check if user is the organizer
    if (event.organizer.toString() === req.user.userId) {
      return res.status(403).json({ error: 'Organizers cannot register for their own events' });
    }
    
    // Check if user is already registered
    if (event.participants.includes(req.user.userId)) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }
    
    // Check if event is full
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }
    
    event.participants.push(req.user.userId);
    await event.save();
    
    const updatedEvent = await Event.findById(req.params.id).populate('organizer participants');
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel registration (protected)
router.delete('/:id/register', authMiddleware, validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Check if user is registered
    if (!event.participants.includes(req.user.userId)) {
      return res.status(400).json({ error: 'Not registered for this event' });
    }
    
    event.participants = event.participants.filter(
      participantId => participantId.toString() !== req.user.userId
    );
    await event.save();
    
    const updatedEvent = await Event.findById(req.params.id).populate('organizer participants');
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Edit winner
router.put('/:id/winners/:winnerId', authMiddleware, validateEventId, isEventOwner, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const winner = event.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ error: 'Winner not found' });

    const { studentName, department, eventName, position, achievementDate, photoUrl } = req.body;

    Object.assign(winner, {
      studentName, department, eventName, position, achievementDate, photoUrl
    });

    await event.save();
    res.json({ message: 'Winner updated successfully', winner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete winner
router.delete('/:id/winners/:winnerId', authMiddleware, validateEventId, isEventOwner, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const winner = event.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ error: 'Winner not found' });

    winner.deleteOne();
    await event.save();

    res.json({ message: 'Winner deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
