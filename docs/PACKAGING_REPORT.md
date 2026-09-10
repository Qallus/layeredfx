# Integrated package verification — 2026-09-10

The full source ZIP contains **122 files**, including all 77 files from the prior project-ready package. Original public assets and homepage preview files are retained byte-for-byte. No original file was deleted. See `docs/channel-cast/MERGE_MAP.md` for new/modified paths.

79 Node tests passed, zero failed. A parser/import audit checked 59 JS/TS source and test files with no syntax errors, missing local imports or undeclared packages. See `docs/channel-cast/QA_RESULTS.json`. These checks are not a dependency-backed typecheck, build or browser test.

Full typechecking was attempted without installed dependencies and did not pass because Next/React/Plate declarations are unavailable. No passing full build, lint, browser runtime, Supabase, Docker or Coolify result is claimed. No lockfile was fabricated.

Final ZIP checks verify valid relative paths, unique entries, no secrets/build folders, every file's byte content, CRC integrity and SHA-256 manifest entries. Manifest lists every file except itself.

This is source plus an unapplied database setup and integration handoff—not a deployed app or an edit to any remote repository.
