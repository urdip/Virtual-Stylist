"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      router.push("/builder");
    } else {
      router.push("/login");
    }
    setIsLoading(false);
  }, [router]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-mark">VS</div>
        <div className="spinner" />
        <p className="loading-text">Loading your wardrobe...</p>
      </div>

      <style jsx>{`
        .loading-screen {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
          padding: 20px;
        }

        .loading-content {
          text-align: center;
          animation: fadeIn 0.4s ease-out;
        }

        .logo-mark {
          width: 64px;
          height: 64px;
          background: var(--accent);
          color: white;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          margin: 0 auto 24px;
          letter-spacing: -0.02em;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: var(--muted);
          font-size: 14px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
