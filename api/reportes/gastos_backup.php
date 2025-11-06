<?php
// Disable HTML error output and enable JSON error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Don't set content type here - will be set based on format

try {
    require_once '../../config.php';
    requireRole(['admin', 'supervisor']);
    
    $db = new Database();
    $conn = $db->getConnection();

$start_date = $_GET['start'] ?? $_GET['start_date'] ?? '';
$end_date = $_GET['end'] ?? $_GET['end_date'] ?? '';
$format = $_GET['format'] ?? 'json';


// Debug: Log the received parameters
error_log("Gastos.php - Start date: " . $start_date . ", End date: " . $end_date . ", Format: " . $format);

// Si no hay fecha de fin, usar la fecha actual
if (!$end_date && $start_date) {
    $end_date = date('Y-m-d');
    error_log("Gastos.php - End date set to current: " . $end_date);
}

$query = "SELECT g.id, g.tipo, g.monto, g.fecha, g.descripcion, g.numero_factura, g.estado,
                 u.nombre as usuario_nombre, v.placa as vehiculo_placa, g.litros, g.kilometraje
         FROM gastos g 
         LEFT JOIN usuarios u ON g.usuario_id = u.id 
         LEFT JOIN vehiculos v ON g.vehiculo_id = v.id 
         WHERE 1=1";

$params = [];
if ($start_date) {
    $query .= " AND g.fecha >= ?";
    $params[] = $start_date;
}
if ($end_date) {
    $query .= " AND g.fecha <= ?";
    $params[] = $end_date;
}

$query .= " ORDER BY g.fecha DESC";

$stmt = $conn->prepare($query);
$stmt->execute($params);
$data = $stmt->fetchAll();

// Debug: Log query results
error_log("Gastos.php - Query: " . $query);
error_log("Gastos.php - Params: " . json_encode($params));
error_log("Gastos.php - Found " . count($data) . " records");

// Debug: Log each record found
foreach ($data as $record) {
    error_log("Gastos.php - Record: ID=" . $record['id'] . ", Date=" . $record['fecha'] . ", Type=" . $record['tipo'] . ", Amount=" . $record['monto']);
}

// Debug: Log the format being requested
error_log("Gastos.php - Format requested: " . $format);
error_log("Gastos.php - GET parameters: " . json_encode($_GET));

// Calcular estadísticas adicionales
$stats = [
    'total_gastos' => count($data),
    'total_monto' => 0,
    'por_tipo' => [],
    'combustible_litros' => 0,
    'combustible_monto' => 0
];

foreach ($data as $gasto) {
    $stats['total_monto'] += floatval($gasto['monto']);
    
    // Agrupar por tipo
    if (!isset($stats['por_tipo'][$gasto['tipo']])) {
        $stats['por_tipo'][$gasto['tipo']] = [
            'cantidad' => 0,
            'monto' => 0
        ];
    }
    $stats['por_tipo'][$gasto['tipo']]['cantidad']++;
    $stats['por_tipo'][$gasto['tipo']]['monto'] += floatval($gasto['monto']);
    
    // Estadísticas específicas de combustible
    if ($gasto['tipo'] === 'combustible') {
        $stats['combustible_litros'] += floatval($gasto['litros'] ?? 0);
        $stats['combustible_monto'] += floatval($gasto['monto']);
    }
}

// Agregar información del período
$stats['periodo'] = [
    'fecha_inicio' => $start_date,
    'fecha_fin' => $end_date
];

// Manejar diferentes formatos de salida
error_log("Gastos.php - About to process format: " . $format);

if ($format === 'csv') {
    error_log("Gastos.php - Processing CSV format");
    generateCSV($data, 'reporte_gastos_' . date('Y-m-d') . '.csv');
    exit;
} elseif ($format === 'pdf') {
    error_log("Gastos.php - Processing PDF format");
    generatePDF($data, 'Reporte de Gastos', $start_date, $end_date);
    exit;
} else {
    error_log("Gastos.php - Processing JSON format (default)");
    header('Content-Type: application/json; charset=utf-8');
    $response = [
        'data' => $data,
        'stats' => $stats
    ];
    
    // Debug: Log the response being sent
    error_log("Gastos.php - Sending response with " . count($data) . " records");
    error_log("Gastos.php - Response structure: " . json_encode(['data_count' => count($data), 'has_stats' => !empty($stats)]));
    
    sendResponse($response);
}

function generateCSV($data, $filename) {
    // Clear any previous output
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Set headers for CSV download
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    header('Pragma: public');
    
    $output = fopen('php://output', 'w');
    
    // Encabezados
    fputcsv($output, [
        'ID', 'Tipo', 'Monto', 'Fecha', 'Descripción', 
        'No. Factura', 'Estado', 'Usuario', 'Vehículo'
    ]);
    
    // Datos
    foreach ($data as $row) {
        fputcsv($output, [
            $row['id'],
            ucfirst($row['tipo']),
            '$' . number_format($row['monto'], 2),
            date('d/m/Y', strtotime($row['fecha'])),
            $row['descripcion'],
            $row['numero_factura'],
            ucfirst($row['estado']),
            $row['usuario_nombre'],
            $row['vehiculo_placa'] ?? 'N/A'
        ]);
    }
    
    fclose($output);
    exit;
}

function generatePDF($data, $title, $start_date, $end_date) {
    // Clear any previous output
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Simple HTML generation without complex function
    $total = 0;
    foreach ($data as $row) {
        $total += floatval($row['monto']);
    }
    
    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Gastos</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #007bff; color: white; }
        .total { background: #f0f0f0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TransportePro - Reporte de Gastos</h1>
        <p>Período: ' . date('d/m/Y', strtotime($start_date)) . ' - ' . date('d/m/Y', strtotime($end_date)) . '</p>
    </div>
    <table>
        <tr>
            <th>ID</th><th>Tipo</th><th>Monto</th><th>Fecha</th><th>Usuario</th><th>Vehículo</th>
        </tr>';
    
    foreach ($data as $row) {
        $html .= '<tr>
            <td>' . htmlspecialchars($row['id']) . '</td>
            <td>' . htmlspecialchars(ucfirst($row['tipo'])) . '</td>
            <td>$' . number_format(floatval($row['monto']), 2) . '</td>
            <td>' . date('d/m/Y', strtotime($row['fecha'])) . '</td>
            <td>' . htmlspecialchars($row['usuario_nombre']) . '</td>
            <td>' . htmlspecialchars($row['vehiculo_placa'] ?? 'N/A') . '</td>
        </tr>';
    }
    
    $html .= '<tr class="total">
            <td colspan="2"><strong>TOTAL</strong></td>
            <td><strong>$' . number_format($total, 2) . '</strong></td>
            <td colspan="3"></td>
        </tr>
    </table>
</body>
</html>';
    
    // Set headers for HTML download
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="reporte_gastos_' . date('Y-m-d') . '.html"');
    
    echo $html;
    exit;
}

function generateSimplePDF($data, $title, $start_date, $end_date) {
    $total = 0;
    foreach ($data as $row) {
        $total += floatval($row['monto']);
    }
    
    $tableRows = '';
    foreach ($data as $row) {
        $tableRows .= '<tr>
            <td style="text-align: center;">' . htmlspecialchars($row['id']) . '</td>
            <td>' . htmlspecialchars(ucfirst($row['tipo'])) . '</td>
            <td class="amount">$' . number_format(floatval($row['monto']), 2) . '</td>
            <td style="text-align: center;">' . date('d/m/Y', strtotime($row['fecha'])) . '</td>
            <td>' . htmlspecialchars($row['usuario_nombre']) . '</td>
            <td style="text-align: center;">' . htmlspecialchars($row['vehiculo_placa'] ?? 'N/A') . '</td>
            <td style="text-align: center;">' . htmlspecialchars(ucfirst($row['estado'])) . '</td>
        </tr>';
    }
    
    return '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>' . $title . '</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
        .header h1 { color: #007bff; margin: 0; }
        .period { text-align: center; background: #f8f9fa; padding: 10px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #007bff; color: white; text-align: center; }
        .amount { text-align: right; font-weight: bold; }
        .total { background: #e9ecef; font-weight: bold; }
        @media print { body { margin: 0; } }
    </style>
    <script>
        window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
        }
    </script>
</head>
<body>
    <div class="header">
        <h1>🚛 TransportePro</h1>
        <h2>' . $title . '</h2>
    </div>
    
    <div class="period">
        📅 Período: ' . date('d/m/Y', strtotime($start_date)) . ' - ' . date('d/m/Y', strtotime($end_date)) . '
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Vehículo</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>' . $tableRows . '
            <tr class="total">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td class="amount"><strong>$' . number_format($total, 2) . '</strong></td>
                <td colspan="4"></td>
            </tr>
        </tbody>
    </table>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
        Generado el ' . date('d/m/Y H:i:s') . ' por TransportePro<br>
        <small>Presiona Ctrl+P para imprimir o guardar como PDF</small>
    </div>
</body>
</html>';
}

} catch (Exception $e) {
    error_log("Error in gastos.php: " . $e->getMessage());
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['error' => 'Error al generar el reporte: ' . $e->getMessage()]);
    exit;
}
?>
