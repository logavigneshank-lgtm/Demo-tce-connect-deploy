const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  time: { type: String, default: 'TBA' },
  venue: { type: String, default: 'TBA' },
  department: { type: String, default: 'General' },
  type: { 
    type: String, 
    enum: ['technical', 'cultural', 'sports'], 
    default: 'technical' 
  },
  club: { type: String, default: '' },
  maxParticipants: { type: Number, default: 100 },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  winners: [{
  studentName: { type: String, required: true },
  department: { type: String, required: true },
  eventName: { type: String, required: true },
  position: {
    type: String,
    enum: ['1st Place', '2nd Place', '3rd Place'],
    required: true
  },
  achievementDate: { type: String },
  photoUrl: { type: String, default: '' }
}]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
