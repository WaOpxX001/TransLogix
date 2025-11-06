# 🚚 TransportePro

Sistema de gestión de transporte con control de viajes, gastos y reportes.

## 🚀 Deploy en Railway

Este proyecto está listo para desplegarse en Railway.

### Pasos Rápidos:

1. **Sube el código a Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin [tu-repositorio]
   git push -u origin main
   ```

2. **Crea proyecto en Railway:**
   - Ve a [railway.app](https://railway.app)
   - Click en "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio

3. **Vincula tu base de datos MySQL:**
   - En Railway, ve a tu proyecto
   - Click en tu servicio web
   - Ve a "Variables" y verifica que estén las variables de MySQL

4. **¡Listo!** Railway desplegará automáticamente tu aplicación.

## 📋 Variables de Entorno Requeridas

Railway detecta automáticamente estas variables de tu base de datos MySQL:
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`

## 🔧 Tecnologías

- PHP 8.2
- MySQL
- JavaScript (Vanilla)
- HTML5 / CSS3

## 📖 Documentación Completa

Ver [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md) para guía detallada de despliegue.

## 🔐 Seguridad

- Autenticación con sesiones PHP
- Protección CSRF
- Validación de archivos subidos
- Headers de seguridad configurados

## 📱 Características

- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión de viajes y transportistas
- ✅ Control de gastos con recibos
- ✅ Reportes y estadísticas
- ✅ Modo oscuro
- ✅ Diseño responsive

---

Desarrollado para gestión eficiente de transporte 🚛
