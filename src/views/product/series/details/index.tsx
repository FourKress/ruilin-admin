import { FC, useRef, useState } from 'react'
import { FileImageOutlined, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  FooterToolbar,
  ModalForm,
  ProColumns,
  ProForm,
  ProFormDateRangePicker,
  ProFormItem,
  ProFormSelect,
  ProFormText,
  ProFormUploadDragger,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, Card, Col, Form, Image, message, Modal, Row } from 'antd'

import axios from '@/utils/axios.ts'
import { uploadFile } from '@/utils/fileUtils.ts'

import './style.scss'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const fieldLabels = {
  name: '仓库名',
  url: '仓库域名',
  owner: '仓库管理员',
  approver: '审批人',
  dateRange: '生效日期',
  type: '仓库类型',
  name2: '任务名',
  url2: '任务描述',
  owner2: '执行人',
  approver2: '责任人',
  dateRange2: '生效日期',
  type2: '任务类型'
}

const tableData = [
  {
    key: '1',
    workId: '00001',
    name: 'John Brown',
    department: 'New York No. 1 Lake Park'
  },
  {
    key: '2',
    workId: '00002',
    name: 'Jim Green',
    department: 'London No. 1 Lake Park'
  },
  {
    key: '3',
    workId: '00003',
    name: 'Joe Black',
    department: 'Sidney No. 1 Lake Park'
  }
]

const SeriesDetails: FC<Record<string, any>> = () => {
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
  const [form] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

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
                form.setFieldsValue({
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
    const id = form.getFieldValue('id')
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

  return (
    <ProForm
      className={'series-details'}
      layout="vertical"
      submitter={{
        render: (_props: any, dom: any) => {
          return <FooterToolbar>{dom}</FooterToolbar>
        }
      }}
      initialValues={{ members: tableData }}
      onFinish={onFinish}
    >
      <>
        <Card title="基础信息" className={'card'} bordered={false}>
          <Row gutter={16}>
            <Col lg={6} md={12} sm={24}>
              <ProFormText
                label={fieldLabels.name}
                name="name"
                rules={[{ required: true, message: '请输入仓库名称' }]}
                placeholder="请输入仓库名称"
              />
            </Col>
            <Col xl={{ span: 6, offset: 2 }} lg={{ span: 8 }} md={{ span: 12 }} sm={24}>
              <ProFormText
                label={fieldLabels.url}
                name="url"
                rules={[{ required: true, message: '请选择' }]}
                fieldProps={{
                  style: { width: '100%' },
                  addonBefore: 'http://',
                  addonAfter: '.com'
                }}
                placeholder="请输入"
              />
            </Col>
            <Col xl={{ span: 8, offset: 2 }} lg={{ span: 10 }} md={{ span: 24 }} sm={24}>
              <ProFormSelect
                label={fieldLabels.owner}
                name="owner"
                rules={[{ required: true, message: '请选择管理员' }]}
                options={[
                  {
                    label: '付晓晓',
                    value: 'xiao'
                  },
                  {
                    label: '周毛毛',
                    value: 'mao'
                  }
                ]}
                placeholder="请选择管理员"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col lg={6} md={12} sm={24}>
              <ProFormSelect
                label={fieldLabels.approver}
                name="approver"
                rules={[{ required: true, message: '请选择审批员' }]}
                options={[
                  {
                    label: '付晓晓',
                    value: 'xiao'
                  },
                  {
                    label: '周毛毛',
                    value: 'mao'
                  }
                ]}
                placeholder="请选择审批员"
              />
            </Col>
            <Col xl={{ span: 6, offset: 2 }} lg={{ span: 8 }} md={{ span: 12 }} sm={24}>
              <ProFormDateRangePicker
                label={fieldLabels.dateRange}
                name="dateRange"
                fieldProps={{
                  style: {
                    width: '100%'
                  }
                }}
                rules={[{ required: true, message: '请选择生效日期' }]}
              />
            </Col>
            <Col xl={{ span: 8, offset: 2 }} lg={{ span: 10 }} md={{ span: 24 }} sm={24}>
              <ProFormSelect
                label={fieldLabels.type}
                name="type"
                rules={[{ required: true, message: '请选择仓库类型' }]}
                options={[
                  {
                    label: '私密',
                    value: 'private'
                  },
                  {
                    label: '公开',
                    value: 'public'
                  }
                ]}
                placeholder="请选择仓库类型"
              />
            </Col>
          </Row>
        </Card>

        <Card title="颜色管理" className={'card'} bordered={false}>
          <ProFormItem name="colors">
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
                      form.setFieldsValue({
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
          </ProFormItem>

          <ModalForm<{
            name: string
            link: string
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
                ...(form.getFieldValue('id')
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
      </>
    </ProForm>
  )
}

export default SeriesDetails
