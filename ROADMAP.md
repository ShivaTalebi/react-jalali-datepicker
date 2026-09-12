# Product Roadmap

This backlog focuses on increasing real-world adoption, improving trust, and making the package easier to evaluate and integrate. Download counts alone are not treated as active-user metrics because registry traffic can include CI jobs, caches, mirrors, and automated scanners.

## High priority

- [ ] Publish permanent interactive demos for both branches/packages: a Persian-only demo from `main`, and a Jalali/Gregorian/Islamic Hijri demo from `feature/flexible-multi-calendar-datepicker`.
- [ ] Add copy-ready examples for React JavaScript, React TypeScript, Vite, and Next.js.
- [ ] Add automated regression tests for selection, manual input, confirmation/cancellation, disabled ranges, dropdown behavior, scrolling, and responsive positioning.
- [ ] Add accessibility coverage for keyboard navigation, focus management, ARIA labels, and screen readers.
- [ ] Verify React 18 and React 19 compatibility and document the supported versions.
- [ ] Resolve known development dependency advisories and add dependency/security checks to CI.

## Documentation and discoverability

- [ ] Keep the README concise and English-first, with installation and a minimal working example near the top.
- [ ] Document advanced configuration separately: formats, labels, fonts, disabled ranges, actions, localization, and calendar conversion.
- [ ] Ensure every README image uses a public raw GitHub URL that renders correctly on npm.
- [ ] Add working links for the live demo, source repository, issue tracker, and changelog.
- [ ] Review npm package name, description, and keywords for relevant searches such as React datepicker, Jalali, Shamsi, Persian, Gregorian, and Hijri.
- [ ] Publish practical examples and release updates on LinkedIn and other relevant developer communities.

## Package quality

- [ ] Measure and reduce the published package size where practical.
- [ ] Review runtime dependencies and keep peer dependencies explicit and minimal.
- [ ] Validate ESM, CommonJS, type declarations, exports, and tree-shaking behavior from a clean consumer project.
- [ ] Add CI checks for linting, type checking, unit tests, package build, and package-content inspection.
- [ ] Add an npm provenance-enabled publishing workflow when the repository setup supports it.
- [ ] Maintain clear semantic versioning and a concise changelog for user-facing changes.

## Adoption signals

- [ ] Track GitHub stars, dependents, issues, discussions, demo visits, and user feedback alongside npm downloads.
- [ ] Add issue templates for bug reports and feature requests.
- [ ] Provide a small contribution guide so users can report problems and contribute safely.
- [ ] Define distinct positioning for the Persian-only package and the multi-calendar package to avoid confusing users.
