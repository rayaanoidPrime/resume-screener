## Detailed Step-by-Step Blueprint

### Project Overview

The Resume Screener Web App is a full-stack application designed for recruiters to upload, process, evaluate, and rank candidate resumes against job descriptions. It features a **Vite/React/TypeScript/Tailwind CSS** frontend, a **Node.js/Express.js/TypeScript** backend with **PostgreSQL** and **Prisma**, asynchronous processing with a job queue (Bull/Redis), and integration with OpenAI’s GPT for custom prompts.

### Major Components

1. **User Authentication**: Email/password login for recruiters.
2. **Resume Upload & Processing**: Supports PDF/DOCX uploads, text extraction, and manual correction.
3. **Candidate Evaluation & Ranking**: Multi-metric scoring with adjustable weights and LLM prompts.
4. **Candidate Profiles & Visualizations**: Detailed views with interactive charts.
5. **Session Management**: Save and manage screening sessions.
6. **Backend Infrastructure**: Asynchronous processing, database storage, and LLM integration.

### Development Strategy

- **Incremental Full-Stack Approach**: Build each feature with both backend and frontend components, ensuring functionality at every step.
- **MVP Focus**: Start with a minimal viable product (login, single resume upload, basic display) and expand iteratively.
- **Best Practices**: Use TypeScript for type safety, modular code, environment variables, and error handling.

### High-Level Iterations

1. **Setup & Authentication**: Establish the project structure, backend server, database, and user login.
2. **Session Creation**: Enable recruiters to create screening sessions.
3. **Single Resume Upload**: Implement basic upload and text extraction.
4. **Bulk Upload & Async Processing**: Extend to handle multiple resumes with a job queue.
5. **Manual Correction**: Add text editing capabilities.
6. **Basic Evaluation**: Implement core metrics without LLM.
7. **LLM Integration**: Add custom prompts via OpenAI GPT.
8. **Dynamic Weights & Updates**: Enable real-time ranking adjustments.
9. **Visualizations**: Add interactive charts and export features.
10. **Session Management**: Finalize saving and re-running sessions.

---

## Iterative Chunks Breakdown

### Iteration 1: Setup & Authentication

- **Goal**: Establish the foundation and enable user login.
- **Sub-Steps**:
  - Set up backend server with Express.js, TypeScript, and PostgreSQL using Prisma.
  - Implement user registration and login with JWT.
  - Set up frontend with Vite, React, TypeScript, and Tailwind CSS.
  - Connect frontend to backend for authentication.

### Iteration 2: Session Creation

- **Goal**: Allow users to create screening sessions.
- **Sub-Steps**:
  - Backend: Define Session model in Prisma and API for creation.
  - Frontend: Add session creation interface and dashboard.

### Iteration 3: Single Resume Upload

- **Goal**: Enable uploading and processing one resume.
- **Sub-Steps**:
  - Backend: Define Candidate/Resume models in Prisma and upload API with text extraction.
  - Frontend: Add upload interface and display extracted text.

### Iteration 4: Bulk Upload & Async Processing

- **Goal**: Handle multiple resumes with background processing.
- **Sub-Steps**:
  - Backend: Extend upload API for multiple files, add Bull/Redis job queue.
  - Frontend: Update UI with progress indicators.

### Iteration 5: Manual Correction

- **Goal**: Allow editing of extracted text.
- **Sub-Steps**:
  - Backend: Add API for updating extracted text.
  - Frontend: Implement side-by-side correction view.

### Iteration 6: Basic Evaluation

- **Goal**: Score candidates with basic metrics.
- **Sub-Steps**:
  - Backend: Implement keyword matching and other metrics.
  - Frontend: Display ranked list and scores.

### Iteration 7: LLM Integration

- **Goal**: Add custom prompts via OpenAI GPT.
- **Sub-Steps**:
  - Backend: Integrate OpenAI API for prompt scoring.
  - Frontend: Add prompt input and update rankings.

### Iteration 8: Dynamic Weights & Updates

- **Goal**: Enable real-time weight adjustments.
- **Sub-Steps**:
  - Backend: Update evaluation logic for dynamic weights.
  - Frontend: Add sliders and real-time ranking updates.

### Iteration 9: Visualizations

