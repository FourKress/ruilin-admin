import { FC, useEffect, useState } from 'react'
import { PageContainer, ProCard } from '@ant-design/pro-components'
import { Card, Col, DatePicker, Flex, Row, Spin, Statistic } from 'antd'
import currency from 'currency.js'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'

import axios from '@/utils/axios.ts'

const { RangePicker } = DatePicker

let productList: any[] = []

const Dashboard: FC<Record<string, any>> = () => {
  const [details, setDetails] = useState<Record<string, any>>({
    orderList: [],
    pvList: [],
    customerList: []
  })

  const [priceOptions, setPriceOptions] = useState<Record<string, any>>({})
  const [pvOptions, setPvOptions] = useState<Record<string, any>>({})
  const [customerOptions, setCustomerOptions] = useState<Record<string, any>>({})
  const [proportionOptions, setProportionOptions] = useState<Record<string, any>>({})
  const [pvCount, setPvCount] = useState<number>(0)
  const [proportion, setProportion] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const startMonth = dayjs().startOf('month')
  const endMonth = dayjs()

  useEffect(() => {
    getProductList().then(async (res: any) => {
      productList = res['records']
      await handleChange('', [startMonth.format('YYYY-MM-DD'), endMonth.format('YYYY-MM-DD')])
    })
  }, [])

  const getProductList = () => {
    return axios.post('/product/page', {
      size: 10000,
      current: 1
    })
  }

  const handleChange = async (_: any, dateString: string[]) => {
    setLoading(true)
    const [start, end] = dateString
    await axios
      .post('/statistic/details', {
        date: [
          start ? dayjs(start).startOf('day').valueOf() : '',
          end ? dayjs(end).endOf('day').valueOf() : ''
        ]
      })
      .then((res: Record<string, any>) => {
        setDetails(res)

        const pvCount = res.pvList.reduce((sum: any, cur: any) => {
          return sum + cur['count']
        }, 0)
        setPvCount(pvCount)
        setProportion(pvCount ? Number(((res?.orderList?.length || 0) / pvCount).toFixed(2)) : 0)

        const xAxisData = new Array(dayjs(end).diff(start, 'day') + 1)
          .fill(start)
          .map((d: string, index: number) => {
            return dayjs(d).add(index, 'day').format('MM-DD')
          })

        const realOrder = res?.orderList.filter((d: any) => [1, 2, 3, 4, 5].includes(d.status))

        const priceSeriesData = xAxisData.map((d: string) => {
          const targetList = realOrder.filter(
            (order: any) => order.createTime.substring(5, 10) == d
          )

          if (!targetList.length) return 0

          return targetList.reduce((sum: any, cur: any) => {
            return currency(sum).add(cur['payAmount']).value
          }, 0)
        })

        const pvSeriesData = xAxisData.map((d: string) => {
          const targetList = res?.pvList.filter(
            (order: any) => order.createTime.substring(5, 10) == d
          )

          if (!targetList.length) return 0

          return targetList.reduce((sum: any, cur: any) => {
            return currency(sum).add(cur['count']).value
          }, 0)
        })

        const customerSeriesData = xAxisData.map((d: string) => {
          const targetList = res?.customerList.filter(
            (order: any) => order.createTime.substring(5, 10) == d
          )

          if (!targetList.length) return 0

          return targetList.reduce((sum: any) => {
            return currency(sum).add(1).value
          }, 0)
        })

        const orderProductList = realOrder.reduce((sum: any, cur: any) => {
          sum.push(...cur['productList'])
          return sum
        }, [])

        setPriceOptions({
          grid: { top: 8, right: 8, bottom: 24, left: 36 },
          xAxis: {
            type: 'category',
            data: xAxisData
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              data: priceSeriesData,
              type: 'line',
              smooth: true
            }
          ],
          tooltip: {
            trigger: 'axis'
          }
        })

        setPvOptions({
          grid: { top: 8, right: 8, bottom: 24, left: 36 },
          xAxis: {
            type: 'category',
            data: xAxisData
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              data: pvSeriesData,
              type: 'line',
              smooth: true
            }
          ],
          tooltip: {
            trigger: 'axis'
          }
        })

        setCustomerOptions({
          grid: { top: 8, right: 8, bottom: 24, left: 36 },
          xAxis: {
            type: 'category',
            data: xAxisData
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              data: customerSeriesData,
              type: 'line',
              smooth: true
            }
          ],
          tooltip: {
            trigger: 'axis'
          }
        })

        setProportionOptions({
          title: {
            left: 'center'
          },
          tooltip: {
            trigger: 'item'
          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [
            {
              name: '销售占比',
              type: 'pie',
              radius: '50%',
              data: productList.map((d: any) => {
                const targetProductList = orderProductList.filter((o: any) => o.productId === d.id)
                if (targetProductList?.length) {
                  return {
                    value: targetProductList.reduce((sum: any, cur: any) => {
                      return currency(sum).add(
                        currency(cur['price']).multiply(currency(cur['quantity']))
                      ).value
                    }, 0),
                    name: d.name
                  }
                }
                return {
                  value: 0,
                  name: d.name
                }
              }),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{
        title: '仪表板'
      }}
    >
      <Spin size="large" spinning={loading}>
        <Card title="" bordered={false}>
          <Flex gap="large" align={'center'} vertical={false}>
            <RangePicker
              style={{ height: '30px', width: '400px', marginRight: '60px' }}
              defaultValue={[startMonth, endMonth]}
              disabledDate={(current) => {
                return current && current > dayjs().endOf('day')
              }}
              onChange={handleChange}
            />
            <ProCard.Group direction={'row'}>
              <ProCard>
                <Statistic
                  title={'商城访问量'}
                  precision={0}
                  formatter={() => {
                    return <span>{pvCount}</span>
                  }}
                />
              </ProCard>
              <ProCard>
                <Statistic
                  title={'销售额'}
                  precision={0}
                  formatter={() => {
                    return details?.orderList ? (
                      <span>
                        {details?.orderList
                          .filter((d: any) => [1, 2, 3, 4, 5].includes(d.status))
                          .reduce((sum: any, cur: any) => {
                            return currency(sum).add(cur['payAmount']).format()
                          }, 0)}
                      </span>
                    ) : (
                      <span>0</span>
                    )
                  }}
                />
              </ProCard>
              <ProCard>
                <Statistic
                  title={'订单数'}
                  precision={0}
                  formatter={() => {
                    return <span>{details?.orderList?.length || 0}</span>
                  }}
                />
              </ProCard>
              <ProCard>
                <Statistic
                  title={'转化率'}
                  precision={0}
                  formatter={() => {
                    return <span>{proportion * 100}%</span>
                  }}
                />
              </ProCard>
              <ProCard>
                <Statistic
                  title={'注册用户'}
                  precision={0}
                  formatter={() => {
                    return <span>{details.customerList?.length || 0}</span>
                  }}
                />
              </ProCard>
            </ProCard.Group>
          </Flex>
        </Card>

        <Row gutter={16} style={{ margin: '24px 0' }}>
          <Col span={12} style={{ paddingLeft: 0 }}>
            <Card title="销售额" bordered={false}>
              <ReactECharts option={priceOptions} />
            </Card>
          </Col>
          <Col span={12} style={{ paddingRight: 0 }}>
            <Card title="销售占比" bordered={false}>
              <ReactECharts option={proportionOptions} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ margin: '24px 0' }}>
          <Col span={12} style={{ paddingLeft: 0 }}>
            <Card title="访问量" bordered={false}>
              <ReactECharts option={pvOptions} />
            </Card>
          </Col>
          <Col span={12} style={{ paddingRight: 0 }}>
            <Card title="用户注册量" bordered={false}>
              <ReactECharts option={customerOptions} />
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  )
}

export default Dashboard
