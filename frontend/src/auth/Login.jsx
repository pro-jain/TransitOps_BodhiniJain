import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import {
  Truck,
  Mail,
  Lock,
  ShieldCheck,
  BarChart3,
  Route,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  ["fleetmanager@transitops.com", "Fleet Manager"],
  ["driver@transitops.com", "Driver"],
  ["safety@transitops.com", "Safety Officer"],
  ["finance@transitops.com", "Financial Analyst"],
];

export default function Login() {
  const { user, login, loading, error } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState(
    "fleetmanager@transitops.com"
  );

  const [password, setPassword] =
    useState("password123");

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();

    const ok = await login(email, password);

    if (ok) navigate("/dashboard");
  }

  return (
    <div className="auth-screen">

      <div className="auth-card">

        <div className="login-top-accent" />

        <div className="auth-brand">

          <div className="login-logo">
            <Truck size={34} />
          </div>

          <h1>TransitOps</h1>

          <p>
            Intelligent Fleet & Transport Management Platform
          </p>

        </div>

        <div className="login-features">

          <div>
            <Route size={18} />
            <span>Smart Dispatch</span>
          </div>

          <div>
            <ShieldCheck size={18} />
            <span>Safety Monitoring</span>
          </div>

          <div>
            <BarChart3 size={18} />
            <span>Fleet Analytics</span>
          </div>

        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-field">

            <label>Email</label>

            <div className="input-icon">

              <Mail size={18} />

              <input
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>

          </div>

          <div className="form-field">

            <label>Password</label>

            <div className="input-icon">

              <Lock size={18} />

              <input
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

            </div>

          </div>

          <div className="login-options">

            <label>
              <input type="checkbox" />
              Remember me
            </label>

            <button
              type="button"
              className="link-btn"
            >
              Forgot Password?
            </button>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary login-btn"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        <div className="demo-box">

          <div className="demo-title">

            Demo Accounts

          </div>

          {DEMO_ACCOUNTS.map(([mail, role]) => (

            <div
              key={mail}
              className="demo-row"
            >

              <span>{role}</span>

              <code>{mail}</code>

            </div>

          ))}

          <div className="demo-pass">

            Password:
            <b> password123</b>

          </div>

        </div>

      </div>

    </div>
  );
}