Below is the updated `todo.md` file for the Resume Screener Web App, reflecting the changes from the original `prompt_plan.md` to use **Prisma** instead of TypeORM for the backend and **Vite with React** instead of Create React App for the frontend. The checklist has been revised to align with these new technologies while maintaining the incremental, full-stack development approach outlined in the original TODO list.

---

# Resume Screener Web App - TODO Checklist

## Iteration 1: Setup & Authentication

### Backend Setup

- [ ] Initialize Node.js project with Express.js and TypeScript
- [ ] Install dependencies: `express`, `typescript`, `@prisma/client`, `prisma`, `ts-node`, `@types/express`
- [ ] Set up Prisma with `npx prisma init`, configure database URL in `.env` (e.g., `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME`)
- [ ] Define `User` model in `prisma/schema.prisma` with fields: `id` (uuid, primary key), `email` (string, unique), `passwordHash` (string), `createdAt` (datetime)
- [ ] Run `npx prisma migrate dev --name init` to create initial migration and apply schema to database
- [ ] Configure TypeScript with `tsconfig.json` (target: ES6, module: commonjs, strict: true)
- [ ] Create basic Express server in `src/index.ts` with GET `/health` endpoint returning `{ status: "Server is running" }` (200 status)
- [ ] Set up `.env` file with `dotenv` for environment variables (PORT, DATABASE_URL)
- [ ] Create `src/prisma/client.ts` with `import { PrismaClient } from '@prisma/client'; export const prisma = new PrismaClient();`
- [ ] Import Prisma client in `src/index.ts` to initialize with the server
- [ ] Start server with script in `package.json` using `ts-node` (e.g., `"start": "ts-node src/index.ts"`)

### User Authentication Backend

- [ ] Install dependencies: `bcrypt`, `jsonwebtoken`, `@types/bcrypt`, `@types/jsonwebtoken`
- [ ] Add POST `/register` endpoint in `src/routes/auth.ts`
  - [ ] Validate email format and password length (min 8 characters)
  - [ ] Hash password with `bcrypt` (salt rounds: 10)
  - [ ] Check if email already exists using Prisma's `prisma.user.findUnique({ where: { email } })`
  - [ ] Create new user with `prisma.user.create` if email is unique
- [ ] Add POST `/login` endpoint in `src/routes/auth.ts`
  - [ ] Find user by email with `prisma.user.findUnique({ where: { email } })`
  - [ ] Verify password with `bcrypt`
  - [ ] Generate JWT token with `{ id, email }` payload, signed with `JWT_SECRET` from `.env`, expires in 1h
- [ ] Handle errors with appropriate status codes (400 for invalid input, 409 for duplicate email, 401 for invalid credentials)
- [ ] Register auth routes in `src/index.ts` using Express router

### Frontend Setup

- [ ] Create React application with Vite using `npm create vite@latest my-app -- --template react-ts`
- [ ] Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom`
- [ ] Initialize Tailwind CSS with `npx tailwindcss init -p` to generate `tailwind.config.js` and `postcss.config.js`
- [ ] Update `src/index.css` with Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`)
- [ ] Set up React Router in `src/main.tsx`, wrapping the `App` component with `BrowserRouter`
- [ ] Replace `src/App.tsx` with a basic component displaying a "Resume Screener" heading styled with Tailwind (e.g., `text-2xl`, `font-bold`, `text-center`, `mt-4`)
- [ ] Create `src/pages/Login.tsx` and `src/pages/Register.tsx` with simple forms (email and password inputs, submit button), styled with Tailwind (e.g., `flex`, `flex-col`, `max-w-md`, `mx-auto`, `p-4`, `bg-gray-100`, `rounded`)
- [ ] Define routes in `src/App.tsx` for `/login` and `/register`, rendering the respective components

### Frontend Authentication

- [ ] Install `axios`
- [ ] Create `src/services/api.ts` with base URL from `VITE_API_URL` (e.g., `http://localhost:3000`) using a `.env` file (prefix variables with `VITE_`, e.g., `VITE_API_URL`)
- [ ] Add `register` and `login` functions in `api.ts` that send POST requests to `/register` and `/login`
- [ ] Update `src/pages/Register.tsx` to call `register` function on form submit
  - [ ] Display success ("Registered!") or error messages (e.g., "Email already exists") with Tailwind-styled text (e.g., `text-green-500` or `text-red-500`)
- [ ] Update `src/pages/Login.tsx` to call `login` function on form submit
  - [ ] Store JWT token in `localStorage` on success
  - [ ] Redirect to `/dashboard`
  - [ ] Handle errors with user-friendly messages
