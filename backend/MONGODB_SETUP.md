# MongoDB Setup Guide

## Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
# MongoDB Connection
# Replace <db_username> and <db_password> with your actual MongoDB credentials
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@zeto.vxe0b.mongodb.net/?appName=zeto

# Database name (defaults to 'Interaction_System' if not specified)
# Note: Use the exact database name as it appears in MongoDB Atlas
MONGODB_DB_NAME=Interaction_System

# JWT Secret
JWT_SECRET=supersecretkey

# Server Port
PORT=5000
```

## Important Notes

1. **Replace Placeholders**: Make sure to replace `<db_username>` and `<db_password>` in the `MONGODB_URI` with your actual MongoDB Atlas credentials.

2. **Database Name**: The connection string will automatically use the database name specified in `MONGODB_DB_NAME` (defaults to `interaction-system`). If your connection string already includes a database name, that will be used instead.

3. **Connection String Format**: The connection string should follow this format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/databaseName?options
   ```

## MongoDB Models

The following MongoDB models have been created:

- **Admin** - Admin users (collection: `admins`)
- **Entity** - Entity/organization records (collection: `entities`)
- **Officer** - Officer users (collection: `officers`)
- **Receptionist** - Receptionist users (collection: `receptionists`)
- **Visitor** - Visitor records (collection: `visitors`)
- **Interaction** - Interaction records (collection: `interactions`)

All models are located in `backend/src/models/` and can be imported using:

```javascript
const { Admin, Entity, Officer, Receptionist, Visitor, Interaction } = require('./models');
```

## Next Steps

1. Create the `.env` file with your MongoDB credentials
2. The MongoDB connection will be established automatically when the server starts
3. You can now start migrating your services to use MongoDB models instead of CSV files

## Migration Strategy

The current CSV-based services (`BaseService`) can coexist with MongoDB. You can:

1. Gradually migrate services to use MongoDB models
2. Create new MongoDB-based services alongside existing CSV services
3. Update controllers to use MongoDB models instead of CSV services

Example MongoDB service pattern:

```javascript
const { Visitor } = require('../models');

class VisitorService {
    async getAll() {
        return await Visitor.find({ deletedAt: '' });
    }

    async create(data) {
        const visitor = new Visitor(data);
        return await visitor.save();
    }

    async findOne(query) {
        return await Visitor.findOne({ ...query, deletedAt: '' });
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        return await Visitor.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
    }

    async delete(id) {
        return await Visitor.findOneAndUpdate(
            { id },
            { 
                deletedAt: new Date().toISOString(),
                active: 'false'
            },
            { new: true }
        );
    }
}
```
