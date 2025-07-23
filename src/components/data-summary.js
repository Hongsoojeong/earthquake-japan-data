
/* 
지진 데이터 요약 정보를 보여주는 컴포넌트 
(1) maxMagnitude : 최대 규모
(2) avgMagnitude : 평균 규모
(3) avgDepth : 평균 깊이
*/

"use client"
import { useState } from "react"


function DataSummary({ data, type }) {


  // 선택된 지진 목록을 보여주는 상태
  const [selectedEarthquakes, setSelectedEarthquakes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState("")


  const maxMagnitude = Math.max(...data.map((d) => Number(d.mag) || 0))
  const avgMagnitude = data.reduce((sum, d) => sum + (Number(d.mag) || 0), 0) / data.length
  const avgDepth = data.reduce((sum, d) => sum + d.dep, 0) / data.length



  // 규모별로 지진 개수 분류
  const magnitudeRanges = {
    "7.0+": data.filter((d) => d.mag >= 7.0).length,
    "6.0-6.9": data.filter((d) => d.mag >= 6.0 && d.mag < 7.0).length,
    "5.0-5.9": data.filter((d) => d.mag >= 5.0 && d.mag < 6.0).length,
    "5.0 미만": data.filter((d) => d.mag < 5.0).length,
  }


  // 국내 영향이 있는 지진 개수 (난카이 데이터에만 해당)
  const domesticImpactCount = data.filter((d) => d.effect === "있음").length
  
  // 최대 규모 지진 클릭 핸들러
  const handleMaxMagnitudeClick = () => {
    const maxEarthquakes = data.filter((d) => d.mag === maxMagnitude)
    setSelectedEarthquakes(maxEarthquakes)
    setModalTitle(`최대 규모 M${maxMagnitude.toFixed(1)} 지진`)
    setShowModal(true)
  }


  // 규모별 지진 클릭 핸들러
  const handleMagnitudeRangeClick = (range) => {
    let filteredEarthquakes = []
    let title = ""

    switch (range) {
      case "7.0+":
        filteredEarthquakes = data.filter((d) => d.mag >= 7.0)
        title = "규모 M7.0 이상 지진"
        break
      case "6.0-6.9":
        filteredEarthquakes = data.filter((d) => d.mag >= 6.0 && d.mag < 7.0)
        title = "규모 M6.0-6.9 지진"
        break
      case "5.0-5.9":
        filteredEarthquakes = data.filter((d) => d.mag >= 5.0 && d.mag < 6.0)
        title = "규모 M5.0-5.9 지진"
        break
      case "5.0 미만":
        filteredEarthquakes = data.filter((d) => d.mag < 5.0)
        title = "규모 M5.0 미만 지진"
        break
    }

    setSelectedEarthquakes(filteredEarthquakes)
    setModalTitle(title)
    setShowModal(true)
  }

  // 국내 영향 지진 클릭 핸들러
  const handleDomesticImpactClick = () => {
    const domesticEarthquakes = data.filter((d) => d.effect === "있음")
    setSelectedEarthquakes(domesticEarthquakes)
    setModalTitle("국내 영향이 있는 지진")
    setShowModal(true)
  }


    // 좌표를 도분초 형식으로 변환하는 함수
  const formatCoordinate = (decimal, type) => {

    const abs = Math.abs(decimal)
    const degrees = Math.floor(abs)
    const minutes = Math.floor((abs - degrees) * 60)
    const seconds = ((abs - degrees) * 60 - minutes) * 60

    const direction = type === "lat" ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W"

    return `${degrees}°${minutes}'${seconds.toFixed(1)}"${direction}`
  }

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false)
    setSelectedEarthquakes([])
    setModalTitle("")
  }


 // 타입에 따라 색상 스타일 결정
  const colorStyle = type === "tohoku" ? { color: "#dc2626" } : { color: "#2563eb" }
  const bgColorStyle = type === "tohoku" ? { backgroundColor: "#fef2f2" } : { backgroundColor: "#eff6ff" }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 섹션 제목 */}
        <h3 style={{ fontSize: "18px", fontWeight: "600", margin: "0", ...colorStyle }}>데이터 요약</h3>

        {/* 주요 통계 정보를 2x2 그리드로 배치 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* 최대 규모 - 클릭 가능 */}
          <div
            onClick={handleMaxMagnitudeClick}
            style={{
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              ...bgColorStyle,
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)"
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "none"
            }}
          >
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>최대 규모 🗂️</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0", ...colorStyle }}>
              M{maxMagnitude.toFixed(1)}
            </p>
          </div>

          {/* 평균 규모 */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              ...bgColorStyle,
            }}
          >
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>평균 규모</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0", ...colorStyle }}>
              M{avgMagnitude.toFixed(1)}
            </p>
          </div>

          {/* 평균 깊이 */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              ...bgColorStyle,
            }}
          >
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>평균 깊이</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0", ...colorStyle }}>{avgDepth.toFixed(1)}km</p>
          </div>

          {/* 총 건수 */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              ...bgColorStyle,
            }}
          >
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>총 건수</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0", ...colorStyle }}>{data.length}건</p>
          </div>
        </div>

        {/* 규모별 분포 - 각각 클릭 가능 */}
        <div>
          <h4 style={{ fontWeight: "500", color: "#1f2937", margin: "0 0 8px 0" }}>규모별 분포 (클릭하여 상세보기)</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* 각 규모 범위별 지진 개수 표시 - 클릭 가능 */}
            {Object.entries(magnitudeRanges).map(([range, count]) => (
              <div
                key={range}
                onClick={() => count > 0 && handleMagnitudeRangeClick(range)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: count > 0 ? "pointer" : "default",
                  backgroundColor: count > 0 ? (type === "tohoku" ? "#fef2f2" : "#eff6ff") : "#f9fafb",
                  transition: "background-color 0.2s ease",
                  opacity: count > 0 ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (count > 0) {
                    e.target.style.backgroundColor = type === "tohoku" ? "#fecaca" : "#dbeafe"
                  }
                }}
                onMouseLeave={(e) => {
                  if (count > 0) {
                    e.target.style.backgroundColor = type === "tohoku" ? "#fef2f2" : "#eff6ff"
                  }
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  M{range} {count > 0 && "🗂️"}
                </span>
                <span style={{ fontWeight: "600", ...colorStyle }}>{count}건</span>
              </div>
            ))}
          </div>
        </div>

        {/* 국내 영향 정보 (난카이 데이터에만 표시) - 클릭 가능 */}
        {type === "nankai" && (
          <div
            onClick={handleDomesticImpactClick}
            style={{
              padding: "12px",
              borderRadius: "8px",
              cursor: domesticImpactCount > 0 ? "pointer" : "default",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              ...bgColorStyle,
            }}
            onMouseEnter={(e) => {
              if (domesticImpactCount > 0) {
                e.target.style.transform = "translateY(-2px)"
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)"
              }
            }}
            onMouseLeave={(e) => {
              if (domesticImpactCount > 0) {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "none"
              }
            }}
          >
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>
              국내 영향 있음 {domesticImpactCount > 0 && "🗂️"}
            </p>
            <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0", ...colorStyle }}>{domesticImpactCount}건</p>
          </div>
        )}
      </div>

      {/* 지진 목록 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  margin: "0",
                  ...colorStyle,
                }}
              >
                {modalTitle} ({selectedEarthquakes.length}건)
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                }}
              >
                ×
              </button>
            </div>

            {/* 지진 목록 */}
            <div
              style={{
                overflowY: "auto",
                flex: 1,
              }}
            >
              {selectedEarthquakes.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedEarthquakes.map((earthquake, index) => (
                    <div
                      key={earthquake.id || index}
                      style={{
                        padding: "16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            ...colorStyle,
                          }}
                        >
                          M{earthquake.mag}
                        </span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{earthquake.time}</span>
                      </div>

                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
                        <strong>위치:</strong> {earthquake.place}
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        <span>
                          <strong>깊이:</strong> {earthquake.dep}km
                        </span>
                        <span>
                          <strong>진원:</strong> {earthquake.lat}°N,{" "}
                          {earthquake.lng}°E
                        </span>
                      </div>

                      {/* 상세 좌표 정보 */}
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "4px",
                          fontSize: "11px",
                          color: "#6b7280",
                        }}
                      >
                        <strong>상세 좌표:</strong> {formatCoordinate(earthquake.lat, "lat")},{" "}
                        {formatCoordinate(earthquake.lng, "lng")}
                      </div>

                      {(earthquake.effect) && (
                        <div style={{ marginTop: "8px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              backgroundColor:
                                earthquake.effect === "있음"
                                  ? "#fef2f2"
                                  : "#f0f9ff",
                              color:
                                earthquake.effect === "있음"
                                  ? "#dc2626"
                                  : "#2563eb",
                            }}
                          >
                            국내영향:{" "}
                            {earthquake.effect === "있음" ? "있음" : "없음"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>해당하는 지진이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DataSummary
