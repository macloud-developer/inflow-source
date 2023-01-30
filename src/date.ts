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
  const create = (date: number | string | Date | CustomDate): CustomDate => {
    return dayjs(date)
  }

  const isBefore1hour = (rawCurrentDate: Date | CustomDate,targetDate: CustomDate): boolean => {
    //targetDateがrawCurrentDateより未来日時が渡されたらエラー
    if (targetDate.isAfter(rawCurrentDate)) {
      throw new Error('rawCurrentDateより未来に日時をtargetDateに指定できません')
    }

    return !targetDate.add(1, 'h').isAfter(rawCurrentDate);
  }

  return {
    format,
    create,
    isBefore1hour
  }
}
