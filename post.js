const API_BASE = "/.netlify/functions";

const getSlug = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
};

const renderRelated = (posts, current) => {
  const container = document.getElementById("related-posts");
  if (!container) return;
  container.innerHTML = "";
  posts
    .filter((post) => post.slug !== current)
    .slice(0, 4)
    .forEach((post) => {
      const card = document.createElement("article");
      card.className = "blog-card";
      const isPink = /Llega|Sukha/i.test(post.title);
      card.innerHTML = `
        <div class="card-media ${isPink ? "pink" : ""}">
          <img src="${post.cover}" alt="${post.title}" />
        </div>
        <div class="card-body">
          <span>${post.date || ""}</span>
          <h3>${post.title}</h3>
        </div>
      `;
      card.addEventListener("click", () => {
        window.location.href = `post.html?slug=${post.slug}`;
      });
      container.appendChild(card);
    });
};

const loadPost = async () => {
  const slug = getSlug();
  if (!slug) return;
  const res = await fetch(`${API_BASE}/post?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return;
  const post = await res.json();
  document.getElementById("post-cover").src = post.cover;
  document.getElementById("post-cover").alt = post.title;
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-date").textContent = post.date || "";
  document.getElementById("post-location").textContent = post.location || "";
  document.getElementById("post-content").innerHTML = post.content;
  const excerptEl = document.getElementById("post-excerpt");
  if (excerptEl) {
    excerptEl.textContent = post.excerpt || "";
    excerptEl.classList.toggle("hidden", !post.excerpt);
  }

  const list = await fetch(`${API_BASE}/posts`);
  const posts = await list.json();
  renderRelated(posts, post.slug);
};

loadPost();
