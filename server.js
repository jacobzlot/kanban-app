const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Init DB ──────────────────────────────────────────────────────────────────
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS columns (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        color VARCHAR(7) DEFAULT '#6366f1',
        card_limit INTEGER DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        column_id INTEGER REFERENCES columns(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        position INTEGER NOT NULL DEFAULT 0,
        priority VARCHAR(20) DEFAULT 'normal',
        progress INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        tags TEXT DEFAULT '',
        tag_colors TEXT DEFAULT '',
        start_date DATE DEFAULT NULL,
        due_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Seed default columns if empty
    const { rows } = await client.query('SELECT COUNT(*) FROM columns');
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO columns (title, position, color) VALUES
          ('Ideas', 0, '#f59e0b'),
          ('Research', 1, '#10b981'),
          ('In Progress', 2, '#3b82f6'),
          ('Review', 3, '#f97316'),
          ('Done', 4, '#22c55e')
      `);
    }
    console.log('✅ Database ready');
  } finally {
    client.release();
  }
}

// ─── Columns API ──────────────────────────────────────────────────────────────
app.get('/api/board', async (req, res) => {
  try {
    const cols = await pool.query('SELECT * FROM columns ORDER BY position');
    const cards = await pool.query('SELECT * FROM cards ORDER BY position');
    const board = cols.rows.map(col => ({
      ...col,
      cards: cards.rows.filter(c => c.column_id === col.id)
    }));
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/columns', async (req, res) => {
  const { title, color } = req.body;
  try {
    const { rows } = await pool.query('SELECT COALESCE(MAX(position),0)+1 AS pos FROM columns');
    const result = await pool.query(
      'INSERT INTO columns (title, position, color) VALUES ($1, $2, $3) RETURNING *',
      [title, rows[0].pos, color || '#6366f1']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/columns/:id', async (req, res) => {
  const { title, color, card_limit } = req.body;
  try {
    const result = await pool.query(
      'UPDATE columns SET title=$1, color=$2, card_limit=$3 WHERE id=$4 RETURNING *',
      [title, color, card_limit || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/columns/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM columns WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/columns/reorder', async (req, res) => {
  const { order } = req.body; // array of { id, position }
  try {
    await Promise.all(order.map(({ id, position }) =>
      pool.query('UPDATE columns SET position=$1 WHERE id=$2', [position, id])
    ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cards API ────────────────────────────────────────────────────────────────
app.post('/api/cards', async (req, res) => {
  const { column_id, title, description, priority, progress, status, tags, tag_colors, start_date, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT COALESCE(MAX(position),0)+1 AS pos FROM cards WHERE column_id=$1', [column_id]
    );
    const result = await pool.query(
      `INSERT INTO cards (column_id, title, description, position, priority, progress, status, tags, tag_colors, start_date, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [column_id, title, description || '', rows[0].pos, priority || 'normal',
       progress || 0, status || 'active', tags || '', tag_colors || '',
       start_date || null, due_date || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  const { title, description, priority, progress, status, tags, tag_colors, start_date, due_date, column_id, position } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cards SET
        title=$1, description=$2, priority=$3, progress=$4, status=$5,
        tags=$6, tag_colors=$7, start_date=$8, due_date=$9,
        column_id=COALESCE($10, column_id), position=COALESCE($11, position),
        updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [title, description, priority, progress, status, tags, tag_colors,
       start_date || null, due_date || null, column_id || null, position || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cards/move', async (req, res) => {
  const { card_id, column_id, position } = req.body;
  try {
    await pool.query(
      'UPDATE cards SET column_id=$1, position=$2, updated_at=NOW() WHERE id=$3',
      [column_id, position, card_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Kanban board running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
