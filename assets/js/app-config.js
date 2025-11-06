/**
 * Configuración de la Aplicación
 * Auto-detecta si está en Railway o en local
 */

// Detectar entorno
const isRailway = window.location.hostname.includes('railway.app');
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Configurar base path
let basePath = '';

if (isLocal) {
    // En local, puede estar en /LogisticaFinal/ o en la raíz
    const path = window.location.pathname;
    if (path.includes('/LogisticaFinal/')) {
        basePath = '/LogisticaFinal';
    }
} else if (isRailway) {
    // En Railway, siempre está en la raíz
    basePath = '';
}

// Configuración global
window.APP_CONFIG = {
    basePath: basePath,
    apiPath: `${basePath}/api`,
    environment: isRailway ? 'production' : 'development',
    isRailway: isRailway,
    isLocal: isLocal
};

// Log de configuración (solo en desarrollo)
if (!isRailway) {
    console.log('🔧 App Config:', window.APP_CONFIG);
}

// Helper function para construir URLs de API
window.getApiUrl = function(endpoint) {
    // Remover /LogisticaFinal/ si existe (para compatibilidad)
    endpoint = endpoint.replace('/LogisticaFinal/', '');
    // Remover slash inicial si existe
    endpoint = endpoint.replace(/^\//, '');
    // Remover 'api/' del inicio si existe (lo agregaremos nosotros)
    endpoint = endpoint.replace(/^api\//, '');
    
    return `${window.APP_CONFIG.apiPath}/${endpoint}`;
};

// Helper function para construir URLs de assets
window.getAssetUrl = function(path) {
    path = path.replace(/^\//, '');
    return `${window.APP_CONFIG.basePath}/${path}`;
};

// Sobrescribir fetch global para auto-corregir URLs
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    // Si la URL contiene /LogisticaFinal/api/, corregirla
    if (typeof url === 'string' && url.includes('/LogisticaFinal/api/')) {
        const correctedUrl = url.replace('/LogisticaFinal/api/', `${window.APP_CONFIG.apiPath}/`);
        console.log('🔧 URL corregida:', url, '→', correctedUrl);
        url = correctedUrl;
    }
    return originalFetch(url, options);
};

console.log('✅ App Config cargado:', window.APP_CONFIG);
