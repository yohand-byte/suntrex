import { useState } from "react";

const LOGO_URLS = {
  huawei: "https://img.logo.dev/huawei.com?token=pk_anonymous&size=120&format=png",
  jinko: "https://img.logo.dev/jinkosolar.com?token=pk_anonymous&size=120&format=png",
  trina: "https://img.logo.dev/trinasolar.com?token=pk_anonymous&size=120&format=png",
  longi: "https://img.logo.dev/longi.com?token=pk_anonymous&size=120&format=png",
  "ja-solar": "https://img.logo.dev/jasolar.com?token=pk_anonymous&size=120&format=png",
  "canadian-solar": "https://img.logo.dev/canadiansolar.com?token=pk_anonymous&size=120&format=png",
  sma: "https://img.logo.dev/sma.de?token=pk_anonymous&size=120&format=png",
  sungrow: "https://img.logo.dev/sungrowpower.com?token=pk_anonymous&size=120&format=png",
  solaredge: "https://img.logo.dev/solaredge.com?token=pk_anonymous&size=120&format=png",
  goodwe: "https://img.logo.dev/goodwe.com?token=pk_anonymous&size=120&format=png",
  growatt: "https://img.logo.dev/growatt.com?token=pk_anonymous&size=120&format=png",
  risen: "https://img.logo.dev/risenenergy.com?token=pk_anonymous&size=120&format=png",
  byd: "https://img.logo.dev/byd.com?token=pk_anonymous&size=120&format=png",
  deye: "https://img.logo.dev/dfrcloud.com?token=pk_anonymous&size=120&format=png",
  enphase: "https://img.logo.dev/enphase.com?token=pk_anonymous&size=120&format=png",
};

export default function BrandLogo({ brand }) {
  const [failed, setFailed] = useState(false);
  const url = LOGO_URLS[brand.f];
  if (failed || !url) return <span style={{fontSize:15,fontWeight:700,color:brand.c,whiteSpace:"nowrap",opacity:.85}}>{brand.n}</span>;
  return <img src={url} alt={brand.n} style={{height:32,maxWidth:140,objectFit:"contain"}} onError={()=>setFailed(true)}/>;
}
