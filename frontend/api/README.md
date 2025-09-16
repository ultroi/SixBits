# Zariya API (frontend/api)

This folder contains the Express app that Vercel will expose as a serverless function. It re-uses the backend code under `backend/` (models, routes) and manages a single Mongoose connection for serverless environments.

## Environment variables
Set the following environment variables before running locally or deploying to Vercel:

- `MONGODB_URI` — your MongoDB connection string (include username/password if required)
- `JWT_SECRET` — secret used to sign JWTs
- `NODE_ENV` — optional; set to `production` on Vercel
- `DEBUG_DB` — optional; set to `1` to enable additional DB diagnostics at `/api/health/db`

> On Vercel, add these in the Project Settings → Environment Variables (do not commit secrets to the repo).

## Run locally (PowerShell)
1. From the repo root create a `.env` file in `frontend/api` with the required variables, for example:

```
MONGODB_URI="mongodb+srv://user:pass@cluster0.mongodb.net/Zariya?retryWrites=true&w=majority"
JWT_SECRET="your_jwt_secret"
NODE_ENV=development
```

2. Install dependencies (if not already installed):

```powershell
cd frontend/api; npm install
```

3. Start the API locally (the file includes a small `if (require.main === module)` block so it can run standalone):

```powershell
cd frontend/api; node index.js
# By default it listens on PORT 3000 (or use $env:PORT to override)
```

4. Test the health endpoint:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/health -Method GET
```

or using `curl`:

```powershell
curl http://localhost:3000/api/health
```

If `MONGODB_URI` is missing you'll get a `500` with a clear message. If MongoDB is unreachable you'll get `503`.

## Deploy to Vercel
This repository is configured to serve the React frontend (`frontend`) via `@vercel/static-build` and route `/api/*` requests to this serverless function (`frontend/api/index.js`). The `vercel.json` already includes `includeFiles: ["backend/**"]` so the backend files are packaged with the function.

1. Ensure the following environment variables are set in the Vercel project settings (Production and Preview as needed):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production` (optional)
   - any other secrets used by the app (Google keys, etc.)

2. From the repo root, run:

```powershell
# If you have the Vercel CLI and are logged in
vercel --prod
```

Vercel will build the frontend and deploy the serverless API. Requests to `/api/*` will be forwarded to the Express app.

## Notes & Troubleshooting
- Serverless cold starts and timeouts: Vercel serverless functions have execution time limits and memory caps. Keep handlers lightweight; the current code attempts to reuse a single mongoose connection and disables buffering to reduce cold-start overhead.
- Avoid committing secrets to the repo. Use the Vercel dashboard or `vercel env add` to store secrets.
- If you see `Cannot overwrite model once compiled` errors, it usually means the same model file is being evaluated multiple times against different mongoose instances. The current setup requires `require`-ing models once; ensure `mongoose` is the same instance across modules (the current code uses the default mongoose import throughout).
- If MongoDB connections frequently time out, check your cluster IP whitelist, network access, or increase `serverSelectionTimeoutMS` temporarily to diagnose.

If you want, I can:
- Run a local smoke test for you (needs `MONGODB_URI` and other envs) or
- Add a small test script that runs the health check after spinning up the local server.
