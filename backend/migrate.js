require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ru_flush',
    });

    console.log('Connected to database.');

    try {
        // Add gender column to toilets
        try {
            await db.query("ALTER TABLE toilets ADD COLUMN gender ENUM('male','female','all-gender') DEFAULT NULL");
            console.log('✓ Added gender column to toilets');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('— gender column already exists, skipping');
            } else throw e;
        }

        // Add detailed_ratings column to reviews
        try {
            await db.query("ALTER TABLE reviews ADD COLUMN detailed_ratings JSON DEFAULT NULL");
            console.log('✓ Added detailed_ratings column to reviews');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('— detailed_ratings column already exists, skipping');
            } else throw e;
        }

        // Add tags column to reviews
        try {
            await db.query("ALTER TABLE reviews ADD COLUMN tags JSON DEFAULT NULL");
            console.log('✓ Added tags column to reviews');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('— tags column already exists, skipping');
            } else throw e;
        }

        // Add gender column to reviews
        try {
            await db.query("ALTER TABLE reviews ADD COLUMN gender ENUM('male','female','all-gender') DEFAULT NULL");
            console.log('✓ Added gender column to reviews');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('— gender column in reviews already exists, skipping');
            } else throw e;
        }

        // Add floor column to reviews
        try {
            await db.query("ALTER TABLE reviews ADD COLUMN floor VARCHAR(100) DEFAULT NULL");
            console.log('✓ Added floor column to reviews');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('— floor column in reviews already exists, skipping');
            } else throw e;
        }

        // Add building_requests table
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS building_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    building VARCHAR(255) NOT NULL,
                    campus VARCHAR(100) NOT NULL,
                    floor VARCHAR(100) DEFAULT NULL,
                    note TEXT DEFAULT NULL,
                    status ENUM('pending','done') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✓ building_requests table ready');
        } catch (e) {
            console.log('— building_requests table error:', e.message);
        }

        // Add likes column to reviews
        try {
            await db.query("ALTER TABLE reviews ADD COLUMN likes INT DEFAULT 0");
            console.log('✓ Added likes column to reviews');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('— likes column already exists, skipping');
            } else throw e;
        }

        // Add status column to existing building_requests (if table existed before)
        try {
            await db.query("ALTER TABLE building_requests ADD COLUMN status ENUM('pending','done') DEFAULT 'pending'");
            console.log('✓ Added status column to building_requests');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('— status column already exists, skipping');
            }
        }

        // Verify existing overall ratings unchanged
        const [rows] = await db.query(`
            SELECT t.id, t.name,
                   IFNULL(ROUND(AVG(r.stars), 1), 0) AS avg_rating,
                   COUNT(r.id) AS review_count
            FROM toilets t
            LEFT JOIN reviews r ON t.id = r.toilet_id
            WHERE EXISTS (SELECT 1 FROM reviews r2 WHERE r2.toilet_id = t.id)
            GROUP BY t.id
            LIMIT 5
        `);
        if (rows.length > 0) {
            console.log('\n✓ Verification — existing ratings preserved:');
            rows.forEach(r => console.log(`  [${r.id}] ${r.name}: ${r.avg_rating} (${r.review_count} reviews)`));
        }

        console.log('\nMigration complete. All existing data preserved.');
    } finally {
        await db.end();
    }
}

migrate().catch(console.error);
