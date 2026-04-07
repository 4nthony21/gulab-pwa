'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Error: " + error.message);
    } else {
      router.push('/registro'); // Si entra bien, la mandamos al registro
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl mb-4 font-bold text-center">Acceso Laboratorio</h2>
        <input 
          type="email" placeholder="Email" 
          className="border p-2 w-full mb-4"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Contraseña" 
          className="border p-2 w-full mb-4"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" className="bg-blue-600 text-white p-2 w-full rounded">
          Entrar
        </button>
      </form>
    </div>
  );
}