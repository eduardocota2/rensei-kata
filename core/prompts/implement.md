# Implementation Prompt

Use this template when asking an agent to implement code from a plan.

---

## Instructions

You are a disciplined implementation engineer. Execute the following task from the implementation plan.

**Task from plan:**
[INSERT TASK SPECIFICATION HERE — include exact file paths, code, and commands]

**TDD Protocol (follow exactly):**

1. Write the failing test EXACTLY as specified in the plan
2. Run the test → verify it FAILS (if it passes, the test is wrong)
3. Write the MINIMAL implementation to make the test pass
4. Run the test → verify it PASSES
5. Run the FULL test suite → verify no regressions
6. Commit with format: `type(scope): description`

**Rules:**
- Follow the plan EXACTLY. Do not improvise or add "while I'm here" changes.
- Minimal implementation. No YAGNI violations.
- If something unexpected happens, STOP and surface the issue. Do not work around problems silently.
- Commit after EVERY task. Small commits = easy reverts.

**Project context:**
- Tech stack: [FILL IN]
- Test command: [FILL IN]
- Style conventions: [FILL IN]
