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

    const set = (currentDate: CustomDate, referer?: URL, currentUrl?: URL): void => {

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

        const setLastUrl = (currentUrl: URL | undefined): void => {
            if (typeof currentUrl === 'undefined') {
                return
            }

            /* privacy policy, cookie policyは corp サイトにあるので処理が走らないのでここのリストに入れない */
            const ignorePathRegexpList = [
                '/provisional_register.*',
                '/acquirer_register.*',
                '/connect_sns.*',
                '/definitive_register.*',
                '/terms_of_service.*',
                '/acquirer_terms.*',
                '/request_catalog.*',
                '/consulting_apply.*',
                '/offers/\\d+/consulting_apply.*',
                '/login.*',
                '/business/login.*'
            ]

            const isIgnorePathMatched = ignorePathRegexpList.some((ignorePathRegexp) => {
                return currentUrl.pathname.search(ignorePathRegexp) !== -1
            })
            if (isIgnorePathMatched) {
                return
            }

            storage.setItem('last_page_url', currentUrl.pathname)
        }

        setLastUrl(currentUrl)

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
        set
    }
}

// 過去の募集ページ被リンクに存在するdmaiパラメタのマッピング
const inboundLinkDmaiMap = {
    a6253af2818a6f: { company_id: 10984 },
    a6253ae8f8d8aa: { company_id: 10984 },
    a6246861584662: { company_id: 11132 },
    a624685a2923bc: { company_id: 11132 },
    a624658a1d8627: { company_id: 8297 },
    a62440fa80986a: { company_id: 11277 },
    a62440f30c22bd: { company_id: 11277 },
    a62415a1fc7a29: { company_id: 11099 },
    a62415880173b3: { company_id: 11099 },
    a62395e6374311: { company_id: 11179 },
    a620af76ad3ddf: { company_id: 9462 },
    a620af6f31bebf: { company_id: 9462 },
    a6203769665619: { company_id: 7747 },
    a61f2027f937c3: { company_id: 10127 },
    a61f1e84fc3fc5: { company_id: 9837 },
    a61f1e7dc55152: { company_id: 9837 },
    a61f10d5e80b42: { company_id: 9034 },
    a61f10d03bbef2: { company_id: 9034 },
    a61f0cb93b75a3: { company_id: 10162 },
    a61e66528979fa: { company_id: 9912 },
    a61e664c2dccf3: { company_id: 9912 },
    a61e64a205e402: { company_id: 9744 },
    a61de5d5a4f280: { company_id: 70 },
    a61d69cf9b51e4: { company_id: 9776 },
    a61aeeba33ec25: { company_id: 9365 },
    a61aeeb3c64994: { company_id: 9365 },
    a619b42d263962: { company_id: 9348 },
    a61975b0223fe0: { company_id: 9067 },
    a61975a971f78b: { company_id: 9067 },
    a61959e3d1bc27: { company_id: 8995 },
    a6194952732edd: { company_id: 9348 },
    a619494c7c2b2f: { company_id: 9348 },
    a618ca2b789b5d: { company_id: 8766 },
    a616e1f07d72b8: { company_id: 8961 },
    a616645599b974: { company_id: 8873 },
    a6152659510136: { company_id: 8570 },
    a61495f6c336ba: { company_id: 6002 },
    a6135b606a4908: { company_id: 7777 },
    a612d7b02f2a41: { company_id: 7097 },
    a611b1210b9e4e: { company_id: 3986 },
    a611b04a93af19: { company_id: 7063 },
    a6119d815d6c17: { company_id: 8148 },
    a6115bcb77d6c7: { company_id: 8141 },
    a60f510096a455: { company_id: 7661 },
    a60efe8e72ff9f: { company_id: 7365 },
    a60efde1e5bf39: { company_id: 7898 },
    a60dc037301270: { company_id: 7147 },
    a60d58b9d00b8b: { company_id: 7344 },
    a60d41d9471f8a: { company_id: 7206 },
    a60d13374e6320: { company_id: 7552 },
    a60d1308e31084: { company_id: 7478 },
    a60c4821f0e2ef: { company_id: 155 },
    a609e0d743ea48: { company_id: 7204 },
    a609dd4f45b9a8: { company_id: 7055 },
    a6087788065ba0: { company_id: 6896 },
    a6086039cb1b07: { company_id: 6086 },
    a60813290ed484: { company_id: 278 },
    a6080dd8a1289b: { company_id: 60 },
    a6080c979255cd: { company_id: 6430 },
    a607f72412b4a5: { company_id: 457 },
    a607ccfd8b91b5: { company_id: 6334 },
    a6076674d8166f: { company_id: 5702 },
    a606fe3df34356: { company_id: 4461 },
    a606fab3dd9ed0: { company_id: 5990 },
    a606e99d761b7a: { company_id: 6525 },
    a603de554ef237: { company_id: 5385 },
    a603bad0044377: { company_id: 169 },
    a603ba974bd1c7: { company_id: 5675 },
    a6038d0366c661: { company_id: 5384 },
    a6038cd2393eee: { company_id: 161 },
    a602fbcf3c819a: { company_id: 5383 },
    a602f1b7fdea40: { company_id: 5807 },
    a602e613b9cc34: { company_id: 5382 },
    a602cc65571b6f: { company_id: 3886 },
    a6020f6f4a6ebe: { company_id: 4308 },
    a601d2a253be33: { company_id: 589 },
    a601b951a075d6: { company_id: 5450 },
    a601a4d0c37e58: { company_id: 151 },
    a6019f91b5d866: { company_id: 5471 },
    a60180b6f3329e: { company_id: 5434 },
    a601267f1934e3: { company_id: 4826 },
    a6009929fa3fce: { company_id: 127 },
    a6007e6b384de8: { company_id: 141 },
    a600693131da7b: { company_id: 4511 },
    a60055130ccca2: { company_id: 157 },
    a60018417b021c: { company_id: 230 },
    a60017e45a5217: { company_id: 234 },
    a5ffd7f9e25065: { company_id: 140 },
    a5ffd265631916: { company_id: 4838 },
    a5ffd22dfcd40c: { company_id: 4966 },
    a5ff6ee60831bb: { company_id: 173 },
    a5fe9315589e41: { company_id: 310 },
    a5fe469dc23cc2: { company_id: 4501 },
    a5fdc85cab8638: { company_id: 3414 },
    a5fd359a058499: { company_id: 3127 },
    a5fd198c46588c: { company_id: 3100 },
    a5fd17955f0b38: { company_id: 4822 },
    a5fcf3870a0b7c: { company_id: 4785 },
    a5fca054782713: { company_id: 4254 },
    a5fc98c40d18c2: { company_id: 430 },
    a5fb73f7141006: { company_id: 528 },
    a5fb5c91e1996f: { company_id: 609 },
    a5fb31d439302c: { company_id: 596 },
    a5faa2f8dbb9eb: { company_id: 4212 },
    a5fa271719400e: { company_id: 3272 },
    a5fa1f77c2b6c1: { company_id: 4758 },
    a5f9fada8511b9: { company_id: 3563 },
    a5f8ffec1241fc: { company_id: 3323 },
    a5f8f900d87673: { company_id: 4762 },
    a5f8aa20f8bd02: { company_id: 3772 },
    a5f8713ec20f0c: { company_id: 4596 },
    a5f865adc03edd: { company_id: 4161 },
    a5f83ea990c9db: { company_id: 4256 },
    a5f7ea0f115267: { company_id: 4512 },
    a5f7c16fb22df6: { company_id: 4243 },
    a5f4f725b54393: { company_id: 3547 },
    a5f3e4f78427e0: { company_id: 3873 },
    a5f3e2e07a31b9: { company_id: 3101 },
    a5f3b2ededee49: { company_id: 4255 },
    a5f1e55c3544f8: { company_id: 3576 },
    a5eec4c508dd8c: { company_id: 95 }
}
