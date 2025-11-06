<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

try {
    session_start();
    
    // Verificar que el usuario esté logueado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario no autenticado']);
        exit;
    }
    
    $user_role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
    
    // Solo admin y supervisor pueden eliminar viajes
    if (!in_array($user_role, ['admin', 'supervisor'])) {
        http_response_code(403);
        echo json_encode([
            'error' => 'No tienes permisos para eliminar viajes',
            'user_role' => $user_role,
            'required_roles' => ['admin', 'supervisor']
        ]);
        exit;
    }
    
    // Obtener ID del viaje
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de viaje requerido']);
        exit;
    }
    
    $viaje_id = $input['id'];
    
    // Verificar que el viaje existe
    $stmt = $pdo->prepare("SELECT id, numero_viaje, estado FROM viajes WHERE id = ?");
    $stmt->execute([$viaje_id]);
    $viaje = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$viaje) {
        http_response_code(404);
        echo json_encode(['error' => 'Viaje no encontrado']);
        exit;
    }
    
    // No permitir eliminar viajes en ruta
    if ($viaje['estado'] === 'en_ruta') {
        http_response_code(400);
        echo json_encode(['error' => 'No se pueden eliminar viajes en ruta']);
        exit;
    }
    
    // Eliminar el viaje
    $stmt = $pdo->prepare("DELETE FROM viajes WHERE id = ?");
    $result = $stmt->execute([$viaje_id]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => "Viaje {$viaje['numero_viaje']} eliminado exitosamente"
        ]);
    } else {
        throw new Exception('Error al eliminar el viaje');
    }
    
} catch (Exception $e) {
    error_log("Error en viajes/delete.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
