# 🔧 Variables de Entorno para Railway

## ✅ Variables que YA TIENES (automáticas de MySQL)

Estas las detecta Railway automáticamente:
- ✅ `MYSQLHOST`
- ✅ `MYSQLPORT`
- ✅ `MYSQLDATABASE`
- ✅ `MYSQLUSER`
- ✅ `MYSQLPASSWORD`
- ✅ `MYSQL_URL`
- ✅ `MYSQL_PUBLIC_URL`
- ✅ `MYSQL_ROOT_PASSWORD`

**NO TOQUES ESTAS** - Railway las maneja automáticamente.


## 🆕 Variables que DEBES AGREGAR

### 1. Variables de PHP (Recomendadas)

```env
PHP_VERSION=8.2
```
**Nota:** Esto ya está en `nixpacks.toml`, pero puedes agregarlo aquí también.


### 2. Variables de Zona Horaria

```env
TZ=America/Mexico_City
```
**Propósito:** Asegura que las fechas/horas sean correctas en México.


### 3. Variables de Entorno de Aplicación (Opcionales pero recomendadas)

```env
APP_ENV=production
APP_DEBUG=false
```
**Propósito:** Desactiva mensajes de error detallados en producción.


### 4. Variable de URL de la Aplicación (Opcional)

```env
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```
**Propósito:** Railway la reemplazará automáticamente con tu URL.


## ❌ Variables que NO NECESITAS

Estas NO son necesarias porque ya están en `php.ini`:
- ❌ `UPLOAD_MAX_FILESIZE` (ya en php.ini)
- ❌ `POST_MAX_SIZE` (ya en php.ini)
- ❌ `MAX_EXECUTION_TIME` (ya en php.ini)
- ❌ `MEMORY_LIMIT` (ya en php.ini)


## 🎯 RESUMEN: Variables a Agregar en Railway

### Mínimo Necesario (solo 1):
```
TZ=America/Mexico_City
```

### Recomendado (3 variables):
```
TZ=America/Mexico_City
APP_ENV=production
APP_DEBUG=false
```

### Completo (4 variables):
```
TZ=America/Mexico_City
APP_ENV=production
APP_DEBUG=false
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```


## 📝 Cómo Agregar Variables en Railway

1. Ve a tu proyecto en Railway
2. Click en tu servicio web (TransLogix)
3. Ve a la pestaña "Variables"
4. Click en "+ New Variable"
5. Agrega cada variable con su valor
6. Railway redesplegará automáticamente


## 🔒 Variables de Seguridad (Opcional - Avanzado)

Si quieres agregar seguridad extra:

```env
# JWT Secret (para tokens)
JWT_SECRET=tu_clave_secreta_muy_larga_y_aleatoria_aqui

# Session Secret
SESSION_SECRET=otra_clave_secreta_diferente_aqui
```

**Genera claves aleatorias con:**
```bash
# En PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```


## 🚫 Variables que DEBES ELIMINAR

Si ves estas variables en Railway, **ELIMÍNALAS** (son duplicadas):
- ❌ `DB_HOST` (usa `MYSQLHOST`)
- ❌ `DB_PORT` (usa `MYSQLPORT`)
- ❌ `DB_NAME` (usa `MYSQLDATABASE`)
- ❌ `DB_USER` (usa `MYSQLUSER`)
- ❌ `DB_PASSWORD` (usa `MYSQLPASSWORD`)


## ✅ Verificación Final

Después de agregar las variables, tu lista debería verse así:

### Variables de MySQL (automáticas):
- MYSQLHOST
- MYSQLPORT
- MYSQLDATABASE
- MYSQLUSER
- MYSQLPASSWORD
- MYSQL_URL
- MYSQL_PUBLIC_URL
- MYSQL_ROOT_PASSWORD

### Variables que agregaste:
- TZ
- APP_ENV
- APP_DEBUG
- APP_URL (opcional)


## 🎯 Recomendación Final

**Para empezar, solo agrega:**
```
TZ=America/Mexico_City
```

Las demás son opcionales. Tu aplicación funcionará perfectamente solo con las variables de MySQL que ya tienes.


## 🔄 Después de Agregar Variables

Railway redesplegará automáticamente. Espera 2-3 minutos y verifica:
- https://tu-app.railway.app/test-connection.php

Deberías ver las nuevas variables en el output.
