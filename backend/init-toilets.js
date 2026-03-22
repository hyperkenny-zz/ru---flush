require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ru_flush',
});

const toilets = [
    { name: 'William Levine Hall', campus: 'Busch', floor: '1st Floor' },
    { name: 'Ernest Mario School of Pharmacy', campus: 'Busch', floor: '1st Floor' },
    { name: 'Psychology Building', campus: 'Busch', floor: '1st Floor' },
    { name: 'Nelson Biology Laboratories', campus: 'Busch', floor: '1st Floor' },
    { name: 'Library of Science & Medicine', campus: 'Busch', floor: '1st Floor' },
    { name: 'Daniel L. Kessler Teaching Laboratories', campus: 'Busch', floor: '1st Floor' },
    { name: 'Smithers Hall - Center of Alcohol Studies', campus: 'Busch', floor: '1st Floor' },
    { name: 'Wright Rieman Laboratories', campus: 'Busch', floor: '1st Floor' },
    { name: 'Physics Lecture Hall', campus: 'Busch', floor: '1st Floor' },
    { name: 'Nanophysics Laboratory', campus: 'Busch', floor: '1st Floor' },
    { name: 'Civil Engineering Laboratory', campus: 'Busch', floor: '1st Floor' },
    { name: 'Biomedical Engineering Building', campus: 'Busch', floor: '1st Floor' },
    { name: 'Sonny A. Werblin Recreation Center', campus: 'Busch', floor: '1st Floor' },
];

db.connect((err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database.');

    let completed = 0;

    toilets.forEach((toilet) => {
        const sql = `
            INSERT INTO toilets (name, campus, floor, photo_url)
            SELECT ?, ?, ?, NULL
            FROM DUAL
            WHERE NOT EXISTS (
                SELECT 1 FROM toilets WHERE name = ? AND campus = ?
            )
        `;
        db.query(
            sql,
            [toilet.name, toilet.campus, toilet.floor, toilet.name, toilet.campus],
            (err, result) => {
                if (err) {
                    console.error(`Error inserting "${toilet.name}":`, err.message);
                } else if (result.affectedRows === 0) {
                    console.log(`Skipped (already exists): "${toilet.name}"`);
                } else {
                    console.log(`Inserted: "${toilet.name}"`);
                }

                completed++;
                if (completed === toilets.length) {
                    db.end((endErr) => {
                        if (endErr) {
                            console.error('Error closing connection:', endErr.message);
                        } else {
                            console.log('Done. Database connection closed.');
                        }
                    });
                }
            }
        );
    });
});
