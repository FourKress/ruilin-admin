import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components'
import { Badge, Button, DatePicker, Image, message, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function BlogPage() {
  const actionRef = useRef<ActionType>()
  const navigate = useNavigate()

  const handleActive = async (data: any) => {
    await axios
      .post(`/blog/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('博客状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleDelete = async (data: any) => {
    await axios.get(`/blog/delete/${data.id}`).then(async () => {
      actionRef.current?.reloadAndRest?.()
      message.success('删除博客成功')
    })
  }

  const columns: ProColumns[] = [
    {
      title: '关键词',
      dataIndex: 'keywords',
      hideInTable: true
    },
    {
      title: '标题',
      dataIndex: 'name',
      hideInSearch: true
    },
    {
      title: '头图',
      dataIndex: 'url',
      hideInSearch: true,
      render: (url: any, _row: any) => {
        return (
          <Image
            width={80}
            src={url}
            preview={{
              toolbarRender: () => <span></span>
            }}
          />
        )
      }
    },
    {
      title: '正文',
      dataIndex: 'text',
      hideInSearch: true
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      render: (createTime, _row: any) => {
        return <span>{createTime}</span>
      },
      renderFormItem: () => {
        return <DatePicker.RangePicker inputReadOnly />
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
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
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 100,
      render: (_, record) => {
        return [
          perms.includes('delete-blog') && (
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除博客吗?',
                  onOk: async () => {
                    await handleDelete(record)
                  }
                })
              }}
            >
              删除
            </a>
          ),
          perms.includes('edit-blog') && (
            <a
              key="active"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认更改博客状态吗?',
                  onOk: async () => {
                    await handleActive(record)
                  }
                })
              }}
            >
              {record.isActive ? '下架' : '上架'}
            </a>
          ),
          perms.includes('edit-blog') && (
            <a
              key="details"
              onClick={() => {
                navigate(`/mall/blog/details/${record.id}`)
              }}
            >
              详情
            </a>
          )
        ]
      }
    }
  ]

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        search={{
          labelWidth: 'auto'
        }}
        rowKey="id"
        headerTitle="博客管理"
        actionRef={actionRef}
        columns={columns}
        toolBarRender={() => [
          perms.includes('add-blog') && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                navigate(`/mall/blog/details`)
              }}
            >
              <PlusOutlined /> 发布
            </Button>
          )
        ]}
        request={async (params) => {
          const { pageSize, current, createTime = [], ...other } = params
          const [startDate, endDate] = createTime
          const { records, total }: { records: any; total: number } = await axios.post(
            '/blog/page',
            {
              size: pageSize,
              current,
              ...(startDate
                ? {
                    startDate: dayjs(startDate).startOf('date').format('YYYY-MM-DD HH:mm:ss'),
                    endDate: dayjs(endDate).endOf('date').format('YYYY-MM-DD HH:mm:ss')
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

export default BlogPage
