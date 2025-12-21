import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LavaBackground } from "@/components/LavaBackground";
import { Play, Radio, Headphones, Smartphone, Monitor, Crown, Users, Music, Zap, Check, ArrowRight, Mail, Lock, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import mascotImage from "@assets/588496392_1194040775959608_6497226853787014568_n_1766347733869.jpg";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string }) => {
      return apiRequest("POST", "/api/members/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Lava Bytes!",
        description: "Check your email to verify your account.",
      });
      setIsLoginOpen(false);
      setEmail("");
      setPassword("");
      setDisplayName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest("POST", "/api/members/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You're now logged in.",
      });
      setIsLoginOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/login", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin access granted",
        description: "Redirecting to admin panel...",
      });
      setIsLoginOpen(false);
      setAdminEmail("");
      setAdminPassword("");
      window.location.href = "/admin";
    },
    onError: (error: Error) => {
      toast({
        title: "Admin login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const features = [
    { icon: Radio, title: "Live Radio Streams", description: "Access curated internet radio stations from around the world" },
    { icon: Music, title: "Custom Stations", description: "Premium members can create and share their own radio stations" },
    { icon: Headphones, title: "Lock Screen Controls", description: "Control playback from your lock screen or notification panel" },
    { icon: Zap, title: "Offline Mode", description: "Keep listening even when you lose connection" },
  ];

  const platforms = [
    { icon: Smartphone, name: "iOS", description: "Add to Home Screen from Safari" },
    { icon: Smartphone, name: "Android", description: "Install as an app from Chrome" },
    { icon: Monitor, name: "Desktop", description: "Works in any modern browser" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LavaBackground />
      
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-lava-500 shadow-lava-glow">
            <img src={mascotImage} alt="Lava Bytes Mascot" className="w-full h-full object-cover" data-testid="mascot-logo" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-lava-200 led-text">Lava Bytes Radio</h1>
            <p className="text-xs text-muted-foreground">Feel the Heat. Hear the Beat.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-login">Sign In</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Welcome to Lava Bytes</DialogTitle>
                <DialogDescription>Join our community of audio enthusiasts</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Sign Up</TabsTrigger>
                  <TabsTrigger value="admin" data-testid="tab-admin">Admin</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-login-email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-password" type="password" placeholder="Your password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-login-password" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => loginMutation.mutate({ email, password })} disabled={loginMutation.isPending} data-testid="button-submit-login">
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </TabsContent>
                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="register-name" placeholder="Your name" className="pl-10" value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="input-register-name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="register-email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-register-email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="register-password" type="password" placeholder="Create a password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-register-password" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => registerMutation.mutate({ email, password, displayName })} disabled={registerMutation.isPending} data-testid="button-submit-register">
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">We'll send a verification email to confirm your account</p>
                </TabsContent>
                <TabsContent value="admin" className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Admin Access</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="admin-email" type="email" placeholder="admin@example.com" className="pl-10" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} data-testid="input-admin-email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Admin Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="admin-password" type="password" placeholder="Your admin password" className="pl-10" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} data-testid="input-admin-password" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => adminLoginMutation.mutate({ email: adminEmail, password: adminPassword })} disabled={adminLoginMutation.isPending} data-testid="button-submit-admin-login">
                    {adminLoginMutation.isPending ? "Signing in..." : "Admin Sign In"}
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Link href="/player">
            <Button data-testid="button-launch-player">
              <Play className="w-4 h-4 mr-2" /> Launch Player
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="py-16 md:py-24 px-4 md:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <img src={mascotImage} alt="Lava Bytes Mascot" className="w-32 h-32 md:w-48 md:h-48 mx-auto rounded-full border-4 border-lava-500 shadow-lava-glow" data-testid="hero-mascot" />
            </div>
            <Badge className="mb-4 bg-lava-600/50 text-lava-200 border-lava-500">Free to Listen</Badge>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-lava-100 mb-4 led-text">
              Your Audiovisualistic Dreams Await
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-2">
              Experience internet radio like never before with our immersive car stereo-inspired player.
            </p>
            <p className="text-xl md:text-2xl font-semibold text-lava-300 mb-8 italic">
              "Where Sound Becomes Vision"
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/player">
                <Button size="lg" className="gap-2" data-testid="button-hero-launch">
                  <Play className="w-5 h-5" /> Start Listening Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => setIsLoginOpen(true)} data-testid="button-hero-join">
                <Users className="w-5 h-5 mr-2" /> Join the Community
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-background/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-center mb-12 text-lava-200">Why Lava Bytes Radio?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <Card key={i} className="bg-card/80 backdrop-blur-sm border-lava-800/50">
                  <CardHeader>
                    <feature.icon className="w-10 h-10 text-lava-400 mb-2" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-center mb-4 text-lava-200">Install Anywhere</h3>
            <p className="text-center text-muted-foreground mb-12">Lava Bytes works as a Progressive Web App on all your devices</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {platforms.map((platform, i) => (
                <Card key={i} className="bg-card/80 backdrop-blur-sm border-lava-800/50 text-center">
                  <CardHeader>
                    <platform.icon className="w-12 h-12 mx-auto text-lava-400" />
                    <CardTitle>{platform.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{platform.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-background/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-center mb-12 text-lava-200">Choose Your Experience</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card/80 backdrop-blur-sm border-lava-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Radio className="w-6 h-6 text-lava-400" /> Free Listener</CardTitle>
                  <CardDescription>Perfect for casual listening</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold text-lava-200">$0<span className="text-sm font-normal text-muted-foreground">/forever</span></div>
                  <ul className="space-y-2">
                    {["Access all curated stations", "Lock screen controls", "Offline mode", "PWA installation"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" />{item}</li>
                    ))}
                  </ul>
                  <Link href="/player">
                    <Button className="w-full mt-4" variant="outline" data-testid="button-free-tier">Start Listening</Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-lava-900/80 to-lava-800/80 backdrop-blur-sm border-lava-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Crown className="w-6 h-6 text-yellow-500" /> Premium Creator</CardTitle>
                  <CardDescription>For passionate audio enthusiasts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold text-lava-200">$9.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <ul className="space-y-2">
                    {["Everything in Free", "Create your own stations", "Upload custom audio/video", "Premium visualizers", "Priority support", "Early access features"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-yellow-500" />{item}</li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4 bg-gradient-to-r from-lava-500 to-lava-600" onClick={() => setIsLoginOpen(true)} data-testid="button-premium-tier">
                    Upgrade to Premium <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 text-lava-200">Ready to Share Your Audiovisualistic Dreams?</h3>
            <p className="text-muted-foreground mb-8">Join thousands of listeners and creators on Lava Bytes Radio. Your sonic journey starts now.</p>
            <Button size="lg" onClick={() => setIsLoginOpen(true)} data-testid="button-cta-join">
              <Users className="w-5 h-5 mr-2" /> Join Lava Bytes Today
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-8 px-4 border-t border-lava-800/50 bg-background/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={mascotImage} alt="Lava Bytes" className="w-8 h-8 rounded-full" />
            <span className="text-sm text-muted-foreground">Lava Bytes Radio - Feel the Heat. Hear the Beat.</span>
          </div>
          <p className="text-xs text-muted-foreground">Where Sound Becomes Vision</p>
        </div>
      </footer>
    </div>
  );
}
