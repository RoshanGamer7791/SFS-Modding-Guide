import * as manifestTypes from "../manifest";
import * as sidecarTypes from "../sidecars";
import mdx from "./mdx-builder/mdx";
import * as mdxTypes from "./mdx-builder/types";

/**
 * Injects sidecar content directly into the MDX builder
 */

/**
 * Add description section to builder if it exists in sidecar
 */
const addDescription = (
  builder: mdxTypes.IMarkdownBuilder,
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection
): mdxTypes.IMarkdownBuilder => {
  const sidecar = sidecars.entries[uid];
  if (!sidecar?.description) return builder;

  return builder.addText(sidecar.description);
};

/**
 * Add all sections from sidecar to builder in order
 * Automatically excludes "See Also" section (handled separately)
 */
const addSections = (
  builder: mdxTypes.IMarkdownBuilder,
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection
): mdxTypes.IMarkdownBuilder => {
  const sidecar = sidecars.entries[uid];
  if (!sidecar?.sections) return builder;

  const sections = sidecarTypes.getSectionsInOrder(sidecar);

  sections.forEach((section) => {
    builder.addHeading(section.heading, 2).addText(section.content);
  });

  return builder;
};

/**
 * Add a specific section by heading if it exists
 */
const addSection = (
  builder: mdxTypes.IMarkdownBuilder,
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection,
  heading: string,
  headingLevel: number = 2
): mdxTypes.IMarkdownBuilder => {
  const sidecar = sidecars.entries[uid];
  if (!sidecar) return builder;

  const section = sidecarTypes.getSection(sidecar, heading);
  if (!section) return builder;

  return builder
    .addHeading(section.heading, headingLevel)
    .addText(section.content);
};

/**
 * Add See Also section with links to related UIDs
 */
const addSeeAlso = (
  builder: mdxTypes.IMarkdownBuilder,
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection,
  manifest: manifestTypes.ManifestRoot,
  uidToSlugFn: (uid: manifestTypes.UID) => string
): mdxTypes.IMarkdownBuilder => {
  const sidecar = sidecars.entries[uid];
  if (!sidecar?.seeAlso || sidecar.seeAlso.length === 0) return builder;

  builder.addHeading("See Also", 2);

  const items = sidecar.seeAlso.map((refUid) => {
    // Try to resolve the name from manifest
    const name = getNameFromUid(refUid, manifest);
    const slug = uidToSlugFn(refUid);
    return mdx.link(name, slug);
  });

  return builder.addText(mdx.list(items, false));
};

/**
 * Helper: Get display name for a UID from manifest
 */
const getNameFromUid = (
  uid: manifestTypes.UID,
  manifest: manifestTypes.ManifestRoot
): string => {
  // Try different manifest collections
  if (manifest.types[uid]) {
    return manifest.types[uid].name;
  }
  if (manifest.members[uid]) {
    return manifest.members[uid].name;
  }
  if (manifest.namespaces[uid]) {
    return manifest.namespaces[uid].name;
  }
  if (manifest.assemblies[uid]) {
    return manifest.assemblies[uid].name;
  }

  // Fallback: extract from UID
  return uid.split(":")[1] || uid;
};

/**
 * Add complete sidecar documentation (description + all sections + see also)
 */
const addCompleteSidecar = (
  builder: mdxTypes.IMarkdownBuilder,
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection,
  manifest: manifestTypes.ManifestRoot,
  uidToSlugFn: (uid: manifestTypes.UID) => string
): mdxTypes.IMarkdownBuilder => {
  addDescription(builder, uid, sidecars);
  addSections(builder, uid, sidecars);
  addSeeAlso(builder, uid, sidecars, manifest, uidToSlugFn);
  return builder;
};

/**
 * Check if a sidecar exists and has content
 */
const hasSidecar = (
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection
): boolean => {
  const sidecar = sidecars.entries[uid];
  return sidecar ? sidecarTypes.hasDocumentation(sidecar) : false;
};

/**
 * Check if a specific section exists in a sidecar
 */
const hasSection = (
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection,
  heading: string
): boolean => {
  const sidecar = sidecars.entries[uid];
  return sidecar
    ? sidecarTypes.getSection(sidecar, heading) !== undefined
    : false;
};

/**
 * Get inline description for use in tables (fallback to empty string)
 */
