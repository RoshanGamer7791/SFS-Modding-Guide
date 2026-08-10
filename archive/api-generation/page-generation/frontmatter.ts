import graymatter from "gray-matter";

const getFrontmatter = (mdxContent: string): Record<string, any> => {
  const result = graymatter(mdxContent);
  return result.data;
};
