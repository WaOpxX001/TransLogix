# ✅ Checklist Final - Railway Deploy

## 📦 Antes de Subir a Git

- [x] Base de datos MySQL creada en Railway
- [x] Variables de entorno configuradas en Railway
- [x] Archivos de configuración listos (railway.json, nixpacks.toml, Procfile)
- [x] .gitignore creado
- [x] .htaccess configurado
- [x] php.ini configurado
- [ ] **TÚ HACES:** Subir código a Git

## 🚀 Pasos para Vincular con Railway

### 1. Inicializar Git (si no lo has hecho)
```bash
git init
git add .
git commit -m "Preparado para Railway"
```

### 2. Subir a GitHub/GitLab/Bitbucket
```bash
# Opción A: GitHub
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main

# Opción B: GitLab
git remote add origin https://gitlab.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

### 3. Vincular en Railway

1. Ve a tu proyecto en Railway: https://railway.app
2. Click en tu servicio web (el que tiene el ícono de código)
3. Ve a "Settings" → "Service"
4. En "Source" click en "Connect Repo"
5. Autoriza Railway a acceder a tu repositorio
6. Selecciona el repositorio que acabas de subir
7. Railway detectará automáticamente la configuración

### 4. Verificar Variables de Entorno

En Railway, ve a "Variables" y verifica que tengas:

**Variables de MySQL (automáticas):**
- ✅ MYSQLHOST
- ✅ MYSQLPORT  
- ✅ MYSQLDATABASE
- ✅ MYSQLUSER
- ✅ MYSQLPASSWORD

**Variables adicionales (Railway las detecta del php.ini):**
- ✅ PHP_VERSION=8.2 (detectado por nixpacks.toml)

### 5. Esperar el Deploy

Railway automáticamente:
1. Detectará que es un proyecto PHP
2. Instalará PHP 8.2 y extensiones
3. Ejecutará el comando del Procfile
4. Generará una URL pública

⏱️ Esto toma aproximadamente 2-3 minutos.

### 6. Verificar que Funciona

1. Click en el botón "View Logs" para ver el progreso
2. Cuando veas "✅ Build successful", click en la URL generada
3. Deberías ver tu aplicación funcionando

### 7. Importar Base de Datos (si no lo has hecho)

**Opción A: Desde Railway CLI**
```bash
npm install -g @railway/cli
railway login
railway link
railway run php init-railway-db.php
```

**Opción B: Desde MySQL Workbench**
1. En Railway, ve a tu servicio MySQL
2. Click en "Connect" → "MySQL Workbench"
3. Copia las credenciales
4. Importa tu archivo SQL

**Opción C: Desde phpMyAdmin**
1. Usa las credenciales de Railway
2. Importa tu archivo SQL

## 🎯 Resultado Final

Después de completar estos pasos tendrás:

✅ Código en Git (GitHub/GitLab/Bitbucket)
✅ Aplicación desplegada en Railway
✅ Base de datos MySQL conectada
✅ URL pública funcionando
✅ Deploy automático en cada push

## 🔗 URLs Importantes

- **Railway Dashboard:** https://railway.app/dashboard
- **Tu Proyecto:** https://railway.app/project/[tu-proyecto-id]
- **Tu App:** https://[tu-app].railway.app (se genera automáticamente)

## 🆘 Si Algo Sale Mal

### Error: "Build failed"
```bash
# Ver logs en Railway
railway logs

# O en la web: Click en "View Logs"
```

### Error: "Database connection failed"
1. Verifica que las variables de entorno estén correctas
2. Ve a "Variables" en Railway
3. Asegúrate que MYSQLHOST, MYSQLUSER, etc. existan

### Error: "502 Bad Gateway"
1. Verifica que el Procfile esté correcto
2. Verifica que nixpacks.toml tenga PHP 8.2
3. Revisa los logs: `railway logs`

## 📞 Soporte

- **Documentación Railway:** https://docs.railway.app
- **Discord Railway:** https://discord.gg/railway
- **Guía Completa:** Ver RAILWAY_DEPLOY.md

---

## 🎉 ¡Siguiente Paso!

**Ahora solo tienes que:**
1. Subir tu código a Git
2. Vincular el repositorio en Railway
3. ¡Esperar 2-3 minutos y listo!

Railway hará todo el resto automáticamente. 🚂✨
