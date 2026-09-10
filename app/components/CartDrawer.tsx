'use client';

import React, { useState } from 'react';
import { useCart } from '../store/useCart';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CartDrawer() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  // FIXED: sum এবং item এ টাইপ (type) বসানো হয়েছে
  const totalAmount = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert('দয়া করে আপনার নাম, ফোন নম্বর এবং সম্পূর্ণ ঠিকানা দিন!');
      return;
    }

    if (cart.length === 0) {
      alert('আপনার কার্ট খালি রয়েছে!');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('orders').insert([
      {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: formData.address,
        items: JSON.stringify(cart),
        total_amount: totalAmount,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('অর্ডার সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      alert(`ধন্যবাদ ${formData.name}! আপনার অর্ডারটি সফলভাবে প্লেস করা হয়েছে। মোট বিল: ৳${totalAmount}`);
      clearCart();
      setIsCheckout(false);
      setIsOpen(false);
      setFormData({ name: '', phone: '', address: '' });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-5 right-6 z-40 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 font-bold text-black shadow-lg transition-transform hover:scale-105"
      >
        🛒 কার্ট ({cart.reduce((sum: number, item: any) => sum + item.quantity, 0)})
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col bg-zinc-900 p-6 text-white shadow-2xl border-l border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-amber-400">আপনার শপিং কার্ট</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-zinc-500 mt-10">আপনার কার্টটি খালি রয়েছে।</p>
              ) : (
                cart.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="font-semibold text-amber-400">{item.name}</h4>
                      <p className="text-sm text-zinc-400">৳{item.price} × {item.quantity}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-400 text-sm font-bold"
                    >
                      রিমুভ
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>মোট টাকা:</span>
                  <span className="text-amber-400">৳{totalAmount}</span>
                </div>

                {!isCheckout ? (
                  <button
                    onClick={() => setIsCheckout(true)}
                    className="w-full rounded-lg bg-amber-500 py-3 font-bold text-black transition hover:bg-amber-400"
                  >
                    অর্ডার কনফার্ম করুন (Checkout)
                  </button>
                ) : (
                  <form onSubmit={handleOrderSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="আপনার নাম"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded bg-zinc-800 p-2.5 text-white border border-zinc-700 text-sm outline-none focus:border-amber-400"
                      required
                    />
                    <input
                      type="text"
                      placeholder="মোবাইল নম্বর"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded bg-zinc-800 p-2.5 text-white border border-zinc-700 text-sm outline-none focus:border-amber-400"
                      required
                    />
                    <textarea
                      placeholder="সম্পূর্ণ ঠিকানা"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded bg-zinc-800 p-2.5 text-white border border-zinc-700 text-sm outline-none focus:border-amber-400"
                      rows={2}
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckout(false)}
                        className="w-1/2 rounded bg-zinc-700 py-2.5 text-white font-bold hover:bg-zinc-600 transition text-sm"
                      >
                        পেছনে
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-1/2 rounded bg-green-600 py-2.5 text-white font-bold hover:bg-green-500 transition text-sm disabled:opacity-50"
                      >
                        {loading ? 'অর্ডার হচ্ছে...' : 'অর্ডার প্লেস করুন'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}