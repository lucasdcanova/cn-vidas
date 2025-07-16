import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, initPWAInstall } from "./pwa";
import { debugStartup } from "./debug-startup";
import { remoteLogger } from "./utils/remote-logger";

// Debug para iOS
const debugDiv = debugStartup();

// Inicializar PWA
registerServiceWorker();
initPWAInstall();

// Set up meta tags for SEO
document.title = "CN Vidas - Plataforma de Saúde Digital";

// Create meta description
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "CN Vidas: plataforma de saúde digital com telemedicina, gestão de sinistros e rede de parceiros. Cuide da sua saúde de forma prática e segura.";
document.head.appendChild(metaDescription);

// Add Open Graph tags
const ogTitle = document.createElement("meta");
ogTitle.setAttribute('property', 'og:title');
ogTitle.content = "CN Vidas - Plataforma de Saúde Digital";
document.head.appendChild(ogTitle);

const ogDescription = document.createElement("meta");
ogDescription.setAttribute('property', 'og:description');
ogDescription.content = "Acesse consultas por telemedicina, solicite sinistros e gerencie seus benefícios de saúde em uma única plataforma.";
document.head.appendChild(ogDescription);

const ogType = document.createElement("meta");
ogType.setAttribute('property', 'og:type');
ogType.content = "website";
document.head.appendChild(ogType);

// Render the app
try {
  const root = document.getElementById("root");
  if (!root) {
    console.error('❌ Elemento root não encontrado!');
    document.body.innerHTML = '<h1>Erro: Elemento root não encontrado</h1>';
  } else {
    console.log('✅ Elemento root encontrado, renderizando app...');
    createRoot(root).render(<App />);
    
    // Remover debug div quando app carregar
    setTimeout(() => {
      if (debugDiv?.parentNode) {
        debugDiv.remove();
      }
    }, 1000);
  }
} catch (error) {
  console.error('❌ Erro ao renderizar app:', error);
  document.body.innerHTML = `<h1>Erro ao carregar aplicação</h1><pre>${error}</pre>`;
}
