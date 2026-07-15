
export class CommonUtils {

    static CombineUrl = (urlPart1: string, urlPart2: string): string => {

        let p1 = urlPart1.trim();
        if (p1.endsWith('/')) {
            p1 = p1.substring(0, p1.length - 1);
        }

        let p2 = urlPart2.trim();
        if (p2.startsWith('/')) {
            p2 = p2.substring(1);
        }
        return p1 + '/' + p2;
    }
}