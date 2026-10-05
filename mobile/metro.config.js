const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.resolver.alias = {
  ...(config.resolver.alias ?? {}),
  '@': path.resolve(projectRoot, 'src'),
};

config.resolver.blockList = [
  /scripts\/generate-assets\.js$/,
];

module.exports = config;