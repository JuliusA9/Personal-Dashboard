(() => {
  // ===== Helpers =====
  const $ = (sel) => document.querySelector(sel);

  // ===== DOM grabs =====
  const greetingEl = $("#greeting");
  const todayLineEl = $("#todayLine");

  const taskForm = $("#taskForm");
  const taskTitle = $("#taskTitle");
  const taskCategory = $("#taskCategory");
  const taskDue = $("#taskDue");
  const formHint = $("#formHint");

  const viewFilter = $("#viewFilter");
  const categoryFilter = $("#categoryFilter");
  const searchInput = $("#search");

  const taskList = $("#taskList");
  const emptyState = $("#emptyState");

  const progressText = $("#progressText");
  const countText = $("#countText");
  const progressFill = $("#progressFill");

  const toggleThemeBtn = $("#toggleTheme");
  const accentSelect = $("#accentSelect");

  // Fake login UI
  const loginOverlay = $("#loginOverlay");
  const loginForm = $("#loginForm");
  const usernameInput = $("#usernameInput");
  const loginHint = $("#loginHint");
  const logoutBtn = $("#logoutBtn");

  // If core elements are missing, try to surface the login overlay anyway,
  // then stop (prevents a dead page with no clue).
  if (!greetingEl || !todayLineEl || !taskForm || !taskList) {
    console.error("Missing required DOM elements. Check index.html IDs.");
    if (loginOverlay) {
      loginOverlay.classList.add("show");
      loginOverlay.setAttribute("aria-hidden", "false");
    }
    return;
  }

  // ===== App state =====
  let tasks = [];
  let editingId = null;

  // current user (storage key) + display name
  let currentUser = null;
  let currentUserName = "";

  // ===== Date helpers =====
  function formatDateHuman(iso) {
    if (!iso) return "No date";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function setHeaderBase() {
    const now = new Date();
    todayLineEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  // ===== Fake login helpers =====
  function normUserKey(s) {
    return (s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24);
  }

  function displayName(s) {
    return (s || "").trim().replace(/\s+/g, " ").slice(0, 24);
  }

  function userKeyTasks() {
    return `pd_tasks_${currentUser}`;
  }

  function userKeyTheme() {
    return `pd_theme_${currentUser}`;
  }
  function userKeyAccent() {
    return `pd_accent_${currentUser}`;
  }

  function saveTasks() {
    if (!currentUser) return;
    localStorage.setItem(userKeyTasks(), JSON.stringify(tasks));
  }

  function loadTasks() {
    if (!currentUser) return;
    const raw = localStorage.getItem(userKeyTasks());
    tasks = raw ? JSON.parse(raw) : [];
  }

  function showLogin() {
    if (!loginOverlay) return;
    loginOverlay.classList.add("show");
    loginOverlay.setAttribute("aria-hidden", "false");
    if (usernameInput) {
      usernameInput.value = "";
      setTimeout(() => usernameInput.focus(), 0);
    }
    if (loginHint) loginHint.textContent = "";
  }

  function hideLogin() {
    if (!loginOverlay) return;
    loginOverlay.classList.remove("show");
    loginOverlay.setAttribute("aria-hidden", "true");
  }

  function setUser(rawName) {
    const pretty = displayName(rawName);
    const key = normUserKey(rawName);

    if (!pretty || !key) return false;

    currentUserName = pretty;
    currentUser = key;

    localStorage.setItem("pd_currentUser", currentUser);
    localStorage.setItem("pd_currentUserName", currentUserName);

    greetingEl.textContent = `${currentUserName}'s Dashboard`;
    return true;
  }

  function loadThemeForUser() {
    if (!currentUser) return;
    const saved = localStorage.getItem(userKeyTheme());
    document.documentElement.setAttribute("data-theme", saved || "light");
  }

  function saveThemeForUser() {
    if (!currentUser) return;
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    localStorage.setItem(userKeyTheme(), cur);
  }
  function loadAccentForUser() {
    if (!currentUser) return;
    const saved = localStorage.getItem(userKeyAccent());
    const accent = saved || "slate";
    document.documentElement.setAttribute("data-accent", accent);
    if (accentSelect) accentSelect.value = accent;
  }

  function saveAccentForUser() {
    if (!currentUser || !accentSelect) return;
    localStorage.setItem(userKeyAccent(), accentSelect.value);
  }

  // ===== Progress =====
  // Progress is based on the CURRENT VIEW (filtered list)
  function computeProgress(filtered) {
    const total = filtered.length;
    const done = filtered.filter((t) => t.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    if (progressText) progressText.textContent = `${pct}% complete`;
    if (countText) countText.textContent = `${total} task${total === 1 ? "" : "s"}`;
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  // ===== Filters =====
  function applyFilters() {
    const view = viewFilter ? viewFilter.value : "all";
    const cat = categoryFilter ? categoryFilter.value : "all";
    const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const tISO = todayISO();

    let list = [...tasks];

    if (view === "today") list = list.filter((t) => t.dueDate === tISO);
    if (view === "completed") list = list.filter((t) => t.done);

    if (cat !== "all") list = list.filter((t) => t.category === cat);

    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    // Sort by due date (empty last), then newest
    list.sort((a, b) => {
      const ad = a.dueDate || "9999-12-31";
      const bd = b.dueDate || "9999-12-31";
      if (ad < bd) return -1;
      if (ad > bd) return 1;
      return b.createdAt - a.createdAt;
    });

    return list;
  }

  // ===== Render =====
  function render() {
    const filtered = applyFilters();

    taskList.innerHTML = "";
    if (emptyState) emptyState.style.display = filtered.length === 0 ? "block" : "none";

    for (const t of filtered) {
      const li = document.createElement("li");
      li.className = "task" + (t.done ? " done" : "");

      const left = document.createElement("div");
      left.className = "taskLeft";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "check";
      checkbox.checked = t.done;
      checkbox.addEventListener("change", () => {
        t.done = checkbox.checked;
        saveTasks();
        render();
      });

      const textWrap = document.createElement("div");
      textWrap.style.minWidth = "0";

      const title = document.createElement("div");
      title.className = "taskTitle";
      title.textContent = t.title;

      const meta = document.createElement("div");
      meta.className = "taskMeta";
      meta.innerHTML = `<span class="pill">${t.category}</span> • ${formatDateHuman(t.dueDate)}`;

      textWrap.appendChild(title);
      textWrap.appendChild(meta);

      left.appendChild(checkbox);
      left.appendChild(textWrap);

      const actions = document.createElement("div");
      actions.className = "taskActions";

      const isEditing = editingId === t.id;

      if (isEditing) {
        checkbox.disabled = true;

        const editWrap = document.createElement("div");
        editWrap.style.display = "flex";
        editWrap.style.flexDirection = "column";
        editWrap.style.gap = "8px";
        editWrap.style.minWidth = "0";

        const titleInput = document.createElement("input");
        titleInput.className = "input slim";
        titleInput.value = t.title;

        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 1fr";
        row.style.gap = "8px";

        const catSelect = document.createElement("select");
        catSelect.className = "input slim";
        ["School", "Work", "Gym", "Life"].forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          if (c === t.category) opt.selected = true;
          catSelect.appendChild(opt);
        });

        const dueInput = document.createElement("input");
        dueInput.className = "input slim";
        dueInput.type = "date";
        dueInput.value = t.dueDate || "";

        row.appendChild(catSelect);
        row.appendChild(dueInput);

        textWrap.innerHTML = "";
        editWrap.appendChild(titleInput);
        editWrap.appendChild(row);
        textWrap.appendChild(editWrap);

        const saveBtn = document.createElement("button");
        saveBtn.className = "iconBtn";
        saveBtn.type = "button";
        saveBtn.textContent = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "iconBtn";
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";

        saveBtn.addEventListener("click", () => {
          const newTitle = titleInput.value.trim();
          if (!newTitle) return;

          const idx = tasks.findIndex((x) => x.id === t.id);
          if (idx !== -1) {
            tasks[idx].title = newTitle;
            tasks[idx].category = catSelect.value;
            tasks[idx].dueDate = dueInput.value || "";
          }

          editingId = null;
          saveTasks();
          render();
        });

        cancelBtn.addEventListener("click", () => {
          editingId = null;
          render();
        });

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
      } else {
        const editBtn = document.createElement("button");
        editBtn.className = "iconBtn";
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
          editingId = t.id;
          render();
        });

        const del = document.createElement("button");
        del.className = "iconBtn";
        del.type = "button";
        del.textContent = "Delete";
        del.addEventListener("click", () => {
          tasks = tasks.filter((x) => x.id !== t.id);
          if (editingId === t.id) editingId = null;
          saveTasks();
          render();
        });

        actions.appendChild(editBtn);
        actions.appendChild(del);
      }

      li.appendChild(left);
      li.appendChild(actions);
      taskList.appendChild(li);
    }

    computeProgress(filtered);
  }

  // ===== Create task =====
  function addTask(title, category, dueDate) {
    tasks.unshift({
      id: crypto.randomUUID(),
      title,
      category,
      dueDate: dueDate || "",
      done: false,
      createdAt: Date.now(),
    });
  }

  // ===== Listeners =====
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = taskTitle ? taskTitle.value.trim() : "";
    const category = taskCategory ? taskCategory.value : "Life";
    const dueDate = taskDue ? taskDue.value : "";

    if (!title) {
      if (formHint) formHint.textContent = "Task title can’t be empty 😭";
      return;
    }

    if (formHint) formHint.textContent = "";

    addTask(title, category, dueDate);
    saveTasks();

    if (taskTitle) taskTitle.value = "";
    if (taskDue) taskDue.value = "";
    if (taskTitle) taskTitle.focus();

    render();
  });

  [viewFilter, categoryFilter, searchInput].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", render);
  });

  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener("click", () => {
      const root = document.documentElement;
      const isDark = root.getAttribute("data-theme") === "dark";
      root.setAttribute("data-theme", isDark ? "light" : "dark");
      saveThemeForUser();
    });
  }
  if (accentSelect) {
    accentSelect.addEventListener("change", () => {
      document.documentElement.setAttribute("data-accent", accentSelect.value);
      saveAccentForUser();
    });
  }

  // Login submit
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = usernameInput ? usernameInput.value : "";

      if (!setUser(raw)) {
        if (loginHint) loginHint.textContent = "Type a username 😭";
        return;
      }

      loadTasks();
      loadThemeForUser();
      loadAccentForUser();
      hideLogin();
      render();
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("pd_currentUser");
      localStorage.removeItem("pd_currentUserName");

      currentUser = null;
      currentUserName = "";
      tasks = [];
      editingId = null;

      greetingEl.textContent = "Personal Dashboard";
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.setAttribute("data-accent", "slate");
      if (accentSelect) accentSelect.value = "slate";

      render();
      showLogin();
    });
  }

  // ===== Boot =====
  setHeaderBase();

  const savedUser = localStorage.getItem("pd_currentUser");
  const savedName = localStorage.getItem("pd_currentUserName");

  if (savedUser && savedName) {
    currentUser = savedUser;
    currentUserName = savedName;
    greetingEl.textContent = `${currentUserName}'s Dashboard`;

    loadTasks();
    loadThemeForUser();
    loadAccentForUser();
    render();
  } else {
    greetingEl.textContent = "Personal Dashboard";
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.setAttribute("data-accent", "slate");
    if (accentSelect) accentSelect.value = "slate";
    render();
    showLogin();
  }
})();