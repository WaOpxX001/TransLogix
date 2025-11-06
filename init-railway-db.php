<?php
/**
 * Script de Inicialización de Base de Datos para Railway
 * Ejecutar una vez después del primer deploy
 */

// Detectar si estamos en Railway
$isRailway = getenv('RAILWAY_ENVIRONMENT') !== false;

if ($isRailway) {
    $host = getenv('MYSQLHOST');
    $database = getenv('MYSQLDATABASE');
    $username = getenv('MYSQLUSER');
    $password = getenv('MYSQLPASSWORD');
    $port = getenv('MYSQLPORT') ?: '3306';
} else {
    die("❌ Este script solo debe ejecutarse en Railway\n");
}

echo "🚂 Inicializando base de datos en Railway...\n\n";

try {
    // Conectar a MySQL
    $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    echo "✅ Conectado a MySQL\n";
    
    // Crear base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Base de datos '{$database}' verificada\n";
    
    // Seleccionar base de datos
    $pdo->exec("USE `{$database}`");
    
    // Leer y ejecutar SQL
    $sqlFile = __DIR__ . '/database/transporte_db.sql';
    
    if (!file_exists($sqlFile)) {
        echo "⚠️ Archivo SQL no encontrado: {$sqlFile}\n";
        echo "📝 Por favor, importa manualmente tu base de datos\n";
        exit(1);
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Dividir por statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !preg_match('/^--/', $stmt);
        }
    );
    
    echo "📊 Ejecutando " . count($statements) . " statements SQL...\n";
    
    $executed = 0;
    $errors = 0;
    
    foreach ($statements as $statement) {
        try {
            $pdo->exec($statement);
            $executed++;
        } catch (PDOException $e) {
            $errors++;
            echo "⚠️ Error en statement: " . substr($statement, 0, 50) . "...\n";
            echo "   " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✅ Inicialización completada\n";
    echo "   Ejecutados: {$executed}\n";
    echo "   Errores: {$errors}\n";
    
    // Verificar tablas creadas
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "\n📋 Tablas creadas (" . count($tables) . "):\n";
    foreach ($tables as $table) {
        echo "   - {$table}\n";
    }
    
    echo "\n🎉 Base de datos lista para usar!\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
