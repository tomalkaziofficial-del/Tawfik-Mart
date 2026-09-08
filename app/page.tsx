"use client";

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import WhatsAppButton from './components/WhatsAppButton'; 

// ============================================================================
// 📌 ইন্টারফেস এবং ডাটা স্ট্রাকচার
// ============================================================================

interface Product {
  id: string; 
  name: string; 
  price: string; 
  original_price?: string;
  image_url?: string; 
  image_url_2?: string; 
  image_url_3?: string; 
  image_url_4?: string; 
  description?: string; 
  in_stock?: boolean; 
  tag?: string; 
  category: string;
  brand?: string; 
  color?: string; 
  created_at?: string;
}

interface CartItem extends Product { 
  quantity: number; 
}

interface Order {
  id: string; 
  user_id?: string; 
  customer_name: string; 
  customer_phone: string;
  customer_address: string; 
  total_amount: number; 
  payment_method: string;
  status: string; 
  created_at: string; 
  shipping_charge?: number; 
  items?: CartItem[];
}

interface Review {
  id: string; 
  product_id: string; 
  customer_name: string; 
  rating: number; 
  comment: string; 
  created_at: string; 
}

const categoryMenu = [
  { title: "খিমার প্লাজু সেট", subs: ["প্রিমিয়াম খিমার", "সুতি খিমার"] },
  { title: "ফ্লোর টাচ জিলবাব", subs: ["ওয়ান পার্ট জিলবাব", "টু পার্ট জিলবাব"] },
  { title: "ওয়ান পার্ট জিলবাব", subs: ["সফট লিলেন জিলবাব"] },
  { title: "সালাত লং খিমার", subs: [] },
  { title: "লাক্সারি আবায়া", subs: ["দুবাই চেরি আবায়া"] },
  { title: "নিকাহ নামা ও উপহার", subs: ["নিকাহ নামা", "গিফট বক্স"] }
];

