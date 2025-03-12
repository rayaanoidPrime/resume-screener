// Type definition for experience data
interface Experience {
  company: string;
  title: string;
  dates: string;
  location: string;
  description: string[];
}

export const checkExperience = (experience: Experience[]) => {
  const totalExperience = experience.reduce((acc, exp) => {
    if (!exp.dates) {
      return acc; // Skip if dates is undefined or null
    }

    // Handle various date formats:
    // 1. May '18- Nov '18
    // 2. May'23 – Present
    // 3. Feb 2022 – Present
    // 4. June 2018 – Mar 2020
    // 5. 2014 - 2015

    // Extract start and end dates
    const dateString = exp.dates.replace(/\s+/g, " ").trim();

    // Split by various dash types and trim spaces
    const dateParts = dateString
      .split(/\s*[-–—]\s*/)
      .map((part) => part.trim());

    if (dateParts.length < 1) {
      return acc; // No valid date parts found
    }

    const startDateStr = dateParts[0];
    const endDateStr = dateParts.length > 1 ? dateParts[1] : "Present";

    // Parse start date
    let startDate = parseDate(startDateStr);

    // Parse end date
    let endDate =
      endDateStr.toLowerCase() === "present"
        ? new Date() // Current date for "Present"
        : parseDate(endDateStr);

    // Validate dates
    if (
      !startDate ||
      !endDate ||
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      return acc; // Skip invalid date entries
    }

    // Calculate years between dates, including partial years
    const years =
      endDate.getFullYear() -
      startDate.getFullYear() +
      (endDate.getMonth() - startDate.getMonth()) / 12;

    // Only add positive experience amounts
    return acc + (years > 0 ? years : 0);
  }, 0);

  return totalExperience;
};

// Helper function to parse various date formats
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Case 5: Year only format (e.g., "2014")
  if (/^\d{4}$/.test(dateStr)) {
    return new Date(parseInt(dateStr, 10), 0, 1); // January 1st of that year
  }

  // Case 1 & 2: Month 'YY format (e.g., "May '18" or "May'23")
  const shortYearMatch = dateStr.match(/([A-Za-z]+)[\s']'?(\d{2})/);
  if (shortYearMatch) {
    const month = getMonthNumber(shortYearMatch[1]);
    const year = 2000 + parseInt(shortYearMatch[2], 10); // Assume 20xx for 2-digit years

    if (month !== -1) {
      return new Date(year, month, 1);
    }
  }

  // Case 3 & 4: Month YYYY format (e.g., "Feb 2022" or "June 2018")
  const fullYearMatch = dateStr.match(/([A-Za-z]+)\s+(\d{4})/);
  if (fullYearMatch) {
    const month = getMonthNumber(fullYearMatch[1]);
    const year = parseInt(fullYearMatch[2], 10);

    if (month !== -1) {
      return new Date(year, month, 1);
    }
  }

  // Try parsing with built-in Date
  const fallbackDate = new Date(dateStr);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }

  return null;
}

// Helper function to convert month name to month number (0-11)
function getMonthNumber(monthName: string): number {
  const months: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    sept: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
  };

  return months[monthName.toLowerCase()] ?? -1;
}
