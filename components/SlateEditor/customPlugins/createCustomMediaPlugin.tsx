import { Transforms, Path } from "slate";
import { createPluginFactory, getLastChildPath } from "@udecode/plate-common";
import {
  getOnKeyDownCaption,
  getWithSelectionCaption,
  MediaEmbedTweet,
  parseTwitterUrl,
  MediaPlugin,
  MediaEmbedVideo,
  parseVideoUrl,
  parseIframeUrl,
} from "@udecode/plate";

export const ELEMENT_MEDIA_EMBED = "media_embed";

const withCustomMediaEmbed = (editor) => {
  const { apply } = editor;

  editor.apply = (operation) => {
    apply(operation);

    if (
      operation.type === "insert_node" &&
      operation.node.type === ELEMENT_MEDIA_EMBED
    ) {
      const emptyNode = { type: "p", children: [{ text: "" }] };
      const lastChildPath = getLastChildPath([editor, []]);

      if (lastChildPath) {
        Transforms.insertNodes(editor, emptyNode, {
          at: Path.next(lastChildPath),
        });
      } else {
        // Fallback if no child node is found
        Transforms.insertNodes(editor, emptyNode);
      }
    }
  };

  return editor;
};

export const createMediaEmbedPlugin = createPluginFactory<MediaPlugin>({
  key: ELEMENT_MEDIA_EMBED,
  isElement: true,
  isVoid: true,
  handlers: {
    onKeyDown: getOnKeyDownCaption(ELEMENT_MEDIA_EMBED),
  },
  withOverrides: withCustomMediaEmbed,
  options: {
    transformUrl: parseIframeUrl,
    rules: [
      {
        parser: parseTwitterUrl,
        component: MediaEmbedTweet,
      },
      {
        parser: parseVideoUrl,
        component: MediaEmbedVideo,
      },
    ],
  },
  then: (editor, { type }) => ({
    deserializeHtml: {
      rules: [
        {
          validNodeName: "IFRAME",
        },
      ],
      getNode: (el: HTMLElement) => {
        const url = el.getAttribute("src");
        if (url) {
          return {
            type,
            url,
          };
        }
      },
    },
  }),
});
