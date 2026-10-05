"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

interface Product {
  id: string; 
  name: string; 
  price: string; 
  original_price?: string;
  cost_price?: string; 
  stock_count?: number; 
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
  selected_size?: string;
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
  ip_address?: string;
  location?: string;
}

interface Review {
  id: string; 
  product_id: string; 
  customer_name: string; 
  rating: number; 
  comment: string; 
  created_at: string; 
}

const fontOptions = [
  { name: "Default Font (Sans Serif)", value: "sans-serif" },
  { name: "Hind Siliguri (Clean Bengali)", value: "'Hind Siliguri', sans-serif" },
  { name: "Noto Serif Bengali (Royal & Elegant)", value: "'Noto Serif Bengali', serif" },
  { name: "Baloo Da 2 (Soft & Modern)", value: "'Baloo Da 2', cursive" },
  { name: "Tiro Bangla (Classic Book Style)", value: "'Tiro Bangla', serif" },
  { name: "Mina (Contemporary Bangla)", value: "'Mina', sans-serif" },
  { name: "Anek Bangla (Bold & Wide)", value: "'Anek Bangla', sans-serif" },
  { name: "Galada (Stylized Bangla)", value: "'Galada', cursive" },
  { name: "Atma (Playful & Casual)", value: "'Atma', cursive" },
  { name: "Playfair Display (English Luxury)", value: "'Playfair Display', serif" },
  { name: "Cinzel (English Royal)", value: "'Cinzel', serif" },
  { name: "Montserrat (English Minimal)", value: "'Montserrat', sans-serif" },
  { name: "Poppins (English Modern)", value: "'Poppins', sans-serif" },
  { name: "Oswald (English Tall)", value: "'Oswald', sans-serif" },
  { name: "Roboto (English Standard)", value: "'Roboto', sans-serif" }
];

const MASTER_ADMINS = ["kazitomalislam7@gmail.com"];

