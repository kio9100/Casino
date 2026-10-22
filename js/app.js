
(() => {
  function iniciarSk7() {
    // Abrir las ventanas de registro e inicio de sesión
    document.querySelectorAll("[data-open-auth]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-open-auth");

        if (typeof window.setSk7AuthMode === "function") {
          window.setSk7AuthMode(mode);
        } else {
          console.error("No se ha cargado correctamente js/auth.js");
          alert("El sistema de acceso no está listo. Recarga la página.");
        }
      });
    });

    // Cerrar la ventana de acceso
    document.querySelectorAll("[data-close-auth]").forEach((button) => {
      button.addEventListener("click", () => {
        document.getElementById("authModal")?.classList.add("hidden");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarSk7);
  } else {
    iniciarSk7();
  }
})();
