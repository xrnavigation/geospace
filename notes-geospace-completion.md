# Geospace completion notes

## Current findings

- Branch: `master`, tracking `origin/master`.
- Tracked files were clean before investigation.
- Pre-existing untracked paths: `.gitignore`, `dist/`, `fuck.diff`, `node_modules/`, `pyghidra_mcp_projects/`, and `vitest.config.js`.
- No repo plan file was found. `README.md` and `package.json` are the available repo-local requirement and command surfaces.
- The tracked file named `Now update the builder’s build() call (if not already updated in Block 7) to use GeoJSONCore` is empty.
- `npm test` passes all 65 tests in 4 files.
- At baseline, `npm run build` failed during `tsc` with 10 errors in `src/geojsonConverter.ts`:
  - lines 109-116 incorrectly access circle properties on a value narrowed as `Polygon2D`;
  - line 334 still references missing `GeoJSONConverter` instead of the existing core owner;
  - lines 426-442 mutate readonly builder options.

## Current state and blocker

The initial build-repair slice is committed as `86ee1c5`. The packaging slice recorded below repairs the public-surface audit failures and passes its final authorities. Full objective completion remains unproven because the remaining type-safety findings and README/runtime claims still require audit and, where proven false, repair.

Further inspection established that the errors belong to one incomplete GeoJSON refactor:

- The added plain-circle condition duplicates `isCircle`, whose runtime predicate already checks `center` and `radius`; the duplicate right-hand condition is what destroys TypeScript's narrowing.
- `enhanceRTree().loadGeoJSON()` is the remaining stale `GeoJSONConverter.fromGeoJSON` call after the class was renamed to `GeoJSONCore`.
- `GeoJSONBuilder` stores its mutable accumulation state under the readonly public `GeoJSONOptions` contract and then mutates individual properties.
- At baseline, `npx tsc --noEmit` reproduced the same 10 errors as the package build.
- Before the source edit, Git had no tracked modifications; only the pre-existing untracked paths and this notes file were present.

The kept repair now:

- relies on the existing `isCircle` runtime guard without the duplicate narrowing-breaking condition;
- uses `GeoJSONCore.fromGeoJSON` and the returned conversion result's `.value` field;
- updates builder options by immutable object replacement rather than mutating readonly properties.

Verification after the repair:

- `npx tsc --noEmit`: pass;
- `npm test`: pass, 65 tests across 4 files;
- `npm run build`: pass, producing the ESM and UMD bundles plus source maps.

Public-surface audit after that commit:

- `vite.config.ts` uses only `src/geometry.ts` as the library entrypoint.
- The resolved TypeScript configuration has the core `strict` family enabled, but does not enable `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noUnusedLocals`, or `noUnusedParameters`.
- No ESLint configuration or ESLint dependency exists, so typed linting is not set up and no lint result can be treated as evidence.
- `npx --yes type-coverage --detail` reports 97.52% type coverage (4840 of 4963 identifiers), with 123 `any`-tainted identifiers concentrated in GeoJSON input guards, geometry dispatch/bounding boxes, metadata, and error handling.
- `npx --yes @arethetypeswrong/cli --pack . --format json` reports `"types": false` for package `geospace@0.0.1`.
- `dist` contains only the two JavaScript bundles and their source maps; no declarations survive the build.
- The cause is the current build order: `tsc` emits declarations first, then Vite empties `dist` before producing bundles.
- `npm pack --dry-run --json` confirms the tarball contains no declaration files.
- The ESM bundle exports only symbols from `src/geometry.ts`; it contains none of the README-advertised GeoJSON API.
- `npm ls --depth=0` shows `@types/geojson` and `rimraf` only as extraneous local packages. `@types/geojson` is required to compile the GeoJSON source, while the `clean` script invokes the undeclared `rimraf` binary.
- `npm ci --dry-run` fails because `package.json` and `package-lock.json` are out of sync (`@types/node` and `undici-types` are missing from the lock).
- The README and GitHub remote identify the package as `@xrnavigation/geospace`. That npm name is currently unpublished. The unscoped `geospace` name in `package.json` is already owned by an unrelated package at version 1.0.0.

Packaging repair slice in progress:

- Added `src/index.ts` as the package root, re-exporting geometry, GeoJSON conversion, and GeoJSON types.
- Pointed Vite at that root while preserving the existing `geometry.es.js` and `geometry.umd.js` filenames.
- Changed the manifest identity to `@xrnavigation/geospace`, declared `@types/geojson`, removed the undeclared `rimraf` clean step, and changed the build order to Vite followed by TypeScript declarations.
- Synchronized `package-lock.json`; `npm ci --dry-run` now passes.
- The in-slice `npx tsc --noEmit`, 65-test suite, and bundling phase pass.
- Declaration inspection found the current TypeScript common root includes config files, so declarations land at `dist/src/index.d.ts` and config declarations pollute `dist`; this does not match the manifest's `dist/index.d.ts` path and must be corrected within the same slice.
- The compiler root/include is now limited to `src`, and the rebuilt declaration graph lands at `dist/index.d.ts` without config declarations.
- The rebuilt ESM runtime exports the documented GeoJSON surface, and the dry-run tarball includes all declaration files.
- Packed-package analysis then found one remaining release blocker: the legacy UMD `main` is not statically compatible with any of the declarations' named exports under modern Node ESM resolution.
- Added a real CommonJS bundle alongside the preserved ES and UMD artifacts, declared the package as ESM, and added explicit `types`, `import`, and `require` export conditions.
- After that module-metadata repair, `npx tsc --noEmit` and all 65 tests pass. The build and packed-package authorities have not yet been rerun.
- The next packed analysis correctly rejected sharing the ESM-kind declaration entrypoint with CommonJS and rejected extensionless relative imports inside ESM declarations.
- Source/declaration re-exports now use Node16-resolvable `.js` specifiers, and `src/index.cts` provides the CommonJS-kind declaration entrypoint selected by the `require` condition.
- The first dual-declaration build still omitted `index.d.cts` because `tsconfig.json` included only `src/**/*.ts`; packed analysis consequently reported untyped/fallback CommonJS resolution.
- The compiler include now covers all files under `src`, including `.cts`; the final rerun after that correction is recorded below.

Final packaging-slice evidence:

- `npm ci --dry-run`: pass;
- `npx tsc --noEmit`: pass;
- `npm test`: pass, 65 tests across 4 files;
- `npm run build`: pass, producing ES, CommonJS, and UMD bundles plus ESM and CommonJS declaration entrypoints;
- `npm pack --dry-run --json`: pass, with both `dist/index.d.ts` and `dist/index.d.cts` and their complete referenced declaration graph in the tarball;
- `npx --yes @arethetypeswrong/cli --pack . --format json`: pass with `"problems": {}` across Node10, Node16 CommonJS, Node16 ESM, and bundler resolution.

## Next action

After the packaging slice, continue the completion audit from the remaining type-safety findings and verify README examples/claims against the actual root exports and runtime behavior. Define and complete only the next proven slice; do not treat the clean package artifact as full objective completion.