- **Goal**: Provide interactive charts.
- **Sub-Steps**:
  - Frontend: Implement radar charts, bar charts, etc., with interactivity and exports.

### Iteration 10: Session Management

- **Goal**: Save and manage sessions.
- **Sub-Steps**:
  - Backend: Add session saving and re-run capabilities.
  - Frontend: Update UI for session management.

---

## Refining Steps for Right-Sizing

Iteration 1 (Setup & Authentication) is broad, so it’s broken into smaller, safer steps for a code-generation LLM:

### Refined Steps for Iteration 1

1. **Backend Setup**: Initialize server and database with Prisma.
2. **User Authentication Backend**: Add registration/login APIs.
3. **Frontend Setup**: Initialize Vite/React app with Tailwind CSS.
4. **Frontend Authentication**: Connect to backend APIs.

### Validation

- **Size**: Each step is focused (e.g., backend setup vs. authentication logic), reducing complexity per prompt.
- **Progress**: Completing these yields a functional authentication flow.
- **Integration**: Steps build sequentially, wiring backend to frontend.

This granularity is applied consistently across iterations in the prompts below.

---

## Series of Prompts for Code-Generation LLM

Below are updated prompts for Iteration 1 and parts of Iteration 2, reflecting the switch to **Prisma** and **Vite with React** (using ESBuild as the bundler). Each prompt builds incrementally and integrates components.

### Prompt 1: Backend Setup with Express.js, TypeScript, and Prisma

```text
Set up a new Node.js project with Express.js and TypeScript. Install dependencies: express, typescript, @prisma/client, prisma, ts-node, and @types/express. Initialize Prisma with `npx prisma init`, setting the database URL in the .env file (e.g., postgresql://USER:PASSWORD@HOST:PORT/DB_NAME). Define the User model in prisma/schema.prisma with fields: id (uuid, primary key), email (string, unique), passwordHash (string), createdAt (datetime). Run `npx prisma migrate dev --name init` to create the initial migration. Configure TypeScript with a tsconfig.json file (target: ES6, module: commonjs, strict: true). Create a basic Express server in src/index.ts that listens on a port from an environment variable (default 3000) and includes a GET /health endpoint returning { status: "Server is running" } with a 200 status. Use a .env file with dotenv to manage environment variables (PORT, DATABASE_URL). Create src/prisma/client.ts with `import { PrismaClient } from '@prisma/client'; export const prisma = new PrismaClient();`, and import it in src/index.ts to ensure the Prisma client initializes with the server. Start the server with a script in package.json using ts-node.
```

**Context**: Initializes the backend with Express.js, TypeScript, and a PostgreSQL connection via Prisma, including a health check endpoint.

### Prompt 2: User Authentication Backend

```text
In the existing backend project from Prompt 1, add user authentication. Install dependencies: bcrypt, jsonwebtoken, and their types (@types/bcrypt, @types/jsonwebtoken). Add a POST /register endpoint in src/routes/auth.ts that accepts { email, password } in the request body, validates email format and password length (min 8), hashes the password with bcrypt (salt rounds: 10), checks if the email exists using Prisma's findUnique method on the User model, and if not, creates a new user with Prisma's create method. Add a POST /login endpoint that accepts { email, password }, finds the user by email with Prisma, verifies the password with bcrypt, and if valid, generates a JWT token with { id, email } payload, signed with a secret from the .env file (JWT_SECRET), expiring in 1h. Return { token } on success. Handle errors with appropriate status codes (400 for invalid input, 409 for duplicate email, 401 for invalid credentials). Register the routes in src/index.ts using an Express router. Import the Prisma client from src/prisma/client.ts for database operations.
```

**Context**: Builds on Prompt 1 by adding secure authentication APIs using Prisma for database interactions.

### Prompt 3: Frontend Setup with Vite, React, TypeScript, and Tailwind CSS

```text
Create a new React application using Vite with the command `npm create vite@latest my-app -- --template react-ts`. Navigate into the project directory and install dependencies: tailwindcss, postcss, autoprefixer, and react-router-dom. Initialize Tailwind CSS by running `npx tailwindcss init -p`, which generates tailwind.config.js and postcss.config.js. Update src/index.css with Tailwind directives (@tailwind base, components, utilities). Set up React Router in src/main.tsx, wrapping the App component with BrowserRouter. Replace src/App.tsx with a basic component displaying a "Resume Screener" heading styled with Tailwind (e.g., text-2xl, font-bold, text-center, mt-4). Create src/pages/Login.tsx and src/pages/Register.tsx with simple forms (email and password inputs, submit button), styled with Tailwind (e.g., flex, flex-col, max-w-md, mx-auto, p-4, bg-gray-100, rounded). Define routes in src/App.tsx for /login and /register, rendering the respective components.
```

