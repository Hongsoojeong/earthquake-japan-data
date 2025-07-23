from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime

# React 빌드 폴더를 정적 파일로 서빙하도록 설정
app = Flask(__name__, static_folder='../build', static_url_path='')
CORS(app)

# 경로 설정 (상대 경로로 수정)
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
NANKAI_JS_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'nankai-data.js')

# React 앱 서빙을 위한 라우트 추가
@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/refresh-nankai', methods=['GET'])
def refresh_nankai_data():
    try:
        today = datetime.now().strftime("%Y%m%d")
        print(f"🔄 난카이 지진 데이터 업데이트 시작... (기간: 20240501 ~ {today})")
        
        URL = f"https://apihub.kma.go.kr/api/typ09/url/eqk/urlNewNotiEqk.do?frDate=20240501&laDate={today}&cntDiv=N&orderTy=xml&authKey=hrQs0zeMSfq0LNM3jLn6RA"
        
        res = requests.get(URL)
        if res.status_code != 200:
            raise Exception(f"API 요청 실패: {res.status_code}")
            
        root = ET.fromstring(res.content)
        information = root.findall(".//info")
        
        quakesData = []
        
        for info in information:
            location = info.findtext("eqPt")
            if location and "일본" in location:
                try:
                    mag = float(info.findtext("magMl") or 0)
                    depth = float(info.findtext("eqDt") or 0)
                    latitude = float(info.findtext("eqLt") or 0)
                    longitude = float(info.findtext("eqLn") or 0)
                    
                    if mag == 0 or latitude == 0 or longitude == 0:
                        continue
                        
                except (ValueError, TypeError):
                    continue
                
                eq_date = info.findtext("eqDate")
                if eq_date:
                    try:
                        time = datetime.strptime(eq_date, "%Y%m%d%H%M%S").strftime("%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        time = eq_date
                else:
                    time = "정보없음"
                
                refer = info.findtext("ReFer") or ""
                effect = "없음" if "국내영향없음" in refer else "있음"
                
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
        
        # 1. nankai-data.js 갱신 (기존 방식 유지)
        try:
            js_export = f"export const nankaiData = {json.dumps(quakesData, ensure_ascii=False, indent=2)};\n"
            os.makedirs(os.path.dirname(NANKAI_JS_FILE), exist_ok=True)
            with open(NANKAI_JS_FILE, "w", encoding="utf-8") as f:
                f.write(js_export)
            print(f"✅ nankai-data.js 갱신 완료 ({len(quakesData)}건)")
        except Exception as js_error:
            print(f"⚠️ JS 파일 갱신 실패: {js_error}")
        
        # 2. JSON 파일도 생성 (배포 환경에서 사용)
        try:
            json_path = os.path.join(app.static_folder, "NankaiQuake_data.json")
            os.makedirs(os.path.dirname(json_path), exist_ok=True)
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(quakesData, f, ensure_ascii=False, indent=2)
            print(f"✅ JSON 파일 생성 완료: {json_path}")
        except Exception as json_error:
            print(f"⚠️ JSON 파일 생성 실패: {json_error}")
        
        return jsonify({
            "success": True,
            "message": f"난카이 지진 데이터 업데이트 완료",
            "data": quakesData,
            "updated_at": datetime.now().isoformat(),
            "period": f"2024-05-01 ~ {datetime.now().strftime('%Y-%m-%d')}"
        })
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"데이터 업데이트 중 오류 발생: {str(e)}"
        }), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "running",
        "message": "지진 데이터 API 서버가 정상 작동 중입니다.",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # 배포 환경에서는 PORT 환경변수 사용
    port = int(os.environ.get('PORT', 5050))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    print("🌍 지진 데이터 API 서버 시작...")
    print(f"📍 http://localhost:{port}/api/refresh-nankai → 데이터 갱신")
    print(f"🔗 http://localhost:{port}/api/status → 서버 상태 확인")
    
    app.run(debug=debug_mode, port=port, host='0.0.0.0')
