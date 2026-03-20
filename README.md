# athena
Machine Learning drug discovery pipeline for educational use

# Commit Structure
- feat: a new feature
- fix: a bug fix
- docs: documentation only
- style: formatting only(no logic changes)
- test: addingor fixing test
- chore: maintainance tasks(deps, configs, tooling)
- perf: perfomance improvements
- ci: CI/CD related changes
- build: build external dependencies
- revert: reverting to a previous commit

# Key Components & Steps:
- Frontend Client: A user interface (UI) (e.g., built with Streamlit or a custom web framework) to allow users to upload datasets and configure the task.
- Backend Server: The logic layer that manages user requests, connects to a database, and orchestrates the ML pipeline.
Data Ingestion and Analysis: Logic to handle data uploads (e.g., to Amazon S3 or Google Cloud Storage), perform basic data quality checks, and analyze data types.
- Automated Preprocessing: Functions that apply necessary feature engineering and scaling techniques (e.g., one-hot encoding, min-max scaling) based on data analysis.
- Model Selection and Hyperparameter Optimization: The core AutoML component that automatically searches through different algorithms (e.g., linear regression, random forest) and hyperparameters to find the best performing model for the specific dataset and problem type (classification or regression).
- Model Training and Evaluation: An orchestration system (like Kubeflow or Airflow) to manage the training jobs and evaluate model performance using relevant metrics (e.g., accuracy, F1 score, MSE).
Deployment and Prediction: A mechanism to deploy the final model as a service, typically as an API endpoint using frameworks like Flask or FastAPI, allowing for real-time predictions.
- Monitoring and Logging: Systems to monitor model performance in production and log all experimental metadata for reproducibility and debugging. 