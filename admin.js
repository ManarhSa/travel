let users = [];
let entriesData = [];
let configData = {};
let currencyView = "main";


function loadData() {
    return Promise.all([
        fetch("data/config.json?v=" + Date.now()).then(res => res.json()),
        fetch("data/entries.json?v=" + Date.now()).then(res => res.json()),
        fetch("data/title.txt?v=" + Date.now()).then(res => res.text())
    ]).then(([config, entries, title]) => {
        configData = config;
        entriesData = entries;

        // ✅ تعبئة العنوان
        const pageTitle = document.getElementById("page-title");
        if (pageTitle) pageTitle.textContent = title.trim();
        const inputTitle = document.getElementById("input-title");
        if (inputTitle) inputTitle.value = title.trim();

        // ✅ تعبئة القطة والعملات
        document.getElementById("input-budget").value = config.budget || '';
        document.getElementById("input-main-currency").value = config.currency_main || '';
        document.getElementById("input-rate").value = config.rate || '';
        document.getElementById("input-alt-currency").value = config.currency_alt || '';

        // ✅ تعبئة الأشخاص
        const peopleList = document.getElementById("people-list");
        if (peopleList && Array.isArray(config.people)) {
            peopleList.innerHTML = "";
            config.people.forEach((person, index) => {
                const div = document.createElement("div");
                div.className = "item";
                div.innerHTML = `
                    <input type="text" value="${person}" data-type="person" data-index="${index}" />
                    <button onclick="removeItem(this, 'person')"style="background-color: unset;padding: 1px 1px;font-size: 19px;">🗑️</button>
                `;
                peopleList.appendChild(div);
            });
        }

        // ✅ تعبئة الفئات
        const categoriesList = document.getElementById("categories-list");
        if (categoriesList && Array.isArray(config.categories)) {
            categoriesList.innerHTML = "";
            config.categories.forEach((category, index) => {
                const div = document.createElement("div");
                div.className = "item";
                div.innerHTML = `
                    <input type="text" value="${category}" data-type="category" data-index="${index}" />
                    <button onclick="removeItem(this, 'category')"style="background-color: unset;padding: 1px 1px;font-size: 19px;">🗑️</button>
                `;
                categoriesList.appendChild(div);
            });
        }

        document.title = title.trim() + " - مصروفات السفر";

        if (document.getElementById("per-person")) renderStats();
        if (document.getElementById("payers")) renderFormOptions();
        if (document.getElementById("entries-table")) renderEntriesTable(entriesData);

        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel) adminPanel.classList.remove("hidden");

        populateColorInputs();
        loadUsers();
    });
}


function renderStats() {
    const perPersonDiv = document.getElementById("per-person");
    if (!perPersonDiv) {
        console.warn("عنصر per-person غير موجود في هذه الصفحة، سيتم تجاوز العرض.");
        return;
    }
    const totalBudget = configData.budget || 0;
    let totalExpense = 0;
    const categorySums = {};
    const personSums = {};

    const realPeople = configData.people.filter(p => p !== "الميزانية");
    const perPersonAmount = (totalBudget / realPeople.length).toFixed(2);
    perPersonDiv.textContent = `نصيب كل شخص: ${perPersonAmount} ${configData.currency_main}`;

    entriesData.forEach(entry => {
        const amount = entry.currency === configData.currency_alt
            ? entry.amount / configData.rate
            : entry.amount;
        totalExpense += amount;

        const cat = configData.categories.includes(entry.category) ? entry.category : "أخرى";
        categorySums[cat] = (categorySums[cat] || 0) + amount;
        personSums[entry.payer] = (personSums[entry.payer] || 0) + amount;
    });

    document.getElementById("total-budget").textContent = totalBudget.toFixed(2);
    document.getElementById("total-expense").textContent = totalExpense.toFixed(2);
    document.getElementById("remaining").textContent = (totalBudget - totalExpense).toFixed(2);

    const catBox = document.getElementById("categories");
    catBox.innerHTML = "";
    configData.categories.forEach(cat => {
        catBox.innerHTML += `
      <div class="category-box">
        <span>${cat}</span>
        <strong>${(categorySums[cat] || 0).toFixed(2)}</strong>
        <span>${configData.currency_main}</span>
      </div>`;
    });

    const peopleBox = document.getElementById("people");
    peopleBox.innerHTML = "";
    configData.people.forEach(p => {
        peopleBox.innerHTML += `
      <div class="category-box">
        <span>${p}</span>
        <strong>${(personSums[p] || 0).toFixed(2)}</strong>
        <span>${configData.currency_main}</span>
      </div>`;
    });
    applyColors();
}

