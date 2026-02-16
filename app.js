const API_BASE = "/.netlify/functions";

const formatDate = (value) => value || "";

const renderCard = (post) => {
  const card = document.createElement("article");
  card.className = "blog-card";
  const isPink = /Llega|Sukha/i.test(post.title);
  const excerpt = post.excerpt ? `<p class="card-excerpt">${post.excerpt}</p>` : "";
  const location = post.location ? `<span class="card-location">${post.location}</span>` : "";
  card.innerHTML = `
    <div class="card-media ${isPink ? "pink" : ""}">
      <img src="${post.cover}" alt="${post.title}" />
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="card-date">${formatDate(post.date)}</span>
        ${location}
      </div>
      <h3>${post.title}</h3>
      ${excerpt}
    </div>
  `;
  card.addEventListener("click", () => {
    window.location.href = `post.html?slug=${post.slug}`;
  });
  return card;
};

const loadPosts = async (containerId, limit) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  const res = await fetch(`${API_BASE}/posts`);
  const posts = await res.json();
  const items = limit ? posts.slice(0, limit) : posts;
  container.innerHTML = "";
  items.forEach((post) => container.appendChild(renderCard(post)));
};

const loadFeatured = async () => {
  const featured = document.getElementById("featured-card");
  if (!featured) return;
  const res = await fetch(`${API_BASE}/posts`);
  const posts = await res.json();
  if (!posts.length) return;
  const post = posts[0];
  featured.querySelector("img").src = post.cover;
  featured.querySelector("img").alt = post.title;
  featured.querySelector("h3").textContent = post.title;
  featured.addEventListener("click", () => {
    window.location.href = `post.html?slug=${post.slug}`;
  });
};

loadPosts("home-posts", 4);
loadPosts("portfolio-posts");
loadFeatured();
