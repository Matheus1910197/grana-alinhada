/* =========================================================
   GRANA ALINHADA
   DASHBOARD.JS
========================================================= */

let transactions = [];


/* =========================================================
   FORMATAÇÃO
========================================================= */

const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const modal = document.getElementById("modal");
const form = document.getElementById("transactionForm");
const filter = document.getElementById("filter");

const formatMoney = (value) => {
    return money.format(Number(value || 0));
};

const formatDate = (value) => {
    if (!value) return "";

    return new Date(`${value}T12:00:00`)
        .toLocaleDateString("pt-BR");
};


/* =========================================================
   MENSAGEM DO FORMULÁRIO
========================================================= */

function showFormMessage(text, type = "error") {

    const element =
        document.getElementById("formMessage");

    if (!element) return;

    element.textContent = text;
    element.className = `message ${type}`;
}


/* =========================================================
   USUÁRIO
========================================================= */

async function requireUser() {

    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "index.html";
        return null;
    }

    return data.user;
}


/* =========================================================
   PERFIL
========================================================= */

async function loadProfile(user) {

    const { data } =
        await supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

    const name =
        data?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Você";

    const firstName =
        document.getElementById("firstName");

    const sideName =
        document.getElementById("sideName");

    const avatar =
        document.getElementById("avatar");

    if (firstName) {
        firstName.textContent =
            name.split(" ")[0];
    }

    if (sideName) {
        sideName.textContent = name;
    }

    if (avatar) {
        avatar.textContent =
            name.charAt(0).toUpperCase();
    }
}


/* =========================================================
   CARREGAR MOVIMENTAÇÕES
========================================================= */

async function loadTransactions(user) {

    const { data, error } =
        await supabaseClient
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("date", {
                ascending: false
            })
            .order("created_at", {
                ascending: false
            });

    if (error) {

        transactions = [];

        const box =
            document.getElementById("transactions");

        if (box) {
            box.innerHTML = `
                <div class="empty">
                    Não foi possível carregar
                    as movimentações.
                </div>
            `;
        }

        return;
    }

    transactions = data || [];

    render();
}


/* =========================================================
   SEGURANÇA HTML
========================================================= */

