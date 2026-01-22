import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, X, Send, User, Loader2, MapPin } from 'lucide-react';
import { supabase } from "./supabaseClient.js";

export default function App() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeToilet, setActiveToilet] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [selectedCampus, setSelectedCampus] = useState('All');

  const fetchToilets = async () => {
    try {
      setLoading(true);
      console.log("Fetching from Supabase...");
      
      // 抓取所有厕所和它们关联的所有评价
      const { data, error } = await supabase
        .from('toilets')
        .select('*, reviews(*)');

      if (error) throw error;
      setToilets(data || []);
    } catch (error) {
      console.error('Fetch failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToilets();
  }, []);

  // 提交评价：数据库触发器会自动计算 avg_rating 和 review_count
  const handleSubmitReview = async () => {
    if (!newComment.trim() || !activeToilet) return;

    try {
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

      // 刷新数据，看到最新的平均分和评论数
      await fetchToilets();
      setNewComment("");
      setNewRating(5);
      setActiveToilet(null);
    } catch (error) {
      alert('Submit failed: ' + error.message);
    }
  };

  // 根据选中的校区进行过滤
  const filteredToilets = selectedCampus === 'All' 
    ? toilets 
    : toilets.filter(t => t.campus === selectedCampus);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#CC0033]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 pb-20">
      {/* Header */}
      <header className="max-w-2xl mx-auto mb-8 text-center pt-8">
        <h1 className="text-5xl font-black text-[#CC0033] tracking-tighter italic mb-2">RU FLUSH</h1>
        <p className="text-slate-500 font-medium italic">Finding your oasis on Rutgers campus</p>
      </header>

      {/* Campus Selector Tab */}
      <div className="max-w-2xl mx-auto flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {['All', 'College Ave', 'Busch', 'Livingston', 'Cook/Douglass'].map(campus => (
          <button 
            key={campus}
            onClick={() => setSelectedCampus(campus)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              selectedCampus === campus 
              ? 'bg-[#CC0033] text-white shadow-lg shadow-red-200 scale-105' 
              : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {campus}
          </button>
        ))}
      </div>

      {/* Toilet List */}
      <div className="max-w-2xl mx-auto space-y-6">
        {filteredToilets.length > 0 ? (
          filteredToilets.map(toilet => (
            <div key={toilet.id} className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-100 transition-transform hover:scale-[1.01]">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">{toilet.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                    <MapPin size={14} />
                    <span>{toilet.campus} · {toilet.floor}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full font-black text-lg">
                    <Star size={18} fill="currentColor" /> {toilet.avg_rating || "0.0"}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                    {toilet.review_count || 0} REVIEWS
                  </p>
                </div>
              </div>

              {/* Latest 2 Reviews */}
              <div className="space-y-3 mb-6">
                {toilet.reviews && toilet.reviews.length > 0 ? (
                  toilet.reviews.slice(-2).reverse().map(r => (
                    <div key={r.id} className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 flex gap-3 border border-slate-100">
                      <User size={16} className="text-slate-300 mt-1 shrink-0" />
                      <p className="leading-relaxed font-medium italic">"{r.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-300 text-sm italic text-center py-2">No reviews yet, be the first hero!</p>
                )}
              </div>

              <button 
                onClick={() => setActiveToilet(toilet)}
                className="w-full py-4 bg-[#CC0033] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95 shadow-md shadow-red-100"
              >
                <MessageSquare size={18} /> Rate this oasis
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No toilets found in this campus yet.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {activeToilet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl relative animate-in slide-in-from-bottom duration-300">
            <button onClick={() => setActiveToilet(null)} className="absolute right-8 top-8 text-slate-300 hover:text-slate-500 transition-colors">
              <X size={28} />
            </button>

            <h2 className="text-3xl font-black mb-1">{activeToilet.name}</h2>
            <p className="text-slate-400 mb-8 font-medium italic">Share your experience with fellow Knights</p>

            <div className="flex gap-3 mb-8 justify-center">
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} onClick={() => setNewRating(num)} className="transition-transform active:scale-75">
                  <Star 
                    size={40} 
                    fill={num <= newRating ? "#fbbf24" : "none"} 
                    className={num <= newRating ? "text-amber-400" : "text-slate-100"} 
                  />
                </button>
              ))}
            </div>

            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Was it clean? Plenty of soap? Fast Wi-Fi?"
              className="w-full h-36 bg-slate-50 rounded-3xl p-5 text-slate-700 border-2 border-transparent focus:border-[#CC0033] focus:ring-0 transition-all resize-none mb-8 font-medium"
            />

            <button 
              onClick={handleSubmitReview}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95"
            >
              <Send size={20} /> SUBMIT REVIEW
            </button>
          </div>
        </div>
      )}
    </div>
  );
}