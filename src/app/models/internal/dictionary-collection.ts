import { IDictionaryCollection } from './Idictionary-collection';

// the K should always be string , no way  to enforce it though
export class DictionaryCollection<K, V> implements IDictionaryCollection<string, V> {
    private items: { [index: string]: V } = {};

    private count = 0;

    public ContainsKey(key: string): boolean {
        return this.items.hasOwnProperty(key);
    }

    public Count(): number {
        return this.count;
    }
    public Add(key: string, value: V) {
        if (!this.items.hasOwnProperty(key)) {
            this.count++;
        }

        this.items[key] = value;
    }

    public Remove(key: string): V {
        const val = this.items[key];
        delete this.items[key];
        this.count--;
        return val;
    }

    public Item(key: string): V {
        return this.items[key];
    }

    public Keys(): string[] {
        const keySet: string[] = [];

        for (const prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                keySet.push(prop);
            }
        }

        return keySet;
    }

    public Values(): V[] {
        const values: V[] = [];
        for (const prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                values.push(this.items[prop]);
            }
        }
        return values;
    }
}
