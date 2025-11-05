/**
 * Template selection with weighted random for GFW resistance
 */

export interface TemplateWeight {
  id: number;
  weight: number;
}

// Weighted selection for generic protocol templates
// Total weight: 100
export const TEMPLATE_WEIGHTS: TemplateWeight[] = [
  { id: 1, weight: 30 },  // QUIC - universal, most common
  { id: 2, weight: 30 },  // KCP - made in China, gaming
  { id: 3, weight: 20 },  // Generic Gaming - flexible
  { id: 4, weight: 20 }   // WebRTC - communication, WeChat uses it
];

/**
 * Select random template ID using weighted probability
 */
export function selectRandomTemplate(): number {
  const totalWeight = TEMPLATE_WEIGHTS.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  
  for (const template of TEMPLATE_WEIGHTS) {
    random -= template.weight;
    if (random < 0) {
      return template.id;
    }
  }
  
  // Fallback (should never reach here)
  return 1;
}
