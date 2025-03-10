import { createAIProvider } from "../ai/providers";
import { aiConfig } from "../ai/config";
import { ResumeData, ResumeJobData } from "../queue/resumeProcessor";
import { getQualitativeScorePrompt } from "../ai/prompts";

const aiProvider = createAIProvider(aiConfig);

// Common words to filter out from keywords
const commonWords = new Set([
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "so",
  "up",
  "out",
  "if",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "people",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
  "is",
  "are",
  "was",
  "were",
  "has",
  "had",
  "been",
  "may",
  "should",
  "would",
  "could",
  "can",
  "will",
  "shall",
  "must",
  "might",
  "am",
]);

function calculateKeywordScore(
  jobData: ResumeJobData["job"],
  resumeText: string
): number {
  // Convert texts to lowercase for comparison
  const jobText = JSON.stringify(jobData).toLowerCase();
  const resumeText_ = resumeText.toLowerCase();

  // Extract meaningful keywords from job description
  const keywords = jobText
    .split(/[\s,\.;:\(\)\[\]\{\}]+/) // Split on various delimiters
    .filter(
      (word) =>
        word.length > 2 && // Skip very short words
        !commonWords.has(word) && // Skip common words
        /^[a-z]+$/.test(word) // Only keep words with letters
    );

  if (keywords.length === 0) return 0;

  // Count how many keywords appear in the resume
  const matches = keywords.filter((keyword) =>
    resumeText_.includes(keyword)
  ).length;

  // Calculate score as percentage of matched keywords
  return matches / keywords.length;
}

async function getQualitativeScore(
  jobData: ResumeJobData["job"],
  structuredData: ResumeData
): Promise<number> {
  try {
    const prompt = getQualitativeScorePrompt(jobData, structuredData);

    const result = await aiProvider.completion(
      prompt,
      "You are an expert resume evaluator who reviews and scores resumes and outputs only a number between 0 and 1 and nothing else."
    );
    const score = parseFloat(result);
    return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1);
  } catch (error) {
    console.error("Qualitative scoring error:", error);
    return 0;
  }
}

export async function evaluateResume(
  jobData: ResumeJobData["job"],
  resumeText: string,
  structuredData: ResumeData
): Promise<{
  keywordScore: number;
  totalScore: number;
  qualitativeScore: number;
}> {
  // Calculate keyword match score
  const keywordScore = calculateKeywordScore(jobData, resumeText);

  // Get qualitative score from AI
  const qualitativeScore = await getQualitativeScore(jobData, structuredData);

  // Combine scores (giving more weight to qualitative assessment)
  const totalScore = keywordScore * 0.4 + qualitativeScore * 0.6;

  return {
    keywordScore,
    qualitativeScore,
    totalScore,
  };
}
