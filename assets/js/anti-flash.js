// 🚫 Anti-Flash System - Elimina completamente el flash de datos antiguos
// Versión: 1.0.0

class AntiFlashSystem {
    constructor() {
        this.isInitialLoad = true;
        this.currentSection = null;
        this.dataTimestamps = new Map();
        this.init();
    }

    init() {
        console.log('🚫 Anti-Flash System inicializado');
        
        // Ocultar todo el contenido hasta que esté listo
        this.hideAllContent();
        
        // Interceptar cambios de sección
        this.interceptSectionChanges();
        
        // Limpiar datos antiguos al cargar
        this.clearOldData();
    }

    // Ocultar todo el contenido inicialmente
    hideAllContent() {
        const style = document.createElement('style');
        style.id = 'anti-flash-style';
        style.textContent = `
            /* Ocultar contenido hasta que esté listo */
            .main-content > section {
                opacity: 0 !important;
                visibility: hidden !important;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            .main-content > section.ready {
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            /* Mostrar skeleton mientras carga */
            .main-content > section.loading {
                opacity: 1 !important;
                visibility: visible !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Interceptar cambios de sección
    interceptSectionChanges() {
        // Observar cambios en las secciones
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const section = mutation.target;
                    if (section.classList.contains('active')) {
                        this.handleSectionChange(section);
                    }
                }
            });
        });

        // Observar todas las secciones
        document.querySelectorAll('.main-content > section').forEach(section => {
            observer.observe(section, { attributes: true });
        });
    }

    // Manejar cambio de sección
    async handleSectionChange(section) {
        const sectionId = section.id;
        console.log('🔄 Cambio de sección:', sectionId);

        // Marcar como loading
        section.classList.add('loading');
        section.classList.remove('ready');

        // Limpiar contenido anterior
        this.clearSectionContent(section);

        // Mostrar skeleton
        this.showSectionSkeleton(section);

        // Esperar a que los datos estén listos
        await this.waitForDataReady(sectionId);

        // Marcar como ready
        section.classList.remove('loading');
        section.classList.add('ready');
    }

    // Limpiar contenido de sección
    clearSectionContent(section) {
        const sectionId = section.id;
        
        // Limpiar contenedores específicos según la sección
        const containers = {
            'dashboardSection': ['dashboardContent'],
            'viajesSection': ['viajesContainer'],
            'gastosSection': ['gastosContainer', 'activityTable'],
            'vehiculosSection': ['vehiculosContainer'],
            'transportistasSection': ['transportistasContainer'],
            'reportesSection': ['reportesContainer']
        };

        const containerIds = containers[sectionId] || [];
        containerIds.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
            }
        });
    }

    // Mostrar skeleton según la sección
    showSectionSkeleton(section) {
        const sectionId = section.id;

        switch(sectionId) {
            case 'dashboardSection':
                const dashContent = document.getElementById('dashboardContent');
                if (dashContent && window.skeletonHelpers) {
                    window.skeletonHelpers.showDashboardSkeleton('dashboardContent');
                }
                break;

            case 'viajesSection':
                const viajesContainer = document.getElementById('viajesContainer');
                if (viajesContainer && window.skeletonHelpers) {
                    window.skeletonHelpers.showViajesSkeleton('viajesContainer', 6);
                }
                break;

            case 'gastosSection':
                const gastosContainer = document.querySelector('#gastosSection tbody');
                if (gastosContainer && window.skeletonHelpers) {
                    window.skeletonHelpers.showTableSkeleton('gastosSection', 8);
                }
                break;

            case 'transportistasSection':
                const transContainer = document.querySelector('#transportistasSection tbody');
                if (transContainer && window.skeletonHelpers) {
                    window.skeletonHelpers.showTransportistasSkeleton('transportistasSection', 8);
                }
                break;
        }
    }

    // Esperar a que los datos estén listos
    waitForDataReady(sectionId) {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                // Verificar si hay datos nuevos
                const hasNewData = this.checkForNewData(sectionId);
                
                if (hasNewData || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    // Verificar si hay datos nuevos
    checkForNewData(sectionId) {
        const containers = {
            'dashboardSection': 'dashboardContent',
            'viajesSection': 'viajesContainer',
            'gastosSection': 'gastosSection',
            'vehiculosSection': 'vehiculosContainer',
            'transportistasSection': 'transportistasSection'
        };

        const containerId = containers[sectionId];
        if (!containerId) return false;

        const container = document.getElementById(containerId);
        if (!container) return false;

        // Verificar si hay contenido real (no skeleton)
        const hasSkeleton = container.querySelector('.skeleton');
        const hasRealContent = container.querySelector('.card, tr, .stat-card');

        return !hasSkeleton && hasRealContent;
    }

    // Limpiar datos antiguos
    clearOldData() {
        console.log('🧹 Limpiando datos antiguos...');

        // Limpiar todos los contenedores
        const containerIds = [
            'dashboardContent',
            'viajesContainer',
            'gastosContainer',
            'vehiculosContainer',
            'transportistasContainer',
            'reportesContainer',
            'activityTable'
        ];

        containerIds.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '';
            }
        });

        // Limpiar cache de datos
        if (window.cacheManager) {
            // No limpiar usuario ni tema
            const keysToKeep = ['currentUser', 'theme'];
            
            // Limpiar solo datos de secciones
            ['viajes', 'gastos', 'vehiculos', 'transportistas', 'dashboard'].forEach(key => {
                window.cacheManager.remove(key);
            });
        }

        console.log('✅ Datos antiguos limpiados');
    }

    // Forzar recarga de datos
    forceDataReload(sectionId) {
        console.log('🔄 Forzando recarga de datos:', sectionId);

        // Limpiar cache de la sección
        if (window.cacheManager) {
            const cacheKey = sectionId.replace('Section', '');
            window.cacheManager.remove(cacheKey);
        }

        // Limpiar timestamp
        this.dataTimestamps.delete(sectionId);

        // Recargar datos
        this.reloadSectionData(sectionId);
    }

    // Recargar datos de sección
    reloadSectionData(sectionId) {
        // Llamar a la función de carga correspondiente
        const loadFunctions = {
            'dashboardSection': () => window.app?.dashboardManager?.loadData(),
            'viajesSection': () => window.ViajesManager?.loadTrips(),
            'gastosSection': () => window.GastosManager?.loadData(),
            'vehiculosSection': () => window.VehiculosManager?.loadData(),
            'transportistasSection': () => window.TransportistasManager?.loadData()
        };

        const loadFunction = loadFunctions[sectionId];
        if (loadFunction) {
            loadFunction();
        }
    }

    // Marcar sección como lista
    markSectionReady(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('loading');
            section.classList.add('ready');
            
            // Guardar timestamp
            this.dataTimestamps.set(sectionId, Date.now());
        }
    }

    // Verificar si los datos son recientes
    isDataFresh(sectionId, maxAge = 30000) { // 30 segundos
        const timestamp = this.dataTimestamps.get(sectionId);
        if (!timestamp) return false;

        const age = Date.now() - timestamp;
        return age < maxAge;
    }
}

// Inicializar globalmente
window.antiFlashSystem = new AntiFlashSystem();

// Función helper para marcar sección como lista
window.markSectionReady = (sectionId) => {
    if (window.antiFlashSystem) {
        window.antiFlashSystem.markSectionReady(sectionId);
    }
};

// Función helper para forzar recarga
window.forceDataReload = (sectionId) => {
    if (window.antiFlashSystem) {
        window.antiFlashSystem.forceDataReload(sectionId);
    }
};
