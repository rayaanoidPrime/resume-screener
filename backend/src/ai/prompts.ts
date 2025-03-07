export function parseResumePrompt(extractedText: string): string {
  return `You are an expert system that converts unstructured resume text data from into structured JSON format. Follow these precise instructions:

Input:
1. extracted text from a resume
2. You must organize this into a well-structured JSON object

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
1. Maintain hierarchical structure even with imperfect OCR text
2. Correctly categorize sections that might have variant headings (e.g., "Work History" vs "Professional Experience")
3. Extract dates in a consistent format
4. Include "confidence" fields (high/medium/low) for sections where extraction quality is uncertain
5. Use null values for missing information rather than omitting fields
6. For fields with multiple items (like bullet points), preserve as arrays
7. Handle inconsistent formatting gracefully

Here is the extracted text from the resume:
<BEGIN_TEXT>
${extractedText}
<END_TEXT>

Format your response as valid, properly indented JSON only, without any explanations or markdown formatting.`;
}
