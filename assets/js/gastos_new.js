// Gastos Manager - 💰 Expense management functionality
class GastosManager {
    constructor() {
        this.expenses = [];
        this.vehicles = [];
        this.currentExpense = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        setTimeout(() => this.loadVehicles(), 100);
        this.setDefaultDate();
    }

    setDefaultDate() {
        const dateInput = document.querySelector('input[name="fecha"]');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    setupEventListeners() {
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
    }

    async loadData() {
        try {
            console.log('🔄 Starting to load gastos data...');
            await Promise.all([
                this.loadExpenses(),
                this.loadVehicles()
            ]);
            console.log('✅ Data loaded, updating lists...');
            console.log('📊 Total expenses loaded:', this.expenses.length);
            this.updateExpensesList();
        } catch (error) {
            console.error('❌ Error loading expenses data:', error);
            this.updateExpensesList();
        }
    }

    async loadExpenses() {
        try {
            const currentUser = window.app.currentUser;
            console.log('Loading expenses for user:', currentUser);

            console.log('Loading ALL expenses - filtering will be done in frontend');

            const response = await window.app.apiCall('gastos/list.php', {
                method: 'POST',
                body: JSON.stringify({})
            });

            this.expenses = response || [];
            console.log('ALL expenses loaded from API:', this.expenses.length, 'expenses');
            console.log('Raw expenses data:', this.expenses);

        } catch (error) {
            console.error('Error loading expenses:', error);
            this.expenses = [];
            if (window.app && window.app.showToast) {
                window.app.showToast('Error al cargar gastos: ' + error.message, 'danger');
            }
        }
    }

    async loadVehicles() {
        try {
            console.log('🚗 [GASTOS] Cargando vehículos...');
            console.log('👤 Usuario actual:', window.app?.currentUser);
            
            // FORZAR recarga desde el servidor sin caché
            const timestamp = Date.now();
            const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
            const response = await fetch(`${apiPath}/vehiculos/list.php?v=${timestamp}`, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Content-Type': 'application/json'
                }
            }).then(r => r.json());
            
            // Asegurar que vehicles sea un array
            if (Array.isArray(response)) {
                this.vehicles = response;
            } else if (response && response.vehiculos && Array.isArray(response.vehiculos)) {
                this.vehicles = response.vehiculos;
            } else {
                console.error('❌ Respuesta de vehículos no es un array:', response);
                this.vehicles = [];
            }
            
            console.log('✅ Vehículos cargados:', this.vehicles.length);
            
            // Cargar viajes para filtrar vehículos
            await this.loadTripsForVehicleFilter();
            
            this.updateVehicleSelect();
        } catch (error) {
            console.error('Error loading vehicles:', error);
            this.vehicles = [];
            this.updateVehicleSelect();
        }
    }

    async loadTripsForVehicleFilter() {
        try {
            console.log('🔍 [GASTOS] Cargando viajes para filtrar vehículos...');
            console.log('👤 Usuario actual:', window.app?.currentUser);
            
            // FORZAR recarga desde el servidor sin caché
            const timestamp = Date.now();
            const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
            const response = await fetch(`${apiPath}/viajes/list.php?v=${timestamp}`, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Content-Type': 'application/json'
                }
            }).then(r => r.json());
            
            this.allTrips = response || [];
            
            console.log('📊 [GASTOS] Todos los viajes recibidos:', this.allTrips);
            console.log(`   📊 Total viajes: ${this.allTrips.length}`);
            
            // Obtener información del usuario actual
            const currentUser = window.app?.currentUser;
            const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
            const isTransportista = userRole === 'transportista';
            const currentUserId = currentUser?.id || currentUser?.user_id;
            const currentUserName = currentUser?.nombre || currentUser?.name;
            
            console.log('👤 [GASTOS] Información del usuario:');
            console.log(`   - Rol: ${userRole}`);
            console.log(`   - Es transportista: ${isTransportista}`);
            console.log(`   - ID: ${currentUserId}`);
            console.log(`   - Nombre: ${currentUserName}`);
            
            // Si es transportista, filtrar solo SUS viajes
            let viajesDelUsuario = this.allTrips;
            if (isTransportista) {
                viajesDelUsuario = this.allTrips.filter(v => {
                    // Comparar por ID o por nombre
                    const matchById = v.transportista_id && String(v.transportista_id) === String(currentUserId);
                    const matchByName = v.transportista_nombre === currentUserName;
                    return matchById || matchByName;
                });
                console.log(`   🚛 Transportista: Filtrando viajes del usuario`);
                console.log(`   📊 Viajes del transportista: ${viajesDelUsuario.length} de ${this.allTrips.length}`);
            } else {
                console.log(`   👨‍💼 Admin/Supervisor: Usando todos los viajes`);
            }
            
            // Mostrar estados de los viajes filtrados
            viajesDelUsuario.forEach((viaje, index) => {
                console.log(`   Viaje ${index + 1}: ID=${viaje.id}, Estado="${viaje.estado}", Vehiculo=${viaje.vehiculo_id}, ${viaje.origen || viaje.origen_estado} → ${viaje.destino || viaje.destino_estado}`);
            });
            
            // Filtrar solo viajes en ruta del usuario
            this.tripsEnRuta = viajesDelUsuario.filter(v => {
                const estado = (v.estado || '').toLowerCase().trim();
                const esEnRuta = estado === 'en_ruta' || estado === 'en ruta';
                if (esEnRuta) {
                    console.log(`   ✅ Viaje EN RUTA encontrado: ID=${v.id}, Vehiculo=${v.vehiculo_id}`);
                }
                return esEnRuta;
            });
            
            console.log(`   ✅ Viajes en ruta filtrados: ${this.tripsEnRuta.length}`);
            
            // Crear un mapa de vehiculo_id -> viaje para acceso rápido
            this.vehiculoViajeMap = {};
            this.tripsEnRuta.forEach(viaje => {
                if (viaje.vehiculo_id) {
                    this.vehiculoViajeMap[viaje.vehiculo_id] = viaje;
                    console.log(`   🗺️ Mapeando: Vehiculo ${viaje.vehiculo_id} → Viaje ${viaje.id}`);
                }
            });
            
            console.log('   ✅ Mapa de vehículos en ruta creado:', this.vehiculoViajeMap);
            console.log('   ✅ IDs de vehículos con viajes en ruta:', Object.keys(this.vehiculoViajeMap));
            
        } catch (error) {
            console.error('❌ Error cargando viajes:', error);
            this.allTrips = [];
            this.tripsEnRuta = [];
            this.vehiculoViajeMap = {};
        }
    }

    updateVehicleSelect() {
        const vehicleSelect = document.querySelector('select[name="vehiculo_id"]');
        if (!vehicleSelect || !this.vehicles) {
            console.warn('⚠️ [GASTOS] No se encontró el select de vehículos o no hay vehículos cargados');
            return;
        }

        // Obtener rol del usuario
        const currentUser = window.app?.currentUser;
        const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
        const isAdminOrSupervisor = userRole === 'admin' || userRole === 'administrador' || userRole === 'supervisor';

        console.log('🔍 [GASTOS] Iniciando filtrado de vehículos para dropdown');
        console.log('   👤 Usuario:', currentUser?.nombre || currentUser?.name);
        console.log('   🎭 Rol:', userRole);
        console.log('   👨‍💼 Es Admin/Supervisor:', isAdminOrSupervisor);
        console.log('   📊 Total vehículos disponibles:', this.vehicles.length);
        console.log('   📊 Mapa de vehículos en ruta:', this.vehiculoViajeMap);
        console.log('   📊 ¿Mapa inicializado?:', !!this.vehiculoViajeMap);
        console.log('   📊 Cantidad en mapa:', this.vehiculoViajeMap ? Object.keys(this.vehiculoViajeMap).length : 0);

        // Verificar que el mapa esté inicializado
        if (!this.vehiculoViajeMap) {
            console.error('❌ [GASTOS] El mapa de vehículos en ruta NO está inicializado');
            vehicleSelect.innerHTML = '<option value="">Error: Cargando viajes...</option>';
            return;
        }

        let vehiculosFiltrados;

        if (isAdminOrSupervisor) {
            // ADMIN/SUPERVISOR: Mostrar TODOS los vehículos
            vehiculosFiltrados = this.vehicles;
            console.log('   👨‍💼 Admin/Supervisor: Mostrando TODOS los vehículos');
            console.log(`   📊 RESULTADO: ${vehiculosFiltrados.length} vehículos disponibles`);
        } else {
            // TRANSPORTISTA: Solo vehículos con viajes en ruta
            vehiculosFiltrados = this.vehicles.filter(v => {
                const vehiculoId = v.id;
                const tieneViajeEnRuta = this.vehiculoViajeMap[vehiculoId];
                
                console.log(`   🔍 Verificando vehículo ${v.placa} (ID: ${vehiculoId})`);
                console.log(`      - ¿Tiene viaje en ruta?: ${!!tieneViajeEnRuta}`);
                
                if (tieneViajeEnRuta) {
                    console.log(`      ✅ SÍ tiene viaje en ruta:`, tieneViajeEnRuta);
                } else {
                    console.log(`      ❌ NO tiene viaje en ruta`);
                }
                
                return !!tieneViajeEnRuta;
            });

            console.log(`   📊 RESULTADO: ${vehiculosFiltrados.length} vehículos con viajes en ruta de ${this.vehicles.length} totales`);

            // SOLO mostrar alerta si NO hay vehículos con viajes en ruta
            if (vehiculosFiltrados.length === 0) {
                console.warn('   ⚠️ TRANSPORTISTA SIN VEHÍCULOS EN RUTA - Mostrando alerta');
                
                // Verificar si el transportista tiene viajes pendientes
                const viajesPendientes = this.allTrips ? this.allTrips.filter(v => {
                    const estado = (v.estado || '').toLowerCase().trim();
                    return estado === 'pendiente';
                }) : [];

                console.log(`   📊 Viajes pendientes encontrados: ${viajesPendientes.length}`);

                let mensaje = '';
                if (viajesPendientes.length > 0) {
                    mensaje = '⚠️ Tienes viajes pendientes. Contacta con el administrador o supervisor para iniciar tu ruta';
                } else {
                    mensaje = '⚠️ No tienes viajes asignados. Contacta con el administrador o supervisor';
                }

                vehicleSelect.innerHTML = `<option value="">${mensaje}</option>`;
                vehicleSelect.disabled = true;
                console.warn(`   ⚠️ ${mensaje}`);
                
                // Mostrar mensaje informativo en el dropdown de viajes también
                const viajeSelect = document.querySelector('select[name="viaje_id"]');
                if (viajeSelect) {
                    viajeSelect.innerHTML = `<option value="">${mensaje}</option>`;
                    viajeSelect.disabled = true;
                }

                // Mostrar alerta visual para el usuario
                this.mostrarAlertaTransportista(viajesPendientes.length > 0);
                
                return;
            } else {
                console.log('   ✅ TRANSPORTISTA CON VEHÍCULOS EN RUTA - Sin alerta');
                // Ocultar alerta si existe
                const alertContainer = document.getElementById('alertaTransportistaGastos');
                if (alertContainer) {
                    alertContainer.innerHTML = '';
                }
            }
        }

        vehicleSelect.innerHTML = '<option value="">Seleccionar vehículo...</option>' +
            vehiculosFiltrados.map(vehicle => {
                const viaje = this.vehiculoViajeMap[vehicle.id];
                const rutaInfo = viaje ? ` - En ruta: ${viaje.origen || viaje.origen_estado} → ${viaje.destino || viaje.destino_estado}` : '';
                return `<option value="${vehicle.id}">🚚 ${vehicle.placa} - ${vehicle.marca} ${vehicle.modelo}${rutaInfo}</option>`;
            }).join('');

        // Agregar event listener para cargar viajes cuando se seleccione un vehículo
        vehicleSelect.removeEventListener('change', this.handleVehicleChange);
        this.handleVehicleChange = this.handleVehicleChange.bind(this);
        vehicleSelect.addEventListener('change', this.handleVehicleChange);
    }

    async handleVehicleChange(e) {
        const vehiculoId = e.target.value;
        const viajeSelect = document.querySelector('select[name="viaje_id"]');
        
        if (!viajeSelect) return;

        if (!vehiculoId) {
            viajeSelect.innerHTML = '<option value="">Primero seleccione un vehículo</option>';
            viajeSelect.disabled = true;
            return;
        }

        try {
            console.log('🔍 Cargando viaje para vehículo:', vehiculoId);
            
            // Obtener rol del usuario
            const currentUser = window.app?.currentUser;
            const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
            const isAdminOrSupervisor = userRole === 'admin' || userRole === 'administrador' || userRole === 'supervisor';
            
            // Buscar el viaje en ruta del vehículo seleccionado
            const viajeEnRuta = this.vehiculoViajeMap[vehiculoId];
            
            // Construir opciones del dropdown
            let options = '';
            
            if (!viajeEnRuta) {
                console.warn('   ⚠️ No se encontró viaje en ruta para este vehículo');
                
                if (isAdminOrSupervisor) {
                    // Admin/Supervisor pueden registrar gastos sin viaje
                    console.log('   👨‍💼 Admin/Supervisor: Permitiendo gasto sin viaje');
                    options = '<option value="0" selected>🚫 Costos sin viaje (Gasto general)</option>';
                    viajeSelect.innerHTML = options;
                    viajeSelect.disabled = false;
                } else {
                    // Transportistas NO pueden registrar gastos sin viaje en ruta
                    console.error('   ❌ Transportista: No puede registrar gasto sin viaje en ruta');
                    viajeSelect.innerHTML = '<option value="">Este vehículo no tiene viaje en ruta</option>';
                    viajeSelect.disabled = true;
                }
                return;
            }

            console.log('   ✅ Viaje en ruta encontrado:', viajeEnRuta);

            // Construir información del viaje
            const origen = viajeEnRuta.origen || viajeEnRuta.origen_estado || 'Origen';
            const destino = viajeEnRuta.destino || viajeEnRuta.destino_estado || 'Destino';
            const fecha = viajeEnRuta.fecha_programada ? new Date(viajeEnRuta.fecha_programada).toLocaleDateString() : '';
            
            // Agregar opción "Costos sin viaje" solo para admin/supervisor
            if (isAdminOrSupervisor) {
                options += '<option value="0">🚫 Costos sin viaje (Gasto general)</option>';
            }

            // Agregar el viaje en ruta (seleccionado por defecto)
            options += `<option value="${viajeEnRuta.id}" selected>🚛 ${origen} → ${destino} (${fecha}) - EN RUTA</option>`;

            viajeSelect.innerHTML = options;
            viajeSelect.disabled = false;
            
            console.log('   ✅ Viaje en ruta cargado y seleccionado automáticamente');

        } catch (error) {
            console.error('❌ Error cargando viaje:', error);
            viajeSelect.innerHTML = '<option value="">Error al cargar viaje</option>';
            viajeSelect.disabled = true;
        }
    }

    mostrarAlertaTransportista(tieneViajesPendientes) {
        // Buscar o crear contenedor de alerta
        let alertContainer = document.getElementById('alertaTransportistaGastos');
        
        if (!alertContainer) {
            // Crear contenedor de alerta si no existe
            const formCard = document.querySelector('#expenseForm')?.closest('.card');
            if (formCard) {
                alertContainer = document.createElement('div');
                alertContainer.id = 'alertaTransportistaGastos';
                formCard.parentNode.insertBefore(alertContainer, formCard);
            } else {
                return; // No se puede mostrar la alerta
            }
        }

        // Construir mensaje según el caso
        let mensaje, icono, colorClase;
        
        if (tieneViajesPendientes) {
            icono = '⏳';
            colorClase = 'warning';
            mensaje = `
                <strong>Tienes viajes pendientes</strong><br>
                Contacta con el administrador o supervisor para que inicien tu ruta y puedas registrar gastos.
            `;
        } else {
            icono = '📋';
            colorClase = 'info';
            mensaje = `
                <strong>No tienes viajes asignados</strong><br>
                Contacta con el administrador o supervisor para que te asignen un viaje.
            `;
        }

        // Mostrar alerta
        alertContainer.innerHTML = `
            <div class="alert alert-${colorClase} alert-dismissible fade show shadow-sm mb-4" role="alert" style="border-radius: 12px; border-left: 4px solid var(--bs-${colorClase});">
                <div class="d-flex align-items-start">
                    <div class="me-3" style="font-size: 2rem;">${icono}</div>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">
                            <i class="fas fa-info-circle me-2"></i>Información Importante
                        </h5>
                        <p class="mb-2">${mensaje}</p>
                        <hr class="my-2">
                        <p class="mb-0 small">
                            <i class="fas fa-phone me-1"></i> Contacta con tu supervisor para más información.
                        </p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        `;

        console.log(`   ℹ️ Alerta mostrada al transportista: ${tieneViajesPendientes ? 'Viajes pendientes' : 'Sin viajes'}`);
    }

    async handleSubmit(e) {
        e.preventDefault();

        try {
            const formData = new FormData(e.target);
            const viajeId = formData.get('viaje_id');
            
            const expenseData = {
                tipo: formData.get('tipo'),
                fecha: formData.get('fecha'),
                monto: parseFloat(formData.get('monto')),
                vehiculo_id: parseInt(formData.get('vehiculo_id')),
                viaje_id: viajeId && viajeId !== '0' ? parseInt(viajeId) : null,
                kilometraje: parseInt(formData.get('kilometraje')),
                litros: parseFloat(formData.get('litros')) || 0,
                numero_factura: formData.get('numero_factura'),
                descripcion: formData.get('descripcion')
            };

            if (!expenseData.tipo || !expenseData.fecha || !expenseData.monto || !expenseData.vehiculo_id || !expenseData.numero_factura) {
                window.app.showToast('Por favor completa todos los campos requeridos', 'warning');
                return;
            }

            const response = await window.app.apiCall('gastos/create.php', {
                method: 'POST',
                body: JSON.stringify(expenseData)
            });

            if (response.success) {
                const expenseId = response.id;

                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput && fileInput.files[0]) {
                    try {
                        await this.uploadReceipt(expenseId, fileInput.files[0]);
                        window.app.showToast('✅ Gasto registrado con recibo exitosamente', 'success');
                    } catch (uploadError) {
                        window.app.showToast('⚠️ Gasto registrado, pero falló la subida del recibo', 'warning');
                    }
                } else {
                    window.app.showToast('✅ Gasto registrado exitosamente', 'success');
                }

                e.target.reset();
                this.setDefaultDate();
                this.clearImagePreview();
                await this.loadData();
            }
        } catch (error) {
            window.app.showToast('Error al registrar gasto: ' + error.message, 'danger');
        }
    }

    async uploadReceipt(expenseId, file) {
        try {
            console.log('📤 Subiendo recibo...');
            console.log('   - Gasto ID:', expenseId);
            console.log('   - Archivo:', file.name);
            console.log('   - Tamaño:', file.size, 'bytes');
            console.log('   - Tipo:', file.type);

            const formData = new FormData();
            formData.append('receipt', file);
            formData.append('expense_id', expenseId);

            // Log del FormData
            console.log('📋 FormData creado:');
            for (let pair of formData.entries()) {
                console.log('   -', pair[0], ':', pair[1]);
            }

            // Usar fetch directamente para subir archivos (no usar apiCall que puede modificar headers)
            const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
            const response = await fetch(`${apiPath}/gastos/upload.php`, {
                method: 'POST',
                body: formData,
                credentials: 'include' // Incluir cookies de sesión
            });

            console.log('📥 Respuesta del servidor:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error del servidor:', errorText);
                throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Respuesta JSON:', result);

            if (!result.success) {
                throw new Error(result.error || 'Error desconocido al subir archivo');
            }

            console.log('✅ Recibo subido exitosamente:', result.filename);
            return result;
        } catch (error) {
            console.error('❌ Error uploading receipt:', error);
            throw error;
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (file.size > maxSize) {
            window.app.showToast('El archivo es muy grande. Máximo 5MB.', 'danger');
            e.target.value = '';
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            window.app.showToast('Tipo de archivo no válido. Solo imágenes.', 'danger');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(src) {
        let preview = document.getElementById('imagePreview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'imagePreview';
            preview.className = 'mt-2';
            document.querySelector('input[type="file"]').parentNode.appendChild(preview);
        }

        preview.innerHTML = `
            <div class="card" style="max-width: 200px;">
                <img src="${src}" class="card-img-top" alt="Vista previa" style="max-height: 150px; object-fit: cover;">
                <div class="card-body p-2">
                    <small class="text-muted">Vista previa del recibo</small>
                    <button type="button" class="btn btn-sm btn-outline-danger mt-1" onclick="window.GastosManagerInstance.clearImagePreview()">
                        <i class="fas fa-times"></i> Quitar
                    </button>
                </div>
            </div>
        `;
    }

    clearImagePreview() {
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.remove();
        }
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    getExpenseTypeColor(tipo) {
        const colors = {
            'combustible': 'primary',
            'mantenimiento': 'warning',
            'peaje': 'info',
            'multa': 'danger',
            'hospedaje': 'secondary',
            'comida': 'success',
            'otros': 'dark'
        };
        return colors[tipo] || 'secondary';
    }

    getExpenseTypeIcon(tipo) {
        const icons = {
            'combustible': '⛽',
            'mantenimiento': '🔧',
            'peaje': '🛣️',
            'multa': '🚨',
            'hospedaje': '🏨',
            'comida': '🍴',
            'otros': '📦'
        };
        return icons[tipo] || '📋';
    }

    updateExpensesList() {
        const myExpensesTable = document.querySelector('#myExpensesTable tbody');
        if (myExpensesTable && this.expenses) {
            const currentUser = window.app.currentUser;
            console.log('=== DEBUG FILTRADO MIS GASTOS ===');
            console.log('Usuario actual completo:', currentUser);
            console.log('currentUser.id tipo:', typeof currentUser.id, 'valor:', currentUser.id);
            console.log('Total gastos cargados:', this.expenses.length);

            this.expenses.forEach((expense, index) => {
                console.log(`Gasto ${index}:`, {
                    id: expense.id,
                    usuario_id: expense.usuario_id,
                    tipo_usuario_id: typeof expense.usuario_id,
                    descripcion: expense.descripcion,
                    monto: expense.monto
                });
            });

            const currentUserId = currentUser ? String(currentUser.id) : null;
            const myExpenses = currentUser
                ? this.expenses.filter(expense => {
                    const expenseUserId = String(expense.usuario_id);
                    const match = expenseUserId === currentUserId;
                    console.log(`Comparando gasto ${expense.id}: expense.usuario_id (${expenseUserId}) === currentUser.id (${currentUserId}) = ${match}`);
                    return match;
                })
                : [];

            console.log('Gastos filtrados para usuario:', myExpenses.length);
            console.log('Gastos del usuario:', myExpenses);
            console.log('=== FIN DEBUG ===');

            myExpensesTable.innerHTML = '';
            console.log('Tabla limpiada, insertando gastos filtrados...');

            if (myExpenses.length === 0) {
                myExpensesTable.innerHTML = '<tr><td colspan="7" class="text-center">No tienes gastos registrados</td></tr>';
                return;
            }

            myExpensesTable.innerHTML = myExpenses.map(expense => {
                const userRole = currentUser?.rol || currentUser?.role || 'transportista';
                const isAdminOrSupervisor = userRole.toLowerCase() === 'administrador' || 
                                           userRole.toLowerCase() === 'admin' || 
                                           userRole.toLowerCase() === 'supervisor';
                // Columna de aprobación solo para admin y supervisor
                const approvalColumn = isAdminOrSupervisor ? `
                    <td>
                    ${expense.estado === 'pendiente' ? `
                        <div class="btn-group" role="group">
                            <button class="btn btn-success btn-sm" onclick="GastosManager.approveExpense(${expense.id})" title="Aprobar">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="GastosManager.denyExpense(${expense.id})" title="Denegar">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <span class="text-muted">-</span>
                    `}
                    </td>
                ` : '';

                return `
                    <tr>
                        <td>${new Date(expense.fecha).toLocaleDateString()}</td>
                        <td>
                            <span class="badge bg-${this.getExpenseTypeColor(expense.tipo)}">
                                ${this.getExpenseTypeIcon(expense.tipo)} ${expense.tipo}
                            </span>
                        </td>
                        <td>🚚 ${expense.vehiculo_placa || 'N/A'}</td>
                        <td class="fw-bold">$${parseFloat(expense.monto).toFixed(2)}</td>
                        <td>${expense.numero_factura}</td>
                        <td>
                            <span class="badge bg-${expense.estado === 'aprobado' ? 'success' : expense.estado === 'rechazado' ? 'danger' : 'warning'}">
                                ${expense.estado === 'aprobado' ? '✓' : expense.estado === 'rechazado' ? '✗' : '⏳'}
                            </span>
                        </td>
                        ${approvalColumn}
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="GastosManager.viewExpense(${expense.id})" title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-info btn-sm" onclick="GastosManager.viewReceiptImage(${expense.id})" title="Ver recibo">
                                    <i class="fas fa-receipt"></i>
                                </button>
                                ${isAdminOrSupervisor ? `
                                <button class="btn btn-outline-danger btn-sm" onclick="GastosManager.deleteExpense(${expense.id})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Generate mobile cards
            this.updateMobileExpenseCards(myExpenses, currentUser);
        }

        // Tabla "Todos los Gastos del Sistema" (Solo Admin/Supervisor)
        const allExpensesTable = document.querySelector('#allExpensesTable tbody');
        if (allExpensesTable && this.expenses) {
            const currentUser = window.app && window.app.currentUser ? window.app.currentUser : null;

            const allExpensesCard = document.querySelector('.admin-supervisor-only');
            if (allExpensesCard) {
                // Solo mostrar para Admin y Supervisor, ocultar para Transportistas
                if (currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'supervisor')) {
                    allExpensesCard.style.display = 'block';
                } else {
                    allExpensesCard.style.display = 'none';
                }
                
                if (this.expenses && this.expenses.length > 0) {
                    allExpensesTable.innerHTML = this.expenses.map(expense => `
                        <tr>
                            <td>${new Date(expense.fecha).toLocaleDateString()}</td>
                            <td>
                                <span class="badge bg-info">
                                    👤 ${expense.usuario_nombre || 'Usuario #' + expense.usuario_id}
                                </span>
                            </td>
                            <td>
                                <span class="badge bg-${this.getExpenseTypeColor(expense.tipo)}">
                                    ${this.getExpenseTypeIcon(expense.tipo)} ${expense.tipo}
                                </span>
                            </td>
                            <td>🚚 ${expense.vehiculo_placa || 'N/A'}</td>
                            <td class="fw-bold">$${parseFloat(expense.monto).toFixed(2)}</td>
                            <td>${expense.numero_factura}</td>
                            <td>
                                <span class="badge bg-${expense.estado === 'aprobado' ? 'success' : expense.estado === 'rechazado' ? 'danger' : 'warning'}">
                                    ${expense.estado === 'aprobado' ? '✓' : expense.estado === 'rechazado' ? '✗' : '⏳'}
                                </span>
                            </td>
                            <td>
                                ${expense.estado === 'pendiente' ? `
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-success btn-sm" onclick="GastosManager.approveExpense(${expense.id})" title="Aprobar">
                                           <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="GastosManager.denyExpense(${expense.id})" title="Denegar">
                                           <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                ` : `
                                    <span class="text-muted">-</span>
                                `}
                            </td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-outline-primary btn-sm" onclick="GastosManager.viewExpense(${expense.id})" title="Ver detalles">
                                       <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-info btn-sm" onclick="GastosManager.viewReceiptImage(${expense.id})" title="Ver recibo">
                                       <i class="fas fa-receipt"></i>
                                    </button>
                                    ${currentUser ? `
                                    <button class="btn btn-outline-danger btn-sm" onclick="GastosManager.deleteExpense(${expense.id})" title="Eliminar">
                                       <i class="fas fa-trash"></i>
                                    </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('');
                    
                    // Generate mobile cards for all expenses
                    this.updateMobileAllExpensesCards(this.expenses, currentUser);
                } else {
                    allExpensesTable.innerHTML = '<tr><td colspan="9" class="text-center">No hay gastos para mostrar</td></tr>';
                }
            }
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    getTypeColor(type) {
        const colors = {
            'combustible': 'success',
            'mantenimiento': 'warning',
            'peaje': 'info',
            'multa': 'danger',
            'hospedaje': 'secondary',
            'comida': 'primary',
            'otros': 'dark'
        };
        return colors[type] || 'secondary';
    }

    getTypeLabel(type) {
        const labels = {
            'combustible': '⛽ Combustible',
            'mantenimiento': '🔧 Mantenimiento',
            'peaje': '🛣️ Peajes',
            'multa': '🚨 Multas',
            'hospedaje': '🏨 Hospedaje',
            'comida': '🍴 Alimentación',
            'otros': '📦 Otros'
        };
        return labels[type] || type;
    }

    getStatusColor(status) {
        const colors = {
            'pendiente': 'warning',
            'aprobado': 'success',
            'rechazado': 'danger'
        };
        return colors[status] || 'secondary';
    }

    getStatusLabel(status) {
        const labels = {
            'pendiente': 'Pendiente',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado'
        };
        return labels[status] || status;
    }

    updateMobileExpenseCards(expenses, currentUser) {
        console.log('🔍 updateMobileExpenseCards called with:', expenses.length, 'expenses');
        const mobileView = document.querySelector('#mobileExpensesView');
        console.log('🔍 mobileView element found:', !!mobileView);
        if (!mobileView) {
            console.error('❌ #mobileExpensesView element not found!');
            return;
        }

        if (expenses.length === 0) {
            mobileView.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5>No hay gastos</h5>
                    <p class="text-muted">No tienes gastos registrados</p>
                </div>
            `;
            return;
        }

        console.log('✅ Generating mobile cards for', expenses.length, 'expenses');
        mobileView.innerHTML = expenses.map(expense => `
            <div class="mobile-expense-card">
                <div class="mobile-expense-header">
                    <div>
                        <div class="mobile-expense-amount">$${parseFloat(expense.monto).toFixed(2)}</div>
                        <div class="mobile-expense-date">${new Date(expense.fecha).toLocaleDateString()}</div>
                    </div>
                    <span class="badge bg-${expense.estado === 'aprobado' ? 'success' : expense.estado === 'rechazado' ? 'danger' : 'warning'}">
                        ${expense.estado === 'aprobado' ? '✓ Aprobado' : expense.estado === 'rechazado' ? '✗ Rechazado' : '⏳ Pendiente'}
                    </span>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <small class="text-muted">Tipo:</small><br>
                        <span class="badge bg-${this.getExpenseTypeColor(expense.tipo)}">
                            ${this.getExpenseTypeIcon(expense.tipo)} ${expense.tipo}
                        </span>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Vehículo:</small><br>
                        <strong>🚚 ${expense.vehiculo_placa || 'N/A'}</strong>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <small class="text-muted">Factura:</small><br>
                        <strong>${expense.numero_factura}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Litros:</small><br>
                        <strong>${expense.litros ? parseFloat(expense.litros).toFixed(1) + ' L' : '-'}</strong>
                    </div>
                </div>
                
                <!-- Botones de Aprobación (solo Admin/Supervisor) -->
                ${(() => {
                    const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
                    const isAdminOrSupervisor = userRole === 'administrador' || userRole === 'admin' || userRole === 'supervisor';
                    return isAdminOrSupervisor && expense.estado === 'pendiente' ? `
                <div class="d-flex gap-2 mb-2">
                    <button class="btn btn-success btn-sm flex-fill" onclick="GastosManager.approveExpense(${expense.id})">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn btn-danger btn-sm flex-fill" onclick="GastosManager.denyExpense(${expense.id})">
                        <i class="fas fa-times"></i> Denegar
                    </button>
                </div>
                ` : '';
                })()}
                
                <!-- Botones de Acciones -->
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-outline-primary btn-sm flex-fill" onclick="GastosManager.viewExpense(${expense.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-outline-info btn-sm flex-fill" onclick="GastosManager.viewReceiptImage(${expense.id})">
                        <i class="fas fa-receipt"></i> Recibo
                    </button>
                    ${(() => {
                        const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
                        const isAdminOrSupervisor = userRole === 'administrador' || userRole === 'admin' || userRole === 'supervisor';
                        return isAdminOrSupervisor ? `
                    <button class="btn btn-outline-danger btn-sm flex-fill" onclick="GastosManager.deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                    ` : '';
                    })()}
                </div>
            </div>
        `).join('');
        console.log('✅ Mobile cards HTML generated, length:', mobileView.innerHTML.length);
    }

    updateMobileAllExpensesCards(expenses, currentUser) {
        console.log('🔍 updateMobileAllExpensesCards called with:', expenses.length, 'expenses');
        const mobileView = document.querySelector('#mobileAllExpensesView');
        console.log('🔍 mobileAllExpensesView element found:', !!mobileView);
        if (!mobileView) {
            console.error('❌ #mobileAllExpensesView element not found!');
            return;
        }

        if (expenses.length === 0) {
            mobileView.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5>No hay gastos del sistema</h5>
                    <p class="text-muted">No se encontraron gastos en el sistema</p>
                </div>
            `;
            return;
        }

        console.log('✅ Generating mobile cards for all expenses:', expenses.length);
        mobileView.innerHTML = expenses.map(expense => `
            <div class="mobile-expense-card">
                <div class="mobile-expense-header">
                    <div>
                        <div class="mobile-expense-amount">$${parseFloat(expense.monto).toFixed(2)}</div>
                        <div class="mobile-expense-date">${new Date(expense.fecha).toLocaleDateString()}</div>
                    </div>
                    <span class="badge bg-${expense.estado === 'aprobado' ? 'success' : expense.estado === 'rechazado' ? 'danger' : 'warning'}">
                        ${expense.estado === 'aprobado' ? '✓ Aprobado' : expense.estado === 'rechazado' ? '✗ Rechazado' : '⏳ Pendiente'}
                    </span>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <small class="text-muted">Usuario:</small><br>
                        <span class="badge bg-info">
                            👤 ${expense.usuario_nombre || 'Usuario #' + expense.usuario_id}
                        </span>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Tipo:</small><br>
                        <span class="badge bg-${this.getExpenseTypeColor(expense.tipo)}">
                            ${this.getExpenseTypeIcon(expense.tipo)} ${expense.tipo}
                        </span>
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <small class="text-muted">Vehículo:</small><br>
                        <strong>🚚 ${expense.vehiculo_placa || 'N/A'}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Factura:</small><br>
                        <strong>${expense.numero_factura}</strong>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <small class="text-muted">Litros:</small><br>
                        <strong>${expense.litros ? parseFloat(expense.litros).toFixed(1) + ' L' : '-'}</strong>
                    </div>
                </div>
                
                <!-- Aprobar/Denegar buttons for pending expenses -->
                ${(() => {
                    const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
                    const isAdminOrSupervisor = userRole === 'administrador' || userRole === 'admin' || userRole === 'supervisor';
                    return isAdminOrSupervisor && expense.estado === 'pendiente' ? `
                <div class="d-flex gap-2 mb-2">
                    <button class="btn btn-success btn-sm flex-fill" onclick="GastosManager.approveExpense(${expense.id})">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn btn-danger btn-sm flex-fill" onclick="GastosManager.denyExpense(${expense.id})">
                        <i class="fas fa-times"></i> Denegar
                    </button>
                </div>
                ` : '';
                })()}
                
                <!-- Action buttons -->
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-outline-primary btn-sm flex-fill" onclick="GastosManager.viewExpense(${expense.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-outline-info btn-sm flex-fill" onclick="GastosManager.viewReceiptImage(${expense.id})">
                        <i class="fas fa-receipt"></i> Recibo
                    </button>
                    ${(() => {
                        const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
                        const isAdminOrSupervisor = userRole === 'administrador' || userRole === 'admin' || userRole === 'supervisor';
                        return isAdminOrSupervisor ? `
                    <button class="btn btn-outline-danger btn-sm flex-fill" onclick="GastosManager.deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                    ` : '';
                    })()}
                </div>
            </div>
        `).join('');
        console.log('✅ All expenses mobile cards HTML generated, length:', mobileView.innerHTML.length);
    }
}

// Static methods for UI interactions
GastosManager.viewExpense = function (id) {
    const expense = window.GastosManagerInstance.expenses.find(e => e.id === id);
    if (!expense) return;

    const modalHtml = `
        <div class="modal fade" id="expenseModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles del Gasto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Tipo:</strong> ${window.GastosManagerInstance.getTypeLabel(expense.tipo)}</p>
                                <p><strong>Fecha:</strong> ${window.GastosManagerInstance.formatDate(expense.fecha)}</p>
                                <p><strong>Monto:</strong> $${parseFloat(expense.monto).toLocaleString()}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Vehículo:</strong> ${expense.vehiculo_placa || 'N/A'}</p>
                                <p><strong>Factura:</strong> ${expense.numero_factura}</p>
                                <p><strong>Estado:</strong> <span class="badge bg-${window.GastosManagerInstance.getStatusColor(expense.estado)}">${window.GastosManagerInstance.getStatusLabel(expense.estado)}</span></p>
                            </div>
                        </div>
                        ${expense.descripcion ? `<p><strong>Descripción:</strong> ${expense.descripcion}</p>` : ''}
                        ${expense.litros > 0 ? `<p><strong>Litros:</strong> ${expense.litros} L</p>` : ''}
                        <p><strong>Kilometraje:</strong> ${expense.kilometraje?.toLocaleString()} km</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('expenseModal'));
    modal.show();

    document.getElementById('expenseModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
};

GastosManager.viewReceiptImage = function (id) {
    const expense = window.GastosManagerInstance.expenses.find(e => e.id === id);
    if (!expense) {
        window.app.showToast('Gasto no encontrado', 'error');
        return;
    }

    console.log('Expense data:', expense);
    console.log('Recibo imagen:', expense.recibo_imagen);

    const hasImage = expense.recibo_imagen && expense.recibo_imagen.trim() !== '';
    const imageContent = hasImage
        ? `<img src="uploads/recibos/${expense.recibo_imagen}" class="img-fluid" alt="Recibo" style="max-height: 70vh; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
           <div class="text-center p-3" style="display: none; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
             <i class="fas fa-exclamation-triangle text-warning fa-2x mb-2"></i>
             <p class="text-warning mb-0">Error al cargar la imagen: uploads/recibos/${expense.recibo_imagen}</p>
           </div>`
        : `<div class="text-center p-5" style="background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
             <i class="fas fa-image fa-3x text-muted mb-3"></i>
             <h5 class="text-muted">No se subió ninguna imagen</h5>
             <p class="text-muted">No hay recibo disponible para este gasto</p>
           </div>`;

    const modalHtml = `
        <div class="modal fade" id="receiptModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">📷 Recibo - ${expense.numero_factura}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        ${imageContent}
                        ${hasImage ? `
                            <div class="mt-3">
                                <p class="text-muted small">Gasto: ${expense.tipo} - $${parseFloat(expense.monto).toFixed(2)}</p>
                                <p class="text-muted small">Fecha: ${new Date(expense.fecha).toLocaleDateString()}</p>
                                <a href="uploads/recibos/${expense.recibo_imagen}" target="_blank" class="btn btn-outline-primary btn-sm mt-2">
                                    <i class="fas fa-external-link-alt"></i> Ver en tamaño completo
                                </a>
                            </div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
    modal.show();

    modal._element.addEventListener('hidden.bs.modal', () => {
        modal._element.remove();
    });
};

GastosManager.deleteExpense = function (id) {
    const expense = window.GastosManagerInstance.expenses.find(e => e.id === id);
    if (!expense) return;

    const modalHtml = `
        <div class="modal fade" id="deleteExpenseModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-receipt me-2"></i>
                            Eliminar Gasto
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>¡Atención!</strong> Esta acción eliminará permanentemente el gasto y su recibo asociado.
                        </div>
                        <p>¿Estás seguro de que deseas eliminar el siguiente gasto?</p>
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Tipo:</strong> 
                                            <span class="badge bg-${window.GastosManagerInstance.getExpenseTypeColor(expense.tipo)}">
                                                ${window.GastosManagerInstance.getExpenseTypeIcon(expense.tipo)} ${expense.tipo}
                                            </span>
                                        </p>
                                        <p><strong>Fecha:</strong> ${new Date(expense.fecha).toLocaleDateString()}</p>
                                        <p><strong>Vehículo:</strong> 🚚 ${expense.vehiculo_placa || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Monto:</strong> <span class="text-success fw-bold">$${parseFloat(expense.monto).toFixed(2)}</span></p>
                                        <p><strong>Factura:</strong> ${expense.numero_factura}</p>
                                        <p><strong>Usuario:</strong> ${expense.usuario_nombre || 'Usuario #' + expense.usuario_id}</p>
                                    </div>
                                </div>
                                ${expense.litros ? `<p><strong>Combustible:</strong> ${expense.litros} L</p>` : ''}
                                ${expense.descripcion ? `<p><strong>Descripción:</strong> ${expense.descripcion}</p>` : ''}
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="form-label">Para confirmar, escribe: <strong>ELIMINAR GASTO</strong></label>
                            <input type="text" class="form-control" id="confirmDeleteExpenseText" placeholder="Escribe: ELIMINAR GASTO">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteExpenseBtn" disabled onclick="GastosManager.confirmDeleteExpense(${id})">
                            <i class="fas fa-trash me-1"></i>Eliminar Gasto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('deleteExpenseModal'));
    modal.show();
    
    // Validación en tiempo real
    const confirmInput = document.getElementById('confirmDeleteExpenseText');
    const confirmBtn = document.getElementById('confirmDeleteExpenseBtn');
    
    confirmInput.addEventListener('input', function() {
        if (this.value === 'ELIMINAR GASTO') {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('btn-secondary');
            confirmBtn.classList.add('btn-danger');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('btn-secondary');
            confirmBtn.classList.remove('btn-danger');
        }
    });
    
    document.getElementById('deleteExpenseModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

GastosManager.confirmDeleteExpense = function(id) {
    deleteExpense(id);
    bootstrap.Modal.getInstance(document.getElementById('deleteExpenseModal')).hide();
};

async function deleteExpense(id) {
    try {
        const response = await window.app.apiCall('gastos/delete.php', {
            method: 'POST',
            body: JSON.stringify({ id: id })
        });
        
        if (response.success) {
            let message = '✅ Gasto eliminado correctamente';
            
            // Mostrar información sobre la eliminación de archivos
            if (response.file_deletion) {
                if (response.file_deletion.file_deleted) {
                    message += ' 🗑️ (imagen eliminada)';
                } else if (response.file_deletion.success) {
                    message += ' ℹ️ (sin imagen asociada)';
                } else {
                    message += ' ⚠️ (imagen no pudo eliminarse)';
                    console.warn('Advertencia eliminación de archivo:', response.file_deletion);
                }
            }
            
            window.app.showToast(message, 'success');
            window.GastosManagerInstance.loadData(); // Reload the data
        } else {
            window.app.showToast('❌ Error al eliminar el gasto', 'error');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        window.app.showToast('❌ Error al eliminar el gasto', 'error');
    }
}

GastosManager.approveExpense = function (id) {
    const expense = window.GastosManagerInstance.expenses.find(e => e.id === id);
    if (!expense) return;

    const modalHtml = `
        <div class="modal fade" id="approveExpenseModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle me-2"></i>
                            Aprobar Gasto
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>¡Atención!</strong> Vas a aprobar este gasto y será marcado como válido.
                        </div>
                        <p>¿Confirmas que quieres <strong>APROBAR</strong> el siguiente gasto?</p>
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Tipo:</strong> 
                                            <span class="badge bg-${window.GastosManagerInstance.getExpenseTypeColor(expense.tipo)}">
                                                ${window.GastosManagerInstance.getExpenseTypeIcon(expense.tipo)} ${expense.tipo}
                                            </span>
                                        </p>
                                        <p><strong>Fecha:</strong> ${new Date(expense.fecha).toLocaleDateString()}</p>
                                        <p><strong>Vehículo:</strong> 🚚 ${expense.vehiculo_placa || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Monto:</strong> <span class="text-success fw-bold">$${parseFloat(expense.monto).toFixed(2)}</span></p>
                                        <p><strong>Factura:</strong> ${expense.numero_factura}</p>
                                        <p><strong>Usuario:</strong> ${expense.usuario_nombre || 'Usuario #' + expense.usuario_id}</p>
                                    </div>
                                </div>
                                ${expense.litros ? `<p><strong>Combustible:</strong> ${expense.litros} L</p>` : ''}
                                ${expense.descripcion ? `<p><strong>Descripción:</strong> ${expense.descripcion}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-success" onclick="GastosManager.confirmApproveExpense(${id})">
                            <i class="fas fa-check me-1"></i>Aprobar Gasto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('approveExpenseModal'));
    modal.show();
    
    document.getElementById('approveExpenseModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

GastosManager.denyExpense = function (id) {
    const expense = window.GastosManagerInstance.expenses.find(e => e.id === id);
    if (!expense) return;

    const modalHtml = `
        <div class="modal fade" id="denyExpenseModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-times-circle me-2"></i>
                            Denegar Gasto
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>¡Atención!</strong> Vas a denegar este gasto y será marcado como rechazado.
                        </div>
                        <p>¿Estás seguro de <strong>DENEGAR</strong> el siguiente gasto?</p>
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Tipo:</strong> 
                                            <span class="badge bg-${window.GastosManagerInstance.getExpenseTypeColor(expense.tipo)}">
                                                ${window.GastosManagerInstance.getExpenseTypeIcon(expense.tipo)} ${expense.tipo}
                                            </span>
                                        </p>
                                        <p><strong>Fecha:</strong> ${new Date(expense.fecha).toLocaleDateString()}</p>
                                        <p><strong>Vehículo:</strong> 🚚 ${expense.vehiculo_placa || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Monto:</strong> <span class="text-success fw-bold">$${parseFloat(expense.monto).toFixed(2)}</span></p>
                                        <p><strong>Factura:</strong> ${expense.numero_factura}</p>
                                        <p><strong>Usuario:</strong> ${expense.usuario_nombre || 'Usuario #' + expense.usuario_id}</p>
                                    </div>
                                </div>
                                ${expense.litros ? `<p><strong>Combustible:</strong> ${expense.litros} L</p>` : ''}
                                ${expense.descripcion ? `<p><strong>Descripción:</strong> ${expense.descripcion}</p>` : ''}
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="form-label">Motivo de denegación (opcional):</label>
                            <textarea class="form-control" id="denyReason" rows="3" placeholder="Escribe el motivo por el cual denegas este gasto..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-warning" onclick="GastosManager.confirmDenyExpense(${id})">
                            <i class="fas fa-times me-1"></i>Denegar Gasto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('denyExpenseModal'));
    modal.show();
    
    document.getElementById('denyExpenseModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

// Funciones de confirmación para los modales
GastosManager.confirmApproveExpense = function(id) {
    approveExpenseAPI(id);
    bootstrap.Modal.getInstance(document.getElementById('approveExpenseModal')).hide();
};

GastosManager.confirmDenyExpense = function(id) {
    const reason = document.getElementById('denyReason').value;
    denyExpenseAPI(id, reason);
    bootstrap.Modal.getInstance(document.getElementById('denyExpenseModal')).hide();
};

// Funciones auxiliares para las llamadas a la API
async function approveExpenseAPI(id) {
    try {
        const response = await window.app.apiCall('gastos/approve.php', {
            method: 'POST',
            body: JSON.stringify({ id: id, action: 'approve' })
        });

        if (response.success) {
            window.app.showToast('✅ Gasto aprobado exitosamente', 'success');
            await window.GastosManagerInstance.loadData();
        } else {
            window.app.showToast('❌ Error al aprobar el gasto', 'danger');
        }
    } catch (error) {
        console.error('Error approving expense:', error);
        window.app.showToast('❌ Error al aprobar gasto: ' + error.message, 'danger');
    }
}

async function denyExpenseAPI(id, reason = '') {
    try {
        const response = await window.app.apiCall('gastos/approve.php', {
            method: 'POST',
            body: JSON.stringify({ id: id, action: 'deny', reason: reason })
        });

        if (response.success) {
            window.app.showToast('❌ Gasto denegado', 'warning');
            await window.GastosManagerInstance.loadData();
        } else {
            window.app.showToast('❌ Error al denegar el gasto', 'danger');
        }
    } catch (error) {
        console.error('Error denying expense:', error);
        window.app.showToast('❌ Error al denegar gasto: ' + error.message, 'danger');
    }
}

