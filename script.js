applySavedFontSize();
window.addEventListener("load", () => {
    refreshImages();
});
window.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("userName")) {
        window.location.href = "login.html";
    } else {
        document.body.style.display = "block";

        // إضافة استماع لتبويب "أماكن وفعاليات"
        const placesTab = document.getElementById('btn-places-tab');
        if (placesTab) {
            placesTab.addEventListener('click', () => {
                if (typeof loadPlaces === 'function') {
                    loadPlaces();
                }
            });
        }
    }
});



let configData = {};
let entriesData = [];
let selectedCurrency = "main";
let currentUser = localStorage.getItem("userName") || "";

fetch("data/config.json?v=" + Date.now())
    .then(res => res.json())
    .then(config => {
        configData = config;
        createOptions("payers", config.people);
        createOptions("categories-form", config.categories);

        document.getElementById("rate").textContent = config.rate;
        document.getElementById("sar-input").placeholder = "المبلغ بـ " + config.currency_main;
        document.getElementById("zar-input").placeholder = "المبلغ بـ " + config.currency_alt;

        document.getElementById("base-currency-label").textContent = config.currency_main;
        document.getElementById("base-currency-label-2").textContent = config.currency_main;
        document.getElementById("base-currency-label-3").textContent = config.currency_main;

        document.getElementById("base-currency-label-rate").textContent = config.currency_main;
        document.getElementById("alt-currency-label-rate").textContent = config.currency_alt;

        document.querySelector("#converter p").innerHTML = `سعر الصرف: 1 ${config.currency_main} = <span id="rate">${config.rate}</span> ${config.currency_alt}`;

        loadStats();
        updateCurrencyButtons();

    });

function updateCurrencyButtons() {
    const mainBtn = document.getElementById("btn-main-currency");
    const foreignBtn = document.getElementById("btn-foreign-currency");

    mainBtn.textContent = configData.currency_main || "ريال";
    foreignBtn.textContent = configData.currency_alt || "راند";

    if (selectedCurrency === "main") {
        mainBtn.classList.add("active-currency");
        foreignBtn.classList.remove("active-currency");
    } else {
        foreignBtn.classList.add("active-currency");
        mainBtn.classList.remove("active-currency");
    }
}


document.getElementById("btn-main-currency").addEventListener("click", () => {
    selectedCurrency = "main";
    updateCurrencyButtons();
});

document.getElementById("btn-foreign-currency").addEventListener("click", () => {
    selectedCurrency = "foreign";
    updateCurrencyButtons();
});

function showSection(id) {
    ["main", "form", "converter", "plan", "entries"].forEach(section => {
        document.getElementById(section).classList.add("hidden");
    });

    document.getElementById(id).classList.remove("hidden");

    if (id === "entries") loadEntriesTable();
    if (id === "plan") loadPlan(); // تحميل بيانات المخطط

    const buttons = document.querySelectorAll(".buttons-scroll button");
    buttons.forEach(btn => {
        btn.classList.remove("active-tab");
    });

    if (id === "main") document.querySelector(".buttons-scroll button:nth-child(1)").classList.add("active-tab");
    if (id === "form") document.querySelector(".buttons-scroll button:nth-child(2)").classList.add("active-tab");
    if (id === "converter") document.querySelector(".buttons-scroll button:nth-child(3)").classList.add("active-tab");
    if (id === "plan") document.querySelector(".buttons-scroll button:nth-child(4)").classList.add("active-tab");
    if (id === "entries") document.querySelector(".buttons-scroll button:nth-child(5)").classList.add("active-tab");
}


document.getElementById("sar-input")?.addEventListener("input", function () {
    const val = parseFloat(this.value);
    document.getElementById("zar-input").value = (val * configData.rate).toFixed(2);
});
document.getElementById("zar-input")?.addEventListener("input", function () {
    const val = parseFloat(this.value);
    document.getElementById("sar-input").value = (val / configData.rate).toFixed(2);
});

function wrapNotes(text) {
    const maxLength = window.innerWidth <= 768 ? 40 : 25;
    const maxTotalLength = 100;

    const words = text.split(" ");
    const lines = [];
    let currentLine = "";
    let totalLength = 0;

    for (let word of words) {
        const space = currentLine ? 1 : 0;
        const nextLength = totalLength + word.length + space;

        if (nextLength > maxTotalLength) break;

        if (word.length > maxLength) {
            const parts = word.match(new RegExp(`.{1,${maxLength}}`, "g"));
            for (let part of parts) {
                if (totalLength + part.length > maxTotalLength) break;
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = "";
                }
                lines.push(part);
                totalLength += part.length;
            }
            continue;
        }

        if ((currentLine + word).length <= maxLength) {
            currentLine += (currentLine ? " " : "") + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }

        totalLength += word.length + space;
    }

    if (currentLine && totalLength <= maxTotalLength) {
        lines.push(currentLine);
    }

    return lines.join("\n");
}






