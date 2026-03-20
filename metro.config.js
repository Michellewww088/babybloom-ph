// metro.config.js
// Fix: Metro resolves zustand packages to esm/*.mjs which contains `import.meta.env`.
// `import.meta` is invalid syntax in a classic (non-module) script and causes a parse-time
// SyntaxError that silently kills the entire bundle on web.
// Solution: intercept zustand imports and redirect to the CJS versions.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude .claude/worktrees and .git from file watching to avoid ENOSPC
config.resolver.blockList = [
  /\/.claude\/worktrees\/.*/,
  /\/\.git\/.*/,
];

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect zustand ESM → CJS for all platforms to avoid import.meta.env
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    const subpath = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    const cjsPath = path.join(__dirname, 'node_modules', 'zustand', subpath + '.js');
    try {
      require.resolve(cjsPath);
      return { filePath: cjsPath, type: 'sourceFile' };
    } catch {
      // fall through to default resolver
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
