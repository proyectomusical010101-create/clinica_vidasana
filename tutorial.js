/* ==========================================================================
   CLÍNICA VIDASANA - INTERACTIVE CLINICAL WORKFLOW TUTORIAL
   Comprehensive guided tour of all clinical, administrative and financial modules
   ========================================================================== */

(function () {
    "use strict";

    const TUTORIAL_STEPS = [
        {
            tab: "dashboard",
            target: "#btn-header-new-menu",
            fallbackTarget: "#card-metric-today-income",
            title: "1. Venta Directa y Nuevo Paciente ⚡",
            text: "Desde el botón superior <strong>+ Nuevo</strong> (o la <strong>Burbuja Flotante</strong> en móvil), puedes abrir <strong>Venta Directa</strong> para cobrar consultas y tratamientos rápidos de inmediato, o registrar un <strong>Nuevo Paciente</strong> con historial clínico completo.",
            position: "bottom"
        },
        {
            tab: "odontogram",
            target: "[data-tab=\"odontogram\"]",
            fallbackTarget: "#odontogram-list-container",
            title: "2. Presupuestos y Baremo de Precios 🦷",
            text: "Crea presupuestos clínicos detallados o cotizaciones rápidas con conversión automática entre <strong>USD ($)</strong> y <strong>Bolívares (Bs. BCV)</strong>. Podrás guardar borradores, aprobarlos y enviarlos a facturar con un solo clic.",
            position: "right"
        },
        {
            tab: "agenda",
            target: "[data-tab=\"agenda\"]",
            fallbackTarget: "#calendar-grid",
            title: "3. Agenda Inteligente & WhatsApp 📅",
            text: "Organiza las citas por médico y especialidad. Envía recordatorios automáticos por <strong>WhatsApp</strong> con un solo toque y presiona <strong>\"Atender\"</strong> en cuanto el paciente ingrese al consultorio.",
            position: "right"
        },
        {
            tab: "ehr",
            target: "[data-tab=\"ehr\"]",
            fallbackTarget: "#view-ehr",
            title: "4. Historias Clínicas & Descargo Kardex 🩺",
            text: "Registra evoluciones y notas médicas por consulta. Los insumos y medicamentos utilizados se descuentan automáticamente del inventario <strong>Kardex</strong>, y el médico puede firmar digitalmente en pantalla.",
            position: "right"
        },
        {
            tab: "billing",
            target: "[data-tab=\"billing\"]",
            fallbackTarget: "#view-billing",
            title: "5. Facturación & Pagos Mixtos 💳",
            text: "Emite facturas y recibos con pagos mixtos (Pago Móvil, Efectivo, Zelle, Binance o Cashea). El sistema calcula el vuelto exacto y genera el comprobante en formato membretado PDF descargable.",
            position: "right"
        },
        {
            tab: "finance",
            target: "[data-tab=\"finance\"]",
            fallbackTarget: "#subtab-daily-closing",
            title: "6. Finanzas y Cierre de Caja Diario 💰",
            text: "Lleva el control de <strong>Cuentas por Pagar</strong>, <strong>Cuentas por Cobrar</strong> y audita el <strong>Cierre de Caja Diario</strong> por departamentos clínicos (turnos Mañana y Tarde) con respaldo bancario.",
            position: "right"
        },
        {
            tab: "specialties",
            target: "[data-tab=\"specialties\"]",
            fallbackTarget: "#spec-stat-top-specialty",
            title: "7. Especialidades y Comisiones Médicas 🏆",
            text: "Monitorea la distribución de ingresos (% Médico vs % Clínica) de cada especialidad. El sistema calcula en tiempo real qué área médica lidera la facturación del centro asistencial.",
            position: "right"
        },
        {
            tab: "users",
            target: "[data-tab=\"users\"]",
            fallbackTarget: "#user-stat-top-doctor-name",
            title: "8. Rendimiento del Personal Médico 👑",
            text: "Consulta el ranking del <strong>Top Médico en Ingresos</strong>, pacientes atendidos y promedios por especialista, asegurando un control transparente del talento clínico y asistencial.",
            position: "right"
        },
        {
            tab: "dashboard",
            target: "#card-metric-today-income",
            fallbackTarget: ".stats-grid",
            title: "9. Dashboard Ejecutivo Interactivo 📊",
            text: "Tu panel de control central. Cada tarjeta es interactiva: haz clic sobre cualquier métrica para ir directamente a su detalle (Cierre Diario, Flujo de Caja, Rendimiento Médico y Especialidades).",
            position: "bottom"
        },
        {
            tab: "dashboard",
            target: "#user-profile-trigger",
            fallbackTarget: "#app-sidebar",
            title: "10. Menú Colapsable & Perfil Flotante ⚙️",
            text: "Minimiza el menú lateral con el botón superior para mayor amplitud. En la parte inferior, tu perfil abre un menú secundario flotante con <strong>Ajustes</strong>, <strong>Ayuda</strong> y <strong>Cierre de Sesión</strong>.",
            position: "right"
        }
    ];

    class ClinicalWorkflowTutorial {
        constructor() {
            this.currentStep = 0;
            this.isActive = false;
            this.overlayEl = null;
            this.spotlightEl = null;
            this.popoverEl = null;
            this.resizeHandler = this.reposition.bind(this);
        }

        init() {
            this.createDOM();
            this.bindGlobalButton();
            window.addEventListener("DOMContentLoaded", () => {
                setTimeout(() => this.checkAutoStart(), 1200);
            });
        }

        bindGlobalButton() {
            const btnTop = document.getElementById("btn-launch-tutorial");
            if (btnTop) {
                btnTop.onclick = () => this.start(0);
            }
        }

        checkAutoStart() {
            if (localStorage.getItem("dental_tutorial_viewed") === "true") {
                return;
            }

            const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
            const userKey = user ? (user.id || user.email || user.username || "user") : "default";
            
            if (localStorage.getItem("dental_tutorial_viewed_" + userKey) === "true") {
                return;
            }

            if (user && user.metadata && user.metadata.tutorialViewed === true) {
                localStorage.setItem("dental_tutorial_viewed", "true");
                localStorage.setItem("dental_tutorial_viewed_" + userKey, "true");
                return;
            }

            this.start(0);
        }

        createDOM() {
            if (document.getElementById("tutorial-root-container")) return;
            const root = document.createElement("div");
            root.id = "tutorial-root-container";
            root.className = "tutorial-root-container hidden";
            root.innerHTML = '<div class="tutorial-backdrop" id="tutorial-backdrop"></div>' +
                '<div class="tutorial-spotlight" id="tutorial-spotlight"></div>' +
                '<div class="tutorial-popover" id="tutorial-popover" role="dialog" aria-modal="true">' +
                '  <div class="tutorial-popover-header">' +
                '    <div class="tutorial-step-badge"><i class="fa-solid fa-graduation-cap text-cyan"></i> <span id="tutorial-step-counter">Paso 1 de 6</span></div>' +
                '    <button class="tutorial-btn-close" id="tutorial-btn-close" title="Cerrar Tutorial">&times;</button>' +
                '  </div>' +
                '  <div class="tutorial-popover-body">' +
                '    <h4 id="tutorial-step-title">Título del Paso</h4>' +
                '    <p id="tutorial-step-text">Descripción...</p>' +
                '  </div>' +
                '  <div class="tutorial-popover-footer">' +
                '    <div class="tutorial-dots" id="tutorial-dots"></div>' +
                '    <div class="tutorial-actions">' +
                '      <button class="btn btn-xs btn-outline" id="tutorial-btn-skip" style="color: #64748b;">Saltar</button>' +
                '      <button class="btn btn-xs btn-outline" id="tutorial-btn-prev"><i class="fa-solid fa-chevron-left"></i> Ant.</button>' +
                '      <button class="btn btn-xs btn-primary" id="tutorial-btn-next">Sig. <i class="fa-solid fa-chevron-right"></i></button>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            document.body.appendChild(root);
            this.overlayEl = root;
            this.spotlightEl = document.getElementById("tutorial-spotlight");
            this.popoverEl = document.getElementById("tutorial-popover");
            document.getElementById("tutorial-btn-close").onclick = () => this.end(true);
            document.getElementById("tutorial-btn-skip").onclick = () => this.end(true);
            document.getElementById("tutorial-btn-prev").onclick = () => this.prev();
            document.getElementById("tutorial-btn-next").onclick = () => this.next();
            document.getElementById("tutorial-backdrop").onclick = () => this.next();
        }

        start(stepIndex = 0) {
            this.isActive = true;
            this.currentStep = stepIndex;
            if (this.overlayEl) this.overlayEl.classList.remove("hidden");
            window.addEventListener("resize", this.resizeHandler);
            window.addEventListener("scroll", this.resizeHandler, true);
            this.renderStep();
        }

        end(markCompleted = true) {
            this.isActive = false;
            if (this.overlayEl) this.overlayEl.classList.add("hidden");
            window.removeEventListener("resize", this.resizeHandler);
            window.removeEventListener("scroll", this.resizeHandler, true);
            if (markCompleted) {
                localStorage.setItem("dental_tutorial_viewed", "true");
                const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
                if (user) {
                    const userKey = user.id || user.email || user.username || "user";
                    localStorage.setItem("dental_tutorial_viewed_" + userKey, "true");
                    if (!user.metadata) user.metadata = {};
                    user.metadata.tutorialViewed = true;
                    if (typeof SupabaseDataService !== "undefined" && SupabaseDataService.saveUser) {
                        SupabaseDataService.saveUser(user);
                    }
                }
            }
            if (typeof switchTab === "function") switchTab("dashboard");
        }

        next() {
            if (this.currentStep < TUTORIAL_STEPS.length - 1) {
                this.currentStep++;
                this.renderStep();
            } else {
                this.end(true);
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "success",
                        title: "¡Tutorial Completado! 🎉",
                        text: "Ahora estás listo para registrar y atender pacientes. Puedes reiniciar este tutorial cuando quieras desde el botón \"Tutorial Guiado\" o en Ayuda.",
                        confirmButtonText: "¡Comenzar a Trabajar!",
                        confirmButtonColor: "#0891b2"
                    });
                }
            }
        }

        prev() {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.renderStep();
            }
        }

        async renderStep() {
            const step = TUTORIAL_STEPS[this.currentStep];
            if (!step) return;
            if (step.tab) {
                if (typeof window.navigateToTab === "function") {
                    await window.navigateToTab(step.tab);
                } else if (typeof switchTab === "function") {
                    switchTab(step.tab);
                }
            }
            await new Promise(r => setTimeout(r, 200));
            let targetEl = document.querySelector(step.target);
            if (!targetEl && step.fallbackTarget) targetEl = document.querySelector(step.fallbackTarget);
            if (targetEl) {
                try { targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch(e) {}
            }
            const counterEl = document.getElementById("tutorial-step-counter");
            if (counterEl) counterEl.innerText = "Paso " + (this.currentStep + 1) + " de " + TUTORIAL_STEPS.length;
            const titleEl = document.getElementById("tutorial-step-title");
            if (titleEl) titleEl.innerHTML = step.title;
            const textEl = document.getElementById("tutorial-step-text");
            if (textEl) textEl.innerHTML = step.text;
            const btnPrev = document.getElementById("tutorial-btn-prev");
            const btnNext = document.getElementById("tutorial-btn-next");
            if (btnPrev) btnPrev.style.display = this.currentStep === 0 ? "none" : "inline-flex";
            if (btnNext) {
                if (this.currentStep === TUTORIAL_STEPS.length - 1) {
                    btnNext.innerHTML = "Finalizar <i class=\"fa-solid fa-check\"></i>";
                    btnNext.className = "btn btn-xs btn-success";
                } else {
                    btnNext.innerHTML = "Siguiente <i class=\"fa-solid fa-chevron-right\"></i>";
                    btnNext.className = "btn btn-xs btn-primary";
                }
            }
            const dotsContainer = document.getElementById("tutorial-dots");
            if (dotsContainer) {
                dotsContainer.innerHTML = TUTORIAL_STEPS.map((_, i) => 
                    '<span class="tutorial-dot ' + (i === this.currentStep ? "active" : "") + '" onclick="window.tutorialEngine.start(' + i + ')"></span>'
                ).join("");
            }
            this.reposition();
        }

        reposition() {
            if (!this.isActive) return;
            const step = TUTORIAL_STEPS[this.currentStep];
            if (!step) return;
            let targetEl = document.querySelector(step.target);
            if (!targetEl && step.fallbackTarget) targetEl = document.querySelector(step.fallbackTarget);
            const popover = this.popoverEl;
            const spotlight = this.spotlightEl;
            if (!popover || !spotlight) return;
            const isMobile = window.innerWidth <= 768;
            if (targetEl && targetEl.offsetParent !== null) {
                const rect = targetEl.getBoundingClientRect();
                const padding = 6;
                spotlight.style.display = "block";
                spotlight.style.top = Math.max(0, rect.top - padding) + "px";
                spotlight.style.left = Math.max(0, rect.left - padding) + "px";
                spotlight.style.width = (rect.width + padding * 2) + "px";
                spotlight.style.height = (rect.height + padding * 2) + "px";
                const popoverRect = popover.getBoundingClientRect();
                const popW = Math.min(360, window.innerWidth - 32);
                const popH = popoverRect.height || 220;
                let top = 0;
                let left = 0;
                if (isMobile) {
                    left = (window.innerWidth - popW) / 2;
                    if (rect.bottom + popH + 20 < window.innerHeight) {
                        top = rect.bottom + 12;
                    } else if (rect.top - popH - 12 > 0) {
                        top = rect.top - popH - 12;
                    } else {
                        top = Math.max(16, (window.innerHeight - popH) / 2);
                    }
                } else {
                    const preferredPos = step.position || "bottom";
                    if (preferredPos === "right" && rect.right + popW + 20 < window.innerWidth) {
                        left = rect.right + 14;
                        top = Math.min(window.innerHeight - popH - 20, Math.max(20, rect.top));
                    } else if (preferredPos === "bottom" && rect.bottom + popH + 20 < window.innerHeight) {
                        left = Math.min(window.innerWidth - popW - 20, Math.max(20, rect.left));
                        top = rect.bottom + 14;
                    } else if (rect.top - popH - 20 > 0) {
                        left = Math.min(window.innerWidth - popW - 20, Math.max(20, rect.left));
                        top = rect.top - popH - 14;
                    } else {
                        left = (window.innerWidth - popW) / 2;
                        top = (window.innerHeight - popH) / 2;
                    }
                }
                popover.style.top = Math.max(10, top) + "px";
                popover.style.left = Math.max(10, left) + "px";
                popover.style.width = popW + "px";
                popover.style.transform = "none";
            } else {
                spotlight.style.display = "none";
                const popW = Math.min(360, window.innerWidth - 32);
                popover.style.top = "50%";
                popover.style.left = "50%";
                popover.style.transform = "translate(-50%, -50%)";
                popover.style.width = popW + "px";
            }
        }
    }

    const tutorialInstance = new ClinicalWorkflowTutorial();
    window.tutorialEngine = tutorialInstance;
    window.startClinicalWorkflowTutorial = function (stepIdx = 0) {
        tutorialInstance.start(stepIdx);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => tutorialInstance.init());
    } else {
        tutorialInstance.init();
    }
})();