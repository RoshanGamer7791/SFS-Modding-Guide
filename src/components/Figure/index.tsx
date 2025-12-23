/* eslint-disable react/prop-types,import/no-unresolved */
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function Figure({ src, caption, alt, widthpercent = "auto" }) {
  return (
    <figure
      style={{
        border: "1px solid #888",
        padding: 20,
        height: "auto",
        width: `${widthpercent == "auto" ? "auto" : widthpercent + "%"}`,
      }}
    >
      <img src={useBaseUrl(src)} alt={alt} style={{}} />
      <figcaption>{`${caption}`}</figcaption>
    </figure>
  );
}
