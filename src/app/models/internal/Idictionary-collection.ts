export interface IDictionaryCollection<K, V> {
    Add(key: K, value: V): any;
    ContainsKey(key: K): boolean;
    Count(): number;
    Item(key: K): V;
    Keys(): K[];
    Remove(key: K): V;
    Values(): V[];
}
