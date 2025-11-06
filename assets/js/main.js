// TransportePro - Sistema de Gestión Logística
class TransportePro {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboardSection';
        this.authToken = null;
        this.apiBase = 'api';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addSectionIndicatorStyles();
        this.checkSession();
        
        // Ocultar pantalla de carga inicial después de que todo esté listo
        this.hideLoadingScreen();
    }
    
    // Mostrar pantalla de carga
    showLoadingScreen(message = 'Cargando datos del sistema...') {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingMessage = document.getElementById('loadingMessage');
        const loadingProgress = document.getElementById('loadingProgress');
        
        if (loadingScreen) {
            loadingScreen.classList.remove('fade-out');
            loadingScreen.style.display = 'flex';
            loadingScreen.style.opacity = '1';
        }
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        
        if (loadingProgress) {
            loadingProgress.style.width = '0%';
        }
        
        console.log('🔄 Pantalla de carga mostrada:', message);
    }
    
    // Actualizar progreso de carga
    updateLoadingProgress(percent, message = null) {
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingProgress) {
            loadingProgress.style.width = `${percent}%`;
        }
        
        if (message && loadingMessage) {
            loadingMessage.textContent = message;
        }
        
        console.log(`📊 Progreso de carga: ${percent}%`, message || '');
    }
    
    // Ocultar pantalla de carga
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (loadingScreen) {
            // Animar salida
            loadingScreen.classList.add('fade-out');
            
            // Remover del DOM después de la animación
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
            
            console.log('✅ Pantalla de carga ocultada');
        }
    }

    addSectionIndicatorStyles() {
        // Agregar estilos CSS para el indicador de sección activa
        if (!document.getElementById('sectionIndicatorStyles')) {
            const style = document.createElement('style');
            style.id = 'sectionIndicatorStyles';
            style.textContent = `
                .nav-link {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    transition: all 0.3s ease;
                    text-align: left;
                    padding: 0.75rem 1rem;
                }
                
                .nav-link.active {
                    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                    border-left: 4px solid #007bff;
                    padding-left: calc(1rem - 4px);
                    box-shadow: 0 2px 8px rgba(0,123,255,0.2);
                }
                
                .section-indicator {
                    color: #007bff;
                    font-size: 0.8rem;
                    opacity: 0;
                    transform: translateX(-10px);
                    animation: slideInIndicator 0.3s ease forwards;
                    margin-left: auto;
                }
                
                @keyframes slideInIndicator {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .nav-link:hover {
                    background: rgba(255,255,255,0.05);
                    transform: translateX(3px);
                }
                
                .nav-link:hover:not(.active) {
                    border-left: 2px solid rgba(255,255,255,0.3);
                    padding-left: calc(1rem - 2px);
                }
                
                .nav-link i:first-child {
                    margin-right: 0.75rem;
                    width: 1.2rem;
                    text-align: center;
                    flex-shrink: 0;
                }
                
                .nav-link span {
                    flex-grow: 1;
                    text-align: left;
                }
            `;
            document.head.appendChild(style);
        }
    }

    checkSession() {
        const token = sessionStorage.getItem('authToken');
        const user = sessionStorage.getItem('currentUser');

        if (token && user) {
            this.authToken = token;
            this.currentUser = JSON.parse(user);
            this.showDashboard();
        }
    }

    // Función temporal para login automático de prueba
    autoLogin(role = 'Transportista') {
        let testUser;
        
        if (role === 'Administrador') {
            testUser = {
                id: 1,
                nombre: 'Admin Demo',
                email: 'admin@translogix.com',
                rol: 'Administrador'
            };
        } else if (role === 'Supervisor') {
            testUser = {
                id: 2,
                nombre: 'Supervisor Demo',
                email: 'supervisor@translogix.com',
                rol: 'Supervisor'
            };
        } else {
            testUser = {
                id: 3,
                nombre: 'Transportista Demo',
                email: 'transportista@translogix.com',
                rol: 'Transportista'
            };
        }
        
        this.authToken = 'test-token-123';
        this.currentUser = testUser;
        
        sessionStorage.setItem('authToken', this.authToken);
        sessionStorage.setItem('currentUser', JSON.stringify(testUser));
        
        this.showDashboard();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        window.toggleSidebar = () => {
            const sidebar = document.getElementById('sidebar');
            const body = document.body;
            
            sidebar.classList.toggle('active');
            
            if (sidebar.classList.contains('active')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'sidebar-backdrop';
                backdrop.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 1040;
                    display: none;
                `;
                
                if (window.innerWidth <= 767) {
                    backdrop.style.display = 'block';
                    body.appendChild(backdrop);
                    body.style.overflow = 'hidden';
                    
                    backdrop.addEventListener('click', () => {
                        sidebar.classList.remove('active');
                        backdrop.remove();
                        body.style.overflow = '';
                    });
                }
            } else {
                const existingBackdrop = document.querySelector('.sidebar-backdrop');
                if (existingBackdrop) {
                    existingBackdrop.remove();
                    body.style.overflow = '';
                }
            }
        };
        window.navigateTo = (sectionId, title) => this.navigateTo(sectionId, title);
        window.logout = () => this.logout();
    }

    async loadExternalScripts() {
        // Optimización: Cargar solo scripts esenciales al inicio
        window.scriptsLoaded = false;

        // Scripts críticos que se cargan inmediatamente
        const criticalScripts = [
            'assets/js/dashboard.js?v=' + Date.now()
        ];

        // Scripts que se cargan bajo demanda
        this.lazyScripts = {
            'vehiculos': 'assets/js/vehiculos.js?v=20250108224300',
            'transportistas': 'assets/js/transportistas.js',
            'reportes': 'assets/js/reportes.js?v=20250109014700',
            'roles': 'assets/js/roles.js?v=20250108222300'
        };

        try {
            // Cargar solo scripts críticos
            for (const script of criticalScripts) {
                await this.loadScript(script);
            }
            window.scriptsLoaded = true;
            console.log('Scripts críticos cargados - Carga optimizada');
        } catch (error) {
            console.error('Error cargando scripts críticos:', error);
        }

        // Inicializar conjunto de scripts cargados
        this.loadedScripts = new Set();
    }

    // Cargar script bajo demanda
    async loadScriptOnDemand(scriptKey) {
        if (this.loadedScripts && this.loadedScripts.has(scriptKey)) {
            return; // Ya está cargado
        }

        const scriptPath = this.lazyScripts[scriptKey];
        if (scriptPath) {
            try {
                await this.loadScript(scriptPath);
                if (!this.loadedScripts) this.loadedScripts = new Set();
                this.loadedScripts.add(scriptKey);
                console.log(`📦 Script ${scriptKey} cargado bajo demanda`);
            } catch (error) {
                console.error(`Error cargando script ${scriptKey}:`, error);
            }
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si el script ya fue cargado usando data-src
            const existingScript = document.querySelector(`script[data-src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            // Cache busting para evitar problemas
            const timestamp = Date.now();
            const script = document.createElement('script');
            script.src = `${src}?v=${timestamp}`;
            script.setAttribute('data-src', src);
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    async apiCall(endpoint, options = {}) {
        // Si el endpoint ya incluye la ruta completa, usarlo directamente
        const url = endpoint.startsWith('/') ? endpoint : `${this.apiBase}/${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showToast('Por favor complete todos los campos', 'error');
            return;
        }

        try {
            const response = await fetch('api/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success && data.user) {
                // Mostrar pantalla de carga
                this.showLoadingScreen('Iniciando sesión...');
                this.updateLoadingProgress(20, 'Limpiando datos anteriores...');
                
                // LIMPIAR CACHE DE DATOS DEL USUARIO ANTERIOR
                if (window.cacheManager) {
                    console.log('🧹 Limpiando cache al hacer login...');
                    ['viajes', 'gastos', 'vehiculos', 'transportistas', 'dashboard'].forEach(key => {
                        window.cacheManager.remove(key);
                    });
                }
                
                // LIMPIAR COMPLETAMENTE el caché del usuario anterior
                this.clearAllUserData();
                this.updateLoadingProgress(40, 'Configurando sesión...');
                
                // Usar datos reales de la base de datos
                this.authToken = data.token || 'auth-token-' + Date.now();
                this.currentUser = {
                    id: data.user.id,
                    nombre: data.user.name || data.user.nombre,
                    email: data.user.email,
                    rol: data.user.role || data.user.rol
                };
                
                sessionStorage.setItem('authToken', this.authToken);
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.updateLoadingProgress(60, 'Cargando interfaz...');
                
                this.showDashboard();
                
                // FORZAR RECARGA DEL DASHBOARD después de mostrar
                setTimeout(() => {
                    console.log('🔄 Forzando recarga del dashboard...');
                    if (this.dashboardManager) {
                        this.dashboardManager.loadData();
                    }
                }, 500);
                
                this.showToast(`Bienvenido ${this.currentUser.nombre}`, 'success');
            } else {
                this.showToast(data.message || 'Credenciales incorrectas', 'error');
            }
        } catch (error) {
            this.showToast('Error de conexión con el servidor', 'error');
        }
    }

    clearAllUserData() {
        console.log('🧹 Limpiando datos del usuario anterior...');
        
        // Limpiar datos de managers
        if (window.DashboardManager && typeof window.DashboardManager.clearAllData === 'function') {
            window.DashboardManager.clearAllData();
        } else if (window.DashboardManager) {
            // Fallback si el método no existe
            window.DashboardManager.data = {
                expenses: {},
                vehicles: {},
                viajes: {},
                recentActivity: []
            };
            if (window.DashboardManager.viajesChart) {
                try { window.DashboardManager.viajesChart.destroy(); } catch(e) {}
                window.DashboardManager.viajesChart = null;
            }
            if (window.DashboardManager.monthlyChart) {
                try { window.DashboardManager.monthlyChart.destroy(); } catch(e) {}
                window.DashboardManager.monthlyChart = null;
            }
            if (window.DashboardManager.expenseChartInstance) {
                try { window.DashboardManager.expenseChartInstance.destroy(); } catch(e) {}
                window.DashboardManager.expenseChartInstance = null;
            }
            if (window.DashboardManager.viajesChartInstance) {
                try { window.DashboardManager.viajesChartInstance.destroy(); } catch(e) {}
                window.DashboardManager.viajesChartInstance = null;
            }
        }
        
        if (window.GastosManagerInstance) {
            window.GastosManagerInstance.expenses = [];
            window.GastosManagerInstance.vehicles = [];
            window.GastosManagerInstance.allTrips = [];
            window.GastosManagerInstance.tripsEnRuta = [];
            window.GastosManagerInstance.vehiculoViajeMap = {};
            
            // Limpiar dropdowns
            const vehicleSelect = document.querySelector('select[name="vehiculo_id"]');
            if (vehicleSelect) {
                vehicleSelect.innerHTML = '<option value="">Seleccionar vehículo...</option>';
                vehicleSelect.disabled = false;
            }
            
            const viajeSelect = document.querySelector('select[name="viaje_id"]');
            if (viajeSelect) {
                viajeSelect.innerHTML = '<option value="">Primero seleccione un vehículo</option>';
                viajeSelect.disabled = true;
            }
            
            // Limpiar tablas de gastos
            const myExpensesTable = document.querySelector('#myExpensesTable tbody');
            if (myExpensesTable) {
                myExpensesTable.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
            }
            
            const allExpensesTable = document.querySelector('#allExpensesTable tbody');
            if (allExpensesTable) {
                allExpensesTable.innerHTML = '<tr><td colspan="8" class="text-center">Cargando...</td></tr>';
            }
        }
        
        if (window.ViajesManager) {
            window.ViajesManager.viajes = [];
            window.ViajesManager.trips = [];
            window.ViajesManager.vehicles = [];
            window.ViajesManager.transportistas = [];
            window.ViajesManager.solicitudesPendientes = [];
            window.ViajesManager.solicitudesFinalizacion = [];
            
            // Limpiar contenedor de viajes
            const viajesContainer = document.getElementById('viajesContainer');
            if (viajesContainer) {
                viajesContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Cargando viajes...</p></div>';
            }
        }
        
        // Limpiar contenedores del dashboard
        const todayTripsContainer = document.getElementById('todayTripsContainer');
        if (todayTripsContainer) {
            todayTripsContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';
        }
        
        // Limpiar estadísticas
        const statsElements = [
            'totalExpenses', 'totalVehicles', 'totalTrips', 
            'pendingTrips', 'activeTrips', 'completedTrips'
        ];
        statsElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '0';
            }
        });
        
        console.log('✅ Datos del usuario anterior limpiados completamente');
    }

    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) {
            loginScreen.style.display = 'none';
            loginScreen.style.visibility = 'hidden';
            loginScreen.classList.add('d-none');
        }
        if (dashboard) {
            dashboard.style.display = 'block';
            dashboard.style.visibility = 'visible';
            dashboard.classList.remove('d-none');
        }
        
        this.updateLoadingProgress(70, 'Configurando interfaz...');
        
        this.setupUserInterface();
        this.notifyUserChange();
        this.navigateTo('dashboardSection', 'Dashboard');
        
        this.updateLoadingProgress(80, 'Cargando datos...');
        
        // FORZAR recarga de datos después de un pequeño delay
        setTimeout(async () => {
            console.log('🔄 Forzando recarga de datos del nuevo usuario...');
            
            try {
                if (window.DashboardManager && typeof window.DashboardManager.loadData === 'function') {
                    this.updateLoadingProgress(90, 'Cargando dashboard...');
                    await window.DashboardManager.loadData();
                }
                
                this.updateLoadingProgress(100, '¡Listo!');
                
                // Ocultar pantalla de carga después de que todo esté cargado
                setTimeout(() => {
                    this.hideLoadingScreen();
                }, 500);
                
            } catch (error) {
                console.error('❌ Error cargando datos:', error);
                // Ocultar pantalla de carga incluso si hay error
                this.hideLoadingScreen();
            }
        }, 500);
        
        // FORZAR recarga completa de datos del nuevo usuario
        setTimeout(() => {
            console.log('🔄 Iniciando recarga de datos para nuevo usuario...');
            
            if (window.DashboardManager) {
                // Limpiar datos anteriores antes de cargar nuevos
                window.DashboardManager.data = {
                    expenses: {},
                    vehicles: {},
                    viajes: {},
                    recentActivity: []
                };
                // Forzar recarga con timestamp para evitar caché
                window.DashboardManager.isLoading = false;
                window.DashboardManager.loadData();
            }
            
            if (window.GastosManagerInstance) {
                // Limpiar y recargar datos de gastos
                window.GastosManagerInstance.expenses = [];
                window.GastosManagerInstance.vehicles = [];
                window.GastosManagerInstance.allTrips = [];
                window.GastosManagerInstance.tripsEnRuta = [];
                window.GastosManagerInstance.vehiculoViajeMap = {};
                
                // Forzar recarga de vehículos y viajes
                window.GastosManagerInstance.loadVehicles();
            }
            
            console.log('✅ Recarga de datos iniciada');
        }, 150);
    }

    updateUserInfo() {
        const userNameSpan = document.getElementById('userName');
        const userRoleSpan = document.getElementById('userRole');
        const userAvatar = document.querySelector('.user-avatar');

        if (this.currentUser) {
            if (userNameSpan) {
                userNameSpan.textContent = this.currentUser.name || this.currentUser.nombre || 'Usuario';
            }
            if (userRoleSpan) {
                const role = this.currentUser.role || this.currentUser.rol || 'usuario';
                userRoleSpan.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            }
            if (userAvatar) {
                const name = this.currentUser.name || this.currentUser.nombre || 'U';
                const initials = name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
                userAvatar.textContent = initials;
            }
            
            // Agregar atributo data-role al body para CSS
            const role = this.currentUser.role || this.currentUser.rol || 'usuario';
            document.body.setAttribute('data-role', role.toLowerCase());
        }
    }

    setupUserInterface() {
        this.updateUserInfo();
        this.generateNavMenu();
    }

    notifyUserChange() {
        // Actualizar ViajesManager si existe
        if (window.ViajesManager && typeof window.ViajesManager.actualizarVistaPorRol === 'function') {
            window.ViajesManager.actualizarVistaPorRol();
            
            // Forzar recarga de datos si está en la sección de viajes
            const viajesSection = document.getElementById('viajesSection');
            if (viajesSection && viajesSection.classList.contains('active')) {
                setTimeout(() => {
                    window.ViajesManager.loadTrips();
                }, 100);
            }
        }
        
        // Actualizar otros managers si es necesario
        if (window.DashboardManager && typeof window.DashboardManager.updateUserInfo === 'function') {
            window.DashboardManager.updateUserInfo();
        }
    }

    switchUser(newUserData) {
        this.currentUser = newUserData;
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.updateUserInfo();
        this.notifyUserChange();
        this.generateNavMenu();
        
        this.showToast(`Cambiado a: ${newUserData.name || newUserData.nombre} (${newUserData.role || newUserData.rol})`, 'info');
    }
    
    // Función para mostrar/ocultar contraseña del login
    toggleLoginPassword() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('togglePasswordIcon');
        
        if (passwordInput && toggleIcon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        } else {
            console.error('❌ Elementos del login no encontrados');
        }
    }

    generateNavMenu() {
        const navMenu = document.getElementById('navMenu');
        if (!navMenu) return;

        // Menú basado en roles de la base de datos
        let menuItems = [];
        const userRole = this.currentUser?.rol || 'transportista';

        // Normalizar el rol (puede venir como 'admin', 'Administrador', etc.)
        const normalizedRole = userRole.toLowerCase();

        if (normalizedRole === 'admin' || normalizedRole === 'administrador') {
            menuItems = [
                { id: 'dashboardSection', icon: 'fas fa-tachometer-alt', text: 'Dashboard', title: 'Dashboard' },
                { id: 'viajesSection', icon: 'fas fa-route', text: 'Gestión de Viajes', title: 'Gestión de Viajes' },
                { id: 'gastosSection', icon: 'fas fa-receipt', text: 'Registro de Gastos', title: 'Registro de Gastos' },
                { id: 'vehiculosSection', icon: 'fas fa-truck', text: 'Vehículos', title: 'Vehículos' },
                { id: 'transportistasSection', icon: 'fas fa-users', text: 'Transportistas', title: 'Transportistas' },
                { id: 'reportesSection', icon: 'fas fa-chart-bar', text: 'Reportes', title: 'Reportes' },
                { id: 'rolesSection', icon: 'fas fa-user-shield', text: 'Roles y Permisos', title: 'Roles y Permisos' }
            ];
        } else if (normalizedRole === 'supervisor') {
            menuItems = [
                { id: 'dashboardSection', icon: 'fas fa-tachometer-alt', text: 'Dashboard', title: 'Dashboard' },
                { id: 'viajesSection', icon: 'fas fa-route', text: 'Gestión de Viajes', title: 'Gestión de Viajes' },
                { id: 'gastosSection', icon: 'fas fa-receipt', text: 'Registro de Gastos', title: 'Registro de Gastos' },
                { id: 'vehiculosSection', icon: 'fas fa-truck', text: 'Vehículos', title: 'Vehículos' },
                { id: 'transportistasSection', icon: 'fas fa-users', text: 'Transportistas', title: 'Transportistas' },
                { id: 'reportesSection', icon: 'fas fa-chart-bar', text: 'Reportes', title: 'Reportes' }
            ];
        } else { // transportista o cualquier otro rol
            menuItems = [
                { id: 'dashboardSection', icon: 'fas fa-tachometer-alt', text: 'Dashboard', title: 'Dashboard' },
                { id: 'viajesSection', icon: 'fas fa-route', text: 'Mis Viajes', title: 'Mis Viajes' },
                { id: 'gastosSection', icon: 'fas fa-receipt', text: 'Mis Gastos', title: 'Mis Gastos' }
            ];
        }

        navMenu.innerHTML = '';
        
        menuItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            
            const a = document.createElement('a');
            a.className = 'nav-link';
            a.href = '#';
            a.onclick = (e) => {
                e.preventDefault();
                this.navigateTo(item.id, item.title);
            };
            
            a.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.text}</span>
            `;
            
            li.appendChild(a);
            navMenu.appendChild(li);
        });

        // NO agregar botón de logout aquí - ya existe en el header
    }

    navigateTo(sectionId, title) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Actualizar título de la página y del encabezado
        if (title) {
            document.title = `${title} - TransportePro`;
            // Actualizar el h1 del encabezado
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = title;
            }
        }

        // Actualizar indicador visual de sección activa
        const navItems = document.querySelectorAll('.nav-link');
        navItems.forEach(item => {
            item.classList.remove('active');
            // Remover indicador visual
            const indicator = item.querySelector('.section-indicator');
            if (indicator) {
                indicator.remove();
            }
        });

        // Encontrar y marcar el elemento activo
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const linkText = link.textContent.trim();
                const sectionMap = {
                    'dashboardSection': 'Dashboard',
                    'gastosSection': ['Registro de Gastos', 'Mis Gastos'],
                    'viajesSection': ['Gestión de Viajes', 'Mis Viajes'],
                    'vehiculosSection': 'Vehículos',
                    'transportistasSection': 'Transportistas',
                    'reportesSection': 'Reportes',
                    'rolesSection': 'Roles y Permisos'
                };
                
                const expectedTexts = sectionMap[sectionId];
                const isMatch = Array.isArray(expectedTexts) 
                    ? expectedTexts.includes(linkText)
                    : linkText === expectedTexts;
                
                if (isMatch) {
                    link.classList.add('active');
                    // Agregar indicador visual
                    const indicator = document.createElement('div');
                    indicator.className = 'section-indicator';
                    indicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
                    link.appendChild(indicator);
                }
            });
        }

        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboardSection':
                if (window.DashboardManager) {
                    // Cargar Chart.js antes de cargar el dashboard
                    if (window.loadChartJS) {
                        window.loadChartJS().then(() => {
                            console.log('📊 Chart.js listo, cargando dashboard...');
                            window.DashboardManager.loadData();
                        }).catch((error) => {
                            console.error('❌ Error cargando Chart.js:', error);
                            // Cargar dashboard sin gráficos
                            window.DashboardManager.loadData();
                        });
                    } else {
                        window.DashboardManager.loadData();
                    }
                }
                break;
            case 'gastosSection':
                if (window.GastosManagerInstance) {
                    window.GastosManagerInstance.loadData();
                }
                break;
            case 'viajesSection':
                if (window.ViajesManager) {
                    // Primero cargar datos, luego aplicar restricciones
                    window.ViajesManager.loadTrips();
                    
                    // Aplicar restricciones después de un pequeño delay
                    setTimeout(() => {
                        if (typeof window.ViajesManager.actualizarVistaPorRol === 'function') {
                            window.ViajesManager.actualizarVistaPorRol();
                        }
                        // Forzar configuración de restricciones
                        if (typeof window.ViajesManager.configurarRestricciones === 'function') {
                            window.ViajesManager.configurarRestricciones();
                        }
                    }, 200);
                }
                break;
            case 'vehiculosSection':
                // Cargar script bajo demanda
                this.loadScriptOnDemand('vehiculos').then(() => {
                    if (window.VehiculosManager) {
                        window.VehiculosManager.loadData();
                    }
                });
                break;
            case 'transportistasSection':
                // Cargar script bajo demanda
                this.loadScriptOnDemand('transportistas').then(() => {
                    if (window.TransportistasManager) {
                        window.TransportistasManager.loadData();
                    }
                });
                break;
            case 'reportesSection':
                // Cargar script bajo demanda
                this.loadScriptOnDemand('reportes').then(() => {
                    if (window.ReportesManagerInstance) {
                        window.ReportesManagerInstance.loadData();
                    } else if (window.ReportesManager) {
                        window.ReportesManager.loadData();
                    }
                });
                break;
            case 'rolesSection':
                // Cargar script bajo demanda
                this.loadScriptOnDemand('roles').then(() => {
                    if (window.RolesManager) {
                        window.RolesManager.loadData();
                    }
                });
                break;
        }
    }

    logout() {
        // Mostrar pantalla de carga
        this.showLoadingScreen('Cerrando sesión...');
        this.updateLoadingProgress(30, 'Limpiando datos...');
        
        // LIMPIAR DASHBOARD Y GRÁFICAS
        if (this.dashboardManager) {
            console.log('🧹 Limpiando dashboard...');
            this.dashboardManager.clearAllData();
        }
        
        // LIMPIAR CACHE DE DATOS
        if (window.cacheManager) {
            console.log('🧹 Limpiando cache de datos...');
            ['viajes', 'gastos', 'vehiculos', 'transportistas', 'dashboard'].forEach(key => {
                window.cacheManager.remove(key);
            });
        }
        
        // LIMPIAR COMPLETAMENTE todos los datos antes de cerrar sesión
        this.clearAllUserData();
        this.updateLoadingProgress(60, 'Finalizando sesión...');
        
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        
        this.authToken = null;
        this.currentUser = null;
        
        const dashboard = document.getElementById('dashboard');
        const loginScreen = document.getElementById('loginScreen');
        
        if (dashboard) {
            dashboard.style.display = 'none';
            dashboard.style.visibility = 'hidden';
            dashboard.classList.add('d-none');
        }
        
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.visibility = 'visible';
            loginScreen.classList.remove('d-none');
            
            // Asegurar que el loginScreen esté completamente visible
            setTimeout(() => {
                if (loginScreen) {
                    loginScreen.style.opacity = '1';
                }
            }, 50);
        }
        
        // Limpiar el menú de navegación
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.innerHTML = '';
        }
        
        // Limpiar información del usuario
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userNameElement) userNameElement.textContent = 'Usuario';
        if (userRoleElement) userRoleElement.textContent = 'Sin rol';
        if (userAvatar) userAvatar.textContent = '--';
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        
        this.updateLoadingProgress(100, 'Sesión cerrada');
        
        // Ocultar pantalla de carga después de un momento
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showToast('Sesión cerrada correctamente', 'info');
        }, 800);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

