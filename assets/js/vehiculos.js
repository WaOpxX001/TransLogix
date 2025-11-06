// Vehiculos Manager - 🚚 Vehicles management functionality
class VehiculosManager {
    constructor() {
        this.vehicles = [];
        this.stats = {};
        this.currentVehicle = null;
        this.loadData(); // Initialize data on construction
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add vehicle button
        const addBtn = document.querySelector('[onclick="openModal(\'addVehicle\')"]');
        if (addBtn) {
            addBtn.onclick = () => this.openAddModal();
        }
    }

    async loadData() {
        try {
            // Real API calls - connecting to database
            const [vehiclesResponse, statsResponse] = await Promise.all([
                window.app.apiCall('vehiculos/list.php'),
                window.app.apiCall('vehiculos/stats.php')
            ]);
            
            this.vehicles = vehiclesResponse;
            this.stats = statsResponse;
            
            // Debug: mostrar los datos recibidos
            console.log('🚚 Datos de vehículos recibidos:', this.vehicles);
            if (this.vehicles && this.vehicles.length > 0) {
                console.log('🚚 Primer vehículo:', this.vehicles[0]);
            }
            
            this.updateStatsCards();
            this.updateVehiclesList();
            
        } catch (error) {
            console.error('❌ Error loading vehicles data:', error);
            // Fallback to empty arrays if API fails
            this.vehicles = [];
            this.stats = {
                total: 0,
                operational: 0,
                maintenance: 0,
                out_of_service: 0
            };
            
            this.updateStatsCards();
            this.updateVehiclesList();
        }
    }
    updateStatsCards() {
        const cards = document.querySelectorAll('#vehiculosSection .stat-card');
        if (!cards.length || !this.stats) return;

        const statsData = [
            { value: this.stats.total || 0, label: 'Vehículos Totales' },
            { value: this.stats.operational || 0, label: 'En Operación' },
            { value: this.stats.maintenance || 0, label: 'En Mantenimiento' },
            { value: this.stats.out_of_service || 0, label: 'Fuera de Servicio' }
        ];

        cards.forEach((card, index) => {
            if (statsData[index]) {
                const valueEl = card.querySelector('.stat-value');
                const labelEl = card.querySelector('.stat-label');
                
                if (valueEl) valueEl.textContent = statsData[index].value;
                if (labelEl) labelEl.textContent = statsData[index].label;
            }
        });
    }

