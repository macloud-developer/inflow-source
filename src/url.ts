export const useUrl = () => {
    /**
     * 自サイトのドメインかどうかを判定する（サブドメイン含む）
     */
    const isOwnedDomain = (baseUrl: URL, target: URL): boolean => {
        // 正規表現で使われる文字種をエスケープ
        // cf. https://github.com/sindresorhus/escape-string-regexp
        const escapedOrigin = baseUrl.hostname.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        return target.hostname.search(`^(.+\\.)?${escapedOrigin}$`) !== -1
    }

    return {
        isOwnedDomain
    }
}
