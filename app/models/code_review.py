import re
from typing import Any, List, Dict


def analyze_code(language: str, content: str) -> Dict[str, Any]:
    issues: List[Dict[str, Any]] = []
    summary_parts = []
    confidence = 0.85

    if not content.strip():
        return {
            "issues": [],
            "summary": "No code provided.",
            "confidence": 0.0,
            "time_complexity": "O(1)",
            "time_complexity_reason": "Empty input has constant time execution.",
            "space_complexity": "O(1)",
            "space_complexity_reason": "Empty input requires no extra space.",
        }

    lang = language.lower()
    lines = content.splitlines()

    # 1. Estimate Time and Space Complexity
    time_comp, time_reason = _estimate_time_complexity(lang, lines)
    space_comp, space_reason = _estimate_space_complexity(lang, lines)

    # 2. Analyze Issues (Bugs, Security, Style) and suggest fixes
    
    # Common across all languages: TODO and FIXME comments
    for idx, line in enumerate(lines, start=1):
        if "TODO" in line or "FIXME" in line:
            issues.append({
                "type": "Maintainability",
                "message": "Found unresolved development comment (TODO/FIXME). Ensure it is resolved before production.",
                "line": idx,
                "severity": "medium",
                "suggestion": "// TODO/FIXME comment should be implemented or removed:\n// Refactor code to complete the pending task." if lang != "python" else "# TODO/FIXME comment should be implemented or removed:\n# Refactor code to complete the pending task.",
            })
            if "Has unresolved comments" not in summary_parts:
                summary_parts.append("Has unresolved comments.")

    # Language-specific checks
    if lang == "python":
        for idx, line in enumerate(lines, start=1):
            # Print statements
            if "print(" in line and not line.strip().startswith("#"):
                issues.append({
                    "type": "Style",
                    "message": "Console print() detected. Consider using a production logging framework.",
                    "line": idx,
                    "severity": "low",
                    "suggestion": "import logging\nlogging.basicConfig(level=logging.INFO)\n# Replace print() with:\nlogging.info(\"Your message\")",
                })
                if "Debug prints used" not in summary_parts:
                    summary_parts.append("Debug prints used.")

            # Eval/Exec usage
            if ("eval(" in line or "exec(" in line) and not line.strip().startswith("#"):
                issues.append({
                    "type": "Security",
                    "message": "Use of eval() or exec() can expose the application to severe code injection vulnerabilities.",
                    "line": idx,
                    "severity": "high",
                    "suggestion": "import ast\n# Replace eval(expr) with safe literal evaluation:\nast.literal_eval(expr)",
                })
                confidence = 0.90
                if "Potential code injection risk" not in summary_parts:
                    summary_parts.append("Potential code injection risk.")

            # None comparisons
            if ("== None" in line or "!= None" in line) and not line.strip().startswith("#"):
                clean_line = line.strip()
                suggested_line = clean_line.replace("== None", "is None").replace("!= None", "is not None")
                issues.append({
                    "type": "Style",
                    "message": "None comparisons should use 'is' or 'is not' instead of equality operators.",
                    "line": idx,
                    "severity": "low",
                    "suggestion": f"# Replace equality checks with identity checks:\n{suggested_line}",
                })
                if "Non-idiomatic None comparisons" not in summary_parts:
                    summary_parts.append("Non-idiomatic None comparisons.")

            # Bare except clause
            if "except:" in line and not line.strip().startswith("#"):
                issues.append({
                    "type": "Bug Risk",
                    "message": "Bare except clause caught. This catches SystemExit, KeyboardInterrupt, etc., making debugging difficult.",
                    "line": idx,
                    "severity": "medium",
                    "suggestion": "except Exception as e:\n    # Log error properly\n    print(f'Error occurred: {e}')",
                })
                if "Bare except clause detected" not in summary_parts:
                    summary_parts.append("Bare except clause detected.")

            # Mutable default argument
            match = re.search(r"def\s+\w+\(.*=\s*(\[\]|\{\})\s*\):", line)
            if match and not line.strip().startswith("#"):
                issues.append({
                    "type": "Bug Risk",
                    "message": "Mutable default argument (list or dict) detected. State will persist across multiple function calls.",
                    "line": idx,
                    "severity": "high",
                    "suggestion": "def my_func(param=None):\n    if param is None:\n        param = [] # or {}\n    # Proceed with function logic",
                })
                if "Mutable default argument risk" not in summary_parts:
                    summary_parts.append("Mutable default argument risk.")

    elif lang in ("javascript", "typescript"):
        for idx, line in enumerate(lines, start=1):
            # Console logs
            if "console.log(" in line and not line.strip().startswith("//"):
                issues.append({
                    "type": "Style",
                    "message": "Console.log() detected in production code. Replace with standard application loggers.",
                    "line": idx,
                    "severity": "low",
                    "suggestion": "// Use standard loggers or remove for production:\n// console.warn() or custom Logger.info()",
                })
                if "Debug output detected" not in summary_parts:
                    summary_parts.append("Debug output detected.")

            # Eval usage
            if "eval(" in line and not line.strip().startswith("//"):
                issues.append({
                    "type": "Security",
                    "message": "Avoid using eval(). It passes strings to the interpreter, creating cross-site scripting (XSS) risks.",
                    "line": idx,
                    "severity": "high",
                    "suggestion": "// Replace eval() with safe JSON parse or object access:\nconst parsed = JSON.parse(jsonData);\n// Or access via key:\nconst value = object[key];",
                })
                confidence = 0.90
                if "Potential code injection risk" not in summary_parts:
                    summary_parts.append("Potential code injection risk.")

            # var declaration
            if re.search(r"\bvar\s+\w+", line) and not line.strip().startswith("//"):
                issues.append({
                    "type": "Style",
                    "message": "Avoid 'var' declarations. Use block-scoped 'const' or 'let' to prevent variable hoisting bugs.",
                    "line": idx,
                    "severity": "low",
                    "suggestion": line.replace("var ", "const ").strip() + " // or use 'let' if reassigning",
                })
                if "Legacy var declarations" not in summary_parts:
                    summary_parts.append("Legacy var declarations.")

            # Double equality checks
            if (" == " in line or " != " in line) and not " == null" in line and not " != null" in line and not line.strip().startswith("//"):
                clean_line = line.strip()
                suggested_line = clean_line.replace(" == ", " === ").replace(" != ", " !== ")
                issues.append({
                    "type": "Bug Risk",
                    "message": "Use strict equality (===) and inequality (!==) operators to avoid unexpected type coercion.",
                    "line": idx,
                    "severity": "low",
                    "suggestion": f"// Replace double equals with triple equals:\n{suggested_line}",
                })
                if "Weak comparison operator" not in summary_parts:
                    summary_parts.append("Weak comparison operator.")

            # Missing try-catch for await in async function
            if "async " in line:
                # Basic check if subsequent lines have await but no try-catch
                has_await = False
                has_try = False
                for sub_idx in range(idx, min(idx + 15, len(lines))):
                    if sub_idx >= len(lines):
                        break
                    sub_line = lines[sub_idx]
                    if "await " in sub_line:
                        has_await = True
                    if "try {" in sub_line or "try{" in sub_line:
                        has_try = True
                if has_await and not has_try:
                    issues.append({
                        "type": "Bug Risk",
                        "message": "Async function contains await expressions but does not appear to wrap them in a try-catch block.",
                        "line": idx,
                        "severity": "medium",
                        "suggestion": "async function fetchData() {\n    try {\n        const response = await fetch(url);\n        return await response.json();\n    } catch (error) {\n        console.error('Failed to fetch:', error);\n    }\n}",
                    })
                    if "Unhandled promise rejection risk" not in summary_parts:
                        summary_parts.append("Unhandled promise rejection risk.")

    elif lang == "java":
        for idx, line in enumerate(lines, start=1):
            # Print statements
            if "System.out.print" in line and not line.strip().startswith("//"):
                issues.append({
                    "type": "Style",
                    "message": "System.out.println() detected. Standardize on logging frameworks (e.g. SLF4J, Logback).",
                    "line": idx,
                    "severity": "low",
                    "suggestion": "import org.slf4j.Logger;\nimport org.slf4j.LoggerFactory;\nprivate static final Logger logger = LoggerFactory.getLogger(MyClass.class);\n// Replace with:\nlogger.info(\"Your message\");",
                })
                if "Standard console print used" not in summary_parts:
                    summary_parts.append("Standard console print used.")

            # String comparison with ==
            if "==" in line and any(x in line for x in ('"', 'String', '.substring', 'args[')) and not line.strip().startswith("//"):
                issues.append({
                    "type": "Bug Risk",
                    "message": "String comparison using '==' found. This compares object reference identity, not string content value.",
                    "line": idx,
                    "severity": "high",
                    "suggestion": "string1.equals(string2) // Use equals() instead of == for value comparisons",
                })
                if "Incorrect String comparison" not in summary_parts:
                    summary_parts.append("Incorrect String comparison.")

            # Raw generic collection type
            match = re.search(r"\b(List|Map|Set|ArrayList|HashMap|HashSet)\s+\w+\s*=\s*new\s+\1", line)
            if match and not line.strip().startswith("//"):
                issues.append({
                    "type": "Style",
                    "message": "Generic class initialized with raw type. Generics enforce type safety at compile time.",
                    "line": idx,
                    "severity": "medium",
                    "suggestion": "List<String> list = new ArrayList<>(); // Specify the parameter type inside angle brackets",
                })
                if "Raw types used" not in summary_parts:
                    summary_parts.append("Raw types used.")

            # Caught generic Exception or Throwable
            if "catch (Exception" in line or "catch (Throwable" in line:
                issues.append({
                    "type": "Bug Risk",
                    "message": "Catching general Exception or Throwable is discouraged. It can swallow critical runtime exceptions.",
                    "line": idx,
                    "severity": "medium",
                    "suggestion": "catch (IOException | SQLException e) {\n    logger.error(\"Specific error occurred\", e);\n}",
                })
                if "Generic exceptions caught" not in summary_parts:
                    summary_parts.append("Generic exceptions caught.")

    # Clean up summary and compute dynamic confidence score
    if not issues:
        summary = "No obvious code issues found. Analysis complete."
        confidence = 0.98
    else:
        summary = " ".join(summary_parts)
        # Dynamic confidence score computation
        deductions = {
            "high": 0.15,
            "medium": 0.08,
            "low": 0.03
        }
        total_deduction = sum(deductions.get(issue.get("severity", "low"), 0.03) for issue in issues)
        confidence = max(0.20, round(0.98 - total_deduction, 2))

    return {
        "issues": issues,
        "summary": summary,
        "confidence": confidence,
        "time_complexity": time_comp,
        "time_complexity_reason": time_reason,
        "space_complexity": space_comp,
        "space_complexity_reason": space_reason,
    }


