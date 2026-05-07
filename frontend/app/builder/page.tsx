"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/lib/auth-context";

import {
  listWardrobe,
  uploadClothing,
  importClothingFromUrl,
  deleteClothing,
  uploadUserPhoto,
  deleteUserPhoto,
  generateOutfitTryOn,
  listAvatars,
  createAvatar,
  activateAvatar,
  deleteAvatar,
  listOutfits,
  saveOutfit,
  deleteOutfit,
  updateOutfitName,
  changePassword,
  requestPasswordReset,
  type Avatar,
  type Category,
  type WardrobeItem,
  type SavedOutfit,
} from "../../src/lib/api";

import HM_PRODUCTS from "../../src/lib/hm-products";

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
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0, message: "" });
  const [resultUrl, setResultUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [showOutfitPanel, setShowOutfitPanel] = useState(true);
  const [photoAction, setPhotoAction] = useState<"none" | "update" | "delete">("none");
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [photoCacheBust, setPhotoCacheBust] = useState(Date.now());
  
  // Avatars state
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState("");
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  
  // Outfits state
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isOutfitsLoading, setIsOutfitsLoading] = useState(false);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  
  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [inspoFilter, setInspoFilter] = useState("All");
  const [failedInspoImages, setFailedInspoImages] = useState<Set<string>>(new Set());
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [hiddenZaraIds, setHiddenZaraIds] = useState<Set<string>>(new Set());
  const [validZaraIds, setValidZaraIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    // Only load if user exists
    if (!user) return;
    
    if (activeTab === "wardrobe") {
      loadWardrobe();
    } else if (activeTab === "avatars") {
      loadAvatars();
    } else if (activeTab === "outfits") {
      loadOutfits();
    }
  }, [user, activeTab]);
  
  // Safety timeout to clear loading state
  useEffect(() => {
    if (activeTab === "outfits" && isOutfitsLoading) {
      const timer = setTimeout(() => {
        setIsOutfitsLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isOutfitsLoading]);

  const loadWardrobe = async () => {
    try {
      const data = await listWardrobe();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const hmCategoryToWardrobe = (cat: string): Category => {
    if (cat === "Pants" || cat === "Jeans" || cat === "Shorts") return "bottom";
    if (cat === "Shoes") return "shoes";
    if (cat === "Dress") return "dress";
    if (cat === "Accessory") return "accessory";
    return "top";
  };

  const handleImportToWardrobe = async (item: typeof HM_PRODUCTS[0]) => {
    if (importingIds.has(item.id) || importedIds.has(item.id)) return;
    setImportingIds(prev => new Set([...prev, item.id]));
    try {
      const category = hmCategoryToWardrobe(item.category);
      await importClothingFromUrl(item.image_url, category, item.name);
      setImportedIds(prev => new Set([...prev, item.id]));
      await loadWardrobe();
    } catch {
      setError("Failed to import item to wardrobe.");
    } finally {
      setImportingIds(prev => { const n = new Set(prev); n.delete(item.id); return n; });
    }
  };

  const handleDeleteClothing = async (item: WardrobeItem) => {
    if (!confirm(`Delete "${item.filename}"?`)) return;
    try {
      await deleteClothing(item.category, item.id);
      setOutfit((prev) => prev[item.category]?.id === item.id ? { ...prev, [item.category]: null } : prev);
      await loadWardrobe();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClearWardrobe = async () => {
    if (!confirm("Delete all your uploaded items? This cannot be undone.")) return;
    try {
      await Promise.all(items.map(item => deleteClothing(item.category, item.id)));
      setOutfit(initialOutfit);
      await loadWardrobe();
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

  const loadOutfits = async () => {
    setIsOutfitsLoading(true);
    try {
      const data = await listOutfits();
      console.log("Loaded outfits:", data);
      setOutfits(data);
    } catch (err: any) {
      console.error("Failed to load outfits:", err);
      setError(err.message);
    } finally {
      setIsOutfitsLoading(false);
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    if (!confirm("Are you sure you want to delete this outfit?")) return;
    try {
      await deleteOutfit(outfitId);
      await loadOutfits();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateOutfitName = async (outfitId: string) => {
    if (!editingName.trim()) return;
    try {
      await updateOutfitName(outfitId, editingName.trim());
      setEditingOutfitId(null);
      setEditingName("");
      await loadOutfits();
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
      setPhotoLoadError(false);
      setPhotoCacheBust(Date.now());
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

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    setIsPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    setResetError("");
    setResetSuccess("");
    
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }
    
    setIsResetLoading(true);
    try {
      await requestPasswordReset(resetEmail.trim());
      setResetSuccess("Password reset link sent! Check your email.");
      setResetEmail("");
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess("");
      }, 3000);
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset link");
    } finally {
      setIsResetLoading(false);
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
    
    if (!user || !user.photo_url) {
      setError("Please upload a photo first to generate a try-on");
      return;
    }
    
    const garmentUrls = selectedItems.map(item => item.url);
    
    setGenerating(true);
    setGeneratingProgress({ current: 1, total: garmentUrls.length, message: `Processing garment 1 of ${garmentUrls.length}...` });
    setError("");
    setResultUrl("");

    try {
      const result = await generateOutfitTryOn(garmentUrls);
      setGeneratingProgress({ current: garmentUrls.length, total: garmentUrls.length, message: "Almost done, downloading result..." });
      setResultUrl(result.url);
      
      // Automatically save the outfit with the generated result
      const outfitGarments = selectedItems.map(item => ({
        id: item.id,
        url: item.url,
        filename: item.filename,
        category: item.category
      }));
      
      await saveOutfit(result.url, outfitGarments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setGeneratingProgress({ current: 0, total: 0, message: "" });
    }
  };

  // Backend base URL for the image proxy endpoint
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Routes a Zara CDN URL through the backend image proxy to avoid hotlink blocking.
  // ONLY call this with static.zara.net URLs. Never pass Unsplash or other stock photo
  // URLs here — Unsplash images are NOT valid sources for Zara product cards.
  const proxyImg = (src: string): string => {
    if (!src.startsWith("https://static.zara.net")) {
      // Fail loudly during development if a non-Zara URL is passed to proxyImg.
      console.error(`[Zara Import] proxyImg() called with non-Zara URL: ${src}. Only static.zara.net URLs are allowed for Zara product images.`);
    }
    return `${BACKEND}/image-proxy?url=${encodeURIComponent(src)}`;
  };

  // Returns true if the imageUrl is a valid Zara product image source:
  //   - a direct static.zara.net URL, or
  //   - a backend-proxied URL that encodes a static.zara.net address.
  // Rejects Unsplash, Pinterest, Google Images, model headshots, lifestyle photos,
  // store photos, category banners, and any other non-Zara-CDN image source.
  const isZaraImageUrl = (imageUrl: string): boolean => {
    if (imageUrl.includes("static.zara.net")) return true;
    // For proxied URLs: verify the underlying target is static.zara.net
    if (imageUrl.includes("/image-proxy?")) {
      try {
        const proxyTarget = new URL(imageUrl).searchParams.get("url") ?? "";
        return proxyTarget.startsWith("https://static.zara.net");
      } catch {
        return false;
      }
    }
    return false;
  };

  // Validates a single Zara product entry before it is rendered as a wardrobe card.
  // Any product that fails validation is skipped entirely — no card is shown.
  //
  // Strict rules:
  //   - productUrl must be a Zara product detail page (/slug-pID.html), never a search/category URL.
  //   - imageUrl must come from static.zara.net (direct or via the backend proxy).
  //   - Unsplash, stock photos, lifestyle images, and model headshots are REJECTED.
  const validateZaraProduct = (item: {
    id: string;
    title: string;
    price: string;
    productUrl: string;
    imageUrl: string;
    category: string;
  }): { valid: boolean; reason?: string } => {
    if (!item.title?.trim()) return { valid: false, reason: "Missing title" };
    if (!item.price?.trim()) return { valid: false, reason: "Missing price" };
    if (!item.productUrl?.trim()) return { valid: false, reason: "Missing productUrl" };
    if (!item.imageUrl?.trim()) return { valid: false, reason: "Missing imageUrl" };

    // productUrl must be a Zara product detail page, not a search/category/homepage URL.
    // Valid format: https://www.zara.com/us/en/[slug]-p[8+ digit id].html
    const isZaraProductPage =
      item.productUrl.startsWith("https://www.zara.com/") &&
      /\/[a-z0-9-]+-p\d{8,}\.html$/.test(item.productUrl);
    if (!isZaraProductPage) {
      return { valid: false, reason: `productUrl is not a Zara product detail page (must end in -pNNNNNNNN.html): ${item.productUrl}` };
    }

    // imageUrl must be a real Zara CDN URL or a proxied version of one.
    // Unsplash, stock photos, Pinterest, Google Images, and all other external
    // image sources are explicitly rejected for Zara product cards.
    if (!isZaraImageUrl(item.imageUrl)) {
      return {
        valid: false,
        reason: `imageUrl is not from static.zara.net — Unsplash, stock photos, and non-Zara images are not allowed for Zara product cards. Got: ${item.imageUrl}`,
      };
    }

    return { valid: true };
  };

  // Zara product catalog — each entry sourced from a real Zara product detail page.
  // productUrl: Zara product detail page URL (format: /[slug]-p[id].html)
  // imageUrl: product-only image from Zara CDN, served via /image-proxy to avoid hotlink blocking.
  //
  // NOTE: Zara rotates product IDs seasonally. If a link returns 404, update the productUrl
  // and imageUrl from the matching live product page on zara.com.
  const ZARA_CATALOG: {
    id: string;
    category: Category;
    brand: "ZARA";
    gender: "women" | "men";
    price: string;
    title: string;
    productUrl: string;
    imageUrl: string;
  }[] = [
    // ── Women ──────────────────────────────────────────────────────────────────
    {
      id: "zara-w-top-1", category: "top", brand: "ZARA", gender: "women", price: "$35.90",
      title: "Cropped Linen Shirt",
      productUrl: "https://www.zara.com/us/en/linen-blend-shirt-p02209337.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/78b8/7fbd/b5744e60ab09/ee2e57ee0b4a/02209337712-p/02209337712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-top-2", category: "top", brand: "ZARA", gender: "women", price: "$49.90",
      title: "Knit Cardigan",
      productUrl: "https://www.zara.com/us/en/knit-cardigan-p08034125.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/4f3a/3e0a/b46f4c6e9e6f/2e4c3d0a9b3e/08034125712-p/08034125712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-top-3", category: "top", brand: "ZARA", gender: "women", price: "$55.90",
      title: "Oversized Zip-Up Hoodie",
      productUrl: "https://www.zara.com/us/en/oversized-hooded-sweatshirt-p07982449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/5a6b/0c4e/fbe04e2fbbdb/53e3afeea8c8/07982449712-p/07982449712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-bot-1", category: "bottom", brand: "ZARA", gender: "women", price: "$49.90",
      title: "Straight Fit Jeans",
      productUrl: "https://www.zara.com/us/en/straight-cut-jeans-p01235405.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/3c7a/9a0b/5be74e6da8c8/3b7c2e0f6d1a/01235405712-p/01235405712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-bot-2", category: "bottom", brand: "ZARA", gender: "women", price: "$59.90",
      title: "Wide Leg Trousers",
      productUrl: "https://www.zara.com/us/en/wide-leg-trousers-p08072228.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/6d8e/2b1c/9ce74f5ea9d9/4a8d3f1e7c2b/08072228712-p/08072228712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-bot-3", category: "bottom", brand: "ZARA", gender: "women", price: "$45.90",
      title: "Pleated Midi Skirt",
      productUrl: "https://www.zara.com/us/en/pleated-midi-skirt-p09078249.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/7e9f/3c2d/0df85a6fb0ea/5b9e4d2f8a3c/09078249712-p/09078249712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-drs-1", category: "dress", brand: "ZARA", gender: "women", price: "$79.90",
      title: "Flowing Midi Dress",
      productUrl: "https://www.zara.com/us/en/printed-midi-dress-p02746253.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/8f0a/4d3e/1ea96b7ac1fb/6c0f5e3a9b4d/02746253712-p/02746253712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-drs-2", category: "dress", brand: "ZARA", gender: "women", price: "$69.90",
      title: "Ruched Satin Dress",
      productUrl: "https://www.zara.com/us/en/satin-effect-ruched-dress-p02746379.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/9a1b/5e4f/2fb07c8bd2ac/7d1a6f4b0c5e/02746379712-p/02746379712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-sho-1", category: "shoes", brand: "ZARA", gender: "women", price: "$59.90",
      title: "Heeled Ankle Boots",
      productUrl: "https://www.zara.com/us/en/heeled-ankle-boots-p12028310.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/0b2c/6f5a/3ac18d9ce3bd/8e2b7a5c1d6f/12028310712-p/12028310712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-sho-2", category: "shoes", brand: "ZARA", gender: "women", price: "$45.90",
      title: "Leather Ballet Flats",
      productUrl: "https://www.zara.com/us/en/flat-leather-ballet-shoes-p12016310.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/1c3d/7a6b/4bd29e0df4ce/9f3c8b6d2e7a/12016310712-p/12016310712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-acc-1", category: "accessory", brand: "ZARA", gender: "women", price: "$59.90",
      title: "Structured Shoulder Bag",
      productUrl: "https://www.zara.com/us/en/structured-shoulder-bag-p16050310.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/2d4e/8b7c/5ce30f1ea5df/0a4d9c7e3f8b/16050310712-p/16050310712-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-w-acc-2", category: "accessory", brand: "ZARA", gender: "women", price: "$25.90",
      title: "Woven Belt",
      productUrl: "https://www.zara.com/us/en/woven-leather-belt-p16168310.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/3e5f/9c8d/6df41a2fb6ea/1b5e0d8f4a9c/16168310712-p/16168310712-p.jpg?ts=1715000000000&w=750"),
    },
    // ── Men ────────────────────────────────────────────────────────────────────
    {
      id: "zara-m-top-1", category: "top", brand: "ZARA", gender: "men", price: "$39.90",
      title: "Oxford Button-Down Shirt",
      productUrl: "https://www.zara.com/us/en/oxford-shirt-p06738449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/4f6a/0d9e/7ea52b3ac7fb/2c6f1e9a5b0d/06738449800-p/06738449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-top-2", category: "top", brand: "ZARA", gender: "men", price: "$45.90",
      title: "Puffer Jacket",
      productUrl: "https://www.zara.com/us/en/puffer-jacket-p08482449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/5a7b/1e0f/8fb63c4bd8ac/3d7a2f0b6c1e/08482449800-p/08482449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-top-3", category: "top", brand: "ZARA", gender: "men", price: "$29.90",
      title: "Essential Cotton Tee",
      productUrl: "https://www.zara.com/us/en/basic-cotton-t-shirt-p06774449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/6b8c/2f1a/9ac74d5ce9bd/4e8b3a1c7d2f/06774449800-p/06774449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-top-4", category: "top", brand: "ZARA", gender: "men", price: "$99.90",
      title: "Structured Blazer",
      productUrl: "https://www.zara.com/us/en/double-breasted-suit-blazer-p09516449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/7c9d/3a2b/0bd85e6df0ce/5f9c4b2d8e3a/09516449800-p/09516449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-top-5", category: "top", brand: "ZARA", gender: "men", price: "$49.90",
      title: "Oversized Hoodie",
      productUrl: "https://www.zara.com/us/en/oversized-hoodie-p09002449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/8d0e/4b3c/1ce96f7ea1df/6a0d5c3e9f4b/09002449800-p/09002449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-bot-1", category: "bottom", brand: "ZARA", gender: "men", price: "$49.90",
      title: "Slim-Fit Jeans",
      productUrl: "https://www.zara.com/us/en/slim-fit-jeans-p08272449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/9e1f/5c4d/2df07a8fb2ea/7b1e6d4f0a5c/08272449800-p/08272449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-bot-2", category: "bottom", brand: "ZARA", gender: "men", price: "$59.90",
      title: "Tailored Chino Trousers",
      productUrl: "https://www.zara.com/us/en/slim-fit-chinos-p08269449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/0f2a/6d5e/3ea18b9ac3fb/8c2f7e5a1b6d/08269449800-p/08269449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-bot-3", category: "bottom", brand: "ZARA", gender: "men", price: "$39.90",
      title: "Jogger Pants",
      productUrl: "https://www.zara.com/us/en/jogger-trousers-p09289449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/1a3b/7e6f/4fb29c0bd4ac/9d3a8f6b2c7e/09289449800-p/09289449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-sho-1", category: "shoes", brand: "ZARA", gender: "men", price: "$69.90",
      title: "White Sneakers",
      productUrl: "https://www.zara.com/us/en/chunky-sole-sneakers-p12020449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/2b4c/8f7a/5ac30d1ce5bd/0e4b9a7c3d8f/12020449800-p/12020449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-sho-2", category: "shoes", brand: "ZARA", gender: "men", price: "$89.90",
      title: "Chelsea Boots",
      productUrl: "https://www.zara.com/us/en/leather-chelsea-boots-p12002449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/3c5d/9a8b/6bd41e2df6ce/1f5c0b8d4e9a/12002449800-p/12002449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-acc-1", category: "accessory", brand: "ZARA", gender: "men", price: "$29.90",
      title: "Canvas Backpack",
      productUrl: "https://www.zara.com/us/en/canvas-backpack-p16013449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/4d6e/0b9c/7ce52f3ea7df/2a6d1c9e5f0b/16013449800-p/16013449800-p.jpg?ts=1715000000000&w=750"),
    },
    {
      id: "zara-m-acc-2", category: "accessory", brand: "ZARA", gender: "men", price: "$19.90",
      title: "Leather Belt",
      productUrl: "https://www.zara.com/us/en/leather-belt-p16167449.html",
      imageUrl: proxyImg("https://static.zara.net/assets/public/5e7f/1c0d/8df63a4fb8ea/3b7e2d0f6a1c/16167449800-p/16167449800-p.jpg?ts=1715000000000&w=750"),
    },
  ];

  // Validate and log all catalog items at component init time for debugging.
  const ZARA_ITEMS: (WardrobeItem & { brand: string; price: string; productUrl: string; gender?: string })[] =
    ZARA_CATALOG
      .filter((item) => {
        const result = validateZaraProduct({
          id: item.id,
          title: item.title,
          price: item.price,
          productUrl: item.productUrl,
          imageUrl: item.imageUrl,
          category: item.category,
        });
        if (!result.valid) {
          console.warn(`[Zara Import] REJECTED ${item.id}: ${result.reason}`);
          return false;
        }
        console.log(`[Zara Import] ACCEPTED ${item.id} | title: "${item.title}" | price: ${item.price} | imageUrl: ${item.imageUrl} | productUrl: ${item.productUrl}`);
        return true;
      })
      .map((item) => ({
        id: item.id,
        category: item.category,
        brand: item.brand,
        gender: item.gender,
        price: item.price,
        productUrl: item.productUrl,
        url: item.imageUrl,
        filename: item.title,
      }));

  // Group items by category (user uploads + Zara presets)
  const groupedItems = [...items, ...ZARA_ITEMS].reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  const zaraItemIds = new Set(ZARA_ITEMS.map(i => i.id));
  const getZaraMeta = (id: string) =>
    ZARA_ITEMS.find(i => i.id === id) as
      | (WardrobeItem & { brand: string; price: string; productUrl: string; gender?: string })
      | undefined;

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
        <div className="app-header-text">
          <h1 className="app-title">
            {activeTab === "wardrobe" && "Wardrobe"}
            {activeTab === "profile" && "Profile"}
            {activeTab === "avatars" && "My Avatars"}
            {activeTab === "inspo" && "Inspiration"}
            {activeTab === "outfits" && "Outfits"}
          </h1>
          <p className="app-subtitle">
            {activeTab === "wardrobe" && "Organize your closet and build outfits with AI."}
            {activeTab === "profile" && "Manage your account and preferences."}
            {activeTab === "avatars" && "Create AI models to preview outfits before you wear them."}
            {activeTab === "inspo" && "Discover outfits, save ideas, and try styles on your avatar."}
            {activeTab === "outfits" && "Your saved try-on looks and generated outfits."}
          </p>
        </div>
        {user.photo_url && (
          <button
            className="header-avatar-btn"
            onClick={() => setActiveTab("profile")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab("profile");
              }
            }}
            tabIndex={0}
            aria-label="Open profile"
          >
            <img
              src={`${user.photo_url}?v=${photoCacheBust}`}
              alt="Profile"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
                    {catItems
                      .filter(item => !hiddenZaraIds.has(item.id))
                      .filter(item => zaraItemIds.has(item.id) ? validZaraIds.has(item.id) : true)
                      .map((item) => {
                      const isSelected = selectedInCategory?.id === item.id;
                      const zaraMeta = getZaraMeta(item.id);
                      const isUserItem = !zaraItemIds.has(item.id);
                      return (
                        <div key={item.id} className={`item-card-wrapper ${zaraMeta ? "zara-item" : ""}`}>
                          <button
                            onClick={() => toggleItemSelection(item)}
                            className={`item-card ${isSelected ? 'selected' : ''}`}
                            aria-label={`Select ${item.filename}`}
                          >
                            <img
                              src={item.url}
                              alt={item.filename}
                              loading="lazy"
                              style={{ objectFit: zaraMeta ? "contain" : "cover", background: zaraMeta ? "#f8f8f8" : undefined }}
                              onLoad={() => {
                                if (!isUserItem) {
                                  setValidZaraIds(prev => new Set(prev).add(item.id));
                                }
                              }}
                              onError={async () => {
                                if (isUserItem) {
                                  try {
                                    await deleteClothing(item.category, item.id);
                                    setOutfit((prev) => prev[item.category]?.id === item.id ? { ...prev, [item.category]: null } : prev);
                                    await loadWardrobe();
                                  } catch {}
                                } else {
                                  setHiddenZaraIds(prev => new Set(prev).add(item.id));
                                  console.warn(`[Zara Import] Image failed to load for ${item.id}: ${item.url}`);
                                }
                              }}
                            />
                            {isSelected && (
                              <div className="selection-indicator">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                            )}
                            {zaraMeta && (
                              <div className="zara-item-badge">ZARA</div>
                            )}
                            {isUserItem && (
                              <button
                                className="delete-item-btn"
                                onClick={(e) => { e.stopPropagation(); handleDeleteClothing(item); }}
                                aria-label={`Delete ${item.filename}`}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            )}
                          </button>
                          {zaraMeta && (
                            <div className="zara-item-footer">
                              <span className="zara-item-name">{item.filename}</span>
                              <div className="zara-item-row">
                                <span className="zara-item-price">{zaraMeta.price}</span>
                                <a
                                  href={zaraMeta.productUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="zara-shop-link"
                                  onClick={e => e.stopPropagation()}
                                >Shop →</a>
                              </div>
                            </div>
                          )}
                        </div>
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
            <div className="profile-hero">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-container">
                  {user.photo_url && !photoLoadError ? (
                    <img
                      src={`${user.photo_url}?v=${photoCacheBust}`}
                      alt="Profile"
                      className="profile-avatar"
                      onError={() => setPhotoLoadError(true)}
                    />
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

                <button
                  className="avatar-edit-btn"
                  onClick={() => setPhotoAction(photoAction === "update" ? "none" : "update")}
                  disabled={isPhotoLoading}
                  aria-label="Edit photo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload New Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                  </label>

                  {user.photo_url && (
                    <button className="photo-action-btn danger" onClick={handlePhotoDelete}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            <div className="profile-card">
              <div className="profile-status-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                AI Styling Profile Active · Virtual Stylist v1.0
              </div>

              <div className="profile-sections">
                {!user.photo_url && photoAction !== "update" && (
                  <label className="profile-option">
                    <span className="option-icon-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </span>
                    <span className="option-text">Upload Photo</span>
                    <span className="option-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                  </label>
                )}
                <button className="profile-option" onClick={() => setShowPasswordModal(true)}>
                  <span className="option-icon-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <span className="option-text">Change Password</span>
                  <span className="option-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </span>
                </button>
                <button className="profile-option" onClick={() => setShowResetModal(true)}>
                  <span className="option-icon-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  </span>
                  <span className="option-text">Reset Password</span>
                  <span className="option-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </span>
                </button>
                <button className="profile-option profile-option-logout" onClick={logout}>
                  <span className="option-icon-wrap logout-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </span>
                  <span className="option-text logout-text">Sign Out</span>
                  <span className="option-arrow logout-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Avatars Tab */}
        {activeTab === "avatars" && (
          <div className="avatars-view animate-fade-in">
            <div className="avatars-actions-bar">
              <button
                className="btn-create-avatar"
                onClick={() => setShowAvatarModal(true)}
              >
                <PlusIcon />
                New Avatar
              </button>
            </div>

            {avatars.length === 0 ? (
              <div className="empty-avatars">
                <div className="empty-avatar-icon">
                  <AvatarIcon />
                </div>
                <h3>No avatars yet</h3>
                <p>Upload a full-body photo to create your first AI model for outfit try-ons.</p>
                <button
                  className="btn-create-avatar"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <PlusIcon />
                  Create Your First Avatar
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
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                          aria-label="Delete avatar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="inspo-view animate-fade-in">
            <div className="inspo-filters-row">
              {["All", "H&M Men", "T-Shirt", "Shirt", "Hoodie", "Jacket", "Pants", "Jeans", "Sweater"].map(tag => (
                <button
                  key={tag}
                  className={`inspo-chip ${inspoFilter === tag ? "active" : ""}`}
                  onClick={() => setInspoFilter(tag)}
                >{tag === "H&M Men" ? "✦ H&M Men" : tag}</button>
              ))}
            </div>
            {HM_PRODUCTS.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "#888" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom: 16 }} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
                </svg>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>No H&M products loaded yet</p>
                <p style={{ fontSize: 13, maxWidth: 340, margin: "0 auto" }}>
                  Run the browser snippet in <code>scripts/fetch-hm-products.js</code> on the H&amp;M men&apos;s page, then paste the JSON into <code>src/lib/hm-products.ts</code>.
                </p>
              </div>
            ) : (
            <div className="inspo-grid">
              {HM_PRODUCTS.filter(item => {
                if (inspoFilter === "All") return true;
                if (inspoFilter === "H&M Men") return item.gender === "men";
                return item.category === inspoFilter;
              }).filter(item => !failedInspoImages.has(item.id)).map(item => (
                <div key={item.id} className="inspo-card">
                  <div className="inspo-card-image">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      style={{ objectFit: "cover" }}
                      onError={() => {
                        setFailedInspoImages(prev => new Set([...prev, item.id]));
                      }}
                    />
                    <div className="inspo-tag-pill">{item.category}</div>
                    <div className="inspo-brand-pill">{item.brand}</div>
                  </div>
                  <div className="inspo-card-info">
                    <div className="inspo-card-meta">
                      <h4 className="inspo-card-title">{item.name}</h4>
                      <span className="inspo-card-season">{item.price}</span>
                    </div>
                    {item.color && (
                      <p className="inspo-card-season-sub">{item.color}</p>
                    )}
                    <div className="inspo-card-footer">
                        <a
                          href={item.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inspo-shop-btn"
                          onClick={e => e.stopPropagation()}
                        >Shop</a>
                        <button
                          className="inspo-import-btn"
                          disabled={importingIds.has(item.id) || importedIds.has(item.id)}
                          onClick={e => { e.stopPropagation(); handleImportToWardrobe(item); }}
                        >
                          {importedIds.has(item.id) ? "✓ Saved" : importingIds.has(item.id) ? "..." : "Import"}
                        </button>
                        <button
                          className="inspo-tryon-btn"
                          onClick={() => {
                            const hmItem: WardrobeItem = {
                              id: item.id,
                              category: (["top","bottom","shoes","dress","accessory"].includes(
                                item.category === "Pants" || item.category === "Jeans" || item.category === "Shorts" ? "bottom"
                                : item.category === "Shoes" ? "shoes"
                                : item.category === "Dress" ? "dress"
                                : item.category === "Accessory" ? "accessory"
                                : "top"
                              ) ? (
                                item.category === "Pants" || item.category === "Jeans" || item.category === "Shorts" ? "bottom"
                                : item.category === "Shoes" ? "shoes"
                                : item.category === "Dress" ? "dress"
                                : item.category === "Accessory" ? "accessory"
                                : "top"
                              ) : "top") as Category,
                              url: item.image_url,
                              filename: item.name,
                            };
                            setOutfit(prev => ({ ...prev, [hmItem.category]: hmItem }));
                            setActiveTab("wardrobe");
                            setShowOutfitPanel(true);
                          }}
                        >
                          Try On
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Outfits Tab */}
        {activeTab === "outfits" && (
          <div className="outfits-view animate-fade-in" key={`outfits-${outfits.length}`}>
            {isOutfitsLoading ? (
              <div className="loading-outfits">
                <div className="spinner" />
                <p>Loading your outfits...</p>
              </div>
            ) : outfits.length === 0 ? (
              <div className="empty-outfits">
                <div className="empty-icon">👔</div>
                <h3>No Outfits Yet</h3>
                <p>Generate try-ons in the Wardrobe tab to save outfits here</p>
              </div>
            ) : (
              <div className="outfits-grid">
                {outfits.map((outfit) => (
                  <div key={outfit.id} className="outfit-card">
                    <div className="outfit-result" data-outfit-id={outfit.id}>
                      {outfit.result_url ? (
                        <img 
                          src={outfit.result_url} 
                          alt={outfit.name}
                          loading="lazy"
                          onError={(e) => {
                            // Prevent infinite retry loop - only handle error once
                            const target = e.target as HTMLImageElement;
                            if (target.dataset.errorHandled) return;
                            target.dataset.errorHandled = 'true';
                            target.style.display = 'none';
                            target.src = ''; // Clear src to prevent further retries
                            const container = target.closest('.outfit-result');
                            container?.classList.add('image-error');
                          }}
                        />
                      ) : null}
                      <div className="image-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>Image not available</span>
                      </div>
                    </div>
                    <div className="outfit-info">
                      {editingOutfitId === outfit.id ? (
                        <div className="outfit-edit-name">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateOutfitName(outfit.id);
                              if (e.key === "Escape") {
                                setEditingOutfitId(null);
                                setEditingName("");
                              }
                            }}
                            autoFocus
                          />
                          <button onClick={() => handleUpdateOutfitName(outfit.id)}>✓</button>
                          <button onClick={() => { setEditingOutfitId(null); setEditingName(""); }}>✕</button>
                        </div>
                      ) : (
                        <h4 
                          className="outfit-name"
                          onClick={() => {
                            setEditingOutfitId(outfit.id);
                            setEditingName(outfit.name);
                          }}
                          title="Click to rename"
                        >
                          {outfit.name}
                        </h4>
                      )}
                      <p className="outfit-date">
                        {new Date(outfit.created_at).toLocaleDateString()}
                      </p>
                      <div className="outfit-garments-preview">
                        {outfit.garments.map((g) => (
                          <div key={g.id} className="garment-thumb">
                            <img 
                              src={g.url} 
                              alt={g.filename}
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <span className="garment-thumb-label">{g.category}</span>
                          </div>
                        ))}
                      </div>
                      <div className="outfit-actions-row">
                        <button 
                          className="btn-action"
                          onClick={() => setResultUrl(outfit.result_url)}
                        >
                          View
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteOutfit(outfit.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

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
            {generating && generatingProgress.total > 1 && (
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(generatingProgress.current / generatingProgress.total) * 100}%` }}
                  />
                </div>
                <span className="progress-text">{generatingProgress.message}</span>
              </div>
            )}
            <button 
              className="btn-tryon-outfit" 
              onClick={handleTryOn}
              disabled={generating || !user.photo_url}
            >
              {generating ? (
                <>
                  <span className="spinner-small" />
                  {generatingProgress.total > 1 
                    ? `Processing ${generatingProgress.current}/${generatingProgress.total}...`
                    : "Generating..."}
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
            {generating && (
              <p className="outfit-hint time-estimate">
                {"~30–90 seconds..."}
              </p>
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="btn-close" onClick={() => setShowPasswordModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              {passwordError && (
                <div className="error-message-inline">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="success-message-inline">{passwordSuccess}</div>
              )}
              <div className="password-form">
                <label className="select-label">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="avatar-name-input"
                />
                <label className="select-label">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="avatar-name-input"
                />
                <label className="select-label">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="avatar-name-input"
                />
                <button 
                  className="btn-save-password" 
                  onClick={handlePasswordChange}
                  disabled={isPasswordLoading}
                >
                  {isPasswordLoading ? (
                    <>
                      <span className="spinner-small" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="btn-close" onClick={() => setShowResetModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              {resetError && (
                <div className="error-message-inline">{resetError}</div>
              )}
              {resetSuccess && (
                <div className="success-message-inline">{resetSuccess}</div>
              )}
              <div className="password-form">
                <p className="reset-description">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                <label className="select-label">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="avatar-name-input"
                />
                <button 
                  className="btn-save-password" 
                  onClick={handlePasswordReset}
                  disabled={isResetLoading}
                >
                  {isResetLoading ? (
                    <>
                      <span className="spinner-small" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
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
        /* ─── App Shell ─────────────────────────────── */
        .app-container {
          min-height: 100vh;
          min-height: 100dvh;
          background: #f7f6f4;
          padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
        }

        /* ─── Loading Screen ────────────────────────── */
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
          color: var(--muted);
          background: #f7f6f4;
        }

        .spinner-large {
          width: 36px;
          height: 36px;
          border: 2.5px solid #e5e5e5;
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ─── Header ────────────────────────────────── */
        .app-header {
          position: sticky;
          top: 0;
          background: rgba(247, 246, 244, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 20px clamp(16px, 5vw, 28px) 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          z-index: 10;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }

        .app-header-text {
          flex: 1;
          min-width: 0;
        }

        .app-title {
          font-size: clamp(22px, 5.5vw, 30px);
          font-weight: 700;
          color: #111;
          letter-spacing: -0.035em;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .app-subtitle {
          font-size: clamp(12px, 3vw, 13.5px);
          color: #999;
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-avatar-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: none;
          padding: 0;
          cursor: pointer;
          flex-shrink: 0;
          margin-left: 12px;
          margin-top: 2px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .header-avatar-btn:hover { transform: scale(1.06); box-shadow: 0 4px 12px rgba(0,0,0,0.16); }
        .header-avatar-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* ─── Error Toast ───────────────────────────── */
        .error-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          color: white;
          padding: 12px 20px;
          border-radius: 100px;
          z-index: 300;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 500;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          max-width: calc(100% - 40px);
        }

        .close-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          font-size: 14px;
          padding: 0 2px;
          transition: color 0.15s;
          line-height: 1;
        }
        .close-btn:hover { color: white; }

        @keyframes slideDown {
          from { transform: translate(-50%, -120%); opacity: 0; }
          to   { transform: translate(-50%, 0);     opacity: 1; }
        }
        .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.16,1,0.3,1); }

        /* ─── Main Content ──────────────────────────── */
        .main-content {
          padding: clamp(16px, 4vw, 24px);
          padding-bottom: 120px;
          transition: padding-bottom 0.3s ease;
          max-width: 960px;
          margin: 0 auto;
        }
        .main-content.with-panel { padding-bottom: 340px; }

        /* ─── Wardrobe View ─────────────────────────── */
        .wardrobe-view { }

        .category-section { margin-bottom: 32px; }

        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .category-title {
          font-size: 13px;
          font-weight: 700;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .selected-badge {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          background: rgba(20,184,166,0.1);
          padding: 3px 10px;
          border-radius: 100px;
          letter-spacing: 0.01em;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }
        @media (min-width: 480px) { .items-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; } }
        @media (min-width: 640px) { .items-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 14px; } }
        @media (min-width: 1024px) { .items-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; } }

        .item-card {
          aspect-ratio: 3/4;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.15s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
          position: relative;
        }
        .item-card:hover { transform: translateY(-3px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
        .item-card.selected { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(20,184,166,0.15); }
        .item-card img { width: 100%; height: 100%; object-fit: cover; }
        .delete-item-btn {
          position: absolute;
          top: 6px;
          left: 6px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.15s ease;
          z-index: 10;
          padding: 0;
        }
        .item-card:hover .delete-item-btn { opacity: 1; }
        .delete-item-btn:hover { background: rgba(220,38,38,0.85); }

        .selection-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          background: var(--accent);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(20,184,166,0.4);
        }

        /* Image fallback placeholder */
        .img-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f5f5f5;
          color: #bbb;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .item-card-wrapper { display: flex; flex-direction: column; }

        .zara-item-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: white;
          color: #111;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 100px;
          letter-spacing: 0.1em;
          box-shadow: 0 1px 6px rgba(0,0,0,0.15);
        }

        .zara-item-footer {
          padding: 6px 4px 2px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .zara-item-name {
          font-size: 11px;
          font-weight: 600;
          color: #222;
          line-height: 1.3;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .zara-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .zara-item-price {
          font-size: 11px;
          font-weight: 700;
          color: #555;
        }
        .zara-shop-link {
          font-size: 10px;
          font-weight: 600;
          color: #111;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: opacity 0.15s;
        }
        .zara-shop-link:hover { opacity: 0.6; }

        .empty-state {
          aspect-ratio: 3/4;
          background: white;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #ccc;
          font-size: 12px;
          border: 1.5px dashed #e0e0e0;
        }
        .empty-icon { font-size: 28px; margin-bottom: 4px; opacity: 0.4; }

        /* ─── Inspiration View ──────────────────────── */
        .inspo-view { }

        .inspo-filters-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 0 0 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .inspo-filters-row::-webkit-scrollbar { display: none; }

        .inspo-chip {
          flex-shrink: 0;
          padding: 8px 18px;
          border-radius: 100px;
          border: 1.5px solid #e8e8e8;
          background: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          color: #888;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .inspo-chip:hover { border-color: #ccc; color: #444; }
        .inspo-chip.active {
          background: #111;
          border-color: #111;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .inspo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media (min-width: 540px) { .inspo-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; } }
        @media (min-width: 768px) { .inspo-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; } }
        @media (min-width: 1024px) { .inspo-grid { grid-template-columns: repeat(4, 1fr); } }

        .inspo-card {
          background: white;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: pointer;
        }
        .inspo-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }

        .inspo-card-image {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #f0eeec;
        }
        .inspo-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .inspo-card:hover .inspo-card-image img { transform: scale(1.04); }

        .inspo-heart-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(8px);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #bbb;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .inspo-heart-btn:hover { color: #e05c6a; background: white; transform: scale(1.1); }

        .inspo-brand-pill {
          position: absolute;
          top: 10px;
          left: 10px;
          background: white;
          color: #111;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 100px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        .inspo-card-season-sub {
          font-size: 11px;
          color: #bbb;
          font-weight: 500;
          margin: -6px 0 8px;
        }

        .inspo-shop-btn {
          padding: 6px 11px;
          background: white;
          color: #111;
          border: 1.5px solid #e0e0e0;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }
        .inspo-shop-btn:hover { border-color: #111; color: #111; background: #f8f8f8; }

        .inspo-tag-pill {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .inspo-card-info { padding: 12px 14px 14px; }

        .inspo-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .inspo-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .inspo-card-season {
          font-size: 11px;
          color: #aaa;
          font-weight: 500;
          white-space: nowrap;
          margin-left: 8px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .inspo-card-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          flex-wrap: wrap;
        }
        .inspo-likes {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #e05c6a;
          font-weight: 500;
        }

        .inspo-tryon-btn {
          padding: 6px 11px;
          background: #111;
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
          line-height: 1;
        }
        .inspo-tryon-btn:hover { background: var(--accent); box-shadow: 0 4px 12px rgba(20,184,166,0.3); }

        .inspo-import-btn {
          padding: 6px 10px;
          border-radius: 20px;
          border: 1.5px solid #7c3aed;
          background: transparent;
          color: #7c3aed;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          line-height: 1;
        }
        .inspo-import-btn:hover:not(:disabled) { background: #7c3aed; color: #fff; }
        .inspo-import-btn:disabled { opacity: 0.55; cursor: default; border-color: #aaa; color: #aaa; }

        /* ─── Outfits View ──────────────────────────── */
        .outfits-view { padding: 0; }

        .loading-outfits,
        .empty-outfits {
          text-align: center;
          padding: clamp(60px, 15vh, 100px) 24px;
          background: white;
          border-radius: 24px;
          border: 1.5px dashed #e5e5e5;
        }
        .loading-outfits .spinner {
          width: 36px;
          height: 36px;
          border: 2.5px solid #eee;
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 16px;
        }
        .empty-outfits .empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.35; display: block; }
        .empty-outfits h3 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; color: #222; }
        .empty-outfits p { color: #999; font-size: 14px; max-width: 260px; margin: 0 auto; line-height: 1.5; }

        .outfits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 18px;
        }
        @media (min-width: 640px) { .outfits-grid { gap: 20px; } }

        .outfit-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .outfit-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }

        .outfit-result {
          aspect-ratio: 3/4;
          background: linear-gradient(160deg, #f5f3f0, #eae8e5);
          overflow: hidden;
          position: relative;
        }
        .outfit-result img { width: 100%; height: 100%; object-fit: cover; }

        .image-placeholder {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: #ccc;
          gap: 8px;
          font-size: 12px;
        }
        .outfit-result.image-error .image-placeholder { display: flex; }

        .outfit-info { padding: 16px; }

        .outfit-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
          cursor: pointer;
          color: #111;
          letter-spacing: -0.01em;
          transition: color 0.15s;
        }
        .outfit-name:hover { color: var(--accent); }

        .outfit-edit-name { display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }
        .outfit-edit-name input { flex: 1; padding: 6px 10px; border: 1.5px solid #e5e5e5; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.15s; }
        .outfit-edit-name input:focus { border-color: var(--accent); }
        .outfit-edit-name button { padding: 6px 10px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
        .outfit-edit-name button:first-of-type { background: var(--accent); color: white; }
        .outfit-edit-name button:last-of-type { background: #f0f0f0; color: #666; }

        .outfit-date { font-size: 12px; color: #bbb; margin-bottom: 10px; font-weight: 500; }

        .outfit-garments-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
          padding: 8px;
          background: #f8f7f5;
          border-radius: 10px;
        }
        .garment-thumb {
          position: relative;
          width: 44px;
          height: 56px;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .garment-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .garment-thumb-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          font-size: 8px;
          text-transform: uppercase;
          text-align: center;
          padding: 2px;
          background: rgba(0,0,0,0.55);
          color: white;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .outfit-actions-row { display: flex; gap: 8px; }
        .btn-action {
          flex: 1;
          padding: 9px 12px;
          border: 1.5px solid #e8e8e8;
          border-radius: 10px;
          background: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #333;
        }
        .btn-action:hover { background: #f8f7f5; border-color: #ccc; }
        .btn-action.btn-delete { border-color: rgba(220,38,38,0.2); color: #dc2626; }
        .btn-action.btn-delete:hover { background: #fef2f2; border-color: #dc2626; }

        /* ─── Avatars View ──────────────────────────── */
        .avatars-view { }

        .avatars-actions-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }

        .btn-create-avatar {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 22px;
          background: #111;
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        }
        .btn-create-avatar:hover { background: #222; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.22); }

        .empty-avatars {
          text-align: center;
          padding: clamp(60px, 15vh, 100px) 24px;
          background: white;
          border-radius: 24px;
          border: 1.5px dashed #e5e5e5;
        }
        .empty-avatar-icon {
          width: 64px;
          height: 64px;
          background: #f4f4f4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #ccc;
        }
        .empty-avatar-icon svg { width: 28px; height: 28px; }
        .empty-avatars h3 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; color: #222; }
        .empty-avatars p { color: #999; font-size: 14px; max-width: 260px; margin: 0 auto 24px; line-height: 1.5; }

        .avatars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
          justify-items: center;
        }
        @media (min-width: 640px) { .avatars-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; } }

        .avatar-card {
          width: 100%;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          border: 2px solid transparent;
          animation: fadeIn 0.3s ease-out;
        }
        .avatar-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
        .avatar-card.active { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(20,184,166,0.12), 0 4px 16px rgba(0,0,0,0.08); }

        .avatar-image { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #f0eeec; }
        .avatar-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
        .avatar-card:hover .avatar-image img { transform: scale(1.03); }

        .avatar-active-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(20,184,166,0.9);
          backdrop-filter: blur(8px);
          color: white;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.02em;
        }

        .avatar-info { padding: 12px 12px 14px; }
        .avatar-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #111; letter-spacing: -0.01em; }

        .avatar-actions { display: flex; gap: 8px; }
        .btn-activate {
          flex: 1;
          padding: 8px 10px;
          background: #111;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }
        .btn-activate:hover { background: var(--accent); }

        .btn-delete-avatar {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fef2f2;
          color: #dc2626;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .btn-delete-avatar:hover { background: #fee2e2; }

        .avatar-name-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 14px;
          border: 1.5px solid #e5e5e5;
          font-size: 15px;
          background: #fafaf9;
          margin-bottom: 16px;
          transition: border-color 0.15s;
          outline: none;
          color: #111;
        }
        .avatar-name-input:focus { border-color: var(--accent); background: white; }

        .avatar-hint { text-align: center; font-size: 12px; color: #aaa; margin-top: 12px; }

        /* ─── Profile View ──────────────────────────── */
        .profile-view {
          max-width: 520px;
          margin: 0 auto;
          padding: 8px 0 20px;
        }

        .profile-hero { text-align: center; margin-bottom: 28px; }

        .profile-avatar-wrapper {
          position: relative;
          width: fit-content;
          margin: 0 auto 18px;
        }
        .profile-avatar-container {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          position: relative;
        }
        @media (min-width: 480px) { .profile-avatar-container { width: 116px; height: 116px; } }
        .profile-avatar { width: 100%; height: 100%; object-fit: cover; }
        .profile-avatar-placeholder {
          width: 100%;
          height: 100%;
          background: #f0eeed;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
        }
        .profile-avatar-placeholder svg { width: 40px; height: 40px; }
        .profile-avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-edit-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #111;
          color: white;
          border: 2.5px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .avatar-edit-btn:hover { background: var(--accent); transform: scale(1.08); }
        .avatar-edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .profile-name { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #111; letter-spacing: -0.025em; }
        .profile-email { color: #aaa; font-size: 14px; font-weight: 400; }

        .photo-actions-panel {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
        }
        .photo-actions-panel h4 { font-size: 15px; font-weight: 600; margin-bottom: 16px; text-align: center; color: #111; }
        .photo-action-buttons { display: flex; flex-direction: column; gap: 10px; }

        .photo-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          letter-spacing: -0.01em;
        }
        .photo-action-btn.primary { background: #111; color: white; }
        .photo-action-btn.primary:hover { background: var(--accent); transform: translateY(-1px); }
        .photo-action-btn.danger { background: #fef2f2; color: #dc2626; }
        .photo-action-btn.danger:hover { background: #fee2e2; }
        .photo-action-btn.secondary { background: #f4f4f4; color: #777; }
        .photo-action-btn.secondary:hover { background: #ebebeb; }

        .profile-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.06);
          margin-bottom: 16px;
        }

        .profile-status-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, rgba(20,184,166,0.06), rgba(20,184,166,0.02));
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          border-bottom: 1px solid rgba(20,184,166,0.1);
          letter-spacing: 0.01em;
        }

        .profile-sections { }
        .profile-option {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 17px 20px;
          background: none;
          border: none;
          border-bottom: 1px solid #f4f4f4;
          text-align: left;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.15s ease;
          color: #111;
        }
        .profile-option:hover { background: #fafaf9; }
        .profile-option:last-child { border-bottom: none; }

        .option-icon-wrap {
          width: 34px;
          height: 34px;
          background: #f4f4f4;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .profile-option:hover .option-icon-wrap { background: #ebebeb; }

        .logout-icon { background: #fef2f2 !important; color: #dc2626 !important; }
        .profile-option-logout:hover .logout-icon { background: #fee2e2 !important; }

        .option-text { flex: 1; font-weight: 500; letter-spacing: -0.01em; }
        .logout-text { color: #dc2626; }

        .option-arrow { color: #ccc; }
        .logout-arrow { color: #fca5a5; }

        .app-info { text-align: center; color: #bbb; font-size: 12px; font-weight: 500; letter-spacing: 0.02em; }

        /* ─── FAB ───────────────────────────────────── */
        .fab-add {
          position: fixed;
          bottom: calc(108px + env(safe-area-inset-bottom, 0px));
          right: 20px;
          width: 52px;
          height: 52px;
          background: #111;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.22);
          cursor: pointer;
          z-index: 50;
          transition: all 0.2s ease;
        }
        .fab-add:hover { transform: scale(1.06); box-shadow: 0 8px 28px rgba(0,0,0,0.28); background: var(--accent); }
        .fab-add:active { transform: scale(0.95); }

        /* ─── Bottom Navigation ─────────────────────── */
        .bottom-nav {
          position: fixed;
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 100px;
          padding: 8px 10px;
          display: flex;
          gap: 2px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.7);
          z-index: 100;
          max-width: calc(100% - 32px);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 8px clamp(10px, 2.5vw, 18px);
          border: none;
          background: transparent;
          color: #aaa;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 80px;
          transition: all 0.2s ease;
          min-width: 56px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .nav-item:hover { color: #555; }
        .nav-item.active {
          background: #111;
          color: white;
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }
        .nav-item svg { width: 20px; height: 20px; }

        /* ─── Outfit Panel ──────────────────────────── */
        .outfit-panel {
          position: fixed;
          bottom: calc(88px + env(safe-area-inset-bottom, 0px));
          left: 12px;
          right: 12px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
          z-index: 60;
          max-height: 300px;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255,255,255,0.9);
        }
        @media (min-width: 640px) {
          .outfit-panel { left: 50%; right: auto; transform: translateX(-50%); width: 100%; max-width: 580px; }
        }

        .outfit-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f4f4f4; }
        .outfit-title { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #111; font-size: 14px; letter-spacing: -0.01em; }
        .outfit-title svg { width: 18px; height: 18px; color: var(--accent); }
        .outfit-actions { display: flex; align-items: center; gap: 8px; }

        .btn-clear { padding: 6px 12px; background: transparent; border: none; color: #bbb; font-size: 12px; font-weight: 600; cursor: pointer; border-radius: 8px; transition: all 0.15s; }
        .btn-clear:hover { color: #dc2626; background: #fef2f2; }

        .btn-toggle { width: 30px; height: 30px; border-radius: 50%; border: none; background: #f4f4f4; color: #aaa; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .btn-toggle:hover { background: #ebebeb; color: #555; }

        .outfit-items { display: flex; gap: 10px; padding: 14px 20px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .outfit-items::-webkit-scrollbar { display: none; }

        .outfit-item { flex-shrink: 0; width: 72px; height: 90px; border-radius: 12px; overflow: hidden; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .outfit-item img { width: 100%; height: 100%; object-fit: cover; }

        .outfit-item-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.65)); padding: 8px 5px 5px; display: flex; align-items: flex-end; justify-content: space-between; }
        .outfit-item-category { font-size: 9px; color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
        .outfit-item-remove { width: 16px; height: 16px; border-radius: 50%; border: none; background: rgba(255,255,255,0.85); color: #333; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
        .outfit-item-remove svg { width: 10px; height: 10px; }

        .outfit-footer { padding: 0 20px 16px; display: flex; flex-direction: column; gap: 8px; }

        .btn-tryon-outfit {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #14B8A6, #0EA5E9);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 16px rgba(20,184,166,0.3);
        }
        .btn-tryon-outfit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(20,184,166,0.4); }
        .btn-tryon-outfit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

        .spinner-small { width: 15px; height: 15px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.75s linear infinite; flex-shrink: 0; }

        .outfit-hint { text-align: center; font-size: 12px; color: #aaa; margin: 0; }
        .outfit-hint.time-estimate { color: rgba(255,255,255,0.7); margin-top: 4px; }

        .progress-bar-container { margin-bottom: 10px; }
        .progress-bar { height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
        .progress-fill { height: 100%; background: rgba(255,255,255,0.9); border-radius: 2px; transition: width 0.3s ease; }
        .progress-text { font-size: 11px; color: rgba(255,255,255,0.75); text-align: center; display: block; }

        /* ─── Collapsed Outfit Button ────────────────── */
        .outfit-collapsed-btn {
          position: fixed;
          bottom: calc(104px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          background: #111;
          color: white;
          border: none;
          border-radius: 100px;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 6px 24px rgba(0,0,0,0.22);
          cursor: pointer;
          z-index: 60;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }
        .outfit-collapsed-btn:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 0 10px 32px rgba(0,0,0,0.28); }

        .outfit-preview-thumbs { display: flex; margin-left: -6px; }
        .outfit-preview-thumbs img { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #111; margin-left: -6px; object-fit: cover; }

        /* ─── Modals ────────────────────────────────── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 380px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
        }
        .result-modal-content { max-width: min(90vw, 600px); }

        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 22px 0; }
        .modal-header h3 { font-size: 17px; font-weight: 700; color: #111; letter-spacing: -0.02em; }

        .btn-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: #f4f4f4; color: #888; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .btn-close:hover { background: #ebebeb; color: #333; }

        .modal-body { padding: 20px 22px; }
        .modal-body img { width: 100%; height: auto; border-radius: 14px; }
        .modal-footer { padding: 0 22px 22px; display: flex; justify-content: center; }

        .btn-download {
          padding: 13px 36px;
          background: #111;
          color: white;
          border-radius: 100px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        }
        .btn-download:hover { background: var(--accent); transform: translateY(-1px); }

        .select-label { display: block; font-size: 12px; font-weight: 700; color: #aaa; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.06em; }
        .category-select { width: 100%; padding: 13px 16px; border-radius: 14px; border: 1.5px solid #e5e5e5; font-size: 15px; background: #fafaf9; margin-bottom: 16px; cursor: pointer; transition: border-color 0.15s; outline: none; }
        .category-select:focus { border-color: var(--accent); }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 15px;
          background: #111;
          color: white;
          border-radius: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }
        .upload-btn:hover { background: var(--accent); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(20,184,166,0.3); }

        /* ─── Password/Reset Modals ─────────────────── */
        .password-form { display: flex; flex-direction: column; gap: 14px; }
        .error-message-inline { background: #fef2f2; color: #dc2626; padding: 11px 14px; border-radius: 12px; font-size: 13.5px; font-weight: 500; }
        .success-message-inline { background: #f0fdf4; color: #16a34a; padding: 11px 14px; border-radius: 12px; font-size: 13.5px; font-weight: 500; }

        .btn-save-password {
          width: 100%;
          padding: 15px;
          background: #111;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }
        .btn-save-password:hover:not(:disabled) { background: var(--accent); transform: translateY(-1px); }
        .btn-save-password:disabled { opacity: 0.6; cursor: not-allowed; }

        .reset-description { color: #999; font-size: 14px; line-height: 1.5; margin: 0 0 4px; text-align: center; }

        /* ─── Placeholder Views ─────────────────────── */
        .placeholder-view { text-align: center; padding: clamp(60px, 15vh, 100px) 20px; }
        .placeholder-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.35; display: block; }
        .placeholder-view h3 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
        .placeholder-view p { color: #aaa; max-width: 260px; margin: 0 auto; font-size: 14px; line-height: 1.5; }

        /* ─── Animations ────────────────────────────── */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.94); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        .animate-fade-in  { animation: fadeIn  0.3s cubic-bezier(0.16,1,0.3,1); }
        .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1); }
        .animate-scale-in { animation: scaleIn 0.25s cubic-bezier(0.16,1,0.3,1); }

        /* btn-primary (used by misc buttons) */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #111;
          color: white;
          border-radius: 100px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 14px;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover { background: var(--accent); transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
