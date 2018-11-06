interface Punto {
    x : number;
    y : number;
}
// Devuelve el ángulo entre dos puntos en radianes
export function angulo(p1 : Punto, p2 : Punto) : number {
    /*
    let x = v1.x - v2.x;
    let y = v1.y - v2.y;
    let t = Math.atan2(y, x);
    let a = (t * (180 / Math.PI)) % 360;

    return (a < 0) ? a + 360 : a;*/

    let h = {x: p1.x, y: p2.y};

    let a = {x: (h.x - p1.x), y: (h.y - p1.y)};
    let b = {x: (h.x - p2.x), y: (h.y - p2.y)};
    let c = {x: (p2.x - p1.x), y: (p2.y - p1.y)};
    let alpha = Math.atan2(modulo(b), modulo(a));

    /*SVGMap.instance.svg.line(p1.x, p1.y, h.x, h.y).stroke({ width: 1, color: 'pink'});
    SVGMap.instance.svg.line(p2.x, p2.y, h.x, h.y).stroke({ width: 1, color: 'yellow'});
    SVGMap.instance.svg.line(p1.x, p1.y, p2.x, p2.y).stroke({ width: 1, color: 'red'});*/

    return alpha;
}

// Grados a rotar el mapa para que desde A se mire a P
// Habrá que añadirle el ángulo calculado entre P y A
export function perspectiva(p : Punto, a : Punto) : number {
    let ydiff = p.y - a.y;
    let xdiff = p.x - a.x;

    console.log('perspectiva', xdiff, ydiff);

    /*if (Math.abs(xdiff) <= 50) {
        if (ydiff > 0) {
            return 180;
        } else {
            return 0;
        }
    } else {
        if (xdiff > 0) {
            return 270;
        } else {
            return 90;
        }
    }*/

    if (Math.abs(ydiff) > Math.abs(xdiff)) {
        if (ydiff > 0) {
            return 180;
        } else {
            return 0;
        }
    } else {
        if (xdiff > 0) {
            return 270;
        } else {
            return 90;
        }
    }
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
    let rad = toRad(degrees);
    degrees = parseFloat(degrees);

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