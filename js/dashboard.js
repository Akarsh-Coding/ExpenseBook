

// ── Profile (set up earlier in the app, falls back to defaults) ──
const profile = JSON.parse(localStorage.getItem("eb_profile") || "null") || {
    username: "User",
    salary: 0,
    creditDate: 1,
    currency: "INR",
    currencySymbol: "₹",
};

const sym = profile.currencySymbol || "₹";

// ── Populate navbar + symbols ─────────────────────────────────
document.getElementById("navName").textContent = profile.username;
document.getElementById("navAvatar").textContent =
    profile.username[0].toUpperCase();
document.getElementById("expenseSymbol").textContent = sym;
document.getElementById("incomeSymbol").textContent = sym;

function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

document.getElementById("cardCreditDate").textContent =
    ordinal(profile.creditDate) + " of every month";

// Default today's date + current time on both forms
const todayISO = new Date().toISOString().split("T")[0];

function nowHM() {
    const d = new Date();
    return (
        String(d.getHours()).padStart(2, "0") +
        ":" +
        String(d.getMinutes()).padStart(2, "0")
    );
}

document.getElementById("expDate").value = todayISO;
document.getElementById("incomeDate").value = todayISO;
document.getElementById("expTime").value = nowHM();
document.getElementById("incomeTime").value = nowHM();

// ── Storage helpers ────────────────────────────────────────────
function loadTransactions() {
    return JSON.parse(localStorage.getItem("eb_transactions") || "[]");
}

function saveTransactions(list) {
    localStorage.setItem("eb_transactions", JSON.stringify(list));
}

const CATEGORY_ICONS = {
    Food: "🍔",
    Transport: "🚗",
    Shopping: "🛍️",
    Bills: "⚡",
    Health: "💊",
    Education: "📚",
    Entertainment: "🎬",
    Other: "📦",
    Salary: "💼",
    Freelancing: "💻",
    Bonus: "🎁",
    Gift: "🎀",
    Interest: "📈",
    Refund: "↩️",
};

function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function showAlert(message, type = "success") {
    const box = document.getElementById("alertBox");
    box.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

// ── Render summary cards + transaction list ───────────────────
function render() {
    const transactions = loadTransactions();

    const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = profile.salary + totalIncome - totalExpense;
    const totalIn = profile.salary + totalIncome;
    const pct = totalIn > 0 ? Math.min((totalExpense / totalIn) * 100, 100) : 0;

    document.getElementById("cardSalary").textContent =
        sym + profile.salary.toLocaleString();
    document.getElementById("cardExpense").textContent =
        sym +
        totalExpense.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    document.getElementById("cardIncome").textContent =
        sym +
        totalIncome.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    document.getElementById("cardBalance").textContent =
        sym +
        balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const balanceEl = document.getElementById("cardBalance");
    balanceEl.className =
        "fw-bold " +
        (balance < 0
            ? "text-danger"
            : balance < profile.salary * 0.2
                ? "text-warning"
                : "text-success");

    const bar = document.getElementById("progressBar");
    bar.style.width = pct + "%";
    bar.classList.toggle("bg-danger", pct > 90);
    bar.classList.toggle("bg-warning", pct > 70 && pct <= 90);

    const countBadge = document.getElementById("transactionCount");
    countBadge.textContent = `${transactions.length} ${transactions.length === 1 ? "Entry" : "Entries"}`;

    const listEl = document.getElementById("transactionList");
    const emptyEl = document.getElementById("emptyState");

    if (transactions.length === 0) {
        emptyEl.style.display = "";
        listEl.innerHTML = "";
        return;
    }

    emptyEl.style.display = "none";

    const sorted = [...transactions].sort(
        (a, b) =>
            new Date(`${b.date}T${b.time || "00:00"}`) -
            new Date(`${a.date}T${a.time || "00:00"}`),
    );

    listEl.innerHTML = sorted
        .map(
            (t) => `
    <div class="transaction-row d-flex align-items-center justify-content-between p-3 border-bottom">
      <div class="d-flex align-items-center gap-3">
        <div class="transaction-icon ${t.type === "expense" ? "expense-icon" : "income-icon"}">
          ${CATEGORY_ICONS[t.category] || "📦"}
        </div>
        <div>
          <h6 class="mb-1">${escHtml(t.name)}</h6>
          <small class="text-secondary">
            ${escHtml(t.category)} • ${formatDate(t.date)}${t.time ? " • " + formatTime(t.time) : ""}
          </small>
        </div>
      </div>
      <div class="text-end">
        <div class="${t.type === "expense" ? "text-danger" : "text-success"} fw-bold">
          ${t.type === "expense" ? "-" : "+"}${sym}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <button class="btn btn-sm btn-outline-danger mt-1" data-id="${t.id}" data-action="delete">
          Delete
        </button>
      </div>
    </div>
  `,
        )
        .join("");
}

// ── Delete (event delegation) ──────────────────────────────────
document.getElementById("transactionList").addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const remaining = loadTransactions().filter((t) => t.id !== id);
    saveTransactions(remaining);
    render();
    showAlert("Transaction deleted.", "secondary");
});

// ── Bootstrap-style validation helper ──────────────────────────
function validateForm(form) {
    form.classList.add("was-validated");
    return form.checkValidity();
}

// ── Expense form ────────────────────────────────────────────────
const expenseForm = document.getElementById("expenseForm");

expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(expenseForm)) return;

    const transaction = {
        id: crypto.randomUUID(),
        type: "expense",
        name: document.getElementById("expName").value.trim(),
        amount: parseFloat(document.getElementById("expAmount").value),
        category: document.getElementById("expCategory").value,
        date: document.getElementById("expDate").value,
        time: document.getElementById("expTime").value,
    };

    const list = loadTransactions();
    list.push(transaction);
    saveTransactions(list);
    render();
    showAlert("Expense added successfully.", "success");

    expenseForm.reset();
    expenseForm.classList.remove("was-validated");
    document.getElementById("expDate").value = todayISO;
    document.getElementById("expTime").value = nowHM();
});

// ── Income form ─────────────────────────────────────────────────
const incomeForm = document.getElementById("incomeForm");

incomeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(incomeForm)) return;

    const transaction = {
        id: crypto.randomUUID(),
        type: "income",
        name: document.getElementById("incomeName").value.trim(),
        amount: parseFloat(document.getElementById("incomeAmount").value),
        category: document.getElementById("incomeCategory").value,
        date: document.getElementById("incomeDate").value,
        time: document.getElementById("incomeTime").value,
    };

    const list = loadTransactions();
    list.push(transaction);
    saveTransactions(list);
    render();
    showAlert("Income added successfully.", "success");

    incomeForm.reset();
    incomeForm.classList.remove("was-validated");
    document.getElementById("incomeDate").value = todayISO;
    document.getElementById("incomeTime").value = nowHM();
});

// ── Initial paint ──────────────────────────────────────────────
render();
