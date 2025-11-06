<?php
// Database Configuration for Railway
// Este archivo se usa automáticamente cuando se detectan variables de entorno de Railway

class DatabaseRailway {
    private static $instance = null;
    private $conn;
    
    // Configuración de Railway
    private $host;
    private $database;
    private $username;
    private $password;
    private $port;
    
    private function __construct() {
        // Detectar si estamos en Railway
        if (getenv('RAILWAY_ENVIRONMENT')) {
            // Variables de entorno de Railway MySQL
            $this->host = getenv('MYSQLHOST') ?: getenv('DB_HOST') ?: 'localhost';
            $this->database = getenv('MYSQLDATABASE') ?: getenv('DB_NAME') ?: 'transporte_db';
            $this->username = getenv('MYSQLUSER') ?: getenv('DB_USER') ?: 'root';
            $this->password = getenv('MYSQLPASSWORD') ?: getenv('DB_PASSWORD') ?: '';
            $this->port = getenv('MYSQLPORT') ?: getenv('DB_PORT') ?: '3306';
        } else {
            // Configuración local
            $this->host = 'localhost';
            $this->database = 'transporte_db';
            $this->username = 'root';
            $this->password = '';
            $this->port = '3306';
        }
        
        $this->connect();
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
            
            error_log("✅ Conexión exitosa a Railway MySQL");
            
        } catch(PDOException $e) {
            error_log("❌ Error de conexión Railway: " . $e->getMessage());
            
            // Intentar con configuración alternativa
            try {
                $dsn = "mysql:host={$this->host};port={$this->port};charset=utf8mb4";
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                
                // Crear base de datos si no existe
                $this->conn->exec("CREATE DATABASE IF NOT EXISTS `{$this->database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $this->conn->exec("USE `{$this->database}`");
                
                error_log("✅ Base de datos creada y seleccionada");
                
            } catch(PDOException $e2) {
                error_log("❌ Error crítico: " . $e2->getMessage());
                throw new Exception("No se pudo conectar a la base de datos: " . $e2->getMessage());
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
    
    public function getConfig() {
        return [
            'host' => $this->host,
            'database' => $this->database,
            'username' => $this->username,
            'port' => $this->port,
            'environment' => getenv('RAILWAY_ENVIRONMENT') ?: 'local'
        ];
    }
}

// Función helper para obtener la conexión
function getRailwayDB() {
    return DatabaseRailway::getInstance()->getConnection();
}
?>
