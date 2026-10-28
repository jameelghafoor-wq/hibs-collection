import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { catalogQueryOptions } from "@/lib/catalog.functions";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { data } = useQuery({
    ...catalogQueryOptions,
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) setTerm("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!data || term.trim().length < 2) return [];
    const t = term.trim().toLowerCase();
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.fragranceFamily?.toLowerCase().includes(t) ||
        p.topNotes?.toLowerCase().includes(t) ||
        p.heartNotes?.toLowerCase().includes(t) ||
        p.baseNotes?.toLowerCase().includes(t),
    );
  }, [data, term]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] bg-noir/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto max-w-2xl px-6 pt-28">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <Search className="size-5 text-gold" />
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search fragrances, notes, families…"
                className="w-full bg-transparent font-display text-xl text-ivory placeholder:text-smoke/50 outline-none sm:text-2xl"
              />
              <button
                onClick={onClose}
                aria-label="Close search"
                className="rounded-sm p-2 text-smoke transition-colors hover:text-gold"
              >
                <X className="size-5" />
              </button>
            </div>

            {term.trim().length >= 2 && (
              <div className="mt-6 space-y-1">
                {results.length === 0 && (
                  <p className="micro-label py-8 text-center text-smoke">
                    No fragrances found for “{term.trim()}”
                  </p>
                )}
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      navigate({ to: "/perfume/$slug", params: { slug: p.slug } });
                    }}
                    className="flex w-full items-center gap-4 rounded-sm px-3 py-3 text-left transition-colors hover:bg-accent"
                  >
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        loading="lazy"
                        className="size-12 rounded-sm object-cover"
                      />
                    )}
                    <span>
                      <span className="block font-display text-base tracking-wide text-ivory">
                        {p.name}
                      </span>
                      <span className="micro-label text-[0.625rem] text-smoke">
                        {p.collectionName ?? p.fragranceFamily ?? "Fragrance"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