class ThemeManager {
    constructor() {
        // Cargar tema guardado o usar claro por defecto
        this.currentTheme = localStorage.getItem('translogix-theme') || 'light';
        this.applyTheme();
        this.updateThemeIcon();
    }

    applyTheme() {
        // Aplicar el tema al documento
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Agregar clase al body para compatibilidad
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${this.currentTheme}`);
        
        // Actualizar meta theme-color para móviles
        this.updateMetaThemeColor();
        
        console.log(`🎨 Tema aplicado: ${this.currentTheme}`);
    }

    toggleTheme() {
        // Cambiar entre light y dark
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Guardar preferencia
        localStorage.setItem('translogix-theme', this.currentTheme);
        
        // Aplicar nuevo tema
        this.applyTheme();
        this.updateThemeIcon();
        
        // Mostrar notificación
        const themeText = this.currentTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro';
        const themeIcon = this.currentTheme === 'dark' ? '🌙' : '☀️';
        
        if (window.app) {
            window.app.showToast(`${themeIcon} ${themeText} activado`, 'success');
        }
        
        console.log(`🎨 Tema cambiado a: ${this.currentTheme}`);
    }

    updateThemeIcon() {
        const themeBtn = document.getElementById('sidebarThemeToggle');
        if (themeBtn) {
            const icon = themeBtn.querySelector('i');
            if (icon) {
                // Cambiar icono según el tema
                icon.className = this.currentTheme === 'dark' 
                    ? 'fas fa-sun' 
                    : 'fas fa-moon';
            }
            
            // Actualizar tooltip
            themeBtn.title = this.currentTheme === 'dark' 
                ? 'Cambiar a modo claro' 
                : 'Cambiar a modo oscuro';
        }
    }

    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        // Colores para la barra de estado del móvil
        const themeColors = {
            light: '#ffffff',
            dark: '#0f1419'
        };
        
        metaThemeColor.content = themeColors[this.currentTheme];
    }

    // Método para forzar un tema específico
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.currentTheme = theme;
            localStorage.setItem('translogix-theme', this.currentTheme);
            this.applyTheme();
            this.updateThemeIcon();
        }
    }

    // Obtener tema actual
    getCurrentTheme() {
        return this.currentTheme;
    }
}

function switchUser(userData) {
    if (window.app) {
        window.app.switchUser(userData);
    }
}

function notifyUserChange() {
    if (window.app) {
        window.app.notifyUserChange();
    }
}

window.showSection = function(sectionId) {
    if (window.app) {
        window.app.navigateTo(sectionId);
    }
};

// Funciones globales para botones de acción
window.verItem = function(id, tipo) {
    switch(tipo) {
        case 'gasto':
            if (window.GastosManagerInstance && window.GastosManagerInstance.verGasto) {
                window.GastosManagerInstance.verGasto(id);
            }
            break;
        case 'viaje':
            if (window.ViajesManager && window.ViajesManager.verViaje) {
                window.ViajesManager.verViaje(id);
            }
            break;
        case 'vehiculo':
            if (window.VehiculosManager && window.VehiculosManager.verVehiculo) {
                window.VehiculosManager.verVehiculo(id);
            }
            break;
        case 'transportista':
            if (window.TransportistasManager && window.TransportistasManager.verTransportista) {
                window.TransportistasManager.verTransportista(id);
            }
            break;
    }
};

window.editarItem = function(id, tipo) {
    switch(tipo) {
        case 'gasto':
            if (window.GastosManagerInstance && window.GastosManagerInstance.editarGasto) {
                window.GastosManagerInstance.editarGasto(id);
            }
            break;
        case 'viaje':
            if (window.ViajesManager && window.ViajesManager.editarViaje) {
                window.ViajesManager.editarViaje(id);
            }
            break;
        case 'vehiculo':
            if (window.VehiculosManager && window.VehiculosManager.editarVehiculo) {
                window.VehiculosManager.editarVehiculo(id);
            }
            break;
        case 'transportista':
            if (window.TransportistasManager && window.TransportistasManager.editarTransportista) {
                window.TransportistasManager.editarTransportista(id);
            }
            break;
    }
};

window.eliminarItem = function(id, tipo) {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
        return;
    }
    
    switch(tipo) {
        case 'gasto':
            if (window.GastosManagerInstance && window.GastosManagerInstance.eliminarGasto) {
                window.GastosManagerInstance.eliminarGasto(id);
            }
            break;
        case 'viaje':
            if (window.ViajesManager && window.ViajesManager.eliminarViaje) {
                window.ViajesManager.eliminarViaje(id);
            }
            break;
        case 'vehiculo':
            if (window.VehiculosManager && window.VehiculosManager.eliminarVehiculo) {
                window.VehiculosManager.eliminarVehiculo(id);
            }
            break;
        case 'transportista':
            if (window.TransportistasManager && window.TransportistasManager.eliminarTransportista) {
                window.TransportistasManager.eliminarTransportista(id);
            }
            break;
    }
};

document.addEventListener('DOMContentLoaded', function () {
    window.themeManager = new ThemeManager();
    window.app = new TransportePro();
    
    // Conectar botón de tema (temporalmente deshabilitado)
    const themeToggleBtn = document.getElementById('sidebarThemeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            window.themeManager.toggleTheme();
        });
    }
    
    // Funciones globales para login rápido desde consola
    window.quickLogin = function(role = 'Transportista') {
        if (window.app) {
            window.app.autoLogin(role);
        }
    };
    
    // Función para debug del usuario actual
    window.debugUser = function() {
        if (window.app && window.app.currentUser) {
            return window.app.currentUser;
        }
        return 'No hay usuario logueado';
    };
    
    window.loginAdmin = function() {
        if (window.app) {
            window.app.autoLogin('Administrador');
        }
    };
    
    window.loginSupervisor = function() {
        if (window.app) {
            window.app.autoLogin('Supervisor');
        }
    };
    
    window.loginTransportista = function() {
        if (window.app) {
            window.app.autoLogin('Transportista');
        }
    };
    
    // Función para refrescar información del usuario
    window.refreshUserInfo = function() {
        if (window.app) {
            window.app.updateUserInfo();
        }
    };
    
    // Función global de logout
    window.logout = function() {
        if (window.app) {
            window.app.logout();
        }
    };
    
    // Función para forzar logout y recarga si es necesario
    window.forceLogout = function() {
        sessionStorage.clear();
        localStorage.removeItem('authToken');
        window.location.reload();
    };

    window.app.loadExternalScripts().then(() => {
        setTimeout(() => {
            try {
                if (typeof GastosManager !== 'undefined' && !window.GastosManagerInstance) {
                    window.GastosManagerInstance = new GastosManager();
                }
                if (typeof VehiculosManager !== 'undefined' && !window.VehiculosManager) {
                    window.VehiculosManager = new VehiculosManager();
                }
                if (typeof TransportistasManager !== 'undefined' && !window.TransportistasManager) {
                    window.TransportistasManager = new TransportistasManager();
                }
                if (typeof RolesManager !== 'undefined' && !window.RolesManager) {
                    window.RolesManager = new RolesManager();
                }
                if (typeof ReportesManager !== 'undefined' && !window.ReportesManager) {
                    window.ReportesManager = new ReportesManager();
                }
                // ReportesManagerInstance ya se crea automáticamente en reportes.js
                if (typeof DashboardManager !== 'undefined' && !window.DashboardManager) {
                    window.DashboardManager = new DashboardManager();
                }
            } catch (error) {
                // Silent error handling
            }
        }, 100);
    });
});

window.switchToAdmin = function() {
    switchUser({
        id: 1,
        nombre: 'Administrador Principal',
        rol: 'Administrador',
        email: 'admin@transportepro.com'
    });
};

window.switchToSupervisor = function() {
    switchUser({
        id: 2,
        nombre: 'Supervisor General',
        rol: 'Supervisor',
        email: 'supervisor@transportepro.com'
    });
};

window.switchToTransportista = function() {
    switchUser({
        id: 3,
        nombre: 'Transportista Demo',
        rol: 'Transportista',
        email: 'transportista@transportepro.com'
    });
};

// ========================================
// MOBILE SECTION SELECTOR
// ========================================

/**
 * Maneja el cambio de sección desde el selector móvil
 * Respeta los roles de usuario y oculta opciones no permitidas
 */
window.handleMobileSectionChange = function(sectionId) {
    if (!sectionId) return;
    
    // Obtener el título de la sección
    const sectionTitles = {
        'dashboardSection': 'Dashboard',
        'viajesSection': 'Viajes',
        'gastosSection': 'Gastos',
        'transportistasSection': 'Transportistas',
        'vehiculosSection': 'Vehículos',
        'reportesSection': 'Reportes',
        'rolesSection': 'Roles y Permisos'
    };
    
    const title = sectionTitles[sectionId] || 'Dashboard';
    
    // Actualizar botones activos y hacer scroll al botón activo
    const buttons = document.querySelectorAll('.mobile-nav-btn:not(.mobile-action-btn)');
    let activeButton = null;
    
    buttons.forEach(btn => {
        if (btn.getAttribute('data-section') === sectionId) {
            btn.classList.add('active');
            activeButton = btn;
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Hacer scroll al botón activo
    if (activeButton) {
        const container = activeButton.closest('.mobile-nav-buttons');
        if (container) {
            const buttonLeft = activeButton.offsetLeft;
            const buttonWidth = activeButton.offsetWidth;
            const containerWidth = container.offsetWidth;
            const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
            
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }
    
    // Navegar a la sección usando la función existente
    if (window.app && typeof window.app.navigateTo === 'function') {
        window.app.navigateTo(sectionId, title);
    }
    
    // Cerrar el sidebar si está abierto en móvil
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        const backdrop = document.querySelector('.sidebar-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        document.body.style.overflow = '';
    }
};

/**
 * Actualiza el selector móvil basado en el rol del usuario
 * Oculta opciones que el usuario no tiene permiso de ver
 */
window.updateMobileSelectorByRole = function() {
    const buttons = document.querySelectorAll('.mobile-nav-btn');
    if (!buttons.length) return;
    
    const currentUser = window.app?.currentUser;
    if (!currentUser) return;
    
    const userRole = (currentUser.rol || currentUser.role || 'transportista').toLowerCase();
    
    // Obtener todos los botones
    buttons.forEach(button => {
        const allowedRoles = button.getAttribute('data-role');
        
        // Si no tiene restricción de rol, mostrar siempre
        if (!allowedRoles) {
            button.style.display = 'flex';
            return;
        }
        
        // Verificar si el rol del usuario está permitido
        const rolesArray = allowedRoles.split(',').map(r => r.trim().toLowerCase());
        
        if (rolesArray.includes(userRole)) {
            button.style.display = 'flex';
        } else {
            button.style.display = 'none';
        }
    });
};

/**
 * Sincroniza el selector móvil con la sección activa
 */
window.syncMobileSelectorWithSection = function() {
    const buttons = document.querySelectorAll('.mobile-nav-btn:not(.mobile-action-btn)');
    if (!buttons.length) return;
    
    // Encontrar la sección activa
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        const sectionId = activeSection.id;
        
        // Actualizar botones
        buttons.forEach(btn => {
            if (btn.getAttribute('data-section') === sectionId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Sincronizar el icono del tema
    syncMobileThemeIcon();
};

// Inicializar el selector móvil cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que el usuario esté cargado
    setTimeout(() => {
        updateMobileSelectorByRole();
        syncMobileSelectorWithSection();
    }, 500);
    
    // También actualizar cuando se muestre el dashboard
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const dashboard = document.getElementById('dashboard');
                if (dashboard && !dashboard.classList.contains('d-none')) {
                    setTimeout(() => {
                        updateMobileSelectorByRole();
                        syncMobileSelectorWithSection();
                    }, 200);
                }
            }
        });
    });
    
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        observer.observe(dashboard, { attributes: true });
    }
});

// Actualizar el selector cuando cambie el usuario o la sección
window.addEventListener('load', function() {
    // Esperar a que window.app esté disponible
    const checkApp = setInterval(() => {
        if (window.app) {
            clearInterval(checkApp);
            
            // Interceptar switchUser
            const originalSwitchUser = window.app.switchUser;
            if (originalSwitchUser) {
                window.app.switchUser = function(...args) {
                    originalSwitchUser.apply(this, args);
                    setTimeout(() => {
                        updateMobileSelectorByRole();
                        syncMobileSelectorWithSection();
                    }, 100);
                };
            }
            
            // Interceptar navigateTo
            const originalNavigateTo = window.app.navigateTo;
            if (originalNavigateTo) {
                window.app.navigateTo = function(...args) {
                    originalNavigateTo.apply(this, args);
                    setTimeout(() => {
                        syncMobileSelectorWithSection();
                    }, 50);
                };
            }
            
            // Interceptar showDashboard para actualizar el selector
            const originalShowDashboard = window.app.showDashboard;
            if (originalShowDashboard) {
                window.app.showDashboard = function(...args) {
                    originalShowDashboard.apply(this, args);
                    setTimeout(() => {
                        updateMobileSelectorByRole();
                        syncMobileSelectorWithSection();
                    }, 300);
                };
            }
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => clearInterval(checkApp), 5000);
});

// ========================================
// MOBILE THEME TOGGLE
// ========================================

/**
 * Cambia el tema desde el botón móvil
 */
window.toggleMobileTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Cambiar el tema
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Actualizar el icono del botón móvil
    const mobileThemeBtn = document.getElementById('mobileThemeToggle');
    if (mobileThemeBtn) {
        const icon = mobileThemeBtn.querySelector('i');
        if (icon) {
            if (newTheme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
    
    // También actualizar el botón del sidebar si existe
    const sidebarThemeBtn = document.getElementById('sidebarThemeToggle');
    if (sidebarThemeBtn) {
        const icon = sidebarThemeBtn.querySelector('i');
        if (icon) {
            if (newTheme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
    
    console.log('🌓 Tema cambiado a:', newTheme);
};

/**
 * Sincroniza el icono del botón móvil con el tema actual
 */
window.syncMobileThemeIcon = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const mobileThemeBtn = document.getElementById('mobileThemeToggle');
    
    if (mobileThemeBtn) {
        const icon = mobileThemeBtn.querySelector('i');
        if (icon) {
            if (currentTheme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
};

// Sincronizar el icono cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        syncMobileThemeIcon();
    }, 100);
});


// ========================================
// MOBILE NAVIGATION STICKY BEHAVIOR
// ========================================

/**
 * Maneja el comportamiento sticky de la barra de navegación móvil
 * Agrega efectos visuales cuando el usuario hace scroll
 */
(function() {
    let lastScrollTop = 0;
    let ticking = false;
    
    function handleMobileNavScroll() {
        const mobileNav = document.querySelector('.mobile-section-selector');
        if (!mobileNav) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Agregar clase 'scrolled' cuando se hace scroll hacia abajo
        if (scrollTop > 10) {
            mobileNav.classList.add('scrolled');
        } else {
            mobileNav.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }
    
    // Usar requestAnimationFrame para mejor performance
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(handleMobileNavScroll);
            ticking = true;
        }
    }
    
    // Detectar scroll solo en móviles
    function initMobileNavScroll() {
        if (window.innerWidth <= 768) {
            window.addEventListener('scroll', requestTick, { passive: true });
        }
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNavScroll);
    } else {
        initMobileNavScroll();
    }
    
    // Reinicializar si cambia el tamaño de la ventana
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Remover listener anterior si existe
            window.removeEventListener('scroll', requestTick);
            // Reinicializar
            initMobileNavScroll();
        }, 250);
    });
})();
