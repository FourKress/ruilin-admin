import { FC, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormSwitch,
  ProFormText
} from '@ant-design/pro-components'
import { Button, Col, Form, message, Modal, Row, Space } from 'antd'

import MyEditor from '@/components/MyEditor.tsx'
import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const QuestionDetails: FC<Record<string, any>> = () => {
  const navigate = useNavigate()
  const { questionId } = useParams()

  const [loading, setLoading] = useState<boolean>(false)
  const [htmlContent, setHtmlContent] = useState<any>('')
  const [htmlText, setHtmlText] = useState<any>('')
  const [objectKeys, setObjectKeys] = useState<string[]>([])
  const [form] = Form.useForm()

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
                const { isActive, name, content, text, objectKeys } = res

                form.setFieldsValue({
                  ...res
                })
                setHtmlContent(content)
                setHtmlText(text)
                setObjectKeys(objectKeys)

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

              const res: any = await axios
                .post(`/question/${questionId ? 'update' : 'create'}`, {
                  id: questionId || undefined,
                  ...data,
                  text: htmlText,
                  objectKeys: objectKeys
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
            <ProFormText
              name="content"
              label="回答"
              rules={[
                {
                  required: true,
                  message: '请编辑回答'
                }
              ]}
            >
              <MyEditor
                content={htmlContent}
                onUpdate={(html, text, objectKeys) => {
                  const oldContent = form.getFieldValue('content')
                  form.setFieldValue('content', html)
                  setHtmlText(text)
                  setObjectKeys(objectKeys)
                  if (oldContent !== html) {
                    form.validateFields(['content'])
                  }
                }}
              />
            </ProFormText>
          </ProForm>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default QuestionDetails
