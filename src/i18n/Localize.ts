import i18next from "i18next";
import { Keys } from "./ILocalizeKey";

export class Localize {
    private relativeLocalizeJsonRootPath: string;

    /**
     * Initialize i18n
     * @param lng language
     * @param relativeLocalizeJsonRootPath Relative path to assets/i18n
     * @param isDebug debug i18next
     * @param readRelativeLocal Function to read a file (relativePath: string) => Promise<string>
     * @returns 
     */
    static async Initialize(
        lng: string,
        relativeLocalizeJsonRootPath: string,
        isDebug: boolean,
        readRelativeLocal: (relativePath: string) => Promise<string>
    ): Promise<Localize> {

        // create asset path for the localize JSON root
        const relativeJapaneseLocalizePath = `${relativeLocalizeJsonRootPath}/ja.json`;

        // read the Japanese translations from the specified path
        const ja = JSON.parse(await readRelativeLocal(relativeJapaneseLocalizePath));

        // initialize i18next with the Japanese translations
        await i18next.init({
            lng: lng,
            fallbackLng: 'ja',
            resources: {
                ja: {
                    translation: ja
                }
            },
            debug: isDebug,
            interpolation: {
                escapeValue: false,
            },
        });

        return new Localize(relativeLocalizeJsonRootPath);
    }

    /**
     * Translate a key to the current language
     * @param key The key to translate
     * @returns The translated string
     */
    public Translation(key: Keys): string {
        return i18next.t(key);
    }

    /**
     * Get the relative path to the localize JSON root
     * @returns The relative path
     */
    private constructor(relativeLocalizeJsonRootPath: string) {
        this.relativeLocalizeJsonRootPath = relativeLocalizeJsonRootPath;
    }
}