**Context**: Sets up the frontend with Vite (using ESBuild as the bundler), React, TypeScript, and Tailwind CSS, including basic routing and UI.

### Prompt 4: Frontend Authentication

```text
In the frontend project from Prompt 3, connect to the backend authentication APIs from Prompt 2. Install axios. Create src/services/api.ts with a base URL from an environment variable (VITE_API_URL, e.g., http://localhost:3000) using a .env file (prefix variables with VITE_ as per Vite's convention). Add register and login functions that send POST requests to /register and /login with { email, password }. In src/pages/Register.tsx, update the form to call the register function on submit, storing the response in local state and displaying success ("Registered!") or error messages (e.g., "Email already exists") with Tailwind-styled text (text-green-500 or text-red-500). In src/pages/Login.tsx, update the form to call the login function, storing the JWT token in localStorage on success and redirecting to a /dashboard route (add a placeholder Dashboard component in src/pages/Dashboard.tsx with a "Welcome" message). Handle errors with user-friendly messages. Add a simple auth context in src/context/AuthContext.tsx to manage logged-in state (isAuthenticated, token, login/logout functions), wrapping the app in src/main.tsx with the AuthContext.Provider.
```

**Context**: Integrates the frontend with the backend APIs from Prompt 2, completing the authentication flow using Vite’s environment variable system.

### Prompt 5: Session Creation

```text
Backend: In the backend from Prompt 2, add the Session model to prisma/schema.prisma with fields: id (uuid, primary key), userId (uuid, references User.id), jobDescription (string), createdAt (datetime), updatedAt (datetime). Run `npx prisma migrate dev --name add_session` to apply the changes. Add a POST /sessions endpoint in src/routes/sessions.ts that requires authentication by verifying the JWT token from the Authorization header (Bearer <token>) using jsonwebtoken. Extract userId from the token, accept { jobDescription } in the request body, and create a new session with Prisma's create method. Return { sessionId } on success (201 status). Register the route in src/index.ts.

Frontend: In the frontend from Prompt 4, update src/pages/Dashboard.tsx to display a "Create Session" button. On click, show a form with a jobDescription textarea, styled with Tailwind (e.g., w-full, p-2, border). On submit, call a new createSession function in src/services/api.ts that sends a POST request to /sessions with the jobDescription and JWT token in headers. On success, redirect to /sessions/:sessionId (add a placeholder SessionDetails component in src/pages/SessionDetails.tsx with the sessionId from useParams). Update src/App.tsx with the new route. Use the auth context from src/context/AuthContext.tsx to include the token in API requests.
```

**Context**: Extends Prompt 4 by adding session creation, fully integrated between backend (Prisma) and frontend (Vite/React).

### Prompt 6: Single Resume Upload

```text
Backend: In the backend from Prompt 5, install multer, pdf-parse, and mammoth for file handling and text extraction. Add the Candidate and Resume models to prisma/schema.prisma. Candidate: id (uuid, primary key), sessionId (uuid, references Session.id), createdAt (datetime). Resume: id (uuid, primary key), candidateId (uuid, references Candidate.id), filePath (string), extractedText (string?), status (string, default: "processed"), createdAt (datetime). Run `npx prisma migrate dev --name add_candidate_resume` to apply the changes. Add a POST /sessions/:sessionId/resumes endpoint in src/routes/resumes.ts, requiring JWT authentication. Configure multer to save files to an uploads/ directory with a filename like <uuid>.<extension> (use uuid from uuid package). Validate file type (PDF or DOCX), extract text (pdf-parse for PDF, mammoth for DOCX), create a Candidate record with sessionId using Prisma, then create a Resume record with the extracted text and status ("processed" if text exists, "review_needed" if empty/fails). Return { resumeId, extractedText, status } (200 status). Register the route in src/index.ts.

Frontend: In src/pages/SessionDetails.tsx from Prompt 5, add a file input (accept=".pdf,.docx") and submit button, styled with Tailwind. On submit, create a FormData object with the file and send a POST request to /sessions/:sessionId/resumes with the JWT token in headers via src/services/api.ts. On success, display the extractedText in a div (e.g., p-4, bg-white, border) if status is "processed", or a "Review needed" message if "review_needed".
```

