
//import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import VisualizadorQR from '@/components/VisualizadorQR';


// Definimos qué datos esperamos del paciente
interface DetalleResultado {
  id: string;
  status: string;
  analysis: string;
  cod_qr: string;
  created_at: string;
  customers: {
    first_name: string;
    last_name: string;
    dni: string;
  } | { 
    first_name: string;
    last_name: string;
    dni: string;
  }[] | null;
}

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // <--- Línea vital en versiones nuevas
  const { data: orden, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        first_name,
        last_name,
        dni
      )
    `)
    .eq('cod_qr', id) // Buscamos por el código que viene en la URL
    .maybeSingle();

  // 2. Si hay error o no existe, mostramos 404
    if (error || !orden) {
      console.error("Error al buscar orden:", error);
      return notFound();
    }

    // 3. Normalizamos los datos del cliente (manejamos si viene como array u objeto)
    const cliente = Array.isArray(orden.customers) ? orden.customers[0] : orden.customers;

    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

          {/* Cabecera del Laboratorio */}
          <div className="bg-blue-600 p-6 text-center text-white">
            <h1 className="text-xl font-bold uppercase tracking-wider">Laboratorio Clínico</h1>
            <p className="text-sm opacity-80">Resultados en Línea</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Datos del Paciente */}
            <div className="border-b pb-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Paciente</p>
              <h2 className="text-lg font-bold text-gray-800">
                {cliente?.first_name} {cliente?.last_name}
              </h2>
              <p className="text-sm text-gray-500 font-mono">DNI: {cliente?.dni}</p>
            </div>

            {/* 🚀 Pasamos el código al componente hijo */}
            <div className="p-8 text-center my-6 border-b pb-4">
              <VisualizadorQR codigo={orden.cod_qr} />
            </div>

            {/* Detalles del Análisis */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Examen Realizado</p>
                <p className="text-md font-semibold text-gray-700">{orden.analysis}</p>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Fecha de Toma</p>
                  <p className="text-sm text-gray-600">
                    {new Date(orden.created_at).toLocaleDateString('es-PE')}
                  </p>
                </div>
                
                {/* Badge de Estado */}
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  orden.status === 'Listo' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {orden.status}
                </div>
              </div>
            </div>

            {/* Mensaje Informativo */}
            <div className="bg-blue-50 p-4 rounded-lg">
              {orden.status === 'Listo' ? (
                <p className="text-sm text-blue-800 text-center">
                  ✅ Sus resultados están listos. Por favor, acérquese a recepción con su DNI para recoger el informe físico o descárguelo aquí.
                </p>
              ) : (
                <p className="text-sm text-yellow-800 text-center">
                  ⏳ Su muestra está en proceso. El tiempo estimado de entrega es de 24 a 48 horas.
                </p>
              )}
            </div>
          </div>

          {/* Footer con ID único */}
          <div className="bg-gray-100 p-4 text-center">
            <p className="text-[9px] text-gray-400 font-mono uppercase">
              Autenticidad verificada · ID: {orden.cod_qr}
            </p>
          </div>
        </div>
      </main>
    );
  }