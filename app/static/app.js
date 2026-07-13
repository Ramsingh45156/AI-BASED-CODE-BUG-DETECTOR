const form = document.getElementById("analyze-form");
const results = document.getElementById("results");
const summary = document.getElementById("summary");
const confidence = document.getElementById("confidence");
const issues = document.getElementById("issues");
const statusPill = document.getElementById("status-pill");
const analyzeButton = document.getElementById("analyze-button");
const buttonLoader = document.getElementById("button-loader");

const runButton = document.getElementById("run-button");
const runLoader = document.getElementById("run-loader");
const executionContainer = document.getElementById("execution-container");
const executionStatus = document.getElementById("execution-status");
const executionOutput = document.getElementById("execution-output");

const timeComplexityVal = document.getElementById("time-complexity");
const timeComplexityReason = document.getElementById("time-complexity-reason");
const spaceComplexityVal = document.getElementById("space-complexity");
const spaceComplexityReason = document.getElementById("space-complexity-reason");

const severityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

async function performAnalysis() {
  const language = document.getElementById("language").value;
  const content = document.getElementById("content").value.trim();

  if (!content) {
    statusPill.textContent = "Enter code first";
    statusPill.style.background = "rgba(255, 85, 85, 0.16)";
    results.classList.add("hidden");
    return;
  }

  statusPill.textContent = "Analyzing...";
  statusPill.style.background = "rgba(95, 123, 255, 0.16)";
  analyzeButton.disabled = true;
  buttonLoader.classList.remove("hidden");

  try {
    const [analyzeRes, runRes] = await Promise.all([
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, content }),
      }),
      fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, content }),
      }).catch(err => {
        return {
          json: async () => ({ success: false, output: "Auto-execution failed: " + err.message })
        };
      })
    ]);

    const data = await analyzeRes.json();
    const runData = await runRes.json();

    summary.textContent = data.summary;
    confidence.textContent = `Confidence: ${Math.round(data.confidence * 100)}%`;

    // Apply color styling to confidence badge
    confidence.className = "score-badge"; // Reset classes
    if (data.confidence >= 0.8) {
      confidence.classList.add("confidence-high");
    } else if (data.confidence >= 0.5) {
      confidence.classList.add("confidence-medium");
    } else {
      confidence.classList.add("confidence-low");
    }

    // Render complexity
    timeComplexityVal.textContent = data.time_complexity;
    timeComplexityReason.textContent = data.time_complexity_reason;
    spaceComplexityVal.textContent = data.space_complexity;
    spaceComplexityReason.textContent = data.space_complexity_reason;

    // Render execution output
    executionOutput.querySelector("code").textContent = runData.output;
    if (runData.success) {
      executionStatus.textContent = "Success";
      executionStatus.className = "execution-status success";
    } else {
      executionStatus.textContent = "Error";
      executionStatus.className = "execution-status error";
    }
    executionContainer.classList.remove("hidden");

    issues.innerHTML = "";
    if (data.issues.length === 0) {
      issues.innerHTML = `<div class="issue"><h3>No issues detected</h3><p>Your code looks clean by the current heuristic checks.</p></div>`;
    } else {
      data.issues.forEach((issue) => {
        const card = document.createElement("div");
        card.className = "issue";
        
        let suggestionHtml = "";
        if (issue.suggestion) {
          suggestionHtml = `
            <div class="issue-suggestion">
              <div class="suggestion-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>
                Suggested Fix:
              </div>
              <pre class="suggestion-code"><code>${escapeHtml(issue.suggestion)}</code></pre>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="issue-head">
            <h3>${escapeHtml(issue.type)}</h3>
            <span class="pill ${escapeHtml(issue.severity)}">${severityLabels[issue.severity] || escapeHtml(issue.severity)}</span>
          </div>
          <p>${escapeHtml(issue.message)}</p>
          <div class="issue-meta">
            <span class="pill">Line ${issue.line}</span>
          </div>
          ${suggestionHtml}
        `;
        issues.appendChild(card);
      });
    }

    statusPill.textContent = "Analysis & execution complete";
    statusPill.style.background = "rgba(90, 255, 176, 0.16)";
    results.classList.remove("hidden");
  } catch (err) {
    statusPill.textContent = "Error analyzing";
    statusPill.style.background = "rgba(255, 101, 101, 0.16)";
  } finally {
    analyzeButton.disabled = false;
    buttonLoader.classList.add("hidden");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  performAnalysis();
});

const debouncedAnalysis = debounce(performAnalysis, 500);

document.getElementById("content").addEventListener("input", () => {
  const contentVal = document.getElementById("content").value.trim();
  if (contentVal) {
    debouncedAnalysis();
  } else {
    statusPill.textContent = "Ready";
    statusPill.style.background = "";
    results.classList.add("hidden");
  }
});

document.getElementById("language").addEventListener("change", () => {
  const contentVal = document.getElementById("content").value.trim();
  if (contentVal) {
    performAnalysis();
  }
});

async function performExecution() {
  const language = document.getElementById("language").value;
  const content = document.getElementById("content").value.trim();

  if (!content) {
    statusPill.textContent = "Enter code first";
    statusPill.style.background = "rgba(255, 85, 85, 0.16)";
    return;
  }

  statusPill.textContent = "Executing...";
  statusPill.style.background = "rgba(95, 123, 255, 0.16)";
  runButton.disabled = true;
  runLoader.classList.remove("hidden");

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, content }),
    });

    const data = await response.json();
    
    executionOutput.querySelector("code").textContent = data.output;
    
    if (data.success) {
      executionStatus.textContent = "Success";
      executionStatus.className = "execution-status success";
    } else {
      executionStatus.textContent = "Error";
      executionStatus.className = "execution-status error";
    }
    
    executionContainer.classList.remove("hidden");
    results.classList.remove("hidden");
    statusPill.textContent = data.success ? "Execution complete" : "Execution failed";
    statusPill.style.background = data.success ? "rgba(90, 255, 176, 0.16)" : "rgba(255, 101, 101, 0.16)";
  } catch (err) {
    statusPill.textContent = "Error executing";
    statusPill.style.background = "rgba(255, 101, 101, 0.16)";
    executionOutput.querySelector("code").textContent = "API execution request failed: " + err.message;
    executionStatus.textContent = "Error";
    executionStatus.className = "execution-status error";
    executionContainer.classList.remove("hidden");
    results.classList.remove("hidden");
  } finally {
    runButton.disabled = false;
    runLoader.classList.add("hidden");
  }
}

runButton.addEventListener("click", performExecution);

document.getElementById("content").addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    performExecution();
  }
});

