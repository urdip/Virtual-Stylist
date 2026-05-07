"use client";

import { useState } from "react";

type Props = {
  baseSrc: string;
  topSrc?: string;
  bottomSrc?: string;
  accessorySrc?: string;
};

export default function AvatarOverlay({
  baseSrc,
  topSrc,
  bottomSrc,
  accessorySrc,
}: Props) {
  const [loadErrors, setLoadErrors] = useState<{[key: string]: boolean}>({});

  const handleError = (type: string, src?: string) => {
    console.error(`Failed to load ${type} image:`, src);
    setLoadErrors(prev => ({ ...prev, [type]: true }));
  };

  // If image failed to load, don't render it
  const shouldRender = (type: string, src?: string) => {
    return !!src && !loadErrors[type];
  };

  return (
    <div
      style={{
        width: 320,
        height: 520,
        position: "relative",
        margin: "0 auto",
        background: "#f7f7f7",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #ddd",
      }}
    >
      {/* BASE AVATAR */}
      <img
        src={baseSrc}
        alt="Avatar"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          zIndex: 1,
        }}
      />

      {/* TOP */}
      {shouldRender("top", topSrc) && (
        <img
          src={topSrc}
          alt="Top"
          onError={() => handleError("top", topSrc)}
          style={{
            position: "absolute",
            top: "16%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "62%",
            objectFit: "contain",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}

      {/* BOTTOM */}
      {shouldRender("bottom", bottomSrc) && (
        <img
          src={bottomSrc}
          alt="Bottom"
          onError={() => handleError("bottom", bottomSrc)}
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            objectFit: "contain",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ACCESSORY / SHOES / OUTERWEAR */}
      {shouldRender("accessory", accessorySrc) && (
        <img
          src={accessorySrc}
          alt="Accessory"
          onError={() => handleError("accessory", accessorySrc)}
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "50%",
            objectFit: "contain",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
