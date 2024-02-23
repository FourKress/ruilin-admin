import React, { useEffect, useState } from 'react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  DragSortTable,
  ModalForm,
  ProColumns,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components'
import { Button, Form, message, Modal, Space } from 'antd'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

function Summary({ productId }: { productId: string | undefined }) {
  const [summaryList, setSummaryList] = useState<any[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)
  const [form] = Form.useForm()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑简介'
  })

  const genExtra = (id: string) => (
    <DeleteOutlined
      style={{ color: 'red' }}
      onClick={(event) => {
        event.stopPropagation()
        confirm({
          title: '确认操作',
          content: '确认删除该文字简介吗?',
          onOk() {
            axios.get(`/product-summary/delete/${id}`).then(async () => {
              getSummaryList()
              await message.success('删除文字简介成功')
            })
          }
        })
      }}
    />
  )

  const getSummaryList = () => {
    setLoading(true)
    axios.get(`/product-summary/list/${productId}`).then((res: any) => {
      setSummaryList(
        res.map((d: any) => {
          return {
            ...d,
            key: d.id,
            extra: genExtra(d.id)
          }
        })
      )

      setLoading(false)
    })
  }

  useEffect(() => {
    getSummaryList()
  }, [])

  const handleDelete = (data: any) => {
    setLoading(true)
    axios
      .get(`/product-summary/delete/${data.id}`)
      .then(async () => {
        message.success('删除简介成功')
        getSummaryList()
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleUpdate = (data: any) => {
    const id = form.getFieldValue('id')
    setLoading(true)
    axios
      .post(`/product-summary/${id ? 'update' : 'create'}`, {
        id: id || undefined,
        ...data,
        productId: productId
      })
      .then(async () => {
        message.success(`简介${id ? '编辑' : '新建'}成功`)
        getSummaryList()
        setModalInfo({
          open: false
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const columns: ProColumns[] = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 60,
      className: 'drag-visible'
    },
    {
      title: '标题',
      dataIndex: 'name',
      width: 260
    },
    {
      title: '内容',
      dataIndex: 'desc',
      ellipsis: true
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 80,
      render: (_, record) => {
        return [
          <a
            key="modify"
            onClick={() => {
              form.setFieldsValue({
                ...record
              })
              setModalInfo({
                open: true,
                title: '编辑简介'
              })
            }}
          >
            编辑
          </a>,

          <a
            key="delete"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认删除简介吗?',
                onOk() {
                  handleDelete(record)
                }
              })
            }}
          >
            删除
          </a>
        ]
      }
    }
  ]

  const handleDragSortEnd = async (
    _beforeIndex: number,
    _afterIndex: number,
    newDataSource: any
  ) => {
    setSummaryList(newDataSource)
    setLoading(true)
    const ids = newDataSource.map((d: any) => d.id)
    axios
      .post(`/product-summary/batchSort`, {
        ids
      })
      .then(async () => {
        message.success('排序成功')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <>
      <Space direction={'vertical'} style={{ width: '100%' }}>
        <h4 style={{ marginTop: '16px' }}>文字简介</h4>

        <DragSortTable
          dragSortKey="sort"
          onDragSortEnd={handleDragSortEnd}
          dataSource={summaryList}
          loading={loading}
          options={{
            reload: () => {
              getSummaryList()
            }
          }}
          search={false}
          rowKey="id"
          headerTitle=""
          columns={columns}
          toolBarRender={() => [
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                form.setFieldsValue({
                  name: '',
                  desc: '',
                  id: ''
                })
                setModalInfo({
                  open: true,
                  title: '新建颜色'
                })
              }}
            >
              <PlusOutlined /> 新建
            </Button>
          ]}
          pagination={false}
        />

        <ModalForm<{
          name: string
          desc: string
        }>
          open={modalInfo.open}
          initialValues={{}}
          title={modalInfo.title}
          form={form}
          autoFocusFirstInput
          width={400}
          modalProps={{
            onCancel: () => {
              setModalInfo({ open: false })
            }
          }}
          onFinish={async (values) => {
            await handleUpdate(values)
            setModalInfo({
              open: false
            })
            return true
          }}
        >
          <ProFormText
            name="name"
            rules={[
              {
                required: true,
                message: '请输入简介名称'
              }
            ]}
            label="简介名称"
          />
          <ProFormTextArea
            name="desc"
            rules={[
              {
                required: true,
                message: '请输入简介详情'
              }
            ]}
            label="简介详情"
          />
        </ModalForm>
      </Space>
    </>
  )
}

export default Summary
