import * as manifestTypes from "../../manifest";
import * as sidecarTypes from "../../sidecars";
import * as types from "../../types";
import MDXBuilder from "@kojamori/mdx-builder";
import utils from "../utils";

const { utils, mdxBuilder } = MDXBuilder;

const createNamespaceMDX = (
  config: types.FSConfiguration,
  namespace: manifestTypes.Namespace,
  sidecars: sidecarTypes.SidecarCollection,
  uidToSlugFn: (uid: manifestTypes.UID) => string
): string => {
  const { manifest } = config;

  const existsInManifest = manifest.namespaces[namespace.uid] !== undefined;
  if (!existsInManifest) {
    throw new Error(
      `Namespace with UID ${namespace.uid} does not exist in the manifest.`
    );
  }

  const hasTypes = namespace.types && namespace.types.length > 0;
  const hasNestedNamespaces =
    namespace.children && namespace.children.length > 0;

  const builder = new mdxBuilder.MarkdownBuilder();

  builder
    .setFrontMatter("title", `${namespace.name} Namespace`)
    .setFrontMatter(
      "description",
      getInlineDescription(namespace.uid, sidecars) ||
        `Documentation for the ${namespace.name} namespace.`
    )
    .setFrontMatter("slug", uidToSlugFn(namespace.uid))
    .setFrontMatter("sidebar_label", namespace.name);

  // Add description if exists
  if (hasSidecar(namespace.uid, sidecars)) {
    builder.addHeading("Overview", 2);
    addDescription(builder, namespace.uid, sidecars);
  }

  // Types section
  builder
    .addHeading("Types", 2)
    .addText(
      hasTypes
        ? getTypesTable(namespace.uid, manifest, sidecars, uidToSlugFn)
        : "This namespace does not contain any types."
    );

  // Nested namespaces section
  if (hasNestedNamespaces) {
    builder
      .addHeading("Nested Namespaces", 2)
      .addText(
        getNestedNamespacesTable(namespace.uid, manifest, sidecars, uidToSlugFn)
      );
  }

  // Add remaining sidecar sections (Remarks, Examples, etc.)
  addSections(builder, namespace.uid, sidecars);

  // See Also (always last)
  addSeeAlso(builder, namespace.uid, sidecars, manifest, uidToSlugFn);

  return builder.build();
};
