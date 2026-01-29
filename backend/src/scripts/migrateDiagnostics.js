#!/usr/bin/env node
/**
 * Migrate diagnostic codes: delete all and re-insert fresh (codes up to 017, duplicates allowed).
 * Run: node src/scripts/migrateDiagnostics.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const DiagnosticService = require('../services/DiagnosticService');

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
        const dbNameActual = mongoose.connection.db.databaseName;
        console.log('Connected to MongoDB, database:', dbNameActual);
        console.log('Force reload: clearing and re-inserting all diagnostics...');
        const { deleted, inserted } = await DiagnosticService.forceReloadDiagnostics();
        console.log(`Done: ${deleted} deleted, ${inserted} inserted`);
        const all = await DiagnosticService.getAll();
        console.log(`Verification: ${all.length} diagnostics in collection "diagnostics"`);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

run();
