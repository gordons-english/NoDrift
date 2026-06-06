const toast = document.querySelector(".toast");
let toastTimer;

function showPlaceholder(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

document.querySelectorAll("[data-placeholder]").forEach((button) => {
  button.addEventListener("click", () => {
    showPlaceholder(button.getAttribute("data-placeholder"));
  });
});

document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
  const header = button.closest(".site-header");
  if (!header) return;

  button.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-menu-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  header.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-menu-open");
      button.setAttribute("aria-expanded", "false");
    });
  });
});

document.querySelectorAll("[data-evidence-carousel]").forEach((carousel) => {
  const section = carousel.closest(".evidence-timeline-section");
  const previous = section?.querySelector("[data-carousel-prev]");
  const next = section?.querySelector("[data-carousel-next]");
  const cards = carousel.querySelectorAll("[data-evidence-card]");

  function updateCarouselControls() {
    if (cards.length <= 1) {
      if (previous) previous.disabled = true;
      if (next) next.disabled = true;
      return;
    }

    const maximum = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
    if (previous) previous.disabled = carousel.scrollLeft <= 2;
    if (next) next.disabled = carousel.scrollLeft >= maximum - 2;
  }

  function moveCarousel(direction) {
    carousel.scrollBy({
      left: direction * Math.max(280, carousel.clientWidth * 0.86),
      behavior: "smooth",
    });
  }

  previous?.addEventListener("click", () => moveCarousel(-1));
  next?.addEventListener("click", () => moveCarousel(1));
  carousel.addEventListener("scroll", updateCarouselControls, { passive: true });
  window.addEventListener("resize", updateCarouselControls);
  updateCarouselControls();
});

const currentProfile = document.querySelector("[data-current-profile]");
const profileNote = document.querySelector("[data-profile-note]");
const workflowSummary = document.querySelector("[data-workflow-summary]");
const communicationSummary = document.querySelector("[data-communication-summary]");
const tokenScore = document.querySelector("[data-token-estimate]");
const tokenLabel = document.querySelector("[data-token-label]");
const tokenMeter = document.querySelector("[data-token-meter]");
const tokenContributors = document.querySelector("[data-token-contributors]");
const rowSummaryCards = document.querySelectorAll("[data-row-summary]");

const profilePresets = {
  fast: {
    label: "Fast Work",
    note: "Shortest useful communication, light updates, brief explanation.",
    values: {
      "Work Leadership": "User Leads",
      "Question Handling": "Continue If Clear",
      "Communication Detail": "Direct Answer",
      "Language Level": "Plain Language",
      "Progress Updates": "Final Result Only",
      "Explanation Level": "Just Do The Work",
      "Evidence Status": "Critical Status Only",
    },
  },
  standard: {
    label: "Standard Work",
    note: "Clear default with visible approval boundaries.",
    values: {
      "Work Leadership": "Codex Leads With Approval",
      "Question Handling": "Group Questions",
      "Communication Detail": "Short Context",
      "Language Level": "Light Technical",
      "Progress Updates": "Milestone Updates",
      "Explanation Level": "Brief Notes",
      "Evidence Status": "Basic Status Labels",
    },
  },
  guided: {
    label: "Guided Work",
    note: "More explanation, visible progress, next-step guidance.",
    values: {
      "Work Leadership": "Codex Leads With Approval",
      "Question Handling": "One Question At A Time",
      "Communication Detail": "Fuller Context",
      "Language Level": "Technical When Useful",
      "Progress Updates": "Regular Updates",
      "Explanation Level": "Step By Step",
      "Evidence Status": "Detailed Source Labels",
    },
  },
  deep: {
    label: "Deep Support",
    note: "Highest explanation, visibility, and evidence status.",
    values: {
      "Work Leadership": "Approved Task Queue",
      "Question Handling": "Ask Before Major Steps",
      "Communication Detail": "Complete Explanation",
      "Language Level": "Full Technical",
      "Progress Updates": "Detailed Work Log",
      "Explanation Level": "Advanced Context",
      "Evidence Status": "Full Evidence Status",
    },
  },
};

let activeProfileKey = "standard";

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectedButtonFor(groupName) {
  const group = document.querySelector(`[data-choice-group="${groupName}"]`);
  return group ? group.querySelector(".choice-button.is-selected") : null;
}

function setGroupChoice(groupName, choiceValue) {
  const group = document.querySelector(`[data-choice-group="${groupName}"]`);
  if (!group) return;
  group.querySelectorAll(".choice-button").forEach((button) => {
    button.classList.toggle("is-selected", button.getAttribute("data-choice") === choiceValue);
  });
}

