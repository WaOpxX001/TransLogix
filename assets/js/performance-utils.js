/**
 * Utilidades de rendimiento para TransLogix
 * Funciones para optimizar la experiencia del usuario
 */

// Debounce function para evitar llamadas excesivas
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle function para limitar frecuencia de ejecución
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Cache simple para requests
class RequestCache {
    constructor(maxSize = 50, ttl = 300000) { // 5 minutos por defecto
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    set(key, data) {
        // Limpiar cache si está lleno
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }
}

// Instancia global del cache
window.requestCache = new RequestCache();

// Optimized fetch con cache
async function cachedFetch(url, options = {}) {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    
    // Verificar cache primero
    const cached = window.requestCache.get(cacheKey);
    if (cached && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
        console.log(`📦 Cache hit for: ${url}`);
        return cached;
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        // Guardar en cache solo si es GET y exitoso
        if (response.ok && (!options.method || options.method === 'GET')) {
            window.requestCache.set(cacheKey, data);
        }
        
        return data;
    } catch (error) {
        console.error(`❌ Fetch error for ${url}:`, error);
        throw error;
    }
}

// Lazy loading de imágenes
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Optimización de scroll
const optimizedScroll = throttle(() => {
    // Lógica de scroll optimizada
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Mostrar/ocultar elementos basado en scroll
    if (scrollTop > 100) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
}, 16); // ~60fps

// Event listeners optimizados
document.addEventListener('scroll', optimizedScroll, { passive: true });

// Preload crítico de recursos
function preloadCriticalResources() {
    const criticalUrls = [
        '/LogisticaFinal/api/dashboard/data.php',
        '/LogisticaFinal/api/auth/check.php'
    ];
    
    criticalUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    });
}

// Inicializar optimizaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Performance utils initialized');
    lazyLoadImages();
    preloadCriticalResources();
});

// Exportar funciones globalmente
window.debounce = debounce;
window.throttle = throttle;
window.cachedFetch = cachedFetch;
window.RequestCache = RequestCache;
