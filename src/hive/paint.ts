import { hexVerts, type Point } from "./hex";

export type Ctx = CanvasRenderingContext2D;

export function addPoly(g: Ctx, v: readonly Point[]): void {
  v.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.closePath();
}

export function hexFill(g: Ctx, x: number, y: number, size: number, fill: string, stroke: string, lw: number, rot = 0) {
  g.beginPath();
  addPoly(g, hexVerts(x, y, size, rot));
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = lw;
  g.lineJoin = "miter";
  g.stroke();
}
