// Dashboard Manager - 📊 Dashboard functionality
class DashboardManager {
    constructor() {
        this.data = {
            expenses: {},
            vehicles: {},
            viajes: {},
            recentActivity: []
        };
        this.viajesChart = null;
        this.monthlyChart = null;
        this.isLoading = false;
        this.refreshInterval = null;
        this.refreshRate = 30000; // 30 segundos
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Auto-refresh desactivado - el usuario puede actualizar manualmente
        // this.startAutoRefresh();
        console.log('ℹ️ Auto-actualización desactivada - Actualiza manualmente si necesitas');
    }

    clearAllData() {
        console.log('🧹 Limpiando datos del dashboard...');
        
        // Limpiar datos
        this.data = {
            expenses: {},
            vehicles: {},
            viajes: {},
            recentActivity: []
        };
        
        // Destruir gráficas
        if (this.viajesChart) {
            try {
                this.viajesChart.destroy();
            } catch (e) {
                console.warn('Error destruyendo viajesChart:', e);
            }
            this.viajesChart = null;
        }
        
        if (this.monthlyChart) {
            try {
                this.monthlyChart.destroy();
            } catch (e) {
                console.warn('Error destruyendo monthlyChart:', e);
            }
            this.monthlyChart = null;
        }
        
        if (this.expenseChartInstance) {
            try {
                this.expenseChartInstance.destroy();
            } catch (e) {
                console.warn('Error destruyendo expenseChartInstance:', e);
            }
            this.expenseChartInstance = null;
        }
        
        if (this.viajesChartInstance) {
            try {
                this.viajesChartInstance.destroy();
            } catch (e) {
                console.warn('Error destruyendo viajesChartInstance:', e);
            }
            this.viajesChartInstance = null;
        }
        
        // Limpiar canvas de gráficas
        const canvases = ['expenseChart', 'viajesChart', 'monthlyChart'];
        canvases.forEach(canvasId => {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        });
        
        console.log('✅ Dashboard limpiado completamente');
    }

