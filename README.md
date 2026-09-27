# TaskFlow

A MERN project and task management app with JWT authentication, USER/ADMIN roles, project members, task tracking, dashboard metrics, notifications, and responsive light/dark UI.

**Stack:** React, Vite, Tailwind CSS, Redux Toolkit, Node.js, Express, MongoDB, and Mongoose.

## Structure

- `frontend/` — React UI and frontend configuration
- `backend/` — API, authentication, models, and admin seed script

## Setup

Requires Node.js 20+ and a reachable MongoDB database.

From the project root:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Skip copying any `.env` file that already exists. In `backend/.env`, set:

```dotenv
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-random-secret-at-least-32-characters
PORT=5000
CLIENT_URL=http://localhost:5173
```

`MONGODB_URL` is also supported. Frontend configuration:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Start both apps:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API health: http://localhost:5000/api/health

## Roles

Public registration always creates a **USER**. Users access projects they own or belong to; owners manage their projects. **ADMIN** can access all projects/tasks and the users directory. Both roles use `/login`; backend authorization enforces permissions.

To create or update an admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`, then run from the root:

```bash
npm run seed:admin
```

Log in with that email and password. Keep `.env` files private.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start frontend and backend |
| `npm run build` | Build frontend into `frontend/dist` |
| `npm run start` | Start backend |
| `npm run check` | Backend syntax checks and frontend build |
| `node --test backend/tests/roles.test.js` | Isolated role-security tests |

To run separately, use `npm run dev --workspace frontend` or `npm run dev --workspace backend`.

If port 5000 is already in use, stop the duplicate backend. If startup fails, check the database URL, MongoDB connectivity, and JWT secret.
