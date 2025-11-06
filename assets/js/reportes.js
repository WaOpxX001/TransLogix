// Reportes Manager - 📈 Reports functionality
class ReportesManager {
    constructor() {
        this.reportData = null;
        this.currentReport = null;
        this.dataLoaded = false; // Flag para evitar cargas múltiples
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        // NO cargar transportistas automáticamente - se cargará cuando se navegue a la sección
    }

    setupEventListeners() {
        // Auto-generar reporte cuando cambie el tipo
        const reportTypeSelect = document.getElementById('reportType');
        if (reportTypeSelect) {
            reportTypeSelect.addEventListener('change', () => this.autoGenerateReport());
        }

        // Auto-generar reporte cuando cambie el período
        const reportPeriodSelect = document.getElementById('reportPeriod');
        if (reportPeriodSelect) {
            reportPeriodSelect.addEventListener('change', () => {
                this.handlePeriodChange();
                this.autoGenerateReport();
            });
        }

        // Auto-generar reporte cuando cambie el transportista
        const transportistaSelect = document.getElementById('reportTransportista');
        if (transportistaSelect) {
            transportistaSelect.addEventListener('change', () => this.autoGenerateReport());
        }

        // Auto-generar reporte cuando cambien las fechas
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', () => this.autoGenerateReport());
        }
        if (endDateInput) {
            endDateInput.addEventListener('change', () => this.autoGenerateReport());
        }
    }

    handlePeriodChange() {
        const period = document.getElementById('reportPeriod')?.value;
        const customDateRange = document.getElementById('customDateRange');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (period === 'custom') {
            // Mostrar campos de fecha personalizados
            if (customDateRange) customDateRange.style.display = 'flex';
        } else {
            // Ocultar campos y calcular fechas automáticamente
            if (customDateRange) customDateRange.style.display = 'none';
            
            const today = new Date();
            let startDate, endDate;
            
            switch(period) {
                case 'weekly':
                    // Última semana (7 días)
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    endDate = today;
                    break;
                    
                case 'monthly':
                    // Mes actual
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    endDate = today;
                    break;
                    
                case 'annual':
                    // Año actual
                    startDate = new Date(today.getFullYear(), 0, 1);
                    endDate = today;
                    break;
            }
            
            if (startDateInput) startDateInput.value = startDate.toISOString().split('T')[0];
            if (endDateInput) endDateInput.value = endDate.toISOString().split('T')[0];
        }
    }

    async loadTransportistas() {
        try {
            console.log('📊 Cargando transportistas...');
            const response = await window.app.apiCall('/LogisticaFinal/api/transportistas/list.php');
            console.log('📊 Respuesta de API:', response);
            
            let transportistas = [];
            
            if (Array.isArray(response)) {
                transportistas = response;
            } else if (response && response.transportistas) {
                transportistas = response.transportistas;
            } else if (response && response.data) {
                transportistas = response.data;
            }
            
            console.log('📊 Transportistas procesados:', transportistas);
            console.log('📊 Total transportistas:', transportistas.length);
            
            // Actualizar dropdown
            const select = document.getElementById('reportTransportista');
            if (!select) {
                console.error('❌ No se encontró el select reportTransportista');
                return;
            }
            
            if (transportistas.length > 0) {
                select.innerHTML = '<option value="all">👥 Todos los Transportistas</option>' +
                    transportistas.map(t => {
                        const nombre = t.nombre || t.name || `Transportista #${t.id}`;
                        console.log(`   - ${nombre} (ID: ${t.id})`);
                        return `<option value="${t.id}">🚛 ${nombre}</option>`;
                    }).join('');
                console.log('✅ Dropdown actualizado con', transportistas.length, 'transportistas');
            } else {
                console.warn('⚠️ No se encontraron transportistas');
                select.innerHTML = '<option value="all">👥 Todos los Transportistas</option><option disabled>No hay transportistas registrados</option>';
            }
            
        } catch (error) {
            console.error('❌ Error cargando transportistas:', error);
            console.error('❌ Stack:', error.stack);
        }
    }

    setDefaultDates() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) startDateInput.value = firstDay.toISOString().split('T')[0];
        if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    }

    async loadData(forceReload = false) {
        // Evitar cargas múltiples innecesarias
        if (this.dataLoaded && !forceReload) {
            console.log('📊 Datos de reportes ya inicializados');
            return;
        }
        
        console.log('📊 ReportesManager.loadData() called');
        
        // Cargar transportistas primero
        await this.loadTransportistas();
        
        // Inicializar período por defecto
        this.handlePeriodChange();
        
        this.dataLoaded = true;
        
        // Generar reporte inicial con fechas por defecto
        setTimeout(() => {
            console.log('📊 Calling autoGenerateReport after timeout');
            this.autoGenerateReport();
        }, 500);
    }

    autoGenerateReport() {
        // Debounce para evitar múltiples llamadas
        clearTimeout(this.reportTimeout);
        this.reportTimeout = setTimeout(() => {
            this.generateReport();
        }, 300);
    }

    async generateReport() {
        console.log('📊 generateReport() called');
        const reportType = document.getElementById('reportType')?.value;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        const transportistaId = document.getElementById('reportTransportista')?.value;
        const period = document.getElementById('reportPeriod')?.value;
        const subFilter = document.getElementById('reportSubFilter')?.value;

        console.log('📊 Report params:', { reportType, startDate, endDate, transportistaId, period, subFilter });

        if (!reportType || !startDate || !endDate) {
            console.log('📊 Missing parameters, skipping report generation');
            return;
        }

        this.currentReport = { type: reportType, startDate, endDate, transportistaId, period, subFilter };

        try {
            window.app.showToast('📊 Generando reporte...', 'info');
            
            // Construir URL con parámetros
            let url = `/LogisticaFinal/api/reportes/${reportType}.php?start=${startDate}&end=${endDate}`;
            
            // Agregar filtro de transportista si no es "all"
            if (transportistaId && transportistaId !== 'all') {
                url += `&transportista_id=${transportistaId}`;
            }
            
            // Agregar subfiltro si no es "all"
            if (subFilter && subFilter !== 'all') {
                if (reportType === 'gastos') {
                    url += `&tipo=${subFilter}`;
                } else if (reportType === 'viajes') {
                    url += `&estado=${subFilter}`;
                }
            }
            
            console.log('📊 Request URL:', url);
            
            // Llamar a la API correspondiente
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            this.reportData = await response.json();
            console.log('📊 Report data received:', this.reportData);
            console.log('📊 Data length:', this.reportData?.data?.length || 0);
            console.log('📊 Stats:', this.reportData?.stats);
            
            // Verificar si hay datos
            if (!this.reportData || !this.reportData.data) {
                console.warn('⚠️ No data in response');
                this.reportData = { data: [], stats: {} };
            }
            
            // APLICAR FILTROS EN FRONTEND (por si el backend no los aplica)
            if (subFilter && subFilter !== 'all') {
                console.log('🔍 Aplicando filtro en frontend:', subFilter);
                console.log('📊 Tipo de reporte:', reportType);
                const originalLength = this.reportData.data.length;
                
                if (reportType === 'gastos') {
                    // Filtrar por tipo de gasto
                    console.log('💰 Filtrando gastos por tipo:', subFilter);
                    
                    // Mostrar algunos ejemplos de datos antes del filtro
                    if (this.reportData.data.length > 0) {
                        console.log('📋 Ejemplo de datos antes del filtro:', this.reportData.data.slice(0, 3).map(item => ({
                            tipo: item.tipo,
                            monto: item.monto
                        })));
                    }
                    
                    this.reportData.data = this.reportData.data.filter(item => {
                        const itemTipo = (item.tipo || '').toLowerCase();
                        const matches = itemTipo === subFilter.toLowerCase();
                        if (!matches) {
                            console.log(`   ❌ Excluido: ${item.tipo} (buscando: ${subFilter})`);
                        }
                        return matches;
                    });
                    
                } else if (reportType === 'viajes') {
                    // Filtrar por estado de viaje
                    console.log('🚛 Filtrando viajes por estado:', subFilter);
                    
                    // Mostrar algunos ejemplos de datos antes del filtro
                    if (this.reportData.data.length > 0) {
                        console.log('📋 Ejemplo de datos antes del filtro:', this.reportData.data.slice(0, 3).map(item => ({
                            estado: item.estado,
                            origen: item.origen,
                            destino: item.destino
                        })));
                    }
                    
                    this.reportData.data = this.reportData.data.filter(item => {
                        const itemEstado = (item.estado || '').toLowerCase();
                        const matches = itemEstado === subFilter.toLowerCase();
                        if (!matches) {
                            console.log(`   ❌ Excluido: ${item.estado} (buscando: ${subFilter})`);
                        }
                        return matches;
                    });
                }
                
                console.log(`✅ Filtrado completado: ${originalLength} → ${this.reportData.data.length} registros`);
                
                // Mostrar algunos ejemplos de datos después del filtro
                if (this.reportData.data.length > 0) {
                    console.log('📋 Ejemplo de datos después del filtro:', this.reportData.data.slice(0, 3));
                }
                
                // Recalcular estadísticas después del filtrado
                this.reportData.stats = this.recalculateStats(this.reportData.data, reportType);
                console.log('📊 Estadísticas recalculadas:', this.reportData.stats);
            } else {
                console.log('ℹ️ Sin subfiltro aplicado (mostrando todos los datos)');
            }
            
            // Mostrar el reporte
            console.log('📊 Calling displayReport()');
            this.displayReport();
            
            window.app.showToast('✅ Reporte generado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error generating report:', error);
            window.app.showToast('❌ Error al generar el reporte: ' + error.message, 'danger');
            
            // Mostrar mensaje de error en el preview
            const previewDiv = document.getElementById('reportPreview');
            if (previewDiv) {
                previewDiv.innerHTML = `
                    <div class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                        <h5>Error al generar el reporte</h5>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    }

    filterByTransportista(reportData, transportistaId) {
        console.log('🔍 Filtrando datos por transportista:', transportistaId);
        
        if (!reportData || !reportData.data) return reportData;
        
        const filteredData = reportData.data.filter(item => {
            // Para gastos: usuario_id
            // Para viajes: transportista_id o usuario_id
            const itemUserId = item.usuario_id || item.transportista_id;
            return String(itemUserId) === String(transportistaId);
        });
        
        console.log(`📊 Datos filtrados: ${filteredData.length} de ${reportData.data.length}`);
        
        // Recalcular estadísticas
        const stats = this.recalculateStats(filteredData, this.currentReport.type);
        
        return {
            ...reportData,
            data: filteredData,
            stats: stats
        };
    }

    recalculateStats(data, reportType) {
        if (reportType === 'gastos') {
            const totalMonto = data.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0);
            const combustibleLitros = data
                .filter(item => item.tipo === 'combustible')
                .reduce((sum, item) => sum + (parseFloat(item.litros) || 0), 0);
            
            return {
                total_monto: totalMonto,
                promedio_gasto: data.length > 0 ? totalMonto / data.length : 0,
                combustible_litros: combustibleLitros,
                total_registros: data.length
            };
        } else if (reportType === 'viajes') {
            return {
                total: data.length,
                completados: data.filter(v => v.estado === 'completado').length,
                en_progreso: data.filter(v => v.estado === 'en_progreso' || v.estado === 'en_ruta').length,
                pendientes: data.filter(v => v.estado === 'pendiente').length,
                cancelados: data.filter(v => v.estado === 'cancelado').length
            };
        }
        
        return {};
    }

    displayReport() {
        console.log('📊 displayReport() called');
        const previewDiv = document.getElementById('reportPreview');
        console.log('📊 previewDiv found:', !!previewDiv);
        
        if (!previewDiv) {
            console.error('📊 ERROR: reportPreview element not found!');
            return;
        }

        let previewHtml = '';
        console.log('📊 Report type:', this.currentReport.type);
        
        switch (this.currentReport.type) {
            case 'gastos':
                console.log('📊 Generating expenses preview');
                previewHtml = this.generateExpensesPreview();
                break;
            case 'viajes':
                console.log('📊 Generating trips preview');
                previewHtml = this.generateTripsPreview();
                break;
            default:
                console.log('📊 Generating generic preview');
                previewHtml = this.generateGenericPreview();
        }

        console.log('📊 Generated HTML length:', previewHtml.length);
        console.log('📊 Setting innerHTML...');
        previewDiv.innerHTML = previewHtml;
        console.log('📊 innerHTML set successfully');
    }

    generateExpensesPreview() {
        if (!this.reportData || !this.reportData.data || this.reportData.data.length === 0) {
            return `
                <div class="text-center">
                    <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                    <h5>No hay datos</h5>
                    <p>No se encontraron gastos en el período seleccionado</p>
                </div>
            `;
        }

        const { data, stats } = this.reportData;
        const transportistaId = this.currentReport.transportistaId;
        const period = this.currentReport.period;
        
        // Obtener nombre del transportista si está filtrado
        let transportistaInfo = '';
        if (transportistaId && transportistaId !== 'all') {
            const select = document.getElementById('reportTransportista');
            const selectedOption = select?.options[select.selectedIndex];
            const transportistaNombre = selectedOption?.text || 'Transportista';
            transportistaInfo = `<span class="badge bg-info ms-2">${transportistaNombre}</span>`;
        }
        
        // Obtener nombre del período
        const periodNames = {
            'custom': 'Personalizado',
            'weekly': 'Semanal',
            'monthly': 'Mensual',
            'annual': 'Anual'
        };
        const periodName = periodNames[period] || 'Personalizado';

        return `
            <div class="report-preview">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="mb-0">📊 Reporte de Gastos ${transportistaInfo}</h5>
                        <small class="text-muted">Período: ${periodName} (${this.currentReport.startDate} - ${this.currentReport.endDate})</small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-success btn-sm" onclick="window.ReportesManagerInstance.downloadReport('csv')">
                            <i class="fas fa-file-csv"></i> CSV
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="window.ReportesManagerInstance.downloadReport('pdf')">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Total Gastos</h6>
                                <h4 class="text-primary">$${stats.total_monto?.toLocaleString() || '0'}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Número de Registros</h6>
                                <h4 class="text-info">${data.length}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Promedio por Gasto</h6>
                                <h4 class="text-warning">$${stats.promedio_gasto?.toLocaleString() || '0'}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Combustible</h6>
                                <h4 class="text-success">${stats.combustible_litros || '0'} L</h4>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Usuario</th>
                                <th>Vehículo</th>
                                <th>Monto</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 10).map(expense => `
                                <tr>
                                    <td>${new Date(expense.fecha).toLocaleDateString()}</td>
                                    <td><span class="badge bg-secondary">${expense.tipo}</span></td>
                                    <td>${expense.usuario_nombre || 'N/A'}</td>
                                    <td>${(() => {
                                        // Construir información del vehículo
                                        const marca = expense.vehiculo_marca || expense.marca || '';
                                        const modelo = expense.vehiculo_modelo || expense.modelo || '';
                                        const placa = expense.vehiculo_placa || expense.placa || '';
                                        
                                        if (!marca && !modelo && !placa) return 'N/A';
                                        
                                        return `<div class="d-flex flex-column">
                                            ${marca && modelo ? `<span class="fw-bold">${marca} ${modelo}</span>` : ''}
                                            ${placa ? `<small class="text-muted">${placa}</small>` : ''}
                                        </div>`;
                                    })()}</td>
                                    <td class="fw-bold">$${parseFloat(expense.monto).toFixed(2)}</td>
                                    <td><span class="badge bg-${this.getStatusColor(expense.estado)}">${expense.estado}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${data.length > 10 ? `<p class="text-muted text-center">Mostrando 10 de ${data.length} registros</p>` : ''}
                </div>
            </div>
        `;
    }

    generateTripsPreview() {
        if (!this.reportData || !this.reportData.data || this.reportData.data.length === 0) {
            return `
                <div class="text-center">
                    <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                    <h5>No hay datos</h5>
                    <p>No se encontraron viajes en el período seleccionado</p>
                </div>
            `;
        }

        const { data, stats } = this.reportData;
        const transportistaId = this.currentReport.transportistaId;
        const period = this.currentReport.period;
        
        // Obtener nombre del transportista si está filtrado
        let transportistaInfo = '';
        if (transportistaId && transportistaId !== 'all') {
            const select = document.getElementById('reportTransportista');
            const selectedOption = select?.options[select.selectedIndex];
            const transportistaNombre = selectedOption?.text || 'Transportista';
            transportistaInfo = `<span class="badge bg-info ms-2">${transportistaNombre}</span>`;
        }
        
        // Obtener nombre del período
        const periodNames = {
            'custom': 'Personalizado',
            'weekly': 'Semanal',
            'monthly': 'Mensual',
            'annual': 'Anual'
        };
        const periodName = periodNames[period] || 'Personalizado';

        return `
            <div class="report-preview">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="mb-0">🚛 Reporte de Viajes ${transportistaInfo}</h5>
                        <small class="text-muted">Período: ${periodName} (${this.currentReport.startDate} - ${this.currentReport.endDate})</small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-success btn-sm" onclick="window.ReportesManagerInstance.downloadReport('csv')">
                            <i class="fas fa-file-csv"></i> CSV
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="window.ReportesManagerInstance.downloadReport('pdf')">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Total Viajes</h6>
                                <h4 class="text-primary">${stats.total || 0}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Completados</h6>
                                <h4 class="text-success">${stats.completados || 0}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>En Progreso</h6>
                                <h4 class="text-info">${stats.en_progreso || 0}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Pendientes</h6>
                                <h4 class="text-warning">${stats.pendientes || 0}</h4>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Transportista</th>
                                <th>Vehículo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 10).map(trip => {
                                // Construir información del vehículo
                                let vehiculoInfo = 'N/A';
                                if (trip.vehiculo_placa || trip.vehiculo_marca || trip.vehiculo_modelo) {
                                    const marca = trip.vehiculo_marca || trip.marca || '';
                                    const modelo = trip.vehiculo_modelo || trip.modelo || '';
                                    const placa = trip.vehiculo_placa || trip.placa || '';
                                    
                                    vehiculoInfo = `
                                        <div class="d-flex flex-column">
                                            ${marca && modelo ? `<span class="fw-bold">${marca} ${modelo}</span>` : ''}
                                            ${placa ? `<small class="text-muted">${placa}</small>` : ''}
                                        </div>
                                    `;
                                }
                                
                                return `
                                    <tr>
                                        <td>${trip.id}</td>
                                        <td>${trip.origen}</td>
                                        <td>${trip.destino}</td>
                                        <td>${new Date(trip.fecha_programada).toLocaleDateString()}</td>
                                        <td><span class="badge bg-${this.getStatusColor(trip.estado)}">${this.getStatusLabel(trip.estado)}</span></td>
                                        <td>${trip.transportista_nombre || 'N/A'}</td>
                                        <td>${vehiculoInfo}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    ${data.length > 10 ? `<p class="text-muted text-center">Mostrando 10 de ${data.length} registros</p>` : ''}
                </div>
            </div>
        `;
    }

    generateGenericPreview() {
        return `
            <div class="text-center">
                <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                <h5>Selecciona un tipo de reporte</h5>
                <p>Elige el tipo de reporte que deseas generar</p>
            </div>
        `;
    }

    async downloadReport(format) {
        if (!this.currentReport) {
            window.app.showToast('No hay reporte para descargar', 'warning');
            return;
        }

        const { type, startDate, endDate, transportistaId } = this.currentReport;
        
        try {
            window.app.showToast(`📥 Generando reporte en formato ${format.toUpperCase()}...`, 'info');
            
            if (format === 'pdf') {
                await this.generatePDFReport();
            } else if (format === 'csv') {
                this.generateCSVReport();
            }
            
        } catch (error) {
            console.error('Error downloading report:', error);
            window.app.showToast('Error al descargar el reporte', 'danger');
        }
    }

    async generatePDFReport() {
        const { type, startDate, endDate, transportistaId } = this.currentReport;
        const data = this.reportData.data || [];
        const stats = this.reportData.stats || {};
        
        try {
            window.app.showToast('📄 Generando PDF...', 'info');
            
            // Esperar a que jsPDF esté disponible
            if (typeof window.jspdf === 'undefined') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Configuración
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let yPos = margin;
            
            // Título
            doc.setFontSize(20);
            doc.setTextColor(0, 123, 255);
            const title = type === 'gastos' ? 'Reporte de Gastos' : 'Reporte de Viajes';
            doc.text(title, pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;
            
            // Período
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Período: ${startDate} - ${endDate}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;
            
            // Estadísticas
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            if (type === 'gastos') {
                const boxWidth = (pageWidth - 2 * margin - 15) / 4;
                const boxHeight = 25;
                const startX = margin;
                
                // Caja 1: Total
                doc.setFillColor(248, 249, 250);
                doc.rect(startX, yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(0, 123, 255);
                doc.text(`$${stats.total_monto?.toLocaleString() || '0'}`, startX + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Total de Gastos', startX + boxWidth / 2, yPos + 18, { align: 'center' });
                
                // Caja 2: Registros
                doc.setFillColor(248, 249, 250);
                doc.rect(startX + boxWidth + 5, yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(0, 123, 255);
                doc.text(`${data.length}`, startX + boxWidth + 5 + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Registros', startX + boxWidth + 5 + boxWidth / 2, yPos + 18, { align: 'center' });
                
                // Caja 3: Promedio
                doc.setFillColor(248, 249, 250);
                doc.rect(startX + 2 * (boxWidth + 5), yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(0, 123, 255);
                doc.text(`$${stats.promedio_gasto?.toLocaleString() || '0'}`, startX + 2 * (boxWidth + 5) + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Promedio', startX + 2 * (boxWidth + 5) + boxWidth / 2, yPos + 18, { align: 'center' });
                
                // Caja 4: Combustible
                doc.setFillColor(248, 249, 250);
                doc.rect(startX + 3 * (boxWidth + 5), yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(0, 123, 255);
                doc.text(`${stats.combustible_litros || '0'} L`, startX + 3 * (boxWidth + 5) + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Combustible', startX + 3 * (boxWidth + 5) + boxWidth / 2, yPos + 18, { align: 'center' });
                
                yPos += boxHeight + 15;
                
                // Tabla de gastos
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Detalle de Gastos', margin, yPos);
                yPos += 8;
                
                // Encabezados de tabla
                doc.setFillColor(0, 123, 255);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.text('Fecha', margin + 2, yPos + 5);
                doc.text('Tipo', margin + 25, yPos + 5);
                doc.text('Usuario', margin + 50, yPos + 5);
                doc.text('Vehículo', margin + 90, yPos + 5);
                doc.text('Monto', margin + 125, yPos + 5);
                doc.text('Estado', margin + 155, yPos + 5);
                yPos += 8;
                
                // Datos
                doc.setTextColor(0, 0, 0);
                let rowCount = 0;
                for (const gasto of data) {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    
                    if (rowCount % 2 === 0) {
                        doc.setFillColor(248, 249, 250);
                        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
                    }
                    
                    doc.setFontSize(7);
                    doc.text(new Date(gasto.fecha).toLocaleDateString(), margin + 2, yPos + 5);
                    doc.text(gasto.tipo || '', margin + 25, yPos + 5);
                    doc.text((gasto.usuario_nombre || 'N/A').substring(0, 20), margin + 50, yPos + 5);
                    doc.text((gasto.vehiculo_placa || 'N/A').substring(0, 15), margin + 90, yPos + 5);
                    doc.text(`$${parseFloat(gasto.monto).toFixed(2)}`, margin + 125, yPos + 5);
                    doc.text(gasto.estado || '', margin + 155, yPos + 5);
                    
                    yPos += 7;
                    rowCount++;
                }
                
            } else {
                // Viajes - Similar estructura
                const boxWidth = (pageWidth - 2 * margin - 15) / 4;
                const boxHeight = 25;
                const startX = margin;
                
                // Cajas de estadísticas
                doc.setFillColor(248, 249, 250);
                doc.rect(startX, yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(0, 123, 255);
                doc.text(`${stats.total || 0}`, startX + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Total Viajes', startX + boxWidth / 2, yPos + 18, { align: 'center' });
                
                doc.setFillColor(248, 249, 250);
                doc.rect(startX + boxWidth + 5, yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(40, 167, 69);
                doc.text(`${stats.completados || 0}`, startX + boxWidth + 5 + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Completados', startX + boxWidth + 5 + boxWidth / 2, yPos + 18, { align: 'center' });
                
                doc.setFillColor(248, 249, 250);
                doc.rect(startX + 2 * (boxWidth + 5), yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(23, 162, 184);
                doc.text(`${stats.en_progreso || 0}`, startX + 2 * (boxWidth + 5) + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('En Progreso', startX + 2 * (boxWidth + 5) + boxWidth / 2, yPos + 18, { align: 'center' });
                
                doc.setFillColor(248, 249, 250);
                doc.rect(startX + 3 * (boxWidth + 5), yPos, boxWidth, boxHeight, 'F');
                doc.setFontSize(16);
                doc.setTextColor(255, 193, 7);
                doc.text(`${stats.pendientes || 0}`, startX + 3 * (boxWidth + 5) + boxWidth / 2, yPos + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Pendientes', startX + 3 * (boxWidth + 5) + boxWidth / 2, yPos + 18, { align: 'center' });
                
                yPos += boxHeight + 15;
                
                // Tabla de viajes
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Detalle de Viajes', margin, yPos);
                yPos += 8;
                
                // Encabezados
                doc.setFillColor(0, 123, 255);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.text('ID', margin + 2, yPos + 5);
                doc.text('Origen', margin + 15, yPos + 5);
                doc.text('Destino', margin + 50, yPos + 5);
                doc.text('Fecha', margin + 85, yPos + 5);
                doc.text('Estado', margin + 110, yPos + 5);
                doc.text('Transportista', margin + 135, yPos + 5);
                yPos += 8;
                
                // Datos
                doc.setTextColor(0, 0, 0);
                let rowCount = 0;
                for (const viaje of data) {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    
                    if (rowCount % 2 === 0) {
                        doc.setFillColor(248, 249, 250);
                        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
                    }
                    
                    doc.setFontSize(7);
                    doc.text(String(viaje.id), margin + 2, yPos + 5);
                    doc.text((viaje.origen || '').substring(0, 15), margin + 15, yPos + 5);
                    doc.text((viaje.destino || '').substring(0, 15), margin + 50, yPos + 5);
                    doc.text(new Date(viaje.fecha_programada).toLocaleDateString(), margin + 85, yPos + 5);
                    doc.text(viaje.estado || '', margin + 110, yPos + 5);
                    doc.text((viaje.transportista_nombre || 'N/A').substring(0, 20), margin + 135, yPos + 5);
                    
                    yPos += 7;
                    rowCount++;
                }
            }
            
            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Generado el ${new Date().toLocaleString()} | Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
            
            // Descargar PDF
            const filename = `reporte_${type}_${startDate}_${endDate}.pdf`;
            doc.save(filename);
            
            window.app.showToast('✅ PDF descargado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            window.app.showToast('❌ Error al generar PDF: ' + error.message, 'danger');
        }
    }

    generatePDFReportOld() {
        const data = this.reportData.data || this.reportData;
        const stats = this.reportData.stats || {};
        const { type, startDate, endDate } = this.currentReport;
        
        const printWindow = window.open('', '_blank');
        
        if (type === 'viajes') {
            // Generar PDF para viajes
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reporte de Viajes</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                        .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        .total { font-weight: bold; color: #007bff; }
                        @media print { 
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🚛 Reporte de Viajes</h1>
                        <p>Período: ${startDate} - ${endDate}</p>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-box">
                            <h3 class="total">${stats.total || 0}</h3>
                            <p>Total de Viajes</p>
                        </div>
                        <div class="stat-box">
                            <h3>${stats.completados || 0}</h3>
                            <p>Completados</p>
                        </div>
                        <div class="stat-box">
                            <h3>${stats.en_progreso || 0}</h3>
                            <p>En Progreso</p>
                        </div>
                        <div class="stat-box">
                            <h3>${stats.pendientes || 0}</h3>
                            <p>Pendientes</p>
                        </div>
                    </div>
                    
                    <h3>Detalle de Viajes</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Transportista</th>
                                <th>Vehículo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(trip => `
                                <tr>
                                    <td>${trip.id}</td>
                                    <td>${trip.origen}</td>
                                    <td>${trip.destino}</td>
                                    <td>${new Date(trip.fecha_programada).toLocaleDateString()}</td>
                                    <td>${trip.estado}</td>
                                    <td>${trip.transportista_nombre || 'N/A'}</td>
                                    <td>${trip.vehiculo_placa || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="no-print" style="margin-top: 30px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir / Guardar como PDF</button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Cerrar</button>
                    </div>
                </body>
                </html>
            `);
        } else {
            // Generar PDF para gastos
            const totalAmount = stats.total_monto || data.reduce((sum, expense) => sum + parseFloat(expense.monto || 0), 0);
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reporte de Gastos</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                        .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        .total { font-weight: bold; color: #007bff; }
                        @media print { 
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>📊 Reporte de Gastos</h1>
                        <p>Período: ${startDate} - ${endDate}</p>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-box">
                            <h3 class="total">$${totalAmount.toLocaleString()}</h3>
                            <p>Total de Gastos</p>
                        </div>
                        <div class="stat-box">
                            <h3>${data.length}</h3>
                            <p>Número de Registros</p>
                        </div>
                        <div class="stat-box">
                            <h3>$${(totalAmount / data.length).toLocaleString()}</h3>
                            <p>Promedio por Gasto</p>
                        </div>
                        <div class="stat-box">
                            <h3>${stats.combustible_litros || 0} L</h3>
                            <p>Combustible</p>
                        </div>
                    </div>
                    
                    <h3>Detalle de Gastos</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Usuario</th>
                                <th>Vehículo</th>
                                <th>Monto</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(expense => `
                                <tr>
                                    <td>${new Date(expense.fecha).toLocaleDateString()}</td>
                                    <td>${expense.tipo}</td>
                                    <td>${expense.usuario_nombre || 'N/A'}</td>
                                    <td>${expense.vehiculo_placa || 'N/A'}</td>
                                    <td>$${parseFloat(expense.monto).toFixed(2)}</td>
                                    <td>${expense.estado}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="no-print" style="margin-top: 30px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir / Guardar como PDF</button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Cerrar</button>
                    </div>
                </body>
                </html>
            `);
        }
        
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        window.app.showToast('✅ Ventana de impresión abierta. Usa "Guardar como PDF" en las opciones de impresión.', 'success');
    }

    generateCSVReport() {
        const data = this.reportData.data || this.reportData;
        const { type } = this.currentReport;
        
        let csvContent = '';
        let filename = '';
        
        if (type === 'viajes') {
            // CSV para viajes
            csvContent = 'ID,Origen,Destino,Fecha,Estado,Transportista,Vehiculo\n';
            csvContent += data.map(trip => [
                trip.id,
                `"${trip.origen}"`,
                `"${trip.destino}"`,
                new Date(trip.fecha_programada).toLocaleDateString(),
                trip.estado,
                `"${trip.transportista_nombre || 'N/A'}"`,
                `"${trip.vehiculo_placa || 'N/A'}"`
            ].join(',')).join('\n');
            filename = 'reporte_viajes.csv';
        } else {
            // CSV para gastos
            csvContent = 'Fecha,Tipo,Usuario,Vehiculo,Monto,Litros,Kilometraje,Numero_Factura,Descripcion,Estado\n';
            csvContent += data.map(expense => [
                new Date(expense.fecha).toLocaleDateString(),
                expense.tipo,
                `"${expense.usuario_nombre || 'N/A'}"`,
                `"${expense.vehiculo_placa || 'N/A'}"`,
                expense.monto,
                expense.litros || 0,
                expense.kilometraje || 0,
                `"${expense.numero_factura || ''}"`,
                `"${expense.descripcion || ''}"`,
                expense.estado
            ].join(',')).join('\n');
            filename = 'reporte_gastos.csv';
        }
        
        // Crear y descargar el archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.app.showToast('✅ Archivo CSV descargado exitosamente', 'success');
        }
    }

    getStatusColor(status) {
        const colors = {
            'completado': 'success',
            'cancelado': 'danger',
            'en_progreso': 'info',
            'pendiente': 'warning',
            'aprobado': 'success',
            'rechazado': 'danger'
        };
        return colors[status] || 'secondary';
    }

    getStatusLabel(status) {
        const labels = {
            'completado': 'Completado',
            'cancelado': 'Cancelado',
            'en_progreso': 'En Progreso',
            'pendiente': 'Pendiente',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado'
        };
        return labels[status] || status;
    }

    groupBy(array, key) {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    }
}

// Initialize the manager
window.ReportesManagerInstance = new ReportesManager();


// ========================================
// DYNAMIC SUB-FILTER FUNCTIONALITY
// ========================================

/**
 * Actualiza el dropdown de subfiltro según el tipo de reporte seleccionado
 */
window.updateReportSubFilter = function() {
    const reportType = document.getElementById('reportType')?.value;
    const subFilterSelect = document.getElementById('reportSubFilter');
    const subFilterLabel = document.getElementById('subFilterLabel');
    
    if (!subFilterSelect || !subFilterLabel) return;
    
    console.log('🔄 Actualizando subfiltro para tipo:', reportType);
    
    // Limpiar opciones actuales
    subFilterSelect.innerHTML = '';
    
    if (reportType === 'gastos') {
        // Opciones para Gastos
        subFilterLabel.textContent = 'Tipo de Gasto';
        
        const gastosOptions = [
            { value: 'all', text: 'Todos los tipos', icon: '📊' },
            { value: 'combustible', text: 'Combustible', icon: '⛽' },
            { value: 'mantenimiento', text: 'Mantenimiento', icon: '🔧' },
            { value: 'peajes', text: 'Peajes', icon: '🛣️' },
            { value: 'multas', text: 'Multas', icon: '🚨' },
            { value: 'hospedaje', text: 'Hospedaje', icon: '🏨' },
            { value: 'alimentacion', text: 'Alimentación', icon: '🍽️' },
            { value: 'otros', text: 'Otros', icon: '📦' }
        ];
        
        gastosOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = `${opt.icon} ${opt.text}`;
            subFilterSelect.appendChild(option);
        });
        
    } else if (reportType === 'viajes') {
        // Opciones para Viajes
        subFilterLabel.textContent = 'Estado del Viaje';
        
        const viajesOptions = [
            { value: 'all', text: 'Todos los estados', icon: '📊' },
            { value: 'pendiente', text: 'Pendientes', icon: '⏳' },
            { value: 'en_ruta', text: 'En Ruta', icon: '🚛' },
            { value: 'completado', text: 'Completados', icon: '✅' },
            { value: 'cancelado', text: 'Cancelados', icon: '❌' }
        ];
        
        viajesOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = `${opt.icon} ${opt.text}`;
            subFilterSelect.appendChild(option);
        });
    }
    
    // Resetear a "all" cuando se cambie el tipo de reporte
    subFilterSelect.value = 'all';
    console.log('✅ Subfiltro actualizado y reseteado a "all"');
};

/**
 * Aplica los filtros seleccionados al reporte
 */
window.applyReportFilters = function() {
    console.log('🔍 Aplicando filtros de reporte...');
    
    const reportType = document.getElementById('reportType')?.value;
    const subFilter = document.getElementById('reportSubFilter')?.value;
    const period = document.getElementById('reportPeriod')?.value;
    const transportista = document.getElementById('reportTransportista')?.value;
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    const filters = {
        reportType,
        subFilter,
        period,
        transportista,
        startDate,
        endDate
    };
    
    console.log('📊 Filtros seleccionados:', filters);
    
    // Mostrar en consola qué filtro se está aplicando
    if (reportType === 'gastos' && subFilter && subFilter !== 'all') {
        console.log(`💰 Filtrando gastos por tipo: ${subFilter}`);
    } else if (reportType === 'viajes' && subFilter && subFilter !== 'all') {
        console.log(`🚛 Filtrando viajes por estado: ${subFilter}`);
    }
    
    // Regenerar el reporte con los nuevos filtros
    if (window.ReportesManagerInstance && typeof window.ReportesManagerInstance.autoGenerateReport === 'function') {
        console.log('✅ Regenerando reporte con filtros...');
        window.ReportesManagerInstance.autoGenerateReport();
    } else {
        console.error('❌ ReportesManagerInstance no está disponible');
    }
};

// Inicializar el subfiltro cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof updateReportSubFilter === 'function') {
            updateReportSubFilter();
        }
    }, 500);
});

// También actualizar cuando se navegue a la sección de reportes
if (window.app) {
    const originalNavigateTo = window.app.navigateTo;
    if (originalNavigateTo) {
        window.app.navigateTo = function(sectionId, title) {
            originalNavigateTo.call(this, sectionId, title);
            
            // Si navegamos a reportes, actualizar el subfiltro
            if (sectionId === 'reportesSection') {
                setTimeout(() => {
                    if (typeof updateReportSubFilter === 'function') {
                        updateReportSubFilter();
                    }
                }, 100);
            }
        };
    }
}


// Inicializar instancia global cuando se carga el script
if (typeof window.ReportesManagerInstance === 'undefined') {
    console.log('📊 Inicializando ReportesManager...');
    window.ReportesManagerInstance = new ReportesManager();
    console.log('✅ ReportesManager inicializado');
}
