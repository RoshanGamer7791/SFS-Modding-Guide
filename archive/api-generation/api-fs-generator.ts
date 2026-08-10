import * as fs from "fs";
import * as path from "path";
import { ManifestRoot, UID, TypeKind, MemberKind } from "./manifest";
import config from "../../config/generation_config";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================



// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// unused
function clearFolder(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        clearFolder(curPath);
        fs.rmdirSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
  }
}

function stripGenericParameters(name: string): string {
  return name.replace(/`\d+$/, "");
}

function sanitizeFileName(name: string): string {
  // Remove generic parameters and sanitize for file system
  return stripGenericParameters(name)
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-");
}

function shouldIgnoreType(type: any, config: FSConfiguration): boolean {
  if (type.isCompilerGenerated) return true;

  if (type.attributes) {
    for (const attrUid of type.attributes) {
      const attr = config.manifest.attributes[attrUid];
      if (attr && config.ignoreAttributes[attr.attributeType]) {
        return true;
      }
    }
  }

  return false;
}

function shouldIgnoreMember(member: any, config: FSConfiguration): boolean {
  if (member.isCompilerGenerated) return true;

  if (member.attributes) {
    for (const attrUid of member.attributes) {
      const attr = config.manifest.attributes[attrUid];
      if (attr && config.ignoreAttributes[attr.attributeType]) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// FILE STRUCTURE GENERATION
// ============================================================================

class FileStructureGenerator {
  private targetDir: string;
  private config: FSConfiguration;
  private manifest: ManifestRoot;

  constructor(config: FSConfiguration) {
    this.targetDir = config.outputDir;
    this.config = config;
    this.manifest = config.manifest;
  }

  generate(): void {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(this.targetDir)) {
      fs.mkdirSync(this.targetDir, { recursive: true });
    }

    // Process all namespaces
    for (const [uid, namespace] of Object.entries(this.manifest.namespaces)) {
      if (uid === "ns:<global>") {
        this.generateGlobalNamespace(namespace);
      }
      // Process root namespaces (direct children of global)
      else if (namespace.parent === "ns:<global>") {
        this.generateNamespace(namespace, this.targetDir);
      }
    }
  }

  private generateGlobalNamespace(namespace: any): void {
    // Only create global namespace folder if it has types
    if (!namespace.types || namespace.types.length === 0) {
      return;
    }

    const globalPath = path.join(this.targetDir, "Global Namespace");
    fs.mkdirSync(globalPath, { recursive: true });

    // Create namespace index file
    this.createFile(
      globalPath,
      "index.mdx",
      this.generateNamespaceContent(namespace)
    );

    // Create Types folder and add types
    const typesPath = path.join(globalPath, "Types");
    fs.mkdirSync(typesPath, { recursive: true });

    for (const typeUid of namespace.types) {
      const type = this.manifest.types[typeUid];
      if (
        type &&
        !shouldIgnoreType(type, this.) &&
        !type.enclosingType
      ) {
        this.generateType(type, typesPath);
      }
    }

    // Note: We DON'T process children here because they are already
    // processed as root namespaces in the generate() method
  }

  private generateNamespace(namespace: any, parentPath: string): void {
    const namespaceName = sanitizeFileName(namespace.name);
    const namespacePath = path.join(parentPath, namespaceName);

    // Create namespace directory
    fs.mkdirSync(namespacePath, { recursive: true });

    // Create namespace index file
    this.createFile(
      namespacePath,
      "index.mdx",
      this.generateNamespaceContent(namespace)
    );

    // Process child namespaces
    if (namespace.children && namespace.children.length > 0) {
      const namespacesPath = path.join(namespacePath, "Namespaces");
      fs.mkdirSync(namespacesPath, { recursive: true });

      for (const childUid of namespace.children) {
        const childNamespace = this.manifest.namespaces[childUid];
        if (childNamespace) {
          this.generateNamespace(childNamespace, namespacesPath);
        }
      }
    }

    // Process types in this namespace
    if (namespace.types && namespace.types.length > 0) {
      const typesPath = path.join(namespacePath, "Types");
      fs.mkdirSync(typesPath, { recursive: true });

      for (const typeUid of namespace.types) {
        const type = this.manifest.types[typeUid];
        if (
          type &&
          !shouldIgnoreType(type, this.config) &&
          !type.enclosingType
        ) {
          this.generateType(type, typesPath);
        }
      }
    }
  }

  private generateType(type: any, parentPath: string): void {
    const typeName = sanitizeFileName(type.name);
    const typePath = path.join(parentPath, typeName);

    // Delegates get single MDX files
    if (type.typekind === "delegate") {
      const fileName = `${typeName}.mdx`;
      this.createFile(parentPath, fileName, this.generateTypeContent(type));
      return;
    }

    if (type.typekind === "enum") {
      // Enums get a folder structure, for their fields
      fs.mkdirSync(typePath, { recursive: true });
      // Create index.mdx
      this.createFile(typePath, "index.mdx", this.generateTypeContent(type));
      // Generate enum fields
      if (type.members) {
        this.generateFields(typePath, type.members);
      }
      return;
    }

    // Classes, Structs, and Interfaces get a folder structure
    fs.mkdirSync(typePath, { recursive: true });

    // Create index.mdx
    this.createFile(typePath, "index.mdx", this.generateTypeContent(type));

    // Generate member folders
    if (type.members) {
      const membersByKind = this.groupMembersByKind(type.members);

      // Constructors
      if (membersByKind.constructors.length > 0 && !type.isStatic) {
        this.generateConstructors(type, typePath, membersByKind.constructors);
      }

      // Static constructor
      if (type.staticConstructor) {
        const staticCtor =
          this.manifest.staticConstructors[type.staticConstructor];
        if (staticCtor && !shouldIgnoreMember(staticCtor, this.manifest)) {
          this.createFile(
            typePath,
            "static-constructor.mdx",
            this.generateStaticConstructorContent(staticCtor)
          );
        }
      }

      // Methods
      if (membersByKind.methods.length > 0) {
        this.generateMethods(typePath, membersByKind.methods);
      }

      // Properties
      if (membersByKind.properties.length > 0) {
        this.generateProperties(typePath, membersByKind.properties);
      }

      // Fields
      if (membersByKind.fields.length > 0) {
        this.generateFields(typePath, membersByKind.fields);
      }

      // Events
      if (membersByKind.events.length > 0) {
        this.generateEvents(typePath, membersByKind.events);
      }
    }

    // Nested types
    if (type.nestedTypes && type.nestedTypes.length > 0) {
      this.generateNestedTypes(type, typePath);
    }
  }

  private generateNestedTypes(parentType: any, parentPath: string): void {
    const nestedPath = path.join(parentPath, "Nested-Types");
    fs.mkdirSync(nestedPath, { recursive: true });

    for (const nestedUid of parentType.nestedTypes) {
      const nestedType = this.manifest.types[nestedUid];
      if (nestedType && !shouldIgnoreType(nestedType, this.manifest)) {
        this.generateType(nestedType, nestedPath);
      }
    }
  }

  private generateConstructors(
    type: any,
    typePath: string,
    constructors: any[]
  ): void {
    const ctorPath = path.join(typePath, "Constructors");
    fs.mkdirSync(ctorPath, { recursive: true });

    constructors.forEach((ctor, index) => {
      const fileName =
        constructors.length === 1
          ? "Constructor.mdx"
          : `Constructor${index + 1}.mdx`;
      this.createFile(
        ctorPath,
        fileName,
        this.generateConstructorContent(ctor)
      );
    });
  }

  private generateMethods(typePath: string, methods: any[]): void {
    const methodPath = path.join(typePath, "Methods");
    fs.mkdirSync(methodPath, { recursive: true });

    const methodsByName = this.groupMethodsByName(methods);

    for (const [methodName, methodList] of Object.entries(methodsByName)) {
      const fileName = `${sanitizeFileName(methodName)}.mdx`;
      this.createFile(
        methodPath,
        fileName,
        this.generateMethodContent(methodList)
      );
    }
  }

  private generateProperties(typePath: string, properties: any[]): void {
    const propPath = path.join(typePath, "Properties");
    fs.mkdirSync(propPath, { recursive: true });

    for (const prop of properties) {
      const fileName = `${sanitizeFileName(prop.name)}.mdx`;
      this.createFile(propPath, fileName, this.generatePropertyContent(prop));
    }
  }

  private generateFields(typePath: string, fields: any[]): void {
    const fieldPath = path.join(typePath, "Fields");
    fs.mkdirSync(fieldPath, { recursive: true });

    for (const field of fields) {
      const fileName = `${sanitizeFileName(field.name)}.mdx`;
      this.createFile(fieldPath, fileName, this.generateFieldContent(field));
    }
  }

  private generateEvents(typePath: string, events: any[]): void {
    const eventPath = path.join(typePath, "Events");
    fs.mkdirSync(eventPath, { recursive: true });

    for (const event of events) {
      const fileName = `${sanitizeFileName(event.name)}.mdx`;
      this.createFile(eventPath, fileName, this.generateEventContent(event));
    }
  }

  private groupMembersByKind(memberUids: UID[]): any {
    const groups = {
      constructors: [] as any[],
      methods: [] as any[],
      properties: [] as any[],
      fields: [] as any[],
      events: [] as any[],
    };

    for (const uid of memberUids) {
      const member = this.manifest.members[uid];
      if (!member || shouldIgnoreMember(member, this.manifest)) continue;

      switch (member.memberKind) {
        case "constructor":
          groups.constructors.push(member);
          break;
        case "method":
        case "interface-method":
          groups.methods.push(member);
          break;
        case "property":
        case "interface-property":
          groups.properties.push(member);
          break;
        case "field":
        case "enum-field":
          groups.fields.push(member);
          break;
        case "event":
        case "interface-event":
          groups.events.push(member);
          break;
      }
    }

    return groups;
  }

  private groupMethodsByName(methods: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const method of methods) {
      if (!groups[method.name]) {
        groups[method.name] = [];
      }
      groups[method.name].push(method);
    }

    return groups;
  }

  private createFile(dir: string, fileName: string, content: string): void {
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, content, "utf8");
  }

  // Content generation methods (placeholders)
  private generateNamespaceContent(namespace: any): string {
    return `---
uid: ${namespace.uid}
title: ${namespace.name || "Global Namespace"}
type: namespace
---

# ${namespace.name || "Global Namespace"}

Namespace documentation placeholder.

**UID:** \`${namespace.uid}\`
${namespace.parent ? `**Parent:** \`${namespace.parent}\`` : ""}
`;
  }

  private generateTypeContent(type: any): string {
    return `---
uid: ${type.uid}
title: ${type.name}
type: ${type.typekind}
---

# ${type.name}

Type documentation placeholder.

**UID:** \`${type.uid}\`
**Kind:** ${type.typekind}
`;
  }

  private generateStaticConstructorContent(ctor: any): string {
    return `---
uid: ${ctor.uid}
title: Static Constructor
---

# Static Constructor

Static constructor documentation placeholder.
`;
  }

  private generateConstructorContent(ctor: any): string {
    return `---
uid: ${ctor.uid}
title: Constructor
---

# Constructor

Constructor documentation placeholder.
`;
  }

  private generateMethodContent(methods: any[]): string {
    const method = methods[0];
    return `---
uid: ${method.uid}
title: ${method.name}
---

# ${method.name}

Method documentation placeholder.

${methods.length > 1 ? `\n**Overloads:** ${methods.length}\n` : ""}
`;
  }

  private generatePropertyContent(prop: any): string {
    return `---
uid: ${prop.uid}
title: ${prop.name}
---

# ${prop.name}

Property documentation placeholder.
`;
  }

  private generateFieldContent(field: any): string {
    return `---
uid: ${field.uid}
title: ${field.name}
---

# ${field.name}

Field documentation placeholder.
`;
  }

  private generateEventContent(event: any): string {
    return `---
uid: ${event.uid}
title: ${event.name}
---

# ${event.name}

Event documentation placeholder.
`;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

export function generateFileStructure(
  manifest: ManifestRoot,
  targetDir: string
): void {
  const start = Date.now();
  const generator = new FileStructureGenerator({ manifest, targetDir });
  generator.generate();
  console.log(`File structure generated in: ${targetDir}`);
  console.log(`Time taken: ${(Date.now() - start) / 1000}s`);
}

// Example usage:
// const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
// generateFileStructure(manifest, './docs');
