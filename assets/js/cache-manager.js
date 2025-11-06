// 🚀 Cache Manager - Sistema de gestión de caché inteligente
// Versión: 2.0.0 - Optimizado para rendimiento

class CacheManager {
    constructor() {
        this.version = '2.0.0';
        this.cachePrefix = 'translogix_';
        this.maxAge = 5 * 60 * 1000; // 5 minutos
        this.init();
    }

    init() {
        console.log('🚀 Cache Manager inicializado v' + this.version);
        this.clearOldCache();
        this.setupVersionControl();
    }

    // Limpiar cache antiguo
    clearOldCache() {
        const currentVersion = localStorage.getItem(this.cachePrefix + 'version');
        
        if (currentVersion !== this.version) {
            console.log('🧹 Limpiando cache antiguo...');
            
            // Limpiar localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.cachePrefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                if (key !== this.cachePrefix + 'currentUser' && 
                    key !== this.cachePrefix + 'theme') {
                    localStorage.removeItem(key);
                }
            });
            
            // Limpiar sessionStorage
            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith(this.cachePrefix)) {
                    sessionKeysToRemove.push(key);
                }
            }
            
            sessionKeysToRemove.forEach(key => {
                if (key !== 'currentUser') {
                    sessionStorage.removeItem(key);
                }
            });
            
            // Establecer nueva versión
            localStorage.setItem(this.cachePrefix + 'version', this.version);
            console.log('✅ Cache limpiado - Nueva versión:', this.version);
        }
    }

    // Control de versiones
    setupVersionControl() {
        // Agregar timestamp a todos los recursos
        const timestamp = Date.now();
        window.CACHE_BUSTER = timestamp;
        
        console.log('📦 Cache buster:', timestamp);
    }

    // Guardar en cache con expiración
    set(key, data, customMaxAge = null) {
        const cacheData = {
            data: data,
            timestamp: Date.now(),
            maxAge: customMaxAge || this.maxAge
        };
        
        try {
            localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheData));
            return true;
        } catch (e) {
            console.warn('⚠️ Error guardando en cache:', e);
            return false;
        }
    }

    // Obtener de cache
    get(key) {
        try {
            const cached = localStorage.getItem(this.cachePrefix + key);
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            
            // Verificar si expiró
            if (age > cacheData.maxAge) {
                this.remove(key);
                return null;
            }
            
            return cacheData.data;
        } catch (e) {
            console.warn('⚠️ Error leyendo cache:', e);
            return null;
        }
    }

    // Remover de cache
    remove(key) {
        localStorage.removeItem(this.cachePrefix + key);
    }

    // Limpiar todo el cache
    clearAll() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            if (key !== this.cachePrefix + 'currentUser' && 
                key !== this.cachePrefix + 'theme') {
                localStorage.removeItem(key);
            }
        });
        
        console.log('🧹 Cache completamente limpiado');
    }

    // Obtener tamaño del cache
    getCacheSize() {
        let size = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                size += localStorage.getItem(key).length;
            }
        }
        return (size / 1024).toFixed(2) + ' KB';
    }
}

// Inicializar globalmente
window.cacheManager = new CacheManager();