function renderFormOptions() {
    const payerBox = document.getElementById("payers");
    payerBox.innerHTML = "";
    configData.people.forEach(name => {
        payerBox.innerHTML += `<button onclick="selectPayer(this)">${name}</button>`;
    });

    const catBox = document.getElementById("categories-form");
    catBox.innerHTML = "";
    configData.categories.forEach(cat => {
        catBox.innerHTML += `<button onclick="selectCategory(this)">${cat}</button>`;
    });

    document.getElementById("btn-main-currency").textContent = configData.currency_main || "ريال";
    document.getElementById("btn-foreign-currency").textContent = configData.currency_alt || "راند";
    document.getElementById("base-currency-label").textContent = configData.currency_main;
    document.getElementById("base-currency-label-2").textContent = configData.currency_main;
    document.getElementById("base-currency-label-3").textContent = configData.currency_main;
    document.getElementById("base-currency-label-rate").textContent = configData.currency_main;
    document.getElementById("alt-currency-label-rate").textContent = configData.currency_alt;
    document.getElementById("rate").textContent = configData.rate;
}

function submitPurchase() {
    const amount = parseFloat(document.getElementById("amount").value);
    const payer = document.querySelector("#payers button.selected")?.textContent;
    const category = document.querySelector("#categories-form button.selected")?.textContent || document.getElementById("custom-category").value.trim();
    const notes = document.getElementById("notes").value.trim();
    const currency = currencyView === "main" ? configData.currency_main : configData.currency_alt;

    if (!amount || !payer || !category) return alert("الرجاء تعبئة كل الحقول ✋");

    const newEntry = {
        amount,
        payer,
        category,
        notes,
        currency,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        host: currentUser
    };

    entriesData.push(newEntry);

    fetch("save-entries.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entriesData)
    }).then(res => res.json()).then(() => {
        alert("تمت الإضافة ✅");
        loadData();
        document.getElementById("amount").value = "";
        document.getElementById("notes").value = "";
    });
}

function renderEntriesTable(filtered = entriesData) {
    const tbody = document.querySelector("#entries-table tbody");
    tbody.innerHTML = "";

    filtered.forEach((entry, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${entry.host || "-"}</td>
      <td contenteditable="true">${entry.payer}</td>
      <td contenteditable="true">${entry.amount}</td>
      <td contenteditable="true">${entry.currency}</td>
      <td contenteditable="true">${entry.category}</td>
      <td contenteditable="true">${entry.notes || ""}</td>
      <td>${entry.timestamp}</td>
      <td class="edit-col hidden"><button onclick="confirmDelete(${i})">🗑️</button></td>`;
        tbody.appendChild(row);
    });
}

function enableEditing() {
    document.querySelectorAll(".edit-col").forEach(e => e.classList.remove("hidden"));
    document.getElementById("apply-edits").classList.remove("hidden");
}

function submitEdits() {
    if (!confirm("هل تريد حفظ التعديلات؟")) return;

    const rows = document.querySelectorAll("#entries-table tbody tr");
    entriesData = [...rows].map(row => {
        const cells = row.children;
        return {
            host: cells[0].textContent,
            payer: cells[1].textContent,
            amount: parseFloat(cells[2].textContent),
            currency: cells[3].textContent,
            category: cells[4].textContent,
            notes: cells[5].textContent,
            timestamp: cells[6].textContent
        };
    });

    fetch("save-entries.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entriesData)
    }).then(res => res.json()).then(() => {
        alert("تم حفظ التعديلات ✅");
        loadData();
    });
}

function confirmDelete(index) {
    const pass = prompt("اكتب كلمة المرور للحذف:");
    if (pass === "delete123") {
        entriesData.splice(index, 1);
        submitEdits(); // نحفظ بعد الحذف
    } else {
        alert("كلمة مرور غير صحيحة ❌");
    }
}

function exportToPDF() {
    window.print();
}


function selectPayer(btn) {
    document.querySelectorAll("#payers button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
}

function selectCategory(btn) {
    document.querySelectorAll("#categories-form button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("custom-category").classList.add("hidden");
}


function loadUsers() {
    fetch("data/users.json?v=" + Date.now())
        .then(res => res.json())
        .then(data => {
            users = data;
            renderUsers();
        });
}

function renderUsers() {
    const container = document.getElementById("users-list");
    container.innerHTML = "";
    users.forEach((user, index) => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
      <span>${user.name} (${user.code})</span>
      <button onclick="deleteUser(${index})" class="delete-button"style="background-color: unset;padding: 1px 1px;font-size: 19px;">🗑️</button>
    `;
        container.appendChild(div);
    });
}

