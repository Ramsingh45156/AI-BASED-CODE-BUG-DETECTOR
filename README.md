# AI Code Review & Bug Detection

A starter project for AI-based code review and bug detection. It includes a FastAPI backend, a simple web UI, and ML model placeholders for code analysis.

## Features
- Upload or paste source code
- Run automated code review and bug detection
- Use ML model stubs for security, style, and bug analysis
- Web UI for interactive inspection

## Setup
1. Create and activate a Python venv:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Run the app:
   ```powershell
   uvicorn app.main:app --reload
   ```
4. Open http://127.0.0.1:8000

## Notes
- Replace the model stubs in `app/models/code_review.py` with a real ML model or LLM integration.
- Use the API endpoint `POST /api/analyze` to analyze code programmatically.
