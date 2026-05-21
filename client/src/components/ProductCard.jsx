import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/shopSlice";
import { ShoppingCart, Eye, Package, Star } from "lucide-react";
import toast from "react-hot-toast";
import { resolveImageSrc } from "../lib/images";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [imgSrc, setImgSrc] = useState(resolveImageSrc(product.images?.[0], product.slug));

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(
      addToCart({
        productId: product._id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        image: product.images?.[0],
        quantity: 1
      })
    );
    toast.success(`${product.title} added to cart`);
  };

  return (
    <div className="group rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/80 border border-white/5 overflow-hidden card-hover animate-fade-in-up">
      <div className="relative overflow-hidden aspect-[4/3] bg-slate-800/50">
        <img
          src={imgSrc}
          alt={`${product.title} — ${product.category?.name || "digital product"}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={() => setImgSrc(resolveImageSrc(null, product.slug))}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="flex gap-2 w-full">
            <Link
              to={`/products/${product.slug}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-all"
            >
              <Eye size={14} />
              View
            </Link>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600/80 backdrop-blur-sm text-white text-sm font-medium hover:bg-violet-500 transition-all"
            >
              <ShoppingCart size={14} />
              Add
            </button>
          </div>
        </div>

        {product.featured && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-amber-500/90 text-white font-semibold">
            <Star size={10} fill="currentColor" /> Featured
          </span>
        )}
        {product.category?.name && (
          <span className="absolute top-3 left-3 badge">{product.category.name}</span>
        )}
      </div>

      <div className="p-4">
        <Link to={`/products/${product.slug}`} className="font-semibold text-white line-clamp-1 hover:text-violet-200 transition-colors block">
          {product.title}
        </Link>
        <p className="text-slate-400 text-sm line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-500">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">${product.price}</span>
          <Link
            to={`/products/${product.slug}`}
            className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
