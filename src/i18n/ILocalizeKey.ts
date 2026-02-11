/**
 * The structure of the localization entity.
 * This interface should match the structure of your translation JSON files.
 */
interface LocalizeEntity {
    settings: {
        folders: {
            tasks: {
                name: string,
                description: string
            }
        }
    }
}

/**
 * Utility type to recursively enumerate all dot-separated keys of an object.
 * For example, { a: { b: { c: string } } } becomes "a.b.c".
 */
type DotKeys<T, Prefix extends string = ''> = {
    [K in keyof T]: T[K] extends object
        ? DotKeys<T[K], `${Prefix}${K & string}.`>
        : `${Prefix}${K & string}`
}[keyof T];

/**
 * Type representing all valid localization keys, based on LocalizeEntity.
 */
export type Keys = DotKeys<LocalizeEntity>;
