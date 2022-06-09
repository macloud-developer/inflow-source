import useDate, { CustomDate } from './date'
import { useUserAgent } from './user-agent'

export type InflowSourceParams = {
    referer: string | null,
    landingPageUrl: string | null,
    utmSource: string | null,
    utmMedium: string | null,
    utmCampaign: string | null,
    utmContent: string | null,
    gclid: string | null,
    lastPageUrl: string | null,
    device: string
}

// 過去の募集ページ被リンクに存在するdmaiパラメタのマッピング
export interface InboundLinkDmaiMap {
    [dmai: string]: { company_id: number }
}

export const useInflowSource = (storage: Storage, baseUrl: URL) => {
    const landingKey = 'landing'

    const canonicalBaseUrl = (): string => baseUrl.origin

    const getAllParams = (): InflowSourceParams => {
        return {
            referer: storage.getItem('referer'),
            landingPageUrl: storage.getItem('landing_page_url'),
            utmSource: storage.getItem('utm_source'),
            utmMedium: storage.getItem('utm_medium'),
            utmCampaign: storage.getItem('utm_campaign'),
            utmContent: storage.getItem('utm_content'),
            gclid: storage.getItem('gclid'),
            lastPageUrl: storage.getItem('last_page_url'),
            device: useUserAgent().getDevice()
        }
    }

    const setLastUrl = (currentUrl: URL | undefined, ignorePathRegexpList: string[]): void => {
        ignorePathRegexpList = ignorePathRegexpList ?? []
        if (typeof currentUrl === 'undefined') {
            return
        }

        const isIgnorePathMatched = ignorePathRegexpList.some((ignorePathRegexp) => {
            return currentUrl.pathname.search(ignorePathRegexp) !== -1
        })
        if (isIgnorePathMatched) {
            return
        }

        storage.setItem('last_page_url', currentUrl.pathname)
    }

    const set = (
        currentDate: CustomDate,
        referer?: URL,
        currentUrl?: URL,
        inboundLinkDmaiMap?: InboundLinkDmaiMap
    ): void => {
        inboundLinkDmaiMap = inboundLinkDmaiMap ?? {}
        const hasInboundLinkDmai = (landingPageUrl: URL): boolean => {
            const dmai = landingPageUrl.searchParams.get('dmai')
            if (!dmai) {
                return false
            }
            return Object.keys(inboundLinkDmaiMap).includes(dmai)
        }
        const getCompanyIdFromDmaiMap = (landingPageUrl: URL): number | null => {
            const dmai = landingPageUrl.searchParams.get('dmai') as keyof typeof inboundLinkDmaiMap
            if (!dmai) {
                return null
            }
            return inboundLinkDmaiMap[dmai].company_id
        }

        if (isLanding(currentDate, referer, currentUrl)) {
            if (typeof referer !== 'undefined' && referer.origin !== canonicalBaseUrl()) {
                storage.setItem('referer', referer.origin + referer.pathname)
            }

            if (typeof currentUrl !== 'undefined') {
                storage.setItem('landing_page_url', currentUrl.pathname)

                if (isUtmParameterSet(currentUrl)) {
                    clearUtmParameter()
                }

                // 被リンクとして配っているdmaiがきたら
                if (hasInboundLinkDmai(currentUrl)) {
                    const companyId = getCompanyIdFromDmaiMap(currentUrl)
                    storage.setItem('utm_source', 'referral')
                    storage.setItem('utm_medium', 'bs')
                    storage.setItem('utm_content', companyId !== null ? String(companyId) : '')
                } else {
                    setFromQueryParams('utm_source', currentUrl)
                    setFromQueryParams('utm_medium', currentUrl)
                    setFromQueryParams('utm_campaign', currentUrl)
                    setFromQueryParams('utm_content', currentUrl)
                    setFromQueryParams('gclid', currentUrl)
                }
            }
        }

        // isLanding の判定に前回の last_visited_at の値を使うので、 isLanding より前に移動させないこと
        storage.setItem('last_visited_at', currentDate.format('YYYY-MM-DD HH:mm:ss'))
    }

    /**
     * 以下の両方の条件を満たす場合にランディングと判定する
     * 1. ランディング判定から除外する対象のページでないこと（landing=false クエリパラメータがあるとランディングとしない）
     * 2. 以下のいずれかの条件を満たす
     *   a. 初訪問
     *   b. 最後に訪問してから30分以上経過
     *   c. 新しいチャネル情報を持つ
     */
    const isLanding = (currentDate: CustomDate, referer?: URL, landingPageUrl?: URL): boolean => {
        const hasLandingSkipKey = (landingPageUrl: URL) => {
            if (!landingPageUrl.searchParams.has(landingKey)) {
                return false
            }
            return landingPageUrl.searchParams.get(landingKey) === 'false'
        }

        if (typeof landingPageUrl === 'undefined') {
            return false
        }

        if (hasLandingSkipKey(landingPageUrl)) {
            return false
        }

        const rawLastVisitedAt = storage.getItem('last_visited_at')
        if (rawLastVisitedAt === null) {
            return true
        }

        const lastVisitedAt = useDate().create(rawLastVisitedAt)
        if (currentDate.isAfter(lastVisitedAt.add(30, 'minute'))) {
            return true
        }

        if (typeof referer !== 'undefined' && referer.origin !== canonicalBaseUrl()) {
            return true
        }

        if (
            landingPageUrl.searchParams.get('utm_source') ||
            landingPageUrl.searchParams.get('utm_medium') ||
            landingPageUrl.searchParams.get('utm_campaign') ||
            landingPageUrl.searchParams.get('utm_content') ||
            landingPageUrl.searchParams.get('gclid') ||
            landingPageUrl.searchParams.get('dmai')
        ) {
            return true
        }

        return false
    }

    const isUtmParameterSet = (landingPageUrl: URL) => {
        return (
            landingPageUrl.searchParams.get('utm_source') ||
            landingPageUrl.searchParams.get('utm_medium') ||
            landingPageUrl.searchParams.get('utm_campaign') ||
            landingPageUrl.searchParams.get('utm_content')
        )
    }

    const clearUtmParameter = () => {
        storage.removeItem('utm_source')
        storage.removeItem('utm_medium')
        storage.removeItem('utm_campaign')
        storage.removeItem('utm_content')
    }

    const setFromQueryParams = (key: string, landingPageUrl: URL): void => {
        const value = landingPageUrl.searchParams.get(key)

        if (value === null) {
            return
        }

        storage.setItem(key, value)
    }

    return {
        getAllParams,
        set,
        setLastUrl
    }
}
