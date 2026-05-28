const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../db');
const protect = require('../middleware/protect');

const router = express.Router();
router.use(protect);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () =>
  genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

const mapTripToFrontend = (row) => {
  if (!row) return null;
  return {
    _id: row.id.toString(),
    id: row.id,
    userId: row.user_id.toString(),
    user_id: row.user_id,
    destination: row.destination,
    days: row.days,
    budget: row.budget,
    interests: row.interests || [],
    tripTitle: row.trip_title || '',
    itinerary: row.itinerary || [],
    budgetEstimate: row.budget_estimate || {},
    hotels: row.hotels || [],
    aiSummary: row.ai_summary || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// POST /api/ai/generate — generate full itinerary and save to trip
router.post('/generate', async (req, res) => {
  try {
    const { tripId } = req.body;

    const tripIdInt = parseInt(tripId, 10);
    if (isNaN(tripIdInt)) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Verify ownership
    const tripResult = await query('SELECT * FROM trips WHERE id = $1 AND user_id = $2', [tripIdInt, req.user.id]);
    const trip = tripResult.rows[0];
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { destination, days, budget, interests } = trip;

    const prompt = `
You are an expert travel planner. Return ONLY valid JSON matching this exact schema, no extra text.
Generate a ${days}-day itinerary for ${destination}.
Budget level: ${budget}. Traveler interests: ${(interests || []).join(', ') || 'general sightseeing'}.

JSON schema:
{
  "tripTitle": "string",
  "destination": "string",
  "aiSummary": "string (one sentence highlight of the trip)",
  "days": [
    {
      "day": 1,
      "title": "string",
      "activities": [
        {
          "time": "string",
          "name": "string",
          "description": "string",
          "category": "string",
          "duration": "string"
        }
      ]
    }
  ],
  "budget": {
    "flights": number,
    "accommodation": number,
    "food": number,
    "activities": number,
    "misc": number,
    "total": number,
    "currency": "USD"
  },
  "hotels": [
    {
      "name": "string",
      "tier": "Budget | Mid-range | Luxury",
      "rating": number,
      "description": "string"
    }
  ]
}
`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    // Update trip with AI-generated content in PostgreSQL
    const updateResult = await query(
      `UPDATE trips 
       SET trip_title = $1, ai_summary = $2, itinerary = $3, budget_estimate = $4, hotels = $5, updated_at = NOW() 
       WHERE id = $6 AND user_id = $7 
       RETURNING *`,
      [
        data.tripTitle,
        data.aiSummary,
        JSON.stringify(data.days || []),
        JSON.stringify(data.budget || {}),
        JSON.stringify(data.hotels || []),
        tripIdInt,
        req.user.id
      ]
    );

    const updatedTrip = mapTripToFrontend(updateResult.rows[0]);
    res.json({ trip: updatedTrip });
  } catch (err) {
    console.error('AI generate error:', err);
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

// POST /api/ai/regenerate-day — regenerate a single day
router.post('/regenerate-day', async (req, res) => {
  try {
    const { tripId, dayNumber, userInstruction } = req.body;

    const tripIdInt = parseInt(tripId, 10);
    if (isNaN(tripIdInt)) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const tripResult = await query('SELECT * FROM trips WHERE id = $1 AND user_id = $2', [tripIdInt, req.user.id]);
    const trip = tripResult.rows[0];
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const itinerary = trip.itinerary || [];
    const currentDay = itinerary.find((d) => d.day === dayNumber);

    const prompt = `
You are a travel planner. Return ONLY valid JSON.
Regenerate Day ${dayNumber} of a ${trip.days}-day trip to ${trip.destination}.
Budget: ${trip.budget}. Interests: ${(trip.interests || []).join(', ')}.
Special instructions from user: "${userInstruction || 'Make it interesting and varied'}".
Current day: ${JSON.stringify(currentDay)}

Return ONLY this schema:
{ "day": number, "title": "string", "activities": [{"time":"string","name":"string","description":"string","category":"string","duration":"string"}] }
`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const newDay = JSON.parse(text);

    // Replace the day in itinerary
    const updatedItinerary = itinerary.map((d) =>
      d.day === dayNumber ? { ...d, ...newDay } : d
    );

    const updateResult = await query(
      'UPDATE trips SET itinerary = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [JSON.stringify(updatedItinerary), tripIdInt, req.user.id]
    );

    const updatedTrip = mapTripToFrontend(updateResult.rows[0]);
    res.json({ trip: updatedTrip, regeneratedDay: newDay });
  } catch (err) {
    console.error('Regenerate day error:', err);
    res.status(500).json({ error: 'Failed to regenerate day' });
  }
});

module.exports = router;
