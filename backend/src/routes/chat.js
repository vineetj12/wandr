const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../db');
const protect = require('../middleware/protect');

const router = express.Router();
router.use(protect);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/chat — Travel Buddy chat with trip context
router.post('/', async (req, res) => {
  try {
    const { message, tripId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 chars)' });
    }

    const tripIdInt = parseInt(tripId, 10);
    if (isNaN(tripIdInt)) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Fetch trip with ownership check
    const tripResult = await query('SELECT * FROM trips WHERE id = $1 AND user_id = $2', [tripIdInt, req.user.id]);
    const trip = tripResult.rows[0];
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const prompt = `
You are a friendly, helpful, and enthusiastic travel assistant for someone planning a trip to ${trip.destination}.
The traveler's name is ${req.user.name}.
Trip details: ${trip.days} days, ${trip.budget} budget, interests: ${(trip.interests || []).join(', ')}.

Here is their current itinerary:
${JSON.stringify(trip.itinerary, null, 2)}

Answer this question concisely and helpfully: "${message}"

Guidelines:
- Keep response under 150 words
- Use bullet points if listing multiple items
- Be specific to their actual itinerary when relevant
- Use a friendly, enthusiastic tone
- If the question is not related to travel or their trip, gently redirect
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

module.exports = router;
