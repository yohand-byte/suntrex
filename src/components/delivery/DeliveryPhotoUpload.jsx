import { useState, useRef } from "react";
import useResponsive from "../../hooks/useResponsive";
import { supabase } from "../../lib/supabase";

export default function DeliveryPhotoUpload({ orderId, stepKey, onUploaded }) {
  const { isMobile } = useResponsive();
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [gps, setGps] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const captureGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    captureGPS();
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
  };

  const handleUpload = async () => {
    if (!preview?.file || !supabase) return;
    setUploading(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();
      const filename = `${orderId}/${stepKey}_${Date.now()}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("delivery-photos")
        .upload(filename, preview.file, { contentType: preview.file.type });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("delivery-photos")
        .getPublicUrl(filename);

      if (onUploaded) {
        onUploaded({
          url: publicUrl,
          step: stepKey,
          timestamp,
          gps: gps || null,
          filename,
        });
      }

      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", padding: isMobile ? 12 : 16 }}>
      {!preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed #e2e8f0", borderRadius: 8, padding: isMobile ? 20 : 32,
            textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Prendre une photo</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>ou selectionner un fichier</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </div>
      ) : (
        <div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <img
              src={preview.url}
              alt="Preview"
              style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 8 }}
            />
            {/* Timestamp overlay */}
            <div style={{
              position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", color: "#fff",
              padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
            }}>
              {new Date().toLocaleString("fr-FR")}
              {gps && ` | ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 8, border: "none",
                background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: uploading ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif",
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "Upload..." : "Valider la photo"}
            </button>
            <button
              onClick={() => setPreview(null)}
              style={{
                padding: "10px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 13,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Refaire
            </button>
          </div>
        </div>
      )}
      {error && <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444" }}>Erreur : {error}</div>}
    </div>
  );
}
