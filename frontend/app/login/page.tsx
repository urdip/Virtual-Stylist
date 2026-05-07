"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, loginWithGoogle } from "../../src/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setError("");
          setIsLoading(true);
          try {
            await loginWithGoogle(response.credential);
            window.location.href = "/builder";
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
          } finally {
            setIsLoading(false);
          }
        },
      });
      const btn = document.getElementById("google-login-btn");
      if (btn) {
        window.google?.accounts.id.renderButton(btn, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      window.location.href = "/builder";
    } catch (err: any) {
      setError(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        {/* Logo mark */}
        <div className="logo-mark">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
          </svg>
        </div>

        <div className="brand">
          <h1 className="title">Virtual Stylist</h1>
          <p className="subtitle">Your AI-powered wardrobe, styled around you.</p>
        </div>

        {error && (
          <div className="error-banner animate-fade-in">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label htmlFor="email" className="label">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <>
            <div className="divider"><span>or continue with</span></div>
            <div id="google-login-btn" className="google-wrapper" />
          </>
        )}

        <p className="footer-link">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="link">Create one</Link>
        </p>

        <p className="tagline-bottom">Style smarter. Dress better.</p>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #fafaf9 0%, #f0f4f3 50%, #eaf2f1 100%);
          padding: clamp(20px, 5vw, 48px);
        }

        .card {
          width: 100%;
          max-width: 420px;
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 640px) {
          .card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 28px;
            padding: 48px 44px 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08), 0 32px 64px rgba(0,0,0,0.06);
            border: 1px solid rgba(255,255,255,0.9);
          }
        }

        .logo-mark {
          width: 52px;
          height: 52px;
          background: var(--foreground);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 20px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .brand {
          text-align: center;
          margin-bottom: 36px;
        }

        .title {
          font-size: clamp(26px, 6vw, 32px);
          font-weight: 700;
          color: var(--foreground);
          letter-spacing: -0.03em;
          margin-bottom: 8px;
          line-height: 1.1;
        }

        .subtitle {
          font-size: 15px;
          color: var(--muted);
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.01em;
        }

        .error-banner {
          background: #fff1f0;
          color: #c0392b;
          border: 1px solid #ffc9c5;
          padding: 12px 16px;
          border-radius: 14px;
          margin-bottom: 20px;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .label {
          font-size: 13px;
          font-weight: 600;
          color: #444;
          letter-spacing: 0.01em;
        }

        .input {
          padding: 15px 18px;
          border-radius: 14px;
          border: 1.5px solid #e4e4e7;
          background: rgba(255,255,255,0.9);
          font-size: 15px;
          color: var(--foreground);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          -webkit-appearance: none;
        }

        .input::placeholder {
          color: #b0b0b8;
        }

        .input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
          background: white;
        }

        .btn-primary {
          margin-top: 4px;
          padding: 16px;
          background: var(--foreground);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 54px;
          letter-spacing: -0.01em;
          transition: all 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          background: #222;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 16px;
          color: #b0b0b8;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #ebebeb;
        }

        .google-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 4px;
        }

        .footer-link {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: var(--muted);
        }

        .link {
          color: var(--foreground);
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1.5px solid var(--foreground);
          padding-bottom: 1px;
          transition: opacity 0.15s ease;
        }

        .link:hover {
          opacity: 0.6;
        }

        .tagline-bottom {
          text-align: center;
          margin-top: 28px;
          font-size: 12px;
          color: #c0c0c8;
          letter-spacing: 0.05em;
          font-weight: 500;
          text-transform: uppercase;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @media (max-width: 480px) {
          .input {
            font-size: 16px;
          }
          .card {
            padding: 0 4px;
          }
        }
      `}</style>
    </div>
  );
}
