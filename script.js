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
        ["How do I start?", "start setup install verify first project"],
        ["What files do I get?", "workspace files templates governance memory"],
        ["How do I customize NoDrift?", "customize profile communication token use"],
        ["What if something sounds wrong?", "does not sound right error review corrective lesson"],
        ["How does NoDrift protect memory?", "memory continuity checkpoints topic maps"],
        ["What is the evidence?", "evidence audit confirmed drift hallucination"],
        ["How do updates work?", "corrective lessons update pack"],
        ["How do payments work?", "payment"],
        ["How do I use voice?", "voice planning review best practices"],
        ["Best practices", "best practices outline go side panel"],
      ],
    },
    {
      label: "Technical",
      options: [
        ["Reception-only protocol", "reception transmission LLM user authority"],
        ["LLM transmission vs reception", "LLM transmits NoDrift governs reception"],
        ["Corrective lessons", "corrective lessons training log incident"],
        ["Error classifications", "hallucination drift untruth unauthorized contamination"],
        ["Living Topic Maps", "living topic maps branch registry continuity"],
        ["Approval gates", "approval external action stop go"],
        ["Source fidelity", "source fidelity source register authority"],
        ["Audit coverage", "audit coverage candidate confirmed inconclusive"],
        ["Workspace file structure", "workspace files project memory governance templates"],
        ["Cross-LLM operation", "Claude Code Gemini DeepSeek ChatGPT Codex"],
      ],
    },
  ];

  const maximumInitialResults = 8;
  const maximumExpandedResults = 20;
  let searchIndexPromise;
  let searchIndex = [];
  let currentLimit = maximumInitialResults;
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
        const excerpt = cleanSearchText(text.replace(title, "")).slice(0, 280);
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
          <p class="global-search-help" data-search-status>Type a term or choose a preset. Results link to the closest matching section.</p>
          <div class="global-search-results" data-search-results></div>
          <button class="global-search-more" type="button" data-search-more hidden>Show more results</button>
        </div>
      </div>
    `;

    const select = modal.querySelector("[data-search-presets]");
    searchPresets.forEach((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.label;
      group.options.forEach(([label, value]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        optgroup.append(option);
      });
      select.append(optgroup);
    });

    document.body.append(modal);
  }

  function renderSearchResults(query) {
    const modal = document.querySelector("[data-global-search-modal]");
    if (!modal) return;
    const resultsElement = modal.querySelector("[data-search-results]");
    const status = modal.querySelector("[data-search-status]");
    const more = modal.querySelector("[data-search-more]");
    const trimmed = query.trim();

    if (!trimmed) {
      resultsElement.innerHTML = `<p class="global-search-empty">Choose a preset or type a word to search the visible site pages.</p>`;
      status.textContent = "Type a term or choose a preset. Results link to the closest matching section.";
      more.hidden = true;
      return;
    }

    const ranked = searchIndex
      .map((entry) => ({ entry, score: scoreSearchEntry(entry, trimmed) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.entry);

    const visible = ranked.slice(0, currentLimit);
    status.textContent = ranked.length
      ? `${ranked.length} matching section${ranked.length === 1 ? "" : "s"} found. Showing ${visible.length}.`
      : "No matching sections found.";

    resultsElement.innerHTML = visible.length
      ? visible
          .map(
            (entry) => `
              <a class="global-search-result" href="${escapeHtml(entry.url)}">
                <span>${escapeHtml(entry.page)}</span>
                <strong>${markSearchTerms(entry.title, trimmed)}</strong>
                <p>${markSearchTerms(entry.excerpt, trimmed)}</p>
              </a>
            `
          )
          .join("")
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
      renderSearchResults(input.value);
    });

    select.addEventListener("change", () => {
      currentLimit = maximumInitialResults;
      input.value = select.value;
      renderSearchResults(input.value);
      input.focus();
    });

    more.addEventListener("click", () => {
      currentLimit = maximumExpandedResults;
      renderSearchResults(input.value);
    });

    modal.addEventListener("click", (event) => {
      const link = event.target.closest(".global-search-result");
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
