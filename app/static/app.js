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

// New premium UI and Video selectors
const tabGifBtn = document.getElementById("tab-gif-btn");
const tabVideoBtn = document.getElementById("tab-video-btn");
const gifDemoPanel = document.getElementById("gif-demo-panel");
const videoTutorialPanel = document.getElementById("video-tutorial-panel");

const helpVideo = document.getElementById("help-video");
const helpVideoSource = document.getElementById("help-video-source");
const videoOverlayPlay = document.getElementById("video-overlay-play");
const videoPlayPause = document.getElementById("video-play-pause");
const playPauseIcon = document.getElementById("play-pause-icon");
const videoTimelineContainer = document.getElementById("video-timeline-container");
const videoProgress = document.getElementById("video-progress");
const videoTime = document.getElementById("video-time");
const videoMute = document.getElementById("video-mute");
const muteIcon = document.getElementById("mute-icon");
const videoFullscreen = document.getElementById("video-fullscreen");
const customVideoContainer = document.getElementById("custom-video-container");
const videoPlaceholder = document.getElementById("video-placeholder");

const helpVideoUpload = document.getElementById("help-video-upload");
const uploadNameDisplay = document.getElementById("upload-name-display");
const helpVideoUrlInput = document.getElementById("help-video-url");
const helpVideoUrlSave = document.getElementById("help-video-url-save");
const resetVideoBtn = document.getElementById("reset-video-btn");

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
    const analyzeRes = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, content }),
    });

    const data = await analyzeRes.json();

    summary.textContent = data.summary;
    confidence.textContent = `Confidence: ${Math.round(data.confidence * 100)}%`;

    // Record stats
    recordScan(data.confidence, data.issues ? data.issues.length : 0);

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
          suggestionHtml = `
            <div class="issue-suggestion">
              <div class="suggestion-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="display: flex; align-items: center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>
                  Suggested Fix:
                </span>
                <button type="button" class="clipboard-btn suggestion-copy-btn">Copy Fix</button>
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

    statusPill.textContent = "Analysis complete";
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

document.getElementById("language").addEventListener("change", () => {
  updateEditorTabName();
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
}`,

  cpp: `#include <iostream>
#include <cstring>

void process() {
    char buffer[8];
    // TODO: bounds validation
    std::strcpy(buffer, "This is a very long string that will overflow!"); // Buffer Overflow
    
    int* ptr = new int(10);
    std::cout << "Value: " << *ptr << std::endl;
    // FIXME: missing delete ptr; memory leak
}`,

  typescript: `function updateScore(user: any): void { // unsafe any type usage
  console.log("Updating score for user: " + user.name);
  
  // TODO: implement validation check
  const value: string = user.score as string; // unsafe type assertion
  console.log(value!.length); // non-null assertion bypass
}`,

  csharp: `using System;
using System.Data.SqlClient;

class Program {
    static void Main() {
        string user = "admin";
        // TODO: use parameterized query to prevent SQL Injection
        string query = "SELECT * FROM Users WHERE Username = '" + user + "'";
        Console.WriteLine("Executing: " + query);
    }
}`,

  go: `package main

import (
	"fmt"
	"os"
)

func main() {
	// TODO: Handle potential file read errors
	file, _ := os.Open("config.json") // Ignoring error return value!
	fmt.Println("File opened successfully:", file)
}`,

  c: `#include <stdio.h>
#include <string.h>

void run_c() {
    char dest[5];
    // TODO: check bounds
    strcpy(dest, "LongerString"); // Buffer overflow
    printf("Copied: %s\\n", dest);
}`,

  rust: `fn test_rust() {
    let mut num = 5;
    // Unnecessary mutable variable binding
    println!("Number is: {}", num);
    
    // TODO: refactor unsafe memory mapping
    unsafe {
        let r1 = &num as *const i32;
        println!("Raw pointer points to: {}", *r1);
    }
}`,

  php: `<?php
function login($user, $pass) {
    $conn = new mysqli("localhost", "root", "", "test");
    // TODO: use bound parameters to prevent SQL injection
    $sql = "SELECT * FROM users WHERE user = '" . $user . "' AND pass = '" . $pass . "'";
    $result = $conn->query($sql);
    
    if ($user == 0) { // Loose comparison issue
        echo "Loose checking passed";
    }
}
?>`
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
      updateEditorTabName();
      updateEditorStats();
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

