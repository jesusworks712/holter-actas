// Lienzo único para capturar firmas (dedo, mouse, lápiz digital o tableta).
// Coordenadas: posición CSS del puntero; el contexto se escala una sola vez con setTransform
// (buffer del canvas / tamaño CSS), así el trazo cae exactamente donde está el lápiz.
// Los trazos se guardan como puntos para redibujar sin pérdida al redimensionar.
// El lienzo NO bloquea otros controles: el trazo siempre termina al soltar el puntero.

export interface Lienzo {
  limpiar(): void;
  vacio(): boolean;
  aPng(): string;
  ajustar(): void; // llamar cuando el lienzo pasa de oculto a visible o cambia de tamaño
}

interface Punto { x: number; y: number }

export function crearLienzo(canvas: HTMLCanvasElement, grosor = 2.6): Lienzo {
  const ctx = canvas.getContext("2d")!;
  let trazos: Punto[][] = [];
  let actual: Punto[] | null = null;
  let ancho = 0;
  let alto = 0;

  const estilo = () => {
    ctx.lineWidth = grosor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0b1b40";
  };

  // Dibuja un trazo con curva cuadrática entre puntos medios (sin aristas en movimientos rápidos).
  const dibujar = (t: Punto[]) => {
    estilo();
    ctx.beginPath();
    ctx.moveTo(t[0].x, t[0].y);
    if (t.length === 1) {
      ctx.lineTo(t[0].x + 0.01, t[0].y + 0.01);
    } else {
      for (let i = 1; i < t.length - 1; i++) {
        const mx = (t[i].x + t[i + 1].x) / 2;
        const my = (t[i].y + t[i + 1].y) / 2;
        ctx.quadraticCurveTo(t[i].x, t[i].y, mx, my);
      }
      const ult = t[t.length - 1];
      ctx.lineTo(ult.x, ult.y);
    }
    ctx.stroke();
  };

  const redibujar = () => {
    ctx.clearRect(0, 0, ancho, alto);
    trazos.forEach(dibujar);
  };

  // Dimensiona el buffer según el DPR y redibuja lo ya firmado.
  const ajustar = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    ancho = r.width;
    alto = r.height;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    // setTransform reemplaza la matriz (no la acumula): no hay doble escala al redimensionar.
    ctx.setTransform(canvas.width / ancho, 0, 0, canvas.height / alto, 0, 0);
    redibujar();
  };

  // Si el lápiz se sale del recuadro, el trazo se queda en el borde (no se escapa).
  const punto = (e: PointerEvent): Punto => {
    const r = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const y = Math.min(Math.max(e.clientY - r.top, 0), r.height);
    return { x, y };
  };

  // Cierra el trazo y libera el puntero para que el resto de la página vuelva a responder.
  const terminar = (e?: PointerEvent) => {
    if (e && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    actual = null;
  };

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (e) => {
    if (!ancho) ajustar();
    if (e.button !== 0 && e.pointerType === "mouse") return; // solo botón principal del mouse
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* algunos navegadores no lo permiten */ }
    actual = [punto(e)];
    trazos.push(actual);
    dibujar(actual);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!actual) return;
    // Si el lápiz ya no toca la tableta (botones = 0), el trazo termina aquí.
    if (e.pointerType !== "touch" && e.buttons === 0) return terminar(e);
    // getCoalescedEvents: recupera los puntos intermedios del lápiz (mayor precisión).
    const eventos = e.getCoalescedEvents?.() ?? [e];
    eventos.forEach((ev) => actual!.push(punto(ev)));
    redibujar();
  });
  canvas.addEventListener("pointerup", (e) => terminar(e));
  canvas.addEventListener("pointercancel", (e) => terminar(e));
  canvas.addEventListener("lostpointercapture", () => terminar());
  // Salvaguarda: si el puntero se suelta fuera del lienzo, también se cierra el trazo.
  window.addEventListener("pointerup", () => terminar());
  window.addEventListener("pointercancel", () => terminar());

  window.addEventListener("resize", () => {
    if (canvas.isConnected) ajustar();
  });

  ajustar();

  return {
    ajustar,
    limpiar() {
      trazos = [];
      actual = null;
      redibujar();
    },
    vacio: () => trazos.length === 0,
    aPng() {
      // Presentación: se recorta el espacio vacío. Los puntos originales no se alteran.
      const { x, y, w, h } = recortar(canvas);
      const salida = document.createElement("canvas");
      salida.width = 600;
      salida.height = Math.max(1, Math.round((600 * h) / w));
      salida.getContext("2d")!.drawImage(canvas, x, y, w, h, 0, 0, salida.width, salida.height);
      return salida.toDataURL("image/png");
    },
  };
}

// Rectángulo mínimo que contiene el trazo (con margen), en píxeles del buffer.
function recortar(canvas: HTMLCanvasElement) {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: canvas.width, h: canvas.height };
  const m = Math.round(Math.max(canvas.width, canvas.height) * 0.02) + 2;
  const x = Math.max(0, minX - m);
  const y = Math.max(0, minY - m);
  return {
    x,
    y,
    w: Math.max(1, Math.min(canvas.width, maxX + m) - x),
    h: Math.max(1, Math.min(canvas.height, maxY + m) - y),
  };
}