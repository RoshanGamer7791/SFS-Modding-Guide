// ============================================================================
// .NET Framework 4.8 / C# 7.3 Type Manifest Schema (UID-Based Architecture)
// ============================================================================

// ============================================================================
// UID SYSTEM
// ============================================================================

// Unique identifier format for .NET elements
// Examples:
// - Assembly: "asm:mscorlib"
// - Namespace: "ns:System.Collections.Generic"
// - Type: "type:System.String" or "type:System.Collections.Generic.List`1"
// - Member: "member:System.String.Length" or "member:System.Collections.Generic.List`1.Add(T)"
// - Generic Parameter: "gparam:System.Collections.Generic.List`1.T"
// - Attribute: "attr:00000001"

type UID = string;

// Base object with UID
interface DocObject {
  uid: UID;
  name: string;
  attributes?: UID[]; // References to AttributeData UIDs
  xmlDocumentation?: XmlDocumentation;
}

// ============================================================================
// ATTRIBUTES
// ============================================================================

interface AttributeData {
  uid: UID;
  attributeType: UID; // Reference to type UID
  constructorArguments?: AttributeArgument[];
  namedArguments?: NamedAttributeArgument[];
}

interface AttributeArgument {
  value: AttributeValue;
  type: UID; // Reference to type UID
}

interface NamedAttributeArgument {
  memberName: string;
  value: AttributeValue;
  type: UID; // Reference to type UID
  isField: boolean;
}

type AttributeValue =
  | string
  | number
  | boolean
  | null
  | AttributeValue[]
  | { type: "typeref"; uid: UID } // Type references
  | { type: "enum"; uid: UID; value: string | number }; // Enum values

// ============================================================================
// XML DOCUMENTATION
// ============================================================================

interface XmlDocumentation {
  summary?: string;
  remarks?: string;
  returns?: string;
  examples?: string[];
  parameters?: Record<string, string>;
  typeParameters?: Record<string, string>;
  exceptions?: { uid: UID; description: string }[]; // UID references to exception types
  seeAlso?: UID[]; // References to other UIDs
}

// For members.
interface SidecarDocumentationBase {
  description: string;
}

interface SidecarTypeDocumentation extends SidecarDocumentationBase {
  versionAdded?: string;
  remarks?: string;
  examples?: string[];
  seeAlso?: UID[]; // References to other UIDs
}

// ============================================================================
// ASSEMBLY INFORMATION
// ============================================================================

interface AssemblyInfo {
  uid: UID; // e.g., "asm:mscorlib"
  name: string;
  version: string;
  culture?: string;
  publicKeyToken?: string;
  attributes?: UID[]; // References to AttributeData UIDs
  namespaces?: UID[]; // References to namespace UIDs in this assembly
  types?: UID[]; // References to type UIDs defined in this assembly
}

// ============================================================================
// NAMESPACE
// ============================================================================

interface Namespace extends DocObject {
  type: "namespace";
  parent?: UID; // Reference to parent namespace UID (if nested)
  children?: UID[]; // References to child namespace UIDs
  types?: UID[]; // References to type UIDs in this namespace
}

// ============================================================================
// GENERIC PARAMETER WITH VARIANCE AND ENHANCED CONSTRAINTS
// ============================================================================

type GenericVariance = "none" | "out" | "in";

type ConstraintKind = "class" | "struct" | "new()" | "type" | "naked";

interface GenericConstraint {
  kind: ConstraintKind;
  typeReference?: UID; // Reference to type UID for BaseType or NakedType constraints
}

interface GenericParameter {
  uid: UID; // e.g., "gparam:System.Collections.Generic.List`1.T"
  name: string;
  variance?: GenericVariance;
  constraints?: GenericConstraint[];
  attributes?: UID[]; // References to AttributeData UIDs
  xmlDocumentation?: string;
}

// ============================================================================
// STRING LITERAL TYPES (Backwards compatible with previous enum values)
// ============================================================================

type TypeKind = "class" | "struct" | "enum" | "interface" | "delegate";

type MemberKind =
  | "constructor"
  | "finalizer"
  | "method"
  | "property"
  | "field"
  | "event"
  | "enum-field"
  | "interface-method"
  | "interface-property"
  | "interface-event"
  | "operator"
  | "conversion";

type AccessModifier =
  | "public"
  | "internal"
  | "protected"
  | "private"
  | "protected internal"
  | "private protected";

