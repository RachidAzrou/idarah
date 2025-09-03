import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

interface AspectBoxProps {
  children: React.ReactNode;
  ratio?: number; // defaults to 1586/1000 (credit card ratio)
  className?: string;
}

export function AspectBox({ children, ratio = 1586/1000, className }: AspectBoxProps) {
  return (
    <div className={cn("w-full", className)}>
      <AspectRatio ratio={ratio}>
        {children}
      </AspectRatio>
    </div>
  );
}