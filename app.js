/* Casa da Alma  JavaScript (Lógica Preservada + Microinterações) */

(() => {
  const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/SEU-LINK-AQUI"; // <- configure aqui

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const setYear = () => {
    const yearEl = document.getElementById("ano");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  const wireWhatsAppLinks = () => {
    const links = document.querySelectorAll("[data-wa-link]");
    links.forEach((a) => {
      if (!(a instanceof HTMLAnchorElement)) return;
      a.href = WHATSAPP_GROUP_URL;
    });
  };

  const wireSmoothScroll = () => {
    const canSmooth = !prefersReducedMotion && "scrollBehavior" in document.documentElement.style;

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href^=\"#\"]");
      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href") || "";
      if (!href || href === "#") return;

      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;

      // Deixa comportamento padrão para casos com modificadores (nova aba etc.)
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (link.target && link.target !== "_self") return;

      e.preventDefault();

      try {
        el.scrollIntoView({ behavior: canSmooth ? "smooth" : "auto", block: "start" });
      } catch {
        // Fallback bem antigo
        const top = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo(0, top);
      }

      // Atualiza hash sem "pular" (quando possível)
      if (history.pushState) history.pushState(null, "", `#${id}`);
      else window.location.hash = id;

      // Acessibilidade: move foco para a seção alvo
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    });
  };

  // Menu Mobile Drawer (Lógica mantida, estrutura nova)
  const wireMobileNav = () => {
    const toggle = document.querySelector(".nav-toggle");
    // O wrapper é usado para animação do drawer, mas o ID do menu-principal está nele para acessibilidade
    const menuWrapper = document.getElementById("menu-principal");
    const backdrop = document.querySelector(".nav-backdrop");

    if (!(toggle instanceof HTMLButtonElement) || !(menuWrapper instanceof HTMLElement)) return;

    const desktopMQ = window.matchMedia?.("(min-width: 1024px)");

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    const setBodyScrollLock = (locked) => {
      document.body.classList.toggle("is-nav-open", Boolean(locked));
    };

    const closeMenu = ({ returnFocus = true } = {}) => {
      if (!isOpen()) return;
      toggle.setAttribute("aria-expanded", "false");
      menuWrapper.classList.remove("is-open");
      setBodyScrollLock(false);

      if (returnFocus) {
        try {
          toggle.focus({ preventScroll: true });
        } catch {
          toggle.focus();
        }
      }
    };

    const openMenu = () => {
      if (isOpen()) return;
      toggle.setAttribute("aria-expanded", "true");
      menuWrapper.classList.add("is-open");
      setBodyScrollLock(true);
    };

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isOpen()) closeMenu();
      else openMenu();
    });

    // Clique no backdrop fecha
    if (backdrop instanceof HTMLElement) {
      backdrop.addEventListener("click", (e) => {
        e.preventDefault();
        closeMenu();
      });
    }

    // Clique em links do menu fecha (mantém comportamento atual)
    menuWrapper.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a");
      if (!(link instanceof HTMLAnchorElement)) return;

      if (link.classList.contains("nav-link") || link.closest(".nav-cta")) {
        closeMenu({ returnFocus: false });
      }
    });

    // Clique fora do drawer fecha (não fecha ao tocar em áreas vazias dentro do drawer)
    document.addEventListener("click", (e) => {
      if (!isOpen()) return;

      const target = e.target;
      if (!(target instanceof Node)) return;

      if (toggle.contains(target)) return;
      if (menuWrapper.contains(target)) return;

      closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Se sair do mobile (ex.: rotacionar ou redimensionar), garante que o scroll do body seja restaurado
    if (desktopMQ) {
      const onMQChange = (ev) => {
        if (ev.matches) closeMenu({ returnFocus: false });
      };

      if (typeof desktopMQ.addEventListener === "function") {
        desktopMQ.addEventListener("change", onMQChange);
      } else if (typeof desktopMQ.addListener === "function") {
        desktopMQ.addListener(onMQChange);
      }
    }
  };

  const wireAccordion = () => {
    const root = document.querySelector("[data-accordion]");
    if (!root) return;

    const items = Array.from(root.querySelectorAll(".faq-item"));

    items.forEach((item, index) => {
      const button = item.querySelector(".faq-btn");
      // Importante: classe ajustada para faq-content no HTML novo
      const panel = item.querySelector(".faq-content");

      if (!(button instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;

      const panelId = `faq-panel-${index + 1}`;
      const buttonId = `faq-btn-${index + 1}`;

      button.id = button.id || buttonId;
      panel.id = panel.id || panelId;

      button.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", button.id);

      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";

        // mantém um aberto por vez (mais limpo); ajuste aqui se quiser múltiplos
        items.forEach((other) => {
          if (other === item) return;
          const otherBtn = other.querySelector(".faq-btn");
          const otherPanel = other.querySelector(".faq-content");
          if (otherBtn instanceof HTMLButtonElement && otherPanel instanceof HTMLElement) {
            otherBtn.setAttribute("aria-expanded", "false");
            otherPanel.hidden = true;
          }
        });

        button.setAttribute("aria-expanded", expanded ? "false" : "true");
        panel.hidden = expanded;
      });
    });
  };

  const wireRevealOnScroll = () => {
    if (prefersReducedMotion) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    els.forEach((el) => io.observe(el));
  };

  setYear();
  wireWhatsAppLinks();
  wireSmoothScroll();
  wireMobileNav();
  wireAccordion();
  wireRevealOnScroll();
})();
