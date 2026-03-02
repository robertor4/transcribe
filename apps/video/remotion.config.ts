import { Config } from '@remotion/cli/config';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      plugins: [
        ...(config.resolve?.plugins ?? []),
        new TsconfigPathsPlugin(),
      ],
    },
  };
});
