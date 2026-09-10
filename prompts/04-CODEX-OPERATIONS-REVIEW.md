# LayeredFX operations review

Read AGENTS.md and all docs/channel-cast reports. Review the merged source rather than rebuilding its UI. Use a separate worktree from Claude.

Run dependency installation, typecheck, lint, Node tests and production build. Record exact commands/results. Test actual browser interactions and API responses; parser-only results are insufficient for approval.

Priority checks:
1. Attempt stage bypass via board drag, detail picker, raw command, intermediate skip and nurture cycle. Missing requirements must block. Only an admin can use a recorded override. Check won/lost/reopen and archives retain history.
2. Repeat lead conversion and won handoff; no duplicate opportunity/contact/project/active plan. Check owner and assignee restrictions.
3. Use different users to inspect private docs/comments and plans/tasks, then attempt direct-ID mutations. Server must filter reads and reject unauthorized changes.
4. Save/restore rich text, resolve comments, modify sharing and folders, and protect against unsafe links and oversized content. Verify unsaved changes and conflicting saves.
5. Modify the same task in Board/Grid/List/Calendar and confirm consistency, memberships, dates, groups, labels, checklists, complete/reopen and archives.
6. Verify signed-out/expired/inactive sessions, token refresh, exact origins, bounded bodies, revision 409, database errors, no secrets in client bundle and no production demo bypass.
7. Regression-test homepage, mobile navigation, dialogs, material selection, actual Three.js and reduced motion.

Review the server-only service-role design and unapplied SQL on a disposable LayeredFX-only staging project only with authorization. Do not test destructive mutations against Channel Cast or ControlP.

Report BLOCKER/HIGH/MEDIUM/LOW with exact file, reproduction, fix and verification. Do not approve production until all deployment checks pass; distinguish missing source parity from a defect in the implemented scope.
