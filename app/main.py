# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles
# pyrefly: ignore [missing-import]
from fastapi.responses import HTMLResponse
# pyrefly: ignore [missing-import]
from fastapi.templating import Jinja2Templates
from app.api import review
import os

app = FastAPI(title="AI Code Review & Bug Detection")

app.include_router(review.router, prefix="/api")

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Ensure the public directory exists and mount it
os.makedirs("public", exist_ok=True)
app.mount("/public", StaticFiles(directory="public"), name="public")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    import webbrowser
    import os
    import sys
    from threading import Timer

    # Ensure the root directory is in sys.path and we are in the root directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, ".."))
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    os.chdir(root_dir)

    def open_browser():
        webbrowser.open("http://127.0.0.1:8000")

    # Automatically open browser after 1.5 seconds
    Timer(1.5, open_browser).start()
    
    # Start the server
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
