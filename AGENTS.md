## Git workflow (strict)

- `main` = always working code. NEVER commit or push directly to main.
- For every task, create a branch from an up-to-date main:
  `git checkout main && git pull && git checkout -b feat/<short-name>`
  Prefixes: feat/, fix/, docs/, chore/, test/
- Commit after every meaningful change on the branch (small commits).
  Format: `type(scope): message`, e.g. `feat(loader): parse GDS layers`
- Before asking to merge, run: `pytest` and the viewer build. Both must pass.
- If tests fail, fix them on the branch. Never merge a red branch.
- When the branch is ready: push the branch, open a PR into main
  (`gh pr create`) with a summary: what changed, how to run, what to verify.
- STOP and wait for my approval. Do not merge to main yourself.
- After I approve: squash-merge, delete the branch, pull main.
- Never force-push to main. Never rewrite pushed history.
- Tag releases from main only: `v0.1.0`, `v0.2.0`.

## Security
- NEVER read, print, copy, or store credentials or tokens (git credential
  store, env vars, hosts.yml). Never set environment variables or copy
  binaries outside the repo.
- If a tool (gh, python, etc.) is missing or unauthenticated, STOP and
  tell me what to run. Do not work around it.

## Environment (conda)
- Use the `semulator3d` conda environment for everything.
- Run commands as `conda run -n semulator3d <cmd>` (e.g.
  `conda run -n semulator3d pytest`) so it works in non-interactive shells.
- If the env is missing, STOP and tell me to run:
  `conda env create -f environment.yml && conda activate semulator3d`
- Do not create `.venv` or use a different environment.
- Dependencies live ONLY in pyproject.toml. If you add one, update
  pyproject.toml and tell me to run `pip install -e ".[dev]"` in the env.
  Do not install packages yourself.

## Testing (pytest)
- Run `pytest` before every push. All tests must pass before a PR.
- If pytest is missing, STOP and tell me to run `pip install -e ".[dev]"`
  in the env (pytest comes from the dev extra, not conda install).
- Every new feature (loader format, process step, geometry function) gets
  a test with a known input and expected output.
- If tests fail, fix them on the branch. Never merge a red branch.

# AGENTS.md

Goal: free, open-source 3D semiconductor process visualizer for students.
Stack: Python (gdstk, shapely, trimesh, pyyaml) core + TypeScript/three.js/Vite viewer.
Current phase: Phase 1 (GDS -> extrude -> scene.json -> viewer). Nothing from later phases.

## Security (highest priority)
- NEVER read, print, copy, or store credentials or tokens: git credential
  store, env vars, hosts.yml, .env files, Windows Credential Manager.
- NEVER run `git credential`, `gh auth`, or set environment variables.
- NEVER push, open PRs, or run `gh`. Commit locally only. I push.
- NEVER install tools or copy binaries outside the repo.
- If a tool is missing or unauthenticated, STOP and tell me what to run.
  Do not work around it.
- No network calls except installing deps from pyproject.toml that I approve.
- Never commit secrets, .env, keys, or large binaries. Check `git diff --staged`
  before every commit.

## Git workflow
- `main` is always working code. NEVER commit to main.
- One task = one branch from up-to-date main:
  `git switch main && git pull --ff-only && git switch -c feat/<name>`
  Prefixes: feat/ fix/ docs/ chore/ test/
- Small commits, Conventional Commits: `type(scope): message`.
  One logical change per commit. Never commit failing code.
- Before finishing: run pytest. It must pass.
- Then STOP and give me: branch name, commit list (`git log --oneline main..HEAD`),
  how to run, what to verify. I will push, open the PR, and squash-merge.
- Never force-push, never rewrite history that has been pushed, never amend
  commits after I've pushed.

## Environment (venv)
- Use `.venv` in repo root: `.venv\Scripts\python.exe`, `.venv\Scripts\pytest.exe`.
- If missing, STOP and tell me: `python -m venv .venv && .venv\Scripts\pip install -e ".[dev]"`
- Dependencies live ONLY in pyproject.toml. Do not install packages yourself.

## Testing
- Every geometry function gets a pytest with known input and expected output.
- Run `pytest` before every handoff.

## Data rules
- NEVER invent PDK numbers. Read them from pdks/<name>/stack.yaml.
  Unknown value -> `approx: true` and say so in your reply.
- Use only open PDKs (SKY130, GF180) and published papers.
- Copy nothing from commercial tools (SEMulator3D UI, assets, data).

## Style
- Small files, docstring on every module, ONE task at a time.
- After each task report: what changed, how to run, what to verify.

- In "How to run" notes, use real example paths (e.g. examples\test.gds), never <placeholders>, since PowerShell rejects `<`.
