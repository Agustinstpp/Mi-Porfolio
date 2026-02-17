const API_BASE = "/.netlify/functions";

// ===== DOM ELEMENTS =====
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const logoutBtn = document.getElementById("logout");
const postForm = document.getElementById("post-form");

// ===== LOCAL STORAGE =====
const getToken = () => localStorage.getItem("adminToken");
const setToken = (token) => localStorage.setItem("adminToken", token);
const clearToken = () => localStorage.removeItem("adminToken");

// ===== NAVIGATION =====
const showSection = (viewName) => {
  document.querySelectorAll(".admin-section").forEach((s) => {
    s.classList.remove("active");
  });
  const section = document.querySelector(`[data-view="${viewName}"]`);
  if (section) section.classList.add("active");

  document.querySelectorAll(".admin-nav-item").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.view === viewName) btn.classList.add("active");
  });
};

// ===== AUTHENTICATION =====
const showAdmin = (isLogged) => {
  if (isLogged) {
    loginSection.style.display = "none";
    adminSection.style.display = "grid";
    showSection("dashboard");
  } else {
    loginSection.style.display = "flex";
    adminSection.style.display = "none";
  }
};

const checkSession = async () => {
  const token = getToken();
  if (!token) return showAdmin(false);

  try {
    const res = await fetch(`${API_BASE}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.authenticated) {
      showAdmin(true);
      loadDashboard();
    } else {
      clearToken();
      showAdmin(false);
    }
  } catch (error) {
    console.error("Session check error:", error);
    showAdmin(false);
  }
};

// ===== LOGIN =====
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());

    try {
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
    } catch (error) {
      console.error("Login error:", error);
      alert("Error al conectar con el servidor");
    }
  });
}

// ===== LOGOUT =====
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    clearToken();
    showAdmin(false);
  });
}

// ===== NAVIGATION BUTTONS =====
document.querySelectorAll(".admin-nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view) showSection(view);
  });
});

// ===== DASHBOARD =====
const loadDashboard = async () => {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const posts = await res.json();

    const stats = {
      total: posts.length || 0,
      vistas: posts.reduce((sum, p) => sum + (p.views || 0), 0),
      likes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
    };

    const dashboardCards = document.querySelector(".dashboard-grid");
    if (dashboardCards) {
      dashboardCards.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Posts</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👁️</div>
          <div class="stat-value">${stats.vistas}</div>
          <div class="stat-label">Total Vistas</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❤️</div>
          <div class="stat-value">${stats.likes}</div>
          <div class="stat-label">Total Likes</div>
        </div>
      `;
    }

    loadPosts();
  } catch (error) {
    console.error("Dashboard error:", error);
  }
};

// ===== POSTS LIST =====
const loadPosts = async () => {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const posts = await res.json();

    const postsList = document.querySelector(".posts-list");
    if (!postsList) return;

    if (posts.length === 0) {
      postsList.innerHTML =
        '<div class="empty-state"><p>No hay posts aún. ¡Crea tu primer post!</p></div>';
      return;
    }

    postsList.innerHTML = posts
      .map(
        (post) => `
      <div class="post-item">
        <div class="post-info">
          <h3>${post.title || "Sin título"}</h3>
          <div class="post-meta-small">
            <span>📅 ${post.date || "N/A"}</span>
            <span>👁️ ${post.views || 0}</span>
            <span>❤️ ${post.likes || 0}</span>
          </div>
        </div>
        <div class="post-actions">
          <button class="btn-icon" title="Editar" onclick="alert('Editar próximamente')">✏️</button>
          <button class="btn-icon" title="Eliminar" onclick="alert('Eliminar próximamente')">🗑️</button>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Posts error:", error);
  }
};

// ===== POST FORM =====
if (postForm) {
  // Image preview
  const coverInput = document.getElementById("cover-file");
  const previewImg = document.getElementById("preview-img");

  if (coverInput && previewImg) {
    coverInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
          previewImg.classList.add("show");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Toolbar buttons
  const toolBtns = document.querySelectorAll(".tool-btn");
  const contentInput = document.getElementById("input-content");

  toolBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tag = btn.dataset.tag;
      const insertImg = btn.dataset.insertImg !== undefined;

      if (insertImg) {
        const url = prompt("URL de la imagen:");
        if (url) {
          contentInput.value += `\n<img src="${url}" alt="imagen" />\n`;
        }
      } else if (tag) {
        contentInput.value += `\n<${tag}></${tag}>\n`;
      }
    });
  });

  // Form submission
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      alert("No autenticado");
      return;
    }

    const formData = new FormData(postForm);
    const postData = {
      title: formData.get("title"),
      date: formData.get("date"),
      location: formData.get("location"),
      excerpt: formData.get("excerpt"),
      content: formData.get("content"),
      slug: formData.get("slug") || formData.get("title")?.toLowerCase().replace(/\s+/g, "-"),
    };

    // Handle image as base64
    const coverFile = formData.get("cover-file");
    if (coverFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        postData.cover = reader.result;
        await publishPost(postData, token);
      };
      reader.readAsDataURL(coverFile);
    } else {
      await publishPost(postData, token);
    }
  });
}

const publishPost = async (postData, token) => {
  try {
    const res = await fetch(`${API_BASE}/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    const data = await res.json();
    if (data.ok) {
      alert("Post publicado exitosamente");
      postForm.reset();
      document.getElementById("preview-img").classList.remove("show");
      loadDashboard();
      showSection("posts");
    } else {
      alert("Error al publicar: " + (data.error || "Desconocido"));
    }
  } catch (error) {
    console.error("Publish error:", error);
    alert("Error al conectar con el servidor");
  }
};

// ===== INIT =====
document.addEventListener("DOMContentLoaded", checkSession);
document.querySelectorAll(".admin-nav-item").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".admin-nav-item").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    const section = document.querySelector(`[data-view="${view}"]`);
    if (section) {
      section.classList.add("active");
      if (view === "posts") loadPosts();
      if (view === "dashboard") loadDashboard();
    }
  });
});

// Cargar dashboard
const loadDashboard = async () => {
  console.log("Loading dashboard...");
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const posts = data.posts || [];
    
    document.getElementById("stat-posts").textContent = posts.length;
    document.getElementById("stat-views").textContent = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    document.getElementById("stat-likes").textContent = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    
    const dashboardList = document.getElementById("dashboard-posts-list");
    if (dashboardList) {
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
    }
  } catch (e) {
    console.error("Error loading dashboard:", e);
  }
};

// Cargar posts
const loadPosts = async () => {
  console.log("Loading posts...");
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const posts = data.posts || [];
    
    const postsList = document.getElementById("posts-list");
    if (postsList) {
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
    }
  } catch (e) {
    console.error("Error loading posts:", e);
  }
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