// 10. Register live statistics update listeners & Copy Fix Delegation
document.getElementById("content").addEventListener("input", () => {
  updateEditorStats();

  const statusText = document.getElementById("editor-status-text");
  if (statusText) {
    statusText.textContent = "Editing...";
    statusText.style.color = "var(--primary-accent)";
  }

  const contentVal = document.getElementById("content").value.trim();
  if (!contentVal) {
    statusPill.textContent = "Ready";
    statusPill.style.background = "";
    results.classList.add("hidden");
  }
});

// Event delegation for dynamically added Copy Fix buttons to prevent syntax escape bugs
const issuesContainer = document.getElementById("issues");
if (issuesContainer) {
  issuesContainer.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("suggestion-copy-btn")) {
      const btn = e.target;
      const codeBlock = btn.closest(".issue-suggestion").querySelector(".suggestion-code code");
      if (codeBlock) {
        const codeText = codeBlock.textContent;
        navigator.clipboard.writeText(codeText).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = 'Copy Fix';
          }, 2000);
        });
      }
    }
  });
}

// Initial trigger for empty editor stats on load
updateEditorStats();
updateEditorTabName();

// --- STATS DASHBOARD LOGIC ---
function initStats() {
  const totalScans = parseInt(localStorage.getItem("total_scans") || "0");
  const bugsFound = parseInt(localStorage.getItem("bugs_found") || "0");
  const totalScore = parseFloat(localStorage.getItem("total_score") || "0");
  updateStatsUI(totalScans, bugsFound, totalScore);
}

function updateStatsUI(totalScans, bugsFound, totalScore) {
  const totalScansEl = document.getElementById("stats-total-scans");
  const bugsFoundEl = document.getElementById("stats-bugs-found");
  const avgScoreEl = document.getElementById("stats-avg-score");

  if (totalScansEl) totalScansEl.textContent = totalScans;
  if (bugsFoundEl) bugsFoundEl.textContent = bugsFound;

  if (avgScoreEl) {
    if (totalScans > 0) {
      const avg = Math.round((totalScore / totalScans) * 100);
      let grade = "F";
      if (avg >= 90) grade = "A+";
      else if (avg >= 80) grade = "A";
      else if (avg >= 70) grade = "B";
      else if (avg >= 50) grade = "C";
      avgScoreEl.textContent = `${grade} (${avg}%)`;
    } else {
      avgScoreEl.textContent = "-%";
    }
  }
}

function recordScan(confidenceScore, newBugsCount) {
  const totalScans = parseInt(localStorage.getItem("total_scans") || "0") + 1;
  const bugsFound = parseInt(localStorage.getItem("bugs_found") || "0") + newBugsCount;
  const totalScore = parseFloat(localStorage.getItem("total_score") || "0") + confidenceScore;

  localStorage.setItem("total_scans", totalScans.toString());
  localStorage.setItem("bugs_found", bugsFound.toString());
  localStorage.setItem("total_score", totalScore.toString());

  updateStatsUI(totalScans, bugsFound, totalScore);
}

