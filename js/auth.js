
(() => {
  function iniciarSk7Auth() {
    const client = window.sk7Supabase;

    if (!client || !client.auth) {
      console.error(
        "SK7: Supabase no está disponible. Revisa js/supabase.js y la carga de la librería."
      );

      const message = document.getElementById("authMessage");
      if (message) {
        message.textContent =
          "No se pudo conectar con el servicio. Recarga la página e inténtalo de nuevo.";
        message.style.color = "#ff9b9b";
      }
      return;
    }

    const modal = document.getElementById("authModal");
    const form = document.getElementById("authForm");
    const usernameInput = document.getElementById("authUsername");
    const usernameField = document.getElementById("usernameField");
    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const title = document.getElementById("authTitle");
    const description = document.getElementById("authDescription");
    const submit = document.getElementById("authSubmit");
    const message = document.getElementById("authMessage");
    const switchText = document.getElementById("switchText");
    const switchButton = document.getElementById("switchAuthBtn");
    const guestActions = document.getElementById("guestActions");
    const userActions = document.getElementById("userActions");
    const accountPanel = document.getElementById("accountPanel");
    const logoutButton = document.getElementById("logoutBtn");

    let mode = "register";

    function showMessage(text, error = false) {
      if (!message) return;

      message.textContent = text;
      message.style.color = error ? "#ff9b9b" : "#f1d995";
    }

    window.setSk7AuthMode = function (nextMode) {
      mode = nextMode === "login" ? "login" : "register";

      title.textContent =
        mode === "register" ? "Crea tu cuenta" : "Inicia sesión";

      description.textContent =
        mode === "register"
          ? "Elige un nombre de usuario para tu perfil de Sk7."
          : "Ingresa con el correo y la contraseña de tu cuenta.";

      submit.textContent =
        mode === "register" ? "Crear cuenta" : "Iniciar sesión";

      passwordInput.autocomplete =
        mode === "register" ? "new-password" : "current-password";

      usernameField.classList.toggle("hidden", mode !== "register");
      usernameInput.required = mode === "register";

      switchText.textContent =
        mode === "register"
          ? "¿Ya tienes cuenta?"
          : "¿Aún no tienes cuenta?";

      switchButton.textContent =
        mode === "register" ? "Inicia sesión" : "Regístrate";

      showMessage("");
      modal.classList.remove("hidden");
    };

    switchButton.addEventListener("click", () => {
      window.setSk7AuthMode(
        mode === "register" ? "login" : "register"
      );
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const username = usernameInput.value.trim();

      if (
        mode === "register" &&
        !/^[A-Za-z0-9_]{3,20}$/.test(username)
      ) {
        showMessage(
          "El nombre debe tener entre 3 y 20 caracteres: letras, números o guion bajo.",
          true
        );
        usernameInput.focus();
        return;
      }

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
              data: {
                username: username
              },
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
            "Registro enviado. Revisa tu correo para confirmar la cuenta."
          );
          form.reset();
          return;
        }

        form.reset();

        if (result.data.session) {
          modal.classList.add("hidden");
          showMessage("¡Bienvenido a Sk7!");

          renderSession(result.data.session.user);
        }
      } catch (error) {
        console.error("Error de autenticación:", error);

        let text = error.message || "No se pudo completar la operación.";

        if (text.toLowerCase().includes("invalid login credentials")) {
          text = "Correo o contraseña incorrectos.";
        } else if (text.toLowerCase().includes("user already registered")) {
          text = "Este correo ya está registrado. Intenta iniciar sesión.";
        } else if (text.toLowerCase().includes("password")) {
          text = "Revisa la contraseña. Debe cumplir los requisitos de seguridad.";
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

      const username =
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "Jugador";

      emailLabel.textContent = username;

      const { data, error } = await client
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error al consultar el perfil:", error);
        accountMessage.textContent =
          "Sesión activa, pero no se pudo consultar el saldo. Revisa las políticas de Supabase.";
        return;
      }

      if (!data) {
        accountMessage.textContent =
          "No se encontró el perfil. Revisa el trigger de creación de perfiles en Supabase.";
        return;
      }

      const formatted = Number(data.balance).toLocaleString("es-CO");

      profileBalance.textContent = formatted;
      headerBalance.textContent = formatted;

      accountMessage.textContent =
        "¡Hola, " + username +
        "! Tu perfil está conectado. Tus fichas son ficticias y no tienen valor monetario.";
    }

    function renderSession(user) {
      guestActions.classList.toggle("hidden", Boolean(user));
      userActions.classList.toggle("hidden", !user);
      accountPanel.classList.toggle("hidden", !user);

      if (user) {
        loadProfile(user).catch((error) => {
          console.error("No se pudo cargar el perfil:", error);
        });
      }
    }

    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;

      try {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error("Error al cerrar sesión:", error);

        document.getElementById("accountMessage").textContent =
          "No se pudo cerrar la sesión. Inténtalo de nuevo.";
      } finally {
        logoutButton.disabled = false;
      }
    });

    client.auth.onAuthStateChange((_event, session) => {
      renderSession(session?.user ?? null);
    });

    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("No se pudo recuperar la sesión:", error);
        return;
      }

      renderSession(data.session?.user ?? null);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarSk7Auth);
  } else {
    iniciarSk7Auth();
  }
})();
