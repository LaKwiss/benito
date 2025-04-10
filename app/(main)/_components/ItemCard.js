// components/ItemCard.js
// Affiche une seule carte d'item dans la grille - maintenant cliquable
import Image from "next/image";

// Icone Placeholder interne
const ItemPlaceholderIcon = () => (
  <div className="w-16 h-16 bg-gradient-to-b from-gray-600 to-gray-800 border-2 border-t-gray-500 border-l-gray-500 border-b-black/50 border-r-black/50 flex items-center justify-center mx-auto shadow-pixel-inner">
    <div className="w-[calc(100%-12px)] h-[calc(100%-12px)] bg-gray-800/80 border border-black/50 flex items-center justify-center text-gray-500 text-sm italic">
      ?
    </div>
  </div>
);

// Ajout de la prop onClick
export default function ItemCard({ item, imageUrl, hasError, onClick }) {
  return (
    // Ajout de onClick et de classes pour l'interactivité
    <div
      key={item.listingId}
      onClick={onClick} // Appel de la fonction passée en prop au clic
      className={`bg-[#1E1E1E] border-4 border-t-[#555555] border-l-[#555555] border-b-[#2a2a2a] border-r-[#2a2a2a] p-3 flex flex-col justify-between shadow-pixel-md relative transition-transform hover:scale-[1.05] duration-150 cursor-pointer group ${
        // Ajout cursor-pointer, group, hover:scale
        item.seller === "AdminShop"
          ? "outline outline-2 outline-yellow-400 outline-offset-[-4px]"
          : ""
      }
       ${hasError ? "opacity-50 cursor-not-allowed" : ""} // Grise si erreur
      `}
      aria-disabled={hasError}
      role="button" // Indique que c'est cliquable
      tabIndex={hasError ? -1 : 0} // Rendre focusable sauf si erreur
    >
      {item.seller === "AdminShop" && (
        <span className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] px-1 leading-none font-bold border border-yellow-700 shadow-sm z-10">
          ADMIN
        </span>
      )}
      {/* Contenu inchangé */}
      <div className="flex-grow mb-3 flex flex-col text-center">
        <div className="mb-4 mt-1 h-16 w-16 mx-auto flex items-center justify-center bg-black/30 border border-gray-600/50 shadow-inner">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.name}
              width={48}
              height={48}
              unoptimized={true}
              className="object-contain image-rendering-pixelated"
              onError={(e) => {
                /* ... */
              }}
            />
          ) : (
            <ItemPlaceholderIcon />
          )}
        </div>
        <h2
          className="text-base font-bold text-white mb-2 leading-tight text-shadow-sm group-hover:text-yellow-300 transition-colors duration-150" // Change couleur au survol
          title={item.name}
        >
          {item.name}
        </h2>
        <p className="text-lg font-bold text-yellow-300 mb-3 leading-tight text-shadow-sm">
          {item.price} <span className="text-sm">$</span>
        </p>
        <div className="text-[11px] text-gray-400 mb-3 leading-tight">
          <span>Qt: {item.quantity}</span> <span className="mx-1.5">|</span>{" "}
          <span title={item.seller}>Par: {item.seller}</span>
        </div>
      </div>
      {/* Bouton Acheter SUPPRIMÉ d'ici */}
    </div>
  );
}
