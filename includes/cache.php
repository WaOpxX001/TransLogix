<?php
/**
 * Sistema de Cache Simple para TransLogix
 * Mejora el rendimiento almacenando consultas frecuentes
 */

class SimpleCache {
    private $cacheDir;
    private $defaultTTL = 300; // 5 minutos por defecto
    
    public function __construct($cacheDir = '../cache/') {
        $this->cacheDir = $cacheDir;
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    /**
     * Obtener datos del cache
     */
    public function get($key) {
        $filename = $this->getCacheFilename($key);
        
        if (!file_exists($filename)) {
            return null;
        }
        
        $data = json_decode(file_get_contents($filename), true);
        
        // Verificar si ha expirado
        if ($data['expires'] < time()) {
            unlink($filename);
            return null;
        }
        
        return $data['value'];
    }
    
    /**
     * Guardar datos en cache
     */
    public function set($key, $value, $ttl = null) {
        $ttl = $ttl ?? $this->defaultTTL;
        $filename = $this->getCacheFilename($key);
        
        $data = [
            'value' => $value,
            'expires' => time() + $ttl,
            'created' => time()
        ];
        
        file_put_contents($filename, json_encode($data));
        return true;
    }
    
    /**
     * Eliminar entrada del cache
     */
    public function delete($key) {
        $filename = $this->getCacheFilename($key);
        if (file_exists($filename)) {
            unlink($filename);
        }
    }
    
    /**
     * Limpiar cache expirado
     */
    public function cleanup() {
        $files = glob($this->cacheDir . '*.cache');
        $cleaned = 0;
        
        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && $data['expires'] < time()) {
                unlink($file);
                $cleaned++;
            }
        }
        
        return $cleaned;
    }
    
    /**
     * Obtener o ejecutar con cache
     */
    public function remember($key, $callback, $ttl = null) {
        $value = $this->get($key);
        
        if ($value === null) {
            $value = $callback();
            $this->set($key, $value, $ttl);
        }
        
        return $value;
    }
    
    private function getCacheFilename($key) {
        return $this->cacheDir . md5($key) . '.cache';
    }
}

// Instancia global del cache
$cache = new SimpleCache();
?>
