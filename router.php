<?php
/**
 * Router para servidor integrado de PHP
 * Simula el comportamiento de Apache con .htaccess
 */

// Obtener la URI solicitada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = urldecode($uri);

// Log para debugging (comentar en producción)
error_log("Router: URI solicitada = $uri");

// Si es una solicitud OPTIONS (CORS preflight), responder inmediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
    exit;
}

// Rutas API - manejar directamente
if (strpos($uri, '/api/') === 0 || strpos($uri, 'api/') === 0) {
    // Asegurar que el path empiece con /
    $apiPath = strpos($uri, '/') === 0 ? $uri : '/' . $uri;
    $apiFile = __DIR__ . $apiPath;
    
    // Si el archivo existe y es PHP, incluirlo
    if (file_exists($apiFile) && pathinfo($apiFile, PATHINFO_EXTENSION) === 'php') {
        error_log("Router: Sirviendo API = $apiFile");
        
        // Configurar headers CORS para API
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        include $apiFile;
        exit;
    }
    
    // Si es un directorio API, buscar index.php
    if (is_dir($apiFile)) {
        $indexFile = rtrim($apiFile, '/') . '/index.php';
        if (file_exists($indexFile)) {
            error_log("Router: Sirviendo API index = $indexFile");
            include $indexFile;
            exit;
        }
    }
}

// Archivos estáticos - dejar que PHP los maneje
$path = __DIR__ . $uri;

// Si es un directorio, buscar index.html o index.php
if ($uri === '/' || is_dir($path)) {
    $indexHtml = rtrim($path, '/') . '/index.html';
    $indexPhp = rtrim($path, '/') . '/index.php';
    
    if (file_exists($indexHtml)) {
        error_log("Router: Sirviendo index.html");
        header('Content-Type: text/html; charset=UTF-8');
        readfile($indexHtml);
        exit;
    } elseif (file_exists($indexPhp)) {
        error_log("Router: Sirviendo index.php");
        include $indexPhp;
        exit;
    }
}

// Si el archivo existe, determinar el content-type y servirlo
if (file_exists($path) && is_file($path)) {
    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    
    // Mapa de tipos MIME
    $mimeTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'otf' => 'font/otf'
    ];
    
    // Configurar content-type si está definido
    if (isset($mimeTypes[$extension])) {
        header('Content-Type: ' . $mimeTypes[$extension]);
    }
    
    // Configurar cache para assets estáticos
    if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'css', 'js'])) {
        header('Cache-Control: public, max-age=31536000');
    }
    
    error_log("Router: Sirviendo archivo estático = $path");
    readfile($path);
    exit;
}

// Si es un archivo PHP, ejecutarlo
if (substr($path, -4) === '.php' && file_exists($path)) {
    error_log("Router: Ejecutando PHP = $path");
    include $path;
    exit;
}

// Si llegamos aquí, servir index.html por defecto (SPA)
error_log("Router: Fallback a index.html");
if (file_exists(__DIR__ . '/index.html')) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile(__DIR__ . '/index.html');
    exit;
}

// Si no hay index.html, error 404
http_response_code(404);
echo json_encode(['error' => 'Not Found', 'uri' => $uri]);
?>