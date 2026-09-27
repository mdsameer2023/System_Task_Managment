# TaskFlow — Project & Task Management System

A full-stack MERN application for managing projects, members, tasks, and deadlines. Includes JWT authentication, USER/ADMIN access, dashboard metrics, notifications, task search and filtering, pagination, optimistic status updates, and a responsive light/dark interface.

## Application URLs

- Local frontend: http://localhost:5173
- Local backend: http://localhost:5000
- API health: http://localhost:5000/api/health

## Tech Stack

### Frontend

- React 18 + Vite
- Redux Toolkit + React Redux
- React Router
- React Hook Form + Zod
- Tailwind CSS
- Axios, React Hot Toast, and Lucide Icons

### Backend

- Node.js + Express
- MongoDB / MongoDB Atlas + Mongoose
- JWT authentication + bcryptjs password hashing
- Zod request validation
- Helmet, CORS, Morgan, and dotenv
- Nodemon for development; Node.js test runner for role tests

## Architecture

```text
User
  |
React Frontend
  React Router + Tailwind CSS + Redux Toolkit
  |
Axios REST requests + JWT Bearer token
  |
Express Backend
  Routes -> Authentication -> Validation / Authorization -> Controllers
  |
Mongoose
  |
MongoDB
  users | projects | tasks | notifications
```

## Request Flow

```text
UI action -> Axios request -> Express route
          -> JWT verification (protected requests)
          -> Validation and role/project permission checks
          -> Controller -> Mongoose -> MongoDB
          -> JSON response -> Redux update -> UI update
```

## Main Workflows

### 1. Authentication

- Public registration validates input, hashes the password, and always creates a `USER`.
- Login verifies credentials and returns a JWT plus the database user's role.
- Passwords and hashes are excluded from authentication responses.
- Redux stores the current user; the token is stored in localStorage.
- Axios attaches `Authorization: Bearer <token>` to requests.
- The backend loads the current user from MongoDB for protected requests.
- Both USER and ADMIN use the same `/login` page.

### 2. Projects

Authenticated users create projects and become their owners. Owners and admins edit, archive, delete, and manage members. Members can view their projects and create tasks. Removing a member unassigns their tasks; deleting a project removes its tasks and related notifications.

### 3. Tasks

Tasks belong to a project and can be assigned to its owner or a member. The task list supports title search, project/status/priority/assignee filters, sorting, and pagination. Owners and admins manage tasks; assigned users can change their task status.

### 4. Optimistic Status Updates

```text
Change status -> Update Redux immediately -> PUT /api/tasks/:id
              -> Server checks permission -> Database update
              -> Confirm server state, or restore previous status on failure
```

### 5. Notifications and Dashboard

Notifications cover membership changes, task assignment, task completion, and upcoming deadlines. Users can mark one or all notifications as read. Dashboard metrics, project progress, and overdue tasks are calculated from the projects accessible to the current user.

## Authentication & Authorization

The backend enforces JWT authentication, roles, project ownership, membership, and task assignment. Frontend route guards and menu visibility reflect those permissions.

Only `USER` and `ADMIN` are account roles. Owner/member are relationships to a project.

| Action | ADMIN | Project owner | Project member |
| --- | --- | --- | --- |
| View users directory page | Yes | No | No |
| View projects/tasks | All projects | Owned projects | Joined projects |
| Create projects | Yes | Yes | Yes |
| Edit/delete/archive project | Yes | Yes | No |
| Manage project members | Yes | Yes | No |
| Create tasks | Yes | Yes | Yes, in joined projects |
| Edit task details | Yes | Yes | No |
| Change task status | Yes | Yes | Only assigned tasks |
| Delete tasks | Yes | Yes | No |

Admin APIs return `403 Forbidden` for authenticated users without the required role. Public registration cannot create ADMIN accounts, even when a request includes `role: "ADMIN"`.

## State Management

| State | Location |
| --- | --- |
| Authentication | Redux `auth` slice |
| Projects | Redux `projects` slice |
| Tasks and pagination | Redux `tasks` slice |
| Notifications | Redux `notifications` slice |
| Dashboard | Redux `dashboard` slice |
| Forms | React Hook Form |
| Modals, filters, and theme | Local component state |
| Theme preference and token | localStorage |

## Database

```text
User -> owns Projects / joins Projects
Project -> contains Tasks
Task -> assignedTo User / createdBy User
Notification -> belongs to User / references Project or Task
```

The four collections use indexes for email, project ownership/membership, task project/status/assignee/deadline, and notification queries. Overdue status is calculated from the task deadline and completion status.

## Key Features

