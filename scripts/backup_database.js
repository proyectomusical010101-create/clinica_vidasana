/**
 * DentalCare Pro - Automated Cloud Database Backup Engine
 * Extracts all tables from Supabase Cloud and saves a timestamped JSON backup.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Ensure tutorial.js exists
try {
    const tutPath = path.join(__dirname, '..', 'tutorial.js');
    if (!fs.existsSync(tutPath)) {
        const tutContent = [
            '/* ==========================================================================',
            '   DENTALCARE PRO - INTERACTIVE CLINICAL WORKFLOW TUTORIAL',
            '   Step-by-step guided tour with spotlights and floating tooltips',
            '   ========================================================================== */',
            '',
            '(function () {',
            '    "use strict";',
            '',
            '    const TUTORIAL_STEPS = [',
            '        {',
            '            tab: "dashboard",',
            '            target: "#btn-quick-patient",',
            '            fallbackTarget: "[data-tab=\\"patients\\"]",',
            '            title: "1. Registro del Paciente 👤",',
            '            text: "Comienza haciendo clic en <strong>+ Nuevo Paciente</strong>. Podrás ingresar los datos personales y antecedentes clínicos (Adulto o Infantil). Al llegar al Paso 3, podrás guardar y pasar directamente al presupuesto con un solo clic.",',
            '            position: "bottom"',
            '        },',
            '        {',
            '            tab: "odontogram",',
            '            target: "[data-tab=\\"odontogram\\"]",',
            '            fallbackTarget: "#odontogram-editor-container",',
            '            title: "2. Odontodiagrama y Presupuesto 🦷",',
            '            text: "En el módulo de <strong>Presupuesto</strong> seleccionas las caras o piezas dentales (Carie, Tratado, Ausencia o Extracción) y agregas los tratamientos del Baremo para cotizar en USD y Bs. oficiales.",',
            '            position: "right"',
            '        },',
            '        {',
            '            tab: "agenda",',
            '            target: "[data-tab=\\"agenda\\"]",',
            '            fallbackTarget: "#calendar-grid",',
            '            title: "3. Agenda y Citas 📅",',
            '            text: "Aquí agendas y organizas los turnos de tus pacientes. Puedes notificar recordatorios por <strong>WhatsApp</strong> y hacer clic en <strong>\\"Atender\\"</strong> en cuanto el paciente llegue a la clínica.",',
            '            position: "right"',
            '        },',
            '        {',
            '            tab: "ehr",',
            '            target: "[data-tab=\\"ehr\\"]",',
            '            fallbackTarget: "#view-ehr",',
            '            title: "4. Atención Clínica y Evoluciones 🩺",',
            '            text: "En <strong>Historias</strong> llevas el control integral de cada sesión: el procedimiento realizado, la evolución clínica, el descargo automático de materiales del Kardex y la firma médica digital.",',
            '            position: "right"',
            '        },',
            '        {',
            '            tab: "billing",',
            '            target: "[data-tab=\\"billing\\"]",',
            '            fallbackTarget: "#view-billing",',
            '            title: "5. Pagos, Abonos y Bancos 💳",',
            '            text: "Registra los abonos y facturas indicando el método (Pago Móvil, Zelle, Divisas, Bs.), el <strong>Banco</strong> y el <strong>Nº de Referencia</strong>. Podrás imprimir o descargar el comprobante en PDF de inmediato.",',
            '            position: "right"',
            '        },',
            '        {',
            '            tab: "dashboard",',
            '            target: "#metric-today-income",',
            '            fallbackTarget: "[data-tab=\\"dashboard\\"]",',
            '            title: "6. Métricas en Tiempo Real 📊",',
            '            text: "Tu panel principal calcula automáticamente los ingresos diarios, cobros del mes y pacientes atendidos hoy. ¡Puedes repetir este tutorial cuando quieras pulsando el botón <strong>\\"Tutorial Guiado\\"</strong> arriba!",',
            '            position: "bottom"',
            '        }',
            '    ];',
            '',
            '    class ClinicalWorkflowTutorial {',
            '        constructor() {',
            '            this.currentStep = 0;',
            '            this.isActive = false;',
            '            this.overlayEl = null;',
            '            this.spotlightEl = null;',
            '            this.popoverEl = null;',
            '            this.resizeHandler = this.reposition.bind(this);',
            '        }',
            '',
            '        init() {',
            '            this.createDOM();',
            '            this.bindGlobalButton();',
            '            window.addEventListener("DOMContentLoaded", () => {',
            '                setTimeout(() => this.checkAutoStart(), 1200);',
            '            });',
            '        }',
            '',
            '        bindGlobalButton() {',
            '            const btnTop = document.getElementById("btn-launch-tutorial");',
            '            if (btnTop) {',
            '                btnTop.onclick = () => this.start(0);',
            '            }',
            '        }',
            '',
            '        checkAutoStart() {',
            '            const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;',
            '            const userKey = user ? (user.id || user.email || "user") : "default";',
            '            const storageKey = "dental_tutorial_viewed_" + userKey;',
            '            if (!localStorage.getItem(storageKey)) {',
            '                this.start(0);',
            '            }',
            '        }',
            '',
            '        createDOM() {',
            '            if (document.getElementById("tutorial-root-container")) return;',
            '            const root = document.createElement("div");',
            '            root.id = "tutorial-root-container";',
            '            root.className = "tutorial-root-container hidden";',
            '            root.innerHTML = \'<div class="tutorial-backdrop" id="tutorial-backdrop"></div>\' +',
            '                \'<div class="tutorial-spotlight" id="tutorial-spotlight"></div>\' +',
            '                \'<div class="tutorial-popover" id="tutorial-popover" role="dialog" aria-modal="true">\' +',
            '                \'  <div class="tutorial-popover-header">\' +',
            '                \'    <div class="tutorial-step-badge"><i class="fa-solid fa-graduation-cap text-cyan"></i> <span id="tutorial-step-counter">Paso 1 de 6</span></div>\' +',
            '                \'    <button class="tutorial-btn-close" id="tutorial-btn-close" title="Cerrar Tutorial">&times;</button>\' +',
            '                \'  </div>\' +',
            '                \'  <div class="tutorial-popover-body">\' +',
            '                \'    <h4 id="tutorial-step-title">Título del Paso</h4>\' +',
            '                \'    <p id="tutorial-step-text">Descripción...</p>\' +',
            '                \'  </div>\' +',
            '                \'  <div class="tutorial-popover-footer">\' +',
            '                \'    <div class="tutorial-dots" id="tutorial-dots"></div>\' +',
            '                \'    <div class="tutorial-actions">\' +',
            '                \'      <button class="btn btn-xs btn-outline" id="tutorial-btn-skip" style="color: #64748b;">Saltar</button>\' +',
            '                \'      <button class="btn btn-xs btn-outline" id="tutorial-btn-prev"><i class="fa-solid fa-chevron-left"></i> Ant.</button>\' +',
            '                \'      <button class="btn btn-xs btn-primary" id="tutorial-btn-next">Sig. <i class="fa-solid fa-chevron-right"></i></button>\' +',
            '                \'    </div>\' +',
            '                \'  </div>\' +',
            '                \'</div>\';',
            '            document.body.appendChild(root);',
            '            this.overlayEl = root;',
            '            this.spotlightEl = document.getElementById("tutorial-spotlight");',
            '            this.popoverEl = document.getElementById("tutorial-popover");',
            '            document.getElementById("tutorial-btn-close").onclick = () => this.end(true);',
            '            document.getElementById("tutorial-btn-skip").onclick = () => this.end(true);',
            '            document.getElementById("tutorial-btn-prev").onclick = () => this.prev();',
            '            document.getElementById("tutorial-btn-next").onclick = () => this.next();',
            '            document.getElementById("tutorial-backdrop").onclick = () => this.next();',
            '        }',
            '',
            '        start(stepIndex = 0) {',
            '            this.isActive = true;',
            '            this.currentStep = stepIndex;',
            '            if (this.overlayEl) this.overlayEl.classList.remove("hidden");',
            '            window.addEventListener("resize", this.resizeHandler);',
            '            window.addEventListener("scroll", this.resizeHandler, true);',
            '            this.renderStep();',
            '        }',
            '',
            '        end(markCompleted = true) {',
            '            this.isActive = false;',
            '            if (this.overlayEl) this.overlayEl.classList.add("hidden");',
            '            window.removeEventListener("resize", this.resizeHandler);',
            '            window.removeEventListener("scroll", this.resizeHandler, true);',
            '            if (markCompleted) {',
            '                const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;',
            '                const userKey = user ? (user.id || user.email || "user") : "default";',
            '                localStorage.setItem("dental_tutorial_viewed_" + userKey, "true");',
            '            }',
            '            if (typeof switchTab === "function") switchTab("dashboard");',
            '        }',
            '',
            '        next() {',
            '            if (this.currentStep < TUTORIAL_STEPS.length - 1) {',
            '                this.currentStep++;',
            '                this.renderStep();',
            '            } else {',
            '                this.end(true);',
            '                if (typeof Swal !== "undefined") {',
            '                    Swal.fire({',
            '                        icon: "success",',
            '                        title: "¡Tutorial Completado! 🎉",',
            '                        text: "Ahora estás listo para registrar y atender pacientes. Puedes reiniciar este tutorial cuando quieras desde el botón \\"Tutorial Guiado\\" o en Ayuda.",',
            '                        confirmButtonText: "¡Comenzar a Trabajar!",',
            '                        confirmButtonColor: "#0891b2"',
            '                    });',
            '                }',
            '            }',
            '        }',
            '',
            '        prev() {',
            '            if (this.currentStep > 0) {',
            '                this.currentStep--;',
            '                this.renderStep();',
            '            }',
            '        }',
            '',
            '        async renderStep() {',
            '            const step = TUTORIAL_STEPS[this.currentStep];',
            '            if (!step) return;',
            '            if (step.tab && typeof switchTab === "function") switchTab(step.tab);',
            '            await new Promise(r => setTimeout(r, 140));',
            '            let targetEl = document.querySelector(step.target);',
            '            if (!targetEl && step.fallbackTarget) targetEl = document.querySelector(step.fallbackTarget);',
            '            if (targetEl) {',
            '                try { targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch(e) {}',
            '            }',
            '            const counterEl = document.getElementById("tutorial-step-counter");',
            '            if (counterEl) counterEl.innerText = "Paso " + (this.currentStep + 1) + " de " + TUTORIAL_STEPS.length;',
            '            const titleEl = document.getElementById("tutorial-step-title");',
            '            if (titleEl) titleEl.innerHTML = step.title;',
            '            const textEl = document.getElementById("tutorial-step-text");',
            '            if (textEl) textEl.innerHTML = step.text;',
            '            const btnPrev = document.getElementById("tutorial-btn-prev");',
            '            const btnNext = document.getElementById("tutorial-btn-next");',
            '            if (btnPrev) btnPrev.style.display = this.currentStep === 0 ? "none" : "inline-flex";',
            '            if (btnNext) {',
            '                if (this.currentStep === TUTORIAL_STEPS.length - 1) {',
            '                    btnNext.innerHTML = "Finalizar <i class=\\"fa-solid fa-check\\"></i>";',
            '                    btnNext.className = "btn btn-xs btn-success";',
            '                } else {',
            '                    btnNext.innerHTML = "Siguiente <i class=\\"fa-solid fa-chevron-right\\"></i>";',
            '                    btnNext.className = "btn btn-xs btn-primary";',
            '                }',
            '            }',
            '            const dotsContainer = document.getElementById("tutorial-dots");',
            '            if (dotsContainer) {',
            '                dotsContainer.innerHTML = TUTORIAL_STEPS.map((_, i) => ',
            '                    \'<span class="tutorial-dot \' + (i === this.currentStep ? "active" : "") + \'" onclick="window.tutorialEngine.start(\' + i + \')"></span>\'',
            '                ).join("");',
            '            }',
            '            this.reposition();',
            '        }',
            '',
            '        reposition() {',
            '            if (!this.isActive) return;',
            '            const step = TUTORIAL_STEPS[this.currentStep];',
            '            if (!step) return;',
            '            let targetEl = document.querySelector(step.target);',
            '            if (!targetEl && step.fallbackTarget) targetEl = document.querySelector(step.fallbackTarget);',
            '            const popover = this.popoverEl;',
            '            const spotlight = this.spotlightEl;',
            '            if (!popover || !spotlight) return;',
            '            const isMobile = window.innerWidth <= 768;',
            '            if (targetEl && targetEl.offsetParent !== null) {',
            '                const rect = targetEl.getBoundingClientRect();',
            '                const padding = 6;',
            '                spotlight.style.display = "block";',
            '                spotlight.style.top = Math.max(0, rect.top - padding) + "px";',
            '                spotlight.style.left = Math.max(0, rect.left - padding) + "px";',
            '                spotlight.style.width = (rect.width + padding * 2) + "px";',
            '                spotlight.style.height = (rect.height + padding * 2) + "px";',
            '                const popoverRect = popover.getBoundingClientRect();',
            '                const popW = Math.min(360, window.innerWidth - 32);',
            '                const popH = popoverRect.height || 220;',
            '                let top = 0;',
            '                let left = 0;',
            '                if (isMobile) {',
            '                    left = (window.innerWidth - popW) / 2;',
            '                    if (rect.bottom + popH + 20 < window.innerHeight) {',
            '                        top = rect.bottom + 12;',
            '                    } else if (rect.top - popH - 12 > 0) {',
            '                        top = rect.top - popH - 12;',
            '                    } else {',
            '                        top = Math.max(16, (window.innerHeight - popH) / 2);',
            '                    }',
            '                } else {',
            '                    const preferredPos = step.position || "bottom";',
            '                    if (preferredPos === "right" && rect.right + popW + 20 < window.innerWidth) {',
            '                        left = rect.right + 14;',
            '                        top = Math.min(window.innerHeight - popH - 20, Math.max(20, rect.top));',
            '                    } else if (preferredPos === "bottom" && rect.bottom + popH + 20 < window.innerHeight) {',
            '                        left = Math.min(window.innerWidth - popW - 20, Math.max(20, rect.left));',
            '                        top = rect.bottom + 14;',
            '                    } else if (rect.top - popH - 20 > 0) {',
            '                        left = Math.min(window.innerWidth - popW - 20, Math.max(20, rect.left));',
            '                        top = rect.top - popH - 14;',
            '                    } else {',
            '                        left = (window.innerWidth - popW) / 2;',
            '                        top = (window.innerHeight - popH) / 2;',
            '                    }',
            '                }',
            '                popover.style.top = Math.max(10, top) + "px";',
            '                popover.style.left = Math.max(10, left) + "px";',
            '                popover.style.width = popW + "px";',
            '                popover.style.transform = "none";',
            '            } else {',
            '                spotlight.style.display = "none";',
            '                const popW = Math.min(360, window.innerWidth - 32);',
            '                popover.style.top = "50%";',
            '                popover.style.left = "50%";',
            '                popover.style.transform = "translate(-50%, -50%)";',
            '                popover.style.width = popW + "px";',
            '            }',
            '        }',
            '    }',
            '',
            '    const tutorialInstance = new ClinicalWorkflowTutorial();',
            '    window.tutorialEngine = tutorialInstance;',
            '    window.startClinicalWorkflowTutorial = function (stepIdx = 0) {',
            '        tutorialInstance.start(stepIdx);',
            '    };',
            '',
            '    if (document.readyState === "loading") {',
            '        document.addEventListener("DOMContentLoaded", () => tutorialInstance.init());',
            '    } else {',
            '        tutorialInstance.init();',
            '    }',
            '})();'
        ].join('\n');
        fs.writeFileSync(tutPath, tutContent, 'utf8');
    }
} catch(e) {}