    updateVehiclesList() {
        const tbody = document.querySelector('#vehiculosSection tbody');
        if (!tbody || !this.vehicles) return;

        // Get current user role
        const currentUser = window.app?.currentUser;
        const userRole = currentUser?.rol || currentUser?.role || 'transportista';
        const isTransportista = userRole.toLowerCase() === 'transportista';
        const isAdmin = userRole.toLowerCase() === 'administrador' || userRole.toLowerCase() === 'admin';
        const isAdminOrSupervisor = isAdmin || userRole.toLowerCase() === 'supervisor';

        tbody.innerHTML = this.vehicles.map(vehicle => {
            // Manejar diferentes nombres de campos de la BD
            const año = vehicle.año || vehicle.anio || vehicle.year || 'N/A';
            const estado = vehicle.estado || vehicle.status || 'En Operación'; // Default status
            const kilometraje = vehicle.kilometraje || vehicle.mileage || 0;
            
            return `
            <tr>
                <td>${vehicle.placa}</td>
                <td>${this.getVehicleTypeIcon(vehicle.tipo)} ${vehicle.tipo || 'Vehículo'}</td>
                <td>${vehicle.marca} ${vehicle.modelo}</td>
                <td>${año}</td>
                <td>${kilometraje ? kilometraje.toLocaleString() : 'N/A'} km</td>
                <td>${this.getStatusBadge(estado)}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="VehiculosManager.viewVehicle(${vehicle.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${isAdminOrSupervisor ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="VehiculosManager.editVehicle(${vehicle.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        ${isAdmin ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="VehiculosManager.deleteVehicle(${vehicle.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        
        // Generate mobile cards
        this.updateMobileVehicleCards();
    }

    updateMobileVehicleCards() {
        const mobileView = document.querySelector('#mobileVehiclesView');
        if (!mobileView) return;

        if (!this.vehicles || this.vehicles.length === 0) {
            mobileView.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                    <h5>No hay vehículos</h5>
                    <p class="text-muted">No se encontraron vehículos registrados</p>
                </div>
            `;
            return;
        }

        const currentUser = window.app?.currentUser;

        mobileView.innerHTML = this.vehicles.map(vehicle => {
            const año = vehicle.año || vehicle.year || 'N/A';
            const kilometraje = vehicle.kilometraje || vehicle.mileage || 0;
            
            return `
                <div class="mobile-expense-card">
                    <div class="mobile-expense-header">
                        <div>
                            <div class="mobile-expense-amount">${vehicle.placa}</div>
                            <div class="mobile-expense-date">${this.getVehicleTypeIcon(vehicle.tipo)} ${vehicle.tipo || 'Vehículo'}</div>
                        </div>
                        ${this.getStatusBadge(vehicle.estado || 'En Operación')}
                    </div>
                    <div class="row mb-2">
                        <div class="col-6">
                            <small class="text-muted">Marca/Modelo:</small><br>
                            <strong>${vehicle.marca} ${vehicle.modelo}</strong>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Año:</small><br>
                            <strong>${año}</strong>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">Kilometraje:</small><br>
                            <strong>${kilometraje ? kilometraje.toLocaleString() : 'N/A'} km</strong>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Estado:</small><br>
                            ${this.getStatusBadge(vehicle.estado || 'En Operación')}
                        </div>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="VehiculosManager.viewVehicle(${vehicle.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${(() => {
                            const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
                            const isAdminOrSupervisor = userRole === 'administrador' || userRole === 'admin' || userRole === 'supervisor';
                            return isAdminOrSupervisor ? `
                        <button class="btn btn-outline-warning btn-sm flex-fill" onclick="VehiculosManager.editVehicle(${vehicle.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ` : '';
                        })()}
                        ${(() => {
                            const userRole = (currentUser?.rol || currentUser?.role || '').toLowerCase();
                            const isAdmin = userRole === 'administrador' || userRole === 'admin';
                            return isAdmin ? `
                        <button class="btn btn-outline-danger btn-sm flex-fill" onclick="VehiculosManager.deleteVehicle(${vehicle.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                        ` : '';
                        })()}
                    </div>
                </div>
            `;
        }).join('');
    }

    getVehicleTypeIcon(type) {
        const icons = {
            'camion': '🚚',
            'van': '🚐',
            'pickup': '🛻',
            'trailer': '🚛'
        };
        // Verificar que type existe y no es undefined
        if (!type || typeof type !== 'string') {
            return '🚗'; // Icono por defecto
        }
        return icons[type.toLowerCase()] || '🚗';
    }

    getStatusColor(status) {
        const colors = {
            'operativo': 'success',
            'mantenimiento': 'warning',
            'fuera_servicio': 'danger',
            'disponible': 'info'
        };
        return colors[status] || 'secondary';
    }

    getStatusLabel(status) {
        const labels = {
            'operativo': 'Operativo',
            'mantenimiento': 'Mantenimiento',
            'fuera_servicio': 'Fuera de Servicio',
            'disponible': 'Disponible'
        };
        return labels[status] || status;
    }

    getStatusBadge(status) {
        // Normalizar el estado para que coincida con los existentes
        let normalizedStatus = status;
        if (status === 'En Operación') normalizedStatus = 'operativo';
        if (status === 'En Mantenimiento') normalizedStatus = 'mantenimiento';
        if (status === 'Fuera de Servicio') normalizedStatus = 'fuera_servicio';
        
        const statusConfig = {
            'operativo': {
                class: 'bg-success',
                icon: '✅',
                text: 'En Operación'
            },
            'mantenimiento': {
                class: 'bg-warning text-dark',
                icon: '🔧',
                text: 'En Mantenimiento'
            },
            'fuera_servicio': {
                class: 'bg-danger',
                icon: '❌',
                text: 'Fuera de Servicio'
            },
            'disponible': {
                class: 'bg-info',
                icon: '🟢',
                text: 'Disponible'
            }
        };

        const config = statusConfig[normalizedStatus] || statusConfig['operativo'];
        
        return `<span class="badge ${config.class} px-2 py-1">
                    ${config.icon} ${config.text}
                </span>`;
    }

    openAddModal() {
        const modalHtml = `
            <div class="modal fade" id="vehicleModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">➕ Agregar Nuevo Vehículo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="vehicleForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Placa *</label>
                                    <input type="text" class="form-control" name="placa" required placeholder="ABC-123">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Tipo *</label>
                                    <select class="form-control" name="tipo" required>
                                        <option value="">Seleccionar tipo...</option>
                                        <option value="camion">🚚 Camión</option>
                                        <option value="van">🚐 Van</option>
                                        <option value="pickup">🛻 Pickup</option>
                                        <option value="trailer">🚛 Trailer</option>
                                    </select>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Marca *</label>
                                            <input type="text" class="form-control" name="marca" required placeholder="Volvo">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Modelo *</label>
                                            <input type="text" class="form-control" name="modelo" required placeholder="FH16">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Año *</label>
                                            <input type="number" class="form-control" name="año" required min="1990" max="2030">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Kilometraje</label>
                                            <input type="number" class="form-control" name="kilometraje" min="0" placeholder="0">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-control" name="estado">
                                        <option value="En Operación">✅ En Operación</option>
                                        <option value="Disponible">🟢 Disponible</option>
                                        <option value="En Mantenimiento">🔧 En Mantenimiento</option>
                                        <option value="Fuera de Servicio">❌ Fuera de Servicio</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Guardar Vehículo</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('vehicleModal'));
        modal.show();