def _detect_recursion(language: str, lines: List[str], func_names: List[str]) -> tuple[bool, bool]:
    has_recursion = False
    double_recurse = False
    
    for func in func_names:
        call_count = 0
        for line in lines:
            is_def = False
            stripped = line.strip()
            if language == "python":
                if f"def {func}" in line:
                    is_def = True
            elif language in ("javascript", "typescript"):
                if f"function {func}" in line or re.search(rf"\bconst\s+{func}\s*=", line) or re.search(rf"\blet\s+{func}\s*=", line):
                    is_def = True
            elif language == "java":
                if re.search(rf"\b{func}\s*\([^)]*\)\s*(?:throws\s+\w+)?\s*\{{", line):
                    is_def = True
            
            if is_def:
                continue
            
            matches = re.findall(rf"\b{func}\s*\(", line)
            if matches:
                call_count += len(matches)
                if len(matches) > 1:
                    double_recurse = True
                    
        if call_count > 0:
            has_recursion = True
            
    return has_recursion, double_recurse


def _estimate_time_complexity(language: str, lines: List[str]) -> tuple[str, str]:
    max_loop_depth = 0

    func_names = []
    for line in lines:
        stripped = line.strip()
        if language == "python":
            match = re.match(r"def\s+(\w+)\s*\(", stripped)
            if match:
                func_names.append(match.group(1))
        elif language in ("javascript", "typescript"):
            match = re.match(r"(?:async\s+)?function\s+(\w+)\s*\(", stripped)
            if match:
                func_names.append(match.group(1))
            else:
                match_arrow = re.match(r"const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>", stripped)
                if match_arrow:
                    func_names.append(match_arrow.group(1))
        elif language == "java":
            match = re.match(r"(?:public|private|protected|static|\s)+(?:\w+<.*?>|\w+)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+)?\s*\{", stripped)
            if match and match.group(1) not in ("if", "for", "while", "switch", "catch"):
                func_names.append(match.group(1))

    has_recursion, double_recurse = _detect_recursion(language, lines, func_names)

    if language == "python":
        loop_indents = []
        for line in lines:
            if not line.strip() or line.strip().startswith("#"):
                continue
            leading_spaces = len(line) - len(line.lstrip())
            while loop_indents and leading_spaces <= loop_indents[-1]:
                loop_indents.pop()
            
            if re.search(r"\b(for|while)\b", line):
                loop_indents.append(leading_spaces)
                max_loop_depth = max(max_loop_depth, len(loop_indents))
    else:
        brace_level = 0
        loop_braces = []
        for line in lines:
            for char in line:
                if char == "{":
                    brace_level += 1
                elif char == "}":
                    brace_level = max(0, brace_level - 1)
                    while loop_braces and brace_level < loop_braces[-1]:
                        loop_braces.pop()
            if re.search(r"\b(for|while)\b", line) or ".forEach" in line:
                loop_braces.append(brace_level)
                max_loop_depth = max(max_loop_depth, len(loop_braces))

    if has_recursion:
        if double_recurse:
            return "O(2^N)", "Exponential time complexity due to multiple recursive calls branching (e.g., Fibonacci recursion)."
        return "O(N)", "Linear time complexity due to single-branch recursive function calls."
    
    if max_loop_depth == 0:
        return "O(1)", "Constant time complexity. No loops or recursive structures detected."
    elif max_loop_depth == 1:
        return "O(N)", "Linear time complexity. Contains a single level of iteration over the dataset."
    elif max_loop_depth == 2:
        return "O(N^2)", "Quadratic time complexity. Contains nested loops ($N \\times N$ operations)."
    else:
        return f"O(N^{max_loop_depth})", f"Polynomial time complexity of order {max_loop_depth} due to {max_loop_depth}-level deep nested loops."


