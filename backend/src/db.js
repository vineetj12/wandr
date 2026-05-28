const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'))
    ? false
    : { rejectUnauthorized: false }
});

const query = (text, params) => pool.query(text, params);

const initDb = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTripsTable = `
    CREATE TABLE IF NOT EXISTS trips (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      destination VARCHAR(255) NOT NULL,
      days INTEGER NOT NULL,
      budget VARCHAR(50) NOT NULL,
      interests JSONB DEFAULT '[]',
      trip_title VARCHAR(255),
      itinerary JSONB DEFAULT '[]',
      budget_estimate JSONB DEFAULT '{}',
      hotels JSONB DEFAULT '[]',
      ai_summary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createTripsTable);
    console.log(' PostgreSQL database tables initialized successfully');
  } catch (err) {
    console.error(' Failed to initialize PostgreSQL tables:', err);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  initDb,
};
