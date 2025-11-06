<?php
header('Content-Type: application/json');

// Habilitar reporte de errores para debug
error_reporting(E_ALL);
ini_set('display_errors', 1); // Mostrar errores para debug
ini_set('log_errors', 1);

require_once '../config.php';
require_once '../../includes/cache.php';

// Get user from session for role-based filtering
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit();
}

$user = [
    'user_id' => $_SESSION['user_id'],
    'role' => $_SESSION['user_role']
];

// Cache key basado en el rol del usuario para optimizar rendimiento
$cacheKey = "dashboard_stats_{$user['role']}_{$user['user_id']}";

// Intentar obtener datos del cache primero
$cachedData = $cache->get($cacheKey);
if ($cachedData !== null) {
    echo json_encode($cachedData);
    exit();
}

$db = new Database();
$conn = $db->getConnection();

$data = [];
$userRole = $user['role'];
$userId = $user['user_id'];

// Build WHERE clause based on user role
$roleFilter = "";
$roleParams = [];

if ($userRole === 'transportista') {
    // Transportistas only see their own data
    $roleFilter = " AND usuario_id = ?";
    $roleParams = [$userId];
} 
// Admin and supervisor see all data (no filter)

// Get viajes statistics
$viajesQuery = "SELECT 
    COUNT(*) as total_viajes,
    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as viajes_pendientes,
    COUNT(CASE WHEN estado = 'en_progreso' THEN 1 END) as viajes_en_progreso,
    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as viajes_completados
    FROM viajes WHERE MONTH(fecha_programada) = MONTH(CURRENT_DATE()) AND YEAR(fecha_programada) = YEAR(CURRENT_DATE())";

$stmt = $conn->prepare($viajesQuery);
$stmt->execute();
$viajesStats = $stmt->fetch();

// Get ALL expenses statistics (TEMPORAL - para mostrar datos)
$expenseQuery = "SELECT 
    COUNT(*) as total_expenses,
    COALESCE(SUM(monto), 0) as total_amount,
    COALESCE(SUM(CASE WHEN tipo = 'combustible' THEN litros ELSE 0 END), 0) as total_fuel,
    COALESCE(SUM(CASE WHEN tipo = 'combustible' THEN monto ELSE 0 END), 0) as fuel_amount,
    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as gastos_aprobados,
    COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as gastos_negados,
    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as gastos_pendientes,
    COALESCE(SUM(CASE WHEN estado = 'aprobado' THEN monto ELSE 0 END), 0) as monto_aprobados,
    COALESCE(SUM(CASE WHEN estado = 'rechazado' THEN monto ELSE 0 END), 0) as monto_rechazados,
    COALESCE(AVG(monto), 0) as promedio_gasto
    FROM gastos WHERE 1=1" . $roleFilter;

$stmt = $conn->prepare($expenseQuery);
$stmt->execute($roleParams);
$expenseStats = $stmt->fetch();

// Get previous month for comparison
$prevMonthQuery = "SELECT 
    COALESCE(SUM(monto), 0) as prev_total_amount,
    COALESCE(SUM(CASE WHEN tipo = 'combustible' THEN litros ELSE 0 END), 0) as prev_total_fuel
    FROM gastos WHERE MONTH(fecha) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(fecha) = YEAR(CURRENT_DATE())" . $roleFilter;

$stmt = $conn->prepare($prevMonthQuery);
$stmt->execute($roleParams);
$prevStats = $stmt->fetch();

// Calculate percentage changes
$totalChange = $prevStats['prev_total_amount'] > 0 ? 
    round((($expenseStats['total_amount'] - $prevStats['prev_total_amount']) / $prevStats['prev_total_amount']) * 100, 1) : 0;
$fuelChange = $prevStats['prev_total_fuel'] > 0 ? 
    round((($expenseStats['total_fuel'] - $prevStats['prev_total_fuel']) / $prevStats['prev_total_fuel']) * 100, 1) : 0;

// Get vehicle statistics - filtered by role
if ($userRole === 'transportista') {
    // Transportistas only see vehicles they have used in expenses
    $vehicleQuery = "SELECT 
        COUNT(DISTINCT v.id) as total_vehicles,
        SUM(CASE WHEN v.estado = 'operativo' THEN 1 ELSE 0 END) as operational,
        SUM(CASE WHEN v.estado = 'mantenimiento' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN v.estado = 'fuera_servicio' THEN 1 ELSE 0 END) as out_of_service
        FROM vehiculos v 
        INNER JOIN gastos g ON v.id = g.vehiculo_id 
        WHERE g.usuario_id = ?";
    $vehicleParams = [$userId];
} else {
    // Admin and supervisor see all vehicles
    $vehicleQuery = "SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN estado = 'operativo' THEN 1 ELSE 0 END) as operational,
        SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN estado = 'fuera_servicio' THEN 1 ELSE 0 END) as out_of_service
        FROM vehiculos";
    $vehicleParams = [];
}

