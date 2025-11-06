<?php
require_once '../../config.php';

requireRole(['admin', 'supervisor']);
$db = new Database();
$conn = $db->getConnection();

$start_date = $_GET['start_date'] ?? '';
$end_date = $_GET['end_date'] ?? '';
$format = $_GET['format'] ?? 'json';

$query = "SELECT g.id, g.monto, g.fecha, g.descripcion, g.numero_factura, g.estado,
                 u.nombre as usuario_nombre, v.placa as vehiculo_placa
         FROM gastos g 
         LEFT JOIN usuarios u ON g.usuario_id = u.id 
         LEFT JOIN vehiculos v ON g.vehiculo_id = v.id 
         WHERE g.tipo = 'combustible'";

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

// Manejar diferentes formatos de salida
switch ($format) {
    case 'csv':
        generateCSV($data, 'reporte_combustible_' . date('Y-m-d') . '.csv');
        break;
    case 'pdf':
        generatePDF($data, 'Reporte de Combustible', $start_date, $end_date);
        break;
    default:
        sendResponse($data);
}

function generateCSV($data, $filename) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    
    $output = fopen('php://output', 'w');
    
    // Encabezados
    fputcsv($output, [
        'ID', 'Monto', 'Fecha', 'Descripción', 
        'No. Factura', 'Estado', 'Usuario', 'Vehículo'
    ]);
    
    // Datos
    foreach ($data as $row) {
        fputcsv($output, [
            $row['id'],
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
    // Generar HTML para PDF
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>' . $title . '</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; }
            .period { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }
            .total { font-weight: bold; background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>TransportePro</h1>
            <h2>' . $title . '</h2>
            <div class="period">Período: ' . date('d/m/Y', strtotime($start_date)) . ' - ' . date('d/m/Y', strtotime($end_date)) . '</div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Vehículo</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>';
    
    $total = 0;
    foreach ($data as $row) {
        $total += $row['monto'];
        $html .= '<tr>
            <td>' . $row['id'] . '</td>
            <td class="amount">$' . number_format($row['monto'], 2) . '</td>
            <td>' . date('d/m/Y', strtotime($row['fecha'])) . '</td>
            <td>' . $row['usuario_nombre'] . '</td>
            <td>' . ($row['vehiculo_placa'] ?? 'N/A') . '</td>
            <td>' . ucfirst($row['estado']) . '</td>
        </tr>';
    }
    
    $html .= '<tr class="total">
            <td><strong>TOTAL</strong></td>
            <td class="amount"><strong>$' . number_format($total, 2) . '</strong></td>
            <td colspan="4"></td>
        </tr>
        </tbody>
        </table>
        
        <div style="margin-top: 30px; font-size: 10px; color: #666;">
            Generado el ' . date('d/m/Y H:i:s') . ' por TransportePro
        </div>
    </body>
    </html>';
    
    // Enviar como descarga HTML (que se puede imprimir como PDF)
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="reporte_combustible_' . date('Y-m-d') . '.html"');
    echo $html;
    exit;
}
