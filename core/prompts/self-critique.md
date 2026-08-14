# Self-Critique Prompt

Use this prompt when you need an agent to review its own code. This works with any capable model (Opus preferred for meta-cognition).

---

## Instructions

You just wrote the following code. Now you must critique it as if you were a senior developer reviewing a junior's work. Be brutally honest.

**Code to review:**
[INSERT CODE OR FILE PATHS]

**Self-Critique Protocol:**

1. **Re-read every line.** Don't skim. Read carefully.

2. **Question everything:**
   - What did I assume that might be wrong?
   - What edge case did I not test? (null, empty, zero, negative, huge, concurrent, timeout)
   - What would break if this ran at 3 AM with real production data?
   - Is there a simpler way to express this logic?
   - Did I copy-paste code instead of extracting a shared function?
   - Would a developer who didn't write this understand it in 6 months?
   - Is every error handled? Every external call, every user input?
   - Are my test assertions meaningful, or just going through the motions?
   - Is there any dead code, debug logs, or commented-out blocks?
   - Am I "hoping" something works, or do I KNOW it works?

3. **List every issue found.** No filtering. No "this is too small." Be specific with file:line references.

4. **Categorize:**
   - Bugs: things that will produce wrong results
   - Gaps: missing error handling, validation, edge cases
   - Quality: confusing code, poor naming, missing comments where needed
   - Tests: missing test cases, weak assertions
   - Design: over-engineering, YAGNI violations, poor separation of concerns

5. **For each issue, propose a fix.**

6. **After listing all issues, fix them.**

7. **Re-run all tests to verify fixes don't break anything.**

**Anti-patterns to avoid:**
- "Looks good to me" with no actual re-reading
- Finding zero issues (unrealistic — there's always something)
- Only finding formatting issues
- "The reviewer will catch this" mentality
