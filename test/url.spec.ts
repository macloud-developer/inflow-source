import { useUrl } from '~/url'

describe('~/url', () => {
    describe('isOwnedDomain', () => {
        test('check domains', () => {
            const baseUrl = new URL('https://macloud.jp')
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://macloud.jp'))).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://sub.macloud.jp'))).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://sub.sub.sub.macloud.jp'))).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://macloud.jpa'))).toBeFalsy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://macloud.jp.com'))).toBeFalsy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://amacloud.jp'))).toBeFalsy()
        })

        test('check domains when domainsRegardedAsExternal is set', () => {
            const baseUrl = new URL('https://macloud.jp')
            const domainsRegardedAsExternal = [
                'foo.macloud.jp',
                'bar.foo.macloud.jp'
            ]
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://macloud.jp'), domainsRegardedAsExternal)).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://sub.macloud.jp'), domainsRegardedAsExternal)).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://foo.macloud.jp'), domainsRegardedAsExternal)).toBeFalsy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://sub.foo.macloud.jp'), domainsRegardedAsExternal)).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://bar.foo.macloud.jp'), domainsRegardedAsExternal)).toBeFalsy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://baz.bar.foo.macloud.jp'), domainsRegardedAsExternal)).toBeTruthy()
        })
    })
})
