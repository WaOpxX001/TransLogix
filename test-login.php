<?php
/**
 * Test de Login - Diagnóstico
 * Accede a: https://translogix-production.up.railway.app/test-login.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Test Login</title>";
echo "<style>body{font-family:Arial;max-width:900px;margin:50px auto;padding:20px;background:#f5f5f5;}";
echo ".success{color:#28a745;}.error{color:#dc3545;}.info{color:#007bff;}";
echo "pre{background:#fff;padding:15px;border-radius:5px;overflow-x:auto;font-size:12px;}";
echo "button{padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:5px;cursor:pointer;margin:5px;}";
echo "button:hover{background:#0056b3;}</style></head><body>";

echo "<h1>🔐 Test de Login API</h1>";

try {
    require_once __DIR__ . '/config.php';
    echo "<p class='success'>✅ Config.php cargado correctamente</p>";
    
    $db = new Database();
    $conn = $db->getConnection();
    echo "<p class='success'>✅ Conexión a BD exitosa</p>";
    
    // Verificar usuarios
    $stmt = $conn->query("SELECT id, nombre, email, rol, activo FROM usuarios LIMIT 5");
    $users = $stmt->fetchAll();
    
    echo "<h3>👥 Usuarios en la base de datos:</h3>";
    echo "<table border='1' cellpadding='10' style='width:100%;border-collapse:collapse;background:#fff;'>";
    echo "<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th>Test Login</th></tr>";
    
    foreach ($users as $user) {
        $activeClass = $user['activo'] ? 'success' : 'error';
        echo "<tr>";
        echo "<td>" . $user['id'] . "</td>";
        echo "<td>" . $user['nombre'] . "</td>";
        echo "<td>" . $user['email'] . "</td>";
        echo "<td>" . $user['rol'] . "</td>";
        echo "<td class='$activeClass'>" . ($user['activo'] ? '✅ Activo' : '❌ Inactivo') . "</td>";
        echo "<td><button onclick='testLogin(\"" . htmlspecialchars($user['email']) . "\")'>Test</button></td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Test de login manual
    echo "<hr>";
    echo "<h3>🧪 Test Manual de Login</h3>";
    
    if (isset($_POST['test_email'])) {
        echo "<h4>Resultado del Test:</h4>";
        echo "<pre>";
        
        $testEmail = $_POST['test_email'];
        $testPassword = $_POST['test_password'] ?? 'admin123';
        
        echo "📧 Email: $testEmail\n";
        echo "🔑 Password: " . str_repeat('*', strlen($testPassword)) . "\n\n";
        
        // Simular login
        $stmt = $conn->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND activo = 1");
        $stmt->execute([$testEmail]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo "✅ Usuario encontrado en BD\n";
            echo "   - ID: " . $user['id'] . "\n";
            echo "   - Nombre: " . $user['nombre'] . "\n";
            echo "   - Rol: " . $user['rol'] . "\n";
            echo "   - Password hash length: " . strlen($user['password']) . "\n\n";
            
            // Verificar password
            $isPlainMatch = ($testPassword === $user['password']);
            $isHashMatch = password_verify($testPassword, $user['password']);
            
            echo "🔐 Verificación de contraseña:\n";
            echo "   - Plain text match: " . ($isPlainMatch ? '✅ SÍ' : '❌ NO') . "\n";
            echo "   - Hash match: " . ($isHashMatch ? '✅ SÍ' : '❌ NO') . "\n\n";
            
            if ($isPlainMatch || $isHashMatch) {
                echo "✅ LOGIN EXITOSO - La contraseña es correcta\n";
                echo "   El API de login debería funcionar correctamente.\n";
            } else {
                echo "❌ LOGIN FALLIDO - La contraseña no coincide\n";
                echo "   Necesitas resetear la contraseña en la base de datos.\n";
            }
        } else {
            echo "❌ Usuario no encontrado o inactivo\n";
            echo "   - Email buscado: $testEmail\n";
            echo "   - Verifica que el usuario exista y esté activo\n";
        }
        
        echo "</pre>";
    }
    
    echo "<form method='POST' style='background:#fff;padding:20px;border-radius:5px;margin-top:20px;'>";
    echo "<h4>Prueba de Login:</h4>";
    echo "<div style='margin-bottom:15px;'>";
    echo "<label>Email: <input type='email' name='test_email' value='admin@transporte.com' style='width:100%;padding:8px;' required></label>";
    echo "</div>";
    echo "<div style='margin-bottom:15px;'>";
    echo "<label>Password: <input type='text' name='test_password' value='admin123' style='width:100%;padding:8px;' required></label>";
    echo "</div>";
    echo "<button type='submit'>🧪 Probar Login</button>";
    echo "</form>";
    
    echo "<hr>";
    echo "<h3>🌐 Test de API Login (AJAX)</h3>";
    echo "<div id='apiResult'></div>";
    echo "<div style='background:#fff;padding:20px;border-radius:5px;margin-top:20px;'>";
    echo "<label>Email: <input type='email' id='apiEmail' value='admin@transporte.com' style='width:100%;padding:8px;margin-bottom:10px;'></label><br>";
    echo "<label>Password: <input type='text' id='apiPassword' value='admin123' style='width:100%;padding:8px;margin-bottom:10px;'></label><br>";
    echo "<button onclick='testApiLogin()'>🚀 Test API Login</button>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

?>

<script>
function testApiLogin() {
    const email = document.getElementById('apiEmail').value;
    const password = document.getElementById('apiPassword').value;
    const resultDiv = document.getElementById('apiResult');
    
    resultDiv.innerHTML = '<p class="info">⏳ Probando API...</p>';
    
    fetch('/api/auth/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json().then(data => ({ status: response.status, data }));
    })
    .then(({ status, data }) => {
        console.log('Response data:', data);
        if (status === 200) {
            resultDiv.innerHTML = `
                <pre class="success">✅ LOGIN EXITOSO

Status: ${status}
Response: ${JSON.stringify(data, null, 2)}</pre>
            `;
        } else {
            resultDiv.innerHTML = `
                <pre class="error">❌ LOGIN FALLIDO

Status: ${status}
Response: ${JSON.stringify(data, null, 2)}</pre>
            `;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultDiv.innerHTML = `
            <pre class="error">❌ ERROR DE RED

${error.message}

Verifica que el servidor esté respondiendo correctamente.</pre>
        `;
    });
}
</script>

</body></html>
<?php
?>
