const repositoryApiUrl =
  "https://api.github.com/repos/katarinafloer/katarinafloer.github.io/commits/main";
const savedThings = [];

const list = document.querySelector("#reading-list");
const lastUpdatedElement = document.querySelector("#last-updated");

function renderSavedThings(items) {
  if (!items.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No saved links yet.";
    list.replaceChildren(emptyState);
    return;
  }

  const renderedItems = items.map((item) => {
    const link = document.createElement("a");
    link.className = "list-item";
    link.href = item.url;

    const content = document.createElement("span");

    const title = document.createElement("h3");
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
  });

  list.replaceChildren(...renderedItems);
}

renderSavedThings(savedThings);

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
