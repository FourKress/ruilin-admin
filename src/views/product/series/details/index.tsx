import React, { FC, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileImageOutlined, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProColumns,
  ProForm,
  ProFormText,
  ProFormUploadDragger,
  ProList,
  ProTable
} from '@ant-design/pro-components'
import {
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Form,
  Image,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  theme,
  Tooltip
} from 'antd'

import axios from '@/utils/axios.ts'
import { uploadFile } from '@/utils/fileUtils.ts'

import './style.scss'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const SeriesDetails: FC<Record<string, any>> = () => {
  const { id: productId } = useParams()

  const onFinish = async (values: Record<string, any>) => {
    try {
      console.log(values)
      // await fakeSubmitForm(values)
      message.success('提交成功')
    } catch {
      // console.log
    }
  }

  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑颜色'
  })
  const [fileList, setFileList] = useState<any>([])
  const [tagForm] = Form.useForm()
  const [colorForm] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  const { token } = theme.useToken()
  const [unitForm] = Form.useForm<{ name: string }>()
  const [unitList, setUnitList] = useState([])
  const [loading, setLoading] = React.useState<boolean>(false)

  const columns: ProColumns[] = [
    {
      title: '颜色名',
      dataIndex: 'name'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '使用中' : '已停用'} />]
      }
    },
    {
      title: '描述',
      dataIndex: 'desc'
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 140,
      render: (_, record) => {
        return [
          perms.includes('edit-perm') && (
            <a
              key="modify"
              onClick={() => {
                const fileList = [
                  {
                    uid: record.uid,
                    name: record.fileName,
                    type: record.fileType,
                    status: 'done'
                  }
                ]
                colorForm.setFieldsValue({
                  ...record,
                  fileList
                })
                setFileList(fileList)
                setModalInfo({
                  open: true,
                  title: '编辑颜色'
                })
              }}
            >
              编辑
            </a>
          ),
          perms.includes('edit-perm') && (
            <a
              key="active"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认更改颜色状态吗?',
                  onOk() {
                    handleActive(record)
                  }
                })
              }}
            >
              {record.isActive ? '停用' : '启用'}
            </a>
          ),

          <a
            key="preview"
            onClick={() => {
              setPreviewInfo({
                visible: true,
                url: record.url
              })
            }}
          >
            预览
          </a>,

          perms.includes('delete-banner') && (
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除颜色吗?',
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

  const handleUpdate = async (data: any) => {
    const id = colorForm.getFieldValue('id')
    const {
      fileList: [file],
      ...other
    } = data
    console.log(fileList, file)

    const { uid, type, name } = file
    const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`

    const isUploadFile = file.status !== 'done'

    console.log(name, objectKey, isUploadFile)
    if (isUploadFile) {
      await uploadFile(file.originFileObj, objectKey)
    }

    await axios.post(`/color/${id ? 'update' : 'create'}`, {
      id: id || undefined,
      ...other,
      objectKey,
      fileName: name,
      uid,
      fileType: type
    })

    message.success(`颜色${id ? '编辑' : '新建'}成功`)
    actionRef.current?.reloadAndRest?.()
  }

  const handleActive = (data: any) => {
    axios
      .post(`/color/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('颜色状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleDelete = (data: any) => {
    axios.get(`/color/delete/${data.id}`).then(async () => {
      message.success('删除颜色成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  const getUnitList = () => {
    setLoading(true)
    axios.get('/unit/list').then((res: any) => {
      setUnitList(handleRenderFormat(res))
      setLoading(false)
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
    <PageContainer breadcrumbRender={false}>
      <ProForm
        className={'series-details'}
        layout="vertical"
        submitter={{
          render: (_props: any, dom: any) => {
            return <FooterToolbar>{dom}</FooterToolbar>
          }
        }}
        initialValues={{ name: 1, desc: 2 }}
        onFinish={onFinish}
      >
        <>
          <Card title="基础信息" className={'card'} bordered={false}>
            <Row gutter={24}>
              <Col md={12}>
                <ProFormText
                  label={'系列名称'}
                  name="name"
                  rules={[{ required: true, message: '请输入系列名称' }]}
                  placeholder="请输入系列名称"
                />
              </Col>
              <Col md={12}>
                <ProFormText
                  label={'系列介绍'}
                  name="desc"
                  rules={[{ required: true, message: '请输入系列介绍' }]}
                  placeholder="请输入系列介绍"
                />
              </Col>
            </Row>
          </Card>

          <Card title="颜色管理" className={'card'} bordered={false}>
            <ProTable
              search={false}
              rowKey="id"
              headerTitle=""
              actionRef={actionRef}
              columns={columns}
              toolBarRender={() => [
                perms.includes('add-banner') && (
                  <Button
                    type="primary"
                    key="primary"
                    onClick={() => {
                      colorForm.setFieldsValue({
                        name: '',
                        link: '',
                        desc: '',
                        fileList: [],
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
                )
              ]}
              request={async (params) => {
                const { pageSize, current } = params
                const { records, total }: { records: any; total: number } = await axios.post(
                  '/color/page',
                  {
                    size: pageSize,
                    current
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
                hideOnSinglePage: true,
                onChange: (page) => console.log(page)
              }}
            />

            <ModalForm<{
              name: string
              link: string
              desc: string
            }>
              open={modalInfo.open}
              initialValues={{}}
              title={modalInfo.title}
              form={colorForm}
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
                label="颜色名称"
                placeholder={'请输入1-20位颜色名称'}
                fieldProps={{
                  maxLength: 20
                }}
                rules={[
                  () => ({
                    validator(_, value) {
                      if (value && value.length > 10) {
                        return Promise.reject(new Error('请输入1-20位颜色名称'))
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
              />
              <ProFormText
                name="desc"
                label="描述"
                placeholder={'请输入描述'}
                fieldProps={{
                  maxLength: 50
                }}
                rules={[
                  () => ({
                    validator(_, value) {
                      if (value && value.length > 50) {
                        return Promise.reject(new Error('描述最多50个字'))
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
              />
              <ProFormUploadDragger
                name="fileList"
                label="图片"
                description=""
                rules={[
                  {
                    required: true,
                    message: '请选择图片'
                  }
                ]}
                fieldProps={{
                  maxCount: 10,
                  accept: '.png,.jpg,.jpeg',
                  customRequest: () => {},
                  onRemove: () => {
                    setFileList([])
                  },
                  onChange: ({ fileList }) => {
                    setFileList(fileList)
                  },
                  iconRender: () => <FileImageOutlined />,
                  ...(colorForm.getFieldValue('id')
                    ? {
                        fileList: fileList
                      }
                    : {})
                }}
              />
            </ModalForm>

            <Image
              width={200}
              style={{ display: 'none' }}
              preview={{
                visible: previewInfo.visible,
                src: previewInfo.url,
                onVisibleChange: (value) => {
                  setPreviewInfo({
                    visible: value,
                    url: ''
                  })
                },
                toolbarRender: () => <span></span>
              }}
            />
          </Card>

          <Card title="规格管理" className={'card'} bordered={false}>
            <ProTable
              search={false}
              rowKey="id"
              headerTitle=""
              actionRef={actionRef}
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
                    <Spin spinning={loading}>
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
                perms.includes('add-unit') && (
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
                )
              ]}
              pagination={false}
            />
          </Card>
        </>
      </ProForm>
    </PageContainer>
  )
}

export default SeriesDetails
