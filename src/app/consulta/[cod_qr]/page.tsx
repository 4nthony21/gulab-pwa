import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import BotonDescarga from '@/components/BotonDescarga'

interface Resultado {
  id: string;
  nombre_prueba: string;
  created_at: string;
  file_path: string;
}

export default async function ConsultaPaciente({ params }: { params: Promise<{ cod_qr: string }> }) {
  // 1. Next.js 15 requiere await para los params y cookies
  const { cod_qr } = await params
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // 2. Consulta a la DB. 
  // OJO: Si tu tabla se llama 'resultados', el select debe ser results(*) o resultados(*)
  const { data: paciente, error } = await supabase
    .from('orders')
    .select('*, results(*)') 
    .eq('cod_qr', cod_qr)
    .single()

  if (error || !paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-600 font-medium">DNI no encontrado o sin resultados pendientes.</p>
          <p className="text-xs text-slate-400 mt-2">Por favor, verifique el número e intente de nuevo.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto">
        {/* Cabecera con Branding */}
        <header className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-center border-b-4 border-[#0055ff]">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">LABORATORIO CENTRAL</h1>
          <p className="text-xs font-bold text-[#0055ff] uppercase tracking-widest mt-1">Portal de Pacientes</p>
        </header>

        {/* Info del Paciente */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Identidad del Paciente</h2>
          <p className="text-xl font-bold text-slate-800 uppercase leading-tight">
            {paciente.first_name} <br/> {paciente.last_name}
          </p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
             <div>
               <p className="text-[10px] text-slate-400 uppercase font-bold">Documento</p>
               <p className="text-sm font-mono font-bold text-slate-700">{paciente.dni}</p>
             </div>
             <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold">ACTIVO</span>
          </div>
        </section>

        {/* Lista de Resultados */}
        <section className="bg-white rounded-2xl p-6 shadow-sm min-h-75">
          <h2 className="text-[10px] font-black text-[#0055ff] uppercase tracking-[0.2em] mb-6">Mis Resultados Disponibles</h2>
          
          {paciente.results && paciente.results.length > 0 ? (
            <div className="space-y-4">
              {paciente.results.map((res: Resultado) => (
                <div key={res.id} className="group p-4 bg-white border-2 border-slate-50 rounded-2xl hover:border-[#0055ff20] hover:bg-blue-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{res.nombre_prueba || 'Análisis Clínico'}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">
                        Fecha: {new Date(res.created_at).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                    {/* Componente Cliente para manejar el Signed URL */}
                    <BotonDescarga filePath={res.file_path} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <p className="text-slate-400 text-xs italic px-6">
                No hay resultados listos. Si se realizó la prueba hace menos de 24h, aún está en proceso.
              </p>
            </div>
          )}
        </section>

        <footer className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Laboratorio Central
          </p>
          <div className="h-1 w-8 bg-slate-200 mx-auto mt-2 rounded-full"></div>
        </footer>
      </div>
    </main>
  )
}