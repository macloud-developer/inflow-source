import { useUserAgent } from '~/user-agent'

describe('~/user-agent', () => {
  test('get device', () => {
    expect(useUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/213.0.449417121 Mobile/19F77 Safari/604.1')
      .getDevice()).toBe('mobile')
  })
  test('get device when ua not defined', () => {
    // specテスト上の状態で”UAがわからない”状態の場合にはpcとして判定
    expect(useUserAgent().getDevice()).toBe('pc')
  })
  test('ua parser experience', () => {
    const targetList = [
      {
        device: 'mobile', // iPhone12 Chrome
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/213.0.449417121 Mobile/19F77 Safari/604.1'
      },
      {
        device: 'mobile', // iPhone12 Safari
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1'
      },
      {
        device: 'mobile', // iPhone12 Firefox
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/100.1 Mobile/15E148 Safari/605.1.15'
      },
      {
        device: 'mobile', // Android Chrome
        ua: 'Mozilla/5.0 (Linux; Android 10; MAR-LX2J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.78 Mobile Safari/537.36'
      },
      {
        // ua parser は iPadのうちChromeの方は tablet 判定をするが、iPad Safariと合わせてpc判定にまとめる
        device: 'pc', // iPad Chrome
        ua: 'Mozilla/5.0 (iPad; CPU OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/91.0.4472.80 Mobile/15E148 Safari/604.1'
      },
      {
        // ua parser は undefined と判定するがpcと分類する。
        device: 'pc', // iPad Safari
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15'
      },
      {
        device: 'pc', // MacBook Pro Chrome
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36'
      },
      {
        device: 'pc', // MacBook Pro Safari
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15'
      },
      {
        device: 'pc', // MacBook Pro Firefox,
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:93.0) Gecko/20100101 Firefox/93.0'
      },
      {
        device: 'pc', // Windows / Chrome
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
      },
      {
        device: 'pc', // Windows / Firefox
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0'
      },
      {
        device: 'pc', // Windows / Edge
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36 Edg/94.0.992.31'
      },
      {
        device: 'pc', // Windows / IE
        ua: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
      },
      {
        device: 'mobile', // Android WebView
        ua: 'Mozilla/5.0 (Linux; Android 10; MAR-LX2J Build/HUAWEIMAR-L22J; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Mobile Safari/537.36 GoogleApp/13.20.11.23.arm64'
      }
    ]

    targetList.forEach((item) => {
      expect(useUserAgent(item.ua).getDevice()).toBe(item.device)
    })
  })
})
