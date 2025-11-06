// Transportistas Manager - 👥 Drivers management functionality
// Updated: Removed activate/deactivate button from table - only available in edit modal
// Cache buster: v2.0 - 2025-01-11
class TransportistasManager {
    constructor() {
        this.drivers = [];
        this.currentDriver = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add driver button
        const addBtn = document.querySelector('[onclick="openModal(\'addDriver\')"]');
        if (addBtn) {
            addBtn.onclick = () => this.openAddModal();
        }
    }

    async loadData() {
        try {
            // Real API call to get drivers from database
            const response = await window.app.apiCall('/LogisticaFinal/api/transportistas/list.php');
            this.drivers = response;
            this.updateDriversList();
            
        } catch (error) {
            console.error('Error loading drivers:', error);
            // Fallback to empty array if API fails
            this.drivers = [];
            this.updateDriversList();
        }
    }

    updateDriversList() {
        const tbody = document.querySelector('#transportistasSection tbody');
        if (!tbody || !this.drivers) return;

        tbody.innerHTML = this.drivers.map(driver => `
            <tr>
                <td>#${String(driver.id).padStart(3, '0')}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="width: 35px; height: 35px; font-size: 0.9rem;">
                            ${this.getInitials(driver.nombre)}
                        </div>
                        <div>
                            <div class="fw-bold">${driver.nombre}</div>
                            <small class="text-muted">${driver.email}</small>
                        </div>
                    </div>
                </td>
                <td>${this.formatPhoneWithFlag(driver.telefono)}</td>
                <td>${driver.licencia || 'N/A'}</td>
                <td>
                    <span class="badge bg-${driver.activo ? 'success' : 'danger'}">
                        ${driver.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="TransportistasManager.viewDriver(${driver.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="TransportistasManager.editDriver(${driver.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="TransportistasManager.deleteDriver(${driver.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Generate mobile cards
        this.updateMobileTransportistasCards();
    }

    updateMobileTransportistasCards() {
        const mobileView = document.querySelector('#mobileTransportistasView');
        if (!mobileView) return;

        if (!this.drivers || this.drivers.length === 0) {
            mobileView.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5>No hay transportistas</h5>
                    <p class="text-muted">No se encontraron transportistas registrados</p>
                </div>
            `;
            return;
        }

        mobileView.innerHTML = this.drivers.map(driver => `
            <div class="mobile-expense-card">
                <div class="mobile-expense-header">
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="width: 40px; height: 40px; font-size: 1rem;">
                            ${this.getInitials(driver.nombre)}
                        </div>
                        <div>
                            <div class="mobile-expense-amount">${driver.nombre}</div>
                            <div class="mobile-expense-date">${driver.email}</div>
                        </div>
                    </div>
                    <span class="badge bg-${driver.activo ? 'success' : 'danger'}">
                        ${driver.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <small class="text-muted">ID:</small><br>
                        <strong>#${String(driver.id).padStart(3, '0')}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Teléfono:</small><br>
                        <strong>${this.formatPhoneWithFlag(driver.telefono)}</strong>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <small class="text-muted">Licencia:</small><br>
                        <strong>${driver.licencia || 'N/A'}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Vehículo:</small><br>
                        <strong>${driver.vehiculo_asignado || 'Sin asignar'}</strong>
                    </div>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-outline-primary btn-sm flex-fill" onclick="TransportistasManager.viewDriver(${driver.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-outline-warning btn-sm flex-fill" onclick="TransportistasManager.editDriver(${driver.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm flex-fill" onclick="TransportistasManager.deleteDriver(${driver.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    openAddModal() {
        // Modal completamente nuevo con estilos inline forzados
        const modalHtml = `
            <div class="modal fade" id="driverModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">🚛 Agregar Nuevo Transportista</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="driverForm">
                            <div class="modal-body">
                                <!-- Área de alertas dentro del modal -->
                                <div id="modalAlerts" class="mb-3" style="display: none;">
                                    <div class="alert alert-danger" role="alert">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span id="modalErrorMessage"></span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Nombre Completo *</label>
                                    <input type="text" class="form-control" id="nombreCompleto" name="nombre" required 
                                           placeholder="Ej: Juan Pérez, María González">
                                    <small class="text-muted">Solo letras, espacios y comas</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" name="email" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Teléfono</label>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="country-select-wrapper">
                                                <div class="country-select-display" id="countryDisplay" onclick="window.toggleCountryDropdown()">
                                                    <img src="https://flagcdn.com/w40/mx.png" alt="México" style="width: 24px; height: 18px; margin-right: 8px;">
                                                    <span>México (+52)</span>
                                                    <i class="fas fa-chevron-down ms-auto"></i>
                                                </div>
                                                <select class="form-select d-none" id="countryCode" name="country_code">
                                                    <option value="+52|10" selected>México (+52)</option>
                                                    <option value="+1|10">USA (+1)</option>
                                                    <option value="+1|10">Canadá (+1)</option>
                                                    <option value="+86|11">China (+86)</option>
                                                    <option value="+81|10">Japón (+81)</option>
                                                    <option value="+49|11">Alemania (+49)</option>
                                                    <option value="+33|10">Francia (+33)</option>
                                                    <option value="+44|10">Reino Unido (+44)</option>
                                                    <option value="+39|10">Italia (+39)</option>
                                                    <option value="+34|9">España (+34)</option>
                                                    <option value="+55|11">Brasil (+55)</option>
                                                    <option value="+54|10">Argentina (+54)</option>
                                                    <option value="+57|10">Colombia (+57)</option>
                                                    <option value="+51|9">Perú (+51)</option>
                                                    <option value="+56|9">Chile (+56)</option>
                                                </select>
                                                <div class="dropdown-menu w-100 d-none" id="countryDropdown" style="max-height: 200px; overflow-y: auto; position: absolute; z-index: 1050; border-radius: 0.375rem;">
                                                    <div class="dropdown-item" onclick="window.selectCountry('+52|10', 'mx', 'México')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/mx.png" alt="México" style="width: 24px; height: 18px; margin-right: 8px;"> México (+52)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+1|10', 'us', 'USA')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/us.png" alt="USA" style="width: 24px; height: 18px; margin-right: 8px;"> USA (+1)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+1|10', 'ca', 'Canadá')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/ca.png" alt="Canadá" style="width: 24px; height: 18px; margin-right: 8px;"> Canadá (+1)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+86|11', 'cn', 'China')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/cn.png" alt="China" style="width: 24px; height: 18px; margin-right: 8px;"> China (+86)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+81|10', 'jp', 'Japón')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/jp.png" alt="Japón" style="width: 24px; height: 18px; margin-right: 8px;"> Japón (+81)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+49|11', 'de', 'Alemania')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/de.png" alt="Alemania" style="width: 24px; height: 18px; margin-right: 8px;"> Alemania (+49)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+33|10', 'fr', 'Francia')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/fr.png" alt="Francia" style="width: 24px; height: 18px; margin-right: 8px;"> Francia (+33)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+44|10', 'gb', 'Reino Unido')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/gb.png" alt="Reino Unido" style="width: 24px; height: 18px; margin-right: 8px;"> Reino Unido (+44)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+39|10', 'it', 'Italia')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/it.png" alt="Italia" style="width: 24px; height: 18px; margin-right: 8px;"> Italia (+39)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+34|9', 'es', 'España')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/es.png" alt="España" style="width: 24px; height: 18px; margin-right: 8px;"> España (+34)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+55|11', 'br', 'Brasil')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/br.png" alt="Brasil" style="width: 24px; height: 18px; margin-right: 8px;"> Brasil (+55)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+54|10', 'ar', 'Argentina')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/ar.png" alt="Argentina" style="width: 24px; height: 18px; margin-right: 8px;"> Argentina (+54)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+57|10', 'co', 'Colombia')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/co.png" alt="Colombia" style="width: 24px; height: 18px; margin-right: 8px;"> Colombia (+57)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+51|9', 'pe', 'Perú')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/pe.png" alt="Perú" style="width: 24px; height: 18px; margin-right: 8px;"> Perú (+51)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectCountry('+56|9', 'cl', 'Chile')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/cl.png" alt="Chile" style="width: 24px; height: 18px; margin-right: 8px;"> Chile (+56)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-8">
                                            <input type="tel" class="form-control" id="phoneNumber" name="telefono" 
                                                   placeholder="Ingresa número telefónico" maxlength="11">
                                            <small class="text-muted" id="phoneHelp">México: 10 dígitos</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Número de Licencia</label>
                                    <input type="text" class="form-control" name="licencia">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Contraseña Inicial *</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="password" name="password" required minlength="3">
                                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <small class="text-muted">Mínimo 3 caracteres</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Confirmar Contraseña *</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="confirmPassword" name="confirm_password" required minlength="3">
                                        <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <div id="passwordError" class="mt-1" style="display: none; font-size: 0.875rem; font-weight: 500;">
                                        <i class="fas fa-times-circle me-1"></i>
                                        Las contraseñas no coinciden
                                    </div>
                                    <small class="text-muted">Debe coincidir exactamente con la contraseña anterior</small>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Guardar Transportista</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('driverModal'));
        modal.show();

        // Configurar eventos inmediatamente después de mostrar el modal
        setTimeout(() => {
            this.forceSetupModal();
            this.autoFixPasswordButtons();
        }, 100);
        
        // Configurar botones adicionales con más tiempo
        setTimeout(() => {
            this.autoFixPasswordButtons();
        }, 500);
        
        // Y una vez más para asegurar
        setTimeout(() => {
            this.autoFixPasswordButtons();
        }, 1000);

        document.getElementById('driverModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // Función para mostrar mensajes dentro del modal
    showModalError(message) {
        const modalAlerts = document.getElementById('modalAlerts');
        const modalErrorMessage = document.getElementById('modalErrorMessage');
        
        if (modalAlerts && modalErrorMessage) {
            modalErrorMessage.textContent = message;
            modalAlerts.style.display = 'block';
            
            // Scroll al top del modal para que se vea el mensaje
            const modalBody = document.querySelector('#driverModal .modal-body');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
        }
    }

    // Función para ocultar mensajes del modal
    hideModalError() {
        const modalAlerts = document.getElementById('modalAlerts');
        if (modalAlerts) {
            modalAlerts.style.display = 'none';
        }
    }

    async handleSubmit(e, modal) {
        e.preventDefault();
        
        // Obtener valores de múltiples formas para asegurar que funcione
        const formData = new FormData(e.target);
        let password = formData.get('password') || '';
        let confirmPassword = formData.get('confirm_password') || '';
        
        // Si FormData no funciona, obtener directamente de los elementos
        if (!password) {
            const passwordElement = document.getElementById('password');
            password = passwordElement ? passwordElement.value : '';
        }
        
        if (!confirmPassword) {
            const confirmElement = document.getElementById('confirmPassword');
            confirmPassword = confirmElement ? confirmElement.value : '';
        }
        
        // Debug para ver qué valores estamos obteniendo
        console.log('🔍 Debug contraseñas:');
        console.log('Password:', password);
        console.log('Confirm Password:', confirmPassword);
        console.log('Password length:', password.length);
        console.log('Confirm Password length:', confirmPassword.length);
        
        // Debug adicional - verificar elementos DOM
        const passwordElement = document.getElementById('password');
        const confirmElement = document.getElementById('confirmPassword');
        console.log('🔍 Debug elementos DOM:');
        console.log('Password element exists:', !!passwordElement);
        console.log('Confirm element exists:', !!confirmElement);
        if (passwordElement) console.log('Password element value:', passwordElement.value);
        if (confirmElement) console.log('Confirm element value:', confirmElement.value);
        
        // Validación simplificada y directa
        console.log('🔍 Iniciando validación...');
        
        if (password.length === 0) {
            console.log('❌ Password vacío');
            this.showModalError('Por favor ingresa una contraseña');
            return;
        }
        
        if (password.length < 3) {
            console.log('❌ Password muy corto:', password.length);
            this.showModalError('La contraseña debe tener al menos 3 caracteres');
            return;
        }
        
        if (confirmPassword.length === 0) {
            console.log('❌ Confirm password vacío');
            this.showModalError('Por favor confirma la contraseña');
            return;
        }
        
        if (password !== confirmPassword) {
            console.log('❌ Passwords no coinciden');
            console.log('Password:', `"${password}"`);
            console.log('Confirm:', `"${confirmPassword}"`);
            this.showModalError('Las contraseñas no coinciden');
            return;
        }
        
        console.log('✅ Validación de contraseñas exitosa');
        
        // Validar teléfono
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput.value && !this.validatePhoneNumber()) {
            this.showModalError('Número de teléfono inválido');
            return;
        }
        
        // Limpiar mensajes de error si llegamos aquí
        this.hideModalError();
        
        // Usar la misma formData que ya creamos arriba
        
        // Combinar código de país con número SIEMPRE con lada
        const countryCode = formData.get('country_code').split('|')[0];
        const phoneNumber = formData.get('telefono');
        const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
        
        console.log(`📞 Guardando teléfono con lada: "${fullPhone}"`);
        console.log(`📞 Código país: "${countryCode}", Número: "${phoneNumber}"`);
        
        const driverData = {
            nombre: formData.get('nombre') || '',
            email: formData.get('email') || '',
            telefono: fullPhone || '+52 0000000000', // Teléfono por defecto si está vacío
            licencia: formData.get('licencia') || 'SIN-LICENCIA', // Licencia por defecto
            password: formData.get('password') || 'defaultpass123'
        };

        console.log('📋 Datos a enviar:', driverData);
        console.log('📝 FormData completo:', Object.fromEntries(formData));

        // Validar campos requeridos (según la API: nombre, email, telefono, licencia)
        if (!driverData.nombre || !driverData.email) {
            console.error('❌ Faltan campos requeridos:', { 
                nombre: !!driverData.nombre, 
                email: !!driverData.email,
                telefono: !!driverData.telefono,
                licencia: !!driverData.licencia
            });
            window.app.showToast('Por favor completa el nombre y email', 'danger');
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(driverData.email)) {
            console.error('❌ Email inválido:', driverData.email);
            window.app.showToast('Por favor ingresa un email válido', 'danger');
            return;
        }

        try {
            console.log('🚀 Iniciando envío de datos...');
            window.app.showToast('Guardando transportista...', 'info');
            
            console.log('📡 Llamando a la API...');
            const response = await window.app.apiCall('transportistas/create.php', {
                method: 'POST',
                body: JSON.stringify(driverData)
            });

            console.log('📥 Respuesta de la API:', response);

            if (response.success) {
                console.log('✅ Transportista creado exitosamente');
                window.app.showToast('✅ Transportista creado exitosamente', 'success');
                modal.hide();
                this.loadData();
            } else {
                console.error('❌ Error en la respuesta:', response);
                window.app.showToast('Error: ' + (response.message || 'Error desconocido'), 'danger');
            }
        } catch (error) {
            console.error('💥 Error en el envío:', error);
            console.error('💥 Stack trace:', error.stack);
            window.app.showToast('Error al crear transportista: ' + error.message, 'danger');
            
            // Intentar envío alternativo como prueba
            console.log('🔄 Intentando método alternativo...');
            try {
                const testResponse = await fetch('/LogisticaFinal/api/transportistas/create.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(driverData)
                });
                
                console.log('🧪 Respuesta de prueba:', testResponse.status, testResponse.statusText);
                const testData = await testResponse.text();
                console.log('🧪 Datos de prueba:', testData);
                
            } catch (testError) {
                console.error('🧪 Error en prueba:', testError);
            }
        }
    }

    static viewDriver(id) {
        const driver = window.TransportistasManager.drivers.find(d => d.id === id);
        if (!driver) return;

        const modalHtml = `
            <div class="modal fade" id="viewDriverModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles del Transportista</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <div class="user-avatar mx-auto mb-2" style="width: 60px; height: 60px; font-size: 1.5rem;">
                                    ${window.TransportistasManager.getInitials(driver.nombre)}
                                </div>
                                <h5>${driver.nombre}</h5>
                                <span class="badge bg-${driver.activo ? 'success' : 'danger'}">
                                    ${driver.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Email:</strong> ${driver.email}</p>
                                    <p><strong>Teléfono:</strong> ${this.formatPhoneWithFlag(driver.telefono)}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Licencia:</strong> ${driver.licencia || 'N/A'}</p>
                                    <p><strong>Fecha de registro:</strong> ${window.TransportistasManager.formatDate(driver.fecha_registro)}</p>
                                </div>
                            </div>
                            <p><strong>Vehículo asignado:</strong> ${driver.vehiculo_asignado || 'Sin asignar'}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-warning" onclick="TransportistasManager.editDriver(${driver.id})">Editar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('viewDriverModal'));
        modal.show();

        document.getElementById('viewDriverModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static editDriver(id) {
        const driver = window.TransportistasManager.drivers.find(d => d.id === id);
        if (!driver) return;

        const modalHtml = `
            <div class="modal fade" id="editDriverModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">✏️ Editar Transportista</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editDriverForm">
                            <div class="modal-body">
                                <input type="hidden" name="id" value="${driver.id}">
                                <div class="mb-3">
                                    <label class="form-label">Nombre Completo *</label>
                                    <input type="text" class="form-control" name="nombre" value="${driver.nombre}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" name="email" value="${driver.email}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Teléfono</label>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="country-select-wrapper">
                                                <div class="country-select-display" id="editCountryDisplay" onclick="window.toggleEditCountryDropdown()">
                                                    <img src="https://flagcdn.com/w40/mx.png" alt="México" style="width: 24px; height: 18px; margin-right: 8px;">
                                                    <span>México (+52)</span>
                                                    <i class="fas fa-chevron-down ms-auto"></i>
                                                </div>
                                                <select class="form-select d-none" id="editCountryCode" name="country_code">
                                                    <option value="+52|10" selected>México (+52)</option>
                                                    <option value="+1|10">USA (+1)</option>
                                                    <option value="+1|10">Canadá (+1)</option>
                                                    <option value="+86|11">China (+86)</option>
                                                    <option value="+81|10">Japón (+81)</option>
                                                    <option value="+49|11">Alemania (+49)</option>
                                                    <option value="+33|10">Francia (+33)</option>
                                                    <option value="+44|10">Reino Unido (+44)</option>
                                                    <option value="+39|10">Italia (+39)</option>
                                                    <option value="+34|9">España (+34)</option>
                                                    <option value="+55|11">Brasil (+55)</option>
                                                    <option value="+54|10">Argentina (+54)</option>
                                                    <option value="+57|10">Colombia (+57)</option>
                                                    <option value="+51|9">Perú (+51)</option>
                                                    <option value="+56|9">Chile (+56)</option>
                                                </select>
                                                <div class="dropdown-menu w-100 d-none" id="editCountryDropdown" style="max-height: 200px; overflow-y: auto; position: absolute; z-index: 1050; border-radius: 0.375rem;">
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+52|10', 'mx', 'México')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/mx.png" alt="México" style="width: 24px; height: 18px; margin-right: 8px;"> México (+52)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+1|10', 'us', 'USA')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/us.png" alt="USA" style="width: 24px; height: 18px; margin-right: 8px;"> USA (+1)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+1|10', 'ca', 'Canadá')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/ca.png" alt="Canadá" style="width: 24px; height: 18px; margin-right: 8px;"> Canadá (+1)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+86|11', 'cn', 'China')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/cn.png" alt="China" style="width: 24px; height: 18px; margin-right: 8px;"> China (+86)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+81|10', 'jp', 'Japón')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/jp.png" alt="Japón" style="width: 24px; height: 18px; margin-right: 8px;"> Japón (+81)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+49|11', 'de', 'Alemania')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/de.png" alt="Alemania" style="width: 24px; height: 18px; margin-right: 8px;"> Alemania (+49)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+33|10', 'fr', 'Francia')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/fr.png" alt="Francia" style="width: 24px; height: 18px; margin-right: 8px;"> Francia (+33)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+44|10', 'gb', 'Reino Unido')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/gb.png" alt="Reino Unido" style="width: 24px; height: 18px; margin-right: 8px;"> Reino Unido (+44)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+39|10', 'it', 'Italia')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/it.png" alt="Italia" style="width: 24px; height: 18px; margin-right: 8px;"> Italia (+39)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+34|9', 'es', 'España')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/es.png" alt="España" style="width: 24px; height: 18px; margin-right: 8px;"> España (+34)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+55|11', 'br', 'Brasil')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/br.png" alt="Brasil" style="width: 24px; height: 18px; margin-right: 8px;"> Brasil (+55)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+54|10', 'ar', 'Argentina')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/ar.png" alt="Argentina" style="width: 24px; height: 18px; margin-right: 8px;"> Argentina (+54)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+57|10', 'co', 'Colombia')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/co.png" alt="Colombia" style="width: 24px; height: 18px; margin-right: 8px;"> Colombia (+57)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+51|9', 'pe', 'Perú')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/pe.png" alt="Perú" style="width: 24px; height: 18px; margin-right: 8px;"> Perú (+51)
                                                    </div>
                                                    <div class="dropdown-item" onclick="window.selectEditCountry('+56|9', 'cl', 'Chile')" style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center;">
                                                        <img src="https://flagcdn.com/w40/cl.png" alt="Chile" style="width: 24px; height: 18px; margin-right: 8px;"> Chile (+56)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-8">
                                            <input type="tel" class="form-control" id="editPhoneNumber" name="telefono" 
                                                   placeholder="Ingresa número telefónico" maxlength="10">
                                            <small class="text-muted" id="editPhoneHelp">México: exactamente 10 dígitos</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Número de Licencia</label>
                                    <input type="text" class="form-control" name="licencia" value="${driver.licencia || ''}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-control" name="activo">
                                        <option value="1" ${driver.activo ? 'selected' : ''}>Activo</option>
                                        <option value="0" ${!driver.activo ? 'selected' : ''}>Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editDriverModal'));
        modal.show();

        // Setup form handler
        document.getElementById('editDriverForm').addEventListener('submit', (e) => window.TransportistasManager.handleEdit(e, modal));

        // Configurar validación de teléfono para edición
        setTimeout(() => {
            window.TransportistasManager.setupEditPhoneValidation(driver.telefono);
        }, 100);

        document.getElementById('editDriverModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async handleEdit(e, modal) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Combinar código de país con número para edición
        const countryCode = formData.get('country_code') ? formData.get('country_code').split('|')[0] : '+52';
        const phoneNumber = formData.get('telefono');
        const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
        
        console.log(`📞 Editando teléfono con lada: "${fullPhone}"`);
        console.log(`📞 Código país: "${countryCode}", Número: "${phoneNumber}"`);
        
        const driverData = {
            id: parseInt(formData.get('id')),
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: fullPhone, // Usar teléfono con lada
            licencia: formData.get('licencia'),
            activo: parseInt(formData.get('activo'))
        };
        
        console.log('📋 Datos de edición a enviar:', driverData);

        try {
            window.app.showToast('Actualizando transportista...', 'info');
            
            const response = await window.app.apiCall('/LogisticaFinal/api/transportistas/update.php', {
                method: 'POST',
                body: JSON.stringify(driverData)
            });

            if (response.success) {
                window.app.showToast('✅ Transportista actualizado exitosamente', 'success');
                modal.hide();
                this.loadData();
            }
        } catch (error) {
            window.app.showToast('Error al actualizar transportista: ' + error.message, 'danger');
        }
    }


    static async deleteDriver(id) {
        const driver = window.TransportistasManager.drivers.find(d => d.id === id);
        if (!driver) return;

        // Usar modal personalizado en lugar de confirm nativo
        window.app.showConfirmModal(
            '🗑️ Eliminar Transportista',
            `¿Estás seguro de eliminar este transportista?<br><br>
            <strong>Nombre:</strong> ${driver.nombre}<br>
            <strong>Email:</strong> ${driver.email}<br>
            <strong>Estado:</strong> ${driver.activo ? 'Activo' : 'Inactivo'}`,
            'Eliminar',
            'danger',
            async () => {
                try {
                    console.log('🗑️ Eliminando transportista ID:', id);
                    console.log('📋 Datos a enviar:', { id });
                    
                    const response = await window.app.apiCall('/LogisticaFinal/api/transportistas/delete.php', {
                        method: 'POST',
                        body: JSON.stringify({ id: parseInt(id) })
                    });
                    
                    console.log('📥 Respuesta del servidor:', response);

                    window.app.showToast('Transportista eliminado correctamente', 'success');
                    window.TransportistasManager.loadData();
                } catch (error) {
                    window.app.showToast('Error al eliminar transportista: ' + error.message, 'danger');
                }
            }
        );
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    formatPhoneWithFlag(phone) {
        if (!phone || phone === 'N/A') {
            return 'N/A';
        }

        // Mapear códigos de país a banderas (imágenes reales)
        const countryFlags = {
            '+52': { flag: 'mx', name: 'México' },
            '+1': { flag: 'us', name: 'USA' },
            '+86': { flag: 'cn', name: 'China' },
            '+81': { flag: 'jp', name: 'Japón' },
            '+49': { flag: 'de', name: 'Alemania' },
            '+33': { flag: 'fr', name: 'Francia' },
            '+44': { flag: 'gb', name: 'Reino Unido' },
            '+39': { flag: 'it', name: 'Italia' },
            '+34': { flag: 'es', name: 'España' },
            '+55': { flag: 'br', name: 'Brasil' },
            '+54': { flag: 'ar', name: 'Argentina' },
            '+57': { flag: 'co', name: 'Colombia' },
            '+51': { flag: 'pe', name: 'Perú' },
            '+56': { flag: 'cl', name: 'Chile' }
        };

        // Buscar el código de país en el teléfono
        for (const [code, country] of Object.entries(countryFlags)) {
            if (phone.startsWith(code)) {
                // Retornar bandera imagen + teléfono en la misma línea con estilos más fuertes
                return `<div style="display: inline-flex !important; align-items: center !important; white-space: nowrap !important; gap: 8px;"><img src="https://flagcdn.com/w20/${country.flag}.png" alt="${country.name}" style="width: 20px; height: 15px; flex-shrink: 0; border-radius: 2px; display: inline-block; vertical-align: middle;"><span style="display: inline-block; vertical-align: middle;">${phone}</span></div>`;
            }
        }

        // Si no se encuentra código, mostrar solo el teléfono
        return phone;
    }

    forceSetupModal() {
        console.log('🚀 CONFIGURANDO modal simplificado...');
        
        // Esperar un momento para que el DOM esté listo
        setTimeout(() => {
            // 1. BOTONES DE CONTRASEÑA - MÉTODO MÁS ROBUSTO
            const togglePassword = document.getElementById('togglePassword');
            const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
            
            if (togglePassword) {
                // Clonar para eliminar eventos anteriores
                const newTogglePassword = togglePassword.cloneNode(true);
                togglePassword.parentNode.replaceChild(newTogglePassword, togglePassword);
                
                newTogglePassword.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const input = document.getElementById('password');
                    const icon = this.querySelector('i');
                    
                    if (input && icon) {
                        if (input.type === 'password') {
                            input.type = 'text';
                            icon.className = 'fas fa-eye-slash';
                            console.log('👁️ Contraseña VISIBLE');
                        } else {
                            input.type = 'password';
                            icon.className = 'fas fa-eye';
                            console.log('👁️ Contraseña OCULTA');
                        }
                    }
                });
                console.log('✅ Botón contraseña configurado');
            }
            
            if (toggleConfirmPassword) {
                // Clonar para eliminar eventos anteriores
                const newToggleConfirmPassword = toggleConfirmPassword.cloneNode(true);
                toggleConfirmPassword.parentNode.replaceChild(newToggleConfirmPassword, toggleConfirmPassword);
                
                newToggleConfirmPassword.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const input = document.getElementById('confirmPassword');
                    const icon = this.querySelector('i');
                    
                    if (input && icon) {
                        if (input.type === 'password') {
                            input.type = 'text';
                            icon.className = 'fas fa-eye-slash';
                            console.log('👁️ Confirmar contraseña VISIBLE');
                        } else {
                            input.type = 'password';
                            icon.className = 'fas fa-eye';
                            console.log('👁️ Confirmar contraseña OCULTA');
                        }
                    }
                });
                console.log('✅ Botón confirmar contraseña configurado');
            }
            
            // 2. VALIDACIÓN DE CONTRASEÑAS CON COLORES
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            const passwordError = document.getElementById('passwordError');
            
            if (password && confirmPassword && passwordError) {
                const validatePasswords = () => {
                    const pass1 = password.value;
                    const pass2 = confirmPassword.value;
                    
                    // Limpiar clases anteriores
                    confirmPassword.classList.remove('is-invalid', 'is-valid');
                    
                    if (pass2.length === 0) {
                        // Sin valor, sin validación visual
                        passwordError.style.display = 'none';
                        return;
                    }
                    
                    if (pass1 !== pass2) {
                        // Contraseñas no coinciden - ROJO
                        confirmPassword.classList.add('is-invalid');
                        confirmPassword.style.borderColor = '#dc3545';
                        confirmPassword.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
                        passwordError.style.display = 'block';
                        passwordError.innerHTML = '<i class="fas fa-times-circle me-1"></i>Las contraseñas no coinciden';
                        passwordError.style.color = '#dc3545';
                    } else if (pass1.length >= 3 && pass2.length >= 3) {
                        // Contraseñas coinciden y válidas - VERDE
                        confirmPassword.classList.add('is-valid');
                        confirmPassword.style.borderColor = '#198754';
                        confirmPassword.style.boxShadow = '0 0 0 0.2rem rgba(25, 135, 84, 0.25)';
                        passwordError.style.display = 'block';
                        passwordError.innerHTML = '<i class="fas fa-check-circle me-1"></i>Las contraseñas coinciden perfectamente';
                        passwordError.style.color = '#198754';
                    } else {
                        // Muy cortas
                        confirmPassword.classList.add('is-invalid');
                        confirmPassword.style.borderColor = '#ffc107';
                        confirmPassword.style.boxShadow = '0 0 0 0.2rem rgba(255, 193, 7, 0.25)';
                        passwordError.style.display = 'block';
                        passwordError.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Mínimo 3 caracteres';
                        passwordError.style.color = '#ffc107';
                    }
                };
                
                // Validar también la contraseña principal
                const validateMainPassword = () => {
                    const pass1 = password.value;
                    
                    // Limpiar clases anteriores
                    password.classList.remove('is-invalid', 'is-valid');
                    
                    if (pass1.length === 0) {
                        return;
                    }
                    
                    if (pass1.length >= 3) {
                        // Contraseña válida - VERDE
                        password.classList.add('is-valid');
                        password.style.borderColor = '#198754';
                        password.style.boxShadow = '0 0 0 0.2rem rgba(25, 135, 84, 0.25)';
                    } else {
                        // Muy corta - AMARILLO
                        password.classList.add('is-invalid');
                        password.style.borderColor = '#ffc107';
                        password.style.boxShadow = '0 0 0 0.2rem rgba(255, 193, 7, 0.25)';
                    }
                    
                    // Re-validar confirmación cuando cambie la principal
                    validatePasswords();
                };
                
                password.addEventListener('input', validateMainPassword);
                confirmPassword.addEventListener('input', validatePasswords);
            }
            
            // 3. VALIDACIÓN DE NOMBRES
            const nombreCompleto = document.getElementById('nombreCompleto');
            if (nombreCompleto) {
                nombreCompleto.addEventListener('input', function() {
                    const original = this.value;
                    const filtered = original.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s,\.]/g, '');
                    
                    if (original !== filtered) {
                        this.value = filtered;
                        this.style.borderColor = '#f59e0b';
                        setTimeout(() => { this.style.borderColor = ''; }, 500);
                    }
                });
                console.log('✅ Validación de nombres configurada');
            }
            
            // 4. VALIDACIÓN DE TELÉFONO
            const phoneInput = document.getElementById('phoneNumber');
            const countrySelect = document.getElementById('countryCode');
            
            if (phoneInput && countrySelect) {
                phoneInput.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '');
                    const [code, digits] = countrySelect.value.split('|');
                    const expected = parseInt(digits);
                    
                    if (this.value.length === expected) {
                        this.classList.add('is-valid');
                        this.classList.remove('is-invalid');
                    } else if (this.value.length > 0) {
                        this.classList.add('is-invalid');
                        this.classList.remove('is-valid');
                    } else {
                        this.classList.remove('is-valid', 'is-invalid');
                    }
                });
                console.log('✅ Validación de teléfono configurada');
            }
            
            // 5. FORM SUBMIT
            const form = document.getElementById('driverForm');
            if (form) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('driverModal'));
                
                // Clonar form para eliminar eventos anteriores
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                newForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.log('📝 Formulario enviado');
                    window.TransportistasManager.handleSubmit(e, modal);
                });
                console.log('✅ Form submit configurado');
            }
            
            console.log('✅ Modal configurado correctamente');
        }, 200);
    }

    autoFixPasswordButtons() {
        console.log('🔧 Auto-arreglando botones de contraseña...');
        
        // Buscar el modal activo de múltiples formas
        const modal = document.getElementById('driverModal') || 
                     document.querySelector('.modal.show') || 
                     document.querySelector('[id*="modal"]');
        
        if (!modal) {
            console.error('❌ Modal no encontrado');
            return;
        }
        
        console.log('✅ Modal encontrado:', modal.id || 'sin ID');
        
        const modalButtons = modal.querySelectorAll('button');
        const modalPasswordInputs = modal.querySelectorAll('input[type="password"]');
        
        console.log(`🔍 Encontrados ${modalButtons.length} botones y ${modalPasswordInputs.length} inputs`);
        
        if (modalPasswordInputs.length === 0) {
            console.error('❌ No se encontraron inputs de contraseña');
            return;
        }
        
        // Configurar botones con íconos de ojo
        let eyeButtonCount = 0;
        modalButtons.forEach((btn, btnIndex) => {
            const icon = btn.querySelector('i.fa-eye, i.fa-eye-slash');
            if (icon && eyeButtonCount < modalPasswordInputs.length) {
                const targetInput = modalPasswordInputs[eyeButtonCount];
                
                console.log(`👁️ Auto-configurando botón #${btnIndex} para input ${targetInput.id || 'sin ID'}`);
                
                // Método directo sin clonar
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentIcon = this.querySelector('i');
                    
                    console.log(`🔥 CLICK DETECTADO en botón #${btnIndex}!`);
                    console.log(`📋 Input type actual: ${targetInput.type}`);
                    
                    if (targetInput.type === 'password') {
                        targetInput.type = 'text';
                        if (currentIcon) {
                            currentIcon.classList.remove('fa-eye');
                            currentIcon.classList.add('fa-eye-slash');
                        }
                        console.log(`✅ Contraseña ${eyeButtonCount} -> VISIBLE`);
                    } else {
                        targetInput.type = 'password';
                        if (currentIcon) {
                            currentIcon.classList.remove('fa-eye-slash');
                            currentIcon.classList.add('fa-eye');
                        }
                        console.log(`✅ Contraseña ${eyeButtonCount} -> OCULTA`);
                    }
                };
                
                // También agregar event listener como backup
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log(`🔄 Event listener backup para botón #${btnIndex}`);
                });
                
                eyeButtonCount++;
            }
        });
        
        console.log(`🎉 ${eyeButtonCount} botones auto-configurados correctamente`);
        
        // También configurar validación inicial de teléfono para México
        this.setupInitialPhoneValidation();
    }
    
    setupInitialPhoneValidation() {
        const phoneInput = document.getElementById('phoneNumber');
        const countrySelect = document.getElementById('countryCode');
        
        if (phoneInput && countrySelect) {
            // México por defecto (10 dígitos)
            const defaultDigits = 10;
            const defaultCountry = 'México';
            
            console.log(`📞 Configurando validación inicial: ${defaultCountry} - ${defaultDigits} dígitos`);
            
            phoneInput.setAttribute('maxlength', defaultDigits);
            phoneInput.maxLength = defaultDigits;
            phoneInput.placeholder = `Exactamente ${defaultDigits} dígitos`;
            
            const phoneHelp = document.getElementById('phoneHelp');
            if (phoneHelp) {
                phoneHelp.textContent = `${defaultCountry}: exactamente ${defaultDigits} dígitos`;
            }
            
            // Configurar validación estricta inicial
            window.setupPhoneValidation(phoneInput, defaultDigits, defaultCountry);
        }
    }

    setupEditPhoneValidation(currentPhone) {
        console.log('📞 Configurando validación para modal de edición...');
        
        // Parsear el teléfono actual para detectar el país
        let detectedCountry = '+52|10'; // México por defecto
        let phoneNumber = '';
        
        if (currentPhone) {
            console.log(`🔍 Analizando teléfono: "${currentPhone}"`);
            
            // Limpiar espacios y caracteres especiales para análisis
            const cleanPhone = currentPhone.replace(/\s+/g, ' ').trim();
            
            // Intentar detectar el código de país del teléfono actual
            if (cleanPhone.startsWith('+52')) {
                detectedCountry = '+52|10';
                phoneNumber = cleanPhone.replace('+52', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+1')) {
                detectedCountry = '+1|10';
                phoneNumber = cleanPhone.replace('+1', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+86')) {
                detectedCountry = '+86|11';
                phoneNumber = cleanPhone.replace('+86', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+81')) {
                detectedCountry = '+81|10';
                phoneNumber = cleanPhone.replace('+81', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+49')) {
                detectedCountry = '+49|11';
                phoneNumber = cleanPhone.replace('+49', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+33')) {
                detectedCountry = '+33|10';
                phoneNumber = cleanPhone.replace('+33', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+44')) {
                detectedCountry = '+44|10';
                phoneNumber = cleanPhone.replace('+44', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+39')) {
                detectedCountry = '+39|10';
                phoneNumber = cleanPhone.replace('+39', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+34')) {
                detectedCountry = '+34|9';
                phoneNumber = cleanPhone.replace('+34', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+55')) {
                detectedCountry = '+55|11';
                phoneNumber = cleanPhone.replace('+55', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+54')) {
                detectedCountry = '+54|10';
                phoneNumber = cleanPhone.replace('+54', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+57')) {
                detectedCountry = '+57|10';
                phoneNumber = cleanPhone.replace('+57', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+51')) {
                detectedCountry = '+51|9';
                phoneNumber = cleanPhone.replace('+51', '').trim().replace(/\D/g, '');
            } else if (cleanPhone.startsWith('+56')) {
                detectedCountry = '+56|9';
                phoneNumber = cleanPhone.replace('+56', '').trim().replace(/\D/g, '');
            } else {
                // Si no se detecta código, asumir que es solo el número (México por defecto)
                phoneNumber = cleanPhone.replace(/\D/g, '');
                console.log('⚠️ No se detectó código de país, usando México por defecto');
            }
            
            console.log(`🎯 País detectado: ${detectedCountry}, Número: "${phoneNumber}"`);
        }
        
        console.log(`📱 Teléfono detectado: ${detectedCountry} - ${phoneNumber}`);
        
        // Configurar el select y display
        const editCountrySelect = document.getElementById('editCountryCode');
        const editPhoneInput = document.getElementById('editPhoneNumber');
        
        if (editCountrySelect && editPhoneInput) {
            editCountrySelect.value = detectedCountry;
            editPhoneInput.value = phoneNumber;
            
            // Configurar el país seleccionado
            const [code, digits] = detectedCountry.split('|');
            const expectedDigits = parseInt(digits);
            
            // Mapear códigos a países y banderas
            const countryMap = {
                '+52': { name: 'México', flag: 'mx' },
                '+1': { name: 'USA', flag: 'us' },
                '+86': { name: 'China', flag: 'cn' },
                '+81': { name: 'Japón', flag: 'jp' },
                '+49': { name: 'Alemania', flag: 'de' },
                '+33': { name: 'Francia', flag: 'fr' },
                '+44': { name: 'Reino Unido', flag: 'gb' },
                '+39': { name: 'Italia', flag: 'it' },
                '+34': { name: 'España', flag: 'es' },
                '+55': { name: 'Brasil', flag: 'br' },
                '+54': { name: 'Argentina', flag: 'ar' },
                '+57': { name: 'Colombia', flag: 'co' },
                '+51': { name: 'Perú', flag: 'pe' },
                '+56': { name: 'Chile', flag: 'cl' }
            };
            
            const country = countryMap[code] || { name: 'México', flag: 'mx' };
            
            // Actualizar el display
            const editDisplay = document.getElementById('editCountryDisplay');
            if (editDisplay) {
                editDisplay.innerHTML = `
                    <img src="https://flagcdn.com/w40/${country.flag}.png" alt="${country.name}" style="width: 24px; height: 18px; margin-right: 8px;">
                    <span>${country.name} (${code})</span>
                    <i class="fas fa-chevron-down ms-auto"></i>
                `;
            }
            
            // Configurar validación
            editPhoneInput.setAttribute('maxlength', expectedDigits);
            editPhoneInput.maxLength = expectedDigits;
            editPhoneInput.placeholder = `Exactamente ${expectedDigits} dígitos`;
            
            const editPhoneHelp = document.getElementById('editPhoneHelp');
            if (editPhoneHelp) {
                editPhoneHelp.textContent = `${country.name}: exactamente ${expectedDigits} dígitos`;
            }
            
            // Configurar validación estricta
            window.setupEditPhoneValidation(editPhoneInput, expectedDigits, country.name);
        }
    }

    setupModalEventListeners() {
        
        // Password validation
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const passwordError = document.getElementById('passwordError');

        if (password && confirmPassword && passwordError) {
            const submitButton = document.querySelector('#driverForm button[type="submit"]');
            
            const validatePasswords = () => {
                const passwordValue = password.value;
                const confirmPasswordValue = confirmPassword.value;

                // Limpiar estilos previos
                password.classList.remove('is-valid', 'is-invalid');
                confirmPassword.classList.remove('is-valid', 'is-invalid');
                passwordError.style.display = 'none';

                // SIEMPRE deshabilitar el botón hasta que TODO esté correcto
                if (submitButton) submitButton.disabled = true;

                // Validar contraseña principal
                if (passwordValue.length === 0) {
                    // Campo vacío - neutral
                    return;
                }

                if (passwordValue.length < 3) {
                    password.classList.add('is-invalid');
                    return;
                } else {
                    password.classList.add('is-valid');
                }

                // Validar confirmación
                if (confirmPasswordValue.length === 0) {
                    // Confirmación vacía - esperar
                    return;
                }

                if (passwordValue !== confirmPasswordValue) {
                    confirmPassword.classList.add('is-invalid');
                    passwordError.style.display = 'block';
                    passwordError.textContent = 'Las contraseñas NO coinciden';
                    return;
                } else {
                    confirmPassword.classList.add('is-valid');
                }

                // TODO está correcto - habilitar botón
                if (passwordValue.length >= 3 && passwordValue === confirmPasswordValue) {
                    if (submitButton) submitButton.disabled = false;
                }
            };

            // Deshabilitar botón inicialmente
            if (submitButton) submitButton.disabled = true;

            // Ocultar mensajes de error cuando el usuario empiece a escribir
            const hideErrorOnInput = () => {
                this.hideModalError();
            };

            password.addEventListener('input', () => {
                hideErrorOnInput();
                validatePasswords();
            });
            confirmPassword.addEventListener('input', () => {
                hideErrorOnInput();
                validatePasswords();
            });
            password.addEventListener('keyup', validatePasswords);
            confirmPassword.addEventListener('keyup', validatePasswords);
        }

        // Password visibility toggles
        const togglePassword = document.getElementById('togglePassword');
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

        if (togglePassword) {
            console.log('✅ Botón toggle password encontrado');
            togglePassword.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('👁️ Click en toggle password');
                this.togglePasswordVisibility('password', togglePassword);
            });
        } else {
            console.error('❌ Botón toggle password NO encontrado');
        }

        if (toggleConfirmPassword) {
            console.log('✅ Botón toggle confirm password encontrado');
            toggleConfirmPassword.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('👁️ Click en toggle confirm password');
                this.togglePasswordVisibility('confirmPassword', toggleConfirmPassword);
            });
        } else {
            console.error('❌ Botón toggle confirm password NO encontrado');
        }

        // Phone validation
        const countryCode = document.getElementById('countryCode');
        const phoneNumber = document.getElementById('phoneNumber');

        if (countryCode && phoneNumber) {
            console.log('✅ Elementos de teléfono encontrados');
            
            countryCode.addEventListener('change', () => {
                console.log('📞 Cambio de país');
                this.updatePhoneValidation();
            });

            phoneNumber.addEventListener('input', () => {
                this.validatePhoneInput(phoneNumber);
            });
        }

        // Name validation
        const nombreCompleto = document.getElementById('nombreCompleto');
        if (nombreCompleto) {
            console.log('✅ Campo nombre encontrado');
            nombreCompleto.addEventListener('input', () => {
                this.validateNameInput(nombreCompleto);
            });
        }

        // Initialize phone validation
        this.updatePhoneValidation();
        
        console.log('🔧 Event listeners configurados completamente');
    }

    validatePhoneNumber() {
        const countrySelect = document.getElementById('countryCode');
        const phoneInput = document.getElementById('phoneNumber');
        
        if (!phoneInput.value) return true; // Optional field
        
        const [code, digits] = countrySelect.value.split('|');
        const expectedDigits = parseInt(digits);
        const phoneNumber = phoneInput.value.replace(/\D/g, ''); // Remove non-digits
        
        return phoneNumber.length === expectedDigits;
    }

    updatePhoneValidation() {
        const countrySelect = document.getElementById('countryCode');
        const phoneInput = document.getElementById('phoneNumber');
        const phoneHelp = document.getElementById('phoneHelp');
        
        if (!countrySelect || !phoneInput || !phoneHelp) return;
        
        const [code, digits] = countrySelect.value.split('|');
        const expectedDigits = parseInt(digits);
        
        phoneInput.maxLength = expectedDigits;
        phoneInput.placeholder = `Ingresa ${expectedDigits} dígitos`;
        
        const countryNames = {
            '+52': 'México',
            '+1': 'USA/Canadá', 
            '+86': 'China',
            '+81': 'Japón',
            '+49': 'Alemania',
            '+33': 'Francia',
            '+44': 'Reino Unido',
            '+39': 'Italia',
            '+34': 'España',
            '+55': 'Brasil',
            '+54': 'Argentina',
            '+57': 'Colombia',
            '+51': 'Perú',
            '+56': 'Chile',
            '+58': 'Venezuela',
            '+593': 'Ecuador',
            '+591': 'Bolivia',
            '+595': 'Paraguay',
            '+598': 'Uruguay'
        };
        
        const countryName = countryNames[code] || 'País seleccionado';
        phoneHelp.textContent = `${countryName}: ${expectedDigits} dígitos (ej: ${'1'.repeat(expectedDigits)})`;
        
        phoneInput.classList.remove('is-invalid', 'is-valid');
    }

    validatePhoneInput(input) {
        const countrySelect = document.getElementById('countryCode');
        if (!countrySelect) return;
        
        // Only allow digits
        input.value = input.value.replace(/\D/g, '');
        
        const [code, digits] = countrySelect.value.split('|');
        const expectedDigits = parseInt(digits);
        const currentLength = input.value.length;
        
        // Visual feedback
        if (currentLength === 0) {
            input.classList.remove('is-invalid', 'is-valid');
        } else if (currentLength === expectedDigits) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
        }
    }

    togglePasswordVisibility(inputId, button) {
        const input = document.getElementById(inputId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            button.setAttribute('title', 'Ocultar contraseña');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            button.setAttribute('title', 'Mostrar contraseña');
        }
    }

    validateNameInput(input) {
        // Solo permitir letras (incluyendo acentos), espacios, comas y puntos
        const allowedPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s,\.]*$/;
        
        // Obtener la posición del cursor antes de la validación
        const cursorPosition = input.selectionStart;
        
        // Filtrar caracteres no permitidos
        const originalValue = input.value;
        const filteredValue = originalValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s,\.]/g, '');
        
        // Si el valor cambió, actualizar el input
        if (originalValue !== filteredValue) {
            input.value = filteredValue;
            
            // Restaurar la posición del cursor (ajustada por caracteres eliminados)
            const removedChars = originalValue.length - filteredValue.length;
            const newCursorPosition = Math.max(0, cursorPosition - removedChars);
            input.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // Mostrar feedback visual temporal
            input.classList.add('is-warning');
            setTimeout(() => {
                input.classList.remove('is-warning');
            }, 500);
        }
        
        // Validación visual para nombres válidos
        if (filteredValue.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s,\.]+$/.test(filteredValue)) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        } else if (filteredValue.length > 0) {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-valid', 'is-invalid');
        }
    }
}

// Funciones globales para el dropdown de países con banderas
window.toggleCountryDropdown = function() {
    const dropdown = document.getElementById('countryDropdown');
    if (dropdown) {
        dropdown.classList.toggle('d-none');
        dropdown.classList.toggle('show');
    }
};

window.selectCountry = function(value, flag, name) {
    console.log(`🌍 Seleccionando país: ${name} (${value})`);
    
    // Actualizar el select oculto
    const countrySelect = document.getElementById('countryCode');
    if (countrySelect) {
        countrySelect.value = value;
    }
    
    // Actualizar la visualización
    const display = document.getElementById('countryDisplay');
    if (display) {
        display.innerHTML = `
            <img src="https://flagcdn.com/w40/${flag}.png" alt="${name}" style="width: 24px; height: 18px; margin-right: 8px;">
            <span>${name} (${value.split('|')[0]})</span>
            <i class="fas fa-chevron-down ms-auto"></i>
        `;
    }
    
    // Cerrar dropdown
    const dropdown = document.getElementById('countryDropdown');
    if (dropdown) {
        dropdown.classList.add('d-none');
        dropdown.classList.remove('show');
    }
    
    // Actualizar validación de teléfono con límites estrictos
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        const [code, digits] = value.split('|');
        const expected = parseInt(digits);
        
        console.log(`📞 Configurando límite para ${name}: ${expected} dígitos`);
        
        // Configurar límites estrictos
        phoneInput.setAttribute('maxlength', expected);
        phoneInput.maxLength = expected;
        phoneInput.placeholder = `Exactamente ${expected} dígitos`;
        
        // Limpiar el campo y aplicar validación inmediata
        const currentValue = phoneInput.value.replace(/\D/g, '');
        if (currentValue.length > expected) {
            phoneInput.value = currentValue.substring(0, expected);
            console.log(`✂️ Número truncado a ${expected} dígitos: ${phoneInput.value}`);
        } else {
            phoneInput.value = currentValue;
        }
        
        const phoneHelp = document.getElementById('phoneHelp');
        if (phoneHelp) {
            phoneHelp.textContent = `${name}: exactamente ${expected} dígitos`;
            phoneHelp.style.color = '#6c757d';
        }
        
        // Limpiar validación visual
        phoneInput.classList.remove('is-valid', 'is-invalid');
        
        // Reconfigurar el event listener para este input
        window.setupPhoneValidation(phoneInput, expected, name);
    }
};

