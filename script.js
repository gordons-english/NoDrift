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
