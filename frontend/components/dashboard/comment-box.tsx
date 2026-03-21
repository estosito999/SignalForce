"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CommentBoxProps {
  loading: boolean;
  onSubmit: (content: string) => Promise<void>;
}

export function CommentBox({ loading, onSubmit }: CommentBoxProps) {
  const [content, setContent] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    await onSubmit(content.trim());
    setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Label htmlFor="comment-content">Comentario</Label>
      <textarea
        id="comment-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Aporta una lectura de mercado o critica constructiva..."
        className="min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm"
      />
      <Button type="submit" disabled={loading || !content.trim()}>
        {loading ? "Publicando..." : "Publicar comentario"}
      </Button>
    </form>
  );
}