type EnumUnderlyingType =
  | "byte"
  | "sbyte"
  | "short"
  | "ushort"
  | "int"
  | "uint"
  | "long"
  | "ulong";

type OperatorType =
  | "+" // UnaryPlus / Addition
  | "-" // UnaryMinus / Subtraction
  | "!" // LogicalNot
  | "~" // BitwiseNot
  | "++" // Increment
  | "--" // Decrement
  | "true"
  | "false"
  | "*" // Multiplication
  | "/" // Division
  | "%" // Modulus
  | "&" // BitwiseAnd
  | "|" // BitwiseOr
  | "^" // BitwiseXor
  | "<<" // LeftShift
  | ">>" // RightShift
  | "==" // Equality
  | "!=" // Inequality
  | "<" // LessThan
  | ">" // GreaterThan
  | "<=" // LessThanOrEqual
  | ">="; // GreaterThanOrEqual

type ConversionType = "implicit" | "explicit";

// ============================================================================
// METHOD SIGNATURE
// ============================================================================

interface Parameter {
  name: string;
  type: UID; // Reference to type UID
  defaultValue?: ParameterDefaultValue;
  isParams?: boolean;
  isRef?: boolean;
  isOut?: boolean;
  isThis?: boolean;
  isOptional?: boolean;
  attributes?: UID[]; // References to AttributeData UIDs
}

type ParameterDefaultValue =
  | { kind: "value"; value: string | number | boolean | null }
  | { kind: "default" }
  | { kind: "none" };

interface MethodSignature {
  parameters: Parameter[];
  returnType: UID; // Reference to type UID
  returnTypeAttributes?: UID[]; // References to AttributeData UIDs
  genericParameters?: UID[]; // References to GenericParameter UIDs
}

// ============================================================================
// PROPERTY/EVENT ACCESSOR INFORMATION
// ============================================================================

interface AccessorInfo {
  attributes?: UID[]; // References to AttributeData UIDs
  accessModifier?: AccessModifier;
}

// ============================================================================
// TYPE DEFINITIONS - Generic Base
// ============================================================================

interface BaseTypeDefinition<TKind extends TypeKind> extends DocObject {
  type: "type";
  typekind: TKind;
  namespace: UID; // Reference to namespace UID
  assembly: UID; // Reference to assembly UID
  enclosingType?: UID; // Reference to enclosing type UID for nested types
  nestedTypes?: UID[]; // References to nested type UIDs
  members?: UID[]; // References to member UIDs
}

// Static Constructor
interface StaticConstructor {
  uid: UID;
  name: ".cctor";
  attributes?: UID[]; // References to AttributeData UIDs
  isCompilerGenerated?: boolean;
}

// Class Type
interface ClassType extends BaseTypeDefinition<"class"> {
  accessModifiers: AccessModifier;
  genericParameters?: UID[]; // References to GenericParameter UIDs
  baseClass?: UID; // Reference to base class type UID
  implementedInterfaces?: UID[]; // References to interface type UIDs
  isStatic?: boolean;
  isSealed?: boolean;
  isAbstract?: boolean;
  isPartial?: boolean;
  isUnsafe?: boolean;
  isCompilerGenerated?: boolean;
  staticConstructor?: UID; // Reference to StaticConstructor UID
}

// Struct Type
interface StructType extends BaseTypeDefinition<"struct"> {
  accessModifiers: AccessModifier;
  genericParameters?: UID[]; // References to GenericParameter UIDs
  implementedInterfaces?: UID[]; // References to interface type UIDs
  isPartial?: boolean;
  isReadonly?: boolean;
  isUnsafe?: boolean;
  isCompilerGenerated?: boolean;
  staticConstructor?: UID; // Reference to StaticConstructor UID
}

// Enum Type
interface EnumType extends BaseTypeDefinition<"enum"> {
  accessModifiers: AccessModifier;
  underlyingType?: EnumUnderlyingType;
}

// Interface Type
interface InterfaceType extends BaseTypeDefinition<"interface"> {
  accessModifiers: AccessModifier;
  genericParameters?: UID[]; // References to GenericParameter UIDs
  implementedInterfaces?: UID[]; // References to inherited interface type UIDs
  isPartial?: boolean;
  isUnsafe?: boolean;
}

