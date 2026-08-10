// Node.js script to generate a manifest of namespaces and types for the API docs
const fs = require("fs");
const path = require("path");

const API_ROOT = path.join(__dirname, "..", "api");
const OUTPUT = path.join(
  __dirname,
  "..",
  "src",
  "manifests",
  "namespace-manifest.json"
);

function parseFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const fileContent = fs.readFileSync(filePath, "utf8");
  const frontmatterMatch = fileContent.match(/^---([\s\S]*?)---/);
  let frontmatter = {};

  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];
    yaml.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (m) {
        let val = m[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        frontmatter[m[1]] = val;
      }
    });
  }

  return frontmatter;
}

// should trim leading name from url paths, dynamically
// e.g. /api/global-namespace/StatsMenu -> global-namespace/StatsMenu
// does not necessarily always trim /api/
function trimUrlFromStart(url, trimCount = 1) {
  const parts = url.split("/");
  if (parts.length > 2) {
    return parts.slice(trimCount + 1).join("/");
  }
  return url;
}

function getNamespaceEntries(dir, baseUrl = "") {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const indexPath = path.join(dir, entry.name, "index.mdx");
      const subDir = path.join(dir, entry.name);

      if (fs.existsSync(indexPath)) {
        // Check the frontmatter to determine if this is a namespace or a type
        const frontmatter = parseFrontmatter(indexPath);

        if (frontmatter.type === "namespace") {
          // This is a namespace - process recursively
          result.push({
            name: frontmatter.name || entry.name,
            type: "namespace",
            description: frontmatter.description,
            path: trimUrlFromStart(`${baseUrl}/${entry.name}`),
            children: getNamespaceEntries(subDir, `${baseUrl}/${entry.name}`),
          });
        } else if (frontmatter.type === "type" || frontmatter.typekind) {
          // This is a type with an index.mdx
          // Add the type itself
          const typeEntry = {
            name: frontmatter.name || entry.name,
            type: "type",
            typekind: frontmatter.typekind,
            namespace: frontmatter.namespace,
            enclosingType: frontmatter.enclosingType,
            description: frontmatter.description,
            path: trimUrlFromStart(`${baseUrl}/${entry.name}`),
          };
          result.push(typeEntry);

          // Now process any nested types (other .mdx files in this folder)
          const nestedEntries = fs.readdirSync(subDir, { withFileTypes: true });
          for (const nested of nestedEntries) {
            if (
              nested.isFile() &&
              nested.name.endsWith(".mdx") &&
              nested.name !== "index.mdx"
            ) {
              const nestedPath = path.join(subDir, nested.name);
              const nestedFrontmatter = parseFrontmatter(nestedPath);

              result.push({
                name:
                  nestedFrontmatter.name || nested.name.replace(/\.mdx$/, ""),
                type: nestedFrontmatter.type || "type",
                typekind: nestedFrontmatter.typekind,
                namespace: nestedFrontmatter.namespace,
                enclosingType:
                  nestedFrontmatter.enclosingType || typeEntry.name,
                description: nestedFrontmatter.description,
                path: trimUrlFromStart(
                  `${baseUrl}/${entry.name}/${nested.name.replace(
                    /\.mdx$/,
                    ""
                  )}`
                ),
              });
            }
          }
        } else {
          // Unknown structure - treat as namespace by default
          console.warn(
            `Warning: ${indexPath} has unclear type, treating as namespace`
          );
          result.push({
            name: entry.name,
            type: "namespace",
            path: trimUrlFromStart(`${baseUrl}/${entry.name}`),
            children: getNamespaceEntries(subDir, `${baseUrl}/${entry.name}`),
          });
        }
      } else {
        // No index.mdx - process all .mdx files in this folder as types
        const typeEntries = getNamespaceEntries(
          subDir,
          `${baseUrl}/${entry.name}`
        );
        result.push(...typeEntries);
      }
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".mdx") &&
      entry.name !== "index.mdx"
    ) {
      const filePath = path.join(dir, entry.name);
      const frontmatter = parseFrontmatter(filePath);

      result.push({
        name: frontmatter.name || entry.name.replace(/\.mdx$/, ""),
        type: frontmatter.type || "type",
        typekind: frontmatter.typekind,
        namespace: frontmatter.namespace,
        enclosingType: frontmatter.enclosingType,
        description: frontmatter.description,
        path: `${baseUrl}/${entry.name.replace(/\.mdx$/, "")}`,
      });
    }
  }

  return result;
}

function buildManifest() {
  const manifest = {};
  const namespaces = fs
    .readdirSync(API_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const ns of namespaces) {
    const nsPath = path.join(API_ROOT, ns);
    manifest[ns] = getNamespaceEntries(nsPath, `/api/${ns}`);
  }

  return manifest;
}

function main() {
  const manifest = buildManifest();
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2));
  console.log("Namespace manifest generated at", OUTPUT);
  console.log("\nManifest contents:");
  console.log(JSON.stringify(manifest, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { buildManifest };