    setupEventListeners() {
        // Export reports button
        const exportBtn = document.querySelector('[onclick="exportReports()"]');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportReports();
        }
    }

    async loadUserSpecificData(userId, dashboardData) {
        try {
            console.log('📊 Cargando gastos individuales del usuario:', userId);
            
            // Cargar TODOS los gastos del usuario
            const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
            const gastosResponse = await fetch(`${apiPath}/gastos/list.php`);
            const allGastos = await gastosResponse.json();
            
            console.log('📊 Total gastos recibidos:', allGastos.length);
            
            // Filtrar solo los gastos del usuario
            const userGastos = allGastos.filter(g => String(g.usuario_id) === String(userId));
            console.log('📊 Gastos del usuario:', userGastos.length);
            
            if (userGastos.length === 0) {
                console.log('⚠️ Usuario sin gastos registrados');
                return {
                    ...dashboardData,
                    expenses: {
                        total_amount: 0,
                        total_fuel: 0,
                        gastos_aprobados: 0,
                        gastos_negados: 0,
                        gastos_pendientes: 0,
                        monto_aprobados: 0,
                        monto_rechazados: 0,
                        promedio_gasto: 0
                    },
                    expensesByMonth: [],
                    expensesByCategory: [],
                    monthlyExpenses: []
                };
            }
            
            // Calcular estadísticas del usuario
            const totalAmount = userGastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
            const totalFuel = userGastos.filter(g => g.tipo === 'combustible').reduce((sum, g) => sum + (parseFloat(g.litros) || 0), 0);
            const gastosAprobados = userGastos.filter(g => g.estado === 'aprobado').length;
            const gastosNegados = userGastos.filter(g => g.estado === 'rechazado' || g.estado === 'negado').length;
            const gastosPendientes = userGastos.filter(g => g.estado === 'pendiente').length;
            const montoAprobados = userGastos.filter(g => g.estado === 'aprobado').reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
            const montoRechazados = userGastos.filter(g => g.estado === 'rechazado' || g.estado === 'negado').reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
            const promedioGasto = totalAmount / userGastos.length;
            
            // Agrupar por mes para la gráfica
            const expensesByMonth = this.groupByMonth(userGastos);
            
            // Agrupar por categoría para la gráfica
            const expensesByCategory = this.groupByCategory(userGastos);
            
            // Agrupar por mes y tipo para la gráfica de gastos mensuales
            const monthlyExpenses = this.groupByMonthAndType(userGastos);
            
            console.log('✅ Estadísticas calculadas:', {
                totalAmount,
                totalFuel,
                gastosAprobados,
                gastosNegados,
                gastosPendientes,
                monthlyExpenses: monthlyExpenses.length
            });
            
            return {
                ...dashboardData,
                expenses: {
                    total_amount: totalAmount,
                    total_fuel: totalFuel,
                    gastos_aprobados: gastosAprobados,
                    gastos_negados: gastosNegados,
                    gastos_pendientes: gastosPendientes,
                    monto_aprobados: montoAprobados,
                    monto_rechazados: montoRechazados,
                    promedio_gasto: promedioGasto
                },
                expensesByMonth,
                expensesByCategory,
                monthlyExpenses
            };
        } catch (error) {
            console.error('❌ Error cargando datos del usuario:', error);
            return dashboardData;
        }
    }

    groupByMonth(gastos) {
        // Agrupar gastos por mes
        const grouped = {};
        gastos.forEach(g => {
            const fecha = new Date(g.fecha);
            const mes = fecha.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            if (!grouped[mes]) {
                grouped[mes] = { mes, monto: 0, tipo: g.tipo };
            }
            grouped[mes].monto += parseFloat(g.monto) || 0;
        });
        return Object.values(grouped);
    }

    groupByCategory(gastos) {
        // Agrupar gastos por categoría
        const grouped = {};
        gastos.forEach(g => {
            const tipo = g.tipo || 'otros';
            if (!grouped[tipo]) {
                grouped[tipo] = { tipo, monto: 0, cantidad: 0 };
            }
            grouped[tipo].monto += parseFloat(g.monto) || 0;
            grouped[tipo].cantidad += 1;
        });
        return Object.values(grouped);
    }

    groupByMonthAndType(gastos) {
        // Agrupar gastos por mes y tipo para la gráfica mensual
        const grouped = {};
        
        gastos.forEach(g => {
            const fecha = new Date(g.fecha);
            const year = fecha.getFullYear();
            const month = fecha.getMonth() + 1; // 1-12
            const tipo = g.tipo || 'otros';
            const key = `${year}-${month}-${tipo}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    year: year,
                    month: month,
                    tipo: tipo,
                    total: 0
                };
            }
            grouped[key].total += parseFloat(g.monto) || 0;
        });
        
        return Object.values(grouped);
    }

    filterDataByRole(data) {
        // Obtener rol del usuario
        const currentUser = window.app?.currentUser;
        const userId = currentUser?.id;
        const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
        const isAdminOrSupervisor = userRole === 'admin' || userRole === 'administrador' || userRole === 'supervisor';

        console.log('🔍 Filtrando datos por rol:', {
            userId,
            userRole,
            isAdminOrSupervisor
        });

        if (isAdminOrSupervisor) {
            // Admin/Supervisor ven todos los datos sin filtrar
            console.log('👨‍💼 Admin/Supervisor: Mostrando todos los datos del sistema');
            return data;
        }

        // TRANSPORTISTA: Filtrar solo sus datos
        console.log('🚛 Transportista: Filtrando solo sus datos');
        console.log('   🔍 Usuario ID:', userId);
        console.log('   🔍 Datos recibidos:', {
            expensesByMonth: data.expensesByMonth?.length || 0,
            expensesByCategory: data.expensesByCategory?.length || 0,
            expenses: data.expenses
        });

        // Filtrar gastos del usuario en expensesByMonth
        if (data.expensesByMonth && Array.isArray(data.expensesByMonth)) {
            console.log('   🔍 Primer gasto por mes (antes de filtrar):', data.expensesByMonth[0]);
            const originalLength = data.expensesByMonth.length;
            data.expensesByMonth = data.expensesByMonth.filter(expense => {
                const match = String(expense.usuario_id) === String(userId);
                if (!match) {
                    console.log(`   ❌ Filtrando gasto de usuario ${expense.usuario_id} (no es ${userId})`);
                }
                return match;
            });
            console.log(`   📊 Gastos por mes filtrados: ${data.expensesByMonth.length} de ${originalLength}`);
        }

        // Filtrar gastos del usuario en expensesByCategory
        if (data.expensesByCategory && Array.isArray(data.expensesByCategory)) {
            console.log('   🔍 Primer gasto por categoría (antes de filtrar):', data.expensesByCategory[0]);
            const originalLength = data.expensesByCategory.length;
            data.expensesByCategory = data.expensesByCategory.filter(expense => {
                const match = String(expense.usuario_id) === String(userId);
                return match;
            });
            console.log(`   📊 Gastos por categoría filtrados: ${data.expensesByCategory.length} de ${originalLength}`);
        }

        // RECALCULAR estadísticas solo con los datos del usuario
        console.log('   🔄 Recalculando estadísticas solo para el usuario...');
        
        // Necesitamos cargar TODOS los gastos del usuario para recalcular
        // Por ahora, vamos a usar los datos filtrados que tenemos
        if (data.expensesByMonth && data.expensesByMonth.length > 0) {
            // Recalcular total_amount
            const totalAmount = data.expensesByMonth.reduce((sum, expense) => {
                return sum + (parseFloat(expense.monto) || 0);
            }, 0);
            
            // Recalcular combustible
            const totalFuel = data.expensesByMonth
                .filter(e => e.tipo === 'combustible')
                .reduce((sum, e) => sum + (parseFloat(e.litros) || 0), 0);
            
            // Contar gastos por estado
            const gastosAprobados = data.expensesByMonth.filter(e => e.estado === 'aprobado').length;
            const gastosNegados = data.expensesByMonth.filter(e => e.estado === 'rechazado' || e.estado === 'negado').length;
            const gastosPendientes = data.expensesByMonth.filter(e => e.estado === 'pendiente').length;
            
            // Calcular montos por estado
            const montoAprobados = data.expensesByMonth
                .filter(e => e.estado === 'aprobado')
                .reduce((sum, e) => sum + (parseFloat(e.monto) || 0), 0);
            
            const montoRechazados = data.expensesByMonth
                .filter(e => e.estado === 'rechazado' || e.estado === 'negado')
                .reduce((sum, e) => sum + (parseFloat(e.monto) || 0), 0);
            
            // Calcular promedio
            const promedioGasto = data.expensesByMonth.length > 0 ? totalAmount / data.expensesByMonth.length : 0;
            
            // Actualizar data.expenses con los valores recalculados
            if (!data.expenses) data.expenses = {};
            
            data.expenses.total_amount = totalAmount;
            data.expenses.total_fuel = totalFuel;
            data.expenses.gastos_aprobados = gastosAprobados;
            data.expenses.gastos_negados = gastosNegados;
            data.expenses.gastos_pendientes = gastosPendientes;
            data.expenses.monto_aprobados = montoAprobados;
            data.expenses.monto_rechazados = montoRechazados;
            data.expenses.promedio_gasto = promedioGasto;
            
            console.log('   ✅ Estadísticas recalculadas para el usuario:', {
                total_amount: totalAmount,
                total_fuel: totalFuel,
                gastos_aprobados: gastosAprobados,
                gastos_negados: gastosNegados,
                gastos_pendientes: gastosPendientes,
                monto_aprobados: montoAprobados,
                monto_rechazados: montoRechazados,
                promedio_gasto: promedioGasto
            });
        } else {
            console.log('   ⚠️ No hay gastos para este usuario, estableciendo valores en 0');
            if (!data.expenses) data.expenses = {};
            data.expenses.total_amount = 0;
            data.expenses.total_fuel = 0;
            data.expenses.gastos_aprobados = 0;
            data.expenses.gastos_negados = 0;
            data.expenses.gastos_pendientes = 0;
            data.expenses.monto_aprobados = 0;
            data.expenses.monto_rechazados = 0;
            data.expenses.promedio_gasto = 0;
        }

        return data;
    }

    async loadData() {
        // Evitar cargas duplicadas
        if (this.isLoading) {
            console.log('📊 Dashboard ya está cargando, saltando...');
            return;
        }

        try {
            console.log('📊 Cargando datos del dashboard...');
            console.log('👤 Usuario actual:', window.app?.currentUser);
            this.isLoading = true;
            
            // LIMPIAR datos anteriores antes de cargar nuevos
            this.data = {
                expenses: {},
                vehicles: {},
                viajes: {},
                recentActivity: []
            };
            
            // Mostrar indicador de carga
            this.showLoadingState();
            
            // Cargar datos de gastos y vehículos con cache busting
            console.log('🔄 Llamando a dashboard API...');
            const timestamp = Date.now();
            const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
            const dashboardResponse = await fetch(`${apiPath}/dashboard/data_no_filter.php?v=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            console.log('📊 Dashboard response status:', dashboardResponse.status);
            
            if (!dashboardResponse.ok) {
                throw new Error(`Dashboard API error: ${dashboardResponse.status}`);
            }
            
            let dashboardData = await dashboardResponse.json();
            console.log('📊 Dashboard data received (raw):', dashboardData);
            
            // Obtener rol del usuario
            const currentUser = window.app?.currentUser;
            const userId = currentUser?.id;
            const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
            const isAdminOrSupervisor = userRole === 'admin' || userRole === 'administrador' || userRole === 'supervisor';
            
            // Si es transportista, cargar y calcular sus propios datos
            if (!isAdminOrSupervisor) {
                console.log('🚛 Transportista detectado - Cargando datos individuales...');
                dashboardData = await this.loadUserSpecificData(userId, dashboardData);
            } else {
                console.log('👨‍💼 Admin/Supervisor - Usando datos globales');
            }
            
            console.log('📊 Dashboard data (processed):', dashboardData);
            console.log('💰 Gastos totales:', dashboardData.expenses?.total_amount);
            console.log('✅ Gastos aprobados:', dashboardData.expenses?.monto_aprobados);
            console.log('❌ Gastos rechazados:', dashboardData.expenses?.monto_rechazados);
            this.data = dashboardData;
            
            // Cargar datos de viajes
            console.log('🚛 Cargando datos de viajes...');
            let viajesData = [];
            try {
                const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
                const viajesResponse = await fetch(`${apiPath}/viajes/list.php`);
                console.log('🚛 Viajes response status:', viajesResponse.status);
                
                if (!viajesResponse.ok) {
                    throw new Error(`Viajes API error: ${viajesResponse.status}`);
                }
                
                viajesData = await viajesResponse.json();
                console.log('🚛 Respuesta de viajes (sin filtrar):', viajesData);
                
                // FILTRAR VIAJES PARA TRANSPORTISTAS
                if (!isAdminOrSupervisor && Array.isArray(viajesData)) {
                    const userName = currentUser?.nombre || currentUser?.name;
                    console.log('🚛 Filtrando viajes para transportista:', userName, 'ID:', userId);
                    
                    viajesData = viajesData.filter(viaje => {
                        // Comparar por ID (más confiable)
                        const matchById = viaje.transportista_id && 
                                         String(viaje.transportista_id) === String(userId);
                        
                        // Comparar por nombre (fallback)
                        const matchByName = viaje.transportista_nombre === userName;
                        
                        const match = matchById || matchByName;
                        
                        if (match) {
                            console.log('✅ Viaje incluido:', viaje.id, viaje.origen_estado || viaje.origen, '→', viaje.destino_estado || viaje.destino);
                        }
                        
                        return match;
                    });
                    
                    console.log('🚛 Viajes filtrados para transportista:', viajesData.length);
                }
                
                this.data.todayTrips = Array.isArray(viajesData) ? viajesData.slice(0, 5) : [];
            } catch (error) {
                console.error('❌ Error cargando viajes:', error);
                this.data.todayTrips = [];
                viajesData = [];
            }
            
            // Cargar actividad reciente (últimos 5 gastos)
            console.log('📋 Cargando gastos recientes...');
            let recentGastos = [];
            try {
                const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
                const gastosResponse = await fetch(`${apiPath}/gastos/list.php`);
                console.log('📋 Gastos response status:', gastosResponse.status);
                
                if (!gastosResponse.ok) {
                    throw new Error(`Gastos API error: ${gastosResponse.status}`);
                }
                
                const gastosData = await gastosResponse.json();
                console.log('📋 Respuesta de gastos:', gastosData);
                
                // La API devuelve directamente el array de gastos
                let allGastos = [];
                if (Array.isArray(gastosData)) {
                    allGastos = gastosData;
                } else if (gastosData && gastosData.gastos && Array.isArray(gastosData.gastos)) {
                    allGastos = gastosData.gastos;
                }
                
                // Filtrar gastos según el rol
                const currentUser = window.app?.currentUser;
                const userId = currentUser?.id;
                const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
                const isAdminOrSupervisor = userRole === 'admin' || userRole === 'administrador' || userRole === 'supervisor';
                
                if (!isAdminOrSupervisor) {
                    // Transportista: solo sus gastos
                    allGastos = allGastos.filter(g => String(g.usuario_id) === String(userId));
                    console.log('🚛 Gastos filtrados para transportista:', allGastos.length);
                }
                
                recentGastos = allGastos.slice(0, 5);
                console.log('📋 Gastos recientes procesados:', recentGastos.length, 'gastos');
            } catch (error) {
                console.error('❌ Error cargando gastos:', error);
                recentGastos = [];
            }
            
            // Procesar datos de viajes
            // La API devuelve directamente el array de viajes
            let viajesArray = [];
            if (Array.isArray(viajesData)) {
                viajesArray = viajesData;
            } else if (viajesData && viajesData.error) {
                console.error('❌ Error en API de viajes:', viajesData.error);
                viajesArray = [];
            } else {
                console.warn('⚠️ Formato inesperado de datos de viajes:', viajesData);
                viajesArray = [];
            }
            
            console.log('🚛 Array de viajes procesado:', viajesArray.length, 'viajes');
            if (viajesArray.length > 0) {
                console.log('🚛 Primer viaje:', viajesArray[0]);
                console.log('🚛 Estados encontrados:', [...new Set(viajesArray.map(v => v.estado))]);
            }
            
            const viajesStats = this.processViajesData(viajesArray);
            console.log('🚛 Estadísticas calculadas:', viajesStats);
            
            // Combinar todos los datos
            this.data = {
                ...dashboardData,
                viajes: viajesStats,
                recentActivity: recentGastos
            };
            
            console.log('📊 Datos cargados:', this.data);
            
            this.updateUI();
            this.updateViajesStats();
            this.updateTodayTrips(viajesArray);
            // Ocultar indicador de carga
            this.hideLoadingState();
            this.isLoading = false;
            
        } catch (error) {
            console.error('❌ Error general cargando dashboard:', error);
            console.error('❌ Stack trace:', error.stack);
            
            // Mostrar información detallada del error
            let errorMessage = 'Error al cargar datos del dashboard';
            if (error.message.includes('404')) {
                errorMessage += ' - API no encontrada (404)';
            } else if (error.message.includes('500')) {
                errorMessage += ' - Error del servidor (500)';
            } else if (error.message.includes('fetch')) {
                errorMessage += ' - Error de conexión';
            }
            
            window.app.showToast(errorMessage + ': ' + error.message, 'danger');
            
            // Inicializar con datos vacíos para evitar errores
            this.data = {
                expenses: { total_amount: 0, total_fuel: 0, change_percentage: 0 },
                vehicles: { maintenance_count: 0, maintenance_change: 0 },
                viajes: { viajes_pendientes: 0, viajes_en_progreso: 0, viajes_completados: 0, viajes_cancelados: 0 },
                recentActivity: [],
                todayTrips: []
            };
            
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // Mostrar estado de carga
    showLoadingState() {
        // Mostrar spinners en las cards
        const cards = document.querySelectorAll('.stat-card .stat-value');
        cards.forEach(card => {
            card.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
        });

        // Mostrar spinner en la tabla de actividad reciente
        const activityTable = document.getElementById('activityTable');
        if (activityTable) {
            activityTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando datos...</span>
                        </div>
                        <div class="mt-2 text-muted">Cargando actividad reciente...</div>
                    </td>
                </tr>
            `;
        }
    }

    // Ocultar estado de carga
    hideLoadingState() {
        // Los datos se actualizarán automáticamente en updateUI()
    }

    // Mostrar mensaje de error
    showErrorMessage(message) {
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, 'error');
        } else {
            console.error('📊 Dashboard Error:', message);
        }
    }

    // Procesar datos de viajes para estadísticas
    processViajesData(viajes) {
        console.log('🔄 Procesando', viajes.length, 'viajes para estadísticas...');
        
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
            total_viajes: viajes.length,
            viajes_pendientes: 0,
            viajes_en_progreso: 0,
            viajes_completados: 0,
            viajes_cancelados: 0,
            completados_hoy: 0
        };

        viajes.forEach((viaje, index) => {
            console.log(`🚛 Viaje ${index + 1}:`, {
                id: viaje.id,
                estado: viaje.estado,
                transportista: viaje.transportista_nombre,
                fecha_completado: viaje.fecha_completado
            });
            
            switch(viaje.estado) {
                case 'pendiente':
                    stats.viajes_pendientes++;
                    break;
                case 'en_progreso':
                case 'en_ruta': // Agregar variación de estado
                    stats.viajes_en_progreso++;
                    break;
                case 'completado':
                    stats.viajes_completados++;
                    // Verificar si se completó hoy
                    if (viaje.fecha_completado && viaje.fecha_completado.startsWith(today)) {
                        stats.completados_hoy++;
                    }
                    break;
                case 'cancelado':
                    stats.viajes_cancelados++;
                    break;
                default:
                    console.warn('⚠️ Estado de viaje no reconocido:', viaje.estado);
            }
        });

        console.log('📊 Estadísticas finales de viajes:', stats);
        return stats;
    }

    // Actualizar tabla de viajes de hoy
    updateTodayTrips(viajes) {
        console.log('📅 Actualizando viajes de hoy...');
        
        const container = document.getElementById('todayTripsContainer');
        if (!container) {
            console.warn('⚠️ Contenedor todayTripsContainer no encontrado');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Mostrar máximo 5 viajes de la base de datos
        let todayTrips = viajes; // Usar todos los viajes de la BD
        
        console.log('📅 Viajes de la base de datos:', todayTrips);
        
        // Solo mostrar datos reales de la base de datos, limitado a 5
        if (!todayTrips || todayTrips.length === 0) {
            console.log('📅 No hay viajes en la base de datos');
            todayTrips = [];
        } else {
            // Limitar a máximo 5 viajes
            todayTrips = todayTrips.slice(0, 5);
            console.log('📅 Mostrando', todayTrips.length, 'viajes de la base de datos (máximo 5)');
        }

        console.log('📅 Viajes de hoy encontrados:', todayTrips.length);

        // Determinar el título según el rol del usuario
        const userRole = window.app?.currentUser?.role || 'transportista';
        const titleText = userRole === 'transportista' ? '🚛 Mis Viajes' : '🚛 Todos los Viajes';
        
        // Actualizar el título
        const titleElement = document.querySelector('#todayTripsContainer').closest('.card').querySelector('.card-title');
        if (titleElement) {
            titleElement.textContent = titleText;
        }

        if (todayTrips.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                    <h6 class="text-muted">No hay viajes registrados</h6>
                    <p class="text-muted small">Los viajes aparecerán aquí cuando sean creados</p>
                </div>
            `;
            return;
        }

        // Crear tabla de viajes
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Viaje</th>
                            <th>Ruta</th>
                            <th>Transportista</th>
                            <th>Vehículo</th>
                            <th>Estado</th>
                            <th>Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${todayTrips.map(viaje => this.renderTodayTripRow(viaje)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Generate mobile cards for today trips
        this.updateMobileTodayTripsCards(todayTrips);
    }

    updateMobileTodayTripsCards(todayTrips) {
        const mobileView = document.querySelector('#mobileTodayTripsView');
        if (!mobileView) return;

        if (!todayTrips || todayTrips.length === 0) {
            mobileView.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                    <h5>No hay viajes</h5>
                    <p class="text-muted">No se encontraron viajes en la base de datos</p>
                </div>
            `;
            return;
        }

        mobileView.innerHTML = todayTrips.map(viaje => {
            const estadoBadge = this.getEstadoBadgeClass(viaje.estado);
            const estadoTexto = this.getEstadoTexto(viaje.estado);
            
            // Manejar diferentes campos de fecha de la BD
            let hora = '--:--';
            if (viaje.fecha_creacion) {
                hora = new Date(viaje.fecha_creacion).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else if (viaje.hora_programada) {
                hora = viaje.hora_programada;
            }

            return `
                <div class="mobile-expense-card">
                    <div class="mobile-expense-header">
                        <div>
                            <div class="mobile-expense-amount">${viaje.origen || 
                                (viaje.origen_estado && viaje.origen_municipio ? `${viaje.origen_estado}, ${viaje.origen_municipio}` : '') ||
                                viaje.origen_estado || 
                                viaje.origen_municipio || 
                                'Sin origen'}</div>
                            <div class="mobile-expense-date">→ ${viaje.destino || 
                                (viaje.destino_estado && viaje.destino_municipio ? `${viaje.destino_estado}, ${viaje.destino_municipio}` : '') ||
                                viaje.destino_estado || 
                                viaje.destino_municipio || 
                                'Sin destino'}</div>
                        </div>
                        <span class="badge bg-${estadoBadge}">
                            ${this.getEstadoIcon(viaje.estado)} ${estadoTexto}
                        </span>
                    </div>
                    <div class="row mb-2">
                        <div class="col-6">
                            <small class="text-muted">Transportista:</small><br>
                            <strong>${viaje.transportista_nombre || viaje.usuario_nombre || 'Sin asignar'}</strong>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Vehículo:</small><br>
                            <strong>🚚 ${viaje.vehiculo_placa || 'Sin vehículo'}</strong>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">Fecha:</small><br>
                            <strong>${viaje.fecha_programada ? new Date(viaje.fecha_programada).toLocaleDateString() : 'Sin fecha'}</strong>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Hora:</small><br>
                            <strong>${hora}</strong>
                        </div>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="showSection('viajesSection')">
                            <i class="fas fa-eye"></i> Ver Todos
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Renderizar fila de viaje de hoy
    renderTodayTripRow(viaje) {
        // Debug: mostrar datos del viaje
        console.log('🚛 Renderizando viaje:', {
            id: viaje.id,
            origen: viaje.origen,
            destino: viaje.destino,
            origen_estado: viaje.origen_estado,
            origen_municipio: viaje.origen_municipio,
            destino_estado: viaje.destino_estado,
            destino_municipio: viaje.destino_municipio,
            transportista_nombre: viaje.transportista_nombre,
            vehiculo_placa: viaje.vehiculo_placa
        });
        
        const estadoBadge = this.getEstadoBadgeClass(viaje.estado);
        const estadoTexto = this.getEstadoTexto(viaje.estado);
        
        // Manejar diferentes campos de fecha de la BD
        let hora = '--:--';
        if (viaje.fecha_creacion) {
            hora = new Date(viaje.fecha_creacion).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
        } else if (viaje.fecha_programada && viaje.hora_programada) {
            hora = viaje.hora_programada.substring(0, 5); // HH:MM
        } else if (viaje.created_at) {
            hora = new Date(viaje.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
        }
        
        // Manejar diferentes campos de origen/destino de la BD
        const origen = viaje.origen || 
                      (viaje.origen_estado && viaje.origen_municipio ? `${viaje.origen_estado}, ${viaje.origen_municipio}` : '') ||
                      viaje.origen_estado || 
                      viaje.origen_municipio || 
                      'Sin origen';
        const destino = viaje.destino || 
                       (viaje.destino_estado && viaje.destino_municipio ? `${viaje.destino_estado}, ${viaje.destino_municipio}` : '') ||
                       viaje.destino_estado || 
                       viaje.destino_municipio || 
                       'Sin destino';

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-size: 12px; font-weight: bold;">
                            #${viaje.id}
                        </div>
                        <div>
                            <div class="fw-bold">${viaje.numero_viaje || `Viaje #${viaje.id}`}</div>
                            <small class="text-muted">${viaje.descripcion || viaje.observaciones || 'Sin descripción'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>
                        <div class="fw-bold text-success">📍 ${origen}</div>
                        <div class="text-muted">🏁 ${destino}</div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-user-tie text-primary me-2"></i>
                        ${viaje.transportista_nombre || 'No asignado'}
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-truck text-secondary me-2"></i>
                        <div>
                            <div class="fw-bold">${viaje.vehiculo_placa || 'Sin vehículo'}</div>
                            <small class="text-muted">${viaje.vehiculo_marca || ''} ${viaje.vehiculo_modelo || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${estadoBadge}">
                        ${this.getEstadoIcon(viaje.estado)}
                        ${estadoTexto}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-clock text-muted me-2"></i>
                        ${hora}
                    </div>
                </td>
            </tr>
        `;
    }

    // Funciones auxiliares para estados de viajes
    getEstadoBadgeClass(estado) {
        const classes = {
            'pendiente': 'bg-warning text-dark',      // Amarillo
            'completado': 'bg-success',               // Verde
            'en_ruta': 'bg-info',                     // Azul cielo
            'en_progreso': 'bg-info',                 // Azul cielo (alias para en_ruta)
            'cancelado': 'bg-danger'                  // Rojo
        };
        return classes[estado] || 'bg-secondary';
    }

    getEstadoTexto(estado) {
        const textos = {
            'pendiente': 'Pendiente',
            'en_progreso': 'En Progreso',
            'en_ruta': 'En Ruta',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return textos[estado] || estado;
    }

    getEstadoIcon(estado) {
        const iconos = {
            'pendiente': '<i class="fas fa-clock me-1"></i>',
            'en_progreso': '<i class="fas fa-play me-1"></i>',
            'en_ruta': '<i class="fas fa-route me-1"></i>',
            'completado': '<i class="fas fa-check me-1"></i>',
            'cancelado': '<i class="fas fa-times me-1"></i>'
        };
        return iconos[estado] || '<i class="fas fa-question me-1"></i>';
    }

    // Crear gráfica de gastos por categoría
    createExpenseChart() {
        const ctx = document.getElementById('expenseChart');
        if (!ctx || !this.data || !this.data.expensesByCategory) return;

        // Destruir gráfica existente si existe
        if (this.expenseChartInstance) {
            this.expenseChartInstance.destroy();
        }

        const categories = this.data.expensesByCategory;
        const labels = Object.keys(categories);
        const values = Object.values(categories);

        // Si no hay datos, mostrar mensaje
        if (labels.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            const context = ctx.getContext('2d');
            context.font = '16px Arial';
            context.fillStyle = '#6c757d';
            context.textAlign = 'center';
            context.fillText('No hay datos de gastos', ctx.width / 2, ctx.height / 2);
            return;
        }

        const colors = {
            'combustible': '#28a745',
            'mantenimiento': '#ffc107', 
            'peajes': '#17a2b8',
            'multas': '#dc3545',
            'hospedaje': '#6c757d',
            'comida': '#007bff',
            'otros': '#343a40'
        };

        this.expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => {
                    const icons = {
                        'combustible': '⛽ Combustible',
                        'mantenimiento': '🔧 Mantenimiento',
                        'peajes': '🛣️ Peajes',
                        'multas': '🚨 Multas',
                        'hospedaje': '🏨 Hospedaje',
                        'comida': '🍴 Comida',
                        'otros': '📦 Otros'
                    };
                    return icons[label] || label;
                }),
                datasets: [{
                    data: values,
                    backgroundColor: labels.map(label => colors[label] || '#6c757d'),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Crear gráfica de estado de rutas/viajes
    createViajesChart() {
        const ctx = document.getElementById('routesChart');
        if (!ctx || !this.data || !this.data.viajes) return;

        // Destruir gráfica existente si existe
        if (this.viajesChartInstance) {
            this.viajesChartInstance.destroy();
        }

        const viajes = this.data.viajes;
        const labels = ['Pendientes', 'En Progreso', 'Completados', 'Cancelados'];
        const values = [
            viajes.viajes_pendientes || 0,
            viajes.viajes_en_progreso || 0, 
            viajes.viajes_completados || 0,
            viajes.viajes_cancelados || 0
        ];

        // Si no hay datos, mostrar mensaje
        if (values.every(v => v === 0)) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            const context = ctx.getContext('2d');
            context.font = '16px Arial';
            context.fillStyle = '#6c757d';
            context.textAlign = 'center';
            context.fillText('No hay datos de viajes', ctx.width / 2, ctx.height / 2);
            return;
        }

        this.viajesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#ffc107', '#17a2b8', '#28a745', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} viajes (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Función para ver todos los gastos
    viewAllExpenses() {
        console.log('📊 Redirigiendo a la pestaña de gastos...');
        if (typeof showSection === 'function') {
            showSection('gastosSection');
        } else if (window.showSection) {
            window.showSection('gastosSection');
        } else {
            console.error('❌ Función showSection no disponible');
        }
    }

    updateUI() {
        this.updateStatsCards();
        this.updateDetailedStats(); // Nueva función para estadísticas detalladas
        this.updateRecentActivity();
        this.updateChart();
    }

    updateStatsCards() {
        const { expenses, vehicles, viajes } = this.data;
        
        // Update expense stats
        if (expenses) {
            // Gastos Totales del Mes - Actualizar valor y cambio
            const gastosElement = document.querySelector('[data-stat="gastos-totales"]');
            if (gastosElement) {
                gastosElement.textContent = `$${expenses.total_amount?.toLocaleString() || '0'}`;
                // Actualizar el texto de cambio
                const gastosCard = gastosElement.closest('.stat-card');
                const changeEl = gastosCard?.querySelector('.stat-change');
                if (changeEl) {
                    const change = expenses.change_percentage || 0;
                    const isPositive = change >= 0;
                    changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'} mt-2`;
                    changeEl.innerHTML = `<i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(change)}% vs mes anterior`;
                }
            }

            this.updateStatCard(1, {
                value: `${expenses.total_fuel?.toLocaleString() || '0'} L`,
                label: 'Combustible Consumido',
                change: expenses.fuel_change || 0
            });
        }

        // Update gastos stats
        if (expenses) {
            console.log('📊 Actualizando estadísticas de gastos:', {
                aprobados: expenses.gastos_aprobados,
                negados: expenses.gastos_negados,
                pendientes: expenses.gastos_pendientes,
                monto_aprobados: expenses.monto_aprobados,
                monto_rechazados: expenses.monto_rechazados,
                promedio: expenses.promedio_gasto,
                total: expenses.total_amount
            });
            
            // Gastos Aprobados - Actualizar valor y cambio
            const aprobadosElement = document.querySelector('[data-stat="gastos-aprobados"]');
            if (aprobadosElement) {
                aprobadosElement.textContent = expenses.gastos_aprobados || '0';
                console.log('✅ Gastos aprobados actualizados:', expenses.gastos_aprobados);
                // Actualizar el texto de cambio
                const aprobadosCard = aprobadosElement.closest('.stat-card');
                const changeEl = aprobadosCard?.querySelector('.stat-change');
                if (changeEl) {
                    changeEl.className = 'stat-change positive mt-2';
                    changeEl.innerHTML = `<i class="fas fa-check-circle"></i> Total aprobados`;
                }
            }
            
            // Gastos Negados - Actualizar valor y cambio
            const negadosElement = document.querySelector('[data-stat="gastos-negados"]');
            if (negadosElement) {
                negadosElement.textContent = expenses.gastos_negados || '0';
                console.log('❌ Gastos negados actualizados:', expenses.gastos_negados);
                // Actualizar el texto de cambio
                const negadosCard = negadosElement.closest('.stat-card');
                const changeEl = negadosCard?.querySelector('.stat-change');
                if (changeEl) {
                    changeEl.className = 'stat-change negative mt-2';
                    changeEl.innerHTML = `<i class="fas fa-times-circle"></i> Total rechazados`;
                }
            }
        }

        // Update rutas activas stats (solo admin y supervisor)
        const currentUser = window.app?.currentUser;
        const userRole = currentUser?.rol || currentUser?.role || 'transportista';
        const isAdminOrSupervisor = userRole.toLowerCase() === 'administrador' || 
                                   userRole.toLowerCase() === 'admin' || 
                                   userRole.toLowerCase() === 'supervisor';
        
        console.log('🔍 Debug roles:', { currentUser, userRole, isAdminOrSupervisor, viajes });
        
        // TEMPORAL: Mostrar siempre las tarjetas para debug
        if (viajes) {
            // Mostrar las cards de rutas activas
            const pendientesCard = document.getElementById('pendientes-card');
            const enRutaCard = document.getElementById('en-ruta-card');
            const completadosCard = document.getElementById('completados-card');
            const canceladosCard = document.getElementById('cancelados-card');
            
            if (pendientesCard) pendientesCard.style.display = 'block';
            if (enRutaCard) enRutaCard.style.display = 'block';
            if (completadosCard) completadosCard.style.display = 'block';
            if (canceladosCard) canceladosCard.style.display = 'block';

            // Actualizar valores de las cards
            this.updateStatValue('viajes-pendientes', viajes.viajes_pendientes || 0);
            this.updateStatValue('viajes-en-progreso', viajes.viajes_en_progreso || 0);
            this.updateStatValue('viajes-completados', viajes.viajes_completados || 0);
            this.updateStatValue('viajes-cancelados', viajes.viajes_cancelados || 0);
            
            console.log('📊 Estadísticas de viajes actualizadas:', {
                pendientes: viajes.viajes_pendientes || 0,
                en_progreso: viajes.viajes_en_progreso || 0,
                completados: viajes.viajes_completados || 0,
                cancelados: viajes.viajes_cancelados || 0
            });
        } else {
            // Ocultar las cards para transportistas
            const pendientesCard = document.getElementById('pendientes-card');
            const enRutaCard = document.getElementById('en-ruta-card');
            const completadosCard = document.getElementById('completados-card');
            const canceladosCard = document.getElementById('cancelados-card');
            
            if (pendientesCard) pendientesCard.style.display = 'none';
            if (enRutaCard) enRutaCard.style.display = 'none';
            if (completadosCard) completadosCard.style.display = 'none';
            if (canceladosCard) canceladosCard.style.display = 'none';
        }
    }

    updateStatCard(index, data) {
        const cards = document.querySelectorAll('.stat-card');
        if (cards[index]) {
            const valueEl = cards[index].querySelector('.stat-value');
            const labelEl = cards[index].querySelector('.stat-label');
            const changeEl = cards[index].querySelector('.stat-change');
            
            if (valueEl) valueEl.textContent = data.value;
            if (labelEl) labelEl.textContent = data.label;
            if (changeEl && data.change !== undefined) {
                // Si es un número, mostrar como porcentaje
                if (typeof data.change === 'number') {
                    const isPositive = data.change >= 0;
                    changeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'} mt-2`;
                    changeEl.innerHTML = `<i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(data.change)}% vs mes anterior`;
                } else {
                    // Si es texto, mostrar como está
                    changeEl.className = 'stat-change neutral mt-2';
                    changeEl.innerHTML = `<i class="fas fa-info-circle"></i> ${data.change}`;
                }
            }
        }
    }

    updateStatValue(statKey, value) {
        const element = document.querySelector(`[data-stat="${statKey}"]`);
        if (element) {
            element.textContent = value.toLocaleString();
        }
    }

    updateDetailedStats() {
        const { expenses } = this.data;
        
        if (!expenses) {
            console.log('⚠️ No hay datos de expenses para estadísticas detalladas');
            return;
        }

        // Obtener rol del usuario
        const currentUser = window.app?.currentUser;
        const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
        const isAdminOrSupervisor = userRole === 'admin' || userRole === 'administrador' || userRole === 'supervisor';

        console.log('🔄 Actualizando estadísticas detalladas:', {
            rol: userRole,
            isAdminOrSupervisor,
            monto_aprobados: expenses.monto_aprobados,
            monto_rechazados: expenses.monto_rechazados,
            gastos_pendientes: expenses.gastos_pendientes,
            promedio_gasto: expenses.promedio_gasto
        });
        
        // Buscar las tarjetas a ocultar/mostrar
        const montoAprobadosCard = document.querySelector('[data-stat="monto-gastos-aprobados"]')?.closest('.col-md-3, .col-lg-3, .col-xl-3, .col-sm-6, .col-6, .col-12');
        const montoRechazadosCard = document.querySelector('[data-stat="monto-gastos-rechazados"]')?.closest('.col-md-3, .col-lg-3, .col-xl-3, .col-sm-6, .col-6, .col-12');
        const cantidadPendientesCard = document.querySelector('[data-stat="cantidad-gastos-pendientes"]')?.closest('.col-md-3, .col-lg-3, .col-xl-3, .col-sm-6, .col-6, .col-12');
        
        if (!isAdminOrSupervisor) {
            // TRANSPORTISTA: Ocultar estadísticas de aprobación/rechazo/pendientes
            console.log('🚛 Transportista: Ocultando estadísticas de aprobación/rechazo/pendientes');
            
            if (montoAprobadosCard) {
                montoAprobadosCard.style.display = 'none';
                console.log('   ❌ Ocultando: Monto Gastos Aprobados');
            }
            if (montoRechazadosCard) {
                montoRechazadosCard.style.display = 'none';
                console.log('   ❌ Ocultando: Monto Gastos Rechazados');
            }
            if (cantidadPendientesCard) {
                cantidadPendientesCard.style.display = 'none';
                console.log('   ❌ Ocultando: Gastos Pendientes');
            }
            
            // Promedio Gastos (visible para todos)
            const promedioElement = document.querySelector('[data-stat="promedio-gastos"]');
            if (promedioElement) {
                promedioElement.textContent = `$${Math.round(expenses.promedio_gasto || 0).toLocaleString()}`;
                console.log('📊 Promedio gastos actualizado:', expenses.promedio_gasto);
            }
            return; // Salir para transportistas
        }
        
        // ADMIN/SUPERVISOR: Mostrar y actualizar todas las estadísticas
        console.log('👨‍💼 Admin/Supervisor: Mostrando todas las estadísticas');
        
        if (montoAprobadosCard) montoAprobadosCard.style.display = '';
        if (montoRechazadosCard) montoRechazadosCard.style.display = '';
        if (cantidadPendientesCard) cantidadPendientesCard.style.display = '';
        
        // Monto Gastos Aprobados
        const montoAprobadosElement = document.querySelector('[data-stat="monto-gastos-aprobados"]');
        if (montoAprobadosElement) {
            montoAprobadosElement.textContent = `$${expenses.monto_aprobados?.toLocaleString() || '0'}`;
            console.log('💰 Monto aprobados actualizado:', expenses.monto_aprobados);
        } else {
            console.log('❌ Elemento monto-gastos-aprobados no encontrado');
        }
        
        // Monto Gastos Rechazados
        const montoRechazadosElement = document.querySelector('[data-stat="monto-gastos-rechazados"]');
        if (montoRechazadosElement) {
            montoRechazadosElement.textContent = `$${expenses.monto_rechazados?.toLocaleString() || '0'}`;
            console.log('💸 Monto rechazados actualizado:', expenses.monto_rechazados);
        } else {
            console.log('❌ Elemento monto-gastos-rechazados no encontrado');
        }
        
        // Cantidad Gastos Pendientes
        const cantidadPendientesElement = document.querySelector('[data-stat="cantidad-gastos-pendientes"]');
        if (cantidadPendientesElement) {
            cantidadPendientesElement.textContent = expenses.gastos_pendientes || '0';
            console.log('⏳ Gastos pendientes actualizado:', expenses.gastos_pendientes);
        } else {
            console.log('❌ Elemento cantidad-gastos-pendientes no encontrado');
        }
        
        // Promedio Gastos
        const promedioElement = document.querySelector('[data-stat="promedio-gastos"]');
        if (promedioElement) {
            promedioElement.textContent = `$${Math.round(expenses.promedio_gasto || 0).toLocaleString()}`;
            console.log('📊 Promedio gastos actualizado:', expenses.promedio_gasto);
        } else {
            console.log('❌ Elemento promedio-gastos no encontrado');
        }
    }

    updateRecentActivity() {
        const tbody = document.getElementById('activityTable');
        if (!tbody) return;

        if (!this.data.recentActivity || this.data.recentActivity.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        No hay actividad reciente
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.recentActivity.map(gasto => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-calendar-alt text-muted me-2"></i>
                        ${this.formatDate(gasto.fecha)}
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-user text-primary me-2"></i>
                        ${gasto.usuario_nombre || 'N/A'}
                    </div>
                </td>
                <td>
                    <span class="badge bg-${this.getTypeColor(gasto.tipo)} d-flex align-items-center">
                        ${this.getTypeIcon(gasto.tipo)}
                        ${this.getTypeLabel(gasto.tipo)}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-dollar-sign text-success me-2"></i>
                        <strong>$${parseFloat(gasto.monto || 0).toLocaleString()}</strong>
                    </div>
                </td>
                <td>
                    <span class="badge bg-${this.getStatusColor(gasto.estado)}">
                        ${this.getStatusIcon(gasto.estado)}
                        ${this.getStatusLabel(gasto.estado)}
                    </span>
                </td>
            </tr>
        `).join('');
        
        // Generate mobile cards for activity
        this.updateMobileActivityCards();
    }

    updateMobileActivityCards() {
        const mobileView = document.querySelector('#mobileActivityView');
        if (!mobileView) return;

        if (!this.data.recentActivity || this.data.recentActivity.length === 0) {
            mobileView.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5>No hay actividad reciente</h5>
                    <p class="text-muted">No se encontró actividad reciente</p>
                </div>
            `;
            return;
        }

        mobileView.innerHTML = this.data.recentActivity.map(gasto => `
            <div class="mobile-expense-card">
                <div class="mobile-expense-header">
                    <div>
                        <div class="mobile-expense-amount">$${parseFloat(gasto.monto || 0).toLocaleString()}</div>
                        <div class="mobile-expense-date">${this.formatDate(gasto.fecha)}</div>
                    </div>
                    <span class="badge bg-${this.getStatusColor(gasto.estado)}">
                        ${this.getStatusIcon(gasto.estado)} ${this.getStatusLabel(gasto.estado)}
                    </span>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <small class="text-muted">Transportista:</small><br>
                        <strong>${gasto.usuario_nombre || 'N/A'}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Tipo:</small><br>
                        <span class="badge bg-${this.getTypeColor(gasto.tipo)}">
                            ${this.getTypeIcon(gasto.tipo)} ${this.getTypeLabel(gasto.tipo)}
                        </span>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <small class="text-muted">Vehículo:</small><br>
                        <strong>${gasto.vehiculo_placa || 'N/A'}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Factura:</small><br>
                        <strong>${gasto.numero_factura || 'N/A'}</strong>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async updateChart() {
        // Cargar Chart.js si no está disponible
        if (!window.Chart) {
            try {
                console.log('📦 Cargando Chart.js para gráficas...');
                await window.loadChartJS();
            } catch (error) {
                console.error('❌ Error cargando Chart.js:', error);
                return;
            }
        }
        
        // Crear las gráficas
        this.createExpenseChart();
        this.createViajesChart();
        this.createMonthlyExpensesChart();
    }

    createExpenseChart() {
        const ctx = document.getElementById('expenseChart');
        if (!ctx || !this.data?.expensesByCategory) return;

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        // Also destroy any existing Chart.js instance on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        const data = this.data.expensesByCategory;
        console.log('📊 Datos para gráfica de categorías:', data);
        
        // Verificar si es array u objeto
        let labels, values;
        if (Array.isArray(data)) {
            // Si es array (datos filtrados del usuario)
            labels = data.map(item => {
                const tipo = item.tipo || 'otros';
                const labelMap = {
                    'combustible': '⛽ Combustible',
                    'mantenimiento': '🔧 Mantenimiento',
                    'peajes': '🛣️ Peajes',
                    'peaje': '🛣️ Peaje',
                    'multas': '🚨 Multas',
                    'multa': '🚨 Multa',
                    'hospedaje': '🏨 Hospedaje',
                    'alimentacion': '🍴 Alimentación',
                    'comida': '🍽️ Comida',
                    'transporte': '🚛 Transporte',
                    'otros': '📦 Otros'
                };
                return labelMap[tipo] || `📋 ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
            });
            values = data.map(item => item.monto || 0);
        } else {
            // Si es objeto (datos globales)
            labels = Object.keys(data).map(key => {
            const labelMap = {
                'combustible': '⛽ Combustible',
                'mantenimiento': '🔧 Mantenimiento',
                'peajes': '🛣️ Peajes',
                'peaje': '🛣️ Peaje',
                'multas': '🚨 Multas',
                'multa': '🚨 Multa',
                'hospedaje': '🏨 Hospedaje',
                'alimentacion': '🍴 Alimentación',
                'comida': '🍽️ Comida',
                'transporte': '🚛 Transporte',
                    'otros': '📦 Otros',
                    'viaticos': '💼 Viáticos',
                    'casetas': '🛣️ Casetas'
                };
                return labelMap[key] || `📋 ${key.charAt(0).toUpperCase() + key.slice(1)}`;
            });
            values = Object.values(data);
        }
        
        console.log('📊 Labels:', labels);
        console.log('📊 Values:', values);

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#FF9F40',
                        '#4BC0C0',
                        '#9966FF'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createViajesChart() {
        const ctx = document.getElementById('routesChart');
        if (!ctx || !this.data?.viajes) return;

        // Destroy existing chart if it exists
        if (this.viajesChart) {
            this.viajesChart.destroy();
            this.viajesChart = null;
        }

        // Also destroy any existing Chart.js instance on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        const viajes = this.data.viajes;
        
        // Si no hay datos de viajes, mostrar mensaje
        if (!viajes || (viajes.total_viajes === 0)) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            const parent = ctx.parentElement;
            parent.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100"><p class="text-muted">No hay datos de viajes</p></div>';
            return;
        }

        const data = {
            labels: ['Pendientes', 'En Progreso', 'Completados', 'Cancelados'],
            datasets: [{
                data: [
                    viajes.viajes_pendientes || 0,
                    viajes.viajes_en_progreso || 0,
                    viajes.viajes_completados || 0,
                    viajes.viajes_cancelados || 0
                ],
                backgroundColor: [
                    '#ffc107', // Amarillo para pendientes
                    '#0d6efd', // Azul para en progreso
                    '#198754', // Verde para completados
                    '#dc3545'  // Rojo para cancelados
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        this.viajesChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} viajes (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
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
            'combustible': 'Combustible',
            'mantenimiento': 'Mantenimiento',
            'peaje': 'Peajes',
            'peajes': 'Peajes',
            'multa': 'Multas',
            'multas': 'Multas',
            'hospedaje': 'Hospedaje',
            'comida': 'Alimentación',
            'alimentacion': 'Alimentación',
            'otros': 'Otros',
            'otro': 'Otros'
        };
        return labels[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
    }

    getTypeIcon(type) {
        const icons = {
            'combustible': '<i class="fas fa-gas-pump me-1"></i>',
            'mantenimiento': '<i class="fas fa-wrench me-1"></i>',
            'peaje': '<i class="fas fa-road me-1"></i>',
            'multa': '<i class="fas fa-exclamation-triangle me-1"></i>',
            'hospedaje': '<i class="fas fa-bed me-1"></i>',
            'comida': '<i class="fas fa-utensils me-1"></i>',
            'otros': '<i class="fas fa-box me-1"></i>'
        };
        return icons[type] || '<i class="fas fa-circle me-1"></i>';
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

    getStatusIcon(status) {
        const icons = {
            'pendiente': '<i class="fas fa-clock me-1"></i>',
            'aprobado': '<i class="fas fa-check me-1"></i>',
            'rechazado': '<i class="fas fa-times me-1"></i>'
        };
        return icons[status] || '<i class="fas fa-question me-1"></i>';
    }

    // Función para ver todos los gastos
    viewAllExpenses() {
        console.log('📋 Navegando a la sección de gastos...');
        
        // Usar la función global de navegación
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('gastosSection', 'Gestión de Gastos');
        } else if (typeof window.showSection === 'function') {
            window.showSection('gastosSection');
        } else {
            // Fallback manual
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            const gastosSection = document.getElementById('gastosSection');
            if (gastosSection) {
                gastosSection.classList.add('active');
            }
            
            // Actualizar navegación
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const gastosNavLink = document.querySelector('[onclick*="gastosSection"]');
            if (gastosNavLink) {
                gastosNavLink.classList.add('active');
            }
        }
        
        // Mostrar toast informativo
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('Navegando a la sección de gastos...', 'info');
        }
    }

    static viewExpense(id) {
        // Open expense details modal
        window.app.showToast('Cargando detalles del gasto...', 'info');
        // Implementation for viewing expense details
    }

    static editExpense(id) {
        // Open expense edit modal
        if (window.GastosManager) {
            window.GastosManager.editExpense(id);
        }
    }

    static deleteExpense(id) {
        // Usar modal personalizado en lugar de confirm nativo
        window.app.showConfirmModal(
            '🗑️ Eliminar Gasto',
            '¿Estás seguro de que deseas eliminar este gasto?',
            'Eliminar',
            'danger',
            () => {
                // Implementation for deleting expense
                window.app.showToast('Gasto eliminado correctamente', 'success');
            }
        );
    }

    async exportReports() {
        try {
            window.app.showToast('📊 Generando reportes...', 'info');
            
            // Simulate report generation
            setTimeout(() => {
                window.app.showToast('✅ Reportes generados exitosamente', 'success');
                
                // Create download link
                const link = document.createElement('a');
                link.href = '#';
                link.download = `reporte-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
                link.click();
            }, 2000);
            
        } catch (error) {
            window.app.showToast('Error al generar reportes: ' + error.message, 'danger');
        }
    }

    // Actualizar estadísticas de viajes
    updateViajesStats() {
        if (!this.data.viajes) return;

        const viajes = this.data.viajes;
        
        // Buscar elementos en el dashboard para mostrar estadísticas de viajes
        const totalViajesEl = document.querySelector('[data-stat="total-viajes"]');
        const pendientesEl = document.querySelector('[data-stat="viajes-pendientes"]');
        const progresoEl = document.querySelector('[data-stat="viajes-progreso"]');
        const completadosEl = document.querySelector('[data-stat="viajes-completados"]');

        if (totalViajesEl) totalViajesEl.textContent = viajes.total_viajes || 0;
        if (pendientesEl) pendientesEl.textContent = viajes.viajes_pendientes || 0;
        if (progresoEl) progresoEl.textContent = viajes.viajes_en_progreso || 0;
        if (completadosEl) completadosEl.textContent = viajes.viajes_completados || 0;

        console.log('📊 Estadísticas de viajes actualizadas:', {
            total: viajes.total_viajes,
            pendientes: viajes.viajes_pendientes,
            progreso: viajes.viajes_en_progreso,
            completados: viajes.viajes_completados
        });
    }

    // Crear gráfica de viajes
    createViajesChart() {
        const canvas = document.getElementById('routesChart');
        if (!canvas || !this.data.viajes) return;

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfica anterior si existe
        if (this.viajesChart) {
            this.viajesChart.destroy();
            this.viajesChart = null;
        }

        // También destruir cualquier instancia existente de Chart.js en este canvas
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        const viajes = this.data.viajes;
        
        this.viajesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['🟡 Pendientes', '🔵 En Ruta', '🟢 Completados', '🔴 Cancelados'],
                datasets: [{
                    data: [
                        viajes.viajes_pendientes || 0,
                        viajes.viajes_en_progreso || 0,
                        viajes.viajes_completados || 0,
                        viajes.viajes_cancelados || 0
                    ],
                    backgroundColor: [
                        '#ffc107', // Amarillo para pendientes
                        '#007bff', // Azul para en ruta
                        '#28a745', // Verde para completados
                        '#dc3545'  // Rojo para cancelados
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                return `${context.label}: ${value} viajes (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createMonthlyExpensesChart() {
        const ctx = document.getElementById('monthlyExpensesChart');
        if (!ctx || !this.data?.monthlyExpenses) {
            console.log('❌ No hay canvas o datos para gráfica mensual:', {
                canvas: !!ctx,
                data: !!this.data?.monthlyExpenses,
                monthlyData: this.data?.monthlyExpenses
            });
            return;
        }

        // Destroy existing chart if it exists
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
            this.monthlyChart = null;
        }

        // Also destroy any existing Chart.js instance on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        const monthlyData = this.data.monthlyExpenses;
        console.log('📊 Datos mensuales recibidos:', monthlyData);
        
        // Si no hay datos, mostrar mensaje
        if (!monthlyData || monthlyData.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            const parent = ctx.parentElement;
            parent.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100"><p class="text-muted">No hay datos de gastos por mes</p></div>';
            return;
        }

        // Procesar datos para la gráfica
        const processedData = this.processMonthlyData(monthlyData);

        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: processedData.labels,
                datasets: processedData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Mes'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Monto ($)'
                        },
                        stacked: true,
                        beginAtZero: true
                    }
                },
                elements: {
                    line: {
                        tension: 0.4,
                        fill: true
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    processMonthlyData(monthlyData) {
        // Obtener todos los meses únicos
        const monthsSet = new Set();
        const typesSet = new Set();
        
        monthlyData.forEach(item => {
            const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
            monthsSet.add(monthKey);
            typesSet.add(item.tipo);
        });

        const months = Array.from(monthsSet).sort();
        const types = Array.from(typesSet);

        // Crear labels de meses en español
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const labels = months.map(monthKey => {
            const [year, month] = monthKey.split('-');
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        });

        // Colores para cada tipo de gasto
        const colors = {
            'combustible': 'rgba(220, 53, 69, 0.8)',      // Rojo
            'mantenimiento': 'rgba(13, 110, 253, 0.8)',   // Azul
            'peaje': 'rgba(255, 193, 7, 0.8)',            // Amarillo
            'peajes': 'rgba(255, 193, 7, 0.8)',           // Amarillo
            'multa': 'rgba(108, 117, 125, 0.8)',          // Gris
            'multas': 'rgba(108, 117, 125, 0.8)',         // Gris
            'hospedaje': 'rgba(111, 66, 193, 0.8)',       // Púrpura
            'comida': 'rgba(25, 135, 84, 0.8)',           // Verde
            'alimentacion': 'rgba(25, 135, 84, 0.8)',     // Verde
            'otros': 'rgba(253, 126, 20, 0.8)',           // Naranja
            'otro': 'rgba(253, 126, 20, 0.8)'             // Naranja
        };

        // Crear datasets para cada tipo
        const datasets = types.map(tipo => {
            const data = months.map(monthKey => {
                const [year, month] = monthKey.split('-');
                const item = monthlyData.find(d => 
                    d.year == year && 
                    d.month == parseInt(month) && 
                    d.tipo === tipo
                );
                return item ? parseFloat(item.total) : 0;
            });

            return {
                label: this.getTypeLabel(tipo),
                data: data,
                borderColor: colors[tipo] || 'rgba(75, 192, 192, 0.8)',
                backgroundColor: colors[tipo] || 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            };
        });

        return { labels, datasets };
    }

    // Funciones de actualización en tiempo real
    startAutoRefresh() {
        console.log('🔄 Iniciando actualización automática cada', this.refreshRate / 1000, 'segundos');
        
        // Limpiar intervalo anterior si existe
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Iniciar nuevo intervalo
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, this.refreshRate);
        
        // Mostrar indicador de auto-refresh en el dashboard
        this.showAutoRefreshIndicator();
    }

    stopAutoRefresh() {
        console.log('⏹️ Deteniendo actualización automática');
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.hideAutoRefreshIndicator();
    }

    async refreshData() {
        // Solo actualizar si no hay una carga en progreso
        if (this.isLoading) {
            console.log('⏭️ Saltando actualización - carga en progreso');
            return;
        }

        try {
            console.log('🔄 Actualizando datos automáticamente...');
            
            // Mostrar indicador sutil de actualización
            this.showRefreshingIndicator();
            
            // Cargar datos sin mostrar el loading completo
            await this.loadDataSilent();
            
            console.log('✅ Datos actualizados automáticamente');
            
        } catch (error) {
            console.error('❌ Error en actualización automática:', error);
        } finally {
            this.hideRefreshingIndicator();
        }
    }

    async loadDataSilent() {
        // Versión silenciosa de loadData() sin mostrar loading states
        try {
            this.isLoading = true;
            
            // Cargar datos del dashboard (usando API simplificada temporalmente)
            const apiPath = window.APP_CONFIG ? window.APP_CONFIG.apiPath : 'api';
            const dashboardResponse = await fetch(`${apiPath}/dashboard/data_no_filter.php?v=${Date.now()}`);
            if (!dashboardResponse.ok) {
                throw new Error(`Dashboard API error: ${dashboardResponse.status}`);
            }
            const dashboardData = await dashboardResponse.json();

            // Cargar datos de viajes
            const viajesResponse = await fetch(`${apiPath}/viajes/list.php`);
            let viajesArray = [];
            let viajesStats = { total_viajes: 0, viajes_pendientes: 0, viajes_en_progreso: 0, viajes_completados: 0 };
            
            if (viajesResponse.ok) {
                const viajesData = await viajesResponse.json();
                viajesArray = Array.isArray(viajesData) ? viajesData : (viajesData.data || []);
                
                // Calcular estadísticas de viajes
                viajesStats = {
                    total_viajes: viajesArray.length,
                    viajes_pendientes: viajesArray.filter(v => v.estado === 'pendiente').length,
                    viajes_en_progreso: viajesArray.filter(v => v.estado === 'en_progreso').length,
                    viajes_completados: viajesArray.filter(v => v.estado === 'completado').length
                };
            }

            // Cargar gastos recientes
            const gastosResponse = await fetch(`${apiPath}/gastos/list.php`);
            let recentGastos = [];
            if (gastosResponse.ok) {
                const gastosData = await gastosResponse.json();
                recentGastos = Array.isArray(gastosData) ? gastosData.slice(0, 10) : (gastosData.data || []).slice(0, 10);
            }
            // Combinar todos los datos
            this.data = {
                ...dashboardData,
                viajes: viajesStats,
                recentActivity: recentGastos
            };
            
            // Actualizar UI incluyendo gráficas
            this.updateStatsCards();
            this.updateDetailedStats(); // Nueva función para estadísticas detalladas
            this.updateRecentActivity();
            this.updateViajesStats();
            this.updateTodayTrips(viajesArray);
            this.updateChart(); // Actualizar gráficas también
            
            this.isLoading = false;
            
        } catch (error) {
            console.error('❌ Error en carga silenciosa:', error);
            this.isLoading = false;
        }
    }

    showAutoRefreshIndicator() {
        // Agregar indicador visual de auto-refresh
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle && !pageTitle.querySelector('.auto-refresh-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'auto-refresh-indicator badge bg-success ms-2';
            indicator.innerHTML = '<i class="fas fa-sync-alt"></i> Auto';
            indicator.title = 'Actualización automática activa (cada 30s)';
            pageTitle.appendChild(indicator);
        }
    }

    hideAutoRefreshIndicator() {
        const indicator = document.querySelector('.auto-refresh-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showRefreshingIndicator() {
        const indicator = document.querySelector('.auto-refresh-indicator');
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            indicator.className = 'auto-refresh-indicator badge bg-primary ms-2';
        }
    }

    hideRefreshingIndicator() {
        const indicator = document.querySelector('.auto-refresh-indicator');
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-sync-alt"></i> Auto';
            indicator.className = 'auto-refresh-indicator badge bg-success ms-2';
        }
    }

    // Método para cambiar la frecuencia de actualización
    setRefreshRate(seconds) {
        this.refreshRate = seconds * 1000;
        console.log('⚙️ Frecuencia de actualización cambiada a', seconds, 'segundos');
        
        // Reiniciar con nueva frecuencia
        if (this.refreshInterval) {
            this.stopAutoRefresh();
            this.startAutoRefresh();
        }
    }
}

// Initialize Dashboard Manager
window.DashboardManager = new DashboardManager();
