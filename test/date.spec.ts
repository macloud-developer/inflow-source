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
})
