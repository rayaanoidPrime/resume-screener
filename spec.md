# Developer Specification Document: Resume Screener Web App

## 1. Project Overview

**Purpose:**  
Develop a web application that streamlines the screening of thousands of resumes for recruiters. The tool evaluates each candidate against a provided job description and optional custom textual prompts, ranking them based on multiple evaluation metrics. Visualizations provide both an overall snapshot of the candidate pool and detailed insights for each candidate.

**Target Users:**  
Recruiters who already have candidate resumes and wish to quickly screen and evaluate candidates.

---

## 2. Core Functionalities

### 2.1. Candidate Evaluation & Ranking

- **Evaluation Metrics:**

  - **Keyword Matches (25%):**
    - **Description:** Measures frequency of key terms (e.g., "Python," "project management") from the job description in each resume.
  - **Work Experience Relevance (20%):**
    - **Description:** Assesses the duration and relevance of previous job roles to the current job.
  - **Skills Relevance (20%):**
    - **Description:** Compares specific skills listed in the resume against the job’s requirements.
  - **Education (10%):**
    - **Description:** Scores based on degree level and field relevance (e.g., Bachelor’s, Master’s in a relevant field).
  - **Years of Experience (15%):**
    - **Description:** Evaluates the total number of years of professional experience.
  - **Custom Textual Prompts (10%):**
    - **Description:** Uses additional recruiter-defined natural language requirements processed via an LLM (OpenAI GPT) to generate a numerical score.

- **Dynamic Adjustments:**
  - Recruiters can adjust the weight of each metric using per-job sliders and input fields.
  - A text input field allows for custom prompts, whose results are incorporated into the overall score.
  - Real-time updates: Candidate rankings and visualizations update immediately as weights or prompts are modified.

### 2.2. Detailed Candidate Profiles and Visualizations

- **Ranked List:**

  - A sidebar displays candidates in ranked order based on total scores.
  - Clicking on a candidate displays a detailed view.

- **Individual Candidate Details:**
  - **Resume Display:** The original resume file.
  - **Evaluation Metrics Display:** Numerical scores for each metric.
  - **Visualizations:**
    - **Radar (Spider) Chart:**
      - Axes for each metric (e.g., Keyword Matches, Work Experience Relevance, etc.) on a 0–100 scale.
      - A filled polygon representing the candidate’s performance.
      - An optional benchmark overlay (e.g., ideal candidate profile).
      - Color-coding to highlight strengths (green) and weaknesses (red).
    - **Additional Charts (Toggleable):**
      - **Bar Chart/Histogram:** Shows distribution of total scores across candidates.
      - **Heatmap:** Visualizes candidate performance across all metrics.
      - **Pie/Donut Chart:** Breaks down top candidates by dominant metrics.
      - **Individual Profile Enhancements:**
        - Bar chart for a linear comparison of scores.
        - Timeline of work experience and education with key achievements.
        - Word cloud highlighting frequently matched keywords.
  - **Interactivity:**
    - Toggle chart visibility.
    - Hover tooltips with additional data.
    - Apply filters (e.g., by metric or score range).
    - Export charts/data as PNG or CSV.

### 2.3. Session Management

- **Saved Screening Sessions:**
  - Each session records:
    - A summary of the job description (generated via LLM).
    - The number of uploaded resumes.
    - Creation date and minimal metadata.
  - **Available Actions:**
    - **Re-run Evaluation:** With updated criteria.
    - **Delete Session**

---

## 3. Resume Upload & Processing

### 3.1. File Upload Interface

- **Supported File Formats:**
  - PDF and DOCX only.
- **Bulk Upload Capability:**
  - Drag-and-drop interface for up to 500 resumes at once.
  - Traditional “Browse Files” option for individual or small batch uploads.
- **Progress and Status:**
  - Progress bar indicating number of files processed.
  - Status indicators (e.g., “Processing”, “Review Needed”).

### 3.2. Text Extraction Workflow

- **Automated Extraction:**
  - PDFs:
    - Direct text extraction.
    - OCR applied if the PDF is image-based.
  - DOCX:
    - Direct parsing of text content.
- **Manual Correction Option:**
  - A side-by-side view displays the original resume and the extracted text.
  - Recruiters can manually correct any errors in extraction.
