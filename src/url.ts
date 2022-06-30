export const useUrl = () => {
    const shouldRegardAsExternalDomain = (target: URL, domainsRegardedAsExternal?: string[]): boolean => {
        if (typeof domainsRegardedAsExternal === 'undefined') {
            return false
        }

        return domainsRegardedAsExternal.some((domain) => {
            return target.hostname === domain
        })
    }

    /**
     * 自サイトのドメインかどうかを判定する（サブドメイン含む）
     */
    const isOwnedDomain = (baseUrl: URL, target: URL, domainsRegardedAsExternal?: string[]): boolean => {
        if (shouldRegardAsExternalDomain(target, domainsRegardedAsExternal)) {
            return false
        }

        // 正規表現で使われる文字種をエスケープ
        // cf. https://github.com/sindresorhus/escape-string-regexp
        const escapedOrigin = baseUrl.hostname.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        return target.hostname.search(`^(.+\\.)?${escapedOrigin}$`) !== -1
    }

    return {
        isOwnedDomain
    }
}
