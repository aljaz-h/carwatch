import { parsePlaceholderImageUri } from "@carwatch/shared";
import { cn } from "@/lib/utils";
import { PlaceholderArt } from "./placeholder-art";

interface VehicleImageProps {
  src: string | undefined;
  alt: string;
  manufacturer?: string;
  className?: string;
  eager?: boolean;
}

export function VehicleImage({ src, alt, manufacturer, className, eager }: VehicleImageProps) {
  if (!src) {
    return (
      <div className={cn("bg-surface-2", className)}>
        <PlaceholderArt shot="side" colorHex="#8a8d91" seed={alt} manufacturer={manufacturer} className="h-full w-full" />
      </div>
    );
  }

  const placeholder = parsePlaceholderImageUri(src);
  if (placeholder) {
    return (
      <div className={cn("bg-surface-2", className)}>
        <PlaceholderArt {...placeholder} manufacturer={manufacturer} className="h-full w-full" />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("bg-surface-2 object-cover", className)}
    />
  );
}
