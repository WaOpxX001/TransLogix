<?php
/**
 * Session Handler para Railway
 * Guarda sesiones en MySQL en lugar de archivos
 */

class DatabaseSessionHandler implements SessionHandlerInterface {
    private $pdo;
    private $table = 'sessions';
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->createTableIfNotExists();
    }
    
    private function createTableIfNotExists() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS {$this->table} (
                id VARCHAR(128) NOT NULL PRIMARY KEY,
                data TEXT,
                last_activity INT(10) UNSIGNED NOT NULL,
                INDEX (last_activity)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
            
            $this->pdo->exec($sql);
        } catch (PDOException $e) {
            error_log("Error creating sessions table: " . $e->getMessage());
        }
    }
    
    public function open($savePath, $sessionName): bool {
        return true;
    }
    
    public function close(): bool {
        return true;
    }
    
    public function read($id): string|false {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT data FROM {$this->table} WHERE id = ? AND last_activity > ?"
            );
            $stmt->execute([$id, time() - 86400]); // 24 horas
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['data'] : '';
        } catch (PDOException $e) {
            error_log("Session read error: " . $e->getMessage());
            return '';
        }
    }
    
    public function write($id, $data): bool {
        try {
            $stmt = $this->pdo->prepare(
                "REPLACE INTO {$this->table} (id, data, last_activity) VALUES (?, ?, ?)"
            );
            return $stmt->execute([$id, $data, time()]);
        } catch (PDOException $e) {
            error_log("Session write error: " . $e->getMessage());
            return false;
        }
    }
    
    public function destroy($id): bool {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Session destroy error: " . $e->getMessage());
            return false;
        }
    }
    
    public function gc($maxlifetime): int|false {
        try {
            $stmt = $this->pdo->prepare(
                "DELETE FROM {$this->table} WHERE last_activity < ?"
            );
            $stmt->execute([time() - $maxlifetime]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Session GC error: " . $e->getMessage());
            return 0;
        }
    }
}

// Función para inicializar sesiones con handler de base de datos
function initDatabaseSessions($pdo) {
    $handler = new DatabaseSessionHandler($pdo);
    session_set_save_handler($handler, true);
    
    // Configuración de sesión
    ini_set('session.gc_maxlifetime', 86400); // 24 horas
    ini_set('session.cookie_lifetime', 86400);
    ini_set('session.cookie_httponly', 1);
    
    // En Railway, usar cookie_secure solo si es HTTPS
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        ini_set('session.cookie_secure', 1);
    }
    
    session_start();
}
?>
