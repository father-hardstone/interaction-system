# Supabase Setup Guide

## Configuration

To use Supabase for image storage, you need to configure the following environment variables in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`

## Storage Bucket Setup

### Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Create a bucket named: `CRM testing`
4. Make it **Public** (so images can be accessed via URL)

### Configure Storage Policies (IMPORTANT!)

After creating the bucket, you need to set up Row Level Security (RLS) policies to allow uploads:

1. Go to **Storage** → **Policies** (or click on the `CRM testing` bucket → **Policies** tab)
2. Click **New Policy** for the `CRM testing` bucket
3. Create policies for **INSERT** and **SELECT** operations:

   **Policy 1: Allow public uploads (INSERT)**
   - Policy name: `Allow public uploads`
   - Allowed operation: `INSERT`
   - Policy definition: `true` (or use: `bucket_id = 'CRM testing'`)
   - Target roles: `public`, `authenticated`

   **Policy 2: Allow public access (SELECT)**
   - Policy name: `Allow public access`
   - Allowed operation: `SELECT`
   - Policy definition: `true`
   - Target roles: `public`, `authenticated`

   **Policy 3: Allow public updates (UPDATE)** - Optional, if you want to allow overwriting
   - Policy name: `Allow public updates`
   - Allowed operation: `UPDATE`
   - Policy definition: `true`
   - Target roles: `public`, `authenticated`

**Quick Setup (SQL):**
You can also run this SQL in Supabase SQL Editor:
```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'CRM testing');

-- Allow public access
CREATE POLICY "Allow public access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'CRM testing');

-- Allow public updates (optional)
CREATE POLICY "Allow public updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'CRM testing');
```

### Bucket Structure

The bucket will automatically organize files into folders:
- `{entityId}/assets/icons/` - For entity icons
- `{entityId}/assets/profile pictures/` - For entity profile pictures

Folders are created automatically when files are uploaded. If folders already exist, they will be reused.

## File Naming Convention

Files are automatically named with the following pattern:
- Profile pictures: `{entityId}-profile-{timestamp}.{ext}`
- Icons: `{entityId}-icon-{timestamp}.{ext}`

## Usage

The Supabase storage service is automatically used in:
- **Entity Settings** page for uploading profile pictures and icons

When an image is uploaded:
1. Image is uploaded to Supabase Storage bucket
2. Public URL is retrieved
3. URL is saved to the backend database

## Testing

To test the setup:
1. Ensure environment variables are set
2. Go to Entity Settings page
3. Upload a profile picture or icon
4. Check Supabase Storage dashboard to verify file upload
5. Verify the URL is saved in your backend database
