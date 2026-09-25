# Difficulty progression

The campaign teaches a skill, gives practice, combines it with familiar skills,
then offers an easier puzzle. Difficulty rises across chapters, with deliberate
rests inside each chapter. Timers belong to the optional Lunch rush mode.

## Research behind the change

- [Damien Allan: Designing Video Game Puzzles](https://www.gamedeveloper.com/design/designing-video-game-puzzles)
  recommends simple introductions, occasional breathers, testing for unintended
  solutions, and making execution straightforward once a solution is understood.
- [GDC 2018 Level Design Workshop: expert roundtable](https://www.gamedeveloper.com/design/gdc-2018-level-design-workshop-an-expert-roundtable-q-a)
  describes introducing a mechanic safely, providing basic challenges, then
  changing its context or combining it with an established mechanic.
- [Doing Difficulty Right: Fractal Curves](https://www.gamedeveloper.com/design/doing-difficulty-right-fractal-curves)
  discusses rising challenge with plateaus and relief rather than constant
  escalation and abrupt walls.
- [Kristensen, Valdivia and Burelli: Statistical Modelling of Level Difficulty in
  Puzzle Games](https://arxiv.org/abs/2107.03305) uses player action distributions
  to model puzzle difficulty. It supports measuring actual play rather than
  treating a generator's score as a complete model of human difficulty.

The chapter lengths, thresholds, and weights below are our initial design choices,
not numbers established by those sources. They still need player testing.

## The campaign

| Levels | New idea | Guardrails |
| --- | --- | --- |
| 1–5 | One slice and packing | Authored puzzles; at most eight cells; no rotation required |
| 6–10 | Cutting a piece again | Level 6 explicitly needs two ordinary cuts |
| 11–15 | Rotation | Level 11 requires turning the cut pieces to fit |
| 16–20 | One Cut | A familiar small shape introduces the strict one-cut budget |
| 21–25 | Multiple starting blocks | Introduce planning between blocks with small trays |
| 26–30 | Exact Fit | Rectangular trays and a tight cut budget; no rotation required |
| 31–35 | No Rotation | Practice planning with fixed piece orientations |
| 36 onward | Familiar rules combined | Repeating practice, build, challenge, and recovery cycles |

The first seven chapters use **learn → practice → build → challenge → breather**.
The fifth level returns to Normal rules for recovery. Later chapters put a
breather after every challenge, usually reducing both size and cut count.
One Cut recovery levels have a lower score ceiling because they offer fewer
planning steps. The curve eventually plateaus rather than making every new level
more demanding forever.

The baseline score grows from 7 at level 1 to 17 at 10, 32 at 35, 40 at 60,
50 at 120, and 61 at 240, reaching 76 at level 1,000. Chapter beats adjust that
baseline. Authored introductions have explicit targets suited to their lesson.
Size grows from at most eight cells to at most 36; reference solutions gradually
grow from one cut to as many as seven. Extra cuts make ordinary early lessons
forgiving. Undo remains free.

The play screen shows **New idea**, **Breather**, or the measured difficulty and
offers a short lesson-specific instruction. Optional mode tracks have their own
gradual progression while keeping their selected rule. Daily generation is
unchanged, preserving the shared daily puzzle.

## How generated puzzles are checked

The campaign and mode tracks use revisioned generation profiles. Each profile
constrains area, reference cuts, rotation, and early shape irregularity. Puzzles
are constructed from a known solution and validated before selection.

Difficulty combines size, pieces, cuts, irregularity, required rotations, cut
choices, and placement choices. Placement choices now count actual legal cells
and distinct orientations inside the tray, rather than estimating from a bounding
rectangle. Multi-block scores count the cuts the player still has to make.

The generator selects the closest valid candidate from a bounded pool of up to
192 attempts. It never relaxes a lesson's structural limits. Score proximity is
a selection goal, not a mathematical guarantee for every possible seed.

Exact Fit puzzles are built by dissecting a rectangular target and assembling a
different starting shape with a valid cutting sequence. Higher-cut lessons reject
obvious solutions using one binary cut; two-block puzzles reject a zero-cut fit.
This removes common shortcuts. It is not an exhaustive minimum-cut solver:
alternative solutions involving more complex cuts can still exist. The existing
field named `optimalCuts` is the known solution's cut count, not a proof of the
globally smallest count.

The revision is part of puzzle identities and generation seeds. Existing saved
stars, wallets, unlocked levels, and campaign position keep their storage keys.
Replaying a completed level can show its revised puzzle; no save reset is needed.

## Verification and tuning

```sh
npm run check
npm run test:progression
```

The progression report covers levels 1–400 across 25 seeds (10,000 puzzles).
It reports invalid puzzles, score proximity, mean score, cut count, area, and
generation time by level range. `BENTO_PROGRESSION_SAMPLES` controls its size;
`BENTO_PROGRESSION_REPORT=/tmp/progression.json` saves the full measurements.

Focused tests replay local cut coordinates, verify solution coverage, check
mechanic introduction and recovery order, test obvious shortcuts, cover all six
mode tracks, and preserve deterministic generation and daily behavior.

### Recorded check: September 25, 2026

All 58 tests passed, and production bundles exported for web, iOS, and Android.
A mobile browser playthrough completed the first two lessons without console
errors. Updating the preview preserved the existing level position and stars.

The 10,000-puzzle audit found **zero invalid puzzles**. Every measured score was
within six points of its target. All 1,975 challenge-to-breather pairs in the
sample became easier by measured score.

| Levels | Mean measured score | Mean reference cuts | Mean cells |
| --- | ---: | ---: | ---: |
| 1–5 | 7.80 | 1.00 | 6.00 |
| 6–10 | 14.66 | 1.80 | 6.47 |
| 11–20 | 18.81 | 1.21 | 7.78 |
| 21–35 | 26.57 | 2.11 | 10.31 |
| 36–60 | 35.00 | 2.35 | 13.08 |
| 61–120 | 43.34 | 3.01 | 17.09 |
| 121–240 | 52.91 | 3.83 | 22.52 |
| 241–400 | 60.69 | 4.65 | 27.82 |

Generation averaged 48 ms in this local Node run; the slowest puzzle took 1.35
seconds. This is not a phone performance benchmark. Measure transition latency
on physical devices before release, especially for later levels.

Before tuning again, observe players completing the early chapters and record
time to solve, retries, hints, undo use, abandonment, and whether they understood
the new rule. Compare those measurements by level and player experience. No
analytics service or adaptive difficulty was added; the same seed and level
still generate the same puzzle.
