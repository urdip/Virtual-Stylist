"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { uploadClothing, listWardrobe } from "../../src/lib/api";

type WardrobeItem = {
  id: string;
  category: string;
  filename: string;
  url: string;
};

const CATEGORIES = [
  { value: "top", label: "Tops", icon: "👕" },
  { value: "bottom", label: "Bottoms", icon: "👖" },
  { value: "shoes", label: "Shoes", icon: "👟" },
  { value: "dress", label: "Dresses", icon: "👗" },
  { value: "accessory", label: "Accessories", icon: "👜" },
  { value: "outerwear", label: "Outerwear", icon: "🧥" },
];

export default function AvatarPage() {
  const [category, setCategory] = useState("top");
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setError("");
      setLoading(true);
      const data = await listWardrobe();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load wardrobe. Make sure backend is running on :8000");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setLoading(true);
      await uploadClothing(file, category);
      await refresh();
      e.target.value = "";
    } catch {
      setError("Upload failed. Try again.");
      setLoading(false);
    }
  }

  const filtered = items.filter((i) => i.category === category);

  return (
    <div className="avatar-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <h1>AI Stylist</h1>
          <p>Digital Wardrobe</p>
        </div>
      </header>

      <main className="main-content">
        {/* Error Message */}
        {error && (
          <div className="error-banner animate-fade-in">
            <span>⚠</span>
            {error}
            <button onClick={() => setError("")} className="dismiss-btn">✕</button>
          </div>
        )}

        {/* Controls Section */}
        <section className="controls-section">
          <div className="category-selector">
            <label className="selector-label">Category</label>
            <div className="category-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`category-tab ${category === cat.value ? "active" : ""}`}
                  onClick={() => setCategory(cat.value)}
                >
                  <span className="tab-icon">{cat.icon}</span>
                  <span className="tab-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="action-bar">
            <label className="upload-btn">
              {loading ? (
                <>
                  <span className="spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Item
                </>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={loading} />
            </label>

            <button onClick={refresh} className="refresh-btn" disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>

            <Link href="/builder" className="builder-link">
              Try On →
            </Link>
          </div>
        </section>

        {/* Items Grid */}
        <section className="items-section">
          {loading && items.length === 0 ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="items-grid">
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  href={`/builder?category=${encodeURIComponent(item.category)}&url=${encodeURIComponent(item.url)}`}
                  className="item-card"
                  title={`Try on ${item.filename}`}
                >
                  <div className="item-image">
                    <img
                      src={item.url}
                      alt={item.filename}
                      loading="lazy"
                    />
                  </div>
                  <div className="item-info">
                    <p className="item-name">{item.filename}</p>
                    <span className="item-action">Click to try on</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No items in {CATEGORIES.find(c => c.value === category)?.label}</h3>
              <p>Upload your first item to get started</p>
              <label className="upload-btn empty-upload">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Now
                <input type="file" accept="image/*" onChange={handleUpload} hidden />
              </label>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .avatar-page {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--background);
        }

        /* Header */
        .page-header {
          background: linear-gradient(135deg, var(--card) 0%, #fafafa 100%);
          border-bottom: 1px solid var(--border);
          padding: clamp(20px, 5vw, 32px) clamp(16px, 5vw, 32px);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header h1 {
          font-size: clamp(24px, 6vw, 32px);
          font-weight: 700;
          color: var(--foreground);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }

        .page-header p {
          color: var(--muted);
          font-size: clamp(14px, 3vw, 16px);
        }

        /* Main Content */
        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: clamp(16px, 4vw, 32px);
        }

        /* Error Banner */
        .error-banner {
          background: var(--error-bg);
          color: #c33;
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          animation: fadeIn 0.3s ease-out;
        }

        .dismiss-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .dismiss-btn:hover {
          opacity: 1;
        }

        /* Controls Section */
        .controls-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
        }

        @media (min-width: 768px) {
          .controls-section {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
          }
        }

        .category-selector {
          flex: 1;
        }

        .selector-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .category-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .category-tabs::-webkit-scrollbar {
          display: none;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--card);
          border: 2px solid transparent;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .category-tab:hover {
          border-color: var(--border);
          color: var(--foreground);
        }

        .category-tab.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        .tab-icon {
          font-size: 16px;
        }

        .tab-label {
          display: none;
        }

        @media (min-width: 480px) {
          .tab-label {
            display: inline;
          }
        }

        /* Action Bar */
        .action-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--accent);
          color: white;
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .upload-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .upload-btn.empty-upload {
          margin-top: 16px;
        }

        .hidden {
          display: none;
        }

        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--card);
          color: var(--foreground);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover:not(:disabled) {
          border-color: var(--accent);
        }

        .refresh-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .builder-link {
          display: inline-flex;
          align-items: center;
          padding: 12px 20px;
          background: transparent;
          color: var(--accent);
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
          margin-left: auto;
        }

        .builder-link:hover {
          background: var(--card);
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Items Grid */
        .items-section {
          min-height: 300px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }

        @media (min-width: 640px) {
          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
          }
        }

        @media (min-width: 1024px) {
          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 24px;
          }
        }

        .item-card {
          background: var(--card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
        }

        .item-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .item-image {
          aspect-ratio: 4/3;
          overflow: hidden;
          background: var(--background);
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .item-card:hover .item-image img {
          transform: scale(1.05);
        }

        .item-info {
          padding: 16px;
        }

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--foreground);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .item-action {
          font-size: 12px;
          color: var(--muted);
        }

        /* Loading Grid */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }

        @media (min-width: 640px) {
          .loading-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
          }
        }

        .skeleton-card {
          aspect-ratio: 4/3.5;
          background: linear-gradient(90deg, var(--card) 25%, #e8e8e8 50%, var(--card) 75%);
          background-size: 200% 100%;
          animation: skeleton 1.5s ease-in-out infinite;
          border-radius: var(--radius-xl);
        }

        @keyframes skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: clamp(60px, 15vh, 100px) 20px;
          background: var(--card);
          border-radius: var(--radius-xl);
          border: 2px dashed var(--border);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--foreground);
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--muted);
          margin-bottom: 8px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
