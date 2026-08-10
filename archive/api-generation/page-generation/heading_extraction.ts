import graymatter from "gray-matter";

/**
 * Extract headings with level information
 * Returns array of { level, heading, content }
 */
interface HeadingWithLevel {
  level: number;
  heading: string;
  content: string;
}

const extractHeadingsWithLevels = (mdxContent: string): HeadingWithLevel[] => {
  let content = mdxContent;
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (match) {
    content = content.slice(match[0].length);
  }

  const lines = content.split("\n");
  const headings: HeadingWithLevel[] = [];

  let currentHeading: HeadingWithLevel | null = null;
  let currentContent: string[] = [];

  const headingRegex = /^(#{1,6})\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);

    if (match) {
      // Save previous heading
      if (currentHeading !== null) {
        currentHeading.content = currentContent.join("\n").trim();
        headings.push(currentHeading);
      }

      // Start new heading
      currentHeading = {
        level: match[1].length,
        heading: match[2].trim(),
        content: "",
      };
      currentContent = [];
    } else {
      // Accumulate content
      if (currentHeading !== null) {
        currentContent.push(line);
      }
    }
  }

  // Save last heading
  if (currentHeading !== null) {
    currentHeading.content = currentContent.join("\n").trim();
    headings.push(currentHeading);
  }

  return headings;
};

/**
 * Extract only specific heading levels (e.g., only ## headings)
 */
const extractHeadingsByLevel = (
  mdxContent: string,
  levels: number[]
): Record<string, string> => {
  const allHeadings = extractHeadingsWithLevels(mdxContent);
  const filtered: Record<string, string> = {};

  allHeadings
    .filter((h) => levels.includes(h.level))
    .forEach((h) => {
      filtered[h.heading] = h.content;
    });

  return filtered;
};

// ============================================================================
// Exports
// ============================================================================

export {
  extractHeadingsWithLevels,
  extractHeadingsByLevel,
  type HeadingWithLevel,
};