function escapeHtml(value) {

    return String(value).replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );
}


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function render() {

    /* =====================================================
       CALCULA ENTRADAS
    ===================================================== */

    const income =
        transactions
            .filter(
                t => t.type === "income"
            )
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            );


    /* =====================================================
       CALCULA GASTOS
    ===================================================== */

    const expense =
        transactions
            .filter(
                t => t.type === "expense"
            )
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            );


    /* =====================================================
       SALDO
    ===================================================== */

    const balance =
        income - expense;


    /* =====================================================
       ATUALIZA RESUMO
    ===================================================== */

    const balanceElement =
        document.getElementById("balance");

    const incomeElement =
        document.getElementById("income");

    const expenseElement =
        document.getElementById("expense");

    if (balanceElement) {
        balanceElement.textContent =
            formatMoney(balance);
    }

    if (incomeElement) {
        incomeElement.textContent =
            formatMoney(income);
    }

    if (expenseElement) {
        expenseElement.textContent =
            formatMoney(expense);
    }


    /* =====================================================
       MOVIMENTAÇÕES
    ===================================================== */

    const box =
        document.getElementById("transactions");

    if (box) {

        const selectedFilter =
            filter?.value || "all";

        const visible =
            selectedFilter === "all"
                ? transactions
                : transactions.filter(
                    t =>
                        t.type === selectedFilter
                );


        if (!visible.length) {

            box.innerHTML = `
                <div class="empty">
                    Nenhuma movimentação por aqui.
                </div>
            `;

        } else {

            box.innerHTML =
                visible
                    .map(transaction => {

                        return `
                            <div class="transaction">

                                <div
                                    class="transaction-icon ${transaction.type}"
                                >
                                    ${
                                        transaction.type === "income"
                                            ? "↑"
                                            : "↓"
                                    }
                                </div>


                                <div class="transaction-main">

                                    <strong>
                                        ${escapeHtml(
                                            transaction.description
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            transaction.category ||
                                            "Outros"
                                        )}

                                        ·

                                        ${formatDate(
                                            transaction.date
                                        )}
                                    </span>

                                </div>


                                <strong
                                    class="transaction-value ${transaction.type}"
                                >
                                    ${
                                        transaction.type === "income"
                                            ? "+"
                                            : "-"
                                    }

                                    ${formatMoney(
                                        transaction.amount
                                    )}
                                </strong>


                                <button
                                    class="delete-btn"
                                    data-id="${transaction.id}"
                                    type="button"
                                >
                                    ×
                                </button>

                            </div>
                        `;
                    })
                    .join("");
        }


        /* =================================================
           BOTÕES DE EXCLUIR
        ================================================= */

        document
            .querySelectorAll(".delete-btn")
            .forEach(button => {

                button.onclick = () => {

                    deleteTransaction(
                        button.dataset.id
                    );
                };
            });
    }


    /* =====================================================
       INSIGHT DA VISÃO GERAL
    ===================================================== */

    const title =
        document.getElementById(
            "insightTitle"
        );

    const text =
        document.getElementById(
            "insightText"
        );

    if (title && text) {

        if (!transactions.length) {

            title.textContent =
                "Comece registrando.";

            text.textContent =
                "Adicione sua primeira movimentação para começar a enxergar seu dinheiro com mais clareza.";

        } else if (balance > 0) {

            title.textContent =
                "Você está no positivo.";

            text.textContent =
                "Até agora, suas entradas superam seus gastos. Continue acompanhando para manter esse equilíbrio.";

        } else if (balance < 0) {

            title.textContent =
                "Hora de olhar os gastos.";

            text.textContent =
                "Seus gastos estão acima das entradas registradas. Use as movimentações para entender onde ajustar.";

        } else {

            title.textContent =
                "Tudo alinhado.";

            text.textContent =
                "Suas entradas e gastos registrados estão equilibrados neste momento.";
        }
    }


    /* =====================================================
       CATEGORIAS
    ===================================================== */

    renderCategories();


    /* =====================================================
       GRÁFICO DE CATEGORIAS
    ===================================================== */

    renderCategoryChart();


    /* =====================================================
       RELATÓRIOS
    ===================================================== */

    renderReports();
}


/* =========================================================
   CATEGORIAS
========================================================= */