function applyProfile(profileKey) {
  const preset = profilePresets[profileKey];
  if (!preset) return;
  activeProfileKey = profileKey;

  document.querySelectorAll("[data-profile]").forEach((button) => {
    button.classList.toggle("is-selected", button.getAttribute("data-profile") === profileKey);
  });

  Object.entries(preset.values).forEach(([groupName, choiceValue]) => {
    setGroupChoice(groupName, choiceValue);
  });

  updateProfileSummary();
}

function setCustomProfile() {
  activeProfileKey = "custom";
  document.querySelectorAll("[data-profile]").forEach((button) => button.classList.remove("is-selected"));
  updateProfileSummary();
}

function summarize(sectionName) {
  return Array.from(document.querySelectorAll(`[data-summary-section="${sectionName}"]`)).map((group) => {
    const selected = group.querySelector(".choice-button.is-selected");
    const label = group.getAttribute("data-choice-group");
    return {
      key: summaryKey(label),
      label,
      value: selected ? selected.getAttribute("data-choice") : "Not selected",
      score: selected ? Number.parseFloat(selected.getAttribute("data-token-score")) || null : null,
    };
  });
}

function summaryKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderSummary(target, rows) {
  if (!target) return;
  target.innerHTML = rows
    .map((row) => `<div><dt>${escapeHTML(row.label)}</dt><dd>${escapeHTML(row.value)}</dd></div>`)
    .join("");
}

function tokenLabelFor(average) {
  if (average <= 1.75) return "Lean";
  if (average <= 2.5) return "Efficient-balanced";
  if (average <= 3.25) return "Guided";
  return "High-support";
}

function tokenLevelFor(score) {
  if (score <= 1.75) return "Lean";
  if (score <= 2.5) return "Moderate";
  if (score <= 3.25) return "Strong";
  return "Intensive";
}

function formatScore(score) {
  return Number.isFinite(score) ? score.toFixed(1) : "0.0";
}