        // Setup form handler
        document.getElementById('vehicleForm').addEventListener('submit', (e) => this.handleSubmit(e, modal));

        document.getElementById('vehicleModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async handleSubmit(e, modal) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const vehicleData = {
            placa: formData.get('placa'),
            tipo: formData.get('tipo'),
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            año: parseInt(formData.get('año')),
            kilometraje: parseInt(formData.get('kilometraje')) || 0,
            estado: formData.get('estado')
        };

        // Validate required fields
        if (!vehicleData.placa || !vehicleData.tipo || !vehicleData.marca || !vehicleData.modelo || !vehicleData.año) {
            window.app.showToast('Por favor completa todos los campos requeridos', 'danger');
            return;
        }

        try {
            window.app.showToast('Guardando vehículo...', 'info');
            
            // Real API call to save in database
            const response = await window.app.apiCall('vehiculos/create.php', {
                method: 'POST',
                body: JSON.stringify(vehicleData)
            });

            if (response.success) {
                window.app.showToast('✅ Vehículo creado exitosamente', 'success');
                modal.hide();
                await this.loadData(); // Reload data from database
            }
        } catch (error) {
            window.app.showToast('Error al crear vehículo: ' + error.message, 'danger');
        }
    }

    static viewVehicle(id) {
        const vehicle = window.VehiculosManager.vehicles.find(v => v.id === id);
        if (!vehicle) return;

        // Check user role
        const currentUser = window.app?.currentUser;
        const isTransportista = currentUser?.role === 'transportista';

        const modalHtml = `
            <div class="modal fade" id="viewVehicleModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles del Vehículo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <div style="font-size: 3rem;">${window.VehiculosManager.getVehicleTypeIcon(vehicle.tipo)}</div>
                                <h5>${vehicle.placa}</h5>
                                <span class="badge bg-${window.VehiculosManager.getStatusColor(vehicle.estado)}">
                                    ${window.VehiculosManager.getStatusLabel(vehicle.estado)}
                                </span>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Tipo:</strong> ${vehicle.tipo}</p>
                                    <p><strong>Marca:</strong> ${vehicle.marca}</p>
                                    <p><strong>Modelo:</strong> ${vehicle.modelo}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Año:</strong> ${vehicle.año}</p>
                                    <p><strong>Kilometraje:</strong> ${vehicle.kilometraje?.toLocaleString()} km</p>
                                    <p><strong>Último servicio:</strong> ${vehicle.ultimo_servicio ? window.VehiculosManager.formatDate(vehicle.ultimo_servicio) : 'N/A'}</p>
                                </div>
                            </div>
                            ${vehicle.conductor_asignado ? `<p><strong>Conductor asignado:</strong> ${vehicle.conductor_asignado}</p>` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            ${!isTransportista ? `<button type="button" class="btn btn-warning" onclick="VehiculosManager.editVehicle(${vehicle.id})">Editar</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('viewVehicleModal'));
        modal.show();

        document.getElementById('viewVehicleModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // Función de edición eliminada - usar la función global VehiculosManager.editVehicle

    async handleEdit(e, modal) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const vehicleData = {
            id: parseInt(formData.get('id')),
            placa: formData.get('placa'),
            tipo: formData.get('tipo'),
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            año: parseInt(formData.get('año')),
            kilometraje: parseInt(formData.get('kilometraje')) || 0,
            estado: formData.get('estado')
        };

        try {
            window.app.showToast('Actualizando vehículo...', 'info');
            
            // Real API call to update in database
            const response = await window.app.apiCall('vehiculos/update.php', {
                method: 'PUT',
                body: JSON.stringify(vehicleData)
            });

            if (response.success) {
                window.app.showToast('✅ Vehículo actualizado exitosamente', 'success');
                modal.hide();
                await this.loadData(); // Reload data from database
            }
        } catch (error) {
            window.app.showToast('Error al actualizar vehículo: ' + error.message, 'danger');
        }
    }

    static async deleteVehicle(id) {
        const vehicle = window.VehiculosManager.vehicles.find(v => v.id === id);
        if (!vehicle) return;

        // Usar modal personalizado en lugar de confirm nativo
        window.app.showConfirmModal(
            '🗑️ Eliminar Vehículo',
            `¿Estás seguro de eliminar este vehículo?<br><br>
            <strong>Placa:</strong> ${vehicle.placa}<br>
            <strong>Marca:</strong> ${vehicle.marca}<br>
            <strong>Modelo:</strong> ${vehicle.modelo}<br>
            <strong>Estado:</strong> ${vehicle.estado}`,
            'Eliminar',
            'danger',
            async () => {
                try {
                    await window.app.apiCall('vehiculos/delete.php', {
                        method: 'DELETE',
                        body: JSON.stringify({ id })
                    });

                    window.app.showToast('Vehículo eliminado correctamente', 'success');
                    window.VehiculosManager.loadData();
                } catch (error) {
                    window.app.showToast('Error al eliminar vehículo: ' + error.message, 'danger');
                }
            }
        );
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }
}

