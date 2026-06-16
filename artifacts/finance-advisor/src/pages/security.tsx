import React, { useState, useEffect } from "react";
import { KeyRound, Plus, ShieldAlert, Landmark, Lock, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function Security() {
  const [pinConfigured, setPinConfigured] = useState(false);
  const [linkedAccountsCount, setLinkedAccountsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const res = await fetch("/api/security/status");
      if (res.ok) {
        const data = await res.json();
        setPinConfigured(data.pinConfigured);
        setLinkedAccountsCount(data.linkedAccountsCount);
      }
    } catch (error) {
      console.error("Failed to fetch security status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 6) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/security/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      
      if (!res.ok) throw new Error("Failed to set PIN");
      
      toast({ title: "Security PIN updated successfully" });
      setPinConfigured(true);
      setIsPinDialogOpen(false);
      setPin("");
    } catch (error) {
      toast({ title: "Error updating PIN", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading security settings...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Account Security</h1>
          <p className="text-muted-foreground mt-1">Manage linked bank accounts and protect sensitive details with a PIN.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-border/50 shadow-sm bg-background"
            onClick={() => setIsPinDialogOpen(true)}
          >
            <KeyRound className="w-4 h-4" />
            {pinConfigured ? "Update Security PIN" : "Set Security PIN"}
          </Button>
          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security PIN */}
        <div className="p-6 rounded-xl border border-border/50 bg-card shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-full ${pinConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
            {pinConfigured ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Security PIN</p>
            <p className={`text-lg font-semibold ${pinConfigured ? 'text-emerald-500' : 'text-amber-500'}`}>
              {pinConfigured ? "Configured" : "Not configured"}
            </p>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="p-6 rounded-xl border border-border/50 bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Linked Accounts</p>
            <p className="text-lg font-semibold text-foreground">{linkedAccountsCount} account{linkedAccountsCount !== 1 && 's'}</p>
          </div>
        </div>

        {/* Data Protection */}
        <div className="p-6 rounded-xl border border-border/50 bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Data Protection</p>
            <p className="text-lg font-semibold text-emerald-500">End-to-end masked</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {!pinConfigured && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-500">
              Set a security PIN to enable revealing your full account and card numbers. Without a PIN, sensitive fields stay masked.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="flex-shrink-0 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
            onClick={() => setIsPinDialogOpen(true)}
          >
            Set PIN
          </Button>
        </div>
      )}

      {/* Linked Accounts List section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Linked Accounts</h2>
        
        {linkedAccountsCount === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border/50 bg-card/50 border-dashed">
            <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">No accounts linked yet.</p>
            <Button variant="ghost" className="text-foreground font-medium gap-2 hover:bg-accent/50">
              <Plus className="w-4 h-4" />
              Add your first account
            </Button>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-border/50 bg-card shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                B
              </div>
              <div>
                <p className="font-semibold text-foreground">Primary Bank Account</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {pinConfigured ? "Revealed with PIN" : "•••• •••• •••• ••••"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>
        )}
      </div>

      {/* Set PIN Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pinConfigured ? "Update Security PIN" : "Set Security PIN"}</DialogTitle>
            <DialogDescription>
              Create a 6-digit PIN to secure your sensitive account details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <InputOTP
              maxLength={6}
              value={pin}
              onChange={setPin}
              pattern={REGEXP_ONLY_DIGITS}
              disabled={isSubmitting}
              autoFocus
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
            <Button 
              className="w-full" 
              disabled={pin.length !== 6 || isSubmitting}
              onClick={handleSetPin}
            >
              {isSubmitting ? "Saving..." : "Save PIN"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
