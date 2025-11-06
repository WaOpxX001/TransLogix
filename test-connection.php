<?php
/**
 * Test de conexión y diagnóstico completo
 * Acceder a: https://tu-app.railway.app/test-connection.php
 */

header('Content-Type: application/json');

// Información del entorno
$info = [
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => [
        'railway' => getenv('RAILWAY_ENVIRONMENT') ? true : false,
        'hostname' => $_SERVER['HTTP_HOST'] ?? 'unknown',
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ],
    'database_env_vars' => [
        'MYSQLHOST' => getenv('MYSQLHOST') ?: 'not set',
        'MYSQLDATABASE' => getenv('MYSQLDATABASE') ?: 'not set',
        'MYSQLUSER' => getenv('MYSQLUSER') ?: 'not set',
        'MYSQLPASSWORD' => getenv('MYSQLPASSWORD') ? '***SET***' : 'not set',
        'MYSQLPORT' => getenv('MYSQLPORT') ?: 'not set',
        'RAILWAY_ENVIRONMENT' => getenv('RAILWAY_ENVIRONMENT') ?: 'not set'
    ],
    'paths' => [
        'current_dir' => __DIR__,
        'config_exists' => file_exists(__DIR__ . '/config.php'),
        'api_exists' => is_dir(__DIR__ . '/api'),
        'index_exists' => file_exists(__DIR__ . '/index.html'),
        'router_exists' => file_exists(__DIR__ . '/router.php')
    ]
];

// Test 1: Conexión directa con variables de entorno
$test1 = ['test' => 'Direct ENV connection'];
try {
    if (getenv('MYSQLHOST')) {
        $dsn = sprintf(
            "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
            getenv('MYSQLHOST'),
            getenv('MYSQLPORT') ?: '3306',
            getenv('MYSQLDATABASE')
        );
        
        error_log("DSN: " . $dsn);
        
        $pdo = new PDO(
            $dsn,
            getenv('MYSQLUSER'),
            getenv('MYSQLPASSWORD'),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
        
        // Verificar conexión
        $result = $pdo->query("SELECT 1 as test")->fetch();
        $test1['status'] = 'success';
        $test1['message'] = 'Connected successfully';
        $test1['test_query'] = $result;
        
        // Listar tablas
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $test1['tables'] = $tables;
        $test1['table_count'] = count($tables);
        
    } else {
        $test1['status'] = 'error';
        $test1['message'] = 'No database configuration found in environment';
    }
} catch (Exception $e) {
    $test1['status'] = 'error';
    $test1['message'] = $e->getMessage();
    $test1['error_code'] = $e->getCode();
}
$info['test1_direct_env'] = $test1;

// Test 2: Conexión usando config.php
$test2 = ['test' => 'Using config.php'];
try {
    require_once __DIR__ . '/config.php';
    
    $test2['constants'] = [
        'DB_HOST' => defined('DB_HOST') ? DB_HOST : 'not defined',
        'DB_NAME' => defined('DB_NAME') ? DB_NAME : 'not defined',
        'DB_USER' => defined('DB_USER') ? DB_USER : 'not defined',
        'DB_PASS' => defined('DB_PASS') ? '***SET***' : 'not defined',
        'DB_PORT' => defined('DB_PORT') ? DB_PORT : 'not defined'
    ];
    
    // Intentar conexión con Database class
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        // Test query
        $result = $conn->query("SELECT DATABASE() as db_name")->fetch();
        $test2['status'] = 'success';
        $test2['current_db'] = $result['db_name'];
        
        // Contar registros en algunas tablas
        $tableCounts = [];
        $tables = ['usuarios', 'vehiculos', 'viajes', 'gastos'];
        foreach ($tables as $table) {
            try {
                $count = $conn->query("SELECT COUNT(*) as total FROM $table")->fetch();
                $tableCounts[$table] = $count['total'];
            } catch (Exception $e) {
                $tableCounts[$table] = 'error: ' . $e->getMessage();
            }
        }
        $test2['table_counts'] = $tableCounts;
        
    } catch (Exception $e) {
        $test2['status'] = 'error';
        $test2['db_error'] = $e->getMessage();
    }
} catch (Exception $e) {
    $test2['status'] = 'error';
    $test2['config_error'] = $e->getMessage();
}
$info['test2_config_php'] = $test2;

// Test 3: Verificar sesiones
$test3 = ['test' => 'Session configuration'];
$test3['session_info'] = [
    'handler' => ini_get('session.save_handler'),
    'save_path' => ini_get('session.save_path'),
    'gc_maxlifetime' => ini_get('session.gc_maxlifetime'),
    'cookie_lifetime' => ini_get('session.cookie_lifetime'),
    'status' => session_status()
];

// Intentar iniciar sesión
if (session_status() === PHP_SESSION_NONE) {
    session_start();
    $test3['session_started'] = true;
    $test3['session_id'] = session_id();
} else {
    $test3['session_already_active'] = true;
    $test3['session_id'] = session_id();
}
$info['test3_sessions'] = $test3;

// Test 4: Verificar archivos API críticos
$apiFiles = [
    'api/auth/login.php',
    'api/auth/check.php',
    'api/dashboard/data.php',
    'api/dashboard/data_no_filter.php',
    'api/vehiculos/list.php',
    'api/viajes/list.php',
    'api/gastos/list.php'
];

$apiStatus = [];
foreach ($apiFiles as $file) {
    $fullPath = __DIR__ . '/' . $file;
    $apiStatus[$file] = [
        'exists' => file_exists($fullPath),
        'readable' => is_readable($fullPath),
        'size' => file_exists($fullPath) ? filesize($fullPath) : 0
    ];
}
$info['api_files'] = $apiStatus;

// Test 5: Verificar configuración PHP
$info['php_config'] = [
    'error_reporting' => error_reporting(),
    'display_errors' => ini_get('display_errors'),
    'log_errors' => ini_get('log_errors'),
    'error_log' => ini_get('error_log'),
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'post_max_size' => ini_get('post_max_size'),
    'upload_max_filesize' => ini_get('upload_max_filesize')
];

// Output con formato bonito
echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
