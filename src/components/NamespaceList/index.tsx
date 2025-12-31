import React from "react";
import manifest from "../../manifests/namespace-manifest.json";

interface NamespaceListProps {
  namespaceKey: string; // e.g. "global-namespace"
}

interface NamespaceEntry {
  name: string;
  type: string;
  typekind?: string;
  namespace?: string;
  enclosingType?: string;
  description?: string;
  path: string;
  children?: NamespaceEntry[];
}

const NamespaceList: React.FC<NamespaceListProps> = ({ namespaceKey }) => {
  // Get the entries for the given namespace key from the manifest
  const entries: NamespaceEntry[] = (manifest as any)[namespaceKey] || [];

  // Helper to get parent hierarchy from namespaceKey
  function getHierarchy(
    namespaceKey: string
  ): Array<{ name: string; path: string }> {
    if (
      !namespaceKey ||
      namespaceKey === "global-namespace" ||
      namespaceKey === ".global"
    ) {
      return [];
    }
    // For SFS.World, etc.
    const parts = namespaceKey.split(".");

    // Only show hierarchy if there's more than one level (i.e., it's nested)
    if (parts.length <= 1) {
      return [];
    }

    return parts.map((name, i) => ({
      name,
      path: `/api/${parts.slice(0, i + 1).join(".")}`,
    }));
  }

  // Helper to get nested namespaces
  function getNestedNamespaces(entries: NamespaceEntry[]): NamespaceEntry[] {
    return entries.filter((entry) => entry.type === "namespace");
  }

  // Recursively collect all types from the entire tree
  function collectAllTypes(entries: NamespaceEntry[]): NamespaceEntry[] {
    let result: NamespaceEntry[] = [];

    for (const entry of entries) {
      if (entry.type === "type") {
        result.push(entry);
      }
      if (
        entry.type === "namespace" &&
        entry.children &&
        entry.children.length > 0
      ) {
        result = result.concat(collectAllTypes(entry.children));
      }
    }

    return result;
  }

  // Render hierarchy
  const hierarchy = getHierarchy(namespaceKey);

  // Render nested namespaces
  const nestedNamespaces = getNestedNamespaces(entries);

  // Collect all types recursively
  const allTypes = collectAllTypes(entries);

  // Group types by kind
  const groupedTypes = {
    Classes: allTypes.filter((t) => t.typekind === "class"),
    Structs: allTypes.filter((t) => t.typekind === "struct"),
    Enums: allTypes.filter((t) => t.typekind === "enum"),
    Interfaces: allTypes.filter((t) => t.typekind === "interface"),
    Delegates: allTypes.filter((t) => t.typekind === "delegate"),
  };

  // Check if there are any types at all
  const hasAnyTypes = Object.values(groupedTypes).some(
    (list) => list.length > 0
  );

  return (
    <div>
      {/* Namespace Hierarchy (omit for root/global) */}
      {hierarchy.length > 0 && (
        <>
          <h2>Namespace Hierarchy</h2>
          <p>
            root
            {hierarchy.map((ns, i) => (
              <span key={i}>
                {" → "}
                <a href={ns.path}>{ns.name}</a>
              </span>
            ))}
          </p>
        </>
      )}

      {/* Nested Namespaces */}
      {nestedNamespaces.length > 0 && (
        <>
          <h2>Nested Namespaces</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {nestedNamespaces.map((ns) => (
                <tr key={ns.path}>
                  <td>
                    <a href={ns.path}>
                      <code>
                        {ns.name === ".global" ? "Global Namespace" : ns.name}
                      </code>
                    </a>
                  </td>
                  <td>{ns.description || "TBD"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Types */}
      {hasAnyTypes && <h2>Types</h2>}
      {Object.entries(groupedTypes).map(([kind, list]) => {
        if (list.length === 0) return null;

        return (
          <React.Fragment key={kind}>
            <h3>{kind}</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {list.map((type) => {
                  const displayName = type.enclosingType
                    ? `${type.enclosingType}.${type.name}`
                    : type.name;

                  return (
                    <tr key={type.path}>
                      <td>
                        <a href={type.path}>
                          <code>{displayName}</code>
                        </a>
                      </td>
                      <td>{type.description || "TBD"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </React.Fragment>
        );
      })}

      {!hasAnyTypes && nestedNamespaces.length === 0 && (
        <p>
          <em>No types or nested namespaces found in this namespace.</em>
        </p>
      )}
    </div>
  );
};

export default NamespaceList;
