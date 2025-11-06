# 🚂 Guía de Despliegue en Railway - TransportePro

## 📋 Pre-requisitos

1. Cuenta en [Railway.app](https://railway.app)
2. Repositorio Git (GitHub, GitLab, o Bitbucket)
3. Base de datos MySQL lista

## 🚀 Pasos para Desplegar

### 1. Preparar el Proyecto

```bash
# Asegúrate de que todos los archivos estén commiteados
git add .
git commit -m "Preparado para Railway"
git push origin main
```

### 2. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway a acceder a tu repositorio
5. Selecciona el repositorio de TransportePro

### 3. Agregar Base de Datos MySQL

1. En tu proyecto de Railway, click en "+ New"
2. Selecciona "Database" → "Add MySQL"
3. Railway creará automáticamente una base de datos MySQL
4. Las variables de entorno se configurarán automáticamente

### 4. Configurar Variables de Entorno

Railway detectará automáticamente estas variables de MySQL:
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`

**Variables adicionales que debes agregar manualmente:**

```env
# Configuración de PHP
PHP_VERSION=8.2
UPLOAD_MAX_FILESIZE=10M
POST_MAX_SIZE=10M
MAX_EXECUTION_TIME=300

# Configuración de la aplicación
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-app.railway.app

# Zona horaria
TZ=America/Mexico_City
```

### 5. Importar Base de Datos

**Opción A: Desde Railway CLI**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Importar SQL
railway run mysql -u root -p < database/transporte_db.sql
```

**Opción B: Desde MySQL Workbench o phpMyAdmin**
1. Obtén las credenciales de conexión desde Railway
2. Conéctate usando MySQL Workbench
3. Importa el archivo `database/transporte_db.sql`

**Opción C: Desde la terminal de Railway**
1. Ve a tu servicio MySQL en Railway
2. Click en "Connect"
3. Copia el comando de conexión
4. Ejecuta: `mysql -h [host] -u [user] -p[password] [database] < database/transporte_db.sql`

### 6. Verificar Despliegue

1. Railway generará una URL automáticamente
2. Visita: `https://tu-proyecto.railway.app`
3. Deberías ver la pantalla de login

## 🔧 Solución de Problemas Comunes

### Error: "Connection refused"

**Causa:** La base de datos no está lista o las credenciales son incorrectas.

**Solución:**
```bash
# Verificar variables de entorno
railway variables

# Verificar logs
railway logs
```

### Error: "502 Bad Gateway"

**Causa:** El servidor PHP no está iniciando correctamente.

**Solución:**
1. Verifica que `Procfile` existe
2. Verifica que `nixpacks.toml` tiene PHP 8.2
3. Revisa los logs: `railway logs`

### Error: "Database not found"

**Causa:** La base de datos no se ha creado o importado.

**Solución:**
```bash
# Conectar a MySQL
railway connect mysql

# Crear base de datos
CREATE DATABASE IF NOT EXISTS transporte_db;
USE transporte_db;

# Importar SQL
source database/transporte_db.sql;
```

### Error: "Upload failed" o "File too large"

**Causa:** Límites de PHP muy bajos.

**Solución:**
Agregar en variables de entorno:
```env
UPLOAD_MAX_FILESIZE=10M
POST_MAX_SIZE=10M
MEMORY_LIMIT=256M
```

### Error: "CORS policy"

**Causa:** Problemas de CORS en producción.

**Solución:**
Agregar en `api/config/cors.php`:
```php
header('Access-Control-Allow-Origin: https://tu-app.railway.app');
```

### Error: "Session not working"

**Causa:** Sesiones no persisten en Railway.

**Solución:**
Usar base de datos para sesiones o configurar Redis.

## 📊 Monitoreo

### Ver Logs en Tiempo Real
```bash
railway logs --follow
```

### Ver Métricas
1. Ve a tu proyecto en Railway
2. Click en "Metrics"
3. Verás CPU, RAM, y tráfico de red

### Configurar Alertas
1. Ve a "Settings" → "Notifications"
2. Configura alertas por email o Slack

## 🔐 Seguridad

### 1. Cambiar Credenciales por Defecto
- Cambia las contraseñas de usuarios demo
- Usa contraseñas fuertes para la base de datos

### 2. Configurar HTTPS
Railway proporciona HTTPS automáticamente ✅

### 3. Proteger Archivos Sensibles
El `.htaccess` ya protege archivos sensibles ✅

### 4. Configurar Backups
```bash
# Backup manual
railway run mysqldump -u root -p transporte_db > backup.sql

# Programar backups automáticos en Railway
# Settings → Backups → Enable
```

## 🚀 Optimizaciones

### 1. Habilitar Caché
Railway tiene caché automático de assets estáticos ✅

### 2. Comprimir Assets
```bash
# Minificar CSS y JS antes de deploy
npm install -g minify
minify assets/css/styles.css > assets/css/styles.min.css
```

### 3. Optimizar Imágenes
```bash
# Comprimir imágenes
npm install -g imagemin-cli
imagemin uploads/*.jpg --out-dir=uploads/optimized
```

## 📱 Dominio Personalizado

### Agregar Dominio Propio

1. Ve a "Settings" → "Domains"
2. Click en "Add Domain"
3. Ingresa tu dominio: `transportepro.com`
4. Configura DNS:
   ```
   Type: CNAME
   Name: @
   Value: tu-proyecto.railway.app
   ```

## 🔄 Actualizaciones

### Deploy Automático
Railway hace deploy automático cuando haces push a tu rama principal ✅

### Deploy Manual
```bash
railway up
```

### Rollback
```bash
# Ver deployments
railway status

# Hacer rollback
railway rollback [deployment-id]
```

## 📞 Soporte

- **Documentación Railway:** https://docs.railway.app
- **Discord Railway:** https://discord.gg/railway
- **Status:** https://status.railway.app

## ✅ Checklist Final

- [ ] Código subido a Git
- [ ] Proyecto creado en Railway
- [ ] MySQL agregado y configurado
- [ ] Variables de entorno configuradas
- [ ] Base de datos importada
- [ ] Aplicación funcionando en URL de Railway
- [ ] Login funciona correctamente
- [ ] Subida de archivos funciona
- [ ] Modo oscuro funciona
- [ ] Responsive en móvil funciona
- [ ] Dominio personalizado configurado (opcional)

## 🎉 ¡Listo!

Tu aplicación TransportePro ahora está en producción en Railway.

**URL de tu app:** `https://tu-proyecto.railway.app`

---

**Nota:** Guarda las credenciales de tu base de datos en un lugar seguro.