export default function Home() {
  
  // ============================================================================
  // ⚙️ কোর এবং ইউআই স্টেটসমূহ
  // ============================================================================

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>(''); 

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [infoModal, setInfoModal] = useState<{title: string, content: string} | null>(null);
  
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isWishlistLoaded, setIsWishlistLoaded] = useState(false);

  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const [shippingLocation, setShippingLocation] = useState<'inside' | 'outside'>('inside');
  const shippingFee = shippingLocation === 'inside' ? 60 : 120;
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad' | 'Rocket'>('COD');
  const [transactionId, setTransactionId] = useState(''); 
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingPhone, setTrackingPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState<Order[] | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // 🟢 Auth States (Updated for OTP, Google & Math Captcha)
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState({ name: '', email: '', avatar: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [authView, setAuthView] = useState<'OTP' | 'PASSWORD' | 'REGISTER'>('OTP');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [userCaptcha, setUserCaptcha] = useState('');
  const [authLoading, setAuthLoading] = useState(false); 

  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'settings' | 'products' | 'orders'>('settings');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState(''); 
  const [newPrice, setNewPrice] = useState(''); 
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newImageUrl, setNewImageUrl] = useState(''); 
  const [newImageUrl2, setNewImageUrl2] = useState(''); 
  const [newImageUrl3, setNewImageUrl3] = useState(''); 
  const [newImageUrl4, setNewImageUrl4] = useState('');
  const [newDescription, setNewDescription] = useState(''); 
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState(''); 
  const [newColor, setNewColor] = useState(''); 
  const [newTag, setNewTag] = useState(''); 
  const [newInStock, setNewInStock] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const [customSections, setCustomSections] = useState<{id: string, title: string, fontSize: number, imageUrl: string}[]>([]);

  const [storeSettings, setStoreSettings] = useState({
    shop_name: 'Zeenat', 
    phone: '01753564808',
    logo_url: '',
    flashDealActive: true,
    contact_info: 'অফিস: মিরপুর, ঢাকা\nফোন: 01753564808\nইমেইল: support@zeenat.com',
    return_policy: 'পণ্য হাতে পাওয়ার পর যদি কোনো ত্রুটি থাকে, তবে ২৪ ঘণ্টার মধ্যে আমাদের সাথে যোগাযোগ করুন। আমরা দ্রুত রিপ্লেসমেন্টের ব্যবস্থা করব।',
    delivery_policy: 'ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা (১-২ দিন)।\nঢাকার বাইরে ডেলিভারি চার্জ ১২০ টাকা (২-৪ দিন)।',
    endTime: Date.now() + 12 * 60 * 60 * 1000,
    banners: [
      { title: "", subtitle: "", imageUrl: "" }, { title: "", subtitle: "", imageUrl: "" },
      { title: "", subtitle: "", imageUrl: "" }, { title: "", subtitle: "", imageUrl: "" }, { title: "", subtitle: "", imageUrl: "" }
    ],
    category_banners: {} as any
  });
  
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // ============================================================================
  // 🚀 INITIALIZATION & PARSING
  // ============================================================================

  const generateCaptcha = () => {
    setCaptcha({ num1: Math.floor(Math.random() * 10) + 1, num2: Math.floor(Math.random() * 10) + 1 });
    setUserCaptcha('');
  };

  useEffect(() => {
    if (showAuthModal) {
      generateCaptcha();
      setAuthView('OTP');
      setOtpSent(false);
    }
  }, [showAuthModal]);

  useEffect(() => {
    fetchSettings(); 
    fetchProducts();
    
    if (typeof window !== "undefined") {
      const savedSettingsStr = localStorage.getItem('trendifySettings');
      if (savedSettingsStr) {
        try {
          const parsed = JSON.parse(savedSettingsStr);
          if(parsed.banners && Array.isArray(parsed.banners)) {
             parsed.banners = parsed.banners.map((b:any) => typeof b === 'string' ? JSON.parse(b) : b);
          }
          setStoreSettings(prev => ({ ...prev, ...parsed }));
        } catch(e) {}
      }
      
      const savedCart = localStorage.getItem('trendifyCart');
      if (savedCart) setCart(JSON.parse(savedCart));
      setIsCartLoaded(true);

      const savedWishlist = localStorage.getItem('trendifyWishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      setIsWishlistLoaded(true);
    }

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserOrders(session.user.id); 
        setNewReviewName(session.user.email?.split('@')[0] || 'গ্রাহক');
        setUserData({ name: session.user.user_metadata?.full_name || '', email: session.user.email || '', avatar: session.user.user_metadata?.avatar_url || '' });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_: any, session: any) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserOrders(session.user.id); 
        setNewReviewName(session.user.email?.split('@')[0] || 'গ্রাহক');
      } else { 
        setUserOrders([]); 
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { 
    if (isCartLoaded && typeof window !== "undefined") localStorage.setItem('trendifyCart', JSON.stringify(cart)); 
  }, [cart, isCartLoaded]);

  useEffect(() => { 
    if (isWishlistLoaded && typeof window !== "undefined") localStorage.setItem('trendifyWishlist', JSON.stringify(wishlist)); 
  }, [wishlist, isWishlistLoaded]);

  const activeBanners = storeSettings.banners ? storeSettings.banners.filter(b => b && b.imageUrl) : [];

  useEffect(() => {
    if (!storeSettings.flashDealActive) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = storeSettings.endTime - now;
      if (distance < 0) { clearInterval(timer); return; }
      setTimeLeft({ 
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), 
        seconds: Math.floor((distance % (1000 * 60)) / 1000) 
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [storeSettings.flashDealActive, storeSettings.endTime]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const bannerInterval = setInterval(() => { 
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length); 
    }, 5000);
    return () => clearInterval(bannerInterval);
  }, [activeBanners.length]);

  useEffect(() => { 
    if (viewingProduct) { fetchReviews(viewingProduct.id); setSelectedQuantity(1); } 
  }, [viewingProduct]);

  // ============================================================================
  // 📥 DATA FETCHING
  // ============================================================================
  
  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (data) {
        let safeBanners = data.banners || [];
        if (typeof safeBanners === 'string') { try { safeBanners = JSON.parse(safeBanners); } catch(e) { safeBanners = []; } }
        if (Array.isArray(safeBanners)) { safeBanners = safeBanners.map((b:any) => typeof b === 'string' ? JSON.parse(b) : b); } else { safeBanners = []; }
        while(safeBanners.length < 5) { safeBanners.push({title: "", subtitle: "", imageUrl: ""}); }
        
        let safeCatBanners = data.category_banners || {};
        if (typeof safeCatBanners === 'string') { try { safeCatBanners = JSON.parse(safeCatBanners); } catch(e) { safeCatBanners = {}; } }

        let loadedSections = safeCatBanners['CUSTOM_SECTIONS'];
        if (typeof loadedSections === 'string') { try { loadedSections = JSON.parse(loadedSections); } catch(e) { loadedSections = null; } }
        
        if (!loadedSections || !Array.isArray(loadedSections)) {
            loadedSections = [];
            Object.keys(safeCatBanners).forEach(key => {
                if (!['WEBSITE_BG', 'TXT_CONTACT', 'TXT_RETURN', 'TXT_DELIVERY', 'FLASH_ACTIVE', 'CUSTOM_SECTIONS'].includes(key)) {
                    loadedSections.push({ id: Date.now().toString() + Math.random(), title: key, fontSize: 36, imageUrl: safeCatBanners[key] });
                }
            });
        }
        setCustomSections(loadedSections);

        setStoreSettings(prev => ({ 
          ...prev, 
          ...data, 
          shop_name: data.shop_name || 'Zeenat', 
          phone: data.phone || '01753564808', 
          banners: safeBanners, 
          category_banners: safeCatBanners,
          contact_info: safeCatBanners['TXT_CONTACT'] || prev.contact_info,
          return_policy: safeCatBanners['TXT_RETURN'] || prev.return_policy,
          delivery_policy: safeCatBanners['TXT_DELIVERY'] || prev.delivery_policy,
          flashDealActive: safeCatBanners['FLASH_ACTIVE'] !== undefined ? safeCatBanners['FLASH_ACTIVE'] : true,
        }));
      }
    } catch(err) {}
  };

  const fetchProducts = async () => {
    try { setLoading(true); const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }); if (error) throw error; if (data) setProducts(data); } catch(err) {} finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch(err) {}
  };

  const fetchUserOrders = async (userId: string) => {
    try {
      const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }); 
      if (data) setUserOrders(data);
    } catch(err) {}
  };

  const fetchReviews = async (productId: string) => {
    try {
      const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
      if (data) setProductReviews(data);
    } catch (error) {}
  };

  useEffect(() => { if(showAdminDashboard && adminTab === 'orders') fetchOrders(); }, [showAdminDashboard, adminTab]);

  // ============================================================================
  // 🛍️ CART & CHECKOUT LOGIC
  // ============================================================================
  
  const formatPrice = (price?: string) => price ? (price.toString().includes('৳') ? price : `${price} ৳`) : '';
  const getNumericPrice = (priceStr: string) => Number(priceStr.replace(/[^0-9.-]+/g,"")) || 0;
  
  const calculateDiscount = (original: string, current: string) => {
    const o = getNumericPrice(original), c = getNumericPrice(current);
    if (o > c && o > 0) return Math.round(((o - c) / o) * 100); return 0;
  };

  const addToCart = (product: Product, qty: number = 1) => {
    if(!product.in_stock) return alert("দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টকে নেই!");
    const existing = cart.find(item => item.id === product.id);
    if (existing) setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item));
    else setCart([...cart, { ...product, quantity: qty }]);
  };

  const toggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); const existing = wishlist.find(item => item.id === product.id);
    if (existing) setWishlist(wishlist.filter(item => item.id !== product.id)); else setWishlist([...wishlist, product]);
  };

  const handleDirectOrder = (product: Product, qty: number = 1, e?: React.MouseEvent) => {
    if(e) e.stopPropagation(); if(!product.in_stock) return alert("দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টকে নেই!");
    const existing = cart.find(item => item.id === product.id);
    if (!existing) setCart([...cart, { ...product, quantity: qty }]);
    setViewingProduct(null); setIsCartOpen(false); setIsCheckoutOpen(true); 
  };

  const updateQuantity = (id: string, delta: number) => { setCart(cart.map(item => { if (item.id === id) { const newQty = item.quantity + delta; return newQty > 0 ? { ...item, quantity: newQty } : item; } return item; })); };
  const removeFromCart = (id: string) => setCart(cart.filter((item) => item.id !== id));
  const removeFromWishlist = (id: string) => setWishlist(wishlist.filter((item) => item.id !== id));

  const itemsSubtotal = cart.reduce((total, item) => total + (getNumericPrice(item.price) * item.quantity), 0);
  const cartTotal = itemsSubtotal + shippingFee;
  const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if(cart.length === 0) return alert("আপনার ব্যাগ খালি!");
    const finalPaymentMethodText = paymentMethod === 'COD' ? 'Cash on Delivery' : `${paymentMethod} (TrxID: ${transactionId})`;
    await processOrderExecution(finalPaymentMethodText);
  };

  const processOrderExecution = async (payMethodType: string) => {
    setIsCheckingOut(true);
    try {
      const orderData: any = { 
        customer_name: customerName, customer_phone: customerPhone, 
        customer_address: customerAddress + ` [Shipping: ${shippingLocation === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}]`, 
        total_amount: cartTotal, payment_method: payMethodType, items: cart, status: 'PENDING', shipping_charge: shippingFee 
      };
      if (user && user.id) orderData.user_id = user.id;

      const { error } = await supabase.from('orders').insert([orderData]); if (error) throw error;
      if (user && user.id) fetchUserOrders(user.id);
      
      setCart([]); setIsCheckoutOpen(false); setIsCartOpen(false); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setTransactionId(''); alert("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
    } catch (error: any) { alert("অর্ডার প্লেস করতে সমস্যা হয়েছে: " + error.message); } finally { setIsCheckingOut(false); }
  };

  // ============================================================================
  // 🔐 AUTH (OTP + GOOGLE + EMAIL) & TRACKING
  // ============================================================================
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true);
    try {
      if (authView === 'PASSWORD') { 
         const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }); 
         if (error) throw error; alert("স্বাগতম!"); setShowAuthModal(false); 
      } else { 
         const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword }); 
         if (error) throw error; alert("অ্যাকাউন্ট তৈরি হয়েছে!"); setShowAuthModal(false); 
      }
    } catch (error: any) { alert(error.message); } finally { setAuthLoading(false); }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert("Google Login Error: " + error.message);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
     e.preventDefault();
     if (parseInt(userCaptcha) !== captcha.num1 + captcha.num2) {
         alert("ক্যাপচা (যোগফল) ভুল হয়েছে!");
         generateCaptcha();
         return;
     }
     setAuthLoading(true);
     try {
         const phoneForOtp = authPhone.startsWith('+88') ? authPhone : '+88' + authPhone;
         const { error } = await supabase.auth.signInWithOtp({ phone: phoneForOtp });
         if (error) throw error;
         setOtpSent(true);
         alert("OTP পাঠানো হয়েছে!");
     } catch(error: any) {
         alert("SMS Provider Setup Error: " + error.message + "\n\n(Supabase-এ SMS Provider কনফিগার করা না থাকলে Email/Google বাটন ব্যবহার করুন)");
     } finally {
         setAuthLoading(false);
     }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      try {
          const phoneForOtp = authPhone.startsWith('+88') ? authPhone : '+88' + authPhone;
          const { error } = await supabase.auth.verifyOtp({ phone: phoneForOtp, token: authOtpCode, type: 'sms' });
          if (error) throw error;
          alert("লগইন সফল!");
          setShowAuthModal(false);
      } catch(error: any) {
          alert(error.message);
      } finally {
          setAuthLoading(false);
      }
  };

  const handleLogout = async () => { const { error } = await supabase.auth.signOut(); if (!error) { alert("লগআউট সফল।"); setShowProfileModal(false); window.location.reload(); } };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault(); if (!trackingPhone) return; setIsTracking(true);
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('customer_phone', trackingPhone).order('created_at', { ascending: false });
      if (error) throw error; setTrackedOrders(data || []);
    } catch (error) { alert("অর্ডার খুঁজে পাওয়া যায়নি।"); } finally { setIsTracking(false); }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!viewingProduct) return; setIsReviewSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert([{ product_id: viewingProduct.id, customer_name: newReviewName || 'গ্রাহক', rating: newReviewRating, comment: newReviewComment }]);
      if (error) throw error; alert("রিভিউ সফলভাবে সাবমিট হয়েছে!"); setNewReviewComment(''); fetchReviews(viewingProduct.id); 
    } catch (error) { alert("রিভিউ সাবমিট ব্যর্থ হয়েছে।"); } finally { setIsReviewSubmitting(false); }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => { try { await supabase.from('orders').update({ status: newStatus }).eq('id', id); fetchOrders(); } catch(err) {} };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PENDING': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
          case 'CONFIRMED': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
          case 'PROCESSING': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
          case 'SHIPPED': return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
          case 'DELIVERED': return 'text-green-500 border-green-500/30 bg-green-500/10';
          case 'CANCELLED': return 'text-red-500 border-red-500/30 bg-red-500/10';
          default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
      }
  }

  // ============================================================================
  // ⚙️ ADMIN UPLOAD & SAVE FUNCTIONS 
  // ============================================================================
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string, index?: number, catName?: string) => {
    const file = e.target.files?.[0]; if(!file) return; 
    setUploadingType(type === 'custom_section' ? `custom_${catName}` : type);
    
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_img_${Math.floor(Math.random() * 10000)}.${fileExt}`;
    
    try {
      const { error: uploadError } = await supabase.storage.from('products').upload(cleanFileName, file);
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(cleanFileName);
      
      if (type === 'logo') {
         const { error: dbError } = await supabase.from('store_settings').update({ logo_url: publicUrl }).eq('id', 1);
         if(dbError) throw new Error(`DB Update Error: ${dbError.message}`);
      } 
      else if (type === 'banner' && index !== undefined) {
         let newBanners = [...storeSettings.banners];
         newBanners = newBanners.map(b => typeof b === 'string' ? JSON.parse(b) : (b || {title: "", subtitle: "", imageUrl: ""}));
         while(newBanners.length <= index) { newBanners.push({title: "", subtitle: "", imageUrl: ""}); }
         newBanners[index].imageUrl = publicUrl;
         const { error: dbError } = await supabase.from('store_settings').update({ banners: newBanners }).eq('id', 1);
         if(dbError) throw new Error(`DB Update Error: ${dbError.message}`);
      } 
      else if (type === 'website_bg') {
         const newCatBanners = { ...storeSettings.category_banners, ['WEBSITE_BG']: publicUrl };
         const { error: dbError } = await supabase.from('store_settings').update({ category_banners: newCatBanners }).eq('id', 1);
         if(dbError) throw new Error(`DB Update Error: ${dbError.message}`);
      }
      else if (type === 'custom_section' && catName) {
         setCustomSections(prev => prev.map(s => s.id === catName ? { ...s, imageUrl: publicUrl } : s));
         alert("ব্যানার আপলোড হয়েছে! দয়া করে সেটিং প্যানেলের একদম নিচে Save বাটনে ক্লিক করে এটি চূড়ান্তভাবে সেভ করুন।");
         setUploadingType(null);
         return; 
      } 
      else if (type === 'product1') setNewImageUrl(publicUrl); else if (type === 'product2') setNewImageUrl2(publicUrl); else if (type === 'product3') setNewImageUrl3(publicUrl); else if (type === 'product4') setNewImageUrl4(publicUrl);
      
      fetchSettings(); alert("সফলভাবে আপলোড হয়েছে!");
    } catch (error: any) { alert("আপলোড ব্যর্থ হয়েছে! কারণ:\n" + error.message); } finally { setUploadingType(null); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCatBanners = {
         ...storeSettings.category_banners,
         'TXT_CONTACT': storeSettings.contact_info,
         'TXT_RETURN': storeSettings.return_policy,
         'TXT_DELIVERY': storeSettings.delivery_policy,
         'FLASH_ACTIVE': storeSettings.flashDealActive,
         'CUSTOM_SECTIONS': customSections 
      };
      const { error } = await supabase.from('store_settings').update({ shop_name: storeSettings.shop_name, phone: storeSettings.phone, category_banners: newCatBanners }).eq('id', 1);
      if(error) throw error; 
      alert("সেটিংস সফলভাবে সেভ হয়েছে!"); fetchSettings();
    } catch (error: any) { alert("আসল সমস্যাটি হলো:\n" + (error.message || JSON.stringify(error))); }
  };

  const openAddModal = () => { 
    setEditingProductId(null); setNewName(''); setNewPrice(''); setNewOriginalPrice(''); setNewImageUrl(''); setNewImageUrl2(''); setNewImageUrl3(''); setNewImageUrl4('');
    setNewDescription(''); setNewCategory(''); setNewBrand(''); setNewColor(''); setNewTag(''); setNewInStock(true); setShowProductModal(true); setShowAdminDashboard(false); 
  };
  
  const openEditModal = (product: Product, e: React.MouseEvent) => { 
    e.stopPropagation(); setEditingProductId(product.id); setNewName(product.name); setNewPrice(product.price); setNewOriginalPrice(product.original_price || ''); 
    setNewImageUrl(product.image_url || ''); setNewImageUrl2(product.image_url_2 || ''); setNewImageUrl3(product.image_url_3 || ''); setNewImageUrl4(product.image_url_4 || '');
    setNewDescription(product.description || ''); setNewCategory(product.category); setNewBrand(product.brand || ''); setNewColor(product.color || ''); setNewTag(product.tag || ''); setNewInStock(product.in_stock !== false); setShowProductModal(true); 
  };
  
  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => { 
    e.stopPropagation(); if (!window.confirm("সত্যিই কি প্রোডাক্টটি ডিলিট করতে চান?")) return; 
    try { await supabase.from('products').delete().eq('id', id); fetchProducts(); } catch (error) { alert("ডিলিট ব্যর্থ।"); } 
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const productData = { 
        name: newName, price: newPrice, original_price: newOriginalPrice || null, 
        image_url: newImageUrl || null, image_url_2: newImageUrl2 || null, image_url_3: newImageUrl3 || null, image_url_4: newImageUrl4 || null, 
        description: newDescription || null, category: newCategory || "খিমার প্লাজু সেট", in_stock: newInStock, tag: newTag, brand: newBrand || null, color: newColor || null
      };
      if (editingProductId) await supabase.from('products').update(productData).eq('id', editingProductId); else await supabase.from('products').insert([productData]);
      setShowProductModal(false); fetchProducts(); 
    } catch (error: any) { alert("Error saving product: " + error.message); } finally { setIsSaving(false); }
  };

  const dynamicSidebarCategories = Array.from(new Set([...categoryMenu.map(c=>c.title), ...products.map(p=>p.category)]));
  const filteredProducts = products.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const bgImage = storeSettings.category_banners?.['WEBSITE_BG'];
  const renderedCategories = new Set<string>();

  // ============================================================================
  // 🟢 ELITE PRODUCT CARD UI (WITH GOLDEN GLOW)
  // ============================================================================
  
  const renderProductCard = (item: Product, isAdminView: boolean = false) => {
    const discount = item.original_price ? calculateDiscount(item.original_price, item.price) : 0;
    const inWishlist = wishlist.some(w => w.id === item.id);

    return (
      <div key={item.id} className="bg-[#1A1A1A]/90 backdrop-blur-sm border border-[#333333] hover:border-[#D4AF37] flex flex-col transition-all duration-300 group rounded-md relative cursor-pointer w-[160px] md:w-[200px] shrink-0 overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]" onClick={() => { setViewingProduct(item); setActiveImage(item.image_url || ''); setSelectedQuantity(1); }}>
        
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-[#000000] text-[#D4AF37] text-[10px] font-bold px-1 py-1 rounded-full z-10 flex flex-col items-center justify-center h-9 w-9 shadow-md leading-none border border-[#D4AF37]/50">
            {discount}%<span className="text-[7px] font-normal text-white mt-0.5">ছাড়</span>
          </div>
        )}

        <button onClick={(e) => toggleWishlist(item, e)} className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm p-1.5 rounded-full hover:bg-black border border-white/10 shadow-sm transition">
          {inWishlist ? <span className="text-red-500 text-sm">❤️</span> : <span className="text-gray-400 text-sm hover:text-white">🤍</span>}
        </button>
        
        {isAdminView && (
          <div className="absolute top-12 left-2 z-10 flex flex-col gap-1">
             <button onClick={(e) => openEditModal(item, e)} className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded shadow">Edit</button>
             <button onClick={(e) => handleDeleteProduct(item.id, e)} className="bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow">Delete</button>
          </div>
        )}

        <div className="h-56 md:h-64 w-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
             {item.image_url ? (
               <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-90 group-hover:opacity-100" />
             ) : (
               <span className="text-gray-500 text-xs font-medium">No Image</span>
             )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow bg-[#1A1A1A]/90 border-t border-[#333333]">
          <h4 className="text-[13px] text-[#EAEAEA] text-center font-bold mb-1.5 line-clamp-2 leading-snug tracking-wide">{item.name}</h4>
          
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4 mt-auto">
            {item.original_price && <span className="text-[11px] text-gray-500 line-through font-medium">{formatPrice(item.original_price)}</span>}
            <span className="text-[#D4AF37] font-black text-sm">{formatPrice(item.price)}</span>
          </div>
          
          <div className="mt-auto flex flex-col gap-2">
            <button onClick={(e) => handleDirectOrder(item, 1, e)} disabled={!item.in_stock} className="w-full bg-[#D4AF37] text-[#111111] text-[11px] font-bold py-2.5 rounded-sm hover:bg-white hover:text-[#111111] transition-colors duration-300 flex items-center justify-center gap-1 uppercase tracking-widest shadow-[0_0_10px_rgba(212,175,55,0.2)]">
              ⚡ অর্ডার করুন
            </button>
            <button onClick={(e) => { e.stopPropagation(); addToCart(item, 1); setIsCartOpen(true); }} disabled={!item.in_stock} className="w-full bg-transparent border border-[#D4AF37] text-[#D4AF37] text-[11px] font-bold py-2 rounded-sm hover:bg-[#D4AF37] hover:text-[#111111] transition-colors duration-300 flex items-center justify-center gap-1 uppercase tracking-wider">
              🛒 ব্যাগে যোগ
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    // 🟢 INSANE ELITE THEME: Pure Black or Custom Background
    <main className="min-h-screen text-[#EAEAEA] font-sans selection:bg-[#D4AF37] selection:text-[#111111] relative overflow-x-hidden scroll-smooth" 
          style={{ 
            backgroundColor: bgImage ? "#000000" : "#111111",
            backgroundImage: bgImage ? `url('${bgImage}')` : "none",
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center'
          }}>
      
      {/* 🟢 CRYSTAL CLEAR GLASSMORPHISM (Dark overlay makes image pop and text readable) */}
      <div className={`relative z-10 min-h-screen pb-16 ${bgImage ? 'bg-black/40 backdrop-blur-[4px]' : 'bg-[#111111]'}`}>
        
        {/* Top Header */}
        <div className="bg-[#0a0a0a] text-[#D4AF37] text-[10px] py-2 px-6 md:px-12 flex justify-between items-center border-b border-[#333333]">
          <div className="flex gap-4 items-center">
            <span className="font-medium tracking-wider">☎ হেল্পলাইন: {storeSettings.phone}</span>
            <span className="hidden md:inline uppercase tracking-widest text-[9px] font-bold border-l border-[#333333] pl-4">Premium Modest Collection</span>
          </div>
          <div className="flex gap-4 font-bold tracking-widest uppercase">
             <button onClick={() => { setShowTrackingModal(true); setTrackedOrders(null); setTrackingPhone(''); }} className="hover:text-white transition-colors duration-300">ট্র্যাক অর্ডার</button>
          </div>
        </div>

        {/* Main Elite Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/85 backdrop-blur-md border-b border-[#D4AF37]/30 px-6 md:px-12 py-4 shadow-[0_4px_30px_rgb(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(true)} className="text-3xl text-[#D4AF37] hover:text-white transition-colors duration-300">
              ☰
            </button>

            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setActiveCategory('All'); window.scrollTo(0,0);}}>
              <div className="w-12 h-12 bg-[#111111] text-[#D4AF37] flex items-center justify-center font-bold text-2xl rounded-sm shadow-inner overflow-hidden border border-[#D4AF37]/50">
                {storeSettings.logo_url ? <img src={storeSettings.logo_url} className="w-full h-full object-cover"/> : storeSettings.shop_name.charAt(0)}
              </div>
              <div className="flex flex-col">
                 <h1 className="text-2xl font-serif font-bold tracking-widest text-[#D4AF37] leading-none uppercase">{storeSettings.shop_name}</h1>
                 <span className="text-[9px] text-[#AAAAAA] uppercase tracking-widest mt-1.5 font-bold">Loyalty is the capital of business</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/5 relative flex shadow-sm">
            <input type="text" placeholder="পণ্য খুঁজুন এখানে..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#D4AF37]/30 py-3 pl-4 pr-10 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none rounded-l-sm transition-colors" />
            <button className="bg-[#D4AF37] text-[#111111] px-6 rounded-r-sm hover:bg-white transition-colors duration-300 text-lg border border-transparent">🔍</button>
          </div>

          <div className="flex items-center gap-7">
            <div className="relative group cursor-pointer text-xl text-[#D4AF37] hover:text-white transition-colors">
              <span onClick={() => { if(user) setShowProfileModal(true); else setShowAuthModal(true); }}>👤</span>
            </div>
            
            <button onClick={() => setIsWishlistOpen(true)} className="relative flex items-center text-xl text-[#D4AF37] hover:text-white transition-colors">
              ❤️{wishlist.length > 0 && <span className="absolute -top-2 -right-3 bg-[#111111] text-[#D4AF37] text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-[#D4AF37]">{wishlist.length}</span>}
            </button>

            <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 text-2xl text-[#D4AF37] hover:text-white transition-colors">
              🛒{cart.length > 0 && <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{totalItemsCount}</span>}
            </button>
          </div>
        </header>

        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-8 flex flex-col gap-10">
          
          {/* Main Slider */}
          {storeSettings.flashDealActive && activeCategory === 'All' && !searchQuery && activeBanners.length > 0 && (
            <div className="w-full h-48 md:h-[450px] shadow-[0_10px_40px_rgb(0,0,0,0.8)] rounded-sm relative overflow-hidden bg-[#0a0a0a] group border border-[#D4AF37]/20">
              {activeBanners.map((banner, idx) => (
                <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center ${idx === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} style={{ backgroundImage: `url('${banner.imageUrl}')` }}>
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              ))}
              
              <div className="absolute top-6 left-6 z-20 bg-[#0a0a0a]/80 backdrop-blur-md text-white px-6 py-4 rounded-sm border border-[#D4AF37]/50 flex flex-col items-center shadow-2xl">
                 <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mb-3">Flash Deal Ends In</span>
                 <div className="flex gap-3 text-2xl font-bold font-mono tracking-wider">
                    <div className="flex flex-col items-center"><span className="text-white">{String(timeLeft.hours).padStart(2, '0')}</span><span className="text-[8px] text-gray-400 mt-1 uppercase">Hours</span></div><span className="text-[#D4AF37] pb-2">:</span>
                    <div className="flex flex-col items-center"><span className="text-white">{String(timeLeft.minutes).padStart(2, '0')}</span><span className="text-[8px] text-gray-400 mt-1 uppercase">Mins</span></div><span className="text-[#D4AF37] pb-2">:</span>
                    <div className="flex flex-col items-center"><span className="text-white">{String(timeLeft.seconds).padStart(2, '0')}</span><span className="text-[8px] text-gray-400 mt-1 uppercase">Secs</span></div>
                 </div>
              </div>

              {activeBanners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                  {activeBanners.map((_, idx) => (
                    <div key={idx} onClick={() => setCurrentBannerIndex(idx)} className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 shadow-md ${idx === currentBannerIndex ? 'bg-[#D4AF37] scale-125' : 'bg-white/30 hover:bg-white/80'}`}></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🟢 CATEGORY BACK BUTTON */}
          {activeCategory !== 'All' && (
            <div className="w-full flex justify-start mb-2">
                <button onClick={() => {setActiveCategory('All'); window.scrollTo(0,0);}} className="flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-6 py-3 rounded-sm shadow-md hover:bg-[#D4AF37] hover:text-[#111111] transition-colors font-bold uppercase tracking-widest text-xs border border-[#D4AF37]/40">
                    <span className="text-xl leading-none -mt-0.5">←</span> ফিরে যান (Back to Home)
                </button>
            </div>
          )}

          {/* Category Sections (ELITE DARK CONTAINERS) */}
          <div id="products-section" className="w-full mt-2 flex flex-col gap-20">
             {loading ? (
               <div className="text-center py-20 text-[#D4AF37] text-lg font-bold tracking-widest uppercase animate-pulse">Loading Elite Collection...</div>
             ) : (
               <>
                 {/* 🟢 RENDER CUSTOM SECTIONS FIRST */}
                 {customSections.map(section => {
                    renderedCategories.add(section.title);
                    if (activeCategory !== 'All' && activeCategory !== section.title) return null;
                    
                    const catProducts = filteredProducts.filter(item => item.category === section.title || categoryMenu.find(c=>c.title===section.title)?.subs.includes(item.category));
                    
                    if (catProducts.length === 0 && !section.imageUrl) return null;

                    return (
                      <div key={section.id} className="w-full bg-[#111111]/70 backdrop-blur-md p-5 md:p-10 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-[#D4AF37]/30">
                        <div className="flex flex-col items-center mb-10">
                          <div className="w-full flex justify-between items-end border-b-2 border-[#D4AF37]/40 pb-4 mb-4">
                            <h2 className="font-serif font-bold text-[#D4AF37] tracking-wide drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" style={{ fontSize: `${section.fontSize || 36}px` }}>
                               {section.title || "New Section"}
                            </h2>
                            <button onClick={() => {setActiveCategory(section.title); window.scrollTo(0,0);}} className="bg-transparent text-[#D4AF37] border border-[#D4AF37] text-[10px] px-6 py-2.5 font-bold rounded-sm shadow-sm hover:bg-[#D4AF37] hover:text-[#111111] transition-colors duration-300 uppercase tracking-widest">View All →</button>
                          </div>
                        </div>
                        
                        {section.imageUrl && activeCategory === 'All' && (
                          <div className="w-full mb-10 shadow-lg rounded-sm overflow-hidden bg-[#0a0a0a] border border-[#D4AF37]/20">
                            <img src={section.imageUrl} alt={section.title} className="w-full h-auto object-cover max-h-[350px] opacity-90 hover:opacity-100 transition-opacity duration-500" />
                          </div>
                        )}

                        {catProducts.length === 0 ? (
                           <div className="text-center py-16 bg-[#0a0a0a]/50 border border-dashed border-[#333333] rounded-sm">
                              <p className="text-gray-500 font-bold tracking-widest uppercase">এই সেকশনে এখনো কোনো প্রোডাক্ট যুক্ত করা হয়নি</p>
                           </div>
                        ) : (
                           <div className={`flex gap-5 md:gap-8 pb-6 pt-2 custom-scrollbar justify-start ${activeCategory === 'All' ? 'overflow-x-auto' : 'flex-wrap'}`}>
                             {catProducts.map(item => renderProductCard(item))}
                           </div>
                        )}
                      </div>
                    );
                 })}

                 {/* 🟢 RENDER REMAINING REGULAR CATEGORIES */}
                 {dynamicSidebarCategories.map(catTitle => {
                    if (renderedCategories.has(catTitle)) return null;
                    if (activeCategory !== 'All' && activeCategory !== catTitle) return null;
                    
                    const catProducts = filteredProducts.filter(item => item.category === catTitle || categoryMenu.find(c=>c.title===catTitle)?.subs.includes(item.category));
                    if (catProducts.length === 0) return null;

                    return (
                      <div key={catTitle} className="w-full bg-[#111111]/70 backdrop-blur-md p-5 md:p-10 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-[#D4AF37]/30">
                        <div className="flex flex-col items-center mb-10">
                          <div className="w-full flex justify-between items-end border-b-2 border-[#D4AF37]/40 pb-4 mb-4">
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37] tracking-wide drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{catTitle}</h2>
                            <button onClick={() => {setActiveCategory(catTitle); window.scrollTo(0,0);}} className="bg-transparent text-[#D4AF37] border border-[#D4AF37] text-[10px] px-6 py-2.5 font-bold rounded-sm shadow-sm hover:bg-[#D4AF37] hover:text-[#111111] transition-colors duration-300 uppercase tracking-widest">View All →</button>
                          </div>
                        </div>
                        
                        <div className={`flex gap-5 md:gap-8 pb-6 pt-2 custom-scrollbar justify-start ${activeCategory === 'All' ? 'overflow-x-auto' : 'flex-wrap'}`}>
                          {catProducts.map(item => renderProductCard(item))}
                        </div>
                      </div>
                    );
                 })}
               </>
             )}
          </div>
        </section>

        {/* Elite Footer */}
        <footer className="border-t border-[#D4AF37]/30 bg-[#0a0a0a]/90 backdrop-blur-md pb-10 pt-16 relative z-10 shadow-inner mt-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-sm text-gray-400">
            <div>
              <h4 className="font-serif font-bold text-[#D4AF37] text-2xl mb-5 tracking-widest uppercase drop-shadow-md">{storeSettings.shop_name}</h4>
              <p className="leading-relaxed mb-4 font-medium max-w-sm">বাংলাদেশের অন্যতম সেরা প্রিমিয়াম লাইফস্টাইল এবং ফ্যাশন অনলাইন শপ। আমরা বিশ্বাস করি মডেস্টি এবং আভিজাত্য একে অপরের পরিপূরক।</p>
            </div>
            <div>
              <h4 className="font-bold text-[#EAEAEA] mb-5 uppercase text-xs tracking-widest border-b border-[#333333] pb-2 inline-block">Contact Us</h4>
              <p className="mb-3 hover:text-[#D4AF37] transition cursor-pointer font-medium" onClick={() => setInfoModal({title: 'যোগাযোগ', content: storeSettings.contact_info})}>📍 যোগাযোগ তথ্য</p>
              <p className="mb-3 text-gray-500">📞 ফোন: {storeSettings.phone}</p>
            </div>
            <div>
              <h4 className="font-bold text-[#EAEAEA] mb-5 uppercase text-xs tracking-widest border-b border-[#333333] pb-2 inline-block">Policies</h4>
              <p className="mb-3 hover:text-[#D4AF37] transition cursor-pointer font-medium" onClick={() => setInfoModal({title: 'রিটার্ন পলিসি', content: storeSettings.return_policy})}>রিটার্ন পলিসি</p>
              <p className="mb-3 hover:text-[#D4AF37] transition cursor-pointer font-medium" onClick={() => setInfoModal({title: 'ডেলিভারি পলিসি', content: storeSettings.delivery_policy})}>ডেলিভারি পলিসি</p>
            </div>
          </div>
        </footer>

      </div> 
      {/* END OF MAIN CONTENT WRAPPER */}

      {/* ============================================================================
          🪟 FIXED ELEMENTS & MODALS (DARK THEME)
          ============================================================================ */}

      <WhatsAppButton />

      {/* Admin Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a] text-[#D4AF37] border-t border-[#D4AF37]/50 z-[250] flex justify-between items-center px-6 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span> Admin Mode
        </div>
        <div className="flex gap-4">
           <button onClick={() => { setEditingProductId(null); setShowProductModal(true); setShowAdminDashboard(false); }} className="bg-[#D4AF37] text-[#111111] px-5 py-2 rounded-sm text-xs font-bold hover:bg-white transition-colors shadow-sm tracking-wider uppercase">+ Add Product</button>
           <button onClick={() => setShowAdminDashboard(true)} className="bg-transparent border border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-sm text-xs font-bold hover:bg-[#D4AF37] hover:text-[#111111] transition-colors shadow-sm tracking-wider uppercase">⚙️ Master Settings</button>
        </div>
      </div>

      {/* 🟢 INFO MODAL FOR SIDEBAR PAGES */}
      {infoModal && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-[#111111] border border-[#D4AF37]/50 max-w-2xl w-full p-8 md:p-10 relative rounded-sm shadow-2xl">
              <button onClick={() => setInfoModal(null)} className="absolute top-5 right-6 text-3xl hover:text-red-500 text-gray-500 transition-colors">✕</button>
              <h3 className="text-2xl font-serif font-bold mb-6 border-b border-[#333333] pb-3 text-[#D4AF37] uppercase tracking-widest">{infoModal.title}</h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                 {infoModal.content}
              </div>
           </div>
        </div>
      )}

      {/* 🟢 ELITE SIDEBAR MENU */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 z-[290] bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed top-0 left-0 w-[280px] md:w-[320px] h-full bg-[#111111] z-[300] shadow-[10px_0_30px_rgb(0,0,0,0.8)] flex flex-col transform transition-transform duration-300 border-r border-[#D4AF37]/30">
            
            <div className="p-5 flex justify-between items-center bg-[#0a0a0a] text-[#D4AF37] shadow-md border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-[#1A1A1A] text-[#D4AF37] flex items-center justify-center font-bold text-2xl rounded-sm shadow-inner overflow-hidden border border-[#D4AF37]/20">
                   {storeSettings.logo_url ? <img src={storeSettings.logo_url} className="w-full h-full object-cover"/> : storeSettings.shop_name.charAt(0)}
                 </div>
                 <span className="font-serif font-bold tracking-widest text-lg uppercase">{storeSettings.shop_name}</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-[#D4AF37] hover:text-white text-3xl leading-none transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar py-5 text-[14px] font-bold text-[#EAEAEA]">
               <div className="px-6 py-3.5 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 tracking-wide" onClick={() => {setActiveCategory('All'); setIsSidebarOpen(false); window.scrollTo(0,0);}}><span className="text-xl">⌂</span> হোম</div>
               <div className="px-6 py-3.5 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 tracking-wide" onClick={() => setIsSidebarOpen(false)}><span className="text-xl">⚡</span> ফ্লাশ সেল</div>
               <div className="px-6 py-3.5 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 tracking-wide" onClick={() => setIsSidebarOpen(false)}><span className="text-xl">✨</span> নতুন পণ্য</div>
               <div className="px-6 py-3.5 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 tracking-wide" onClick={() => setIsSidebarOpen(false)}><span className="text-xl">🔥</span> অফার</div>
               
               <div className="my-5 border-t border-[#333333]"></div>
               <div className="px-6 py-2 text-[10px] text-gray-500 uppercase tracking-widest font-black">Categories</div>
               {dynamicSidebarCategories.map((cat, i) => (
                 <div key={i} className="px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 font-semibold tracking-wide" onClick={() => {setActiveCategory(cat); setIsSidebarOpen(false); window.scrollTo(0,0);}}>
                   <span className="text-[12px] text-[#D4AF37]">▶</span> {cat}
                 </div>
               ))}
               
               <div className="my-5 border-t border-[#333333]"></div>
               <div className="px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 tracking-wide" onClick={() => { setInfoModal({title: 'যোগাযোগ', content: storeSettings.contact_info}); setIsSidebarOpen(false); }}>
                  <span className="text-lg">✉</span> যোগাযোগ
               </div>
               <div className="px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 tracking-wide" onClick={() => { setInfoModal({title: 'রিটার্ন পলিসি', content: storeSettings.return_policy}); setIsSidebarOpen(false); }}>
                  <span className="text-lg">🛡</span> রিটার্ন পলিসি
               </div>
               <div className="px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-4 tracking-wide" onClick={() => { setInfoModal({title: 'ডেলিভারি পলিসি', content: storeSettings.delivery_policy}); setIsSidebarOpen(false); }}>
                  <span className="text-lg">🚚</span> ডেলিভারি পলিসি
               </div>
               
               <div className="mt-8 mx-5 px-4 py-4 bg-[#1A1A1A] text-[#D4AF37] text-center rounded-sm shadow-lg border border-[#D4AF37]/50 font-bold tracking-widest cursor-pointer hover:bg-[#D4AF37] hover:text-[#111111] transition-colors duration-300">
                  📞 {storeSettings.phone}
               </div>
            </div>
          </div>
        </>
      )}

      {/* 🟢 PERFECT SINGLE PRODUCT VIEW MODAL (DARK THEME + BACK BUTTON) */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[280] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[#D4AF37]/30 max-w-5xl w-full h-[95vh] md:h-auto md:max-h-[95vh] flex flex-col relative rounded-sm shadow-[0_0_50px_rgb(0,0,0,0.8)] overflow-hidden">
            
            {/* STICKY HEADER */}
            <div className="flex justify-between items-center bg-[#0a0a0a] border-b border-[#333333] p-4 md:px-8 md:py-5 shadow-sm sticky top-0 z-20">
               <button onClick={() => setViewingProduct(null)} className="flex items-center gap-2 text-[#D4AF37] hover:text-[#111111] font-bold uppercase tracking-widest text-sm transition-colors bg-[#1A1A1A] border border-[#D4AF37]/30 hover:bg-[#D4AF37] px-4 py-2 md:px-5 md:py-2.5 rounded-sm">
                  <span className="text-xl leading-none -mt-0.5">←</span> ফিরে যান (Back)
               </button>
               <button onClick={() => setViewingProduct(null)} className="text-gray-400 hover:text-red-500 text-3xl font-light transition-colors">✕</button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                  <div className="w-full h-[400px] md:h-[500px] bg-[#0a0a0a] rounded-sm border border-[#333333] flex items-center justify-center p-2 overflow-hidden shadow-inner">
                     {activeImage ? <img src={activeImage} className="w-full h-full object-cover rounded-sm" /> : <span className="text-gray-600 font-medium">No Image</span>}
                  </div>
                  {(() => {
                    const gallery = [viewingProduct.image_url, viewingProduct.image_url_2, viewingProduct.image_url_3, viewingProduct.image_url_4].filter(Boolean) as string[];
                    if (gallery.length > 1) {
                      return (
                        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                          {gallery.map((img, idx) => (
                            <div key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 rounded-sm cursor-pointer border-2 transition-colors duration-300 ${activeImage === img ? 'border-[#D4AF37]' : 'border-transparent hover:border-gray-500'} bg-[#0a0a0a] flex-shrink-0 p-1 shadow-sm`}>
                              <img src={img} className="w-full h-full object-cover rounded-sm" />
                            </div>
                          ))}
                        </div>
                      );
                    } return null;
                  })()}
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="border-b border-[#333333] pb-6 mb-8">
                    <p className="text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest mb-3">{viewingProduct.category}</p>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#EAEAEA] mb-4 leading-tight">{viewingProduct.name}</h3>
                    <div className="flex items-center gap-5">
                      <span className="text-[#D4AF37] text-4xl font-black tracking-tight">{formatPrice(viewingProduct.price)}</span>
                      {viewingProduct.original_price && <span className="text-gray-500 line-through text-xl font-medium">{formatPrice(viewingProduct.original_price)}</span>}
                    </div>
                  </div>
                  
                  <div className="mb-8 space-y-4">
                     <button onClick={() => handleDirectOrder(viewingProduct, 1)} disabled={!viewingProduct.in_stock} className="w-full bg-[#D4AF37] text-[#111111] font-bold py-4 rounded-sm hover:bg-white hover:text-[#111111] transition-colors duration-300 text-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] flex justify-center items-center gap-2 tracking-widest uppercase">
                       ⚡ অর্ডার করুন
                     </button>
                     <button onClick={() => {addToCart(viewingProduct, 1); setIsCartOpen(true)}} disabled={!viewingProduct.in_stock} className="w-full bg-[#1A1A1A] border border-[#D4AF37]/50 text-[#D4AF37] font-bold py-3.5 rounded-sm hover:bg-[#D4AF37] hover:text-[#111111] transition-colors duration-300 text-sm flex justify-center items-center gap-2 uppercase tracking-wider">
                       🛒 ব্যাগে যোগ
                     </button>
                     <a href={`https://wa.me/88${storeSettings.phone}?text=আমি ${viewingProduct.name} অর্ডার করতে চাই`} target="_blank" className="w-full bg-[#25D366] text-[#111111] font-bold py-4 rounded-sm hover:bg-[#1ebd5a] transition-colors duration-300 text-sm shadow-sm flex justify-center items-center gap-2 uppercase tracking-wider">
                       🟢 হোয়াটসঅ্যাপ অর্ডার
                     </a>
                     <a href={`tel:${storeSettings.phone}`} className="w-full bg-[#1A1A1A] text-white border border-[#333333] font-bold py-4 rounded-sm hover:bg-black transition-colors duration-300 text-sm shadow-sm flex justify-center items-center gap-2 uppercase tracking-wider">
                       📱 কল অর্ডার {storeSettings.phone}
                     </a>
                  </div>
                  
                  <div className="mt-2 text-gray-300">
                    <h4 className="text-sm font-bold text-[#EAEAEA] mb-3 uppercase tracking-widest border-b border-[#333333] pb-2 inline-block">Product Details</h4>
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium text-gray-400">{viewingProduct.description || "অত্যন্ত প্রিমিয়াম কোয়ালিটি পণ্য। নিশ্চিন্তে অর্ডার করতে পারেন।"}</p>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="border-t border-[#333333] pt-10 mt-12">
                 <h3 className="text-2xl font-serif font-bold text-[#EAEAEA] mb-8 border-l-4 border-[#D4AF37] pl-4 uppercase tracking-widest">কাস্টমার রিভিউ ({productReviews.length})</h3>
                 
                 <div className="flex flex-col md:flex-row gap-10">
                   <form onSubmit={handleReviewSubmit} className="w-full md:w-1/3 bg-[#1A1A1A] p-8 rounded-sm border border-[#333333] shadow-sm h-fit">
                      <h4 className="text-sm font-bold text-[#EAEAEA] mb-5 uppercase tracking-widest">আপনার মতামত জানান</h4>
                      <div className="flex gap-2 mb-5">
                         {[1,2,3,4,5].map(star => (
                            <span key={star} onClick={() => setNewReviewRating(star)} className={`cursor-pointer text-3xl transition-colors ${star <= newReviewRating ? 'text-[#D4AF37]' : 'text-gray-600 hover:text-gray-400'}`}>★</span>
                         ))}
                      </div>
                      <input type="text" placeholder="আপনার নাম" value={newReviewName} onChange={e => setNewReviewName(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333333] p-3 rounded-sm text-sm text-white mb-4 outline-none focus:border-[#D4AF37] transition-colors shadow-inner" required/>
                      <textarea required placeholder="প্রোডাক্টটি কেমন লেগেছে?" value={newReviewComment} onChange={e => setNewReviewComment(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333333] p-3 rounded-sm text-sm text-white mb-5 outline-none focus:border-[#D4AF37] transition-colors custom-scrollbar shadow-inner" rows={4}></textarea>
                      <button type="submit" disabled={isReviewSubmitting} className="w-full bg-[#D4AF37] text-[#111111] py-3.5 rounded-sm text-sm font-bold hover:bg-white transition-colors duration-300 shadow-sm tracking-widest uppercase">{isReviewSubmitting ? 'Submitting...' : 'Submit Review'}</button>
                   </form>

                   <div className="w-full md:w-2/3 space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar pr-3">
                      {productReviews.length === 0 ? <p className="text-sm text-gray-500 bg-[#1A1A1A] p-10 text-center border border-dashed border-[#333333] rounded-sm font-medium tracking-wide uppercase">এখনো কোনো রিভিউ নেই। আপনিই প্রথম রিভিউ দিন!</p> : productReviews.map(review => (
                         <div key={review.id} className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-sm shadow-sm hover:border-[#D4AF37]/50 transition-colors duration-300">
                            <div className="flex justify-between items-center mb-3">
                               <span className="font-bold text-sm text-[#EAEAEA] uppercase tracking-wider">{review.customer_name}</span>
                               <span className="text-[#D4AF37] text-lg tracking-widest">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                            </div>
                            <p className="text-sm text-gray-300 mb-3 font-medium leading-relaxed">{review.comment}</p>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{new Date(review.created_at).toLocaleDateString()}</p>
                         </div>
                      ))}
                   </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 🟢 CHECKOUT MODAL (DARK THEME + NAGAD/ROCKET) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[280] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#D4AF37]/50 w-full max-w-md relative rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[95vh]">
            
            <div className="flex justify-between items-center bg-[#0a0a0a] border-b border-[#333333] p-4">
               <button onClick={() => setIsCheckoutOpen(false)} className="flex items-center gap-2 text-[#D4AF37] hover:text-[#111111] font-bold uppercase tracking-widest text-xs transition-colors bg-[#1A1A1A] hover:bg-[#D4AF37] px-3 py-1.5 rounded-sm"><span className="text-lg leading-none -mt-0.5">←</span> Back</button>
               <h3 className="text-[15px] font-bold text-[#D4AF37] tracking-widest uppercase">হোম ডেলিভারির তথ্য</h3>
               <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-light transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#111111]">
              <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 mb-2 flex items-center gap-2 uppercase tracking-wider">👤 আপনার নাম লিখুন <span className="text-red-500">*</span></label>
                  <input required value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] p-3 text-sm text-white rounded-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 mb-2 flex items-center gap-2 uppercase tracking-wider">📱 মোবাইল নাম্বার <span className="text-red-500">*</span></label>
                  <input required placeholder="01xxxxxxxxx" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] p-3 text-sm text-white rounded-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 mb-2 flex items-center gap-2 uppercase tracking-wider">🏠 ডেলিভারি ঠিকানা <span className="text-red-500">*</span></label>
                  <textarea required rows={2} placeholder="সম্পূর্ণ ঠিকানা লিখুন (জেলা, থানা সহ)" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] p-3 text-sm text-white rounded-sm outline-none focus:border-[#D4AF37] shadow-inner custom-scrollbar transition-colors"></textarea>
                </div>
                
                {/* 🟢 Payment Methods */}
                <div className="bg-[#1A1A1A] p-4 border border-[#333333] rounded-sm shadow-sm">
                  <label className="text-[11px] font-bold text-gray-300 mb-3 flex items-center gap-2 uppercase tracking-wider">💳 পেমেন্ট পদ্ধতি</label>
                  <div className="flex flex-wrap gap-2">
                     <button type="button" onClick={()=>setPaymentMethod('COD')} className={`flex-1 min-w-[100px] py-2.5 text-xs font-bold border rounded-sm transition-colors duration-300 ${paymentMethod==='COD'?'bg-[#D4AF37] text-[#111111] border-[#D4AF37]':'bg-[#0a0a0a] text-gray-400 border-[#333333] hover:border-gray-500'}`}>Cash on Delivery</button>
                     <button type="button" onClick={()=>setPaymentMethod('bKash')} className={`flex-1 min-w-[80px] py-2.5 text-xs font-bold border rounded-sm transition-colors duration-300 ${paymentMethod==='bKash'?'bg-[#e2136e] text-white border-[#e2136e]':'bg-[#0a0a0a] text-gray-400 border-[#333333] hover:border-gray-500'}`}>bKash</button>
                     <button type="button" onClick={()=>setPaymentMethod('Nagad')} className={`flex-1 min-w-[80px] py-2.5 text-xs font-bold border rounded-sm transition-colors duration-300 ${paymentMethod==='Nagad'?'bg-[#F58220] text-white border-[#F58220]':'bg-[#0a0a0a] text-gray-400 border-[#333333] hover:border-gray-500'}`}>Nagad</button>
                     <button type="button" onClick={()=>setPaymentMethod('Rocket')} className={`flex-1 min-w-[80px] py-2.5 text-xs font-bold border rounded-sm transition-colors duration-300 ${paymentMethod==='Rocket'?'bg-[#8C1515] text-white border-[#8C1515]':'bg-[#0a0a0a] text-gray-400 border-[#333333] hover:border-gray-500'}`}>Rocket</button>
                  </div>
                  {paymentMethod !== 'COD' && (
                     <div className="bg-[#0a0a0a] border border-[#333333] p-4 rounded-sm mt-3 shadow-inner">
                         <p className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider leading-relaxed">এই নম্বরে Send Money করুন: <br/><span className="text-lg text-[#D4AF37] bg-[#111111] px-2 py-0.5 rounded tracking-widest inline-block mt-1 border border-[#D4AF37]/30">{storeSettings.phone}</span> ({paymentMethod})</p>
                         <input type="text" required placeholder={`${paymentMethod} TrxID দিন`} value={transactionId} onChange={e=>setTransactionId(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] p-3 text-sm text-white rounded-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors mt-2"/>
                     </div>
                  )}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] font-bold text-gray-300 mb-3 flex items-center gap-2 uppercase tracking-wider">🚚 ডেলিভারি চার্জ নির্বাচন করুন</label>
                  <div className="flex flex-col gap-3 bg-[#1A1A1A] p-4 rounded-sm border border-[#333333] shadow-sm">
                     <label className="flex items-center gap-3 text-sm text-[#EAEAEA] font-bold cursor-pointer">
                        <input type="radio" name="shipping" checked={shippingLocation==='inside'} onChange={()=>setShippingLocation('inside')} className="accent-[#D4AF37] w-4 h-4 cursor-pointer" />
                        <span>ঢাকার ভিতরে (৳ ৬০)</span>
                     </label>
                     <label className="flex items-center gap-3 text-sm text-[#EAEAEA] font-bold cursor-pointer">
                        <input type="radio" name="shipping" checked={shippingLocation==='outside'} onChange={()=>setShippingLocation('outside')} className="accent-[#D4AF37] w-4 h-4 cursor-pointer" />
                        <span>ঢাকার বাইরে (৳ ১২০)</span>
                     </label>
                  </div>
                </div>

                <div className="border border-[#333333] bg-[#1A1A1A] rounded-sm mt-5 overflow-hidden shadow-sm">
                   {cart.map((item) => (
                     <div key={item.id} className="flex border-b border-[#333333] last:border-0 p-3 items-center text-sm">
                        <div className="w-14 h-14 border border-[#333333] mr-4 shrink-0 rounded-sm overflow-hidden bg-[#0a0a0a]">
                           <img src={item.image_url||''} className="w-full h-full object-cover opacity-90"/>
                        </div>
                        <div className="flex-1 leading-tight">
                           <p className="font-bold text-[#EAEAEA] text-[13px] line-clamp-1">{item.name}</p>
                           <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Color: N/A</p>
                           <p className="text-[11px] text-[#D4AF37] font-black mt-1">৳ {formatPrice(item.price)} X {item.quantity}</p>
                        </div>
                        <div className="flex flex-col items-center border-l border-r border-[#333333] px-3 h-full justify-center gap-1.5">
                           <button type="button" onClick={()=>updateQuantity(item.id, 1)} className="font-black text-xl leading-none cursor-pointer text-[#EAEAEA] hover:text-[#D4AF37] transition-colors">+</button>
                           <span className="text-xs font-bold text-white leading-none">{item.quantity}</span>
                           <button type="button" onClick={()=>updateQuantity(item.id, -1)} className="font-black text-xl leading-none cursor-pointer text-[#EAEAEA] hover:text-[#D4AF37] transition-colors">-</button>
                        </div>
                        <div className="px-4 flex items-center justify-between min-w-[80px]">
                           <span className="font-black text-[#D4AF37] text-sm">{(getNumericPrice(item.price) * item.quantity).toString()}৳</span>
                           <button type="button" onClick={()=>removeFromCart(item.id)} className="text-red-500 font-bold ml-3 hover:bg-red-900/30 px-2 py-1 rounded-sm transition-colors text-lg leading-none">✕</button>
                        </div>
                     </div>
                   ))}
                   
                   <div className="flex justify-between items-center p-4 bg-[#0a0a0a] border-t border-[#333333] font-bold text-sm text-white">
                      <span className="uppercase tracking-widest text-[#D4AF37]">Total:-</span>
                      <div className="flex items-center gap-8 pr-1">
                        <span className="text-lg text-gray-300">{totalItemsCount} items</span>
                        <span className="text-[#D4AF37] text-[18px] font-black">{cartTotal.toString()} ৳</span>
                      </div>
                   </div>
                </div>

                <button type="submit" disabled={isCheckingOut} className="w-full bg-[#1C7430] text-white font-bold py-4 text-[17px] rounded-sm mt-6 hover:bg-green-600 transition-colors duration-300 shadow-md flex items-center justify-center gap-2 uppercase tracking-widest border border-transparent hover:border-white">
                  {isCheckingOut ? "Processing..." : `✅ অর্ডার করুন ৳ ${cartTotal}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 SIDE CART DRAWER (DARK) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[280] bg-black/90 backdrop-blur-sm flex justify-end">
          <div className="bg-[#111111] w-full max-w-sm h-full p-8 relative flex flex-col shadow-2xl border-l border-[#D4AF37]/50">
            <button onClick={() => setIsCartOpen(false)} className="absolute top-5 right-6 text-3xl text-gray-400 hover:text-[#D4AF37] transition-colors leading-none">✕</button>
            <h3 className="text-2xl font-serif font-bold mb-8 border-b border-[#333333] pb-4 text-[#D4AF37] tracking-widest uppercase">শপিং ব্যাগ</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#1A1A1A] p-4 rounded-sm border border-[#333333] shadow-sm hover:border-[#D4AF37]/50 transition-colors duration-300">
                  <div className="flex gap-4 items-center w-2/3">
                    <img src={item.image_url||''} className="w-16 h-16 border border-[#333333] bg-[#0a0a0a] rounded-sm object-cover shrink-0"/>
                    <div><p className="text-[13px] font-bold text-white leading-tight line-clamp-2">{item.name}</p><p className="text-xs font-black mt-2 text-[#D4AF37]">{formatPrice(item.price)} x {item.quantity}</p></div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-[10px] font-bold hover:underline uppercase tracking-wider">Remove</button>
                      <div className="flex items-center border border-[#333333] rounded-sm bg-[#0a0a0a] overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 font-bold text-gray-300 hover:bg-[#333333] transition-colors">-</button>
                        <span className="px-3 text-xs font-bold border-x border-[#333333] py-1.5 text-white bg-[#111111]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 font-bold text-gray-300 hover:bg-[#333333] transition-colors">+</button>
                      </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-gray-500 mt-12 font-bold tracking-widest uppercase text-sm border border-dashed border-[#333333] p-6 rounded-sm">ব্যাগটি সম্পূর্ণ খালি!</p>}
            </div>

            {cart.length > 0 && (
              <div className="mt-6 bg-[#0a0a0a] p-6 rounded-sm shadow-xl border border-[#333333]">
                <div className="flex justify-between font-black text-xl mb-6 text-white border-b border-[#333333] pb-4"><span className="text-[#D4AF37] uppercase tracking-widest text-sm">সাবটোটাল:</span><span>{itemsSubtotal} ৳</span></div>
                <button onClick={() => {setIsCartOpen(false); setIsCheckoutOpen(true)}} className="w-full bg-[#D4AF37] text-[#111111] font-bold py-4 text-sm rounded-sm hover:bg-white transition-colors duration-300 tracking-widest uppercase shadow-md">চেকআউট করুন</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟢 WISHLIST DRAWER (DARK) */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-[280] bg-black/90 backdrop-blur-sm flex justify-end">
          <div className="bg-[#111111] w-full max-w-sm h-full p-8 relative shadow-2xl flex flex-col border-l border-[#D4AF37]/50">
            <button onClick={() => setIsWishlistOpen(false)} className="absolute top-5 right-6 text-gray-400 hover:text-[#D4AF37] text-3xl transition-colors leading-none">✕</button>
            <h3 className="text-2xl font-serif font-bold mb-8 border-b border-[#333333] pb-4 text-[#D4AF37] tracking-widest uppercase">উইশলিস্ট ({wishlist.length})</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {wishlist.length === 0 ? <p className="text-center text-gray-500 mt-12 font-bold tracking-widest uppercase text-sm border border-dashed border-[#333333] p-6 rounded-sm">উইশলিস্টে কিছু নেই।</p> : wishlist.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-sm border border-[#333333] shadow-sm hover:border-[#D4AF37]/50 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <img src={item.image_url||''} className="w-16 h-16 border border-[#333333] bg-[#0a0a0a] object-cover rounded-sm shadow-sm"/>
                    <div>
                      <p className="text-[13px] font-bold text-white leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-[#D4AF37] text-sm font-black mt-2">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 items-end">
                     <button onClick={() => { addToCart(item); setIsWishlistOpen(false); setIsCartOpen(true); }} className="bg-[#D4AF37] text-[#111111] text-[10px] px-3 py-2 rounded-sm font-bold hover:bg-white transition-colors uppercase tracking-widest shadow-sm">🛒 ব্যাগে</button>
                     <button onClick={() => removeFromWishlist(item.id)} className="text-red-500 text-[10px] font-bold hover:underline uppercase tracking-wider text-center">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 AUTH MODAL (DARK + OTP + GOOGLE) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
          
          <button onClick={() => setShowAuthModal(false)} className="bg-[#EAEAEA] text-[#111111] px-6 py-2.5 rounded-sm font-bold text-xs mb-6 hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            লগ-ইন ছাড়া অর্ডার করতে চাইলে এখানে ক্লিক করুন &gt;&gt;
          </button>

          <div className="bg-[#111111] p-8 md:p-10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md relative border-t-4 border-[#D4AF37]">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-5 right-6 text-gray-500 hover:text-white text-2xl transition-colors">✕</button>

            {authView === 'OTP' && (
              <>
                <div className="bg-[#1A1A1A] border-l-4 border-[#25D366] p-6 rounded-sm mb-6 shadow-inner mt-2">
                  {!otpSent ? (
                      <form onSubmit={handleSendOTP} className="space-y-4">
                         <input required type="tel" placeholder="মোবাইল নাম্বার লিখুন (e.g., 01xxxxxxxxx)" value={authPhone} onChange={e=>setAuthPhone(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333333] p-3.5 rounded-sm text-sm text-white outline-none focus:border-[#25D366] transition-colors"/>
                         <div className="flex items-center gap-3">
                            <span className="text-[#EAEAEA] font-mono font-bold text-lg min-w-[80px]">{captcha.num1} + {captcha.num2} = </span>
                            <input required type="number" placeholder="যোগফল লিখুন" value={userCaptcha} onChange={e=>setUserCaptcha(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333333] p-3.5 rounded-sm text-sm text-white outline-none focus:border-[#25D366] transition-colors"/>
                         </div>
                         <button type="submit" disabled={authLoading} className="w-full bg-[#333333] text-white py-3.5 rounded-sm font-bold hover:bg-[#444444] transition-colors duration-300 tracking-widest mt-2">{authLoading ? 'অপেক্ষা করুন...' : 'OTP পাঠান'}</button>
                      </form>
                  ) : (
                      <form onSubmit={handleVerifyOTP} className="space-y-4">
                         <input required type="text" placeholder="OTP কোড লিখুন" value={authOtpCode} onChange={e=>setAuthOtpCode(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333333] p-3.5 rounded-sm text-sm text-white outline-none focus:border-[#25D366] transition-colors"/>
                         <button type="submit" disabled={authLoading} className="w-full bg-[#25D366] text-[#111111] py-3.5 rounded-sm font-bold hover:bg-[#1ebd5a] transition-colors duration-300 tracking-widest mt-2">{authLoading ? 'অপেক্ষা করুন...' : 'ভেরিফাই করুন'}</button>
                      </form>
                  )}
                </div>

                <div className="text-center text-gray-500 text-xs mb-5 font-bold tracking-widest">OR,</div>
                
                <button onClick={() => setAuthView('PASSWORD')} className="w-full bg-[#EAEAEA] text-[#111111] py-3 rounded-sm font-bold text-sm hover:bg-white transition-colors mb-4 flex items-center justify-center gap-2">
                  ⚡ অ্যাকাউন্ট থাকলে পাসওয়ার্ড দিয়ে লগইন করুন
                </button>
                
                <button onClick={handleGoogleLogin} className="w-full bg-[#4285F4] text-white py-3 rounded-sm font-bold text-sm hover:bg-[#3367D6] transition-colors flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98c-.8 1.6-1.25 3.4-1.25 5.38s.45 3.78 1.25 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.565 0 3.515 2.7 1.545 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                  Google দিয়ে লগইন করুন
                </button>
              </>
            )}

            {(authView === 'PASSWORD' || authView === 'REGISTER') && (
              <>
                <h2 className="text-3xl font-serif font-bold mb-8 text-[#D4AF37] text-center tracking-widest uppercase mt-4">{authView === 'PASSWORD' ? 'পাসওয়ার্ড লগইন' : 'রেজিস্টার'}</h2>
                <form onSubmit={handleAuth} className="space-y-5">
                  <input type="email" required placeholder="ইমেইল এড্রেস" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] p-3.5 rounded-sm text-sm text-white outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                  <input type="password" required placeholder="পাসওয়ার্ড" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] p-3.5 rounded-sm text-sm text-white outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                  <button type="submit" disabled={authLoading} className="w-full bg-[#D4AF37] text-[#111111] py-4 rounded-sm font-bold hover:bg-white transition-colors duration-300 tracking-widest uppercase mt-4 shadow-[0_0_15px_rgba(212,175,55,0.3)]">{authLoading ? 'অপেক্ষা করুন...' : (authView === 'PASSWORD' ? 'Login' : 'Register')}</button>
                </form>
                <p className="text-xs text-center mt-8 text-gray-400 font-medium tracking-wide">
                  {authView === 'PASSWORD' ? 'অ্যাকাউন্ট নেই? ' : 'ইতিমধ্যেই অ্যাকাউন্ট আছে? '}
                  <span className="text-white font-black cursor-pointer hover:text-[#D4AF37] transition-colors uppercase tracking-widest border-b border-transparent hover:border-[#D4AF37] pb-0.5 ml-1" onClick={() => setAuthView(authView === 'PASSWORD' ? 'REGISTER' : 'PASSWORD')}>{authView === 'PASSWORD' ? 'Register Now' : 'Login Here'}</span>
                </p>
                <button onClick={() => setAuthView('OTP')} className="w-full mt-6 text-[#D4AF37] text-xs font-bold hover:text-white transition-colors uppercase tracking-widest text-center">← Back to Quick Login</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🟢 PROFILE MODAL */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-[280] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#333333] p-8 rounded-sm shadow-2xl w-full max-w-md relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-5 right-6 text-gray-500 hover:text-white text-2xl transition-colors">✕</button>
            <div className="flex flex-col items-center mb-8 mt-2">
               <div className="w-24 h-24 bg-[#0a0a0a] border-2 border-[#D4AF37] rounded-full mb-4 flex items-center justify-center text-4xl font-bold text-[#D4AF37] overflow-hidden shadow-lg">
                  {userData.avatar ? <img src={userData.avatar} className="w-full h-full object-cover"/> : user.email?.charAt(0).toUpperCase()}
               </div>
               <h2 className="text-3xl font-serif font-bold text-white tracking-wide">{userData.name || user.email?.split('@')[0]}</h2>
               <p className="text-sm text-gray-500 font-bold tracking-widest mt-1 uppercase">{user.email}</p>
            </div>
            
            <div className="border-t border-[#333333] pt-6 mb-6">
               <h3 className="font-bold text-[#D4AF37] mb-5 uppercase tracking-widest text-xs border-b border-[#333333] inline-block pb-1">Order History ({userOrders.length})</h3>
               <div className="space-y-4 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                  {userOrders.length === 0 ? <p className="text-xs text-gray-500 text-center py-6 font-bold tracking-widest uppercase border border-dashed border-[#333333] rounded-sm">No orders yet.</p> : userOrders.map(order => (
                     <div key={order.id} className="bg-[#1A1A1A] border border-[#333333] p-5 rounded-sm shadow-sm hover:border-[#D4AF37]/50 transition-colors text-sm">
                        <div className="flex justify-between font-bold mb-3">
                           <span className="text-white uppercase tracking-wider">Order #{order.id.split('-')[0]}</span>
                           <span className={`px-2.5 py-1 rounded-sm text-[10px] tracking-widest uppercase ${order.status === 'PENDING' ? 'text-yellow-600 bg-yellow-900/20 border border-yellow-800' : 'text-green-500 bg-green-900/20 border border-green-800'}`}>{order.status}</span>
                        </div>
                        <p className="text-gray-400 font-bold">Total: <span className="font-black text-[#D4AF37]">৳{order.total_amount}</span></p>
                        <p className="text-[10px] text-gray-600 mt-2 font-bold tracking-widest uppercase">{new Date(order.created_at).toLocaleString()}</p>
                     </div>
                  ))}
               </div>
            </div>
            <button onClick={handleLogout} className="w-full bg-[#1A1A1A] text-red-500 border border-[#333333] py-3.5 rounded-sm font-bold hover:bg-red-900/30 hover:border-red-500 transition-colors uppercase tracking-widest text-xs shadow-sm">Logout</button>
          </div>
        </div>
      )}

      {/* 🟢 MASTER ADMIN DASHBOARD */}
      {showAdminDashboard && (
        <div className="fixed inset-0 z-[280] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] rounded-sm max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#333333]">
            
            <div className="flex justify-between items-center bg-[#0a0a0a] text-[#D4AF37] p-6 border-b-2 border-[#D4AF37]">
              {/* BIG BACK BUTTON INSIDE ADMIN */}
              <div className="flex items-center gap-4">
                 <button onClick={() => setShowAdminDashboard(false)} className="flex items-center gap-2 bg-[#1A1A1A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111111] border border-[#D4AF37]/30 px-4 py-2 rounded-sm font-bold uppercase tracking-widest text-xs transition-colors">
                    <span className="text-lg leading-none -mt-0.5">←</span> Back
                 </button>
                 <h2 className="text-2xl font-serif font-bold tracking-widest uppercase">Master Admin Panel</h2>
              </div>
              <button onClick={() => setShowAdminDashboard(false)} className="text-[#D4AF37] hover:text-white text-3xl leading-none transition-colors">✕</button>
            </div>

            <div className="flex border-b border-[#333333] bg-[#111111]">
              <button onClick={() => setAdminTab('settings')} className={`flex-1 py-4 font-bold text-sm uppercase tracking-widest transition-colors duration-300 ${adminTab === 'settings' ? 'bg-[#1A1A1A] border-t-2 border-[#D4AF37] text-[#D4AF37] shadow-inner' : 'text-gray-500 hover:bg-[#1A1A1A] hover:text-gray-300'}`}>⚙️ Store Settings</button>
              <button onClick={() => setAdminTab('orders')} className={`flex-1 py-4 font-bold text-sm uppercase tracking-widest transition-colors duration-300 ${adminTab === 'orders' ? 'bg-[#1A1A1A] border-t-2 border-[#D4AF37] text-[#D4AF37] shadow-inner' : 'text-gray-500 hover:bg-[#1A1A1A] hover:text-gray-300'}`}>📦 Orders</button>
              <button onClick={() => setAdminTab('products')} className={`flex-1 py-4 font-bold text-sm uppercase tracking-widest transition-colors duration-300 ${adminTab === 'products' ? 'bg-[#1A1A1A] border-t-2 border-[#D4AF37] text-[#D4AF37] shadow-inner' : 'text-gray-500 hover:bg-[#1A1A1A] hover:text-gray-300'}`}>🛍️ Product List</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0a0a] custom-scrollbar">
              
              {/* Admin: Settings Tab */}
              {adminTab === 'settings' && (
                <div className="space-y-8">
                  <form onSubmit={handleSaveSettings} className="bg-[#111111] p-8 border border-[#333333] rounded-sm shadow-sm">
                    <h3 className="font-serif font-bold text-2xl mb-6 border-b border-[#333333] pb-3 text-white tracking-widest uppercase">Brand Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div><label className="text-[10px] font-bold mb-2 block text-gray-400 uppercase tracking-widest">Brand Name</label><input value={storeSettings.shop_name} onChange={e=>setStoreSettings({...storeSettings, shop_name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#333333] text-white p-3.5 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"/></div>
                      <div><label className="text-[10px] font-bold mb-2 block text-gray-400 uppercase tracking-widest">Phone (Call & WhatsApp)</label><input value={storeSettings.phone} onChange={e=>setStoreSettings({...storeSettings, phone: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#333333] text-white p-3.5 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"/></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Logo Upload */}
                      <div className="bg-[#1A1A1A] p-6 border border-[#333333] rounded-sm shadow-inner">
                        <label className="text-[10px] font-bold mb-4 block text-white uppercase tracking-widest">Brand Logo (Square)</label>
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-[#0a0a0a] border border-[#333333] shadow-sm rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                            {storeSettings.logo_url ? <img src={storeSettings.logo_url} className="w-full h-full object-cover"/> : <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider text-center">No Logo</span>}
                          </div>
                          <div className="flex-1">
                            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} className="text-xs text-gray-400 w-full bg-[#0a0a0a] p-2 border border-[#333333] rounded-sm cursor-pointer"/>
                            {uploadingType === 'logo' && <span className="text-[11px] text-[#D4AF37] block mt-2 font-black tracking-widest uppercase">Uploading...</span>}
                          </div>
                        </div>
                      </div>

                      {/* Website Background Image Upload */}
                      <div className="bg-[#1A1A1A] p-6 border border-[#333333] rounded-sm shadow-inner">
                        <label className="text-[10px] font-bold mb-4 block text-[#D4AF37] uppercase tracking-widest">★ Website Background</label>
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-20 bg-[#0a0a0a] border border-[#333333] shadow-sm rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                            {storeSettings.category_banners?.['WEBSITE_BG'] ? <img src={storeSettings.category_banners['WEBSITE_BG']} className="w-full h-full object-cover"/> : <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider text-center">No BG</span>}
                          </div>
                          <div className="flex-1">
                            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'website_bg')} className="text-xs text-gray-400 w-full bg-[#0a0a0a] p-2 border border-[#333333] rounded-sm cursor-pointer"/>
                            {uploadingType === 'website_bg' && <span className="text-[11px] text-[#D4AF37] block mt-2 font-black tracking-widest uppercase">Uploading...</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5 FLASH DEAL BANNERS UI */}
                    <div className="mb-6 bg-[#1A1A1A] p-6 border border-[#333333] rounded-sm shadow-inner">
                      <label className="text-[10px] font-bold mb-5 block text-white uppercase tracking-widest border-b border-[#333333] pb-2">Flash Deal Slider Banners (5 Slots)</label>
                      <div className="space-y-4">
                        {[0, 1, 2, 3, 4].map(idx => (
                          <div key={idx} className="flex items-center gap-5 border border-[#333333] p-4 bg-[#0a0a0a] rounded-sm shadow-sm hover:border-[#D4AF37]/50 transition-colors">
                            <div className="w-28 h-14 bg-[#111111] border border-[#333333] flex items-center justify-center overflow-hidden shrink-0 rounded-sm">
                              {storeSettings.banners[idx]?.imageUrl ? <img src={storeSettings.banners[idx].imageUrl} className="w-full h-full object-cover"/> : <span className="text-[10px] text-gray-600 font-black tracking-widest">SLIDE {idx+1}</span>}
                            </div>
                            <div className="flex-1">
                              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'banner', idx)} className="text-xs w-full text-gray-400 cursor-pointer p-1"/>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-6 bg-[#0a0a0a] p-4 border border-[#333333] rounded-sm shadow-sm">
                         <input type="checkbox" checked={storeSettings.flashDealActive} onChange={e=>setStoreSettings({...storeSettings, flashDealActive: e.target.checked})} className="w-5 h-5 accent-[#D4AF37] cursor-pointer"/>
                         <label className="text-xs font-black text-white tracking-widest uppercase">Enable Countdown Timer</label>
                      </div>
                    </div>
                    
                    <button type="submit" className="w-full bg-[#D4AF37] text-[#111111] px-8 py-4 text-sm font-bold rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:bg-white transition-colors duration-300 tracking-widest uppercase border border-transparent">Save Brand Settings</button>
                  </form>

                  {/* CUSTOM HOMEPAGE BANNERS UI (DYNAMIC SECTION BUILDER) */}
                  <div className="bg-[#111111] p-8 border border-[#333333] rounded-sm shadow-sm mt-6">
                    <div className="flex justify-between items-center mb-6 border-b border-[#333333] pb-3">
                       <h3 className="font-serif font-bold text-2xl text-white tracking-widest uppercase">Custom Category Banners</h3>
                       <button type="button" onClick={() => setCustomSections([...customSections, { id: Date.now().toString(), title: 'New Banner Section', fontSize: 36, imageUrl: '' }])} className="bg-[#D4AF37] text-[#111111] px-5 py-2.5 text-xs font-bold rounded-sm hover:bg-white transition-colors shadow-md uppercase tracking-wider">+ Add New Banner</button>
                    </div>
                    
                    <div className="space-y-6">
                      {customSections.length === 0 ? (
                         <p className="text-gray-500 text-sm text-center py-6 border border-dashed border-[#333333]">No custom banners added yet.</p>
                      ) : customSections.map((section, index) => (
                        <div key={section.id} className="flex flex-col md:flex-row gap-6 items-start md:items-center p-6 border border-[#333333] rounded-sm bg-[#1A1A1A] shadow-inner relative group">
                          
                          <button type="button" onClick={() => setCustomSections(customSections.filter(s => s.id !== section.id))} className="absolute top-3 right-3 bg-red-600/80 text-white w-7 h-7 flex items-center justify-center rounded-sm text-sm hover:bg-red-500 transition-colors shadow-md z-10" title="Delete Banner">✕</button>

                          <div className="w-full md:w-1/3 flex flex-col gap-4">
                            <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Banner Title / Category Match</label>
                               <input type="text" value={section.title} onChange={e => { const newSec = [...customSections]; newSec[index].title = e.target.value; setCustomSections(newSec); }} className="w-full bg-[#0a0a0a] border border-[#333333] text-white p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Text Size (e.g. 36)</label>
                               <input type="number" value={section.fontSize} onChange={e => { const newSec = [...customSections]; newSec[index].fontSize = Number(e.target.value); setCustomSections(newSec); }} className="w-full bg-[#0a0a0a] border border-[#333333] text-white p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Upload Banner Image</label>
                               <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'custom_section', undefined, section.id)} className="text-[10px] text-gray-400 w-full bg-[#0a0a0a] p-2.5 border border-[#333333] rounded-sm cursor-pointer"/>
                               {uploadingType === `custom_${section.id}` && <span className="text-[11px] text-[#D4AF37] block mt-2 font-black tracking-widest uppercase">Uploading...</span>}
                            </div>
                          </div>
                          
                          <div className="w-full md:w-2/3 h-40 bg-[#0a0a0a] border border-[#333333] rounded-sm flex items-center justify-center overflow-hidden shadow-sm">
                             {section.imageUrl ? <img src={section.imageUrl} className="w-full h-full object-cover opacity-90"/> : <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">No Banner Uploaded</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {customSections.length > 0 && <p className="text-[10px] text-[#D4AF37] mt-4 font-bold tracking-widest uppercase text-center">Note: Click "Save Brand Settings" above to save changes to these banners.</p>}
                  </div>

                  {/* DYNAMIC WEBSITE CONTENT FOR SIDEBAR MODALS */}
                  <div className="bg-[#111111] p-8 border border-[#333333] rounded-sm shadow-sm mt-6">
                      <h3 className="font-serif font-bold text-xl mb-6 border-b border-[#333333] pb-3 text-white tracking-widest uppercase">Website Pages Content</h3>
                      <div className="space-y-5">
                         <div>
                            <label className="text-[10px] font-bold mb-2 block text-gray-400 uppercase tracking-widest">Contact Info (যোগাযোগ)</label>
                            <textarea rows={3} value={storeSettings.contact_info} onChange={e=>setStoreSettings({...storeSettings, contact_info: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#333333] text-white p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"></textarea>
                         </div>
                         <div>
                            <label className="text-[10px] font-bold mb-2 block text-gray-400 uppercase tracking-widest">Return Policy (রিটার্ন পলিসি)</label>
                            <textarea rows={3} value={storeSettings.return_policy} onChange={e=>setStoreSettings({...storeSettings, return_policy: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#333333] text-white p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"></textarea>
                         </div>
                         <div>
                            <label className="text-[10px] font-bold mb-2 block text-gray-400 uppercase tracking-widest">Delivery Policy (ডেলিভারি পলিসি)</label>
                            <textarea rows={3} value={storeSettings.delivery_policy} onChange={e=>setStoreSettings({...storeSettings, delivery_policy: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#333333] text-white p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"></textarea>
                         </div>
                      </div>
                      <button onClick={handleSaveSettings} className="w-full mt-5 bg-[#D4AF37] text-[#111111] px-8 py-4 text-sm font-bold rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:bg-white transition-colors duration-300 tracking-widest uppercase border border-transparent">Save Pages Content</button>
                  </div>
                </div>
              )}

              {/* Admin: Orders Tab */}
              {adminTab === 'orders' && (
                <div className="space-y-6">
                  {orders.length === 0 ? <p className="text-center py-12 text-gray-500 font-bold border-2 border-dashed border-[#333333] rounded-sm bg-[#111111] tracking-widest uppercase text-sm">No orders found.</p> : orders.map(order => (
                    <div key={order.id} className="bg-[#111111] p-6 md:p-8 border border-[#333333] rounded-sm shadow-sm hover:border-[#D4AF37]/50 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#333333] pb-4 mb-5 gap-4">
                        <div>
                           <p className="font-black text-lg text-white uppercase tracking-wider">Order #{order.id.split('-')[0]}</p>
                           <div className="flex items-center gap-3 mt-2">
                             <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase bg-[#1A1A1A] px-2 py-1 rounded-sm border border-[#333333]">{new Date(order.created_at).toLocaleString()}</p>
                             {/* 🟢 DYNAMIC BADGE COLOR FOR ORDER STATUS */}
                             <p className={`text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-wider border ${getStatusColor(order.status)}`}>{order.payment_method}</p>
                           </div>
                        </div>
                        <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className={`text-xs font-bold p-2.5 rounded-sm outline-none cursor-pointer shadow-inner uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                          <option value="PENDING" className="bg-[#1A1A1A] text-white">PENDING</option>
                          <option value="CONFIRMED" className="bg-[#1A1A1A] text-white">CONFIRMED</option>
                          <option value="PROCESSING" className="bg-[#1A1A1A] text-white">PROCESSING</option>
                          <option value="SHIPPED" className="bg-[#1A1A1A] text-white">SHIPPED</option>
                          <option value="DELIVERED" className="bg-[#1A1A1A] text-white">DELIVERED</option>
                          <option value="CANCELLED" className="bg-[#1A1A1A] text-white">CANCELLED</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="bg-[#1A1A1A] p-5 rounded-sm border border-[#333333] shadow-inner">
                          <p className="text-[10px] text-[#D4AF37] mb-2 font-black uppercase tracking-widest border-b border-[#333333] pb-1">Customer Details</p>
                          <p className="font-bold text-white text-lg mb-1">{order.customer_name}</p>
                          <p className="font-medium text-gray-400">{order.customer_phone}</p>
                        </div>
                        <div className="bg-[#1A1A1A] p-5 rounded-sm border border-[#333333] shadow-inner">
                          <p className="text-[10px] text-[#D4AF37] mb-2 font-black uppercase tracking-widest border-b border-[#333333] pb-1">Shipping Info</p>
                          <p className="line-clamp-2 font-medium text-gray-400 mb-3">{order.customer_address}</p>
                          <p className="font-black text-white text-xl border-t border-[#333333] pt-2">Total: <span className="text-[#D4AF37]">৳{order.total_amount}</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin: Products Tab */}
              {adminTab === 'products' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map(item => renderProductCard(item, true))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #D4AF37; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #EAEAEA; }
      `}} />
    </main>
  );
}