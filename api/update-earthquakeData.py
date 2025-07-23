from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime

# 환경에 따른 설정
is_production = os.environ.get('RENDER') or os.environ.get('RAILWAY') or os.environ.get('HEROKU')

if is_production:
    # 🚀 배포 환경: React 빌드 파일 서빙
    app = Flask(__name__, static_folder='../build', static_url_path='')
else:
    # 💻 로컬 환경: API만 제공
    app = Flask(__name__)

CORS(app)

# 🧪 테스트용 라우트
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        "status": "success",
        "message": "🎉 Flask API가 정상 작동합니다!",
        "timestamp": datetime.now().isoformat(),
        "environment": "production" if is_production else "development"
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "running",
        "message": "지진 데이터 API 서버가 정상 작동 중입니다.",
        "timestamp": datetime.now().isoformat()
    })

# 🔄 난카이 데이터 새로고침 API
@app.route('/api/refresh-nankai', methods=['GET'])
def refresh_nankai_data():
    try:
        print("🔄 난카이 지진 데이터 업데이트 시작...")
        
        today = datetime.now().strftime("%Y%m%d")
        URL = f"https://apihub.kma.go.kr/api/typ09/url/eqk/urlNewNotiEqk.do?frDate=20240501&laDate={today}&cntDiv=N&orderTy=xml&authKey=hrQs0zeMSfq0LNM3jLn6RA"
        
        print("📡 기상청 API 호출 중...")
        response = requests.get(URL, timeout=30)
        
        if response.status_code != 200:
            raise Exception(f"기상청 API 요청 실패: {response.status_code}")
        
        print("🔍 XML 데이터 파싱 중...")
        root = ET.fromstring(response.content)
        information = root.findall(".//info")
        
        print(f"📋 찾은 지진 정보: {len(information)}개")
        
        quakesData = []
        
        for info in information:
            location = info.findtext("eqPt") or ""
            
            if location and "일본" in location:
                try:
                    mag = float(info.findtext("magMl") or 0)
                    depth = float(info.findtext("eqDt") or 0)
                    latitude = float(info.findtext("eqLt") or 0)
                    longitude = float(info.findtext("eqLn") or 0)
                    
                    if mag > 0 and latitude != 0 and longitude != 0:
                        eq_date = info.findtext("eqDate") or ""
                        if eq_date and len(eq_date) == 14:
                            time = datetime.strptime(eq_date, "%Y%m%d%H%M%S").strftime("%Y-%m-%d %H:%M:%S")
                        else:
                            time = eq_date or "정보없음"
                        
                        refer = info.findtext("ReFer") or ""
                        effect = not ("국내영향없음" in refer)
                        
                        quake = {
                            "id": f"nankai_{len(quakesData) + 1}",
                                    "lat": latitude,
                                    "lng": longitude,
                                    "mag": mag,
                                    "dep": depth,
                                    "place": location,
                                    "effect": effect,
                                    "time": time,
                        }
                        quakesData.append(quake)
                        
                except (ValueError, TypeError):
                    continue
        
        print(f"✅ 수집된 일본 지진 데이터: {len(quakesData)}건")
        
        return jsonify({
            "success": True,
            "message": f"난카이 지진 데이터 업데이트 완료 ({len(quakesData)}건)",
            "data": quakesData,
            "updated_at": datetime.now().isoformat(),
            "count": len(quakesData),
            "period": f"2024-05-01 ~ {datetime.now().strftime('%Y-%m-%d')}"
        })
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ 오류 발생: {error_msg}")
        
        return jsonify({
            "success": False,
            "message": f"데이터 업데이트 실패: {error_msg}",
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }), 500

# 🌐 React 앱 서빙 (배포 환경에서만)
if is_production:
    @app.route('/')
    def serve_react_app():
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            return jsonify({
                "message": "React 앱을 찾을 수 없습니다.", 
                "error": str(e),
                "build_folder": app.static_folder
            })

    @app.route('/<path:path>')
    def serve_static_files(path):
        try:
            if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
                return send_from_directory(app.static_folder, path)
            else:
                return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            return jsonify({
                "message": f"파일을 찾을 수 없습니다: {path}",
                "error": str(e)
            })
else:
    @app.route('/')
    def local_home():
        return jsonify({
            "message": "🔧 로컬 개발 환경 - API만 제공",
            "endpoints": [
                "/api/test",
                "/api/status", 
                "/api/refresh-nankai"
            ]
        })

if __name__ == '__main__':
    if is_production:
        # 배포 환경
        port = int(os.environ.get('PORT', 10000))
        print(f"🚀 배포 환경 Flask 서버 시작: 포트 {port}")
    else:
        # 로컬 환경 - 다른 포트 사용
        port = 5050  # 포트 충돌 방지
        print(f"💻 로컬 개발 Flask 서버 시작: 포트 {port}")
        print(f"🔗 API 테스트: http://localhost:{port}/api/test")
        print(f"🔗 상태 확인: http://localhost:{port}/api/status")
        print(f"🔗 데이터 새로고침: http://localhost:{port}/api/refresh-nankai")
    
    app.run(host='0.0.0.0', port=port, debug=not is_production)
