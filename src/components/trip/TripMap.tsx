import { View, Text, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { GPSPoint } from '@/types';

// ─── Speed color scale ─────────────────────────────────────────────────────
// Matches the gauge color scale: green → yellow-green → amber → orange → red
// Applied per-km segment based on the average speed of that km.

function buildMapHtml(route: GPSPoint[], height: number): string {
  const routeJson = JSON.stringify(
    route.map((p) => ({ lat: p.lat, lng: p.lng, speed: p.speed }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#14141C;overflow:hidden}
    #map{width:100%;height:${height}px;background:#14141C}
    .leaflet-control-attribution,.leaflet-control-zoom{display:none!important}
  </style>
</head>
<body>
<div id="map"></div>
<script>
(function(){
  var route = ${routeJson};

  var map = L.map('map', {
    zoomControl:false, attributionControl:false,
    dragging:false, scrollWheelZoom:false,
    doubleClickZoom:false, touchZoom:false, keyboard:false
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);

  // ── Speed → colour ──────────────────────────────────────────────────────
  function speedToColor(kmh){
    if(kmh < 30)  return '#00C896'; // green
    if(kmh < 60)  return '#7CC860'; // yellow-green
    if(kmh < 90)  return '#F0A500'; // amber
    if(kmh < 120) return '#FF7A00'; // orange
    return '#FF4B4B';               // red
  }

  // ── Haversine distance (km) ─────────────────────────────────────────────
  function haversine(lat1,lng1,lat2,lng2){
    var R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
    var a=Math.sin(dLat/2)*Math.sin(dLat/2)+
          Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
          Math.sin(dLng/2)*Math.sin(dLng/2);
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }

  // ── Split route into ~1 km segments ─────────────────────────────────────
  function buildKmSegments(pts){
    if(pts.length < 2) return [];
    var segments=[], current=[pts[0]], dist=0;
    for(var i=1;i<pts.length;i++){
      dist += haversine(pts[i-1].lat,pts[i-1].lng,pts[i].lat,pts[i].lng);
      current.push(pts[i]);
      if(dist >= 1.0 || i===pts.length-1){
        segments.push(current);
        current=[pts[i]];
        dist=0;
      }
    }
    return segments;
  }

  function avgSpeed(pts){
    var s=0; for(var i=0;i<pts.length;i++) s+=pts[i].speed;
    return s/pts.length;
  }

  // ── Draw segments ────────────────────────────────────────────────────────
  var allLatLngs=[];
  var segments=buildKmSegments(route);

  for(var s=0;s<segments.length;s++){
    var seg=segments[s];
    var latlngs=seg.map(function(p){return[p.lat,p.lng];});
    var color=speedToColor(avgSpeed(seg));

    L.polyline(latlngs,{color:color,weight:5,opacity:0.95,lineCap:'round',lineJoin:'round'}).addTo(map);
    allLatLngs=allLatLngs.concat(latlngs);
  }

  // ── Start / end markers ──────────────────────────────────────────────────
  if(route.length >= 2){
    L.circleMarker([route[0].lat,route[0].lng],
      {radius:7,fillColor:'#00C896',color:'#0A0A0F',weight:2,fillOpacity:1}).addTo(map);
    L.circleMarker([route[route.length-1].lat,route[route.length-1].lng],
      {radius:7,fillColor:'#FF4B4B',color:'#0A0A0F',weight:2,fillOpacity:1}).addTo(map);
  }

  // ── Fit bounds ───────────────────────────────────────────────────────────
  if(allLatLngs.length > 0){
    map.fitBounds(L.latLngBounds(allLatLngs),{padding:[24,24]});
  }
})();
</script>
</body>
</html>`;
}

interface TripMapProps {
  route: GPSPoint[];
  height?: number;
  unit?: 'kmh' | 'mph';
}

export function TripMap({ route, height = 220, unit = 'kmh' }: TripMapProps) {
  if (!route || route.length < 2) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.empty}>No route data</Text>
      </View>
    );
  }

  const html = buildMapHtml(route, height);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        originWhitelist={['*']}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Speed legend — labels adapt to selected unit */}
      <View style={styles.legend}>
        {(unit === 'mph'
          ? [
              { color: '#00C896', label: '<19' },
              { color: '#7CC860', label: '19–37' },
              { color: '#F0A500', label: '37–56' },
              { color: '#FF7A00', label: '56–75' },
              { color: '#FF4B4B', label: '75+' },
            ]
          : [
              { color: '#00C896', label: '<30' },
              { color: '#7CC860', label: '30–60' },
              { color: '#F0A500', label: '60–90' },
              { color: '#FF7A00', label: '90–120' },
              { color: '#FF4B4B', label: '120+' },
            ]
        ).map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  webview: {
    flex: 1,
    backgroundColor: '#14141C',
  },
  placeholder: {
    backgroundColor: '#14141C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  empty: { color: '#8E8EA0' },
  legend: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(10,10,15,0.85)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { color: '#8E8EA0', fontSize: 9, fontWeight: '600' },
});
