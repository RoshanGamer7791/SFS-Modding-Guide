/* eslint-disable react/prop-types,import/no-unresolved */
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function Figure({ src, caption, alt }) {
  return (
    <figure style={{ border: "1px solid #888", padding: 20 }}>
      <img src={useBaseUrl(src)} alt={alt} />
      <figcaption>{`Figure: ${caption}`}</figcaption>
    </figure>
  );
}
