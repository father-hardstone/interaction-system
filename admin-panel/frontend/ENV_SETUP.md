# Frontend Environment Variables Setup

## API Configuration

The frontend uses environment variables to configure the backend API URL.

### Setup

1. **Create a `.env` file** in the `frontend` directory with:

```env
# Backend API URL
# For production (Vercel): Use your Vercel backend URL
# For development: Use http://localhost:5000/api
VITE_API_URL=https://interaction-system-g58c.vercel.app/api
```

2. **For local development**, you can create a `.env.local` file that overrides the production URL:

```env
# Local development - use localhost
VITE_API_URL=http://localhost:5000/api
```

### Important Notes

- **Vite requires the `VITE_` prefix** for environment variables to be exposed to the client
- The `.env.local` file takes precedence over `.env` and is typically gitignored
- After changing environment variables, **restart the Vite dev server**

### Current Configuration

- **Production URL**: `https://interaction-system-g58c.vercel.app/api`
- **Development URL**: `http://localhost:5000/api` (fallback if env var not set)

### Usage

The API URL is automatically used in `src/services/api.js`. All API calls will use the configured URL.
