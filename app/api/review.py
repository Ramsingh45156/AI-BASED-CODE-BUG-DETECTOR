# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from pydantic import BaseModel
from app.models.code_review import analyze_code
import subprocess
import tempfile
import os
import sys

router = APIRouter()

class AnalyzeRequest(BaseModel):
    language: str
    content: str

class AnalyzeResponse(BaseModel):
    issues: list[dict]
    summary: str
    confidence: float
    time_complexity: str
    time_complexity_reason: str
    space_complexity: str
    space_complexity_reason: str

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    result = analyze_code(request.language, request.content)
    return AnalyzeResponse(**result)

class RunResponse(BaseModel):
    success: bool
    output: str

@router.post("/run", response_model=RunResponse)
async def run_code(request: AnalyzeRequest):
    lang = request.language.lower()
    code = request.content
    
    suffix = ".py" if lang == "python" else (".js" if lang in ("javascript", "typescript") else ".java")
    temp_path = None
    
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False, mode='w', encoding='utf-8') as f:
            f.write(code)
            temp_path = f.name
            
        if lang == "python":
            cmd = [sys.executable, temp_path]
        elif lang in ("javascript", "typescript"):
            cmd = ["node", temp_path]
        elif lang == "java":
            cmd = ["java", temp_path]
        else:
            return RunResponse(success=False, output=f"Language '{request.language}' is not supported for execution.")
            
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5.0
        )
        
        success = result.returncode == 0
        output = result.stdout if success else result.stderr
        if not output.strip():
            output = "Code executed successfully with no stdout output." if success else "Code failed with no error output."
            
        return RunResponse(success=success, output=output)
        
    except subprocess.TimeoutExpired:
        return RunResponse(success=False, output="Execution timed out (5 seconds limit exceeded). Possible infinite loop detected.")
    except Exception as e:
        return RunResponse(success=False, output=f"Failed to run code: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

