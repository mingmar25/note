import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

const loginFacts = [
  "Keep your password strong!",
  "Login securely every time.",
  "Notes keep you organized.",
  "Quick access to your notes.",
  "Sync notes across devices.",
  "Your data, always safe.",
  "Remember to logout after use.",
  "Two-factor authentication boosts security.",
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);

  // Setup drifting notes state
  const [papers, setPapers] = useState([]);
  const [rainNotes, setRainNotes] = useState([]);

  useEffect(() => {
    setAnimate(true);

    // Create big drifting note papers with random facts
    const paperCount = 10;
    const newPapers = Array(paperCount).fill(0).map(() => ({
      id: Math.random().toString(36).slice(2, 9),
      top: 5 + Math.random() * 85,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 15,
      durationX: 8 + Math.random() * 8,
      durationY: 6 + Math.random() * 6,
      rotate: Math.random() * 20 - 10,
      fact: loginFacts[getRandomInt(loginFacts.length)],
    }));
    setPapers(newPapers);

    // Smaller rain notes with short facts
    const rainCount = 30;
    const newRain = Array(rainCount).fill(0).map(() => {
      const fact = loginFacts[getRandomInt(loginFacts.length)];
      const shortFact = fact.length > 10 ? fact.slice(0, 10) + '...' : fact;
      return {
        id: Math.random().toString(36).slice(2, 9),
        top: 5 + Math.random() * 85,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 15,
        durationX: 6 + Math.random() * 6,
        durationY: 5 + Math.random() * 5,
        rotate: Math.random() * 20 - 10,
        opacity: 0.1 + Math.random() * 0.25,
        fact: shortFact,
      };
    });
    setRainNotes(newRain);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert('Please enter both email and password.');
      return;
    }

    try {
      const res = await API.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 bg-gray-900 text-yellow-50 font-serif">

      {/* Animated shifting dark background */}
      <div className="absolute inset-0 animate-backgroundShift bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950" />

      {/* Big drifting note papers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {papers.map(p => (
          <div
            key={p.id}
            className="absolute bg-yellow-900 bg-opacity-80 rounded-lg p-4 text-sm select-none shadow-md text-yellow-200 hover:animate-tilt"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: 180,
              height: 90,
              transform: `rotate(${p.rotate}deg)`,
              animation: `
                driftX${p.id} ${p.durationX}s ease-in-out infinite alternate,
                driftY${p.id} ${p.durationY}s ease-in-out infinite alternate
              `,
              animationDelay: `${p.delay}s`,
              boxShadow: '0 0 8px 2px rgba(202, 176, 23, 0.8)',
              willChange: 'transform',
            }}
          >
            {p.fact}
          </div>
        ))}
      </div>

      {/* Smaller drifting rain notes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {rainNotes.map(r => (
          <div
            key={r.id}
            className="absolute bg-yellow-700 rounded px-1 text-[10px] text-yellow-200 select-none font-mono shadow-sm"
            style={{
              width: 40,
              height: 18,
              left: `${r.left}%`,
              top: `${r.top}%`,
              opacity: r.opacity,
              transform: `rotate(${r.rotate}deg)`,
              animation: `
                driftX${r.id} ${r.durationX}s ease-in-out infinite alternate,
                driftY${r.id} ${r.durationY}s ease-in-out infinite alternate,
                fadeInOut${r.id} 6s ease-in-out infinite
              `,
              animationDelay: `${r.delay}s`,
              lineHeight: '18px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              willChange: 'transform, opacity',
            }}
          >
            {r.fact}
          </div>
        ))}
      </div>

      {/* Login card */}
      <div
        className={`relative z-10 max-w-md w-full bg-gray-900 bg-opacity-90 backdrop-blur-md rounded-3xl shadow-lg p-8 space-y-6 border border-yellow-700
          transform transition-all duration-700 ease-out
          ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        <h2 className="text-3xl font-extrabold text-yellow-300 text-center tracking-wide">
          Welcome Back
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block mb-2 font-semibold text-yellow-400">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-yellow-600 bg-gray-800 text-yellow-200 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition-shadow duration-300"
              />
              <svg
                className="w-5 h-5 text-yellow-500 absolute left-3 top-3.5 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M16 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block mb-2 font-semibold text-yellow-400">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-yellow-600 bg-gray-800 text-yellow-200 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition-shadow duration-300"
              />
              <svg
                className="w-5 h-5 text-yellow-500 absolute left-3 top-3.5 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-semibold rounded-lg shadow-md
              transition-transform duration-150 active:scale-95"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-yellow-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-yellow-500 font-semibold hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes backgroundShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-backgroundShift {
          background-size: 200% 200%;
          animation: backgroundShift 30s ease infinite;
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        @keyframes tilt {
          0%, 100% { transform: rotate(var(--rotate)); }
          50% { transform: rotate(calc(var(--rotate) + 3deg)); }
        }
        .hover\\:animate-tilt:hover {
          animation: tilt 4s ease-in-out infinite;
        }

        /* Dynamic drift animations for big papers */
        ${papers.map(p => `
          @keyframes driftX${p.id} {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(${(Math.random() * 20 - 10).toFixed(2)}px); }
          }
          @keyframes driftY${p.id} {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(${(Math.random() * 20 - 10).toFixed(2)}px); }
          }
        `).join('')}

        /* Dynamic drift & fade animations for rain notes */
        ${rainNotes.map(r => `
          @keyframes driftX${r.id} {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(${(Math.random() * 15 - 7.5).toFixed(2)}px); }
          }
          @keyframes driftY${r.id} {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(${(Math.random() * 15 - 7.5).toFixed(2)}px); }
          }
          @keyframes fadeInOut${r.id} {
            0%, 100% { opacity: 0; }
            50% { opacity: ${r.opacity.toFixed(2)}; }
          }
        `).join('')}
      `}</style>
    </div>
  );
}
