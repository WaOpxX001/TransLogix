-- Tabla para almacenar sesiones en MySQL
-- Esto permite que las sesiones persistan en Railway

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    data TEXT,
    last_activity INT(10) UNSIGNED NOT NULL,
    INDEX (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Limpiar sesiones antiguas (más de 24 horas)
DELETE FROM sessions WHERE last_activity < UNIX_TIMESTAMP() - 86400;
