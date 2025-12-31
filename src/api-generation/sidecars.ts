// ============================================================================
// Microsoft-Style Documentation Sidecars for .NET Framework 4.8 / C# 7.3
// Companion file to manifest.json - Markdown documentation layer
// ============================================================================

import type { UID } from "./manifest";

// ============================================================================
// CORE SIDECAR STRUCTURE
// ============================================================================

/**
 * Documentation sidecar for any manifest element
 * Simple structure: descriptions + ordered markdown sections
 */
interface SidecarEntry {
  /**
   * Brief, single-line description shown in lists and tooltips (max ~150 chars)
   * Used for: search results, IntelliSense, quick info
   * Plain text only, no markdown
   */
  description?: string;

  /**
   * Ordered sections that appear between the definition and end of document
   * Each section has a heading and markdown content
   * "See Also" section is always rendered last automatically
   */
  sections?: SidecarSection[];

  /**
   * See Also references - always rendered as the last section
   * Array of UIDs that can be resolved in the manifest
   */
  seeAlso?: UID[];
}

/**
 * A documentation section with heading and markdown content
 */
interface SidecarSection {
  /**
   * Section heading (will be rendered as ## heading)
   * Common headings: "Remarks", "Examples", "Exceptions",
   * "Thread Safety", "Performance", "Platform Notes", etc.
   */
  heading: string;

  /**
   * Markdown content for this section
   * Supports: paragraphs, code blocks, lists, tables, emphasis, links
   */
  content: string;

  /**
   * Optional order hint for section sorting (lower numbers appear first)
   * If not specified, sections appear in array order
   */
  order?: number;
}

// ============================================================================
// SIDECAR COLLECTION
// ============================================================================

/**
 * Complete sidecar documentation collection
 * Maps UIDs from manifest.json to their documentation
 */
interface SidecarCollection {
  /**
   * Format version for backward compatibility
   */
  version: string;

  /**
   * Metadata about this documentation set
   */
  metadata?: {
    title?: string;
    version?: string;
    authors?: string[];
    copyright?: string;
    license?: string;
  };

  /**
   * Documentation entries indexed by UID
   * Keys match UIDs in manifest.json (types, members, namespaces, assemblies, etc.)
   */
  entries: Record<UID, SidecarEntry>;

  /**
   * Optional: Reusable markdown snippets that can be referenced
   * Use {snippet:name} syntax in section content to include snippets
   */
  snippets?: Record<string, string>;

  /**
   * Optional: Common section templates
   * Pre-defined sections that can be reused across multiple entries
   */
  templates?: Record<string, SidecarSection[]>;
}

// ============================================================================
// COMMON SECTION HEADINGS (Conventions)
// ============================================================================

/**
 * Standard section headings following Microsoft documentation conventions
 * These are suggestions - any heading can be used
 */
export const StandardHeadings = {
  // Core documentation
  REMARKS: "Remarks",
  EXAMPLES: "Examples",

  // Parameter/return documentation
  PARAMETERS: "Parameters",
  RETURNS: "Returns",
  TYPE_PARAMETERS: "Type Parameters",

  // Exception documentation
  EXCEPTIONS: "Exceptions",

  // Technical details
  THREAD_SAFETY: "Thread Safety",
  PERFORMANCE: "Performance Considerations",
  SECURITY: "Security",

  // Platform and version
  PLATFORM_NOTES: "Platform Notes",
  VERSION_INFORMATION: "Version Information",

  // Usage guidance
  USAGE: "Usage",
  BEST_PRACTICES: "Best Practices",
  COMMON_PATTERNS: "Common Patterns",

  // Type-specific
  INHERITANCE: "Inheritance Hierarchy",
  IMPLEMENTS: "Implements",
  DERIVED: "Derived Types",

  // Additional information
  NOTES: "Notes",
  CAVEATS: "Caveats",
  LIMITATIONS: "Limitations",
  ALTERNATIVES: "Alternatives",

  // Always last
  SEE_ALSO: "See Also",
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Retrieve documentation for a specific UID
 */
export function getSidecar(
  collection: SidecarCollection,
  uid: UID
): SidecarEntry | undefined {
  return collection.entries[uid];
}

/**
 * Get a specific section by heading
 */
export function getSection(
  entry: SidecarEntry,
  heading: string
): SidecarSection | undefined {
  return entry.sections?.find((s) => s.heading === heading);
}

/**
 * Get all sections in render order
 * Sorts by order property if present, otherwise maintains array order
 * See Also is always excluded (rendered separately at the end)
 */
export function getSectionsInOrder(entry: SidecarEntry): SidecarSection[] {
  if (!entry.sections) return [];

  return [...entry.sections]
    .filter((s) => s.heading !== StandardHeadings.SEE_ALSO)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return 0;
    });
}

/**
 * Resolve snippet references in markdown content
 * Replaces {snippet:name} with actual snippet content
 */
export function resolveSnippets(
  content: string,
  collection: SidecarCollection
): string {
  if (!collection.snippets) return content;

  return content.replace(/\{snippet:(\w+)\}/g, (match, name) => {
    return collection.snippets![name] || match;
  });
}

/**
 * Expand a template into sections
 */
export function expandTemplate(
  collection: SidecarCollection,
  templateName: string
): SidecarSection[] | undefined {
  return collection.templates?.[templateName];
}

