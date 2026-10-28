import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import heroAsset from "@/assets/hero-bottle.jpg.asset.json";
import collageAsset from "@/assets/signature-collage.jpg.asset.json";
import ingredientsAsset from "@/assets/story-ingredients.jpg.asset.json";
import amberAsset from "@/assets/product-amber-noir.jpg.asset.json";
import ringAsset from "@/assets/cta-ring.jpg.asset.json";

type Slide = {
  id: string;
  eyebrow: string;
  headlineA: string;
  headlineB?: string;
  accentLast?: boolean;
  description: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
  image: string;
  imageAlt: string;
};

const SLIDES: Slide[] = [
  {
    id: "hero",
    eyebrow: "The Art of Fine Fragrance",
    headlineA: "Scent That",
    headlineB: "Defines You.",
    accentLast: true,
    description:
      "Discover distinctive fragrances created to express individuality, elegance, and confidence.",
    primary: { label: "Explore Collection", to: "/shop" },
    secondary: { label: "Discover Our Story", to: "/story" },
    image: heroAsset.url,
    imageAlt: "Noir Élixir signature perfume bottle under golden light",
  },
  {
    id: "signature",
    eyebrow: "The House Signature",
    headlineA: "Signature",
    headlineB: "Experience",
    description:
      "Rare raw materials — Cambodian oud, Taif rose, saffron — composed in small batches at extrait strength.",
    primary: { label: "Discover Noir Élixir", to: "/perfume/$slug" },
    secondary: { label: "View All Fragrances", to: "/shop" },
    image: collageAsset.url,
    imageAlt: "Floating perfume bottles with rose petals, saffron and oud",
  },
  {
    id: "craft",
    eyebrow: "The Craft",
    headlineA: "The Craft",
    description:
      "Each composition macerates for weeks before bottling. No shortcuts, no compromises — only patience and precision.",
    primary: { label: "Our Philosophy", to: "/story" },
    image: ingredientsAsset.url,
    imageAlt: "Oud wood, damask rose and saffron on dark stone",
  },
  {
    id: "wardrobe",
    eyebrow: "The Collection",
    headlineA: "An Olfactory",
    headlineB: "Wardrobe",
    description:
      "From the depth of oud to the light of fresh bergamot — five families of fragrance for every mood and moment.",
    primary: { label: "Shop the Collection", to: "/shop" },
    secondary: { label: "Browse Collections", to: "/collections" },
    image: amberAsset.url,
    imageAlt: "Amber Noir perfume bottle in dramatic side light",
  },
  {
    id: "cta",
    eyebrow: "Premium CTA",
    headlineA: "Your Signature",
    headlineB: "Awaits.",
    description:
      "A fragrance is the most intimate thing you wear. Find the one that was made to define you.",
    primary: { label: "Find Your Fragrance", to: "/shop" },
    image: ringAsset.url,
    imageAlt: "Perfume bottle framed by a glowing golden ring of light",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const dotsVisibleRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [dotsVisible, setDotsVisible] = useState(true);

  useEffect(() => {
    const sections = sectionRefs.current.filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      { threshold: 0.55 },
    );
    sections.forEach((s) => observer.observe(s));

    const dotsObserver = new IntersectionObserver(
      ([entry]) => setDotsVisible(!!entry?.isIntersecting),
      { threshold: 0.15 },
    );
    if (wrapRef.current) dotsObserver.observe(wrapRef.current);

    return () => {
      observer.disconnect();
      dotsObserver.disconnect();
    };
  }, []);

  const scrollTo = (idx: number) => {
    sectionRefs.current[idx]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const scrollDown = () => {
    sectionRefs.current[Math.min(active + 1, SLIDES.length - 1)]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <div ref={wrapRef} className="relative">
      {SLIDES.map((slide, idx) => {
        const primaryParams =
          slide.primary.to === "/perfume/$slug" ? { slug: "noir-elixir" } : undefined;
        return (
          <section
            key={slide.id}
            ref={(el) => {
              sectionRefs.current[idx] = el;
            }}
            id={slide.id}
            className="relative flex min-h-screen items-center overflow-hidden"
            aria-label={slide.headlineA}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.55, scale: reduced ? 1 : 1.08 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={slide.image}
                alt={slide.imageAlt}
                className="size-full object-cover object-center"
                loading={idx === 0 ? "eager" : "lazy"}
                {...(idx === 0 ? {} : { width: 1600, height: 1000 })}
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/30" />

            <div className="relative mx-auto w-full max-w-7xl px-6 pb-28 pt-32 sm:pb-32">
              <motion.div
                className="max-w-xl"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
              >
                <motion.p variants={item} className="micro-label text-gold">
                  {slide.eyebrow}
                </motion.p>
                <motion.h1
                  variants={item}
                  className="headline mt-5 text-4xl text-ivory sm:text-5xl lg:text-6xl"
                >
                  {slide.headlineA}
                  {slide.headlineB && (
                    <>
                      <br />
                      <span className={slide.accentLast ? "gold-gradient-text" : ""}>
                        {slide.headlineB}
                      </span>
                    </>
                  )}
                </motion.h1>
                <motion.p
                  variants={item}
                  className="mt-6 max-w-md text-sm leading-relaxed text-smoke sm:text-base"
                >
                  {slide.description}
                </motion.p>
                <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    to={slide.primary.to}
                    {...(primaryParams ? { params: primaryParams } : {})}
                    className="group inline-flex items-center gap-2.5 bg-gold px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:bg-gold-soft"
                  >
                    {slide.primary.label}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  {slide.secondary && (
                    <Link
                      to={slide.secondary.to}
                      className="group inline-flex items-center gap-2 border border-gold/40 px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10"
                    >
                      {slide.secondary.label}
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <button
              onClick={scrollDown}
              aria-label="Scroll to next section"
              className="absolute bottom-8 left-6 hidden items-center gap-3 sm:flex lg:left-12"
            >
              <motion.span
                className="grid size-11 place-items-center rounded-full border border-gold/40 text-gold"
                {...(reduced
                  ? {}
                  : {
                      animate: { y: [0, 6, 0] },
                      transition: {
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut" as const,
                      },
                    })}
              >
                <ChevronDown className="size-4" />
              </motion.span>
              <span className="micro-label text-[0.5625rem] text-smoke">Scroll to discover</span>
            </button>
          </section>
        );
      })}

      {/* Slide dots */}
      <div
        ref={dotsVisibleRef}
        className={`pointer-events-none fixed bottom-7 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-500 ${
          dotsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-noir/70 px-4 py-2.5 backdrop-blur-md">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => scrollTo(idx)}
              aria-label={`Go to ${slide.eyebrow}`}
              aria-current={active === idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                active === idx ? "w-8 bg-gold" : "w-3 bg-ivory/30 hover:bg-ivory/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
