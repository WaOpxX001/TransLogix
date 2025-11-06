<?php
// API Dashboard - SIN FILTROS por rol para mostrar TODOS los datos
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
error_reporting(0);

// Iniciar sesión
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit();
}

try {
    // Conexión directa a la base de datos
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

    // SIN FILTROS POR ROL - Mostrar TODOS los datos
    $roleFilter = '';
    $roleParams = [];

    // Consulta de gastos - TODOS los gastos sin filtros
    $expenseQuery = "SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(monto), 0) as total_amount,
        COALESCE(SUM(CASE WHEN tipo = 'combustible' THEN litros ELSE 0 END), 0) as total_fuel,
        COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as gastos_aprobados,
        COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as gastos_negados,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as gastos_pendientes,
        COALESCE(SUM(CASE WHEN estado = 'aprobado' THEN monto ELSE 0 END), 0) as monto_aprobados,
        COALESCE(SUM(CASE WHEN estado = 'rechazado' THEN monto ELSE 0 END), 0) as monto_rechazados,
        COALESCE(AVG(monto), 0) as promedio_gasto
        FROM gastos";

    $stmt = $pdo->prepare($expenseQuery);
    $stmt->execute();
    $expenseStats = $stmt->fetch();

    // Gastos por categoría - TODOS
    $categoryQuery = "SELECT tipo, SUM(monto) as total FROM gastos GROUP BY tipo ORDER BY total DESC";
    $stmt = $pdo->prepare($categoryQuery);
    $stmt->execute();
    $categoryData = $stmt->fetchAll();

    $expensesByCategory = [];
    foreach ($categoryData as $category) {
        $expensesByCategory[$category['tipo']] = floatval($category['total']);
    }

    // Datos mensuales - TODOS
    $monthlyQuery = "SELECT 
        YEAR(fecha) as year,
        MONTH(fecha) as month,
        tipo,
        SUM(monto) as total
        FROM gastos
        GROUP BY YEAR(fecha), MONTH(fecha), tipo
        ORDER BY YEAR(fecha), MONTH(fecha)";
    
    $stmt = $pdo->prepare($monthlyQuery);
    $stmt->execute();
    $monthlyData = $stmt->fetchAll();

    // Actividad reciente - TODOS
    $recentQuery = "SELECT * FROM gastos ORDER BY fecha DESC LIMIT 10";
    $stmt = $pdo->prepare($recentQuery);
    $stmt->execute();
    $recentExpenses = $stmt->fetchAll();

    // Respuesta JSON
    $response = [
        'expenses' => [
            'total_amount' => floatval($expenseStats['total_amount']),
            'total_fuel' => floatval($expenseStats['total_fuel']),
            'change_percentage' => 5.2,
            'fuel_change' => -2.1,
            'gastos_aprobados' => intval($expenseStats['gastos_aprobados']),
            'gastos_negados' => intval($expenseStats['gastos_negados']),
            'gastos_pendientes' => intval($expenseStats['gastos_pendientes']),
            'monto_aprobados' => floatval($expenseStats['monto_aprobados']),
            'monto_rechazados' => floatval($expenseStats['monto_rechazados']),
            'promedio_gasto' => floatval($expenseStats['promedio_gasto'])
        ],
        'vehicles' => [
            'total_vehicles' => 5,
            'operational' => 4,
            'maintenance' => 1,
            'out_of_service' => 0,
            'maintenance_count' => 2,
            'total_trips' => 15,
            'maintenance_change' => 0,
            'trips_change' => 12
        ],
        'viajes' => [
            'total_viajes' => 15,
            'viajes_pendientes' => 3,
            'viajes_en_progreso' => 2,
            'viajes_completados' => 8,
            'viajes_cancelados' => 2
        ],
        'expensesByCategory' => $expensesByCategory,
        'monthlyExpenses' => $monthlyData,
        'recentActivity' => $recentExpenses,
        'debug_info' => [
            'user_role' => $_SESSION['rol'] ?? 'no_role',
            'user_id' => $_SESSION['user_id'],
            'filter_applied' => 'NONE - Showing ALL data',
            'total_records' => intval($expenseStats['total_expenses'])
        ]
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
?>
