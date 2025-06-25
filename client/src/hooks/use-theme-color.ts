import { useEffect } from 'react';
import { useLocation } from 'wouter';

export const useThemeColor = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Função para atualizar a cor do tema
    const updateThemeColor = (color: string) => {
      // Atualizar meta tag theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', color);
      }

      // Atualizar meta tag msapplication-TileColor
      const metaTileColor = document.querySelector('meta[name="msapplication-TileColor"]');
      if (metaTileColor) {
        metaTileColor.setAttribute('content', color);
      }
    };

    // Definir cor baseada na rota
    if (location === '/auth' || location === '/login' || location === '/register') {
      // Páginas de autenticação - azul claro
      updateThemeColor('#eff6ff');
    } else if (location.startsWith('/dashboard') || location.startsWith('/telemedicine') || 
               location.startsWith('/services') || location.startsWith('/profile')) {
      // Páginas internas - branco para combinar com a glass-nav
      updateThemeColor('#ffffff');
    } else {
      // Outras páginas - branco padrão
      updateThemeColor('#ffffff');
    }
  }, [location]);
};