// Función para configurar validación estricta de teléfono
window.setupPhoneValidation = function(phoneInput, expectedDigits, countryName) {
    // Remover listeners anteriores clonando el elemento
    const newPhoneInput = phoneInput.cloneNode(true);
    phoneInput.parentNode.replaceChild(newPhoneInput, phoneInput);
    
    console.log(`🔧 Configurando validación estricta para ${countryName}: ${expectedDigits} dígitos`);
    
    newPhoneInput.addEventListener('input', function(e) {
        // Solo permitir números
        let value = this.value.replace(/\D/g, '');
        
        // Limitar a la cantidad exacta de dígitos
        if (value.length > expectedDigits) {
            value = value.substring(0, expectedDigits);
            console.log(`✂️ Truncado a ${expectedDigits} dígitos: ${value}`);
        }
        
        this.value = value;
        
        // Validación visual
        if (value.length === 0) {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (value.length === expectedDigits) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
        
        // Actualizar ayuda
        const phoneHelp = document.getElementById('phoneHelp');
        if (phoneHelp) {
            if (value.length === expectedDigits) {
                phoneHelp.textContent = `✅ ${countryName}: ${expectedDigits} dígitos completos`;
                phoneHelp.style.color = '#198754';
            } else if (value.length > 0) {
                phoneHelp.textContent = `⚠️ ${countryName}: ${value.length}/${expectedDigits} dígitos`;
                phoneHelp.style.color = '#fd7e14';
            } else {
                phoneHelp.textContent = `${countryName}: exactamente ${expectedDigits} dígitos`;
                phoneHelp.style.color = '#6c757d';
            }
        }
    });
    
    // Prevenir pegar números largos
    newPhoneInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const numbers = pastedText.replace(/\D/g, '');
        const truncated = numbers.substring(0, expectedDigits);
        this.value = truncated;
        this.dispatchEvent(new Event('input'));
        console.log(`📋 Pegado y truncado: ${truncated}`);
    });
};

