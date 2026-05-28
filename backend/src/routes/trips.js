const express = require('express');
const { query } = require('../db');
const protect = require('../middleware/protect');

const router = express.Router();


router.use(protect);

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

// GET /api/trips — get all trips for current user
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    const trips = result.rows.map(mapTripToFrontend);
    res.json({ trips });
  } catch (err) {
    console.error('Fetch trips error:', err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// POST /api/trips — create a new trip shell
router.post('/', async (req, res) => {
  try {
    const { destination, days, budget, interests } = req.body;

    if (!destination || !days || !budget) {
      return res
        .status(400)
        .json({ error: 'destination, days, and budget are required' });
    }

    const result = await query(
      'INSERT INTO trips (user_id, destination, days, budget, interests) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        req.user.id,
        destination,
        days,
        budget,
        JSON.stringify(interests || [])
      ]
    );

    const trip = mapTripToFrontend(result.rows[0]);
    res.status(201).json({ trip });
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// GET /api/trips/:id — get single trip (ownership verified)
router.get('/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const result = await query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    const trip = mapTripToFrontend(result.rows[0]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ trip });
  } catch (err) {
    console.error('Fetch trip error:', err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// PUT /api/trips/:id — update trip (ownership verified)
router.put('/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Fetch the existing trip first to verify ownership
    const checkResult = await query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );
    const existingTrip = checkResult.rows[0];
    if (!existingTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Map fields from frontend JSON body (camelCase) to db columns (snake_case)
    const destination = req.body.destination !== undefined ? req.body.destination : existingTrip.destination;
    const days = req.body.days !== undefined ? req.body.days : existingTrip.days;
    const budget = req.body.budget !== undefined ? req.body.budget : existingTrip.budget;
    const interests = req.body.interests !== undefined ? JSON.stringify(req.body.interests) : JSON.stringify(existingTrip.interests);
    const trip_title = req.body.tripTitle !== undefined ? req.body.tripTitle : existingTrip.trip_title;
    const itinerary = req.body.itinerary !== undefined ? JSON.stringify(req.body.itinerary) : JSON.stringify(existingTrip.itinerary);
    const budget_estimate = req.body.budgetEstimate !== undefined ? JSON.stringify(req.body.budgetEstimate) : JSON.stringify(existingTrip.budget_estimate);
    const hotels = req.body.hotels !== undefined ? JSON.stringify(req.body.hotels) : JSON.stringify(existingTrip.hotels);
    const ai_summary = req.body.aiSummary !== undefined ? req.body.aiSummary : existingTrip.ai_summary;

    const updateResult = await query(
      `UPDATE trips 
       SET destination = $1, days = $2, budget = $3, interests = $4, trip_title = $5, itinerary = $6, budget_estimate = $7, hotels = $8, ai_summary = $9, updated_at = NOW() 
       WHERE id = $10 AND user_id = $11 
       RETURNING *`,
      [destination, days, budget, interests, trip_title, itinerary, budget_estimate, hotels, ai_summary, tripId, req.user.id]
    );

    const updatedTrip = mapTripToFrontend(updateResult.rows[0]);
    res.json({ trip: updatedTrip });
  } catch (err) {
    console.error('Update trip error:', err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// DELETE /api/trips/:id — delete trip (ownership verified)
router.delete('/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const deleteResult = await query(
      'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING *',
      [tripId, req.user.id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

router.mapTripToFrontend = mapTripToFrontend;
module.exports = router;
