import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import {
  DragSortTable,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormItem,
  ProFormSwitch,
  ProFormTextArea
} from '@ant-design/pro-components'
import {
  Badge,
  Button,
  Descriptions,
  Form,
  Image,
  Input,
  message,
  Modal,
  Space,
  Upload
} from 'antd'

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
  const [pcFileList, setPcFileList] = useState<any>([])
  const [mobileFileList, setMobileFileList] = useState<any>([])
  const [bannerDetails, setBannerDetails] = useState<any>({})
  const [btnList, setBtnList] = useState<any>([])
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
      title: '主标题',
      dataIndex: 'name'
    },
    {
      title: '副标题',
      dataIndex: 'subtitle'
    },
    {
      title: '移动端图片',
      dataIndex: 'mobile_url',
      hideInSearch: true,
      render: (_: any, row: any) => {
        return row['mobile_url'] ? (
          <Image
            width={80}
            src={row['mobile_url']}
            preview={{
              toolbarRender: () => <span></span>
            }}
          />
        ) : (
          '-'
        )
      }
    },
    {
      title: 'PC端图片',
      dataIndex: 'pc_url',
      hideInSearch: true,
      render: (_: any, row: any) => {
        return row['pc_url'] ? (
          <Image
            width={80}
            src={row['pc_url']}
            preview={{
              toolbarRender: () => <span></span>
            }}
          />
        ) : (
          '-'
        )
      }
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      hideInSearch: true,
      valueType: 'dateTime'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '上架' : '下架'} />]
      }
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 100,
      render: (_, record: Record<string, any>) => {
        return [
          perms.includes('edit-banner') && (
            <a
              key="modify"
              onClick={() => {
                let mobileFileList: any[] = []
                let pcFileList: any[] = []
                let btnList: any[] = [
                  { name: '', link: '' },
                  { name: '', link: '' }
                ]
                if (record?.objectKeyMobile) {
                  mobileFileList = [
                    {
                      status: 'done',
                      url: record['mobile_url']
                    }
                  ]
                }
                if (record?.objectKeyPc) {
                  pcFileList = [
                    {
                      status: 'done',
                      url: record['pc_url']
                    }
                  ]
                }
                if (record?.btnList) {
                  btnList = record?.btnList
                }
                setBannerDetails(record)
                setBtnList(btnList)
                setMobileFileList(mobileFileList)
                setPcFileList(pcFileList)
                form.setFieldsValue({
                  ...record,
                  mobileFileInfo: { fileList: mobileFileList },
                  pcFileInfo: { fileList: pcFileList }
                })
                setModalInfo({
                  open: true,
                  title: '编辑轮播图'
                })
              }}
            >
              编辑
            </a>
          ),
          perms.includes('edit-banner') && (
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
              {record.isActive ? '下架' : '上架'}
            </a>
          ),

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

  const handleUploadFile = async (file: any, key: string) => {
    const isUploadFile = file.status !== 'done'
    if (isUploadFile) {
      const { uid, type } = file
      const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`
      await uploadFile(file.originFileObj, objectKey)
      return objectKey
    }

    return key
  }

  const handleUpdate = async (data: any) => {
    const id = form.getFieldValue('id')
    const { mobileFileInfo = {}, pcFileInfo = {}, ...other } = data
    let objectKeyMobile
    if (mobileFileInfo?.fileList && mobileFileInfo.fileList?.length) {
      const [file] = mobileFileInfo.fileList
      objectKeyMobile = await handleUploadFile(file, bannerDetails.objectKeyMobile)
    }
    let objectKeyPc
    if (pcFileInfo?.fileList && pcFileInfo.fileList?.length) {
      const [file] = pcFileInfo.fileList
      objectKeyPc = await handleUploadFile(file, bannerDetails.objectKeyPc)
    }

    await axios.post(`/banner/${id ? 'update' : 'create'}`, {
      id: id || undefined,
      ...other,
      objectKeyMobile,
      objectKeyPc,
      btnList: btnList
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
                  subtitle: '',
                  pcFileInfo: null,
                  mobileFileInfo: null,
                  id: '',
                  isActive: true
                })
                setBannerDetails({})
                setBtnList([
                  { name: '', link: '' },
                  { name: '', link: '' }
                ])
                setPcFileList([])
                setMobileFileList([])
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
        subtitle: string
        mobileFileInfo: any
        pcFileInfo: any
      }>
        open={modalInfo.open}
        initialValues={{}}
        title={modalInfo.title}
        form={form}
        autoFocusFirstInput
        width={480}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setModalInfo({ open: false })
          }
        }}
        onFinish={async (values) => {
          const { mobileFileInfo = {}, pcFileInfo = {} } = values

          if (!mobileFileInfo?.fileList?.length && !pcFileInfo?.fileList?.length) {
            message.error('PC端或移动端至少上传一张图片')
            return
          }

          await handleUpdate(values)
          setModalInfo({
            open: false
          })
          return true
        }}
      >
        <ProFormTextArea name="name" label="主标题" placeholder={'请输入主标题'} />
        <ProFormTextArea name="subtitle" label="副标题" placeholder={'请输入副标题'} />
        <ProFormItem name="mobileFileInfo" label="移动端图片">
          <Descriptions title="">
            <Descriptions.Item label="素材限制" contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              图片宽高比例为3:4。图片宽高均大于1200px，大小10M以内
            </Descriptions.Item>
          </Descriptions>
          <Upload
            accept={'.png,.jpg,.jpeg'}
            listType="picture-card"
            fileList={mobileFileList}
            maxCount={1}
            onChange={async ({ file, fileList: newFileList }) => {
              if (newFileList.length && !checkFileSize(file)) {
                return
              }
              form.setFieldValue('mobileFileInfo', { fileList: [...newFileList] })
              setMobileFileList(newFileList)
              await form.validateFields()
            }}
            onRemove={() => {
              setMobileFileList([])
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
            {mobileFileList.length >= 1 ? null : (
              <button style={{ border: 0, background: 'none' }} type="button">
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </button>
            )}
          </Upload>
        </ProFormItem>
        <ProFormItem name="pcFileInfo" label="PC端图片">
          <Descriptions title="">
            <Descriptions.Item label="素材限制" contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              图片宽高比例建议为1920:900。大小10M以内
            </Descriptions.Item>
          </Descriptions>
          <Upload
            accept={'.png,.jpg,.jpeg'}
            listType="picture-card"
            fileList={pcFileList}
            maxCount={1}
            onChange={async ({ file, fileList: newFileList }) => {
              if (newFileList.length && !checkFileSize(file)) {
                return
              }
              form.setFieldValue('pcFileInfo', { fileList: [...newFileList] })
              setPcFileList(newFileList)
              await form.validateFields()
            }}
            onRemove={() => {
              setPcFileList([])
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
            {pcFileList.length >= 1 ? null : (
              <button style={{ border: 0, background: 'none' }} type="button">
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </button>
            )}
          </Upload>
        </ProFormItem>

        <ProFormItem label="按钮设置">
          <Space direction={'vertical'} style={{ width: '100%' }}>
            {btnList.map((btn: any, index: number) => {
              return (
                <Space.Compact style={{ width: '100%' }} key={index}>
                  <Input
                    style={{ width: '50%' }}
                    value={btn.name}
                    onChange={(event) => {
                      setBtnList([
                        ...btnList.map((d: any, i: number) => {
                          if (i === index)
                            return {
                              ...d,
                              name: event.target.value
                            }
                          return {
                            ...d
                          }
                        })
                      ])
                    }}
                  />
                  <Input
                    value={btn.link}
                    onChange={(event) => {
                      setBtnList([
                        ...btnList.map((d: any, i: number) => {
                          if (i === index)
                            return {
                              ...d,
                              link: event.target.value
                            }
                          return {
                            ...d
                          }
                        })
                      ])
                    }}
                  />
                  <Button
                    type="primary"
                    danger
                    onClick={() => {
                      console.log(btnList)
                      setBtnList([
                        ...btnList.map((d: any, i: number) => {
                          if (i === index)
                            return {
                              name: '',
                              link: ''
                            }
                          return {
                            ...d
                          }
                        })
                      ])
                    }}
                  >
                    清除
                  </Button>
                </Space.Compact>
              )
            })}
          </Space>
        </ProFormItem>

        <ProFormSwitch name="isActive" label="状态" />
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
