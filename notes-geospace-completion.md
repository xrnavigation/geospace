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

This source slice repairs the initial package build failure. Full objective completion is not yet proven because the packaged public surface and README claims still require an evidence-based audit.

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

## Next action

Audit the actual packed public surface against `package.json`, README claims, declarations, and tests to identify the next proven incomplete requirement.
