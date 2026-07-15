# Environment Configuration Guide

## Overview

The Angular application supports multiple environments for different stages of development and deployment. Each environment has its own configuration file and corresponding build/serve scripts.

## Available Environments

### 1. Development (`environment.ts`)
- **Purpose**: Local development
- **API URL**: `http://localhost:8081`
- **Production Mode**: `false`
- **Optimization**: Disabled
- **Source Maps**: Enabled

### 2. Local QA (`environment.localqa.ts`)
- **Purpose**: Local QA testing
- **API URL**: `https://local-api.wildvalleyfoods.in`
- **Production Mode**: `true`
- **Optimization**: Disabled (for debugging)
- **Source Maps**: Enabled

### 3. Regression (`environment.reg.ts`)
- **Purpose**: Regression testing
- **API URL**: `https://reg-api.wildvalleyfoods.in`
- **Production Mode**: `true`
- **Optimization**: Enabled
- **Source Maps**: Enabled (for debugging)

### 4. Production (`environment.prod.ts`)
- **Purpose**: Production deployment
- **API URL**: `https://api.wildvalleyfoods.in`
- **Production Mode**: `true`
- **Optimization**: Enabled
- **Source Maps**: Disabled

## NPM Scripts

### Development Server (Serve)

```bash
# Development (localhost:8081)
npm run start:dev
# or
npm start

# Local QA
npm run start:localqa

# Regression
npm run start:reg

# Production
npm run start:prod
```

### Build Commands

```bash
# Development build
npm run build:dev

# Local QA build
npm run build:localqa

# Regression build
npm run build:reg

# Production build
npm run build:prod
# or
npm run build-prod
```

## Angular CLI Commands

You can also use Angular CLI directly:

```bash
# Serve with specific configuration
ng serve --configuration development
ng serve --configuration localqa
ng serve --configuration reg
ng serve --configuration production

# Build with specific configuration
ng build --configuration development
ng build --configuration localqa
ng build --configuration reg
ng build --configuration production
```

## Environment File Structure

Each environment file should export an `environment` object with the following structure:

```typescript
export const environment = {
  appVersion: '0.0.0',
  production: boolean,
  apiResponseCacheTimeoutInMinutes: number,
  enableResponseCacheProcessing: boolean,
  applicationVersion: string,
  apiBaseUrl: string,
  apiDefaultTimeout: number,
  indexedDBName: string,
  indexedDBVersion: number,
  LoggingInfo: {
    cacheLogs: boolean,
    cacheLogsToConsole: boolean,
    logToConsole: boolean,
    logToFile: boolean,
    logToApi: boolean,
    logToElasticCluster: boolean,
    exceptionToConsole: boolean,
    exceptionToFile: boolean,
    exceptionToApi: boolean,
    exceptionToElasticCluster: boolean,
    localLogFilePath: string,
  },
  encryptionKey: string,
};
```

## How It Works

1. **File Replacement**: Angular CLI replaces `environment.ts` with the environment-specific file during build based on the configuration
2. **Configuration**: Each configuration in `angular.json` specifies which environment file to use
3. **Build Optimization**: Production builds are optimized (minified, tree-shaken, etc.)
4. **Source Maps**: Enabled for debugging in non-production builds

## Usage Examples

### Running Local Development
```bash
npm run start:dev
# Opens http://localhost:4200 with development environment
```

### Building for Production
```bash
npm run build:prod
# Creates optimized build in dist/ folder using production environment
```

### Testing with Local QA Environment
```bash
npm run start:localqa
# Runs with Local QA API endpoint
```

## Important Notes

1. **Never commit sensitive data** in environment files
2. **Use environment variables** for secrets in production
3. **Keep environment files in sync** - if you add a new property, add it to all environment files
4. **Test each environment** before deploying
5. **Production builds** are optimized and minified - harder to debug

## Troubleshooting

### Environment file not being used
- Check `angular.json` configurations have correct `fileReplacements`
- Verify you're using the correct script/configuration
- Clear Angular cache: `rm -rf .angular` (or `rmdir /s .angular` on Windows)

### Build fails
- Ensure all environment files have the same structure
- Check for TypeScript errors in environment files
- Verify all required properties are present

### Wrong API URL
- Check which environment file is being used
- Verify the configuration in `angular.json`
- Check the build output for environment file path

---

**Last Updated**: 2024

