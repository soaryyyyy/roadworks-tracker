import L from 'leaflet'

const buildSvgIcon = (color, emoji) => {
  const size = 44
  const pointerHeight = 12
  const totalHeight = size + pointerHeight
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${totalHeight}" viewBox="0 0 ${size} ${totalHeight}">
      <path d="M22 0C11 0 3 8 3 18c0 10 19 26 19 26s19-16 19-26C41 8 33 0 22 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <text x="50%" y="24" text-anchor="middle" alignment-baseline="middle" font-size="20" fill="#fff">${emoji}</text>
      <path d="M22 ${size} L15 ${size + pointerHeight} L29 ${size} Z" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>
  `
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [size, totalHeight],
    iconAnchor: [size / 2, totalHeight],
    popupAnchor: [0, -totalHeight + 12],
    className: 'custom-pin',
  })
}

export const iconByType = {
  // Types originaux
  danger: buildSvgIcon('#d63031', '⚠️'),
  works: buildSvgIcon('#e17055', '🚧'),
  warning: buildSvgIcon('#fdcb6e', '⚡'),
  water: buildSvgIcon('#0984e3', '💧'),
  ok: buildSvgIcon('#27ae60', '✅'),
  accident: buildSvgIcon('#6c5ce7', '🚨'),
  // Nouveaux types alignés avec mobile
  blocked_road: buildSvgIcon('#FF8C00', '🚧'),
  construction: buildSvgIcon('#FFD700', '🏗️'),
  flooding: buildSvgIcon('#1E90FF', '💧'),
  debris: buildSvgIcon('#A9A9A9', '🪨'),
  poor_surface: buildSvgIcon('#FFA500', '⚠️'),
  other: buildSvgIcon('#808080', '❓')
}