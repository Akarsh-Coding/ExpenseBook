const form = document.getElementById("setupForm");

const username = document.getElementById("username");
const salary = document.getElementById("salary");
const creditDate = document.getElementById("creditDate");
const currency = document.getElementById("currency");
const sym = document.getElementById("sym");

const symbols = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥"
};

currency.addEventListener("change", () => {
    sym.textContent = symbols[currency.value] || "₹";
});

form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const profile = {
        username: username.value.trim(),
        salary: Number(salary.value),
        creditDate: Number(creditDate.value),
        currency: currency.value,
        currencySymbol: symbols[currency.value],
        createdAt: new Date().toISOString()
    };

    localStorage.setItem("eb_profile", JSON.stringify(profile));

    window.location.href = "dashboard.html";
});