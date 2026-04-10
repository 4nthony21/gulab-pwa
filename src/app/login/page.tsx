'use client'
import { useState } from 'react'
//import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      alert("Error: " + error.message);
      return;
    }

    // 🔥 El secreto: Refrescar el servidor antes de navegar
    // Esto fuerza a Next.js a re-evaluar el proxy.ts con la nueva cookie
    router.refresh(); 
    
    setTimeout(() => {
      window.location.href = '/registro';
  }, 500); 
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">Login</h1>
        <input 
          type="email" placeholder="Correo" 
          className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Contraseña" 
          className="w-full p-3 border rounded-lg mb-6 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
          Entrar
        </button>
      </form>
    </main>
  )
}