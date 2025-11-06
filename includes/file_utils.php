<?php
/**
 * Utilidades para manejo de archivos
 */

/**
 * Elimina un archivo de forma segura
 * @param string $filename Nombre del archivo (sin ruta)
 * @param string $directory Directorio donde está el archivo (relativo a la raíz del proyecto)
 * @return array Resultado de la operación
 */
function deleteFileSecurely($filename, $directory = 'uploads/recibos/') {
    $result = [
        'success' => false,
        'message' => '',
        'file_deleted' => false
    ];
    
    // Validar que el filename no esté vacío
    if (empty($filename) || trim($filename) === '') {
        $result['message'] = 'Nombre de archivo vacío';
        return $result;
    }
    
    // Sanitizar el nombre del archivo para evitar path traversal
    $filename = basename($filename);
    
    // Construir la ruta completa
    $basePath = dirname(dirname(__FILE__)) . '/';
    $fullPath = $basePath . $directory . $filename;
    
    // Log para debugging
    error_log("Intentando eliminar archivo: " . $fullPath);
    
    // Verificar que el archivo existe
    if (!file_exists($fullPath)) {
        $result['success'] = true; // No es error si el archivo ya no existe
        $result['message'] = 'Archivo no encontrado (ya eliminado)';
        return $result;
    }
    
    // Verificar que está dentro del directorio permitido (seguridad)
    $realPath = realpath($fullPath);
    $allowedPath = realpath($basePath . $directory);
    
    if (!$realPath || !$allowedPath || strpos($realPath, $allowedPath) !== 0) {
        $result['message'] = 'Ruta de archivo no permitida por seguridad';
        error_log("Intento de eliminación de archivo fuera del directorio permitido: " . $fullPath);
        return $result;
    }
    
    // Intentar eliminar el archivo
    try {
        if (unlink($fullPath)) {
            $result['success'] = true;
            $result['file_deleted'] = true;
            $result['message'] = 'Archivo eliminado correctamente';
            error_log("Archivo eliminado exitosamente: " . $fullPath);
        } else {
            $result['message'] = 'No se pudo eliminar el archivo';
            error_log("Error eliminando archivo: " . $fullPath);
        }
    } catch (Exception $e) {
        $result['message'] = 'Error al eliminar archivo: ' . $e->getMessage();
        error_log("Excepción eliminando archivo: " . $e->getMessage());
    }
    
    return $result;
}

/**
 * Elimina múltiples archivos de forma segura
 * @param array $filenames Array de nombres de archivos
 * @param string $directory Directorio donde están los archivos
 * @return array Resultado de la operación con detalles de cada archivo
 */
function deleteMultipleFiles($filenames, $directory = 'uploads/recibos/') {
    $results = [
        'success' => true,
        'files_processed' => 0,
        'files_deleted' => 0,
        'files_not_found' => 0,
        'errors' => [],
        'details' => []
    ];
    
    foreach ($filenames as $filename) {
        $results['files_processed']++;
        $fileResult = deleteFileSecurely($filename, $directory);
        
        $results['details'][$filename] = $fileResult;
        
        if ($fileResult['success']) {
            if ($fileResult['file_deleted']) {
                $results['files_deleted']++;
            } else {
                $results['files_not_found']++;
            }
        } else {
            $results['success'] = false;
            $results['errors'][] = "Error con $filename: " . $fileResult['message'];
        }
    }
    
    return $results;
}

/**
 * Obtiene información de un archivo
 * @param string $filename Nombre del archivo
 * @param string $directory Directorio del archivo
 * @return array Información del archivo
 */
function getFileInfo($filename, $directory = 'uploads/recibos/') {
    $info = [
        'exists' => false,
        'size' => 0,
        'modified' => null,
        'path' => null
    ];
    
    if (empty($filename)) {
        return $info;
    }
    
    $filename = basename($filename);
    $basePath = dirname(dirname(__FILE__)) . '/';
    $fullPath = $basePath . $directory . $filename;
    
    if (file_exists($fullPath)) {
        $info['exists'] = true;
        $info['size'] = filesize($fullPath);
        $info['modified'] = filemtime($fullPath);
        $info['path'] = $fullPath;
    }
    
    return $info;
}
?>
