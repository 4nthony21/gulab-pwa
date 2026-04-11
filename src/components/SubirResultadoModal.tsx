import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface UploadModalProps {
  ordenId: string;
  pacienteDni: string;
  onClose: () => void;
}

export default function SubirResultadoModal({ ordenId, pacienteDni, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [nombrePrueba, setNombrePrueba] = useState('Hemograma Completo')
  const supabase = createClient()

  const handleUpload = async () => {
  if (!file) return alert('Selecciona un archivo PDF');
  
  // VALIDACIÓN CRÍTICA: Si el DNI llega vacío, el RLS o la DB fallarán
  if (!pacienteDni) {
    console.error("Error: El DNI del paciente llegó vacío al modal.");
    return alert("Error: No se pudo identificar el DNI del paciente.");
  }

  setLoading(true);

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${ordenId}.${fileExt}`;
    const filePath = `dni_${pacienteDni}/${fileName}`;
    const { data: { user } } = await supabase.auth.getUser();

    console.log("Intentando subir con:", { ordenId, pacienteDni, filePath });

    // 1. Subida al Storage
    const { error: storageError } = await supabase.storage
      .from('archive_results')
      .upload(filePath, file,{
    contentType: 'application/pdf', // <--- ESTO ES VITAL
    upsert: true
    });

    if (storageError) throw storageError;

    // 2. Registro en la DB
    const { error: dbError } = await supabase
      .from('results')
      .insert({
        order_id: ordenId,
        customer_dni: String(pacienteDni), // Forzamos que sea string
        nombre_prueba: nombrePrueba,
        file_path: filePath,
        status: 'listo',
        created_by: user?.id,
      });

    if (dbError) throw dbError;
    setFile(null); // Limpia el archivo seleccionado
    onClose();    // Cierra el modal automáticamente
  } catch (error: unknown) {
    console.error("Detalle técnico del error:", error);
    alert(`Error: ${ (error as Error).message || 'Error desconocido' }`);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Encabezado con tu azul corporativo */}
        <div className="bg-[#0055ff] p-4 text-white font-bold flex justify-between items-center">
          <span>SUBIR RESULTADO PDF</span>
          <button onClick={onClose} className="hover:opacity-70 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nombre del Análisis</label>
            <input 
              type="text" 
              value={nombrePrueba}
              onChange={(e) => setNombrePrueba(e.target.value)}
              className="w-full border-2 border-slate-100 rounded-lg p-2 focus:border-[#0055ff] outline-none"
            />
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#0055ff] transition-colors">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden" 
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer group">
              <p className="text-slate-400 group-hover:text-[#0055ff]">
                {file ? `✅ ${file.name}` : "Click para seleccionar PDF"}
              </p>
            </label>
          </div>

          <button 
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-[#0055ff] text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg"
          >
            {loading ? 'Subiendo...' : 'CONFIRMAR Y GUARDAR'}
          </button>
        </div>
      </div>
    </div>
  )
}