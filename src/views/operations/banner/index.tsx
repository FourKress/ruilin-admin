import { useRef, useState } from 'react'
import { FileImageOutlined, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormText,
  ProFormUploadDragger,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, Form, Image, message, Modal } from 'antd'

import axios from '@/utils/axios.ts'
import { uploadFile } from '@/utils/fileUtils.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function Banner() {
  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑轮播图'
  })
  const [fileList, setFileList] = useState<any>([])
  const [form] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  const columns: ProColumns[] = [
    {
      title: '轮播图名',
      dataIndex: 'name'
    },
    {
      title: '跳转链接',
      dataIndex: 'link'
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
                  title: '编辑轮播图'
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
                  content: '确认更改轮播图状态吗?',
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
                  content: '确认删除轮播图吗?',
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

    await axios.post(`/banner/${id ? 'update' : 'create'}`, {
      id: id || undefined,
      ...other,
      objectKey,
      fileName: name,
      uid,
      fileType: type
    })

    message.success(`轮播图${id ? '编辑' : '新建'}成功`)
    actionRef.current?.reloadAndRest?.()
  }

  const handleActive = (data: any) => {
    axios
      .post(`/banner/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('轮播图状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleDelete = (data: any) => {
    axios.get(`/banner/delete/${data.id}`).then(async () => {
      message.success('删除轮播图成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        search={false}
        rowKey="id"
        headerTitle="轮播图列表"
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
                  title: '新建轮播图'
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
            '/banner/page',
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
          label="轮播图名称"
          placeholder={'请输入1-20位轮播图名称'}
          fieldProps={{
            maxLength: 20
          }}
          rules={[
            () => ({
              validator(_, value) {
                if (value && value.length > 10) {
                  return Promise.reject(new Error('请输入1-20位轮播图名称'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormText name="link" label="跳转链接" placeholder={'请输入跳转链接'} />
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
            maxCount: 1,
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
    </PageContainer>
  )
}

export default Banner