// Funciones globales para el modal de EDICIÓN
window.toggleEditCountryDropdown = function() {
    const dropdown = document.getElementById('editCountryDropdown');
    if (dropdown) {
        dropdown.classList.toggle('d-none');
        dropdown.classList.toggle('show');
    }
};

window.selectEditCountry = function(value, flag, name) {
    console.log(`🌍 Seleccionando país en edición: ${name} (${value})`);
    
    // Actualizar el select oculto
    const countrySelect = document.getElementById('editCountryCode');
    if (countrySelect) {
        countrySelect.value = value;
    }
    
    // Actualizar la visualización
    const display = document.getElementById('editCountryDisplay');
    if (display) {
        display.innerHTML = `
            <img src="https://flagcdn.com/w40/${flag}.png" alt="${name}" style="width: 24px; height: 18px; margin-right: 8px;">
            <span>${name} (${value.split('|')[0]})</span>
            <i class="fas fa-chevron-down ms-auto"></i>
        `;
    }
    
    // Cerrar dropdown
    const dropdown = document.getElementById('editCountryDropdown');
    if (dropdown) {
        dropdown.classList.add('d-none');
        dropdown.classList.remove('show');
    }
    
    // Actualizar validación de teléfono con límites estrictos
    const phoneInput = document.getElementById('editPhoneNumber');
    if (phoneInput) {
        const [code, digits] = value.split('|');
        const expected = parseInt(digits);
        
        console.log(`📞 Configurando límite para edición ${name}: ${expected} dígitos`);
        
        // Configurar límites estrictos
        phoneInput.setAttribute('maxlength', expected);
        phoneInput.maxLength = expected;
        phoneInput.placeholder = `Exactamente ${expected} dígitos`;
        
        // Limpiar el campo y aplicar validación inmediata
        const currentValue = phoneInput.value.replace(/\D/g, '');
        if (currentValue.length > expected) {
            phoneInput.value = currentValue.substring(0, expected);
            console.log(`✂️ Número truncado a ${expected} dígitos: ${phoneInput.value}`);
        } else {
            phoneInput.value = currentValue;
        }
        
        const phoneHelp = document.getElementById('editPhoneHelp');
        if (phoneHelp) {
            phoneHelp.textContent = `${name}: exactamente ${expected} dígitos`;
            phoneHelp.style.color = '#6c757d';
        }
        
        // Limpiar validación visual
        phoneInput.classList.remove('is-valid', 'is-invalid');
        
        // Reconfigurar el event listener para este input
        window.setupEditPhoneValidation(phoneInput, expected, name);
    }
};

