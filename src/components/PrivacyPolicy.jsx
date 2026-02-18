import React from 'react';

const PrivacyPolicy = () => (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '800px', margin: 'auto', lineHeight: '1.6', color: '#333', background: '#fff', minHeight: '100vh' }}>
        <h1 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Política de Privacidad de NextPlaneV2</h1>
        <p>Última actualización: 19 de diciembre de 2025</p>
        
        <h2 style={{ marginTop: '30px' }}>1. Información que recopilamos</h2>
        <p>Nuestra aplicación, <strong>NextPlaneV2</strong>, accede a datos públicos de tu perfil de Facebook e Instagram a través de las APIs oficiales de Meta solo cuando tú nos otorgas permiso explícito.</p>

        <h2 style={{ marginTop: '30px' }}>2. Uso de la información</h2>
        <p>Utilizamos estos permisos exclusivamente para permitirte publicar contenido (imágenes y videos) desde nuestra plataforma hacia tus perfiles conectados. No almacenamos tus credenciales de acceso.</p>

        <h2 style={{ marginTop: '30px' }}>3. Eliminación de datos</h2>
        <p>Los usuarios pueden solicitar la eliminación de sus datos o revocar el acceso de la aplicación en cualquier momento a través de la configuración de "Apps y sitios web" en su perfil de Facebook.</p>

        <h2 style={{ marginTop: '30px' }}>4. Terceros</h2>
        <p>No compartimos, vendemos ni distribuimos tu información personal a terceros.</p>
    </div>
);

export default PrivacyPolicy;
