<?php
/**
 * Verificación de Versión
 * Visita: https://tu-app.railway.app/version.php
 */

header('Content-Type: application/json; charset=utf-8');

$response = [
    'version' => '2.0.1',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => getenv('RAILWAY_ENVIRONMENT') ? 'Railway' : 'Local',
    'php_version' => PHP_VERSION,
    'files_check' => [
        'app-config.js' => file_exists(__DIR__ . '/assets/js/app-config.js') ? '✅ Existe' : '❌ No existe',
        'config.php' => file_exists(__DIR__ . '/config.php') ? '✅ Existe' : '❌ No existe',
        'debug-env.php' => file_exists(__DIR__ . '/debug-env.php') ? '✅ Existe' : '❌ No existe',
    ],
    'mysql_vars' => [
        'MYSQLHOST' => getenv('MYSQLHOST') ? '✅' : '❌',
        'MYSQLDATABASE' => getenv('MYSQLDATABASE') ? '✅' : '❌',
        'MYSQLUSER' => getenv('MYSQLUSER') ? '✅' : '❌',
    ],
    'app_vars' => [
        'TZ' => getenv('TZ') ?: 'No configurado',
        'APP_ENV' => getenv('APP_ENV') ?: 'No configurado',
        'APP_DEBUG' => getenv('APP_DEBUG') ?: 'No configurado',
    ],
    'message' => '✅ Si ves este mensaje, el deploy funcionó'
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