function updateTokenEstimate(rows) {
  const scoredRows = rows.filter((row) => row.score);
  if (!scoredRows.length) return;

  const average = scoredRows.reduce((total, row) => total + row.score, 0) / scoredRows.length;
  const rounded = Math.round(average * 10) / 10;
  const percent = (average / 4) * 100;

  if (tokenScore) tokenScore.textContent = formatScore(rounded);
  if (tokenLabel) tokenLabel.textContent = tokenLabelFor(average);
  if (tokenMeter) tokenMeter.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function updateRowSummaries(rows) {
  rowSummaryCards.forEach((card) => {
    const row = rows.find((item) => item.key === card.getAttribute("data-row-summary"));
    if (!row) return;

    const score = row.score || 0;
    const percent = (score / 4) * 100;
    const value = card.querySelector("[data-row-value]");
    const scoreDisplay = card.querySelector("[data-row-score]");
    const label = card.querySelector("[data-row-label]");
    const meter = card.querySelector("[data-row-meter]");

    if (value) value.textContent = row.value;
    if (scoreDisplay) scoreDisplay.textContent = formatScore(score);
    if (label) label.textContent = tokenLevelFor(score);
    if (meter) meter.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  });
}

function updateProfileSummary() {
  if (currentProfile) {
    currentProfile.textContent =
      activeProfileKey === "custom" ? "Custom" : profilePresets[activeProfileKey]?.label || "Custom";
  }

  if (profileNote) {
    profileNote.textContent =
      activeProfileKey === "custom"
        ? "Custom profile. The settings below have been adjusted manually."
        : profilePresets[activeProfileKey]?.note || "";
  }

  const workflowRows = summarize("workflow");
  const communicationRows = summarize("communication");
  const scoredRows = [...workflowRows, ...communicationRows];
  renderSummary(workflowSummary, workflowRows);
  renderSummary(communicationSummary, communicationRows);
  updateRowSummaries(scoredRows);
  updateTokenEstimate(scoredRows);
}

document.querySelectorAll("[data-profile]").forEach((button) => {
  button.addEventListener("click", () => {
    applyProfile(button.getAttribute("data-profile"));
  });
});

document.querySelectorAll("[data-choice-group]").forEach((group) => {
  if (group.getAttribute("data-summary-section") === "profile") return;

  group.querySelectorAll(".choice-button").forEach((button) => {
    button.addEventListener("click", () => {
      group.querySelectorAll(".choice-button").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      setCustomProfile();
    });
  });
});

updateProfileSummary();

(() => {
  const searchPages = [
    { title: "Home", url: "index.html" },
    { title: "Evidence", url: "audit-summary.html" },
    { title: "Customize", url: "customize.html" },
    { title: "Best Practices", url: "best-practices.html" },
  ];

  const searchPresets = [
    {
      label: "User-friendly",
      options: [
        {
          key: "start",
          label: "How do I start?",
          query: "start setup workspace files verification prompt first project",
          answerTitle: "How to start with NoDrift for Codex",
          answer:
            "Download the NoDrift workspace starter, unzip it, copy the included workspace files into your Codex workspace folder, open Codex in that workspace, paste the setup prompt, run the verification prompt, customize your working profile, then begin your first project.",
          links: [
            { page: "Home", title: "What You Do", url: "index.html#top" },
            { page: "Home", title: "What NoDrift Does Next", url: "index.html#top" },
            { page: "Customize", title: "Customize Your Working Profile", url: "customize.html#workflow-settings-heading" },
            { page: "Best Practices", title: "Start With Clear NoDrift Control Habits", url: "best-practices.html#beginner-heading" },
          ],
        },
        {
          key: "files",
          label: "What files do I get?",
          query: "workspace files templates governance memory topic maps corrective lessons",
          answerTitle: "What the NoDrift workspace includes",
          answer:
            "The workspace package includes ready-to-copy governance files, approval boundaries, source-register templates, memory templates, Living Topic Maps, incident logs, corrective lessons, verification checklists, setup prompts, and a governed example.",
          links: [
            { page: "Home", title: "NoDrift for Codex v1", url: "index.html#top" },
            { page: "Home", title: "NoDrift Workspace Files", url: "index.html#included" },
            { page: "Evidence", title: "Paid NoDrift Workspace Includes", url: "audit-summary.html" },
            { page: "Best Practices", title: "Memory And Decisions", url: "best-practices.html#advanced-heading" },
          ],
        },
        {
          key: "customize",
          label: "How do I customize NoDrift?",
          query: "customize profile communication token use workflow settings",
          answerTitle: "How customization works",
          answer:
            "After the workspace is verified, ask Codex to customize your NoDrift working profile. NoDrift uses the same choices shown on this site: work leadership, question handling, communication detail, update style, teaching level, uncertainty reporting, evidence status, and other working preferences.",
          links: [
            { page: "Customize", title: "How NoDrift Works With You", url: "customize.html#workflow-settings-heading" },
            { page: "Customize", title: "What Affects Estimated Token Use", url: "customize.html#communication-settings-heading" },
            { page: "Home", title: "Customization And Memory", url: "index.html#included" },
            { page: "FAQ", title: "FAQ And How It Works", url: "index.html#faq" },
          ],
        },
        {
          key: "wrong",
          label: "What if something sounds wrong?",
          query: "does not sound right error review corrective lesson critical not critical",
          answerTitle: "What to do when an answer sounds wrong",
          answer:
            "Question it politely and directly. NoDrift treats the issue as a candidate error, preserves the relevant exchange, classifies the likely problem, and asks the user to decide whether the incident is Critical or Not Critical before it becomes a corrective lesson.",
          links: [
            { page: "Home", title: "Training And Defense Shield", url: "index.html#defense-shield" },
            { page: "Home", title: "Corrective Lessons Updates", url: "index.html#updates" },
            { page: "Evidence", title: "Corrective Training Loop", url: "audit-summary.html" },
            { page: "Best Practices", title: "Question Anything That Does Not Sound Right", url: "best-practices.html#beginner-heading" },
          ],
        },
        {
          key: "memory",
          label: "How does NoDrift protect memory?",
          query: "memory continuity checkpoints topic maps decisions context",
          answerTitle: "How NoDrift protects continuity",
          answer:
            "NoDrift does not rely on a long chat to remember everything. It keeps decisions, source boundaries, open questions, branches, checkpoints, and corrective lessons in private project-memory records so future sessions can find the current state without rebuilding it from scattered conversation history.",
          links: [
            { page: "Home", title: "Living Topic Maps", url: "index.html#topic-maps" },
            { page: "Evidence", title: "Memory Management Differs", url: "audit-summary.html" },
            { page: "Best Practices", title: "Preserve Memory And Decisions", url: "best-practices.html#advanced-heading" },
            { page: "Home", title: "NoDrift Workspace Files", url: "index.html#included" },
          ],
        },
        {
          key: "evidence",
          label: "What is the evidence?",
          query: "evidence audit confirmed drift hallucination candidate coverage",
          answerTitle: "What the current evidence means",
          answer:
            "The public evidence is an early founder evidence snapshot, not a guarantee. It reports measured threads, turns, output density, confirmed issues, candidate incidents, and audit limitations so the claims stay bounded and reviewable.",
          links: [
            { page: "Home", title: "Evidence Summary", url: "index.html#proof" },
            { page: "Evidence", title: "Full Audit Summary", url: "audit-summary.html" },
            { page: "Evidence", title: "Evidence Snapshots", url: "audit-summary.html#weekly-evidence" },
            { page: "Home", title: "Claim Boundary", url: "index.html#faq" },
          ],
        },
        {
          key: "updates",
          label: "How do updates work?",
          query: "corrective lessons update pack downloadable current lessons",
          answerTitle: "How corrective lesson updates work",
          answer:
            "When NoDrift improves a correction pattern, the reusable lesson can be published as a buyer-safe update pack. The user can add that update to private project memory without replacing the full governance package or exposing private incident history.",
          links: [
            { page: "Home", title: "Corrective Lessons Updates", url: "index.html#updates" },
            { page: "Download", title: "Corrective Lessons Update Pack", url: "downloads/nodrift-corrective-lessons-update-pack-2026-06-05.md" },
            { page: "Evidence", title: "Corrective Training Loop", url: "audit-summary.html" },
            { page: "Best Practices", title: "Review Memory As Diffs", url: "best-practices.html#advanced-heading" },
          ],
        },
        {
          key: "payments",
          label: "How do payments work?",
          query: "payment price coming soon buy NoDrift Codex",
          answerTitle: "Current payment status",
          answer:
            "Payment is not active yet. NoDrift for Codex v1 is listed as coming soon at $99, and the site does not currently collect payment or deliver a paid download path.",
          links: [
            { page: "Home", title: "Buy NoDrift For Codex v1", url: "index.html#faq" },
            { page: "FAQ", title: "Payment And Delivery", url: "index.html#faq" },
            { page: "Home", title: "NoDrift For Codex v1", url: "index.html#top" },
          ],
        },
        {
          key: "voice",
          label: "How do I use voice?",
          query: "voice planning review best practices dictation setup questions",
          answerTitle: "How to use voice with NoDrift",
          answer:
            "Use your device dictation when explaining a project, answering setup questions, reviewing pages, correcting unclear answers, and planning next steps. On Windows use built-in voice typing, on Mac use Dictation, and on Android use the keyboard microphone. It usually takes about ten minutes to get comfortable; the main obstacle is shyness, not ability.",
          links: [
            { page: "Best Practices", title: "Use Voice For Planning And Review", url: "best-practices.html#beginner-heading" },
            { page: "Best Practices", title: "Read The AI's Writing Actively", url: "best-practices.html#beginner-heading" },
            { page: "Customize", title: "Communication Settings", url: "customize.html#communication-settings-heading" },
            { page: "Home", title: "How NoDrift Starts", url: "index.html#top" },
          ],
        },
        {
          key: "best-practices",
          label: "Best practices",
          query: "best practices outline go side panel voice branches review",
          answerTitle: "The core NoDrift working habits",
          answer:
            "Plan before building, ask for an outline before execution, use only go to approve a task, keep separate chats for separate workstreams, use voice when helpful, read and review the AI's writing, and preserve decisions in private memory instead of relying on scrolling.",
          links: [
            { page: "Best Practices", title: "Beginner Habits", url: "best-practices.html#beginner-heading" },
            { page: "Best Practices", title: "Advanced Habits", url: "best-practices.html#advanced-heading" },
            { page: "Best Practices", title: "Technical Habits", url: "best-practices.html#technical-heading" },
            { page: "Home", title: "Living Topic Maps", url: "index.html#topic-maps" },
          ],
        },
      ],
    },
    {
      label: "Technical",
      options: [
        {
          key: "reception-only",
          label: "Reception-only protocol",
          query: "reception transmission LLM user authority outgoing messages files prompts",
          answerTitle: "NoDrift governs reception, not transmission",
          answer:
            "The LLM transmits generated output. NoDrift governs what the work session accepts, records, verifies, corrects, and acts on after reception. NoDrift does not attach governance files, memory files, or corrective logs to outgoing messages or conversation turns.",
          links: [
            { page: "Evidence", title: "How NoDrift Works Across LLM Tools", url: "audit-summary.html" },
            { page: "Evidence", title: "What NoDrift Does That LLMs Usually Do Not", url: "audit-summary.html" },
            { page: "Home", title: "NoDrift Does Not Control AI", url: "index.html#included" },
            { page: "Customize", title: "NoDrift Does Not Add Files To Turns", url: "customize.html" },
          ],
        },
        {
          key: "transmission-reception",
          label: "LLM transmission vs reception",
          query: "LLM transmits NoDrift governs reception user acceptance verified facts",
          answerTitle: "Transmission and reception are separate",
          answer:
            "The model generates the answer. NoDrift does not change that transmission. NoDrift controls the receiving process: whether a claim is trusted, whether a decision is approved, whether a source is checked, and whether an action is allowed to move forward.",
          links: [
            { page: "Home", title: "NoDrift Does Not Control AI", url: "index.html#included" },
            { page: "Evidence", title: "How NoDrift Works Across LLM Tools", url: "audit-summary.html" },
            { page: "Evidence", title: "Memory Management Differs", url: "audit-summary.html" },
          ],
        },
        {
          key: "corrective-lessons",
          label: "Corrective lessons",
          query: "corrective lessons training log incident recurrence review",
          answerTitle: "What corrective lessons do",
          answer:
            "Corrective lessons turn user-confirmed errors into reusable private rules. Each lesson records what went wrong, how to recognize the pattern, which governance rule applies, what the correct behavior should be, and whether the issue recurs.",
          links: [
            { page: "Home", title: "Corrective Lessons Updates", url: "index.html#updates" },
            { page: "Evidence", title: "The NoDrift Corrective Training Loop", url: "audit-summary.html" },
            { page: "Download", title: "Corrective Lessons Update Pack", url: "downloads/nodrift-corrective-lessons-update-pack-2026-06-05.md" },
            { page: "Best Practices", title: "Review Memory As Diffs", url: "best-practices.html#advanced-heading" },
          ],
        },
        {
          key: "error-classifications",
          label: "Error classifications",
          query: "hallucination drift untruth unauthorized contamination critical not critical",
          answerTitle: "How errors are classified",
          answer:
            "NoDrift can flag candidate issues such as hallucination, drift, untruth, unauthorized action, contamination, repeated comments, context-loss, or lazy response. The user confirms the incident status and decides whether it is Critical or Not Critical.",
          links: [
            { page: "Home", title: "Training And Defense Shield", url: "index.html#defense-shield" },
            { page: "Evidence", title: "Monitoring And Review", url: "audit-summary.html" },
            { page: "Evidence", title: "Corrective Training Loop", url: "audit-summary.html" },
            { page: "Best Practices", title: "Question Anything That Does Not Sound Right", url: "best-practices.html#beginner-heading" },
          ],
        },
        {
          key: "topic-maps",
          label: "Living Topic Maps",
          query: "living topic maps branch registry continuity decisions branches",
          answerTitle: "What Living Topic Maps preserve",
          answer:
            "Living Topic Maps keep the project path visible: objective, branches, decisions, approved wording, open questions, files, sources, risks, next actions, and status. They reduce scrolling and protect continuity when a chat becomes long.",
          links: [
            { page: "Home", title: "Living Topic Maps Protect The Conversation", url: "index.html#topic-maps" },
            { page: "Evidence", title: "How NoDrift Living Topic Maps Protect Continuity", url: "audit-summary.html" },
            { page: "Best Practices", title: "Preserve Memory And Decisions", url: "best-practices.html#advanced-heading" },
          ],
        },
        {
          key: "approval-gates",
          label: "Approval gates",
          query: "approval external action stop go permission boundaries",
          answerTitle: "What approval gates do",
          answer:
            "Approval gates stop consequential actions until the user has clearly approved them. They are used for file edits, publishing, uploads, external connections, payment changes, destructive actions, or decisions that change the project direction.",
          links: [
            { page: "Home", title: "NoDrift Does Not Control AI", url: "index.html#included" },
            { page: "Customize", title: "How NoDrift Works With You", url: "customize.html#workflow-settings-heading" },
            { page: "Best Practices", title: "Use Go To Approve Execution", url: "best-practices.html#beginner-heading" },
            { page: "Evidence", title: "How Governance Is Accessed", url: "audit-summary.html" },
          ],
        },
        {
          key: "source-fidelity",
          label: "Source fidelity",
          query: "source fidelity source register authority verified facts",
          answerTitle: "How source fidelity works",
          answer:
            "Source fidelity separates what was actually verified from what merely sounds plausible. NoDrift uses source registers and verification rules so important claims do not become project facts unless the source boundary is clear.",
          links: [
            { page: "Home", title: "NoDrift Workspace Files", url: "index.html#included" },
            { page: "Evidence", title: "What NoDrift Does That LLMs Usually Do Not", url: "audit-summary.html" },
            { page: "Best Practices", title: "Source Note", url: "best-practices.html#beginner-heading" },
          ],
        },
        {
          key: "audit-coverage",
          label: "Audit coverage",
          query: "audit coverage candidate confirmed inconclusive evidence snapshot",
          answerTitle: "What audit coverage means",
          answer:
            "Audit coverage describes what was actually reviewed. A clean count is not a universal guarantee. NoDrift separates confirmed incidents, candidate incidents, inconclusive areas, and incomplete coverage so public evidence does not overclaim.",
          links: [
            { page: "Evidence", title: "Full Audit Summary", url: "audit-summary.html" },
            { page: "Evidence", title: "Evidence Snapshots", url: "audit-summary.html#weekly-evidence" },
            { page: "Home", title: "Evidence Summary", url: "index.html#proof" },
          ],
        },
        {
          key: "workspace-structure",
          label: "Workspace file structure",
          query: "workspace files project memory governance templates source register",
          answerTitle: "How the workspace files are organized",
          answer:
            "The user copies the NoDrift workspace files into the Codex workspace folder. Codex then checks that the governance files, memory templates, source register, approval matrix, topic maps, incident logs, and setup prompts are visible before work begins.",
          links: [
            { page: "Home", title: "NoDrift For Codex v1", url: "index.html#top" },
            { page: "Home", title: "NoDrift Workspace Files", url: "index.html#included" },
            { page: "Evidence", title: "Paid NoDrift Workspace Includes", url: "audit-summary.html" },
          ],
        },
        {
          key: "cross-llm",
          label: "Cross-LLM operation",
          query: "Claude Code Gemini DeepSeek ChatGPT Codex LLM tools",
          answerTitle: "How NoDrift adapts across LLM tools",
          answer:
            "NoDrift for Codex is the first edition, not the limit of the system. The same reception-side method can adapt to Claude Code, ChatGPT projects and agents, Gemini-style tools, DeepSeek-style tools, and other workspaces when they support persistent instructions, files, records, or repeatable project procedure.",
          links: [
            { page: "Evidence", title: "How NoDrift Works Across LLM Tools", url: "audit-summary.html" },
            { page: "Home", title: "Pipeline", url: "index.html#faq" },
            { page: "Home", title: "NoDrift Does Not Control AI", url: "index.html#included" },
          ],
        },
      ],
    },
  ];

  const maximumInitialResults = 8;
  const maximumExpandedResults = 20;
  let searchIndexPromise;
  let searchIndex = [];
  let currentLimit = maximumInitialResults;
  let activePresetKey = "";
  let highlightedTarget;

  function normalizeSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function slugifySearchText(value) {
    return normalizeSearchText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "section";
  }

  function cleanSearchText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getSearchPreset(key) {
    return searchPresets.flatMap((group) => group.options).find((preset) => preset.key === key);
  }

  function makeSearchExcerpt(text, title) {
    const source = cleanSearchText(text.replace(title, " "));
    if (source.length <= 280) return source;
    const shortened = source.slice(0, 280);
    const sentenceEnd = Math.max(shortened.lastIndexOf(". "), shortened.lastIndexOf("? "), shortened.lastIndexOf("! "));
    if (sentenceEnd > 120) return `${shortened.slice(0, sentenceEnd + 1).trim()}...`;
    const wordEnd = shortened.lastIndexOf(" ");
    return `${shortened.slice(0, wordEnd > 120 ? wordEnd : 280).trim()}...`;
  }

  function stripSearchMarkup(node) {
    return cleanSearchText(node?.textContent || "");
  }

  function generatedHeadingId(heading, index) {
    return `search-${String(index + 1).padStart(2, "0")}-${slugifySearchText(stripSearchMarkup(heading))}`;
  }

  function addGeneratedSearchAnchors(root = document) {
    root.querySelectorAll("main h1, main h2, main h3, main h4").forEach((heading, index) => {
      if (!heading.id) heading.id = generatedHeadingId(heading, index);
    });
  }

  function highlightCurrentTarget() {
    if (!window.location.hash) return;
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!target) return;
    if (highlightedTarget) highlightedTarget.classList.remove("search-target-highlight");
    highlightedTarget = target;
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
      target.classList.add("search-target-highlight");
      window.setTimeout(() => target.classList.remove("search-target-highlight"), 2600);
    });
  }

  function extractPageSearchEntries(html, page) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    addGeneratedSearchAnchors(doc);
    const main = doc.querySelector("main") || doc.body;
    const headings = [...main.querySelectorAll("h1, h2, h3, h4")];

    return headings
      .map((heading, index) => {
        const title = stripSearchMarkup(heading);
        if (!title || title.length < 3) return null;
        const container = heading.closest("article, section") || heading.parentElement || heading;
        const text = stripSearchMarkup(container);
        if (text.length < 45) return null;
        const excerpt = makeSearchExcerpt(text, title);
        const id = heading.id || generatedHeadingId(heading, index);
        return {
          page: page.title,
          title,
          url: `${page.url}#${id}`,
          text,
          excerpt: excerpt || text.slice(0, 280),
        };
      })
      .filter(Boolean);
  }

  async function loadSearchIndex() {
    if (searchIndexPromise) return searchIndexPromise;
    searchIndexPromise = Promise.all(
      searchPages.map(async (page) => {
        try {
          const response = await fetch(page.url, { cache: "no-cache" });
          if (!response.ok) throw new Error(`Could not load ${page.url}`);
          return extractPageSearchEntries(await response.text(), page);
        } catch {
          const currentFile = window.location.pathname.split("/").pop() || "index.html";
          if (currentFile === page.url || (currentFile === "" && page.url === "index.html")) {
            return extractPageSearchEntries(document.documentElement.outerHTML, page);
          }
          return [];
        }
      })
    ).then((groups) => {
      searchIndex = groups.flat();
      return searchIndex;
    });
    return searchIndexPromise;
  }

  function scoreSearchEntry(entry, query) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return 0;
    const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 1);
    const title = normalizeSearchText(entry.title);
    const body = normalizeSearchText(`${entry.page} ${entry.title} ${entry.text}`);
    let score = body.includes(normalizedQuery) ? 60 : 0;

    tokens.forEach((token) => {
      if (title.includes(token)) score += 12;
      if (body.includes(token)) score += 4;
    });

    const matchedTokens = tokens.filter((token) => body.includes(token)).length;
    if (tokens.length > 2 && matchedTokens < Math.ceil(tokens.length / 3)) return 0;
    return score;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function markSearchTerms(text, query) {
    const escaped = escapeHtml(text);
    const tokens = normalizeSearchText(query)
      .split(/\s+/)
      .filter((token) => token.length > 2)
      .slice(0, 6);
    if (!tokens.length) return escaped;
    return tokens.reduce((current, token) => {
      const expression = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
      return current.replace(expression, "<mark>$1</mark>");
    }, escaped);
  }

  function buildSearchModal() {
    if (document.querySelector("[data-global-search-modal]")) return;

    const modal = document.createElement("div");
    modal.className = "global-search-modal";
    modal.setAttribute("data-global-search-modal", "");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "global-search-title");
    modal.innerHTML = `
      <div class="global-search-dialog">
        <div class="global-search-header">
          <h2 id="global-search-title">Search The Site</h2>
          <button class="global-search-close" type="button" data-search-close aria-label="Close search">×</button>
        </div>
        <div class="global-search-body">
          <div class="global-search-controls">
            <input class="global-search-input" type="search" data-search-input placeholder="Search the site" autocomplete="off" />
            <select class="global-search-select" data-search-presets aria-label="Preset searches">
              <option value="">Preset searches</option>
            </select>
          </div>
          <p class="global-search-help" data-search-status>Preset questions show a direct answer first. Typed searches show matching sections.</p>
          <div class="global-search-results" data-search-results></div>
          <button class="global-search-more" type="button" data-search-more hidden>Show more results</button>
        </div>
      </div>
    `;

    const select = modal.querySelector("[data-search-presets]");
    searchPresets.forEach((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.label;
      group.options.forEach((preset) => {
        const option = document.createElement("option");
        option.value = preset.key;
        option.textContent = preset.label;
        optgroup.append(option);
      });
      select.append(optgroup);
    });

    document.body.append(modal);
  }

  function renderPresetAnswer(preset) {
    return `
      <article class="global-search-answer">
        <span>Direct answer</span>
        <h3>${escapeHtml(preset.answerTitle)}</h3>
        <p>${escapeHtml(preset.answer)}</p>
      </article>
    `;
  }

  function renderPresetLinks(preset) {
    if (!preset.links?.length) return "";
    return `
      <div class="global-search-guided-links" aria-label="Best supporting links">
        <h3>Best supporting links</h3>
        <div>
          ${preset.links
            .map(
              (link) => `
                <a class="global-search-guided-link" href="${escapeHtml(link.url)}">
                  <span>${escapeHtml(link.page)}</span>
                  <strong>${escapeHtml(link.title)}</strong>
                </a>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderSectionResults(entries, query) {
    return entries
      .map(
        (entry) => `
          <a class="global-search-result" href="${escapeHtml(entry.url)}">
            <span>${escapeHtml(entry.page)}</span>
            <strong>${markSearchTerms(entry.title, query)}</strong>
            <p>${markSearchTerms(entry.excerpt, query)}</p>
          </a>
        `
      )
      .join("");
  }

  function renderSearchResults(query) {
    const modal = document.querySelector("[data-global-search-modal]");
    if (!modal) return;
    const resultsElement = modal.querySelector("[data-search-results]");
    const status = modal.querySelector("[data-search-status]");
    const more = modal.querySelector("[data-search-more]");
    const preset = getSearchPreset(activePresetKey);
    const trimmed = query.trim();
    const effectiveQuery = preset?.query || trimmed;

    if (!trimmed && !preset) {
      resultsElement.innerHTML = `<p class="global-search-empty">Choose a preset or type a word to search the visible site pages.</p>`;
      status.textContent = "Preset questions show a direct answer first. Typed searches show matching sections.";
      more.hidden = true;
      return;
    }

    const ranked = searchIndex
      .map((entry) => ({ entry, score: scoreSearchEntry(entry, effectiveQuery) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.entry);

    if (preset) {
      const visible = ranked.slice(0, currentLimit === maximumExpandedResults ? 8 : 4);
      const related = visible.length
        ? `<h3 class="global-search-related-heading">Related matching sections</h3>${renderSectionResults(visible, effectiveQuery)}`
        : "";

      resultsElement.innerHTML = `${renderPresetAnswer(preset)}${renderPresetLinks(preset)}${related}`;
      status.textContent = `Showing a direct answer, ${preset.links?.length || 0} key link${
        preset.links?.length === 1 ? "" : "s"
      }${visible.length ? `, and ${visible.length} related section${visible.length === 1 ? "" : "s"}.` : "."}`;
      more.hidden = ranked.length <= visible.length || currentLimit >= maximumExpandedResults;
      return;
    }

    const visible = ranked.slice(0, currentLimit);
    status.textContent = ranked.length
      ? `${ranked.length} matching section${ranked.length === 1 ? "" : "s"} found. Showing ${visible.length}.`
      : "No matching sections found.";

    resultsElement.innerHTML = visible.length
      ? renderSectionResults(visible, trimmed)
      : `<p class="global-search-empty">No result found for “${escapeHtml(trimmed)}”. Try a broader word or choose a preset.</p>`;

    more.hidden = ranked.length <= currentLimit || currentLimit >= maximumExpandedResults;
  }

  async function openGlobalSearch() {
    buildSearchModal();
    const modal = document.querySelector("[data-global-search-modal]");
    const input = modal.querySelector("[data-search-input]");
    const select = modal.querySelector("[data-search-presets]");
    const header = document.querySelector(".site-header");
    header?.classList.remove("is-menu-open");
    header?.querySelector("[data-menu-toggle]")?.setAttribute("aria-expanded", "false");

    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    await loadSearchIndex();
    currentLimit = maximumInitialResults;
    select.value = "";
    activePresetKey = "";
    renderSearchResults(input.value);
    input.focus();
  }

  function closeGlobalSearch() {
    const modal = document.querySelector("[data-global-search-modal]");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function installGlobalSearch() {
    addGeneratedSearchAnchors();
    window.addEventListener("hashchange", highlightCurrentTarget);
    highlightCurrentTarget();

    const nav = document.querySelector(".nav-links");
    if (nav && !nav.querySelector("[data-search-open]")) {
      const button = document.createElement("button");
      button.className = "nav-search-button";
      button.type = "button";
      button.setAttribute("data-search-open", "");
      button.textContent = "Search";
      nav.append(button);
    }

    buildSearchModal();
    const modal = document.querySelector("[data-global-search-modal]");
    const input = modal.querySelector("[data-search-input]");
    const select = modal.querySelector("[data-search-presets]");
    const more = modal.querySelector("[data-search-more]");

    document.querySelectorAll("[data-search-open]").forEach((button) => {
      button.addEventListener("click", openGlobalSearch);
    });

    modal.querySelector("[data-search-close]").addEventListener("click", closeGlobalSearch);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeGlobalSearch();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeGlobalSearch();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openGlobalSearch();
      }
    });

    input.addEventListener("input", () => {
      currentLimit = maximumInitialResults;
      select.value = "";
      activePresetKey = "";
      renderSearchResults(input.value);
    });

    select.addEventListener("change", () => {
      currentLimit = maximumInitialResults;
      activePresetKey = select.value;
      const preset = getSearchPreset(activePresetKey);
      input.value = preset?.label || "";
      renderSearchResults(input.value);
      input.focus();
    });

    more.addEventListener("click", () => {
      currentLimit = maximumExpandedResults;
      renderSearchResults(input.value);
    });

    modal.addEventListener("click", (event) => {
      const link = event.target.closest(".global-search-result, .global-search-guided-link");
      if (!link) return;
      const destination = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      closeGlobalSearch();
      if (destination.pathname === current.pathname && destination.hash) {
        event.preventDefault();
        window.location.hash = destination.hash;
        highlightCurrentTarget();
      }
    });
  }

  installGlobalSearch();
})();
