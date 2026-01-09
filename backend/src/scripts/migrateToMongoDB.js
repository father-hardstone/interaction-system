require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const { Admin, Entity, Officer, Receptionist, Visitor, Interaction } = require('../models');

// Mapping of CSV files to MongoDB models
const CSV_TO_MODEL = {
    'admins.csv': Admin,
    'entities.csv': Entity,
    'officers.csv': Officer,
    'receptionists.csv': Receptionist,
    'visitors.csv': Visitor,
    'interactions.csv': Interaction
};

// CSV file directory
const DB_DIR = path.join(__dirname, '../../databases');

/**
 * Read and parse a CSV file
 */
function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                // Filter out completely empty rows
                const hasData = Object.values(data).some(value => value && value.trim() !== '');
                if (hasData) {
                    results.push(data);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

/**
 * Clean and convert CSV data to MongoDB document format
 */
function cleanData(row) {
    const cleaned = {};
    for (const [key, value] of Object.entries(row)) {
        // Convert empty strings to default values based on field type
        if (value === '' || value === undefined || value === null) {
            // Set defaults based on field name
            if (key === 'deletedAt') {
                cleaned[key] = '';
            } else if (key === 'active' || key === 'approved') {
                cleaned[key] = 'true'; // Default to true if empty
            } else if (key === 'otp') {
                cleaned[key] = '123456';
            } else if (key.includes('email') || key.includes('Email')) {
                cleaned[key] = '';
            } else if (key.includes('middleName')) {
                cleaned[key] = '';
            } else {
                cleaned[key] = value || '';
            }
        } else {
            cleaned[key] = value.trim();
        }
    }
    return cleaned;
}

/**
 * Migrate a single CSV file to MongoDB collection
 */
async function migrateCSVToCollection(filename, Model) {
    const filePath = path.join(DB_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File ${filename} not found, skipping...`);
        return { success: false, skipped: true, count: 0 };
    }

    try {
        console.log(`\n📄 Reading ${filename}...`);
        const rows = await readCSVFile(filePath);
        
        if (rows.length === 0) {
            console.log(`   ⚠️  No data found in ${filename}`);
            return { success: true, skipped: false, count: 0 };
        }

        console.log(`   Found ${rows.length} rows to migrate`);

        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        // Process rows in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            for (const row of batch) {
                try {
                    const cleanedData = cleanData(row);
                    
                    // Skip if id is missing or empty
                    if (!cleanedData.id || cleanedData.id.trim() === '') {
                        skipped++;
                        continue;
                    }

                    // Check if document already exists
                    const existing = await Model.findOne({ id: cleanedData.id });
                    if (existing) {
                        console.log(`   ⚠️  Document with id ${cleanedData.id} already exists, skipping...`);
                        skipped++;
                        continue;
                    }

                    // Create new document
                    const document = new Model(cleanedData);
                    await document.save();
                    inserted++;
                } catch (error) {
                    console.error(`   ❌ Error inserting row with id ${row.id || 'unknown'}:`, error.message);
                    errors++;
                }
            }

            // Progress update
            if (i + batchSize < rows.length) {
                process.stdout.write(`   Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length} rows processed\r`);
            }
        }

        console.log(`   ✅ Migrated ${filename}: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
        return { success: true, skipped: false, count: inserted, skipped: skipped, errors: errors };

    } catch (error) {
        console.error(`   ❌ Error migrating ${filename}:`, error.message);
        return { success: false, skipped: false, count: 0, error: error.message };
    }
}

/**
 * Main migration function
 */
async function migrateAll() {
    console.log('🚀 Starting MongoDB migration...\n');
    console.log('📁 CSV Directory:', DB_DIR);
    console.log('📊 Collections to migrate:', Object.keys(CSV_TO_MODEL).join(', '));
    console.log('\n' + '='.repeat(60));

    try {
        // Connect to MongoDB
        let mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // If the connection string doesn't include a database name, add it
        // Use the exact database name from env (MongoDB allows capitals and underscores)
        // Default to Interaction_System to match existing database
        const dbName = process.env.MONGODB_DB_NAME || 'Interaction_System';
        const uriParts = mongoURI.split('?');
        let baseURI = uriParts[0];
        const queryString = uriParts[1] ? `?${uriParts[1]}` : '';
        
        // Remove trailing slash if present to avoid double slashes
        baseURI = baseURI.replace(/\/+$/, '');
        
        const lastSlashIndex = baseURI.lastIndexOf('/');
        const afterSlash = baseURI.substring(lastSlashIndex + 1);
        
        // Debug: Show what we found
        console.log(`🔍 Connection string analysis:`);
        console.log(`   Base URI: ${baseURI}`);
        console.log(`   After last slash: "${afterSlash}"`);
        console.log(`   Database name from env: "${dbName}"`);
        
        if (!afterSlash || afterSlash.includes('.')) {
            // Add database name with single slash
            mongoURI = `${baseURI}/${dbName}${queryString}`;
            console.log(`   ✅ Added database name to URI`);
        } else {
            console.log(`   ℹ️  Database name already in URI: "${afterSlash}"`);
        }
        
        console.log(`   Final URI: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`); // Hide password

        await mongoose.connect(mongoURI, {
            // Connection options
        });
        
        // Verify connection and database
        const connectedDbName = mongoose.connection.db.databaseName;
        console.log(`\n✅ Connected to MongoDB`);
        console.log(`📊 Database: ${connectedDbName}\n`);
        
        // Ensure we're using the correct database
        if (connectedDbName !== dbName) {
            console.log(`⚠️  Warning: Connected to database "${connectedDbName}" but expected "${dbName}"`);
            console.log(`   This might cause issues. Please check your connection string or MONGODB_DB_NAME.\n`);
        }

        const results = {};
        let totalInserted = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        // Migrate each CSV file
        for (const [filename, Model] of Object.entries(CSV_TO_MODEL)) {
            const result = await migrateCSVToCollection(filename, Model);
            results[filename] = result;
            
            if (result.success && !result.skipped) {
                totalInserted += result.count || 0;
                totalSkipped += result.skipped || 0;
                totalErrors += result.errors || 0;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:');
        console.log('='.repeat(60));
        
        for (const [filename, result] of Object.entries(results)) {
            if (result.skipped) {
                console.log(`   ${filename}: ⚠️  File not found`);
            } else if (result.success) {
                console.log(`   ${filename}: ✅ ${result.count || 0} documents inserted`);
                if (result.skipped > 0) {
                    console.log(`      ⚠️  ${result.skipped} documents skipped (duplicates)`);
                }
                if (result.errors > 0) {
                    console.log(`      ❌ ${result.errors} errors`);
                }
            } else {
                console.log(`   ${filename}: ❌ Failed - ${result.error || 'Unknown error'}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✨ Total: ${totalInserted} documents inserted, ${totalSkipped} skipped, ${totalErrors} errors`);
        console.log('='.repeat(60));
        console.log('\n✅ Migration completed!\n');

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateAll();
}

module.exports = { migrateAll, migrateCSVToCollection };
