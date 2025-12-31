---
description: Overview of the architecture of the SFS Modding Guide, including its structure and components.
---

# Architecture

The SFS Modding Guide is structured to provide comprehensive documentation for modders interested in creating mods for the game. The architecture of the guide is designed to be modular and easily navigable, allowing users to find the information they need quickly.

## Underlying Structure

The documentation is built using Docusaurus, a modern static site generator that allows for easy content management and organization. The guide is divided into 3 main `docs` instances.

The landing page of the site is the "Getting Started" section, which provides an introduction to modding in SFS and guides users through the initial steps of creating and installing mods. The landing page is located at the root URL (`/`), and this was achieved by configuring the `slug` in the frontmatter of the `getting-started/index.mdx` file.

### `docs` (Docs)

This section contains the main documentation for modders, including guides, tutorials, and reference materials. It is organized into various categories such as conventions, best practices, and specific modding topics.

### `api` (API Reference)

This section contains the automatically generated C# API documentation for the game's codebase. It is organized by namespaces, classes, structs, enums, interfaces, and delegates, providing detailed information about each component's purpose and functionality.

### `internal-docs` (Internal Documentation)

This section contains documentation intended for contributors and maintainers of the SFS Modding Guide itself. It includes guidelines on contribution, documentation structure, style guides, and maintenance procedures.
