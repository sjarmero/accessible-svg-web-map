const PROJECTION_DEVIATION : number = 17;
const SYSTEM_ADJUSTMENT : number = 90;

interface Punto {
    x : number;
    y : number;
}

// Devuelve el ángulo entre dos puntos en radianes
export function angulo(p1 : Punto, p2 : Punto) : number {
    let h = {x: p1.x, y: p2.y};

    let a = {x: (h.x - p1.x), y: (h.y - p1.y)};
    let b = {x: (h.x - p2.x), y: (h.y - p2.y)};
    let c = {x: (p2.x - p1.x), y: (p2.y - p1.y)};
    let alpha = Math.atan2(modulo(b), modulo(a));

    return alpha;
}

// Grados a rotar el mapa para que desde A se mire a P
// Habrá que añadirle el ángulo calculado entre P y A
export function posicion(p : Punto, a : Punto) : number {
    let ydiff = p.y - a.y;
    let xdiff = p.x - a.x;

    let phase = 0;
    if (Math.abs(ydiff) > Math.abs(xdiff)) {
        if (ydiff > 0) {
            phase = 180;
        } else {
            phase = 0;
        }
    } else {
        if (xdiff > 0) {
            phase = 270;
        } else {
            phase = 90;
        }
    }

    return phase;
}

// Devuelve el ángulo en el cuadrante completo
export function angulo2(anchor : Punto, target : Punto) : number {
    return Math.atan2(target.y - anchor.y, target.x - anchor.x);
}

// Devuelve el ángulo que el usuario debe girar orientado al norte del sistema
export function perspectiva2(s : Punto, a : Punto) : number {
    s.y = Math.abs(s.y);
    a.y = Math.abs(a.y);

    let alpha : number = toDeg(angulo2(a, s));
    alpha = (alpha < 0) ? 360 + alpha : alpha;
    const P : number = (alpha - SYSTEM_ADJUSTMENT) - PROJECTION_DEVIATION;
    return P;
}

export function toDeg(rad : number) : number {
    return rad * 180 / Math.PI;
}

export function toRad(deg : number) :number {
    return deg * Math.PI / 180;
}

export function modulo(v : Punto) {
    return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
}

// cx y cy son puntos de pivote, respecto a los que rotar
export function rotar(x, y, cx, cy, degrees) : [number, number] {
    degrees = parseFloat(degrees);

    let rad = toRad(degrees);

    let s = Math.sin(rad);
    let c = Math.cos(rad);

    // translate point back to origin:
    let tx = x - cx;
    let ty = y - cy;

    // rotate point
    let xnew = (tx * c) - (ty * s);
    let ynew = (tx * s) + (ty * c);

    return [(xnew + cx), (ynew + cy)];
}