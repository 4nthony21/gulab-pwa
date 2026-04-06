import { redirect } from 'next/navigation';

export default function Home() {
  // Apenas alguien entre a la web, lo mandamos a /registro
  redirect('/registro');
  
  // Este retorno es necesario por TypeScript, aunque nunca se llegue a ver
  return null;
}