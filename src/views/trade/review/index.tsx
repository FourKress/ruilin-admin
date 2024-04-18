import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components'
import { Badge, Button, Image, message, Modal, Select, Space } from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function ReviewList() {
  const actionRef = useRef<ActionType>()
  const navigate = useNavigate()

  const columns: ProColumns[] = [
    {
      title: '评价内容',
      dataIndex: 'content',
      hideInSearch: true,
      ellipsis: true
    },
    {
      title: '所属商品',
      dataIndex: 'code',
      ellipsis: true,
      width: 400,
      render: (_, record: Record<string, any>) => {
        return (
          <>
            <Image
              width={80}
              src={record.url}
              preview={{
                toolbarRender: () => <span></span>
              }}
            />
            <span style={{ paddingLeft: '8px' }}>
              {record.productName} {record.colorName}
            </span>
          </>
        )
      }
    },
    {
      title: '订单号',
      dataIndex: 'orderNo'
    },
    {
      title: '客户昵称',
      dataIndex: 'nickname'
    },
    {
      title: '评价星级',
      dataIndex: 'score',
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: 5, label: '5星' },
              { value: 4, label: '4星' },
              { value: 3, label: '3星' },
              { value: 2, label: '2星' },
              { value: 1, label: '1星' }
            ]}
          />
        )
      }
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      hideInSearch: true,
      valueType: 'dateTime'
    },
    {
      title: '是否推荐',
      dataIndex: 'isTop',
      defaultFilteredValue: null,
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '已推荐' : '未推荐'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '已推荐' },
              { value: false, label: '未推荐' }
            ]}
          />
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      defaultFilteredValue: null,
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '上架' : '下架'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '上架' },
              { value: false, label: '下架' }
            ]}
          />
        )
      }
    },
    {
      title: '评价来源',
      dataIndex: 'isSys',
      defaultFilteredValue: null,
      render: (_, record: Record<string, any>) => {
        return record.orderNo ? '用户' : '系统'
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '用户' },
              { value: false, label: '系统' }
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
      width: 60,
      render: (_, record: Record<string, any>) => {
        return (
          <Space direction={'vertical'}>
            {perms.includes('edit-review') && (
              <a
                key="active"
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认更改评价状态吗?',
                    onOk: async () => {
                      await handleActive(record)
                    }
                  })
                }}
              >
                {record.isActive ? '下架' : '上架'}
              </a>
            )}
            {perms.includes('edit-review') && (
              <a
                key="top"
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认更改评价推荐状态吗?',
                    onOk: async () => {
                      await handleTop(record)
                    }
                  })
                }}
              >
                {record.isTop ? '取消推荐' : '推荐'}
              </a>
            )}
            {perms.includes('delete-review') && (
              <a
                key="delete"
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认删除该评价吗?',
                    onOk: async () => {
                      await axios.get(`/review/delete/${record.id}`)
                      actionRef.current?.reloadAndRest?.()
                      message.success('评价删除成功')
                    }
                  })
                }}
              >
                删除
              </a>
            )}
            {perms.includes('edit-review') && (
              <a
                key="modify"
                onClick={async () => {
                  navigate(`/trade/review/details/${record.id}`)
                }}
              >
                详情
              </a>
            )}
          </Space>
        )
      }
    }
  ]

  const handleActive = async (data: any) => {
    await axios
      .post(`/review/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success(`评价${data.isActive ? '下架' : '上架'}成功`)
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleTop = async (data: any) => {
    await axios
      .post(`/review/top`, {
        id: data.id,
        isTop: !data.isTop
      })
      .then(async () => {
        message.success(`评价${data.isTop ? '取消推荐' : '推荐'}成功`)
        actionRef.current?.reloadAndRest?.()
      })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        rowKey="id"
        headerTitle="评价列表"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto'
        }}
        toolBarRender={() => [
          perms.includes('add-review') && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                navigate(`/trade/review/details`)
              }}
            >
              <PlusOutlined /> 新增评价
            </Button>
          )
        ]}
        request={async (params) => {
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/review/page',
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

export default ReviewList
