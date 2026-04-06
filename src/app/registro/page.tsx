'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Importamos la conexión
import { QRCodeSVG } from 'qrcode.react'; // Librería para el QR

export default function RegistroPage() {
  const [nu_dni, setDni] = useState('');
  const [de_name, setNombre] = useState('');
  const [de_lastname, setApellido] = useState('');
  const [qrValue, setQrValue] = useState(''); // Aquí guardaremos el ID para el QR
  const [cargando, setCargando] = useState(false);

  const manejarRegistro = async () => {
    setCargando(true);
    
    // 1. Generamos un ID único para este registro (puedes usar el DNI + timestamp)
    const idUnico = `${nu_dni}-${Date.now()}`;

    // 2. Guardamos en Supabase
    const { error } = await supabase
      .from('paciente')
      .insert([
        { nu_dni, de_name, de_lastname, co_qr: idUnico }
      ]);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      // 3. Si todo sale bien, mostramos el QR
      setQrValue(`${window.location.origin}/resultado/${idUnico}`);
    }
    setCargando(false);
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
                value={nu_dni}
                onChange={(e) => setDni(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                placeholder="Número de documento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input 
                type="text" 
                value={de_name}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                placeholder="Nombre del paciente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido</label>
              <input 
                type="text" 
                value={de_lastname}
                onChange={(e) => setApellido(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                placeholder="Apellido del paciente"
              />
            </div>
            <button 
              type="button"
              onClick={manejarRegistro}
              disabled={!nu_dni || !de_name || !de_lastname || cargando}
              className={`w-full font-bold py-3 px-4 rounded-xl mt-4 ${
                cargando ? 'bg-gray-400' : 'bg-blue-600 text-white'
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