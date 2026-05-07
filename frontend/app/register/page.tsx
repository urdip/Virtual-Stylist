"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, login, loginWithGoogle } from "../../src/lib/api";

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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
            router.push("/builder");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
          } finally {
            setIsLoading(false);
          }
        },
      });
      const btn = document.getElementById("google-signup-btn");
      if (btn) {
        window.google?.accounts.id.renderButton(btn, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signup_with",
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(email, password, name);
      await login(email, password);
      router.push("/builder");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <h1 className="logo">Virtual Stylist</h1>
          <p className="tagline">Create your account</p>
        </div>

        {error && (
          <div className="error-message animate-fade-in">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="name" className="input-label">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input"
              required
              autoComplete="name"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input"
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="input"
              required
              autoComplete="new-password"
              minLength={6}
            />
            <span className="hint">Must be at least 6 characters</span>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="auth-button"
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <>
            <div className="divider">
              <span>or</span>
            </div>
            <div id="google-signup-btn" className="google-btn-wrapper" />
          </>
        )}

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
          padding: clamp(16px, 5vw, 40px);
        }

        .auth-content {
          width: 100%;
          max-width: 400px;
          animation: fadeIn 0.4s ease-out;
        }

        .auth-header {
          text-align: center;
          margin-bottom: clamp(32px, 8vw, 48px);
        }

        .logo {
          font-size: clamp(28px, 8vw, 36px);
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--foreground);
          letter-spacing: -0.02em;
        }

        .tagline {
          color: var(--muted);
          font-size: clamp(14px, 4vw, 16px);
        }

        .error-message {
          background: var(--error-bg);
          color: #c33;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-icon {
          font-size: 16px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--foreground);
          padding-left: 4px;
        }

        .input {
          padding: clamp(14px, 4vw, 16px) clamp(16px, 5vw, 20px);
          border-radius: var(--radius-lg);
          border: 2px solid transparent;
          background: var(--card);
          font-size: 15px;
          outline: none;
          transition: all var(--transition-fast);
          width: 100%;
        }

        .input::placeholder {
          color: #999;
        }

        .input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-light);
        }

        .hint {
          font-size: 12px;
          color: var(--muted);
          padding-left: 4px;
        }

        .auth-button {
          padding: clamp(14px, 4vw, 16px);
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 52px;
        }

        .auth-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0 8px;
          color: var(--muted);
          font-size: 13px;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border, #e5e7eb);
        }

        .google-btn-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: var(--muted);
        }

        .auth-link {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
          transition: opacity var(--transition-fast);
        }

        .auth-link:hover {
          opacity: 0.7;
          text-decoration: underline;
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .auth-content {
            padding: 0 8px;
          }
          
          .input {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .auth-container {
            background: linear-gradient(135deg, #f0fdfa 0%, #e6faf8 100%);
          }

          .auth-content {
            background: var(--background);
            padding: 48px;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
          }
        }
      `}</style>
    </div>
  );
}
