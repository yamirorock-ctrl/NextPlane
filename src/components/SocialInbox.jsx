import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Search, 
  Star, 
  Archive, 
  MoreVertical, 
  Send,
  Tag,
  Clock,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { facebookService } from '../services/social/facebook';

// Helper for Relative Time
const timeAgo = (dateStr) => {
    if(!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if(seconds < 60) return 'Ahora';
    const minutes = Math.floor(seconds / 60);
    if(minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if(hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
};

const QUICK_REPLIES = [
  "Hola! En qué puedo ayudarte?",
  "El precio es por unidad.",
  "Hacemos envíos a todo el país 🚚",
  "Aceptamos todos los medios de pago 💳",
  "Gracias por contactarnos! 😊"
];

const SocialInbox = ({ pageId, accessToken, pageName, instagramId }) => {
  const [messages, setMessages] = useState([]);
  const [selectedSenderId, setSelectedSenderId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, star
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(() => localStorage.getItem('ai_auto_mode') === 'true');
  
  // Computed: Group flat messages by sender
  const conversations = React.useMemo(() => {
      const groups = {};
      messages.forEach(msg => {
          if(!groups[msg.sender_id]) {
              groups[msg.sender_id] = {
                  id: msg.sender_id, // Use sender_id as conversation key
                  user: msg.sender_name || `Usuario ${msg.sender_id.slice(0,4)}`,
                  platform: msg.platform,
                  avatar: msg.avatar_url,
                  lastMessage: msg,
                  messages: [],
                  unreadCount: 0
              };
          }
          groups[msg.sender_id].messages.push(msg);
          if(!msg.is_from_me && msg.status === 'unread') {
              groups[msg.sender_id].unreadCount++;
          }
      });
      
      // Sort messages within conversation
      Object.values(groups).forEach(g => {
          g.messages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
          g.lastMessage = g.messages[g.messages.length - 1]; // update last message
      });
      
      // Sort conversations by last message time
      return Object.values(groups).sort((a,b) => 
          new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
      );
  }, [messages]);

  const selectedConversation = conversations.find(c => c.id === selectedSenderId);

  // 1. Fetch Initial Data
  useEffect(() => {
    setLoading(true);
    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('inbox_messages')
            .select('*')
            .order('created_at', { ascending: true }); // Get all for timeline
        
        if(error) console.error("Error fetching inbox:", error);
        else setMessages(data || []);
        
        setLoading(false);
    };
    fetchMessages();

    // 2. Realtime Subscription
    const channel = supabase
        .channel('inbox_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_messages' }, payload => {
            console.log("New Message!", payload.new);
            setMessages(prev => [...prev, payload.new]);
            // Optional: Play Sound
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inbox_messages' }, payload => {
             setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // 3. Client-Side Profile Fetching (Repair unknown names)
  useEffect(() => {
     if(!accessToken) return;
     
     const fetchMissingProfiles = async () => {
         // Find senders with default names "Usuario XXX" or missing avatar
         const unknownSenders = conversations.filter(c => 
             c.user.startsWith("Usuario ") && !c.user.includes(" ") // weak check? Better: !c.avatar
             || !c.avatar
         );
         
         const uniqueUnknowns = [...new Set(unknownSenders.map(c => c.id))];
         if(uniqueUnknowns.length === 0) return;

         console.log("🔍 Fetching profiles for:", uniqueUnknowns);

         for(const senderId of uniqueUnknowns) {
             try {
                // Determine fields based on platform of the conversation
                const convo = conversations.find(c => c.id === senderId);
                const isInsta = convo?.platform === 'instagram';
                const fields = isInsta ? 'name,profile_pic' : 'first_name,last_name,profile_pic';
                
                const url = `https://graph.facebook.com/v18.0/${senderId}?fields=${fields}&access_token=${accessToken}`;
                const res = await fetch(url);
                const data = await res.json();
                
                if(data.id) {
                    const name = data.name || `${data.first_name} ${data.last_name}`;
                    const pic = data.profile_pic;
                    
                    console.log("✅ Resolved:", name);
                    
                    // Update Supabase
                    const { error } = await supabase
                        .from('inbox_messages')
                        .update({ sender_name: name, avatar_url: pic })
                        .eq('sender_id', senderId);
                        
                    if(error) console.error("Error updating profile in DB:", error);
                    
                    // Update Local State immediately
                    setMessages(prev => prev.map(m => 
                        m.sender_id === senderId ? { ...m, sender_name: name, avatar_url: pic } : m
                    ));
                }
             } catch(err) {
                 console.error("Failed to fetch profile for", senderId, err);
             }
         }
     };
     
     // Debounce slightly to avoid spamming on initial load
     const timer = setTimeout(fetchMissingProfiles, 2000);
     return () => clearTimeout(timer);
  }, [conversations.length, accessToken]); // Re-run when new consvos appear

  const handleSendMessage = async (e) => {
      e.preventDefault();
      if(!replyText.trim() || !selectedSenderId) return;

      const optimisticMsg = {
          sender_id: selectedSenderId,
          text: replyText,
          is_from_me: true,
          platform: selectedConversation.platform,
          created_at: new Date().toISOString(),
          status: 'read',
          ai_response_status: 'manual' // By human
      };

      // Optimistic UI for immediate feel (waiting for DB subscription to confirm)
      // Actually, subscription is fast enough, but let's clear input immediately
      setReplyText('');

      try {
          const { error } = await supabase.from('inbox_messages').insert([optimisticMsg]);
          if(error) throw error;
          

          
          // 2. Send to Meta API
          // We use the props passed to this component
          const settings = {
            metaPageAccessToken: accessToken || localStorage.getItem('meta_page_access_token'),
            metaPageId: pageId || localStorage.getItem('meta_page_id'),
            metaInstagramId: instagramId || localStorage.getItem('meta_instagram_id')
          };

          console.log("🚀 Sending to Meta:", { platform: selectedConversation.platform, id: selectedSenderId, text: replyText });

          await facebookService.sendReply(
             selectedConversation.platform,
             selectedSenderId,
             replyText,
             settings
          );

      } catch(err) {
          alert("Error enviando: " + err.message);
      }
  };

  const handleDeleteMessage = async (msgId) => {
      if (!window.confirm("¿Estás seguro de que deseas eliminar este mensaje de forma permanente?")) return;

      try {
          const { error } = await supabase
              .from('inbox_messages')
              .delete()
              .eq('id', msgId);
          
          if (error) throw error;

          // Optimistic update (though realtime might also catch it, it's safer to remove locally too)
          setMessages(prev => prev.filter(m => m.id !== msgId));

      } catch (err) {
          console.error("Error deleting message:", err);
          alert("Error al eliminar: " + err.message);
      }
  };

  const handleDeleteConversation = async (senderId) => {
      if (!window.confirm("¿Estás seguro de que deseas eliminar TODA la conversación con este usuario? Esta acción no se puede deshacer.")) return;

      try {
          const { error } = await supabase
              .from('inbox_messages')
              .delete()
              .eq('sender_id', senderId);
          
          if (error) throw error;

          setMessages(prev => prev.filter(m => m.sender_id !== senderId));
          if (selectedSenderId === senderId) setSelectedSenderId(null);

      } catch (err) {
          console.error("Error deleting conversation:", err);
          alert("Error al eliminar conversación: " + err.message);
      }
  };

  const filteredConversations = conversations.filter(c => {
      if(filter === 'unread') return c.unreadCount > 0;
      return true;
  });

  return (
    <div className="flex h-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative">
      
      {/* 1. Message List (Sidebar) */}
      <div className={`w-full md:w-1/3 border-r border-slate-800 flex flex-col ${selectedSenderId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 pt-6">
           <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <MessageCircle className="text-indigo-500" /> Inbox Unificado
               </h2>
               
               <div className="flex items-center gap-4">
                 {/* Auto Mode Toggle */}
                 <button 
                    onClick={() => {
                        const newVal = !autoMode;
                        setAutoMode(newVal);
                        localStorage.setItem('ai_auto_mode', newVal);
                        if(newVal) alert("🤖 ¡Modo Automático ACTIVADO!\n\nLa IA responderá mensajes de precios y stock automáticamente usando tu catálogo.");
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${autoMode ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                 >
                    <span className="text-xs font-bold">{autoMode ? '🤖 IA AUTO: ON' : '🤖 IA AUTO: OFF'}</span>
                 </button>
                 
                 {loading && <div className="animate-spin text-indigo-400"><CheckCircle2 size={16}/></div>}
               </div>
           </div>
           
           {/* Filters */}
           <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
             <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Todos</button>
             <button onClick={() => setFilter('unread')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === 'unread' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Sin Leer</button>
           </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {loading || conversations.length === 0 ? (
             <div className="p-10 text-center text-slate-500">
                {loading ? "Conectando..." : "Esperando mensajes..."}
             </div>
           ) : (
             filteredConversations.map(conv => (
             <div 
               key={conv.id} 
               onClick={() => setSelectedSenderId(conv.id)}
               className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors relative group ${selectedSenderId === conv.id ? 'bg-slate-800/80 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
             >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Eliminar conversación"
                >
                    <Trash2 size={14} />
                </button>

                <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${conv.platform === 'instagram' ? 'bg-linear-to-tr from-yellow-500 to-purple-600' : conv.platform === 'whatsapp' ? 'bg-green-500' : 'bg-blue-600'} overflow-hidden`}>
                         {conv.platform === 'instagram' ? <Instagram size={14} /> : conv.platform === 'whatsapp' ? <MessageCircle size={14} /> : <Facebook size={14} />}
                      </div>
                      <span className={`font-bold text-sm ${conv.unreadCount > 0 ? 'text-white' : 'text-slate-400'}`}>{conv.user}</span>
                   </div>
                   <span className="text-[10px] text-slate-500 whitespace-nowrap pr-4">{timeAgo(conv.lastMessage.created_at)}</span>
                </div>
                <p className={`text-xs line-clamp-2 ${conv.unreadCount > 0 ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
                   {conv.lastMessage.is_from_me ? `Tú: ${conv.lastMessage.text}` : conv.lastMessage.text}
                </p>
                {conv.unreadCount > 0 && (
                   <div className="mt-2 flex">
                      <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                        {conv.unreadCount} nuevos
                      </span>
                   </div>
                )}
             </div>
           )))}
        </div>
      </div>

      {/* 2. Conversation View (Main) */}
      <div className={`w-full md:w-2/3 flex flex-col bg-slate-950 ${!selectedSenderId ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
               <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedSenderId(null)} className="md:hidden text-slate-400">
                    <ArrowLeft size={20}/> 
                  </button>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${selectedConversation.platform === 'instagram' ? 'bg-linear-to-tr from-yellow-500 to-purple-600' : selectedConversation.platform === 'whatsapp' ? 'bg-green-500' : 'bg-blue-600'}`}>
                         {selectedConversation.platform === 'instagram' ? <Instagram size={20} /> : selectedConversation.platform === 'whatsapp' ? <MessageCircle size={20} /> : <Facebook size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedConversation.user}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(selectedConversation.lastMessage.created_at)}</span>
                    </div>
                  </div>
               </div>
               
               {/* Controls */}
               <div className="flex items-center gap-2">
                 <button 
                    title="Pausar IA"
                    className="p-2 hover:bg-slate-800 rounded-lg text-amber-500 border border-amber-500/20 bg-amber-500/10"
                    onClick={() => alert("¡IA Pausada para este chat! (Simulado)")}
                 >
                    <AlertCircle size={18} />
                 </button>
               </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50">
               {selectedConversation.messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.is_from_me ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-[70%] rounded-2xl p-4 text-sm ${msg.is_from_me ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                       <p>{msg.text}</p>
                       <div className="flex justify-end items-center gap-2 mt-1">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteMessage(msg.id);
                             }}
                             className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                             title="Eliminar mensaje"
                           >
                              <Trash2 size={12} />
                           </button>
                           <p className={`text-[10px] ${msg.is_from_me ? 'text-indigo-200' : 'text-slate-500'}`}>{timeAgo(msg.created_at)}</p>
                           {msg.is_from_me && msg.status === 'read' && <CheckCircle2 size={10} className="text-emerald-400"/>}
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
               <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                 {QUICK_REPLIES.map((reply, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setReplyText(reply)}
                     className="whitespace-nowrap px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-indigo-400 hover:border-indigo-500 transition-colors"
                   >
                     {reply}
                   </button>
                 ))}
               </div>
               
               <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe una respuesta (la IA se detendrá)..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg disabled:opacity-50"
                    disabled={!replyText.trim()}
                  >
                    <Send size={16} />
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
             <MessageCircle size={64} className="mb-4 text-slate-700" />
             <p>Selecciona un mensaje para responder</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ArrowLeft = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

export default SocialInbox;

