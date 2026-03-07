import { useState, useRef, useEffect, useCallback } from "react";
import useResponsive from "../../hooks/useResponsive";

var API_BASE = import.meta.env.VITE_API_BASE || "https://suntrex-api-316868455348.europe-west1.run.app";

export default function ESignature({ orderId, onSigned, lang }) {
  var isFr = (lang || "fr") === "fr";
  var { isMobile } = useResponsive();
  var canvasRef = useRef(null);
  var [isDrawing, setIsDrawing] = useState(false);
  var [hasDrawn, setHasDrawn] = useState(false);
  var [submitting, setSubmitting] = useState(false);
  var [signed, setSigned] = useState(false);

  var canvasW = isMobile ? 300 : 420;
  var canvasH = isMobile ? 150 : 180;

  useEffect(function () {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [canvasW, canvasH]);

  var getPos = useCallback(function (e) {
    var canvas = canvasRef.current;
    var rect = canvas.getBoundingClientRect();
    var clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  var startDraw = useCallback(function (e) {
    e.preventDefault();
    var canvas = canvasRef.current;
    var ctx = canvas.getContext("2d");
    var pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
  }, [getPos]);

  var draw = useCallback(function (e) {
    if (!isDrawing) return;
    e.preventDefault();
    var canvas = canvasRef.current;
    var ctx = canvas.getContext("2d");
    var pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  var endDraw = useCallback(function () {
    setIsDrawing(false);
  }, []);

  function clearCanvas() {
    var canvas = canvasRef.current;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasW, canvasH);
    setHasDrawn(false);
  }

  function submit() {
    if (!hasDrawn || !canvasRef.current) return;
    setSubmitting(true);

    var signatureBase64 = canvasRef.current.toDataURL("image/png");

    fetch(API_BASE + "/api/delivery/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (localStorage.getItem("sb-access-token") || ""),
      },
      body: JSON.stringify({
        orderId: orderId,
        signature: signatureBase64,
        timestamp: new Date().toISOString(),
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setSigned(true);
        setSubmitting(false);
        if (onSigned) onSigned(data);
      })
      .catch(function () {
        // Still mark as signed locally even if API fails
        setSigned(true);
        setSubmitting(false);
        if (onSigned) onSigned({ success: true, offline: true });
      });
  }

  if (signed) {
    return (
      <div style={{
        background: "#ecfdf5", borderRadius: 12, border: "1px solid #d1fae5",
        padding: isMobile ? 20 : 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>&#x2705;</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#065f46", marginBottom: 4 }}>
          {isFr ? "Signature enregistree" : "Signature recorded"}
        </div>
        <div style={{ fontSize: 12, color: "#10b981" }}>
          {isFr ? "La livraison est confirmee." : "Delivery is confirmed."}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
      overflow: "hidden",
    }}>
      <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>&#x270D;&#xFE0F;</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontFamily: "'DM Sans', sans-serif" }}>
          {isFr ? "Signature de reception" : "Delivery signature"}
        </span>
      </div>

      <div style={{ padding: isMobile ? 16 : 20 }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
          {isFr ? "Signez dans le cadre ci-dessous pour confirmer la reception." : "Sign below to confirm delivery."}
        </div>

        {/* Canvas */}
        <div style={{
          border: "2px dashed #cbd5e1", borderRadius: 8,
          background: "#fafbfc", display: "flex", justifyContent: "center",
          padding: 4, marginBottom: 12, touchAction: "none",
        }}>
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={{
              width: canvasW, height: canvasH,
              cursor: "crosshair", borderRadius: 4,
              touchAction: "none",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={clearCanvas}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: "1px solid #e2e8f0", background: "#fff",
              color: "#64748b", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {isFr ? "Effacer" : "Clear"}
          </button>
          <button
            onClick={submit}
            disabled={!hasDrawn || submitting}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 8,
              border: "none",
              background: hasDrawn && !submitting ? "#10b981" : "#94a3b8",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: hasDrawn && !submitting ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {submitting ? "..." : (isFr ? "Valider la signature" : "Confirm signature")}
          </button>
        </div>
      </div>
    </div>
  );
}