// --- DYNAMIC IDE TAB RENAMING ---
function updateEditorTabName() {
  const lang = document.getElementById("language").value;
  const tabTitle = document.getElementById("editor-tab-title");
  const tabIcon = document.getElementById("editor-tab-icon");
  const editorStatusText = document.getElementById("editor-status-text");

  let filename = "main.py";
  let iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;

  if (lang === "python") {
    filename = "main.py";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffe082" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 2c1.7 0 3.2.7 4.3 1.8L12 10.1l-4.3-4.3C8.8 4.7 10.3 4 12 4zm-8 8c0-1.7.7-3.2 1.8-4.3L10.1 12l-4.3 4.3C4.7 15.2 4 13.7 4 12zm8 8c-1.7 0-3.2-.7-4.3-1.8L12 13.9l4.3 4.3c-1.1 1.1-2.6 1.8-4.3 1.8zm8-8c0 1.7-.7 3.2-1.8 4.3L13.9 12l4.3-4.3c1.1 1.1 1.8 2.6 1.8 4.3z"/></svg>`;
  } else if (lang === "javascript") {
    filename = "app.js";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffd54f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3V3z"/><path d="M18 17h-2.5c-.8 0-1.5-.7-1.5-1.5V11c0-.8.7-1.5 1.5-1.5H18m-6.5 7.5v-4c0-.8-.7-1.5-1.5-1.5H7.5"/></svg>`;
  } else if (lang === "java") {
    filename = "App.java";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff8a65" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  } else if (lang === "cpp") {
    filename = "main.cpp";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9H9v6h6"/></svg>`;
  } else if (lang === "typescript") {
    filename = "app.ts";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M12 8v8m-4-8h8"/></svg>`;
  } else if (lang === "csharp") {
    filename = "Program.cs";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ba68c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`;
  } else if (lang === "go") {
    filename = "main.go";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4dd0e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
  } else if (lang === "c") {
    filename = "main.c";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#90a4ae" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 12H9"/></svg>`;
  } else if (lang === "rust") {
    filename = "main.rs";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffb74d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>`;
  } else if (lang === "php") {
    filename = "index.php";
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7986cb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
  }

  if (tabTitle) tabTitle.textContent = filename;
  if (tabIcon) tabIcon.innerHTML = iconSvg;
  if (editorStatusText) {
    editorStatusText.textContent = "Saved";
    editorStatusText.style.color = "var(--text-muted)";
  }
}



// --- CUSTOM HELP VIDEO & INDEXEDDB LOGIC ---
const dbName = "HelpVideoDB";
const storeName = "videos";

function saveVideoToDB(blob, name) {
  const request = indexedDB.open(dbName, 1);
  request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore(storeName);
  };
  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(blob, "custom_video");
    localStorage.setItem("help_video_name", name);
    localStorage.removeItem("help_video_url");
    loadHelpVideo();
  };
}

function loadVideoFromDB(callback) {
  const request = indexedDB.open(dbName, 1);
  request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore(storeName);
  };
  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction(storeName, "readonly");
    const getReq = tx.objectStore(storeName).get("custom_video");
    getReq.onsuccess = () => {
      callback(getReq.result || null);
    };
    getReq.onerror = () => callback(null);
  };
  request.onerror = () => callback(null);
}

function clearVideoFromDB() {
  const request = indexedDB.open(dbName, 1);
  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete("custom_video");
    localStorage.removeItem("help_video_name");
    localStorage.removeItem("help_video_url");
    showVideoPlaceholder();
  };
}

function loadHelpVideo() {
  const customUrl = localStorage.getItem("help_video_url");
  const customName = localStorage.getItem("help_video_name");

  if (customUrl) {
    helpVideoSource.src = customUrl;
    helpVideo.load();
    if (videoPlaceholder) videoPlaceholder.classList.add("hidden");
    if (customVideoContainer) customVideoContainer.classList.remove("hidden");
    if (uploadNameDisplay) uploadNameDisplay.textContent = `URL: ${customUrl.substring(0, 30)}...`;
    if (helpVideoUrlInput) helpVideoUrlInput.value = customUrl;
  } else if (customName) {
    if (uploadNameDisplay) uploadNameDisplay.textContent = `Loading ${customName}...`;
    loadVideoFromDB((blob) => {
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        helpVideoSource.src = objectUrl;
        helpVideo.load();
        if (videoPlaceholder) videoPlaceholder.classList.add("hidden");
        if (customVideoContainer) customVideoContainer.classList.remove("hidden");
        if (uploadNameDisplay) uploadNameDisplay.textContent = customName;
      } else {
        loadDefaultStaticVideo();
      }
    });
  } else {
    loadDefaultStaticVideo();
  }
}

function loadDefaultStaticVideo() {
  helpVideoSource.src = "/public/help.mp4";
  helpVideo.load();
  if (videoPlaceholder) videoPlaceholder.classList.add("hidden");
  if (customVideoContainer) customVideoContainer.classList.remove("hidden");
  if (uploadNameDisplay) uploadNameDisplay.textContent = "Default Video (/public/help.mp4)";
}

function showVideoPlaceholder() {
  loadDefaultStaticVideo();
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Help Modal Tabs Switch
if (tabGifBtn && tabVideoBtn) {
  tabGifBtn.addEventListener("click", () => {
    tabGifBtn.classList.add("active");
    tabVideoBtn.classList.remove("active");
    gifDemoPanel.classList.remove("hidden");
    videoTutorialPanel.classList.add("hidden");
    if (helpVideo) helpVideo.pause();
  });

  tabVideoBtn.addEventListener("click", () => {
    tabVideoBtn.classList.add("active");
    tabGifBtn.classList.remove("active");
    videoTutorialPanel.classList.remove("hidden");
    gifDemoPanel.classList.add("hidden");
  });
}

// Video Player Custom Controls setup
if (helpVideo) {
  const togglePlay = () => {
    if (helpVideo.paused) {
      helpVideo.play();
    } else {
      helpVideo.pause();
    }
  };

  if (videoPlayPause) videoPlayPause.addEventListener("click", togglePlay);
  if (videoOverlayPlay) videoOverlayPlay.addEventListener("click", togglePlay);
  helpVideo.addEventListener("click", togglePlay);

  helpVideo.addEventListener("play", () => {
    if (customVideoContainer) customVideoContainer.classList.add("playing");
    if (playPauseIcon) {
      playPauseIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
    }
  });

  helpVideo.addEventListener("pause", () => {
    if (customVideoContainer) customVideoContainer.classList.remove("playing");
    if (playPauseIcon) {
      playPauseIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
    }
  });

  helpVideo.addEventListener("timeupdate", () => {
    if (helpVideo.duration) {
      const progressPercent = (helpVideo.currentTime / helpVideo.duration) * 100;
      if (videoProgress) videoProgress.style.width = `${progressPercent}%`;
      if (videoTime) {
        videoTime.textContent = `${formatTime(helpVideo.currentTime)} / ${formatTime(helpVideo.duration)}`;
      }
    }
  });

  if (videoTimelineContainer) {
    videoTimelineContainer.addEventListener("click", (e) => {
      const rect = videoTimelineContainer.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      helpVideo.currentTime = pos * helpVideo.duration;
    });
  }

  if (videoMute) {
    videoMute.addEventListener("click", () => {
      helpVideo.muted = !helpVideo.muted;
      if (helpVideo.muted) {
        if (muteIcon) {
          muteIcon.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2"/>`;
        }
      } else {
        if (muteIcon) {
          muteIcon.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>`;
        }
      }
    });
  }

  if (videoFullscreen) {
    videoFullscreen.addEventListener("click", () => {
      if (customVideoContainer) {
        if (!document.fullscreenElement) {
          customVideoContainer.requestFullscreen().catch(err => {
            console.error("Error fullscreen:", err);
          });
        } else {
          document.exitFullscreen();
        }
      }
    });
  }
}

// File and URL handlers
if (helpVideoUpload) {
  helpVideoUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (uploadNameDisplay) uploadNameDisplay.textContent = `Saving ${file.name}...`;
      saveVideoToDB(file, file.name);
    }
  });
}

if (helpVideoUrlSave) {
  helpVideoUrlSave.addEventListener("click", () => {
    const url = helpVideoUrlInput.value.trim();
    if (url) {
      localStorage.setItem("help_video_url", url);
      localStorage.removeItem("help_video_name");
      clearVideoFromDB();
      loadHelpVideo();
    }
  });
}

if (resetVideoBtn) {
  resetVideoBtn.addEventListener("click", () => {
    clearVideoFromDB();
  });
}

// Initialize Stats and Help Video on page load
initStats();
loadHelpVideo();


