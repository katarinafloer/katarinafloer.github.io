const repositoryApiUrl =
  "https://api.github.com/repos/katarinafloer/katarinafloer.github.io/commits/main";
const listMarkdownUrl = "kates-list.md";

const list = document.querySelector("#reading-list");
const sectionMenu = document.querySelector("#section-menu");
const topicFilters = document.querySelector("#topic-filters");
const lastUpdatedElement = document.querySelector("#last-updated");
let activeTopic = "All";
let currentSections = [];

function openLinksInNewTabs(root = document) {
  root.querySelectorAll('a[href]:not([href^="#"])').forEach((link) => {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseListMarkdown(markdown) {
  const sections = [];
  let currentSection = null;
  let currentItem = null;

  markdown.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    if (line.startsWith("## ")) {
      currentSection = {
        title: line.replace(/^##\s+/, ""),
        description: "",
        items: [],
      };
      sections.push(currentSection);
      currentItem = null;
      return;
    }

    if (!currentSection) {
      return;
    }

    const listItemMatch = line.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s+-\s*([^|]*))?(?:\s+\|\s+([^|]+))?(?:\s+\|\s+(.+))?$/);

    if (listItemMatch) {
      const topics = (listItemMatch[4] || "Untagged")
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean);

      currentItem = {
        title: listItemMatch[1].trim(),
        url: listItemMatch[2].trim(),
        description: listItemMatch[3]?.trim() || "",
        topics: topics.length ? topics : ["Untagged"],
        date: listItemMatch[5]?.trim() || "",
      };
      currentSection.items.push(currentItem);
      return;
    }

    if (currentItem) {
      currentItem.description = currentItem.description
        ? `${currentItem.description} ${line}`
        : line;
      return;
    }

    currentSection.description = currentSection.description
      ? `${currentSection.description} ${line}`
      : line;
  });

  return sections;
}

function renderSectionMenu(sections) {
  const menuItems = sections.map((section) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${slugify(section.title)}`;
    link.textContent = section.title;
    item.append(link);
    return item;
  });

  sectionMenu.replaceChildren(...menuItems);
}

function renderListItem(item) {
  const listItem = document.createElement("li");
  listItem.className = "list-item";

  const link = document.createElement("a");
  link.href = item.url;
  link.textContent = item.title;

  listItem.append(link);

  if (item.description) {
    const description = document.createElement("span");
    description.className = "item-description";
    description.textContent = ` - ${item.description}`;
    listItem.append(description);
  }

  if (item.topics.length || item.date) {
    const meta = document.createElement("span");
    meta.className = "item-meta";
    meta.textContent = ` (${[item.topics.join(", "), item.date].filter(Boolean).join(", ")})`;
    listItem.append(meta);
  }

  return listItem;
}

function filterSectionsByTopic(sections, topic) {
  if (topic === "All") {
    return sections.filter((section) => section.items.length);
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.topics.includes(topic)),
    }))
    .filter((section) => section.items.length);
}

function renderTopicFilters(sections) {
  const topics = [
    "All",
    ...[
      ...new Set(
        sections.flatMap((section) =>
          section.items.flatMap((item) => item.topics),
        ),
      ),
    ].sort((firstTopic, secondTopic) =>
      firstTopic.localeCompare(secondTopic),
    ),
  ];

  const buttons = topics.map((topic) => {
    const button = document.createElement("button");
    button.className = "topic-filter-button";
    button.type = "button";
    button.textContent = topic;
    button.setAttribute("aria-pressed", String(topic === activeTopic));
    button.addEventListener("click", () => {
      activeTopic = topic;
      renderTopicFilters(currentSections);
      renderSavedThings(filterSectionsByTopic(currentSections, activeTopic));
    });
    return button;
  });

  topicFilters.replaceChildren(...buttons);
}

function renderSavedThings(sections) {
  if (!sections.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No saved links yet.";
    list.replaceChildren(emptyState);
    return;
  }

  const renderedSections = sections.map((section) => {
    const group = document.createElement("section");
    group.className = "list-group";
    group.id = slugify(section.title);
    group.setAttribute("aria-labelledby", `${group.id}-title`);

    const header = document.createElement("div");
    header.className = "list-group-header";

    const title = document.createElement("h3");
    title.id = `${group.id}-title`;
    title.textContent = section.title;

    const description = document.createElement("p");
    description.textContent = section.description;

    const items = document.createElement("ul");
    items.className = "list-items";

    if (section.items.length) {
      const sortedItems = [...section.items].sort((firstItem, secondItem) =>
        firstItem.title.localeCompare(secondItem.title),
      );

      items.append(...sortedItems.map(renderListItem));
    } else {
      const emptyState = document.createElement("li");
      emptyState.className = "empty-state";
      emptyState.textContent =
        activeTopic === "All"
          ? "Nothing saved here yet."
          : `Nothing saved for ${activeTopic} yet.`;
      items.append(emptyState);
    }

    header.append(title, description);
    group.append(header, items);

    return group;
  });

  list.replaceChildren(...renderedSections);
  openLinksInNewTabs(list);
}

async function renderMarkdownList() {
  try {
    const response = await fetch(`${listMarkdownUrl}?v=${Date.now()}`);

    if (!response.ok) {
      throw new Error("Could not load Kate's List");
    }

    const sections = parseListMarkdown(await response.text());
    currentSections = sections;
    renderSectionMenu(sections);
    renderTopicFilters(sections);
    renderSavedThings(filterSectionsByTopic(sections, activeTopic));
  } catch {
    sectionMenu.replaceChildren();
    topicFilters.replaceChildren();
    list.replaceChildren();

    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Kate's List could not be loaded.";
    list.append(emptyState);
  }
}

renderMarkdownList();
openLinksInNewTabs();

async function renderLastUpdated() {
  lastUpdatedElement.textContent = "Last updated loading...";

  try {
    const response = await fetch(repositoryApiUrl, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      throw new Error("Could not load latest commit");
    }

    const data = await response.json();
    const commitDate = new Date(data.commit.committer.date);
    const formattedDate = new Intl.DateTimeFormat("en", {
      dateStyle: "long",
    }).format(commitDate);

    lastUpdatedElement.textContent = `Last updated ${formattedDate}`;
  } catch {
    lastUpdatedElement.textContent = "Last updated unavailable";
  }
}

renderLastUpdated();
