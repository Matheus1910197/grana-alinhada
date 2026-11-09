// ==============================
// ELEMENTOS
// ==============================

const tabs = document.querySelectorAll(".tab");
const formViews = document.querySelectorAll(".form-view");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotPassword = document.getElementById("forgotPassword");
const authMessage = document.getElementById("authMessage");


// ==============================
// MENSAGENS
// ==============================

function showAuthMessage(text = "", type = "") {
    if (!authMessage) return;

    authMessage.textContent = text;
    authMessage.className = type
        ? `message ${type}`
        : "message";
}


function getSupabaseErrorMessage(error, context = "login") {
    const message = String(error?.message || "").toLowerCase();
    const code = String(error?.code || "").toLowerCase();

    // Falha de conexão (internet, projeto pausado, URL errada)
    if (
        message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("load failed")
    ) {
        return "Não foi possível conectar ao servidor. Verifique sua internet e se o projeto do Supabase está ativo (não pausado).";
    }

    if (message.includes("invalid login credentials")) {
        return "E-mail ou senha incorretos.";
    }

    if (message.includes("email not confirmed")) {
        return "Seu e-mail ainda não foi confirmado. Procure o e-mail de confirmação na sua caixa de entrada (e no spam).";
    }

    if (
        message.includes("user already registered") ||
        code === "user_already_exists" ||
        code === "email_exists"
    ) {
        return "Este e-mail já possui uma conta. Tente entrar.";
    }

    if (
        message.includes("password should be at least") ||
        code === "weak_password"
    ) {
        return "A senha precisa ter pelo menos 6 caracteres.";
    }

    // Limite de envio de e-mails do Supabase (plano gratuito)
    if (
        message.includes("rate limit") ||
        code === "over_email_send_rate_limit" ||
        code === "over_request_rate_limit"
    ) {
        return "Limite de e-mails do Supabase atingido. Aguarde cerca de 1 hora e tente de novo (ou desative a confirmação de e-mail / configure um SMTP próprio no painel do Supabase).";
    }

    if (
        message.includes("error sending") ||
        (code === "unexpected_failure" && message.includes("email"))
    ) {
        return "O Supabase não conseguiu enviar o e-mail de confirmação. Confira as configurações de e-mail (SMTP) no painel.";
    }

    if (
        message.includes("database error") ||
        message.includes("saving new user")
    ) {
        return "Erro no banco de dados ao criar o usuário. Rode o arquivo supabase/fix-signup.sql no SQL Editor do Supabase.";
    }

    if (
        message.includes("signups not allowed") ||
        code === "signup_disabled"
    ) {
        return "Novos cadastros estão desativados no painel do Supabase (Authentication → Sign In / Providers).";
    }

    if (
        message.includes("invalid email") ||
        (message.includes("email address") && message.includes("invalid")) ||
        code === "email_address_invalid"
    ) {
        return "Esse e-mail não foi aceito. Verifique se foi digitado corretamente.";
    }

    // Erro desconhecido: mostra o motivo real para facilitar a correção
    const detalhe = error?.message
        ? ` (${error.message})`
        : "";

    return context === "register"
        ? `Não foi possível criar a conta.${detalhe}`
        : context === "recovery"
            ? `Não foi possível enviar o e-mail de recuperação.${detalhe}`
            : `Não foi possível entrar.${detalhe}`;
}


// ==============================
// TROCA LOGIN / CADASTRO
// ==============================

function activateTab(selectedTab) {

    tabs.forEach((tab) => {

        const active = tab.dataset.tab === selectedTab;

        tab.classList.toggle("active", active);

        tab.setAttribute(
            "aria-selected",
            active ? "true" : "false"
        );
    });


    formViews.forEach((form) => {

        form.classList.toggle(
            "active",
            form.id === `${selectedTab}-form`
        );
    });


    showAuthMessage("");
}


tabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        activateTab(tab.dataset.tab);

    });

});


// ==============================
// MOSTRAR / OCULTAR SENHA
// ==============================

document
    .querySelectorAll(".password-toggle")
    .forEach((button) => {

        button.addEventListener("click", () => {

            const targetId = button.dataset.target;

            const input =
                document.getElementById(targetId);

            if (!input) return;

            const showing =
                input.type === "text";

            input.type =
                showing ? "password" : "text";

            button.textContent =
                showing ? "Mostrar" : "Ocultar";

            button.setAttribute(
                "aria-label",
                showing
                    ? "Mostrar senha"
                    : "Ocultar senha"
            );
        });

    });


// ==============================
// LOGIN
// ==============================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const button =
                loginForm.querySelector(
                    "button[type='submit']"
                );


            const emailInput =
                document.getElementById(
                    "loginEmail"
                );


            const passwordInput =
                document.getElementById(
                    "loginPassword"
                );


            const email =
                emailInput.value.trim();


            const password =
                passwordInput.value;


            // Validação básica

            if (!email || !password) {

                showAuthMessage(
                    "Preencha seu e-mail e sua senha.",
                    "warning"
                );

                return;
            }


            if (!emailInput.checkValidity()) {

                showAuthMessage(
                    "Digite um e-mail válido.",
                    "warning"
                );

                emailInput.focus();

                return;
            }


            const originalText =
                button.innerHTML;


            button.disabled = true;


            button.innerHTML = `
                <span>Entrando...</span>
                <span class="button-arrow">•••</span>
            `;


            showAuthMessage(
                "Verificando seus dados...",
                "info"
            );


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({

                            email,
                            password

                        });


                if (error) {
                    throw error;
                }


                if (!data?.session) {

                    throw new Error(
                        "Sessão não criada."
                    );
                }


                showAuthMessage(
                    "Login realizado. Abrindo seu painel...",
                    "success"
                );


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Erro no login:",
                    error
                );


                showAuthMessage(
                    getSupabaseErrorMessage(
                        error,
                        "login"
                    ),
                    "error"
                );


            } finally {

                button.disabled = false;

                button.innerHTML =
                    originalText;
            }

        }
    );

}


