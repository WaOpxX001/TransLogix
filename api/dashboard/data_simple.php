<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once '../config.php';
    
    // Get user from session for role-based filtering
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not logged in']);
        exit();
    }

    $user = [
        'id' => $_SESSION['user_id'],
        'rol' => $_SESSION['rol'] ?? 'transportista'
    ];

    $db = new Database();
    $conn = $db->getConnection();

    // Role-based filtering
    $roleFilter = '';
    $roleParams = [];

    if ($user['rol'] === 'transportista') {
        $roleFilter = ' AND g.usuario_id = :user_id';
        $roleParams = ['user_id' => $user['id']];
    }

    // Simple expense query
    $expenseQuery = "SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(monto), 0) as total_amount,
        COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as gastos_aprobados,
        COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as gastos_negados,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as gastos_pendientes,
        COALESCE(SUM(CASE WHEN estado = 'aprobado' THEN monto ELSE 0 END), 0) as monto_aprobados,
        COALESCE(SUM(CASE WHEN estado = 'rechazado' THEN monto ELSE 0 END), 0) as monto_rechazados,
        COALESCE(AVG(monto), 0) as promedio_gasto
        FROM gastos g WHERE 1=1" . $roleFilter;

    $stmt = $conn->prepare($expenseQuery);
    $stmt->execute($roleParams);
    $expenseStats = $stmt->fetch();

    // Simple response
    $data = [
        'expenses' => [
            'total_amount' => floatval($expenseStats['total_amount']),
            'total_fuel' => 180, // Mock data
            'change_percentage' => 0,
            'fuel_change' => 0,
            'gastos_aprobados' => intval($expenseStats['gastos_aprobados']),
            'gastos_negados' => intval($expenseStats['gastos_negados']),
            'gastos_pendientes' => intval($expenseStats['gastos_pendientes']),
            'monto_aprobados' => floatval($expenseStats['monto_aprobados']),
            'monto_rechazados' => floatval($expenseStats['monto_rechazados']),
            'promedio_gasto' => floatval($expenseStats['promedio_gasto'])
        ],
        'vehicles' => [
            'total_vehicles' => 1,
            'operational' => 1,
            'maintenance' => 0,
            'out_of_service' => 0,
            'maintenance_count' => 0,
            'total_trips' => 1,
            'maintenance_change' => 0,
            'trips_change' => 0
        ],
        'viajes' => [
            'total_viajes' => 1,
            'viajes_pendientes' => 1,
            'viajes_en_progreso' => 0,
            'viajes_completados' => 1
        ],
        'expensesByCategory' => [
            'combustible' => 3500,
            'mantenimiento' => 1500
        ],
        'monthlyExpenses' => [], // Vacío por ahora
        'recentActivity' => []
    ];

    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
