# API Documentation Pipeline

> **⚠️ Note**: This pipeline has not been implemented yet. This documentation describes the planned architecture and workflow for the future API documentation system.

## Overview

The API documentation for the SFS Modding Guide is generated through an automated pipeline that extracts information from the game's C# codebase. This process ensures that the API reference remains up-to-date with the latest changes in the game's code.

The toolchain used is called "xDoc" (pronounced "ex-doc"), which is a custom documentation generator designed specifically for extracting and formatting API documentation from C# assemblies.

The docs instance for the API reference is located at `instances/api`, and it is configured in the main Docusaurus configuration file (`docusaurus.config.ts`) to be served under the `/api` route.

## Generation Process

1. **Manifest Extraction**: A custom tool analyzes the compiled C# assemblies (DLLs) of the game to extract metadata about namespaces, classes, structs, enums, interfaces, and delegates. This metadata is structured into a manifest file, `manifest.json`, which serves as the basis for generating the documentation. This separation allows the manifest to be used for other purposes beyond documentation generation, such as tooling, analysis, or integration with other systems. The C# tool (xDoc) is kept separate from the TypeScript-based documentation system to avoid complex integration issues.

2. **File Structure Creation**: Using the manifest file, another tool generates a hierarchical file structure that mirrors the organization of the codebase. Each type and member is represented as a markdown file, containing detailed documentation extracted from the code comments and metadata.

3. **Documentation Population**: The generated markdown files are populated with relevant information, including type definitions, member signatures, summaries, and usage examples. This step may also involve formatting and linking related types for easier navigation.

4. **Integration with Docusaurus**: The generated files are placed in the `instances/api` directory, which is configured as a separate docs instance in Docusaurus. This allows the API documentation to be seamlessly integrated into the overall SFS Modding Guide website. The actual API reference files are put in `instances/api/reference/`.

## Sidecars

Sidecars are how human-written documentation is integrated into the automatically generated API docs. They allow for additional context, examples, and explanations to be added to the generated files without modifying the generation process itself.

Sidecars are accessed by the generator through a `sidecars.json` file which is in the same directory as the `manifest.json` file.

Sidecars are markdown files stored in a parallel directory structure to the API reference files under a `sidecars/` folder. Each namespace, type, or member can have an associated sidecar file that contains additional documentation, named `Info.mdx`. For example, if the generated file is at `instances/api/reference/NamespaceA/ClassB.mdx`, the corresponding sidecar would be located at `instances/api/reference/sidecars/NamespaceA/ClassB/Info.mdx`.

### Edit This Page Integration

Each generated API documentation page includes an "Edit this page" button at the bottom. When clicked, this button redirects contributors to the corresponding sidecar file in the parallel `sidecars/` directory structure. This ensures that contributors never directly edit the auto-generated files, maintaining the integrity of the Zero Trust Principle while providing an intuitive editing workflow.

If a sidecar doesn't yet exist for a particular page, the "Edit this page" button will direct users to create one in the appropriate location within the `sidecars/` structure.

### Sidecar Preview Tool (Planned)

A separate scripted webpage will be available on the documentation site that allows contributors to preview their sidecar content before committing. This tool will:

- Accept sidecar markdown/MDX input (including frontmatter)
- Select or specify the target API element (namespace, type, or member)
- Render a live preview showing how the sidecar content will be injected into the final generated documentation
- Validate frontmatter fields and section structure
- Check for broken links or invalid UIDs in `see_also` references

This preview tool will significantly lower the barrier to contribution by allowing contributors to see their changes without needing to run the full generation pipeline locally.

Sidecars have 2 main features:

### 1. SEO and Metadata

Sidecars can include frontmatter metadata (like descriptions and keywords) that enhance the SEO of the generated API docs. The main frontmatter fields supported are:

#### `short_description`

A brief summary of the namespace, type, or member. This will be injected into the generated documentation's `description` frontmatter field. This helps improve search engine optimization (SEO) by providing concise and relevant information about the content.

