import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

const funFacts = [
  "Notes improve memory!",
  "Write things down to remember.",
  "Sticky notes invented in 1974.",
  "Organize your thoughts.",
  "A note a day keeps chaos away!",
  "Brainstorm better with notes.",
  "Short notes = clear ideas.",
  "Sticky notes came from failed glue.",
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Store notes with randomized positions and animation params
  const [papers, setPapers] = useState([]);
  const [rainNotes, setRainNotes] = useState([]);

  useEffect(() => {
    // Create drifting "papers" - bigger notes with facts
    const paperCount = 10;
    const newPapers = Array(paperCount).fill(0).map(() => ({
      id: Math.random().toString(36).slice(2, 9),
      top: 5 + Math.random() * 85, // from 5% to 90% viewport height
      left: 5 + Math.random() * 90, // from 5% to 95% viewport width
      delay: Math.random() * 15,
      durationX: 8 + Math.random() * 8,
      durationY: 6 + Math.random() * 6,
      rotate: Math.random() * 20 - 10,
      fact: funFacts[getRandomInt(funFacts.length)],
    }));
    setPapers(newPapers);

    // Create smaller "rain notes" drifting with short facts
    const rainCount = 30;
    const newRain = Array(rainCount).fill(0).map(() => {
      const fact = funFacts[getRandomInt(funFacts.length)];
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

  const handleRegister = async e => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      await API.post('/register', { name, email, password });
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gray-900 text-yellow-50 font-serif">

      {/* Animated background gradient */}
      <div className="absolute inset-0 animate-backgroundShift bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950"></div>

      {/* Drifting big note papers */}
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

      {/* Drifting smaller rain notes */}
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

      {/* Register form */}
      <div className="relative z-10 bg-gray-900 bg-opacity-90 backdrop-blur-md p-10 rounded-3xl shadow-lg w-full max-w-md border border-yellow-700 animate-fadeInScale">
        <h2 className="text-3xl font-bold mb-8 text-center text-yellow-300 tracking-wide">
          📝 Register Your Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-yellow-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-yellow-600 text-yellow-200 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-yellow-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-yellow-600 text-yellow-200 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-yellow-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-yellow-600 text-yellow-200 placeholder-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-gray-900 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-yellow-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline text-yellow-500">
            Login here
          </Link>
        </p>
      </div>

      {/* Inline CSS animations */}
      <style>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes backgroundShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.7s ease forwards;
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
          0%, 100% {
            transform: rotate(var(--rotate));
          }
          50% {
            transform: rotate(calc(var(--rotate) + 3deg));
          }
        }

        .hover\\:animate-tilt:hover {
          animation: tilt 4s ease-in-out infinite;
        }

        /* Dynamic drift animations for each note */
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
