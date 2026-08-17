import { RARITY_STYLE, type CardDef } from "@/game/content";

export function GameCard({
  card,
  size = "md",
  delay = 0,
  reveal = false,
}: {
  card: CardDef;
  size?: "sm" | "md";
  delay?: number;
  reveal?: boolean;
}) {
  const r = RARITY_STYLE[card.rarity];
  const w = size === "sm" ? "w-[104px]" : "w-[150px]";
  const h = size === "sm" ? "h-[150px]" : "h-[214px]";
  return (
    <div
      className={`${w} ${h} relative shrink-0 rounded-xl border-2 p-1.5 ${reveal ? "animate-in fade-in zoom-in-75 duration-500 fill-mode-both" : ""}`}
      style={{
        borderColor: r.border,
        background: r.bg,
        boxShadow: `0 0 18px ${r.glow}, inset 0 0 18px rgba(0,0,0,.6)`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="relative h-[58%] overflow-hidden rounded-lg bg-black/40">
        {card.art ? (
          <img src={card.art} alt={card.name} className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl" style={{ color: r.border }}>
            ⚔
          </div>
        )}
      </div>
      <div className="mt-1 px-0.5">
        <div className="truncate text-[11px] font-extrabold tracking-wide text-foreground">{card.name}</div>
        <div className="text-[9px] font-bold tracking-widest" style={{ color: r.text }}>
          {card.rarity} · {card.type}
        </div>
        {size === "md" && (
          <div className="mt-1 line-clamp-3 text-[9px] leading-tight text-muted-foreground">
            {card.description}
          </div>
        )}
      </div>
    </div>
  );
}