- Register, login, logout, session restoration, and USER/ADMIN roles
- Project CRUD, archiving, and member management
- Task CRUD, assignment, search, filters, sorting, and pagination
- Dashboard metrics, progress bars, and overdue detection
- Notifications with read/unread controls
- Optimistic task status updates with rollback
- Responsive navigation, light/dark mode, and subtle UI animations
- Form/API validation and loading, error, and empty states
- Isolated role-security tests

## API Endpoints

All endpoints below are prefixed with `/api`.

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/health` | Public |
| POST | `/auth/register` | Public; creates USER |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |
| GET | `/users` | ADMIN |
| GET | `/users/directory` | Authenticated; member-selection directory |
| GET | `/projects` | Accessible projects; ADMIN sees all |
| POST | `/projects` | Authenticated |
| GET | `/projects/:id` | Project access |
| PUT | `/projects/:id` | Owner/ADMIN |
| DELETE | `/projects/:id` | Owner/ADMIN |
| PATCH | `/projects/:id/archive` | Owner/ADMIN |
| POST | `/projects/:id/members` | Owner/ADMIN |
| DELETE | `/projects/:id/members/:userId` | Owner/ADMIN |
| GET | `/tasks` | Accessible projects; ADMIN sees all |
| POST | `/tasks` | Project access |
| GET | `/tasks/:id` | Project access |
| PUT | `/tasks/:id` | Owner/ADMIN; assigned user can update status only |
| DELETE | `/tasks/:id` | Owner/ADMIN |
| GET | `/dashboard` | Authenticated; scoped to accessible projects |
| GET | `/notifications` | Current user |
| PATCH | `/notifications/:id/read` | Notification recipient |
| PATCH | `/notifications/read-all` | Current user |

## Setup

### Requirements

- Node.js 20+
- npm
- A reachable MongoDB Atlas cluster or local MongoDB database

### Install and Configure

Run from the project root:

```bash
npm install
```

Create local environment files if they do not already exist. On PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

On macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Replace the database URI and secret with your values before starting.

### Environment Variables

Backend (`backend/.env`):

```dotenv
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_at_least_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`MONGODB_URL` is also accepted when `MONGO_URI` is not set.

Frontend (`frontend/.env`):

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Keep real `.env` files and credentials private; `.gitignore` excludes them.

### Run

Start both applications from the root:

```bash
npm run dev
```

Or run each workspace in a separate terminal:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

### Create an ADMIN Account

Set these values in `backend/.env`:

```dotenv
ADMIN_NAME=TaskFlow Admin
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_strong_password
```

Use a password between 8 and 72 characters, then run from the root:

```bash
npm run seed:admin
```

The seed creates an admin or updates the account with the same normalized email. Log in through `/login` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Checks and Build

Run from the project root:

```bash
npm run check
node --test backend/tests/roles.test.js
```

Role tests use isolated in-memory records and do not modify your MongoDB database.

```bash
npm run build   # Frontend output: frontend/dist
npm run start   # Start backend
```

Serve `frontend/dist` with a static host configured for SPA route fallback. `npm run start` starts only the API.

## Project Structure

```text
System_Task_Managment/
|-- backend/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- scripts/seedAdmin.js
|   |-- services/
|   |-- tests/roles.test.js
|   |-- validators/
|   |-- app.js
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- layout/
|   |   |-- pages/
|   |   |-- store/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   `-- vite.config.js
|-- package.json
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml
`-- README.md
```

## Design Decisions

- **Backend authorization:** Permissions are checked against the current database user and project relationships.
- **Validation:** Frontend and backend use Zod; Mongoose enforces database constraints.
- **Optimistic updates:** Task status changes appear immediately and roll back on failure.
- **Server-side queries:** Task search, sorting, filtering, and pagination run on the backend.
- **Derived metrics:** Dashboard totals and overdue state are calculated from current data.

## Known Limitations

- Access tokens expire according to `JWT_EXPIRES_IN` (default: 7 days); there is no refresh-token flow.
- Due-soon notifications are generated when the notifications endpoint is fetched, without a background scheduler.
- Notifications refresh through API requests; there are no WebSocket updates.
- Kanban drag-and-drop, activity history, and file attachments are not implemented.
- Project ownership transfer is not implemented.

## Troubleshooting

- **Connection refused on port 5000:** Ensure the backend is running and MongoDB connected successfully.
- **Missing database URI:** Set `MONGO_URI` or `MONGODB_URL` in `backend/.env`.
- **Port already in use:** Stop the duplicate backend instance before restarting.
- **Database connection failure:** Check the URI, database credentials, network access, and MongoDB Atlas IP access settings.
