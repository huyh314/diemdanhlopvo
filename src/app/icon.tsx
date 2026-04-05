import { ImageResponse } from 'next/og';

// Route segment config
export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 512, height: 512 },
      id: '512',
    },
    {
      contentType: 'image/png',
      size: { width: 192, height: 192 },
      id: '192',
    },
  ];
}

export default function Icon({ id }: { id: string }) {
  const size = id === '192' ? 192 : 512;
  const fontSize = id === '192' ? 96 : 256;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #16171c, #2a2d36)',
          border: '10px solid #caa052',
          borderRadius: '20%',
          color: '#caa052',
          fontSize: fontSize,
          fontWeight: 800,
        }}
      >
        🥋
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
