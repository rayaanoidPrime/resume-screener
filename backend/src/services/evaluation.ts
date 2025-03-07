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
  "I",
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
]);

interface EvaluationResult {
  keywordScore: number;
  totalScore: number;
}

export function evaluateResume(
  jobDescription: string,
  extractedText: string
): EvaluationResult {
  // Extract keywords from job description
  const keywords = jobDescription
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.has(word));

  if (keywords.length === 0) {
    return { keywordScore: 0, totalScore: 0 };
  }

  // Count keyword matches in extracted text
  const text = extractedText.toLowerCase();
  const matches = keywords.filter((keyword) => text.includes(keyword)).length;

  // Calculate scores
  const keywordScore = matches / keywords.length;
  const totalScore = keywordScore; // For now, total score is just keyword score

  return { keywordScore, totalScore };
}
