import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CheckSquareTwoTone,
  CloseSquareTwoTone,
  CopyOutlined,
  EditOutlined,
  EllipsisOutlined
} from '@ant-design/icons'
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText
} from '@ant-design/pro-components'
import {
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Flex,
  message,
  Modal,
  Space,
  Spin,
  Statistic,
  Steps
} from 'antd'
import currency from 'currency.js'
import dayjs from 'dayjs'

import axios from '@/utils/axios.ts'

import { handleCopy } from '../utils'

import '../style.scss'

const { confirm } = Modal
const { Countdown } = Statistic

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const orderStatusTipsMap: Record<any, any> = {
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

const OrderDetails: FC<Record<string, any>> = () => {
  const navigate = useNavigate()
  const { orderId } = useParams()

  const [loading, setLoading] = useState<boolean>(false)
  const [isModalOpen, setIisModalOpen] = useState<boolean>(false)
  const [orderInfo, setOrderInfo] = useState<Record<string, any>>({})
  const [goodsList, setGoodsList] = useState<any[]>([])
  const [modifyAmount, setModifyAmount] = useState<number>(0)
  const [stepsCurrent, setStepsCurrent] = useState<number>(0)
  const [stepsItems, setStepsItems] = useState<any[]>([
    {
      title: '支付',
      value: 0
    },
    {
      title: '审核',
      value: 1
    },
    {
      title: '发货',
      value: 2
    },
    {
      title: '运输',
      value: 3
    },
    {
      title: '收货',
      value: 4
    },
    {
      title: '完成',
      value: 5
    }
  ])

  const getOrderDetails = () => {
    if (!orderId) return
    setLoading(true)
    axios
      .get(`/order/details/${orderId}`)
      .then((res: Record<string, any>) => {
        setOrderInfo(res)

        const grouped = res.productList.reduce((result: any, item: any) => {
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

        setGoodsList(Object.values(grouped))

        if ([-1, 6, 8].includes(res.status)) {
          const lastStatus = res.statusMap
            .filter((d: any) => ![6, 7].includes(d.status))
            .at(-1).status
          const items = [...stepsItems].splice(0, lastStatus + 1)
          const addItems = [
            {
              value: -1,
              title: res.status === 8 ? '继续/关闭' : '关闭'
            }
          ]
          if (res.status !== -1) {
            addItems.unshift({
              value: res.status,
              title: orderStatusTipsMap[res.status]
            })
          }
          items.push(...addItems)
          const current = items.findIndex((d) => d.value === res.status)
          setStepsCurrent(current === 7 ? 0 : current)
          setStepsItems(items)
        } else {
          setStepsCurrent(stepsItems.findIndex((d) => d.value === res.status))
        }

        setModifyAmount(res.modifyAmount)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    getOrderDetails()
  }, [])

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{
        title: '订单详情',
        extra: [
          <Button
            key={'back'}
            type="primary"
            onClick={() => {
              navigate(-1)
            }}
          >
            返回
          </Button>
        ]
      }}
    >
      <Spin
        size="large"
        tip={<div style={{ marginTop: '12px' }}>加载中...</div>}
        spinning={loading}
      >
        <div>
          {orderInfo.id && (
            <Flex justify={'flex-start'} align={'flex-start'}>
              <div>
                <Card
                  title="基础信息"
                  className={'card'}
                  bordered={false}
                  style={{ marginBottom: '24px' }}
                >
                  <Flex justify={'flex-start'} align={'center'}>
                    <Flex justify={'flex-start'} align={'center'} style={{ minWidth: '180px' }}>
                      {![-1, 5].includes(orderInfo.status) && (
                        <Spin
                          size="large"
                          style={{
                            margin: '0 24px 0 12px'
                          }}
                        />
                      )}
                      {orderInfo.status === 5 && (
                        <CheckSquareTwoTone
                          style={{
                            margin: '0 12px 0 6px',
                            fontSize: '40px'
                          }}
                        />
                      )}
                      {orderInfo.status === -1 && (
                        <CloseSquareTwoTone
                          twoToneColor="#f00"
                          style={{
                            margin: '0 12px 0 6px',
                            fontSize: '40px'
                          }}
                        />
                      )}

                      <Flex vertical justify={'center'} align={'flex-start'}>
                        <h3>{orderStatusTipsMap[orderInfo.status]}</h3>
                        {[0].includes(orderInfo.status) && (
                          <Flex justify={'flex-start'} align={'center'}>
                            倒计时：
                            <ConfigProvider
                              theme={{
                                components: {
                                  Statistic: {
                                    contentFontSize: 14
                                  }
                                }
                              }}
                            >
                              <Countdown
                                value={Date.now() + orderInfo.countdown}
                                format="HH:mm:ss"
                              />
                            </ConfigProvider>
                          </Flex>
                        )}
                      </Flex>
                    </Flex>
                    <ConfigProvider
                      theme={{
                        components: {
                          Steps: {
                            descriptionMaxWidth: 80
                          }
                        }
                      }}
                    >
                      <Steps
                        responsive={false}
                        size={'small'}
                        progressDot
                        current={stepsCurrent}
                        items={stepsItems}
                      />
                    </ConfigProvider>
                  </Flex>

                  <Descriptions
                    style={{ marginTop: '16px' }}
                    items={[
                      {
                        key: '1',
                        label: '订单编号',
                        children: (
                          <Space size={'middle'}>
                            <span>{orderInfo.orderNo}</span>
                            <CopyOutlined
                              style={{ color: '#1677ff' }}
                              onClick={() => handleCopy(orderInfo.orderNo)}
                            />
                          </Space>
                        )
                      },
                      {
                        key: '2',
                        label: '下单时间',
                        children: orderInfo.createTime
                      },
                      {
                        key: '3',
                        label: '付款时间',
                        children: orderInfo.paymentTime || '-'
                      },
                      {
                        key: '4',
                        label: '备注',
                        children: (
                          <Space size={'middle'}>
                            <span>{orderInfo.remark || '暂无备注'}</span>

                            <ModalForm<{
                              remark: string
                            }>
                              width={400}
                              title="修改备注"
                              trigger={
                                perms.includes('edit-order') && orderInfo.status !== -1 ? (
                                  <EditOutlined
                                    style={{
                                      color: '#1677ff',
                                      fontSize: '14px',
                                      cursor: 'pointer'
                                    }}
                                  />
                                ) : (
                                  <span></span>
                                )
                              }
                              autoFocusFirstInput
                              modalProps={{
                                destroyOnClose: true
                              }}
                              onFinish={async (values) => {
                                console.log(values)
                                await axios
                                  .post(`/order/update`, {
                                    id: orderId,
                                    ...values
                                  })
                                  .then(async () => {
                                    message.success('订单备注修改成功')
                                    getOrderDetails()
                                  })
                                return true
                              }}
                            >
                              <ProFormText
                                name="remark"
                                label="备注"
                                initialValue={orderInfo.remark || ''}
                              />
                            </ModalForm>
                          </Space>
                        )
                      }
                    ]}
                  />
                </Card>

                <Card
                  title="收货信息"
                  className={'card'}
                  bordered={false}
                  style={{ marginBottom: '24px' }}
                >
                  <Descriptions
                    style={{ marginTop: '16px' }}
                    items={[
                      {
                        key: '1',
                        label: '收货地址',
                        children: orderInfo?.address ? (
                          <Space direction={'vertical'}>
                            <Space size={'middle'}>
                              <p>{orderInfo?.address?.details}</p>

                              <ModalForm<{
                                details: string
                                area: string
                                postal_code: string
                              }>
                                width={400}
                                title="修改收货地址"
                                trigger={
                                  perms.includes('edit-order') && orderInfo.status !== -1 ? (
                                    <EditOutlined
                                      style={{
                                        color: '#1677ff',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                      }}
                                    />
                                  ) : (
                                    <span></span>
                                  )
                                }
                                autoFocusFirstInput
                                modalProps={{
                                  destroyOnClose: true
                                }}
                                onFinish={async (values) => {
                                  console.log(values)
                                  await axios
                                    .post(`/order/update`, {
                                      id: orderId,
                                      address: {
                                        ...values
                                      }
                                    })
                                    .then(async () => {
                                      message.success('订单收货地址修改成功')
                                      getOrderDetails()
                                    })
                                  return true
                                }}
                              >
                                <ProFormText
                                  name="details"
                                  label="详细地址"
                                  initialValue={orderInfo?.address?.details || ''}
                                  rules={[
                                    {
                                      required: true,
                                      message: '请输入详细地址'
                                    }
                                  ]}
                                />
                                <ProFormText
                                  name="area"
                                  label="区域/国家"
                                  initialValue={orderInfo?.address?.area || ''}
                                  rules={[
                                    {
                                      required: true,
                                      message: '请输入区域/国家'
                                    }
                                  ]}
                                />
                                <ProFormText
                                  name="postal_code"
                                  label="邮编"
                                  initialValue={orderInfo?.address?.postal_code || ''}
                                />
                              </ModalForm>
                            </Space>
                            <p>{orderInfo?.address?.area}</p>
                            <p>{orderInfo?.address?.postal_code}</p>
                          </Space>
                        ) : (
                          '-'
                        )
                      },
                      {
                        key: '2',
                        label: '收货人',
                        children: (
                          <Space size={'middle'}>
                            <span>{orderInfo.receiver}</span>

                            <ModalForm<{
                              receiver: string
                            }>
                              width={400}
                              title="修改收货人"
                              trigger={
                                perms.includes('edit-order') && orderInfo.receiver ? (
                                  <EditOutlined
                                    style={{
                                      color: '#1677ff',
                                      fontSize: '14px',
                                      cursor: 'pointer'
                                    }}
                                  />
                                ) : (
                                  <span></span>
                                )
                              }
                              autoFocusFirstInput
                              modalProps={{
                                destroyOnClose: true
                              }}
                              onFinish={async (values) => {
                                console.log(values)
                                await axios
                                  .post(`/order/update`, {
                                    id: orderId,
                                    ...values
                                  })
                                  .then(async () => {
                                    message.success('订单收货人修改成功')
                                    getOrderDetails()
                                  })
                                return true
                              }}
                            >
                              <ProFormText
                                name="receiver"
                                label="收货人"
                                initialValue={orderInfo.receiver || ''}
                                rules={[
                                  {
                                    required: true,
                                    message: '请输入收货人'
                                  }
                                ]}
                              />
                            </ModalForm>
                          </Space>
                        )
                      },
                      {
                        key: '3',
                        label: '联系方式',
                        children: (
                          <Space direction={'vertical'}>
                            <Space size={'middle'}>
                              <p>{orderInfo.email}</p>

                              <ModalForm<{
                                email: string
                                phone: string
                                phoneCode: string
                              }>
                                width={400}
                                title="修改联系方式"
                                trigger={
                                  perms.includes('edit-order') && orderInfo.status !== -1 ? (
                                    <EditOutlined
                                      style={{
                                        color: '#1677ff',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                      }}
                                    />
                                  ) : (
                                    <span></span>
                                  )
                                }
                                autoFocusFirstInput
                                modalProps={{
                                  destroyOnClose: true
                                }}
                                onFinish={async (values) => {
                                  await axios
                                    .post(`/order/update`, {
                                      id: orderId,
                                      ...values
                                    })
                                    .then(async () => {
                                      message.success('订单联系方式修改成功')
                                      getOrderDetails()
                                    })
                                  return true
                                }}
                              >
                                <ProFormText
                                  name="email"
                                  label="邮箱"
                                  initialValue={orderInfo.email || ''}
                                  rules={[
                                    {
                                      required: true,
                                      message: '请输入邮箱'
                                    }
                                  ]}
                                />
                                <ProFormText
                                  name="phoneCode"
                                  label="电话国号"
                                  initialValue={orderInfo.phoneCode || ''}
                                />
                                <ProFormText
                                  name="phone"
                                  label="电话"
                                  initialValue={orderInfo.phone || ''}
                                />
                              </ModalForm>
                            </Space>

                            {orderInfo?.phone && (
                              <p>
                                {orderInfo?.phoneCode ? `+${orderInfo.phoneCode}` : ''} &nbsp;
                                {orderInfo?.phone}
                              </p>
                            )}
                          </Space>
                        )
                      }
                    ]}
                  />
                </Card>

                <Flex>
                  <Card
                    title="订单状态"
                    className={'card'}
                    bordered={false}
                    style={{ marginBottom: '24px' }}
                  >
                    <Descriptions
                      style={{ marginTop: '16px' }}
                      items={[
                        {
                          key: '1',
                          label: '订单状态',
                          children: orderInfo.statusMap?.length ? (
                            <Space direction={'vertical'}>
                              {[
                                ...orderInfo.statusMap.filter(
                                  (d: any) => ![6, 7].includes(d.status)
                                ),
                                {
                                  status: orderInfo.status,
                                  time: orderInfo.updateTime
                                }
                              ]
                                .reverse()
                                .splice(0, 3)
                                .map((d: any, index: number) => {
                                  return (
                                    <Space key={index} size={'middle'}>
                                      <span>[{d.time}]</span>
                                      {d.status === -1 && <span>订单已关闭</span>}
                                      {d.status === 0 && <span>订单已提交，等待用户支付</span>}
                                      {d.status === 1 && <span>订单已支付，等待用户审核</span>}
                                      {d.status === 2 && <span>商家审核通过，等待仓库发货</span>}
                                      {d.status === 6 && <span>订单正在退款处理中...</span>}
                                      {d.status === 8 && <span>订单正在售后处理中...</span>}

                                      {d.status === 3 && (
                                        <span>
                                          {
                                            orderInfo['fexExDetails']['trackResults'][0][
                                              'scanEvents'
                                            ][0]['eventDescription']
                                          }
                                        </span>
                                      )}
                                    </Space>
                                  )
                                })}
                              {orderInfo.statusMap?.length > 2 && (
                                <EllipsisOutlined style={{ fontSize: '24px' }} />
                              )}
                              {orderInfo.statusMap?.length > 2 && (
                                <Button
                                  style={{ color: '#1677ff' }}
                                  onClick={() => {
                                    setIisModalOpen(true)
                                  }}
                                >
                                  全部订单状态
                                </Button>
                              )}
                            </Space>
                          ) : (
                            '-'
                          )
                        }
                      ]}
                    />
                  </Card>
                  <Card
                    title="物流信息"
                    className={'card'}
                    bordered={false}
                    style={{ marginBottom: '24px', marginLeft: '24px' }}
                  >
                    <Descriptions
                      column={1}
                      style={{ marginTop: '16px' }}
                      items={[
                        {
                          key: '1',
                          label: '承运快递',
                          children: orderInfo.fexExNumber ? 'FedEx' : '-'
                        },
                        {
                          key: '2',
                          label: '运单号',
                          children: orderInfo.fexExNumber ? (
                            <Space size={'middle'}>
                              {orderInfo.fexExNumber}
                              <CopyOutlined
                                style={{ color: '#1677ff' }}
                                onClick={() => handleCopy(orderInfo.fexExNumber)}
                              />
                            </Space>
                          ) : (
                            '-'
                          )
                        },
                        {
                          key: '3',
                          label: '发货时间',
                          children: orderInfo.shippingTime
                            ? dayjs(Number(orderInfo.shippingTime)).format('YYYY-MM-DD HH:mm:ss')
                            : '-'
                        },
                        {
                          key: '4',
                          label: '签收时间',
                          children: orderInfo.receiptTime || '-'
                        }
                      ]}
                    />
                  </Card>
                </Flex>

                <Card
                  title="金额信息"
                  className={'card'}
                  bordered={false}
                  style={{ marginBottom: '24px' }}
                >
                  <Descriptions
                    style={{ marginTop: '16px' }}
                    items={[
                      {
                        key: '1',
                        label: '实付金额',
                        children: `$ ${orderInfo.payAmount}`
                      },
                      {
                        key: '2',
                        label: '原价',
                        children: `$ ${orderInfo.totalAmount}`
                      },
                      {
                        key: '91',
                        label: '客户备注',
                        children: orderInfo.customerRemark || '-'
                      },
                      {
                        key: '3',
                        label: '满减',
                        children: orderInfo.ruleAmount ? `$ ${orderInfo.ruleAmount}` : '-'
                      },
                      {
                        key: '4',
                        label: '优惠券',
                        children: orderInfo.couponAmount ? `$ ${orderInfo.couponAmount}` : '-'
                      },
                      {
                        key: '5',
                        label: '劵码',
                        children: orderInfo.couponCode || '-'
                      },
                      {
                        key: '6',
                        label: '商家改价',
                        children: (
                          <Space size={'middle'}>
                            <span>
                              {orderInfo.modifyAmount ? `$ ${orderInfo.modifyAmount}` : '-'}
                            </span>

                            {orderInfo.status === 0 && (
                              <ModalForm<{
                                modifyAmount: string
                              }>
                                width={400}
                                title="商家降价"
                                trigger={
                                  <span
                                    style={{
                                      color: '#1677ff',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    降价
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
                                      id: orderId,
                                      amount: values.modifyAmount
                                    })
                                    .then(async () => {
                                      setModifyAmount(0)
                                      message.success('商家降价成功')
                                      getOrderDetails()
                                    })
                                  return true
                                }}
                              >
                                <ProFormDigit
                                  min={0}
                                  max={orderInfo.payAmount}
                                  name="modifyAmount"
                                  placeholder={'请输入降价金额'}
                                  initialValue={orderInfo.modifyAmount || ''}
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
                                    {
                                      currency(orderInfo.payAmount).add(orderInfo.modifyAmount)
                                        .value
                                    }
                                  </span>
                                  <span>目前价格: $ {orderInfo.payAmount}</span>
                                  <span>
                                    降价后价格: $&nbsp;
                                    {
                                      currency(orderInfo.payAmount)
                                        .add(orderInfo.modifyAmount)
                                        .subtract(modifyAmount).value
                                    }
                                  </span>
                                </Space>
                              </ModalForm>
                            )}
                          </Space>
                        )
                      },
                      {
                        key: '7',
                        label: '退款金额',
                        children: orderInfo.refundAmount ? `$ ${orderInfo.refundAmount}` : '-'
                      },
                      {
                        key: '8',
                        label: '退款时间',
                        children: orderInfo.refundTime || '-'
                      },
                      {
                        key: '9',
                        label: '退款备注',
                        children: orderInfo.refundRemark || '-'
                      }
                    ]}
                  />
                </Card>

                {![6, 7].includes(orderInfo.status) && (
                  <FooterToolbar
                    extra={
                      <Space size={'middle'}>
                        {perms.includes('edit-order') && [-1, 5].includes(orderInfo.status) && (
                          <Button
                            type="primary"
                            danger
                            onClick={() => {
                              confirm({
                                title: '确认操作',
                                content: '确认删除该订单吗?',
                                onOk: async () => {
                                  await axios.get(`/order/delete/${orderId}`)
                                  message.success('订单删除成功')
                                  navigate('/trade/order')
                                }
                              })
                            }}
                          >
                            删除订单
                          </Button>
                        )}
                        {perms.includes('edit-order') && ![-1, 5, 8].includes(orderInfo.status) && (
                          <ModalForm<{
                            refundRemark: string
                          }>
                            width={400}
                            title="关闭订单"
                            trigger={
                              <Button type="primary" danger>
                                关闭订单
                              </Button>
                            }
                            autoFocusFirstInput
                            modalProps={{
                              destroyOnClose: true
                            }}
                            onFinish={async (values) => {
                              await axios.post(`/order/cancel/${orderId}`, {
                                refundRemark: orderInfo.paymentTime ? values?.refundRemark : ''
                              })
                              message.success('订单关闭成功')
                              navigate('/trade/order')
                              return true
                            }}
                          >
                            <Descriptions
                              title={''}
                              column={1}
                              size={'small'}
                              style={{ marginBottom: '10px' }}
                            >
                              <Descriptions.Item label="">
                                <span>你确认要关闭订单吗？该操作不能撤销！</span>
                              </Descriptions.Item>
                              {orderInfo.paymentTime && (
                                <>
                                  <Descriptions.Item label="">
                                    <span>订单关闭后，钱款将原路退还给客户</span>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="">
                                    <span>订单商品如已发货，请及时联系物流或用户，以退回商品</span>
                                  </Descriptions.Item>
                                </>
                              )}
                            </Descriptions>

                            {orderInfo.paymentTime && (
                              <>
                                <ProFormText
                                  name="refundRemark"
                                  placeholder={'请输入退款备注，该消息客户可见'}
                                />
                                <Space direction={'vertical'}>
                                  <span>
                                    退款金额:&nbsp;
                                    <span style={{ color: 'red' }}>
                                      $&nbsp;{orderInfo.payAmount}
                                    </span>
                                  </span>
                                </Space>
                              </>
                            )}
                          </ModalForm>
                        )}
                      </Space>
                    }
                  >
                    {perms.includes('edit-order') && [1, 8].includes(orderInfo.status) && (
                      <Button
                        type="primary"
                        onClick={async () => {
                          confirm({
                            title: '确认操作',
                            content: `确认${orderInfo.status === 1 ? '审核通过订单' : '退款'}吗?`,
                            onOk: async () => {
                              if (orderInfo.status === 1) {
                                await axios.get(`/order/review/${orderId}`)
                                message.success('订单审核成功')
                              } else {
                                await axios.post(`/order/refundAction`, {
                                  id: orderId,
                                  status: true
                                })
                                message.success('确认退款成功')
                              }

                              navigate('/trade/order')
                            }
                          })
                        }}
                      >
                        {orderInfo.status === 1 ? '通过审核' : '确认退款'}
                      </Button>
                    )}
                    {perms.includes('edit-order') && orderInfo.status === 8 && (
                      <Button
                        type="primary"
                        onClick={async () => {
                          confirm({
                            title: '确认操作',
                            content: '确认拒绝退款吗?',
                            onOk: async () => {
                              await axios.post(`/order/refundAction`, {
                                id: orderId,
                                status: false
                              })
                              message.success('拒绝退款成功')
                              navigate('/trade/order')
                            }
                          })
                        }}
                      >
                        拒绝退款
                      </Button>
                    )}
                    {perms.includes('edit-order') && orderInfo.status === 2 && (
                      <ModalForm<{
                        fexExNumber: string
                      }>
                        width={400}
                        title="标记发货"
                        trigger={<Button type="primary">标记发货</Button>}
                        autoFocusFirstInput
                        modalProps={{
                          destroyOnClose: true
                        }}
                        onFinish={async (values) => {
                          await axios
                            .post(`/order/shipStart/${orderId}`, {
                              ...values
                            })
                            .then(async () => {
                              message.success('订单标记发货成功')
                              getOrderDetails()
                            })
                          return true
                        }}
                      >
                        <ProFormText
                          name="fexExNumber"
                          label="Fedex追踪单号"
                          initialValue={orderInfo.fexExNumber || ''}
                        />
                      </ModalForm>
                    )}
                  </FooterToolbar>
                )}
              </div>
              <div style={{ minWidth: '400px', marginLeft: '16px', height: '100%' }}>
                <Card
                  title="商品清单"
                  className={'card order'}
                  bordered={false}
                  extra={<span>共{orderInfo.productList.length}件</span>}
                >
                  {goodsList.map((d: any) => {
                    return (
                      <div className={'sku-info'} key={d.productId}>
                        <div className={'title'}>{d.productName}</div>
                        {d.children.map((c: any) => {
                          return (
                            <div
                              key={c.id}
                              className="details"
                              style={{
                                paddingRight: '0px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%'
                              }}
                            >
                              <div className="pic">
                                <img src={c.url} alt="" />
                              </div>
                              <div className={'info'} style={{ flex: '1', minWidth: '150px' }}>
                                <span className={'name'}>{c.colorName}</span>
                                {c.format?.map((f: any) => {
                                  return (
                                    <span key={f.tagName} className={'tips'}>
                                      {f['unitName']}：{f.tagName}
                                    </span>
                                  )
                                })}
                              </div>
                              <Space
                                direction={'vertical'}
                                className={'price'}
                                style={{ marginLeft: '0' }}
                              >
                                <span>$ {c.price}</span>
                                <span>x {c['quantity']}</span>
                              </Space>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </Card>
              </div>
            </Flex>
          )}
        </div>

        <Modal
          title="订单状态"
          open={isModalOpen}
          maskClosable
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => {
                setIisModalOpen(false)
              }}
            >
              确定
            </Button>
          ]}
          onOk={() => {
            setIisModalOpen(false)
          }}
          onCancel={() => {
            setIisModalOpen(false)
          }}
        >
          <div style={{ height: '500px', overflowY: 'auto' }}>
            {orderInfo.statusMap?.length && orderInfo['fexExDetails'] && (
              <Space direction={'vertical'}>
                {orderInfo['fexExDetails']['trackResults'][0]['scanEvents'] &&
                  orderInfo['fexExDetails']['trackResults'][0]['scanEvents'].map(
                    (d: any, index: number) => {
                      return (
                        <Space key={index} size={'middle'}>
                          <span>[{d['date'].substring(0, 16).replace('T', ' ')}]</span>

                          <span>{d['eventDescription']}</span>
                        </Space>
                      )
                    }
                  )}
                {[
                  ...orderInfo.statusMap.filter((d: any) => ![6, 7].includes(d.status)),
                  {
                    status: orderInfo.status,
                    time: orderInfo.updateTime
                  }
                ]
                  .reverse()
                  .map((d: any) => {
                    return (
                      <Space key={d.time} size={'middle'}>
                        <span>[{d.time}]</span>
                        {d.status === -1 && <span>订单已关闭</span>}
                        {d.status === 0 && <span>订单已提交，等待用户支付</span>}
                        {d.status === 1 && <span>订单已支付，等待用户审核</span>}
                        {d.status === 2 && <span>商家审核通过，等待仓库发货</span>}
                        {d.status === 6 && <span>订单正在退款处理中...</span>}
                        {d.status === 8 && <span>订单正在售后处理中...</span>}

                        {d.status === 3 && <span>发送到联邦快递</span>}
                      </Space>
                    )
                  })}
              </Space>
            )}
          </div>
        </Modal>
      </Spin>
    </PageContainer>
  )
}

export default OrderDetails
