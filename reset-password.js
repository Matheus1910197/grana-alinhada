const resetPasswordForm =
    document.getElementById("resetPasswordForm");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const message =
    document.getElementById("message");


resetPasswordForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const password = newPassword.value;
    const confirm = confirmPassword.value;

    // Verifica se as senhas são iguais
    if (password !== confirm) {

        message.textContent =
            "As senhas não são iguais.";

        message.style.color = "#ef4444";

        return;
    }

    // Atualiza a senha no Supabase
    const { error } =
        await supabaseClient.auth.updateUser({
            password: password
        });

    if (error) {

        console.error(error);

        message.textContent =
            "Não foi possível alterar a senha.";

        message.style.color = "#ef4444";

        return;
    }

    message.textContent =
        "Senha alterada com sucesso!";

    message.style.color = "#22c55e";

    resetPasswordForm.reset();

    setTimeout(() => {

        window.location.href = "index.html";

    }, 2000);

});