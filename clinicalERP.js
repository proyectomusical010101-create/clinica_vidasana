/**
 * Clinica VidaSana - Multi-Specialty Clinical ERP Engine
 * Seamlessly extends VidaSana with:
 * 1. Specialties & Doctor Commission Split (% Doctor vs % Clinic)
 * 2. Physical Rooms Management (Open, Edit, Rent, Status)
 * 3. Double Payroll System (Fixed Staff & Contracted Doctors)
 * 4. Cashea & Credit Payment Tracker with WhatsApp Reminders
 * 5. Patient Birthday Tracker with Direct 1-Click WhatsApp Greetings
 * 6. Multi-Area Inventory Filters
 */

(function() {
    'use strict';

    window.ClinicalERP = {
        specialties: [],
        rooms: [],
        payroll: [],
        casheaInvoices: [],
        birthdayPatients: [],

        async init() {
            console.log('[ClinicalERP] Initializing Multi-Specialty Engine...');
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
            // Hook into tab navigation buttons
            document.querySelectorAll('.nav-item[data-tab="specialties"], .nav-item[data-tab="rooms"], .nav-item[data-tab="payroll"]').forEach(el => {
                el.addEventListener('click', (e) => {
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
        // 1. ESPECIALIDADES & COMISIONES
        // =========================================================
        renderSpecialties() {
            const container = document.getElementById('specialties-table-body');
            if (!container) return;

            if (this.specialties.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-muted"><i class="fa-solid fa-stethoscope"></i> No hay especialidades registradas.</td></tr>';
                return;
            }

            container.innerHTML = this.specialties.map(s => `
                <tr>
                    <td class="font-weight-bold">
                        <span class="badge-dot ${s.active ? 'bg-success' : 'bg-secondary'}"></span>
                        ${s.name}
                    </td>
                    <td><span class="badge badge-pill badge-info">${s.category || 'Consulta Médica'}</span></td>
                    <td class="text-center"><strong class="text-teal">${s.doctor_percentage || 60}%</strong></td>
                    <td class="text-center"><strong class="text-indigo">${s.clinic_percentage || 40}%</strong></td>
                    <td>
                        <span class="badge-tag ${s.active ? 'green' : 'gray'}">
                            ${s.active ? 'Activa' : 'Inactiva'}
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn btn-sm btn-outline" onclick="window.ClinicalERP.openEditSpecialty('${s.id}')" title="Editar Comisiones">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline text-red" onclick="window.ClinicalERP.deleteSpecialty('${s.id}')" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
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
            document.getElementById('specialty-category').value = spec.category || 'Consulta Médica';
            document.getElementById('specialty-doc-pct').value = spec.doctor_percentage || 60;
            document.getElementById('specialty-cli-pct').value = spec.clinic_percentage || 40;
            document.getElementById('specialty-desc').value = spec.description || '';
            document.getElementById('specialty-active').checked = spec.active !== false;
            document.getElementById('modal-specialty-title').innerText = 'Editar Especialidad: ' + spec.name;
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
                        title: 'Comisión debe sumar 100%',
                        text: 'El % Médico (' + docPct + '%) + % Clínica (' + cliPct + '%) debe sumar exactamente 100%.'
                    });
                }
                return;
            }

            const data = {
                id: id || ('spec_' + Date.now()),
                name: document.getElementById('specialty-name').value.trim(),
                category: document.getElementById('specialty-category').value,
                doctor_percentage: docPct,
                clinic_percentage: cliPct,
                description: document.getElementById('specialty-desc').value.trim(),
                active: document.getElementById('specialty-active').checked
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
                    text: 'Esta acción desactivará la especialidad del sistema.',
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
        // 2. CONSULTORIOS & ESPACIOS FÍSICOS
        // =========================================================
        renderRooms() {
            const container = document.getElementById('rooms-cards-grid');
            if (!container) return;

            if (this.rooms.length === 0) {
                container.innerHTML = '<div class="col-12 text-center p-4 text-muted">No hay consultorios registrados.</div>';
                return;
            }

            const statusColors = {
                'disponible': { badge: 'green', text: 'Disponible', icon: 'fa-circle-check' },
                'ocupado': { badge: 'red', text: 'En Consulta', icon: 'fa-user-clock' },
                'alquilado': { badge: 'blue', text: 'Alquilado', icon: 'fa-file-signature' },
                'mantenimiento': { badge: 'amber', text: 'Mantenimiento', icon: 'fa-screwdriver-wrench' }
            };

            container.innerHTML = this.rooms.map(r => {
                const st = statusColors[r.status] || statusColors['disponible'];
                const canonText = r.rental_canon ? ('$' + parseFloat(r.rental_canon).toFixed(2) + ' / ' + (r.rental_mode || 'mes')) : 'Sin canon';
                return `
                    <div class="room-card shadow-sm border-${st.badge}">
                        <div class="room-card-header">
                            <div>
                                <span class="room-code font-weight-bold">${r.code || 'CONS'}</span>
                                <h4 class="room-name">${r.name}</h4>
                            </div>
                            <span class="badge-tag ${st.badge}">
                                <i class="fa-solid ${st.icon}"></i> ${st.text}
                            </span>
                        </div>
                        <div class="room-card-body">
                            <div class="room-info-item">
                                <i class="fa-solid fa-layer-group text-muted"></i>
                                <span>Tipo: <strong>${r.room_type || 'Consultorio'}</strong></span>
                            </div>
                            <div class="room-info-item">
                                <i class="fa-solid fa-hand-holding-dollar text-muted"></i>
                                <span>Canon Alquiler: <strong class="text-success">${canonText}</strong></span>
                            </div>
                            <div class="room-info-item">
                                <i class="fa-solid fa-user-doctor text-muted"></i>
                                <span>Arrendatario / Médico: <strong>${r.renter_doctor_name || 'Ninguno (Clínica)'}</strong></span>
                            </div>
                            ${r.notes ? `<p class="room-notes text-muted"><small>${r.notes}</small></p>` : ''}
                        </div>
                        <div class="room-card-actions">
                            <button class="btn btn-sm btn-outline" onclick="window.ClinicalERP.openEditRoom('${r.id}')">
                                <i class="fa-solid fa-pen-to-square"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="window.ClinicalERP.quickRentRoom('${r.id}')">
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
            document.getElementById('room-code').value = r.code || '';
            document.getElementById('room-name').value = r.name || '';
            document.getElementById('room-type').value = r.room_type || 'consultorio';
            document.getElementById('room-status').value = r.status || 'disponible';
            document.getElementById('room-rental-mode').value = r.rental_mode || 'mensual';
            document.getElementById('room-rental-canon').value = r.rental_canon || 0;
            document.getElementById('room-renter-name').value = r.renter_doctor_name || '';
            document.getElementById('room-notes').value = r.notes || '';
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
            const data = {
                id: id || ('room_' + Date.now()),
                code: document.getElementById('room-code').value.trim(),
                name: document.getElementById('room-name').value.trim(),
                room_type: document.getElementById('room-type').value,
                status: document.getElementById('room-status').value,
                rental_mode: document.getElementById('room-rental-mode').value,
                rental_canon: parseFloat(document.getElementById('room-rental-canon').value) || 0,
                renter_doctor_name: document.getElementById('room-renter-name').value.trim(),
                notes: document.getElementById('room-notes').value.trim()
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
                    Swal.fire({ icon: 'error', title: 'Error al guardar consultorio', text: err.message });
                }
            }
        },

        // =========================================================
        // 3. DOBLE NÓMINA (PERSONAL FIJO Y MÉDICOS CONTRATADOS)
        // =========================================================
        renderPayroll() {
            const container = document.getElementById('payroll-table-body');
            if (!container) return;

            let totalFijo = 0;
            let totalMedicos = 0;
            let totalDeducciones = 0;
            let totalNeto = 0;

            if (this.payroll.length === 0) {
                container.innerHTML = '<tr><td colspan="9" class="text-center p-4 text-muted">No hay registros de nómina para el período. Inicie uno con "+ Nueva Liquidación".</td></tr>';
            } else {
                container.innerHTML = this.payroll.map(p => {
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

                    const statusBadge = {
                        'pagado': 'green',
                        'aprobado': 'blue',
                        'pendiente': 'amber'
                    }[p.status] || 'amber';

                    return `
                        <tr>
                            <td>
                                <strong>${p.staff_name}</strong>
                                <br><small class="text-muted">${p.role_or_specialty || 'Personal'}</small>
                            </td>
                            <td>
                                <span class="badge badge-pill ${isMedico ? 'badge-primary' : 'badge-secondary'}">
                                    ${isMedico ? 'Médico Especialista' : 'Personal Fijo'}
                                </span>
                            </td>
                            <td>${p.period || 'Mes Actual'}</td>
                            <td class="text-right">$${(base + prod).toFixed(2)}</td>
                            <td class="text-right text-success">+$${bonus.toFixed(2)}</td>
                            <td class="text-right text-danger">-$${ded.toFixed(2)}</td>
                            <td class="text-right font-weight-bold text-teal">$${net.toFixed(2)}</td>
                            <td class="text-center">
                                <span class="badge-tag ${statusBadge}">${(p.status || 'Pendiente').toUpperCase()}</span>
                            </td>
                            <td class="text-right">
                                <button class="btn btn-sm btn-outline" onclick="window.ClinicalERP.printPayrollReceipt('${p.id}')" title="Imprimir Recibo">
                                    <i class="fa-solid fa-file-pdf"></i>
                                </button>
                                <button class="btn btn-sm btn-outline text-success" onclick="window.ClinicalERP.markPayrollPaid('${p.id}')" title="Marcar Pagado">
                                    <i class="fa-solid fa-check-double"></i>
                                </button>
                                <button class="btn btn-sm btn-outline text-red" onclick="window.ClinicalERP.deletePayroll('${p.id}')" title="Eliminar">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            // Update stats cards in Payroll view
            const elFijo = document.getElementById('payroll-stat-fijo');
            if (elFijo) elFijo.innerText = '$' + totalFijo.toFixed(2);
            const elMed = document.getElementById('payroll-stat-medicos');
            if (elMed) elMed.innerText = '$' + totalMedicos.toFixed(2);
            const elDed = document.getElementById('payroll-stat-deducciones');
            if (elDed) elDed.innerText = '$' + totalDeducciones.toFixed(2);
            const elNeto = document.getElementById('payroll-stat-neto');
            if (elNeto) elNeto.innerText = '$' + totalNeto.toFixed(2);
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
                id: id || ('pay_' + Date.now()),
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
                    Swal.fire({ icon: 'success', title: 'Nómina Guardada', timer: 1500, showConfirmButton: false });
                }
            } catch (err) {
                console.error(err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'error', title: 'Error al guardar nómina', text: err.message });
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
                    confirmButtonText: 'Sí, eliminar'
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
                <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #ccc; max-width: 600px; margin: auto;">
                    <div style="text-align: center; border-bottom: 2px solid #7fa13c; padding-bottom: 12px; margin-bottom: 15px;">
                        <h2 style="margin: 0; color: #1e262e;">CLÍNICA VIDASANA</h2>
                        <small style="color: #7fa13c; font-weight: bold;">COMPROBANTE DE LIQUIDACIÓN DE NÓMINA / HONORARIOS</small>
                    </div>
                    <p><strong>Beneficiario:</strong> ${p.staff_name} (${p.role_or_specialty || 'Personal'})</p>
                    <p><strong>Tipo de Vínculo:</strong> ${p.contract_type === 'medico_contratado' ? 'Médico Especialista Contratado' : 'Personal Fijo'}</p>
                    <p><strong>Período:</strong> ${p.period || 'Mes en curso'}</p>
                    <hr>
                    <table style="width: 100%; text-align: left; border-collapse: collapse;">
                        <tr><td style="padding: 6px 0;">Sueldo Base / Honorarios:</td><td style="text-align: right;">$${(parseFloat(p.base_salary || 0) + parseFloat(p.production_amount || 0)).toFixed(2)}</td></tr>
                        <tr><td style="padding: 6px 0;">Bonificaciones / Incentivos:</td><td style="text-align: right; color: green;">+$${parseFloat(p.bonuses || 0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 6px 0;">Deducciones (Alquiler Consultorio / Retenciones):</td><td style="text-align: right; color: red;">-$${parseFloat(p.deductions || 0).toFixed(2)}</td></tr>
                        <tr style="border-top: 2px solid #333; font-weight: bold; font-size: 1.1rem;">
                            <td style="padding: 10px 0;">TOTAL NETO LIQUIDADO:</td>
                            <td style="text-align: right; color: #7fa13c;">$${parseFloat(p.net_payable || 0).toFixed(2)}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                        <div style="text-align: center; width: 45%; border-top: 1px solid #333; padding-top: 8px;">Firma Administración</div>
                        <div style="text-align: center; width: 45%; border-top: 1px solid #333; padding-top: 8px;">Firma Recibido Conforme</div>
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
                container.innerHTML = '<div class="p-4 text-center text-muted"><i class="fa-solid fa-receipt"></i> No hay cuentas activas bajo financiamiento Cashea / Crédito.</div>';
                return;
            }

            container.innerHTML = this.casheaInvoices.map(c => {
                const total = parseFloat(c.total_amount || 0);
                const paid = parseFloat(c.paid_amount || 0);
                const pending = total - paid;
                const phone = (c.patient_phone || '').replace(/[^0-9]/g, '');

                return `
                    <div class="cashea-card-item shadow-sm p-3 mb-2 rounded border-left-info" style="border-left: 4px solid #06b6d4; background: var(--bg-card, #ffffff); margin-bottom: 12px; padding: 12px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h5 style="margin: 0 0 4px 0;"><strong>${c.patient_name}</strong></h5>
                                <small class="text-muted">Factura: ${c.invoice_number || 'S/N'} • C.I: ${c.patient_id_num || 'N/A'}</small>
                                <div style="margin-top: 6px;">
                                    <span class="badge-tag blue">Cashea / Cuotas</span>
                                    <span class="badge-tag ${pending <= 0 ? 'green' : 'amber'}">${pending <= 0 ? 'Solvente' : 'Saldo Pendiente'}</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div class="text-muted"><small>Total Plan:</small> <strong>$${total.toFixed(2)}</strong></div>
                                <div class="text-danger"><strong>Pendiente: $${pending.toFixed(2)}</strong></div>
                            </div>
                        </div>
                        <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px;">
                            ${phone ? `
                                <a href="https://wa.me/${phone.startsWith('58') ? phone : ('58' + phone)}?text=${encodeURIComponent('Estimado(a) ' + c.patient_name + ', le saludamos cordialmente de Clínica VidaSana para recordarle su cuota pendiente de Cashea por un monto de $' + pending.toFixed(2) + '. ¡Gracias por su preferencia!')}" 
                                   target="_blank" class="btn btn-sm btn-outline text-success" style="border-color: #10b981; color: #10b981;">
                                    <i class="fa-brands fa-whatsapp"></i> Recordar por WhatsApp
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        },

        // =========================================================
        // 5. CUMPLEAÑOS DE PACIENTES
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
                container.innerHTML = '<p class="text-muted p-3 text-center"><i class="fa-solid fa-cake-candles text-muted"></i> No hay cumpleañeros registrados para este mes.</p>';
                return;
            }

            container.innerHTML = bdays.slice(0, 6).map(p => {
                const phone = (p.phone || '').replace(/[^0-9]/g, '');
                return `
                    <div class="birthday-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color, #e2e8f0);">
                        <div>
                            <strong>${p.first_name || ''} ${p.last_name || ''}</strong>
                            <br><small class="text-muted"><i class="fa-solid fa-cake-candles text-cyan"></i> Cumple: ${p.birth_date || 'Este mes'}</small>
                        </div>
                        ${phone ? `
                            <a href="https://wa.me/${phone.startsWith('58') ? phone : ('58' + phone)}?text=${encodeURIComponent('¡Feliz Cumpleaños de parte de todo el equipo de Clínica VidaSana, ' + (p.first_name || '') + '! Deseamos que pase un día extraordinario y lleno de bendiciones.')}" 
                               target="_blank" class="btn btn-sm btn-success" style="background: #10b981; color: #ffffff; padding: 4px 10px; font-size: 0.78rem; text-decoration: none; border-radius: 6px;" title="Enviar felicitaciones">
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
                container.innerHTML = '<p class="text-muted p-3 text-center">No hay consultorios configurados.</p>';
                return;
            }

            const statusColors = {
                'disponible': 'green',
                'ocupado': 'red',
                'alquilado': 'blue',
                'mantenimiento': 'amber'
            };

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; padding: 10px 0;">
                    ${rms.slice(0, 6).map(r => `
                        <div class="badge-tag ${statusColors[r.status] || 'green'}" style="display: flex; flex-direction: column; align-items: center; padding: 8px; border-radius: 8px; text-align: center;">
                            <strong>${r.code || r.name}</strong>
                            <small style="font-size: 0.7rem;">${(r.status || 'disponible').toUpperCase()}</small>
                        </div>
                    `).join('')}
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

            // Auto-calculate net in payroll form
            ['payroll-base', 'payroll-prod', 'payroll-bonus', 'payroll-ded'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => this.calcPayrollNet());
            });

            // Modal close triggers
            document.querySelectorAll('[data-close-erp]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.getAttribute('data-close-erp');
                    const modal = document.getElementById(targetId);
                    if (modal) modal.classList.add('hidden');
                });
            });
        }
    };

    // Auto-init on DOMContentLoaded or immediate if document already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.ClinicalERP.init());
    } else {
        setTimeout(() => window.ClinicalERP.init(), 200);
    }

})();
