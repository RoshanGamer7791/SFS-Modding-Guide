import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

// Base object
interface DocObject {
  type: string;
  name: string;
}

// Namespace
interface Namespace extends DocObject {
  type: "namespace";
  children: Array<TypeBase | Namespace>;
}

// Type base
interface TypeBase extends DocObject {
  type: "type";
  namespace: string;
  typekind: TypeKind;
  enclosingType?: string;
  genericParameters?: GenericParameter[];
  members: MemberBase[];
  nestedTypes?: TypeBase[];
}

type TypeKind = "class" | "struct" | "enum" | "interface" | "delegate";

// Class
interface ClassType extends TypeBase {
  typekind: "class";
  baseClass?: string;
  implementedInterfaces?: string[];
  accessModifiers?: AccessModifier;
  static?: boolean;
  sealed?: boolean;
  abstract?: boolean;
  partial?: boolean;
  members: Array<Method | Property | Field | Event | Constructor | EnumField>;
  staticConstructor?: StaticConstructor; // Only one allowed
}

// Struct
interface StructType extends TypeBase {
  typekind: "struct";
  baseClass?: string;
  implementedInterfaces?: string[];
  accessModifiers?: AccessModifier;
  static?: boolean;
  sealed?: boolean;
  abstract?: boolean;
  partial?: boolean;
}

// Enum
interface EnumType extends TypeBase {
  typekind: "enum";
  enumUnderlyingType?: string;
  members: EnumField[];
}

// Interface
interface InterfaceType extends TypeBase {
  typekind: "interface";
  implementedInterfaces?: string[];
}

// Delegate
interface DelegateType extends TypeBase {
  typekind: "delegate";
  delegateSignature: MethodSignature;
}

// Generic parameter
interface GenericParameter {
  name: string;
  constraints?: string[];
  defaultType?: string;
}

type AccessModifier =
  | "public"
  | "internal"
  | "protected"
  | "private"
  | "protected internal"
  | "private protected";

type MemberKind =
  | "property"
  | "field"
  | "method"
  | "event"
  | "constructor"
  | "enum-field";

// Member base
interface MemberBase extends DocObject {
  type: "member";
  memberKind: MemberKind;
  accessModifiers?: AccessModifier;
  static?: boolean;
  virtual?: boolean;
  override?: boolean;
  abstract?: boolean;
  sealed?: boolean;
  readonly?: boolean;
  const?: boolean;
  obsolete?: boolean | string;
  inheritedFrom?: string;
  implements?: string[];
}

// Static constructor (only one per class)
interface StaticConstructor extends DocObject, MethodSignature {
  type: "member";
  memberKind: "static-constructor";
}

// Constructor
interface Constructor extends MemberBase, MethodSignature {
  memberKind: "constructor";
}

// Method signature
interface MethodSignature {
  parameters: Array<Parameter>;
  returnType: string;
  genericParameters?: GenericParameter[];
}

interface Parameter {
  name: string;
  type: string;
  defaultValue?: string;
  paramsArray?: boolean;
}

// Method
interface Method extends MemberBase, MethodSignature {
  memberKind: "method";
}

// Property
interface Property extends MemberBase {
  memberKind: "property";
  propertyType: string;
  hasGetter: boolean;
  hasSetter: boolean;
  getterAccess?: AccessModifier;
  setterAccess?: AccessModifier;
}

// Field
interface Field extends MemberBase {
  memberKind: "field";
  fieldType: string;
  constantValue?: string;
}

// Event
interface Event extends MemberBase {
  memberKind: "event";
  eventType: string;
}

// Enum field
interface EnumField extends MemberBase {
  memberKind: "enum-field";
  value: number | string;
  isDefault?: boolean;
}

// Union types for all members and types

type AnyType = ClassType | StructType | EnumType | InterfaceType | DelegateType;
type AnyMember =
  | Method
  | Property
  | Field
  | Event
  | Constructor
  | EnumField
  | StaticConstructor;

type ManifestRoot = {
  namespaces: Namespace[];
  types: AnyType[]; // global namespace types
};

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/introduction"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="A guide to help you get started with modding Spaceflight Simulator"
    >
      <HomepageHeader />
      <main></main>
    </Layout>
  );
}
