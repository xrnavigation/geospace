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

Documentation/API audit findings:

- The actual root API exports `GeoJSON`, `GeoJSONBuilder`, and `GeoJSONCore`; there is no `GeoJSONConverter` export.
- Before the convergence slice, `README.md` taught `GeoJSONConverter.toGeoJSON`/`fromGeoJSON` in two sections, and `src/geojsonConverter.tests.ts` imported the nonexistent old name even though it did not use it.
- The `GeoJSONCore` class docstring called the class `GeoJSONConverter`.
- The README had an unmatched extra code fence after the unified raycasting example.
- The numerical-stability example passes a nonexistent third epsilon argument to `GeometryEngine`; the implementation exposes the fixed `EPSILON` constant and a two-argument constructor.
- The error-handling section claims `GeometryError`, `InvalidPolygonError`, `InvalidCircleError`, and `TransformError`, none of which exist. Geometry constructors currently throw ordinary `Error`; GeoJSON validation exposes `GeoJSONError` and `ValidationError`.

Documentation/API-convergence slice:

- Both README GeoJSON examples now use the shipped `GeoJSON.from(...).build().value` and `GeoJSON.to(...).value` contracts.
- Direct and unified raycasting examples now instantiate `LineSegment2D` and `Circle2D` rather than assigning incomplete plain objects to bounded interfaces.
- The numerical-stability section imports the actual fixed `EPSILON` constant and no longer invents a third `GeometryEngine` constructor argument.
- The error-handling section now describes the actual standard geometry errors and exported GeoJSON validation error.
- Removed the unmatched Markdown fence and converged the core docstring, stale test import, and test suite names from `GeoJSONConverter` to `GeoJSONCore`/`GeoJSON`.
- `npx tsc --noEmit`: pass;
- `npm test`: pass, 65 tests across 4 files;
- `npm run build`: pass.

Post-packaging type-safety baseline:

- `npx --yes type-coverage --detail`: 97.51% (4820 of 4943 identifiers), with 123 uncovered identifiers.
- The denominator differs from the earlier 97.52% audit because the real ESM/CommonJS package entrypoints are now part of the TypeScript program.
- The next single target is `GeoJSONCore`: redundant geometry assertions, `any` catches, inline `any` item/property shapes, the false generic R-tree item cast, and non-null/result assertions in that file.

`GeoJSONCore` type-safety slice:

- Replaced all explicit `any`, type assertions, and non-null assertions in `src/geojsonConverter.ts` with discriminant narrowing, `unknown` error handling, nullish defaults, and direct return types.
- Broadened GeoJSON input to the real external `Feature` boundary and retained runtime rejection of unsupported geometry variants.
- Deleted the false generic R-tree item cast; `enhanceRTree` now loads the existing `SpatialItem` contract directly.
- Replaced inline `any` metadata/callback shapes with `Record<string, unknown>` and existing `BoundingBox`/GeoJSON contracts.
- Removed imports made obsolete by those deletions.
- `npx tsc --noEmit`: pass;
- `npm test`: pass, 65 tests across 4 files;
- `npx --yes type-coverage --detail`: improved to 97.75% (4827 of 4938 identifiers), reducing uncovered identifiers from 123 to 111;
- `npm run build`: pass.

## Next action

Inspect `src/geojson.types.ts` as the next isolated boundary family. Define a sound `unknown`-narrowing slice only if its public predicates can remain truthful without adding an unverified validator framework; otherwise report and choose no substitute target.
