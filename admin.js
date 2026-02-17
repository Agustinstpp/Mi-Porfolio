const API_BASE = "/.netlify/functions";

const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const logoutBtn = document.getElementById("logout");

const showAdmin = (isLogged) => {
  loginSection.style.display = isLogged ? "none" : "flex";
  adminSection.style.display = isLogged ? "grid" : "none";
};

const getToken = () => localStorage.getItem("adminToken");
const setToken = (token) => localStorage.setItem("adminToken", token);
const clearToken = () => localStorage.removeItem("adminToken");

const checkSession = async () => {
  const token = getToken();
  if (!token) return showAdmin(false);
  const res = await fetch(`${API_BASE}/session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  showAdmin(!!data.authenticated);
  if (!!data.authenticated) {
    loadDashboard();
  }
};

const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.ok && data.token) {
    setToken(data.token);
    showAdmin(true);
    loginForm.reset();
    loadDashboard();
  } else {
    alert("Credenciales inválidas");
  }
});

// Navegación
document.querySelectorAll(".admin-nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav-item").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.querySelector(`[data-view="${view}"]`).classList.add("active");
    if (view === "posts") loadPosts();
    if (view === "dashboard") loadDashboard();
  });
});

// Cargar dashboard
const loadDashboard = async () => {
  const token = getToken();
  const res = await fetch(`${API_BASE}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const posts = data.posts || [];
  
  document.getElementById("stat-posts").textContent = posts.length;
  document.getElementById("stat-views").textContent = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  document.getElementById("stat-likes").textContent = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  
  const dashboardList = document.getElementById("dashboard-posts-list");
  dashboardList.innerHTML = posts.slice(0, 5).map(p => `
    <div class="post-item">
      <img src="${p.cover}" alt="${p.title}" class="post-item-img" />
      <div class="post-item-info">
        <h4 class="post-item-title">${p.title}</h4>
        <div class="post-item-meta">
          <span>👁️ ${p.views || 0} vistas</span>
          <span>❤️ ${p.likes || 0} me gusta</span>
        </div>
      </div>
    </div>
  `).join("");
};

// Cargar posts
const loadPosts = async () => {
  const token = getToken();
  const res = await fetch(`${API_BASE}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const posts = data.posts || [];
  
  const postsList = document.getElementById("posts-list");
  postsList.innerHTML = posts.map(p => `
    <div class="post-item">
      <img src="${p.cover}" alt="${p.title}" class="post-item-img" />
      <div class="post-item-info">
        <h4 class="post-item-title">${p.title}</h4>
        <div class="post-item-meta">
          <span>👁️ ${p.views || 0} vistas</span>
          <span>❤️ ${p.likes || 0} me gusta</span>
          <span>${p.date}</span>
        </div>
      </div>
      <div class="post-item-actions">
        <button class="btn-icon" title="Ver">👁️</button>
        <button class="btn-icon" title="Editar">✏️</button>
        <button class="btn-icon" title="Eliminar">🗑️</button>
      </div>
    </div>
  `).join("");
};

// Preview de imagen
const coverFile = document.getElementById("cover-file");
coverFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewImg = document.getElementById("preview-img");
      previewImg.src = event.target.result;
      previewImg.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// Botones toolbar
document.querySelectorAll(".tool-btn[data-tag]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const tag = btn.dataset.tag;
    const textarea = document.getElementById("input-content");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText =
      textarea.value.substring(0, start) +
      `<${tag}>` + (selectedText || "tu contenido") + `</${tag}>` +
      textarea.value.substring(end);
    textarea.value = newText;
    textarea.focus();
  });
});

document.querySelector(".tool-btn[data-insert-img]").addEventListener("click", (e) => {
  e.preventDefault();
  const imageUrl = prompt("Pega la URL de la imagen o ruta relativa (ej: imag/nombre.jpg):");
  if (imageUrl) {
    const textarea = document.getElementById("input-content");
    const start = textarea.selectionStart;
    const imgTag = `<img src="${imageUrl}" alt="Imagen" style="width: 100%; border-radius: 18px; margin: 20px 0;" />`;
    const newText =
      textarea.value.substring(0, start) +
      imgTag +
      textarea.value.substring(start);
    textarea.value = newText;
    textarea.focus();
  }
});

// Enviar post
const postForm = document.getElementById("post-form");
postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const payload = Object.fromEntries(formData.entries());
  
  const coverFileInput = document.getElementById("cover-file");
  if (coverFileInput.files.length > 0) {
    const file = coverFileInput.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      payload.cover = reader.result;
      await publishPost(payload);
    };
    reader.readAsDataURL(file);
  } else {
    await publishPost(payload);
  }
});

const publishPost = async (payload) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.ok) {
    alert("Publicado correctamente");
    postForm.reset();
    document.getElementById("preview-img").style.display = "none";
    loadDashboard();
  } else {
    alert("No se pudo publicar");
  }
};

logoutBtn.addEventListener("click", () => {
  clearToken();
  showAdmin(false);
});

checkSession();
