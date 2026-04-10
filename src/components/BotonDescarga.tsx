'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function BotonDescarga({ filePath }: { filePath: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Generamos la URL firmada porque el bucket es privado
      const { data, error } = await supabase.storage
        .from('archive_results')
        .createSignedUrl(filePath, 60) // Expira en 60 segundos

      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      alert("No se pudo abrir el archivo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      className="bg-[#0055ff] text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-[0_4px_14px_0_rgba(0,85,255,0.3)] hover:scale-105 transition-transform disabled:bg-slate-300"
    >
      {loading ? '...' : 'VER PDF'}
    </button>
  )
}