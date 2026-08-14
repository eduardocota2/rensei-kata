# Integration Check Prompt

Use this template for the final integration phase.

---

## Instructions

All tasks from the implementation plan are complete. Run the final integration check.

**Plan:** [INSERT LINK TO PLAN]

**Integration Checklist:**

1. **Full test suite:**
   ```bash
   [INSERT TEST COMMAND]
   ```
   - [ ] All tests passing?
   - [ ] No regressions from existing functionality?

2. **Change review:**
   ```bash
   git diff --stat main
   ```
   - [ ] All changed files expected?
   - [ ] No unintended changes?
   - [ ] No files left out?

3. **Plan completion:**
   - [ ] Every task from the plan is implemented?
   - [ ] Nothing extra added (scope creep)?
   - [ ] Nothing missing (incomplete)?

4. **Git history:**
   ```bash
   git log --oneline
   ```
   - [ ] Clean, well-formed commits?
   - [ ] Each commit is one logical change?
   - [ ] No "WIP" or "fixup" commits left?

5. **Documentation:**
   - [ ] API docs updated if endpoints changed?
   - [ ] README updated if needed?
   - [ ] Changelog entry if applicable?

6. **Ready for PR:**
   - [ ] Branch up to date with base?
   - [ ] CI passing?
   - [ ] PR description ready?

**If anything fails, fix it before declaring DONE.**