Additionally, this short description may be used in various parts of the documentation site, such as in search results or tooltips, to give users a quick overview of the item. This will also be what appears when previewing the page on social media platforms in embedded links.

#### `keywords`

A list of relevant keywords for search optimization. This should be an array of strings.

#### `see_also`

A list of related types or members to link to for further reading. This will be injected into a "See Also" section in the generated documentation at the bottom of the page.

- This should be an array of strings, each representing a UID of a related type or member.
- Alternatively, any links can be added to this section using standard markdown link syntax.
- Extra scrutiny should be taken to ensure that the links are valid and point to relevant resources.

### 2. Content Augmentation

Sidecars can also include additional content that will be injected into the generated documentation. The way augmentation works is that the content of the sidecar is injected into the generated markdown file at a specific location.

For namespaces, this is at the top of the file, before the list of types. For types and members, this is after the main signature and summary, but before the detailed member list or additional sections.

Typical headings used in sidecars for content augmentation include:

- **Examples**: Code examples demonstrating how to use the type or member.
- **Remarks**: Additional notes or explanations about the type or member.
- **Usage**: Guidance on how to effectively use the type or member in modding.

### Section Conventions

To ensure consistency across sidecars, the following section conventions are recommended in order to properly structure the content:

- Use `## Summary` for a brief overview of the type or member.
  - Instead of being a separate section, the content under this heading will be merged into the generated summary section.
- Use `## Description` for a more detailed explanation.
- Use `## Examples` for code examples.
- Use `## Remarks` for additional notes or explanations.
- Use `## Usage` for practical guidance on using the type or member.
- Use `## Performance` for performance considerations.
- Use `## Thread Safety` for information about thread safety.
- Use `## Compatibility` for compatibility notes with different game versions or specific modding scenarios.
  - If a mod is known to alter this behavior and introduces incompatibilities, please mention that as well.

If a section has no content, it will be omitted from the final rendered documentation by the generation process.

### File Format: MDX vs Markdown

Sidecars use the `.mdx` extension to support potential React component usage for advanced documentation scenarios. However, MDX is fully backward compatible with standard Markdown—if no React components are used, the file is treated as plain Markdown. This allows contributors to write simple Markdown while keeping the door open for more advanced interactive documentation features in the future.

## Versioning

The API documentation is versioned alongside the main SFS Modding Guide documentation. Each version of the guide corresponds to a specific version of the game, ensuring that modders have access to accurate and relevant API information for the version they are working with.

When a new version of the game is released, the API documentation generation process is rerun against the updated codebase, and a new version of the API docs is created. This allows modders to reference the correct API information for their mods based on the game version they are targeting.

The most up-to-date version of the API docs is always available under the `/api` route, while previous versions can be accessed through the versioned docs feature of Docusaurus.

All older versions of the API docs are stored in the `@site/api_versioned_docs` directory.

### Dynamic Rendering

Older versions of the API use dynamic rendering through "shell" MDX files that load the actual content on-demand. This approach helps reduce redundancy and storage requirements by avoiding the need to duplicate large amounts of static content for each version.

The only drawback to this approach is that older versions of the API docs may load slightly slower due to the dynamic fetching of content, and SEO for older versions may be slightly less effective since the content is not statically present in the HTML at load time.

#### How It Works

```
@site/
  instances/
    api/                           # Current Latest Version.
      reference/
        NamespaceA/
          ClassB.mdx               <-- Full content for the latest version
        sidecars/
          NamespaceA/
            ClassB/
              Info.mdx             <-- Full sidecar for the latest version
  versioned_docs/
    api/
      version-1.0.0/
        reference/
          NamespaceA/
            ClassB.mdx             <-- Shell file. Loads content dynamically through react component
        sidecars/
          NamespaceA/
            ClassB/
              Info.mdx           <-- Full sidecar for this version
```

## `manifest.json` and `sidecars.json`

All metadata is stored at `"@site/metadata/<version>/manifest.json"` and `"@site/metadata/<version>/sidecars.json"`.

