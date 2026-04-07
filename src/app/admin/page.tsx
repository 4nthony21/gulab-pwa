'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CustomerOrder {
  id: string;
  status: string;
  analysis: string;
  cod_qr: string;
  created_at: string;
  updated_at: string;
  customers:
    | {
        first_name: string;
        last_name: string;
        dni: string;
        id: string
      }[]
    | {
        first_name: string;
        last_name: string;
        dni: string;
        id: string
      }
    | null;
}

export default function AdminPage() {
  const [ordenes, setOrdenes] = useState<CustomerOrder[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<CustomerOrder | null>(null);
  const [dniBloqueado, setDniBloqueado] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [nombreTemp, setNombreTemp] = useState('');
  const [apellidoTemp, setApellidoTemp] = useState('');
  const [dniTemp, setDniTemp] = useState('');

  // Función para abrir el modal cargando los datos actuales
  const abrirModal = (orden: CustomerOrder) => {
    setEditando(orden);
    // Extraemos datos del array customers[0]
    const cliente = Array.isArray(orden.customers) ? orden.customers[0] : orden.customers;
    setNombreTemp(cliente?.first_name || '');
    setApellidoTemp(cliente?.last_name || '');
    setDniTemp(cliente?.dni || '');
    setDniBloqueado(true); // Siempre abrir con el DNI bloqueado por seguridad
  };
  
  useEffect(() => {
    // Creamos una variable de control para evitar actualizaciones en componentes desmontados
    let montado = true;

    const cargarDatos = async () => {
      try {
        console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            analysis,
            cod_qr,
            created_at,
            updated_at,
            customers (
              first_name,
              last_name,
              dni,
              id
            )
          `)
          .order('created_at', { ascending: false }); // Las más recientes arriba

        if (error) throw error;

        // Solo actualizamos el estado si el componente sigue "vivo" en pantalla
        if (montado && data) {
          setOrdenes(data);
        }
      } catch (err) {
        console.error("Error cargando ordenes:", err);
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
const guardarCambiosCliente = async () => {
  if (!editando || !editando.customers) return;

  // Extraemos el ID del cliente desde la relación anidada
  const clienteId = Array.isArray(editando.customers) 
    ? editando.customers[0]?.id
    : editando.customers?.id;

  const { data, error } = await supabase
    .from('customers') // <-- Solo afectamos la tabla de identidad
    .update({ 
      first_name: nombreTemp.trim().toUpperCase(),
      last_name: apellidoTemp.trim().toUpperCase(),
      dni: dniTemp.trim()
    })
    .eq('id', clienteId)
    .select();

  if (error) {
    alert("Error al actualizar cliente: " + error.message);
  } else {
    // Actualizamos el estado local para que la tabla se refresque sin recargar
    setOrdenes(ordenes.map(o => {
      const oId = Array.isArray(o.customers) ? o.customers[0]?.id : o.customers?.id;
      if (oId === clienteId) {
        return { 
          ...o, 
          customers: Array.isArray(o.customers) ? [data[0]] : data[0] 
        };
      }
      return o;
    }));
    setEditando(null);
    alert("Datos del paciente actualizados con éxito");
  }
};

  // Filtro de búsqueda por nombre o DNI
  const ordenesFiltrados = ordenes.filter(p => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;

  // Si no hay cliente o la búsqueda está vacía, mostramos todo
    if (!customer || !busqueda) return true;

    const termino = busqueda.toLowerCase();
    const nombreCompleto = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    const dni = customer.dni.toLowerCase();

    // El filtro coincide si el término está en el nombre O en el DNI
    return nombreCompleto.includes(termino) || dni.includes(termino);
});
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
            {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="text-sm text-gray-500 hover:text-blue-600 font-medium"
            >
              Limpiar filtro
            </button>
          )} 
          <div className="text-sm text-gray-400">
            Encontrados: {ordenesFiltrados.length}
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
                {ordenesFiltrados.map((orden) => {
                  const customer = Array.isArray(orden.customers)
                    ? orden.customers[0]
                    : orden.customers;

                  return (
                    <tr key={orden.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(orden.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800 uppercase">
                        {customer?.first_name || ''} {customer?.last_name || ''}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono tracking-tighter">
                        {customer?.dni || ''}
                      </td>
                      <td className="px-6 py-4 text-center space-x-3">
                        <button 
                          onClick={() => abrirModal(orden)}
                          className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-amber-200 transition-colors"
                        >
                          EDITAR
                        </button>
                        <a 
                          href={`/resultado/${orden.cod_qr}`} 
                          className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-200 transition-colors"
                        >
                          VER QR
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ordenesFiltrados.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No se encontraron registros.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
{editando && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
      {/* Encabezado con degradado para diferenciarlo del registro */}
      <div className="bg-slate-800 p-4 text-white rounded-t-lg flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">Ficha del Paciente</h2>
          <p className="text-xs text-slate-400 font-mono">Orden: {editando.id.slice(0,8)}...</p>
        </div>
        <button onClick={() => setEditando(null)} className="text-slate-400 hover:text-white">✕</button>
      </div>

      <div className="p-6 space-y-5">
        {/* CAMPO DNI CON LOCK/UNLOCK */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">DNI (Identificador Único)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              disabled={dniBloqueado}
              value={dniTemp}
              onChange={(e) => setDniTemp(e.target.value)}
              className={`flex-1 border rounded p-2 text-sm font-bold ${dniBloqueado ? 'bg-gray-100 text-gray-500' : 'bg-white border-blue-500'}`}
            />
            <button 
              onClick={() => setDniBloqueado(!dniBloqueado)}
              className={`p-2 rounded border ${dniBloqueado ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-500 border-red-200'}`}
              title={dniBloqueado ? "Desbloquear para editar" : "Bloquear campo"}
            >
              {dniBloqueado ? '🔒' : '🔓'}
            </button>
          </div>
        </div>

        {/* NOMBRES Y APELLIDOS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombres</label>
            <input 
              type="text" 
              value={nombreTemp}
              onChange={(e) => setNombreTemp(e.target.value)}
              className="w-full border rounded p-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Apellidos</label>
            <input 
              type="text" 
              value={apellidoTemp}
              onChange={(e) => setApellidoTemp(e.target.value)}
              className="w-full border rounded p-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* DATOS DE LA ORDEN (Informativos / No editables aquí) */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">Información del Examen</p>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">{editando.analysis}</span>
            <span className="text-xs bg-white px-2 py-1 rounded shadow-sm text-blue-600 font-bold">
              {editando.status}
            </span>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
        <button 
          onClick={() => setEditando(null)}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded"
        >
          Descartar
        </button>
        <button 
          onClick={guardarCambiosCliente}
          className="px-6 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded shadow-md transition-colors"
        >
          Actualizar Paciente
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}