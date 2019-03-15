export type TTabOrder = Map<number, number>;
type TTabOrderEntry = { name: string, order: TTabOrder };

export interface ITabOrder {
    getName() : string;
    getOrder() : Promise<TTabOrder>
}

/*
    La tabulación va de Oeste a Este
*/
export class WETabOrder implements ITabOrder {
    private name : string;
    private order : TTabOrder;

    constructor(name) {
        this.name = name;
        this.order = new Map<number, number>();
    }

    getName() : string {
        return this.name;
    }

    getOrder() : Promise<TTabOrder> {
        if (this.order.size > 0) {
            return new Promise((success, error) => {
                success(this.order);
            });
        }

        return new Promise((success, error) => {
            fetch('/map/data/tab/we/').then((raw) => {
                return raw.json();
            }).then((data) => {
                for (const k of Object.keys(data)) {
                    this.order.set(parseInt(k), data[k]);
                }

                success(this.order); 
            });
        });
    }
}