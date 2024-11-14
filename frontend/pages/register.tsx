import "tailwindcss/tailwind.css";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Si un token est déjà présent, redirige vers le dashboard
    if (token) {
      router.push('/dashboard');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Envoyer la requête au backend
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
        username,
        password
      });

      // Si l'inscription est réussie
      if (response.status === 201) {
        setSuccess('Inscription réussie ! Redirection vers la page de connexion...');
        setTimeout(() => {
          router.push('/login'); // Redirection vers la page de login
        }, 2000);
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
        console.error('Erreur lors de l\'inscription:', err);
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
      
      {/* Animation d'arrière-plan */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
        <div className="w-96 h-96 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-2xl animate-ping"></div>
      </div>

      {/* Formulaire de register */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-white text-center">
          Inscription
        </h2>
        <p className="mt-2 text-center text-gray-300">
          Créez votre compte ClimaLightMonitor
        </p>
        
        {error && (
          <div className="mt-4 text-red-500 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 text-green-500 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Nom d&apos;utilisateur</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                placeholder="Nom d'utilisateur"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-lg font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-transform transform hover:scale-105"
            >
              S&apos;inscrire
            </button>
          </div>
        </form>

        {/* Lien vers la connexion */}
        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:underline"
            >
              Connectez-vous
            </button>
          </p>
        </div>
      </div>

      {/* Effet de particules flottantes */}
      <div className="absolute inset-0 flex items-center justify-center space-x-8">
        <div className="w-56 h-56 border-4 border-green-400 rounded-full animate-spin-slow opacity-20"></div>
        <div className="w-40 h-40 border-4 border-blue-500 rounded-full animate-pulse opacity-30"></div>
        <div className="w-32 h-32 border-4 border-yellow-500 rounded-full animate-spin opacity-50"></div>
      </div>
    </div>
  );
};

export default Register;
