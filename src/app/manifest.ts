import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Võ Đường Manager',
    short_name: 'Võ Đường',
    description: 'Ứng dụng quản lý điểm danh và phân loại học sinh võ thuật',
    start_url: '/',
    display: 'standalone',
    background_color: '#16171c',
    theme_color: '#caa052',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      }
    ],
  };
}
