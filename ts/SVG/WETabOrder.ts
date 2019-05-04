export type TTabOrder = number[];
type TTabOrderEntry = { name: string, order: TTabOrder };

export interface ITabOrder {
    getName() : string;
    getOrder() : Promise<TTabOrder>
}

/*
    La tabulación va de oeste a este
*/
export class WETabOrder implements ITabOrder {
    private name : string;
    private order : TTabOrder;

    constructor(name) {
        this.name = name;
        this.order = [];
    }

    getName() : string {
        return this.name;
    }

    getOrder() : Promise<TTabOrder> {
        if (this.order.length > 0) {
            return new Promise((success, error) => {
                success(this.order);
            });
        }

        return new Promise((success, error) => {
            fetch('/map/data/tab/we/').then((raw) => {
                return raw.json();
            }).then((data) => {
                for (let i = 0; i < data.length; i++) {
                    this.order.push(data[i]);
                }

                success(this.order); 
            });
        });
    }
}