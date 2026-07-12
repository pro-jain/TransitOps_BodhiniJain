import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const DEMO_ACCOUNTS = [
  ['fleetmanager@transitops.com', 'Fleet Manager'],
  ['driver@transitops.com', 'Driver'],
  ['safety@transitops.com', 'Safety Officer'],
  ['finance@transitops.com', 'Financial Analyst'],
];

export default function Login() {
  const { user, login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('fleetmanager@transitops.com');
  const [password, setPassword] = useState('password123');

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate('/dashboard');
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="dot-row"><span className="d" /><span className="d" /><span className="d" /></div>
          <h1>TransitOps</h1>
          <p>Smart Transport Operations Platform</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-demo-note">
          Demo accounts (password: password123)<br />
          {DEMO_ACCOUNTS.map(([e, role]) => (
            <div key={e}>{e} — {role}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
