<?php
/**
 * Script para verificar y reportar archivos API que necesitan corrección
 * Ejecutar: php fix-all-api-files.php
 */

echo "🔍 Escaneando archivos API...\n\n";

$issues = [];

// Función para escanear un archivo
function scanFile($file) {
    $content = file_get_contents($file);
    $problems = [];
    
    // Verificar si usa require_once config.php
    if (preg_match('/require_once.*config\.php/', $content)) {
        // Verificar si obtiene $pdo o $db
        if (!preg_match('/\$db\s*=\s*new\s+Database/', $content) && 
            !preg_match('/\$pdo\s*=\s*\$db->getConnection/', $content) &&
            !preg_match('/getDBConnection\(\)/', $content)) {
            $problems[] = "No obtiene conexión a DB después de incluir config.php";
        }
    }
    
    // Verificar si hace session_start() manual
    if (preg_match('/session_start\(\)/', $content) && 
        preg_match('/require_once.*config\.php/', $content)) {
        $problems[] = "Hace session_start() manual (ya se hace en config.php)";
    }
    
    // Verificar si tiene conexión hardcodeada
    if (preg_match('/new\s+PDO\s*\(\s*["\']mysql:host=localhost/', $content)) {
        $problems[] = "Tiene conexión hardcodeada a localhost";
    }
    
    return $problems;
}

// Escanear todos los archivos PHP en api/
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator('api'),
    RecursiveIteratorIterator::SELF_FIRST
);

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $filepath = $file->getPathname();
        $problems = scanFile($filepath);
        
        if (!empty($problems)) {
            $issues[$filepath] = $problems;
        }
    }
}

// Reportar resultados
if (empty($issues)) {
    echo "✅ No se encontraron problemas!\n";
} else {
    echo "❌ Se encontraron " . count($issues) . " archivos con problemas:\n\n";
    
    foreach ($issues as $file => $problems) {
        echo "📄 $file\n";
        foreach ($problems as $problem) {
            echo "   ⚠️  $problem\n";
        }
        echo "\n";
    }
}

echo "\n═══════════════════════════════════════\n";
echo "Total de archivos con problemas: " . count($issues) . "\n";
echo "═══════════════════════════════════════\n";
?>
