import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { es } from 'date-fns/locale'; // Spanish locale
import { ChevronLeft, ChevronRight, MoreHorizontal, Instagram, Facebook } from 'lucide-react';
import MediaPreview from './MediaPreview';

const CalendarView = ({ posts, onPostClick, onAddClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Helper to find posts for a day
  const getPostsForDay = (day) => {
    return posts.filter(post => isSameDay(new Date(post.date), day));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <h3 className="text-xl font-bold text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="flex bg-slate-800 rounded-xl p-1">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 text-xs font-bold text-slate-300 hover:text-white transition-colors">
            Hoy
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/50">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-950/30">
        {days.map((day, idx) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] p-2 border-r border-b border-slate-800/50 transition-colors relative group
                ${!isCurrentMonth ? 'bg-slate-950/80 text-slate-700' : 'bg-transparent text-slate-300 hover:bg-slate-900/50'}
              `}
            >
               {/* Date Number */}
               <div className={`text-xs font-bold mb-2 w-6 h-6 flex items-center justify-center rounded-full 
                 ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : ''}`}>
                 {format(day, 'd')}
               </div>

               {/* Posts List */}
               <div className="space-y-1">
                 {dayPosts.map((post) => (
                   <div 
                     key={post.id} 
                     onClick={() => onPostClick && onPostClick(post)}
                     className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-1.5 rounded-lg cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex items-center gap-2 group/post"
                   >
                     <div className={`w-1 h-6 rounded-full ${post.platform === 'instagram' ? 'bg-linear-to-tr from-yellow-500 to-purple-600' : 'bg-blue-600'}`}></div>
                     {post.image ? (
                        <MediaPreview src={post.image} className="w-6 h-6 rounded bg-black object-cover" />
                     ) : (
                        <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center"><MoreHorizontal size={12}/></div>
                     )}
                     <div className="overflow-hidden">
                       <p className="text-[10px] font-bold text-white truncate leading-tight">{post.caption || "Sin título"}</p>
                       <div className="flex gap-1 text-[9px] text-slate-500 items-center">
                          {post.platform === 'instagram' ? <Instagram size={8}/> : <Facebook size={8}/>}
                          <span>{format(new Date(post.date), 'HH:mm')}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               

              
               {/* Add Button (On Hover) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent bubbling if parent has onClick
                    onAddClick && onAddClick(day);
                  }}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-500 hover:text-white"
                  title="Crear contenido para este día"
                >
                  <span className="text-xl leading-none">+</span>
                </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
