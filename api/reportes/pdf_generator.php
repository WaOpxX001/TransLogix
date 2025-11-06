<?php
// Simple PDF generator using TCPDF or HTML to PDF conversion
require_once '../../config.php';

function generatePDFReport($data, $title, $start_date, $end_date, $type = 'gastos') {
    // Clear any previous output
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    // Generate HTML content
    $html = generateReportHTML($data, $title, $start_date, $end_date, $type);
    
    // Set proper headers for PDF download
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: inline; filename="reporte_' . $type . '_' . date('Y-m-d') . '.html"');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    
    // Add print styles for better PDF conversion
    $printStyles = '
    <style media="print">
        @page { margin: 1cm; }
        body { font-size: 12px; }
        .no-print { display: none; }
        table { page-break-inside: avoid; }
        tr { page-break-inside: avoid; }
    </style>
    <script>
        window.onload = function() {
            // Auto-trigger print dialog for PDF conversion
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>';
    
    // Insert print styles before closing head tag
    $html = str_replace('</head>', $printStyles . '</head>', $html);
    
    echo $html;
    exit;
}

function generateReportHTML($data, $title, $start_date, $end_date, $type) {
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>' . $title . '</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                font-size: 14px; 
                margin: 20px;
                color: #333;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #007bff;
                padding-bottom: 20px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
                font-size: 28px;
            }
            .header h2 {
                color: #666;
                margin: 10px 0;
                font-size: 20px;
            }
            .period { 
                color: #666; 
                margin-bottom: 20px; 
                text-align: center;
                font-size: 16px;
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 12px 8px; 
                text-align: left; 
            }
            th { 
                background-color: #007bff; 
                color: white;
                font-weight: bold; 
                text-align: center;
            }
            .amount { text-align: right; font-weight: bold; }
            .total { 
                font-weight: bold; 
                background-color: #e9ecef; 
                border-top: 2px solid #007bff;
            }
            .footer {
                margin-top: 30px; 
                font-size: 12px; 
                color: #666;
                text-align: center;
                border-top: 1px solid #ddd;
                padding-top: 20px;
            }
            .stats {
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
            }
            .stat-item {
                text-align: center;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
            }
            .stat-label {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚛 TransportePro</h1>
            <h2>' . $title . '</h2>
        </div>
        
        <div class="period">
            📅 Período: ' . date('d/m/Y', strtotime($start_date)) . ' - ' . date('d/m/Y', strtotime($end_date)) . '
        </div>';

    if ($type === 'gastos') {
        // Calculate statistics
        $total = 0;
        $typeStats = [];
        foreach ($data as $row) {
            $total += $row['monto'];
            $tipo = ucfirst($row['tipo']);
            if (!isset($typeStats[$tipo])) {
                $typeStats[$tipo] = ['count' => 0, 'amount' => 0];
            }
            $typeStats[$tipo]['count']++;
            $typeStats[$tipo]['amount'] += $row['monto'];
        }

        $html .= '
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">' . count($data) . '</div>
                <div class="stat-label">Total Gastos</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">$' . number_format($total, 0) . '</div>
                <div class="stat-label">Monto Total</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">' . count($typeStats) . '</div>
                <div class="stat-label">Tipos de Gasto</div>
            </div>
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
            <tbody>';
        
        foreach ($data as $row) {
            $html .= '<tr>
                <td style="text-align: center;">' . $row['id'] . '</td>
                <td>' . ucfirst($row['tipo']) . '</td>
                <td class="amount">$' . number_format($row['monto'], 2) . '</td>
                <td style="text-align: center;">' . date('d/m/Y', strtotime($row['fecha'])) . '</td>
                <td>' . $row['usuario_nombre'] . '</td>
                <td style="text-align: center;">' . ($row['vehiculo_placa'] ?? 'N/A') . '</td>
                <td style="text-align: center;">' . ucfirst($row['estado']) . '</td>
            </tr>';
        }
        
        $html .= '<tr class="total">
                <td colspan="2"><strong>TOTAL GENERAL</strong></td>
                <td class="amount"><strong>$' . number_format($total, 2) . '</strong></td>
                <td colspan="4"></td>
            </tr>';
    }

    $html .= '
            </tbody>
        </table>
        
        <div class="footer">
            📊 Generado el ' . date('d/m/Y H:i:s') . ' por TransportePro<br>
            <small>Para guardar como PDF: Ctrl+P → Guardar como PDF</small>
        </div>
    </body>
    </html>';
    
    return $html;
}
?>
