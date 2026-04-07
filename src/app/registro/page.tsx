'use client';

import { useState,useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Importamos la conexión
import { QRCodeSVG } from 'qrcode.react'; // Librería para el QR
import { useRouter } from 'next/dist/client/components/navigation';

export default function RegistroPage() {
  const [dni, setDni] = useState('');
  const [first_name, setNombre] = useState('');
  const [last_name, setApellido] = useState('');
  const [qrValue, setQrValue] = useState(''); // Aquí guardaremos el ID para el QR
  const [cargando, setCargando] = useState(false);
  const [errorDni, setErrorDni] = useState('');
  const router = useRouter();

  // --- PRIMER EFFECT: Seguridad (Solo personal autorizado) ---
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Si no hay sesión iniciada, redirigimos al login de inmediato
        router.push('/login'); 
      }
    };
    verificarSesion();
  }, []); // [] significa: "Ejecuta esto solo UNA VEZ al cargar la página"

  // 2. SECCIÓN DE AUTOCOMPLETADO
  // Este "efecto" se dispara cada vez que el valor de 'dni' cambia
  useEffect(() => {
    const buscarClienteExistente = async () => {
      // Solo buscamos cuando el DNI está completo (8 dígitos)
      if (dni.length === 8) {
        const { data, error } = await supabase
          .from('customers') // Buscamos en la tabla de identidad
          .select('first_name, last_name') // Solo necesitamos el nombre y apellido
          .eq('dni', dni)
          .single(); // Traemos solo un resultado

        if (data && !error) {
          // Si lo encuentra, llenamos el campo nombre automáticamente
          setNombre(data.first_name);
          setApellido(data.last_name);
          setErrorDni(''); // Limpiamos errores si los hubiera
        }
      }
    };

    buscarClienteExistente();
  }, [dni]); // [dni] es la dependencia: "vigila este valor"

    // Validación básica del DNI (puedes mejorar esto según tus necesidades)
  const manejarCambioDni = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, ""); // Elimina cualquier cosa que no sea número
    
    if (valor.length <= 8) {
        setDni(valor);
        // Validación en tiempo real
        if (valor.length > 0 && valor.length < 8) {
        setErrorDni('El DNI debe tener 8 dígitos');
        } else {
        setErrorDni('');
        }
    }
    };

  const manejarRegistro = async () => {
    if (dni.length !== 8 || !first_name || !last_name) return;
        setCargando(true);
    
    try {
    // 1. Asegurar que el Cliente existe (Tabla 'customers')
    // Usamos 'upsert' para que si el DNI ya existe, solo devuelva el ID
    const { data: cliente, error: errorCliente } = await supabase
      .from('customers')
      .upsert({ dni, first_name: first_name.trim().toUpperCase(), last_name: last_name.trim().toUpperCase() }, { onConflict: 'dni' })
      .select()
      .single();

    if (errorCliente) throw errorCliente;
    // 2. Generar código QR único para ESTA visita
    const codigoUnico = `${dni}-${Date.now()}`;

    // 3. PASO TRES: Crear la Orden de Atención (Tabla 'orders')
    const { error: errorOrden } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: cliente.id,
          cod_qr: codigoUnico,
          analysis: 'Pendiente de definir', // Aquí podrías añadir un input de texto luego
          status: 'Pendiente'
        }
      ]);

    if (errorOrden) throw errorOrden;

    // 4. PASO CUATRO: Mostrar el QR generado
    setQrValue(`${window.location.origin}/resultado/${codigoUnico}`);
    
    } catch (err: unknown) {
        console.error("Error en el flujo de registro:", err);
        alert("Error al registrar: " + (err as Error).message);
    } finally {
        setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 mt-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Laboratorio</h1>
        
        {!qrValue ? (
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">DNI</label>
              <input 
                type="text"
                inputMode="numeric" // Optimiza el teclado en celulares
                value={dni}
                onChange={manejarCambioDni}
                className={`mt-1 block w-full px-4 py-3 border rounded-lg outline-none transition-all ${
                    dni.length === 8 
                    ? 'border-green-500 ring-2 ring-green-100' 
                    : errorDni ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 45678901"
              />
              {errorDni && <p className="text-red-500 text-sm">{errorDni}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input 
                type="text" 
                value={first_name}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                placeholder="Nombre del paciente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido</label>
              <input 
                type="text" 
                value={last_name}
                onChange={(e) => setApellido(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                placeholder="Apellido del paciente"
              />
            </div>
            <button 
              type="button"
              onClick={manejarRegistro}
              disabled={!dni || !first_name || !last_name || cargando || dni.length !== 8}
              className={`w-full font-bold py-3 px-4 rounded-xl mt-4 ${
                (dni.length !== 8 || !first_name || cargando || !last_name)
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
             }`}
            >
              {cargando ? 'Guardando...' : 'Generar QR'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="p-4 bg-white border-4 border-blue-600 rounded-xl">
              <QRCodeSVG value={qrValue} size={200} />
            </div>
            <p className="text-center text-gray-600 font-medium">
              ¡Registro Exitoso!<br/>
              <span className="text-sm font-normal text-gray-400">Escanea este código para ver los resultados.</span>
            </p>
            <button 
              onClick={() => {setQrValue(''); setDni(''); setNombre(''); setApellido('');}}
              className="text-blue-600 font-semibold underline"
            >
              Registrar otro paciente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}