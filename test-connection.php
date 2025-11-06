<?php
/**
 * Test de Conexión a Base de Datos
 * Visita: https://tu-app.railway.app/test-connection.php
 */

header('Content-Type: application/json; charset=utf-8');

// Incluir configuración
require_once __DIR__ . '/api/config/database.php';

$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
];

// Detectar entorno
$isRailway = getenv('RAILWAY_ENVIRONMENT') !== false || getenv('MYSQLHOST') !== false;
$response['environment'] = $isRailway ? 'Railway' : 'Local';

// Variables de entorno (sin mostrar contraseñas)
if ($isRailway) {
    $response['env_vars'] = [
        'MYSQLHOST' => getenv('MYSQLHOST') ? '✅ Configurado' : '❌ No encontrado',
        'MYSQLPORT' => getenv('MYSQLPORT') ?: '3306',
        'MYSQLDATABASE' => getenv('MYSQLDATABASE') ? '✅ Configurado' : '❌ No encontrado',
        'MYSQLUSER' => getenv('MYSQLUSER') ? '✅ Configurado' : '❌ No encontrado',
        'MYSQLPASSWORD' => getenv('MYSQLPASSWORD') ? '✅ Configurado' : '❌ No encontrado',
    ];
}

// Test de conexión
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    $response['database'] = [
        'status' => '✅ Conectado',
        'config' => $db->getConfig()
    ];
    
    // Test query
    $stmt = $conn->query("SELECT VERSION() as version");
    $result = $stmt->fetch();
    $response['database']['mysql_version'] = $result['version'];
    
    // Verificar tablas
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $response['database']['tables_count'] = count($tables);
    $response['database']['tables'] = $tables;
    
    // Test de escritura
    try {
        $conn->query("SELECT 1 FROM usuarios LIMIT 1");
        $response['database']['usuarios_table'] = '✅ Existe';
    } catch (Exception $e) {
        $response['database']['usuarios_table'] = '❌ No existe - Importa tu SQL';
    }
    
    $response['status'] = 'success';
    $response['message'] = '✅ Todo funcionando correctamente';
    
} catch (Exception $e) {
    $response['status'] = 'error';
    $response['database'] = [
        'status' => '❌ Error de conexión',
        'error' => $e->getMessage()
    ];
    $response['message'] = '❌ Error: ' . $e->getMessage();
    
    // Sugerencias
    $response['suggestions'] = [
        '1. Verifica que las variables de entorno estén configuradas en Railway',
        '2. Asegúrate de que el servicio MySQL esté corriendo',
        '3. Verifica que la base de datos esté importada',
        '4. Revisa los logs: railway logs'
    ];
}

// Información adicional
$response['php_extensions'] = [
    'pdo' => extension_loaded('pdo') ? '✅' : '❌',
    'pdo_mysql' => extension_loaded('pdo_mysql') ? '✅' : '❌',
    'mysqli' => extension_loaded('mysqli') ? '✅' : '❌',
    'mbstring' => extension_loaded('mbstring') ? '✅' : '❌',
    'curl' => extension_loaded('curl') ? '✅' : '❌',
    'gd' => extension_loaded('gd') ? '✅' : '❌',
];

// Output
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
