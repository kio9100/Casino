
(() => {
  const client = window.sk7Supabase;

  const modal = document.getElementById("authModal");
  const form = document.getElementById("authForm");
  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  const title = document.getElementById("authTitle");
  const description = document.getElementById("authDescription");
  const submit = document.getElementById("authSubmit");
  const message = document.getElementById("authMessage");
  const switchText = document.getElementById("switchText");
  const switchButton = document.getElementById("switchAuthBtn");

  let mode = "register";

  function showMessage(text, error = false) {
    message.textContent = text;
    message.style.color = error ? "#ff9b9b" : "#f1d995";
  }

  window.setSk7AuthMode = function (nextMode) {
    mode = nextMode === "login" ? "login" : "register";

    title.textContent = mode === "register"
      ? "Crea tu cuenta"
      : "Inicia sesión";

    description.textContent = mode === "register"
      ? "Regístrate para acceder a tu perfil de Sk7."
      : "Ingresa con el correo y la contraseña de tu cuenta.";

    submit.textContent = mode === "register"
      ? "Crear cuenta"
      : "Iniciar sesión";

    passwordInput.autocomplete = mode === "register"
      ? "new-password"
      : "current-password";

    switchText.textContent = mode === "register"
      ? "¿Ya tienes cuenta?"
      : "¿Aún no tienes cuenta?";

    switchButton.textContent = mode === "register"
      ? "Inicia sesión"
      : "Regístrate";

    showMessage("");
    modal.classList.remove("hidden");
  };

  switchButton.addEventListener("click", () => {
    window.setSk7AuthMode(mode === "register" ? "login" : "register");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submit.disabled = true;
    showMessage(
      mode === "register"
        ? "Creando tu cuenta..."
        : "Verificando tus datos..."
    );

    try {
      let result;

      if (mode === "register") {
        result = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
      } else {
        result = await client.auth.signInWithPassword({
          email,
          password
        });
      }

      if (result.error) throw result.error;

      if (mode === "register" && !result.data.session) {
        showMessage(
          "Tu registro fue enviado. Revisa tu correo y confirma la cuenta antes de iniciar sesión."
        );
        form.reset();
        return;
      }

      showMessage(
        mode === "register"
          ? "¡Cuenta creada! Cargando tu perfil..."
          : "¡Bienvenido de nuevo!"
      );

      form.reset();

      if (result.data.session) {
        modal.classList.add("hidden");
      }
    } catch (error) {
      console.error("Error de autenticación:", error);

      let text = error.message || "No se pudo completar la operación.";

      if (text.toLowerCase().includes("invalid login credentials")) {
        text = "Correo o contraseña incorrectos.";
      } else if (text.toLowerCase().includes("user already registered")) {
        text = "Este correo ya está registrado. Intenta iniciar sesión.";
      } else if (text.toLowerCase().includes("password")) {
        text = "Revisa la contraseña. Debe tener al menos 8 caracteres.";
      }

      showMessage(text, true);
    } finally {
      submit.disabled = false;
    }
  });

  async function loadProfile(user) {
    const emailLabel = document.getElementById("userEmail");
    const profileBalance = document.getElementById("profileBalance");
    const headerBalance = document.getElementById("headerBalance");
    const accountMessage = document.getElementById("accountMessage");

    emailLabel.textContent = user.email || "Usuario de Sk7";

    const { data, error } = await client
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error al consultar el perfil:", error);
      accountMessage.textContent =
        "Tu sesión está activa, pero no se pudo consultar el saldo. Revisa las políticas de la base de datos.";
      return;
    }

    if (!data) {
      accountMessage.textContent =
        "La cuenta existe, pero aún no encontramos su perfil. Revisa el trigger de creación de perfiles en Supabase.";
      return;
    }

    const formatted = Number(data.balance).toLocaleString("es-CO");
    profileBalance.textContent = formatted;
    headerBalance.textContent = formatted;
    accountMessage.textContent =
      "Tu perfil está conectado. Las fichas son ficticias y no tienen valor monetario.";
  }

  function renderSession(user) {
    const guestActions = document.getElementById("guestActions");
    const userActions = document.getElementById("userActions");
    const accountPanel = document.getElementById("accountPanel");

    guestActions.classList.toggle("hidden", Boolean(user));
    userActions.classList.toggle("hidden", !user);
    accountPanel.classList.toggle("hidden", !user);

    if (user) {
      loadProfile(user).catch((error) => {
        console.error("No se pudo cargar el perfil:", error);
      });
    }
  }

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    const button = document.getElementById("logoutBtn");
    button.disabled = true;

    const { error } = await client.auth.signOut();

    button.disabled = false;

    if (error) {
      console.error("Error al cerrar sesión:", error);
      document.getElementById("accountMessage").textContent =
        "No se pudo cerrar la sesión. Inténtalo de nuevo.";
    } else {
      document.getElementById("authMessage").textContent = "";
    }
  });

  client.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    renderSession(user);
  });
})();
