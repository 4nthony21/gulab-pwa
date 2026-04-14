'use client';

import dynamic from 'next/dynamic';

// Aquí sí está permitido el ssr: false porque este archivo es 'use client'
const VisualizadorQR = dynamic(() => import('./VisualizadorQR'), { 
  ssr: false,
  loading: () => <div className="w-50 h-50 bg-slate-100 animate-pulse rounded-xl" />
});

export default function QRWrapper({ cod_qr }: { cod_qr: string }) {
  return <VisualizadorQR cod_qr={cod_qr} />;
}