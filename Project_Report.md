# Project Report: AI-Based Code Bug Detector & Reviewer

## 1. Project Overview
The **AI-Based Code Bug Detector** is an interactive web-based utility designed to perform real-time static code reviews, identify potential bugs or security threats, estimate time and space complexities, and execute user-provided code snippets across various programming languages. The project consists of a FastAPI backend and a custom-designed, premium HTML5/CSS3/JavaScript frontend.

---

## 2. Recent Enhancements & Changes
A comprehensive set of features, optimizations, and multi-language support structures have been added to transform the project from a basic prototype into a feature-rich, production-grade tool. Below is the detailed breakdown of the modifications made across the application layers:

### A. Extended Multi-Language Static Analysis Engine (`app/models/code_review.py`)
The rule-based analysis engine has been upgraded to support **10 major programming languages**:
1. **Python**: Checks for mutable default arguments (`def f(x=[])`), bare except clauses (`except:`), non-idiomatic `None` comparisons (`== None`), debug print usages, and `eval()`/`exec()` code injection vulnerabilities.
2. **JavaScript & TypeScript**: Detects legacy `var` declarations, loose comparisons (`==`), missing `try-catch` structures inside async-await functions, `eval()` usages, unsafe `any` types, and non-null assertion bypasses (`!Element`).
3. **Java**: Identifies raw collection types (`ArrayList list`), reference identity checks for string values (`str == "val"`), general `Exception`/`Throwable` catch blocks, and console logging statements.
4. **C & C++**: Checks for buffer overflows via unsafe `strcpy()` functions and tracks dynamic memory allocation errors (missing `delete` matched against `new` allocations to identify potential memory leaks).
5. **C#**: Detects raw SQL query concatenations leading to SQL Injection security vulnerabilities.
6. **Go**: Identifies ignored error return values using the blank identifier (`_`).
7. **Rust**: Highlights risky usages of `unsafe` blocks.
8. **PHP**: Flags loose equality operators (`==`) and concatenated SQL query strings.

#### Complexity Estimation Improvements
- **Time Complexity Engine**: Implemented an automated parser checking nested loops (depth-first scanner matching indentation for Python and nested `{}` levels for other languages). It also tracks single/double recursion to differentiate between linear $O(N)$ and exponential $O(2^N)$ complexities.
- **Space Complexity Engine**: Analyzes structural variables, slice growth, heap allocations (`malloc`, `calloc`, `realloc`), pointer instances, and key data collections (e.g. `vector`, `List`, `Map`, `HashMap`, `HashSet`) to estimate space footprint.

---

### B. Polyglot Code Execution Sandbox (`app/api/review.py` & `app/main.py`)
The run endpoint (`/api/run`) now compiles and runs user-submitted programs securely in sandboxed subprocesses:
* **Compiled Languages (C, C++, Rust)**: Automatically spawns GCC/G++/Rustc compilers, captures compile-time stdout/stderr, and returns clean error descriptions if compilers are missing or codes fail compilation.
* **Special Java Classpath Parser**: Automatically parses the `public class` name from the code via regex, creates a temporary workspace directory matching the class name, compiles it, runs it, and cleans up the directory structure.
* **Environment Diagnostics**: If a required runtime (Node.js, Go SDK, PHP, ts-node, dotnet-script) is missing from the host machine's `PATH`, it returns helpful troubleshooting suggestions.
* **Infinite Loop Prevention**: Added a strict 5-second subprocess execution timeout.
* **FastAPI Directory Mounts**: Configured automated directory creation and static mount for `public/` directory hosting large external files.

---

### C. Premium UI/UX Frontend Interface (`app/templates/index.html` & `app/static/styles.css`)
We completely revamped the web layout with a premium dark/glassmorphic aesthetic:
* **Interactive Code Editor Chrome**: Wraps the code textarea with a macOS-like window frame containing action states ("Saved"), control dots (red, yellow, green), and dynamic filename tabs updating based on selected language.
* **Live Word & Line Counter**: Displays line, word, and character stats along with estimated code reading/review time in real-time.
* **Live Bracket Validator Badge**: A parsing indicator checking parentheses, curly brackets, and braces to show if they are balanced or unbalanced.
* **Dynamic Issue Filters**: Tabs to switch between **All, High, Medium, and Low** severity issues dynamically.
* **Interactive Big-O Complexity Modal**: Displays complex concepts with clean visual code examples for constant, linear, quadratic, and exponential time.
* **Copy Fix to Clipboard**: Added a copy utility to grab recommended code fixes instantly.
* **Seamless Dark Mode Toggle**: Toggles full dark-glass/light-glass UI variables.

---

### D. Advanced Client-Side Video Tutorial & Storage (`app/static/app.js`)
We embedded a robust guide panel with the following features:
* **IndexedDB Local Storage Integration**: Large user-uploaded tutorial MP4 videos are chunked and stored directly in the browser's IndexedDB. They persist across page reloads without burdening the FastAPI backend.
* **HTML5 Custom Video Controls**: Replaced native browser video controllers with custom play/pause overlays, interactive time timeline bars, volume mute controls, and fullscreen settings.
* **GIF vs. Video Tabs**: Allows users to toggle easily between a light GIF demo (`demo.webp`) and the full video guide (`public/help.mp4`).

---

## 3. Modified Workspace Files Summary
Below is a list of the modified files in the codebase:

* **[app/main.py](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/app/main.py)**: Added public directory mounts and configured automated browser launch.
* **[app/api/review.py](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/app/api/review.py)**: Enhanced code sandbox runtime execution engine supporting compilation and diagnostics.
* **[app/models/code_review.py](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/app/models/code_review.py)**: Added multi-language rule-based analyzer and time/space complexity parser.
* **[app/templates/index.html](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/app/templates/index.html)**: Main HTML structure, layout components, modals, and tutorial panels.
* **[app/static/app.js](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/app/static/app.js)**: Client logic for analysis triggers, custom media players, IndexedDB storage, stats counters, and filters.
* **[app/static/styles.css](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/app/static/styles.css)**: UI styling, dark mode variables, glassmorphic card effects, and transition keyframes.
* **[public/help.mp4](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/public/help.mp4)**: Added local video tutorial.
* **[app/static/demo.webp](file:///r:/Office/AI-BASED-CODE-BUG-DETECTOR-main/app/static/demo.webp)**: Added default GIF demonstration.

---

## 4. Verification & Testing
To run the server and test all the changes:
1. Double-click the launcher script **`run.bat`** (or execute `uvicorn app.main:app --reload` from your Python virtual environment).
2. It automatically boots the application and launches your browser at `http://127.0.0.1:8000`.
3. Try choosing a language like Python, Java, or C++ and loading the buggy templates to test the real-time review features and dynamic code execution logs!
