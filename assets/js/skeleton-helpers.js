// 💀 Skeleton Helpers - Funciones para mostrar skeletons de carga

class SkeletonHelpers {
    constructor() {
        this.skeletons = new Map();
    }

    // Mostrar skeleton para tabla
    showTableSkeleton(containerId, rows = 5) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const skeletonHTML = `
            <div class="skeleton-table">
                <div class="skeleton-table-header">
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                </div>
                <div class="skeleton-table-body">
                    ${Array(rows).fill('').map(() => `
                        <div class="skeleton skeleton-table-row"></div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = skeletonHTML;
        this.skeletons.set(containerId, 'table');
    }

    // Mostrar skeleton para cards de viajes
    showViajesSkeleton(containerId, count = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const skeletonHTML = `
            <div class="row g-3">
                ${Array(count).fill('').map(() => `
                    <div class="col-md-6 col-lg-4">
                        <div class="skeleton-viaje-card">
                            <div class="skeleton-viaje-header">
                                <div class="skeleton skeleton-viaje-badge"></div>
                                <div class="skeleton skeleton-viaje-id"></div>
                            </div>
                            <div class="skeleton skeleton-viaje-route"></div>
                            <div class="skeleton-viaje-info">
                                <div class="skeleton skeleton-viaje-info-item"></div>
                                <div class="skeleton skeleton-viaje-info-item"></div>
                            </div>
                            <div class="skeleton-viaje-info">
                                <div class="skeleton skeleton-viaje-info-item"></div>
                                <div class="skeleton skeleton-viaje-info-item"></div>
                            </div>
                            <div class="skeleton-viaje-actions">
                                <div class="skeleton"></div>
                                <div class="skeleton"></div>
                                <div class="skeleton"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = skeletonHTML;
        this.skeletons.set(containerId, 'viajes');
    }

    // Mostrar skeleton para dashboard
    showDashboardSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const skeletonHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="skeleton skeleton-stat-card"></div>
                </div>
                <div class="col-md-3">
                    <div class="skeleton skeleton-stat-card"></div>
                </div>
                <div class="col-md-3">
                    <div class="skeleton skeleton-stat-card"></div>
                </div>
                <div class="col-md-3">
                    <div class="skeleton skeleton-stat-card"></div>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-8">
                    <div class="skeleton skeleton-chart"></div>
                </div>
                <div class="col-md-4">
                    <div class="skeleton skeleton-chart"></div>
                </div>
            </div>
        `;

        container.innerHTML = skeletonHTML;
        this.skeletons.set(containerId, 'dashboard');
    }

    // Mostrar skeleton para lista de transportistas
    showTransportistasSkeleton(containerId, count = 8) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const skeletonHTML = `
            <div class="skeleton-table-body">
                ${Array(count).fill('').map(() => `
                    <div class="skeleton-transportista-row">
                        <div class="skeleton skeleton-transportista-avatar"></div>
                        <div class="skeleton-transportista-info">
                            <div class="skeleton skeleton-transportista-name"></div>
                            <div class="skeleton skeleton-transportista-email"></div>
                        </div>
                        <div class="skeleton skeleton-text" style="width: 120px;"></div>
                        <div class="skeleton skeleton-text" style="width: 100px;"></div>
                        <div class="skeleton skeleton-text" style="width: 80px;"></div>
                        <div class="skeleton-transportista-actions">
                            <div class="skeleton"></div>
                            <div class="skeleton"></div>
                            <div class="skeleton"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = skeletonHTML;
        this.skeletons.set(containerId, 'transportistas');
    }

    // Mostrar skeleton genérico de cards
    showCardsSkeleton(containerId, count = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const skeletonHTML = `
            <div class="skeleton-card-grid">
                ${Array(count).fill('').map(() => `
                    <div class="skeleton-card-item">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text skeleton-text-short"></div>
                        <div class="skeleton skeleton-button" style="margin-top: 16px;"></div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = skeletonHTML;
        this.skeletons.set(containerId, 'cards');
    }

    // Mostrar loading overlay
    showLoadingOverlay(message = 'Cargando...', subtitle = 'Por favor espera') {
        // Remover overlay existente
        this.hideLoadingOverlay();

        const overlayHTML = `
            <div class="loading-overlay" id="globalLoadingOverlay">
                <div class="loading-content">
                    <div class="modern-spinner modern-spinner-lg"></div>
                    <h3>${message}</h3>
                    <p>${subtitle}</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

    // Ocultar loading overlay
    hideLoadingOverlay() {
        const overlay = document.getElementById('globalLoadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // Remover skeleton y mostrar contenido con animación
    removeSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Agregar clase de fade-in al nuevo contenido
        setTimeout(() => {
            const children = container.children;
            Array.from(children).forEach((child, index) => {
                setTimeout(() => {
                    child.classList.add('fade-in');
                }, index * 50);
            });
        }, 100);

        this.skeletons.delete(containerId);
    }

    // Mostrar spinner inline
    showInlineSpinner(containerId, size = 'md') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const spinnerHTML = `
            <div class="text-center py-4">
                <div class="modern-spinner modern-spinner-${size}"></div>
                <p class="mt-3 text-muted">Cargando datos...</p>
            </div>
        `;

        container.innerHTML = spinnerHTML;
    }

    // Mostrar mensaje de error
    showError(containerId, message = 'Error al cargar datos') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const errorHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h5 class="text-danger">${message}</h5>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="fas fa-redo me-2"></i>Reintentar
                </button>
            </div>
        `;

        container.innerHTML = errorHTML;
    }

    // Mostrar mensaje vacío
    showEmpty(containerId, message = 'No hay datos disponibles', icon = 'inbox') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const emptyHTML = `
            <div class="text-center py-5">
                <i class="fas fa-${icon} fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">${message}</h5>
            </div>
        `;

        container.innerHTML = emptyHTML;
    }

    // Verificar si hay skeleton activo
    hasSkeleton(containerId) {
        return this.skeletons.has(containerId);
    }

    // Limpiar todos los skeletons
    clearAll() {
        this.skeletons.clear();
        this.hideLoadingOverlay();
    }
}

// Inicializar globalmente
window.skeletonHelpers = new SkeletonHelpers();

// Funciones de conveniencia globales
window.showLoading = (message, subtitle) => {
    window.skeletonHelpers.showLoadingOverlay(message, subtitle);
};

window.hideLoading = () => {
    window.skeletonHelpers.hideLoadingOverlay();
};
