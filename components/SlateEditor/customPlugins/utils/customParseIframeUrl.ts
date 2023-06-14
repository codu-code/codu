const getYoutubeRegex = () =>
/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?=.*v=\w+)|embed\/)|youtu\.be\/)/i;

const getEmbedUrlRegex = () =>
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})(?:\S+)?$/i;

const getCodesandboxRegex = () =>
/^https?:\/\/codesandbox\.io\/(?:embed|s)\/([\w-]+)(?:\?.*)?$/i;

const getCodepenRegex = () =>
  /^(?:https?:\/\/)?(?:www\.)?codepen\.io\/[\w-]+\/(?:embed|pen)\/([\w-]+)(?:\S+)?$/i;


export const protocolRegex = /^(f|ht)tps?:\/\//i;
export const youtubeRegex = getYoutubeRegex();
export const embedUrlRegex = getEmbedUrlRegex();
export const codesandboxRegex = getCodesandboxRegex();
export const codepenRegex = getCodepenRegex();

  const formatEmbed = (src: string) => {
    const videoId = src.match(/(?:\?v=|&v=|youtu\.be\/)([\w-]{11})/)[1] || '';
    src = `https://www.youtube.com/embed/${videoId}`;
    return src;
  };

export const parseCustomIframeUrl = (url: string) => {

  // if not starting with http, assume pasting of full iframe embed code
  if (url.substring(0, 4) !== 'http') {
    const regexMatchSrc = /src=".*?"/;
    const regexGroupQuotes = /"([^"]*)"/;

    const src = url.match(regexMatchSrc)?.[0];
    const returnString = src?.match(regexGroupQuotes)?.[1];

    if (returnString) {
      url = returnString;
    }
  }
  
  // Additional processing logic based on the URL format
  switch (true) {
    case !!url.match(youtubeRegex):
      return processYoutube(url);
    case !!url.match(codesandboxRegex):
      return processCodeSandbox(url);
    case !!url.match(codepenRegex):
      return processCodePen(url);
    default:
      return processFallback(url);
  }
};

// Helper functions for processing URLs based on their format

const processYoutube = (url: string) => {
  // Process Youtube URL
  const isEmbedUrl = embedUrlRegex.test(url);
  return isEmbedUrl ? url : formatEmbed(url);
};

export const processCodeSandbox = (url: string) => {
  // Process CodeSandbox URL
  return url;
};

export const processCodePen = (url: string) => {
  // Process CodePen URL
  return url.includes("/pen/") ? url.replace("/pen/", "/embed/") : url;
};

const processFallback = (url: string) => {
  // Process fallback URL
  return url;
};


export const parseYoutubeUrl = (url: string) => {
  // Regular expression to extract video ID from a YouTube embed URL
  const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]+)/i
  const match = url.match(regex);
  console.log('matching? youtube', match)
  
  if (match && match[1]) {
    console.log('testing for match')
    return {
      provider: 'youtube',
      id: match[1],
      url,
    };
  }
};



export const parseCodepenUrl = (url: string) => {
  // Regular expression to extract pen ID from a Codepen embed URL
  const regex = /^(?:https?:\/\/)?(?:www\.)?codepen\.io\/[\w-]+\/(?:embed|pen)\/([\w-]+)(?:\S+)?$/i;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return {
      provider: 'codepen',
      id: match[1],
      url,
    };
  }
};

export const parseCodeSandboxUrl = (url: string) => {
  // Regular expression to extract sandbox ID from a CodeSandbox embed URL
  const regex = /^https?:\/\/codesandbox\.io\/(?:embed|s)\/([\w-]+)(?:\?.*)?$/i;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return {
      provider: 'codesandbox',
      id: match[1],
      url,
    };
  }
};