
---

## Submission checklist

### Pre-submission gates

1. Retrieve the exact official kit again and verify every manifest hash.
2. Reconcile the candidate counts against the official rules and sealed snapshot.
3. Reconcile the recovered source with `bootstrap/official-kit` without overwriting history.
4. Have the accepted recorded agent session author/revise the final entrypoint and dashboard; preserve the complete run record and usage-bearing transcripts.
5. Integrate the model only after official-snapshot backtests, probability calibration, farm-cost validation, and ablation tests justify it.
6. Generate the board and dossier twice; verify byte identity, full watchlist coverage, offline rendering, and genuine screenshots.
7. Run the official checker, inspect every transcript-gate result, then review the exact commit and payout path.
8. Obtain explicit approval before signing or submitting.

### Required submission assets (per make.fun rules)

| Asset | Status | Notes |
|-------|--------|-------|
| Public repo (post-opening date) | ✔ | https://github.com/Sirahwaz/-midad-token-launch-radar |
| OSI-approved license | ✔ | LICENSE present |
| Root `main.ts` | ✗ | Not yet authored in eligible session |
| Unmodified `vendor/makefun-board.ts` | ✗ | Must hash-verify from official kit |
| Offline static `dashboard/` | ✗ | Missing |
| Complete watchlist board (≥100 rows + farm plan) | ✗ | Candidate census not yet re-computed |
| Three genuine screenshots | ✗ | Pending dashboard |
| `dossier.json` | ✗ | Pending board generation |
| Eligible native agent-session transcripts | ✗ | SuperBot never produced them (spend limit) |

### Known blockers

1. **No eligible agent-session transcript exists** — SuperBot stopped at its spend limit before creating project source files. No JSONL build transcript, no run record, no 7-day artifact. This is the primary submission blocker.
2. **Official kit must be re-retrieved** — the 15 November GitHub Actions artifact retention has elapsed. Kit must be downloaded and hash-verified again from the official make.fun portal.
3. **Candidate-count discrepancy unresolved** — conflicting reports (198 vs. 178) require re-computation from official RULES.txt and sealed snapshot.

### Preserved work (do not overwrite)

- `lib/expected-value.mjs` — research prototype (not competition entrypoint).
- `tests/expected-value.test.mjs` — 13 unit tests, all passing (CI #7: https://github.com/Sirahwaz/-midad-token-launch-radar/actions/runs/45077955327).
- `docs/COMPETITIVE_STRATEGY.md` — competitive review and execution gates.
- `docs/BUILD_HANDOFF_SUPERBOT.md` — transcript-safe SuperBot build handoff.
- `docs/EXPECTED_VALUE_MODEL.md` — model interface and limitations.
- `.github/workflows/expected-value-tests.yml` — Node.js 22.23.4 CI.
- `.github/workflows/prepare-official-kit.yml` — kit verification workflow.
