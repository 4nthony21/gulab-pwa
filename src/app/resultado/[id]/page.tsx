'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Definimos qué datos esperamos del paciente
interface Paciente {
  de_name: string;
  nu_dni: string;
  created_at: string;
}

export default function ResultadoPage() {
  const { id } = useParams(); // Captura el ID de la URL (ej: 456789-12345)
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data, error } = await supabase
        .from('paciente')
        .select('de_name, nu_dni, created_at')
        .eq('co_qr', id) // Buscamos el registro que coincida con el QR
        .single();

      if (!error && data) {
        setPaciente(data);
      }
      setCargando(false);
    };

    if (id) obtenerDatos();
  }, [id]);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!paciente) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h1 className="text-xl font-bold text-red-600">Código no válido</h1>
      <p className="text-gray-500 text-center">No encontramos registros asociados a este código QR.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden mt-10">
        {/* Encabezado Estilo Laboratorio */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-xl font-bold uppercase tracking-wider">Resultado de Laboratorio</h1>
        </div>

        <div className="p-8 space-y-6">
          <div className="border-b pb-4">
            <p className="text-xs text-gray-400 uppercase font-bold">Paciente</p>
            <p className="text-lg text-gray-900 font-medium uppercase">{paciente.de_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">DNI</p>
              <p className="text-gray-900">{paciente.nu_dni}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Fecha</p>
              <p className="text-gray-900">{new Date(paciente.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Estado del Examen (Simulado por ahora) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
            <div className="h-3 w-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-yellow-700 font-medium">Muestra en proceso de análisis</p>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-[10px] text-center uppercase tracking-widest">
        Este documento es una visualización digital de resultados.
      </p>
    </div>
  );
}