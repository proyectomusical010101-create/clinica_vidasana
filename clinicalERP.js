/**
 * Clínica VidaSana - Multi-Specialty Clinical ERP Engine (Executive Edition)
 * High-End Healthcare ERP UI/UX:
 * 1. Specialties & Doctor Commission Split (% Doctor vs % Clinic) with Visual Dual-Bar
 * 2. Physical Rooms Blueprint Management (Hourly, Shift, or Monthly Canon)
 * 3. Double Payroll System (Fixed Staff Salaries vs Contracted Doctor Production & Rent Deductions)
 * 4. Cashea & Credit Payment Tracker with 1-Click WhatsApp Reminders
 * 5. Patient Birthday Tracker with 1-Click Direct WhatsApp Greetings
 */

(function() {
    'use strict';

    window.ClinicalERP = {
        specialties: [],
        rooms: [],
        payroll: [],
        casheaInvoices: [],
        birthdayPatients: [],
        serviceLiquidations: [],

        // Subtabs and active filters
        payrollSubtab: 'services', // 'services' (Honorarios por Servicio) or 'general' (Nómina General)
        serviceLiquidationsFilter: 'all',
        serviceLiquidationsSearch: '',
        specialtiesFilter: 'all',
        specialtiesSearch: '',
        roomsFilter: 'all',
        roomsSearch: '',
        payrollFilter: 'all',
        payrollSearch: '',

        async init() {
            console.log('[ClinicalERP] Initializing Executive Multi-Specialty ERP Engine...');
            this.bindNavigation();
            await this.loadAll();
            this.renderDashboardWidgets();
            this.bindEvents();

            const activeTab = document.documentElement.getAttribute('data-active-tab') || localStorage.getItem('dental_active_tab');
            if (activeTab === 'specialties') this.renderSpecialties();
            if (activeTab === 'rooms') this.renderRooms();
            if (activeTab === 'payroll') this.renderPayroll();
        },

        bindNavigation() {
            document.querySelectorAll('.nav-item[data-tab="specialties"], .nav-item[data-tab="rooms"], .nav-item[data-tab="payroll"]').forEach(el => {
                el.addEventListener('click', () => {
                    const tab = el.getAttribute('data-tab');
                    if (window.navigateToTab) {
                        window.navigateToTab(tab);
                    }
                    if (tab === 'specialties') this.renderSpecialties();
                    if (tab === 'rooms') this.renderRooms();
                    if (tab === 'payroll') this.renderPayroll();
                });
            });
        },

        async loadAll() {
            try {
                if (window.SupabaseDataService) {
                    const [specs, rms, pay, cashea, bdays, srvLiq] = await Promise.all([
                        window.SupabaseDataService.getSpecialties().catch(() => []),
                        window.SupabaseDataService.getClinicRooms().catch(() => []),
                        window.SupabaseDataService.getPayrollRecords().catch(() => []),
                        window.SupabaseDataService.getCasheaInvoices().catch(() => []),
                        window.SupabaseDataService.getBirthdayPatients().catch(() => []),
                        window.SupabaseDataService.getServiceLiquidations().catch(() => [])
                    ]);
                    this.specialties = specs || [];
                    this.rooms = rms || [];
                    this.payroll = pay || [];
                    this.casheaInvoices = cashea || [];
                    this.birthdayPatients = bdays || [];
                    this.serviceLiquidations = srvLiq || [];
                }
            } catch (err) {
                console.warn('[ClinicalERP] Error loading data from Supabase:', err);
            }
        },

        // =========================================================
        // 1. ESPECIALIDADES & COMISIONES (% MÉDICO VS % CLÍNICA)
        // =========================================================
        filterSpecialties(dept, btn) {
            this.specialtiesFilter = dept;
            if (btn) {
                document.querySelectorAll('#spec-filter-group .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            this.renderSpecialties();
        },

        searchSpecialties(query) {
            this.specialtiesSearch = (query || '').toLowerCase().trim();
            this.renderSpecialties();
        },

        renderSpecialties() {
            const container = document.getElementById('specialties-table-body');
            if (!container) return;

            let list = [...this.specialties];

            // Filter by department
            if (this.specialtiesFilter && this.specialtiesFilter !== 'all') {
                list = list.filter(s => (s.department || '').toLowerCase() === this.specialtiesFilter.toLowerCase());
            }

            // Search filter
            if (this.specialtiesSearch) {
                list = list.filter(s => 
                    (s.name || '').toLowerCase().includes(this.specialtiesSearch) ||
                    (s.department || '').toLowerCase().includes(this.specialtiesSearch) ||
                    (s.description || '').toLowerCase().includes(this.specialtiesSearch)
                );
            }

            // Calculate top stats
            const totalActive = this.specialties.filter(s => s.status !== 'Inactivo').length;
            let sumDoc = 0;
            let sumCli = 0;
            this.specialties.forEach(s => {
                sumDoc += parseFloat(s.doctor_commission_pct || s.doctor_percentage || 60);
                sumCli += parseFloat(s.clinic_commission_pct || s.clinic_percentage || 40);
            });
            const avgDoc = this.specialties.length ? Math.round(sumDoc / this.specialties.length) : 60;
            const avgCli = this.specialties.length ? Math.round(sumCli / this.specialties.length) : 40;

            const elTotal = document.getElementById('spec-stat-total');
            if (elTotal) elTotal.innerText = totalActive;
            const elDocAvg = document.getElementById('spec-stat-doc-avg');
            if (elDocAvg) elDocAvg.innerText = avgDoc + '%';
            const elCliAvg = document.getElementById('spec-stat-cli-avg');
            if (elCliAvg) elCliAvg.innerText = avgCli + '%';

            if (list.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="5" style="padding: 40px; text-align: center; color: #64748b;">
                            <div style="font-size: 2.2rem; margin-bottom: 10px; color: #cbd5e1;"><i class="fa-solid fa-stethoscope"></i></div>
                            <strong style="font-size: 1rem; color: #1e293b;">No se encontraron especialidades</strong>
                            <p style="margin: 4px 0 0 0; font-size: 0.85rem;">Intente con otro filtro o agregue una nueva especialidad.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = list.map(s => {
                const docPct = parseFloat(s.doctor_commission_pct || s.doctor_percentage || 60);
                const cliPct = parseFloat(s.clinic_commission_pct || s.clinic_percentage || 40);
                const isActive = s.status ? s.status === 'Activo' : (s.active !== false);
                const iconClass = s.icon || 'fa-stethoscope';
                const colorCode = s.color || '#7fa13c';

                return `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div class="erp-circle-avatar" style="background: ${colorCode}1a; color: ${colorCode}; border: 1px solid ${colorCode}33;">
                                    <i class="fa-solid ${iconClass}"></i>
                                </div>
                                <div>
                                    <strong style="font-size: 0.95rem; color: #0f172a; display: block;">${s.name}</strong>
                                    <small style="color: #64748b; font-size: 0.78rem;">${s.description || 'Atención médica y procedimientos'}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge-tag blue" style="font-weight: 600;">
                                ${s.department || 'Consultas Médicas'}
                            </span>
                        </td>
                        <td>
                            <div class="erp-commission-bar-container">
                                <div class="erp-split-bar">
                                    <div class="erp-split-doctor" style="width: ${docPct}%;"></div>
                                    <div class="erp-split-clinic" style="width: ${cliPct}%;"></div>
                                </div>
                                <div class="erp-split-labels">
                                    <span class="doc-label"><i class="fa-solid fa-user-doctor"></i> Médico: <strong>${docPct}%</strong></span>
                                    <span class="cli-label"><i class="fa-solid fa-hospital"></i> Clínica: <strong>${cliPct}%</strong></span>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">
                            <span class="badge-tag ${isActive ? 'green' : 'amber'}" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
                                <span style="width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 4px currentColor;"></span>
                                ${isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td class="text-right">
                            <div style="display: flex; justify-content: flex-end; gap: 6px;">
                                <button type="button" class="btn btn-sm btn-outline" onclick="window.ClinicalERP.openEditSpecialty('${s.id}')" title="Editar Especialidad" style="padding: 6px 12px; border-radius: 8px; border-color: #cbd5e1;">
                                    <i class="fa-solid fa-pen-to-square text-teal"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline text-red" onclick="window.ClinicalERP.deleteSpecialty('${s.id}')" title="Eliminar" style="padding: 6px 12px; border-radius: 8px; border-color: #fecaca; color: #ef4444;">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        },

        openAddSpecialty() {
            document.getElementById('form-specialty').reset();
            document.getElementById('specialty-id').value = '';
            document.getElementById('modal-specialty-title').innerText = 'Nueva Especialidad Médica';
            const modal = document.getElementById('modal-specialty');
            if (modal) modal.classList.remove('hidden');
        },

        openEditSpecialty(id) {
            const spec = this.specialties.find(s => s.id === id);
            if (!spec) return;
            document.getElementById('specialty-id').value = spec.id;
            document.getElementById('specialty-name').value = spec.name || '';
            document.getElementById('specialty-category').value = spec.department || 'Consultas Médicas';
            document.getElementById('specialty-doc-pct').value = spec.doctor_commission_pct || spec.doctor_percentage || 60;
            document.getElementById('specialty-cli-pct').value = spec.clinic_commission_pct || spec.clinic_percentage || 40;
            document.getElementById('specialty-desc').value = spec.description || '';
            document.getElementById('specialty-active').checked = spec.status ? (spec.status === 'Activo') : (spec.active !== false);
            document.getElementById('modal-specialty-title').innerText = 'Editar: ' + spec.name;
            const modal = document.getElementById('modal-specialty');
            if (modal) modal.classList.remove('hidden');
        },

        async saveSpecialty(e) {
            if (e) e.preventDefault();
            const id = document.getElementById('specialty-id').value;
            const docPct = parseFloat(document.getElementById('specialty-doc-pct').value) || 0;
            const cliPct = parseFloat(document.getElementById('specialty-cli-pct').value) || 0;

            if (docPct + cliPct !== 100) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Comisiones deben sumar 100%',
                        text: `El % del Médico (${docPct}%) y el % de la Clínica (${cliPct}%) deben totalizar exactamente 100%.`
                    });
                }
                return;
            }

            const data = {
                id: id || ('esp-' + Date.now()),
                name: document.getElementById('specialty-name').value.trim(),
                department: document.getElementById('specialty-category').value,
                doctor_commission_pct: docPct,
                clinic_commission_pct: cliPct,
                description: document.getElementById('specialty-desc').value.trim(),
                status: document.getElementById('specialty-active').checked ? 'Activo' : 'Inactivo',
                icon: 'fa-stethoscope',
                color: '#7fa13c'
            };

            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.saveSpecialty(data);
                }
                await this.loadAll();
                this.renderSpecialties();
                const modal = document.getElementById('modal-specialty');
                if (modal) modal.classList.add('hidden');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'Especialidad Guardada', timer: 1500, showConfirmButton: false });
                }
            } catch (err) {
                console.error(err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error al guardar', text: err.message });
                }
            }
        },

        async deleteSpecialty(id) {
            if (typeof Swal !== 'undefined') {
                const res = await Swal.fire({
                    title: '¿Eliminar especialidad?',
                    text: 'Esta acción removerá la especialidad de la lista activa.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });
                if (!res.isConfirmed) return;
            }
            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.deleteSpecialty(id);
                }
                await this.loadAll();
                this.renderSpecialties();
            } catch (err) {
                console.error(err);
            }
        },

        // =========================================================
        // 2. CONSULTORIOS & ESPACIOS FÍSICOS (BLUEPRINT CARDS)
        // =========================================================
        filterRooms(status, btn) {
            this.roomsFilter = status;
            if (btn) {
                document.querySelectorAll('#room-filter-group .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            this.renderRooms();
        },

        searchRooms(query) {
            this.roomsSearch = (query || '').toLowerCase().trim();
            this.renderRooms();
        },

        renderRooms() {
            const container = document.getElementById('rooms-cards-grid');
            if (!container) return;

            let list = [...this.rooms];

            if (this.roomsFilter && this.roomsFilter !== 'all') {
                list = list.filter(r => (r.status || '').toLowerCase() === this.roomsFilter.toLowerCase());
            }

            if (this.roomsSearch) {
                list = list.filter(r => 
                    (r.name || '').toLowerCase().includes(this.roomsSearch) ||
                    (r.room_number || '').toLowerCase().includes(this.roomsSearch) ||
                    (r.equipment || '').toLowerCase().includes(this.roomsSearch) ||
                    (r.department || '').toLowerCase().includes(this.roomsSearch)
                );
            }

            // Room metrics
            const total = this.rooms.length;
            const disponibles = this.rooms.filter(r => (r.status || '').toLowerCase() === 'disponible').length;
            const alquilados = this.rooms.filter(r => (r.status || '').toLowerCase() === 'alquilado' || (r.status || '').toLowerCase() === 'ocupado').length;
            const tasaOcupacion = total > 0 ? Math.round((alquilados / total) * 100) : 0;

            const elTot = document.getElementById('room-stat-total');
            if (elTot) elTot.innerText = total;
            const elDisp = document.getElementById('room-stat-disponibles');
            if (elDisp) elDisp.innerText = disponibles;
            const elAlq = document.getElementById('room-stat-alquilados');
            if (elAlq) elAlq.innerText = alquilados;
            const elOcup = document.getElementById('room-stat-ocupacion');
            if (elOcup) elOcup.innerText = tasaOcupacion + '%';

            if (list.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #64748b; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
                        <i class="fa-solid fa-door-closed" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 10px;"></i>
                        <strong style="font-size: 1rem; color: #1e293b; display: block;">No se encontraron consultorios</strong>
                        <small>Ajuste sus filtros de búsqueda o cree un nuevo consultorio.</small>
                    </div>
                `;
                return;
            }

            const statusMap = {
                'disponible': { cls: 'disponible', text: 'Disponible', icon: 'fa-circle-check' },
                'ocupado': { cls: 'ocupado', text: 'En Consulta', icon: 'fa-user-clock' },
                'alquilado': { cls: 'alquilado', text: 'Alquilado', icon: 'fa-file-signature' },
                'mantenimiento': { cls: 'mantenimiento', text: 'Mantenimiento', icon: 'fa-screwdriver-wrench' }
            };

            container.innerHTML = list.map(r => {
                const stKey = (r.status || 'disponible').toLowerCase();
                const st = statusMap[stKey] || statusMap['disponible'];
                const feeShift = r.rental_fee_shift ? ('$' + parseFloat(r.rental_fee_shift).toFixed(2)) : 'N/A';
                const feeMonth = r.rental_fee_monthly ? ('$' + parseFloat(r.rental_fee_monthly).toFixed(2)) : 'N/A';
                const tenantName = r.current_tenant || 'Ninguno (Uso Clínica)';

                return `
                    <div class="erp-room-card">
                        <div class="erp-room-card-top-bar ${st.cls}"></div>
                        <div class="erp-room-card-header">
                            <div>
                                <span style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Espacio #${r.room_number || 'N/A'}</span>
                                <h3 style="margin: 4px 0 0 0; font-size: 1.05rem; color: #0f172a; font-family: 'Outfit', sans-serif;">${r.name}</h3>
                            </div>
                            <span class="erp-room-badge-pill ${st.cls}">
                                <span class="pulse-dot"></span>
                                ${st.text}
                            </span>
                        </div>

                        <div class="erp-room-card-body">
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #64748b;">
                                <i class="fa-solid fa-hospital text-muted"></i>
                                <span>Área: <strong style="color: #1e293b;">${r.department || 'Consultas Médicas'}</strong></span>
                            </div>

                            <div class="erp-room-rates-strip">
                                <div>
                                    <span style="color: #64748b; display: block; font-size: 0.72rem;">Por Turno</span>
                                    <strong style="color: #059669;">${feeShift}</strong>
                                </div>
                                <div>
                                    <span style="color: #64748b; display: block; font-size: 0.72rem;">Canon Mensual</span>
                                    <strong style="color: #0284c7;">${feeMonth}</strong>
                                </div>
                            </div>

                            <div class="erp-room-tenant-box">
                                <div>
                                    <small style="color: #64748b; display: block; font-size: 0.72rem;">Médico / Arrendatario</small>
                                    <strong style="color: #1e293b; font-size: 0.85rem;"><i class="fa-solid fa-user-doctor text-teal" style="margin-right: 4px;"></i> ${tenantName}</strong>
                                </div>
                                <span class="badge-tag ${r.current_tenant ? 'blue' : 'gray'}" style="font-size: 0.7rem;">
                                    ${r.rental_mode || 'Por Turno'}
                                </span>
                            </div>

                            ${r.equipment ? `
                                <div style="font-size: 0.76rem; color: #64748b; line-height: 1.4; background: #f8fafc; padding: 8px 10px; border-radius: 8px;">
                                    <strong style="color: #475569;"><i class="fa-solid fa-screwdriver-wrench text-muted"></i> Equipos:</strong> ${r.equipment}
                                </div>
                            ` : ''}
                        </div>

                        <div class="erp-room-card-footer">
                            <button type="button" class="btn btn-sm btn-outline" onclick="window.ClinicalERP.openEditRoom('${r.id}')" style="font-weight: 600; border-radius: 8px;">
                                <i class="fa-solid fa-pen-to-square"></i> Editar
                            </button>
                            <button type="button" class="btn btn-sm btn-primary" onclick="window.ClinicalERP.quickRentRoom('${r.id}')" style="font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #7fa13c 0%, #608127 100%) !important; border: none !important;">
                                <i class="fa-solid fa-key"></i> Alquilar / Estado
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        openAddRoom() {
            document.getElementById('form-room').reset();
            document.getElementById('room-id').value = '';
            document.getElementById('modal-room-title').innerText = 'Nuevo Consultorio / Área Física';
            const modal = document.getElementById('modal-room');
            if (modal) modal.classList.remove('hidden');
        },

        openEditRoom(id) {
            const r = this.rooms.find(x => x.id === id);
            if (!r) return;
            document.getElementById('room-id').value = r.id;
            document.getElementById('room-code').value = r.room_number || '';
            document.getElementById('room-name').value = r.name || '';
            document.getElementById('room-type').value = r.department || 'Consultas Médicas';
            document.getElementById('room-status').value = (r.status || 'Disponible');
            document.getElementById('room-rental-mode').value = r.rental_mode || 'Por Turno';
            document.getElementById('room-rental-canon').value = r.rental_fee_monthly || 0;
            document.getElementById('room-renter-name').value = r.current_tenant || '';
            document.getElementById('room-notes').value = r.equipment || '';
            document.getElementById('modal-room-title').innerText = 'Editar: ' + r.name;
            const modal = document.getElementById('modal-room');
            if (modal) modal.classList.remove('hidden');
        },

        quickRentRoom(id) {
            this.openEditRoom(id);
        },

        async saveRoom(e) {
            if (e) e.preventDefault();
            const id = document.getElementById('room-id').value;
            const canonVal = parseFloat(document.getElementById('room-rental-canon').value) || 0;

            const data = {
                id: id || ('room-' + Date.now()),
                room_number: document.getElementById('room-code').value.trim(),
                name: document.getElementById('room-name').value.trim(),
                department: document.getElementById('room-type').value,
                status: document.getElementById('room-status').value,
                rental_mode: document.getElementById('room-rental-mode').value,
                rental_fee_monthly: canonVal,
                rental_fee_shift: Math.round(canonVal / 10),
                rental_fee_hourly: Math.round(canonVal / 40),
                current_tenant: document.getElementById('room-renter-name').value.trim() || null,
                equipment: document.getElementById('room-notes').value.trim()
            };

            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.saveClinicRoom(data);
                }
                await this.loadAll();
                this.renderRooms();
                this.renderDashboardWidgets();
                const modal = document.getElementById('modal-room');
                if (modal) modal.classList.add('hidden');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'Consultorio Actualizado', timer: 1500, showConfirmButton: false });
                }
            } catch (err) {
                console.error(err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error al guardar', text: err.message });
                }
            }
        },

        // =========================================================
        // 3. HONORARIOS POR SERVICIO & NÓMINA GENERAL
        // =========================================================
        switchPayrollSubtab(subtab) {
            this.payrollSubtab = subtab;
            const btnServices = document.getElementById('tab-btn-payroll-services');
            const btnGeneral = document.getElementById('tab-btn-payroll-general');
            const viewServices = document.getElementById('payroll-subview-services');
            const viewGeneral = document.getElementById('payroll-subview-general');

            if (subtab === 'services') {
                if (btnServices) btnServices.classList.add('active');
                if (btnGeneral) btnGeneral.classList.remove('active');
                if (viewServices) viewServices.classList.remove('hidden');
                if (viewGeneral) viewGeneral.classList.add('hidden');
                this.renderServiceLiquidations();
            } else {
                if (btnServices) btnServices.classList.remove('active');
                if (btnGeneral) btnGeneral.classList.add('active');
                if (viewServices) viewServices.classList.add('hidden');
                if (viewGeneral) viewGeneral.classList.remove('hidden');
                this.renderFixedPayroll();
            }
        },

        filterServiceLiquidations(filter, btn) {
            this.serviceLiquidationsFilter = filter;
            if (btn) {
                document.querySelectorAll('#service-liquidations-filter-group .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            this.renderServiceLiquidations();
        },

        searchServiceLiquidations(query) {
            this.serviceLiquidationsSearch = (query || '').toLowerCase().trim();
            this.renderServiceLiquidations();
        },

        renderServiceLiquidations() {
            const container = document.getElementById('service-liquidations-table-body');
            if (!container) return;

            let docPending = 0;
            let astPending = 0;
            let countPending = 0;
            let totalSettled = 0;

            this.serviceLiquidations.forEach(item => {
                const docAmt = parseFloat(item.doctor?.amount || 0);
                const astAmt = parseFloat(item.assistant?.amount || 0);
                const isDocPend = item.doctor?.status === 'Pendiente';
                const isAstPend = item.assistant && item.assistant.status === 'Pendiente';

                if (isDocPend) docPending += docAmt;
                if (isAstPend) astPending += astAmt;
                if (item.overall_status === 'Pendiente' || item.overall_status === 'Parcialmente Liquidado') {
                    countPending++;
                }
                if (item.doctor?.status === 'Liquidado') {
                    totalSettled += parseFloat(item.doctor.settled_amount || docAmt);
                }
                if (item.assistant?.status === 'Liquidado') {
                    totalSettled += parseFloat(item.assistant.settled_amount || astAmt);
                }
            });

            // Update stats cards
            const elDoc = document.getElementById('stat-srv-doc-pending');
            if (elDoc) elDoc.innerText = '$' + docPending.toFixed(2);
            const elAst = document.getElementById('stat-srv-ast-pending');
            if (elAst) elAst.innerText = '$' + astPending.toFixed(2);
            const elCount = document.getElementById('stat-srv-count-pending');
            if (elCount) elCount.innerText = countPending;
            const elSettled = document.getElementById('stat-srv-total-settled');
            if (elSettled) elSettled.innerText = '$' + totalSettled.toFixed(2);

            let list = [...this.serviceLiquidations];

            // Filter
            if (this.serviceLiquidationsFilter === 'pendiente') {
                list = list.filter(x => x.overall_status === 'Pendiente');
            } else if (this.serviceLiquidationsFilter === 'parcial') {
                list = list.filter(x => x.overall_status === 'Parcialmente Liquidado');
            } else if (this.serviceLiquidationsFilter === 'liquidado') {
                list = list.filter(x => x.overall_status === 'Liquidado Total');
            }

            // Search
            if (this.serviceLiquidationsSearch) {
                const q = this.serviceLiquidationsSearch;
                list = list.filter(x => 
                    (x.patient_name || '').toLowerCase().includes(q) ||
                    (x.service_name || '').toLowerCase().includes(q) ||
                    (x.doctor?.name || '').toLowerCase().includes(q) ||
                    (x.assistant?.name || '').toLowerCase().includes(q) ||
                    (x.notes || '').toLowerCase().includes(q)
                );
            }

            // Newest first
            list.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));

            if (list.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="8" style="padding: 45px 20px; text-align: center; color: #64748b;">
                            <div style="font-size: 2.2rem; margin-bottom: 10px; color: #cbd5e1;"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                            <strong style="font-size: 1.05rem; color: #1e293b;">No hay servicios pendientes en este filtro</strong>
                            <p style="margin: 6px 0 0 0; font-size: 0.85rem;">Cuando se completen procedimientos o se cobren en caja, aparecerán automáticamente aquí listos para liquidación.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = list.map(item => {
                const price = parseFloat(item.service_price || 0);
                const docAmt = parseFloat(item.doctor?.amount || 0);
                const astAmt = item.assistant && item.assistant.status !== 'No Aplica' ? parseFloat(item.assistant?.amount || 0) : 0;
                const clinicMargin = Math.max(0, price - (docAmt + astAmt));

                const overallBadge = {
                    'Pendiente': 'amber',
                    'Parcialmente Liquidado': 'blue',
                    'Liquidado Total': 'green'
                }[item.overall_status] || 'amber';

                const docRateText = item.doctor?.type === 'fixed' 
                    ? `Fijo $${parseFloat(item.doctor.rate || 0).toFixed(2)}` 
                    : `${item.doctor?.rate || 40}%`;

                const astRateText = item.assistant?.type === 'fixed' 
                    ? `Bono $${parseFloat(item.assistant.rate || 0).toFixed(2)}` 
                    : `${item.assistant?.rate || 5}%`;

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 700; color: #0f172a;">${item.patient_name || 'Paciente S/N'}</div>
                            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
                                <i class="fa-regular fa-calendar" style="margin-right: 3px;"></i> ${item.date || (item.created_at ? item.created_at.substring(0, 10) : 'Hoy')}
                                ${item.invoice_id ? `<span class="badge-tag gray" style="font-size: 0.68rem; margin-left: 4px;">#${item.invoice_id}</span>` : ''}
                            </div>
                        </td>
                        <td>
                            <strong style="color: #0f172a; font-size: 0.92rem; display: block;">${item.service_name}</strong>
                            ${item.service_code ? `<small style="color: #64748b; font-size: 0.76rem;">Cód: ${item.service_code}</small>` : ''}
                        </td>
                        <td class="text-right font-weight-bold" style="color: #1e293b; font-size: 0.95rem;">
                            $${price.toFixed(2)}
                        </td>
                        <td>
                            <div style="font-weight: 600; color: #0f172a; font-size: 0.88rem;">
                                <i class="fa-solid fa-user-doctor text-cyan" style="margin-right: 4px;"></i> ${item.doctor?.name || 'Médico Tratante'}
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                                <span class="badge-tag gray" style="font-size: 0.7rem;">${docRateText}</span>
                                ${item.doctor?.status === 'Liquidado' 
                                    ? `<span class="badge-tag green" style="font-size: 0.7rem; font-weight: 700;"><i class="fa-solid fa-check"></i> Pagado $${(item.doctor.settled_amount || docAmt).toFixed(2)}</span>`
                                    : `<span class="badge-tag amber" style="font-size: 0.7rem; font-weight: 700;"><i class="fa-solid fa-clock"></i> Pendiente $${docAmt.toFixed(2)}</span>`
                                }
                            </div>
                        </td>
                        <td>
                            ${!item.assistant || item.assistant.status === 'No Aplica' ? `
                                <span class="badge-tag gray" style="font-size: 0.75rem; color: #94a3b8;"><i class="fa-solid fa-minus"></i> No Aplica</span>
                            ` : `
                                <div style="font-weight: 600; color: #0f172a; font-size: 0.88rem;">
                                    <i class="fa-solid fa-headset text-teal" style="margin-right: 4px;"></i> ${item.assistant?.name || 'Asistente'}
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                                    <span class="badge-tag gray" style="font-size: 0.7rem;">${astRateText}</span>
                                    ${item.assistant?.status === 'Liquidado' 
                                        ? `<span class="badge-tag green" style="font-size: 0.7rem; font-weight: 700;"><i class="fa-solid fa-check"></i> Pagado $${(item.assistant.settled_amount || astAmt).toFixed(2)}</span>`
                                        : `<span class="badge-tag blue" style="font-size: 0.7rem; font-weight: 700;"><i class="fa-solid fa-clock"></i> Pendiente $${astAmt.toFixed(2)}</span>`
                                    }
                                </div>
                            `}
                        </td>
                        <td class="text-right">
                            <strong style="color: #16a34a; font-size: 0.95rem;">$${clinicMargin.toFixed(2)}</strong>
                        </td>
                        <td class="text-center">
                            <span class="badge-tag ${overallBadge}" style="font-weight: 700; font-size: 0.76rem;">
                                ${item.overall_status === 'Liquidado Total' ? '<i class="fa-solid fa-check-double"></i> TOTALMENTE PAGADO' : item.overall_status.toUpperCase()}
                            </span>
                        </td>
                        <td class="text-right">
                            <div style="display: flex; justify-content: flex-end; gap: 6px; align-items: center;">
                                ${item.overall_status !== 'Liquidado Total' ? `
                                    <button type="button" class="btn btn-sm btn-primary" onclick="window.ClinicalERP.openSettleModal('${item.id}')" title="Liquidar Honorarios" style="padding: 5px 12px; font-weight: 700; border-radius: 8px; background: #16a34a !important; border: none !important; font-size: 0.8rem;">
                                        <i class="fa-solid fa-hand-holding-dollar"></i> Liquidar
                                    </button>
                                ` : `
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.ClinicalERP.printServiceReceipt('${item.id}')" title="Ver / Imprimir Recibo" style="padding: 5px 10px; border-radius: 8px; color: #16a34a; border-color: #bbf7d0; font-size: 0.8rem;">
                                        <i class="fa-solid fa-receipt"></i> Recibo
                                    </button>
                                `}
                                <button type="button" class="btn btn-sm btn-outline" onclick="window.ClinicalERP.openEditGainModal('${item.id}')" title="Ajustar Honorarios / Ganancias" style="padding: 5px 9px; border-radius: 8px; font-size: 0.8rem;">
                                    <i class="fa-solid fa-pen-to-square text-cyan"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline" onclick="window.ClinicalERP.printServiceReceipt('${item.id}')" title="Imprimir Comprobante" style="padding: 5px 9px; border-radius: 8px; font-size: 0.8rem;">
                                    <i class="fa-solid fa-file-pdf text-teal"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline text-red" onclick="window.ClinicalERP.deleteServiceLiquidation('${item.id}')" title="Eliminar" style="padding: 5px 9px; border-radius: 8px; border-color: #fecaca; color: #ef4444; font-size: 0.8rem;">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        },

        openSettleModal(id, preselectedTarget = 'doctor') {
            const item = this.serviceLiquidations.find(x => x.id === id);
            if (!item) return;

            document.getElementById('settle-liquidation-id').value = item.id;
            document.getElementById('settle-service-name').innerText = item.service_name;
            document.getElementById('settle-service-price').innerText = '$' + (parseFloat(item.service_price || 0)).toFixed(2);
            document.getElementById('settle-patient-name').innerHTML = '<i class="fa-solid fa-user"></i> ' + (item.patient_name || 'Paciente S/N');
            document.getElementById('settle-service-date').innerHTML = '<i class="fa-regular fa-calendar"></i> ' + (item.date || (item.created_at ? item.created_at.substring(0,10) : 'Hoy'));
            document.getElementById('settle-payment-ref').value = '';
            document.getElementById('settle-notes').value = '';

            const docAmt = (item.doctor && item.doctor.status === 'Pendiente') ? parseFloat(item.doctor.amount || 0) : 0;
            const astAmt = (item.assistant && item.assistant.status === 'Pendiente') ? parseFloat(item.assistant.amount || 0) : 0;

            const badgeDoc = document.getElementById('settle-doc-badge-amt');
            const badgeAst = document.getElementById('settle-ast-badge-amt');
            const badgeBoth = document.getElementById('settle-both-badge-amt');

            if (badgeDoc) {
                badgeDoc.innerText = item.doctor ? (item.doctor.status === 'Pendiente' ? `$${docAmt.toFixed(2)}` : '(Ya Pagado)') : '(N/A)';
            }
            if (badgeAst) {
                badgeAst.innerText = item.assistant && item.assistant.status !== 'No Aplica' ? (item.assistant.status === 'Pendiente' ? `$${astAmt.toFixed(2)}` : '(Ya Pagado)') : '(No Aplica)';
            }
            if (badgeBoth) {
                badgeBoth.innerText = `$${(docAmt + astAmt).toFixed(2)}`;
            }

            // Decide active radio
            let activeTarget = preselectedTarget;
            if (docAmt > 0 && astAmt === 0) activeTarget = 'doctor';
            else if (docAmt === 0 && astAmt > 0) activeTarget = 'assistant';
            else if (docAmt > 0 && astAmt > 0) activeTarget = preselectedTarget || 'both';

            const radio = document.querySelector(`input[name="settle_target"][value="${activeTarget}"]`);
            if (radio) radio.checked = true;

            this.updateSettleModalTarget(activeTarget);

            const modal = document.getElementById('modal-settle-service');
            if (modal) modal.classList.remove('hidden');
        },

        updateSettleModalTarget(target) {
            const id = document.getElementById('settle-liquidation-id').value;
            const item = this.serviceLiquidations.find(x => x.id === id);
            if (!item) return;

            const docAmt = (item.doctor && item.doctor.status === 'Pendiente') ? parseFloat(item.doctor.amount || 0) : 0;
            const astAmt = (item.assistant && item.assistant.status === 'Pendiente') ? parseFloat(item.assistant.amount || 0) : 0;

            let finalAmt = 0;
            if (target === 'doctor') {
                finalAmt = docAmt;
            } else if (target === 'assistant') {
                finalAmt = astAmt;
            } else if (target === 'both') {
                finalAmt = docAmt + astAmt;
            }

            const input = document.getElementById('settle-amount-input');
            if (input) input.value = finalAmt.toFixed(2);
        },

        async confirmSettlement(e) {
            if (e) e.preventDefault();
            const id = document.getElementById('settle-liquidation-id').value;
            const targetRadio = document.querySelector('input[name="settle_target"]:checked');
            const target = targetRadio ? targetRadio.value : 'doctor';
            const paymentMethod = document.getElementById('settle-payment-method').value;
            const paymentRef = document.getElementById('settle-payment-ref').value.trim();
            const notes = document.getElementById('settle-notes').value.trim();
            const amountVal = parseFloat(document.getElementById('settle-amount-input').value) || 0;

            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.settleServicePayment({
                        liquidationId: id,
                        target: target,
                        paymentMethod: paymentMethod,
                        paymentRef: paymentRef,
                        notes: notes,
                        customDoctorAmount: (target === 'doctor' || target === 'both') ? amountVal : null,
                        customAssistantAmount: (target === 'assistant') ? amountVal : null
                    });
                }
                await this.loadAll();
                this.renderServiceLiquidations();
                const modal = document.getElementById('modal-settle-service');
                if (modal) modal.classList.add('hidden');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Honorarios Liquidados!',
                        text: 'El pago ha sido registrado y conciliado con éxito en la base de datos.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } catch (err) {
                console.error(err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error al liquidar', text: err.message });
                }
            }
        },

        openEditGainModal(id) {
            const item = this.serviceLiquidations.find(x => x.id === id);
            if (!item) return;

            document.getElementById('edit-gain-liquidation-id').value = item.id;
            document.getElementById('edit-gain-service-name').value = item.service_name || '';
            document.getElementById('edit-gain-patient-name').value = item.patient_name || '';
            document.getElementById('edit-gain-service-price').value = (parseFloat(item.service_price || 0)).toFixed(2);

            // Doctor
            document.getElementById('edit-gain-doc-name').value = item.doctor?.name || '';
            document.getElementById('edit-gain-doc-type').value = item.doctor?.type || 'percentage';
            document.getElementById('edit-gain-doc-rate').value = item.doctor?.rate != null ? item.doctor.rate : 40;

            // Assistant
            const hasAst = item.assistant && item.assistant.status !== 'No Aplica';
            const chkAst = document.getElementById('edit-gain-has-assistant');
            if (chkAst) chkAst.checked = !!hasAst;
            this.toggleEditAssistantFields(!!hasAst);

            document.getElementById('edit-gain-ast-name').value = item.assistant?.name || '';
            document.getElementById('edit-gain-ast-type').value = item.assistant?.type || 'fixed';
            document.getElementById('edit-gain-ast-rate').value = item.assistant?.rate != null ? item.assistant.rate : 5;

            this.recalcEditGainPreview();

            const modal = document.getElementById('modal-edit-service-gain');
            if (modal) modal.classList.remove('hidden');
        },

        toggleEditAssistantFields(checked) {
            const wrap = document.getElementById('edit-gain-assistant-fields');
            if (wrap) {
                wrap.style.display = checked ? 'grid' : 'none';
            }
            this.recalcEditGainPreview();
        },

        recalcEditGainPreview() {
            const price = parseFloat(document.getElementById('edit-gain-service-price')?.value) || 0;
            const docType = document.getElementById('edit-gain-doc-type')?.value;
            const docRate = parseFloat(document.getElementById('edit-gain-doc-rate')?.value) || 0;
            let docAmt = docType === 'percentage' ? (price * docRate) / 100 : docRate;

            const hasAst = document.getElementById('edit-gain-has-assistant')?.checked;
            let astAmt = 0;
            if (hasAst) {
                const astType = document.getElementById('edit-gain-ast-type')?.value;
                const astRate = parseFloat(document.getElementById('edit-gain-ast-rate')?.value) || 0;
                astAmt = astType === 'percentage' ? (price * astRate) / 100 : astRate;
            }

            const clinicMargin = Math.max(0, price - (docAmt + astAmt));

            const docPreview = document.getElementById('edit-gain-doc-preview');
            if (docPreview) docPreview.innerText = `$${docAmt.toFixed(2)}`;

            const astPreview = document.getElementById('edit-gain-ast-preview');
            if (astPreview) astPreview.innerText = `$${astAmt.toFixed(2)}`;

            const clinicPreview = document.getElementById('edit-gain-clinic-preview');
            if (clinicPreview) clinicPreview.innerText = `$${clinicMargin.toFixed(2)}`;
        },

        async saveEditedGain(e) {
            if (e) e.preventDefault();
            const id = document.getElementById('edit-gain-liquidation-id').value;
            const item = this.serviceLiquidations.find(x => x.id === id);
            if (!item) return;

            const price = parseFloat(document.getElementById('edit-gain-service-price').value) || 0;
            const docName = document.getElementById('edit-gain-doc-name').value.trim();
            const docType = document.getElementById('edit-gain-doc-type').value;
            const docRate = parseFloat(document.getElementById('edit-gain-doc-rate').value) || 0;
            const docAmt = docType === 'percentage' ? (price * docRate) / 100 : docRate;

            const hasAst = document.getElementById('edit-gain-has-assistant')?.checked;
            const astName = document.getElementById('edit-gain-ast-name').value.trim();
            const astType = document.getElementById('edit-gain-ast-type').value;
            const astRate = parseFloat(document.getElementById('edit-gain-ast-rate').value) || 0;
            const astAmt = hasAst ? (astType === 'percentage' ? (price * astRate) / 100 : astRate) : 0;

            item.service_price = price;
            if (!item.doctor) item.doctor = { status: 'Pendiente' };
            item.doctor.name = docName || item.doctor.name || 'Médico Tratante';
            item.doctor.type = docType;
            item.doctor.rate = docRate;
            item.doctor.amount = docAmt;

            if (!item.assistant) item.assistant = { status: 'No Aplica' };
            if (hasAst) {
                item.assistant.name = astName || 'Asistente';
                item.assistant.type = astType;
                item.assistant.rate = astRate;
                item.assistant.amount = astAmt;
                if (item.assistant.status === 'No Aplica') item.assistant.status = 'Pendiente';
            } else {
                item.assistant.status = 'No Aplica';
                item.assistant.amount = 0;
            }

            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.saveServiceLiquidation(item);
                }
                await this.loadAll();
                this.renderServiceLiquidations();
                const modal = document.getElementById('modal-edit-service-gain');
                if (modal) modal.classList.add('hidden');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'Ganancias Actualizadas', timer: 1500, showConfirmButton: false });
                }
            } catch (err) {
                console.error(err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error al actualizar', text: err.message });
                }
            }
        },

        async openAddServiceLiquidationModal() {
            const form = document.getElementById('form-add-service-liquidation');
            if (form) form.reset();

            // Populate services from baremo
            const srvSelect = document.getElementById('man-liq-service-select');
            if (srvSelect && window.SupabaseDataService) {
                srvSelect.innerHTML = '<option value="">Cargando servicios...</option>';
                try {
                    const baremo = await window.SupabaseDataService.getBaremo();
                    if (baremo && baremo.length > 0) {
                        srvSelect.innerHTML = '<option value="">-- Seleccionar Servicio del Baremo --</option>' +
                            baremo.map(b => `<option value="${b.code || b.id}" data-price="${b.price || 0}" data-hygienist="${b.hygienistBonus || 0}">${b.name} ($${parseFloat(b.price || 0).toFixed(2)})</option>`).join('');
                    } else {
                        srvSelect.innerHTML = '<option value="SRV-CUSTOM" data-price="0">Servicio Personalizado / Consulta</option>';
                    }
                } catch(e) {
                    srvSelect.innerHTML = '<option value="SRV-CUSTOM" data-price="0">Servicio Personalizado / Consulta</option>';
                }
            }

            // Populate doctors & assistants
            const docSelect = document.getElementById('man-liq-doctor-select');
            const astSelect = document.getElementById('man-liq-assistant-select');
            if (docSelect && window.SupabaseDataService) {
                try {
                    const users = await window.SupabaseDataService.getUsers();
                    const doctors = users.filter(u => u.role === 'Odontólogo' || u.role === 'Especialista' || u.role === 'Doctor' || (u.name && u.name.toLowerCase().includes('dr')));
                    const assistants = users.filter(u => u.role === 'Asistente' || u.role === 'Higienista' || u.role === 'Enfermera');

                    if (doctors.length > 0) {
                        docSelect.innerHTML = doctors.map(d => `<option value="${d.id}" data-name="${d.name}" data-rate="${d.commissionRate || 40}">${d.name} (${d.role})</option>`).join('');
                    } else {
                        docSelect.innerHTML = '<option value="doc-1" data-name="Médico Tratante" data-rate="40">Médico Tratante (40%)</option>';
                    }

                    if (astSelect) {
                        astSelect.innerHTML = '<option value="">(No aplica asistente)</option>' + 
                            assistants.map(a => `<option value="${a.id}" data-name="${a.name}" data-rate="${a.commissionRate || 5}">${a.name} (${a.role})</option>`).join('');
                    }
                } catch(e) {
                    docSelect.innerHTML = '<option value="doc-1" data-name="Médico Tratante" data-rate="40">Médico Tratante (40%)</option>';
                }
            }

            const dateInput = document.getElementById('man-liq-date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().substring(0, 10);
            }

            this.recalcManualLiquidationPreview();

            const modal = document.getElementById('modal-add-service-liquidation');
            if (modal) modal.classList.remove('hidden');
        },

        onManualServiceSelected(code) {
            const select = document.getElementById('man-liq-service-select');
            const opt = select ? select.options[select.selectedIndex] : null;
            if (opt) {
                const price = parseFloat(opt.getAttribute('data-price') || 0);
                const priceInput = document.getElementById('man-liq-price');
                if (priceInput) priceInput.value = price.toFixed(2);
            }
            this.recalcManualLiquidationPreview();
        },

        recalcManualLiquidationPreview() {
            const price = parseFloat(document.getElementById('man-liq-price')?.value) || 0;
            const docSelect = document.getElementById('man-liq-doctor-select');
            const docOpt = docSelect ? docSelect.options[docSelect.selectedIndex] : null;
            const docRate = docOpt ? (parseFloat(docOpt.getAttribute('data-rate')) || 40) : 40;
            const docAmt = (price * docRate) / 100;

            const astSelect = document.getElementById('man-liq-assistant-select');
            const astOpt = astSelect ? astSelect.options[astSelect.selectedIndex] : null;
            let astAmt = 0;
            if (astOpt && astOpt.value) {
                const srvSelect = document.getElementById('man-liq-service-select');
                const srvOpt = srvSelect ? srvSelect.options[srvSelect.selectedIndex] : null;
                const hygienistBonus = srvOpt ? parseFloat(srvOpt.getAttribute('data-hygienist') || 0) : 0;
                astAmt = hygienistBonus > 0 ? hygienistBonus : 5.00;
            }

            const clinicMargin = Math.max(0, price - (docAmt + astAmt));

            const pDoc = document.getElementById('man-liq-preview-doc');
            if (pDoc) pDoc.innerText = `$${docAmt.toFixed(2)}`;
            const pAst = document.getElementById('man-liq-preview-ast');
            if (pAst) pAst.innerText = `$${astAmt.toFixed(2)}`;
            const pClinic = document.getElementById('man-liq-preview-clinic');
            if (pClinic) pClinic.innerText = `$${clinicMargin.toFixed(2)}`;
        },

        async saveManualServiceLiquidation(e) {
            if (e) e.preventDefault();
            const srvSelect = document.getElementById('man-liq-service-select');
            const srvOpt = srvSelect ? srvSelect.options[srvSelect.selectedIndex] : null;
            const serviceCode = srvSelect ? srvSelect.value : 'SRV-CUSTOM';
            const serviceName = srvOpt ? srvOpt.text.split(' ($')[0] : 'Servicio Clínico';

            const patientName = document.getElementById('man-liq-patient-name').value.trim();
            const price = parseFloat(document.getElementById('man-liq-price').value) || 0;
            const date = document.getElementById('man-liq-date').value;
            const notes = document.getElementById('man-liq-notes').value.trim();

            const docSelect = document.getElementById('man-liq-doctor-select');
            const docOpt = docSelect ? docSelect.options[docSelect.selectedIndex] : null;
            const doctorId = docSelect ? docSelect.value : null;
            const doctorName = docOpt ? (docOpt.getAttribute('data-name') || docOpt.text) : 'Médico Tratante';

            const astSelect = document.getElementById('man-liq-assistant-select');
            const astOpt = astSelect ? astSelect.options[astSelect.selectedIndex] : null;
            const assistantId = (astSelect && astSelect.value) ? astSelect.value : null;
            const assistantName = (astOpt && astSelect.value) ? (astOpt.getAttribute('data-name') || astOpt.text) : null;

            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.recordServiceCompletionForLiquidation({
                        serviceCode: serviceCode,
                        serviceName: serviceName,
                        servicePrice: price,
                        patientId: null,
                        patientName: patientName,
                        doctorId: doctorId,
                        doctorName: doctorName,
                        assistantId: assistantId,
                        assistantName: assistantName,
                        notes: notes,
                        date: date
                    });
                }
                await this.loadAll();
                this.renderServiceLiquidations();
                const modal = document.getElementById('modal-add-service-liquidation');
                if (modal) modal.classList.add('hidden');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Servicio Registrado',
                        text: 'El servicio está ahora en la lista de pendientes por liquidar.',
                        timer: 1800,
                        showConfirmButton: false
                    });
                }
            } catch(err) {
                console.error(err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error al registrar', text: err.message });
                }
            }
        },

        async deleteServiceLiquidation(id) {
            if (typeof Swal !== 'undefined') {
                const res = await Swal.fire({
                    title: '¿Eliminar de la lista?',
                    text: 'Este servicio será removido de los pendientes por liquidar.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });
                if (!res.isConfirmed) return;
            }
            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.deleteServiceLiquidation(id);
                }
                await this.loadAll();
                this.renderServiceLiquidations();
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'Servicio eliminado', timer: 1200, showConfirmButton: false });
                }
            } catch(e) {
                console.error(e);
            }
        },

        printServiceReceipt(id) {
            const item = this.serviceLiquidations.find(x => x.id === id);
            if (!item) return;

            const docStatus = item.doctor?.status === 'Liquidado' 
                ? '<span style="color: #16a34a; font-weight: bold;">LIQUIDADO / PAGADO</span>' 
                : '<span style="color: #f59e0b; font-weight: bold;">PENDIENTE POR PAGAR</span>';
            const astStatus = item.assistant && item.assistant.status !== 'No Aplica' 
                ? (item.assistant.status === 'Liquidado' ? '<span style="color: #16a34a; font-weight: bold;">LIQUIDADO / PAGADO</span>' : '<span style="color: #f59e0b; font-weight: bold;">PENDIENTE POR PAGAR</span>') 
                : '<span>NO APLICA</span>';

            const printContent = `
                <div style="font-family: Arial, sans-serif; padding: 32px; border: 1px solid #cbd5e1; max-width: 650px; margin: auto; border-radius: 12px; background: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #7fa13c; padding-bottom: 14px; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #1e262e; letter-spacing: 0.5px;">CLÍNICA VIDASANA</h2>
                        <small style="color: #7fa13c; font-weight: bold; font-size: 0.88rem; text-transform: uppercase;">
                            Comprobante Oficial de Liquidación de Honorarios por Servicio
                        </small>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.88rem; margin-bottom: 18px;">
                        <div><strong>Nº Liquidación:</strong> #${(item.id || '').substring(0, 12)}</div>
                        <div><strong>Fecha de Ejecución:</strong> ${item.date || (item.created_at ? item.created_at.substring(0, 10) : 'N/A')}</div>
                        <div><strong>Paciente Atendido:</strong> ${item.patient_name || 'Paciente Clínico'}</div>
                        <div><strong>Estatus General:</strong> <strong>${item.overall_status || 'Pendiente'}</strong></div>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 18px;">
                        <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Procedimiento Clínico:</strong>
                        <span style="font-size: 1.05rem; color: #0284c7; font-weight: bold;">${item.service_name}</span>
                        <span style="float: right; font-weight: bold; font-size: 1.05rem; color: #16a34a;">Valor Cobrado: $${parseFloat(item.service_price || 0).toFixed(2)}</span>
                    </div>

                    <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 0.9rem; margin-top: 10px;">
                        <thead>
                            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 8px;">Rol / Profesional</th>
                                <th style="padding: 8px;">Nombre</th>
                                <th style="padding: 8px; text-align: center;">Base / %</th>
                                <th style="padding: 8px; text-align: right;">Monto</th>
                                <th style="padding: 8px; text-align: right;">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px 8px;"><strong>Médico Especialista</strong></td>
                                <td style="padding: 10px 8px;">${item.doctor?.name || 'Médico S/N'}</td>
                                <td style="padding: 10px 8px; text-align: center;">${item.doctor?.type === 'fixed' ? 'Fijo $' + item.doctor.rate : (item.doctor?.rate || 40) + '%'}</td>
                                <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0f172a;">$${parseFloat(item.doctor?.amount || 0).toFixed(2)}</td>
                                <td style="padding: 10px 8px; text-align: right;">${docStatus}</td>
                            </tr>
                            ${item.assistant && item.assistant.status !== 'No Aplica' ? `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px 8px;"><strong>Asistente Clínico</strong></td>
                                <td style="padding: 10px 8px;">${item.assistant.name || 'Asistente'}</td>
                                <td style="padding: 10px 8px; text-align: center;">${item.assistant.type === 'fixed' ? 'Bono $' + item.assistant.rate : (item.assistant.rate || 5) + '%'}</td>
                                <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0f172a;">$${parseFloat(item.assistant.amount || 0).toFixed(2)}</td>
                                <td style="padding: 10px 8px; text-align: right;">${astStatus}</td>
                            </tr>
                            ` : ''}
                            <tr style="border-top: 2px solid #334155; font-size: 1.05rem; font-weight: bold; background: #f8fafc;">
                                <td colspan="3" style="padding: 12px 8px;">TOTAL HONORARIOS PROFESIONALES:</td>
                                <td style="padding: 12px 8px; text-align: right; color: #608127;">
                                    $${((item.doctor?.amount || 0) + (item.assistant && item.assistant.status !== 'No Aplica' ? (item.assistant?.amount || 0) : 0)).toFixed(2)}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    ${item.settlement_log && item.settlement_log.length > 0 ? `
                        <div style="margin-top: 20px; font-size: 0.82rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px;">
                            <strong style="color: #166534; display: block; margin-bottom: 4px;"><i class="fa-solid fa-receipt"></i> Historial de Liquidaciones Registradas:</strong>
                            ${item.settlement_log.map(l => `
                                <div>• <strong>${l.target === 'both' ? 'Médico y Asistente' : (l.target === 'doctor' ? 'Médico' : 'Asistente')}:</strong> $${parseFloat(l.amount || 0).toFixed(2)} vía ${l.method} el ${l.date ? l.date.substring(0,10) : ''} ${l.ref ? '(Ref: ' + l.ref + ')' : ''}</div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                        <div style="text-align: center; width: 44%; border-top: 1px solid #334155; padding-top: 8px; font-size: 0.8rem;">Firma Administración VidaSana</div>
                        <div style="text-align: center; width: 44%; border-top: 1px solid #334155; padding-top: 8px; font-size: 0.8rem;">Firma Conforme Profesional</div>
                    </div>
                </div>
            `;
            const win = window.open('', '_blank');
            win.document.write('<html><head><title>Recibo Liquidación - ' + item.service_name + '</title></head><body>' + printContent + '</body></html>');
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
        },

        // =========================================================
        // 4. NÓMINA GENERAL & PERSONAL FIJO
        // =========================================================
        filterPayroll(type, btn) {
            this.payrollFilter = type;
            if (btn) {
                document.querySelectorAll('#payroll-filter-group .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            this.renderFixedPayroll();
        },

        searchPayroll(query) {
            this.payrollSearch = (query || '').toLowerCase().trim();
            this.renderFixedPayroll();
        },

        renderPayroll() {
            this.renderServiceLiquidations();
            this.renderFixedPayroll();
        },

        renderFixedPayroll() {
            const container = document.getElementById('payroll-table-body');
            if (!container) return;

            let list = [...this.payroll];

            // Filter
            if (this.payrollFilter && this.payrollFilter !== 'all') {
                if (this.payrollFilter === 'personal_fijo' || this.payrollFilter === 'medico_contratado') {
                    list = list.filter(p => p.contract_type === this.payrollFilter);
                } else if (this.payrollFilter === 'pendiente' || this.payrollFilter === 'pagado') {
                    list = list.filter(p => (p.status || 'pendiente').toLowerCase() === this.payrollFilter);
                }
            }

            if (this.payrollSearch) {
                list = list.filter(p => 
                    (p.staff_name || '').toLowerCase().includes(this.payrollSearch) ||
                    (p.role_or_specialty || '').toLowerCase().includes(this.payrollSearch) ||
                    (p.period || '').toLowerCase().includes(this.payrollSearch)
                );
            }

            let totalFijo = 0;
            let totalMedicos = 0;
            let totalDeducciones = 0;
            let totalNeto = 0;

            this.payroll.forEach(p => {
                const isMedico = p.contract_type === 'medico_contratado';
                const base = parseFloat(p.base_salary || 0);
                const prod = parseFloat(p.production_amount || 0);
                const bonus = parseFloat(p.bonuses || 0);
                const ded = parseFloat(p.deductions || 0);
                const net = parseFloat(p.net_payable || ((base + prod + bonus) - ded));

                if (isMedico) {
                    totalMedicos += (prod + base);
                } else {
                    totalFijo += base;
                }
                totalDeducciones += ded;
                totalNeto += net;
            });

            // Update stats cards in Payroll view
            const elFijo = document.getElementById('payroll-stat-fijo');
            if (elFijo) elFijo.innerText = '$' + totalFijo.toFixed(2);
            const elMed = document.getElementById('payroll-stat-medicos');
            if (elMed) elMed.innerText = '$' + totalMedicos.toFixed(2);
            const elDed = document.getElementById('payroll-stat-deducciones');
            if (elDed) elDed.innerText = '$' + totalDeducciones.toFixed(2);
            const elNeto = document.getElementById('payroll-stat-neto');
            if (elNeto) elNeto.innerText = '$' + totalNeto.toFixed(2);

            if (list.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="9" style="padding: 40px; text-align: center; color: #64748b;">
                            <div style="font-size: 2.2rem; margin-bottom: 10px; color: #cbd5e1;"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                            <strong style="font-size: 1rem; color: #1e293b;">No hay registros de liquidación</strong>
                            <p style="margin: 4px 0 0 0; font-size: 0.85rem;">Haga clic en "+ Nueva Liquidación" para procesar sueldos u honorarios de médicos.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = list.map(p => {
                const isMedico = p.contract_type === 'medico_contratado';
                const base = parseFloat(p.base_salary || 0);
                const prod = parseFloat(p.production_amount || 0);
                const bonus = parseFloat(p.bonuses || 0);
                const ded = parseFloat(p.deductions || 0);
                const net = parseFloat(p.net_payable || ((base + prod + bonus) - ded));
                const initials = (p.staff_name || 'NN').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                const statusBadge = {
                    'pagado': 'green',
                    'aprobado': 'blue',
                    'pendiente': 'amber'
                }[(p.status || 'pendiente').toLowerCase()] || 'amber';

                return `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div class="erp-circle-avatar" style="background: ${isMedico ? '#eff6ff' : '#f0fdf4'}; color: ${isMedico ? '#0284c7' : '#16a34a'};">
                                    <i class="fa-solid ${isMedico ? 'fa-user-doctor' : 'fa-user-nurse'}"></i>
                                </div>
                                <div>
                                    <strong style="font-size: 0.95rem; color: #0f172a; display: block;">${p.staff_name}</strong>
                                    <small style="color: #64748b; font-size: 0.78rem;">${p.role_or_specialty || 'Personal Clínico'}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge-tag ${isMedico ? 'blue' : 'gray'}" style="font-weight: 600;">
                                ${isMedico ? 'Médico Especialista' : 'Personal Fijo'}
                            </span>
                        </td>
                        <td><strong>${p.period || 'Mes en curso'}</strong></td>
                        <td class="text-right font-weight-bold" style="color: #1e293b;">$${(base + prod).toFixed(2)}</td>
                        <td class="text-right" style="color: #16a34a; font-weight: 600;">+$${bonus.toFixed(2)}</td>
                        <td class="text-right" style="color: #dc2626; font-weight: 600;">-$${ded.toFixed(2)}</td>
                        <td class="text-right" style="color: #608127; font-size: 1.05rem; font-weight: 800; font-family: 'Outfit', sans-serif;">$${net.toFixed(2)}</td>
                        <td class="text-center">
                            <span class="badge-tag ${statusBadge}" style="font-weight: 700;">
                                ${(p.status || 'Pendiente').toUpperCase()}
                            </span>
                        </td>
                        <td class="text-right">
                            <div style="display: flex; justify-content: flex-end; gap: 6px;">
                                <button type="button" class="btn btn-sm btn-outline" onclick="window.ClinicalERP.printPayrollReceipt('${p.id}')" title="Imprimir Recibo PDF" style="padding: 6px 10px; border-radius: 8px;">
                                    <i class="fa-solid fa-file-pdf text-teal"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline text-success" onclick="window.ClinicalERP.markPayrollPaid('${p.id}')" title="Marcar Pagado" style="padding: 6px 10px; border-radius: 8px; border-color: #bbf7d0; color: #16a34a;">
                                    <i class="fa-solid fa-check-double"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline text-red" onclick="window.ClinicalERP.deletePayroll('${p.id}')" title="Eliminar" style="padding: 6px 10px; border-radius: 8px; border-color: #fecaca; color: #ef4444;">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        },

        openAddPayroll() {
            document.getElementById('form-payroll').reset();
            document.getElementById('payroll-id').value = '';
            document.getElementById('modal-payroll-title').innerText = 'Nueva Liquidación de Nómina / Honorarios';
            this.calcPayrollNet();
            const modal = document.getElementById('modal-payroll');
            if (modal) modal.classList.remove('hidden');
        },

        calcPayrollNet() {
            const base = parseFloat(document.getElementById('payroll-base').value) || 0;
            const prod = parseFloat(document.getElementById('payroll-prod').value) || 0;
            const bonus = parseFloat(document.getElementById('payroll-bonus').value) || 0;
            const ded = parseFloat(document.getElementById('payroll-ded').value) || 0;
            const net = (base + prod + bonus) - ded;
            const netEl = document.getElementById('payroll-net-display');
            if (netEl) netEl.innerText = '$' + (net > 0 ? net : 0).toFixed(2);
        },

        async savePayroll(e) {
            if (e) e.preventDefault();
            const id = document.getElementById('payroll-id').value;
            const base = parseFloat(document.getElementById('payroll-base').value) || 0;
            const prod = parseFloat(document.getElementById('payroll-prod').value) || 0;
            const bonus = parseFloat(document.getElementById('payroll-bonus').value) || 0;
            const ded = parseFloat(document.getElementById('payroll-ded').value) || 0;
            const net = (base + prod + bonus) - ded;

            const data = {
                id: id || ('pay-' + Date.now()),
                staff_name: document.getElementById('payroll-name').value.trim(),
                role_or_specialty: document.getElementById('payroll-role').value.trim(),
                contract_type: document.getElementById('payroll-type').value,
                period: document.getElementById('payroll-period').value.trim(),
                base_salary: base,
                production_amount: prod,
                bonuses: bonus,
                deductions: ded,
                net_payable: net,
                status: document.getElementById('payroll-status').value,
                notes: document.getElementById('payroll-notes').value.trim()
            };

            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.savePayrollRecord(data);
                }
                await this.loadAll();
                this.renderPayroll();
                const modal = document.getElementById('modal-payroll');
                if (modal) modal.classList.add('hidden');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'Liquidación Guardada', timer: 1500, showConfirmButton: false });
                }
            } catch (err) {
                console.error(err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error al guardar', text: err.message });
                }
            }
        },

        async markPayrollPaid(id) {
            const p = this.payroll.find(x => x.id === id);
            if (!p) return;
            p.status = 'pagado';
            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.savePayrollRecord(p);
                }
                await this.loadAll();
                this.renderPayroll();
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'Marcado como Pagado', timer: 1200, showConfirmButton: false });
                }
            } catch(e) {
                console.error(e);
            }
        },

        async deletePayroll(id) {
            if (typeof Swal !== 'undefined') {
                const res = await Swal.fire({
                    title: '¿Eliminar registro?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });
                if (!res.isConfirmed) return;
            }
            try {
                if (window.SupabaseDataService) {
                    await window.SupabaseDataService.deletePayrollRecord(id);
                }
                await this.loadAll();
                this.renderPayroll();
            } catch(e) {
                console.error(e);
            }
        },

        printPayrollReceipt(id) {
            const p = this.payroll.find(x => x.id === id);
            if (!p) return;
            const printContent = `
                <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #cbd5e1; max-width: 620px; margin: auto; border-radius: 12px;">
                    <div style="text-align: center; border-bottom: 2px solid #7fa13c; padding-bottom: 14px; margin-bottom: 18px;">
                        <h2 style="margin: 0; color: #1e262e; letter-spacing: 0.5px;">CLÍNICA VIDASANA</h2>
                        <small style="color: #7fa13c; font-weight: bold; font-size: 0.85rem; text-transform: uppercase;">Comprobante Oficial de Liquidación de Haberes / Honorarios</small>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.88rem; margin-bottom: 15px;">
                        <div><strong>Beneficiario:</strong> ${p.staff_name}</div>
                        <div><strong>Cargo/Especialidad:</strong> ${p.role_or_specialty || 'Personal'}</div>
                        <div><strong>Vínculo:</strong> ${p.contract_type === 'medico_contratado' ? 'Médico Especialista Contratado' : 'Personal Fijo'}</div>
                        <div><strong>Período:</strong> ${p.period || 'Mes en curso'}</div>
                    </div>
                    <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 0.9rem; margin-top: 15px;">
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;">Sueldo Base / Honorarios:</td><td style="text-align: right; font-weight: bold;">$${(parseFloat(p.base_salary || 0) + parseFloat(p.production_amount || 0)).toFixed(2)}</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;">Bonificaciones / Producción Extra:</td><td style="text-align: right; color: #16a34a; font-weight: bold;">+$${parseFloat(p.bonuses || 0).toFixed(2)}</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0;">Deducciones (Alquiler Consultorio / Retenciones):</td><td style="text-align: right; color: #dc2626; font-weight: bold;">-$${parseFloat(p.deductions || 0).toFixed(2)}</td></tr>
                        <tr style="border-top: 2px solid #334155; font-size: 1.15rem; font-weight: bold;">
                            <td style="padding: 12px 0;">TOTAL NETO LIQUIDADO:</td>
                            <td style="text-align: right; color: #608127;">$${parseFloat(p.net_payable || 0).toFixed(2)}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                        <div style="text-align: center; width: 44%; border-top: 1px solid #334155; padding-top: 8px; font-size: 0.8rem;">Firma Administración VidaSana</div>
                        <div style="text-align: center; width: 44%; border-top: 1px solid #334155; padding-top: 8px; font-size: 0.8rem;">Firma Conforme Colaborador</div>
                    </div>
                </div>
            `;
            const win = window.open('', '_blank');
            win.document.write('<html><head><title>Recibo de Nómina - ' + p.staff_name + '</title></head><body>' + printContent + '</body></html>');
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
        },

        // =========================================================
        // 4. SEGUIMIENTO A CASHEA / CRÉDITOS
        // =========================================================
        openCasheaModal() {
            const modal = document.getElementById('modal-cashea-tracker');
            if (!modal) return;
            this.renderCasheaList();
            modal.classList.remove('hidden');
        },

        renderCasheaList() {
            const container = document.getElementById('cashea-list-container');
            if (!container) return;

            if (this.casheaInvoices.length === 0) {
                container.innerHTML = `
                    <div style="padding: 30px; text-align: center; color: #64748b;">
                        <i class="fa-solid fa-credit-card" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 8px;"></i>
                        <p style="margin: 0;">No hay cuentas activas bajo financiamiento Cashea / Crédito.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.casheaInvoices.map(c => {
                const total = parseFloat(c.total_amount || 0);
                const paid = parseFloat(c.paid_amount || 0);
                const pending = total - paid;
                const phone = (c.patient_phone || '').replace(/[^0-9]/g, '');

                return `
                    <div style="border: 1px solid #e2e8f0; border-left: 4px solid #06b6d4; background: #ffffff; margin-bottom: 12px; padding: 14px 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0 0 4px 0; color: #0f172a; font-family: 'Outfit', sans-serif;"><strong>${c.patient_name}</strong></h4>
                                <small style="color: #64748b;">Factura: <strong>${c.invoice_number || 'S/N'}</strong> • Cédula: ${c.patient_id_num || 'N/A'}</small>
                                <div style="margin-top: 8px; display: flex; gap: 6px;">
                                    <span class="badge-tag blue">Cashea / Cuotas</span>
                                    <span class="badge-tag ${pending <= 0 ? 'green' : 'amber'}">${pending <= 0 ? 'Solvente' : 'Saldo Pendiente'}</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #64748b; font-size: 0.8rem;">Total Plan: <strong>$${total.toFixed(2)}</strong></div>
                                <div style="color: #dc2626; font-size: 1.1rem; font-weight: 800; font-family: 'Outfit', sans-serif; margin-top: 2px;">$${pending.toFixed(2)}</div>
                                <small style="color: #64748b; font-size: 0.72rem;">Por cobrar</small>
                            </div>
                        </div>
                        <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
                            ${phone ? `
                                <a href="https://wa.me/${phone.startsWith('58') ? phone : ('58' + phone)}?text=${encodeURIComponent('Estimado(a) ' + c.patient_name + ', le saludamos cordialmente de Clínica VidaSana para recordarle su cuota pendiente de Cashea por un monto de $' + pending.toFixed(2) + '. ¡Gracias por su preferencia!')}" 
                                   target="_blank" class="whatsapp-pill-link">
                                    <i class="fa-brands fa-whatsapp"></i> Recordar Cuota por WhatsApp
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        },

        // =========================================================
        // 5. CUMPLEAÑOS & CONSULTORIOS EN DASHBOARD
        // =========================================================
        renderDashboardWidgets() {
            this.renderBirthdayWidget();
            this.renderRoomsWidget();
        },

        renderBirthdayWidget() {
            const container = document.getElementById('dashboard-birthdays-widget');
            if (!container) return;

            const bdays = this.birthdayPatients || [];
            if (bdays.length === 0) {
                container.innerHTML = '<p class="text-muted p-3 text-center" style="font-size: 0.85rem;"><i class="fa-solid fa-cake-candles text-muted" style="margin-right: 6px;"></i> No hay cumpleañeros registrados para este mes.</p>';
                return;
            }

            container.innerHTML = bdays.slice(0, 6).map(p => {
                const phone = (p.phone || '').replace(/[^0-9]/g, '');
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                        <div>
                            <strong style="color: #0f172a; font-size: 0.88rem;">${p.first_name || ''} ${p.last_name || ''}</strong>
                            <div style="color: #64748b; font-size: 0.76rem;"><i class="fa-solid fa-cake-candles text-cyan"></i> Fecha: ${p.birth_date || 'Este mes'}</div>
                        </div>
                        ${phone ? `
                            <a href="https://wa.me/${phone.startsWith('58') ? phone : ('58' + phone)}?text=${encodeURIComponent('¡Feliz Cumpleaños de parte de todo el equipo de Clínica VidaSana, ' + (p.first_name || '') + '! Deseamos que pase un día extraordinario y lleno de bendiciones.')}" 
                               target="_blank" class="whatsapp-pill-link" style="padding: 4px 10px; font-size: 0.74rem;">
                                <i class="fa-brands fa-whatsapp"></i> Felicitar
                            </a>
                        ` : ''}
                    </div>
                `;
            }).join('');
        },

        renderRoomsWidget() {
            const container = document.getElementById('dashboard-rooms-widget');
            if (!container) return;

            const rms = this.rooms || [];
            if (rms.length === 0) {
                container.innerHTML = '<p class="text-muted p-3 text-center" style="font-size: 0.85rem;">No hay consultorios configurados.</p>';
                return;
            }

            const statusColors = {
                'disponible': { badge: 'green', text: 'Disponible' },
                'ocupado': { badge: 'red', text: 'En Consulta' },
                'alquilado': { badge: 'blue', text: 'Alquilado' },
                'mantenimiento': { badge: 'amber', text: 'Mantenimiento' }
            };

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; padding: 4px 0;">
                    ${rms.slice(0, 6).map(r => {
                        const stKey = (r.status || 'disponible').toLowerCase();
                        const st = statusColors[stKey] || statusColors['disponible'];
                        return `
                            <div class="badge-tag ${st.badge}" style="display: flex; flex-direction: column; align-items: center; padding: 8px; border-radius: 10px; text-align: center;">
                                <strong style="font-size: 0.82rem;">${r.room_number ? ('#' + r.room_number) : (r.name.substring(0, 14))}</strong>
                                <small style="font-size: 0.68rem; margin-top: 2px;">${st.text.toUpperCase()}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        bindEvents() {
            const formSpec = document.getElementById('form-specialty');
            if (formSpec) formSpec.addEventListener('submit', (e) => this.saveSpecialty(e));

            const formRoom = document.getElementById('form-room');
            if (formRoom) formRoom.addEventListener('submit', (e) => this.saveRoom(e));

            const formPay = document.getElementById('form-payroll');
            if (formPay) formPay.addEventListener('submit', (e) => this.savePayroll(e));

            ['payroll-base', 'payroll-prod', 'payroll-bonus', 'payroll-ded'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => this.calcPayrollNet());
            });

            document.querySelectorAll('[data-close-erp]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.getAttribute('data-close-erp');
                    const modal = document.getElementById(targetId);
                    if (modal) modal.classList.add('hidden');
                });
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.ClinicalERP.init());
    } else {
        setTimeout(() => window.ClinicalERP.init(), 150);
    }

})();
