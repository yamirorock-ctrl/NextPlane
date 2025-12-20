
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if(session?.user) fetchUserSettings(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if(session?.user) fetchUserSettings(session.user.id);
      else {
          setSettings(null);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserSettings = async (userId) => {
      try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if(error && error.code !== 'PGRST116') { // 116 is no rows
             console.error("Error fetching settings:", error);
          }
          
          // If no settings exist (maybe trigger failed?), create them locally or retry insert
          if(!data) {
             // Optional: Create empty settings row if missing
          }
          
          setSettings(data || {});
      } catch(e) {
          console.error("Critical fetching settings:", e);
      } finally {
          setLoading(false);
      }
  };
  
  const updateSettings = async (newSettings) => {
      if(!user) return;
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(newSettings)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if(error) throw error;
      setSettings(data);
      return data;
  };

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    session,
    loading,
    settings,
    updateSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
