import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Play, ArrowRight, Shield, Settings, Sliders, ChevronRight, Home, Volume2, Upload, LogIn, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, serverTimestamp } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Tooltip({ children, content, className }: { children: React.ReactNode, content: string, className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#152e1d] text-xs text-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#1e3a28] shadow-xl">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e3a28]"></div>
      </div>
    </div>
  );
}

type FilmType = 'Frosted' | 'Tinted' | 'Reflective';

export default function App() {
  const [width, setWidth] = useState<string>('240');
  const [height, setHeight] = useState<string>('90');
  const [filmType, setFilmType] = useState<FilmType>('Frosted');
  const [company, setCompany] = useState<string>('Menetbered+');
  const [user, setUser] = useState<User | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const basePrice = 45.00;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCustomImage(null);
      return;
    }

    const q = query(
      collection(db, 'userImages'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setCustomImage(snapshot.docs[0].data().imageData);
      }
    }, (error) => {
      console.error("Error fetching images:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Compress and convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG
          const base64Data = canvas.toDataURL('image/jpeg', 0.7);

          // Save to Firestore
          await addDoc(collection(db, 'userImages'), {
            userId: user.uid,
            imageData: base64Data,
            createdAt: serverTimestamp()
          });
          setIsUploading(false);
        };
      };
    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1910] text-white font-sans overflow-x-hidden relative selection:bg-[#7bed8d]/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top right glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#1a4a2e] blur-[120px] opacity-40 mix-blend-screen"></div>
        {/* Bottom left glow */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#0f3820] blur-[100px] opacity-50 mix-blend-screen"></div>
        
        {/* Sweeping curves (SVG) */}
        <svg className="absolute top-0 right-0 w-full h-full opacity-30" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1440 0V800C1440 800 1150 600 720 600C290 600 0 800 0 800V0H1440Z" fill="url(#paint0_linear)" />
          <path d="M1440 0V600C1440 600 1150 400 720 400C290 400 0 600 0 600V0H1440Z" fill="url(#paint1_linear)" />
          <defs>
            <linearGradient id="paint0_linear" x1="720" y1="0" x2="720" y2="800" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1a4a2e" stopOpacity="0.5" />
              <stop offset="1" stopColor="#0a1910" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint1_linear" x1="720" y1="0" x2="720" y2="600" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2b8a40" stopOpacity="0.3" />
              <stop offset="1" stopColor="#0a1910" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-4">
            <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
              {/* Top triangle */}
              <path d="M15 30 L35 10 L35 30 Z" fill="#a3e635" />
              {/* Bottom triangle */}
              <path d="M15 70 L35 90 L35 70 Z" fill="#4d7c0f" />
              {/* Main bowl */}
              <path d="M15 30 L35 50 L15 70 L60 70 A 20 20 0 0 0 60 30 Z" fill="#84cc16" />
              {/* Inner cutout */}
              <path d="M45 40 L55 40 A 10 10 0 0 1 55 60 L45 60 Z" fill="#0a1910" />
            </svg>
            <div className="flex flex-col justify-center mt-1">
              <span className="text-4xl font-bold tracking-tight leading-none text-white">Brightside</span>
              <span className="text-xl font-normal tracking-wide text-[#84cc16] self-end leading-none mt-1.5">Privacy</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-300">
            <a href="#" className="hover:text-white transition-colors">Services</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-600 text-gray-300 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-600 text-gray-300 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
            <button className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#7bed8d]/50 bg-[#7bed8d]/10 text-[#7bed8d] hover:bg-[#7bed8d]/20 transition-all font-medium text-sm shadow-[0_0_15px_rgba(123,237,141,0.1)]">
              <Settings className="w-4 h-4" />
              Try Instant Quote
            </button>
          </div>
        </header>

        {/* Hero */}
        <div className="max-w-2xl mb-16">
          <h1 className="text-6xl md:text-[5.5rem] font-bold leading-[1.1] mb-6 tracking-tight">
            Get Your <span className="animate-neon-flicker">Free</span><br />Quote Now.
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-lg font-light">
            Instant quotes and a visualizer for premium window film solutions.
          </p>
        </div>

        {/* Main Widget Container */}
        <div className="bg-[#0f2416]/60 backdrop-blur-xl border border-[#1e3a28] rounded-[2.5rem] p-6 mb-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Panel - Calculator */}
            <div className="lg:col-span-4 bg-[#0a1910]/80 rounded-[2rem] p-8 flex flex-col relative overflow-hidden border border-[#1e3a28]">
              {/* Subtle top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#7bed8d]/50 to-transparent"></div>

              <div className="flex items-center gap-3 mb-10">
                <div className="w-8 h-8 bg-[#7bed8d]/10 rounded-full flex items-center justify-center">
                  <Home className="w-4 h-4 text-[#7bed8d]" />
                </div>
                <h2 className="text-xl font-semibold">Quote Calculator</h2>
              </div>

              <div className="space-y-8 flex-1">
                {/* Dimensions */}
                <div className="flex items-center gap-4 text-[15px]">
                  <span className="text-gray-400">Window:</span>
                  <div className="flex items-center gap-2">
                    <Tooltip content="Enter window width in centimeters">
                      <input 
                        type="text" 
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="w-14 bg-transparent border-b-2 border-[#7bed8d] text-white text-center focus:outline-none pb-1 text-lg font-medium"
                      />
                    </Tooltip>
                    <span className="text-gray-500">×</span>
                    <Tooltip content="Enter window height in centimeters">
                      <input 
                        type="text" 
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-14 bg-transparent border-b-2 border-[#1e3a28] text-white text-center focus:outline-none pb-1 text-lg font-medium"
                      />
                    </Tooltip>
                    <span className="text-gray-400 ml-1">cm</span>
                  </div>
                </div>

                {/* Film Type */}
                <div className="space-y-3">
                  <label className="text-[15px] font-medium text-gray-300">Film Type</label>
                  <Tooltip content="Select the style of window film" className="w-full">
                    <div className="relative">
                      <select 
                        value={filmType}
                        onChange={(e) => setFilmType(e.target.value as FilmType)}
                        className="w-full bg-[#152e1d] border border-[#1e3a28] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#7bed8d]/50 transition-colors cursor-pointer"
                      >
                        <option value="Frosted">Frosted</option>
                        <option value="Tinted">Tinted</option>
                        <option value="Reflective">Reflective</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </Tooltip>
                </div>

                {/* Film Company */}
                <div className="space-y-3">
                  <label className="text-[15px] font-medium text-gray-300">Film Company</label>
                  <Tooltip content="Choose a manufacturer for pricing" className="w-full">
                    <div className="relative">
                      <select 
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-[#152e1d] border border-[#1e3a28] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#7bed8d]/50 transition-colors cursor-pointer"
                      >
                        <option value="Menetbered+">Menetbered+</option>
                        <option value="3M">3M</option>
                        <option value="SunTek">SunTek</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <span className="text-gray-500 text-sm">‡</span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </Tooltip>
                </div>
              </div>

              {/* Quote Result */}
              <div className="mt-10 mb-8">
                <div className="text-[15px] text-gray-400 mb-2">*sim quote:</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-[#7bed8d] tracking-tight">£{basePrice.toFixed(2)}</span>
                  <span className="text-sm text-gray-500 font-medium">est</span>
                </div>
              </div>

              <button className="w-full py-4 rounded-xl bg-gradient-to-b from-[#9cf7a9] to-[#6be87e] text-[#0a1910] font-semibold text-lg hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(123,237,141,0.2)] mb-6">
                Calculate Quote
              </button>

              <button className="w-full py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-[15px]">
                Book Consultation
                <Play className="w-3 h-3 fill-current" />
              </button>
            </div>

            {/* Right Panel - Visualizer */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Main Image */}
              <div className="bg-[#0a1910]/40 rounded-[2rem] overflow-hidden flex-1 relative border border-[#1e3a28] group">
                <img 
                  src={customImage || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop"} 
                  alt="Room view" 
                  className="w-full h-full object-cover min-h-[400px]"
                />
                
                {/* Upload Button Overlay */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => {
                      if (!user) {
                        handleLogin();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 transition-colors text-sm font-medium"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload Room Photo'}
                  </button>
                </div>

                {/* Film Overlay based on selection */}
                <div className={cn(
                  "absolute inset-0 transition-all duration-500 pointer-events-none",
                  filmType === 'Frosted' && "backdrop-blur-md bg-white/20",
                  filmType === 'Tinted' && "bg-black/40",
                  filmType === 'Reflective' && "bg-gradient-to-tr from-white/10 to-transparent backdrop-brightness-110"
                )}></div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-3 gap-4">
                {(['Frosted', 'Tinted', 'Reflective'] as FilmType[]).map((type) => (
                  <button 
                    key={type}
                    onClick={() => setFilmType(type)}
                    className={cn(
                      "flex flex-col items-center gap-3 transition-all",
                      filmType === type ? "opacity-100" : "opacity-60 hover:opacity-80"
                    )}
                  >
                    <div className={cn(
                      "w-full aspect-[21/9] rounded-xl overflow-hidden border-2 transition-colors relative",
                      filmType === type ? "border-[#7bed8d]" : "border-transparent"
                    )}>
                      <img 
                        src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=800&auto=format&fit=crop" 
                        alt={type} 
                        className="w-full h-full object-cover"
                      />
                      <div className={cn(
                        "absolute inset-0",
                        type === 'Frosted' && "backdrop-blur-md bg-white/20",
                        type === 'Tinted' && "bg-black/40",
                        type === 'Reflective' && "bg-gradient-to-tr from-white/10 to-transparent backdrop-brightness-110"
                      )}></div>
                    </div>
                    <span className="text-[15px] font-medium text-gray-300">{type}</span>
                  </button>
                ))}
              </div>

              {/* Bottom Bar */}
              <div className="bg-[#0a1910]/60 border border-[#1e3a28] rounded-2xl px-6 py-4 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-[13px] text-gray-400">
                  <Volume2 className="w-4 h-4" />
                  <span>Use instant quote for window film fast instant instent</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-[2px]">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div className="flex gap-1 bg-[#152e1d] px-2 py-1 rounded-md border border-[#1e3a28]">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="bg-[#0f2416]/60 backdrop-blur-xl border border-[#1e3a28] rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#7bed8d]/30 to-transparent"></div>
          
          <div className="max-w-md z-10">
            <h3 className="text-3xl font-bold mb-4 tracking-tight">Instant Quote Calculator</h3>
            <p className="text-gray-400 mb-8 text-[15px] leading-relaxed">
              Get an instant quote for window film installation based on your window dimensions and film type.
            </p>
            <div className="flex items-center gap-4">
              <button className="px-8 py-3.5 rounded-xl bg-gradient-to-b from-[#9cf7a9] to-[#6be87e] text-[#0a1910] font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(123,237,141,0.2)]">
                Get Instant Quote
              </button>
              <button className="w-12 h-12 rounded-full border border-[#1e3a28] flex items-center justify-center hover:bg-[#152e1d] transition-colors text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="w-full md:w-[55%] aspect-[21/9] md:aspect-[16/7] rounded-2xl overflow-hidden relative z-10 border border-[#1e3a28]">
             <img 
                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000&auto=format&fit=crop" 
                alt="Room view" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f2416] via-[#0f2416]/50 to-transparent"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