// Delegate Type
interface DelegateType extends DocObject {
  type: "type";
  typekind: "delegate";
  namespace: UID; // Reference to namespace UID
  assembly: UID; // Reference to assembly UID
  enclosingType?: UID; // Reference to enclosing type UID
  nestedTypes?: UID[]; // References to nested type UIDs
  accessModifiers: AccessModifier;
  genericParameters?: UID[]; // References to GenericParameter UIDs
  signature: MethodSignature;
  isUnsafe?: boolean;
}

type AnyType = ClassType | StructType | EnumType | InterfaceType | DelegateType;

// ============================================================================
// MEMBER DEFINITIONS - Generic Base
// ============================================================================

interface BaseMemberDefinition<TKind extends MemberKind> extends DocObject {
  type: "member";
  memberKind: TKind;
  declaringType: UID; // Reference to the type UID that declares this member
  inheritedFrom?: UID; // Reference to type UID this member was inherited from
}

// Constructor
interface Constructor
  extends BaseMemberDefinition<"constructor">,
    MethodSignature {
  accessModifiers: AccessModifier;
  returnType: UID; // Reference to void type UID
  isCompilerGenerated?: boolean;
}

// Finalizer
interface Finalizer extends BaseMemberDefinition<"finalizer"> {
  isUnsafe?: boolean;
  isCompilerGenerated?: boolean;
}

// Method
interface Method extends BaseMemberDefinition<"method">, MethodSignature {
  accessModifiers: AccessModifier;
  isStatic?: boolean;
  isVirtual?: boolean;
  isOverride?: boolean;
  isAbstract?: boolean;
  isSealed?: boolean;
  isExtern?: boolean;
  isPartial?: boolean;
  isPartialImplementation?: boolean;
  isPartialDefinition?: boolean;
  isAsync?: boolean;
  isUnsafe?: boolean;
  isNew?: boolean;
  isCompilerGenerated?: boolean;
  explicitInterfaceImplementation?: UID; // Reference to interface member UID
}

// Property
interface Property extends BaseMemberDefinition<"property"> {
  accessModifiers: AccessModifier;
  propertyType: UID; // Reference to type UID
  hasGetter: boolean;
  hasSetter: boolean;
  getterInfo?: AccessorInfo;
  setterInfo?: AccessorInfo;
  indexParameters?: Parameter[];
  isStatic?: boolean;
  isVirtual?: boolean;
  isOverride?: boolean;
  isAbstract?: boolean;
  isSealed?: boolean;
  isUnsafe?: boolean;
  isNew?: boolean;
  isCompilerGenerated?: boolean;
  explicitInterfaceImplementation?: UID; // Reference to interface member UID
}

// Field
interface Field extends BaseMemberDefinition<"field"> {
  accessModifiers: AccessModifier;
  fieldType: UID; // Reference to type UID
  isStatic?: boolean;
  isReadonly?: boolean;
  isConst?: boolean;
  isVolatile?: boolean;
  isUnsafe?: boolean;
  isNew?: boolean;
  isFixed?: boolean;
  fixedSize?: number;
  constantValue?: string | number | boolean | null;
  isCompilerGenerated?: boolean;
}

// Event
interface Event extends BaseMemberDefinition<"event"> {
  accessModifiers: AccessModifier;
  eventType: UID; // Reference to delegate type UID
  addInfo?: AccessorInfo;
  removeInfo?: AccessorInfo;
  isStatic?: boolean;
  isVirtual?: boolean;
  isOverride?: boolean;
  isAbstract?: boolean;
  isSealed?: boolean;
  isUnsafe?: boolean;
  isNew?: boolean;
  isCompilerGenerated?: boolean;
  explicitInterfaceImplementation?: UID; // Reference to interface member UID
}

// Enum Member
interface EnumMember extends BaseMemberDefinition<"enum-field"> {
  value: number | string;
  isDefault?: boolean;
}

// Operator Overload
interface Operator extends BaseMemberDefinition<"operator"> {
  operatorType: OperatorType;
  returnType: UID; // Reference to type UID
  parameters: Parameter[];
  isStatic: boolean;
  isUnsafe?: boolean;
}

// Conversion Operator
interface Conversion extends BaseMemberDefinition<"conversion"> {
  conversionType: ConversionType;
  sourceType: UID; // Reference to type UID
  targetType: UID; // Reference to type UID
  isStatic: boolean;
  isUnsafe?: boolean;
}

// Interface Method
interface InterfaceMethod
  extends BaseMemberDefinition<"interface-method">,
    MethodSignature {
  isNew?: boolean;
}