function addNewUser() {
    const code = document.getElementById("new-user-code").value.trim();
    const name = document.getElementById("new-user-name").value.trim();
    if (!code || !name) return alert("الرجاء تعبئة الحقول");

    users.push({ code, name });
    saveUsers();
}

function deleteUser(index) {
    if (!confirm("هل تريد حذف هذا المستخدم؟")) return;
    users.splice(index, 1);
    saveUsers();
}

function saveUsers() {
    fetch("save-users.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users)
    }).then(() => {
        renderUsers();
        document.getElementById("new-user-code").value = "";
        document.getElementById("new-user-name").value = "";
    });
}


function showSection(id) {
    ["main", "form", "converter", "entries"].forEach(s => {
        document.getElementById(s).classList.add("hidden");
    });
    document.getElementById(id).classList.remove("hidden");
}

function applyColors() {
    const colors = configData.colors || {};

    // ✅ خلفية الموقع
    document.body.style.backgroundColor = colors.body_bg || "#f5f5f5";

    // ✅ العنوان الرئيسي (h1 في أي صفحة)
    document.querySelectorAll("h1").forEach(h1 => {
        h1.style.backgroundColor = colors.title || "#0a4473";
        h1.style.color = "#fff";
    });

    // ✅ ألوان الإحصائيات - الفئات
    document.querySelectorAll("#categories .category-box").forEach(box => {
        box.style.backgroundColor = colors.categories_bg || "#3ca370";
        const strong = box.querySelector("strong");
        if (strong) {
            strong.style.backgroundColor = colors.number_bg || "#fff";
            strong.style.color = colors.number_text || "#000";
        }
    });

    // ✅ ألوان الإحصائيات - الأشخاص
    document.querySelectorAll("#people .category-box").forEach(box => {
        box.style.backgroundColor = colors.people_bg || "#444";
        const strong = box.querySelector("strong");
        if (strong) {
            strong.style.backgroundColor = colors.number_bg || "#fff";
            strong.style.color = colors.number_text || "#000";
        }
    });

    // ✅ خيارات "من دفع" في نموذج الإضافة
    document.querySelectorAll("#payers button").forEach(btn => {
        btn.style.backgroundColor = colors.payers_bg || "#eee";
        btn.style.color = colors.payers_text || "#000";
    });

    // ✅ خيارات "فئة الدفع" في نموذج الإضافة
    document.querySelectorAll("#categories-form button").forEach(btn => {
        btn.style.backgroundColor = colors.categories_form_bg || "#eee";
        btn.style.color = colors.payers_text || "#000";
    });

    // ✅ العنوان في صفحة الأدمن (h2 داخل admin.html)
    const adminTitle = document.querySelector("#admin-panel h2");
    if (adminTitle) adminTitle.style.backgroundColor = colors.title || "#0a4473";
}


function populateColorInputs() {
    const colors = configData.colors || {};
    document.getElementById("color-title").value = colors.title || "#222222";
    document.getElementById("color-title-text").value = colors.title_text || "#ffffff";
    document.getElementById("color-categories-bg").value = colors.categories_bg || "#3ca370";
    document.getElementById("color-people-bg").value = colors.people_bg || "#444444";
    document.getElementById("color-number-bg").value = colors.number_bg || "#ffffff";
    document.getElementById("color-number-text").value = colors.number_text || "#000000";
    document.getElementById("color-payers-bg").value = colors.payers_bg || "#eeeeee";
    document.getElementById("color-categories-form-bg").value = colors.categories_form_bg || "#eeeeee";
    document.getElementById("color-payers-text").value = colors.payers_text || "#000000";
    document.getElementById("color-body-bg").value = colors.body_bg || "#f5f5f5";
}