- [ ] Add placeholder `Dashboard` component in `src/pages/Dashboard.tsx` with a "Welcome" message
- [ ] Create auth context in `src/context/AuthContext.tsx` to manage logged-in state (`isAuthenticated`, `token`, `login`/`logout` functions)
- [ ] Wrap the app in `src/main.tsx` with `AuthContext.Provider`

## Iteration 2: Session Creation

### Backend: Session Model and API

- [ ] Add `Session` model to `prisma/schema.prisma` with fields: `id` (uuid, primary key), `userId` (uuid, references `User.id`), `jobDescription` (string), `createdAt` (datetime), `updatedAt` (datetime)
- [ ] Run `npx prisma migrate dev --name add_session` to apply schema changes
- [ ] Add POST `/sessions` endpoint in `src/routes/sessions.ts`
  - [ ] Require JWT authentication by verifying token from `Authorization` header (Bearer <token>)
  - [ ] Extract `userId` from decoded token
  - [ ] Accept `{ jobDescription }` in request body
  - [ ] Create new session with `prisma.session.create`
  - [ ] Return `{ sessionId }` on success (201 status)
- [ ] Register sessions route in `src/index.ts`

### Frontend: Session Creation Interface

- [ ] Update `src/pages/Dashboard.tsx` to display a "Create Session" button
- [ ] On button click, show a form with a `jobDescription` textarea, styled with Tailwind (e.g., `w-full`, `p-2`, `border`)
- [ ] On form submit, call `createSession` function in `src/services/api.ts`
  - [ ] Send POST request to `/sessions` with `jobDescription` and JWT token in headers
- [ ] On success, redirect to `/sessions/:sessionId`
- [ ] Add placeholder `SessionDetails` component in `src/pages/SessionDetails.tsx` with `sessionId` from `useParams` (via `react-router-dom`)
- [ ] Update `src/App.tsx` with new route for `/sessions/:sessionId`

## Iteration 3: Single Resume Upload

### Backend: Resume Upload and Processing

- [ ] Install `multer`, `pdf-parse`, `mammoth`, `uuid`
- [ ] Add `Candidate` model to `prisma/schema.prisma` with fields: `id` (uuid, primary key), `sessionId` (uuid, references `Session.id`), `createdAt` (datetime)
- [ ] Add `Resume` model to `prisma/schema.prisma` with fields: `id` (uuid, primary key), `candidateId` (uuid, references `Candidate.id`), `filePath` (string), `extractedText` (string?), `status` (string, default: "processed"), `createdAt` (datetime)
- [ ] Run `npx prisma migrate dev --name add_candidate_resume` to apply schema changes
- [ ] Add POST `/sessions/:sessionId/resumes` endpoint in `src/routes/resumes.ts`
  - [ ] Require JWT authentication
  - [ ] Configure `multer` to save files to `uploads/` directory with filename `<uuid>.<extension>`
  - [ ] Validate file type (PDF or DOCX)
  - [ ] Extract text using `pdf-parse` for PDF, `mammoth` for DOCX
  - [ ] Create `Candidate` record with `sessionId` using `prisma.candidate.create`
  - [ ] Create `Resume` record with `extractedText` and `status` ("processed" if text exists, "review_needed" if empty/fails) using `prisma.resume.create`
  - [ ] Return `{ resumeId, extractedText, status }` (200 status)
- [ ] Register resumes route in `src/index.ts`

### Frontend: Upload Interface

- [ ] In `src/pages/SessionDetails.tsx`, add file input (`accept=".pdf,.docx"`) and submit button, styled with Tailwind (e.g., `mt-4`, `p-2`, `border`)
- [ ] On submit, create `FormData` with file and send POST request to `/sessions/:sessionId/resumes` with JWT token in headers via `src/services/api.ts`
- [ ] On success, display `extractedText` in a div (e.g., `p-4`, `bg-white`, `border`) if `status` is "processed", or a "Review needed" message if "review_needed"

## Iteration 4: Bulk Upload & Async Processing

### Backend: Bulk Upload and Job Queue

- [ ] Install `bull`, `@types/bull`
- [ ] Set up Redis connection using `REDIS_URL` from `.env`
- [ ] Update POST `/sessions/:sessionId/resumes` to handle multiple files
  - [ ] Accept array of files in `multer` with `upload.array('files')`
  - [ ] For each file, add a job to the Bull queue for processing
  - [ ] Return `{ jobIds }` immediately (202 status)
- [ ] Create a queue processor in `src/queue/resumeProcessor.ts`
  - [ ] Process each job: extract text, create `Candidate` and `Resume` records with Prisma
  - [ ] Update job progress and handle errors