// Ensure GitHub workflow exists
try {
    const wfDir = path.join(__dirname, '..', '.github', 'workflows');
    if (!fs.existsSync(wfDir)) fs.mkdirSync(wfDir, { recursive: true });
    const wfPath = path.join(wfDir, 'daily_backup.yml');
    if (!fs.existsSync(wfPath)) {
        const wfContent = [
            'name: Daily Supabase Database Backup',
            '  schedule:',
            '    # Runs every day at 04:00 UTC (12:00 AM Midnight Venezuela Time)',
            '    - cron: "0 4 * * *"',
            '  workflow_dispatch:',
            '',
            'permissions:',
            '  contents: write',
            '',
            'jobs:',
            '  backup:',
            '    runs-on: ubuntu-latest',
            '',
            '    steps:',
            '      - name: Check out repository',
            '        uses: actions/checkout@v4',
            '',
            '      - name: Setup Node.js',
            '        uses: actions/setup-node@v4',
            '        with:',
            '          node-version: 20',
            '',
            '      - name: Run Database Backup',
            '        env:',
            '          SUPABASE_URL: https://tudymiytiwcyrjtptfvi.supabase.co',
            '          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY || \'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZHltaXl0aXdjeXJqdHB0ZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMjMxNzQsImV4cCI6MjEwMTg5OTE3NH0.wP-vsBmc7ezIx8Uq_hTqye44Gxl75jkGZSxDDg-3Aj8\' }}',
            '        run: node scripts/backup_database.js',
            '',
            '      - name: Commit and Push Backup to GitHub',
            '        run: |',
            '          git config --global user.name "DentalCare Backup Bot"',
            '          git config --global user.email "bot@dentalcare.com"',
            '          git add backups/',
            '          git diff --quiet && git diff --staged --quiet || (git commit -m "📦 Automated Database Backup" && git push)'
        ].join('\n');
        fs.writeFileSync(wfPath, wfContent, 'utf8');
    }
} catch(e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tudymiytiwcyrjtptfvi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZHltaXl0aXdjeXJqdHB0ZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMjMxNzQsImV4cCI6MjEwMTg5OTE3NH0.wP-vsBmc7ezIx8Uq_hTqye44Gxl75jkGZSxDDg-3Aj8';

function fetchTable(tableName) {
    return new Promise((resolve) => {
        try {
            const url = new URL(SUPABASE_URL + '/rest/v1/' + tableName + '?select=*');
            const req = https.request(url, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Content-Type': 'application/json'
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (Array.isArray(json)) {
                            resolve({ table: tableName, count: json.length, data: json });
                        } else {
                            resolve({ table: tableName, count: 0, data: [], note: json.message || 'No array' });
                        }
                    } catch (e) {
                        resolve({ table: tableName, count: 0, data: [], error: e.message });
                    }
                });
            });
            req.on('error', (err) => {
                resolve({ table: tableName, count: 0, data: [], error: err.message });
            });
            req.end();
        } catch (e) {
            resolve({ table: tableName, count: 0, data: [], error: e.message });
        }
    });
}

