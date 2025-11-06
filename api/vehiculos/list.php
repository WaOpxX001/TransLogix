<?php
// Disable error display to prevent HTML output
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    require_once '../../includes/cache.php';
    
    // Parámetros de paginación y cache
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(10, intval($_GET['limit']))) : 50;
    $offset = ($page - 1) * $limit;
    
    // Cache key
    $cacheKey = "vehiculos_list_page_{$page}_limit_{$limit}";
    
    // Verificar cache
    $cachedData = $cache->get($cacheKey);
    if ($cachedData !== null) {
        echo json_encode($cachedData);
        exit();
    }
    
    // Database connection
    $pdo = new PDO(
        "mysql:host=localhost;dbname=transporte_pro;charset=utf8mb4",
        "root",
        "",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    session_start();
    
    // Verificar que el usuario esté logueado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario no autenticado']);
        exit;
    }
    
    // Obtener vehículos disponibles (verificando columnas existentes)
    // Primero verificar qué columnas existen en la tabla
    $sql = "DESCRIBE vehiculos";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Construir consulta dinámicamente basada en columnas disponibles
    $selectFields = ['id', 'marca', 'modelo', 'placa'];
    
    // Agregar campos opcionales si existen
    if (in_array('año', $columns)) {
        $selectFields[] = 'año';
    } elseif (in_array('anio', $columns)) {
        $selectFields[] = 'anio as año';
    } elseif (in_array('year', $columns)) {
        $selectFields[] = 'year as año';
    }
    
    if (in_array('estado', $columns)) {
        $selectFields[] = 'estado';
    } elseif (in_array('status', $columns)) {
        $selectFields[] = 'status as estado';
    }
    
    if (in_array('kilometraje', $columns)) {
        $selectFields[] = 'kilometraje';
    } elseif (in_array('mileage', $columns)) {
        $selectFields[] = 'mileage as kilometraje';
    }
    
    if (in_array('tipo', $columns)) {
        $selectFields[] = 'tipo';
    } elseif (in_array('type', $columns)) {
        $selectFields[] = 'type as tipo';
    }
    
    if (in_array('ultimo_servicio', $columns)) {
        $selectFields[] = 'ultimo_servicio';
    } elseif (in_array('last_service', $columns)) {
        $selectFields[] = 'last_service as ultimo_servicio';
    }
    
    $sql = "SELECT " . implode(', ', $selectFields) . "
            FROM vehiculos 
            ORDER BY marca, modelo";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $vehiculos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: Log de columnas encontradas y consulta generada
    error_log("Columnas en tabla vehiculos: " . implode(', ', $columns));
    error_log("Consulta SQL generada: " . $sql);
    error_log("Número de vehículos encontrados: " . count($vehiculos));
    
    // Agregar información adicional
    foreach ($vehiculos as &$vehiculo) {
        $vehiculo['descripcion'] = trim($vehiculo['marca'] . ' ' . $vehiculo['modelo'] . ' (' . $vehiculo['placa'] . ')');
        
        // Asegurar que los campos opcionales existan aunque sean null
        if (!isset($vehiculo['año'])) $vehiculo['año'] = null;
        if (!isset($vehiculo['estado'])) $vehiculo['estado'] = null;
        if (!isset($vehiculo['kilometraje'])) $vehiculo['kilometraje'] = null;
        if (!isset($vehiculo['tipo'])) $vehiculo['tipo'] = null;
        if (!isset($vehiculo['ultimo_servicio'])) $vehiculo['ultimo_servicio'] = null;
    }
    
    echo json_encode($vehiculos);
    
} catch (Exception $e) {
    error_log("Error en vehiculos/list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
