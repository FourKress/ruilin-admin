import { useRef } from 'react'
import { CloseCircleFilled } from '@ant-design/icons'
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components'
import { Badge, message, Modal, Select } from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function Customer() {
  const actionRef = useRef<ActionType>()

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
      title: '创建登录时间',
      dataIndex: 'createTime',
      hideInSearch: true,
      valueType: 'dateTime'
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
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 100,
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
          <a
            key="records"
            onClick={() => {
              console.log('购买记录')
            }}
          >
            购买记录
          </a>
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
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/customer/page',
            {
              size: pageSize,
              current,
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
