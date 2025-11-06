// Initialize fallback managers to prevent errors
console.log('Setting up manager fallbacks...');

// Fallback ViajesManager
if (typeof window.ViajesManager === 'undefined') {
    window.ViajesManager = {
        showCreateModal: function() {
            console.log('[Fallback ViajesManager] showCreateModal called');
            try {
                const modalEl = document.getElementById('nuevoViajeModal');
                if (modalEl) {
                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();
                    return true;
                } else {
                    console.error('nuevoViajeModal element not found');
                    return false;
                }
            } catch (error) {
                console.error('Error in showCreateModal:', error);
                return false;
            }
        },
        guardarViaje: function() {
            console.log('[Fallback ViajesManager] guardarViaje called');
            if (window.app && window.app.showToast) {
                window.app.showToast('Función de guardar viaje en desarrollo', 'info');
            }
        },
        init: function() {
            console.log('[Fallback ViajesManager] init called');
            return this;
        }
    };
}

// Fallback GastosManager
if (typeof window.GastosManager === 'undefined') {
    window.GastosManager = {
        loadExpenses: function() {
            console.log('[Fallback GastosManager] loadExpenses called');
            return Promise.resolve();
        },
        init: function() {
            console.log('[Fallback GastosManager] init called');
            return this;
        }
    };
}

// Setup button event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up button listeners...');
    
    // Setup Nuevo Viaje button
    const btnNuevoViaje = document.getElementById('btnNuevoViaje');
    if (btnNuevoViaje) {
        btnNuevoViaje.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Nuevo Viaje button clicked');
            if (window.ViajesManager && window.ViajesManager.showCreateModal) {
                window.ViajesManager.showCreateModal();
            } else {
                console.error('ViajesManager.showCreateModal not available');
            }
        });
        console.log('✅ Added click handler for btnNuevoViaje');
    } else {
        console.warn('⚠️ btnNuevoViaje not found');
    }
    
    console.log('Manager initialization setup complete');
});
