/**
 * H&M Men's Product Scraper — run in browser DevTools console
 *
 * 1. Open https://www2.hm.com/en_us/men/products/view-all.html in Chrome
 * 2. Scroll to the bottom to load all products (or as many as you want)
 * 3. Open DevTools → Console, paste this entire script, press Enter
 * 4. Copy the printed JSON output
 * 5. Paste it as the array value in frontend/src/lib/hm-products.ts
 */

(function extractHMProducts() {
  const CATEGORY_MAP = {
    "t-shirt": "T-Shirt",
    "shirt": "Shirt",
    "hoodie": "Hoodie",
    "sweatshirt": "Sweatshirt",
    "jacket": "Jacket",
    "coat": "Coat",
    "blazer": "Blazer",
    "jeans": "Jeans",
    "pants": "Pants",
    "trousers": "Pants",
    "shorts": "Shorts",
    "sweater": "Sweater",
    "cardigan": "Sweater",
    "polo": "Polo",
    "vest": "Vest",
    "suit": "Suit",
    "jogger": "Pants",
    "chino": "Pants",
    "cargo": "Pants",
    "parka": "Jacket",
    "puffer": "Jacket",
    "windbreaker": "Jacket",
    "bomber": "Jacket",
    "denim": "Jeans",
    "overshirt": "Shirt",
    "flannel": "Shirt",
    "turtleneck": "Sweater",
    "longsleeve": "T-Shirt",
    "long-sleeve": "T-Shirt",
    "tank": "T-Shirt",
  };

  function guessCategory(name) {
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(key)) return val;
    }
    return "Clothing";
  }

  function getBestImage(el) {
    // Try <img> inside the card
    const img = el.querySelector("img");
    if (!img) return null;

    // Prefer data-src (lazy-loaded), then srcset largest, then src
    const dataSrc = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
    if (dataSrc && dataSrc.startsWith("http")) return dataSrc.split("?")[0] + "?w=800&q=85";

    const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset");
    if (srcset) {
      const entries = srcset.split(",").map(s => s.trim().split(/\s+/));
      const widths = entries.map(([url, w]) => ({ url, w: parseInt(w) || 0 }));
      widths.sort((a, b) => b.w - a.w);
      if (widths[0]?.url) return widths[0].url.split("?")[0] + "?w=800&q=85";
    }

    const src = img.src || img.getAttribute("src");
    if (src && src.startsWith("http") && !src.includes("placeholder")) {
      return src.split("?")[0] + "?w=800&q=85";
    }

    return null;
  }

  function getProductUrl(el) {
    const a = el.querySelector("a[href*='/productpage'], a[href*='/en_us/']");
    if (!a) return null;
    const href = a.getAttribute("href");
    if (!href) return null;
    if (href.startsWith("http")) return href;
    return "https://www2.hm.com" + href;
  }

  function getPrice(el) {
    const priceEl = el.querySelector("[class*='price'], [data-testid*='price'], .price, strong");
    return priceEl?.textContent?.trim().replace(/\s+/g, " ") || null;
  }

  function getColor(el) {
    const colorEl = el.querySelector("[class*='color'], [class*='swatch'], [aria-label*='color']");
    return colorEl?.getAttribute("aria-label") || colorEl?.getAttribute("title") || null;
  }

  // Try multiple card selectors H&M uses
  const SELECTORS = [
    "article[class*='product']",
    "li[class*='product']",
    "[data-testid='product-item']",
    "[class*='ProductCard']",
    "[class*='product-item']",
    "article",
  ];

  let cards = [];
  for (const sel of SELECTORS) {
    const found = [...document.querySelectorAll(sel)];
    if (found.length > 5) { cards = found; break; }
  }

  if (cards.length === 0) {
    console.warn("No product cards found. Try scrolling the page further, or check the selector.");
    return;
  }

  const seen = new Set();
  const products = [];

  cards.forEach((card, i) => {
    const image_url = getBestImage(card);
    const product_url = getProductUrl(card);
    if (!image_url || !product_url) return;

    const key = product_url.replace(/[?#].*/, "");
    if (seen.has(key)) return;
    seen.add(key);

    const nameEl = card.querySelector("h2, h3, [class*='title'], [class*='name'], [class*='heading']");
    const name = nameEl?.textContent?.trim() || `H&M Product ${i + 1}`;
    const price = getPrice(card) || "";
    const color = getColor(card) || undefined;
    const category = guessCategory(name);

    products.push({
      id: `hm-men-${i + 1}`,
      name,
      image_url,
      product_url,
      price,
      category,
      ...(color ? { color } : {}),
      gender: "men",
      brand: "H&M",
    });
  });

  console.log(`Extracted ${products.length} products.`);
  console.log("Copy everything between the ===== lines:\n=====");
  console.log(JSON.stringify(products, null, 2));
  console.log("=====");
  return products;
})();
