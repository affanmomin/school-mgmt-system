# 01 — README Skill Test Tasks

The README's **🎯 Skill Test Problems** section defines two challenges. This document covers what each one was, the root cause, the fix, and how to verify it. The fixes land as two commits: `fix(notice): bind description field in Add Notice form` and `feat(students): implement CRUD controller handlers`.

---

## 1. Frontend — Fix "Add New Notice"

**Stated problem (README, Frontend Developer Challenge):**

> When clicking the 'Save' button, the 'description' field doesn't get saved.

### Root cause

The Add Notice form was silently dropping the description on submit. There were two places in the frontend that diverged from the rest of the codebase:

| File | Line | Issue |
|---|---|---|
| `frontend/src/domains/notice/pages/add-notice-page.tsx` | `initialState` (~line 17–24) | `content: ''` instead of `description: ''` |
| `frontend/src/domains/notice/components/notice-form.tsx` | The Description `<TextField>` (~line 88–100) | `register('content')` instead of `register('description')` |

Everything else in the system was already aligned on `description`:

- The Zod schema (`frontend/src/domains/notice/types/notice-schema.ts`) declares `description: z.string().min(1, 'Description is required')`.
- The shared form's `helperText` already referenced `errors.description` — only the registered field name was wrong.
- `frontend/src/domains/notice/pages/edit-notice-page.tsx` already used `description` correctly throughout.
- The backend persists a `description` column (`backend/src/modules/notices/notices-repository.js`).

The `useForm<NoticeFormProps>` generic should have caught this at compile time, but `defaultValues` on `react-hook-form` is loosely typed (excess properties not rejected, missing properties not required), so the bug compiled. As a result:

1. RHF initialised the form with `{ content: '' }` and no `description` key.
2. The textarea was bound to a phantom `content` field; user keystrokes updated `content`, never `description`.
3. On submit, `description` was `undefined`, the API received `{ title, content, status, ... }`, and the backend (which only knows `description`) silently dropped the value.

### Fix

Renamed the two outliers to use `description`. No schema, API, or edit-page change was needed — the fix simply realigned the Add page with the canonical name everywhere else.

**Why this direction (rename `content` → `description`, not the other way):** every other touch point (DB column, repository, service, schema, edit page, form helperText) already uses `description`. The two `content` references were the only outliers. Going the other way would require changes across SQL, repository, schema, and the edit page — much larger blast radius for no benefit.

### Verification

1. Log in to the frontend at `http://localhost:5173`.
2. Navigate to `/app/notices/add`.
3. Fill in title, description, and a status; submit.
4. Confirm the toast says the notice was added.
5. Open the notice list / detail page — the description is persisted and visible.

A reviewer can also confirm via DevTools → Network → the `POST /api/v1/notices` request body now contains `description`.

---

## 2. Backend — Implement Student CRUD

**Stated problem (README, Backend Developer Challenge):**

> Implement missing CRUD operations for student management in `/src/modules/students/students-controller.js`.

### Root cause

`backend/src/modules/students/students-controller.js` shipped with five empty handler stubs (`//write your code` comments). The service layer (`students-service.js`) and repository (`students-repository.js`) were already complete, including the `student_add_update` Postgres stored procedure that handles upsert via the `userId` field in the JSON payload.

### Fix

Wired each handler to its existing service function, mirroring the `staffs-controller.js` convention so the module stays consistent with the rest of the codebase.

| Route | Handler | Behaviour |
|---|---|---|
| `GET /api/v1/students` | `handleGetAllStudents` | Forwards `{ name, className, section, roll }` from `req.query` to `getAllStudents`. Returns `{ students }`. |
| `POST /api/v1/students` | `handleAddStudent` | Passes `req.body` to `addNewStudent`. Returns the service's success message. |
| `GET /api/v1/students/:id` | `handleGetStudentDetail` | Passes `req.params.id` to `getStudentDetail`. Returns the student record. |
| `PUT /api/v1/students/:id` | `handleUpdateStudent` | Merges `req.params.id` as `userId` into the body before calling `updateStudent`. The `student_add_update` SP keys off `userId` to decide insert vs update. |
| `POST /api/v1/students/:id/status` | `handleStudentStatus` | Combines target user (`req.params.id`), reviewer (`req.user.id` from `authenticate-token` middleware), and `req.body.status` before calling `setStudentStatus`. |

Errors propagate through `express-async-handler` + the existing global error middleware. No try/catch is added inside the controller — that matches the pattern used by every other resource module.

### Verification

A live smoke test against the running backend (replace cookies / CSRF as needed):

```bash
# 1. Authenticate
curl -s -c cookies.txt -X POST http://localhost:5007/api/v1/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@school-admin.com","password":"3OU4zn3q6Zh9"}'

CSRF=$(grep csrfToken cookies.txt | awk '{print $7}')

# 2. Create
curl -s -b cookies.txt -H "x-csrf-token: $CSRF" -H "Content-Type: application/json" \
  -X POST http://localhost:5007/api/v1/students \
  -d '{"name":"Jane Test","email":"jane@example.com","gender":"Female","phone":"123","dob":"2010-01-01","admissionDt":"2024-09-01","className":"One","sectionName":"A","roll":"1"}'
# -> {"message":"Student added ..."}

# 3. List
curl -s -b cookies.txt -H "x-csrf-token: $CSRF" \
  http://localhost:5007/api/v1/students
# -> {"students":[{"id":2,"name":"Jane Test", ...}]}

# 4. Detail
curl -s -b cookies.txt -H "x-csrf-token: $CSRF" \
  http://localhost:5007/api/v1/students/2

# 5. Update (PUT) and 6. Status (POST /:id/status) follow the same pattern.
```

Verified during development against a live Supabase Postgres instance.

---

## Files changed

```
frontend/src/domains/notice/pages/add-notice-page.tsx
frontend/src/domains/notice/components/notice-form.tsx
backend/src/modules/students/students-controller.js
```

Two commits in history:
- `fix(notice): bind description field in Add Notice form`
- `feat(students): implement CRUD controller handlers`
