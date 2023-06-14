import { Transforms, Path } from "slate";
import { createPluginFactory, getLastChildPath } from "@udecode/plate-common";
import {
  getOnKeyDownCaption,
  getWithSelectionCaption,
  MediaEmbedTweet,
  parseTwitterUrl,
  MediaPlugin,
  MediaEmbed,
  MediaEmbedVideo,
  parseVideoUrl,
  parseIframeUrl,
  EmbedUrlData
} from "@udecode/plate";
import { parseCustomIframeUrl, parseYoutubeUrl, parseCodepenUrl, processCodePen, parseCodeSandboxUrl, processCodeSandbox } from "./utils/customParseIframeUrl";
import { YouTube } from "../../markdocNodes/Youtube/Youtube";


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

// Update the Props interface to extend EmbedUrlData, 
// as that's what will be passed to the component by Plate
interface Props extends EmbedUrlData {
  defaultTab?: string;
  height?: string;
}

export function CodePen({
  url, // Note: changed from 'src' to 'url', as that's the property name in EmbedUrlData
  defaultTab = 'html,result',
  height = '300px',
}: Props) {
  const codePenSrc = new URL(processCodePen(url)); // changed from 'src' to 'url'
  if (!codePenSrc.searchParams.get('default-tab')) {
    codePenSrc.searchParams.set('default-tab', defaultTab);
  }

  return (
    <iframe
      height={height}
      style={{ width: '100%' }}
      scrolling="no"
      src={codePenSrc.toString()}
      frameBorder="no"
      loading="lazy"
      allowFullScreen
    />
  );
}

export function CodeSandbox(props: EmbedUrlData) {
  // Destructure the url from props, as we'll use it for the src of the iframe
  const { url } = props;

  return (
    <div style={{marginInline: '16px 0px'}}>
      <iframe
        src={processCodeSandbox(url)} // use url for the iframe src
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{width: '100%', aspectRatio: '16 / 9'}}
      />
    </div>
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
    disableCaption: true,
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
