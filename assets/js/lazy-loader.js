// 🚀 Lazy Loader - Carga diferida de recursos
// Optimizado para rendimiento máximo

class LazyLoader {
    constructor() {
        this.observers = new Map();
        this.loadedModules = new Set();
        this.init();
    }

    init() {
        console.log('🚀 Lazy Loader inicializado');
        this.setupImageLazyLoading();
        this.setupModuleLazyLoading();
    }

    // Lazy loading de imágenes
    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                            console.log('🖼️ Imagen cargada:', src);
                        }
                    }
                });
            }, {
                rootMargin: '50px'
            });

            this.observers.set('images', imageObserver);
            
            // Observar todas las imágenes con data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Lazy loading de módulos JavaScript
    setupModuleLazyLoading() {
        // Cargar módulos según la sección activa
        this.loadModuleForSection();
    }

    // Cargar módulo específico para una sección
    async loadModuleForSection(section = null) {
        if (!section) {
            // Detectar sección activa
            const activeSection = document.querySelector('.nav-link.active');
            if (activeSection) {
                section = activeSection.dataset.section;
            }
        }

        if (!section || this.loadedModules.has(section)) {
            return;
        }

        console.log('📦 Cargando módulo:', section);

        try {
            switch (section) {
                case 'dashboard':
                    await this.loadScript('assets/js/dashboard.js');
                    break;
                case 'viajes':
                    await this.loadScript('assets/js/viajes_simple.js');
                    break;
                case 'gastos':
                    await this.loadScript('assets/js/gastos_new.js');
                    break;
                case 'vehiculos':
                    await this.loadScript('assets/js/vehiculos.js');
                    break;
                case 'transportistas':
                    await this.loadScript('assets/js/transportistas.js');
                    break;
                case 'reportes':
                    await this.loadScript('assets/js/reportes.js');
                    break;
            }

            this.loadedModules.add(section);
            console.log('✅ Módulo cargado:', section);
        } catch (error) {
            console.error('❌ Error cargando módulo:', section, error);
        }
    }

    // Cargar script dinámicamente
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src + '?v=' + window.CACHE_BUSTER;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // Cargar CSS dinámicamente
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            const existing = document.querySelector(`link[href="${href}"]`);
            if (existing) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href + '?v=' + window.CACHE_BUSTER;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // Precargar recursos para la siguiente sección
    preloadNextSection(section) {
        console.log('🔮 Precargando:', section);
        
        // Precargar en segundo plano
        setTimeout(() => {
            this.loadModuleForSection(section);
        }, 1000);
    }

    // Observar nuevas imágenes agregadas dinámicamente
    observeNewImages() {
        const imageObserver = this.observers.get('images');
        if (imageObserver) {
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Limpiar observadores
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Inicializar globalmente
window.lazyLoader = new LazyLoader();

// Observar cambios en el DOM para nuevas imágenes
if ('MutationObserver' in window) {
    const domObserver = new MutationObserver(() => {
        window.lazyLoader.observeNewImages();
    });

    domObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}
