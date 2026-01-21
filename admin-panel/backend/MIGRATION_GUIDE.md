# CSV to MongoDB Migration Guide

## Overview

This migration script migrates all data from CSV files in the `databases/` folder to MongoDB collections.

## How It Works

- **Each CSV file** → **One MongoDB collection**
- **Each row in CSV** → **One document/object in MongoDB**

### CSV to Collection Mapping

| CSV File | MongoDB Collection | Model |
|----------|-------------------|-------|
| `admins.csv` | `admins` | Admin |
| `entities.csv` | `entities` | Entity |
| `officers.csv` | `officers` | Officer |
| `receptionists.csv` | `receptionists` | Receptionist |
| `visitors.csv` | `visitors` | Visitor |
| `interactions.csv` | `interactions` | Interaction |

## Prerequisites

1. **Environment Variables**: Make sure your `.env` file is set up with:
   ```env
   MONGODB_URI=mongodb+srv://<db_username>:<db_password>@zeto.vxe0b.mongodb.net/?appName=zeto
   MONGODB_DB_NAME=interaction-system
   ```

2. **MongoDB Connection**: Ensure your MongoDB Atlas cluster is accessible and credentials are correct.

## Running the Migration

### Option 1: Using npm script (Recommended)
```bash
npm run migrate
```

### Option 2: Direct execution
```bash
node src/scripts/migrateToMongoDB.js
```

## What the Migration Does

1. **Reads each CSV file** from the `databases/` folder
2. **Parses CSV rows** and converts them to MongoDB documents
3. **Checks for duplicates** based on the `id` field (skips if document already exists)
4. **Cleans data**:
   - Trims whitespace
   - Handles empty values with appropriate defaults
   - Converts empty strings to default values where needed
5. **Inserts documents** in batches of 100 for efficiency
6. **Provides progress updates** and a summary report

## Migration Features

- ✅ **Duplicate Prevention**: Skips documents that already exist (based on `id` field)
- ✅ **Error Handling**: Continues migration even if individual rows fail
- ✅ **Progress Tracking**: Shows real-time progress during migration
- ✅ **Batch Processing**: Processes data in batches for better performance
- ✅ **Empty Row Filtering**: Automatically skips completely empty rows
- ✅ **Data Cleaning**: Handles missing values and empty strings appropriately

## Migration Output

The script provides detailed output:

```
🚀 Starting MongoDB migration...
📁 CSV Directory: /path/to/databases
📊 Collections to migrate: admins.csv, entities.csv, ...

✅ Connected to MongoDB

📄 Reading admins.csv...
   Found 1 rows to migrate
   ✅ Migrated admins.csv: 1 inserted, 0 skipped, 0 errors

📄 Reading entities.csv...
   Found 1 rows to migrate
   ✅ Migrated entities.csv: 1 inserted, 0 skipped, 0 errors

...

📊 Migration Summary:
============================================================
   admins.csv: ✅ 1 documents inserted
   entities.csv: ✅ 1 documents inserted
   ...
============================================================
✨ Total: 6 documents inserted, 0 skipped, 0 errors
============================================================

✅ Migration completed!
```

## Re-running the Migration

The migration script is **idempotent** - you can run it multiple times safely:

- **Existing documents** (based on `id`) will be skipped
- **New documents** will be inserted
- **No data will be overwritten** or duplicated

## Troubleshooting

### Error: "MONGODB_URI is not defined"
- Make sure your `.env` file exists in the `backend/` directory
- Verify the `MONGODB_URI` variable is set correctly

### Error: "Failed to connect to MongoDB"
- Check your MongoDB Atlas credentials
- Verify network connectivity
- Ensure your IP address is whitelisted in MongoDB Atlas

### Some rows are skipped
- This is normal if documents with the same `id` already exist
- Check the migration summary for details

### Empty CSV files
- The script will skip files with no data rows
- This is expected behavior

## Data Validation

The migration script performs basic data cleaning:

- **Empty strings** → Default values based on field type
- **Missing `id`** → Row is skipped
- **Whitespace** → Trimmed from all fields
- **Empty rows** → Automatically filtered out

## Next Steps After Migration

After successful migration:

1. **Verify data** in MongoDB Atlas or using MongoDB Compass
2. **Update services** to use MongoDB models instead of CSV files
3. **Test your application** to ensure everything works correctly
4. **Keep CSV files as backup** until you're confident in the migration

## Notes

- The migration preserves all field names from CSV headers
- Date fields are preserved as strings (ISO format)
- Boolean-like fields (`active`, `approved`) are kept as strings (`'true'`/`'false'`)
- The script does NOT delete existing data in MongoDB collections
