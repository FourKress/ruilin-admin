import { FC, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormItem,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components'
import { Button, Col, Form, Image, message, Modal, Row, Space, Upload } from 'antd'

import axios from '@/utils/axios.ts'
import { checkFileSize, uploadFile } from '@/utils/fileUtils.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const QuestionDetails: FC<Record<string, any>> = () => {
  const navigate = useNavigate()
  const { questionId } = useParams()

  const [fileList, setFileList] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [form] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{
        title: '问题详情',
        extra: [
          <Button
            key={'back'}
            type="primary"
            onClick={() => {
              navigate(`/mall/question`)
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
              if (questionId) {
                const res: any = await axios.get(`/question/details/${questionId}`)
                const { isActive, name, content } = res

                let newFileList: any[] = []
                if (res?.uid) {
                  newFileList = [
                    {
                      id: res.id,
                      uid: res.uid,
                      name: res.fileName,
                      type: res.fileType,
                      status: 'done',
                      url: res.url
                    }
                  ]

                  setFileList(newFileList)
                }

                form.setFieldsValue({
                  ...res,
                  fileInfo: { fileList: newFileList }
                })

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
              setLoading(true)
              const { fileInfo, ...other } = data

              let fileData = {}
              if (fileInfo && fileInfo.fileList?.length) {
                const file = fileList[0]
                const { uid, type, name } = file
                const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`

                const isUploadFile = file.status !== 'done'

                if (isUploadFile) {
                  await uploadFile(file.originFileObj, objectKey)
                }

                fileData = {
                  objectKey,
                  fileName: name,
                  uid,
                  fileType: type
                }
              }

              const res: any = await axios
                .post(`/question/${questionId ? 'update' : 'create'}`, {
                  id: questionId || undefined,
                  ...other,
                  ...fileData
                })
                .finally(() => {
                  setLoading(false)
                })

              if (!questionId) {
                navigate(`/mall/question/details/${res.id}`)
              }

              message.success(`问题${questionId ? '编辑' : '新建'}成功`)

              return true
            }}
            submitter={
              perms.includes('edit-question')
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
                                    content: '确认删除该问题吗?',
                                    onOk: async () => {
                                      await axios.get(`/question/delete/${questionId}`)
                                      message.success('问题删除成功')
                                      navigate('/mall/question')
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
                            loading={loading}
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
              label="问题"
              rules={[
                {
                  required: true,
                  message: '请输入问题'
                }
              ]}
            />
            <ProFormItem
              name="fileInfo"
              label="图片"
              labelCol={{
                span: 1
              }}
            >
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
                  message: ''
                }
              ]}
            />
            <ProFormTextArea
              name="content"
              label="回答"
              fieldProps={{
                autoSize: {
                  minRows: 4
                }
              }}
              rules={[
                {
                  required: true,
                  message: '请输入回答'
                }
              ]}
            ></ProFormTextArea>
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

export default QuestionDetails
