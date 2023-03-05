import * as React from 'react';
import { YouTube } from '../Youtube/Youtube';
import { CodePen } from '../Codepen/CodePen';
import { CodeSandbox } from '../Codesandbox/CodeSandbox';
import { FallbackMedia } from '../FallbackMedia/FallbackMedia';

const protocolRegex = /^(f|ht)tps?:\/\//i
const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:feature=youtu\.be[&amp;]?|v=)|embed\/|v\/))([\w-]{11})(?:\S+)?$/;
const codesandboxRegex = /{%\s*media\s*src="https?:\/\/codesandbox\.io\/embed\/([\w-]+).*?"\s*%}/i;
const codepenRegex = /{%\s*media\s*src="https?:\/\/codepen\.io\/([\w-]+)\/embed\/([\w-]+).*?"\s*%}/i;

export function Media(props: React.ReactPropTypes) {

    // const [type, setType] = React.useState('fallback')
    const type = React.useRef('fallback')

    const processMedia = (mediaProps) => {
        let match;
        if ((match = mediaProps.src.match(youtubeRegex))) {
          return processYoutube({...mediaProps});
        } else if ((match = mediaProps.src.match(codesandboxRegex))) {
          return processCodeSandbox({...mediaProps});
        } else if ((match = mediaProps.src.match(codepenRegex))) {
          return processCodePen({...mediaProps});
        } else {
          return processFallback({...mediaProps});
        }
      };
      
      const processYoutube = (mediaProps) => {
        let src = checkProtocol(mediaProps.src)
        type.current = 'youtube'
        return {
            ...mediaProps,
            src,
            type
        }

    }
    
      
      const processCodeSandbox = (mediaProps) => {
        let src = checkProtocol(mediaProps.src)
        // setType('codesandbox')
        return {
            ...mediaProps,
            src,
        }

      }
      
      const processCodePen = (mediaProps) => {
        let src = checkProtocol(mediaProps.src)
        // setType('codepen')
        return {
            ...mediaProps,
            src,
        }

      }
      
      const processFallback = (mediaProps) => {
        const src = checkProtocol(mediaProps.src);
        // setType('fallback')
        return {
            ...mediaProps,
            src,
        }
      };

    const renderMediaComponent = (type: string, props: any) => {
        switch(type) {
          case 'youtube':
            return <YouTube {...props} />;
          case 'codepen':
            return <CodePen {...props} />;
          case 'codesandbox':
            return <CodeSandbox {...props} />;
          default:
            return <FallbackMedia {...props} />;
        }
      }
    
      const checkProtocol = (url: string) => {
        if(!protocolRegex.test(url)){
            url = `https://${url}`
        }
        return url
      }
    

    
    const processedProps = processMedia(props)
    console.log(processedProps)
    return renderMediaComponent(type.current, processedProps)
}