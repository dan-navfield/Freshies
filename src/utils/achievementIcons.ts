// Map achievement titles/categories to badge icon types
export const getAchievementIconType = (title: string, category: string): 'star' | 'trophy' | 'medal' | 'shield' | 'crown' | 'target' | 'book' | 'lightbulb' | 'heart' | 'fire' | 'sparkle' | 'rocket' | 'flag' | 'gem' | 'wand' => {
  const titleLower = title.toLowerCase();
  
  // Specific title matches
  if (titleLower.includes('first steps')) return 'star';
  if (titleLower.includes('streak')) return 'fire';
  if (titleLower.includes('champion') || titleLower.includes('master')) return 'crown';
  if (titleLower.includes('explorer')) return 'rocket';
  if (titleLower.includes('learner') || titleLower.includes('scholar')) return 'book';
  if (titleLower.includes('seeker') || titleLower.includes('brilliant')) return 'lightbulb';
  if (titleLower.includes('friend') || titleLower.includes('social')) return 'heart';
  if (titleLower.includes('magic') || titleLower.includes('wizard')) return 'wand';
  if (titleLower.includes('gem') || titleLower.includes('diamond')) return 'gem';
  if (titleLower.includes('goal') || titleLower.includes('target')) return 'target';
  if (titleLower.includes('milestone') || titleLower.includes('checkpoint')) return 'flag';
  if (titleLower.includes('power') || titleLower.includes('boost')) return 'sparkle';
  
  // Category-based defaults
  switch (category) {
    case 'routine':
      return 'medal';
    case 'products':
      return 'shield';
    case 'learning':
      return 'book';
    case 'social':
      return 'heart';
    case 'milestone':
      return 'trophy';
    case 'streak':
      return 'fire';
    default:
      return 'star';
  }
};

// Map achievement points/rarity to badge rarity
export const getAchievementRarity = (points: number): 'common' | 'rare' | 'epic' | 'legendary' => {
  if (points >= 100) return 'legendary';
  if (points >= 50) return 'epic';
  if (points >= 25) return 'rare';
  return 'common';
};
