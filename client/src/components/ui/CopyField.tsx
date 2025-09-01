"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CopyFieldProps {
  value: string;
  placeholder?: string;
}

export function CopyField({ value, placeholder }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: "Gekopieerd",
        description: "URL is gekopieerd naar klembord",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon niet kopiëren naar klembord",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Input 
        value={value} 
        placeholder={placeholder}
        readOnly 
        className="font-mono text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}