/**
 * Check if an entry has any documentation
 */
export function hasDocumentation(entry: SidecarEntry): boolean {
  return !!(
    entry.description ||
    (entry.sections && entry.sections.length > 0) ||
    (entry.seeAlso && entry.seeAlso.length > 0)
  );
}

/**
 * Merge multiple sidecar entries (useful for inheritance)
 * Later entries override earlier ones
 */
export function mergeSidecars(...entries: SidecarEntry[]): SidecarEntry {
  const merged: SidecarEntry = {
    sections: [],
    seeAlso: [],
  };

  for (const entry of entries) {
    if (entry.description) {
      merged.description = entry.description;
    }

    if (entry.sections) {
      // Replace sections with same heading, append new ones
      for (const section of entry.sections) {
        const existingIndex = merged.sections!.findIndex(
          (s) => s.heading === section.heading
        );
        if (existingIndex >= 0) {
          merged.sections![existingIndex] = section;
        } else {
          merged.sections!.push(section);
        }
      }
    }

    if (entry.seeAlso) {
      // Merge see also, removing duplicates
      const existingRefs = new Set(merged.seeAlso);
      for (const ref of entry.seeAlso) {
        if (!existingRefs.has(ref)) {
          merged.seeAlso!.push(ref);
          existingRefs.add(ref);
        }
      }
    }
  }

  return merged;
}

// ============================================================================
// BUILDER UTILITIES (Optional convenience)
// ============================================================================

/**
 * Builder for creating sidecar entries fluently
 */
export class SidecarBuilder {
  private entry: SidecarEntry = {};

  description(text: string): this {
    this.entry.description = text;
    return this;
  }

  section(heading: string, content: string, order?: number): this {
    if (!this.entry.sections) {
      this.entry.sections = [];
    }
    this.entry.sections.push({ heading, content, order });
    return this;
  }

  remarks(content: string): this {
    return this.section(StandardHeadings.REMARKS, content, 10);
  }

  examples(content: string): this {
    return this.section(StandardHeadings.EXAMPLES, content, 20);
  }

  exceptions(content: string): this {
    return this.section(StandardHeadings.EXCEPTIONS, content, 30);
  }

  threadSafety(content: string): this {
    return this.section(StandardHeadings.THREAD_SAFETY, content, 40);
  }

  performance(content: string): this {
    return this.section(StandardHeadings.PERFORMANCE, content, 50);
  }

  seeAlso(...uids: UID[]): this {
    if (!this.entry.seeAlso) {
      this.entry.seeAlso = [];
    }
    this.entry.seeAlso.push(...uids);
    return this;
  }

  build(): SidecarEntry {
    return this.entry;
  }
}

/**
 * Create a new sidecar builder
 */
export function createSidecar(): SidecarBuilder {
  return new SidecarBuilder();
}

// ============================================================================
// EXAMPLE USAGE PATTERNS
// ============================================================================

/**
 * Example 1: Simple method documentation
 *
 * const listAddDoc = {
 *   description: "Adds an object to the end of the List<T>.",
 *   sections: [
 *     {
 *       heading: "Remarks",
 *       content: "If Count already equals Capacity, the capacity of the List<T> is increased..."
 *     },
 *     {
 *       heading: "Examples",
 *       content: "```csharp\nList<string> names = new List<string>();\nnames.Add(\"Alice\");\n```"
 *     },
 *     {
 *       heading: "Performance",
 *       content: "This method is an O(1) operation if Count < Capacity, otherwise O(n)."
 *     }
 *   ],
 *   seeAlso: [
 *     "member:System.Collections.Generic.List`1.Remove(T)",
 *     "member:System.Collections.Generic.List`1.AddRange(System.Collections.Generic.IEnumerable`1)"
 *   ]
 * };
 *
 * Example 2: Using the builder
 *
 * const stringLengthDoc = createSidecar()
 *   .description("Gets the number of characters in the current String object.")
 *   .remarks("The length of this string.")
 *   .examples("```csharp\nstring s = \"Hello\";\nConsole.WriteLine(s.Length); // Output: 5\n```")
 *   .performance("This property is an O(1) operation.")
 *   .seeAlso("type:System.String", "member:System.String.Chars(System.Int32)")
 *   .build();
 *
 * Example 3: Complex documentation with multiple sections
 *
 * const threadDoc = {
 *   description: "Creates and controls a thread, sets its priority, and gets its status.",
 *   sections: [
 *     {
 *       heading: "Remarks",
 *       content: "A Thread is created by passing a ThreadStart delegate..."
 *     },
 *     {
 *       heading: "Thread Safety",
 *       content: "This type is thread safe. Multiple threads can safely create and start..."
 *     },
 *     {
 *       heading: "Examples",
 *       content: "### Example 1: Starting a Thread\n\n```csharp\n...\n```\n\n### Example 2: ..."
 *     },
 *     {
 *       heading: "Platform Notes",
 *       content: "On Windows, threads are mapped to Windows threads. On Unix systems..."
 *     }
 *   ],
 *   seeAlso: ["type:System.Threading.ThreadStart", "ns:System.Threading"]
 * };
 */

// ============================================================================
// EXPORTS
// ============================================================================

export type { SidecarEntry, SidecarSection, SidecarCollection };