function renderCategories() {

    const categoriesList =
        document.getElementById(
            "categoriesList"
        );

    if (!categoriesList) {
        return;
    }


    /* =====================================================
       SOMENTE DESPESAS
    ===================================================== */

    const expenses =
        transactions.filter(
            transaction =>
                transaction.type === "expense"
        );


    if (!expenses.length) {

        categoriesList.innerHTML = `
            <div class="empty">
                Nenhuma despesa cadastrada ainda.
            </div>
        `;

        return;
    }


    /* =====================================================
       SOMA POR CATEGORIA
    ===================================================== */

    const categories = {};

    expenses.forEach(transaction => {

        const category =
            transaction.category ||
            "Outros";

        const amount =
            Number(transaction.amount) || 0;

        if (!categories[category]) {
            categories[category] = 0;
        }

        categories[category] += amount;
    });


    /* =====================================================
       TOTAL
    ===================================================== */

    const totalExpenses =
        expenses.reduce(
            (sum, transaction) =>
                sum +
                Number(
                    transaction.amount || 0
                ),
            0
        );


    /* =====================================================
       ORDENA
    ===================================================== */

    const sortedCategories =
        Object.entries(categories)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    /* =====================================================
       CARDS
    ===================================================== */

    categoriesList.innerHTML =
        sortedCategories
            .map(
                ([category, amount]) => {

                    const percentage =
                        totalExpenses > 0
                            ? (
                                amount /
                                totalExpenses
                            ) * 100
                            : 0;

                    return `
                        <div class="category-card">

                            <div class="category-top">

                                <div>

                                    <span
                                        class="category-name"
                                    >
                                        ${escapeHtml(
                                            category
                                        )}
                                    </span>

                                    <small>
                                        ${percentage.toFixed(1)}%
                                        dos gastos
                                    </small>

                                </div>

                                <strong
                                    class="category-value"
                                >
                                    ${formatMoney(
                                        amount
                                    )}
                                </strong>

                            </div>


                            <div class="category-bar">

                                <div
                                    class="category-bar-fill"
                                    style="width: ${percentage}%"
                                ></div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   GRÁFICO DE GASTOS POR CATEGORIA
========================================================= */

function renderCategoryChart() {

    const donut =
        document.getElementById(
            "categoryDonut"
        );

    const legend =
        document.getElementById(
            "categoryLegend"
        );

    const totalElement =
        document.getElementById(
            "categoryDonutTotal"
        );


    /* =====================================================
       CONFERE SE O HTML EXISTE
    ===================================================== */

    if (
        !donut ||
        !legend ||
        !totalElement
    ) {
        return;
    }


    /* =====================================================
       PEGA SOMENTE GASTOS
    ===================================================== */

    const expenses =
        transactions.filter(
            transaction =>
                transaction.type === "expense"
        );


    /* =====================================================
       SOMA POR CATEGORIA
    ===================================================== */

    const categoryTotals = {};

    expenses.forEach(transaction => {

        const category =
            transaction.category ||
            "Outros";

        const amount =
            Number(transaction.amount) || 0;

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += amount;
    });


    /* =====================================================
       ORDENA
    ===================================================== */

    const categories =
        Object.entries(categoryTotals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    /* =====================================================
       TOTAL
    ===================================================== */

    const total =
        categories.reduce(
            (sum, [, value]) =>
                sum + value,
            0
        );


    totalElement.textContent =
        formatMoney(total);


    /* =====================================================
       SEM DADOS
    ===================================================== */

    if (
        !categories.length ||
        total <= 0
    ) {

        donut.style.background =
            "conic-gradient(#1E293B 0deg 360deg)";

        legend.innerHTML = `
            <div class="empty">
                Nenhum gasto registrado ainda.
            </div>
        `;

        return;
    }


    /* =====================================================
       CORES DO GRÁFICO
    ===================================================== */

    const colors = [
        "#2563EB",
        "#8B5CF6",
        "#F59E0B",
        "#06B6D4",
        "#EF4444",
        "#EC4899",
        "#6366F1",
        "#A78BFA"
    ];


    /* =====================================================
       MONTA SEGMENTOS
    ===================================================== */

    let currentDegree = 0;

    const segments = [];


    categories.forEach(
        ([category, value], index) => {

            const degrees =
                (value / total) * 360;

            const start =
                currentDegree;

            const end =
                currentDegree + degrees;

            const color =
                colors[
                    index % colors.length
                ];


            segments.push(
                `${color} ${start}deg ${end}deg`
            );


            currentDegree = end;
        }
    );


    /* =====================================================
       APLICA GRÁFICO
    ===================================================== */

    donut.style.background =
        `conic-gradient(${segments.join(", ")})`;


    /* =====================================================
       LEGENDA
    ===================================================== */

    legend.innerHTML =
        categories
            .map(
                ([category, value], index) => {

                    const percentage =
                        (value / total) * 100;

                    const color =
                        colors[
                            index % colors.length
                        ];


                    return `
                        <div
                            class="category-legend-item"
                        >

                            <span
                                class="category-legend-dot"
                                style="background:${color}"
                            ></span>


                            <span
                                class="category-legend-name"
                            >
                                ${escapeHtml(
                                    category
                                )}
                            </span>


                            <span
                                class="category-legend-value"
                            >
                                ${formatMoney(
                                    value
                                )}
                            </span>


                            <span
                                class="category-legend-percent"
                            >
                                ${percentage.toFixed(1)}%
                            </span>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   DATAS DOS RELATÓRIOS
========================================================= */

function getLocalTransactionDate(value) {

    if (!value) {
        return null;
    }

    const parts =
        String(value)
            .split("-")
            .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(Number.isNaN)
    ) {
        return null;
    }

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


/* =========================================================
   RELATÓRIOS
========================================================= */

function renderReports() {

    const monthlyReport =
        document.getElementById(
            "monthlyReport"
        );

    if (!monthlyReport) {
        return;
    }


    /* =====================================================
       PERÍODO
    ===================================================== */

    const periodSelect =
        document.getElementById(
            "reportPeriod"
        );

    const monthsCount =
        Number(
            periodSelect?.value || 6
        );


    const now = new Date();

    const months = [];


    /* =====================================================
       MONTA MESES
    ===================================================== */

    for (
        let i = monthsCount - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

        months.push({

            year:
                date.getFullYear(),

            month:
                date.getMonth(),

            label:
                date
                    .toLocaleDateString(
                        "pt-BR",
                        {
                            month: "short"
                        }
                    )
                    .replace(
                        ".",
                        ""
                    )
        });
    }


    /* =====================================================
       CALCULA CADA MÊS
    ===================================================== */

    const reportData =
        months.map(item => {

            let income = 0;
            let expense = 0;


            transactions.forEach(
                transaction => {

                    const date =
                        getLocalTransactionDate(
                            transaction.date
                        );

                    if (!date) {
                        return;
                    }


                    if (
                        date.getFullYear() !==
                            item.year ||

                        date.getMonth() !==
                            item.month
                    ) {
                        return;
                    }


                    const amount =
                        Number(
                            transaction.amount
                        ) || 0;


                    if (
                        transaction.type ===
                        "income"
                    ) {
                        income += amount;
                    }


                    if (
                        transaction.type ===
                        "expense"
                    ) {
                        expense += amount;
                    }
                }
            );


            return {

                ...item,

                income,

                expense
            };
        });


    /* =====================================================
       TOTAIS
    ===================================================== */

    const totalIncome =
        reportData.reduce(
            (sum, item) =>
                sum + item.income,
            0
        );


    const totalExpense =
        reportData.reduce(
            (sum, item) =>
                sum + item.expense,
            0
        );


    const totalBalance =
        totalIncome -
        totalExpense;


    /* =====================================================
       CARDS DOS RELATÓRIOS
    ===================================================== */

    const reportIncome =
        document.getElementById(
            "reportIncome"
        );

    const reportExpense =
        document.getElementById(
            "reportExpense"
        );

    const reportBalance =
        document.getElementById(
            "reportBalance"
        );


    if (reportIncome) {

        reportIncome.textContent =
            formatMoney(
                totalIncome
            );
    }


    if (reportExpense) {

        reportExpense.textContent =
            formatMoney(
                totalExpense
            );
    }


    if (reportBalance) {

        reportBalance.textContent =
            formatMoney(
                totalBalance
            );
    }


    /* =====================================================
       MAIOR GASTO
    ===================================================== */

    const largestExpense =
        transactions

            .filter(
                transaction =>
                    transaction.type ===
                    "expense"
            )

            .map(transaction => {

                const date =
                    getLocalTransactionDate(
                        transaction.date
                    );

                if (!date) {
                    return null;
                }


                const insidePeriod =
                    reportData.some(
                        item =>
                            item.year ===
                                date.getFullYear() &&

                            item.month ===
                                date.getMonth()
                    );


                if (!insidePeriod) {
                    return null;
                }


                return (
                    Number(
                        transaction.amount
                    ) || 0
                );
            })

            .filter(
                value =>
                    value !== null
            )

            .reduce(
                (max, value) =>
                    Math.max(
                        max,
                        value
                    ),
                0
            );


    /* =====================================================
       MÊS COM MAIS GASTOS
    ===================================================== */

    const biggestMonth =
        reportData.reduce(
            (best, item) =>
                item.expense >
                (best?.expense || 0)
                    ? item
                    : best,
            null
        );


    const reportLargestExpense =
        document.getElementById(
            "reportLargestExpense"
        );

    const reportBestExpenseMonth =
        document.getElementById(
            "reportBestExpenseMonth"
        );


    if (reportLargestExpense) {

        reportLargestExpense.textContent =
            formatMoney(
                largestExpense
            );
    }


    if (reportBestExpenseMonth) {

        reportBestExpenseMonth.textContent =

            biggestMonth &&
            biggestMonth.expense > 0

                ? `${biggestMonth.label} · ${formatMoney(
                    biggestMonth.expense
                )}`

                : "—";
    }


    /* =====================================================
       INSIGHT DO RELATÓRIO
    ===================================================== */

    const insightTitle =
        document.getElementById(
            "reportInsightTitle"
        );

    const insightText =
        document.getElementById(
            "reportInsightText"
        );


    if (
        insightTitle &&
        insightText
    ) {

        if (!transactions.length) {

            insightTitle.textContent =
                "Comece registrando.";

            insightText.textContent =
                "Ainda não existem movimentações suficientes para gerar uma análise. Adicione entradas e gastos para acompanhar sua evolução.";

        } else if (
            totalBalance > 0
        ) {

            insightTitle.textContent =
                "Período positivo.";

            insightText.textContent =
                `Neste período, suas entradas superaram seus gastos em ${formatMoney(
                    totalBalance
                )}.`;

        } else if (
            totalBalance < 0
        ) {

            insightTitle.textContent =
                "Atenção aos gastos.";

            insightText.textContent =
                `Neste período, seus gastos ficaram ${formatMoney(
                    Math.abs(totalBalance)
                )} acima das entradas.`;

        } else {

            insightTitle.textContent =
                "Tudo equilibrado.";

            insightText.textContent =
                "As entradas e os gastos do período ficaram no mesmo valor.";
        }
    }


    /* =====================================================
       MAIOR VALOR DO GRÁFICO
    ===================================================== */

    const maxValue =
        Math.max(
            ...reportData.flatMap(
                item => [
                    item.income,
                    item.expense
                ]
            ),
            1
        );


    /* =====================================================
       GRÁFICO MENSAL
    ===================================================== */

    monthlyReport.innerHTML =
        reportData
            .map(item => {

                const incomeWidth =
                    (
                        item.income /
                        maxValue
                    ) * 100;


                const expenseWidth =
                    (
                        item.expense /
                        maxValue
                    ) * 100;


                return `
                    <div class="report-month">

                        <div
                            class="report-month-label"
                        >
                            ${escapeHtml(
                                item.label
                            )}
                        </div>


                        <div class="report-bars">

                            <div
                                class="report-bar-row"
                            >

                                <span
                                    class="report-bar-name"
                                >
                                    Entrada
                                </span>


                                <div
                                    class="report-track"
                                >

                                    <div
                                        class="report-fill income"
                                        style="width: ${incomeWidth}%"
                                    ></div>

                                </div>


                                <span
                                    class="report-bar-value"
                                >
                                    ${formatMoney(
                                        item.income
                                    )}
                                </span>

                            </div>


                            <div
                                class="report-bar-row"
                            >

                                <span
                                    class="report-bar-name"
                                >
                                    Gasto
                                </span>


                                <div
                                    class="report-track"
                                >

                                    <div
                                        class="report-fill expense"
                                        style="width: ${expenseWidth}%"
                                    ></div>

                                </div>


                                <span
                                    class="report-bar-value"
                                >
                                    ${formatMoney(
                                        item.expense
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   FILTRO DOS RELATÓRIOS
========================================================= */

const reportPeriod =
    document.getElementById(
        "reportPeriod"
    );

if (reportPeriod) {

    reportPeriod.addEventListener(
        "change",
        renderReports
    );
}


/* =========================================================
   EXCLUIR MOVIMENTAÇÃO
========================================================= */

async function deleteTransaction(id) {

    const confirmed =
        confirm(
            "Excluir esta movimentação?"
        );

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("transactions")
            .delete()
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;
    }


    transactions =
        transactions.filter(
            transaction =>
                transaction.id !== id
        );


    render();
}


/* =========================================================
   ABRIR MODAL
========================================================= */

/* ABRIR MODAL */

function abrirModal() {

    const date =
        document.getElementById("date");

    if (date) {

        date.value =
            new Date()
                .toISOString()
                .slice(0, 10);
    }

    if (modal) {

        modal.classList.remove("hidden");
    }
}


/* BOTÃO DA VISÃO GERAL */

const openModal =
    document.getElementById("openModal");

if (openModal) {

    openModal.addEventListener(
        "click",
        abrirModal
    );
}


/* BOTÃO DE MOVIMENTAÇÕES */

const openModalMovimentacoes =
    document.getElementById(
        "openModalMovimentacoes"
    );

if (openModalMovimentacoes) {

    openModalMovimentacoes.addEventListener(
        "click",
        abrirModal
    );
}


/* =========================================================
   FECHAR MODAL
========================================================= */

const closeModal =
    document.getElementById(
        "closeModal"
    );

if (closeModal) {

    closeModal.onclick = () => {

        if (modal) {

            modal.classList.add(
                "hidden"
            );
        }
    };
}


/* =========================================================
   FECHAR CLICANDO FORA
========================================================= */

if (modal) {

    modal.onclick = event => {

        if (
            event.target === modal
        ) {

            modal.classList.add(
                "hidden"
            );
        }
    };
}


/* =========================================================
   FILTRO DE MOVIMENTAÇÕES
========================================================= */

if (filter) {

    filter.onchange =
        render;
}


/* =========================================================
   SALVAR MOVIMENTAÇÃO
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const user =
                await requireUser();


            if (!user) {
                return;
            }


            showFormMessage(
                "Salvando...",
                "info"
            );


            /* =============================================
               VALORES DO FORMULÁRIO
            ============================================= */

            const description =
                document
                    .getElementById(
                        "description"
                    )
                    .value
                    .trim();


            const amount =
                Number(
                    document
                        .getElementById(
                            "amount"
                        )
                        .value
                );


            const type =
                document
                    .querySelector(
                        'input[name="type"]:checked'
                    )
                    .value;


            const category =
                document
                    .getElementById(
                        "category"
                    )
                    .value;


            const date =
                document
                    .getElementById(
                        "date"
                    )
                    .value;


            /* =============================================
               VALIDAÇÃO
            ============================================= */

            if (
                !description ||
                !amount ||
                amount <= 0 ||
                !category ||
                !date
            ) {

                showFormMessage(
                    "Preencha todos os campos corretamente.",
                    "error"
                );

                return;
            }


            /* =============================================
               PAYLOAD
            ============================================= */

            const payload = {

                user_id:
                    user.id,

                description:
                    description,

                amount:
                    amount,

                type:
                    type,

                category:
                    category,

                date:
                    date
            };


            /* =============================================
               SALVA NO SUPABASE
            ============================================= */

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("transactions")
                    .insert(payload)
                    .select()
                    .single();


            if (error) {

                showFormMessage(
                    error.message,
                    "error"
                );

                return;
            }


            /* =============================================
               ATUALIZA
            ============================================= */

            transactions.unshift(
                data
            );


            render();


            /* =============================================
               LIMPA FORMULÁRIO
            ============================================= */

            form.reset();


            const dateInput =
                document.getElementById(
                    "date"
                );


            if (dateInput) {

                dateInput.value =
                    new Date()
                        .toISOString()
                        .slice(0, 10);
            }


            showFormMessage(
                "Movimentação salva.",
                "success"
            );


            /* =============================================
               FECHA MODAL
            ============================================= */

            setTimeout(() => {

                if (modal) {

                    modal.classList.add(
                        "hidden"
                    );
                }

            }, 500);

        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

    logoutBtn.onclick =
        async () => {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "index.html";
        };
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

(async () => {

    const user =
        await requireUser();


    if (!user) {
        return;
    }


    await loadProfile(
        user
    );


    await loadTransactions(
        user
    );


    const date =
        document.getElementById(
            "date"
        );


    if (date) {

        date.value =
            new Date()
                .toISOString()
                .slice(0, 10);
    }

})();