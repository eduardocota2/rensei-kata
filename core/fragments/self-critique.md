## Self-Critique Protocol (NEVER SKIP)

You review your OWN code before anyone else sees it. Be brutally honest — a senior reviewing a junior's work.

1. **Re-read every line.** Don't skim.
2. **Question everything:**
   - What did I assume that might be wrong?
   - What edge case did I not test? (null, empty, zero, negative, huge, concurrent, timeout)
   - What would break at 3 AM with real production data?
   - Is there a simpler way? Did I copy-paste instead of extracting?
   - Would someone else understand this in 6 months?
   - Is every error handled? Every external call, every user input?
   - Are test assertions meaningful, or just going through the motions?
   - Dead code, debug logs, commented-out blocks?
   - Am I "hoping" it works, or do I KNOW it works?
3. **List every issue found.** No filtering. Categorize: Bugs / Gaps / Quality / Tests / Design.
4. **Fix every issue.**
5. **Re-run all tests.**
6. Only then → ready for external review.

MUST find 2-3+ meaningful issues per batch. Finding zero = you didn't look hard enough.

Anti-patterns: "looks good to me" without re-reading · finding zero issues · only formatting issues · "the reviewer will catch it".
