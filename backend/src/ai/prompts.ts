import { ResumeData } from "../queue/resumeProcessor";
import { ResumeJobData } from "../queue/resumeProcessor";

export function parseResumePrompt(
  extractedText: string,
  jobData: ResumeJobData["job"]
): string {
  return `You are an expert system that converts unstructured resume text data into structured JSON format, specifically for investment and private equity research roles. Follow these precise instructions:

Input:
1. extracted text from a resume and the job posting data in JSON format.
2. You must organize this into a well-structured JSON object
3. If the candidate has not explicitly listed the skills mentioned in the job data, you must infer them from their experience and background.

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
  * "deal_experience": Array of deals worked on with size and type
  * "sectors": Array of industry sectors covered
  * "investment_types": Array of investment types (e.g., LBO, Growth Equity, etc.)
- "education": Array of educational entries with:
  * "institution": School/university name
  * "degree": Degree type
  * "field": Field of study
  * "dates": Start-end years
  * "gpa": GPA if available
  * "relevant_coursework": Array of relevant courses
- "skills": Object containing categorized skills:
  * "financial_modeling": Array of modeling skills
  * "valuation_methods": Array of valuation methodologies
  * "research_tools": Array of research and data tools
  * "technical_skills": Array of technical/software skills
  * "soft_skills": Array of relevant soft skills
  * [Additional categories as needed]
- "certifications": Array of professional certifications (e.g., CFA, CAIA)
- "research_experience": Array of research projects/coverage with:
  * "title": Research project/coverage name
  * "description": Project details
  * "sectors": Industries covered
  * "methodologies": Research methodologies used
- "languages": Language proficiencies
- "additional": Object containing:
  * "deal_value": Total deal value worked on
  * "sector_expertise": Primary sector specializations
  * "publications": Array of published research/analysis
  * "conferences": Array of relevant conferences/speaking engagements

Processing Guidelines:
1. Maintain hierarchical structure even with imperfect text
2. Correctly categorize sections that might have variant headings (e.g., "Work History" vs "Professional Experience")
3. Extract dates in a consistent format
4. Include "confidence" fields (high/medium/low) for sections where extraction quality is uncertain
5. Use null values for missing information rather than omitting fields
6. For fields with multiple items (like bullet points), preserve as arrays
7. Handle inconsistent formatting gracefully
8. Infer investment-related skills from experience descriptions
9. Pay special attention to deal experience and sector expertise
10. Include CFA and CAIA certifications in the certifications section (MUST)

Here is an example of the JSON format you should return:
{
  "contact_info": {
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1 (123) 456-7890",
    "location": "New York, NY",
    "linkedin": "https://www.linkedin.com/in/janesmith"
  },
  "summary": "Private Equity professional with 7 years of experience in middle-market investments, specializing in healthcare and technology sectors. Strong track record in deal execution and portfolio management.",
  "experience": [
    {
      "company": "Growth Capital Partners",
      "title": "Vice President",
      "dates": "Jan 2020 - Present",
      "location": "New York, NY",
      "description": [
        "Led due diligence and execution of 6 platform investments totaling $800M in enterprise value",
        "Developed complex financial models and valuation analyses for target companies",
        "Managed relationships with portfolio company executives and investment bankers"
      ],
      "deal_experience": [
        {
          "name": "HealthTech Solutions Acquisition",
          "size": "$300M",
          "type": "Platform Investment",
          "role": "Lead Associate"
        },
        {
          "name": "SaaS Provider Add-on",
          "size": "$150M",
          "type": "Add-on Acquisition",
          "role": "Deal Lead"
        }
      ],
      "sectors": ["Healthcare", "Technology", "SaaS"],
      "investment_types": ["Growth Equity", "LBO", "Add-on Acquisitions"]
    }
  ],
  "education": [
    {
      "institution": "Harvard Business School",
      "degree": "Master of Business Administration",
      "field": "Finance",
      "dates": "2017 - 2019",
      "gpa": "3.8",
      "relevant_coursework": [
        "Private Equity",
        "Venture Capital",
        "Corporate Finance",
        "Financial Modeling"
      ]
    }
  ],
  "skills": {
    "financial_modeling": [
      "LBO Modeling",
      "DCF Analysis",
      "Working Capital Analysis",
      "Sensitivity Analysis"
    ],
    "valuation_methods": [
      "Comparable Company Analysis",
      "Precedent Transactions",
      "LBO Analysis",
      "DCF Valuation"
    ],
    "research_tools": [
      "Capital IQ",
      "FactSet",
      "Bloomberg Terminal",
      "PitchBook"
    ],
    "technical_skills": [
      "Excel",
      "PowerPoint",
      "SQL",
      "Tableau"
    ],
    "soft_skills": [
      "Due Diligence",
      "Negotiation",
      "Team Leadership",
      "Client Relations"
    ]
  },
  "certifications": [
    {
      "name": "Chartered Financial Analyst (CFA)",
      "issuer": "CFA Institute",
      "date": "2021",
      "level": "Level III"
    }
  ],
  "research_experience": [
    {
      "title": "Healthcare SaaS Market Analysis",
      "description": "Comprehensive analysis of the healthcare SaaS market, including market sizing, competitive landscape, and growth opportunities",
      "sectors": ["Healthcare", "Technology"],
      "methodologies": ["Market Sizing", "Competitive Analysis", "Growth Strategy"]
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native"
    },
    {
      "language": "Mandarin",
      "proficiency": "Professional"
    }
  ],
  "additional": {
    "deal_value": "$1.2B total transaction value",
    "sector_expertise": ["Healthcare", "Technology", "Business Services"],
    "publications": [
      "Healthcare SaaS Market Report 2022",
      "Digital Health Investment Landscape Analysis"
    ],
    "conferences": [
      "Speaker at PE Healthcare Investment Summit 2022",
      "Panelist at Growth Equity Conference 2021"
    ]
  },
  "confidence": {
    "contact_info": "high",
    "summary": "high",
    "experience": "high",
    "education": "high",
    "skills": "high",
    "certifications": "high",
    "research_experience": "medium",
    "languages": "high",
    "additional": "medium"
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
  return `You are an expert investment and private equity resume evaluator. Analyze how well the candidate's qualifications match the job requirements. Both the job details and the resume data are in JSON format.

  Job Details in JSON format:
  <JOB_DETAILS>
  ${JSON.stringify(jobData)}
  </JOB_DETAILS>
  
  Resume Data in JSON format:
  <RESUME_DATA>
  ${JSON.stringify(structuredData)}
  </RESUME_DATA>
  
  Based on the candidate's experience, skills, education, and overall fit for the role, provide a single number between 0 and 1 representing their match score. Consider factors like:
  - Deal experience (size, complexity, and relevance)
  - Sector expertise alignment
  - Financial modeling and valuation skills
  - Required certifications (CFA, CAIA, etc.)
  - Educational background
  - Research and analysis capabilities
  - Industry knowledge and network
  - Investment thesis development experience
  - Due diligence expertise
  - Portfolio management experience
  
  Return only a number between 0 and 1, with no explanation or other text.`;
}