function submitPurchase() {
    const payer = document.querySelector("#payers .selected")?.textContent;
    const amount = parseFloat(document.getElementById("amount").value);
    const currencyKey = selectedCurrency;
    let currency = currencyKey === "main" ? configData.currency_main : configData.currency_alt || configData.currency_foreign;
    let category = document.querySelector("#categories-form .selected")?.textContent;
    const customCategory = document.getElementById("custom-category").value;
    const rawNotes = document.getElementById("notes").value.trim();

    if (rawNotes.length > 100) {
        alert("🚫 الملاحظات لا يمكن أن تتجاوز 100 حرف.");
        return;
    }

    const notesWrapped = wrapNotes(rawNotes); // ✅ بعد التحقق

    if (!payer || isNaN(amount) || !category) {
        alert("يرجى تعبئة جميع الحقول المطلوبة");
        return;
    }

    if (category === "أخرى" && customCategory.trim() !== "") {
        category = customCategory.trim();
    }

    const formData = new FormData();
    formData.append("payer", payer);
    formData.append("amount", amount);
    formData.append("currency", currency);
    formData.append("category", category);
    formData.append("notes", notesWrapped);  // ✅ ملاحظات بعد الـ wrap
    formData.append("host", currentUser);

    fetch("save-entry.php", {
        method: "POST",
        body: formData,
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.status === "success") {
                alert("تمت إضافة العملية بنجاح ✅");
                Promise.all([
                    fetch("data/config.json").then(res => res.json()),
                    fetch("data/entries.json?v=" + Date.now()).then(res => res.json())
                ]).then(([config, entries]) => {
                    configData = config;
                    entriesData = entries;
                    createOptions("payers", config.people);
                    createOptions("categories-form", config.categories);
                    renderStats();
                    loadEntriesTable();
                    showSection("main");
                });
            } else {
                alert("حدث خطأ أثناء الحفظ");
            }
        })
        .catch(() => {
            alert("فشل الاتصال بالخادم");
        });
}


function createOptions(containerId, list) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    list.forEach((item) => {
        const div = document.createElement("div");
        div.textContent = item;
        div.onclick = () => {
            container.querySelectorAll("div").forEach((d) => d.classList.remove("selected"));
            div.classList.add("selected");
            if (item === "أخرى" && containerId === "categories-form") {
                document.getElementById("custom-category").classList.remove("hidden");
            } else if (containerId === "categories-form") {
                document.getElementById("custom-category").classList.add("hidden");
            }
        };
        container.appendChild(div);
    });
    applyColors();
}

function loadStats() {
    fetch("data/entries.json?v=" + Date.now())
        .then(res => res.json())
        .then(entries => {
            entriesData = entries;
            renderStats();
        });
}

function renderStats() {
    const totalBudget = configData.budget || 0;
    let totalExpense = 0;
    const categorySums = {};
    const personSums = {};
    const perPersonDiv = document.getElementById("per-person");
    const realPeople = configData.people.filter(name => name !== "الميزانية");
    const numberOfPeople = realPeople.length;
    const perPersonAmount = (totalBudget / numberOfPeople).toFixed(2);
    perPersonDiv.textContent = `المتوسط للشخص: ${perPersonAmount} ${configData.currency_main}`;



    entriesData.forEach(entry => {
        const amount = entry.currency === configData.currency_alt
            ? entry.amount / configData.rate
            : entry.amount;
        totalExpense += amount;
        const cat = configData.categories.includes(entry.category)
            ? entry.category
            : "أخرى";
        categorySums[cat] = (categorySums[cat] || 0) + amount;
        personSums[entry.payer] = (personSums[entry.payer] || 0) + amount;
    });

    document.getElementById("total-expense").textContent = Math.ceil(totalExpense).toString();
    document.getElementById("remaining").textContent = Math.ceil(totalBudget - totalExpense).toString();
    document.getElementById("total-budget").textContent = Math.ceil(totalBudget).toString();


    const catBox = document.getElementById("categories");
    catBox.innerHTML = "";
    configData.categories.forEach(cat => {
        const box = document.createElement("div");
        box.className = "category-box";

        const title = document.createElement("span");
        title.textContent = cat;

        const amount = document.createElement("strong");
        amount.textContent = Math.ceil(categorySums[cat] || 0).toString();

        const currency = document.createElement("span");
        currency.textContent = configData.currency_main;

        box.appendChild(title);
        box.appendChild(amount);
        box.appendChild(currency);

        catBox.appendChild(box);
    });

    const peopleBox = document.getElementById("people");
    peopleBox.innerHTML = "";
    configData.people.forEach(name => {
        const box = document.createElement("div");
        box.className = "category-box";

        const title = document.createElement("span");
        title.textContent = name;

        const amount = document.createElement("strong");
        amount.textContent = Math.ceil(personSums[name] || 0).toString();

        const currency = document.createElement("span");
        currency.textContent = configData.currency_main;

        box.appendChild(title);
        box.appendChild(amount);
        box.appendChild(currency);

        peopleBox.appendChild(box);
    });
    applyColors();
}



