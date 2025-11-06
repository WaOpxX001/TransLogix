<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../config/auth.php';

// Verificar autenticación
$auth = new Auth();
$user = $auth->checkAuth();

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

// Obtener parámetros
$reportType = $_GET['type'] ?? 'gastos';
$startDate = $_GET['start'] ?? date('Y-m-01');
$endDate = $_GET['end'] ?? date('Y-m-d');
$transportistaId = $_GET['transportista_id'] ?? null;

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Obtener datos según el tipo de reporte
    if ($reportType === 'gastos') {
        $query = "SELECT g.*, u.nombre as usuario_nombre, v.placa as vehiculo_placa 
                  FROM gastos g
                  LEFT JOIN usuarios u ON g.usuario_id = u.id
                  LEFT JOIN vehiculos v ON g.vehiculo_id = v.id
                  WHERE g.fecha BETWEEN :start AND :end";
        
        if ($transportistaId && $transportistaId !== 'all') {
            $query .= " AND g.usuario_id = :transportista_id";
        }
        
        $query .= " ORDER BY g.fecha DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':start', $startDate);
        $stmt->bindParam(':end', $endDate);
        
        if ($transportistaId && $transportistaId !== 'all') {
            $stmt->bindParam(':transportista_id', $transportistaId);
        }
        
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular estadísticas
        $totalMonto = 0;
        $combustibleLitros = 0;
        
        foreach ($data as $gasto) {
            $totalMonto += floatval($gasto['monto']);
            if ($gasto['tipo'] === 'combustible') {
                $combustibleLitros += floatval($gasto['litros'] ?? 0);
            }
        }
        
        $stats = [
            'total_monto' => $totalMonto,
            'promedio_gasto' => count($data) > 0 ? $totalMonto / count($data) : 0,
            'combustible_litros' => $combustibleLitros,
            'total_registros' => count($data)
        ];
        
    } else {
        // Viajes
        $query = "SELECT v.*, u.nombre as transportista_nombre, vh.placa as vehiculo_placa 
                  FROM viajes v
                  LEFT JOIN usuarios u ON v.transportista_id = u.id
                  LEFT JOIN vehiculos vh ON v.vehiculo_id = vh.id
                  WHERE v.fecha_programada BETWEEN :start AND :end";
        
        if ($transportistaId && $transportistaId !== 'all') {
            $query .= " AND v.transportista_id = :transportista_id";
        }
        
        $query .= " ORDER BY v.fecha_programada DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':start', $startDate);
        $stmt->bindParam(':end', $endDate);
        
        if ($transportistaId && $transportistaId !== 'all') {
            $stmt->bindParam(':transportista_id', $transportistaId);
        }
        
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular estadísticas
        $stats = [
            'total' => count($data),
            'completados' => 0,
            'en_progreso' => 0,
            'pendientes' => 0,
            'cancelados' => 0
        ];
        
        foreach ($data as $viaje) {
            $estado = $viaje['estado'];
            if ($estado === 'completado') $stats['completados']++;
            elseif ($estado === 'en_progreso' || $estado === 'en_ruta') $stats['en_progreso']++;
            elseif ($estado === 'pendiente') $stats['pendientes']++;
            elseif ($estado === 'cancelado') $stats['cancelados']++;
        }
    }
    
    // Generar HTML para el PDF
    $html = generatePDFHTML($reportType, $data, $stats, $startDate, $endDate);
    
    // Guardar HTML temporalmente
    $filename = 'reporte_' . $reportType . '_' . time() . '.html';
    $filepath = '../../temp/' . $filename;
    
    // Crear directorio temp si no existe
    if (!file_exists('../../temp')) {
        mkdir('../../temp', 0777, true);
    }
    
    file_put_contents($filepath, $html);
    
    // Retornar la URL del archivo
    echo json_encode([
        'success' => true,
        'url' => '/LogisticaFinal/temp/' . $filename,
        'filename' => 'reporte_' . $reportType . '_' . date('Y-m-d') . '.pdf'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al generar PDF: ' . $e->getMessage()
    ]);
}