$stmt = $conn->prepare($vehicleQuery);
$stmt->execute($vehicleParams);
$vehicleStats = $stmt->fetch();

// Get maintenance count (current month)
$maintenanceQuery = "SELECT COUNT(*) as maintenance_count 
    FROM gastos WHERE tipo = 'mantenimiento' AND MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())" . $roleFilter;

$stmt = $conn->prepare($maintenanceQuery);
$stmt->execute($roleParams);
$maintenanceStats = $stmt->fetch();

// Get trips count (assuming each expense entry represents a trip) - current month
$tripsQuery = "SELECT COUNT(DISTINCT DATE(fecha)) as total_trips 
    FROM gastos WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())" . $roleFilter;
$stmt = $conn->prepare($tripsQuery);
$stmt->execute($roleParams);
$tripsStats = $stmt->fetch();

// Get expenses by category for chart (current month)
$categoryQuery = "SELECT tipo, SUM(monto) as total
    FROM gastos WHERE 1=1" . $roleFilter . "
    GROUP BY tipo";

$stmt = $conn->prepare($categoryQuery);
$stmt->execute($roleParams);
$categoryData = $stmt->fetchAll();

// Get monthly expenses data for the area chart
try {
    $monthlyQuery = "SELECT 
        YEAR(fecha) as year,
        MONTH(fecha) as month,
        tipo,
        SUM(monto) as total
        FROM gastos WHERE 1=1" . $roleFilter . "
        GROUP BY YEAR(fecha), MONTH(fecha), tipo
        ORDER BY YEAR(fecha), MONTH(fecha)";

    $stmt = $conn->prepare($monthlyQuery);
    $stmt->execute($roleParams);
    $monthlyData = $stmt->fetchAll();
} catch (Exception $e) {
    // Si falla la consulta mensual, usar array vacío
    $monthlyData = [];
}

$expensesByCategory = [];
foreach ($categoryData as $category) {
    $expensesByCategory[$category['tipo']] = floatval($category['total']);
}
$recentQuery = "SELECT g.*, u.nombre as usuario_nombre, v.placa 
               FROM gastos g 
               LEFT JOIN usuarios u ON g.usuario_id = u.id 
               LEFT JOIN vehiculos v ON g.vehiculo_id = v.id
               WHERE 1=1" . $roleFilter . "
               ORDER BY g.fecha DESC LIMIT 10";

$stmt = $conn->prepare($recentQuery);
$stmt->execute($roleParams);
$recentExpenses = $stmt->fetchAll();

// Build response data
$data['expenses'] = [
    'total_amount' => floatval($expenseStats['total_amount']),
    'total_fuel' => floatval($expenseStats['total_fuel']),
    'change_percentage' => $totalChange,
    'fuel_change' => $fuelChange,
    'gastos_aprobados' => intval($expenseStats['gastos_aprobados']),
    'gastos_negados' => intval($expenseStats['gastos_negados']),
    'gastos_pendientes' => intval($expenseStats['gastos_pendientes']),
    'monto_aprobados' => floatval($expenseStats['monto_aprobados']),
    'monto_rechazados' => floatval($expenseStats['monto_rechazados']),
    'promedio_gasto' => floatval($expenseStats['promedio_gasto']),
    'aprobados_change' => 0, // Mock percentage for now
    'negados_change' => 0 // Mock percentage for now
];

$data['vehicles'] = [
    'total_vehicles' => intval($vehicleStats['total_vehicles']),
    'operational' => intval($vehicleStats['operational']),
    'maintenance' => intval($vehicleStats['maintenance']),
    'out_of_service' => intval($vehicleStats['out_of_service']),
    'maintenance_count' => intval($maintenanceStats['maintenance_count']),
    'total_trips' => intval($tripsStats['total_trips']),
    'maintenance_change' => 3, // Mock percentage for now
    'trips_change' => 18 // Mock percentage for now
];

$data['viajes'] = [
    'total_viajes' => intval($viajesStats['total_viajes']),
    'viajes_pendientes' => intval($viajesStats['viajes_pendientes']),
    'viajes_en_progreso' => intval($viajesStats['viajes_en_progreso']),
    'viajes_completados' => intval($viajesStats['viajes_completados'])
];

$data['expensesByCategory'] = $expensesByCategory;
$data['monthlyExpenses'] = $monthlyData;
$data['recentActivity'] = $recentExpenses;

// Guardar en cache por 2 minutos (120 segundos) para mejorar rendimiento
$cache->set($cacheKey, $data, 120);

sendResponse($data);
?>
