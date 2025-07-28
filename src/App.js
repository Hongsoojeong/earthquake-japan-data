"use client"
import { useEffect, useState } from "react"
import EarthquakeMap from "./components/earthquake-map.js"
import DataSummary from "./components/data-summary.js"
import { TohokuTableauIframe, NankaiTableauIframe } from "./components/tableauIframe.js"
import { tohokuData, nankaiData } from "./data/earthquake-data.js"
import "./App.css"

// Render 배포 시 자동으로 현재 도메인 사용
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? window.location.origin // 같은 서버에서 API와 React 모두 서빙
    : "http://localhost:5050" // 로컬 개발 시 기존 포트 유지


function App() {
  const [selectedEarthquake, setSelectedEarthquake] = useState(null)
  const [currentTohokuData, setCurrentTohokuData] = useState(tohokuData)
  const [currentNankaiData, setCurrentNankaiData] = useState(nankaiData)
  const [isLoading, setIsLoading] = useState(false)
  const [updateStatus, setUpdateStatus] = useState("")
  const [lastUpdated, setLastUpdated] = useState("")
  const [dataPeriods, setDataPeriods] = useState({
    nankai: "2024-05-01 ~ 현재",
    tohoku: "2011-02-11 ~ 2011-03-12",
  })

  var currentLen = currentNankaiData.length;

  // ✅ 앱 시작 시 localStorage에 저장된 값으로 초기화
  useEffect(() => {
    const savedTime = localStorage.getItem("lastUpdated")
    if (savedTime) {
      setLastUpdated(savedTime)
    }
  }, [])

  const handleEarthquakeSelect = (earthquake) => {
    setSelectedEarthquake(earthquake)
  }

  const closePopup = () => {
    setSelectedEarthquake(null)
  }

  // 실제 API를 호출하는 데이터 새로고침 함수
  const refreshData = async () => {
    setIsLoading(true)
    setUpdateStatus("난카이 지진 데이터를 업데이트하는 중...")

    try {
      console.log("🔄 API 서버에 데이터 업데이트 요청...")

      // API URL을 환경에 따라 동적으로 설정
      const response = await fetch(`${API_BASE_URL}/api/refresh-nankai`)
      const result = await response.json()

      if (result.success) {
        // API에서 받은 최신 데이터로 상태 업데이트
        setCurrentNankaiData(result.data)
        const formattedTime = new Date(result.updated_at).toLocaleString()
        setLastUpdated(formattedTime)
        localStorage.setItem("lastUpdated", formattedTime) // ✅ 저장

        // 데이터 기간 업데이트
        setDataPeriods((prev) => ({
          ...prev,
          nankai: result.period || "2024-05-01 ~ 현재",
        }))

        setUpdateStatus(`✅ ${result.message}`)
        currentLen = result.data.length;
        console.log("✅ 데이터 업데이트 성공:", result.data.length + "건")

        // 3초 후 상태 메시지 제거
        setTimeout(() => setUpdateStatus(""), 3000)
      } else {
        setUpdateStatus(`❌ ${result.message}`)
        setTimeout(() => setUpdateStatus(""), 5000)
      }
    } catch (error) {
      console.error("❌ API 호출 중 오류 발생:", error)
      setUpdateStatus("❌ 서버 연결 오류. 잠시 후 다시 시도해주세요.")
      setTimeout(() => setUpdateStatus(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      {/* 웹사이트 상단 헤더 */}
      <header className="header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="main-title">일본 지진 데이터 비교 분석</h1>
            <p className="subtitle">동일본 대지진(2011) vs 난카이 대지진 관련 지진(2024~2025)</p>

            {/* 헤더 이미지 섹션 */}
            <div className="header-image-section">
              <div className="header-images">
                {/* 일본 지도 이미지 */}
                <div className="header-image-item">
                  <img src="/news_wideshow_serious.png" alt="일본 지진 위험 지역 지도" className="header-image" />
                </div>
              </div>

              {/* 데이터 업데이트 섹션 */}
              <div className="update-section">
                <div className="update-info">
                  <span className="last-updated">마지막 업데이트: {lastUpdated}</span>
                  <button onClick={refreshData} disabled={isLoading} className="refresh-button">
                    {isLoading ? (
                      <>
                        <span className="loading-spinner">⟳</span>
                        업데이트 중...
                      </>
                    ) : (
                      <>🚀 데이터 새로고침</>
                    )}
                  </button>
                </div>

                {/* 업데이트 상태 메시지 */}
                {updateStatus && (
                  <div className={`update-status ${updateStatus.includes("❌") ? "error" : "success"}`}>
                    {updateStatus}
                  </div>
                )}
              </div>
            </div>

            {/* 이미지 설명 텍스트 */}
            <div className="image-description">
              <p>
                일본 미야자키 앞바다 규모 7.1 지진 이후, 난카이 해곡에서 규모 8 이상 대지진, 즉 난카이 지진의 가능성이
                제기되고 있습니다.
                <br />이 해역은 100~150년 주기로 대지진이 발생해 왔으며, 실제 일어난다면{" "}
                <strong>2011년 동일본 대지진</strong>보다 16배 큰 인명 피해가 예상됩니다.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="main-content">
        {/* 두 개의 지도를 나란히 배치 */}
        <div className="maps-container">
          {/* 왼쪽: 동일본 대지진 섹션 */}
          <div className="map-section tohoku-section">
            <div className="section-header tohoku-header">
              <h2 className="section-title">동일본 대지진 (2011년 2월 ~ 2011년 3월)</h2>
              <p className="section-subtitle">총 {currentTohokuData.length}건의 지진 데이터</p>
            </div>
            <div className="section-content">
              <EarthquakeMap
                data={currentTohokuData}
                mapId="tohoku-map"
                center={[38.0, 142.0]}
                zoom={4}
                onEarthquakeSelect={handleEarthquakeSelect}
              />
              <DataSummary data={currentTohokuData} type="tohoku" />
            </div>
          </div>

          {/* 오른쪽: 난카이 대지진 관련 섹션 */}
          <div className="map-section nankai-section">
            <div className="section-header nankai-header">
              <h2 className="section-title">난카이 대지진 관련 (2024년~2025년)</h2>
              <p className="section-subtitle">총 {currentLen}건의 지진 데이터</p>
            </div>
            <div className="section-content">
              <EarthquakeMap
                data={currentNankaiData}
                mapId="nankai-map"
                center={[33.0, 135.0]}
                zoom={4}
                onEarthquakeSelect={handleEarthquakeSelect}
              />
              <DataSummary data={currentNankaiData} type="nankai" />
            </div>
          </div>
        </div>

        {/* 하단 비교 분석 섹션 */}
        <div className="comparison-section">
          <h3 className="comparison-title">주요 비교 분석</h3>
          <div className="comparison-grid">
            {/* 동일본 대지진 최대 규모 */}
            <div className="comparison-card tohoku-card">
              <h4 className="card-title">동일본 대지진</h4>
              <p className="card-value tohoku-value">
                최대 M{Math.max(...currentTohokuData.map((d) => d.mag)).toFixed(1)}
              </p>
              <p className="card-label">최대 규모</p>
            </div>

            {/* 난카이 관련 최대 규모 */}
            <div className="comparison-card nankai-card">
              <h4 className="card-title">난카이 관련</h4>
              <p className="card-value nankai-value">
                최대 M{Math.max(...currentNankaiData.map((d) => d.mag)).toFixed(1)}
              </p>
              <p className="card-label">최대 규모</p>
            </div>

            {/* 데이터 기간 정보 */}
            <div className="comparison-card period-card">
              <h4 className="card-title">데이터 기간</h4>
              <p className="card-text">동일본 지진 : 2011년 2 ~ 3월</p>
              <p className="card-text">난카이 지진 : 2024년 5월 ~ 마지막 업데이트 날짜</p>
            </div>
          </div>

          {/* Tableau 차트들 */}
          <div style={{ display: "flex", gap: "20px", justifyContent: "space-between", margin: "40px 0" }}>
            <TohokuTableauIframe />
            <NankaiTableauIframe />
          </div>
        </div>
      </main>

      {/* 지진 정보 팝업 (지진을 클릭했을 때만 나타남) */}
      {selectedEarthquake && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            {/* 팝업 헤더 */}
            <div className="popup-header">
              <h3 className="popup-title">지진 상세 정보</h3>
              <button onClick={closePopup} className="close-button">
                ×
              </button>
            </div>

            {/* 지진 정보 내용 */}
            <div className="popup-body">
              <div className="info-item">
                <span className="info-label">발생 시각:</span>
                <p className="info-value">{selectedEarthquake.time}</p>
              </div>

              <div className="info-item">
                <span className="info-label">위치:</span>
                <p className="info-value">{selectedEarthquake.place}</p>
              </div>

              <div className="info-item">
                <span className="info-label">규모:</span>
                <p className="info-value magnitude">M{selectedEarthquake.mag}</p>
              </div>

              <div className="info-item">
                <span className="info-label">깊이:</span>
                <p className="info-value">{selectedEarthquake.dep}km</p>
              </div>

              <div className="info-item">
                <span className="info-label">진원 좌표:</span>
                <p className="info-value">
                  {selectedEarthquake.lat}°N, {selectedEarthquake.lng}°E
                </p>
              </div>

              {/* 국내 영향 정보 (난카이 데이터에만 있음) */}
              {selectedEarthquake.effect && (
                <div className="info-item">
                  <span className="info-label">국내 영향:</span>
                  <p className="info-value">{selectedEarthquake.effect === "있음" ? "있음" : "없음"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
