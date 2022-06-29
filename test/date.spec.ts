import useDate from '~/date'

describe('~/date', () => {
  test('format default', (): any => {
    expect(useDate().format('2020-01-21T14:29:58+09:00')).toBe('2020/01/21')
  })
  test('format manual', (): any => {
    expect(
      useDate().format('2020-01-21T14:29:58+09:00', 'YYYY年MM月DD日')
    ).toBe('2020年01月21日')
  })
  describe('create', () => {
    test('timestamp (milliseconds)', () => {
      const date = useDate().create(1449414000000)
      expect(date.toString()).toBe('Sun, 06 Dec 2015 15:00:00 GMT')
    })
  })
})
