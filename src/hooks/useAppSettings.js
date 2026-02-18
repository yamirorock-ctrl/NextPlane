import { useState, useEffect } from "react";

export const useAppSettings = (settings, updateSettings) => {
  const [apiKey, setApiKey] = useState("");
  const [metaAppId, setMetaAppId] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaPageName, setMetaPageName] = useState("");
  const [metaPageAccessToken, setMetaPageAccessToken] = useState("");
  const [metaInstagramId, setMetaInstagramId] = useState("");
  const [tiktokKey, setTiktokKey] = useState("");
  const [tiktokSecret, setTiktokSecret] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");

  // 1. Load Settings from DB when ready
  useEffect(() => {
    if (settings) {
      try {
        if (settings.gemini_api_key) setApiKey(settings.gemini_api_key);
        if (settings.meta_app_id) {
          setMetaAppId(settings.meta_app_id);
          localStorage.setItem("meta_app_id", settings.meta_app_id);
        }
        if (settings.meta_app_secret) {
          setMetaAppSecret(settings.meta_app_secret);
          localStorage.setItem("meta_app_secret", settings.meta_app_secret);
        }

        if (settings.meta_access_token) {
          setMetaAccessToken(settings.meta_access_token);
          localStorage.setItem("meta_access_token", settings.meta_access_token);
        }

        if (settings.meta_page_id) {
          setMetaPageId(settings.meta_page_id);
          localStorage.setItem("meta_page_id", settings.meta_page_id);
        }

        if (settings.meta_page_name) {
          setMetaPageName(settings.meta_page_name);
          localStorage.setItem("meta_page_name", settings.meta_page_name);
        }

        if (settings.meta_page_access_token) {
          setMetaPageAccessToken(settings.meta_page_access_token);
          localStorage.setItem(
            "meta_page_access_token",
            settings.meta_page_access_token,
          );
        }

        if (settings.meta_instagram_id) {
          setMetaInstagramId(settings.meta_instagram_id);
          localStorage.setItem("meta_instagram_id", settings.meta_instagram_id);
        }

        if (settings.tiktok_client_key)
          setTiktokKey(settings.tiktok_client_key);
        if (settings.tiktok_client_secret)
          setTiktokSecret(settings.tiktok_client_secret);
        if (settings.ai_knowledge_base)
          setKnowledgeBase(settings.ai_knowledge_base);
      } catch (err) {
        console.error("Error syncing settings to storage:", err);
      }
    }
  }, [settings]);

  // Helper to save specific field
  const saveField = (field, value) => {
    // Optimistic update logic could go here if we moved 'settings' state entirely to hook
    if (updateSettings) {
      updateSettings({ [field]: value }).catch(console.error);
    }
  };

  return {
    apiKey,
    setApiKey,
    metaAppId,
    setMetaAppId,
    metaAppSecret,
    setMetaAppSecret,
    metaAccessToken,
    setMetaAccessToken,
    metaPageId,
    setMetaPageId,
    metaPageName,
    setMetaPageName,
    metaPageAccessToken,
    setMetaPageAccessToken,
    metaInstagramId,
    setMetaInstagramId,
    tiktokKey,
    setTiktokKey,
    tiktokSecret,
    setTiktokSecret,
    knowledgeBase,
    setKnowledgeBase,
    saveField,
  };
};
