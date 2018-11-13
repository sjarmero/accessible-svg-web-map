// Devuelve el ángulo entre dos puntos en radianes
export function angulo(p1, p2) {
    /*
    let x = v1.x - v2.x;
    let y = v1.y - v2.y;
    let t = Math.atan2(y, x);
    let a = (t * (180 / Math.PI)) % 360;

    return (a < 0) ? a + 360 : a;*/
    var h = { x: p1.x, y: p2.y };
    var a = { x: (h.x - p1.x), y: (h.y - p1.y) };
    var b = { x: (h.x - p2.x), y: (h.y - p2.y) };
    var c = { x: (p2.x - p1.x), y: (p2.y - p1.y) };
    var alpha = Math.atan2(modulo(b), modulo(a));
    /*SVGMap.instance.svg.line(p1.x, p1.y, h.x, h.y).stroke({ width: 1, color: 'pink'});
    SVGMap.instance.svg.line(p2.x, p2.y, h.x, h.y).stroke({ width: 1, color: 'yellow'});
    SVGMap.instance.svg.line(p1.x, p1.y, p2.x, p2.y).stroke({ width: 1, color: 'red'});*/
    return alpha;
}
// Grados a rotar el mapa para que desde A se mire a P
// Habrá que añadirle el ángulo calculado entre P y A
export function perspectiva(p, a) {
    var ydiff = p.y - a.y;
    var xdiff = p.x - a.x;
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
        }
        else {
            return 0;
        }
    }
    else {
        if (xdiff > 0) {
            return 270;
        }
        else {
            return 90;
        }
    }
}
export function toDeg(rad) {
    return rad * 180 / Math.PI;
}
export function toRad(deg) {
    return deg * Math.PI / 180;
}
export function modulo(v) {
    return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
}
// cx y cy son puntos de pivote, respecto a los que rotar
export function rotar(x, y, cx, cy, degrees) {
    var rad = toRad(degrees);
    degrees = parseFloat(degrees);
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    // translate point back to origin:
    var tx = x - cx;
    var ty = y - cy;
    // rotate point
    var xnew = (tx * c) - (ty * s);
    var ynew = (tx * s) + (ty * c);
    return [(xnew + cx), (ynew + cy)];
}
