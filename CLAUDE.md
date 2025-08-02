# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension called "API Route Jumper" that helps developers navigate from client-side API calls to their corresponding server controller files. The extension detects API calls in TypeScript/JavaScript files and provides CodeLens to jump to the matching server handlers.

## Development Commands

```bash
# Install dependencies
pnpm install

# Compile the extension
pnpm run compile

# Watch mode for development
pnpm run watch

# Type checking only
pnpm run check-types

# Linting
pnpm run lint

# Run tests
pnpm run test

# Package for distribution
pnpm run package

# Test API detection and path generation (必須：regex修正時)
npx ts-node src/test/extension.test.ts
```

## Development Workflow

**IMPORTANT**: When modifying the API call detection logic, always run tests first:

1. Make changes to regex patterns in `src/api-parser.ts`
2. Run `npx ts-node src/test/extension.test.ts` to verify detection works
3. Run `pnpm run compile` to check compilation
4. Run `pnpm run test` for full test suite
5. Test manually in VSCode development environment

### Architecture Notes

- **API detection logic**: Centralized in `src/api-parser.ts` for testability
- **Extension logic**: `src/extension.ts` imports from `api-parser.ts`
- **Tests**: `src/test/extension.test.ts` tests actual extension logic

## Architecture

### Core Components

- **Main Extension (`src/extension.ts`)**: Contains the activation logic and two main components:
  - `ApiCallCodeLensProvider`: Scans documents for API calls using regex and provides CodeLens
  - Command handler for jumping to server files

### API Call Detection

The extension uses regex patterns to detect API calls. **Current limitation**: only single-line API calls are detected.

Current regex pattern:
```typescript
/apiClient\(\)\.([a-zA-Z0-9_]+(?:\.(?:[a-zA-Z0-9_]+(?:\([^)]*\))?))+)[.,]\s*['\"]?(get|post|put|delete|\$get|\$post|\$put|\$delete)['\"]?\b/g
```

Supported patterns:
- `apiClient().app.users._userId(userId).shops.post()` ✅
- `apiClient().app.users._userId(userId).shops, '$get'` ✅

**Known issue - Not detected**:
```javascript
// 複数行のAPIコール（現在未対応）
apiClient()
  .app.users._userId(userId)
  .coupons._couponId(String(couponId))
  .use.post()
```

**Testing**: Use `npx ts-node src/test/regex.test.ts` to test regex patterns before deployment.

### File Mapping Logic

API calls are mapped to server files using this convention:
- Client: `apiClient().app.users._userId(userId).shops.post`
- Server: `{serverRouteRoot}/app/users/_userId/shops/_handlers.ts`

Parameters in parentheses (like `(userId)`) are stripped from the path.

### Configuration

Two configurable settings in VSCode:
- `apiRouteJumper.serverRouteRoot`: Server route path (default: "apps/server/src/routes/")
- `apiRouteJumper.apiRootName`: API root name (default: "app")

### Build System

- **esbuild**: Bundles the extension for production
- **TypeScript**: Source code compilation and type checking
- **ESLint**: Code linting with TypeScript rules

### Development Notes

- The extension activates on TypeScript, TSX, and JavaScript files
- CodeLens appears inline with detected API calls
- Missing server files show a warning message instead of opening
- Uses VSCode's file system API to check file existence before opening