// Funciones estáticas para botones

// Función para obtener el badge de estado con colores
VehiculosManager.getEstadoBadge = function(estado) {
    const estadoLower = (estado || '').toLowerCase();
    let badgeClass = 'bg-info';
    let icon = '🚛';
    
    if (estadoLower.includes('operación') || estadoLower.includes('operacion') || estadoLower.includes('disponible')) {
        badgeClass = 'bg-info';
        icon = '🚛';
    } else if (estadoLower.includes('mantenimiento')) {
        badgeClass = 'bg-warning';
        icon = '🔧';
    } else if (estadoLower.includes('servicio') || estadoLower.includes('reparación') || estadoLower.includes('reparacion')) {
        badgeClass = 'bg-danger';
        icon = '⚠️';
    } else if (estadoLower.includes('disponible')) {
        badgeClass = 'bg-success';
        icon = '✅';
    }
    
    return `<span class="badge ${badgeClass}">${icon} ${estado}</span>`;
};

VehiculosManager.viewVehicle = function(id) {
    const vehicle = window.VehiculosManager.vehicles.find(v => v.id === id);
    if (!vehicle) return;
    
    const modalHtml = `
        <div class="modal fade" id="viewVehicleModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-truck me-2"></i>
                            Detalles del Vehículo
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="text-muted small">Placa</label>
                                    <p class="mb-0 fw-bold">${vehicle.placa}</p>
                                </div>
                                <div class="mb-3">
                                    <label class="text-muted small">Tipo</label>
                                    <p class="mb-0">${vehicle.tipo}</p>
                                </div>
                                <div class="mb-3">
                                    <label class="text-muted small">Marca</label>
                                    <p class="mb-0">${vehicle.marca}</p>
                                </div>
                                <div class="mb-3">
                                    <label class="text-muted small">Modelo</label>
                                    <p class="mb-0">${vehicle.modelo}</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="text-muted small">Año</label>
                                    <p class="mb-0">${vehicle.año || vehicle.anio || 'N/A'}</p>
                                </div>
                                <div class="mb-3">
                                    <label class="text-muted small">Kilometraje</label>
                                    <p class="mb-0">${vehicle.kilometraje || 0} km</p>
                                </div>
                                <div class="mb-3">
                                    <label class="text-muted small">Estado</label>
                                    <p class="mb-0">
                                        ${this.getEstadoBadge(vehicle.estado || 'En Operación')}
                                    </p>
                                </div>
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
    const modal = new bootstrap.Modal(document.getElementById('viewVehicleModal'));
    modal.show();
    
    document.getElementById('viewVehicleModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

VehiculosManager.editVehicle = function(id) {
    const vehicle = window.VehiculosManager.vehicles.find(v => v.id === id);
    if (!vehicle) return;
    
    const modalHtml = `
        <div class="modal fade" id="editVehicleModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>
                            Editar Vehículo - ${vehicle.placa}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="editVehicleForm">
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Placa *</label>
                                        <input type="text" class="form-control" name="placa" value="${vehicle.placa}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Tipo *</label>
                                        <select class="form-select" name="tipo" required>
                                            <option value="Camión" ${vehicle.tipo === 'Camión' ? 'selected' : ''}>🚛 Camión</option>
                                            <option value="Van" ${vehicle.tipo === 'Van' ? 'selected' : ''}>🚐 Van</option>
                                            <option value="Pickup" ${vehicle.tipo === 'Pickup' ? 'selected' : ''}>🛻 Pickup</option>
                                            <option value="Trailer" ${vehicle.tipo === 'Trailer' ? 'selected' : ''}>🚚 Trailer</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Marca *</label>
                                        <input type="text" class="form-control" name="marca" value="${vehicle.marca}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Modelo *</label>
                                        <input type="text" class="form-control" name="modelo" value="${vehicle.modelo}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Año</label>
                                        <input type="number" class="form-control" name="año" value="${vehicle.año || vehicle.anio || ''}" min="1990" max="2030">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Kilometraje</label>
                                        <input type="number" class="form-control" name="kilometraje" value="${vehicle.kilometraje || 0}" min="0">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" name="estado">
                                    <option value="disponible" ${vehicle.estado === 'disponible' ? 'selected' : ''}>🟢 Disponible</option>
                                    <option value="operativo" ${vehicle.estado === 'operativo' ? 'selected' : ''}>✅ En Operación</option>
                                    <option value="mantenimiento" ${vehicle.estado === 'mantenimiento' ? 'selected' : ''}>🔧 En Mantenimiento</option>
                                    <option value="fuera_servicio" ${vehicle.estado === 'fuera_servicio' ? 'selected' : ''}>❌ Fuera de Servicio</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="submit" class="btn btn-warning">
                                <i class="fas fa-save me-1"></i>Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('editVehicleModal'));
    modal.show();
    
    // Manejar envío del formulario
    document.getElementById('editVehicleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        VehiculosManager.saveVehicleChanges(id, e.target);
    });
    
    document.getElementById('editVehicleModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

VehiculosManager.saveVehicleChanges = async function(id, form) {
    const formData = new FormData(form);
    const vehicleData = {
        id: id,
        placa: formData.get('placa'),
        tipo: formData.get('tipo'),
        marca: formData.get('marca'),
        modelo: formData.get('modelo'),
        año: parseInt(formData.get('año')),
        kilometraje: parseInt(formData.get('kilometraje')) || 0,
        estado: formData.get('estado')
    };
    
    try {
        window.app.showToast('Actualizando vehículo...', 'info');
        
        const response = await window.app.apiCall('vehiculos/update.php', {
            method: 'PUT',
            body: JSON.stringify(vehicleData)
        });

        if (response.success) {
            window.app.showToast('✅ Vehículo actualizado exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editVehicleModal')).hide();
            await window.VehiculosManager.loadData();
        } else {
            window.app.showToast('❌ Error al actualizar vehículo', 'danger');
        }
    } catch (error) {
        console.error('Error updating vehicle:', error);
        window.app.showToast('❌ Error al actualizar vehículo: ' + error.message, 'danger');
    }
};

