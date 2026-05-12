import { useState, useRef, useEffect } from "react";
import {
  useListChatMessages,
  useSendChatMessage,
  getListChatMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Bot, User, Sparkles } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "How can I improve my savings rate?",
  "Which category am I overspending on?",
  "Give me a monthly budget plan",
  "How do I start investing with ₹5000?",
  "Tips to reduce food & dining expenses",
  "What is the 50/30/20 budget rule?",
];

export default function Chat() {
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useListChatMessages();
  const sendMessage = useSendChatMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (content: string) => {
    if (!content.trim()) return;
    const msg = content.trim();
    setInput("");
    sendMessage.mutate(
      { data: { content: msg } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">AI Financial Advisor</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Ask me anything about your finances — personalized advice based on your data
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <Card className="flex-1 border-border/50 overflow-hidden flex flex-col min-h-0">
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" data-testid="chat-messages">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-2/3 h-16" />
              ))}
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-8 py-8">
              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full inline-flex mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Your AI Finance Advisor</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                  I analyze your spending patterns and give personalized financial guidance.
                  What would you like to know?
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    data-testid={`button-suggestion-${q.slice(0, 10)}`}
                    onClick={() => handleSend(q)}
                    className="text-left p-3 text-sm border border-border/50 rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  data-testid={`message-${msg.id}`}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center mt-1">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              {/* Suggested prompts above input */}
              {messages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-xs px-3 py-1.5 border border-border/50 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>

        {/* Input */}
        <div className="border-t border-border/50 p-4 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              data-testid="input-chat"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances..."
              className="resize-none min-h-[44px] max-h-32 flex-1"
              rows={1}
              disabled={sendMessage.isPending}
            />
            <Button
              data-testid="button-send"
              size="icon"
              className="flex-shrink-0 h-11 w-11"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
