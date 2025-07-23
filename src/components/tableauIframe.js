"use client"

export function TohokuTableauIframe() {
  return (
    <div style={{ width: "50%", height: "700px"}}>
      <iframe
        title="동일본 대지진 시각화"
        
        src="https://public.tableau.com/views/_17520745835520/1?:language=ko-KR&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link:showVizHome=no&embed=true"
        width="100%"
        height="100%"
        style={{ border: "none" }} // ✅ 여기가 객체
        allowFullScreen
      ></iframe>
    </div>
  )
}



export function NankaiTableauIframe() {
  return (
    <div style={{ width: "50%", height: "700px"}}>
      <iframe
        title="난카이 지진 데이터 관련 시각화"
        
        src="https://public.tableau.com/views/_17520745835520/2?:language=ko-KR&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link:showVizHome=no&embed=true"
        width="100%"
        height="100%"
        style={{ border: "none" }} // ✅ 여기가 객체
        allowFullScreen
      ></iframe>
    </div>
  )
}
