import React from 'react';
import Svg, { Rect, Path, Line, G, Circle } from 'react-native-svg';

export default function TiqueteraLogo({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect width="64" height="64" rx="16" fill="#FF6B47" />
      <Path
        d="M 15 11 C 15 8.8 16.8 7 19 7 H 45 C 47.2 7 49 8.8 49 11 V 26.5 A 5.5 5.5 0 0 0 49 37.5 V 53 C 49 55.2 47.2 57 45 57 H 19 C 16.8 57 15 55.2 15 53 V 37.5 A 5.5 5.5 0 0 0 15 26.5 Z"
        fill="#FFFFFF"
      />
      <Line
        x1="19"
        y1="32"
        x2="45"
        y2="32"
        stroke="#FF6B47"
        strokeWidth="2"
        strokeDasharray="2.5 3"
        strokeLinecap="round"
      />
      <G stroke="#FF6B47" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M 22 14 C 26 14 28.5 17 29.5 20.5 L 26.5 22.5 L 22 14 Z" fill="#FF6B47" />
        <Path d="M 27.5 21 L 37 28" />
        <Path d="M 38.5 13.5 L 35.5 16.5" />
        <Path d="M 40.5 15.5 L 37.5 18.5" />
        <Path d="M 42.5 17.5 L 39.5 20.5" />
        <Path d="M 35.5 16.5 C 34.5 18 35 20 36.5 20.5 C 37.5 21 38.5 21.2 39.5 20.5" />
        <Path d="M 36.5 19.5 L 26.5 28" />
      </G>
      <Circle cx="23.5" cy="44.5" r="3.4" fill="#FF6B47" />
      <Circle cx="32" cy="44.5" r="3.4" fill="#FF6B47" />
      <Circle cx="40.5" cy="44.5" r="2.7" fill="none" stroke="#FF6B47" strokeWidth="2" />
    </Svg>
  );
}
