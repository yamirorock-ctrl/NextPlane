import { useState, useEffect } from "react";
import { supabase, storeClient } from "../lib/supabase";
import { facebookService } from "../services/social/facebook"; // Update path if needed
import { instagramService } from "../services/social/instagram";
import { tiktokService } from "../services/social/tiktok";
import { whatsappService } from "../services/social/whatsapp";
import { renderVideo } from "../services/videoRenderer";
import { compressVideo } from "../services/videoCompression";
import { uploadMedia } from "../services/storage";
import {
  generateViralStrategy,
  generateCaption,
  generateHashtags,
} from "../services/ai";
import imageCompression from "browser-image-compression";
import { syncProductsFromFeed } from "../utils/productSync";

const DEFAULT_HOOKS = [
  "🛑 ¡Deja de hacer scroll! Tienes que ver esto.",
  "🤫 El secreto que las tiendas no quieren que sepas...",
  "Pov: Encontraste el regalo perfecto por menos de $50.",
];

export const useCreateStudio = ({
  products,
  setProducts,
  selectedProduct,
  setSelectedProduct,
  caption,
  setCaption,
  generatedHashtags,
  setGeneratedHashtags,
  videoScript,
  selectedHook,
  setSelectedHook,
  onGenerateScript,
  setCurrentStrategy,
  apiKey,
  onPageConnect,
  onSchedule,
  onAnalyzeImage,
  analyzingImage,
}) => {
  // Settings States
  const [uploading, setUploading] = useState(false);
  const [rendering, setRendering] = useState(false); // New Rendering State

  // Audio State
  const [customAudioUrl, setCustomAudioUrl] = useState(null);
  const [audioType, setAudioType] = useState("file"); // 'file' | 'url'
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [voiceoverConfig, setVoiceoverConfig] = useState(null); // New Voiceover State
  const [subtitles, setSubtitles] = useState([]); // Array of subtitle segments {id, text, start, end}

  const [syncing, setSyncing] = useState(false);
  const [editingImage, setEditingImage] = useState(null); // URL of image to edit
  const [showEditor, setShowEditor] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false); // Collapsed by default as requested
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Scheduling State
  const [scheduleMode, setScheduleMode] = useState("now"); // 'now', 'later'
  const [scheduledDate, setScheduledDate] = useState(""); // ISO string YYYY-MM-DDTHH:mm

  // Multi-Platform State
  const [targetPlatforms, setTargetPlatforms] = useState({
    instagram: true,
    facebook: false,
  });
  const [contentType, setContentType] = useState("photo"); // Default to photo

  const [hook, setHook] = useState("");
  const [audio, setAudio] = useState("");

  // Estados para IA
  const [selectedTone, setSelectedTone] = useState("Profesional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [trendingAudio, setTrendingAudio] = useState([]);
  const [hooksList, setHooksList] = useState(DEFAULT_HOOKS);

  const [loadingHooks, setLoadingHooks] = useState(false);
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // Facebook/Instagram Page Selection State
  const [pages, setPages] = useState([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [pendingAccessToken, setPendingAccessToken] = useState(null);

  // Brand Voice Presets (Local for now)
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_presets") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("ai_presets", JSON.stringify(savedPresets));
  }, [savedPresets]);

  // Sync Products from Feed helper
  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncProductsFromFeed();
      if (result.success) {
        alert(result.message);
        // Refresh products from Supabase
        const { data } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && typeof setProducts === "function") setProducts(data);
      } else {
        alert("Error: " + result.message);
      }
    } catch (e) {
      alert("Error syncing: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Load Trending Audio
  useEffect(() => {
    const loadAudio = async () => {
      try {
        const audioList = await tiktokService.getTrendingAudio();
        setTrendingAudio(audioList);
      } catch (e) {
        console.error("Error loading trending audio", e);
      }
    };
    loadAudio();

    // Fetch products logic was in App.jsx useEffect, but here we receive products as props.
    // But CreateStudio had a fetch logic? Let's check lines 480-519 in App.jsx.
    // Yes, CreateStudio fetches products on mount. So we should include it here if `products` is empty or just always fetch.
    // However, CreateStudio receives `products` and `setProducts` as props.
    // The previous implementation fetched inside CreateStudio. So we should keep it here.

    const fetchProducts = async () => {
      // Fetch both sources in parallel
      const [localRes, storeRes] = await Promise.all([
        supabase.from("products").select("*"),
        storeClient
          ? storeClient.from("products").select("*")
          : Promise.resolve({ data: [] }),
      ]);

      const allProducts = [];

      // Process Local
      if (localRes.error) {
        console.error("Local fetch error:", localRes.error);
      } else if (localRes.data) {
        allProducts.push(
          ...localRes.data.map((p) => ({
            ...p,
            isLocal: true,
            image_url: p.image_url || p.image_color,
          })),
        );
      }

      // Process External
      if (storeRes && storeRes.error) {
        console.error("Store fetch error:", storeRes.error);
      } else if (storeRes && storeRes.data) {
        const storeMapped = storeRes.data.map((p) => ({
          ...p,
          original_id: p.id,
          id: "store-" + p.id, // Client-side ID
          isLocal: false,
          image_url: p.image || p.image_url,
        }));
        allProducts.push(...storeMapped);
      }

      // Set state ONCE to avoid race conditions/duplicates
      // Only set if products prop is empty to allow App to control it?
      // Or just set it.
      if (typeof setProducts === "function") {
        setProducts(allProducts);
      }
    };

    // Only fetch if products are empty to avoid overwriting if passed?
    // The original code just ran fetchProducts() inside useEffect []
    fetchProducts();
  }, []); // Run once on mount

  // Auto-detect content type when product changes
  useEffect(() => {
    if (selectedProduct) {
      const isVideo =
        selectedProduct.type === "video" ||
        (selectedProduct.image_url &&
          (selectedProduct.image_url.match(/\.(mp4|webm|mov|ogg)$/i) ||
            selectedProduct.image_url.includes("video")));
      if (isVideo && contentType !== "video") setContentType("video");
      if (!isVideo && contentType !== "photo") setContentType("photo");
    }
  }, [selectedProduct?.id]);

  // Handle Facebook Auth Callback
  useEffect(() => {
    const checkAuth = async () => {
      const token = facebookService.handleAuthCallback();
      if (token) {
        console.log("Logged in with Facebook! Token caught.");
        setPendingAccessToken(token);

        try {
          const fetchedPages = await facebookService.getPages(token);
          if (fetchedPages.length === 0) {
            alert(
              "No se encontraron páginas de Facebook administradas por este usuario.",
            );
          } else {
            setPages(fetchedPages);
            setShowPageSelector(true);
          }
        } catch (error) {
          alert("Error fetching pages: " + error.message);
        }
      }
    };
    checkAuth();
  }, []);

  const handlePageSelect = async (page) => {
    const token = page.access_token || pendingAccessToken;
    localStorage.setItem("meta_access_token", token);
    localStorage.setItem("meta_page_id", page.id);
    localStorage.setItem("meta_page_name", page.name);

    if (onPageConnect) {
      onPageConnect(page);
    }

    try {
      const igUserId = await instagramService.getInstagramAccount(
        token,
        page.id,
      );
      if (igUserId) {
        localStorage.setItem("meta_instagram_id", igUserId);
        console.log("Found linked Instagram Account:", igUserId);
      } else {
        console.log("No linked Instagram Account found for this page.");
        localStorage.removeItem("meta_instagram_id");
      }

      setShowPageSelector(false);
      alert(
        `¡Conectado a ${page.name}!\n${igUserId ? "✅ Instagram Business vinculado también." : "⚠️ No se detectó Instagram vinculado."}`,
      );
    } catch (error) {
      console.error("Error checking Instagram:", error);
      setShowPageSelector(false);
      alert(
        `¡Conectado a ${page.name}!, pero hubo un error verificando Instagram.`,
      );
    }
  };

  const handleAnalyzeImage = () => {
    onAnalyzeImage && onAnalyzeImage();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);

      const processedFilesPromises = files.map(async (file) => {
        if (file.type.startsWith("video/")) {
          if (file.size > 50 * 1024 * 1024) {
            console.log(
              `Video grande detectado (${(file.size / 1024 / 1024).toFixed(1)}MB). Iniciando compresión automática...`,
            );
            try {
              const compressed = await compressVideo(file);
              if (compressed.size < file.size) {
                console.log(
                  `Video comprimido: ${(file.size / 1024 / 1024).toFixed(1)}MB -> ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
                );
                return compressed;
              } else {
                console.log(
                  "La compresión no redujo el tamaño, usando original.",
                );
                return file;
              }
            } catch (e) {
              console.warn("Error en compresión, subiendo original:", e);
              return file;
            }
          }
          return file;
        }

        if (file.type.startsWith("image/")) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: file.type,
            };
            const compressedFile = await imageCompression(file, options);
            console.log(
              `Compresión: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
            );
            return compressedFile;
          } catch (error) {
            console.warn("Fallo compresión, usando original:", error);
            return file;
          }
        }

        return file;
      });

      const filesToUpload = (await Promise.all(processedFilesPromises)).filter(
        (f) => f !== null,
      );

      if (filesToUpload.length === 0) {
        setUploading(false);
        return;
      }

      const uploadPromises = filesToUpload.map((file) => uploadMedia(file));
      const publicUrls = await Promise.all(uploadPromises);

      let thumbnail = publicUrls[0];
      const videoExtensions = [".mp4", ".webm", ".mov"];

      const isFirstVideo = videoExtensions.some((ext) =>
        publicUrls[0].toLowerCase().endsWith(ext),
      );
      if (isFirstVideo) {
        const firstImage = publicUrls.find(
          (url) =>
            !videoExtensions.some((ext) => url.toLowerCase().endsWith(ext)),
        );
        if (firstImage) {
          thumbnail = firstImage;
        }
      }

      const newProductData = {
        name:
          files.length > 1
            ? `Galería (${files.length} items)`
            : "Producto Personalizado",
        price: 0.0,
        category: "Carga Rápida",
        image_url: thumbnail,
        gallery: publicUrls,
        image_color: "bg-indigo-500/20",
      };

      const { data: savedProduct, error } = await supabase
        .from("products")
        .insert([newProductData])
        .select()
        .single();

      if (error) {
        console.error("Error saving product:", error);
        const customProduct = {
          id: "custom-" + Date.now(),
          ...newProductData,
          type: files[0].type.startsWith("video") ? "video" : "photo",
        };
        setProducts([customProduct, ...products]);
        setSelectedProduct(customProduct);
        alert(
          "Imagen subida pero no se pudo guardar en base de datos: " +
            error.message,
        );
      } else {
        const finalProduct = {
          ...savedProduct,
          isLocal: true,
          type: files[0].type.startsWith("video") ? "video" : "photo",
        };
        setProducts([finalProduct, ...products]);
        setSelectedProduct(finalProduct);
      }

      setContentType(files[0].type.startsWith("video") ? "video" : "photo");
    } catch (error) {
      alert("Error subiendo archivos: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (e, product) => {
    e.stopPropagation();
    if (!product.isLocal) return;

    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", product.id);

        if (error) throw error;

        setProducts((prevProducts) =>
          prevProducts.filter((p) => p.id !== product.id),
        );
        if (selectedProduct?.id === product.id) {
          setSelectedProduct(null);
        }
      } catch (err) {
        alert("Error eliminando producto: " + err.message);
      }
    }
  };

  const handleSaveUpdateProduct = async () => {
    if (!selectedProduct.name) return alert("Ponle un nombre al producto");

    const productData = {
      name: selectedProduct.name,
      price: parseFloat(selectedProduct.price) || 0,
      category: selectedProduct.category || "General",
      image_url: selectedProduct.image_url,
      gallery: selectedProduct.gallery || [],
    };

    try {
      let result;

      if (selectedProduct.id && typeof selectedProduct.id === "number") {
        // UPDATE
        const { data, error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", selectedProduct.id)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          result = data[0];
        } else {
          console.warn("Update returned no rows. Attempting Insert.");
          const ins = await supabase
            .from("products")
            .insert([productData])
            .select();

          if (ins.error) throw ins.error;
          result = ins.data[0];
        }

        alert("✅ ¡Producto Actualizado!");

        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id ? { ...result, isLocal: true } : p,
          ),
        );
      } else {
        // INSERT (Fresh save)
        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select();

        if (error) throw error;
        result = data[0];
        alert("✅ ¡Producto Guardado!");

        setProducts((prev) => [...prev, { ...result, isLocal: true }]);
      }

      setSelectedProduct({ ...result, isLocal: true });
    } catch (err) {
      alert("Error guardando: " + err.message);
    }
  };

  const handleImageEditorSave = async (file) => {
    setUploading(true);
    try {
      const newUrl = await uploadMedia(file);
      // Update selected product with new image
      if (typeof setSelectedProduct === "function") {
        setSelectedProduct((prev) => ({
          ...prev,
          image_url: newUrl,
        }));
      }
      setShowEditor(false);
      alert("✨ Imagen editada y guardada.");
    } catch (e) {
      alert("Error guardando imagen: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!selectedProduct) return;
    setRendering(true);
    try {
      const images =
        selectedProduct.gallery && selectedProduct.gallery.length > 0
          ? selectedProduct.gallery
          : [selectedProduct.image_url];

      const blob = await renderVideo({
        images,
        audioUrl: customAudioUrl,
        audioStartTime: audioStartTime,
        textOverlay: selectedHook,
        onProgress: (p) => console.log("Rendering:", p),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${(selectedProduct.name || "video").replace(/\s+/g, "-")}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      alert("🎥 Video descargado! Listo para subir a TikTok/Reels.");
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setRendering(false);
    }
  };

  const handleHookSelect = (h) => {
    if (hook === h) {
      setHook("");
      if (typeof setSelectedHook === "function") setSelectedHook("");
    } else {
      setHook(h);
      if (typeof setSelectedHook === "function") setSelectedHook(h);

      if (!caption && contentType === "photo") {
        setCaption(h + " ");
      }
    }
  };

  const handlePlatformToggle = (id) => {
    setTargetPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScheduleClick = async () => {
    if (!selectedProduct) {
      alert("Selecciona un producto primero");
      return;
    }

    if (scheduleMode === "later" && !scheduledDate) {
      alert("Selecciona una fecha y hora para programar.");
      return;
    }

    setUploading(true);
    let results = [];
    let errors = [];
    const isScheduled = scheduleMode === "later";
    const finalDate = isScheduled
      ? new Date(scheduledDate).toISOString()
      : new Date().toISOString();

    try {
      let finalCaption = caption;
      if (generatedHashtags && !finalCaption.includes(generatedHashtags)) {
        console.log("Auto-appending AI Hashtags...");
        finalCaption += "\n\n" + generatedHashtags;
      }

      let publicVideoUrl = null;

      if (contentType === "video") {
        try {
          console.log("🎥 Rendering Video for Publication...");
          const images =
            selectedProduct.gallery && selectedProduct.gallery.length > 0
              ? selectedProduct.gallery
              : [selectedProduct.image_url];

          const blob = await renderVideo({
            images,
            audioUrl: customAudioUrl,
            audioStartTime: audioStartTime,
            textOverlay: selectedHook,
            onProgress: (p) => console.log("Rendering Pkg:", p),
          });

          console.log("☁️ Uploading Video to Storage...");
          const videoFile = new File(
            [blob],
            `video-${selectedProduct.id}-${Date.now()}.webm`,
            { type: "video/webm" },
          );
          publicVideoUrl = await uploadMedia(videoFile);

          console.log("✅ Video Ready:", publicVideoUrl);
        } catch (renderError) {
          console.error("Video Pipeline Error:", renderError);
          alert("Error renderizando/subiendo video: " + renderError.message);
          setUploading(false);
          return;
        }
      }

      const postData = {
        caption: finalCaption,
        video:
          publicVideoUrl ||
          (contentType === "video" ? selectedProduct.image_url : null),
        image: selectedProduct.image_url,
        targetPlatforms: targetPlatforms,
        date: finalDate,
        product: selectedProduct,
      };

      if (isScheduled) {
        results.push("Programado (Simulado)");
      } else {
        console.log("🚀 Launching Multi-Platform Campaign...", targetPlatforms);

        if (targetPlatforms.instagram) {
          try {
            const token =
              localStorage.getItem("meta_page_access_token") ||
              localStorage.getItem("meta_access_token");
            const pageId = localStorage.getItem("meta_page_id");

            // Try getting IG ID again if missing
            let igUserId = localStorage.getItem("meta_instagram_id");
            if (!igUserId && token && pageId) {
              igUserId = await instagramService.getInstagramAccount(
                token,
                pageId,
              );
            }

            if (igUserId && token) {
              if (contentType === "video" && postData.video) {
                await instagramService.publishVideo(
                  token,
                  igUserId,
                  postData.video,
                  postData.caption,
                );
                results.push("Instagram Reels");
              } else if (
                selectedProduct.gallery &&
                selectedProduct.gallery.length > 1 &&
                contentType === "photo"
              ) {
                await instagramService.publishCarousel(
                  token,
                  igUserId,
                  selectedProduct.gallery,
                  postData.caption,
                );
                results.push("Instagram Carousel");
              } else {
                await instagramService.publishPhoto(
                  token,
                  igUserId,
                  selectedProduct.image_url,
                  postData.caption,
                );
                results.push("Instagram Post");
              }
            } else {
              throw new Error("No hay cuenta de Instagram vinculada.");
            }
          } catch (e) {
            console.error("IG Error:", e);
            errors.push(`Instagram: ${e.message}`);
          }
        }

        if (targetPlatforms.facebook) {
          try {
            const token =
              localStorage.getItem("meta_page_access_token") ||
              localStorage.getItem("meta_access_token");
            const pageId = localStorage.getItem("meta_page_id");

            if (pageId && token) {
              const mediaUrl =
                contentType === "video" && postData.video
                  ? postData.video
                  : selectedProduct.image_url;
              await facebookService.postToFacebook(
                postData.caption,
                mediaUrl,
                pageId,
                token,
              );
              results.push(`Facebook`);
            } else {
              throw new Error("No hay página de Facebook configurada.");
            }
          } catch (e) {
            console.error("FB Error:", e);
            errors.push(`Facebook: ${e.message}`);
          }
        }
      }

      if (targetPlatforms.whatsapp) {
        try {
          const link = whatsappService.getShareLink(
            postData.caption,
            selectedProduct.link,
          );
          if (window.electronAPI) {
            window.electronAPI.openExternal(link);
          } else {
            window.open(link, "_blank");
          }
          results.push("WhatsApp");
        } catch (e) {
          console.error("WhatsApp Error:", e);
          errors.push("WhatsApp: " + e.message);
        }
      }

      if (results.length > 0) {
        try {
          const dbPost = {
            product_id: selectedProduct.id,
            platform: Object.keys(targetPlatforms)
              .filter((k) => targetPlatforms[k])
              .join(","),
            content_type: contentType,
            image_url: postData.video || selectedProduct.image_url,
            caption: caption,
            scheduled_date: finalDate,
            status: isScheduled ? "scheduled" : "published",
          };
          if (supabase) {
            onSchedule({
              ...postData,
              product: selectedProduct,
              image: dbPost.image_url,
              date: finalDate,
            });
          }
        } catch (dbErr) {
          console.error("DB Save Error:", dbErr);
        }
      }

      setUploading(false);

      let message = "";
      if (isScheduled) {
        message = `📅 Post programado para: ${new Date(finalDate).toLocaleString()}`;
      } else {
        if (results.length > 0)
          message += `✅ Éxito en: ${results.join(", ")}\n`;
        if (errors.length > 0) message += `❌ Errores:\n${errors.join("\n")}`;
      }

      alert(message || "Selecciona al menos una plataforma.");
    } catch (e) {
      console.error("Critical Error:", e);
      setUploading(false);
      alert("Error crítico: " + e.message);
    }
  };

  const generateAIHooks = async () => {
    if (!selectedProduct || !apiKey) {
      alert("Selecciona un producto y configura tu API Key de Gemini");
      return;
    }

    setLoadingHooks(true);
    try {
      let effectiveTone = selectedTone;
      const presets = JSON.parse(localStorage.getItem("ai_presets") || "[]");
      const matchingPreset = presets.find((p) => p.name === selectedTone);

      if (matchingPreset) effectiveTone = matchingPreset.instructions;

      const hooks = await generateViralStrategy(
        selectedProduct,
        effectiveTone +
          (customInstructions ? `\nExtra: ${customInstructions}` : ""),
        apiKey,
      );

      if (hooks && hooks.length > 0) {
        setHooksList(hooks);
      } else {
        alert("No se pudieron generar hooks.");
      }
    } catch (error) {
      alert("Error generando hooks: " + error.message);
    } finally {
      setLoadingHooks(false);
    }
  };

  const generateAICaption = async () => {
    if (!selectedProduct || !apiKey) {
      alert("Necesitas una API Key para esto.");
      return;
    }
    setLoadingCaption(true);
    try {
      const newCaption = await generateCaption(
        selectedProduct,
        hook || "Oferta increíble",
        selectedTone,
        apiKey,
        caption,
      );
      setCaption(newCaption);
      // Auto generate tags
      generateAITags(newCaption);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoadingCaption(false);
    }
  };

  const generateAITags = async (contextCaption) => {
    setLoadingTags(true);
    try {
      const tags = await generateHashtags(
        contextCaption || caption,
        selectedProduct,
        apiKey,
      );
      setGeneratedHashtags(tags);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTags(false);
    }
  };

  return {
    state: {
      uploading,
      setUploading,
      rendering,
      setRendering,
      customAudioUrl,
      setCustomAudioUrl,
      audioType,
      setAudioType,
      audioStartTime,
      setAudioStartTime,
      audioDuration,
      setAudioDuration,
      voiceoverConfig,
      setVoiceoverConfig, // Export new state handle
      syncing,
      setSyncing,
      editingImage,
      setEditingImage,
      showEditor,
      setShowEditor,
      showCatalog,
      setShowCatalog,
      scheduleMode,
      setScheduleMode,
      scheduledDate,
      setScheduledDate,
      targetPlatforms,
      setTargetPlatforms,
      contentType,
      setContentType,
      hook,
      setHook,
      audio,
      setAudio,
      selectedTone,
      setSelectedTone,
      customInstructions,
      setCustomInstructions,
      trendingAudio,
      setTrendingAudio,
      hooksList,
      setHooksList,
      loadingHooks,
      setLoadingHooks,
      loadingCaption,
      setLoadingCaption,
      loadingTags,
      setLoadingTags,
      subtitles,
      setSubtitles,
      pages,
      setPages,
      showPageSelector,
      setShowPageSelector,
      savedPresets,
      setSavedPresets,
    },
    actions: {
      handleSync,
      handleAnalyzeImage,
      handleFileUpload,
      handleDeleteProduct,
      handleSaveUpdateProduct,
      handleImageEditorSave,
      handleDownloadVideo,
      handlePageSelect,
      handleHookSelect,
      handlePlatformToggle,
      handleScheduleClick,
      generateAIHooks,
      generateAICaption,
      generateAITags,
    },
  };
};
