import { useEffect, useState } from "react";

export default function useProductsCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/data/products.json");
        if (!res.ok) throw new Error("Unable to load catalog");
        const data = await res.json();
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setError(err.message || "Unable to load catalog");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
