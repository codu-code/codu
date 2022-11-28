import { SavePostInput } from "../schema/post";

export const maybeGenerateExerpt = (data: SavePostInput) => {
  if (!data.excerpt) {
    return {
      ...data,
      exerpt: data.body.substr(0, 120) // take the first sentence
    }
  }
  return data;
}