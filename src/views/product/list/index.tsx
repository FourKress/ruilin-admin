import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormText,
  ProFormTextArea,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, Form, message, Modal, Select } from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function ProductList() {
  const actionRef = useRef<ActionType>()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const columns: ProColumns[] = [
    {
      title: '产品系列名称',
      dataIndex: 'name'
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
      title: '介绍',
      width: 360,
      hideInSearch: true,
      ellipsis: true,
      dataIndex: 'desc'
    },
    {
      title: '最后编辑时间',
      dataIndex: 'updateTime',
      hideInSearch: true,
      valueType: 'dateTime'
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 110,
      render: (_, record: Record<string, any>) => {
        return [
          perms.includes('edit-product') && (
            <a
              key="modify"
              onClick={async () => {
                navigate(`/product/series/details/${record.id}`)
              }}
            >
              详情
            </a>
          ),
          perms.includes('edit-product') && (
            <a
              key="active"
              onClick={() => {
                if (!record.isComplete) {
                  confirm({
                    title: '确认操作',
                    content: '请先编辑详情，完善颜色相关信息后再上架',
                    onOk() {
                      navigate(`/product/series/details/${record.id}`)
                    }
                  })
                  return
                }

                confirm({
                  title: '确认操作',
                  content: '确认更改产品系列状态吗?',
                  onOk() {
                    handleActive(record)
                  }
                })
              }}
            >
              {record.isActive ? '下架' : '上架'}
            </a>
          ),
          perms.includes('delete-product') && (
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除该产品系列吗?',
                  onOk() {
                    handleDelete(record)
                  }
                })
              }}
            >
              删除
            </a>
          )
        ]
      }
    }
  ]

  const handleActive = (data: any) => {
    axios
      .post(`/product/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('产品系列状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleDelete = (data: any) => {
    axios.get(`/product/delete/${data.id}`).then(async () => {
      message.success('删除产品系列成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        rowKey="id"
        headerTitle="产品系列列表"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto'
        }}
        toolBarRender={() => [
          perms.includes('add-product') && (
            <ModalForm<{
              name: string
              desc: string
              remark: string
            }>
              title="新建产品"
              trigger={
                <Button type="primary" key="primary">
                  <PlusOutlined /> 新建
                </Button>
              }
              width={400}
              form={form}
              autoFocusFirstInput
              modalProps={{
                destroyOnClose: true
              }}
              onFinish={async (values) => {
                await axios.post(`/product/create`, {
                  ...values
                })
                actionRef.current?.reloadAndRest?.()
                return true
              }}
            >
              <ProFormText
                name="name"
                rules={[
                  {
                    required: true,
                    message: '请输入产品名称'
                  }
                ]}
                label="产品名称"
              />
              <ProFormTextArea
                name="desc"
                rules={[
                  {
                    required: true,
                    message: '请输入产品介绍'
                  }
                ]}
                label="产品介绍"
              />
            </ModalForm>
          )
        ]}
        request={async (params) => {
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/product/page',
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

export default ProductList
