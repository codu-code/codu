import * as React from "react";
import { YouTube } from "../Youtube/Youtube";
import { CodePen } from "../Codepen/CodePen";
import { CodeSandbox } from "../Codesandbox/CodeSandbox";
import { FallbackMedia } from "../FallbackMedia/FallbackMedia";


interface MediaProps {
  src: string;
  type?: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

const getYoutubeRegex = () =>
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?(?=.*v=\w+)|youtu\.be\/)([\w-]{11})(?:\S+)?$/i;

const getEmbedUrlRegex = () =>
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})(?:\S+)?$/i;

const getCodesandboxRegex = () =>
  /^https?:\/\/codesandbox\.io\/s\/([\w-]+)(?:\?.*)?$/i;

const getCodepenRegex = () =>
  /^(?:https?:\/\/)?(?:www\.)?codepen\.io\/[\w-]+\/(?:embed|pen)\/([\w-]+)(?:\S+)?$/i;


const protocolRegex = /^(f|ht)tps?:\/\//i;
const youtubeRegex = getYoutubeRegex();
const embedUrlRegex = getEmbedUrlRegex();
const codesandboxRegex = getCodesandboxRegex();
const codepenRegex = getCodepenRegex();


export function Media(props: React.ReactPropTypes) {

  const MEDIA_TYPES = {
  YOUTUBE: "youtube",
  CODEPEN: "codepen",
  CODESANDBOX: "codesandbox",
  FALLBACK: "fallback",
};

  // type is used to return a specif component in markdocNodes
  const type = React.useRef(MEDIA_TYPES.FALLBACK);

  const processMedia = (mediaProps: MediaProps) => {
    // Regex test, parse the src url and determine which
    // media type user is trying to use before we perform
    // some operations. This is a necessary step because we we
    // need to make sure src url is valid and also account for
    // varying amounts of props for each component
    let match;
    switch (true) {
      case Boolean((match = mediaProps.src.match(youtubeRegex))):
        return processYoutube({ ...mediaProps });
      case Boolean((match = mediaProps.src.match(codesandboxRegex))):
        return processCodeSandbox({ ...mediaProps });
      case Boolean((match = mediaProps.src.match(codepenRegex))):
        return processCodePen({ ...mediaProps });
      default:
        return processFallback({ ...mediaProps });
    }
  };

  const processYoutube = (mediaProps: MediaProps) => {
    let src = mediaProps.src
    const isEmbedUrl = embedUrlRegex.test(src);
    // If not, reformat the URL to the embed URL format
    isEmbedUrl ? (src = checkProtocol(src)) : (src = formatEmbed(src));
    type.current = MEDIA_TYPES.YOUTUBE;
    return {
      ...mediaProps,
      src,
    };
  };

  const processCodeSandbox = (mediaProps: MediaProps) => {
    const src = checkProtocol(mediaProps.src);
    type.current = MEDIA_TYPES.CODESANDBOX;
    return {
      ...mediaProps,
      src,
    };
  };

  const processCodePen = (mediaProps: MediaProps) => {
    const src = checkProtocol(mediaProps.src);
    type.current = MEDIA_TYPES.CODEPEN;
    return {
      ...mediaProps,
      src,
    };
  };

  const processFallback = (mediaProps: MediaProps) => {
    const src = checkProtocol(mediaProps.src);
    return {
      ...mediaProps,
      src,
    };
  };

  // uses type.current and process props to render correct component
  const renderMediaComponent = (type: string, props: any) => {
    switch (type) {
      case "youtube":
        return <YouTube {...props} />;
      case "codepen":
        return <CodePen {...props} />;
      case "codesandbox":
        return <CodeSandbox {...props} />;
      default:
        return <FallbackMedia {...props} />;
    }
  };

  // check for url protocol. if noe add http by default
  const checkProtocol = (url: string) => {
    if (!protocolRegex.test(url)) {
      url = `http://${url}`;
    }
    return url;
  };

  // format youtube url if it is not embed format
  // can happen when user copy and past direct from youtube url bar
  const formatEmbed = (src: string) => {
    const videoId = src.match(/(?:\?v=|&v=|youtu\.be\/)([\w-]{11})/)[1] || '';
    src = `https://www.youtube.com/embed/${videoId}`;
    return src;
  };

  const processedProps = processMedia(props);
  console.log(processedProps);
  return renderMediaComponent(type.current, processedProps);
}