const getInlineDescription = (
  uid: manifestTypes.UID,
  sidecars: sidecarTypes.SidecarCollection
): string => {
  const sidecar = sidecars.entries[uid];
  return sidecar?.description || "";
};

// ============================================================================
// Enhanced utils with sidecar integration
// ============================================================================

/**
 * Build a types table with inline descriptions from sidecars
 */
const getTypesTable = (
  uid: manifestTypes.UID,
  manifest: manifestTypes.ManifestRoot,
  sidecars: sidecarTypes.SidecarCollection,
  uidToSlugFn: (uid: manifestTypes.UID) => string
): string => {
  const tableHeadings = ["Type", "Description"];
  const tableRows: string[][] = [];

  let types: manifestTypes.UID[] = [];

  const identifyType = (uid: string) => uid.split(":")[0];
  const docType = identifyType(uid);

  if (docType === "ns") {
    const namespace = manifest.namespaces[uid];
    if (namespace) {
      types = namespace.types || [];
    } else {
      return "The namespace could not be found in the manifest.";
    }
  } else if (docType === "type") {
    const type = manifest.types[uid];
    if (type) {
      types = type.nestedTypes || [];
    } else {
      return "The type could not be found in the manifest.";
    }
  }

  types.forEach((typeUid) => {
    const type = manifest.types[typeUid];
    if (!type) return;

    tableRows.push([
      mdx.link(type.name, uidToSlugFn(type.uid)),
      getInlineDescription(type.uid, sidecars),
    ]);
  });

  return mdx.makeTable(tableHeadings, tableRows);
};

/**
 * Build a nested namespaces table with inline descriptions from sidecars
 */
const getNestedNamespacesTable = (
  uid: manifestTypes.UID,
  manifest: manifestTypes.ManifestRoot,
  sidecars: sidecarTypes.SidecarCollection,
  uidToSlugFn: (uid: manifestTypes.UID) => string
): string => {
  const tableHeadings = ["Namespace", "Description"];
  const tableRows: string[][] = [];
  const namespace = manifest.namespaces[uid];

  if (!namespace || !namespace.children) {
    return "The namespace could not be found in the manifest.";
  }

  namespace.children.forEach((nsUid) => {
    const ns = manifest.namespaces[nsUid];
    if (!ns) return;

    tableRows.push([
      mdx.link(ns.name, uidToSlugFn(ns.uid)),
      getInlineDescription(ns.uid, sidecars),
    ]);
  });

  return mdx.makeTable(tableHeadings, tableRows);
};

/**
 * Build a members table with inline descriptions from sidecars
 */
const getMembersTable = (
  typeUid: manifestTypes.UID,
  manifest: manifestTypes.ManifestRoot,
  sidecars: sidecarTypes.SidecarCollection,
  uidToSlugFn: (uid: manifestTypes.UID) => string,
  filterMemberKind?: manifestTypes.MemberKind[]
): string => {
  const type = manifest.types[typeUid];
  if (!type) return "The type could not be found in the manifest.";

  const tableHeadings = ["Member", "Description"];
  const tableRows: string[][] = [];

  const members = (type as any).members || [];

  members.forEach((memberUid: manifestTypes.UID) => {
    const member = manifest.members[memberUid];
    if (!member) return;

    // Filter by member kind if specified
    if (filterMemberKind && !filterMemberKind.includes(member.memberKind)) {
      return;
    }

    tableRows.push([
      mdx.link(member.name, uidToSlugFn(member.uid)),
      getInlineDescription(member.uid, sidecars),
    ]);
  });

  return mdx.makeTable(tableHeadings, tableRows);
};

const extractHeadingsFromMDX = (mdxContent: string): Record<string, string> => {
  const headingRegex = /^(#{1,6})\s+(.*)$/gm;
  const headings: Record<string, string> = {};
  let match;
  while ((match = headingRegex.exec(mdxContent)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    headings[text] = "#".repeat(level);
  }
  return headings;
};

export default {
  // Sidecar integration
  addDescription,
  addSection,
  addSections,
  addSeeAlso,
  addCompleteSidecar,
  hasSidecar,
  hasSection,
  getInlineDescription,

  // Table builders
  getTypesTable,
  getNestedNamespacesTable,
  getMembersTable,

  // Helpers
  getNameFromUid,
};
