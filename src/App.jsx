/*
Your overall code structure is correct, but the main issues that may cause a blank screen are as follows:
1. supabaseClient file casing issue.
2. Environment variables are not set correctly.
3. Database tables and code fields do not match.
4. Errors in fetch are not caught, causing React component crash.
5. className typos won't cause blank screen, only jsx errors will.

Detailed problem analysis
-----------------

[1] supabaseClient import casing issue
From the lint output you can see the error:
Err|Already included file name ... differs from file name ... only in casing.

For example, you import { supabase } from './supabaseClient';
But someone might name the file ./supaBaseClient.js, differing only in casing. This can easily go wrong on Windows/macOS. Make sure your file name and import casing match exactly. Recommend all-lowercase: "supabaseClient.js".

[2] Environment variable problem
If your .env.local does not contain VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY,
supabase cannot connect, fetch will hang, data is null, and nothing is rendered.

[3] Database structure problem
When you do
select(`
  *,
  reviews (*)
`)
If 'reviews' is not a foreign key/one-to-many to toilets, you'll get empty data.

[4] Exception not handled
If fetchToilets throws and is not caught, React will crash with a blank screen.

[5] React component not exported
You have default export, so no problem.

Debug suggestions
-----------------
- Open DevTools (F12), check for errors in console. Most blank screens are runtime exceptions, not "empty content".
- Check .env and supabaseClient path and content.
- Add more debug logs as needed.

The following code adds more logs (recommended for debugging):

*/

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, X, Send, User, Loader2 } from 'lucide-react';
import { supabase } from "./supabaseClient.js";

export default function App() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeToilet, setActiveToilet] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);

  const fetchToilets = async () => {
    try {
      setLoading(true);
      console.log("Trying to connect to database..."); // Updated to English

      const { data, error } = await supabase
        .from('toilets')
        .select('*, reviews(*)');
      if (error) throw error;

      console.log("Fetched data:", data); // Updated to English
      setToilets(data || []);
    } catch (error) {
      console.error('Fetch failed:', error.message); // Updated to English
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToilets();
  }, []);

  // 3. Submit review to database
  const handleSubmitReview = async () => {
    if (!newComment.trim() || !activeToilet) return;

    try {
      // Insert new review
      const { error: insertError } = await supabase
        .from('reviews')
        .insert([
          { 
            toilet_id: activeToilet.id, 
            comment: newComment, 
            stars: newRating 
          }
        ]);

      if (insertError) throw insertError;

      // On successful submission, refetch data to update UI
      await fetchToilets();
      setNewComment("");
      setNewRating(5);
      setActiveToilet(null);
    } catch (error) {
      alert('Failed to submit: ' + error.message); // Updated to English
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#CC0033]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4">
      <header className="max-w-2xl mx-auto mb-8 text-center pt-6">
        <h1 className="text-4xl font-black text-[#CC0033] tracking-tighter italic">RU FLUSH</h1>
        <p className="text-slate-500 font-medium">Find your oasis on Rutgers campus</p>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {toilets.map(toilet => (
          <div key={toilet.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{toilet.name}</h3>
                <p className="text-slate-400 text-sm">{toilet.campus} · {toilet.floor}</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-bold">
                <Star size={16} fill="currentColor" /> {toilet.avg_rating || "5.0"}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {toilet.reviews && toilet.reviews.length > 0 ? (
                toilet.reviews.slice(-2).map(r => (
                  <div key={r.id} className="bg-slate-50 p-3 rounded-2xl text-sm text-slate-600 flex gap-2">
                    <User size={16} className="text-slate-400 mt-1 shrink-0" />
                    <p>"{r.comment}"</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-300 text-sm italic">No reviews yet, be the first!</p>
              )}
            </div>

            <button 
              onClick={() => setActiveToilet(toilet)}
              className="w-full py-3 bg-[#CC0033] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95"
            >
              <MessageSquare size={18} /> Write a review / See all
            </button>
          </div>
        ))}
      </div>

      {activeToilet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] p-8 shadow-2xl relative animate-in slide-in-from-bottom duration-300">
            <button onClick={() => setActiveToilet(null)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2">{activeToilet.name}</h2>
            <p className="text-slate-400 mb-6 font-medium">How was your experience?</p>

            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} onClick={() => setNewRating(num)} className="transition-transform active:scale-90">
                  <Star 
                    size={32} 
                    fill={num <= newRating ? "#fbbf24" : "none"} 
                    className={num <= newRating ? "text-amber-400" : "text-slate-200"} 
                  />
                </button>
              ))}
            </div>

            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Was there toilet paper? Was the WiFi fast?"
              className="w-full h-32 bg-slate-50 rounded-2xl p-4 text-slate-700 border-none focus:ring-2 focus:ring-[#CC0033] transition-all resize-none mb-6"
            />

            <button 
              onClick={handleSubmitReview}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
            >
              <Send size={18} /> Submit my review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}