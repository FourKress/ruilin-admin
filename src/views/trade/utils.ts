import { message } from 'antd'
import currency from 'currency.js'

export const getPriceRange = (list: any[]) => {
  const [first, ...other] = list.sort(
    (a: any, b: any) =>
      currency(a['quantity']).multiply(a.price).value -
      currency(b['quantity']).multiply(b.price).value
  )
  const last = other.pop()
  return `$ ${currency(first['quantity']).multiply(first.price)} ~ $ ${currency(
    last['quantity']
  ).multiply(last.price)}`
}

export const handleCopy = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(async () => {
      await message.success('复制成功')
    })
    .catch(async () => {
      await message.error('复制失败')
    })
}

export const orderStatusTipsMap: Record<any, any> = {
  '-1': '已关闭', // 已关闭
  0: '待支付', // 待支付
  1: '待审核', // 待审核
  2: '待发货', //待发货
  3: '运输中', // 运输中
  4: '待收货', //待收货
  5: '已完成', // 订单完结
  6: '退款中', // 退款中
  7: '支付确认中', // 支付确认中
  8: '退款审核' // 退款审核
}
