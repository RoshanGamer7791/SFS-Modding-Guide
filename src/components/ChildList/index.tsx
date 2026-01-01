import React from "react";
import Link from "@docusaurus/Link";
import { useCurrentSidebarCategory } from "@docusaurus/theme-common";

export default function ChildList() {
  const category: any = useCurrentSidebarCategory();

  if (!category || !category.items) {
    return <p>No items found in this section.</p>;
  }

  return (
    <ul>
      {category.items.map((item, index) => (
        <li key={index}>
          <Link to={item.href}>
            <strong>{item.label}</strong>
          </Link>
          {/* Optional: Check if it's a category (folder) and label it */}
          {item.type === "category" && <em> (Folder)</em>}
        </li>
      ))}
    </ul>
  );
}
