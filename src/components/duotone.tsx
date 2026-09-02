import { cn } from "@/lib/cn";

type Props = {
  src: string;
  className?: string;
  position?: string;
  baked?: boolean;
};

export function Duotone({
  src,
  className,
  position = "50% 22%",
  baked = false,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        baked ? "bg-asphalt" : "bg-accent",
        className,
      )}
    >
      <img
        src={src}
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          baked ? "" : "grayscale contrast-125 brightness-110 mix-blend-multiply",
        )}
        style={{ objectPosition: position }}
      />
    </div>
  );
}
