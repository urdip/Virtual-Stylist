"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/lib/auth-context";
import AvatarOverlay from "../../src/components/AvatarOverlay";
import {
  listWardrobe,
  uploadClothing,
  uploadUserPhoto,
  deleteUserPhoto,
  generateOutfitTryOn,
  listAvatars,
  createAvatar,
  activateAvatar,
  deleteAvatar,
  type Avatar,
  type Category,
  type WardrobeItem,
} from "../../src/lib/api";

type Tab = "inspo" | "outfits" | "wardrobe" | "avatars" | "profile";
type OutfitSelection = Record<Category, WardrobeItem | null>;

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "top", label: "Upper body" },
  { value: "bottom", label: "Lower body" },
  { value: "dress", label: "Dresses" },
  { value: "shoes", label: "Shoes" },
  { value: "accessory", label: "Accessories" },
];

// Icons
const InspoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
  </svg>
);

const OutfitsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
  </svg>
);

const WardrobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM4 20V4h16v16H4zm4-10h8v2H8zm0-4h8v2H8z"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const AvatarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ShirtIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
  </svg>
);

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

const initialOutfit: OutfitSelection = {
  top: null,
  bottom: null,
  dress: null,
  shoes: null,
  accessory: null,
};

export default function BuilderPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>("wardrobe");
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [outfit, setOutfit] = useState<OutfitSelection>(initialOutfit);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<Category>("top");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [showOutfitPanel, setShowOutfitPanel] = useState(true);
  const [photoAction, setPhotoAction] = useState<"none" | "update" | "delete">("none");
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  
  // Avatars state
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState("");
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && activeTab === "wardrobe") {
      loadWardrobe();
    }
    if (user && activeTab === "avatars") {
      loadAvatars();
    }
  }, [user, activeTab]);

  const loadWardrobe = async () => {
    try {
      const data = await listWardrobe();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadAvatars = async () => {
    try {
      const data = await listAvatars();
      setAvatars(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newAvatarName.trim()) return;

    setIsAvatarLoading(true);
    setError("");
    try {
      await createAvatar(newAvatarName.trim(), file);
      await loadAvatars();
      setShowAvatarModal(false);
      setNewAvatarName("");
      e.target.value = "";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleActivateAvatar = async (avatarId: string) => {
    setError("");
    try {
      await activateAvatar(avatarId);
      await loadAvatars();
      await refreshUser(); // Refresh to update active avatar
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAvatar = async (avatarId: string) => {
    if (!confirm("Are you sure you want to delete this avatar?")) return;
    
    setError("");
    try {
      await deleteAvatar(avatarId);
      await loadAvatars();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      await uploadClothing(file, uploadCategory);
      await loadWardrobe();
      setShowUploadModal(false);
      e.target.value = "";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPhotoLoading(true);
    setError("");
    try {
      await uploadUserPhoto(file);
      await refreshUser();
      setPhotoAction("none");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Are you sure you want to delete your profile photo?")) return;

    setIsPhotoLoading(true);
    setError("");
    try {
      await deleteUserPhoto();
      await refreshUser();
      setPhotoAction("none");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const toggleItemSelection = (item: WardrobeItem) => {
    setOutfit((prev) => {
      // If this item is already selected, deselect it
      if (prev[item.category]?.id === item.id) {
        return { ...prev, [item.category]: null };
      }
      // Otherwise, select it (replace any existing item in this category)
      return { ...prev, [item.category]: item };
    });
  };

  const removeFromOutfit = (category: Category) => {
    setOutfit((prev) => ({ ...prev, [category]: null }));
  };

  const clearOutfit = () => {
    setOutfit(initialOutfit);
  };

  const selectedItems = Object.values(outfit).filter(Boolean) as WardrobeItem[];
  const hasSelection = selectedItems.length > 0;

  const handleTryOn = async () => {
    if (!hasSelection) return;
    
    if (!user.photo_url) {
      setError("Please upload a photo first to generate a try-on");
      return;
    }
    
    const garmentUrls = selectedItems.map(item => item.url);
    
    setGenerating(true);
    setError("");
    setResultUrl("");

    try {
      const result = await generateOutfitTryOn(garmentUrls);
      setResultUrl(result.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  if (authLoading || !user) {
    return (
      <div className="loading-screen">
        <div className="spinner-large" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">
          {activeTab === "wardrobe" && "Wardrobe"}
          {activeTab === "profile" && "Profile"}
          {activeTab === "avatars" && "My Avatars"}
          {activeTab === "inspo" && "Inspiration"}
          {activeTab === "outfits" && "Outfits"}
        </h1>
        {user.photo_url && (
          <button
            className="header-avatar"
            onClick={() => setActiveTab("profile")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab("profile");
              }
            }}
            tabIndex={0}
            aria-label="Open profile"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <img 
              src={user.photo_url} 
              alt="Profile" 
            />
          </button>
        )}
      </header>

      {/* Error Toast */}
      {error && (
        <div className="error-toast animate-slide-down">
          <span>⚠</span>
          {error}
          <button onClick={() => setError("")} className="close-btn">✕</button>
        </div>
      )}

      {/* Main Content */}
      <main className={`main-content ${hasSelection && showOutfitPanel ? 'with-panel' : ''}`}>
        {/* Wardrobe Tab */}
        {activeTab === "wardrobe" && (
          <div className="wardrobe-view animate-fade-in">
            {/* Photo Upload Prompt */}
            {!user.photo_url && (
              <div className="photo-prompt">
                <div className="photo-prompt-icon">📸</div>
                <h3>Upload your photo</h3>
                <p>Add a photo to start trying on clothes</p>
                <label className="btn-primary">
                  <PlusIcon />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>
              </div>
            )}

            {/* Avatar with Clothing Overlay */}
            {user.photo_url && (
              <div className="avatar-preview-section">
                {(() => {
                  const topUrl = outfit.dress ? outfit.dress.url : outfit.top?.url;
                  const bottomUrl = outfit.dress ? undefined : outfit.bottom?.url;
                  const accessoryUrl = outfit.accessory?.url || outfit.shoes?.url;
                  console.log("Overlay URLs:", { top: topUrl, bottom: bottomUrl, accessory: accessoryUrl });
                  return (
                    <AvatarOverlay
                      baseSrc={user.photo_url}
                      topSrc={topUrl}
                      bottomSrc={bottomUrl}
                      accessorySrc={accessoryUrl}
                    />
                  );
                })()}
              </div>
            )}

            {/* Categories */}
            {CATEGORIES.map((cat) => {
              const catItems = groupedItems[cat.value] || [];
              const selectedInCategory = outfit[cat.value];
              
              return (
                <section key={cat.value} className="category-section">
                  <div className="category-header">
                    <h2 className="category-title">{cat.label}</h2>
                    {selectedInCategory && (
                      <span className="selected-badge">1 selected</span>
                    )}
                  </div>
                  <div className="items-grid">
                    {catItems.map((item) => {
                      const isSelected = selectedInCategory?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItemSelection(item)}
                          className={`item-card ${isSelected ? 'selected' : ''}`}
                          aria-label={`Select ${item.filename}`}
                        >
                          <img src={item.url} alt={item.filename} loading="lazy" />
                          {isSelected && (
                            <div className="selection-indicator">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {catItems.length === 0 && (
                      <div className="empty-state">
                        <span className="empty-icon">👕</span>
                        <p>No items yet</p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="profile-view animate-fade-in">
            <div className="profile-header">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-container">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="Profile" className="profile-avatar" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <ProfileIcon />
                    </div>
                  )}
                  {isPhotoLoading && (
                    <div className="profile-avatar-overlay">
                      <div className="spinner-small" />
                    </div>
                  )}
                </div>
                
                {/* Avatar Edit Button */}
                <button 
                  className="avatar-edit-btn"
                  onClick={() => setPhotoAction(photoAction === "update" ? "none" : "update")}
                  disabled={isPhotoLoading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
              
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-email">{user.email}</p>
            </div>

            {/* Photo Actions */}
            {photoAction === "update" && (
              <div className="photo-actions-panel animate-fade-in">
                <h4>Update Profile Photo</h4>
                <div className="photo-action-buttons">
                  <label className="photo-action-btn primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload New Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                  </label>
                  
                  {user.photo_url && (
                    <button className="photo-action-btn danger" onClick={handlePhotoDelete}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Delete Photo
                    </button>
                  )}
                  
                  <button className="photo-action-btn secondary" onClick={() => setPhotoAction("none")}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="profile-sections">
              {!user.photo_url && photoAction !== "update" && (
                <label className="profile-option">
                  <span className="option-icon">📸</span>
                  <span className="option-text">Upload Photo</span>
                  <span className="option-arrow">›</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>
              )}
              <button className="profile-option" onClick={logout}>
                <span className="option-icon">🚪</span>
                <span className="option-text">Logout</span>
                <span className="option-arrow">›</span>
              </button>
            </div>

            <div className="app-info">
              <p>Virtual Stylist v1.0</p>
            </div>
          </div>
        )}

        {/* Avatars Tab */}
        {activeTab === "avatars" && (
          <div className="avatars-view animate-fade-in">
            <div className="avatars-header">
              <p className="avatars-subtitle">
                Create and manage multiple AI avatars for trying on outfits
              </p>
              <button 
                className="btn-create-avatar"
                onClick={() => setShowAvatarModal(true)}
              >
                <PlusIcon />
                Create New Avatar
              </button>
            </div>

            {avatars.length === 0 ? (
              <div className="empty-avatars">
                <div className="empty-icon">👤</div>
                <h3>No avatars yet</h3>
                <p>Create your first avatar to start trying on clothes</p>
                <button 
                  className="btn-create-avatar"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <PlusIcon />
                  Create Avatar
                </button>
              </div>
            ) : (
              <div className="avatars-grid">
                {avatars.map((avatar) => (
                  <div 
                    key={avatar.id} 
                    className={`avatar-card ${avatar.is_active ? 'active' : ''}`}
                  >
                    <div className="avatar-image">
                      <img src={avatar.photo_url} alt={avatar.name} />
                      {avatar.is_active && (
                        <div className="avatar-active-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Active
                        </div>
                      )}
                    </div>
                    <div className="avatar-info">
                      <h4>{avatar.name}</h4>
                      <div className="avatar-actions">
                        {!avatar.is_active && (
                          <button 
                            className="btn-activate"
                            onClick={() => handleActivateAvatar(avatar.id)}
                          >
                            Activate
                          </button>
                        )}
                        <button 
                          className="btn-delete-avatar"
                          onClick={() => handleDeleteAvatar(avatar.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inspo Tab */}
        {activeTab === "inspo" && (
          <div className="placeholder-view animate-fade-in">
            <div className="placeholder-icon">✨</div>
            <h3>Coming Soon</h3>
            <p>Get inspiration from trending outfits curated just for you</p>
          </div>
        )}

        {/* Outfits Tab */}
        {activeTab === "outfits" && (
          <div className="placeholder-view animate-fade-in">
            <div className="placeholder-icon">👔</div>
            <h3>Coming Soon</h3>
            <p>Save and manage your favorite outfits</p>
          </div>
        )}
      </main>

      {/* Outfit Panel (shows when items selected) */}
      {hasSelection && activeTab === "wardrobe" && showOutfitPanel && (
        <div className="outfit-panel animate-slide-up">
          <div className="outfit-panel-header">
            <div className="outfit-title">
              <ShirtIcon />
              <span>Your Outfit ({selectedItems.length} items)</span>
            </div>
            <div className="outfit-actions">
              <button className="btn-clear" onClick={clearOutfit}>Clear all</button>
              <button 
                className="btn-toggle" 
                onClick={() => setShowOutfitPanel(false)}
                aria-label="Hide panel"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="outfit-items">
            {Object.entries(outfit).map(([category, item]) => {
              if (!item) return null;
              const catLabel = CATEGORIES.find(c => c.value === category)?.label || category;
              return (
                <div key={category} className="outfit-item">
                  <img src={item.url} alt={item.filename} />
                  <div className="outfit-item-overlay">
                    <span className="outfit-item-category">{catLabel}</span>
                    <button 
                      className="outfit-item-remove" 
                      onClick={() => removeFromOutfit(category as Category)}
                      aria-label={`Remove ${catLabel}`}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="outfit-footer">
            <button 
              className="btn-tryon-outfit" 
              onClick={handleTryOn}
              disabled={generating || !user.photo_url}
            >
              {generating ? (
                <>
                  <span className="spinner-small" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Try On Outfit
                </>
              )}
            </button>
            {!user.photo_url && (
              <p className="outfit-hint">Upload your photo first to try on</p>
            )}
          </div>
        </div>
      )}

      {/* Collapsed Outfit Button */}
      {hasSelection && activeTab === "wardrobe" && !showOutfitPanel && (
        <button 
          className="outfit-collapsed-btn animate-slide-up" 
          onClick={() => setShowOutfitPanel(true)}
        >
          <div className="outfit-preview-thumbs">
            {selectedItems.slice(0, 3).map((item, i) => (
              <img key={i} src={item.url} alt="" />
            ))}
          </div>
          <span>{selectedItems.length} items selected</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}

      {/* Result Modal */}
      {resultUrl && (
        <div className="modal-overlay" onClick={() => setResultUrl("")}>
          <div className="modal-content result-modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Your Outfit Try-On</h3>
              <button className="btn-close" onClick={() => setResultUrl("")}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <img src={resultUrl} alt="Try-on result" />
            </div>
            <div className="modal-footer">
              <a 
                href={resultUrl} 
                download 
                className="btn-download"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Item</h3>
              <button className="btn-close" onClick={() => setShowUploadModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <label className="select-label">Category</label>
              <select 
                value={uploadCategory} 
                onChange={(e) => setUploadCategory(e.target.value as Category)}
                className="category-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <label className="upload-btn">
                {uploading ? (
                  <>
                    <span className="spinner-small" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    Choose Photo
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleUpload} hidden disabled={uploading} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Avatar</h3>
              <button className="btn-close" onClick={() => setShowAvatarModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <label className="select-label">Avatar Name</label>
              <input
                type="text"
                placeholder="e.g., Summer Look, Work Style"
                value={newAvatarName}
                onChange={(e) => setNewAvatarName(e.target.value)}
                className="avatar-name-input"
              />
              <label className="upload-btn">
                {isAvatarLoading ? (
                  <>
                    <span className="spinner-small" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    Upload Photo
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  hidden 
                  disabled={isAvatarLoading || !newAvatarName.trim()} 
                />
              </label>
              <p className="avatar-hint">Take a full-body photo for best results</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {activeTab === "wardrobe" && (
        <button 
          className="fab-add" 
          onClick={() => setShowUploadModal(true)}
          aria-label="Add item"
        >
          <PlusIcon />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav safe-bottom">
        <button 
          className={`nav-item ${activeTab === "inspo" ? "active" : ""}`}
          onClick={() => setActiveTab("inspo")}
          aria-label="Inspiration"
        >
          <InspoIcon />
          <span>Inspo</span>
        </button>
        <button 
          className={`nav-item ${activeTab === "outfits" ? "active" : ""}`}
          onClick={() => setActiveTab("outfits")}
          aria-label="Outfits"
        >
          <OutfitsIcon />
          <span>Outfits</span>
        </button>
        <button 
          className={`nav-item ${activeTab === "wardrobe" ? "active" : ""}`}
          onClick={() => setActiveTab("wardrobe")}
          aria-label="Wardrobe"
        >
          <WardrobeIcon />
          <span>Wardrobe</span>
        </button>
        <button 
          className={`nav-item ${activeTab === "avatars" ? "active" : ""}`}
          onClick={() => setActiveTab("avatars")}
          aria-label="Avatars"
        >
          <AvatarIcon />
          <span>Avatars</span>
        </button>
        <button 
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          aria-label="Profile"
        >
          <ProfileIcon />
          <span>Profile</span>
        </button>
      </nav>

      <style jsx>{`
        /* App Container */
        .app-container {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--background);
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        }

        /* Loading Screen */
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
          color: var(--muted);
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Header */
        .app-header {
          position: sticky;
          top: 0;
          background: rgba(245, 243, 240, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: clamp(12px, 4vw, 20px) clamp(16px, 5vw, 24px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .app-title {
          font-size: clamp(24px, 6vw, 32px);
          font-weight: 700;
          color: var(--foreground);
          letter-spacing: -0.02em;
        }

        .header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          cursor: pointer;
          border: 2px solid var(--card);
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-fast);
        }

        .header-avatar:hover {
          transform: scale(1.05);
        }

        /* Error Toast */
        .error-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--error);
          color: white;
          padding: 12px 20px;
          border-radius: 50px;
          z-index: 300;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: var(--shadow-lg);
          max-width: calc(100% - 40px);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
          opacity: 0.8;
          transition: opacity var(--transition-fast);
        }

        .close-btn:hover {
          opacity: 1;
        }

        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }

        /* Main Content */
        .main-content {
          padding: clamp(16px, 4vw, 24px);
          padding-bottom: 120px;
          transition: padding-bottom 0.3s ease;
        }

        .main-content.with-panel {
          padding-bottom: 320px;
        }

        /* Photo Prompt */
        .photo-prompt {
          background: linear-gradient(135deg, var(--card) 0%, #fafafa 100%);
          border-radius: var(--radius-xl);
          padding: clamp(24px, 6vw, 32px);
          text-align: center;
          margin-bottom: 24px;
          border: 2px dashed var(--border);
        }

        /* Avatar Preview Section */
        .avatar-preview-section {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          padding: 16px;
          background: var(--card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .avatar-preview-section * {
          outline: none !important;
          border: none !important;
        }

        .avatar-preview-section img {
          outline: none !important;
          border: none !important;
          -webkit-tap-highlight-color: transparent;
        }

        .photo-prompt-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .photo-prompt h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .photo-prompt p {
          color: var(--muted);
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* Category Section */
        .category-section {
          margin-bottom: 24px;
        }

        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .category-title {
          font-size: clamp(16px, 4vw, 18px);
          font-weight: 600;
          color: var(--foreground);
          padding-left: 4px;
        }

        .selected-badge {
          font-size: 12px;
          font-weight: 500;
          color: var(--success);
          background: rgba(34, 197, 94, 0.1);
          padding: 4px 10px;
          border-radius: 50px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }

        @media (min-width: 480px) {
          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }
        }

        @media (min-width: 640px) {
          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 14px;
          }
        }

        @media (min-width: 1024px) {
          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 16px;
          }
        }

        .item-card {
          aspect-ratio: 3/4;
          background: var(--card);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
          position: relative;
        }

        .item-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .item-card.selected {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
        }

        .item-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .selection-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: var(--accent);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          aspect-ratio: 3/4;
          background: var(--card);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          font-size: 12px;
          border: 2px dashed var(--border);
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 4px;
          opacity: 0.5;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--accent);
          color: white;
          border-radius: var(--radius-lg);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        /* FAB */
        .fab-add {
          position: fixed;
          bottom: calc(100px + env(safe-area-inset-bottom, 0px));
          right: 20px;
          width: 56px;
          height: 56px;
          background: var(--accent);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-lg);
          cursor: pointer;
          z-index: 50;
          transition: all var(--transition-fast);
        }

        .fab-add:hover {
          transform: scale(1.05);
          box-shadow: var(--shadow-xl);
        }

        .fab-add:active {
          transform: scale(0.95);
        }

        /* Bottom Nav */
        .bottom-nav {
          position: fixed;
          bottom: calc(20px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          background: var(--card);
          border-radius: 50px;
          padding: 8px;
          display: flex;
          gap: 4px;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          max-width: calc(100% - 40px);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px clamp(12px, 3vw, 20px);
          border: none;
          background: transparent;
          color: var(--muted);
          font-size: 11px;
          cursor: pointer;
          border-radius: 40px;
          transition: all var(--transition-fast);
          min-width: 60px;
        }

        .nav-item:hover {
          color: var(--foreground);
        }

        .nav-item.active {
          background: var(--accent);
          color: white;
        }

        .nav-item svg {
          width: 22px;
          height: 22px;
        }

        /* Outfit Panel */
        .outfit-panel {
          position: fixed;
          bottom: calc(90px + env(safe-area-inset-bottom, 0px));
          left: 16px;
          right: 16px;
          background: var(--card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          z-index: 60;
          max-height: 280px;
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 640px) {
          .outfit-panel {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: 100%;
            max-width: 600px;
          }
        }

        .outfit-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .outfit-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: var(--foreground);
        }

        .outfit-title svg {
          width: 20px;
          height: 20px;
        }

        .outfit-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-clear {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: var(--muted);
          font-size: 13px;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .btn-clear:hover {
          color: var(--error);
          background: var(--error-bg);
        }

        .btn-toggle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: var(--background);
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .btn-toggle:hover {
          background: var(--border);
          color: var(--foreground);
        }

        .outfit-items {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .outfit-items::-webkit-scrollbar {
          display: none;
        }

        .outfit-item {
          flex-shrink: 0;
          width: 80px;
          height: 100px;
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          box-shadow: var(--shadow-sm);
        }

        .outfit-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .outfit-item-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          padding: 8px 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .outfit-item-category {
          font-size: 10px;
          color: white;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .outfit-item-remove {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.9);
          color: var(--foreground);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .outfit-item-remove svg {
          width: 12px;
          height: 12px;
        }

        .outfit-footer {
          padding: 0 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn-tryon-outfit {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, var(--accent) 0%, #333 100%);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all var(--transition-fast);
        }

        .btn-tryon-outfit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .btn-tryon-outfit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .outfit-hint {
          text-align: center;
          font-size: 12px;
          color: var(--muted);
          margin: 0;
        }

        /* Collapsed Outfit Button */
        .outfit-collapsed-btn {
          position: fixed;
          bottom: calc(100px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: var(--shadow-lg);
          cursor: pointer;
          z-index: 60;
          transition: all var(--transition-fast);
        }

        .outfit-collapsed-btn:hover {
          transform: translateX(-50%) translateY(-2px);
          box-shadow: var(--shadow-xl);
        }

        .outfit-preview-thumbs {
          display: flex;
          margin-left: -8px;
        }

        .outfit-preview-thumbs img {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--accent);
          margin-left: -8px;
          object-fit: cover;
          background: var(--card);
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 20px;
        }

        .modal-content {
          background: var(--card);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 380px;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        .result-modal-content {
          max-width: min(90vw, 600px);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 20px 0;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .btn-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: var(--background);
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .btn-close:hover {
          background: var(--border);
          color: var(--foreground);
        }

        .modal-body {
          padding: 20px;
        }

        .modal-body img {
          width: 100%;
          height: auto;
          border-radius: var(--radius-lg);
        }

        .modal-footer {
          padding: 0 20px 20px;
          display: flex;
          justify-content: center;
        }

        .btn-download {
          padding: 12px 32px;
          background: var(--accent);
          color: white;
          border-radius: var(--radius-lg);
          font-weight: 600;
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .btn-download:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        /* Upload Modal Specific */
        .select-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .category-select {
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          border: 2px solid var(--border);
          font-size: 15px;
          background: var(--background);
          margin-bottom: 16px;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }

        .category-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: white;
          border-radius: var(--radius-lg);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        /* Profile View */
        .profile-view {
          padding: 20px 0;
          max-width: 600px;
          margin: 0 auto;
        }

        .profile-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .profile-avatar-wrapper {
          position: relative;
          width: fit-content;
          margin: 0 auto 16px;
        }

        .profile-avatar-container {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: var(--shadow-md);
          position: relative;
        }

        @media (min-width: 640px) {
          .profile-avatar-container {
            width: 120px;
            height: 120px;
          }
        }

        .profile-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          width: 100%;
          height: 100%;
          background: var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
        }

        .profile-avatar-placeholder svg {
          width: 48px;
          height: 48px;
        }

        .profile-avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          border: 3px solid var(--card);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .avatar-edit-btn:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-md);
        }

        .avatar-edit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .profile-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .profile-email {
          color: var(--muted);
          font-size: 14px;
        }

        /* Photo Actions Panel */
        .photo-actions-panel {
          background: var(--card);
          border-radius: var(--radius-xl);
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
        }

        .photo-actions-panel h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          text-align: center;
        }

        .photo-action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .photo-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          border: none;
        }

        .photo-action-btn.primary {
          background: var(--accent);
          color: white;
        }

        .photo-action-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .photo-action-btn.danger {
          background: var(--error-bg);
          color: #c33;
        }

        .photo-action-btn.danger:hover {
          background: #ffcccc;
        }

        .photo-action-btn.secondary {
          background: var(--background);
          color: var(--muted);
        }

        .photo-action-btn.secondary:hover {
          background: var(--border);
          color: var(--foreground);
        }

        .profile-sections {
          background: var(--card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          margin-bottom: 24px;
        }

        .profile-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px 20px;
          background: none;
          border: none;
          border-bottom: 1px solid var(--background);
          text-align: left;
          font-size: 16px;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .profile-option:hover {
          background: var(--background);
        }

        .profile-option:last-child {
          border-bottom: none;
        }

        .option-icon {
          font-size: 20px;
        }

        .option-text {
          flex: 1;
        }

        .option-arrow {
          color: var(--muted);
          font-size: 18px;
        }

        .app-info {
          text-align: center;
          color: var(--muted);
          font-size: 12px;
        }

        /* Avatars View */
        .avatars-view {
          padding: clamp(16px, 4vw, 24px);
        }

        .avatars-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .avatars-subtitle {
          color: var(--muted);
          font-size: 14px;
          margin-bottom: 16px;
        }

        .btn-create-avatar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-create-avatar:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .empty-avatars {
          text-align: center;
          padding: clamp(60px, 15vh, 100px) 20px;
          background: var(--card);
          border-radius: var(--radius-xl);
          border: 2px dashed var(--border);
        }

        .empty-avatars .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-avatars h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .empty-avatars p {
          color: var(--muted);
          margin-bottom: 24px;
        }

        .avatars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
        }

        @media (min-width: 640px) {
          .avatars-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 20px;
          }
        }

        .avatar-card {
          background: var(--card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
          border: 2px solid transparent;
        }

        .avatar-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .avatar-card.active {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
        }

        .avatar-image {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
        }

        .avatar-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-active-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--accent);
          color: white;
          padding: 4px 8px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .avatar-info {
          padding: 12px;
        }

        .avatar-info h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .avatar-actions {
          display: flex;
          gap: 8px;
        }

        .btn-activate {
          flex: 1;
          padding: 8px 12px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-activate:hover {
          opacity: 0.9;
        }

        .btn-delete-avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--error-bg);
          color: #c33;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-delete-avatar:hover {
          background: #ffcccc;
        }

        .avatar-name-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          border: 2px solid var(--border);
          font-size: 15px;
          background: var(--background);
          margin-bottom: 16px;
          transition: border-color var(--transition-fast);
        }

        .avatar-name-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .avatar-hint {
          text-align: center;
          font-size: 12px;
          color: var(--muted);
          margin-top: 12px;
          margin-bottom: 0;
        }

        /* Placeholder Views */
        .placeholder-view {
          text-align: center;
          padding: clamp(60px, 15vh, 100px) 20px;
        }

        .placeholder-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .placeholder-view h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .placeholder-view p {
          color: var(--muted);
          max-width: 280px;
          margin: 0 auto;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