Manifest files contain all the information about the namespaces, types, and members extracted from the game's assemblies. It also contains metadata about the generation process itself, such as the timestamp and the version of the tool used. The manifest serves as an intermediate representation that decouples the C# assembly analysis (performed by xDoc) from the documentation generation process, allowing for flexibility in how the extracted metadata is utilized.

## Configuration

The API documentation generation process is configured through a set of configuration files located in the `config/` directory.

```
config/
  generation_config.ts             <-- Main configuration for API generation
  site-config.ts                   <-- Site-wide configuration settings
```

### `site-config.ts`

Contains the following field:

```typescript
gameVersionStack: Array<string>;
```

The `gameVersionStack` field is an array of game versions that the SFS Modding Guide supports. The latest version should be at the end of the array. Betas can also be included in this array, and they will be treated as separate versions for the purpose of API documentation generation.

### `generation_config.ts`

Contains the following fields:

```typescript
outputDir: string;
sidecarDir: string;
```

- `outputDir`: The directory where the generated API documentation files will be placed. Typically `instances/api/reference/` for the current version.
- `sidecarDir`: The directory where sidecar markdown files are stored for augmenting the generated documentation. Typically `instances/api/reference/sidecars/`.

Note that this repo should not contain any game assemblies. These must be provided by the user running the generation process, typically by copying them from their local installation of the game.

## Running the Generation

The API documentation generation process can be run using a command-line interface (CLI) tool provided in the `tools/` directory. It is a .NET 10 console application. In order to run it, you will need to have the .NET 10 SDK installed on your machine.

An NPM script is provided to simplify the process of running the generation tool. You will need to provide the paths to the game assemblies for the version you are generating docs for, and the version number itself.

```bash
npm run generate-api-docs <game_version> --assembly-paths <path1> <path2> ...
```

This will generate the API documentation for the specified game version and place the generated files in the configured output directory. If the version is the current latest version, it will generate the files in `instances/api/reference/`. It will also update the metadata files in `metadata/<version>/`.

The tool will also add this version to the `gameVersionStack` in `site-config.ts`, if it is not already present.

## The Zero Trust Principle

The API does not trust human contributors to create or delete any files under `instances/api/reference/` (excluding the `sidecars/` subdirectory). Even the sidecar files are generated as skeletons when the generation process is run for the first time for a given version, meaning no files should ever be deleted or added in the whole of `instances/api` or any version in `api_versioned_docs`. This is to ensure that the API documentation remains consistent and accurate with the game's codebase.

The only thing that human contributors are allowed to do is to fill in the sidecar files (e.g., `instances/api/reference/sidecars/NamespaceA/ClassB/Info.mdx`) with additional documentation. This also reduces the risk of accidental deletions or modifications that could break the documentation, and eases the burden of maintaining the API docs over time, as maintainers do not need to worry about manually keeping track of which files should exist or not, only the content of the sidecars.

The parallel directory structure for sidecars provides clear separation between auto-generated and human-written content, making it immediately obvious which files are safe to edit and preventing accidental modification of generated files.

### Versioning

To version the API docs for a new game version, follow these steps:

1. Clone the repo and install dependencies using `npm install`.
2. Run the generation process for the new game version using the command:
   ```bash
   npm run generate-api-docs <game_version> --assembly-paths <path1> <path2> ...
   ```
3. Review the generated sidecar skeleton files in `instances/api/reference/sidecars/` and fill in any additional documentation as needed.
4. Commit the changes to the repo and push them to the remote repository.

## Conclusion

The API documentation pipeline for the SFS Modding Guide is a robust and automated system that ensures modders have access to accurate and up-to-date information about the game's API. By leveraging automated tools and sidecars for human-written content, the pipeline provides a comprehensive and user-friendly reference that supports the modding community effectively.

The use of an intermediate manifest format (produced by the xDoc C# tool) allows for flexibility and separation of concerns, while the parallel sidecar directory structure maintains the integrity of auto-generated content through the Zero Trust Principle. The planned preview tool and "Edit this page" integration will further streamline the contribution process, making it easy for community members to enhance the documentation with examples, explanations, and practical guidance.
