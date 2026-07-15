export class QueryFilter {
    $skip?: number;  // Optional property; corresponds to int? in C#
    $top?: number;   // Optional property; corresponds to int? in C#

    constructor() {
        this.$skip = -1;
        this.$top = -1;
    }
}