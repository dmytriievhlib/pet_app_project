// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const bcrypt = require("bcrypt");
const app = express();
app.use(cors());
app.use(express.json());

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'pet_user';
const DB_PASS = process.env.DB_PASS || '12345';
const DB_NAME = process.env.DB_NAME || 'pet_app';
const DB_PORT = process.env.DB_PORT || 3306;

let pool;
async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('Connected to MySQL (pool)');
}
initDb().catch(err => {
  console.error('DB init error:', err.message);
  process.exit(1);
});

// Статичні файли
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

// Статичні файли після цього
app.use(express.static(path.join(__dirname, '../frontend')));

// ---------------- PETS ----------------
app.get('/api/pets', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pets ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pets', async (req, res) => {
  try {
    const {
      user_id = null,
      type = null,
      breed = null,
      name,
      birth_date = null,
      document_number = null,
      owner_name = null,
      owner_phone = null,
      location = null
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const [result] = await pool.execute(
      `INSERT INTO pets (user_id, type, breed, name, birth_date, document_number, owner_name, owner_phone, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, type, breed, name, birth_date, document_number, owner_name, owner_phone, location]
    );
    const [rows] = await pool.query('SELECT * FROM pets WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM pets WHERE id = ?', [id]);
    res.json({ message: 'Pet deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- EVENTS ----------------
app.get('/api/events/:pet_id', async (req, res) => {
  try {
    const pet_id = parseInt(req.params.pet_id);
    const [rows] = await pool.query('SELECT * FROM events WHERE pet_id = ? ORDER BY event_date DESC, id DESC', [pet_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { pet_id, event_type, event_date = null, description = null, clinic = null, location = null } = req.body;
    if (!pet_id || !event_type) return res.status(400).json({ error: 'Missing pet_id or event_type' });
    const [result] = await pool.execute(
      'INSERT INTO events (pet_id, event_type, event_date, description, clinic, location) VALUES (?, ?, ?, ?, ?, ?)',
      [pet_id, event_type, event_date, description, clinic, location]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// ---------------- Training Centers ----------------
app.get('/api/centers', async (req,res)=>{
  try{ const [rows] = await pool.query('SELECT * FROM training_centers ORDER BY name'); res.json(rows); }
  catch(err){ res.status(500).json({error: err.message}); }
});
app.post('/api/centers', async (req,res)=>{
  try{
    const {name,address=null,phone=null} = req.body;
    if(!name) return res.status(400).json({error:'Missing name'});
    const [result]=await pool.execute('INSERT INTO training_centers (name,address,phone) VALUES (?,?,?)',[name,address,phone]);
    const [rows]=await pool.query('SELECT * FROM training_centers WHERE id=?',[result.insertId]);
    res.status(201).json(rows[0]);
  } catch(err){ res.status(500).json({error: err.message}); }
});
app.delete('/api/centers/:id', async (req,res)=>{ const id=parseInt(req.params.id); await pool.execute('DELETE FROM training_centers WHERE id=?',[id]); res.json({message:'Center deleted'}); });
// ----------------  Trainers ---------------
app.get('/api/trainers', async (req,res)=>{
  try{
    const [rows] = await pool.query(`
      SELECT t.id,t.name,t.specialty,t.phone,c.name AS center_name,c.address AS center_address
      FROM trainers t
      JOIN training_centers c ON t.center_id=c.id
      ORDER BY c.name ASC, t.id ASC;
    `);
    res.json(rows);
  } catch(err){ res.status(500).json({error: err.message}); }
});
app.post('/api/trainers', async (req,res)=>{
  try{
    const {center_id,name,specialty=null,phone=null}=req.body;
    if(!center_id||!name) return res.status(400).json({error:'Missing center_id or name'});
    const [result]=await pool.execute('INSERT INTO trainers (center_id,name,specialty,phone) VALUES (?,?,?,?)',[center_id,name,specialty,phone]);
    const [rows]=await pool.query('SELECT * FROM trainers WHERE id=?',[result.insertId]);
    res.status(201).json(rows[0]);
  } catch(err){ res.status(500).json({error: err.message}); }
});
app.delete('/api/trainers/:id', async (req,res)=>{ const id=parseInt(req.params.id); await pool.execute('DELETE FROM trainers WHERE id=?',[id]); res.json({message:'Trainer deleted'}); });
// -------------------- API: LEISURE --------------------
// GET /api/leisure - список місць дозвілля
app.get('/api/leisure', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leisure_places ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leisure - додати місце дозвілля
app.post('/api/leisure', async (req, res) => {
  try {
    const { name, type = null, address = null, description = null } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const [result] = await pool.execute(
      'INSERT INTO leisure_places (name, type, address, description) VALUES (?, ?, ?, ?)',
      [name, type, address, description]
    );
    const [rows] = await pool.query('SELECT * FROM leisure_places WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leisure/:id - видалити місце
app.delete('/api/leisure/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM leisure_places WHERE id = ?', [id]);
    res.json({ message: 'Leisure place deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// -------------------- API: BREEDERS --------------------
// GET /api/breeders - список заводчиків
app.get('/api/breeders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM breeders ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/breeders - додати заводчика
app.post('/api/breeders', async (req, res) => {
  try {
    const { name, animal_type = null, phone = null, email = null, address = null, description = null } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const [result] = await pool.execute(
      'INSERT INTO breeders (name, animal_type, phone, email, address, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, animal_type, phone, email, address, description]
    );
    const [rows] = await pool.query('SELECT * FROM breeders WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// DELETE /api/breeders/:id - видалити заводчика
app.delete('/api/breeders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM breeders WHERE id = ?', [id]);
    res.json({ message: 'Breeder deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// -------------------- API: EXHIBITIONS --------------------
// GET /api/exhibitions - список виставок
app.get('/api/exhibitions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exhibitions ORDER BY start_date');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// POST /api/exhibitions - додати виставку
app.post('/api/exhibitions', async (req, res) => {
  try {
    const { name, animal_type = null, start_date, end_date = null, location = null, description = null } = req.body;
    if (!name || !start_date) return res.status(400).json({ error: 'Missing name or start_date' });
    const [result] = await pool.execute(
      'INSERT INTO exhibitions (name, animal_type, start_date, end_date, location, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, animal_type, start_date, end_date, location, description]
    );
    const [rows] = await pool.query('SELECT * FROM exhibitions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/exhibitions/:id - видалити виставку
app.delete('/api/exhibitions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM exhibitions WHERE id = ?', [id]);
    res.json({ message: 'Exhibition deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// -------------------- API: REGULATIONS --------------------
// GET /api/regulations - список нормативних документів
app.get('/api/regulations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM regulations ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/regulations - додати документ
app.post('/api/regulations', async (req, res) => {
  try {
    const { title, document_type = null, url = null, description = null } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const [result] = await pool.execute(
      'INSERT INTO regulations (title, document_type, url, description) VALUES (?, ?, ?, ?)',
      [title, document_type, url, description]
    );
    const [rows] = await pool.query('SELECT * FROM regulations WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// DELETE /api/regulations/:id - видалити документ
app.delete('/api/regulations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM regulations WHERE id = ?', [id]);
    res.json({ message: 'Regulation deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// GET /api/organizations
app.get('/api/organizations', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM animal_organizations ORDER BY id');
  res.json(rows);
});

// POST /api/organizations
app.post('/api/organizations', async (req, res) => {
  const { name, description = null, website = null, phone = null, email = null } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const [result] = await pool.execute(
    'INSERT INTO animal_organizations (name, description, website, phone, email) VALUES (?, ?, ?, ?, ?)',
    [name, description, website, phone, email]
  );
  const [rows] = await pool.query('SELECT * FROM animal_organizations WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});
// DELETE /api/organizations/:id
app.delete('/api/organizations/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await pool.execute('DELETE FROM animal_organizations WHERE id = ?', [id]);
  res.json({ message: 'Organization deleted' });
});

// GET /api/news - отримати всі оголошення
app.get('/api/news', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM news ORDER BY  id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// POST /api/news - додати оголошення
app.post('/api/news', async (req, res) => {
  const { title, content, start_date = null, end_date = null, source = null } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing title or content' });
  const [result] = await pool.execute(
    'INSERT INTO news (title, content, start_date, end_date, source) VALUES (?, ?, ?, ?, ?)',
    [title, content, start_date, end_date, source]
  );
  const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    const [existing] = await pool.query('SELECT id FROM users WHERE username=?', [username]);
    if (existing.length > 0) return res.status(400).json({ error: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email || null, hash]
    );

    res.status(201).json({ message: 'User registered', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    const [rows] = await pool.query('SELECT * FROM users WHERE username=?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Невірні дані' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Невірні дані' });

    // Можна зберегти user info у фронтенді через localStorage
    res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ---------------- ADMIN STATS ----------------
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) AS c FROM users');
    const [[pets]]  = await pool.query('SELECT COUNT(*) AS c FROM pets');
    const [petsByType] = await pool.query(
      'SELECT type, COUNT(*) AS c FROM pets GROUP BY type'
    );

    const [[events]] = await pool.query('SELECT COUNT(*) AS c FROM events');
    const [[clinics]] = await pool.query(
      "SELECT COUNT(DISTINCT clinic) AS c FROM events WHERE clinic IS NOT NULL AND clinic <> ''"
    );

    const [[centers]] = await pool.query('SELECT COUNT(*) AS c FROM training_centers');
    const [[trainers]] = await pool.query('SELECT COUNT(*) AS c FROM trainers');
    const [[leisure]] = await pool.query('SELECT COUNT(*) AS c FROM leisure_places');
    const [[breeders]] = await pool.query('SELECT COUNT(*) AS c FROM breeders');
    const [[exhibitions]] = await pool.query('SELECT COUNT(*) AS c FROM exhibitions');
    const [[regulations]] = await pool.query('SELECT COUNT(*) AS c FROM regulations');
    const [[orgs]] = await pool.query('SELECT COUNT(*) AS c FROM animal_organizations');
    const [[news]] = await pool.query('SELECT COUNT(*) AS c FROM news');

    res.json({
      users: users.c,
      pets: pets.c,
      petsByType,
      events: events.c,
      clinics: clinics.c,
      centers: centers.c,
      trainers: trainers.c,
      leisure: leisure.c,
      breeders: breeders.c,
      exhibitions: exhibitions.c,
      regulations: regulations.c,
      organizations: orgs.c,
      news: news.c
    });

  } catch (err) {
    console.error('ADMIN STATS ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
