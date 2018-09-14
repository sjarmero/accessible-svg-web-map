export const main_grammar = `#JSGF V1.0 UTF-8 es;
grammar main;

<move_action> = Mover;
<move_link> = a | hacia | para;
<move_direction> = izquierda | derecha | arriba | abajo;

public <pan> = <move> (mapa)* <move_link> <move_direction>;
public <zoom> = (Acercar | Alejar) (mapa)*;
`;