# Completion baseline-contamination audit

After the tail extension exposed hidden completion text, every retained
non-staging `objective-browser.json` was scanned with the same strict completion
phrase pattern.

- evidence files checked: 58;
- files with a frozen completion candidate: 18;
- candidates with completion language already present in `initialDom`: 1.

The only contaminated candidate was `int4-gen-text-r5a`. Its opacity-zero
results screen contained `RACE COMPLETE!` on the menu, and its separate
state/visibility audit corrected the 45-second verdict to fail.

No earlier accepted text-first repair or grounded-arena artifact had completion
language at baseline. This rules out the same specific contamination mechanism
for those results; it is not a universal proof that every later result element
was visible. Those earlier accepted artifacts also retain ordered screenshots
and state progression, which remain part of their acceptance evidence.

The machine-readable row set and exact relative evidence paths are in
[`completion-baseline-audit.json`](completion-baseline-audit.json).
