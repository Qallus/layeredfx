> Authoritative scope correction: preserve the LayeredFX public website and migrate the COMPLETE CTRL+P dashboard, adding Channel Cast Pipeline, Workspace and Plans. Earlier selective-reuse, exclusion and lightweight-dashboard directions are superseded. Unrelated development and safety instructions remain. See docs/migration/SCOPE.md and docs/reviews/current-review.md.

# Validate the merged LayeredFX operations build

Read START_HERE.md, CLAUDE.md and docs/channel-cast/{SOURCE_MAP,FEATURE_PARITY,MERGE_MAP,SETUP,QA_REPORT}.md.

This project already contains the LayeredFX homepage and source-reviewed Channel Cast Pipeline, Workspace and Plans adaptations. Preserve these files and the homepage design. Do not start over, clone an unrelated template or treat Plans as subscription pricing.

Inspect this workspace and Git status. Merge only the changed/new paths when the destination has existing work. Never overwrite .env or point to Channel Cast/ControlP production data.

Install dependencies using the existing major architecture and supplied Plate versions; generate the real lockfile. Run npm test, npm run typecheck, npm run lint and npm run build. Fix actual defects without disabling TypeScript, lint, auth, data validation or stage requirements. Verify Plate APIs against the installed version rather than stubbing out the editor. Verify real shadcn/Radix interactions and the Three.js canvas.

Run the app locally and test /, /admin, /admin/pipeline, /admin/pipeline/stages, /admin/workspace and /admin/plans plus their detail routes. Exercise a synthetic lead → opportunity → required stage steps → won → linked document and installation plan. Reopen/lose/nurture cases must preserve identity/history and require their notes. Compare all task views to the same underlying records.

Test the isolated Supabase adapter only after an authorized LayeredFX target and credentials are available. No live migration or deployment without authorization. Missing configuration should fail closed; never substitute demo records after a cloud failure. Test admin/staff/viewer, private records, body/origin limits, token refresh, 409 conflicts and restart persistence.

Document exact results in docs/reviews/current-review.md and update QA_REPORT.md. Report source features deliberately not ported from FEATURE_PARITY.md separately from bugs in implemented features. Do not claim full Channel Cast parity or live provider actions based on manual logs.
