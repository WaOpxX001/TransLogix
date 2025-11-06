// Versión simplificada de ViajesManager
if (typeof ViajesManagerSimple === 'undefined') {
    class ViajesManagerSimple {
        constructor() {
            this.viajes = [];
            this.transportistas = [];
            this.vehiculos = [];
            this.userRole = null;
            this.userId = null;
            this.solicitudesFinalizacion = [];
            console.log('✅ ViajesManagerSimple inicializado');
        }

        // Función para actualizar la vista cuando cambia el rol
        actualizarVistaPorRol() {
            console.log('🔄 Actualizando vista de viajes por cambio de rol...');
            this.obtenerInfoUsuario();

            // Recargar viajes con el nuevo rol
            if (this.viajes && this.viajes.length > 0) {
                console.log('🔄 Reaplicando filtros con nuevo rol...');
                this.mostrarViajes();
            } else {
                console.log('🔄 Cargando viajes para nuevo rol...');
                this.cargarViajes();
            }
        }

        // Función para cargar viajes (llamada desde main.js) - SIMPLIFICADA
        async loadTrips() {
            console.log('🔄 Cargando viajes (método simple)...');

            // Mostrar spinner mientras carga
            this.mostrarSpinner();

            try {
                // Primero actualizar la vista según el rol
                this.actualizarVistaPorRol();

                // CARGA SECUENCIAL SIMPLE - más confiable
                console.log('📊 Cargando datos secuencialmente...');

                // Solo cargar transportistas si no están cargados
                if (!this.transportistas || this.transportistas.length === 0) {
                    console.log('👥 Cargando transportistas...');
                    await this.cargarTransportistas();
                }

                // Solo cargar vehículos si no están cargados
                if (!this.vehiculos || this.vehiculos.length === 0) {
                    console.log('🚗 Cargando vehículos...');
                    await this.cargarVehiculos();
                }

                // Siempre cargar viajes (datos principales)
                console.log('🚛 Cargando viajes...');
                await this.cargarViajes();

                console.log('✅ Carga simple completada');
                console.log(`📊 Datos cargados: ${this.viajes?.length || 0} viajes, ${this.transportistas?.length || 0} transportistas, ${this.vehiculos?.length || 0} vehículos`);

            } catch (error) {
                console.error('❌ Error en carga simple:', error);
                this.mostrarMensajeError('Error cargando datos: ' + error.message);
            }
        }

        // Mostrar spinner de carga
        mostrarSpinner() {
            const container = document.getElementById('viajesContainer');
            if (container) {
                container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <h5 class="text-muted">Cargando viajes...</h5>
                    <p class="text-muted">Por favor espera mientras se cargan los datos</p>
                </div>
            `;
            }
        }

        // Verificar que todos los datos estén cargados
        verificarDatosCargados() {
            console.log('🔍 Verificando integridad de datos...');

            const transportistasOK = this.transportistas && this.transportistas.length > 0;
            const vehiculosOK = this.vehiculos && this.vehiculos.length > 0;
            const viajesOK = this.viajes && this.viajes.length >= 0; // 0 es válido

            console.log('📊 Estado de datos:');
            console.log('  👥 Transportistas:', transportistasOK ? '✅' : '❌', this.transportistas?.length || 0);
            console.log('  🚛 Vehículos:', vehiculosOK ? '✅' : '❌', this.vehiculos?.length || 0);
            console.log('  📋 Viajes:', viajesOK ? '✅' : '❌', this.viajes?.length || 0);

            if (!transportistasOK) {
                console.warn('⚠️ Transportistas no cargados correctamente');
            }

            if (!vehiculosOK) {
                console.warn('⚠️ Vehículos no cargados correctamente');
            }

            return transportistasOK && vehiculosOK && viajesOK;
        }

        // Esperar a que los datos se carguen y luego aplicar filtros
        esperarYAplicarFiltros() {
            console.log('⏳ Esperando a que los viajes se carguen...');

            const intentarAplicarFiltros = (intentos = 0) => {
                const container = document.getElementById('viajesContainer');
                if (!container) {
                    console.error('❌ Contenedor de viajes no encontrado');
                    return;
                }

                // Verificar si hay tarjetas cargadas
                const tarjetas = container.querySelectorAll('.card');
                const spinner = container.querySelector('.spinner-border');

                console.log(`🔍 Intento ${intentos + 1}: Tarjetas encontradas: ${tarjetas.length}, Spinner presente: ${!!spinner}`);

                if (tarjetas.length > 0) {
                    // Hay tarjetas, aplicar filtros
                    console.log('✅ Viajes encontrados, aplicando filtros...');
                    this.aplicarFiltrosPorRol();
                } else if (intentos < 20) {
                    // No hay tarjetas aún, esperar un poco más
                    setTimeout(() => intentarAplicarFiltros(intentos + 1), 500);
                } else {
                    // Después de 10 segundos, mostrar mensaje
                    console.warn('⚠️ No se encontraron viajes después de esperar');
                    this.mostrarMensajeVacio();
                }
            };

            // Empezar a intentar inmediatamente
            intentarAplicarFiltros();
        }

        // Aplicar filtros según el rol del usuario a los datos existentes
        aplicarFiltrosPorRol() {
            console.log('🔍 Aplicando filtros por rol...');

            const container = document.getElementById('viajesContainer');
            if (!container) {
                console.error('❌ Contenedor de viajes no encontrado');
                return;
            }

            // Obtener todas las tarjetas de viajes existentes
            const todasLasTarjetas = container.querySelectorAll('.card');
            console.log('📋 Total de tarjetas encontradas:', todasLasTarjetas.length);

            if (this.userRole === 'transportista') {
                console.log('🚛 Aplicando filtro de transportista para:', this.getCurrentUserName());

                // Para transportistas: solo mostrar sus viajes
                todasLasTarjetas.forEach(tarjeta => {
                    // Buscar el nombre del transportista en diferentes lugares posibles
                    let transportistaNombre = '';

                    // Buscar en el footer de la tarjeta (donde suele estar el nombre)
                    const footerSmall = tarjeta.querySelector('.card-footer small');
                    if (footerSmall) {
                        transportistaNombre = footerSmall.textContent.trim();
                    } else {
                        // Buscar en cualquier elemento small de la tarjeta
                        const smallElements = tarjeta.querySelectorAll('small');
                        for (let small of smallElements) {
                            const text = small.textContent.trim();
                            // Si el texto parece un nombre (no es una fecha, hora, etc.)
                            if (text && !text.includes('/') && !text.includes(':') && !text.includes('VJ-')) {
                                transportistaNombre = text;
                                break;
                            }
                        }
                    }

                    console.log('🔍 Tarjeta transportista:', transportistaNombre, '| Usuario actual:', this.getCurrentUserName());

                    if (transportistaNombre === this.getCurrentUserName()) {
                        tarjeta.style.display = 'block';
                        tarjeta.parentElement.style.display = 'block'; // Mostrar el contenedor col
                        console.log('✅ Mostrando viaje de', transportistaNombre);
                    } else {
                        tarjeta.style.display = 'none';
                        tarjeta.parentElement.style.display = 'none'; // Ocultar el contenedor col
                        console.log('❌ Ocultando viaje de', transportistaNombre);
                    }
                });

                console.log('✅ Filtro de transportista aplicado');
            } else {
                console.log('👨‍💼 Mostrando todos los viajes para admin/supervisor');

                // Para admin/supervisor: mostrar todos los viajes
                todasLasTarjetas.forEach(tarjeta => {
                    tarjeta.style.display = 'block';
                    tarjeta.parentElement.style.display = 'block';
                });

                console.log('✅ Todos los viajes visibles');
            }
        }

        // Cargar viajes reales de la API o extraer de la interfaz existente
        async cargarViajesReales() {
            try {
                // Primero intentar extraer viajes de la interfaz existente
                const viajesExistentes = this.extraerViajesDeInterfaz();
                if (viajesExistentes && viajesExistentes.length > 0) {
                    console.log('📋 Viajes extraídos de la interfaz existente:', viajesExistentes.length);
                    return viajesExistentes;
                }

                // Si no hay viajes en la interfaz, intentar API
                const response = await fetch('api/viajes/list.php');
                if (!response.ok) {
                    throw new Error('API no disponible');
                }
                const data = await response.json();
                return data.viajes || data || [];
            } catch (error) {
                console.warn('⚠️ No se pudieron cargar viajes reales:', error.message);
                throw error;
            }
        }

        // Extraer viajes de la interfaz existente
        extraerViajesDeInterfaz() {
            try {
                const container = document.getElementById('viajesContainer');
                if (!container) return [];

                // Buscar tarjetas de viajes existentes
                const tarjetas = container.querySelectorAll('.card');
                const viajes = [];

                tarjetas.forEach((tarjeta, index) => {
                    try {
                        // Extraer información de cada tarjeta
                        const origen = this.extraerTexto(tarjeta, '.text-success') || 'Origen';
                        const destino = this.extraerTexto(tarjeta, '.text-danger') || 'Destino';

                        // Extraer estado del badge
                        const estadoBadge = tarjeta.querySelector('.badge');
                        let estado = 'pendiente';
                        if (estadoBadge) {
                            const badgeText = estadoBadge.textContent.toLowerCase();
                            if (badgeText.includes('cancelado')) estado = 'cancelado';
                            else if (badgeText.includes('pendiente')) estado = 'pendiente';
                            else if (badgeText.includes('en ruta')) estado = 'en_ruta';
                            else if (badgeText.includes('completado')) estado = 'completado';
                        }

                        // Extraer transportista
                        const transportistaEl = tarjeta.querySelector('.card-footer small, .text-muted');
                        const transportista = transportistaEl ? transportistaEl.textContent.trim() : 'Transportista';

                        // Crear objeto viaje
                        const viaje = {
                            id: index + 1,
                            origen: origen,
                            destino: destino,
                            estado: estado,
                            fecha_programada: '2025-01-03',
                            hora_programada: '08:00',
                            transportista_nombre: transportista,
                            vehiculo_placa: 'VEH-' + String(index + 1).padStart(3, '0'),
                            observaciones: 'Viaje extraído de interfaz existente'
                        };

                        viajes.push(viaje);
                    } catch (error) {
                        console.warn('⚠️ Error extrayendo viaje de tarjeta:', error);
                    }
                });

                return viajes;
            } catch (error) {
                console.error('❌ Error extrayendo viajes de interfaz:', error);
                return [];
            }
        }

        // Función auxiliar para extraer texto
        extraerTexto(elemento, selector) {
            try {
                const el = elemento.querySelector(selector);
                return el ? el.textContent.trim() : null;
            } catch (error) {
                return null;
            }
        }

        // Simulación de carga de viajes (reemplazar con API real)
        async simularCargaViajes() {
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));

            // Datos que coinciden con las imágenes mostradas
            return [
                // Viajes de Melany2 (Transportista)
                {
                    id: 1,
                    origen: 'Chihuahua',
                    destino: 'Nuevo León',
                    estado: 'cancelado',
                    fecha_programada: '2025-01-03',
                    hora_programada: '04:00',
                    transportista_nombre: 'Melany2',
                    vehiculo_placa: 'JKL-012',
                    observaciones: 'Carga por confirmar cantidad de cajas'
                },
                {
                    id: 2,
                    origen: 'Sonora',
                    destino: 'Baja California',
                    estado: 'pendiente',
                    fecha_programada: '2025-01-03',
                    hora_programada: '07:30',
                    transportista_nombre: 'Melany2',
                    vehiculo_placa: 'JKL-012',
                    observaciones: 'Paquete documentos para oficina zona 2'
                },
                {
                    id: 3,
                    origen: 'Veracruz',
                    destino: 'Yucatán',
                    estado: 'en_ruta',
                    fecha_programada: '2025-01-02',
                    hora_programada: '05:00',
                    transportista_nombre: 'Melany2',
                    vehiculo_placa: 'JBL-112',
                    observaciones: 'Viaje en progreso, llegada estimada 12:00'
                },
                {
                    id: 4,
                    origen: 'Guanajuato',
                    destino: 'Puebla',
                    estado: 'completado',
                    fecha_programada: '2025-01-01',
                    hora_programada: '06:00',
                    transportista_nombre: 'Melany2',
                    vehiculo_placa: 'ABC-123',
                    observaciones: 'Entrega completada exitosamente'
                },
                {
                    id: 5,
                    origen: 'Nuevo León',
                    destino: 'Jalisco',
                    estado: 'pendiente',
                    fecha_programada: '2025-01-04',
                    hora_programada: '08:00',
                    transportista_nombre: 'Melany2',
                    vehiculo_placa: 'DEF-456',
                    observaciones: 'Carga especial - manejo cuidadoso'
                },
                {
                    id: 6,
                    origen: 'Jalisco',
                    destino: 'Ciudad de México',
                    estado: 'pendiente',
                    fecha_programada: '2025-01-05',
                    hora_programada: '09:00',
                    transportista_nombre: 'Melany2',
                    vehiculo_placa: 'GHI-789',
                    observaciones: 'Entrega programada para oficina central'
                },
                // Viajes de otros transportistas (solo visibles para Admin/Supervisor)
                {
                    id: 7,
                    origen: 'Ciudad de México',
                    destino: 'Guadalajara',
                    estado: 'pendiente',
                    fecha_programada: '2025-01-04',
                    hora_programada: '06:00',
                    transportista_nombre: 'Carlos Silva',
                    vehiculo_placa: 'XYZ-001',
                    observaciones: 'Carga industrial'
                },
                {
                    id: 8,
                    origen: 'Monterrey',
                    destino: 'Tijuana',
                    estado: 'en_ruta',
                    fecha_programada: '2025-01-03',
                    hora_programada: '10:00',
                    transportista_nombre: 'Ana López',
                    vehiculo_placa: 'XYZ-002',
                    observaciones: 'Viaje de larga distancia'
                }
            ];
        }

        // Mostrar viajes en la interfaz
        mostrarViajes() {
            console.log('📋 Mostrando viajes en la interfaz...');

            const container = document.getElementById('viajesContainer');
            if (!container) {
                console.error('❌ Contenedor de viajes no encontrado');
                return;
            }

            if (!this.viajes || this.viajes.length === 0) {
                this.mostrarMensajeVacio();
                return;
            }

            // Filtrar viajes según el rol
            let viajesFiltrados = this.viajes;
            if (this.userRole === 'transportista') {
                // Solo mostrar viajes del transportista actual
                const currentUserName = this.getCurrentUserName();
                const currentUserId = this.getCurrentUserId();
                
                viajesFiltrados = this.viajes.filter(viaje => {
                    // Comparar por ID (más confiable)
                    const matchById = viaje.transportista_id && 
                                     String(viaje.transportista_id) === String(currentUserId);
                    
                    // Comparar por nombre (fallback)
                    const matchByName = viaje.transportista_nombre === currentUserName;
                    
                    return matchById || matchByName;
                });
                
                console.log(`🚛 Transportista: Filtrando viajes para ${currentUserName} (ID: ${currentUserId})`);
                console.log(`📊 Viajes encontrados: ${viajesFiltrados.length} de ${this.viajes.length}`);
            } else {
                console.log('👨‍💼 Admin/Supervisor: Mostrando todos los viajes');
            }

            console.log('📊 Viajes a mostrar:', viajesFiltrados.length, 'de', this.viajes.length);

            if (viajesFiltrados.length === 0) {
                this.mostrarMensajeVacio();
                return;
            }

            // Generar HTML para los viajes
            const viajesHTML = viajesFiltrados.map(viaje => this.generarTarjetaViaje(viaje)).join('');

            // Actualizar la interfaz
            container.innerHTML = `
            <div class="row g-3">
                ${viajesHTML}
            </div>
        `;

            console.log('✅ Interfaz actualizada con', viajesFiltrados.length, 'viajes');
        }

        // Generar HTML para una tarjeta de viaje
        generarTarjetaViaje(viaje) {
            const estadoColor = this.getEstadoColor(viaje.estado);
            const estadoTexto = this.getEstadoTexto(viaje.estado);
            const estadoIcono = this.getEstadoIcono(viaje.estado);

            return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 border-0 shadow-lg hover-lift" style="border-radius: 15px; overflow: hidden; transition: all 0.3s ease;">
                    <!-- Header con gradiente -->
                    <div class="card-header border-0 bg-gradient-${estadoColor} text-white" style="background: linear-gradient(135deg, var(--bs-${estadoColor}) 0%, var(--bs-${estadoColor === 'warning' ? 'orange' : estadoColor === 'primary' ? 'info' : estadoColor}) 100%); padding: 1.25rem;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <div class="badge bg-white bg-opacity-25 text-white px-3 py-2" style="font-size: 0.9rem; border-radius: 10px;">
                                    ${estadoIcono} ${estadoTexto}
                                </div>
                            </div>
                            <div class="badge bg-white text-dark px-3 py-2" style="font-size: 0.85rem; font-weight: 600; border-radius: 10px;">
                                #VJ-${String(viaje.id).padStart(3, '0')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Body con diseño mejorado -->
                    <div class="card-body" style="padding: 1.5rem;">
                        <!-- Ruta con diseño visual -->
                        <div class="mb-4 p-3" style="background: linear-gradient(to right, #e8f5e9, #fff3e0); border-radius: 12px; border-left: 4px solid #4caf50;">
                            <div class="d-flex align-items-center mb-2">
                                <div class="rounded-circle bg-success d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                                    <i class="fas fa-map-marker-alt text-white" style="font-size: 0.9rem;"></i>
                                </div>
                                <div>
                                    <small class="text-muted d-block" style="font-size: 0.75rem;">Origen</small>
                                    <strong style="font-size: 1rem; color: #2e7d32;">${viaje.origen}</strong>
                                </div>
                            </div>
                            <div class="text-center my-2">
                                <i class="fas fa-arrow-down text-muted" style="font-size: 1.2rem;"></i>
                            </div>
                            <div class="d-flex align-items-center">
                                <div class="rounded-circle bg-danger d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                                    <i class="fas fa-flag-checkered text-white" style="font-size: 0.9rem;"></i>
                                </div>
                                <div>
                                    <small class="text-muted d-block" style="font-size: 0.75rem;">Destino</small>
                                    <strong style="font-size: 1rem; color: #c62828;">${viaje.destino}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Información en tarjetas pequeñas -->
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <div class="p-2 text-center" style="background: #f8f9fa; border-radius: 10px;">
                                    <i class="fas fa-calendar text-primary mb-1" style="font-size: 1.2rem;"></i>
                                    <div class="small fw-bold">${new Date(viaje.fecha_programada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="p-2 text-center" style="background: #f8f9fa; border-radius: 10px;">
                                    <i class="fas fa-clock text-warning mb-1" style="font-size: 1.2rem;"></i>
                                    <div class="small fw-bold">${viaje.hora_programada}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Detalles adicionales -->
                        <div class="mb-2 p-2" style="background: #f1f8ff; border-radius: 8px;">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-user-circle text-info me-2" style="font-size: 1.1rem;"></i>
                                <div class="flex-grow-1">
                                    <small class="text-muted d-block" style="font-size: 0.7rem;">Transportista</small>
                                    <strong style="font-size: 0.9rem;">${viaje.transportista_nombre}</strong>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3 p-2" style="background: #fff8e1; border-radius: 8px;">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-truck text-secondary me-2" style="font-size: 1.1rem;"></i>
                                <div class="flex-grow-1">
                                    <small class="text-muted d-block" style="font-size: 0.7rem;">Vehículo</small>
                                    <strong style="font-size: 0.9rem;">${viaje.vehiculo_placa}</strong>
                                </div>
                            </div>
                        </div>

                        ${viaje.observaciones ? `
                        <div class="observaciones-viaje mb-0 p-3" style="border-radius: 10px; border-left: 4px solid #2196f3; background: #f8f9fa;">
                            <div class="d-block mb-2" style="font-size: 0.8rem; color: #2196f3; font-weight: 600;">
                                <i class="fas fa-info-circle me-1"></i>Observaciones
                            </div>
                            <div style="font-size: 0.95rem; line-height: 1.6; color: #212529;">${viaje.observaciones}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Footer con botones mejorados -->
                    <div class="card-footer border-0 bg-light" style="padding: 1rem;">
                        <div class="d-grid gap-2">
                            <div class="btn-group" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="window.ViajesManager.verDetalles(${viaje.id})" style="border-radius: 8px 0 0 8px;">
                                    <i class="fas fa-eye me-1"></i> Ver
                                </button>
                                <button class="btn btn-outline-warning btn-sm" onclick="window.ViajesManager.editarViaje(${viaje.id})">
                                    <i class="fas fa-edit me-1"></i> Editar
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="window.ViajesManager.eliminarViaje(${viaje.id})" style="border-radius: 0 8px 8px 0;">
                                    <i class="fas fa-trash me-1"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .hover-lift:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
                }
                .bg-gradient-warning {
                    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%) !important;
                }
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%) !important;
                }
                .bg-gradient-success {
                    background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%) !important;
                }
                .bg-gradient-danger {
                    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%) !important;
                }
            </style>
        `;
        }

        // Obtener color del estado
        getEstadoColor(estado) {
            const colores = {
                'pendiente': 'warning',
                'en_ruta': 'primary',
                'completado': 'success',
                'cancelado': 'danger'
            };
            return colores[estado] || 'secondary';
        }

        // Obtener texto del estado
        getEstadoTexto(estado) {
            const textos = {
                'pendiente': 'Pendiente',
                'en_ruta': 'En Ruta',
                'completado': 'Completado',
                'cancelado': 'Cancelado'
            };
            return textos[estado] || estado;
        }

        // Obtener icono del estado
        getEstadoIcono(estado) {
            const iconos = {
                'pendiente': '🕐',
                'en_ruta': '🚛',
                'completado': '✅',
                'cancelado': '❌'
            };
            return iconos[estado] || '📋';
        }

        // Obtener nombre del usuario actual
        getCurrentUserName() {
            try {
                const userStr = sessionStorage.getItem('currentUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    // Soportar tanto 'name' como 'nombre' (en español)
                    return user.name || user.nombre || '';
                }
            } catch (error) {
                console.error('Error obteniendo nombre de usuario:', error);
            }
            return '';
        }

        // Obtener ID del usuario actual
        getCurrentUserId() {
            try {
                const userStr = sessionStorage.getItem('currentUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    return user.id || user.user_id || '';
                }
            } catch (error) {
                console.error('Error obteniendo ID de usuario:', error);
            }
            return '';
        }

        // Recargar viajes de forma completa (después de cambios)
        async recargarViajesCompleto() {
            console.log('🔄 Iniciando recarga completa de viajes...');

            try {
                // Mostrar spinner mientras recarga
                this.mostrarSpinner();

                // Asegurar que los datos auxiliares estén cargados
                if (!this.transportistas || this.transportistas.length === 0) {
                    console.log('👥 Recargando transportistas...');
                    await this.cargarTransportistas();
                }

                if (!this.vehiculos || this.vehiculos.length === 0) {
                    console.log('🚗 Recargando vehículos...');
                    await this.cargarVehiculos();
                }

                // Recargar viajes
                console.log('📊 Recargando viajes...');
                await this.cargarViajes();

                console.log('✅ Recarga completa exitosa');
            } catch (error) {
                console.error('❌ Error en recarga completa:', error);
                this.mostrarMensajeError('Error recargando datos: ' + error.message);
            }
        }

        // Actualizar nombres de transportistas en las tarjetas existentes
        actualizarNombresTransportistas() {
            const container = document.getElementById('viajesContainer');
            if (!container) return;

            // Buscar todos los elementos small que contienen iconos de usuario
            const smallElements = container.querySelectorAll('small');

            smallElements.forEach(element => {
                // Verificar si contiene el icono de usuario
                const userIcon = element.querySelector('i.fa-user');
                if (userIcon) {
                    const text = element.textContent.trim();

                    // Si el texto contiene "ID:" significa que no se encontró el nombre
                    if (text.includes('ID:')) {
                        const idMatch = text.match(/ID:\s*(\d+)/);
                        if (idMatch) {
                            const transportistaId = idMatch[1];
                            const nombreTransportista = this.getNombreTransportista(transportistaId);

                            // Actualizar el contenido manteniendo el icono
                            element.innerHTML = `<i class="fas fa-user me-1"></i>${nombreTransportista}`;
                            console.log(`✅ Actualizado transportista ID ${transportistaId} -> ${nombreTransportista}`);
                        }
                    }
                }
            });
        }

        // Mostrar mensaje cuando no hay viajes
        mostrarMensajeVacio() {
            console.log('📭 No hay viajes para mostrar');

            const container = document.getElementById('viajesContainer');
            if (container) {
                const mensajeTipo = this.userRole === 'transportista' ? 'asignados' : 'disponibles';
                container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-truck fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">No hay viajes ${mensajeTipo}</h4>
                    <p class="text-muted">
                        ${this.userRole === 'transportista'
                        ? 'No tienes viajes asignados en este momento'
                        : 'Los viajes aparecerán aquí una vez que sean creados'
                    }
                    </p>
                    <button class="btn btn-outline-primary mt-3" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-2"></i>Recargar Página
                    </button>
                </div>
            `;
            }
        }

        // Mostrar mensaje de error
        mostrarMensajeError(mensaje) {
            console.error('❌', mensaje);

            const container = document.getElementById('viajesContainer');
            if (container) {
                container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
                    <h4 class="text-danger">Error al cargar datos</h4>
                    <p class="text-muted">${mensaje}</p>
                    <div class="mt-3">
                        <button class="btn btn-primary me-2" onclick="window.ViajesManager.loadTrips()">
                            <i class="fas fa-sync-alt me-2"></i>Reintentar
                        </button>
                        <button class="btn btn-outline-secondary" onclick="location.reload()">
                            <i class="fas fa-refresh me-2"></i>Recargar Página
                        </button>
                    </div>
                </div>
            `;
            }
        }

        // Actualizar contador de viajes (si existe en la UI)
        actualizarContadorViajes(cantidad) {
            console.log(`📊 Total de viajes: ${cantidad}`);
            // Aquí podrías actualizar algún contador en la UI
        }

        // Obtener información del usuario actual
        obtenerInfoUsuario() {
            try {
                // Obtener información del sessionStorage (más rápido y confiable)
                const userStr = sessionStorage.getItem('currentUser');
                console.log('🔍 DEBUG: sessionStorage currentUser raw:', userStr);

                if (userStr) {
                    const user = JSON.parse(userStr);
                    console.log('🔍 DEBUG: Usuario parseado completo:', user);

                    // IMPORTANTE: Soportar tanto 'role' como 'rol' (en español)
                    const rolRaw = user.role || user.rol || '';
                    console.log('🔍 DEBUG: Rol raw encontrado:', rolRaw);

                    // Limpiar el rol de posibles espacios o caracteres extraños y normalizar a minúsculas
                    this.userRole = rolRaw.toString().trim().toLowerCase();
                    this.userId = user.id || null;

                    console.log('👤 Usuario desde sessionStorage:', {
                        role: this.userRole,
                        id: this.userId,
                        name: user.name || user.nombre,
                        userRoleType: typeof this.userRole,
                        userRoleValue: `"${this.userRole}"`,
                        userRoleLength: this.userRole.length
                    });

                    // DEBUGGING CRÍTICO: Verificar la comparación
                    console.log('🔍 DEBUG: Comparación de roles (normalizado):');
                    console.log('  this.userRole === "transportista":', this.userRole === 'transportista');
                    console.log('  this.userRole === "admin":', this.userRole === 'admin');
                    console.log('  this.userRole === "supervisor":', this.userRole === 'supervisor');

                    // Configurar restricciones basadas en el rol
                    this.configurarRestricciones();

                    return user;
                } else {
                    console.warn('⚠️ No hay información de usuario en sessionStorage');
                    // Fallback: intentar obtener del servidor
                    return this.obtenerInfoUsuarioDelServidor();
                }
            } catch (error) {
                console.error('❌ Error obteniendo info del usuario:', error);
                return this.obtenerInfoUsuarioDelServidor();
            }
        }

        // Fallback: obtener información del servidor
        async obtenerInfoUsuarioDelServidor() {
            try {
                const response = await fetch('/LogisticaFinal/test_session.php');
                const data = await response.json();

                this.userRole = (data.effective_role || '').toString().trim().toLowerCase();
                this.userId = data.user_id || null;

                console.log('👤 Usuario desde servidor:', {
                    role: this.userRole,
                    id: this.userId
                });

                // Configurar restricciones basadas en el rol
                this.configurarRestricciones();

                return data;
            } catch (error) {
                console.error('❌ Error obteniendo info del usuario del servidor:', error);
                return null;
            }
        }

        // Configurar restricciones de UI basadas en el rol
        configurarRestricciones() {
            console.log('🔧 Configurando restricciones para rol:', this.userRole);
            console.log('🔍 DEBUG: Tipo de userRole:', typeof this.userRole);
            console.log('🔍 DEBUG: Valor exacto de userRole:', `"${this.userRole}"`);
            console.log('🔍 DEBUG: Longitud del string:', this.userRole.length);

            // Usar setTimeout para asegurar que el DOM esté completamente cargado
            setTimeout(() => {
                console.log('🔍 DEBUG: Dentro del setTimeout, verificando condición...');
                console.log('🔍 DEBUG: this.userRole === "transportista":', this.userRole === 'transportista');

                if (this.userRole === 'transportista') {
                    console.log('🚛 Aplicando vista RESTRINGIDA para transportista');

                    // SOLO PARA TRANSPORTISTAS: Ocultar botón "Nuevo Viaje"
                    const btnNuevoViaje = document.getElementById('btnNuevoViaje');
                    if (btnNuevoViaje) {
                        btnNuevoViaje.style.display = 'none';
                        btnNuevoViaje.classList.add('transportista-hidden');
                        console.log('❌ Botón "Nuevo Viaje" oculto para transportista');
                    } else {
                        console.warn('⚠️ Botón "Nuevo Viaje" no encontrado');
                    }

                    // SOLO PARA TRANSPORTISTAS: Ocultar completamente la columna del filtro de transportista
                    const filterTransportista = document.getElementById('filterTransportista');
                    const filterTransportistaCol = filterTransportista ? filterTransportista.closest('.col-md-3') : null;
                    if (filterTransportistaCol) {
                        filterTransportistaCol.style.display = 'none !important';
                        filterTransportistaCol.classList.add('transportista-hidden');
                        console.log('❌ Columna completa del filtro transportista ocultada');
                    } else {
                        console.warn('⚠️ Columna del filtro de transportista no encontrada');
                    }

                    // SOLO PARA TRANSPORTISTAS: Ocultar botón "Limpiar Filtros" 
                    const clearFiltersBtn = document.querySelector('#viajesSection .btn-outline-secondary');
                    if (clearFiltersBtn) {
                        const clearFiltersCol = clearFiltersBtn.closest('.col-md-3');
                        if (clearFiltersCol) {
                            clearFiltersCol.style.display = 'none !important';
                            clearFiltersCol.classList.add('transportista-hidden');
                            console.log('❌ Botón "Limpiar Filtros" ocultado');
                        }
                    }

                    // SOLO PARA TRANSPORTISTAS: Actualizar título de la sección
                    const cardTitle = document.querySelector('#viajesSection .card-title');
                    if (cardTitle) {
                        cardTitle.innerHTML = '🚛 Mis Viajes Asignados';
                        console.log('✅ Título cambiado para transportista');
                    } else {
                        console.warn('⚠️ Título de sección no encontrado');
                    }

                } else {
                    console.log('👨‍💼 Aplicando vista COMPLETA para admin/supervisor');

                    // ADMIN/SUPERVISOR: Asegurar que todo esté visible y remover clases de restricción
                    const btnNuevoViaje = document.getElementById('btnNuevoViaje');
                    if (btnNuevoViaje) {
                        btnNuevoViaje.style.display = 'block';
                        btnNuevoViaje.classList.remove('transportista-hidden');
                        console.log('✅ Botón "Nuevo Viaje" visible para admin/supervisor');
                    }

                    // ADMIN/SUPERVISOR: Restaurar columna del filtro de transportista
                    const filterTransportista = document.getElementById('filterTransportista');
                    const filterTransportistaCol = filterTransportista ? filterTransportista.closest('.col-md-3') : null;
                    if (filterTransportistaCol) {
                        filterTransportistaCol.style.display = 'block';
                        filterTransportistaCol.classList.remove('transportista-hidden');
                        console.log('✅ Columna del filtro transportista visible para admin/supervisor');
                    }

                    // ADMIN/SUPERVISOR: Restaurar botón "Limpiar Filtros"
                    const clearFiltersBtn = document.querySelector('#viajesSection .btn-outline-secondary');
                    if (clearFiltersBtn) {
                        const clearFiltersCol = clearFiltersBtn.closest('.col-md-3');
                        if (clearFiltersCol) {
                            clearFiltersCol.style.display = 'block';
                            clearFiltersCol.classList.remove('transportista-hidden');
                            console.log('✅ Botón "Limpiar Filtros" visible para admin/supervisor');
                        }
                    }

                    const cardTitle = document.querySelector('#viajesSection .card-title');
                    if (cardTitle) {
                        cardTitle.innerHTML = '📋 Gestión de Viajes';
                        console.log('✅ Título configurado para admin/supervisor');
                    }
                }

                console.log('🎯 Configuración de restricciones completada para:', this.userRole);
            }, 50); // Pequeño delay para asegurar que el DOM esté listo
        }

        // Configurar restricciones de forma inmediata y simple
        configurarRestriccionesInmediatas() {
            // Obtener rol del usuario de sessionStorage
            let userRole = '';
            try {
                const userStr = sessionStorage.getItem('currentUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    userRole = (user.role || '').toString().trim().toLowerCase();
                    this.userRole = userRole;
                    this.userId = user.id || null;

                    console.log('👤 Usuario detectado:', {
                        role: userRole,
                        id: this.userId,
                        name: user.name
                    });
                }
            } catch (error) {
                console.error('❌ Error obteniendo usuario:', error);
                return;
            }

            console.log('🔧 Aplicando restricciones para rol:', userRole);

            if (userRole === 'transportista') {
                console.log('🚛 TRANSPORTISTA - Aplicando restricciones');

                // Ocultar botón Nuevo Viaje
                const btnNuevo = document.getElementById('btnNuevoViaje');
                if (btnNuevo) {
                    btnNuevo.style.display = 'none';
                    console.log('❌ Botón Nuevo Viaje oculto');
                }

                // Ocultar filtro de transportista
                const filterTransp = document.getElementById('filterTransportista');
                if (filterTransp && filterTransp.parentElement) {
                    filterTransp.parentElement.style.display = 'none';
                    console.log('❌ Filtro transportista oculto');
                }

                // Cambiar título
                const titulo = document.querySelector('#viajesSection .card-title');
                if (titulo) {
                    titulo.innerHTML = '🚛 Mis Viajes Asignados';
                    console.log('✅ Título cambiado');
                }

            } else {
                console.log('👨‍💼 ADMIN/SUPERVISOR - Vista completa');

                // Asegurar que todo esté visible
                const btnNuevo = document.getElementById('btnNuevoViaje');
                if (btnNuevo) {
                    btnNuevo.style.display = 'block';
                }

                const filterTransp = document.getElementById('filterTransportista');
                if (filterTransp && filterTransp.parentElement) {
                    filterTransp.parentElement.style.display = 'block';
                }

                const titulo = document.querySelector('#viajesSection .card-title');
                if (titulo) {
                    titulo.innerHTML = '📋 Gestión de Viajes';
                }
            }

            console.log('✅ Restricciones aplicadas correctamente');
        }

        // Mostrar modal personalizado para viajes
        mostrarModalViajes(tipo, titulo, mensaje, datos = null, callback = null) {
            // Remover modal existente si existe
            const existingModal = document.getElementById('viajesModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Determinar icono y color según el tipo
            let icono = '';
            let colorBoton = '';
            let textoBoton = '';

            switch (tipo) {
                case 'success':
                    icono = '✅';
                    colorBoton = 'btn-success';
                    textoBoton = 'Aceptar';
                    break;
                case 'error':
                    icono = '❌';
                    colorBoton = 'btn-danger';
                    textoBoton = 'Aceptar';
                    break;
                case 'warning':
                    icono = '⚠️';
                    colorBoton = 'btn-warning';
                    textoBoton = 'Aceptar';
                    break;
                case 'confirm':
                    icono = '🗑️';
                    colorBoton = 'btn-danger';
                    textoBoton = 'Eliminar';
                    break;
                case 'info':
                    icono = 'ℹ️';
                    colorBoton = 'btn-primary';
                    textoBoton = 'Aceptar';
                    break;
            }

            // Crear el modal
            const modalHTML = `
            <div class="modal fade" id="viajesModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title">
                                <span class="me-2" style="font-size: 1.5rem;">${icono}</span>
                                ${titulo}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">${mensaje}</p>
                            ${datos ? `
                                <div class="bg-light p-3 rounded mb-3">
                                    <small class="text-muted">
                                        ${datos}
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            ${tipo === 'confirm' ? `
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn ${colorBoton}" id="viajesModalConfirm">${textoBoton}</button>
                            ` : `
                                <button type="button" class="btn ${colorBoton}" data-bs-dismiss="modal">${textoBoton}</button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;

            // Agregar al DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Configurar eventos
            const modal = new bootstrap.Modal(document.getElementById('viajesModal'));

            if (tipo === 'confirm' && callback) {
                document.getElementById('viajesModalConfirm').addEventListener('click', () => {
                    modal.hide();
                    callback();
                });
            }

            // Auto-remover del DOM cuando se cierre
            document.getElementById('viajesModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });

            // Mostrar modal
            modal.show();
        }

        // Modal personalizado para eliminar viaje
        mostrarModalEliminarViaje(viaje, transportista, vehiculo, callback) {
            // Remover modal existente si existe
            const existingModal = document.getElementById('eliminarViajeModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Determinar el estado del viaje para mostrar advertencias
            let advertencia = '';
            if (viaje.estado === 'en_progreso') {
                advertencia = `
                <div class="alert alert-warning d-flex align-items-center mb-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <span><strong>¡Atención!</strong> Este viaje está actualmente en progreso.</span>
                </div>
            `;
            } else if (viaje.estado === 'completado') {
                advertencia = `
                <div class="alert alert-info d-flex align-items-center mb-3">
                    <i class="fas fa-info-circle me-2"></i>
                    <span><strong>Nota:</strong> Este viaje ya ha sido completado.</span>
                </div>
            `;
            }

            // Crear el modal personalizado
            const modalHTML = `
            <div class="modal fade" id="eliminarViajeModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-danger">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-trash-alt me-2"></i>
                                Eliminar Viaje
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${advertencia}
                            
                            <div class="text-center mb-4">
                                <i class="fas fa-exclamation-triangle text-warning" style="font-size: 4rem;"></i>
                                <h4 class="mt-3 text-danger">¿Estás seguro?</h4>
                                <p class="text-muted">Esta acción no se puede deshacer. El viaje será eliminado permanentemente.</p>
                            </div>

                            <div class="card bg-light">
                                <div class="card-header">
                                    <h6 class="mb-0">
                                        <i class="fas fa-route me-2"></i>
                                        Información del Viaje a Eliminar
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-center mb-2">
                                                <i class="fas fa-hashtag text-primary me-2"></i>
                                                <strong>Número:</strong>
                                                <span class="ms-2">${viaje.numero_viaje || `VJ-${String(viaje.id).padStart(3, '0')}`}</span>
                                            </div>
                                            <div class="d-flex align-items-center mb-2">
                                                <i class="fas fa-map-marker-alt text-success me-2"></i>
                                                <strong>Origen:</strong>
                                                <span class="ms-2">${viaje.origen_estado}</span>
                                            </div>
                                            <div class="d-flex align-items-center mb-2">
                                                <i class="fas fa-flag-checkered text-danger me-2"></i>
                                                <strong>Destino:</strong>
                                                <span class="ms-2">${viaje.destino_estado}</span>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex align-items-center mb-2">
                                                <i class="fas fa-user text-info me-2"></i>
                                                <strong>Transportista:</strong>
                                                <span class="ms-2">${transportista}</span>
                                            </div>
                                            <div class="d-flex align-items-center mb-2">
                                                <i class="fas fa-truck text-warning me-2"></i>
                                                <strong>Vehículo:</strong>
                                                <span class="ms-2">${vehiculo}</span>
                                            </div>
                                            <div class="d-flex align-items-center mb-2">
                                                <i class="fas fa-calendar text-secondary me-2"></i>
                                                <strong>Fecha:</strong>
                                                <span class="ms-2">${this.formatFecha(viaje.fecha_programada)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${viaje.estado ? `
                                        <div class="mt-3 pt-3 border-top">
                                            <div class="d-flex align-items-center">
                                                <i class="fas fa-info-circle text-primary me-2"></i>
                                                <strong>Estado actual:</strong>
                                                <span class="ms-2 badge ${this.getEstadoBadgeClass(viaje.estado)}">${this.getEstadoTexto(viaje.estado)}</span>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmarEliminarViaje">
                                <i class="fas fa-trash-alt me-2"></i>Sí, Eliminar Viaje
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

            // Agregar al DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Configurar eventos
            const modal = new bootstrap.Modal(document.getElementById('eliminarViajeModal'));

            document.getElementById('confirmarEliminarViaje').addEventListener('click', () => {
                modal.hide();
                callback();
            });

            // Auto-remover del DOM cuando se cierre
            document.getElementById('eliminarViajeModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });

            // Mostrar modal
            modal.show();
        }

        // Obtener clase CSS para el badge del estado
        getEstadoBadgeClass(estado) {
            switch (estado) {
                case 'pendiente': return 'bg-warning text-dark';
                case 'en_progreso': return 'bg-primary';
                case 'completado': return 'bg-success';
                case 'cancelado': return 'bg-danger';
                default: return 'bg-secondary';
            }
        }

        // Obtener texto legible del estado
        getEstadoTexto(estado) {
            switch (estado) {
                case 'pendiente': return 'Pendiente';
                case 'en_progreso': return 'En Progreso';
                case 'completado': return 'Completado';
                case 'cancelado': return 'Cancelado';
                default: return estado;
            }
        }

        // Cargar estados mexicanos
        cargarEstadosMexicanos() {
            const estados = [
                'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
                'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
                'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
                'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
                'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
                'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
            ];

            const selectOrigen = document.getElementById('origenEstado');
            const selectDestino = document.getElementById('destinoEstado');

            if (selectOrigen) {
                selectOrigen.innerHTML = '<option value="">Seleccionar estado...</option>';
                estados.forEach(estado => {
                    const option = document.createElement('option');
                    option.value = estado;
                    option.textContent = estado;
                    selectOrigen.appendChild(option);
                });
                console.log('✅ Estados cargados en origen');
            }

            if (selectDestino) {
                selectDestino.innerHTML = '<option value="">Seleccionar estado...</option>';
                estados.forEach(estado => {
                    const option = document.createElement('option');
                    option.value = estado;
                    option.textContent = estado;
                    selectDestino.appendChild(option);
                });
                console.log('✅ Estados cargados en destino');
            }
        }

        // Cargar transportistas
        async cargarTransportistas() {
            try {
                console.log('📡 Haciendo petición a /LogisticaFinal/api/transportistas/list.php');
                const response = await fetch('/LogisticaFinal/api/transportistas/list.php');

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('📥 Respuesta recibida:', data);

                if (Array.isArray(data) && data.length > 0) {
                    this.transportistas = data;
                    console.log('✅ Transportistas cargados exitosamente:', data.length);

                    // Debug: mostrar estructura de los transportistas
                    console.log('🔍 Primer transportista:', data[0]);
                    console.log('🔍 Campos disponibles:', Object.keys(data[0]));

                    // Cargar en select del modal (CRÍTICO para edición)
                    this.cargarTransportistasEnModal(data);

                    // Cargar en select de filtros
                    this.cargarTransportistasEnFiltro(data);

                    // Actualizar tarjetas existentes si ya hay viajes mostrados
                    if (this.viajes && this.viajes.length > 0) {
                        console.log('🔄 Actualizando nombres de transportistas en tarjetas...');
                        setTimeout(() => {
                            this.actualizarNombresTransportistas();
                        }, 100);
                    }

                    return true;
                } else if (Array.isArray(data) && data.length === 0) {
                    console.warn('⚠️ No hay transportistas en la base de datos');
                    this.transportistas = [];
                    return true;
                } else {
                    throw new Error('Los datos recibidos no son un array válido: ' + JSON.stringify(data));
                }
            } catch (error) {
                console.error('❌ Error cargando transportistas:', error);
                this.transportistas = [];
                throw error;
            }
        }

        // Cargar transportistas en el modal de edición
        cargarTransportistasEnModal(transportistas) {
            const select = document.getElementById('transportista');
            if (select) {
                console.log('📝 Cargando transportistas en modal...');
                select.innerHTML = '<option value="">Seleccionar transportista...</option>';
                transportistas.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = t.nombre;
                    select.appendChild(option);
                });
                console.log('✅ Modal dropdown poblado con', transportistas.length, 'transportistas');
            } else {
                console.warn('⚠️ Select de transportista no encontrado en modal');
            }
        }

        // Cargar transportistas en el filtro
        cargarTransportistasEnFiltro(transportistas) {
            const filterSelect = document.getElementById('filterTransportista');
            if (filterSelect) {
                console.log('🔍 Cargando transportistas en filtro...');
                const currentValue = filterSelect.value;
                filterSelect.innerHTML = '<option value="">Todos los transportistas</option>';
                transportistas.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = t.nombre;
                    filterSelect.appendChild(option);
                });
                if (currentValue) filterSelect.value = currentValue;
                console.log('✅ Filtro dropdown poblado con', transportistas.length, 'transportistas');
            } else {
                console.warn('⚠️ Select de filtro transportista no encontrado');
            }
        }

        // Cargar vehículos
        async cargarVehiculos() {
            try {
                console.log('📡 Haciendo petición a /LogisticaFinal/api/vehiculos/list.php');
                const response = await fetch('/LogisticaFinal/api/vehiculos/list.php');

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('📥 Respuesta de vehículos recibida:', data);

                if (Array.isArray(data) && data.length > 0) {
                    this.vehiculos = data;
                    console.log('✅ Vehículos cargados exitosamente:', data.length);

                    // Debug: mostrar estructura de los vehículos
                    console.log('🔍 Primer vehículo:', data[0]);
                    console.log('🔍 Campos disponibles:', Object.keys(data[0]));

                    // Filtrar solo vehículos disponibles para los dropdowns
                    console.log('🔍 INICIANDO FILTRADO DE VEHÍCULOS...');
                    console.log('📊 Total de vehículos recibidos:', data.length);

                    const vehiculosDisponibles = data.filter(v => {
                        const estadoOriginal = v.estado;
                        const estadoNormalizado = (v.estado || '').toString().toLowerCase().trim();
                        const esDisponible = estadoNormalizado === 'disponible';

                        console.log(`🔍 Vehículo: ${v.placa}`);
                        console.log(`   - Estado original: "${estadoOriginal}" (tipo: ${typeof estadoOriginal})`);
                        console.log(`   - Estado normalizado: "${estadoNormalizado}"`);
                        console.log(`   - ¿Es disponible?: ${esDisponible}`);

                        return esDisponible;
                    });

                    console.log(`✅ FILTRADO COMPLETADO: ${vehiculosDisponibles.length} de ${data.length} vehículos son disponibles`);
                    console.log('📋 Vehículos disponibles:', vehiculosDisponibles.map(v => `${v.placa} (${v.estado})`).join(', '));

                    // Cargar en select del modal de nuevo viaje (si existe)
                    const select = document.getElementById('vehiculo');
                    if (select) {
                        select.innerHTML = '<option value="">Seleccionar vehículo...</option>';
                        vehiculosDisponibles.forEach(v => {
                            const option = document.createElement('option');
                            option.value = v.id;
                            option.textContent = `${v.marca} ${v.modelo} (${v.placa})`;
                            select.appendChild(option);
                        });
                        console.log('✅ Select de nuevo viaje poblado con vehículos disponibles');
                    }

                    return true;
                } else if (Array.isArray(data) && data.length === 0) {
                    console.warn('⚠️ No hay vehículos en la base de datos');
                    this.vehiculos = [];
                    return true;
                } else {
                    throw new Error('Los datos recibidos no son un array válido: ' + JSON.stringify(data));
                }
            } catch (error) {
                console.error('❌ Error cargando vehículos:', error);
                this.vehiculos = [];
                throw error;
            }
        }

        // Cargar viajes
        async cargarViajes() {
            try {
                console.log('📡 Haciendo petición a /LogisticaFinal/api/viajes/list.php');

                // IMPORTANTE: Obtener información del usuario ANTES de cargar viajes
                this.obtenerInfoUsuario();
                console.log('👤 Rol del usuario antes de cargar viajes:', this.userRole);

                // Timeout más agresivo para carga rápida
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos máximo

                const response = await fetch('/LogisticaFinal/api/viajes/list.php', {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('📥 Respuesta de viajes recibida:', data);

                if (Array.isArray(data)) {
                    this.viajes = data;
                    console.log('✅ Viajes cargados:', data.length);

                    // Debug: mostrar estructura de los primeros viajes
                    if (data.length > 0) {
                        console.log('🔍 Estructura del primer viaje:', data[0]);
                        console.log('🔍 Campos disponibles:', Object.keys(data[0]));
                    }

                    // Cargar solicitudes pendientes desde la API
                    await this.cargarSolicitudesPendientes();
                    
                    // Cargar solicitudes de finalización
                    await this.cargarSolicitudesFinalizacion();

                    // Mostrar viajes aplicando filtros por rol
                    console.log('🔄 Mostrando viajes con rol:', this.userRole);
                    this.mostrarViajes();

                    // Asegurar que se apliquen los filtros por rol sin limpiar datos auxiliares
                    console.log('🔄 Aplicando filtros por rol después de cargar viajes...');
                    this.aplicarFiltrosPorRol();
                } else {
                    console.warn('⚠️ Los datos no son un array:', data);
                }
            } catch (error) {
                console.error('❌ Error cargando viajes:', error);
            }
        }

        // Mostrar viajes en la tabla
        mostrarViajes(viajesFiltrados = null) {
            const container = document.getElementById('viajesContainer');
            if (!container) return;

            let viajesToShow = viajesFiltrados || this.viajes;

            // Aplicar filtro por rol si es transportista
            if (this.userRole === 'transportista' && !viajesFiltrados) {
                const currentUserName = this.getCurrentUserName();
                const currentUserId = this.getCurrentUserId();
                console.log('🚛 Filtrando viajes para transportista:', currentUserName, 'ID:', currentUserId);

                viajesToShow = this.viajes.filter(viaje => {
                    // Buscar coincidencia por ID (más confiable)
                    const matchById = viaje.transportista_id && String(viaje.transportista_id) === String(currentUserId);

                    // Buscar coincidencia por nombre (fallback)
                    const transportistaNombre = this.getNombreTransportista(viaje.transportista_id);
                    const matchByName = transportistaNombre === currentUserName ||
                        viaje.transportista_nombre === currentUserName ||
                        viaje.transportista === currentUserName ||
                        viaje.nombre_transportista === currentUserName;

                    const match = matchById || matchByName;

                    if (match) {
                        console.log('✅ Viaje incluido:', viaje.origen_estado || viaje.origen, '->', viaje.destino_estado || viaje.destino, 'Transportista:', transportistaNombre);
                    } else {
                        console.log('❌ Viaje excluido:', viaje.origen_estado || viaje.origen, '->', viaje.destino_estado || viaje.destino, 'Transportista:', transportistaNombre, 'ID:', viaje.transportista_id);
                    }

                    return match;
                });
                console.log(`📊 Viajes filtrados: ${viajesToShow.length} de ${this.viajes.length}`);
            }

            if (viajesToShow.length === 0) {
                // Verificar si hay filtros activos
                const statusFilter = document.getElementById('filterStatus')?.value || '';
                const dateFilter = document.getElementById('filterDate')?.value || '';
                const transportistaFilter = document.getElementById('filterTransportista')?.value || '';

                let mensaje = 'No hay viajes disponibles';
                let descripcion = 'Los viajes aparecerán aquí una vez que sean creados';

                // Mensaje específico para transportistas
                if (this.userRole === 'transportista') {
                    mensaje = 'No hay viajes asignados';
                    descripcion = 'No tienes viajes asignados en este momento';
                }

                if (statusFilter || dateFilter || transportistaFilter) {
                    mensaje = 'No se encontraron viajes con los filtros aplicados';
                    descripcion = 'Intenta ajustar los filtros o usar "Limpiar Filtros" para ver todos los viajes';

                    if (transportistaFilter) {
                        const transportista = this.transportistas.find(t => String(t.id) === transportistaFilter);
                        const nombreTransportista = transportista ? transportista.nombre : `ID: ${transportistaFilter}`;
                        descripcion = `No se encontraron viajes para el transportista: ${nombreTransportista}`;
                    }
                }

                container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-4">
                        <i class="fas fa-search fa-4x text-muted mb-3"></i>
                        <h5 class="text-muted">${mensaje}</h5>
                        <p class="text-muted">${descripcion}</p>
                        ${(statusFilter || dateFilter || transportistaFilter) ? `
                            <button class="btn btn-outline-primary mt-3" onclick="window.ViajesManager.clearFilters()">
                                <i class="fas fa-times me-2"></i>Limpiar Filtros
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
                return;
            }

            let html = '<div class="row g-3">';
            viajesToShow.forEach(viaje => {
                const estadoColor = this.getEstadoColor(viaje.estado);
                const estadoIcon = this.getEstadoIcon(viaje.estado);

                html += `
                <div class="col-lg-6 col-xl-4">
                    <div class="card h-100 shadow-sm border-0 viaje-card">
                        <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <div>
                                <div class="d-flex align-items-center gap-2">
                                    <span class="badge bg-white text-primary fw-bold" style="font-size: 0.9rem; padding: 6px 12px;">
                                        ID: ${viaje.id}
                                    </span>
                                    <span class="text-white-50" style="font-size: 0.85rem;">
                                        ${viaje.numero_viaje || `VJ-${String(viaje.id).padStart(3, '0')}`}
                                    </span>
                                </div>
                            </div>
                            <span class="badge ${estadoColor} fs-6">
                                <i class="${estadoIcon} me-1"></i>
                                ${this.formatEstado(viaje.estado)}
                            </span>
                        </div>
                        <div class="card-body p-0">
                            <!-- Ruta Visual Mejorada -->
                            <div class="route-header p-3" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                <div class="d-flex align-items-center justify-content-between text-white">
                                    <div class="flex-grow-1">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="route-dot" style="width: 12px; height: 12px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);"></div>
                                            <div class="route-line-horizontal mx-2" style="flex: 1; height: 2px; background: rgba(255,255,255,0.3); position: relative;">
                                                <i class="fas fa-truck" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.9rem;"></i>
                                            </div>
                                            <div class="route-dot" style="width: 12px; height: 12px; background: #f87171; border-radius: 50%; box-shadow: 0 0 10px rgba(248, 113, 113, 0.5);"></div>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <div style="flex: 1;">
                                                <div style="font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Origen</div>
                                                <div style="font-size: 1rem; font-weight: 600;">${viaje.origen_estado || 'N/A'}</div>
                                                <div style="font-size: 0.75rem; opacity: 0.9;">${viaje.origen_municipio || ''}</div>
                                            </div>
                                            <div style="flex: 1; text-align: right;">
                                                <div style="font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Destino</div>
                                                <div style="font-size: 1rem; font-weight: 600;">${viaje.destino_estado || 'N/A'}</div>
                                                <div style="font-size: 0.75rem; opacity: 0.9;">${viaje.destino_municipio || ''}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Información del Viaje -->
                            <div class="p-3">
                                <div class="row g-2 mb-3">
                                    <div class="col-6">
                                        <div class="d-flex align-items-center p-2 rounded" style="background: #f0f9ff;">
                                            <div class="icon-box me-2" style="width: 36px; height: 36px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                <i class="fas fa-calendar-alt text-white" style="font-size: 0.9rem;"></i>
                                            </div>
                                            <div>
                                                <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 600;">FECHA</small>
                                                <span class="fw-bold" style="font-size: 0.85rem;">${this.formatFecha(viaje.fecha_programada)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="d-flex align-items-center p-2 rounded" style="background: #fef3c7;">
                                            <div class="icon-box me-2" style="width: 36px; height: 36px; background: #f59e0b; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                <i class="fas fa-clock text-white" style="font-size: 0.9rem;"></i>
                                            </div>
                                            <div>
                                                <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 600;">HORA</small>
                                                <span class="fw-bold" style="font-size: 0.85rem;">${viaje.hora_programada || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Transportista y Vehículo -->
                                <div class="row g-2 mb-3">
                                    <div class="col-6">
                                        <div class="d-flex align-items-center p-2 rounded" style="background: #f3f4f6;">
                                            <div class="icon-box me-2" style="width: 32px; height: 32px; background: #6366f1; border-radius: 50%; display: flex; align-items-center; justify-content: center;">
                                                <i class="fas fa-user text-white" style="font-size: 0.8rem;"></i>
                                            </div>
                                            <div>
                                                <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 600;">TRANSPORTISTA</small>
                                                <span class="fw-bold" style="font-size: 0.85rem;">${this.getNombreTransportista(viaje.transportista_id)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="d-flex align-items-center p-2 rounded" style="background: #ecfdf5;">
                                            <div class="icon-box me-2" style="width: 32px; height: 32px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                                <i class="fas fa-truck text-white" style="font-size: 0.8rem;"></i>
                                            </div>
                                            <div>
                                                <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 600;">VEHÍCULO</small>
                                                <span class="fw-bold" style="font-size: 0.85rem;">${this.getNombreVehiculo(viaje.vehiculo_id)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${viaje.observaciones ? `
                                    <div class="mb-3 p-2 rounded" style="background: #fef2f2; border-left: 3px solid #ef4444;">
                                        <small class="text-muted fw-bold d-block mb-1" style="font-size: 0.7rem;">📝 OBSERVACIONES</small>
                                        <p class="small mb-0" style="font-size: 0.8rem; color: #374151;">${viaje.observaciones}</p>
                                    </div>
                                ` : ''}
                                
                                <!-- Botones de Acción Principales (Solicitud/Aprobación) -->
                                <div class="mb-2">
                                    ${this.renderBotonesAccion(viaje)}
                                </div>
                                
                                <!-- Botones de Gestión (Ver/Editar/Eliminar) -->
                                <div class="d-flex gap-2">
                                    ${this.userRole === 'transportista' ? `
                                        <!-- Transportista: Solo Ver Detalles (mismo estilo que admin) -->
                                        <button class="btn btn-outline-primary w-100" onclick="window.ViajesManager.verDetalles(${viaje.id})" title="Ver Detalles" style="border-radius: 8px;">
                                            <i class="fas fa-eye me-1"></i>Ver Detalles
                                        </button>
                                    ` : `
                                        <!-- Admin/Supervisor: Todos los botones -->
                                        <button class="btn btn-outline-primary flex-fill" onclick="window.ViajesManager.verDetalles(${viaje.id})" title="Ver Detalles" style="border-radius: 8px;">
                                            <i class="fas fa-eye me-1"></i>Ver
                                        </button>
                                        <button class="btn btn-outline-warning flex-fill" onclick="window.ViajesManager.editarViaje(${viaje.id})" title="Editar" style="border-radius: 8px;">
                                            <i class="fas fa-edit me-1"></i>Editar
                                        </button>
                                        <button class="btn btn-outline-danger flex-fill" onclick="window.ViajesManager.eliminarViaje(${viaje.id})" title="Eliminar" style="border-radius: 8px;">
                                            <i class="fas fa-trash me-1"></i>
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            });
            html += '</div>';
            container.innerHTML = html;
        }

        // Verificar si un viaje está bloqueado para el transportista
        verificarBloqueoViaje(viajeId) {
            console.log(`🔍 Verificando bloqueo para viaje ${viajeId}`);
            console.log('📋 Solicitudes pendientes:', this.solicitudesPendientes);
            
            if (!this.solicitudesPendientes || this.solicitudesPendientes.length === 0) {
                console.log('⚠️ No hay solicitudes pendientes cargadas');
                return null;
            }
            
            const solicitud = this.solicitudesPendientes.find(s => 
                s.viaje_id == viajeId && 
                s.bloqueado === true
            );
            
            if (solicitud) {
                console.log(`🔒 Viaje ${viajeId} está BLOQUEADO:`, solicitud);
            } else {
                console.log(`✅ Viaje ${viajeId} NO está bloqueado`);
            }
            
            return solicitud || null;
        }

        // Renderizar contador de bloqueo creativo
        renderContadorBloqueo(bloqueo, viaje) {
            const diasRestantes = bloqueo.dias_restantes || 0;
            const diasTotal = bloqueo.dias_bloqueo_total || 10;
            const motivo = bloqueo.motivo_rechazo || 'No especificado';
            const fechaDesbloqueo = bloqueo.fecha_desbloqueo;
            
            // Calcular porcentaje de progreso (invertido: más días = más lleno)
            const porcentajeProgreso = ((diasTotal - diasRestantes) / diasTotal) * 100;
            
            // Determinar color según días restantes
            let colorGradiente, colorBorde, colorTexto, colorBadge, emoji;
            if (diasRestantes <= 2) {
                colorGradiente = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                colorBorde = '#f59e0b';
                colorTexto = '#92400e';
                colorBadge = 'bg-warning';
                emoji = '⏰';
            } else if (diasRestantes <= 5) {
                colorGradiente = 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)';
                colorBorde = '#f97316';
                colorTexto = '#7c2d12';
                colorBadge = 'bg-orange';
                emoji = '⏳';
            } else {
                colorGradiente = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                colorBorde = '#ef4444';
                colorTexto = '#991b1b';
                colorBadge = 'bg-danger';
                emoji = '🔒';
            }
            
            // Formatear fecha de desbloqueo
            let fechaFormateada = 'Fecha no disponible';
            if (fechaDesbloqueo) {
                try {
                    const fecha = new Date(fechaDesbloqueo);
                    fechaFormateada = fecha.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (e) {
                    console.error('Error formateando fecha:', e);
                }
            }
            
            const textoDias = diasRestantes === 1 ? 'día' : 'días';
            
            return `
                <!-- Contador de Bloqueo Creativo -->
                <div class="alert mb-2 position-relative overflow-hidden" style="border-radius: 15px; border-left: 5px solid ${colorBorde}; background: ${colorGradiente}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 1.25rem;">
                    <!-- Animación de fondo -->
                    <div class="position-absolute top-0 start-0 w-100 h-100" style="opacity: 0.1; background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px);"></div>
                    
                    <div class="position-relative">
                        <!-- Header con icono y badge -->
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <div class="me-3" style="font-size: 2.5rem; animation: pulse 2s infinite;">
                                    ${emoji}
                                </div>
                                <div>
                                    <h6 class="mb-0 fw-bold" style="color: ${colorTexto}; font-size: 1.1rem;">
                                        Solicitud Rechazada
                                    </h6>
                                    <small style="color: ${colorTexto}; opacity: 0.8;">
                                        No puedes solicitar este viaje temporalmente
                                    </small>
                                </div>
                            </div>
                            <div class="text-center">
                                <div class="badge ${colorBadge} px-3 py-2" style="font-size: 1.2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <div style="font-size: 1.5rem; font-weight: 700; line-height: 1;">${diasRestantes}</div>
                                    <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">${textoDias}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Barra de progreso animada -->
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="fw-bold" style="color: ${colorTexto};">
                                    <i class="fas fa-hourglass-half me-1"></i>
                                    Tiempo de espera
                                </small>
                                <small class="fw-bold" style="color: ${colorTexto};">
                                    ${Math.round(porcentajeProgreso)}% completado
                                </small>
                            </div>
                            <div class="progress" style="height: 12px; border-radius: 10px; background: rgba(0,0,0,0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     role="progressbar" 
                                     style="width: ${porcentajeProgreso}%; background: ${colorBorde}; border-radius: 10px; transition: width 0.6s ease;"
                                     aria-valuenow="${porcentajeProgreso}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Información del rechazo -->
                        <div class="p-3 mb-3" style="background: rgba(255,255,255,0.6); border-radius: 10px; border: 1px solid rgba(0,0,0,0.1);">
                            <div class="d-flex align-items-start mb-2">
                                <i class="fas fa-info-circle me-2 mt-1" style="color: ${colorTexto};"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block mb-1" style="color: ${colorTexto}; font-size: 0.9rem;">Motivo del rechazo:</strong>
                                    <p class="mb-0 small" style="color: ${colorTexto}; opacity: 0.9;">${motivo}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Fecha de desbloqueo -->
                        <div class="text-center p-3" style="background: rgba(255,255,255,0.4); border-radius: 10px; border: 2px dashed ${colorBorde};">
                            <div class="mb-2">
                                <i class="fas fa-calendar-check" style="font-size: 1.5rem; color: ${colorTexto};"></i>
                            </div>
                            <small class="d-block fw-bold mb-1" style="color: ${colorTexto}; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.7rem;">
                                Podrás solicitar nuevamente el:
                            </small>
                            <div class="fw-bold" style="color: ${colorTexto}; font-size: 0.95rem;">
                                ${fechaFormateada}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Botón deshabilitado -->
                <button class="btn btn-secondary w-100 mb-2 position-relative overflow-hidden" disabled style="border-radius: 10px; font-weight: 600; opacity: 0.7; cursor: not-allowed; padding: 12px;">
                    <i class="fas fa-lock me-2"></i>
                    Bloqueado por ${diasRestantes} ${textoDias} más
                    <div class="position-absolute top-0 start-0 w-100 h-100" style="background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px);"></div>
                </button>
                
                <style>
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                </style>
            `;
        }

        // Verificar si un viaje tiene solicitud pendiente (versión síncrona)
        tieneSolicitudPendienteSync(viajeId) {
            if (!this.solicitudesPendientes || this.solicitudesPendientes.length === 0) {
                return false;
            }
            
            const solicitud = this.solicitudesPendientes.find(s => 
                s.viaje_id == viajeId && 
                s.tiene_solicitud === true
            );
            
            return solicitud ? true : false;
        }

        // Verificar si un viaje tiene solicitud de finalización pendiente (versión síncrona)
        tieneSolicitudFinalizacionPendienteSync(viajeId) {
            if (!this.solicitudesFinalizacion || this.solicitudesFinalizacion.length === 0) {
                return false;
            }
            
            const solicitud = this.solicitudesFinalizacion.find(s => 
                s.viaje_id == viajeId && 
                s.tiene_solicitud === true
            );
            
            return solicitud ? true : false;
        }

        // Renderizar botones de acción según rol y estado
        renderBotonesAccion(viaje) {
            const tieneSolicitud = this.tieneSolicitudPendienteSync(viaje.id);
            const tieneSolicitudFinalizacion = this.tieneSolicitudFinalizacionPendienteSync(viaje.id);

            // DEBUG MEJORADO
            console.log(`🔍 renderBotonesAccion - Viaje ${viaje.id}:`);
            console.log(`   📋 Estado del viaje: "${viaje.estado}"`);
            console.log(`   👤 Rol del usuario: "${this.userRole}" (tipo: ${typeof this.userRole})`);
            console.log(`   📝 Tiene solicitud inicio pendiente: ${tieneSolicitud}`);
            console.log(`   📝 Tiene solicitud finalización pendiente: ${tieneSolicitudFinalizacion}`);
            console.log(`   🔍 Comparación directa: this.userRole === 'transportista' = ${this.userRole === 'transportista'}`);
            console.log(`   🔍 Comparación directa: this.userRole === 'admin' = ${this.userRole === 'admin'}`);
            console.log(`   🔍 Comparación directa: this.userRole === 'supervisor' = ${this.userRole === 'supervisor'}`);

            // MANEJO DE VIAJES EN RUTA - Sistema de Finalización
            if (viaje.estado === 'en_ruta') {
                console.log(`   🚛 Viaje EN RUTA - Mostrando botones de finalización`);
                
                // CASO 1: TRANSPORTISTA con viaje en ruta
                if (this.userRole === 'transportista') {
                    if (tieneSolicitudFinalizacion) {
                        console.log(`   ⏳ Transportista YA solicitó finalización - Mostrando mensaje de espera`);
                        return `
                            <div class="alert alert-info mb-2" style="border-radius: 12px; border-left: 5px solid #3b82f6; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);">
                                <div class="d-flex align-items-center">
                                    <div class="spinner-border spinner-border-sm text-info me-3" role="status" style="width: 24px; height: 24px; border-width: 3px;"></div>
                                    <div class="flex-grow-1">
                                        <div class="d-flex align-items-center mb-1">
                                            <i class="fas fa-clock me-2" style="font-size: 1.1rem; color: #3b82f6;"></i>
                                            <strong style="font-size: 1rem; color: #1e40af;">Esperando Aprobación de Finalización</strong>
                                        </div>
                                        <p class="mb-0 small" style="color: #1e3a8a;">Tu solicitud de finalización está siendo revisada por el administrador.</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        console.log(`   🏁 Transportista puede solicitar finalización - Mostrando botón`);
                        
                        // Verificar si hay motivo de rechazo anterior
                        let alertaRechazo = '';
                        if (viaje.motivo_rechazo_finalizacion && viaje.motivo_rechazo_finalizacion.trim() !== '') {
                            alertaRechazo = `
                                <div class="alert alert-warning mb-2 viaje-rechazo-box" style="border-radius: 12px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);">
                                    <div class="d-flex align-items-start">
                                        <i class="fas fa-exclamation-triangle me-2 mt-1" style="font-size: 1.2rem;"></i>
                                        <div class="flex-grow-1">
                                            <strong style="font-size: 0.95rem;">Solicitud Anterior Rechazada</strong>
                                            <p class="mb-0 small mt-1">
                                                <strong>Motivo:</strong> ${viaje.motivo_rechazo_finalizacion}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                        
                        return `
                            ${alertaRechazo}
                            <button class="btn btn-primary w-100 mb-2" onclick="window.ViajesManager.solicitarFinalizacionViaje(${viaje.id})" style="border-radius: 8px; font-weight: 600; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); padding: 12px;">
                                <i class="fas fa-flag-checkered me-2"></i>Terminar Viaje
                            </button>
                        `;
                    }
                }
                
                // CASO 2: ADMIN/SUPERVISOR con viaje en ruta
                if (this.userRole === 'admin' || this.userRole === 'supervisor') {
                    if (tieneSolicitudFinalizacion) {
                        console.log(`   📋 Hay solicitud de finalización pendiente - Mostrando botones de aprobación`);
                        return `
                            <div class="alert alert-warning mb-2 viaje-solicitud-box" style="border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <strong>🏁 Solicitud de Finalización Pendiente</strong>
                                <p class="mb-2 small">El transportista ha solicitado finalizar este viaje.</p>
                            </div>
                            <div class="d-flex gap-2 mb-2">
                                <button class="btn btn-success flex-fill" onclick="window.ViajesManager.aprobarFinalizacion(${viaje.id})" style="border-radius: 8px; font-weight: 600;">
                                    <i class="fas fa-check me-1"></i>Aprobar
                                </button>
                                <button class="btn btn-danger flex-fill" onclick="window.ViajesManager.rechazarFinalizacion(${viaje.id})" style="border-radius: 8px; font-weight: 600;">
                                    <i class="fas fa-times me-1"></i>Rechazar
                                </button>
                            </div>
                        `;
                    } else {
                        console.log(`   ⏳ No hay solicitud de finalización aún`);
                        return `
                            <div class="alert alert-light mb-2" style="border-radius: 8px; border-left: 4px solid #6c757d;">
                                <div class="text-center py-1">
                                    <i class="fas fa-truck text-primary mb-1" style="font-size: 1.2rem;"></i>
                                    <p class="mb-0 small text-muted">
                                        <strong>Viaje en progreso</strong><br>
                                        Esperando que el transportista solicite finalización
                                    </p>
                                </div>
                            </div>
                        `;
                    }
                }
                
                return '';
            }

            // MANEJO DE VIAJES COMPLETADOS
            if (viaje.estado === 'completado') {
                console.log(`   ✅ Viaje COMPLETADO - Mostrando alerta verde`);
                return `
                    <div class="alert alert-success mb-2 viaje-completado-box" style="border-radius: 12px; border-left: 5px solid #10b981; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);">
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle bg-success d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                                <i class="fas fa-check text-white" style="font-size: 1.2rem;"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center mb-1">
                                    <i class="fas fa-flag-checkered me-2" style="font-size: 1.1rem; color: #059669;"></i>
                                    <strong style="font-size: 1rem; color: #065f46;">Viaje Completado</strong>
                                </div>
                                <p class="mb-0 small" style="color: #047857;">Este viaje ha sido finalizado exitosamente.</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            // MANEJO DE VIAJES CANCELADOS
            if (viaje.estado === 'cancelado') {
                console.log(`   ❌ Viaje CANCELADO - Mostrando alerta roja`);
                return `
                    <div class="alert alert-danger mb-2 viaje-cancelado-box" style="border-radius: 12px; border-left: 5px solid #ef4444; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);">
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle bg-danger d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                                <i class="fas fa-times text-white" style="font-size: 1.2rem;"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center mb-1">
                                    <i class="fas fa-ban me-2" style="font-size: 1.1rem; color: #dc2626;"></i>
                                    <strong style="font-size: 1rem; color: #991b1b;">Viaje Cancelado</strong>
                                </div>
                                <p class="mb-0 small" style="color: #b91c1c;">Este viaje ha sido cancelado y no se completará.</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            // SOLO PARA VIAJES PENDIENTES - Sistema de Inicio
            if (viaje.estado !== 'pendiente') {
                console.log(`   ⏭️ Viaje no está pendiente ni en ruta, no se muestran botones de solicitud`);
                return '';
            }

            // CASO 1: TRANSPORTISTA con viaje pendiente
            if (this.userRole === 'transportista') {
                console.log(`   ✅ ES TRANSPORTISTA - Verificando solicitud y bloqueo...`);

                // Verificar si está bloqueado por rechazo reciente
                const bloqueo = this.verificarBloqueoViaje(viaje.id);
                
                if (bloqueo && bloqueo.bloqueado) {
                    console.log(`   🔒 Viaje BLOQUEADO - ${bloqueo.dias_restantes} días restantes`);
                    // Mostrar contador de bloqueo creativo
                    return this.renderContadorBloqueo(bloqueo, viaje);
                }

                if (tieneSolicitud) {
                    console.log(`   ⏳ Transportista YA solicitó inicio - Mostrando mensaje de espera`);
                    // Ya solicitó - Esperando aprobación del admin
                    return `
                        <div class="alert alert-warning mb-2 viaje-pendiente-box" style="border-radius: 12px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);">
                            <div class="d-flex align-items-center">
                                <div class="spinner-border spinner-border-sm text-warning me-3" role="status" style="width: 24px; height: 24px; border-width: 3px;"></div>
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="fas fa-clock me-2" style="font-size: 1.1rem;"></i>
                                        <strong style="font-size: 1rem; color: #92400e;">Esperando Aprobación del Administrador</strong>
                                    </div>
                                    <p class="mb-0 small" style="color: #78350f;">Tu solicitud está siendo revisada. Recibirás una notificación cuando sea aprobada o rechazada.</p>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    console.log(`   🟢 Transportista AÚN NO solicitó inicio - Mostrando botón verde`);
                    // No ha solicitado - Mostrar botón para solicitar
                    return `
                        <button class="btn btn-success w-100 mb-2" onclick="window.ViajesManager.solicitarInicioViaje(${viaje.id})" style="border-radius: 8px; font-weight: 600; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); padding: 12px;">
                            <i class="fas fa-play-circle me-2"></i>Solicitar Inicio de Viaje
                        </button>
                    `;
                }
            }

            // CASO 2: ADMIN/SUPERVISOR con viaje pendiente
            if (this.userRole === 'admin' || this.userRole === 'supervisor') {
                console.log(`   ✅ ES ADMIN/SUPERVISOR - Verificando solicitud...`);

                if (tieneSolicitud) {
                    console.log(`   📋 Hay solicitud pendiente - Mostrando botones de aprobación`);
                    // Hay solicitud - Mostrar botones de aprobar/rechazar
                    return `
                        <div class="alert alert-info mb-2" style="border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <strong>📋 Solicitud Pendiente</strong>
                            <p class="mb-2 small">El transportista ha solicitado iniciar este viaje.</p>
                        </div>
                        <div class="d-flex gap-2 mb-2">
                            <button class="btn btn-success flex-fill" onclick="window.ViajesManager.aprobarSolicitud(${viaje.id})" style="border-radius: 8px; font-weight: 600;">
                                <i class="fas fa-check me-1"></i>Aprobar
                            </button>
                            <button class="btn btn-danger flex-fill" onclick="window.ViajesManager.rechazarSolicitud(${viaje.id})" style="border-radius: 8px; font-weight: 600;">
                                <i class="fas fa-times me-1"></i>Rechazar
                            </button>
                        </div>
                    `;
                } else {
                    console.log(`   ⏳ No hay solicitud aún - Mostrando mensaje de espera`);
                    // No hay solicitud - Mostrar mensaje de espera
                    return `
                        <div class="alert alert-secondary mb-2" style="border-radius: 8px; border-left: 4px solid #6c757d; background: #f8f9fa;">
                            <div class="text-center py-2">
                                <i class="fas fa-hourglass-half text-muted mb-2" style="font-size: 1.5rem;"></i>
                                <p class="mb-0 small text-muted">
                                    <strong>Esperando solicitud del transportista</strong><br>
                                    El transportista debe solicitar el inicio del viaje
                                </p>
                            </div>
                        </div>
                    `;
                }
            }

            // Si llegamos aquí, algo está mal con el rol
            console.warn(`   ⚠️ Rol no reconocido o no manejado: "${this.userRole}"`);
            return '';
        }

        // Funciones auxiliares para el diseño
        getEstadoColor(estado) {
            const colores = {
                'pendiente': 'bg-warning text-dark',
                'en_ruta': 'bg-info text-white',
                'completado': 'bg-success text-white',
                'cancelado': 'bg-danger text-white'
            };
            return colores[estado] || 'bg-secondary text-white';
        }

        getEstadoIcon(estado) {
            const iconos = {
                'pendiente': 'fas fa-clock',
                'en_ruta': 'fas fa-truck',
                'completado': 'fas fa-check-circle',
                'cancelado': 'fas fa-times-circle'
            };
            return iconos[estado] || 'fas fa-question-circle';
        }

        formatEstado(estado) {
            const estados = {
                'pendiente': 'Pendiente',
                'en_ruta': 'En Ruta',
                'completado': 'Completado',
                'cancelado': 'Cancelado'
            };
            return estados[estado] || estado;
        }

        formatFecha(fecha) {
            if (!fecha) return 'N/A';

            try {
                const date = new Date(fecha);
                return date.toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (error) {
                console.error('Error formateando fecha:', error);
                return fecha;
            }
        }

        // Obtener nombre del transportista por ID
        getNombreTransportista(transportistaId) {
            if (!transportistaId) return 'Sin asignar';

            // Si no hay transportistas cargados, intentar cargarlos
            if (!this.transportistas || this.transportistas.length === 0) {
                console.warn('⚠️ Transportistas no disponibles para getNombreTransportista, ID:', transportistaId);
                // Intentar cargar transportistas de forma asíncrona
                this.cargarTransportistas().then(() => {
                    console.log('✅ Transportistas cargados después de getNombreTransportista');
                    // Actualizar nombres en tarjetas
                    this.actualizarNombresTransportistas();
                }).catch(error => {
                    console.error('❌ Error cargando transportistas en getNombreTransportista:', error);
                });
                return `ID: ${transportistaId}`;
            }

            const transportista = this.transportistas.find(t => String(t.id) === String(transportistaId));
            if (transportista) {
                return transportista.nombre;
            } else {
                console.warn('⚠️ Transportista no encontrado:', transportistaId, 'en lista de', this.transportistas.length, 'transportistas');
                return `ID: ${transportistaId}`;
            }
        }

        // Obtener nombre del vehículo por ID
        getNombreVehiculo(vehiculoId) {
            if (!vehiculoId) return 'Sin asignar';

            if (!this.vehiculos || this.vehiculos.length === 0) {
                console.warn('⚠️ Vehículos no disponibles, ID:', vehiculoId);
                return `ID: ${vehiculoId}`;
            }

            const vehiculo = this.vehiculos.find(v => String(v.id) === String(vehiculoId));
            if (vehiculo) {
                // Formato: Marca - Modelo - Placas
                const marca = vehiculo.marca || 'N/A';
                const modelo = vehiculo.modelo || 'N/A';
                const placa = vehiculo.placa || 'N/A';
                return `${marca} - ${modelo} - ${placa}`;
            } else {
                console.warn('⚠️ Vehículo no encontrado:', vehiculoId);
                return `ID: ${vehiculoId}`;
            }
        }

        // Funciones de filtrado
        filterTrips() {
            const statusFilter = document.getElementById('filterStatus')?.value || '';
            const dateFilter = document.getElementById('filterDate')?.value || '';
            const transportistaFilter = document.getElementById('filterTransportista')?.value || '';


            let viajesFiltrados = [...this.viajes];
            let filtrosAplicados = [];

            // Filtrar por estado
            if (statusFilter) {
                viajesFiltrados = viajesFiltrados.filter(viaje =>
                    viaje.estado === statusFilter
                );
                filtrosAplicados.push(`Estado: ${statusFilter}`);
            }

            // Filtrar por fecha
            if (dateFilter) {
                viajesFiltrados = viajesFiltrados.filter(viaje =>
                    viaje.fecha_programada && viaje.fecha_programada.includes(dateFilter)
                );
                filtrosAplicados.push(`Fecha: ${dateFilter}`);
            }

            // Filtrar por transportista
            if (transportistaFilter) {
                viajesFiltrados = viajesFiltrados.filter(viaje =>
                    String(viaje.transportista_id) === transportistaFilter
                );

                // Buscar nombre del transportista
                const transportista = this.transportistas.find(t => String(t.id) === transportistaFilter);
                const nombreTransportista = transportista ? transportista.nombre : `ID: ${transportistaFilter}`;
                filtrosAplicados.push(`Transportista: ${nombreTransportista}`);
            }

            // Log para debugging
            if (filtrosAplicados.length > 0) {
                console.log('🔍 Filtros aplicados:', filtrosAplicados);
                console.log('📊 Viajes encontrados:', viajesFiltrados.length);
            }

            // Mostrar indicador de filtros activos
            this.mostrarIndicadorFiltros(filtrosAplicados);

            this.mostrarViajes(viajesFiltrados);
        }

        // Mostrar indicador de filtros activos
        mostrarIndicadorFiltros(filtrosAplicados) {
            const container = document.getElementById('viajesContainer');
            if (!container) return;

            // Buscar o crear el contenedor de indicadores
            let indicadorContainer = document.getElementById('filtrosIndicador');
            if (!indicadorContainer) {
                indicadorContainer = document.createElement('div');
                indicadorContainer.id = 'filtrosIndicador';
                indicadorContainer.className = 'mb-3';
                container.parentNode.insertBefore(indicadorContainer, container);
            }

            if (filtrosAplicados.length === 0) {
                indicadorContainer.innerHTML = '';
                return;
            }

            let html = `
            <div class="alert alert-info d-flex align-items-center" role="alert">
                <i class="fas fa-filter me-2"></i>
                <div class="flex-grow-1">
                    <strong>Filtros activos:</strong> ${filtrosAplicados.join(' • ')}
                </div>
                <button class="btn btn-sm btn-outline-info ms-2" onclick="window.ViajesManager.clearFilters()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

            indicadorContainer.innerHTML = html;
        }

        clearFilters() {
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterDate').value = '';
            document.getElementById('filterTransportista').value = '';

            // Limpiar indicador de filtros
            const indicadorContainer = document.getElementById('filtrosIndicador');
            if (indicadorContainer) {
                indicadorContainer.innerHTML = '';
            }

            this.mostrarViajes();
        }

        // Ver detalles del viaje
        async verDetalles(id) {
            try {
                console.log('🔍 Viendo detalles del viaje:', id);

                const viaje = this.viajes.find(v => v.id == id);
                if (!viaje) {
                    this.mostrarModalViajes('error', 'Viaje No Encontrado', 'No se pudo encontrar el viaje solicitado para mostrar los detalles.');
                    return;
                }

                const transportista = this.getNombreTransportista(viaje.transportista_id);
                const vehiculo = this.vehiculos.find(v => v.id == viaje.vehiculo_id);
                const nombreVehiculo = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})` : 'N/A';

                const detallesHtml = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="card border-primary">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información General</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Número de Viaje:</strong> ${viaje.numero_viaje || `VJ-${String(viaje.id).padStart(3, '0')}`}</p>
                                <p><strong>Estado:</strong> 
                                    <span class="badge ${this.getEstadoColor(viaje.estado)}">
                                        <i class="${this.getEstadoIcon(viaje.estado)} me-1"></i>
                                        ${this.formatEstado(viaje.estado)}
                                    </span>
                                </p>
                                <p><strong>Fecha Programada:</strong> ${this.formatFecha(viaje.fecha_programada)}</p>
                                <p><strong>Hora:</strong> ${viaje.hora_programada || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="fas fa-route me-2"></i>Ruta</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <strong>Origen:</strong><br>
                                    <i class="fas fa-map-marker-alt text-success me-1"></i>
                                    ${viaje.origen_estado || 'N/A'}<br>
                                    <small class="text-muted">${viaje.origen_municipio || ''}</small>
                                </div>
                                <div>
                                    <strong>Destino:</strong><br>
                                    <i class="fas fa-flag-checkered text-danger me-1"></i>
                                    ${viaje.destino_estado || 'N/A'}<br>
                                    <small class="text-muted">${viaje.destino_municipio || ''}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-dark">
                                <h6 class="mb-0"><i class="fas fa-users me-2"></i>Asignación</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Transportista:</strong><br>${transportista}</p>
                                <p><strong>Vehículo:</strong><br>${nombreVehiculo}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-info">
                            <div class="card-header bg-info text-white">
                                <h6 class="mb-0"><i class="fas fa-clipboard me-2"></i>Observaciones</h6>
                            </div>
                            <div class="card-body">
                                <p>${viaje.observaciones || 'Sin observaciones'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

                document.getElementById('detallesViajeContent').innerHTML = detallesHtml;

                const modal = new bootstrap.Modal(document.getElementById('detallesViajeModal'));
                modal.show();

            } catch (error) {
                console.error('❌ Error viendo detalles:', error);
                this.mostrarModalViajes('error', 'Error al Cargar Detalles', 'Ocurrió un error al intentar cargar los detalles del viaje. Por favor, inténtalo de nuevo.');
            }
        }

        // Editar viaje
        async editarViaje(id) {
            try {
                console.log('✏️ Editando viaje:', id);

                const viaje = this.viajes.find(v => v.id == id);
                if (!viaje) {
                    this.mostrarModalViajes('error', 'Viaje No Encontrado', 'No se pudo encontrar el viaje solicitado para editar.');
                    return;
                }

                // Cargar datos en los selects del modal de edición
                await this.cargarDatosEdicion();

                // Poblar el formulario con los datos del viaje
                document.getElementById('editViajeId').value = viaje.id;
                document.getElementById('editNumeroViaje').value = viaje.numero_viaje || `VJ-${String(viaje.id).padStart(3, '0')}`;
                document.getElementById('editEstado').value = viaje.estado || 'pendiente';
                document.getElementById('editOrigenEstado').value = viaje.origen_estado || '';
                document.getElementById('editOrigenMunicipio').value = viaje.origen_municipio || '';
                document.getElementById('editDestinoEstado').value = viaje.destino_estado || '';
                document.getElementById('editDestinoMunicipio').value = viaje.destino_municipio || '';
                document.getElementById('editTransportista').value = viaje.transportista_id || '';
                document.getElementById('editVehiculo').value = viaje.vehiculo_id || '';
                document.getElementById('editFechaProgramada').value = viaje.fecha_programada || '';
                document.getElementById('editHoraProgramada').value = viaje.hora_programada || '';
                document.getElementById('editObservaciones').value = viaje.observaciones || '';

                const modal = new bootstrap.Modal(document.getElementById('editarViajeModal'));
                modal.show();

            } catch (error) {
                console.error('❌ Error editando viaje:', error);
                this.mostrarModalViajes('error', 'Error al Cargar Formulario', 'Ocurrió un error al intentar cargar el formulario de edición. Por favor, inténtalo de nuevo.');
            }
        }

        // Cargar datos para edición
        async cargarDatosEdicion() {
            console.log('📝 Cargando datos para edición del modal...');

            // Cargar estados mexicanos
            this.cargarEstadosEnSelect('editOrigenEstado');
            this.cargarEstadosEnSelect('editDestinoEstado');

            // CRÍTICO: Asegurar que los transportistas estén cargados
            if (!this.transportistas || this.transportistas.length === 0) {
                console.warn('⚠️ Transportistas no disponibles, cargando desde API...');
                try {
                    await this.cargarTransportistas();
                    console.log('✅ Transportistas cargados para modal de edición');
                } catch (error) {
                    console.error('❌ Error cargando transportistas para modal:', error);
                }
            }

            // Cargar transportistas en el select del modal de edición
            const selectTransportista = document.getElementById('editTransportista');
            if (selectTransportista) {
                console.log('📝 Poblando dropdown de transportistas en modal de edición...');
                selectTransportista.innerHTML = '<option value="">Seleccionar transportista...</option>';

                if (this.transportistas && this.transportistas.length > 0) {
                    this.transportistas.forEach(t => {
                        const option = document.createElement('option');
                        option.value = t.id;
                        option.textContent = t.nombre;
                        selectTransportista.appendChild(option);
                    });
                    console.log('✅ Dropdown poblado con', this.transportistas.length, 'transportistas');
                } else {
                    console.error('❌ No hay transportistas disponibles para el dropdown');
                    selectTransportista.innerHTML = '<option value="">Error: No se pudieron cargar transportistas</option>';
                }
            } else {
                console.error('❌ Select editTransportista no encontrado en el DOM');
            }

            // CRÍTICO: Asegurar que los vehículos estén cargados
            if (!this.vehiculos || this.vehiculos.length === 0) {
                console.warn('⚠️ Vehículos no disponibles, cargando desde API...');
                try {
                    await this.cargarVehiculos();
                    console.log('✅ Vehículos cargados para modal de edición');
                } catch (error) {
                    console.error('❌ Error cargando vehículos para modal:', error);
                }
            }

            // Cargar vehículos en el select del modal de edición
            const selectVehiculo = document.getElementById('editVehiculo');
            if (selectVehiculo) {
                console.log('🚗 Poblando dropdown de vehículos en modal de edición...');
                selectVehiculo.innerHTML = '<option value="">Seleccionar vehículo...</option>';

                if (this.vehiculos && this.vehiculos.length > 0) {
                    // Filtrar solo vehículos disponibles
                    console.log('🔍 [EDICIÓN] INICIANDO FILTRADO DE VEHÍCULOS...');
                    console.log('📊 [EDICIÓN] Total de vehículos:', this.vehiculos.length);

                    const vehiculosDisponibles = this.vehiculos.filter(v => {
                        const estadoOriginal = v.estado;
                        const estadoNormalizado = (v.estado || '').toString().toLowerCase().trim();
                        const esDisponible = estadoNormalizado === 'disponible';

                        console.log(`🔍 [EDICIÓN] Vehículo: ${v.placa}`);
                        console.log(`   - Estado original: "${estadoOriginal}" (tipo: ${typeof estadoOriginal})`);
                        console.log(`   - Estado normalizado: "${estadoNormalizado}"`);
                        console.log(`   - ¿Es disponible?: ${esDisponible}`);

                        return esDisponible;
                    });

                    console.log(`✅ [EDICIÓN] FILTRADO COMPLETADO: ${vehiculosDisponibles.length} de ${this.vehiculos.length} vehículos son disponibles`);
                    console.log('📋 [EDICIÓN] Vehículos disponibles:', vehiculosDisponibles.map(v => `${v.placa} (${v.estado})`).join(', '));

                    vehiculosDisponibles.forEach(v => {
                        const option = document.createElement('option');
                        option.value = v.id;
                        option.textContent = `${v.marca} ${v.modelo} (${v.placa})`;
                        selectVehiculo.appendChild(option);
                    });
                    console.log('✅ Dropdown de vehículos poblado con', vehiculosDisponibles.length, 'vehículos disponibles');
                } else {
                    console.error('❌ No hay vehículos disponibles para el dropdown');
                    selectVehiculo.innerHTML = '<option value="">Error: No se pudieron cargar vehículos</option>';
                }
            } else {
                console.error('❌ Select editVehiculo no encontrado en el DOM');
            }
        }

        // Cargar estados en un select específico
        cargarEstadosEnSelect(selectId) {
            const estados = [
                'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
                'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
                'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
                'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
                'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
                'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
            ];

            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Seleccionar estado...</option>';
                estados.forEach(estado => {
                    const option = document.createElement('option');
                    option.value = estado;
                    option.textContent = estado;
                    select.appendChild(option);
                });
            }
        }

        // Actualizar viaje
        async actualizarViaje() {
            try {
                console.log('💾 Actualizando viaje...');

                const form = document.getElementById('editarViajeForm');
                if (!form) {
                    console.error('❌ Formulario de edición no encontrado');
                    return;
                }

                const formData = new FormData(form);
                const viajeData = {
                    id: formData.get('viajeId'),
                    estado: formData.get('estado'),
                    origen_estado: formData.get('origenEstado'),
                    origen_municipio: formData.get('origenMunicipio'),
                    destino_estado: formData.get('destinoEstado'),
                    destino_municipio: formData.get('destinoMunicipio'),
                    transportista_id: formData.get('transportista'),
                    vehiculo_id: formData.get('vehiculo'),
                    fecha_programada: formData.get('fechaProgramada'),
                    hora_programada: formData.get('horaProgramada'),
                    observaciones: formData.get('observaciones')
                };

                console.log('📋 Datos a actualizar:', viajeData);

                // Validación básica
                if (!viajeData.origen_estado || !viajeData.destino_estado) {
                    this.mostrarModalViajes('warning', 'Campos Obligatorios', 'Los campos de origen y destino son obligatorios para actualizar el viaje.');
                    return;
                }

                // Enviar a la API
                const response = await fetch('/LogisticaFinal/api/viajes/update.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(viajeData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Error HTTP:', response.status, errorText);
                    this.mostrarModalViajes('error', 'Error de Servidor', `Error HTTP ${response.status}: ${errorText}`);
                    return;
                }

                const result = await response.json();
                console.log('📡 Respuesta API:', result);

                if (result.success) {
                    // Cerrar modal
                    const modalEl = document.getElementById('editarViajeModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();

                    // Recargar viajes de forma suave (mantener datos existentes)
                    console.log('🔄 Recargando viajes después de actualización...');
                    await this.cargarViajes();

                    this.mostrarModalViajes('success', 'Viaje Actualizado', 'El viaje ha sido actualizado correctamente.');
                    console.log('✅ Viaje actualizado correctamente');
                } else {
                    this.mostrarModalViajes('error', 'Error al Actualizar', 'Error al actualizar el viaje: ' + (result.message || result.error));
                    console.error('❌ Error:', result);
                }

            } catch (error) {
                console.error('❌ Error actualizando viaje:', error);
                this.mostrarModalViajes('error', 'Error de Conexión', 'Error de conexión al actualizar el viaje. Por favor, verifica tu conexión e inténtalo de nuevo.');
            }
        }

        // ========== NUEVAS FUNCIONES PARA SOLICITUDES (CON API) ==========

        // Solicitar inicio de viaje (Transportista)
        async solicitarInicioViaje(id) {
            console.log('📋 Solicitando inicio de viaje:', id);

            const viaje = this.viajes.find(v => v.id == id);
            if (!viaje) {
                this.mostrarModalViajes('error', 'Error', 'No se encontró el viaje.');
                return;
            }

            // Mostrar modal de confirmación con advertencias
            const confirmar = await this.mostrarModalConfirmacionSolicitud(viaje);
            if (!confirmar) {
                console.log('❌ Solicitud cancelada por el usuario');
                return;
            }

            try {
                // Obtener el ID del transportista actual
                const transportistaId = this.getCurrentUserId();

                const response = await fetch('/LogisticaFinal/api/viajes/solicitar_inicio.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        viaje_id: id,
                        transportista_id: transportistaId  // Enviar ID para modo de prueba
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log('✅ Solicitud enviada exitosamente');
                    
                    // CRÍTICO: Recargar solicitudes Y viajes
                    try {
                        console.log('🔄 Recargando datos completos...');
                        
                        // 1. Recargar viajes
                        await this.cargarViajes();
                        console.log('✅ Viajes recargados');
                        
                        // 2. FORZAR recarga de solicitudes pendientes
                        await this.cargarSolicitudesPendientes();
                        console.log('✅ Solicitudes recargadas');
                        
                        // 2.5 Recargar solicitudes de finalización
                        await this.cargarSolicitudesFinalizacion();
                        console.log('✅ Solicitudes de finalización recargadas');
                        
                        // 3. Re-renderizar la interfaz
                        this.mostrarViajes();
                        console.log('✅ Interfaz actualizada');
                        
                        // Verificar que los viajes se cargaron
                        if (this.viajes && this.viajes.length > 0) {
                            console.log(`📊 ${this.viajes.length} viajes disponibles`);
                        }
                        
                        // Mostrar modal de éxito
                        this.mostrarModalViajes('success', '✅ Solicitud Enviada',
                            'Tu solicitud ha sido enviada. Espera a que el administrador o supervisor la apruebe.');
                    } catch (error) {
                        console.error('❌ Error recargando datos:', error);
                        // Mostrar modal de advertencia
                        this.mostrarModalViajes('warning', 'Solicitud Enviada',
                            'Tu solicitud fue enviada, pero hubo un problema al actualizar la vista. Por favor, refresca la página (F5).');
                    }
                } else {
                    this.mostrarModalViajes('error', 'Error', result.error || 'No se pudo enviar la solicitud');
                }

            } catch (error) {
                console.error('❌ Error al solicitar inicio:', error);
                this.mostrarModalViajes('error', 'Error de Conexión',
                    'No se pudo conectar con el servidor. Verifica tu conexión.');
            }
        }

        // Modal de confirmación para solicitar inicio de viaje
        mostrarModalConfirmacionSolicitud(viaje) {
            return new Promise((resolve) => {
                const modalHtml = `
                    <div class="modal fade" id="modalConfirmacionSolicitud" tabindex="-1" data-bs-backdrop="static">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header bg-warning text-dark">
                                    <h5 class="modal-title">
                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                        Confirmar Solicitud de Inicio
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="alert alert-info mb-3">
                                        <strong>📍 Viaje:</strong> ${viaje.origen_estado} → ${viaje.destino_estado}<br>
                                        <strong>📅 Fecha:</strong> ${this.formatFecha(viaje.fecha_programada)}<br>
                                        <strong>🚚 Vehículo:</strong> ${this.getNombreVehiculo(viaje.vehiculo_id)}
                                    </div>
                                    
                                    <h6 class="fw-bold mb-3">⚠️ Importante - Lee Antes de Continuar:</h6>
                                    
                                    <div class="mb-3">
                                        <div class="d-flex align-items-start mb-2">
                                            <i class="fas fa-check-circle text-success me-2 mt-1"></i>
                                            <div>
                                                <strong>Si tu solicitud es aprobada:</strong>
                                                <p class="mb-0 small text-muted">Podrás iniciar el viaje inmediatamente y comenzar a registrar gastos.</p>
                                            </div>
                                        </div>
                                        
                                        <div class="d-flex align-items-start mb-2">
                                            <i class="fas fa-times-circle text-danger me-2 mt-1"></i>
                                            <div>
                                                <strong>Si tu solicitud es rechazada:</strong>
                                                <p class="mb-0 small text-danger">
                                                    <strong>No podrás solicitar este viaje nuevamente por 10 días.</strong>
                                                    El administrador te indicará el motivo del rechazo.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div class="d-flex align-items-start">
                                            <i class="fas fa-info-circle text-primary me-2 mt-1"></i>
                                            <div>
                                                <strong>Restricción:</strong>
                                                <p class="mb-0 small text-muted">Solo puedes tener un viaje activo a la vez.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="alert alert-warning mb-0">
                                        <i class="fas fa-question-circle me-2"></i>
                                        <strong>¿Estás seguro de que deseas solicitar el inicio de este viaje?</strong>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="btnCancelarSolicitud">
                                        <i class="fas fa-times me-1"></i>Cancelar
                                    </button>
                                    <button type="button" class="btn btn-success" id="btnConfirmarSolicitud">
                                        <i class="fas fa-check me-1"></i>Sí, Solicitar Inicio
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remover modal existente
                const existingModal = document.getElementById('modalConfirmacionSolicitud');
                if (existingModal) existingModal.remove();

                // Agregar nuevo modal
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                const modalElement = document.getElementById('modalConfirmacionSolicitud');
                const modal = new bootstrap.Modal(modalElement);

                // Eventos
                document.getElementById('btnConfirmarSolicitud').onclick = () => {
                    modal.hide();
                    resolve(true);
                };

                document.getElementById('btnCancelarSolicitud').onclick = () => {
                    modal.hide();
                    resolve(false);
                };

                // Limpiar al cerrar
                modalElement.addEventListener('hidden.bs.modal', () => {
                    modalElement.remove();
                });

                modal.show();
            });
        }

        // Aprobar solicitud de inicio (Admin/Supervisor)
        async aprobarSolicitud(id) {
            console.log('✅ Aprobando solicitud de viaje:', id);

            try {
                const response = await fetch('/LogisticaFinal/api/viajes/aprobar_inicio.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ viaje_id: id })
                });

                const result = await response.json();

                if (result.success) {
                    console.log('✅ Solicitud aprobada exitosamente');
                    
                    // CRÍTICO: Recargar solicitudes Y viajes
                    try {
                        console.log('🔄 Recargando datos completos...');
                        
                        // 1. Recargar viajes
                        await this.cargarViajes();
                        console.log('✅ Viajes recargados');
                        
                        // 2. FORZAR recarga de solicitudes pendientes
                        await this.cargarSolicitudesPendientes();
                        console.log('✅ Solicitudes recargadas');
                        
                        // 2.5 Recargar solicitudes de finalización
                        await this.cargarSolicitudesFinalizacion();
                        console.log('✅ Solicitudes de finalización recargadas');
                        
                        // 3. Re-renderizar la interfaz
                        this.mostrarViajes();
                        console.log('✅ Interfaz actualizada');
                        
                        // Mostrar modal de éxito
                        this.mostrarModalViajes('success', '✅ Solicitud Aprobada',
                            'La solicitud ha sido aprobada. El viaje ahora está en ruta.');
                    } catch (error) {
                        console.error('❌ Error recargando datos:', error);
                        this.mostrarModalViajes('warning', 'Solicitud Aprobada',
                            'La solicitud fue aprobada, pero hubo un problema al actualizar la vista. Por favor, refresca la página (F5).');
                    }
                } else {
                    this.mostrarModalViajes('error', 'Error', result.error || 'No se pudo aprobar la solicitud');
                }

            } catch (error) {
                console.error('❌ Error al aprobar solicitud:', error);
                this.mostrarModalViajes('error', 'Error de Conexión',
                    'No se pudo conectar con el servidor. Verifica tu conexión.');
            }
        }

        // Modal personalizado para ingresar motivo de rechazo
        mostrarModalMotivoRechazo(viaje) {
            return new Promise((resolve) => {
                // Remover modal existente si existe
                const existingModal = document.getElementById('modalMotivoRechazo');
                if (existingModal) {
                    existingModal.remove();
                }

                const modalHtml = `
                    <div class="modal fade" id="modalMotivoRechazo" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content" style="border: none; border-radius: 15px; overflow: hidden;">
                                <!-- Header con gradiente rojo -->
                                <div class="modal-header text-white border-0" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 1.5rem;">
                                    <div>
                                        <h5 class="modal-title mb-1" style="font-weight: 700; font-size: 1.3rem;">
                                            <i class="fas fa-times-circle me-2"></i>
                                            Rechazar Solicitud de Viaje
                                        </h5>
                                        <p class="mb-0 small" style="opacity: 0.9;">
                                            Viaje: ${viaje.origen_estado || viaje.origen} → ${viaje.destino_estado || viaje.destino}
                                        </p>
                                    </div>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                
                                <!-- Body -->
                                <div class="modal-body" style="padding: 2rem;">
                                    <!-- Advertencia -->
                                    <div class="alert alert-warning d-flex align-items-start mb-4" style="border-left: 4px solid #f59e0b; border-radius: 10px;">
                                        <i class="fas fa-exclamation-triangle me-3 mt-1" style="font-size: 1.5rem;"></i>
                                        <div class="flex-grow-1">
                                            <strong class="d-block mb-1">⚠️ Consecuencias del Rechazo</strong>
                                            <p class="mb-2 small">
                                                El transportista <strong>${this.getNombreTransportista(viaje.transportista_id)}</strong> 
                                                no podrá solicitar este viaje nuevamente por el período seleccionado.
                                            </p>
                                            <!-- Selector de días de bloqueo -->
                                            <div class="d-flex align-items-center gap-2">
                                                <label for="diasBloqueo" class="small mb-0 fw-bold" style="color: #92400e;">
                                                    <i class="fas fa-calendar-times me-1"></i>
                                                    Días de bloqueo:
                                                </label>
                                                <select id="diasBloqueo" class="form-select form-select-sm" style="width: auto; border: 2px solid #f59e0b; border-radius: 8px; font-weight: 600;">
                                                    <option value="1">1 día</option>
                                                    <option value="3">3 días</option>
                                                    <option value="5">5 días</option>
                                                    <option value="7">7 días</option>
                                                    <option value="10" selected>10 días</option>
                                                    <option value="15">15 días</option>
                                                    <option value="20">20 días</option>
                                                    <option value="30">30 días</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Información del viaje -->
                                    <div class="mb-4 p-3" style="background: #f8f9fa; border-radius: 10px;">
                                        <div class="row g-2">
                                            <div class="col-6">
                                                <small class="text-muted d-block" style="font-size: 0.75rem; font-weight: 600;">TRANSPORTISTA</small>
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-user-circle text-primary me-2"></i>
                                                    <strong style="font-size: 0.9rem;">${this.getNombreTransportista(viaje.transportista_id)}</strong>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted d-block" style="font-size: 0.75rem; font-weight: 600;">VEHÍCULO</small>
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-truck text-success me-2"></i>
                                                    <strong style="font-size: 0.9rem;">${this.getNombreVehiculo(viaje.vehiculo_id)}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Campo de texto para el motivo -->
                                    <div class="mb-3">
                                        <label for="motivoRechazo" class="form-label fw-bold" style="color: #374151;">
                                            <i class="fas fa-comment-alt me-2 text-danger"></i>
                                            Motivo del Rechazo <span class="text-danger">*</span>
                                        </label>
                                        <textarea 
                                            class="form-control" 
                                            id="motivoRechazo" 
                                            rows="4" 
                                            placeholder="Explica detalladamente por qué se rechaza esta solicitud..."
                                            style="border: 2px solid #e5e7eb; border-radius: 10px; font-size: 0.95rem; resize: none;"
                                            maxlength="500"
                                        ></textarea>
                                        <div class="d-flex justify-content-between mt-2">
                                            <small class="text-muted">
                                                <i class="fas fa-info-circle me-1"></i>
                                                Este motivo será visible para el transportista
                                            </small>
                                            <small class="text-muted" id="contadorCaracteres">0 / 500</small>
                                        </div>
                                    </div>

                                    <!-- Ejemplos de motivos -->
                                    <div class="mb-3">
                                        <small class="text-muted fw-bold d-block mb-2">
                                            <i class="fas fa-lightbulb me-1"></i>
                                            Ejemplos de motivos válidos:
                                        </small>
                                        <div class="d-flex flex-wrap gap-2">
                                            <button type="button" class="btn btn-sm btn-outline-secondary ejemplo-motivo" style="border-radius: 20px; font-size: 0.8rem;">
                                                Vehículo no disponible
                                            </button>
                                            <button type="button" class="btn btn-sm btn-outline-secondary ejemplo-motivo" style="border-radius: 20px; font-size: 0.8rem;">
                                                Ruta no autorizada
                                            </button>
                                            <button type="button" class="btn btn-sm btn-outline-secondary ejemplo-motivo" style="border-radius: 20px; font-size: 0.8rem;">
                                                Documentación incompleta
                                            </button>
                                            <button type="button" class="btn btn-sm btn-outline-secondary ejemplo-motivo" style="border-radius: 20px; font-size: 0.8rem;">
                                                Viaje ya asignado
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Footer -->
                                <div class="modal-footer border-0 bg-light" style="padding: 1.25rem 2rem;">
                                    <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="border-radius: 8px; font-weight: 600;">
                                        <i class="fas fa-times me-2"></i>Cancelar
                                    </button>
                                    <button type="button" class="btn btn-danger px-4" id="btnConfirmarRechazo" style="border-radius: 8px; font-weight: 600; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);">
                                        <i class="fas fa-ban me-2"></i>Rechazar Solicitud
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Agregar al DOM
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                // Obtener elementos
                const modalElement = document.getElementById('modalMotivoRechazo');
                const textarea = document.getElementById('motivoRechazo');
                const btnConfirmar = document.getElementById('btnConfirmarRechazo');
                const contadorCaracteres = document.getElementById('contadorCaracteres');

                // Contador de caracteres
                textarea.addEventListener('input', () => {
                    const length = textarea.value.length;
                    contadorCaracteres.textContent = `${length} / 500`;
                    
                    // Cambiar color si está cerca del límite
                    if (length > 450) {
                        contadorCaracteres.classList.add('text-danger');
                    } else {
                        contadorCaracteres.classList.remove('text-danger');
                    }
                });

                // Botones de ejemplo
                document.querySelectorAll('.ejemplo-motivo').forEach(btn => {
                    btn.addEventListener('click', () => {
                        textarea.value = btn.textContent.trim();
                        textarea.dispatchEvent(new Event('input'));
                        textarea.focus();
                    });
                });

                // Configurar modal
                const modal = new bootstrap.Modal(modalElement);

                // Evento de confirmar
                btnConfirmar.addEventListener('click', () => {
                    const motivo = textarea.value.trim();
                    const diasBloqueo = document.getElementById('diasBloqueo').value;
                    
                    if (!motivo) {
                        // Resaltar el campo si está vacío
                        textarea.style.borderColor = '#ef4444';
                        textarea.focus();
                        
                        // Mostrar mensaje de error temporal
                        const errorMsg = document.createElement('small');
                        errorMsg.className = 'text-danger d-block mt-1';
                        errorMsg.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i>El motivo es obligatorio';
                        textarea.parentElement.appendChild(errorMsg);
                        
                        setTimeout(() => {
                            errorMsg.remove();
                            textarea.style.borderColor = '#e5e7eb';
                        }, 3000);
                        
                        return;
                    }
                    
                    modal.hide();
                    resolve({ motivo, diasBloqueo: parseInt(diasBloqueo) });
                });

                // Evento de cancelar
                modalElement.addEventListener('hidden.bs.modal', () => {
                    if (!textarea.value.trim()) {
                        resolve(null);
                    }
                    modalElement.remove();
                });

                // Mostrar modal y enfocar textarea
                modal.show();
                
                // Enfocar el textarea después de que el modal se muestre
                modalElement.addEventListener('shown.bs.modal', () => {
                    textarea.focus();
                });
            });
        }

        // Rechazar solicitud de inicio (Admin/Supervisor)
        async rechazarSolicitud(id) {
            console.log('❌ Rechazando solicitud de viaje:', id);

            const viaje = this.viajes.find(v => v.id == id);
            if (!viaje) {
                this.mostrarModalViajes('error', 'Error', 'No se encontró el viaje.');
                return;
            }

            // Mostrar modal personalizado para ingresar motivo y días de bloqueo
            const resultado = await this.mostrarModalMotivoRechazo(viaje);

            if (!resultado || !resultado.motivo || resultado.motivo.trim() === '') {
                console.log('❌ Rechazo cancelado por el usuario');
                return;
            }

            console.log(`📋 Rechazando con: ${resultado.diasBloqueo} días de bloqueo`);

            try {
                console.log('📡 Enviando rechazo a la API...');
                console.log('   Viaje ID:', id);
                console.log('   Motivo:', resultado.motivo.trim());
                console.log('   Días bloqueo:', resultado.diasBloqueo);
                
                const response = await fetch('/LogisticaFinal/api/viajes/rechazar_inicio.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        viaje_id: id,
                        motivo: resultado.motivo.trim(),
                        dias_bloqueo: resultado.diasBloqueo
                    })
                });

                console.log('📥 Respuesta HTTP:', response.status, response.statusText);
                
                const result = await response.json();
                console.log('📥 Respuesta JSON:', result);

                if (result.success) {
                    console.log('✅ Solicitud rechazada exitosamente');
                    
                    // CRÍTICO: Recargar solicitudes Y viajes
                    try {
                        console.log('🔄 Recargando datos completos...');
                        
                        // 1. Recargar viajes
                        await this.cargarViajes();
                        console.log('✅ Viajes recargados');
                        
                        // 2. FORZAR recarga de solicitudes pendientes
                        await this.cargarSolicitudesPendientes();
                        console.log('✅ Solicitudes recargadas');
                        
                        // 2.5 Recargar solicitudes de finalización
                        await this.cargarSolicitudesFinalizacion();
                        console.log('✅ Solicitudes de finalización recargadas');
                        
                        // 3. Re-renderizar la interfaz
                        this.mostrarViajes();
                        console.log('✅ Interfaz actualizada');
                        
                        // Mostrar modal de éxito
                        const mensaje_dias = resultado.diasBloqueo == 1 ? '1 día' : `${resultado.diasBloqueo} días`;
                        this.mostrarModalViajes('warning', '❌ Solicitud Rechazada',
                            `La solicitud ha sido rechazada. El transportista no podrá solicitar este viaje por ${mensaje_dias}.`);
                    } catch (error) {
                        console.error('❌ Error recargando datos:', error);
                        this.mostrarModalViajes('warning', 'Solicitud Rechazada',
                            'La solicitud fue rechazada, pero hubo un problema al actualizar la vista. Por favor, refresca la página (F5).');
                    }
                } else {
                    this.mostrarModalViajes('error', 'Error', result.error || 'No se pudo rechazar la solicitud');
                }

            } catch (error) {
                console.error('❌ Error al rechazar solicitud:', error);
                this.mostrarModalViajes('error', 'Error de Conexión',
                    'No se pudo conectar con el servidor. Verifica tu conexión.');
            }
        }

        // ========== FUNCIONES PARA FINALIZACIÓN DE VIAJES ==========

        // Solicitar finalización de viaje (Transportista)
        async solicitarFinalizacionViaje(id) {
            console.log('🏁 Solicitando finalización de viaje:', id);

            const viaje = this.viajes.find(v => v.id == id);
            if (!viaje) {
                this.mostrarModalViajes('error', 'Error', 'No se encontró el viaje.');
                return;
            }

            // Mostrar modal de confirmación
            const confirmado = await this.mostrarModalConfirmacionFinalizacion(viaje);
            if (!confirmado) {
                console.log('❌ Finalización cancelada por el usuario');
                return;
            }

            try {
                console.log('📡 Enviando solicitud de finalización a la API...');
                
                const response = await fetch('/LogisticaFinal/api/viajes/solicitar_finalizacion.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        viaje_id: id,
                        transportista_id: this.getCurrentUserId()
                    })
                });

                console.log('📥 Respuesta HTTP:', response.status, response.statusText);
                
                const result = await response.json();
                console.log('📥 Respuesta JSON:', result);

                if (result.success) {
                    console.log('✅ Solicitud de finalización enviada exitosamente');
                    
                    // Recargar datos
                    try {
                        console.log('🔄 Recargando datos...');
                        await this.cargarSolicitudesFinalizacion();
                        this.mostrarViajes();
                        
                        this.mostrarModalViajes('success', '✅ Solicitud Enviada',
                            'Tu solicitud de finalización ha sido enviada. El administrador la revisará pronto.');
                    } catch (error) {
                        console.error('❌ Error recargando datos:', error);
                        this.mostrarModalViajes('warning', 'Solicitud Enviada',
                            'La solicitud fue enviada, pero hubo un problema al actualizar la vista. Por favor, refresca la página (F5).');
                    }
                } else {
                    this.mostrarModalViajes('error', 'Error', result.error || 'No se pudo enviar la solicitud');
                }

            } catch (error) {
                console.error('❌ Error al solicitar finalización:', error);
                this.mostrarModalViajes('error', 'Error de Conexión',
                    'No se pudo conectar con el servidor. Verifica tu conexión.');
            }
        }

        // Modal de confirmación para finalizar viaje
        mostrarModalConfirmacionFinalizacion(viaje) {
            return new Promise((resolve) => {
                const modalHtml = `
                    <div class="modal fade" id="modalConfirmacionFinalizacion" tabindex="-1" data-bs-backdrop="static">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header bg-primary text-white">
                                    <h5 class="modal-title">
                                        <i class="fas fa-flag-checkered me-2"></i>
                                        Confirmar Finalización de Viaje
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle me-2"></i>
                                        <strong>¿Estás seguro de que deseas finalizar este viaje?</strong>
                                    </div>
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h6 class="card-title mb-3">
                                                <i class="fas fa-route me-2"></i>Información del Viaje
                                            </h6>
                                            <div class="row g-2">
                                                <div class="col-6">
                                                    <small class="text-muted d-block">Origen</small>
                                                    <strong>${viaje.origen_estado || viaje.origen}</strong>
                                                </div>
                                                <div class="col-6">
                                                    <small class="text-muted d-block">Destino</small>
                                                    <strong>${viaje.destino_estado || viaje.destino}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="mt-3 mb-0 small text-muted">
                                        El administrador revisará tu solicitud y aprobará o rechazará la finalización del viaje.
                                    </p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="btnCancelarFinalizacion">
                                        <i class="fas fa-times me-1"></i>Cancelar
                                    </button>
                                    <button type="button" class="btn btn-primary" id="btnConfirmarFinalizacion">
                                        <i class="fas fa-check me-1"></i>Sí, Finalizar Viaje
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHtml);
                const modalElement = document.getElementById('modalConfirmacionFinalizacion');
                const modal = new bootstrap.Modal(modalElement);

                document.getElementById('btnConfirmarFinalizacion').addEventListener('click', () => {
                    modal.hide();
                    resolve(true);
                });

                document.getElementById('btnCancelarFinalizacion').addEventListener('click', () => {
                    modal.hide();
                    resolve(false);
                });

                modalElement.addEventListener('hidden.bs.modal', function () {
                    this.remove();
                });

                modal.show();
            });
        }

        // Aprobar finalización (Admin/Supervisor)
        async aprobarFinalizacion(id) {
            console.log('✅ Aprobando finalización de viaje:', id);

            try {
                const response = await fetch('/LogisticaFinal/api/viajes/aprobar_finalizacion.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ viaje_id: id })
                });

                console.log('📥 Respuesta HTTP:', response.status, response.statusText);
                
                const result = await response.json();
                console.log('📥 Respuesta JSON:', result);

                if (result.success) {
                    console.log('✅ Finalización aprobada exitosamente');
                    
                    // Recargar datos
                    try {
                        console.log('🔄 Recargando datos...');
                        await this.cargarViajes();
                        await this.cargarSolicitudesFinalizacion();
                        this.mostrarViajes();
                        
                        this.mostrarModalViajes('success', '✅ Viaje Finalizado',
                            'El viaje ha sido marcado como completado exitosamente.');
                    } catch (error) {
                        console.error('❌ Error recargando datos:', error);
                        this.mostrarModalViajes('warning', 'Viaje Finalizado',
                            'El viaje fue finalizado, pero hubo un problema al actualizar la vista. Por favor, refresca la página (F5).');
                    }
                } else {
                    // Si ya fue procesado, solo recargar sin mostrar error
                    if (result.ya_procesado) {
                        console.log('⚠️ Solicitud ya procesada, recargando vista...');
                        try {
                            await this.cargarViajes();
                            await this.cargarSolicitudesFinalizacion();
                            this.mostrarViajes();
                        } catch (error) {
                            console.error('❌ Error recargando datos:', error);
                        }
                    } else {
                        this.mostrarModalViajes('error', 'Error', result.error || 'No se pudo aprobar la finalización');
                    }
                }

            } catch (error) {
                console.error('❌ Error al aprobar finalización:', error);
                this.mostrarModalViajes('error', 'Error de Conexión',
                    'No se pudo conectar con el servidor. Verifica tu conexión.');
            }
        }

        // Rechazar finalización (Admin/Supervisor)
        async rechazarFinalizacion(id) {
            console.log('❌ Rechazando finalización de viaje:', id);

            const viaje = this.viajes.find(v => v.id == id);
            if (!viaje) {
                this.mostrarModalViajes('error', 'Error', 'No se encontró el viaje.');
                return;
            }

            // Mostrar modal para ingresar motivo
            const motivo = await this.mostrarModalMotivoRechazoFinalizacion(viaje);

            if (!motivo || motivo.trim() === '') {
                console.log('❌ Rechazo cancelado por el usuario');
                return;
            }

            try {
                console.log('📡 Enviando rechazo de finalización a la API...');
                console.log('   Viaje ID:', id);
                console.log('   Motivo:', motivo.trim());
                
                const response = await fetch('/LogisticaFinal/api/viajes/rechazar_finalizacion.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        viaje_id: id,
                        motivo: motivo.trim()
                    })
                });

                console.log('📥 Respuesta HTTP:', response.status, response.statusText);
                
                const result = await response.json();
                console.log('📥 Respuesta JSON:', result);

                if (result.success) {
                    console.log('✅ Finalización rechazada exitosamente');
                    
                    // Recargar datos
                    try {
                        console.log('🔄 Recargando datos...');
                        await this.cargarViajes();
                        await this.cargarSolicitudesFinalizacion();
                        this.mostrarViajes();
                        
                        this.mostrarModalViajes('warning', '❌ Finalización Rechazada',
                            'La solicitud de finalización ha sido rechazada. El viaje continúa en ruta.');
                    } catch (error) {
                        console.error('❌ Error recargando datos:', error);
                        this.mostrarModalViajes('warning', 'Finalización Rechazada',
                            'La finalización fue rechazada, pero hubo un problema al actualizar la vista. Por favor, refresca la página (F5).');
                    }
                } else {
                    // Si ya fue procesado, solo recargar sin mostrar error
                    if (result.ya_procesado) {
                        console.log('⚠️ Solicitud ya procesada, recargando vista...');
                        try {
                            await this.cargarViajes();
                            await this.cargarSolicitudesFinalizacion();
                            this.mostrarViajes();
                        } catch (error) {
                            console.error('❌ Error recargando datos:', error);
                        }
                    } else {
                        this.mostrarModalViajes('error', 'Error', result.error || 'No se pudo rechazar la finalización');
                    }
                }

            } catch (error) {
                console.error('❌ Error al rechazar finalización:', error);
                this.mostrarModalViajes('error', 'Error de Conexión',
                    'No se pudo conectar con el servidor. Verifica tu conexión.');
            }
        }

        // Modal para ingresar motivo de rechazo de finalización
        mostrarModalMotivoRechazoFinalizacion(viaje) {
            return new Promise((resolve) => {
                const modalHtml = `
                    <div class="modal fade" id="modalMotivoRechazoFinalizacion" tabindex="-1" data-bs-backdrop="static">
                        <div class="modal-dialog modal-dialog-centered modal-lg">
                            <div class="modal-content">
                                <div class="modal-header text-white border-0" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 1.5rem;">
                                    <div>
                                        <h5 class="modal-title mb-1" style="font-weight: 700; font-size: 1.3rem;">
                                            <i class="fas fa-times-circle me-2"></i>
                                            Rechazar Finalización de Viaje
                                        </h5>
                                        <p class="mb-0 small" style="opacity: 0.9;">
                                            Viaje: ${viaje.origen_estado || viaje.origen} → ${viaje.destino_estado || viaje.destino}
                                        </p>
                                    </div>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body" style="padding: 2rem;">
                                    <div class="alert alert-warning d-flex align-items-start mb-4" style="border-left: 4px solid #f59e0b;">
                                        <i class="fas fa-exclamation-triangle me-3 mt-1" style="font-size: 1.5rem;"></i>
                                        <div>
                                            <strong>Importante</strong>
                                            <p class="mb-0 small">
                                                El viaje continuará en estado "En Ruta". El transportista verá el motivo del rechazo.
                                            </p>
                                        </div>
                                    </div>

                                    <div class="mb-4">
                                        <label for="motivoRechazoFinalizacion" class="form-label fw-bold" style="font-size: 1rem;">
                                            <i class="fas fa-comment-alt me-2 text-danger"></i>
                                            Motivo del Rechazo *
                                        </label>
                                        <textarea 
                                            class="form-control" 
                                            id="motivoRechazoFinalizacion" 
                                            rows="4" 
                                            placeholder="Ejemplo: El viaje no puede finalizarse porque falta entregar mercancía en el punto X..."
                                            style="border-radius: 8px; border: 2px solid #e5e7eb; font-size: 0.95rem;"
                                            required
                                        ></textarea>
                                        <small class="text-muted mt-2 d-block">
                                            <i class="fas fa-info-circle me-1"></i>
                                            Este motivo será visible para el transportista en los detalles del viaje.
                                        </small>
                                    </div>
                                </div>
                                <div class="modal-footer border-0 bg-light" style="padding: 1.25rem 2rem;">
                                    <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="border-radius: 8px; font-weight: 600;">
                                        <i class="fas fa-times me-2"></i>Cancelar
                                    </button>
                                    <button type="button" class="btn btn-danger px-4" id="btnConfirmarRechazoFinalizacion" style="border-radius: 8px; font-weight: 600; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);">
                                        <i class="fas fa-ban me-2"></i>Rechazar Finalización
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHtml);
                const modalElement = document.getElementById('modalMotivoRechazoFinalizacion');
                const modal = new bootstrap.Modal(modalElement);
                const textarea = document.getElementById('motivoRechazoFinalizacion');

                document.getElementById('btnConfirmarRechazoFinalizacion').addEventListener('click', () => {
                    const motivo = textarea.value.trim();
                    
                    if (!motivo) {
                        textarea.classList.add('is-invalid');
                        textarea.focus();
                        return;
                    }
                    
                    modal.hide();
                    resolve(motivo);
                });

                modalElement.addEventListener('hidden.bs.modal', function () {
                    this.remove();
                    if (!textarea.value.trim()) {
                        resolve(null);
                    }
                });

                modal.show();
                setTimeout(() => {
                    textarea.focus();
                }, 500);
            });
        }

        // ========== FIN FUNCIONES FINALIZACIÓN ==========

        // Verificar si un viaje tiene solicitud pendiente (desde API)
        async tieneSolicitudPendiente(id) {
            try {
                const response = await fetch(`/LogisticaFinal/api/viajes/verificar_solicitud.php?viaje_id=${id}`);
                const result = await response.json();

                if (result.success) {
                    return result.tiene_solicitud || false;
                }
                return false;

            } catch (error) {
                console.error('❌ Error verificando solicitud:', error);
                return false;
            }
        }

        // Cargar solicitudes pendientes al iniciar
        async cargarSolicitudesPendientes() {
            try {
                console.log('🔄 Cargando solicitudes pendientes y bloqueos...');
                // Cargar todas las solicitudes pendientes Y bloqueos para los viajes actuales
                this.solicitudesPendientes = [];

                const promises = this.viajes.map(async (viaje) => {
                    if (viaje.estado === 'pendiente') {
                        try {
                            console.log(`📡 Verificando viaje ${viaje.id}...`);
                            // Incluir user_id en la petición para verificar bloqueos
                            const userId = this.getCurrentUserId();
                            const url = `/LogisticaFinal/api/viajes/verificar_solicitud.php?viaje_id=${viaje.id}${userId ? `&user_id=${userId}` : ''}`;
                            const response = await fetch(url);
                            const data = await response.json();
                            
                            console.log(`📥 Respuesta para viaje ${viaje.id}:`, data);
                            
                            if (data.success) {
                                const resultado = {
                                    viaje_id: viaje.id,
                                    tiene_solicitud: data.tiene_solicitud || false,
                                    bloqueado: data.bloqueado || false,
                                    dias_restantes: data.dias_restantes || 0,
                                    dias_bloqueo_total: data.dias_bloqueo_total || 0,
                                    fecha_desbloqueo: data.fecha_desbloqueo || null,
                                    motivo_rechazo: data.motivo_rechazo || ''
                                };
                                
                                if (resultado.bloqueado) {
                                    console.log(`🔒 Viaje ${viaje.id} está BLOQUEADO por ${resultado.dias_restantes} días`);
                                }
                                
                                return resultado;
                            }
                        } catch (error) {
                            console.error(`❌ Error verificando viaje ${viaje.id}:`, error);
                        }
                    }
                    return null;
                });

                const resultados = await Promise.all(promises);
                this.solicitudesPendientes = resultados.filter(r => r !== null);

                console.log('✅ Solicitudes y bloqueos cargados:', this.solicitudesPendientes);
                console.log(`📊 Total: ${this.solicitudesPendientes.length} viajes con información`);
                
                // Log detallado de bloqueos
                const bloqueados = this.solicitudesPendientes.filter(s => s.bloqueado);
                if (bloqueados.length > 0) {
                    console.log(`🔒 Viajes bloqueados encontrados: ${bloqueados.length}`);
                    bloqueados.forEach(b => {
                        console.log(`   - Viaje ${b.viaje_id}: ${b.dias_restantes} días restantes`);
                    });
                }

            } catch (error) {
                console.error('❌ Error cargando solicitudes pendientes:', error);
                this.solicitudesPendientes = [];
            }
        }

        // Cargar solicitudes de finalización pendientes
        async cargarSolicitudesFinalizacion() {
            try {
                console.log('🔄 Cargando solicitudes de finalización pendientes...');
                this.solicitudesFinalizacion = [];

                const promises = this.viajes.map(async (viaje) => {
                    if (viaje.estado === 'en_ruta') {
                        try {
                            console.log(`📡 Verificando finalización viaje ${viaje.id}...`);
                            const response = await fetch(`/LogisticaFinal/api/viajes/verificar_solicitud_finalizacion.php?viaje_id=${viaje.id}`);
                            const data = await response.json();
                            
                            console.log(`📥 Respuesta finalización para viaje ${viaje.id}:`, data);
                            
                            if (data.success) {
                                return {
                                    viaje_id: viaje.id,
                                    tiene_solicitud: data.tiene_solicitud || false,
                                    solicitud: data.solicitud || null
                                };
                            }
                        } catch (error) {
                            console.error(`❌ Error verificando finalización viaje ${viaje.id}:`, error);
                        }
                    }
                    return null;
                });

                const resultados = await Promise.all(promises);
                this.solicitudesFinalizacion = resultados.filter(r => r !== null);

                console.log('✅ Solicitudes de finalización cargadas:', this.solicitudesFinalizacion);
                console.log(`📊 Total: ${this.solicitudesFinalizacion.length} viajes con información de finalización`);

            } catch (error) {
                console.error('❌ Error cargando solicitudes de finalización:', error);
                this.solicitudesFinalizacion = [];
            }
        }

        // ========== FIN NUEVAS FUNCIONES ==========

        // Eliminar viaje con modal de confirmación
        eliminarViaje(id) {
            const viaje = this.viajes.find(v => v.id == id);
            if (!viaje) {
                this.mostrarModalViajes('error', 'Viaje No Encontrado', 'No se pudo encontrar el viaje solicitado para eliminar.');
                return;
            }

            const transportista = this.getNombreTransportista(viaje.transportista_id);
            const vehiculo = this.vehiculos.find(v => v.id == viaje.vehiculo_id);
            const nombreVehiculo = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})` : 'N/A';

            // Crear modal personalizado para eliminar viaje
            this.mostrarModalEliminarViaje(viaje, transportista, nombreVehiculo, () => {
                this.confirmarEliminacion(id);
            });
        }

        // Confirmar eliminación del viaje
        async confirmarEliminacion(id) {
            try {
                console.log('🗑️ Eliminando viaje:', id);

                const response = await fetch('/LogisticaFinal/api/viajes/delete.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: id })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Error HTTP:', response.status, errorText);
                    this.mostrarModalViajes('error', 'Error de Servidor', `Error HTTP ${response.status}: ${errorText}`);
                    return;
                }

                const result = await response.json();
                console.log('📡 Respuesta API:', result);

                if (result.success) {
                    // Recargar viajes de forma suave (mantener datos existentes)
                    console.log('🔄 Recargando viajes después de eliminación...');
                    await this.cargarViajes();
                    this.mostrarModalViajes('success', 'Viaje Eliminado', 'El viaje ha sido eliminado correctamente.');
                    console.log('✅ Viaje eliminado correctamente');
                } else {
                    this.mostrarModalViajes('error', 'Error al Eliminar', 'Error al eliminar el viaje: ' + (result.message || result.error));
                    console.error('❌ Error:', result);
                }

            } catch (error) {
                console.error('❌ Error eliminando viaje:', error);
                this.mostrarModalViajes('error', 'Error de Conexión', 'Error de conexión al eliminar el viaje. Por favor, verifica tu conexión e inténtalo de nuevo.');
            }
        }

        // Mostrar modal
        async showCreateModal() {
            console.log('🚀 Abriendo modal simple...');

            // Cargar datos
            this.cargarEstadosMexicanos();
            await this.cargarTransportistas();
            await this.cargarVehiculos();

            // Mostrar modal
            const modalEl = document.getElementById('nuevoViajeModal');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
                console.log('✅ Modal mostrado');
            }
        }

        // Guardar viaje
        async guardarViaje() {
            try {
                console.log('💾 Guardando viaje...');

                // Obtener datos del formulario
                const form = document.getElementById('nuevoViajeForm');
                if (!form) {
                    console.error('❌ Formulario no encontrado');
                    return;
                }

                const formData = new FormData(form);
                const viajeData = {
                    origen_estado: formData.get('origenEstado'),
                    origen_municipio: formData.get('origenMunicipio'),
                    destino_estado: formData.get('destinoEstado'),
                    destino_municipio: formData.get('destinoMunicipio'),
                    transportista_id: formData.get('transportista'),
                    vehiculo_id: formData.get('vehiculo'),
                    fecha_salida: formData.get('fechaSalida'),
                    fecha_llegada_estimada: formData.get('fechaLlegada'),
                    descripcion: formData.get('cargaDescripcion') || formData.get('descripcion') || 'Viaje programado',
                    peso_carga: formData.get('pesoCarga'),
                    estado: 'Programado'
                };

                console.log('📋 Datos del viaje:', viajeData);

                // Validación personalizada con mensajes específicos
                const validationErrors = [];

                if (!viajeData.origen_estado) {
                    validationErrors.push('📍 Completa el campo "Estado de Origen" para continuar');
                }

                if (!viajeData.origen_municipio) {
                    validationErrors.push('🏙️ Completa el campo "Municipio de Origen" para continuar');
                }

                if (!viajeData.destino_estado) {
                    validationErrors.push('🎯 Completa el campo "Estado de Destino" para continuar');
                }

                if (!viajeData.destino_municipio) {
                    validationErrors.push('🏘️ Completa el campo "Municipio de Destino" para continuar');
                }

                if (!viajeData.transportista_id) {
                    validationErrors.push('👤 Selecciona un "Transportista" para continuar');
                }

                if (!viajeData.vehiculo_id) {
                    validationErrors.push('🚛 Selecciona un "Vehículo" para continuar');
                }

                if (!viajeData.fecha_salida) {
                    validationErrors.push('📅 Completa la "Fecha de Salida" para continuar');
                }

                if (!viajeData.descripcion || viajeData.descripcion === 'Viaje programado') {
                    validationErrors.push('📦 Completa la "Descripción de la Carga" para continuar');
                }

                // Si hay errores, mostrar el primer error
                if (validationErrors.length > 0) {
                    this.mostrarMensajeValidacion(validationErrors[0]);
                    return;
                }

                // Enviar a la API
                console.log('🚀 Enviando datos a API:', viajeData);
                const response = await fetch('/LogisticaFinal/api/viajes/create.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(viajeData)
                });

                console.log('📡 Status de respuesta:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Error HTTP:', response.status, errorText);
                    this.mostrarModalViajes('error', 'Error de Servidor', `Error HTTP ${response.status}: ${errorText}`);
                    return;
                }

                const result = await response.json();
                console.log('📡 Respuesta API completa:', result);

                if (result.success) {
                    // Cerrar modal
                    const modalEl = document.getElementById('nuevoViajeModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();

                    // Recargar viajes de forma suave (mantener datos existentes)
                    console.log('🔄 Recargando viajes después de creación...');
                    await this.cargarViajes();

                    // Mostrar modal de éxito personalizado
                    this.mostrarModalExito(result);
                    console.log('✅ Viaje guardado correctamente');
                } else {
                    let errorMsg = result.message || result.error || 'Error desconocido';
                    let detalles = '';
                    if (result.user_role) {
                        detalles = `Tu rol actual: ${result.user_role}<br>Roles permitidos: ${result.required_roles?.join(', ')}`;
                    }
                    this.mostrarModalViajes('error', 'Error al Guardar Viaje', errorMsg, detalles);
                    console.error('❌ Error completo:', result);
                }

            } catch (error) {
                console.error('❌ Error guardando viaje:', error);
                this.mostrarModalViajes('error', 'Error de Conexión', 'Error de conexión al guardar el viaje. Por favor, verifica tu conexión e inténtalo de nuevo.');
            }
        }

        // Mostrar mensaje de validación personalizado
        mostrarMensajeValidacion(mensaje) {
            // Crear modal de validación personalizado
            const modalHtml = `
            <div class="modal fade" id="validationModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-warning">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Campo Requerido
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div class="mb-3">
                                <i class="fas fa-clipboard-check fa-3x text-warning"></i>
                            </div>
                            <h6 class="text-dark">${mensaje}</h6>
                            <p class="text-muted small mt-2">
                                Por favor completa la información solicitada para continuar
                            </p>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-warning" data-bs-dismiss="modal">
                                <i class="fas fa-check me-1"></i>
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

            // Remover modal anterior si existe
            const existingModal = document.getElementById('validationModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Agregar nuevo modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('validationModal'));
            modal.show();

            // Auto-remover modal del DOM cuando se cierre
            document.getElementById('validationModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });
        }

        // Mostrar modal de éxito personalizado
        mostrarModalExito(result) {
            const modalHtml = `
            <div class="modal fade" id="exitoModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-success">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-check-circle me-2"></i>
                                ¡Viaje Creado Exitosamente!
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div class="mb-4">
                                <i class="fas fa-truck fa-4x text-success mb-3"></i>
                                <h4 class="text-success">¡Perfecto!</h4>
                            </div>
                            
                            <div class="card bg-light mb-3">
                                <div class="card-body">
                                    <h6 class="card-title text-primary">
                                        <i class="fas fa-hashtag me-1"></i>
                                        Número de Viaje
                                    </h6>
                                    <h3 class="text-dark mb-0">${result.numero_viaje || 'N/A'}</h3>
                                </div>
                            </div>
                            
                            <div class="row text-start">
                                <div class="col-6">
                                    <small class="text-muted">ID del Viaje:</small>
                                    <div class="fw-bold">#${result.id || 'N/A'}</div>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Estado:</small>
                                    <div class="fw-bold text-warning">Pendiente</div>
                                </div>
                            </div>
                            
                            <div class="alert alert-info mt-3">
                                <i class="fas fa-info-circle me-2"></i>
                                El viaje ha sido registrado y está listo para ser asignado
                            </div>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-success me-2" data-bs-dismiss="modal">
                                <i class="fas fa-check me-1"></i>
                                Entendido
                            </button>
                            <button type="button" class="btn btn-outline-primary" onclick="navigateTo('dashboardSection', 'Dashboard')">
                                <i class="fas fa-chart-line me-1"></i>
                                Ver Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

            // Remover modal anterior si existe
            const existingModal = document.getElementById('exitoModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Agregar nuevo modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Mostrar modal con animación
            setTimeout(() => {
                const modal = new bootstrap.Modal(document.getElementById('exitoModal'));
                modal.show();
            }, 300);

            // Auto-remover modal del DOM cuando se cierre
            document.getElementById('exitoModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });
        }
    }

    // Inicializar de forma simple y directa
    document.addEventListener('DOMContentLoaded', function () {
        console.log('🚀 Iniciando ViajesManagerSimple...');

        window.ViajesManager = new ViajesManagerSimple();

        // Configurar restricciones inmediatamente
        window.ViajesManager.configurarRestriccionesInmediatas();

        // Inicializar después de que el DOM esté listo
        setTimeout(() => {
            try {
                // Configurar restricciones iniciales
                window.ViajesManager.configurarRestriccionesInmediatas();
                console.log('✅ ViajesManagerSimple listo');
            } catch (error) {
                console.error('❌ Error inicializando ViajesManager:', error);
            }
        }, 100);
    });

} // Cierre del if (typeof ViajesManagerSimple === 'undefined')
