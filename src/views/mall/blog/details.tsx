import { FC, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormItem,
  ProFormSwitch,
  ProFormText
} from '@ant-design/pro-components'
import { Button, Col, Descriptions, Form, Image, message, Modal, Row, Space, Upload } from 'antd'

import MyEditor from '@/components/MyEditor.tsx'
import axios from '@/utils/axios.ts'
import { checkFileSize, uploadFile } from '@/utils/fileUtils.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo
console.log(perms)

const BlogDetails: FC<Record<string, any>> = () => {
  const navigate = useNavigate()
  const { blogId } = useParams()

  const [fileList, setFileList] = useState<any>([])
  const [htmlContent, setHtmlContent] = useState<any>('')
  const [htmlText, setHtmlText] = useState<any>('')
  const [form] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{
        title: '博客详情',
        extra: [
          <Button
            key={'back'}
            type="primary"
            onClick={() => {
              navigate(`/mall/blog`)
            }}
          >
            返回
          </Button>
        ]
      }}
    >
      <Row>
        <Col span={24}>
          <ProForm
            form={form}
            layout={'horizontal'}
            request={async () => {
              if (blogId) {
                const res: any = await axios.get(`/blog/details/${blogId}`)
                const { isActive, name, content, text } = res

                const newFileList = [
                  {
                    id: res.id,
                    uid: res.uid,
                    name: res.fileName,
                    type: res.fileType,
                    status: 'done',
                    url: res.url
                  }
                ]
                form.setFieldsValue({
                  ...res,
                  fileInfo: { fileList: newFileList }
                })
                setHtmlContent(content)
                setHtmlText(text)
                setFileList(newFileList)

                return {
                  isActive,
                  name,
                  content
                }
              }
              return {
                isActive: true,
                content: ''
              }
            }}
            onFinish={async (data) => {
              console.log(data)
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

              await axios.post(`/blog/${blogId ? 'update' : 'create'}`, {
                id: blogId || undefined,
                ...other,
                text: htmlText,
                objectKey,
                fileName: name,
                uid,
                fileType: type
              })
              message.success(`博客${blogId ? '编辑' : '新建'}成功`)
            }}
            submitter={
              perms.includes('edit-perm')
                ? {
                    render: (props: any, _dom: any) => {
                      return (
                        <FooterToolbar
                          extra={
                            <Space size={'middle'}>
                              <Button
                                type="primary"
                                danger
                                onClick={() => {
                                  confirm({
                                    title: '确认操作',
                                    content: '确认删除该博客吗?',
                                    onOk: async () => {
                                      await axios.get(`/blog/delete/${blogId}`)
                                      message.success('商品删除成功')
                                      navigate('/product/list')
                                    }
                                  })
                                }}
                              >
                                删除
                              </Button>
                            </Space>
                          }
                        >
                          <Button
                            type="primary"
                            onClick={async () => {
                              props.form?.submit?.()
                            }}
                          >
                            保存
                          </Button>
                        </FooterToolbar>
                      )
                    }
                  }
                : false
            }
          >
            <ProFormText
              width={500}
              name="name"
              label="标题"
              rules={[
                {
                  required: true,
                  message: '请输入标题'
                }
              ]}
            />
            <ProFormItem
              name="fileInfo"
              label="头图"
              rules={[
                {
                  required: true,
                  message: '请选择图片'
                },
                () => ({
                  validator(_, value) {
                    if (value && !value.fileList.length) {
                      return Promise.reject(new Error('请选择图片'))
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <Descriptions title="">
                <Descriptions.Item label="素材限制" contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                  图片宽高比例为16:9。图片宽高均大于1200px，大小10M以内
                </Descriptions.Item>
              </Descriptions>
              <Upload
                accept={'.png,.jpg,.jpeg'}
                listType="picture-card"
                fileList={fileList}
                maxCount={1}
                onChange={async ({ file, fileList: newFileList }) => {
                  if (newFileList.length && !checkFileSize(file)) {
                    return
                  }
                  form.setFieldValue('fileInfo', { fileList: [...newFileList] })
                  setFileList(newFileList)
                  await form.validateFields()
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
            <ProFormSwitch
              name="isActive"
              label="状态"
              rules={[
                {
                  required: true,
                  message: '请选择图片'
                }
              ]}
            />
            <ProFormText
              name="content"
              label="正文"
              rules={[
                {
                  required: true,
                  message: '请编辑正文'
                }
              ]}
            >
              <MyEditor
                content={htmlContent}
                onUpdate={(html, text) => {
                  const oldContent = form.getFieldValue('content')
                  form.setFieldValue('content', html)
                  setHtmlText(text)
                  if (oldContent !== html) {
                    form.validateFields(['content'])
                  }
                }}
              />
            </ProFormText>
          </ProForm>

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
        </Col>
      </Row>
    </PageContainer>
  )
}

export default BlogDetails
