import Link from "next/link";

type Props = {
  /** "oscuro" = marca sobre fondo claro. "claro" = marca sobre fondo carbón. */
  tono?: "oscuro" | "claro";
  conEnlace?: boolean;
  className?: string;
};

export function IsotipoMatchPoint({
  className = "h-9 w-9",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="18.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M13 13C21.5 17.5 22 20.5 22 24C22 27.5 21.5 30.5 13 35"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M35 13C26.5 17.5 26 20.5 26 24C26 27.5 26.5 30.5 35 35"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Contenido({ tono }: { tono: "oscuro" | "claro" }) {
  return (
    <>
      <span
        className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center ${
          tono === "claro" ? "text-secondary-container" : "text-primary"
        }`}
      >
        <IsotipoMatchPoint className="h-10 w-10" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={`truncate font-display text-[1.05rem] font-semibold tracking-[-0.01em] ${
            tono === "claro" ? "text-white" : "text-primary"
          }`}
        >
          MatchPoint
        </span>
        <span
          className={`mt-1 hidden text-[0.63rem] font-medium sm:block ${
            tono === "claro" ? "text-white/50" : "text-on-surface-variant"
          }`}
        >
          Club &amp; canchas
        </span>
      </span>
    </>
  );
}

export default function Marca({
  tono = "oscuro",
  conEnlace = true,
  className = "",
}: Props) {
  const clases = `flex min-w-0 items-center gap-2.5 ${className}`;

  if (!conEnlace) {
    return (
      <span className={clases}>
        <Contenido tono={tono} />
      </span>
    );
  }

  return (
    <Link href="/" className={clases} aria-label="MatchPoint, ir al inicio">
      <Contenido tono={tono} />
    </Link>
  );
}
