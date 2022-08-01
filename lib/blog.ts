import { readdir, readFile } from "fs/promises";
import path from "path";
import matter from "gray-matter";

import { articlesDirectory } from "../config/site_settings";

export const getAllArticlesMetadata = async (): Promise<
  Record<string, any>[]
> => {
  try {
    const metadata: Record<string, any>[] = [];
    const dir = await readdir(path.join(process.cwd(), articlesDirectory));

    for (let i = 0; i < dir.length; i++) {
      const file = dir[i];
      const content = await readFile(
        path.join(process.cwd(), articlesDirectory, file)
      );

      metadata.push({
        ...matter(content).data,
        slug: file.replace(".md", ""),
      });
    }

    return metadata;
  } catch (error: any) {
    throw new Error("Error while reading articles...", { cause: error });
  }
};

export const getAllArticlePaths = async (): Promise<string[]> => {
  const files = await readdir(path.join(process.cwd(), articlesDirectory));

  return files.map((file) => `/articles/${file.replace(".md", "")}`);
};

export const getArticle = async (
  slug: string
): Promise<{ content: string; frontmatter: any}> => {
  const rawArticle = await readFile(
    path.join(process.cwd(), articlesDirectory, `${slug}.md`)
  );

  const parsedContent = matter(rawArticle);

  return {
    frontmatter: parsedContent.data,
    content: parsedContent.content,
  };
};
