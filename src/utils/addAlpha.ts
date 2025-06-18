/**
 * 将 16进制颜色字符串 转为 rgba + alpha
 * @param color 形如 "#00ff00" 或 "#00ff00ff"
 * @param alpha 0~1
 */
export function addAlpha(color: string, alpha: number): string {
    let r = 0, g = 0, b = 0;
  
    if (color.startsWith('#')) {
      if (color.length === 7) {
        // #rrggbb
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      } else if (color.length === 4) {
        // #rgb
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      }
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }
  