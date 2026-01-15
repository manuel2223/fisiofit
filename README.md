# 🏥 FisioFit: Plataforma de Telerehabilitación con IA

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)

</div>

<br />

**FisioFit** es una aplicación web integral diseñada para modernizar la fisioterapia clínica. La plataforma conecta a fisioterapeutas con pacientes y ofrece un revolucionario sistema de **rehabilitación guiada por Inteligencia Artificial** en tiempo real mediante visión por computador (*Computer Vision*).

Este proyecto ha sido desarrollado como **Trabajo de Fin de Grado (TFG)**.

---

## 🚀 Funcionalidades Principales

### 🧠 Para el Paciente (Cliente Web con IA)
* **Corrección Postural en Tiempo Real:** Integración de **TensorFlow.js (BlazePose)** para detectar 33 puntos clave del cuerpo humano a través de la webcam.
* **Feedback Visual Aumentado:** El sistema calcula ángulos geométricos en vivo y dibuja guías visuales (semáforo de colores) sobre el vídeo para indicar si el ejercicio se realiza correctamente.
* **Gestión de Citas:** Reserva de sesiones presenciales con comprobación de disponibilidad.
* **Historial y Progreso:** Acceso a rutinas personalizadas y seguimiento de la evolución.

### 👨‍⚕️ Para el Fisioterapeuta (Panel de Gestión)
* **Dashboard Interactivo:** Visualización de estadísticas clave y pacientes activos.
* **Gestión de Agenda:** Calendario dinámico para configurar horarios y ver citas.
* **Constructor de Rutinas:** Asignación de ejercicios desde una biblioteca multimedia.
* **Configuración No-Code de IA:** El profesional define las reglas biomecánicas (ángulos mínimos/máximos) que la IA debe vigilar, sin necesidad de saber programar.

### ⚙️ Sistema y Seguridad
* **Seguridad:** Autenticación mediante **JWT**, contraseñas hasheadas con **Bcrypt** y protección contra inyección SQL (Sequelize).
* **Notificaciones:** Sistema de emails automáticos para confirmaciones y cancelaciones (Nodemailer).
* **Arquitectura:** Diseño escalable y modular.

---
<!--
## 📸 Capturas de Pantalla

| Panel de Control (Fisio) | Corrección IA (Paciente) |
|:-------------------------:|:-------------------------:|
| ![Dashboard](/screenshots/dashboard.png) | ![IA Detection](/screenshots/ia_demo.png) |
| *Gestión de citas y estadísticas* | *Detección de esqueleto y ángulos* |
-->
---

## 🏗️ Arquitectura del Proyecto

El sistema sigue una **Arquitectura por Capas (Clean Architecture)** en el backend para garantizar la escalabilidad, mantenibilidad y el desacoplamiento de la lógica de negocio.

### Estructura del Backend
El código se organiza siguiendo el flujo de la información:

```bash
servidor/
├── 1_presentation/      # Capa de Entrada
│   ├── routes/          # Endpoints API (REST)
│   └── middleware/      # Auth (JWT) y Validación de Roles
├── 2_application/       # Lógica de Aplicación
│   └── use_cases/       # Casos de uso específicos (ej: AsignarRutina)
├── 3_domain/            # Capa de Dominio (Núcleo)
│   └── models/          # Modelos de Datos (Entidades Sequelize)
└── 4_infrastructure/    # Capa de Infraestructura
    ├── database/        # Conexión y configuración de la BBDD
    └── services/        # Servicios externos (EmailService, etc.)
```

### Stack Tecnológico

**Frontend:**
![React](https://img.shields.io/badge/-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/-React%20Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![React Big Calendar](https://img.shields.io/badge/-React%20Big%20Calendar-0078D4?style=for-the-badge&logo=google-calendar&logoColor=white)
![Axios](https://img.shields.io/badge/-Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/-TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)

**Backend:**
![Node.js](https://img.shields.io/badge/-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

**Base de Datos:**
![MySQL](https://img.shields.io/badge/-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Sequelize](https://img.shields.io/badge/-Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)

**Herramientas:**
![Postman](https://img.shields.io/badge/-Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![Git](https://img.shields.io/badge/-Git-F05032?style=for-the-badge&logo=git&logoColor=white)




### 🛡️ Seguridad
El proyecto implementa medidas de seguridad robustas:

Validación en Capas: Validación en Frontend (UX), Backend (Integridad) y Base de Datos (Constraints).

Protección de Datos: Las contraseñas nunca se almacenan en texto plano.

Variables de Entorno: Credenciales sensibles separadas del código fuente.

### 👤 Autor
Manuel Saucedo González
