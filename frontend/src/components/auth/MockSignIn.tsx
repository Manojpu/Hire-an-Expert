import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { MOCK_USERS } from "@/data/mockUsers";
import { useNavigate } from "react-router-dom";

const MockSignIn = () => {
  const { login } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleChoose = (u: typeof MOCK_USERS[number]) => {
    login(u);
    setOpen(false);
    // navigate based on role
    if (u.role === 'expert') {
      navigate('/expert-dashboard');
    } else if (u.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/client-dashboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Sign In (Mock)</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-4">
          {MOCK_USERS.map((u) => (
            <div key={u.id} className="flex items-center justify-between border p-3 rounded">
              <div className="flex items-center gap-3">
                <img src={u.profileImage} alt={u.name} className="h-10 w-10 rounded-full" />
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.role}</div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleChoose(u)}
              >
                Continue as {u.name.split(" ")[0]}
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MockSignIn;
