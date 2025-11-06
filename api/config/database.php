<?php
/**
 * Configuración Unificada de Base de Datos
 * Detecta automáticamente Railway o entorno local
 */

class Database {
    private static $instance = null;
    private $conn;
    private $host;
    private $database;
    private $username;
    private $password;
    private $port;
    private $environment;
    
    private function __construct() {
        // Detectar entorno
        $this->detectEnvironment();
        $this->connect();
    }
    
    private function detectEnvironment() {
        // Detectar Railway
        if (getenv('RAILWAY_ENVIRONMENT') || getenv('MYSQLHOST')) {
            $this->environment = 'railway';
            $this->host = getenv('MYSQLHOST') ?: 'localhost';
            $this->database = getenv('MYSQLDATABASE') ?: 'transporte_db';
            $this->username = getenv('MYSQLUSER') ?: 'root';
            $this->password = getenv('MYSQLPASSWORD') ?: '';
            $this->port = getenv('MYSQLPORT') ?: '3306';
        } 
        // Entorno local
        else {
            $this->environment = 'local';
            $this->host = 'localhost';
            $this->database = 'transporte_pro';
            $this->username = 'root';
            $this->password = '';
            $this->port = '3306';
        }
    }
    
    private function connect() {
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->database};charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Log solo en desarrollo
            if ($this->environment === 'local') {
                error_log("✅ Conexión local exitosa a {$this->database}");
            }
            
        } catch(PDOException $e) {
            error_log("❌ Error de conexión [{$this->environment}]: " . $e->getMessage());
            
            // En Railway, intentar crear la base de datos
            if ($this->environment === 'railway') {
                try {
                    $dsn = "mysql:host={$this->host};port={$this->port};charset=utf8mb4";
                    $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                    
                    $this->conn->exec("CREATE DATABASE IF NOT EXISTS `{$this->database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $this->conn->exec("USE `{$this->database}`");
                    
                    error_log("✅ Base de datos Railway creada y conectada");
                    
                } catch(PDOException $e2) {
                    error_log("❌ Error crítico Railway: " . $e2->getMessage());
                    throw new Exception("No se pudo conectar a la base de datos");
                }
            } else {
                throw new Exception("Error de conexión local: " . $e->getMessage());
            }
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    public function getEnvironment() {
        return $this->environment;
    }
    
    public function isRailway() {
        return $this->environment === 'railway';
    }
    
    public function getConfig() {
        return [
            'environment' => $this->environment,
            'host' => $this->host,
            'database' => $this->database,
            'username' => $this->username,
            'port' => $this->port
        ];
    }
}

// Función helper global
function getDB() {
    return Database::getInstance()->getConnection();
}

// Función para verificar conexión
function checkDatabaseConnection() {
    try {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $conn->query("SELECT 1");
        return [
            'status' => 'connected',
            'environment' => $db->getEnvironment(),
            'config' => $db->getConfig()
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}
?>
