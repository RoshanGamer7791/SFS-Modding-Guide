import { ManifestRoot } from "./manifest";

export interface FSConfiguration {
  // If a type or member has any of these attributes, it will be ignored. Does not account for assemblies.
  ignoreAttributes: Record<string, boolean>;
  globalNamespaceName: string;
  outputDir: string;
  shouldGenerateSidecars: boolean;
  sidecarsOutputDir: string;
  gameVersion: string;

  manifest: ManifestRoot;
}
