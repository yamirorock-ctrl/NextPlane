import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const PrivacyPolicy = () => (
  <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '800px', margin: 'auto', lineWeight: '1.6' }}>
    <h1 style={{ borderBottom: '2px solid #ddd' }}>Política de Privacidad - Next Plane</h1>
    <p><strong>Actualizado: 18/12/2025</strong></p>
    <p>Esta aplicación ("Next Plane") accede a datos básicos de perfil y gestión de páginas únicamente para habilitar la publicación de contenido. No compartimos tus datos con terceros.</p>
    <h2>Eliminación de datos</h2>
    <p>Puedes eliminar tus datos revocando el acceso en la configuración de Facebook (Integraciones Comerciales).</p>
    <p>Soporte: soporte@nextplane.com</p>
  </div>
);

const isPrivacy = window.location.href.toLowerCase().includes('privacy');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPrivacy ? <PrivacyPolicy /> : <App />}
  </StrictMode>,
)
