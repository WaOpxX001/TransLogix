<?php
/**
 * Script para corregir conexiones hardcodeadas en archivos API
 * Ejecutar: php fix-db-connections.php
 */

$files = [
    'api/vehiculos/list.php',
    'api/vehiculos/read.php',
    'api/vehiculos/delete.php',
    'api/transportistas/update.php',
    'api/transportistas/list.php',
    'api/transportistas/delete.php',
    'api/roles/delete.php',
    'api/reportes/viajes_simple.php',
    'api/dashboard/data_simple_pdo.php',
];

$oldPattern = '/\$pdo = new PDO\(\s*"mysql:host=localhost;dbname=\w+;charset=utf8mb4",\s*"root",\s*"",\s*\[[\s\S]*?\]\s*\);/';

$newCode = '// Usar configuración de config.php (detecta Railway automáticamente)
    require_once __DIR__ . \'/../../config.php\';
    $db = new Database();
    $pdo = $db->getConnection();';

$fixed = 0;
$errors = 0;

foreach ($files as $file) {
    if (!file_exists($file)) {
        echo "⚠️  Archivo no encontrado: $file\n";
        continue;
    }
    
    $content = file_get_contents($file);
    $newContent = preg_replace($oldPattern, $newCode, $content);
    
    if ($newContent !== $content) {
        if (file_put_contents($file, $newContent)) {
            echo "✅ Corregido: $file\n";
            $fixed++;
        } else {
            echo "❌ Error escribiendo: $file\n";
            $errors++;
        }
    } else {
        echo "⏭️  Sin cambios: $file\n";
    }
}

echo "\n";
echo "═══════════════════════════════════════\n";
echo "Archivos corregidos: $fixed\n";
echo "Errores: $errors\n";
echo "═══════════════════════════════════════\n";
?>
