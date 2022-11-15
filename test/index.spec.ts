import { useInflowSource } from '~/index'
import useDate from '~/date'
import { JSDOM } from "jsdom"

const dom = new JSDOM()
global.document = dom.window.document
global.window = dom.window as unknown as Window & typeof globalThis

describe('~/index', () => {
    const localStorage = () => {
        const storage: { [key: string]: string } = {}
        const clear = () => {
            for (const key in storage) {
                removeItem(key)
            }
        }
        const getItem = (key: string): string | null => {
            return storage[key] ?? null
        }
        const setItem = (key: string, value: string): void => {
            storage[key] = value
        }
        const removeItem = (key: string): void => {
            delete storage[key];
        }
        return {
            clear,
            getItem,
            setItem,
            removeItem
        }
    }

    const storage = localStorage() as Storage
    const inflowSource = useInflowSource(storage, new URL('https://macloud.jp'))

    beforeEach(() => {
        Object.defineProperty(global.document, 'referrer', { value: 'https://referrer.test/', configurable: true })
        storage.clear()
    })

    test('determine as landing after 30 minutes', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar'),
            new URL('https://macloud.jp/offers')
        )

        // 前回の訪問から30分経過していないのでランディングではない判定
        inflowSource.set(
            useDate().create('2022-03-09 00:30:00'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/interviews')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/offers')

        // 前回の訪問から30分経過していないのでランディングではない判定
        inflowSource.set(
            useDate().create('2022-03-09 01:00:00'),
            new URL('https://macloud.jp/interviews'),
            new URL('https://macloud.jp/documents')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/offers')

        // 前回の訪問から30分経過したのでランディング判定
        inflowSource.set(
            useDate().create('2022-03-09 01:30:01'),
            new URL('https://macloud.jp/documents'),
            new URL('https://macloud.jp/ma_diagnosis')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/ma_diagnosis')
    })

    test('determine as landing by referrer domain', () => {
        const inflowSource = useInflowSource(
            storage,
            new URL('https://macloud.jp'),
            {
                domainsRegardedAsExternal: ['external.macloud.jp']
            }
        )

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar'),
            new URL('https://macloud.jp/offers')
        )

        // referer がサブドメインの場合はランディング判定しない
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://corp.macloud.jp/foo/bar'),
            new URL('https://macloud.jp/interviews')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/offers')

        // 30分経過していないが、 referer のドメインが domainsRegardedAsExternal に含まれるのでランディング判定
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://external.macloud.jp/foo/bar'),
            new URL('https://macloud.jp/interviews')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/interviews')

        // 30分経過していないが、 referer が外部サイトなのでランディング判定
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://google.com/foo/bar'),
            new URL('https://macloud.jp/interviews/1')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/interviews/1')
    })

    test('determine as landing by utm parameters or gclid', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar'),
            new URL('https://macloud.jp/offers')
        )

        // 30分経過していないが、新しい UTM パラメータなのでランディング判定
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/documents?utm_source=newsletter1')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/documents')

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/documents/1?utm_medium=email')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/documents/1')

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/documents/2?utm_campaign=summer-sale')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/documents/2')

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/documents/3?utm_content=toplink')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/documents/3')

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/documents/4?gclid=Tester123')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/documents/4')
    })

    test('not determine when landing parameter is false', () => {
        // 初回だから保存する
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/offers')
        )
        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/offers')

        // 新しい外部サイトの referer だが、特別なクエリパラメータが付与されている場合は更新しない
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://www.facebook.com/foo/bar'),
            new URL('https://macloud.jp/connect_sns?landing=false')
        )
        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/offers')
    })

    test('set referrer is undefined', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('https://macloud.jp/offers')
        )

        expect(storage.getItem('referer')).toBe('https://referrer.test/')
    })

    test('save only current date', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            undefined
        )

        expect(storage.getItem('referer')).toBeNull()
        expect(storage.getItem('landing_page_url')).toBeNull()
        expect(storage.getItem('utm_source')).toBeNull()
        expect(storage.getItem('utm_medium')).toBeNull()
        expect(storage.getItem('utm_campaign')).toBeNull()
        expect(storage.getItem('utm_content')).toBeNull()
        expect(storage.getItem('gclid')).toBeNull()
        expect(storage.getItem('last_page_url')).toBeNull()
    })

    test('save all', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar?a=b&c=d'),
            new URL('https://macloud.jp/baz/qux?utm_source=newsletter1&utm_medium=email&utm_campaign=summer-sale&utm_content=toplink&gclid=Tester123')
        )
        expect(storage.getItem('last_visited_at')).toBe('2022-03-09 00:00:00')
        expect(storage.getItem('referer')).toBe('https://twitter.com/foo/bar')
        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/baz/qux')
        expect(storage.getItem('utm_source')).toBe('newsletter1')
        expect(storage.getItem('utm_medium')).toBe('email')
        expect(storage.getItem('utm_campaign')).toBe('summer-sale')
        expect(storage.getItem('utm_content')).toBe('toplink')
        expect(storage.getItem('gclid')).toBe('Tester123')
        expect(storage.getItem('last_page_url')).toBe('https://macloud.jp/baz/qux')
    })

    test('not update when new value is null', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar?a=b&c=d'),
            new URL('https://macloud.jp/baz/qux?utm_source=newsletter1&utm_medium=email&utm_campaign=summer-sale&utm_content=toplink&gclid=Tester123')
        )

        inflowSource.set(
            // ランディングの条件（30分経過）を満たすようにする
            useDate().create('2022-03-09 00:30:01'),
            new URL('https://twitter.com/foo/bar?a=b&c=d'),
            new URL('https://macloud.jp/baz/qux')
        )

        expect(storage.getItem('referer')).toBe('https://twitter.com/foo/bar')
        expect(storage.getItem('utm_source')).toBe('newsletter1')
        expect(storage.getItem('utm_medium')).toBe('email')
        expect(storage.getItem('utm_campaign')).toBe('summer-sale')
        expect(storage.getItem('utm_content')).toBe('toplink')
        expect(storage.getItem('gclid')).toBe('Tester123')
    })

    test('not update when new referer is owned domain', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar?a=b&c=d'),
            new URL('https://macloud.jp/offers')
        )

        inflowSource.set(
            // ランディングの条件（30分経過）を満たすようにする
            useDate().create('2022-03-09 00:30:01'),
            new URL('https://macloud.jp/offers'),
            new URL('https://macloud.jp/interviews')
        )

        expect(storage.getItem('referer')).toBe('https://twitter.com/foo/bar')
    })

    test('get params', () => {
        expect(inflowSource.getAllParams()).toEqual({
            referer: null,
            landingPageUrl: null,
            utmSource: null,
            utmMedium: null,
            utmCampaign: null,
            utmContent: null,
            gclid: null,
            lastPageUrl: null,
            device: 'pc'
        })

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar?a=b&c=d'),
            new URL('https://macloud.jp/baz/qux?utm_source=newsletter1&utm_medium=email&utm_campaign=summer-sale&utm_content=toplink&gclid=Tester123')
        )

        expect(inflowSource.getAllParams()).toEqual({
            referer: 'https://twitter.com/foo/bar',
            landingPageUrl: 'https://macloud.jp/baz/qux',
            utmSource: 'newsletter1',
            utmMedium: 'email',
            utmCampaign: 'summer-sale',
            utmContent: 'toplink',
            gclid: 'Tester123',
            lastPageUrl: 'https://macloud.jp/baz/qux',
            device: 'pc'
        })
    })

    test('clear utm parameters when partial utm parameter set', () => {
        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar?a=b&c=d'),
            new URL('https://macloud.jp/baz/qux?utm_source=newsletter1&utm_medium=email&utm_campaign=summer-sale&utm_content=toplink&gclid=Tester123')
        )

        expect(storage.getItem('landing_page_url')).toBe('https://macloud.jp/baz/qux')
        expect(storage.getItem('utm_source')).toBe('newsletter1')
        expect(storage.getItem('utm_medium')).toBe('email')
        expect(storage.getItem('utm_campaign')).toBe('summer-sale')
        expect(storage.getItem('utm_content')).toBe('toplink')
        expect(storage.getItem('gclid')).toBe('Tester123')

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            new URL('https://twitter.com/foo/bar?a=b&c=d'),
            new URL('https://macloud.jp/baz/qux?utm_source=updated')
        )

        expect(storage.getItem('utm_source')).toBe('updated')
        expect(storage.getItem('utm_medium')).toBeNull()
        expect(storage.getItem('utm_campaign')).toBeNull()
        expect(storage.getItem('utm_content')).toBeNull()
        expect(storage.getItem('gclid')).toBe('Tester123')
    })

    test('has not matched inbound link dmai', () => {
        const inflowSource = useInflowSource(
            storage,
            new URL('https://macloud.jp'),
            {
                inboundLinkDmaiMap: {
                    a6253af2818a6f: { company_id: 10984 },
                }
            },
        )

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('http://localhost/offers?dmai=dummy'),
        )

        expect(storage.getItem('utm_source')).toBeNull()
    })

    test('has matched inbound link dmai', () => {
        const inflowSource = useInflowSource(
            storage,
            new URL('https://macloud.jp'),
            {
                inboundLinkDmaiMap: {
                    a6253af2818a6f: { company_id: 10984 },
                    a6246861584662: { company_id: 11132 },
                }
            },
        )

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('http://localhost/offers?dmai=a6253af2818a6f'),
        )

        expect(storage.getItem('utm_source')).toBe('referral')
        expect(storage.getItem('utm_medium')).toBe('bs')
        expect(storage.getItem('utm_content')).toBe('10984')

        inflowSource.set(
            useDate().create('2022-03-09 00:00:01'),
            undefined,
            new URL('http://localhost/offers?dmai=a6246861584662'),
        )

        expect(storage.getItem('utm_source')).toBe('referral')
        expect(storage.getItem('utm_medium')).toBe('bs')
        expect(storage.getItem('utm_content')).toBe('11132')
    })

    test('has matched inbound link dmai and utm', () => {
        const inflowSource = useInflowSource(
            storage,
            new URL('https://macloud.jp'),
            {
                inboundLinkDmaiMap: {
                    a6253af2818a6f: { company_id: 10984 },
                }
            },
        )

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('http://localhost/offers?dmai=a6253af2818a6f&utm_source=123'),
        )

        expect(storage.getItem('utm_source')).not.toBe('123')
        expect(storage.getItem('utm_source')).toBe('referral')
        expect(storage.getItem('utm_medium')).toBe('bs')
        expect(storage.getItem('utm_content')).toBe('10984')
    })

    test('check override last_page_url', () => {
        const inflowSource = useInflowSource(
            storage,
            new URL('https://macloud.jp'),
            {
                ignorePathRegexpList: ['/someone_other_url.*']
            },
        )

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('https://macloud.jp/baz/qux?utm_source=newsletter1&utm_medium=email&utm_campaign=summer-sale&utm_content=toplink&gclid=Tester123'),
        )

        expect(storage.getItem('last_page_url')).toBe('https://macloud.jp/baz/qux')

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('https://macloud.jp/offers?utm_source=newsletter1&utm_medium=email&utm_campaign=summer-sale&utm_content=toplink&gclid=Tester123'),
        )

        expect(storage.getItem('last_page_url')).toBe('https://macloud.jp/offers')
    })

    test('check NOT override last_page_url', () => {
        const inflowSource = useInflowSource(
            storage,
            new URL('https://macloud.jp'),
            {
                ignorePathRegexpList: [
                    '/foo.*',
                    '/bar/baz.*',
                    '/qux/\\d+',
                    '/quux/\\d+/corge.*',
                ]
            },
        )

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('https://macloud.jp/offers?utm_source=newsletter1&utm_medium=email&utm_campaign=summer-sale&utm_content=toplink&gclid=Tester123'),
        )

        expect(storage.getItem('last_page_url')).toBe('https://macloud.jp/offers')

        // ignorePathRegexpList のパターンのいずれかに合致する URL たち
        const urls = [
            '/foo',
            '/fooooo',
            '/foo/',
            '/foo/abc',
            '/bar/baz',
            '/qux/1',
            '/qux/123',
            '/quux/1/corge',
        ]
        urls.forEach((currentUrlString) => {
            inflowSource.set(
                useDate().create('2022-03-09 00:00:00'),
                undefined,
                new URL(`https://macloud.jp${currentUrlString}`),
            )
        })

        expect(storage.getItem('last_page_url')).toBe('https://macloud.jp/offers')
    })

    test('check landing on ignored last_page_url', () => {
        const inflowSource = useInflowSource(
            storage,
            new URL('https://macloud.jp'),
            {
                ignorePathRegexpList: ['/foo']
            },
        )

        inflowSource.set(
            useDate().create('2022-03-09 00:00:00'),
            undefined,
            new URL('https://macloud.jp/foo'),
        )

        expect(storage.getItem('last_page_url')).toBeNull()
    })

    test('save intra site data', () => {
        const urlSearchParams = new URLSearchParams({
            last_visited_at: '1656342000000', // 2022-06-28 00:00:00.000
            referer: 'https%3A%2F%2Ftwitter.com%2Ffoo%2Fbar',
            landing_page_url: 'https%3A%2F%2Flp.macloud.jp%2F',
            utm_source: 'newsletter1',
            utm_medium: 'email',
            utm_campaign: 'summer-sale',
            utm_content: 'toplink',
            gclid: 'Tester123',
            // FYI: LP は単一ページなので landing_page_url と同じ URL が入る想定だが、
            //      入力値を区別するために便宜上異なる URL を使う
            last_page_url: 'https%3A%2F%2Flp.macloud.jp%2Fbaz%2Fqux',
            device: 'pc'
        })

        // 渡されたクエリパラメータでデータが更新されるのをテストしたいので、ランディング判定されない情報を引数に渡す
        inflowSource.set(
            useDate().create('2022-06-28 00:00:00'),
            new URL('https://sub.macloud.jp/'),
            new URL(`https://macloud.jp/signup/seller?${urlSearchParams.toString()}`)
        )

        expect(storage.getItem('last_visited_at')).toBe('2022-06-28 00:00:00')
        expect(storage.getItem('referer')).toBe('https://twitter.com/foo/bar')
        expect(storage.getItem('landing_page_url')).toBe('https://lp.macloud.jp/')
        expect(storage.getItem('utm_source')).toBe('newsletter1')
        expect(storage.getItem('utm_medium')).toBe('email')
        expect(storage.getItem('utm_campaign')).toBe('summer-sale')
        expect(storage.getItem('utm_content')).toBe('toplink')
        expect(storage.getItem('gclid')).toBe('Tester123')
        expect(storage.getItem('last_page_url')).toBe('https://macloud.jp/signup/seller')
        expect(storage.getItem('device')).toBe('pc')
    })
})
