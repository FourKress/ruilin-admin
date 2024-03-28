import { FC, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloseCircleFilled, CopyOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProForm,
  ProFormDigit,
  ProFormText,
  ProTable
} from '@ant-design/pro-components'
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Flex,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Tag
} from 'antd'
import currency from 'currency.js'
import dayjs from 'dayjs'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'
import { getPriceRange, handleCopy, orderStatusTipsMap } from '@/views/trade/utils.ts'

import '../style.scss'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const CustomerDetails: FC<Record<string, any>> = () => {
  const navigate = useNavigate()
  const { customerId } = useParams()
  console.log(customerId, useParams())

  const actionRef = useRef<ActionType>()
  const [loading, setLoading] = useState<boolean>(false)
  const [customerInfo, setCustomerInfo] = useState<Record<string, any>>({})

  const getCustomerDetails = () => {
    if (!customerId) return
    setLoading(true)
    axios
      .get(`/customer/detailsBySys/${customerId}`)
      .then((res: Record<string, any>) => {
        setCustomerInfo(res)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    getCustomerDetails()
  }, [])

  const [modifyAmount, setModifyAmount] = useState<number>(0)

  const columns: ProColumns[] = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      hideInTable: true
    },

    {
      title: '下单日期',
      dataIndex: 'createDate',
      hideInTable: true,
      renderFormItem: () => {
        return <DatePicker.RangePicker inputReadOnly />
      }
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
                <div className={'sku-info'} key={d.productId}>
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
      width: 250,
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
      title: '订单状态',
      dataIndex: 'status',
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
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              {
                value: '0',
                label: <span>待支付</span>
              },
              {
                value: '1',
                label: <span>待审核</span>
              },
              {
                value: '2',
                label: <span>待发货</span>
              },
              {
                value: '3',
                label: <span>运输中</span>
              },
              {
                value: '4',
                label: <span>待收货</span>
              },
              {
                value: '8',
                label: <span>售后中</span>
              },
              {
                value: '5',
                label: <span>已完成</span>
              },
              {
                value: '-1',
                label: <span>已关闭</span>
              }
            ]}
          />
        )
      }
    },
    {
      title: '物流单号',
      dataIndex: 'fexExNumber',
      hideInTable: true
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 80,
      render: (_: any, record: Record<string, any>) => {
        const status = record.status
        return (
          <Space direction={'vertical'}>
            {perms.includes('edit-order') && perms.includes('details-customer') && status === 1 && (
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
            {perms.includes('edit-order') && perms.includes('details-customer') && status === 2 && (
              <a
                key="price"
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认审核通过订单吗?',
                    onOk: async () => {
                      await axios.get(`/order/review/${record.id}`)
                      message.success('订单确认成功')
                    }
                  })
                }}
              >
                标记发货
              </a>
            )}
            {perms.includes('edit-order') &&
              perms.includes('details-customer') &&
              record.fexExNumber && (
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
            {perms.includes('edit-order') && perms.includes('details-customer') && (
              <a
                key="details"
                onClick={async () => {
                  navigate(`/trade/order/details/${record.id}`)
                }}
              >
                详情
              </a>
            )}
            {perms.includes('edit-order') && perms.includes('details-customer') && status === 0 && (
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
            {perms.includes('edit-order') && perms.includes('details-customer') && (
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

  return (
    <PageContainer
      breadcrumbRender={false}
      className={'order'}
      header={{
        title: '客户详情',
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
          {customerInfo.id && (
            <Flex justify={'flex-start'} align={'flex-start'}>
              <div>
                <ProTable
                  search={{
                    labelWidth: 'auto'
                  }}
                  rowKey="id"
                  headerTitle={'客户订单'}
                  actionRef={actionRef}
                  columns={columns}
                  request={async (params) => {
                    const { pageSize, current, createDate = [], status, ...other } = params
                    const [startDate, endDate] = createDate
                    const { records, total }: { records: any; total: number } = await axios.post(
                      '/order/list',
                      {
                        size: pageSize,
                        current,
                        customerId: customerId,
                        ...(startDate
                          ? {
                              startDate: dayjs(startDate)
                                .startOf('date')
                                .format('YYYY-MM-DD HH:mm:ss'),
                              endDate: dayjs(endDate).endOf('date').format('YYYY-MM-DD HH:mm:ss')
                            }
                          : {}),
                        status: !status ? undefined : Number(status),
                        ...lodash.omitBy(other, (value) => !value && value !== false)
                      }
                    )
                    return {
                      data: records,
                      total,
                      success: true
                    }
                  }}
                  pagination={{
                    pageSize: 20,
                    hideOnSinglePage: true
                  }}
                />
              </div>
              <div style={{ minWidth: '400px', marginLeft: '16px', height: '100%' }}>
                <Card title="客户信息" className={'card order'} bordered={false}>
                  <ProForm<{
                    nickname: string
                    email: string
                    code?: string
                    phone?: string
                    remark?: string
                    lastLoginTime?: string
                    createTime?: string
                  }>
                    colon={true}
                    readonly={true}
                    initialValues={{
                      ...customerInfo
                    }}
                    submitter={false}
                  >
                    <ProFormText name="nickname" label="客户昵称" />
                    <ProFormText name="email" label="电子邮箱" />
                    <ProFormText name="code" label="电话国号" />
                    <ProFormText name="phone" label="电话号码" />
                    <ProFormText name="remark" label="备注" />
                    <ProFormText name="lastLoginTime" label="最后活跃时间" />
                    <ProFormText name="createTime" label="创建时间" />
                  </ProForm>
                </Card>
              </div>
            </Flex>
          )}
        </div>
      </Spin>
    </PageContainer>
  )
}

export default CustomerDetails
