import { ResumeData } from "../queue/resumeProcessor";
import { ResumeJobData } from "../queue/resumeProcessor";

export function parseResumePrompt(
  extractedText: string,
  jobData: ResumeJobData["job"]
): string {
  return `You are an expert system that converts unstructured resume text data from into structured JSON format. Follow these precise instructions:

Input:
1. extracted text from a resume and the job posting data in JSON format.
2. You must organize this into a well-structured JSON object
3. If the candidate has not explicitly listed the skills mentioned in the job data, you must infer them from the resume.


Output Requirements:
Create a JSON object with these main sections:
- "contact_info": Extract name, email, phone, location, LinkedIn/portfolio URLs
- "summary": The candidate's summary/objective statement
- "experience": Array of work experiences with:
  * "company": Company name
  * "title": Job title
  * "dates": Employment period (start-end)
  * "location": Work location
  * "description": Array of bullet points/responsibilities
- "education": Array of educational entries with:
  * "institution": School/university name
  * "degree": Degree type
  * "field": Field of study
  * "dates": Start-end years
  * "gpa": GPA if available
- "skills": Array of skills, grouped by category when possible
- "certifications": Array of professional certifications
- "projects": Array of relevant projects
- "languages": Language proficiencies
- "additional": Any other relevant information

Processing Guidelines:
1. Maintain hierarchical structure even with imperfect text
2. Correctly categorize sections that might have variant headings (e.g., "Work History" vs "Professional Experience")
3. Extract dates in a consistent format
4. Include "confidence" fields (high/medium/low) for sections where extraction quality is uncertain
5. Use null values for missing information rather than omitting fields
6. For fields with multiple items (like bullet points), preserve as arrays
7. Handle inconsistent formatting gracefully
8. If the candidate has not explicitly listed the skills mentioned in the job data, you must infer them from the resume.
9. Only include those inferred skills which you are confident that the candidate has, after comparing the resume to the job data.

Here is an example of the JSON format you should return:
{
  "contact_info": {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phone": "+1 (123) 456-7890",
    "location": "San Francisco, CA",
    "linkedin": "https://www.linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.dev"
  },
  "summary": "Experienced software engineer with a strong background in full-stack web development, specializing in Python and JavaScript. Passionate about building scalable applications and improving development workflows.",
  "experience": [
    {
      "company": "TechCorp Inc.",
      "title": "Senior Software Engineer",
      "dates": "Jan 2020 - Present",
      "location": "San Francisco, CA",
      "description": [
        "Led the development of a microservices-based architecture, improving scalability and performance.",
        "Mentored junior engineers and conducted code reviews.",
        "Implemented CI/CD pipelines, reducing deployment time by 40%."
      ]
    },
    {
      "company": "StartupX",
      "title": "Software Engineer",
      "dates": "Jun 2017 - Dec 2019",
      "location": "New York, NY",
      "description": [
        "Developed RESTful APIs and front-end applications using React and Node.js.",
        "Optimized database queries, reducing load times by 30%.",
        "Collaborated with product managers to define feature requirements."
      ]
    }
  ],
  "education": [
    {
      "institution": "University of California, Berkeley",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "dates": "2013 - 2017",
      "gpa": "3.8"
    }
  ],
  "skills": {
    "programming_languages": ["Python", "JavaScript", "TypeScript", "Java"],
    "frameworks": ["React", "Node.js", "Django", "Flask"],
    "databases": ["PostgreSQL", "MongoDB"],
    "tools": ["Docker", "Kubernetes", "Git", "CI/CD"]
  },
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "date": "2021"
    }
  ],
  "projects": [
    {
      "name": "AI Resume Screener",
      "description": "Built an AI-powered resume screening tool for recruiters to evaluate candidates based on job descriptions.",
      "technologies": ["Python", "FastAPI", "PostgreSQL", "React"],
      "link": "https://github.com/johndoe/ai-resume-screener"
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native"
    },
    {
      "language": "Spanish",
      "proficiency": "Fluent"
    }
  ],
  "additional": {
    "volunteer_work": "Mentor at Code for Good, helping underprivileged students learn programming.",
    "publications": ["'Optimizing Web Applications' - Published in Tech Journal, 2022"]
  },
  "confidence": {
    "contact_info": "high",
    "summary": "high",
    "experience": "high",
    "education": "high",
    "skills": "high",
    "certifications": "medium",
    "projects": "medium",
    "languages": "high",
    "additional": "low"
  }
}

Here is the job data:
<JOB_DATA>
${JSON.stringify(jobData)}  
</JOB_DATA>

Here is the extracted text from the resume:
<BEGIN_TEXT>
${extractedText}
<END_TEXT>

Format your response as valid, properly indented JSON only, without any explanations or markdown formatting.`;
}

export function getQualitativeScorePrompt(
  jobData: ResumeJobData["job"],
  structuredData: ResumeData
): string {
  return `You are an expert resume evaluator. Analyze how well the candidate's qualifications match the job requirements. Both the job details and the resume data are in JSON format.

  Job Details in JSON format:
  <JOB_DETAILS>
  ${JSON.stringify(jobData)}
  </JOB_DETAILS>
  
  Resume Data in JSON format:
  <RESUME_DATA>
  ${JSON.stringify(structuredData)}
  </RESUME_DATA>
  
  Based on the candidate's experience, skills, education, and overall fit for the role, provide a single number between 0 and 1 representing their match score. Consider factors like:
  - Relevant experience
  - Required and preferred skills
  - Education requirements
  - Industry knowledge
  - Project relevance
  
  Return only a number between 0 and 1, with no explanation or other text.`;
}
