<?php
/**
 * Debug de Variables de Entorno
 * Visita: https://tu-app.railway.app/debug-env.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Debug - Variables de Entorno</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
        .success { color: #4ade80; }
        .error { color: #f87171; }
        .warning { color: #fbbf24; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #444; padding: 10px; text-align: left; }
        th { background: #2a2a2a; }
        pre { background: #2a2a2a; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Debug de Variables de Entorno</h1>
    
    <h2>📊 Entorno Detectado</h2>
    <pre><?php
    $isRailway = getenv('RAILWAY_ENVIRONMENT') !== false || getenv('MYSQLHOST') !== false;
    echo "Entorno: " . ($isRailway ? "✅ Railway" : "⚠️ Local") . "\n";
    echo "PHP Version: " . PHP_VERSION . "\n";
    echo "Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
    ?></pre>
    
    <h2>🔐 Variables de MySQL</h2>
    <table>
        <tr>
            <th>Variable</th>
            <th>Valor</th>
            <th>Estado</th>
        </tr>
        <?php
        $mysqlVars = [
            'MYSQLHOST' => getenv('MYSQLHOST'),
            'MYSQLPORT' => getenv('MYSQLPORT'),
            'MYSQLDATABASE' => getenv('MYSQLDATABASE'),
            'MYSQLUSER' => getenv('MYSQLUSER'),
            'MYSQLPASSWORD' => getenv('MYSQLPASSWORD') ? '***OCULTO***' : false,
        ];
        
        foreach ($mysqlVars as $var => $value) {
            $status = $value ? '<span class="success">✅ Configurado</span>' : '<span class="error">❌ No encontrado</span>';
            $displayValue = $value ?: '<span class="error">No definido</span>';
            echo "<tr><td>{$var}</td><td>{$displayValue}</td><td>{$status}</td></tr>";
        }
        ?>
    </table>
    
    <h2>⚙️ Configuración de config.php</h2>
    <pre><?php
    require_once 'config.php';
    echo "DB_HOST: " . DB_HOST . "\n";
    echo "DB_PORT: " . DB_PORT . "\n";
    echo "DB_NAME: " . DB_NAME . "\n";
    echo "DB_USER: " . DB_USER . "\n";
    echo "DB_PASS: " . (DB_PASS ? "***OCULTO***" : "VACÍO") . "\n";
    ?></pre>
    
    <h2>🔌 Test de Conexión</h2>
    <pre><?php
    try {
        $db = new Database();
        $conn = $db->getConnection();
        echo '<span class="success">✅ Conexión exitosa</span>' . "\n";
        
        // Test query
        $stmt = $conn->query("SELECT VERSION() as version");
        $result = $stmt->fetch();
        echo "MySQL Version: " . $result['version'] . "\n";
        
        // Verificar tablas
        $stmt = $conn->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "\nTablas encontradas: " . count($tables) . "\n";
        foreach ($tables as $table) {
            echo "  - {$table}\n";
        }
        
    } catch (Exception $e) {
        echo '<span class="error">❌ Error de conexión</span>' . "\n";
        echo "Error: " . $e->getMessage() . "\n";
    }
    ?></pre>
    
    <h2>🔧 Extensiones PHP</h2>
    <table>
        <tr>
            <th>Extensión</th>
            <th>Estado</th>
        </tr>
        <?php
        $extensions = ['pdo', 'pdo_mysql', 'mysqli', 'mbstring', 'curl', 'gd'];
        foreach ($extensions as $ext) {
            $loaded = extension_loaded($ext);
            $status = $loaded ? '<span class="success">✅ Cargada</span>' : '<span class="error">❌ No disponible</span>';
            echo "<tr><td>{$ext}</td><td>{$status}</td></tr>";
        }
        ?>
    </table>
    
    <hr>
    <p><small>Timestamp: <?php echo date('Y-m-d H:i:s'); ?></small></p>
</body>
</html>
