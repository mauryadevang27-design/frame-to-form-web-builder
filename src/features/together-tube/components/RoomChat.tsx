import React, { useEffect, useRef, useState } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../types";

const toneColors = {
  violet: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  mint: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

interface RoomChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
  className?: string;
}

export function RoomChat({ messages, currentUserId, onSend, className }: RoomChatProps) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onSend(clean);
    setText("");
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col justify-between", className)}>
      {/* Message List */}
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-surface border border-border">
              <Smile className="size-5 text-primary" />
            </div>
            <p className="mt-2 text-[13px] font-medium text-foreground">Room Chat</p>
            <p className="text-[11.5px] max-w-[200px]">Send a message to everyone in this watch party!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            const timeStr = new Date(m.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={m.id}
                className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}
              >
                {!isMe && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        m.senderTone ? `bg-${m.senderTone}-400` : "bg-primary",
                      )}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {m.senderName}
                    </span>
                    <span className="text-[9.5px] text-subtle-foreground">{timeStr}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed shadow-card break-words",
                    isMe
                      ? "rounded-br-sm bg-gradient-primary text-primary-foreground font-normal"
                      : "rounded-bl-sm border border-border bg-surface text-foreground",
                  )}
                >
                  {m.text}
                </div>
                {isMe && (
                  <span className="px-1 text-[9.5px] text-subtle-foreground">{timeStr}</span>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input Field */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border bg-surface/70 backdrop-blur-md p-2.5 flex items-center gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message room..."
          className="h-10 flex-1 rounded-xl border border-border bg-background px-3.5 text-[12.5px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <Button
          type="submit"
          variant="primary"
          size="iconSm"
          disabled={!text.trim()}
          className="size-10 rounded-xl"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