def _estimate_space_complexity(language: str, lines: List[str]) -> tuple[str, str]:
    has_dynamic_allocation = False
    allocation_reasons = []

    func_names = []
    for line in lines:
        stripped = line.strip()
        if language == "python":
            match = re.match(r"def\s+(\w+)\s*\(", stripped)
            if match:
                func_names.append(match.group(1))
        elif language in ("javascript", "typescript"):
            match = re.match(r"(?:async\s+)?function\s+(\w+)\s*\(", stripped)
            if match:
                func_names.append(match.group(1))
        elif language == "java":
            match = re.match(r"(?:public|private|protected|static|\s)+(?:\w+<.*?>|\w+)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+)?\s*\{", stripped)
            if match and match.group(1) not in ("if", "for", "while", "catch"):
                func_names.append(match.group(1))

    has_recursion, _ = _detect_recursion(language, lines, func_names)

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#") or stripped.startswith("//"):
            continue
        
        if language == "python":
            if "= []" in line or "= list(" in line or ".append(" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("dynamic list")
            if "= {}" in line or "= dict(" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("hash dictionary")
            if "= set(" in line or "= {" in line and ":" not in line and "}" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("set data allocation")

        elif language in ("javascript", "typescript"):
            if "= []" in line or "new Array(" in line or ".push(" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("array list")
            if "= {}" in line or "new Map(" in line or "new Set(" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("Map/Set mapping")

        elif language == "java":
            if "new ArrayList" in line or "new LinkedList" in line or ".add(" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("List collection")
            if "new HashMap" in line or "new TreeMap" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("Map hash table")
            if "new HashSet" in line or "new TreeSet" in line:
                has_dynamic_allocation = True
                allocation_reasons.append("Set allocation")

    if has_recursion:
        return "O(N)", "Linear space complexity. Recursion requires $O(N)$ auxiliary stack space corresponding to the call depth."
    
    if has_dynamic_allocation:
        unique_reasons = list(set(allocation_reasons))
        reason_str = ", ".join(unique_reasons)
        return "O(N)", f"Linear space complexity. Allocates memory dynamically for: {reason_str}."

    return "O(1)", "Constant space complexity. Memory is limited to a few scalar variables ($O(1)$ space)."
