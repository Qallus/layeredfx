/** One-pixel cross dilation/erosion of alpha. Read a snapshot so edits never cascade. */
export function morphAlpha(data: Uint8ClampedArray, width: number, height: number, grow: boolean) {
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const a=alpha[i],left=x?alpha[i-1]:0,right=x+1<width?alpha[i+1]:0,up=y?alpha[i-width]:0,down=y+1<height?alpha[i+width]:0;
    data[i*4+3]=grow?Math.max(a,left,right,up,down):Math.min(a,left,right,up,down);
  }
}
