<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config.php';

// Get user from session
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$db = new Database();
$conn = $db->getConnection();

// Verificar que se subió un archivo
if (!isset($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
    $error_msg = 'No se subió ningún archivo';
    if (isset($_FILES['receipt']['error'])) {
        switch ($_FILES['receipt']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $error_msg = 'El archivo es demasiado grande';
                break;
            case UPLOAD_ERR_PARTIAL:
                $error_msg = 'El archivo se subió parcialmente';
                break;
            case UPLOAD_ERR_NO_FILE:
                $error_msg = 'No se seleccionó ningún archivo';
                break;
            default:
                $error_msg = 'Error al subir el archivo';
        }
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $error_msg]);
    exit;
}

$file = $_FILES['receipt'];
$expense_id = intval($_POST['expense_id'] ?? 0);

if ($expense_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de gasto inválido']);
    exit;
}

// Validar archivo
$fileSize = $file['size'];
$fileName = $file['name'];
$fileTmpName = $file['tmp_name'];
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Tamaño máximo: 5MB
$maxFileSize = 5 * 1024 * 1024;
if ($fileSize > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'El archivo es demasiado grande (máximo 5MB)']);
    exit;
}

// Extensiones permitidas
$allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'gif'];
if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Tipo de archivo no permitido. Use: ' . implode(', ', $allowedExtensions)]);
    exit;
}

// Usar directorio de recibos existente
// Usar ruta absoluta desde la raíz del servidor
$uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/LogisticaFinal/uploads/recibos/';

// Log para debugging
error_log("📁 Verificando directorio de uploads:");
error_log("   - Ruta: " . $uploadDir);
error_log("   - Existe: " . (is_dir($uploadDir) ? 'Sí' : 'No'));

if (!is_dir($uploadDir)) {
    error_log("   - Creando directorio...");
    if (!mkdir($uploadDir, 0755, true)) {
        error_log("   ❌ Error al crear directorio");
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'No se pudo crear el directorio de uploads']);
        exit;
    }
    error_log("   ✅ Directorio creado exitosamente");
}

// Generar nombre único
$newFileName = 'recibo_' . $expense_id . '_' . uniqid() . '.' . $fileExtension;
$uploadPath = $uploadDir . $newFileName;

// Log para debugging
error_log("📁 Subiendo archivo:");
error_log("   - Directorio: " . $uploadDir);
error_log("   - Archivo: " . $newFileName);
error_log("   - Tamaño: " . $fileSize . " bytes");
error_log("   - Tipo: " . $fileExtension);

// Verificar permisos del directorio
if (!is_writable($uploadDir)) {
    error_log("❌ El directorio no tiene permisos de escritura");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'El directorio de uploads no tiene permisos de escritura']);
    exit;
}

// Mover archivo
error_log("📤 Intentando mover archivo:");
error_log("   - Desde: " . $fileTmpName);
error_log("   - Hacia: " . $uploadPath);

if (move_uploaded_file($fileTmpName, $uploadPath)) {
    error_log("✅ Archivo movido exitosamente");
    
    // Verificar que el archivo existe
    if (!file_exists($uploadPath)) {
        error_log("❌ El archivo no existe después de moverlo");
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al verificar el archivo subido']);
        exit;
    }
    
    error_log("✅ Archivo verificado, actualizando base de datos...");
    
    // Actualizar registro en base de datos
    $stmt = $conn->prepare("UPDATE gastos SET recibo_imagen = ? WHERE id = ? AND usuario_id = ?");
    if ($stmt->execute([$newFileName, $expense_id, $user_id])) {
        error_log("✅ Base de datos actualizada exitosamente");
        error_log("✅ Archivo subido exitosamente: " . $newFileName);
        echo json_encode([
            'success' => true,
            'filename' => $newFileName,
            'path' => 'uploads/recibos/' . $newFileName,
            'message' => 'Archivo subido exitosamente'
        ]);
    } else {
        // Si falla la actualización, eliminar el archivo
        error_log("❌ Error al actualizar base de datos, eliminando archivo");
        unlink($uploadPath);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'No se pudo actualizar el registro del gasto']);
    }
} else {
    $error = error_get_last();
    error_log("❌ Error al mover archivo subido: " . print_r($error, true));
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se pudo guardar el archivo. Verifica los permisos del directorio.']);
}
?>
