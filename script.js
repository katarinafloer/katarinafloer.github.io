const repositoryApiUrl =
  "https://api.github.com/repos/katarinafloer/katarinafloer.github.io/commits/main";
const listMarkdownUrl = "kates-list.md";

const list = document.querySelector("#reading-list");
const sectionMenu = document.querySelector("#section-menu");
const lastUpdatedElement = document.querySelector("#last-updated");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseListMarkdown(markdown) {
  const sections = [];
  let currentSection = null;

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
      return;
    }

    if (!currentSection) {
      return;
    }

    const listItemMatch = line.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s+-\s+([^|]+))?(?:\s+\|\s+([^|]+))?(?:\s+\|\s+(.+))?$/);

    if (listItemMatch) {
      currentSection.items.push({
        title: listItemMatch[1].trim(),
        url: listItemMatch[2].trim(),
        description: listItemMatch[3]?.trim() || "",
        tag: listItemMatch[4]?.trim() || "Link",
        date: listItemMatch[5]?.trim() || "",
      });
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
    const link = document.createElement("a");
    link.href = `#${slugify(section.title)}`;
    link.textContent = section.title;
    return link;
  });

  sectionMenu.replaceChildren(...menuItems);
}

function renderListItem(item) {
  const link = document.createElement("a");
  link.className = "list-item";
  link.href = item.url;

  const content = document.createElement("span");

  const title = document.createElement("h4");
  title.className = "item-title";
  title.textContent = item.title;

  const description = document.createElement("p");
  description.className = "item-description";
  description.textContent = item.description;

  const meta = document.createElement("span");
  meta.className = "item-meta";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = item.tag;

  const date = document.createElement("span");
  date.textContent = item.date;

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "->";

  meta.append(tag, date);
  content.append(title, description, meta);
  link.append(content, arrow);

  return link;
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

    const items = document.createElement("div");
    items.className = "list-items";

    if (section.items.length) {
      items.append(...section.items.map(renderListItem));
    } else {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = "Nothing saved here yet.";
      items.append(emptyState);
    }

    header.append(title, description);
    group.append(header, items);

    return group;
  });

  list.replaceChildren(...renderedSections);
}

async function renderMarkdownList() {
  try {
    const response = await fetch(listMarkdownUrl);

    if (!response.ok) {
      throw new Error("Could not load Kate's List");
    }

    const sections = parseListMarkdown(await response.text());
    renderSectionMenu(sections);
    renderSavedThings(sections);
  } catch {
    sectionMenu.replaceChildren();
    list.replaceChildren();

    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Kate's List could not be loaded.";
    list.append(emptyState);
  }
}

renderMarkdownList();

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
