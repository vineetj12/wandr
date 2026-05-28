const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: String,
  name: String,
  description: String,
  category: String,
  duration: String,
});

const daySchema = new mongoose.Schema({
  day: Number,
  title: String,
  activities: [activitySchema],
});

const hotelSchema = new mongoose.Schema({
  name: String,
  tier: { type: String, enum: ['Budget', 'Mid-range', 'Luxury'] },
  rating: Number,
  description: String,
});

const budgetSchema = new mongoose.Schema({
  flights: Number,
  accommodation: Number,
  food: Number,
  activities: Number,
  misc: Number,
  total: Number,
  currency: { type: String, default: 'USD' },
});

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1, max: 30 },
    budget: {
      type: String,
      enum: ['Budget', 'Mid-range', 'Luxury'],
      required: true,
    },
    interests: [{ type: String }],
    tripTitle: String,
    itinerary: [daySchema],
    budgetEstimate: budgetSchema,
    hotels: [hotelSchema],
    aiSummary: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
