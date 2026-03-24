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
    db.query(sql, (err, toilets) => {
        if (err) return res.status(500).json(err);

        db.query('SELECT toilet_id, detailed_ratings, tags, gender FROM reviews', (err2, reviews) => {
            if (err2) return res.json(toilets);

            const byToilet = {};
            reviews.forEach(r => {
                if (!byToilet[r.toilet_id]) byToilet[r.toilet_id] = [];
                byToilet[r.toilet_id].push(r);
            });

            const DETAIL_FIELDS = ['cleanliness', 'occupancy', 'privacy', 'smell'];
            const result = toilets.map(t => {
                const tReviews = byToilet[t.id] || [];

                const avgDetailRatings = {};
                DETAIL_FIELDS.forEach(field => {
                    const vals = tReviews
                        .map(r => {
                            const dr = r.detailed_ratings
                                ? (typeof r.detailed_ratings === 'string' ? JSON.parse(r.detailed_ratings) : r.detailed_ratings)
                                : null;
                            return dr ? dr[field] : null;
                        })
                        .filter(v => v !== null && v !== undefined);
                    avgDetailRatings[field] = vals.length > 0
                        ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10
                        : null;
                });
                const hasAnyDetail = Object.values(avgDetailRatings).some(v => v !== null);

                const tagCounts = {};
                tReviews.forEach(r => {
                    const tags = r.tags
                        ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags)
                        : [];
                    (tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
                });
                const topTags = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([tag]) => tag);

                const genderOrder = ['male', 'female', 'all-gender'];
                const genders = genderOrder.filter(g =>
                    tReviews.some(r => r.gender === g)
                );

                return {
                    ...t,
                    avg_detailed_ratings: hasAnyDetail ? avgDetailRatings : null,
                    top_tags: topTags,
                    genders,
                };
            });

            res.json(result);
        });
    });
});

app.post('/api/reviews', (req, res) => {
    const { toilet_id, comment, stars, detailed_ratings, tags, gender, floor } = req.body;
    if (!toilet_id || !comment || !stars) {
        return res.status(400).json({ error: 'Missing required fields: toilet_id, comment, stars' });
    }
    if (stars < 1 || stars > 5) {
        return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }

    const detailedRatingsJson = detailed_ratings ? JSON.stringify(detailed_ratings) : null;
    const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;

    const sql = "INSERT INTO reviews (toilet_id, comment, stars, detailed_ratings, tags, gender, floor) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [toilet_id, comment, stars, detailedRatingsJson, tagsJson, gender || null, floor || null], (err, result) => {
        if (err) return res.status(500).json(err);

        // Update toilet gender/floor if provided
        const updates = [];
        const values = [];
        if (gender) { updates.push('gender = ?'); values.push(gender); }
        if (floor) { updates.push('floor = ?'); values.push(floor); }
        if (updates.length > 0) {
            values.push(toilet_id);
            db.query(`UPDATE toilets SET ${updates.join(', ')} WHERE id = ?`, values, () => {});
        }

        res.status(201).json({ message: 'Review submitted', review_id: result.insertId });
    });
});

app.get('/api/reviews/:toilet_id', (req, res) => {
    const sql = "SELECT * FROM reviews WHERE toilet_id = ? ORDER BY created_at DESC";
    db.query(sql, [req.params.toilet_id], (err, results) => {
        if (err) return res.status(500).json(err);
        // Parse JSON fields (mysql2 returns them as strings)
        const parsed = results.map(r => ({
            ...r,
            detailed_ratings: r.detailed_ratings
                ? (typeof r.detailed_ratings === 'string' ? JSON.parse(r.detailed_ratings) : r.detailed_ratings)
                : null,
            tags: r.tags
                ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags)
                : [],
        }));
        res.json(parsed);
    });
});

const ADMIN_KEY = process.env.ADMIN_KEY || 'ruflush-admin';

const requireAdmin = (req, res, next) => {
    const key = req.headers['x-admin-key'] || req.query.key;
    if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

app.get('/api/admin/requests', requireAdmin, (req, res) => {
    db.query('SELECT * FROM building_requests ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.patch('/api/admin/requests/:id', requireAdmin, (req, res) => {
    const { status } = req.body;
    if (!['pending', 'done'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    db.query('UPDATE building_requests SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/admin/requests/:id', requireAdmin, (req, res) => {
    db.query('DELETE FROM building_requests WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Deleted' });
    });
});

app.post('/api/reviews/:id/like', (req, res) => {
    db.query('UPDATE reviews SET likes = likes + 1 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        db.query('SELECT likes FROM reviews WHERE id = ?', [req.params.id], (err2, rows) => {
            if (err2) return res.status(500).json(err2);
            res.json({ likes: rows[0]?.likes ?? 0 });
        });
    });
});

app.post('/api/requests', (req, res) => {
    const { building, campus, floor, note } = req.body;
    if (!building || !campus) {
        return res.status(400).json({ error: 'Building and campus are required' });
    }
    const sql = 'INSERT INTO building_requests (building, campus, floor, note) VALUES (?, ?, ?, ?)';
    db.query(sql, [building, campus, floor || null, note || null], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: 'Request submitted', id: result.insertId });
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