**Context**: Builds on Prompt 5 with resume upload functionality, using Prisma for database operations and Vite/React for the frontend.

#### Prompt 7: Bulk Upload & Async Processing

```text
Backend: In the backend from Prompt 6, install `bull` and `@types/bull` for job queue management. Set up a Redis connection using `REDIS_URL` from the `.env` file (e.g., `REDIS_URL=redis://localhost:6379`). Update the POST `/sessions/:sessionId/resumes` endpoint in `src/routes/resumes.ts` to handle multiple files by modifying the `multer` configuration to use `upload.array('files')`. For each uploaded file, generate a unique filename with `uuid`, save it to `uploads/`, and add a job to a Bull queue named 'resume-processing' with the file path, `sessionId`, and other necessary data. Return a 202 status with `{ jobIds }` (an array of job IDs) immediately. Create a new file `src/queue/resumeProcessor.ts` to define the queue processor: import the Bull queue, process each job by extracting text using `pdf-parse` (for PDFs) or `mammoth` (for DOCX), create a `Candidate` record with `sessionId` and a `Resume` record with `extractedText` and `status` ("processed" or "review_needed") using Prisma, update job progress (e.g., 50% after extraction, 100% after database save), and handle errors by marking the job as failed. Add a GET `/sessions/:sessionId/resumes/status` endpoint that accepts query parameters for job IDs (e.g., `?jobIds=id1,id2`) and returns their statuses from the Bull queue (e.g., `{ jobId: status }` where status can be "waiting", "active", "completed", "failed").

Frontend: In the frontend from Prompt 6, update the file input in `src/pages/SessionDetails.tsx` to allow multiple files by adding the `multiple` attribute (`<input type="file" accept=".pdf,.docx" multiple />`). On form submit, create a `FormData` object with all selected files and send a POST request to `/sessions/:sessionId/resumes` with the JWT token in headers via `src/services/api.ts`. Upon receiving the response with `{ jobIds }`, display a list of uploaded files with an initial status of "Processing" using Tailwind classes (e.g., `text-yellow-500`, `flex`, `gap-2`). Implement a polling mechanism using `setInterval` (e.g., every 2 seconds) to call GET `/sessions/:sessionId/resumes/status` with the `jobIds`, updating the UI with the latest statuses: "Completed" (`text-green-500`) or "Error" (`text-red-500`). Clear the interval when all jobs are completed or failed.
```

**Context**: Extends the single resume upload from Prompt 6 to handle multiple files asynchronously using a Bull/Redis job queue, with real-time status updates in the UI.

---

#### Prompt 8: Manual Correction

```text
Backend: In the backend from Prompt 7, add a PATCH `/resumes/:resumeId` endpoint in `src/routes/resumes.ts` that requires JWT authentication by verifying the token from the `Authorization` header. Accept `{ extractedText }` in the request body, update the corresponding `Resume` record using `prisma.resume.update` with the new `extractedText` and set `status` to "processed", and return the updated resume data (e.g., `{ id, extractedText, status }`) with a 200 status. Handle errors with a 404 status if the resume is not found.

