'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function VisualizadorQR({ cod_qr }: { cod_qr: string }) {
  // Calculamos la URL basándonos en tu string cod_qr
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://gulab-pwa.vercel.app'; 

  // OPCIÓN 1: Si tu página de consulta espera el DNI, pero el QR tiene el cod_qr,
  // asegúrate de que el link sea el que el sistema reconoce.
  // Aquí asumo que la ruta final para el paciente es /consulta/[algo]
  const fullUrl = `${origin}/consulta/${cod_qr}`;

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 border-2 border-slate-50 rounded-2xl shadow-sm">
      <div className="p-2 border-4 border-blue-50 rounded-lg bg-white">
        {cod_qr ? (
          <QRCodeSVG 
            value={fullUrl} 
            size={200}
            level="H"
            includeMargin={true}
          />
        ) : (
          <div className="w-50 h-50 bg-slate-100 flex items-center justify-center rounded animate-pulse">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Generando Código...</p>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código de Seguimiento</p>
        <p className="text-[11px] font-mono font-bold text-blue-600 break-all max-w-45">
          {cod_qr || '--------'}
        </p>
      </div>
    </div>
  );
}