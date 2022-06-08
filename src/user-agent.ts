import UAParser from 'ua-parser-js'

export const useUserAgent = (ua?: string | undefined) => {
  const getDevice = () => {
    const uaParser = new UAParser(ua)

    if (uaParser.getResult().device.type === 'mobile') {
      return 'mobile'
    } else {
      return 'pc'
    }
  }
  return {
    getDevice
  }
}
