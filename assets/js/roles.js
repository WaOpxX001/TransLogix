// Roles Manager - 🔐 Roles and permissions functionality
// Clear any existing RolesManager to prevent redeclaration
if (typeof window.RolesManager !== 'undefined') {
    delete window.RolesManager;
}

class RolesManager {
    constructor() {
        this.users = [];
        this.roles = [];
        this.permissions = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addButtonStyles();
    }

    addButtonStyles() {
        // Agregar estilos CSS para animaciones si no existen
        if (!document.getElementById('rolesButtonStyles')) {
            const style = document.createElement('style');
            style.id = 'rolesButtonStyles';
            style.textContent = `
                .animate-btn {
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .animate-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                .animate-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .btn-outline-primary.animate-btn:hover {
                    background: linear-gradient(45deg, #0d6efd, #0b5ed7);
                    border-color: #0b5ed7;
                    color: white;
                }
                .btn-outline-warning.animate-btn:hover {
                    background: linear-gradient(45deg, #ffc107, #ffca2c);
                    border-color: #ffca2c;
                    color: #000;
                }
                .btn-outline-info.animate-btn:hover {
                    background: linear-gradient(45deg, #0dcaf0, #31d2f2);
                    border-color: #31d2f2;
                    color: #000;
                }
                .btn-outline-success.animate-btn:hover {
                    background: linear-gradient(45deg, #198754, #20c997);
                    border-color: #20c997;
                    color: white;
                }
                .btn-outline-danger.animate-btn:hover {
                    background: linear-gradient(45deg, #dc3545, #e55353);
                    border-color: #e55353;
                    color: white;
                }
                .btn-outline-danger.animate-btn {
                    animation: pulse-danger 3s infinite;
                }
                @keyframes pulse-danger {
                    0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
                    70% { box-shadow: 0 0 0 8px rgba(220, 53, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Add role button
        const addBtn = document.querySelector('[onclick="openModal(\'addRole\')"]');
        if (addBtn) {
            addBtn.onclick = () => this.openAddRoleModal();
        }
    }

    async loadData() {
        try {
            console.log('Loading users from database...');
            
            // Load real users from database
            const response = await fetch('api/roles/users.php');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.users = data;
            this.roles = ['admin', 'supervisor', 'transportista'];
            
            console.log('Users loaded:', this.users);
            this.updateUsersList();
        } catch (error) {
            console.error('Error loading roles data:', error);
        }
    }

    updateUsersList() {
        const tbody = document.querySelector('#rolesSection tbody');
        if (!tbody || !this.users) return;

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="width: 35px; height: 35px; font-size: 0.9rem;">
                            ${this.getInitials(user.nombre)}
                        </div>
                        <div>
                            <div class="fw-bold">${user.nombre}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${this.formatPhoneWithFlag(user.telefono)}</td>
                <td>
                    <span class="badge bg-${this.getRoleColor(user.rol)}">
                        ${this.getRoleIcon(user.rol)} ${this.getRoleLabel(user.rol)}
                    </span>
                </td>
                <td>${this.formatLastAccess(user.ultimo_acceso)}</td>
                <td>
                    <span class="badge bg-${user.activo ? 'success' : 'danger'}">
                        ${user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary animate-btn" onclick="RolesManager.viewUser(${user.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${true ? `
                        <button class="btn btn-sm btn-outline-warning animate-btn" onclick="RolesManager.editUserRole(${user.id})" title="Cambiar rol">
                            <i class="fas fa-user-cog"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info animate-btn" onclick="RolesManager.changePassword(${user.id})" title="Cambiar contraseña">
                            <i class="fas fa-key"></i>
                        </button>
                        ${user.activo ? `
                        <button class="btn btn-sm btn-outline-warning animate-btn" onclick="RolesManager.toggleUserStatus(${user.id})" title="Desactivar usuario">
                            <i class="fas fa-user-slash"></i>
                        </button>
                        ` : `
                        <button class="btn btn-sm btn-outline-success animate-btn" onclick="RolesManager.toggleUserStatus(${user.id})" title="Activar usuario">
                            <i class="fas fa-user-check"></i>
                        </button>
                        `}
                        <button class="btn btn-sm btn-outline-danger animate-btn" onclick="RolesManager.deleteUser(${user.id})" title="Eliminar usuario">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Generate mobile cards
        this.updateMobileRolesCards();
    }

    updateMobileRolesCards() {
        const mobileView = document.querySelector('#mobileRolesView');
        if (!mobileView) return;

        if (!this.users || this.users.length === 0) {
            mobileView.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-users-cog fa-3x text-muted mb-3"></i>
                    <h5>No hay usuarios</h5>
                    <p class="text-muted">No se encontraron usuarios en el sistema</p>
                </div>
            `;
            return;
        }

        const isAdmin = true;

        mobileView.innerHTML = this.users.map(user => `
            <div class="mobile-expense-card">
                <div class="mobile-expense-header">
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="width: 40px; height: 40px; font-size: 1rem;">
                            ${this.getInitials(user.nombre)}
                        </div>
                        <div>
                            <div class="mobile-expense-amount">${user.nombre}</div>
                            <div class="mobile-expense-date">${user.email}</div>
                        </div>
                    </div>
                    <span class="badge bg-${user.activo ? 'success' : 'danger'}">
                        ${user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <small class="text-muted">Teléfono:</small><br>
                        <strong>${this.formatPhoneWithFlag(user.telefono)}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Rol:</small><br>
                        <span class="badge bg-${this.getRoleColor(user.rol)}">
                            ${this.getRoleIcon(user.rol)} ${this.getRoleLabel(user.rol)}
                        </span>
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-12">
                        <small class="text-muted">Último Acceso:</small><br>
                        <strong>${this.formatLastAccess(user.ultimo_acceso)}</strong>
                    </div>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-outline-primary btn-sm animate-btn" onclick="RolesManager.viewUser(${user.id})" style="flex: 1;">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${isAdmin ? `
                    <button class="btn btn-outline-warning btn-sm animate-btn" onclick="RolesManager.editUserRole(${user.id})" style="flex: 1;">
                        <i class="fas fa-user-cog"></i> Rol
                    </button>
                    <button class="btn btn-outline-info btn-sm animate-btn" onclick="RolesManager.changePassword(${user.id})" style="flex: 1;">
                        <i class="fas fa-key"></i> Pass
                    </button>
                </div>
                <div class="d-flex gap-2 flex-wrap mt-2">
                    ${user.activo ? `
                    <button class="btn btn-outline-warning btn-sm animate-btn" onclick="RolesManager.toggleUserStatus(${user.id})" style="flex: 1;">
                        <i class="fas fa-user-slash"></i> Desactivar
                    </button>
                    ` : `
                    <button class="btn btn-outline-success btn-sm animate-btn" onclick="RolesManager.toggleUserStatus(${user.id})" style="flex: 1;">
                        <i class="fas fa-user-check"></i> Activar
                    </button>
                    `}
                    <button class="btn btn-outline-danger btn-sm animate-btn" onclick="RolesManager.deleteUser(${user.id})" style="flex: 1;">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    formatDate(dateString) {
        // Si no hay fecha, mostrar "Nunca"
        if (!dateString || dateString === null || dateString === 'null' || dateString === '') {
            return 'Nunca';
        }
        
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return 'Nunca';
        }
        
        // Formatear como DD/MM/AAAA
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    formatLastAccess(dateString) {
        // Si no hay fecha o es null, mostrar "Nunca"
        if (!dateString || dateString === null || dateString === 'null' || dateString === '' || dateString === undefined) {
            return 'Nunca';
        }
        
        // Intentar crear fecha
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return 'Nunca';
        }
        
        // Formatear como DD/MM/AAAA
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    getCountryFlag(phone) {
        if (!phone) return '';
        
        // Limpiar el teléfono de espacios y caracteres especiales
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Mapeo de códigos de país a códigos de bandera (igual que en transportistas)
        const countryFlags = {
            '+52': 'mx', // México
            '+1': 'us',   // Estados Unidos/Canadá
            '+33': 'fr',  // Francia
            '+49': 'de',  // Alemania
            '+44': 'gb',  // Reino Unido
            '+34': 'es',  // España
            '+39': 'it',  // Italia
            '+55': 'br',  // Brasil
            '+54': 'ar',  // Argentina
            '+57': 'co',  // Colombia
            '+86': 'cn',  // China
            '+81': 'jp',  // Japón
            '+82': 'kr',  // Corea del Sur
            '+91': 'in',  // India
        };
        
        // Buscar el código de país más largo que coincida
        for (const code of Object.keys(countryFlags).sort((a, b) => b.length - a.length)) {
            if (cleanPhone.startsWith(code)) {
                return `<img src="https://flagcdn.com/w20/${countryFlags[code]}.png" alt="${countryFlags[code]}" style="width: 20px; height: 15px; flex-shrink: 0; border-radius: 2px; display: inline-block; vertical-align: middle;">`;
            }
        }
        
        // Si no encuentra código específico, usar México por defecto
        return `<img src="https://flagcdn.com/w20/mx.png" alt="mx" style="width: 20px; height: 15px; flex-shrink: 0; border-radius: 2px; display: inline-block; vertical-align: middle;">`;
    }

    formatPhoneWithFlag(phone) {
        if (!phone) return 'N/A';
        
        const flag = this.getCountryFlag(phone);
        // Retornar bandera + teléfono en la misma línea con estilos forzados
        return `<div style="display: inline-flex !important; align-items: center !important; white-space: nowrap !important; gap: 8px;">${flag}<span style="display: inline-block; vertical-align: middle;">${phone}</span></div>`;
    }

    getRoleColor(role) {
        const colors = {
            'admin': 'danger',
            'supervisor': 'warning',
            'transportista': 'primary'
        };
        return colors[role] || 'secondary';
    }

    getRoleIcon(role) {
        const icons = {
            'admin': '👔',
            'supervisor': '📊',
            'transportista': '🚛'
        };
        return icons[role] || '👤';
    }

    getRoleLabel(role) {
        const labels = {
            'admin': 'Administrador',
            'supervisor': 'Supervisor',
            'transportista': 'Transportista'
        };
        return labels[role] || role;
    }

    openAddRoleModal() {
        const modalHtml = `
            <div class="modal fade" id="roleModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">➕ Crear Nuevo Rol</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="roleForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Nombre del Rol *</label>
                                    <input type="text" class="form-control" name="nombre" required placeholder="Ej: Coordinador">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Descripción</label>
                                    <textarea class="form-control" name="descripcion" rows="3" placeholder="Descripción del rol y sus responsabilidades"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Permisos</label>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="dashboard" id="perm_dashboard">
                                                <label class="form-check-label" for="perm_dashboard">Ver Dashboard</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="gastos_ver" id="perm_gastos_ver">
                                                <label class="form-check-label" for="perm_gastos_ver">Ver Gastos</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="gastos_crear" id="perm_gastos_crear">
                                                <label class="form-check-label" for="perm_gastos_crear">Crear Gastos</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="gastos_aprobar" id="perm_gastos_aprobar">
                                                <label class="form-check-label" for="perm_gastos_aprobar">Aprobar Gastos</label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="vehiculos" id="perm_vehiculos">
                                                <label class="form-check-label" for="perm_vehiculos">Gestionar Vehículos</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="transportistas" id="perm_transportistas">
                                                <label class="form-check-label" for="perm_transportistas">Gestionar Transportistas</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="reportes" id="perm_reportes">
                                                <label class="form-check-label" for="perm_reportes">Generar Reportes</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="permisos[]" value="roles" id="perm_roles">
                                                <label class="form-check-label" for="perm_roles">Gestionar Roles</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Crear Rol</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('roleModal'));
        modal.show();

        // Setup form handler
        document.getElementById('roleForm').addEventListener('submit', (e) => this.handleCreateRole(e, modal));

        document.getElementById('roleModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async handleCreateRole(e, modal) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const roleData = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            permisos: formData.getAll('permisos[]')
        };

        try {
            window.app.showToast('Creando rol...', 'info');
            
            const response = await window.app.apiCall('roles/create.php', {
                method: 'POST',
                body: JSON.stringify(roleData)
            });

            if (response.success) {
                window.app.showToast('✅ Rol creado exitosamente', 'success');
                modal.hide();
                this.loadData();
            }
        } catch (error) {
            window.app.showToast('Error al crear rol: ' + error.message, 'danger');
        }
    }

    static viewUser(id) {
        const user = window.RolesManager.users.find(u => u.id === id);
        if (!user) return;

        const modalHtml = `
            <div class="modal fade" id="viewUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles del Usuario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <div class="user-avatar mx-auto mb-2" style="width: 60px; height: 60px; font-size: 1.5rem;">
                                    ${window.RolesManager.getInitials(user.nombre)}
                                </div>
                                <h5>${user.nombre}</h5>
                                <span class="badge bg-${window.RolesManager.getRoleColor(user.rol)} mb-2">
                                    ${window.RolesManager.getRoleIcon(user.rol)} ${window.RolesManager.getRoleLabel(user.rol)}
                                </span>
                                <br>
                                <span class="badge bg-${user.activo ? 'success' : 'danger'}">
                                    ${user.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Email:</strong> ${user.email}</p>
                                    <p><strong>Teléfono:</strong> ${window.RolesManager.formatPhoneWithFlag(user.telefono)}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Fecha de registro:</strong> ${window.RolesManager.formatDate(user.fecha_registro)}</p>
                                    <p><strong>Último acceso:</strong> ${window.RolesManager.formatLastAccess(user.ultimo_acceso)}</p>
                                </div>
                            </div>
                            ${user.licencia ? `<p><strong>Licencia:</strong> ${user.licencia}</p>` : ''}
                            
                            <h6 class="mt-3">Permisos del Rol:</h6>
                            <div class="d-flex flex-wrap gap-1">
                                ${window.RolesManager.getRolePermissions(user.rol).map(perm => 
                                    `<span class="badge bg-secondary">${perm}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            ${window.app.currentUser.role === 'admin' ? `
                            <button type="button" class="btn btn-warning" onclick="RolesManager.editUserRole(${user.id})">Cambiar Rol</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
        modal.show();

        document.getElementById('viewUserModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static editUserRole(id) {
        const user = window.RolesManager.users.find(u => u.id === id);
        if (!user) return;

        const modalHtml = `
            <div class="modal fade" id="editRoleModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">🔐 Cambiar Rol de Usuario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editRoleForm">
                            <div class="modal-body">
                                <input type="hidden" name="id" value="${user.id}">
                                <div class="text-center mb-3">
                                    <div class="user-avatar mx-auto mb-2" style="width: 50px; height: 50px;">
                                        ${window.RolesManager.getInitials(user.nombre)}
                                    </div>
                                    <h6>${user.nombre}</h6>
                                    <small class="text-muted">${user.email}</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Rol Actual: <span class="badge bg-${window.RolesManager.getRoleColor(user.rol)}">${window.RolesManager.getRoleLabel(user.rol)}</span></label>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Nuevo Rol *</label>
                                    <select class="form-control" name="rol" required>
                                        <option value="">Seleccionar rol...</option>
                                        <option value="admin" ${user.rol === 'admin' ? 'selected' : ''}>👔 Administrador</option>
                                        <option value="supervisor" ${user.rol === 'supervisor' ? 'selected' : ''}>📊 Supervisor</option>
                                        <option value="transportista" ${user.rol === 'transportista' ? 'selected' : ''}>🚛 Transportista</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-control" name="activo">
                                        <option value="1" ${user.activo ? 'selected' : ''}>Activo</option>
                                        <option value="0" ${!user.activo ? 'selected' : ''}>Inactivo</option>
                                    </select>
                                </div>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <strong>Advertencia:</strong> Cambiar el rol afectará los permisos del usuario inmediatamente.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-warning">Cambiar Rol</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editRoleModal'));
        modal.show();

        // Setup form handler
        document.getElementById('editRoleForm').addEventListener('submit', (e) => window.RolesManager.handleRoleChange(e, modal));

        document.getElementById('editRoleModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async handleRoleChange(e, modal) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            id: parseInt(formData.get('id')),
            rol: formData.get('rol'),
            activo: parseInt(formData.get('activo'))
        };

        try {
            window.app.showToast('Actualizando rol...', 'info');
            
            // Real API call to update user role
            const response = await fetch('api/roles/update.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                window.app.showToast('✅ Rol actualizado exitosamente', 'success');
                modal.hide();
                this.loadData(); // Reload data from database
            } else {
                throw new Error(result.error || 'Error al actualizar rol');
            }
        } catch (error) {
            window.app.showToast('Error al actualizar rol: ' + error.message, 'danger');
        }
    }

    static async resetPassword(id) {
        const user = window.RolesManager.users.find(u => u.id === id);
        if (!user) return;

        const modalHtml = `
            <div class="modal fade" id="resetPasswordModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">🔑 Resetear Contraseña</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="resetPasswordForm">
                            <div class="modal-body">
                                <input type="hidden" name="id" value="${user.id}">
                                
                                <div class="text-center mb-4">
                                    <div class="user-avatar mx-auto mb-2" style="width: 50px; height: 50px;">
                                        ${window.RolesManager.getInitials(user.nombre)}
                                    </div>
                                    <h6>${user.nombre}</h6>
                                    <small class="text-muted">${user.email}</small>
                                </div>

                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i>
                                    <strong>Información:</strong> Establece una nueva contraseña para este usuario.
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Nueva Contraseña *</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="newPassword" name="password" 
                                               placeholder="Ingresa la nueva contraseña" required minlength="3">
                                        <button class="btn btn-outline-secondary" type="button" id="toggleNewPassword">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <small class="text-muted">Mínimo 3 caracteres</small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Confirmar Contraseña *</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="confirmNewPassword" name="confirmPassword" 
                                               placeholder="Confirma la nueva contraseña" required minlength="3">
                                        <button class="btn btn-outline-secondary" type="button" id="toggleConfirmNewPassword">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <div id="passwordError" class="text-danger mt-1" style="display: none;">
                                        Las contraseñas no coinciden
                                    </div>
                                </div>

                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <strong>Advertencia:</strong> El usuario deberá usar esta nueva contraseña para acceder al sistema.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-warning">
                                    <i class="fas fa-key"></i> Resetear Contraseña
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
        modal.show();

        // Configurar botones automáticamente sin comandos
        setTimeout(() => {
            RolesManager.autoFixPasswordButtons();
        }, 100);
        
        setTimeout(() => {
            RolesManager.autoFixPasswordButtons();
        }, 500);
        
        setTimeout(() => {
            RolesManager.autoFixPasswordButtons();
        }, 1000);

        // Configurar validación automáticamente SIN COMANDOS
        setTimeout(() => {
            RolesManager.autoSetupPasswordValidation();
        }, 200);
        
        // Asegurar que la validación funcione SIEMPRE
        setTimeout(() => {
            RolesManager.autoSetupPasswordValidation();
        }, 600);
        
        setTimeout(() => {
            RolesManager.autoSetupPasswordValidation();
        }, 1200);

        // Setup form handler
        document.getElementById('resetPasswordForm').addEventListener('submit', (e) => window.RolesManager.handlePasswordReset(e, modal));

        document.getElementById('resetPasswordModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static autoFixPasswordButtons() {
        console.log('🔧 Auto-arreglando botones de contraseña...');
        
        // Buscar modal
        const modal = document.getElementById('resetPasswordModal');
        if (!modal) return;

        // Arreglar botón de nueva contraseña
        const toggleNew = document.getElementById('toggleNewPassword');
        const inputNew = document.getElementById('newPassword');
        
        if (toggleNew && inputNew) {
            // Clonar para limpiar listeners
            const newToggle = toggleNew.cloneNode(true);
            toggleNew.parentNode.replaceChild(newToggle, toggleNew);
            
            newToggle.addEventListener('click', function(e) {
                e.preventDefault();
                const icon = this.querySelector('i');
                if (inputNew.type === 'password') {
                    inputNew.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    inputNew.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }

        // Arreglar botón de confirmar contraseña
        const toggleConfirm = document.getElementById('toggleConfirmNewPassword');
        const inputConfirm = document.getElementById('confirmNewPassword');
        
        if (toggleConfirm && inputConfirm) {
            // Clonar para limpiar listeners
            const newToggleConfirm = toggleConfirm.cloneNode(true);
            toggleConfirm.parentNode.replaceChild(newToggleConfirm, toggleConfirm);
            
            newToggleConfirm.addEventListener('click', function(e) {
                e.preventDefault();
                const icon = this.querySelector('i');
                if (inputConfirm.type === 'password') {
                    inputConfirm.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    inputConfirm.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
        
        console.log('✅ Botones auto-arreglados');
    }

    static setupPasswordToggle(buttonId, inputId) {
        const toggleButton = document.getElementById(buttonId);
        const passwordInput = document.getElementById(inputId);
        
        if (toggleButton && passwordInput) {
            toggleButton.addEventListener('click', function() {
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
    }

    static autoSetupPasswordValidation() {
        console.log('🔧 Configurando validación automática...');
        
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmNewPassword');
        const passwordError = document.getElementById('passwordError');
        const submitButton = document.querySelector('#resetPasswordForm button[type="submit"]');

        if (!newPassword || !confirmPassword || !submitButton) {
            console.log('❌ Elementos no encontrados, reintentando...');
            return;
        }

        console.log('✅ Elementos encontrados, configurando validación...');

        function validatePasswords() {
            const currentNewPassword = document.getElementById('newPassword');
            const currentConfirmPassword = document.getElementById('confirmNewPassword');
            const currentPasswordError = document.getElementById('passwordError');
            const currentSubmitButton = document.querySelector('#resetPasswordForm button[type="submit"]');
            
            if (!currentNewPassword || !currentConfirmPassword || !currentSubmitButton) return;
            
            const password = currentNewPassword.value;
            const confirmPass = currentConfirmPassword.value;

            console.log('🔍 Validando en tiempo real:', { password, confirmPass });

            // Limpiar estilos previos
            currentNewPassword.classList.remove('is-valid', 'is-invalid');
            currentConfirmPassword.classList.remove('is-valid', 'is-invalid');
            if (currentPasswordError) currentPasswordError.style.display = 'none';

            // SIEMPRE deshabilitar el botón hasta que TODO esté correcto
            currentSubmitButton.disabled = true;

            // Validar contraseña principal
            if (password.length === 0) {
                // Campo vacío - neutral
                return;
            }

            if (password.length < 3) {
                currentNewPassword.classList.add('is-invalid');
                console.log('❌ Contraseña muy corta');
                return;
            } else {
                currentNewPassword.classList.add('is-valid');
                console.log('✅ Contraseña válida');
            }

            // Validar confirmación
            if (confirmPass.length === 0) {
                // Confirmación vacía - esperar
                return;
            }

            if (password !== confirmPass) {
                currentConfirmPassword.classList.add('is-invalid');
                if (currentPasswordError) {
                    currentPasswordError.style.display = 'block';
                    currentPasswordError.textContent = 'Las contraseñas NO coinciden';
                }
                console.log('❌ Contraseñas NO coinciden');
                return;
            } else {
                currentConfirmPassword.classList.add('is-valid');
                console.log('✅ Contraseñas coinciden');
            }

            // TODO está correcto - habilitar botón
            if (password.length >= 3 && password === confirmPass) {
                currentSubmitButton.disabled = false;
                console.log('🎉 Formulario válido - botón habilitado');
            }
        }

        if (newPassword && confirmPassword) {
            // Deshabilitar botón inicialmente
            submitButton.disabled = true;
            console.log('🔒 Botón deshabilitado inicialmente');
            
            // Remover listeners anteriores clonando elementos
            const newPasswordClone = newPassword.cloneNode(true);
            const confirmPasswordClone = confirmPassword.cloneNode(true);
            
            newPassword.parentNode.replaceChild(newPasswordClone, newPassword);
            confirmPassword.parentNode.replaceChild(confirmPasswordClone, confirmPassword);
            
            // Agregar listeners a los elementos clonados
            newPasswordClone.addEventListener('input', validatePasswords);
            confirmPasswordClone.addEventListener('input', validatePasswords);
            newPasswordClone.addEventListener('keyup', validatePasswords);
            confirmPasswordClone.addEventListener('keyup', validatePasswords);
            newPasswordClone.addEventListener('paste', () => setTimeout(validatePasswords, 100));
            confirmPasswordClone.addEventListener('paste', () => setTimeout(validatePasswords, 100));
            
            console.log('✅ Validación configurada automáticamente');
        }
    }

    static async handlePasswordReset(e, modal) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const userId = formData.get('id');

        console.log('🔍 Validando contraseñas...');
        console.log('Password:', password);
        console.log('Confirm:', confirmPassword);

        // Validación ESTRICTA
        if (!password || password.trim() === '') {
            window.app.showToast('❌ La contraseña no puede estar vacía', 'danger');
            return;
        }

        if (!confirmPassword || confirmPassword.trim() === '') {
            window.app.showToast('❌ Debes confirmar la contraseña', 'danger');
            return;
        }

        if (password !== confirmPassword) {
            window.app.showToast('❌ Las contraseñas NO coinciden', 'danger');
            console.log('❌ CONTRASEÑAS DIFERENTES!');
            return;
        }

        if (password.length < 3) {
            window.app.showToast('❌ La contraseña debe tener al menos 3 caracteres', 'danger');
            return;
        }

        console.log('✅ Validación pasada');

        try {
            window.app.showToast('Reseteando contraseña...', 'info');
            
            const response = await fetch('api/roles/reset-password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    id: parseInt(userId),
                    password: password 
                })
            });

            const result = await response.json();

            if (result.success) {
                window.app.showToast('✅ Contraseña reseteada correctamente', 'success');
                modal.hide();
                window.RolesManager.loadData();
            } else {
                throw new Error(result.error || 'Error al resetear contraseña');
            }
        } catch (error) {
            window.app.showToast('Error al resetear contraseña: ' + error.message, 'danger');
        }
    }

    getRolePermissions(role) {
        const permissions = {
            'admin': ['Todos los permisos', 'Gestión completa', 'Configuración del sistema'],
            'supervisor': ['Ver reportes', 'Aprobar gastos', 'Gestionar vehículos', 'Ver transportistas'],
            'transportista': ['Registrar gastos', 'Ver propios gastos', 'Ver vehículo asignado']
        };
        return permissions[role] || [];
    }

    // Nueva función para cambiar contraseña
    static changePassword(userId) {
        const user = window.RolesManager.users.find(u => u.id === userId);
        if (!user) return;

        const modalHtml = `
            <div class="modal fade" id="changePasswordModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-key me-2"></i>
                                Cambiar Contraseña - ${user.nombre}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Establecer nueva contraseña para <strong>${user.nombre}</strong>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nueva Contraseña *</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="newPassword" placeholder="Mínimo 3 caracteres" required>
                                    <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('newPassword', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Confirmar Contraseña *</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="confirmNewPassword" placeholder="Repetir contraseña" required>
                                    <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('confirmNewPassword', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <div id="passwordMatch" class="form-text"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-info" onclick="RolesManager.saveNewPassword(${userId})">
                                <i class="fas fa-save me-1"></i>Cambiar Contraseña
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();

        document.getElementById('changePasswordModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static async saveNewPassword(userId) {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (!newPassword || newPassword.length < 3) {
            window.app.showToast('La contraseña debe tener al menos 3 caracteres', 'danger');
            return;
        }

        if (newPassword !== confirmPassword) {
            window.app.showToast('Las contraseñas no coinciden', 'danger');
            return;
        }

        try {
            window.app.showToast('Cambiando contraseña...', 'info');
            
            // LLAMAR A LA API PARA CAMBIAR LA CONTRASEÑA
            const response = await fetch('api/roles/reset-password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: userId,
                    password: newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                window.app.showToast('✅ Contraseña cambiada exitosamente', 'success');
                bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
                
                // Recargar lista de usuarios
                if (window.RolesManager) {
                    window.RolesManager.loadData();
                }
            } else {
                throw new Error(result.error || 'Error al cambiar contraseña');
            }
        } catch (error) {
            window.app.showToast('Error: ' + error.message, 'danger');
        }
    }

    static async toggleUserStatus(userId) {
        const user = window.RolesManager.users.find(u => u.id === userId);
        if (!user) return;

        const action = user.activo ? 'desactivar' : 'activar';
        const actionColor = user.activo ? 'warning' : 'success';
        const actionIcon = user.activo ? 'user-slash' : 'user-check';
        
        const modalHtml = `
            <div class="modal fade" id="toggleUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-${actionColor} text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-${actionIcon} me-2"></i>
                                ${action.charAt(0).toUpperCase() + action.slice(1)} Usuario
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>¿Qué significa ${action} un usuario?</strong>
                            </div>
                            ${user.activo ? `
                            <div class="mb-3">
                                <h6>🚫 Al desactivar este usuario:</h6>
                                <ul class="list-unstyled ms-3">
                                    <li>✗ No podrá iniciar sesión en el sistema</li>
                                    <li>✗ Perderá acceso a todas las funciones</li>
                                    <li>✗ Sus datos se conservan pero queda inactivo</li>
                                    <li>✓ Se puede reactivar en cualquier momento</li>
                                </ul>
                            </div>
                            ` : `
                            <div class="mb-3">
                                <h6>✅ Al activar este usuario:</h6>
                                <ul class="list-unstyled ms-3">
                                    <li>✓ Podrá iniciar sesión nuevamente</li>
                                    <li>✓ Recuperará acceso según su rol</li>
                                    <li>✓ Volverá a ser funcional en el sistema</li>
                                </ul>
                            </div>
                            `}
                            <div class="card">
                                <div class="card-body">
                                    <div class="d-flex align-items-center">
                                        <div class="user-avatar me-3" style="width: 50px; height: 50px;">
                                            ${user.nombre.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h6 class="mb-1">${user.nombre}</h6>
                                            <small class="text-muted">${user.email}</small><br>
                                            <span class="badge bg-${user.activo ? 'success' : 'danger'}">
                                                ${user.activo ? 'Actualmente Activo' : 'Actualmente Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-${actionColor}" onclick="RolesManager.confirmToggleStatus(${userId})">
                                <i class="fas fa-${actionIcon} me-1"></i>${action.charAt(0).toUpperCase() + action.slice(1)} Usuario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('toggleUserModal'));
        modal.show();
        
        document.getElementById('toggleUserModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static async confirmToggleStatus(userId) {
        try {
            const user = window.RolesManager.users.find(u => u.id === userId);
            const newStatus = user.activo ? 0 : 1;
            const action = user.activo ? 'desactivar' : 'activar';
            
            console.log(`🔄 ${action} usuario ID:`, userId, 'nuevo estado:', newStatus);
            window.app.showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ando usuario...`, 'info');
            
            const response = await window.app.apiCall('/LogisticaFinal/api/roles/update.php', {
                method: 'POST',
                body: JSON.stringify({
                    id: parseInt(userId),
                    rol: user.rol,
                    activo: newStatus
                })
            });

            console.log('📥 Respuesta del servidor:', response);

            if (response && response.success) {
                window.app.showToast(`✅ Usuario ${action}do exitosamente`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('toggleUserModal')).hide();
                await window.RolesManager.loadData();
            } else {
                console.error('❌ Respuesta de error:', response);
                window.app.showToast(`❌ Error al ${action} usuario`, 'danger');
            }
        } catch (error) {
            console.error('❌ Error completo:', error);
            window.app.showToast(`❌ Error al cambiar estado del usuario: ${error.message}`, 'danger');
        }
    }

    static async deleteUser(userId) {
        const user = window.RolesManager.users.find(u => u.id === userId);
        if (!user) return;

        const modalHtml = `
            <div class="modal fade" id="deleteUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-times me-2"></i>
                                Eliminar Usuario Permanentemente
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>⚠️ PELIGRO:</strong> Esta acción es IRREVERSIBLE
                            </div>
                            <div class="mb-3">
                                <h6>🗑️ Al eliminar este usuario:</h6>
                                <ul class="list-unstyled ms-3 text-danger">
                                    <li>✗ Se borrará permanentemente de la base de datos</li>
                                    <li>✗ Se perderán todos sus datos y registros</li>
                                    <li>✗ No se podrá recuperar la información</li>
                                    <li>✗ Afectará reportes e historial del sistema</li>
                                </ul>
                            </div>
                            <div class="alert alert-info">
                                <i class="fas fa-lightbulb me-2"></i>
                                <strong>Alternativa recomendada:</strong> En lugar de eliminar, considera <strong>desactivar</strong> al usuario. Esto mantiene los datos pero impide el acceso.
                            </div>
                            <div class="card">
                                <div class="card-body">
                                    <div class="d-flex align-items-center">
                                        <div class="user-avatar me-3" style="width: 50px; height: 50px;">
                                            ${user.nombre.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h6 class="mb-1">${user.nombre}</h6>
                                            <small class="text-muted">${user.email}</small><br>
                                            <span class="badge bg-${window.RolesManager.getRoleColor(user.rol)}">
                                                ${user.rol}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <label class="form-label">Para confirmar la eliminación, escribe: <strong>ELIMINAR PERMANENTEMENTE</strong></label>
                                <input type="text" class="form-control" id="confirmDeleteUserText" placeholder="Escribe: ELIMINAR PERMANENTEMENTE">
                                <small class="text-muted">Debes escribir exactamente: <strong>ELIMINAR PERMANENTEMENTE</strong></small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-warning" onclick="RolesManager.toggleUserStatus(${userId})" data-bs-dismiss="modal">
                                <i class="fas fa-user-slash me-1"></i>Mejor Desactivar
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteUserBtn" disabled onclick="RolesManager.confirmDeleteUser(${userId})">
                                <i class="fas fa-user-times me-1"></i>Eliminar Permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
        modal.show();
        
        // Validación en tiempo real
        const confirmInput = document.getElementById('confirmDeleteUserText');
        const confirmBtn = document.getElementById('confirmDeleteUserBtn');
        
        confirmInput.addEventListener('input', function() {
            if (this.value === 'ELIMINAR PERMANENTEMENTE') {
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('btn-secondary');
                confirmBtn.classList.add('btn-danger');
            } else {
                confirmBtn.disabled = true;
                confirmBtn.classList.add('btn-secondary');
                confirmBtn.classList.remove('btn-danger');
            }
        });
        
        document.getElementById('deleteUserModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static async confirmDeleteUser(userId) {
        try {
            console.log('🗑️ Eliminando usuario ID:', userId);
            window.app.showToast('Eliminando usuario...', 'info');
            
            const response = await window.app.apiCall('/LogisticaFinal/api/roles/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: parseInt(userId) })
            });

            console.log('📥 Respuesta del servidor:', response);

            if (response && response.success) {
                window.app.showToast('✅ Usuario eliminado permanentemente', 'success');
                bootstrap.Modal.getInstance(document.getElementById('deleteUserModal')).hide();
                await window.RolesManager.loadData();
            } else {
                console.error('❌ Respuesta de error:', response);
                window.app.showToast('❌ Error al eliminar usuario: ' + (response?.error || 'Error desconocido'), 'danger');
            }
        } catch (error) {
            console.error('❌ Error completo:', error);
            window.app.showToast('❌ Error al eliminar usuario: ' + error.message, 'danger');
        }
    }
}

// Función global para toggle de visibilidad de contraseña
window.togglePasswordVisibility = function(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
};

// Initialize Roles Manager
window.RolesManager = new RolesManager();
