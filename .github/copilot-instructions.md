# Copilot Instructions for ESM-v2

## Project Overview
**Employee Management System (ESM-v2)** - A full-stack HR application with JWT auth, Google Calendar integration, and role-based access control.

**Architecture**: Node.js/Express backend (ES modules) + React 18 frontend (Vite + Metronic UI template)  
**Database**: MongoDB with Mongoose ODM  
**Key integrations**: Google OAuth, Google Calendar API, EmailJS, Cron jobs

---

## Critical Architecture Patterns

### Backend Structure (Node.js/Express)
- **Module system**: ES modules (`import/export default`), all files require `.js` extensions in imports
- **Route-Controller-Service pattern**:
  ```
  routes/ → authRoutes.js → authController.js (business logic)
  services/ → googleCalendar.js, cron.js (external integrations)
  models/ → Mongoose schemas with role-based fields
  ```
- **Database connection**: `await connectDB()` in `server.js` (async top-level)
- **CORS config**: Requires `CLIENT_URL` env var for origin (defaults to `"*"`)

### Authentication & Authorization
- **JWT**: Token stored in Authorization header (`Bearer <token>`), expires in 7 days
- **Password hashing**: bcryptjs with salt 10
- **Roles**: CEO, admin, employee, supervisor (supervisor can manage multiple departments via array)
- **Protect middleware**: Validates token, populates user + department_id via `.populate('department_id')`
- **Invite tokens**: `CEO_INVITE_TOKEN`, `ADMIN_INVITE_TOKEN` env vars control role assignment on registration

### Data Models
- **User**: Fields include `user_email`, `password`, `role`, `department_id` (array), `leave_days` (default 15), status
- **Department**: Simple name + timestamps
- **Multi-language support**: User schema has `first_name_en`, `last_name_en`, `nickname_en` fields (Thai also supported)
- **Key fields**: All IDs are MongoDB ObjectId references

### Google Integration
- **GoogleCalendarService class**: Singleton pattern with OAuth2Client initialization
- **Credentials required**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- **Error handling**: Validates credentials on init, logs with emoji indicators (✅ ❌)

---

## Frontend Architecture (React + Vite)

### Stack & Configuration
- **React 18** with TypeScript (tsx files)
- **Vite build tool**: Config in `vite.config.ts` with `@` alias to `src/`, base path `/metronic8/react/demo7/`
- **Metronic UI template**: Complete dashboard template with pre-built components
- **HTTP client**: Axios with request interceptors setup in `AuthProvider`
- **State management**: React Query (QueryClient), local Auth context
- **Styling**: SCSS modules from `_metronic/assets/sass/`, supports dark mode

### API Integration
- **API base URL**: `VITE_APP_API_URL` env var (fallback: `http://localhost:8000/api`)
- **Endpoints**: Auth (`/auth`), Users (`/users`), Departments (`/departments`), Holidays (`/holidays`), Google (`/google`)
- **Auth flow**: Login → JWT token → stored in Auth context → injected in axios headers

### Component Organization
```
src/app/
  modules/ → auth, profile, accounts (feature-based)
  pages/ → dashboard, profiles, layout builder
  routing/ → AppRoutes.tsx (role-based route guards)
src/_metronic/ → layout templates, UI components, i18n
```

---

## Essential Development Workflows

### Backend Setup & Running
```bash
cd backend
npm install
# Create .env: MONGO_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, CLIENT_URL
npm run dev          # nodemon (auto-reload)
npm start            # production
# Server runs on http://localhost:8000/api
```

### Frontend Setup & Running
```bash
cd frontend
npm install
# Create .env.local: VITE_APP_API_URL=http://localhost:8000/api
npm run dev          # Vite dev server
npm run build        # TypeScript + Vite build
npm run lint         # ESLint with max-warnings 0 (strict)
# Dev server typically on http://localhost:5173
```

### Key Environment Variables
- **Backend**: `MONGO_URL`, `JWT_SECRET`, `GOOGLE_*`, `CLIENT_URL`, `CEO_INVITE_TOKEN`, `ADMIN_INVITE_TOKEN`
- **Frontend**: `VITE_APP_API_URL`