- [ ] Add GET `/sessions/:sessionId/resumes/status` endpoint to check processing status using Bull queue data

### Frontend: Bulk Upload UI

- [ ] Update file input in `SessionDetails.tsx` to allow multiple files (`multiple` attribute)
- [ ] On submit, send multiple files in `FormData` via `src/services/api.ts`
- [ ] Display progress indicators for each file (e.g., "Processing", "Completed", "Error") using Tailwind classes (e.g., `text-yellow-500`, `text-green-500`, `text-red-500`)
- [ ] Poll GET `/sessions/:sessionId/resumes/status` for updates and reflect status in UI

## Iteration 5: Manual Correction

### Backend: Update Extracted Text

- [ ] Add PATCH `/resumes/:resumeId` endpoint in `src/routes/resumes.ts`
  - [ ] Require JWT authentication
  - [ ] Accept `{ extractedText }` in request body
  - [ ] Update `Resume` record with `prisma.resume.update`, setting `extractedText` and `status` to "processed"
  - [ ] Return updated resume data (200 status)

### Frontend: Correction Interface

- [ ] In `SessionDetails.tsx`, for resumes with "review_needed", display side-by-side view: original file (iframe for PDF) and editable textarea for `extractedText`
- [ ] Add "Save" button to send PATCH request to `/resumes/:resumeId` with updated `extractedText` via `src/services/api.ts`
- [ ] On success, update UI to reflect "processed" status

## Iteration 6: Basic Evaluation

### Backend: Evaluation Metrics

- [ ] Define evaluation metrics logic (e.g., keyword matching, work experience relevance, skills relevance, education, years of experience)
- [ ] Add evaluation function that calculates scores based on `jobDescription` (from `Session`) and `extractedText` (from `Resume`)
- [ ] Add `Evaluation` model to `prisma/schema.prisma` linked to `Candidate`, storing scores
- [ ] Run `npx prisma migrate dev --name add_evaluation` to apply changes
- [ ] Update endpoint to store evaluation results with `prisma.evaluation.create`

### Frontend: Display Rankings and Scores

- [ ] Add a ranked list of candidates in `SessionDetails.tsx` based on evaluation scores
- [ ] Display individual scores for each metric in a table or list, styled with Tailwind
- [ ] Allow clicking on a candidate to view detailed evaluation in a modal or new view

## Iteration 7: LLM Integration

### Backend: Integrate OpenAI GPT

- [ ] Install `openai` package
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Extend evaluation function to include custom prompt scoring via GPT API
- [ ] Handle API errors with retry logic (exponential backoff)

### Frontend: Custom Prompt Input

- [ ] Add input field for custom prompts in `SessionDetails.tsx`, styled with Tailwind
- [ ] Update evaluation by sending prompt to backend on change and refresh rankings

## Iteration 8: Dynamic Weights & Updates

### Backend: Dynamic Weight Calculation

- [ ] Update evaluation endpoint to accept weights in request body
- [ ] Modify evaluation logic to use dynamic weights for scoring

### Frontend: Weight Sliders

- [ ] Add sliders for each metric weight in `SessionDetails.tsx` using a library like `rc-slider` or HTML range input
- [ ] Update rankings in real-time as weights change by calling evaluation endpoint

## Iteration 9: Visualizations

### Frontend: Interactive Charts

- [ ] Install charting library (e.g., `recharts`)
- [ ] Implement radar chart for candidate metrics in `SessionDetails.tsx`
- [ ] Add toggleable bar chart, heatmap, etc., with Tailwind styling
- [ ] Implement export features for charts (PNG) and data (CSV) using libraries like `html2canvas` and `papaparse`

## Iteration 10: Session Management

### Backend: Save and Re-run Sessions

- [ ] Ensure session state (job description, resumes, evaluations) is saved via Prisma models
- [ ] Add endpoint to re-run evaluations with updated criteria (e.g., new weights or prompts)

### Frontend: Session Management UI

- [ ] Display list of saved sessions in `Dashboard.tsx` fetched from backend
- [ ] Allow selecting a session to view or re-run, redirecting to `SessionDetails.tsx`

---

This updated `todo.md` incorporates the switch to **Prisma** and **Vite with React**, ensuring all tasks reflect the new setup while maintaining the original structure and intent. Key changes include:

- Replacing TypeORM with Prisma for database operations (e.g., schema definitions in `prisma/schema.prisma`, migrations with `prisma migrate dev`).
- Switching from Create React App to Vite, updating frontend setup and environment variable handling (e.g., `VITE_` prefix).
- Adjusting instructions to match the new tools (e.g., Vite's `npm run dev` vs. Create React App's `npm start`, Prisma's query methods vs. TypeORM entities).
