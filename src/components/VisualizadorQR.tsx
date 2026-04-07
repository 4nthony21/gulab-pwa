'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function VisualizadorQR({ codigo }: { codigo: string }) {
  const [fullUrl, setFullUrl] = useState("");

  useEffect(() => {
    // Aquí sí podemos usar window porque estamos en el cliente
    setFullUrl(`${window.location.origin}/resultado/${codigo}`);
  }, [codigo]);

  return (
    <div className="bg-white p-4 border rounded-xl inline-block shadow-sm">
      <QRCodeSVG value={fullUrl || codigo} size={200} />
    </div>
  );
}