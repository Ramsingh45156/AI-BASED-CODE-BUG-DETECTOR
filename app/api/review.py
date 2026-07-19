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
    import re
    import shutil
    
    lang = request.language.lower()
    code = request.content
    
    # Map suffixes
    suffixes = {
        "python": ".py",
        "javascript": ".js",
        "typescript": ".ts",
        "java": ".java",
        "cpp": ".cpp",
        "csharp": ".cs",
        "go": ".go",
        "c": ".c",
        "rust": ".rs",
        "php": ".php"
    }
    
    suffix = suffixes.get(lang, ".txt")
    temp_dir = None
    temp_path = None
    temp_bin = None
    
    try:
        # For Java, the filename MUST match the public class name
        if lang == "java":
            class_match = re.search(r"\bpublic\s+class\s+(\w+)", code)
            class_name = class_match.group(1) if class_match else "BugDemo"
            temp_dir = tempfile.mkdtemp()
            temp_path = os.path.join(temp_dir, f"{class_name}.java")
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(code)
        else:
            # Create temp file
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False, mode='w', encoding='utf-8') as f:
                f.write(code)
                temp_path = f.name
            
        # Compilation logic for compiled languages
        if lang in ("cpp", "c", "rust"):
            temp_bin = temp_path + ".exe" if sys.platform == "win32" else temp_path + ".bin"
            compiler = "g++" if lang == "cpp" else ("gcc" if lang == "c" else "rustc")
            
            # Compile command
            compile_cmd = [compiler, temp_path, "-o", temp_bin]
            
            # Run compilation
            try:
                comp_res = subprocess.run(
                    compile_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=10.0
                )
            except subprocess.TimeoutExpired:
                return RunResponse(
                    success=False,
                    output=f"Compilation timed out (10 seconds limit exceeded).\nMake sure '{compiler}' is responsive."
                )
                
            if comp_res.returncode != 0:
                # Return compilation errors directly
                return RunResponse(
                    success=False,
                    output=f"Compilation Failed:\n{comp_res.stderr or comp_res.stdout}\n\nMake sure the '{compiler}' compiler is installed and in your system PATH."
                )
            cmd = [temp_bin]
            
        elif lang == "python":
            cmd = [sys.executable, temp_path]
        elif lang == "javascript":
            cmd = ["node", temp_path]
        elif lang == "typescript":
            cmd = ["ts-node", temp_path] if sys.platform != "win32" else ["ts-node.cmd", temp_path]
        elif lang == "java":
            cmd = ["java", temp_path]
        elif lang == "go":
            cmd = ["go", "run", temp_path]
        elif lang == "php":
            cmd = ["php", temp_path]
        elif lang == "csharp":
            cmd = ["dotnet-script", temp_path] if sys.platform != "win32" else ["dotnet-script.cmd", temp_path]
        else:
            return RunResponse(success=False, output=f"Language '{request.language}' is not supported for execution.")
            
        # Execute binary or script
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5.0
            )
        except subprocess.TimeoutExpired:
            return RunResponse(
                success=False,
                output="Execution timed out (5 seconds limit exceeded). Possible infinite loop detected."
            )
        
        success = result.returncode == 0
        
        # Combine stdout and stderr to ensure output visibility
        output_parts = []
        if result.stdout:
            output_parts.append(result.stdout)
        if result.stderr:
            output_parts.append(result.stderr)
            
        output = "".join(output_parts)
        if not output.strip():
            output = "Code executed successfully with no stdout/stderr output." if success else "Code failed with no output."
            
        return RunResponse(success=success, output=output)
        
    except FileNotFoundError as e:
        # Runtime/compiler missing help
        missing_tool = "required compiler/runtime"
        if lang == "typescript": missing_tool = "ts-node (Run: npm install -g ts-node typescript)"
        elif lang == "go": missing_tool = "Go SDK"
        elif lang == "rust": missing_tool = "rustc compiler"
        elif lang == "cpp": missing_tool = "g++ compiler"
        elif lang == "c": missing_tool = "gcc compiler"
        elif lang == "php": missing_tool = "PHP runtime"
        elif lang == "csharp": missing_tool = "dotnet-script (Run: dotnet tool install -g dotnet-script)"
        elif lang == "javascript": missing_tool = "Node.js runtime"
        
        return RunResponse(
            success=False,
            output=f"Failed to run code: {missing_tool} is not installed or not in PATH.\nDetails: {str(e)}"
        )
    except Exception as e:
        return RunResponse(success=False, output=f"Failed to run code: {str(e)}")
    finally:
        # Cleanup source file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        # Cleanup temp dir (for Java)
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except:
                pass
        # Cleanup compiled binary file
        if temp_bin and os.path.exists(temp_bin):
            try:
                os.remove(temp_bin)
            except:
                pass

