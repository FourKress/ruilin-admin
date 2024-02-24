import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { DragSortTable, ProColumns } from '@ant-design/pro-components'
import { Button, Flex, Input, message, Modal, Space } from 'antd'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

function Summary({ productId }: { productId: string | undefined }) {
  const [summaryList, setSummaryList] = useState<any[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)

  const getSummaryList = () => {
    setLoading(true)
    axios
      .get(`/product-summary/list/${productId}`)
      .then((res: any) => {
        setSummaryList(res)
      })
      .finally(() => {
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
        return (
          <Input
            defaultValue={record.name}
            placeholder="请输入标题"
            onBlur={async (e) => {
              const value = e.target.value
              if (value && summaryList.some((d: any) => d.id !== record.id && d.name === value)) {
                message.error('简介标题重复，请重新输入')
                setSummaryList([...summaryList])
              } else {
                setSummaryList(
                  summaryList.map((d: any) => {
                    return {
                      ...d,
                      name: record.id === d.id ? value : d.name
                    }
                  })
                )
              }
            }}
          />
        )
      }
    },
    {
      title: '内容',
      dataIndex: 'desc',
      ellipsis: true,
      render: (_, record) => {
        return (
          <Input.TextArea
            defaultValue={record.desc}
            placeholder="请输入内容"
            onBlur={async (e) => {
              const value = e.target.value
              setSummaryList(
                summaryList.map((d: any) => {
                  return {
                    ...d,
                    desc: record.id === d.id ? value : d.desc
                  }
                })
              )
            }}
          />
        )
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
      <Flex style={{ height: '28px' }} justify={'space-between'} align={'center'}>
        <h4>文字简介</h4>

        <Button
          type="primary"
          key="primary"
          onClick={() => {
            setSummaryList([...summaryList, { name: '', desc: '', id: Date.now() }])
            return true
          }}
        >
          <PlusOutlined /> 新建
        </Button>
      </Flex>

      <DragSortTable
        dragSortKey="sort"
        onDragSortEnd={handleDragSortEnd}
        loading={loading}
        dataSource={summaryList}
        size={'small'}
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
