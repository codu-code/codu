import { Transforms, Path } from "slate";
import { createPluginFactory, getLastChildPath } from "@udecode/plate-common";
import {
  getOnKeyDownCaption,
  MediaEmbedTweet,
  parseTwitterUrl,
  MediaPlugin,
  MediaEmbedVideo,
  parseVideoUrl,
  EmbedUrlData,
} from "@udecode/plate";
import {
  parseCustomIframeUrl,
  parseCodepenUrl,
  processCodePen,
  parseCodeSandboxUrl,
  processCodeSandbox,
  parseFallbackUrl,
} from "../utils/customParseIframeUrl";

export const ELEMENT_MEDIA_EMBED = "media_embed";

const withCustomMediaEmbed = (editor: any) => {
  const { apply } = editor;

  editor.apply = (operation: any) => {
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

interface Props extends EmbedUrlData {
  defaultTab?: string;
  height?: string;
}

export function CodePen({
  url,
  defaultTab = "html,result",
  height = "300px",
}: Props) {
  const codePenSrc = new URL(processCodePen(url!));
  if (!codePenSrc.searchParams.get("default-tab")) {
    codePenSrc.searchParams.set("default-tab", defaultTab);
  }

  return (
    <iframe
      height={height}
      style={{ width: "100%" }}
      scrolling="no"
      src={codePenSrc.toString()}
      frameBorder="no"
      loading="lazy"
      allowFullScreen
      className="remove-padding-from-iframe"
    />
  );
}

export function CodeSandbox(props: EmbedUrlData) {
  const { url } = props;
  const processedUrl = processCodeSandbox(url!);

  return (
    <iframe
      className="remove-padding-from-iframe"
      src={processedUrl}
      frameBorder="0"
      allowFullScreen
      style={{ width: "100%", aspectRatio: "16 / 9" }}
    />
  );
}

export function GenericIframe(props: EmbedUrlData) {
  const { url } = props;
  console.log(url);

  return (
    <iframe
      className="remove-padding-from-iframe"
      src={url}
      allowFullScreen
      style={{ width: "100%", height: "300px" }}
    />
  );
}

export const createMediaEmbedPlugin = createPluginFactory<MediaPlugin>({
  key: ELEMENT_MEDIA_EMBED,
  isElement: true,
  isVoid: true,
  handlers: {
    onKeyDown: getOnKeyDownCaption(ELEMENT_MEDIA_EMBED),
  },
  withOverrides: withCustomMediaEmbed,
  options: {
    // disableCaption: true,
    transformUrl: parseCustomIframeUrl,
    rules: [
      {
        parser: parseVideoUrl,
        component: MediaEmbedVideo,
      },
      {
        parser: parseCodepenUrl,
        component: CodePen,
      },
      {
        parser: parseCodeSandboxUrl,
        component: CodeSandbox,
      },
      {
        parser: parseTwitterUrl,
        component: MediaEmbedTweet,
      },
      {
        parser: parseFallbackUrl,
        component: GenericIframe,
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
