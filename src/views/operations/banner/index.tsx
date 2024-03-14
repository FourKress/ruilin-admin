import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import {
  DragSortTable,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormItem,
  ProFormText
} from '@ant-design/pro-components'
import { Badge, Button, Descriptions, Form, Image, message, Modal, Upload } from 'antd'

import axios from '@/utils/axios.ts'
import { checkFileSize, uploadFile } from '@/utils/fileUtils.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function Banner() {
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

  const [bannerList, setBannerList] = useState([])
  const [loading, setLoading] = React.useState<boolean>(false)

  const getBannerPage = () => {
    setLoading(true)
    axios.get('/banner/page').then((res: any) => {
      setBannerList(res)
      setLoading(false)
    })
  }

  useEffect(() => {
    getBannerPage()
  }, [])

  const handleDragSortEnd = async (
    _beforeIndex: number,
    _afterIndex: number,
    newDataSource: any
  ) => {
    setBannerList(newDataSource)
    setLoading(true)
    const ids = newDataSource.map((d: any) => d.id)
    axios
      .post(`/banner/batchSort`, {
        ids
      })
      .then(async () => {
        message.success('排序成功')
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
                const newFileList = [
                  {
                    id: record.id,
                    uid: record.uid,
                    name: record.fileName,
                    type: record.fileType,
                    status: 'done',
                    url: record.url
                  }
                ]
                form.setFieldsValue({
                  ...record,
                  fileInfo: { fileList: newFileList }
                })
                setFileList(newFileList)
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
                  onOk: async () => {
                    await handleActive(record)
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
                  onOk: async () => {
                    await handleDelete(record)
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
      fileInfo: {
        fileList: [file]
      },
      ...other
    } = data

    const { uid, type, name } = file
    const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`

    const isUploadFile = file.status !== 'done'

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
    getBannerPage()
    message.success(`轮播图${id ? '编辑' : '新建'}成功`)
  }

  const handleActive = async (data: any) => {
    await axios
      .post(`/banner/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        getBannerPage()
        message.success('轮播图状态修改成功')
      })
  }

  const handleDelete = async (data: any) => {
    await axios.get(`/banner/delete/${data.id}`).then(async () => {
      getBannerPage()
      message.success('删除轮播图成功')
    })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <DragSortTable
        dragSortKey="sort"
        onDragSortEnd={handleDragSortEnd}
        dataSource={bannerList}
        loading={loading}
        options={{
          reload: () => {
            getBannerPage()
          }
        }}
        search={false}
        rowKey="id"
        headerTitle="轮播图列表"
        columns={columns}
        toolBarRender={() => [
          perms.includes('add-banner') && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                form.resetFields()
                form.setFieldsValue({
                  name: '',
                  link: '',
                  desc: '',
                  fileInfo: [],
                  id: '',
                  url: ''
                })
                setFileList([])
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
        pagination={false}
      />

      <ModalForm<{
        name: string
        link: string
        desc: string
        fileInfo: any
      }>
        open={modalInfo.open}
        initialValues={{}}
        title={modalInfo.title}
        form={form}
        autoFocusFirstInput
        width={420}
        modalProps={{
          destroyOnClose: true,
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
        onValuesChange={(values) => {
          if (values.fileInfo && values.fileInfo.file?.status === 'removed') {
            form.setFieldValue('fileInfo', '')
          }
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
        <ProFormItem
          name="fileInfo"
          label="图片"
          rules={[
            {
              required: true,
              message: '请选择图片'
            }
          ]}
        >
          <Descriptions title="">
            <Descriptions.Item label="素材限制" contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              图片宽高比例为4:3。图片宽高均大于1200px，大小10M以内
            </Descriptions.Item>
          </Descriptions>
          <Upload
            accept={'.png,.jpg,.jpeg'}
            listType="picture-card"
            fileList={fileList}
            maxCount={1}
            onChange={({ file, fileList: newFileList }) => {
              if (newFileList.length && !checkFileSize(file)) {
                return
              }
              setFileList(newFileList)
            }}
            onRemove={() => {
              setFileList([])
            }}
            beforeUpload={() => false}
            onPreview={(file) => {
              const url = file.url || file.thumbUrl
              if (!url) return
              setPreviewInfo({
                visible: true,
                url
              })
            }}
          >
            {fileList.length >= 1 ? null : (
              <button style={{ border: 0, background: 'none' }} type="button">
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </button>
            )}
          </Upload>
        </ProFormItem>
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