function generatePDFHTML($type, $data, $stats, $startDate, $endDate) {
    $title = $type === 'gastos' ? '📊 Reporte de Gastos' : '🚛 Reporte de Viajes';
    
    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>' . $title . '</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            background: white;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 14px;
        }
        .stats-container { 
            display: flex; 
            justify-content: space-around; 
            margin: 30px 0;
            gap: 15px;
        }
        .stat-box { 
            flex: 1;
            text-align: center; 
            padding: 20px; 
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background: #f8f9fa;
        }
        .stat-box h3 {
            font-size: 32px;
            color: #007bff;
            margin-bottom: 8px;
        }
        .stat-box p {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section-title {
            font-size: 20px;
            color: #333;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            font-size: 12px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 10px 8px; 
            text-align: left; 
        }
        th { 
            background-color: #007bff;
            color: white;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #28a745; color: white; }
        .badge-warning { background: #ffc107; color: #333; }
        .badge-danger { background: #dc3545; color: white; }
        .badge-info { background: #17a2b8; color: white; }
        .badge-secondary { background: #6c757d; color: white; }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 11px;
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>';
    
    if ($type === 'gastos') {
        $html .= '
    <div class="header">
        <h1>📊 Reporte de Gastos</h1>
        <p>Período: ' . $startDate . ' - ' . $endDate . '</p>
    </div>
    
    <div class="stats-container">
        <div class="stat-box">
            <h3>$' . number_format($stats['total_monto'], 2) . '</h3>
            <p>Total de Gastos</p>
        </div>
        <div class="stat-box">
            <h3>' . $stats['total_registros'] . '</h3>
            <p>Número de Registros</p>
        </div>
        <div class="stat-box">
            <h3>$' . number_format($stats['promedio_gasto'], 2) . '</h3>
            <p>Promedio por Gasto</p>
        </div>
        <div class="stat-box">
            <h3>' . number_format($stats['combustible_litros'], 2) . ' L</h3>
            <p>Combustible</p>
        </div>
    </div>
    
    <h3 class="section-title">Detalle de Gastos</h3>
    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>Vehículo</th>
                <th>Monto</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>';
        
        foreach ($data as $gasto) {
            $badgeClass = 'badge-secondary';
            if ($gasto['estado'] === 'aprobado') $badgeClass = 'badge-success';
            elseif ($gasto['estado'] === 'pendiente') $badgeClass = 'badge-warning';
            elseif ($gasto['estado'] === 'rechazado') $badgeClass = 'badge-danger';
            
            $html .= '
            <tr>
                <td>' . date('d/m/Y', strtotime($gasto['fecha'])) . '</td>
                <td>' . htmlspecialchars($gasto['tipo']) . '</td>
                <td>' . htmlspecialchars($gasto['usuario_nombre'] ?? 'N/A') . '</td>
                <td>' . htmlspecialchars($gasto['vehiculo_placa'] ?? 'N/A') . '</td>
                <td style="font-weight: bold;">$' . number_format($gasto['monto'], 2) . '</td>
                <td><span class="badge ' . $badgeClass . '">' . htmlspecialchars($gasto['estado']) . '</span></td>
            </tr>';
        }
        
        $html .= '
        </tbody>
    </table>';
        
    } else {
        // Viajes
        $html .= '
    <div class="header">
        <h1>🚛 Reporte de Viajes</h1>
        <p>Período: ' . $startDate . ' - ' . $endDate . '</p>
    </div>
    
    <div class="stats-container">
        <div class="stat-box">
            <h3>' . $stats['total'] . '</h3>
            <p>Total de Viajes</p>
        </div>
        <div class="stat-box">
            <h3>' . $stats['completados'] . '</h3>
            <p>Completados</p>
        </div>
        <div class="stat-box">
            <h3>' . $stats['en_progreso'] . '</h3>
            <p>En Progreso</p>
        </div>
        <div class="stat-box">
            <h3>' . $stats['pendientes'] . '</h3>
            <p>Pendientes</p>
        </div>
    </div>
    
    <h3 class="section-title">Detalle de Viajes</h3>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Transportista</th>
                <th>Vehículo</th>
            </tr>
        </thead>
        <tbody>';
        
        foreach ($data as $viaje) {
            $badgeClass = 'badge-secondary';
            if ($viaje['estado'] === 'completado') $badgeClass = 'badge-success';
            elseif ($viaje['estado'] === 'en_progreso' || $viaje['estado'] === 'en_ruta') $badgeClass = 'badge-info';
            elseif ($viaje['estado'] === 'pendiente') $badgeClass = 'badge-warning';
            elseif ($viaje['estado'] === 'cancelado') $badgeClass = 'badge-danger';
            
            $html .= '
            <tr>
                <td>' . $viaje['id'] . '</td>
                <td>' . htmlspecialchars($viaje['origen']) . '</td>
                <td>' . htmlspecialchars($viaje['destino']) . '</td>
                <td>' . date('d/m/Y', strtotime($viaje['fecha_programada'])) . '</td>
                <td><span class="badge ' . $badgeClass . '">' . htmlspecialchars($viaje['estado']) . '</span></td>
                <td>' . htmlspecialchars($viaje['transportista_nombre'] ?? 'N/A') . '</td>
                <td>' . htmlspecialchars($viaje['vehiculo_placa'] ?? 'N/A') . '</td>
            </tr>';
        }
        
        $html .= '
        </tbody>
    </table>';
    }
    
    $html .= '
    <div class="footer">
        <p>Generado el ' . date('d/m/Y H:i:s') . ' | Sistema de Logística</p>
    </div>
    
    <script>
        // Auto-imprimir cuando se carga la página
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>';
    
    return $html;
}