// Interface Property
interface InterfaceProperty extends BaseMemberDefinition<"interface-property"> {
  propertyType: UID; // Reference to type UID
  hasGetter: boolean;
  hasSetter: boolean;
  indexParameters?: Parameter[];
  isNew?: boolean;
}

// Interface Event
interface InterfaceEvent extends BaseMemberDefinition<"interface-event"> {
  eventType: UID; // Reference to delegate type UID
  isNew?: boolean;
}

// Member unions
type ClassMember =
  | Constructor
  | Finalizer
  | Method
  | Property
  | Field
  | Event
  | Operator
  | Conversion;
type StructMember =
  | Constructor
  | Method
  | Property
  | Field
  | Event
  | Operator
  | Conversion;
type InterfaceMember = InterfaceMethod | InterfaceProperty | InterfaceEvent;

type AnyMember =
  | Constructor
  | Finalizer
  | Method
  | Property
  | Field
  | Event
  | EnumMember
  | InterfaceMethod
  | InterfaceProperty
  | InterfaceEvent
  | Operator
  | Conversion;

// ============================================================================
// ROOT MANIFEST STRUCTURE
// ============================================================================

interface ManifestRoot {
  // Flat collections indexed by UID for O(1) lookup
  assemblies: Record<UID, AssemblyInfo>;
  namespaces: Record<UID, Namespace>;
  types: Record<UID, AnyType>;
  members: Record<UID, AnyMember>;
  genericParameters: Record<UID, GenericParameter>;
  attributes: Record<UID, AttributeData>;
  staticConstructors: Record<UID, StaticConstructor>;

  // Optional: Entry points for navigation
  rootNamespaces?: UID[]; // Top-level namespaces
  primaryAssembly?: UID; // Main assembly being documented

  // Generation metadata
  metadata: {
    author: string; // Tool or person who generated the manifest
    generatedOn: number; // Timestamp
    toolVersion: string; // Version of the tool that generated the manifest
    otherInfo?: Record<string, any>; // Any additional metadata
  };

