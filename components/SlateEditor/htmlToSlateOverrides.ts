import { HtmlToSlateConfig } from 'slate-serializers';
import { Element } from 'domhandler';
import { config } from 'slate-serializers/lib/config/htmlToSlate/default';

export const htmlToSlateConfig: HtmlToSlateConfig = {
    ...config,
  textTags: {
    ...config.textTags,
    u: () => ({ underline: true }),
  }
}