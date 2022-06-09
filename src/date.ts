import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ja'

dayjs.locale('ja')

// FYI: built-in の Date との重複を避けるため、接頭辞に Custom を付けている
export interface CustomDate extends Dayjs {
}

export default function useDate() {
  const format = (value: string, format: string = 'YYYY/MM/DD'): string => {
    return dayjs(value).format(format)
  }
  const create = (date: string | CustomDate): CustomDate => {
    return dayjs(date)
  }

  return {
    format,
    create
  }
}
