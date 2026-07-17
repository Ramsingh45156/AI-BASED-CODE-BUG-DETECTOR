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

// 10 Real-time Features selectors
const codeTemplateSelect = document.getElementById("code-template");
const clearCodeBtn = document.getElementById("clear-code-btn");
const exportReportBtn = document.getElementById("export-report-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");
const bracketValidator = document.getElementById("bracket-validator");
const qualityGrade = document.getElementById("quality-grade");

// Stats selectors
const statLines = document.getElementById("stat-lines");
const statWords = document.getElementById("stat-words");
const statChars = document.getElementById("stat-chars");
const statReadTime = document.getElementById("stat-read-time");

// Modal selectors
const complexityModal = document.getElementById("complexity-modal");
const closeComplexityModalBtn = document.getElementById("close-complexity-modal-btn");
const timeComplexityCard = timeComplexityVal.closest(".complexity-card");
const spaceComplexityCard = spaceComplexityVal.closest(".complexity-card");

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

    // Dynamic Quality Grade Update
    const scoreVal = data.confidence;
    qualityGrade.className = "grade-badge";
    if (scoreVal >= 0.9) {
      qualityGrade.textContent = "A+";
      qualityGrade.classList.add("grade-a-plus");
    } else if (scoreVal >= 0.8) {
      qualityGrade.textContent = "A";
      qualityGrade.classList.add("grade-a");
    } else if (scoreVal >= 0.7) {
      qualityGrade.textContent = "B";
      qualityGrade.classList.add("grade-b");
    } else if (scoreVal >= 0.5) {
      qualityGrade.textContent = "C";
      qualityGrade.classList.add("grade-c");
    } else {
      qualityGrade.textContent = "F";
      qualityGrade.classList.add("grade-f");
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
      issues.innerHTML = `<div class="issue" data-severity="none"><h3>No issues detected</h3><p>Your code looks clean by the current heuristic checks.</p></div>`;
    } else {
      data.issues.forEach((issue) => {
        const card = document.createElement("div");
        card.className = "issue";
        card.setAttribute("data-severity", issue.severity);
        
        let suggestionHtml = "";
        if (issue.suggestion) {
          const safeSuggestion = issue.suggestion.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
          suggestionHtml = `
            <div class="issue-suggestion">
              <div class="suggestion-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="display: flex; align-items: center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>
                  Suggested Fix:
                </span>
                <button type="button" class="clipboard-btn suggestion-copy-btn" onclick="navigator.clipboard.writeText(\`${safeSuggestion}\`).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy Fix', 2000); })">Copy Fix</button>
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

    // Re-apply active severity filter
    const activeFilterBtn = document.querySelector(".filter-btn.active");
    if (activeFilterBtn) {
      applySeverityFilter(activeFilterBtn.getAttribute("data-filter"));
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

// Video modal popup logic
const videoModal = document.getElementById("video-modal");
const openModalBtn = document.getElementById("open-video-modal-btn");
const closeModalBtn = document.getElementById("close-video-modal-btn");

if (videoModal && openModalBtn && closeModalBtn) {
  openModalBtn.addEventListener("click", () => {
    videoModal.classList.remove("hidden");
    setTimeout(() => {
      videoModal.classList.add("active");
    }, 10);
  });

  const closeModal = () => {
    videoModal.classList.remove("active");
    setTimeout(() => {
      videoModal.classList.add("hidden");
    }, 300);
  };

  closeModalBtn.addEventListener("click", closeModal);

  videoModal.addEventListener("click", (event) => {
    if (event.target === videoModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !videoModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

// 1. Templates Data Configuration
const templates = {
  python: `def process_data(items=[]): # Mutable default argument!
    print("Processing started") # Console print
    
    # Unresolved development task
    # TODO: Add validation logic
    
    try:
        for val in items:
            if val == None: # None comparison check
                pass
            eval(val) # Risk of injection
    except: # Bare except clause
        pass`,
        
  javascript: `async function loadData() {
    var query = "test"; // Legacy var
    console.log("Searching for: " + query); // Console log
    
    // FIXME: Secure this evaluation
    eval("var x = " + query); // XSS vulnerability
    
    const response = await fetch('/api/data'); // Missing try-catch for await
    return response.json();
}`,

  java: `import java.util.ArrayList;

public class BugDemo {
    public void checkUser(String role) {
        ArrayList list = new ArrayList(); // Raw type collection
        
        if (role == "admin") { // String comparison with ==
            System.out.println("Access granted"); // Console print
        }
        
        try {
            // TODO: implement actual check
        } catch (Exception e) { // Generic exception caught
            e.printStackTrace();
        }
    }
}`
};

// 2. Editor Stats Counter & Live Brackets Validator
function updateEditorStats() {
  const content = document.getElementById("content").value;
  
  // Calculate lines, words, chars
  const lines = content.split('\n').filter(l => l.trim().length > 0).length;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const chars = content.length;
  const readTime = Math.ceil(words / 150); // Assumes ~150 words per minute review speed
  
  statLines.textContent = `${lines} Line${lines !== 1 ? 's' : ''}`;
  statWords.textContent = `${words} Word${words !== 1 ? 's' : ''}`;
  statChars.textContent = `${chars} Char${chars !== 1 ? 's' : ''}`;
  statReadTime.textContent = `~${readTime}s review`;
  
  // Live Bracket Matching
  const isBalanced = validateBrackets(content);
  if (isBalanced) {
    bracketValidator.className = "validator-badge validator-balanced";
    bracketValidator.querySelector("span").textContent = "Brackets Balanced";
    bracketValidator.querySelector("svg").innerHTML = `<polyline points="20 6 9 17 4 12"/>`;
  } else {
    bracketValidator.className = "validator-badge validator-unbalanced";
    bracketValidator.querySelector("span").textContent = "Unbalanced Brackets";
    bracketValidator.querySelector("svg").innerHTML = `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`;
  }
}

function validateBrackets(code) {
  const stack = [];
  const open = ['(', '{', '['];
  const close = [')', '}', ']'];
  const matches = { ')': '(', '}': '{', ']': '[' };
  
  for (let char of code) {
    if (open.includes(char)) {
      stack.push(char);
    } else if (close.includes(char)) {
      if (stack.length === 0 || stack[stack.length - 1] !== matches[char]) {
        return false;
      }
      stack.pop();
    }
  }
  return stack.length === 0;
}

// 3. Issue Severity Filtering
function applySeverityFilter(severity) {
  const issueCards = document.querySelectorAll(".issue");
  issueCards.forEach(card => {
    const cardSeverity = card.getAttribute("data-severity");
    if (severity === "all" || cardSeverity === severity) {
      card.classList.remove("hidden-filter");
    } else {
      card.classList.add("hidden-filter");
    }
  });
}

// 4. Code Templates Loader Listener
if (codeTemplateSelect) {
  codeTemplateSelect.addEventListener("change", (e) => {
    const lang = e.target.value;
    if (templates[lang]) {
      document.getElementById("language").value = lang;
      document.getElementById("content").value = templates[lang];
      updateEditorStats();
      performAnalysis();
    }
  });
}

// 5. Clear Editor Listener
if (clearCodeBtn) {
  clearCodeBtn.addEventListener("click", () => {
    document.getElementById("content").value = "";
    codeTemplateSelect.selectedIndex = 0;
    updateEditorStats();
    statusPill.textContent = "Ready";
    statusPill.style.background = "";
    results.classList.add("hidden");
    executionContainer.classList.add("hidden");
  });
}

// 6. Theme Switching Logic
const currentTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", currentTheme);
updateThemeIcon(currentTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    let theme = document.documentElement.getAttribute("data-theme");
    let nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    updateThemeIcon(nextTheme);
  });
}

function updateThemeIcon(theme) {
  if (theme === "light") {
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  } else {
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  }
}

// 7. Audit Report Exporter Logic
if (exportReportBtn) {
  exportReportBtn.addEventListener("click", () => {
    const code = document.getElementById("content").value.trim();
    if (!code) {
      alert("Please write some code first to generate a report.");
      return;
    }
    
    const scoreText = confidence.textContent;
    const gradeText = qualityGrade.textContent;
    const summaryText = summary.textContent;
    const timeComp = timeComplexityVal.textContent;
    const spaceComp = spaceComplexityVal.textContent;
    const execution = executionOutput.querySelector("code").textContent;
    
    let reportMd = `# BugShield AI - Code Audit Report\n\n`;
    reportMd += `## Executive Summary\n`;
    reportMd += `- **Quality Grade**: ${gradeText}\n`;
    reportMd += `- **${scoreText}**\n`;
    reportMd += `- **Audit Synopsis**: ${summaryText}\n\n`;
    reportMd += `## Complexity Profile\n`;
    reportMd += `- **Time Complexity**: ${timeComp}\n`;
    reportMd += `- **Space Complexity**: ${spaceComp}\n\n`;
    
    reportMd += `## Static Analysis Findings\n`;
    const issueCards = document.querySelectorAll(".issue");
    if (issueCards.length === 0 || (issueCards.length === 1 && issueCards[0].getAttribute("data-severity") === "none")) {
      reportMd += `No issues detected in the source code.\n`;
    } else {
      issueCards.forEach((card, idx) => {
        const type = card.querySelector("h3").textContent;
        const severity = card.querySelector(".pill").textContent;
        const msg = card.querySelector("p").textContent;
        const line = card.querySelector(".issue-meta span").textContent;
        const suggestion = card.querySelector(".suggestion-code code");
        
        reportMd += `### Finding ${idx + 1}: [${severity}] ${type}\n`;
        reportMd += `- **Location**: ${line}\n`;
        reportMd += `- **Analysis**: ${msg}\n`;
        if (suggestion) {
          reportMd += `- **Recommendation**:\n  \`\`\`\n  ${suggestion.textContent.trim().split('\n').join('\n  ')}\n  \`\`\`\n`;
        }
        reportMd += `\n`;
      });
    }
    
    reportMd += `## Live Code Execution logs\n`;
    reportMd += `\`\`\`\n${execution.trim()}\n\`\`\`\n\n`;
    reportMd += `Report generated on: ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([reportMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// 8. Complexity Helper Modal Dialog Trigger
if (timeComplexityCard && spaceComplexityCard && complexityModal && closeComplexityModalBtn) {
  const openComplexityModal = () => {
    complexityModal.classList.remove("hidden");
    setTimeout(() => complexityModal.classList.add("active"), 10);
  };
  
  const closeComplexityModal = () => {
    complexityModal.classList.remove("active");
    setTimeout(() => complexityModal.classList.add("hidden"), 300);
  };
  
  timeComplexityCard.addEventListener("click", openComplexityModal);
  spaceComplexityCard.addEventListener("click", openComplexityModal);
  closeComplexityModalBtn.addEventListener("click", closeComplexityModal);
  
  complexityModal.addEventListener("click", (e) => {
    if (e.target === complexityModal) closeComplexityModal();
  });
  
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !complexityModal.classList.contains("hidden")) {
      closeComplexityModal();
    }
  });
}

// 9. Severity Filter tabs click listener
const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const severity = btn.getAttribute("data-filter");
    applySeverityFilter(severity);
  });
});

// 10. Register live statistics update listeners
document.getElementById("content").addEventListener("input", updateEditorStats);

// Initial trigger for empty editor stats on load
updateEditorStats();


