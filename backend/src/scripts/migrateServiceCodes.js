#!/usr/bin/env node
/**
 * Migrate service codes: upsert missing services and update fees.
 * Run: node src/scripts/migrateServiceCodes.js
 * Run with --force to delete all and re-insert fresh: node src/scripts/migrateServiceCodes.js --force
 */
require('dotenv').config();
const mongoose = require('mongoose');
const ServiceService = require('../services/ServiceService');

const forceReload = process.argv.includes('--force');

async function run() {
    let mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
        console.error('MONGODB_URI not set');
        process.exit(1);
    }

    // Use same database logic as main app (database.js)
    const dbName = process.env.MONGODB_DB_NAME || 'Interaction_System';
    const uriParts = mongoURI.split('?');
    let baseURI = uriParts[0].replace(/\/+$/, '');
    const queryString = uriParts[1] ? `?${uriParts[1]}` : '';
    const lastSlashIndex = baseURI.lastIndexOf('/');
    const afterSlash = baseURI.substring(lastSlashIndex + 1);
    if (!afterSlash || afterSlash.includes('.')) {
        mongoURI = `${baseURI}/${dbName}${queryString}`;
    }

    try {
        await mongoose.connect(mongoURI);
        const dbName = mongoose.connection.db.databaseName;
        console.log('Connected to MongoDB, database:', dbName);
        if (forceReload) {
            console.log('Force reload: clearing and re-inserting all services...');
            const { deleted, inserted } = await ServiceService.forceReloadServiceCodes();
            console.log(`Done: ${deleted} deleted, ${inserted} inserted`);
        } else {
            const { inserted, updated } = await ServiceService.migrateServiceCodes();
            console.log(`Done: ${inserted} inserted, ${updated} updated`);
        }
        const all = await ServiceService.getAll();
        console.log(`Verification: ${all.length} services in collection "services"`);
        if (all.length > 0) {
            console.log('Codes:', all.map(s => s.code).join(', '));
        }
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

run();