function loadEntriesTable() {
    fetch("data/entries.json?v=" + Date.now())
        .then(res => res.json())
        .then(data => {
            const tableBody = document.querySelector("#entries-table tbody");
            tableBody.innerHTML = ""
            switch (currentSort) {
                case "timestamp-desc":
                    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    break;
                case "timestamp-asc":
                    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    break;
                case "amount-desc":
                    data.sort((a, b) => b.amount - a.amount);
                    break;
                case "amount-asc":
                    data.sort((a, b) => a.amount - b.amount);
                    break;
                case "category":
                    data.sort((a, b) => a.category.localeCompare(b.category));
                    break;
                case "currency":
                    data.sort((a, b) => a.currency.localeCompare(b.currency));
                    break;
                case "payer":
                    data.sort((a, b) => a.payer.localeCompare(b.payer));
                    break;
                case "host":
                    data.sort((a, b) => a.host.localeCompare(b.host));
                    break;
            }

            data.forEach(entry => {
                const row = document.createElement("tr");
                row.setAttribute("data-original-timestamp", entry.timestamp);
                const formattedTime = formatTimeTo12Hour(entry.timestamp);

                row.innerHTML = `
                 <td>${entry.host || '-'}</td>
                 <td>${entry.payer}</td>
                 <td>${entry.amount}</td>
                 <td>${entry.currency}</td>
                 <td>${entry.category}</td>
                 <td>${entry.notes || '-'}</td>
                 <td>${formattedTime}</td>
                 <td class="edit-col hidden"><button class="delete-row">🗑️</button></td>
                `;

                tableBody.appendChild(row);
            });
        });
}
let currentSort = localStorage.getItem("entriesSort") || "timestamp-desc";
function applySorting() {
    currentSort = document.getElementById("sort-selector").value;
    localStorage.setItem("entriesSort", currentSort);
    loadEntriesTable();
}


document.getElementById("search-input").addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();

    const filtered = entriesData.filter(entry =>
        Object.values(entry).some(val =>
            String(val).toLowerCase().includes(searchTerm)
        )
    );

    const tableBody = document.querySelector("#entries-table tbody");
    tableBody.innerHTML = "";

    filtered.forEach(entry => {
        const row = document.createElement("tr");
        const formattedTime = formatTimeTo12Hour(entry.timestamp);
        row.innerHTML = `
            <td>${entry.host || '-'}</td>
            <td>${entry.payer}</td>
            <td>${entry.amount}</td>
            <td>${entry.currency}</td>
            <td>${entry.category}</td>
            <td>${entry.notes || '-'}</td>
            <td>${formattedTime}</td>
            <td class="edit-col hidden"><button class="delete-row">🗑️</button></td>
        `;
        tableBody.appendChild(row);
    });
});

function formatTimeTo12Hour(time) {
    const date = new Date(time);
    date.setHours(date.getHours() + 3);

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    const hour12 = hours % 12;
    const hourFormatted = hour12 ? hour12 : 12;
    const minuteFormatted = minutes < 10 ? '0' + minutes : minutes;

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dateFormatted = `${day}/${month}/${year}`;

    return `${dateFormatted} - ${hourFormatted}:${minuteFormatted} ${ampm}`;
}
function enableEditing() {
    const isEditing = document.getElementById("apply-edits").classList.contains("hidden") === false;

    if (isEditing) {
        document.querySelectorAll(".edit-col").forEach(e => e.classList.add("hidden"));
        document.getElementById("apply-edits").classList.add("hidden");

        loadEntriesTable();
    } else {
        document.querySelectorAll(".edit-col").forEach(e => e.classList.remove("hidden"));
        document.getElementById("apply-edits").classList.remove("hidden");

        const people = configData.people;

        document.querySelectorAll("#entries-table tbody tr").forEach(row => {
            row.querySelectorAll("td").forEach((cell, index) => {
                if (index === 1) {
                    const current = cell.textContent.trim();
                    const select = document.createElement("select");
                    people.forEach(name => {
                        const option = document.createElement("option");
                        option.value = name;
                        option.textContent = name;
                        if (name === current) option.selected = true;
                        select.appendChild(option);
                    });
                    cell.innerHTML = "";
                    cell.appendChild(select);
                } else if ([2, 4, 5].includes(index)) {
                    cell.contentEditable = true;
                    cell.style.backgroundColor = "#fff4d2";
                }
            });
        });
    }
}



function exportToPDF() {
    window.print();
}


function applyColors() {
    const colors = configData.colors || {};

    // خلفية الموقع
    document.body.style.backgroundColor = colors.body_bg || "#f5f5f5";

    // العنوان الرئيسي
    document.querySelectorAll("h1, h2").forEach(heading => {
        heading.style.backgroundColor = colors.title || "#0a4473";
        heading.style.color = colors.title_text || "#fff";
    });

    // الإحصائيات - الفئات
    document.querySelectorAll("#categories .category-box").forEach(box => {
        box.style.backgroundColor = colors.categories_bg || "#3ca370";
        const strong = box.querySelector("strong");
        if (strong) {
            strong.style.backgroundColor = colors.number_bg || "#fff";
            strong.style.color = colors.number_text || "#000";
        }
    });

    // الإحصائيات - الأشخاص
    document.querySelectorAll("#people .category-box").forEach(box => {
        box.style.backgroundColor = colors.people_bg || "#444";
        const strong = box.querySelector("strong");
        if (strong) {
            strong.style.backgroundColor = colors.number_bg || "#fff";
            strong.style.color = colors.number_text || "#000";
        }
    });

    // خيارات من دفع
    document.querySelectorAll("#payers div").forEach(div => {
        div.style.backgroundColor = colors.payers_bg || "#eee";
        div.style.color = colors.payers_text || "#000";
    });

    // خيارات فئة الدفع
    document.querySelectorAll("#categories-form div").forEach(div => {
        div.style.backgroundColor = colors.categories_form_bg || "#eee";
        div.style.color = colors.payers_text || "#000";
    });
}
function logout() {
    localStorage.removeItem("userName");
    window.location.href = "login.html";
}


