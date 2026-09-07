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

        // Active filters
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
                    const [specs, rms, pay, cashea, bdays] = await Promise.all([
                        window.SupabaseDataService.getSpecialties().catch(() => []),
                        window.SupabaseDataService.getClinicRooms().catch(() => []),
                        window.SupabaseDataService.getPayrollRecords().catch(() => []),
                        window.SupabaseDataService.getCasheaInvoices().catch(() => []),
                        window.SupabaseDataService.getBirthdayPatients().catch(() => [])
                    ]);
                    this.specialties = specs || [];
                    this.rooms = rms || [];
                    this.payroll = pay || [];
                    this.casheaInvoices = cashea || [];
                    this.birthdayPatients = bdays || [];
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
        // 3. DOBLE NÓMINA (PERSONAL FIJO Y MÉDICOS ESPECIALISTAS)
        // =========================================================
        filterPayroll(type, btn) {
            this.payrollFilter = type;
            if (btn) {
                document.querySelectorAll('#payroll-filter-group .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            this.renderPayroll();
        },

        searchPayroll(query) {
            this.payrollSearch = (query || '').toLowerCase().trim();
            this.renderPayroll();
        },

        renderPayroll() {
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
