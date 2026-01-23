const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/interaction-system')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const Visitor = mongoose.model('Visitor', new mongoose.Schema({}, { strict: false, collection: 'visitors' }));
const Interaction = mongoose.model('Interaction', new mongoose.Schema({}, { strict: false, collection: 'interactions' }));

async function migrateVisitors() {
    try {
        console.log('\n=== Starting Visitor Migration ===\n');

        // Get all visitors
        const visitors = await Visitor.find({}).lean();
        console.log(`Found ${visitors.length} visitors to migrate`);

        if (visitors.length === 0) {
            console.log('No visitors to migrate');
            return;
        }

        // Group by entity
        const visitorsByEntity = {};
        visitors.forEach(v => {
            if (!visitorsByEntity[v.entitySerial]) {
                visitorsByEntity[v.entitySerial] = [];
            }
            visitorsByEntity[v.entitySerial].push(v);
        });

        console.log('\nVisitors by entity:');
        Object.keys(visitorsByEntity).forEach(entitySerial => {
            console.log(`  ${entitySerial}: ${visitorsByEntity[entitySerial].length} visitors`);
        });

        // Migration map: old ID -> new data
        const migrationMap = {};

        // Process each entity
        for (const [entitySerial, entityVisitors] of Object.entries(visitorsByEntity)) {
            console.log(`\n--- Processing entity: ${entitySerial} ---`);

            // Sort by creation date to maintain order
            entityVisitors.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            // Assign new serials (6-digit numbers)
            entityVisitors.forEach((visitor, index) => {
                const oldId = visitor.id;
                const oldSerial = visitor.serial;

                // Generate new UUID for id
                const newId = uuidv4();

                // Generate new 6-digit serial
                const newSerial = (index + 1).toString().padStart(6, '0');

                migrationMap[oldId] = {
                    oldId,
                    oldSerial,
                    newId,
                    newSerial,
                    entitySerial: visitor.entitySerial,
                    name: `${visitor.firstName} ${visitor.lastName}`
                };

                console.log(`  ${visitor.firstName} ${visitor.lastName}:`);
                console.log(`    Old ID: ${oldId} -> New ID: ${newId}`);
                console.log(`    Old Serial: ${oldSerial} -> New Serial: ${newSerial}`);
            });
        }

        console.log('\n=== Migration Plan ===');
        console.log(JSON.stringify(migrationMap, null, 2));

        // Ask for confirmation
        console.log('\n⚠️  This will update:');
        console.log(`  - ${visitors.length} visitor records`);
        console.log('  - All related interactions');
        console.log('\nProceed with migration? (This script will auto-proceed in 5 seconds)');

        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\n=== Starting Updates ===\n');

        // Update visitors
        for (const [oldId, data] of Object.entries(migrationMap)) {
            await Visitor.updateOne(
                { id: oldId },
                {
                    $set: {
                        id: data.newId,
                        serial: data.newSerial
                    }
                }
            );
            console.log(`✓ Updated visitor: ${data.name} (${oldId} -> ${data.newId})`);
        }

        // Update interactions
        console.log('\n--- Updating Interactions ---');
        const interactions = await Interaction.find({}).lean();
        console.log(`Found ${interactions.length} interactions to update`);

        for (const interaction of interactions) {
            const visitorData = migrationMap[interaction.visitorId];
            if (visitorData) {
                await Interaction.updateOne(
                    { id: interaction.id },
                    {
                        $set: {
                            visitorId: visitorData.newId,
                            visitorSerial: visitorData.newSerial
                        }
                    }
                );
                console.log(`✓ Updated interaction ${interaction.interactionSerial}: visitor ${visitorData.oldSerial} -> ${visitorData.newSerial}`);
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log('\nSummary:');
        console.log(`  Visitors updated: ${Object.keys(migrationMap).length}`);
        console.log(`  Interactions updated: ${interactions.filter(i => migrationMap[i.visitorId]).length}`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run migration
migrateVisitors();
