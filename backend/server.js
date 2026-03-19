require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ru_flush',
});

app.get('/api/toilets', (req, res) => {
    const sql = `
        SELECT
            t.*,
            IFNULL(ROUND(AVG(r.stars), 1), 0) AS avg_rating,
            COUNT(r.id) AS review_count
        FROM toilets t
        LEFT JOIN reviews r ON t.id = r.toilet_id
        GROUP BY t.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/reviews', (req, res) => {
    const { toilet_id, comment, stars } = req.body;
    if (!toilet_id || !comment || !stars) {
        return res.status(400).json({ error: 'Missing required fields: toilet_id, comment, stars' });
    }
    if (stars < 1 || stars > 5) {
        return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }
    const sql = "INSERT INTO reviews (toilet_id, comment, stars) VALUES (?, ?, ?)";
    db.query(sql, [toilet_id, comment, stars], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: 'Review submitted', review_id: result.insertId });
    });
});

app.get('/api/reviews/:toilet_id', (req, res) => {
    const sql = "SELECT * FROM reviews WHERE toilet_id = ? ORDER BY created_at DESC";
    db.query(sql, [req.params.toilet_id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
