import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { facebookService } from "../services/social/facebook";
import { instagramService } from "../services/social/instagram";

export const usePostScheduler = (posts, setPosts, settings) => {
  const processingRef = useRef(new Set()); // Track IDs being processed to avoid dupes

  useEffect(() => {
    // Check every 30 seconds
    const interval = setInterval(async () => {
      const now = new Date();

      // Filter posts that are scheduled, due, and not already being processed
      const duePosts = posts.filter(
        (p) =>
          p.status === "scheduled" &&
          new Date(p.date) <= now &&
          !processingRef.current.has(p.id),
      );

      if (duePosts.length === 0) return;

      console.log(
        `⏰ Scheduler: Found ${duePosts.length} posts due for publishing.`,
      );

      for (const post of duePosts) {
        processingRef.current.add(post.id);
        try {
          console.log(`🚀 Publishing Post ${post.id} to ${post.platform}...`);

          let result;
          const token =
            settings.meta_page_access_token || settings.meta_access_token;
          const pageId = settings.meta_page_id;

          if (!token || !pageId) {
            throw new Error("Missing credentials for auto-publish.");
          }

          // PUBLISH LOGIC
          if (post.platform === "facebook") {
            result = await facebookService.postToFacebook(
              post.caption,
              post.image_url, // Assuming URL is valid/public or base64
              pageId,
              token,
            );
          } else if (post.platform === "instagram") {
            // Instagram publishing logic (might need specific IG ID)
            const igId = settings.meta_instagram_id;
            if (!igId) throw new Error("No Instagram linked.");
            result = await instagramService.publishMedia(
              igId,
              post.image_url,
              post.caption,
              token,
            );
          }

          if (result && (result.id || result.success)) {
            // SUCCESS
            console.log(`✅ Post ${post.id} published! ID: ${result.id}`);

            // Update DB
            await supabase
              .from("posts")
              .update({
                status: "published",
                published_at: new Date().toISOString(),
                platform_post_id: result.id,
              })
              .eq("id", post.id);

            // Update Local State
            setPosts((prev) =>
              prev.map((p) =>
                p.id === post.id
                  ? {
                      ...p,
                      status: "published",
                      published_at: new Date().toISOString(),
                    }
                  : p,
              ),
            );

            // Show Notification (Native if available)
            if (Notification.permission === "granted") {
              new Notification("Post Publicado Automáticamente", {
                body: `Tu post en ${post.platform} ha sido lanzado con éxito.`,
                icon: post.image_url,
              });
            }
          }
        } catch (err) {
          console.error(`❌ Failed to auto-publish post ${post.id}:`, err);

          // Update DB to Failed
          await supabase
            .from("posts")
            .update({
              status: "failed",
              error_message: err.message,
            })
            .eq("id", post.id);

          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? { ...p, status: "failed", error_message: err.message }
                : p,
            ),
          );
        } finally {
          processingRef.current.delete(post.id);
        }
      }
    }, 30000); // 30s check

    return () => clearInterval(interval);
  }, [posts, settings]);
};
