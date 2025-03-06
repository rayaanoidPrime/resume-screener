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

---

## Review & Next Steps

- **Technology Updates**:
  - Replaced TypeORM with Prisma for simpler setup and better TypeScript integration.
  - Switched from Create React App to Vite with React, leveraging ESBuild for faster bundling.
- **Integration**: Each prompt connects backend APIs to frontend UI (e.g., Prompt 4 wires Prompt 2’s APIs to Prompt 3’s forms).
- **Size**: Steps are focused and suitable for LLM generation (e.g., backend setup vs. authentication).
- **Progress**: Completing these yields a functional app with login, session creation, and single resume upload.