function submitEdits() {
    const password = prompt("أدخل كلمة المرور لتأكيد التعديلات:");
    if (password !== "0012") {
        alert("كلمة المرور غير صحيحة");
        return;
    }

    const rows = document.querySelectorAll("#entries-table tbody tr");
    const updatedEntries = [];

    let hasTooLongNote = false;

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const notesText = cells[5].textContent.trim();
        if (notesText.length > 100) {
            hasTooLongNote = true;
        }
    });

    if (hasTooLongNote) {
        alert("🚫 أحد الملاحظات تجاوز 100 حرف. الرجاء تقصيرها.");
        return; // هذا return يوقف الدالة كاملة ✅
    }

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        const host = cells[0].textContent.trim();
        const payer = cells[1].querySelector("select")?.value || cells[1].textContent.trim();
        const amount = parseFloat(cells[2].textContent.trim());
        const currency = cells[3].textContent.trim();
        const category = cells[4].textContent.trim();
        const notes = wrapNotes(cells[5].textContent.trim());
        const timestamp = row.getAttribute("data-original-timestamp") || new Date().toISOString();

        updatedEntries.push({
            host,
            payer,
            amount,
            currency,
            category,
            notes,
            timestamp
        });
    });

    // 🔄 الترتيب من الأحدث للأقدم
    updatedEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    fetch("save-all-entries.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEntries)
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                alert("✅ تم حفظ التعديلات");
                loadEntriesTable();
                document.getElementById("apply-edits").classList.add("hidden");

                document.querySelectorAll(".edit-col").forEach(e => e.classList.add("hidden"));
                document.querySelectorAll("#entries-table td").forEach(cell => {
                    cell.contentEditable = false;
                    cell.style.backgroundColor = "";
                });
            } else {
                alert("حدث خطأ أثناء الحفظ");
            }
        })
        .catch(() => {
            alert("فشل الاتصال بالخادم");
        });
}




document.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-row")) {
        const row = e.target.closest("tr");
        row.remove(); // حذف الصف مباشرة من الجدول
    }
});


function applySavedFontSize() {
    const savedSize = localStorage.getItem("tableFontSize") || "16px";
    document.querySelector("#entries-table").style.fontSize = savedSize;
    document.getElementById("font-size-selector").value = savedSize;
}

document.getElementById("font-size-selector").addEventListener("change", function () {
    const selectedSize = this.value;
    document.querySelector("#entries-table").style.fontSize = selectedSize;
    localStorage.setItem("tableFontSize", selectedSize);
});

const notesInput = document.getElementById("notes");
const notesCounter = document.getElementById("notes-counter");

if (notesInput) {
    notesInput.addEventListener("input", () => {
        let text = notesInput.value;
        if (text.length > 100) {
            text = text.slice(0, 100);
            notesInput.value = text;
        }
        notesCounter.textContent = `${text.length} / 100`;
        notesCounter.style.color = text.length >= 100 ? "darkred" : "gray";
        notesCounter.style.fontWeight = text.length >= 100 ? "bold" : "normal";
    });
}

function refreshImages() {
    const images = document.querySelectorAll("img");
    images.forEach(img => {
        const src = img.getAttribute("src");
        if (src && !src.includes("base64")) {
            const cleanSrc = src.split("?")[0];
            img.src = `${cleanSrc}?v=${Date.now()}`;
        }
    });
}


// ---------- مخطط الرحلة ---------- //

const planForm = document.getElementById("plan-form");
const planTableBody = document.querySelector("#plan-table tbody");
let planData = [];

function loadPlan() {
    fetch("data/plan.json?v=" + Date.now())
        .then(res => res.json())
        .then(data => {
            planData = Array.isArray(data) ? data : [];
            renderPlanTable();
        });
}
function convertToArabicDay(day) {
    const num = parseInt(day);
    const names = [
        "الأول", "الثاني", "الثالث", "الرابع", "الخامس",
        "السادس", "السابع", "الثامن", "التاسع", "العاشر",
        "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر",
        "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر",
        "التاسع عشر", "العشرون"
    ];
    return names[num - 1] || `رقم ${num}`;
}


