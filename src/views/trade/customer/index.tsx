import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseCircleFilled } from '@ant-design/icons'
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components'
import { Badge, DatePicker, message, Modal, Select } from 'antd'
import currency from 'currency.js'
import dayjs from 'dayjs'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function Customer() {
  const actionRef = useRef<ActionType>()
  const navigate = useNavigate()

  const columns: ProColumns[] = [
    {
      title: '客户昵称',
      dataIndex: 'nickname'
    },
    {
      title: '邮箱',
      dataIndex: 'email'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      render: (_, record: Record<string, any>) => {
        return record.phone ? `+${record.code} ${record.phone}` : '-'
      }
    },
    {
      title: '地址',
      dataIndex: 'address'
    },
    {
      title: '订单数',
      hideInSearch: true,
      dataIndex: 'orderList',
      render: (_, record: Record<string, any>) => {
        return record.orderList.length
      }
    },
    {
      title: '消费金额',
      hideInSearch: true,
      dataIndex: 'totalPrice',
      render: (_, record: Record<string, any>) => {
        const orderList = record.orderList
        const totalPrice = orderList
          .filter((d: any) => [1, 2, 3, 4, 5].includes(d.status))
          .reduce((pre: number, cur: any) => {
            return currency(pre).add(cur['payAmount']).value
          }, 0)
        return <span>$ {totalPrice}</span>
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '使用中' : '已禁用'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '使用中' },
              { value: false, label: '已禁用' }
            ]}
          />
        )
      }
    },
    {
      title: '最后活跃时间',
      dataIndex: 'lastLoginTime',
      render: (lastLoginTime, _row: any) => {
        return <span>{lastLoginTime}</span>
      },
      renderFormItem: () => {
        return <DatePicker.RangePicker inputReadOnly />
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      render: (createTime, _row: any) => {
        return <span>{createTime}</span>
      },
      renderFormItem: () => {
        return <DatePicker.RangePicker inputReadOnly />
      }
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 80,
      render: (_, record) => {
        return [
          perms.includes('edit-customer') && (
            <a
              key="active"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认更改客户状态吗?',
                  onOk: async () => {
                    await handleActive(record)
                  }
                })
              }}
            >
              {record.isActive ? '禁用' : '启用'}
            </a>
          ),
          perms.includes('details-customer') && (
            <a
              key="records"
              onClick={() => {
                navigate(`/trade/customer/details/${record.id}`)
              }}
            >
              详情
            </a>
          )
        ]
      }
    }
  ]

  const handleActive = async (data: any) => {
    await axios
      .post(`/customer/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('客户状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        search={{
          labelWidth: 'auto'
        }}
        rowKey="id"
        headerTitle="客户列表"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const { pageSize, current, createTime = [], lastLoginTime = [], ...other } = params
          const [createStartDate, createEndDate] = createTime
          const [lastStartDate, lastEndDate] = lastLoginTime
          const { records, total }: { records: any; total: number } = await axios.post(
            '/customer/page',
            {
              size: pageSize,
              current,
              ...(createStartDate
                ? {
                    createStartDate: dayjs(createStartDate)
                      .startOf('date')
                      .format('YYYY-MM-DD HH:mm:ss'),
                    createEndDate: dayjs(createEndDate).endOf('date').format('YYYY-MM-DD HH:mm:ss')
                  }
                : {}),
              ...(lastStartDate
                ? {
                    lastStartDate: dayjs(lastStartDate)
                      .startOf('date')
                      .format('YYYY-MM-DD HH:mm:ss'),
                    lastEndDate: dayjs(lastEndDate).endOf('date').format('YYYY-MM-DD HH:mm:ss')
                  }
                : {}),
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
    </PageContainer>
  )
}

export default Customer
