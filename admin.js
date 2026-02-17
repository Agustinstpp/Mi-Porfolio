const API_BASE = "/.netlify/functions";

const loginCard = document.getElementById("login-card");
const postCard = document.getElementById("post-card");
const logoutBtn = document.getElementById("logout");

const showAdmin = (isLogged) => {
  loginCard.classList.toggle("hidden", isLogged);
  postCard.classList.toggle("hidden", !isLogged);
  logoutBtn.classList.toggle("hidden", !isLogged);
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
  } else {
    alert("Credenciales inválidas");
  }
});

// Preview en tiempo real
const inputTitle = document.getElementById("input-title");
const inputExcerpt = document.getElementById("input-excerpt");
const previewTitle = document.getElementById("preview-title");
const previewExcerpt = document.getElementById("preview-excerpt");
const previewImg = document.getElementById("preview-img");
const previewNoImg = document.getElementById("preview-no-img");
const coverFile = document.getElementById("cover-file");
const coverSelect = document.getElementById("cover-select");
const inputContent = document.getElementById("input-content");

inputTitle.addEventListener("input", () => {
  previewTitle.textContent = inputTitle.value;
});

inputExcerpt.addEventListener("input", () => {
  previewExcerpt.textContent = inputExcerpt.value;
});

coverFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImg.src = event.target.result;
      previewImg.style.display = "block";
      previewNoImg.style.display = "none";
      coverSelect.value = "";
    };
    reader.readAsDataURL(file);
  }
});

coverSelect.addEventListener("change", () => {
  if (coverSelect.value) {
    previewImg.src = coverSelect.value;
    previewImg.style.display = "block";
    previewNoImg.style.display = "none";
    coverFile.value = "";
  }
});

// Botones de insertar etiquetas HTML
document.querySelectorAll(".btn-small[data-tag]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const tag = btn.dataset.tag;
    const closingTag = tag.replace("<", "</");
    const textarea = inputContent;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText =
      textarea.value.substring(0, start) +
      tag +
      ">" +
      (selectedText || "tu contenido") +
      closingTag +
      ">" +
      textarea.value.substring(end);
    textarea.value = newText;
    textarea.focus();
  });
});

// Botón para insertar imagen en el contenido
document.querySelector(".btn-small[data-insert-img]").addEventListener("click", (e) => {
  e.preventDefault();
  const imageUrl = prompt("Pega la URL de la imagen o ruta relativa (ej: imag/nombre.jpg):");
  if (imageUrl) {
    const textarea = inputContent;
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

const postForm = document.getElementById("post-form");
postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const payload = Object.fromEntries(formData.entries());
  
  // Si hay archivo de portada, convertir a base64
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
    previewTitle.textContent = "";
    previewExcerpt.textContent = "";
    previewImg.style.display = "none";
    previewNoImg.style.display = "block";
  } else {
    alert("No se pudo publicar");
  }
};

logoutBtn.addEventListener("click", async () => {
  clearToken();
  showAdmin(false);
});

checkSession();
