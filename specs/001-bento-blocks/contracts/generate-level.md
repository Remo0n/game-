# Contract: generateLevel

Pure function. No UI imports.

## Input

```text
generateLevel({
  seed: number
  levelNumber: number
  variation: NORMAL | ONE_CUT | NO_ROTATION | EXACT_FIT | TIMED | MULTI_BLOCK
  generatorVersion?: string          // default "1.0.0"
  difficulty?: EASY | MEDIUM | HARD | VERY_HARD   // omit on the campaign
  recentSignatures?: string[]        // last 80, newest last
  skipTutorial?: boolean             // inspector can bypass the pinned lesson
})
```

Campaign level 1 with variation NORMAL and `skipTutorial` unset MUST return the pinned teaching puzzle (a 1×6 bar, one cut, 2×3 target), independent of `seed`.

## Output

A level definition as in the data model, including `solution`.

Callers that render the board MUST pass the result through a function that stores `solution` in the vault and returns the playable level.

## Errors

The function does not throw for an unlucky candidate. It retries, then relaxes anti-repetition, then relaxes the score window. It still returns a puzzle that passes solvability checks. It may throw only on a programming error such as an unknown variation.

## Determinism

`generateLevel(input)` deep-equals `generateLevel(input)` for the same recent-signature list.