  // UID Format Guide:
  // =================
  // Assembly:          "asm:{AssemblyName}"
  //                    Example: "asm:mscorlib"
  //
  // Namespace:         "ns:{FullNamespaceName}"
  //                    Example: "ns:System.Collections.Generic"
  //
  // Type:              "type:{FullTypeName}"
  //                    Example: "type:System.String"
  //                    Example: "type:System.Collections.Generic.List`1"
  //                    Example: "type:OuterType.InnerType"
  //
  // Member:            "member:{FullTypeName}.{MemberName}({Signature})"
  //                    Example: "member:System.String.Length"
  //                    Example: "member:System.Collections.Generic.List`1.Add(T)"
  //                    Example: "member:System.String.Substring(System.Int32,System.Int32)"
  //
  // Generic Parameter: "gparam:{FullTypeName}.{ParameterName}"
  //                    Example: "gparam:System.Collections.Generic.List`1.T"
  //                    Example: "gparam:System.Collections.Generic.Dictionary`2.TKey"
  //
  // Attribute:         "attr:{Guid}" or "attr:{SequentialId}"
  //                    Example: "attr:00000001"
  //
  // Static Constructor:"member:{FullTypeName}..cctor"
  //                    Example: "member:MyNamespace.MyClass..cctor"
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isClassType(type: AnyType): type is ClassType {
  return type.typekind === "class";
}

export function isStructType(type: AnyType): type is StructType {
  return type.typekind === "struct";
}

export function isEnumType(type: AnyType): type is EnumType {
  return type.typekind === "enum";
}

export function isInterfaceType(type: AnyType): type is InterfaceType {
  return type.typekind === "interface";
}

export function isDelegateType(type: AnyType): type is DelegateType {
  return type.typekind === "delegate";
}

export function isConstructor(member: AnyMember): member is Constructor {
  return member.memberKind === "constructor";
}

export function isFinalizer(member: AnyMember): member is Finalizer {
  return member.memberKind === "finalizer";
}

export function isMethod(member: AnyMember): member is Method {
  return member.memberKind === "method";
}

export function isProperty(member: AnyMember): member is Property {
  return member.memberKind === "property";
}

export function isField(member: AnyMember): member is Field {
  return member.memberKind === "field";
}

export function isEvent(member: AnyMember): member is Event {
  return member.memberKind === "event";
}

export function isEnumMember(member: AnyMember): member is EnumMember {
  return member.memberKind === "enum-field";
}

export function isInterfaceMethod(
  member: AnyMember
): member is InterfaceMethod {
  return member.memberKind === "interface-method";
}

export function isInterfaceProperty(
  member: AnyMember
): member is InterfaceProperty {
  return member.memberKind === "interface-property";
}

export function isInterfaceEvent(member: AnyMember): member is InterfaceEvent {
  return member.memberKind === "interface-event";
}

export function isOperator(member: AnyMember): member is Operator {
  return member.memberKind === "operator";
}

export function isConversion(member: AnyMember): member is Conversion {
  return member.memberKind === "conversion";
}

export function isExtensionMethod(member: AnyMember): member is Method {
  return (
    isMethod(member) &&
    member.isStatic === true &&
    member.parameters.length > 0 &&
    member.parameters[0].isThis === true
  );
}

export function isPartialMethodDefinition(member: AnyMember): member is Method {
  return isMethod(member) && member.isPartialDefinition === true;
}

export function isPartialMethodImplementation(
  member: AnyMember
): member is Method {
  return isMethod(member) && member.isPartialImplementation === true;
}

export function isFixedBuffer(member: AnyMember): member is Field {
  return isField(member) && member.isFixed === true;
}

export function isCompilerGeneratedMember(member: AnyMember): boolean {
  if ("isCompilerGenerated" in member) {
    return member.isCompilerGenerated === true;
  }
  return false;
}

export function isCompilerGeneratedType(type: AnyType): boolean {
  if ("isCompilerGenerated" in type) {
    return type.isCompilerGenerated === true;
  }
  return false;
}

export function hasExplicitInterfaceImplementation(
  member: Method | Property | Event
): boolean {
  return member.explicitInterfaceImplementation !== undefined;
}

// ============================================================================
// UTILITY FUNCTIONS FOR UID-BASED NAVIGATION
// ============================================================================

export function resolveType(
  manifest: ManifestRoot,
  uid: UID
): AnyType | undefined {
  return manifest.types[uid];
}

export function resolveMember(
  manifest: ManifestRoot,
  uid: UID
): AnyMember | undefined {
  return manifest.members[uid];
}

export function resolveNamespace(
  manifest: ManifestRoot,
  uid: UID
): Namespace | undefined {
  return manifest.namespaces[uid];
}

export function resolveAssembly(
  manifest: ManifestRoot,
  uid: UID
): AssemblyInfo | undefined {
  return manifest.assemblies[uid];
}

export function resolveGenericParameter(
  manifest: ManifestRoot,
  uid: UID
): GenericParameter | undefined {
  return manifest.genericParameters[uid];
}

export function resolveAttribute(
  manifest: ManifestRoot,
  uid: UID
): AttributeData | undefined {
  return manifest.attributes[uid];
}

export function getTypeMembers(
  manifest: ManifestRoot,
  type: AnyType
): AnyMember[] {
  if (!(type as any).members) return [];
  return (type as any).members
    .map((uid: UID) => manifest.members[uid])
    .filter((m): m is AnyMember => m !== undefined);
}

export function getNestedTypes(
  manifest: ManifestRoot,
  type: AnyType
): AnyType[] {
  if (!type.nestedTypes) return [];
  return type.nestedTypes
    .map((uid) => manifest.types[uid])
    .filter((t): t is AnyType => t !== undefined);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  UID,
  DocObject,
  AssemblyInfo,
  Namespace,
  AttributeData,
  AttributeArgument,
  NamedAttributeArgument,
  AttributeValue,
  XmlDocumentation,
  SidecarDocumentationBase,
  SidecarTypeDocumentation,
  GenericParameter,
  GenericConstraint,
  Parameter,
  ParameterDefaultValue,
  MethodSignature,
  AccessorInfo,
  BaseTypeDefinition,
  ClassType,
  StructType,
  EnumType,
  InterfaceType,
  DelegateType,
  AnyType,
  BaseMemberDefinition,
  StaticConstructor,
  Constructor,
  Finalizer,
  Method,
  Property,
  Field,
  Event,
  EnumMember,
  InterfaceMethod,
  InterfaceProperty,
  InterfaceEvent,
  Operator,
  Conversion,
  ClassMember,
  StructMember,
  InterfaceMember,
  AnyMember,
  ManifestRoot,
  TypeKind,
  MemberKind,
  AccessModifier,
  EnumUnderlyingType,
  GenericVariance,
  ConstraintKind,
  OperatorType,
  ConversionType,
};
