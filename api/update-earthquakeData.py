from flask import Flask, jsonify
from flask_cors import CORS

import requests
import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)


# 경로 설정
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
NANKAI_JS_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'nankai-data.js')


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


        # nankai-data.js 갱신 (nankaiData export만)
        js_export = f"export const nankaiData = {json.dumps(quakesData, ensure_ascii=False, indent=2)};\n"

        with open(NANKAI_JS_FILE, "w", encoding="utf-8") as f:
            f.write(js_export)

        print(f"✅ nankai-data.js 갱신 완료 ({len(quakesData)}건)")

        return jsonify({
            "success": True,
            "message": f"난카이 지진 데이터 업데이트 완료 ({len(quakesData)}건)",
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
    print("🌍 지진 데이터 API 서버 시작...")
    print("📍 http://localhost:5050/api/refresh-nankai → 데이터 갱신")
    print("🔗 http://localhost:5050/api/status → 서버 상태 확인")
    app.run(debug=True, port=5050, host='0.0.0.0')
