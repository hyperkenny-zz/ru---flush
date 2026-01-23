import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, X, Send, User, Loader2, MapPin, Search } from 'lucide-react';
import { supabase } from "./supabaseClient.js";

export default function App() {
  // --- 状态管理 ---
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeToilet, setActiveToilet] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [selectedCampus, setSelectedCampus] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");

  // --- 数据获取 ---
  const fetchToilets = async () => {
    try {
      setLoading(true);
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

  // --- 提交评价 ---
  const handleSubmitReview = async () => {
    if (!newComment.trim() || !activeToilet) return;

    try {
      const { error: insertError } = await supabase
        .from('reviews')
        .insert([{ 
          toilet_id: activeToilet.id, 
          comment: newComment, 
          stars: newRating 
        }]);

      if (insertError) throw insertError;

      // 重新拉取数据（触发器会自动更新平均分和计数）
      await fetchToilets();
      setNewComment("");
      setNewRating(5);
      setActiveToilet(null);
    } catch (error) {
      alert('Submit failed: ' + error.message);
    }
  };

  // --- 综合过滤逻辑 ---
  const filteredToilets = toilets.filter(t => {
    const matchesCampus = selectedCampus === 'All' || t.campus === selectedCampus;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCampus && matchesSearch;
  });

  // --- 加载状态渲染 ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#CC0033] mb-4" size={48} />
      <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Loading Scarlet Oases...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* 1. 顶部红色装饰条 */}
      <div className="h-1.5 bg-[#CC0033] w-full fixed top-0 z-50"></div>

      {/* 2. Header & 搜索导航 */}
      <div className="bg-white border-b-4 border-[#CC0033]/5 sticky top-1.5 z-30 shadow-sm">
        <header className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* 校徽与标题 */}
            <div className="flex items-center gap-5">
              <div className="p-2.5 bg-[#CC0033] rounded-2xl shadow-xl shadow-red-200 shrink-0">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b6/Rutgers_Scarlet_Knights_logo.svg" 
                  alt="RU Logo" 
                  className="w-10 h-10 brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-4xl font-black text-[#CC0033] tracking-tighter italic leading-none">RU FLUSH</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-1.5">Official Campus Navigator</p>
              </div>
            </div>
            
            {/* 搜索框 */}
            <div className="relative group flex-1 max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#CC0033] transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Find a building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#CC0033]/10 rounded-2xl focus:ring-0 transition-all font-bold text-slate-700 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* 校区切换选项卡 */}
          <div className="flex gap-3 mt-10 overflow-x-auto no-scrollbar pb-2">
            {['All', 'College Ave', 'Busch', 'Livingston', 'Cook/Douglass'].map(campus => {
              const count = toilets.filter(t => campus === 'All' || t.campus === campus).length;
              return (
                <button 
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-3 border-2 ${
                    selectedCampus === campus 
                    ? 'bg-[#CC0033] text-white border-[#CC0033] shadow-xl shadow-red-100 scale-105' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {campus}
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] ${
                    selectedCampus === campus ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </header>
      </div>

      {/* 3. 主内容区域：响应式网格 */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredToilets.map(toilet => (
            <div key={toilet.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-50 group hover:-translate-y-2 transition-all duration-500">
              
              {/* 大楼照片封面 */}
              <div className="relative h-60 w-full overflow-hidden">
                <img 
                  src={toilet.photo_url || "https://images.unsplash.com/photo-1565610222536-ef125c59da2e?q=80&w=1000"} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt={toilet.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-7">
                  <span className="bg-[#CC0033] text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-[0.15em] shadow-lg">
                    {toilet.campus}
                  </span>
                </div>
              </div>

              {/* 大楼信息 */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-slate-800 leading-tight italic pr-4">
                    {toilet.name}
                  </h3>
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1.5 text-amber-500 font-black text-2xl">
                      <Star size={24} fill="currentColor" /> {toilet.avg_rating || "0.0"}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase mt-1">
                      {toilet.review_count || 0} Reviews
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 mb-8 font-bold text-sm">
                  <MapPin size={16} className="text-[#CC0033]" />
                  <span>{toilet.floor}</span>
                </div>

                {/* 最新评论预览 */}
                <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 relative min-h-[90px] flex flex-col justify-center">
                  <span className="absolute -top-3 left-6 bg-white px-3 py-1 rounded-full text-[9px] font-black text-slate-300 border border-slate-100 uppercase tracking-widest">Recent Buzz</span>
                  {toilet.reviews && toilet.reviews.length > 0 ? (
                    <p className="text-slate-600 text-sm font-medium italic leading-relaxed line-clamp-2">
                      "{toilet.reviews[toilet.reviews.length - 1].comment}"
                    </p>
                  ) : (
                    <p className="text-slate-300 text-sm italic text-center font-medium">Be the first to rate this oasis!</p>
                  )}
                </div>

                <button 
                  onClick={() => setActiveToilet(toilet)}
                  className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-[#CC0033] transition-all shadow-xl hover:shadow-red-200 active:scale-95 uppercase tracking-widest"
                >
                  <MessageSquare size={18} /> Rate Experience
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 搜索结果为空时的处理 */}
        {filteredToilets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <Search size={60} className="text-slate-100 mb-6" />
            <p className="text-slate-400 font-black text-xl italic">No oases found here...</p>
            <button 
              onClick={() => {setSelectedCampus('All'); setSearchQuery('');}} 
              className="mt-6 px-8 py-3 bg-[#CC0033] text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Show All Buildings
            </button>
          </div>
        )}
      </main>

      {/* 4. 评价模态框 (Slide-up) */}
      {activeToilet && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-t-[3.5rem] md:rounded-[3.5rem] p-10 shadow-2xl relative animate-in slide-in-from-bottom duration-500">
            <div className="absolute top-0 left-0 w-full h-3 bg-[#CC0033]" />
            
            <button onClick={() => setActiveToilet(null)} className="absolute right-8 top-10 text-slate-300 hover:text-slate-500 p-2 bg-slate-50 rounded-full transition-colors">
              <X size={28} />
            </button>

            <h2 className="text-3xl font-black text-slate-800 mb-1 italic pr-12">{activeToilet.name}</h2>
            <p className="text-slate-400 mb-10 font-black uppercase tracking-[0.2em] text-[10px]">Scarlet Knight's Verdict</p>

            {/* 星级选择 */}
            <div className="flex gap-4 mb-10 justify-center">
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} onClick={() => setNewRating(num)} className="transition-transform active:scale-50 hover:scale-110">
                  <Star 
                    size={48} 
                    fill={num <= newRating ? "#fbbf24" : "none"} 
                    className={num <= newRating ? "text-amber-400" : "text-slate-100"} 
                  />
                </button>
              ))}
            </div>

            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Was it clean? Is there enough toilet paper? How's the scent?"
              className="w-full h-44 bg-slate-50 rounded-[2.5rem] p-8 text-slate-700 border-2 border-transparent focus:border-[#CC0033]/10 focus:bg-white focus:ring-0 transition-all resize-none mb-10 font-medium placeholder:text-slate-200"
            />

            <button 
              onClick={handleSubmitReview}
              className="w-full py-6 bg-[#CC0033] text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-red-700 transition-all active:scale-95 shadow-2xl shadow-red-100 uppercase tracking-[0.2em]"
            >
              <Send size={20} /> Post Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}