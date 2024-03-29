import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CopyOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProCard,
  ProColumns,
  ProFormDigit,
  ProFormText,
  ProTable
} from '@ant-design/pro-components'
import { useSessionStorageState } from 'ahooks'
import { Badge, Descriptions, message, Modal, Space, Statistic, Tag } from 'antd'
import currency from 'currency.js'
import dayjs from 'dayjs'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'
import { getPriceRange, handleCopy, orderStatusTipsMap } from '@/views/trade/utils.ts'

import '../style.scss'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function Order() {
  const actionRef = useRef<ActionType>()
  const navigate = useNavigate()

  const [modifyAmount, setModifyAmount] = useState<number>(0)

  const columns: ProColumns[] = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      hideInTable: true
    },
    {
      title: '收件人邮箱',
      dataIndex: 'email',
      hideInTable: true
    },
    {
      title: '收件人手机号',
      dataIndex: 'phone',
      hideInTable: true
    },
    {
      title: '物流单号',
      dataIndex: 'fexExNumber',
      hideInTable: true
    },
    {
      title: '商品信息',
      dataIndex: 'info',
      hideInSearch: true,
      render: (_, record: Record<string, any>) => {
        const grouped = record.productList.reduce((result: any, item: any) => {
          if (!result[item.productId]) {
            result[item.productId] = {
              productId: item.productId,
              productName: item['productName'],
              children: []
            }
          }

          result[item.productId].children.push(item)

          return result
        }, {})

        const goodsList = Object.values(grouped)

        return (
          <Space direction={'vertical'}>
            <Space size={'large'}>
              <Badge dot={record.isNotify} offset={[0, 5]} style={{ marginLeft: '-5px' }} />
              <span>
                订单编号: {record.orderNo}{' '}
                <CopyOutlined
                  style={{ color: '#1677ff' }}
                  onClick={() => handleCopy(record.orderNo)}
                />
              </span>
              <span>下单时间: {record.createTime}</span>
            </Space>
            {goodsList.map((d: any) => {
              return (
                <div className={'sku-info'} style={{ paddingLeft: '20px' }} key={d.productId}>
                  <div className={'title'}>{d.productName}</div>
                  <div className="details">
                    {d.children?.length > 1 ? (
                      <>
                        <div className={'pic-list'}>
                          {d.children.map((c: any) => {
                            return (
                              <div className="pic" key={c.id}>
                                <img src={c.url} alt="" />
                              </div>
                            )
                          })}
                        </div>

                        <Space direction={'vertical'} className={'price'}>
                          <span>{getPriceRange(d.children)}</span>
                          <span>
                            x
                            {d.children.reduce((pre: number, cur: any) => {
                              return pre + cur['quantity']
                            }, 0)}
                          </span>
                        </Space>
                      </>
                    ) : (
                      <>
                        <div className="pic">
                          <img src={d.children[0].url} alt="" />
                        </div>
                        <div className={'info'}>
                          <span className={'name'}>{d.children[0].colorName}</span>
                          {d.children[0].format?.map((f: any) => {
                            return (
                              <span key={f.tagName} className={'tips'}>
                                {f['unitName']}：{f.tagName}
                              </span>
                            )
                          })}
                        </div>

                        <Space direction={'vertical'} className={'price'}>
                          <span>$ {d.children[0].price}</span>
                          <span>x {d.children[0]['quantity']}</span>
                        </Space>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </Space>
        )
      }
    },
    {
      title: '订单金额',
      dataIndex: 'payAmount',
      ellipsis: true,
      hideInSearch: true,
      width: 150,
      render: (_, record: Record<string, any>) => {
        return (
          <>
            <Descriptions title={`$ ${record.payAmount}`} column={1}>
              <Descriptions.Item label="原价">
                <span>$ {record.totalAmount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="满减">
                <span>{record.ruleAmount ? `$ ${record.ruleAmount}` : '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="优惠码">
                <span>{record.couponAmount ? `$ ${record.couponAmount}` : '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="调价">
                <span>{record.modifyAmount ? `$ ${record.modifyAmount}` : '-'}</span>
              </Descriptions.Item>
            </Descriptions>
          </>
        )
      }
    },
    {
      title: '买家/收货人',
      dataIndex: 'address',
      ellipsis: true,
      hideInSearch: true,
      render: (_, record: Record<string, any>) => {
        const address = record.address || {
          details: '',
          area: '',
          postal_code: ''
        }
        return (
          <>
            <Descriptions title={`${address.details}`} column={1}>
              <Descriptions.Item label="区域/国家">
                <span>
                  {address.area} &nbsp;
                  {address.postal_code}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="收货人">
                <span>{record.receiver}</span>
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                <span>{record.phone ? `${record.phoneCode} ${record.phone}` : '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <span>{record.email}</span>
              </Descriptions.Item>
            </Descriptions>
          </>
        )
      }
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      hideInSearch: true,
      width: 200,
      render: (_, record: Record<string, any>) => {
        return (
          <Space direction={'vertical'}>
            <span style={{ fontWeight: 'bold' }}>{orderStatusTipsMap[record.status]}</span>
            {record.isRemind && (
              <Tag bordered={false} color="warning">
                用户催促发货
              </Tag>
            )}
            {record.fexExNumber && (
              <Space>
                运单号：<span>{record.fexExNumber}</span>
                <CopyOutlined
                  style={{ color: '#1677ff' }}
                  onClick={() => handleCopy(record.fexExNumber)}
                />
              </Space>
            )}
          </Space>
        )
      }
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 80,
      render: (_, record: Record<string, any>) => {
        const status = record.status
        return (
          <Space direction={'vertical'}>
            {perms.includes('edit-order') && status === 1 && (
              <a
                key="price"
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认审核通过订单吗?',
                    onOk: async () => {
                      await axios.get(`/order/review/${record.id}`)
                      message.success('订单确认成功')
                      actionRef.current?.reloadAndRest?.()
                    }
                  })
                }}
              >
                确认订单
              </a>
            )}
            {perms.includes('edit-order') && status === 2 && (
              <ModalForm<{
                fexExNumber: string
              }>
                width={400}
                title="标记发货"
                trigger={<a key="ship">标记发货</a>}
                autoFocusFirstInput
                modalProps={{
                  destroyOnClose: true
                }}
                onFinish={async (values) => {
                  await axios
                    .post(`/order/shipStart/${record.id}`, {
                      ...values
                    })
                    .then(async () => {
                      message.success('订单标记发货成功')
                      actionRef.current?.reloadAndRest?.()
                    })
                  return true
                }}
              >
                <ProFormText
                  name="fexExNumber"
                  label="Fedex追踪单号"
                  initialValue={record.fexExNumber || ''}
                />
              </ModalForm>
            )}
            {perms.includes('edit-order') && record.fexExNumber && (
              <a
                key="price"
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认更改客户状态吗?',
                    onOk: async () => {
                      console.log('查看物流')
                    }
                  })
                }}
              >
                查看物流
              </a>
            )}
            {perms.includes('edit-order') && (
              <a
                key="details"
                onClick={async () => {
                  navigate(`/trade/order/details/${record.id}`)
                }}
              >
                详情
              </a>
            )}
            {perms.includes('edit-order') && status === 0 && (
              <ModalForm<{
                modifyAmount: string
              }>
                width={400}
                title="商家降价"
                trigger={
                  <span style={{ color: '#1677ff', fontSize: '12px', cursor: 'pointer' }}>
                    改价
                  </span>
                }
                autoFocusFirstInput
                modalProps={{
                  destroyOnClose: true,
                  onCancel: () => {
                    setModifyAmount(0)
                  }
                }}
                onFinish={async (values) => {
                  await axios
                    .post(`/order/modifyAmount`, {
                      id: record.id,
                      amount: values.modifyAmount
                    })
                    .then(async () => {
                      setModifyAmount(0)
                      message.success('商家降价成功')
                      actionRef.current?.reloadAndRest?.()
                    })
                  return true
                }}
              >
                <ProFormDigit
                  min={0}
                  max={record.payAmount}
                  name="modifyAmount"
                  placeholder={'请输入降价金额'}
                  initialValue={record.modifyAmount || ''}
                  fieldProps={{
                    onChange: (value) => {
                      setModifyAmount(value || 0)
                    }
                  }}
                  rules={[
                    {
                      required: true,
                      message: '请输入降价金额'
                    }
                  ]}
                />
                <Space direction={'vertical'}>
                  <span>
                    原始价格: $&nbsp;
                    {currency(record.payAmount).add(record.modifyAmount).value}
                  </span>
                  <span>目前价格: $ {record.payAmount}</span>
                  <span>
                    降价后价格: $&nbsp;
                    {
                      currency(record.payAmount).add(record.modifyAmount).subtract(modifyAmount)
                        .value
                    }
                  </span>
                </Space>
              </ModalForm>
            )}
            {perms.includes('edit-order') && (
              <ModalForm<{
                remark: string
              }>
                width={400}
                title="修改备注"
                trigger={<a key="remark">备注</a>}
                autoFocusFirstInput
                modalProps={{
                  destroyOnClose: true
                }}
                onFinish={async (values) => {
                  console.log(values)
                  await axios
                    .post(`/order/update`, {
                      id: record.id,
                      ...values
                    })
                    .then(async () => {
                      message.success('订单备注修改成功')
                      actionRef.current?.reloadAndRest?.()
                    })
                  return true
                }}
              >
                <ProFormText name="remark" label="备注" initialValue={record.remark || ''} />
              </ModalForm>
            )}
          </Space>
        )
      }
    }
  ]

  const [activeKey, setActiveKey] = useState<string>('-2')

  const [statistics, setStatistics] = useSessionStorageState('statistics', {
    defaultValue: []
  })

  const statisticList = [
    { status: 0, count: 0, notifyCount: 0, title: '待支付' },
    { status: 1, count: 0, notifyCount: 0, title: '待审核' },
    { status: 2, count: 0, notifyCount: 0, title: '待发货' },
    { status: 3, count: 0, notifyCount: 0, title: '运输中' },
    { status: 4, count: 0, notifyCount: 0, title: '待收货' },
    { status: 8, count: 0, notifyCount: 0, title: '售后中' },
    { status: 'all', count: 0, notifyCount: 0, title: '全部订单' }
  ]

  const getStatistics = () => {
    axios.get(`/order/statistics`).then((res: any) => {
      setStatistics(res)
    })
  }

  useEffect(() => {
    getStatistics()
  }, [])

  return (
    <PageContainer breadcrumbRender={false} className={'order'}>
      <ProCard.Group direction={'row'} style={{ marginBottom: '16px' }}>
        {statisticList.map((d: any) => {
          const target: any = statistics?.find((s: any) => s.status === d.status) || {}
          let count = target?.count || d.count
          let notifyCount = target?.notifyCount || d.notifyCount

          if (d.status === 0) {
            const awaitItem: any = statistics?.find((s: any) => s.status === 7) || {}
            count = Number(count) + Number(awaitItem.count || 0)
            notifyCount = Number(notifyCount) + Number(awaitItem.notifyCount || 0)
          }

          if (d.status === 8) {
            const awaitItem: any = statistics?.find((s: any) => s.status === 6) || {}
            count = Number(count) + Number(awaitItem.count || 0)
            notifyCount = Number(notifyCount) + Number(awaitItem.notifyCount || 0)
          }

          return (
            <ProCard key={d.status}>
              <Statistic
                title={d.title}
                precision={0}
                formatter={() => {
                  return (
                    <>
                      <span>{count}</span>
                      <Badge dot={notifyCount > 0} offset={[0, -12]} />
                    </>
                  )
                }}
              />
            </ProCard>
          )
        })}
      </ProCard.Group>

      <ProTable
        search={{
          labelWidth: 'auto'
        }}
        rowKey="id"
        headerTitle="订单管理"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const { pageSize, current, createDate = [], ...other } = params
          const [startDate, endDate] = createDate
          const { records, total }: { records: any; total: number } = await axios.post(
            '/order/list',
            {
              size: pageSize,
              current,
              ...(startDate
                ? {
                    startDate: dayjs(startDate).startOf('date').format('YYYY-MM-DD HH:mm:ss'),
                    endDate: dayjs(endDate).endOf('date').format('YYYY-MM-DD HH:mm:ss')
                  }
                : {}),
              status: activeKey === '-2' ? undefined : Number(activeKey),
              ...lodash.omitBy(other, (value) => !value && value !== false)
            }
          )
          return {
            data: records,
            total,
            success: true
          }
        }}
        toolbar={{
          menu: {
            type: 'tab',
            activeKey: activeKey,
            items: [
              {
                key: '-2',
                label: <span>全部</span>
              },
              {
                key: '0',
                label: <span>待支付</span>
              },
              {
                key: '1',
                label: <span>待审核</span>
              },
              {
                key: '2',
                label: <span>待发货</span>
              },
              {
                key: '3',
                label: <span>运输中</span>
              },
              {
                key: '4',
                label: <span>待收货</span>
              },
              {
                key: '8',
                label: <span>售后中</span>
              },
              {
                key: '5',
                label: <span>已完成</span>
              },
              {
                key: '-1',
                label: <span>已关闭</span>
              }
            ],
            onChange: (key) => {
              setActiveKey(key as string)
              actionRef.current?.reloadAndRest?.()
            }
          }
        }}
        pagination={{
          pageSize: 20,
          hideOnSinglePage: true
        }}
      />
    </PageContainer>
  )
}

export default Order
