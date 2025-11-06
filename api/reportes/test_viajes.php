<?php
// Archivo de prueba simple para reportes de viajes
header('Content-Type: application/json; charset=utf-8');

try {
    echo json_encode([
        'status' => 'success',
        'message' => 'API de prueba funcionando',
        'timestamp' => date('Y-m-d H:i:s'),
        'get_params' => $_GET
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
