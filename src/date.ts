import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ja'

dayjs.locale('ja')

// FYI: built-in の Date との重複を避けるため、接頭辞に Custom を付けている
export interface CustomDate extends Dayjs {
}

export default function useDate() {
  const create = (date: string | CustomDate): CustomDate => {
    return dayjs(date)
  }

  return {
    create
  }
}