Frontend: In `src/pages/SessionDetails.tsx` from Prompt 7, for resumes with `status` "review_needed" (fetched from the backend), display a side-by-side view: on the left, show the original file using an `<iframe>` for PDFs (e.g., `<iframe src="/uploads/<filePath>" />`) or a simple text display for DOCX, styled with Tailwind (e.g., `w-1/2`, `h-96`, `border`); on the right, provide an editable `<textarea>` pre-filled with the current `extractedText`, styled with Tailwind (e.g., `w-1/2`, `p-2`, `border`, `h-96`). Add a "Save" button below the textarea (e.g., `bg-blue-500`, `text-white`, `p-2`, `rounded`). On click, send a PATCH request to `/resumes/:resumeId` with the updated `extractedText` via `src/services/api.ts`, including the JWT token. On success, update the UI to reflect the new `status` as "processed" and display the updated text in a non-editable format (e.g., `<div class="p-4 bg-white border">`).
```

**Context**: Adds manual correction capabilities for resumes that failed automatic text extraction, integrating backend updates with a frontend editing interface.

---

#### Prompt 9: Basic Evaluation

```text
Backend: In the backend from Prompt 8, define basic evaluation metrics logic in `src/services/evaluation.ts`. For simplicity, implement keyword matching: extract keywords from the `jobDescription` (split by spaces, filter common words) and count their occurrences in the `extractedText`. Add an `Evaluation` model to `prisma/schema.prisma` with fields: `id` (uuid, primary key), `candidateId` (uuid, references `Candidate.id`), `keywordScore` (float), `totalScore` (float), `createdAt` (datetime). Run `npx prisma migrate dev --name add_evaluation` to apply the changes. Create an evaluation function in `src/services/evaluation.ts` that takes `jobDescription` and `extractedText`, calculates a `keywordScore` (e.g., matches/totalKeywords), and sets `totalScore` to `keywordScore` for now. Add a POST `/sessions/:sessionId/evaluate` endpoint in `src/routes/sessions.ts` that requires JWT authentication, retrieves all resumes for the session with `prisma.resume.findMany({ where: { candidate: { sessionId } } })`, evaluates each using the function, creates `Evaluation` records with `prisma.evaluation.create`, and returns the evaluation results (e.g., `{ candidateId, keywordScore, totalScore }`).

Frontend: In `src/pages/SessionDetails.tsx` from Prompt 8, add an "Evaluate" button (e.g., `bg-blue-500`, `text-white`, `p-2`, `rounded`). On click, send a POST request to `/sessions/:sessionId/evaluate` with the JWT token via `src/services/api.ts`. On success, display a ranked list of candidates based on `totalScore`, showing each candidate’s name (or resume ID if name extraction is added later) and `totalScore`, styled with Tailwind (e.g., `flex`, `flex-col`, `gap-2`, `p-4`, `bg-gray-100`). For each candidate, allow clicking to open a modal (using a simple state toggle with `useState`) displaying detailed scores (initially just `keywordScore`), styled with Tailwind (e.g., `fixed`, `bg-white`, `p-6`, `rounded`, `shadow-lg`).
```

**Context**: Implements basic evaluation using keyword matching, displaying ranked candidates with scores and details, setting the stage for advanced metrics.

---

#### Prompt 10: LLM Integration

```text
Backend: In the backend from Prompt 9, install the `openai` package. Add `OPENAI_API_KEY` to the `.env` file. Extend the evaluation function in `src/services/evaluation.ts` to include LLM scoring: use the OpenAI GPT API (e.g., `gpt-3.5-turbo`) with a prompt like "Rate how well this resume matches the job description on a scale of 0 to 1" followed by the `jobDescription` and `extractedText`. Extract the score from the API response (e.g., parse a number between 0 and 1). Update the `Evaluation` model in `prisma/schema.prisma` to add an `llmScore` field (float), and re-run `npx prisma migrate dev --name add_llm_score`. Modify the POST `/sessions/:sessionId/evaluate` endpoint to accept an optional `customPrompt` in the request body (e.g., `{ customPrompt: "Evaluate based on technical skills" }`), using it instead of the default prompt if provided, and include the `llmScore` in the evaluation results.

Frontend: In `src/pages/SessionDetails.tsx` from Prompt 9, above the "Evaluate" button, add an optional `<input>` field for a custom prompt, styled with Tailwind (e.g., `w-full`, `p-2`, `border`, `mb-2`). When the "Evaluate" button is clicked, include the custom prompt in the POST request to `/sessions/:sessionId/evaluate` if provided, via `src/services/api.ts`. Update the ranked list and modal to display `llmScore` alongside `keywordScore` when available, with Tailwind styling (e.g., `grid`, `grid-cols-2`, `gap-2` for scores).
```

**Context**: Enhances evaluation with OpenAI GPT for custom prompt-based scoring, integrating LLM capabilities into the existing system.

---

#### Prompt 11: Dynamic Weights & Updates

```text
Backend: In the backend from Prompt 10, update the POST `/sessions/:sessionId/evaluate` endpoint to accept optional weights in the request body (e.g., `{ keywordWeight: 0.5, llmWeight: 0.5 }`). Modify the evaluation logic in `src/services/evaluation.ts` to calculate `totalScore` as a weighted sum (e.g., `keywordScore * keywordWeight + llmScore * llmWeight`), defaulting to equal weights (e.g., 0.5 each) if not provided. Validate that weights sum to 1 or normalize them if they don’t, and return the updated scores in the response.

