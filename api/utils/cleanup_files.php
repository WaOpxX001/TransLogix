<?php
/**
 * Utilidad para limpiar archivos huérfanos
 * Archivos que existen en el servidor pero no tienen registro en la base de datos
 */

require_once '../../config.php';
require_once '../../includes/file_utils.php';

// Solo permitir acceso a administradores
requireRole(['admin']);

$db = new Database();
$conn = $db->getConnection();

header('Content-Type: application/json; charset=utf-8');

try {
    $action = $_GET['action'] ?? 'scan';
    
    switch ($action) {
        case 'scan':
            $result = scanOrphanedFiles($conn);
            break;
        case 'cleanup':
            $result = cleanupOrphanedFiles($conn);
            break;
        default:
            throw new Exception('Acción no válida');
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Escanea archivos huérfanos
 */
function scanOrphanedFiles($conn) {
    $uploadDir = '../../uploads/recibos/';
    $orphanedFiles = [];
    $totalSize = 0;
    
    // Obtener todos los archivos del directorio
    if (!is_dir($uploadDir)) {
        return [
            'success' => true,
            'orphaned_files' => [],
            'total_files' => 0,
            'total_size' => 0,
            'message' => 'Directorio de uploads no existe'
        ];
    }
    
    $files = scandir($uploadDir);
    $imageFiles = array_filter($files, function($file) use ($uploadDir) {
        return is_file($uploadDir . $file) && 
               preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file);
    });
    
    // Obtener todos los nombres de archivos registrados en la base de datos
    $stmt = $conn->prepare("SELECT DISTINCT recibo_imagen FROM gastos WHERE recibo_imagen IS NOT NULL AND recibo_imagen != ''");
    $stmt->execute();
    $dbFiles = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Encontrar archivos huérfanos
    foreach ($imageFiles as $file) {
        if (!in_array($file, $dbFiles)) {
            $filePath = $uploadDir . $file;
            $fileSize = filesize($filePath);
            $orphanedFiles[] = [
                'filename' => $file,
                'size' => $fileSize,
                'size_formatted' => formatBytes($fileSize),
                'modified' => date('Y-m-d H:i:s', filemtime($filePath))
            ];
            $totalSize += $fileSize;
        }
    }
    
    return [
        'success' => true,
        'orphaned_files' => $orphanedFiles,
        'total_files' => count($orphanedFiles),
        'total_size' => $totalSize,
        'total_size_formatted' => formatBytes($totalSize),
        'db_files_count' => count($dbFiles),
        'disk_files_count' => count($imageFiles)
    ];
}

/**
 * Limpia archivos huérfanos
 */
function cleanupOrphanedFiles($conn) {
    $scanResult = scanOrphanedFiles($conn);
    
    if (!$scanResult['success'] || empty($scanResult['orphaned_files'])) {
        return [
            'success' => true,
            'files_deleted' => 0,
            'space_freed' => 0,
            'message' => 'No hay archivos huérfanos para limpiar'
        ];
    }
    
    $filenames = array_column($scanResult['orphaned_files'], 'filename');
    $deleteResult = deleteMultipleFiles($filenames, 'uploads/recibos/');
    
    return [
        'success' => $deleteResult['success'],
        'files_processed' => $deleteResult['files_processed'],
        'files_deleted' => $deleteResult['files_deleted'],
        'files_not_found' => $deleteResult['files_not_found'],
        'space_freed' => $scanResult['total_size'],
        'space_freed_formatted' => $scanResult['total_size_formatted'],
        'errors' => $deleteResult['errors'],
        'details' => $deleteResult['details']
    ];
}

/**
 * Formatea bytes en unidades legibles
 */
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}
?>