// ==============================
// CADASTRO
// ==============================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const button =
                registerForm.querySelector(
                    "button[type='submit']"
                );


            const nameInput =
                document.getElementById(
                    "registerName"
                );


            const emailInput =
                document.getElementById(
                    "registerEmail"
                );


            const passwordInput =
                document.getElementById(
                    "registerPassword"
                );


            const name =
                nameInput.value.trim();


            const email =
                emailInput.value.trim();


            const password =
                passwordInput.value;


            // Validação

            if (!name || !email || !password) {

                showAuthMessage(
                    "Preencha todos os campos.",
                    "warning"
                );

                return;
            }


            if (name.length < 2) {

                showAuthMessage(
                    "Digite um nome válido.",
                    "warning"
                );

                nameInput.focus();

                return;
            }


            if (!emailInput.checkValidity()) {

                showAuthMessage(
                    "Digite um e-mail válido.",
                    "warning"
                );

                emailInput.focus();

                return;
            }


            if (password.length < 6) {

                showAuthMessage(
                    "A senha precisa ter pelo menos 6 caracteres.",
                    "warning"
                );

                passwordInput.focus();

                return;
            }


            const originalText =
                button.innerHTML;


            button.disabled = true;


            button.innerHTML = `
                <span>Criando conta...</span>
                <span class="button-arrow">•••</span>
            `;


            showAuthMessage(
                "Criando sua conta...",
                "info"
            );


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signUp({

                            email,
                            password,

                            options: {

                                // Link do e-mail de confirmação volta
                                // para o endereço atual do site
                                // (só funciona com o site aberto por
                                // http/https, ex.: Live Server)
                                ...(window.location.protocol.startsWith("http")
                                    ? {
                                        emailRedirectTo:
                                            `${window.location.origin}/login.html`
                                    }
                                    : {}),

                                data: {
                                    full_name: name
                                }

                            }

                        });


                if (error) {
                    throw error;
                }


                console.log(
                    "Cadastro realizado:",
                    data
                );


                // E-mail JÁ CADASTRADO: com a confirmação de e-mail
                // ligada, o Supabase não devolve erro (proteção contra
                // descoberta de e-mails). Ele devolve um usuário com a
                // lista "identities" vazia.

                if (
                    data.user &&
                    Array.isArray(data.user.identities) &&
                    data.user.identities.length === 0
                ) {

                    activateTab("login");

                    const loginEmail =
                        document.getElementById("loginEmail");

                    if (loginEmail) {
                        loginEmail.value = email;
                    }

                    showAuthMessage(
                        "Este e-mail já possui uma conta. Tente entrar ou use \"Esqueci minha senha\".",
                        "warning"
                    );

                    return;
                }


                // Caso o Supabase exija confirmação
                // de e-mail

                if (
                    data.user &&
                    !data.session
                ) {

                    showAuthMessage(
                        "Conta criada! Verifique seu e-mail para confirmar a conta e depois faça o login.",
                        "success"
                    );


                    registerForm.reset();


                } else {

                    showAuthMessage(
                        "Conta criada com sucesso! Abrindo seu painel...",
                        "success"
                    );


                    setTimeout(() => {

                        window.location.href =
                            "dashboard.html";

                    }, 700);

                }


            } catch (error) {

                console.error(
                    "Erro no cadastro:",
                    error
                );


                showAuthMessage(
                    getSupabaseErrorMessage(
                        error,
                        "register"
                    ),
                    "error"
                );


            } finally {

                button.disabled = false;

                button.innerHTML =
                    originalText;
            }

        }
    );

}


// ==============================
// ESQUECI MINHA SENHA
// ==============================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "loginEmail"
                );


            const email =
                emailInput.value.trim();


            if (!email) {

                showAuthMessage(
                    "Digite seu e-mail primeiro para receber o link de recuperação.",
                    "warning"
                );

                emailInput.focus();

                return;
            }


            if (!emailInput.checkValidity()) {

                showAuthMessage(
                    "Digite um e-mail válido.",
                    "warning"
                );

                emailInput.focus();

                return;
            }


            forgotPassword.style.pointerEvents =
                "none";


            forgotPassword.style.opacity =
                "0.6";


            showAuthMessage(
                "Enviando e-mail de recuperação...",
                "info"
            );


            try {

                /*
                 * Usa automaticamente o endereço
                 * atual do site.
                 *
                 * No Live Server:
                 * http://127.0.0.1:5500/reset-password.html
                 *
                 * Quando publicar:
                 * https://seusite.com/reset-password.html
                 */

                const options =
                    window.location.protocol.startsWith("http")
                        ? {
                            redirectTo:
                                `${window.location.origin}/reset-password.html`
                        }
                        : {};


                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .resetPasswordForEmail(

                            email,

                            options

                        );


                if (error) {
                    throw error;
                }


                showAuthMessage(
                    "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Erro ao enviar recuperação:",
                    error
                );


                showAuthMessage(
                    getSupabaseErrorMessage(
                        error,
                        "recovery"
                    ),
                    "error"
                );


            } finally {

                forgotPassword.style.pointerEvents =
                    "";


                forgotPassword.style.opacity =
                    "";

            }

        }
    );

}


// ==============================
// VERIFICAR SESSÃO
// ==============================

async function verificarSessao() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Erro ao verificar sessão:",
            error
        );

        return;
    }


    if (data.session) {

        console.log(
            "Usuário já está logado."
        );

    }

}


verificarSessao();