- **Error Handling:**
  - Files with extraction issues are flagged and moved to a “Review Needed” queue without halting the overall process.

---

## 4. Backend Infrastructure & Architecture

### 4.1. Asynchronous Processing

- **Job Queue:**
  - Use an asynchronous job queue (e.g., Celery) with either Redis or RabbitMQ.
  - Designed to handle bulk resume ingestion and text extraction in the background.
  - Processing target: Up to 500 resumes in under 5–10 minutes.
- **Scalability:**
  - Leverage cloud resources (e.g., AWS) to manage spikes in workload.

### 4.2. Database & Data Storage

- **Database:**
  - PostgreSQL (SQL) to store:
    - Candidate data.
    - Extracted text from resumes.
    - Evaluation results.
    - Session metadata.
- **Data Handling:**
  - All candidate and session data is stored persistently.
  - Each resume’s extracted text is linked to the corresponding candidate record.

### 4.3. LLM Integration

- **Provider:**
  - OpenAI (using GPT) for processing custom textual prompts.
- **Usage:**
  - Evaluate additional recruiter-defined requirements.
  - Return a numerical score that contributes to candidate ranking.
- **Error Handling Strategy:**
  - Implement retry logic with exponential backoff if API errors occur.
  - Minimal error details exposed to the recruiter; internal logs capture API issues.

---

## 5. Front-End Specifications

### 5.1. Technology Stack

- **Framework:**
  - React for building the UI.
  - TypeScript for end-to-end type safety.
- **Styling:**
  - Tailwind CSS for a clean, utility-first styling approach.
- **Mobile Responsiveness:**
  - Ensure layouts are responsive and mobile-friendly.

### 5.2. UI/UX Design

- **Layout:**
  - **Sidebar:** Displays the ranked list of candidates.
  - **Main Panel:** Shows candidate details, including resume and visualizations.
  - **Collapsible Sections:** For overall candidate summaries and extra charts.
- **Design Aesthetics:**
  - Clean, utilitarian design.
  - **Color Scheme:** Neutral tones (grays and whites) with subtle highlights (blue for clickable elements, green for high scores).
  - **Typography:** Use clear, readable fonts (e.g., Roboto or Inter) with well-defined hierarchies for metric labels and headings.

### 5.3. Interactivity & Export Features

- **Interactive Elements:**
  - Real-time adjustment of evaluation metric weights (sliders/input fields) with instant ranking updates.
  - Toggle visibility of individual visualizations.
  - Tooltips on hover for charts.
  - Filtering options based on metric scores.
- **Export Options:**
  - Allow exporting of charts as PNG.
  - Enable data export as CSV.

---

## 6. User Authentication

- **Authentication Method:**
  - Simple email/password login.
- **User Base:**
  - The application is designed for recruiters only.
- **Security:**
  - Basic secure authentication; advanced features (e.g., SSO) are not required for version 1.

---

## 7. Error Handling & Logging

- **File Processing Errors:**
  - Flag and queue resumes with extraction issues without stopping the overall process.
- **API Call Failures (LLM):**
  - Implement retry logic with exponential backoff.
- **General Error Handling:**
  - Provide user-friendly error messages on the front end.
  - Log errors on the backend for debugging and future improvements.
- **Logging & Auditing:**
  - No extensive logging or audit trails required for user actions beyond standard error logging.

---

## 8. Non-Functional Requirements

- **Performance:**
  - Bulk uploads (up to 500 resumes) should be processed within 5–10 minutes.
  - Maintain UI responsiveness during background processing.
- **Scalability:**
  - Architect the system to handle spikes in load by leveraging cloud-based resources.
- **Maintainability:**
  - Use modern frameworks (React, TypeScript, Tailwind CSS) to ensure code quality and ease of future enhancements.

---

## 9. Future Enhancements

- **Automatic Candidate Metadata Extraction:**
  - Future versions may include enhanced extraction of candidate metadata (e.g., name, contact details).
- **Additional File Formats:**
  - Support for more file types beyond PDFs and DOCX could be considered.
- **Advanced Job Posting Management:**
  - Though not required for version 1, adding a job posting module may be a future consideration.
