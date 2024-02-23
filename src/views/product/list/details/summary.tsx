import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import {
  DragSortTable,
  ModalForm,
  ProColumns,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components'
import { Button, Flex, Form, Input, Modal, Space } from 'antd'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

function Summary({ productId }: { productId: string | undefined }) {
  const [summaryList, setSummaryList] = useState<any[]>([])
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState<boolean>(false)

  const getSummaryList = () => {
    setLoading(true)
    axios.get(`/product-summary/list/${productId}`).then((res: any) => {
      setSummaryList(res)
      setLoading(false)
    })
  }

  useEffect(() => {
    getSummaryList()
  }, [])

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
      width: 260,
      render: (_, record) => {
        return <Input defaultValue={record.name} placeholder="请输入标题" />
      }
    },
    {
      title: '内容',
      dataIndex: 'desc',
      ellipsis: true,
      render: (_, record) => {
        return <Input.TextArea defaultValue={record.desc} placeholder="请输入内容" />
      }
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 40,
      render: (_, record) => {
        return [
          <a
            key="delete"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认删除该文字简介吗?',
                onOk() {
                  const { name, desc } = record
                  setSummaryList(summaryList.filter((d) => d.name !== name && d.desc !== desc))
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
  }

  return (
    <Space direction={'vertical'} size={'middle'} style={{ width: '100%' }}>
      <Flex
        style={{ height: '28px', marginTop: '20px' }}
        justify={'space-between'}
        align={'center'}
      >
        <h4>文字简介</h4>

        <ModalForm<{
          name: string
          desc: string
        }>
          trigger={
            <Button type="primary" key="primary">
              <PlusOutlined /> 新建
            </Button>
          }
          title={'新建简介'}
          form={form}
          autoFocusFirstInput
          width={400}
          modalProps={{
            destroyOnClose: true
          }}
          onFinish={async (values) => {
            console.log(values)
            setSummaryList([...summaryList, { ...values }])
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
      </Flex>

      <DragSortTable
        dragSortKey="sort"
        onDragSortEnd={handleDragSortEnd}
        loading={loading}
        dataSource={summaryList}
        options={{
          reload: false,
          setting: false,
          density: false
        }}
        search={false}
        rowKey="id"
        headerTitle=""
        columns={columns}
        pagination={false}
      />
    </Space>
  )
}

export default Summary
