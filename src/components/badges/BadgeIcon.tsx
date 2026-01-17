import React from 'react';
import Svg, { Circle, Path, Polygon, G } from 'react-native-svg';

interface BadgeIconProps {
  type: 'star' | 'trophy' | 'medal' | 'shield' | 'crown' | 'target' | 'book' | 'lightbulb' | 'heart' | 'fire' | 'sparkle' | 'rocket' | 'flag' | 'gem' | 'wand';
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
}

export default function BadgeIcon({
  type,
  size = 64,
  primaryColor = '#FFD700',
  secondaryColor = '#FFA500',
  backgroundColor = '#4A90E2'
}: BadgeIconProps) {
  const renderIcon = () => {
    switch (type) {
      case 'star':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill={backgroundColor} />
            <Circle cx="32" cy="32" r="26" fill="#5A6C7D" opacity="0.3" />
            <Path
              d="M32 12 L37 26 L52 26 L40 35 L45 49 L32 40 L19 49 L24 35 L12 26 L27 26 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="1.5"
            />
          </G>
        );

      case 'trophy':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill={backgroundColor} />
            <Circle cx="32" cy="32" r="26" fill="#5A6C7D" opacity="0.3" />
            <Path
              d="M20 18 L20 22 C20 22 18 24 18 28 C18 32 20 34 24 34 L24 38 L22 38 L22 46 L42 46 L42 38 L40 38 L40 34 C44 34 46 32 46 28 C46 24 44 22 44 22 L44 18 Z M24 18 L24 30 C24 30 22 30 22 28 C22 26 24 24 24 24 Z M40 18 L40 24 C40 24 42 26 42 28 C42 30 40 30 40 30 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="1.5"
            />
            <Path
              d="M28 18 L36 18 L36 34 L28 34 Z"
              fill={secondaryColor}
            />
          </G>
        );

      case 'medal':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#E74C3C" />
            <Circle cx="32" cy="32" r="26" fill="#C0392B" opacity="0.3" />
            <Path
              d="M26 12 L32 18 L38 12 L38 28 L32 24 L26 28 Z"
              fill="#C0392B"
              stroke="#A93226"
              strokeWidth="1.5"
            />
            <Circle cx="32" cy="38" r="12" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
            <Circle cx="32" cy="38" r="8" fill={secondaryColor} />
            <Path
              d="M32 34 L33 37 L36 37 L34 39 L35 42 L32 40 L29 42 L30 39 L28 37 L31 37 Z"
              fill={primaryColor}
            />
          </G>
        );

      case 'shield':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#E67E22" />
            <Circle cx="32" cy="32" r="26" fill="#D35400" opacity="0.3" />
            <Path
              d="M32 14 C40 14 46 18 46 18 L46 32 C46 42 32 50 32 50 C32 50 18 42 18 32 L18 18 C18 18 24 14 32 14 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="2"
            />
            <Path
              d="M32 20 L36 28 L32 32 L28 28 Z"
              fill={secondaryColor}
            />
          </G>
        );

      case 'crown':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#9B59B6" />
            <Circle cx="32" cy="32" r="26" fill="#8E44AD" opacity="0.3" />
            <Path
              d="M16 28 L20 38 L44 38 L48 28 L42 32 L38 24 L32 30 L26 24 L22 32 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="1.5"
            />
            <Polygon points="20,38 44,38 42,46 22,46" fill={secondaryColor} />
            <Circle cx="16" cy="28" r="2" fill={primaryColor} />
            <Circle cx="26" cy="24" r="2" fill={primaryColor} />
            <Circle cx="32" cy="30" r="2" fill={primaryColor} />
            <Circle cx="38" cy="24" r="2" fill={primaryColor} />
            <Circle cx="48" cy="28" r="2" fill={primaryColor} />
          </G>
        );

      case 'target':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#E74C3C" />
            <Circle cx="32" cy="32" r="26" fill="#C0392B" opacity="0.3" />
            <Circle cx="32" cy="32" r="18" fill="#ECF0F1" stroke="#34495E" strokeWidth="2" />
            <Circle cx="32" cy="32" r="12" fill="#E74C3C" />
            <Circle cx="32" cy="32" r="6" fill="#C0392B" />
            <Circle cx="32" cy="32" r="3" fill={primaryColor} />
          </G>
        );

      case 'book':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#27AE60" />
            <Circle cx="32" cy="32" r="26" fill="#229954" opacity="0.3" />
            <Path
              d="M20 16 L44 16 L44 48 L20 48 C18 48 16 46 16 44 L16 20 C16 18 18 16 20 16 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="1.5"
            />
            <Path d="M20 16 L20 44 C20 45 21 46 22 46 L44 46 L44 48 L20 48 C18 48 16 46 16 44 Z" fill={secondaryColor} />
            <Path d="M24 24 L40 24 M24 30 L40 30 M24 36 L36 36" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
          </G>
        );

      case 'lightbulb':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#27AE60" />
            <Circle cx="32" cy="32" r="26" fill="#229954" opacity="0.3" />
            <Circle cx="32" cy="28" r="10" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
            <Path
              d="M26 36 C26 36 26 38 28 38 L36 38 C38 38 38 36 38 36"
              fill={secondaryColor}
              stroke={secondaryColor}
              strokeWidth="1.5"
            />
            <Path d="M28 38 L28 42 L36 42 L36 38" fill="#95A5A6" stroke="#7F8C8D" strokeWidth="1.5" />
            <Path d="M30 42 L34 42 L34 44 L30 44 Z" fill="#7F8C8D" />
            <Path d="M28 22 L28 18 M36 22 L36 18 M22 28 L18 28 M42 28 L46 28" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
          </G>
        );

      case 'heart':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#E91E63" />
            <Circle cx="32" cy="32" r="26" fill="#C2185B" opacity="0.3" />
            <Path
              d="M32 45 C32 45 16 35 16 25 C16 20 19 16 24 16 C27 16 30 18 32 20 C34 18 37 16 40 16 C45 16 48 20 48 25 C48 35 32 45 32 45 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="2"
            />
          </G>
        );

      case 'fire':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#E67E22" />
            <Circle cx="32" cy="32" r="26" fill="#D35400" opacity="0.3" />
            <Path
              d="M32 14 C32 14 28 20 28 26 C28 26 24 24 24 30 C24 38 28 44 32 46 C36 44 40 38 40 30 C40 24 36 26 36 26 C36 20 32 14 32 14 Z"
              fill="#E74C3C"
              stroke="#C0392B"
              strokeWidth="1.5"
            />
            <Path
              d="M32 24 C32 24 30 28 30 32 C30 32 28 31 28 34 C28 38 30 42 32 44 C34 42 36 38 36 34 C36 31 34 32 34 32 C34 28 32 24 32 24 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="1.5"
            />
          </G>
        );

      case 'sparkle':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#9B59B6" />
            <Circle cx="32" cy="32" r="26" fill="#8E44AD" opacity="0.3" />
            <Path d="M32 12 L34 28 L50 30 L34 32 L32 48 L30 32 L14 30 L30 28 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
            <Path d="M42 18 L43 24 L49 25 L43 26 L42 32 L41 26 L35 25 L41 24 Z" fill="#FFF" opacity="0.8" />
            <Path d="M22 38 L23 42 L27 43 L23 44 L22 48 L21 44 L17 43 L21 42 Z" fill="#FFF" opacity="0.8" />
          </G>
        );

      case 'rocket':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#3498DB" />
            <Circle cx="32" cy="32" r="26" fill="#2980B9" opacity="0.3" />
            <Path
              d="M32 12 C38 12 42 16 42 22 L42 36 L38 44 L26 44 L22 36 L22 22 C22 16 26 12 32 12 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="2"
            />
            <Circle cx="32" cy="26" r="4" fill="#3498DB" stroke="#2980B9" strokeWidth="1.5" />
            <Path d="M22 36 L18 40 L18 46 L22 42 Z" fill="#E74C3C" />
            <Path d="M42 36 L46 40 L46 46 L42 42 Z" fill="#E74C3C" />
            <Path d="M28 44 L30 50 L34 50 L36 44" fill="#E67E22" stroke="#D35400" strokeWidth="1.5" />
          </G>
        );

      case 'flag':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#27AE60" />
            <Circle cx="32" cy="32" r="26" fill="#229954" opacity="0.3" />
            <Path d="M20 14 L20 50" stroke="#7F8C8D" strokeWidth="3" strokeLinecap="round" />
            <Path
              d="M20 14 L42 14 C42 14 44 18 42 22 C44 26 42 30 42 30 L20 30 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="1.5"
            />
          </G>
        );

      case 'gem':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#9B59B6" />
            <Circle cx="32" cy="32" r="26" fill="#8E44AD" opacity="0.3" />
            <Path
              d="M24 22 L40 22 L46 30 L32 48 L18 30 Z"
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="2"
            />
            <Path d="M24 22 L32 30 L40 22" stroke={secondaryColor} strokeWidth="1.5" />
            <Path d="M18 30 L32 30 L46 30" stroke={secondaryColor} strokeWidth="1.5" />
          </G>
        );

      case 'wand':
        return (
          <G>
            <Circle cx="32" cy="32" r="30" fill="#E91E63" />
            <Circle cx="32" cy="32" r="26" fill="#C2185B" opacity="0.3" />
            <Path d="M18 46 L46 18" stroke="#95A5A6" strokeWidth="3" strokeLinecap="round" />
            <Path d="M42 14 L44 20 L50 22 L44 24 L42 30 L40 24 L34 22 L40 20 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
            <Path d="M22 32 L23 35 L26 36 L23 37 L22 40 L21 37 L18 36 L21 35 Z" fill="#FFF" opacity="0.8" />
            <Path d="M36 38 L37 41 L40 42 L37 43 L36 46 L35 43 L32 42 L35 41 Z" fill="#FFF" opacity="0.8" />
          </G>
        );

      default:
        return <Circle cx="32" cy="32" r="30" fill={backgroundColor} />;
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {renderIcon()}
    </Svg>
  );
}
