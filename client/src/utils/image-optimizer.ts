/**
 * Utilitário para otimização de imagens responsivas
 */

interface ImageSource {
  srcSet: string;
  media?: string;
  type?: string;
}

export const generateSrcSet = (baseUrl: string, sizes: number[]): string => {
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
};

export const getOptimizedImageProps = (imageName: string) => {
  const baseUrl = `/assets/${imageName}`;
  
  // Configurações específicas para cada imagem
  const imageConfigs: Record<string, { sizes: number[]; defaultSize: number }> = {
    'cnvidas-logo-transparent.png': {
      sizes: [100, 150, 200, 300, 400],
      defaultSize: 200
    }
  };
  
  const config = imageConfigs[imageName] || { sizes: [200, 400, 800], defaultSize: 400 };
  
  return {
    srcSet: generateSrcSet(baseUrl, config.sizes),
    sizes: '(max-width: 640px) 100px, (max-width: 1024px) 150px, 200px',
    src: `${baseUrl}?w=${config.defaultSize}`
  };
};

// Helper para criar um picture element responsivo
export const ResponsiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
}> = ({ src, alt, className, loading = 'lazy', fetchpriority, width, height }) => {
  const imageName = src.split('/').pop() || '';
  const { srcSet, sizes, src: optimizedSrc } = getOptimizedImageProps(imageName);
  
  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchpriority}
      width={width}
      height={height}
    />
  );
};