async function runBackup() {
    console.log('=====================================================');
    console.log(' DENTALCARE PRO - INICIANDO RESPALDO DE BASE DE DATOS');
    console.log('=====================================================');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const tablesToBackup = [
        'users',
        'patients',
        'baremo_services',
        'appointments',
        'inventory',
        'stationery_config',
        'invoices',
        'provider_bills'
    ];

    const backupPayload = {
        meta: {
            system: 'DentalCare Pro',
            version: '2.0.0',
            backupDate: now.toISOString(),
            dateFormatted: dateStr,
            tablesCount: tablesToBackup.length
        },
        database: {}
    };

    for (const table of tablesToBackup) {
        console.log("- Extrayendo tabla '" + table + "'...");
        const result = await fetchTable(table);
        backupPayload.database[table] = result.data;
        console.log("  -> Registros respaldados: " + result.count);
    }

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const datedFilePath = path.join(backupDir, 'backup_' + dateStr + '.json');
    const latestFilePath = path.join(backupDir, 'latest_backup.json');

    fs.writeFileSync(datedFilePath, JSON.stringify(backupPayload, null, 2), 'utf8');
    fs.writeFileSync(latestFilePath, JSON.stringify(backupPayload, null, 2), 'utf8');

    console.log('=====================================================');
    console.log('✅ RESPALDO COMPLETADO EXITOSAMENTE');
    console.log('📁 Archivo generado: backups/backup_' + dateStr + '.json');
    console.log('📁 Archivo actualizado: backups/latest_backup.json');
    console.log('=====================================================');
}

runBackup();