Frontend: In `src/pages/SessionDetails.tsx` from Prompt 10, below the custom prompt input, add sliders for each metric’s weight (e.g., `keywordWeight` and `llmWeight`) using HTML `<input type="range" min="0" max="1" step="0.1" />`, styled with Tailwind (e.g., `w-full`, `mb-2`). Use `useState` to track weight values, defaulting to 0.5 each. When weights change or the "Evaluate" button is clicked, send the weights in the POST request to `/sessions/:sessionId/evaluate` via `src/services/api.ts`, and update the ranked list and modal in real-time with the new `totalScore` values, maintaining Tailwind styling.
```

**Context**: Adds dynamic weight adjustments for evaluation metrics, allowing real-time ranking updates based on user preferences.

---

#### Prompt 12: Visualizations

```text
Frontend: In the frontend from Prompt 11, install `recharts` for charting. In `src/pages/SessionDetails.tsx`, for each candidate in the ranked list, add a "View Chart" button (e.g., `bg-blue-500`, `text-white`, `p-1`, `rounded`). On click, display a modal with a radar chart using `recharts` `<RadarChart>` to visualize `keywordScore` and `llmScore` for the selected candidate, styled with Tailwind (e.g., `w-full`, `h-96`). Add toggle buttons (e.g., `bg-gray-200`, `p-2`, `rounded`) to switch between chart types: radar (default), bar (`<BarChart>`), and heatmap (simulated with a grid of colored squares using `flex`, `flex-wrap`). Implement export features: add an "Export Chart" button to save the current chart as PNG using `html2canvas` (install it), and an "Export Data" button to download evaluation data as CSV using `papaparse` (install it), including candidate ID and scores.
```

**Context**: Enhances the UI with interactive visualizations of candidate scores, offering multiple chart types and export options for analysis.

---

#### Prompt 13: Session Management

```text
Backend: In the backend from Prompt 11, ensure all session data (job description, resumes, evaluations) is persisted via Prisma models (already set up). Add a GET `/sessions` endpoint in `src/routes/sessions.ts` that requires JWT authentication, retrieves all sessions for the authenticated user with `prisma.session.findMany({ where: { userId } })`, and returns them (e.g., `{ id, jobDescription, createdAt }`). Update the POST `/sessions/:sessionId/evaluate` endpoint to allow re-running evaluations with updated criteria (e.g., new weights or prompts), re-processing existing resumes.

Frontend: In `src/pages/Dashboard.tsx` from Prompt 4, fetch and display a list of saved sessions from GET `/sessions` via `src/services/api.ts`, styled with Tailwind (e.g., `grid`, `grid-cols-2`, `gap-4`). For each session, show `jobDescription` and a "View" button (e.g., `bg-blue-500`, `text-white`, `p-2`, `rounded`). On click, redirect to `/sessions/:sessionId` using `react-router-dom`. In `src/pages/SessionDetails.tsx` from Prompt 12, allow re-running evaluations by reusing the "Evaluate" button with current weights and prompt, updating the UI with new results.
```

**Context**: Completes the app with session management, enabling users to view past sessions and re-run evaluations with updated parameters.

---

## Review & Next Steps

- **Alignment with `todo.md`**: These prompts cover all remaining items (Iterations 4-10), matching the tasks in `todo.md` (e.g., bulk upload with Bull, LLM integration with OpenAI, visualizations with `recharts`).
- **Format Consistency**: Each prompt follows the same structure as Prompts 1-6: detailed backend and frontend instructions, incremental build, and a clear context.
- **Full-Stack Integration**: Prompts integrate backend APIs with frontend UI (e.g., Prompt 7 connects Bull queue status to polling UI).
- **Progress**: Completing these yields a fully functional Resume Screener Web App with all planned features.

These prompts can be directly appended to the `prompt_plan.md` file under the "Series of Prompts for Code-Generation LLM" section, extending the existing plan seamlessly. If further refinements or additional details are needed, please let me know!
