# Just Deal — Express Backend API

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env from example
cp .env.example .env
# Edit .env with your actual SUPABASE_SERVICE_ROLE_KEY and JWT_SECRET

# 3. Run in development mode
npm run dev
# Server starts at http://localhost:3001

# 4. Build for production
npm run build
npm start
```

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `SUPABASE_ANON_KEY` | Anon/publishable key |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Server port (default: 3001) |

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/register` | Register new user + organization |
| GET | `/api/v1/auth/me` | Get current user (requires token) |

### Deals
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/deals` | List deals (with search, filter, pagination) |
| GET | `/api/v1/deals/stats` | Get deal statistics |
| GET | `/api/v1/deals/status-categories` | Get status counts |
| GET | `/api/v1/deals/:id` | Get single deal with property + rent rolls |
| POST | `/api/v1/deals` | Create new deal |
| PUT | `/api/v1/deals/:id` | Update deal + property |
| DELETE | `/api/v1/deals/:id` | Delete deal and all related data |
| PATCH | `/api/v1/deals/:id/status` | Update deal status |
| PATCH | `/api/v1/deals/:id/star` | Toggle star |

### Properties
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/deals/:dealId/property` | Get property for deal |
| PUT | `/api/v1/deals/:dealId/property` | Create/update property |

### Rent Roll
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/deals/:dealId/rent-roll` | List rent rolls for deal |
| GET | `/api/v1/deals/:dealId/rent-roll/latest` | Get latest rent roll |
| POST | `/api/v1/deals/:dealId/rent-roll/upload` | Upload Excel file (multipart) |
| GET | `/api/v1/deals/:dealId/rent-roll/units` | Get units (paginated) |
| GET | `/api/v1/deals/:dealId/rent-roll/unit-mix` | Get unit mix summary |
| GET | `/api/v1/deals/:dealId/rent-roll/:rrId` | Get rent roll by ID |
| DELETE | `/api/v1/deals/:dealId/rent-roll/:rrId` | Delete rent roll |
| POST | `/api/v1/deals/:dealId/rent-roll/:rrId/mapping` | Save column mapping |
| GET | `/api/v1/deals/:dealId/rent-roll/:rrId/floorplans` | Get floorplans |
| PUT | `/api/v1/deals/:dealId/rent-roll/:rrId/floorplans` | Update floorplans |
| GET | `/api/v1/deals/:dealId/rent-roll/:rrId/occupancy` | Get occupancy |
| PUT | `/api/v1/deals/:dealId/rent-roll/:rrId/occupancy` | Update occupancy |
| GET | `/api/v1/deals/:dealId/rent-roll/:rrId/charges` | Get charges |
| PUT | `/api/v1/deals/:dealId/rent-roll/:rrId/charges` | Update charges |
| PUT | `/api/v1/deals/:dealId/rent-roll/:rrId/renovations` | Update renovations |
| PUT | `/api/v1/deals/:dealId/rent-roll/:rrId/affordability` | Update affordability |
| POST | `/api/v1/deals/:dealId/rent-roll/:rrId/finalize` | Finalize rent roll |
| GET | `/api/v1/deals/:dealId/rent-roll/:rrId/dashboard` | Dashboard stats |
| GET | `/api/v1/deals/:dealId/rent-roll/:rrId/floor-plan-summary` | Floor plan summary |

### Operating Statements
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/deals/:dealId/operating-statement` | List statements |
| GET | `/api/v1/deals/:dealId/operating-statement/latest` | Get latest statement |
| GET | `/api/v1/deals/:dealId/operating-statement/noi-summary` | Get NOI summary |
| GET | `/api/v1/deals/:dealId/operating-statement/:osId` | Get statement by ID |

## Architecture

```
Browser (React) → Express API (localhost:3001) → Supabase DB (Postgres)
```

All database operations go through the Express backend using the Supabase service role key. The frontend never connects to Supabase directly.
