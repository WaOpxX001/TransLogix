<?php
require_once '../../config.php';
require_once '../../includes/file_utils.php';

// Temporarily disable auth for testing
// $user = requireAuth();
$user = ['user_id' => 1, 'role' => 'admin']; // Mock user for testing

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$id = intval($input['id'] ?? 0);

if ($id <= 0) {
    sendError('Invalid expense ID');
}

try {
    // Primero obtener información del gasto, incluyendo la imagen
    $stmt = $conn->prepare("SELECT recibo_imagen FROM gastos WHERE id = ?");
    $stmt->execute([$id]);
    $gasto = $stmt->fetch();
    
    if (!$gasto) {
        sendError('Expense not found');
    }
    
    // Eliminar el registro de la base de datos
    $stmt = $conn->prepare("DELETE FROM gastos WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        if ($stmt->rowCount() > 0) {
            $response = [
                'success' => true, 
                'message' => 'Expense deleted successfully',
                'file_deletion' => null
            ];
            
            // Si había una imagen asociada, intentar eliminarla
            if (!empty($gasto['recibo_imagen'])) {
                error_log("Eliminando imagen asociada: " . $gasto['recibo_imagen']);
                $fileResult = deleteFileSecurely($gasto['recibo_imagen'], 'uploads/recibos/');
                
                $response['file_deletion'] = $fileResult;
                
                if ($fileResult['success']) {
                    if ($fileResult['file_deleted']) {
                        $response['message'] .= ' (imagen eliminada)';
                        error_log("Imagen eliminada exitosamente: " . $gasto['recibo_imagen']);
                    } else {
                        $response['message'] .= ' (imagen ya no existía)';
                    }
                } else {
                    $response['message'] .= ' (advertencia: no se pudo eliminar la imagen)';
                    error_log("Error eliminando imagen: " . $fileResult['message']);
                }
            }
            
            sendResponse($response);
        } else {
            sendError('Expense not found');
        }
    } else {
        sendError('Failed to delete expense');
    }
} catch (Exception $e) {
    error_log("Error en delete.php: " . $e->getMessage());
    sendError('Database error: ' . $e->getMessage());
}
?>