// Función para configurar validación estricta de teléfono en EDICIÓN
window.setupEditPhoneValidation = function(phoneInput, expectedDigits, countryName) {
    // Remover listeners anteriores clonando el elemento
    const newPhoneInput = phoneInput.cloneNode(true);
    phoneInput.parentNode.replaceChild(newPhoneInput, phoneInput);
    
    console.log(`🔧 Configurando validación estricta para edición ${countryName}: ${expectedDigits} dígitos`);
    
    newPhoneInput.addEventListener('input', function(e) {
        // Solo permitir números
        let value = this.value.replace(/\D/g, '');
        
        // Limitar a la cantidad exacta de dígitos
        if (value.length > expectedDigits) {
            value = value.substring(0, expectedDigits);
            console.log(`✂️ Truncado en edición a ${expectedDigits} dígitos: ${value}`);
        }
        
        this.value = value;
        
        // Validación visual
        if (value.length === 0) {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (value.length === expectedDigits) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
        
        // Actualizar ayuda
        const phoneHelp = document.getElementById('editPhoneHelp');
        if (phoneHelp) {
            if (value.length === expectedDigits) {
                phoneHelp.textContent = `✅ ${countryName}: ${expectedDigits} dígitos completos`;
                phoneHelp.style.color = '#198754';
            } else if (value.length > 0) {
                phoneHelp.textContent = `⚠️ ${countryName}: ${value.length}/${expectedDigits} dígitos`;
                phoneHelp.style.color = '#fd7e14';
            } else {
                phoneHelp.textContent = `${countryName}: exactamente ${expectedDigits} dígitos`;
                phoneHelp.style.color = '#6c757d';
            }
        }
    });
    
    // Prevenir pegar números largos
    newPhoneInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const numbers = pastedText.replace(/\D/g, '');
        const truncated = numbers.substring(0, expectedDigits);
        this.value = truncated;
        this.dispatchEvent(new Event('input'));
        console.log(`📋 Pegado y truncado en edición: ${truncated}`);
    });
};

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', function(event) {
    const wrapper = document.querySelector('.country-select-wrapper');
    const dropdown = document.getElementById('countryDropdown');
    
    if (wrapper && dropdown && !wrapper.contains(event.target)) {
        dropdown.classList.add('d-none');
        dropdown.classList.remove('show');
    }
});

