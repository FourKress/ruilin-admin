import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { ModalForm, ProFormText, ProList, ProTable } from '@ant-design/pro-components'
import {
  Button,
  Col,
  ConfigProvider,
  Form,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  theme,
  Tooltip
} from 'antd'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

function Unit({ productId }: { productId: string | undefined }) {
  const [unitForm] = Form.useForm<{ name: string }>()
  const [unitList, setUnitList] = useState([])
  const [unitLoading, setUnitLoading] = React.useState<boolean>(false)
  const [tagForm] = Form.useForm()
  const { token } = theme.useToken()

  const handleDeleteUnit = async (id: string) => {
    await axios.get(`/unit/delete/${id}`)
    getUnitList()
  }

  const getUnitList = () => {
    setUnitLoading(true)
    axios.get(`/unit/list/${productId}`).then((res: any) => {
      setUnitList(handleRenderFormat(res))
      setUnitLoading(false)
    })
  }

  useEffect(() => {
    getUnitList()
  }, [])

  const handleRenderFormat = (res: any) => {
    return res.map((item: any) => ({
      title: item.name,
      actions: [
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
      ],
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
                    closable
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
              <Tag style={tagPlusStyle} icon={<PlusOutlined />}>
                <ModalForm<{
                  name: string
                }>
                  title="新建标签"
                  trigger={<span>新建</span>}
                  width={300}
                  form={tagForm}
                  autoFocusFirstInput
                  modalProps={{
                    destroyOnClose: true
                  }}
                  onFinish={async (values) => {
                    await axios.post(`/tag/create`, {
                      name: values.name,
                      unitId: item.id,
                      productId: productId
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
    <>
      <ProTable
        search={false}
        rowKey="id"
        headerTitle=""
        options={{
          reload: () => {
            getUnitList()
          },
          setting: false,
          density: false
        }}
        tableRender={(_props, _dom, domList) => {
          return (
            <>
              {domList.toolbar}
              <Spin spinning={unitLoading}>
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
              </Spin>
            </>
          )
        }}
        toolBarRender={() => [
          <ModalForm<{
            name: string
          }>
            title="新建规格"
            trigger={
              <Row>
                <Col>
                  <Button type="primary">
                    <PlusOutlined />
                    新建
                  </Button>
                </Col>
              </Row>
            }
            width={300}
            form={unitForm}
            autoFocusFirstInput
            modalProps={{
              destroyOnClose: true
            }}
            onFinish={async (values) => {
              await axios.post(`/unit/create`, {
                name: values.name,
                productId: productId
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
        ]}
        pagination={false}
      />
    </>
  )
}

export default Unit
