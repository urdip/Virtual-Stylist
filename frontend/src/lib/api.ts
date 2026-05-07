// frontend/src/lib/api.ts

export type Category = "top" | "bottom" | "shoes" | "dress" | "accessory";

export type WardrobeItem = {
  id: string;
  category: Category;
  url: string;
  filename: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  photo_url?: string;
};

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:8000";

// Get auth token from localStorage
function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  
  return res.json();
}

// Auth API
export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${BACKEND_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail);
  }
  
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BACKEND_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail);
  }
  
  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function logout() {
  const token = getToken();
  if (token) {
    const body = new URLSearchParams({ token }).toString();
    await fetch(`${BACKEND_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const form = new FormData();
  form.append("current_password", currentPassword);
  form.append("new_password", newPassword);
  
  const token = getToken();
  const res = await fetch(`${BACKEND_BASE}/auth/change-password`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to change password" }));
    throw new Error(err.detail);
  }
  
  return res.json();
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${BACKEND_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to request password reset" }));
    throw new Error(err.detail);
  }
  
  return res.json();
}

export async function getMe(): Promise<User> {
  return fetchWithAuth(`${BACKEND_BASE}/auth/me`).then(r => r.user);
}

export async function uploadUserPhoto(file: File) {
  const form = new FormData();
  form.append("photo", file);
  
  const token = getToken();
  const res = await fetch(`${BACKEND_BASE}/auth/photo`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail);
  }
  
  return res.json();
}

export async function deleteUserPhoto() {
  const token = getToken();
  const res = await fetch(`${BACKEND_BASE}/auth/photo`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Delete failed" }));
    throw new Error(err.detail);
  }
  
  return res.json();
}

export async function updateUserProfile(name?: string, photo?: File) {
  const form = new FormData();
  if (name) form.append("name", name);
  if (photo) form.append("photo", photo);
  
  const token = getToken();
  const res = await fetch(`${BACKEND_BASE}/auth/profile`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}` },
    body: form,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Update failed" }));
    throw new Error(err.detail);
  }
  
  return res.json();
}

// Wardrobe API
export async function listWardrobe(category?: Category): Promise<WardrobeItem[]> {
  let url = `${BACKEND_BASE}/wardrobe/list`;
  if (category) url += `?category=${category}`;
  
  const data = await fetchWithAuth(url);
  return data.items || [];
}

export async function uploadClothing(file: File, category: Category) {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  
  return fetchWithAuth(`${BACKEND_BASE}/wardrobe/upload`, {
    method: "POST",
    body: form,
  });
}

export async function deleteClothing(category: string, fileId: string) {
  return fetchWithAuth(`${BACKEND_BASE}/wardrobe/${category}/${fileId}`, {
    method: "DELETE",
  });
}

// Try-on API (single garment - backward compatible)
export async function generateTryOn(garmentUrl: string): Promise<{ url: string; mode?: string; garmentCount?: number }> {
  const form = new FormData();
  form.append("garment_url", garmentUrl);
  
  const data = await fetchWithAuth(`${BACKEND_BASE}/tryon`, {
    method: "POST",
    body: form,
  });
  
  return { 
    url: data.result_url, 
    mode: data.mode,
    garmentCount: data.garment_count 
  };
}

// Try-on API for multiple garments (complete outfit)
export async function generateOutfitTryOn(garmentUrls: string[], photoUrl?: string): Promise<{ url: string; mode?: string; garmentCount?: number }> {
  const form = new FormData();
  form.append("garment_urls", garmentUrls.join(","));
  if (photoUrl) {
    form.append("photo_url", photoUrl);
  }
  
  const data = await fetchWithAuth(`${BACKEND_BASE}/tryon/outfit`, {
    method: "POST",
    body: form,
  });
  
  return { 
    url: data.result_url, 
    mode: data.mode,
    garmentCount: data.garment_count 
  };
}

// Outfit Types
export type OutfitItem = {
  id: string;
  url: string;
  filename: string;
  category: string;
};

export type SavedOutfit = {
  id: string;
  name: string;
  result_url: string;
  garments: OutfitItem[];
  created_at: string;
};

// Outfits API
export async function listOutfits(): Promise<SavedOutfit[]> {
  const data = await fetchWithAuth(`${BACKEND_BASE}/outfits`);
  return data.outfits || [];
}

export async function saveOutfit(
  resultUrl: string, 
  garments: OutfitItem[], 
  name?: string
): Promise<SavedOutfit> {
  const data = await fetchWithAuth(`${BACKEND_BASE}/outfits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      result_url: resultUrl,
      garments,
      name: name || ""
    }),
  });
  return data.outfit;
}

export async function updateOutfitName(outfitId: string, name: string): Promise<SavedOutfit> {
  const form = new FormData();
  form.append("name", name);
  
  const data = await fetchWithAuth(`${BACKEND_BASE}/outfits/${outfitId}`, {
    method: "PUT",
    body: form,
  });
  return data.outfit;
}

export async function deleteOutfit(outfitId: string): Promise<void> {
  await fetchWithAuth(`${BACKEND_BASE}/outfits/${outfitId}`, {
    method: "DELETE",
  });
}

// Avatar Types
export type Avatar = {
  id: string;
  name: string;
  photo_url: string;
  is_active: boolean;
  created_at: string;
};

// Avatars API
export async function listAvatars(): Promise<Avatar[]> {
  const data = await fetchWithAuth(`${BACKEND_BASE}/avatars`);
  return data.avatars || [];
}

export async function getActiveAvatar(): Promise<Avatar | null> {
  const data = await fetchWithAuth(`${BACKEND_BASE}/avatars/active`);
  return data.avatar;
}

export async function createAvatar(name: string, photo: File): Promise<Avatar> {
  const form = new FormData();
  form.append("name", name);
  form.append("photo", photo);
  
  const data = await fetchWithAuth(`${BACKEND_BASE}/avatars`, {
    method: "POST",
    body: form,
  });
  
  return data.avatar;
}

export async function updateAvatar(avatarId: string, name?: string, isActive?: boolean): Promise<Avatar> {
  const form = new FormData();
  if (name) form.append("name", name);
  if (isActive !== undefined) form.append("is_active", String(isActive));
  
  const data = await fetchWithAuth(`${BACKEND_BASE}/avatars/${avatarId}`, {
    method: "PUT",
    body: form,
  });
  
  return data.avatar;
}

export async function activateAvatar(avatarId: string): Promise<Avatar> {
  const data = await fetchWithAuth(`${BACKEND_BASE}/avatars/${avatarId}/activate`, {
    method: "POST",
  });
  
  return data.avatar;
}

export async function deleteAvatar(avatarId: string): Promise<void> {
  await fetchWithAuth(`${BACKEND_BASE}/avatars/${avatarId}`, {
    method: "DELETE",
  });
}
