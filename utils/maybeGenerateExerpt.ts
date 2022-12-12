import { SavePostInput } from "../schema/post";

export const maybeGenerateExerpt = (data: SavePostInput) => {
  if (!data.excerpt) {
    return {
      ...data,
      excerpt: data.body.substr(0, 156) // take the first sentence
    }
  }
  return data;
}