<?php
/**
 * Verificación Rápida de Base de Datos
 * Visita: https://tu-app.railway.app/check-db.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Check DB</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
        .success { color: #4ade80; }
        .error { color: #f87171; }
        .warning { color: #fbbf24; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #444; padding: 10px; text-align: left; }
        th { background: #2a2a2a; }
    </style>
</head>
<body>
    <h1>🔍 Verificación de Base de Datos</h1>
    
    <?php
    require_once 'config.php';
    
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        echo '<p class="success">✅ Conexión exitosa</p>';
        
        // Verificar tablas y contar registros
        $tables = [
            'usuarios' => 'SELECT COUNT(*) as count FROM usuarios',
            'viajes' => 'SELECT COUNT(*) as count FROM viajes',
            'gastos' => 'SELECT COUNT(*) as count FROM gastos',
            'transportistas' => 'SELECT COUNT(*) as count FROM transportistas',
            'vehiculos' => 'SELECT COUNT(*) as count FROM vehiculos',
        ];
        
        echo '<h2>📊 Tablas y Registros</h2>';
        echo '<table>';
        echo '<tr><th>Tabla</th><th>Registros</th><th>Estado</th></tr>';
        
        $totalRecords = 0;
        foreach ($tables as $table => $query) {
            try {
                $stmt = $conn->query($query);
                $result = $stmt->fetch();
                $count = $result['count'];
                $totalRecords += $count;
                
                $status = $count > 0 ? '<span class="success">✅ Con datos</span>' : '<span class="warning">⚠️ Vacía</span>';
                echo "<tr><td>{$table}</td><td>{$count}</td><td>{$status}</td></tr>";
            } catch (Exception $e) {
                echo "<tr><td>{$table}</td><td>-</td><td><span class='error'>❌ No existe</span></td></tr>";
            }
        }
        
        echo '</table>';
        
        if ($totalRecords === 0) {
            echo '<div class="error">';
            echo '<h2>❌ BASE DE DATOS VACÍA</h2>';
            echo '<p>Tu base de datos no tiene datos. Necesitas importar tu archivo SQL.</p>';
            echo '<h3>Solución:</h3>';
            echo '<pre>';
            echo "# Opción 1: Railway CLI\n";
            echo "npm install -g @railway/cli\n";
            echo "railway login\n";
            echo "railway link\n";
            echo "railway run php init-railway-db.php\n\n";
            echo "# Opción 2: MySQL Workbench\n";
            echo "1. En Railway, ve a MySQL → Connect\n";
            echo "2. Copia las credenciales\n";
            echo "3. Conéctate con MySQL Workbench\n";
            echo "4. Importa tu archivo database/transporte_db.sql\n";
            echo '</pre>';
            echo '</div>';
        } else {
            echo '<p class="success">✅ Base de datos tiene ' . $totalRecords . ' registros en total</p>';
        }
        
        // Verificar usuarios
        echo '<h2>👥 Usuarios de Prueba</h2>';
        $stmt = $conn->query("SELECT id, nombre, email, rol FROM usuarios LIMIT 5");
        $users = $stmt->fetchAll();
        
        if (count($users) > 0) {
            echo '<table>';
            echo '<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th></tr>';
            foreach ($users as $user) {
                echo "<tr>";
                echo "<td>{$user['id']}</td>";
                echo "<td>{$user['nombre']}</td>";
                echo "<td>{$user['email']}</td>";
                echo "<td>{$user['rol']}</td>";
                echo "</tr>";
            }
            echo '</table>';
            echo '<p class="success">✅ Puedes hacer login con estos usuarios</p>';
        } else {
            echo '<p class="error">❌ No hay usuarios. Importa tu SQL.</p>';
        }
        
    } catch (Exception $e) {
        echo '<p class="error">❌ Error: ' . $e->getMessage() . '</p>';
    }
    ?>
    
    <hr>
    <p><small>Timestamp: <?php echo date('Y-m-d H:i:s'); ?></small></p>
</body>
</html>
