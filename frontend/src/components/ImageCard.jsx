import React from "react";

export default function ImageCard({ title, imageUrl, altText }) {
  return (
    <div className="w-full md:w-[45%]">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-4">
        {title}
      </h3>

      <div className="aspect-w-1 aspect-h-1 bg-slate-200 rounded-2xl shadow-lg overflow-hidden border-4 border-white">
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/400x400/e2e8f0/64748b?text=${altText.replace(
              " ",
              "+"
            )}`;
          }}
        />
      </div>
    </div>
  );
}
