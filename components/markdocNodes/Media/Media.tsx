import * as React from "react";
import { YouTube } from "../Youtube/Youtube";
import { CodePen } from "../CodePen/CodePen";
import { CodeSandbox } from "../CodeSandbox/CodeSandbox";
import { FallbackMedia } from "../FallbackMedia/FallbackMedia";

interface MediaProps {
  src: string;
  type?: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

const getYoutubeRegex = () =>
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?=.*v=\w+)|embed\/)|youtu\.be\/)/i;

const getEmbedUrlRegex = () =>
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})(?:\S+)?$/i;

const getCodesandboxRegex = () =>
  /^https?:\/\/codesandbox\.io\/(?:embed|s)\/([\w-]+)(?:\?.*)?$/i;

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
    const src = checkProtocol(mediaProps.src);
    // Regex test, parse the src url and determine which
    // media type user is trying to use before we perform
    // some operations. This is a necessary step because we we
    // need to make sure src url is valid and also account for
    // varying amounts of props for each component
    switch (true) {
      case !!mediaProps.src.match(youtubeRegex):
        return processYoutube({ ...mediaProps, src });
      case !!mediaProps.src.match(codesandboxRegex):
        return processCodeSandbox({ ...mediaProps, src });
      case !!mediaProps.src.match(codepenRegex):
        return processCodePen({ ...mediaProps, src });
      default:
        return processFallback({ ...mediaProps, src });
    }
  };

  const processYoutube = (mediaProps: MediaProps) => {
    const isEmbedUrl = embedUrlRegex.test(mediaProps.src);
    // If not, reformat the URL to the embed URL format
    const src = isEmbedUrl ? mediaProps.src : formatEmbed(mediaProps.src);
    type.current = MEDIA_TYPES.YOUTUBE;
    return {
      ...mediaProps,
      src,
    };
  };

  const processCodeSandbox = (mediaProps: MediaProps) => {
    type.current = MEDIA_TYPES.CODESANDBOX;
    return {
      ...mediaProps,
    };
  };

  const processCodePen = (mediaProps: MediaProps) => {
    let src = mediaProps.src;

    // Check if the URL contains /pen/ and replace it with /embed/
    if (src.includes("/pen/")) {
      src = src.replace("/pen/", "/embed/");
    }

    type.current = MEDIA_TYPES.CODEPEN;
    return {
      ...mediaProps,
      src,
    };
  };

  const processFallback = (mediaProps: MediaProps) => {
    return {
      ...mediaProps,
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
    const videoId = src.match(/(?:\?v=|&v=|youtu\.be\/)([\w-]{11})/)[1] || "";
    src = `https://www.youtube.com/embed/${videoId}`;
    return src;
  };

  const processedProps = processMedia(props);
  return renderMediaComponent(type.current, processedProps);
}
