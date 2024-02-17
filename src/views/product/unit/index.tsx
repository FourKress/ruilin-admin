import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { ModalForm, ProFormText, ProList } from '@ant-design/pro-components'
import { Button, ConfigProvider, Form, Modal, Space, Tag, theme, Tooltip } from 'antd'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function Unit() {
  const { token } = theme.useToken()

  const [form] = Form.useForm<{ name: string }>()

  const [unitList, setUnitList] = useState([])

  const getUnitList = () => {
    axios.get('/unit/list').then((res: any) => {
      setUnitList(handleRenderFormat(res))
    })
  }

  useEffect(() => {
    getUnitList()
  }, [])

  const handleDeleteUnit = async (id: string) => {
    await axios.get(`/unit/delete/${id}`)
    getUnitList()
  }

  const handleRenderFormat = (res: any) => {
    return res.map((item: any) => ({
      title: item.name,
      actions: perms.includes('delete-unit')
        ? [
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除该规格吗?',
                  onOk: async () => {
                    await handleDeleteUnit(item.id)
                  }
                })
              }}
            >
              删除
            </a>
          ]
        : [],
      avatar: 'https://gw.alipayobjects.com/zos/antfincdn/UCSiy1j6jx/xingzhuang.svg',
      content: (
        <div
          style={{
            flex: 1
          }}
        >
          <ConfigProvider theme={{ algorithm: [theme.defaultAlgorithm] }}>
            <Space size={[0, 8]} wrap>
              {item.tags.map((tag: any) => {
                const { id, name } = tag
                const isLongTag = name.length > 20
                const tagElem = (
                  <Tag
                    key={id}
                    closable={perms.includes('delete-unit')}
                    style={{ userSelect: 'none' }}
                    onClose={async (e) => {
                      e.preventDefault()
                      await handleClose(id, item)
                    }}
                  >
                    {isLongTag ? `${name.slice(0, 20)}...` : name}
                  </Tag>
                )
                return isLongTag ? (
                  <Tooltip title={name} key={id}>
                    {tagElem}
                  </Tooltip>
                ) : (
                  tagElem
                )
              })}
              {perms.includes('add-unit') ? (
                <Tag style={tagPlusStyle} icon={<PlusOutlined />}>
                  <ModalForm<{
                    name: string
                  }>
                    title="New Tag"
                    trigger={<span>New Tag</span>}
                    width={300}
                    form={form}
                    autoFocusFirstInput
                    modalProps={{
                      destroyOnClose: true
                    }}
                    onFinish={async (values) => {
                      await axios.post(`/tag/create`, {
                        name: values.name,
                        unitId: item.id
                      })
                      getUnitList()
                      return true
                    }}
                  >
                    <ProFormText
                      name="name"
                      rules={[
                        {
                          required: true,
                          message: '请输入标签名称'
                        }
                      ]}
                      label="标签名称"
                    />
                  </ModalForm>
                </Tag>
              ) : (
                <span></span>
              )}
            </Space>
          </ConfigProvider>
        </div>
      )
    }))
  }

  const tagPlusStyle: React.CSSProperties = {
    height: 22,
    background: token.colorBgContainer,
    borderStyle: 'dashed'
  }

  const handleClose = async (id: string, unit: any) => {
    if (unit.tags.length === 1) {
      confirm({
        title: '确认操作',
        content: '删除最后一个标签将同步删除整个规格，确认删除吗?',
        onOk: async () => {
          await handleDeleteUnit(unit.id)
        }
      })
      return
    }

    await axios.get(`/tag/delete/${id}`)
    getUnitList()
  }

  return (
    <Space direction="vertical" size="large" style={{ display: 'flex' }}>
      {perms.includes('add-unit') ? (
        <ModalForm<{
          name: string
        }>
          title="新建规格"
          trigger={
            <Button type="primary">
              <PlusOutlined />
              新建规格
            </Button>
          }
          width={300}
          form={form}
          autoFocusFirstInput
          modalProps={{
            destroyOnClose: true
          }}
          onFinish={async (values) => {
            await axios.post(`/unit/create`, {
              name: values.name
            })
            getUnitList()
            return true
          }}
        >
          <ProFormText
            name="name"
            rules={[
              {
                required: true,
                message: '请输入规格名称'
              }
            ]}
            label="规格名称"
          />
        </ModalForm>
      ) : (
        <span></span>
      )}

      <ProList<any>
        pagination={false}
        rowSelection={false}
        grid={{ gutter: 16, column: 3 }}
        metas={{
          title: {},
          type: {},
          avatar: {},
          content: {},
          actions: {
            cardActionProps: 'extra'
          }
        }}
        dataSource={unitList}
      />
    </Space>
  )
}

export default Unit
