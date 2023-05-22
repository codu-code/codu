import { config as defaultSlateToDomConfig } from 'slate-serializers/lib/config/slateToDom/default';

const customSlateToDomConfig = {
  ...defaultSlateToDomConfig,
  markMap: {
    ...defaultSlateToDomConfig.markMap,
    underlined: ['u'],
  }
};

export default customSlateToDomConfig;
