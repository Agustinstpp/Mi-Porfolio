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

const postForm = document.getElementById("post-form");
postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const payload = Object.fromEntries(formData.entries());
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
  } else {
    alert("No se pudo publicar");
  }
});

logoutBtn.addEventListener("click", async () => {
  clearToken();
  showAdmin(false);
});

checkSession();