### Testing Authentication
- Use `test-google-auth.js` in backend root for OAuth flow testing
- Verify token via `/api/auth/verify` endpoint (returns user profile with `_id`, `user_name`, `user_email`, `role`, `leave_days`)

---

## Code Conventions & Patterns

### Backend Patterns
1. **Error handling**: Use try-catch in async routes, return `{ message: "...", error: error.message }` on 500
2. **Logging**: Emoji indicators (✅ success, ❌ error, 🔄 processing, 📋 info)
3. **Async operations**: Always `await` db calls, use async/await over callbacks
4. **Route guards**: Apply `protect` middleware to all authenticated routes before controller
5. **Timestamps**: Use Mongoose `{ timestamps: true }` for created_at/updated_at

### Frontend Patterns
1. **Components**: Functional components with hooks; use `useAuth()` for logged-in user
2. **Routing**: React Router v6 with `<Outlet />` for nested layouts
3. **Forms**: Formik + validation (see auth modules for examples)
4. **API calls**: Wrap in React Query mutations/queries for caching and retry logic
5. **Dark mode**: Components should use `useThemeMode()` from `_metronic/partials`

### File Naming
- Backend: `camelCase.js` (routes, controllers, models, services)
- Frontend: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- Constants/enums: `UPPER_CASE`

---

## Common Integration Points

### Backend-to-Frontend Communication
- **Auth**: User logs in → backend returns JWT + user profile → frontend stores in Auth context
- **Protected routes**: Frontend includes JWT in `Authorization: Bearer <token>` header
- **Error responses**: Check `res.status` (401 = auth failed, 400 = validation, 500 = server error)

### Google Calendar Integration
- **Flow**: User authenticates with Google → backend receives auth code → creates OAuth tokens → saves to DB
- **Endpoints**: `/api/google/*` routes handle auth callback and sync operations
- **Service**: `GoogleCalendarService` in `services/googleCalendar.js` manages API calls

### Cron Jobs
- **Located in**: `services/cron.js`
- **Import pattern**: `import cronService from './services/cron.js'` in `server.js`
- **Use case**: Automated leave day resets, holiday syncs (implied by service existence)

---

## Debugging Tips

1. **Backend issues**: Check logs with emoji indicators; enable `console.log` on credentials validation
2. **Auth failures**: Verify JWT_SECRET matches between env vars; check token expiry (7 days)
3. **CORS errors**: Ensure `CLIENT_URL` env var includes correct origin with protocol + port
4. **Google OAuth**: Confirm `GOOGLE_REDIRECT_URI` matches Google Console settings exactly
5. **Frontend API calls**: Check `VITE_APP_API_URL` in browser console via `import.meta.env`

---

## Key Files & References

| File | Purpose |
|------|---------|
| [backend/server.js](../backend/server.js) | Entry point, route mounting, middleware setup |
| [backend/config/db.js](../backend/config/db.js) | MongoDB connection with error handling |
| [backend/middlewares/authMiddleware.js](../backend/middlewares/authMiddleware.js) | JWT validation & user population |
| [backend/controller/authController.js](../backend/controller/authController.js) | Login, register, token generation |
| [backend/models/User.js](../backend/models/User.js) | User schema with roles, departments, i18n fields |
| [backend/services/googleCalendar.js](../backend/services/googleCalendar.js) | Google API client initialization & methods |
| [frontend/src/main.tsx](../frontend/src/main.tsx) | App initialization, Axios setup, providers |
| [frontend/src/app/App.tsx](../frontend/src/app/App.tsx) | Root component with layout providers |
| [frontend/src/app/modules/auth](../frontend/src/app/modules/auth) | Auth context, login form, token management |
| [frontend/vite.config.ts](../frontend/vite.config.ts) | Build config, aliases, base path |

---

## When Adding Features

- **New backend endpoint**: Create route in `routes/`, controller in `controller/`, apply `protect` middleware if needed
- **New frontend page**: Create component in `modules/` or `pages/`, add route in `AppRoutes.tsx`, use Metronic layout components
- **Database schema change**: Update Mongoose model, add migration notes to comments (no migration framework detected)
- **New role/permission**: Update User schema enum, add checks in controllers via `req.user.role`

