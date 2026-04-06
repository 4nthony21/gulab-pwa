'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Paciente {
  id: string;
  de_name: string;
  nu_dni: string;
  created_at: string;
  co_qr: string;
}

export default function AdminPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from('paciente')
      .select('*')
      .order('created_at', { ascending: false }); // Los más recientes primero

    if (!error && data) setPacientes(data);
  };

  // Filtro de búsqueda por nombre o DNI
  const pacientesFiltrados = pacientes.filter(p => 
    p.de_name.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.nu_dni.includes(busqueda)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
          <input 
            type="text"
            placeholder="Buscar por nombre o DNI..."
            className="px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-blue-600 text-white text-sm uppercase">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">DNI</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pacientesFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(p.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 uppercase">
                      {p.de_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono">
                      {p.nu_dni}
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`/resultado/${p.co_qr}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline"
                      >
                        Ver Resultado
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pacientesFiltrados.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No se encontraron registros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}