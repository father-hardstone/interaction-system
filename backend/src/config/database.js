const dns = require('dns');
const mongoose = require('mongoose');

// On Windows, Node's default DNS resolver often fails mongodb+srv SRV lookups
// (ECONNREFUSED on querySrv) even when nslookup works. Use public resolvers.
if (process.platform === 'win32' && (process.env.MONGODB_URI || '').includes('mongodb+srv')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const connectDB = async () => {
    try {
        let mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // If the connection string doesn't include a database name, add it
        // Use the exact database name from env (MongoDB allows capitals and underscores)
        // Default to Interaction_System to match existing database
        const dbName = process.env.MONGODB_DB_NAME || 'Interaction_System';
        // Check if database name is already in the URI (after the last / and before ?)
        const uriParts = mongoURI.split('?');
        let baseURI = uriParts[0];
        const queryString = uriParts[1] ? `?${uriParts[1]}` : '';
        
        // Remove trailing slash if present to avoid double slashes
        baseURI = baseURI.replace(/\/+$/, '');
        
        // Check if there's a database name after the last /
        const lastSlashIndex = baseURI.lastIndexOf('/');
        const afterSlash = baseURI.substring(lastSlashIndex + 1);
        
        // If after the last / is empty or looks like a hostname (contains .), add database name
        if (!afterSlash || afterSlash.includes('.')) {
            mongoURI = `${baseURI}/${dbName}${queryString}`;
        }
        // If database name already exists in URI, use it as-is

        await mongoose.connect(mongoURI, {
            // MongoDB connection options
        });

        console.log('MongoDB connected successfully');
        
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
