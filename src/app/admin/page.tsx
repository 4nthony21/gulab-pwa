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
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [dniBloqueado, setDniBloqueado] = useState(true);
  const [cargando, setCargando] = useState(true);
  
  useEffect(() => {
    // Creamos una variable de control para evitar actualizaciones en componentes desmontados
    let montado = true;

    const cargarDatos = async () => {
      try {
        console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        const { data, error } = await supabase
          .from('paciente')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Solo actualizamos el estado si el componente sigue "vivo" en pantalla
        if (montado && data) {
          setPacientes(data);
        }
      } catch (err) {
        console.error("Error cargando pacientes:", err);
      } finally {
        if (montado) setCargando(false);
      }
    };

    cargarDatos();

    // Función de limpieza
    return () => {
      montado = false;
    };
  }, []); // El array vacío es vital para que solo corra UNA vez al cargar

  // --- FUNCIÓN PARA ACTUALIZAR (USADA POR EL MODAL) ---
const guardarCambios = async () => {
  if (!editando) return;

  try {
    // Verificación de seguridad antes de disparar
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
       throw new Error("La llave API se perdió en el camino");
    }

    const { error } = await supabase
      .from('paciente')
      .update({ 
        de_name: editando.de_name.trim().toUpperCase(), 
        nu_dni: editando.nu_dni.trim()
      })
      .eq('id', editando.id)
      .select(); // IMPORTANTE: El .select() obliga a Supabase a devolver lo que cambió;

    if (error) throw error;

    // Actualización exitosa en interfaz
    setPacientes(pacientes.map(p => p.id === editando.id ? editando : p));
    setEditando(null);
    setDniBloqueado(true);
    
  } catch (err: unknown) {
      // Validamos el error de forma segura para TypeScript
      if (err instanceof Error) {
        alert("Error al actualizar: " + err.message);
      } else {
        alert("Ocurrió un error inesperado al actualizar");
      }
    }
};

  // Filtro de búsqueda por nombre o DNI
  const pacientesFiltrados = pacientes.filter(p => 
    p.de_name.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.nu_dni.includes(busqueda)
  );

return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10 relative font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Panel de Control</h1>
          <div className="relative">
             <input 
              type="text"
              placeholder="Buscar por nombre o DNI..."
              className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-blue-600 text-white text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5 font-semibold">Fecha</th>
                  <th className="px-6 py-5 font-semibold">Paciente</th>
                  <th className="px-6 py-5 font-semibold">DNI</th>
                  <th className="px-6 py-5 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pacientesFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 uppercase">
                      {p.de_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono tracking-tighter">
                      {p.nu_dni}
                    </td>
                    <td className="px-6 py-4 text-center space-x-3">
                      <button 
                        onClick={() => setEditando(p)}
                        className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-amber-200 transition-colors"
                      >
                        EDITAR
                      </button>
                      <a 
                        href={`/resultado/${p.co_qr}`} 
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-200 transition-colors"
                      >
                        VER QR
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

      {/* MODAL DE EDICIÓN */}
      {editando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6 text-gray-800">Editar Datos</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-blue-600 uppercase mb-1 ml-1">Nombre Completo</label>
                <input 
                  type="text"
                  value={editando.de_name}
                  onChange={(e) => setEditando({...editando, de_name: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-blue-600 uppercase mb-1 ml-1 flex justify-between items-center">
                  Número de DNI
                  <button 
                    onClick={() => setDniBloqueado(!dniBloqueado)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${dniBloqueado ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {dniBloqueado ? '🔓 desbloquear' : '🔒 bloquear'}
                  </button>
                </label>
                <input 
                  type="text"
                  disabled={dniBloqueado}
                  value={editando.nu_dni}
                  onChange={(e) => setEditando({...editando, nu_dni: e.target.value.replace(/\D/g, "").slice(0, 8)})}
                  className={`w-full p-4 border rounded-2xl font-mono text-lg ${dniBloqueado ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-900 border-blue-500 ring-4 ring-blue-50'}`}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-10">
              <button 
                onClick={() => {setEditando(null); setDniBloqueado(true);}}
                className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                CANCELAR
              </button>
              <button 
                onClick={guardarCambios}
                className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}