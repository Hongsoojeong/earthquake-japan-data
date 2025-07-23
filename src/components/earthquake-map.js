"use client"
import { useEffect, useRef } from "react"

export default function EarthquakeMap({ data, mapId, center, zoom, onEarthquakeSelect }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLeaflet = async () => {
      if (!window.L) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });

        // Leaflet이 완전히 로드될 때까지 대기
        while (typeof window.L === "undefined") {
          await new Promise((res) => setTimeout(res, 50));
        }
      }
    };

    const initMap = async () => {
      await loadLeaflet();

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = window.L.map(mapId).setView(center, zoom);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);


      const parsedData = data.map((earthquake) => ({
        ...earthquake,
        latitude: parseFloat(earthquake.lat),
        longitude: parseFloat(earthquake.lng),
        magnitude: parseFloat(earthquake.mag),
      }));

      parsedData.forEach((earthquake) => {
        const color =
          earthquake.magnitude >= 7 ? "#dc2626" :
          earthquake.magnitude >= 6 ? "#ea580c" :
          earthquake.magnitude >= 5 ? "#d97706" :
          "#65a30d";

        const radius = Math.max(earthquake.magnitude * 2, 4);

        const marker = window.L.circleMarker(
          [earthquake.latitude, earthquake.longitude],
          {
            color,
            fillColor: color,
            fillOpacity: 0.6,
            radius,
            weight: 2,
          }
        ).addTo(map);

        marker.on("click", () => {
          onEarthquakeSelect(earthquake);
        });

        marker.bindTooltip(`M${earthquake.magnitude} - ${earthquake.place || earthquake.location}`, {
          permanent: false,
          direction: "top",
        });
      });

      mapInstanceRef.current = map;

      console.log("Leaflet loaded?", typeof window.L !== "undefined");
      console.log("지도 생성 완료");
    };

    (async () => {
      await initMap();
    })();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data, mapId, center, zoom, onEarthquakeSelect]);

  return (
    <div className="mb-4">
      {/* 실제 지도가 표시될 영역 */}
      <div
        id={mapId}
        ref={mapRef}
        className="w-full h-80 rounded-lg border border-gray-200"
        style={{ minHeight: "320px" }} // 최소 높이 지정
      />

      {/* 지도 범례 (색상별 규모 설명) */}
      <div
        style={{
          marginTop: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          fontSize: "12px",
          color: "#6b7280",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#dc2626" }}></div>
          <span>M7.0+</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ea580c" }}></div>
          <span>M6.0-6.9</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#d97706" }}></div>
          <span>M5.0-5.9</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#65a30d" }}></div>
          <span>M5.0 미만</span>
        </div>
      </div>

      {/* 사용법 안내 */}
      <p className="text-center text-xs text-gray-500 mt-2">
        💡 지도의 원을 클릭하면 상세 정보를 볼 수 있습니다
      </p>
    </div>
  );
}
