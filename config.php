<?php
// Database Configuration - Auto-detect Railway or Local
if (getenv('RAILWAY_ENVIRONMENT') || getenv('MYSQLHOST')) {
    // Railway Environment
    define('DB_HOST', getenv('MYSQLHOST') ?: 'localhost');
    define('DB_NAME', getenv('MYSQLDATABASE') ?: 'transporte_db');
    define('DB_USER', getenv('MYSQLUSER') ?: 'root');
    define('DB_PASS', getenv('MYSQLPASSWORD') ?: '');
    define('DB_PORT', getenv('MYSQLPORT') ?: '3306');
} else {
    // Local Environment
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'transporte_pro');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_PORT', '3306');
}

// Security Configuration
define('JWT_SECRET', 'your_jwt_secret_key_here_change_in_production');
define('UPLOAD_DIR', 'uploads/recibos/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Session Configuration
// NO iniciar sesión aquí - se hará después de configurar el handler

// CORS Headers for API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection Class
class Database {
    private $connection;
    private static $sessionInitialized = false;
    
    public function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $this->connection = new PDO(
                $dsn,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ]
            );
            
            // Inicializar sesiones en base de datos (solo una vez)
            if (!self::$sessionInitialized && session_status() === PHP_SESSION_NONE) {
                require_once __DIR__ . '/api/session-handler.php';
                initDatabaseSessions($this->connection);
                self::$sessionInitialized = true;
            }
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            error_log("DSN: mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME);
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
            exit();
        }
    }
    
    public function getConnection() {
        return $this->connection;
    }
}

// Security Functions
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function generateToken($userId, $role) {
    $payload = [
        'user_id' => $userId,
        'role' => $role,
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ];
    return base64_encode(json_encode($payload));
}

function validateToken($token) {
    try {
        $payload = json_decode(base64_decode($token), true);
        if ($payload && $payload['exp'] > time()) {
            return $payload;
        }
    } catch (Exception $e) {
        error_log("Token validation failed: " . $e->getMessage());
    }
    return false;
}

function requireAuth() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? $_SESSION['auth_token'] ?? null;
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit();
    }
    
    $payload = validateToken(str_replace('Bearer ', '', $token));
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit();
    }
    
    return $payload;
}

function requireRole($allowedRoles) {
    $user = requireAuth();
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Insufficient permissions']);
        exit();
    }
    return $user;
}

// Response Helper
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit();
}
?>
