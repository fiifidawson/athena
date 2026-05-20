# 06 · Code-Snippet Recorder

This is Athena's **USP**: every action a user takes in the UI emits the equivalent Python code, which they can view, copy, and run themselves. It's the bridge from no-code to code — exactly the value-add for an *educational* drug-discovery tool.

## Design

Every step in the pipeline calls a **`SnippetRecorder`**. The recorder buffers `(title, code)` pairs as the run progresses. At the end (or live, on demand), the buffered snippets get persisted to the `snippets` table, ordered by `order_idx`.

```
core/featurize.py     ─┐
core/train.py         ─┼─► SnippetRecorder ─► snippets table ─► GET /api/runs/{id}/snippets ─► UI
core/hpo.py           ─┘
```

We don't generate code by AST-parsing what we did — we **author** the snippets in the same place we author the logic. The recorder is just a typed buffer.

## The recorder

`backend/athena/core/snippet.py`:

```python
from dataclasses import dataclass, field
from textwrap import dedent
from typing import Any
from uuid import UUID

from sqlalchemy import delete

from athena.db.models import Snippet
from athena.db.session import session_scope


@dataclass
class SnippetRecorder:
    """Buffer (title, code) pairs and flush them to the DB in order."""

    run_id: UUID
    _buf: list[tuple[str, str]] = field(default_factory=list)

    def add(self, title: str, code: str) -> None:
        # dedent so authors can use triple-quoted strings indented under a function
        self._buf.append((title, dedent(code).strip("\n")))

    def add_template(self, title: str, template: str, **vars: Any) -> None:
        # tiny templating: {var} substitution, with repr() for safety
        safe = {k: repr(v) for k, v in vars.items()}
        self.add(title, template.format(**safe))

    async def flush(self) -> int:
        """Persist buffered snippets. Returns count written."""
        if not self._buf:
            return 0
        async with session_scope() as session:
            # wipe previous snippets for this run (idempotent if job restarts)
            await session.execute(delete(Snippet).where(Snippet.run_id == self.run_id))
            for idx, (title, code) in enumerate(self._buf):
                session.add(
                    Snippet(
                        run_id=self.run_id,
                        order_idx=idx,
                        title=title,
                        language="python",
                        code=code,
                    )
                )
        count = len(self._buf)
        self._buf.clear()
        return count
```

## Using it from `core/`

Pass the recorder *into* each domain function. This keeps `core/` testable — no implicit globals.

`backend/athena/core/featurize.py`:

```python
from athena.core.snippet import SnippetRecorder


def featurize_smiles(smiles_col: str, dataset_path: str, snip: SnippetRecorder) -> str:
    """Convert a SMILES column to Morgan fingerprints. Returns the path to the .npz."""
    snip.add(
        "1 · Load the dataset",
        f"""
        import pandas as pd
        df = pd.read_csv("{dataset_path}")
        print(df.head())
        """,
    )
    snip.add(
        "2 · Featurize SMILES → Morgan fingerprints (2048-bit, radius=2)",
        f"""
        from rdkit import Chem
        from rdkit.Chem import AllChem
        import numpy as np

        def to_fp(smi: str) -> np.ndarray:
            mol = Chem.MolFromSmiles(smi)
            fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=2048)
            return np.array(fp, dtype=np.uint8)

        X = np.stack([to_fp(s) for s in df["{smiles_col}"]])
        print(X.shape)  # (n, 2048)
        """,
    )
    # ...actually do the work and return the npz path...
    return "/tmp/features.npz"
```

## Tie into the run executor

Rewrite `backend/athena/core/train.py` to use the recorder:

```python
import asyncio
from uuid import UUID

from sqlalchemy import select

from athena.core.snippet import SnippetRecorder
from athena.db.models import Metric, Run
from athena.db.session import session_scope


async def execute(run_id: UUID) -> dict:
    async with session_scope() as session:
        run = (await session.execute(select(Run).where(Run.id == run_id))).scalar_one()
        base_model = run.base_model
        hp = run.hyperparameters

    snip = SnippetRecorder(run_id=run_id)

    # Step 1 — featurize (stubbed)
    from athena.core import featurize
    features_path = featurize.featurize_smiles("smiles", "/tmp/data.csv", snip)

    # Step 2 — model setup snippet
    snip.add_template(
        "3 · Train a LightGBM regressor",
        """
        import lightgbm as lgb
        from sklearn.model_selection import train_test_split

        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
        model = lgb.LGBMRegressor(n_estimators={n_estimators}, learning_rate={learning_rate})
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(20)])
        """,
        n_estimators=hp.get("n_estimators", 500),
        learning_rate=hp.get("learning_rate", 0.05),
    )

    # Fake training loop, emit metrics
    for step in range(10):
        await asyncio.sleep(0.3)
        async with session_scope() as session:
            session.add(Metric(run_id=run_id, step=step, name="train_loss", value=1.0 / (step + 1)))

    snip.add(
        "4 · Evaluate",
        """
        from sklearn.metrics import mean_squared_error
        preds = model.predict(X_val)
        print("RMSE:", mean_squared_error(y_val, preds, squared=False))
        """,
    )

    await snip.flush()
    return {"steps": 10, "snippet_count": 4}
```

## Read endpoint

`backend/athena/api/runs.py` — add:

```python
from athena.db.models import Snippet

# ... existing imports / router ...

@router.get("/{run_id}/snippets")
async def get_snippets(run_id: UUID, user: CurrentUser, session: SessionDep):
    # ownership check
    run = (await session.execute(select(Run).where(Run.id == run_id, Run.user_id == user.id))).scalar_one_or_none()
    if run is None:
        raise HTTPException(404)
    rows = (
        await session.execute(select(Snippet).where(Snippet.run_id == run_id).order_by(Snippet.order_idx))
    ).scalars().all()
    return [
        {"order": s.order_idx, "title": s.title, "language": s.language, "code": s.code}
        for s in rows
    ]
```

## Author guidelines (read before adding more snippets)

These are the rules that keep the snippet output good as the codebase grows:

1. **One snippet per conceptual step.** Don't combine "load data" and "train model" into one block.
2. **Numbered titles** (`"1 · Load the dataset"`). The frontend orders by `order_idx`; the number in the title is for humans skimming.
3. **Imports inside the snippet, not assumed.** Each block must be copy-pastable to a notebook and run on its own (given the prior blocks).
4. **Use `repr()` for substituted values.** The `add_template` helper does this for you. Hand-rolling f-strings around hyperparameters is how you create snippets that look right but error out (`learning_rate=0.05` vs `learning_rate=0.05f`).
5. **Match the actual run.** If you change `featurize_smiles` to use radius=3, change the snippet too. Snippets that *lie* are worse than no snippets. Add a test (page 12) that compares actual hyperparameters against snippet text.

## Smoke test

Re-run the smoke test from [page 05](05-jobs.md). Then:

```bash
curl localhost:8000/api/runs/<run-id>/snippets -b "athena_session=..."
```

You should get a JSON array of four code blocks with `order` 0–3.

## Definition of done

- [ ] After a successful run, `GET /api/runs/{id}/snippets` returns ordered Python blocks.
- [ ] If a run fails mid-way, the snippets emitted *up to that point* are still saved (move `await snip.flush()` to a `finally` block in the job to guarantee this).
- [ ] Each snippet, copy-pasted into a notebook in order, would actually run (mentally walk through it).

Next: **[07 · MLflow (Manual) →](07-mlflow.md)**