const getProductViews = (id: string) => {
  if (!id) return 1200;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 4000) + 1200; 
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategories, setActiveSubCategories] = useState<Record<string, string>>({});

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Free Size');
  const [activeImage, setActiveImage] = useState<string>(''); 
  const [liveVisitors, setLiveVisitors] = useState(14);
  const [stockLeftVisual, setStockLeftVisual] = useState(3);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); 
  const [abandonedDraftId, setAbandonedDraftId] = useState<string | null>(null);
  
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

  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState({ name: '', email: '', avatar: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false); 

  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'orders' | 'abandoned' | 'products' | 'customers' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState(''); 
  const [newPrice, setNewPrice] = useState(''); 
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newStockCount, setNewStockCount] = useState<number>(10);
  const [newImageUrl, setNewImageUrl] = useState(''); 
  const [newImageUrl2, setNewImageUrl2] = useState(''); 
  const [newImageUrl3, setNewImageUrl3] = useState(''); 
  const [newImageUrl4, setNewImageUrl4] = useState('');
  const [newDescription, setNewDescription] = useState(''); 
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategoryStr, setCustomCategoryStr] = useState('');
  
  const [newSubCategory, setNewSubCategory] = useState(''); 
  const [newBrand, setNewBrand] = useState(''); 
  const [newColor, setNewColor] = useState(''); 
  const [newInStock, setNewInStock] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkOriginalPrice, setBulkOriginalPrice] = useState('');
  const [bulkOfferPrice, setBulkOfferPrice] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const [customSections, setCustomSections] = useState<{id: string, title: string, fontSize: number, imageUrl: string, color?: string, imageHeight?: number}[]>([]);

  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{show: boolean, orderId: string}>({show: false, orderId: ''});
  const [fomoMsg, setFomoMsg] = useState<Product | null>(null);
  const [animateCart, setAnimateCart] = useState(false);

  const [storeSettings, setStoreSettings] = useState({
    shop_name: 'Zeenat Mart', 
    phone: '01632331534',
    logo_url: '',
    flashDealActive: false,
    endTime: Date.now() + 12 * 60 * 60 * 1000,
    bg_enabled: true,
    bg_opacity: 70,
    font_family: 'sans-serif',
    brand_name_color: '#B8860B',
    heading_color: '#B8860B',
    page_text_color: '#374151',
    fb_page_url: 'https://m.me/61581595917703',
    default_sort: 'lowToHigh', 
    category_order: '', 
    free_delivery_threshold: 1400, 
    contact_info: 'অফিস: ঢাকা\nফোন: 01632331534\nইমেইল: support@zeenat.com',
    return_policy: 'পণ্য হাতে পাওয়ার পর যদি কোনো ত্রুটি থাকে, তবে ২৪ ঘণ্টার মধ্যে আমাদের সাথে যোগাযোগ করুন।',
    delivery_policy: 'ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা (১-২ দিন)।\nঢাকার বাইরে ডেলিভারি চার্জ ১২০ টাকা (২-৪ দিন)।',
    banners: [
      { title: "", subtitle: "", imageUrl: "" }, { title: "", subtitle: "", imageUrl: "" },
      { title: "", subtitle: "", imageUrl: "" }, { title: "", subtitle: "", imageUrl: "" }, { title: "", subtitle: "", imageUrl: "" }
    ],
    category_banners: {} as any,
    blocklist: [] as string[],
    staff_emails: [] as string[]
  });
  
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const isMasterAdmin = user && MASTER_ADMINS.includes(user.email);
  const isStaff = user && storeSettings.staff_emails?.includes(user.email);
  const isAdmin = isMasterAdmin || isStaff;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openProductModal = (product: Product) => {
    setViewingProduct(product);
    setActiveImage(product.image_url || '');
    setSelectedQuantity(1);
    setSelectedSize('Free Size');
    setLiveVisitors(Math.floor(Math.random() * 25) + 5);
    setStockLeftVisual(Math.floor(Math.random() * 8) + 2);
    if (typeof window !== "undefined") {
      const newUrl = `${window.location.pathname}?product=${product.id}`;
      window.history.pushState({ productId: product.id }, '', newUrl);
    }
  };

  const closeProductModal = () => {
    setViewingProduct(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.pushState({}, '', url.pathname);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const pid = params.get('product');
        if (pid && products.length > 0) {
          const found = products.find(p => p.id === pid);
          if (found) {
            setViewingProduct(found);
            setActiveImage(found.image_url || '');
            return;
          }
        }
        setViewingProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  useEffect(() => {
    if (products.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('product');
      if (pid) {
        const found = products.find(p => p.id === pid);
        if (found) {
          setViewingProduct(found);
          setActiveImage(found.image_url || '');
        }
      }
    }
  }, [products]);

  useEffect(() => {
    if (showAuthModal) {
      setAuthView('LOGIN');
    }
  }, [showAuthModal]);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
       const randomProduct = products[Math.floor(Math.random() * products.length)];
       setFomoMsg(randomProduct);
       setTimeout(() => setFomoMsg(null), 6000); 
    }, 28000); 
    return () => clearInterval(interval);
  }, [products]);

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
        setUserData({ 
          name: session.user.user_metadata?.full_name || '', 
          email: session.user.email || '', 
          avatar: session.user.user_metadata?.avatar_url || '' 
        });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { 
    if (isCartLoaded && typeof window !== "undefined") {
      localStorage.setItem('trendifyCart', JSON.stringify(cart)); 
    }
  }, [cart, isCartLoaded]);

  useEffect(() => { 
    if (isWishlistLoaded && typeof window !== "undefined") {
      localStorage.setItem('trendifyWishlist', JSON.stringify(wishlist)); 
    }
  }, [wishlist, isWishlistLoaded]);

  const activeBanners = storeSettings.banners ? storeSettings.banners.filter(b => b && b.imageUrl) : [];

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const bannerInterval = setInterval(() => { 
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length); 
    }, 5000);
    return () => clearInterval(bannerInterval);
  }, [activeBanners.length]);

  useEffect(() => { 
    if (viewingProduct) { 
      fetchReviews(viewingProduct.id); 
      setSelectedQuantity(1); 
    } 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingProduct]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (data) {
        let safeBanners = data.banners || [];
        if (typeof safeBanners === 'string') { 
          try { safeBanners = JSON.parse(safeBanners); } catch(e) { safeBanners = []; } 
        }
        if (Array.isArray(safeBanners)) { 
          safeBanners = safeBanners.map((b:any) => typeof b === 'string' ? JSON.parse(b) : b); 
        } else { 
          safeBanners = []; 
        }
        while(safeBanners.length < 5) { 
          safeBanners.push({title: "", subtitle: "", imageUrl: ""}); 
        }
        
        let safeCatBanners = data.category_banners || {};
        if (typeof safeCatBanners === 'string') { 
          try { safeCatBanners = JSON.parse(safeCatBanners); } catch(e) { safeCatBanners = {}; } 
        }

        let loadedSections = safeCatBanners['CUSTOM_SECTIONS'];
        if (typeof loadedSections === 'string') { 
          try { loadedSections = JSON.parse(loadedSections); } catch(e) { loadedSections = null; } 
        }
        
        if (!loadedSections || !Array.isArray(loadedSections)) {
            loadedSections = [];
            Object.keys(safeCatBanners).forEach(key => {
                if (!['WEBSITE_BG', 'TXT_CONTACT', 'TXT_RETURN', 'TXT_DELIVERY', 'FLASH_ACTIVE', 'CUSTOM_SECTIONS', 'BG_ENABLED', 'BG_OPACITY', 'FONT_FAMILY', 'BRAND_NAME_COLOR', 'HEADING_COLOR', 'PAGE_TEXT_COLOR', 'FB_PAGE_URL', 'DEFAULT_SORT', 'CATEGORY_ORDER', 'FREE_DELIVERY_THRESHOLD', 'BLOCKLIST', 'STAFF_EMAILS'].includes(key)) {
                    loadedSections.push({ id: Date.now().toString() + Math.random(), title: key, fontSize: 36, imageUrl: safeCatBanners[key], color: '#B8860B', imageHeight: 300 });
                }
            });
        }
        setCustomSections(loadedSections);

        setStoreSettings(prev => ({ 
          ...prev, 
          ...data, 
          shop_name: data.shop_name || 'Zeenat Mart', 
          phone: data.phone || '01632331534', 
          fb_page_url: safeCatBanners['FB_PAGE_URL'] || 'https://m.me/61581595917703',
          default_sort: safeCatBanners['DEFAULT_SORT'] || 'lowToHigh',
          category_order: safeCatBanners['CATEGORY_ORDER'] || '',
          free_delivery_threshold: safeCatBanners['FREE_DELIVERY_THRESHOLD'] !== undefined ? Number(safeCatBanners['FREE_DELIVERY_THRESHOLD']) : 1400,
          banners: safeBanners, 
          category_banners: safeCatBanners,
          contact_info: safeCatBanners['TXT_CONTACT'] || prev.contact_info,
          return_policy: safeCatBanners['TXT_RETURN'] || prev.return_policy,
          delivery_policy: safeCatBanners['TXT_DELIVERY'] || prev.delivery_policy,
          flashDealActive: safeCatBanners['FLASH_ACTIVE'] !== undefined ? safeCatBanners['FLASH_ACTIVE'] : false,
          bg_enabled: safeCatBanners['BG_ENABLED'] !== undefined ? safeCatBanners['BG_ENABLED'] : true,
          bg_opacity: safeCatBanners['BG_OPACITY'] !== undefined ? Number(safeCatBanners['BG_OPACITY']) : 70,
          font_family: safeCatBanners['FONT_FAMILY'] || 'sans-serif',
          brand_name_color: safeCatBanners['BRAND_NAME_COLOR'] || '#B8860B',
          heading_color: safeCatBanners['HEADING_COLOR'] || '#B8860B',
          page_text_color: safeCatBanners['PAGE_TEXT_COLOR'] || '#374151',
          blocklist: safeCatBanners['BLOCKLIST'] || [],
          staff_emails: safeCatBanners['STAFF_EMAILS'] || []
        }));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try { 
      setLoading(true); 
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }); 
      if (error) throw error; 
      if (data) setProducts(data); 
    } catch(err) {
      console.error(err);
    } finally { 
      setLoading(false); 
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch(err) {
      console.error(err);
    }
  };

  const fetchUserOrders = async (userId: string) => {
    try {
      const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }); 
      if (data) setUserOrders(data);
    } catch(err) {
      console.error(err);
    }
  };

  const fetchReviews = async (productId: string) => {
    try {
      const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
      if (data) setProductReviews(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    if(showAdminDashboard && ['dashboard', 'orders', 'customers', 'abandoned'].includes(adminTab)) {
      fetchOrders(); 
    }
  }, [showAdminDashboard, adminTab]);

  const uniqueCustomers = useMemo(() => {
    const customerMap: Record<string, { name: string, phone: string, address: string, orderCount: number, totalSpent: number, lastOrder: string, cancelledCount: number }> = {};
    orders.forEach(order => {
       const key = order.customer_phone;
       if (!key || order.status === 'ABANDONED_CART') return;
       if (!customerMap[key]) {
           customerMap[key] = { 
             name: order.customer_name, 
             phone: order.customer_phone, 
             address: order.customer_address, 
             orderCount: 0, 
             totalSpent: 0, 
             lastOrder: order.created_at, 
             cancelledCount: 0 
           };
       }
       customerMap[key].orderCount += 1;
       if(order.status === 'DELIVERED') customerMap[key].totalSpent += Number(order.total_amount) || 0;
       if(order.status === 'CANCELLED') customerMap[key].cancelledCount += 1;
       if (new Date(order.created_at) > new Date(customerMap[key].lastOrder)) {
           customerMap[key].lastOrder = order.created_at;
       }
    });
    return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const getFraudBadge = (phone: string, ip?: string) => {
    const userOrders = orders.filter(o => (o.customer_phone === phone || (ip && o.ip_address === ip)) && o.status !== 'ABANDONED_CART');
    const total = userOrders.length;
    if (total === 0) return { label: '🟡 New Customer', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    
    const delivered = userOrders.filter(o => o.status === 'DELIVERED').length;
    const cancelled = userOrders.filter(o => o.status === 'CANCELLED').length;
    
    if (cancelled > 0 && (cancelled / total) >= 0.5) {
      return { label: '🔴 High Risk / Fraud', color: 'bg-red-100 text-red-800 border-red-300' };
    }
    if (delivered >= 3 && cancelled === 0) {
      return { label: '🟢 Safe Buyer', color: 'bg-green-100 text-green-800 border-green-300' };
    }
    if (total === 1) {
      return { label: '🟡 New Customer', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
    return { label: '🔵 Regular Buyer', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  };

  const toggleBlockCustomer = async (phone: string) => {
     if(!isMasterAdmin) return showToast("Only Master Admin can block customers", "error");
     
     const currentList = storeSettings.blocklist || [];
     const newList = currentList.includes(phone) ? currentList.filter(p => p !== phone) : [...currentList, phone];
     
     const newCatBanners = { ...storeSettings.category_banners, BLOCKLIST: newList };
     try {
       await supabase.from('store_settings').update({ category_banners: newCatBanners }).eq('id', 1);
       setStoreSettings(prev => ({ ...prev, blocklist: newList, category_banners: newCatBanners }));
       showToast(currentList.includes(phone) ? "Customer unblocked!" : "Customer blocked successfully!", "success");
     } catch (e) { 
       showToast("Failed to update blocklist", "error"); 
     }
  };

  const exportOrdersCSV = () => {
     const headers = "Order ID,Customer Name,Phone,Address,Amount,Payment,Status,Items\n";
     const rows = orders.filter(o=>o.status !== 'ABANDONED_CART').map(o => {
       const itemsStr = (o.items||[]).map(i => `${i.name} (Qty: ${i.quantity})`).join('; ');
       return `"${o.id}","${o.customer_name}","${o.customer_phone}","${o.customer_address.replace(/"/g, '""')}","${o.total_amount}","${o.payment_method}","${o.status}","${itemsStr}"`;
     }).join('\n');
     
     const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url; 
     link.setAttribute('download', 'orders_export.csv');
     document.body.appendChild(link); 
     link.click(); 
     document.body.removeChild(link);
  };

  const bulkPrintPendingInvoices = () => {
     const pending = orders.filter(o => o.status === 'PENDING');
     if(pending.length === 0) return showToast("No pending orders to print!", "error");
     
     let printContents = `
     <html>
     <head>
       <title>Print Invoices</title>
       <style>
          body { font-family: sans-serif; padding: 20px; }
          .invoice { border: 2px dashed #ccc; padding: 30px; margin-bottom: 40px; page-break-after: always; max-width: 600px; margin-left: auto; margin-right: auto;}
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .details { margin-bottom: 20px; line-height: 1.6; }
          .items table { width: 100%; border-collapse: collapse; margin-bottom: 20px;}
          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .total { font-size: 20px; font-weight: bold; text-align: right; }
       </style>
     </head>
     <body>`;

     pending.forEach(o => {
        printContents += `
        <div class="invoice">
           <div class="header">
              <h2>${storeSettings.shop_name}</h2>
              <p>Phone: ${storeSettings.phone}</p>
              <h3>INVOICE #${o.id.split('-')[0]}</h3>
           </div>
           <div class="details">
              <strong>To:</strong> ${o.customer_name}<br/>
              <strong>Phone:</strong> ${o.customer_phone}<br/>
              <strong>Address:</strong> ${o.customer_address}<br/>
              <strong>Payment:</strong> ${o.payment_method}<br/>
              <strong>Date:</strong> ${new Date(o.created_at).toLocaleString()}
           </div>
           <div class="items">
              <table>
                 <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
                 ${(o.items||[]).map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price} ৳</td></tr>`).join('')}
              </table>
           </div>
           <div class="total">
              <p>Delivery: ${o.shipping_charge} ৳</p>
              <p>Total Due: ${o.total_amount} ৳</p>
           </div>
        </div>`;
     });
     
     printContents += `</body></html>`;
     
     const win = window.open('', '', 'width=900,height=700');
     if(win) {
         win.document.write(printContents);
         win.document.close();
         setTimeout(() => win.print(), 500);
     }
  };

  const formatPrice = (price?: string) => {
    return price ? (price.toString().includes('৳') ? price : `${price}`) : '';
  };

  const getNumericPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const engStr = String(priceStr)
      .replace(/০/g, '0').replace(/১/g, '1').replace(/২/g, '2').replace(/৩/g, '3').replace(/৪/g, '4')
      .replace(/৫/g, '5').replace(/৬/g, '6').replace(/৭/g, '7').replace(/৮/g, '8').replace(/৯/g, '9');
    return Number(engStr.replace(/[^0-9.-]+/g,"")) || 0;
  };

  const calculateDiscount = (original: string, current: string) => {
    const o = getNumericPrice(original);
    const c = getNumericPrice(current);
    if (o > c && o > 0) return Math.round(((o - c) / o) * 100); 
    return 0;
  };

  const triggerCartAnimation = () => { 
    setAnimateCart(true); 
    setTimeout(() => setAnimateCart(false), 300); 
  };

  const addToCart = (product: Product, qty: number = 1) => {
    if(product.stock_count !== undefined && product.stock_count <= 0) {
      return showToast("দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টকে নেই!", "error");
    }
    if(product.in_stock === false) {
      return showToast("দুঃখিত, স্টকে নেই!", "error");
    }
    
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item));
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
    
    showToast("প্রোডাক্টটি ব্যাগে যোগ করা হয়েছে!", "success");
    triggerCartAnimation();
  };

  const toggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const existing = wishlist.find(item => item.id === product.id);
    if (existing) { 
      setWishlist(wishlist.filter(item => item.id !== product.id)); 
      showToast("উইশলিস্ট থেকে সরানো হয়েছে!", "success"); 
    } else { 
      setWishlist([...wishlist, product]); 
      showToast("উইশলিস্টে যোগ করা হয়েছে!", "success"); 
    }
  };

  const handleDirectOrder = (product: Product, qty: number = 1, e?: React.MouseEvent) => {
    if(e) e.stopPropagation(); 
    if(product.stock_count !== undefined && product.stock_count <= 0) {
      return showToast("দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টকে নেই!", "error");
    }
    if(product.in_stock === false) {
      return showToast("দুঃখিত, স্টকে নেই!", "error");
    }
    
    const existing = cart.find(item => item.id === product.id);
    if (!existing) {
      setCart([...cart, { ...product, quantity: qty }]);
    }
    
    closeProductModal(); 
    setIsCartOpen(false); 
    setIsCheckoutOpen(true); 
  };

  const updateQuantity = (id: string, delta: number) => { 
    setCart(cart.map(item => { 
      if (item.id === id) { 
        const newQty = item.quantity + delta; 
        return newQty > 0 ? { ...item, quantity: newQty } : item; 
      } 
      return item; 
    })); 
  };

  const removeFromCart = (id: string) => { 
    setCart(cart.filter((item) => item.id !== id)); 
    showToast("ব্যাগ থেকে সরানো হয়েছে", "success"); 
  };

  const removeFromWishlist = (id: string) => { 
    setWishlist(wishlist.filter((item) => item.id !== id)); 
    showToast("রিমুভ করা হয়েছে", "success"); 
  };

  const itemsSubtotal = cart.reduce((total, item) => total + (getNumericPrice(item.price) * item.quantity), 0);
  const isFreeDelivery = storeSettings.free_delivery_threshold > 0 && itemsSubtotal >= storeSettings.free_delivery_threshold;
  const actualShippingFee = isFreeDelivery ? 0 : (shippingLocation === 'inside' ? 60 : 120);
  const cartTotal = itemsSubtotal + actualShippingFee;
  const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handlePhoneBlur = async () => {
     if(cart.length > 0 && customerPhone.length === 11 && !storeSettings.blocklist?.includes(customerPhone)) {
        try {
          const orderData: any = { 
            customer_name: customerName || 'Guest', 
            customer_phone: customerPhone, 
            customer_address: customerAddress || 'Typing...', 
            total_amount: cartTotal, 
            payment_method: 'Draft', 
            items: cart, 
            status: 'ABANDONED_CART', 
            shipping_charge: actualShippingFee 
          };
          
          if(abandonedDraftId) { 
            await supabase.from('orders').update(orderData).eq('id', abandonedDraftId); 
          } else { 
            const { data } = await supabase.from('orders').insert([orderData]).select(); 
            if(data && data[0]) setAbandonedDraftId(data[0].id); 
          }
        } catch(e) {
          console.error("Failed to save draft:", e);
        }
     }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if(isCheckingOut) return; 
    if(cart.length === 0) return showToast("আপনার ব্যাগ খালি!", "error");

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(customerPhone)) {
      return showToast("সঠিক বাংলাদেশী ১১-ডিজিটের মোবাইল নম্বর দিন!", "error");
    }
    if (storeSettings.blocklist?.includes(customerPhone)) {
      return showToast("দুঃখিত, আপনার অ্যাকাউন্টটি ব্লক করা আছে।", "error");
    }

    const finalPaymentMethodText = paymentMethod === 'COD' ? 'Cash on Delivery' : `${paymentMethod} (TrxID: ${transactionId})`;
    await processOrderExecution(finalPaymentMethodText);
  };

  const processOrderExecution = async (payMethodType: string) => {
    setIsCheckingOut(true);
    let userIp = 'Unknown'; 
    let userLocation = 'Unknown';
    
    try { 
      const res = await fetch('https://ipapi.co/json/'); 
      const ipData = await res.json(); 
      userIp = ipData.ip || 'Unknown'; 
      userLocation = `${ipData.city || ''}, ${ipData.region || ''}, ${ipData.org || ''}`; 
    } catch(err) {
      console.error("IP Fetch error");
    }

    try {
      const orderData: any = { 
        customer_name: customerName, 
        customer_phone: customerPhone, 
        customer_address: customerAddress + ` [Shipping: ${shippingLocation === 'inside' ? 'Inside' : 'Outside'}]`, 
        total_amount: cartTotal, 
        payment_method: payMethodType, 
        items: cart, 
        status: 'PENDING', 
        shipping_charge: actualShippingFee, 
        ip_address: userIp, 
        location: userLocation 
      };
      
      if (user && user.id) {
        orderData.user_id = user.id;
      }

      let createdOrderId = '';
      
      if(abandonedDraftId) { 
        const { data } = await supabase.from('orders').update(orderData).eq('id', abandonedDraftId).select(); 
        createdOrderId = data && data[0] ? data[0].id : 'ORD_' + Date.now(); 
      } else { 
        const { data } = await supabase.from('orders').insert([orderData]).select(); 
        createdOrderId = data && data[0] ? data[0].id : 'ORD_' + Date.now(); 
      }

      for (const item of cart) {
         if (item.stock_count !== undefined) {
             const remain = item.stock_count - item.quantity;
             await supabase.from('products').update({ 
               stock_count: remain < 0 ? 0 : remain, 
               in_stock: remain > 0 
             }).eq('id', item.id);
         }
      }

      if (typeof window !== 'undefined' && (window as any).fbq) { 
        (window as any).fbq('track', 'Purchase', { 
          value: cartTotal, 
          currency: 'BDT', 
          content_name: 'Order', 
          content_type: 'product', 
          num_items: totalItemsCount 
        }, { eventID: createdOrderId }); 
      }
      
      if (user && user.id) {
        fetchUserOrders(user.id);
      }
      
      setCart([]); 
      setIsCheckoutOpen(false); 
      setIsCartOpen(false); 
      setCustomerName(''); 
      setCustomerPhone(''); 
      setCustomerAddress(''); 
      setTransactionId(''); 
      setAbandonedDraftId(null);
      setOrderSuccess({show: true, orderId: createdOrderId.split('-')[0]}); 
      fetchProducts();
      
    } catch (error: any) { 
      showToast("অর্ডার প্লেস করতে সমস্যা হয়েছে!", "error"); 
    } finally { 
      setIsCheckingOut(false); 
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setAuthLoading(true);
    try {
      if (authView === 'LOGIN') { 
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }); 
        if (error) throw error; 
        showToast("স্বাগতম!", "success"); 
        setShowAuthModal(false); 
      } else { 
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword }); 
        if (error) throw error; 
        showToast("অ্যাকাউন্ট তৈরি হয়েছে!", "success"); 
        setShowAuthModal(false); 
      }
    } catch (error: any) { 
      showToast(error.message, "error"); 
    } finally { 
      setAuthLoading(false); 
    }
  };

  const handleGoogleLogin = async () => { 
    setAuthLoading(true); 
    try { 
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' }); 
      if (error) throw error; 
    } catch (error: any) { 
      showToast(error.message, "error"); 
    } finally { 
      setAuthLoading(false); 
    } 
  };

  const handleLogout = async () => { 
    const { error } = await supabase.auth.signOut(); 
    if (!error) { 
      showToast("লগআউট সফল।", "success"); 
      setShowProfileModal(false); 
      window.location.reload(); 
    } 
  };

  const handleTrackOrder = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!trackingPhone) return; 
    setIsTracking(true); 
    try { 
      const { data, error } = await supabase.from('orders').select('*').eq('customer_phone', trackingPhone).order('created_at', { ascending: false }); 
      if (error) throw error; 
      setTrackedOrders(data || []); 
    } catch (error) { 
      showToast("অর্ডার খুঁজে পাওয়া যায়নি।", "error"); 
    } finally { 
      setIsTracking(false); 
    } 
  };

  const handleReviewSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!viewingProduct) return; 
    setIsReviewSubmitting(true); 
    try { 
      const { error } = await supabase.from('reviews').insert([{ 
        product_id: viewingProduct.id, 
        customer_name: newReviewName || 'গ্রাহক', 
        rating: newReviewRating, 
        comment: newReviewComment 
      }]); 
      if (error) throw error; 
      showToast("রিভিউ সফলভাবে সাবমিট হয়েছে!", "success"); 
      setNewReviewComment(''); 
      fetchReviews(viewingProduct.id); 
    } catch (error) { 
      showToast("রিভিউ সাবমিট ব্যর্থ হয়েছে।", "error"); 
    } finally { 
      setIsReviewSubmitting(false); 
    } 
  };

  const updateOrderStatus = async (id: string, newStatus: string) => { 
    try { 
      await supabase.from('orders').update({ status: newStatus }).eq('id', id); 
      fetchOrders(); 
      showToast("স্ট্যাটাস আপডেট হয়েছে", "success"); 
    } catch(err) {
      console.error(err);
    } 
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PENDING': return 'text-yellow-600 bg-yellow-100 border border-yellow-300';
          case 'CONFIRMED': return 'text-blue-600 bg-blue-100 border border-blue-300';
          case 'PROCESSING': return 'text-purple-600 bg-purple-100 border border-purple-300';
          case 'SHIPPED': return 'text-cyan-600 bg-cyan-100 border border-cyan-300';
          case 'DELIVERED': return 'text-green-600 bg-green-100 border border-green-300';
          case 'CANCELLED': return 'text-red-600 bg-red-100 border border-red-300';
          default: return 'text-gray-600 bg-gray-100 border border-gray-300';
      }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string, index?: number, catName?: string) => {
    const file = e.target.files?.[0]; 
    if(!file) return; 
    
    setUploadingType(type === 'custom_section' ? `custom_${catName}` : type);
    const cleanFileName = `${Date.now()}_img_${Math.floor(Math.random() * 10000)}.${file.name.split('.').pop()}`;
    
    try {
      const { error: uploadError } = await supabase.storage.from('products').upload(cleanFileName, file);
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
      
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(cleanFileName);
      
      if (type === 'logo') {
        await supabase.from('store_settings').update({ logo_url: publicUrl }).eq('id', 1);
      } else if (type === 'banner' && index !== undefined) {
         let newBanners = [...storeSettings.banners];
         newBanners[index].imageUrl = publicUrl;
         await supabase.from('store_settings').update({ banners: newBanners }).eq('id', 1);
      } else if (type === 'website_bg') {
         const newCatBanners = { ...storeSettings.category_banners, ['WEBSITE_BG']: publicUrl };
         await supabase.from('store_settings').update({ category_banners: newCatBanners }).eq('id', 1);
      } else if (type === 'custom_section' && catName) {
         setCustomSections(prev => prev.map(s => s.id === catName ? { ...s, imageUrl: publicUrl } : s));
         showToast("ব্যানার আপলোড হয়েছে! সেভ করুন।", "success"); 
         setUploadingType(null); 
         return; 
      } else if (type === 'product1') {
        setNewImageUrl(publicUrl); 
      } else if (type === 'product2') {
        setNewImageUrl2(publicUrl); 
      } else if (type === 'product3') {
        setNewImageUrl3(publicUrl); 
      } else if (type === 'product4') {
        setNewImageUrl4(publicUrl);
      }
      
      fetchSettings(); 
    } catch (error: any) { 
      showToast("আপলোড ব্যর্থ!", "error"); 
    } finally { 
      setUploadingType(null); 
    }
  };

  const handleRemoveImage = async (type: string, index?: number) => {
    if (!window.confirm("মুছে ফেলতে চান?")) return;
    try {
      if (type === 'logo') {
        await supabase.from('store_settings').update({ logo_url: '' }).eq('id', 1);
      } else if (type === 'website_bg') {
        const newCatBanners = { ...storeSettings.category_banners }; 
        delete newCatBanners['WEBSITE_BG'];
        await supabase.from('store_settings').update({ category_banners: newCatBanners }).eq('id', 1);
      } else if (type === 'banner' && index !== undefined) {
        let newBanners = [...storeSettings.banners]; 
        newBanners[index].imageUrl = '';
        await supabase.from('store_settings').update({ banners: newBanners }).eq('id', 1);
      }
      
      showToast("মুছে ফেলা হয়েছে!", "success"); 
      fetchSettings(); 
    } catch (error: any) {
      console.error(error);
    }
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
         'CUSTOM_SECTIONS': customSections, 
         'BG_ENABLED': storeSettings.bg_enabled,
         'BG_OPACITY': storeSettings.bg_opacity, 
         'FONT_FAMILY': storeSettings.font_family, 
         'BRAND_NAME_COLOR': storeSettings.brand_name_color,
         'HEADING_COLOR': storeSettings.heading_color, 
         'PAGE_TEXT_COLOR': storeSettings.page_text_color, 
         'FB_PAGE_URL': storeSettings.fb_page_url,
         'DEFAULT_SORT': storeSettings.default_sort, 
         'CATEGORY_ORDER': storeSettings.category_order, 
         'FREE_DELIVERY_THRESHOLD': storeSettings.free_delivery_threshold,
         'BLOCKLIST': storeSettings.blocklist, 
         'STAFF_EMAILS': storeSettings.staff_emails
      };
      
      await supabase.from('store_settings').update({ 
        shop_name: storeSettings.shop_name, 
        phone: storeSettings.phone, 
        category_banners: newCatBanners 
      }).eq('id', 1);
      
      showToast("সেটিংস সেভ হয়েছে!", "success"); 
      fetchSettings();
    } catch (error: any) { 
      showToast("সেটিংস সেভ করতে সমস্যা!", "error"); 
    }
  };

  const handleBulkPriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCategory || !bulkOfferPrice) {
      return showToast("ক্যাটাগরি এবং অফার প্রাইস দিন!", "error");
    }
    if (!window.confirm(`"${bulkCategory}" আপডেট করতে চান?`)) {
      return;
    }
    
    setIsBulkUpdating(true);
    try {
      const productsToUpdate = products.filter(p => (p.category || '').split(',').map(c=>c.trim()).includes(bulkCategory));
      if (productsToUpdate.length === 0) { 
        setIsBulkUpdating(false); 
        return showToast("প্রোডাক্ট পাওয়া যায়নি!", "error"); 
      }
      
      await supabase.from('products').update({ 
        original_price: bulkOriginalPrice || null, 
        price: bulkOfferPrice 
      }).in('id', productsToUpdate.map(p => p.id));
      
      showToast(`আপডেট হয়েছে!`, "success"); 
      setBulkOriginalPrice(''); 
      setBulkOfferPrice(''); 
      setBulkCategory(''); 
      fetchProducts();
    } catch (error: any) { 
      showToast("সমস্যা হয়েছে!", "error"); 
    } finally { 
      setIsBulkUpdating(false); 
    }
  };

  const handleCategoryToggle = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const openAddModal = () => { 
    setEditingProductId(null); 
    setNewName(''); 
    setNewPrice(''); 
    setNewOriginalPrice(''); 
    setNewCostPrice(''); 
    setNewStockCount(10);
    setNewImageUrl(''); 
    setNewImageUrl2(''); 
    setNewImageUrl3(''); 
    setNewImageUrl4(''); 
    setNewDescription(''); 
    setSelectedCategories([]); 
    setCustomCategoryStr(''); 
    setNewSubCategory(''); 
    setNewBrand(''); 
    setNewColor(''); 
    setNewInStock(true); 
    setShowProductModal(true); 
    setShowAdminDashboard(false); 
  };
  
  const openEditModal = (product: Product, e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setEditingProductId(product.id); 
    setNewName(product.name || ''); 
    setNewPrice(product.price || ''); 
    setNewOriginalPrice(product.original_price || ''); 
    setNewCostPrice(product.cost_price || ''); 
    setNewStockCount(product.stock_count || 0);
    setNewImageUrl(product.image_url || ''); 
    setNewImageUrl2(product.image_url_2 || ''); 
    setNewImageUrl3(product.image_url_3 || ''); 
    setNewImageUrl4(product.image_url_4 || '');
    setNewDescription(product.description || ''); 
    setSelectedCategories(product.category ? product.category.split(',').map(c => c.trim()) : []); 
    setCustomCategoryStr(''); 
    setNewSubCategory(product.tag || ''); 
    setNewBrand(product.brand || ''); 
    setNewColor(product.color || ''); 
    setNewInStock(product.in_stock !== false); 
    setShowProductModal(true); 
    setShowAdminDashboard(false);
  };
  
  const handleDeleteProduct = async (id: string, e?: React.MouseEvent) => { 
    if(e) e.stopPropagation(); 
    if (!window.confirm("ডিলিট করতে চান?")) return; 
    try { 
      await supabase.from('products').delete().eq('id', id); 
      fetchProducts(); 
      showToast("ডিলিট হয়েছে!", "success"); 
    } catch (error) {
      console.error(error);
    } 
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSaving(true);
    try {
      const finalCategories = Array.from(new Set([...selectedCategories, ...customCategoryStr.split(',').map(c=>c.trim()).filter(Boolean)]));
      const productData = { 
        name: newName || '', 
        price: newPrice, 
        original_price: newOriginalPrice || null, 
        cost_price: newCostPrice || null, 
        stock_count: newStockCount,
        image_url: newImageUrl || null, 
        image_url_2: newImageUrl2 || null, 
        image_url_3: newImageUrl3 || null, 
        image_url_4: newImageUrl4 || null, 
        description: newDescription || null, 
        category: finalCategories.length > 0 ? finalCategories.join(', ') : "New Category", 
        in_stock: newStockCount > 0, 
        tag: newSubCategory, 
        brand: newBrand || null, 
        color: newColor || null
      };
      
      if (editingProductId) {
        await supabase.from('products').update(productData).eq('id', editingProductId); 
      } else {
        await supabase.from('products').insert([productData]);
      }
      
      setShowProductModal(false); 
      fetchProducts(); 
      showToast("সেভ হয়েছে!", "success");
    } catch (error: any) { 
      showToast("Error saving product", "error"); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleSubCategoryClick = (catName: string, subName: string) => { 
    setActiveSubCategories(prev => ({ ...prev, [catName]: subName })); 
  };

  // DUMMY CATEGORIES REMOVED COMPLETELY
  const specialCategories: string[] = []; 
  const allDynamicCats = products.flatMap(p => (p.category || '').split(',').map(c=>c.trim())).filter(Boolean);
  const dynamicSidebarCategories = Array.from(new Set([...customSections.map(c => c.title), ...allDynamicCats]));
  
  // Custom Category Scrollable List now only contains Dynamic Categories
  const allCategoryOptions = Array.from(new Set([...dynamicSidebarCategories]));

  const filteredProducts = products.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = getNumericPrice(a.price); 
    const priceB = getNumericPrice(b.price);
    
    if (storeSettings.default_sort === 'lowToHigh') return priceA - priceB;
    if (storeSettings.default_sort === 'highToLow') return priceB - priceA;
    if (storeSettings.default_sort === 'newest') {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    }
    return 0;
  });

  const filteredAdminProducts = products.filter(item => 
    (item.name || '').toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
    (item.id || '').toLowerCase().includes(adminSearchQuery.toLowerCase())
  );
  
  const bgImage = storeSettings.category_banners?.['WEBSITE_BG'];
  const isBgVisible = storeSettings.bg_enabled && bgImage;

  const renderProductCard = (item: Product, isAdminView: boolean = false) => {
    const discount = item.original_price ? calculateDiscount(item.original_price, item.price) : 0;
    const inWishlist = wishlist.some(w => w.id === item.id);
    const isSoldOut = item.stock_count !== undefined && item.stock_count <= 0;

    return (
      <div 
        key={item.id} 
        className={`bg-white border border-[#EADFC8] flex flex-col relative w-full overflow-hidden transition-all duration-500 group rounded-md ${isSoldOut ? 'opacity-70' : 'hover:shadow-[0_8px_30px_rgb(212,175,55,0.15)] hover:border-[#D4AF37] cursor-pointer'}`} 
        onClick={() => !isSoldOut && openProductModal(item)}
      >
        {isSoldOut && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-red-600 text-white font-black px-4 py-2 rounded shadow-2xl rotate-[-15deg] uppercase tracking-widest text-sm border-2 border-white">
            SOLD OUT
          </div>
        )}

        {discount > 0 && !isSoldOut && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-bold rounded-full w-10 h-10 flex flex-col items-center justify-center z-10 leading-tight shadow-md border-2 border-white">
            {discount}%<span className="text-[8px] font-normal">ছাড়</span>
          </div>
        )}

        <button 
          onClick={(e) => toggleWishlist(item, e)} 
          className="absolute top-2 left-2 z-10 bg-white/80 backdrop-blur-md p-1.5 rounded-full hover:bg-white border border-[#EADFC8] shadow-sm transition"
        >
          {inWishlist ? <span className="text-red-500 text-sm">❤</span> : <span className="text-gray-400 text-sm hover:text-[#D4AF37]">🤍</span>}
        </button>
        
        {isAdminView && isMasterAdmin && (
          <div className="absolute top-12 left-2 z-10 flex flex-col gap-1">
             <button onClick={(e) => openEditModal(item, e)} className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded shadow hover:bg-blue-700 transition">Edit</button>
             <button onClick={(e) => handleDeleteProduct(item.id, e)} className="bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow hover:bg-red-700 transition">Delete</button>
          </div>
        )}

        <div className="w-full bg-[#FAF5EB] relative overflow-hidden flex items-center justify-center border-b border-[#EADFC8] h-[240px]">
             {item.image_url ? ( 
               <img src={item.image_url} loading="lazy" decoding="async" className={`w-full h-full object-cover absolute inset-0 transition-transform duration-700 ease-in-out ${isSoldOut ? 'grayscale' : 'group-hover:scale-105'}`} /> 
             ) : ( 
               <span className="text-gray-400 text-xs font-medium">No Image</span> 
             )}
        </div>
        
        <div className="p-4 flex flex-col items-center text-center flex-grow bg-white">
          <p className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-[0.2em] mb-1.5">{item.tag || item.category.split(',')[0]}</p>
          {item.name && item.name !== '' && <h4 className="text-[13px] text-[#111412] font-bold mb-2 line-clamp-1">{item.name}</h4>}
          
          <div className="flex flex-col items-center justify-center mb-4 mt-auto w-full leading-tight">
            {item.original_price && <span className="text-[12px] text-gray-400 line-through mb-0.5">৳ {formatPrice(item.original_price)}</span>}
            <span className="text-[#B8860B] font-black text-xl">{formatPrice(item.price)} ৳</span>
          </div>
          
          <div className="w-full flex flex-col gap-2">
            <button 
              onClick={(e) => handleDirectOrder(item, 1, e)} 
              disabled={isSoldOut} 
              className="w-full bg-[#111412] text-[#D4AF37] border border-[#D4AF37] text-[12px] font-bold py-2.5 rounded-sm flex items-center justify-center gap-1.5 hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500"
            >
              ⚡ অর্ডার করুন
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); addToCart(item, 1); }} 
              disabled={isSoldOut} 
              className="w-full bg-[#FAF5EB] text-[#111412] border border-[#EADFC8] text-[12px] font-bold py-2.5 rounded-sm flex items-center justify-center gap-1.5 hover:bg-[#EADFC8] transition-colors duration-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              🛒 ব্যাগে যোগ
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <main 
        className="min-h-screen text-[#111412] relative overflow-x-hidden scroll-smooth pb-16 md:pb-0" 
        style={{ 
          fontFamily: storeSettings.font_family, 
          backgroundColor: "#FAF5EB", 
          backgroundImage: isBgVisible ? `url('${bgImage}')` : "none", 
          backgroundSize: 'cover', 
          backgroundAttachment: 'fixed', 
          backgroundPosition: 'center' 
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;700&family=Atma:wght@400;700&family=Baloo+Da+2:wght@400;700&family=Cinzel:wght@400;700&family=Galada&family=Hind+Siliguri:wght@400;700&family=Mina:wght@400;700&family=Montserrat:wght@400;700&family=Noto+Serif+Bengali:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Roboto:wght@400;700&family=Tiro+Bangla&display=swap');
          
          @keyframes slideUp { 
            from { transform: translateY(100%); opacity: 0; } 
            to { transform: translateY(0); opacity: 1; } 
          }
          @keyframes bounceShort { 
            0%, 100% { transform: translate(-50%, 0); } 
            50% { transform: translate(-50%, -10px); } 
          }
          @keyframes shimmer { 
            0% { background-position: -1000px 0; } 
            100% { background-position: 1000px 0; } 
          }
          
          .animate-slide-up { animation: slideUp 0.5s ease-out forwards; } 
          .animate-bounce-short { animation: bounceShort 2s ease-in-out infinite; }
          .skeleton-shimmer { 
            animation: shimmer 2.5s infinite linear; 
            background: linear-gradient(to right, #FAF5EB 4%, #F2E9D8 25%, #FAF5EB 36%); 
            background-size: 1000px 100%; 
          }
          
          .custom-html-content h1 { font-size: 24px; font-weight: bold; color: #D4AF37; margin-bottom: 8px; } 
          .custom-html-content h2 { font-size: 20px; font-weight: bold; color: #D4AF37; margin-bottom: 8px; }
          .custom-html-content h3 { font-size: 16px; font-weight: bold; color: #D4AF37; margin-bottom: 6px; } 
          .custom-html-content b, .custom-html-content strong { color: #fff; font-weight: 900; }
          .custom-html-content ul { list-style-type: disc; padding-left: 20px; margin-bottom: 8px; } 
          .custom-html-content li { margin-bottom: 4px; }

          /* Custom Scrollbar for Category List */
          .category-scroll::-webkit-scrollbar {
             display: none;
          }
          .category-scroll {
             -ms-overflow-style: none;  /* IE and Edge */
             scrollbar-width: none;  /* Firefox */
          }
        `}} />

        <div 
          className="relative z-10 min-h-screen pb-16 transition-colors duration-300" 
          style={{ 
            backgroundColor: isBgVisible ? `rgba(250, 245, 235, ${storeSettings.bg_opacity / 100})` : 'transparent', 
            backdropFilter: isBgVisible ? 'blur(4px)' : 'none' 
          }}
        >
          <div className="bg-[#111412] text-[#D4AF37] text-[11px] py-2.5 px-4 md:px-12 flex justify-center md:justify-between items-center border-b border-[#D4AF37]/30">
            <div className="flex gap-4 items-center font-bold tracking-widest uppercase">
              <span>☎ হেল্পলাইন: {storeSettings.phone}</span>
              <span className="hidden md:inline px-4 border-l border-[#D4AF37]/30 text-[#EADFC8]">◀ এক্সক্লুসিভ অফার</span>
            </div>
            <div className="hidden md:flex gap-4 font-bold tracking-widest uppercase">
              <button onClick={() => { setShowTrackingModal(true); setTrackedOrders(null); setTrackingPhone(''); }} className="hover:text-white transition-colors">
                ট্র্যাক অর্ডার
              </button>
            </div>
          </div>

          <header className="sticky top-0 z-40 bg-white border-b border-[#EADFC8] px-4 md:px-12 py-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center w-full md:w-auto justify-between md:justify-start gap-4 md:gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="text-2xl text-[#111412] hover:text-[#D4AF37] transition-colors md:block hidden">
                ☰
              </button>
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => {setActiveCategory('All'); closeProductModal(); window.scrollTo(0,0);}}>
                <div className="relative flex items-center justify-center p-1.5">
                  <div className="absolute inset-0 rounded-full border-l-[3px] border-b-[3px] border-[#D4AF37] shadow-[-3px_3px_8px_rgba(212,175,55,0.4)] rotate-[-45deg]"></div>
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#111412] flex items-center justify-center font-bold text-2xl rounded-full overflow-hidden z-10 relative">
                    {storeSettings.logo_url ? (
                      <img src={storeSettings.logo_url} loading="lazy" className="w-full h-full object-cover"/>
                    ) : (
                      <span className="text-[#D4AF37] font-serif italic text-3xl">🌙</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                   <h1 className="text-2xl md:text-3xl font-serif italic font-black leading-none tracking-[0.1em] drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]" style={{ color: storeSettings.brand_name_color, textShadow: "2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(212,175,55,0.4)" }}>
                     {storeSettings.shop_name}
                   </h1>
                   <span className="text-[9px] md:text-[10px] text-[#111412] uppercase tracking-[0.4em] mt-1.5 font-bold">Premium Edition</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex border border-[#EADFC8] rounded-md overflow-hidden bg-[#FAF5EB] shadow-inner focus-within:border-[#D4AF37] transition-colors">
              <input type="text" placeholder="পণ্য বা প্রোডাক্ট আইডি খুঁজুন..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-3 pl-5 pr-10 text-sm text-[#111412] outline-none bg-transparent font-medium" />
              <button className="bg-[#111412] text-[#D4AF37] px-8 hover:bg-[#D4AF37] hover:text-[#111412] transition-colors font-bold tracking-widest">
                খুঁজুন
              </button>
            </div>

            <div className="hidden md:flex items-center gap-7">
              <button onClick={() => { if(user) setShowProfileModal(true); else setShowAuthModal(true); }} className="text-xl text-[#111412] hover:text-[#D4AF37] transition-colors">👤</button>
              <button onClick={() => setIsWishlistOpen(true)} className="relative text-xl text-[#111412] hover:text-[#D4AF37] transition-colors">
                ❤{wishlist.length > 0 && <span className="absolute -top-2 -right-3 bg-[#D4AF37] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{wishlist.length}</span>}
              </button>
              <button onClick={() => setIsCartOpen(true)} className={`relative text-2xl text-[#111412] hover:text-[#D4AF37] transition-all duration-300 ${animateCart ? 'scale-125 text-[#B8860B]' : ''}`}>
                🛒{cart.length > 0 && <span className="absolute -top-1 -right-3 bg-[#111412] text-[#D4AF37] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#D4AF37]">{totalItemsCount}</span>}
              </button>
            </div>
          </header>

          <section className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 flex flex-col gap-8">
            
            {/* Banner Section Without Timer */}
            {activeCategory === 'All' && !searchQuery && activeBanners.length > 0 && (
              <div className="w-full shadow-lg rounded-md relative overflow-hidden bg-[#FAF5EB] border border-[#EADFC8]" style={{ height: 'clamp(200px, 35vw, 450px)' }}>
                {activeBanners.map((banner, idx) => (
                  <div 
                    key={idx} 
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} 
                    style={{ backgroundImage: `url('${banner.imageUrl}')`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                  </div>
                ))}
                {activeBanners.length > 1 && (
                  <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2.5 z-20 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {activeBanners.map((_, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setCurrentBannerIndex(idx)} 
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 shadow-sm ${idx === currentBannerIndex ? 'bg-[#D4AF37] w-5' : 'bg-white hover:bg-[#EADFC8]'}`}>
                      </div> 
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Premium Horizontal Scrollable Category Bar under Banner */}
            <div className="w-full bg-white p-3 rounded-md shadow-sm border border-[#EADFC8] overflow-hidden flex items-center relative">
               <div className="flex gap-3 overflow-x-auto category-scroll scroll-smooth w-full px-1 py-1">
                  <button 
                    onClick={() => {setActiveCategory('All'); closeProductModal(); window.scrollTo(0,0);}} 
                    className={`px-6 py-2.5 text-[12px] font-bold rounded-full transition-all whitespace-nowrap shadow-sm border-2 ${activeCategory === 'All' ? 'bg-[#111412] border-[#D4AF37] text-[#D4AF37]' : 'bg-[#FAF5EB] border-[#EADFC8] text-[#111412] hover:border-[#D4AF37]'}`}
                  >
                    সকল প্রোডাক্ট
                  </button>
                  {allCategoryOptions.map((cat, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {setActiveCategory(cat); closeProductModal(); window.scrollTo(0,0);}} 
                      className={`px-6 py-2.5 text-[12px] font-bold rounded-full transition-all whitespace-nowrap shadow-sm border-2 ${activeCategory === cat ? 'bg-[#111412] border-[#D4AF37] text-[#D4AF37]' : 'bg-[#FAF5EB] border-[#EADFC8] text-[#111412] hover:border-[#D4AF37]'}`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>

            <div id="products-section" className="w-full mt-2 flex flex-col gap-20">
               {loading ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 mt-8">
                     {[...Array(12)].map((_, i) => (
                         <div key={i} className="bg-white border border-[#EADFC8] rounded-md h-[380px] flex flex-col p-4 shadow-sm overflow-hidden">
                           <div className="skeleton-shimmer h-48 w-full rounded-sm mb-4"></div>
                           <div className="skeleton-shimmer h-3 w-1/3 mx-auto mb-2 rounded-sm"></div>
                           <div className="skeleton-shimmer h-4 w-3/4 mx-auto mb-4 rounded-sm"></div>
                           <div className="skeleton-shimmer h-6 w-1/2 mx-auto mt-auto mb-4 rounded-sm"></div>
                           <div className="skeleton-shimmer h-8 w-full rounded-sm mb-2"></div>
                           <div className="skeleton-shimmer h-8 w-full rounded-sm"></div>
                         </div> 
                     ))}
                 </div>
               ) : (() => {
                 const adminOrder = storeSettings.category_order ? storeSettings.category_order.split(',').map(s => s.trim()).filter(Boolean) : [];
                 const allCategoriesToRender = Array.from(new Set([...customSections.map(c => c.title), ...allDynamicCats]));
                 const sortedCategoriesToRender = [...allCategoriesToRender].sort((a, b) => { 
                   const indexA = adminOrder.indexOf(a); 
                   const indexB = adminOrder.indexOf(b); 
                   if (indexA !== -1 && indexB !== -1) return indexA - indexB; 
                   if (indexA !== -1) return -1; 
                   if (indexB !== -1) return 1; 
                   return 0; 
                 });

                 return sortedCategoriesToRender.map(catTitle => {
                    if (activeCategory === 'All' && specialCategories.includes(catTitle)) return null;
                    if (activeCategory !== 'All' && activeCategory !== catTitle) return null;

                    const section = customSections.find(s => s.title === catTitle);
                    const catProducts = sortedProducts.filter(item => (item.category || '').split(',').map(c=>c.trim()).includes(catTitle));

                    if (catProducts.length === 0 && (!section || !section.imageUrl)) return null;

                    const subCats = Array.from(new Set(catProducts.map(p => p.tag).filter(Boolean))) as string[];
                    const currentSub = activeSubCategories[catTitle] || 'All';
                    const finalProducts = currentSub === 'All' ? catProducts : catProducts.filter(item => item.tag === currentSub);

                    return (
                      <div key={catTitle} className="w-full">
                        <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-[#D4AF37]/50 pb-4 mb-8">
                           <h2 className="font-bold tracking-wide" style={{ fontSize: section?.fontSize ? `${section.fontSize}px` : '30px', color: section?.color || storeSettings.heading_color || '#B8860B' }}>{catTitle}</h2>
                           <button onClick={() => {setActiveCategory(catTitle); closeProductModal(); window.scrollTo(0,0);}} className="bg-[#111412] text-[#D4AF37] text-[10px] px-6 py-2.5 font-bold rounded-sm hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 tracking-[0.2em] uppercase shadow-md mt-4 md:mt-0">সবগুলো দেখুন →</button>
                        </div>

                        {subCats.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto category-scroll mb-8 pb-2">
                                <button onClick={() => handleSubCategoryClick(catTitle, 'All')} className={`px-5 py-2 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap shadow-sm border ${currentSub === 'All' ? 'bg-[#D4AF37] border-[#D4AF37] text-[#111412]' : 'bg-white border-[#EADFC8] text-gray-600 hover:border-[#D4AF37]'}`}>সব</button>
                                {subCats.map(sub => (
                                  <button key={sub} onClick={() => handleSubCategoryClick(catTitle, sub)} className={`px-5 py-2 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap shadow-sm border ${currentSub === sub ? 'bg-[#D4AF37] border-[#D4AF37] text-[#111412]' : 'bg-white border-[#EADFC8] text-gray-600 hover:border-[#D4AF37]'}`}>{sub}</button> 
                                ))}
                            </div>
                        )}
                        
                        {section && section.imageUrl && activeCategory === 'All' && (
                          <div className="w-full mb-10 shadow-md rounded-sm overflow-hidden border border-[#EADFC8] relative bg-[#FAF5EB]" style={{ height: section.imageHeight ? `${section.imageHeight}px` : '300px' }}>
                            <img src={section.imageUrl} loading="lazy" alt={section.title} className="w-full h-full absolute inset-0" style={{ objectFit: 'fill', width: '100%', height: '100%' }} />
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 mt-4">
                            {finalProducts.length > 0 ? finalProducts.map(item => renderProductCard(item)) : <p className="col-span-full text-center text-sm text-gray-400 py-10 font-bold uppercase tracking-widest">No products found in this sub-category</p>}
                        </div>
                      </div>
                    );
                 });
               })()}
            </div>
          </section>

          <footer className="border-t-4 border-[#D4AF37] bg-[#111412] mt-24 pb-12 pt-20 shadow-inner relative z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-[#EADFC8]">
              <div>
                <h4 className="font-serif italic font-bold text-3xl mb-6 uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]" style={{ color: storeSettings.brand_name_color || '#D4AF37' }}>{storeSettings.shop_name}</h4>
                <p className="leading-relaxed mb-4 font-medium max-w-sm">বাংলাদেশের অন্যতম সেরা প্রিমিয়াম ইসলামিক লাইফস্টাইল এবং ফ্যাশন অনলাইন শপ। আমরা বিশ্বাস করি মডেস্টি এবং আভিজাত্য একে অপরের পরিপূরক।</p>
              </div>
              <div>
                <h4 className="font-bold text-[#D4AF37] mb-6 uppercase text-xs tracking-[0.2em] border-b border-[#D4AF37]/30 pb-3 inline-block">Contact Us</h4>
                <p className="mb-4 hover:text-white transition cursor-pointer font-medium" onClick={() => setInfoModal({title: 'যোগাযোগ', content: storeSettings.contact_info})}>📍 যোগাযোগ তথ্য</p>
                <p className="mb-4 text-[#EADFC8]">📞 ফোন: <span className="text-[#D4AF37] font-bold">{storeSettings.phone}</span></p>
              </div>
              <div>
                <h4 className="font-bold text-[#D4AF37] mb-6 uppercase text-xs tracking-[0.2em] border-b border-[#D4AF37]/30 pb-3 inline-block">Policies</h4>
                <p className="mb-4 hover:text-white transition cursor-pointer font-medium" onClick={() => setInfoModal({title: 'রিটার্ন পলিসি', content: storeSettings.return_policy})}>🛡 রিটার্ন পলিসি</p>
                <p className="mb-4 hover:text-white transition cursor-pointer font-medium" onClick={() => setInfoModal({title: 'ডেলিভারি পলিসি', content: storeSettings.delivery_policy})}>🚚 ডেলিভারি পলিসি</p>
              </div>
            </div>
          </footer>

        </div> 

        {storeSettings.fb_page_url && (
           <a href={storeSettings.fb_page_url} target="_blank" rel="noopener noreferrer" className="fixed bottom-24 md:bottom-20 right-6 z-[250] bg-[#1877F2] text-white p-3.5 rounded-full shadow-2xl hover:bg-[#166FE5] transition-transform hover:scale-110 border-2 border-white hidden md:flex">
             <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
               <path d="M12 0C5.373 0 0 5.068 0 11.321c0 3.565 1.763 6.744 4.538 8.87v3.809l4.168-2.292c1.05.292 2.158.448 3.294.448 6.627 0 12-5.068 12-11.321S18.627 0 12 0zm1.206 15.352l-3.08-3.295-6.002 3.295 6.623-7.039 3.167 3.295 5.915-3.295-6.623 7.039z"/>
             </svg>
           </a> 
        )}

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-[#EADFC8] flex justify-between items-center z-[250] shadow-[0_-5px_15px_rgba(212,175,55,0.15)] text-[#111412] h-16">
           <button onClick={() => {setActiveCategory('All'); closeProductModal(); window.scrollTo(0,0);}} className="flex-1 flex flex-col items-center justify-center h-full hover:text-[#B8860B] transition-colors">
             <span className="text-xl leading-none">🏠</span>
             <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Home</span>
           </button>
           <button onClick={() => setIsSidebarOpen(true)} className="flex-1 flex flex-col items-center justify-center h-full hover:text-[#B8860B] transition-colors">
             <span className="text-xl leading-none">☰</span>
             <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Menu</span>
           </button>
           <button onClick={() => setIsCartOpen(true)} className={`flex-1 flex flex-col items-center justify-center h-full hover:text-[#B8860B] transition-colors relative ${animateCart ? 'scale-110 text-[#B8860B]' : ''}`}>
             <span className="text-xl leading-none">🛒</span>
             {cart.length > 0 && <span className="absolute top-2 right-4 bg-[#D4AF37] text-[#111412] border border-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{totalItemsCount}</span>}
             <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Bag</span>
           </button>
           <button onClick={() => user ? setShowProfileModal(true) : setShowAuthModal(true)} className="flex-1 flex flex-col items-center justify-center h-full hover:text-[#B8860B] transition-colors">
             <span className="text-xl leading-none">👤</span>
             <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Account</span>
           </button>
        </div>

        {isAdmin && (
          <div className="fixed bottom-16 md:bottom-0 left-0 w-full bg-[#111412] text-[#D4AF37] border-t border-[#D4AF37]/30 z-[250] flex justify-between items-center px-6 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_#D4AF37]"></span> {isMasterAdmin ? 'Master Admin' : 'Staff Panel'}
            </div>
            <div className="flex gap-3">
               {isMasterAdmin && (
                 <button onClick={openAddModal} className="bg-[#D4AF37] text-[#111412] px-5 py-2 rounded-sm text-[10px] font-bold hover:bg-[#C5A059] transition-colors shadow-sm tracking-[0.2em] uppercase">
                   + Add
                 </button>
               )}
               <button onClick={() => setShowAdminDashboard(true)} className="bg-transparent border border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-sm text-[10px] font-bold hover:bg-[#D4AF37] hover:text-[#111412] transition-colors shadow-sm tracking-[0.2em] uppercase">
                 ⚙ Panel
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Sidebar Modal Section (FIXED z-index) */}
      {isSidebarOpen && (
        <div style={{ position: 'relative', zIndex: 999999 }}>
          <div className="fixed inset-0 bg-[#111412]/60 backdrop-blur-sm transition-opacity z-[999998]" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed top-0 left-0 w-[280px] md:w-[320px] h-full bg-[#FAF5EB] shadow-[5px_0_30px_rgba(0,0,0,0.5)] flex flex-col transform transition-transform duration-300 border-r border-[#D4AF37]/50 z-[999999]">
            <div className="p-5 flex justify-between items-center bg-[#111412] text-[#D4AF37] shadow-sm border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-3">
                 <div className="relative flex items-center justify-center p-1">
                   <div className="absolute inset-0 rounded-full border-l-[2px] border-b-[2px] border-[#D4AF37] shadow-[-2px_2px_5px_rgba(212,175,55,0.4)] rotate-[-45deg]"></div>
                   <div className="w-8 h-8 bg-[#111412] flex items-center justify-center font-bold text-lg rounded-full overflow-hidden relative">
                     {storeSettings.logo_url ? <img src={storeSettings.logo_url} className="w-full h-full object-cover"/> : <span className="text-[#D4AF37]">🌙</span>}
                   </div>
                 </div>
                 <span className="font-bold text-xs uppercase tracking-[0.2em] italic" style={{ color: storeSettings.brand_name_color || '#D4AF37' }}>{storeSettings.shop_name}</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-[#D4AF37] hover:text-white text-2xl font-bold bg-transparent w-8 h-8 flex items-center justify-center rounded transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 text-[12px] font-bold text-[#111412] uppercase tracking-widest">
               <div className="px-6 py-3.5 hover:bg-[#EADFC8] transition-colors cursor-pointer flex items-center gap-4" onClick={() => {setActiveCategory('All'); closeProductModal(); setIsSidebarOpen(false); window.scrollTo(0,0);}}><span>✦</span> হোম</div>
               
               <div className="my-5 border-t border-[#D4AF37]/20 mx-4"></div>
               <div className="px-6 py-2 text-[10px] tracking-[0.2em] font-black flex items-center gap-2 mb-2" style={{ color: storeSettings.heading_color || '#B8860B' }}>ক্যাটাগরি সমূহ</div>
               {dynamicSidebarCategories.map((cat, i) => (
                 <div key={i} className="px-6 py-3 hover:bg-[#EADFC8] transition-colors cursor-pointer flex items-center gap-4 text-[#111412]" onClick={() => {setActiveCategory(cat); closeProductModal(); setIsSidebarOpen(false); window.scrollTo(0,0);}}>
                   <span className="text-[10px] text-[#D4AF37]">▶</span> {cat}
                 </div>
               ))}
               
               <div className="my-5 border-t border-[#D4AF37]/20 mx-4"></div>
               <div className="px-6 py-2 text-[10px] tracking-[0.2em] font-black mb-2" style={{ color: storeSettings.heading_color || '#B8860B' }}>প্রয়োজনীয় লিংক</div>
               <div className="px-6 py-3 hover:bg-[#EADFC8] transition-colors cursor-pointer flex items-center gap-4" onClick={() => { setInfoModal({title: 'যোগাযোগ', content: storeSettings.contact_info}); setIsSidebarOpen(false); }}>
                  <span>✉</span> যোগাযোগ
               </div>
               <div className="px-6 py-3 hover:bg-[#EADFC8] transition-colors cursor-pointer flex items-center gap-4" onClick={() => { setInfoModal({title: 'রিটার্ন পলিসি', content: storeSettings.return_policy}); setIsSidebarOpen(false); }}>
                  <span>🛡</span> রিটার্ন পলিসি
               </div>
               
               <div className="mt-10 mx-5 px-4 py-4 bg-[#111412] text-[#D4AF37] text-center rounded-sm shadow-md font-bold tracking-[0.2em] cursor-pointer border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300">
                  📞 {storeSettings.phone}
               </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 999999 }}>
        {toastMessage && ( 
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-[999999] flex items-center gap-3 animate-bounce-short text-xs font-black tracking-widest text-white uppercase ${toastMessage.type === 'success' ? 'bg-[#111412] border border-[#D4AF37]' : 'bg-red-600 border border-white'}`}>
            <span className="text-lg">{toastMessage.type === 'success' ? '✅' : '⚠'}</span>
            {toastMessage.msg}
          </div> 
        )}
        
        {fomoMsg && ( 
          <div className="fixed bottom-24 md:bottom-8 left-4 md:left-8 bg-white border border-[#D4AF37] p-3 rounded-md shadow-[0_5px_20px_rgba(212,175,55,0.4)] z-[9998] flex items-center gap-4 animate-slide-up max-w-[280px]">
            <div className="w-12 h-12 rounded overflow-hidden border border-[#EADFC8] shrink-0 bg-[#FAF5EB]">
              <img src={fomoMsg.image_url || ''} loading="lazy" className="w-full h-full object-cover"/>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Eimatro Order Hoyeche!
              </p>
              <p className="text-[11px] font-bold text-[#111412] line-clamp-1">{fomoMsg.name}</p>
              <p className="text-[9px] text-[#B8860B] font-black mt-0.5 tracking-widest">From: Dhaka</p>
            </div>
          </div> 
        )}
        
        {orderSuccess.show && ( 
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
            <div className="bg-white p-10 rounded-sm text-center max-w-sm w-full relative overflow-hidden shadow-2xl border border-[#D4AF37]">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#D4AF37] animate-pulse"></div>
              <div className="w-24 h-24 bg-[#FAF5EB] rounded-full border-4 border-[#D4AF37] flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                <span className="text-5xl animate-bounce">🎉</span>
              </div>
              <h2 className="text-3xl font-black text-[#111412] mb-3 uppercase tracking-widest drop-shadow-sm">Alhamdulillah!</h2>
              <p className="text-gray-600 mb-2 font-bold text-sm tracking-wide">আপনার অর্ডারটি সফলভাবে রিসিভ হয়েছে।</p>
              <p className="text-[11px] font-black text-[#B8860B] mb-8 tracking-[0.2em] uppercase bg-[#FAF5EB] p-2 rounded-sm border border-[#EADFC8]">
                Order ID: #{orderSuccess.orderId}
              </p>
              <button onClick={() => setOrderSuccess({show:false, orderId:''})} className="w-full bg-[#111412] text-[#D4AF37] font-bold py-4 rounded-sm uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-[#111412] transition-colors border border-[#D4AF37] shadow-md">
                ওকে, ধন্যবাদ
              </button>
            </div>
          </div> 
        )}
        
        {infoModal && ( 
          <div className="fixed inset-0 bg-[#111412]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#D4AF37] max-w-2xl w-full p-8 md:p-12 relative rounded-sm shadow-2xl">
              <button onClick={() => setInfoModal(null)} className="absolute top-6 right-8 text-3xl hover:text-red-500 text-gray-400 transition-colors">✕</button>
              <h3 className="text-2xl font-bold mb-6 border-b border-[#EADFC8] pb-4 uppercase tracking-[0.2em]" style={{ color: storeSettings.heading_color || '#B8860B' }}>
                {infoModal.title}
              </h3>
              <div className="text-sm whitespace-pre-wrap leading-relaxed font-medium" style={{ color: storeSettings.page_text_color || '#374151' }}>
                {infoModal.content}
              </div>
            </div>
          </div> 
        )}

        {viewingProduct && (() => {
          const viewingDiscount = viewingProduct.original_price ? calculateDiscount(viewingProduct.original_price, viewingProduct.price) : 0;
          const isSoldOut = viewingProduct.stock_count !== undefined && viewingProduct.stock_count <= 0;
          const actualStock = viewingProduct.stock_count !== undefined ? viewingProduct.stock_count : stockLeftVisual;
          
          return (
          <div className="fixed inset-0 bg-[#111412]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto z-[1000]" onClick={closeProductModal}>
            <div className="bg-white border-2 border-[#D4AF37] max-w-5xl w-full h-[95vh] md:h-auto md:max-h-[95vh] flex flex-col relative rounded-sm shadow-2xl overflow-hidden pb-16 md:pb-0" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center bg-[#FAF5EB] border-b border-[#EADFC8] p-4 md:px-8 md:py-5 shadow-sm sticky top-0 z-30">
                 <button onClick={closeProductModal} className="flex items-center gap-2 text-[#111412] font-bold uppercase tracking-[0.2em] text-xs transition-colors bg-white border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white px-5 py-2.5 rounded-sm shadow-sm">
                   <span className="text-xl leading-none -mt-0.5">←</span> ফিরে যান
                 </button>
                 <button onClick={closeProductModal} className="text-[#111412] hover:text-red-600 text-3xl font-light transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#FAF5EB] relative">
                <div className="mb-6">
                  <p className="text-gray-500 text-[11px] mb-1.5 font-bold tracking-widest uppercase">
                    হোম / {viewingProduct.tag || viewingProduct.category.split(',')[0]}
                  </p>
                  {viewingProduct.name && <h2 className="text-2xl md:text-3xl font-bold text-[#111412] leading-tight" style={{ color: storeSettings.heading_color || '#B8860B' }}>{viewingProduct.name}</h2>}
                </div>
                
                <div className="flex flex-col md:flex-row gap-10 relative">
                  <div className="w-full md:w-1/2 flex flex-col gap-6">
                    {[viewingProduct.image_url, viewingProduct.image_url_2, viewingProduct.image_url_3, viewingProduct.image_url_4].filter(Boolean).map((img, idx) => ( 
                      <div key={idx} className="w-full bg-white rounded-sm border border-[#EADFC8] flex items-center justify-center p-2 overflow-hidden shadow-sm relative group cursor-zoom-in">
                        <img src={img as string} loading="lazy" className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.5] origin-center" />
                      </div> 
                    ))}
                  </div>
                  
                  <div className="w-full md:w-1/2 flex flex-col md:sticky md:top-8 h-fit">
                     <div className="flex items-end gap-4 mb-5 border-b border-[#D4AF37]/30 pb-5">
                       {viewingProduct.original_price && <span className="text-gray-400 line-through text-lg font-medium">৳ {formatPrice(viewingProduct.original_price)}</span>}
                       <span className="text-[#111412] text-3xl font-black">{formatPrice(viewingProduct.price)} ৳</span>
                       {viewingDiscount > 0 && !isSoldOut && <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm ml-2 mb-1.5 animate-pulse shadow-sm">{viewingDiscount}% ছাড়</span>}
                     </div>

                     <div className="flex flex-col gap-2 mb-6 text-xs text-gray-600 font-bold tracking-wide">
                        <p className="flex items-center gap-2"><span className="text-base">🎁</span> প্রোডাক্ট আইডি: {viewingProduct.id.split('-')[0].toUpperCase().substring(0, 6)}</p>
                        <p className="flex items-center gap-2 text-red-500 animate-pulse"><span className="text-base">🔥</span> {liveVisitors} জন এই মুহূর্তে দেখছেন</p>
                        {!isSoldOut ? (
                          <p className="flex items-center gap-2 text-[#B8860B]"><span className="text-base">⚡</span> মাত্র {actualStock} টি স্টকে অবশিষ্ট আছে!</p>
                        ) : (
                          <p className="flex items-center gap-2 text-red-600 font-black tracking-widest"><span className="text-base">❌</span> SOLD OUT</p>
                        )}
                     </div>

                     {storeSettings.free_delivery_threshold > 0 && (
                        <div className="bg-[#FAF5EB] border border-[#D4AF37]/50 px-4 py-3 rounded-sm flex items-center gap-3 w-full mb-8 shadow-sm">
                          <span className="text-2xl leading-none">🚚</span>
                          {getNumericPrice(viewingProduct.price) >= storeSettings.free_delivery_threshold ? ( 
                            <p className="text-green-600 font-bold text-[11px] uppercase tracking-widest">এই প্রোডাক্টটিতে ফ্রি ডেলিভারি!</p> 
                          ) : ( 
                            <div className="flex-1">
                              <p className="text-[#B8860B] font-bold text-[10px] mb-1">আর মাত্র ৳{storeSettings.free_delivery_threshold - getNumericPrice(viewingProduct.price)} টাকার শপিংয়ে ফ্রি ডেলিভারি!</p>
                              <div className="w-full bg-white border border-[#EADFC8] rounded-full h-1 overflow-hidden">
                                <div className="bg-[#D4AF37] h-1 rounded-full" style={{ width: `${(getNumericPrice(viewingProduct.price) / storeSettings.free_delivery_threshold) * 100}%` }}></div>
                              </div>
                            </div> 
                          )}
                        </div>
                     )}

                     <div className="flex flex-col gap-3.5 mb-10 hidden md:flex">
                         <button onClick={(e) => handleDirectOrder(viewingProduct, 1, e)} disabled={isSoldOut} className="w-full bg-[#111412] text-[#D4AF37] border border-[#D4AF37] py-4 rounded-sm hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 text-sm font-bold flex justify-center items-center tracking-[0.2em] uppercase shadow-md disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300">
                           ⚡ সরাসরি অর্ডার করুন
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); addToCart(viewingProduct, 1); }} disabled={isSoldOut} className="w-full bg-[#FAF5EB] text-[#111412] border border-[#EADFC8] font-bold py-4 rounded-sm hover:bg-[#EADFC8] transition-colors duration-300 text-sm flex justify-center items-center tracking-[0.2em] uppercase shadow-sm disabled:bg-gray-100 disabled:text-gray-400">
                           🛒 ব্যাগে যোগ করুন
                         </button>
                         <a href={`https://wa.me/88${storeSettings.phone}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি এই প্রোডাক্টটি নিতে চাই:\n\nনাম: ${viewingProduct.name}\nদাম: ৳${viewingProduct.price}\nআইডি: ${viewingProduct.id.split('-')[0].toUpperCase().substring(0, 6)}`)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white font-bold py-4 rounded-sm hover:bg-[#128C7E] transition-colors duration-300 text-sm flex justify-center items-center gap-2 tracking-widest shadow-sm uppercase">
                           <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 001.602 6.002L.035 23.996l6.147-1.61A11.975 11.975 0 0011.944 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm.056 20.155c-1.782 0-3.528-.48-5.06-1.385l-.36-.214-3.763.987.998-3.668-.235-.375A9.878 9.878 0 012.062 12c0-5.467 4.453-9.92 9.938-9.92s9.938 4.453 9.938 9.92-4.453 9.92-9.938 9.92zm5.452-7.443c-.298-.15-1.765-.87-2.038-.97-.272-.1-.47-.15-.67.15-.198.298-.767.97-.94 1.168-.172.2-.345.225-.643.075-2.06-1.03-3.418-2.313-4.44-4.08-.173-.298-.018-.46.13-.61.134-.134.298-.348.448-.522.15-.175.2-.298.298-.5.1-.198.05-.372-.025-.522-.075-.15-.67-1.618-.918-2.215-.24-.582-.487-.502-.67-.512-.172-.01-.37-.01-.568-.01-.198 0-.52.075-.793.372-.272.298-1.042 1.02-1.042 2.485s1.066 2.88 1.215 3.08c.15.2 2.1 3.205 5.088 4.493 2.015.87 2.854.945 3.923.792.833-.118 2.563-1.047 2.923-2.06.358-1.012.358-1.88.252-2.06-.104-.175-.378-.275-.675-.425z"/></svg>
                           হোয়াটসঅ্যাপে অর্ডার
                         </a>
                     </div>
                     
                     <div className="bg-[#111412] p-6 rounded-sm border border-[#D4AF37] shadow-[0_5px_20px_rgba(212,175,55,0.15)] mt-4">
                        <h4 className="text-sm font-bold mb-4 uppercase tracking-widest border-b border-[#D4AF37]/30 pb-2 inline-block text-[#D4AF37]">PRODUCT DETAILS</h4>
                        <div className="text-[14px] leading-relaxed font-medium mt-2 text-[#EADFC8] custom-html-content" dangerouslySetInnerHTML={{ __html: (viewingProduct.description || "অত্যন্ত প্রিমিয়াম কোয়ালিটি পণ্য। নিশ্চিন্তে অর্ডার করতে পারেন।").replace(/\n/g, '<br/>') }} />
                     </div>
                  </div>
                </div>

                <div className="border-t border-[#EADFC8] pt-12 mt-16 pb-6">
                   <h3 className="text-2xl font-bold mb-10 border-l-4 border-[#D4AF37] pl-5 uppercase tracking-[0.2em]" style={{ color: storeSettings.heading_color || '#B8860B' }}>কাস্টমার রিভিউ ({productReviews.length})</h3>
                   <div className="flex flex-col md:flex-row gap-10">
                     <form onSubmit={handleReviewSubmit} className="w-full md:w-1/3 bg-white p-8 rounded-sm border border-[#EADFC8] shadow-sm h-fit">
                        <h4 className="text-xs font-bold mb-6 uppercase tracking-[0.2em]" style={{ color: storeSettings.heading_color || '#B8860B' }}>আপনার মতামত জানান</h4>
                        <div className="flex gap-2 mb-6">
                          {[1,2,3,4,5].map(star => ( 
                            <span key={star} onClick={() => setNewReviewRating(star)} className={`cursor-pointer text-3xl transition-colors ${star <= newReviewRating ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-[#D4AF37]/50'}`}>★</span> 
                          ))}
                        </div>
                        <input type="text" placeholder="আপনার নাম" value={newReviewName} onChange={e => setNewReviewName(e.target.value)} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-3.5 rounded-sm text-sm text-[#111412] mb-4 outline-none focus:border-[#D4AF37] transition-colors shadow-inner" required/>
                        <textarea required placeholder="প্রোডাক্টটি কেমন লেগেছে?" value={newReviewComment} onChange={e => setNewReviewComment(e.target.value)} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-3.5 rounded-sm text-sm text-[#111412] mb-6 outline-none focus:border-[#D4AF37] transition-colors custom-scrollbar shadow-inner" rows={4}></textarea>
                        <button type="submit" disabled={isReviewSubmitting} className="w-full bg-[#111412] text-[#D4AF37] py-4 rounded-sm text-xs font-bold hover:bg-[#D4AF37] hover:text-[#111412] border border-[#D4AF37] transition-colors duration-300 shadow-sm tracking-[0.2em] uppercase">
                          {isReviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                     </form>
                     <div className="w-full md:w-2/3 space-y-6 max-h-[450px] overflow-y-auto custom-scrollbar pr-4">
                        {productReviews.length === 0 ? (
                          <p className="text-xs text-gray-500 bg-white p-12 text-center border border-dashed border-[#D4AF37]/50 rounded-sm font-bold tracking-[0.2em] uppercase shadow-sm">এখনো কোনো রিভিউ নেই। আপনিই প্রথম রিভিউ দিন!</p>
                        ) : productReviews.map(review => (
                           <div key={review.id} className="bg-white border border-[#EADFC8] p-6 rounded-sm shadow-sm hover:border-[#D4AF37]/50 transition-colors duration-300">
                              <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-sm text-[#111412] uppercase tracking-[0.1em]">{review.customer_name}</span>
                                <span className="text-[#D4AF37] text-lg tracking-widest">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                              </div>
                              <p className="text-sm mb-4 font-medium leading-relaxed" style={{ color: storeSettings.page_text_color || '#4B5563' }}>{review.comment}</p>
                              <p className="text-[10px] text-[#B8860B] font-bold tracking-[0.2em] uppercase">{new Date(review.created_at).toLocaleDateString()}</p>
                           </div>
                        ))}
                     </div>
                   </div>
                </div>
              </div>
              
              <div className="md:hidden absolute bottom-0 left-0 w-full bg-white border-t border-[#EADFC8] p-3 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] flex gap-3 z-50 animate-slide-up">
                 <button onClick={(e) => { e.stopPropagation(); addToCart(viewingProduct, 1); }} disabled={isSoldOut} className="flex-1 bg-[#FAF5EB] text-[#111412] border border-[#EADFC8] text-[11px] font-bold py-3.5 rounded-sm flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm disabled:text-gray-400">
                   🛒 ব্যাগে
                 </button>
                 <button onClick={(e) => handleDirectOrder(viewingProduct, 1, e)} disabled={isSoldOut} className="flex-1 bg-[#111412] text-[#D4AF37] border border-[#D4AF37] text-[11px] font-bold py-3.5 rounded-sm flex items-center justify-center gap-2 uppercase tracking-widest shadow-md disabled:bg-gray-300 disabled:text-gray-500">
                   ⚡ অর্ডার
                 </button>
              </div>
            </div>
          </div>
          );
        })()}

        {isCheckoutOpen && (
          <div className="fixed inset-0 bg-[#111412]/80 backdrop-blur-md flex items-center justify-center p-4 z-[1000]" onClick={() => setIsCheckoutOpen(false)}>
            <div className="bg-white border-2 border-[#D4AF37] w-full max-w-md relative rounded-sm shadow-2xl flex flex-col overflow-hidden max-h-[95vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center bg-[#FAF5EB] border-b border-[#EADFC8] p-5">
                 <button onClick={() => setIsCheckoutOpen(false)} className="flex items-center gap-2 text-[#111412] font-bold uppercase tracking-[0.2em] text-xs transition-colors bg-white border border-[#EADFC8] hover:border-[#D4AF37] px-3 py-1.5 rounded-sm shadow-sm">
                   <span className="text-lg leading-none -mt-0.5">←</span> Back
                 </button>
                 <h3 className="text-[13px] font-bold text-[#B8860B] tracking-[0.2em] uppercase">হোম ডেলিভারির তথ্য</h3>
                 <button onClick={() => setIsCheckoutOpen(false)} className="text-[#111412] hover:text-red-500 text-2xl font-light transition-colors">✕</button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] mb-2 flex items-center gap-2 uppercase tracking-[0.2em]">👤 আপনার নাম লিখুন</label>
                    <input required value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-3.5 text-sm text-[#111412] rounded-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] mb-2 flex items-center gap-2 uppercase tracking-[0.2em]">📱 মোবাইল নাম্বার (01XXXXXXXXX) <span className="text-red-500">*</span></label>
                    <input required placeholder="017xxxxxxxx" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} onBlur={handlePhoneBlur} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-3.5 text-sm text-[#111412] rounded-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#B8860B] mb-2 flex items-center gap-2 uppercase tracking-[0.2em]">🏠 ডেলিভারি ঠিকানা <span className="text-red-500">*</span></label>
                    <textarea required rows={2} placeholder="সম্পূর্ণ ঠিকানা লিখুন (জেলা, থানা সহ)" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-3.5 text-sm text-[#111412] rounded-sm outline-none focus:border-[#D4AF37] shadow-inner custom-scrollbar transition-colors"></textarea>
                  </div>
                  
                  <div className="bg-[#FAF5EB] p-5 border border-[#EADFC8] rounded-sm shadow-sm">
                    <label className="text-[10px] font-bold text-[#B8860B] mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">💳 পেমেন্ট পদ্ধতি</label>
                    <div className="flex flex-wrap gap-2.5">
                       <button type="button" onClick={()=>setPaymentMethod('COD')} className={`flex-1 min-w-[100px] py-3 text-[11px] font-bold border rounded-sm transition-colors duration-300 tracking-wider uppercase ${paymentMethod==='COD'?'bg-[#111412] text-[#D4AF37] border-[#D4AF37]':'bg-white text-gray-600 border-[#EADFC8] hover:border-[#D4AF37]'}`}>Cash on Delivery</button>
                       <button type="button" onClick={()=>setPaymentMethod('bKash')} className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold border rounded-sm transition-colors duration-300 tracking-wider uppercase ${paymentMethod==='bKash'?'bg-[#e2136e] text-white border-[#e2136e]':'bg-white text-gray-600 border-[#EADFC8] hover:border-[#D4AF37]'}`}>bKash</button>
                       <button type="button" onClick={()=>setPaymentMethod('Nagad')} className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold border rounded-sm transition-colors duration-300 tracking-wider uppercase ${paymentMethod==='Nagad'?'bg-[#F58220] text-white border-[#F58220]':'bg-white text-gray-600 border-[#EADFC8] hover:border-[#D4AF37]'}`}>Nagad</button>
                    </div>
                    {paymentMethod !== 'COD' && (
                       <div className="bg-white border border-[#EADFC8] p-5 rounded-sm mt-4 shadow-inner">
                           <p className="text-[10px] font-bold text-[#111412] mb-3 uppercase tracking-[0.2em] leading-relaxed">এই নম্বরে Send Money করুন: <br/><span className="text-xl text-[#D4AF37] bg-[#111412] px-3 py-1 rounded-sm tracking-[0.2em] inline-block mt-2 border border-[#D4AF37]">{storeSettings.phone}</span></p>
                           <input type="text" required placeholder={`${paymentMethod} TrxID দিন`} value={transactionId} onChange={e=>setTransactionId(e.target.value)} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-3 text-sm text-[#111412] rounded-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors mt-2"/>
                       </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-[#B8860B] mb-3 flex items-center gap-2 uppercase tracking-[0.2em]">🚚 ডেলিভারি চার্জ</label>
                    <div className="flex flex-col gap-3 bg-[#FAF5EB] p-5 rounded-sm border border-[#EADFC8] shadow-sm">
                       <label className="flex items-center gap-3 text-sm text-[#111412] font-bold cursor-pointer">
                         <input type="radio" name="shipping" checked={shippingLocation==='inside'} onChange={()=>setShippingLocation('inside')} className="accent-[#D4AF37] w-4 h-4 cursor-pointer" />
                         <span>ঢাকার ভিতরে {isFreeDelivery ? <><del className="text-gray-400">৳ ৬০</del> <span className="text-green-600 bg-green-100 px-2 rounded-sm ml-1 text-xs">FREE</span></> : '(৳ ৬০)'}</span>
                       </label>
                       <label className="flex items-center gap-3 text-sm text-[#111412] font-bold cursor-pointer">
                         <input type="radio" name="shipping" checked={shippingLocation==='outside'} onChange={()=>setShippingLocation('outside')} className="accent-[#D4AF37] w-4 h-4 cursor-pointer" />
                         <span>ঢাকার বাইরে {isFreeDelivery ? <><del className="text-gray-400">৳ ১২০</del> <span className="text-green-600 bg-green-100 px-2 rounded-sm ml-1 text-xs">FREE</span></> : '(৳ ১২০)'}</span>
                       </label>
                    </div>
                  </div>

                  <div className="border border-[#EADFC8] bg-white rounded-sm mt-6 overflow-hidden shadow-sm">
                     {cart.map((item, index) => (
                       <div key={`${item.id}-${index}`} className="flex border-b border-[#EADFC8] last:border-0 p-3 items-center text-sm">
                          <div className="w-16 h-16 border border-[#EADFC8] mr-4 shrink-0 rounded-sm overflow-hidden bg-[#FAF5EB]">
                            <img src={item.image_url||''} loading="lazy" className="w-full h-full object-cover"/>
                          </div>
                          <div className="flex-1 leading-tight">
                            <p className="font-bold text-[#111412] text-[13px] line-clamp-1">{item.name}</p>
                            <p className="text-[11px] text-[#B8860B] font-black mt-1.5">৳ {formatPrice(item.price)} X {item.quantity}</p>
                          </div>
                          <div className="flex flex-col items-center border-l border-r border-[#EADFC8] px-3 h-full justify-center gap-2 bg-[#FAF5EB]">
                            <button type="button" onClick={()=>updateQuantity(item.id, 1)} className="font-black text-xl leading-none cursor-pointer text-[#111412] hover:text-[#D4AF37] transition-colors">+</button>
                            <span className="text-xs font-bold text-[#111412] leading-none">{item.quantity}</span>
                            <button type="button" onClick={()=>updateQuantity(item.id, -1)} className="font-black text-xl leading-none cursor-pointer text-[#111412] hover:text-[#D4AF37] transition-colors">-</button>
                          </div>
                          <div className="px-4 flex items-center justify-between min-w-[90px]">
                            <span className="font-black text-[#111412] text-sm">{(getNumericPrice(item.price) * item.quantity).toString()}৳</span>
                            <button type="button" onClick={()=>removeFromCart(item.id)} className="text-red-500 font-bold ml-3 hover:bg-red-50 px-2 py-1 rounded-sm transition-colors text-lg leading-none">✕</button>
                          </div>
                       </div>
                     ))}
                     
                     <div className="flex justify-between items-center p-5 bg-[#FAF5EB] border-t border-[#EADFC8] font-bold text-sm text-[#111412]">
                        <span className="uppercase tracking-[0.2em] text-[#B8860B] text-xs">Total:-</span>
                        <div className="flex items-center gap-8 pr-1">
                          <span className="text-sm text-gray-600">{totalItemsCount} items</span>
                          <span className="text-[#111412] text-[18px] font-black">{cartTotal.toString()} ৳</span>
                        </div>
                     </div>
                  </div>

                  <button type="submit" disabled={isCheckingOut} className="w-full bg-[#111412] text-[#D4AF37] border border-[#D4AF37] font-bold py-4.5 text-[15px] rounded-sm mt-8 hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 shadow-md flex items-center justify-center gap-2 uppercase tracking-[0.2em]">
                    {isCheckingOut ? "Processing..." : `অর্ডার করুন ৳ ${cartTotal}`}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {isCartOpen && (
          <div className="fixed inset-0 bg-[#111412]/80 backdrop-blur-sm flex justify-end z-[1000]" onClick={() => setIsCartOpen(false)}>
            <div className="bg-white w-full max-w-sm h-full p-8 relative flex flex-col shadow-2xl border-l-4 border-[#D4AF37]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setIsCartOpen(false)} className="absolute top-6 right-6 text-3xl text-gray-400 hover:text-[#111412] transition-colors leading-none">✕</button>
              <h3 className="text-xl font-bold mb-6 border-b border-[#EADFC8] pb-5 text-[#B8860B] tracking-[0.2em] uppercase">শপিং ব্যাগ</h3>
              
              {storeSettings.free_delivery_threshold > 0 && cart.length > 0 && (
                <div className="mb-4 bg-[#FAF5EB] p-4 rounded-sm border border-[#EADFC8] shadow-sm">
                   {isFreeDelivery ? ( 
                     <p className="text-green-600 font-bold text-[11px] flex items-center gap-2 uppercase tracking-widest"><span className="text-base">🎉</span> ফ্রি ডেলিভারি আনলক হয়েছে!</p> 
                   ) : ( 
                     <>
                       <p className="text-[#B8860B] font-bold text-[10px] mb-2 uppercase tracking-widest">আর মাত্র ৳{storeSettings.free_delivery_threshold - itemsSubtotal} শপিং করলেই ফ্রি ডেলিভারি!</p>
                       <div className="w-full bg-white border border-[#EADFC8] rounded-full h-1.5 mb-1 overflow-hidden shadow-inner">
                         <div className="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min((itemsSubtotal / storeSettings.free_delivery_threshold) * 100, 100)}%` }}></div>
                       </div>
                     </> 
                   )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 mt-2">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between bg-[#FAF5EB] p-4 rounded-sm border border-[#EADFC8] shadow-sm hover:border-[#D4AF37]/50 transition-colors duration-300">
                    <div className="flex gap-4 items-center w-2/3">
                      <img src={item.image_url||''} loading="lazy" className="w-16 h-16 border border-[#EADFC8] bg-white rounded-sm object-cover shrink-0"/>
                      <div>
                        <p className="text-[12px] font-bold text-[#111412] leading-tight line-clamp-2">{item.name}</p>
                        <p className="text-[11px] font-black mt-2 text-[#B8860B]">{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-[9px] font-bold hover:underline uppercase tracking-wider">Remove</button>
                        <div className="flex items-center border border-[#EADFC8] rounded-sm bg-white overflow-hidden shadow-sm">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 font-bold text-[#111412] hover:bg-[#FAF5EB] transition-colors">-</button>
                          <span className="px-3 text-xs font-bold border-x border-[#EADFC8] py-1.5 text-[#111412] bg-[#FAF5EB]">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 font-bold text-[#111412] hover:bg-[#FAF5EB] transition-colors">+</button>
                        </div>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-center text-gray-500 mt-16 font-bold tracking-[0.2em] uppercase text-xs border border-dashed border-[#D4AF37]/50 p-8 rounded-sm bg-[#FAF5EB]">ব্যাগটি সম্পূর্ণ খালি!</p>}
              </div>

              {cart.length > 0 && (
                <div className="mt-6 bg-[#FAF5EB] p-6 rounded-sm shadow-sm border border-[#EADFC8]">
                  <div className="flex justify-between font-black text-xl mb-6 text-[#111412] border-b border-[#EADFC8] pb-4">
                    <span className="uppercase tracking-[0.2em] text-[11px] text-[#B8860B] mt-1">সাবটোটাল:</span>
                    <span>{itemsSubtotal} ৳</span>
                  </div>
                  <button onClick={() => {setIsCartOpen(false); setIsCheckoutOpen(true)}} className="w-full bg-[#111412] text-[#D4AF37] border border-[#D4AF37] font-bold py-4 text-xs rounded-sm hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 tracking-[0.2em] uppercase shadow-md">চেকআউট করুন</button>
                </div>
              )}
            </div>
          </div>
        )}

        {isWishlistOpen && (
          <div className="fixed inset-0 bg-[#111412]/80 backdrop-blur-sm flex justify-end z-[1000]" onClick={() => setIsWishlistOpen(false)}>
            <div className="bg-white w-full max-w-sm h-full p-8 relative shadow-2xl flex flex-col border-l-4 border-[#D4AF37]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setIsWishlistOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-[#111412] text-3xl transition-colors leading-none">✕</button>
              <h3 className="text-xl font-bold mb-8 border-b border-[#EADFC8] pb-5 text-[#B8860B] tracking-[0.2em] uppercase">উইশলিস্ট ({wishlist.length})</h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {wishlist.length === 0 ? (
                  <p className="text-center text-gray-500 mt-16 font-bold tracking-[0.2em] uppercase text-xs border border-dashed border-[#D4AF37]/50 p-8 rounded-sm bg-[#FAF5EB]">উইশলিস্টে কিছু নেই।</p>
                ) : wishlist.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-[#FAF5EB] p-4 rounded-sm border border-[#EADFC8] shadow-sm hover:border-[#D4AF37]/50 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                      <img src={item.image_url||''} loading="lazy" className="w-16 h-16 border border-[#EADFC8] bg-white object-cover rounded-sm shadow-sm"/>
                      <div>
                        <p className="text-[12px] font-bold text-[#111412] leading-tight line-clamp-2">{item.name}</p>
                        <p className="text-[#B8860B] text-xs font-black mt-2">{formatPrice(item.price)} ৳</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 items-end">
                       <button onClick={() => { addToCart(item); setIsWishlistOpen(false); setIsCartOpen(true); }} className="bg-[#111412] text-[#D4AF37] border border-[#D4AF37] text-[9px] px-3 py-2 rounded-sm font-bold hover:bg-[#D4AF37] hover:text-[#111412] transition-colors uppercase tracking-[0.2em] shadow-sm">🛒 ব্যাগে</button>
                       <button onClick={() => removeFromWishlist(item.id)} className="text-red-500 text-[9px] font-bold hover:underline uppercase tracking-wider text-center">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAuthModal && (
          <div className="fixed inset-0 bg-[#111412]/80 flex flex-col items-center justify-center p-4 backdrop-blur-md z-[1000]" onClick={() => setShowAuthModal(false)}>
            <button onClick={() => setShowAuthModal(false)} className="bg-white text-[#111412] px-6 py-3 rounded-sm font-bold text-xs mb-8 hover:bg-[#FAF5EB] transition-colors shadow-lg border border-[#EADFC8] uppercase tracking-widest z-50">
              লগ-ইন ছাড়া অর্ডার করতে চাইলে এখানে ক্লিক করুন &gt;&gt;
            </button>
            <div className="bg-white p-8 md:p-12 rounded-sm shadow-2xl w-full max-w-md relative border-t-4 border-[#D4AF37]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-2xl transition-colors">✕</button>
              <h2 className="text-2xl font-bold mb-6 text-[#B8860B] text-center tracking-[0.2em] uppercase mt-2">{authView === 'LOGIN' ? 'লগইন করুন' : 'অ্যাকাউন্ট খুলুন'}</h2>
              <button onClick={handleGoogleLogin} disabled={authLoading} className="w-full bg-white border border-[#EADFC8] text-[#111412] py-3.5 rounded-sm font-bold text-[12px] hover:bg-[#FAF5EB] transition-colors mb-6 flex items-center justify-center gap-3 shadow-sm tracking-widest uppercase">
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                Google দিয়ে কন্টিনিউ করুন
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[1px] bg-[#EADFC8] flex-1"></div>
                <span className="text-center text-[#B8860B] text-[10px] font-bold tracking-[0.2em] uppercase">OR EMAIL</span>
                <div className="h-[1px] bg-[#EADFC8] flex-1"></div>
              </div>
              <form onSubmit={handleAuth} className="space-y-5">
                <input type="email" required placeholder="ইমেইল এড্রেস" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-4 rounded-sm text-sm text-[#111412] outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                <input type="password" required placeholder="পাসওয়ার্ড" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-4 rounded-sm text-sm text-[#111412] outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                <button type="submit" disabled={authLoading} className="w-full bg-[#111412] text-[#D4AF37] border border-[#D4AF37] py-4 rounded-sm font-bold hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 tracking-[0.2em] uppercase mt-4 shadow-md text-xs">{authLoading ? 'অপেক্ষা করুন...' : (authView === 'LOGIN' ? 'লগইন করুন' : 'রেজিস্টার করুন')}</button>
              </form>
              <p className="text-[11px] text-center mt-8 text-gray-500 font-medium tracking-wide uppercase">
                {authView === 'LOGIN' ? 'অ্যাকাউন্ট নেই? ' : 'ইতিমধ্যেই অ্যাকাউন্ট আছে? '}
                <span className="text-[#B8860B] font-black cursor-pointer hover:text-[#111412] transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-[#111412] pb-0.5 ml-1" onClick={() => setAuthView(authView === 'LOGIN' ? 'REGISTER' : 'LOGIN')}>{authView === 'LOGIN' ? 'Register Now' : 'Login Here'}</span>
              </p>
            </div>
          </div>
        )}

        {showProfileModal && user && (() => {
          const totalSpent = userOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
          const loyaltyPoints = Math.floor(totalSpent / 20); // 1 point per 20 Tk spent

          return (
          <div className="fixed inset-0 bg-[#111412]/80 backdrop-blur-md flex items-center justify-center p-4 z-[1000]" onClick={() => setShowProfileModal(false)}>
            <div className="bg-white border-2 border-[#D4AF37] p-10 rounded-sm shadow-2xl w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowProfileModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-2xl transition-colors">✕</button>
              <div className="flex flex-col items-center mb-6 mt-2">
                 <div className="w-24 h-24 bg-[#FAF5EB] border-2 border-[#D4AF37] rounded-full mb-5 flex items-center justify-center text-4xl font-bold text-[#D4AF37] overflow-hidden shadow-sm">
                   {userData.avatar ? <img src={userData.avatar} className="w-full h-full object-cover"/> : user.email?.charAt(0).toUpperCase()}
                 </div>
                 <h2 className="text-2xl font-bold text-[#111412] tracking-[0.1em]">{userData.name || user.email?.split('@')[0]}</h2>
                 <p className="text-[10px] text-[#B8860B] font-bold tracking-[0.2em] mt-2 uppercase">{user.email}</p>
              </div>

              {/* LOYALTY POINTS BOX */}
              <div className="bg-gradient-to-r from-[#111412] to-[#2a2a2a] p-4 rounded-sm border border-[#D4AF37] shadow-lg mb-8 flex justify-between items-center">
                 <div>
                    <p className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest mb-1">Loyalty Points</p>
                    <p className="text-2xl font-black text-white">{loyaltyPoints} <span className="text-xs text-[#EADFC8]">pts</span></p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Spent</p>
                    <p className="text-lg font-bold text-[#EADFC8]">৳ {totalSpent}</p>
                 </div>
              </div>
              
              <div className="border-t border-[#EADFC8] pt-6 mb-8">
                 <h3 className="font-bold text-[#B8860B] mb-6 uppercase tracking-[0.2em] text-xs border-b border-[#EADFC8] inline-block pb-2">Order History ({userOrders.length})</h3>
                 <div className="space-y-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {userOrders.length === 0 ? <p className="text-[10px] text-gray-500 text-center py-8 font-bold tracking-[0.2em] uppercase border border-dashed border-[#EADFC8] rounded-sm bg-[#FAF5EB]">No orders yet.</p> : userOrders.map(order => (
                       <div key={order.id} className="bg-[#FAF5EB] border border-[#EADFC8] p-5 rounded-sm shadow-sm text-sm">
                          <div className="flex justify-between font-bold mb-4">
                            <span className="text-[#111412] uppercase tracking-[0.15em] text-xs">Order #{order.id.split('-')[0]}</span>
                            <span className={`px-3 py-1 rounded-sm text-[9px] font-black tracking-[0.2em] uppercase ${order.status === 'PENDING' ? 'text-yellow-600 bg-yellow-50 border border-yellow-200' : 'text-green-600 bg-green-50 border border-green-200'}`}>{order.status}</span>
                          </div>
                          <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Total: <span className="font-black text-[#B8860B] text-sm">৳{order.total_amount}</span></p>
                          <p className="text-[9px] text-gray-400 mt-3 font-bold tracking-[0.2em] uppercase">{new Date(order.created_at).toLocaleString()}</p>
                       </div>
                    ))}
                 </div>
              </div>
              <button onClick={handleLogout} className="w-full bg-white text-red-600 border border-red-200 py-4 rounded-sm font-bold hover:bg-red-50 hover:border-red-500 transition-colors uppercase tracking-[0.2em] text-xs shadow-sm">Logout</button>
            </div>
          </div>
          );
        })()}

        {showTrackingModal && (
          <div className="fixed inset-0 bg-[#111412]/80 backdrop-blur-md flex items-center justify-center p-4 z-[1000]" onClick={() => setShowTrackingModal(false)}>
            <div className="bg-white p-8 md:p-12 rounded-sm shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto custom-scrollbar border-t-4 border-[#D4AF37]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowTrackingModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-2xl transition-colors">✕</button>
              <h2 className="text-2xl font-bold mb-8 text-[#B8860B] tracking-[0.2em] uppercase text-center border-b border-[#EADFC8] pb-4">অর্ডার ট্র্যাকিং</h2>
              <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-4 mb-10">
                <input type="text" required placeholder="মোবাইল নম্বর দিন" value={trackingPhone} onChange={e => setTrackingPhone(e.target.value)} className="flex-1 bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                <button type="submit" className="bg-[#111412] text-[#D4AF37] border border-[#D4AF37] px-8 py-4 rounded-sm font-bold shadow-md hover:bg-[#D4AF37] hover:text-[#111412] transition-colors uppercase tracking-[0.2em] text-xs">{isTracking ? 'Searching...' : 'Track'}</button>
              </form>
              {trackedOrders && (
                <div className="space-y-6">
                  {trackedOrders.length === 0 ? <p className="text-xs text-red-500 font-bold text-center border border-red-200 p-8 rounded-sm bg-red-50 uppercase tracking-[0.2em]">কোনো অর্ডার পাওয়া যায়নি!</p> : trackedOrders.map(order => (
                    <div key={order.id} className="border border-[#EADFC8] p-6 rounded-sm bg-[#FAF5EB] shadow-sm text-sm">
                      <div className="flex justify-between font-bold border-b border-[#D4AF37]/30 pb-4 mb-5">
                         <span className="text-[#111412] uppercase tracking-[0.2em] text-sm">Order: {order.id.split('-')[0]}</span>
                         <span className="text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-sm text-[9px] font-black tracking-[0.2em] uppercase">{order.status}</span>
                      </div>
                      <p className="font-bold text-gray-600 mb-3 uppercase tracking-wider text-xs">Amount: <span className="text-[#B8860B] font-black text-lg">৳{order.total_amount}</span></p>
                      <p className="text-[9px] text-[#D4AF37] mt-4 font-bold tracking-[0.2em] uppercase bg-[#111412] inline-block px-3 py-1.5 rounded-sm">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showAdminDashboard && isAdmin && (
          <div className="fixed inset-0 bg-[#111412]/90 backdrop-blur-md flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-sm max-w-[1400px] w-full h-[95vh] flex flex-col overflow-hidden shadow-2xl border-2 border-[#D4AF37]">
              <div className="flex justify-between items-center bg-[#FAF5EB] text-[#111412] p-6 border-b border-[#EADFC8]">
                <div className="flex items-center gap-5">
                   <button onClick={() => setShowAdminDashboard(false)} className="flex items-center gap-2 bg-white text-[#111412] hover:bg-[#EADFC8] border border-[#D4AF37] px-5 py-2.5 rounded-sm font-bold uppercase tracking-[0.2em] text-xs transition-colors">
                     <span className="text-lg leading-none -mt-0.5">←</span> Back
                   </button>
                   <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-[#B8860B]">{isMasterAdmin ? 'Master Admin Panel' : 'Staff Operations Panel'}</h2>
                </div>
                <button onClick={() => setShowAdminDashboard(false)} className="text-[#111412] hover:text-red-500 text-3xl leading-none transition-colors">✕</button>
              </div>

              <div className="flex border-b border-[#EADFC8] bg-white overflow-x-auto custom-scrollbar">
                <button onClick={() => setAdminTab('dashboard')} className={`flex-1 py-5 px-4 whitespace-nowrap min-w-[120px] font-bold text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${adminTab === 'dashboard' ? 'bg-[#FAF5EB] border-t-2 border-[#D4AF37] text-[#B8860B] shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111412]'}`}>📊 Dashboard</button>
                <button onClick={() => setAdminTab('orders')} className={`flex-1 py-5 px-4 whitespace-nowrap min-w-[120px] font-bold text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${adminTab === 'orders' ? 'bg-[#FAF5EB] border-t-2 border-[#D4AF37] text-[#B8860B] shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111412]'}`}>📦 Orders</button>
                <button onClick={() => setAdminTab('abandoned')} className={`flex-1 py-5 px-4 whitespace-nowrap min-w-[120px] font-bold text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${adminTab === 'abandoned' ? 'bg-[#FAF5EB] border-t-2 border-[#D4AF37] text-[#B8860B] shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111412]'}`}>🛒 Abandoned</button>
                {isMasterAdmin && (
                  <>
                    <button onClick={() => setAdminTab('products')} className={`flex-1 py-5 px-4 whitespace-nowrap min-w-[120px] font-bold text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${adminTab === 'products' ? 'bg-[#FAF5EB] border-t-2 border-[#D4AF37] text-[#B8860B] shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111412]'}`}>🛍️ Product List</button>
                    <button onClick={() => setAdminTab('customers')} className={`flex-1 py-5 px-4 whitespace-nowrap min-w-[120px] font-bold text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${adminTab === 'customers' ? 'bg-[#FAF5EB] border-t-2 border-[#D4AF37] text-[#B8860B] shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111412]'}`}>👥 Customers</button>
                    <button onClick={() => setAdminTab('settings')} className={`flex-1 py-5 px-4 whitespace-nowrap min-w-[120px] font-bold text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${adminTab === 'settings' ? 'bg-[#FAF5EB] border-t-2 border-[#D4AF37] text-[#B8860B] shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-[#111412]'}`}>⚙️ Settings</button>
                  </>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar">
                
                {adminTab === 'dashboard' && (() => {
                  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
                  const pendingOrders = orders.filter(o => o.status === 'PENDING');
                  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
                  
                  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
                  
                  // NET PROFIT CALCULATION (Total Rev - Total Cost)
                  const totalProfit = deliveredOrders.reduce((sum, order) => {
                     const orderProfit = (order.items || []).reduce((itemSum, item) => {
                         const cost = getNumericPrice(item.cost_price || '0');
                         const sellPrice = getNumericPrice(item.price);
                         return itemSum + ((sellPrice - cost) * item.quantity);
                     }, 0);
                     return sum + orderProfit;
                  }, 0);

                  // CHARTS DATA
                  const pieData = [
                    { name: 'Delivered', value: deliveredOrders.length, color: '#16a34a' },
                    { name: 'Pending', value: pendingOrders.length, color: '#ca8a04' },
                    { name: 'Cancelled', value: cancelledOrders.length, color: '#dc2626' }
                  ].filter(d => d.value > 0);

                  const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toLocaleDateString('en-GB'); }).reverse();
                  const revenueData = last7Days.map(dateStr => {
                     const dayOrders = deliveredOrders.filter(o => new Date(o.created_at).toLocaleDateString('en-GB') === dateStr);
                     const rev = dayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
                     return { name: dateStr.substring(0,5), Revenue: rev };
                  });

                  return (
                    <div className="space-y-10">
                       <h3 className="font-bold text-xl mb-4 text-[#111412] tracking-[0.2em] uppercase border-b border-[#EADFC8] pb-4">Business Analytics Overview</h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="bg-gradient-to-br from-[#111412] to-[#2a2a2a] p-6 rounded-md shadow-lg border border-[#D4AF37]">
                             <p className="text-[10px] text-[#EADFC8] font-bold uppercase tracking-widest mb-2">Net Profit (Delivered)</p>
                             <p className="text-3xl font-black text-[#D4AF37]">৳ {totalProfit.toLocaleString()}</p>
                             <p className="text-[9px] mt-2 text-gray-400">After deducting cost prices</p>
                          </div>
                          <div className="bg-white p-6 rounded-md shadow-md border border-[#EADFC8]">
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Total Revenue</p>
                             <p className="text-3xl font-black text-[#111412]">৳ {totalRevenue.toLocaleString()}</p>
                          </div>
                          <div className="bg-white p-6 rounded-md shadow-md border border-[#EADFC8] flex justify-between items-center">
                             <div>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Pending</p>
                               <p className="text-3xl font-black text-yellow-600">{pendingOrders.length}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Delivered</p>
                               <p className="text-3xl font-black text-green-600">{deliveredOrders.length}</p>
                             </div>
                          </div>
                          <div className="bg-red-50 p-6 rounded-md shadow-md border border-red-200">
                             <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2">High Risk / Cancelled</p>
                             <p className="text-3xl font-black text-red-600">{cancelledOrders.length}</p>
                          </div>
                       </div>

                       {/* CHARTS SECTION */}
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2 bg-white border border-[#EADFC8] p-6 rounded-md shadow-sm">
                             <h4 className="text-[11px] font-bold text-[#B8860B] uppercase tracking-widest mb-6">Revenue Trend (Last 7 Days)</h4>
                             <div className="h-[300px] w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#EADFC8" vertical={false} />
                                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                                    <RechartsTooltip contentStyle={{backgroundColor: '#111412', color: '#D4AF37', borderRadius: '4px', border: 'none'}} itemStyle={{color: '#fff'}} cursor={{stroke: '#EADFC8', strokeWidth: 2}} />
                                    <Line type="monotone" dataKey="Revenue" stroke="#B8860B" strokeWidth={3} dot={{r: 4, fill: '#111412', stroke: '#D4AF37', strokeWidth: 2}} activeDot={{r: 6}} />
                                  </LineChart>
                               </ResponsiveContainer>
                             </div>
                          </div>
                          <div className="bg-white border border-[#EADFC8] p-6 rounded-md shadow-sm flex flex-col">
                             <h4 className="text-[11px] font-bold text-[#B8860B] uppercase tracking-widest mb-6">Order Success Rate</h4>
                             <div className="h-[250px] w-full flex-1">
                               {pieData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                     <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                                       {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                     </Pie>
                                     <RechartsTooltip contentStyle={{borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}} />
                                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                                   </PieChart>
                                 </ResponsiveContainer>
                               ) : <p className="text-center text-gray-400 font-bold text-xs pt-20 uppercase tracking-widest">No Data Available</p>}
                             </div>
                          </div>
                       </div>
                    </div>
                  );
                })()}

                {adminTab === 'settings' && isMasterAdmin && (
                  <div className="space-y-10">
                    <form onSubmit={handleSaveSettings} className="bg-[#FAF5EB] p-8 md:p-10 border border-[#EADFC8] rounded-sm shadow-sm">
                      <h3 className="font-bold text-xl mb-8 border-b border-[#D4AF37]/30 pb-4 text-[#111412] tracking-[0.2em] uppercase">Brand & System Settings</h3>
                      
                      {/* MULTI-ADMIN STAFF ROLE SYSTEM */}
                      <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm mb-8">
                         <label className="text-[10px] font-bold mb-4 block text-[#B8860B] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Staff Role Management (Managers)</label>
                         <div className="flex flex-col gap-4">
                           <p className="text-xs font-medium text-gray-600">Enter email addresses of staff who can only process orders (cannot see settings or modify products). Separate by comma.</p>
                           <input type="text" placeholder="manager1@zeenat.com, manager2@zeenat.com" value={storeSettings.staff_emails?.join(', ') || ''} onChange={e => setStoreSettings({...storeSettings, staff_emails: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors font-bold"/>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm">
                           <label className="text-[10px] font-bold mb-4 block text-[#B8860B] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">1. Website Font Style</label>
                           <select value={storeSettings.font_family} onChange={e=>setStoreSettings({...storeSettings, font_family: e.target.value})} className="w-full bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors shadow-inner cursor-pointer" style={{fontFamily: storeSettings.font_family}}>
                             {fontOptions.map((font, idx) => ( 
                               <option key={idx} value={font.value} style={{fontFamily: font.value}}>{font.name}</option> 
                             ))}
                           </select>
                        </div>
                        <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm">
                           <label className="text-[10px] font-bold mb-4 block text-[#B8860B] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Global Heading Color</label>
                           <div className="flex items-center gap-4">
                             <input type="color" value={storeSettings.heading_color} onChange={e=>setStoreSettings({...storeSettings, heading_color: e.target.value})} className="w-12 h-12 rounded-sm cursor-pointer bg-[#FAF5EB] border border-[#EADFC8] p-1 shadow-sm"/>
                             <span className="text-xs font-bold text-[#111412] uppercase tracking-widest leading-relaxed">Select color for Category Titles & Headings</span>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <label className="text-[10px] font-bold mb-3 block text-[#B8860B] uppercase tracking-[0.2em]">Brand Name & Color</label>
                          <div className="flex gap-3">
                            <input type="color" value={storeSettings.brand_name_color} onChange={e=>setStoreSettings({...storeSettings, brand_name_color: e.target.value})} className="w-14 h-12 flex-shrink-0 rounded-sm cursor-pointer bg-white border border-[#EADFC8] p-1 shadow-sm"/>
                            <input value={storeSettings.shop_name} onChange={e=>setStoreSettings({...storeSettings, shop_name: e.target.value})} style={{fontFamily: storeSettings.font_family, color: storeSettings.brand_name_color}} className="w-full bg-white border border-[#EADFC8] p-3 text-sm outline-none focus:border-[#D4AF37] transition-colors shadow-inner"/>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold mb-3 block text-[#B8860B] uppercase tracking-[0.2em]">Phone (Call & WhatsApp)</label>
                          <input value={storeSettings.phone} onChange={e=>setStoreSettings({...storeSettings, phone: e.target.value})} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-3.5 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors shadow-inner"/>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm">
                          <label className="text-[10px] font-bold mb-5 block text-[#B8860B] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Brand Logo (Round Moon Style)</label>
                          <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-[#111412] border-2 border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)] rounded-full flex items-center justify-center overflow-hidden shrink-0 relative group">
                              {storeSettings.logo_url ? (
                                <>
                                  <img src={storeSettings.logo_url} className="w-full h-full object-cover"/>
                                  <button type="button" onClick={() => handleRemoveImage('logo')} className="absolute inset-0 m-auto bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md" title="Remove Image">✕</button>
                                </>
                              ) : <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider text-center">No Logo</span>}
                            </div>
                            <div className="flex-1">
                              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} className="text-xs text-gray-600 w-full bg-[#FAF5EB] p-3 border border-[#EADFC8] rounded-sm cursor-pointer outline-none focus:border-[#D4AF37]"/>
                              {uploadingType === 'logo' && <span className="text-[10px] text-[#B8860B] block mt-3 font-black tracking-[0.2em] uppercase">Uploading...</span>}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm">
                          <label className="text-[10px] font-bold mb-5 block text-[#111412] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">★ Website Background</label>
                          <div className="flex items-center gap-6">
                            <div className="w-32 h-24 bg-[#FAF5EB] border border-[#D4AF37] shadow-sm rounded-sm flex items-center justify-center overflow-hidden shrink-0 relative group">
                              {storeSettings.category_banners?.['WEBSITE_BG'] ? (
                                <>
                                  <img src={storeSettings.category_banners['WEBSITE_BG']} className="w-full h-full object-cover"/>
                                  <button type="button" onClick={() => handleRemoveImage('website_bg')} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-sm text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow" title="Remove Image">✕</button>
                                </>
                              ) : <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">No BG</span>}
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'website_bg')} className="text-xs text-gray-600 w-full bg-[#FAF5EB] p-3 border border-[#EADFC8] rounded-sm cursor-pointer outline-none focus:border-[#D4AF37]"/>
                              {uploadingType === 'website_bg' && <span className="text-[10px] text-[#B8860B] block font-black tracking-[0.2em] uppercase">Uploading...</span>}
                              
                              <div className="flex items-center gap-4 mt-2 bg-[#FAF5EB] p-3 border border-[#EADFC8] rounded-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={storeSettings.bg_enabled} onChange={e=>setStoreSettings({...storeSettings, bg_enabled: e.target.checked})} className="w-4 h-4 accent-[#D4AF37] cursor-pointer"/>
                                  <span className="text-[10px] font-bold text-[#111412] uppercase tracking-widest">Show</span>
                                </label>
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-[10px] font-bold text-[#111412] uppercase tracking-widest">Opacity: {storeSettings.bg_opacity}%</span>
                                  <input type="range" min="0" max="100" value={storeSettings.bg_opacity} onChange={e=>setStoreSettings({...storeSettings, bg_opacity: Number(e.target.value)})} className="w-full accent-[#D4AF37] cursor-pointer"/>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm mb-8">
                           <label className="text-[10px] font-bold mb-4 block text-[#B8860B] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Global Product Sorting</label>
                           <div className="flex flex-col md:flex-row items-center gap-6">
                             <div className="flex-1 w-full">
                                <p className="text-xs text-gray-600 font-bold mb-3 tracking-widest">Select how products should be arranged for customers:</p>
                                <select value={storeSettings.default_sort} onChange={e=>setStoreSettings({...storeSettings, default_sort: e.target.value})} className="w-full bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm font-bold outline-none focus:border-[#D4AF37] shadow-inner cursor-pointer uppercase tracking-widest">
                                   <option value="lowToHigh">Price: Low to High</option>
                                   <option value="highToLow">Price: High to Low</option>
                                   <option value="newest">Newest Uploaded First</option>
                                </select>
                             </div>
                             <div className="flex-1 border border-[#D4AF37]/50 bg-[#FAF5EB] p-4 rounded-sm">
                                <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest leading-relaxed">
                                   💡 "Price: Low to High" সিলেক্ট রাখলে ওয়েবসাইটের সব ক্যাটাগরিতে অটোমেটিক কম দামের প্রোডাক্টগুলো সবার আগে শো করবে।
                                </p>
                             </div>
                           </div>
                      </div>

                      <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm mb-8 mt-6">
                         <label className="text-[10px] font-bold mb-4 block text-[#B8860B] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Global Category Order (ক্যাটাগরি সাজানোর ক্রম)</label>
                         <div className="flex flex-col md:flex-row items-center gap-6">
                           <div className="flex-1 w-full">
                              <p className="text-xs text-gray-600 font-bold mb-3 tracking-widest">যে ক্যাটাগরিগুলো উপরে দেখাতে চান, সেগুলোর নাম কমা (,) দিয়ে লিখুন:</p>
                              <input type="text" value={storeSettings.category_order} onChange={e=>setStoreSettings({...storeSettings, category_order: e.target.value})} placeholder="e.g. জিলবাব, আবায়া, খিমার" className="w-full bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors font-bold"/>
                           </div>
                           <div className="flex-1 border border-[#D4AF37]/50 bg-[#FAF5EB] p-4 rounded-sm">
                              <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest leading-relaxed">
                                 💡 এখানে লেখা নাম অনুযায়ী ওয়েবসাইটে ক্যাটাগরির সেকশনগুলো পর্যায়ক্রমে (উপরে-নিচে) শো করবে। যেগুলো লিস্টে থাকবে না, সেগুলো অটোমেটিক নিচে চলে যাবে।
                              </p>
                           </div>
                         </div>
                      </div>

                      <div className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm mb-8 mt-6">
                         <label className="text-[10px] font-bold mb-4 block text-[#25D366] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Gamified Free Delivery Offer (ফ্রি ডেলিভারি টার্গেট)</label>
                         <div className="flex flex-col md:flex-row items-center gap-6">
                           <div className="flex-1 w-full">
                              <p className="text-xs text-gray-600 font-bold mb-3 tracking-widest">কতো টাকার অর্ডার করলে কাস্টমার ফ্রি ডেলিভারি পাবে?</p>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold text-gray-500">৳</span>
                                 <input type="number" value={storeSettings.free_delivery_threshold} onChange={e=>setStoreSettings({...storeSettings, free_delivery_threshold: Number(e.target.value)})} placeholder="e.g. 1400" className="w-full bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] py-4 pl-10 pr-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors font-black text-lg"/>
                              </div>
                           </div>
                           <div className="flex-1 border border-[#25D366]/50 bg-[#25D366]/10 p-4 rounded-sm">
                              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-relaxed">
                                 💡 এখানে আপনি যে অ্যামাউন্ট সেট করবেন, কাস্টমার ব্যাগে প্রোডাক্ট রাখলে অটোমেটিক একটি "প্রোগ্রেস বার" দেখাবে। টার্গেট ফিলআপ হলে স্বয়ংক্রিয়ভাবে ডেলিভারি চার্জ ০ হয়ে যাবে! (অফারটি বন্ধ রাখতে 0 দিয়ে রাখুন)।
                              </p>
                           </div>
                         </div>
                      </div>

                      <div className="mb-8 bg-white p-8 border border-[#EADFC8] rounded-sm shadow-sm">
                        <label className="text-[11px] font-bold mb-6 block text-[#111412] uppercase tracking-[0.2em] border-b border-[#D4AF37]/50 pb-3">Flash Deal Slider Banners (5 Slots)</label>
                        <div className="space-y-5">
                          {[0, 1, 2, 3, 4].map(idx => (
                            <div key={idx} className="flex items-center gap-6 border border-[#EADFC8] p-5 bg-[#FAF5EB] rounded-sm shadow-inner hover:border-[#D4AF37] transition-colors">
                              <div className="w-32 h-16 bg-white border border-[#D4AF37]/50 flex items-center justify-center overflow-hidden shrink-0 rounded-sm relative group shadow-sm">
                                {storeSettings.banners[idx]?.imageUrl ? ( 
                                  <>
                                    <img src={storeSettings.banners[idx].imageUrl} className="w-full h-full object-cover"/>
                                    <button type="button" onClick={() => handleRemoveImage('banner', idx)} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow" title="Remove Image">✕</button>
                                  </> 
                                ) : <span className="text-[9px] text-[#B8860B] font-black tracking-[0.2em]">SLIDE {idx+1}</span>}
                              </div>
                              <div className="flex-1">
                                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'banner', idx)} className="text-xs w-full text-[#111412] bg-white p-2.5 border border-[#EADFC8] rounded-sm cursor-pointer outline-none focus:border-[#D4AF37]"/>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-[#111412] text-[#D4AF37] border border-[#D4AF37] px-8 py-5 text-[13px] font-bold rounded-sm shadow-md hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 tracking-[0.2em] uppercase">Save Brand Settings</button>
                    </form>

                    <div className="bg-[#FAF5EB] p-8 md:p-10 border border-[#EADFC8] rounded-sm shadow-sm mt-8">
                      <div className="flex justify-between items-center mb-8 border-b border-[#D4AF37]/30 pb-4">
                         <h3 className="font-bold text-xl text-[#111412] tracking-[0.2em] uppercase">Custom Category Banners</h3>
                         <button type="button" onClick={() => setCustomSections([...customSections, { id: Date.now().toString(), title: 'New Banner Section', fontSize: 36, imageUrl: '', color: '#B8860B', imageHeight: 300 }])} className="bg-[#111412] text-[#D4AF37] border border-[#D4AF37] px-6 py-3 text-[10px] font-bold rounded-sm hover:bg-[#D4AF37] hover:text-[#111412] transition-colors shadow-md uppercase tracking-[0.2em]">+ Add New Banner</button>
                      </div>
                      
                      <div className="space-y-8">
                        {customSections.length === 0 ? (
                           <p className="text-gray-500 text-xs text-center py-10 border border-dashed border-[#D4AF37]/50 bg-white tracking-[0.2em] uppercase font-bold rounded-sm">No custom banners added yet.</p>
                        ) : customSections.map((section, index) => (
                          <div key={section.id} className="flex flex-col md:flex-row gap-8 items-start md:items-center p-8 border border-[#EADFC8] rounded-sm bg-white shadow-sm relative group">
                            <button type="button" onClick={() => setCustomSections(customSections.filter(s => s.id !== section.id))} className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-sm text-sm hover:bg-red-600 transition-colors shadow-md z-10" title="Delete Banner">✕</button>

                            <div className="w-full md:w-1/3 flex flex-col gap-5">
                              <div>
                                 <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em] mb-2 block">Banner Title & Text Color</label>
                                 <div className="flex gap-3">
                                   <input type="color" value={section.color || '#B8860B'} onChange={e => { const newSec = [...customSections]; newSec[index].color = e.target.value; setCustomSections(newSec); }} className="w-12 h-11 flex-shrink-0 rounded-sm cursor-pointer bg-[#FAF5EB] border border-[#EADFC8] p-1 shadow-sm"/>
                                   <input type="text" value={section.title} onChange={e => { const newSec = [...customSections]; newSec[index].title = e.target.value; setCustomSections(newSec); }} style={{fontFamily: storeSettings.font_family, color: section.color || '#B8860B'}} className="w-full bg-[#FAF5EB] border border-[#EADFC8] p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
                                 </div>
                              </div>
                              <div className="flex gap-4">
                                <div className="flex-1">
                                   <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em] mb-2 block">Text Size</label>
                                   <input type="number" value={section.fontSize} onChange={e => { const newSec = [...customSections]; newSec[index].fontSize = Number(e.target.value); setCustomSections(newSec); }} className="w-full bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] p-3.5 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
                                </div>
                                <div className="flex-1">
                                   <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em] mb-2 block">Banner Height (px)</label>
                                   <input type="number" value={section.imageHeight || 300} onChange={e => { const newSec = [...customSections]; newSec[index].imageHeight = Number(e.target.value); setCustomSections(newSec); }} className="w-full bg-[#FAF5EB] border border-[#EADFC8] text-[#111412] p-3.5 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
                                </div>
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em] mb-2 block">Upload Banner Image</label>
                                 <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'custom_section', undefined, section.id)} className="text-[11px] text-gray-600 w-full bg-[#FAF5EB] p-3 border border-[#EADFC8] rounded-sm cursor-pointer outline-none focus:border-[#D4AF37]"/>
                                 {uploadingType === `custom_${section.id}` && <span className="text-[10px] text-[#B8860B] block mt-2 font-black tracking-[0.2em] uppercase">Uploading...</span>}
                              </div>
                            </div>
                            
                            <div className="w-full md:w-2/3 bg-[#FAF5EB] border border-[#D4AF37]/50 rounded-sm flex items-center justify-center overflow-hidden shadow-sm" style={{ height: section.imageHeight ? `${section.imageHeight}px` : '300px' }}>
                               {section.imageUrl ? (
                                 <img src={section.imageUrl} className="w-full h-full" style={{ objectFit: 'fill', width: '100%', height: '100%' }} />
                               ) : (
                                 <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">No Banner Uploaded</span>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#FAF5EB] p-8 md:p-10 border border-[#EADFC8] rounded-sm shadow-sm mt-8">
                        <div className="flex items-center gap-4 mb-8 border-b border-[#D4AF37]/30 pb-4">
                          <h3 className="font-bold text-xl text-[#111412] tracking-[0.2em] uppercase">Website Pages Content</h3>
                          <div className="ml-auto flex items-center gap-3">
                             <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em]">Text Color</label>
                             <input type="color" value={storeSettings.page_text_color} onChange={e=>setStoreSettings({...storeSettings, page_text_color: e.target.value})} className="w-10 h-10 rounded-sm cursor-pointer bg-white border border-[#EADFC8] p-1 shadow-sm"/>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] font-bold mb-3 block text-[#B8860B] uppercase tracking-[0.2em]">Contact Info (যোগাযোগ)</label>
                              <textarea rows={3} value={storeSettings.contact_info} onChange={e=>setStoreSettings({...storeSettings, contact_info: e.target.value})} style={{color: storeSettings.page_text_color}} className="w-full bg-white border border-[#EADFC8] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors shadow-inner"></textarea>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold mb-3 block text-[#B8860B] uppercase tracking-[0.2em]">Facebook Page URL</label>
                              <input type="text" value={storeSettings.fb_page_url} onChange={e=>setStoreSettings({...storeSettings, fb_page_url: e.target.value})} style={{color: storeSettings.page_text_color}} className="w-full bg-white border border-[#EADFC8] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold mb-3 block text-[#B8860B] uppercase tracking-[0.2em]">Return Policy (রিটার্ন পলিসি)</label>
                              <textarea rows={3} value={storeSettings.return_policy} onChange={e=>setStoreSettings({...storeSettings, return_policy: e.target.value})} style={{color: storeSettings.page_text_color}} className="w-full bg-white border border-[#EADFC8] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors shadow-inner"></textarea>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold mb-3 block text-[#B8860B] uppercase tracking-[0.2em]">Delivery Policy (ডেলিভারি পলিসি)</label>
                              <textarea rows={3} value={storeSettings.delivery_policy} onChange={e=>setStoreSettings({...storeSettings, delivery_policy: e.target.value})} style={{color: storeSettings.page_text_color}} className="w-full bg-white border border-[#EADFC8] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] transition-colors shadow-inner"></textarea>
                           </div>
                        </div>
                        <button onClick={handleSaveSettings} className="w-full mt-8 bg-[#111412] text-[#D4AF37] border border-[#D4AF37] px-8 py-5 text-[13px] font-bold rounded-sm shadow-md hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 tracking-[0.2em] uppercase">Save Pages Content</button>
                    </div>
                  </div>
                )}

                {adminTab === 'abandoned' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-sm border border-[#EADFC8] shadow-sm">
                       <div>
                         <h3 className="font-bold text-[#111412] tracking-[0.2em] uppercase text-sm">🛒 Abandoned Carts</h3>
                         <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Users who typed their phone but didn't order</p>
                       </div>
                    </div>
                    {orders.filter(o => o.status === 'ABANDONED_CART').length === 0 ? <p className="text-center py-16 text-gray-500 font-bold border-2 border-dashed border-[#D4AF37]/50 rounded-sm bg-[#FAF5EB] tracking-[0.2em] uppercase text-xs">No abandoned carts found.</p> : orders.filter(o => o.status === 'ABANDONED_CART').map(order => (
                      <div key={order.id} className="bg-red-50/50 p-6 md:p-8 border border-red-200 rounded-sm shadow-sm relative">
                        <div className="flex justify-between items-start mb-6 border-b border-red-200 pb-4">
                           <div>
                              <p className="font-black text-lg text-red-600 uppercase tracking-wider">Unfinished Draft</p>
                              <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-2 bg-white px-3 py-1.5 rounded-sm border border-red-100 inline-block">{new Date(order.created_at).toLocaleString()}</p>
                           </div>
                           <a href={`https://wa.me/88${order.customer_phone}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${order.customer_name === 'Guest' ? '' : order.customer_name}, আপনি আমাদের ওয়েবসাইটে কিছু প্রোডাক্ট ব্যাগে রেখেছিলেন কিন্তু অর্ডার কমপ্লিট করেননি। আপনার জন্য কি অর্ডারটি কনফার্ম করে দিবো?`)}`} target="_blank" className="bg-[#25D366] text-white text-[10px] px-4 py-2.5 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-[#128C7E] flex justify-center items-center gap-2 shadow-sm">
                               <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 001.602 6.002L.035 23.996l6.147-1.61A11.975 11.975 0 0011.944 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm.056 20.155c-1.782 0-3.528-.48-5.06-1.385l-.36-.214-3.763.987.998-3.668-.235-.375A9.878 9.878 0 012.062 12c0-5.467 4.453-9.92 9.938-9.92s9.938 4.453 9.938 9.92-4.453 9.92-9.938 9.92zm5.452-7.443c-.298-.15-1.765-.87-2.038-.97-.272-.1-.47-.15-.67.15-.198.298-.767.97-.94 1.168-.172.2-.345.225-.643.075-2.06-1.03-3.418-2.313-4.44-4.08-.173-.298-.018-.46.13-.61.134-.134.298-.348.448-.522.15-.175.2-.298.298-.5.1-.198.05-.372-.025-.522-.075-.15-.67-1.618-.918-2.215-.24-.582-.487-.502-.67-.512-.172-.01-.37-.01-.568-.01-.198 0-.52.075-.793.372-.272.298-1.042 1.02-1.042 2.485s1.066 2.88 1.215 3.08c.15.2 2.1 3.205 5.088 4.493 2.015.87 2.854.945 3.923.792.833-.118 2.563-1.047 2.923-2.06.358-1.012.358-1.88.252-2.06-.104-.175-.378-.275-.675-.425z"/></svg> WhatsApp Recovery
                           </a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                          <div className="bg-white p-5 rounded-sm border border-red-100 shadow-sm">
                            <p className="text-[10px] text-red-500 mb-3 font-black uppercase tracking-[0.2em] border-b border-red-100 pb-2">Customer Details</p>
                            <p className="font-bold text-[#111412] text-lg mb-1">{order.customer_name}</p>
                            <p className="font-black text-xl text-red-600 mb-1">{order.customer_phone}</p>
                            {order.ip_address && <p className="text-[9px] text-gray-400 font-bold">IP: {order.ip_address} ({order.location})</p>}
                          </div>
                          <div className="bg-white p-5 rounded-sm border border-red-100 shadow-sm">
                            <p className="text-[10px] text-red-500 mb-3 font-black uppercase tracking-[0.2em] border-b border-red-100 pb-2">Left in Cart</p>
                            <p className="font-black text-[#111412] text-xl border-b border-red-100 pb-3 mb-3">Cart Value: <span className="text-red-600">৳{order.total_amount}</span></p>
                            <div className="flex flex-col gap-2">
                              {(order.items||[]).map((item, idx) => ( <div key={idx} className="flex justify-between text-xs"><span className="font-bold text-gray-700 line-clamp-1">{item.name}</span><span className="font-black text-gray-900 ml-4">x {item.quantity}</span></div> ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {adminTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-sm border border-[#EADFC8] shadow-sm flex-wrap gap-4">
                       <h3 className="font-bold text-[#111412] tracking-[0.2em] uppercase">All Orders ({orders.filter(o=>o.status !== 'ABANDONED_CART').length})</h3>
                       <div className="flex gap-3">
                          <button onClick={bulkPrintPendingInvoices} className="bg-white text-[#111412] px-5 py-2.5 text-[10px] font-bold rounded-sm shadow-sm hover:bg-[#FAF5EB] transition uppercase tracking-widest border border-[#EADFC8]">🖨 Print Pending</button>
                          {isMasterAdmin && <button onClick={exportOrdersCSV} className="bg-[#111412] text-[#D4AF37] px-5 py-2.5 text-[10px] font-bold rounded-sm shadow-md hover:bg-[#D4AF37] hover:text-[#111412] transition-colors uppercase tracking-widest border border-[#D4AF37]">⬇ Export CSV</button>}
                       </div>
                    </div>
                    
                    {orders.filter(o=>o.status !== 'ABANDONED_CART').length === 0 ? <p className="text-center py-16 text-gray-500 font-bold border-2 border-dashed border-[#D4AF37]/50 rounded-sm bg-[#FAF5EB] tracking-[0.2em] uppercase text-xs">No active orders found.</p> : orders.filter(o=>o.status !== 'ABANDONED_CART').map(order => {
                      const badge = getFraudBadge(order.customer_phone, order.ip_address);
                      return (
                      <div key={order.id} className="bg-white border border-[#EADFC8] rounded-sm shadow-sm hover:border-[#D4AF37] transition-colors relative flex flex-col xl:flex-row overflow-hidden">
                        
                        {/* LEFT SIDE: Order Details */}
                        <div className="flex-1 p-6 md:p-8 border-b xl:border-b-0 xl:border-r border-[#EADFC8]">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#D4AF37]/30 pb-5 mb-6 gap-5">
                            <div>
                               <div className="flex items-center gap-3 mb-2">
                                 <p className="font-black text-lg text-[#111412] uppercase tracking-wider">Order #{order.id.split('-')[0]}</p>
                                 <span className={`text-[10px] font-black px-3 py-1.5 rounded-sm uppercase tracking-wider border ${getStatusColor(order.status)}`}>{order.payment_method}</span>
                               </div>
                               <div className="flex items-center gap-4 mt-3"><p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase bg-[#FAF5EB] px-3 py-1.5 rounded-sm border border-[#EADFC8]">{new Date(order.created_at).toLocaleString()}</p></div>
                            </div>
                            <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className={`text-xs font-bold p-3 rounded-sm outline-none cursor-pointer shadow-sm uppercase tracking-[0.1em] border ${getStatusColor(order.status)}`}>
                              <option value="PENDING" className="bg-white text-black">PENDING</option><option value="CONFIRMED" className="bg-white text-black">CONFIRMED</option><option value="PROCESSING" className="bg-white text-black">PROCESSING</option>
                              <option value="SHIPPED" className="bg-white text-black">SHIPPED</option><option value="DELIVERED" className="bg-white text-black">DELIVERED</option><option value="CANCELLED" className="bg-white text-black">CANCELLED</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div className="bg-[#FAF5EB] p-6 rounded-sm border border-[#EADFC8] shadow-sm">
                              <p className="text-[10px] text-[#B8860B] mb-3 font-black uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Customer Details</p>
                              <p className="font-bold text-[#111412] text-lg mb-1">{order.customer_name}</p>
                              <p className="font-medium text-gray-600 mb-1">{order.customer_phone}</p>
                            </div>
                            <div className="bg-[#FAF5EB] p-6 rounded-sm border border-[#EADFC8] shadow-sm">
                              <p className="text-[10px] text-[#B8860B] mb-3 font-black uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">Shipping Info</p>
                              <p className="line-clamp-2 font-medium text-gray-600 mb-4">{order.customer_address}</p>
                              <p className="font-black text-[#111412] text-xl border-t border-[#EADFC8] pt-3">Total: <span className="text-[#B8860B]">৳{order.total_amount}</span></p>
                            </div>
                          </div>

                          {order.items && order.items.length > 0 && (
                            <div className="mt-6 bg-[#FAF5EB] p-6 rounded-sm border border-[#EADFC8] shadow-sm">
                              <p className="text-[10px] text-[#B8860B] mb-4 font-black uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-2">অর্ডারকৃত প্রোডাক্টসমূহ</p>
                              <div className="flex flex-col gap-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-sm border border-[#EADFC8]">
                                     <div className="flex items-center gap-4">
                                       {item.image_url ? ( <img src={item.image_url} className="w-12 h-12 object-cover rounded-sm border border-[#EADFC8]" /> ) : ( <div className="w-12 h-12 bg-[#FAF5EB] rounded-sm border border-[#EADFC8] flex items-center justify-center text-[8px] text-gray-400">No Img</div> )}
                                       <div>
                                         <p className="font-bold text-[#111412] text-xs line-clamp-1">{item.name}</p>
                                         <p className="text-[9px] text-[#D4AF37] font-bold mt-1 uppercase tracking-widest">ID: {item.id.split('-')[0]}</p>
                                       </div>
                                     </div>
                                     <div className="text-right"><p className="font-black text-[#B8860B] text-sm">৳{item.price} <span className="text-gray-500 text-[10px] ml-1">x {item.quantity}</span></p></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RIGHT SIDE: Smart Actions & Risk Profile */}
                        <div className="w-full xl:w-[340px] bg-[#FAF5EB] p-6 md:p-8 flex flex-col gap-5 shrink-0 relative overflow-hidden">
                          <h4 className="font-bold text-[11px] text-[#B8860B] uppercase tracking-[0.2em] border-b border-[#EADFC8] pb-3 text-center">Smart Actions & Risk</h4>
                          <div className={`p-4 rounded-sm border ${badge.color} text-center shadow-sm relative overflow-hidden`}><div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0"></div><p className="text-xs font-black uppercase tracking-widest relative z-10">{badge.label}</p></div>
                          <div className="bg-white p-4 rounded-sm border border-[#EADFC8] shadow-sm"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1"><span>🌐</span> IP Tracker</p><p className="text-[11px] font-bold text-[#111412] mb-1">{order.ip_address || 'IP Not Recorded'}</p><p className="text-[10px] text-gray-500 leading-tight">{order.location || 'Unknown Location'}</p></div>
                          <div className="mt-auto pt-6 border-t border-[#EADFC8] flex flex-col gap-3">
                             <a href={`https://wa.me/88${order.customer_phone}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${order.customer_name}, আপনার অর্ডার #${order.id.split('-')[0]} কনফার্ম করা হয়েছে। টোটাল বিল: ৳${order.total_amount}। ধন্যবাদ!`)}`} target="_blank" className="w-full bg-[#25D366] text-white text-[10px] py-4 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-[#128C7E] flex justify-center items-center gap-2 shadow-sm transition-colors border border-[#25D366]"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 001.602 6.002L.035 23.996l6.147-1.61A11.975 11.975 0 0011.944 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm.056 20.155c-1.782 0-3.528-.48-5.06-1.385l-.36-.214-3.763.987.998-3.668-.235-.375A9.878 9.878 0 012.062 12c0-5.467 4.453-9.92 9.938-9.92s9.938 4.453 9.938 9.92-4.453 9.92-9.938 9.92zm5.452-7.443c-.298-.15-1.765-.87-2.038-.97-.272-.1-.47-.15-.67.15-.198.298-.767.97-.94 1.168-.172.2-.345.225-.643.075-2.06-1.03-3.418-2.313-4.44-4.08-.173-.298-.018-.46.13-.61.134-.134.298-.348.448-.522.15-.175.2-.298.298-.5.1-.198.05-.372-.025-.522-.075-.15-.67-1.618-.918-2.215-.24-.582-.487-.502-.67-.512-.172-.01-.37-.01-.568-.01-.198 0-.52.075-.793.372-.272.298-1.042 1.02-1.042 2.485s1.066 2.88 1.215 3.08c.15.2 2.1 3.205 5.088 4.493 2.015.87 2.854.945 3.923.792.833-.118 2.563-1.047 2.923-2.06.358-1.012.358-1.88.252-2.06-.104-.175-.378-.275-.675-.425z"/></svg>Send Invoice</a>
                             {isMasterAdmin && <button onClick={() => toggleBlockCustomer(order.customer_phone)} className={`w-full text-[10px] py-4 rounded-sm font-bold uppercase tracking-[0.2em] transition-colors shadow-sm border ${storeSettings.blocklist?.includes(order.customer_phone) ? 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white'}`}>{storeSettings.blocklist?.includes(order.customer_phone) ? '🔓 Unblock Customer' : '🚫 Block Customer'}</button>}
                          </div>
                        </div>

                      </div>
                    )})}
                  </div>
                )}

                {adminTab === 'products' && isMasterAdmin && (
                  <div>
                    <div className="mb-8 bg-[#FAF5EB] p-6 border border-[#EADFC8] rounded-sm shadow-sm">
                      <h3 className="font-bold text-sm text-[#111412] tracking-[0.2em] uppercase mb-5 border-b border-[#D4AF37]/30 pb-3">Bulk Category Price & Offer Update</h3>
                      <form onSubmit={handleBulkPriceUpdate} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-bold mb-2 text-[#B8860B] uppercase tracking-[0.2em]">Select Category <span className="text-red-500">*</span></label>
                          <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner">
                            <option value="">-- ক্যাটাগরি নির্বাচন করুন --</option>
                            {allCategoryOptions.map((cat, idx) => ( <option key={idx} value={cat}>{cat}</option> ))}
                          </select>
                        </div>
                        <div className="flex-1 w-full"><label className="block text-[10px] font-bold mb-2 text-[#B8860B] uppercase tracking-[0.2em]">Main Price (কাটা দাম)</label><input type="text" placeholder="e.g. 1500" value={bulkOriginalPrice} onChange={e => setBulkOriginalPrice(e.target.value)} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner"/></div>
                        <div className="flex-1 w-full"><label className="block text-[10px] font-bold mb-2 text-[#B8860B] uppercase tracking-[0.2em]">Offer Price (বর্তমান দাম) <span className="text-red-500">*</span></label><input type="text" required placeholder="e.g. 999" value={bulkOfferPrice} onChange={e => setBulkOfferPrice(e.target.value)} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner"/></div>
                        <button type="submit" disabled={isBulkUpdating} className="w-full md:w-auto bg-[#111412] text-[#D4AF37] border border-[#D4AF37] px-8 py-3.5 text-[11px] font-bold rounded-sm shadow-md hover:bg-[#D4AF37] hover:text-[#111412] transition-colors tracking-[0.2em] uppercase whitespace-nowrap">{isBulkUpdating ? 'Updating...' : 'Apply to All'}</button>
                      </form>
                      <p className="text-[10px] text-gray-500 font-bold tracking-[0.1em] mt-4 uppercase">⚠️ এটি সেভ করলে নির্বাচিত ক্যাটাগরির সকল প্রোডাক্টের দাম একযোগে পরিবর্তন হয়ে যাবে এবং অটোমেটিক ডিসকাউন্ট ব্যাজ তৈরি হবে।</p>
                    </div>

                    <div className="mb-6 flex justify-between items-center bg-[#FAF5EB] p-4 border border-[#EADFC8] rounded-sm shadow-sm">
                      <h3 className="font-bold text-sm text-[#111412] tracking-[0.2em] uppercase">All Products ({products.length})</h3>
                      <input type="text" placeholder="Search by Name or ID..." value={adminSearchQuery} onChange={e => setAdminSearchQuery(e.target.value)} className="w-full md:w-1/3 bg-white border border-[#EADFC8] p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {filteredAdminProducts.length > 0 ? ( filteredAdminProducts.map(item => renderProductCard(item, true)) ) : ( <p className="col-span-full text-center text-sm text-gray-400 py-10 font-bold uppercase tracking-widest">No products found matching your search</p> )}
                    </div>
                  </div>
                )}

                {adminTab === 'customers' && isMasterAdmin && (
                  <div>
                    <div className="mb-6 flex justify-between items-center bg-[#FAF5EB] p-4 border border-[#EADFC8] rounded-sm shadow-sm"><h3 className="font-bold text-sm text-[#111412] tracking-[0.2em] uppercase">All Customers ({uniqueCustomers.length})</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {uniqueCustomers.length > 0 ? uniqueCustomers.map((cust, idx) => (
                          <div key={idx} className="bg-white p-6 border border-[#EADFC8] rounded-sm shadow-sm hover:border-[#D4AF37] transition-colors">
                             <div className="flex justify-between items-start mb-4 border-b border-[#D4AF37]/30 pb-4">
                                <div>
                                   <p className="font-black text-lg text-[#111412]">{cust.name}</p>
                                   <p className="text-xs text-gray-500 font-bold mt-1 tracking-widest">{cust.phone}</p>
                                   {storeSettings.blocklist?.includes(cust.phone) && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-1 rounded-sm mt-2 inline-block font-bold tracking-widest uppercase">Blocked</span>}
                                </div>
                                <div className="bg-[#FAF5EB] border border-[#D4AF37] text-[#B8860B] px-3 py-1.5 rounded-sm flex flex-col items-center"><span className="text-[10px] font-bold uppercase tracking-widest mb-1">Orders</span><span className="font-black text-lg leading-none">{cust.orderCount}</span></div>
                             </div>
                             <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cust.address}</p>
                             <p className="text-xs font-bold text-red-500 mb-4">Cancelled: {cust.cancelledCount}</p>
                             
                             <div className="flex justify-between items-end pt-4 border-t border-[#EADFC8]">
                                <div><p className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase mb-1">Total Spent</p><p className="font-black text-[#B8860B] text-lg">৳{cust.totalSpent}</p></div>
                                <div className="flex flex-col items-end gap-2"><p className="text-[9px] text-[#D4AF37] font-bold tracking-[0.2em] uppercase bg-[#111412] px-2 py-1 rounded-sm">Last: {new Date(cust.lastOrder).toLocaleDateString()}</p><button onClick={() => toggleBlockCustomer(cust.phone)} className="text-[9px] border border-gray-400 px-2 py-1 rounded-sm hover:bg-gray-100 uppercase tracking-widest font-bold">{storeSettings.blocklist?.includes(cust.phone) ? 'Unblock' : 'Block'}</button></div>
                             </div>
                          </div>
                       )) : ( <p className="col-span-full text-center text-sm text-gray-400 py-10 font-bold uppercase tracking-widest">No customers found</p> )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {showProductModal && isMasterAdmin && (
          <div className="fixed inset-0 bg-[#111412]/80 backdrop-blur-md flex items-center justify-center p-4 z-[1001]" onClick={() => setShowProductModal(false)}>
            <div className="bg-[#FAF5EB] border-2 border-[#D4AF37] max-w-2xl w-full p-8 md:p-10 relative shadow-2xl rounded-sm max-h-[95vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8 border-b border-[#EADFC8] pb-5">
                 <button onClick={() => setShowProductModal(false)} className="flex items-center gap-2 text-[#111412] font-bold uppercase tracking-[0.2em] text-xs transition-colors bg-white hover:bg-[#EADFC8] border border-[#D4AF37] px-5 py-2.5 rounded-sm"><span className="text-xl leading-none -mt-0.5">←</span> ফিরে যান</button>
                 <h3 className="text-xl font-bold text-[#B8860B] uppercase tracking-[0.2em]">{editingProductId ? "Update Product" : "Add Product"}</h3>
                 <button onClick={() => setShowProductModal(false)} className="text-[#111412] hover:text-red-500 text-3xl font-light transition-colors">✕</button>
              </div>
              
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div><label className="block text-[10px] font-bold mb-2 text-[#B8860B] uppercase tracking-[0.2em]">Product Name (ঐচ্ছিক)</label><input value={newName} onChange={e => setNewName(e.target.value)} style={{fontFamily: storeSettings.font_family}} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/></div>
                
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-[0.2em]">Cost Price (Net Profit এর জন্য)</label><input value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} placeholder="e.g. 800" className="w-full bg-white border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/></div>
                  <div className="flex-1"><label className="block text-[10px] font-bold mb-2 text-[#B8860B] uppercase tracking-[0.2em]">Regular Price (কাটা দাম)</label><input value={newOriginalPrice} onChange={e => setNewOriginalPrice(e.target.value)} placeholder="e.g. 1500" className="w-full bg-white border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/></div>
                  <div className="flex-1"><label className="block text-[10px] font-bold mb-2 text-green-600 uppercase tracking-[0.2em]">Offer Price (বিক্রি দাম)</label><input required value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="e.g. 1200" className="w-full bg-white border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-green-500 shadow-inner transition-colors"/></div>
                </div>
                
                <div className="bg-white border border-[#EADFC8] p-6 rounded-sm shadow-sm">
                  <div className="flex justify-between items-center mb-5 border-b border-[#EADFC8] pb-2">
                     <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.2em]">Product Images (Max 4)</span>
                     <div className="flex items-center gap-3">
                        <label className="text-[10px] font-bold text-[#111412] uppercase tracking-[0.2em]">Stock Qty:</label>
                        <input type="number" required value={newStockCount} onChange={e => setNewStockCount(Number(e.target.value))} className="w-20 bg-[#FAF5EB] border border-[#EADFC8] text-center p-2 rounded-sm text-sm outline-none focus:border-[#D4AF37] font-black"/>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    {[ {url: newImageUrl, set: setNewImageUrl, id: 'product1'}, {url: newImageUrl2, set: setNewImageUrl2, id: 'product2'}, {url: newImageUrl3, set: setNewImageUrl3, id: 'product3'}, {url: newImageUrl4, set: setNewImageUrl4, id: 'product4'} ].map((imgItem, idx) => (
                      <div key={idx} className="relative">
                        {imgItem.url ? ( <div className="w-full h-24 border border-[#D4AF37] rounded-sm overflow-hidden relative group shadow-sm bg-[#FAF5EB]"><img src={imgItem.url} className="w-full h-full object-cover" /><button type="button" onClick={() => imgItem.set('')} className="absolute inset-0 m-auto bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md" title="Remove Image">✕</button></div> ) : ( <input type="file" accept="image/*" onChange={e => handleImageUpload(e, imgItem.id)} className="text-[11px] bg-[#FAF5EB] text-[#111412] p-3 border border-[#EADFC8] outline-none focus:border-[#D4AF37] rounded-sm w-full cursor-pointer h-24"/> )}
                        {uploadingType === imgItem.id && <span className="text-[10px] text-[#B8860B] absolute bottom-1 left-2 font-black tracking-widest bg-white/80 px-1 rounded">Uploading...</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-3 text-[#B8860B] uppercase tracking-[0.2em]">Select Categories (Multiple)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#FAF5EB] p-4 border border-[#EADFC8] rounded-sm max-h-40 overflow-y-auto custom-scrollbar">
                    {allCategoryOptions.map((cat, index) => ( <label key={index} className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-[#111412] bg-white p-2 border border-[#EADFC8] rounded-sm shadow-sm hover:border-[#D4AF37] transition-colors"><input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => handleCategoryToggle(cat)} className="accent-[#D4AF37] w-4 h-4 cursor-pointer flex-shrink-0"/><span className="truncate">{cat}</span></label> ))}
                  </div>
                  <input type="text" value={customCategoryStr} onChange={e => setCustomCategoryStr(e.target.value)} placeholder="অথবা নতুন ক্যাটাগরি লিখুন (কমা দিয়ে একাধিক লিখতে পারেন)" style={{fontFamily: storeSettings.font_family}} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-3 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors mt-3"/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-2 text-[#B8860B] uppercase tracking-[0.2em]">Sub-Category (সাব-ক্যাটাগরি - ঐচ্ছিক)</label>
                  <input type="text" value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} placeholder="e.g. Winter Collection" style={{fontFamily: storeSettings.font_family}} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm outline-none focus:border-[#D4AF37] shadow-inner transition-colors"/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-2 text-[#B8860B] uppercase tracking-[0.2em]">Description (HTML Support Available)</label>
                  <textarea rows={4} value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full bg-white border border-[#EADFC8] text-[#111412] p-4 rounded-sm text-sm custom-scrollbar outline-none focus:border-[#D4AF37] shadow-inner transition-colors"></textarea>
                  <p className="text-[9px] text-[#D4AF37] mt-2 font-bold tracking-widest">💡 আপনি চাইলে সাধারণ লেখার পাশাপাশি HTML ট্যাগ ব্যবহার করে লেখাকে স্টাইল করতে পারেন।</p>
                </div>

                <div className="flex gap-4 mt-6">
                  {editingProductId && <button type="button" onClick={(e) => { setShowProductModal(false); handleDeleteProduct(editingProductId as string, e); }} className="w-1/3 bg-red-600 text-white font-bold py-5 text-[11px] rounded-sm uppercase tracking-[0.2em] hover:bg-red-700 transition-colors shadow-md">Delete</button>}
                  <button type="submit" disabled={isSaving || !!uploadingType} className="flex-1 bg-[#111412] text-[#D4AF37] border border-[#D4AF37] font-bold py-5 text-[13px] rounded-sm uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-[#111412] transition-colors duration-300 shadow-md">{isSaving ? "Saving..." : "Save Product"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}