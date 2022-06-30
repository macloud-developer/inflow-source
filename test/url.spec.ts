import { useUrl } from '~/url'

describe('~/url', () => {
    describe('isOwnedDomain', () => {
        test('success', () => {
            const baseUrl = new URL('https://macloud.jp')
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://macloud.jp'))).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://sub.macloud.jp'))).toBeTruthy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://sub.sub.sub.macloud.jp'))).toBeTruthy()
        })

        test('failure', () => {
            const baseUrl = new URL('https://macloud.jp')
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://macloud.jpa'))).toBeFalsy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://macloud.jp.com'))).toBeFalsy()
            expect(useUrl().isOwnedDomain(baseUrl, new URL('https://amacloud.jp'))).toBeFalsy()
        })
    })
})