function saveAllChanges() {
    const newTitle = document.getElementById("input-title").value.trim();
    const budget = parseFloat(document.getElementById("input-budget").value);
    const currencyMain = document.getElementById("input-main-currency").value.trim();
    const rate = parseFloat(document.getElementById("input-rate").value);
    const currencyAlt = document.getElementById("input-alt-currency").value.trim();

    const people = Array.from(document.querySelectorAll("#people-list input"))
        .map(input => input.value.trim()).filter(v => v);

    const categories = Array.from(document.querySelectorAll("#categories-list input"))
        .map(input => input.value.trim()).filter(v => v);

    const colors = {
        title: document.getElementById("color-title").value,
        title_text: document.getElementById("color-title-text").value,
        categories_bg: document.getElementById("color-categories-bg").value,
        people_bg: document.getElementById("color-people-bg").value,
        number_bg: document.getElementById("color-number-bg").value,
        number_text: document.getElementById("color-number-text").value,
        payers_bg: document.getElementById("color-payers-bg").value,
        categories_form_bg: document.getElementById("color-categories-form-bg").value,
        payers_text: document.getElementById("color-payers-text").value,
        body_bg: document.getElementById("color-body-bg").value
    };

    const updatedConfig = {
        budget,
        rate,
        currency_main: currencyMain,
        currency_alt: currencyAlt,
        people,
        categories,
        colors
    };

    fetch("save-config.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig, title: newTitle })
    }).then(() => {
        loadData().then(() => {
            alert("✅ تم حفظ التعديلات");
        });

    });

} function addNewItem(type) {
    const list = type === "person" ? document.getElementById("people-list") : document.getElementById("categories-list");
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
        <input type="text" value="" data-type="${type}" />
        <button onclick="removeItem(this, '${type}')">🗑️</button>
    `;
    list.appendChild(div);
}

function removeItem(btn, type) {
    btn.parentElement.remove();
} function resetEntries() {
    if (!confirm("⚠ هل أنت متأكد أنك تريد حذف جميع المشتريات؟ لا يمكن التراجع.")) return;

    fetch("reset-entries.php", {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                alert("✅ تم حذف جميع المشتريات");
            } else {
                alert("حدث خطأ أثناء الحذف");
            }
        })
        .catch(() => {
            alert("فشل الاتصال بالخادم");
        });
} function uploadCurrencyImages() {
    const sarInput = document.getElementById("sar-img-input").files[0];
    const zarInput = document.getElementById("zar-img-input").files[0];
    const formData = new FormData();

    if (sarInput) formData.append("sar", sarInput);
    if (zarInput) formData.append("zar", zarInput);

    fetch("upload-currency-image.php", {
        method: "POST",
        body: formData,
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                alert("✅ تم تحديث الصور");
                // تحديث الصور بدون تحديث الصفحة
                document.getElementById("current-sar-img").src = "images/sar.png?v=" + Date.now();
                document.getElementById("current-zar-img").src = "images/zar.png?v=" + Date.now();
            } else {
                alert("❌ فشل في رفع الصور");
            }
        })
        .catch(() => {
            alert("❌ حدث خطأ في الاتصال بالخادم");
        });
}


function resetPlan() {
    if (!confirm("هل أنت متأكد أنك تريد حذف مخطط الرحلة بالكامل؟")) return;

    fetch('reset-plan.php', {
        method: 'POST'
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("تم حذف مخطط الرحلة بنجاح");
                location.reload();
            } else {
                alert("فشل في حذف المخطط: " + (data.error || ""));
            }
        })
        .catch(err => {
            console.error("خطأ:", err);
            alert("حدث خطأ في الاتصال بالخادم");
        });
}



document.addEventListener("DOMContentLoaded", () => {
    loadData();
});