VehiculosManager.deleteVehicle = function(id) {
    const vehicle = window.VehiculosManager.vehicles.find(v => v.id === id);
    if (!vehicle) return;
    
    const modalHtml = `
        <div class="modal fade" id="deleteVehicleModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Eliminar Vehículo
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <i class="fas fa-warning me-2"></i>
                            <strong>¡Atención!</strong> Esta acción no se puede deshacer.
                        </div>
                        <p>¿Estás seguro de que deseas eliminar el siguiente vehículo?</p>
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-6">
                                        <strong>Placa:</strong> ${vehicle.placa}<br>
                                        <strong>Tipo:</strong> ${vehicle.tipo}
                                    </div>
                                    <div class="col-6">
                                        <strong>Marca:</strong> ${vehicle.marca}<br>
                                        <strong>Modelo:</strong> ${vehicle.modelo}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="form-label">Para confirmar, escribe: <strong>ELIMINAR</strong></label>
                            <input type="text" class="form-control" id="confirmDeleteText" placeholder="Escribe ELIMINAR para confirmar">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn" disabled onclick="VehiculosManager.confirmDeleteVehicle(${id})">
                            <i class="fas fa-trash me-1"></i>Eliminar Vehículo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('deleteVehicleModal'));
    modal.show();
    
    // Validación en tiempo real
    const confirmInput = document.getElementById('confirmDeleteText');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    confirmInput.addEventListener('input', function() {
        if (this.value === 'ELIMINAR') {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('btn-secondary');
            confirmBtn.classList.add('btn-danger');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('btn-secondary');
            confirmBtn.classList.remove('btn-danger');
        }
    });
    
    document.getElementById('deleteVehicleModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
};

VehiculosManager.confirmDeleteVehicle = async function(id) {
    try {
        window.app.showToast('Eliminando vehículo...', 'info');
        
        const response = await window.app.apiCall('vehiculos/delete.php', {
            method: 'POST',
            body: JSON.stringify({ id: id })
        });

        if (response.success) {
            window.app.showToast('✅ Vehículo eliminado exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('deleteVehicleModal')).hide();
            await window.VehiculosManager.loadData();
        } else {
            window.app.showToast('❌ Error al eliminar vehículo', 'danger');
        }
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        window.app.showToast('❌ Error al eliminar vehículo: ' + error.message, 'danger');
    }
};

// Initialize Vehiculos Manager
window.VehiculosManager = new VehiculosManager();
