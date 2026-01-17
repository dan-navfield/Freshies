import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface FreshiesLogoProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function FreshiesLogo({ 
  width = 180, 
  height = 60, 
  color = '#FFFFFF' 
}: FreshiesLogoProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 60" fill="none">
      {/* This is a placeholder - we'll need to extract the actual SVG paths from your logo file */}
      {/* For now, using a simple text representation */}
      <G>
        <Path
          d="M10 30 Q 10 10, 30 10 L 170 10 Q 190 10, 190 30 Q 190 50, 170 50 L 30 50 Q 10 50, 10 30 Z"
          fill={color}
          opacity={0.9}
        />
      </G>
    </Svg>
  );
}