// Funciones estáticas para botones
TransportistasManager.viewDriver = function(id) {
    const driver = window.TransportistasManager.drivers.find(d => d.id === id);
    if (!driver) return;
    
    const modalHtml = `
        <div class="modal fade" id="viewDriverModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user me-2"></i>
                            Detalles del Transportista
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Nombre:</strong> ${driver.nombre}</p>
                                <p><strong>Email:</strong> ${driver.email}</p>
                                <p><strong>Teléfono:</strong> ${window.TransportistasManager.formatPhoneWithFlag(driver.telefono)}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Licencia:</strong> ${driver.licencia || 'N/A'}</p>
                                <p><strong>Estado:</strong> 
                                    <span class="badge bg-${driver.activo ? 'success' : 'danger'}">
                                        ${driver.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('viewDriverModal'));
    modal.show();
    
    document.getElementById('viewDriverModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

TransportistasManager.deleteDriver = function(id) {
    const driver = window.TransportistasManager.drivers.find(d => d.id === id);
    if (!driver) return;
    
    const modalHtml = `
        <div class="modal fade" id="deleteDriverModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-times me-2"></i>
                            Eliminar Transportista
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>¡Advertencia!</strong> Esta acción eliminará permanentemente al transportista.
                        </div>
                        <p>¿Estás seguro de que deseas eliminar al siguiente transportista?</p>
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="user-avatar me-3" style="width: 50px; height: 50px; font-size: 1.2rem;">
                                        ${driver.nombre.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h6 class="mb-1">${driver.nombre}</h6>
                                        <small class="text-muted">${driver.email}</small><br>
                                        <small class="text-muted">Tel: ${driver.telefono || 'N/A'}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="form-label">Para confirmar, escribe el nombre completo del transportista:</label>
                            <input type="text" class="form-control" id="confirmDriverName" placeholder="Escribe: ${driver.nombre}">
                            <small class="text-muted">Debes escribir exactamente: <strong>${driver.nombre}</strong></small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteDriverBtn" disabled onclick="TransportistasManager.confirmDeleteDriver(${id})">
                            <i class="fas fa-user-times me-1"></i>Eliminar Transportista
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('deleteDriverModal'));
    modal.show();
    
    // Validación en tiempo real
    const confirmInput = document.getElementById('confirmDriverName');
    const confirmBtn = document.getElementById('confirmDeleteDriverBtn');
    
    confirmInput.addEventListener('input', function() {
        if (this.value === driver.nombre) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('btn-secondary');
            confirmBtn.classList.add('btn-danger');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('btn-secondary');
            confirmBtn.classList.remove('btn-danger');
        }
    });
    
    document.getElementById('deleteDriverModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

TransportistasManager.confirmDeleteDriver = async function(id) {
    try {
        console.log('🗑️ Eliminando transportista ID:', id);
        window.app.showToast('Eliminando transportista...', 'info');
        
        const requestData = { id: parseInt(id) };
        console.log('📋 Datos a enviar:', requestData);
        
        // El endpoint delete.php ahora hace eliminación permanente de la base de datos
        const response = await window.app.apiCall('/LogisticaFinal/api/transportistas/delete.php', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        console.log('📥 Respuesta del servidor:', response);

        if (response && response.success) {
            window.app.showToast('✅ Transportista eliminado exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('deleteDriverModal')).hide();
            await window.TransportistasManager.loadData();
        } else {
            console.error('❌ Respuesta de error:', response);
            console.error('🔍 Debug info:', response?.debug);
            const errorMsg = response?.error || response?.message || 'Error desconocido';
            window.app.showToast('❌ Error al eliminar transportista: ' + errorMsg, 'danger');
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        window.app.showToast('❌ Error al eliminar transportista: ' + error.message, 'danger');
    }
};

// Initialize Transportistas Manager
window.TransportistasManager = new TransportistasManager();