function renderPlanTable() {
    const container = document.getElementById("plan-table");
    container.innerHTML = "";

    const daysMap = {};
    planData.forEach((entry, originalIndex) => {
        const day = entry.day || "0";
        if (!daysMap[day]) daysMap[day] = [];
        daysMap[day].push({ ...entry, originalIndex });
    });

    const sortedDays = Object.keys(daysMap).sort((a, b) => parseInt(a) - parseInt(b));

    const activeGroups = [];
    const completedGroups = [];

    sortedDays.forEach(day => {
        const group = daysMap[day];
        const pending = group.filter(e => !e.checked);
        const done = group.filter(e => e.checked);
        const combined = [...pending, ...done];

        const dayHeader = document.createElement("h3");
        dayHeader.textContent = "اليوم " + convertToArabicDay(day);
        dayHeader.className = "day-header";

        const table = document.createElement("table");
        table.className = "sub-plan-table";
        table.innerHTML = `
            <thead>
                <tr>
                    <th></th> <!-- مقبض السحب -->
                    <th>اليوم</th>
                    <th>الصورة</th>
                    <th>الاسم</th>
                    <th>الرابط</th>
                    <th>التقييم</th>
                    <th>الملاحظات</th>
                    <th>تم؟</th>
                    <th>حذف</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const wrapper = document.createElement("div");
        const scrollWrapper = document.createElement("div");
        scrollWrapper.style.overflowX = "auto";
        scrollWrapper.style.marginBottom = "20px";

        
        scrollWrapper.appendChild(table);

    
        wrapper.appendChild(dayHeader);
        wrapper.appendChild(scrollWrapper);
        const tbody = table.querySelector("tbody");

        
        wrapper.appendChild(dayHeader);
        wrapper.appendChild(scrollWrapper);

        combined.forEach(entry => {
            const row = document.createElement("tr");
            row.className = entry.checked ? "completed" : "";
            row.innerHTML = `
                 <td><span class="drag-handle" style="cursor:grab;">☰</span></td>
                <td>${entry.day || "-"}</td>
                <td>
    <img
        src="${entry.image ? entry.image.replace('images/', 'images/thumb_') : 'images/default-location.png'}" 
        data-full="${entry.image || 'images/default-location.png'}"
        class="plan-img-thumb"
        style="width:60px; cursor:pointer;"
    >
</td>

                <td>${entry.name}</td>
                <td>${entry.link ? `<a href="${entry.link}" target="_blank">هنا</a>` : "-"}</td>
                <td><div class="star-rating readonly">${[1, 2, 3, 4, 5].map(i => `<span class="star ${entry.rating >= i ? 'filled' : ''}">★</span>`).join('')}</div></td>
                <td style="white-space:pre-wrap;">${entry.note || ""}</td>
                <td><input type="checkbox" ${entry.checked ? "checked" : ""} data-index="${entry.originalIndex}" class="plan-check"></td>
                <td><button data-index="${entry.originalIndex}" class="plan-delete">🗑️</button></td>
            `;
            const img = row.querySelector("img");
            if (img) {
                img.style.cursor = "pointer";

                const originalSrc = img.src;
                const filename = originalSrc.split("/").pop();

                if (!filename.startsWith("thumb_")) {
                    const thumbSrc = originalSrc.replace("images/", "images/thumb_");
                    img.src = thumbSrc;
                    img.setAttribute("data-full", originalSrc);
                } else {
                    img.setAttribute("data-full", originalSrc.replace("thumb_", ""));
                }

                img.onclick = () => {
                    const fullSrc = img.getAttribute("data-full");
                    openModal(fullSrc);
                };
            }





            tbody.appendChild(row);
        });

        Sortable.create(tbody, {
            group: "plan-days",
            animation: 150,
            handle: ".drag-handle",
            onEnd: (evt) => {
                const toTbody = evt.to;

                const parentTable = toTbody.closest("table");
                const wrapperDiv = parentTable?.parentElement?.parentElement;
                const header = wrapperDiv?.querySelector("h3");

                const dayText = header?.innerText.trim() || "";
                const match = dayText.match(/اليوم\s+(.*)/);
                const newDayArabic = match ? match[1].trim() : null;

                const dayMap = {
                    "الأول": 1, "الثاني": 2, "الثالث": 3, "الرابع": 4, "الخامس": 5,
                    "السادس": 6, "السابع": 7, "الثامن": 8, "التاسع": 9, "العاشر": 10,
                    "الحادي عشر": 11, "الثاني عشر": 12, "الثالث عشر": 13, "الرابع عشر": 14,
                    "الخامس عشر": 15, "السادس عشر": 16, "السابع عشر": 17, "الثامن عشر": 18,
                    "التاسع عشر": 19, "العشرون": 20, "الحادي والعشرون": 21, "الثاني والعشرون": 22,
                    "الثالث والعشرون": 23, "الرابع والعشرون": 24, "الخامس والعشرون": 25
                };

                let newDay = dayMap[newDayArabic];
                if (!newDay) {
                    alert("حدث خطأ في قراءة رقم اليوم");
                    return;
                }

                const updatedItems = [];
                const movedIndexes = [];

                toTbody.querySelectorAll("tr").forEach(row => {
                    const index = parseInt(row.querySelector(".plan-check")?.dataset.index);
                    if (!isNaN(index) && planData[index]) {
                        const item = { ...planData[index] };
                        item.day = String(newDay);
                        updatedItems.push(item);
                        movedIndexes.push(index);
                    }
                });

                planData = planData.filter((_, idx) => !movedIndexes.includes(idx));
                planData = [...planData, ...updatedItems];

                savePlan();
            }
        });







       

        if (pending.length === 0 && done.length > 0) {
            wrapper.style.opacity = "0.6";
            completedGroups.push(wrapper);
        } else {
            activeGroups.push(wrapper);
        }
    });

    // عرض الأقسام
    [...activeGroups, ...completedGroups].forEach(group => container.appendChild(group));
}




// عند إرسال النموذج
planForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("plan-name").value.trim();
    const link = document.getElementById("plan-link").value.trim();
    const day = document.getElementById("plan-day").value;
    const note = document.getElementById("plan-note").value.trim();
    const imageFile = document.getElementById("plan-image").files[0];
    const rating = parseInt(document.getElementById("plan-rating-value").value) || 0;

    if (!name) return alert("الاسم مطلوب");

    const statusBox = document.getElementById("add-status");
    statusBox.textContent = "جاري الإضافة...";

    setTimeout(() => {
        const newEntry = {
            name,
            link,
            day,
            rating,
            note,
            checked: false,
            host: userName
        };

        const finish = () => {
            planData.push(newEntry);
            savePlan();
            planForm.reset();
            
            resetRating();
            statusBox.textContent = "تمت الإضافة ✅";
            setTimeout(() => statusBox.textContent = "", 1000);
        };

        if (imageFile) {
            const formData = new FormData();
            formData.append("image", imageFile);
            fetch("upload-plan-image.php", {
                method: "POST",
                body: formData,
            })
                .then(res => res.text())
                .then(imageUrl => {
                    newEntry.image = imageUrl || "images/default-location.png";
                    finish();
                })
                .catch(() => {
                    newEntry.image = "images/default-location.png";
                    finish();
                });
        } else {
            newEntry.image = "images/default-location.png";
            finish();
        }
    }, 1000);
});




const planContainer = document.getElementById("plan-table");
    // الحذف
    if (planContainer) {
     planContainer.addEventListener("click", e => {
        if (e.target.classList.contains("plan-delete")) {
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index) && planData[index]) {
                if (confirm("هل أنت متأكد من حذف هذا الموقع؟")) {
                    planData.splice(index, 1);
                    savePlan();
                }
            }
        }
     });

     // التشييك
     planContainer.addEventListener("change", e => {
        if (e.target.classList.contains("plan-check")) {
            const index = parseInt(e.target.dataset.index);
            const isChecked = e.target.checked;

            if (!isNaN(index) && planData[index]) {
                planData[index].checked = isChecked;

                fetch("save-plan.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(planData)
                }).then(() => renderPlanTable());
            }
        }
     });

    }





function savePlan() {
    fetch("save-plan.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData)
    })
        .then(res => res.text())
        .then(() => renderPlanTable());
}
const ratingStars = document.querySelectorAll("#plan-rating span");
const ratingValueInput = document.getElementById("plan-rating-value");
ratingStars.forEach(star => {
    star.addEventListener("click", () => {
        const rating = parseInt(star.dataset.value);
        ratingValueInput.value = rating;

        ratingStars.forEach(s => s.classList.remove("active", "selected"));
        ratingStars.forEach(s => {
            if (parseInt(s.dataset.value) <= rating) {
                s.classList.add("active", "selected");
            }
        });
    });
});
ratingStars.forEach(star => {
    star.addEventListener("mouseover", () => {
        const val = parseInt(star.dataset.value);
        ratingStars.forEach(s => {
            s.classList.toggle("hovered", parseInt(s.dataset.value) <= val);
        });
    });

    star.addEventListener("mouseout", () => {
        ratingStars.forEach(s => s.classList.remove("hovered"));
    });
});
function resetRating() {
    ratingValueInput.value = 0;
    ratingStars.forEach(s => {
        s.classList.remove("active", "selected", "hovered");
    });
}



document.addEventListener("input", function (e) {
    if (e.target.id === "plan-search") {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll("#plan-table tbody tr").forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
        });
    }
});
document.getElementById("toggle-form-btn").addEventListener("click", () => {
    const formWrapper = document.getElementById("plan-form-wrapper");
    const isVisible = formWrapper.style.display === "block";

    formWrapper.style.display = isVisible ? "none" : "block";
});


function openModal(src) {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");
    modalImg.src = src;
    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("image-modal").style.display = "none";
}

function openModal(imageSrc) {
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    modalImage.src = imageSrc;
    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("image-modal").style.display = "none";
}







document.getElementById('btn-days-tab').addEventListener('click', () => {
    document.getElementById('days-section').style.display = 'block';
    document.getElementById('places-section').style.display = 'none';
    document.getElementById('btn-days-tab').classList.add('active');
    document.getElementById('btn-places-tab').classList.remove('active');
});

document.getElementById('btn-places-tab').addEventListener('click', () => {
    document.getElementById('days-section').style.display = 'none';
    document.getElementById('places-section').style.display = 'block';
    document.getElementById('btn-days-tab').classList.remove('active');
    document.getElementById('btn-places-tab').classList.add('active');
});
// إظهار وإخفاء نموذج "إضافة مكان"
function setupPlaceRatingStars() {
    document.querySelectorAll('#place-rating .star').forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            document.getElementById('place-rating-value').value = value;

            // تلوين النجوم حسب التقييم
            document.querySelectorAll('#place-rating .star').forEach(s => {
                const v = parseInt(s.getAttribute('data-value'));
                s.style.color = v <= value ? 'gold' : '#ccc';
            });
        });
    });
}

// دالة لتحويل الصورة إلى base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
let currentStep = 1;
// زر عرض/إخفاء النموذج
document.getElementById("toggle-place-form").addEventListener("click", () => {
    const wrapper = document.getElementById("place-form-wrapper");

    if (wrapper.style.display === "block") {
        wrapper.style.display = "none";
    } else {
        wrapper.style.display = "block";

        // نرجع للخطوة الأولى (نوع المكان)
        currentStep = 1;

        // نخفي كل الخطوات
        document.querySelectorAll(".step").forEach(step => step.style.display = "none");

        // نعرض الخطوة الأولى فقط
        const firstStep = document.querySelector(`.step[data-step="${currentStep}"]`);
        if (firstStep) firstStep.style.display = "block";
    }
});




// إرسال النموذج
document.getElementById("place-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("place-name").value.trim();
    const link = document.getElementById("place-link").value.trim();
    const city = document.getElementById("place-city").value.trim();
    const note = document.getElementById("place-note").value.trim();
    const rating = parseInt(document.getElementById("place-rating-value").value) || 0;
    const file = document.getElementById("place-image").files[0];
    const host = localStorage.getItem("userName") || "غير معروف";

    if (!name) {
        alert("يرجى إدخال اسم المكان.");
        return;
    }

    const image = file ? await toBase64(file) : "";

    const payload = {
        type: document.getElementById("place-type").value, // ← أضف هذا السطر
        name,
        link,
        city,
        note,
        rating,
        host,
        image
    };


    savePlace(payload);
});
function savePlace(payload) {
    const submitBtn = document.querySelector("#place-form button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري الإضافة...";

    fetch("save-place.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                const status = document.getElementById("place-add-status");
                status.textContent = "تمت الإضافة بنجاح ✅";

                document.getElementById("place-form").reset();
                document.getElementById("place-rating-value").value = 0;
                document.querySelectorAll('#place-rating .star').forEach(s => {
                    s.style.color = '#ccc';
                });

                loadPlaces();

                // ← الانتظار 1.5 ثانية ثم إغلاق النموذج
                setTimeout(() => {
                    document.getElementById("place-form-wrapper").style.display = "none";
                    currentStep = 1; // نرجع أول خطوة
                    document.querySelectorAll(".step").forEach((step, index) => {
                        step.style.display = (index === 0) ? "block" : "none";
                    });

                    status.textContent = ""; // ← تنظيف الرسالة بعد الإغلاق
                }, 1500);
            } else {
                document.getElementById("place-add-status").textContent = "فشل في الإضافة ❌";
            }
        })
        .catch((err) => {
            console.error("خطأ:", err);
            document.getElementById("place-add-status").textContent = "حدث خطأ أثناء الإرسال ❌";
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = "إضافة";
        });
}






function deletePlace(index) {
    if (!confirm("هل أنت متأكد من حذف هذا المكان؟")) return;

    const formData = new URLSearchParams();
    formData.append('index', index);

    fetch("delete-place.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadPlaces(); // إعادة تحميل الجدول
            } else {
                alert("فشل الحذف: " + data.message);
            }
        })
        .catch(err => {
            console.error("خطأ في الحذف:", err);
            alert("حدث خطأ غير متوقع أثناء الحذف.");
        });
}

let placesData = [];

function loadPlaces() {
    fetch('data/places.json?v=' + Date.now())
        .then(response => response.json())
        .then(data => {
            placesData = data;
            renderPlacesTable(data);
            applyPlaceSorting();
        });
}

function renderPlacesTable(data) {
    const container = document.getElementById("places-table-container");
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    const table = document.createElement("table");
    table.className = "sub-plan-table places-table";

    table.innerHTML = `
        <thead>
          <tr>
            <th>المدينة</th>
            <th>النوع</th>
            <th>المضيف</th>
            <th>الصورة</th>
            <th>الاسم</th>
            <th>الرابط</th>
            <th>التقييم</th>
            <th>الملاحظات</th>
            <th>نقل</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    data.forEach((place, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${place.city || "-"}</td>
            <td>${place.type || "-"}</td>
            <td>${place.host || "غير معروف"}</td>
            <td>
                ${place.image ? `<img src="${place.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">` : "لا يوجد"}
            </td>
            <td>${place.name || "-"}</td>
            <td>${place.link ? `<a href="${place.link}" target="_blank">رابط</a>` : "-"}</td>
            <td>
                <div class="star-rating readonly">
                    ${[1, 2, 3, 4, 5].map(i => `<span class="star ${parseInt(place.rating || 0) >= i ? 'filled' : ''}">★</span>`).join('')}
                </div>
            </td>
            <td style="white-space:pre-wrap;">${place.note || "-"}</td>
            <td><button class="transfer-place">نقل</button></td>
            <td><button class="plan-delete place-delete" data-index="${index}">🗑️</button></td>
        `;

        row.querySelector(".place-delete").onclick = () => deletePlace(index);
        row.querySelector(".transfer-place").onclick = () => {
            const day = prompt("إلى أي يوم تريد نقل هذا المكان؟");
            if (!day || isNaN(day) || parseInt(day) < 1) {
                alert("رقم يوم غير صالح.");
                return;
            }
            transferPlace(index, parseInt(day));
        };

        tbody.appendChild(row);
    });

    wrapper.appendChild(table);
    container.appendChild(wrapper);
}          

function applyPlaceSorting() {
    const sortType = document.getElementById("place-sort-selector").value;
    const ratingValue = parseInt(document.getElementById("rating-filter").value);
    const ratingSortOrder = document.getElementById("rating-sort-order").value;
    const cityFilter = document.getElementById("city-filter").value;
    const typeFilter = document.getElementById("type-filter").value;

    let sorted = [...placesData];

    // إظهار الفلاتر حسب نوع الترتيب
    document.getElementById("rating-filter").style.display = "none";
    document.getElementById("rating-sort-order").style.display = "none";
    document.getElementById("city-filter").style.display = "none";
    document.getElementById("type-filter").style.display = "none";

    if (sortType === "city") {
        document.getElementById("city-filter").style.display = "inline-block";
        document.getElementById("type-filter").style.display = "inline-block";
        document.getElementById("rating-filter").style.display = "inline-block";

        // توليد المدن
        const cities = [...new Set(placesData.map(p => p.city).filter(Boolean))];
        const citySelect = document.getElementById("city-filter");
        if (citySelect.options.length <= 1) {
            cities.forEach(city => {
                const opt = document.createElement("option");
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });
        }

        // توليد الأنواع
        const types = [...new Set(placesData.map(p => p.type).filter(Boolean))];
        const typeSelect = document.getElementById("type-filter");
        if (typeSelect.options.length <= 1) {
            types.forEach(type => {
                const opt = document.createElement("option");
                opt.value = type;
                opt.textContent = type;
                typeSelect.appendChild(opt);
            });
        }

        // تطبيق الفلاتر
        if (cityFilter) {
            sorted = sorted.filter(p => p.city === cityFilter);
        }
        if (typeFilter) {
            sorted = sorted.filter(p => p.type === typeFilter);
        }
        if (!isNaN(ratingValue)) {
            sorted = sorted.filter(p => parseInt(p.rating || 0) === ratingValue);
        }

    } else if (sortType === "host") {
        sorted.sort((a, b) => (a.host || "").localeCompare(b.host || ""));

    } else if (sortType === "rating") {
        document.getElementById("rating-sort-order").style.display = "inline-block";

        if (ratingSortOrder === "desc") {
            sorted.sort((a, b) => (parseInt(b.rating || 0)) - (parseInt(a.rating || 0)));
        } else if (ratingSortOrder === "asc") {
            sorted.sort((a, b) => (parseInt(a.rating || 0)) - (parseInt(b.rating || 0)));
        }
    }

    renderPlacesTable(sorted);
}







function transferPlace(index, day) {
    fetch('transfer-place.php', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, day })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("تم النقل بنجاح ✅");
                loadPlaces(); // يحدث جدول الأماكن
                loadPlan();   // يعيد تحميل مخطط الأيام ← هذا هو المهم

            } else {
                alert("فشل النقل ❌ " + (data.message || ""));
            }
        })
        .catch(err => {
            console.error("خطأ:", err);
            alert("حدث خطأ أثناء النقل.");
        });
}




function showStep(index) {
    document.querySelectorAll(".step").forEach((step, i) => {
        step.style.display = step.dataset.step == index ? "block" : "none";
    });
}


function nextStep() {
    const current = document.querySelector(`.step[data-step="${currentStep}"]`);
    const input = current.querySelector("input[required]");
    const error = current.querySelector(".error-message");

    if (input && !input.value.trim()) {
        input.classList.add("input-error");
        if (error) error.style.display = "block";
        return;
    }

    if (input) input.classList.remove("input-error");
    if (error) error.style.display = "none";

    const next = document.querySelector(`.step[data-step="${currentStep + 1}"]`);
    if (next) {
        current.style.display = "none";
        next.style.display = "block";
        currentStep++;
    }
}



function skipStep() {
    const next = document.querySelector(`.step[data-step="${currentStep + 1}"]`);
    if (next) {
        document.querySelector(`.step[data-step="${currentStep}"]`).style.display = "none";
        next.style.display = "block";
        currentStep++;
    }
} function prevStep() {
    const current = document.querySelector(`.step[data-step="${currentStep}"]`);
    const prev = document.querySelector(`.step[data-step="${currentStep - 1}"]`);
    if (prev) {
        current.style.display = "none";
        prev.style.display = "block";
        currentStep--;
    }
}








window.addEventListener("DOMContentLoaded", () => {
    setupPlaceRatingStars();
});




showSection('main');
