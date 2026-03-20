ml-experiment-platform/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── styles/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── datasets.py
│   │   │   │   │   ├── models.py
│   │   │   │   │   ├── benchmarks.py
│   │   │   │   │   └── experiments.py
│   │   │   │   └── router.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── logging.py
│   │   ├── schemas/                # Pydantic models
│   │   ├── services/               # Business logic
│   │   │   └── experiment_service.py
│   │   └── db/
│   │       ├── models.py
│   │       └── session.py
│   │
│   ├── tests/
│   └── requirements.txt
│
├── ml/
│   ├── datasets/
│   │   ├── base.py                 # Dataset interface
│   │   ├── cifar10.py
│   │   └── custom_dataset.py
│   │
│   ├── models/
│   │   ├── base.py                 # Model interface
│   │   ├── resnet.py
│   │   ├── bert.py
│   │   └── logistic_regression.py
│   │
│   ├── algorithms/
│   │   ├── training.py
│   │   ├── evaluation.py
│   │   └── hyperparameter_search.py
│   │
│   ├── benchmarks/
│   │   ├── base.py
│   │   ├── accuracy.py
│   │   ├── f1.py
│   │   └── latency.py
│   │
│   ├── pipelines/
│   │   ├── experiment.py           # Orchestrates runs
│   │   ├── registry.py             # Dataset/model lookup
│   │   └── runner.py
│   │
│   └── tests/
│
├── storage/
│   ├── datasets/
│   ├── models/
│   └── results/
│
├── scripts/
│   ├── seed_db.py
│   ├── download_datasets.py
│   └── run_experiment.py
│
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── docker-compose.yml
│
├── docs/
│   ├── architecture.md
│   ├── adding_models.md
│   └── adding_datasets.md
│
├── .env
├── pyproject.toml
├── README.md
└── Makefile